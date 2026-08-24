#!/usr/bin/env python3
"""
Convertit le livret « Le parcours des fondements » (PDF → texte via pdftotext
-layout) en données structurées pour l'application.

Le livret suit une mise en page très régulière, qui sert de grammaire :
  «     • Titre »          → titre de section de l'exposé
  «     •   Titre »        → titre de section du « Résumé et Partage »
  indentation 8-10         → citation biblique
  indentation > 10         → encadré (phrase mise en valeur, centrée)
  « ! »                    → verset à recopier et méditer
  « & »                    → passage à lire
  « >> »                   → question de partage
  ligne de tirets          → début des notes de bas de page

Usage : python3 scripts/parse-livret.py <livret.txt> <sortie.json>
"""

import json
import re
import sys
import unicodedata

FICHE_TITRES = [
    "Connaître Dieu",
    "Le péché, le salut",
    "Devenir enfant de Dieu",
    "La Grâce",
    "Mon identité en Christ",
    "Un comportement nouveau",
    "Vivre libre 1ère partie",
    "Vivre libre 2ème partie",
    "Le Saint-Esprit : sa demeure en nous",
    "Le Saint-Esprit : un revêtement de puissance",
    "Le Saint-Esprit : le ministère, les dons, le fruit",
    "Disciple de Jésus 1ère partie",
    "Disciple de Jésus 2ème partie",
    "Le Royaume, l’Église, la mission",
    "Une communauté relationnelle",
    "La prière",
    "La Bible",
    "L’ancienne et la nouvelle Alliances",
    "Israël et l’Église",
    "Les fins dernières",
]

RE_PAGE_NUM = re.compile(r"^\s*\d{1,3}\s*$")
RE_FOOTNOTE_SEP = re.compile(r"^-{10,}\s*$")
RE_FOOTNOTE = re.compile(r"^\s*(\d+)\.\s+(.*)$")
RE_SECTION = re.compile(r"^\s{2,8}•\s+(.*\S)\s*$")
RE_ANNEXE = re.compile(r"^\s*Annexe\s*\d*\s*[:.]?\s*(.*)$", re.IGNORECASE)


def strip_accents(value: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", value) if unicodedata.category(c) != "Mn"
    )


def normalise(value: str) -> str:
    value = value.replace("\u2019", "'").replace("\u02bc", "'")
    return re.sub(r"\s+", " ", strip_accents(value).lower()).strip()


def indent_of(line: str) -> int:
    return len(line) - len(line.lstrip())


def load_pages(path: str):
    raw = open(path, encoding="utf-8").read()
    return raw.split("\f")


def clean_page(page: str):
    """Retire les numéros de page et les lignes vides de bord."""
    lines = page.split("\n")
    kept = [line.rstrip() for line in lines if not RE_PAGE_NUM.match(line)]
    while kept and not kept[0].strip():
        kept.pop(0)
    while kept and not kept[-1].strip():
        kept.pop()
    return kept


def split_footnotes(lines):
    """Sépare le corps de la page de ses notes de bas de page."""
    for index, line in enumerate(lines):
        if RE_FOOTNOTE_SEP.match(line):
            notes = []
            for note_line in lines[index + 1 :]:
                match = RE_FOOTNOTE.match(note_line)
                if match:
                    notes.append({"num": int(match.group(1)), "texte": match.group(2).strip()})
                elif notes and note_line.strip():
                    notes[-1]["texte"] += " " + note_line.strip()
            return lines[:index], notes
    return lines, []


# ─────────────────────────────────────────────────────────────
# Découpage du livret
# ─────────────────────────────────────────────────────────────

def find_fiche_starts(pages):
    """Repère la page d'ouverture de chaque fiche à partir de son titre."""
    starts = {}
    for index, page in enumerate(pages):
        lines = clean_page(page)
        for line in lines[:6]:
            texte = line.strip()
            if not texte:
                continue
            match = re.match(r"^(\d{1,2})\s*[-.]\s+(.+)$", texte)
            if not match:
                continue
            numero = int(match.group(1))
            if not 1 <= numero <= 20 or numero in starts:
                continue
            attendu = normalise(FICHE_TITRES[numero - 1])
            trouve = normalise(match.group(2))
            # Le titre courant peut être abrégé ou porter une variante typographique.
            if trouve[:10] == attendu[:10] or numero == 20:
                starts[numero] = index
            break
    return starts


