'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Mic, MicOff, RotateCcw, Sparkles } from 'lucide-react';

interface RecitationVocaleProps {
  reference: string;
  texteCible: string;
  onSucces?: () => void;
  onScore?: (score: number) => void;
}

interface SpeechResultEvent {
  results: ArrayLike<{ 0: { transcript: string } }>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type WindowAvecReconnaissance = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function normaliserMot(mot: string): string {
  return mot
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents pour comparaison souple
    .replace(/[^a-z0-9]/g, '');
}

export default function RecitationVocale({
  reference,
  texteCible,
  onSucces,
  onScore,
}: RecitationVocaleProps) {
  const [enEcoute, setEnEcoute] = useState(false);
  const [motsReconnus, setMotsReconnus] = useState<number>(0);
  const [termine, setTermine] = useState(false);
  const [supporte] = useState(() => {
    if (typeof window === 'undefined') return true;
    const vocal = window as WindowAvecReconnaissance;
    return Boolean(vocal.SpeechRecognition || vocal.webkitSpeechRecognition);
  });
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const motsCibles = useMemo(() => texteCible.split(/\s+/).filter(Boolean), [texteCible]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vocal = window as WindowAvecReconnaissance;
    const SpeechRecognition = vocal.SpeechRecognition || vocal.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechResultEvent) => {
      let texteTotal = '';
      for (let i = 0; i < event.results.length; i++) {
        texteTotal += event.results[i][0].transcript + ' ';
      }

      // Comparaison mot à mot
      const motsParles = texteTotal
        .split(/\s+/)
        .map(normaliserMot)
        .filter(Boolean);

      let indexCible = 0;
      for (const motParle of motsParles) {
        if (indexCible < motsCibles.length) {
          const motAttendu = normaliserMot(motsCibles[indexCible]);
          if (motParle === motAttendu || motParle.includes(motAttendu) || motAttendu.includes(motParle)) {
            indexCible++;
          }
        }
      }

      setMotsReconnus(indexCible);
      onScore?.(Math.min(100, Math.round((indexCible / Math.max(1, motsCibles.length)) * 100)));

      if (indexCible >= motsCibles.length && !termine) {
        setTermine(true);
        recognition.stop();
        setEnEcoute(false);
        if (onSucces) onSucces();
      }
    };

    recognition.onerror = () => {
      setEnEcoute(false);
    };

    recognition.onend = () => {
      setEnEcoute(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        /* ignorer */
      }
    };
  }, [motsCibles, onScore, onSucces, termine]);

  const basculerEcoute = () => {
    if (!recognitionRef.current) return;
    if (enEcoute) {
      recognitionRef.current.stop();
      setEnEcoute(false);
    } else {
      setMotsReconnus(0);
      setTermine(false);
      try {
        recognitionRef.current.start();
        setEnEcoute(true);
      } catch {
        setEnEcoute(false);
      }
    }
  };

  const recommencer = () => {
    if (recognitionRef.current && enEcoute) {
      recognitionRef.current.stop();
      setEnEcoute(false);
    }
    setMotsReconnus(0);
    setTermine(false);
  };

  if (!supporte) {
    return (
      <div className="rounded-2xl bg-amber-50 p-4 text-center text-xs text-amber-900 border border-amber-200">
        La reconnaissance vocale n’est pas disponible sur ce navigateur. Utilisez Chrome ou Safari pour réciter à voix haute.
      </div>
    );
  }

  const pourcentage = Math.min(100, Math.round((motsReconnus / (motsCibles.length || 1)) * 100));

  return (
    <div className="space-y-4 rounded-3xl border border-or-300/60 bg-white/90 p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-parchemin-300 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-or-100 text-or-800">
            <Mic className="h-3.5 w-3.5" />
          </span>
          <span className="text-2xs font-bold uppercase tracking-wider text-encre-600">
            Récitation vocale · {reference}
          </span>
        </div>
        <span className="rounded-full bg-or-50 px-2.5 py-0.5 text-2xs font-bold text-or-800 border border-or-200">
          {pourcentage}% mémorisé
        </span>
      </div>

      {/* Rendu des mots illuminés */}
      <div className="font-serif text-base leading-loose sm:text-lg">
        {motsCibles.map((mot, idx) => {
          const estPrononce = idx < motsReconnus;
          const estActuel = idx === motsReconnus && enEcoute;

          return (
            <span
              key={idx}
              className={`inline-block mx-1 my-0.5 rounded-lg px-1.5 py-0.5 transition-all duration-300 ${
                estPrononce
                  ? 'bg-emerald-100 text-emerald-950 font-semibold shadow-2xs scale-105'
                  : estActuel
                  ? 'bg-or-200 text-or-950 ring-2 ring-or-400 font-bold animate-pulse'
                  : 'text-encre-300'
              }`}
            >
              {mot}
            </span>
          );
        })}
      </div>

      {/* Message de victoire */}
      {termine && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 border border-emerald-200 animate-bounce">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          Gloire à Dieu ! Vous avez proclamé ce verset de mémoire avec succès.
        </div>
      )}

      {/* Barre d'action */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={basculerEcoute}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold shadow-xs transition-all ${
            enEcoute
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {enEcoute ? (
            <>
              <MicOff className="h-4 w-4" /> Arrêter l’écoute
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" /> Commencer à réciter
            </>
          )}
        </button>

        <button
          type="button"
          onClick={recommencer}
          className="inline-flex items-center gap-1.5 rounded-full bg-parchemin-200 px-3.5 py-2 text-2xs font-bold text-encre-700 hover:bg-parchemin-300"
          title="Réinitialiser"
        >
          <RotateCcw className="h-3 w-3" /> Recommencer
        </button>
      </div>
    </div>
  );
}
