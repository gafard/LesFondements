'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { Printer, CheckCircle2, ArrowLeft, Lock } from 'lucide-react';
import ParcoursGate from '@/components/ParcoursGate';
import { useParcours } from '@/lib/ParcoursContext';

function CertificatPage() {
  const { user } = useAuth();
  const { group } = useParcours();
  const [recipientName, setRecipientName] = useState(user?.displayName || 'Disciple de Jésus-Christ');
  const [completionDate] = useState(new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }));

  const handlePrint = () => {
    window.print();
  };

  const achevees = group?.closedSteps.length ?? 0;
  const acheve = !!group?.completedAt;

  // L'attestation ne se délivre pas à mi-parcours : elle atteste que le
  // groupe est allé au bout des vingt fiches, ensemble.
  if (!acheve) {
    return (
      <div className="min-h-screen bg-parchemin-100 px-4 pb-10 pt-6">
        <div className="mx-auto max-w-lg text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-parchemin-200 text-encre-400">
            <Lock className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <h1 className="mt-6 font-serif text-3xl font-bold text-encre-950">
            L&apos;attestation vous attend au bout
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-encre-600">
            {group
              ? `${group.name} a partagé ${achevees} fiche${achevees > 1 ? 's' : ''} sur 20. L'attestation se délivre quand la vingtième est refermée.`
              : "Elle se délivre quand les vingt fiches ont été partagées avec votre groupe."}
          </p>

          <div className="mx-auto mt-8 max-w-sm">
            <div className="h-2 overflow-hidden rounded-full bg-parchemin-300">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-or-400 to-or-600 transition-all duration-700"
                style={{ width: `${(achevees / 20) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-2xs font-bold text-or-700">{achevees} / 20</p>
          </div>

          <Link
            href="/fiches"
            className="bouton-or mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold"
          >
            Reprendre le sentier
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10 pt-6 bg-slate-50">
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
          <div className="w-20 h-20 relative mx-auto mb-6 drop-shadow-md">
            <Image
              src="/logo.png"
              alt="Sceau officiel Les Fondements"
              fill
              sizes="80px"
              className="object-contain"
              priority
            />
          </div>

          <p className="font-serif italic text-amber-800 text-xs sm:text-sm mb-3">
            Attestation d&apos;achèvement du parcours
          </p>

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
            a parcouru les 20 fiches d&apos;enseignement, de méditation biblique, de prière et de
            partage{group ? ` au sein du groupe « ${group.name} »` : ''}, jusqu&apos;au bout.
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

export default function Page() {
  return (
    <ParcoursGate>
      <CertificatPage />
    </ParcoursGate>
  );
}
