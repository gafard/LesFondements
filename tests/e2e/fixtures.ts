import type { Locator, Page } from '@playwright/test';

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

export async function semerSession(page: Page, options?: { avecGroupe?: boolean; personnel?: boolean; etape?: number; fichesTerminees?: number[] }): Promise<void> {
  const avecGroupe = options?.avecGroupe ?? true;
  await page.addInitScript(
    ({ utilisateur, groupe, membres, groupeActif, personnel, fichesTerminees }) => {
      localStorage.clear();
      localStorage.setItem('lesfondements_local_user', JSON.stringify(utilisateur));
      localStorage.setItem(
        `lf.profile.${utilisateur.uid}`,
        JSON.stringify({
          ...utilisateur,
          photoURL: null,
          studyMode: personnel ? 'personnel' : 'cellule',
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
      localStorage.setItem(`lesfondements_prog_${utilisateur.uid}`, JSON.stringify(Object.fromEntries(fichesTerminees.map(id => [id, { completed: true, answers: {}, lastUpdated: Date.now() }]))));
      localStorage.setItem('lf.demoSeeded', 'true');
      localStorage.setItem('lf.mesure.consentement', 'refuse');
    },
    { utilisateur: UTILISATEUR, groupe: { ...GROUPE, currentStep: options?.etape ?? 1 }, membres: MEMBRES, groupeActif: avecGroupe, personnel: options?.personnel ?? false, fichesTerminees: options?.fichesTerminees ?? [] }
  );
}

/**
 * Déposer les notes de la méditation, dans l'ordre.
 *
 * Les questions ne sont plus toutes ouvertes en même temps : une note est
 * devant, les suivantes attendent derrière. On écrit, on avance d'une
 * feuille. Les tests de parcours vérifient la traversée, pas la formulation
 * des questions — celle-ci change avec le livret et se contrôle ailleurs.
 */
export async function deposerLesNotes(page: Page, reponses: string[]): Promise<void> {
  for (let rang = 0; rang < reponses.length; rang += 1) {
    await page.locator('textarea').first().fill(reponses[rang]);
    if (rang === reponses.length - 1) break;
    const suivante = page.getByRole('button', { name: 'Suivante' });
    if (!(await suivante.count()) || !(await suivante.isEnabled())) break;
    await suivante.click();
  }
}

/**
 * Avancer dans la pile jusqu'à ce que le repère cherché soit devant.
 *
 * Rend `true` s'il a été trouvé. Sert à vérifier qu'une étiquette d'origine
 * — 📖 la Parole, 📘 le livret — figure bien quelque part dans la section,
 * sans dépendre du rang qu'elle y occupe.
 */
export async function chercherDansLaPile(
  page: Page,
  cible: Locator,
  bornes = 14
): Promise<boolean> {
  for (let essai = 0; essai < bornes; essai += 1) {
    if (await cible.count()) return true;
    const suivante = page.getByRole('button', { name: 'Suivante' });
    if (!(await suivante.count()) || !(await suivante.isEnabled())) return false;
    await suivante.click();
  }
  return false;
}
