'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TempsApart from '@/components/TempsApart';
import RetourSoir from '@/components/RetourSoir';
import { useAuth } from '@/lib/AuthContext';
import livret from '@/data/livret.json';
import meditationData from '@/data/meditation-questions.json';
import { 
  Loader2, Sunrise, BookOpen, Check, ArrowRight, Lock, 
  ArrowLeft, CalendarDays, LockKeyhole 
} from 'lucide-react';
import ParcoursGate from '@/components/ParcoursGate';
import { getAnswers, getCachedAnswers } from '@/lib/firestore';

type FicheMeditation = (typeof meditationData)[number];

function AujourdhuiContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [showRetour, setShowRetour] = useState(false);
  const [completedData, setCompletedData] = useState<any>(null);
  const [ficheId, setFicheId] = useState(1);
  const [sectionIndex, setSectionIndex] = useState<number | null>(null);
  const [reponsesFiche, setReponsesFiche] = useState<Record<string, string>>({});

  useEffect(() => {
    const queryFiche = searchParams.get('fiche');
    const querySection = searchParams.get('section');

    const fId = queryFiche ? parseInt(queryFiche, 10) : 1;
    const validFicheId = isNaN(fId) ? 1 : Math.max(1, Math.min(20, fId));
    setFicheId(validFicheId);

    if (querySection !== null && querySection !== undefined) {
      const sId = parseInt(querySection, 10);
      setSectionIndex(isNaN(sId) ? null : sId);
    } else {
      setSectionIndex(null);
    }

    // Charger les réponses et l'avancement depuis Firestore / cache local
    if (user) {
      const cached = getCachedAnswers(user.uid, validFicheId);
      setReponsesFiche(cached);
      void getAnswers(user.uid, validFicheId).then(vals => {
        if (vals && typeof vals === 'object') setReponsesFiche(vals as Record<string, string>);
      });
    }

    setLoading(false);
  }, [user, searchParams]);

  const fiche = livret.fiches.find((f) => f.id === ficheId) || livret.fiches[0];
  const totalSections = fiche?.sections?.length || 1;

  // Données de la section si l'atelier est actif
  const sectionActive = sectionIndex !== null ? fiche?.sections?.[sectionIndex] : null;
  const meditationFiche = (meditationData as FicheMeditation[]).find((m) => m.ficheId === ficheId);
  const meditationSection = sectionIndex !== null ? meditationFiche?.sections?.[sectionIndex] : null;

  const questions = meditationSection?.questions || [
    { id: 'q1', fonction: 'contempler', question: "Qu'est-ce que ce texte te révèle sur la grandeur de Dieu ?" },
    { id: 'q2', fonction: 'recevoir', question: "Quelle vérité es-tu invité à garder dans ton cœur ?" },
    { id: 'q3', fonction: 'vivre', question: "Si cela est vrai, comment vas-tu vivre avec Lui aujourd'hui ?" },
  ];

  const versets = meditationSection?.versets || [];

  const handleCompleteSection = (data: any) => {
    if (sectionIndex === null) return;
    setCompletedData(data);
    
    // Mettre à jour l'état local
    const cleAvancement = `temps-apart:${sectionIndex}`;
    setReponsesFiche(prev => ({ ...prev, [cleAvancement]: JSON.stringify(data) }));
    
    localStorage.setItem(`temps_apart_done_${user?.uid || 'guest'}`, new Date().toDateString());
    localStorage.setItem(`temps_apart_latest_${user?.uid || 'guest'}`, JSON.stringify({
      ...data,
      ficheId,
      sectionIndex,
      sectionTitre: sectionActive?.titre,
      versets,
    }));

    // Revenir au sommaire du chemin de la semaine
    setSectionIndex(null);
  };

  const handleRetourSave = () => {
    setShowRetour(false);
    setCompletedData(null);
  };

  if (loading) {
    return (
      <div className="table-travail min-h-screen flex items-center justify-center text-or-700">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Écran du retour du soir
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

  // Si une section est sélectionnée : lancer l'Atelier Immersif
  if (sectionIndex !== null && sectionActive) {
    return (
      <TempsApart
        ficheId={ficheId}
        sectionIndex={sectionIndex}
        ficheData={fiche}
        sectionBlocs={sectionActive.blocs || []}
        meditationQuestions={questions}
        versets={versets}
        onComplete={handleCompleteSection}
      />
    );
  }

  // VUE PAR DÉFAUT : La Table avec le Chemin de la semaine
  return (
    <div className="table-travail min-h-screen text-encre-950 p-4 sm:p-6 md:p-8 pt-6 pb-24 safe-area-inset flex flex-col items-center">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        
        {/* Navigation retour fiche */}
        <div className="flex items-center justify-between">
          <Link
            href={`/fiches/${fiche.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-encre-700 hover:text-encre-950 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Ouvrir la fiche d'étude complète
          </Link>
          <span className="timbre px-3 py-1 text-xs font-bold text-encre-800 bg-parchemin-100">
            Fiche {fiche.id} sur 20
          </span>
        </div>

        {/* Grand En-tête Dossier */}
        <header className="feuille relative rounded-3xl p-6 sm:p-8 shadow-xl border border-encre-900/10 space-y-3">
          <span className="punaise -top-2 left-8" />
          <span className="ruban -top-3 right-12" />
          
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-or-800">
            <Sunrise className="w-4 h-4" /> Un temps à part
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-encre-950">
            Cahier d'étude de la semaine
          </h1>

          <p className="text-sm text-encre-700 leading-relaxed font-serif">
            {fiche.titre} — {fiche.sousTitre}
          </p>
        </header>

        {/* Le Chemin de la semaine (Les étapes séquentielles) */}
        <div className="dossier relative rounded-2xl border border-or-800/15 bg-[#c9ae78] p-5 sm:p-7 shadow-lg space-y-4">
          <span className="absolute -top-4 left-6 rounded-t-xl border border-b-0 border-or-800/15 bg-[#c9ae78] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-encre-900">
            Chemin de préparation ({fiche.sections.length} étapes)
          </span>

          <div className="space-y-3 pt-2">
            {fiche.sections.map((sec, idx) => {
              const cleAvancement = `temps-apart:${idx}`;
              const estVecu = Boolean(reponsesFiche[cleAvancement]);
              const clePrecedente = idx > 0 ? `temps-apart:${idx - 1}` : null;
              const estDeverouille = idx === 0 || Boolean(clePrecedente && reponsesFiche[clePrecedente]);

              return (
                <div 
                  key={idx}
                  className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    estVecu 
                      ? 'bg-parchemin-50 border-emerald-400 shadow-sm'
                      : estDeverouille 
                        ? 'bg-parchemin-50 border-or-500 shadow-md scale-[1.01]' 
                        : 'bg-parchemin-100/50 border-encre-900/10 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                      estVecu ? 'bg-emerald-700 text-white' : estDeverouille ? 'bg-or-600 text-white' : 'bg-parchemin-300 text-encre-600'
                    }`}>
                      {estVecu ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-encre-600">Étape {idx + 1}</span>
                        {estVecu && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-950">
                            Vécu
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-lg font-bold text-encre-950 mt-0.5">
                        {sec.titre || `Section ${idx + 1}`}
                      </h3>
                    </div>
                  </div>

                  <div>
                    {estDeverouille ? (
                      <button
                        onClick={() => setSectionIndex(idx)}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition shadow-sm ${
                          estVecu 
                            ? 'bg-emerald-900 text-white hover:bg-emerald-800'
                            : 'bg-encre-950 text-parchemin-50 hover:bg-encre-800'
                        }`}
                      >
                        {estVecu ? 'Refaire' : 'Entrer dans la contemplation'} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-encre-600 font-medium px-4 py-2 bg-encre-900/5 rounded-full">
                        <Lock className="w-3.5 h-3.5" /> Terminer l'étape {idx} d'abord
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="flex items-center gap-2 text-xs text-encre-800/80 pt-2">
            <LockKeyhole className="w-3.5 h-3.5 text-or-900" />
            Chaque temps avec Dieu s'enregistre dans ton Carnet Spirituel personnel.
          </p>
        </div>

      </div>
    </div>
  );
}

export default function AujourdhuiPage() {
  return (
    <ParcoursGate acces="personnel">
      <Suspense
        fallback={
          <div className="table-travail min-h-screen flex items-center justify-center text-or-700">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        }
      >
        <AujourdhuiContent />
      </Suspense>
    </ParcoursGate>
  );
}
