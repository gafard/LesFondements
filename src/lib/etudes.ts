'use client';

/**
 * Accès aux outils d'étude : le texte biblique annoté, les lexiques hébreu et
 * grec, les références croisées, la bible thématique et le commentaire.
 *
 * Tout est servi en fichiers statiques depuis `public/etudes`, générés par
 * `scripts/importer-etudes.py`. Rien n'est chargé tant qu'on n'ouvre pas un
 * passage : consulter Jean 3 télécharge le livre de Jean (240 Ko) et la
 * tranche de lexique correspondante, pas les 35 Mo du corpus.
 *
 * Toutes ces sources sont des ouvrages du domaine public :
 *   · Louis Segond 1910, annotée des numéros Strong
 *   · Lexiques Strong hébreu et grec (traduction française)
 *   · Treasury of Scripture Knowledge (1833) — références croisées
 *   · Bible thématique de Nave (1897)
 *   · Commentaire de Matthew Henry (1710)
 */

import { abreger, livreParCode, type Livre, type ReferenceBiblique } from './reference';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/** Un fragment de verset : son texte, son numéro Strong, son code d'analyse. */
export interface Segment {
  t: string;
  s?: number;
  m?: number;
}

export interface Verset {
  v: number;
  t: string;
  s: Segment[];
}

export interface LivreBiblique {
  livre: string;
  nom: string;
  numero: number;
  chapitres: Record<string, Verset[]>;
}

export interface EntreeStrong {
  code: number;
  langue: 'hebreu' | 'grec';
  mot: string;
  phonetique: string;
  original: string;
  origine: string;
  type: string;
  lsg: string;
  definition: string;
}

export interface GroupeReferences {
  titre: string;
  refs: string[];
}

export interface Theme {
  nom: string;
  description: string;
}

export interface FicheLivreIndex {
  code: string;
  nom: string;
  numero: number;
  testament: 'at' | 'nt';
  chapitres: number;
  versets: number;
}

// ─────────────────────────────────────────────────────────────
// Chargement, avec mémoire
// ─────────────────────────────────────────────────────────────

const BASE = '/etudes';
const cache = new Map<string, Promise<unknown>>();

function charger<T>(chemin: string): Promise<T | null> {
  const existant = cache.get(chemin) as Promise<T | null> | undefined;
  if (existant) return existant;

  const promesse = fetch(`${BASE}/${chemin}`)
    .then((reponse) => (reponse.ok ? (reponse.json() as Promise<T>) : null))
    .catch(() => null);

  cache.set(chemin, promesse);
  return promesse;
}

export function chargerIndexDesLivres(): Promise<FicheLivreIndex[] | null> {
  return charger<FicheLivreIndex[]>('livres.json');
}

export function chargerLivre(code: string): Promise<LivreBiblique | null> {
  return charger<LivreBiblique>(`segond/${code}.json`);
}

// ─────────────────────────────────────────────────────────────
// Lecture d'un passage
// ─────────────────────────────────────────────────────────────

export interface Passage {
  reference: ReferenceBiblique;
  titre: string;
  versets: Verset[];
  /** Vrai quand la référence visait un chapitre entier. */
  chapitreEntier: boolean;
  /** Nombre total de chapitres du livre, pour la navigation. */
  nbChapitres: number;
}

/** Lit le passage désigné. `null` si le livre ou le chapitre n'existe pas. */
export async function lirePassage(reference: ReferenceBiblique): Promise<Passage | null> {
  const livre = await chargerLivre(reference.livre.code);
  if (!livre) return null;

  const chapitres = Object.keys(livre.chapitres)
    .map(Number)
    .sort((a, b) => a - b);

  // Une plage de chapitres (« Jean 14-17 ») : on ouvre le premier, la
  // navigation permet de parcourir les suivants.
  const numeroChapitre = Math.min(
    Math.max(reference.chapitre, chapitres[0] ?? 1),
    chapitres[chapitres.length - 1] ?? 1
  );
  const tous = livre.chapitres[String(numeroChapitre)];
  if (!tous) return null;

  const debut = reference.versetDebut;
  const fin = reference.versetFin ?? debut;
  const versets =
    debut === undefined ? tous : tous.filter((verset) => verset.v >= debut && verset.v <= fin!);

  return {
    reference: { ...reference, chapitre: numeroChapitre },
    titre: `${livre.nom} ${numeroChapitre}`,
    versets: tous,
    chapitreEntier: true,
    nbChapitres: chapitres.length,
  };
}

