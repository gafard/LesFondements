import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const regles = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
const environnement = await initializeTestEnvironment({
  projectId: 'lesfondements-rules-test',
  firestore: { rules: regles },
});

const groupe = {
  id: 'g1',
  name: 'Groupe test',
  description: '',
  inviteCode: 'SECRET1',
  visibility: 'sur_demande',
  capacity: 6,
  membersCount: 3,
  leaderId: 'alice',
  leaderName: 'Alice',
  place: { lat: 6.1, lng: 1.2, label: 'Lomé', city: 'Lomé', country: 'Togo', countryCode: 'TG' },
  meeting: { mode: 'presentiel', rhythm: 'hebdomadaire', weekday: 2, time: '19:00', timezone: 'Africa/Lome' },
  language: 'fr',
  createdAt: 1,
  currentStep: 1,
  stepPhase: 'preparation',
  stepOpenedAt: 1,
  closedSteps: [],
};

const membre = (uid, role = 'membre') => ({
  uid,
  groupId: 'g1',
  displayName: uid,
  email: `${uid}@example.test`,
  role,
  status: 'actif',
  joinedAt: 1,
  preparedSteps: [],
  personalStep: 1,
});

try {
  await environnement.withSecurityRulesDisabled(async (contexte) => {
    const db = contexte.firestore();
    await setDoc(doc(db, 'groups/g1'), groupe);
    await setDoc(doc(db, 'groups/g1/members/alice'), membre('alice', 'animateur'));
    await setDoc(doc(db, 'groups/g1/members/bob'), membre('bob'));
    await setDoc(doc(db, 'groups/g1/posts/p1'), {
      id: 'p1', groupId: 'g1', authorId: 'alice', authorName: 'Alice', kind: 'priere',
      content: 'Priez pour moi', createdAt: 1, prayedBy: [], amenBy: [],
    });
    await setDoc(doc(db, 'temoignages/t1'), {
      id: 't1', auteur: 'Alice', auteurId: 'alice', ficheId: 1, texte: 'Une grâce reçue',
      audioUrl: null, amens: 1, amensVotants: ['alice'], date: 1,
      couleur: 'rose', attache: 'punaise-bois', rotation: '-rotate-2',
    });
  });

  const alice = environnement.authenticatedContext('alice', { email: 'alice@example.test' }).firestore();
  const bob = environnement.authenticatedContext('bob', { email: 'bob@example.test' }).firestore();
  const anonyme = environnement.unauthenticatedContext().firestore();

  const annuaireValide = {
    ...groupe,
    inviteCode: '',
    leaderId: '',
    place: { ...groupe.place, lat: 6.1, lng: 1.2, precise: false },
    meeting: { ...groupe.meeting },
  };
  await assertSucceeds(setDoc(doc(alice, 'groupDirectory/g1'), annuaireValide));
  await assertFails(
    setDoc(doc(alice, 'groupDirectory/g1'), {
      ...annuaireValide,
      meeting: { ...annuaireValide.meeting, venue: 'Adresse privée' },
    })
  );

  await assertFails(updateDoc(doc(bob, 'groups/g1'), { membersCount: 1 }));
  await assertSucceeds(updateDoc(doc(bob, 'groups/g1'), { membersCount: 2 }));

  await assertSucceeds(updateDoc(doc(alice, 'groups/g1/posts/p1'), { prayedBy: ['alice'] }));
  await assertFails(updateDoc(doc(bob, 'groups/g1/posts/p1'), { prayedBy: ['alice', 'charlie'] }));
  await assertFails(
    updateDoc(doc(bob, 'groups/g1/posts/p1'), {
      replies: [{ id: 'r1', authorId: 'alice', authorName: 'Alice', content: 'Faux', createdAt: 2 }],
    })
  );
  await assertSucceeds(
    updateDoc(doc(bob, 'groups/g1/posts/p1'), {
      replies: [{ id: 'r2', authorId: 'bob', authorName: 'Bob', content: 'Je prie avec toi', createdAt: 2 }],
    })
  );

  await assertFails(updateDoc(doc(alice, 'temoignages/t1'), { amens: 99 }));
  await assertSucceeds(updateDoc(doc(bob, 'temoignages/t1'), { amens: 2, amensVotants: ['alice', 'bob'] }));
  await assertFails(
    setDoc(doc(bob, 'temoignages/t2'), {
      id: 't2', auteur: 'Alice', auteurId: 'alice', ficheId: 1, texte: 'Usurpation',
      audioUrl: null, amens: 1, amensVotants: ['alice'], date: 1,
      couleur: 'rose', attache: 'punaise-bois', rotation: '-rotate-2',
    })
  );

  const retour = {
    uid: null, nom: 'Visiteur', email: 'visiteur@example.test', categorie: 'suggestion',
    message: 'Une idée utile', date: Date.now(), dateIso: new Date().toISOString(),
  };
  await assertSucceeds(setDoc(doc(anonyme, 'retours/r1'), retour));
  await assertFails(getDoc(doc(anonyme, 'retours/r1')));
  await assertFails(getDoc(doc(alice, 'retours/r1')));
  await assertFails(setDoc(doc(anonyme, 'retours/r2'), { ...retour, categorie: 'inconnue' }));

  console.log('Règles Firestore vérifiées : annuaire, compteur, réactions, réponses, témoignages et retours.');
} finally {
  await environnement.cleanup();
}
