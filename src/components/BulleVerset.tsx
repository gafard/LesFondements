'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Check, Copy, Loader2, Pause, Volume2, X } from 'lucide-react';
import { fermerBulle, useBulleVerset } from '@/lib/bulleVerset';
import { ouvrirEtude } from '@/lib/panneauEtude';
import { lirePassage, texteSeul, type Passage } from '@/lib/etudes';
import { formaterReference } from '@/lib/reference';
import { texteDuVerset } from '@/data/versets';
import { getAudioChapitre, getComparaisonVerset } from '@/lib/bibleVersions';
import { arreterLecture, lireAVoixHaute } from '@/lib/ambiance';

const LARGEUR = 340;
const MARGE = 12;

interface PositionBulle {
  gauche: number;
  haut: number;
  largeur: number;
  pointe: number;
  au_dessus: boolean;
}

function calculerPosition(element: HTMLElement, hauteurEstimee = 220): PositionBulle {
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
    haut = rect.bottom + 8;
    auDessus = false;
  } else if (espaceEnHaut >= hauteurEstimee + 16) {
    haut = rect.top - hauteurEstimee - 8;
    auDessus = true;
  } else {
    haut = Math.max(MARGE, (vh - hauteurEstimee) / 2);
    auDessus = false;
  }

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
 * Papillon d'étude posé sous le verset cliqué :
 * Privilégie La Bible du Semeur (BDS) et son streaming audio réel en studio.
 */
