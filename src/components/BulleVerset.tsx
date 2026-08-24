'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Check, Copy, Loader2, Volume2, X } from 'lucide-react';
import { fermerBulle, useBulleVerset } from '@/lib/bulleVerset';
import { ouvrirEtude } from '@/lib/panneauEtude';
import { lirePassage, texteSeul, type Passage } from '@/lib/etudes';
import { formaterReference } from '@/lib/reference';
import { texteDuVerset } from '@/data/versets';
import { arreterLecture, lectureDisponible, lireAVoixHaute } from '@/lib/ambiance';

const LARGEUR = 340;
const MARGE = 12;

interface PositionBulle {
  gauche: number;
  haut: number;
  largeur: number;
  pointe: number;
  au_dessus: boolean;
}

function calculerPosition(element: HTMLElement, hauteurEstimee = 200): PositionBulle {
  const rect = element.getBoundingClientRect();
  const vw = typeof window !== 'undefined' ? window.innerWidth : 380;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 600;

  const largeurEffective = Math.min(LARGEUR, Math.max(260, vw - MARGE * 2));
  const centreElement = rect.left + rect.width / 2;

  // Calcul horizontal : centré sur le mot, borné dans l'écran
  let gauche = centreElement - largeurEffective / 2;
  gauche = Math.max(MARGE, Math.min(vw - largeurEffective - MARGE, gauche));

  // Calcul vertical : sous le mot si possible, au-dessus sinon
  const espaceEnBas = vh - rect.bottom;
  const espaceEnHaut = rect.top;
  let haut: number;
  let auDessus = false;

  if (espaceEnBas >= hauteurEstimee + 16) {
    // Il y a de la place en dessous
    haut = rect.bottom + 8;
    auDessus = false;
  } else if (espaceEnHaut >= hauteurEstimee + 16) {
    // Il y a de la place au-dessus
    haut = rect.top - hauteurEstimee - 8;
    auDessus = true;
  } else {
    // Écran très petit : centrer verticalement avec marge de sécurité
    haut = Math.max(MARGE, (vh - hauteurEstimee) / 2);
    auDessus = false;
  }

  // La petite flèche pointe vers le centre du mot
  const pointe = Math.max(16, Math.min(largeurEffective - 30, centreElement - gauche - 7));

  return {
    gauche: Math.round(gauche),
    haut: Math.round(haut),
    largeur: Math.round(largeurEffective),
    pointe: Math.round(pointe),
    au_dessus: auDessus,
  };
}

/**
 * Un bout de papier posé sous le verset cliqué : la référence manuscrite,
 * le texte biblique Segond, et les actions (écouter, copier, étude complète).
 */
