'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Quote } from 'lucide-react';
import { chargerLivret, type Bloc, type Livret } from '@/lib/livret';
import { useAuth } from '@/lib/AuthContext';

/**
 * Le mode d'emploi du livret, sur une page à part liée depuis l'accueil.
 *
 * Il dormait dans un onglet des ressources, alors qu'il dit l'essentiel à
 * qui découvre le parcours. La section « La version en ligne » a été retirée
 * du livret numérique : elle renvoyait vers un site qui n'existe plus et
 * annonçait une version audio désormais là.
 */

/** Ce que certaines sections annoncent se trouve maintenant dans l'application. */
const PROLONGEMENTS: Record<string, { href: string; label: string }> = {
  "La bibliographie et l'index": { href: '/ressources?onglet=bibliographie', label: 'Voir la bibliographie' },
  'Les retours et besoins': { href: '/contact', label: 'Nous écrire' },
};

export default function ModeEmploiPage() {
  // Sans compte, la barre du haut est fixe : on lui laisse sa place.
  const { user } = useAuth();
  const [livret, setLivret] = useState<Livret | null>(null);

  useEffect(() => {
    void chargerLivret().then(setLivret);
  }, []);

  return (
    <div className={`table-travail min-h-screen pb-20 ${user ? 'pt-6' : 'pt-24'}`}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="manuscrit mb-2 text-xl text-or-800">Tirer le meilleur profit du parcours</p>
          <h1 className="font-serif text-3xl font-bold text-encre-950 sm:text-4xl">Mode d’emploi</h1>
        </div>

        <div className="feuille relative space-y-8 rounded-3xl border border-parchemin-300 p-6 shadow-md sm:p-10">
          <span className="ruban -top-2.5 right-8 rotate-1 rounded-[2px]" />

          <blockquote className="rounded-3xl border border-or-300 bg-amber-50/70 p-6 text-center shadow-xs">
            <Quote className="mx-auto h-5 w-5 text-or-600" strokeWidth={1.5} />
            <p className="mt-3 font-serif text-base italic leading-relaxed text-encre-900">
              « Notre but est de placer tout homme en présence de Dieu et d&apos;amener les
              chrétiens à leur pleine maturité spirituelle par une communion vivante avec le
              Christ. »
            </p>
            <span className="manuscrit mt-2 block text-base text-or-800">Colossiens 1:28</span>
          </blockquote>

          {!livret ? (
            <p className="animate-pulse py-10 text-center font-serif text-sm text-encre-400">
              Ouverture du livret…
            </p>
          ) : (
            livret.presentation
              .map((section, index) => {
                const suite = section.titre ? PROLONGEMENTS[section.titre] : undefined;
                return (
                  <section key={index} className="pt-2">
                    {section.titre && (
                      <h2 className="mb-4 flex items-baseline gap-3 border-b border-parchemin-200 pb-2 font-serif text-xl font-bold text-encre-950">
                        <span className="font-sans text-sm text-or-600">•</span>
                        {section.titre}
                      </h2>
                    )}
                    <div className="prose-livret text-sm leading-relaxed text-encre-700">
                      {section.blocs.map((bloc, i) => (
                        <RenduBloc key={i} bloc={bloc} />
                      ))}
                    </div>
                    {suite && (
                      <Link
                        href={suite.href}
                        className="mt-1 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-or-800 underline underline-offset-4"
                      >
                        {suite.label} <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </section>
                );
              })
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/fiches" className="bouton-or inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-bold">
            Voir les vingt fiches <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/ressources?onglet=livret"
            className="inline-flex min-h-12 items-center rounded-full border border-parchemin-400 bg-white px-6 text-sm font-bold text-encre-800"
          >
            Télécharger le livret complet
          </Link>
        </div>
      </div>
    </div>
  );
}

function RenduBloc({ bloc }: { bloc: Bloc }) {
  switch (bloc.type) {
    case 'sous-titre':
      return <h4>{bloc.texte}</h4>;
    case 'citation':
      return <blockquote>{bloc.texte}</blockquote>;
    case 'encadre':
      return (
        <div className="my-4 rounded-2xl border border-or-300 bg-amber-50/70 p-4 text-sm font-medium text-encre-900">
          {bloc.texte}
        </div>
      );
    case 'liste': {
      const items = bloc.texte
        .split(/(?=^|\s)-\s+/)
        .map((item) => item.trim())
        .filter(Boolean);
      return (
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    }
    default:
      return <p>{bloc.texte}</p>;
  }
}
