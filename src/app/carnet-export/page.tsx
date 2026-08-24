'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Printer, ArrowLeft, BookOpen, Award, CheckCircle, PenLine } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { FICHES_META } from '@/data/fichesMeta';
import { getCachedJournalEntries, getCachedAnswers, timestampToDate } from '@/lib/firestore';
import type { JournalEntry } from '@/lib/firestore';
import { etatMemoireLocal } from '@/lib/memorisation';

export default function CarnetExportPage() {
  const { user } = useAuth();
  const { group } = useParcours();
  const [reponsesParFiche, setReponsesParFiche] = useState<Record<number, Record<string, string>>>({});
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [maitrisees, setMaitrisees] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      setJournal(getCachedJournalEntries(user.uid));
      const reponses: Record<number, Record<string, string>> = {};
      for (let i = 1; i <= 20; i++) reponses[i] = getCachedAnswers(user.uid, i);
      setReponsesParFiche(reponses);
      setMaitrisees(
        Object.values(etatMemoireLocal(user.uid))
          .filter((record) => record.masteredAt)
          .map((record) => record.reference)
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  const imprimer = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const nomDisciple = user?.displayName || 'Disciple du Christ';
  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-parchemin-100 p-4 sm:p-8 print:bg-white print:p-0">
      {/* Barre d'action supérieure (masquée à l'impression) */}
      <div className="mx-auto mb-8 max-w-4xl flex items-center justify-between rounded-3xl bg-white p-4 shadow-sm print:hidden border border-parchemin-300">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-encre-700 hover:text-encre-950"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au tableau de bord
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={imprimer}
            className="inline-flex items-center gap-2 rounded-full bg-encre-950 px-5 py-2.5 text-xs font-bold text-parchemin-100 shadow-md transition-all hover:bg-encre-900 hover:scale-105"
          >
            <Printer className="h-4 w-4 text-or-300" />
            Imprimer / Enregistrer en PDF
          </button>
        </div>
      </div>

      {/* ══ MANUSCRIT DU CARNET (Format Livre Relié) ══ */}
      <div className="mx-auto max-w-4xl space-y-12 bg-white p-8 sm:p-14 shadow-xl border border-parchemin-300 rounded-3xl print:border-none print:shadow-none print:p-6 print:rounded-none">
        
        {/* Page de garde */}
        <div className="flex min-h-[500px] flex-col items-center justify-center text-center border-4 border-double border-or-400/40 p-8 sm:p-12 rounded-2xl print:min-h-0 print:py-16">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-or-100 text-or-800 shadow-xs mb-4">
            <BookOpen className="h-8 w-8" strokeWidth={1.5} />
          </span>
          <span className="text-2xs font-bold uppercase tracking-[0.28em] text-or-700">
            Parcours Vivant de Croissance Spirituelle
          </span>
          <h1 className="manuscrit mt-2 text-4xl sm:text-5xl font-bold text-encre-950">
            Carnet de Disciple
          </h1>
          <p className="mt-2 text-base text-encre-600 font-serif italic">
            Les 20 Fondements de la Vie Chrétienne
          </p>

          <div className="my-8 h-0.5 w-32 bg-or-300" />

          <p className="manuscrit text-2xl font-bold text-or-900">
            {nomDisciple}
          </p>
          {group && (
            <p className="text-xs text-encre-500 mt-1 font-serif">
              Cellule : {group.name} · Étape {group.currentStep}/20
            </p>
          )}
          <p className="text-2xs text-encre-400 mt-6 font-sans">
            Édité le {dateAujourdhui}
          </p>
        </div>

        {/* Sommaire des 20 Fiches */}
        <div className="space-y-4 pt-6 page-break-before">
          <h2 className="manuscrit text-2xl font-bold text-encre-950 border-b border-parchemin-300 pb-2">
            1. Table des Fondements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {FICHES_META.map((meta) => {
              const estCloturee = group?.closedSteps.includes(meta.id);
              const repCount = Object.keys(reponsesParFiche[meta.id] || {}).length;

              return (
                <div
                  key={meta.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-parchemin-200 bg-parchemin-50/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-or-800">
                      {String(meta.id).padStart(2, '0')}.
                    </span>
                    <span className="font-medium text-encre-900">{meta.titre}</span>
                  </div>
                  <span className="text-3xs font-bold text-encre-500">
                    {repCount > 0 ? `${repCount} rép.` : estCloturee ? 'Scellée' : 'À venir'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Réponses & Réflexions personnelles */}
        <div className="space-y-8 pt-6">
          <h2 className="manuscrit text-2xl font-bold text-encre-950 border-b border-parchemin-300 pb-2">
            2. Mes Réponses & Écritures Personnelles
          </h2>

          {Object.entries(reponsesParFiche).some(([, rep]) => Object.keys(rep).length > 0) ? (
            Object.entries(reponsesParFiche).map(([ficheIdStr, reponses]) => {
              const ficheId = Number(ficheIdStr);
              const clesReponses = Object.keys(reponses);
              if (clesReponses.length === 0) return null;
              const meta = FICHES_META.find((f) => f.id === ficheId);

              return (
                <div key={ficheId} className="space-y-3 rounded-2xl border border-parchemin-300 bg-parchemin-50/40 p-5">
                  <h3 className="font-serif text-sm font-bold text-or-800 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Fiche {ficheId} · {meta?.titre || `Fiche ${ficheId}`}
                  </h3>

                  <div className="space-y-3 pt-2">
                    {clesReponses.map((cle) => (
                      <div key={cle} className="border-l-2 border-or-400 pl-3">
                        <p className="manuscrit text-base text-encre-950 whitespace-pre-wrap">
                          « {reponses[cle]} »
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs italic text-encre-500 font-serif">
              Aucune réponse enregistrée pour le moment. Vos réponses écrites dans les fiches apparaîtront automatiquement ici.
            </p>
          )}
        </div>

        {/* Journal Spirituel */}
        <div className="space-y-6 pt-6">
          <h2 className="manuscrit text-2xl font-bold text-encre-950 border-b border-parchemin-300 pb-2 flex items-center gap-2">
            <PenLine className="h-5 w-5 text-or-700" />
            3. Feuillets du Journal Spirituel
          </h2>

          {journal.length > 0 ? (
            <div className="space-y-4">
              {journal.map((entree) => (
                <div key={entree.id} className="rounded-2xl border border-parchemin-200 p-4 bg-white">
                  <div className="flex items-center justify-between border-b border-parchemin-100 pb-1 mb-2">
                    <h4 className="manuscrit text-base font-bold text-encre-900">
                      {entree.title || 'Note de méditation'}
                    </h4>
                    <span className="text-3xs text-encre-400 font-sans">
                      {timestampToDate(entree.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="font-serif text-xs leading-relaxed text-encre-800 whitespace-pre-wrap">
                    {entree.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs italic text-encre-500 font-serif">
              Aucun feuillet de journal écrit pour l’instant.
            </p>
          )}
        </div>

        {/* Versets Mémorisés */}
        <div className="space-y-4 pt-6">
          <h2 className="manuscrit text-2xl font-bold text-encre-950 border-b border-parchemin-300 pb-2">
            4. Versets Gravés dans le Cœur ({maitrisees.length})
          </h2>

          {maitrisees.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {maitrisees.map((ref) => (
                <span
                  key={ref}
                  className="rounded-full bg-or-100 px-3 py-1 text-xs font-bold text-or-900 border border-or-300"
                >
                  📖 {ref}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs italic text-encre-500 font-serif">
              Vos versets mémorisés apparaîtront ici.
            </p>
          )}
        </div>

        {/* Attestation & Bénédiction finale */}
        <div className="mt-12 rounded-3xl border-2 border-or-400 bg-or-50/50 p-8 text-center space-y-4 print:mt-8">
          <Award className="mx-auto h-10 w-10 text-or-700" />
          <h3 className="manuscrit text-2xl font-bold text-encre-950">
            « Que ta foi soit ferme et inébranlable »
          </h3>
          <p className="font-serif text-xs italic max-w-lg mx-auto text-encre-700">
            « C’est pourquoi, mes frères et sœurs bien-aimés, soyez fermes, inébranlables, travaillant toujours avec abondance à l’œuvre du Seigneur. » (1 Co 15:58)
          </p>
          <div className="pt-6 flex items-center justify-between text-2xs text-encre-600 font-serif border-t border-or-300/50">
            <span>Signature du Disciple : ___________________</span>
            <span>Date : {dateAujourdhui}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
