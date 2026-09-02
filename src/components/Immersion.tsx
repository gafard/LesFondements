'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
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
  ShieldCheck,
  Users,
} from 'lucide-react';
import ShareableVerseCard from '@/components/ShareableVerseCard';
import TexteAvecReferences from '@/components/ReferenceCliquable';
import Illumination from '@/components/Illumination';
import ChampDictée from '@/components/ChampDictée';
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
import { etapesTempsApart } from '@/lib/tempsApart';
import { memoriserPassage } from '@/lib/marquePage';
import { comparer } from '@/lib/recitation';
import { enregistrerRevision, qualiteDepuisScore } from '@/lib/memorisation';
import { useAuth } from '@/lib/AuthContext';
import { decouperEnMoments, momentDe, type Moment } from '@/lib/moments';
import {
  accompagnementDuJour,
  repartirQuestions,
  type AccompagnementEditorial,
  type PhaseQuestion,
  type PrioriteQuestion,
} from '@/lib/parcoursEditorial';
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
  source?: 'parole' | 'livret' | 'contemplation' | 'vie';
  phase?: PhaseQuestion;
  priorite?: PrioriteQuestion;
  consigne?: string;
  question: string;
  priereTitre?: string;
}

interface SectionMeditation {
  sectionTitre: string;
  versets: string[];
  questions: QuestionMeditation[];
  pratique?: {
    mode?: 'transformation';
    rappelQuestionId?: string;
    rappelTitre?: string;
    questionMoment?: string;
    placeholderMoment?: string;
    questionAction: string;
    placeholderAction?: string;
  };
}

interface FicheMeditation {
  ficheId: number;
  sections: SectionMeditation[];
  /** Indicateur historique, conservé pour lire les données existantes. */
  parcoursGuide?: boolean;
  synthese?: {
    question: string;
    questionVerset: string;
    etapes?: string[];
    reprises?: Array<{ titre: string; questionId: string }>;
  };
}

interface PassageAncrage {
  reference: string;
  texte: string;
}

type Scene = { piste?: string } & (
  | { type: 'seuil' }
  | { type: 'ouverture-section'; titre: string; rang: number; total: number }
  | { type: 'bloc'; bloc: Bloc; sousTitre: string | null; section: string | null }
  | { type: 'silence'; apres: 'lecture' | 'priere' }
  | {
      type: 'meditation';
      sectionTitre: string;
      questions: QuestionMeditation[];
      approfondissement: QuestionMeditation[];
    }
  | { type: 'priere'; id: string; questions: QuestionMeditation[] }
  | { type: 'accompagnement'; contenu: AccompagnementEditorial }
  | { type: 'ancrage-verset'; id: string; reference: string; texte: string; options: PassageAncrage[] }
  | { type: 'resume'; section: ResumeSection }
  | { type: 'verset'; reference: string; texte: string | null }
  | { type: 'lecture'; texte: string }
  | { type: 'question'; id: string; texte: string; section?: string }
  | { type: 'pas'; id?: string; reference?: string; options?: PassageAncrage[]; pratique?: SectionMeditation['pratique'] }
  | {
      type: 'synthese-fiche';
      id: string;
      question: string;
      questionVerset: string;
      etapes?: string[];
      reprises?: Array<{ titre: string; questionId: string }>;
    }
  | { type: 'cloture' }
);

const MEDITATIONS = meditationData as FicheMeditation[];

