'use client';

/**
 * Moteur de comparaison des versions bibliques et streaming audio réel (LSG & Semeur).
 * Remplace la synthèse vocale robotique du navigateur par de vrais enregistrements bibliques.
 */

import { VERSETS_CONNUS } from '@/data/versets';

export interface VersionBiblique {
  code: 'lsg' | 'bds' | 's21' | 'nfc';
  nom: string;
  nomCourt: string;
  description: string;
  annee: string;
  type: 'Litterale' | 'Dynamique' | 'Moderne' | 'Courante';
}

export const VERSIONS_BIBLIQUES: VersionBiblique[] = [
  {
    code: 'lsg',
    nom: 'Louis Segond 1910',
    nomCourt: 'LSG',
    description: 'Traduction historique de référence, fidèle aux textes originaux et annotée Strong.',
    annee: '1910',
    type: 'Litterale',
  },
  {
    code: 'bds',
    nom: 'La Bible du Semeur',
    nomCourt: 'BDS / Semeur',
    description: 'Équivalence dynamique : clarté, profondeur et fluidité en français contemporain.',
    annee: '2015',
    type: 'Dynamique',
  },
  {
    code: 's21',
    nom: 'Segond 21',
    nomCourt: 'S21',
    description: '« L’original avec les mots d’aujourd’hui » — rigueur et modernité.',
    annee: '2007',
    type: 'Moderne',
  },
  {
    code: 'nfc',
    nom: 'Nouvelle Français Courant',
    nomCourt: 'NFC',
    description: 'Langage accessible et direct, idéal pour la méditation et la découverte.',
    annee: '2019',
    type: 'Courante',
  },
];

export interface ComparaisonVerset {
  reference: string;
  lsg: string;
  bds: string;
  s21?: string;
  nfc?: string;
  audioLsg?: string;
  audioBds?: string;
}

/**
 * Corpus comparatif pour les versets clés du livret des Fondements.
 */
