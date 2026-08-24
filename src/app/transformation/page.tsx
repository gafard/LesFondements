'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarDays, MessageCircleHeart, PenLine, Sparkles } from 'lucide-react';
import ParcoursGate from '@/components/ParcoursGate';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { FICHES_META } from '@/data/fichesMeta';
import { getAnswers, getJournalEntries } from '@/lib/firestore';
import { etatMemoireLocal } from '@/lib/memorisation';

interface TraceFiche {
  id: number;
  titre: string;
  reponses: number;
  mots: number;
  terminee: boolean;
}

const MOTS_OUTILS = new Set(['avec', 'dans', 'pour', 'mais', 'plus', 'cette', 'comme', 'vous', 'nous', 'être', 'avoir', 'tout', 'cela', 'sans', 'mes', 'mon', 'une', 'des', 'les', 'que', 'qui', 'est', 'sur', 'pas']);

function TransformationContent() {
  const { user } = useAuth();
  const { preparationStep } = useParcours();
  const [traces, setTraces] = useState<TraceFiche[] | null>(null);
  const [motsJournal, setMotsJournal] = useState(0);
  const [themes, setThemes] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    let annule = false;
    void (async () => {
      const metas = FICHES_META.filter((fiche) => fiche.id <= Math.max(1, preparationStep));
      const details = await Promise.all(
        metas.map(async (fiche) => {
          const answers = await getAnswers(user.uid, fiche.id);
          const contenus = Object.values(answers).filter(
            (valeur): valeur is string => typeof valeur === 'string' && valeur.trim().length > 0
          );
          return {
            id: fiche.id,
            titre: fiche.titre,
            reponses: contenus.length,
            mots: contenus.join(' ').split(/\s+/).filter(Boolean).length,
            terminee: contenus.length >= Math.max(1, Math.floor(fiche.nbQuestions * 0.6)),
            texte: contenus.join(' '),
          };
        })
      );
      const journal = await getJournalEntries(user.uid);
      const texteGlobal = `${details.map((detail) => detail.texte).join(' ')} ${journal.map((entree) => entree.content).join(' ')}`;
      const frequences = new Map<string, number>();
      for (const motBrut of texteGlobal.toLocaleLowerCase('fr').match(/[a-zà-ÿ]{4,}/g) ?? []) {
        if (MOTS_OUTILS.has(motBrut)) continue;
        frequences.set(motBrut, (frequences.get(motBrut) ?? 0) + 1);
      }
      if (!annule) {
        setTraces(details.map(({ texte: _texte, ...detail }) => detail));
        setMotsJournal(journal.reduce((total, entree) => total + entree.content.split(/\s+/).filter(Boolean).length, 0));
        setThemes([...frequences].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([mot]) => mot));
      }
    })();
    return () => {
      annule = true;
    };
  }, [preparationStep, user]);

  const statistiques = useMemo(() => {
    const state = user ? etatMemoireLocal(user.uid) : {};
    return {
      ecrits: traces?.reduce((total, trace) => total + trace.reponses, 0) ?? 0,
      mots: (traces?.reduce((total, trace) => total + trace.mots, 0) ?? 0) + motsJournal,
      verses: Object.values(state).filter((record) => record.masteredAt).length,
    };
  }, [motsJournal, traces, user]);

  return (
    <div className="table-travail min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-center">
          <div>
            <span className="etiquette-classee -rotate-1">Dossier de route · personnel</span>
            <h1 className="mt-5 font-serif text-4xl font-bold text-encre-950 sm:text-5xl">Votre chemin, visible sur la table</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-encre-600">
              Ce tableau ne mesure pas votre foi. Il rend visibles vos gestes de fidélité : lire,
              répondre, écrire, revenir et mémoriser.
            </p>
          </div>
          <div className="post-it-rose rotate-1 p-6 shadow-md">
            <Sparkles className="h-5 w-5 text-rose-700" />
            <p className="manuscrit mt-3 text-3xl font-bold text-encre-950">Les traces comptent</p>
            <p className="mt-2 text-xs leading-relaxed text-encre-700">Relisez-les pour discerner, jamais pour vous comparer.</p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: PenLine, value: statistiques.ecrits, label: 'réponses déposées', tone: 'post-it-jaune -rotate-1' },
            { icon: BookOpen, value: statistiques.mots, label: 'mots écrits', tone: 'post-it-bleu rotate-1' },
            { icon: MessageCircleHeart, value: statistiques.verses, label: 'versets retenus', tone: 'post-it-rose -rotate-[0.5deg]' },
          ].map(({ icon: Icon, value, label, tone }) => (
            <div key={label} className={`${tone} p-6 shadow-sm`}>
              <Icon className="h-5 w-5 text-encre-600" />
              <p className="manuscrit mt-3 text-5xl font-bold text-encre-950">{value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-encre-600">{label}</p>
            </div>
          ))}
        </section>

        <section className="feuille relative mt-8 rounded-[2rem] border border-parchemin-400 p-5 shadow-lg sm:p-8">
          <span className="trombone" aria-hidden="true" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-2xs font-black uppercase tracking-[0.18em] text-or-700">Frise des fiches</p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-encre-950">Ce que vous avez déjà travaillé</h2>
            </div>
            <CalendarDays className="h-6 w-6 text-encre-300" />
          </div>

          {!traces ? (
            <p className="py-12 text-center text-sm text-encre-400">Rassemblement des pages…</p>
          ) : (
            <ol className="relative mt-8 space-y-4 before:absolute before:bottom-4 before:left-[1.15rem] before:top-4 before:w-px before:bg-or-300 sm:before:left-[1.4rem]">
              {traces.map((trace) => (
                <li key={trace.id} className="relative grid grid-cols-[2.4rem_1fr] gap-4 sm:grid-cols-[3rem_1fr]">
                  <span className={`relative z-10 grid h-9 w-9 place-items-center rounded-full border-4 border-parchemin-50 text-xs font-black sm:h-11 sm:w-11 ${trace.reponses ? 'bg-or-500 text-encre-950' : 'bg-parchemin-300 text-encre-500'}`}>{trace.id}</span>
                  <Link href={`/fiches/${trace.id}`} className="fiche-bristol rounded-2xl border border-parchemin-300 px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-serif text-base font-bold text-encre-950">{trace.titre}</p>
                        <p className="mt-0.5 text-2xs text-encre-500">{trace.reponses} réponse{trace.reponses > 1 ? 's' : ''} · {trace.mots} mots</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-or-700" />
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_18rem]">
          <div className="fiche-bristol rounded-3xl p-6 shadow-sm">
            <p className="text-2xs font-black uppercase tracking-[0.16em] text-or-700">Mots qui reviennent</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {themes.length ? themes.map((theme, index) => (
                <span key={theme} className={`rounded-full px-4 py-2 font-serif font-bold ${index % 3 === 0 ? 'bg-or-100 text-or-900' : index % 3 === 1 ? 'bg-indigo-100 text-indigo-900' : 'bg-rose-100 text-rose-900'}`}>{theme}</span>
              )) : <p className="text-xs text-encre-500">Écrivez quelques réponses : vos thèmes apparaîtront ici.</p>}
            </div>
          </div>
          <Link href="/recherche" className="nuit nuit-grain rounded-3xl p-6 text-parchemin-100 shadow-md transition hover:-translate-y-1">
            <p className="font-serif text-xl font-bold">Relire une trace précise</p>
            <p className="mt-2 text-xs leading-relaxed text-parchemin-100/70">Chercher un mot dans toutes vos pages.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-or-300">Ouvrir l’index <ArrowRight className="h-4 w-4" /></span>
          </Link>
        </section>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ParcoursGate acces="personnel">
      <TransformationContent />
    </ParcoursGate>
  );
}
