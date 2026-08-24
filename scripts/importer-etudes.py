#!/usr/bin/env python3
"""
Convertit les bases d'étude SQLite en fichiers JSON statiques, chargés à la
demande par l'application.

Pourquoi ne pas garder SQLite ? L'application se déploie sur Cloudflare
Workers, où `better-sqlite3` (module natif Node) ne tourne pas. Des fragments
JSON servis comme fichiers statiques sont lisibles partout, gratuits à servir,
et surtout : le service worker peut les mettre en cache, donc l'étude
fonctionne hors-ligne une fois le passage consulté.

Sources (toutes issues d'ouvrages tombés dans le domaine public) :
  · strong.sqlite        Louis Segond 1910 annotée des numéros Strong,
                         + les lexiques hébreu (8 854) et grec (5 775)
  · treasury.sqlite      Treasury of Scripture Knowledge — références croisées
  · nave.sqlite          Bible thématique de Nave — 5 313 thèmes
  · matthew_henry.sqlite Commentaire de Matthew Henry, chapitre par chapitre

Usage :
    python3 scripts/importer-etudes.py <dossier-des-sqlite> <public/etudes>
    python3 scripts/importer-etudes.py … --sans nave,henry
"""

import json
import os
import re
import sqlite3
import sys

# ─────────────────────────────────────────────────────────────
# Les 66 livres, dans l'ordre des bases (1 = Genèse, 66 = Apocalypse)
# ─────────────────────────────────────────────────────────────

LIVRES = [
    ("gn", "Genèse"), ("ex", "Exode"), ("lv", "Lévitique"), ("nb", "Nombres"),
    ("dt", "Deutéronome"), ("jos", "Josué"), ("jg", "Juges"), ("rt", "Ruth"),
    ("1s", "1 Samuel"), ("2s", "2 Samuel"), ("1r", "1 Rois"), ("2r", "2 Rois"),
    ("1ch", "1 Chroniques"), ("2ch", "2 Chroniques"), ("esd", "Esdras"),
    ("ne", "Néhémie"), ("est", "Esther"), ("jb", "Job"), ("ps", "Psaumes"),
    ("pr", "Proverbes"), ("ec", "Ecclésiaste"), ("ct", "Cantique des cantiques"),
    ("es", "Ésaïe"), ("jr", "Jérémie"), ("lm", "Lamentations"), ("ez", "Ézéchiel"),
    ("dn", "Daniel"), ("os", "Osée"), ("jl", "Joël"), ("am", "Amos"),
    ("ab", "Abdias"), ("jon", "Jonas"), ("mi", "Michée"), ("na", "Nahum"),
    ("ha", "Habacuc"), ("so", "Sophonie"), ("ag", "Aggée"), ("za", "Zacharie"),
    ("ml", "Malachie"),
    ("mt", "Matthieu"), ("mc", "Marc"), ("lc", "Luc"), ("jn", "Jean"),
    ("ac", "Actes"), ("rm", "Romains"), ("1co", "1 Corinthiens"),
    ("2co", "2 Corinthiens"), ("ga", "Galates"), ("ep", "Éphésiens"),
    ("ph", "Philippiens"), ("col", "Colossiens"), ("1th", "1 Thessaloniciens"),
    ("2th", "2 Thessaloniciens"), ("1tm", "1 Timothée"), ("2tm", "2 Timothée"),
    ("tt", "Tite"), ("phm", "Philémon"), ("he", "Hébreux"), ("jc", "Jacques"),
    ("1p", "1 Pierre"), ("2p", "2 Pierre"), ("1jn", "1 Jean"), ("2jn", "2 Jean"),
    ("3jn", "3 Jean"), ("jud", "Jude"), ("ap", "Apocalypse"),
]

# ─────────────────────────────────────────────────────────────
# Découpage d'un verset annoté Strong
# ─────────────────────────────────────────────────────────────

# « Car 1063 Dieu 2316 a tant 3779 aimé 25 (5656) le monde 2889 … »
#   → un segment = du texte, son numéro Strong, et son code d'analyse.
SEGMENT = re.compile(
    r"(?P<texte>[^\d]*?)\s*(?P<strong>\d{1,5})\b(?:\s*\(\s*(?P<morpho>\d{4,5})\s*\))?"
)


