'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Check, Edit3, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RetourSoirProps {
  verset: string;
  confiance: string;
  etapeChoisie: string;
  onSave?: (data: any) => void;
}

export default function RetourSoir({ verset, confiance, etapeChoisie, onSave }: RetourSoirProps) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSave = async (status: 'vécu' | 'en_chemin' | 'soutien') => {
    setSaving(true);
    const data = { status, note, date: new Date().toISOString() };
    
    // Save to localStorage fallback
    const existing = JSON.parse(localStorage.getItem('retours_soir') || '[]');
    localStorage.setItem('retours_soir', JSON.stringify([...existing, data]));

    if (onSave) {
      await onSave(data);
    }
    
    setSaving(false);
    router.push('/dashboard'); // or appropriate route
  };

  return (
    <div className="nuit nuit-grain min-h-screen text-amber-50 p-6 pt-12 pb-24 safe-area-inset flex flex-col">
      <div className="max-w-md mx-auto w-full space-y-8">
        <h1 className="text-3xl font-serif text-amber-200/90 text-center">Retour sur la journée</h1>
        
        <div className="bg-white/5 border border-amber-900/30 rounded-2xl p-6 space-y-4 shadow-lg backdrop-blur-sm">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-amber-500/60 font-semibold mb-1">La parole gardée</h3>
            <p className="text-lg font-serif italic">{verset}</p>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-widest text-amber-500/60 font-semibold mb-1">Ce que tu as confié</h3>
            <p className="text-sm opacity-90">{confiance}</p>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-widest text-amber-500/60 font-semibold mb-1">Le pas concret</h3>
            <p className="text-sm opacity-90">{etapeChoisie}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl text-center font-medium">Qu'est-ce qui s'est passé quand tu as essayé de vivre cette Parole ?</h2>
          
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Une pensée, une difficulté, une victoire..."
            className="w-full h-32 bg-black/40 border border-amber-900/50 rounded-xl p-4 text-amber-50 focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all placeholder:text-amber-50/20"
          />

          <div className="grid grid-cols-1 gap-3">
            <button 
              disabled={saving}
              onClick={() => handleSave('vécu')}
              className="bg-emerald-900/40 border border-emerald-500/30 text-emerald-100 py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-800/50 transition-colors"
            >
              <Check className="w-5 h-5" /> J'ai pu le vivre
            </button>
            <button 
              disabled={saving}
              onClick={() => handleSave('en_chemin')}
              className="bg-amber-900/40 border border-amber-500/30 text-amber-100 py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-800/50 transition-colors"
            >
              <Edit3 className="w-5 h-5" /> En chemin
            </button>
            <button 
              disabled={saving}
              onClick={() => handleSave('soutien')}
              className="bg-blue-900/40 border border-blue-500/30 text-blue-100 py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-800/50 transition-colors"
            >
              Besoin de soutien
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
