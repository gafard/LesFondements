'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle,
  Flag,
  Flame,
  LayoutGrid,
  Lock,
  Route,
  Search,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import ParcoursGate from '@/components/ParcoursGate';
import { getUserProgress } from '@/lib/firestore';
import { nextMeetingDate } from '@/lib/parcoursStore';
import { FICHES_META } from '@/data/fichesMeta';
import Illumination from '@/components/Illumination';
import { Etincelle, MotFantome, Pastille, TraitOrganique } from '@/components/decor';

const CHAPITRES = [
  {
    id: 1,
    roman: 'I',
    mot: 'Recevoir',
    titre: 'Recevoir le Fondement',
    sous: "La nature de Dieu, la rupture du péché, le don gratuit de la grâce et l'échange à la croix.",
    fiches: [1, 2, 3, 4, 5],
  },
  {
    id: 2,
    roman: 'II',
    mot: 'Transformé',
    titre: 'Être transformé',
    sous: "La marche selon l'Esprit, la délivrance des forteresses et la puissance du Saint-Esprit.",
    fiches: [6, 7, 8, 9, 10],
  },
  {
    id: 3,
    roman: 'III',
    mot: 'Disciple',
    titre: 'Devenir disciple',
    sous: 'Exercer ses dons, forger son caractère, vivre en communauté et annoncer le Royaume.',
    fiches: [11, 12, 13, 14, 15],
  },
  {
    id: 4,
    roman: 'IV',
    mot: 'Demeurer',
    titre: 'Demeurer et transmettre',
    sous: "L'intimité de la prière, la méditation des Écritures, les alliances et l'espérance éternelle.",
    fiches: [16, 17, 18, 19, 20],
  },
];

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

type Etat = 'close' | 'ouverte' | 'preparee' | 'terminee';

