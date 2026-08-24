import { NextRequest, NextResponse } from 'next/server';
import { sendWebPush, PushSubscriptionData, PushPayload } from '@/lib/push';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, payload } = body as {
      subscription?: PushSubscriptionData;
      payload?: PushPayload;
    };

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Données d’abonnement Push manquantes ou incomplètes' },
        { status: 400 }
      );
    }

    const notificationPayload: PushPayload = {
      title: payload?.title || 'Les Fondements · Parole du jour',
      body: payload?.body || '« Arrêtez, et sachez que je suis Dieu. » (Ps 46:11)',
      url: payload?.url || '/dashboard',
      tag: payload?.tag || 'test-notification',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    };

    const resultat = await sendWebPush(subscription, notificationPayload);

    if (!resultat.success) {
      return NextResponse.json(
        { error: resultat.error || 'Échec de l’envoi de la notification push' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification envoyée avec succès via le Worker',
      sentAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
