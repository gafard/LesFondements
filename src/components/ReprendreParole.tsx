'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { lireDernierPassage, EVENEMENT_PASSAGE, type DernierPassage } from '@/lib/marquePage';
import { PROFILS_FICHES } from '@/lib/habiter';

export default function ReprendreParole({ ficheId, section }: { ficheId: number; section: number }) {
  const { user } = useAuth();
  const [passage, setPassage] = useState<DernierPassage | null>(null);
  useEffect(() => {
    const actualiser = () => setPassage(user ? lireDernierPassage(user.uid) : null);
    void Promise.resolve().then(actualiser);
    window.addEventListener(EVENEMENT_PASSAGE, actualiser);
    return () => window.removeEventListener(EVENEMENT_PASSAGE, actualiser);
  }, [user]);
  const reprise = passage?.uid === user?.uid && /^\/aujourdhui\?/.test(passage?.url || '') ? passage : null;
  const url = reprise?.url || `/aujourdhui?fiche=${ficheId}&section=${section}`;
  return <section className="nuit relative overflow-hidden rounded-3xl border border-or-300/20 p-7 text-parchemin-100 shadow-lg sm:p-10">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-or-300">Habiter la Parole</p>
    <h2 className="mt-4 max-w-xl font-serif text-3xl font-bold leading-tight sm:text-4xl">Du temps avec Dieu.<br />À partir d’ici.</h2>
    <p className="mt-4 max-w-xl text-base leading-relaxed text-parchemin-100/85">{PROFILS_FICHES[ficheId]?.invitation}</p>
    {reprise && <p className="mt-5 flex items-center gap-2 text-sm text-or-200"><BookOpen className="h-4 w-4 shrink-0" />Ton marque-page : {reprise.titre} · {reprise.sousTitre}</p>}
    <Link href={url} className="bouton-or mt-6 inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-7 py-3 text-sm font-bold">{reprise ? 'Reprendre là où j’en étais' : 'Ouvrir mon temps avec Dieu'}<ArrowRight className="h-4 w-4" /></Link>
    <p className="mt-4 text-sm text-parchemin-100/70">Tu peux t’arrêter après un passage et revenir. Aucune journée à rattraper.</p>
  </section>;
}
