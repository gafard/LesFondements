'use client';

import { effacerMesureLocale } from './mesure';
import { firebaseConfigure } from './runtime';

const PREFIXES_LOCAUX = [
  'lf.',
  'lesfondements_',
  'temoignages_',
];

export function effacerDonneesLocales(): void {
  if (typeof window === 'undefined') return;
  const cles = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter(
    (cle): cle is string => !!cle
  );
  for (const cle of cles) {
    if (PREFIXES_LOCAUX.some((prefixe) => cle.startsWith(prefixe))) localStorage.removeItem(cle);
  }
  effacerMesureLocale();
}

async function supprimerCollection(
  db: import('firebase/firestore').Firestore,
  firestore: typeof import('firebase/firestore'),
  chemin: string[]
): Promise<void> {
  const [racine, ...suite] = chemin;
  if (!racine) return;
  const snapshot = await firestore.getDocs(firestore.collection(db, racine, ...suite));
  await Promise.all(snapshot.docs.map((document) => firestore.deleteDoc(document.ref)));
}

/** Supprime les données accessibles par la personne avant la suppression Auth. */
export async function supprimerDonneesDistantes(uid: string): Promise<void> {
  if (!firebaseConfigure()) return;
  const [{ getFirebaseDb }, firestore] = await Promise.all([
    import('./firebase'),
    import('firebase/firestore'),
  ]);
  const db = await getFirebaseDb();
  const profilRef = firestore.doc(db, 'profiles', uid);
  const profil = await firestore.getDoc(profilRef);
  const donnees = profil.data() as { groupId?: string | null; role?: string | null } | undefined;

  if (donnees?.role === 'animateur' && donnees.groupId) {
    throw new Error('TRANSFERT_GROUPE_REQUIS');
  }

  await Promise.all([
    supprimerCollection(db, firestore, ['users', uid, 'progress']),
    supprimerCollection(db, firestore, ['users', uid, 'journal']),
    supprimerCollection(db, firestore, ['users', uid, 'memory']),
  ]);

  const temoignages = await firestore.getDocs(
    firestore.query(firestore.collection(db, 'temoignages'), firestore.where('auteurId', '==', uid))
  );
  await Promise.all(temoignages.docs.map((document) => firestore.deleteDoc(document.ref)));

  if (donnees?.groupId) {
    const membreRef = firestore.doc(db, 'groups', donnees.groupId, 'members', uid);
    const membre = await firestore.getDoc(membreRef);
    if (membre.exists()) {
      // Comme pour un départ volontaire, l'ordre compte : les règles
      // n'autorisent le décompte qu'à un membre encore actif. Sans ce
      // décompte, le groupe gardait une place occupée par un compte qui
      // n'existe plus, et se déclarait complet une personne trop tôt.
      if (membre.data().status === 'actif') {
        const groupeRef = firestore.doc(db, 'groups', donnees.groupId);
        const groupe = await firestore.getDoc(groupeRef);
        const places = groupe.data()?.membersCount;
        if (typeof places === 'number') {
          await firestore.updateDoc(groupeRef, { membersCount: Math.max(0, places - 1) });
        }
      }
      await firestore.updateDoc(membreRef, {
        status: 'parti',
        displayName: 'Compte supprimé',
        email: null,
        photoURL: null,
      });
    }
  }

  await Promise.all([
    firestore.deleteDoc(profilRef),
    firestore.deleteDoc(firestore.doc(db, 'users', uid)),
  ]);
}
