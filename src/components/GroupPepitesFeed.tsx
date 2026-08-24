'use client';

import { useState } from 'react';
import { Star, Heart, Plus, Send, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export interface GroupPepite {
  id: string;
  authorName: string;
  ficheId: number;
  reference: string;
  text: string;
  note?: string;
  type: 'grace' | 'identite' | 'promesse' | 'pratique';
  likesCount: number;
  createdAt: string;
}

const TYPE_STYLES = {
  grace: { label: 'Grâce', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  identite: { label: 'Identité en Christ', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  promesse: { label: 'Promesse', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  pratique: { label: 'Mise en pratique', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
};

const INITIAL_PEPITEST: GroupPepite[] = [
  {
    id: '1',
    authorName: 'Sarah M.',
    ficheId: 4,
    reference: 'Éphésiens 2:8-9',
    text: 'La grâce n\'est pas un salaire que l\'on gagne, c\'est un cadeau que l\'on reçoit les mains vides.',
    note: 'Médité pendant la fiche 4 : libération totale du perfectionnisme.',
    type: 'grace',
    likesCount: 8,
    createdAt: 'Hier'
  },
  {
    id: '2',
    authorName: 'David K.',
    ficheId: 5,
    reference: '2 Corinthiens 5:17',
    text: 'Je ne suis plus défini par mes échecs passés. En Christ, je suis une nouvelle créature sainte et juste.',
    note: 'L\'échange divin à la croix a tout changé pour moi.',
    type: 'identite',
    likesCount: 11,
    createdAt: 'Il y a 3 jours'
  },
  {
    id: '3',
    authorName: 'Esther B.',
    ficheId: 1,
    reference: 'Psaume 46:11',
    text: 'Arrêtez, et sachez que je suis Dieu : le lâcher-prise commence quand je reconnais son règne souverain.',
    note: 'Sujet partagé pendant la dernière rencontre de cellule.',
    type: 'promesse',
    likesCount: 6,
    createdAt: 'Cette semaine'
  }
];

export default function GroupPepitesFeed() {
  const { user } = useAuth();
  const [pepites, setPepites] = useState<GroupPepite[]>(INITIAL_PEPITEST);
  const [showModal, setShowModal] = useState(false);

  // New pepite form
  const [reference, setReference] = useState('');
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [ficheId, setFicheId] = useState(2);
  const [type, setType] = useState<'grace' | 'identite' | 'promesse' | 'pratique'>('grace');

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newP: GroupPepite = {
      id: Date.now().toString(),
      authorName: user?.displayName || 'Membre de cellule',
      ficheId,
      reference: reference.trim() || `Fiche ${ficheId}`,
      text,
      note: note.trim() || undefined,
      type,
      likesCount: 1,
      createdAt: 'À l\'instant'
    };

    setPepites([newP, ...pepites]);
    setText('');
    setReference('');
    setNote('');
    setShowModal(false);
  };

  const handleLike = (id: string) => {
    setPepites(pepites.map(p => p.id === id ? { ...p, likesCount: p.likesCount + 1 } : p));
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-slate-900">Pépites & Révélations du Groupe</h3>
            <p className="text-2xs text-slate-500">Les trésors spirituels reçus par les membres au fil des fiches</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-full shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <Plus size={14} /> Partager une pépite
        </button>
      </div>

      {/* Feed list */}
      <div className="grid md:grid-cols-2 gap-4">
        {pepites.map((pepite) => {
          const style = TYPE_STYLES[pepite.type];
          return (
            <div
              key={pepite.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs">{pepite.authorName}</span>
                    <span className="text-2xs text-slate-400">• {pepite.createdAt}</span>
                  </div>
                  <span className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.color}`}>
                    {style.label}
                  </span>
                </div>

                <p className="text-xs font-bold text-amber-800 font-serif mb-1">
                  {pepite.reference}
                </p>

                <p className="text-sm font-serif italic text-slate-800 leading-relaxed mb-3">
                  « {pepite.text} »
                </p>

                {pepite.note && (
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 mb-3 border border-slate-100">
                    💡 <strong>Réflexion :</strong> {pepite.note}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-2xs text-slate-400 font-medium">
                  Fiche {pepite.ficheId}
                </span>

                <button
                  onClick={() => handleLike(pepite.id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
                >
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>{pepite.likesCount}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500/20" />
              <h3 className="font-serif font-bold text-lg text-slate-900">Déposer une pépite</h3>
            </div>

            <form onSubmit={handleShare} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Catégorie</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as GroupPepite['type'])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                  >
                    <option value="grace">Grâce</option>
                    <option value="identite">Identité en Christ</option>
                    <option value="promesse">Promesse</option>
                    <option value="pratique">Mise en pratique</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Fiche</label>
                  <select
                    value={ficheId}
                    onChange={(e) => setFicheId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(n => (
                      <option key={n} value={n}>Fiche {n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Verset ou passage de référence</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: Romains 8:1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">La phrase / pépite reçue *</label>
                <textarea
                  required
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ce que Dieu vous a révélé de percutant..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase text-slate-500 mb-1">Commentaire personnel (optionnel)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: Appliqué cette semaine au travail"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Send size={13} /> Partager au groupe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
