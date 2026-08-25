import { NextResponse } from 'next/server';

/**
 * Transcription IA ultra-rapide des témoignages audio via Groq Whisper.
 *
 * Groq propose Whisper Large v3 gratuitement avec une latence quasi instantanée (< 1s pour 1 minute).
 * Si une clé GROQ_API_KEY est fournie, elle est utilisée côté serveur sans jamais être exposée au client.
 */
export async function POST(requete: Request) {
  const cle = process.env.GROQ_API_KEY;

  try {
    const formData = await requete.formData();
    const fichier = formData.get('file') as Blob | null;

    if (!fichier || fichier.size === 0) {
      return NextResponse.json({ error: 'Fichier audio manquant ou vide' }, { status: 400 });
    }

    if (!cle) {
      return NextResponse.json(
        { error: 'Clé Groq non configurée côté serveur', fallback: true },
        { status: 503 }
      );
    }

    // Préparation de la requête multipart pour l'API Groq Whisper
    const groqForm = new FormData();
    groqForm.append('file', fichier, 'audio.webm');
    groqForm.append('model', 'whisper-large-v3-turbo');
    groqForm.append('language', 'fr');
    groqForm.append('response_format', 'json');
    groqForm.append('prompt', 'Témoignage chrétien, foi en Jésus, Dieu le Père, Saint-Esprit, prière, grâce, fondements.');

    const reponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cle}`,
      },
      body: groqForm,
    });

    if (!reponse.ok) {
      const errDetail = await reponse.text().catch(() => '');
      return NextResponse.json(
        { error: 'Erreur lors de la transcription Groq', detail: errDetail },
        { status: reponse.status }
      );
    }

    const resultat = (await reponse.json()) as { text?: string };
    return NextResponse.json({ text: resultat.text ?? '' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur interne lors du traitement audio', detail: String(error) },
      { status: 500 }
    );
  }
}
