/**
 * Source de vérité du parcours : profils, groupes, adhésions, rencontres,
 * mur du groupe.
 *
 * Deux modes, strictement la même API :
 *  · Firestore quand `NEXT_PUBLIC_FIREBASE_API_KEY` contient une vraie clé ;
 *  · localStorage sinon — l'application reste entièrement utilisable, et un
 *    annuaire de groupes de démonstration est semé autour de la position de
 *    l'utilisateur pour que l'appariement géographique soit démontrable.
 *    Ces groupes portent `demo: true` et sont signalés comme tels dans l'UI.
 */

'use client';

import {
  GROUP_DEFAULT_CAPACITY,
  PARCOURS_TOTAL_STEPS,
  type AttendanceMode,
  type GroupInvite,
  type GroupMatch,
  type GroupMember,
  type GroupMeetingPlan,
  type GroupPost,
  type GroupPostKind,
  type GroupSession,
  type GroupVisibility,
  type MemberRole,
  type ParcoursGroup,
  type PlaceRef,
  type UserProfile,
} from './types';
import { distanceKm, nearestPlace } from './geo';
import { marquerSynchronisation } from './syncState';

// ─────────────────────────────────────────────────────────────
// Détection du backend
// ─────────────────────────────────────────────────────────────

export const hasRemoteBackend = (): boolean => {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return !!apiKey && !apiKey.includes('your-') && apiKey !== 'your-api-key';
};

/**
 * Toutes les opérations ponctuelles passent par une limite de temps. On les
 * enrobe ici, à la source, plutôt qu'à chacun des appels : impossible d'en
 * oublier un. `onSnapshot` n'est pas concerné — c'est un abonnement, il n'a
 * pas vocation à se terminer.
 */
type Firestore = typeof import('firebase/firestore');

function borner(f: Firestore): Firestore {
  return {
    ...f,
    getDoc: ((...args: Parameters<Firestore['getDoc']>) =>
      avecDelai(f.getDoc(...args), 'lecture')) as Firestore['getDoc'],
    getDocs: ((...args: Parameters<Firestore['getDocs']>) =>
      avecDelai(f.getDocs(...args), 'lecture')) as Firestore['getDocs'],
    setDoc: ((...args: Parameters<Firestore['setDoc']>) =>
      avecDelai(f.setDoc(...args), 'écriture')) as Firestore['setDoc'],
    deleteDoc: ((...args: Parameters<Firestore['deleteDoc']>) =>
      avecDelai(f.deleteDoc(...args), 'suppression')) as Firestore['deleteDoc'],
  };
}

let clientIndisponible = false;

const getClient = async () => {
  if (!hasRemoteBackend()) return null;
  try {
    const [{ getFirebaseDb }, firestore] = await Promise.all([
      import('./firebase'),
      import('firebase/firestore'),
    ]);
    return { db: await getFirebaseDb(), f: borner(firestore) };
  } catch (erreur) {
    // Firebase est configuré mais le SDK n'a pas pu s'initialiser. Se taire
    // ici reviendrait à basculer en stockage local sans que personne ne le
    // sache — exactement le scénario qu'on veut rendre visible.
    if (!clientIndisponible) {
      clientIndisponible = true;
      console.error(
        "Firebase est configuré mais le SDK Firestore n'a pas pu démarrer.\n" +
          "Tout reste dans ce navigateur et n'est partagé avec personne.",
        erreur
      );
    }
    // Un échec d'initialisation n'est pas passager : on le signale comme
    // un refus durable, au même titre qu'une permission manquante.
    noterEchec('Initialisation de Firestore', { code: 'permission-denied' });
    return null;
  }
};

// ─────────────────────────────────────────────────────────────
// Quand le backend refuse
// ─────────────────────────────────────────────────────────────

/**
 * Firestore peut échouer pour deux raisons très différentes :
 *
 *  · une coupure réseau — passagère. Le repli sur le stockage local est le
 *    bon comportement : le travail de la personne n'est pas perdu.
 *  · un refus de permission — durable, et presque toujours le signe que les
 *    règles ne sont pas déployées. Se rabattre en silence donnerait
 *    l'illusion que tout fonctionne, alors que rien n'est partagé avec le
 *    groupe.
 *
 * On distingue donc les deux, et on rend le second visible.
 */
let refusPersistant: string | null = null;
const observateursRefus = new Set<() => void>();

function estRefus(erreur: unknown): boolean {
  const code = (erreur as { code?: string })?.code ?? '';
  return code === 'permission-denied' || code === 'unauthenticated';
}

/**
 * Firestore ne rejette pas toujours : quand les règles refusent l'accès, le
 * SDK réessaie la connexion indéfiniment et la promesse reste suspendue.
 * Sans limite de temps, `ensureProfile` ne rend jamais la main et toute
 * l'application reste bloquée sur son écran de chargement.
 *
 * On borne donc chaque appel distant. Passé le délai, on lève une erreur que
 * les `catch` existants traitent comme n'importe quel échec : repli sur le
 * stockage local, et signalement.
 */
const DELAI_DISTANT_MS = 2500;

function avecDelai<T>(promesse: Promise<T>, operation: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const minuteur = setTimeout(() => {
      reject(
        Object.assign(new Error(`${operation} : Firestore n'a pas répondu`), {
          code: 'deadline-exceeded',
        })
      );
    }, DELAI_DISTANT_MS);

    promesse.then(
      (valeur) => {
        clearTimeout(minuteur);
        marquerSynchronisation('synchronise', 'Carnet synchronisé', 0);
        resolve(valeur);
      },
      (erreur) => {
        clearTimeout(minuteur);
        reject(erreur);
      }
    );
  });
}

function estRefusOuSilence(erreur: unknown): boolean {
  const code = (erreur as { code?: string })?.code ?? '';
  return code === 'deadline-exceeded';
}

function noterEchec(operation: string, erreur: unknown): void {
  if (!estRefus(erreur) && !estRefusOuSilence(erreur)) {
    marquerSynchronisation(
      typeof navigator !== 'undefined' && !navigator.onLine ? 'hors_ligne' : 'en_attente',
      'Conservé sur cet appareil'
    );
    console.warn(`${operation} — repli sur le stockage local`, erreur);
    return;
  }
  if (!refusPersistant) {
    console.error(
      `${operation} : Firestore refuse l'accès.\n` +
        "Les règles de sécurité ne sont probablement pas déployées :\n" +
        '  firebase deploy --only firestore:rules,firestore:indexes\n' +
        "En attendant, tout reste dans ce navigateur et n'est partagé avec personne."
    );
  }
  refusPersistant = operation;
  marquerSynchronisation('erreur', 'Synchronisation à vérifier');
  observateursRefus.forEach((callback) => callback());
}