export const VERSETS_MULTI_VERSIONS: Record<string, ComparaisonVerset> = {
  '1 Co 1:18': {
    reference: '1 Corinthiens 1:18',
    lsg: 'Car la prédication de la croix est une folie pour ceux qui périssent; mais pour nous qui sommes sauvés, elle est une puissance de Dieu.',
    bds: 'En effet, la prédication de la mort du Christ sur la croix est une folie pour ceux qui vont à leur perte. Mais pour nous qui sommes sur la voie du salut, elle est la puissance même de Dieu.',
    s21: 'En effet, le message de la croix est une folie pour ceux qui périssent, mais pour nous qui sommes sauvés, il est la puissance de Dieu.',
    nfc: 'En effet, le message de la mort du Christ sur la croix est une folie pour ceux qui se perdent ; mais pour nous qui sommes sauvés, il est la puissance de Dieu.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/46/1.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/46/1.mp3',
  },
  '1 Jn 3:1a': {
    reference: '1 Jean 3:1',
    lsg: 'Voyez quel amour le Père nous a témoigné, pour que nous soyons appelés enfants de Dieu ! Et nous le sommes.',
    bds: 'Voyez combien le Père nous a aimés ! Il a voulu que nous soyons appelés enfants de Dieu — et nous le sommes réellement !',
    s21: 'Voyez quel amour le Père nous a témoigné pour que nous soyons appelés enfants de Dieu ! Et nous le sommes.',
    nfc: 'Voyez à quel point le Père nous a aimés ! Il a voulu que nous soyons appelés enfants de Dieu, et nous le sommes !',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/62/3.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/62/3.mp3',
  },
  '1 Jn 4:16': {
    reference: '1 Jean 4:16',
    lsg: 'Et nous, nous avons connu l\'amour que Dieu a pour nous, et nous y avons cru. Dieu est amour; et celui qui demeure dans l\'amour demeure en Dieu, et Dieu demeure en lui.',
    bds: 'Et nous, nous avons connu l\'amour que Dieu a pour nous et nous y avons cru. Dieu est amour : celui qui demeure dans l\'amour demeure en Dieu, et Dieu demeure en lui.',
    s21: 'Et nous, nous avons connu l\'amour que Dieu a pour nous et nous y avons cru. Dieu est amour; celui qui demeure dans l\'amour demeure en Dieu et Dieu demeure en lui.',
    nfc: 'Et nous, nous savons que Dieu nous aime et nous avons confiance en son amour. Dieu est amour ; celui qui demeure dans l\'amour demeure en Dieu, et Dieu demeure en lui.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/62/4.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/62/4.mp3',
  },
  '2 Co 5:17': {
    reference: '2 Corinthiens 5:17',
    lsg: 'Si quelqu\'un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées; voici, toutes choses sont devenues nouvelles.',
    bds: 'Ainsi, si quelqu\'un est uni au Christ, il est une nouvelle créature : les choses anciennes sont passées, voici que toutes choses sont devenues nouvelles.',
    s21: 'Si quelqu\'un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées; voici, toutes choses sont devenues nouvelles.',
    nfc: 'Si quelqu\'un est uni au Christ, il est une créature nouvelle : le monde ancien a disparu, un monde nouveau est déjà né.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/47/5.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/47/5.mp3',
  },
  '2 Co 5:21': {
    reference: '2 Corinthiens 5:21',
    lsg: 'Celui qui n\'a point connu le péché, il l\'a fait devenir péché pour nous, afin que nous devenions en lui justice de Dieu.',
    bds: 'Celui qui était innocent de tout péché, Dieu l\'a chargé de notre péché, pour que, par lui, nous soyons déclarés justes devant Dieu.',
    s21: 'Celui qui n\'a pas connu le péché, il l\'a fait devenir péché pour nous afin que par lui nous devenions justice de Dieu.',
    nfc: 'Le Christ n\'avait pas commis de péché, mais Dieu l\'a chargé de notre péché, pour qu\'en lui nous soyons rendus justes devant Dieu.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/47/5.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/47/5.mp3',
  },
  'Ap 1:8': {
    reference: 'Apocalypse 1:8',
    lsg: 'Je suis l\'alpha et l\'oméga, dit le Seigneur Dieu, celui qui est, qui était, et qui vient, le Tout-Puissant.',
    bds: '« Moi, je suis l\'Alpha et l\'Oméga », dit le Seigneur Dieu, celui qui est, qui était et qui vient, le Tout-Puissant.',
    s21: '« Je suis l\'Alpha et l\'Oméga, dit le Seigneur Dieu, celui qui est, qui était et qui vient, le Tout-Puissant. »',
    nfc: '« Je suis l\'Alpha et l\'Oméga », dit le Seigneur Dieu, celui qui est, qui était et qui vient, le Tout-Puissant.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/66/1.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/66/1.mp3',
  },
  'Col 1:13': {
    reference: 'Colossiens 1:13',
    lsg: 'Qui nous a délivrés de la puissance des ténèbres et nous a transportés dans le royaume du Fils de son amour.',
    bds: 'Il nous a arrachés au pouvoir des ténèbres et nous a fait passer dans le royaume de son Fils bien-aimé.',
    s21: 'Il nous a délivrés de la puissance des ténèbres et nous a transportés dans le royaume de son Fils bien-aimé.',
    nfc: 'Il nous a arrachés au pouvoir des ténèbres et nous a transférés dans le royaume de son Fils bien-aimé.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/51/1.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/51/1.mp3',
  },
  'Ep 2:8-9': {
    reference: 'Éphésiens 2:8-9',
    lsg: 'Car c\'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c\'est le don de Dieu. Ce n\'est point par les œuvres, afin que personne ne se glorifie.',
    bds: 'Car c\'est par la grâce que vous êtes sauvés, par le moyen de la foi. Cela ne vient pas de vous, c\'est le don de Dieu. Ce n\'est pas le fruit de vos efforts, afin que personne ne puisse se vanter.',
    s21: 'En effet, c\'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c\'est le don de Dieu. Ce n\'est pas par les œuvres, afin que personne ne puisse se vanter.',
    nfc: 'Car c\'est par la grâce que vous êtes sauvés, par le moyen de la foi. Ce salut ne vient pas de vous, il est le don de Dieu. Il n\'est pas le résultat de vos efforts, et ainsi personne ne peut se vanter.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/49/2.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/49/2.mp3',
  },
  'Ep 2:8': {
    reference: 'Éphésiens 2:8',
    lsg: 'Car c\'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c\'est le don de Dieu.',
    bds: 'Car c\'est par la grâce que vous êtes sauvés, par le moyen de la foi. Cela ne vient pas de vous, c\'est le don de Dieu.',
    s21: 'En effet, c\'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c\'est le don de Dieu.',
    nfc: 'Car c\'est par la grâce que vous êtes sauvés, par le moyen de la foi. Ce salut ne vient pas de vous, il est le don de Dieu.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/49/2.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/49/2.mp3',
  },
  'Ga 2:20': {
    reference: 'Galates 2:20',
    lsg: 'J\'ai été crucifié avec Christ; et si je vis, ce n\'est plus moi qui vis, c\'est Christ qui vit en moi; si je vis maintenant dans la chair, je vis dans la foi au Fils de Dieu, qui m\'a aimé et qui s\'est livré lui-même pour moi.',
    bds: 'J\'ai été crucifié avec le Christ. Ce n\'est plus moi qui vis, c\'est le Christ qui vit en moi. Ma vie présente dans ce corps, je la vis dans la foi au Fils de Dieu qui m\'a aimé et s\'est livré lui-même pour moi.',
    s21: 'J\'ai été crucifié avec Christ; ce n\'est plus moi qui vis, c\'est Christ qui vit en moi. Si je vis maintenant dans un corps humain, je vis dans la foi au Fils de Dieu qui m\'a aimé et qui s\'est donné lui-même pour moi.',
    nfc: 'J\'ai été crucifié avec le Christ ; ce n\'est plus moi qui vis, c\'est le Christ qui vit en moi. Ma vie présente dans ce corps, je la vis dans la foi au Fils de Dieu, qui m\'a aimé et s\'est livré lui-même pour moi.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/48/2.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/48/2.mp3',
  },
  'Jn 10:10': {
    reference: 'Jean 10:10',
    lsg: 'Le voleur ne vient que pour dérober, égorger et détruire; moi, je suis venu afin que les brebis aient la vie, et qu\'elles soient dans l\'abondance.',
    bds: 'Le voleur ne vient que pour voler, égorger et détruire. Moi, je suis venu pour que les brebis aient la vie, et qu\'elles l\'aient en abondance.',
    s21: 'Le voleur ne vient que pour voler, égorger et détruire; moi, je suis venu afin que les brebis aient la vie et qu\'elles l\'aient en abondance.',
    nfc: 'Le voleur ne vient que pour voler, égorger et détruire. Moi, je suis venu pour que les humains aient la vie et qu\'ils l\'aient en abondance.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/43/10.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/43/10.mp3',
  },
  'Jn 14:6': {
    reference: 'Jean 14:6',
    lsg: 'Jésus lui dit : Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi.',
    bds: 'Jésus lui répondit : — Moi, je suis le chemin, la vérité et la vie. Personne ne va au Père sans passer par moi.',
    s21: 'Jésus lui dit : « C\'est moi qui suis le chemin, la vérité et la vie. On ne vient au Père qu\'en passant par moi. »',
    nfc: 'Jésus lui répond : « Je suis le chemin, la vérité et la vie. Personne ne va au Père sans passer par moi. »',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/43/14.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/43/14.mp3',
  },
  'Jn 15:7': {
    reference: 'Jean 15:7',
    lsg: 'Si vous demeurez en moi, et que mes paroles demeurent en vous, demandez ce que vous voudrez, et cela vous sera accordé.',
    bds: 'Si vous demeurez en moi, et que mes paroles demeurent en vous, demandez ce que vous voudrez et vous l\'obtiendrez.',
    s21: 'Si vous demeurez en moi et que mes paroles demeurent en vous, vous demanderez ce que vous voudrez et cela vous sera accordé.',
    nfc: 'Si vous demeurez unis à moi et que mes paroles demeurent en vous, demandez ce que vous voulez et vous l\'aurez.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/43/15.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/43/15.mp3',
  },
  'Jn 15:10': {
    reference: 'Jean 15:10',
    lsg: 'Si vous gardez mes commandements, vous demeurerez dans mon amour, de même que j\'ai gardé les commandements de mon Père, et que je demeure dans son amour.',
    bds: 'Si vous obéissez à mes commandements, vous demeurerez dans mon amour, tout comme moi-même j\'ai obéi aux commandements de mon Père et je demeure dans son amour.',
    s21: 'Si vous gardez mes commandements, vous demeurerez dans mon amour, de même que j\'ai gardé les commandements de mon Père et que je demeure dans son amour.',
    nfc: 'Si vous obéissez à mes commandements, vous demeurerez dans mon amour, tout comme j\'ai obéi aux commandements de mon Père et que je demeure dans son amour.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/43/15.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/43/15.mp3',
  },
  'Jn 1:1-3': {
    reference: 'Jean 1:1-3',
    lsg: 'Au commencement était la Parole, et la Parole était avec Dieu, et la Parole était Dieu. Elle était au commencement avec Dieu. Toutes choses ont été faites par elle, et rien de ce qui a été fait n\'a été fait sans elle.',
    bds: 'Au commencement était celui qui est la Parole de Dieu. Il était avec Dieu, il était lui-même Dieu. Au commencement, il était avec Dieu. Tout a été créé par lui ; rien de ce qui a été créé n\'a été créé sans lui.',
    s21: 'Au commencement était la Parole, et la Parole était avec Dieu, et la Parole était Dieu. Elle était au commencement avec Dieu. Tout a été fait par elle et rien de ce qui a été fait n\'a été fait sans elle.',
    nfc: 'Au commencement était la Parole, la Parole était avec Dieu et la Parole était Dieu. Elle était au commencement avec Dieu. Dieu a tout fait par elle ; rien n\'a été fait sans elle.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/43/1.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/43/1.mp3',
  },
  'Jn 3:16': {
    reference: 'Jean 3:16',
    lsg: 'Car Dieu a tant aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu\'il ait la vie éternelle.',
    bds: 'Oui, Dieu a tant aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse pas, mais qu\'il ait la vie éternelle.',
    s21: 'En effet, Dieu a tant aimé le monde qu\'il a donné son Fils unique afin que quiconque croit en lui ne périsse pas, mais ait la vie éternelle.',
    nfc: 'Car Dieu a tellement aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne soit pas perdu mais qu\'il ait la vie éternelle.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/43/3.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/43/3.mp3',
  },
  'Jn 3:36': {
    reference: 'Jean 3:36',
    lsg: 'Celui qui croit au Fils a la vie éternelle; celui qui ne croit pas au Fils ne verra point la vie, mais la colère de Dieu demeure sur lui.',
    bds: 'Celui qui place sa foi dans le Fils a la vie éternelle ; celui qui refuse de croire au Fils ne verra pas la vie, mais la colère de Dieu reste posée sur lui.',
    s21: 'Celui qui croit au Fils a la vie éternelle; celui qui ne croit pas au Fils ne verra pas la vie, mais la colère de Dieu reste au contraire sur lui.',
    nfc: 'Celui qui croit au Fils a la vie éternelle ; celui qui refuse de croire au Fils n\'aura pas la vie, mais la colère de Dieu reste sur lui.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/43/3.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/43/3.mp3',
  },
  'Pr 3:5-6': {
    reference: 'Proverbes 3:5-6',
    lsg: 'Confie-toi en l\'Éternel de tout ton cœur, et ne t\'appuie pas sur ta sagesse; reconnais-le dans toutes tes voies, et il aplanira tes sentiers.',
    bds: 'Mets ta confiance en l\'Éternel de tout ton cœur, et ne te repose pas sur ta propre intelligence. Cherche à connaître sa volonté dans tout ce que tu entreprends, et il aplanira tes sentiers.',
    s21: 'Confie-toi en l\'Éternel de tout ton cœur et ne t\'appuie pas sur ton intelligence! Reconnais-le dans toutes tes voies et il rendra tes sentiers droits.',
    nfc: 'Mets ta confiance dans le Seigneur de tout ton cœur, ne compte pas sur ta propre intelligence. Dans toutes tes démarches reconnais-le comme guide, et il aplanira tes chemins.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/20/3.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/20/3.mp3',
  },
  'Ps 16:2': {
    reference: 'Psaume 16:2',
    lsg: 'Je dis à l\'Éternel : Tu es mon Seigneur, Tu es mon souverain bien !',
    bds: 'Je dis à l\'Éternel : « Tu es mon Seigneur, mon bonheur est en toi seul ! »',
    s21: 'Je dis à l\'Éternel : « Tu es mon Seigneur, tu es mon souverain bien ! »',
    nfc: 'Je dis au Seigneur : « C\'est toi mon Maître, je n\'ai pas de plus grand bien que toi. »',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/19/16.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/19/16.mp3',
  },
  'Ps 23:1': {
    reference: 'Psaume 23:1',
    lsg: 'L\'Éternel est mon berger : je ne manquerai de rien.',
    bds: 'L\'Éternel est mon berger : je ne manquerai de rien.',
    s21: 'L\'Éternel est mon berger : je ne manquerai de rien.',
    nfc: 'Le Seigneur est mon berger, je ne manquerai de rien.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/19/23.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/19/23.mp3',
  },
  'Ps 46:11': {
    reference: 'Psaume 46:11',
    lsg: 'Arrêtez, et sachez que je suis Dieu : Je domine sur les nations, je domine sur la terre.',
    bds: '« Arrêtez, et reconnaissez que je suis Dieu ! Je domine sur les nations, je domine sur la terre. »',
    s21: '« Arrêtez, et sachez que je suis Dieu! Je domine sur les nations, je domine sur la terre. »',
    nfc: '« Arrêtez-vous, dit-il, reconnaissez que je suis Dieu. Je domine les nations, je domine la terre. »',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/19/46.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/19/46.mp3',
  },
  'Rm 3:23': {
    reference: 'Romains 3:23',
    lsg: 'Car tous ont péché et sont privés de la gloire de Dieu.',
    bds: 'Tous ont péché, en effet, et sont privés de la glorieuse présence de Dieu.',
    s21: 'Tous ont péché et sont privés de la gloire de Dieu.',
    nfc: 'Tous ont péché et sont privés de la gloire de Dieu.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/45/3.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/45/3.mp3',
  },
  'Rm 5:8': {
    reference: 'Romains 5:8',
    lsg: 'Mais Dieu prouve son amour envers nous, en ce que, lorsque nous étions encore des pécheurs, Christ est mort pour nous.',
    bds: 'Mais voici comment Dieu nous montre son amour pour nous : alors que nous étions encore des pécheurs, le Christ est mort pour nous.',
    s21: 'Mais voici comment Dieu prouve son amour envers nous : alors que nous étions encore des pécheurs, Christ est mort pour nous.',
    nfc: 'Mais voici comment Dieu prouve son amour pour nous : le Christ est mort pour nous alors que nous étions encore pécheurs.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/45/5.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/45/5.mp3',
  },
  'Rm 5:12': {
    reference: 'Romains 5:12',
    lsg: 'C\'est pourquoi, comme par un seul homme le péché est entré dans le monde, et par le péché la mort, et qu\'ainsi la mort s\'est étendue sur tous les hommes, parce que tous ont péché...',
    bds: 'C\'est pourquoi, de même que par un seul homme le péché est entré dans le monde, et par le péché la mort, de même la mort a atteint tous les hommes parce que tous ont péché...',
    s21: 'C\'est pourquoi, de même que par un seul homme le péché est entré dans le monde et par le péché la mort, de même la mort a atteint tous les hommes parce que tous ont péché.',
    nfc: 'C\'est par un seul être humain que le péché est entré dans le monde, et par le péché la mort ; ainsi la mort a atteint tous les humains parce que tous ont péché.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/45/5.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/45/5.mp3',
  },
  'Rm 6:23': {
    reference: 'Romains 6:23',
    lsg: 'Car le salaire du péché, c\'est la mort; mais le don gratuit de Dieu, c\'est la vie éternelle en Jésus-Christ notre Seigneur.',
    bds: 'Car le salaire que paie le péché, c\'est la mort ; mais le don gratuit que Dieu accorde, c\'est la vie éternelle dans l\'union avec Jésus-Christ notre Seigneur.',
    s21: 'En effet, le salaire du péché, c\'est la mort, mais le don gratuit de Dieu, c\'est la vie éternelle en Jésus-Christ notre Seigneur.',
    nfc: 'Car le salaire du péché, c\'est la mort ; mais le don gratuit de Dieu, c\'est la vie éternelle en union avec Jésus Christ, notre Seigneur.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/45/6.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/45/6.mp3',
  },
  'Rm 8:1': {
    reference: 'Romains 8:1',
    lsg: 'Il n\'y a donc maintenant aucune condamnation pour ceux qui sont en Jésus-Christ.',
    bds: 'Maintenant donc, il n\'y a plus de condamnation pour ceux qui sont unis à Jésus-Christ.',
    s21: 'Il n\'y a donc maintenant aucune condamnation pour ceux qui sont en Jésus-Christ.',
    nfc: 'Maintenant donc, il n\'y a plus aucune condamnation pour ceux qui sont unis à Jésus Christ.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/45/8.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/45/8.mp3',
  },
  'Rm 10:9-10': {
    reference: 'Romains 10:9-10',
    lsg: 'Si tu confesses de ta bouche le Seigneur Jésus, et si tu crois dans ton cœur que Dieu l\'a ressuscité des morts, tu seras sauvé. Car c\'est en croyant du cœur qu\'on parvient à la justice, et c\'est en confessant de la bouche qu\'on parvient au salut.',
    bds: 'En effet, si de ta bouche tu affirmes devant tous que Jésus est Seigneur et si dans ton cœur tu crois que Dieu l\'a ressuscité des morts, tu seras sauvé. Car c\'est avec le cœur qu\'on croit et qu\'on parvient à la justice, et c\'est avec la bouche qu\'on affirme sa foi et qu\'on parvient au salut.',
    s21: 'Si tu confesses de ta bouche le Seigneur Jésus et si tu crois dans ton cœur que Dieu l\'a ressuscité des morts, tu seras sauvé. En effet, c\'est avec le cœur que l\'on croit et parvient à la justice, et c\'est avec la bouche que l\'on confesse sa foi et parvient au salut.',
    nfc: 'Si de ta bouche tu confesses que Jésus est Seigneur et si dans ton cœur tu crois que Dieu l\'a ressuscité des morts, tu seras sauvé. Car c\'est par le cœur que l\'on croit et que l\'on obtient la justice ; et c\'est par la bouche qu\'on affirme sa foi et qu\'on parvient au salut.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/45/10.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/45/10.mp3',
  },
  'Rm 12:2': {
    reference: 'Romains 12:2',
    lsg: 'Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l\'intelligence, afin que vous discerniez quelle est la volonté de Dieu, ce qui est bon, agréable et parfait.',
    bds: 'Ne vous coulez pas simplement dans le moule de tout le monde. Laissez-vous plutôt entièrement transformer par le renouvellement de votre façon de penser afin de discerner quelle est la volonté de Dieu : ce qui est bon, ce qui lui plaît, ce qui est parfait.',
    s21: 'Ne vous conformez pas au monde actuel, mais soyez transformés par le renouvellement de l\'intelligence afin de discerner quelle est la volonté de Dieu: ce qui est bon, agréable et parfait.',
    nfc: 'Ne vous conformez pas aux critères du monde actuel, mais laissez-vous transformer par le renouvellement de votre pensée, afin de discerner quelle est la volonté de Dieu, ce qui est bon, ce qui lui plaît, ce qui est parfait.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/45/12.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/45/12.mp3',
  },
  'Ps 90': {
    reference: 'Psaume 90',
    lsg: 'Prière de Moïse, homme de Dieu. Seigneur ! tu as été pour nous un refuge, de génération en génération. Avant que les montagnes fussent nées, et que tu eusses créé la terre et le monde, d\'éternité en éternité tu es Dieu.',
    bds: 'Prière de Moïse, homme de Dieu. Seigneur, d\'âge en âge, tu as été notre refuge. Avant que soient nées les montagnes, et que tu aies créé la terre et l\'univers, depuis toujours et pour toujours, tu es Dieu.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/19/90.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/19/90.mp3',
  },
  'Es 6:1': {
    reference: 'Ésaïe 6:1',
    lsg: 'L\'année de la mort du roi Ozias, je vis le Seigneur assis sur un trône très élevé, et les pans de sa robe remplissaient le temple.',
    bds: 'L\'année de la mort du roi Ozias, je vis le Seigneur siégeant sur un trône très élevé. Les pans de sa robe remplissaient le temple.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/23/6.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/23/6.mp3',
  },
  'Ps 93': {
    reference: 'Psaume 93',
    lsg: 'L\'Éternel règne, il est revêtu de majesté, l\'Éternel est revêtu, il est ceint de force. Aussi le monde est ferme, il ne chancelle pas.',
    bds: 'L\'Éternel est roi, il est revêtu de majesté ; l\'Éternel est revêtu, il est armé de puissance. Aussi le monde est ferme, il ne vacille pas.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/19/93.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/19/93.mp3',
  },
  'Jn 17:3': {
    reference: 'Jean 17:3',
    lsg: 'Or, la vie éternelle, c\'est qu\'ils te connaissent, toi, le seul vrai Dieu, et celui que tu as envoyé, Jésus-Christ.',
    bds: 'Or, la vie éternelle consiste à te connaître, toi le seul vrai Dieu, et à connaître celui que tu as envoyé, Jésus-Christ.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/43/17.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/43/17.mp3',
  },
  'Ep 1:17': {
    reference: 'Éphésiens 1:17',
    lsg: 'afin que le Dieu de notre Seigneur Jésus-Christ, le Père de gloire, vous donne un esprit de sagesse et de révélation, dans sa connaissance,',
    bds: 'Je demande au Dieu de notre Seigneur Jésus-Christ, au Père glorieux, de vous donner un esprit de sagesse qui vous le révèle et vous le fasse vraiment connaître.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/49/1.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/49/1.mp3',
  },
  'Gn 1': {
    reference: 'Genèse 1',
    lsg: 'Au commencement, Dieu créa les cieux et la terre. La terre était informe et vide; il y avait des ténèbres à la surface de l\'abîme, et l\'esprit de Dieu se mouvait au-dessus des eaux.',
    bds: 'Au commencement, Dieu créa le ciel et la terre. La terre était chaotique et vide. Il y avait des ténèbres au-dessus de l\'abîme, et l\'Esprit de Dieu planait au-dessus des eaux.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/1/1.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/1/1.mp3',
  },
  'Es 53:4-5': {
    reference: 'Ésaïe 53:4-5',
    lsg: 'Cependant, ce sont nos souffrances qu\'il a portées, c\'est de nos douleurs qu\'il s\'est chargé; et nous l\'avons considéré comme puni, frappé de Dieu, et humilié. Mais il était blessé pour nos péchés, brisé pour nos iniquités; le châtiment qui nous donne la paix est tombé sur lui, et c\'est par ses meurtrissures que nous sommes guéris.',
    bds: 'Pourtant, ce sont nos souffrances qu\'il a portées, c\'est de nos douleurs qu\'il s\'est chargé. Et nous, nous pensions que Dieu l\'avait frappé, puni et humilié. Mais il était blessé pour nos péchés, brisé pour nos fautes. La punition qui nous donne la paix est tombée sur lui, et c\'est par ses meurtrissures que nous sommes guéris.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/23/53.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/23/53.mp3',
  },
  'Ph 2:6-11': {
    reference: 'Philippiens 2:6-11',
    lsg: 'lequel, existant en forme de Dieu, n\'a point regardé comme une proie à arracher d\'être égal avec Dieu, mais s\'est dépouillé lui-même, en prenant une forme de serviteur... C\'est pourquoi aussi Dieu l\'a souverainement élevé, et lui a donné le nom qui est au-dessus de tout nom,',
    bds: 'Lui qui, dès l\'origine, était de condition divine, il n\'a pas cherché à profiter de l\'égalité avec Dieu, mais il s\'est dépouillé lui-même : il a pris la condition de serviteur et est devenu semblable aux êtres humains... C\'est pourquoi Dieu l\'a souverainement élevé et lui a donné le nom qui est au-dessus de tout nom.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/50/2.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/50/2.mp3',
  },
  'He 11:1': {
    reference: 'Hébreux 11:1',
    lsg: 'Or la foi est une ferme assurance des choses qu\'on espère, une démonstration de celles qu\'on ne voit pas.',
    bds: 'La foi est une façon de posséder déjà ce qu\'on espère, un moyen d\'être sûr des réalités qu\'on ne voit pas.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/58/11.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/58/11.mp3',
  },
  'He 11:6': {
    reference: 'Hébreux 11:6',
    lsg: 'Or sans la foi il est impossible de lui être agréable; car il faut que celui qui s\'approche de Dieu croie que Dieu existe, et qu\'il est le rémunérateur de ceux qui le cherchent.',
    bds: 'Or, sans la foi, il est impossible de lui être agréable. Car celui qui s\'approche de Dieu doit croire que Dieu existe et qu\'il récompense ceux qui le cherchent.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/58/11.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/58/11.mp3',
  },
  '1 Jn 1:9': {
    reference: '1 Jean 1:9',
    lsg: 'Si nous confessons nos péchés, il est fidèle et juste pour nous les pardonner, et pour nous purifier de toute iniquité.',
    bds: 'Si nous confessons nos péchés, il est fidèle et juste pour nous les pardonner et pour nous purifier de tout mal.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/62/1.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/62/1.mp3',
  },
  'Ga 5:22-23': {
    reference: 'Galates 5:22-23',
    lsg: 'Mais le fruit de l\'Esprit, c\'est l\'amour, la joie, la paix, la patience, la bonté, la bénignité, la fidélité, la douceur, la tempérance; la loi n\'est pas contre ces choses.',
    bds: 'Mais le fruit de l\'Esprit, c\'est l\'amour, la joie, la paix, la patience, la bonté, la bienveillance, la fidélité, la douceur, la maîtrise de soi. La Loi ne s\'oppose pas à de telles choses.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/48/5.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/48/5.mp3',
  },
  'Ac 1:8': {
    reference: 'Actes 1:8',
    lsg: 'Mais vous recevrez une puissance, le Saint-Esprit survenant sur vous, et vous serez mes témoins à Jérusalem, dans toute la Judée, dans la Samarie, et jusqu\'aux extrémités de la terre.',
    bds: 'Mais le Saint-Esprit descendra sur vous : vous recevrez sa puissance et vous serez mes témoins à Jérusalem, dans toute la Judée et la Samarie, et jusqu\'au bout du monde.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/44/1.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/44/1.mp3',
  },
  'Ac 2:38': {
    reference: 'Actes 2:38',
    lsg: 'Pierre leur dit : Repentez-vous, et que chacun de vous soit baptisé au nom de Jésus-Christ, pour le pardon de vos péchés; et vous recevrez le don du Saint-Esprit.',
    bds: 'Pierre leur répondit : — Changez, et que chacun de vous se fasse baptiser au nom de Jésus-Christ pour obtenir le pardon de ses péchés ; et vous recevrez le don du Saint-Esprit.',
    audioLsg: 'https://www.wordproaudio.net/bibles/app/audio/7/44/2.mp3',
    audioBds: 'https://www.wordproaudio.net/bibles/app/audio/7/44/2.mp3',
  },
};

