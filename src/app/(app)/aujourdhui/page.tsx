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
      <div className="nuit nuit-grain min-h-screen flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="text-5xl">🕊️</div>
        <h1 className="text-3xl font-serif text-amber-200">Ton temps à part est terminé</h1>
        <p className="text-amber-50/70 max-w-md leading-relaxed">
          {hour < 18
            ? 'Va vivre ta journée avec cette Parole. Reviens ce soir pour faire le point.'
            : 'Prends un moment pour faire le bilan de ta journée.'}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {hour >= 18 && (
            <button
              onClick={() => setShowRetour(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white py-3 px-8 rounded-xl transition-colors font-medium shadow-lg"
            >
              Mon retour du soir
            </button>
          )}
          <button
            onClick={() => setCompletedData(null)}
            className="bg-white/10 hover:bg-white/15 text-amber-200 py-3 px-8 rounded-xl transition-colors text-sm"
          >
            Refaire ou réviser
          </button>
          <a href="/dashboard" className="text-amber-400/60 hover:text-amber-400 underline text-xs mt-2">
            Retour au tableau de bord
          </a>
        </div>
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