def decouper_verset(brut: str, testament: str):
    """Retourne la liste des segments et le texte lisible seul."""
    segments = []
    position = 0

    for correspondance in SEGMENT.finditer(brut):
        texte = nettoyer(correspondance.group("texte"))
        strong = correspondance.group("strong")
        morpho = correspondance.group("morpho")

        # Codes d'analyse grammaticale : 5xxx en grec, 8xxx en hébreu. Un
        # numéro Strong ne dépasse pas 5624 (grec) / 8674 (hébreu), les
        # collisions sont donc levées par les parenthèses, pas par la valeur.
        entree = {"t": texte}
        if strong:
            entree["s"] = int(strong)
        if morpho:
            entree["m"] = int(morpho)
        segments.append(entree)
        position = correspondance.end()

    reste = nettoyer(brut[position:])
    if reste:
        segments.append({"t": reste})

    # Un verset sans aucune annotation : on garde le texte tel quel.
    if not segments:
        segments = [{"t": nettoyer(brut)}]

    lisible = re.sub(r"\s{2,}", " ", " ".join(s["t"] for s in segments)).strip()
    # Le découpage tombe parfois au milieu d'une élision (« qu ’il ») : on
    # recolle l'apostrophe et la ponctuation au mot qui les précède.
    lisible = re.sub(r"\s+([,;.:!?»…])", r"\1", lisible)
    lisible = re.sub(r"\s+([’\'])", r"\1", lisible)
    lisible = re.sub(r"([«])\s+", r"\1 ", lisible)
    return segments, lisible


def nettoyer(texte: str) -> str:
    texte = texte.replace("\xa0", " ")
    return re.sub(r"\s{2,}", " ", texte).strip()


# ─────────────────────────────────────────────────────────────

def ecrire(chemin, donnees):
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    with open(chemin, "w", encoding="utf-8") as fichier:
        json.dump(donnees, fichier, ensure_ascii=False, separators=(",", ":"))
    return os.path.getsize(chemin)


def importer_segond(source, sortie):
    """Le texte biblique, découpé livre par livre."""
    connexion = sqlite3.connect(f"file:{source}/strong.sqlite?mode=ro", uri=True)
    par_livre = {}

    for table, testament in (("LSGSAT2", "at"), ("LSGSNT2", "nt")):
        for numero, chapitre, verset, brut in connexion.execute(
            f"select Livre, Chapitre, Verset, Texte from {table} order by Livre, Chapitre, Verset"
        ):
            segments, lisible = decouper_verset(brut or "", testament)
            livre = par_livre.setdefault(numero, {})
            livre.setdefault(str(chapitre), []).append(
                {"v": verset, "t": lisible, "s": segments}
            )

    total = 0
    index = []
    for numero, chapitres in sorted(par_livre.items()):
        code, nom = LIVRES[numero - 1]
        poids = ecrire(
            f"{sortie}/segond/{code}.json",
            {"livre": code, "nom": nom, "numero": numero, "chapitres": chapitres},
        )
        total += poids
        index.append(
            {
                "code": code,
                "nom": nom,
                "numero": numero,
                "testament": "at" if numero <= 39 else "nt",
                "chapitres": len(chapitres),
                "versets": sum(len(v) for v in chapitres.values()),
            }
        )

    ecrire(f"{sortie}/livres.json", index)
    connexion.close()
    return total, sum(l["versets"] for l in index)