/** Le texte seul d'un verset, sans annotation — pour le copier ou l'entendre. */
export function texteSeul(versets: Verset[]): string {
  return versets.map((verset) => verset.t).join(' ');
}

// ─────────────────────────────────────────────────────────────
// Lexiques Strong
// ─────────────────────────────────────────────────────────────

/**
 * Un numéro Strong ne dit pas à lui seul s'il est hébreu ou grec : c'est le
 * testament du verset qui tranche. L'Ancien Testament renvoie à l'hébreu,
 * le Nouveau au grec.
 */
export function langueDe(livre: Livre): 'hebreu' | 'grec' {
  return livre.testament === 'at' ? 'hebreu' : 'grec';
}

export async function chargerStrong(
  langue: 'hebreu' | 'grec',
  code: number
): Promise<EntreeStrong | null> {
  const tranche = Math.floor(code / 500);
  const entrees = await charger<Record<string, Omit<EntreeStrong, 'code' | 'langue'>>>(
    `lexique/${langue}/${tranche}.json`
  );
  const entree = entrees?.[String(code)];
  return entree ? { ...entree, code, langue } : null;
}

/**
 * Les codes d'analyse grammaticale (5xxx en grec, 8xxx en hébreu) vivent dans
 * les mêmes tables que les numéros Strong. On les distingue par la langue :
 * ils ne sont utiles que si l'on veut afficher le temps, la voix, le mode.
 */
export function chargerMorphologie(
  langue: 'hebreu' | 'grec',
  code: number
): Promise<EntreeStrong | null> {
  return chargerStrong(langue, code);
}

// ─────────────────────────────────────────────────────────────
// Références croisées, thèmes, commentaire
// ─────────────────────────────────────────────────────────────

function clef(reference: ReferenceBiblique, verset: number): string {
  return `${reference.chapitre}:${verset}`;
}

export async function chargerReferencesCroisees(
  reference: ReferenceBiblique,
  verset: number
): Promise<GroupeReferences[]> {
  const table = await charger<Record<string, GroupeReferences[]>>(
    `references/${reference.livre.code}.json`
  );
  return table?.[clef(reference, verset)] ?? [];
}

export async function chargerThemesDuVerset(
  reference: ReferenceBiblique,
  verset: number
): Promise<string[]> {
  const table = await charger<Record<string, string[]>>(
    `themes/versets/${reference.livre.code}.json`
  );
  return table?.[clef(reference, verset)] ?? [];
}

export async function chargerTheme(cle: string): Promise<Theme | null> {
  const lettre = cle.charAt(0);
  const themes = await charger<Record<string, Theme>>(`themes/lettres/${lettre}.json`);
  return themes?.[cle] ?? null;
}

export async function chargerCommentaire(
  codeLivre: string,
  chapitre: number
): Promise<string[]> {
  const table = await charger<Record<string, string[]>>(`commentaire/${codeLivre}.json`);
  return table?.[String(chapitre)] ?? [];
}

// ─────────────────────────────────────────────────────────────
// Utilitaires d'affichage
// ─────────────────────────────────────────────────────────────

/** « jn 3:16 » → « Jn 3:16 », prêt à afficher. */
export function libelleClef(cle: string): string {
  const [code, reste] = cle.split(' ');
  const livre = livreParCode(code);
  return livre ? `${abreger(livre)} ${reste}` : cle;
}

/** Précharge les fichiers d'un livre — appelé quand on ouvre un passage. */
export function prechargerLivre(code: string): void {
  void chargerLivre(code);
  void charger(`references/${code}.json`);
}
