import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let appPromise: Promise<FirebaseApp> | undefined;
let authPromise: Promise<Auth> | undefined;
let dbPromise: Promise<Firestore> | undefined;

export const getFirebaseApp = () => {
  appPromise ??= import('firebase/app').then(({ getApp, getApps, initializeApp }) =>
    getApps().length ? getApp() : initializeApp(firebaseConfig)
  );

  return appPromise;
};

export const getFirebaseAuth = () => {
  authPromise ??= Promise.all([getFirebaseApp(), import('firebase/auth')]).then(
    ([app, { getAuth }]) => getAuth(app)
  );

  return authPromise;
};

export const getFirebaseDb = () => {
  dbPromise ??= Promise.all([getFirebaseApp(), import('firebase/firestore')]).then(
    ([app, { initializeFirestore }]) =>
      /**
       * `ignoreUndefinedProperties` est indispensable ici : le domaine compte
       * beaucoup de champs optionnels — le lieu d'une rencontre, le lien de
       * visio, la région d'une ville, le message d'une demande d'adhésion.
       * Sans cette option, Firestore rejette l'écriture entière dès qu'un
       * seul de ces champs vaut `undefined`, avec une erreur
       * `invalid-argument`. Le champ est simplement omis du document.
       */
      initializeFirestore(app, { ignoreUndefinedProperties: true })
  );

  return dbPromise;
};

/**
 * Le jeton d'identité de la personne connectée, pour les routes qui
 * l'exigent. Rend `null` si personne n'est connecté ou si Firebase n'est pas
 * joignable — à l'appelant de décider ce qu'il en fait.
 */
export async function jetonFirebase(): Promise<string | null> {
  try {
    const auth = await getFirebaseAuth();
    return (await auth.currentUser?.getIdToken()) ?? null;
  } catch {
    return null;
  }
}
