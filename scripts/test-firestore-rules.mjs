import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

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
    await setDoc(doc(db, 'groups/g1/members/carla'), {
      ...membre('carla'),
      status: 'en_attente',
    });
    await setDoc(doc(db, 'groups/g1/posts/p1'), {
      id: 'p1', groupId: 'g1', authorId: 'alice', authorName: 'Alice', kind: 'priere',
      content: 'Priez pour moi', createdAt: 1, prayedBy: [], amenBy: [],
    });
    await setDoc(doc(db, 'groups/g1/sessions/s1'), {
      id: 's1', groupId: 'g1', step: 1, scheduledAt: 2, status: 'planifiee', liveStage: 0,
      attendance: {},
    });
    await setDoc(doc(db, 'temoignages/t1'), {
      id: 't1', auteur: 'Alice', auteurId: 'alice', ficheId: 1, texte: 'Une grâce reçue',
      audioUrl: null, amens: 1, amensVotants: ['alice'], date: 1,
      couleur: 'rose', attache: 'punaise-bois', rotation: '-rotate-2',
    });
  });

  const alice = environnement.authenticatedContext('alice', { email: 'alice@example.test', auth_time: 1788626251 }).firestore();
  const bob = environnement.authenticatedContext('bob', { email: 'bob@example.test', auth_time: 1788626251 }).firestore();
  const anonyme = environnement.unauthenticatedContext().firestore();
  const ancienneSession = environnement.authenticatedContext('alice', { email: 'alice@example.test', auth_time: 1788626250 }).firestore();
  await assertFails(setDoc(doc(ancienneSession, 'users/alice/progress/1'), { completed: true, answers: {} }));
  await assertFails(setDoc(doc(ancienneSession, 'profiles/alice'), { uid: 'alice' }));

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

  // La réparation d'annuaire ne s'ouvre qu'à l'animateur : un membre simple
  // qui republierait pourrait remettre en ligne un groupe archivé.
  await assertFails(setDoc(doc(bob, 'groupDirectory/g1'), annuaireValide));

  await assertFails(updateDoc(doc(bob, 'groups/g1'), { membersCount: 1 }));
  await assertSucceeds(updateDoc(doc(bob, 'groups/g1'), { membersCount: 2 }));
  // Chacun corrige son nom sur sa propre ligne, et sur la sienne seulement.
  await assertSucceeds(updateDoc(doc(bob, 'groups/g1/members/bob'), { displayName: 'Bob N.' }));
  await assertFails(updateDoc(doc(bob, 'groups/g1/members/alice'), { displayName: 'Bob' }));
  await assertFails(updateDoc(doc(bob, 'groups/g1/members/bob'), { displayName: '' }));
  await assertFails(
    updateDoc(doc(bob, 'groups/g1/members/bob'), { displayName: 'Bob', role: 'animateur' })
  );

  // Accueillir quelqu'un date son entrée : c'est cette écriture-là que les
  // règles refusaient, et l'animateur ne pouvait donc accepter personne.
  await assertSucceeds(
    updateDoc(doc(alice, 'groups/g1/members/carla'), { status: 'actif', joinedAt: 99 })
  );
  // Une fois membre, sa date d'entrée ne se réécrit plus.
  await assertFails(updateDoc(doc(alice, 'groups/g1/members/bob'), { joinedAt: 42 }));

  await assertFails(updateDoc(doc(bob, 'groups/g1/members/bob'), { role: 'animateur' }));
  await assertFails(updateDoc(doc(bob, 'groups/g1/members/bob'), { status: 'actif', role: 'co_animateur' }));
  await assertFails(getDoc(doc(bob, 'profiles/alice')));
  await assertFails(setDoc(doc(bob, 'users/alice/progress/1'), { completed: true, answers: {} }));
  await assertFails(deleteDoc(doc(bob, 'profiles/alice')));

  await assertFails(
    setDoc(doc(bob, 'groups/g1/sessions/malveillante'), {
      id: 'malveillante', groupId: 'g1', step: 1, scheduledAt: 2, status: 'planifiee',
      liveStage: 0, attendance: {}, closedBy: 'bob', recap: { summary: 'Injecté' },
    })
  );
  await assertSucceeds(
    setDoc(doc(bob, 'groups/g1/sessions/s2'), {
      id: 's2', groupId: 'g1', step: 1, scheduledAt: 2, status: 'planifiee',
      liveStage: 0, attendance: {},
    })
  );
  await assertFails(updateDoc(doc(bob, 'groups/g1/sessions/s1'), { attendance: { alice: 'absent' } }));
  await assertFails(updateDoc(doc(bob, 'groups/g1/sessions/s1'), { attendance: { bob: 'administrateur' } }));
  await assertSucceeds(updateDoc(doc(bob, 'groups/g1/sessions/s1'), { attendance: { bob: 'absent' } }));

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

  const signalement = {
    id: 'report-1', reporterUid: 'bob', targetType: 'temoignage', targetId: 't1',
    reason: 'vie_privee', comment: 'Une adresse est visible.', status: 'en_attente', createdAt: 3,
  };
  await assertSucceeds(setDoc(doc(bob, 'moderationReports/report-1'), signalement));
  await assertFails(setDoc(doc(bob, 'moderationReports/report-2'), { ...signalement, id: 'report-2', reporterUid: 'alice' }));
  await assertFails(setDoc(doc(anonyme, 'moderationReports/report-3'), { ...signalement, id: 'report-3' }));
  await assertFails(getDoc(doc(bob, 'moderationReports/report-1')));

  const usage = {
    id: 'installation-e2e:fiche_1', installationId: 'installation-e2e-0000000001',
    event: 'fiche_1', day: '2026-08-28', createdAt: 10, expiresAt: 1000, version: 'test',
  };
  await assertSucceeds(setDoc(doc(bob, 'usageEvents/installation-e2e:fiche_1'), usage));
  await assertSucceeds(setDoc(doc(bob, 'usageEvents/installation-e2e:rituel'), {
    ...usage, id: 'installation-e2e:rituel', event: 'rituel',
  }));
  await assertFails(setDoc(doc(anonyme, 'usageEvents/anonymous'), { ...usage, id: 'anonymous' }));
  await assertFails(setDoc(doc(bob, 'usageEvents/extra'), { ...usage, id: 'extra', email: 'bob@example.test' }));
  await assertFails(getDoc(doc(bob, 'usageEvents/installation-e2e:fiche_1')));

  await assertSucceeds(
    updateDoc(doc(bob, 'groups/g1/members/bob'), {
      status: 'parti', displayName: 'Compte supprimé', email: null, photoURL: null,
    })
  );

  console.log('Règles Firestore vérifiées : droits, rencontres, données privées, modération et mesure minimale.');
} finally {
  await environnement.cleanup();
}
