'use client';

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { firebaseConfigure, MODE_E2E } from './runtime';
import { doitReinitialiser, reinitialiserStockage, CONNEXION_MINIMALE_SECONDES } from './reinitialisation';

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
  renommer: (nom: string) => Promise<void>;
  supprimerCompte: () => Promise<void>;
  isFirebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const souscrireHydratation = () => () => {};

const LOCAL_STORAGE_USER_KEY = 'lesfondements_local_user';

/** Relit la session invitée locale, sans effet de bord ni setState. */
function lireUtilisateurLocal(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!MODE_E2E && doitReinitialiser(window.localStorage)) return null;
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
const FIREBASE_CONFIGURE = firebaseConfigure();

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Le serveur et le tout premier rendu navigateur voient tous les deux une
  // session vide. La session locale n'est exposée qu'après hydratation, ce qui
  // évite que la coque complète remplace brutalement l'écran d'ouverture.
  const hydrate = useSyncExternalStore(souscrireHydratation, () => true, () => false);
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
        .then(([{ getFirebaseAuth }, { onAuthStateChanged, getRedirectResult, signOut, reload }]) => {
          return getFirebaseAuth().then(async (auth) => {
            if (!active) return;
            if (!MODE_E2E && doitReinitialiser(window.localStorage)) {
              await signOut(auth);
              reinitialiserStockage(window.localStorage);
            }
            if (!active) return;
            getRedirectResult(auth).catch(() => {});
            unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
              if (currentUser) {
                try {
                  await reload(currentUser);
                  const jeton = await currentUser.getIdTokenResult();
                  if (new Date(jeton.authTime).getTime() / 1000 < CONNEXION_MINIMALE_SECONDES) {
                    await signOut(auth);
                    return;
                  }
                } catch (erreur) {
                  const code = (erreur as { code?: string }).code;
                  if (code === 'auth/user-not-found' || code === 'auth/user-disabled' || code === 'auth/user-token-expired' || code === 'auth/invalid-user-token') {
                    await signOut(auth);
                    return;
                  }
                }
                if (!active || auth.currentUser?.uid !== currentUser.uid) return;
                setUser({
                  uid: currentUser.uid,
                  email: currentUser.email,
                  displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Disciple',
                  photoURL: currentUser.photoURL,
                });
              } else {
                if (!active) return;
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
    if (!isFirebaseConfigured && !MODE_E2E) reinitialiserStockage(window.localStorage);
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
      const [{ getFirebaseAuth }, { GoogleAuthProvider, signInWithPopup, signInWithRedirect }] = await Promise.all([
        import('./firebase'),
        import('firebase/auth'),
      ]);
      const auth = await getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      try {
        const res = await signInWithPopup(auth, provider);
        setUser({
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
          photoURL: res.user.photoURL,
        });
      } catch (popupErr: unknown) {
        const code =
          typeof popupErr === 'object' && popupErr !== null && 'code' in popupErr
            ? String((popupErr as { code: unknown }).code)
            : '';
        if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
          console.warn('Popup bloquée par le navigateur, bascule en redirection...');
          await signInWithRedirect(auth, provider);
          return;
        }
        throw popupErr;
      }
    } catch (err) {
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

  /**
   * Corriger son nom.
   *
   * À l'inscription par e-mail, le nom est déduit de l'adresse — la partie
   * avant l'arobase. « jean.dupont92 » n'est le nom de personne, et il
   * s'affichait ainsi à tout le groupe sans qu'on puisse y toucher.
   */
  const renommer = async (nom: string) => {
    const propre = nom.trim().slice(0, 60);
    if (!propre || !user) return;

    if (isFirebaseConfigured) {
      const [{ getFirebaseAuth }, { updateProfile }] = await Promise.all([
        import('./firebase'),
        import('firebase/auth'),
      ]);
      const auth = await getFirebaseAuth();
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: propre });
    } else {
      const local = { ...user, displayName: propre };
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(local));
    }
    setUser({ ...user, displayName: propre });
  };

  const supprimerCompte = async () => {
    if (!user) return;
    const { effacerDonneesLocales, supprimerDonneesDistantes } = await import('./confidentialite');

    if (isFirebaseConfigured) {
      const [{ getFirebaseAuth }, { deleteUser }] = await Promise.all([
        import('./firebase'),
        import('firebase/auth'),
      ]);
      const auth = await getFirebaseAuth();
      const current = auth.currentUser;
      if (!current) throw new Error('AUTHENTIFICATION_REQUISE');
      const jeton = await current.getIdTokenResult();
      const authentifieLe = new Date(jeton.authTime).getTime();
      if (Date.now() - authentifieLe > 5 * 60 * 1000) throw new Error('CONNEXION_RECENTE_REQUISE');
      await supprimerDonneesDistantes(user.uid);
      await deleteUser(current);
    }

    effacerDonneesLocales();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user: hydrate ? user : null,
      loading: !hydrate || loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signInAsGuest,
      logout,
      renommer,
      supprimerCompte,
      isFirebaseConfigured,
    }}>
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
