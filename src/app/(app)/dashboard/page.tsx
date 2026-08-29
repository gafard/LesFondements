'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  BookMarked,
  BookOpen,
  Bookmark,
  Check,
  BellRing,
  MessageCircle,
  PenLine,
  Printer,
  Search,
  Shield,
  ShieldCheck,
  Sunrise,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ParcoursGate from '@/components/ParcoursGate';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { getAnswers } from '@/lib/firestore';
import { chargerFiche, type FicheLivret } from '@/lib/livret';
import NotificationCenter from '@/components/NotificationCenter';
import Illumination from '@/components/Illumination';
import { VERSETS_CONNUS, normaliserReference } from '@/data/versets';

interface OutilTable {
  href: string;
  titre: string;
  detail: string;
  repere: string;
  icon: LucideIcon;
  style: string;
  rotation: string;
  sombre?: boolean;
}

const OUTILS_TABLE: OutilTable[] = [
  {
    href: '/journal',
    titre: 'Journal',
    detail: 'Méditations et prières personnelles',
    repere: 'Carnet privé',
    icon: PenLine,
    style: 'objet-carnet-cuir text-parchemin-100',
    rotation: '-rotate-1',
    sombre: true,
  },
  {
    href: '/recherche',
    titre: 'Mes écrits',
    detail: 'Retrouver une réponse ou une note',
    repere: 'Index & notes',
    icon: Search,
    style: 'border-parchemin-300 bg-[#faf6ee] text-encre-950',
    rotation: 'rotate-1',
  },
  {
    href: '/transformation',
    titre: 'Chemin parcouru',
    detail: 'Relire ce qui se transforme',
    repere: 'Croissance',
    icon: TrendingUp,
    style: 'border-emerald-200 bg-[#eef6ef] text-encre-950',
    rotation: '-rotate-1',
  },
  {
    href: '/carnet-export',
    titre: 'Carnet PDF',
    detail: 'Imprimer et conserver son parcours',
    repere: 'Format A4',
    icon: Printer,
    style: 'objet-livret-pdf text-encre-950',
    rotation: 'rotate-1',
  },
  {
    href: '/temoignages',
    titre: 'Témoignages',
    detail: 'Écouter et déposer un récit',
    repere: 'Récits vivants',
    icon: MessageCircle,
    style: 'objet-cassette text-parchemin-100',
    rotation: 'rotate-1',
    sombre: true,
  },
  {
    href: '/ressources',
    titre: 'Bibliothèque',
    detail: 'Ouvrages, ressources et contact',
    repere: 'Pour approfondir',
    icon: BookMarked,
    style: 'border-amber-300 bg-[#fbf3df] text-encre-950',
    rotation: '-rotate-1',
  },
  {
    href: '/index-thematique',
    titre: 'Index thématique',
    detail: 'Retrouver un thème dans le parcours',
    repere: 'Repères',
    icon: Bookmark,
    style: 'border-sky-200 bg-[#eef6f8] text-encre-950',
    rotation: 'rotate-1',
  },
  {
    href: '/guide-pastoral',
    titre: 'Guide pastoral',
    detail: 'Accompagner et prendre soin',
    repere: 'Accompagnement',
    icon: Shield,
    style: 'border-or-300 bg-or-50 text-encre-950',
    rotation: '-rotate-1',
  },
  {
    href: '/certificat',
    titre: 'Mon attestation',
    detail: 'Le sceau de fin du parcours',
    repere: '20 fondements',
    icon: Award,
    style: 'objet-parchemin-sceau text-encre-950',
    rotation: 'rotate-1',
  },
  {
    href: '/parametres/confidentialite',
    titre: 'Mes données',
    detail: 'Confidentialité et suppression du compte',
    repere: 'Confidentiel',
    icon: ShieldCheck,
    style: 'border-slate-200 bg-[#f3f2ef] text-encre-950',
    rotation: '-rotate-1',
  },
];

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

                return (
                  <li
                    key={idx}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 ${
                      estFait
                        ? 'border-emerald-300 bg-parchemin-50 text-emerald-950'
                        : estCourante
                          ? 'border-or-400 bg-white/90 text-encre-950 shadow-xs'
                          : 'border-transparent bg-encre-900/5 text-encre-500'
                    }`}
                  >
                    <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      estFait
                        ? 'bg-emerald-600 text-white'
                        : estCourante
                          ? 'bg-or-600 text-white'
                          : 'bg-encre-900/12 text-encre-500'
                    }`}>
                      {estFait ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-serif text-sm font-bold">
                        {sec.titre || `Étape ${idx + 1}`}
                      </p>
                      <p className="mt-0.5 text-3xs font-bold uppercase tracking-[0.12em] opacity-65">
                        {estFait ? 'Vécu' : estCourante ? 'Prochaine étape' : 'À venir'}
                      </p>
                    </div>
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

        {/* Sur mobile, cette partie est la seconde entrée vers tout ce qui ne
            tient pas dans la barre d'onglets. Elle garde la métaphore de la
            table de travail au lieu de devenir une grille d'applications. */}
        <section aria-labelledby="titre-outils-table" className="space-y-4 pb-2">
          <div className="flex items-end justify-between gap-4 px-1">
            <div>
              <p className="text-3xs font-black uppercase tracking-[0.18em] text-or-700">
                Aller plus loin
              </p>
              <h2 id="titre-outils-table" className="mt-1 font-serif text-2xl font-bold text-encre-950">
                Les instruments de ta table
              </h2>
            </div>
            <span className="hidden font-serif text-sm italic text-encre-500 sm:block">
              Tout reste à portée de main
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {OUTILS_TABLE.map((outil, index) => {
              const Icone = outil.icon;
              return (
                <Link
                  key={outil.href}
                  href={outil.href}
                  className={`objet-table relative flex min-h-36 flex-col justify-between overflow-hidden rounded-3xl border p-4 shadow-sm ${outil.style} ${outil.rotation}`}
                >
                  {index % 3 === 0 ? (
                    <span className="ruban -top-2 left-5 rotate-2 rounded-[2px]" />
                  ) : (
                    <span className="punaise -top-2 right-5" />
                  )}
                  <div className="relative z-10 flex items-start justify-between gap-2 pt-1">
                    <span className={`text-2xs font-black uppercase tracking-[0.12em] ${outil.sombre ? 'text-parchemin-200' : 'text-encre-700'}`}>
                      {outil.repere}
                    </span>
                    <Icone className={`h-4 w-4 shrink-0 ${outil.sombre ? 'text-or-300' : 'text-or-800'}`} strokeWidth={1.8} />
                  </div>
                  <div className="relative z-10 mt-5">
                    <h3 className="font-serif text-base font-bold leading-tight">{outil.titre}</h3>
                    <p className={`mt-1 text-xs leading-snug ${outil.sombre ? 'text-parchemin-200' : 'text-encre-700'}`}>{outil.detail}</p>
                    <span className={`mt-3 inline-block text-2xs font-black uppercase tracking-[0.08em] ${outil.sombre ? 'text-or-300' : 'text-or-900'}`}>
                      Ouvrir →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

      </div>

      <NotificationCenter
        ouvert={notifOuvert}
        onFermer={() => setNotifOuvert(false)}
      />
    </div>
  );
}
