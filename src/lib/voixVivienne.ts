'use client';

/**
 * Marqueur de publication de la voix Vivienne.
 *
 * Les fichiers peuvent arriver progressivement pendant une génération. Ils ne
 * deviennent utilisables qu'une fois le manifeste final écrit par le script de
 * vérification : une piste présente par hasard ne suffit jamais à exposer la
 * voix dans l'interface.
 */
export interface ManifesteVivienne {
  complete: true;
  genereLe: string;
  voix: string;
  pistes: string[];
}

let cache: Promise<ManifesteVivienne | null> | null = null;

export function chargerManifesteVivienne(): Promise<ManifesteVivienne | null> {
  cache ??= fetch('/voix/vivienne/manifeste.json', { cache: 'no-store' })
    .then(async (reponse) => {
      if (!reponse.ok) return null;
      const manifeste = (await reponse.json()) as Partial<ManifesteVivienne>;
      if (manifeste.complete !== true || !Array.isArray(manifeste.pistes)) return null;
      return manifeste as ManifesteVivienne;
    })
    .catch(() => null);
  return cache;
}

export function pisteVivienne(
  manifeste: ManifesteVivienne | null,
  id?: string
): string | null {
  if (!manifeste || !id || !manifeste.pistes.includes(id)) return null;
  return `/voix/vivienne/${id}.mp3`;
}
