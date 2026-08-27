import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { verifierFirebaseToken } from '@/lib/firebaseToken';
import { lireDocumentFirestore, verifierMembreActif } from '@/lib/firestoreRest';
import { enregistrerEvenementGroupe } from '@/lib/rappels';
import type { TypeEvenementGroupe } from '@/lib/notifications';
import type { GroupPost, GroupSession, ParcoursGroup } from '@/lib/types';

const TYPES = new Set<TypeEvenementGroupe>([
  'rencontre_ouverte',
  'etape_debloquee',
  'pepite',
]);

function estAnimateur(role: string): boolean {
  return role === 'animateur' || role === 'co_animateur';
}

export async function POST(requete: NextRequest) {
  try {
    const { uid, token } = await verifierFirebaseToken(requete);
    const corps = (await requete.json()) as {
      groupId?: string;
      type?: TypeEvenementGroupe;
      sourceId?: string;
    };
    const groupId = corps.groupId?.trim() ?? '';
    const sourceId = corps.sourceId?.trim() ?? '';
    if (
      !groupId ||
      groupId.length > 100 ||
      !sourceId ||
      sourceId.length > 140 ||
      !corps.type ||
      !TYPES.has(corps.type)
    ) {
      return NextResponse.json({ error: 'Événement invalide' }, { status: 400 });
    }

    const [{ role }, groupe] = await Promise.all([
      verifierMembreActif(token, groupId, uid),
      lireDocumentFirestore<ParcoursGroup>(token, 'groups', groupId),
    ]);
    if (!groupe || groupe.id !== groupId) throw new Error('FORBIDDEN');

    let title = 'Vie du groupe';
    let body = '';
    let url = '/groupes';

    if (corps.type === 'pepite') {
      const post = await lireDocumentFirestore<GroupPost>(
        token,
        'groups',
        groupId,
        'posts',
        sourceId
      );
      if (!post || post.kind !== 'pepite' || post.authorId !== uid) throw new Error('FORBIDDEN');
      title = `Nouvelle pépite · ${groupe.name}`;
      body = 'Un membre vient de déposer une lumière sur la table du groupe.';
    } else {
      if (!estAnimateur(role)) throw new Error('FORBIDDEN');
      const session = await lireDocumentFirestore<GroupSession>(
        token,
        'groups',
        groupId,
        'sessions',
        sourceId
      );
      if (!session || session.groupId !== groupId) throw new Error('FORBIDDEN');
      if (corps.type === 'rencontre_ouverte') {
        if (session.status !== 'ouverte') throw new Error('FORBIDDEN');
        title = `La rencontre commence · ${groupe.name}`;
        body = `La table de la fiche ${session.step} est ouverte. Votre groupe vous attend.`;
        url = '/groupes/rencontre';
      } else {
        if (session.status !== 'terminee' || session.closedBy !== uid) throw new Error('FORBIDDEN');
        title = `Nouvelle étape · ${groupe.name}`;
        body = groupe.currentStep >= 20 && groupe.completedAt
          ? 'Le parcours des 20 fondements vient d’être achevé ensemble.'
          : `La fiche ${groupe.currentStep} est maintenant ouverte à la préparation.`;
        url = `/fiches/${groupe.currentStep}`;
      }
    }

    const { env } = getCloudflareContext();
    if (!env.RAPPELS) {
      return NextResponse.json({ error: 'Moteur de rappels non configuré' }, { status: 503 });
    }
    const evenement = await enregistrerEvenementGroupe(env.RAPPELS, {
      groupId,
      type: corps.type,
      sourceId,
      actorUid: uid,
      title,
      body,
      url,
    });
    return NextResponse.json({ success: true, eventId: evenement.id });
  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : String(erreur);
    const statut = message === 'UNAUTHENTICATED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json(
      { error: statut === 401 ? 'Authentification requise' : statut === 403 ? 'Action refusée' : message },
      { status: statut }
    );
  }
}
