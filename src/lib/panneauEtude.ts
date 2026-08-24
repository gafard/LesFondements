'use client';

import { useSyncExternalStore } from 'react';
import { analyserReference, type ReferenceBiblique } from './reference';

/**
 * Un seul panneau d'étude pour toute l'application : n'importe quelle
 * référence, où qu'elle apparaisse — dans une fiche, dans un résumé, dans le
 * mur du groupe — l'ouvre au bon endroit.
 */

let ouverte: ReferenceBiblique | null = null;
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

/** Ouvre le panneau sur une référence déjà analysée. */
export function ouvrirEtude(reference: ReferenceBiblique): void {
  ouverte = reference;
  notifier();
}

/** Ouvre le panneau depuis un texte : « Rm 8:31-32 ». */
export function ouvrirEtudeDepuisTexte(valeur: string): boolean {
  const reference = analyserReference(valeur);
  if (!reference) return false;
  ouvrirEtude(reference);
  return true;
}

export function fermerEtude(): void {
  ouverte = null;
  notifier();
}

export function usePanneauEtude(): ReferenceBiblique | null {
  return useSyncExternalStore(abonner, lire, lireServeur);
}
