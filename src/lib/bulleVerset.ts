'use client';

import { useSyncExternalStore } from 'react';
import type { ReferenceBiblique } from './reference';

/**
 * La bulle qui se pose sous un passage cliqué.
 *
 * Ouvrir tout le panneau d'étude pour lire deux lignes de Romains 8, c'est
 * quitter la fiche pour presque rien. La bulle répond à la question posée —
 * « qu'est-ce que ça dit ? » — sans faire perdre la ligne qu'on était en
 * train de lire. Le panneau reste accessible depuis la bulle, pour qui veut
 * le mot grec et les renvois.
 */

export interface BulleOuverte {
  reference: ReferenceBiblique;
  /**
   * Le mot cliqué lui-même, et non ses coordonnées : la page peut défiler,
   * la bulle doit suivre plutôt que disparaître. On recalcule la position
   * à partir de l'élément à chaque mouvement.
   */
  ancre: HTMLElement;
}

let ouverte: BulleOuverte | null = null;
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

const lire = () => ouverte;
const lireServeur = () => null;

export function ouvrirBulle(reference: ReferenceBiblique, element: HTMLElement): void {
  ouverte = { reference, ancre: element };
  notifier();
}

export function fermerBulle(): void {
  if (!ouverte) return;
  ouverte = null;
  notifier();
}

export function useBulleVerset(): BulleOuverte | null {
  return useSyncExternalStore(abonner, lire, lireServeur);
}
