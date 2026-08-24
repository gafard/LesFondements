'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookMarked, HeartHandshake, Quote, ScrollText } from 'lucide-react';
import { chargerLivret, type Bloc, type Livret } from '@/lib/livret';

type Onglet = 'presentation' | 'prendre-soin' | 'bibliographie';

/**
 * Notes de lecture rédigées pour l'application. Le livret se contente de
 * citer les ouvrages ; ces quelques lignes disent ce qu'on y trouve.
 */
const NOTES_LECTURE: Record<string, string> = {
  'Neil Anderson':
    "Sur la délivrance des mensonges intérieurs et la marche concrète dans l'identité d'enfant de Dieu.",
  'Derek Prince':
    "Des enseignements clairs et pratiques : la puissance de la croix, les malédictions brisées, le ministère de l'Esprit.",
  'Watchman Nee':
    "Un commentaire classique de l'épître aux Éphésiens : la position en Christ, la marche, le combat.",
  'Andrew Wommack':
    "La bonté de Dieu, l'équilibre entre la foi et la grâce, et la constitution de l'être humain.",
  'Tm Chester, Steve Timmis':
    "Une vision de l'Église centrée sur l'Évangile et vécue au quotidien, en communauté.",
  'Colin Dye':
    'Un guide pratique pour sortir des blessures du passé, du rejet et des forteresses de pensée.',
  'Robert Heidler':
    "Les racines hébraïques de la foi, l'alliance avec Israël et le dessein de Dieu pour la fin.",
  'Steve McVey':
    "Sortir de la religion de la culpabilité pour se reposer dans un amour qui ne se mérite pas.",
  'John Bevere': "Vaincre la peur des hommes et retrouver une sainte intimité avec Dieu.",
  'Bill Johnson': 'Le surnaturel chrétien au quotidien et la manifestation du Royaume.',
  'Nicolas et Lena Venditti':
    "Une méthode d'étude biblique interactive, pensée pour les petits groupes.",
  'John Eldredge': 'Retrouver les désirs profonds que Dieu a placés dans le cœur.',
  'Terry Virgo': 'La grâce qui transforme le devoir religieux en adoration.',
  'Kenneth E. Hagin': "Ce qui se passe réellement dans l'esprit humain à la nouvelle naissance.",
  'Dany Hameau': 'Une étude rigoureuse sur les fins dernières, le jugement et l’espérance.',
};

