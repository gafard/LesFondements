'use client';

export type EtatSynchronisation = 'synchronise' | 'en_cours' | 'en_attente' | 'hors_ligne' | 'erreur';

export interface SynchronisationSnapshot {
  etat: EtatSynchronisation;
  message: string;
  pending: number;
  updatedAt: number;
}

let snapshot: SynchronisationSnapshot = {
  etat: 'synchronise',
  message: 'Carnet synchronisé',
  pending: 0,
  updatedAt: Date.now(),
};

const listeners = new Set<() => void>();

export function etatSynchronisation(): SynchronisationSnapshot {
  return snapshot;
}

export function observerSynchronisation(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function marquerSynchronisation(
  etat: EtatSynchronisation,
  message: string,
  pending = snapshot.pending
): void {
  snapshot = { etat, message, pending, updatedAt: Date.now() };
  listeners.forEach((listener) => listener());
}

export function marquerPending(pending: number): void {
  marquerSynchronisation(
    pending > 0 ? 'en_attente' : 'synchronise',
    pending > 0
      ? `${pending} modification${pending > 1 ? 's' : ''} à envoyer`
      : 'Carnet synchronisé',
    pending
  );
}