/** Le backend refuse-t-il l'accès ? `null` si tout va bien. */
export function refusDuBackend(): string | null {
  return refusPersistant;
}

export function observerRefus(callback: () => void): () => void {
  observateursRefus.add(callback);
  return () => {
    observateursRefus.delete(callback);
  };
}

// ─────────────────────────────────────────────────────────────
// Primitives locales + bus de changement
// ─────────────────────────────────────────────────────────────

const KEY = {
  profile: (uid: string) => `lf.profile.${uid}`,
  groups: 'lf.groups',
  members: (groupId: string) => `lf.members.${groupId}`,
  sessions: (groupId: string) => `lf.sessions.${groupId}`,
  posts: (groupId: string) => `lf.posts.${groupId}`,
  invites: 'lf.invites',
  seeded: 'lf.demoSeeded',
};

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Écriture locale impossible', error);
  }
}

type Scope = string;
const listeners = new Map<Scope, Set<() => void>>();

function emit(...scopes: Scope[]) {
  for (const scope of scopes) {
    listeners.get(scope)?.forEach((cb) => cb());
  }
  if (typeof window !== 'undefined') {
    // Réveille les autres onglets ouverts sur la même session.
    try {
      window.localStorage.setItem('lf.ping', `${Date.now()}:${scopes.join(',')}`);
    } catch {
      /* quota — sans conséquence */
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== 'lf.ping' || !event.newValue) return;
    const scopes = event.newValue.split(':')[1]?.split(',') ?? [];
    for (const scope of scopes) listeners.get(scope)?.forEach((cb) => cb());
  });
}

/**
 * S'abonner aux changements d'un périmètre (`group:<id>`, `members:<id>`,
 * `sessions:<id>`, `posts:<id>`, `profile:<uid>`, `groups`).
 * Le callback ne reçoit rien : il déclenche une relecture.
 */
export function subscribe(scope: Scope, callback: () => void): () => void {
  let set = listeners.get(scope);
  if (!set) {
    set = new Set();
    listeners.set(scope, set);
  }
  set.add(callback);

  // En mode Firestore, un onSnapshot relaie les changements distants.
  let detach: (() => void) | undefined;
  let cancelled = false;
  if (hasRemoteBackend()) {
    void attachRemote(scope, callback).then((off) => {
      if (cancelled) off?.();
      else detach = off;
    });
  }

  return () => {
    cancelled = true;
    set?.delete(callback);
    detach?.();
  };
}

