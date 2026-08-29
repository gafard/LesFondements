/**
 * Capacités de l'exécution courante.
 *
 * Le mode E2E est injecté uniquement par Playwright. Il force le magasin
 * local afin qu'un test ne puisse jamais créer un compte ou modifier un
 * groupe du projet Firebase réel, même si le poste possède un `.env.local`.
 */
export const MODE_E2E = process.env.NEXT_PUBLIC_E2E_MODE === '1';

export function firebaseConfigure(): boolean {
  if (MODE_E2E) return false;
  const cle = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  return !!cle && cle !== 'your-api-key' && !cle.includes('your-');
}