# ─────────────────────────────────────────────────────────────
# Analyse de l'exposé
# ─────────────────────────────────────────────────────────────

def flush(buffer, blocs, kind, extra=None):
    texte = " ".join(part.strip() for part in buffer if part.strip()).strip()
    if not texte:
        return
    bloc = {"type": kind, "texte": texte}
    if extra:
        bloc.update(extra)
    blocs.append(bloc)


def parse_expose(lines):
    """Retourne une liste de sections, chacune avec ses blocs typés."""
    sections = []
    courante = {"titre": None, "blocs": []}
    buffer, mode = [], None

    def rendre():
        nonlocal buffer, mode
        if mode:
            flush(buffer, courante["blocs"], mode)
        buffer, mode = [], None

    for line in lines:
        if not line.strip():
            rendre()
            continue

        section = RE_SECTION.match(line)
        if section:
            rendre()
            if courante["titre"] is not None or courante["blocs"]:
                sections.append(courante)
            courante = {"titre": section.group(1), "blocs": []}
            continue

        indent = indent_of(line)
        texte = line.strip()

        if texte.startswith("- ") and indent >= 6:
            kind = "liste"
        elif indent >= 11:
            kind = "encadre"
        elif indent >= 6:
            kind = "citation"
        elif texte.startswith("- ") or texte.startswith("• "):
            kind = "liste"
        elif texte.startswith(">"):
            kind = "aparte"
        else:
            kind = "paragraphe"

        # Un titre en gras du livret : ligne courte, isolée, sans ponctuation
        # finale. La graisse est perdue par l'extraction : on la reconstitue.
        precedente_close = bool(buffer) and buffer[-1].rstrip().endswith(
            (".", "!", "?", ")", "»", ":")
        )
        if (
            kind == "paragraphe"
            and (mode is None or (mode == "paragraphe" and precedente_close))
            and len(texte) < 55
            and not texte.endswith((".", ":", ";", "!", "?", ",", ")"))
            and not texte[0].islower()
        ):
            rendre()
            titre = re.sub(r"(?<=[a-zA-Zé])\d{1,2}$", "", texte).strip()
            courante["blocs"].append({"type": "sous-titre", "texte": titre})
            continue

        if mode and mode != kind:
            rendre()
        mode = kind
        buffer.append(texte)

    rendre()
    if courante["titre"] is not None or courante["blocs"]:
        sections.append(courante)
    return sections


# ─────────────────────────────────────────────────────────────
# Analyse du « Résumé et Partage »
# ─────────────────────────────────────────────────────────────

def parse_resume(lines):
    sections = []
    courante = None
    questions_libres = []
    buffer = []

    ENTETES = ("versets (", "verset (", "versets a", "verset a")

    def vider_points():
        nonlocal buffer
        texte = " ".join(part.strip() for part in buffer if part.strip()).strip()
        if texte and courante is not None and not normalise(texte).startswith(ENTETES):
            courante["points"].append(texte)
        buffer = []

    for line in lines:
        texte = line.strip()

        if not texte:
            vider_points()
            continue

        section = RE_SECTION.match(line)
        if section:
            vider_points()
            if courante:
                sections.append(courante)
            courante = {
                "titre": section.group(1),
                "points": [],
                "versets": [],
                "lectures": [],
                "questions": [],
            }
            continue

        if texte.startswith("!"):
            vider_points()
            ref = texte.lstrip("! ").strip()
            if ref:
                (courante or {}).get("versets", questions_libres)
                if courante:
                    courante["versets"].append(ref)
            continue

        if texte.startswith("&"):
            vider_points()
            lecture = texte.lstrip("& ").strip()
            if courante:
                courante["lectures"].append(lecture)
            continue

        if texte.startswith(">>"):
            vider_points()
            question = texte.lstrip("> ").strip()
            if courante:
                courante["questions"].append(question)
            else:
                questions_libres.append(question)
            continue

        # Suite d'une question sur plusieurs lignes
        if (
            courante
            and courante["questions"]
            and indent_of(line) == 0
            and not texte[0].isupper()
        ):
            courante["questions"][-1] = (courante["questions"][-1] + " " + texte).replace(
                "- ", "-"
            )
            continue

        buffer.append(texte)

    vider_points()
    if courante:
        sections.append(courante)
    return sections, questions_libres


