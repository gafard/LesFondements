// Généré par scripts/build-livret-data.py — ne pas modifier à la main.
// Métadonnées des 20 fiches : assez pour dessiner le sentier sans
// charger le contenu intégral du livret.

export interface FicheMeta {
  id: number;
  titre: string;
  sousTitre: string;
  icone: string;
  /** Page d'ouverture dans le livret imprimé. */
  page: number;
  chapitre: number;
  nbQuestions: number;
  nbVersets: number;
}

export const FICHES_META: FicheMeta[] = [
  {
    id: 1,
    titre: "Connaître Dieu",
    sousTitre: "Découvrir la nature et le caractère de Dieu",
    icone: "Crown",
    page: 5,
    chapitre: 1,
    nbQuestions: 7,
    nbVersets: 5,
  },
  {
    id: 2,
    titre: "Le péché, le salut",
    sousTitre: "Comprendre notre séparation et le plan de Dieu",
    icone: "Cross",
    page: 13,
    chapitre: 1,
    nbQuestions: 8,
    nbVersets: 4,
  },
  {
    id: 3,
    titre: "Devenir enfant de Dieu",
    sousTitre: "La nouvelle naissance et la foi",
    icone: "Heart",
    page: 19,
    chapitre: 1,
    nbQuestions: 10,
    nbVersets: 3,
  },
  {
    id: 4,
    titre: "La Grâce",
    sousTitre: "Vivre libéré du légalisme",
    icone: "Wind",
    page: 27,
    chapitre: 1,
    nbQuestions: 16,
    nbVersets: 7,
  },
  {
    id: 5,
    titre: "Mon identité en Christ",
    sousTitre: "Comprendre qui je suis devenu en Christ",
    icone: "User",
    page: 37,
    chapitre: 1,
    nbQuestions: 6,
    nbVersets: 3,
  },
  {
    id: 6,
    titre: "Un comportement nouveau",
    sousTitre: "Passer de l’ancienne manière de vivre à une vie conduite par l’Esprit",
    icone: "RefreshCcw",
    page: 47,
    chapitre: 2,
    nbQuestions: 5,
    nbVersets: 4,
  },
  {
    id: 7,
    titre: "Vivre libre — première partie",
    sousTitre: "Reconnaître les blessures, les mensonges et les forteresses intérieures",
    icone: "ShieldCheck",
    page: 53,
    chapitre: 2,
    nbQuestions: 15,
    nbVersets: 2,
  },
  {
    id: 8,
    titre: "Vivre libre — deuxième partie",
    sousTitre: "Fermer les portes du passé et affermir une liberté durable",
    icone: "KeyRound",
    page: 61,
    chapitre: 2,
    nbQuestions: 6,
    nbVersets: 1,
  },
  {
    id: 9,
    titre: "Le Saint-Esprit : sa demeure en nous",
    sousTitre: "Vivre une relation intérieure avec Dieu",
    icone: "FlameKindling",
    page: 69,
    chapitre: 2,
    nbQuestions: 7,
    nbVersets: 3,
  },
  {
    id: 10,
    titre: "Le Saint-Esprit : un revêtement de puissance",
    sousTitre: "Recevoir la force de témoigner et de servir",
    icone: "Zap",
    page: 75,
    chapitre: 2,
    nbQuestions: 4,
    nbVersets: 3,
  },
  {
    id: 11,
    titre: "Le Saint-Esprit : ministère, dons et fruit",
    sousTitre: "Servir avec les capacités de Dieu et le caractère de Christ",
    icone: "Gift",
    page: 81,
    chapitre: 3,
    nbQuestions: 7,
    nbVersets: 2,
  },
  {
    id: 12,
    titre: "Disciple de Jésus — première partie",
    sousTitre: "Suivre le Seigneur avec amour, humilité et persévérance",
    icone: "Footprints",
    page: 89,
    chapitre: 3,
    nbQuestions: 11,
    nbVersets: 3,
  },
  {
    id: 13,
    titre: "Disciple de Jésus — deuxième partie",
    sousTitre: "Apprendre, obéir et former d’autres disciples",
    icone: "Waypoints",
    page: 97,
    chapitre: 3,
    nbQuestions: 6,
    nbVersets: 3,
  },
  {
    id: 14,
    titre: "Le Royaume, l’Église et la mission",
    sousTitre: "Participer à ce que Dieu accomplit dans le monde",
    icone: "Globe2",
    page: 103,
    chapitre: 3,
    nbQuestions: 9,
    nbVersets: 2,
  },
  {
    id: 15,
    titre: "Une communauté relationnelle",
    sousTitre: "Vivre la famille spirituelle, l’unité et une autorité saine",
    icone: "UsersRound",
    page: 111,
    chapitre: 3,
    nbQuestions: 12,
    nbVersets: 2,
  },
  {
    id: 16,
    titre: "La prière",
    sousTitre: "Cultiver une conversation vivante et persévérante avec Dieu",
    icone: "MessageCircleHeart",
    page: 119,
    chapitre: 4,
    nbQuestions: 9,
    nbVersets: 1,
  },
  {
    id: 17,
    titre: "La Bible",
    sousTitre: "Recevoir, comprendre et mettre en pratique la Parole",
    icone: "BookMarked",
    page: 129,
    chapitre: 4,
    nbQuestions: 6,
    nbVersets: 1,
  },
  {
    id: 18,
    titre: "L’ancienne et la nouvelle Alliances",
    sousTitre: "Lire toute la Bible à la lumière de l’œuvre de Jésus",
    icone: "ScrollText",
    page: 137,
    chapitre: 4,
    nbQuestions: 9,
    nbVersets: 2,
  },
  {
    id: 19,
    titre: "Israël et l’Église",
    sousTitre: "Comprendre les racines, la continuité et l’humilité",
    icone: "Landmark",
    page: 145,
    chapitre: 4,
    nbQuestions: 3,
    nbVersets: 2,
  },
  {
    id: 20,
    titre: "Les fins dernières",
    sousTitre: "Vivre aujourd’hui dans l’espérance de la résurrection",
    icone: "Sunrise",
    page: 151,
    chapitre: 4,
    nbQuestions: 5,
    nbVersets: 1,
  },
];

export interface ChapitreMeta {
  numero: number;
  roman: string;
  titre: string;
  fiches: number[];
}

export const CHAPITRES: ChapitreMeta[] = [
  { numero: 1, roman: 'I', titre: "Recevoir le Fondement", fiches: [1, 2, 3, 4, 5] },
  { numero: 2, roman: 'II', titre: "Être transformé", fiches: [6, 7, 8, 9, 10] },
  { numero: 3, roman: 'III', titre: "Devenir disciple", fiches: [11, 12, 13, 14, 15] },
  { numero: 4, roman: 'IV', titre: "Demeurer et espérer", fiches: [16, 17, 18, 19, 20] },
];