async function attachRemote(scope: Scope, callback: () => void): Promise<(() => void) | undefined> {
  const client = await getClient();
  if (!client) return undefined;
  const { db, f } = client;
  const [kind, id] = scope.split(':');

  try {
    if (kind === 'groups') {
      return f.onSnapshot(f.collection(db, 'groupDirectory'), () => callback());
    }
    if (kind === 'group') {
      return f.onSnapshot(f.doc(db, 'groups', id), () => callback());
    }
    if (kind === 'profile') {
      return f.onSnapshot(f.doc(db, 'profiles', id), () => callback());
    }
    if (kind === 'invites') {
      return f.onSnapshot(
        f.query(f.collection(db, 'invitations'), f.where('groupId', '==', id)),
        () => callback()
      );
    }
    if (kind === 'members' || kind === 'sessions' || kind === 'posts') {
      return f.onSnapshot(f.collection(db, 'groups', id, kind), () => callback());
    }
  } catch (error) {
    noterEchec(`Abonnement à ${scope}`, error);
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────
// Identifiants
// ─────────────────────────────────────────────────────────────

const CODE_ALPHABET = 'ACDEFGHJKLMNPQRSTUVWXYZ2345679'; // sans I, O, 0, 1, B, 8

export function makeInviteCode(): string {
  let out = '';
  for (let i = 0; i < 5; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `FOND-${out}`;
}

export function normalizeCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const body = cleaned.startsWith('FOND') ? cleaned.slice(4) : cleaned;
  return `FOND-${body}`;
}

const makeId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// ─────────────────────────────────────────────────────────────
// Profils
// ─────────────────────────────────────────────────────────────

export function getCachedProfile(uid: string): UserProfile | null {
  return lsGet<UserProfile | null>(KEY.profile(uid), null);
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const client = await getClient();
  if (client) {
    try {
      const snap = await client.f.getDoc(client.f.doc(client.db, 'profiles', uid));
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        lsSet(KEY.profile(uid), data);
        return data;
      }
      return null;
    } catch (error) {
      noterEchec('Lecture du profil', error);
    }
  }
  return lsGet<UserProfile | null>(KEY.profile(uid), null);
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const client = await getClient();
  if (client) {
    try {
      await client.f.setDoc(client.f.doc(client.db, 'profiles', profile.uid), profile, {
        merge: true,
      });
    } catch (error) {
      noterEchec('Écriture du profil', error);
    }
  }
  lsSet(KEY.profile(profile.uid), profile);
  emit(`profile:${profile.uid}`);
}

/** Crée le profil au premier passage, sinon rafraîchit nom/photo. */
export async function ensureProfile(user: {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}): Promise<UserProfile> {
  const existing = await getProfile(user.uid);
  if (existing) {
    const refreshed: UserProfile = {
      ...existing,
      displayName: user.displayName || existing.displayName,
      email: user.email ?? existing.email,
      photoURL: user.photoURL ?? existing.photoURL,
    };
    if (
      refreshed.displayName !== existing.displayName ||
      refreshed.email !== existing.email ||
      refreshed.photoURL !== existing.photoURL
    ) {
      await saveProfile(refreshed);
    }
    return refreshed;
  }

  const created: UserProfile = {
    uid: user.uid,
    displayName: user.displayName || 'Disciple',
    email: user.email,
    photoURL: user.photoURL ?? null,
    groupId: null,
    membershipStatus: null,
    role: null,
    createdAt: Date.now(),
  };
  await saveProfile(created);
  return created;
}

// ─────────────────────────────────────────────────────────────
// Groupes — lecture
// ─────────────────────────────────────────────────────────────

async function readAllGroups(): Promise<ParcoursGroup[]> {
  const client = await getClient();
  if (client) {
    try {
      const snap = await client.f.getDocs(
        client.f.query(client.f.collection(client.db, 'groupDirectory'), client.f.limit(400))
      );
      const groups = snap.docs.map((d) => d.data() as ParcoursGroup);
      lsSet(KEY.groups, groups);
      return groups;
    } catch (error) {
      noterEchec('Lecture des groupes', error);
    }
  }
  return lsGet<ParcoursGroup[]>(KEY.groups, []);
}

/** Version d'annuaire : aucun code, lien visio, adresse ou position précise. */
function publicGroup(group: ParcoursGroup): ParcoursGroup {
  return {
    ...group,
    inviteCode: '',
    leaderId: '',
    place: {
      ...group.place,
      lat: Math.round(group.place.lat * 100) / 100,
      lng: Math.round(group.place.lng * 100) / 100,
      precise: false,
    },
    meeting: {
      mode: group.meeting.mode,
      rhythm: group.meeting.rhythm,
      weekday: group.meeting.weekday,
      time: group.meeting.time,
      timezone: group.meeting.timezone,
    },
  };
}

export async function getPublicGroup(groupId: string): Promise<ParcoursGroup | null> {
  const client = await getClient();
  if (client) {
    try {
      const snap = await client.f.getDoc(client.f.doc(client.db, 'groupDirectory', groupId));
      return snap.exists() ? (snap.data() as ParcoursGroup) : null;
    } catch (error) {
      noterEchec('Lecture de l’annuaire', error);
    }
  }
  return getCachedGroup(groupId);
}

async function writeGroup(group: ParcoursGroup): Promise<void> {
  const client = await getClient();
  if (client) {
    try {
      await client.f.setDoc(client.f.doc(client.db, 'groups', group.id), group, { merge: true });
      await Promise.all([
        client.f.setDoc(client.f.doc(client.db, 'groupDirectory', group.id), publicGroup(group)),
        client.f.setDoc(client.f.doc(client.db, 'groupInvites', normalizeCode(group.inviteCode)), {
          groupId: group.id,
          code: normalizeCode(group.inviteCode),
          updatedAt: Date.now(),
        }),
      ]);
    } catch (error) {
      noterEchec('Écriture du groupe', error);
    }
  }
  const all = lsGet<ParcoursGroup[]>(KEY.groups, []);
  const index = all.findIndex((g) => g.id === group.id);
  if (index >= 0) all[index] = group;
  else all.push(group);
  lsSet(KEY.groups, all);
  emit(`group:${group.id}`, 'groups');
}

export function getCachedGroup(groupId: string): ParcoursGroup | null {
  return lsGet<ParcoursGroup[]>(KEY.groups, []).find((g) => g.id === groupId) ?? null;
}

export async function getGroup(groupId: string): Promise<ParcoursGroup | null> {
  const client = await getClient();
  if (client) {
    try {
      const snap = await client.f.getDoc(client.f.doc(client.db, 'groups', groupId));
      if (snap.exists()) {
        const group = snap.data() as ParcoursGroup;
        const all = lsGet<ParcoursGroup[]>(KEY.groups, []);
        const idx = all.findIndex((g) => g.id === group.id);
        if (idx >= 0) all[idx] = group;
        else all.push(group);
        lsSet(KEY.groups, all);
        return group;
      }
    } catch (error) {
      noterEchec('Lecture du groupe', error);
    }
  }
  return lsGet<ParcoursGroup[]>(KEY.groups, []).find((g) => g.id === groupId) ?? null;
}

export async function getGroupByCode(code: string): Promise<ParcoursGroup | null> {
  const target = normalizeCode(code);
  const client = await getClient();
  if (client) {
    try {
      const invite = await client.f.getDoc(client.f.doc(client.db, 'groupInvites', target));
      if (!invite.exists()) return null;
      const groupId = (invite.data() as { groupId?: string }).groupId;
      return groupId ? getPublicGroup(groupId) : null;
    } catch (error) {
      noterEchec('Lecture du code d’invitation', error);
    }
  }
  const groups = await readAllGroups();
  return groups.find((g) => g.inviteCode === target && !g.archived) ?? null;
}

// ─────────────────────────────────────────────────────────────
// Appariement géographique
// ─────────────────────────────────────────────────────────────

export interface DiscoverOptions {
  /** Inclure les groupes déjà complets (affichés grisés). */
  includeFull?: boolean;
  /** Rayon maximal. `null` = pas de limite (les groupes en ligne comptent). */
  maxKm?: number | null;
  limit?: number;
}

/**
 * Classe les groupes du plus proche au plus lointain de `place`.
 * Un groupe reste rejoignable tant qu'il a de la place et que le parcours du
 * groupe n'est pas trop avancé (au-delà de la fiche 3, rejoindre casserait la
 * progression commune — le livret insiste sur l'homogénéité du groupe, p. 3).
 */
export async function discoverGroups(
  place: PlaceRef | undefined,
  options: DiscoverOptions = {}
): Promise<GroupMatch[]> {
  const { includeFull = true, maxKm = null, limit = 40 } = options;

  if (!hasRemoteBackend() && place) await seedDemoGroups(place);

  const groups = (await readAllGroups()).filter((g) => !g.archived && g.visibility !== 'prive');

  const matches: GroupMatch[] = groups.map((group) => {
    const km = place ? distanceKm(place, group.place) : null;
    const seatsLeft = Math.max(0, group.capacity - group.membersCount);
    const tooFarAlong = group.currentStep > 3;
    const joinable = seatsLeft > 0 && !tooFarAlong && !group.completedAt;

    let reason: string | undefined;
    if (group.completedAt) reason = 'Parcours terminé';
    else if (seatsLeft === 0) reason = 'Groupe complet';
    else if (tooFarAlong) reason = `Parcours déjà à la fiche ${group.currentStep}`;

    return { group, distanceKm: km, seatsLeft, joinable, reason };
  });

  return matches
    .filter((m) => includeFull || m.joinable)
    .filter((m) => maxKm === null || m.distanceKm === null || m.distanceKm <= maxKm)
    .sort((a, b) => {
      // Les groupes rejoignables d'abord, puis par distance croissante.
      if (a.joinable !== b.joinable) return a.joinable ? -1 : 1;
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
      return da - db;
    })
    .slice(0, limit);
}

// ─────────────────────────────────────────────────────────────
// Groupes — création & adhésion
// ─────────────────────────────────────────────────────────────

export interface CreateGroupInput {
  name: string;
  description: string;
  place: PlaceRef;
  meeting: GroupMeetingPlan;
  capacity?: number;
  visibility?: GroupVisibility;
  leader: { uid: string; displayName: string; email: string | null; photoURL?: string | null };
}

export async function createGroup(input: CreateGroupInput): Promise<ParcoursGroup> {
  const group: ParcoursGroup = {
    id: makeId('grp'),
    name: input.name.trim(),
    description: input.description.trim(),
    inviteCode: makeInviteCode(),
    visibility: input.visibility ?? 'sur_demande',
    capacity: input.capacity ?? GROUP_DEFAULT_CAPACITY,
    membersCount: 1,
    leaderId: input.leader.uid,
    leaderName: input.leader.displayName,
    place: input.place,
    meeting: input.meeting,
    language: 'fr',
    createdAt: Date.now(),
    currentStep: 1,
    stepPhase: 'preparation',
    stepOpenedAt: Date.now(),
    closedSteps: [],
  };

  await writeGroup(group);

  const leader: GroupMember = {
    uid: input.leader.uid,
    groupId: group.id,
    displayName: input.leader.displayName,
    email: input.leader.email,
    photoURL: input.leader.photoURL ?? null,
    role: 'animateur',
    status: 'actif',
    joinedAt: Date.now(),
    preparedSteps: [],
    personalStep: 1,
    distanceKm: 0,
  };
  await writeMember(leader);

  const profile = await getProfile(input.leader.uid);
  if (profile) {
    await saveProfile({
      ...profile,
      groupId: group.id,
      membershipStatus: 'actif',
      role: 'animateur',
      place: profile.place ?? input.place,
      onboardingCompletedAt: Date.now(),
    });
  }

  return group;
}

export interface JoinRequestInput {
  groupId: string;
  user: { uid: string; displayName: string; email: string | null; photoURL?: string | null };
  message?: string;
  place?: PlaceRef;
  attendance?: AttendanceMode;
}

/**
 * Dépose une demande d'adhésion. Un groupe `ouvert` accepte immédiatement,
 * un groupe `sur_demande` place la personne en attente de l'animateur.
 */
export async function requestToJoin(input: JoinRequestInput): Promise<GroupMember> {
  const group = (await getPublicGroup(input.groupId)) ?? (await getGroup(input.groupId));
  if (!group) throw new Error("Ce groupe n'existe plus.");
  if (group.membersCount >= group.capacity) throw new Error('Ce groupe est complet.');
  if (group.currentStep > 3)
    throw new Error(
      `Ce groupe est déjà à la fiche ${group.currentStep} : rejoindre maintenant romprait la progression commune.`
    );

  const existing = await getMembership(input.groupId, input.user.uid);
  if (existing && existing.status === 'actif') return existing;

  // À distance, toute adhésion passe par l'animateur : le client ne peut pas
  // s'attribuer lui-même le statut actif. Les groupes de démonstration locale
  // conservent leur accueil automatique.
  const autoApproved = !hasRemoteBackend() && group.visibility === 'ouvert';
  const member: GroupMember = {
    uid: input.user.uid,
    groupId: group.id,
    displayName: input.user.displayName,
    email: input.user.email,
    photoURL: input.user.photoURL ?? null,
    // Dans un groupe d'exemple, l'animateur n'existe pas : on confie la
    // co-animation à l'arrivant pour qu'il puisse conduire une rencontre.
    role: group.demo ? 'co_animateur' : 'membre',
    status: autoApproved ? 'actif' : 'en_attente',
    joinedAt: Date.now(),
    requestMessage: input.message?.trim() || undefined,
    distanceKm: input.place ? Math.round(distanceKm(input.place, group.place)) : undefined,
    preparedSteps: [],
    personalStep: group.currentStep,
    nextAttendance: input.attendance,
  };

  await writeMember(member);
  if (autoApproved) {
    await writeGroup({ ...group, membersCount: group.membersCount + 1 });
  }

  const profile = await getProfile(input.user.uid);
  if (profile) {
    await saveProfile({
      ...profile,
      groupId: group.id,
      membershipStatus: member.status,
      role: 'membre',
      place: profile.place ?? input.place,
      preferredAttendance: input.attendance ?? profile.preferredAttendance,
      onboardingCompletedAt: Date.now(),
    });
  }

  await markInviteAccepted(group.id, input.user.email);
  return member;
}

// ─────────────────────────────────────────────────────────────
// Membres
// ─────────────────────────────────────────────────────────────

async function writeMember(member: GroupMember): Promise<void> {
  const client = await getClient();
  if (client) {
    try {
      await client.f.setDoc(
        client.f.doc(client.db, 'groups', member.groupId, 'members', member.uid),
        member,
        { merge: true }
      );
    } catch (error) {
      noterEchec('Écriture du membre', error);
    }
  }
  const all = lsGet<GroupMember[]>(KEY.members(member.groupId), []);
  const index = all.findIndex((m) => m.uid === member.uid);
  if (index >= 0) all[index] = member;
  else all.push(member);
  lsSet(KEY.members(member.groupId), all);
  emit(`members:${member.groupId}`);
}

export function getCachedMembers(groupId: string): GroupMember[] {
  return lsGet<GroupMember[]>(KEY.members(groupId), []);
}

export async function getMembers(groupId: string): Promise<GroupMember[]> {
  const client = await getClient();
  if (client) {
    try {
      const snap = await client.f.getDocs(
        client.f.collection(client.db, 'groups', groupId, 'members')
      );
      const members = snap.docs.map((d) => d.data() as GroupMember);
      lsSet(KEY.members(groupId), members);
      return members;
    } catch (error) {
      noterEchec('Lecture des membres', error);
    }
  }
  return lsGet<GroupMember[]>(KEY.members(groupId), []);
}

export async function getMembership(groupId: string, uid: string): Promise<GroupMember | null> {
  const client = await getClient();
  if (client) {
    try {
      const snap = await client.f.getDoc(
        client.f.doc(client.db, 'groups', groupId, 'members', uid)
      );
      if (snap.exists()) return snap.data() as GroupMember;
    } catch (error) {
      noterEchec('Lecture de l’adhésion', error);
    }
  }
  return getCachedMembers(groupId).find((m) => m.uid === uid) ?? null;
}

export async function approveMember(groupId: string, uid: string): Promise<void> {
  const [group, member] = await Promise.all([getGroup(groupId), getMembership(groupId, uid)]);
  if (!group || !member || member.status === 'actif') return;
  if (group.membersCount >= group.capacity) throw new Error('Le groupe est complet.');

  await writeMember({ ...member, status: 'actif', joinedAt: Date.now() });
  await writeGroup({ ...group, membersCount: group.membersCount + 1 });

}

export async function rejectMember(groupId: string, uid: string): Promise<void> {
  const member = await getMembership(groupId, uid);
  if (!member) return;
  await writeMember({ ...member, status: 'refuse' });
}

export async function removeMember(groupId: string, uid: string): Promise<void> {
  const [group, member] = await Promise.all([getGroup(groupId), getMembership(groupId, uid)]);
  if (!group || !member) return;
  await writeMember({ ...member, status: 'parti' });
  if (member.status === 'actif') {
    await writeGroup({ ...group, membersCount: Math.max(0, group.membersCount - 1) });
  }
}

export async function setMemberRole(
  groupId: string,
  uid: string,
  role: MemberRole
): Promise<void> {
  const member = await getMembership(groupId, uid);
  if (!member) return;
  await writeMember({ ...member, role });
}

/** Le membre déclare avoir préparé la fiche chez lui, avant la rencontre. */
export async function markStepPrepared(
  groupId: string,
  uid: string,
  step: number
): Promise<void> {
  const member = await getMembership(groupId, uid);
  if (!member) return;
  if (member.preparedSteps.includes(step)) return;
  await writeMember({
    ...member,
    preparedSteps: [...member.preparedSteps, step].sort((a, b) => a - b),
    personalStep: Math.max(member.personalStep, step),
  });
}

export async function setNextAttendance(
  groupId: string,
  uid: string,
  attendance: AttendanceMode
): Promise<void> {
  const member = await getMembership(groupId, uid);
  if (!member) return;
  await writeMember({ ...member, nextAttendance: attendance });
  const profile = await getProfile(uid);
  if (profile) await saveProfile({ ...profile, preferredAttendance: attendance });
}

// ─────────────────────────────────────────────────────────────
// Invitations
// ─────────────────────────────────────────────────────────────

export async function inviteByEmail(
  groupId: string,
  emails: string[],
  invitedBy: { uid: string; displayName: string }
): Promise<GroupInvite[]> {
  const existing = await getInvites(groupId);
  const created: GroupInvite[] = [];

  for (const raw of emails) {
    const email = raw.trim().toLowerCase();
    if (!email || existing.some((i) => i.email === email && i.status === 'envoye')) continue;
    created.push({
      id: makeId('inv'),
      groupId,
      email,
      invitedBy: invitedBy.uid,
      invitedByName: invitedBy.displayName,
      createdAt: Date.now(),
      status: 'envoye',
    });
  }

  if (!created.length) return [];

  const client = await getClient();
  if (client) {
    try {
      await Promise.all(
        created.map((invite) =>
          client.f.setDoc(client.f.doc(client.db, 'invitations', invite.id), invite)
        )
      );
    } catch (error) {
      noterEchec('Écriture des invitations', error);
    }
  }
  lsSet(KEY.invites, [...lsGet<GroupInvite[]>(KEY.invites, []), ...created]);
  emit(`invites:${groupId}`);
  return created;
}

export async function getInvites(groupId: string): Promise<GroupInvite[]> {
  const client = await getClient();
  if (client) {
    try {
      const snap = await client.f.getDocs(
        client.f.query(
          client.f.collection(client.db, 'invitations'),
          client.f.where('groupId', '==', groupId)
        )
      );
      return snap.docs.map((d) => d.data() as GroupInvite);
    } catch (error) {
      noterEchec('Lecture des invitations', error);
    }
  }
  return lsGet<GroupInvite[]>(KEY.invites, []).filter((i) => i.groupId === groupId);
}

export async function revokeInvite(groupId: string, inviteId: string): Promise<void> {
  const client = await getClient();
  if (client) {
    try {
      await client.f.deleteDoc(client.f.doc(client.db, 'invitations', inviteId));
    } catch (error) {
      noterEchec('Suppression de l’invitation', error);
    }
  }
  lsSet(
    KEY.invites,
    lsGet<GroupInvite[]>(KEY.invites, []).filter((i) => i.id !== inviteId)
  );
  emit(`invites:${groupId}`);
}

async function markInviteAccepted(groupId: string, email: string | null): Promise<void> {
  if (!email) return;
  const invites = await getInvites(groupId);
  const target = invites.find((i) => i.email === email.toLowerCase() && i.status === 'envoye');
  if (!target) return;
  const updated = { ...target, status: 'accepte' as const };
  const client = await getClient();
  if (client) {
    try {
      await client.f.setDoc(client.f.doc(client.db, 'invitations', target.id), updated, {
        merge: true,
      });
    } catch {
      /* silencieux */
    }
  }
  lsSet(
    KEY.invites,
    lsGet<GroupInvite[]>(KEY.invites, []).map((i) => (i.id === target.id ? updated : i))
  );
  emit(`invites:${groupId}`);
}

/** Les groupes qui ont invité cette adresse — affichés en tête de l'onboarding. */
export async function findInvitationsFor(email: string | null): Promise<ParcoursGroup[]> {
  if (!email) return [];
  const target = email.toLowerCase();

  let invites: GroupInvite[];
  const client = await getClient();
  if (client) {
    try {
      const snap = await client.f.getDocs(
        client.f.query(
          client.f.collection(client.db, 'invitations'),
          client.f.where('email', '==', target),
          client.f.where('status', '==', 'envoye')
        )
      );
      invites = snap.docs.map((d) => d.data() as GroupInvite);
    } catch (error) {
      noterEchec('Lecture des invitations', error);
      invites = [];
    }
  } else {
    invites = lsGet<GroupInvite[]>(KEY.invites, []).filter(
      (i) => i.email === target && i.status === 'envoye'
    );
  }

  const groupes = await Promise.all(invites.map((invite) => getPublicGroup(invite.groupId)));
  return groupes.filter((groupe): groupe is ParcoursGroup => !!groupe && !groupe.archived);
}

// ─────────────────────────────────────────────────────────────
// Rencontres
// ─────────────────────────────────────────────────────────────

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
    hint: "On reprend une à une les questions du « Résumé et Partage » et on laisse la parole circuler.",
    minutes: 25,
  },
  {
    key: 'application',
    title: 'Un pas concret pour la semaine',
    hint: "Chacun formule à voix haute une application précise, que le groupe portera dans la prière.",
    minutes: 10,
  },
  {
    key: 'priere',
    title: 'Temps de prière',
    hint: "Prière les uns pour les autres. Aux fiches 7, 8 et 10, prévoir un temps personnel plus long.",
    minutes: 15,
  },
] as const;

