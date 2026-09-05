export const DUREE_FEUILLE_MS = 340;
export interface PointGlissement { x: number; y: number }
/** Un défilement vertical ou une diagonale ne doit jamais changer de carte. */
export function directionGlissement(debut: PointGlissement | null, fin: PointGlissement): -1 | 0 | 1 {
  if (!debut) return 0;
  const dx = debut.x - fin.x;
  const dy = debut.y - fin.y;
  return Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.4 ? dx > 0 ? 1 : -1 : 0;
}

export interface EtatFeuille {
  index: number; precedent: number | null; sens: 'avant' | 'arriere';
  animation: 'note-posee' | 'note-avant' | 'note-arriere';
}
/** Termine chaque geste avant d'aller à la dernière destination demandée. */
export function creerNavigationFeuilles(total: number, initial: number, publier: (etat: EtatFeuille) => void, options: {
  reduire: () => boolean;
  programmer: (suite: () => void, duree: number) => () => void;
}) {
  const borner = (n: number) => Math.max(0, Math.min(Math.max(0, total - 1), n));
  let courant = borner(initial);
  let cible = courant;
  let annuler: (() => void) | null = null;
  let detruit = false;
  const lancer = () => {
    if (detruit || courant === cible || annuler) return;
    const precedent = courant;
    const sens = cible > courant ? 'avant' : 'arriere';
    courant = cible;
    const animation = options.reduire() ? 'note-posee' : sens === 'avant' ? 'note-avant' : 'note-arriere';
    publier({ index: courant, precedent: animation === 'note-posee' ? null : precedent, sens, animation });
    if (animation === 'note-posee') return;
    annuler = options.programmer(() => {
      annuler = null;
      if (detruit) return;
      // Garder la même classe sur la même carte : aucune deuxième entrée.
      publier({ index: courant, precedent: null, sens, animation });
      lancer();
    }, DUREE_FEUILLE_MS);
  };
  return {
    aller(delta: number) { cible = borner(cible + delta); lancer(); },
    changer(index: number) { cible = borner(index); lancer(); },
    reinitialiser(index = 0) { annuler?.(); annuler = null; courant = cible = borner(index); publier({ index: courant, precedent: null, sens: 'avant', animation: 'note-posee' }); },
    activer() { detruit = false; },
    detruire() { detruit = true; annuler?.(); annuler = null; },
  };
}
