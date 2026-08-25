import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { verifierFirebaseToken } from '@/lib/firebaseToken';
import { PREFERENCES_DEFAUT, type NotificationPreferences } from '@/lib/notifications';
import { enregistrerAbonnement, oublierAbonnement } from '@/lib/rappels';

/**
 * S'abonner aux rappels — et cette fois, en garder trace.
 *
 * Cette route vérifiait le jeton puis ne stockait rien : elle répondait
 * « persisted: false », les préférences restaient sur l'appareil, et aucun
 * rappel programmé ne pouvait partir. Le carnet promettait de réveiller
 * quelqu'un à 7 h 30 sans jamais pouvoir le faire.
 */

export async function POST(req: NextRequest) {
  try {
    const { uid } = await verifierFirebaseToken(req);
    const corps = (await req.json()) as {
      subscription?: { endpoint?: string; keys?: { p256dh: string; auth: string } };
      preferences?: Partial<NotificationPreferences>;
      decalage?: number;
    };

    const abonnement = corps.subscription;
    if (!abonnement?.endpoint || !abonnement.keys?.p256dh || !abonnement.keys.auth) {
      return NextResponse.json({ error: 'Abonnement push incomplet' }, { status: 400 });
    }

    const { env } = getCloudflareContext();
    if (!env.RAPPELS) {
      // On le dit plutôt que de laisser croire à un enregistrement.
      return NextResponse.json(
        { success: true, persisted: false, message: 'Rappels distants non configurés' },
        { status: 200 }
      );
    }

    await enregistrerAbonnement(env.RAPPELS, {
      endpoint: abonnement.endpoint,
      keys: abonnement.keys,
      uid,
      preferences: { ...PREFERENCES_DEFAUT, ...corps.preferences },
      // Le décalage vient du navigateur : c'est lui qui sait à quelle heure
      // il est chez la personne.
      decalage: Number.isFinite(corps.decalage) ? Number(corps.decalage) : 0,
      inscritLe: Date.now(),
    });

    return NextResponse.json({ success: true, persisted: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const statut = message === 'UNAUTHENTICATED' ? 401 : 500;
    return NextResponse.json(
      { error: statut === 401 ? 'Authentification requise' : message },
      { status: statut }
    );
  }
}

/** Se désabonner : l'appareil ne doit plus être réveillé. */
export async function DELETE(req: NextRequest) {
  try {
    await verifierFirebaseToken(req);
    const { endpoint } = (await req.json()) as { endpoint?: string };
    if (!endpoint) return NextResponse.json({ error: 'Adresse manquante' }, { status: 400 });

    const { env } = getCloudflareContext();
    if (env.RAPPELS) await oublierAbonnement(env.RAPPELS, endpoint);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const statut = message === 'UNAUTHENTICATED' ? 401 : 500;
    return NextResponse.json({ error: message }, { status: statut });
  }
}
