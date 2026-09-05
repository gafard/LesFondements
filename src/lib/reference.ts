/**
 * Lecture des références bibliques telles qu'elles sont écrites dans le
 * livret : « Rm 8:31-32 », « 1 Jn 4 :16 », « 1Cor 13:13 », « Psaume 139 »,
 * « Jn 14-17 », « Lc 15:11-32 »…
 *
 * L'abréviation n'est pas normalisée dans le livret — on trouve « He »,
 * « Hb » et « Hébreux » pour le même livre. La table ci-dessous accepte tout
 * ce qui y apparaît, plus les variantes courantes.
 */

export interface Livre {
  /** Identifiant interne, celui des fichiers de `public/etudes`. */
  code: string;
  nom: string;
  numero: number;
  testament: 'at' | 'nt';
}

export interface ReferenceBiblique {
  livre: Livre;
  chapitre: number;
  /** Absent pour une référence au chapitre entier (« Gn 1 »). */
  versetDebut?: number;
  versetFin?: number;
  /** Dernier chapitre d'une plage (« Jn 14-17 »). */
  chapitreFin?: number;
  /** Le texte tel qu'il apparaissait dans la source. */
  brut: string;
}

// ─────────────────────────────────────────────────────────────
// Les 66 livres et leurs abréviations françaises
// ─────────────────────────────────────────────────────────────

type Entree = [code: string, nom: string, numero: number, alias: string[]];

