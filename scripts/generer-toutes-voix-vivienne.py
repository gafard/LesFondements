#!/usr/bin/env python3
import asyncio
import argparse
import os
import json
import re
import subprocess
import unicodedata
import edge_tts

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIVRET_PATH = os.path.join(RACINE, "src/data/livret.json")
VERSETS_PATH = os.path.join(RACINE, "src/data/versetsLivret.json")
DOSSIER_VIVIENNE = os.path.join(RACINE, "public/voix/vivienne")
PREPARATEUR = os.path.join(RACINE, "scripts/preparer-textes-voix.mjs")

VOIX_VIVIENNE = "fr-FR-VivienneMultilingualNeural"

def ardoise(reference: str) -> str:
    """Normalise une référence biblique : '1 Jn 4:16' -> '1jn-4-16'"""
    ref_norm = unicodedata.normalize('NFD', reference)
    ref_clean = ''.join(c for c in ref_norm if unicodedata.category(c) != 'Mn')
    ref_clean = ref_clean.lower()
    ref_clean = re.sub(r'[^a-z0-9]+', '-', ref_clean)
    return ref_clean.strip('-')

def preparer_pistes(pistes):
    """Délègue toute la diction au moteur JavaScript utilisé par l'application."""
    resultat = subprocess.run(
        ["node", PREPARATEUR],
        input=json.dumps(pistes, ensure_ascii=False),
        text=True,
        capture_output=True,
        check=True,
        cwd=RACINE,
    )
    return json.loads(resultat.stdout)

def est_lisible(texte: str) -> bool:
    return isinstance(texte, str) and len("".join(c for c in texte if c.isalnum())) >= 2

async def generer_une_piste(sem, piste_id: str, texte_parle: str, rate: str = "+0%", force: bool = False):
    async with sem:
        os.makedirs(DOSSIER_VIVIENNE, exist_ok=True)
        fichier_sortie = os.path.join(DOSSIER_VIVIENNE, f"{piste_id}.mp3")

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
    parseur = argparse.ArgumentParser(description="Génère les pistes Vivienne vérifiées.")
    parseur.add_argument("--force", action="store_true", help="remplace les fichiers existants")
    parseur.add_argument(
        "--pistes",
        default="",
        help="liste d'identifiants séparés par des virgules (toutes si omis)",
    )
    arguments = parseur.parse_args()
    filtre = {piste for piste in arguments.pistes.split(",") if piste}

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
                if bloc.get("type") != "sous-titre" and est_lisible(bloc.get("texte", "")):
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

    pistes = preparer_pistes(pistes)
    if filtre:
        pistes = [piste for piste in pistes if piste[0] in filtre]

    print(f"📊 Pistes Vivienne à traiter avec la diction canonique : {len(pistes)}")

    # 8 workers concurrents
    sem = asyncio.Semaphore(8)
    tasks = [generer_une_piste(sem, pid, txt, force=arguments.force) for pid, txt in pistes]
    resultats = await asyncio.gather(*tasks)

    succes = sum(1 for r in resultats if r)
    print(f"\n🎉 Terminé : {succes}/{len(pistes)} piste(s) régénérée(s).")

if __name__ == "__main__":
    asyncio.run(main())
