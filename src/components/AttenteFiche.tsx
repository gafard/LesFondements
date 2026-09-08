'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Users } from 'lucide-react';
import { useParcours } from '@/lib/ParcoursContext';
import { etapePersonnelle } from '@/lib/parcoursDomain';

/** Une explication commune aux liens directs de lecture et d’immersion. */
export default function AttenteFiche({ ficheId }: { ficheId: number }) {
  const { group, completedFiches, preparationStep } = useParcours();
  const personnelle = etapePersonnelle(completedFiches);
  const attendGroupe = !!group && personnelle > group.currentStep;
  const reprise = Math.max(1, preparationStep);
  return (
    <section className="flex min-h-[75svh] items-center justify-center bg-parchemin-50 px-5 py-16 text-encre-950">
      <div className="w-full max-w-lg rounded-3xl border border-parchemin-300 bg-white p-7 sm:p-10">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-or-100 text-or-900" aria-hidden="true">
          {attendGroupe ? <Users /> : <BookOpen />}
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-or-800">Un pas après l’autre</p>
        <h1 className="mt-3 font-serif text-3xl font-bold">La fiche {ficheId} n’est pas encore ouverte</h1>
        <p className="mt-5 text-base leading-relaxed text-encre-700">
          {attendGroupe
            ? `Ta préparation de la fiche ${group.currentStep} est terminée. ${group.name} poursuit cette fiche : la suite s’ouvrira après sa clôture en cellule.`
            : `Terminez la fiche précédente pour poursuivre. Reprends la fiche ${reprise}, là où tu en es.`}
        </p>
        {!attendGroupe && group && <p className="mt-3 text-sm leading-relaxed text-encre-600">La suite tient aussi compte du rythme de ta cellule, actuellement à la fiche {group.currentStep}.</p>}
        <Link href={attendGroupe ? '/groupes' : `/aujourdhui?fiche=${reprise}`} className="bouton-or mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold">
          {attendGroupe ? 'Préparer la rencontre' : `Reprendre la fiche ${reprise}`}<ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/fiches" className="mt-4 flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">Voir mon parcours</Link>
        <p className="mt-5 border-t border-parchemin-200 pt-5 text-sm leading-relaxed text-encre-600">Tu peux relire les fiches déjà ouvertes. Tes réponses personnelles restent privées.</p>
      </div>
    </section>
  );
}