export default function BulleVerset() {
  const bulle = useBulleVerset();
  const [passage, setPassage] = useState<Passage | null | undefined>(undefined);
  const [versionChoisie, setVersionChoisie] = useState<'bds' | 'lsg'>('bds');
  const [copie, setCopie] = useState(false);
  const [audioEnCours, setAudioEnCours] = useState(false);
  const [position, setPosition] = useState<PositionBulle | null>(null);
  const boite = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lectureIdRef = useRef(0);
  const [bullePrecedente, setBullePrecedente] = useState(bulle);

  // ── Réinitialisation synchrone au changement de bulle ──
  if (bulle !== bullePrecedente) {
    setBullePrecedente(bulle);
    setPassage(undefined);
    setCopie(false);
    setAudioEnCours(false);
    setVersionChoisie('bds');
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

  // ── Recalcul précis de la géométrie ──
  const repositionner = useCallback(() => {
    if (!bulle?.ancre) {
      setPosition(null);
      return;
    }
    try {
      const hauteurReelle = boite.current?.offsetHeight || 220;
      setPosition(calculerPosition(bulle.ancre, hauteurReelle));
    } catch {
      /* ignorer */
    }
  }, [bulle]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(repositionner);
    return () => window.cancelAnimationFrame(frame);
  }, [repositionner, passage, versionChoisie]);

  // ── Fermeture & événements ──
  const arreterAudio = useCallback(() => {
    lectureIdRef.current += 1;
    audioRef.current?.pause();
    setAudioEnCours(false);
    arreterLecture();
  }, []);

  const fermer = useCallback(() => {
    arreterAudio();
    fermerBulle();
  }, [arreterAudio]);

  useEffect(
    () => () => {
      lectureIdRef.current += 1;
      audioRef.current?.pause();
      arreterLecture();
    },
    [bulle]
  );

  useEffect(() => {
    if (!bulle) return;

    const auClavier = (event: KeyboardEvent) => {
      if (event.key === 'Escape') fermer();
    };

    const auMouvement = () => {
      try {
        const rect = bulle.ancre.getBoundingClientRect();
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
  const comparaison = getComparaisonVerset(bulle.reference.brut) || getComparaisonVerset(formaterReference(bulle.reference));
  const texteConnuSegond = texteDuVerset(bulle.reference.brut) || texteDuVerset(formaterReference(bulle.reference));

  // Texte à afficher selon la version (BDS par défaut si disponible)
  const texteSemeur = comparaison?.bds;
  const texteSegond = passage ? texteSeul(passage.versets) : texteConnuSegond || comparaison?.lsg || '';

  const versionEffective = versionChoisie === 'bds' && texteSemeur ? 'bds' : 'lsg';
  const texteAffiche = versionEffective === 'bds' ? texteSemeur! : texteSegond;
  const tropLong = texteAffiche.length > 360;

  // Les enregistrements disponibles couvrent un chapitre complet. Pour une
  // référence précise, on lit donc le texte affiché afin de commencer au bon
  // verset et de s'arrêter exactement à la fin du passage.
  const audioUrl = passage?.chapitreEntier
    ? getAudioChapitre(
        bulle.reference.livre.numero,
        bulle.reference.livre.nom,
        bulle.reference.chapitre,
        versionEffective
      )
    : '';
  const lectureChapitreEnStudio = Boolean(audioUrl);

  const lirePassageExact = () => {
    const lectureId = ++lectureIdRef.current;
    const lectureDemarree = lireAVoixHaute(`${titre}. ${texteAffiche}`, {
      onFin: () => {
        if (lectureId === lectureIdRef.current) setAudioEnCours(false);
      },
      onErreur: () => {
        if (lectureId === lectureIdRef.current) setAudioEnCours(false);
      },
    });
    setAudioEnCours(lectureDemarree);
  };

  const jouerAudio = () => {
    if (audioEnCours) {
      arreterAudio();
      return;
    }

    if (audioUrl && audioRef.current) {
      lectureIdRef.current += 1;
      arreterLecture();
      if (audioRef.current.src !== audioUrl) {
        audioRef.current.src = audioUrl;
      }
      audioRef.current
        .play()
        .then(() => setAudioEnCours(true))
        .catch((err) => {
          console.warn('Audio playback error, falling back to vocal synthesis:', err);
          setAudioEnCours(false);
          lirePassageExact();
        });
    } else {
      lirePassageExact();
    }
  };

  const copier = async () => {
    try {
      const nomPassage = passage?.titre || titre;
      const nomVersion = versionChoisie === 'bds' && texteSemeur ? 'Bible du Semeur' : 'Segond 1910';
      await navigator.clipboard.writeText(`« ${texteAffiche} » — ${nomPassage} (${nomVersion})`);
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
      <audio
        ref={audioRef}
        onPlay={() => setAudioEnCours(true)}
        onPause={() => setAudioEnCours(false)}
        onEnded={() => setAudioEnCours(false)}
        onError={() => setAudioEnCours(false)}
      />

      {/* 1. Voile d'arrière-plan */}
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
          maxHeight: 'min(75vh, 480px)',
          display: 'flex',
          flexDirection: 'column',
          ['--pointe' as string]: `${position?.pointe ?? 28}px`,
        }}
      >
        <span className="ruban -top-2.5 left-1/2 -translate-x-1/2 -rotate-2 rounded-[2px]" />

        {/* En-tête avec sélecteur de version (Semeur par défaut) */}
        <div className="flex items-center justify-between gap-2 border-b border-parchemin-300/80 pb-2">
          <div>
            <p className="manuscrit text-2xl font-bold leading-none text-or-700">{titre}</p>
            <div className="mt-0.5 flex items-center gap-1.5 text-3xs font-medium text-encre-500">
              {texteSemeur ? (
                <span className="inline-flex items-center gap-1 font-bold text-or-700">
                  📖 {versionChoisie === 'bds' ? 'Bible du Semeur (BDS)' : 'Louis Segond 1910'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-encre-500">
                  <span>📖 Segond 1910</span>
                  <span>•</span>
                  <span className="font-semibold text-or-700">🎧 Audio Semeur (BDS)</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {texteSemeur && (
              <div className="flex items-center rounded-lg bg-parchemin-200/70 p-0.5 text-3xs font-bold">
                <button
                  type="button"
                  onClick={() => setVersionChoisie('bds')}
                  className={`rounded px-1.5 py-0.5 transition-all ${
                    versionChoisie === 'bds'
                      ? 'bg-or-600 text-white shadow-2xs'
                      : 'text-encre-600 hover:text-encre-950'
                  }`}
                  title="La Bible du Semeur (Traduction du livret)"
                >
                  Semeur
                </button>
                <button
                  type="button"
                  onClick={() => setVersionChoisie('lsg')}
                  className={`rounded px-1.5 py-0.5 transition-all ${
                    versionChoisie === 'lsg'
                      ? 'bg-or-600 text-white shadow-2xs'
                      : 'text-encre-600 hover:text-encre-950'
                  }`}
                  title="Louis Segond 1910"
                >
                  LSG
                </button>
              </div>
            )}

            <button
              onClick={fermer}
              className="-mr-1 rounded-full p-1 text-encre-400 transition-colors hover:bg-parchemin-200 hover:text-encre-900"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Corps du texte */}
        <div className="my-2.5 flex-1 overflow-y-auto pr-1">
          {passage === undefined && !texteConnuSegond && !texteSemeur ? (
            <p className="flex items-center gap-2 py-4 text-xs text-encre-500">
              <Loader2 className="h-4 w-4 animate-spin text-or-600" /> Chargement du passage…
            </p>
          ) : texteAffiche ? (
            <p className={`font-serif text-sm leading-relaxed text-encre-900 ${tropLong ? 'text-xs leading-relaxed' : ''}`}>
              {texteAffiche}
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
          ) : (
            <p className="py-2 text-xs leading-relaxed text-encre-600">
              Ce passage est accessible dans l&apos;étude biblique complète.
            </p>
          )}
        </div>

        {/* Actions : Audio studio réel BDS + Copie + Étude */}
        <div className="flex items-center gap-1.5 border-t border-parchemin-300/80 pt-2.5">
          {texteAffiche && (
            <button
              onClick={jouerAudio}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-2xs font-bold transition-colors ${
                audioEnCours
                  ? 'bg-or-500 text-encre-950 shadow-xs'
                  : 'bg-parchemin-200/70 text-encre-700 hover:bg-or-100 hover:text-or-900'
              }`}
              title={
                audioEnCours
                  ? 'Arrêter la lecture'
                  : lectureChapitreEnStudio
                    ? 'Écouter le chapitre en audio studio'
                    : 'Écouter uniquement ce passage'
              }
              aria-label="Écouter le passage"
            >
              {audioEnCours ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-encre-950" />
                  <span>Arrêter</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-or-700" />
                  <span>{lectureChapitreEnStudio ? 'Écouter le chapitre' : 'Écouter ce passage'}</span>
                </>
              )}
            </button>
          )}

          {texteAffiche && (
            <button
              onClick={copier}
              className="rounded-lg p-1.5 text-encre-600 transition-colors hover:bg-or-100 hover:text-or-800"
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
