'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  Compass,
  Heart,
  Loader2,
  Lock,
  Sunrise,
  BellRing,
  Headphones,
} from 'lucide-react';
import ParcoursGate from '@/components/ParcoursGate';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { getAnswers, getCachedAnswers } from '@/lib/firestore';
import { chargerFiche, type FicheLivret } from '@/lib/livret';
import NotificationCenter from '@/components/NotificationCenter';
import Illumination from '@/components/Illumination';
import { VERSETS_CONNUS, normaliserReference } from '@/data/versets';

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
    void chargerFiche(ficheCouranteId).then(setFiche);

    if (user) {
      const cached = getCachedAnswers(user.uid, ficheCouranteId);
      setReponsesFiche(cached);
      void getAnswers(user.uid, ficheCouranteId).then(vals => {
        if (vals && typeof vals === 'object') setReponsesFiche(vals as Record<string, string>);
      });
    }
  }, [ficheCouranteId, user]);

  const sections = fiche?.sections || [];
  const etapesTerminees = sections.filter((_, idx) => Boolean(reponsesFiche[`temps-apart:${idx}`])).length;

  let premierIndexNonFait = sections.findIndex((_, idx) => !reponsesFiche[`temps-apart:${idx}`]);
  if (premierIndexNonFait === -1) premierIndexNonFait = 0;

  const versetRef = fiche?.resume?.[0]?.versets?.[0] || 'Ap 1:8';
  const versetTexte = VERSETS_CONNUS[normaliserReference(versetRef)] || VERSETS_CONNUS[versetRef] || "« Je suis l’alpha et l’oméga, dit le Seigneur Dieu, celui qui est, qui était, et qui vient, le Tout-Puissant. »";

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
                « Prenez un temps à part : chaque jour la Parole s'enracine dans votre cœur. »
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
                  <Sunrise className="w-3.5 h-3.5" /> Cahier d'étude de la semaine
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

            {/* Liste des étapes de la semaine */}
            <div className="space-y-2.5">
              {sections.map((sec, idx) => {
                const estFait = Boolean(reponsesFiche[`temps-apart:${idx}`]);
                const clePrec = idx > 0 ? `temps-apart:${idx - 1}` : null;
                const estDeverouille = idx === 0 || Boolean(clePrec && reponsesFiche[clePrec]);

                return (
                  <Link
                    key={idx}
                    href={estDeverouille ? `/aujourdhui?fiche=${ficheCouranteId}&section=${idx}` : '#'}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      estFait 
                        ? 'bg-parchemin-50 border-emerald-300 text-emerald-950'
                        : estDeverouille 
                          ? 'bg-white/90 border-or-400 text-encre-950 shadow-xs hover:border-or-600'
                          : 'bg-encre-900/5 border-transparent text-encre-400 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        estFait ? 'bg-emerald-600 text-white' : estDeverouille ? 'bg-or-600 text-white' : 'bg-encre-900/20 text-encre-600'
                      }`}>
                        {estFait ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                      </div>
                      <span className="text-sm font-bold font-serif">
                        {sec.titre || `Étape ${idx + 1}`}
                      </span>
                    </div>

                    <div className="text-xs font-bold">
                      {estFait ? (
                        <span className="text-emerald-800">✓ Vécu</span>
                      ) : estDeverouille ? (
                        <span className="text-or-800 flex items-center gap-1">Vivre <ArrowRight className="w-3 h-3" /></span>
                      ) : (
                        <span className="text-encre-400 flex items-center gap-1"><Lock className="w-3 h-3" /></span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

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

          {/* Post-it Jaune : Verset à méditer */}
          <div className="postit postit-jaune relative rounded-sm p-6 shadow-md border border-encre-900/15 rotate-1 space-y-4">
            <span className="punaise punaise-rouge -top-2.5 right-6" />
            
            <div className="flex items-center justify-between border-b border-encre-900/10 pb-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-encre-700 flex items-center gap-1.5">
                <Bookmark className="h-3.5 w-3.5 text-or-800" /> Verset à méditer
              </span>
              <span className="text-[10px] font-bold text-encre-600">
                Fiche {ficheCouranteId}
              </span>
            </div>

            <p className="font-serif text-base italic leading-relaxed text-encre-950">
              « {versetTexte} »
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-encre-900/10">
              <span className="text-xs font-bold text-or-900">
                {versetRef}
              </span>
              <Link
                href="/memorisation"
                className="text-2xs font-bold text-encre-800 underline hover:text-encre-950"
              >
                Flashcards & Micro →
              </Link>
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

      </div>

      <NotificationCenter
        ouvert={notifOuvert}
        onFermer={() => setNotifOuvert(false)}
      />
    </div>
  );
}
