'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, LayoutGrid, Search, Tags } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { chargerLivret, type EntreeIndex } from '@/lib/livret';
import ParcoursGate from '@/components/ParcoursGate';
import RecapManque from '@/components/RecapManque';
import { FICHES_META } from '@/data/fichesMeta';

/**
 * Le parcours : les vingt fiches, d'un seul tenant.
 *
 * Le livret n'a jamais été découpé en chapitres : les fiches se répondent
 * (devenir enfant de Dieu, c'est déjà être transformé), et des cases les
 * auraient réduites. Toutes se consultent librement — on encourage à les
 * prendre dans l'ordre, sans interdire d'aller voir plus loin.
 */

function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** La fiche qui contient une page du livret imprimé. */
function ficheDeLaPage(page: number): number | null {
  let trouvee: number | null = null;
  for (const meta of FICHES_META) {
    if (page >= meta.page) trouvee = meta.id;
  }
  return trouvee;
}

/**
 * Un thème de l'index renvoie souvent à plusieurs endroits du livret (« Loi »
 * : p. 13 et p. 137). N'en garder que la première page menait parfois à la
 * mauvaise fiche ; on les garde toutes, dans l'ordre du parcours.
 */
function fichesDuTheme(entree: EntreeIndex): number[] {
  const ids = entree.pages
    .map(ficheDeLaPage)
    .filter((id): id is number => id !== null);
  return [...new Set(ids)].sort((a, b) => a - b);
}

