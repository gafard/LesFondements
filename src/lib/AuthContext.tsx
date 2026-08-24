'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInAsGuest: (displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  isFirebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'lesfondements_local_user';

/** Relit la session invitée locale, sans effet de bord ni setState. */
function lireUtilisateurLocal(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const brut = window.localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    return brut ? (JSON.parse(brut) as AppUser) : null;
  } catch {
    return null;
  }
}

/**
 * Les variables `NEXT_PUBLIC_*` sont figées à la compilation : la réponse est
 * donc connue dès le premier rendu, serveur compris. La calculer ici plutôt
 * que dans un effet évite que l'interface s'affiche une fraction de seconde
 * en mode local — le bouton « Découvrir sans créer de compte » apparaissait
 * puis disparaissait à chaque chargement.
 */
const FIREBASE_CONFIGURE = (() => {
  const cle = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return !!cle && cle !== 'your-api-key' && !cle.includes('your-');
})();

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // La session invitée est relue dès le premier rendu : pas d'écran de
  // chargement inutile en mode local. En mode Firebase, on attend l'auth.
  const [user, setUser] = useState<AppUser | null>(() => lireUtilisateurLocal());
  const [loading, setLoading] = useState(FIREBASE_CONFIGURE);
  const isFirebaseConfigured = FIREBASE_CONFIGURE;

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    if (isFirebaseConfigured) {
      void Promise.all([import('./firebase'), import('firebase/auth')])
        .then(([{ getFirebaseAuth }, { onAuthStateChanged }]) => {
          return getFirebaseAuth().then((auth) => {
            if (!active) return;
            unsubscribe = onAuthStateChanged(auth, (currentUser) => {
              if (currentUser) {
                setUser({
                  uid: currentUser.uid,
                  email: currentUser.email,
                  displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Disciple',
                  photoURL: currentUser.photoURL,
                });
              } else {
                // Check if local guest session exists
                const saved = lireUtilisateurLocal();
                if (saved) setUser(saved);
                else setUser(null);
              }
              setLoading(false);
            });
          });
        })
        .catch((error) => {
          console.warn('Firebase Auth fallback to local mode:', error);
          const saved = lireUtilisateurLocal();
          if (saved) setUser(saved);
          if (active) setLoading(false);
        });
    }
    // Mode local : la session est déjà initialisée de façon synchrone
    // (lazy initializer), rien à faire ici.

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [isFirebaseConfigured]);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      // Fallback guest login
      await signInAsGuest('Visiteur Google');
      return;
    }

    try {
      const [{ getFirebaseAuth }, { GoogleAuthProvider, signInWithPopup }] = await Promise.all([
        import('./firebase'),
        import('firebase/auth'),
      ]);
      const auth = await getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      setUser({
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName,
        photoURL: res.user.photoURL,
      });
    } catch (err) {
      // Firebase est branché : une erreur doit remonter, pas se transformer
      // en session locale silencieuse qui ne rejoindra jamais de vrai groupe.
      console.error('Connexion Google refusée', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      const guestUser: AppUser = {
        uid: 'user_' + btoa(email).replace(/=/g, '').substring(0, 12),
        email,
        displayName: email.split('@')[0],
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(guestUser));
      setUser(guestUser);
      return;
    }

    const [{ getFirebaseAuth }, { signInWithEmailAndPassword }] = await Promise.all([
      import('./firebase'),
      import('firebase/auth'),
    ]);
    const auth = await getFirebaseAuth();
    const res = await signInWithEmailAndPassword(auth, email, password);
    setUser({
      uid: res.user.uid,
      email: res.user.email,
      displayName: res.user.displayName || email.split('@')[0],
      photoURL: res.user.photoURL,
    });
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    if (!isFirebaseConfigured) {
      const guestUser: AppUser = {
        uid: 'user_' + btoa(email).replace(/=/g, '').substring(0, 12),
        email,
        displayName: displayName || email.split('@')[0],
      };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(guestUser));
      setUser(guestUser);
      return;
    }

    const [{ getFirebaseAuth }, { createUserWithEmailAndPassword, updateProfile }] = await Promise.all([
      import('./firebase'),
      import('firebase/auth'),
    ]);
    const auth = await getFirebaseAuth();
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(credential.user, { displayName });
    }
    setUser({
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: displayName || email.split('@')[0],
      photoURL: credential.user.photoURL,
    });
  };

  const signInAsGuest = async (displayName: string = 'Disciple') => {
    const guestUser: AppUser = {
      uid: 'guest_' + Math.random().toString(36).substring(2, 9),
      email: 'invite@lesfondements.app',
      displayName,
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(guestUser));
    setUser(guestUser);
  };

  const logout = async () => {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    if (isFirebaseConfigured) {
      try {
        const [{ getFirebaseAuth }, { signOut }] = await Promise.all([
          import('./firebase'),
          import('firebase/auth'),
        ]);
        const auth = await getFirebaseAuth();
        await signOut(auth);
      } catch (e) {
        console.warn(e);
      }
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest, logout, isFirebaseConfigured }}>
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
