/**
 * Gestionnaire client des notifications Web Push propulsé par Cloudflare Workers
 */

import { jetonFirebase } from './firebase';

export interface NotificationPreferences {
  goutteDeRosee: boolean; // Méditation & Verset du matin
  heureMatin: string;      // ex: "07:30"
  rappel48h: boolean;      // Rappel 48h avant la rencontre de cellule
  jourDeRencontre: boolean; // Rappel Jour J de la rencontre
  vieDeGroupe: boolean;    // Célébration d'étape clôturée & nouvelles pépites
}

export interface ContexteNotifications {
  /** Le serveur relit le calendrier réel dans Firestore à partir de cet id. */
  groupId?: string;
}

export type TypeEvenementGroupe = 'rencontre_ouverte' | 'etape_debloquee' | 'pepite';

export const PREFERENCES_DEFAUT: NotificationPreferences = {
  goutteDeRosee: true,
  heureMatin: '07:30',
  rappel48h: true,
  jourDeRencontre: true,
  vieDeGroupe: true,
};

export interface DiagnosticPWA {
  estPWA: boolean;
  estIOS: boolean;
  estAndroid: boolean;
  supportePush: boolean;
  permission: NotificationPermission | 'unsupported';
  serviceWorkerPret: boolean;
}

export function diagnostiquerEnvironnement(): DiagnosticPWA {
  if (typeof window === 'undefined') {
    return {
      estPWA: false,
      estIOS: false,
      estAndroid: false,
      supportePush: false,
      permission: 'unsupported',
      serviceWorkerPret: false,
    };
  }

  const ua = navigator.userAgent || '';
  const estIOS = /iPhone|iPad|iPod/i.test(ua);
  const estAndroid = /Android/i.test(ua);
  const estPWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as unknown as { standalone?: boolean }).standalone);
  const supportePush = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  const permission = supportePush ? Notification.permission : 'unsupported';

  return {
    estPWA,
    estIOS,
    estAndroid,
    supportePush,
    permission,
    serviceWorkerPret: 'serviceWorker' in navigator,
  };
}

const CLE_STOCKAGE_PREFS = 'lf.notifPreferences';
const CLE_STOCKAGE_SUB = 'lf.pushSubscription';

/** Identifiant IANA, avec prise en charge automatique des changements d'heure. */
export function fuseauIanaLocal(): string {
  try {
    const fuseau = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return fuseau || 'UTC';
  } catch {
    return 'UTC';
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function verifierSupportNotifications(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function obtenirEtatPermission(): NotificationPermission | 'unsupported' {
  if (!verifierSupportNotifications()) return 'unsupported';
  return Notification.permission;
}

export function chargerPreferencesLocales(): NotificationPreferences {
  if (typeof window === 'undefined') return PREFERENCES_DEFAUT;
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE_PREFS);
    if (brut) return { ...PREFERENCES_DEFAUT, ...JSON.parse(brut) };
  } catch {
    /* ignorer */
  }
  return PREFERENCES_DEFAUT;
}

export function sauvegarderPreferencesLocales(prefs: NotificationPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLE_STOCKAGE_PREFS, JSON.stringify(prefs));
  } catch {
    /* ignorer */
  }
}

export async function obtenirAbonnementActif(): Promise<PushSubscription | null> {
  if (!verifierSupportNotifications()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

async function enregistrerAppareil(
  subscription: PushSubscription,
  preferences: NotificationPreferences,
  contexte: ContexteNotifications = {}
): Promise<{ success: boolean; error?: string }> {
  const token = await jetonFirebase();
  if (!token) return { success: false, error: 'Reconnectez-vous pour activer cet appareil.' };
  const subJson = subscription.toJSON();
  const response = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      subscription: subJson,
      preferences,
      timezone: fuseauIanaLocal(),
      calendrier: contexte.groupId ? { groupId: contexte.groupId } : null,
    }),
  });
  const resultat = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    return { success: false, error: resultat.error || 'L’appareil n’a pas pu être vérifié.' };
  }
  sauvegarderPreferencesLocales(preferences);
  try {
    localStorage.setItem(CLE_STOCKAGE_SUB, JSON.stringify(subJson));
  } catch {
    /* ignorer */
  }
  return { success: true };
}

