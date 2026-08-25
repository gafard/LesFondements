import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { sendWebPush, type PushPayload } from '@/lib/push';
import {
  enregistrerAbonnement,
  estLHeure,
  heureLocale,
  jourLocal,
  oublierAbonnement,
  parcourirAbonnements,
  type AbonnementRappel,
} from '@/lib/rappels';
import { VERSETS_CONNUS } from '@/data/versets';

/**
 * Le réveil des rappels.
 *
 * Cette route ne faisait rien : elle rendait « active: false » et une
 * méditation d'exemple. Rien ne partait jamais, alors que l'interface
 * proposait de choisir son heure.
 *
 * Elle est appelée tous les quarts d'heure par le déclencheur Cloudflare.
 * Chaque abonnement porte le décalage horaire de son navigateur : c'est ce
 * qui permet de servir 7 h 30 à chacun chez lui, sans table des fuseaux.
 */

/** Le verset du jour, choisi comme sur l'écran de lancement. */
function versetDuJour(jour: string): { reference: string; texte: string } | null {
  const references = Object.keys(VERSETS_CONNUS).sort();
  if (!references.length) return null;
  // Le même calendrier que le client : la date, pas l'horloge du serveur.
  const index = Math.floor(new Date(`${jour}T00:00:00Z`).getTime() / 86_400_000);
  const reference = references[index % references.length];
  return { reference, texte: VERSETS_CONNUS[reference] };
}

function goutteDeRosee(jour: string): PushPayload | null {
  const verset = versetDuJour(jour);
  if (!verset) return null;
  const texte = verset.texte.length > 140 ? `${verset.texte.slice(0, 137)}…` : verset.texte;
  return {
    title: 'Goutte de rosée',
    body: `« ${texte} » — ${verset.reference}`,
    url: '/memorisation',
    tag: `rosee-${jour}`,
  };
}

/**
 * Le déclencheur est public par nature. Un secret l'accompagne, sinon
 * n'importe qui pourrait réveiller tout le monde à trois heures du matin.
 */
function appelAdmis(requete: Request): boolean {
  const attendu = process.env.CRON_SECRET;
  if (!attendu) return false;
  return requete.headers.get('x-cron-secret') === attendu;
}

export async function GET(requete: Request) {
  if (!appelAdmis(requete)) {
    return NextResponse.json({ error: 'Appel non autorisé' }, { status: 403 });
  }

  const { env } = getCloudflareContext();
  if (!env.RAPPELS) {
    return NextResponse.json({ error: 'Rappels non configurés' }, { status: 503 });
  }

  const maintenant = new Date();
  let examines = 0;
  let envoyes = 0;
  let oublies = 0;

  await parcourirAbonnements(env.RAPPELS, async (abonnement) => {
    examines += 1;
    const preferences = abonnement.preferences;
    if (!preferences?.goutteDeRosee) return;

    const heure = heureLocale(maintenant, abonnement.decalage);
    if (!estLHeure(preferences.heureMatin || '07:30', heure)) return;

    // Une goutte par jour : le réveil passe quatre fois par heure.
    const jour = jourLocal(maintenant, abonnement.decalage);
    if (abonnement.derniereRosee === jour) return;

    const message = goutteDeRosee(jour);
    if (!message) return;

    try {
      await sendWebPush(
        { endpoint: abonnement.endpoint, keys: abonnement.keys },
        message
      );
      envoyes += 1;
      await enregistrerAbonnement(env.RAPPELS!, { ...abonnement, derniereRosee: jour });
    } catch (erreur) {
      // 404 ou 410 : l'appareil a désinstallé ou révoqué. On oublie plutôt
      // que de réessayer indéfiniment un destinataire disparu.
      const message = String(erreur);
      if (/\b(404|410)\b/.test(message)) {
        await oublierAbonnement(env.RAPPELS!, abonnement.endpoint);
        oublies += 1;
      }
    }
  });

  return NextResponse.json({
    active: true,
    a: maintenant.toISOString(),
    examines,
    envoyes,
    oublies,
  });
}

export type { AbonnementRappel };
