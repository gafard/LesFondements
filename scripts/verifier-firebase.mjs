#!/usr/bin/env node
/**
 * Vérifie que Firebase est correctement branché, avant de perdre du temps à
 * déboguer dans le navigateur.
 *
 *   node scripts/verifier-firebase.mjs
 *
 * Ce que le script contrôle :
 *   1. les six variables NEXT_PUBLIC_FIREBASE_* sont présentes et non fictives ;
 *   2. la clé d'API est acceptée par Firebase, et le projet répond ;
 *   3. les modes de connexion attendus (e-mail, Google) sont activés ;
 *   4. le domaine local est autorisé pour la connexion Google ;
 *   5. la base Firestore existe et refuse bien les lectures anonymes.
 *
 * Aucune écriture, aucun compte de service : le script n'utilise que les
 * points d'accès publics dont le SDK se sert déjà.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const RACINE = path.resolve(import.meta.dirname, '..');
const VARIABLES = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const vert = (texte) => `[32m${texte}[0m`;
const rouge = (texte) => `[31m${texte}[0m`;
const jaune = (texte) => `[33m${texte}[0m`;
const gris = (texte) => `[90m${texte}[0m`;

let echecs = 0;
const ok = (texte, detail) => console.log(`  ${vert('✓')} ${texte}${detail ? gris(`  ${detail}`) : ''}`);
const ko = (texte, aide) => {
  echecs += 1;
  console.log(`  ${rouge('✗')} ${texte}`);
  if (aide) console.log(`     ${jaune('→')} ${aide}`);
};
const info = (texte) => console.log(`  ${jaune('!')} ${texte}`);

async function lireEnv() {
  const chemin = path.join(RACINE, '.env.local');
  if (!existsSync(chemin)) return null;
  const contenu = await readFile(chemin, 'utf8');
  const valeurs = {};
  for (const ligne of contenu.split('\n')) {
    const trouvee = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(ligne);
    if (trouvee) valeurs[trouvee[1]] = trouvee[2].trim().replace(/^["']|["']$/g, '');
  }
  return valeurs;
}

function estFictive(valeur) {
  return !valeur || /^your-|^votre-|^xxx|^<|^\.\.\./i.test(valeur);
}

/**
 * Ce point d'accès ne décrit pas les fournisseurs activés — il ne renvoie que
 * `projectId` et `authorizedDomains`. Pour savoir si la connexion par mot de
 * passe est ouverte, on tente une inscription avec une charge utile invalide :
 * Firebase la rejette avant toute création de compte, et le code d'erreur
 * distingue les deux cas.
 *
 *   OPERATION_NOT_ALLOWED  le fournisseur est désactivé
 *   INVALID_EMAIL, MISSING_PASSWORD, WEAK_PASSWORD…  il est actif
 */
async function verifierMotDePasse(cle) {
  try {
    const reponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(cle)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '', password: '', returnSecureToken: true }),
      }
    );
    const donnees = await reponse.json().catch(() => ({}));
    const message = donnees?.error?.message ?? '';

    if (/OPERATION_NOT_ALLOWED/.test(message)) {
      ko(
        'La connexion par e-mail et mot de passe est désactivée',
        'Console → Authentication → Sign-in method → Adresse e-mail/Mot de passe.'
      );
    } else if (/INVALID_EMAIL|MISSING_EMAIL|MISSING_PASSWORD|WEAK_PASSWORD/.test(message)) {
      ok('Connexion par e-mail et mot de passe activée');
    } else if (reponse.ok) {
      // Ne devrait pas arriver avec une adresse vide, mais on ne prétend pas
      // avoir conclu si Firebase se met à accepter n'importe quoi.
      info('Réponse inattendue de Firebase : la connexion par mot de passe n’a pas pu être établie.');
    } else {
      info(`Connexion par mot de passe : réponse inattendue — ${message || reponse.status}`);
    }
  } catch (erreur) {
    info(`Connexion par mot de passe non vérifiable : ${erreur.message}`);
  }
}