function construireScenario(fiche: FicheLivret, sectionCibleIndex?: number | null): Scene[] {
  if (sectionCibleIndex !== undefined && sectionCibleIndex !== null && sectionCibleIndex >= 0) {
    const etapes = etapesTempsApart(fiche);
    const etape = etapes[sectionCibleIndex];
    const section = etape?.section;
    if (!section) return [{ type: 'seuil', piste: pisteId.seuil(fiche.id) }, { type: 'cloture' }];

    const parcoursMeditation = MEDITATIONS.find((element) => element.ficheId === fiche.id);
    const meditation = parcoursMeditation?.sections[sectionCibleIndex];
    const idSection = `f${fiche.id}-s${sectionCibleIndex + 1}`;
    const questionsOuvertes: QuestionMeditation[] = [
      {
        id: `${idSection}-regarder`,
        fonction: 'observer',
        consigne: 'Relis le passage du livret et les textes bibliques associés, sans chercher à répondre trop vite.',
        question: 'Qu’est-ce qui retient ton attention ?',
      },
      {
        id: `${idSection}-repondre`,
        fonction: 'repondre',
        question: 'Qu’est-ce que tu veux continuer à méditer, questionner ou apporter à Dieu ?',
      },
    ];
    const questionsAjoutees = meditation?.questions.length ? meditation.questions : questionsOuvertes;
    // Les séries anciennes des fiches 11, 12 et 16–20 avaient été générées
    // comme des examens très directifs. Tant qu'elles ne sont pas relues une
    // à une, le parcours utilise deux invitations ouvertes et laisse le texte
    // original porter la journée.
    const questionsSource = fiche.id >= 11 && questionsAjoutees.every((question) => !question.source)
      ? questionsOuvertes
      : questionsAjoutees;
    const { principales: questions, approfondissement } = repartirQuestions(questionsSource);
    const accompagnement = accompagnementDuJour(fiche.id, sectionCibleIndex);
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
        total: etapes.filter((element) => element.section.titre).length,
        piste: etape.ouverturePreenregistree
          ? pisteId.section(fiche.id, etape.sourceSectionIndex)
          : undefined,
      });
    }

    // Le livret est la source du parcours, même lorsqu'une facilitation
    // numérique a été écrite pour ce jour. Elle vient après le texte et ne le
    // remplace jamais.
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
        piste: pisteId.bloc(
          fiche.id,
          etape.sourceSectionIndex,
          etape.sourceBlocOffset + indexBloc
        ),
      });
      sousTitre = null;
    });

    scenes.push(
      {
        type: 'meditation',
        sectionTitre: section.titre || fiche.titre,
        questions,
        approfondissement,
      },
    );
    if (accompagnement) scenes.push({ type: 'accompagnement', contenu: accompagnement });
    scenes.push(
      { type: 'priere', id: idSection, questions: [...questions, ...approfondissement] },
      { type: 'silence', apres: 'priere' },
      { type: 'ancrage-verset', id: idSection, reference, texte, options },
      { type: 'pas', id: idSection, reference, options, pratique: meditation?.pratique },
    );
    if (sectionCibleIndex === etapes.length - 1 && parcoursMeditation?.synthese) {
      scenes.push({
        type: 'synthese-fiche',
        id: `f${fiche.id}`,
        ...parcoursMeditation.synthese,
      });
    }
    scenes.push({ type: 'cloture' });
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

  scenes.push({ type: 'silence', apres: 'lecture' });

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
  /** Repère stable préféré à l'ancien index numérique de scène. */
  momentInitial?: string | null;
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
  momentInitial = null,
  sectionIndex = null,
}: ImmersionProps) {
  const scenario = useMemo(
    () => construireScenario(fiche, sectionIndex),
    [fiche, sectionIndex]
  );
  const [index, setIndex] = useState(() => {
    const indexDuMoment = momentInitial
      ? scenario.findIndex((candidate) => candidate.type === momentInitial)
      : -1;
    const depart = indexDuMoment >= 0 ? indexDuMoment : indexInitial;
    return Math.max(0, Math.min(scenario.length - 1, depart));
  });
  const [ambiance, setAmbiance] = useState<Ambiance>('emotional-piano');
  const [lecture, setLecture] = useState(false);
  const [genreVoixLocal, setGenreVoixLocal] = useState<GenreVoix>(() => getGenreVoix());
  const [manifeste, setManifeste] = useState<Manifeste | null>(null);
  const [manifesteVivienne, setManifesteVivienne] = useState<ManifesteVivienne | null>(null);
  const [enchainer, setEnchainer] = useState(false);
  const [cloture, setCloture] = useState(false);
  const [audioEnCours, setAudioEnCours] = useState(false);
  const [erreurVoix, setErreurVoix] = useState<string | null>(null);
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
      case 'accompagnement': return 'Être accompagné';
      case 'priere': return 'Prier';
      case 'ancrage-verset': return 'Mémoriser';
      case 'resume': return `L’essentiel — ${scene.section.titre}`;
      case 'verset': return scene.reference;
      case 'lecture': return 'Lecture dans votre Bible';
      case 'question': return 'Écriture personnelle';
      case 'pas': return scene.id ? 'Vivre cette Parole' : 'Vivre cette vérité';
      case 'synthese-fiche': return 'Relire le chemin parcouru';
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
      case 'accompagnement':
        return `${courante.contenu.titre}. ${courante.contenu.texte}`;
      case 'priere':
        return 'Relis ce que tu viens d’écrire. Puis parle simplement à Dieu à partir de ce que tu as découvert. Tu peux aussi rester un instant en silence.';
      case 'ancrage-verset': {
        if (courante.options.length > 1 && !choixVersetAncrage) return null;
        const reference = choixVersetAncrage ?? courante.reference;
        const passage = courante.options.find((option) => option.reference === reference)
          ?? courante.options[0];
        return `${passage.reference}. ${passage.texte}`;
      }
      case 'synthese-fiche':
        return `${courante.question} ${courante.questionVerset}`;
      default:
        return null;
    }
  }, [choixVersetAncrage]);

  // ── Les moments ─────────────────────────────────────────────
  // « 17/55 · 38 min » dit la vérité et décourage. Le scénario se regroupe
  // en temps nommés — entrer, écouter, méditer, mémoriser, écrire, conclure
  // — dont chacun se tient d'une traite.
  const moments = useMemo(
    () => decouperEnMoments(scenario.map((s) => ({
      type: s.type === 'silence' && s.apres === 'priere' ? 'silence-priere' : s.type,
      texte: texteDeLaScene(s),
    }))),
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
      setErreurVoix(null);
      arreterLecture();
      setIndex((valeur) => Math.max(0, Math.min(scenario.length - 1, valeur + delta)));
    },
    [ancragePret, scenario.length]
  );

  useEffect(() => {
    enchainerRef.current = enchainer;
  }, [enchainer]);

  const lireScene = useCallback(
    (courante: Scene) => {
      const texte = texteDeLaScene(courante);
      if (!texte) {
        setAudioEnCours(false);
        return false;
      }
      setErreurVoix(null);
      const demarree = lireAVoixHaute(texte, {
        genre: genreVoixLocal,
        repliNavigateur: false,
        onDebut: () => {
          setErreurVoix(null);
          setAudioEnCours(true);
        },
        onFin: () => {
          setAudioEnCours(false);
          if (enchainerRef.current) aller(1);
        },
        onErreur: () => {
          setAudioEnCours(false);
          setErreurVoix('Voix studio momentanément indisponible');
        },
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
        ? `/fiches/${fiche.id}`
        : `/aujourdhui?fiche=${fiche.id}&section=${sectionIndex}&moment=${scene.type}`,
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
        lireScene(scene);
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
        lireScene(scene);
      }
    }
  }, [lecture, audioEnCours, pisteCourante, scene, lireScene]);

  useEffect(() => {
    if (!lecture || pisteCourante) {
      arreterLecture();
      return;
    }
    // La synthèse appelle ses callbacks d'état dès le démarrage. La lancer
    // après l'effet évite une cascade de rendu synchrone et laisse React
    // stabiliser la scène courante avant que la voix prenne la main.
    const minuteur = window.setTimeout(() => lireScene(scene), 0);
    return () => {
      window.clearTimeout(minuteur);
      arreterLecture();
    };
  }, [lecture, scene, pisteCourante, lireScene]);

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
    <div
      className="immersion-bureau fixed inset-0 z-[60] overflow-hidden"
      // En capture, et sans rien empêcher : le toucher rappelle les
      // commandes et poursuit sa route vers le champ ou le bouton visé.
      onPointerDownCapture={() => setChrome(true)}
    >
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
          <div className="mb-2 flex items-center justify-between gap-3 border-b border-white/8 pb-3 text-3xs font-black uppercase tracking-[0.18em] text-parchemin-100/55">
            <span>Table de travail</span>
            <span className="truncate text-right text-or-300/65">{libelleScene}</span>
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

      {/* ── Barre basse légère ─────────────────────────────────
          La progression vit déjà en haut. Ici, on garde seulement les trois
          gestes utiles : revenir, écouter si besoin, poursuivre. */}
      {!cloture && (
        <footer
          className={`absolute inset-x-0 bottom-0 z-20 px-3 pb-4 transition-all duration-500 sm:px-8 sm:pb-7 ${
            chrome ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
          }`}
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="immersion-console mx-auto flex max-w-xl items-center justify-between gap-2.5 rounded-full border border-white/12 px-3 py-2 shadow-2xl">
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

            <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-1">
              <button
                onClick={basculerLectureOuPause}
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-transform active:scale-95 ${
                  audioEnCours
                    ? 'bg-or-400 text-encre-950 shadow-xs'
                    : 'border border-white/12 bg-white/7 text-parchemin-100/70'
                }`}
                aria-label={audioEnCours ? 'Mettre en pause' : 'Écouter'}
                title={audioEnCours ? 'Mettre en pause' : 'Écouter'}
              >
                {audioEnCours ? (
                  <Pause className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                )}
              </button>

              <span className="hidden truncate text-xs font-bold text-parchemin-100/60 sm:block">
                {erreurVoix ?? (audioEnCours ? 'Lecture en cours' : libelleScene)}
              </span>
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

      <FeuilleOptions
        ouverte={feuille}
        onFermer={() => setFeuille(false)}
        ambiance={ambiance}
        setAmbiance={setAmbiance}
        lecture={lecture}
        setLecture={setLecture}
        enchainer={enchainer}
        setEnchainer={setEnchainer}
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
        onEnded={() => {
          activerDuckingVoix(false, sourceDuckingAudio.current);
          setAudioEnCours(false);
          if (enchainer) aller(1);
        }}
        onError={() => {
          activerDuckingVoix(false, sourceDuckingAudio.current);
          if (lecture) lireScene(scene);
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
  enchainer,
  setEnchainer,
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
  enchainer: boolean;
  setEnchainer: (valeur: boolean) => void;
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
            <div className="space-y-2">
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
                  Lecture vocale
                </span>
                <span className="text-2xs font-bold text-parchemin-100/45">
                  {lecture ? 'Active' : 'Coupée'}
                </span>
              </button>
              <button
                onClick={() => setEnchainer(!enchainer)}
                aria-pressed={enchainer}
                className="flex w-full items-center justify-between rounded-2xl bg-white/8 px-4 py-3.5 text-left transition-colors hover:bg-white/14"
              >
                <span className="flex items-center gap-2.5 text-sm text-parchemin-100">
                  <Play className="h-4 w-4 text-parchemin-100/50" />
                  Enchaîner les lectures
                </span>
                <span className="text-2xs font-bold text-parchemin-100/45">
                  {enchainer ? 'Oui' : 'Non'}
                </span>
              </button>
            </div>
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
      return <SceneSilence apres={scene.apres} />;

    case 'meditation': {
      return (
        <PileDeNotes
          key={scene.sectionTitre}
          titre={scene.sectionTitre}
          questions={scene.questions}
          approfondissement={scene.approfondissement}
          reponses={reponses}
          onEnregistrer={onEnregistrer}
        />
      );
    }

    case 'accompagnement':
      return <SceneAccompagnement contenu={scene.contenu} />;

    case 'priere': {
      const reprises = scene.questions.map((question) => {
        const reponse = reponses[`q:${question.id}`]?.trim();
        return {
          id: question.id,
          titre: question.priereTitre ?? question.question,
          consigne: question.consigne,
          reponse: reponse || '',
        };
      });
      return (
        <ScenePriereImmersive
          reprises={reprises}
          questions={scene.questions}
        />
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
      const rappelTransformation = scene.pratique?.rappelQuestionId
        ? reponses[`q:${scene.pratique.rappelQuestionId}`]?.trim()
        : '';
      const modeTransformation = scene.pratique?.mode === 'transformation';
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
              {rappelTransformation && (
                <aside className="post-it-jaune pose-1 relative mt-7 max-w-xl rounded-[4px] p-5 text-encre-950 shadow-xl sm:p-6">
                  <span className="punaise punaise-bleue -top-2.5 left-8" aria-hidden="true" />
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-encre-700/65">
                    {scene.pratique?.rappelTitre ?? 'La situation que tu as identifiée'}
                  </p>
                  <p className="mt-3 font-serif text-lg font-bold leading-relaxed sm:text-xl">
                    {rappelTransformation}
                  </p>
                </aside>
              )}
              {!modeTransformation && (
                <>
                  <p className="mt-6 max-w-2xl font-serif text-xl font-bold leading-relaxed text-parchemin-100">
                    {scene.pratique?.questionMoment
                      ?? 'Dans quel moment concret de ta journée voudrais-tu revenir à cette Parole ?'}
                  </p>
                  <ChampEcriture
                    valeur={reponses[cleMoment] ?? ''}
                    onEnregistrer={(valeur) => onEnregistrer(cleMoment, valeur)}
                    placeholder={scene.pratique?.placeholderMoment ?? 'Je veux me souvenir de ce verset lorsque…'}
                    ariaLabel="Le moment où je veux me souvenir de ce verset"
                    lignes={3}
                  />
                </>
              )}
              <p className="mt-6 max-w-2xl font-serif text-xl font-bold leading-relaxed text-parchemin-100">
                {scene.pratique?.questionAction
                  ?? 'Et quand ce moment arrivera, qu’aimerais-tu faire à partir de cette Parole ?'}
              </p>
              <ChampEcriture
                valeur={reponses[clePas] ?? ''}
                onEnregistrer={(valeur) => onEnregistrer(clePas, valeur)}
                placeholder={scene.pratique?.placeholderAction ?? 'Quand ce moment arrivera, je veux…'}
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

    case 'synthese-fiche': {
      const etapes = scene.etapes?.length
        ? scene.etapes
        : ['Péché', 'Loi', 'Salut', 'Grâce'];
      const reprises = (scene.reprises ?? []).flatMap((reprise) => {
        const reponse = reponses[`q:${reprise.questionId}`]?.trim();
        return reponse ? [{ ...reprise, reponse }] : [];
      });
      const papiersSynthese = ['post-it-jaune pose-1', 'post-it-bleu pose-2', 'post-it-rose pose-3'];
      const versetsChoisis = Array.from({ length: etapes.length }, (_, indexSection) =>
        reponses[`verset-choisi:f${fiche.id}-s${indexSection + 1}`]
      ).filter((reference): reference is string => Boolean(reference));
      const versetPrincipal = reponses[`verset-principal:${scene.id}`] ?? '';
      return (
        <div className="py-8 sm:py-12">
          <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-300/70">
            Synthèse de la fiche
          </span>
          <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-parchemin-100 sm:text-4xl">
            Regarde le chemin parcouru.
          </h2>
          <div
            className={`mt-6 grid grid-cols-2 gap-2 ${
              etapes.length <= 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3 lg:grid-cols-6'
            }`}
            aria-label={`Les ${etapes.length} mouvements de la fiche`}
          >
            {etapes.map((titre, indexTitre) => (
              <span
                key={titre}
                className={`rounded-xl border px-2 py-3 text-center text-2xs font-black uppercase tracking-[0.1em] ${
                  indexTitre % 2 === 0
                    ? 'border-or-400/20 bg-or-400/8 text-or-200'
                    : 'border-white/10 bg-white/5 text-parchemin-100/65'
                }`}
              >
                {titre}
              </span>
            ))}
          </div>
          {reprises.length > 0 && (
            <section className="mt-9" aria-labelledby="synthese-identifie">
              <h3
                id="synthese-identifie"
                className="text-2xs font-black uppercase tracking-[0.18em] text-or-300/75"
              >
                Ce que j’ai identifié aujourd’hui
              </h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {reprises.map((reprise, indexReprise) => (
                  <article
                    key={reprise.questionId}
                    className={`${papiersSynthese[indexReprise % papiersSynthese.length]} relative rounded-[4px] p-5 text-encre-950 shadow-xl`}
                  >
                    <span
                      className={`punaise -top-2.5 ${indexReprise % 2 === 0 ? 'left-8' : 'right-8 punaise-bleue'}`}
                      aria-hidden="true"
                    />
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-encre-700/65">
                      {reprise.titre}
                    </p>
                    <p className="mt-3 font-serif text-base font-bold leading-relaxed sm:text-lg">
                      {reprise.reponse}
                    </p>
                  </article>
                ))}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-parchemin-100/60">
                Tu n’as pas besoin de tout régler aujourd’hui. Choisis une seule chose à continuer
                de travailler avec Dieu.
              </p>
            </section>
          )}
          <p className="mt-8 max-w-2xl font-serif text-xl font-bold leading-relaxed text-parchemin-100">
            {scene.question}
          </p>
          <ChampEcriture
            valeur={reponses[`synthese:${scene.id}`] ?? ''}
            onEnregistrer={(valeur) => onEnregistrer(`synthese:${scene.id}`, valeur)}
            placeholder="La vérité sur Dieu que je veux emporter…"
            lignes={4}
          />
          {versetsChoisis.length > 0 && (
            <div className="mt-9">
              <p className="max-w-2xl font-serif text-xl font-bold leading-relaxed text-parchemin-100">
                {scene.questionVerset}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {versetsChoisis.map((reference) => {
                  const choisi = reference === versetPrincipal;
                  return (
                    <button
                      key={reference}
                      type="button"
                      aria-pressed={choisi}
                      onClick={() => onEnregistrer(`verset-principal:${scene.id}`, reference)}
                      className={`min-h-12 rounded-2xl border px-4 py-3 text-left font-serif text-base font-bold transition-colors ${
                        choisi
                          ? 'border-or-300 bg-or-400/16 text-or-100'
                          : 'border-white/12 bg-white/5 text-parchemin-100/75 hover:bg-white/10'
                      }`}
                    >
                      {reference}
                    </button>
                  );
                })}
              </div>
            </div>
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

interface ReprisePriere {
  id: string;
  titre: string;
  consigne?: string;
  reponse: string;
}

/** 📖 la Parole, 📘 le livret, 🪞 ma vie, 🌿 le temps qu'on prend. */
function etiquetteDeSource(source: QuestionMeditation['source']): string | null {
  if (source === 'parole') return '📖 La Parole';
  if (source === 'livret') return '📘 Repère du livret';
  if (source === 'vie') return '🪞 Ma vie aujourd’hui';
  if (source === 'contemplation') return '🌿 Prends le temps';
  return null;
}

function etiquetteDePhase(phase: QuestionMeditation['phase']): string | null {
  if (phase === 'regarder') return 'Regarder';
  if (phase === 'comprendre') return 'Comprendre';
  if (phase === 'relier') return 'Relier';
  if (phase === 'mettre-en-mots') return 'Mettre en mots';
  return null;
}

/**
 * Les feuilles qui attendent leur tour, entrevues derrière celle de devant.
 *
 * Deux pièges, payés une fois : les classes de papier — `.post-it-*`,
 * `.fiche-bristol` — fixent `position: relative` depuis la feuille de styles
 * et l'emportent sur l'utilitaire `absolute`, qui vit dans une couche ; le
 * placement tient donc sur une enveloppe, et le papier reste à l'intérieur.
 * Et l'on ne rapetisse pas les feuilles à la main : le recul s'en charge, là
 * où une mise à l'échelle les faisait rentrer sous celle de devant
 * exactement autant que le décalage les en sortait.
 */
function FeuillesEnAttente({
  restantes,
  papier,
}: {
  restantes: number;
  papier: (ecart: number) => string;
}) {
  return (
    <>
      {Array.from({ length: Math.max(0, Math.min(restantes, 3)) }, (_, index) => {
        const ecart = index + 1;
        return (
          <div
            key={`attente-${ecart}`}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{
              // Décalées de côté autant que vers le bas : une pile ne se voit
              // que par les bords qui dépassent. Alignées sur l'axe, les
              // feuilles disparaissaient derrière celle de devant.
              transform: `translate3d(${ecart % 2 === 0 ? ecart * 10 : ecart * -10}px, ${
                ecart * 22
              }px, ${ecart * -80}px) rotate(${
                ecart % 2 === 0 ? ecart * 1.5 : ecart * -1.5
              }deg) scale(${1 - ecart * 0.03})`,
              opacity: 0.8 - ecart * 0.2,
              zIndex: 3 - ecart,
            }}
          >
            <div className={`${papier(ecart)} h-full w-full shadow-xl`} />
          </div>
        );
      })}
    </>
  );
}

/**
 * La pile de notes.
 *
 * La méditation empilait ses questions à la verticale : jusqu'à dix cartes
 * ouvertes en même temps, un long défilement, et l'impression désagréable
 * qu'il faut tout remplir d'un coup. Le regard n'avait nulle part où se
 * poser.
 *
 * Ici, une seule note est devant, posée à plat. Les suivantes dépassent
 * derrière elle, en biais, comme des feuilles laissées sur un coin de table.
 * On répond, on fait glisser, la feuille suivante remonte. Rien n'a changé
 * du contenu — c'est la même table, le même papier, la même encre : on a
 * seulement cessé de tout montrer à la fois.
 */
function PileDeNotes({
  titre,
  questions,
  approfondissement,
  reponses,
  onEnregistrer,
}: {
  titre: string;
  questions: QuestionMeditation[];
  approfondissement: QuestionMeditation[];
  reponses: Record<string, string>;
  onEnregistrer: (cle: string, valeur: string) => void;
}) {
  const [rang, setRang] = useState(0);
  const [sens, setSens] = useState<1 | -1 | 0>(0);
  const [mode, setMode] = useState<'essentiel' | 'approfondir'>('essentiel');
  const departGlissement = useRef<number | null>(null);
  const questionsAffichees = mode === 'essentiel' ? questions : approfondissement;
  const total = questionsAffichees.length;
  const courant = Math.min(rang, total - 1);

  const papiers = ['post-it-jaune', 'post-it-bleu', 'post-it-rose'];
  const poses = ['pose-1', 'pose-2', 'pose-3', 'pose-4'];

  const aller = useCallback(
    (delta: number) => {
      setSens(delta > 0 ? 1 : -1);
      setRang((valeur) => Math.max(0, Math.min(total - 1, valeur + delta)));
    },
    [total]
  );

  const toutesLesQuestions = [...questions, ...approfondissement];
  const repondues = toutesLesQuestions.filter((q) => (reponses[`q:${q.id}`] ?? '').trim()).length;
  const cheminCompose = questions.some((question) => question.phase !== undefined);

  const carte = (question: QuestionMeditation, index: number, devant: boolean) => {
    const reponse = reponses[`q:${question.id}`] ?? '';
    const etiquette = etiquetteDeSource(question.source);
    const phase = etiquetteDePhase(question.phase);
    return (
      <>
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <span aria-hidden="true" className="font-serif text-xl italic text-encre-700/55">
              {String(index + 1).padStart(2, '0')}
            </span>
            {etiquette && (
              <span className="truncate rounded-full border border-encre-700/12 bg-white/35 px-2.5 py-1 text-xs font-black uppercase tracking-[0.06em] text-encre-800/70">
                {etiquette}
              </span>
            )}
            {phase && (
              <span className="truncate rounded-full bg-encre-950/8 px-2.5 py-1 text-xs font-black uppercase tracking-[0.06em] text-encre-900/75">
                {phase}
              </span>
            )}
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
        {devant && (
          <div className="mt-4">
            <ChampDictée
              valeur={reponse}
              onEnregistrer={(valeur) => onEnregistrer(`q:${question.id}`, valeur)}
              placeholder="Écris ou dicte à la voix ce qui vient dans ton cœur…"
              ariaLabel={question.question}
              questionPourAudio={`${question.consigne ? `${question.consigne}. ` : ''}${question.question}`}
              theme="clair"
              lignes={3}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="py-4 sm:py-6">
      {/* L'en-tête tenait sur trois cent pixels — un intitulé, un grand titre
          et un paragraphe d'explication — avant même la première note. Sur un
          téléphone, la note commençait à mi-écran et finissait derrière la
          barre du bas. Il ne reste ici que ce qu'on relit vraiment. */}
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-300/70">
          {mode === 'essentiel'
            ? cheminCompose ? 'Chemin de compréhension' : 'Regarder puis répondre'
            : 'Approfondir librement'}
        </span>
        <span
          aria-live="polite"
          className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-2xs font-bold text-parchemin-100/55"
        >
          {courant + 1} / {total}
        </span>
      </div>
      <h2 className="mt-1.5 font-serif text-xl font-bold leading-snug text-parchemin-100 sm:text-3xl">
        {mode === 'essentiel'
          ? cheminCompose
            ? `Regarder, comprendre et mettre en mots « ${titre} »`
            : `Laisser « ${titre} » descendre dans le cœur`
          : 'Continuer seulement si tu en as le désir'}
      </h2>
      {repondues === 0 && (
        <p className="mt-2 text-2xs leading-relaxed text-parchemin-100/50">
          Une note à la fois. Relis, attends, écris — puis fais glisser.
        </p>
      )}

      <div
        className="relative mt-5 [perspective:1400px]"
        onTouchStart={(event) => {
          departGlissement.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (departGlissement.current === null) return;
          const distance = departGlissement.current - (event.changedTouches[0]?.clientX ?? 0);
          departGlissement.current = null;
          if (Math.abs(distance) < 48) return;
          aller(distance > 0 ? 1 : -1);
        }}
        onTouchCancel={() => {
          departGlissement.current = null;
        }}
      >
        <FeuillesEnAttente
          restantes={total - courant - 1}
          papier={(ecart) => papiers[(courant + ecart) % papiers.length]}
        />

        {/* La note posée devant : c'est elle qui donne sa hauteur à la pile.
            L'enveloppe porte le mouvement, la feuille garde son inclinaison. */}
        <div
          key={questionsAffichees[courant].id}
          className={`relative z-10 ${
            sens === 1 ? 'note-avant' : sens === -1 ? 'note-arriere' : 'note-posee'
          }`}
        >
          <article
            className={`${papiers[courant % papiers.length]} ${
              poses[courant % poses.length]
            } rounded-[4px] text-encre-950 shadow-2xl`}
          >
            <span
              className={`punaise -top-2.5 ${courant % 2 === 0 ? 'left-8' : 'right-8 punaise-bleue'}`}
              aria-hidden="true"
            />
            {/* Le défilement vit à l'intérieur de la feuille. Sans ce plafond,
                une note longue repoussait « Précédente » et « Suivante » sous
                la barre du bas, et l'on ne pouvait plus avancer. */}
            <div className="max-h-[46svh] overflow-y-auto p-5 sm:max-h-[56svh] sm:p-6">
              {carte(questionsAffichees[courant], courant, true)}
            </div>
          </article>
        </div>
      </div>

      {/* Les feuilles en attente dépassent d'une cinquantaine de pixels sous
          la note de devant : les commandes se placent en dessous. */}
      <div className="mt-16 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => aller(-1)}
          disabled={courant === 0}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 text-xs font-bold text-parchemin-100/80 transition-colors hover:bg-white/12 disabled:opacity-25"
        >
          <ChevronLeft className="h-4 w-4" /> Précédente
        </button>

        {/* Des repères, pas des commandes : la règle de cible tactile impose
            44 px à tout bouton, ce qui ferait neuf disques là où il ne faut
            qu'un fil. On avance par les flèches ou d'un glissement. */}
        <span className="flex items-center gap-1.5" aria-hidden="true">
          {questionsAffichees.map((question, index) => {
            const ecrite = (reponses[`q:${question.id}`] ?? '').trim().length > 0;
            return (
              <span
                key={`point-${question.id}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === courant
                    ? 'w-5 bg-or-300'
                    : ecrite
                      ? 'w-1.5 bg-emerald-300/70'
                      : 'w-1.5 bg-white/22'
                }`}
              />
            );
          })}
        </span>

        <button
          type="button"
          onClick={() => aller(1)}
          disabled={courant === total - 1}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 text-xs font-bold text-parchemin-100/80 transition-colors hover:bg-white/12 disabled:opacity-25"
        >
          Suivante <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-3 text-center text-2xs text-parchemin-100/40">
        {repondues} note{repondues > 1 ? 's' : ''} déposée{repondues > 1 ? 's' : ''}
      </p>

      {approfondissement.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setMode((valeur) => valeur === 'essentiel' ? 'approfondir' : 'essentiel');
            setRang(0);
            setSens(0);
          }}
          className="mx-auto mt-4 flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 text-xs font-bold text-parchemin-100/70 transition-colors hover:bg-white/10 hover:text-parchemin-100"
        >
          {mode === 'essentiel' ? (
            <>
              <Plus className="h-4 w-4" />
              Approfondir librement · {approfondissement.length} piste{approfondissement.length > 1 ? 's' : ''}
            </>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4" />
              Revenir au chemin principal
            </>
          )}
        </button>
      )}
    </div>
  );
}

function distanceCirculaire(index: number, actif: number, total: number): number {
  if (total <= 1) return 0;
  let distance = index - actif;
  if (distance > total / 2) distance -= total;
  if (distance < -total / 2) distance += total;
  return distance;
}

function SceneAccompagnement({ contenu }: { contenu: AccompagnementEditorial }) {
  const important = contenu.niveau === 'important';

  return (
    <div className="mx-auto max-w-2xl py-8 sm:py-12">
      <article className="fiche-bristol pose-1 relative rounded-[4px] p-6 text-encre-950 shadow-2xl sm:p-9">
        <span className="attache-pince -top-3 left-10" aria-hidden="true" />
        <div className="flex items-start gap-4">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${
            important ? 'bg-rose-100 text-rose-800' : 'bg-or-100 text-or-900'
          }`}>
            {important
              ? <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              : <Users className="h-6 w-6" aria-hidden="true" />}
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-encre-600">
              À vivre accompagné
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold leading-tight text-encre-950 sm:text-3xl">
              {contenu.titre}
            </h2>
          </div>
        </div>

        <p className="mt-6 text-base leading-relaxed text-encre-800 sm:text-lg">
          {contenu.texte}
        </p>
        <ul className="mt-6 space-y-3 border-y border-dashed border-encre-950/15 py-5">
          {contenu.reperes.map((repere) => (
            <li key={repere} className="flex gap-3 text-sm leading-relaxed text-encre-800">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
              {repere}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-xs leading-relaxed text-encre-600">
            En cas de violence, d’abus, d’emprise ou de danger, cherche aussi l’aide d’un
            professionnel compétent ou des services d’urgence de ton pays.
          </p>
          <a
            href="/groupes"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-encre-950 px-5 text-xs font-bold text-parchemin-50 transition-colors hover:bg-encre-800"
          >
            <Users className="h-4 w-4 text-or-300" aria-hidden="true" />
            Ouvrir ma cellule
          </a>
        </div>
      </article>
    </div>
  );
}

function ScenePriereImmersive({
  reprises,
  questions,
}: {
  reprises: ReprisePriere[];
  questions: QuestionMeditation[];
}) {
  const notesRemplies = reprises.filter((r) => r.reponse && r.reponse.trim().length > 0);
  const elements = notesRemplies.length > 0
    ? notesRemplies
    : questions.slice(0, 2).map((q) => ({
        id: q.id,
        titre: q.question,
        consigne: q.consigne,
        reponse: '',
      }));

  const [indexActif, setIndexActif] = useState(0);
  const elementActif = elements[indexActif] || elements[0];

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6 text-center animate-fade-in sm:py-10">
      {/* ── En-tête du Sanctuaire de Prière ── */}
      <div className="space-y-3">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-or-400/40 bg-or-500/15 text-or-300 shadow-[0_0_35px_rgba(245,158,11,0.25)]">
          <Flame className="h-8 w-8 animate-pulse text-or-400" />
        </span>
        <span className="block text-2xs font-bold uppercase tracking-[0.28em] text-or-300/80">
          Prier la Parole
        </span>
        <h2 className="font-serif text-3xl font-bold leading-tight text-parchemin-100 sm:text-4xl">
          Parle à Dieu à partir de tes découvertes
        </h2>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-parchemin-100/70">
          Prends ce que tu as découvert et écrit lors de ta méditation. Adresse-toi directement à ton Père céleste avec tes propres mots.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 text-left">
        <p className="text-sm leading-relaxed text-parchemin-100/60">
          {elements.length > 1
            ? 'Une découverte à la fois. Fais glisser quand tu as prié.'
            : 'Prends le temps.'}
        </p>
        {elements.length > 1 && (
          <span
            aria-live="polite"
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-parchemin-100/55"
          >
            {indexActif + 1} / {elements.length}
          </span>
        )}
      </div>

      {/* Les découvertes reprises une à une, sur des fiches posées en pile.
          La carte de verre sombre d'avant ne tenait pas sur cette table : on
          prie sur du papier, comme on a médité. */}
      <div className="relative text-left [perspective:1400px]">
        <FeuillesEnAttente restantes={elements.length - indexActif - 1} papier={() => 'fiche-bristol'} />

        <div key={elementActif.id} className="note-posee relative z-10">
          <article className="fiche-bristol pose-2 space-y-5 rounded-[4px] p-6 text-encre-950 shadow-2xl sm:p-8">
            <span className="attache-pince -top-3 left-10" aria-hidden="true" />
            <div>
              <span className="block text-3xs font-black uppercase tracking-[0.18em] text-encre-700/60">
                La vérité que tu as contemplée
              </span>
              <h3 className="mt-1.5 font-serif text-lg font-bold leading-relaxed text-encre-950 sm:text-xl">
                {elementActif.titre}
              </h3>
            </div>

            {elementActif.reponse ? (
              <div className="space-y-1.5 border-l-2 border-or-500/50 pl-4">
                <span className="block text-3xs font-black uppercase tracking-[0.14em] text-or-800/80">
                  Ce que tu as écrit
                </span>
                <p className="manuscrit text-lg leading-relaxed text-encre-800 sm:text-xl">
                  {elementActif.reponse}
                </p>
              </div>
            ) : (
              <p className="border-l-2 border-encre-950/12 pl-4 text-sm italic leading-relaxed text-encre-700">
                Tu n&apos;as rien écrit ici. Ce n&apos;est pas grave : reste devant cette vérité,
                et parle à Dieu dans le secret de ton cœur.
              </p>
            )}

            <div className="space-y-1.5 border-t border-dashed border-encre-950/15 pt-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-or-800">
                Parle à Dieu maintenant
              </p>
              <p className="font-serif text-base italic leading-relaxed text-encre-800 sm:text-lg">
                Reprends tes propres mots. Tu peux remercier, demander, déposer ce qui pèse ou
                simplement rester en silence devant Dieu.
              </p>
              <p className="pt-1 text-xs text-encre-600">
                À voix haute ou dans ton cœur. Rien à écrire ici.
              </p>
            </div>
          </article>
        </div>
      </div>

      {elements.length > 1 && (
        <div className="mt-16 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIndexActif((valeur) => Math.max(0, valeur - 1))}
            disabled={indexActif === 0}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 text-xs font-bold text-parchemin-100/80 transition-colors hover:bg-white/12 disabled:opacity-25"
          >
            <ChevronLeft className="h-4 w-4" /> Précédente
          </button>
          <span className="flex items-center gap-1.5" aria-hidden="true">
            {elements.map((element, index) => (
              <span
                key={`priere-point-${element.id}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === indexActif ? 'w-5 bg-or-300' : 'w-1.5 bg-white/22'
                }`}
              />
            ))}
          </span>
          <button
            type="button"
            onClick={() =>
              setIndexActif((valeur) => Math.min(elements.length - 1, valeur + 1))
            }
            disabled={indexActif === elements.length - 1}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 text-xs font-bold text-parchemin-100/80 transition-colors hover:bg-white/12 disabled:opacity-25"
          >
            Suivante <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
}

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
  const [sensNiveau, setSensNiveau] = useState<1 | -1 | 0>(0);
  const [etapePassage, setEtapePassage] = useState(0);
  const [copiee, setCopiee] = useState(false);
  const [microActif, setMicroActif] = useState(false);
  const [scoreRecitation, setScoreRecitation] = useState<number | null>(null);
  const { user } = useAuth();
  const [indexCarte, setIndexCarte] = useState(() => {
    const indexSelectionne = options.findIndex((option) => option.reference === selection);
    return indexSelectionne >= 0 ? indexSelectionne : 0;
  });
  const debutGlissementCarte = useRef<number | null>(null);
  const debutGlissementNiveau = useRef<number | null>(null);
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
  const feuilleter = useCallback((direction: number) => {
    if (options.length < 2) return;
    setIndexCarte((index) => (index + direction + options.length) % options.length);
  }, [options.length]);

  const terminerGlissementCarte = (positionX: number) => {
    if (debutGlissementCarte.current === null) return;
    const distance = debutGlissementCarte.current - positionX;
    debutGlissementCarte.current = null;
    if (Math.abs(distance) < 42) return;
    feuilleter(distance > 0 ? 1 : -1);
  };

  const changerNiveau = (prochain: NiveauMemoire) => {
    if (prochain === niveau) return;
    setSensNiveau(prochain > niveau ? 1 : -1);
    setNiveau(prochain);
  };

  const terminerGlissementNiveau = (positionX: number) => {
    if (debutGlissementNiveau.current === null) return;
    const distance = debutGlissementNiveau.current - positionX;
    debutGlissementNiveau.current = null;
    if (Math.abs(distance) < 42) return;
    const prochain = distance > 0 ? Math.min(4, niveau + 1) : Math.max(1, niveau - 1);
    changerNiveau(prochain as NiveauMemoire);
  };

  useEffect(
    () => () => reconnaissance.current?.stop(),
    []
  );

  // Réciter en immersion ne laissait aucune trace : le micro recopiait ce
  // qu'on avait dit dans le champ, et c'était tout. Ni score, ni révision —
  // le même verset restait « jamais travaillé » alors qu'on venait de le
  // dire. Il compte maintenant comme partout ailleurs.
  const evaluerRecitation = async (entendu: string) => {
    if (!entendu.trim()) return;
    const resultat = comparer(passageMemoire.texte, entendu);
    setScoreRecitation(resultat.score);
    if (!user) return;
    await enregistrerRevision(
      user.uid,
      passageMemoire.reference,
      qualiteDepuisScore(resultat.score),
      resultat.score
    );
  };

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
    instance.onstart = () => {
      setMicroActif(true);
      setScoreRecitation(null);
    };
    instance.onresult = (event) => {
      const entendu = event.results[0]?.[0]?.transcript ?? '';
      onEnregistrer(entendu);
      void evaluerRecitation(entendu);
    };
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

  const niveaux: Array<{ niveau: NiveauMemoire; titre: string; invitation: string }> = [
    {
      niveau: 1,
      titre: 'Lire lentement',
      invitation: 'Prends d’abord le temps de voir et d’entendre toute la Parole.',
    },
    {
      niveau: 2,
      titre: 'Retrouver les mots',
      invitation: 'Quelques mots s’effacent. Laisse ta mémoire les retrouver sans te presser.',
    },
    {
      niveau: 3,
      titre: 'Suivre les initiales',
      invitation: 'Les premières lettres deviennent un fil discret pour redire le passage.',
    },
    {
      niveau: 4,
      titre: 'Réciter librement',
      invitation: 'Le texte se retire. Redis maintenant la Parole avec ce que tu as gardé.',
    },
  ];
  const niveauActif = niveaux.find((element) => element.niveau === niveau) ?? niveaux[0];

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
        <div className="mt-7" role="group" aria-label="Feuilleter et choisir le verset à mémoriser">
          <div className="flex items-center justify-between gap-4">
            <p className="max-w-xl text-sm leading-relaxed text-parchemin-100/60">
              Fais glisser les cartes. Arrête-toi sur la Parole que tu souhaites emporter.
            </p>
            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-parchemin-100/55" aria-live="polite">
              {indexCarte + 1} / {options.length}
            </span>
          </div>

          <div
            className="relative mt-4 h-80 touch-pan-y overflow-hidden rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_50%_35%,rgba(216,170,85,0.12),transparent_58%)] sm:h-72"
            onTouchStart={(event) => {
              event.stopPropagation();
              debutGlissementCarte.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              event.stopPropagation();
              terminerGlissementCarte(event.changedTouches[0]?.clientX ?? 0);
            }}
            onTouchCancel={(event) => {
              event.stopPropagation();
              debutGlissementCarte.current = null;
            }}
          >
            {options.map((option, indexOption) => {
              const distance = distanceCirculaire(indexOption, indexCarte, options.length);
              const active = distance === 0;
              const choisi = option.reference === selection;
              const visible = Math.abs(distance) <= 1;
              const transformation = active
                ? 'translate3d(-50%, 0, 0)'
                : distance < 0
                  ? 'translate3d(-132%, 0, 0)'
                  : 'translate3d(32%, 0, 0)';
              return (
                <button
                  key={option.reference}
                  type="button"
                  onClick={() => {
                    setIndexCarte(indexOption);
                    onChoisir(option.reference);
                  }}
                  aria-pressed={choisi}
                  aria-current={active ? 'true' : undefined}
                  aria-label={`${option.reference} — ${
                    choisi ? 'Parole choisie' : active ? 'Choisir cette Parole' : 'Afficher et choisir cette Parole'
                  }`}
                  className={`absolute left-1/2 top-5 flex h-64 w-[min(36rem,calc(100%-3.5rem))] flex-col overflow-hidden rounded-[1.75rem] border p-5 text-left shadow-2xl transition-[transform,opacity,border-color] duration-300 ease-out focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-or-300 motion-reduce:transition-none sm:h-60 sm:p-7 ${
                    choisi
                      ? 'border-or-300 bg-[linear-gradient(145deg,rgba(216,170,85,0.22),rgba(11,29,56,0.98)_58%)]'
                      : 'border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,0.09),rgba(11,29,56,0.98)_58%)]'
                  }`}
                  style={{
                    transform: visible ? transformation : 'translate3d(-50%, 0, 0)',
                    opacity: visible ? (active ? 1 : 0.18) : 0,
                    zIndex: active ? 30 : visible ? 15 : 0,
                    pointerEvents: visible ? 'auto' : 'none',
                  }}
                >
                  <span className="flex items-center justify-between gap-4">
                    <span>
                      <span className="block text-xs font-black uppercase tracking-[0.15em] text-or-300/65">
                        Parole {indexOption + 1}
                      </span>
                      <span className="mt-1 block font-serif text-2xl font-bold text-parchemin-100">
                        {option.reference}
                      </span>
                    </span>
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border ${
                      choisi
                        ? 'border-or-300 bg-or-400 text-encre-950'
                        : 'border-white/20 bg-white/5 text-parchemin-100/55'
                    }`}>
                      {choisi
                        ? <Check className="h-5 w-5" aria-hidden="true" />
                        : <Bookmark className="h-5 w-5" aria-hidden="true" />}
                    </span>
                  </span>
                  <span className="mt-5 line-clamp-4 block font-serif text-lg italic leading-relaxed text-parchemin-100/82 sm:text-xl">
                    « {option.texte} »
                  </span>
                  {active && (
                    <span className={`mt-auto inline-flex min-h-11 items-center justify-center self-start rounded-full px-5 text-sm font-bold ${
                      choisi
                        ? 'bg-or-400/15 text-or-200'
                        : 'bg-or-400 text-encre-950 shadow-[0_10px_28px_rgba(216,170,85,0.22)]'
                    }`}>
                      {choisi ? 'Parole choisie' : 'Choisir cette Parole'}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => feuilleter(-1)}
              aria-label="Parole précédente"
              className="absolute left-2 top-1/2 z-40 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-encre-950/80 text-parchemin-100 shadow-xl backdrop-blur transition-colors hover:border-or-300/50 hover:text-or-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-or-300 sm:left-4"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => feuilleter(1)}
              aria-label="Parole suivante"
              className="absolute right-2 top-1/2 z-40 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-encre-950/80 text-parchemin-100 shadow-xl backdrop-blur transition-colors hover:border-or-300/50 hover:text-or-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-or-300 sm:right-4"
            >
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2" aria-label="Choisir une carte Parole">
            {options.map((option, indexOption) => (
              <button
                key={option.reference}
                type="button"
                onClick={() => setIndexCarte(indexOption)}
                aria-label={`Afficher ${option.reference}`}
                aria-current={indexOption === indexCarte ? 'true' : undefined}
                className="group grid h-11 w-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-or-300"
              >
                <span
                  aria-hidden="true"
                  className={`block h-2.5 rounded-full transition-all duration-300 ${
                    indexOption === indexCarte ? 'w-8 bg-or-300' : 'w-2.5 bg-white/25 group-hover:bg-white/45'
                  }`}
                />
              </button>
            ))}
          </div>
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
              <button type="button" onClick={() => lireAVoixHaute(`${passageMemoire.reference}. ${passageMemoire.texte}`, { repliNavigateur: false })} className="grid h-11 w-11 place-items-center rounded-full bg-white/7 text-parchemin-100/70 hover:bg-white/12" aria-label="Écouter le verset">
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
                      setSensNiveau(0);
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

          <div
            className="mt-7 touch-pan-y overflow-hidden px-1 py-3"
            onTouchStart={(event) => {
              debutGlissementNiveau.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              terminerGlissementNiveau(event.changedTouches[0]?.clientX ?? 0);
            }}
            onTouchCancel={() => {
              debutGlissementNiveau.current = null;
            }}
          >
            <article
              key={`${passageMemoire.reference}-${niveau}`}
              className={`fiche-bristol flex min-h-[26rem] flex-col overflow-hidden rounded-[1.75rem] border-t-[7px] p-5 text-encre-950 shadow-2xl sm:p-8 ${
                sensNiveau === 1
                  ? 'carte-etape-suivante'
                  : sensNiveau === -1
                    ? 'carte-etape-precedente'
                    : 'note-posee'
              } ${
                niveau === 1
                  ? 'border-t-or-400'
                  : niveau === 2
                    ? 'border-t-sky-400'
                    : niveau === 3
                      ? 'border-t-violet-400'
                      : 'border-t-rose-400'
              }`}
              aria-live="polite"
            >
              <div className="flex items-start justify-between gap-4 border-b border-dashed border-encre-950/15 pb-5">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-encre-600">
                    Étape {niveau} sur {niveaux.length}
                  </span>
                  <h3 className="mt-1.5 font-serif text-2xl font-bold leading-tight text-encre-950 sm:text-3xl">
                    {niveauActif.titre}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-encre-700">
                    {niveauActif.invitation}
                  </p>
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-encre-950 text-or-300 shadow-lg" aria-hidden="true">
                  {niveau === 1
                    ? <BookOpen className="h-5 w-5" />
                    : niveau === 2
                      ? <Sparkles className="h-5 w-5" />
                      : niveau === 3
                        ? <PenLine className="h-5 w-5" />
                        : <Mic className="h-5 w-5" />}
                </span>
              </div>

              <div className="flex flex-1 items-center justify-center py-8 text-center sm:py-10">
                {niveau === 1 && (
                  <p className="font-serif text-xl italic leading-relaxed text-encre-900 sm:text-2xl">
                    « {passageMemoire.texte} »
                  </p>
                )}
                {niveau === 2 && (
                  <p className="font-serif text-lg leading-loose text-encre-900 sm:text-xl">
                    {motsATrous.map((element, indexMot) => (
                      <span key={`${element.mot}-${indexMot}`} className="mx-1">
                        {element.masque ? (
                          <span className="rounded border-b border-or-700 bg-or-200/75 px-2 py-0.5 text-encre-800">…</span>
                        ) : element.mot}
                      </span>
                    ))}
                  </p>
                )}
                {niveau === 3 && (
                  <p className="font-serif text-lg leading-loose tracking-wider text-encre-800 sm:text-xl">
                    {initiales}
                  </p>
                )}
                {niveau === 4 && (
                  <div className="w-full max-w-xl">
                    <p className="text-sm leading-relaxed text-encre-700">
                      À voix haute ou dans ton cœur. Le microphone peut ensuite t’aider à mesurer ce que tu as retenu.
                    </p>
                    <button
                      type="button"
                      onClick={basculerMicro}
                      className={`mx-auto mt-5 grid h-16 w-16 place-items-center rounded-full transition-colors ${
                        microActif ? 'animate-pulse bg-rose-600 text-white' : 'bg-encre-950 text-or-300'
                      }`}
                      aria-label={microActif ? 'Arrêter la récitation' : 'Commencer la récitation'}
                    >
                      {microActif ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </button>
                    {valeur && (
                      <p className="mt-5 rounded-2xl bg-encre-950/6 p-4 font-serif italic text-encre-800">
                        « {valeur} »
                      </p>
                    )}
                    {scoreRecitation !== null && (
                      <p
                        className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-2xs font-bold ${
                          scoreRecitation >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : scoreRecitation >= 50
                              ? 'bg-or-100 text-or-900'
                              : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {scoreRecitation}% · gardé dans vos révisions
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-dashed border-encre-950/15 pt-4">
                <button
                  type="button"
                  onClick={() => changerNiveau(Math.max(1, niveau - 1) as NiveauMemoire)}
                  disabled={niveau === 1}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-encre-950/15 px-3 text-xs font-bold text-encre-800 transition-colors hover:bg-encre-950/6 disabled:opacity-25 sm:px-4"
                  aria-label="Étape de mémorisation précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Précédente</span>
                </button>

                <div className="flex items-center" aria-label="Choisir une étape de mémorisation">
                  {niveaux.map((element) => (
                    <button
                      key={`niveau-${element.niveau}`}
                      type="button"
                      onClick={() => changerNiveau(element.niveau)}
                      aria-label={`Étape ${element.niveau} : ${element.titre}`}
                      aria-current={niveau === element.niveau ? 'step' : undefined}
                      className="group grid h-11 w-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-encre-950"
                    >
                      <span
                        aria-hidden="true"
                        className={`block h-2 rounded-full transition-all duration-200 ${
                          niveau === element.niveau
                            ? 'w-6 bg-encre-950'
                            : 'w-2 bg-encre-950/20 group-hover:bg-encre-950/40'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => changerNiveau(Math.min(4, niveau + 1) as NiveauMemoire)}
                  disabled={niveau === 4}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-encre-950 px-3 text-xs font-bold text-parchemin-50 transition-colors hover:bg-encre-800 disabled:opacity-25 sm:px-4"
                  aria-label="Étape de mémorisation suivante"
                >
                  <span className="hidden sm:inline">Suivante</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </article>
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
          <span className="mt-3 block text-2xs font-bold uppercase tracking-[0.22em] text-or-300/45">
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

function SceneSilence({ apres }: { apres: 'lecture' | 'priere' }) {
  const [secondes, setSecondes] = useState(45);
  const [encours, setEncours] = useState(false);
  const apresPriere = apres === 'priere';

  useEffect(() => {
    if (!encours || secondes === 0) return;
    const timer = window.setTimeout(() => setSecondes((v) => v - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [encours, secondes]);

  return (
    <div className="py-14 text-center sm:py-24">
      <span className="text-2xs font-bold uppercase tracking-[0.28em] text-or-300/55">
        {apresPriere ? 'Ta prière est déposée' : 'L’exposé est lu'}
      </span>
      <h2 className="mt-5 font-serif text-3xl font-bold leading-tight text-parchemin-100 sm:text-4xl">
        {apresPriere ? 'Reste encore un instant.' : 'Reste là un instant.'}
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-parchemin-100/60">
        {apresPriere
          ? 'Ne passe pas tout de suite à la suite. Demeure simplement devant Dieu avec ce que tu viens de lui confier.'
          : 'Avant de répondre à quoi que ce soit. Ce que tu viens de lire a besoin d’un peu de place.'}
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
          ? 'Tu peux continuer.'
            : encours
            ? 'Respire lentement. Le compte descend tout seul.'
            : 'Touche le cercle pour commencer.'}
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
        placeholder="Écrivez ou dictez ce qui vient, même si c’est incomplet. Personne d’autre ne le lira."
        questionPourAudio={scene.texte}
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
  questionPourAudio,
}: {
  valeur: string;
  onEnregistrer: (valeur: string) => void;
  placeholder: string;
  ariaLabel?: string;
  lignes: number;
  questionPourAudio?: string;
}) {
  return (
    <div className="mt-4">
      <ChampDictée
        valeur={valeur}
        onEnregistrer={onEnregistrer}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
        lignes={lignes}
        questionPourAudio={questionPourAudio}
        theme="sombre"
      />
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
