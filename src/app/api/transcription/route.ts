import { NextResponse } from 'next/server';

/**
 * Route universelle de transcription vocale rapide via Groq Whisper Large v3.
 * Utilisée pour la dictée des réponses de méditation, le carnet spirituel et les prières.
 */

const TAILLE_MAX = 8 * 1024 * 1024; // 8 MB max (largement suffisant pour 5 minutes de parole)
const TYPES_ADMIS = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/aac'];

export async function POST(requete: Request) {
  const cle = process.env.GROQ_API_KEY;

  try {
    const formData = await requete.formData();
    const fichier = (formData.get('file') || formData.get('audio')) as Blob | null;

    if (!fichier || fichier.size === 0) {
      return NextResponse.json({ error: 'Fichier audio manquant ou vide' }, { status: 400 });
    }

    if (fichier.size > TAILLE_MAX) {
      return NextResponse.json(
        { error: 'Enregistrement trop volumineux (5 minutes au plus recommandé).' },
        { status: 413 }
      );
    }

    const type = (fichier.type || '').split(';')[0].trim();
    if (type && !TYPES_ADMIS.includes(type) && !type.startsWith('audio/')) {
      return NextResponse.json({ error: `Format non accepté : ${type}` }, { status: 415 });
    }

    if (!cle) {
      return NextResponse.json(
        { error: 'Clé Groq non configurée côté serveur', fallback: true },
        { status: 503 }
      );
    }

    // Préparation de la requête pour Groq Whisper
    const groqForm = new FormData();
    groqForm.append('file', fichier, 'audio.webm');
    groqForm.append('model', 'whisper-large-v3-turbo');
    groqForm.append('language', 'fr');
    groqForm.append('response_format', 'json');
    groqForm.append(
      'prompt',
      'Méditation chrétienne, prière, foi en Jésus-Christ, Dieu le Père, Saint-Esprit, grâce, vie spirituelle, repentance, obéissance, Bible, fondements.'
    );

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
        { error: 'Erreur lors de la transcription Groq', detail: errDetail, fallback: true },
        { status: reponse.status }
      );
    }

    const resultat = (await reponse.json()) as { text?: string };
    return NextResponse.json({ text: (resultat.text ?? '').trim() });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur serveur lors de la transcription audio', detail: String(error), fallback: true },
      { status: 500 }
    );
  }
}
