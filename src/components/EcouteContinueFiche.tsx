'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Headphones, X } from 'lucide-react';
import { lireAVoixHaute, arreterLecture, lectureDisponible } from '@/lib/ambiance';
import { getAudioChapitre } from '@/lib/bibleVersions';
import { analyserReference } from '@/lib/reference';

export interface FicheEcoute {
  id: number;
  titre: string;
  sousTitre?: string;
  sections?: {
    titre: string;
    texte: string;
  }[];
  lectures?: string[];
}

interface EcouteContinueFicheProps {
  fiche: FicheEcoute;
  ouvert: boolean;
  onFermer: () => void;
}

interface PisteAudio {
  titre: string;
  type: 'enseignement' | 'bible';
  texte?: string;
  urlAudio?: string;
}

export default function EcouteContinueFiche({
  fiche,
  ouvert,
  onFermer,
}: EcouteContinueFicheProps) {
  const [indexPiste, setIndexPiste] = useState(0);
  const [enLecture, setEnLecture] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Construire la playlist continue
  const playlist: PisteAudio[] = [];

  // 1. Titre et sous-titre
  playlist.push({
    titre: `Introduction : ${fiche.titre}`,
    type: 'enseignement',
    texte: `${fiche.titre}. ${fiche.sousTitre || ''}.`,
  });

  // 2. Sections de l'enseignement
  if (fiche.sections) {
    fiche.sections.forEach((sec, idx) => {
      playlist.push({
        titre: `Section ${idx + 1} : ${sec.titre}`,
        type: 'enseignement',
        texte: `${sec.titre}. ${sec.texte}`,
      });
    });
  }

  // 3. Chapitre biblique de lecture principale
  if (fiche.lectures && fiche.lectures.length > 0) {
    const premiereRef = fiche.lectures[0];
    const parsed = analyserReference(premiereRef);
    if (parsed) {
      playlist.push({
        titre: `Lecture Biblique : ${premiereRef}`,
        type: 'bible',
        urlAudio: getAudioChapitre(parsed.livre.numero, parsed.livre.nom, parsed.chapitre),
      });
    }
  }

  const pisteActuelle = playlist[indexPiste] || playlist[0];

  const jouerPiste = (idx: number) => {
    if (idx < 0 || idx >= playlist.length) {
      setEnLecture(false);
      arreterLecture();
      return;
    }

    setIndexPiste(idx);
    const piste = playlist[idx];

    if (piste.type === 'bible' && piste.urlAudio && audioRef.current) {
      arreterLecture();
      audioRef.current.src = piste.urlAudio;
      audioRef.current
        .play()
        .then(() => setEnLecture(true))
        .catch(() => setEnLecture(false));
    } else if (piste.type === 'enseignement' && piste.texte) {
      if (audioRef.current) audioRef.current.pause();
      if (lectureDisponible()) {
        setEnLecture(true);
        lireAVoixHaute(piste.texte, {
          onFin: () => {
            // Passer automatiquement à la piste suivante en lecture continue
            if (idx + 1 < playlist.length) {
              jouerPiste(idx + 1);
            } else {
              setEnLecture(false);
            }
          },
        });
      }
    }
  };

  const basculerLecture = () => {
    if (enLecture) {
      arreterLecture();
      audioRef.current?.pause();
    } else {
      jouerPiste(indexPiste);
    }
  };

  const pisteSuivante = () => {
    jouerPiste(indexPiste + 1);
  };

  const pistePrecedente = () => {
    jouerPiste(indexPiste - 1);
  };

  useEffect(() => {
    if (!ouvert) {
      arreterLecture();
      audioRef.current?.pause();
    }
  }, [ouvert]);

  if (!ouvert) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] p-4 sm:p-6 flex justify-center">
      <audio
        ref={audioRef}
        onEnded={pisteSuivante}
        onError={() => setEnLecture(false)}
      />

      {/* Lecteur flottant style platine acajou */}
      <div className="nuit nuit-grain relative w-full max-w-2xl overflow-hidden rounded-4xl border border-or-400/30 p-5 text-parchemin-100 shadow-2xl animate-fadeIn">
        <span className="ruban -top-2.5 left-12 -rotate-1 rounded-[2px]" />

        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-or-400/15 text-or-300">
              <Headphones className="h-4 w-4" />
            </span>
            <div>
              <span className="text-3xs font-bold uppercase tracking-[0.2em] text-or-400/80">
                Écoute Continue Mains-libres
              </span>
              <p className="manuscrit text-lg font-bold text-parchemin-100 truncate max-w-xs sm:max-w-md">
                Fiche {fiche.id} · {fiche.titre}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              arreterLecture();
              audioRef.current?.pause();
              setEnLecture(false);
              onFermer();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-parchemin-100/60 hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Piste en cours */}
        <div className="my-4 flex items-center justify-between gap-4 rounded-2xl bg-white/[0.06] p-3.5 border border-white/5">
          <div className="min-w-0">
            <span className="text-3xs font-bold uppercase tracking-wider text-or-300">
              {pisteActuelle?.type === 'bible' ? 'Studio Bible Audio' : 'Enseignement Vocal'} ({indexPiste + 1}/{playlist.length})
            </span>
            <p className="font-serif text-sm font-bold text-white truncate">
              {pisteActuelle?.titre}
            </p>
          </div>

          {enLecture && (
            <div className="flex items-end gap-1 h-5 shrink-0">
              <span className="w-1 bg-or-400 rounded-full animate-bounce h-3" />
              <span className="w-1 bg-or-300 rounded-full animate-bounce h-5" />
              <span className="w-1 bg-or-400 rounded-full animate-bounce h-2" />
            </div>
          )}
        </div>

        {/* Commandes */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={pistePrecedente}
              disabled={indexPiste === 0}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
              title="Précédent"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              onClick={basculerLecture}
              className="inline-flex items-center gap-2 rounded-full bg-or-400 px-5 py-2.5 text-xs font-bold text-encre-950 shadow-md transition-transform hover:scale-105 hover:bg-or-300"
            >
              {enLecture ? (
                <>
                  <Pause className="h-4 w-4 fill-current" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" /> Lancer l’écoute
                </>
              )}
            </button>

            <button
              onClick={pisteSuivante}
              disabled={indexPiste >= playlist.length - 1}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"
              title="Suivant"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <span className="text-3xs text-parchemin-100/50 italic hidden sm:inline font-serif">
            Enchaînement automatique des sections
          </span>
        </div>
      </div>
    </div>
  );
}
