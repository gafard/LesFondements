'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { Award, Printer, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function CertificatPage() {
  const { user } = useAuth();
  const [recipientName, setRecipientName] = useState(user?.displayName || 'Disciple de Jésus-Christ');
  const [completionDate] = useState(new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 print:hidden">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Nom affiché :</span>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" /> Imprimer / PDF
            </button>
          </div>
        </div>

        {/* CERTIFICATE CANVAS */}
        <div className="bg-white p-8 sm:p-12 md:p-16 rounded-3xl border-8 border-double border-amber-300/80 shadow-xl relative overflow-hidden text-center">
          
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          {/* Top Logo / Seal */}
          <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-4 border-white">
            <Award className="w-10 h-10 text-white" />
          </div>

          <span className="text-xs uppercase tracking-widest text-amber-700 font-bold bg-amber-100 px-4 py-1.5 rounded-full inline-block mb-4">
            Attestation Numérique d&apos;Achèvement
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif text-slate-900 mb-2">
            Le Parcours des Fondements
          </h1>
          
          <p className="text-sm sm:text-base text-slate-500 italic mb-8">
            Formation chrétienne & maturité spirituelle en 20 modules
          </p>

          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Ce certificat atteste avec joie que
          </p>

          <div className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-indigo-950 border-b-2 border-amber-300 inline-block px-8 py-2 mb-6">
            {recipientName}
          </div>

          <p className="text-sm text-slate-700 max-w-xl mx-auto leading-relaxed mb-8">
            a accompli avec fidélité et persévérance les 20 fiches d&apos;enseignement, de méditation biblique, de prière et de communion fraternelle du parcours.
          </p>

          {/* Key Verse Quote (From booklet cover) */}
          <div className="bg-amber-50/80 rounded-2xl p-5 border border-amber-200/80 max-w-2xl mx-auto mb-10 text-amber-900">
            <p className="font-serif italic text-xs sm:text-sm leading-relaxed mb-1">
              &quot;Notre but est de placer tout homme en présence de Dieu et d&apos;amener les chrétiens à leur pleine maturité spirituelle par une communion vivante avec le Christ.&quot;
            </p>
            <span className="text-xs font-bold text-amber-800">
              — Colossiens 1:28 (Parole Vivante)
            </span>
          </div>

          {/* Signatures & Validation Footer */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-left">
            <div>
              <span className="text-2xs text-slate-400 uppercase font-semibold block mb-1">Délivré le</span>
              <p className="text-xs font-bold text-slate-800">{completionDate}</p>
              <p className="text-2xs text-slate-500">moneglisepreferee.net</p>
            </div>

            <div className="text-right">
              <span className="text-2xs text-slate-400 uppercase font-semibold block mb-1">Attestation</span>
              <p className="text-xs font-bold text-indigo-700 flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Validé & Confirmé
              </p>
              <p className="text-2xs text-slate-500 font-mono">ID: FOND-{user?.uid?.substring(0, 8).toUpperCase() || 'COMPLETED'}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
