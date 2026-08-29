'use client';

import { firebaseConfigure } from './runtime';

export type TypeContenuSignale = 'temoignage' | 'message_groupe' | 'reponse';
export type MotifSignalement = 'dangereux' | 'haine' | 'harcelement' | 'spam' | 'vie_privee' | 'autre';

export interface Signalement {
  id: string;
  reporterUid: string;
  targetType: TypeContenuSignale;
  targetId: string;
  reason: MotifSignalement;
  comment: string;
  status: 'en_attente';
  createdAt: number;
}

export async function signalerContenu(
  reporterUid: string,
  targetType: TypeContenuSignale,
  targetId: string,
  reason: MotifSignalement,
  comment = ''
): Promise<void> {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `signalement_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  const signalement: Signalement = {
    id,
    reporterUid,
    targetType,
    targetId: targetId.slice(0, 180),
    reason,
    comment: comment.trim().slice(0, 500),
    status: 'en_attente',
    createdAt: Date.now(),
  };

  if (firebaseConfigure()) {
    const [{ getFirebaseDb }, { doc, setDoc }] = await Promise.all([
      import('./firebase'),
      import('firebase/firestore'),
    ]);
    await setDoc(doc(await getFirebaseDb(), 'moderationReports', id), signalement);
    return;
  }

  const cle = 'lf.moderation.signalements';
  const existants = JSON.parse(localStorage.getItem(cle) || '[]') as Signalement[];
  localStorage.setItem(cle, JSON.stringify([...existants, signalement]));
}