export const MEETING_FLOW_LENGTH = MEETING_FLOW.length;

async function writeSession(session: GroupSession): Promise<void> {
  const client = await getClient();
  if (client) {
    try {
      await client.f.setDoc(
        client.f.doc(client.db, 'groups', session.groupId, 'sessions', session.id),
        session,
        { merge: true }
      );
    } catch (error) {
      noterEchec('Écriture de la rencontre', error);
    }
  }
  const all = lsGet<GroupSession[]>(KEY.sessions(session.groupId), []);
  const index = all.findIndex((s) => s.id === session.id);
  if (index >= 0) all[index] = session;
  else all.push(session);
  lsSet(KEY.sessions(session.groupId), all);
  emit(`sessions:${session.groupId}`);
}

export function getCachedSession(groupId: string): GroupSession | null {
  const all = lsGet<GroupSession[]>(KEY.sessions(groupId), []);
  return all[0] ?? null;
}

export async function getSessions(groupId: string): Promise<GroupSession[]> {
  const client = await getClient();
  if (client) {
    try {
      const snap = await client.f.getDocs(
        client.f.collection(client.db, 'groups', groupId, 'sessions')
      );
      const sessions = snap.docs.map((d) => d.data() as GroupSession).sort((a, b) => a.step - b.step);
      lsSet(KEY.sessions(groupId), sessions);
      return sessions;
    } catch (error) {
      noterEchec('Lecture des rencontres', error);
    }
  }
  return lsGet<GroupSession[]>(KEY.sessions(groupId), []).sort((a, b) => a.step - b.step);
}

