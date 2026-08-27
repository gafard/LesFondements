'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, Loader2 } from 'lucide-react';

interface LecteurVideoOnboardingProps {
  src?: string;
  poster?: string;
  titre?: string;
  sousTitre?: string;
  autoPlay?: boolean;
  onVideoEnded?: () => void;
}

export default function LecteurVideoOnboarding({
  src = '/video/onboarding.mp4',
  poster = '/video/onboarding_poster.jpg',
  titre = 'Comprendre l’esprit du parcours en 50 secondes',
  sousTitre = '« Poser des piliers solides »',
  autoPlay = false,
  onVideoEnded,
}: LecteurVideoOnboardingProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [enLecture, setEnLecture] = useState(false);
  const [enChargement, setEnChargement] = useState(false);
  const [termine, setTermine] = useState(false);

  const lancerLecture = () => {
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
  };

  useEffect(() => {
    if (autoPlay && videoRef.current) {
      // Petite temporisation pour que l'animation de transition soit terminée
      const timer = setTimeout(() => {
        lancerLecture();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPlay]);

  const relancer = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    lancerLecture();
  };

  return (
    <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-or-400/50 bg-[#07162b] shadow-2xl shadow-or-500/10">
      {/* Zone Vidéo 16:9 */}
      <div className="group relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center select-none">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          preload="metadata"
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
      <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.04] px-4 py-2.5 text-3xs text-parchemin-100/70">
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