function SentierContent() {
  const { user } = useAuth();
  const { group, membership, preparationStep, completedFiches, loading } = useParcours();
  const searchParams = useSearchParams();
  const [vue, setVue] = useState<'fiches' | 'themes'>(() =>
    searchParams.get('vue') === 'themes' ? 'themes' : 'fiches'
  );
  const [recherche, setRecherche] = useState('');
  const [index, setIndex] = useState<EntreeIndex[] | null>(null);

  useEffect(() => {
    void chargerLivret().then((livret) =>
      setIndex([...livret.index].sort((a, b) => a.theme.localeCompare(b.theme, 'fr')))
    );
  }, []);

  const courante = Math.min(20, Math.max(1, preparationStep));
  const q = normaliser(recherche.trim());
  const filtrees = FICHES_META.filter(
    (fiche) =>
      !q || normaliser(`${fiche.titre} ${fiche.sousTitre}`).includes(q) || String(fiche.id) === q
  );
  const themes = (index ?? []).filter((entree) => !q || normaliser(entree.theme).includes(q));
  const parcoursTermine = completedFiches.length === 20 && (!group || !!group.completedAt);
  const titreCourante = FICHES_META.find((fiche) => fiche.id === courante)?.titre;
  // Seuls ceux qui ont déjà commencé ont besoin d'un raccourci pour reprendre.
  const aCommence = completedFiches.length > 0 || preparationStep > 1;

  // Pas de repère « étape conseillée » : le livret dit déjà que les fiches
  // se prennent dans l'ordre, et la plupart le feront. Seul ce qui est fait
  // est signalé.
  const carte = (fiche: (typeof FICHES_META)[number]) => {
    const partagee = !!group?.closedSteps.includes(fiche.id);
    const preparee = completedFiches.includes(fiche.id) || !!membership?.preparedSteps.includes(fiche.id);
    const label = partagee ? 'Partagée en cellule' : preparee ? 'Préparée' : null;
    return (
      <Link
        key={fiche.id}
        href={`/fiches/${fiche.id}`}
        className="flex h-full flex-col rounded-2xl border border-parchemin-300 bg-white p-5 transition-colors hover:border-or-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-or-700"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-parchemin-100 text-sm font-bold text-encre-700">
            {String(fiche.id).padStart(2, '0')}
          </span>
          {label && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
              <Check className="h-3.5 w-3.5" />
              {label}
            </span>
          )}
        </div>
        <h3 className="mt-4 font-serif text-lg font-bold leading-snug text-encre-950">{fiche.titre}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-encre-700">{fiche.sousTitre}</p>
        <p className="mt-4 flex items-center gap-2 border-t border-parchemin-200 pt-3 text-sm">
          {preparee || partagee ? 'Relire la fiche' : 'Ouvrir la fiche'}
          <ArrowRight className="h-4 w-4 shrink-0" />
        </p>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-parchemin-50 px-4 py-7 text-encre-950 sm:px-7">
      <div className="mx-auto max-w-5xl">
        <header className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-or-800">Vingt fiches</p>
          <h1 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">Le parcours des Fondements</h1>
        </header>

        {user && loading ? (
          <p role="status" className="my-8">Ouverture de ta progression…</p>
        ) : (
          <>
            {user && aCommence && !parcoursTermine && (
              <Link
                href={`/fiches/${courante}`}
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-or-900 underline underline-offset-4"
              >
                Reprendre la fiche {courante} · {titreCourante}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            {group && (
              <div className="mt-5">
                <RecapManque key={`${user?.uid}:${group.id}`} />
              </div>
            )}

            <div className="mb-6 mt-7 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label htmlFor="recherche-fiches" className="mb-2 block text-sm font-semibold">
                  {vue === 'fiches' ? 'Retrouver une fiche' : 'Retrouver un thème'}
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-4 h-4 w-4 text-encre-600" />
                  <input
                    id="recherche-fiches"
                    value={recherche}
                    onChange={(event) => setRecherche(event.target.value)}
                    placeholder={vue === 'fiches' ? 'Grâce, pardon, prière…' : 'Jeûne, légalisme, pardon…'}
                    className="min-h-12 w-full rounded-xl border border-parchemin-300 bg-white pl-11 pr-4 text-base focus:outline-2 focus:outline-or-600"
                  />
                </div>
              </div>
              <div className="flex gap-2" role="group" aria-label="Présentation du parcours">
                {[
                  { valeur: 'fiches' as const, label: 'Les 20 fiches', icone: LayoutGrid },
                  { valeur: 'themes' as const, label: 'Par thèmes', icone: Tags },
                ].map((option) => (
                  <button
                    key={option.valeur}
                    type="button"
                    aria-pressed={vue === option.valeur}
                    onClick={() => setVue(option.valeur)}
                    className={`inline-flex min-h-12 items-center gap-2 rounded-xl border px-4 text-sm ${
                      vue === option.valeur ? 'border-encre-950 bg-encre-950 text-white' : 'border-parchemin-300 bg-white'
                    }`}
                  >
                    <option.icone className="h-4 w-4" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {vue === 'fiches' ? (
              filtrees.length > 0 ? (
                <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtrees.map((fiche) => (
                    <li key={fiche.id}>{carte(fiche)}</li>
                  ))}
                </ol>
              ) : (
                <p role="status" className="rounded-2xl border border-parchemin-300 p-6 text-sm">
                  Aucune fiche pour « {recherche} ».
                  {themes.length > 0 && (
                    <button type="button" onClick={() => setVue('themes')} className="ml-1 font-semibold underline">
                      Chercher dans les thèmes
                    </button>
                  )}
                </p>
              )
            ) : (
              <section aria-label="Index thématique">
                <p className="max-w-2xl text-sm leading-relaxed text-encre-700">
                  L’index de fin de livret : chaque mot-clé mène aux fiches qui en parlent.
                </p>
                {index === null ? (
                  <p className="mt-6 animate-pulse text-sm text-encre-500">Ouverture de l’index…</p>
                ) : themes.length === 0 ? (
                  <p role="status" className="mt-6 text-sm text-encre-600">Aucun thème pour « {recherche} ».</p>
                ) : (
                  <ul className="mt-6 divide-y divide-parchemin-200 rounded-2xl border border-parchemin-300 bg-white">
                    {themes.map((entree) => (
                      <li
                        key={entree.theme}
                        className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="font-serif text-base font-semibold">{entree.theme}</span>
                        <span className="flex flex-wrap gap-2">
                          {fichesDuTheme(entree).map((id) => (
                            <Link
                              key={id}
                              href={`/fiches/${id}`}
                              title={FICHES_META.find((fiche) => fiche.id === id)?.titre}
                              className="inline-flex min-h-9 items-center gap-1 rounded-full border border-or-300 bg-or-50 px-3 text-xs font-bold text-or-900 hover:bg-or-100"
                            >
                              <BookOpen className="h-3 w-3" />
                              Fiche {id}
                            </Link>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ParcoursGate acces="decouverte">
      <Suspense fallback={null}>
        <SentierContent />
      </Suspense>
    </ParcoursGate>
  );
}
