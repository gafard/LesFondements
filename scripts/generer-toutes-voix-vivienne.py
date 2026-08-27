#!/usr/bin/env python3
import asyncio
import os
import json
import re
import unicodedata
import edge_tts

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIVRET_PATH = os.path.join(RACINE, "src/data/livret.json")
VERSETS_PATH = os.path.join(RACINE, "src/data/versetsLivret.json")
DOSSIER_VIVIENNE = os.path.join(RACINE, "public/voix/vivienne")

VOIX_VIVIENNE = "fr-FR-VivienneMultilingualNeural"

LIVRES_LUS = {
    'Gn': 'Genèse', 'Ex': 'Exode', 'Lv': 'Lévitique', 'Nb': 'Nombres', 'Dt': 'Deutéronome',
    'Jos': 'Josué', 'Jg': 'Juges', 'Rt': 'Ruth', 'Esd': 'Esdras', 'Ne': 'Néhémie',
    'Est': 'Esther', 'Jb': 'Job', 'Ps': 'Psaume', 'Pr': 'Proverbes', 'Ec': 'Ecclésiaste',
    'Ct': 'Cantique des cantiques', 'Es': 'Ésaïe', 'Jr': 'Jérémie', 'Lm': 'Lamentations',
    'Ez': 'Ézéchiel', 'Dn': 'Daniel', 'Os': 'Osée', 'Jl': 'Joël', 'Am': 'Amos',
    'Ab': 'Abdias', 'Jon': 'Jonas', 'Mi': 'Michée', 'Na': 'Nahum', 'Ha': 'Habacuc',
    'So': 'Sophonie', 'Ag': 'Aggée', 'Za': 'Zacharie', 'Ml': 'Malachie',
    'Mt': 'Matthieu', 'Mc': 'Marc', 'Lc': 'Luc', 'Jn': 'Jean', 'Ac': 'Actes',
    'Rm': 'Romains', 'Ga': 'Galates', 'Ep': 'Éphésiens', 'Eph': 'Éphésiens', 'Ph': 'Philippiens',
    'Col': 'Colossiens', 'Tt': 'Tite', 'Phm': 'Philémon', 'He': 'Hébreux', 'Heb': 'Hébreux',
    'Jc': 'Jacques', 'Ap': 'Apocalypse',
    '1 Jn': 'première lettre de Jean', '2 Jn': 'deuxième lettre de Jean', '3 Jn': 'troisième lettre de Jean',
    '1 Co': 'première lettre aux Corinthiens', '2 Co': 'deuxième lettre aux Corinthiens',
    '1 Cor': 'première lettre aux Corinthiens', '2 Cor': 'deuxième lettre aux Corinthiens',
    '1 Pi': 'première lettre de Pierre', '2 Pi': 'deuxième lettre de Pierre',
    '1 P': 'première lettre de Pierre', '2 P': 'deuxième lettre de Pierre',
    '1 Th': 'première lettre aux Thessaloniciens', '2 Th': 'deuxième lettre aux Thessaloniciens',
    '1 Tm': 'première lettre à Timothée', '2 Tm': 'deuxième lettre à Timothée',
    '1 S': 'premier livre de Samuel', '2 S': 'deuxième livre de Samuel',
    '1 Sm': 'premier livre de Samuel', '2 Sm': 'deuxième livre de Samuel',
    '1 R': 'premier livre des Rois', '2 R': 'deuxième livre des Rois',
    '1 Ch': 'premier livre des Chroniques', '2 Ch': 'deuxième livre des Chroniques'
}

def ardoise(reference: str) -> str:
    """Normalise une référence biblique : '1 Jn 4:16' -> '1jn-4-16'"""
    ref_norm = unicodedata.normalize('NFD', reference)
    ref_clean = ''.join(c for c in ref_norm if unicodedata.category(c) != 'Mn')
    ref_clean = ref_clean.lower()
    ref_clean = re.sub(r'[^a-z0-9]+', '-', ref_clean)
    return ref_clean.strip('-')

