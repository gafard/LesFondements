'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Image as ImageIcon,
  Loader2,
  Pause,
  PenLine,
  Play,
  Quote,
  Sparkles,
  StickyNote,
  SlidersHorizontal,
  Minus,
  Plus,
  Volume2,
  VolumeX,
  X,
  Flame,
  Clock3,
  BookA,
  Mic,
  MicOff,
  Download,
  Copy,
  Brain,
  MousePointerClick,
  NotebookPen,
  LockKeyhole,
} from 'lucide-react';
import ShareableVerseCard from '@/components/ShareableVerseCard';
import TexteAvecReferences from '@/components/ReferenceCliquable';
import Illumination from '@/components/Illumination';
import { Etincelle, MotFantome, Pastille, TraitOrganique } from '@/components/decor';
import {
  AMBIANCES,
  activerDuckingVoix,
  arreterAmbiance,
  arreterLecture,
  jouerAmbiance,
  lectureDisponible,
  lireAVoixHaute,
  getGenreVoix,
  setGenreVoix,
  type GenreVoix,
  type Ambiance,
} from '@/lib/ambiance';
import { texteDuVerset, VERSETS_CONNUS, normaliserReference } from '@/data/versets';
import {
  chargerManifesteVoix,
  pisteId,
  resoudrePiste,
  type Manifeste,
  type Piste,
} from '@/lib/voix';
import {
  chargerManifesteVivienne,
  pisteVivienne,
  type ManifesteVivienne,
} from '@/lib/voixVivienne';
import type { Bloc, FicheLivret, ResumeSection } from '@/lib/livret';
import { memoriserPassage } from '@/lib/marquePage';
import { decouperEnMoments, momentDe, type Moment } from '@/lib/moments';
import {
  annoncerAuSysteme,
  etatDeLecture,
  fairelSilenceAuSysteme,
  frisson,
  garderLEcranEveille,
  laisserLEcranSEteindre,
  suivreLaVisibilite,
} from '@/lib/seance';
import meditationData from '@/data/meditation-questions.json';

// ─────────────────────────────────────────────────────────────
// Le scénario : la fiche devient une suite de moments
// ─────────────────────────────────────────────────────────────

type Scene = { piste?: string } & (
  | { type: 'seuil' }
  | { type: 'ouverture-section'; titre: string; rang: number; total: number }
  | { type: 'bloc'; bloc: Bloc; sousTitre: string | null; section: string | null }
  | { type: 'silence' }
  | { type: 'meditation'; sectionTitre: string; questions: Array<{ id: string; fonction?: string; question: string }> }
  | { type: 'priere'; questions: Array<{ id: string; question: string }> }
  | { type: 'ancrage-verset'; reference: string; texte: string }
  | { type: 'resume'; section: ResumeSection }
  | { type: 'verset'; reference: string; texte: string | null }
  | { type: 'lecture'; texte: string }
  | { type: 'question'; id: string; texte: string; section?: string }
  | { type: 'pas' }
  | { type: 'cloture' }
);

