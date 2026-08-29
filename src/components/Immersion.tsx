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
  Copy,
  Download,
  Flame,
  Mic,
  MicOff,
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
import { normaliserReference, texteDuVerset, VERSETS_CONNUS } from '@/data/versets';
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

interface QuestionMeditation {
  id: string;
  fonction?: string;
  consigne?: string;
  question: string;
  priereTitre?: string;
}

interface SectionMeditation {
  sectionTitre: string;
  versets: string[];
  questions: QuestionMeditation[];
}

interface FicheMeditation {
  ficheId: number;
  sections: SectionMeditation[];
}

interface PassageAncrage {
  reference: string;
  texte: string;
}

type Scene = { piste?: string } & (
  | { type: 'seuil' }
  | { type: 'ouverture-section'; titre: string; rang: number; total: number }
  | { type: 'bloc'; bloc: Bloc; sousTitre: string | null; section: string | null }
  | { type: 'silence' }
  | { type: 'meditation'; sectionTitre: string; questions: QuestionMeditation[] }
  | { type: 'priere'; id: string; questions: QuestionMeditation[] }
  | { type: 'ancrage-verset'; id: string; reference: string; texte: string; options: PassageAncrage[] }
  | { type: 'resume'; section: ResumeSection }
  | { type: 'verset'; reference: string; texte: string | null }
  | { type: 'lecture'; texte: string }
  | { type: 'question'; id: string; texte: string; section?: string }
  | { type: 'pas'; id?: string; reference?: string; options?: PassageAncrage[] }
  | { type: 'cloture' }
);

const MEDITATIONS = meditationData as FicheMeditation[];

