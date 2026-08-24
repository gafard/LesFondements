'use client';

/**
 * La voix de studio pour un passage quelconque.
 *
 * Le principe : on demande l'audio à `/api/voix`, on le garde, on le rejoue.
 * Le cache n'est pas un raffinement — sans lui, réécouter trois fois le même
 * verset le facturerait trois fois, et l'application ne dirait plus rien
 * hors connexion.
 *
 * Deux étages : la mémoire pour la session, le Cache Storage pour les
 * suivantes. En cas d'échec — pas de clé, pas de réseau, quota dépassé —
 * on renvoie `null` et l'appelant retombe sur la voix du navigateur.
 */

const CACHE = 'lf-voix-studio-v1';
const enMemoire = new Map<string, string>();

/** Une clé d'URL stable pour un texte donné. */
async function empreinte(texte: string): Promise<string> {
  const octets = new TextEncoder().encode(texte);
  const condense = await crypto.subtle.digest('SHA-256', octets);
  return Array.from(new Uint8Array(condense))
    .slice(0, 16)
    .map((o) => o.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Rend une URL jouable pour ce texte, ou `null` si la voix de studio n'est
 * pas disponible.
 */
export async function urlVoixStudio(texte: string): Promise<string | null> {
  const propre = texte.trim();
  if (!propre) return null;

  const clef = await empreinte(propre);
  const deja = enMemoire.get(clef);
  if (deja) return deja;

  // Le Cache Storage garde l'audio d'une session à l'autre, et hors ligne.
  const requete = new Request(`/api/voix#${clef}`);
  let cache: Cache | null = null;
  try {
    cache = await caches.open(CACHE);
    const garde = await cache.match(requete);
    if (garde) {
      const url = URL.createObjectURL(await garde.blob());
      enMemoire.set(clef, url);
      return url;
    }
  } catch {
    /* Cache Storage indisponible (navigation privée, quota) : on continue. */
  }

  let reponse: Response;
  try {
    reponse = await fetch('/api/voix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texte: propre }),
    });
  } catch {
    return null; // hors ligne
  }
  if (!reponse.ok) return null;

  const audio = await reponse.blob();
  try {
    await cache?.put(requete, new Response(audio, { headers: { 'Content-Type': 'audio/mpeg' } }));
  } catch {
    /* Le cache a refusé : tant pis, on jouera quand même. */
  }

  const url = URL.createObjectURL(audio);
  enMemoire.set(clef, url);
  return url;
}

/**
 * `false` dès qu'un appel a montré que la voix de studio n'est pas
 * configurée : inutile de retenter à chaque verset.
 */
let disponible = true;

export function voixStudioEcartee(): void {
  disponible = false;
}

export function voixStudioPossible(): boolean {
  return disponible && typeof window !== 'undefined' && 'crypto' in window;
}
