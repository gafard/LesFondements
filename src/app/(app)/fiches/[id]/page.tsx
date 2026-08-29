'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  Mic,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Lock,
  MessageSquare,
  PenLine,
  Quote,
  Heart,
  Users,
  Hourglass,
  Sunrise,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import ParcoursGate from '@/components/ParcoursGate';
import Immersion, { ChargementImmersion } from '@/components/Immersion';
import LettreDuPere from '@/components/LettreDuPere';
import PauseSanctuaire from '@/components/PauseSanctuaire';
import AnnotationsFiche from '@/components/AnnotationsFiche';
import TexteSurlignable, { type SelectionTexte } from '@/components/TexteSurlignable';
import EcouteContinueFiche from '@/components/EcouteContinueFiche';
import GuidePastoralCellule from '@/components/GuidePastoralCellule';
import { addPost, markStepPrepared } from '@/lib/parcoursStore';
import { getAnswers, getCachedAnswers, markFicheCompleted, saveAnswers } from '@/lib/firestore';
import {
  chargerFiche,
  type Bloc,
  type FicheLivret,
} from '@/lib/livret';
import { texteDuVerset } from '@/data/versets';
import { FICHES_META } from '@/data/fichesMeta';
import { useDeclarerFondSombre } from '@/lib/fondSombre';
import Illumination from '@/components/Illumination';
import { MotFantome, Pastille, TraitOrganique } from '@/components/decor';
import TexteAvecReferences from '@/components/ReferenceCliquable';
import EpreuveMemoire from '@/components/EpreuveMemoire';
import {
  encoderAnnotations,
  lireAnnotationsAvecMigration,
  type CouleurSurlignage,
  type DocumentAnnotations,
} from '@/lib/annotations';
import { lireDernierPassage, memoriserPassage } from '@/lib/marquePage';

type Onglet = 'expose' | 'partage' | 'annexes';

