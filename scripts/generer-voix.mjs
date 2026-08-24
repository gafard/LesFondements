#!/usr/bin/env node
/**
 * Génère les voix off du parcours avec ElevenLabs, et écrit le manifeste que
 * l'application consulte au moment de lire.
 *
 * Le corpus est fixe — vingt fiches qui ne changent pas — donc on génère une
 * fois, on versionne les fichiers, et personne ne paie de synthèse à la
 * lecture. Une piste déjà générée dont le texte n'a pas bougé est ignorée.
 *
 * Les enregistrements humains déposés dans `public/voix/humaine/` sont
 * prioritaires : le manifeste les référence à la place de la synthèse, sans
 * qu'il faille supprimer quoi que ce soit.
 *
 *   # Ce que ça coûterait, sans rien appeler
 *   node scripts/generer-voix.mjs --estimation
 *
 *   # Une seule fiche, pour écouter avant de lancer le reste
 *   node scripts/generer-voix.mjs --fiches 1
 *
 *   # Tout, en reprenant là où on s'était arrêté
 *   node scripts/generer-voix.mjs
 *
 *   # Reconstruire le manifeste après avoir déposé des enregistrements
 *   node scripts/generer-voix.mjs --manifeste-seul
 *
 * Variables d'environnement (dans .env.local) :
 *   ELEVENLABS_API_KEY    obligatoire pour générer
 *   ELEVENLABS_VOICE_ID   la voix à utiliser
 *   ELEVENLABS_MODEL_ID   par défaut « eleven_multilingual_v2 »
 */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { preparerPourLaVoix } from '../src/lib/prononciation.mjs';

const RACINE = path.resolve(import.meta.dirname, '..');
const LIVRET = path.join(RACINE, 'src/data/livret.json');
const DOSSIER = path.join(RACINE, 'public/voix');
const DOSSIER_ELEVEN = path.join(DOSSIER, 'eleven');
const DOSSIER_HUMAINE = path.join(DOSSIER, 'humaine');
const MANIFESTE = path.join(DOSSIER, 'manifeste.json');

// Tarif public d'ElevenLabs, à titre indicatif seulement.
const EURO_PAR_MILLE_CARACTERES = 0.0003 * 1000;

// ─────────────────────────────────────────────────────────────
// Arguments
// ─────────────────────────────────────────────────────────────

function lireArguments(argv) {
  const options = {
    estimation: false,
    manifesteSeul: false,
    force: false,
    fiches: null,
    pause: 400,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const argument = argv[i];
    if (argument === '--estimation') options.estimation = true;
    else if (argument === '--manifeste-seul') options.manifesteSeul = true;
    else if (argument === '--force') options.force = true;
    else if (argument === '--fiches') {
      options.fiches = new Set(
        (argv[i + 1] ?? '')
          .split(',')
          .map((valeur) => Number.parseInt(valeur.trim(), 10))
          .filter(Number.isFinite)
      );
      i += 1;
    } else if (argument === '--pause') {
      options.pause = Number.parseInt(argv[i + 1] ?? '400', 10);
      i += 1;
    }
  }
  return options;
}

// ─────────────────────────────────────────────────────────────
// Le texte à lire, fiche par fiche
// ─────────────────────────────────────────────────────────────

/**
 * Découpe le livret en pistes. L'identifiant suit la position dans la
 * structure — pas le contenu — pour qu'une correction de coquille ne rende
 * pas l'enregistrement orphelin.
 */