/**
 * Normalise les références et alias (ex: « Psaumes 90 » → « Ps 90 »)
 */
export function normaliserRef(ref: string): string {
  let r = ref.replace(/\s*:\s*/g, ':').replace(/\s+/g, ' ').trim();
  // Alias de livres courants
  r = r.replace(/^Psaumes?\s+/i, 'Ps ')
       .replace(/^Ésaïe\s+/i, 'Es ')
       .replace(/^Esaie\s+/i, 'Es ')
       .replace(/^Jean\s+/i, 'Jn ')
       .replace(/^Romains?\s+/i, 'Rm ')
       .replace(/^Éphésiens?\s+/i, 'Ep ')
       .replace(/^Ephesiens?\s+/i, 'Ep ')
       .replace(/^Galates?\s+/i, 'Ga ')
       .replace(/^Philippiens?\s+/i, 'Ph ')
       .replace(/^Colossiens?\s+/i, 'Col ')
       .replace(/^Hébreux\s+/i, 'He ')
       .replace(/^Hebreux\s+/i, 'He ')
       .replace(/^Actes?\s+/i, 'Ac ')
       .replace(/^1\s*Corinthiens?\s+/i, '1 Co ')
       .replace(/^2\s*Corinthiens?\s+/i, '2 Co ')
       .replace(/^1\s*Jean\s+/i, '1 Jn ')
       .replace(/^2\s*Jean\s+/i, '2 Jn ')
       .replace(/^3\s*Jean\s+/i, '3 Jn ')
       .replace(/^1\s*Pierre\s+/i, '1 P ')
       .replace(/^2\s*Pierre\s+/i, '2 P ')
       .replace(/^1\s*Timothée\s+/i, '1 Tm ')
       .replace(/^2\s*Timothée\s+/i, '2 Tm ')
       .replace(/^Apocalypse\s+/i, 'Ap ')
       .replace(/^Genèse\s+/i, 'Gn ')
       .replace(/^Genese\s+/i, 'Gn ')
       .replace(/^Proverbes?\s+/i, 'Pr ');
  return r;
}

