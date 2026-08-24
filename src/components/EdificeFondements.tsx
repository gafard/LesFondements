'use client';

import Link from 'next/link';
import { FICHES_META } from '@/data/fichesMeta';
import { Sparkles, Check, Lock, Compass } from 'lucide-react';

interface EdificeFondementsProps {
  closedSteps?: number[];
  currentStep?: number;
}

export default function EdificeFondements({
  closedSteps = [],
  currentStep = 1,
}: EdificeFondementsProps) {
  // Les 20 fiches réparties en 4 niveaux architecturaux :
  // Niveau 4 (Sommet / Couronne) : Fiches 16 à 20
  // Niveau 3 (Sanctuaire & Mission) : Fiches 12 à 15
  // Niveau 2 (Colonnes Vivantes) : Fiches 6 à 11
  // Niveau 1 (Fondations & Socle) : Fiches 1 à 5

  const NIVEAUX = [
    {
      titre: 'Couronne & Accomplissement',
      description: 'Prière, Alliance & Fins Dernières',
      fiches: [16, 17, 18, 19, 20],
      largeurPierre: 'col-span-2 sm:col-span-2',
    },
    {
      titre: 'Le Corps & Le Royaume',
      description: 'Discipulat, Église & Communauté',
      fiches: [12, 13, 14, 15],
      largeurPierre: 'col-span-3 sm:col-span-3',
    },
    {
      titre: 'Les Colonnes de Puissance',
      description: 'Liberté & Vie de l’Esprit',
      fiches: [6, 7, 8, 9, 10, 11],
      largeurPierre: 'col-span-2 sm:col-span-2',
    },
    {
      titre: 'Le Roc & Les Fondations',
      description: 'Dieu, Le Salut, La Foi & La Grâce',
      fiches: [1, 2, 3, 4, 5],
      largeurPierre: 'col-span-2 sm:col-span-2',
    },
  ];

  return (
    <div className="feuille relative overflow-hidden rounded-4xl border border-parchemin-400 p-6 sm:p-8 shadow-md">
      <span className="punaise -top-2.5 left-8" />
      <span className="ruban -top-3 right-10 rotate-2 rounded-[2px]" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-parchemin-300 pb-5 mb-6">
        <div>
          <span className="text-2xs font-bold uppercase tracking-[0.22em] text-or-700 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5" />
            Architecture Spirituelle
          </span>
          <h3 className="manuscrit mt-1 text-2xl sm:text-3xl font-bold text-encre-950">
            L’Édifice des Fondements
          </h3>
          <p className="font-serif text-xs text-encre-600 mt-1 max-w-xl">
            Chaque fiche posée est une pierre taillée gravée dans votre cœur, bâtie sur le Roc inébranlable de Jésus-Christ.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-or-50/80 px-4 py-2 border border-or-200 shrink-0">
          <Sparkles className="h-4 w-4 text-or-600" />
          <span className="text-xs font-bold text-or-950">
            {closedSteps.length} / 20 pierres scellées
          </span>
        </div>
      </div>

      {/* Rendu des 4 étages de pierres taillées */}
      <div className="space-y-4">
        {NIVEAUX.map((niveau, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-3xs font-bold uppercase tracking-wider text-encre-400">
                {niveau.titre}
              </span>
              <span className="text-3xs text-encre-400 italic hidden sm:inline">
                {niveau.description}
              </span>
            </div>

            <div className="grid grid-cols-10 gap-2 sm:gap-3">
              {niveau.fiches.map((ficheId) => {
                const meta = FICHES_META.find((f) => f.id === ficheId);
                const estCloturee = closedSteps.includes(ficheId);
                const estEnCours = currentStep === ficheId;

                return (
                  <Link
                    key={ficheId}
                    href={`/fiches/${ficheId}`}
                    className={`${niveau.largeurPierre} group relative flex flex-col justify-between overflow-hidden rounded-2xl p-3 sm:p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-md border ${
                      estCloturee
                        ? 'border-or-400 bg-gradient-to-br from-or-100 via-amber-50 to-or-200 text-or-950 shadow-xs ring-1 ring-or-300'
                        : estEnCours
                        ? 'border-indigo-400 bg-white text-encre-950 shadow-sm ring-2 ring-indigo-500 animate-pulse'
                        : 'border-parchemin-300/80 bg-parchemin-100/50 text-encre-600 hover:bg-white hover:border-parchemin-400'
                    }`}
                  >
                    {/* Numéro et statut */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-serif text-xs font-bold ${
                          estCloturee ? 'text-or-800' : estEnCours ? 'text-indigo-600' : 'text-encre-400'
                        }`}
                      >
                        {String(ficheId).padStart(2, '0')}
                      </span>
                      {estCloturee ? (
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      ) : estEnCours ? (
                        <span className="h-2 w-2 rounded-full bg-indigo-600" />
                      ) : null}
                    </div>

                    {/* Titre de la pierre */}
                    <p
                      className={`manuscrit mt-2 truncate text-xs font-bold leading-tight ${
                        estCloturee
                          ? 'text-or-950'
                          : estEnCours
                          ? 'text-encre-950'
                          : 'text-encre-600'
                      }`}
                    >
                      {meta?.titre || `Fiche ${ficheId}`}
                    </p>

                    {/* Effet ciselé pierre */}
                    <span
                      className={`mt-2 block h-0.5 rounded-full ${
                        estCloturee
                          ? 'bg-or-400'
                          : estEnCours
                          ? 'bg-indigo-400'
                          : 'bg-parchemin-300'
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Socle : Le Roc (Jésus-Christ) */}
      <div className="mt-6 flex items-center justify-center rounded-2xl bg-encre-950 py-3 text-center text-parchemin-100 shadow-md">
        <p className="manuscrit text-sm sm:text-base font-bold tracking-wide text-or-200">
          « Nul ne peut poser un autre fondement que celui qui a été posé, qui est Jésus-Christ. » (1 Co 3:11)
        </p>
      </div>
    </div>
  );
}
