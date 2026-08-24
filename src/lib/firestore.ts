import type { FieldValue, Timestamp } from 'firebase/firestore';
import { hasRemoteBackend } from './parcoursStore';

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

// ============ User Progress ============

export const getUserProgress = async (userId: string) => {
  const client = await getFirestoreClient();
  
  if (client) {
    try {
      const { db, firestore: { collection, getDocs } } = client;
      const progressRef = collection(db, 'users', userId, 'progress');
      const snapshot = await getDocs(progressRef);

      const completedFiches: number[] = [];
      let currentFicheId = 1;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as FicheProgressData;
        const ficheId = Number(docSnap.id);
        if (data.completed) {
          completedFiches.push(ficheId);
        }
      });

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

export const saveFicheProgress = async (
  userId: string,
  ficheId: number,
  data: Omit<FicheProgressData, 'lastUpdated'>
) => {
  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { doc, setDoc, serverTimestamp } } = client;
      const docRef = doc(db, 'users', userId, 'progress', ficheId.toString());
      await setDoc(
        docRef,
        {
          ...data,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
      return;
    } catch (e) {
      console.warn('Firestore save progress error:', e);
    }
  }

  // Local fallback
  try {
    const raw = lireLocal(LOCAL_PROGRESS_KEY(userId));
    const all = raw ? JSON.parse(raw) : {};
    all[ficheId] = { ...all[ficheId], ...data, lastUpdated: Date.now() };
    ecrireLocal(LOCAL_PROGRESS_KEY(userId), JSON.stringify(all));
  } catch (e) {
    console.error(e);
  }
};

export const markFicheCompleted = async (userId: string, ficheId: number) => {
  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { doc, setDoc, serverTimestamp } } = client;
      const docRef = doc(db, 'users', userId, 'progress', ficheId.toString());
      await setDoc(
        docRef,
        {
          completed: true,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
      return;
    } catch (e) {
      console.warn('Firestore mark completed error:', e);
    }
  }

  // Local fallback
  try {
    const raw = lireLocal(LOCAL_PROGRESS_KEY(userId));
    const all = raw ? JSON.parse(raw) : {};
    all[ficheId] = { ...(all[ficheId] || { answers: {} }), completed: true, lastUpdated: Date.now() };
    ecrireLocal(LOCAL_PROGRESS_KEY(userId), JSON.stringify(all));
  } catch (e) {
    console.error(e);
  }
};

// ============ Answers ============

export const getAnswers = async (userId: string, ficheId: number) => {
  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { doc, getDoc } } = client;
      const docRef = doc(db, 'users', userId, 'progress', ficheId.toString());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.answers || {};
      }
      return {};
    } catch (e) {
      console.warn('Firestore getAnswers error:', e);
    }
  }

  // Local fallback
  try {
    const raw = lireLocal(LOCAL_PROGRESS_KEY(userId));
    const all = raw ? JSON.parse(raw) : {};
    return all[ficheId]?.answers || {};
  } catch {
    return {};
  }
};

export const saveAnswer = async (
  userId: string,
  ficheId: number,
  questionId: string,
  answer: string
) => {
  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { doc, setDoc, serverTimestamp } } = client;
      const docRef = doc(db, 'users', userId, 'progress', ficheId.toString());
      await setDoc(
        docRef,
        {
          answers: { [questionId]: answer },
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
      return;
    } catch (e) {
      console.warn('Firestore saveAnswer error:', e);
    }
  }

  // Local fallback
  try {
    const raw = lireLocal(LOCAL_PROGRESS_KEY(userId));
    const all = raw ? JSON.parse(raw) : {};
    const currAnswers = all[ficheId]?.answers || {};
    currAnswers[questionId] = answer;
    all[ficheId] = { ...(all[ficheId] || { completed: false }), answers: currAnswers, lastUpdated: Date.now() };
    ecrireLocal(LOCAL_PROGRESS_KEY(userId), JSON.stringify(all));
  } catch (e) {
    console.error(e);
  }
};

export const saveAnswers = async (
  userId: string,
  ficheId: number,
  answers: Record<string, string>
) => {
  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { doc, setDoc, serverTimestamp } } = client;
      const docRef = doc(db, 'users', userId, 'progress', ficheId.toString());
      await setDoc(
        docRef,
        {
          answers,
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
      return;
    } catch (e) {
      console.warn('Firestore saveAnswers error:', e);
    }
  }

  // Local fallback
  try {
    const raw = lireLocal(LOCAL_PROGRESS_KEY(userId));
    const all = raw ? JSON.parse(raw) : {};
    all[ficheId] = { ...(all[ficheId] || { completed: false }), answers, lastUpdated: Date.now() };
    ecrireLocal(LOCAL_PROGRESS_KEY(userId), JSON.stringify(all));
  } catch (e) {
    console.error(e);
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

export const getJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { collection, query, orderBy, getDocs } } = client;
      const journalRef = collection(db, 'users', userId, 'journal');
      const q = query(journalRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as JournalEntryData),
      }));
    } catch (e) {
      console.warn('Firestore getJournal error:', e);
    }
  }

  // Local fallback
  try {
    const raw = lireLocal(LOCAL_JOURNAL_KEY(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addJournalEntry = async (userId: string, content: string) => {
  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { collection, doc, setDoc, serverTimestamp } } = client;
      const journalRef = doc(collection(db, 'users', userId, 'journal'));
      const newEntry = {
        title: '',
        content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(journalRef, newEntry);
      return journalRef.id;
    } catch (e) {
      console.warn('Firestore addJournal error:', e);
    }
  }

  // Local fallback
  try {
    const id = 'entry_' + Date.now();
    const raw = lireLocal(LOCAL_JOURNAL_KEY(userId));
    const list: JournalEntry[] = raw ? JSON.parse(raw) : [];
    const newEntry: JournalEntry = {
      id,
      title: '',
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(newEntry);
    ecrireLocal(LOCAL_JOURNAL_KEY(userId), JSON.stringify(list));
    return id;
  } catch {
    return 'local_entry';
  }
};

export const deleteJournalEntry = async (userId: string, entryId: string) => {
  const client = await getFirestoreClient();
  if (client) {
    try {
      const { db, firestore: { doc, deleteDoc } } = client;
      const entryRef = doc(db, 'users', userId, 'journal', entryId);
      await deleteDoc(entryRef);
      return;
    } catch (e) {
      console.warn('Firestore deleteJournal error:', e);
    }
  }

  // Local fallback
  try {
    const raw = lireLocal(LOCAL_JOURNAL_KEY(userId));
    let list: JournalEntry[] = raw ? JSON.parse(raw) : [];
    list = list.filter((e) => e.id !== entryId);
    ecrireLocal(LOCAL_JOURNAL_KEY(userId), JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
};
