"""Découpe les deux instrumentaux fournis, sans modifier les originaux.
Usage : python3 scripts/preparer-ambiances.py CHEMIN_DU_DOSSIER
"""
import concurrent.futures
import json
import pathlib
import subprocess
import sys

racine = pathlib.Path(__file__).resolve().parents[1]
dossier = pathlib.Path(sys.argv[1])
sources = [
    ('DANS LE LIEU TRES SAINT*.mp3', 'Heaven Sounds', 'Dans le lieu très saint', [
        ('lieu-saint-presence', 'Présence', 120),
        ('lieu-saint-intimite', 'Intimité', 1320),
        ('lieu-saint-contemplation', 'Contemplation', 3000),
    ]),
    ('Selah-Prayer*.mp3', 'Josue Grace', 'Selah — Prayer Instrumental', [
        ('selah-recueillement', 'Selah · Recueillement', 90),
        ('selah-priere', 'Selah · Prière', 780),
        ('selah-repos', 'Selah · Repos', 1560),
    ]),
]
sortie = racine / 'public/audio/ambiances'
sortie.mkdir(parents=True, exist_ok=True)
taches = []
for motif, artiste, titre, extraits in sources:
    fichiers = list(dossier.glob(motif))
    if len(fichiers) != 1:
        raise SystemExit(f'Une source unique est attendue pour {motif}.')
    for identifiant, label, debut in extraits:
        taches.append((fichiers[0], artiste, titre, identifiant, label, debut))

def preparer(tache):
    fichier, artiste, titre, identifiant, label, debut = tache
    destination = sortie / f'{identifiant}.mp3'
    # 240 s de source, raccord de 4 s entre la fin et le début : boucle de 236 s.
    # Le raccord commence par la fin d'origine et aboutit au début d'origine.
    filtre = (
        '[0:a]atrim=duration=240,asetpts=PTS-STARTPTS,'
        'loudnorm=I=-24:TP=-3:LRA=11,aresample=44100,asplit=3[corps][debut][fin];'
        '[corps]atrim=start=4:end=236,asetpts=PTS-STARTPTS[milieu];'
        '[debut]atrim=end=4,asetpts=PTS-STARTPTS[tete];'
        '[fin]atrim=start=236,asetpts=PTS-STARTPTS[queue];'
        '[queue][tete]acrossfade=d=4:c1=tri:c2=tri[raccord];'
        '[raccord][milieu]concat=n=2:v=0:a=1[audio]'
    )
    subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'error', '-y',
        '-ss', str(debut), '-t', '240', '-i', str(fichier), '-filter_complex', filtre,
        '-map', '[audio]', '-map_metadata', '-1', '-vn', '-c:a', 'libmp3lame', '-b:a', '96k',
        '-ar', '44100', '-ac', '2', '-metadata', f'title={label} — extrait pour Les Fondements',
        '-metadata', f'artist={artiste}', '-metadata', f'comment=Extrait de {titre}, à partir de {debut} secondes ; raccord de boucle de 4 secondes.',
        str(destination)], check=True)
    infos = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries',
        'format=duration', '-of', 'json', str(destination)]))
    duree = float(infos['format']['duration'])
    assert abs(duree - 236) < 0.2, (destination, duree)
    assert destination.stat().st_size < 4_000_000
    print(f'{label} : {duree:.1f} s, {destination.stat().st_size / 1_000_000:.2f} Mo', flush=True)
    return {'valeur': identifiant, 'label': label, 'description': f'{artiste} · boucle douce de 3 min 56',
        'type': 'musique', 'fichier': f'/audio/ambiances/{identifiant}.mp3',
        'artiste': artiste, 'source': titre, 'debutSourceSecondes': debut, 'dureeSecondes': 236}

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    manifeste = list(pool.map(preparer, taches))
(racine / 'src/data/ambiances-importees.json').write_text(json.dumps(manifeste, ensure_ascii=False, indent=2) + '\n')
