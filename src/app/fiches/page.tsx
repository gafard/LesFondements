'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { getUserProgress } from '@/lib/firestore';
import { allFiches } from '@/data/allFiches';
import { CheckCircle, BookOpen, Compass, ArrowRight } from 'lucide-react';

export default function FichesList() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [currentFiche, setCurrentFiche] = useState<number>(1);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getUserProgress(user.uid).then(prog => {
        setCompletedIds(prog.completedFiches || []);
        setCurrentFiche(prog.currentFicheId || 1);
      });
    }
  }, [user]);

  if (loading) return <div className="min-h-screen pt-24 text-center">Chargement...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-800 mb-4">
            <Compass className="h-3.5 w-3.5" /> 20 semaines • exploration libre
          </div>
          <h1 className="text-4xl font-bold font-serif text-slate-800 mb-4">Le parcours complet</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">Avancez dans l’ordre conseillé ou ouvrez la fiche dont vous avez besoin. Chaque étape relie enseignement, réflexion, mise en pratique et partage en groupe.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {allFiches.map((fiche) => {
            const isCompleted = completedIds.includes(fiche.id);
            const isInProgress = currentFiche === fiche.id;

            return (
              <Link key={fiche.id} href={`/fiches/${fiche.id}`} className={`group flex h-full min-h-48 flex-col rounded-2xl bg-white p-5 shadow-sm border transition-all hover:-translate-y-1 hover:shadow-lg ${isCompleted ? 'border-green-200' : isInProgress ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200 hover:border-indigo-300'}`}>
                <div className="flex justify-between items-start mb-5">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${isCompleted ? 'bg-green-100 text-green-700' : isInProgress ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>
                    {fiche.id}
                  </span>
                  {isCompleted ? <CheckCircle className="w-5 h-5 text-green-500" /> : isInProgress ? <BookOpen className="w-5 h-5 text-amber-500" /> : <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600" />}
                </div>
                <h3 className="font-serif font-bold text-slate-800 leading-tight mb-2">{fiche.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500 line-clamp-3">{fiche.subtitle}</p>
                <span className="mt-auto pt-5 text-2xs font-bold uppercase tracking-wider text-indigo-600">Ouvrir la fiche</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
