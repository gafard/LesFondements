/**
 * Rendre le code client lisible par Safari 15.
 *
 * Next.js 16 vise Safari 16.4 par défaut, et livre son propre code client
 * déjà compilé : on y trouve des blocs statiques de classe (`static { … }`),
 * que Safari ne sait lire qu'à partir de 16.4. Une seule de ces constructions
 * suffit à faire échouer tout le fragment qui la contient — et ce fragment
 * est chargé sur chaque page. Sur iOS 15, plafond de l'iPhone 6s, du 7 et du
 * SE de première génération, et dans Safari 15.6 sur les Mac restés sous
 * Catalina, aucune page ne démarrait.
 *
 * Turbopack sait l'abaisser lui-même, à condition que la cible déclarée dans
 * `.browserslistrc` soit lisible. Elle ne l'était pas : un second fichier la
 * déclarait aussi, browserslist refusait de choisir, et Next retombait sans
 * rien dire sur Safari 16.4. `verifier-safari.mjs` surveille désormais cette
 * cause.
 *
 * Cette étape reste en filet : si la cible venait encore à céder, les
 * fragments seraient réécrits ici plutôt que de partir tels quels. Le nom des
 * fichiers ne change pas — les pages les appellent par leur nom — seul leur
 * contenu l'est. D'ordinaire, elle ne trouve rien à faire.
 *
 * Seuls les fragments qui contiennent un bloc statique sont touchés, et
 * seulement pour cette construction : le reste du code est déjà lisible par
 * Safari 15, et le laisser intact limite ce qui pourrait changer.
 *
 * Usage : node scripts/abaisser-pour-safari.mjs <dossier des fragments>
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { transform } from 'esbuild';

const CIBLE = 'safari15';
const dossier = process.argv[2];

if (!dossier) {
  console.error('Indiquez le dossier des fragments, par exemple .open-next/assets/_next/static/chunks');
  process.exit(1);
}

const fichiers = (await readdir(dossier)).filter((nom) => nom.endsWith('.js'));
let reecrits = 0;

for (const nom of fichiers) {
  const chemin = join(dossier, nom);
  const source = await readFile(chemin, 'utf8');
  // Filtre grossier mais sûr : sans ce motif, il n'y a rien à abaisser.
  if (!/\bstatic\s*\{/.test(source)) continue;

  const { code, warnings } = await transform(source, {
    target: CIBLE,
    // On garde le code compact sans renommer quoi que ce soit : les
    // fragments se référencent entre eux, on ne touche qu'à la syntaxe.
    minifyWhitespace: true,
    legalComments: 'inline',
  });
  for (const avertissement of warnings) {
    console.warn(`  ${nom} : ${avertissement.text}`);
  }
  await writeFile(chemin, code, 'utf8');
  reecrits += 1;
  console.log(`  ${nom} — abaissé pour ${CIBLE}`);
}

console.log(
  reecrits
    ? `${reecrits} fragment(s) sur ${fichiers.length} réécrit(s) pour ${CIBLE}.`
    : `Aucun fragment à abaisser sur ${fichiers.length}.`
);
