/**
 * Gestionnaire client des notifications Web Push propulsé par Cloudflare Workers
 */

export interface NotificationPreferences {
  goutteDeRosee: boolean; // Méditation du matin
  rappelFiche: boolean;    // Reprendre la fiche en cours
  vieDeGroupe: boolean;    // Rappels de rencontres & partages
  heureMatin: string;      // ex: "07:30"
}

export const PREFERENCES_DEFAUT: NotificationPreferences = {
  goutteDeRosee: true,
  rappelFiche: true,
  vieDeGroupe: true,
  heureMatin: '07:30',
};

const CLE_STOCKAGE_PREFS = 'lf.notifPreferences';
const CLE_STOCKAGE_SUB = 'lf.pushSubscription';

async function jetonFirebase(): Promise<string | null> {
  try {
    const { getFirebaseAuth } = await import('./firebase');
    const auth = await getFirebaseAuth();
    return (await auth.currentUser?.getIdToken()) ?? null;
  } catch {
    return null;
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

export async function activerNotifications(
  userId?: string,
  preferences: NotificationPreferences = PREFERENCES_DEFAUT
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

    // 4. Transmission de l'abonnement à l'API Worker
    const subJson = subscription.toJSON();
    const token = await jetonFirebase();
    if (!token) return { success: false, error: 'Reconnectez-vous pour activer cet appareil.' };
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        subscription: subJson,
        userId: userId || 'anonyme',
        preferences,
      }),
    });
    if (!response.ok) throw new Error('L’appareil n’a pas pu être vérifié.');

    // 5. Sauvegarde locale
    sauvegarderPreferencesLocales(preferences);
    try {
      localStorage.setItem(CLE_STOCKAGE_SUB, JSON.stringify(subJson));
    } catch {
      /* ignorer */
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

export async function desactiverNotifications(): Promise<boolean> {
  if (!verifierSupportNotifications()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
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
    return { success: false, error: 'Notifications non supportées.' };
  }

  const titre = options?.title || 'Les Fondements · Notification Worker';
  const corps = options?.body || '« Ta parole est une lampe à mes pieds et une lumière sur mon sentier. » (Ps 119:105)';
  const url = options?.url || '/dashboard';

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();

    if (subscription) {
      const token = await jetonFirebase();
      if (!token) throw new Error('Reconnectez-vous pour tester le rappel.');
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          payload: {
            title: titre,
            body: corps,
            url,
            tag: 'test-push-' + Date.now(),
          },
        }),
      });

      if (res.ok) {
        return { success: true };
      }
    }

    // Repli direct par le Service Worker si l'envoi réseau distant échoue
    await reg.showNotification(titre, {
      body: corps,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url },
    });

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}
