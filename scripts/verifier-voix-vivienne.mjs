#!/usr/bin/env node

/**
 * Publie le manifeste Vivienne uniquement si chaque piste utilisée par
 * l'immersion existe et n'est pas vide. Tant que ce fichier n'existe pas,
 * l'application masque entièrement la voix féminine.
 *
 * À exécuter après la fin du générateur, jamais pendant son écriture :
 *   npm run voix:vivienne:verifier
 */
import { access, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import process from 'node:process';

const racine = path.resolve(import.meta.dirname, '..');
const dossier = path.join(racine, 'public', 'voix', 'vivienne');
const livret = JSON.parse(await readFile(path.join(racine, 'src', 'data', 'livret.json'), 'utf8'));
const versets = JSON.parse(
  await readFile(path.join(racine, 'src', 'data', 'versetsLivret.json'), 'utf8')
);
const moteurDiction = await readFile(path.join(racine, 'src', 'lib', 'prononciation.mjs'), 'utf8');

const estLisible = (texte) =>
  typeof texte === 'string' && texte.replace(/[^\p{L}\p{N}]/gu, '').length >= 2;

function ardoise(reference) {
  return reference
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const attendues = new Set(Object.keys(versets).map((reference) => `v.${ardoise(reference)}`));
for (const fiche of livret.fiches ?? []) {
  attendues.add(`f${fiche.id}.seuil`);
  for (const [indexSection, section] of (fiche.sections ?? []).entries()) {
    if (section.titre) attendues.add(`f${fiche.id}.s${indexSection}`);
    for (const [indexBloc, bloc] of (section.blocs ?? []).entries()) {
      if (bloc.type !== 'sous-titre' && estLisible(bloc.texte)) {
        attendues.add(`f${fiche.id}.s${indexSection}.b${indexBloc}`);
      }
    }
  }
  for (const [indexResume] of (fiche.resume ?? []).entries()) {
    attendues.add(`f${fiche.id}.r${indexResume}`);
  }
  const questions = [
    ...(fiche.resume ?? []).flatMap((resume) => resume.questions ?? []),
    ...(fiche.questionsLibres ?? []),
  ];
  questions.forEach((_, index) => attendues.add(`f${fiche.id}.q${index}`));
}

const manquantes = [];
for (const id of [...attendues].sort()) {
  const fichier = path.join(dossier, `${id}.mp3`);
  try {
    await access(fichier);
    if ((await stat(fichier)).size < 1_000) manquantes.push(id);
  } catch {
    manquantes.push(id);
  }
}

if (manquantes.length) {
  console.error(
    `Vivienne reste masquée : ${manquantes.length}/${attendues.size} piste(s) manquante(s) ou incomplète(s).`
  );
  console.error(manquantes.slice(0, 20).join(', '));
  process.exit(1);
}

const manifeste = {
  complete: true,
  genereLe: new Date().toISOString(),
  voix: 'fr-FR-VivienneMultilingualNeural',
  empreinteDiction: createHash('sha256').update(moteurDiction).digest('hex').slice(0, 16),
  pistes: [...attendues].sort(),
};
await writeFile(path.join(dossier, 'manifeste.json'), `${JSON.stringify(manifeste, null, 2)}\n`);
console.log(`Vivienne publiée : ${manifeste.pistes.length} pistes vérifiées.`);
