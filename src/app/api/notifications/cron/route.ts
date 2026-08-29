import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { sendWebPush, type PushPayload } from '@/lib/push';
import {
  dejaServi,
  enregistrerAbonnement,
  estLHeure,
  fuseauIanaValide,
  heureLocale,
  jourLocal,
  lireEvenementsGroupe,
  marquerServi,
  oublierAbonnement,
  parcourirAbonnements,
  prochaineRencontre,
  type AbonnementRappel,
  type EvenementGroupe,
} from '@/lib/rappels';
import { VERSETS_CONNUS } from '@/data/versets';

function versetDuJour(jour: string): { reference: string; texte: string } | null {
  const references = Object.keys(VERSETS_CONNUS).sort();
  if (!references.length) return null;
  const index = Math.floor(new Date(`${jour}T00:00:00Z`).getTime() / 86_400_000);
  const reference = references[index % references.length];
  return { reference, texte: VERSETS_CONNUS[reference] };
}

function goutteDeRosee(jour: string, ficheId?: number): PushPayload | null {
  const verset = versetDuJour(jour);
  if (!verset) return null;
  const texte = verset.texte.length > 140 ? `${verset.texte.slice(0, 137)}…` : verset.texte;
  return {
    title: 'Votre table du jour',
    body: `« ${texte} » — ${verset.reference}`,
    url: ficheId ? `/rituel?fiche=${ficheId}` : '/rituel',
    tag: `rosee-${jour}`,
  };
}

function appelAdmis(requete: Request): boolean {
  const attendu = process.env.CRON_SECRET;
  return Boolean(attendu && requete.headers.get('x-cron-secret') === attendu);
}

function estAppareilDisparu(erreur: unknown): boolean {
  return /\b(404|410)\b/.test(String(erreur));
}

function syntheseEvenements(evenements: EvenementGroupe[]): PushPayload {
  const dernier = evenements.at(-1)!;
  if (evenements.length === 1) {
    return {
      title: dernier.title,
      body: dernier.body,
      url: dernier.url,
      tag: `groupe-${dernier.id}`,
    };
  }
  return {
    title: `${evenements.length} nouvelles sur la table du groupe`,
    body: `${dernier.title}. Ouvrez votre carnet pour retrouver tout ce qui s’est passé.`,
    url: '/groupes',
    tag: `groupe-lot-${dernier.id}`,
  };
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
  const cacheEvenements = new Map<string, Promise<EvenementGroupe[]>>();
  let examines = 0;
  let envoyes = 0;
  let oublies = 0;
  let ignoresSansFuseau = 0;

  await parcourirAbonnements(env.RAPPELS, async (initial) => {
    examines += 1;
    if (!fuseauIanaValide(initial.timezone)) {
      // Les anciens enregistrements au simple décalage UTC sont volontairement
      // inertes. L'application les migre dès sa prochaine ouverture.
      ignoresSansFuseau += 1;
      return;
    }

    let abonnement: AbonnementRappel = { ...initial, dedup: initial.dedup ?? {} };
    let modifie = false;
    let disparu = false;

    const envoyer = async (cles: string[], message: PushPayload) => {
      if (cles.every((cle) => dejaServi(abonnement, cle))) return;
      try {
        await sendWebPush(
          { endpoint: abonnement.endpoint, keys: abonnement.keys },
          message
        );
        abonnement = marquerServi(abonnement, cles, maintenant.getTime());
        modifie = true;
        envoyes += 1;
      } catch (erreur) {
        if (estAppareilDisparu(erreur)) disparu = true;
      }
    };

    const preferences = abonnement.preferences;
    const jour = jourLocal(maintenant, abonnement.timezone);
    const heure = heureLocale(maintenant, abonnement.timezone);
    const calendrier = abonnement.calendrier;

    if (
      preferences?.goutteDeRosee &&
      estLHeure(preferences.heureMatin || '07:30', heure)
    ) {
      const message = goutteDeRosee(jour, calendrier?.currentStep);
      if (message) await envoyer([`rosee:${jour}`], message);
    }

    if (calendrier && !disparu) {
      const rencontre = prochaineRencontre(calendrier, maintenant);
      if (rencontre) {
        const rencontreId = rencontre.toISOString();
        const delta = rencontre.getTime() - maintenant.getTime();
        if (
          preferences.rappel48h &&
          delta > 24 * 60 * 60_000 &&
          delta <= 48 * 60 * 60_000
        ) {
          await envoyer([`rencontre:48h:${rencontreId}`], {
            title: `Préparer la fiche ${calendrier.currentStep}`,
            body: `${calendrier.groupName} se retrouve dans moins de 48 h. Votre feuille vous attend.`,
            url: `/rituel?fiche=${calendrier.currentStep}`,
            tag: `rencontre-48h-${rencontreId}`,
          });
        }

        const jourRencontre = jourLocal(rencontre, abonnement.timezone);
        if (
          preferences.jourDeRencontre &&
          jour === jourRencontre &&
          heure >= '08:00' &&
          delta > 0
        ) {
          await envoyer([`rencontre:jour:${rencontreId}`], {
            title: `Rencontre aujourd’hui · ${calendrier.groupName}`,
            body: `Rendez-vous à ${calendrier.time} (${calendrier.timezone}) autour de la fiche ${calendrier.currentStep}.`,
            url: '/groupes',
            tag: `rencontre-jour-${rencontreId}`,
          });
        }
      }

      if (preferences.vieDeGroupe && !disparu) {
        const promesse =
          cacheEvenements.get(calendrier.groupId) ??
          lireEvenementsGroupe(env.RAPPELS!, calendrier.groupId);
        cacheEvenements.set(calendrier.groupId, promesse);
        const evenements = (await promesse).filter(
          (evenement) =>
            evenement.createdAt >= abonnement.evenementsDepuis &&
            evenement.actorUid !== abonnement.uid &&
            !dejaServi(abonnement, `evenement:${evenement.id}`)
        );
        if (evenements.length) {
          const lot = evenements.slice(-5);
          await envoyer(
            lot.map((evenement) => `evenement:${evenement.id}`),
            syntheseEvenements(lot)
          );
        }
      }
    }

    if (disparu) {
      await oublierAbonnement(env.RAPPELS!, abonnement.endpoint);
      oublies += 1;
    } else if (modifie) {
      await enregistrerAbonnement(env.RAPPELS!, abonnement);
    }
  });

  return NextResponse.json({
    active: true,
    a: maintenant.toISOString(),
    examines,
    envoyes,
    oublies,
    ignoresSansFuseau,
  });
}

export type { AbonnementRappel };
