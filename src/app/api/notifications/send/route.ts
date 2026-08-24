import { NextRequest, NextResponse } from 'next/server';
import { sendWebPush, PushSubscriptionData, PushPayload } from '@/lib/push';
import { verifierFirebaseToken } from '@/lib/firebaseToken';

export async function POST(req: NextRequest) {
  try {
    await verifierFirebaseToken(req);
    const body = await req.json();
    const { subscription } = body as {
      subscription?: PushSubscriptionData;
    };

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Données d’abonnement Push manquantes ou incomplètes' },
        { status: 400 }
      );
    }

    // Cet endpoint ne sert qu'au test de l'appareil. Le contenu reste borné
    // côté serveur : il ne peut pas devenir un relais push arbitraire.
    const notificationPayload: PushPayload = {
      title: 'Les Fondements · Test du rappel',
      body: 'Votre carnet peut maintenant vous rappeler de revenir à la Parole.',
      url: '/dashboard',
      tag: 'test-notification',
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
    const status = errorMsg === 'UNAUTHENTICATED' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Authentification requise' : errorMsg }, { status });
  }
}
