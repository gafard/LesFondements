'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Tag, BookOpen, ArrowRight, Sparkles } from 'lucide-react';

interface IndexItem {
  theme: string;
  pages: string;
  ficheId: number;
  description: string;
  category: 'fondements' | 'identite' | 'saint-esprit' | 'vie-chretienne' | 'eglise' | 'eschatologie';
}

const INDEX_THEMATIQUE: IndexItem[] = [
  { theme: 'Anges', pages: 'p. 123', ficheId: 16, category: 'vie-chretienne', description: 'Le rôle et le ministère des anges dans le plan de Dieu et la prière.' },
  { theme: 'Autorité, responsables, anciens', pages: 'p. 113-115 ; p. 82-83', ficheId: 15, category: 'eglise', description: 'L\'exercice du leadership, la soumission mutuelle et les ministères dans l\'Église locale.' },
  { theme: 'Baptême dans l\'eau & Saint-Esprit', pages: 'p. 24-25 ; p. 75-77', ficheId: 3, category: 'fondements', description: 'Signification de l\'immersion, engagement de la foi, et revêtement de puissance.' },
  { theme: 'Délivrance', pages: 'p. 61-63', ficheId: 8, category: 'identite', description: 'Briser les liens, malédictions, esprits impurs et marcher dans la pleine liberté de Christ.' },
  { theme: 'Dîme, Sabbat, Fêtes', pages: 'p. 139-141', ficheId: 18, category: 'fondements', description: 'Comprendre ces pratiques sous la Nouvelle Alliance par rapport à la Loi de Moïse.' },
  { theme: 'Dualisme (pensée grecque)', pages: 'p. 146', ficheId: 19, category: 'vie-chretienne', description: 'Distinguer la vision biblique unifiée de l\'homme et du monde de la philosophie grecque.' },
  { theme: 'Échange divin (guérison, bénédiction)', pages: 'p. 38', ficheId: 5, category: 'identite', description: 'Ce que Jésus a pris à la croix (péché, malédiction, maladie) et ce qu\'Il nous a donné.' },
  { theme: 'Enfer et Jugement', pages: 'p. 153', ficheId: 20, category: 'eschatologie', description: 'Ce que disent les Écritures sur la séparation éternelle et la justice divine.' },
  { theme: 'Foi', pages: 'p. 19', ficheId: 3, category: 'fondements', description: 'Définition, confiance totale en Dieu, repos et réaction positive à la grâce.' },
  { theme: 'Forteresses spirituelles', pages: 'p. 54', ficheId: 7, category: 'identite', description: 'Identifier et abattre les raisonnements et mensonges ancrés dans nos pensées.' },
  { theme: 'Intimidation, accusation, tentation', pages: 'p. 55', ficheId: 7, category: 'identite', description: 'Résister aux tactiques de l\'ennemi et affirmer notre autorité spirituelle.' },
  { theme: 'Jeûne', pages: 'p. 123', ficheId: 16, category: 'vie-chretienne', description: 'Discipline spirituelle pour s\'humilier, s\'approcher de Dieu et intensifier la prière.' },
  { theme: 'Légalisme et propre justice', pages: 'p. 27 ; p. 139-140', ficheId: 4, category: 'fondements', description: 'Sortir du piège de la performance religieuse pour vivre du don gratuit de Dieu.' },
  { theme: 'Loi (Torah)', pages: 'p. 137 ; p. 13', ficheId: 2, category: 'fondements', description: 'Son but : révéler le péché et conduire à Christ comme notre seul Sauveur.' },
  { theme: 'Louange & Adoration', pages: 'p. 121', ficheId: 16, category: 'vie-chretienne', description: 'Entrer dans la présence de Dieu, proclamer sa grandeur et l\'adorer en esprit et en vérité.' },
  { theme: 'Marche par l\'Esprit', pages: 'p. 49-50 ; p. 70', ficheId: 6, category: 'saint-esprit', description: 'Dépendance quotidienne au Saint-Esprit pour manifester le fruit de l\'Esprit.' },
  { theme: 'Nouvelle naissance', pages: 'p. 20', ficheId: 3, category: 'fondements', description: 'Régénération spirituelle, devenir enfant de Dieu par la repentance et la foi.' },
  { theme: 'Obéissance d\'amour', pages: 'p. 30 ; p. 97-98 ; p. 138-139', ficheId: 4, category: 'vie-chretienne', description: 'Une obéissance motivée par la gratitude et l\'amour, et non par la contrainte légaliste.' },
  { theme: 'Pardon accordé & reçu', pages: 'p. 56', ficheId: 7, category: 'identite', description: 'Libération émotionnelle et spirituelle par le pardon inconditionnel.' },
  { theme: 'Repas du Seigneur (Cène / Sainte Communion)', pages: 'p. 113', ficheId: 15, category: 'eglise', description: 'Signification profonde de la communion fraternelle et du souvenir du sacrifice.' },
  { theme: 'Repos en Christ', pages: 'p. 32 ; p. 37-38', ficheId: 5, category: 'identite', description: 'Cesser nos propres efforts d\'auto-justification et entrer dans le repos de Dieu.' },
  { theme: 'Saint & Sanctification', pages: 'p. 37 ; p. 47-48 ; p. 89', ficheId: 5, category: 'identite', description: 'Notre statut parfait en Christ vs le processus pratique de mise à part.' },
  { theme: 'Salut par grâce', pages: 'p. 14 ; p. 155-156', ficheId: 2, category: 'fondements', description: 'Le plan rédempteur accompli une fois pour toutes par Jésus-Christ.' },
  { theme: 'Souffrance & Épreuves', pages: 'p. 31 ; p. 92', ficheId: 4, category: 'vie-chretienne', description: 'Comprendre l\'utilité des épreuves pour affermir la foi et forger le caractère.' },
  { theme: 'Trinité (Père, Fils, Esprit)', pages: 'p. 6-7 ; p. 113', ficheId: 1, category: 'fondements', description: 'Un seul Dieu en trois personnes : unité, communion parfaite et amour éternel.' },
  { theme: 'Victoire & Autorité en Christ', pages: 'p. 123 ; p. 61', ficheId: 16, category: 'identite', description: 'Notre position assise avec Christ dans les lieux célestes dominant toute puissance adverse.' }
];

