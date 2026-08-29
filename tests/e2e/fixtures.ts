import type { Page } from '@playwright/test';

export const UTILISATEUR = {
  uid: 'e2e-alice',
  email: 'alice.e2e@example.test',
  displayName: 'Alice',
};

export const GROUPE = {
  id: 'groupe-e2e',
  name: 'Cellule E2E',
  description: 'Un groupe de vérification locale.',
  inviteCode: 'FOND-E2E45',
  visibility: 'sur_demande',
  capacity: 6,
  membersCount: 2,
  leaderId: UTILISATEUR.uid,
  leaderName: UTILISATEUR.displayName,
  place: {
    lat: 6.1256,
    lng: 1.2254,
    label: 'Lomé, Togo',
    city: 'Lomé',
    country: 'Togo',
    countryCode: 'TG',
    precise: false,
  },
  meeting: {
    mode: 'presentiel',
    rhythm: 'hebdomadaire',
    weekday: 4,
    time: '19:00',
    timezone: 'Africa/Lome',
    venue: 'Salle E2E',
  },
  language: 'fr',
  createdAt: 1_700_000_000_000,
  currentStep: 1,
  stepPhase: 'preparation',
  stepOpenedAt: 1_700_000_000_000,
  closedSteps: [],
};

export const MEMBRES = [
  {
    uid: UTILISATEUR.uid,
    groupId: GROUPE.id,
    displayName: UTILISATEUR.displayName,
    email: UTILISATEUR.email,
    role: 'animateur',
    status: 'actif',
    joinedAt: 1_700_000_000_000,
    preparedSteps: [],
    personalStep: 1,
    nextAttendance: 'presentiel',
  },
  {
    uid: 'e2e-bob',
    groupId: GROUPE.id,
    displayName: 'Bob',
    email: 'bob.e2e@example.test',
    role: 'membre',
    status: 'actif',
    joinedAt: 1_700_000_000_100,
    preparedSteps: [1],
    personalStep: 1,
    nextAttendance: 'absent',
  },
];

export async function semerSession(page: Page, options?: { avecGroupe?: boolean }): Promise<void> {
  const avecGroupe = options?.avecGroupe ?? true;
  await page.addInitScript(
    ({ utilisateur, groupe, membres, groupeActif }) => {
      localStorage.clear();
      localStorage.setItem('lesfondements_local_user', JSON.stringify(utilisateur));
      localStorage.setItem(
        `lf.profile.${utilisateur.uid}`,
        JSON.stringify({
          ...utilisateur,
          photoURL: null,
          groupId: groupeActif ? groupe.id : null,
          membershipStatus: groupeActif ? 'actif' : null,
          role: groupeActif ? 'animateur' : null,
          createdAt: 1_700_000_000_000,
          place: groupe.place,
          onboardingCompletedAt: 1_700_000_000_000,
        })
      );
      localStorage.setItem('lf.groups', JSON.stringify(groupeActif ? [groupe] : []));
      if (groupeActif) {
        localStorage.setItem(`lf.members.${groupe.id}`, JSON.stringify(membres));
        localStorage.setItem(`lf.sessions.${groupe.id}`, JSON.stringify([]));
      }
      localStorage.setItem('lf.demoSeeded', 'true');
      localStorage.setItem('lf.mesure.consentement', 'refuse');
    },
    { utilisateur: UTILISATEUR, groupe: GROUPE, membres: MEMBRES, groupeActif: avecGroupe }
  );
}
