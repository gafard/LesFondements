'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Plus,
  X,
  Mic,
  MicOff,
  Volume2,
  Play,
  Pause,
  Sparkles,
  Award,
  Check,
  Radio,
  Share2,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { FICHES_META } from '@/data/fichesMeta';
import { lireAVoixHaute, lectureDisponible } from '@/lib/ambiance';

export interface TemoignageItem {
  id: string;
  auteur: string;
  avatar?: string;
  ficheId?: number;
  texte: string;
  audioUrl?: string;
  amens: number;
  aVote?: boolean;
  date: number;
}

const TEMOIGNAGES_COMMUNAUTE_INITIAUX: TemoignageItem[] = [
  {
    id: 'tem_1',
    auteur: 'Samuel M.',
    ficheId: 1,
    texte: 'La révélation que Dieu est un Père qui règne avec amour inconditionnel a guéri mon anxiété. Je ne cherche plus à performer, mais à demeurer dans sa présence chaque matin.',
    amens: 24,
    date: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'tem_2',
    auteur: 'Esther K.',
    ficheId: 4,
    texte: 'Pendant des années, je vivais dans le légalisme et la culpabilité. Comprendre l’échange divin de la croix à la fiche 5 a complètement transformé ma joie et mon identité en Christ.',
    amens: 38,
    date: Date.now() - 1000 * 60 * 60 * 24 * 7,
  },
  {
    id: 'tem_3',
    auteur: 'Marc & Chantal',
    ficheId: 15,
    texte: 'Vivre ces fiches avec notre cellule de maison nous a soudés d’une manière que nous n’avions jamais expérimentée. Nous portons les fardeaux les uns des autres dans la prière.',
    amens: 42,
    date: Date.now() - 1000 * 60 * 60 * 24 * 12,
  },
];

const CLE_STOCKAGE_TEMOIGNAGES = 'lf.temoignagesCommunautes';

