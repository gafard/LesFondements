'use client';

/**
 * Les voix off du parcours.
 *
 * Une « piste » est un fragment de texte lu à voix haute : un paragraphe de
 * l'exposé, un titre de section, un résumé, une question. Chaque piste porte
 * un identifiant stable, dérivé de la structure du livret.
 *
 * Trois sources possibles, dans cet ordre de priorité :
 *   1. `humaine`  — un enregistrement déposé dans `public/voix/humaine/`
 *   2. `eleven`   — la voix de synthèse générée par `scripts/generer-voix.mjs`
 *   3. rien       — l'application retombe sur la synthèse du navigateur
 *
 * C'est ce qui permet d'utiliser ElevenLabs aujourd'hui et de le remplacer
 * piste par piste, au fil des enregistrements, sans toucher au code : il
 * suffit de déposer le fichier et de regénérer le manifeste.
 */

export type SourceVoix = 'humaine' | 'eleven';

export interface Piste {
  /** Identifiant stable, ex. « f1.s0.b3 ». */
  id: string;
  url: string;
  source: SourceVoix;
  /** Durée en secondes, quand elle est connue. */
  duree?: number;
  /** Nom de la voix, affiché dans les crédits. */
  voix?: string;
  /** Empreinte du texte lu — sert à repérer une voix devenue obsolète. */
  empreinte?: string;
}

export interface Manifeste {
  genereLe: string;
  voixParDefaut?: string;
  pistes: Record<string, Piste>;
}

let cache: Promise<Manifeste | null> | null = null;

/** Charge le manifeste des voix. Absent = pas de voix off, ce n'est pas une erreur. */
export function chargerManifesteVoix(): Promise<Manifeste | null> {
  cache ??= fetch('/voix/manifeste.json')
    .then((reponse) => (reponse.ok ? (reponse.json() as Promise<Manifeste>) : null))
    .catch(() => null);
  return cache;
}

// ─────────────────────────────────────────────────────────────
// Identifiants de piste
// ─────────────────────────────────────────────────────────────

/**
 * Les identifiants sont construits à partir de la place du texte dans le
 * livret, pas de son contenu : réenregistrer un paragraphe ne change pas
 * l'identifiant, et corriger une coquille ne casse pas la voix associée.
 */
export const pisteId = {
  seuil: (fiche: number) => `f${fiche}.seuil`,
  section: (fiche: number, section: number) => `f${fiche}.s${section}`,
  bloc: (fiche: number, section: number, bloc: number) => `f${fiche}.s${section}.b${bloc}`,
  resume: (fiche: number, section: number) => `f${fiche}.r${section}`,
  question: (fiche: number, question: number) => `f${fiche}.q${question}`,
  /**
   * Les versets à recopier sont partagés entre fiches — « Ps 37:4 » peut
   * revenir trois fois. On les nomme par la référence, pas par la fiche :
   * un seul enregistrement sert partout.
   */
  verset: (reference: string) => `v.${ardoise(reference)}`,
};

/** « 1 Jn 4:16 » → « 1jn-4-16 » : un nom de fichier stable et lisible. */
function ardoise(reference: string): string {
  return reference
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Retrouve la piste la plus précise disponible : le paragraphe s'il a été
 * enregistré, sinon la section entière, sinon rien.
 */
export function resoudrePiste(manifeste: Manifeste | null, ...candidats: string[]): Piste | null {
  if (!manifeste) return null;
  for (const id of candidats) {
    const piste = manifeste.pistes[id];
    if (piste) return piste;
  }
  return null;
}

/** Combien de pistes existent pour une fiche — pour l'afficher dans l'UI. */
export function compterPistes(manifeste: Manifeste | null, fiche: number): number {
  if (!manifeste) return 0;
  const prefixe = `f${fiche}.`;
  return Object.keys(manifeste.pistes).filter((id) => id.startsWith(prefixe)).length;
}
