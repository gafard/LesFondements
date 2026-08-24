import type { FieldValue, Timestamp } from 'firebase/firestore';
import { hasRemoteBackend } from './parcoursStore';
import { marquerPending, marquerSynchronisation } from './syncState';

const DELAI_FIRESTORE_MS = 5000;

function avecDelai<T>(promesse: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Object.assign(new Error("Firestore n'a pas répondu"), { code: 'deadline-exceeded' })),
      DELAI_FIRESTORE_MS
    );
    promesse.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * Détection du backend partagée avec `parcoursStore` : une seule source de
 * vérité, plutôt qu'une copie qui finit par diverger.
 */
const getFirestoreClient = async () => {
  if (!hasRemoteBackend()) return null;
  try {
    const [{ getFirebaseDb }, firestore] = await Promise.all([
      import('./firebase'),
      import('firebase/firestore'),
    ]);
    const db = await getFirebaseDb();
    return { db, firestore };
  } catch {
    return null;
  }
};

// ============ Types ============

export interface FicheProgressData {
  completed: boolean;
  answers: Record<string, string>;
  lastUpdated?: Timestamp | FieldValue | number;
}

/**
 * Valeur de date acceptée à la lecture : un `Timestamp` Firestore, un
 * `FieldValue` (jamais relu tel quel), un nombre (millisecondes), une
 * chaîne ISO, ou une `Date`.
 */
export type DateStockage =
  | Timestamp
  | FieldValue
  | number
  | string
  | Date
  | { seconds: number };

export interface JournalEntryData {
  title?: string;
  content: string;
  createdAt: DateStockage;
  updatedAt?: DateStockage;
}

export interface JournalEntry extends JournalEntryData {
  id: string;
}

// ============ Local Storage Fallback Keys ============
const LOCAL_PROGRESS_KEY = (userId: string) => `lesfondements_prog_${userId}`;
const LOCAL_JOURNAL_KEY = (userId: string) => `lesfondements_journal_${userId}`;
const LOCAL_PENDING_KEY = (userId: string) => `lesfondements_pending_${userId}`;

type PendingOperation =
  | { id: string; kind: 'progress'; ficheId: number }
  | { id: string; kind: 'journal_upsert'; entryId: string }
  | { id: string; kind: 'journal_delete'; entryId: string };

// Accès au stockage local avec garde : ce module peut être importé dans un
// arbre rendu côté serveur, où `window` n'existe pas.
function lireLocal(cle: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window['localStorage'].getItem(cle);
  } catch {
    return null;
  }
}

function ecrireLocal(cle: string, valeur: string): void {
  if (typeof window === 'undefined') return;
  try {
    window['localStorage'].setItem(cle, valeur);
  } catch {
    /* stockage indisponible (quota, mode privé) — sans conséquence */
  }
}

function operationsEnAttente(userId: string): PendingOperation[] {
  try {
    const raw = lireLocal(LOCAL_PENDING_KEY(userId));
    return raw ? (JSON.parse(raw) as PendingOperation[]) : [];
  } catch {
    return [];
  }
}

function enregistrerOperations(userId: string, operations: PendingOperation[]): void {
  ecrireLocal(LOCAL_PENDING_KEY(userId), JSON.stringify(operations));
  marquerPending(operations.length);
}

function ajouterOperation(userId: string, operation: PendingOperation): void {
  const operations = operationsEnAttente(userId).filter((item) => item.id !== operation.id);
  operations.push(operation);
  enregistrerOperations(userId, operations);
}

function terminerOperation(userId: string, id: string): void {
  enregistrerOperations(
    userId,
    operationsEnAttente(userId).filter((item) => item.id !== id)
  );
}

// ============ User Progress ============

export const getCachedUserProgress = (userId: string) => {
  try {
    const raw = lireLocal(LOCAL_PROGRESS_KEY(userId));
    const data: Record<number, FicheProgressData> = raw ? JSON.parse(raw) : {};
    const completedFiches: number[] = [];
    let currentFicheId = 1;

    Object.entries(data).forEach(([idStr, val]) => {
      if (val.completed) completedFiches.push(Number(idStr));
    });

    for (let i = 1; i <= 20; i++) {
      if (!completedFiches.includes(i)) {
        currentFicheId = i;
        break;
      }
    }

    return { completedFiches, currentFicheId };
  } catch {
    return { completedFiches: [], currentFicheId: 1 };
  }
};