# ─────────────────────────────────────────────────────────────

def parse_fiche(pages, debut, fin):
    corps, notes = [], []
    for page in pages[debut:fin]:
        lignes = clean_page(page)
        contenu, page_notes = split_footnotes(lignes)
        corps.extend(contenu)
        corps.append("")
        notes.extend(page_notes)

    # Retire la ligne de titre de la fiche
    for index, line in enumerate(corps[:6]):
        if re.match(r"^\s*\d{1,2}\s*[-.]\s+\S", line):
            corps = corps[index + 1 :]
            break

    # Sépare exposé / résumé / annexes
    resume_index = next(
        (i for i, l in enumerate(corps) if normalise(l).startswith("resume et partage")),
        len(corps),
    )
    expose_lignes = corps[:resume_index]
    reste = corps[resume_index + 1 :]

    annexe_index = next(
        (i for i, l in enumerate(reste) if RE_ANNEXE.match(l) and l.strip().lower().startswith("annexe")),
        len(reste),
    )
    resume_lignes = reste[:annexe_index]
    annexe_lignes = reste[annexe_index:]

    sections = parse_expose(expose_lignes)
    resume, questions_libres = parse_resume(resume_lignes)
    annexes = parse_annexes(annexe_lignes)

    return {
        "sections": sections,
        "resume": resume,
        "questionsLibres": questions_libres,
        "notes": notes,
        "annexes": annexes,
    }


def parse_annexes(lines):
    annexes = []
    courante = None
    buffer = []

    def vider():
        nonlocal buffer
        texte = " ".join(p.strip() for p in buffer if p.strip()).strip()
        if texte and courante:
            courante["blocs"].append({"type": "paragraphe", "texte": texte})
        buffer = []

    for line in lines:
        match = RE_ANNEXE.match(line) if line.strip().lower().startswith("annexe") else None
        if match:
            vider()
            if courante:
                annexes.append(courante)
            courante = {"titre": match.group(1).strip() or "Annexe", "blocs": []}
            continue
        if not line.strip():
            vider()
            continue
        buffer.append(line.strip())

    vider()
    if courante:
        annexes.append(courante)
    return annexes


def premiere_ligne(page):
    lignes = clean_page(page)
    return lignes[0].strip() if lignes else ""


def parse_presentation(pages):
    """Les pages « Présentation du parcours » (mode d'emploi du livret)."""
    lignes = []
    for page in pages:
        entete = normalise(premiere_ligne(page))
        if entete.startswith("presentation du parcours"):
            contenu = clean_page(page)[1:]
            lignes.extend(contenu)
            lignes.append("")
        elif lignes and entete.startswith("•"):
            lignes.extend(clean_page(page))
            lignes.append("")
    return parse_expose(lignes)


def parse_index(page):
    """L'index thématique : « Thème : p. 12 ; p. 45 »."""
    entrees = []
    for line in clean_page(page)[1:]:
        texte = line.strip()
        if not texte or ":" not in texte:
            continue
        theme, pages_txt = texte.split(":", 1)
        numeros = [int(n) for n in re.findall(r"\d+", pages_txt)]
        if not numeros:
            continue
        entrees.append(
            {"theme": theme.strip(), "pages": numeros, "reference": pages_txt.strip()}
        )
    return entrees


