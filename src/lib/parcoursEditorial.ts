/**
 * Constitution éditoriale du temps quotidien.
 *
 * Le livret reste la source. Les questions numériques n'ont qu'un rôle de
 * facilitation. Deux invitations ouvertes restent la règle par défaut tant
 * qu'une fiche n'a pas fait l'objet d'une relecture éditoriale complète.
 * Lorsqu'un chemin a été composé explicitement, ses étapes peuvent être plus
 * nombreuses : observer, comprendre, relier et mettre en mots.
 */

export type PhaseQuestion = 'regarder' | 'comprendre' | 'relier' | 'mettre-en-mots';
export type PrioriteQuestion = 'essentielle' | 'approfondissement';

export interface QuestionEditoriale {
  id: string;
  fonction?: string;
  source?: 'parole' | 'livret' | 'contemplation' | 'vie';
  phase?: PhaseQuestion;
  priorite?: PrioriteQuestion;
  consigne?: string;
  question: string;
}

export interface RepartitionQuestions<T extends QuestionEditoriale> {
  principales: T[];
  approfondissement: T[];
}

export const MAX_QUESTIONS_ESSENTIELLES = 2;

const FORMULATION_DE_PRIERE = /^(parle|dis-lui|demande|prie|remercie|adresse-toi|apporte|nomme|reçois)/i;

function estObservation(question: QuestionEditoriale): boolean {
  return question.source === 'parole'
    || question.fonction?.includes('observer') === true
    || question.fonction?.includes('decouvrir') === true;
}

function estReponsePersonnelle(question: QuestionEditoriale): boolean {
  if (FORMULATION_DE_PRIERE.test(question.question.trim())) return false;
  return question.source === 'vie'
    || question.fonction?.includes('recevoir') === true
    || question.fonction?.includes('repondre') === true;
}

/**
 * Une journée non relue présente au plus deux questions comme nécessaires.
 * Une journée composée explicitement porte sa propre répartition : cela évite
 * qu'un algorithme décide à la place de l'éditeur quelles étapes de
 * compréhension sont utiles. L'ordre du corpus est toujours conservé.
 */
export function repartirQuestions<T extends QuestionEditoriale>(questions: T[]): RepartitionQuestions<T> {
  const repartitionExplicite = questions.some((question) => question.priorite !== undefined);
  if (repartitionExplicite) {
    return {
      principales: questions.filter((question) => question.priorite !== 'approfondissement'),
      approfondissement: questions.filter((question) => question.priorite === 'approfondissement'),
    };
  }

  if (questions.length <= MAX_QUESTIONS_ESSENTIELLES) {
    return { principales: questions, approfondissement: [] };
  }

  const observation = questions.find(estObservation) ?? questions[0];
  const personnelle = [...questions]
    .reverse()
    .find((question) => question.id !== observation.id && estReponsePersonnelle(question));
  const seconde = personnelle
    ?? questions.find((question) => question.id !== observation.id)
    ?? observation;
  const idsPrincipaux = new Set([observation.id, seconde.id]);
  const principales = questions.filter((question) => idsPrincipaux.has(question.id));

  return {
    principales: principales.slice(0, MAX_QUESTIONS_ESSENTIELLES),
    approfondissement: questions.filter((question) => !idsPrincipaux.has(question.id)),
  };
}

export interface AccompagnementEditorial {
  niveau: 'recommande' | 'important';
  titre: string;
  texte: string;
  reperes: string[];
}

/**
 * Les fiches 7 et 8 prévoient elles-mêmes un accompagnement humain. L'écran
 * ne diagnostique pas et ne conduit pas seul un ministère de prière.
 */
export function accompagnementDuJour(
  ficheId: number,
  sectionIndex: number
): AccompagnementEditorial | null {
  if (ficheId === 7 && sectionIndex >= 3) {
    return {
      niveau: 'recommande',
      titre: 'Ce chemin peut être vécu accompagné',
      texte:
        'Une blessure ou une situation de pardon n’a pas besoin d’être résolue aujourd’hui. Si elle demande du temps, tu peux la confier à une personne mûre et sûre de ta cellule.',
      reperes: [
        'Tu choisis librement ce que tu souhaites partager.',
        'Tes notes restent privées tant que tu ne décides pas de les montrer.',
        'Une relation dangereuse ne doit jamais être rétablie au détriment de ta sécurité.',
      ],
    };
  }

  if (ficheId === 8 && sectionIndex >= 1) {
    return {
      niveau: 'important',
      titre: 'Ne reste pas seul pour poser un diagnostic',
      texte:
        'Le livret prévoit que ce discernement et la prière qui peut suivre soient vécus avec des responsables préparés. Cette application t’aide à mettre des mots, mais elle ne peut ni identifier une cause spirituelle ni conclure à ta place.',
      reperes: [
        'Décris les faits sans chercher à nommer toi-même une influence spirituelle.',
        'Aucune pression, aucune introspection forcée, aucune conclusion automatique.',
        'Demande un échange avec des responsables en qui tu as confiance.',
      ],
    };
  }

  return null;
}
