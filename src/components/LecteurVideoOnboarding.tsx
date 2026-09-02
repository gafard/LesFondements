'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Maximize2, Minimize2, Play, RotateCcw, SkipForward } from 'lucide-react';

interface LecteurVideoOnboardingProps {
  src?: string;
  poster?: string;
  titre?: string;
  sousTitre?: string;
  autoPlay?: boolean;
  pleinEcran?: boolean;
  onPasser?: () => void;
  onVideoEnded?: () => void;
}

export default function LecteurVideoOnboarding({
  src = '/video/onboarding.mp4',
  poster = '/video/onboarding_poster.jpg',
  titre = 'Comprendre l’esprit du parcours en 50 secondes',
  sousTitre = '« Poser des piliers solides »',
  autoPlay = false,
  pleinEcran = false,
  onPasser,
  onVideoEnded,
}: LecteurVideoOnboardingProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [enLecture, setEnLecture] = useState(false);
  const [enChargement, setEnChargement] = useState(false);
  const [termine, setTermine] = useState(false);
  const [pleinEcranActif, setPleinEcranActif] = useState(pleinEcran);

  const lancerLecture = useCallback(() => {
    if (!videoRef.current) return;
    setEnChargement(true);
    videoRef.current
      .play()
      .then(() => {
        setEnLecture(true);
        setEnChargement(false);
        setTermine(false);
      })
      .catch(() => {
        setEnChargement(false);
      });
  }, []);

  useEffect(() => {
    if (autoPlay && videoRef.current) {
      // Le lecteur est monté par une action explicite de l'utilisateur. On
      // tente donc la lecture immédiatement ; si le navigateur la refuse, le
      // grand bouton de lecture reste disponible au centre de l'écran.
      lancerLecture();
    }
  }, [autoPlay, lancerLecture]);

  useEffect(() => {
    if (!pleinEcranActif) return;
    const quitterAvecEchap = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPleinEcranActif(false);
    };
    window.addEventListener('keydown', quitterAvecEchap);
    return () => window.removeEventListener('keydown', quitterAvecEchap);
  }, [pleinEcranActif]);

  const relancer = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    lancerLecture();
  };

  return (
    <div
      data-testid="lecteur-video-onboarding"
      role="region"
      aria-label={pleinEcranActif ? 'Vidéo d’introduction en plein écran' : 'Vidéo d’introduction'}
      className={pleinEcranActif
        ? 'fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col overflow-hidden bg-black'
        : 'mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-or-400/50 bg-[#07162b] shadow-2xl shadow-or-500/10'}
    >
      {/* Zone Vidéo 16:9 */}
      <div className={pleinEcranActif
        ? 'group relative flex min-h-0 flex-1 select-none items-center justify-center overflow-hidden bg-black'
        : 'group relative flex aspect-video w-full select-none items-center justify-center overflow-hidden bg-black'}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          autoPlay={autoPlay}
          preload={autoPlay ? 'auto' : 'metadata'}
          controls={enLecture}
          onPlay={() => {
            setEnLecture(true);
            setEnChargement(false);
          }}
          onPause={() => {
            if (!videoRef.current?.seeking) {
              setEnLecture(false);
            }
          }}
          onWaiting={() => setEnChargement(true)}
          onPlaying={() => setEnChargement(false)}
          onEnded={() => {
            setEnLecture(false);
            setTermine(true);
            onVideoEnded?.();
          }}
          className="h-full w-full object-contain bg-black"
        />

        <div className="absolute right-3 top-3 z-30 flex items-center gap-2 sm:right-5 sm:top-5">
          {pleinEcranActif && onPasser && (
            <button
              type="button"
              onClick={onPasser}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-black/65 px-4 text-xs font-bold text-white backdrop-blur transition-colors hover:bg-black/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-or-300"
            >
              Passer
              <SkipForward className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setPleinEcranActif((actif) => !actif)}
            aria-label={pleinEcranActif ? 'Réduire la vidéo' : 'Afficher la vidéo en plein écran'}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/65 text-white backdrop-blur transition-colors hover:bg-black/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-or-300"
          >
            {pleinEcranActif
              ? <Minimize2 className="h-4 w-4" aria-hidden="true" />
              : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>

        {/* Voile sombre d'ambiance si en pause */}
        {!enLecture && (
          <div
            onClick={lancerLecture}
            className="absolute inset-0 z-10 cursor-pointer bg-gradient-to-t from-encre-950/80 via-encre-950/30 to-transparent transition-opacity"
          />
        )}

        {/* Grand Bouton Play Doré Central si la vidéo est en pause */}
        {!enLecture && !termine && (
          <button
            type="button"
            onClick={lancerLecture}
            disabled={enChargement}
            aria-label="Lancer la vidéo"
            className="group/btn absolute z-20 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-or-300 via-or-400 to-or-600 text-encre-950 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/60"
          >
            {/* Halo lumineux animé */}
            <span className="absolute -inset-2 rounded-full bg-or-400/30 blur-md animate-pulse" />
            {enChargement ? (
              <Loader2 className="h-8 w-8 animate-spin text-encre-950" />
            ) : (
              <Play className="relative ml-1 h-7 w-7 sm:h-9 sm:w-9 fill-encre-950 transition-transform group-hover/btn:scale-110" />
            )}
          </button>
        )}

        {/* Bouton Rejouer quand la vidéo est terminée */}
        {termine && (
          <button
            type="button"
            onClick={relancer}
            className="group/btn absolute z-20 flex items-center gap-2 rounded-full bg-or-400 px-6 py-3 text-xs font-bold text-encre-950 shadow-2xl transition-all hover:scale-105"
          >
            <RotateCcw className="h-4 w-4" />
            Revoir la présentation
          </button>
        )}
      </div>

      {/* Barre inférieure sobre */}
      <div className={pleinEcranActif
        ? 'flex shrink-0 items-center justify-between gap-4 border-t border-white/10 bg-[#07162b] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 text-3xs text-parchemin-100/70 sm:px-6'
        : 'flex items-center justify-between border-t border-white/10 bg-white/[0.04] px-4 py-2.5 text-3xs text-parchemin-100/70'}
      >
        <span className="flex items-center gap-1.5 font-bold text-or-300">
          <Play className="h-3 w-3 fill-or-300" />
          {titre}
        </span>
        <span className="font-serif italic text-parchemin-100/50">
          {sousTitre}
        </span>
      </div>
    </div>
  );
}
