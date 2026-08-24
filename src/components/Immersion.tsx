'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Image as ImageIcon,
  Loader2,
  Pause,
  PenLine,
  Play,
  Quote,
  Sparkles,
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
      scenes.push({ type: 'verset', reference, texte: texteDuVerset(reference) });
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
}

export default function Immersion({
  fiche,
  reponses,
  onEnregistrer,
  onTerminer,
  onQuitter,
  dejaPreparee,
}: ImmersionProps) {
  const scenario = useMemo(() => construireScenario(fiche), [fiche]);
  const [index, setIndex] = useState(0);
  const [ambiance, setAmbiance] = useState<Ambiance>('silence');
  const [lecture, setLecture] = useState(false);
  const [manifeste, setManifeste] = useState<Manifeste | null>(null);
  const [enchainer, setEnchainer] = useState(false);
  const [sommaire, setSommaire] = useState(false);
  const [cloture, setCloture] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  const depart = useRef<number | null>(null);

  const scene = scenario[index];
  const progression = (index + 1) / scenario.length;

  // ── Navigation ──────────────────────────────────────────────
  const aller = useCallback(
    (delta: number) => {
      arreterLecture();
      setIndex((valeur) => Math.max(0, Math.min(scenario.length - 1, valeur + delta)));
    },
    [scenario.length]
  );

  useEffect(() => {
    zone.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [index]);

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
        setSommaire(false);
      }
    };
    window.addEventListener('keydown', auClavier);
    return () => window.removeEventListener('keydown', auClavier);
  }, [aller]);

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

  const texteDeLaScene = useCallback((courante: Scene): string | null => {
    switch (courante.type) {
      case 'bloc':
        return `${courante.sousTitre ? `${courante.sousTitre}. ` : ''}${courante.bloc.texte}`;
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

  useEffect(() => {
    if (!lecture || pisteCourante) {
      arreterLecture();
      return;
    }
    const texte = texteDeLaScene(scene);
    if (texte) lireAVoixHaute(texte);
    return () => arreterLecture();
  }, [lecture, scene, texteDeLaScene, pisteCourante]);

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
  const reperes = useMemo(
    () =>
      scenario
        .map((s, i) => ({ scene: s, i }))
        .filter(
          ({ scene: s }) =>
            s.type === 'ouverture-section' ||
            s.type === 'silence' ||
            (s.type === 'resume' && true) ||
            s.type === 'pas'
        )
        .map(({ scene: s, i }) => ({
          i,
          label:
            s.type === 'ouverture-section'
              ? s.titre
              : s.type === 'silence'
                ? 'Un temps de silence'
                : s.type === 'resume'
                  ? `Résumé — ${s.section.titre}`
                  : 'Un pas pour la semaine',
        })),
    [scenario]
  );

  return (
    <div className="nuit nuit-grain fixed inset-0 z-[60] overflow-hidden">
      <span className="vitrail left-[-10rem] top-[-8rem] h-[30rem] w-[30rem] bg-or-400/10 animate-souffle" />
      <span
        className="vitrail bottom-[-12rem] right-[-8rem] h-[28rem] w-[28rem] bg-encre-400/22 animate-souffle"
        style={{ animationDelay: '2.4s' }}
      />

      {/* ── Barre haute ── */}
      <header className="absolute inset-x-0 top-0 z-20 px-4 pt-4 sm:px-8 sm:pt-6">
        <div className="mx-auto max-w-3xl">
          <div className="rail mb-3">
            <span style={{ width: `${Math.round(progression * 100)}%` }} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setSommaire((ouvert) => !ouvert)}
              className="flex items-center gap-1.5 rounded-full bg-white/8 px-3.5 py-1.5 text-2xs font-bold text-parchemin-100/70 transition-colors hover:bg-white/16 hover:text-parchemin-100"
            >
              Fiche {fiche.id} · {index + 1}/{scenario.length}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${sommaire ? 'rotate-180' : ''}`}
              />
            </button>

            <div className="flex items-center gap-1.5">
              {(lectureDisponible() || manifeste) && (
                <button
                  onClick={() => setLecture((valeur) => !valeur)}
                  title={
                    lecture
                      ? 'Couper la voix'
                      : pisteCourante
                        ? 'Écouter la voix off'
                        : 'Lire à voix haute (synthèse du navigateur)'
                  }
                  className={`rounded-full p-2 transition-colors ${
                    lecture
                      ? 'bg-or-400 text-encre-950'
                      : 'bg-white/8 text-parchemin-100/60 hover:bg-white/16'
                  }`}
                >
                  {lecture ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              )}

              <div className="flex items-center gap-1 rounded-full bg-white/8 p-1">
                {AMBIANCES.map((option) => (
                  <button
                    key={option.valeur}
                    onClick={() => setAmbiance(option.valeur)}
                    title={option.description}
                    className={`rounded-full px-2.5 py-1 text-2xs font-bold transition-colors ${
                      ambiance === option.valeur
                        ? 'bg-or-400 text-encre-950'
                        : 'text-parchemin-100/55 hover:text-parchemin-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <button
                onClick={onQuitter}
                title="Quitter l’immersion"
                className="rounded-full bg-white/8 p-2 text-parchemin-100/60 transition-colors hover:bg-white/16 hover:text-parchemin-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {sommaire && (
            <div className="animate-fade-in mt-3 max-h-64 overflow-y-auto rounded-3xl border border-white/12 bg-encre-950/90 p-2 backdrop-blur-xl">
              {reperes.map((repere) => (
                <button
                  key={repere.i}
                  onClick={() => {
                    setIndex(repere.i);
                    setSommaire(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left text-xs transition-colors ${
                    index >= repere.i
                      ? 'text-parchemin-100 hover:bg-white/10'
                      : 'text-parchemin-100/45 hover:bg-white/8'
                  }`}
                >
                  <span className="truncate">{repere.label}</span>
                  {index >= repere.i && <Check className="h-3.5 w-3.5 shrink-0 text-or-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Scène ── */}
      <div
        ref={zone}
        onTouchStart={debutTouche}
        onTouchEnd={finTouche}
        className="absolute inset-0 z-10 overflow-y-auto px-4 pb-32 pt-28 sm:px-8 sm:pt-32"
      >
        <div className="mx-auto max-w-3xl">
          {cloture ? (
            <SceneCloture fiche={fiche} onQuitter={onQuitter} />
          ) : (
            <div key={index} className="animate-reveal">
              <RenduScene
                scene={scene}
                fiche={fiche}
                reponses={reponses}
                onEnregistrer={onEnregistrer}
                onSuivant={() => aller(1)}
                onTerminer={terminer}
                dejaPreparee={dejaPreparee}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Voix off ── */}
      {!cloture && lecture && pisteCourante && (
        <LecteurVoix
          piste={pisteCourante}
          enchainer={enchainer}
          onEnchainer={setEnchainer}
          onFin={() => enchainer && aller(1)}
        />
      )}

      {/* ── Barre basse ── */}
      {!cloture && (
        <footer className="absolute inset-x-0 bottom-0 z-20 px-4 pb-5 sm:px-8 sm:pb-7">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <button
              onClick={() => aller(-1)}
              disabled={index === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-4 py-3 text-2xs font-bold text-parchemin-100/70 backdrop-blur-md transition-colors hover:bg-white/16 hover:text-parchemin-100 disabled:opacity-25"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Précédent</span>
            </button>

            <span className="hidden text-2xs text-parchemin-100/30 sm:block">
              Flèches ou barre d&apos;espace pour avancer
            </span>

            {scene.type === 'cloture' ? (
              <button
                onClick={() => void terminer()}
                className="bouton-or inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold"
              >
                {dejaPreparee ? 'Terminer' : 'J’ai préparé la fiche'}
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </button>
            ) : (
              <button
                onClick={() => aller(1)}
                className="bouton-or inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold"
              >
                Continuer
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
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
  onSuivant,
  onTerminer,
  dejaPreparee,
}: {
  scene: Scene;
  fiche: FicheLivret;
  reponses: Record<string, string>;
  onEnregistrer: (cle: string, valeur: string) => void;
  onSuivant: () => void;
  onTerminer: () => Promise<void> | void;
  dejaPreparee?: boolean;
}) {
  switch (scene.type) {
    case 'seuil':
      return <SceneSeuil fiche={fiche} onSuivant={onSuivant} />;

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
          <button
            onClick={() => void onTerminer()}
            className="bouton-or mt-9 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold"
          >
            {dejaPreparee ? 'Refermer la fiche' : 'J’ai préparé la fiche'}
            <Check className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      );
  }
}

// ─────────────────────────────────────────────────────────────

function SceneSeuil({ fiche, onSuivant }: { fiche: FicheLivret; onSuivant: () => void }) {
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

      <button
        onClick={onSuivant}
        className="bouton-or mt-10 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold"
      >
        Entrer
        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </button>
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

/**
 * Lecteur de la voix off. Discret : une ligne de progression, un bouton, et
 * la possibilité d'enchaîner automatiquement sur la scène suivante — pour
 * écouter la fiche comme un livre audio, sans toucher l'écran.
 */
function LecteurVoix({
  piste,
  enchainer,
  onEnchainer,
  onFin,
}: {
  piste: Piste;
  enchainer: boolean;
  onEnchainer: (valeur: boolean) => void;
  onFin: () => void;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [enCours, setEnCours] = useState(false);
  const [avancement, setAvancement] = useState(0);

  // Une nouvelle scène : on repart du début et on relance la lecture.
  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    setAvancement(0);
    element.currentTime = 0;
    void element.play().catch(() => setEnCours(false));
  }, [piste.url]);

  return (
    <div className="absolute inset-x-0 bottom-[4.75rem] z-20 px-4 sm:bottom-[5.5rem] sm:px-8">
      <div className="verre mx-auto flex max-w-3xl items-center gap-3 rounded-full px-4 py-2.5">
        <button
          onClick={() => {
            const element = audio.current;
            if (!element) return;
            if (element.paused) void element.play();
            else element.pause();
          }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-or-400 text-encre-950"
          aria-label={enCours ? 'Mettre la voix en pause' : 'Reprendre la voix'}
        >
          {enCours ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>

        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/12">
          <span
            className="block h-full rounded-full bg-or-400 transition-[width] duration-200"
            style={{ width: `${Math.round(avancement * 100)}%` }}
          />
        </div>

        <button
          onClick={() => onEnchainer(!enchainer)}
          title="Passer automatiquement à la scène suivante"
          className={`shrink-0 rounded-full px-3 py-1 text-2xs font-bold transition-colors ${
            enchainer
              ? 'bg-or-400 text-encre-950'
              : 'bg-white/10 text-parchemin-100/60 hover:bg-white/18'
          }`}
        >
          Enchaîner
        </button>

        <span
          className="hidden shrink-0 text-2xs text-parchemin-100/35 sm:inline"
          title={
            piste.source === 'humaine'
              ? 'Enregistrement humain'
              : 'Voix de lecture'
          }
        >
          {piste.source === 'humaine' ? 'voix off' : 'audio guidé'}
        </span>

        <audio
          ref={audio}
          src={piste.url}
          preload="auto"
          onPlay={() => setEnCours(true)}
          onPause={() => setEnCours(false)}
          onTimeUpdate={(event) => {
            const element = event.currentTarget;
            if (element.duration) setAvancement(element.currentTime / element.duration);
          }}
          onEnded={() => {
            setEnCours(false);
            setAvancement(1);
            onFin();
          }}
        />
      </div>
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
