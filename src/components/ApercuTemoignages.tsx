'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mic, Quote } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { abonnerTemoignages, type TemoignageItem } from '@/lib/temoignagesStore';

/**
 * Les témoignages, en bas de l'accueil : ce que Dieu a fait chez d'autres.
 * On ne montre que des témoignages réellement partagés — jamais les
 * exemples de démonstration du tableau.
 */
export default function ApercuTemoignages() {
  const { user } = useAuth();
  const [derniers, setDerniers] = useState<TemoignageItem[]>([]);

  useEffect(
    () =>
      abonnerTemoignages(user?.uid, (liste) =>
        setDerniers(liste.filter((t) => !t.id.startsWith('tem_') && t.texte.trim()).slice(0, 3))
      ),
    [user?.uid]
  );

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8" aria-labelledby="titre-temoignages">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="manuscrit mb-2 text-xl text-or-800">Ce que Dieu a fait</p>
        <h2 id="titre-temoignages" className="font-serif text-3xl font-bold text-encre-950 sm:text-4xl">
          Témoignages
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-encre-700">
          Écrits ou enregistrés à voix haute par celles et ceux qui vivent le parcours.
        </p>
      </div>

      {derniers.length > 0 && (
        <div className="grid gap-5 md:grid-cols-3">
          {derniers.map((temoignage, index) => (
            <figure
              key={temoignage.id}
              className={`feuille pose-${(index % 3) + 1} relative rounded-3xl border border-parchemin-300 p-6 shadow-sm`}
            >
              <Quote className="h-5 w-5 text-or-600" aria-hidden="true" />
              <blockquote className="mt-3 line-clamp-5 font-serif text-sm italic leading-relaxed text-encre-900">
                {temoignage.texte}
              </blockquote>
              <figcaption className="mt-4 flex items-center justify-between gap-2 text-2xs font-bold text-encre-600">
                <span>
                  {temoignage.auteur}
                  {temoignage.ficheId ? ` · fiche ${temoignage.ficheId}` : ''}
                </span>
                {temoignage.audioUrl && (
                  <span className="inline-flex items-center gap-1 text-or-800">
                    <Mic className="h-3 w-3" aria-hidden="true" /> Audio
                  </span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/temoignages"
          className="bouton-or inline-flex min-h-12 items-center gap-2 rounded-full px-7 text-sm font-bold shadow-md"
        >
          {derniers.length > 0 ? 'Lire et écouter tous les témoignages' : 'Lire, écouter ou partager un témoignage'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
