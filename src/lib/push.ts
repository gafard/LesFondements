import webpush from 'web-push';

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:contact@lesfondements.org';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Envoie une notification Web Push sécurisée à un abonné
 */
export async function sendWebPush(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { success: false, error: 'Notifications distantes non configurées' };
  }
  try {
    const payloadString = JSON.stringify({
      title: payload.title || 'Les Fondements',
      body: payload.body,
      url: payload.url || '/dashboard',
      tag: payload.tag || 'fondements-push',
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
    });

    await webpush.sendNotification(
      subscription as unknown as webpush.PushSubscription,
      payloadString,
      {
        TTL: 86400, // 24 heures
        urgency: 'normal',
      }
    );

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Erreur lors de l’envoi de la notification Web Push:', errorMsg);
    return { success: false, error: errorMsg };
  }
}
