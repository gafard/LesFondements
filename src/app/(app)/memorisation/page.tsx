'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  PenLine,
  RotateCw,
  CalendarClock,
  Volume2,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import ParcoursGate from '@/components/ParcoursGate';
import { getAnswers } from '@/lib/firestore';
import { chargerLivret, versetsDe } from '@/lib/livret';
import { texteDuVerset } from '@/data/versets';
import { getComparaisonVerset, getAudioChapitre } from '@/lib/bibleVersions';
import { analyserReference } from '@/lib/reference';
import { lectureDisponible, lireAVoixHaute } from '@/lib/ambiance';
import { FICHES_META } from '@/data/fichesMeta';
import {
  chargerMemoire,
  cleMemoire,
  enregistrerRevision,
  revisionsDues,
  type EtatMemoire,
  type QualiteRappel,
} from '@/lib/memorisation';

import RecitationVocale from '@/components/RecitationVocale';
import EpreuveMemoire from '@/components/EpreuveMemoire';
import { Mic } from 'lucide-react';

interface Carte {
  cle: string;
  reference: string;
  ficheId: number;
  ficheTitre: string;
  /** Texte connu de l'application, sinon null. */
  texte: string | null;
  /** Ce que la personne a recopié elle-même. */
  copie: string;
}

function MemorisationContent() {
  const { user } = useAuth();
  const { unlockedStep } = useParcours();

  const [cartes, setCartes] = useState<Carte[] | null>(null);
  const [index, setIndex] = useState(0);
  const [retournee, setRetournee] = useState(false);
  /**
   * Deux gestes distincts, et il ne fallait pas les confondre.
   *
   * « Lire à voix haute » garde le texte sous les yeux : c'est utile quand
   * on découvre un verset. « Se mettre à l'épreuve » le retourne avant de
   * parler — c'est la seule des deux qui mesure quelque chose, parce que
   * reconnaître un texte affiché donne l'impression de le savoir sans qu'on
   * le sache.
   */
  const [mode, setMode] = useState<'aucun' | 'lecture' | 'epreuve'>('aucun');
  const [filtre, setFiltre] = useState<number | 'toutes' | 'dues'>('dues');
  const [audioEnCours, setAudioEnCours] = useState(false);
  const [memoire, setMemoire] = useState<EtatMemoire>({});
  const [scoreVocal, setScoreVocal] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) return;
    let annule = false;

    void (async () => {
      const livret = await chargerLivret();
      const ouvertes = livret.fiches.filter((fiche) => fiche.id <= Math.max(1, unlockedStep));

      // Ce que la personne a recopié de sa main, fiche par fiche.
      const copies = await Promise.all(
        ouvertes.map(async (fiche) => ({
          id: fiche.id,
          reponses: (await getAnswers(user.uid, fiche.id)) as Record<string, string>,
        }))
      );
      const parFiche = new Map(copies.map((entree) => [entree.id, entree.reponses ?? {}]));

      const construites: Carte[] = ouvertes.flatMap((fiche) =>
        versetsDe(fiche).map((reference) => ({
          cle: `${fiche.id}:${reference}`,
          reference,
          ficheId: fiche.id,
          ficheTitre: fiche.titre,
          texte: texteDuVerset(reference),
          copie: (parFiche.get(fiche.id)?.[`v:${reference}`] ?? '').trim(),
        }))
      );

      if (!annule) {
        setCartes(construites);
        setMemoire(await chargerMemoire(user.uid, construites.map((carte) => carte.reference)));
      }
    })();

    return () => {
      annule = true;
    };
  }, [user, unlockedStep]);

  const paquet = useMemo(() => {
    if (!cartes) return [];
    if (filtre === 'toutes') return cartes;
    if (filtre === 'dues') {
      const dues = new Set(revisionsDues(memoire).map((record) => record.reference));
      return cartes.filter((carte) => dues.has(carte.reference));
    }
    return cartes.filter((carte) => carte.ficheId === filtre);
  }, [cartes, filtre, memoire]);

  const carte = paquet[Math.min(index, Math.max(0, paquet.length - 1))];

  const aller = (delta: number) => {
    setRetournee(false);
    setIndex((valeur) => (valeur + delta + paquet.length) % Math.max(1, paquet.length));
  };

  const fichesDisponibles = FICHES_META.filter((meta) => meta.id <= Math.max(1, unlockedStep));
  const acquis = (cartes ?? []).filter((c) => memoire[cleMemoire(c.reference)]?.masteredAt).length;
  const dues = revisionsDues(memoire).length;

  const noter = async (quality: QualiteRappel) => {
    if (!user || !carte) return;
    const record = await enregistrerRevision(user.uid, carte.reference, quality, scoreVocal);
    setMemoire((current) => ({ ...current, [cleMemoire(carte.reference)]: record }));
    setScoreVocal(0);
    setMode('aucun');
    window.setTimeout(() => aller(1), 260);
  };

  if (cartes === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchemin-100">
        <p className="animate-pulse font-serif text-sm text-encre-400">
          Ouverture de vos versets…
        </p>
      </div>
    );
  }

  return (
    <div className="table-travail min-h-screen pb-16 pt-6">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* ── En-tête Illustré ── */}
        <div className="nuit nuit-grain relative mb-8 overflow-hidden rounded-4xl p-6 sm:p-8 text-center text-parchemin-100 shadow-lg">
          <div className="absolute inset-0 z-0">
            <Image
              src="/memorisation-hero.jpg"
              alt="Cartes de versets et méditation de la Parole"
              fill
              sizes="100vw"
              className="object-cover object-center opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07162b]/95 via-[#07162b]/85 to-[#07162b]/95" />
          </div>

          <div className="relative z-10">
            <p className="mb-2 font-serif italic text-amber-300/90 text-xs sm:text-sm">
              Méditation & mémorisation • {cartes.length} versets du livret
            </p>
            <h1 className="font-serif text-3xl font-bold text-[#fff8e8] sm:text-4xl">
              Écrire, puis retenir
            </h1>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-parchemin-100/75">
              Ce sont les versets que le livret demande d&apos;écrire et de méditer, fiche après
              fiche. Ils s&apos;ajoutent ici à mesure que votre groupe avance.
            </p>
          </div>
        </div>

        {/* ── Filtres ── */}
        <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => {
              setFiltre('dues');
              setIndex(0);
              setRetournee(false);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-2xs font-bold transition-colors ${
              filtre === 'dues'
                ? 'bg-or-500 text-encre-950'
                : 'bg-white text-encre-600 hover:bg-parchemin-200'
            }`}
          >
            À revoir aujourd’hui · {dues}
          </button>
          <button
            onClick={() => {
              setFiltre('toutes');
              setIndex(0);
              setRetournee(false);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-2xs font-bold transition-colors ${
              filtre === 'toutes'
                ? 'bg-encre-950 text-white'
                : 'bg-white text-encre-600 hover:bg-parchemin-200'
            }`}
          >
            Toutes les fiches
          </button>
          {fichesDisponibles.map((meta) => (
            <button
              key={meta.id}
              onClick={() => {
                setFiltre(meta.id);
                setIndex(0);
                setRetournee(false);
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-2xs font-bold transition-colors ${
                filtre === meta.id
                  ? 'bg-encre-950 text-white'
                  : 'bg-white text-encre-600 hover:bg-parchemin-200'
              }`}
            >
              Fiche {meta.id}
            </button>
          ))}
        </div>

        {paquet.length === 0 || !carte ? (
          <div className="feuille relative rounded-4xl border border-dashed border-parchemin-400 py-16 text-center shadow-xs">
            <span className="ruban -top-3 left-1/2 -translate-x-1/2 rotate-1 rounded-[2px]" />
            <CalendarClock className="mx-auto h-8 w-8 text-encre-300" strokeWidth={1.5} />
            <p className="mt-4 font-serif text-sm font-bold text-encre-800">
              {filtre === 'dues' ? 'La boîte du jour est terminée' : 'Aucun verset pour l’instant'}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-2xs leading-relaxed text-encre-400">
              {filtre === 'dues'
                ? 'Revenez demain : le carnet rapprochera les versets hésitants et espacera ceux qui tiennent.'
                : 'Les versets apparaissent au fur et à mesure que les fiches s’ouvrent.'}
            </p>
          </div>
        ) : (
          <>
            {/* ── Carte ── */}
            <div
              className="group relative block w-full text-left"
              style={{ perspective: '1600px' }}
            >
              <div
                className="relative min-h-[20rem] w-full transition-transform duration-700"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: retournee ? 'rotateY(180deg)' : 'none',
                }}
              >
                {/* Recto : la référence */}
                <button
                  type="button"
                  onClick={() => setRetournee(true)}
                  aria-label={`Retourner la carte ${carte.reference}`}
                  className="nuit nuit-grain absolute inset-0 flex w-full flex-col items-center justify-center overflow-hidden rounded-4xl p-8 text-center shadow-lg"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="ruban -top-3 left-1/2 -translate-x-1/2 -rotate-1 rounded-[2px]" />
                  <span className="vitrail right-[-4rem] top-[-4rem] h-48 w-48 bg-or-400/16" />
                  <span className="relative z-10 text-2xs font-bold uppercase tracking-[0.22em] text-or-300/60">
                    Fiche {carte.ficheId} · {carte.ficheTitre}
                  </span>
                  <p className="manuscrit relative z-10 mt-5 text-5xl font-bold text-parchemin-100 sm:text-6xl">
                    {carte.reference}
                  </p>
                  <span className="relative z-10 mt-8 inline-flex items-center gap-1.5 text-2xs text-parchemin-100/40">
                    <RotateCw className="h-3 w-3" /> Touchez pour retourner
                  </span>
                </button>

                {/* Verso : le texte */}
                <div
                  className="feuille absolute inset-0 flex flex-col justify-between overflow-hidden rounded-4xl border border-parchemin-400 p-7 shadow-lg"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span className="ruban -top-3 left-1/2 -translate-x-1/2 -rotate-1 rounded-[2px]" />
                  <button
                    type="button"
                    onClick={() => setRetournee(false)}
                    className="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-2 text-2xs font-bold text-encre-700 shadow-xs"
                    aria-label="Retourner côté référence"
                  >
                    <RotateCw className="h-3.5 w-3.5" /> Référence
                  </button>
                  <div>
                    <span className="manuscrit text-xl font-bold text-or-700">
                      {carte.reference}
                    </span>

                    {carte.texte ? (
                      <p className="mt-4 font-serif text-lg leading-relaxed text-encre-900">
                        « {carte.texte} »
                      </p>
                    ) : carte.copie ? (
                      <>
                        <p className="manuscrit mt-4 text-2xl leading-relaxed text-encre-950">
                          « {carte.copie} »
                        </p>
                        <p className="mt-3 inline-flex items-center gap-1.5 text-2xs text-encre-500">
                          <PenLine className="h-3.5 w-3.5 text-or-600" /> Recopié de votre main
                        </p>
                      </>
                    ) : (
                      <div className="mt-4">
                        <p className="text-sm leading-relaxed text-encre-500">
                          Ce verset n&apos;est pas encore écrit. Le livret demande de l&apos;écrire
                          soi-même — c&apos;est ce geste qui le grave.
                        </p>
                        <Link
                          href={`/fiches/${carte.ficheId}`}
                          onClick={(event) => event.stopPropagation()}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-or-100 px-4 py-2 text-2xs font-bold text-or-700 transition-colors hover:bg-or-200"
                        >
                          Aller l&apos;écrire dans la fiche {carte.ficheId}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                    {(carte.texte || carte.copie) && (
                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            const comp = getComparaisonVerset(carte.reference);
                            const parsed = analyserReference(carte.reference);
                            const audioUrl =
                              comp?.audioBds ||
                              (parsed
                                ? getAudioChapitre(parsed.livre.numero, parsed.livre.nom, parsed.chapitre)
                                : null);

                            if (audioEnCours) {
                              audioRef.current?.pause();
                              setAudioEnCours(false);
                              return;
                            }
                            if (audioUrl && audioRef.current) {
                              if (audioRef.current.src !== audioUrl) {
                                audioRef.current.src = audioUrl;
                              }
                              audioRef.current
                                .play()
                                .then(() => setAudioEnCours(true))
                                .catch((err) => {
                                  console.warn('Audio play error, falling back to vocal synthesis:', err);
                                  setAudioEnCours(false);
                                  lireAVoixHaute(`${carte.reference}. ${comp?.bds ?? carte.texte ?? carte.copie}`);
                                });
                            } else if (lectureDisponible()) {
                              lireAVoixHaute(`${carte.reference}. ${comp?.bds ?? carte.texte ?? carte.copie}`);
                            }
                          }}
                          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-2 text-2xs font-bold transition-colors ${
                            audioEnCours
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-parchemin-100 text-encre-600 hover:bg-indigo-100 hover:text-indigo-900'
                          }`}
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          {audioEnCours ? 'Pause' : 'Écouter (Audio)'}
                        </button>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setMode((v) => (v === 'epreuve' ? 'aucun' : 'epreuve'));
                            }}
                            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-2 text-2xs font-bold transition-colors ${
                              mode === 'epreuve'
                                ? 'bg-or-600 text-white shadow-xs'
                                : 'bg-or-100 text-or-800 hover:bg-or-200'
                            }`}
                          >
                            <Mic className="h-3.5 w-3.5" />
                            {mode === 'epreuve' ? 'Fermer l’épreuve' : 'Me mettre à l’épreuve'}
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setMode((v) => (v === 'lecture' ? 'aucun' : 'lecture'));
                            }}
                            title="Le verset reste affiché — pour le découvrir, pas pour se tester"
                            className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-2 text-2xs font-bold transition-colors ${
                              mode === 'lecture'
                                ? 'bg-encre-950 text-parchemin-100'
                                : 'border border-parchemin-400 text-encre-600 hover:bg-parchemin-100'
                            }`}
                          >
                            {mode === 'lecture' ? 'Fermer' : 'Lire à voix haute'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {mode === 'epreuve' && (carte.texte || carte.copie) && (
              <div className="mt-4">
                <EpreuveMemoire
                  key={carte.reference}
                  reference={carte.reference}
                  texte={carte.texte || carte.copie}
                  onScore={setScoreVocal}
                />
              </div>
            )}

            {mode === 'lecture' && (carte.texte || carte.copie) && (
              <div className="mt-4">
                <RecitationVocale
                  reference={carte.reference}
                  texteCible={carte.texte || carte.copie}
                  onScore={setScoreVocal}
                />
              </div>
            )}

            <audio
              ref={audioRef}
              onPlay={() => setAudioEnCours(true)}
              onPause={() => setAudioEnCours(false)}
              onEnded={() => setAudioEnCours(false)}
              onError={() => setAudioEnCours(false)}
            />

            {/* ── Commandes ── */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={() => aller(-1)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-2xs font-bold text-encre-600 shadow-2xs transition-colors hover:text-encre-950"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Précédent
              </button>

              <span className="text-2xs font-bold text-encre-400">
                {Math.min(index + 1, paquet.length)} / {paquet.length}
              </span>

              <button
                onClick={() => aller(1)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-2xs font-bold text-encre-600 shadow-2xs transition-colors hover:text-encre-950"
              >
                Suivant <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {retournee && (
              <div className="fiche-bristol mt-5 rounded-3xl p-5 shadow-sm">
                <p className="manuscrit text-center text-xl font-bold text-encre-950">
                  Comment ce verset vous est-il revenu ?
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { quality: 0 as const, label: 'Oublié', tone: 'bg-rose-100 text-rose-800' },
                    { quality: 1 as const, label: 'Difficile', tone: 'bg-orange-100 text-orange-800' },
                    { quality: 2 as const, label: 'Bien', tone: 'bg-emerald-100 text-emerald-800' },
                    { quality: 3 as const, label: 'Évident', tone: 'bg-indigo-100 text-indigo-800' },
                  ].map((option) => (
                    <button
                      key={option.quality}
                      onClick={() => void noter(option.quality)}
                      className={`rounded-2xl px-3 py-3 text-xs font-bold transition-transform hover:-translate-y-0.5 ${option.tone}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-center text-2xs text-encre-500">
                  Score vocal actuel : {scoreVocal}% · la prochaine date s’adapte à votre rappel.
                </p>
              </div>
            )}

            <div className="mt-6 rounded-3xl border border-parchemin-400 bg-white p-5">
              <div className="mb-2 flex items-center justify-between text-2xs font-bold">
                <span className="text-encre-500">Versets retenus</span>
                <span className="text-or-700">
                  {acquis} / {cartes.length}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-parchemin-200">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-or-400 to-or-600 transition-all duration-500"
                  style={{ width: `${cartes.length ? (acquis / cartes.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ParcoursGate acces="personnel">
      <MemorisationContent />
    </ParcoursGate>
  );
}
