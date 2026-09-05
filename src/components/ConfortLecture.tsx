'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { Leaf } from 'lucide-react';
const CLE = 'lf.lecture-paisible';
let temporaire: boolean | null = null;
function lire() { if (temporaire !== null) return temporaire; try { return localStorage.getItem(CLE) === '1'; } catch { return false; } }
function observer(rappel: () => void) { window.addEventListener('lf:confort', rappel); window.addEventListener('storage', rappel); return () => { window.removeEventListener('lf:confort', rappel); window.removeEventListener('storage', rappel); }; }
export default function ConfortLecture() {
  const calme = useSyncExternalStore(observer, lire, () => false);
  useEffect(() => { document.documentElement.classList.toggle('lecture-paisible', calme); }, [calme]);
  return <button type="button" aria-pressed={calme} className="my-3 flex min-h-11 w-full items-center gap-2 rounded-xl border border-current/20 px-3 py-2 text-left text-xs font-semibold" onClick={() => { try { localStorage.setItem(CLE, calme ? '0' : '1'); temporaire = null; } catch { temporaire = !calme; } window.dispatchEvent(new Event('lf:confort')); }}><Leaf className="h-4 w-4" />{calme ? 'Lecture paisible activée' : 'Réduire les mouvements'}</button>;
}
