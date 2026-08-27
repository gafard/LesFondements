#!/usr/bin/env python3
import asyncio
import os
import json
import edge_tts

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIVRET_PATH = os.path.join(RACINE, "src/data/livret.json")
DOSSIER_VIVIENNE = os.path.join(RACINE, "public/voix/vivienne")

VOIX_VIVIENNE = "fr-FR-VivienneMultilingualNeural"

def nettoyer_texte(texte: str) -> str:
    return texte.replace("«", "").replace("»", "").replace("\n", " ").strip()

async def generer_piste(piste_id: str, texte: str, rate: str = "+0%"):
    os.makedirs(DOSSIER_VIVIENNE, exist_ok=True)
    fichier_sortie = os.path.join(DOSSIER_VIVIENNE, f"{piste_id}.mp3")
    if os.path.exists(fichier_sortie) and os.path.getsize(fichier_sortie) > 1000:
        return
    texte_clean = nettoyer_texte(texte)
    if len(texte_clean) < 3:
        return
    print(f"🎙️ [Vivienne] {piste_id}...")
    communicate = edge_tts.Communicate(texte_clean, voice=VOIX_VIVIENNE, rate=rate)
    await communicate.save(fichier_sortie)

async def main():
    os.makedirs(DOSSIER_VIVIENNE, exist_ok=True)
    with open(LIVRET_PATH, "r", encoding="utf-8") as f:
        livret = json.load(f)

    # 1. Génération pour la Fiche 1
    for fiche in livret.get("fiches", []):
        if fiche["id"] != 1:
            continue
        f_id = fiche["id"]
        # Seuil
        await generer_piste(f"f{f_id}.seuil", f"Fiche {f_id}. {fiche['titre']}. {fiche.get('sousTitre', '')}.")

        # Sections et blocs
        for s_idx, sec in enumerate(fiche.get("sections", [])):
            if sec.get("titre"):
                await generer_piste(f"f{f_id}.s{s_idx}", sec["titre"])
            for b_idx, bloc in enumerate(sec.get("blocs", [])):
                if bloc.get("type") != "sous-titre" and bloc.get("texte"):
                    await generer_piste(f"f{f_id}.s{s_idx}.b{b_idx}", bloc["texte"])

        # Résumé
        for r_idx, r in enumerate(fiche.get("resume", [])):
            texte_resume = ". ".join([r.get("titre", "")] + r.get("points", []))
            await generer_piste(f"f{f_id}.r{r_idx}", texte_resume)

        # Questions
        questions = []
        for r in fiche.get("resume", []):
            questions.extend(r.get("questions", []))
        questions.extend(fiche.get("questionsLibres", []))
        for q_idx, q in enumerate(questions):
            await generer_piste(f"f{f_id}.q{q_idx}", q)

    print("✨ Pistes vocales de Vivienne prêtes dans public/voix/vivienne/ !")

if __name__ == "__main__":
    asyncio.run(main())
