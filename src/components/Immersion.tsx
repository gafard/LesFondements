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
} from 'lucide-react';
import ShareableVerseCard from '@/components/ShareableVerseCard';
import TexteAvecReferences from '@/components/ReferenceCliquable';
import Illumination from '@/components/Illumination';
import { Etincelle, MotFantome, Pastille, TraitOrganique } from '@/components/decor';
import {
  AMBIANCES,
  arreterAmbiance,
  arreterLecture,
  jouerAmbiance,
  lectureDisponible,
  lireAVoixHaute,
  type Ambiance,
} from '@/lib/ambiance';
import { texteDuVerset } from '@/data/versets';
import {
  chargerManifesteVoix,
  pisteId,
  resoudrePiste,
  type Manifeste,
  type Piste,
} from '@/lib/voix';
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

// ─────────────────────────────────────────────────────────────
// Le scénario : la fiche devient une suite de moments
// ─────────────────────────────────────────────────────────────

type Scene = { piste?: string } & (
  | { type: 'seuil' }
  | { type: 'ouverture-section'; titre: string; rang: number; total: number }
  | { type: 'bloc'; bloc: Bloc; sousTitre: string | null; section: string | null }
  | { type: 'silence' }
  | { type: 'resume'; section: ResumeSection }
  | { type: 'verset'; reference: string; texte: string | null }
  | { type: 'lecture'; texte: string }
  | { type: 'question'; id: string; texte: string; section?: string }
  | { type: 'pas' }
  | { type: 'cloture' }
);

function construireScenario(fiche: FicheLivret): Scene[] {
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
        // L'identifiant suit la position dans le livret : c'est le même
        // calcul que dans scripts/generer-voix.mjs.
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

  // Les questions sont numérotées d'un seul tenant, résumés puis questions
  // libres — dans le même ordre que la génération des voix.
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
}

