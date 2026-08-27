import type { KVNamespace } from '@cloudflare/workers-types';
import type { NotificationPreferences, TypeEvenementGroupe } from './notifications';

export interface CalendrierGroupe {
  groupId: string;
  groupName: string;
  currentStep: number;
  rhythm: 'hebdomadaire' | 'bimensuel';
  weekday: number;
  time: string;
  timezone: string;
  firstMeetingDate?: string;
  nextMeetingDate?: string;
}

export interface EvenementGroupe {
  id: string;
  groupId: string;
  type: TypeEvenementGroupe;
  sourceId: string;
  actorUid: string;
  createdAt: number;
  title: string;
  body: string;
  url: string;
}

export interface AbonnementRappel {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  uid: string;
  preferences: NotificationPreferences;
  /** Identifiant IANA : Africa/Lome, Europe/Paris, America/Montreal… */
  timezone: string;
  calendrier?: CalendrierGroupe;
  inscritLe: number;
  evenementsDepuis: number;
  /** Clés de messages déjà servis, persistées pour résister aux relances cron. */
  dedup: Record<string, number>;
}

const PREFIXE_ABONNEMENT = 'abo:';
const PREFIXE_EVENEMENT = 'evt:';

async function condense(valeur: string): Promise<string> {
  const octets = new TextEncoder().encode(valeur);
  const digest = await crypto.subtle.digest('SHA-256', octets);
  return Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((octet) => octet.toString(16).padStart(2, '0'))
    .join('');
}

async function clefDe(endpoint: string): Promise<string> {
  return `${PREFIXE_ABONNEMENT}${await condense(endpoint)}`;
}

export async function enregistrerAbonnement(
  kv: KVNamespace,
  abonnement: AbonnementRappel
): Promise<void> {
  await kv.put(await clefDe(abonnement.endpoint), JSON.stringify(abonnement));
}

export async function oublierAbonnement(kv: KVNamespace, endpoint: string): Promise<void> {
  await kv.delete(await clefDe(endpoint));
}

export async function lireAbonnement(
  kv: KVNamespace,
  endpoint: string
): Promise<AbonnementRappel | null> {
  return kv.get<AbonnementRappel>(await clefDe(endpoint), 'json');
}

export async function parcourirAbonnements(
  kv: KVNamespace,
  visiter: (abonnement: AbonnementRappel, clef: string) => Promise<void>
): Promise<number> {
  let curseur: string | undefined;
  let vus = 0;
  do {
    const page = await kv.list({ prefix: PREFIXE_ABONNEMENT, cursor: curseur });
    for (const { name } of page.keys) {
      const abonnement = await kv.get<AbonnementRappel>(name, 'json');
      if (!abonnement) continue;
      await visiter(abonnement, name);
      vus += 1;
    }
    curseur = page.list_complete ? undefined : page.cursor;
  } while (curseur);
  return vus;
}