export const getUserProgress = async (userId: string) => {
  const client = await getFirestoreClient();
  
  if (client) {
    try {
      const { db, firestore: { collection, getDocs } } = client;
      const progressRef = collection(db, 'users', userId, 'progress');
      const snapshot = await avecDelai(getDocs(progressRef));

      const completedFiches: number[] = [];
      let currentFicheId = 1;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as FicheProgressData;
        const ficheId = Number(docSnap.id);
        if (data.completed) {
          completedFiches.push(ficheId);
        }
      });

      // Une fiche terminée hors-ligne garde priorité jusqu'à son envoi.
      const local = getCachedUserProgress(userId);
      for (const ficheId of local.completedFiches) {
        if (!completedFiches.includes(ficheId)) completedFiches.push(ficheId);
      }

      for (let i = 1; i <= 20; i++) {
        if (!completedFiches.includes(i)) {
          currentFicheId = i;
          break;
        }
      }

      return { completedFiches, currentFicheId };
    } catch (e) {
      console.warn('Firestore progress read error, using local fallback:', e);
    }
  }

  // Local fallback
  return getCachedUserProgress(userId);
};

export const saveFicheProgress = async (
  userId: string,
  ficheId: number,
  data: Omit<FicheProgressData, 'lastUpdated'>
) => {
  const raw = lireLocal(LOCAL_PROGRESS_KEY(userId));
  const all = raw ? JSON.parse(raw) : {};
  all[ficheId] = { ...all[ficheId], ...data, lastUpdated: Date.now() };
  ecrireLocal(LOCAL_PROGRESS_KEY(userId), JSON.stringify(all));
  const operationId = `progress:${ficheId}`;
  ajouterOperation(userId, { id: operationId, kind: 'progress', ficheId });

  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { doc, setDoc, serverTimestamp } } = client;
      const docRef = doc(db, 'users', userId, 'progress', ficheId.toString());
      await avecDelai(setDoc(
        docRef,
        {
          ...data,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      ));
      terminerOperation(userId, operationId);
      return;
    } catch (e) {
      console.warn('Firestore save progress error:', e);
    }
  }

};

export const markFicheCompleted = async (userId: string, ficheId: number) => {
  const raw = lireLocal(LOCAL_PROGRESS_KEY(userId));
  const all = raw ? JSON.parse(raw) : {};
  all[ficheId] = { ...(all[ficheId] || { answers: {} }), completed: true, lastUpdated: Date.now() };
  ecrireLocal(LOCAL_PROGRESS_KEY(userId), JSON.stringify(all));
  const operationId = `progress:${ficheId}`;
  ajouterOperation(userId, { id: operationId, kind: 'progress', ficheId });

  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { doc, setDoc, serverTimestamp } } = client;
      const docRef = doc(db, 'users', userId, 'progress', ficheId.toString());
      await avecDelai(setDoc(
        docRef,
        {
          completed: true,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      ));
      terminerOperation(userId, operationId);
      return;
    } catch (e) {
      console.warn('Firestore mark completed error:', e);
    }
  }

};

// ============ Answers ============

export const getCachedAnswers = (userId: string, ficheId: number): Record<string, string> => {
  try {
    const raw = lireLocal(LOCAL_PROGRESS_KEY(userId));
    const all = raw ? JSON.parse(raw) : {};
    return all[ficheId]?.answers || {};
  } catch {
    return {};
  }
};