export default function Immersion({
  fiche,
  reponses,
  onEnregistrer,
  onTerminer,
  onQuitter,
  dejaPreparee,
  indexInitial = 0,
}: ImmersionProps) {
  const scenario = useMemo(() => construireScenario(fiche), [fiche]);
  const [index, setIndex] = useState(() =>
    Math.max(0, Math.min(scenario.length - 1, indexInitial))
  );
  const [ambiance, setAmbiance] = useState<Ambiance>('silence');
  const [lecture, setLecture] = useState(false);
  const [manifeste, setManifeste] = useState<Manifeste | null>(null);
  const [enchainer, setEnchainer] = useState(false);
  const [cloture, setCloture] = useState(false);
  const [audioEnCours, setAudioEnCours] = useState(false);
  const [audioAvancement, setAudioAvancement] = useState(0);
  const [noteOuverte, setNoteOuverte] = useState(false);
  // Le chrome s'efface pour laisser la scène seule ; un toucher le rappelle.
  const [chrome, setChrome] = useState(true);
  const [feuille, setFeuille] = useState(false);
  /** Confort de lecture, de 0,9 à 1,3. */
  const [taille, setTaille] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const zone = useRef<HTMLDivElement>(null);
  const depart = useRef<number | null>(null);

  const scene = scenario[index];
  const progression = (index + 1) / scenario.length;

  const libelleScene = useMemo(() => {
    switch (scene.type) {
      case 'seuil': return 'Ouverture de la fiche';
      case 'ouverture-section': return scene.titre;
      case 'bloc': return scene.sousTitre ?? scene.section ?? 'Lecture guidée';
      case 'silence': return 'Temps de silence';
      case 'resume': return `L’essentiel — ${scene.section.titre}`;
      case 'verset': return scene.reference;
      case 'lecture': return 'Lecture dans votre Bible';
      case 'question': return 'Écriture personnelle';
      case 'pas': return 'Mon pas de la semaine';
      case 'cloture': return 'Clôture de la fiche';
    }
  }, [scene]);

  const texteDeLaScene = useCallback((courante: Scene): string | null => {
    switch (courante.type) {
      case 'bloc':
        return `${courante.sousTitre ? `${courante.sousTitre}. ` : ''}${courante.bloc.oral ?? courante.bloc.texte}`;
      case 'ouverture-section':
        return courante.titre;
      case 'resume':
        return `${courante.section.titre}. ${courante.section.points.join(' ')}`;
      case 'verset':
        return courante.texte ? `${courante.reference}. ${courante.texte}` : null;
      case 'question':
        return courante.texte;
      default:
        return null;
    }
  }, []);

  // ── Les moments ─────────────────────────────────────────────
  // « 17/55 · 38 min » dit la vérité et décourage. Le scénario se regroupe
  // en temps nommés — entrer, écouter, méditer, mémoriser, écrire, conclure
  // — dont chacun se tient d'une traite.
  const moments = useMemo(
    () => decouperEnMoments(scenario.map((s) => ({ type: s.type, texte: texteDeLaScene(s) }))),
    [scenario, texteDeLaScene]
  );
  const rangMoment = momentDe(moments, index);
  const moment = moments[rangMoment];

  // ── Effacement du chrome ────────────────────────────────────
  // La scène doit pouvoir rester seule. Les commandes s'effacent après
  // quelques secondes ; un toucher n'importe où les rappelle. Elles
  // reviennent aussi à chaque changement de scène — le temps de se
  // repérer — ce que `aller` se charge de faire.
  useEffect(() => {
    if (!chrome || feuille || noteOuverte) return;
    const minuterie = window.setTimeout(() => setChrome(false), 4000);
    return () => window.clearTimeout(minuterie);
  }, [chrome, feuille, noteOuverte, index]);

  // ── L'écran et les commandes du système ─────────────────────
  // Une immersion dure dix minutes, dont une partie sans toucher l'écran.
  // Sans ces deux-là, le téléphone s'éteint au milieu d'un silence et la
  // lecture s'arrête au verrouillage.
  useEffect(() => {
    void garderLEcranEveille();
    const cesser = suivreLaVisibilite();
    return () => {
      cesser();
      laisserLEcranSEteindre();
      fairelSilenceAuSysteme();
    };
  }, []);

  // ── Navigation ──────────────────────────────────────────────
  const aller = useCallback(
    (delta: number) => {
      // On change de scène : les commandes reviennent le temps de se repérer.
      setChrome(true);
      arreterLecture();
      setIndex((valeur) => Math.max(0, Math.min(scenario.length - 1, valeur + delta)));
    },
    [scenario.length]
  );

  useEffect(() => {
    zone.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [index]);

  // Ce qui joue, décrit au système : l'écran verrouillé et les écouteurs
  // affichent le moment en cours et commandent la navigation.
  useEffect(() => {
    annoncerAuSysteme(libelleScene, `Fiche ${fiche.id} · ${moment?.titre ?? ''}`.trim(), {
      precedent: () => aller(-1),
      suivant: () => aller(1),
      jouer: () => void audioRef.current?.play(),
      pause: () => audioRef.current?.pause(),
    });
  }, [libelleScene, fiche.id, moment?.titre, aller]);

  useEffect(() => {
    etatDeLecture(audioEnCours);
  }, [audioEnCours]);

  // Un frisson très bref au passage d'un moment : le corps sait qu'une
  // étape est franchie sans qu'on ait à le lire.
  useEffect(() => {
    if (rangMoment > 0) frisson();
  }, [rangMoment]);

  useEffect(() => {
    memoriserPassage({
      url: `/fiches/${fiche.id}?immersion=1&scene=${index}`,
      titre: scene.type === 'verset' ? scene.reference : `Fiche ${fiche.id}`,
      sousTitre: libelleScene,
      type: scene.type === 'verset' ? 'verset' : 'immersion',
    });
  }, [fiche.id, index, libelleScene, scene]);

  useEffect(() => {
    const auClavier = (event: KeyboardEvent) => {
      const cible = event.target as HTMLElement | null;
      if (cible && ['TEXTAREA', 'INPUT'].includes(cible.tagName)) return;
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        aller(1);
      } else if (event.key === 'ArrowLeft') {
        aller(-1);
      } else if (event.key === 'Escape') {
        // Quand la feuille est ouverte, Échap la referme — elle a son propre
        // écouteur. Sinon la touche fait ce qu'on attend d'un plein écran :
        // elle en sort.
        if (!feuille) onQuitter();
      }
    };
    window.addEventListener('keydown', auClavier);
    return () => window.removeEventListener('keydown', auClavier);
  }, [aller, feuille, onQuitter]);

  // ── Ambiance et voix ────────────────────────────────────────
  useEffect(() => {
    void chargerManifesteVoix().then(setManifeste);
  }, []);

  useEffect(() => {
    void jouerAmbiance(ambiance);
  }, [ambiance]);

  useEffect(
    () => () => {
      void arreterAmbiance();
      arreterLecture();
    },
    []
  );

  /**
   * La voix off de la scène : l'enregistrement du paragraphe s'il existe,
   * sinon celui de la section entière. Rien ne remplace le silence : quand
   * aucune piste n'est disponible, on retombe sur la synthèse du navigateur.
   */
  const pisteCourante: Piste | null = useMemo(() => {
    if (!scene.piste) return null;
    const section = scene.piste.replace(/\.b\d+$/, '');
    return resoudrePiste(manifeste, scene.piste, section);
  }, [manifeste, scene]);


  useEffect(() => {
    if (!lecture || pisteCourante) {
      arreterLecture();
      return;
    }
    const texte = texteDeLaScene(scene);
    if (texte) lireAVoixHaute(texte);
    return () => arreterLecture();
  }, [lecture, scene, texteDeLaScene, pisteCourante]);

  // Lecture de la piste audio studio / ElevenLabs
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    if (lecture && pisteCourante) {
      void el
        .play()
        .then(() => setAudioEnCours(true))
        .catch(() => setAudioEnCours(false));
    } else {
      el.pause();
    }
  }, [pisteCourante, lecture]);

  // ── Gestes tactiles ─────────────────────────────────────────
  const debutTouche = (event: React.TouchEvent) => {
    depart.current = event.touches[0]?.clientX ?? null;
  };
  const finTouche = (event: React.TouchEvent) => {
    if (depart.current === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? 0) - depart.current;
    if (Math.abs(delta) > 60) aller(delta < 0 ? 1 : -1);
    depart.current = null;
  };

  const terminer = async () => {
    setCloture(true);
    await onTerminer();
  };

  // ── Repères du sommaire ─────────────────────────────────────

  return (
    <div className="immersion-bureau fixed inset-0 z-[60] overflow-hidden">
      <div className="immersion-sous-main absolute inset-3 sm:inset-6" />
      <span className="immersion-ruban absolute left-5 top-0 z-20 hidden h-24 w-10 items-end justify-center pb-4 text-or-200 sm:flex">
        <Bookmark className="h-4 w-4 fill-current" />
      </span>
      <span className="vitrail left-[-10rem] top-[-8rem] h-[30rem] w-[30rem] bg-or-400/10 animate-souffle" />
      <span
        className="vitrail bottom-[-12rem] right-[-8rem] h-[28rem] w-[28rem] bg-encre-400/22 animate-souffle"
        style={{ animationDelay: '2.4s' }}
      />

      {/* ── Barre haute ─────────────────────────────────────────
          Trois informations, pas une de plus : où l'on est, dans quel
          moment, et combien il reste. Tout le reste vit dans la feuille. */}
      <header
        className={`absolute inset-x-0 top-0 z-20 px-4 pt-4 transition-all duration-500 sm:px-8 sm:pt-6 ${
          chrome ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-3 opacity-0'
        }`}
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="immersion-console-haute min-w-0 flex-1 rounded-full border border-white/10 px-4 py-2 shadow-2xl backdrop-blur-xl">
            <p className="truncate text-2xs font-bold text-parchemin-100/70">
              Fiche {fiche.id}
              <span className="mx-1.5 text-parchemin-100/25">·</span>
              <span className="text-parchemin-100">{moment?.titre ?? 'Lecture'}</span>
              <span className="mx-1.5 text-parchemin-100/25">·</span>
              {rangMoment + 1}/{moments.length}
              <span className="mx-1.5 text-parchemin-100/25">·</span>
              {moment?.minutes ?? 1} min
            </p>
            <div className="rail mt-1.5">
              <span style={{ width: `${Math.round(progression * 100)}%` }} />
            </div>
          </div>

          <button
            onClick={() => setFeuille(true)}
            aria-label="Réglages de l’immersion"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-encre-950/60 text-parchemin-100/70 shadow-2xl backdrop-blur-xl transition-colors hover:text-parchemin-100"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          {/* La sortie ne se cache pas dans un menu : on doit pouvoir
              quitter un plein écran sans avoir à le chercher. */}
          <button
            onClick={onQuitter}
            aria-label="Quitter l’immersion"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-encre-950/60 text-parchemin-100/70 shadow-2xl backdrop-blur-xl transition-colors hover:text-parchemin-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {noteOuverte && (
        <aside className="post-it-jaune !absolute right-4 top-28 z-30 w-[min(20rem,calc(100vw-2rem))] -rotate-1 rounded-[4px] p-4 shadow-2xl sm:right-8 sm:top-32">
          <div className="flex items-center justify-between border-b border-encre-950/10 pb-2">
            <div>
              <p className="text-3xs font-black uppercase tracking-[0.18em] text-encre-700">Carnet de bord</p>
              <p className="font-serif text-sm font-bold text-encre-950">Fiche {fiche.id} · note libre</p>
            </div>
            <button
              type="button"
              onClick={() => setNoteOuverte(false)}
              className="rounded-full p-1.5 text-encre-600 hover:bg-white/35"
              aria-label="Fermer le carnet de bord"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <textarea
            value={reponses[`immersion:note:${fiche.id}`] ?? ''}
            onChange={(event) => onEnregistrer(`immersion:note:${fiche.id}`, event.target.value)}
            rows={7}
            placeholder="Ce que je veux garder de cette traversée…"
            className="manuscrit mt-3 w-full resize-none bg-transparent text-lg leading-relaxed text-encre-950 outline-none placeholder:text-encre-600/55"
          />
          <p className="mt-2 inline-flex items-center gap-1 text-3xs font-bold text-emerald-800"><Check className="h-3 w-3" /> Sauvegarde automatique</p>
        </aside>
      )}

      {/* ── Scène ── */}
      <div
        ref={zone}
        onTouchStart={debutTouche}
        onTouchEnd={finTouche}
        className="absolute inset-0 z-10 overflow-y-auto px-3 pb-32 pt-28 sm:px-8 sm:pt-36"
      >
        <div className="immersion-page-nuit mx-auto min-h-[calc(100svh-12rem)] max-w-4xl rounded-[1.75rem] border border-white/10 px-5 py-5 shadow-2xl sm:px-10 sm:py-8">
          <div className="mb-2 flex items-center justify-between border-b border-white/8 pb-3 text-3xs font-black uppercase tracking-[0.18em] text-parchemin-100/35">
            <span>Atelier intérieur</span>
            <span>{Math.round(progression * 100)} % parcouru</span>
          </div>
          {cloture ? (
            <SceneCloture fiche={fiche} onQuitter={onQuitter} />
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

      {/* ── Barre basse unifiée (Navigation + Lecteur Audio) ── */}
      {!cloture && (
        <footer
          className={`absolute inset-x-0 bottom-0 z-20 px-3 pb-4 transition-all duration-500 sm:px-8 sm:pb-7 ${
            chrome ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
          }`}
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="immersion-console mx-auto flex max-w-4xl items-center justify-between gap-2.5 rounded-full border border-white/12 px-3.5 py-2.5 shadow-2xl">
            {/* Précédent */}
            <button
              onClick={() => aller(-1)}
              disabled={index === 0}
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-parchemin-100/70 transition-colors hover:bg-white/16 hover:text-parchemin-100 disabled:opacity-20 ${
                index === 0 ? 'invisible pointer-events-none' : ''
              }`}
              aria-label="Précédent"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {/* Centre : Audio ou indicateur de scène */}
            {lecture && pisteCourante ? (
              <div className="flex flex-1 items-center gap-2.5 min-w-0 px-1 sm:px-3">
                <button
                  onClick={() => {
                    const el = audioRef.current;
                    if (!el) return;
                    if (el.paused) void el.play();
                    else el.pause();
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-or-400 text-encre-950 transition-transform active:scale-95 shadow-xs"
                  aria-label={audioEnCours ? 'Mettre en pause' : 'Lire'}
                >
                  {audioEnCours ? (
                    <Pause className="h-3.5 w-3.5 fill-current" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                  )}
                </button>

                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                  <span
                    className="block h-full rounded-full bg-or-400 transition-[width] duration-200"
                    style={{ width: `${Math.round(audioAvancement * 100)}%` }}
                  />
                </div>

                <button
                  onClick={() => setEnchainer(!enchainer)}
                  title="Passer automatiquement à la scène suivante"
                  className={`shrink-0 rounded-full px-2.5 py-1 text-3xs font-bold transition-colors ${
                    enchainer
                      ? 'bg-or-400 text-encre-950'
                      : 'bg-white/10 text-parchemin-100/60 hover:bg-white/18'
                  }`}
                >
                  Auto
                </button>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-center px-2">
                <span className="text-2xs font-semibold text-parchemin-100/40">
                  {index + 1} / {scenario.length}
                </span>
              </div>
            )}

            {/* Bouton Suivant / Action */}
            {scene.type === 'cloture' ? (
              <button
                onClick={() => void terminer()}
                className="bouton-or inline-flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold shadow-md"
              >
                <span>{dejaPreparee ? 'Terminer' : 'J’ai préparé'}</span>
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </button>
            ) : scene.type === 'seuil' ? (
              <button
                onClick={() => aller(1)}
                className="bouton-or inline-flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold shadow-md"
              >
                <span>Entrer</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            ) : (
              <button
                onClick={() => aller(1)}
                className="bouton-or inline-flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold shadow-md"
              >
                <span>Continuer</span>
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </footer>
      )}

      {/* Un toucher sur le fond rappelle les commandes effacées. Placé
          derrière le contenu pour ne jamais voler un clic à un champ. */}
      {!chrome && (
        <button
          type="button"
          aria-label="Afficher les commandes"
          onClick={() => setChrome(true)}
          className="absolute inset-0 z-10 cursor-default"
        />
      )}

      <FeuilleOptions
        ouverte={feuille}
        onFermer={() => setFeuille(false)}
        ambiance={ambiance}
        setAmbiance={setAmbiance}
        lecture={lecture}
        setLecture={setLecture}
        voixDisponible={lectureDisponible() || !!manifeste}
        taille={taille}
        setTaille={setTaille}
        moments={moments}
        rangMoment={rangMoment}
        onAllerAuMoment={(m) => {
          setIndex(moments[m].debut);
          setFeuille(false);
        }}
        onNote={() => {
          setNoteOuverte(true);
          setFeuille(false);
        }}
        onQuitter={onQuitter}
      />

      {/* Audio element background */}
      {pisteCourante && (
        <audio
          ref={audioRef}
          src={pisteCourante.url}
          preload="auto"
          onPlay={() => setAudioEnCours(true)}
          onPause={() => setAudioEnCours(false)}
          onTimeUpdate={(event) => {
            const el = event.currentTarget;
            if (el.duration) setAudioAvancement(el.currentTime / el.duration);
          }}
          onEnded={() => {
            setAudioEnCours(false);
            setAudioAvancement(1);
            if (enchainer) aller(1);
          }}
        />
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// La feuille d'options
// ─────────────────────────────────────────────────────────────

/**
 * Tout ce qui n'est pas la scène : ambiance, voix, sommaire, note, confort
 * de lecture, sortie.
 *
 * Ces commandes vivaient toutes dans la barre haute, visibles en
 * permanence. Sur un téléphone, cela faisait sept objets à l'écran pour un
 * texte qu'on venait méditer — l'inverse de l'immersion. Elles glissent
 * maintenant depuis le bas, à la demande, et se referment.
 */
function FeuilleOptions({
  ouverte,
  onFermer,
  ambiance,
  setAmbiance,
  lecture,
  setLecture,
  voixDisponible,
  taille,
  setTaille,
  moments,
  rangMoment,
  onAllerAuMoment,
  onNote,
  onQuitter,
}: {
  ouverte: boolean;
  onFermer: () => void;
  ambiance: Ambiance;
  setAmbiance: (valeur: Ambiance) => void;
  lecture: boolean;
  setLecture: (valeur: boolean) => void;
  voixDisponible: boolean;
  taille: number;
  setTaille: (valeur: number) => void;
  moments: Moment[];
  rangMoment: number;
  onAllerAuMoment: (rang: number) => void;
  onNote: () => void;
  onQuitter: () => void;
}) {
  useEffect(() => {
    if (!ouverte) return;
    const auClavier = (event: KeyboardEvent) => event.key === 'Escape' && onFermer();
    window.addEventListener('keydown', auClavier);
    return () => window.removeEventListener('keydown', auClavier);
  }, [ouverte, onFermer]);

  return (
    <>
      <button
        type="button"
        aria-label="Fermer les réglages"
        onClick={onFermer}
        className={`fixed inset-0 z-[70] cursor-default bg-encre-950/50 backdrop-blur-sm transition-opacity duration-300 ${
          ouverte ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-label="Réglages de l’immersion"
        aria-hidden={!ouverte}
        className={`fixed inset-x-0 bottom-0 z-[71] mx-auto max-h-[82vh] max-w-lg overflow-y-auto rounded-t-4xl border-t border-white/12 bg-encre-950/95 px-5 pt-3 shadow-2xl backdrop-blur-2xl transition-transform duration-400 ${
          ouverte ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        }`}
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* La poignée : on doit voir que ça se tire. */}
        <span className="mx-auto mb-5 block h-1 w-10 rounded-full bg-white/20" />

        {/* ── Ambiance ── */}
        <p className="mb-2 text-3xs font-bold uppercase tracking-[0.18em] text-parchemin-100/35">
          Ambiance
        </p>
        <div className="flex gap-2">
          {AMBIANCES.map((option) => (
            <button
              key={option.valeur}
              onClick={() => setAmbiance(option.valeur)}
              className={`flex-1 rounded-2xl px-3 py-3 text-xs font-bold transition-colors ${
                ambiance === option.valeur
                  ? 'bg-or-400 text-encre-950'
                  : 'bg-white/8 text-parchemin-100/65 hover:bg-white/14'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* ── Voix et confort ── */}
        <div className="mt-6 space-y-2.5">
          {voixDisponible && (
            <button
              onClick={() => setLecture(!lecture)}
              className="flex w-full items-center justify-between rounded-2xl bg-white/8 px-4 py-3.5 text-left transition-colors hover:bg-white/14"
            >
              <span className="flex items-center gap-2.5 text-sm text-parchemin-100">
                {lecture ? (
                  <Volume2 className="h-4 w-4 text-or-300" />
                ) : (
                  <VolumeX className="h-4 w-4 text-parchemin-100/50" />
                )}
                Voix
              </span>
              <span className="text-2xs font-bold text-parchemin-100/45">
                {lecture ? 'Active' : 'Coupée'}
              </span>
            </button>
          )}

          <div className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-2.5">
            <span className="text-sm text-parchemin-100">Taille du texte</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTaille(Math.max(0.9, Math.round((taille - 0.1) * 10) / 10))}
                disabled={taille <= 0.9}
                aria-label="Réduire le texte"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-parchemin-100/70 transition-colors hover:bg-white/20 disabled:opacity-25"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-11 text-center text-2xs font-bold text-parchemin-100/60">
                {Math.round(taille * 100)}%
              </span>
              <button
                onClick={() => setTaille(Math.min(1.3, Math.round((taille + 0.1) * 10) / 10))}
                disabled={taille >= 1.3}
                aria-label="Agrandir le texte"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-parchemin-100/70 transition-colors hover:bg-white/20 disabled:opacity-25"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <button
            onClick={onNote}
            className="flex w-full items-center gap-2.5 rounded-2xl bg-white/8 px-4 py-3.5 text-left text-sm text-parchemin-100 transition-colors hover:bg-white/14"
          >
            <StickyNote className="h-4 w-4 text-[#f5dc72]" />
            Carnet de bord
          </button>
        </div>

        {/* ── Sommaire par moments ── */}
        <p className="mb-2 mt-6 text-3xs font-bold uppercase tracking-[0.18em] text-parchemin-100/35">
          Les moments de cette fiche
        </p>
        <div className="space-y-1">
          {moments.map((m, rang) => (
            <button
              key={m.cle}
              onClick={() => onAllerAuMoment(rang)}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left text-sm transition-colors ${
                rang === rangMoment
                  ? 'bg-or-400/15 text-parchemin-100'
                  : rang < rangMoment
                    ? 'text-parchemin-100/70 hover:bg-white/8'
                    : 'text-parchemin-100/40 hover:bg-white/8'
              }`}
            >
              <span className="truncate">{m.titre}</span>
              <span className="shrink-0 text-2xs font-bold text-parchemin-100/35">
                {rang < rangMoment ? <Check className="h-3.5 w-3.5 text-or-400" /> : `${m.minutes} min`}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onQuitter}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3.5 text-sm font-bold text-parchemin-100/60 transition-colors hover:bg-white/8 hover:text-parchemin-100"
        >
          <X className="h-4 w-4" />
          Quitter l’immersion
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Rendu d'une scène
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
          <MotFantome
            tone="nuit"
            haut="10%"
            gauche="50%"
            taille="clamp(8rem, 24vw, 18rem)"
            className="-translate-x-1/2"
          >
            {String(scene.rang)}
          </MotFantome>
          <TraitOrganique
            variante={((scene.rang % 4) + 1) as 1 | 2 | 3 | 4}
            tone="nuit"
            className="inset-y-0 h-full opacity-70"
          />

          <div className="relative z-10">
            <Pastille tone="nuit">
              <Etincelle taille={12} />
              Partie {scene.rang} sur {scene.total}
            </Pastille>
            <h2 className="mt-6 font-serif text-4xl font-bold leading-tight text-parchemin-100 sm:text-5xl">
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

    case 'resume':
      return (
        <div className="py-6">
          <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-300/70">
            L&apos;essentiel à retenir
          </span>
          <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-parchemin-100">
            {scene.section.titre}
          </h2>
          <div className="mt-7 space-y-4">
            {scene.section.points.map((point, index) => (
              <p
                key={index}
                className="border-l-2 border-or-400/40 pl-4 text-base leading-relaxed text-parchemin-100/85 sm:text-lg"
              >
                <TexteAvecReferences tone="nuit">{point}</TexteAvecReferences>
              </p>
            ))}
          </div>
        </div>
      );

    case 'verset':
      return (
        <SceneVerset
          reference={scene.reference}
          texte={scene.texte}
          valeur={reponses[`v:${scene.reference}`] ?? ''}
          onEnregistrer={(valeur) => onEnregistrer(`v:${scene.reference}`, valeur)}
        />
      );

    case 'lecture':
      return (
        <div className="py-10 text-center sm:py-16">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-or-400/12 text-or-300">
            <BookOpen className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <span className="mt-6 block text-2xs font-bold uppercase tracking-[0.22em] text-or-300/60">
            À lire dans votre Bible
          </span>
          <p className="mx-auto mt-4 max-w-xl font-serif text-2xl leading-relaxed text-parchemin-100 sm:text-3xl">
            {scene.texte}
          </p>
          <p className="mx-auto mt-6 max-w-sm text-2xs leading-relaxed text-parchemin-100/40">
            Prenez le livre, pas l&apos;écran. Le livret suppose une Bible ouverte à côté de vous.
          </p>
        </div>
      );

    case 'question':
      return (
        <SceneQuestion
          scene={scene}
          valeur={reponses[`q:${scene.id}`] ?? ''}
          onEnregistrer={(valeur) => onEnregistrer(`q:${scene.id}`, valeur)}
        />
      );

    case 'pas':
      return (
        <div className="py-8">
          <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-300/70">
            Avant de refermer
          </span>
          <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-parchemin-100 sm:text-4xl">
            Un seul pas, pour cette semaine.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-parchemin-100/65">
            Pas dix résolutions : une chose précise, que vous pourrez dire au groupe, et qu&apos;on
            pourra vous demander la semaine prochaine.
          </p>
          <ChampEcriture
            valeur={reponses[`pas:${fiche.id}`] ?? ''}
            onEnregistrer={(valeur) => onEnregistrer(`pas:${fiche.id}`, valeur)}
            placeholder="Cette semaine, je…"
            lignes={4}
          />
        </div>
      );

    case 'cloture':
      return (
        <div className="py-12 text-center sm:py-20">
          <span className="mx-auto grid h-16 w-16 animate-halo place-items-center rounded-full bg-or-400/15 text-or-300">
            <Sparkles className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <h2 className="mt-7 font-serif text-4xl font-bold leading-tight text-parchemin-100 sm:text-5xl">
            Vous avez traversé
            <br />
            <span className="titre-or">la fiche {fiche.id}.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-parchemin-100/65">
            {dejaPreparee
              ? 'Vos réponses sont enregistrées. Vous pourrez les relire avant la rencontre.'
              : 'En validant, votre groupe verra que vous êtes prêt pour la rencontre. Vos réponses, elles, restent les vôtres.'}
          </p>
        </div>
      );
  }
}

// ─────────────────────────────────────────────────────────────

function SceneSeuil({ fiche }: { fiche: FicheLivret }) {
  return (
    <div className="relative py-8 text-center sm:py-12">
      <MotFantome
        tone="nuit"
        haut="-4%"
        gauche="50%"
        taille="clamp(11rem, 34vw, 26rem)"
        className="-translate-x-1/2"
      >
        {String(fiche.id).padStart(2, '0')}
      </MotFantome>

      <Illumination
        fiche={fiche.id}
        taille={172}
        anime
        className="relative z-10 mx-auto"
      />

      <span className="relative z-10 mt-6 block text-2xs font-bold uppercase tracking-[0.28em] text-or-300/60">
        Fiche {fiche.id} · page {fiche.page} du livret
      </span>
      <h1 className="relative z-10 mt-4 font-serif text-4xl font-bold leading-[1.08] text-parchemin-100 sm:text-6xl">
        <span className="titre-or">{fiche.titre}</span>
      </h1>
      <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-parchemin-100/65 sm:text-base">
        {fiche.sousTitre}
      </p>

      <div className="mx-auto mt-10 max-w-md space-y-2.5 text-left">
        {[
          'Mettez votre téléphone en silencieux. Ce moment ne dure qu’une fois.',
          'Gardez une Bible à portée de main : plusieurs passages sont à lire dedans.',
          'Vous pouvez vous arrêter et revenir : tout est enregistré au fur et à mesure.',
        ].map((ligne) => (
          <p
            key={ligne}
            className="flex gap-3 rounded-2xl bg-white/[0.05] px-4 py-3 text-2xs leading-relaxed text-parchemin-100/70"
          >
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-or-400" />
            {ligne}
          </p>
        ))}
      </div>
    </div>
  );
}

function SceneBloc({
  scene,
}: {
  scene: { bloc: Bloc; sousTitre: string | null; section: string | null };
}) {
  const { bloc, sousTitre, section } = scene;

  if (bloc.type === 'encadre') {
    return (
      <div className="py-12 text-center sm:py-20">
        {section && (
          <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-300/45">
            {section}
          </span>
        )}
        <div className="encadre-nuit mx-auto mt-6 max-w-2xl px-6 py-8 sm:px-10 sm:py-10">
          <p className="font-serif text-xl leading-relaxed sm:text-2xl">
            <TexteAvecReferences tone="nuit">{bloc.texte}</TexteAvecReferences>
          </p>
        </div>
      </div>
    );
  }

  if (bloc.type === 'citation') {
    return (
      <div className="py-10 sm:py-16">
        <Quote className="mx-auto h-7 w-7 text-or-400/50" strokeWidth={1.5} />
        <blockquote className="mx-auto mt-6 max-w-2xl text-center font-serif text-2xl italic leading-relaxed text-parchemin-100 sm:text-3xl">
          <TexteAvecReferences tone="nuit">{bloc.texte}</TexteAvecReferences>
        </blockquote>
      </div>
    );
  }

  if (bloc.type === 'liste') {
    const items = bloc.texte
      .split(/(?=^|\s)-\s+/)
      .map((item) => item.trim())
      .filter(Boolean);
    return (
      <div className="py-8">
        {sousTitre && (
          <h3 className="mb-5 font-serif text-2xl font-bold text-or-300">{sousTitre}</h3>
        )}
        <ul className="space-y-3.5">
          {items.map((item, index) => (
            <li key={index} className="flex gap-3.5 text-base leading-relaxed text-parchemin-100/85">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-or-400" />
              <TexteAvecReferences tone="nuit">{item}</TexteAvecReferences>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (bloc.type === 'aparte') {
    return (
      <div className="py-10 sm:py-14">
        <p className="mx-auto max-w-xl rounded-2xl border border-or-300/25 bg-or-400/8 px-5 py-4 text-center text-sm leading-relaxed text-or-100/85">
          {bloc.texte.replace(/^>\s*/, '')}
        </p>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      {sousTitre && (
        <h3 className="mb-5 font-serif text-2xl font-bold text-or-300 sm:text-3xl">{sousTitre}</h3>
      )}
      {!sousTitre && section && (
        <span className="mb-4 block text-2xs font-bold uppercase tracking-[0.22em] text-or-300/40">
          {section}
        </span>
      )}
      <p className="text-lg leading-[1.85] text-parchemin-100/88 sm:text-xl sm:leading-[1.9]">
        <TexteAvecReferences tone="nuit">{bloc.texte}</TexteAvecReferences>
      </p>
    </div>
  );
}

function SceneSilence() {
  const [secondes, setSecondes] = useState(45);
  const [encours, setEncours] = useState(false);

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
      <h2 className="mt-5 font-serif text-3xl font-bold leading-tight text-parchemin-100 sm:text-4xl">
        Restez là un instant.
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-parchemin-100/60">
        Avant de répondre à quoi que ce soit. Ce que vous venez de lire a besoin d&apos;un peu de
        place.
      </p>

      <button
        onClick={() => setEncours((v) => !v)}
        className="group relative mx-auto mt-12 grid h-40 w-40 place-items-center"
        aria-label={encours ? 'Interrompre le temps de silence' : 'Démarrer 45 secondes de silence'}
      >
        <span
          className={`absolute inset-0 rounded-full border border-or-400/30 ${
            encours ? 'animate-souffle' : ''
          }`}
        />
        <span
          className={`absolute inset-5 rounded-full bg-or-400/10 ${encours ? 'animate-souffle' : ''}`}
          style={{ animationDelay: '0.6s' }}
        />
        <span className="relative font-mono text-3xl font-bold text-or-200">
          {secondes > 0 ? `0:${secondes.toString().padStart(2, '0')}` : '—'}
        </span>
      </button>

      <p className="mt-8 text-2xs text-parchemin-100/35">
        {secondes === 0
          ? 'Vous pouvez continuer.'
          : encours
            ? 'Inspirez lentement. Le compte descend tout seul.'
            : 'Touchez le cercle pour commencer.'}
      </p>
    </div>
  );
}

function SceneVerset({
  reference,
  texte,
  valeur,
  onEnregistrer,
}: {
  reference: string;
  texte: string | null;
  valeur: string;
  onEnregistrer: (valeur: string) => void;
}) {
  const [carte, setCarte] = useState(false);
  // Le texte à partager : celui que l'application connaît, sinon celui que la
  // personne a recopié de sa main.
  const aPartager = texte ?? (valeur.trim().length > 15 ? valeur.trim() : null);

  return (
    <div className="py-8">
      <div className="text-center">
        <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-300/60">
          Verset à écrire et méditer
        </span>
        <p className="mt-3 font-serif text-4xl font-bold text-or-300 sm:text-5xl">{reference}</p>
      </div>

      {texte ? (
        <blockquote className="mx-auto mt-8 max-w-2xl rounded-3xl border border-or-300/20 bg-or-400/8 px-6 py-6 text-center font-serif text-lg italic leading-relaxed text-parchemin-100 sm:text-xl">
          {texte}
        </blockquote>
      ) : (
        <p className="mx-auto mt-8 max-w-md text-center text-2xs leading-relaxed text-parchemin-100/45">
          Ouvrez votre Bible à ce passage et recopiez-le ci-dessous. C&apos;est ainsi que le livret
          le demande : écrire un verset, c&apos;est déjà le méditer.
        </p>
      )}

      <div className="mx-auto mt-7 max-w-2xl">
        <label className="mb-2.5 flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.16em] text-parchemin-100/45">
          <PenLine className="h-3 w-3" />
          De votre main
        </label>
        <textarea
          value={valeur}
          onChange={(event) => onEnregistrer(event.target.value)}
          rows={4}
          placeholder={texte ? 'Recopiez-le, mot après mot…' : 'Recopiez le verset…'}
          className="ligne-manuscrite verre w-full rounded-2xl px-5 py-4 text-base text-parchemin-100 outline-none placeholder:font-sans placeholder:text-parchemin-100/25 focus:border-or-400/50"
        />

        {aPartager && (
          <button
            onClick={() => setCarte(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/8 px-4 py-2 text-2xs font-bold text-parchemin-100/70 transition-colors hover:bg-white/16 hover:text-parchemin-100"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            En faire une carte à partager
          </button>
        )}
      </div>

      {carte && aPartager && (
        <ShareableVerseCard
          reference={reference}
          text={aPartager}
          translation="Les Fondements"
          onClose={() => setCarte(false)}
        />
      )}
    </div>
  );
}

function SceneQuestion({
  scene,
  valeur,
  onEnregistrer,
}: {
  scene: { texte: string; section?: string };
  valeur: string;
  onEnregistrer: (valeur: string) => void;
}) {
  return (
    <div className="py-8">
      {scene.section && (
        <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-300/45">
          {scene.section}
        </span>
      )}
      <h2 className="mt-3 font-serif text-2xl font-bold leading-snug text-parchemin-100 sm:text-3xl sm:leading-snug">
        {scene.texte}
      </h2>
      <ChampEcriture
        valeur={valeur}
        onEnregistrer={onEnregistrer}
        placeholder="Écrivez ce qui vient, même si c’est incomplet. Personne d’autre ne le lira."
        lignes={6}
      />
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
  const [sauvegarde, setSauvegarde] = useState(false);
  const minuteur = useRef<number | null>(null);

  const changer = (nouvelle: string) => {
    onEnregistrer(nouvelle);
    if (minuteur.current) window.clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(() => {
      setSauvegarde(true);
      window.setTimeout(() => setSauvegarde(false), 1600);
    }, 700);
  };

  return (
    <div className="mt-6">
      <textarea
        value={valeur}
        onChange={(event) => changer(event.target.value)}
        rows={lignes}
        placeholder={placeholder}
        className="verre w-full resize-none rounded-3xl px-5 py-4 text-base leading-relaxed text-parchemin-100 outline-none placeholder:text-parchemin-100/30 focus:border-or-400/50"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-2xs text-parchemin-100/25">
          {valeur.trim() ? `${valeur.trim().split(/\s+/).length} mots` : ''}
        </span>
        {sauvegarde && (
          <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-300/80">
            <Check className="h-3 w-3" /> Enregistré
          </span>
        )}
      </div>
    </div>
  );
}

function SceneCloture({ fiche, onQuitter }: { fiche: FicheLivret; onQuitter: () => void }) {
  return (
    <div className="animate-reveal py-16 text-center sm:py-24">
      <span className="mx-auto grid h-20 w-20 animate-halo place-items-center rounded-full bg-or-400/15 text-or-300">
        <Check className="h-9 w-9" strokeWidth={2} />
      </span>
      <h2 className="mt-8 font-serif text-4xl font-bold leading-tight text-parchemin-100 sm:text-5xl">
        Fiche {fiche.id} <span className="titre-or">préparée.</span>
      </h2>
      <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-parchemin-100/65">
        Votre groupe le voit. Le reste — vos réponses, ce que vous avez écrit — ne regarde que vous,
        jusqu&apos;à ce que vous décidiez d&apos;en parler.
      </p>
      <button
        onClick={onQuitter}
        className="bouton-or mt-9 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold"
      >
        Revenir à la fiche
      </button>
    </div>
  );
}



export function ChargementImmersion() {
  return (
    <div className="nuit fixed inset-0 z-[60] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-or-300" />
        <p className="text-2xs text-parchemin-100/50">Ouverture de la fiche…</p>
      </div>
    </div>
  );
}
