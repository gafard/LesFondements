'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getCachedJournalEntries, getJournalEntries, addJournalEntry, deleteJournalEntry, timestampToDate } from '@/lib/firestore';
import type { JournalEntry } from '@/lib/firestore';
import Image from 'next/image';
import { PenLine, Plus, Trash2, Calendar } from 'lucide-react';
import ParcoursGate from '@/components/ParcoursGate';

function Journal() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>(() => (user ? getCachedJournalEntries(user.uid) : []));
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

  if (loading) return <div className="min-h-screen pt-10 text-center">Chargement...</div>;
  if (!user) return null;

  return (
    <div className="table-travail min-h-screen pb-16 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* ── En-tête Illustré ── */}
        <div className="nuit nuit-grain relative mb-8 overflow-hidden rounded-4xl p-6 sm:p-8 text-parchemin-100 shadow-lg">
          <div className="absolute inset-0 z-0">
            <Image
              src="/journal-sanctuary-hero.jpg"
              alt="Écriture dans le journal spirituel"
              fill
              sizes="100vw"
              className="object-cover object-[center_45%] opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07162b]/95 via-[#07162b]/85 to-[#07162b]/90" />
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="mb-1 font-serif italic text-amber-300/90 text-xs">
                Sanctuaire de réflexion intime
              </p>
              <h1 className="text-3xl font-bold font-serif text-[#fff8e8] flex items-center gap-2 sm:text-4xl">
                Journal Spirituel
              </h1>
              <p className="text-parchemin-100/75 text-xs sm:text-sm mt-1.5 max-w-md">
                Consignez vos réflexions secrètes, vos prières et ce que le Seigneur vous révèle de votre main.
              </p>
            </div>
            
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="bouton-or inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold shrink-0 shadow-md"
            >
              <Plus className="w-4 h-4" /> Nouvelle note
            </button>
          </div>
        </div>

        {isFormOpen && (
          <div className="feuille feuille-dechiree p-6 sm:p-8 rounded-3xl shadow-lg border border-parchemin-300 mb-8 animate-fade-in relative">
            <span className="ruban -top-3 left-8 -rotate-2 rounded-[2px]" />
            <h3 className="manuscrit font-bold text-2xl text-encre-950 mb-2">Nouvelle réflexion manuscrite</h3>
            <textarea
              className="manuscrit w-full p-4 border border-parchemin-300 rounded-2xl focus:ring-1 focus:ring-or-400 focus:outline-none min-h-[160px] mb-4 bg-parchemin-50/60 text-encre-950 text-base leading-relaxed placeholder:font-sans placeholder:text-xs placeholder:text-encre-300"
              placeholder="Que souhaitez-vous confier au Seigneur aujourd'hui ?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-encre-600 text-xs font-bold hover:bg-parchemin-200 rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="bouton-or px-6 py-2.5 rounded-full text-xs font-bold shadow-sm"
              >
                Épingler au journal
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {entries.length === 0 ? (
            <div className="feuille text-center py-16 rounded-3xl border border-dashed border-parchemin-400 p-8">
              <PenLine className="w-10 h-10 text-encre-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold font-serif text-encre-950 mb-1">Votre table de réflexion est prête</h3>
              <p className="text-xs text-encre-500 max-w-sm mx-auto">
                Prenez un temps de silence, ouvrez votre cœur et consignez ce qui résonne dans votre étude.
              </p>
            </div>
          ) : (
            entries.map((entry, index) => {
              const poses = ['pose-1', 'pose-2', 'pose-3', 'pose-4'];
              const pose = poses[index % poses.length];
              return (
                <div key={entry.id} className={`feuille ${pose} p-6 sm:p-7 rounded-3xl shadow-sm border border-parchemin-300 hover:shadow-md transition-all relative group`}>
                  <span className="ruban -top-2.5 left-6 -rotate-1 rounded-[2px]" />
                  <div className="flex justify-between items-start mb-3 border-b border-parchemin-200/80 pb-2.5 pt-1">
                    <div className="flex items-center gap-2 text-encre-500 text-xs font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-or-600" />
                      <span className="manuscrit text-base text-or-700">
                        {timestampToDate(entry.createdAt)?.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) || 'À l’instant'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-encre-300 hover:text-rose-600 p-1 rounded-lg transition-colors"
                      title="Supprimer l'entrée"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="manuscrit text-encre-950 text-lg whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ParcoursGate allowPending>
      <Journal />
    </ParcoursGate>
  );
}
