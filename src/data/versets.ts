import versetsLivret from './versetsLivret.json';

// Textes bibliques déjà présents dans l'application (version Louis Segond,
// domaine public). Le livret, lui, laisse volontairement la place vide :
// « Versets (écrire et méditer) ». Quand le texte n'est pas connu ici,
// l'application propose de le recopier à la main, comme dans le livret.
//
// Ce fichier est la source de référence pour le texte Louis Segond 1910 :
// `src/lib/bibleVersions.ts` s'y réfère pour ne pas dupliquer le texte.

const VERSETS_SELECTIONNES: Record<string, string> = {
  "1 Ch 4:10": "Jaebets invoqua le Dieu d'Israël, en disant : Si tu me bénis et que tu étendes mes limites, si ta main est avec moi, et si tu me préserves du malheur, en sorte que je ne sois pas dans la souffrance !... Et Dieu accorda ce qu'il avait demandé.",
  "1 Co 1:18": "Car la prédication de la croix est une folie pour ceux qui périssent; mais pour nous qui sommes sauvés, elle est une puissance de Dieu.",
  "1 Co 1:2": "À l'Église de Dieu qui est à Corinthe, à ceux qui ont été sanctifiés en Jésus-Christ, appelés à être saints, et à tous ceux qui invoquent en quelque lieu que ce soit le nom de notre Seigneur Jésus-Christ, leur Seigneur et le nôtre.",
  "1 Co 6:19": "Ne savez-vous pas que votre corps est le temple du Saint-Esprit qui est en vous, que vous avez reçu de Dieu, et que vous ne vous appartenez point à vous-mêmes ?",
  "1 Jn 3:1a": "Voyez quel amour le Père nous a témoigné, pour que nous soyons appelés enfants de Dieu !",
  "1 Jn 3:1-2": "Voyez quel amour le Père nous a témoigné, pour que nous soyons appelés enfants de Dieu ! Et nous le sommes. Si le monde ne nous connaît pas, c'est qu'il ne l'a pas connu. Bien-aimés, nous sommes maintenant enfants de Dieu, et ce que nous serons n'a pas encore été manifesté ; mais nous savons que, lorsque cela sera manifesté, nous serons semblables à lui, parce que nous le verrons tel qu'il est.",
  "1 Jn 4:19": "Pour nous, nous l'aimons, parce qu'il nous a aimés le premier.",
  "1 Jn 4:16": "Et nous, nous avons connu l'amour que Dieu a pour nous, et nous y avons cru. Dieu est amour; et celui qui demeure dans l'amour demeure en Dieu, et Dieu demeure en lui.",
  "1 Pi 2:9-10": "Vous, au contraire, vous êtes une race élue, un sacerdoce royal, une nation sainte, un peuple acquis, afin que vous annonciez les vertus de celui qui vous a appelés des ténèbres à son admirable lumière, vous qui autrefois n'étiez pas un peuple, et qui maintenant êtes le peuple de Dieu, vous qui n'aviez pas obtenu miséricorde, et qui maintenant avez obtenu miséricorde.",
  "2 Co 3:5": "Ce n'est pas à dire que nous soyons par nous-mêmes capables de concevoir quelque chose comme venant de nous-mêmes. Notre capacité, au contraire, vient de Dieu.",
  "2 Co 5:17": "Si quelqu'un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées; voici, toutes choses sont devenues nouvelles.",
  "2 Co 5:21": "Celui qui n'a point connu le péché, il l'a fait devenir péché pour nous, afin que nous devenions en lui justice de Dieu.",
  "2 Co 5:7": "Car nous marchons par la foi et non par la vue.",
  "Ac 2:37-38": "Après avoir entendu ce discours, ils eurent le cœur vivement touché, et ils dirent à Pierre et aux autres apôtres : Hommes frères, que ferons-nous ? Pierre leur dit : Repentez-vous, et que chacun de vous soit baptisé au nom de Jésus-Christ, pour le pardon de vos péchés ; et vous recevrez le don du Saint-Esprit.",
  "Ap 1:8": "Je suis l'alpha et l'oméga, dit le Seigneur Dieu, celui qui est, qui était, et qui vient, le Tout-Puissant.",
  "Col 1:13": "Qui nous a délivrés de la puissance des ténèbres et nous a transportés dans le royaume du Fils de son amour.",
  "Col 1:29": "C'est à quoi je travaille, en combattant avec sa force, qui agit puissamment en moi.",
  "Col 3:3-5": "Car vous êtes morts, et votre vie est cachée avec Christ en Dieu. Quand Christ, votre vie, paraîtra, alors vous paraîtrez aussi avec lui dans la gloire. Faites donc mourir les membres qui sont sur la terre, l'impudicité, l'impureté, les passions, les mauvais désirs, et la cupidité, qui est une idolâtrie.",
  "Col 3:12": "Ainsi donc, comme des élus de Dieu, saints et bien-aimés, revêtez-vous d'entrailles de miséricorde, de bonté, d'humilité, de douceur, de patience.",
  "Ep 2:8": "Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c'est le don de Dieu.",
  "Ep 1:3": "Béni soit Dieu, le Père de notre Seigneur Jésus-Christ, qui nous a bénis de toutes sortes de bénédictions spirituelles dans les lieux célestes en Christ !",
  "Ep 2:4-5": "Mais Dieu, qui est riche en miséricorde, à cause du grand amour dont il nous a aimés, nous qui étions morts par nos offenses, nous a rendus à la vie avec Christ : c'est par grâce que vous êtes sauvés.",
  "Ep 2:4-6": "Mais Dieu, qui est riche en miséricorde, à cause du grand amour dont il nous a aimés, nous qui étions morts par nos offenses, nous a rendus à la vie avec Christ : c'est par grâce que vous êtes sauvés ; il nous a ressuscités ensemble, et nous a fait asseoir ensemble dans les lieux célestes, en Jésus-Christ.",
  "Ep 2:19": "Ainsi donc, vous n'êtes plus des étrangers, ni des gens du dehors ; mais vous êtes concitoyens des saints, gens de la maison de Dieu.",
  "Ep 4:20-24": "Mais vous, ce n'est pas ainsi que vous avez appris Christ, si du moins vous l'avez entendu, et si, conformément à la vérité qui est en Jésus, c'est en lui que vous avez été instruits à vous dépouiller, eu égard à votre vie passée, du vieil homme qui se corrompt par les convoitises trompeuses, à être renouvelés dans l'esprit de votre intelligence, et à revêtir l'homme nouveau, créé selon Dieu dans une justice et une sainteté que produit la vérité.",
  "Ep 2:8-9": "Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c'est le don de Dieu. Ce n'est point par les œuvres, afin que personne ne se glorifie.",
  "Ga 2:20": "J'ai été crucifié avec Christ; et si je vis, ce n'est plus moi qui vis, c'est Christ qui vit en moi.",
  "Ga 3:13-14": "Christ nous a rachetés de la malédiction de la loi, étant devenu malédiction pour nous — car il est écrit : Maudit est quiconque est pendu au bois — afin que la bénédiction d'Abraham eût pour les païens son accomplissement en Jésus-Christ, et que nous reçussions par la foi l'Esprit qui avait été promis.",
  "Ga 3:19-22": "Pourquoi donc la loi ? Elle a été donnée ensuite à cause des transgressions, jusqu'à ce que vînt la postérité à qui la promesse avait été faite ; elle a été promulguée par des anges, au moyen d'un médiateur. Or, le médiateur n'est pas médiateur d'un seul, tandis que Dieu est un seul. La loi est-elle donc contre les promesses de Dieu ? Loin de là ! S'il eût été donné une loi qui pût procurer la vie, la justice viendrait réellement de la loi. Mais l'Écriture a tout renfermé sous le péché, afin que ce qui avait été promis fût donné par la foi en Jésus-Christ à ceux qui croient.",
  "Ga 4:5-7": "Afin qu'il rachetât ceux qui étaient sous la loi, afin que nous reçussions l'adoption. Et parce que vous êtes fils, Dieu a envoyé dans nos cœurs l'Esprit de son Fils, lequel crie : Abba ! Père ! Ainsi tu n'es plus esclave, mais fils ; et si tu es fils, tu es aussi héritier par la grâce de Dieu.",
  "Ga 5:16": "Je dis donc : Marchez selon l'Esprit, et vous n'accomplirez pas les désirs de la chair.",
  "Ga 5:16-25": "Je dis donc : Marchez selon l'Esprit, et vous n'accomplirez pas les désirs de la chair. Car la chair a des désirs contraires à ceux de l'Esprit, et l'Esprit en a de contraires à ceux de la chair ; ils sont opposés entre eux, afin que vous ne fassiez point ce que vous voudriez. Si vous êtes conduits par l'Esprit, vous n'êtes point sous la loi. Or, les œuvres de la chair sont manifestes, ce sont l'impudicité, l'impureté, la dissolution, l'idolâtrie, la magie, les inimitiés, les querelles, les jalousies, les animosités, les disputes, les divisions, les sectes, l'envie, l'ivrognerie, les excès de table, et les choses semblables. Je vous dis d'avance, comme je l'ai déjà dit, que ceux qui commettent de telles choses n'hériteront point le royaume de Dieu. Mais le fruit de l'Esprit, c'est l'amour, la joie, la paix, la patience, la bonté, la bénignité, la fidélité, la douceur, la tempérance ; la loi n'est pas contre ces choses. Ceux qui sont à Jésus-Christ ont crucifié la chair avec ses passions et ses désirs. Si nous vivons par l'Esprit, marchons aussi selon l'Esprit.",
  "He 11:1": "Or la foi est une ferme assurance des choses qu'on espère, une démonstration de celles qu'on ne voit pas.",
  "He 11:6": "Or sans la foi il est impossible de lui être agréable ; car il faut que celui qui s'approche de Dieu croie que Dieu existe, et qu'il est le rémunérateur de ceux qui le cherchent.",
  "He 13:21": "Qu'il vous rende capables de toute bonne œuvre pour l'accomplissement de sa volonté, et fasse en vous ce qui lui est agréable, par Jésus-Christ, auquel soit la gloire aux siècles des siècles ! Amen !",
  "He 4:10-11": "Car celui qui entre dans le repos de Dieu se repose de ses œuvres, comme Dieu s'est reposé des siennes. Efforçons-nous donc d'entrer dans ce repos, afin que personne ne tombe en donnant le même exemple de désobéissance.",
  "He 4:16": "Approchons-nous donc avec assurance du trône de la grâce, afin d'obtenir miséricorde et de trouver grâce, pour être secourus dans nos besoins.",
  "Es 53:4-6": "Cependant, ce sont nos souffrances qu'il a portées, c'est de nos douleurs qu'il s'est chargé ; et nous l'avons considéré comme puni, frappé de Dieu, et humilié. Mais il était blessé pour nos péchés, brisé pour nos iniquités ; le châtiment qui nous donne la paix est tombé sur lui, et c'est par ses meurtrissures que nous sommes guéris. Nous étions tous errants comme des brebis, chacun suivait sa propre voie ; et l'Éternel a fait retomber sur lui l'iniquité de nous tous.",
  "Jn 10:10": "Le voleur ne vient que pour dérober, égorger et détruire; moi, je suis venu afin que les brebis aient la vie, et qu'elles soient dans l'abondance.",
  "Jn 14:6": "Jésus lui dit : Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi.",
  "Jn 15:10": "Si vous gardez mes commandements, vous demeurerez dans mon amour, de même que j'ai gardé les commandements de mon Père, et que je demeure dans son amour.",
  "Jn 15:7": "Si vous demeurez en moi, et que mes paroles demeurent en vous, demandez ce que vous voudrez, et cela vous sera accordé.",
  "Jn 1:1-3": "Au commencement était la Parole, et la Parole était avec Dieu, et la Parole était Dieu. Elle était au commencement avec Dieu. Toutes choses ont été faites par elle, et rien de ce qui a été fait n'a été fait sans elle.",
  "Jn 1:12": "Mais à tous ceux qui l'ont reçue, à ceux qui croient en son nom, elle a donné le pouvoir de devenir enfants de Dieu.",
  "Jn 3:16": "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.",
  "Jn 3:36": "Celui qui croit au Fils a la vie éternelle; celui qui ne croit pas au Fils ne verra point la vie, mais la colère de Dieu demeure sur lui.",
  "Pr 3:5-6": "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse; reconnais-le dans toutes tes voies, et il aplanira tes sentiers.",
  "Ph 2:13": "Car c'est Dieu qui produit en vous le vouloir et le faire, selon son bon plaisir.",
  "Ps 16:2": "Je dis à l'Éternel : Tu es mon Seigneur, Tu es mon souverain bien !",
  "Ps 23:1": "L'Éternel est mon berger : je ne manquerai de rien.",
  "Ps 46:11": "Arrêtez, et sachez que je suis Dieu : Je domine sur les nations, je domine sur la terre.",
  "Rm 10:9-10": "Si tu confesses de ta bouche le Seigneur Jésus, et si tu crois dans ton cœur que Dieu l'a ressuscité des morts, tu seras sauvé. Car c'est en croyant du cœur qu'on parvient à la justice, et c'est en confessant de la bouche qu'on parvient au salut.",
  "Rm 12:2": "Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l'intelligence, afin que vous discerniez quelle est la volonté de Dieu, ce qui est bon, agréable et parfait.",
  "Rm 3:23": "Car tous ont péché et sont privés de la gloire de Dieu.",
  "Rm 3:20": "Car nul ne sera justifié devant lui par les œuvres de la loi, puisque c'est par la loi que vient la connaissance du péché.",
  "Rm 5:12": "C'est pourquoi, comme par un seul homme le péché est entré dans le monde, et par le péché la mort, et qu'ainsi la mort s'est étendue sur tous les hommes, parce que tous ont péché...",
  "Rm 5:8": "Mais Dieu prouve son amour envers nous, en ce que, lorsque nous étions encore des pécheurs, Christ est mort pour nous.",
  "Rm 6:23": "Car le salaire du péché, c'est la mort; mais le don gratuit de Dieu, c'est la vie éternelle en Jésus-Christ notre Seigneur.",
  "Rm 6:15-18": "Quoi donc ! Pécherions-nous, parce que nous sommes, non sous la loi, mais sous la grâce ? Loin de là ! Ne savez-vous pas qu'en vous livrant à quelqu'un comme esclaves pour lui obéir, vous êtes esclaves de celui à qui vous obéissez, soit du péché qui conduit à la mort, soit de l'obéissance qui conduit à la justice ? Mais grâces soient rendues à Dieu de ce que, après avoir été esclaves du péché, vous avez obéi de cœur à la règle de doctrine dans laquelle vous avez été instruits. Ayant été affranchis du péché, vous êtes devenus esclaves de la justice.",
  "Rm 6:3-4": "Ignorez-vous que nous tous qui avons été baptisés en Jésus-Christ, c'est en sa mort que nous avons été baptisés ? Nous avons donc été ensevelis avec lui par le baptême en sa mort, afin que, comme Christ est ressuscité des morts par la gloire du Père, de même nous aussi nous marchions en nouveauté de vie.",
  "Rm 8:14-16": "Car tous ceux qui sont conduits par l'Esprit de Dieu sont fils de Dieu. Et vous n'avez point reçu un esprit de servitude, pour être encore dans la crainte ; mais vous avez reçu un Esprit d'adoption, par lequel nous crions : Abba ! Père ! L'Esprit lui-même rend témoignage à notre esprit que nous sommes enfants de Dieu.",
  "Rm 8:1": "Il n'y a donc maintenant aucune condamnation pour ceux qui sont en Jésus-Christ.",
  "Rm 8:32": "Lui, qui n'a point épargné son propre Fils, mais qui l'a livré pour nous tous, comment ne nous donnera-t-il pas aussi toutes choses avec lui ?",
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