function pistesDuLivret(livret, filtre) {
  const pistes = [];

  for (const fiche of livret.fiches) {
    if (filtre && !filtre.has(fiche.id)) continue;

    pistes.push({
      id: `f${fiche.id}.seuil`,
      fiche: fiche.id,
      texte: `Fiche ${fiche.id}. ${fiche.titre}. ${fiche.sousTitre}.`,
    });

    fiche.sections.forEach((section, indexSection) => {
      if (section.titre) {
        pistes.push({
          id: `f${fiche.id}.s${indexSection}`,
          fiche: fiche.id,
          texte: section.titre,
        });
      }
      section.blocs.forEach((bloc, indexBloc) => {
        // Les sous-titres sont lus avec le paragraphe qui les suit : les
        // isoler donnerait des pistes d'un mot et demi.
        if (bloc.type === 'sous-titre') return;
        pistes.push({
          id: `f${fiche.id}.s${indexSection}.b${indexBloc}`,
          fiche: fiche.id,
          texte: preparerPourLaVoix(bloc.texte),
        });
      });
    });

    fiche.resume.forEach((section, indexSection) => {
      const texte = [section.titre, ...section.points].join('. ');
      pistes.push({
        id: `f${fiche.id}.r${indexSection}`,
        fiche: fiche.id,
        texte: preparerPourLaVoix(texte),
      });
    });

    const questions = [
      ...fiche.resume.flatMap((section) => section.questions),
      ...fiche.questionsLibres,
    ];
    questions.forEach((question, index) => {
      pistes.push({
        id: `f${fiche.id}.q${index}`,
        fiche: fiche.id,
        texte: preparerPourLaVoix(question),
      });
    });

    // Pistes de la Lettre d'Amour du Père (pour la Fiche 1)
    if (fiche.id === 1) {
      PHRASES_LETTRE_DU_PERE.forEach((phrase, index) => {
        pistes.push({
          id: `lettre.p${index}`,
          fiche: 1,
          texte: phrase,
        });
      });
    }
  }

  return pistes.filter((piste) => piste.texte.trim().length > 2);
}

const PHRASES_LETTRE_DU_PERE = [
  "Mon Enfant, Je regarde jusqu'au fond de ton cœur et je sais tout de toi.",
  "Je sais quand tu t'assieds et quand tu te lèves.",
  "Je te vois quand tu marches et quand tu te couches, je connais parfaitement toutes tes voies.",
  "Même les cheveux de ta tête sont tous comptés.",
  "Tu as été créé à mon image.",
  "En moi tu as la vie, le mouvement et l'être.",
  "Je te connaissais même avant que tu sois conçu dans le ventre de ta mère.",
  "Je t'ai choisi dès avant la création du monde.",
  "Tu n'étais pas un accident, tu n'es pas une erreur.",
  "Tous les jours de ta vie étaient inscrits dans mon livre avant qu'aucun d'eux n'existe.",
  "J'ai déterminé la durée de tes temps et les limites de ta demeure.",
  "Tu es une créature si merveilleuse.",
  "C'est moi qui t'ai tissé dans le secret du sein maternel.",
  "C'est moi qui t'ai accueilli au jour de ta naissance.",
  "Mon image a souvent été défigurée par ceux qui ne me connaissent pas.",
  "Je ne suis ni distant ni en colère, car je suis l'expression parfaite de l'amour.",
  "Et mon plus grand désir est de déverser cet amour de Père sur toi.",
  "Parce que tu es mon enfant bien-aimé, et que je suis ton Père.",
  "Je t'offre infiniment plus que ton père terrestre n'aurait jamais pu te donner.",
  "Car je suis le Père parfait.",
  "Tout don parfait que tu reçois découle de ma main bienveillante.",
  "Je suis celui qui pourvoit fidèlement à tous tes besoins.",
  "Mon projet pour ton avenir a toujours été rempli d'espérance.",
  "Parce que je t'aime d'un amour éternel et inconditionnel.",
  "Mes pensées d'amour pour toi sont plus nombreuses que les grains de sable au bord des mers.",
  "Je pousse des cris de joie et je me réjouis à ton sujet avec allégresse.",
  "Je ne me lasserai jamais de te faire du bien.",
  "Tu es pour moi un trésor précieux entre tous.",
  "De tout mon cœur et de toute mon âme, je désire affermir tes pas.",
  "Je veux te révéler des choses grandes et secrètes que tu ne connais pas.",
  "Si tu me cherches de tout ton cœur, tu me trouveras.",
  "Fais de moi tes délices, et je te donnerai ce que ton cœur désire le plus.",
  "Car c'est moi-même qui ai déposé ces nobles désirs en toi.",
  "Je suis capable de faire infiniment au-delà de tout ce que tu peux demander ou même imaginer.",
  "Je suis ton réconfort et ton encouragement le plus fidèle.",
  "Je suis le Père qui essuie tes larmes et te console dans toutes tes détresses.",
  "Quand ton cœur est brisé ou accablé, je me tiens tout près de toi.",
  "Comme un berger porte son agneau sur sa poitrine, je te serre tout près de mon cœur.",
  "Un jour, j'essuierai toute larme de tes yeux.",
  "Et j'emporterai pour toujours toute la douleur, le deuil et les peines de cette terre.",
  "Je suis ton Père, et je t'aime du même amour infini dont j'aime mon propre Fils, Jésus.",
  "Car en Jésus, tout mon amour pour toi est pleinement manifesté.",
  "Il est le reflet éclatant et l'empreinte exacte de mon être.",
  "Il est venu te prouver que je suis résolument pour toi, et non contre toi.",
  "Et te dire que je ne retiens plus aucun de tes péchés contre toi.",
  "Jésus a donné sa vie pour que toi et moi soyons réconciliés à tout jamais.",
  "Sa croix est la preuve suprême et sans appel de mon amour pour toi.",
  "J'ai tout donné, ce que j'avais de plus cher, pour gagner ton cœur et ton amour.",
  "Si tu accueilles mon Fils Jésus, c'est moi-même que tu accueilles.",
  "Et rien, absolument rien, ne pourra jamais te séparer de mon amour.",
  "Reviens à la maison : tout le ciel célèbre une fête immense pour ton retour.",
  "J'ai toujours été Père, et je serai éternellement ton Père.",
  "Ma question pour toi aujourd'hui est… Veux-tu être mon enfant ?",
  "Je t'attends les bras ouverts. Ton Père qui t'aime, Dieu Tout-Puissant."
];


