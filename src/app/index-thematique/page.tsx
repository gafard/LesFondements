'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Lock, Search } from 'lucide-react';
import { useParcours } from '@/lib/ParcoursContext';
import { chargerLivret, type EntreeIndex } from '@/lib/livret';
import { FICHES_META } from '@/data/fichesMeta';

/**
 * Éclairages rédigés pour l'application. L'index du livret (p. 163) ne donne
 * que le thème et les pages : ces quelques lignes disent de quoi il retourne.
 */
const ECLAIRAGES: Record<string, string> = {
  Anges: "Leur rôle et leur ministère dans le plan de Dieu, et ce qu'ils ne sont pas.",
  'Autorité, responsables, anciens, etc.':
    "L'exercice du leadership, la soumission mutuelle et les ministères dans l'Église locale.",
  "Baptême dans l'eau et dans le Saint-Esprit":
    "Le sens de l'immersion, l'engagement de la foi, et le revêtement de puissance.",
  Délivrance:
    'Briser les liens, les malédictions et les emprises, pour marcher dans une liberté durable.',
  'Dîme, Sabbat, Fêtes':
    'Ce que deviennent ces pratiques sous la Nouvelle Alliance, sans légalisme ni mépris.',
  'Dualisme (pensée grecque)':
    "Distinguer la vision biblique unifiée de l'homme de l'héritage philosophique grec.",
  'Échange divin (guérison...)':
    "Ce que Jésus a pris à la croix, et ce qu'il nous a donné en retour.",
  Enfer: 'Ce que les Écritures disent de la séparation éternelle et de la justice de Dieu.',
  Foi: 'Une confiance, un repos, une réponse à la grâce — bien avant un effort.',
  Forteresses: 'Repérer et abattre les raisonnements et les mensonges installés dans la pensée.',
  'Intimidation, accusation, tentation':
    "Reconnaître les tactiques de l'ennemi et tenir ferme dans l'autorité reçue.",
  Jeûne: "S'humilier, s'approcher de Dieu, intensifier la prière.",
  Légalisme: 'Sortir du piège de la performance religieuse pour vivre du don gratuit.',
  'Loi (Torah)': 'Son rôle : révéler le péché et conduire à Christ.',
  'Louange, adoration': "Entrer dans la présence de Dieu et l'adorer en esprit et en vérité.",
};

interface Entree extends EntreeIndex {
  ficheId: number | null;
  eclairage?: string;
}

/** Retrouve la fiche qui contient une page du livret imprimé. */
function ficheDeLaPage(page: number): number | null {
  let trouvee: number | null = null;
  for (const meta of FICHES_META) {
    if (page >= meta.page) trouvee = meta.id;
  }
  return trouvee;
}

export default function IndexThematiquePage() {
  const { unlockedStep, group } = useParcours();
  const [entrees, setEntrees] = useState<Entree[] | null>(null);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    void chargerLivret().then((livret) => {
      setEntrees(
        livret.index
          .map((entree) => ({
            ...entree,
            ficheId: entree.pages.length ? ficheDeLaPage(entree.pages[0]) : null,
            eclairage: ECLAIRAGES[entree.theme],
          }))
          .sort((a, b) => a.theme.localeCompare(b.theme, 'fr'))
      );
    });
  }, []);

  const filtrees = useMemo(() => {
    if (!entrees) return [];
    const q = recherche.trim().toLowerCase();
    if (!q) return entrees;
    return entrees.filter(
      (entree) =>
        entree.theme.toLowerCase().includes(q) ||
        (entree.eclairage ?? '').toLowerCase().includes(q)
    );
  }, [entrees, recherche]);

  return (
    <div className="min-h-screen bg-parchemin-100 pb-10 pt-6">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 font-serif italic text-amber-800 text-xs sm:text-sm">
            Index thématique • Livret p. 163
          </p>
          <h1 className="font-serif text-3xl font-bold text-encre-950 sm:text-4xl">
            Retrouver un thème
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-encre-600 sm:text-sm">
            « Certains thèmes sont évidents à retrouver d&apos;après le titre des fiches,
            d&apos;autres moins… » — les voici, avec la fiche où ils sont traités.
          </p>
        </div>

        <div className="relative mx-auto mb-8 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-encre-300" />
          <input
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Chercher : jeûne, forteresses, légalisme…"
            className="w-full rounded-full border border-parchemin-400 bg-white py-3.5 pl-12 pr-4 text-sm text-encre-800 outline-none transition-colors placeholder:text-encre-300 focus:border-or-400"
          />
        </div>

        {entrees === null ? (
          <p className="animate-pulse text-center font-serif text-sm text-encre-400">
            Ouverture de l&apos;index…
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtrees.map((entree) => {
              const ouverte = !group || (entree.ficheId ?? 21) <= unlockedStep;
              const contenu = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-serif text-base font-bold leading-snug text-encre-950">
                      {entree.theme}
                    </h2>
                    {!ouverte && <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-encre-300" />}
                  </div>

                  {entree.eclairage && (
                    <p className="mt-1.5 text-2xs leading-relaxed text-encre-500">
                      {entree.eclairage}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-parchemin-300 pt-3">
                    <span className="inline-flex items-center gap-1.5 text-2xs text-encre-400">
                      <BookOpen className="h-3 w-3 text-or-500" />
                      {entree.reference}
                    </span>
                    {entree.ficheId && (
                      <span
                        className={`inline-flex items-center gap-1 text-2xs font-bold ${
                          ouverte ? 'text-or-700' : 'text-encre-300'
                        }`}
                      >
                        Fiche {entree.ficheId}
                        {ouverte && <ArrowRight className="h-3 w-3" />}
                      </span>
                    )}
                  </div>
                </>
              );

              return ouverte && entree.ficheId ? (
                <Link
                  key={entree.theme}
                  href={`/fiches/${entree.ficheId}`}
                  className="parchment-card rounded-3xl p-5 transition-all hover:-translate-y-0.5"
                >
                  {contenu}
                </Link>
              ) : (
                <div
                  key={entree.theme}
                  className="rounded-3xl border border-parchemin-300 bg-parchemin-50/70 p-5 opacity-70"
                >
                  {contenu}
                </div>
              );
            })}
          </div>
        )}

        {entrees !== null && filtrees.length === 0 && (
          <p className="mt-10 text-center text-sm text-encre-400">
            Rien à ce mot-là dans l&apos;index. Essayez le moteur de recherche du sentier.
          </p>
        )}
      </div>
    </div>
  );
}