/**
 * Retrouve la comparaison multi-versions pour un verset donné.
 */
export function getComparaisonVerset(reference: string): ComparaisonVerset | null {
  if (!reference) return null;
  const norm = normaliserRef(reference);
  const entree = VERSETS_MULTI_VERSIONS[norm] || VERSETS_MULTI_VERSIONS[reference];
  if (!entree) return null;
  return { ...entree, lsg: VERSETS_CONNUS[norm] ?? entree.lsg };
}

/**
 * Résout le lien audio réel (studio narrateur) pour un chapitre biblique
 */
export function getAudioChapitre(
  livreNumero: number,
  nomLivre?: string,
  chapitre: number = 1,
  version: 'lsg' | 'semeur' | 'bds' | string = 'semeur'
): string {
  // Le catalogue distant utilisé ici est celui de la Bible du Semeur. Pour
  // la Segond, mieux vaut une synthèse fidèle au texte affiché qu'un audio
  // fluide mais provenant silencieusement d'une autre traduction.
  if (version === 'lsg') return '';
  void nomLivre;
  const num = Number(livreNumero) > 0 ? Number(livreNumero) : 1;
  const chap = Number(chapitre) > 0 ? Number(chapitre) : 1;
  return `https://www.wordproaudio.net/bibles/app/audio/7/${num}/${chap}.mp3`;
}

