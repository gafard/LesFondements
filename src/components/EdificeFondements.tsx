'use client';

import Link from 'next/link';
import { FICHES_META } from '@/data/fichesMeta';
import { Sparkles, Check, Compass, Shield } from 'lucide-react';

interface EdificeFondementsProps {
  closedSteps?: number[];
  currentStep?: number;
}

export default function EdificeFondements({
  closedSteps = [],
  currentStep = 1,
}: EdificeFondementsProps) {
  // Les 20 fiches réparties dans l'élévation architecturale du Temple :
  // Niveau 4 (Fronton & Couronne Céleste) : Fiches 16 à 20 (5 pierres d'arcade)
  // Niveau 3 (Sanctuaire & Corps de Christ) : Fiches 12 à 15 (4 grandes pierres)
  // Niveau 2 (Les Colonnes de Puissance & Esprit) : Fiches 6 à 11 (6 pierres coloniales)
  // Niveau 1 (Les Assises & Fondations Majeures) : Fiches 1 à 5 (5 pierres de socle)

  const NIVEAUX = [
    {
      etage: 'IV',
      titre: 'Couronne & Accomplissement',
      description: 'Prière, Alliances & Fins Dernières',
      fiches: [16, 17, 18, 19, 20],
      gridCols: 'grid-cols-2 sm:grid-cols-5',
    },
    {
      etage: 'III',
      titre: 'Le Sanctuaire & Le Corps',
      description: 'Discipulat, Église & Communauté',
      fiches: [12, 13, 14, 15],
      gridCols: 'grid-cols-2 sm:grid-cols-4',
    },
    {
      etage: 'II',
      titre: 'Les Colonnes de Puissance',
      description: 'Liberté, Saint-Esprit & Dons Spirituels',
      fiches: [6, 7, 8, 9, 10, 11],
      gridCols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
    },
    {
      etage: 'I',
      titre: 'Les Fondations & L’Assise Vivante',
      description: 'Connaître Dieu, Salut, Grâce & Identité',
      fiches: [1, 2, 3, 4, 5],
      gridCols: 'grid-cols-2 sm:grid-cols-5',
    },
  ];

  const pourcentage = Math.round((closedSteps.length / 20) * 100);

  return (
    <div className="temple-cadre relative overflow-hidden rounded-4xl p-5 sm:p-8 shadow-2xl border-2 border-parchemin-400">
      <span className="ruban -top-3 left-1/2 -translate-x-1/2 -rotate-1 rounded-[2px]" />

      {/* En-tête Architecturale */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-parchemin-300/80 pb-5 mb-6">
        <div>
          <span className="text-3xs font-bold uppercase tracking-[0.25em] text-or-800 flex items-center gap-1.5 font-serif">
            <Compass className="h-3.5 w-3.5 text-or-600" />
            Édifice Vivant · 1 Corinthiens 3:9-16
          </span>
          <h3 className="manuscrit mt-1 text-2xl sm:text-3xl font-bold text-encre-950">
            Le Temple des 20 Fondements
          </h3>
          <p className="font-serif text-xs text-encre-700 mt-1 max-w-xl leading-relaxed">
            Vous êtes l’édifice de Dieu. Chaque fiche étudiée est une pierre taillée scellée dans votre vie spirituelle.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-or-100/90 to-amber-100/90 px-4 py-2.5 border border-or-300 shadow-xs shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-or-400 text-encre-950 shadow-2xs font-bold">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <span className="text-2xs font-bold text-or-950 block leading-none">
              {closedSteps.length} / 20 Pierres
            </span>
            <span className="text-3xs text-or-800 font-serif italic mt-0.5 block">
              {pourcentage}% achevé
            </span>
          </div>
        </div>
      </div>

      {/* ══ Structure Physique du Bâtiment (Façade de Temple) ══ */}
      <div className="relative mx-auto max-w-4xl">
        {/* 1. Fronton Sculpté Triangulaire en haut */}
        <div className="fronton-temple relative mx-auto mb-3 rounded-t-3xl p-4 text-center border border-or-300">
          <div className="flex items-center justify-center gap-2 text-or-900">
            <span className="h-px w-12 bg-or-400 hidden sm:block" />
            <Shield className="h-4 w-4 text-or-700" />
            <span className="font-serif text-xs font-bold uppercase tracking-[0.2em] text-or-950">
              Sanctuaire de l’Esprit · Gloire & Plénitude
            </span>
            <Shield className="h-4 w-4 text-or-700" />
            <span className="h-px w-12 bg-or-400 hidden sm:block" />
          </div>
          <p className="font-serif text-3xs italic text-or-800/90 mt-1">
            « Vous êtes le temple de Dieu, et l’Esprit de Dieu habite en vous. » (1 Co 3:16)
          </p>
        </div>

        {/* 2. Le Corps du Bâtiment encadré de deux Pilastres Cannelés */}
        <div className="relative flex gap-2 sm:gap-4 items-stretch">
          {/* Pilastre Gauche (Jakin) */}
          <div className="pilastre-temple hidden sm:flex w-8 shrink-0 flex-col justify-between items-center py-4 rounded-xl shadow-xs">
            <span className="font-serif text-3xs font-bold text-encre-600 [writing-mode:vertical-rl] rotate-180 uppercase tracking-widest">
              J A K I N
            </span>
            <span className="h-3 w-3 rounded-full bg-or-400 border border-or-600 shadow-2xs" />
          </div>

          {/* Les 4 Assises de Pierres Taillées */}
          <div className="flex-1 space-y-3">
            {NIVEAUX.map((niveau) => (
              <div
                key={niveau.etage}
                className="relative rounded-2xl bg-parchemin-200/40 p-2.5 sm:p-3.5 border border-parchemin-300/90 shadow-inner"
              >
                {/* Bandeau d'entablement de l'étage */}
                <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-parchemin-300/80">
                  <div className="flex items-center gap-2">
                    <span className="flex h-4 w-5 items-center justify-center rounded-sm bg-or-400/30 text-3xs font-bold font-serif text-or-950">
                      {niveau.etage}
                    </span>
                    <span className="text-3xs font-bold uppercase tracking-wider text-encre-800">
                      {niveau.titre}
                    </span>
                  </div>
                  <span className="text-3xs text-encre-500 font-serif italic hidden md:inline">
                    {niveau.description}
                  </span>
                </div>

                {/* Blocs de Pierres Appareillées */}
                <div className={`grid ${niveau.gridCols} gap-2`}>
                  {niveau.fiches.map((ficheId) => {
                    const meta = FICHES_META.find((f) => f.id === ficheId);
                    const estCloturee = closedSteps.includes(ficheId);
                    const estEnCours = currentStep === ficheId;

                    return (
                      <Link
                        key={ficheId}
                        href={`/fiches/${ficheId}`}
                        className={`pierre-appareillee group relative flex flex-col justify-between rounded-xl p-2.5 sm:p-3 text-left transition-all duration-300 ${
                          estCloturee
                            ? 'pierre-scellee'
                            : estEnCours
                            ? 'pierre-en-cours'
                            : 'bg-white hover:bg-parchemin-50'
                        }`}
                      >
                        {/* Numéro et Sceau gravé */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-serif text-3xs font-bold uppercase tracking-wider ${
                              estCloturee
                                ? 'text-amber-900'
                                : estEnCours
                                ? 'text-indigo-600 font-black'
                                : 'text-encre-400'
                            }`}
                          >
                            P.{String(ficheId).padStart(2, '0')}
                          </span>
                          {estCloturee ? (
                            <span className="grid h-4 w-4 place-items-center rounded-full bg-amber-500 text-white shadow-xs">
                              <Check className="h-2.5 w-2.5 stroke-[3.5]" />
                            </span>
                          ) : estEnCours ? (
                            <span className="relative flex h-3 w-3">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                              <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-600" />
                            </span>
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-parchemin-300" />
                          )}
                        </div>

                        {/* Titre gravé sur la pierre */}
                        <p
                          className={`manuscrit mt-1.5 line-clamp-2 text-xs font-bold leading-tight ${
                            estCloturee
                              ? 'text-amber-950'
                              : estEnCours
                              ? 'text-encre-950 font-black'
                              : 'text-encre-600'
                          }`}
                        >
                          {meta?.titre || `Fiche ${ficheId}`}
                        </p>

                        {/* Joint de biseau sculpté */}
                        <div className="mt-2 flex items-center gap-1">
                          <span
                            className={`h-0.5 flex-1 rounded-full ${
                              estCloturee
                                ? 'bg-amber-400'
                                : estEnCours
                                ? 'bg-indigo-500'
                                : 'bg-parchemin-300'
                            }`}
                          />
                          {estCloturee && (
                            <span className="text-3xs text-amber-700 font-serif italic">
                              scellée
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Pilastre Droit (Boaz) */}
          <div className="pilastre-temple hidden sm:flex w-8 shrink-0 flex-col justify-between items-center py-4 rounded-xl shadow-xs">
            <span className="font-serif text-3xs font-bold text-encre-600 [writing-mode:vertical-rl] rotate-180 uppercase tracking-widest">
              B O A Z
            </span>
            <span className="h-3 w-3 rounded-full bg-or-400 border border-or-600 shadow-2xs" />
          </div>
        </div>

        {/* 3. Le Socle Monumental en Roc (Jésus-Christ - 1 Co 3:11) */}
        <div className="socle-pierre-angulaire mt-3 rounded-b-3xl p-4 sm:p-5 text-center text-parchemin-100 shadow-xl border-t-2 border-or-400">
          <div className="flex items-center justify-center gap-2">
            <span className="text-or-400 font-serif font-bold text-xs">◆ LE ROC ÉTERNEL ◆</span>
          </div>
          <p className="manuscrit mt-1 text-sm sm:text-base font-bold tracking-wide text-or-200">
            « Car personne ne peut poser un autre fondement que celui qui a été posé, savoir Jésus-Christ. »
          </p>
          <span className="text-3xs text-parchemin-300/80 font-serif italic block mt-0.5">
            1 Corinthiens 3:11 · La Pierre Angulaire Vivante
          </span>
        </div>
      </div>
    </div>
  );
}

