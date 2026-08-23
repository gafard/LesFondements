'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    void Promise.all([getFirebaseAuth(), import('firebase/auth')])
      .then(([auth, { onAuthStateChanged }]) => {
        if (!active) return;
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
      })
      .catch((error) => {
        console.error('Firebase authentication initialization failed', error);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const signInWithGoogle = async () => {
    const [auth, { GoogleAuthProvider, signInWithPopup }] = await Promise.all([
      getFirebaseAuth(),
      import('firebase/auth'),
    ]);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const [auth, { signInWithEmailAndPassword }] = await Promise.all([
      getFirebaseAuth(),
      import('firebase/auth'),
    ]);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    const [auth, { createUserWithEmailAndPassword, updateProfile }] = await Promise.all([
      getFirebaseAuth(),
      import('firebase/auth'),
    ]);
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(credential.user, { displayName });
  };

  const logout = async () => {
    const [auth, { signOut }] = await Promise.all([
      getFirebaseAuth(),
      import('firebase/auth'),
    ]);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
