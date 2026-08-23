'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getJournalEntries, addJournalEntry, deleteJournalEntry, timestampToDate } from '@/lib/firestore';
import type { JournalEntry } from '@/lib/firestore';
import { PenLine, Plus, Trash2, Calendar } from 'lucide-react';

export default function Journal() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const refreshEntries = async () => {
    if (user) {
      const e = await getJournalEntries(user.uid);
      setEntries(e);
    }
  };

  useEffect(() => {
    if (!user) return;
    let active = true;
    void getJournalEntries(user.uid).then((journalEntries) => {
      if (active) setEntries(journalEntries);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const handleSave = async () => {
    if (user && newContent.trim()) {
      await addJournalEntry(user.uid, newContent);
      setNewContent('');
      setIsFormOpen(false);
      refreshEntries();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous supprimer cette entrée ?')) {
      if (!user) return;
      await deleteJournalEntry(user.uid, id);
      refreshEntries();
    }
  };

  if (loading) return <div className="min-h-screen pt-24 text-center">Chargement...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-serif text-slate-800 flex items-center gap-3">
              <PenLine className="text-amber-500" /> Journal Spirituel
            </h1>
            <p className="text-slate-600 mt-2">Notez vos réflexions, prières et ce que Dieu vous enseigne.</p>
          </div>
          <button onClick={() => setIsFormOpen(!isFormOpen)} className="bg-indigo-600 text-white px-4 py-2 rounded-full font-medium hover:bg-indigo-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouvelle entrée
          </button>
        </div>

        {isFormOpen && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 animate-fade-in">
            <textarea
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[150px] mb-4 bg-slate-50"
              placeholder="Que souhaitez-vous écrire aujourd'hui ?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Annuler</button>
              <button onClick={handleSave} className="bg-amber-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-600">Enregistrer</button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {entries.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
              <PenLine className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">Votre journal est vide</h3>
              <p className="text-slate-500">Commencez à noter vos réflexions en créant votre première entrée.</p>
            </div>
          ) : (
            entries.map(entry => (
              <div key={entry.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-4 border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    {timestampToDate(entry.createdAt)?.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) || 'À l’instant'}
                  </div>
                  <button onClick={() => handleDelete(entry.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">{entry.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
