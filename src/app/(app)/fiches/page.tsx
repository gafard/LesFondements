'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, Search, Users } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { chargerLivret, type EntreeIndex } from '@/lib/livret';
import ParcoursGate from '@/components/ParcoursGate';
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
  const terminees = group?.closedSteps.length ?? completedFiches.length;
  const parcoursTermine = completedFiches.length === 20 && (!group || !!group.completedAt);
  const titreCourante = FICHES_META.find((fiche) => fiche.id === courante)?.titre;

  const carte = (fiche: (typeof FICHES_META)[number]) => {
    const partagee = !!group?.closedSteps.includes(fiche.id);
    const preparee = completedFiches.includes(fiche.id) || !!membership?.preparedSteps.includes(fiche.id);
    const estCourante = fiche.id === courante && !parcoursTermine;
    const label = partagee ? 'Partagée en cellule' : preparee ? 'Préparée' : estCourante ? 'En cours' : null;
    return (
      <Link
        key={fiche.id}
        href={`/fiches/${fiche.id}`}
        aria-current={estCourante ? 'step' : undefined}
        className={`flex h-full flex-col rounded-2xl border bg-white p-5 transition-colors hover:border-or-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-or-700 ${
          estCourante ? 'border-or-500 ring-1 ring-or-300' : 'border-parchemin-300'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
              estCourante ? 'bg-or-300 text-encre-950' : 'bg-parchemin-100 text-encre-700'
            }`}
          >
            {String(fiche.id).padStart(2, '0')}
          </span>
          {label && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                partagee || preparee ? 'text-emerald-800' : 'text-or-800'
              }`}
            >
              {(partagee || preparee) && <Check className="h-3.5 w-3.5" />}
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
          <p className="mt-4 text-base leading-relaxed text-encre-700">
            Toutes les fiches sont ouvertes. Le parcours se prend de préférence dans l’ordre, mais
            chacun peut en avoir une vue d’ensemble ou explorer un thème particulier.
          </p>
        </header>

        {user && loading ? (
          <p role="status" className="my-8">Ouverture de ta progression…</p>
        ) : (
          <>
            <section className="my-7 rounded-3xl border border-or-200 bg-white p-6" aria-label="Ma fiche en cours">
              <p className="text-xs font-bold uppercase tracking-widest text-or-800">
                {group ? group.name : 'Ma fiche en cours'}
              </p>
              <h2 className="mt-3 font-serif text-xl font-bold">
                {parcoursTermine ? 'Vingt fiches parcourues' : `Fiche ${courante} · ${titreCourante}`}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-encre-700">
                {parcoursTermine
                  ? 'Reviens sur les passages et les découvertes que tu souhaites garder.'
                  : 'L’exposé, le résumé à partager et les annexes : la fiche complète, à étudier à ton rythme — un peu chaque jour ou en une seule fois.'}
                {group && !parcoursTermine ? ` Ta cellule en est à la fiche ${group.currentStep}.` : ''}
              </p>
              <Link
                href={parcoursTermine ? '/journal' : `/fiches/${courante}`}
                className="bouton-or mt-5 inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-bold"
              >
                {parcoursTermine ? 'Relire mon carnet' : `Étudier la fiche ${courante}`}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!group && (
                <Link
                  href="/onboarding"
                  className="mt-3 flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 sm:ml-5 sm:inline-flex"
                >
                  <Users className="h-4 w-4" />
                  Partager en cellule
                </Link>
              )}
              {user && (
                <p className="mt-4 text-sm text-encre-600">
                  {terminees}/20 fiches {group ? 'partagées en cellule' : 'préparées'} · Tes réponses restent privées.
                </p>
              )}
            </section>

            <div className="mb-6">
              <label htmlFor="recherche-fiches" className="mb-2 block text-sm font-semibold">
                Retrouver une fiche ou un thème
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-4 h-4 w-4 text-encre-600" />
                <input
                  id="recherche-fiches"
                  value={recherche}
                  onChange={(event) => setRecherche(event.target.value)}
                  placeholder="Grâce, pardon, jeûne, légalisme…"
                  className="min-h-12 w-full rounded-xl border border-parchemin-300 bg-white pl-11 pr-4 text-base focus:outline-2 focus:outline-or-600"
                />
              </div>
            </div>

            {filtrees.length > 0 ? (
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtrees.map((fiche) => (
                  <li key={fiche.id}>{carte(fiche)}</li>
                ))}
              </ol>
            ) : (
              <p role="status" className="rounded-2xl border border-parchemin-300 p-6 text-sm">
                Aucun titre de fiche pour « {recherche} ».
                {themes.length > 0 ? ' Voir les thèmes ci-dessous.' : ''}
              </p>
            )}

            <section id="index" className="mt-12 scroll-mt-20" aria-labelledby="titre-index">
              <h2 id="titre-index" className="font-serif text-2xl font-bold">Index thématique</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-encre-700">
                L’index de fin de livret : certains thèmes se devinent au titre des fiches,
                d’autres moins. Chaque mot-clé mène aux fiches qui en parlent.
              </p>
              {index === null ? (
                <p className="mt-6 animate-pulse text-sm text-encre-500">Ouverture de l’index…</p>
              ) : themes.length === 0 ? (
                <p className="mt-6 text-sm text-encre-600">Aucun thème pour « {recherche} ».</p>
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
