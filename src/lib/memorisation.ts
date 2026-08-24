'use client';

import { normaliserReference } from '@/data/versets';
import { hasRemoteBackend } from './parcoursStore';
import { marquerSynchronisation } from './syncState';

export type QualiteRappel = 0 | 1 | 2 | 3;

export interface MemoireVerset {
  reference: string;
  dueAt: number;
  intervalDays: number;
  attempts: number;
  streak: number;
  lastScore: number;
  lastQuality: QualiteRappel;
  lastReviewedAt: number;
  masteredAt?: number;
}

export type EtatMemoire = Record<string, MemoireVerset>;

const CLE = (uid: string) => `lf.memoire.${uid}`;
const JOURS = 24 * 60 * 60 * 1000;
const PROGRESSION = [1, 3, 7, 14, 30, 60, 120];

function lireLocal(uid: string): EtatMemoire {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(CLE(uid)) || '{}') as EtatMemoire;
  } catch {
    return {};
  }
}

function ecrireLocal(uid: string, state: EtatMemoire): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CLE(uid), JSON.stringify(state));
}

export function cleMemoire(reference: string): string {
  return normaliserReference(reference);
}

export function etatMemoireLocal(uid: string): EtatMemoire {
  return lireLocal(uid);
}

export function initialiseMemoire(uid: string, references: string[]): EtatMemoire {
  const state = lireLocal(uid);
  const maintenant = Date.now();
  for (const reference of references) {
    const key = cleMemoire(reference);
    state[key] ??= {
      reference,
      dueAt: maintenant,
      intervalDays: 0,
      attempts: 0,
      streak: 0,
      lastScore: 0,
      lastQuality: 0,
      lastReviewedAt: 0,
    };
  }
  ecrireLocal(uid, state);
  return state;
}

export async function chargerMemoire(uid: string, references: string[]): Promise<EtatMemoire> {
  const local = initialiseMemoire(uid, references);
  if (!hasRemoteBackend()) return local;
  try {
    const [{ getFirebaseDb }, { doc, getDoc }] = await Promise.all([
      import('./firebase'),
      import('firebase/firestore'),
    ]);
    const db = await getFirebaseDb();
    const snap = await getDoc(doc(db, 'users', uid, 'memory', 'state'));
    const distant = snap.exists() ? ((snap.data().records ?? {}) as EtatMemoire) : {};
    const merged = { ...local };
    for (const [key, record] of Object.entries(distant)) {
      if (!merged[key] || record.lastReviewedAt > merged[key].lastReviewedAt) merged[key] = record;
    }
    for (const reference of references) {
      const key = cleMemoire(reference);
      merged[key] ??= initialiseMemoire(uid, [reference])[key];
    }
    ecrireLocal(uid, merged);
    return merged;
  } catch (error) {
    console.warn('Mémoire distante indisponible', error);
    return local;
  }
}

function prochainInterval(record: MemoireVerset, quality: QualiteRappel): number {
  if (quality === 0) return 1;
  if (quality === 1) return Math.max(1, Math.round(Math.max(1, record.intervalDays) * 1.35));
  if (quality === 3 && record.intervalDays >= 7) return Math.min(180, Math.round(record.intervalDays * 2.15));
  return PROGRESSION[Math.min(record.streak, PROGRESSION.length - 1)] ?? 120;
}

export async function enregistrerRevision(
  uid: string,
  reference: string,
  quality: QualiteRappel,
  score: number
): Promise<MemoireVerset> {
  const state = initialiseMemoire(uid, [reference]);
  const key = cleMemoire(reference);
  const current = state[key];
  const maintenant = Date.now();
  const intervalDays = prochainInterval(current, quality);
  const streak = quality === 0 ? 0 : current.streak + 1;
  const next: MemoireVerset = {
    ...current,
    intervalDays,
    dueAt: maintenant + intervalDays * JOURS,
    attempts: current.attempts + 1,
    streak,
    lastScore: Math.max(0, Math.min(100, Math.round(score))),
    lastQuality: quality,
    lastReviewedAt: maintenant,
    masteredAt: streak >= 4 && quality >= 2 ? current.masteredAt ?? maintenant : current.masteredAt,
  };
  state[key] = next;
  ecrireLocal(uid, state);

  if (hasRemoteBackend()) {
    marquerSynchronisation('en_cours', 'Révision enregistrée…');
    try {
      const [{ getFirebaseDb }, { doc, setDoc, serverTimestamp }] = await Promise.all([
        import('./firebase'),
        import('firebase/firestore'),
      ]);
      const db = await getFirebaseDb();
      await setDoc(
        doc(db, 'users', uid, 'memory', 'state'),
        { records: state, updatedAt: serverTimestamp() },
        { merge: true }
      );
      marquerSynchronisation('synchronise', 'Révision synchronisée');
    } catch (error) {
      console.warn('Révision conservée localement', error);
      marquerSynchronisation('en_attente', 'Révision conservée sur cet appareil', 1);
    }
  }
  return next;
}

export function revisionsDues(state: EtatMemoire, maintenant = Date.now()): MemoireVerset[] {
  return Object.values(state)
    .filter((record) => record.dueAt <= maintenant)
    .sort((a, b) => a.dueAt - b.dueAt);
}