const empreinteDe = (texte) => createHash('sha1').update(texte).digest('hex').slice(0, 12);

// ─────────────────────────────────────────────────────────────
// ElevenLabs
// ─────────────────────────────────────────────────────────────

async function synthetiser(texte, config) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${config.voix}?output_format=mp3_44100_128`;

  const reponse = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'xi-api-key': config.cle,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: texte,
      model_id: config.modele,
      // Une voix de lecture : posée, régulière, sans effets.
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.8,
        style: 0.15,
        use_speaker_boost: true,
      },
    }),
  });

  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => '');
    throw new Error(`ElevenLabs ${reponse.status} — ${detail.slice(0, 200)}`);
  }

  return Buffer.from(await reponse.arrayBuffer());
}

// ─────────────────────────────────────────────────────────────
// Manifeste
// ─────────────────────────────────────────────────────────────

async function lireManifeste() {
  if (!existsSync(MANIFESTE)) return { genereLe: '', pistes: {} };
  try {
    return JSON.parse(await readFile(MANIFESTE, 'utf8'));
  } catch {
    return { genereLe: '', pistes: {} };
  }
}

async function fichiersHumains() {
  if (!existsSync(DOSSIER_HUMAINE)) return new Map();
  const noms = await readdir(DOSSIER_HUMAINE);
  return new Map(
    noms
      .filter((nom) => /\.(mp3|m4a|ogg|wav)$/i.test(nom))
      .map((nom) => [nom.replace(/\.[^.]+$/, ''), nom])
  );
}

async function ecrireManifeste(pistes, voixParDefaut) {
  await mkdir(DOSSIER, { recursive: true });
  await writeFile(
    MANIFESTE,
    `${JSON.stringify({ genereLe: new Date().toISOString(), voixParDefaut, pistes }, null, 1)}\n`,
    'utf8'
  );
}

// ─────────────────────────────────────────────────────────────

async function main() {
  const options = lireArguments(process.argv.slice(2));
  const livret = JSON.parse(await readFile(LIVRET, 'utf8'));
  const pistes = pistesDuLivret(livret, options.fiches);

  const caracteres = pistes.reduce((total, piste) => total + piste.texte.length, 0);

  if (options.estimation) {
    console.log(`\n  ${pistes.length} pistes · ${caracteres.toLocaleString('fr-FR')} caractères`);
    console.log(
      `  Coût indicatif ElevenLabs : environ ${((caracteres / 1000) * EURO_PAR_MILLE_CARACTERES).toFixed(2)} €`
    );
    console.log('  (une seule fois : le corpus est fixe et les fichiers sont versionnés)\n');
    const parFiche = new Map();
    for (const piste of pistes) {
      parFiche.set(piste.fiche, (parFiche.get(piste.fiche) ?? 0) + piste.texte.length);
    }
    for (const [fiche, taille] of [...parFiche].sort((a, b) => a[0] - b[0])) {
      console.log(`   fiche ${String(fiche).padStart(2)} · ${taille.toLocaleString('fr-FR')} caractères`);
    }
    return;
  }

  const manifeste = await lireManifeste();
  const humains = await fichiersHumains();
  const config = {
    cle: process.env.ELEVENLABS_API_KEY,
    voix: process.env.ELEVENLABS_VOICE_ID,
    modele: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
  };

  const sortie = { ...manifeste.pistes };
  let generees = 0;
  let ignorees = 0;
  let humaines = 0;

  for (const piste of pistes) {
    const empreinte = empreinteDe(piste.texte);

    // 1. Un enregistrement humain l'emporte toujours.
    const fichierHumain = humains.get(piste.id);
    if (fichierHumain) {
      sortie[piste.id] = {
        id: piste.id,
        url: `/voix/humaine/${fichierHumain}`,
        source: 'humaine',
        empreinte,
      };
      humaines += 1;
      continue;
    }

    if (options.manifesteSeul) {
      // On se contente de vérifier que le fichier de synthèse existe encore.
      const chemin = path.join(DOSSIER_ELEVEN, `${piste.id}.mp3`);
      if (existsSync(chemin)) {
        sortie[piste.id] = {
          id: piste.id,
          url: `/voix/eleven/${piste.id}.mp3`,
          source: 'eleven',
          empreinte,
          voix: config.voix,
        };
      } else {
        delete sortie[piste.id];
      }
      continue;
    }

    // 2. Déjà générée avec la MÊME voix et texte inchangé : on passe.
    const existante = sortie[piste.id];
    const chemin = path.join(DOSSIER_ELEVEN, `${piste.id}.mp3`);
    if (
      !options.force &&
      existante?.source === 'eleven' &&
      existante?.voix === config.voix &&
      existante.empreinte === empreinte &&
      existsSync(chemin)
    ) {
      ignorees += 1;
      continue;
    }

    if (!config.cle || !config.voix) {
      console.error(
        '\n  ELEVENLABS_API_KEY et ELEVENLABS_VOICE_ID sont nécessaires pour générer.'
      );
      console.error('  Ajoutez-les à .env.local, ou lancez --estimation pour chiffrer d’abord.\n');
      process.exit(1);
    }

    process.stdout.write(`  ${piste.id.padEnd(14)} ${piste.texte.length.toString().padStart(5)} c. `);
    try {
      const audio = await synthetiser(piste.texte, config);
      await mkdir(DOSSIER_ELEVEN, { recursive: true });
      await writeFile(chemin, audio);
      const taille = (await stat(chemin)).size;
      sortie[piste.id] = {
        id: piste.id,
        url: `/voix/eleven/${piste.id}.mp3`,
        source: 'eleven',
        empreinte,
        voix: config.voix,
      };
      generees += 1;
      console.log(`✓ ${(taille / 1024).toFixed(0)} Ko`);
    } catch (erreur) {
      console.log(`✗ ${erreur.message}`);
      // On s'arrête : mieux vaut corriger que brûler le quota sur une erreur
      // répétée (clé invalide, voix inexistante, quota dépassé).
      break;
    }

    if (options.pause > 0) await new Promise((r) => setTimeout(r, options.pause));
  }

  await ecrireManifeste(sortie, config.voix);

  console.log(
    `\n  ${generees} générée(s) · ${ignorees} inchangée(s) · ${humaines} enregistrement(s) humain(s)`
  );
  console.log(`  Manifeste : ${path.relative(RACINE, MANIFESTE)}\n`);
}

main().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