const CATEGORIES = [
  { id: 'all', label: 'Tous les thèmes' },
  { id: 'fondements', label: 'Fondements' },
  { id: 'identite', label: 'Identité en Christ' },
  { id: 'saint-esprit', label: 'Saint-Esprit' },
  { id: 'vie-chretienne', label: 'Vie Chrétienne' },
  { id: 'eglise', label: 'Église & Groupe' },
  { id: 'eschatologie', label: 'Fins dernières' },
];

export default function IndexThematiquePage() {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  const filteredItems = INDEX_THEMATIQUE.filter(item => {
    const matchesSearch = item.theme.toLowerCase().includes(search.toLowerCase()) ||
                          item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'all' || item.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 text-xs uppercase tracking-wider font-semibold px-3 py-1 rounded-full mb-3">
            <Tag className="w-3.5 h-3.5" />
            Index officiel du Livret (p. 163)
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 mb-3">
            Index Thématique Interactif
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Retrouvez rapidement chaque notion, doctrine ou sujet clé abordé dans les 20 fiches du parcours.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un thème (ex: Grâce, Pardon, Délivrance, Baptême...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCat === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {filteredItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif font-bold text-lg text-slate-900">{item.theme}</h3>
                  <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                    {item.pages}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  Fiche {item.ficheId}
                </span>
                <Link
                  href={`/fiches/${item.ficheId}`}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 group"
                >
                  Étudier cette fiche
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Aucun thème trouvé pour votre recherche.</p>
            <button
              onClick={() => { setSearch(''); setSelectedCat('all'); }}
              className="text-sm text-indigo-600 font-bold mt-2 hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
