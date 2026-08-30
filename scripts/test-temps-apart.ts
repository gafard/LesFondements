/**
 * Contrôle des temps quotidiens.
 *
 * Les découpages vivent dans `src/data/tempsApart.json` et s'appuient sur des
 * repères pris dans le texte du livret — un sous-titre, une tournure. Si le
 * livret est retouché, ces repères peuvent disparaître : la fiche retombe
 * alors sur ses sections d'origine, et personne ne s'en aperçoit avant qu'un
 * disciple ouvre son temps du jour.
 *
 * Ce contrôle échoue à la place.
 */
import decoupages from '../src/data/tempsApart.json' with { type: 'json' };
import livret from '../src/data/livret.json' with { type: 'json' };
import { etapesTempsApart } from '../src/lib/tempsApart';
import type { FicheLivret } from '../src/lib/livret';

const fiches = (livret as { fiches: FicheLivret[] }).fiches;
const declarees = Object.keys(decoupages).filter((c) => !c.startsWith('_'));

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

console.log(
  `\n${declarees.length} découpage(s) déclaré(s), ${fiches.length - declarees.length} fiche(s) sur leurs sections d'origine.`
);

if (echecs) {
  console.error(`\n${echecs} problème(s).`);
  process.exit(1);
}
console.log('Tous les repères tiennent.');