function construireScenario(fiche: FicheLivret, sectionCibleIndex?: number | null): Scene[] {
  if (sectionCibleIndex !== undefined && sectionCibleIndex !== null && sectionCibleIndex >= 0) {
    const section = fiche.sections[sectionCibleIndex];
    if (!section) return [{ type: 'seuil', piste: pisteId.seuil(fiche.id) }, { type: 'cloture' }];

    const meditation = MEDITATIONS
      .find((element) => element.ficheId === fiche.id)
      ?.sections[sectionCibleIndex];
    const idSection = `f${fiche.id}-s${sectionCibleIndex + 1}`;
    const questions = meditation?.questions.length
      ? meditation.questions
      : [
          {
            id: `${idSection}-q1`,
            fonction: 'decouvrir-dieu',
            question: 'Qu’est-ce que ce texte te révèle sur Dieu, son caractère ou sa manière d’agir ?',
          },
          {
            id: `${idSection}-q2`,
            fonction: 'recevoir',
            question: 'Quelle vérité es-tu invité à accueillir personnellement aujourd’hui ?',
          },
          {
            id: `${idSection}-q3`,
            fonction: 'repondre',
            question: 'Quelle réponse simple et concrète peux-tu donner à Dieu ?',
          },
        ];
    const versetsDuResume = fiche.resume.find((resume) => resume.titre === section.titre)?.versets;
    const referencesProposees = meditation?.versets.length
      ? meditation.versets
      : versetsDuResume?.length
        ? versetsDuResume
        : fiche.resume.flatMap((resume) => resume.versets).slice(0, 1);
    const references = [...new Set(referencesProposees.length ? referencesProposees : ['Ps 46:11'])];
    const options = references.map((reference) => ({
      reference,
      texte: VERSETS_CONNUS[normaliserReference(reference)]
        ?? texteDuVerset(reference)
        ?? 'Relis ce passage dans ta Bible pour le garder avec toi.',
    }));
    const reference = options[0].reference;
    const texte = options[0].texte;

    const scenes: Scene[] = [
      { type: 'seuil', piste: pisteId.seuil(fiche.id) },
    ];

    if (section.titre) {
      scenes.push({
        type: 'ouverture-section',
        titre: section.titre,
        rang: sectionCibleIndex + 1,
        total: fiche.sections.filter((element) => element.titre).length,
        piste: pisteId.section(fiche.id, sectionCibleIndex),
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
        piste: pisteId.bloc(fiche.id, sectionCibleIndex, indexBloc),
      });
      sousTitre = null;
    });

    scenes.push(
      { type: 'silence' },
      { type: 'meditation', sectionTitre: section.titre || fiche.titre, questions },
      { type: 'priere', id: idSection, questions },
      { type: 'ancrage-verset', id: idSection, reference, texte, options },
      { type: 'pas', id: idSection, reference, options },
      { type: 'cloture' },
    );
    return scenes;
  }

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
  /** Limite le temps du jour à une section, tout en gardant une immersion continue. */
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
  const scenario = useMemo(
    () => construireScenario(fiche, sectionIndex),
    [fiche, sectionIndex]
  );
  const [index, setIndex] = useState(() =>
    Math.max(0, Math.min(scenario.length - 1, indexInitial))
  );
  const [ambiance, setAmbiance] = useState<Ambiance>('emotional-piano');
  const [lecture, setLecture] = useState(false);
  const [genreVoixLocal, setGenreVoixLocal] = useState<GenreVoix>(() => getGenreVoix());
  const [manifeste, setManifeste] = useState<Manifeste | null>(null);
  const [manifesteVivienne, setManifesteVivienne] = useState<ManifesteVivienne | null>(null);
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
  const sourceDuckingAudio = useRef(Symbol('immersion-piste-enregistree'));
  const enchainerRef = useRef(enchainer);
  const zone = useRef<HTMLDivElement>(null);
  const depart = useRef<number | null>(null);

  const scene = scenario[index];
  const progression = (index + 1) / scenario.length;
  const sceneAncrage = scenario.find(
    (candidate): candidate is Extract<Scene, { type: 'ancrage-verset' }> =>
      candidate.type === 'ancrage-verset'
  );
  const choixVersetAncrage = sceneAncrage
    ? reponses[`verset-choisi:${sceneAncrage.id}`]
    : undefined;
  const ancragePret = scene.type !== 'ancrage-verset'
    || scene.options.length <= 1
    || scene.options.some((option) => option.reference === choixVersetAncrage);

  const libelleScene = useMemo(() => {
    switch (scene.type) {
      case 'seuil': return 'Ouverture de la fiche';
      case 'ouverture-section': return scene.titre;
      case 'bloc': return scene.sousTitre ?? scene.section ?? 'Lecture guidée';
      case 'silence': return 'Temps de silence';
      case 'meditation': return 'Méditer';
      case 'priere': return 'Prier';
      case 'ancrage-verset': return 'Mémoriser';
      case 'resume': return `L’essentiel — ${scene.section.titre}`;
      case 'verset': return scene.reference;
      case 'lecture': return 'Lecture dans votre Bible';
      case 'question': return 'Écriture personnelle';
      case 'pas': return scene.id ? 'Vivre cette Parole' : 'Vivre cette vérité';
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
      case 'meditation':
        return courante.questions
          .map((question) => `${question.consigne ? `${question.consigne} ` : ''}${question.question}`)
          .join(' ');
      case 'priere':
        return 'Relis ce que tu viens d’écrire. Puis parle simplement à Dieu à partir de ce que tu as découvert. Tu peux aussi rester un instant en silence.';
      case 'ancrage-verset': {
        if (courante.options.length > 1 && !choixVersetAncrage) return null;
        const reference = choixVersetAncrage ?? courante.reference;
        const passage = courante.options.find((option) => option.reference === reference)
          ?? courante.options[0];
        return `${passage.reference}. ${passage.texte}`;
      }
      default:
        return null;
    }
  }, [choixVersetAncrage]);

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
      if (delta > 0 && !ancragePret) return;
      // On change de scène : les commandes reviennent le temps de se repérer.
      setChrome(true);
      arreterLecture();
      setIndex((valeur) => Math.max(0, Math.min(scenario.length - 1, valeur + delta)));
    },
    [ancragePret, scenario.length]
  );

  useEffect(() => {
    enchainerRef.current = enchainer;
  }, [enchainer]);

  const lireSceneAvecLeNavigateur = useCallback(
    (courante: Scene) => {
      const texte = texteDeLaScene(courante);
      if (!texte) {
        setAudioEnCours(false);
        return false;
      }
      const demarree = lireAVoixHaute(texte, {
        genre: genreVoixLocal,
        onDebut: () => setAudioEnCours(true),
        onFin: () => {
          setAudioEnCours(false);
          setAudioAvancement(1);
          if (enchainerRef.current) aller(1);
        },
        onErreur: () => setAudioEnCours(false),
      });
      return demarree;
    },
    [aller, genreVoixLocal, texteDeLaScene]
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
    const referenceAncrage = scene.type === 'ancrage-verset'
      ? choixVersetAncrage
        ?? (scene.options.length === 1 ? scene.reference : null)
      : null;
    const estVerset = scene.type === 'verset'
      || (scene.type === 'ancrage-verset' && referenceAncrage !== null);
    memoriserPassage({
      url: sectionIndex === null
        ? `/fiches/${fiche.id}?immersion=1&scene=${index}`
        : `/aujourdhui?fiche=${fiche.id}&section=${sectionIndex}&scene=${index}`,
      titre: scene.type === 'verset' || scene.type === 'ancrage-verset'
        ? referenceAncrage ?? `Fiche ${fiche.id}`
        : `Fiche ${fiche.id}`,
      sousTitre: libelleScene,
      type: estVerset ? 'verset' : 'immersion',
    });
  }, [choixVersetAncrage, fiche.id, index, libelleScene, scene, sectionIndex]);

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
    void chargerManifesteVivienne().then((vivienne) => {
      setManifesteVivienne(vivienne);
      if (!vivienne && getGenreVoix() === 'feminin') {
        setGenreVoix('masculin');
        setGenreVoixLocal('masculin');
      }
    });
  }, []);

  useEffect(() => {
    void jouerAmbiance(ambiance);
  }, [ambiance]);

  useEffect(
    () => () => {
      activerDuckingVoix(false, sourceDuckingAudio.current);
      void arreterAmbiance();
      arreterLecture();
    },
    []
  );

  /**
   * La voix off de la scène : l'enregistrement du paragraphe s'il existe,
   * sinon celui de la section entière. Vivienne n'est résolue qu'à travers
   * son manifeste final : les fichiers en cours de génération sont ignorés.
   */
  const pisteCourante: Piste | null = useMemo(() => {
    if (!scene.piste) return null;
    if (genreVoixLocal === 'feminin') {
      const url = pisteVivienne(manifesteVivienne, scene.piste);
      if (!url) return null;
      return {
        id: scene.piste,
        url,
        source: 'eleven',
        empreinte: 'vivienne',
        voix: 'fr-FR-VivienneMultilingualNeural',
      };
    }
    const section = scene.piste.replace(/\.b\d+$/, '');
    return resoudrePiste(manifeste, scene.piste, section);
  }, [manifeste, manifesteVivienne, scene, genreVoixLocal]);

  const basculerLectureOuPause = useCallback(() => {
    const el = audioRef.current;
    if (!lecture) {
      setLecture(true);
      if (pisteCourante && el) {
        if (!el.src.endsWith(pisteCourante.url)) {
          el.src = pisteCourante.url;
        }
        el.currentTime = 0;
        const p = el.play();
        if (p) p.then(() => setAudioEnCours(true)).catch((e) => console.warn(e));
      } else {
        lireSceneAvecLeNavigateur(scene);
      }
      return;
    }

    if (audioEnCours) {
      el?.pause();
      arreterLecture();
      setAudioEnCours(false);
    } else {
      if (pisteCourante && el) {
        const p = el.play();
        if (p) p.then(() => setAudioEnCours(true)).catch((e) => console.warn(e));
      } else {
        lireSceneAvecLeNavigateur(scene);
      }
    }
  }, [lecture, audioEnCours, pisteCourante, scene, lireSceneAvecLeNavigateur]);

  useEffect(() => {
    if (!lecture || pisteCourante) {
      arreterLecture();
      return;
    }
    // La synthèse appelle ses callbacks d'état dès le démarrage. La lancer
    // après l'effet évite une cascade de rendu synchrone et laisse React
    // stabiliser la scène courante avant que la voix prenne la main.
    const minuteur = window.setTimeout(() => lireSceneAvecLeNavigateur(scene), 0);
    return () => {
      window.clearTimeout(minuteur);
      arreterLecture();
    };
  }, [lecture, scene, pisteCourante, lireSceneAvecLeNavigateur]);

  // Lecture de la piste audio studio / ElevenLabs / Vivienne
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (lecture && pisteCourante) {
      if (!el.src.endsWith(pisteCourante.url)) {
        el.src = pisteCourante.url;
      }
      el.currentTime = 0;
      const p = el.play();
      if (p) p.then(() => setAudioEnCours(true)).catch(() => {});
    } else {
      el.pause();
    }
  }, [pisteCourante, lecture, index]);

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
              <span className="mx-1.5 text-parchemin-100/55">·</span>
              <span className="text-parchemin-100">{moment?.titre ?? 'Lecture'}</span>
              <span className="mx-1.5 text-parchemin-100/55">·</span>
              {rangMoment + 1}/{moments.length}
              <span className="mx-1.5 text-parchemin-100/55">·</span>
              {moment?.minutes ?? 1} min
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
                basculerLectureOuPause();
              }
            }}
            aria-label={lecture ? 'Désactiver la voix off' : 'Activer la voix off'}
            title={lecture ? 'Désactiver la voix off' : 'Écouter la voix off'}
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
        tabIndex={0}
        aria-label="Contenu de l’immersion"
        className="absolute inset-0 z-10 overflow-y-auto px-3 pb-32 pt-28 sm:px-8 sm:pt-36"
      >
        <div className="immersion-page-nuit mx-auto min-h-[calc(100svh-12rem)] max-w-4xl rounded-[1.75rem] border border-white/10 px-5 py-5 shadow-2xl sm:px-10 sm:py-8">
          <div className="mb-2 flex items-center justify-between border-b border-white/8 pb-3 text-3xs font-black uppercase tracking-[0.18em] text-parchemin-100/55">
            <span>Atelier intérieur</span>
            <span>{Math.round(progression * 100)} % parcouru</span>
          </div>
          {cloture ? (
            <SceneCloture fiche={fiche} onQuitter={onQuitter} tempsDuJour={sectionIndex !== null} />
          ) : (
            <div key={index} className="animate-reveal">
              <RenduScene
                scene={scene}
                fiche={fiche}
                reponses={reponses}
                onEnregistrer={onEnregistrer}
                dejaPreparee={dejaPreparee}
                tempsDuJour={sectionIndex !== null}
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
            <div className="flex flex-1 items-center gap-2.5 min-w-0 px-1 sm:px-3">
              <button
                onClick={basculerLectureOuPause}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-or-400 text-encre-950 transition-transform active:scale-95 shadow-xs"
                aria-label={audioEnCours ? 'Mettre en pause' : 'Écouter'}
                title={audioEnCours ? 'Mettre en pause' : 'Écouter'}
              >
                {audioEnCours ? (
                  <Pause className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                )}
              </button>

              <div className="flex-1 flex flex-col justify-center min-w-0">
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
                  <span
                    className="block h-full rounded-full bg-or-400 transition-[width] duration-200"
                    style={{
                      width: `${
                        lecture && pisteCourante
                          ? Math.round(audioAvancement * 100)
                          : Math.round(progression * 100)
                      }%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-3xs text-parchemin-100/50">
                  <span className="truncate">
                    {lecture ? (pisteCourante ? 'Voix Studio' : 'Synthèse') : 'Mode lecture'}
                  </span>
                  <span className="shrink-0 ml-2">
                    {index + 1} / {scenario.length}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setEnchainer(!enchainer)}
                title="Passer automatiquement à la scène suivante après la voix"
                className={`shrink-0 rounded-full px-2.5 py-1 text-3xs font-bold transition-colors ${
                  enchainer
                    ? 'bg-or-400 text-encre-950'
                    : 'bg-white/10 text-parchemin-100/60 hover:bg-white/18'
                }`}
              >
                Auto
              </button>
            </div>

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
                disabled={!ancragePret}
                className="bouton-or inline-flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-xs font-bold shadow-md disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span>{ancragePret ? 'Continuer' : 'Choisir un verset'}</span>
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
        genreVoix={genreVoixLocal}
        setGenreVoix={(g) => {
          setGenreVoix(g);
          setGenreVoixLocal(g);
        }}
        vivienneDisponible={!!manifesteVivienne}
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

      {/* Audio element permanent */}
      <audio
        ref={audioRef}
        preload="auto"
        onPlay={() => {
          activerDuckingVoix(true, sourceDuckingAudio.current);
          setAudioEnCours(true);
        }}
        onPause={() => {
          activerDuckingVoix(false, sourceDuckingAudio.current);
          setAudioEnCours(false);
        }}
        onTimeUpdate={(event) => {
          const el = event.currentTarget;
          if (el.duration) setAudioAvancement(el.currentTime / el.duration);
        }}
        onEnded={() => {
          activerDuckingVoix(false, sourceDuckingAudio.current);
          setAudioEnCours(false);
          setAudioAvancement(1);
          if (enchainer) aller(1);
        }}
        onError={() => {
          activerDuckingVoix(false, sourceDuckingAudio.current);
          if (lecture) lireSceneAvecLeNavigateur(scene);
        }}
      />
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// La feuille d'options
// ─────────────────────────────────────────────────────────────

/**
 * Tout ce qui n'est pas la scène : ambiance, voix, sommaire, note, confort
 * de lecture, sortie.
 */
function FeuilleOptions({
  ouverte,
  onFermer,
  ambiance,
  setAmbiance,
  lecture,
  setLecture,
  genreVoix,
  setGenreVoix,
  vivienneDisponible,
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
  genreVoix: GenreVoix;
  setGenreVoix: (valeur: GenreVoix) => void;
  vivienneDisponible: boolean;
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

  if (!ouverte) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Fermer les réglages"
        onClick={onFermer}
        className="fixed inset-0 z-[70] cursor-default bg-encre-950/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-label="Réglages de l’immersion"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-[71] mx-auto max-h-[82vh] max-w-lg overflow-y-auto rounded-t-4xl border-t border-white/12 bg-encre-950/95 px-5 pt-3 shadow-2xl backdrop-blur-2xl"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* La poignée : on doit voir que ça se tire. */}
        <span className="mx-auto mb-5 block h-1 w-10 rounded-full bg-white/20" />

        {/* ── Ambiance ── */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-3xs font-bold uppercase tracking-[0.18em] text-parchemin-100/55">
            Fond Sonore & Musique
          </p>
          <span className="text-3xs text-or-400/80 font-medium">
            {AMBIANCES.find((a) => a.valeur === ambiance)?.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AMBIANCES.map((option) => (
            <button
              key={option.valeur}
              onClick={() => setAmbiance(option.valeur)}
              className={`rounded-2xl p-2.5 text-left transition-all flex flex-col justify-between ${
                ambiance === option.valeur
                  ? 'bg-or-400 text-encre-950 shadow-md ring-1 ring-or-300'
                  : 'bg-white/8 text-parchemin-100/70 hover:bg-white/14'
              }`}
            >
              <span className="text-xs font-bold truncate block">{option.label}</span>
              <span
                className={`text-[10px] mt-0.5 line-clamp-1 ${
                  ambiance === option.valeur ? 'text-encre-900/80' : 'text-parchemin-100/40'
                }`}
              >
                {option.description}
              </span>
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
                Lecture Vocale
              </span>
              <span className="text-2xs font-bold text-parchemin-100/45">
                {lecture ? 'Active' : 'Coupée'}
              </span>
            </button>
          )}

          {/* Le sélecteur n'existe que lorsque toutes les pistes Vivienne ont
              passé la vérification de publication. */}
          {vivienneDisponible && (
          <div className="rounded-2xl bg-white/6 p-3 border border-white/8">
            <p className="text-3xs font-bold uppercase tracking-[0.18em] text-parchemin-100/60 mb-2">
              Timbre de la narration
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGenreVoix('masculin')}
                className={`rounded-xl p-2.5 text-left transition-all flex flex-col justify-between ${
                  genreVoix === 'masculin'
                    ? 'bg-or-400 text-encre-950 shadow-md ring-1 ring-or-300'
                    : 'bg-white/8 text-parchemin-100/70 hover:bg-white/14'
                }`}
              >
                <span className="text-xs font-bold flex items-center gap-1.5">
                  🧔 Masculin
                </span>
                <span
                  className={`text-[10px] mt-0.5 ${
                    genreVoix === 'masculin' ? 'text-encre-900/80 font-medium' : 'text-parchemin-100/40'
                  }`}
                >
                  Studio posé
                </span>
              </button>

              <button
                type="button"
                onClick={() => setGenreVoix('feminin')}
                className={`rounded-xl p-2.5 text-left transition-all flex flex-col justify-between ${
                  genreVoix === 'feminin'
                    ? 'bg-or-400 text-encre-950 shadow-md ring-1 ring-or-300'
                    : 'bg-white/8 text-parchemin-100/70 hover:bg-white/14'
                }`}
              >
                <span className="text-xs font-bold flex items-center gap-1.5">
                  👩 Féminin
                </span>
                <span
                  className={`text-[10px] mt-0.5 ${
                    genreVoix === 'feminin' ? 'text-encre-900/80 font-medium' : 'text-parchemin-100/40'
                  }`}
                >
                  Vivienne (Doux)
                </span>
              </button>
            </div>
          </div>
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
        <p className="mb-2 mt-6 text-3xs font-bold uppercase tracking-[0.18em] text-parchemin-100/55">
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
              <span className="shrink-0 text-2xs font-bold text-parchemin-100/55">
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
  tempsDuJour,
}: {
  scene: Scene;
  fiche: FicheLivret;
  reponses: Record<string, string>;
  onEnregistrer: (cle: string, valeur: string) => void;
  dejaPreparee?: boolean;
  tempsDuJour: boolean;
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

    case 'meditation': {
      const papiers = [
        'post-it-jaune pose-1',
        'post-it-bleu pose-2',
        'post-it-rose pose-3',
      ];
      return (
        <div className="py-6 sm:py-9">
          <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-300/70">
            Méditer la Parole
          </span>
          <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-parchemin-100 sm:text-4xl">
            Laisser « {scene.sectionTitre} » descendre dans le cœur
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-parchemin-100/65">
            Ces repères t&apos;indiquent seulement où regarder. Ils ne te disent pas ce que tu dois
            trouver. Relis, attends, puis écris ce que tu vois.
          </p>
          <div className="mt-7 space-y-5">
            {scene.questions.map((question, indexQuestion) => {
              const reponse = reponses[`q:${question.id}`] ?? '';
              return (
                <article
                  key={question.id}
                  className={`${papiers[indexQuestion % papiers.length]} relative rounded-[4px] p-5 text-encre-950 shadow-xl transition-transform sm:p-6`}
                >
                  <span
                    className={`punaise -top-2.5 ${indexQuestion % 2 === 0 ? 'left-8' : 'right-8 punaise-bleue'}`}
                    aria-hidden="true"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span aria-hidden="true" className="font-serif text-xl italic text-encre-700/55">
                      {String(indexQuestion + 1).padStart(2, '0')}
                    </span>
                    {reponse.trim() && (
                      <span className="inline-flex items-center gap-1 text-3xs font-black uppercase tracking-[0.12em] text-emerald-900/75">
                        <Check className="h-3 w-3" /> Note déposée
                      </span>
                    )}
                  </div>
                  {question.consigne && (
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-encre-700 sm:text-base">
                      <TexteAvecReferences>{question.consigne}</TexteAvecReferences>
                    </p>
                  )}
                  <label
                    htmlFor={`meditation-${question.id}`}
                    className="mt-4 block font-serif text-lg font-bold leading-relaxed text-encre-950 sm:text-xl"
                  >
                    <TexteAvecReferences>{question.question}</TexteAvecReferences>
                  </label>
                  <textarea
                    id={`meditation-${question.id}`}
                    value={reponse}
                    onChange={(event) => onEnregistrer(`q:${question.id}`, event.target.value)}
                    rows={3}
                    placeholder="Écris directement sur cette feuille…"
                    className="manuscrit mt-4 w-full resize-y rounded-xl border border-encre-950/12 bg-white/55 p-4 text-lg leading-relaxed text-encre-950 outline-none transition-colors placeholder:font-sans placeholder:text-encre-600/55 focus:border-encre-700 focus:bg-white/75"
                  />
                  <p className="mt-2 inline-flex items-center gap-1 text-3xs font-bold text-emerald-900/75">
                    <Check className="h-3 w-3" /> Sauvegarde automatique
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      );
    }

    case 'priere': {
      const toutesLesReprises = scene.questions.flatMap((question) => {
        const reponse = reponses[`q:${question.id}`]?.trim();
        return reponse
          ? [{ id: question.id, titre: question.priereTitre ?? question.question, reponse, prioritaire: !!question.priereTitre }]
          : [];
      });
      const reprisesPrioritaires = toutesLesReprises.filter((reprise) => reprise.prioritaire);
      const reprises = reprisesPrioritaires.length > 0 ? reprisesPrioritaires : toutesLesReprises;
      const papiers = ['post-it-jaune pose-1', 'post-it-bleu pose-2', 'post-it-rose pose-3'];
      return (
        <div className="py-8 text-center sm:py-12">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-or-300/30 bg-or-400/12 text-or-300 shadow-[0_0_28px_rgba(220,168,73,0.12)]">
            <Flame className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <span className="mt-6 block text-2xs font-bold uppercase tracking-[0.22em] text-or-300/70">
            Prier la Parole
          </span>
          <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-parchemin-100 sm:text-4xl">
            Parle à Dieu à partir de ce que tu as découvert
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-parchemin-100/65">
            Relis ce que tu viens d&apos;écrire. Puis prends le temps de lui répondre avec tes propres
            mots. Tu peux aussi rester un instant en silence.
          </p>
          {reprises.length > 0 && (
            <div className="tableau-liege mx-auto mt-7 max-w-2xl rounded-3xl border border-[#d2a675]/55 p-5 text-left shadow-2xl sm:p-7">
              <p className="text-2xs font-black uppercase tracking-[0.18em] text-white/80">
                Tes notes rassemblées devant Dieu
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {reprises.map((reprise, indexReprise) => (
                  <article
                    key={reprise.id}
                    className={`${papiers[indexReprise % papiers.length]} relative rounded-[4px] p-4 text-encre-950 shadow-lg`}
                  >
                    <span className="punaise-bois absolute -top-2 left-1/2 -translate-x-1/2" aria-hidden="true" />
                    <p className="line-clamp-2 text-xs font-bold leading-relaxed text-encre-700">{reprise.titre}</p>
                    <p className="mt-3 font-serif text-base italic leading-relaxed text-encre-950">
                      « {reprise.reponse} »
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
          <div className="mx-auto mt-7 max-w-xl text-left">
            <ChampEcriture
              valeur={reponses[`priere:${scene.id}`] ?? ''}
              onEnregistrer={(valeur) => onEnregistrer(`priere:${scene.id}`, valeur)}
              placeholder="Ma prière aujourd’hui…"
              lignes={5}
            />
          </div>
        </div>
      );
    }

    case 'ancrage-verset': {
      const cleChoix = `verset-choisi:${scene.id}`;
      const selection = reponses[cleChoix]
        ?? (scene.options.length === 1 ? scene.options[0].reference : '');
      const passage = scene.options.find((option) => option.reference === selection)
        ?? scene.options[0];
      return (
        <SceneAncrageVerset
          key={passage.reference}
          options={scene.options}
          selection={selection}
          onChoisir={(reference) => onEnregistrer(cleChoix, reference)}
          reference={passage.reference}
          texte={passage.texte}
          valeur={reponses[`memo:${passage.reference}`] ?? ''}
          onEnregistrer={(valeur) => onEnregistrer(`memo:${passage.reference}`, valeur)}
        />
      );
    }

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

    case 'pas': {
      const clePas = scene.id ? `pas:${scene.id}` : `pas:${fiche.id}`;
      const cleMoment = scene.id ? `pas-moment:${scene.id}` : `pas-moment:${fiche.id}`;
      const referenceChoisie = scene.id
        ? reponses[`verset-choisi:${scene.id}`] ?? scene.reference
        : scene.reference;
      const passageChoisi = scene.options?.find((option) => option.reference === referenceChoisie)
        ?? scene.options?.[0];
      return (
        <div className="py-8">
          <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-300/70">
            {tempsDuJour ? 'Vivre cette Parole' : 'Vivre cette vérité'}
          </span>
          <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-parchemin-100 sm:text-4xl">
            {tempsDuJour && passageChoisi
              ? 'Relis une dernière fois le verset que tu as choisi.'
              : 'Quelle vérité veux-tu garder présente cette semaine ?'}
          </h2>
          {tempsDuJour && passageChoisi ? (
            <>
              <div className="mt-6 rounded-3xl border border-or-400/22 bg-or-400/8 px-5 py-5">
                <p className="text-2xs font-black uppercase tracking-[0.16em] text-or-300">
                  La Parole que tu gardes · {passageChoisi.reference}
                </p>
                <p className="mt-3 font-serif text-lg italic leading-relaxed text-parchemin-100 sm:text-xl">
                  « {passageChoisi.texte} »
                </p>
              </div>
              <p className="mt-6 max-w-2xl font-serif text-xl font-bold leading-relaxed text-parchemin-100">
                Dans quel moment concret de ta journée voudrais-tu revenir à cette Parole ?
              </p>
              <ChampEcriture
                valeur={reponses[cleMoment] ?? ''}
                onEnregistrer={(valeur) => onEnregistrer(cleMoment, valeur)}
                placeholder="Je veux me souvenir de ce verset lorsque…"
                ariaLabel="Le moment où je veux me souvenir de ce verset"
                lignes={3}
              />
              <p className="mt-6 max-w-2xl font-serif text-xl font-bold leading-relaxed text-parchemin-100">
                Et quand ce moment arrivera, qu’aimerais-tu faire à partir de cette Parole ?
              </p>
              <ChampEcriture
                valeur={reponses[clePas] ?? ''}
                onEnregistrer={(valeur) => onEnregistrer(clePas, valeur)}
                placeholder="Quand ce moment arrivera, je veux…"
                ariaLabel="Comment je veux vivre cette Parole"
                lignes={3}
              />
            </>
          ) : (
            <>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-parchemin-100/65">
                Reviens une dernière fois à ce que tu as découvert de Dieu. Y a-t-il une situation
                concrète dans laquelle tu veux choisir de vivre à partir de cette vérité ?
              </p>
              <ChampEcriture
                valeur={reponses[clePas] ?? ''}
                onEnregistrer={(valeur) => onEnregistrer(clePas, valeur)}
                placeholder="Cette semaine, je veux…"
                lignes={4}
              />
            </>
          )}
        </div>
      );
    }

    case 'cloture':
      return (
        <div className="py-12 text-center sm:py-20">
          <span className="mx-auto grid h-16 w-16 animate-halo place-items-center rounded-full bg-or-400/15 text-or-300">
            <Sparkles className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <h2 className="mt-7 font-serif text-4xl font-bold leading-tight text-parchemin-100 sm:text-5xl">
            {tempsDuJour ? 'Tu as vécu' : 'Vous avez traversé'}
            <br />
            <span className="titre-or">{tempsDuJour ? 'ce temps avec Dieu.' : `la fiche ${fiche.id}.`}</span>
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

type NiveauMemoire = 1 | 2 | 3 | 4;

interface ResultatReconnaissance {
  readonly transcript: string;
}

interface EvenementReconnaissance {
  readonly results: {
    readonly [index: number]: {
      readonly [index: number]: ResultatReconnaissance;
    };
  };
}

interface ReconnaissanceVocale {
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: EvenementReconnaissance) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type ConstructeurReconnaissance = new () => ReconnaissanceVocale;

function constructeurReconnaissance(): ConstructeurReconnaissance | null {
  const navigateur = window as typeof window & {
    SpeechRecognition?: ConstructeurReconnaissance;
    webkitSpeechRecognition?: ConstructeurReconnaissance;
  };
  return navigateur.SpeechRecognition ?? navigateur.webkitSpeechRecognition ?? null;
}

interface EtapeMemoire {
  reference: string;
  texte: string;
  libelle: string;
}

function decouperPassagePourMemoire(reference: string, texte: string): EtapeMemoire[] {
  const plage = reference.match(/^(.+?)\s+(\d+):(\d+)-(\d+)$/);
  if (!plage) return [{ reference, texte, libelle: 'Passage entier' }];

  const [, livre, chapitre, debutBrut, finBrut] = plage;
  const debut = Number(debutBrut);
  const fin = Number(finBrut);
  const phrases = texte.match(/[^.!?]+[.!?]+[»”]?/g)?.map((phrase) => phrase.trim()) ?? [];
  if (fin < debut || phrases.length !== fin - debut + 1) {
    return [{ reference, texte, libelle: 'Passage entier' }];
  }

  return phrases.map((_, index) => {
    const dernierVerset = debut + index;
    const referenceEtape = index === 0
      ? `${livre} ${chapitre}:${debut}`
      : `${livre} ${chapitre}:${debut}-${dernierVerset}`;
    return {
      reference: referenceEtape,
      texte: phrases.slice(0, index + 1).join(' '),
      libelle: index === phrases.length - 1
        ? 'Passage entier'
        : index === 0
          ? `Verset ${debut}`
          : `Versets ${debut}–${dernierVerset}`,
    };
  });
}

function SceneAncrageVerset({
  options,
  selection,
  onChoisir,
  reference,
  texte,
  valeur,
  onEnregistrer,
}: {
  options: PassageAncrage[];
  selection: string;
  onChoisir: (reference: string) => void;
  reference: string;
  texte: string;
  valeur: string;
  onEnregistrer: (valeur: string) => void;
}) {
  const [niveau, setNiveau] = useState<NiveauMemoire>(1);
  const [etapePassage, setEtapePassage] = useState(0);
  const [copiee, setCopiee] = useState(false);
  const [microActif, setMicroActif] = useState(false);
  const reconnaissance = useRef<ReconnaissanceVocale | null>(null);
  const selectionValide = options.length === 1
    || options.some((option) => option.reference === selection);
  const etapesMemoire = useMemo(
    () => decouperPassagePourMemoire(reference, texte),
    [reference, texte]
  );
  const passageMemoire = etapesMemoire[Math.min(etapePassage, etapesMemoire.length - 1)];
  const mots = useMemo(() => passageMemoire.texte.trim().split(/\s+/), [passageMemoire.texte]);
  const motsATrous = useMemo(
    () => mots.map((mot, indexMot) => ({ mot, masque: indexMot % 3 === 1 && mot.length > 2 })),
    [mots]
  );
  const initiales = useMemo(
    () => mots.map((mot) => (mot.length <= 1 ? mot : `${mot[0]}…`)).join(' '),
    [mots]
  );

  useEffect(
    () => () => reconnaissance.current?.stop(),
    []
  );

  const basculerMicro = () => {
    if (microActif) {
      reconnaissance.current?.stop();
      return;
    }
    const Constructeur = constructeurReconnaissance();
    if (!Constructeur) {
      onEnregistrer('Le microphone de récitation n’est pas disponible sur ce navigateur.');
      return;
    }
    const instance = new Constructeur();
    reconnaissance.current = instance;
    instance.lang = 'fr-FR';
    instance.onstart = () => setMicroActif(true);
    instance.onresult = (event) => onEnregistrer(event.results[0]?.[0]?.transcript ?? '');
    instance.onerror = () => setMicroActif(false);
    instance.onend = () => setMicroActif(false);
    instance.start();
  };

  const copierVerset = () => {
    void navigator.clipboard?.writeText(`« ${passageMemoire.texte} » — ${passageMemoire.reference}`);
    setCopiee(true);
    window.setTimeout(() => setCopiee(false), 1800);
  };

  const telechargerFond = () => {
    const toile = document.createElement('canvas');
    toile.width = 1080;
    toile.height = 1920;
    const contexte = toile.getContext('2d');
    if (!contexte) return;

    const fond = contexte.createLinearGradient(0, 0, 0, toile.height);
    fond.addColorStop(0, '#0c1110');
    fond.addColorStop(0.55, '#1c2b25');
    fond.addColorStop(1, '#080b0a');
    contexte.fillStyle = fond;
    contexte.fillRect(0, 0, toile.width, toile.height);

    contexte.textAlign = 'center';
    contexte.fillStyle = '#d8aa55';
    contexte.font = '700 28px sans-serif';
    contexte.fillText('LES FONDEMENTS', 540, 460);
    contexte.fillStyle = '#f7f0df';
    contexte.font = 'italic 50px Georgia, serif';

    const fragments = `« ${passageMemoire.texte} »`.split(' ');
    let ligne = '';
    let hauteur = 700;
    fragments.forEach((fragment) => {
      const essai = `${ligne}${fragment} `;
      if (contexte.measureText(essai).width > 850 && ligne) {
        contexte.fillText(ligne.trim(), 540, hauteur);
        ligne = `${fragment} `;
        hauteur += 76;
      } else {
        ligne = essai;
      }
    });
    contexte.fillText(ligne.trim(), 540, hauteur);
    contexte.fillStyle = '#d8aa55';
    contexte.font = '700 36px sans-serif';
    contexte.fillText(passageMemoire.reference, 540, hauteur + 120);

    const lien = document.createElement('a');
    lien.download = `verset-${passageMemoire.reference.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    lien.href = toile.toDataURL('image/png');
    lien.click();
  };

  const niveaux: Array<{ niveau: NiveauMemoire; titre: string }> = [
    { niveau: 1, titre: 'Lire' },
    { niveau: 2, titre: 'Retrouver' },
    { niveau: 3, titre: 'Initiales' },
    { niveau: 4, titre: 'Réciter' },
  ];

  return (
    <div className="py-6 sm:py-9">
      <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-300/70">
        La Parole que je garde
      </span>
      <h2 className="mt-3 max-w-2xl font-serif text-3xl font-bold leading-tight text-parchemin-100 sm:text-4xl">
        {options.length > 1
          ? 'Lequel de ces versets veux-tu garder avec toi aujourd’hui ?'
          : 'Garde cette Parole avec toi aujourd’hui.'}
      </h2>

      {options.length > 1 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2" role="group" aria-label="Choisir le verset à mémoriser">
          {options.map((option) => {
            const choisi = option.reference === selection;
            return (
              <button
                key={option.reference}
                type="button"
                onClick={() => onChoisir(option.reference)}
                aria-pressed={choisi}
                className={`min-h-28 rounded-3xl border p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-or-300 ${
                  choisi
                    ? 'border-or-300 bg-or-400/16 shadow-[0_0_0_1px_rgba(216,170,85,0.2)]'
                    : 'border-white/12 bg-white/5 hover:border-or-400/35 hover:bg-white/8'
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className={`font-serif text-lg font-bold ${choisi ? 'text-or-200' : 'text-parchemin-100'}`}>
                    {option.reference}
                  </span>
                  <span className={`grid h-7 w-7 place-items-center rounded-full border ${
                    choisi
                      ? 'border-or-300 bg-or-400 text-encre-950'
                      : 'border-white/20 text-transparent'
                  }`}>
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </span>
                </span>
                <span className="mt-3 block line-clamp-2 font-serif text-sm italic leading-relaxed text-parchemin-100/65">
                  « {option.texte} »
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!selectionValide ? (
        <p className="mt-7 rounded-2xl border border-dashed border-or-400/25 bg-or-400/6 px-4 py-4 text-sm text-parchemin-100/65">
          Prends ton temps. La mémorisation commencera avec la Parole que tu auras choisie.
        </p>
      ) : (
        <>
          <div className="mt-8 flex items-center justify-between gap-4 border-b border-or-400/18 pb-4">
            <div>
              <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-300/70">
                Mémoriser la Parole
              </span>
              <p className="mt-1 font-serif text-xl font-bold text-or-200">{passageMemoire.reference}</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={copierVerset} className="grid h-11 w-11 place-items-center rounded-full bg-white/7 text-parchemin-100/70 hover:bg-white/12" aria-label="Copier le verset">
                {copiee ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              </button>
              <button type="button" onClick={() => lireAVoixHaute(`${passageMemoire.reference}. ${passageMemoire.texte}`)} className="grid h-11 w-11 place-items-center rounded-full bg-white/7 text-parchemin-100/70 hover:bg-white/12" aria-label="Écouter le verset">
                <Volume2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {etapesMemoire.length > 1 && (
            <div className="mt-6">
              <p className="text-2xs font-bold uppercase tracking-[0.18em] text-parchemin-100/55">
                Mémorisation progressive
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {etapesMemoire.map((etape, indexEtape) => (
                  <button
                    key={etape.reference}
                    type="button"
                    onClick={() => {
                      setEtapePassage(indexEtape);
                      setNiveau(1);
                    }}
                    aria-pressed={etapePassage === indexEtape}
                    className={`min-h-11 rounded-2xl border px-2 py-2 text-2xs font-bold transition-colors ${
                      etapePassage === indexEtape
                        ? 'border-or-300 bg-or-400/16 text-or-200'
                        : 'border-white/10 bg-white/5 text-parchemin-100/60 hover:bg-white/10'
                    }`}
                  >
                    {etape.libelle}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {niveaux.map((element) => (
              <button
                key={element.niveau}
                type="button"
                onClick={() => setNiveau(element.niveau)}
                className={`min-h-11 rounded-full border px-3 py-2 text-xs font-bold transition-colors ${
                  niveau === element.niveau
                    ? 'border-or-300 bg-or-400 text-encre-950'
                    : 'border-white/10 bg-white/5 text-parchemin-100/65 hover:bg-white/10'
                }`}
              >
                {element.niveau} · {element.titre}
              </button>
            ))}
          </div>

          <div className="mt-7 flex min-h-52 items-center justify-center rounded-3xl border border-or-400/16 bg-encre-950/35 p-6 text-center sm:p-8">
            {niveau === 1 && (
              <p className="font-serif text-xl italic leading-relaxed text-parchemin-100 sm:text-2xl">« {passageMemoire.texte} »</p>
            )}
            {niveau === 2 && (
              <p className="font-serif text-lg leading-loose text-parchemin-100 sm:text-xl">
                {motsATrous.map((element, indexMot) => (
                  <span key={`${element.mot}-${indexMot}`} className="mx-1">
                    {element.masque ? (
                      <span className="rounded border-b border-or-300 bg-or-400/12 px-2 py-0.5 text-or-200">…</span>
                    ) : element.mot}
                  </span>
                ))}
              </p>
            )}
            {niveau === 3 && (
              <p className="font-serif text-lg leading-loose tracking-wider text-or-200 sm:text-xl">{initiales}</p>
            )}
            {niveau === 4 && (
              <div className="w-full max-w-xl">
                <p className="text-sm leading-relaxed text-parchemin-100/60">
                  Le texte disparaît. Récite-le sans prompteur, puis écoute ce que tu as réellement retenu.
                </p>
                <button
                  type="button"
                  onClick={basculerMicro}
                  className={`mx-auto mt-5 grid h-16 w-16 place-items-center rounded-full transition-colors ${
                    microActif ? 'animate-pulse bg-rose-600 text-white' : 'bg-or-400 text-encre-950'
                  }`}
                  aria-label={microActif ? 'Arrêter la récitation' : 'Commencer la récitation'}
                >
                  {microActif ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </button>
                {valeur && <p className="mt-5 rounded-2xl bg-white/6 p-4 font-serif italic text-parchemin-100/75">« {valeur} »</p>}
              </div>
            )}
          </div>

          <button type="button" onClick={telechargerFond} className="mx-auto mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-or-400/22 bg-or-400/8 px-5 text-xs font-bold text-or-200 hover:bg-or-400/14">
            <Download className="h-4 w-4" /> Garder ce verset en fond d&apos;écran
          </button>
        </>
      )}
    </div>
  );
}

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

      <p className="mt-8 text-2xs text-parchemin-100/55">
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
          className="ligne-manuscrite verre w-full rounded-2xl px-5 py-4 text-base text-parchemin-100 outline-none placeholder:font-sans placeholder:text-parchemin-100/50 focus:border-or-400/50"
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
  ariaLabel,
  lignes,
}: {
  valeur: string;
  onEnregistrer: (valeur: string) => void;
  placeholder: string;
  ariaLabel?: string;
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
        aria-label={ariaLabel}
        className="verre w-full resize-none rounded-3xl px-5 py-4 text-base leading-relaxed text-parchemin-100 outline-none placeholder:text-parchemin-100/50 focus:border-or-400/50"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-2xs text-parchemin-100/55">
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

function SceneCloture({
  fiche,
  onQuitter,
  tempsDuJour = false,
}: {
  fiche: FicheLivret;
  onQuitter: () => void;
  tempsDuJour?: boolean;
}) {
  return (
    <div className="animate-reveal py-16 text-center sm:py-24">
      <span className="mx-auto grid h-20 w-20 animate-halo place-items-center rounded-full bg-or-400/15 text-or-300">
        <Check className="h-9 w-9" strokeWidth={2} />
      </span>
      <h2 className="mt-8 font-serif text-4xl font-bold leading-tight text-parchemin-100 sm:text-5xl">
        {tempsDuJour ? (
          <>La Parole est <span className="titre-or">semée.</span></>
        ) : (
          <>Fiche {fiche.id} <span className="titre-or">préparée.</span></>
        )}
      </h2>
      <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-parchemin-100/65">
        {tempsDuJour
          ? 'Ta lecture, ta méditation, ta prière et ton pas sont enregistrés. Tu pourras les retrouver dans ton carnet.'
          : 'Votre groupe le voit. Le reste — vos réponses, ce que vous avez écrit — ne regarde que vous, jusqu’à ce que vous décidiez d’en parler.'}
      </p>
      <button
        onClick={onQuitter}
        className="bouton-or mt-9 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold"
      >
        {tempsDuJour ? 'Revenir à ma table' : 'Revenir à la fiche'}
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
