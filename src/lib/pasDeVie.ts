import { lireTrace } from './traces';

/** La relecture accompagne une intention ; elle ne mesure jamais la foi. */
export const PREFIXE_RELECTURE = 'relecture-pas:';
export const ISSUES_PAS = {
  vecu: 'J’ai vécu ce pas',
  essaye: 'J’ai essayé, c’était difficile',
  reprendre: 'Je n’ai pas commencé',
  'pas-encore': 'L’occasion ne s’est pas présentée',
} as const;

export type IssuePas = keyof typeof ISSUES_PAS;
export interface RelecturePas {
  version: 1;
  pasId: string;
  date: number;
  issue: IssuePas;
  observation: string;
  prochainPas: string;
  /** Conserver ce qui était réellement choisi lors de cette relecture. */
  action: string;
  intention: string;
  moment: string;
}

export interface PasDeVie {
  id: string;
  ficheId: number;
  section: number | null;
  action: string;
  moment: string;
  reference: string;
  relectures: RelecturePas[];
}

export function lireRelecture(valeur: unknown): RelecturePas | null {
  if (typeof valeur !== 'string') return null;
  try {
    const r = JSON.parse(valeur) as Partial<RelecturePas> | null;
    if (!r || r.version !== 1 || typeof r.pasId !== 'string'
      || typeof r.date !== 'number' || !Number.isFinite(r.date) || r.date <= 0
      || !r.issue || !Object.hasOwn(ISSUES_PAS, r.issue)
      || !['observation', 'prochainPas', 'action', 'intention', 'moment'].every(
        (cle) => typeof r[cle as keyof RelecturePas] === 'string'
      )) return null;
    return r as RelecturePas;
  } catch {
    return null;
  }
}

/** Compatible avec les pas historiques de fiche et ceux des temps à part. */
export function extrairePasDeVie(ficheId: number, reponses: Record<string, string>): PasDeVie[] {
  const relectures = Object.entries(reponses)
    .filter(([cle]) => cle.startsWith(PREFIXE_RELECTURE))
    .map(([, valeur]) => lireRelecture(valeur))
    .filter((r): r is RelecturePas => r !== null)
    .sort((a, b) => a.date - b.date);
  return Object.entries(reponses).flatMap(([cle, valeur]) => {
    const trace = cle.startsWith('trace:') ? lireTrace(valeur) : null;
    if (trace && (trace.nature !== 'pas' || !trace.texte.trim())) return [];
    if (!trace && (!cle.startsWith('pas:') || typeof valeur !== 'string' || !valeur.trim())) return [];
    const id = trace ? cle : cle.slice(4);
    const section = /^f(\d+)-s(\d+)$/.exec(trace ? cle.slice(6) : id);
    if (!trace && id !== String(ficheId) && (!section || Number(section[1]) !== ficheId || Number(section[2]) < 1)) return [];
    return [{
      id, ficheId,
      section: section ? Number(section[2]) - 1 : null,
      action: trace ? trace.texte.trim() : valeur.trim(),
      moment: reponses[`pas-moment:${id}`]?.trim() ?? '',
      reference: trace?.reference || reponses[`verset-choisi:${id}`]?.trim() || '',
      relectures: relectures.filter((r) => r.pasId === id),
    }];
  }).sort((a, b) => (b.section ?? -1) - (a.section ?? -1));
}

export function actionActuelle(pas: PasDeVie): string {
  // Une intention modifiée dans l'immersion reste prioritaire sur un ancien bilan.
  const derniere = pas.relectures.at(-1);
  return derniere?.intention === pas.action
    ? derniere.prochainPas.trim() || derniere.action : pas.action;
}

export function pasARelire(pas: PasDeVie): boolean {
  const derniere = pas.relectures.at(-1);
  return !derniere || derniere.issue !== 'vecu' || !!derniere.prochainPas.trim()
    || derniere.intention !== pas.action || derniere.moment !== pas.moment;
}

export function lienVersPas(pas: PasDeVie): string {
  return pas.section === null ? `/fiches/${pas.ficheId}`
    : `/aujourdhui?fiche=${pas.ficheId}&section=${pas.section}&moment=pas`;
}

export function texteRelecture(r: RelecturePas): string {
  return [
    `Relecture du ${new Date(r.date).toLocaleDateString('fr-FR')}`,
    r.moment && `Quand : ${r.moment}`,
    `Mon intention : ${r.action}`,
    ISSUES_PAS[r.issue], r.observation,
    r.prochainPas && `Mon prochain petit pas : ${r.prochainPas}`,
  ].filter(Boolean).join('\n');
}
