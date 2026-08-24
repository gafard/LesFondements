import { NextResponse } from 'next/server';

/**
 * La voix de studio, à la demande.
 *
 * Les fiches ont leurs enregistrements, produits une fois pour toutes par
 * `scripts/generer-voix.mjs`. Mais un passage choisi à la lecture — deux
 * versets de Romains cliqués dans une bulle — ne peut pas être prégénéré :
 * il y a trente et un mille versets, et autant de plages possibles. Jusqu'ici
 * ces passages tombaient sur la synthèse du navigateur, dont le timbre n'a
 * rien à voir avec le reste du parcours.
 *
 * Cette route donne la même voix aux deux. La clé reste ici, côté serveur :
 * elle ne doit jamais partir dans le navigateur.
 *
 * Attention : chaque appel non mis en cache est facturé au caractère par
 * ElevenLabs. D'où la borne stricte ci-dessous, et le cache côté client.
 */

/** Au-delà, ce n'est plus un passage cliqué : on refuse plutôt que de facturer. */
const LONGUEUR_MAX = 1500;

export async function POST(requete: Request) {
  const cle = process.env.ELEVENLABS_API_KEY;
  const voix = process.env.ELEVENLABS_VOICE_ID;
  const modele = process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2';

  if (!cle || !voix) {
    // 503 et non 500 : ce n'est pas une panne, c'est une absence de
    // configuration. Le client sait alors retomber sur la voix du navigateur.
    return NextResponse.json({ error: 'Voix de studio non configurée' }, { status: 503 });
  }

  let texte: unknown;
  try {
    ({ texte } = (await requete.json()) as { texte?: unknown });
  } catch {
    return NextResponse.json({ error: 'Requête illisible' }, { status: 400 });
  }

  if (typeof texte !== 'string' || !texte.trim()) {
    return NextResponse.json({ error: 'Texte manquant' }, { status: 400 });
  }
  if (texte.length > LONGUEUR_MAX) {
    return NextResponse.json(
      { error: `Passage trop long (${texte.length} caractères, maximum ${LONGUEUR_MAX})` },
      { status: 413 }
    );
  }

  const reponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voix}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': cle, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: texte,
        model_id: modele,
        voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.15 },
      }),
    }
  );

  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => '');
    return NextResponse.json(
      { error: 'La voix de studio a refusé', detail: detail.slice(0, 300) },
      { status: reponse.status === 401 ? 503 : 502 }
    );
  }

  return new Response(reponse.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      // Le même passage rend toujours le même son : il peut être gardé
      // longtemps, en bordure comme dans le navigateur.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
