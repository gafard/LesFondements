import { getCloudflareContext } from '@opennextjs/cloudflare';
import { verifierFirebaseToken } from '@/lib/firebaseToken';

/**
 * Le dépôt des témoignages audio.
 *
 * L'enregistrement voyageait jusqu'ici en base64 dans le document Firestore.
 * Un document plafonne à 1 Mio, et le base64 gonfle d'un tiers : au-delà de
 * trois minutes environ, l'écriture était refusée — le témoignage restait sur
 * le seul appareil de son auteur, qui le voyait et le croyait partagé.
 *
 * R2 sert dix gigaoctets et sa bande passante sortante sans frais. L'audio y
 * vit désormais, et Firestore ne garde qu'une adresse.
 */

/** Un témoignage n'est pas un podcast : dix minutes, et le fichier reste léger. */
const TAILLE_MAX = 10 * 1024 * 1024;

const TYPES_ADMIS = new Set([
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
]);

function typeAdmis(type: string): boolean {
  return TYPES_ADMIS.has(type) || TYPES_ADMIS.has(type.split(';')[0].trim());
}

export async function POST(requete: Request) {
  // Déposer exige un compte. Sans cette garde, n'importe qui pouvait écrire
  // dix mégaoctets dans le seau à chaque appel, autant de fois qu'il voulait.
  // La lecture reste ouverte : le mur des témoignages est public.
  try {
    await verifierFirebaseToken(requete);
  } catch {
    return Response.json({ error: 'Authentification requise' }, { status: 401 });
  }

  const { env } = getCloudflareContext();
  const bucket = env.TEMOIGNAGES;
  if (!bucket) {
    return Response.json({ error: 'Dépôt audio non configuré' }, { status: 503 });
  }

  const type = requete.headers.get('content-type') ?? '';
  if (!typeAdmis(type)) {
    return Response.json({ error: `Format non accepté : ${type}` }, { status: 415 });
  }

  const audio = await requete.arrayBuffer();
  if (!audio.byteLength) {
    return Response.json({ error: 'Enregistrement vide' }, { status: 400 });
  }
  if (audio.byteLength > TAILLE_MAX) {
    return Response.json(
      { error: 'Enregistrement trop long — dix minutes au plus.' },
      { status: 413 }
    );
  }

  // Un nom imprévisible : l'adresse d'un témoignage ne doit pas se deviner
  // à partir de celle d'un autre.
  const nom = `${Date.now().toString(36)}-${crypto.randomUUID()}`;

  await bucket.put(nom, audio, {
    httpMetadata: { contentType: type.split(';')[0].trim() },
  });

  return Response.json({ url: `/api/temoignages/audio?f=${nom}` }, { status: 201 });
}

export async function GET(requete: Request) {
  const { env } = getCloudflareContext();
  const bucket = env.TEMOIGNAGES;
  if (!bucket) return new Response('Dépôt audio non configuré', { status: 503 });

  const nom = new URL(requete.url).searchParams.get('f');
  // Le nom vient de nous : on refuse tout ce qui n'a pas notre forme, plutôt
  // que de laisser une adresse fabriquée parcourir le seau.
  if (!nom || !/^[a-z0-9]+-[0-9a-f-]{36}$/.test(nom)) {
    return new Response('Introuvable', { status: 404 });
  }

  const objet = await bucket.get(nom);
  if (!objet) return new Response('Introuvable', { status: 404 });

  // Le flux de R2 et celui du DOM sont le même objet à l'exécution ; seuls
  // leurs types divergent, workerd et le navigateur les décrivant chacun de
  // son côté. On le dit ici plutôt que d'imposer les types Workers partout.
  return new Response(objet.body as unknown as ReadableStream, {
    headers: {
      'Content-Type': objet.httpMetadata?.contentType ?? 'audio/webm',
      // Le fichier ne change jamais : il peut être gardé longtemps.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