function SentierContent() {
  const { user } = useAuth();
  const { group, membership, unlockedStep, isLeader } = useParcours();
  const [validees, setValidees] = useState<number[]>([]);
  const [recherche, setRecherche] = useState('');
  const [vue, setVue] = useState<'sentier' | 'grille'>('sentier');

  useEffect(() => {
    if (!user) return;
    void getUserProgress(user.uid).then((prog) => setValidees(prog.completedFiches ?? []));
  }, [user]);

  const maxAccessible = Math.min(20, Math.max(1, (unlockedStep || 1) + 1));
  const etatDe = (id: number): Etat => {
    if (!group) return 'close';
    if (group.closedSteps.includes(id)) return 'terminee';
    if (id > maxAccessible) return 'close';
    if (membership?.preparedSteps.includes(id) || validees.includes(id)) return 'preparee';
    return 'ouverte';
  };

  const fichesFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return FICHES_META;
    return FICHES_META.filter(
      (fiche) =>
        fiche.titre.toLowerCase().includes(q) ||
        fiche.sousTitre.toLowerCase().includes(q) ||
        String(fiche.id) === q
    );
  }, [recherche]);

  const terminees = group?.closedSteps.length ?? 0;
  const pourcentage = Math.round((terminees / 20) * 100);
  const prochaine = group ? nextMeetingDate(group.meeting, group.stepOpenedAt) : null;

  return (
    <div className="table-travail min-h-screen pb-16 pt-6 text-encre-900">
      <div className="watermark-text absolute right-4 top-24 select-none text-[12vw] opacity-35">
        PARCOURS
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── En-tête ── */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="manuscrit mb-2 text-xl text-or-800">
            Vingt fiches • Environ cinq mois de marche partagée
          </p>

          <h1 className="mb-4 font-serif text-4xl font-bold leading-[1.08] text-encre-950 sm:text-5xl">
            Le sentier des <span className="italic text-or-600">20 fondements</span>
          </h1>

          <p className="mx-auto max-w-2xl text-xs sm:text-sm leading-relaxed text-encre-700">
            Une fiche s&apos;ouvre quand la précédente a été partagée en groupe. Vous la préparez
            chez vous, puis vous la vivez ensemble.
          </p>
        </div>

        {/* ── Bandeau du groupe ── */}
        {group && (
          <div className="feuille relative mb-8 overflow-hidden rounded-3xl border border-parchemin-400 p-5 sm:p-6 shadow-md">
            <span className="punaise -top-2.5 left-8" />
            <span className="ruban -top-3 right-10 rotate-2 rounded-[2px]" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-encre-950 text-or-300 shadow-xs">
                  <Flag className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-2xs font-bold uppercase tracking-[0.16em] text-encre-400">
                    {group.name}
                    <span className="timbre rounded-md px-2.5 py-0.5 text-2xs font-bold text-or-800">
                      Fiche {group.currentStep} sur 20
                    </span>
                  </p>
                  <p className="mt-1 font-serif text-base font-bold text-encre-950">
                    {terminees} fiche{terminees > 1 ? 's' : ''} partagée
                    {terminees > 1 ? 's' : ''} en groupe ({pourcentage} %)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-2xl border border-parchemin-300 bg-parchemin-100 p-1">
                {[
                  { value: 'sentier' as const, label: 'Sentier', icon: Route },
                  { value: 'grille' as const, label: 'Grille', icon: LayoutGrid },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setVue(option.value)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-2xs font-bold transition-all ${
                      vue === option.value
                        ? 'bg-encre-950 text-white'
                        : 'text-encre-600 hover:text-encre-900'
                    }`}
                  >
                    <option.icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-parchemin-300 bg-parchemin-50 px-5 py-3 text-2xs text-encre-500 sm:px-6">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-or-600" />
                Prochaine rencontre : {JOURS[group.meeting.weekday]}{' '}
                {prochaine?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à{' '}
                {group.meeting.time}
              </span>
              <Link
                href="/groupes"
                className="inline-flex items-center gap-1.5 font-bold text-encre-700 hover:text-encre-950"
              >
                <Users className="h-3.5 w-3.5" />
                Espace de la cellule
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        {/* ── Recherche ── */}
        <div className="relative mx-auto mb-10 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-encre-300" />
          <input
            type="text"
            placeholder="Chercher une fiche : grâce, pardon, Saint-Esprit, prière…"
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            className="w-full rounded-full border border-parchemin-400 bg-white py-3.5 pl-12 pr-4 text-sm text-encre-800 outline-none transition-colors placeholder:text-encre-300 focus:border-or-400"
          />
        </div>

        {/* ── Vue sentier ── */}
        {vue === 'sentier' && (
          <div className="mt-12 space-y-16">
            {CHAPITRES.map((chapitre) => {
              const fiches = fichesFiltrees.filter((f) => chapitre.fiches.includes(f.id));
              if (!fiches.length) return null;

              return (
                <section key={chapitre.id} className="relative">
                  {/* Le seuil du chapitre : un chiffre romain démesuré, un
                      ruban qui traverse, et le titre posé dessus. */}
                  <div className="feuille relative mb-12 overflow-hidden rounded-3xl border border-parchemin-400 px-6 py-10 text-center shadow-md sm:px-10 sm:py-14">
                    <span className="attache-pince -top-3 left-1/2 -translate-x-1/2" />
                    <span className="ruban -top-3 right-12 rotate-2 rounded-[2px]" />
                    {/* Le mot du chapitre, en très grand derrière le titre.
                        Un chiffre romain seul rendait comme un simple fût. */}
                    <MotFantome
                      haut="8%"
                      gauche="50%"
                      taille="clamp(3.5rem, 11vw, 8rem)"
                      className="-translate-x-1/2 whitespace-nowrap uppercase"
                    >
                      {chapitre.mot}
                    </MotFantome>
                    <TraitOrganique
                      variante={chapitre.id as 1 | 2 | 3 | 4}
                      className="inset-y-0 h-full opacity-70"
                    />

                    <div className="relative z-10 flex flex-col items-center">
                      <Pastille>
                        <Etincelle taille={12} />
                        Chapitre {chapitre.roman}
                      </Pastille>

                      <h2 className="mt-5 font-serif text-3xl font-bold leading-[1.1] text-encre-950 sm:text-[2.75rem]">
                        {chapitre.titre}
                      </h2>

                      <p className="mx-auto mt-3 max-w-lg text-xs leading-relaxed text-encre-600 sm:text-sm">
                        {chapitre.sous}
                      </p>

                      {/* Les cinq enluminures du chapitre, en aperçu. */}
                      <div className="mt-7 flex items-center gap-1">
                        {chapitre.fiches.map((id) => (
                          <Illumination
                            key={id}
                            fiche={id}
                            taille={44}
                            tone="clair"
                            className={
                              group && id <= unlockedStep ? 'opacity-90' : 'opacity-25'
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="roadmap-track relative">
                    <div className="space-y-8 sm:space-y-12">
                      {fiches.map((fiche, index) => (
                        <EtapeSentier
                          key={fiche.id}
                          fiche={fiche}
                          etat={etatDe(fiche.id)}
                          courante={fiche.id === unlockedStep}
                          inverse={index % 2 === 0}
                          etapeGroupe={unlockedStep}
                          isLeader={isLeader}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* ── Vue grille ── */}
        {vue === 'grille' && (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {fichesFiltrees.map((fiche) => {
              const etat = etatDe(fiche.id);
              const fermee = etat === 'close';
              const Contenu = (
                <>
                  <div>
                    <div className="mb-4 flex items-start justify-between">
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-xl font-serif text-xs font-bold ${
                          etat === 'terminee'
                            ? 'bg-emerald-100 text-emerald-700'
                            : fiche.id === unlockedStep
                              ? 'bg-or-400 text-encre-950'
                              : 'bg-parchemin-200 text-encre-600'
                        }`}
                      >
                        {fiche.id}
                      </span>
                      {etat === 'terminee' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                      {fermee && <Lock className="h-4 w-4 text-encre-300" />}
                    </div>
                    <h3 className="mb-2 font-serif text-base font-bold leading-tight text-encre-950">
                      {fiche.titre}
                    </h3>
                    <p className="line-clamp-3 text-xs leading-relaxed text-encre-500">
                      {fiche.sousTitre}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-parchemin-300 pt-4 text-2xs font-bold">
                    {fermee ? (
                      <span className="text-encre-300">Fiche à venir</span>
                    ) : (
                      <>
                        <span className="text-encre-700">Ouvrir la fiche</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </div>
                </>
              );

              return fermee ? (
                <div
                  key={fiche.id}
                  className="flex cursor-not-allowed flex-col justify-between rounded-3xl border border-parchemin-300 bg-parchemin-50 p-6 opacity-60"
                >
                  {Contenu}
                </div>
              ) : (
                <Link
                  key={fiche.id}
                  href={`/fiches/${fiche.id}`}
                  className="parchment-card group flex flex-col justify-between rounded-3xl p-6 transition-all hover:-translate-y-1"
                >
                  {Contenu}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EtapeSentier({
  fiche,
  etat,
  courante,
  inverse,
  etapeGroupe,
  isLeader,
}: {
  fiche: { id: number; titre: string; sousTitre: string };
  etat: Etat;
  courante: boolean;
  inverse: boolean;
  etapeGroupe: number;
  isLeader: boolean;
}) {
  const fermee = etat === 'close';

  const carte = (
    <>
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`grid h-8 w-8 place-items-center rounded-xl font-serif text-xs font-bold ${
              etat === 'terminee'
                ? 'bg-emerald-100 text-emerald-700'
                : courante
                  ? 'bg-or-400 text-encre-950'
                  : 'bg-parchemin-200 text-encre-600'
            }`}
          >
            {fiche.id.toString().padStart(2, '0')}
          </span>
          <span className="text-2xs font-bold uppercase tracking-wider text-encre-300">
            Fiche {fiche.id}
          </span>
        </div>

        {etat === 'terminee' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-2xs font-bold text-emerald-700">
            <CheckCircle className="h-3.5 w-3.5" /> Partagée en groupe
          </span>
        ) : etat === 'preparee' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-2xs font-bold text-sky-700">
            <CheckCircle className="h-3.5 w-3.5" /> Préparée
          </span>
        ) : courante ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-or-300 px-2.5 py-1 text-2xs font-bold text-or-700">
            <Flame className="h-3.5 w-3.5" /> À préparer cette semaine
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-parchemin-200 px-2 py-0.5 text-2xs font-medium text-encre-400">
            <Lock className="h-3 w-3" /> Fermée
          </span>
        )}
      </div>

      <h3 className="mb-2 font-serif text-xl font-bold text-encre-950 sm:text-2xl">
        {fiche.titre}
      </h3>
      <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-encre-600 sm:text-sm">
        {fiche.sousTitre}
      </p>

      <div className="flex items-center justify-between border-t border-parchemin-300 pt-3">
        {fermee ? (
          <span className="text-2xs leading-relaxed text-encre-400">
            {fiche.id === etapeGroupe + 1
              ? isLeader
                ? 'S’ouvrira dès que vous aurez clos la rencontre en cours.'
                : 'S’ouvrira après la prochaine rencontre du groupe.'
              : `S’ouvrira au fil des rencontres — le groupe en est à la fiche ${etapeGroupe}.`}
          </span>
        ) : (
          <>
            <span className="inline-flex items-center gap-1 text-2xs font-bold text-encre-700">
              Ouvrir la fiche <ArrowRight className="h-3.5 w-3.5" />
            </span>
            <span className="text-2xs text-encre-300">~45 min</span>
          </>
        )}
      </div>
    </>
  );

  return (
    <div
      className={`relative flex flex-col items-center gap-6 md:flex-row ${
        inverse ? 'md:flex-row-reverse' : ''
      }`}
    >
      <div className="w-full pl-14 md:w-1/2 md:pl-0">
        {fermee ? (
          <div className="cursor-not-allowed rounded-3xl border border-dashed border-parchemin-400 bg-parchemin-50/50 p-6 opacity-60 sm:p-7">
            {carte}
          </div>
        ) : (
          <Link
            href={`/fiches/${fiche.id}`}
            className={`feuille group relative block overflow-hidden rounded-3xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-7 ${
              etat === 'terminee'
                ? 'border-emerald-300'
                : courante
                  ? 'border-2 border-or-500 shadow-md ring-2 ring-or-300/50'
                  : 'border border-parchemin-300'
            }`}
          >
            {courante && <span className="punaise punaise-rouge -top-2.5 right-6" />}
            <span className="ruban -top-2.5 left-8 -rotate-1 rounded-[2px]" />
            {carte}
          </Link>
        )}
      </div>

      <div className="absolute left-2.5 z-20 flex -translate-x-1/2 flex-col items-center md:left-1/2">
        <span
          className={`grid h-11 w-11 place-items-center rounded-full border-4 text-sm font-bold shadow-md ${
            etat === 'terminee'
              ? 'border-white bg-emerald-600 text-white'
              : courante
                ? 'border-encre-950 bg-or-400 text-encre-950 ring-4 ring-or-300'
                : fermee
                  ? 'border-parchemin-400 bg-parchemin-200 text-encre-300'
                  : 'border-or-400 bg-white text-encre-700'
          }`}
        >
          {etat === 'terminee' ? (
            <CheckCircle className="h-5 w-5" />
          ) : fermee ? (
            <Lock className="h-4 w-4" />
          ) : (
            fiche.id
          )}
        </span>
      </div>

      <div className="hidden w-1/2 px-8 md:block" />
    </div>
  );
}

export default function Page() {
  return (
    <ParcoursGate>
      <SentierContent />
    </ParcoursGate>
  );
}
