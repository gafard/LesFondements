'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Check, Copy, Loader2, Volume2, X } from 'lucide-react';
import { fermerBulle, useBulleVerset } from '@/lib/bulleVerset';
import { ouvrirEtude } from '@/lib/panneauEtude';
import { lirePassage, texteSeul, type Passage } from '@/lib/etudes';
import { formaterReference } from '@/lib/reference';
import { arreterLecture, lectureDisponible, lireAVoixHaute } from '@/lib/ambiance';

const LARGEUR = 340;
const MARGE = 12;

/**
 * Un bout de papier posé sous le mot qu'on vient de toucher : la référence
 * écrite à la main, le passage, et trois gestes — l'écouter, le copier,
 * ouvrir l'étude complète si l'on veut aller au mot grec.
 */
export default function BulleVerset() {
  const bulle = useBulleVerset();
  const [passage, setPassage] = useState<Passage | null | undefined>(undefined);
  const [copie, setCopie] = useState(false);
  const [position, setPosition] = useState<{
    gauche: number;
    haut: number;
    largeur: number;
    pointe: number;
    au_dessus: boolean;
  } | null>(null);
  const boite = useRef<HTMLDivElement>(null);
  const [bullePrecedente, setBullePrecedente] = useState(bulle);

  // ── Le passage ──────────────────────────────────────────────
  // Réinitialisation au changement de bulle, pendant le rendu.
  if (bulle !== bullePrecedente) {
    setBullePrecedente(bulle);
    setPassage(undefined);
    setCopie(false);
  }

  useEffect(() => {
    if (!bulle) return;
    void lirePassage(bulle.reference).then(setPassage);
  }, [bulle]);

  // ── Placement : sous le mot, et retournée si le bas manque ──
  const placer = useCallback(() => {
    if (!bulle) {
      setPosition(null);
      return;
    }
    try {
      const rect = bulle.ancre.getBoundingClientRect();
      const { left: x, bottom: y, width: largeur, height: hauteur } = rect;
      const hauteurBulle = boite.current?.offsetHeight ?? 190;
      const largeurEffective = Math.min(LARGEUR, (typeof window !== 'undefined' ? window.innerWidth : 380) - MARGE * 2);
      
      // Centrée sur le mot, mais jamais hors de l'écran.
      const centre = x + (largeur > 0 ? largeur / 2 : 50);
      const gauche = Math.min(
        Math.max(MARGE, centre - largeurEffective / 2),
        Math.max(MARGE, (typeof window !== 'undefined' ? window.innerWidth : 380) - largeurEffective - MARGE)
      );

      const manqueEnBas = y + hauteurBulle + 24 > (typeof window !== 'undefined' ? window.innerHeight : 600);
      const haut = manqueEnBas ? y - hauteur - hauteurBulle - 14 : y + 10;

      setPosition({
        gauche: Math.max(MARGE, isNaN(gauche) ? MARGE : gauche),
        haut: Math.max(MARGE, isNaN(haut) ? 80 : haut),
        largeur: largeurEffective,
        // La pointe suit le mot, même quand la bulle a été recalée.
        pointe: Math.min(Math.max(16, centre - gauche - 7), largeurEffective - 30),
        au_dessus: manqueEnBas,
      });
    } catch {
      setPosition({
        gauche: 20,
        haut: 100,
        largeur: 320,
        pointe: 28,
        au_dessus: false,
      });
    }
  }, [bulle]);

  // Synchronisation géométrique au prochain repaint, sans rendu synchrone.
  useEffect(() => {
    const id = requestAnimationFrame(() => placer());
    return () => cancelAnimationFrame(id);
  }, [placer, passage, bulle]);

  // ── Fermeture ───────────────────────────────────────────────
  const fermer = useCallback(() => {
    arreterLecture();
    fermerBulle();
  }, []);

  useEffect(() => {
    if (!bulle) return;
    const auClavier = (event: KeyboardEvent) => event.key === 'Escape' && fermer();

    const auMouvement = () => {
      try {
        const rect = bulle.ancre.getBoundingClientRect();
        // Ferme seulement si l'élément sort largement de l'écran
        const sorti = rect.bottom < -120 || rect.top > window.innerHeight + 120;
        if (sorti) fermer();
        else placer();
      } catch {
        /* ignorer */
      }
    };

    window.addEventListener('keydown', auClavier);
    window.addEventListener('scroll', auMouvement, true);
    window.addEventListener('resize', auMouvement);
    return () => {
      window.removeEventListener('keydown', auClavier);
      window.removeEventListener('scroll', auMouvement, true);
      window.removeEventListener('resize', auMouvement);
    };
  }, [bulle, fermer, placer]);

  if (!bulle) return null;

  const titre = formaterReference(bulle.reference, true);
  const texte = passage ? texteSeul(passage.versets) : '';
  const tropLong = texte.length > 420;

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(`« ${texte} » — ${passage?.titre} (Segond 1910)`);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 1800);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  return (
    <>
      {/* Une surface transparente : un clic ailleurs referme la bulle. */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={fermer}
        className="fixed inset-0 z-[85] cursor-default bg-black/10 backdrop-blur-[1px]"
      />

      <div
        ref={boite}
        role="dialog"
        aria-label={titre}
        className="bulle-papier animate-fade-in fixed z-[86] rounded-2xl px-4 py-3.5"
        style={{
          left: position?.gauche ?? 20,
          top: position?.haut ?? 100,
          width: position?.largeur ?? LARGEUR,
          maxWidth: 'calc(100vw - 24px)',
          // La pointe se cache quand la bulle est passée au-dessus du mot.
          ['--pointe' as string]: `${position?.pointe ?? 28}px`,
        }}
      >
        <span className="ruban -top-2 left-1/2 -translate-x-1/2 -rotate-2 rounded-[2px]" />

        <div className="flex items-start justify-between gap-2">
          <p className="manuscrit text-xl font-bold leading-none text-or-700">{titre}</p>
          <button
            onClick={fermer}
            className="-mr-1 -mt-1 rounded-full p-1 text-encre-300 transition-colors hover:text-encre-700"
            aria-label="Fermer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {passage === undefined ? (
          <p className="mt-3 flex items-center gap-2 text-2xs text-encre-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> un instant…
          </p>
        ) : passage === null ? (
          <p className="mt-2.5 text-xs leading-relaxed text-encre-500">
            Ce passage n&apos;est pas dans la Segond annotée.
          </p>
        ) : (
          <>
            <p
              className={`mt-2.5 font-serif text-sm leading-relaxed text-encre-800 ${
                tropLong ? 'max-h-40 overflow-y-auto pr-1' : ''
              }`}
            >
              {passage.versets.map((verset) => (
                <span key={verset.v}>
                  {passage.versets.length > 1 && (
                    <sup className="mr-1 select-none font-sans text-2xs font-bold text-or-600">
                      {verset.v}
                    </sup>
                  )}
                  {verset.t}{' '}
                </span>
              ))}
            </p>

            <div className="mt-3 flex items-center gap-1 border-t border-encre-950/[0.07] pt-2.5">
              {lectureDisponible() && (
                <button
                  onClick={() => lireAVoixHaute(`${titre}. ${texte}`)}
                  className="rounded-lg p-1.5 text-encre-400 transition-colors hover:bg-or-100 hover:text-or-700"
                  aria-label="Écouter le passage"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={copier}
                className="rounded-lg p-1.5 text-encre-400 transition-colors hover:bg-or-100 hover:text-or-700"
                aria-label="Copier le passage"
              >
                {copie ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                onClick={() => {
                  ouvrirEtude(bulle.reference);
                  fermerBulle();
                }}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-encre-950/[0.06] px-3 py-1.5 text-2xs font-bold text-encre-700 transition-colors hover:bg-or-100 hover:text-or-700"
              >
                <BookOpen className="h-3 w-3" />
                Le mot d&apos;origine
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