export const getAnswers = async (userId: string, ficheId: number) => {
  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { doc, getDoc } } = client;
      const docRef = doc(db, 'users', userId, 'progress', ficheId.toString());
      const docSnap = await avecDelai(getDoc(docRef));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const distant = (data.answers || {}) as Record<string, string>;
        const local = getCachedAnswers(userId, ficheId);
        const aUneEcritureLocale = operationsEnAttente(userId).some(
          (operation) => operation.kind === 'progress' && operation.ficheId === ficheId
        );
        const answers = aUneEcritureLocale ? { ...distant, ...local } : distant;
        try {
          const raw = lireLocal(LOCAL_PROGRESS_KEY(userId));
          const all = raw ? JSON.parse(raw) : {};
          all[ficheId] = { ...(all[ficheId] || {}), answers };
          ecrireLocal(LOCAL_PROGRESS_KEY(userId), JSON.stringify(all));
        } catch {
          /* ignorer */
        }
        return answers;
      }
      return {};
    } catch (e) {
      console.warn('Firestore getAnswers error:', e);
    }
  }

  // Local fallback
  return getCachedAnswers(userId, ficheId);
};

export const saveAnswer = async (
  userId: string,
  ficheId: number,
  questionId: string,
  answer: string
) => {
  const raw = lireLocal(LOCAL_PROGRESS_KEY(userId));
  const all = raw ? JSON.parse(raw) : {};
  const currAnswers = all[ficheId]?.answers || {};
  currAnswers[questionId] = answer;
  all[ficheId] = { ...(all[ficheId] || { completed: false }), answers: currAnswers, lastUpdated: Date.now() };
  ecrireLocal(LOCAL_PROGRESS_KEY(userId), JSON.stringify(all));
  const operationId = `progress:${ficheId}`;
  ajouterOperation(userId, { id: operationId, kind: 'progress', ficheId });

  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { doc, setDoc, serverTimestamp } } = client;
      const docRef = doc(db, 'users', userId, 'progress', ficheId.toString());
      await avecDelai(setDoc(
        docRef,
        {
          answers: currAnswers,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      ));
      terminerOperation(userId, operationId);
      return;
    } catch (e) {
      console.warn('Firestore saveAnswer error:', e);
    }
  }

};

export const saveAnswers = async (
  userId: string,
  ficheId: number,
  answers: Record<string, string>
) => {
  // Mise à jour synchrone immédiate du cache local (0ms)
  try {
    const raw = lireLocal(LOCAL_PROGRESS_KEY(userId));
    const all = raw ? JSON.parse(raw) : {};
    all[ficheId] = { ...(all[ficheId] || { completed: false }), answers, lastUpdated: Date.now() };
    ecrireLocal(LOCAL_PROGRESS_KEY(userId), JSON.stringify(all));
  } catch (e) {
    console.error(e);
  }
  const operationId = `progress:${ficheId}`;
  ajouterOperation(userId, { id: operationId, kind: 'progress', ficheId });

  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { doc, setDoc, serverTimestamp } } = client;
      const docRef = doc(db, 'users', userId, 'progress', ficheId.toString());
      await avecDelai(setDoc(
        docRef,
        {
          answers,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      ));
      terminerOperation(userId, operationId);
    } catch (e) {
      console.warn('Firestore saveAnswers error:', e);
    }
  }
};

export function timestampToDate(timestamp: DateStockage | null | undefined): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp);
  const objet = timestamp as { toDate?: () => Date; seconds?: number };
  if (typeof objet.toDate === 'function') return objet.toDate();
  if (typeof objet.seconds === 'number') return new Date(objet.seconds * 1000);
  return new Date();
}

// ============ Journal ============

export const getCachedJournalEntries = (userId: string): JournalEntry[] => {
  try {
    const raw = lireLocal(LOCAL_JOURNAL_KEY(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { collection, query, orderBy, getDocs } } = client;
      const journalRef = collection(db, 'users', userId, 'journal');
      const q = query(journalRef, orderBy('createdAt', 'desc'));
      const snapshot = await avecDelai(getDocs(q));

      const distantes = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as JournalEntryData),
      }));
      const operations = operationsEnAttente(userId);
      const supprimees = new Set(
        operations.filter((operation) => operation.kind === 'journal_delete').map((operation) => operation.entryId)
      );
      const localesEnAttente = new Set(
        operations.filter((operation) => operation.kind === 'journal_upsert').map((operation) => operation.entryId)
      );
      const locales = getCachedJournalEntries(userId).filter((entry) => localesEnAttente.has(entry.id));
      const parId = new Map(
        distantes.filter((entry) => !supprimees.has(entry.id)).map((entry) => [entry.id, entry])
      );
      for (const entry of locales) parId.set(entry.id, entry);
      const entries = [...parId.values()].sort(
        (a, b) => timestampToDate(b.createdAt).getTime() - timestampToDate(a.createdAt).getTime()
      );
      ecrireLocal(LOCAL_JOURNAL_KEY(userId), JSON.stringify(entries));
      return entries;
    } catch (e) {
      console.warn('Firestore getJournal error:', e);
    }
  }

  // Local fallback
  return getCachedJournalEntries(userId);
};