export async function activerNotifications(
  userId?: string,
  preferences: NotificationPreferences = PREFERENCES_DEFAUT,
  contexte: ContexteNotifications = {}
): Promise<{ success: boolean; error?: string }> {
  if (!verifierSupportNotifications()) {
    return { success: false, error: 'Les notifications ne sont pas supportées par ce navigateur.' };
  }

  try {
    // 1. Demande d'autorisation système
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Permission refusée par l’utilisateur.' };
    }

    // 2. Récupération de la clé publique VAPID du Worker
    const resVapid = await fetch('/api/notifications/vapid-key');
    const dataVapid = (await resVapid.json()) as { publicKey?: string };
    const clePublique = dataVapid.publicKey ?? '';
    if (!resVapid.ok || !clePublique) {
      return { success: false, error: 'Les rappels distants ne sont pas encore configurés.' };
    }

    // 3. Enregistrement / récupération du Service Worker
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(clePublique);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as ArrayBuffer,
      });
    }

    // 4. Transmission de l'abonnement et du contexte de groupe au Worker.
    void userId;
    return enregistrerAppareil(subscription, preferences, contexte);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Met à jour préférences, fuseau et calendrier sans redemander la permission.
 * Appelée à chaque changement de groupe et de réglage.
 */
export async function synchroniserNotifications(
  preferences: NotificationPreferences,
  contexte: ContexteNotifications = {}
): Promise<{ success: boolean; error?: string }> {
  const subscription = await obtenirAbonnementActif();
  if (!subscription) return { success: false, error: 'Aucun appareil inscrit.' };
  return enregistrerAppareil(subscription, preferences, contexte);
}

/** Signale au moteur un événement avéré du groupe ; le serveur le revalide. */
export async function publierEvenementGroupe(input: {
  groupId: string;
  type: TypeEvenementGroupe;
  sourceId: string;
}): Promise<void> {
  const token = await jetonFirebase();
  if (!token) return;
  await fetch('/api/notifications/group-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  }).catch(() => {
    /* l'action principale reste valide si la notification ne part pas */
  });
}

export async function desactiverNotifications(): Promise<boolean> {
  if (!verifierSupportNotifications()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      // On prévient le serveur avant de rompre : sans quoi son abonnement
      // resterait en base et il continuerait d'essayer de réveiller un
      // appareil qui n'écoute plus.
      const token = await jetonFirebase();
      if (token) {
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => {
          /* le serveur l'oubliera de lui-même au premier envoi refusé */
        });
      }
      await subscription.unsubscribe();
    }
    localStorage.removeItem(CLE_STOCKAGE_SUB);
    return true;
  } catch {
    return false;
  }
}

export async function envoyerNotificationTest(options?: {
  title?: string;
  body?: string;
  url?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!verifierSupportNotifications()) {
    return { success: false, error: 'Notifications non supportées par ce navigateur.' };
  }

  if (Notification.permission === 'denied') {
    return {
      success: false,
      error: 'Les notifications sont bloquées. Autorisez-les dans les paramètres de votre navigateur ou de votre téléphone.',
    };
  }

  if (Notification.permission === 'default') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      return { success: false, error: 'Veuillez autoriser les notifications lorsque le navigateur vous le demande.' };
    }
  }

  const titre = options?.title || 'Les Fondements · Rappel du Disciple';
  const corps = options?.body || '« Ta parole est une lampe à mes pieds et une lumière sur mon sentier. » (Ps 119:105)';
  const url = options?.url || '/dashboard';

  try {
    const reg = await navigator.serviceWorker.ready;

    // Déclenchement direct par le Service Worker (immédiat & garanti sur l'appareil)
    await reg.showNotification(titre, {
      body: corps,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'test-notification-' + Date.now(),
      data: { url },
    });

    // Envoi parallèle via le Worker distant si abonnement actif
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      const token = await jetonFirebase();
      if (token) {
        void fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            payload: { title: titre, body: corps, url },
          }),
        }).catch(() => {});
      }
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}
