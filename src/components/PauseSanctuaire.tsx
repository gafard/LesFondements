'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, X, Heart } from 'lucide-react';

interface PauseSanctuaireProps {
  ouvert: boolean;
  onFermer: () => void;
  versetSuggestion?: string;
}

type AmbianceType = 'pluie' | 'feu' | 'vent' | 'silence';

export default function PauseSanctuaire({
  ouvert,
  onFermer,
  versetSuggestion,
}: PauseSanctuaireProps) {
  const [dureeTotale, setDureeTotale] = useState<number>(120); // 2 minutes par défaut
  const [tempsRestant, setTempsRestant] = useState<number>(120);
  const [actif, setActif] = useState(false);
  const [ambiance, setAmbiance] = useState<AmbianceType>('vent');
  const [sonActive, setSonActive] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodesRef = useRef<any[]>([]);

  // ── Minuteur ──
  useEffect(() => {
    let interval: any = null;
    if (actif && tempsRestant > 0) {
      interval = setInterval(() => {
        setTempsRestant((prev) => {
          if (prev <= 1) {
            setActif(false);
            jouerCarillonFin();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [actif, tempsRestant]);

  // ── Générateur sonore Web Audio API procédural ──
  const demarrerSon = (type: AmbianceType) => {
    arreterSon();
    if (!sonActive || type === 'silence' || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      if (type === 'vent' || type === 'pluie' || type === 'feu') {
        // Buffer de bruit blanc filtré pour créer l'ambiance naturelle
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();

        if (type === 'vent') {
          filter.type = 'lowpass';
          filter.frequency.value = 320;
          gainNode.gain.value = 0.08;
        } else if (type === 'pluie') {
          filter.type = 'bandpass';
          filter.frequency.value = 800;
          filter.Q.value = 1.2;
          gainNode.gain.value = 0.06;
        } else if (type === 'feu') {
          filter.type = 'lowpass';
          filter.frequency.value = 450;
          gainNode.gain.value = 0.05;
        }

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        whiteNoise.start();

        soundNodesRef.current = [whiteNoise, filter, gainNode];
      }
    } catch {
      /* ignorer */
    }
  };

  const arreterSon = () => {
    soundNodesRef.current.forEach((node) => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch {
        /* ignorer */
      }
    });
    soundNodesRef.current = [];
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch {
        /* ignorer */
      }
    }
  };

  const jouerCarillonFin = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // Accord Do majeur
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.15 + 2.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 2.6);
      });
    } catch {
      /* ignorer */
    }
  };

  useEffect(() => {
    if (actif && sonActive) {
      demarrerSon(ambiance);
    } else {
      arreterSon();
    }
    return () => arreterSon();
  }, [actif, ambiance, sonActive]);

  useEffect(() => {
    if (!ouvert) {
      setActif(false);
      arreterSon();
    }
  }, [ouvert]);

  if (!ouvert) return null;

  const choisirDuree = (secondes: number) => {
    setDureeTotale(secondes);
    setTempsRestant(secondes);
    setActif(false);
  };

  const minutes = Math.floor(tempsRestant / 60);
  const secondes = tempsRestant % 60;
  const progression = ((dureeTotale - tempsRestant) / dureeTotale) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Voile sombre recueilli */}
      <div
        role="presentation"
        aria-hidden="true"
        onClick={() => {
          setActif(false);
          arreterSon();
          onFermer();
        }}
        className="fixed inset-0 bg-encre-950/80 backdrop-blur-md transition-opacity"
      />

      {/* Sanctuaire de recueillement */}
      <div className="nuit nuit-grain relative z-10 w-full max-w-md overflow-hidden rounded-4xl border border-or-400/25 p-7 text-parchemin-100 shadow-2xl text-center">
        <span className="ruban -top-3 left-1/2 -translate-x-1/2 -rotate-1 rounded-[2px]" />
        <span className="vitrail right-[-4rem] top-[-4rem] h-48 w-48 bg-or-400/15" />

        {/* Bouton fermer */}
        <button
          onClick={() => {
            setActif(false);
            arreterSon();
            onFermer();
          }}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-parchemin-100/70 hover:bg-white/20 hover:text-white"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-300/70">
          Pause Sanctuaire
        </span>
        <h3 className="manuscrit mt-1 text-3xl font-bold text-parchemin-100">
          Un temps avec Dieu
        </h3>

        {/* Flamme de bougie vivante animée */}
        <div className="my-6 flex justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center">
            {/* Anneau de progression */}
            <svg className="absolute inset-0 h-full w-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="44"
                className="stroke-white/10 fill-none"
                strokeWidth="4"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                className="stroke-or-400 fill-none transition-all duration-1000"
                strokeWidth="4"
                strokeDasharray="276"
                strokeDashoffset={276 - (276 * progression) / 100}
                strokeLinecap="round"
              />
            </svg>

            {/* Flamme */}
            <div className="relative flex flex-col items-center">
              <div
                className={`h-7 w-4 rounded-full bg-gradient-to-t from-or-600 via-or-400 to-amber-200 shadow-[0_0_24px_rgba(251,191,36,0.8)] transition-transform duration-500 ${
                  actif ? 'animate-pulse scale-110' : 'opacity-60'
                }`}
                style={{ borderRadius: '50% 50% 35% 35% / 60% 60% 40% 40%' }}
              />
              <div className="h-2 w-1.5 bg-encre-900" />
            </div>
          </div>
        </div>

        {/* Temps restant */}
        <p className="font-serif text-4xl font-bold text-or-200 tracking-wider">
          {String(minutes).padStart(2, '0')}:{String(secondes).padStart(2, '0')}
        </p>

        {/* Verset inspirant */}
        <p className="font-serif text-xs italic leading-relaxed text-parchemin-100/70 mt-3 px-4">
          {versetSuggestion || '« Arrêtez, et sachez que je suis Dieu : Je domine sur les nations. » (Ps 46:11)'}
        </p>

        {/* Choix de durées */}
        <div className="mt-6 flex justify-center gap-2">
          {[
            { label: '1 min', sec: 60 },
            { label: '2 min', sec: 120 },
            { label: '5 min', sec: 300 },
          ].map((d) => (
            <button
              key={d.sec}
              onClick={() => choisirDuree(d.sec)}
              className={`rounded-full px-3.5 py-1 text-2xs font-bold transition-all ${
                dureeTotale === d.sec
                  ? 'bg-or-400 text-encre-950 font-bold shadow-xs'
                  : 'bg-white/10 text-parchemin-100/70 hover:bg-white/16 hover:text-parchemin-100'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Sélecteur d'ambiance sonore */}
        <div className="mt-4 flex items-center justify-center gap-2 border-t border-white/10 pt-4">
          <span className="text-3xs font-bold uppercase tracking-wider text-parchemin-100/50 mr-1">
            Ambiance :
          </span>
          {[
            { id: 'vent', label: 'Souffle' },
            { id: 'pluie', label: 'Pluie' },
            { id: 'feu', label: 'Cheminée' },
            { id: 'silence', label: 'Silence' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setAmbiance(item.id as AmbianceType)}
              className={`rounded-lg px-2.5 py-1 text-3xs font-bold transition-colors ${
                ambiance === item.id
                  ? 'bg-white/20 text-or-300'
                  : 'text-parchemin-100/50 hover:text-parchemin-100'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => setSonActive((v) => !v)}
            className="ml-2 rounded-full bg-white/10 p-1 text-parchemin-100/70 hover:text-white"
            title={sonActive ? 'Couper le son' : 'Activer le son'}
          >
            {sonActive ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Commandes Play / Pause / Reset */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setTempsRestant(dureeTotale);
              setActif(false);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-parchemin-100/70 transition-colors hover:bg-white/20 hover:text-white"
            title="Réinitialiser"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActif((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-or-400 px-6 py-3 text-xs font-bold text-encre-950 shadow-md transition-transform hover:scale-105 hover:bg-or-300"
          >
            {actif ? (
              <>
                <Pause className="h-4 w-4 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" /> Entrer dans le silence
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