def preparer_pour_la_voix(texte: str) -> str:
    if not texte:
        return ""
    t = texte
    t = t.replace("«", "").replace("»", "").replace('"', "")

    def repl_ref(m):
        num = m.group(1) or ""
        livre_abbr = m.group(2)
        chap = m.group(3)
        verset = m.group(4)
        verset_fin = m.group(5)

        cle = f"{num} {livre_abbr}".strip() if num else livre_abbr
        nom_livre = LIVRES_LUS.get(cle) or LIVRES_LUS.get(livre_abbr) or cle

        if verset_fin:
            versets_txt = f"versets {verset} à {verset_fin}"
        else:
            versets_txt = f"verset {verset}"

        if nom_livre == "Psaume":
            return f"Psaume {chap}, {versets_txt}"
        return f"{nom_livre}, chapitre {chap}, {versets_txt}"

    pattern = re.compile(r'\b(?:([123])\s*)?([A-Z][a-zé]{0,4})\s*(\d{1,3})\s*[:.]\s*(\d{1,3})(?:[a-z])?(?:\s*-\s*(\d{1,3})(?:[a-z])?)?\b')
    t = pattern.sub(repl_ref, t)

    def repl_chap_range(m):
        livre = m.group(1)
        c1 = m.group(2)
        c2 = m.group(3)
        return f"{livre}, chapitres {c1} à {c2}"
    t = re.sub(r'\b([A-Z][a-zà-ÿ]+)\s+(\d{1,3})\s*-\s*(\d{1,3})\b', repl_chap_range, t)

    livres_entiers = 'Jean|Romains|Éphésiens|Galates|Hébreux|Genèse|Exode|Matthieu|Luc|Marc|Actes|Proverbes|Colossiens|Philippiens'
    def repl_chap_single(m):
        livre = m.group(1)
        c = m.group(2)
        return f"{livre}, chapitre {c}"
    t = re.sub(rf'\b({livres_entiers})\s+(\d{{1,3}})\b(?!\s*[:.,]\s*\d)', repl_chap_single, t)

    # Remplacement doux des parenthèses par des virgules pour un rythme naturel
    t = re.sub(r'\s*\(\s*([^)]+)\s*\)\s*', r', \1, ', t)
    t = re.sub(r',\s*,', ',', t)
    t = re.sub(r'\s{2,}', ' ', t)
    return t.strip(' ,')

async def generer_une_piste(sem, piste_id: str, texte_brut: str, rate: str = "+0%", force: bool = True):
    async with sem:
        os.makedirs(DOSSIER_VIVIENNE, exist_ok=True)
        fichier_sortie = os.path.join(DOSSIER_VIVIENNE, f"{piste_id}.mp3")

        texte_parle = preparer_pour_la_voix(texte_brut)
        if len(texte_parle) < 2:
            return False

        if not force and os.path.exists(fichier_sortie) and os.path.getsize(fichier_sortie) > 1000:
            return False

        tentatives = 0
        while tentatives < 3:
            try:
                communicate = edge_tts.Communicate(texte_parle, voice=VOIX_VIVIENNE, rate=rate)
                await communicate.save(fichier_sortie)
                print(f"✅ [Vivienne] {piste_id} -> « {texte_parle[:50]}... »")
                return True
            except Exception as e:
                tentatives += 1
                await asyncio.sleep(1.5 * tentatives)
        print(f"❌ [Vivienne Échec] {piste_id}")
        return False

async def main():
    os.makedirs(DOSSIER_VIVIENNE, exist_ok=True)
    with open(LIVRET_PATH, "r", encoding="utf-8") as f:
        livret = json.load(f)

    pistes = []

    # 1. Versets bibliques à mémoriser
    if os.path.exists(VERSETS_PATH):
        with open(VERSETS_PATH, "r", encoding="utf-8") as fv:
            versets = json.load(fv)
            for ref, texte in versets.items():
                piste_id = f"v.{ardoise(ref)}"
                pistes.append((piste_id, f"{ref}. {texte}"))

    # 2. Les 20 fiches
    for fiche in livret.get("fiches", []):
        f_id = fiche["id"]
        # Seuil
        pistes.append((f"f{f_id}.seuil", f"Fiche {f_id}. {fiche['titre']}. {fiche.get('sousTitre', '')}."))

        # Sections et blocs
        for s_idx, sec in enumerate(fiche.get("sections", [])):
            if sec.get("titre"):
                pistes.append((f"f{f_id}.s{s_idx}", sec["titre"]))
            for b_idx, bloc in enumerate(sec.get("blocs", [])):
                if bloc.get("type") != "sous-titre" and bloc.get("texte"):
                    pistes.append((f"f{f_id}.s{s_idx}.b{b_idx}", bloc["texte"]))

        # Résumé
        for r_idx, r in enumerate(fiche.get("resume", [])):
            texte_resume = ". ".join([r.get("titre", "")] + r.get("points", []))
            pistes.append((f"f{f_id}.r{r_idx}", texte_resume))

        # Questions
        questions = []
        for r in fiche.get("resume", []):
            questions.extend(r.get("questions", []))
        questions.extend(fiche.get("questionsLibres", []))
        for q_idx, q in enumerate(questions):
            pistes.append((f"f{f_id}.q{q_idx}", q))

    print(f"📊 Total des pistes vocales Vivienne avec prononciation biblique : {len(pistes)}")

    # 8 workers concurrents
    sem = asyncio.Semaphore(8)
    tasks = [generer_une_piste(sem, pid, txt, force=True) for pid, txt in pistes]
    resultats = await asyncio.gather(*tasks)

    succes = sum(1 for r in resultats if r)
    print(f"\n🎉 Terminé avec succès ! {succes}/{len(pistes)} pistes vocales Vivienne générées avec diction biblique impeccable.")

if __name__ == "__main__":
    asyncio.run(main())