export default function RessourcesPage() {
  const [livret, setLivret] = useState<Livret | null>(null);
  const [onglet, setOnglet] = useState<Onglet>('presentation');

  useEffect(() => {
    void chargerLivret().then(setLivret);
  }, []);

  const onglets: { id: Onglet; label: string; icon: typeof ScrollText }[] = [
    { id: 'presentation', label: 'Le mode d’emploi', icon: ScrollText },
    { id: 'prendre-soin', label: 'Prendre soin les uns des autres', icon: HeartHandshake },
    { id: 'bibliographie', label: 'Les ouvrages cités', icon: BookMarked },
  ];

  return (
    <div className="min-h-screen bg-parchemin-100 pb-10 pt-6">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 font-serif italic text-amber-800 text-xs sm:text-sm">
            Documentation & ressources complémentaires
          </p>
          <h1 className="font-serif text-3xl font-bold text-encre-950 sm:text-4xl">
            Autour du parcours
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-encre-600 sm:text-sm">
            La présentation qui ouvre le livret, l&apos;annexe sur le soin les uns des autres, et
            les ouvrages dont il est tiré.
          </p>
        </div>

        <div className="mb-8 flex gap-1.5 overflow-x-auto border-b border-parchemin-300 pb-px">
          {onglets.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setOnglet(tab.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-2xs font-bold transition-colors ${
                onglet === tab.id
                  ? 'border-or-500 text-or-700'
                  : 'border-transparent text-encre-400 hover:text-encre-700'
              }`}
            >
              <tab.icon className="h-4 w-4" strokeWidth={1.75} />
              {tab.label}
            </button>
          ))}
        </div>

        {!livret ? (
          <p className="animate-pulse text-center font-serif text-sm text-encre-400">
            Ouverture du livret…
          </p>
        ) : onglet === 'presentation' ? (
          <div className="space-y-8">
            <blockquote className="rounded-4xl border border-encre-200 bg-encre-50 p-6 text-center">
              <Quote className="mx-auto h-5 w-5 text-or-500" strokeWidth={1.5} />
              <p className="mt-3 font-serif text-base italic leading-relaxed text-encre-800">
                Notre but est de placer tout homme en présence de Dieu et d&apos;amener les
                chrétiens à leur pleine maturité spirituelle par une communion vivante avec le
                Christ.
              </p>
              <span className="mt-2 block text-2xs text-encre-400">Colossiens 1:28</span>
            </blockquote>

            {livret.presentation.map((section, index) => (
              <section key={index}>
                {section.titre && (
                  <h2 className="mb-4 flex items-baseline gap-3 font-serif text-xl font-bold text-encre-950">
                    <span className="text-sm text-or-500">•</span>
                    {section.titre}
                  </h2>
                )}
                <div className="prose-livret text-sm text-encre-700">
                  {section.blocs.map((bloc, i) => (
                    <RenduBloc key={i} bloc={bloc} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : onglet === 'prendre-soin' ? (
          <div className="space-y-8">
            <div className="rounded-3xl border border-or-200 bg-or-50 p-5">
              <p className="text-xs leading-relaxed text-or-900/85">
                Cette annexe accompagne les fiches 7, 8 et 15. Le livret la donne aux responsables
                avant les temps de prière personnels — mais elle concerne tout le groupe.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[7, 8, 15].map((id) => (
                  <Link
                    key={id}
                    href={`/fiches/${id}`}
                    className="rounded-full bg-white px-3 py-1.5 text-2xs font-bold text-or-700 transition-colors hover:bg-or-100"
                  >
                    Fiche {id}
                  </Link>
                ))}
              </div>
            </div>

            {livret.annexeTransversale.sections.map((section, index) => (
              <section key={index}>
                {section.titre && (
                  <h2 className="mb-4 flex items-baseline gap-3 font-serif text-xl font-bold text-encre-950">
                    <span className="text-sm text-or-500">•</span>
                    {section.titre}
                  </h2>
                )}
                <div className="prose-livret text-sm text-encre-700">
                  {section.blocs.map((bloc, i) => (
                    <RenduBloc key={i} bloc={bloc} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {livret.bibliographie.map((reference, index) => (
              <article
                key={index}
                className="rounded-3xl border border-parchemin-400 bg-white p-5 shadow-2xs"
              >
                {reference.auteur && (
                  <h2 className="font-serif text-base font-bold text-encre-950">
                    {reference.auteur}
                  </h2>
                )}
                <p className="mt-1 text-sm leading-relaxed text-encre-700">{reference.ouvrages}</p>

                {reference.auteur && NOTES_LECTURE[reference.auteur] && (
                  <p className="mt-2 text-2xs leading-relaxed text-encre-500">
                    {NOTES_LECTURE[reference.auteur]}
                  </p>
                )}

                {reference.fiches.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-parchemin-300 pt-3">
                    {reference.fiches.map((id) => (
                      <Link
                        key={id}
                        href={`/fiches/${id}`}
                        className="rounded-full bg-parchemin-100 px-2.5 py-1 text-2xs font-bold text-encre-600 transition-colors hover:bg-or-100 hover:text-or-700"
                      >
                        Fiche {id}
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            ))}

            <p className="rounded-3xl bg-parchemin-200/60 px-5 py-4 text-2xs leading-relaxed text-encre-500">
              Le livret est librement téléchargeable sur{' '}
              <span className="font-bold text-encre-700">moneglisepreferee.net</span>. Les versets
              y sont tirés de la Bible du Semeur, sauf mention contraire.
            </p>
          </div>
        )}
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
      return <div className="encadre my-4 text-sm text-encre-800">{bloc.texte}</div>;
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
    case 'aparte':
      return (
        <p className="my-3 rounded-xl border border-or-200 bg-or-50 px-4 py-2.5 text-xs italic text-or-800">
          {bloc.texte.replace(/^>\s*/, '')}
        </p>
      );
    default:
      return <p>{bloc.texte}</p>;
  }
}