/** La rencontre liée à la fiche en cours, créée à la volée si besoin. */
export async function getCurrentSession(groupId: string): Promise<GroupSession | null> {
  const group = await getGroup(groupId);
  if (!group) return null;
  const sessions = await getSessions(groupId);
  const found = sessions.find((s) => s.step === group.currentStep);
  if (found) return found;

  const session: GroupSession = {
    id: `${groupId}_s${group.currentStep}`,
    groupId,
    step: group.currentStep,
    scheduledAt: nextMeetingDate(group.meeting, group.stepOpenedAt).getTime(),
    status: 'planifiee',
    liveStage: 0,
    attendance: {},
  };
  await writeSession(session);
  return session;
}

/** Prochaine occurrence du créneau hebdomadaire (ou bimensuel) du groupe. */
export function nextMeetingDate(meeting: GroupMeetingPlan, from: number = Date.now()): Date {
  const [hours, minutes] = meeting.time.split(':').map((n) => parseInt(n, 10));
  const date = new Date(from);
  date.setHours(hours || 20, minutes || 0, 0, 0);
  const cadence = meeting.rhythm === 'bimensuel' ? 14 : 7;
  let delta = (meeting.weekday - date.getDay() + 7) % 7;
  if (delta === 0 && date.getTime() <= from) delta = cadence;
  else if (delta === 0) delta = 0;
  date.setDate(date.getDate() + delta);
  return date;
}