export default function BulleVerset() {
  const bulle = useBulleVerset();
  const [passage, setPassage] = useState<Passage | null | undefined>(undefined);
  const [copie, setCopie] = useState(false);
  const [position, setPosition] = useState<PositionBulle | null>(null);
  const boite = useRef<HTMLDivElement>(null);
  const [bullePrecedente, setBullePrecedente] = useState(bulle);

  // ── Réinitialisation synchrone au changement de bulle ──
  if (bulle !== bullePrecedente) {
    setBullePrecedente(bulle);
    setPassage(undefined);
    setCopie(false);
    if (bulle?.ancre) {
      setPosition(calculerPosition(bulle.ancre));
    } else {
      setPosition(null);
    }
  }

  // ── Chargement du texte du passage ──
  useEffect(() => {
    if (!bulle) return;
    let actif = true;
    void lirePassage(bulle.reference).then((res) => {
      if (actif) {
        setPassage(res);
      }
    });
    return () => {
      actif = false;
    };
  }, [bulle]);

  // ── Recalcul précis de la géométrie une fois le DOM mesurable ──
  const repositionner = useCallback(() => {
    if (!bulle?.ancre) {
      setPosition(null);
      return;
    }
    try {
      const hauteurReelle = boite.current?.offsetHeight || 200;
      setPosition(calculerPosition(bulle.ancre, hauteurReelle));
    } catch {
      /* ignorer */
    }
  }, [bulle]);

  useEffect(() => {
    repositionner();
  }, [repositionner, passage]);

  // ── Fermeture & événements (scroll, escape, resize) ──
  const fermer = useCallback(() => {
    arreterLecture();
    fermerBulle();
  }, []);

  useEffect(() => {
    if (!bulle) return;

    const auClavier = (event: KeyboardEvent) => {
      if (event.key === 'Escape') fermer();
    };

    const auMouvement = () => {
      try {
        const rect = bulle.ancre.getBoundingClientRect();
        // Ferme seulement si l'élément sort largement de l'écran (scroll lointain)
        const sorti = rect.bottom < -150 || rect.top > window.innerHeight + 150;
        if (sorti) fermer();
        else repositionner();
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
  }, [bulle, fermer, repositionner]);

  if (!bulle) return null;

  const titre = formaterReference(bulle.reference, true);
  const texteConnu = texteDuVerset(bulle.reference.brut) || texteDuVerset(formaterReference(bulle.reference));
  const texte = passage ? texteSeul(passage.versets) : texteConnu || '';
  const tropLong = texte.length > 380;

  const copier = async () => {
    try {
      const nomPassage = passage?.titre || titre;
      await navigator.clipboard.writeText(`« ${texte} » — ${nomPassage} (Segond 1910)`);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 1800);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  const posGauche = position?.gauche ?? Math.max(MARGE, ((typeof window !== 'undefined' ? window.innerWidth : 380) - LARGEUR) / 2);
  const posHaut = position?.haut ?? 120;
  const posLargeur = position?.largeur ?? LARGEUR;

  return (
    <>
      {/* 1. Voile d'arrière-plan pour fermer au clic */}
      <div
        role="presentation"
        aria-hidden="true"
        onClick={fermer}
        className="fixed inset-0 z-[99998] cursor-default bg-black/25 backdrop-blur-[1.5px] transition-opacity duration-200"
      />

      {/* 2. La bulle de papier posée sur la table */}
      <div
        ref={boite}
        role="dialog"
        aria-label={titre}
        className="bulle-papier fixed z-[99999] rounded-2xl p-4 shadow-2xl transition-all duration-200"
        style={{
          position: 'fixed',
          left: `${posGauche}px`,
          top: `${posHaut}px`,
          width: `${posLargeur}px`,
          maxWidth: 'calc(100vw - 24px)',
          maxHeight: 'min(75vh, 460px)',
          display: 'flex',
          flexDirection: 'column',
          ['--pointe' as string]: `${position?.pointe ?? 28}px`,
        }}
      >
        {/* Ruban washi décoratif */}
        <span className="ruban -top-2.5 left-1/2 -translate-x-1/2 -rotate-2 rounded-[2px]" />

        {/* En-tête */}
        <div className="flex items-start justify-between gap-2 border-b border-parchemin-300/80 pb-2">
          <p className="manuscrit text-2xl font-bold leading-none text-or-700">{titre}</p>
          <button
            onClick={fermer}
            className="-mr-1 -mt-1 rounded-full p-1.5 text-encre-400 transition-colors hover:bg-parchemin-200 hover:text-encre-900"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corps du texte biblique */}
        <div className="my-2.5 flex-1 overflow-y-auto pr-1">
          {passage === undefined && !texteConnu ? (
            <p className="flex items-center gap-2 py-4 text-xs text-encre-500">
              <Loader2 className="h-4 w-4 animate-spin text-or-600" /> Chargement du passage…
            </p>
          ) : passage?.versets && passage.versets.length > 0 ? (
            <p className={`font-serif text-sm leading-relaxed text-encre-900 ${tropLong ? 'text-xs leading-relaxed' : ''}`}>
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
          ) : texte ? (
            <p className="font-serif text-sm leading-relaxed text-encre-900">
              {texte}
            </p>
          ) : (
            <p className="py-2 text-xs leading-relaxed text-encre-600">
              Ce passage est accessible dans l&apos;étude biblique complète.
            </p>
          )}
        </div>

        {/* Barre d'outils (actions) */}
        <div className="flex items-center gap-1.5 border-t border-parchemin-300/80 pt-2.5">
          {lectureDisponible() && texte && (
            <button
              onClick={() => lireAVoixHaute(`${titre}. ${texte}`)}
              className="rounded-lg p-2 text-encre-600 transition-colors hover:bg-or-100 hover:text-or-800"
              title="Écouter le passage"
              aria-label="Écouter le passage"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          )}
          {texte && (
            <button
              onClick={copier}
              className="rounded-lg p-2 text-encre-600 transition-colors hover:bg-or-100 hover:text-or-800"
              title="Copier le passage"
              aria-label="Copier le passage"
            >
              {copie ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          )}

          <button
            onClick={() => {
              ouvrirEtude(bulle.reference);
              fermerBulle();
            }}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-encre-950 px-3.5 py-1.5 text-2xs font-bold text-parchemin-100 shadow-xs transition-colors hover:bg-or-600 hover:text-white"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Étude complète
          </button>
        </div>
      </div>
    </>
  );
}
