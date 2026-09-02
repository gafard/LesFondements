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
assert.equal(constitution.regles.questionsEssentiellesMaximum, MAX_QUESTIONS_ESSENTIELLES);
assert.equal(constitution.regles.texteCanoniqueToujoursVisible, true);
for (const fiche of meditations as FicheMeditation[]) {
  for (const section of fiche.sections) {
    const repartition = repartirQuestions(section.questions);
    jours += 1;
    assert.ok(repartition.principales.length > 0, `Fiche ${fiche.ficheId} · ${section.sectionTitre} sans question essentielle`);
    assert.ok(
      repartition.principales.length <= MAX_QUESTIONS_ESSENTIELLES,
      `Fiche ${fiche.ficheId} · ${section.sectionTitre} dépasse ${MAX_QUESTIONS_ESSENTIELLES} questions essentielles`
    );
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

const immersion = await readFile(resolve(process.cwd(), 'src/components/Immersion.tsx'), 'utf8');
assert.ok(
  !immersion.includes('if (!parcoursMeditation?.parcoursGuide)'),
  'Une facilitation numérique ne doit jamais masquer le texte du livret.'
);
assert.ok(
  immersion.includes('section.blocs.forEach'),
  'Le scénario quotidien doit parcourir les blocs canoniques du livret.'
);

console.log(`Constitution éditoriale vérifiée : ${tempsCanoniques.length} temps canoniques, ${jours} facilitations relues, 2 questions essentielles maximum.`);