export async function openMeeting(groupId: string, uid: string): Promise<GroupSession | null> {
  const [group, session] = await Promise.all([getGroup(groupId), getCurrentSession(groupId)]);
  if (!group || !session) return null;
  const updated: GroupSession = {
    ...session,
    status: 'ouverte',
    openedAt: Date.now(),
    liveStage: 0,
    closedBy: undefined,
  };
  await writeSession(updated);
  await writeGroup({ ...group, stepPhase: 'rencontre' });
  void uid;
  return updated;
}

export async function setMeetingStage(
  groupId: string,
  stage: number,
  speakingUid?: string | null
): Promise<void> {
  const session = await getCurrentSession(groupId);
  if (!session) return;
  await writeSession({
    ...session,
    liveStage: Math.max(0, Math.min(MEETING_FLOW_LENGTH - 1, stage)),
    speakingUid: speakingUid === undefined ? session.speakingUid : speakingUid,
  });
}

export async function setSessionAttendance(
  groupId: string,
  uid: string,
  mode: AttendanceMode
): Promise<void> {
  const session = await getCurrentSession(groupId);
  if (!session) return;
  await writeSession({ ...session, attendance: { ...session.attendance, [uid]: mode } });
  await setNextAttendance(groupId, uid, mode);
}

/**
 * L'animateur clôt la fiche. C'est le seul événement qui ouvre la suivante :
 * « chaque parcours finit avant un nouveau parcours ».
 */
export async function closeMeeting(
  groupId: string,
  uid: string,
  payload: {
    notes?: string;
    prayerFocus?: string[];
    recap?: GroupSession['recap'];
  } = {}
): Promise<ParcoursGroup | null> {
  const [group, session] = await Promise.all([getGroup(groupId), getCurrentSession(groupId)]);
  if (!group || !session) return null;

  await writeSession({
    ...session,
    status: 'terminee',
    closedAt: Date.now(),
    closedBy: uid,
    notes: payload.notes ?? session.notes,
    prayerFocus: payload.prayerFocus ?? session.prayerFocus,
    recap: payload.recap ?? session.recap,
  });

  const closedSteps = group.closedSteps.includes(group.currentStep)
    ? group.closedSteps
    : [...group.closedSteps, group.currentStep];

  const isLast = group.currentStep >= PARCOURS_TOTAL_STEPS;
  const updated: ParcoursGroup = {
    ...group,
    closedSteps,
    currentStep: isLast ? group.currentStep : group.currentStep + 1,
    stepPhase: isLast ? 'cloture' : 'preparation',
    stepOpenedAt: Date.now(),
    completedAt: isLast ? Date.now() : group.completedAt,
  };
  await writeGroup(updated);

  // Chaque membre est remis en préparation sur la nouvelle fiche.
  if (!isLast) {
    const members = await getMembers(groupId);
    await Promise.all(
      members
        .filter((m) => m.status === 'actif')
        .map((m) =>
          writeMember({
            ...m,
            personalStep: Math.max(m.personalStep, updated.currentStep),
            nextAttendance: undefined,
          })
        )
    );
  }

  return updated;
}

// ─────────────────────────────────────────────────────────────
// Mur du groupe
// ─────────────────────────────────────────────────────────────