// ─────────────────────────────────────────────────────────────
// Chargement dynamique des traductions réelles (BDS, Darby, PDV, NBS)
// ─────────────────────────────────────────────────────────────

const CACHE_VERSIONS: Record<string, string> = {};

function nettoyerTexteHtml(brut: string): string {
  return brut
    .replace(/<sup\b[^>]*>.*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[¶\u00b6]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Charge la véritable traduction d'un verset depuis l'API publique (BDS, Darby, PDV, NBS)
 * avec mise en cache mémoire instantanée.
 */
export async function chargerTraductionEnLigne(
  codeVersion: 'BDS' | 'FRDBY' | 'FRPDV17' | 'NBS',
  livreNumero: number,
  chapitre: number,
  verset: number
): Promise<string | null> {
  const cle = `${codeVersion}_${livreNumero}_${chapitre}_${verset}`;
  if (CACHE_VERSIONS[cle]) return CACHE_VERSIONS[cle];

  try {
    const res = await fetch(
      `https://bolls.life/get-verse/${codeVersion}/${livreNumero}/${chapitre}/${verset}/`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && typeof data.text === 'string' && data.text.trim()) {
      const propre = nettoyerTexteHtml(data.text);
      CACHE_VERSIONS[cle] = propre;
      return propre;
    }
  } catch (err) {
    console.warn(`Impossible de charger la version ${codeVersion}:`, err);
  }
  return null;
}

