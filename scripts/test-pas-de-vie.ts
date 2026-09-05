import assert from 'node:assert/strict';
import { actionActuelle, extrairePasDeVie, lienVersPas, lireRelecture, pasARelire, texteRelecture, type RelecturePas } from '../src/lib/pasDeVie';

const reponses = {
  'pas:1': '  Remercier  ',
  'pas:f1-s2': 'Écouter avant de répondre',
  'pas-moment:f1-s2': 'Au repas',
  'verset-choisi:f1-s2': 'Jc 1:19',
  'pas:f1-s1': '',
  'pas:f2-s1': 'Une autre fiche',
  'pas:f1-s0': 'Section invalide',
  'pas-invalide': 'Métadonnée',
  'temps-apart:1': '1',
};
const originaux = JSON.stringify(reponses);
const pas = extrairePasDeVie(1, reponses);
assert.equal(pas.length, 2, 'Seules les véritables intentions de la fiche sont retenues.');
assert.equal(pas[0].section, 1);
assert.equal(pas[0].moment, 'Au repas');
assert.equal(pas[1].action, 'Remercier', 'Les anciennes intentions restent accessibles.');
assert.equal(lienVersPas(pas[0]), '/aujourdhui?fiche=1&section=1&moment=pas');
assert.equal(lienVersPas(pas[1]), '/fiches/1');
assert.equal(pasARelire(pas[0]), true);
assert.equal(JSON.stringify(reponses), originaux, 'Lecture sans migration destructive.');

const relecture: RelecturePas = {
  version: 1, pasId: 'f1-s2', date: 1720000000000,
  issue: 'essaye', observation: 'J’ai interrompu, puis j’ai écouté.',
  prochainPas: 'Laisser finir une phrase', action: pas[0].action,
  intention: pas[0].action, moment: pas[0].moment,
};
const avecNotes = extrairePasDeVie(1, {
  ...reponses,
  'relecture-pas:a': JSON.stringify(relecture),
  'relecture-pas:casse': '{broken',
  'relecture-pas:autre': JSON.stringify({ ...relecture, pasId: 'f2-s2' }),
});
const relu = avecNotes[0];
assert.equal(relu.relectures.length, 1, 'Une note corrompue ou étrangère n’est jamais attribuée au pas.');
assert.equal(actionActuelle(relu), 'Laisser finir une phrase');
assert.equal(pasARelire(relu), true);
assert.equal(relu.action, 'Écouter avant de répondre', 'L’intention de départ est conservée.');

const deuxieme: RelecturePas = { ...relecture, date: relecture.date + 1, action: actionActuelle(relu), issue: 'vecu', prochainPas: '' };
const poursuivi = { ...relu, relectures: [...relu.relectures, deuxieme] };
assert.equal(actionActuelle(poursuivi), 'Laisser finir une phrase', 'Une nouvelle relecture ne rétablit pas un geste abandonné.');
assert.equal(pasARelire(poursuivi), false);
assert.equal(actionActuelle({ ...poursuivi, action: 'Une nouvelle intention' }), 'Une nouvelle intention');
assert.equal(pasARelire({ ...poursuivi, action: 'Une nouvelle intention' }), true);
assert.equal(pasARelire({ ...poursuivi, moment: 'Le matin' }), true, 'Un nouveau contexte invite à une nouvelle expérience.');
assert.equal(pasARelire({ ...poursuivi, relectures: [{ ...deuxieme, issue: 'pas-encore' }] }), true, 'Une occasion absente ne devient pas un succès implicite.');

for (const invalide of [null, '', 'null', '{}', '[]', '{', JSON.stringify({ ...relecture, issue: 'score-100' }), JSON.stringify({ ...relecture, version: 2 }), JSON.stringify({ ...relecture, date: -1 }), JSON.stringify({ ...relecture, intention: null })]) {
  assert.equal(lireRelecture(invalide), null);
}
assert.deepEqual(lireRelecture(JSON.stringify(relecture)), relecture);
assert.ok(texteRelecture(relecture).includes('Laisser finir une phrase'));
assert.ok(!texteRelecture(relecture).includes('"version"'), 'L’export présente des mots lisibles, jamais le JSON.');
console.log('✓ Pas de vie : compatibilité, relectures, reprises, historique, validation et export.');
