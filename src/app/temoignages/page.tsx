'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Sparkles, Heart, Plus, User } from 'lucide-react';

interface Testimony {
  id: string;
  author: string;
  ficheTheme: string;
  text: string;
  date: string;
  likes: number;
}

export default function TemoignagesPage() {
  const { user } = useAuth();
  const [testimonies, setTestimonies] = useState<Testimony[]>([
    {
      id: '1',
      author: 'Élodie G.',
      ficheTheme: 'Fiche 4 — La Grâce',
      text: 'Pendant des années, je vivais dans la peur de ne pas en faire assez pour Dieu. Méditer sur la Grâce m\'a délivrée du perfectionnisme religieux. Aujourd\'hui je sers par amour et non par devoir !',
      date: 'Il y a 3 jours',
      likes: 12
    },
    {
      id: '2',
      author: 'Jean-Marc D.',
      ficheTheme: 'Fiche 7 & 8 — Vivre libre',
      text: 'Le temps de prière et d\'aide personnelle après la fiche 8 a été un tournant. J\'ai pu pardonner de tout mon cœur les abus de mon enfance. La paix qui a inondé mon être est indescriptible.',
      date: 'La semaine dernière',
      likes: 19
    },
    {
      id: '3',
      author: 'Nathalie P.',
      ficheTheme: 'Fiche 1 — Connaître Dieu',
      text: 'La lettre d\'Amour du Père m\'a bouleversée aux larmes. J\'avais toujours vu Dieu comme un juge sévère. Découvrir qu\'Il est un Père tendre a guéri mon cœur.',
      date: 'Il y a 2 semaines',
      likes: 24
    }
  ]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newFicheTheme, setNewFicheTheme] = useState('Fiche 1 — Connaître Dieu');
  const [newText, setNewText] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    const item: Testimony = {
      id: Date.now().toString(),
      author: user?.displayName || 'Membre du parcours',
      ficheTheme: newFicheTheme,
      text: newText,
      date: 'À l\'instant',
      likes: 1
    };
    setTestimonies([item, ...testimonies]);
    setNewText('');
    setIsFormOpen(false);
  };

  const handleLike = (id: string) => {
    setTestimonies(testimonies.map(t => t.id === id ? { ...t, likes: t.likes + 1 } : t));
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Témoignages & Victoires
            </div>
            <h1 className="text-3xl font-bold font-serif text-slate-900">
              Ce que Dieu accomplit à travers ce parcours
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Encouragez la communauté en partageant comment les fiches transforment votre vie.
            </p>
          </div>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-sm flex items-center gap-2 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Partager mon témoignage
          </button>
        </div>

        {/* New Testimony Form */}
        {isFormOpen && (
          <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 animate-fade-in">
            <h3 className="font-serif font-bold text-base text-slate-900 mb-3">Rédiger votre témoignage</h3>
            <div className="mb-3">
              <label className="text-xs text-slate-500 font-semibold block mb-1">Fiche ou thème concerné :</label>
              <select
                value={newFicheTheme}
                onChange={(e) => setNewFicheTheme(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
              >
                <option>Fiche 1 — Connaître Dieu</option>
                <option>Fiche 2 — Le péché, le salut</option>
                <option>Fiche 3 — Devenir enfant de Dieu</option>
                <option>Fiche 4 — La Grâce</option>
                <option>Fiche 5 — Mon identité en Christ</option>
                <option>Fiche 7 & 8 — Vivre libre & délivrance</option>
                <option>Fiche 9-11 — Le Saint-Esprit</option>
                <option>Fiche 16 — La Prière</option>
              </select>
            </div>

            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Racontez comment Dieu a agi dans votre cœur, une révélation reçue, une délivrance..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 min-h-[100px] mb-3"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
              >
                Publier le témoignage
              </button>
            </div>
          </form>
        )}

        {/* Testimonies list */}
        <div className="space-y-4">
          {testimonies.map((t) => (
            <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{t.author}</h4>
                    <span className="text-2xs text-slate-400">{t.date}</span>
                  </div>
                </div>
                <span className="text-2xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {t.ficheTheme}
                </span>
              </div>

              <p className="text-slate-700 text-sm leading-relaxed mb-4 italic font-serif">
                &quot;{t.text}&quot;
              </p>

              <div className="flex justify-end pt-3 border-t border-slate-50">
                <button
                  onClick={() => handleLike(t.id)}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors"
                >
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  Béni par ce témoignage ({t.likes})
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
