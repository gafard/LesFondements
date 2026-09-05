// Backend exclusivement en mémoire, utilisé par test-carnet-stockage.mjs.
export let disponible = true;
export function hasRemoteBackend() { return disponible; }
export function reseau(actif: boolean) { disponible = actif; }
export async function getFirebaseDb() { return {}; }
export const documents = new Map<string, Record<string, unknown>>();
let suspendre: Promise<void> | null = null;
let delivrer: (() => void) | null = null;
export let ecritures = 0;
export function bloquer() { suspendre = new Promise<void>(r => { delivrer = r; }); }
export function liberer() { delivrer?.(); suspendre = null; }
export function doc(_db: unknown, ...chemin: string[]) { return chemin.join('/'); }
export function serverTimestamp() { return Date.now(); }
export async function getDoc(chemin: string) {
  const data = documents.get(chemin);
  return { exists: () => Boolean(data), data: () => data };
}
export async function setDoc(chemin: string, data: Record<string, unknown>) {
  ecritures++;
  if (suspendre) await suspendre;
  const avant = documents.get(chemin) || {};
  documents.set(chemin, { ...avant, ...data, answers: { ...(avant.answers as object), ...(data.answers as object) } });
}
export async function deleteDoc(chemin: string) { documents.delete(chemin); }
