'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { Printer, ArrowLeft, Lock } from 'lucide-react';
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
      <div className="table-travail min-h-screen px-4 pb-16 pt-6">
        <div className="feuille relative mx-auto max-w-lg rounded-3xl border border-parchemin-300 p-8 text-center shadow-lg sm:p-10">
          <span className="attache-pince -top-3 left-1/2 -translate-x-1/2" />
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-parchemin-200 text-encre-400">
            <Lock className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <h1 className="mt-6 font-serif text-3xl font-bold text-encre-950">
            L&apos;attestation vous attend au bout
          </h1>
          <p className="mx-auto mt-4 max-w-md text-xs sm:text-sm leading-relaxed text-encre-600">
            {group
              ? `${group.name} a partagé ${achevees} fiche${achevees > 1 ? 's' : ''} sur 20. L'attestation se délivre quand la vingtième est refermée.`
              : "Elle se délivre quand les vingt fiches ont été partagées avec votre groupe."}
          </p>

          <div className="mx-auto mt-8 max-w-sm">
            <div className="h-2.5 overflow-hidden rounded-full bg-parchemin-300">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-or-400 to-or-600 transition-all duration-700"
                style={{ width: `${(achevees / 20) * 100}%` }}
              />
            </div>
            <p className="manuscrit mt-2 text-base font-bold text-or-800">{achevees} / 20 fiches complétées</p>
          </div>

          <Link
            href="/fiches"
            className="bouton-or mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-xs font-bold shadow-md"
          >
            Reprendre le sentier
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="table-travail min-h-screen pb-16 pt-6">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">

        {/* Top Controls */}
        <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row print:hidden">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-encre-600 hover:text-encre-950"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à la table de travail
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-encre-500">Nom affiché :</span>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="rounded-xl border border-parchemin-400 bg-white px-3 py-1.5 text-xs font-bold text-encre-900 shadow-2xs outline-none focus:border-or-400"
              />
            </div>

            <button
              onClick={handlePrint}
              className="bouton-or flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold shadow-sm"
            >
              <Printer className="h-4 w-4" /> Imprimer / PDF
            </button>
          </div>
        </div>

        {/* CERTIFICATE CANVAS */}
        <div className="feuille feuille-dechiree relative overflow-hidden rounded-4xl border-4 border-or-400/70 p-8 text-center shadow-2xl sm:p-12 md:p-16">
          <span className="ruban -top-3 left-12 -rotate-2 rounded-[2px]" />
          <span className="ruban -top-3 right-12 rotate-2 rounded-[2px]" />

          {/* Top Logo / Seal */}
          <div className="relative mx-auto mb-6 h-20 w-20 drop-shadow-md">
            <Image
              src="/logo.png"
              alt="Sceau officiel Les Fondements"
              fill
              sizes="80px"
              className="object-contain"
              priority
            />
          </div>

          <p className="manuscrit mb-2 text-2xl text-or-800">
            Attestation d&apos;achèvement du parcours
          </p>

          <h1 className="mb-2 font-serif text-3xl font-bold text-encre-950 sm:text-4xl md:text-5xl">
            Le Parcours des Fondements
          </h1>
          
          <p className="mb-8 font-serif text-sm italic text-encre-600 sm:text-base">
            Parcours chrétien vécu et partagé en 20 fiches
          </p>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-encre-400">
            Ce parchemin atteste avec joie que
          </p>

          <div className="manuscrit mb-6 inline-block border-b-2 border-or-400 px-8 py-2 text-3xl font-bold text-or-900 sm:text-4xl md:text-5xl">
            {recipientName}
          </div>

          <p className="mx-auto mb-8 max-w-xl text-sm leading-relaxed text-encre-800">
            a parcouru les 20 fiches d&apos;enseignement, de méditation biblique, de prière et de
            partage{group ? ` au sein du groupe « ${group.name} »` : ''}, jusqu&apos;au bout.
          </p>

          {/* Key Verse Quote (From booklet cover) */}
          <div className="mx-auto mb-10 max-w-2xl rounded-2xl border border-or-300 bg-amber-50/60 p-5 text-encre-900 shadow-xs">
            <p className="font-serif text-sm italic leading-relaxed">
              « Que tout homme soit placé en présence de Dieu et amené à sa pleine maturité spirituelle par une communion vivante avec le Christ. »
            </p>
            <p className="manuscrit mt-1 text-base text-or-800 font-bold">Colossiens 1:28</p>
          </div>

          {/* Footer signatures & date */}
          <div className="mt-8 flex flex-col items-center justify-between gap-6 border-t border-parchemin-300/80 pt-8 sm:flex-row">
            <div className="text-left">
              <span className="block text-2xs uppercase tracking-wider text-encre-400">Délivré le</span>
              <span className="manuscrit text-xl font-bold text-encre-900">{completionDate}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="timbre rounded-md px-3 py-1.5 text-xs font-bold text-or-800">
                PARCOURS ACHEVÉ EN CELLULE
              </span>
            </div>

            <div className="text-right">
              <span className="block text-2xs uppercase tracking-wider text-encre-400">Pour la cellule</span>
              <span className="manuscrit text-xl font-bold text-encre-950">{group?.name || 'Groupe des Fondements'}</span>
              <p className="text-2xs font-mono text-encre-400">ID: FOND-{user?.uid?.substring(0, 8).toUpperCase() || 'COMPLETED'}</p>
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