def parse_bibliographie(page):
    """Les ouvrages cités, avec les fiches auxquelles ils se rattachent."""
    lignes = clean_page(page)[1:]
    entrees, buffer = [], []

    def vider():
        nonlocal buffer
        texte = " ".join(b.strip() for b in buffer if b.strip()).strip()
        buffer = []
        bas = normalise(texte)
        if not texte or bas.startswith(("extraits", "notes", "version :", "autres auteurs")):
            return
        # Les remerciements et mentions de fin ne sont pas des références.
        if bas.startswith(("- divers", "mais aussi")):
            return
        # « Auteur. Titre (fiches 1, 2). » — l'initiale isolée d'un prénom
        # (« Kenneth E. Hagin ») ne doit pas être prise pour la fin du nom,
        # et la virgule d'une liste de fiches ne doit pas couper le titre.
        match = re.match(r"^([A-ZÀ-Ý][^.]{2,60}?)\.\s+(?=[A-ZÀ-Ý«\d])(.+)$", texte)
        if match and re.search(r"\b[A-Z]$", match.group(1)):
            match = re.match(
                r"^([A-ZÀ-Ý][^.]{2,60}?\s+[A-Z]\.\s*\S+)\.\s+(.+)$", texte
            )
        if not match:
            # Certaines références séparent l'auteur du titre par une virgule.
            virgule = re.match(r"^([A-ZÀ-Ý][^.(,]{2,60}),\s+(?=[A-ZÀ-Ý«\d])(.+)$", texte)
            if virgule and "(" not in virgule.group(1):
                match = virgule
        auteur = match.group(1).strip() if match else None
        reste = match.group(2).strip() if match else texte
        fiches = sorted({int(n) for n in re.findall(r"fiches?\s+([\d,\s et]+)", reste)
                         for n in re.findall(r"\d+", n)})
        entrees.append({"auteur": auteur, "ouvrages": reste, "fiches": fiches})

    for line in lignes:
        texte = line.strip()
        if not texte:
            vider()
            continue
        # Une nouvelle référence commence par un nom propre suivi d'un point.
        if buffer and re.match(r"^[A-ZÉÈÀÂÎÔÛÇ][a-zéèêàâîôûç'’\-]+ ", texte) and "." in texte:
            vider()
        buffer.append(texte)
    vider()
    return entrees


def main():
    source, sortie = sys.argv[1], sys.argv[2]
    pages = load_pages(source)
    starts = find_fiche_starts(pages)

    # Où s'arrête le corps des fiches : à la première annexe transversale.
    fin_fiches = next(
        (
            i
            for i, page in enumerate(pages)
            if normalise(premiere_ligne(page)).startswith("annexe (fiches")
        ),
        len(pages),
    )
    index_page = next(
        (i for i, page in enumerate(pages) if normalise(premiere_ligne(page)) == "index"),
        None,
    )
    biblio_page = next(
        (
            i
            for i, page in enumerate(pages)
            if normalise(premiere_ligne(page)).startswith("notes bibliographiques")
        ),
        None,
    )

    if len(starts) != 20:
        manquants = [n for n in range(1, 21) if n not in starts]
        print(f"⚠ fiches non repérées : {manquants}", file=sys.stderr)

    ordre = sorted(starts.items())
    fiches = []
    for position, (numero, debut) in enumerate(ordre):
        fin = ordre[position + 1][1] if position + 1 < len(ordre) else fin_fiches
        fin = min(fin, fin_fiches)
        data = parse_fiche(pages, debut, fin)
        data["id"] = numero
        data["titre"] = FICHE_TITRES[numero - 1]
        fiches.append(data)

    fin_annexes = min(x for x in [index_page, biblio_page, len(pages)] if x is not None)
    lignes_annexes = []
    for page in pages[fin_fiches:fin_annexes]:
        lignes_annexes.extend(clean_page(page))
        lignes_annexes.append("")

    donnees = {
        "presentation": parse_presentation(pages[:4]),
        "fiches": fiches,
        "annexesTransversales": parse_annexe_transversale(lignes_annexes),
        "index": parse_index(pages[index_page]) if index_page is not None else [],
        "bibliographie": parse_bibliographie(pages[biblio_page]) if biblio_page is not None else [],
    }

    json.dump(donnees, open(sortie, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(
        f"✓ {len(fiches)} fiches · {len(donnees['index'])} entrées d'index · "
        f"{len(donnees['bibliographie'])} références → {sortie}"
    )


def parse_annexe_transversale(lignes):
    """L'annexe « Prendre soin les uns des autres » (fiches 7, 8, 15)."""
    titre = None
    for line in lignes:
        if normalise(line).startswith("annexe (fiches"):
            titre = line.strip()
            break
    corps = [l for l in lignes if not normalise(l).startswith("annexe (fiches")]
    return {"titre": titre or "Annexe", "sections": parse_expose(corps)}


if __name__ == "__main__":
    main()
