'use client';

import { firebaseConfigure } from './runtime';

export type EvenementProduit =
  | 'installation'
  | 'fiche_1'
  | 'groupe'
  | 'preparation'
  | 'rencontre'
  | 'retention_j1'
  | 'retention_j7'
  | 'retention_j30';

export type ConsentementMesure = 'inconnu' | 'accepte' | 'refuse';

interface EvenementMinimal {
  id: string;
  installationId: string;
  event: EvenementProduit;
  day: string;
  createdAt: number;
  expiresAt: number;
  version: string;
}

const CLE_CONSENTEMENT = 'lf.mesure.consentement';
const CLE_INSTALLATION = 'lf.mesure.installation';
const CLE_FILE = 'lf.mesure.file';
const CLE_JALONS = 'lf.mesure.jalons';
const CLE_PREMIER_JOUR = 'lf.mesure.premierJour';
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

function lire<T>(cle: string, repli: T): T {
  if (typeof window === 'undefined') return repli;
  try {
    const brut = localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : repli;
  } catch {
    return repli;
  }
}

function ecrire(cle: string, valeur: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    // La mesure ne doit jamais gêner le parcours.
  }
}

function identifiantInstallation(): string {
  const existant = lire<string | null>(CLE_INSTALLATION, null);
  if (existant) return existant;
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `installation_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  ecrire(CLE_INSTALLATION, id);
  return id;
}

export function lireConsentementMesure(): ConsentementMesure {
  const valeur = lire<string>(CLE_CONSENTEMENT, 'inconnu');
  return valeur === 'accepte' || valeur === 'refuse' ? valeur : 'inconnu';
}

export function definirConsentementMesure(consentement: Exclude<ConsentementMesure, 'inconnu'>): void {
  ecrire(CLE_CONSENTEMENT, consentement);
  if (consentement === 'refuse') ecrire(CLE_FILE, []);
  else void envoyerMesuresEnAttente();
  window.dispatchEvent(new CustomEvent('lf:consentement-mesure', { detail: consentement }));
}

/**
 * Ne reçoit ni UID, ni courriel, ni groupe, ni texte saisi. Avant accord, le
 * jalon reste uniquement dans le navigateur ; après accord, il peut être
 * envoyé sous un identifiant d'installation aléatoire.
 */
export function mesurer(evenement: EvenementProduit): void {
  if (typeof window === 'undefined') return;
  const jalons = new Set(lire<EvenementProduit[]>(CLE_JALONS, []));
  if (jalons.has(evenement)) return;
  jalons.add(evenement);
  ecrire(CLE_JALONS, [...jalons]);

  const maintenant = Date.now();
  const installationId = identifiantInstallation();
  const entree: EvenementMinimal = {
    id: `${installationId}:${evenement}`,
    installationId,
    event: evenement,
    day: new Date(maintenant).toISOString().slice(0, 10),
    createdAt: maintenant,
    expiresAt: maintenant + RETENTION_MS,
    version: process.env.NEXT_PUBLIC_COMMIT_SHA?.slice(0, 12) || 'local',
  };
  ecrire(CLE_FILE, [...lire<EvenementMinimal[]>(CLE_FILE, []), entree]);
  if (lireConsentementMesure() === 'accepte') void envoyerMesuresEnAttente();
}

export function mesurerRetention(): void {
  if (typeof window === 'undefined') return;
  const maintenant = Date.now();
  const premier = lire<number>(CLE_PREMIER_JOUR, 0) || maintenant;
  if (!lire<number>(CLE_PREMIER_JOUR, 0)) ecrire(CLE_PREMIER_JOUR, premier);
  const jours = Math.floor((maintenant - premier) / 86_400_000);
  if (jours >= 1) mesurer('retention_j1');
  if (jours >= 7) mesurer('retention_j7');
  if (jours >= 30) mesurer('retention_j30');
}

export async function envoyerMesuresEnAttente(): Promise<void> {
  if (
    typeof window === 'undefined' ||
    lireConsentementMesure() !== 'accepte' ||
    !firebaseConfigure() ||
    !navigator.onLine
  ) return;
  const file = lire<EvenementMinimal[]>(CLE_FILE, []);
  if (!file.length) return;

  try {
    const [{ getFirebaseDb }, { doc, setDoc }] = await Promise.all([
      import('./firebase'),
      import('firebase/firestore'),
    ]);
    const db = await getFirebaseDb();
    const restantes = [...file];
    for (const entree of file) {
      await setDoc(doc(db, 'usageEvents', entree.id.replaceAll('/', '_')), entree);
      restantes.shift();
      ecrire(CLE_FILE, restantes);
    }
  } catch {
    // La mesure attend ; aucune action utilisateur n'échoue à cause d'elle.
  }
}

export function effacerMesureLocale(): void {
  for (const cle of [CLE_CONSENTEMENT, CLE_INSTALLATION, CLE_FILE, CLE_JALONS, CLE_PREMIER_JOUR]) {
    localStorage.removeItem(cle);
  }
}
