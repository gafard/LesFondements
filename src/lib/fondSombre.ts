'use client';

import { useEffect, useSyncExternalStore } from 'react';

/**
 * Certains écrans occupent tout l'écran sur fond nuit — la porte fermée du
 * parcours, une fiche pas encore ouverte, la salle d'attente. La barre de
 * navigation doit alors s'y accorder.
 *
 * Plutôt que de deviner depuis l'URL, ces écrans le déclarent eux-mêmes.
 */

let sombre = 0;
const abonnes = new Set<() => void>();

function notifier() {
  abonnes.forEach((callback) => callback());
}

function abonner(callback: () => void) {
  abonnes.add(callback);
  return () => {
    abonnes.delete(callback);
  };
}

const lire = () => sombre > 0;
const lireServeur = () => false;

/** À rendre par tout écran qui occupe l'écran sur fond nuit. */
export function useDeclarerFondSombre(): void {
  useEffect(() => {
    sombre += 1;
    notifier();
    return () => {
      sombre = Math.max(0, sombre - 1);
      notifier();
    };
  }, []);
}

export function useFondSombre(): boolean {
  return useSyncExternalStore(abonner, lire, lireServeur);
}
