/**
 * Domaine « Les Fondements » — parcours personnel + parcours de groupe.
 *
 * Règle structurante du livret (p. 3) : le parcours se vit en petit groupe de
 * 5 à 6 personnes, chaque fiche est préparée seul à la maison, puis partagée
 * lors d'une rencontre hebdomadaire. Tant qu'une personne n'appartient pas à
 * un groupe, le parcours reste fermé.
 */

export const GROUP_DEFAULT_CAPACITY = 6;
export const GROUP_MIN_CAPACITY = 4;
export const GROUP_MAX_CAPACITY = 8;
export const PARCOURS_TOTAL_STEPS = 20;

// ─────────────────────────────────────────────────────────────
// Localisation
// ─────────────────────────────────────────────────────────────

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface PlaceRef extends GeoPoint {
  /** Libellé affiché : « Lyon, France » */
  label: string;
  city: string;
  region?: string;
  country: string;
  countryCode: string;
  /** true si les coordonnées viennent du GPS du navigateur */
  precise?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Groupe
// ─────────────────────────────────────────────────────────────

export type GroupMeetingMode = 'presentiel' | 'ligne' | 'hybride';
export type GroupRhythm = 'hebdomadaire' | 'bimensuel';
export type GroupVisibility = 'ouvert' | 'sur_demande' | 'prive';

export interface GroupMeetingPlan {
  mode: GroupMeetingMode;
  rhythm: GroupRhythm;
  /** 0 = dimanche … 6 = samedi */
  weekday: number;
  /** « 20:00 » */
  time: string;
  timezone: string;
  /** Lien visio (Meet, Zoom, Jitsi…) utilisé par les membres à distance */
  callLink?: string;
  /** Adresse du lieu physique, visible des seuls membres approuvés */
  venue?: string;
}

export interface ParcoursGroup {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  visibility: GroupVisibility;
  capacity: number;
  membersCount: number;
  leaderId: string;
  leaderName: string;
  place: PlaceRef;
  meeting: GroupMeetingPlan;
  language: string;
  createdAt: number;
  /** Fiche ouverte pour tout le groupe (1 → 20). */
  currentStep: number;
  /** Où en est la fiche courante dans son cycle. */
  stepPhase: StepPhase;
  /** Date d'ouverture de la fiche courante (ms). */
  stepOpenedAt: number;
  /** Fiche terminées et clôturées par l'animateur. */
  closedSteps: number[];
  /** Le parcours est achevé (fiche 20 clôturée). */
  completedAt?: number;
  archived?: boolean;
  /** Groupe d'exemple généré localement tant qu'aucun backend n'est branché. */
  demo?: boolean;
}

/**
 * Cycle d'une fiche, identique pour tous les membres :
 *   preparation → chacun travaille la fiche chez soi
 *   rencontre   → la rencontre du groupe est ouverte (présentiel + visio)
 *   cloture     → l'animateur a clos la fiche, la suivante s'ouvre
 */
export type StepPhase = 'preparation' | 'rencontre' | 'cloture';

// ─────────────────────────────────────────────────────────────
// Membres
// ─────────────────────────────────────────────────────────────

export type MemberRole = 'animateur' | 'co_animateur' | 'membre';
export type MemberStatus = 'invite' | 'en_attente' | 'actif' | 'refuse' | 'parti';
export type AttendanceMode = 'presentiel' | 'ligne' | 'absent';

export interface GroupMember {
  uid: string;
  groupId: string;
  displayName: string;
  email: string | null;
  photoURL?: string | null;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: number;
  /** Message écrit lors de la demande d'adhésion. */
  requestMessage?: string;
  /** Distance approximative (km) entre le membre et le groupe au moment de la demande. */
  distanceKm?: number;
  /** Fiches que le membre a préparées personnellement. */
  preparedSteps: number[];
  /** Dernière fiche ouverte personnellement. */
  personalStep: number;
  /** Mode de présence annoncé pour la prochaine rencontre. */
  nextAttendance?: AttendanceMode;
  lastSeenAt?: number;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  email: string;
  invitedBy: string;
  invitedByName: string;
  createdAt: number;
  status: 'envoye' | 'accepte' | 'expire';
}

// ─────────────────────────────────────────────────────────────
// Rencontres
// ─────────────────────────────────────────────────────────────

export type SessionStatus = 'planifiee' | 'ouverte' | 'terminee';

export interface GroupSession {
  id: string;
  groupId: string;
  step: number;
  scheduledAt: number;
  status: SessionStatus;
  openedAt?: number;
  closedAt?: number;
  closedBy?: string;
  /** Étape du déroulé animé en direct (voir MEETING_FLOW). */
  liveStage: number;
  /** Membre à qui la parole est donnée pendant le tour de partage. */
  speakingUid?: string | null;
  attendance: Record<string, AttendanceMode>;
  /** Notes de l'animateur, visibles par le groupe après la rencontre. */
  notes?: string;
  /** Sujets de prière relevés pendant la rencontre. */
  prayerFocus?: string[];
  /** Compte rendu pastoral bref, destiné en particulier aux absents. */
  recap?: {
    summary: string;
    highlights: string[];
    prayerFocus: string[];
    nextStep?: string;
    createdAt: number;
  };
}

// ─────────────────────────────────────────────────────────────
// Profil utilisateur (au-delà de l'auth)
// ─────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL?: string | null;
  place?: PlaceRef;
  /** Groupe actif. null tant que la personne n'a pas rejoint / créé un groupe. */
  groupId: string | null;
  membershipStatus: MemberStatus | null;
  role: MemberRole | null;
  createdAt: number;
  onboardingCompletedAt?: number;
  /** Préférence de présence par défaut. */
  preferredAttendance?: AttendanceMode;
  bio?: string;
}

// ─────────────────────────────────────────────────────────────
// Vie du groupe (mur de prière, partages, pépites)
// ─────────────────────────────────────────────────────────────

export type GroupPostKind = 'priere' | 'partage' | 'pepite' | 'annonce' | 'louange';

export interface GroupPost {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  kind: GroupPostKind;
  step?: number;
  questionId?: string;
  reference?: string;
  content: string;
  createdAt: number;
  prayedBy: string[];
  amenBy: string[];
  answered?: boolean;
  answeredAt?: number;
}

// ─────────────────────────────────────────────────────────────
// Résultats d'appariement géographique
// ─────────────────────────────────────────────────────────────

export interface GroupMatch {
  group: ParcoursGroup;
  distanceKm: number | null;
  seatsLeft: number;
  /** Le groupe n'a pas encore commencé, ou en est encore aux premières fiches. */
  joinable: boolean;
  reason?: string;
}
