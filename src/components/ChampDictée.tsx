'use client';

import { useState, useRef } from 'react';
import { Mic, Volume2, Loader2, Check, X, Sparkles } from 'lucide-react';
import { useEnregistreurVocal } from '@/lib/transcription';
import { lireAVoixHaute, arreterLecture } from '@/lib/ambiance';

interface ChampDictéeProps {
  valeur: string;
  onEnregistrer: (valeur: string) => void;
  placeholder?: string;
  lignes?: number;
  questionPourAudio?: string;
  theme?: 'sombre' | 'clair';
  label?: string;
  ariaLabel?: string;
}

export default function ChampDictée({
  valeur,
  onEnregistrer,
  placeholder = "Écrivez ou dictez ce que l'Esprit dépose dans votre cœur...",
  lignes = 4,
  questionPourAudio,
  theme = 'sombre',
  label,
  ariaLabel,
}: ChampDictéeProps) {
  const [sauvegarde, setSauvegarde] = useState(false);
  const [lectureQuestion, setLectureQuestion] = useState(false);
  const minuteurSauvegarde = useRef<number | null>(null);

  const changerValeur = (nouvelle: string) => {
    onEnregistrer(nouvelle);
    if (minuteurSauvegarde.current) window.clearTimeout(minuteurSauvegarde.current);
    minuteurSauvegarde.current = window.setTimeout(() => {
      setSauvegarde(true);
      window.setTimeout(() => setSauvegarde(false), 1600);
    }, 600);
  };

  const {
    estEnregistrement,
    estEnTranscription,
    secondes,
    erreur,
    demarrer,
    arreterEtTranscrire,
    annuler,
  } = useEnregistreurVocal((texteTranscrit) => {
    if (!texteTranscrit) return;
    const nouvelleValeur = valeur.trim()
      ? `${valeur.trim()} ${texteTranscrit}`
      : texteTranscrit;
    changerValeur(nouvelleValeur);
  });

  const gererLectureAudio = () => {
    if (!questionPourAudio) return;
    if (lectureQuestion) {
      arreterLecture();
      setLectureQuestion(false);
    } else {
      setLectureQuestion(true);
      lireAVoixHaute(questionPourAudio, {
        onFin: () => setLectureQuestion(false),
        onErreur: () => setLectureQuestion(false),
      });
    }
  };

  const formaterTemps = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const estSombre = theme === 'sombre';

  return (
    <div className="w-full space-y-2">
      {/* Barre d'outils supérieure : Écouter la question & Dictée vocale */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {label ? (
          <span className={`text-xs font-bold ${estSombre ? 'text-or-300' : 'text-encre-800'}`}>
            {label}
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {questionPourAudio && (
            <button
              type="button"
              onClick={gererLectureAudio}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-2xs font-bold transition-colors ${
                lectureQuestion
                  ? 'bg-or-400 text-encre-950 shadow-sm animate-pulse'
                  : estSombre
                    ? 'bg-white/8 text-parchemin-100/75 hover:bg-white/16 hover:text-white'
                    : 'bg-parchemin-200 text-encre-800 hover:bg-parchemin-300'
              }`}
              title="Écouter la question à voix haute"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>{lectureQuestion ? 'Lecture en cours…' : 'Écouter la question'}</span>
            </button>
          )}

          {!estEnregistrement && !estEnTranscription && (
            <button
              type="button"
              onClick={demarrer}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-2xs font-bold transition-all shadow-xs ${
                estSombre
                  ? 'bg-or-500/20 text-or-300 border border-or-400/40 hover:bg-or-500/35 hover:text-or-200'
                  : 'bg-or-100 text-or-950 border border-or-300 hover:bg-or-200'
              }`}
              title="Répondre à la voix (transcription Whisper automatique)"
            >
              <Mic className="h-3.5 w-3.5 text-or-400" />
              <span>Répondre par audio</span>
            </button>
          )}
        </div>
      </div>

      {/* État d'enregistrement actif */}
      {estEnregistrement && (
        <div
          className={`flex items-center justify-between rounded-2xl p-3 border shadow-md animate-fade-in ${
            estSombre
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <div>
              <p className="text-xs font-bold">Enregistrement vocal en cours…</p>
              <p className="text-3xs opacity-80">{formaterTemps(secondes)} · Parlez librement avec votre cœur</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void arreterEtTranscrire()}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-2xs font-bold text-white hover:bg-emerald-500 shadow-sm transition"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Terminer & Transcrire</span>
            </button>
            <button
              type="button"
              onClick={annuler}
              className="rounded-full p-1.5 opacity-70 hover:opacity-100 hover:bg-white/10"
              title="Annuler l'enregistrement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* État de transcription en cours par Whisper */}
      {estEnTranscription && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-3 border shadow-md animate-fade-in ${
            estSombre
              ? 'bg-or-950/40 border-or-400/40 text-or-200'
              : 'bg-or-50 border-or-300 text-or-900'
          }`}
        >
          <Loader2 className="h-4 w-4 animate-spin text-or-400 shrink-0" />
          <p className="text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-or-400" />
            Transcription IA Whisper en cours…
          </p>
        </div>
      )}

      {erreur && (
        <p className="text-2xs font-medium text-rose-400 bg-rose-950/30 px-3 py-1.5 rounded-xl border border-rose-500/20">
          {erreur}
        </p>
      )}

      {/* Zone de texte éditable */}
      <div className="relative">
        <textarea
          value={valeur}
          onChange={(event) => changerValeur(event.target.value)}
          rows={lignes}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={`w-full rounded-2xl p-4 text-sm leading-relaxed outline-none transition ${
            estSombre
              ? 'border border-or-500/30 bg-encre-950/80 text-parchemin-100 placeholder:text-parchemin-100/30 focus:border-or-400'
              : 'border border-parchemin-300 bg-white text-encre-950 placeholder:text-encre-400 focus:border-or-500 shadow-xs'
          }`}
        />

        <div className="mt-1.5 flex items-center justify-between text-3xs">
          <span className={estSombre ? 'text-parchemin-100/50' : 'text-encre-500'}>
            {valeur.trim() ? `${valeur.trim().split(/\s+/).length} mots` : 'Clavier ou micro disponibles'}
          </span>
          {sauvegarde && (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
              <Check className="h-3 w-3" /> Enregistré
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
