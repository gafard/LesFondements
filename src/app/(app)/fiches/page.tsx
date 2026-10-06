'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, Route, Search } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import ParcoursGate from '@/components/ParcoursGate';
import { FICHES_META } from '@/data/fichesMeta';

function SentierContent() {
  const { user } = useAuth();
  const { group, membership, preparationStep, completedFiches, loading } = useParcours();
  const [recherche, setRecherche] = useState('');
  const maxAccessible = Math.min(20, Math.max(1, preparationStep));
  const normaliser = (texte: string) =>
    texte
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const q = normaliser(recherche.trim());
  const filtrees = FICHES_META.filter(
    (fiche) =>
      !q ||
      normaliser(`${fiche.titre} ${fiche.sousTitre}`).includes(q) ||
      String(fiche.id) === q
  );

  const carte = (fiche: typeof FICHES_META[number]) => {
    const partagee = !!group?.closedSteps.includes(fiche.id);
    const preparee =
      completedFiches.includes(fiche.id) ||
      !!membership?.preparedSteps.includes(fiche.id);
    const courante = fiche.id === maxAccessible;
    // Ni « Étape conseillée » ni « Consultation libre » : le parcours s'allège.
    // Seul l'accomplissement réel (terminé ou partagé) est signalé avec discrétion.
    const label = partagee
      ? 'Partagée en cellule'
      : preparee
      ? 'Préparation terminée'
      : null;

    const contenu = (
      <>
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
              courante ? 'bg-or-300 text-encre-950' : 'bg-parchemin-100 text-encre-700'
            }`}
          >
            {String(fiche.id).padStart(2, '0')}
          </span>
          {label && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
              <Check className="h-3.5 w-3.5" />
              {label}
            </span>
          )}
        </div>
        <h3 className="mt-4 font-serif text-xl font-bold leading-snug text-encre-950">
          {fiche.titre}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-encre-700">{fiche.sousTitre}</p>
        <p className="mt-5 flex items-center gap-2 border-t border-parchemin-200 pt-4 text-sm leading-relaxed font-semibold text-encre-800">
          {preparee || partagee ? 'Relire la fiche' : 'Ouvrir la fiche'}
          <ArrowRight className="h-4 w-4 shrink-0 text-or-600" />
        </p>
      </>
    );

    return (
      <Link
        key={fiche.id}
        href={`/fiches/${fiche.id}`}
        aria-current={courante ? 'step' : undefined}
        className={`block rounded-2xl border bg-white p-5 transition-colors hover:border-or-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-or-700 ${
          courante
            ? 'border-or-500 ring-1 ring-or-300 shadow-xs'
            : 'border-parchemin-300'
        }`}
      >
        {contenu}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-parchemin-50 px-4 py-7 text-encre-950 sm:px-7">
      <div className="mx-auto max-w-5xl">
        <header className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-or-800">
            Vingt fiches en accès libre
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
            Le parcours des 20 fondements
          </h1>
          <p className="mt-4 text-base leading-relaxed text-encre-700">
            Explorez librement chaque fiche. Un enseignement biblique solide, un temps pour
            répondre, une rencontre pour partager.
          </p>
        </header>

        {user && loading ? (
          <p role="status" className="my-8">
            Ouverture de ta progression…
          </p>
        ) : (
          <>
            <div className="my-7 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="recherche-fiches" className="mb-2 block text-sm font-semibold">
                  Retrouver une fiche
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-4 h-4 w-4 text-encre-600" />
                  <input
                    id="recherche-fiches"
                    value={recherche}
                    onChange={(event) => setRecherche(event.target.value)}
                    placeholder="Grâce, pardon, prière, identité…"
                    className="min-h-12 w-full rounded-xl border border-parchemin-300 bg-white pl-11 pr-4 text-base focus:outline-2 focus:outline-or-600"
                  />
                </div>
              </div>
              <div>
                <Link
                  href="/index-thematique"
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-parchemin-300 bg-white px-4 text-sm font-semibold text-encre-800 hover:border-or-500 hover:text-encre-950 transition-colors"
                >
                  <Route className="h-4 w-4 text-or-700" />
                  <span>Par thèmes (Index)</span>
                </Link>
              </div>
            </div>

            {filtrees.length === 0 && (
              <div role="status" className="rounded-2xl border border-parchemin-300 p-7">
                <p>Aucune fiche pour « {recherche} ».</p>
                <button
                  onClick={() => setRecherche('')}
                  className="mt-3 min-h-11 font-semibold underline"
                >
                  Voir les vingt fiches
                </button>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtrees.map(carte)}
            </div>

            <p className="mt-8 flex items-start gap-2 text-sm leading-relaxed text-encre-600">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0" />
              Toutes les 20 fiches sont en libre consultation pour votre étude personnelle ou en petit groupe.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ParcoursGate acces="decouverte">
      <SentierContent />
    </ParcoursGate>
  );
}
