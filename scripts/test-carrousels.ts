import assert from 'node:assert/strict';
import { creerNavigationFeuilles, directionGlissement, DUREE_FEUILLE_MS, type EtatFeuille } from '../src/lib/carrousel';
assert.equal(directionGlissement({ x: 100, y: 100 }, { x: 10, y: 108 }), 1);
assert.equal(directionGlissement({ x: 100, y: 100 }, { x: 180, y: 103 }), -1);
assert.equal(directionGlissement({ x: 100, y: 100 }, { x: 30, y: 200 }), 0, 'Le défilement vertical ne change pas de carte.');
assert.equal(directionGlissement({ x: 100, y: 100 }, { x: 70, y: 100 }), 0);
assert.equal(directionGlissement(null, { x: 0, y: 0 }), 0);
const etats: EtatFeuille[] = [];
let minuterie: (() => void) | null = null;
let reduit = false;
const nav = creerNavigationFeuilles(6, 0, e => etats.push(e), {
  reduire: () => reduit,
  programmer: (suite, duree) => { assert.equal(duree, DUREE_FEUILLE_MS); minuterie = suite; return () => { minuterie = null; }; },
});
const terminer = () => { const suite = minuterie; minuterie = null; if (suite) suite(); };
nav.aller(1);
nav.aller(1);
nav.aller(1);
assert.equal(etats.length, 1, 'Une nouvelle commande ne coupe pas la transition en cours.');
terminer();
assert.equal(etats[1].animation, etats[0].animation, 'La fin ne relance pas une animation de pose.');
assert.equal(etats.at(-1)?.index, 3, 'Les gestes rapides ne sont pas perdus.');
terminer();
assert.equal(etats.at(-1)?.precedent, null);
nav.aller(-1);
assert.equal(etats.at(-1)?.animation, 'note-arriere');
nav.reinitialiser();
assert.equal(minuterie, null);
assert.equal(etats.at(-1)?.index, 0);
reduit = true;
nav.changer(99);
assert.equal(etats.at(-1)?.index, 5);
assert.equal(etats.at(-1)?.animation, 'note-posee');
assert.equal(minuterie, null, 'Le mode paisible ne lance pas de transition.');
nav.detruire();
nav.activer(); // React Strict Mode remonte l'effet après son nettoyage.
nav.aller(-1);
assert.equal(etats.at(-1)?.index, 4);
console.log('✓ Carrousels : gestes, rafales, fin sans seconde animation, limites, nettoyage et mode paisible.');