async function main() {
  console.log('\n  Vérification de la configuration Firebase\n');

  // ── 1. Les variables ──────────────────────────────────────
  const env = await lireEnv();
  if (!env) {
    ko(
      '.env.local est introuvable',
      'Copiez .env.local.example en .env.local, puis remplissez-le depuis la console Firebase.'
    );
    process.exit(1);
  }

  let manquantes = 0;
  for (const nom of VARIABLES) {
    if (estFictive(env[nom])) {
      ko(`${nom} est vide ou encore fictive`);
      manquantes += 1;
    }
  }
  if (manquantes) {
    console.log(
      `\n  ${jaune('Console Firebase → Paramètres du projet → Vos applications → Web → Config')}\n`
    );
    process.exit(1);
  }
  ok('Les six variables sont renseignées');

  const cle = env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projet = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  // ── 2 & 3. Le projet et ses modes de connexion ────────────
  // Ce point d'accès est celui que le SDK web interroge au démarrage : il
  // renvoie la configuration publique du projet.
  try {
    const reponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(cle)}`
    );
    const donnees = await reponse.json();

    if (!reponse.ok) {
      const message = donnees?.error?.message ?? `HTTP ${reponse.status}`;
      if (/API key not valid/i.test(message)) {
        ko(
          "La clé d'API est refusée par Firebase",
          'Vérifiez NEXT_PUBLIC_FIREBASE_API_KEY, et que la clé n’est pas restreinte à d’autres API.'
        );
      } else if (/CONFIGURATION_NOT_FOUND/i.test(message)) {
        ko(
          "L'authentification n'est pas activée sur ce projet",
          'Console Firebase → Authentication → Commencer.'
        );
      } else {
        ko(`Firebase répond : ${message}`);
      }
    } else {
      ok('La clé d’API est acceptée', projet);

      await verifierMotDePasse(cle);

      const domaines = donnees.authorizedDomains ?? [];
      if (domaines.includes('localhost')) {
        ok('localhost est un domaine autorisé', `${domaines.length} domaines au total`);
      } else {
        ko(
          "localhost n'est pas dans les domaines autorisés",
          'Console → Authentication → Settings → Domaines autorisés. Sans lui, la connexion Google échoue en local.'
        );
      }

      const site = env.NEXT_PUBLIC_SITE_URL;
      if (site) {
        const hote = site.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        if (domaines.includes(hote)) ok(`${hote} est un domaine autorisé`);
        else
          info(
            `${hote} n'est pas dans les domaines autorisés — à ajouter avant la mise en ligne.`
          );
      }

      // Le fournisseur Google ne se sonde pas : il faudrait dérouler un vrai
      // échange OAuth. On le dit, plutôt que de laisser croire à un contrôle.
      info(
        'Le fournisseur Google ne peut pas être testé depuis ici — contrôlez-le dans la console.'
      );
    }
  } catch (erreur) {
    ko(`Impossible de joindre Firebase : ${erreur.message}`);
  }

  // ── 5. Firestore ──────────────────────────────────────────
  try {
    const reponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projet)}/databases/(default)/documents/groups?pageSize=1&key=${encodeURIComponent(cle)}`
    );
    const donnees = await reponse.json().catch(() => ({}));
    const message = donnees?.error?.message ?? '';

    if (reponse.status === 403 && /PERMISSION_DENIED|Missing or insufficient/i.test(message)) {
      ok('Firestore existe et refuse les lectures anonymes', 'les règles sont en place');
    } else if (reponse.status === 404 || /does not exist/i.test(message)) {
      ko(
        "La base Firestore n'existe pas encore",
        'Console Firebase → Firestore Database → Créer une base de données.'
      );
    } else if (reponse.ok) {
      ko(
        'Firestore laisse lire la collection « groups » sans être connecté',
        'Déployez les règles : firebase deploy --only firestore:rules'
      );
    } else {
      info(`Firestore a répondu ${reponse.status} — ${message || 'sans détail'}`);
    }
  } catch (erreur) {
    ko(`Impossible de joindre Firestore : ${erreur.message}`);
  }

  // ── Fichiers de déploiement ───────────────────────────────
  for (const fichier of ['firestore.rules', 'firestore.indexes.json']) {
    if (existsSync(path.join(RACINE, fichier))) ok(`${fichier} présent`);
    else ko(`${fichier} manquant`);
  }

  console.log(
    echecs === 0
      ? `\n  ${vert('Tout est en place.')} Relancez « npm run dev » : l'application quitte le mode local.\n`
      : `\n  ${rouge(`${echecs} point(s) à corriger.`)}\n`
  );
  process.exit(echecs === 0 ? 0 : 1);
}

main().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
