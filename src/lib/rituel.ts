import type { FicheLivret } from './livret';

export const CLE_ETAT_RITUEL = 'rituel:v1';

export type RetourPasRituel = 'vecu' | 'en_chemin' | 'soutien';
export type TypeMomentRituel = 'resume' | 'annexe' | 'synthese';

export interface MomentRituel {
  id: string;
  type: TypeMomentRituel;
  ordre: number;
  titre: string;
  sourceLabel: 'Texte du livret' | 'Annexe du livret' | 'Accompagnement de l’application';
  points: string[];
  versets: string[];
  lectures: string[];
  question?: string;
  questionsRestantes: number;
  href: string;
  invitation: string;
}

export interface AvancementMomentRituel {
  pas?: string;
  completedAt?: number;
  completedDay?: string;
  feedback?: RetourPasRituel;
  updatedAt: number;
}

export interface EtatRituel {
  version: 1;
  ficheId: number;
  startedAt: number;
  moments: Record<string, AvancementMomentRituel>;
}

function ancrePourCle(cle: string): string {
  return cle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * Découpe le « Résumé et partage » sans réécrire le livret. Chaque carte
 * conserve mot pour mot son contenu et renvoie vers la question complète.
 * Les invitations ajoutées par l'application sont identifiées séparément.
 */
export function construireCheminRituel(fiche: FicheLivret): MomentRituel[] {
  const resumes = fiche.resume.map<MomentRituel>((section, indexSection) => {
    const question = section.questions[0];
    const cleQuestion = `${fiche.id}_${indexSection}_0`;
    return {
      id: `resume-${indexSection + 1}`,
      type: 'resume',
      ordre: indexSection + 1,
      titre: section.titre,
      sourceLabel: 'Texte du livret',
      points: section.points,
      versets: section.versets,
      lectures: section.lectures,
      question,
      questionsRestantes: Math.max(0, section.questions.length - (question ? 1 : 0)),
      href: question
        ? `/fiches/${fiche.id}?onglet=partage&reprendre=${encodeURIComponent(cleQuestion)}#passage-${ancrePourCle(cleQuestion)}`
        : `/fiches/${fiche.id}?onglet=partage`,
      invitation: `À la lumière de « ${section.titre} », quel petit pas choisis-tu de vivre aujourd’hui ?`,
    };
  });

  const annexes = fiche.annexes.map<MomentRituel>((annexe, indexAnnexe) => ({
    id: `annexe-${indexAnnexe + 1}`,
    type: 'annexe',
    ordre: resumes.length + indexAnnexe + 1,
    titre: annexe.titre,
    sourceLabel: 'Annexe du livret',
    points: annexe.blocs.slice(0, 2).map((bloc) => bloc.texte),
    versets: [],
    lectures: [],
    questionsRestantes: 0,
    href: `/fiches/${fiche.id}?onglet=annexes`,
    invitation: `Quelle phrase de cette annexe veux-tu garder avec toi aujourd’hui ?`,
  }));

  const ordreFinal = resumes.length + annexes.length + 1;
  return [
    ...resumes,
    ...annexes,
    {
      id: 'synthese',
      type: 'synthese',
      ordre: ordreFinal,
      titre: 'Relire la semaine',
      sourceLabel: 'Accompagnement de l’application',
      points: [
        'Relis les pas que tu as choisis. Garde celui que tu souhaites porter librement à la rencontre.',
      ],
      versets: [],
      lectures: [],
      questionsRestantes: 0,
      href: `/fiches/${fiche.id}?onglet=partage`,
      invitation: 'Quel pas concret veux-tu continuer à vivre cette semaine ?',
    },
  ];
}

export function creerEtatRituel(ficheId: number, maintenant = Date.now()): EtatRituel {
  return { version: 1, ficheId, startedAt: maintenant, moments: {} };
}

export function lireEtatRituel(
  reponses: Record<string, string>,
  ficheId: number,
  maintenant = Date.now()
): EtatRituel {
  const brut = reponses[CLE_ETAT_RITUEL];
  if (!brut) return creerEtatRituel(ficheId, maintenant);
  try {
    const valeur = JSON.parse(brut) as Partial<EtatRituel>;
    if (valeur.version !== 1 || valeur.ficheId !== ficheId || !valeur.moments) {
      return creerEtatRituel(ficheId, maintenant);
    }
    return {
      version: 1,
      ficheId,
      startedAt: typeof valeur.startedAt === 'number' ? valeur.startedAt : maintenant,
      moments: valeur.moments,
    };
  } catch {
    return creerEtatRituel(ficheId, maintenant);
  }
}

export function serialiserEtatRituel(etat: EtatRituel): string {
  return JSON.stringify(etat);
}

export function jourLocal(date = new Date()): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');
  return `${annee}-${mois}-${jour}`;
}

export function momentCourant(moments: MomentRituel[], etat: EtatRituel): MomentRituel | null {
  return moments.find((moment) => !etat.moments[moment.id]?.completedAt) ?? moments.at(-1) ?? null;
}

export function progressionRituel(moments: MomentRituel[], etat: EtatRituel): {
  termines: number;
  total: number;
  pourcentage: number;
} {
  const termines = moments.filter((moment) => !!etat.moments[moment.id]?.completedAt).length;
  return {
    termines,
    total: moments.length,
    pourcentage: moments.length ? Math.round((termines / moments.length) * 100) : 0,
  };
}

export function pasEnAttenteDeRetour(
  moments: MomentRituel[],
  etat: EtatRituel,
  aujourdHui = jourLocal()
): MomentRituel | null {
  return [...moments].reverse().find((moment) => {
    const avancement = etat.moments[moment.id];
    return !!(
      avancement?.pas &&
      avancement.completedDay &&
      avancement.completedDay < aujourdHui &&
      !avancement.feedback
    );
  }) ?? null;
}
