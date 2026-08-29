import {
  PARCOURS_TOTAL_STEPS,
  type GroupMeetingPlan,
  type GroupMember,
  type ParcoursGroup,
  type UserProfile,
} from './types';

/** Déroulé d'une rencontre, calqué sur la partie « Résumé et Partage » du livret. */
export const MEETING_FLOW = [
  {
    key: 'accueil',
    title: 'Accueil et prière d’ouverture',
    hint: "Quelques minutes pour se retrouver, prendre des nouvelles et confier la rencontre au Seigneur.",
    minutes: 10,
  },
  {
    key: 'retour',
    title: 'Retour sur la semaine',
    hint: "Ce que chacun a vécu depuis la dernière fois : une joie, une difficulté, un pas franchi.",
    minutes: 10,
  },
  {
    key: 'partage',
    title: 'Tour de partage sur la fiche',
    hint: "Chacun dit ce qui l’a marqué. Pas de cours magistral : chacun a déjà travaillé la fiche chez lui.",
    minutes: 25,
  },
  {
    key: 'questions',
    title: 'Les questions de la fiche',
    hint: 'On reprend une à une les questions du « Résumé et Partage » et on laisse la parole circuler.',
    minutes: 25,
  },
  {
    key: 'application',
    title: 'Un pas concret pour la semaine',
    hint: 'Chacun formule à voix haute une application précise, que le groupe portera dans la prière.',
    minutes: 10,
  },
  {
    key: 'priere',
    title: 'Temps de prière',
    hint: 'Prière les uns pour les autres. Aux fiches 7, 8 et 10, prévoir un temps personnel plus long.',
    minutes: 15,
  },
] as const;

export const MEETING_FLOW_LENGTH = MEETING_FLOW.length;

/** Prochaine occurrence du créneau hebdomadaire (ou bimensuel) du groupe. */
export function nextMeetingDate(meeting: GroupMeetingPlan, from: number = Date.now()): Date {
  const [hours, minutes] = (meeting.time || '20:00').split(':').map((nombre) => parseInt(nombre, 10));
  const dateFixee = meeting.nextMeetingDate || meeting.firstMeetingDate;

  if (dateFixee) {
    const parts = dateFixee.split('-');
    if (parts.length === 3) {
      const date = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
        hours || 20,
        minutes || 0,
        0,
        0
      );
      if (date.getTime() >= from - 3_600_000 * 2) return date;
    }
  }

  const date = new Date(from);
  date.setHours(hours || 20, minutes || 0, 0, 0);
  const cadence = meeting.rhythm === 'bimensuel' ? 14 : 7;
  let delta = (meeting.weekday - date.getDay() + 7) % 7;
  if (delta === 0 && date.getTime() <= from) delta = cadence;
  date.setDate(date.getDate() + delta);
  return date;
}

export type ParcoursGate =
  | { state: 'chargement' }
  | { state: 'sans_groupe' }
  | { state: 'en_attente'; group: ParcoursGroup }
  | { state: 'refuse' }
  | {
      state: 'ouvert';
      group: ParcoursGroup;
      unlockedStep: number;
      preparationStep: number;
    }
  | { state: 'termine'; group: ParcoursGroup };

export function computeGate(
  profile: UserProfile | null,
  group: ParcoursGroup | null,
  membership: GroupMember | null
): ParcoursGate {
  if (!profile) return { state: 'chargement' };
  if (!profile.groupId || !group) return { state: 'sans_groupe' };
  if (membership?.status === 'refuse' || membership?.status === 'parti') return { state: 'refuse' };
  if (!membership || membership.status !== 'actif') return { state: 'en_attente', group };
  if (group.completedAt) return { state: 'termine', group };
  return {
    state: 'ouvert',
    group,
    unlockedStep: group.currentStep,
    preparationStep: etapeDePreparation(group),
  };
}

/** La fiche du groupe : celle dont les réponses se partagent à la rencontre. */
export function isStepUnlocked(group: ParcoursGroup, step: number): boolean {
  return step <= group.currentStep;
}

/** Une fiche d'avance peut être préparée seul, jamais davantage. */
export function etapeDePreparation(group: ParcoursGroup): number {
  return Math.min(group.currentStep + 1, PARCOURS_TOTAL_STEPS);
}

export function estEtapeLisible(group: ParcoursGroup, step: number): boolean {
  return step <= etapeDePreparation(group);
}
