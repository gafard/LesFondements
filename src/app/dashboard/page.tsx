'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { getUserProgress, getJournalEntries, timestampToDate } from '@/lib/firestore';
import type { JournalEntry } from '@/lib/firestore';
import ProgressBar from '@/components/ProgressBar';
import { 
  BookOpen, 
  PenLine, 
  ArrowRight, 
  Users, 
  Brain, 
  Tag, 
  BookMarked, 
  Award,
  Sparkles,
} from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<{completedFiches: number[], currentFicheId: number} | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const prog = await getUserProgress(user.uid);
          setProgress(prog);
          const entries = await getJournalEntries(user.uid);
          setJournalEntries(entries.slice(0, 3));
        } catch (error) {
          console.error(error);
        } finally {
          setDataLoading(false);
        }
      }
    };
    if (user && !loading) {
      fetchData();
    }
  }, [user, loading]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 text-lg">Chargement de votre espace...</div>
      </div>
    );
  }
  if (!user) return null;

  const completedCount = progress?.completedFiches.length || 0;
  const currentFiche = progress?.currentFicheId || 1;

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 mb-2">
            Bonjour, {user.displayName || 'cher disciple'} !
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Bienvenue sur votre plateforme de croissance spirituelle. Voici votre état d&apos;avancement :
          </p>
        </div>

        {/* Top Grid: Progress & Daily Verse */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          
          {/* Main Progress Card */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-serif text-slate-900 flex items-center gap-2">
                  <BookOpen className="text-indigo-600 w-5 h-5" /> Progression du Parcours
                </h2>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {completedCount} / 20 fiches
                </span>
              </div>
              <div className="mb-6">
                <ProgressBar current={completedCount} total={20} showLabel size="lg" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-500/10 to-indigo-500/10 rounded-2xl p-5 border border-amber-200/60 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-2xs uppercase tracking-wider text-amber-800 font-bold">Prochaine étape</span>
                <p className="text-slate-900 font-bold text-lg font-serif">Fiche {currentFiche}</p>
              </div>
              <Link
                href={`/fiches/${currentFiche}`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full font-bold text-xs shadow-md transition-transform active:scale-95 inline-flex items-center gap-2"
              >
                {completedCount === 0 ? 'Commencer la Fiche 1' : 'Continuer mon étude'} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Verset du jour */}
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-3xl p-6 shadow-md text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Verset à méditer
              </div>
              <p className="font-serif italic text-sm sm:text-base leading-relaxed text-indigo-50 mb-4">
                &quot;Car c&apos;est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c&apos;est le don de Dieu.&quot;
              </p>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-indigo-700/60">
              <span className="text-xs font-bold text-amber-300">Éphésiens 2:8</span>
              <Link href="/memorisation" className="text-2xs text-indigo-200 hover:text-white font-medium underline">
                Mémoriser &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Hub Shortcuts */}
        <h3 className="text-lg font-bold font-serif text-slate-800 mb-4">Outils & Espaces du Parcours</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          
          <Link
            href="/groupes"
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all text-center group flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Groupe & Visio</h4>
            <p className="text-2xs text-slate-400 mt-1">Partage & Mur de prière</p>
          </Link>

          <Link
            href="/memorisation"
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md hover:border-amber-200 transition-all text-center group flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Mémorisation</h4>
            <p className="text-2xs text-slate-400 mt-1">Flashcards 3D</p>
          </Link>

          <Link
            href="/index-thematique"
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all text-center group flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Tag className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Index Thématique</h4>
            <p className="text-2xs text-slate-400 mt-1">Index p. 163 du livret</p>
          </Link>

          <Link
            href="/ressources"
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all text-center group flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BookMarked className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Bibliographie</h4>
            <p className="text-2xs text-slate-400 mt-1">Livres p. 164</p>
          </Link>

          <Link
            href="/certificat"
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all text-center group flex flex-col items-center justify-center col-span-2 sm:col-span-1"
          >
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Mon Certificat</h4>
            <p className="text-2xs text-slate-400 mt-1">Attestation officielle</p>
          </Link>

        </div>

        {/* Recent Journal Entries */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold font-serif flex items-center gap-2 text-slate-900">
              <PenLine className="text-amber-500 w-5 h-5" /> Journal Spirituel Récent
            </h2>
            <Link href="/journal" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Ouvrir le journal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {journalEntries.length > 0 ? (
            <div className="space-y-4">
              {journalEntries.map(entry => (
                <div key={entry.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <p className="text-2xs text-slate-400 mb-1 font-medium">{timestampToDate(entry.createdAt)?.toLocaleDateString('fr-FR') || 'À l’instant'}</p>
                  <p className="text-slate-700 text-sm line-clamp-2 leading-relaxed">{entry.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <PenLine className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs mb-3">Vous n&apos;avez pas encore consigné de notes dans votre journal.</p>
              <Link href="/journal" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-full inline-block">
                Écrire une première prière / note
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
