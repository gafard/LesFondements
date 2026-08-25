import type { KVNamespace } from '@cloudflare/workers-types';
import type { NotificationPreferences } from './notifications';

/**
 * Les abonnements aux rappels, et ce qu'on en fait.
 *
 * Jusqu'ici, s'abonner ne gardait rien : la route répondait
 * « persisted: false » et les préférences restaient sur l'appareil. Aucun
 * rappel programmé ne pouvait donc partir — le carnet promettait de vous
 * réveiller à 7 h 30 et ne le faisait jamais.
 *
 * Les abonnements vivent maintenant dans KV, que le worker lit aussi bien
 * depuis une requête que depuis son réveil programmé.
 */

export interface AbonnementRappel {
  /** L'adresse que le service de push nous a donnée. */
  endpoint: string;
  keys: { p256dh: string; auth: string };
  /** À qui il appartient, pour pouvoir le retirer. */
  uid: string;
  preferences: NotificationPreferences;
  /** Décalage horaire du navigateur, en minutes (comme `getTimezoneOffset`). */
  decalage: number;
  inscritLe: number;
  /** Dernier envoi de la goutte de rosée, pour ne pas la servir deux fois. */
  derniereRosee?: string;
}

/** Les clés sont préfixées : KV sert aussi à d'autres choses. */
const PREFIXE = 'abo:';

/** Une adresse de push est longue et contient des caractères libres. */
async function clefDe(endpoint: string): Promise<string> {
  const octets = new TextEncoder().encode(endpoint);
  const condense = await crypto.subtle.digest('SHA-256', octets);
  return (
    PREFIXE +
    Array.from(new Uint8Array(condense))
      .slice(0, 16)
      .map((o) => o.toString(16).padStart(2, '0'))
      .join('')
  );
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

/**
 * Parcourt tous les abonnements. KV pagine : on suit le curseur plutôt que
 * de supposer que tout tient dans une page.
 */
export async function parcourirAbonnements(
  kv: KVNamespace,
  visiter: (abonnement: AbonnementRappel, clef: string) => Promise<void>
): Promise<number> {
  let curseur: string | undefined;
  let vus = 0;
  do {
    const page = await kv.list({ prefix: PREFIXE, cursor: curseur });
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

/**
 * L'heure locale de quelqu'un, au format « HH:MM ».
 *
 * On garde son décalage plutôt que son fuseau : le fuseau demanderait une
 * table des changements d'heure, le décalage est ce que son navigateur a
 * annoncé la dernière fois qu'il s'est abonné.
 */
export function heureLocale(maintenant: Date, decalage: number): string {
  const local = new Date(maintenant.getTime() - decalage * 60_000);
  return `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`;
}

/** Le jour local, pour ne pas envoyer deux fois la même goutte. */
export function jourLocal(maintenant: Date, decalage: number): string {
  const local = new Date(maintenant.getTime() - decalage * 60_000);
  return local.toISOString().slice(0, 10);
}

/**
 * L'heure demandée est-elle passée dans le quart d'heure écoulé ?
 *
 * Le réveil tourne tous les quarts d'heure ; quelqu'un qui a choisi 7 h 32
 * doit être servi au passage de 7 h 45, pas ignoré parce que l'heure ne
 * tombe pas juste.
 */
export function estLHeure(voulue: string, maintenant: string, fenetreMinutes = 15): boolean {
  const enMinutes = (h: string) => {
    const [heures, minutes] = h.split(':').map(Number);
    return (heures || 0) * 60 + (minutes || 0);
  };
  const ecart = enMinutes(maintenant) - enMinutes(voulue);
  return ecart >= 0 && ecart < fenetreMinutes;
}