function construireScenario(fiche: FicheLivret, sectionCibleIndex?: number | null): Scene[] {
  if (sectionCibleIndex !== undefined && sectionCibleIndex !== null && sectionCibleIndex >= 0) {
    const section = fiche.sections[sectionCibleIndex];
    if (!section) return [{ type: 'seuil', piste: pisteId.seuil(fiche.id) }, { type: 'cloture' }];

    const scenes: Scene[] = [];
    
    // 1. Ouverture de la section
    if (section.titre) {
      scenes.push({
        type: 'ouverture-section',
        titre: section.titre,
        rang: sectionCibleIndex + 1,
        total: fiche.sections.length,
        piste: pisteId.section(fiche.id, sectionCibleIndex),
      });
    }

    // 2. Paragraphes de la section avec la voix studio
    let sousTitre: string | null = null;
    section.blocs.forEach((bloc, indexBloc) => {
      if (bloc.type === 'sous-titre') {
        sousTitre = bloc.texte;
        return;
      }
      scenes.push({
        type: 'bloc',
        bloc,
        sousTitre,
        section: section.titre,
        piste: pisteId.bloc(fiche.id, sectionCibleIndex, indexBloc),
      });
      sousTitre = null;
    });

    // 3. Silence sacré / recueillement
    scenes.push({ type: 'silence' });

    // 4. Méditation théocentrique
    const ficheQuestions = (meditationData as any[]).find((f) => f.ficheId === fiche.id);
    const secQuestions = ficheQuestions?.sections?.[sectionCibleIndex]?.questions || [
      { id: `f${fiche.id}-s${sectionCibleIndex}-q1`, fonction: 'contempler', question: "Qu'est-ce que ce texte te révèle sur la grandeur et le caractère de Dieu ?" },
      { id: `f${fiche.id}-s${sectionCibleIndex}-q2`, fonction: 'recevoir', question: "Quelle vérité es-tu invité à accueillir et garder dans ton cœur ?" },
      { id: `f${fiche.id}-s${sectionCibleIndex}-q3`, fonction: 'vivre', question: "Si cela est vrai, qu'est-ce que cela change dans ta relation avec Lui ?" },
    ];

    scenes.push({
      type: 'meditation',
      sectionTitre: section.titre || `Étape ${sectionCibleIndex + 1}`,
      questions: secQuestions,
    });

    // 5. Sanctuaire de Prière
    scenes.push({
      type: 'priere',
      questions: secQuestions,
    });

    // 6. Ancrage du Verset & Fond d'écran
    const resumeSec = fiche.resume[sectionCibleIndex];
    const refVerset = resumeSec?.versets?.[0] || 'Ps 46:11';
    const txtVerset = VERSETS_CONNUS[normaliserReference(refVerset)] || texteDuVerset(refVerset) || "Arrêtez, et sachez que je suis Dieu : Je domine sur les nations, je domine sur la terre.";

    scenes.push({
      type: 'ancrage-verset',
      reference: refVerset,
      texte: txtVerset,
    });

    // 7. Mon pas de vie pour aujourd'hui
    scenes.push({ type: 'pas' });

    // 8. Clôture de la section
    scenes.push({ type: 'cloture' });
    return scenes;
  }

  // Comportement intégral original (toutes les sections)
  const scenes: Scene[] = [{ type: 'seuil', piste: pisteId.seuil(fiche.id) }];
  const sectionsAvecTitre = fiche.sections.filter((s) => s.titre);
  fiche.sections.forEach((section, indexSection) => {
    if (section.titre) {
      scenes.push({
        type: 'ouverture-section',
        titre: section.titre,
        rang: sectionsAvecTitre.indexOf(section) + 1,
        total: sectionsAvecTitre.length,
        piste: pisteId.section(fiche.id, indexSection),
      });
    }
    let sousTitre: string | null = null;
    section.blocs.forEach((bloc, indexBloc) => {
      if (bloc.type === 'sous-titre') {
        sousTitre = bloc.texte;
        return;
      }
      scenes.push({
        type: 'bloc',
        bloc,
        sousTitre,
        section: section.titre,
        piste: pisteId.bloc(fiche.id, indexSection, indexBloc),
      });
      sousTitre = null;
    });
  });

  scenes.push({ type: 'silence' });

  fiche.resume.forEach((section, indexSection) => {
    scenes.push({
      type: 'resume',
      section,
      piste: pisteId.resume(fiche.id, indexSection),
    });
    section.versets.forEach((reference) => {
      scenes.push({
        type: 'verset',
        reference,
        texte: texteDuVerset(reference),
        piste: pisteId.verset(reference),
      });
    });
    section.lectures.forEach((texte) => scenes.push({ type: 'lecture', texte }));
  });

  let rangQuestion = 0;
  fiche.resume.forEach((section, indexSection) => {
    section.questions.forEach((texte, index) => {
      scenes.push({
        type: 'question',
        id: `${fiche.id}_${indexSection}_${index}`,
        texte,
        section: section.titre,
        piste: pisteId.question(fiche.id, rangQuestion),
      });
      rangQuestion += 1;
    });
  });
  fiche.questionsLibres.forEach((texte, index) => {
    scenes.push({
      type: 'question',
      id: `${fiche.id}_libre_${index}`,
      texte,
      piste: pisteId.question(fiche.id, rangQuestion),
    });
    rangQuestion += 1;
  });

  scenes.push({ type: 'pas' }, { type: 'cloture' });
  return scenes;
}

// ─────────────────────────────────────────────────────────────

interface ImmersionProps {
  fiche: FicheLivret;
  /** Réponses déjà enregistrées, indexées par clé. */
  reponses: Record<string, string>;
  onEnregistrer: (cle: string, valeur: string) => void;
  onTerminer: () => Promise<void> | void;
  onQuitter: () => void;
  dejaPreparee?: boolean;
  indexInitial?: number;
  sectionIndex?: number | null;
}

