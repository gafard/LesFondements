export type CouleurPostIt = 'jaune' | 'rose' | 'bleu';
export type CouleurSurlignage = CouleurPostIt;

export interface NotePostIt {
  id: string;
  texte: string;
  couleur: CouleurPostIt;
  x: number;
  y: number;
  createdAt: number;
  updatedAt: number;
}

export interface Surlignage {
  id: string;
  blocId: string;
  debut: number;
  fin: number;
  couleur: CouleurSurlignage;
  extrait: string;
  createdAt: number;
}

export interface DocumentAnnotations {
  version: 1;
  notes: NotePostIt[];
  surlignages: Surlignage[];
}

const COULEURS = new Set<CouleurPostIt>(['jaune', 'rose', 'bleu']);

export function annotationsVides(): DocumentAnnotations {
  return { version: 1, notes: [], surlignages: [] };
}

export function lireAnnotations(brut: string | null | undefined): DocumentAnnotations {
  if (!brut) return annotationsVides();

  try {
    const valeur = JSON.parse(brut) as Partial<DocumentAnnotations>;
    const notes = Array.isArray(valeur.notes)
      ? valeur.notes.flatMap((note, index) => {
          if (!note || typeof note !== 'object') return [];
          const candidate = note as Partial<NotePostIt> & { couleur?: string };
          const couleur = COULEURS.has(candidate.couleur as CouleurPostIt)
            ? (candidate.couleur as CouleurPostIt)
            : 'jaune';
          const maintenant = Date.now();
          return [{
            id: typeof candidate.id === 'string' ? candidate.id : `note_${maintenant}_${index}`,
            texte: typeof candidate.texte === 'string' ? candidate.texte : '',
            couleur,
            x: Number.isFinite(candidate.x) ? Number(candidate.x) : 18 + (index % 2) * 34,
            y: Number.isFinite(candidate.y) ? Number(candidate.y) : 54 + index * 118,
            createdAt: Number.isFinite(candidate.createdAt) ? Number(candidate.createdAt) : maintenant,
            updatedAt: Number.isFinite(candidate.updatedAt) ? Number(candidate.updatedAt) : maintenant,
          }];
        })
      : [];

    const surlignages = Array.isArray(valeur.surlignages)
      ? valeur.surlignages.flatMap((surlignage, index) => {
          if (!surlignage || typeof surlignage !== 'object') return [];
          const candidate = surlignage as Partial<Surlignage> & { couleur?: string };
          if (
            typeof candidate.blocId !== 'string' ||
            !Number.isFinite(candidate.debut) ||
            !Number.isFinite(candidate.fin) ||
            Number(candidate.fin) <= Number(candidate.debut)
          ) {
            return [];
          }
          return [{
            id: typeof candidate.id === 'string' ? candidate.id : `surlignage_${Date.now()}_${index}`,
            blocId: candidate.blocId,
            debut: Number(candidate.debut),
            fin: Number(candidate.fin),
            couleur: COULEURS.has(candidate.couleur as CouleurSurlignage)
              ? (candidate.couleur as CouleurSurlignage)
              : 'jaune',
            extrait: typeof candidate.extrait === 'string' ? candidate.extrait : '',
            createdAt: Number.isFinite(candidate.createdAt) ? Number(candidate.createdAt) : Date.now(),
          }];
        })
      : [];

    return { version: 1, notes, surlignages };
  } catch {
    return annotationsVides();
  }
}

export function encoderAnnotations(document: DocumentAnnotations): string {
  return JSON.stringify({
    version: 1,
    notes: document.notes,
    surlignages: document.surlignages,
  } satisfies DocumentAnnotations);
}

/**
 * Récupère les post-it de la première version, qui vivaient uniquement dans
 * localStorage. On les conserve sur le nouveau plan, puis la fiche les
 * synchronise avec le reste des réponses au prochain enregistrement.
 */
export function lireAnnotationsAvecMigration(
  brut: string | null | undefined,
  ficheId: number
): DocumentAnnotations {
  const document = lireAnnotations(brut);
  if (document.notes.length > 0 || typeof window === 'undefined') return document;

  try {
    const anciennes = JSON.parse(
      window.localStorage.getItem(`lf.postits.fiche_${ficheId}`) ?? '[]'
    ) as Array<Record<string, unknown>>;
    if (!Array.isArray(anciennes) || anciennes.length === 0) return document;

    const maintenant = Date.now();
    const notes = anciennes.flatMap((ancienne, index) => {
      if (typeof ancienne?.texte !== 'string' || !ancienne.texte.trim()) return [];
      const couleur = COULEURS.has(ancienne.couleur as CouleurPostIt)
        ? (ancienne.couleur as CouleurPostIt)
        : 'jaune';
      const date = Number.isFinite(ancienne.createdAt)
        ? Number(ancienne.createdAt)
        : maintenant;
      return [{
        id: typeof ancienne.id === 'string' ? ancienne.id : `note_migree_${maintenant}_${index}`,
        texte: ancienne.texte,
        couleur,
        x: 14 + (index % 2) * 36,
        y: 74 + (index % 4) * 128,
        createdAt: date,
        updatedAt: date,
      } satisfies NotePostIt];
    });

    return { ...document, notes };
  } catch {
    return document;
  }
}
