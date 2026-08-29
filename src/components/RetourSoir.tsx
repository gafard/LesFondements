'use client';

import { useState } from 'react';
import { Check, Edit3, HeartHandshake, ArrowLeft, LockKeyhole, Quote, CheckCircle2 } from 'lucide-react';
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
    router.push('/dashboard');
  };

  return (
    <div className="table-travail min-h-screen text-encre-950 p-4 sm:p-6 md:p-8 pt-8 pb-24 safe-area-inset flex flex-col items-center">
      <div className="max-w-xl mx-auto w-full space-y-6">
        
        {/* En-tête */}
        <div className="text-center space-y-1">
          <span className="timbre inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-encre-800 bg-parchemin-100 mb-2">
            Bilan de fin de journée
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-encre-950">
            Mon retour du soir
          </h1>
          <p className="text-xs text-encre-700 max-w-sm mx-auto">
            Prends 2 minutes pour boucler la boucle avec le Père avant de clore ta journée.
          </p>
        </div>
        
        {/* Fiche récapitulative (La feuille avec trombone) */}
        <article className="feuille relative rounded-3xl p-6 sm:p-8 shadow-xl border border-encre-900/10 space-y-4">
          <span className="trombone absolute -top-3 left-8" aria-hidden="true" />
          
          <div className="border-b border-dashed border-encre-900/15 pb-3">
            <h3 className="text-[10px] uppercase tracking-[0.14em] text-or-800 font-bold mb-1">
              📖 La parole gardée aujourd'hui
            </h3>
            <p className="text-base font-serif italic text-encre-950 font-medium">
              « {verset} »
            </p>
          </div>

          <div className="border-b border-dashed border-encre-900/15 pb-3">
            <h3 className="text-[10px] uppercase tracking-[0.14em] text-sky-800 font-bold mb-1">
              🕊️ Ce que tu as apporté dans la prière
            </h3>
            <p className="text-sm text-encre-800 italic">
              {confiance || "Mon temps avec le Seigneur"}
            </p>
          </div>

          <div>
            <h3 className="text-[10px] uppercase tracking-[0.14em] text-emerald-800 font-bold mb-1">
              👣 Le pas concret choisi
            </h3>
            <p className="text-sm font-semibold text-encre-950">
              {etapeChoisie || "Mon pas du jour"}
            </p>
          </div>
        </article>

        {/* Le Post-it de réflexion */}
        <div className="postit postit-jaune relative rounded-sm p-6 shadow-xl border border-encre-900/15 space-y-4 rotate-[-0.5deg]">
          <span className="ruban -top-3 left-1/2 -translate-x-1/2" aria-hidden="true" />
          
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-encre-950 leading-snug">
            Qu'est-ce qui s'est passé quand tu as essayé de vivre cette Parole ?
          </h2>
          
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Une pensée, une lutte, une victoire, une bénédiction constatée..."
            rows={3}
            className="w-full rounded-xl border border-encre-900/15 bg-white/60 p-3.5 text-encre-950 text-sm leading-relaxed outline-none transition focus:border-or-700 focus:ring-2 focus:ring-or-400/20 placeholder:text-encre-900/35"
          />

          <p className="flex items-center gap-1.5 text-xs text-encre-700">
            <LockKeyhole className="w-3.5 h-3.5 text-or-800" />
            Ce bilan reste strictement privé dans ton journal.
          </p>
        </div>

        {/* 3 Choix d'action bienveillants */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button 
            disabled={saving}
            onClick={() => handleSave('vécu')}
            className="p-4 rounded-2xl border border-emerald-400/50 bg-emerald-100/70 hover:bg-emerald-100 text-emerald-950 font-bold text-sm flex flex-col items-center justify-center gap-1.5 shadow-sm transition hover:-translate-y-0.5 active:translate-y-0"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span>Vécu</span>
            <span className="text-[10px] font-normal text-emerald-800">Le pas a pris corps</span>
          </button>

          <button 
            disabled={saving}
            onClick={() => handleSave('en_chemin')}
            className="p-4 rounded-2xl border border-or-400/50 bg-or-100/70 hover:bg-or-100 text-or-950 font-bold text-sm flex flex-col items-center justify-center gap-1.5 shadow-sm transition hover:-translate-y-0.5 active:translate-y-0"
          >
            <Edit3 className="w-5 h-5 text-or-700" />
            <span>En chemin</span>
            <span className="text-[10px] font-normal text-or-800">Je le poursuis</span>
          </button>

          <button 
            disabled={saving}
            onClick={() => handleSave('soutien')}
            className="p-4 rounded-2xl border border-sky-400/50 bg-sky-100/70 hover:bg-sky-100 text-sky-950 font-bold text-sm flex flex-col items-center justify-center gap-1.5 shadow-sm transition hover:-translate-y-0.5 active:translate-y-0"
          >
            <HeartHandshake className="w-5 h-5 text-sky-700" />
            <span>Besoin de soutien</span>
            <span className="text-[10px] font-normal text-sky-800">J'en parlerai</span>
          </button>
        </div>

      </div>
    </div>
  );
}