def importer_lexique(source, sortie):
    """Les lexiques hébreu et grec, par tranches de 500 numéros."""
    connexion = sqlite3.connect(f"file:{source}/strong.sqlite?mode=ro", uri=True)
    total = 0
    compte = {}

    for table, langue, colonne in (
        ("Hebreu", "hebreu", "Hebreu"),
        ("Grec", "grec", "Grec"),
    ):
        tranches = {}
        for code, mot, phonetique, original, origine, type_, lsg, definition in connexion.execute(
            f"select Code, Mot, Phonetique, {colonne}, Origine, Type, LSG, Definition from {table}"
        ):
            if not code:
                continue
            entree = {
                "mot": mot or "",
                "phonetique": (phonetique or "").strip("() "),
                "original": original or "",
                "origine": assainir(origine),
                "type": type_ or "",
                "lsg": lsg or "",
                "definition": assainir(definition),
            }
            tranches.setdefault(code // 500, {})[str(code)] = entree

        for tranche, entrees in sorted(tranches.items()):
            total += ecrire(f"{sortie}/lexique/{langue}/{tranche}.json", entrees)
        compte[langue] = sum(len(e) for e in tranches.values())

    connexion.close()
    return total, compte


LIENS = re.compile(r'<a\b[^>]*>(.*?)</a>', re.S | re.I)
IMAGES = re.compile(r"<img\b[^>]*>", re.I)
BALISES = re.compile(r"</?(?:p|br|ol|ul|li|b|i|em|strong|span|div|font|table|tr|td)\b[^>]*>", re.I)
TITRES = re.compile(r"<h[1-6]\b[^>]*>(.*?)</h[1-6]>", re.S | re.I)


def assainir(html):
    """
    Les définitions sont du HTML issu d'un site : on retire les liens vers
    des pages qui n'existent pas ici et les images décoratives, on conserve
    la structure de listes qui porte le sens (1) … 2) …).
    """
    if not html:
        return ""
    texte = IMAGES.sub("", html)
    texte = LIENS.sub(r"\1", texte)
    # Les intertitres du commentaire structurent la lecture : on les garde,
    # isolés sur leur ligne, plutôt que de les perdre avec la balise.
    texte = TITRES.sub(lambda m: f"\n\n{m.group(1).strip()}\n", texte)
    texte = texte.replace("<br />", "\n").replace("<br/>", "\n").replace("<br>", "\n")
    texte = re.sub(r"</li>", "\n", texte, flags=re.I)
    texte = BALISES.sub("", texte)
    texte = re.sub(r"&#x([0-9A-Fa-f]+);", lambda m: chr(int(m.group(1), 16)), texte)
    texte = (
        texte.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&nbsp;", " ")
        .replace("&apos;", "'")
        .replace("&quot;", '"')
    )
    texte = re.sub(r"[ \t]{2,}", " ", texte)
    return re.sub(r"\n{3,}", "\n\n", texte).strip()


REF_INTERNE = re.compile(r"^(\d+)-(\d+)-(\d+)$")


def cle_vers_reference(cle):
    """« 43-3-16 » → { livre: 'jn', chapitre: 3, verset: 16 }."""
    correspondance = REF_INTERNE.match(cle)
    if not correspondance:
        return None
    numero, chapitre, verset = (int(g) for g in correspondance.groups())
    if not 1 <= numero <= 66:
        return None
    return {"livre": LIVRES[numero - 1][0], "chapitre": chapitre, "verset": verset}


def reference_compacte(reference):
    """La même chose en une chaîne : « jn 3:16 ». Divise le poids par deux."""
    return f"{reference['livre']} {reference['chapitre']}:{reference['verset']}"


def importer_treasury(source, sortie):
    """Les références croisées, regroupées par livre."""
    connexion = sqlite3.connect(f"file:{source}/treasury.sqlite?mode=ro", uri=True)
    par_livre = {}
    entrees = 0

    for cle, brut in connexion.execute("select id, commentaires from COMMENTAIRES"):
        reference = cle_vers_reference(cle)
        if not reference:
            continue
        try:
            elements = json.loads(brut)
        except (TypeError, ValueError):
            continue

        # La liste mêle des intitulés (« that. ») et des références « 21-2-13 ».
        groupes = []
        courant = None
        for element in elements:
            lien = cle_vers_reference(str(element))
            if lien:
                if courant is None:
                    courant = {"titre": "", "refs": []}
                courant["refs"].append(reference_compacte(lien))
            else:
                if courant and courant["refs"]:
                    groupes.append(courant)
                intitule = str(element).strip(" .")
                # Quelques clés malformées (« 0-3-4 ») traînent dans la base :
                # ce sont des références cassées, pas des intitulés.
                if REF_INTERNE.match(intitule):
                    intitule = ""
                courant = {"titre": intitule, "refs": []}
        if courant and courant["refs"]:
            groupes.append(courant)

        if groupes:
            par_livre.setdefault(reference["livre"], {})[
                f"{reference['chapitre']}:{reference['verset']}"
            ] = groupes
            entrees += 1

    total = 0
    for livre, contenu in par_livre.items():
        total += ecrire(f"{sortie}/references/{livre}.json", contenu)
    connexion.close()
    return total, entrees


def importer_nave(source, sortie):
    """La bible thématique : thèmes par lettre, et thèmes par verset."""
    connexion = sqlite3.connect(f"file:{source}/nave.sqlite?mode=ro", uri=True)
    total = 0

    par_lettre = {}
    index = []
    for nom_min, lettre, nom, description in connexion.execute(
        "select name_lower, letter, name, description from TOPICS"
    ):
        par_lettre.setdefault(lettre or "?", {})[nom_min] = {
            "nom": nom,
            "description": assainir(description),
        }
        index.append({"cle": nom_min, "nom": nom, "lettre": lettre})

    for lettre, themes in sorted(par_lettre.items()):
        total += ecrire(f"{sortie}/themes/lettres/{lettre}.json", themes)
    total += ecrire(f"{sortie}/themes/index.json", index)

    par_livre = {}
    for cle, brut in connexion.execute("select id, ref from VERSES"):
        reference = cle_vers_reference(cle)
        if not reference:
            continue
        try:
            themes = json.loads(brut)
        except (TypeError, ValueError):
            continue
        if themes:
            par_livre.setdefault(reference["livre"], {})[
                f"{reference['chapitre']}:{reference['verset']}"
            ] = themes

    for livre, contenu in par_livre.items():
        total += ecrire(f"{sortie}/themes/versets/{livre}.json", contenu)

    connexion.close()
    return total, len(index)


def importer_henry(source, sortie):
    """Le commentaire de Matthew Henry, un fichier par livre."""
    connexion = sqlite3.connect(f"file:{source}/matthew_henry.sqlite?mode=ro", uri=True)
    par_livre = {}

    for cle, brut in connexion.execute("select id, commentaires from COMMENTAIRES"):
        correspondance = re.match(r"^(\d+)-(\d+)$", cle or "")
        if not correspondance:
            continue
        numero, chapitre = (int(g) for g in correspondance.groups())
        if not 1 <= numero <= 66:
            continue
        try:
            morceaux = json.loads(brut)
        except (TypeError, ValueError):
            continue
        textes = [
            assainir(morceaux[cle_morceau])
            for cle_morceau in sorted(morceaux, key=lambda k: int(k) if k.isdigit() else 0)
        ]
        par_livre.setdefault(LIVRES[numero - 1][0], {})[str(chapitre)] = [
            t for t in textes if t
        ]

    total = 0
    for livre, contenu in par_livre.items():
        total += ecrire(f"{sortie}/commentaire/{livre}.json", contenu)
    connexion.close()
    return total, sum(len(c) for c in par_livre.values())


def ko(octets):
    return f"{octets / 1024:.0f} Ko" if octets < 1024 * 1024 else f"{octets / 1048576:.1f} Mo"


def main():
    source, sortie = sys.argv[1], sys.argv[2]
    exclus = set()
    for argument in sys.argv[3:]:
        if argument.startswith("--sans"):
            valeur = argument.split("=", 1)[1] if "=" in argument else sys.argv[sys.argv.index(argument) + 1]
            exclus = {e.strip() for e in valeur.split(",")}

    etapes = [
        ("segond", "Segond 1910 + Strong", importer_segond),
        ("lexique", "Lexiques hébreu et grec", importer_lexique),
        ("treasury", "Références croisées", importer_treasury),
        ("nave", "Bible thématique", importer_nave),
        ("henry", "Commentaire Matthew Henry", importer_henry),
    ]

    total = 0
    for cle, libelle, fonction in etapes:
        if cle in exclus:
            print(f"·  {libelle} — ignoré")
            continue
        poids, compte = fonction(source, sortie)
        total += poids
        print(f"✓  {libelle:32s} {ko(poids):>9s}   ({compte})")

    print(f"\n   Total : {ko(total)} dans {sortie}")


if __name__ == "__main__":
    main()
