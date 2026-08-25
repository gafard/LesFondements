'use client';

import { getFirebaseDb } from './firebase';
import { hasRemoteBackend } from './parcoursStore';

export interface TemoignageItem {
  id: string;
  auteur: string;
  auteurId?: string;
  avatar?: string;
  ficheId?: number;
  texte: string;
  audioUrl?: string;
  amens: number;
  amensVotants?: string[];
  aVote?: boolean;
  date: number;
  couleur?: 'rose' | 'jaune' | 'vert' | 'blanc' | 'orange';
  attache?: 'punaise-bois' | 'punaise-metal' | 'punaise-rouge' | 'trombone' | 'scotch';
  rotation?: string;
}

export const TEMOIGNAGES_INITIAUX: TemoignageItem[] = [
  {
    id: 'tem_1',
    auteur: 'Samuel M.',
    ficheId: 1,
    texte: 'La révélation que Dieu est un Père qui règne avec amour a guéri mon anxiété...',
    amens: 24,
    date: Date.now() - 1000 * 60 * 60 * 24 * 3,
    couleur: 'rose',
    attache: 'punaise-bois',
    rotation: '-rotate-2',
  },
  {
    id: 'tem_2',
    auteur: 'Esther K.',
    ficheId: 4,
    texte: 'Pendant des années, je vivais dans le légalisme. L’échange divin de la croix a tout libéré.',
    amens: 38,
    date: Date.now() - 1000 * 60 * 60 * 24 * 7,
    couleur: 'jaune',
    attache: 'trombone',
    rotation: 'rotate-3',
  },
  {
    id: 'tem_3',
    auteur: 'Marc & Chantal',
    ficheId: 15,
    texte: 'Vivre ces fiches avec notre cellule de maison nous a soudés d’un même cœur.',
    amens: 42,
    date: Date.now() - 1000 * 60 * 60 * 24 * 12,
    couleur: 'vert',
    attache: 'scotch',
    rotation: '-rotate-1',
  },
  {
    id: 'tem_4',
    auteur: 'Jonathan D.',
    ficheId: 5,
    texte: 'Mon identité n’est plus dans mon passé mais dans la justice que Christ m’a donnée.',
    amens: 19,
    date: Date.now() - 1000 * 60 * 60 * 24 * 2,
    couleur: 'orange',
    attache: 'punaise-metal',
    rotation: 'rotate-2',
  },
  {
    id: 'tem_5',
    auteur: 'Déborah B.',
    ficheId: 9,
    texte: 'La paix profonde du Saint-Esprit est devenue mon refuge au quotidien.',
    amens: 31,
    date: Date.now() - 1000 * 60 * 60 * 24 * 5,
    couleur: 'blanc',
    attache: 'punaise-bois',
    rotation: '-rotate-3',
  },
  {
    id: 'tem_6',
    auteur: 'David L.',
    ficheId: 10,
    texte: 'Le revêtement de puissance pour témoigner avec hardiesse et amour.',
    amens: 15,
    date: Date.now() - 1000 * 60 * 60 * 24 * 8,
    couleur: 'jaune',
    attache: 'scotch',
    rotation: 'rotate-1',
  },
  {
    id: 'tem_7',
    auteur: 'Priscille & Aquilas',
    ficheId: 14,
    texte: 'Le Royaume de Dieu s’est manifesté au milieu de nos échanges de groupe.',
    amens: 27,
    date: Date.now() - 1000 * 60 * 60 * 24 * 10,
    couleur: 'rose',
    attache: 'punaise-metal',
    rotation: '-rotate-2',
  },
];

const CLE_STOCKAGE_TEMOIGNAGES = 'lf.temoignagesCommunautes';

function lireLocal(): TemoignageItem[] {
  if (typeof window === 'undefined') return TEMOIGNAGES_INITIAUX;
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE_TEMOIGNAGES);
    if (!brut) return TEMOIGNAGES_INITIAUX;
    const data = JSON.parse(brut);
    return Array.isArray(data) && data.length > 0 ? data : TEMOIGNAGES_INITIAUX;
  } catch {
    return TEMOIGNAGES_INITIAUX;
  }
}

function ecrireLocal(liste: TemoignageItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLE_STOCKAGE_TEMOIGNAGES, JSON.stringify(liste));
  } catch {
    /* ignorer */
  }
}

/**
 * Abonnement en temps réel aux témoignages partagés sur Firestore.
 * Émet immédiatement les données locales en cache (0ms) puis écoute le serveur distant.
 */
export function abonnerTemoignages(
  userUid: string | undefined,
  callback: (liste: TemoignageItem[]) => void
): () => void {
  // 1. Émission immédiate du cache local
  const enCache = lireLocal();
  callback(enCache);

  if (!hasRemoteBackend()) {
    return () => {};
  }

  let desabonnerSnapshot: (() => void) | null = null;
  let actif = true;

  void (async () => {
    try {
      const [db, { collection, onSnapshot, query, orderBy, limit }] = await Promise.all([
        getFirebaseDb(),
        import('firebase/firestore'),
      ]);

      if (!actif) return;

      const colRef = collection(db, 'temoignages');
      const q = query(colRef, orderBy('date', 'desc'), limit(100));

      desabonnerSnapshot = onSnapshot(
        q,
        (snapshot) => {
          if (!actif) return;
          const distants: TemoignageItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as TemoignageItem;
            const aVote = userUid && data.amensVotants ? data.amensVotants.includes(userUid) : false;
            distants.push({
              ...data,
              id: docSnap.id,
              aVote: aVote || data.aVote,
            });
          });

          // Fusion avec les témoignages initiaux (pour toujours avoir du contenu riche)
          const idsDistants = new Set(distants.map((d) => d.id));
          const fusion = [...distants, ...TEMOIGNAGES_INITIAUX.filter((init) => !idsDistants.has(init.id))];

          ecrireLocal(fusion);
          callback(fusion);
        },
        (err) => {
          console.warn('Échec écoute temps réel des témoignages (fallback local utilisé) :', err);
        }
      );
    } catch (e) {
      console.warn('Initialisation synchronisation témoignages :', e);
    }
  })();

  return () => {
    actif = false;
    if (desabonnerSnapshot) desabonnerSnapshot();
  };
}

