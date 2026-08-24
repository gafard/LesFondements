#!/usr/bin/env python3
"""
Transforme la sortie du parseur en données prêtes pour l'application :
  · src/data/livret.json    — le contenu intégral du livret
  · src/data/fichesMeta.ts  — les métadonnées légères (titres, icônes, pages)

Les métadonnées (sous-titre, icône) ne figurent pas dans le livret : elles
viennent du travail éditorial de l'application et sont conservées ici.
"""

import json
import re
import sys

META = {
    1: ("Découvrir la nature et le caractère de Dieu", "Crown", 5),
    2: ("Comprendre notre séparation et le plan de Dieu", "Cross", 13),
    3: ("La nouvelle naissance et la foi", "Heart", 19),
    4: ("Vivre libéré du légalisme", "Wind", 27),
    5: ("Comprendre qui je suis devenu en Christ", "User", 37),
    6: ("Passer de l’ancienne manière de vivre à une vie conduite par l’Esprit", "RefreshCcw", 47),
    7: ("Reconnaître les blessures, les mensonges et les forteresses intérieures", "ShieldCheck", 53),
    8: ("Fermer les portes du passé et affermir une liberté durable", "KeyRound", 61),
    9: ("Vivre une relation intérieure avec Dieu", "FlameKindling", 69),
    10: ("Recevoir la force de témoigner et de servir", "Zap", 75),
    11: ("Servir avec les capacités de Dieu et le caractère de Christ", "Gift", 81),
    12: ("Suivre le Seigneur avec amour, humilité et persévérance", "Footprints", 89),
    13: ("Apprendre, obéir et former d’autres disciples", "Waypoints", 97),
    14: ("Participer à ce que Dieu accomplit dans le monde", "Globe2", 103),
    15: ("Vivre la famille spirituelle, l’unité et une autorité saine", "UsersRound", 111),
    16: ("Cultiver une conversation vivante et persévérante avec Dieu", "MessageCircleHeart", 119),
    17: ("Recevoir, comprendre et mettre en pratique la Parole", "BookMarked", 129),
    18: ("Lire toute la Bible à la lumière de l’œuvre de Jésus", "ScrollText", 137),
    19: ("Comprendre les racines, la continuité et l’humilité", "Landmark", 145),
    20: ("Vivre aujourd’hui dans l’espérance de la résurrection", "Sunrise", 151),
}

TITRES_APP = {
    7: "Vivre libre — première partie",
    8: "Vivre libre — deuxième partie",
    11: "Le Saint-Esprit : ministère, dons et fruit",
    12: "Disciple de Jésus — première partie",
    13: "Disciple de Jésus — deuxième partie",
    14: "Le Royaume, l’Église et la mission",
}

# Chapitres du parcours (regroupement éditorial des 20 fiches).
CHAPITRES = [
    (1, "Recevoir le Fondement", [1, 2, 3, 4, 5]),
    (2, "Être transformé", [6, 7, 8, 9, 10]),
    (3, "Devenir disciple", [11, 12, 13, 14, 15]),
    (4, "Demeurer et transmettre", [16, 17, 18, 19, 20]),
]


# Le livret utilise le tiret aussi comme incise (« —notre fardeau… tout— »).
# Ces cas ne doivent pas être recollés : on les rétablit explicitement.
INCISES = {
    "notre avenir, tout- sur le Seigneur": "notre avenir, tout — sur le Seigneur",
}


def nettoyer_texte(texte: str) -> str:
    """
    Recolle les mots coupés par un retour à la ligne (« Saint- Esprit »).
    On ne recolle que si le caractère avant le tiret est une lettre minuscule :
    cela épargne les plages de versets (« Mt 22:36- 40 ») et les listes
    numérotées (« 1- Qu'est-ce que… »).
    """
    for faux, vrai in INCISES.items():
        texte = texte.replace(faux, vrai)
    texte = re.sub(r"([a-zà-ÿœæ])- ([a-zA-ZÀ-ÿŒÆ])", r"\1-\2", texte)
    # Références bibliques : « Jn 17 :3 » → « Jn 17:3 ».
    texte = re.sub(r"(\d)\s+:(\d)", r"\1:\2", texte)
    # Tirets d'inversion malmenés par l'extraction : « y a –t-il ».
    texte = re.sub(r"\s*[–—]\s*t-(il|elle|on|ils|elles)\b", r"-t-\1", texte)
    return re.sub(r"[ \t]{2,}", " ", texte).strip()


def nettoyer_blocs(blocs):
    sortie = []
    for bloc in blocs:
        texte = bloc["texte"].strip()
        if not texte:
            continue
        sortie.append({"type": bloc["type"], "texte": nettoyer_texte(texte)})
    return sortie


