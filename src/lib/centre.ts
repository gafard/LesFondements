'use client';

import { useSyncExternalStore } from 'react';

/**
 * L'ouverture du centre de l'application.
 *
 * Il doit être atteignable depuis l'écran de lancement comme depuis la
 * coque : un petit état partagé vaut mieux que de faire descendre une
 * fonction à travers cinq composants.
 */

let ouvert = false;
const abonnes = new Set<() => void>();

function notifier() {
  abonnes.forEach((rappel) => rappel());
}

function abonner(rappel: () => void) {
  abonnes.add(rappel);
  return () => {
    abonnes.delete(rappel);
  };
}

export function ouvrirCentre(): void {
  if (ouvert) return;
  ouvert = true;
  notifier();
}

export function fermerCentre(): void {
  if (!ouvert) return;
  ouvert = false;
  notifier();
}

const lire = () => ouvert;
const lireAuServeur = () => false;

export function useCentreOuvert(): boolean {
  return useSyncExternalStore(abonner, lire, lireAuServeur);
}