const LIVRES: Entree[] = [
  ['gn', 'Genèse', 1, ['gn', 'ge', 'gen', 'genese']],
  ['ex', 'Exode', 2, ['ex', 'exo', 'exode']],
  ['lv', 'Lévitique', 3, ['lv', 'le', 'lev', 'levitique']],
  ['nb', 'Nombres', 4, ['nb', 'no', 'nom', 'nombres']],
  ['dt', 'Deutéronome', 5, ['dt', 'de', 'deut', 'deuteronome']],
  ['jos', 'Josué', 6, ['jos', 'josue']],
  ['jg', 'Juges', 7, ['jg', 'jug', 'juges']],
  ['rt', 'Ruth', 8, ['rt', 'ru', 'ruth']],
  ['1s', '1 Samuel', 9, ['1s', '1sm', '1sa', '1samuel']],
  ['2s', '2 Samuel', 10, ['2s', '2sm', '2sa', '2samuel']],
  ['1r', '1 Rois', 11, ['1r', '1ro', '1rois']],
  ['2r', '2 Rois', 12, ['2r', '2ro', '2rois']],
  ['1ch', '1 Chroniques', 13, ['1ch', '1chr', '1chroniques']],
  ['2ch', '2 Chroniques', 14, ['2ch', '2chr', '2chroniques']],
  ['esd', 'Esdras', 15, ['esd', 'esdras']],
  ['ne', 'Néhémie', 16, ['ne', 'neh', 'nehemie']],
  ['est', 'Esther', 17, ['est', 'esther']],
  ['jb', 'Job', 18, ['jb', 'job']],
  ['ps', 'Psaumes', 19, ['ps', 'psa', 'psaume', 'psaumes']],
  ['pr', 'Proverbes', 20, ['pr', 'pro', 'prov', 'proverbes']],
  ['ec', 'Ecclésiaste', 21, ['ec', 'ecc', 'eccl', 'ecclesiaste', 'qo']],
  ['ct', 'Cantique des cantiques', 22, ['ct', 'cant', 'cantique', 'cantiques']],
  ['es', 'Ésaïe', 23, ['es', 'esa', 'esaie', 'is', 'isaie']],
  ['jr', 'Jérémie', 24, ['jr', 'jer', 'jeremie']],
  ['lm', 'Lamentations', 25, ['lm', 'lam', 'lamentations']],
  ['ez', 'Ézéchiel', 26, ['ez', 'eze', 'ezech', 'ezechiel']],
  ['dn', 'Daniel', 27, ['dn', 'da', 'dan', 'daniel']],
  ['os', 'Osée', 28, ['os', 'ose', 'osee']],
  ['jl', 'Joël', 29, ['jl', 'joe', 'joel']],
  ['am', 'Amos', 30, ['am', 'amo', 'amos']],
  ['ab', 'Abdias', 31, ['ab', 'abd', 'abdias']],
  ['jon', 'Jonas', 32, ['jon', 'jonas']],
  ['mi', 'Michée', 33, ['mi', 'mic', 'michee']],
  ['na', 'Nahum', 34, ['na', 'nah', 'nahum']],
  ['ha', 'Habacuc', 35, ['ha', 'hab', 'habacuc']],
  ['so', 'Sophonie', 36, ['so', 'sop', 'soph', 'sophonie']],
  ['ag', 'Aggée', 37, ['ag', 'agg', 'aggee']],
  ['za', 'Zacharie', 38, ['za', 'zac', 'zach', 'zacharie']],
  ['ml', 'Malachie', 39, ['ml', 'mal', 'malachie']],
  ['mt', 'Matthieu', 40, ['mt', 'mat', 'matt', 'matthieu']],
  ['mc', 'Marc', 41, ['mc', 'mar', 'marc']],
  ['lc', 'Luc', 42, ['lc', 'luc']],
  ['jn', 'Jean', 43, ['jn', 'jean', 'jhn']],
  ['ac', 'Actes', 44, ['ac', 'act', 'actes']],
  ['rm', 'Romains', 45, ['rm', 'ro', 'rom', 'romains']],
  ['1co', '1 Corinthiens', 46, ['1co', '1cor', '1c', '1corinthiens']],
  ['2co', '2 Corinthiens', 47, ['2co', '2cor', '2c', '2corinthiens']],
  ['ga', 'Galates', 48, ['ga', 'gal', 'galates']],
  ['ep', 'Éphésiens', 49, ['ep', 'eph', 'ephesiens']],
  ['ph', 'Philippiens', 50, ['ph', 'phi', 'phil', 'philippiens']],
  ['col', 'Colossiens', 51, ['col', 'colossiens']],
  ['1th', '1 Thessaloniciens', 52, ['1th', '1the', '1thes', '1thessaloniciens']],
  ['2th', '2 Thessaloniciens', 53, ['2th', '2the', '2thes', '2thessaloniciens']],
  ['1tm', '1 Timothée', 54, ['1tm', '1ti', '1tim', '1timothee']],
  ['2tm', '2 Timothée', 55, ['2tm', '2ti', '2tim', '2timothee']],
  ['tt', 'Tite', 56, ['tt', 'tit', 'tite']],
  ['phm', 'Philémon', 57, ['phm', 'phlm', 'philemon']],
  ['he', 'Hébreux', 58, ['he', 'hb', 'heb', 'hebr', 'hebreux']],
  ['jc', 'Jacques', 59, ['jc', 'jac', 'jacques', 'jq']],
  ['1p', '1 Pierre', 60, ['1p', '1pi', '1pie', '1pier', '1pierre', '1pe']],
  ['2p', '2 Pierre', 61, ['2p', '2pi', '2pie', '2pier', '2pierre', '2pe']],
  ['1jn', '1 Jean', 62, ['1jn', '1j', '1jean']],
  ['2jn', '2 Jean', 63, ['2jn', '2j', '2jean']],
  ['3jn', '3 Jean', 64, ['3jn', '3j', '3jean']],
  ['jud', 'Jude', 65, ['jud', 'jude', 'jde']],
  ['ap', 'Apocalypse', 66, ['ap', 'apo', 'apoc', 'apocalypse', 'rev']],
];

export const TOUS_LES_LIVRES: Livre[] = LIVRES.map(([code, nom, numero]) => ({
  code,
  nom,
  numero,
  testament: numero <= 39 ? 'at' : 'nt',
}));

const PAR_CODE = new Map(TOUS_LES_LIVRES.map((livre) => [livre.code, livre]));

/** Table des alias → livre, une fois normalisés (sans accent ni espace). */
const PAR_ALIAS = new Map<string, Livre>();
LIVRES.forEach(([code, , , alias]) => {
  const livre = PAR_CODE.get(code)!;
  for (const forme of alias) PAR_ALIAS.set(forme, livre);
});

function normaliser(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.\s '’]/g, '');
}

export function livreParCode(code: string): Livre | null {
  return PAR_CODE.get(code) ?? null;
}

export function livreParNom(valeur: string): Livre | null {
  return PAR_ALIAS.get(normaliser(valeur)) ?? null;
}

// ─────────────────────────────────────────────────────────────
// Analyse
// ─────────────────────────────────────────────────────────────

/**
 * Le livret sépare parfois le chapitre du verset par une espace insécable
 * (« Jn 17 :3 ») et enchaîne les références par « ; ».
 *
 *   groupe 1  numéro du livre (1, 2, 3) collé ou séparé
 *   groupe 2  nom ou abréviation
 *   groupe 3  chapitre
 *   groupe 4  chapitre de fin (« Jean 14-17 ») ou verset
 *   groupe 5  verset de fin
 */