export function fuseauIanaValide(fuseau: unknown): fuseau is string {
  if (typeof fuseau !== 'string' || !fuseau || fuseau.length > 80) return false;
  try {
    new Intl.DateTimeFormat('fr', { timeZone: fuseau }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

interface PartiesLocales {
  annee: number;
  mois: number;
  jour: number;
  heure: number;
  minute: number;
}

function partiesLocales(instant: Date, timezone: string): PartiesLocales {
  const parties = new Intl.DateTimeFormat('fr-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const valeur = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parties.find((partie) => partie.type === type)?.value ?? 0);
  return {
    annee: valeur('year'),
    mois: valeur('month'),
    jour: valeur('day'),
    heure: valeur('hour'),
    minute: valeur('minute'),
  };
}

export function heureLocale(maintenant: Date, timezone: string): string {
  const local = partiesLocales(maintenant, timezone);
  return `${String(local.heure).padStart(2, '0')}:${String(local.minute).padStart(2, '0')}`;
}

export function jourLocal(maintenant: Date, timezone: string): string {
  const local = partiesLocales(maintenant, timezone);
  return `${local.annee}-${String(local.mois).padStart(2, '0')}-${String(local.jour).padStart(2, '0')}`;
}

export function estLHeure(voulue: string, maintenant: string, fenetreMinutes = 15): boolean {
  const enMinutes = (heure: string) => {
    const [heures, minutes] = heure.split(':').map(Number);
    return (heures || 0) * 60 + (minutes || 0);
  };
  const ecart = enMinutes(maintenant) - enMinutes(voulue);
  return ecart >= 0 && ecart < fenetreMinutes;
}

function dateValide(date: unknown): date is string {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function heureValide(heure: unknown): heure is string {
  return typeof heure === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(heure);
}

function ajouterJours(date: string, jours: number): string {
  const [annee, mois, jour] = date.split('-').map(Number);
  const resultat = new Date(Date.UTC(annee, mois - 1, jour + jours));
  return resultat.toISOString().slice(0, 10);
}

function distanceJours(debut: string, fin: string): number {
  return Math.round(
    (new Date(`${fin}T00:00:00Z`).getTime() - new Date(`${debut}T00:00:00Z`).getTime()) /
      86_400_000
  );
}

/** Convertit une heure civile dans un fuseau IANA en instant UTC, DST compris. */
function instantLocal(date: string, heure: string, timezone: string): Date {
  const [annee, mois, jour] = date.split('-').map(Number);
  const [heures, minutes] = heure.split(':').map(Number);
  const cible = Date.UTC(annee, mois - 1, jour, heures, minutes);
  let estimation = cible;
  for (let tentative = 0; tentative < 4; tentative += 1) {
    const local = partiesLocales(new Date(estimation), timezone);
    const represente = Date.UTC(local.annee, local.mois - 1, local.jour, local.heure, local.minute);
    const correction = cible - represente;
    estimation += correction;
    if (correction === 0) break;
  }
  return new Date(estimation);
}

/** Prochaine rencontre réelle du calendrier, avec cadence et DST. */
export function prochaineRencontre(
  calendrier: CalendrierGroupe,
  maintenant: Date
): Date | null {
  if (!fuseauIanaValide(calendrier.timezone) || !heureValide(calendrier.time)) return null;
  const marge = maintenant.getTime() - 60 * 60_000;
  if (dateValide(calendrier.nextMeetingDate)) {
    const explicite = instantLocal(calendrier.nextMeetingDate, calendrier.time, calendrier.timezone);
    if (explicite.getTime() >= marge) return explicite;
  }

  const cadence = calendrier.rhythm === 'bimensuel' ? 14 : 7;
  const aujourdHui = jourLocal(maintenant, calendrier.timezone);
  let dateCandidate: string;

  if (dateValide(calendrier.firstMeetingDate)) {
    const ecart = distanceJours(calendrier.firstMeetingDate, aujourdHui);
    if (ecart < 0) dateCandidate = calendrier.firstMeetingDate;
    else dateCandidate = ajouterJours(calendrier.firstMeetingDate, Math.floor(ecart / cadence) * cadence);
  } else {
    const [annee, mois, jour] = aujourdHui.split('-').map(Number);
    const jourSemaine = new Date(Date.UTC(annee, mois - 1, jour)).getUTCDay();
    const delta = (Math.max(0, Math.min(6, calendrier.weekday)) - jourSemaine + 7) % 7;
    dateCandidate = ajouterJours(aujourdHui, delta);
  }

  let candidate = instantLocal(dateCandidate, calendrier.time, calendrier.timezone);
  if (candidate.getTime() < marge) {
    dateCandidate = ajouterJours(dateCandidate, cadence);
    candidate = instantLocal(dateCandidate, calendrier.time, calendrier.timezone);
  }
  return candidate;
}

export function dejaServi(abonnement: AbonnementRappel, cle: string): boolean {
  return Boolean(abonnement.dedup?.[cle]);
}

export function marquerServi(
  abonnement: AbonnementRappel,
  cles: string[],
  a: number = Date.now()
): AbonnementRappel {
  const entrees = Object.entries({ ...(abonnement.dedup ?? {}) });
  for (const cle of cles) entrees.push([cle, a]);
  const dedup = Object.fromEntries(
    entrees
      .sort(([, gauche], [, droite]) => droite - gauche)
      .filter(([cle], index, tout) => tout.findIndex(([candidate]) => candidate === cle) === index)
      .slice(0, 120)
  );
  return { ...abonnement, dedup };
}

export async function enregistrerEvenementGroupe(
  kv: KVNamespace,
  evenement: Omit<EvenementGroupe, 'id' | 'createdAt'>
): Promise<EvenementGroupe> {
  const id = await condense(`${evenement.groupId}:${evenement.type}:${evenement.sourceId}`);
  const complet: EvenementGroupe = { ...evenement, id, createdAt: Date.now() };
  await kv.put(`${PREFIXE_EVENEMENT}${evenement.groupId}:${id}`, JSON.stringify(complet), {
    expirationTtl: 30 * 24 * 60 * 60,
  });
  return complet;
}

export async function lireEvenementsGroupe(
  kv: KVNamespace,
  groupId: string
): Promise<EvenementGroupe[]> {
  const prefix = `${PREFIXE_EVENEMENT}${groupId}:`;
  let curseur: string | undefined;
  const evenements: EvenementGroupe[] = [];
  do {
    const page = await kv.list({ prefix, cursor: curseur, limit: 100 });
    for (const { name } of page.keys) {
      const evenement = await kv.get<EvenementGroupe>(name, 'json');
      if (evenement) evenements.push(evenement);
    }
    curseur = page.list_complete ? undefined : page.cursor;
  } while (curseur);
  return evenements.sort((a, b) => a.createdAt - b.createdAt);
}
