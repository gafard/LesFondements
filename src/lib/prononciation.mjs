/**
 * Transforme les références bibliques écrites en français naturel avant de
 * les confier à une voix. Le texte du livret reste inchangé : seule sa copie
 * vocale est préparée ici.
 *
 * Ce module est volontairement en .mjs. Il est utilisé à la fois par le
 * navigateur et par tous les générateurs de pistes : une seule diction doit
 * exister, sans version Python parallèle susceptible de diverger.
 */

const LIVRES = [
  { nom: 'Genèse', alias: ['Gn', 'Gen', 'Genèse', 'Genese'] },
  { nom: 'Exode', alias: ['Ex', 'Exode'] },
  { nom: 'Lévitique', alias: ['Lv', 'Lé', 'Lev', 'Lév', 'Lévitique', 'Levitique'] },
  { nom: 'Nombres', alias: ['Nb', 'No', 'Nombres'] },
  { nom: 'Deutéronome', alias: ['Dt', 'De', 'Deut', 'Deutéronome', 'Deuteronome'] },
  { nom: 'Josué', alias: ['Jos', 'Josué', 'Josue'] },
  { nom: 'Juges', alias: ['Jg', 'Juges'] },
  { nom: 'Ruth', alias: ['Rt', 'Ruth'] },
  { nom: 'Samuel', alias: ['S', 'Sm', 'Sam', 'Samuel'], numerote: ['livre de Samuel', 'm'] },
  { nom: 'Rois', alias: ['R', 'Ro', 'Rois'], numerote: ['livre des Rois', 'm'] },
  {
    nom: 'Chroniques',
    alias: ['Ch', 'Chr', 'Chroniques'],
    numerote: ['livre des Chroniques', 'm'],
  },
  { nom: 'Esdras', alias: ['Esd', 'Esdras'] },
  { nom: 'Néhémie', alias: ['Ne', 'Né', 'Neh', 'Néhémie', 'Nehemie'] },
  { nom: 'Esther', alias: ['Est', 'Esther'] },
  { nom: 'Job', alias: ['Jb', 'Job'] },
  { nom: 'Psaume', alias: ['Ps', 'Psaume', 'Psaumes'], psaume: true },
  { nom: 'Proverbes', alias: ['Pr', 'Prov', 'Proverbes'] },
  { nom: 'Ecclésiaste', alias: ['Ec', 'Ecc', 'Ecclésiaste', 'Ecclesiaste'] },
  { nom: 'Cantique des cantiques', alias: ['Ct', 'Cantique des cantiques'] },
  { nom: 'Ésaïe', alias: ['Es', 'És', 'Esaïe', 'Ésaïe', 'Esaie'] },
  { nom: 'Jérémie', alias: ['Jr', 'Jer', 'Jérémie', 'Jeremie'] },
  { nom: 'Lamentations', alias: ['Lm', 'Lam', 'Lamentations'] },
  { nom: 'Ézéchiel', alias: ['Ez', 'Éz', 'Ézéchiel', 'Ezechiel'] },
  { nom: 'Daniel', alias: ['Dn', 'Dan', 'Daniel'] },
  { nom: 'Osée', alias: ['Os', 'Osée', 'Osee'] },
  { nom: 'Joël', alias: ['Jl', 'Joël', 'Joel'] },
  { nom: 'Amos', alias: ['Am', 'Amos'] },
  { nom: 'Abdias', alias: ['Ab', 'Abdias'] },
  { nom: 'Jonas', alias: ['Jon', 'Jonas'] },
  { nom: 'Michée', alias: ['Mi', 'Michée', 'Michee'] },
  { nom: 'Nahum', alias: ['Na', 'Nahum'] },
  { nom: 'Habacuc', alias: ['Ha', 'Hab', 'Hbq', 'Habacuc'] },
  { nom: 'Sophonie', alias: ['So', 'Soph', 'Sophonie'] },
  { nom: 'Aggée', alias: ['Ag', 'Aggée', 'Aggee'] },
  { nom: 'Zacharie', alias: ['Za', 'Zach', 'Zacharie'] },
  { nom: 'Malachie', alias: ['Ml', 'Mal', 'Malachie'] },
  { nom: 'Matthieu', alias: ['Mt', 'Mat', 'Matt', 'Matthieu'] },
  { nom: 'Marc', alias: ['Mc', 'Mr', 'Marc'] },
  { nom: 'Luc', alias: ['Lc', 'Luc'] },
  { nom: 'Jean', alias: ['Jn', 'Jean'], numerote: ['lettre de Jean', 'f'] },
  { nom: 'Actes', alias: ['Ac', 'Act', 'Actes', 'Actes des Apôtres'] },
  { nom: 'Romains', alias: ['Rm', 'Rom', 'Romains'] },
  {
    nom: 'Corinthiens',
    alias: ['Co', 'Cor', 'Corinthiens'],
    numerote: ['lettre aux Corinthiens', 'f'],
  },
  { nom: 'Galates', alias: ['Ga', 'Gal', 'Galates'] },
  { nom: 'Éphésiens', alias: ['Ep', 'Ép', 'Eph', 'Éph', 'Ephésiens', 'Éphésiens'] },
  { nom: 'Philippiens', alias: ['Ph', 'Php', 'Phil', 'Philippiens'] },
  { nom: 'Colossiens', alias: ['Col', 'Colossiens'] },
  {
    nom: 'Thessaloniciens',
    alias: ['Th', 'Thes', 'Thessaloniciens'],
    numerote: ['lettre aux Thessaloniciens', 'f'],
  },
  {
    nom: 'Timothée',
    alias: ['Tm', 'Ti', 'Tim', 'Timothée', 'Timothee'],
    numerote: ['lettre à Timothée', 'f'],
  },
  { nom: 'Tite', alias: ['Tt', 'Tit', 'Tite'] },
  { nom: 'Philémon', alias: ['Phm', 'Philémon', 'Philemon'] },
  { nom: 'Hébreux', alias: ['He', 'Hé', 'Heb', 'Hb', 'Héb', 'Hébreux', 'Hebreux'] },
  { nom: 'Jacques', alias: ['Jc', 'Jac', 'Jacques'] },
  {
    nom: 'Pierre',
    alias: ['P', 'Pi', 'Pie', 'Pierre'],
    numerote: ['lettre de Pierre', 'f'],
  },
  { nom: 'Jude', alias: ['Jd', 'Jude'] },
  { nom: 'Apocalypse', alias: ['Ap', 'Apo', 'Apocalypse'] },
];

