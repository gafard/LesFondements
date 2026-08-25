'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, SkipForward, SkipBack, Headphones, X, Sparkles } from 'lucide-react';
import { lireAVoixHaute, arreterLecture, lectureDisponible } from '@/lib/ambiance';
import { getAudioChapitre } from '@/lib/bibleVersions';
import { analyserReference } from '@/lib/reference';
import { chargerManifesteVoix, type Manifeste } from '@/lib/voix';

export interface BlocEcoute {
  index?: number;
  texte?: string;
  type?: string;
}

export interface SectionEcoute {
  index?: number;
  titre: string;
  texte?: string;
  blocs?: BlocEcoute[];
}

export interface ResumeEcoute {
  index?: number;
  titre: string;
  points?: string[];
  texte?: string;
}

export interface QuestionEcoute {
  index?: number;
  texte: string;
}

export interface FicheEcoute {
  id: number;
  titre: string;
  sousTitre?: string;
  sections?: SectionEcoute[];
  resume?: ResumeEcoute[];
  questions?: QuestionEcoute[];
  lectures?: string[];
}

interface EcouteContinueFicheProps {
  fiche: FicheEcoute;
  ouvert: boolean;
  onFermer: () => void;
}

interface PisteAudio {
  id?: string;
  titre: string;
  type: 'enseignement' | 'bible' | 'resume' | 'question';
  source?: 'eleven' | 'humaine' | 'tts' | 'studio';
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
  const [manifeste, setManifeste] = useState<Manifeste | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    void chargerManifesteVoix().then(setManifeste);
  }, []);

  // Construire la playlist continue intégrale avec ElevenLabs et synthèse vocale
  const playlist = useMemo<PisteAudio[]>(() => {
    const list: PisteAudio[] = [];

    // 1. Introduction
    const seuilTrack = manifeste?.pistes[`f${fiche.id}.seuil`];
    list.push({
      id: `f${fiche.id}.seuil`,
      titre: `Introduction : ${fiche.titre}`,
      type: 'enseignement',
      source: seuilTrack ? 'eleven' : 'tts',
      urlAudio: seuilTrack?.url,
      texte: `${fiche.titre}. ${fiche.sousTitre || ''}.`,
    });

    // 2. Sections et paragraphes d'enseignement complets
    if (fiche.sections) {
      fiche.sections.forEach((sec, sIdx) => {
        const secIndex = sec.index ?? sIdx;
        const secTitreTrack = manifeste?.pistes[`f${fiche.id}.s${secIndex}`];

        // Annonce du titre de section
        if (sec.titre) {
          list.push({
            id: `f${fiche.id}.s${secIndex}`,
            titre: `Section ${sIdx + 1} : ${sec.titre}`,
            type: 'enseignement',
            source: secTitreTrack ? 'eleven' : 'tts',
            urlAudio: secTitreTrack?.url,
            texte: sec.titre,
          });
        }

        // Paragraphes de la section
        if (sec.blocs && sec.blocs.length > 0) {
          sec.blocs.forEach((bloc, bIdx) => {
            if (!bloc.texte?.trim()) return;
            const blocIndex = bloc.index ?? bIdx;
            const blocTrack = manifeste?.pistes[`f${fiche.id}.s${secIndex}.b${blocIndex}`];

            list.push({
              id: `f${fiche.id}.s${secIndex}.b${blocIndex}`,
              titre: `${sec.titre || `Section ${sIdx + 1}`} · §${bIdx + 1}`,
              type: 'enseignement',
              source: blocTrack ? 'eleven' : 'tts',
              urlAudio: blocTrack?.url,
              texte: bloc.texte,
            });
          });
        } else if (sec.texte?.trim()) {
          list.push({
            id: `f${fiche.id}.s${secIndex}.texte`,
            titre: `Section ${sIdx + 1} : ${sec.titre}`,
            type: 'enseignement',
            source: 'tts',
            texte: sec.texte,
          });
        }
      });
    }

    // 3. Résumé & Partage (si présent)
    if (fiche.resume && fiche.resume.length > 0) {
      fiche.resume.forEach((res, rIdx) => {
        const resIndex = res.index ?? rIdx;
        const resTrack = manifeste?.pistes[`f${fiche.id}.r${resIndex}`];
        const texteResume = res.texte || [res.titre, ...(res.points || [])].join('. ');

        if (texteResume.trim()) {
          list.push({
            id: `f${fiche.id}.r${resIndex}`,
            titre: `Résumé : ${res.titre}`,
            type: 'resume',
            source: resTrack ? 'eleven' : 'tts',
            urlAudio: resTrack?.url,
            texte: texteResume,
          });
        }
      });
    }

    // 4. Questions de réflexion (si présentes)
    if (fiche.questions && fiche.questions.length > 0) {
      fiche.questions.forEach((q, qIdx) => {
        const qIndex = q.index ?? qIdx;
        const qTrack = manifeste?.pistes[`f${fiche.id}.q${qIndex}`];

        if (q.texte.trim()) {
          list.push({
            id: `f${fiche.id}.q${qIndex}`,
            titre: `Question ${qIdx + 1}`,
            type: 'question',
            source: qTrack ? 'eleven' : 'tts',
            urlAudio: qTrack?.url,
            texte: q.texte,
          });
        }
      });
    }

    // 5. Chapitre biblique en audio studio
    if (fiche.lectures && fiche.lectures.length > 0) {
      const premiereRef = fiche.lectures[0];
      const parsed = analyserReference(premiereRef);
      if (parsed) {
        list.push({
          titre: `Lecture Biblique : ${premiereRef}`,
          type: 'bible',
          source: 'studio',
          urlAudio: getAudioChapitre(parsed.livre.numero, parsed.livre.nom, parsed.chapitre),
        });
      }
    }

    return list;
  }, [fiche, manifeste]);

  const pisteActuelle = playlist[indexPiste] || playlist[0];

  const jouerPiste = (idx: number) => {
    if (idx < 0 || idx >= playlist.length) {
      setEnLecture(false);
      arreterLecture();
      return;
    }

    setIndexPiste(idx);
    const piste = playlist[idx];

    // Une piste sans rien à jouer — un chapitre biblique dont le CDN n'a pas
    // rendu d'adresse — arrêtait toute l'écoute en silence. On passe à la
    // suivante plutôt que de laisser le lecteur figé.
    if (!piste?.urlAudio && !piste?.texte) {
      if (idx + 1 < playlist.length) jouerPiste(idx + 1);
      else setEnLecture(false);
      return;
    }

    if (piste?.urlAudio && audioRef.current) {
      arreterLecture();
      audioRef.current.src = piste.urlAudio;
      audioRef.current
        .play()
        .then(() => setEnLecture(true))
        .catch(() => setEnLecture(false));
    } else if (piste?.texte && lectureDisponible()) {
      if (audioRef.current) audioRef.current.pause();
      setEnLecture(true);
      lireAVoixHaute(piste.texte, {
        onFin: () => {
          if (idx + 1 < playlist.length) {
            jouerPiste(idx + 1);
          } else {
            setEnLecture(false);
          }
        },
        onErreur: () => setEnLecture(false),
      });
    }
  };

  const basculerLecture = () => {
    if (enLecture) {
      arreterLecture();
      audioRef.current?.pause();
      setEnLecture(false);
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

  // À la fermeture : on coupe les sources et on remet le lecteur à plat.
  // Le faire dans le corps de l'effet déclenchait un rendu en cascade ; le
  // nettoyage est l'endroit prévu pour ça.
  useEffect(() => {
    if (!ouvert) return;
    // On capture le lecteur maintenant : au moment du nettoyage, la ref peut
    // déjà pointer ailleurs, et l'ancien continuerait de jouer.
    const lecteur = audioRef.current;
    return () => {
      arreterLecture();
      lecteur?.pause();
      setEnLecture(false);
    };
  }, [ouvert]);

  if (!ouvert) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] p-4 sm:p-6 flex justify-center">
      <audio
        ref={audioRef}
        onEnded={pisteSuivante}
        // Un chapitre indisponible ne doit pas clore la séance : on passe au
        // suivant, comme une platine qui saute un sillon rayé.
        onError={() => {
          if (indexPiste + 1 < playlist.length) jouerPiste(indexPiste + 1);
          else setEnLecture(false);
        }}
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
            <span className="inline-flex items-center gap-1.5 text-3xs font-bold uppercase tracking-wider text-or-300">
              {pisteActuelle?.urlAudio ? (
                <>
                  <Sparkles className="h-3 w-3 text-or-400" />
                  {pisteActuelle.type === 'bible' ? 'Studio Bible Audio' : 'Voix Studio (ElevenLabs)'}
                </>
              ) : (
                'Synthèse vocale'
              )}{' '}
              · Piste {indexPiste + 1}/{playlist.length}
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