export default function TemoignagesPage() {
  const { user } = useAuth();
  const { group, unlockedStep } = useParcours();
  const [temoignages, setTemoignages] = useState<TemoignageItem[]>(() => {
    if (typeof window === 'undefined') return TEMOIGNAGES_COMMUNAUTE_INITIAUX;
    try {
      const brut = localStorage.getItem(CLE_STOCKAGE_TEMOIGNAGES);
      return brut ? JSON.parse(brut) : TEMOIGNAGES_COMMUNAUTE_INITIAUX;
    } catch {
      return TEMOIGNAGES_COMMUNAUTE_INITIAUX;
    }
  });

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [ficheSelectionnee, setFicheSelectionnee] = useState<number>(1);
  const [texteTemoignage, setTexteTemoignage] = useState('');
  const [modeAudio, setModeAudio] = useState(false);
  const [enEnregistrement, setEnEnregistrement] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioEnLecture, setAudioEnLecture] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CLE_STOCKAGE_TEMOIGNAGES, JSON.stringify(temoignages));
    } catch {
      /* ignorer */
    }
  }, [temoignages]);

  // ── Enregistrement vocal ──
  const demarrerEnregistrement = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioBlobUrl(reader.result as string);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setEnEnregistrement(true);
    } catch {
      alert('Impossible d’accéder au microphone. Veuillez autoriser l’accès.');
    }
  };

  const arreterEnregistrement = () => {
    if (mediaRecorderRef.current && enEnregistrement) {
      mediaRecorderRef.current.stop();
      setEnEnregistrement(false);
    }
  };

  const publier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!texteTemoignage.trim() && !audioBlobUrl) return;

    const nouveau: TemoignageItem = {
      id: 'tem_' + Date.now(),
      auteur: user?.displayName || 'Disciple',
      ficheId: ficheSelectionnee,
      texte: texteTemoignage.trim() || 'Témoignage audio partagé avec la communauté.',
      audioUrl: audioBlobUrl || undefined,
      amens: 1,
      aVote: true,
      date: Date.now(),
    };

    setTemoignages([nouveau, ...temoignages]);
    setTexteTemoignage('');
    setAudioBlobUrl(null);
    setFormulaireOuvert(false);
  };

  const voterAmen = (id: string) => {
    setTemoignages((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const aVote = !t.aVote;
          return {
            ...t,
            amens: aVote ? t.amens + 1 : Math.max(0, t.amens - 1),
            aVote,
          };
        }
        return t;
      })
    );
  };

  const basculerAudio = (t: TemoignageItem) => {
    if (audioEnLecture === t.id) {
      audioPlayerRef.current?.pause();
      setAudioEnLecture(null);
      return;
    }

    if (t.audioUrl && audioPlayerRef.current) {
      audioPlayerRef.current.src = t.audioUrl;
      audioPlayerRef.current
        .play()
        .then(() => setAudioEnLecture(t.id))
        .catch(() => setAudioEnLecture(null));
    } else if (lectureDisponible()) {
      lireAVoixHaute(`${t.auteur} témoigne : ${t.texte}`);
      setAudioEnLecture(t.id);
    }
  };

  return (
    <div className="table-travail min-h-screen pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <audio
        ref={audioPlayerRef}
        onEnded={() => setAudioEnLecture(null)}
        onError={() => setAudioEnLecture(null)}
      />

      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* En-tête */}
        <div className="feuille relative rounded-4xl p-8 sm:p-12 text-center shadow-md border border-parchemin-400">
          <span className="punaise -top-2.5 left-12" />
          <span className="ruban -top-3 right-14 rotate-2 rounded-[2px]" />

          <span className="text-2xs font-bold uppercase tracking-[0.26em] text-or-700">
            Mur Vivant de la Communauté
          </span>
          <h1 className="manuscrit mt-2 text-4xl sm:text-5xl font-bold text-encre-950">
            Ce que Dieu a fait
          </h1>
          <p className="font-serif text-sm sm:text-base text-encre-600 max-w-xl mx-auto mt-2 italic">
            « Racontez parmi les nations sa gloire, parmi tous les peuples ses merveilles ! » (Psaume 96:3)
          </p>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setFormulaireOuvert((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full bg-encre-950 px-6 py-3 text-xs font-bold text-parchemin-100 shadow-md transition-all hover:bg-encre-900 hover:scale-105"
            >
              <Plus className="h-4 w-4 text-or-300" strokeWidth={2.5} />
              {formulaireOuvert ? 'Fermer le formulaire' : 'Déposer un témoignage (Texte ou Voix)'}
            </button>
          </div>
        </div>

        {/* Formulaire de dépôt */}
        {formulaireOuvert && (
          <form
            onSubmit={publier}
            className="feuille relative rounded-3xl border border-or-400/80 p-6 sm:p-8 shadow-xl animate-fadeIn bg-white/95"
          >
            <span className="attache-pince -top-3 left-1/2 -translate-x-1/2" />

            <div className="flex items-center justify-between border-b border-parchemin-300 pb-3 mb-4">
              <h3 className="manuscrit text-2xl font-bold text-encre-950">Votre témoignage</h3>
              <button
                type="button"
                onClick={() => setFormulaireOuvert(false)}
                className="text-encre-400 hover:text-encre-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sélecteur de fiche associée */}
            <div className="mb-4">
              <label className="block text-2xs font-bold uppercase tracking-wider text-encre-600 mb-1.5">
                Fiche concernée
              </label>
              <select
                value={ficheSelectionnee}
                onChange={(e) => setFicheSelectionnee(Number(e.target.value))}
                className="w-full rounded-2xl border border-parchemin-400 bg-white p-3 text-xs font-bold text-encre-900 focus:outline-none"
              >
                {FICHES_META.map((meta) => (
                  <option key={meta.id} value={meta.id}>
                    Fiche {meta.id} · {meta.titre}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone de texte */}
            <div className="mb-4">
              <label className="block text-2xs font-bold uppercase tracking-wider text-encre-600 mb-1.5">
                Récit écrit
              </label>
              <textarea
                value={texteTemoignage}
                onChange={(e) => setTexteTemoignage(e.target.value)}
                placeholder="Racontez comment Dieu vous a touché, délivré ou enseigné..."
                rows={4}
                className="manuscrit w-full rounded-2xl border border-parchemin-300 bg-parchemin-50/50 p-4 text-xl text-encre-950 placeholder-encre-400 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Enregistreur Audio */}
            <div className="mb-6 rounded-2xl border border-or-200 bg-or-50/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-or-700" />
                  <span className="text-xs font-bold text-or-950">Témoignage vocal (Optionnel)</span>
                </div>

                {!enEnregistrement ? (
                  <button
                    type="button"
                    onClick={demarrerEnregistrement}
                    className="inline-flex items-center gap-1.5 rounded-full bg-or-600 px-3.5 py-1.5 text-2xs font-bold text-white hover:bg-or-700"
                  >
                    <Mic className="h-3 w-3" /> Enregistrer ma voix
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={arreterEnregistrement}
                    className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-2xs font-bold text-white animate-pulse"
                  >
                    <MicOff className="h-3 w-3" /> Arrêter l’enregistrement
                  </button>
                )}
              </div>

              {audioBlobUrl && (
                <div className="mt-3 flex items-center gap-2 text-2xs font-semibold text-emerald-800">
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> Enregistrement audio prêt !
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFormulaireOuvert(false)}
                className="rounded-full px-4 py-2 text-xs font-bold text-encre-600 hover:bg-parchemin-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!texteTemoignage.trim() && !audioBlobUrl}
                className="inline-flex items-center gap-2 rounded-full bg-encre-950 px-6 py-2.5 text-xs font-bold text-parchemin-100 shadow-md hover:bg-encre-900 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-or-300" />
                Publier le témoignage
              </button>
            </div>
          </form>
        )}

        {/* Mur des Témoignages */}
        <div className="grid gap-6 sm:grid-cols-2">
          {temoignages.map((t) => {
            const meta = FICHES_META.find((f) => f.id === t.ficheId);
            const estEnLecture = audioEnLecture === t.id;

            return (
              <div
                key={t.id}
                className="feuille relative flex flex-col justify-between overflow-hidden rounded-3xl border border-parchemin-300 p-6 shadow-md transition-all duration-300 hover:shadow-lg"
              >
                <span className="punaise -top-2 left-6" />

                <div>
                  {/* En-tête auteur & fiche */}
                  <div className="flex items-center justify-between border-b border-parchemin-200 pb-3 mb-3">
                    <div>
                      <h4 className="manuscrit text-xl font-bold text-encre-950">{t.auteur}</h4>
                      {meta && (
                        <span className="text-3xs font-bold uppercase tracking-wider text-or-700">
                          Fiche {meta.id} · {meta.titre}
                        </span>
                      )}
                    </div>
                    <span className="text-3xs text-encre-400 font-sans">
                      {new Date(t.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* Récit */}
                  <p className="font-serif text-sm leading-relaxed text-encre-900 italic">
                    « {t.texte} »
                  </p>
                </div>

                {/* Barre d'action basse (Écoute & Amen) */}
                <div className="mt-6 flex items-center justify-between border-t border-parchemin-200 pt-3">
                  {/* Bouton d'écoute audio */}
                  <button
                    type="button"
                    onClick={() => basculerAudio(t)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-2xs font-bold transition-colors ${
                      estEnLecture
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-parchemin-100 text-encre-700 hover:bg-indigo-100 hover:text-indigo-900'
                    }`}
                  >
                    {t.audioUrl ? (
                      estEnLecture ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                    {estEnLecture ? 'Pause' : t.audioUrl ? 'Écouter la voix' : 'Écouter'}
                  </button>

                  {/* Bouton Amen */}
                  <button
                    type="button"
                    onClick={() => voterAmen(t.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-2xs font-bold transition-all ${
                      t.aVote
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-white text-encre-600 border border-parchemin-300 hover:bg-rose-50'
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${t.aVote ? 'fill-current text-rose-600' : ''}`} />
                    <span>{t.amens} Amen</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
