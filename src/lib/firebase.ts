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
    ([app, { getFirestore }]) => getFirestore(app)
  );

  return dbPromise;
};
