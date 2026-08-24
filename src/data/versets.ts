import versetsLivret from './versetsLivret.json';

// Textes bibliques déjà présents dans l'application (version Louis Segond,
// domaine public). Le livret, lui, laisse volontairement la place vide :
// « Versets (écrire et méditer) ». Quand le texte n'est pas connu ici,
// l'application propose de le recopier à la main, comme dans le livret.
//
// Ce fichier est la source de référence pour le texte Louis Segond 1910 :
// `src/lib/bibleVersions.ts` s'y réfère pour ne pas dupliquer le texte.

const VERSETS_SELECTIONNES: Record<string, string> = {
  "1 Co 1:18": "Car la prédication de la croix est une folie pour ceux qui périssent; mais pour nous qui sommes sauvés, elle est une puissance de Dieu.",
  "1 Jn 3:1a": "Voyez quel amour le Père nous a témoigné, pour que nous soyons appelés enfants de Dieu !",
  "1 Jn 4:16": "Et nous, nous avons connu l'amour que Dieu a pour nous, et nous y avons cru. Dieu est amour; et celui qui demeure dans l'amour demeure en Dieu, et Dieu demeure en lui.",
  "2 Co 5:17": "Si quelqu'un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées; voici, toutes choses sont devenues nouvelles.",
  "2 Co 5:21": "Celui qui n'a point connu le péché, il l'a fait devenir péché pour nous, afin que nous devenions en lui justice de Dieu.",
  "Ap 1:8": "Je suis l'alpha et l'oméga, dit le Seigneur Dieu, celui qui est, qui était, et qui vient, le Tout-Puissant.",
  "Col 1:13": "Qui nous a délivrés de la puissance des ténèbres et nous a transportés dans le royaume du Fils de son amour.",
  "Ep 2:8": "Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c'est le don de Dieu.",
  "Ep 2:8-9": "Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c'est le don de Dieu. Ce n'est point par les œuvres, afin que personne ne se glorifie.",
  "Ga 2:20": "J'ai été crucifié avec Christ; et si je vis, ce n'est plus moi qui vis, c'est Christ qui vit en moi.",
  "Jn 10:10": "Le voleur ne vient que pour dérober, égorger et détruire; moi, je suis venu afin que les brebis aient la vie, et qu'elles soient dans l'abondance.",
  "Jn 14:6": "Jésus lui dit : Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi.",
  "Jn 15:10": "Si vous gardez mes commandements, vous demeurerez dans mon amour, de même que j'ai gardé les commandements de mon Père, et que je demeure dans son amour.",
  "Jn 15:7": "Si vous demeurez en moi, et que mes paroles demeurent en vous, demandez ce que vous voudrez, et cela vous sera accordé.",
  "Jn 1:1-3": "Au commencement était la Parole, et la Parole était avec Dieu, et la Parole était Dieu. Elle était au commencement avec Dieu. Toutes choses ont été faites par elle, et rien de ce qui a été fait n'a été fait sans elle.",
  "Jn 3:16": "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.",
  "Jn 3:36": "Celui qui croit au Fils a la vie éternelle; celui qui ne croit pas au Fils ne verra point la vie, mais la colère de Dieu demeure sur lui.",
  "Pr 3:5-6": "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse; reconnais-le dans toutes tes voies, et il aplanira tes sentiers.",
  "Ps 16:2": "Je dis à l'Éternel : Tu es mon Seigneur, Tu es mon souverain bien !",
  "Ps 23:1": "L'Éternel est mon berger : je ne manquerai de rien.",
  "Ps 46:11": "Arrêtez, et sachez que je suis Dieu : Je domine sur les nations, je domine sur la terre.",
  "Rm 10:9-10": "Si tu confesses de ta bouche le Seigneur Jésus, et si tu crois dans ton cœur que Dieu l'a ressuscité des morts, tu seras sauvé. Car c'est en croyant du cœur qu'on parvient à la justice, et c'est en confessant de la bouche qu'on parvient au salut.",
  "Rm 12:2": "Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l'intelligence, afin que vous discerniez quelle est la volonté de Dieu, ce qui est bon, agréable et parfait.",
  "Rm 3:23": "Car tous ont péché et sont privés de la gloire de Dieu.",
  "Rm 5:12": "C'est pourquoi, comme par un seul homme le péché est entré dans le monde, et par le péché la mort, et qu'ainsi la mort s'est étendue sur tous les hommes, parce que tous ont péché...",
  "Rm 5:8": "Mais Dieu prouve son amour envers nous, en ce que, lorsque nous étions encore des pécheurs, Christ est mort pour nous.",
  "Rm 6:23": "Car le salaire du péché, c'est la mort; mais le don gratuit de Dieu, c'est la vie éternelle en Jésus-Christ notre Seigneur.",
  "Rm 8:1": "Il n'y a donc maintenant aucune condamnation pour ceux qui sont en Jésus-Christ.",
};

/**
 * Source unique utilisée par les fiches, l'immersion et la mémorisation.
 * Le corpus généré couvre les 53 références du livret ; la sélection historique
 * conserve les versets supplémentaires proposés ailleurs dans l'application.
 */
export const VERSETS_CONNUS: Record<string, string> = {
  ...VERSETS_SELECTIONNES,
  ...(versetsLivret as Record<string, string>),
};

/** Normalise « 1 Jn 4 :16 » → « 1 Jn 4:16 » pour la recherche. */
export function normaliserReference(reference: string): string {
  return reference.replace(/\s*:\s*/g, ':').replace(/\s+/g, ' ').trim();
}

const PAR_CLE = new Map(
  Object.entries(VERSETS_CONNUS).map(([ref, texte]) => [normaliserReference(ref), texte])
);

/** Le texte du verset s'il est connu, sinon null (à recopier). */
export function texteDuVerset(reference: string): string | null {
  return PAR_CLE.get(normaliserReference(reference)) ?? null;
}
