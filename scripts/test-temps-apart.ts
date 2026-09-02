/**
 * Contrôle des temps quotidiens.
 *
 * Les découpages vivent dans `src/data/tempsApart.json` et s'appuient sur des
 * repères pris dans le texte du livret — un sous-titre, une tournure. Si le
 * livret est retouché, ces repères peuvent disparaître : la fiche retombe
 * alors sur ses sections d'origine, et personne ne s'en aperçoit avant qu'un
 * disciple ouvre son temps du jour.
 *
 * Ce contrôle échoue à la place. Il vérifie aussi que chaque temps a bien la
 * série de questions qui lui correspond : les deux se rejoignent par leur
 * position, si bien qu'un temps ajouté d'un côté et pas de l'autre ferait
 * lire les questions du mardi le lundi, sans rien casser d'apparent.
 */
import decoupages from '../src/data/tempsApart.json' with { type: 'json' };
import livret from '../src/data/livret.json' with { type: 'json' };
import meditations from '../src/data/meditation-questions.json' with { type: 'json' };
import titresPublies from '../src/data/tempsTitres.json' with { type: 'json' };
import { titresDesTemps } from './generer-temps-titres';
import { etapesTempsApart } from '../src/lib/tempsApart';
import type { FicheLivret } from '../src/lib/livret';

const fiches = (livret as { fiches: FicheLivret[] }).fiches;
const declarees = Object.keys(decoupages).filter((c) => !c.startsWith('_'));

interface FicheMeditation {
  ficheId: number;
  /** Les fiches réécrites promettent une série de questions par temps. */
  parcoursGuide?: boolean;
  sections: { sectionTitre: string }[];
}
const parcours = meditations as FicheMeditation[];

let echecs = 0;

for (const cle of declarees) {
  const fiche = fiches.find((f) => String(f.id) === cle);
  if (!fiche) {
    console.error(`✗ fiche ${cle} déclarée mais absente du livret`);
    echecs += 1;
    continue;
  }

  const attendues = (decoupages as unknown as Record<string, { titre: string }[]>)[cle];
  const obtenues = etapesTempsApart(fiche);

  if (obtenues.length !== attendues.length) {
    // Le repli silencieux est précisément ce qu'on veut voir échouer ici.
    console.error(
      `✗ fiche ${fiche.id} : ${obtenues.length} temps au lieu de ${attendues.length} — un repère a dû bouger`
    );
    echecs += 1;
    continue;
  }

  const vide = obtenues.find((e) => e.section.blocs.length === 0);
  if (vide) {
    console.error(`✗ fiche ${fiche.id} : « ${vide.section.titre} » est vide`);
    echecs += 1;
    continue;
  }

  console.log(
    `✓ fiche ${String(fiche.id).padStart(2)} · ${obtenues.length} temps · ` +
      obtenues.map((e) => e.section.titre).join(' | ')
  );
}

// Les fiches non déclarées doivent rendre leurs sections telles quelles.
for (const fiche of fiches) {
  if (declarees.includes(String(fiche.id))) continue;
  const obtenues = etapesTempsApart(fiche);
  if (obtenues.length !== fiche.sections.length) {
    console.error(
      `✗ fiche ${fiche.id} : sans découpage déclaré, on attend ${fiche.sections.length} sections`
    );
    echecs += 1;
  }
}

// Chaque temps tire ses questions de la série de même rang : un décalage
// donnerait au jour 2 les questions du jour 3.
for (const fiche of fiches) {
  const meditation = parcours.find((m) => m.ficheId === fiche.id);
  if (!meditation) continue;

  const temps = etapesTempsApart(fiche);
  if (temps.length !== meditation.sections.length) {
    const orphelins = temps.length - meditation.sections.length;
    if (meditation.parcoursGuide) {
      console.error(
        `✗ fiche ${fiche.id} : ${temps.length} temps mais ${meditation.sections.length} série(s) de questions`
      );
      echecs += 1;
      continue;
    }
    // Ces jours utilisent volontairement la facilitation ouverte commune :
    // le texte du livret reste premier et aucune question générée ne vient
    // lui imposer une conclusion.
    console.log(
      `· fiche ${fiche.id} : ${orphelins} jour(s) utilisent les deux invitations ouvertes — ` +
        `${temps.slice(meditation.sections.length).map((e) => e.section.titre ?? '?').join(', ')}`
    );
    continue;
  }

  temps.forEach((etape, rang) => {
    const attendu = meditation.sections[rang].sectionTitre;
    if (etape.section.titre && etape.section.titre !== attendu) {
      console.error(
        `✗ fiche ${fiche.id}, jour ${rang + 1} : le temps « ${etape.section.titre} » ` +
          `reçoit les questions de « ${attendu} »`
      );
      echecs += 1;
    }
  });
}

// Le rappel du matin lit `tempsTitres.json`, précalculé pour le worker. S'il
// s'écarte du découpage, la notification annonce un temps que l'application
// n'ouvre plus. On le compare ici plutôt que de s'en apercevoir un matin.
{
  const attendu = titresDesTemps();
  const publie = titresPublies as Record<string, string[]>;
  for (const [cle, titres] of Object.entries(attendu)) {
    const enLigne = publie[cle] ?? [];
    if (JSON.stringify(enLigne) !== JSON.stringify(titres)) {
      console.error(
        `✗ fiche ${cle} : tempsTitres.json est en retard — lancer « npm run temps:titres »`
      );
      echecs += 1;
      break;
    }
  }
}

console.log(
  `\n${declarees.length} découpage(s) déclaré(s), ${fiches.length - declarees.length} fiche(s) sur leurs sections d'origine.`
);

if (echecs) {
  console.error(`\n${echecs} problème(s).`);
  process.exit(1);
}
console.log('Tous les repères tiennent.');
