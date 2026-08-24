/**
 * Accès au contenu du livret « Le parcours des fondements ».
 *
 * Le texte intégral (20 fiches, annexes, index, bibliographie) vit dans
 * `src/data/livret.json`, généré depuis le PDF d'origine par
 * `scripts/parse-livret.py` puis `scripts/build-livret-data.py`.
 *
 * Ce fichier pèse plusieurs centaines de kilo-octets : il est chargé à la
 * demande, de sorte que le tableau de bord ou le sentier n'en paient pas le
 * prix. Une fois chargé, il reste en mémoire pour la session.
 */

export type BlocType =
  | 'paragraphe'
  | 'sous-titre'
  | 'citation'
  | 'encadre'
  | 'liste'
  | 'aparte';

export interface Bloc {
  type: BlocType;
  texte: string;
}

export interface SectionLivret {
  /** null pour le préambule d'une fiche, avant sa première puce. */
  titre: string | null;
  blocs: Bloc[];
}

/** La partie « Résumé et Partage… » : c'est elle qui porte la rencontre. */
export interface ResumeSection {
  titre: string;
  /** Le résumé de la section, en quelques phrases. */
  points: string[];
  /** Références à recopier et méditer (le livret laisse la place vide). */
  versets: string[];
  /** Passages à lire en complément. */
  lectures: string[];
  /** Questions de partage, précédées de « >> » dans le livret. */
  questions: string[];
}

export interface NoteLivret {
  num: number;
  texte: string;
}

export interface AnnexeLivret {
  titre: string;
  blocs: Bloc[];
}

export interface FicheLivret {
  id: number;
  /** Titre retenu par l'application. */
  titre: string;
  /** Titre exact du livret imprimé, quand il diffère. */
  titreLivret: string;
  sousTitre: string;
  icone: string;
  /** Page d'ouverture dans le livret imprimé. */
  page: number;
  sections: SectionLivret[];
  resume: ResumeSection[];
  /** Questions posées hors d'une section identifiée. */
  questionsLibres: string[];
  notes: NoteLivret[];
  annexes: AnnexeLivret[];
}

export interface EntreeIndex {
  theme: string;
  pages: number[];
  reference: string;
}

export interface ReferenceBiblio {
  auteur: string | null;
  ouvrages: string;
  fiches: number[];
}

export interface Livret {
  presentation: SectionLivret[];
  fiches: FicheLivret[];
  annexeTransversale: { titre: string; sections: SectionLivret[] };
  index: EntreeIndex[];
  bibliographie: ReferenceBiblio[];
}

let cache: Livret | null = null;
let enCours: Promise<Livret> | null = null;

/** Charge (une seule fois) le livret complet. */
export function chargerLivret(): Promise<Livret> {
  if (cache) return Promise.resolve(cache);
  enCours ??= import('@/data/livret.json').then((module) => {
    cache = (module.default ?? module) as unknown as Livret;
    return cache;
  });
  return enCours;
}

export async function chargerFiche(id: number): Promise<FicheLivret | null> {
  const livret = await chargerLivret();
  return livret.fiches.find((fiche) => fiche.id === id) ?? null;
}

/** Disponible en synchrone une fois `chargerLivret()` résolu. */
export function livretEnMemoire(): Livret | null {
  return cache;
}

// ─────────────────────────────────────────────────────────────
// Dérivés utiles
// ─────────────────────────────────────────────────────────────

/** Toutes les questions de partage d'une fiche, dans l'ordre du livret. */
export function questionsDe(fiche: FicheLivret): { id: string; texte: string; section?: string }[] {
  const sorties: { id: string; texte: string; section?: string }[] = [];
  fiche.resume.forEach((section, indexSection) => {
    section.questions.forEach((texte, index) => {
      sorties.push({ id: `${fiche.id}_${indexSection}_${index}`, texte, section: section.titre });
    });
  });
  fiche.questionsLibres.forEach((texte, index) => {
    sorties.push({ id: `${fiche.id}_libre_${index}`, texte });
  });
  return sorties;
}

/** Toutes les références à recopier, dédoublonnées. */
export function versetsDe(fiche: FicheLivret): string[] {
  const vus = new Set<string>();
  const sortie: string[] = [];
  for (const section of fiche.resume) {
    for (const reference of section.versets) {
      const cle = reference.replace(/\s+/g, ' ').trim();
      if (!cle || vus.has(cle)) continue;
      vus.add(cle);
      sortie.push(cle);
    }
  }
  return sortie;
}

/** Les lectures bibliques proposées en complément. */
export function lecturesDe(fiche: FicheLivret): string[] {
  return fiche.resume.flatMap((section) => section.lectures);
}

/** Durée de lecture estimée de l'exposé, en minutes. */
export function dureeLecture(fiche: FicheLivret): number {
  const mots = fiche.sections
    .flatMap((section) => section.blocs)
    .reduce((total, bloc) => total + bloc.texte.split(/\s+/).length, 0);
  return Math.max(4, Math.round(mots / 180));
}
