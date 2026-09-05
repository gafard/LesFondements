import assert from 'node:assert/strict';
import { ecritsDuCarnet, lireTrace, PROFILS_FICHES } from '../src/lib/habiter';
import { extrairePasDeVie } from '../src/lib/pasDeVie';
import { derouleRencontre, MEETING_FLOW } from '../src/lib/parcoursDomain';
import { lireDernierPassage, memoriserPassage } from '../src/lib/marquePage';

const trace = { version: 1, nature: 'pas', texte: 'Écouter avant de répondre', reference: 'Jc 1:19', date: 1234 };
for (const valeur of [undefined, '', 'null', '{}', JSON.stringify({ ...trace, nature: '__proto__' }), JSON.stringify({ ...trace, date: -1 })]) assert.equal(lireTrace(valeur), null);
const reponses = {
  'trace:f6-s2': JSON.stringify(trace), 'favori:trace:f6-s2': '1', 'temps-apart:1': '1',
  'annotations:6': JSON.stringify({ version: 1, notes: [{ id: 'n1', texte: 'Une note existante', createdAt: 1, updatedAt: 2 }], surlignages: [] }),
  'favori:postit-n1': '1', 'memo:Jc 1:19': 'Une ancienne copie',
  'q:6_0_1': 'Une réponse existante', 'trace:corrompue': '{', 'relecture-pas:corrompue': '{}',
};
const ecrits = ecritsDuCarnet(6, reponses);
assert.equal(ecrits.length, 4);
assert.equal(ecrits.filter(e => e.favori).length, 2, 'Les favoris comprennent aussi les anciens post-it.');
assert.ok(ecrits.every(e => !e.contenu.includes('"version"') && e.contenu !== '1'));
assert.equal(ecrits.find(e => e.id === 'trace:f6-s2')?.href, '/aujourdhui?fiche=6&section=1&moment=pas');
const pas = extrairePasDeVie(6, reponses);
assert.equal(pas.length, 1, 'Un pas gardé dans une trace rejoint la relecture.');
assert.equal(pas[0].action, trace.texte);
assert.equal(pas[0].section, 1);
assert.equal(extrairePasDeVie(6, { 'trace:f6-s2': JSON.stringify({ ...trace, nature: 'priere' }) }).length, 0);
assert.equal(Object.keys(PROFILS_FICHES).length, 20);
assert.notEqual(PROFILS_FICHES[4].nature, 'pas', 'Recevoir la grâce ne doit pas prescrire une performance.');
assert.equal(PROFILS_FICHES[8].nature, 'question');
const original = JSON.stringify(MEETING_FLOW);
for (let i = 1; i <= 20; i++) assert.deepEqual(derouleRencontre(i).map(e => e.key), MEETING_FLOW.map(e => e.key), 'Les sessions existantes gardent leurs six repères.');
const dix = derouleRencontre(10);
assert.equal(dix.at(-1)?.minutes, dix.slice(0, -1).reduce((n, e) => n + e.minutes, 0));
assert.match(derouleRencontre(7)[4].hint, /séparément/);
assert.match(derouleRencontre(8)[4].hint, /choisit/);
assert.equal(JSON.stringify(MEETING_FLOW), original);
const donnees = new Map<string, string>();
Object.assign(globalThis, { window: Object.assign(new EventTarget(), { localStorage: { getItem: (k: string) => donnees.get(k) || null, setItem: (k: string, v: string) => donnees.set(k, v) } }) });
memoriserPassage({ uid: 'alice', url: '/aujourdhui?fiche=6&section=1&scene=4', titre: 'Fiche 6', type: 'immersion' });
assert.equal(lireDernierPassage('bob'), null);
assert.equal(lireDernierPassage(), null);
assert.equal(lireDernierPassage('alice')?.url, '/aujourdhui?fiche=6&section=1&scene=4');
console.log('✓ Habiter : traces valides, anciens écrits, favoris, pas, vingt profils, rencontres 7/8/10 et reprise privée.');
