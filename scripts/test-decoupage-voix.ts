import assert from 'node:assert/strict';
import {
  LONGUEUR_MORCEAU_STUDIO,
  decouperTextePourStudio,
} from '../src/lib/decoupageVoix';

const long = [
  'Lis lentement le premier passage. Observe ce qui retient ton attention.',
  'Ne cherche pas à répondre trop vite. Relis le texte une seconde fois.',
  'Que découvres-tu dans ce passage et qu’aimerais-tu garder devant Dieu ?',
];
const texte = Array.from({ length: 24 }, (_, index) => long[index % long.length]).join(' ');
const morceaux = decouperTextePourStudio(texte);

assert.ok(morceaux.length > 1, 'un texte long doit être découpé');
assert.ok(
  morceaux.every((morceau) => morceau.length <= LONGUEUR_MORCEAU_STUDIO),
  'aucun morceau ne doit dépasser la borne de la voix studio'
);
assert.equal(morceaux.join(' '), texte, 'le découpage ne doit perdre aucun mot');
assert.ok(
  morceaux.slice(0, -1).every((morceau) => /[.!?…]$/.test(morceau)),
  'les coupures ordinaires doivent se faire en fin de phrase'
);

const phraseSansFin = Array.from({ length: 700 }, () => 'contemplation').join(' ');
const morceauxSansFin = decouperTextePourStudio(phraseSansFin, 200);
assert.ok(morceauxSansFin.every((morceau) => morceau.length <= 200));
assert.equal(morceauxSansFin.join(' '), phraseSansFin);

console.log('Découpage voix vérifié : phrases préservées et limite studio respectée.');
