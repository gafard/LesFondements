export interface DernierPassage {
  url: string;
  titre: string;
  sousTitre?: string;
  type: 'fiche' | 'verset' | 'ecriture' | 'immersion';
  date: number;
}

export const CLE_DERNIER_PASSAGE = 'lf.dernierPassage';
export const EVENEMENT_PASSAGE = 'lf:passage-updated';

export function lireDernierPassage(): DernierPassage | null {
  if (typeof window === 'undefined') return null;
  try {
    const brut = window.localStorage.getItem(CLE_DERNIER_PASSAGE);
    if (!brut) return null;
    const passage = JSON.parse(brut) as Partial<DernierPassage>;
    if (typeof passage.url !== 'string' || typeof passage.titre !== 'string') return null;
    return {
      url: passage.url,
      titre: passage.titre,
      sousTitre: typeof passage.sousTitre === 'string' ? passage.sousTitre : undefined,
      type: passage.type ?? 'fiche',
      date: typeof passage.date === 'number' ? passage.date : Date.now(),
    };
  } catch {
    return null;
  }
}

export function memoriserPassage(passage: Omit<DernierPassage, 'date'>): void {
  if (typeof window === 'undefined') return;
  const complet: DernierPassage = { ...passage, date: Date.now() };
  try {
    window.localStorage.setItem(CLE_DERNIER_PASSAGE, JSON.stringify(complet));
    window.dispatchEvent(new CustomEvent<DernierPassage>(EVENEMENT_PASSAGE, { detail: complet }));
  } catch {
    // Le marque-page reste un confort : la lecture ne doit jamais être bloquée.
  }
}