def main():
    source, dossier = sys.argv[1], sys.argv[2]
    data = json.load(open(source, encoding="utf-8"))

    fiches = []
    for fiche in data["fiches"]:
        fid = fiche["id"]
        sous_titre, icone, page = META[fid]
        sections = [
            {"titre": s["titre"], "blocs": nettoyer_blocs(s["blocs"])}
            for s in fiche["sections"]
            if s["titre"] or s["blocs"]
        ]
        fiches.append(
            {
                "id": fid,
                "titre": TITRES_APP.get(fid, fiche["titre"]),
                "titreLivret": fiche["titre"],
                "sousTitre": sous_titre,
                "icone": icone,
                "page": page,
                "sections": sections,
                "resume": [
                    {
                        "titre": nettoyer_texte(r["titre"]),
                        "points": [nettoyer_texte(p) for p in r["points"]],
                        "versets": [v.strip() for v in r["versets"]],
                        "lectures": [nettoyer_texte(l) for l in r["lectures"]],
                        "questions": [nettoyer_texte(q) for q in r["questions"]],
                    }
                    for r in fiche["resume"]
                ],
                "questionsLibres": [nettoyer_texte(q) for q in fiche["questionsLibres"]],
                "notes": [
                    {"num": n["num"], "texte": nettoyer_texte(n["texte"])} for n in fiche["notes"]
                ],
                "annexes": [
                    {"titre": a["titre"], "blocs": nettoyer_blocs(a["blocs"])}
                    for a in fiche["annexes"]
                ],
            }
        )

    sortie = {
        "presentation": [
            {"titre": s["titre"], "blocs": nettoyer_blocs(s["blocs"])}
            for s in data["presentation"]
        ],
        "fiches": fiches,
        "annexeTransversale": {
            "titre": data["annexesTransversales"]["titre"],
            "sections": [
                {"titre": s["titre"], "blocs": nettoyer_blocs(s["blocs"])}
                for s in data["annexesTransversales"]["sections"]
            ],
        },
        "index": data["index"],
        "bibliographie": data["bibliographie"],
    }

    chemin_json = f"{dossier}/livret.json"
    json.dump(sortie, open(chemin_json, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    # ── Métadonnées légères, chargées par toutes les pages ──
    lignes = [
        "// Généré par scripts/build-livret-data.py — ne pas modifier à la main.",
        "// Métadonnées des 20 fiches : assez pour dessiner le sentier sans",
        "// charger le contenu intégral du livret.",
        "",
        "export interface FicheMeta {",
        "  id: number;",
        "  titre: string;",
        "  sousTitre: string;",
        "  icone: string;",
        "  /** Page d'ouverture dans le livret imprimé. */",
        "  page: number;",
        "  chapitre: number;",
        "  nbQuestions: number;",
        "  nbVersets: number;",
        "}",
        "",
        "export const FICHES_META: FicheMeta[] = [",
    ]
    chapitre_de = {fid: num for num, _, ids in CHAPITRES for fid in ids}
    for fiche in fiches:
        nb_q = sum(len(r["questions"]) for r in fiche["resume"]) + len(fiche["questionsLibres"])
        nb_v = sum(len(r["versets"]) for r in fiche["resume"])
        lignes.append("  {")
        lignes.append(f"    id: {fiche['id']},")
        lignes.append(f"    titre: {json.dumps(fiche['titre'], ensure_ascii=False)},")
        lignes.append(f"    sousTitre: {json.dumps(fiche['sousTitre'], ensure_ascii=False)},")
        lignes.append(f"    icone: {json.dumps(fiche['icone'])},")
        lignes.append(f"    page: {fiche['page']},")
        lignes.append(f"    chapitre: {chapitre_de[fiche['id']]},")
        lignes.append(f"    nbQuestions: {nb_q},")
        lignes.append(f"    nbVersets: {nb_v},")
        lignes.append("  },")
    lignes.append("];")
    lignes.append("")
    lignes.append("export interface ChapitreMeta {")
    lignes.append("  numero: number;")
    lignes.append("  roman: string;")
    lignes.append("  titre: string;")
    lignes.append("  fiches: number[];")
    lignes.append("}")
    lignes.append("")
    lignes.append("export const CHAPITRES: ChapitreMeta[] = [")
    romains = {1: "I", 2: "II", 3: "III", 4: "IV"}
    for numero, titre, ids in CHAPITRES:
        lignes.append(
            f"  {{ numero: {numero}, roman: '{romains[numero]}', "
            f"titre: {json.dumps(titre, ensure_ascii=False)}, fiches: {ids} }},"
        )
    lignes.append("];")
    lignes.append("")

    open(f"{dossier}/fichesMeta.ts", "w", encoding="utf-8").write("\n".join(lignes))

    total_blocs = sum(len(s["blocs"]) for f in fiches for s in f["sections"])
    print(
        f"✓ livret.json ({len(open(chemin_json, encoding='utf-8').read()) // 1024} Ko) · "
        f"{total_blocs} blocs de contenu · fichesMeta.ts"
    )


if __name__ == "__main__":
    main()
