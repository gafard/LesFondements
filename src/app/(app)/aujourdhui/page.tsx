'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TempsApart from '@/components/TempsApart';
import RetourSoir from '@/components/RetourSoir';
import { useAuth } from '@/lib/AuthContext';
import livret from '@/data/livret.json';
import meditationData from '@/data/meditation-questions.json';
import { Loader2 } from 'lucide-react';
import ParcoursGate from '@/components/ParcoursGate';

type FicheMeditation = (typeof meditationData)[number];

function getSectionProgress(userId?: string): { ficheId: number; sectionIndex: number } {
  try {
    const raw = localStorage.getItem(`temps_apart_progress_${userId || 'guest'}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { ficheId: 1, sectionIndex: 0 };
}

function saveSectionProgress(userId: string | undefined, ficheId: number, sectionIndex: number) {
  localStorage.setItem(
    `temps_apart_progress_${userId || 'guest'}`,
    JSON.stringify({ ficheId, sectionIndex })
  );
}

function AujourdhuiContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [showRetour, setShowRetour] = useState(false);
  const [completedData, setCompletedData] = useState<any>(null);
  const [ficheId, setFicheId] = useState(1);
  const [sectionIndex, setSectionIndex] = useState(0);

  useEffect(() => {
    const queryFiche = searchParams.get('fiche');
    const querySection = searchParams.get('section');

    if (queryFiche) {
      const f = parseInt(queryFiche, 10);
      const s = querySection ? parseInt(querySection, 10) : 0;
      setFicheId(isNaN(f) ? 1 : Math.max(1, Math.min(20, f)));
      setSectionIndex(isNaN(s) ? 0 : Math.max(0, s));
    } else {
      const progress = getSectionProgress(user?.uid);
      setFicheId(progress.ficheId);
      setSectionIndex(progress.sectionIndex);
    }

    // Vérifier s'il a déjà fait son temps à part aujourd'hui
    const lastCompleted = localStorage.getItem(`temps_apart_done_${user?.uid || 'guest'}`);
    const today = new Date().toDateString();
    if (lastCompleted === today && !queryFiche) {
      const saved = localStorage.getItem(`temps_apart_latest_${user?.uid || 'guest'}`);
      if (saved) setCompletedData(JSON.parse(saved));
      const hour = new Date().getHours();
      if (hour >= 18) setShowRetour(true);
    }

    setLoading(false);
  }, [user, searchParams]);

  // Données de la fiche et de la section courante
  const fiche = livret.fiches.find((f) => f.id === ficheId);
  const section = fiche?.sections?.[sectionIndex];
  const meditationFiche = (meditationData as FicheMeditation[]).find((m) => m.ficheId === ficheId);
  const meditationSection = meditationFiche?.sections?.[sectionIndex];

  // Générer le texte HTML de la section
  const sectionText = section?.blocs
    ?.map((b) => {
      if (b.type === 'paragraphe') return `<p>${b.texte}</p>`;
      if (b.type === 'citation') return `<blockquote>${b.texte}</blockquote>`;
      if (b.type === 'encadre') return `<div class="encadre">${b.texte}</div>`;
      if (b.type === 'sous-titre') return `<h3>${b.texte}</h3>`;
      if (b.type === 'liste') return `<ul><li>${b.texte}</li></ul>`;
      return '';
    })
    .join('\n') || '<p>Bienvenue dans ton temps à part.</p>';

  const questions = meditationSection?.questions || [
    { id: 'q1', fonction: 'observer', question: "Qu'est-ce qui te touche dans ce passage ?" },
    { id: 'q2', fonction: 'recevoir', question: 'Comment cela résonne-t-il avec ta vie actuelle ?' },
    { id: 'q3', fonction: 'repondre', question: "Quelle invitation ressens-tu de la part de Dieu aujourd'hui ?" },
  ];

  const versets = meditationSection?.versets || [];

  const handleComplete = (data: any) => {
    setCompletedData(data);
    localStorage.setItem(`temps_apart_done_${user?.uid || 'guest'}`, new Date().toDateString());
    localStorage.setItem(`temps_apart_latest_${user?.uid || 'guest'}`, JSON.stringify({
      ...data,
      ficheId,
      sectionIndex,
      sectionTitre: section?.titre,
      versets,
    }));

    // Avancer à la section suivante (ou à la fiche suivante)
    const totalSections = fiche?.sections?.length || 1;
    if (sectionIndex + 1 < totalSections) {
      saveSectionProgress(user?.uid, ficheId, sectionIndex + 1);
    } else if (ficheId < 20) {
      saveSectionProgress(user?.uid, ficheId + 1, 0);
    }
  };

  const handleRetourSave = () => {
    setShowRetour(false);
    setCompletedData(null);
  };

  if (loading) {
    return (
      <div className="nuit nuit-grain min-h-screen flex items-center justify-center text-amber-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (showRetour && completedData) {
    const selectedTexts = completedData.selectedCards
      ?.map((k: string) => completedData.answers?.[k])
      .filter(Boolean)
      .join(' · ') || '';

    return (
      <RetourSoir
        verset={versets[0] || 'Psaume 46:11'}
        confiance={selectedTexts || 'Ce que j\'ai médité aujourd\'hui'}
        etapeChoisie={completedData.step6Answer || ''}
        onSave={handleRetourSave}
      />
    );
  }

  if (completedData) {
    const hour = new Date().getHours();
    return (
      <div className="table-travail min-h-screen text-encre-950 flex flex-col items-center justify-center p-4 sm:p-6 safe-area-inset">
        <article className="feuille relative rounded-3xl p-8 sm:p-10 shadow-2xl border border-encre-900/10 text-center max-w-md w-full space-y-6">
          <span className="ruban -top-3 left-1/2 -translate-x-1/2" aria-hidden="true" />
          
          <div className="text-4xl">🕊️</div>
          
          <div>
            <span className="timbre inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-encre-800 bg-parchemin-100 mb-3">
              Temps du jour accompli
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-encre-950">
              Parole semée dans ton cœur
            </h1>
          </div>

          <p className="text-sm text-encre-800 leading-relaxed font-serif italic">
            {hour < 18
              ? '« Va vivre ta journée avec cette Parole. Reviens ce soir pour faire le bilan avec le Père. »'
              : '« La journée s\'achève. Prends un instant pour faire le point sur ce que tu as vécu. »'}
          </p>

          <div className="flex flex-col gap-3 pt-2">
            {hour >= 18 && (
              <button
                onClick={() => setShowRetour(true)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-encre-950 px-6 text-sm font-bold text-parchemin-50 shadow-md transition hover:-translate-y-0.5 hover:bg-encre-800"
              >
                Mon retour du soir
              </button>
            )}
            <button
              onClick={() => setCompletedData(null)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-encre-900/15 bg-white/60 px-5 text-xs font-bold text-encre-900 transition hover:bg-white"
            >
              Refaire ou réviser
            </button>
            <a href="/dashboard" className="text-xs font-bold text-or-800 underline underline-offset-4 hover:text-or-950 mt-1">
              Retour au tableau de bord
            </a>
          </div>
        </article>
      </div>
    );
  }

  return (
    <TempsApart
      ficheId={ficheId}
      sectionIndex={sectionIndex}
      ficheData={fiche}
      sectionText={sectionText}
      meditationQuestions={questions}
      versets={versets}
      onComplete={handleComplete}
    />
  );
}

export default function AujourdhuiPage() {
  return (
    <ParcoursGate acces="personnel">
      <Suspense
        fallback={
          <div className="nuit nuit-grain min-h-screen flex items-center justify-center text-amber-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        }
      >
        <AujourdhuiContent />
      </Suspense>
    </ParcoursGate>
  );
}
