'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookMarked, Search, ExternalLink, Bookmark, Sparkles } from 'lucide-react';

interface BookReference {
  author: string;
  titles: string[];
  fiches: number[];
  description: string;
}

const BIBLIOGRAPHIE: BookReference[] = [
  {
    author: 'Neil Anderson',
    titles: ['Une Nouvelle identité pour une nouvelle vie'],
    fiches: [5, 6, 7, 9, 14],
    description: 'Ouvrage fondamental sur la délivrance des mensonges et la marche concrète dans notre identité d\'enfant de Dieu racheté.'
  },
  {
    author: 'Derek Prince',
    titles: [
      'L\'échange divin',
      'Comment passer de la malédiction à la bénédiction',
      'Qui est le Saint-Esprit ?',
      'Le Saint-Esprit, oui mais...',
      'Les dons de l\'Esprit, le fruit de l\'Esprit'
    ],
    fiches: [5, 8, 9, 10, 11],
    description: 'Enseignements bibliques clairs et pratiques sur la puissance de la croix, la délivrance, les malédictions brisées et le ministère de l\'Esprit.'
  },
  {
    author: 'Watchman Nee',
    titles: ['Être assis, marcher, tenir ferme'],
    fiches: [5, 6, 9, 11, 16],
    description: 'Commentaire classique et spirituellement puissant sur l\'épître aux Éphésiens : notre position en Christ, notre marche et le combat de la foi.'
  },
  {
    author: 'Andrew Wommack',
    titles: [
      'La vraie nature de Dieu',
      'L\'équilibre entre la grâce et la foi',
      'Esprit, âme et corps'
    ],
    fiches: [3, 16, 18, 20],
    description: 'Comprendre la bonté absolue de Dieu, l\'harmonie entre foi et grâce, et la structure tripartite de l\'être humain régénéré.'
  },
  {
    author: 'Tim Chester & Steve Timmis',
    titles: ['Total Church'],
    fiches: [13, 14, 15],
    description: 'Une vision renouvelée de l\'Église centrée sur l\'Évangile et vécue au quotidien en communauté relationnelle.'
  },
  {
    author: 'Colin Dye',
    titles: ['Vivre libre'],
    fiches: [5, 6, 7, 8],
    description: 'Guide pratique pour expérimenter la libération des blessures du passé, du rejet, et des forteresses de pensées.'
  },
  {
    author: 'Robert Heidler',
    titles: ['L\'Église messianique se lève'],
    fiches: [18, 19, 20],
    description: 'Redécouverte des racines hébraïques de la foi, de l\'alliance d\'Israël et du dessein de Dieu pour les temps de la fin.'
  },
  {
    author: 'Steve McVey',
    titles: ['Le Règne de la Grâce'],
    fiches: [4],
    description: 'Sortir définitivement de la religion légaliste de la culpabilité pour se reposer pleinement dans l\'amour inconditionnel.'
  },
  {
    author: 'John Bevere',
    titles: ['Briser l\'intimidation', 'Approchez-vous de lui'],
    fiches: [1, 7, 9, 11],
    description: 'Vaincre la peur des hommes, récupérer son autorité spirituelle et développer une sainte intimité avec Dieu.'
  },
  {
    author: 'Bill Johnson',
    titles: ['Quand le ciel envahit la terre'],
    fiches: [11, 12, 14],
    description: 'Vivre le surnaturel chrétien au quotidien, les miracles et la manifestation du Royaume de Dieu sur terre.'
  },
  {
    author: 'Nicolas & Lena Venditti',
    titles: ['INSTE — Institut Théologique'],
    fiches: [16, 17, 20],
    description: 'Méthode d\'étude biblique interactive et de formation de disciples en petits groupes.'
  },
  {
    author: 'John Eldredge',
    titles: ['Les trésors du cœur'],
    fiches: [4],
    description: 'Retrouver les désirs profonds de son cœur que Dieu y a placés et vivre une foi passionnée.'
  },
  {
    author: 'Terry Virgo',
    titles: ['L\'extravagante grâce de Dieu'],
    fiches: [4],
    description: 'La révélation libératrice de la grâce qui transforme le devoir religieux en adoration joyeuse.'
  },
  {
    author: 'Kenneth E. Hagin',
    titles: ['La nouvelle naissance'],
    fiches: [3],
    description: 'Ce qui se passe réellement dans l\'esprit humain lors de la régénération et de la rédemption.'
  },
  {
    author: 'Dany Hameau',
    titles: ['Vue sur l\'enfer'],
    fiches: [20],
    description: 'Étude biblique rigoureuse sur les fins dernières, le jugement et l\'espérance éternelle.'
  }
];

export default function RessourcesPage() {
  const [search, setSearch] = useState('');

  const filteredBooks = BIBLIOGRAPHIE.filter(item => {
    const matchesAuthor = item.author.toLowerCase().includes(search.toLowerCase());
    const matchesTitle = item.titles.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesDesc = item.description.toLowerCase().includes(search.toLowerCase());
    return matchesAuthor || matchesTitle || matchesDesc;
  });

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 text-xs uppercase tracking-wider font-semibold px-3 py-1 rounded-full mb-3">
            <BookMarked className="w-3.5 h-3.5" />
            Bibliographie du Livret (p. 164)
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 mb-3">
            Ressources & Ouvrages Recommandés
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Explorez les livres et auteurs précieux qui ont enrichi la conception de ce parcours pour approfondir votre marche spirituelle.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 max-w-xl mx-auto relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-7 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un auteur ou un livre (ex: Derek Prince, Watchman Nee...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-sm"
          />
        </div>

        {/* Book Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredBooks.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-indigo-600 font-serif font-bold text-lg mb-2">
                  <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500" />
                  {item.author}
                </div>

                <div className="space-y-1 mb-3">
                  {item.titles.map((title, ti) => (
                    <h3 key={ti} className="font-semibold text-slate-800 text-base italic">
                      • {title}
                    </h3>
                  ))}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-400 font-medium">Fiches associées :</span>
                  {item.fiches.map(fId => (
                    <Link
                      key={fId}
                      href={`/fiches/${fId}`}
                      className="text-xs bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded hover:bg-amber-100 transition-colors"
                    >
                      Fiche {fId}
                    </Link>
                  ))}
                </div>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(item.author + ' ' + item.titles[0])}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                >
                  Rechercher <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Source Livret Footer */}
        <div className="mt-12 text-center p-6 bg-amber-50/60 rounded-2xl border border-amber-200/60 max-w-2xl mx-auto">
          <Sparkles className="w-6 h-6 text-amber-600 mx-auto mb-2" />
          <p className="text-sm text-amber-900 font-medium mb-1">
            Parcours des Fondements — moneglisepreferee.net
          </p>
          <p className="text-xs text-amber-800/80">
            &quot;Mais aussi et avant tout, le Saint-Esprit, qui nous a inspirés et permis d&apos;aller plus loin dans la compréhension des Écritures et la conception de ce parcours.&quot; (p. 164)
          </p>
        </div>

      </div>
    </div>
  );
}
