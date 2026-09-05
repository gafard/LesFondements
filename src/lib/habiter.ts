import { lireAnnotations } from './annotations';
import { lireRelecture, PREFIXE_RELECTURE, texteRelecture } from './pasDeVie';

import { lireTrace, NATURES_TRACE, type NatureTrace } from './traces';
export { lireTrace, NATURES_TRACE, type NatureTrace, type TraceParole } from './traces';

export interface ProfilFiche {
  invitation: string; question: string; nature: NatureTrace; reprendre?: number;
}
/** Facilitation numérique : le texte et les questions du livret restent la source. */
export const PROFILS_FICHES: Record<number, ProfilFiche> = {
  1: { invitation: 'Prendre le temps de découvrir qui est Dieu.', question: 'Qu’est-ce que ce passage te fait découvrir de Dieu ?', nature: 'comprehension' },
  2: { invitation: 'Comprendre le salut et ce que le texte annonce.', question: 'Comment expliquerais-tu ce que tu viens de lire ?', nature: 'comprehension', reprendre: 1 },
  3: { invitation: 'Accueillir la place donnée dans la famille de Dieu.', question: 'Quelle parole sur cette appartenance veux-tu garder ?', nature: 'comprehension', reprendre: 2 },
  4: { invitation: 'Recevoir la grâce. Tu peux demeurer ici sans te fixer une tâche.', question: 'Que veux-tu recevoir de cette grâce aujourd’hui ?', nature: 'priere', reprendre: 1 },
  5: { invitation: 'Comprendre une identité reçue avant de chercher à agir.', question: 'Quelle affirmation du texte veux-tu mieux comprendre ?', nature: 'comprehension', reprendre: 4 },
  6: { invitation: 'Revenir à la Parole au milieu des situations réelles.', question: 'Dans quelle situation souhaites-tu te souvenir de cette Parole ?', nature: 'pas', reprendre: 5 },
  7: { invitation: 'Lire à ton rythme et pouvoir en parler à une personne de confiance.', question: 'Quelle question aimerais-tu reprendre avec une personne qui t’accompagne ?', nature: 'question', reprendre: 4 },
  8: { invitation: 'Comprendre le livret avec un accompagnement humain, sans conclure seul sur toi.', question: 'Quel passage souhaites-tu éclaircir avec une personne de confiance ?', nature: 'question', reprendre: 5 },
  9: { invitation: 'Prier et discerner avec la Parole ce qui retient ton attention.', question: 'Quelle pensée à discerner veux-tu apporter à Dieu ?', nature: 'priere' },
  10: { invitation: 'Faire place à la prière personnelle et à un accompagnement choisi.', question: 'Que souhaites-tu confier à Dieu dans la prière ?', nature: 'priere', reprendre: 9 },
  11: { invitation: 'Découvrir les dons dans une vie de service et de relation.', question: 'Quel besoin concret d’une personne attire ton attention ?', nature: 'question', reprendre: 10 },
  12: { invitation: 'Comprendre ce que signifie suivre Jésus au quotidien.', question: 'Qu’est-ce que ce passage t’apprend sur la vie de disciple ?', nature: 'comprehension', reprendre: 5 },
  13: { invitation: 'Laisser une vérité rejoindre un geste simple.', question: 'Quel petit pas librement choisi correspond à ce passage ?', nature: 'pas', reprendre: 6 },
  14: { invitation: 'Relier la mission à des personnes et à des rencontres réelles.', question: 'Pour qui aimerais-tu prier ou te rendre disponible ?', nature: 'priere', reprendre: 11 },
  15: { invitation: 'Laisser la Parole éclairer la manière de vivre ensemble.', question: 'Qu’aimerais-tu comprendre ou vivre dans une relation ?', nature: 'question', reprendre: 13 },
  16: { invitation: 'Prendre un temps de prière, avec ou sans mots écrits.', question: 'Que veux-tu dire à Dieu, simplement ?', nature: 'priere', reprendre: 9 },
  17: { invitation: 'Lire dans le contexte et formuler ce que le passage dit.', question: 'Que comprends-tu de ce texte dans son contexte ?', nature: 'comprehension', reprendre: 1 },
  18: { invitation: 'Comparer les alliances en revenant aux textes cités.', question: 'Quel lien ou quelle différence veux-tu vérifier dans la Bible ?', nature: 'comprehension', reprendre: 4 },
  19: { invitation: 'Examiner les textes et garder une place pour tes questions.', question: 'Sur quel passage souhaites-tu poursuivre ta recherche ?', nature: 'question', reprendre: 17 },
  20: { invitation: 'Recevoir l’espérance et ouvrir la suite de ton chemin.', question: 'Quelle espérance et quelle question emportes-tu pour la suite ?', nature: 'priere', reprendre: 1 },
};

export interface EcritCarnet {
  id: string; ficheId: number; titre: string; contenu: string;
  nature: NatureTrace | 'note' | 'verset' | 'relecture'; date?: number; reference?: string;
  favori: boolean; href: string;
}
/** Un seul décodage pour le carnet, la recherche et l’export. Jamais de JSON technique. */
export function ecritsDuCarnet(ficheId: number, answers: Record<string, string>): EcritCarnet[] {
  return Object.entries(answers).flatMap(([id, contenu]): EcritCarnet[] => {
    if (typeof contenu !== 'string' || !contenu.trim()) return [];
    const base = { id, ficheId, favori: answers[`favori:${id}`] === '1', href: `/fiches/${ficheId}` };
    if (id.startsWith('trace:')) {
      const trace = lireTrace(contenu);
      if (!trace?.texte.trim()) return [];
      const section = id.match(/^trace:f\d+-s(\d+)$/);
      return [{ ...base, contenu: trace.texte, titre: NATURES_TRACE[trace.nature], nature: trace.nature,
        date: trace.date, reference: trace.reference,
        href: section ? `/aujourdhui?fiche=${ficheId}&section=${Number(section[1]) - 1}&moment=pas` : base.href }];
    }
    if (id.startsWith(PREFIXE_RELECTURE)) {
      const r = lireRelecture(contenu);
      return r ? [{ ...base, contenu: texteRelecture(r), titre: 'Relecture d’un pas', nature: 'relecture', date: r.date, href: '/transformation' }] : [];
    }
    if (id === `annotations:${ficheId}`) return lireAnnotations(contenu).notes.filter(n => n.texte.trim()).map(n => ({
      ...base, id: `postit-${n.id}`, contenu: n.texte, titre: 'Post-it', nature: 'note', favori: answers[`favori:postit-${n.id}`] === '1',
    }));
    const categorie = id.startsWith('pas:') ? 'pas' : id.startsWith('v:') || id.startsWith('memo:') || id.startsWith('verset-principal:') || id.startsWith('verset-choisi:') ? 'verset'
      : id.startsWith('priere:') ? 'priere' : 'note';
    // Liste explicite des écritures humaines historiques. Les marqueurs, préférences et états sont exclus.
    if (!/^(q:|v:|memo:|verset-principal:|pas:|pas-moment:|priere:|verset-choisi:|immersion:note:|synthese:)/.test(id)) return [];
    return [{ ...base, contenu, nature: categorie,
      titre: id.startsWith('pas-moment:') ? 'Le moment choisi' : categorie === 'pas' ? 'Un pas à vivre' : categorie === 'verset' ? 'Parole gardée' : categorie === 'priere' ? 'Prière' : 'Réponse personnelle' }];
  });
}
