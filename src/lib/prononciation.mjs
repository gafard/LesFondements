/**
 * Comment une référence biblique doit se dire à voix haute.
 *
 * Écrite, « 1Jn 4:16 » se lit d'un coup d'œil. Lue par une synthèse vocale,
 * elle donne « un J N quatre deux points seize » — et l'auditeur, qui était
 * en train de méditer, doit soudain déchiffrer. On développe donc la
 * référence avant de la confier à une voix : « première lettre de Jean,
 * chapitre 4, verset 16 ».
 *
 * Ce module est en .mjs, et non en .ts, pour une raison précise : il sert à
 * la fois à l'application (mode immersion, bulles de verset) et au script de
 * génération des voix ElevenLabs, qui tourne dans Node sans compilation. Une
 * seule implémentation, deux usages — sinon les deux divergent et la voix de
 * secours ne dit plus la même chose que la voix enregistrée.
 */

const LIVRES_LUS = {
  Gn: 'Genèse', Ex: 'Exode', Lv: 'Lévitique', Nb: 'Nombres', Dt: 'Deutéronome',
  Jos: 'Josué', Jg: 'Juges', Rt: 'Ruth', Esd: 'Esdras', Ne: 'Néhémie',
  Est: 'Esther', Jb: 'Job', Ps: 'Psaume', Pr: 'Proverbes', Ec: 'Ecclésiaste',
  Ct: 'Cantique des cantiques', Es: 'Ésaïe', Jr: 'Jérémie', Lm: 'Lamentations',
  Ez: 'Ézéchiel', Dn: 'Daniel', Os: 'Osée', Jl: 'Joël', Am: 'Amos',
  Ab: 'Abdias', Jon: 'Jonas', Mi: 'Michée', Na: 'Nahum', Ha: 'Habacuc',
  So: 'Sophonie', Ag: 'Aggée', Za: 'Zacharie', Ml: 'Malachie',
  Mt: 'Matthieu', Mc: 'Marc', Lc: 'Luc', Jn: 'Jean', Ac: 'Actes',
  Rm: 'Romains', Ga: 'Galates', Ep: 'Éphésiens', Ph: 'Philippiens',
  Col: 'Colossiens', Tt: 'Tite', Phm: 'Philémon', He: 'Hébreux', Jc: 'Jacques',
  Ap: 'Apocalypse',
};

/**
 * Les livres numérotés se disent, ils ne s'épellent pas : « 1Jn » se lit
 * « première lettre de Jean », pas « un Jean ».
 */
const RANGS = ['', 'première', 'deuxième', 'troisième'];
const RANGS_MASCULINS = ['', 'premier', 'deuxième', 'troisième'];

const LIVRES_NUMEROTES = {
  Jn: ['lettre de Jean', 'f'],
  Co: ['lettre aux Corinthiens', 'f'],
  Cor: ['lettre aux Corinthiens', 'f'],
  P: ['lettre de Pierre', 'f'],
  Pi: ['lettre de Pierre', 'f'],
  Th: ['lettre aux Thessaloniciens', 'f'],
  Tm: ['lettre à Timothée', 'f'],
  Ti: ['lettre à Timothée', 'f'],
  S: ['livre de Samuel', 'm'],
  Sm: ['livre de Samuel', 'm'],
  R: ['livre des Rois', 'm'],
  Ch: ['livre des Chroniques', 'm'],
};

/** Les Psaumes n'ont pas de chapitres : « Psaume 23 », pas « chapitre 23 ». */
const SANS_CHAPITRE = new Set(['Ps']);

function nommerLivre(numero, abreviation) {
  if (numero) {
    const entree = LIVRES_NUMEROTES[abreviation];
    if (!entree) return null;
    const [nom, genre] = entree;
    const rang = (genre === 'm' ? RANGS_MASCULINS : RANGS)[Number(numero)] ?? '';
    return `${rang} ${nom}`.trim();
  }
  return LIVRES_LUS[abreviation] ?? null;
}

/** « verset 16 », « versets 8 à 9 » — jamais « 8 tiret 9 ». */
function direVersets(verset, versetFin) {
  return versetFin ? `versets ${verset} à ${versetFin}` : `verset ${verset}`;
}

/**
 * Les noms déjà écrits en toutes lettres. La bulle de verset affiche
 * « Genèse 2:8-9 » et non « Gn 2:8-9 » : sans ce passage, la voix dirait
 * quand même « deux points ».
 */
const NOMS_ENTIERS = Array.from(new Set(Object.values(LIVRES_LUS)))
  .sort((a, b) => b.length - a.length)
  .join('|');

const REFERENCE_ENTIERE = new RegExp(
  `\\b(${NOMS_ENTIERS})\\s+(\\d{1,3})\\s*[:.]\\s*(\\d{1,3})(?:\\s*-\\s*(\\d{1,3}))?`,
  'g'
);

/**
 * Développe toutes les références d'un texte pour qu'une voix les prononce.
 * Le texte du livret n'est pas modifié : seule la copie confiée à la voix
 * l'est.
 *
 * @param {string} texte
 * @returns {string}
 */
export function preparerPourLaVoix(texte) {
  let sortie = texte;

  // « Genèse 2:8-9 » → « Genèse, chapitre 2, versets 8 à 9 »
  sortie = sortie.replace(REFERENCE_ENTIERE, (_, nom, chapitre, verset, versetFin) => {
    const versets = direVersets(verset, versetFin);
    if (nom === 'Psaume') return `${nom} ${chapitre}, ${versets}`;
    return `${nom}, chapitre ${chapitre}, ${versets}`;
  });

  // « 1Jn 4:16 » → « première lettre de Jean, chapitre 4, verset 16 »
  sortie = sortie.replace(
    /\b(?:([123])\s?)?([A-Z][a-zé]{0,3})\s*(\d{1,3})\s*[:.]\s*(\d{1,3})(?:-(\d{1,3}))?/g,
    (correspondance, numero, abreviation, chapitre, verset, versetFin) => {
      const livre = nommerLivre(numero, abreviation);
      if (!livre) return correspondance;
      const versets = direVersets(verset, versetFin);
      if (!numero && SANS_CHAPITRE.has(abreviation)) return `${livre} ${chapitre}, ${versets}`;
      return `${livre}, chapitre ${chapitre}, ${versets}`;
    }
  );

  // Sans verset : « Gn 1 » → « Genèse, chapitre 1 »
  sortie = sortie.replace(
    /\b(?:([123])\s?)?([A-Z][a-zé]{0,3})\s+(\d{1,3})\b(?!\s*[:.]\s*\d)/g,
    (correspondance, numero, abreviation, chapitre) => {
      const livre = nommerLivre(numero, abreviation);
      if (!livre) return correspondance;
      if (!numero && SANS_CHAPITRE.has(abreviation)) return `${livre} ${chapitre}`;
      return `${livre}, chapitre ${chapitre}`;
    }
  );

  return sortie.replace(/\s{2,}/g, ' ').trim();
}
