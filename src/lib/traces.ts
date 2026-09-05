export const NATURES_TRACE = {
  comprehension: 'Une compréhension', priere: 'Une prière', question: 'Une question', pas: 'Un pas à vivre',
} as const;
export type NatureTrace = keyof typeof NATURES_TRACE;
export interface TraceParole {
  version: 1; nature: NatureTrace; texte: string; date: number; reference: string;
}
export function lireTrace(brut?: string): TraceParole | null {
  try {
    const t = JSON.parse(brut || '') as TraceParole;
    return t && t.version === 1 && Object.hasOwn(NATURES_TRACE, t.nature)
      && typeof t.texte === 'string' && typeof t.reference === 'string'
      && Number.isFinite(t.date) && t.date > 0 ? t : null;
  } catch { return null; }
}
