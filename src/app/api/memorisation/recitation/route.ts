import { NextResponse } from 'next/server';
import { verifierFirebaseToken } from '@/lib/firebaseToken';

/**
 * Écouter quelqu'un réciter un verset.
 *
 * Route distincte de celle des témoignages, et pour une raison de fond :
 * Whisper accepte une amorce qui oriente son décodage vers le vocabulaire
 * annoncé. Pour un témoignage c'est un gain de fidélité. Ici, ce serait
 * l'inverse d'une épreuve — lui souffler le verset attendu lui ferait
 * produire ce verset même si la personne a bafouillé, et le score dirait
 * toujours qu'elle sait.
 *
 * On n'amorce donc pas. La transcription doit rendre ce qui a été dit, pas
 * ce qu'on espérait entendre.
 */

/** Un verset se récite en moins d'une minute : au-delà, ce n'est pas ça. */
const TAILLE_MAX = 4 * 1024 * 1024;

export async function POST(requete: Request) {
  try {
    await verifierFirebaseToken(requete);
  } catch {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
  }

  const cle = process.env.GROQ_API_KEY;
  if (!cle) {
    // 503 et non 500 : ce n'est pas une panne, c'est une absence de
    // configuration. Le client saura retomber sur la voix du navigateur.
    return NextResponse.json(
      { error: 'Écoute de la récitation non configurée', repli: true },
      { status: 503 }
    );
  }

  let audio: Blob | null = null;
  try {
    const formulaire = await requete.formData();
    audio = formulaire.get('audio') as Blob | null;
  } catch {
    return NextResponse.json({ error: 'Requête illisible' }, { status: 400 });
  }

  if (!audio || audio.size === 0) {
    return NextResponse.json({ error: 'Aucun enregistrement reçu' }, { status: 400 });
  }
  if (audio.size > TAILLE_MAX) {
    return NextResponse.json({ error: 'Enregistrement trop long' }, { status: 413 });
  }

  const versGroq = new FormData();
  versGroq.append('file', audio, 'recitation.webm');
  versGroq.append('model', 'whisper-large-v3');
  versGroq.append('language', 'fr');
  versGroq.append('response_format', 'json');
  // Pas de `prompt` : voir la note en tête de fichier. Et température à
  // zéro pour que Whisper s'en tienne à ce qu'il entend plutôt que de
  // combler les silences par ce qui lui semble plausible.
  versGroq.append('temperature', '0');

  const reponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cle}` },
    body: versGroq,
  });

  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => '');
    return NextResponse.json(
      { error: 'L’écoute n’a pas abouti', detail: detail.slice(0, 200), repli: true },
      { status: reponse.status === 401 ? 503 : 502 }
    );
  }

  const resultat = (await reponse.json()) as { text?: string };
  return NextResponse.json({ dit: (resultat.text ?? '').trim() });
}
