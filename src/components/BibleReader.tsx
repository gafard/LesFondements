'use client';

import { useState } from 'react';
import { BookOpen, Search, X, ExternalLink } from 'lucide-react';

const COMMON_PASSAGES: Record<string, { ref: string; text: string }> = {
  'Jn 3:16': { ref: 'Jean 3:16', text: 'Car Dieu a tant aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu\'il ait la vie éternelle.' },
  'Ep 2:8-9': { ref: 'Éphésiens 2:8-9', text: 'Car c\'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c\'est le don de Dieu. Ce n\'est point par les œuvres, afin que personne ne se glorifie.' },
  'Rm 8:1': { ref: 'Romains 8:1', text: 'Il n\'y a donc maintenant aucune condamnation pour ceux qui sont en Jésus-Christ.' },
  'Rm 5:8': { ref: 'Romains 5:8', text: 'Mais Dieu prouve son amour envers nous, en ce que, lorsque nous étions encore des pécheurs, Christ est mort pour nous.' },
  '2 Co 5:17': { ref: '2 Corinthiens 5:17', text: 'Si quelqu\'un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées; voici, toutes choses sont devenues nouvelles.' },
  'Ps 23:1': { ref: 'Psaume 23:1', text: 'L\'Éternel est mon berger : je ne manquerai de rien.' },
  'Jn 14:6': { ref: 'Jean 14:6', text: 'Jésus lui dit : Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi.' },
  'Pr 3:5-6': { ref: 'Proverbes 3:5-6', text: 'Confie-toi en l\'Éternel de tout ton cœur, et ne t\'appuie pas sur ta sagesse; reconnais-le dans toutes tes voies, et il aplanira tes sentiers.' }
};

export default function BibleReader() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedPassage, setSelectedPassage] = useState<{ ref: string; text: string } | null>(COMMON_PASSAGES['Jn 3:16']);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Direct lookup in common passages or open online Bible
    const matched = Object.entries(COMMON_PASSAGES).find(([key, val]) =>
      key.toLowerCase().includes(query.toLowerCase()) ||
      val.ref.toLowerCase().includes(query.toLowerCase())
    );

    if (matched) {
      setSelectedPassage(matched[1]);
    } else {
      setSelectedPassage({
        ref: query,
        text: `Consultez ce passage complet directement dans la Bible en ligne (Bible du Semeur / Segond 21).`
      });
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-xs font-bold"
        aria-label="Ouvrir le lecteur biblique"
      >
        <BookOpen className="w-5 h-5" />
        <span className="hidden sm:inline">Lecteur Biblique</span>
      </button>

      {/* Slide-over / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-serif font-bold text-lg text-slate-900">Lecteur Biblique Rapide</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Entrez un verset (ex: Jn 3:16, Ep 2:8, Ps 23...)"
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </form>

              {/* Quick links */}
              <div className="mb-6">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Passages fréquents du parcours
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(COMMON_PASSAGES).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setSelectedPassage(v)}
                      className="text-2xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-md transition-colors"
                    >
                      {v.ref}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Verse */}
              {selectedPassage && (
                <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-5 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-amber-900 font-serif">{selectedPassage.ref}</span>
                    <span className="text-2xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Bible du Semeur</span>
                  </div>
                  <p className="text-sm font-serif italic text-slate-800 leading-relaxed">
                    &quot;{selectedPassage.text}&quot;
                  </p>
                </div>
              )}
            </div>

            {/* External Links */}
            <div className="pt-4 border-t border-slate-100">
              <a
                href="https://www.bible.com/fr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                Ouvrir Bible.com (YouVersion) <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
