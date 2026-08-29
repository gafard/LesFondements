#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { preparerPourLaVoix } from '../src/lib/prononciation.mjs';

const cas = new Map([
  ['1 Jn 4:16', 'première lettre de Jean, chapitre 4, verset 16'],
  ['Ps 46:11', 'Psaume 46, verset 11'],
  ['2 Co 5:17', 'deuxième lettre aux Corinthiens, chapitre 5, verset 17'],
  ['Jn 1:1-3', 'Jean, chapitre 1, versets 1 à 3'],
  ['Dt 5:6-21', 'Deutéronome, chapitre 5, versets 6 à 21'],
  ['Jean 14-17', 'Jean, chapitres 14 à 17'],
  ['Hébreux 11', 'Hébreux, chapitre 11'],
  ['Éphésiens 2:10', 'Éphésiens, chapitre 2, verset 10'],
  ['1 Samuel 16:7', 'premier livre de Samuel, chapitre 16, verset 7'],
  ['Éph 2:8', 'Éphésiens, chapitre 2, verset 8'],
  ['Hbq 2:1-2', 'Habacuc, chapitre 2, versets 1 à 2'],
  [
    'Pr 1:7 et 2:5',
    'Proverbes, chapitre 1, verset 7 et Proverbes, chapitre 2, verset 5',
  ],
  [
    'Ps 146 ; 8:2 ; 29:2',
    'Psaume 146 ; Psaume 8, verset 2 ; Psaume 29, verset 2',
  ],
  ['Rm 10:8, 17', 'Romains, chapitre 10, versets 8 et 17'],
  ['Romains ch. 6-7-8', 'Romains, chapitres 6, 7 et 8'],
  ['1 Co ch. 12 et 14', 'première lettre aux Corinthiens, chapitres 12 et 14'],
  ['Mt ch 5 à 7', 'Matthieu, chapitres 5 à 7'],
  ['He. ch. 4', 'Hébreux, chapitre 4'],
  ['De 16:16', 'Deutéronome, chapitre 16, verset 16'],
  ['2 Corinthiens, chapitre 3', 'deuxième lettre aux Corinthiens, chapitre 3'],
  ['Il y a plus de 1000 citations.', 'Il y a plus de 1000 citations.'],
]);

for (const [entree, attendu] of cas) {
  assert.equal(preparerPourLaVoix(entree), attendu, entree);
}

const livret = JSON.parse(await readFile(new URL('../src/data/livret.json', import.meta.url), 'utf8'));
const versets = JSON.parse(
  await readFile(new URL('../src/data/versetsLivret.json', import.meta.url), 'utf8')
);
const textes = [];
function parcourir(valeur) {
  if (typeof valeur === 'string') textes.push(valeur);
  else if (Array.isArray(valeur)) valeur.forEach(parcourir);
  else if (valeur && typeof valeur === 'object') Object.values(valeur).forEach(parcourir);
}
parcourir(livret);
parcourir(versets);

let transformes = 0;
for (const texte of textes) {
  const prepare = preparerPourLaVoix(texte);
  if (prepare !== texte) transformes += 1;
  assert.equal(preparerPourLaVoix(prepare), prepare, `Diction non idempotente : ${texte}`);
}
assert.ok(transformes >= 500, `Couverture du corpus anormalement basse : ${transformes}`);

console.log(`Diction biblique vérifiée : ${cas.size} cas ciblés, ${transformes} textes du corpus préparés.`);