export default function Immersion({
  fiche,
  reponses,
  onEnregistrer,
  onTerminer,
  onQuitter,
  dejaPreparee,
  indexInitial = 0,
  sectionIndex = null,
}: ImmersionProps) {
  const scenario = useMemo(() => construireScenario(fiche, sectionIndex), [fiche, sectionIndex]);
  const [index, setIndex] = useState(() =>
    Math.max(0, Math.min(scenario.length - 1, indexInitial))
  );
  const [ambiance, setAmbiance] = useState<Ambiance>('emotional-piano');
  const [lecture, setLecture] = useState(true);
  const [genreVoixLocal, setGenreVoixLocal] = useState<GenreVoix>(() => getGenreVoix());
  const [manifeste, setManifeste] = useState<Manifeste | null>(null);
  const [manifesteVivienne, setManifesteVivienne] = useState<ManifesteVivienne | null>(null);
  const [enchainer, setEnchainer] = useState(false);
  const [cloture, setCloture] = useState(false);
  const [audioEnCours, setAudioEnCours] = useState(false);
  const [audioAvancement, setAudioAvancement] = useState(0);
  const [vitesseVoix, setVitesseVoix] = useState(1);
  const [tailleTexte, setTailleTexte] = useState<'normale' | 'grande' | 'tres-grande'>('normale');
  const [chrome, setChrome] = useState(true);
  const [feuille, setFeuille] = useState(false);
  const [noteOuverte, setNoteOuverte] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const zone = useRef<HTMLDivElement | null>(null);
  const touchDepart = useRef<number | null>(null);

  useEffect(() => {
    void chargerManifesteVoix().then(setManifeste);
    void chargerManifesteVivienne().then(setManifesteVivienne);
  }, []);

  const scene = scenario[index] ?? scenario[0];
  const moments = useMemo(() => decouperEnMoments(scenario), [scenario]);
  const rangMoment = useMemo(() => momentDe(moments, index), [moments, index]);
  const moment = moments[rangMoment];
  const progression = scenario.length > 1 ? index / (scenario.length - 1) : 0;

  useEffect(() => {
    void jouerAmbiance(ambiance, 0.32);
    return () => {
      void arreterAmbiance();
      arreterLecture();
    };
  }, [ambiance]);

  // Audio résolution
  const pisteCourante = useMemo<Piste | null>(() => {
    if (!scene.piste) return null;
    if (genreVoixLocal === 'feminin') {
      const urlVivienne = pisteVivienne(manifesteVivienne, scene.piste);
      if (urlVivienne) {
        return {
          id: scene.piste,
          url: urlVivienne,
          source: 'humaine',
        };
      }
    }
    return resoudrePiste(manifeste, scene.piste);
  }, [scene, manifeste, manifesteVivienne, genreVoixLocal]);

  const aller = useCallback(
    (delta: number) => {
      setIndex((courant) => {
        const suivant = courant + delta;
        if (suivant < 0) return 0;
        if (suivant >= scenario.length) {
          setCloture(true);
          return courant;
        }
        return suivant;
      });
    },
    [scenario.length]
  );

  const jouerVoixScene = useCallback(() => {
    if (!lecture) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    arreterLecture();

    if (pisteCourante) {
      const audio = new Audio(pisteCourante.url);
      audio.playbackRate = vitesseVoix;
      audioRef.current = audio;

      const source = Symbol('immersion-audio');
      activerDuckingVoix(true, source);
      setAudioEnCours(true);

      audio.ontimeupdate = () => {
        if (audio.duration) setAudioAvancement(audio.currentTime / audio.duration);
      };
      audio.onended = () => {
        activerDuckingVoix(false, source);
        setAudioEnCours(false);
        if (enchainer) aller(1);
      };
      audio.onerror = () => {
        activerDuckingVoix(false, source);
        setAudioEnCours(false);
      };
      void audio.play();
    }
  }, [lecture, pisteCourante, vitesseVoix, enchainer, aller]);

  useEffect(() => {
    jouerVoixScene();
  }, [index, jouerVoixScene]);

  const basculerLectureOuPause = () => {
    if (audioEnCours) {
      audioRef.current?.pause();
      setAudioEnCours(false);
    } else {
      jouerVoixScene();
    }
  };

  const debutTouche = (e: React.TouchEvent) => {
    touchDepart.current = e.touches[0].clientX;
  };
  const finTouche = (e: React.TouchEvent) => {
    if (touchDepart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchDepart.current;
    if (diff > 50) aller(-1);
    if (diff < -50) aller(1);
    touchDepart.current = null;
  };

  return (
    <div className="immersion-bureau fixed inset-0 z-[60] overflow-hidden nuit nuit-grain text-parchemin-100">
      <div className="immersion-sous-main absolute inset-3 sm:inset-6" />
      <span className="immersion-ruban absolute left-5 top-0 z-20 hidden h-24 w-10 items-end justify-center pb-4 text-or-200 sm:flex">
        <Bookmark className="h-4 w-4 fill-current" />
      </span>
      <span className="vitrail left-[-10rem] top-[-8rem] h-[30rem] w-[30rem] bg-or-400/10 animate-souffle" />
      <span
        className="vitrail bottom-[-12rem] right-[-8rem] h-[28rem] w-[28rem] bg-encre-400/22 animate-souffle"
        style={{ animationDelay: '2.4s' }}
      />

      {/* ── Console Haute ── */}
      <header
        className="absolute inset-x-0 top-0 z-20 px-4 pt-4 sm:px-8 sm:pt-6"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="immersion-console-haute min-w-0 flex-1 rounded-full border border-white/10 px-4 py-2 shadow-2xl backdrop-blur-xl bg-encre-950/70">
            <p className="truncate text-2xs font-bold text-parchemin-100/70">
              Fiche {fiche.id}
              <span className="mx-1.5 text-parchemin-100/55">·</span>
              <span className="text-or-300 font-bold">{moment?.titre ?? 'Contemplation'}</span>
              <span className="mx-1.5 text-parchemin-100/55">·</span>
              {index + 1}/{scenario.length}
            </p>
            <div className="rail mt-1.5">
              <span style={{ width: `${Math.round(progression * 100)}%` }} />
            </div>
          </div>

          <button
            onClick={() => {
              if (lecture) {
                setLecture(false);
                audioRef.current?.pause();
                arreterLecture();
                setAudioEnCours(false);
              } else {
                setLecture(true);
                jouerVoixScene();
              }
            }}
            aria-label={lecture ? 'Désactiver la voix' : 'Activer la voix'}
            title={lecture ? 'Désactiver la voix' : 'Activer la voix'}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 shadow-2xl backdrop-blur-xl transition-all ${
              lecture
                ? 'bg-or-400 text-encre-950 shadow-or-400/20'
                : 'bg-encre-950/60 text-parchemin-100/70 hover:text-parchemin-100'
            }`}
          >
            {lecture ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setFeuille(true)}
            aria-label="Réglages de l’immersion"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-encre-950/60 text-parchemin-100/70 shadow-2xl backdrop-blur-xl transition-colors hover:text-parchemin-100"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          <button
            onClick={onQuitter}
            aria-label="Quitter l’immersion"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-encre-950/60 text-parchemin-100/70 shadow-2xl backdrop-blur-xl transition-colors hover:text-parchemin-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── Scène Active ── */}
      <div
        ref={zone}
        onTouchStart={debutTouche}
        onTouchEnd={finTouche}
        className="absolute inset-0 z-10 overflow-y-auto px-3 pb-32 pt-24 sm:px-8 sm:pt-32"
      >
        <div className="immersion-page-nuit mx-auto min-h-[calc(100svh-11rem)] max-w-4xl rounded-[1.75rem] border border-or-500/20 px-5 py-6 shadow-2xl sm:px-10 sm:py-8 bg-encre-900/70 backdrop-blur-2xl">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3 text-3xs font-black uppercase tracking-[0.18em] text-or-300/70">
            <span>Atelier intérieur sacré</span>
            <span>{Math.round(progression * 100)} % parcouru</span>
          </div>

          {cloture ? (
            <SceneCloture fiche={fiche} onQuitter={onQuitter} onTerminer={onTerminer} />
          ) : (
            <div key={index} className="animate-reveal">
              <RenduScene
                scene={scene}
                fiche={fiche}
                reponses={reponses}
                onEnregistrer={onEnregistrer}
                dejaPreparee={dejaPreparee}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Barre Basse Navigation / Lecteur ── */}
      {!cloture && (
        <footer
          className="absolute inset-x-0 bottom-0 z-20 px-3 pb-4 sm:px-8 sm:pb-7"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="immersion-console mx-auto flex max-w-4xl items-center justify-between gap-2.5 rounded-full border border-white/12 px-4 py-2.5 shadow-2xl bg-encre-950/80 backdrop-blur-xl">
            <button
              onClick={() => aller(-1)}
              disabled={index === 0}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-parchemin-100/80 hover:bg-white/20 disabled:opacity-20 ${
                index === 0 ? 'invisible pointer-events-none' : ''
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex flex-1 items-center gap-2.5 min-w-0 px-2">
              <button
                onClick={basculerLectureOuPause}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-r from-or-400 to-or-500 text-encre-950 shadow-md transition-transform active:scale-95"
              >
                {audioEnCours ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
              </button>

              <div className="flex-1 flex flex-col justify-center min-w-0">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-or-400 to-or-500 transition-[width] duration-200"
                    style={{
                      width: `${
                        lecture && pisteCourante
                          ? Math.round(audioAvancement * 100)
                          : Math.round(progression * 100)
                      }%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-3xs text-parchemin-100/60">
                  <span className="truncate">
                    {genreVoixLocal === 'feminin' ? 'Voix Vivienne' : 'Voix Studio'} • Musique active
                  </span>
                  <span className="shrink-0 ml-2 font-bold text-or-300">
                    {index + 1} / {scenario.length}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => aller(1)}
              className="bouton-or inline-flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold shadow-md"
            >
              <span>Suivant</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        </footer>
      )}

      {/* Tiroir Réglages */}
      {feuille && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-or-500/30 bg-encre-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif text-xl font-bold titre-or">Réglages de l&apos;immersion</h3>
              <button onClick={() => setFeuille(false)} className="p-1 rounded-full text-parchemin-100/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-or-300 uppercase tracking-wider block mb-2">Choix de la voix</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setGenreVoixLocal('feminin'); setGenreVoix('feminin'); }}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${genreVoixLocal === 'feminin' ? 'bg-or-400 text-encre-950 border-or-400' : 'bg-white/5 border-white/10 text-parchemin-100'}`}
                >
                  👩 Vivienne
                </button>
                <button
                  onClick={() => { setGenreVoixLocal('masculin'); setGenreVoix('masculin'); }}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${genreVoixLocal === 'masculin' ? 'bg-or-400 text-encre-950 border-or-400' : 'bg-white/5 border-white/10 text-parchemin-100'}`}
                >
                  🧔 Studio
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-or-300 uppercase tracking-wider block mb-2">Ambiance musicale</label>
              <div className="grid grid-cols-2 gap-2">
                {AMBIANCES.map((amb) => (
                  <button
                    key={amb.valeur}
                    onClick={() => setAmbiance(amb.valeur)}
                    className={`p-2.5 rounded-xl border text-2xs font-bold text-left transition ${ambiance === amb.valeur ? 'bg-or-500/20 border-or-400 text-or-300' : 'bg-white/5 border-white/10 text-parchemin-100/70'}`}
                  >
                    {amb.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setFeuille(false)}
              className="bouton-or w-full py-3 rounded-full text-xs font-bold mt-2"
            >
              Fermer les réglages
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Rendu dynamique de chaque scène
// ─────────────────────────────────────────────────────────────

function RenduScene({
  scene,
  fiche,
  reponses,
  onEnregistrer,
  dejaPreparee,
}: {
  scene: Scene;
  fiche: FicheLivret;
  reponses: Record<string, string>;
  onEnregistrer: (cle: string, valeur: string) => void;
  dejaPreparee?: boolean;
}) {
  switch (scene.type) {
    case 'seuil':
      return <SceneSeuil fiche={fiche} />;

    case 'ouverture-section':
      return (
        <div className="relative py-12 text-center sm:py-20">
          <MotFantome tone="nuit" haut="10%" gauche="50%" taille="clamp(8rem, 24vw, 18rem)" className="-translate-x-1/2">
            {String(scene.rang)}
          </MotFantome>
          <div className="relative z-10">
            <Pastille tone="nuit">
              <Etincelle taille={12} />
              Partie {scene.rang} sur {scene.total}
            </Pastille>
            <h2 className="mt-6 font-serif text-4xl font-bold leading-tight titre-or sm:text-5xl">
              {scene.titre}
            </h2>
            <span className="mx-auto mt-8 block h-px w-24 bg-gradient-to-r from-transparent via-or-400 to-transparent" />
          </div>
        </div>
      );

    case 'bloc':
      return <SceneBloc scene={scene} />;

    case 'silence':
      return <SceneSilence />;

    case 'meditation':
      return (
        <div className="py-6 space-y-6">
          <div className="border-b border-or-500/20 pb-3">
            <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-300">
              Méditation Théocentrique
            </span>
            <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-bold titre-or">
              Regarder à Dieu & Sa Vérité
            </h2>
          </div>

          <div className="space-y-5">
            {scene.questions.map((q, idx) => (
              <div key={q.id || idx} className="rounded-2xl p-5 border border-or-500/20 bg-encre-950/60 space-y-3 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-0.5 rounded bg-or-500/15 border border-or-400/30 text-or-300 inline-block">
                  Question {idx + 1}
                </span>
                <label className="block font-serif text-base font-bold text-parchemin-100 leading-snug">
                  <TexteAvecReferences tone="nuit">{q.question}</TexteAvecReferences>
                </label>
                <textarea
                  value={reponses[`q:${q.id}`] ?? ''}
                  onChange={(e) => onEnregistrer(`q:${q.id}`, e.target.value)}
                  rows={3}
                  placeholder="Ce que l'Esprit dépose dans ton cœur..."
                  className="w-full rounded-xl border border-or-500/25 bg-encre-950/80 p-3 text-sm text-parchemin-100 outline-none focus:border-or-400 placeholder:text-parchemin-100/30"
                />
              </div>
            ))}
          </div>
        </div>
      );

    case 'priere':
      return (
        <div className="py-6 text-center space-y-6">
          <div className="inline-flex p-3.5 rounded-full bg-or-500/20 border border-or-400/40 text-or-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Flame className="w-8 h-8 animate-pulse text-or-400" />
          </div>
          <h2 className="font-serif text-3xl font-bold titre-or">
            Le Sanctuaire de Prière
          </h2>
          <p className="text-xs text-parchemin-200/75 max-w-md mx-auto leading-relaxed">
            Dépose tes découvertes devant ton Père céleste. Parle-lui avec amour et vérité.
          </p>

          <div className="space-y-3 text-left max-w-xl mx-auto">
            {scene.questions.map((q) => {
              const val = reponses[`q:${q.id}`]?.trim();
              if (!val) return null;
              return (
                <blockquote key={q.id} className="rounded-2xl border border-or-400/30 bg-or-500/10 p-4 shadow-sm">
                  <p className="font-serif italic text-base text-parchemin-100">« {val} »</p>
                </blockquote>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {['Adorer', 'Remercier', 'Confesser', 'Demander', 'Écouter', 'Remettre'].map((v) => (
              <span key={v} className="px-3 py-1 rounded-full border border-or-500/30 text-or-200 text-xs font-bold uppercase tracking-wider bg-encre-950/80">
                {v}
              </span>
            ))}
          </div>
        </div>
      );

    case 'ancrage-verset':
      return <SceneAncrageVerset reference={scene.reference} texte={scene.texte} />;

    case 'pas':
      return (
        <div className="py-6 space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-or-400">
            <NotebookPen className="w-4 h-4" /> Poser mon pas de vie
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold titre-or leading-snug">
            Si cette vérité sur Dieu est réelle, comment vas-tu vivre avec Lui aujourd'hui ?
          </h2>
          <ChampEcriture
            valeur={reponses[`pas:${fiche.id}`] ?? ''}
            onEnregistrer={(valeur) => onEnregistrer(`pas:${fiche.id}`, valeur)}
            placeholder="Ex : M'approcher de Lui avec confiance, déposer telle inquiétude, poser tel geste d'obéissance..."
            lignes={4}
          />
        </div>
      );

    case 'cloture':
      return <SceneCloture fiche={fiche} onQuitter={() => {}} />;

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Scène Ancrage du Verset avec les 4 niveaux & Fond d'écran
// ─────────────────────────────────────────────────────────────

function SceneAncrageVerset({ reference, texte }: { reference: string; texte: string }) {
  const [niveau, setNiveau] = useState<1 | 2 | 3 | 4>(1);
  const [copie, setCopie] = useState(false);
  const [micActif, setMicActif] = useState(false);
  const [texteMic, setTexteMic] = useState('');

  const words = texte.split(' ');
  const motsATrous = useMemo(() => {
    return words.map((w, idx) => ({ word: w, isGap: idx % 3 === 1 && w.length > 2 }));
  }, [texte]);

  const initiales = useMemo(() => {
    return words.map((w) => (w.length <= 1 ? w : w[0] + '...')).join(' ');
  }, [words]);

  const toggleMic = () => {
    if (micActif) { setMicActif(false); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Reconnaissance vocale non disponible sur ce navigateur.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'fr-FR';
    rec.onstart = () => setMicActif(true);
    rec.onresult = (e: any) => { setTexteMic(e.results[0][0].transcript); setMicActif(false); };
    rec.onerror = () => setMicActif(false);
    rec.onend = () => setMicActif(false);
    rec.start();
  };

  const telechargerFondEcran = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 0, 1920);
    grad.addColorStop(0, '#0c0a08'); grad.addColorStop(0.5, '#1e160e'); grad.addColorStop(1, '#090806');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1920);

    const rad = ctx.createRadialGradient(540, 960, 50, 540, 960, 650);
    rad.addColorStop(0, 'rgba(217, 119, 6, 0.22)'); rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rad; ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = 'rgba(245, 158, 11, 0.85)'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('LES FONDEMENTS • UN TEMPS À PART', 540, 500);

    ctx.fillStyle = '#f59e0b'; ctx.font = '64px sans-serif'; ctx.fillText('✝', 540, 620);
    ctx.fillStyle = '#fdf8eb'; ctx.font = 'italic 52px Georgia, serif';

    const wds = `« ${texte} »`.split(' ');
    let line = '', y = 800;
    for (let n = 0; n < wds.length; n++) {
      const test = line + wds[n] + ' ';
      if (ctx.measureText(test).width > 880 && n > 0) {
        ctx.fillText(line, 540, y); line = wds[n] + ' '; y += 80;
      } else { line = test; }
    }
    ctx.fillText(line, 540, y);

    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 38px sans-serif';
    ctx.fillText(reference, 540, y + 120);

    const link = document.createElement('a');
    link.download = `verset-${reference.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="py-6 space-y-5 text-center">
      <div className="flex items-center justify-between border-b border-or-500/20 pb-3">
        <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-300">
          Ancrer la Parole
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(`« ${texte} » (${reference})`); setCopie(true); setTimeout(() => setCopie(false), 2000); }}
            className="p-1 text-or-200/70 hover:text-or-300"
          >
            {copie ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={() => lireAVoixHaute(texte)} className="p-1 text-or-200/70 hover:text-or-300">
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs font-bold uppercase tracking-wider text-or-400">{reference}</p>

      {/* Rendu du niveau */}
      <div className="min-h-[140px] flex items-center justify-center py-4">
        {niveau === 1 && <p className="font-serif text-xl sm:text-2xl text-parchemin-100 italic leading-relaxed">« {texte} »</p>}
        {niveau === 2 && (
          <p className="font-serif text-lg sm:text-xl leading-loose text-parchemin-100">
            {motsATrous.map((m, idx) => (
              <span key={idx} className="mx-1">
                {m.isGap ? <span className="bg-or-500/25 text-or-300 px-2 py-0.5 rounded font-bold border-b-2 border-or-400">[ ... ]</span> : m.word}
              </span>
            ))}
          </p>
        )}
        {niveau === 3 && <p className="font-serif text-lg sm:text-xl text-or-300 tracking-wider font-medium">{initiales}</p>}
        {niveau === 4 && (
          <div className="space-y-3 w-full">
            <button
              onClick={toggleMic}
              className={`p-4 rounded-full mx-auto flex items-center justify-center shadow-lg transition ${micActif ? 'bg-rose-600 text-white animate-pulse' : 'bg-or-400 text-encre-950'}`}
            >
              {micActif ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            {texteMic && <p className="text-sm italic text-or-200">« {texteMic} »</p>}
          </div>
        )}
      </div>

      {/* Boutons Niveaux */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
        {[
          { lvl: 1, title: 'Niveau 1', sub: 'Lecture' },
          { lvl: 2, title: 'Niveau 2', sub: 'Mots à trous' },
          { lvl: 3, title: 'Niveau 3', sub: 'Initiales' },
          { lvl: 4, title: 'Niveau 4', sub: 'Microphone' },
        ].map((item) => (
          <button
            key={item.lvl}
            onClick={() => setNiveau(item.lvl as any)}
            className={`p-2 rounded-xl border text-xs font-bold transition ${niveau === item.lvl ? 'bg-or-400 text-encre-950 border-or-400' : 'bg-encre-950/60 border-or-500/20 text-parchemin-100/70'}`}
          >
            {item.title}
          </button>
        ))}
      </div>

      {/* Bouton Fond d'écran */}
      <div className="pt-3">
        <button
          onClick={telechargerFondEcran}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-or-500/30 bg-or-500/10 text-or-300 text-xs font-bold hover:bg-or-500/20 transition"
        >
          <Download className="w-3.5 h-3.5" /> Télécharger comme fond d'écran
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function SceneSeuil({ fiche }: { fiche: FicheLivret }) {
  return (
    <div className="relative py-8 text-center sm:py-12">
      <MotFantome tone="nuit" haut="-4%" gauche="50%" taille="clamp(11rem, 34vw, 26rem)" className="-translate-x-1/2">
        {String(fiche.id).padStart(2, '0')}
      </MotFantome>
      <Illumination fiche={fiche.id} taille={172} anime className="relative z-10 mx-auto" />
      <span className="relative z-10 mt-6 block text-2xs font-bold uppercase tracking-[0.28em] text-or-300/60">
        Fiche {fiche.id} · Sanctuaire de contemplation
      </span>
      <h1 className="relative z-10 mt-4 font-serif text-4xl font-bold leading-[1.08] text-parchemin-100 sm:text-6xl">
        <span className="titre-or">{fiche.titre}</span>
      </h1>
      <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-parchemin-100/65 sm:text-base">
        {fiche.sousTitre}
      </p>
    </div>
  );
}

function SceneBloc({ scene }: { scene: { bloc: Bloc; sousTitre: string | null; section: string | null } }) {
  const { bloc, sousTitre, section } = scene;
  if (bloc.type === 'citation') {
    return (
      <blockquote className="my-8 rounded-3xl border border-or-300/30 bg-or-400/8 px-6 py-6 font-serif text-lg italic text-or-100/95 sm:text-xl">
        <TexteAvecReferences tone="nuit">{bloc.texte}</TexteAvecReferences>
      </blockquote>
    );
  }
  return (
    <div className="py-8 sm:py-12">
      {sousTitre && <h3 className="mb-5 font-serif text-2xl font-bold text-or-300 sm:text-3xl">{sousTitre}</h3>}
      <p className="text-lg leading-[1.85] text-parchemin-100/88 sm:text-xl sm:leading-[1.9]">
        <TexteAvecReferences tone="nuit">{bloc.texte}</TexteAvecReferences>
      </p>
    </div>
  );
}

function SceneSilence() {
  const [secondes, setSecondes] = useState(45);
  const [encours, setEncours] = useState(true);

  useEffect(() => {
    if (!encours || secondes === 0) return;
    const timer = window.setTimeout(() => setSecondes((v) => v - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [encours, secondes]);

  return (
    <div className="py-14 text-center sm:py-24">
      <span className="text-2xs font-bold uppercase tracking-[0.28em] text-or-300/55">
        L&apos;exposé est lu
      </span>
      <h2 className="mt-5 font-serif text-3xl font-bold leading-tight titre-or sm:text-4xl">
        Restez là un instant.
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-parchemin-100/60">
        Avant de répondre à quoi que ce soit. Laissez la Parole s'enraciner dans le silence.
      </p>

      <button
        onClick={() => setEncours((v) => !v)}
        className="group relative mx-auto mt-10 grid h-36 w-36 place-items-center"
      >
        <span className={`absolute inset-0 rounded-full border border-or-400/30 ${encours ? 'animate-souffle' : ''}`} />
        <span className="font-serif text-4xl font-bold text-or-300">{secondes}s</span>
      </button>
    </div>
  );
}

function ChampEcriture({
  valeur,
  onEnregistrer,
  placeholder,
  lignes,
}: {
  valeur: string;
  onEnregistrer: (valeur: string) => void;
  placeholder: string;
  lignes: number;
}) {
  return (
    <div className="mt-4">
      <textarea
        value={valeur}
        onChange={(event) => onEnregistrer(event.target.value)}
        rows={lignes}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-or-500/30 bg-encre-950/80 p-4 text-base text-parchemin-100 outline-none focus:border-or-400"
      />
    </div>
  );
}

function SceneCloture({
  fiche,
  onQuitter,
  onTerminer,
}: {
  fiche: FicheLivret;
  onQuitter: () => void;
  onTerminer?: () => void;
}) {
  return (
    <div className="animate-reveal py-16 text-center sm:py-24 space-y-6">
      <span className="mx-auto grid h-20 w-20 animate-halo place-items-center rounded-full bg-or-400/15 text-or-300">
        <Check className="h-9 w-9" strokeWidth={2} />
      </span>
      <h2 className="font-serif text-4xl font-bold leading-tight text-parchemin-100 sm:text-5xl">
        Temps à part <span className="titre-or">accompli.</span>
      </h2>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-parchemin-100/65">
        Tes réflexions, ton verset et ton pas de foi sont précieusement archivés dans ton Carnet Spirituel.
      </p>
      <button
        onClick={() => {
          onTerminer?.();
          onQuitter();
        }}
        className="bouton-or inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold shadow-xl"
      >
        Valider et revenir à ma semaine
      </button>
    </div>
  );
}

export function ChargementImmersion() {
  return (
    <div className="nuit fixed inset-0 z-[60] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-or-300" />
        <p className="text-2xs text-parchemin-100/50">Ouverture de l'immersion…</p>
      </div>
    </div>
  );
}