const RANGS_FEMININS = ['', 'première', 'deuxième', 'troisième'];
const RANGS_MASCULINS = ['', 'premier', 'deuxième', 'troisième'];

function normaliserCle(valeur) {
  return valeur
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const LIVRE_PAR_ALIAS = new Map();
for (const livre of LIVRES) {
  for (const alias of livre.alias) LIVRE_PAR_ALIAS.set(normaliserCle(alias), livre);
}

const echapper = (valeur) => valeur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const MOTIF_LIVRE = [...new Set(LIVRES.flatMap((livre) => livre.alias))]
  .sort((a, b) => b.length - a.length)
  .map((alias) => echapper(alias).replace(/\s+/g, '\\s+'))
  .join('|');

/**
 * Pas de \b : en JavaScript, É n'est pas un caractère de mot et une
 * référence comme « Éphésiens 2:10 » passerait à travers.
 */
const RE_LIVRE = new RegExp(
  `(^|[^\\p{L}\\p{N}])([123]\\s*)?(${MOTIF_LIVRE})(?![\\p{L}\\p{N}])`,
  'gu'
);

function nommerLivre(livre, numero) {
  if (!numero) return livre.nom;
  if (!livre.numerote) return null;
  const [nom, genre] = livre.numerote;
  const rangs = genre === 'm' ? RANGS_MASCULINS : RANGS_FEMININS;
  return `${rangs[Number(numero)] ?? numero} ${nom}`;
}

function nombreAvecSuffixe(valeur) {
  return valeur.replace(/^(\d+)([a-z])$/i, '$1 $2');
}

function joindre(liste) {
  if (liste.length < 2) return liste[0] ?? '';
  if (liste.length === 2) return `${liste[0]} et ${liste[1]}`;
  return `${liste.slice(0, -1).join(', ')} et ${liste.at(-1)}`;
}

function direChapitres(expression) {
  const nombres = expression.match(/\d{1,3}/g) ?? [];
  if (nombres.length === 1) return `chapitre ${nombres[0]}`;
  if (nombres.length === 2 && /(?:à|[-–—])/i.test(expression)) {
    return `chapitres ${nombres[0]} à ${nombres[1]}`;
  }
  return `chapitres ${joindre(nombres)}`;
}

function direVersets(expression) {
  const elements = expression
    .split(/\s*(?:,|\bet\b)\s*/i)
    .filter(Boolean)
    .map((element) => {
      const bornes = element.split(/\s*(?:à|[-–—])\s*/i).filter(Boolean);
      if (bornes.length === 2) {
        return `${nombreAvecSuffixe(bornes[0])} à ${nombreAvecSuffixe(bornes[1])}`;
      }
      return nombreAvecSuffixe(element.trim());
    });
  const estPluriel = elements.length > 1 || elements.some((element) => element.includes(' à '));
  return `${estPluriel ? 'versets' : 'verset'} ${joindre(elements)}`;
}

const MOTIF_LISTE_CHAPITRES = '\\d{1,3}(?:\\s*(?:,|à|et|[-–—])\\s*\\d{1,3})*';
const MOTIF_VERSET = '\\d{1,3}[a-z]?(?:\\s*(?:à|[-–—])\\s*\\d{1,3}[a-z]?)?';
const RE_VERSETS = new RegExp(
  `^(${MOTIF_VERSET}(?:\\s*(?:,|et)\\s*${MOTIF_VERSET}(?!\\s*:))*)`,
  'i'
);

function lireVersets(texte) {
  const match = texte.match(RE_VERSETS);
  if (!match) return null;
  return { expression: match[1], longueur: match[0].length };
}

function direReference(livre, nomLivre, chapitre, versets) {
  if (!versets) return livre.psaume ? `${nomLivre} ${chapitre}` : `${nomLivre}, chapitre ${chapitre}`;
  const dits = direVersets(versets);
  return livre.psaume
    ? `${nomLivre} ${chapitre}, ${dits}`
    : `${nomLivre}, chapitre ${chapitre}, ${dits}`;
}

/** Lit ce qui suit un nom de livre et indique la longueur de la référence. */
function lireCoordonnees(reste, livre, nomLivre) {
  let debut = 0;
  debut += reste.slice(debut).match(/^\s*/)?.[0].length ?? 0;

  if (reste[debut] === ',') {
    debut += 1;
    debut += reste.slice(debut).match(/^\s*/)?.[0].length ?? 0;
  } else if (/^\.\s*(?:ch|chapitre)/i.test(reste.slice(debut))) {
    debut += 1;
    debut += reste.slice(debut).match(/^\s*/)?.[0].length ?? 0;
  }

  const apresPonctuation = reste.slice(debut);
  const explicite = apresPonctuation.match(
    new RegExp(`^(?:chapitres?|chap\\.?|ch\\.?)\\s*(${MOTIF_LISTE_CHAPITRES})`, 'i')
  );
  if (explicite) {
    return {
      longueur: debut + explicite[0].length,
      texte: `${nomLivre}, ${direChapitres(explicite[1])}`,
    };
  }

  const avecVersets = apresPonctuation.match(/^(\d{1,3})\s*[:.]\s*/);
  if (avecVersets) {
    const chapitre = avecVersets[1];
    const positionVersets = avecVersets[0].length;
    const versets = lireVersets(apresPonctuation.slice(positionVersets));
    if (!versets) return null;

    let longueur = debut + positionVersets + versets.longueur;
    let texte = direReference(livre, nomLivre, chapitre, versets.expression);

    // Une citation peut enchaîner des chapitres sans répéter le livre :
    // « Pr 1:7 et 2:5 » ou « Ps 146 ; 8:2 ; 29:2 ».
    while (true) {
      const suite = reste.slice(longueur).match(/^\s*(;|\+|et)\s*(\d{1,3})\s*[:.]\s*/i);
      if (!suite) break;
      const autresVersets = lireVersets(reste.slice(longueur + suite[0].length));
      if (!autresVersets) break;
      texte += `${suite[1].toLowerCase() === 'et' ? ' et ' : ' ; '}${direReference(
        livre,
        nomLivre,
        suite[2],
        autresVersets.expression
      )}`;
      longueur += suite[0].length + autresVersets.longueur;
    }

    return { longueur, texte };
  }

  const chapitres = apresPonctuation.match(new RegExp(`^(${MOTIF_LISTE_CHAPITRES})`, 'i'));
  if (!chapitres) return null;
  const nombres = chapitres[1].match(/\d{1,3}/g) ?? [];
  let longueur = debut + chapitres[0].length;
  let texte =
    nombres.length > 1
      ? `${nomLivre}, ${direChapitres(chapitres[1])}`
      : direReference(livre, nomLivre, nombres[0], null);

  while (true) {
    const suite = reste.slice(longueur).match(/^\s*;\s*(\d{1,3})\s*[:.]\s*/);
    if (!suite) break;
    const autresVersets = lireVersets(reste.slice(longueur + suite[0].length));
    if (!autresVersets) break;
    texte += ` ; ${direReference(livre, nomLivre, suite[1], autresVersets.expression)}`;
    longueur += suite[0].length + autresVersets.longueur;
  }

  return { longueur, texte };
}

/**
 * Développe toutes les références reconnues. La fonction est idempotente :
 * lui redonner un texte déjà préparé ne doit jamais le modifier une seconde
 * fois.
 *
 * @param {string} texte
 * @returns {string}
 */
export function preparerPourLaVoix(texte) {
  if (typeof texte !== 'string' || !texte) return texte ?? '';

  let sortie = '';
  let position = 0;
  RE_LIVRE.lastIndex = 0;

  for (let match = RE_LIVRE.exec(texte); match; match = RE_LIVRE.exec(texte)) {
    const prefixe = match[1] ?? '';
    const numero = match[2]?.trim() ?? '';
    const alias = match[3];
    const livre = LIVRE_PAR_ALIAS.get(normaliserCle(alias));
    if (!livre) continue;

    // Les abréviations d'une seule lettre ne désignent un livre que si son
    // numéro est présent : « 1 P 5:6 », jamais le « p » d'une phrase.
    if (!numero && ['s', 'r', 'p'].includes(normaliserCle(alias))) continue;

    const nomLivre = nommerLivre(livre, numero);
    if (!nomLivre) continue;

    const debutLivre = match.index + prefixe.length;
    const finLivre = RE_LIVRE.lastIndex;
    const coordonnees = lireCoordonnees(texte.slice(finLivre), livre, nomLivre);
    if (!coordonnees) continue;

    sortie += texte.slice(position, debutLivre);
    sortie += coordonnees.texte;
    position = finLivre + coordonnees.longueur;
    RE_LIVRE.lastIndex = position;
  }

  sortie += texte.slice(position);
  return sortie.replace(/\s{2,}/g, ' ').trim();
}
