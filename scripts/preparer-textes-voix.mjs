#!/usr/bin/env node

/**
 * Pont pour les générateurs non JavaScript : reçoit un tableau JSON de
 * `[id, texte]` sur stdin et renvoie les pistes préparées par le moteur
 * canonique de l'application.
 */
import process from 'node:process';
import { preparerPourLaVoix } from '../src/lib/prononciation.mjs';

let entree = '';
for await (const morceau of process.stdin) entree += morceau;

const pistes = JSON.parse(entree);
if (!Array.isArray(pistes)) throw new TypeError('Un tableau de pistes était attendu.');

process.stdout.write(
  JSON.stringify(pistes.map(([id, texte]) => [id, preparerPourLaVoix(String(texte ?? ''))]))
);