export function getCachedPosts(groupId: string): GroupPost[] {
  return lsGet<GroupPost[]>(KEY.posts(groupId), []).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getPosts(groupId: string): Promise<GroupPost[]> {
  const client = await getClient();
  if (client) {
    try {
      const snap = await client.f.getDocs(
        client.f.collection(client.db, 'groups', groupId, 'posts')
      );
      const posts = snap.docs.map((d) => d.data() as GroupPost).sort((a, b) => b.createdAt - a.createdAt);
      lsSet(KEY.posts(groupId), posts);
      return posts;
    } catch (error) {
      noterEchec('Lecture du mur', error);
    }
  }
  return lsGet<GroupPost[]>(KEY.posts(groupId), []).sort((a, b) => b.createdAt - a.createdAt);
}

async function writePost(post: GroupPost): Promise<void> {
  const client = await getClient();
  if (client) {
    try {
      await client.f.setDoc(
        client.f.doc(client.db, 'groups', post.groupId, 'posts', post.id),
        post,
        { merge: true }
      );
    } catch (error) {
      noterEchec('Écriture du mur', error);
    }
  }
  const all = lsGet<GroupPost[]>(KEY.posts(post.groupId), []);
  const index = all.findIndex((p) => p.id === post.id);
  if (index >= 0) all[index] = post;
  else all.unshift(post);
  lsSet(KEY.posts(post.groupId), all);
  emit(`posts:${post.groupId}`);
}

export async function addPost(input: {
  groupId: string;
  authorId: string;
  authorName: string;
  kind: GroupPostKind;
  content: string;
  step?: number;
  questionId?: string;
  reference?: string;
}): Promise<GroupPost> {
  const post: GroupPost = {
    id: makeId('post'),
    groupId: input.groupId,
    authorId: input.authorId,
    authorName: input.authorName,
    kind: input.kind,
    content: input.content.trim(),
    step: input.step,
    questionId: input.questionId,
    reference: input.reference,
    createdAt: Date.now(),
    prayedBy: [],
    amenBy: [],
  };
  await writePost(post);
  return post;
}

export async function deletePost(groupId: string, postId: string): Promise<void> {
  const client = await getClient();
  if (client) {
    try {
      await client.f.deleteDoc(client.f.doc(client.db, 'groups', groupId, 'posts', postId));
    } catch (error) {
      noterEchec('Suppression du message', error);
    }
  }
  lsSet(
    KEY.posts(groupId),
    lsGet<GroupPost[]>(KEY.posts(groupId), []).filter((p) => p.id !== postId)
  );
  emit(`posts:${groupId}`);
}

const toggleIn = (list: string[], uid: string) =>
  list.includes(uid) ? list.filter((id) => id !== uid) : [...list, uid];

export async function togglePrayed(groupId: string, postId: string, uid: string): Promise<void> {
  const post = (await getPosts(groupId)).find((p) => p.id === postId);
  if (!post) return;
  await writePost({ ...post, prayedBy: toggleIn(post.prayedBy, uid) });
}

export async function toggleAmen(groupId: string, postId: string, uid: string): Promise<void> {
  const post = (await getPosts(groupId)).find((p) => p.id === postId);
  if (!post) return;
  await writePost({ ...post, amenBy: toggleIn(post.amenBy, uid) });
}

export async function markPrayerAnswered(
  groupId: string,
  postId: string,
  answered: boolean
): Promise<void> {
  const post = (await getPosts(groupId)).find((p) => p.id === postId);
  if (!post) return;
  await writePost({
    ...post,
    answered,
    answeredAt: answered ? Date.now() : undefined,
  });
}

// ─────────────────────────────────────────────────────────────
// Règle d'accès au parcours
// ─────────────────────────────────────────────────────────────

export type ParcoursGate =
  | { state: 'chargement' }
  | { state: 'sans_groupe' }
  | { state: 'en_attente'; group: ParcoursGroup }
  | { state: 'refuse' }
  | {
      state: 'ouvert';
      group: ParcoursGroup;
      /** La fiche que le groupe vit en ce moment : celle qui se partage. */
      unlockedStep: number;
      /** La fiche qu'on peut déjà préparer seul, en avance. */
      preparationStep: number;
    }
  | { state: 'termine'; group: ParcoursGroup };

/**
 * Le parcours n'ouvre qu'une fois l'adhésion active. Deux rythmes ensuite,
 * délibérément distincts : la fiche du groupe, celle qui se partage, et la
 * suivante, qu'on peut déjà préparer seul.
 */
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

/**
 * La fiche du groupe : celle dont on partage les réponses à la rencontre.
 */
export function isStepUnlocked(group: ParcoursGroup, step: number): boolean {
  return step <= group.currentStep;
}

/**
 * Jusqu'où l'on peut lire seul, sans attendre personne.
 *
 * Le livret demande que chacun ait travaillé le cours chez lui avant la
 * rencontre. Si la fiche suivante n'ouvrait qu'à la seconde où l'animateur
 * clôture la précédente, la fenêtre de préparation serait écrasée — et
 * l'application empêcherait d'obéir au livret dont elle est tirée. On ouvre
 * donc la fiche suivante en lecture, une seule : de quoi toujours préparer
 * la prochaine rencontre, jamais de quoi dévorer les vingt d'un trait.
 *
 * Ce qui reste fermé jusqu'à la rencontre, c'est le partage — les réponses
 * déposées au groupe, les pépites, le mur. La fraîcheur du moment commun ne
 * se prépare pas, elle se vit ensemble.
 */
export function etapeDePreparation(group: ParcoursGroup): number {
  return Math.min(group.currentStep + 1, PARCOURS_TOTAL_STEPS);
}

/** Lisible seul : la fiche du groupe, ou celle qu'on prépare. */
export function estEtapeLisible(group: ParcoursGroup, step: number): boolean {
  return step <= etapeDePreparation(group);
}

// ─────────────────────────────────────────────────────────────
// Annuaire de démonstration (mode local uniquement)
// ─────────────────────────────────────────────────────────────

const DEMO_BLUEPRINTS: {
  name: string;
  description: string;
  leader: string;
  compagnons: string[];
  km: number;
  bearing: number;
  members: number;
  capacity: number;
  step: number;
  mode: GroupMeetingPlan['mode'];
  weekday: number;
  time: string;
  visibility: GroupVisibility;
}[] = [
  {
    name: 'Cellule Emmaüs',
    description:
      "Un petit groupe qui se retrouve autour d'une table, d'un thé et de la Parole. Nous démarrons tout juste la fiche 1.",
    leader: 'Sarah M.',
    compagnons: ['Élise R.', 'Jonathan P.'],
    km: 2.4,
    bearing: 35,
    members: 3,
    capacity: 6,
    step: 1,
    mode: 'presentiel',
    weekday: 4,
    time: '20:00',
    visibility: 'sur_demande',
  },
  {
    name: 'Les Enracinés',
    description:
      'Groupe hybride : la moitié se réunit au local, les autres se connectent. Beaucoup de jeunes actifs.',
    leader: 'David K.',
    compagnons: ['Nadia S.', 'Thomas G.', 'Ruth A.'],
    km: 6.8,
    bearing: 160,
    members: 4,
    capacity: 6,
    step: 2,
    mode: 'hybride',
    weekday: 2,
    time: '19:30',
    visibility: 'sur_demande',
  },
  {
    name: 'Source Vive',
    description:
      'Nous prenons le temps. Rencontre bimensuelle, ambiance familiale, enfants bienvenus.',
    leader: 'Esther B.',
    compagnons: ['Paul-Henri M.', 'Grace N.', 'Léa D.', 'Simon T.'],
    km: 14.2,
    bearing: 265,
    members: 5,
    capacity: 6,
    step: 1,
    mode: 'presentiel',
    weekday: 6,
    time: '15:00',
    visibility: 'ouvert',
  },
  {
    name: 'Cellule Antioche',
    description: 'Groupe complet cette saison — nous ouvrirons un second groupe au prochain cycle.',
    leader: 'Marc L.',
    compagnons: ['Anne-Claire V.', 'Josué B.', 'Myriam K.', 'Daniel O.', 'Rebecca F.'],
    km: 21.5,
    bearing: 95,
    members: 6,
    capacity: 6,
    step: 3,
    mode: 'presentiel',
    weekday: 3,
    time: '20:30',
    visibility: 'sur_demande',
  },
  {
    name: 'Le Cénacle',
    description:
      'Nous en sommes à la fiche 7 : le groupe est lancé, mais nous accueillons volontiers pour le cycle suivant.',
    leader: 'Joëlle T.',
    compagnons: ['Étienne L.', 'Aïcha D.', 'Pierre-Yves C.', 'Salomé H.'],
    km: 38,
    bearing: 310,
    members: 5,
    capacity: 6,
    step: 7,
    mode: 'hybride',
    weekday: 1,
    time: '20:00',
    visibility: 'sur_demande',
  },
  {
    name: 'Fondements — 100 % en ligne',
    description:
      "Pour ceux qui n'ont personne près de chez eux. Tout se vit en visio, caméra allumée, en français.",
    leader: 'Équipe Les Fondements',
    compagnons: ['Kevin M.'],
    km: 420,
    bearing: 20,
    members: 2,
    capacity: 6,
    step: 1,
    mode: 'ligne',
    weekday: 0,
    time: '18:00',
    visibility: 'ouvert',
  },
  {
    name: 'Cellule Béthanie',
    description: 'Groupe de femmes, rencontre en journée, un mercredi sur deux.',
    leader: 'Miriam A.',
    compagnons: ['Judith A.', 'Claire-Marie P.', 'Naomi B.'],
    km: 9.1,
    bearing: 210,
    members: 4,
    capacity: 6,
    step: 2,
    mode: 'presentiel',
    weekday: 3,
    time: '14:00',
    visibility: 'sur_demande',
  },
];

/** Déplace un point de `km` kilomètres selon un cap en degrés. */
function offsetPlace(origin: PlaceRef, km: number, bearingDeg: number): PlaceRef {
  const R = 6371;
  const bearing = (bearingDeg * Math.PI) / 180;
  const lat1 = (origin.lat * Math.PI) / 180;
  const lng1 = (origin.lng * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(km / R) + Math.cos(lat1) * Math.sin(km / R) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(km / R) * Math.cos(lat1),
      Math.cos(km / R) - Math.sin(lat1) * Math.sin(lat2)
    );
  const lat = (lat2 * 180) / Math.PI;
  const lng = (lng2 * 180) / Math.PI;
  // On rattache le point décalé à la ville connue la plus proche, sinon les
  // groupes lointains porteraient le nom de la ville de départ.
  const { place } = nearestPlace({ lat, lng });
  return { ...place, lat, lng, label: place.city, precise: false };
}

async function seedDemoGroups(place: PlaceRef): Promise<void> {
  if (typeof window === 'undefined') return;
  const seededFor = lsGet<string>(KEY.seeded, '');
  const signature = `${place.lat.toFixed(1)},${place.lng.toFixed(1)}`;
  if (seededFor === signature) return;

  const existing = lsGet<ParcoursGroup[]>(KEY.groups, []);
  const kept = existing.filter((g) => !g.demo);

  const seeded: ParcoursGroup[] = DEMO_BLUEPRINTS.map((blueprint, index) => {
    const groupPlace = offsetPlace(place, blueprint.km, blueprint.bearing);
    const id = `demo_${index}_${signature.replace(/[^0-9]/g, '')}`;
    return {
      id,
      name: blueprint.name,
      description: blueprint.description,
      inviteCode: `FOND-DEMO${index}`,
      visibility: blueprint.visibility,
      capacity: blueprint.capacity,
      membersCount: blueprint.members,
      leaderId: `demo_leader_${index}`,
      leaderName: blueprint.leader,
      place: groupPlace,
      meeting: {
        mode: blueprint.mode,
        rhythm: blueprint.name === 'Source Vive' ? 'bimensuel' : 'hebdomadaire',
        weekday: blueprint.weekday,
        time: blueprint.time,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris',
        callLink: blueprint.mode === 'presentiel' ? undefined : 'https://meet.google.com/new',
      },
      language: 'fr',
      createdAt: Date.now() - (index + 1) * 86400000 * 9,
      currentStep: blueprint.step,
      stepPhase: 'preparation',
      stepOpenedAt: Date.now() - 86400000 * 2,
      closedSteps: Array.from({ length: blueprint.step - 1 }, (_, i) => i + 1),
      demo: true,
    };
  });

  lsSet(KEY.groups, [...kept, ...seeded]);

  // Les compagnons de route des groupes d'exemple : sans eux, un groupe
  // « 4/6 » n'afficherait qu'une seule personne.
  seeded.forEach((group, index) => {
    const blueprint = DEMO_BLUEPRINTS[index];
    const existants = lsGet<GroupMember[]>(KEY.members(group.id), []);
    if (existants.some((m) => m.uid.startsWith('demo_'))) return;

    const fictifs: GroupMember[] = [
      {
        uid: group.leaderId,
        groupId: group.id,
        displayName: group.leaderName,
        email: null,
        role: 'animateur',
        status: 'actif',
        joinedAt: group.createdAt,
        preparedSteps: Array.from({ length: group.currentStep }, (_, i) => i + 1),
        personalStep: group.currentStep,
        nextAttendance: group.meeting.mode === 'ligne' ? 'ligne' : 'presentiel',
      },
      ...blueprint.compagnons.map((nom, i) => ({
        uid: `demo_${index}_m${i}`,
        groupId: group.id,
        displayName: nom,
        email: null,
        role: 'membre' as const,
        status: 'actif' as const,
        joinedAt: group.createdAt + (i + 1) * 3600000,
        preparedSteps: Array.from(
          { length: Math.max(0, group.currentStep - (i % 2)) },
          (_, k) => k + 1
        ),
        personalStep: group.currentStep,
        nextAttendance: (group.meeting.mode === 'ligne'
          ? 'ligne'
          : group.meeting.mode === 'hybride' && i % 2 === 1
            ? 'ligne'
            : 'presentiel') as AttendanceMode,
      })),
    ];

    lsSet(KEY.members(group.id), [...existants, ...fictifs]);
  });

  lsSet(KEY.seeded, signature);
  emit('groups');
}
