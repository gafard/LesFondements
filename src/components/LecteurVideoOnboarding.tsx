'use client';

import { useState, useRef } from 'react';
import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface LecteurVideoOnboardingProps {
  src?: string;
  poster?: string;
  titre?: string;
  sousTitre?: string;
}

export default function LecteurVideoOnboarding({
  src = '/video/onboarding.mp4',
  poster = '/hero-community-v2.jpg',
  titre = 'Comprendre l’esprit du parcours en 50 secondes',
  sousTitre = '« Poser des piliers solides »',
}: LecteurVideoOnboardingProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [enLecture, setEnLecture] = useState(false);
  const [muet, setMuet] = useState(false);
  const [termine, setTermine] = useState(false);

  const basculerLecture = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      void videoRef.current.play();
      setEnLecture(true);
      setTermine(false);
    } else {
      videoRef.current.pause();
      setEnLecture(false);
    }
  };

  const relancer = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    void videoRef.current.play();
    setEnLecture(true);
    setTermine(false);
  };

  const basculerMuet = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuet(videoRef.current.muted);
  };

  return (
    <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-or-400/50 bg-[#07162b] shadow-2xl shadow-or-500/10">
      {/* Zone Vidéo 16:9 */}
      <div
        onClick={basculerLecture}
        className="group relative aspect-video w-full cursor-pointer bg-black overflow-hidden flex items-center justify-center select-none"
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          preload="metadata"
          onPlay={() => setEnLecture(true)}
          onPause={() => setEnLecture(false)}
          onEnded={() => {
            setEnLecture(false);
            setTermine(true);
          }}
          className="h-full w-full object-cover"
        />

        {/* Voile sombre d'ambiance si en pause */}
        {!enLecture && (
          <div className="absolute inset-0 bg-gradient-to-t from-encre-950/80 via-encre-950/40 to-transparent transition-opacity" />
        )}

        {/* Grand Bouton Play Doré Central si la vidéo est en pause */}
        {!enLecture && !termine && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              basculerLecture();
            }}
            aria-label="Lancer la vidéo"
            className="group/btn relative z-10 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-or-300 via-or-400 to-or-600 text-encre-950 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/60"
          >
            {/* Halo lumineux animé */}
            <span className="absolute -inset-2 rounded-full bg-or-400/30 blur-md animate-pulse" />
            <Play className="relative ml-1 h-7 w-7 sm:h-9 sm:w-9 fill-encre-950 transition-transform group-hover/btn:scale-110" />
          </button>
        )}

        {/* Bouton Rejouer quand la vidéo est terminée */}
        {termine && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              relancer();
            }}
            className="group/btn relative z-10 flex items-center gap-2 rounded-full bg-or-400 px-6 py-3 text-xs font-bold text-encre-950 shadow-2xl transition-all hover:scale-105"
          >
            <RotateCcw className="h-4 w-4" />
            Revoir la présentation
          </button>
        )}

        {/* Contrôle du Son en bas à droite */}
        {enLecture && (
          <button
            type="button"
            onClick={basculerMuet}
            className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 p-2 text-white/90 backdrop-blur-md transition-colors hover:bg-black/80 hover:text-white"
            title={muet ? 'Activer le son' : 'Couper le son'}
          >
            {muet ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
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
