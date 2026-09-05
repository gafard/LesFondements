/** Remise à zéro demandée le 5 septembre 2026. Valeur partagée avec firestore.rules. */
export const CONNEXION_MINIMALE_SECONDES = 1788630500;
const CLE = 'lesfondements_reset_epoch';
const PREFIXES = ['lf.', 'lesfondements_', 'temoignages_'];

export function doitReinitialiser(stockage: Pick<Storage, 'getItem'>): boolean {
  return stockage.getItem(CLE) !== String(CONNEXION_MINIMALE_SECONDES);
}

/** Efface uniquement les données de cette application, une seule fois par appareil. */
export function reinitialiserStockage(stockage: Storage): void {
  if (!doitReinitialiser(stockage)) return;
  const cles = Array.from({ length: stockage.length }, (_, i) => stockage.key(i));
  for (const cle of cles) if (cle && PREFIXES.some(p => cle.startsWith(p))) stockage.removeItem(cle);
  stockage.setItem(CLE, String(CONNEXION_MINIMALE_SECONDES));
}
