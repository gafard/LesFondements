'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Bookmark,
  Check,
  BellRing,
  RotateCcw,
  Sunrise,
  Mail,
  Users,
} from 'lucide-react';
import ParcoursGate from '@/components/ParcoursGate';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { getAnswers } from '@/lib/firestore';
import { chargerFiche, type FicheLivret } from '@/lib/livret';
import NotificationCenter from '@/components/NotificationCenter';
import Illumination from '@/components/Illumination';
import { VERSETS_CONNUS, normaliserReference, texteDuVerset } from '@/data/versets';
import { etapesTempsApart } from '@/lib/tempsApart';

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function DashboardPage() {
  return (
    <ParcoursGate acces="personnel">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </ParcoursGate>
  );
}

function DashboardSkeleton() {
  return (
    <div className="table-travail min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-44 rounded-3xl bg-parchemin-200/50 animate-pulse" />
        <div className="h-64 rounded-3xl bg-parchemin-200/50 animate-pulse" />
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { group } = useParcours();
  const [fiche, setFiche] = useState<FicheLivret | null>(null);
  const [reponsesFiche, setReponsesFiche] = useState<Record<string, string>>({});
  const [notifOuvert, setNotifOuvert] = useState(false);

  const ficheCouranteId = group?.currentStep ?? 1;

  useEffect(() => {
    let actif = true;
    const reponsesPromise = user ? getAnswers(user.uid, ficheCouranteId) : Promise.resolve({});
    void Promise.all([chargerFiche(ficheCouranteId), reponsesPromise]).then(
      ([contenu, valeurs]) => {
        if (!actif) return;
        setFiche(contenu);
        setReponsesFiche(valeurs);
      }
    );
    return () => {
      actif = false;
    };
  }, [ficheCouranteId, user]);

  const sections = fiche ? etapesTempsApart(fiche) : [];
  const etapesTerminees = sections.filter((_, idx) => Boolean(reponsesFiche[`temps-apart:${idx}`])).length;

  let premierIndexNonFait = sections.findIndex((_, idx) => !reponsesFiche[`temps-apart:${idx}`]);
  if (premierIndexNonFait === -1) premierIndexNonFait = 0;

  const parolesChoisies = sections
    .map((_, index) => reponsesFiche[`verset-choisi:f${ficheCouranteId}-s${index + 1}`])
    .filter((reference): reference is string => Boolean(reference));
  const versetRef = parolesChoisies.at(-1) || fiche?.resume?.[0]?.versets?.[0] || 'Ap 1:8';
  const versetTexte = VERSETS_CONNUS[normaliserReference(versetRef)]
    || VERSETS_CONNUS[versetRef]
    || texteDuVerset(versetRef)
    || 'Relis cette Parole dans ta Bible.';

  return (
    <div className="table-travail min-h-screen text-encre-950 px-3 pb-24 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* ══ En-tête Chaleureux (Bienvenue) ══ */}
        <div className="feuille relative rounded-3xl p-6 sm:p-8 shadow-sm border border-encre-900/10">
          <span className="punaise -top-2.5 left-8" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="timbre inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-encre-800 bg-parchemin-100 mb-2">
                Parcours des 20 Fondements
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-encre-950">
                Bonjour, {user?.displayName?.split(' ')[0] || 'Cher Disciple'}
              </h1>
              <p className="mt-1 text-sm text-encre-700 font-serif italic">
                « Chaque jour, la Parole s&apos;enracine un peu plus dans votre cœur. »
              </p>
            </div>

            <Illumination
              fiche={ficheCouranteId}
              taille={90}
              tone="clair"
              className="hidden sm:block shrink-0"
            />
          </div>
        </div>

        {/* ══ La Feuille de la Semaine & Post-it Verset (Le Cœur du Tableau de Bord) ══ */}
        <div className="grid gap-6 md:grid-cols-3 items-start">
          
          {/* Grande Feuille : Cahier d'étude de la semaine */}
          <div className="feuille relative rounded-3xl p-6 sm:p-8 shadow-md md:col-span-2 border border-encre-900/10 space-y-6">
            <span className="attache-pince -top-3 left-10" />
            
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-encre-900/15 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] bg-or-100 text-or-950 border border-or-300">
                  <Sunrise className="w-3.5 h-3.5" /> Cahier d&apos;étude de la semaine
                </span>
                <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-encre-950">
                  Fiche {ficheCouranteId} • {fiche?.titre || 'Connaître Dieu'}
                </h2>
                <p className="mt-1 text-xs text-encre-700 font-serif">
                  {fiche?.sousTitre}
                </p>
              </div>

              <span className="timbre px-3 py-1.5 text-xs font-bold text-encre-900 bg-parchemin-100">
                {etapesTerminees} / {sections.length} étapes
              </span>
            </div>

            {/* Repères de progression : un seul point d’entrée, dans le bouton ci-dessous. */}
            <ol className="grid gap-2.5 sm:grid-cols-2">
              {sections.map((sec, idx) => {
                const estFait = Boolean(reponsesFiche[`temps-apart:${idx}`]);
                const estCourante = idx === premierIndexNonFait;
                const accessible = estFait || estCourante;
                const classeEtape = `flex min-h-20 items-center gap-3 rounded-xl border p-3.5 transition ${
                  estFait
                    ? 'border-emerald-300 bg-parchemin-50 text-emerald-950'
                    : estCourante
                      ? 'border-or-400 bg-white/90 text-encre-950 shadow-xs'
                      : 'border-transparent bg-encre-900/5 text-encre-500'
                }`;
                const contenuEtape = (
                  <>
                    <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      estFait
                        ? 'bg-emerald-600 text-white'
                        : estCourante
                          ? 'bg-or-600 text-white'
                          : 'bg-encre-900/12 text-encre-500'
                    }`}>
                      {estFait ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-sm font-bold">
                        {sec.section.titre || `Étape ${idx + 1}`}
                      </p>
                      <p className="mt-0.5 text-2xs font-bold uppercase tracking-[0.12em] opacity-65">
                        {estFait ? 'Vécu · revoir' : estCourante ? 'Prochaine étape' : 'À venir'}
                      </p>
                    </div>
                    {accessible && (
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                        estFait ? 'bg-emerald-100 text-emerald-800' : 'bg-or-100 text-or-800'
                      }`}>
                        {estFait ? (
                          <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Sunrise className="h-4 w-4" aria-hidden="true" />
                        )}
                      </span>
                    )}
                  </>
                );

                return (
                  <li key={idx}>
                    {accessible ? (
                      <Link
                        href={`/aujourdhui?fiche=${ficheCouranteId}&section=${idx}`}
                        aria-label={`${estFait ? 'Revoir' : 'Ouvrir'} l’étape ${idx + 1} : ${sec.section.titre || `Étape ${idx + 1}`}`}
                        className={`${classeEtape} group hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-or-600`}
                      >
                        {contenuEtape}
                      </Link>
                    ) : (
                      <div className={classeEtape} aria-label={`Étape ${idx + 1} à venir`}>
                        {contenuEtape}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            {/* Boutons d'actions principaux */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-encre-900/10">
              <Link
                href={`/aujourdhui?fiche=${ficheCouranteId}&section=${premierIndexNonFait}`}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-encre-950 px-6 text-xs font-bold text-parchemin-50 shadow-md transition hover:-translate-y-0.5 hover:bg-encre-800"
              >
                <Sunrise className="h-4 w-4 text-or-400" />
                Vivre mon temps du jour
              </Link>
              <Link
                href={`/fiches/${ficheCouranteId}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-encre-900/15 bg-white/70 px-6 text-xs font-bold text-encre-800 transition hover:bg-white"
              >
                <BookOpen className="h-4 w-4 text-or-700" />
                Ouvrir la fiche d&apos;étude complète
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            {/* Le post-it garde la Parole choisie à portée de regard. */}
            <div className="postit postit-jaune relative rotate-1 space-y-4 rounded-sm border border-encre-900/15 p-6 shadow-md">
              <span className="punaise punaise-rouge -top-2.5 right-6" />
              <div className="flex items-center justify-between border-b border-encre-900/10 pb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-encre-700">
                  <Bookmark className="h-3.5 w-3.5 text-or-800" /> La Parole que je garde
                </span>
                <span className="text-[10px] font-bold text-encre-600">Fiche {ficheCouranteId}</span>
              </div>
              <p className="font-serif text-base italic leading-relaxed text-encre-950">« {versetTexte} »</p>
              <div className="flex items-center justify-between border-t border-encre-900/10 pt-2">
                <span className="text-xs font-bold text-or-900">{versetRef}</span>
                <Link href="/memorisation" className="text-2xs font-bold text-encre-800 underline hover:text-encre-950">
                  Le revoir →
                </Link>
              </div>
            </div>

            {/* L'enveloppe relie le travail personnel à la cellule. */}
            <div className="feuille relative -rotate-1 overflow-hidden rounded-2xl border border-encre-900/12 p-5 shadow-sm">
              <span className="absolute inset-x-0 top-0 h-2 bg-bordeaux-800" aria-hidden="true" />
              <div className="flex items-start gap-3 pt-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-bordeaux-50 text-bordeaux-800">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-3xs font-black uppercase tracking-[0.16em] text-encre-600">L’enveloppe de ma cellule</p>
                  <h3 className="mt-1 truncate font-serif text-lg font-bold text-encre-950">
                    {group?.name ?? 'Le parcours se vit aussi ensemble'}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-encre-700">
                    {group
                      ? `${JOURS[group.meeting.weekday] ?? 'Prochaine rencontre'} à ${group.meeting.time} · ${group.meeting.timezone}`
                      : 'Rejoins une cellule pour partager la fiche et être accompagné.'}
                  </p>
                  <Link
                    href="/groupes"
                    className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-encre-950 px-4 text-xs font-bold text-parchemin-50 transition-colors hover:bg-encre-800"
                  >
                    <Users className="h-4 w-4 text-or-300" aria-hidden="true" />
                    {group ? 'Ouvrir ma cellule' : 'Trouver une cellule'}
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ══ Goutte de Rosée & Rappels ══ */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-or-300/80 bg-gradient-to-r from-or-50/80 via-white/80 to-indigo-50/80 p-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-or-100 text-or-800 shadow-2xs">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-sm font-bold text-encre-950">
                Goutte de Rosée & Rappels quotidiens
              </p>
              <p className="text-2xs text-encre-600">
                Configure tes rappels de méditation et reçois la Parole du jour.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotifOuvert(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-encre-950 px-5 py-2.5 text-xs font-bold text-parchemin-100 shadow-xs transition hover:bg-encre-900"
          >
            <BellRing className="h-3.5 w-3.5 text-or-300" />
            Régler mes rappels
          </button>
        </div>

        {/* Les dix outils vivaient ici en cartes, et à l'identique sous
            « Plus » dans la barre du bas : le même menu à deux endroits, sans
            que rien ne les distingue. La navigation reste à un seul endroit ;
            ce tableau garde ce qui parle d'aujourd'hui. */}

      </div>

      <NotificationCenter
        ouvert={notifOuvert}
        onFermer={() => setNotifOuvert(false)}
      />
    </div>
  );
}