export const addJournalEntry = async (userId: string, content: string) => {
  const id = `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const localEntry: JournalEntry = {
    id,
    title: '',
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const localList = getCachedJournalEntries(userId);
  ecrireLocal(LOCAL_JOURNAL_KEY(userId), JSON.stringify([localEntry, ...localList]));
  const operationId = `journal:${id}`;
  ajouterOperation(userId, { id: operationId, kind: 'journal_upsert', entryId: id });

  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { doc, setDoc, serverTimestamp } } = client;
      const journalRef = doc(db, 'users', userId, 'journal', id);
      const newEntry = {
        title: '',
        content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await avecDelai(setDoc(journalRef, newEntry));
      terminerOperation(userId, operationId);
      return journalRef.id;
    } catch (e) {
      console.warn('Firestore addJournal error:', e);
    }
  }

  return id;
};

export const deleteJournalEntry = async (userId: string, entryId: string) => {
  const list = getCachedJournalEntries(userId).filter((entry) => entry.id !== entryId);
  ecrireLocal(LOCAL_JOURNAL_KEY(userId), JSON.stringify(list));
  const operationId = `journal-delete:${entryId}`;
  ajouterOperation(userId, { id: operationId, kind: 'journal_delete', entryId });

  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { doc, deleteDoc } } = client;
      const entryRef = doc(db, 'users', userId, 'journal', entryId);
      await avecDelai(deleteDoc(entryRef));
      terminerOperation(userId, operationId);
      return;
    } catch (e) {
      console.warn('Firestore deleteJournal error:', e);
    }
  }

};

/** Rejoue les écritures conservées localement après le retour du réseau. */
export async function flushPendingWrites(userId: string): Promise<void> {
  const operations = operationsEnAttente(userId);
  if (!operations.length) {
    marquerPending(0);
    return;
  }
  const client = await getFirestoreClient();
  if (!client) {
    marquerSynchronisation('hors_ligne', 'Conservé sur cet appareil', operations.length);
    return;
  }

  marquerSynchronisation('en_cours', 'Synchronisation du carnet…', operations.length);
  const { db, firestore: { doc, setDoc, deleteDoc, serverTimestamp } } = client;
  const progress = (() => {
    try {
      return JSON.parse(lireLocal(LOCAL_PROGRESS_KEY(userId)) || '{}') as Record<string, FicheProgressData>;
    } catch {
      return {};
    }
  })();
  const journal = new Map(getCachedJournalEntries(userId).map((entry) => [entry.id, entry]));

  for (const operation of [...operations]) {
    try {
      if (operation.kind === 'progress') {
        const data = progress[String(operation.ficheId)];
        if (data) {
          await avecDelai(
            setDoc(
              doc(db, 'users', userId, 'progress', String(operation.ficheId)),
              { ...data, lastUpdated: serverTimestamp() },
              { merge: true }
            )
          );
        }
      } else if (operation.kind === 'journal_upsert') {
        const entry = journal.get(operation.entryId);
        if (entry) {
          await avecDelai(
            setDoc(
              doc(db, 'users', userId, 'journal', operation.entryId),
              { title: entry.title ?? '', content: entry.content, createdAt: entry.createdAt, updatedAt: serverTimestamp() },
              { merge: true }
            )
          );
        }
      } else {
        await avecDelai(deleteDoc(doc(db, 'users', userId, 'journal', operation.entryId)));
      }
      terminerOperation(userId, operation.id);
    } catch (error) {
      console.warn('Synchronisation différée', error);
      marquerSynchronisation('en_attente', 'Conservé, en attente du réseau', operationsEnAttente(userId).length);
      return;
    }
  }
  marquerPending(0);
}