const MOTIF = new RegExp(
  String.raw`(?:\b|\()([123])?\s?` + // numéro éventuel du livre
    String.raw`([a-zA-ZÀ-ÿ]{1,12})\.?\s*` + // nom du livre (insensible à la casse)
    String.raw`(\d{1,3})(?![a-zA-ZÀ-ÿ])` + // chapitre
    String.raw`(?:\s*[:.]\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?` + // versets
    String.raw`|\s*[-–]\s*(\d{1,3})(?![:.\d]))?`, // ou plage de chapitres
  'gi'
);

const MOTIF_ENCHAINEMENT =
  /^(?:\s*(?:et|,)\s*)(\d{1,3})(?:\s*[:.]\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?|\s*[-–]\s*(\d{1,3}))?(?![a-zA-ZÀ-ÿ\d])/i;

/** Analyse une référence isolée. Retourne `null` si ce n'en est pas une. */
export function analyserReference(valeur: string): ReferenceBiblique | null {
  MOTIF.lastIndex = 0;
  const trouvee = MOTIF.exec(valeur.trim());
  if (!trouvee) return null;
  const reference = construire(trouvee);
  return reference;
}

function construire(trouvee: RegExpExecArray): ReferenceBiblique | null {
  const [brutEntier, numero, nom, chapitre, verset, versetFin, chapitreFin] = trouvee;
  const livre = livreParNom(`${numero ?? ''}${nom}`);
  if (!livre) return null;

  const brut = brutEntier.trim().replace(/^\(/, '');
  const reference: ReferenceBiblique = {
    livre,
    chapitre: Number.parseInt(chapitre, 10),
    brut,
  };
  if (verset) {
    reference.versetDebut = Number.parseInt(verset, 10);
    if (versetFin) reference.versetFin = Number.parseInt(versetFin, 10);
  }
  if (chapitreFin) reference.chapitreFin = Number.parseInt(chapitreFin, 10);
  return reference;
}

export interface ReferenceTrouvee {
  reference: ReferenceBiblique;
  debut: number;
  fin: number;
}

/**
 * Repère toutes les références d'un texte, pour les rendre cliquables.
 * Les faux positifs sont écartés par la table des livres : « Fiche 3 » ou
 * « page 160 » ne correspondent à aucune abréviation.
 */
export function detecterReferences(texte: string): ReferenceTrouvee[] {
  const trouvees: ReferenceTrouvee[] = [];
  MOTIF.lastIndex = 0;

  let correspondance: RegExpExecArray | null;
  while ((correspondance = MOTIF.exec(texte)) !== null) {
    const reference = construire(correspondance);
    if (!reference) {
      MOTIF.lastIndex = correspondance.index + 1;
      continue;
    }

    const brutSansParenth = reference.brut;
    const decalageDansMatch = correspondance[0].indexOf(brutSansParenth);
    const debut = correspondance.index + (decalageDansMatch >= 0 ? decalageDansMatch : 0);
    const fin = debut + brutSansParenth.length;
    trouvees.push({ reference, debut, fin });

    // Repérage des enchaînements : « Gn 2 et 3 », « 1 Co 12 et 14 », « Jn 14:15-18 et 25-26 », « Rm 3:20, 28 »
    let curseurFin = fin;
    let derniereRef = reference;

    while (curseurFin < texte.length) {
      const suite = texte.slice(curseurFin);
      const matchEnchainement = MOTIF_ENCHAINEMENT.exec(suite);
      if (!matchEnchainement) break;

      const [texteComplet, p1, p2, p3, p4] = matchEnchainement;
      const refEnchainee: ReferenceBiblique = {
        livre: derniereRef.livre,
        chapitre: derniereRef.chapitre,
        brut: '',
      };

      if (p2 !== undefined) {
        // Ex: « Pr 1:7 et 2:5 » -> p1 est le chapitre (2), p2 est le verset (5)
        refEnchainee.chapitre = Number.parseInt(p1, 10);
        refEnchainee.versetDebut = Number.parseInt(p2, 10);
        if (p3 !== undefined) refEnchainee.versetFin = Number.parseInt(p3, 10);
      } else if (derniereRef.versetDebut !== undefined) {
        // Ex: « Jn 14:15-18 et 25-26 » ou « Rm 3:20, 28 » -> même chapitre, verset p1
        refEnchainee.chapitre = derniereRef.chapitre;
        refEnchainee.versetDebut = Number.parseInt(p1, 10);
        if (p4 !== undefined) refEnchainee.versetFin = Number.parseInt(p4, 10);
      } else {
        // Ex: « Gn 2 et 3 » ou « 1 Co 12 et 14 » -> même livre, nouveau chapitre p1
        refEnchainee.chapitre = Number.parseInt(p1, 10);
        if (p4 !== undefined) refEnchainee.chapitreFin = Number.parseInt(p4, 10);
      }

      const separateurMatch = texteComplet.match(/^\s*(?:et|,)\s*/i);
      const longueurSep = separateurMatch ? separateurMatch[0].length : 0;
      const brutPart = texteComplet.slice(longueurSep).trim();
      refEnchainee.brut = brutPart;

      const debutLien = curseurFin + longueurSep;
      const finLien = debutLien + brutPart.length;

      trouvees.push({
        reference: refEnchainee,
        debut: debutLien,
        fin: finLien,
      });

      curseurFin = curseurFin + texteComplet.length;
      derniereRef = refEnchainee;
    }

    MOTIF.lastIndex = curseurFin;
  }
  return trouvees;
}

/** « Jn 3:16 », « Jn 3:16-18 », « Jean 14 à 17 ». */
export function formaterReference(reference: ReferenceBiblique, long = false): string {
  const nom = long ? reference.livre.nom : abreger(reference.livre);
  if (reference.chapitreFin) return `${nom} ${reference.chapitre}–${reference.chapitreFin}`;
  if (reference.versetDebut === undefined) return `${nom} ${reference.chapitre}`;
  if (reference.versetFin) {
    return `${nom} ${reference.chapitre}:${reference.versetDebut}-${reference.versetFin}`;
  }
  return `${nom} ${reference.chapitre}:${reference.versetDebut}`;
}

/** Abréviations d'affichage, dans la forme employée par le livret. */
const ABREGE: Record<string, string> = {
  gn: 'Gn', ex: 'Ex', lv: 'Lv', nb: 'Nb', dt: 'Dt', jos: 'Jos', jg: 'Jg', rt: 'Rt',
  '1s': '1 Sm', '2s': '2 Sm', '1r': '1 R', '2r': '2 R', '1ch': '1 Ch', '2ch': '2 Ch',
  esd: 'Esd', ne: 'Ne', est: 'Est', jb: 'Jb', ps: 'Ps', pr: 'Pr', ec: 'Ec', ct: 'Ct',
  es: 'Es', jr: 'Jr', lm: 'Lm', ez: 'Ez', dn: 'Dn', os: 'Os', jl: 'Jl', am: 'Am',
  ab: 'Ab', jon: 'Jon', mi: 'Mi', na: 'Na', ha: 'Ha', so: 'So', ag: 'Ag', za: 'Za',
  ml: 'Ml', mt: 'Mt', mc: 'Mc', lc: 'Lc', jn: 'Jn', ac: 'Ac', rm: 'Rm',
  '1co': '1 Co', '2co': '2 Co', ga: 'Ga', ep: 'Ep', ph: 'Ph', col: 'Col',
  '1th': '1 Th', '2th': '2 Th', '1tm': '1 Tm', '2tm': '2 Tm', tt: 'Tt', phm: 'Phm',
  he: 'He', jc: 'Jc', '1p': '1 P', '2p': '2 P', '1jn': '1 Jn', '2jn': '2 Jn',
  '3jn': '3 Jn', jud: 'Jude', ap: 'Ap',
};

export function abreger(livre: Livre): string {
  return ABREGE[livre.code] ?? livre.nom;
}

/** Identifiant compact utilisé par les fichiers d'étude : « jn 3:16 ». */
export function clefVerset(codeLivre: string, chapitre: number, verset: number): string {
  return `${codeLivre} ${chapitre}:${verset}`;
}

export function analyserClefVerset(clef: string): ReferenceBiblique | null {
  const trouvee = /^([1-3]?[a-z]{1,3})\s+(\d{1,3}):(\d{1,3})$/.exec(clef.trim());
  if (!trouvee) return null;
  const livre = PAR_CODE.get(trouvee[1]);
  if (!livre) return null;
  return {
    livre,
    chapitre: Number.parseInt(trouvee[2], 10),
    versetDebut: Number.parseInt(trouvee[3], 10),
    brut: clef,
  };
}
