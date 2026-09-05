import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import meditations from '../src/data/meditation-questions.json' with { type: 'json' };
import constitution from '../src/data/constitution-editoriale.json' with { type: 'json' };
import livret from '../src/data/livret.json' with { type: 'json' };
import {
  MAX_QUESTIONS_ESSENTIELLES,
  accompagnementDuJour,
  repartirQuestions,
  type QuestionEditoriale,
} from '../src/lib/parcoursEditorial';
import { etapesTempsApart } from '../src/lib/tempsApart';
import type { FicheLivret } from '../src/lib/livret';

interface FicheMeditation {
  ficheId: number;
  sections: Array<{ sectionTitre: string; questions: QuestionEditoriale[] }>;
}

let jours = 0;
assert.equal(constitution.regles.questionsEssentiellesMaximumParDefaut, MAX_QUESTIONS_ESSENTIELLES);
assert.equal(constitution.regles.parcoursReluPeutEtreCompose, true);
assert.equal(constitution.regles.texteCanoniqueToujoursVisible, true);
for (const fiche of meditations as FicheMeditation[]) {
  for (const section of fiche.sections) {
    const repartition = repartirQuestions(section.questions);
    jours += 1;
    assert.ok(repartition.principales.length > 0, `Fiche ${fiche.ficheId} · ${section.sectionTitre} sans question essentielle`);
    const estPilote = [1, 4, 6].includes(fiche.ficheId);
    if (estPilote) {
      assert.ok(
        repartition.principales.length >= 3,
        `Fiche ${fiche.ficheId} · ${section.sectionTitre} doit conserver un vrai chemin de compréhension`
      );
      assert.ok(
        section.questions.every((question) => question.priorite && question.phase),
        `Fiche ${fiche.ficheId} · ${section.sectionTitre} doit être entièrement composée par l’éditeur`
      );
      if (fiche.ficheId === 1) {
        const phases = new Set(repartition.principales.map((question) => question.phase));
        assert.ok(
          phases.has('regarder') && phases.has('comprendre') && phases.has('mettre-en-mots'),
          `Fiche 1 · ${section.sectionTitre} doit faire regarder, comprendre et mettre en mots`
        );
      } else {
        const phases = new Set(repartition.principales.map((question) => question.phase));
        assert.ok(
          phases.has('comprendre') && phases.has('repondre'),
          `Fiche ${fiche.ficheId} · ${section.sectionTitre} doit au moins comprendre et répondre`
        );
      }
    } else {
      assert.ok(
        repartition.principales.length <= MAX_QUESTIONS_ESSENTIELLES,
        `Fiche ${fiche.ficheId} · ${section.sectionTitre} dépasse la limite par défaut`
      );
    }
    assert.equal(
      repartition.principales.length + repartition.approfondissement.length,
      section.questions.length,
      `Fiche ${fiche.ficheId} · ${section.sectionTitre} perd une question`
    );
  }
}

const fiches = (livret as { fiches: FicheLivret[] }).fiches;
const tempsCanoniques = fiches.flatMap((fiche) => etapesTempsApart(fiche));
assert.equal(tempsCanoniques.length, 104, 'Le parcours quotidien doit conserver ses 104 temps.');
for (const temps of tempsCanoniques) {
  assert.ok(
    temps.section.blocs.length > 0 || Boolean(temps.section.titre?.trim()),
    'Un temps ne doit perdre ni son titre ni le texte du livret.'
  );
}

for (const index of [1, 2, 3]) {
  assert.ok(accompagnementDuJour(8, index), `Fiche 8 · jour ${index + 1} doit proposer un accompagnement`);
}

const fiche8 = (meditations as FicheMeditation[]).find((fiche) => fiche.ficheId === 8);
const texteFiche8 = JSON.stringify(fiche8);
assert.ok(!texteFiche8.includes('correspondre à ce que le livret décrit ici'), 'La fiche 8 ne doit pas conduire un autodiagnostic.');
assert.ok(!texteFiche8.includes('ouvrir cette porte ou créer ce lien'), 'La fiche 8 ne doit pas faire rechercher seul une cause spirituelle.');

const fiche9 = (meditations as FicheMeditation[]).find((fiche) => fiche.ficheId === 9);
assert.ok(JSON.stringify(fiche9).includes('pensée à discerner'), 'La fiche 9 doit nommer les perceptions comme étant à discerner.');

const fiche1 = (meditations as FicheMeditation[]).find((fiche) => fiche.ficheId === 1);
const texteFiche1 = JSON.stringify(fiche1);
assert.ok(texteFiche1.includes('Qu’évoque pour toi le fait que Dieu règne ?'), 'La question originale du premier temps doit rester visible.');
assert.ok(texteFiche1.includes('As-tu saisi la grandeur de son amour inconditionnel'), 'La question originale du deuxième temps doit rester visible.');
assert.ok(texteFiche1.includes('comment expliquerais-tu'), 'La fiche 1 doit comporter de vraies questions de compréhension.');

const immersion = await readFile(resolve(process.cwd(), 'src/components/Immersion.tsx'), 'utf8');
assert.ok(
  !immersion.includes('if (!parcoursMeditation?.parcoursGuide)'),
  'Une facilitation numérique ne doit jamais masquer le texte du livret.'
);
assert.ok(
  immersion.includes('section.blocs.forEach'),
  'Le scénario quotidien doit parcourir les blocs canoniques du livret.'
);

console.log(`Constitution éditoriale vérifiée : ${tempsCanoniques.length} temps canoniques, ${jours} facilitations relues, fiches pilotes (1, 4, 6) composées et limite de 2 conservée par défaut.`);