function ancrePourCle(cle: string): string {
  return cle
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function FicheContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const parsedId = rawId ? Number.parseInt(rawId, 10) : NaN;
  const ficheId = Number.isFinite(parsedId) ? parsedId : 1;
  const cleReprise = searchParams.get('reprendre');
  const sceneDemandee = Number.parseInt(searchParams.get('scene') ?? '0', 10);
  const sceneInitiale = Number.isFinite(sceneDemandee) ? sceneDemandee : 0;

  const { user } = useAuth();
  const { group, membership, unlockedStep, preparationStep, refresh } = useParcours();
  const cleAnnotations = `annotations:${ficheId}`;

  const [fiche, setFiche] = useState<FicheLivret | null | undefined>(undefined);
  const [reponses, setReponses] = useState<Record<string, string>>(() =>
    user && Number.isFinite(ficheId) ? getCachedAnswers(user.uid, ficheId) : {}
  );
  const [onglet, setOnglet] = useState<Onglet>(() => {
    const demande = searchParams.get('onglet');
    return demande === 'partage' || demande === 'annexes' ? demande : 'expose';
  });
  const [annotations, setAnnotations] = useState<DocumentAnnotations>(() => {
    if (!user || !Number.isFinite(ficheId)) {
      return lireAnnotationsAvecMigration(null, ficheId);
    }
    return lireAnnotationsAvecMigration(
      getCachedAnswers(user.uid, ficheId)[cleAnnotations],
      ficheId
    );
  });
  const [immersion, setImmersion] = useState(searchParams.get('immersion') === '1');
  const [pauseSanctuaireOuverte, setPauseSanctuaireOuverte] = useState(false);
  const [ecouteContinueOuverte, setEcouteContinueOuverte] = useState(false);
  const [enregistre, setEnregistre] = useState(false);
  const minuteur = useRef<number | null>(null);
  // Dernière valeur des réponses, lue par l'enregistrement différé sans
  // devenir une dépendance du callback.
  const reponsesRef = useRef(reponses);

  const meta = FICHES_META.find((m) => m.id === ficheId);
  const preparee = membership?.preparedSteps.includes(ficheId) ?? false;
  // Découplage : l'utilisateur peut toujours préparer la fiche en cours ET la suivante chez lui
  // Lisible seul : la fiche du groupe, plus la suivante — de quoi toujours
  // préparer la prochaine rencontre sans attendre que l'animateur clôture.
  const maxFicheAccessible = Math.min(20, Math.max(1, preparationStep || unlockedStep || 1));
  const fermee = !!group && ficheId > maxFicheAccessible;
  // Lue en avance, mais pas encore vécue ensemble : on peut tout travailler,
  // rien déposer au groupe. La fraîcheur de la rencontre ne se prépare pas.
  const enPreparation = !!group && ficheId > unlockedStep;

  useEffect(() => {
    if (!Number.isFinite(ficheId)) return;
    void chargerFiche(ficheId).then(setFiche);
  }, [ficheId]);

  useEffect(() => {
    if (!user || !Number.isFinite(ficheId)) return;
    void getAnswers(user.uid, ficheId).then((valeurs) => {
      if (valeurs && typeof valeurs === 'object') {
        const chargees = valeurs as Record<string, string>;
        const annotationsChargees = lireAnnotationsAvecMigration(
          chargees[cleAnnotations],
          ficheId
        );
        if (!chargees[cleAnnotations] && annotationsChargees.notes.length > 0) {
          chargees[cleAnnotations] = encoderAnnotations(annotationsChargees);
          void saveAnswers(user.uid, ficheId, chargees);
        }
        reponsesRef.current = chargees;
        setReponses(chargees);
        setAnnotations(annotationsChargees);
      }
    });
  }, [user, ficheId, cleAnnotations]);

  useEffect(() => {
    reponsesRef.current = reponses;
  }, [reponses]);

  useEffect(() => {
    if (!fiche || immersion) return;
    const dernier = lireDernierPassage();
    if (
      dernier &&
      dernier.type !== 'fiche' &&
      dernier.url.startsWith(`/fiches/${ficheId}?`)
    ) return;
    memoriserPassage({
      url: `/fiches/${ficheId}`,
      titre: `Fiche ${ficheId} — ${fiche.titre}`,
      sousTitre: 'Dernière fiche ouverte',
      type: 'fiche',
    });
  }, [fiche, ficheId, immersion]);

  useEffect(() => {
    if (!fiche || !cleReprise) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`passage-${ancrePourCle(cleReprise)}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [cleReprise, fiche]);

  /** Enregistrement différé : on n'écrit pas à chaque frappe. */
  const enregistrer = useCallback((cle: string, valeur: string) => {
    const suivantes = { ...reponsesRef.current, [cle]: valeur };
    const uid = user?.uid;
    reponsesRef.current = suivantes;
    setReponses(suivantes);

    if (valeur.trim() && cle !== cleAnnotations) {
      const estVerset = cle.startsWith('v:');
      const reference = estVerset ? cle.slice(2) : null;
      memoriserPassage({
        url: `/fiches/${ficheId}?onglet=partage&reprendre=${encodeURIComponent(cle)}#passage-${ancrePourCle(cle)}`,
        titre: reference ?? `Fiche ${ficheId}`,
        sousTitre: reference ? 'Verset en cours d’écriture' : 'Réponse en cours d’écriture',
        type: estVerset ? 'verset' : 'ecriture',
      });
    }

    if (minuteur.current) window.clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(() => {
      if (uid) void saveAnswers(uid, ficheId, suivantes);
      setEnregistre(true);
      window.setTimeout(() => setEnregistre(false), 1800);
    }, 800);
  }, [cleAnnotations, ficheId, user?.uid]);

  const changerAnnotations = useCallback((prochain: DocumentAnnotations) => {
    setAnnotations(prochain);
    enregistrer(cleAnnotations, encoderAnnotations(prochain));
  }, [cleAnnotations, enregistrer]);

  const marquerPreparee = useCallback(async () => {
    if (!user) return;
    await saveAnswers(user.uid, ficheId, reponses);
    await markFicheCompleted(user.uid, ficheId);
    if (group) await markStepPrepared(group.id, user.uid, ficheId);
    await refresh();
  }, [user, ficheId, reponses, group, refresh]);

  // ── États d'attente ─────────────────────────────────────────
  if (!meta) {
    return (
      <div className="min-h-screen bg-parchemin-100 px-4 pt-32 text-center">
        <h2 className="font-serif text-2xl font-bold text-encre-950">Fiche introuvable</h2>
        <Link href="/fiches" className="mt-4 inline-block text-sm text-encre-600 hover:underline">
          Retour au sentier
        </Link>
      </div>
    );
  }

  if (fermee) {
    return (
      <FicheFermee
        ficheId={ficheId}
        nomGroupe={group?.name}
        etapeGroupe={group?.currentStep}
        unlockedStep={unlockedStep}
      />
    );
  }

  if (fiche === undefined) return <ChargementLecture titre={meta.titre} />;
  if (fiche === null) {
    return (
      <div className="min-h-screen bg-parchemin-100 px-4 pt-32 text-center">
        <h2 className="font-serif text-2xl font-bold text-encre-950">
          Le contenu de cette fiche n&apos;a pas pu être chargé
        </h2>
        <Link href="/fiches" className="mt-4 inline-block text-sm text-encre-600 hover:underline">
          Retour au sentier
        </Link>
      </div>
    );
  }

  // ── Immersion plein écran ───────────────────────────────────
  if (immersion) {
    return (
      <Immersion
        fiche={fiche}
        reponses={reponses}
        onEnregistrer={enregistrer}
        onTerminer={marquerPreparee}
        onQuitter={() => {
          setImmersion(false);
          router.replace(`/fiches/${ficheId}`);
        }}
        dejaPreparee={preparee}
        indexInitial={sceneInitiale}
      />
    );
  }

  const precedente = ficheId > 1 ? ficheId - 1 : null;
  const suivante = ficheId < 20 && (!group || ficheId < maxFicheAccessible) ? ficheId + 1 : null;
  const nbQuestions = meta.nbQuestions;
  const repondu = Object.keys(reponses).filter(
    (cle) => cle.startsWith('q:') && reponses[cle].trim()
  ).length;

  return (
    <div className="table-travail min-h-screen pb-16 pt-6">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6">
        {/* ══ En-tête ══ */}
        <Link
          href="/fiches"
          className="mb-5 inline-flex items-center gap-1.5 text-2xs font-bold text-encre-500 transition-colors hover:text-encre-900"
        >
          <ChevronLeft className="h-4 w-4" /> Le sentier des 20 fiches
        </Link>

        <header className="nuit nuit-grain relative overflow-hidden rounded-4xl px-6 py-8 text-parchemin-100 shadow-lg sm:px-10 sm:py-12">
          {/* Le mot du chapitre, posé derrière tout le reste. */}
          <MotFantome tone="nuit" haut="-2%" gauche="-2%" taille="clamp(5rem, 17vw, 13rem)">
            {String(fiche.id).padStart(2, '0')}
          </MotFantome>
          <TraitOrganique
            variante={((fiche.id % 4) + 1) as 1 | 2 | 3 | 4}
            tone="nuit"
            className="bottom-0 h-40 opacity-80"
          />
          <span className="vitrail right-[-6rem] top-[-6rem] h-72 w-72 bg-or-400/14" />

          <div className="relative z-10 flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Pastille tone="nuit">Fiche {fiche.id} sur 20</Pastille>
                {preparee && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-2xs font-bold text-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Préparée
                  </span>
                )}
              </div>

              <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.05] sm:text-5xl">
                <span className="titre-or">{fiche.titre}</span>
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-parchemin-100/70">
                {fiche.sousTitre}
              </p>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <Link
                  href={`/rituel?fiche=${fiche.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-or-300 px-5 py-3 text-xs font-bold text-encre-950 shadow-md transition hover:-translate-y-0.5 hover:bg-or-200"
                >
                  <Sunrise className="h-4 w-4" strokeWidth={2} />
                  Mon rituel du jour
                </Link>

                <button
                  onClick={() => setImmersion(true)}
                  className="bouton-or inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-bold shadow-md"
                >
                  <Headphones className="h-4 w-4" strokeWidth={2} />
                  Immersion guidée
                </button>

                <button
                  onClick={() => setEcouteContinueOuverte(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-3 text-xs font-bold text-parchemin-100 backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <Headphones className="h-4 w-4 text-or-300" strokeWidth={2} />
                  Écoute continue (Mains-libres)
                </button>

                <button
                  onClick={() => setPauseSanctuaireOuverte(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-3 text-xs font-bold text-parchemin-100 backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <Hourglass className="h-4 w-4 text-or-300" strokeWidth={2} />
                  Pause Sanctuaire
                </button>
              </div>
            </div>

            {/* L'enluminure de la fiche : le même dessin ne revient jamais. */}
            <Illumination
              fiche={fiche.id}
              taille={200}
              anime
              className="relative z-10 -mr-4 hidden shrink-0 sm:block"
            />
          </div>
        </header>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_330px]">
          <main className="min-w-0">
        {/* ══ Onglets ══ */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-parchemin-300 pb-px">
          {(
            [
              { id: 'expose' as const, label: 'L’exposé', icon: BookOpen },
              { id: 'partage' as const, label: 'Résumé et partage', icon: MessageSquare },
              ...(fiche.annexes.length
                ? [{ id: 'annexes' as const, label: 'Annexe', icon: Heart }]
                : []),
            ]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setOnglet(tab.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-2xs font-bold transition-colors ${
                onglet === tab.id
                  ? 'border-or-500 text-or-700'
                  : 'border-transparent text-encre-400 hover:text-encre-700'
              }`}
            >
              <tab.icon className="h-4 w-4" strokeWidth={1.75} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══ L'exposé ══ */}
        {onglet === 'expose' && (
          <article className="mt-8 space-y-10">
            {fiche.sections.map((section, index) => (
              <section key={index}>
                {section.titre && (
                  <h2 className="mb-5 flex items-baseline gap-3 font-serif text-2xl font-bold text-encre-950">
                    <span className="text-base text-or-500">•</span>
                    {section.titre}
                  </h2>
                )}
                <div className="prose-livret space-y-1 text-sm text-encre-700 sm:text-base">
                  {section.blocs.map((bloc, i) => (
                    <RenduBloc
                      key={i}
                      bloc={bloc}
                      blocId={`section:${index}:${i}`}
                      annotations={annotations}
                      onChangerAnnotations={changerAnnotations}
                    />
                  ))}
                </div>
              </section>
            ))}

            {fiche.id === 1 && (
              <div className="postit postit-rose pose-2 relative my-10 rounded-3xl p-6 shadow-md transition-all sm:p-8">
                <span className="ruban -top-3 left-8 -rotate-2 rounded-[2px]" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
                  <div>
                    <span className="manuscrit text-base font-bold text-rose-800">
                      Lettre d&apos;amour du Père
                    </span>
                    <h3 className="manuscrit text-3xl font-bold text-encre-950 mt-1">
                      Une lettre personnelle vous attend
                    </h3>
                    <p className="mt-1 font-serif text-xs italic leading-relaxed text-encre-800">
                      Ouvrez l&apos;enveloppe scellée à la cire et écoutez le Père vous parler personnellement.
                    </p>
                  </div>
                  <button
                    onClick={() => setOnglet('annexes')}
                    className="bouton-or inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold shrink-0 shadow-md transform transition-all hover:scale-105"
                  >
                    <Heart className="w-4 h-4 fill-amber-950 text-amber-950" />
                    Ouvrir l&apos;enveloppe
                  </button>
                </div>
              </div>
            )}

            {fiche.notes.length > 0 && (
              <aside className="rounded-3xl border border-parchemin-400 bg-white/60 p-5">
                <h3 className="mb-3 text-2xs font-bold uppercase tracking-[0.16em] text-encre-400">
                  Notes du livret
                </h3>
                <ol className="space-y-1.5">
                  {fiche.notes.map((note) => (
                    <li key={note.num} className="flex gap-2 text-2xs leading-relaxed text-encre-500">
                      <span className="font-bold text-or-600">{note.num}.</span>
                      {note.texte}
                    </li>
                  ))}
                </ol>
              </aside>
            )}
          </article>
        )}

        {/* ══ Résumé et partage ══ */}
        {onglet === 'partage' && (
          <div className="mt-8 space-y-8">
            {/* Le livret donne son annexe pastorale avant les temps de prière
                des fiches 7, 8 et 15. Elle est ouverte à tous : « ce n'est pas
                réservé à une élite », dit le texte — l'animateur y trouve
                seulement ce qui le concerne en premier. */}
            {[7, 8, 15].includes(fiche.id) && (
              <Link
                href="/guide-pastoral"
                className="postit postit-vert pose-4 relative block rounded-3xl p-5 shadow-md transition-transform hover:-translate-y-0.5"
              >
                <span className="ruban -top-3 left-9 -rotate-2 rounded-[2px]" />
                <p className="text-3xs font-black uppercase tracking-[0.16em] text-emerald-900">
                  Avant de prier les uns pour les autres
                </p>
                <p className="manuscrit mt-1 text-2xl font-bold text-encre-950">
                  Prendre soin, sans se prendre pour le berger
                </p>
                <p className="mt-1 font-serif text-xs italic leading-relaxed text-encre-800">
                  Le livret donne quelques repères pour cette fiche : prier à deux ou trois,
                  chercher la racine plutôt que le symptôme, et se rappeler que les brebis
                  sont au Seigneur — pas à nous.
                </p>
                <span className="mt-2 inline-block text-2xs font-bold text-emerald-900 underline underline-offset-2">
                  Ouvrir le guide pastoral
                </span>
              </Link>
            )}

            {enPreparation && (
              <div className="postit postit-bleu pose-3 relative rounded-3xl p-5 shadow-md">
                <span className="ruban -top-3 left-10 -rotate-2 rounded-[2px]" />
                <p className="manuscrit pt-1 text-2xl font-bold text-encre-950">
                  Vous prenez de l&apos;avance
                </p>
                <p className="mt-1 font-serif text-xs italic leading-relaxed text-encre-800">
                  Travaillez tout ce que vous voulez ici : vos réponses sont enregistrées et vous
                  attendront. Le dépôt au groupe s&apos;ouvrira quand la fiche {unlockedStep} sera
                  clôturée — ce que vous découvrez maintenant garde ainsi toute sa fraîcheur pour
                  la rencontre.
                </p>
              </div>
            )}

            <div className="rounded-3xl border border-or-200 bg-or-50 p-5">
              <p className="text-xs leading-relaxed text-or-900/85">
                C&apos;est cette partie qui sert de support à la rencontre. Le livret ne demande pas
                de refaire le cours : chacun arrive avec ses réponses, et l&apos;échange part de là.
              </p>
              {nbQuestions > 0 && (
                <p className="mt-2.5 text-2xs font-bold text-or-700">
                  {repondu} / {nbQuestions} question{nbQuestions > 1 ? 's' : ''} travaillée
                  {repondu > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {fiche.resume.map((section, indexSection) => (
              <section
                key={indexSection}
                className="rounded-4xl border border-parchemin-400 bg-white p-5 shadow-sm sm:p-7"
              >
                <h2 className="font-serif text-xl font-bold text-encre-950">{section.titre}</h2>

                <div className="mt-4 space-y-3">
                  {section.points.map((point, i) => (
                    <p
                      key={i}
                      className="border-l-2 border-or-300 pl-4 text-sm leading-relaxed text-encre-700"
                    >
                      <TexteAvecReferences>{point}</TexteAvecReferences>
                    </p>
                  ))}
                </div>

                {section.versets.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 flex items-center gap-1.5 text-2xs font-bold uppercase tracking-[0.16em] text-encre-400">
                      <PenLine className="h-3 w-3 text-or-600" />
                      Versets à écrire et méditer
                    </h3>
                    <div className="space-y-6">
                      {section.versets.map((reference, i) => (
                        <CarteVerset
                          key={reference}
                          reference={reference}
                          valeur={reponses[`v:${reference}`] ?? ''}
                          onEnregistrer={(valeur) => enregistrer(`v:${reference}`, valeur)}
                          index={i}
                          ancre={`passage-${ancrePourCle(`v:${reference}`)}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {section.lectures.length > 0 && (
                  <div className="mt-6 space-y-2">
                    {section.lectures.map((lecture, i) => (
                      <p
                        key={i}
                        className="flex items-start gap-2.5 rounded-2xl bg-parchemin-100 px-4 py-3 text-xs leading-relaxed text-encre-700"
                      >
                        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-or-600" />
                        <TexteAvecReferences>{lecture}</TexteAvecReferences>
                      </p>
                    ))}
                  </div>
                )}

                {section.questions.length > 0 && (
                  <div className="mt-6 space-y-5">
                    {section.questions.map((question, i) => (
                      <BlocQuestion
                        key={i}
                        question={question}
                        numero={i + 1}
                        ancre={`passage-${ancrePourCle(`q:${fiche.id}_${indexSection}_${i}`)}`}
                        valeur={reponses[`q:${fiche.id}_${indexSection}_${i}`] ?? ''}
                        onEnregistrer={(valeur) =>
                          enregistrer(`q:${fiche.id}_${indexSection}_${i}`, valeur)
                        }
                        onPartager={
                          group && !enPreparation
                            ? async (texte) => {
                                await addPost({
                                  groupId: group.id,
                                  authorId: user!.uid,
                                  authorName: user!.displayName || 'Un membre',
                                  kind: 'partage',
                                  content: texte,
                                  step: fiche.id,
                                });
                              }
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}

            {fiche.questionsLibres.length > 0 && (
              <section className="feuille rounded-4xl border border-parchemin-300 p-5 shadow-sm sm:p-7">
                <h2 className="font-serif text-xl font-bold text-encre-950">
                  Pour aller plus loin
                </h2>
                <div className="mt-5 space-y-5">
                  {fiche.questionsLibres.map((question, i) => (
                    <BlocQuestion
                      key={i}
                      question={question}
                      numero={i + 1}
                      ancre={`passage-${ancrePourCle(`q:${fiche.id}_libre_${i}`)}`}
                      valeur={reponses[`q:${fiche.id}_libre_${i}`] ?? ''}
                      onEnregistrer={(valeur) => enregistrer(`q:${fiche.id}_libre_${i}`, valeur)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Le pas de la semaine — Post-it collé sur la table */}
            <section
              id={`passage-${ancrePourCle(`pas:${fiche.id}`)}`}
              className="postit postit-vert pose-1 relative rounded-3xl p-6 shadow-md transition-all sm:p-8"
            >
              <span className="ruban -top-3 left-8 -rotate-2 rounded-[2px]" />
              <div className="flex items-start justify-between gap-3 pt-1">
                <div>
                  <h2 className="manuscrit text-3xl font-bold text-encre-950">
                    Mon pas concret de la semaine
                  </h2>
                  <p className="mt-1 font-serif text-xs italic leading-relaxed text-encre-700">
                    Une seule action précise, que vous partagerez en vérité à votre groupe.
                  </p>
                </div>
                <span className="manuscrit text-base font-semibold text-emerald-800">
                  Objectif
                </span>
              </div>

              <textarea
                value={reponses[`pas:${fiche.id}`] ?? ''}
                onChange={(event) => enregistrer(`pas:${fiche.id}`, event.target.value)}
                rows={3}
                placeholder="Cette semaine, je m'engage à…"
                className="manuscrit mt-4 w-full rounded-2xl border border-encre-950/10 bg-white/80 px-4 py-3 text-base text-encre-950 outline-none placeholder:font-sans placeholder:text-xs placeholder:text-encre-400 focus:bg-white focus:ring-1 focus:ring-emerald-500"
              />
            </section>
          </div>
        )}

        {/* ══ Annexes ══ */}
        {onglet === 'annexes' && (
          <div className="mt-8 space-y-8">
            {fiche.id === 1 ? (
              <LettreDuPere />
            ) : (
              fiche.annexes.map((annexe, index) => (
                <section
                  key={index}
                  className="feuille rounded-4xl border border-parchemin-400 p-5 shadow-sm sm:p-7"
                >
                  <h2 className="mb-5 font-serif text-2xl font-bold text-encre-950">
                    {annexe.titre}
                  </h2>
                  <div className="prose-livret space-y-1 text-sm text-encre-700">
                    {annexe.blocs.map((bloc, i) => (
                      <RenduBloc
                        key={i}
                        bloc={bloc}
                        blocId={`annexe:${index}:${i}`}
                        annotations={annotations}
                        onChangerAnnotations={changerAnnotations}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        )}

        {/* ══ Pied : valider et naviguer ══ */}
        <div className="mt-10 rounded-4xl border border-parchemin-400 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-serif text-sm font-bold text-encre-950">
                {preparee
                  ? 'Vous avez préparé cette fiche'
                  : 'Quand vous avez terminé votre préparation'}
              </p>
              <p className="mt-0.5 text-2xs leading-relaxed text-encre-500">
                {preparee
                  ? 'Votre groupe le voit. Vos réponses restent privées.'
                  : 'Le groupe verra que vous êtes prêt. Vos réponses, elles, restent privées.'}
              </p>
            </div>

            <button
              onClick={() => void marquerPreparee()}
              disabled={preparee}
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold transition-all ${
                preparee
                  ? 'cursor-default bg-emerald-50 text-emerald-700'
                  : 'bouton-or'
              }`}
            >
              {preparee ? <CheckCircle2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              {preparee ? 'Fiche préparée' : 'J’ai préparé la fiche'}
            </button>
          </div>

          {enregistre && (
            <p className="mt-3 inline-flex items-center gap-1 text-2xs font-bold text-emerald-600">
              <Check className="h-3 w-3" /> Vos réponses sont enregistrées
            </p>
          )}
        </div>

        {/* ══ Annexe Pastorale d'accompagnement (Fiches 7, 8 & 15) ══ */}
        <GuidePastoralCellule ficheId={ficheId} />

        <div className="mt-6 flex items-center justify-between gap-3">
          {precedente ? (
            <Link
              href={`/fiches/${precedente}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-2xs font-bold text-encre-600 shadow-2xs transition-colors hover:text-encre-950"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Fiche {precedente}
            </Link>
          ) : (
            <span />
          )}

          <Link
            href="/groupes"
            className="inline-flex items-center gap-1.5 text-2xs font-bold text-encre-500 hover:text-encre-900"
          >
            <Users className="h-3.5 w-3.5" /> La rencontre du groupe
            <ArrowRight className="h-3 w-3" />
          </Link>

          {suivante ? (
            <Link
              href={`/fiches/${suivante}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-2xs font-bold text-encre-600 shadow-2xs transition-colors hover:text-encre-950"
            >
              Fiche {suivante} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-parchemin-200 px-4 py-2.5 text-2xs font-bold text-encre-300">
              <Lock className="h-3 w-3" /> Fiche {ficheId + 1}
            </span>
          )}
        </div>

        {/* ══ Bandeau d'invitation à la cellule à la fin de la Fiche 1 ══ */}
        {ficheId === 1 && !group && (
          <div className="feuille relative mt-10 overflow-hidden rounded-3xl border-2 border-or-400 bg-gradient-to-br from-amber-50/90 via-[#fbf7ee] to-amber-100/60 p-6 sm:p-8 shadow-xl text-encre-950">
            <span className="ruban -top-3 left-10 -rotate-2 rounded-[2px]" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-or-200/90 px-3 py-1 text-3xs font-bold uppercase tracking-wider text-or-950 font-serif">
                  ✨ Premier Fondement Posé
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-encre-950">
                  Vous avez exploré « Connaître Dieu »
                </h3>
                <p className="font-serif text-xs text-encre-700 leading-relaxed">
                  Pour aller plus loin, vivre les 19 fiches suivantes et partager vos découvertes chaque semaine, rassemblez 4 ou 5 compagnons ou rejoignez une cellule existante.
                </p>
              </div>
              <Link
                href="/onboarding"
                className="bouton-or inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-xs font-bold text-slate-950 shadow-lg shrink-0 hover:scale-105 transition-all border border-or-400"
              >
                <Users className="h-4 w-4 text-or-900" />
                Trouver ou créer ma cellule
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
          </main>

          <AnnotationsFiche document={annotations} onChanger={changerAnnotations} />
        </div>

        {/* Modals & Outils */}
        <PauseSanctuaire
          ouvert={pauseSanctuaireOuverte}
          onFermer={() => setPauseSanctuaireOuverte(false)}
        />

        <EcouteContinueFiche
          fiche={{
            id: fiche.id,
            titre: fiche.titre,
            sousTitre: fiche.sousTitre,
            sections: fiche.sections.map((s, idx) => ({
              index: idx,
              titre: s.titre || '',
              blocs: s.blocs.map((b, bIdx) => ({
                index: bIdx,
                texte: b.texte,
                type: b.type,
              })),
              texte: s.blocs
                .map((b) => b.texte)
                .filter(Boolean)
                .join(' '),
            })),
            resume: fiche.resume.map((r, idx) => ({
              index: idx,
              titre: r.titre,
              points: r.points,
              texte: [r.titre, ...r.points].join('. '),
            })),
            questions: fiche.resume.flatMap((r) =>
              r.questions.map((q, qIdx) => ({
                index: qIdx,
                texte: q,
              }))
            ),
            lectures: fiche.resume.flatMap((r) => r.lectures),
          }}
          ouvert={ecouteContinueOuverte}
          onFermer={() => setEcouteContinueOuverte(false)}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function RenduBloc({
  bloc,
  blocId,
  annotations,
  onChangerAnnotations,
}: {
  bloc: Bloc;
  blocId: string;
  annotations: DocumentAnnotations;
  onChangerAnnotations: (document: DocumentAnnotations) => void;
}) {
  const rendreSurlignable = (texte: string, identifiant = blocId) => (
    <TexteSurlignable
      blocId={identifiant}
      texte={texte}
      surlignages={annotations.surlignages}
      onAjouter={(selection: SelectionTexte, couleur: CouleurSurlignage) => {
        const maintenant = Date.now();
        const sansChevauchement = annotations.surlignages.filter(
          (surlignage) =>
            surlignage.blocId !== identifiant ||
            surlignage.fin <= selection.debut ||
            surlignage.debut >= selection.fin
        );
        onChangerAnnotations({
          ...annotations,
          surlignages: [
            ...sansChevauchement,
            {
              id: `surlignage_${maintenant}`,
              blocId: identifiant,
              debut: selection.debut,
              fin: selection.fin,
              couleur,
              extrait: selection.extrait,
              createdAt: maintenant,
            },
          ],
        });
      }}
      onEffacer={() =>
        onChangerAnnotations({
          ...annotations,
          surlignages: annotations.surlignages.filter(
            (surlignage) => surlignage.blocId !== identifiant
          ),
        })
      }
    />
  );

  switch (bloc.type) {
    case 'sous-titre':
      return <h4>{bloc.texte}</h4>;

    case 'citation':
      return (
        <blockquote className="my-4 flex gap-3">
          <Quote className="mt-1 h-4 w-4 shrink-0 text-or-400" strokeWidth={1.5} />
          <span>{rendreSurlignable(bloc.texte)}</span>
        </blockquote>
      );

    case 'encadre':
      return (
        <div className="encadre my-5 text-sm leading-relaxed text-encre-800">
          {rendreSurlignable(bloc.texte)}
        </div>
      );

    case 'liste': {
      const items = bloc.texte
        .split(/(?=^|\s)-\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
      return (
        <ul>
          {items.map((item, index) => (
            <li key={index}>
              {rendreSurlignable(item, `${blocId}:item:${index}`)}
            </li>
          ))}
        </ul>
      );
    }

    case 'aparte':
      return (
        <p className="my-3 rounded-xl border border-or-200 bg-or-50 px-4 py-2.5 text-xs italic text-or-800">
          {rendreSurlignable(bloc.texte.replace(/^>\s*/, ''))}
        </p>
      );

    default:
      return <p>{rendreSurlignable(bloc.texte)}</p>;
  }
}

function CarteVerset({
  reference,
  valeur,
  onEnregistrer,
  index = 0,
  ancre,
}: {
  reference: string;
  valeur: string;
  onEnregistrer: (valeur: string) => void;
  index?: number;
  ancre?: string;
}) {
  const texte = texteDuVerset(reference);
  const [epreuve, setEpreuve] = useState(false);
  const poses = ['pose-1', 'pose-2', 'pose-3', 'pose-4'];
  const pose = poses[index % poses.length];
  const postitColors = ['postit', 'postit-bleu', 'postit-rose', 'postit-vert'];
  const couleur = postitColors[index % postitColors.length];

  return (
    <div id={ancre} className={`${couleur} ${pose} relative rounded-2xl p-5 shadow-md transition-all`}>
      {/* Ruban adhésif / Washi tape */}
      <span className="ruban -top-3 left-1/2 -translate-x-1/2 -rotate-2 rounded-[2px]" />

      <div className="flex items-start justify-between gap-2 pt-1">
        <p className="manuscrit text-2xl font-bold text-encre-950">
          <TexteAvecReferences>{reference}</TexteAvecReferences>
        </p>
        <span className="manuscrit text-sm font-semibold text-encre-600">
          À recopier
        </span>
      </div>

      {texte ? (
        <p className="mt-2 font-serif text-sm italic leading-relaxed text-encre-800">
          « {texte} »
        </p>
      ) : (
        <p className="mt-2 text-2xs text-encre-600/80">
          Ouvrez votre Bible et recopiez ce passage de votre main :
        </p>
      )}

      <div className="mt-3 relative">
        <textarea
          value={valeur}
          onChange={(event) => onEnregistrer(event.target.value)}
          rows={3}
          placeholder="Écrivez ce passage de votre main…"
          className="manuscrit w-full rounded-xl border border-encre-950/10 bg-white/70 px-3.5 py-2 text-base text-encre-950 outline-none placeholder:text-encre-400 placeholder:font-sans focus:bg-white focus:ring-1 focus:ring-or-400"
        />
      </div>

      {/* L'épreuve vivait dans une page qu'il fallait aller chercher. Elle se
          propose ici, sur le verset qu'on vient justement de recopier — au
          moment où l'on sait si on le sait. */}
      {texte && (
        <div className="mt-3">
          {epreuve ? (
            <EpreuveMemoire reference={reference} texte={texte} />
          ) : (
            <button
              onClick={() => setEpreuve(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-encre-950/12 px-3.5 py-1.5 text-2xs font-bold text-encre-600 transition-colors hover:bg-white/60 hover:text-encre-900"
            >
              <Mic className="h-3 w-3" />
              Le réciter sans regarder
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BlocQuestion({
  question,
  valeur,
  onEnregistrer,
  onPartager,
  numero,
  ancre,
}: {
  question: string;
  valeur: string;
  onEnregistrer: (valeur: string) => void;
  onPartager?: (texte: string) => Promise<void>;
  numero?: number;
  ancre?: string;
}) {
  const [partage, setPartage] = useState(false);

  return (
    <div id={ancre} className="relative rounded-3xl border border-parchemin-300 bg-parchemin-50/70 p-5 shadow-2xs transition-all hover:bg-white sm:p-6">
      <div className="flex items-baseline gap-2.5">
        {numero !== undefined && (
          <span className="manuscrit text-2xl font-bold text-or-600">
            {numero}.
          </span>
        )}
        <p className="font-serif text-base font-bold leading-snug text-encre-950">{question}</p>
      </div>

      <textarea
        value={valeur}
        onChange={(event) => onEnregistrer(event.target.value)}
        rows={4}
        placeholder="Votre réponse personnelle (confidentielle)…"
        className="manuscrit mt-3 w-full resize-none rounded-2xl border border-parchemin-300 bg-white px-4 py-3 text-base leading-relaxed text-encre-900 outline-none placeholder:font-sans placeholder:text-xs placeholder:text-encre-300 focus:border-or-400 focus:ring-1 focus:ring-or-400"
      />

      {onPartager && valeur.trim().length > 20 && (
        <button
          onClick={async () => {
            await onPartager(valeur.trim());
            setPartage(true);
            window.setTimeout(() => setPartage(false), 2500);
          }}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-parchemin-200/80 px-3.5 py-1.5 text-2xs font-bold text-encre-700 transition-colors hover:bg-or-200 hover:text-encre-950"
        >
          {partage ? (
            <>
              <Check className="h-3 w-3 text-emerald-600" /> Envoyé au groupe
            </>
          ) : (
            <>
              <Users className="h-3 w-3" /> Partager cette réponse au groupe
            </>
          )}
        </button>
      )}
    </div>
  );
}

function FicheFermee({
  ficheId,
  nomGroupe,
  etapeGroupe,
  unlockedStep,
}: {
  ficheId: number;
  nomGroupe?: string;
  etapeGroupe?: number;
  unlockedStep: number;
}) {
  useDeclarerFondSombre();

  return (
    <div className="nuit nuit-grain relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-28">
      <span className="vitrail left-[-6rem] top-[-4rem] h-80 w-80 bg-or-400/12 animate-souffle" />
      <div className="animate-reveal relative z-10 max-w-lg text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/8 text-parchemin-100/60">
          <Lock className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <h1 className="mt-6 font-serif text-3xl font-bold text-parchemin-100">
          La fiche {ficheId} n&apos;est pas encore ouverte
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-parchemin-100/70">
          {nomGroupe
            ? `${nomGroupe} en est à la fiche ${etapeGroupe}. Chaque fiche se referme sur une rencontre avant que la suivante ne s'ouvre : c'est ce qui garde le groupe ensemble.`
            : 'Chaque fiche se referme sur une rencontre avant que la suivante ne s’ouvre.'}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/fiches/${unlockedStep || 1}`}
            className="bouton-or inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold"
          >
            Aller à la fiche {unlockedStep || 1}
          </Link>
          <Link
            href="/fiches"
            className="rounded-full bg-white/10 px-6 py-3.5 text-xs font-bold text-parchemin-100 transition-colors hover:bg-white/18"
          >
            Voir le sentier
          </Link>
        </div>
      </div>
    </div>
  );
}

function ChargementLecture({ titre }: { titre: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-parchemin-100">
      <div className="text-center">
        <p className="font-serif text-lg text-encre-500">{titre}</p>
        <p className="mt-2 animate-pulse text-2xs text-encre-300">Ouverture de la fiche…</p>
      </div>
    </div>
  );
}

export default function Page() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const parsedId = rawId ? Number.parseInt(rawId, 10) : 1;
  const ficheId = Number.isFinite(parsedId) ? parsedId : 1;
  const acces = ficheId === 1 ? 'decouverte' : 'groupe';

  return (
    <ParcoursGate acces={acces}>
      <Suspense fallback={<ChargementImmersion />}>
        <FicheContent />
      </Suspense>
    </ParcoursGate>
  );
}
