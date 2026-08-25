import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

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
 * Chaque génération est facturée au caractère. Le premier réglage ne gardait
 * l'audio que dans le navigateur : le même verset était donc refacturé pour
 * chaque appareil, et chaque nouveau visiteur repayait ce que quelqu'un avait
 * déjà fait dire. Or un passage rend toujours le même son.
 *
 * Il est désormais gravé sur R2, dont la bande passante sortante est
 * gratuite : ElevenLabs n'est appelé qu'à la toute première demande, pour
 * tout le monde et une seule fois.
 */

/** L'empreinte d'un texte : le même passage retrouve toujours son fichier. */
async function empreinte(texte: string): Promise<string> {
  const octets = new TextEncoder().encode(texte);
  const condense = await crypto.subtle.digest('SHA-256', octets);
  return Array.from(new Uint8Array(condense))
    .slice(0, 16)
    .map((o) => o.toString(16).padStart(2, '0'))
    .join('');
}

/** Les en-têtes d'un son qui ne changera jamais. */
const ENTETES_AUDIO = {
  'Content-Type': 'audio/mpeg',
  'Cache-Control': 'public, max-age=31536000, immutable',
};

/** Au-delà, ce n'est plus un passage cliqué : on refuse plutôt que de facturer. */
const LONGUEUR_MAX = 1500;

/**
 * Cette route dépense de l'argent à chaque appel non mis en cache. Sans
 * garde, il suffirait de connaître l'adresse pour vider le quota du projet.
 *
 * On vérifie l'origine, ce qui écarte les appels depuis une autre page. Ce
 * n'est pas une authentification — un client fabriqué à la main passe encore
 * — mais c'est ce qui peut se faire sans vérifier un jeton Firebase dans un
 * Worker. La vraie borne reste la longueur maximale et le cache du client.
 */
function origineAdmise(requete: Request): boolean {
  const attendue = process.env.NEXT_PUBLIC_SITE_URL;
  const origine = requete.headers.get('origin');
  // Pas d'origine : appel direct (curl, outil). On refuse.
  if (!origine) return false;
  if (!attendue) return true; // configuration incomplète : on ne bloque pas le développement
  try {
    return new URL(origine).host === new URL(attendue).host || new URL(origine).hostname === 'localhost';
  } catch {
    return false;
  }
}

export async function POST(requete: Request) {
  if (!origineAdmise(requete)) {
    return NextResponse.json({ error: 'Origine non autorisée' }, { status: 403 });
  }

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

  // Déjà dit une fois ? On le ressert sans rien dépenser.
  const { env } = getCloudflareContext();
  const seau = env.VOIX;
  const clef = `${voix}/${await empreinte(texte)}.mp3`;

  if (seau) {
    const grave = await seau.get(clef);
    if (grave) {
      // Même flux, deux descriptions : voir la note dans la route des
      // témoignages audio.
      return new Response(grave.body as unknown as ReadableStream, {
        headers: { ...ENTETES_AUDIO, 'X-Voix-Origine': 'grave' },
      });
    }
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

  // On garde le son avant de le rendre : la prochaine demande, d'où qu'elle
  // vienne, ne coûtera plus rien.
  const audio = await reponse.arrayBuffer();
  if (seau) {
    try {
      await seau.put(clef, audio, { httpMetadata: { contentType: 'audio/mpeg' } });
    } catch {
      /* le dépôt a échoué : on sert quand même, ce sera regénéré plus tard */
    }
  }

  return new Response(audio, {
    headers: { ...ENTETES_AUDIO, 'X-Voix-Origine': 'genere' },
  });
}
