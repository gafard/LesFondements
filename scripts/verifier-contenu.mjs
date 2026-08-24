import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const racine = new URL('..', import.meta.url);
const lireJson = async (chemin) => JSON.parse(await readFile(new URL(chemin, racine), 'utf8'));

const livret = await lireJson('src/data/livret.json');
const versets = await lireJson('src/data/versetsLivret.json');

assert.equal(livret.fiches.length, 20, 'Le parcours doit contenir exactement 20 fiches.');
assert.deepEqual(
  livret.fiches.map((fiche) => fiche.id),
  Array.from({ length: 20 }, (_, index) => index + 1),
  'Les fiches doivent rester numérotées de 1 à 20.'
);

const references = [
  ...new Set(livret.fiches.flatMap((fiche) => fiche.resume.flatMap((section) => section.versets))),
];
assert.equal(references.length, 53, 'Le livret doit exposer ses 53 références uniques à recopier.');
for (const reference of references) {
  assert.ok(versets[reference]?.trim(), `Texte biblique manquant pour ${reference}.`);
}

const dossierBible = new URL('public/etudes/segond/', racine);
const livres = (await readdir(dossierBible)).filter((nom) => nom.endsWith('.json'));
assert.equal(livres.length, 66, 'La Bible hors-ligne doit contenir les 66 livres.');
for (const livre of livres) {
  const contenu = JSON.parse(await readFile(join(dossierBible.pathname, livre), 'utf8'));
  assert.ok(contenu && typeof contenu === 'object', `${livre} doit être un JSON exploitable.`);
}

const questions = livret.fiches.reduce(
  (total, fiche) =>
    total + fiche.questionsLibres.length + fiche.resume.reduce((somme, section) => somme + section.questions.length, 0),
  0
);
assert.ok(questions >= 150, 'Le corpus de questions paraît incomplet.');

console.log(`Contenu vérifié : 20 fiches, ${questions} questions, ${references.length} versets et 66 livres.`);