/**
 * Publie un témoignage (audio ou texte) sur Firestore et met à jour le cache local.
 */
/**
 * Un document Firestore ne peut dépasser 1 Mio, et l'audio y voyage en
 * base64 — qui gonfle d'un tiers. Au-delà, l'écriture est refusée et le
 * témoignage ne quitte jamais l'appareil.
 */
const LIMITE_DOCUMENT = 1_048_576;
/** On garde de la marge pour les autres champs et l'encodage. */
const LIMITE_AUDIO = 700_000;

export type IssuePublication =
  | { partage: true }
  | { partage: false; raison: 'trop_long' | 'hors_ligne' | 'refus' };

export async function publierTemoignage(temoignage: TemoignageItem): Promise<IssuePublication> {
  const actuels = lireLocal();
  const maj = [temoignage, ...actuels.filter((t) => t.id !== temoignage.id)];
  ecrireLocal(maj);

  if (!hasRemoteBackend()) return { partage: false, raison: 'hors_ligne' };

  // Vérifié avant l'envoi : sinon Firestore refuse, et l'échec passait
  // inaperçu — le témoignage restait sur le seul appareil de son auteur.
  const poids = (temoignage.audioUrl?.length ?? 0) + (temoignage.texte?.length ?? 0);
  if ((temoignage.audioUrl?.length ?? 0) > LIMITE_AUDIO || poids > LIMITE_DOCUMENT) {
    return { partage: false, raison: 'trop_long' };
  }

  try {
    const [db, { doc, setDoc }] = await Promise.all([
      getFirebaseDb(),
      import('firebase/firestore'),
    ]);

    const docRef = doc(db, 'temoignages', temoignage.id);
    await setDoc(docRef, {
      id: temoignage.id,
      auteur: temoignage.auteur,
      auteurId: temoignage.auteurId || null,
      ficheId: temoignage.ficheId || 1,
      texte: temoignage.texte || '',
      audioUrl: temoignage.audioUrl || null,
      amens: temoignage.amens || 1,
      amensVotants: temoignage.auteurId ? [temoignage.auteurId] : [],
      date: temoignage.date || Date.now(),
      couleur: temoignage.couleur || 'rose',
      attache: temoignage.attache || 'punaise-bois',
      rotation: temoignage.rotation || '-rotate-2',
    });
    return { partage: true };
  } catch (err) {
    console.error('Erreur publication témoignage sur Firestore :', err);
    return { partage: false, raison: 'refus' };
  }
}

/**
 * Supprime un témoignage de Firestore et du cache local.
 */
export async function supprimerTemoignage(id: string): Promise<boolean> {
  const actuels = lireLocal();
  const maj = actuels.filter((t) => t.id !== id);
  ecrireLocal(maj);

  if (!hasRemoteBackend()) return true;

  try {
    const [db, { doc, deleteDoc }] = await Promise.all([
      getFirebaseDb(),
      import('firebase/firestore'),
    ]);

    const docRef = doc(db, 'temoignages', id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Erreur suppression témoignage sur Firestore :', err);
    return false;
  }
}

/**
 * Vote ou retire un Amen sur un témoignage partagé.
 */
export async function voterAmen(
  id: string,
  userUid?: string
): Promise<{ amens: number; aVote: boolean }> {
  const actuels = lireLocal();
  let nouveauScore = 1;
  let nouvelEtatVote = false;

  const maj = actuels.map((t) => {
    if (t.id === id) {
      const aVote = !t.aVote;
      const amens = aVote ? t.amens + 1 : Math.max(0, t.amens - 1);
      nouveauScore = amens;
      nouvelEtatVote = aVote;
      return { ...t, amens, aVote };
    }
    return t;
  });

  ecrireLocal(maj);

  if (hasRemoteBackend()) {
    try {
      const [db, { doc, updateDoc, increment, arrayUnion, arrayRemove }] = await Promise.all([
        getFirebaseDb(),
        import('firebase/firestore'),
      ]);

      const docRef = doc(db, 'temoignages', id);
      if (nouvelEtatVote) {
        await updateDoc(docRef, {
          amens: increment(1),
          ...(userUid ? { amensVotants: arrayUnion(userUid) } : {}),
        });
      } else {
        await updateDoc(docRef, {
          amens: increment(-1),
          ...(userUid ? { amensVotants: arrayRemove(userUid) } : {}),
        });
      }
    } catch (err) {
      console.warn('Erreur mise à jour Amen sur Firestore :', err);
    }
  }

  return { amens: nouveauScore, aVote: nouvelEtatVote };
}

export function reinitialiserTableauLocal(): TemoignageItem[] {
  ecrireLocal(TEMOIGNAGES_INITIAUX);
  return TEMOIGNAGES_INITIAUX;
}
