import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { verifierFirebaseToken } from '@/lib/firebaseToken';
import { lireDocumentFirestore, verifierMembreActif } from '@/lib/firestoreRest';
import { PREFERENCES_DEFAUT, type NotificationPreferences } from '@/lib/notifications';
import {
  enregistrerAbonnement,
  fuseauIanaValide,
  lireAbonnement,
  oublierAbonnement,
  type CalendrierGroupe,
} from '@/lib/rappels';
import type { ParcoursGroup } from '@/lib/types';

/**
 * S'abonner aux rappels — et cette fois, en garder trace.
 *
 * Cette route vérifiait le jeton puis ne stockait rien : elle répondait
 * « persisted: false », les préférences restaient sur l'appareil, et aucun
 * rappel programmé ne pouvait partir. Le carnet promettait de réveiller
 * quelqu'un à 7 h 30 sans jamais pouvoir le faire.
 */

function preferencesValides(entree?: Partial<NotificationPreferences>): NotificationPreferences {
  const heure = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(entree?.heureMatin ?? '')
    ? entree!.heureMatin!
    : PREFERENCES_DEFAUT.heureMatin;
  return {
    goutteDeRosee: entree?.goutteDeRosee ?? PREFERENCES_DEFAUT.goutteDeRosee,
    heureMatin: heure,
    rappel48h: entree?.rappel48h ?? PREFERENCES_DEFAUT.rappel48h,
    jourDeRencontre: entree?.jourDeRencontre ?? PREFERENCES_DEFAUT.jourDeRencontre,
    vieDeGroupe: entree?.vieDeGroupe ?? PREFERENCES_DEFAUT.vieDeGroupe,
  };
}

async function calendrierAutorise(
  token: string,
  uid: string,
  groupId?: string
): Promise<CalendrierGroupe | undefined> {
  if (!groupId || groupId.length > 100) return undefined;
  await verifierMembreActif(token, groupId, uid);
  const groupe = await lireDocumentFirestore<ParcoursGroup>(token, 'groups', groupId);
  if (!groupe?.meeting || groupe.id !== groupId) throw new Error('FORBIDDEN');
  const timezone = groupe.meeting.timezone;
  if (!fuseauIanaValide(timezone)) throw new Error('INVALID_TIMEZONE');
  return {
    groupId,
    groupName: String(groupe.name || 'Votre groupe').slice(0, 100),
    currentStep: Math.max(1, Math.min(20, Number(groupe.currentStep) || 1)),
    // Sans cette date, le rappel du matin ne saurait pas dire à quel temps de
    // la fiche on en est : il ne connaîtrait que le numéro de la fiche.
    ...(Number.isFinite(Number(groupe.stepOpenedAt))
      ? { stepOpenedAt: Number(groupe.stepOpenedAt) }
      : {}),
    rhythm: groupe.meeting.rhythm === 'bimensuel' ? 'bimensuel' : 'hebdomadaire',
    weekday: Math.max(0, Math.min(6, Number(groupe.meeting.weekday) || 0)),
    time: /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(groupe.meeting.time)
      ? groupe.meeting.time
      : '20:00',
    timezone,
    ...(groupe.meeting.firstMeetingDate
      ? { firstMeetingDate: groupe.meeting.firstMeetingDate }
      : {}),
    ...(groupe.meeting.nextMeetingDate
      ? { nextMeetingDate: groupe.meeting.nextMeetingDate }
      : {}),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { uid, token } = await verifierFirebaseToken(req);
    const corps = (await req.json()) as {
      subscription?: { endpoint?: string; keys?: { p256dh: string; auth: string } };
      preferences?: Partial<NotificationPreferences>;
      timezone?: string;
      calendrier?: { groupId?: string } | null;
    };

    const abonnement = corps.subscription;
    if (!abonnement?.endpoint || !abonnement.keys?.p256dh || !abonnement.keys.auth) {
      return NextResponse.json({ error: 'Abonnement push incomplet' }, { status: 400 });
    }
    if (!fuseauIanaValide(corps.timezone)) {
      return NextResponse.json(
        { error: 'Fuseau horaire IANA invalide (ex. Africa/Lome ou Europe/Paris).' },
        { status: 400 }
      );
    }

    const { env } = getCloudflareContext();
    if (!env.RAPPELS) {
      // On le dit plutôt que de laisser croire à un enregistrement.
      return NextResponse.json(
        { success: true, persisted: false, message: 'Rappels distants non configurés' },
        { status: 200 }
      );
    }

    const [precedent, calendrier] = await Promise.all([
      lireAbonnement(env.RAPPELS, abonnement.endpoint),
      calendrierAutorise(token, uid, corps.calendrier?.groupId),
    ]);
    const preferences = preferencesValides(corps.preferences);
    const maintenant = Date.now();
    const reprendVieDeGroupe = !precedent?.preferences?.vieDeGroupe && preferences.vieDeGroupe;

    await enregistrerAbonnement(env.RAPPELS, {
      endpoint: abonnement.endpoint,
      keys: abonnement.keys,
      uid,
      preferences,
      timezone: corps.timezone,
      ...(calendrier ? { calendrier } : {}),
      inscritLe: precedent?.uid === uid ? precedent.inscritLe : maintenant,
      evenementsDepuis:
        precedent?.uid === uid && !reprendVieDeGroupe ? precedent.evenementsDepuis : maintenant,
      dedup: precedent?.uid === uid ? precedent.dedup ?? {} : {},
    });

    return NextResponse.json({ success: true, persisted: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const statut = message === 'UNAUTHENTICATED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json(
      {
        error:
          statut === 401
            ? 'Authentification requise'
            : statut === 403
              ? 'Ce calendrier de groupe ne vous est pas accessible.'
              : message,
      },
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
