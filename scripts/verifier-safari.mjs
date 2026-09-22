/**
 * Refuser une construction que Safari 15 ne saurait pas lire.
 *
 * Pendant des semaines, aucune page ne s'est ouverte sur iPhone 7 ni sur les
 * Mac restés sous Catalina, et rien ne l'a signalé : le site fonctionnait
 * partout ailleurs. Il a fallu qu'un lecteur écrive pour le dire.
 *
 * Ce contrôle analyse les fragments produits — pas le code source, qui n'est
 * pas ce que le navigateur reçoit — et cherche les constructions que Safari
 * 15.6 rejette comme erreurs de syntaxe. Une seule suffit à empêcher tout un
 * fragment de s'exécuter. S'il en trouve, la construction s'arrête.
 *
 * Usage : node scripts/verifier-safari.mjs <dossier des fragments>
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from '@babel/parser';
import browserslist from 'browserslist';

const dossier = process.argv[2];
if (!dossier) {
  console.error('Indiquez le dossier des fragments à vérifier.');
  process.exit(1);
}

// ── La cible d'abord ─────────────────────────────────────────
//
// C'est ainsi que la panne est arrivée : deux fichiers déclaraient la cible,
// `.browserslistrc` et une clé dans `package.json`. Browserslist refuse alors
// de choisir, et Next retombe sans rien dire sur sa cible par défaut, Safari
// 16.4. Tout compile, rien ne prévient — et iOS 15 ne démarre plus.
try {
  const cibles = browserslist(undefined, { path: process.cwd() });
  if (!cibles.some((cible) => /^(safari 15|ios_saf 15)/.test(cible))) {
    console.error('✗ La cible déclarée n’inclut plus Safari 15 ni iOS 15.');
    process.exit(1);
  }
} catch (erreur) {
  console.error(`✗ La cible des navigateurs est illisible : ${erreur.message}`);
  console.error('  Next retomberait sur Safari 16.4, sans avertissement.');
  process.exit(1);
}

// Chaque entrée : ce qui casse, et la première version de Safari qui le lit.
const fatales = [];
const noter = (quoi, depuis, fichier, extrait) =>
  fatales.push({ quoi, depuis, fichier, extrait });

function parcourir(noeud, fichier, source) {
  if (!noeud || typeof noeud.type !== 'string') return;

  if (noeud.type === 'StaticBlock') {
    noter('bloc statique de classe', '16.4', fichier, source.slice(noeud.start, noeud.start + 48));
  }
  if (noeud.type === 'RegExpLiteral') {
    if (/\(\?<[=!]/.test(noeud.pattern)) {
      noter('regex avec lookbehind', '16.4', fichier, `/${noeud.pattern.slice(0, 40)}/`);
    }
    if (noeud.flags.includes('v')) {
      noter('regex avec le drapeau v', '17', fichier, `/${noeud.pattern.slice(0, 40)}/v`);
    }
  }

  for (const cle of Object.keys(noeud)) {
    if (cle === 'loc' || cle === 'start' || cle === 'end' || cle === 'extra') continue;
    const valeur = noeud[cle];
    if (Array.isArray(valeur)) valeur.forEach((enfant) => parcourir(enfant, fichier, source));
    else if (valeur && typeof valeur === 'object' && typeof valeur.type === 'string') {
      parcourir(valeur, fichier, source);
    }
  }
}

const fichiers = (await readdir(dossier)).filter((nom) => nom.endsWith('.js'));
for (const nom of fichiers) {
  const source = await readFile(join(dossier, nom), 'utf8');
  try {
    parcourir(parse(source, { sourceType: 'unambiguous' }).program, nom, source);
  } catch (erreur) {
    noter('fragment illisible', '?', nom, String(erreur.message).slice(0, 60));
  }
}

if (fatales.length) {
  console.error(`✗ ${fatales.length} construction(s) illisible(s) par Safari 15.6 :`);
  for (const f of fatales.slice(0, 12)) {
    console.error(`   ${f.fichier}  ${f.quoi} (Safari ${f.depuis}+)  ${f.extrait}`);
  }
  console.error(
    '\nSur iOS 15 et les Mac sous Catalina, les pages qui chargent ces fragments ne démarreront pas.'
  );
  process.exit(1);
}
console.log(`✓ ${fichiers.length} fragments lisibles par Safari 15.6`);
