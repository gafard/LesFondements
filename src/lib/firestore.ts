import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  FieldValue
} from 'firebase/firestore';

// ============ Types ============

export interface FicheProgressData {
  completed: boolean;
  answers: Record<string, string>;
  lastUpdated: Timestamp | FieldValue;
}

export interface JournalEntryData {
  title: string;
  content: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface JournalEntry extends JournalEntryData {
  id: string;
}

// ============ User Progress ============

export const getUserProgress = async (userId: string) => {
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

  // Current fiche = first uncompleted fiche (1-20)
  for (let i = 1; i <= 20; i++) {
    if (!completedFiches.includes(i)) {
      currentFicheId = i;
      break;
    }
  }

  return { completedFiches, currentFicheId };
};

export const saveFicheProgress = async (
  userId: string,
  ficheId: number,
  data: Omit<FicheProgressData, 'lastUpdated'>
) => {
  const docRef = doc(db, 'users', userId, 'progress', ficheId.toString());
  await setDoc(
    docRef,
    {
      ...data,
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  );
};

export const markFicheCompleted = async (userId: string, ficheId: number) => {
  const docRef = doc(db, 'users', userId, 'progress', ficheId.toString());
  await setDoc(
    docRef,
    {
      completed: true,
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  );
};

// ============ Answers ============

export const getAnswers = async (userId: string, ficheId: number) => {
  const docRef = doc(db, 'users', userId, 'progress', ficheId.toString());
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.answers || {};
  }
  return {};
};

export const saveAnswer = async (
  userId: string,
  ficheId: number,
  questionId: string,
  answer: string
) => {
  const docRef = doc(db, 'users', userId, 'progress', ficheId.toString());
  await setDoc(
    docRef,
    {
      answers: { [questionId]: answer },
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  );
};

export const saveAnswers = async (
  userId: string,
  ficheId: number,
  answers: Record<string, string>
) => {
  const docRef = doc(db, 'users', userId, 'progress', ficheId.toString());
  await setDoc(
    docRef,
    {
      answers,
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  );
};

export const timestampToDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value && typeof value === 'object' && 'toDate' in value) {
    const toDate = (value as { toDate?: unknown }).toDate;
    if (typeof toDate === 'function') {
      return (toDate as () => Date)();
    }
  }
  return null;
};

// ============ Journal ============

export const getJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  const journalRef = collection(db, 'users', userId, 'journal');
  const q = query(journalRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as JournalEntryData),
  }));
};

export const addJournalEntry = async (userId: string, content: string) => {
  const journalRef = doc(collection(db, 'users', userId, 'journal'));
  const newEntry = {
    title: '',
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(journalRef, newEntry);
  return journalRef.id;
};

export const updateJournalEntry = async (
  userId: string,
  entryId: string,
  content: string
) => {
  const entryRef = doc(db, 'users', userId, 'journal', entryId);
  await setDoc(
    entryRef,
    {
      content,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const deleteJournalEntry = async (userId: string, entryId: string) => {
  const entryRef = doc(db, 'users', userId, 'journal', entryId);
  await deleteDoc(entryRef);
};
