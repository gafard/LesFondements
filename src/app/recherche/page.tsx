'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, FileText, PenLine, Search, X } from 'lucide-react';
import ParcoursGate from '@/components/ParcoursGate';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { getAnswers, getJournalEntries, timestampToDate } from '@/lib/firestore';
import { chargerLivret, questionsDe } from '@/lib/livret';

interface EcritIndexe {
  id: string;
  type: 'fiche' | 'journal';
  titre: string;
  contexte: string;
  contenu: string;
  href: string;
  date?: Date;
}

function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr');
}

function RechercheContent() {
  const { user } = useAuth();
  const { preparationStep } = useParcours();
  const [requete, setRequete] = useState('');
  const [ecrits, setEcrits] = useState<EcritIndexe[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let annule = false;
    void (async () => {
      const livret = await chargerLivret();
      const fiches = livret.fiches.filter((fiche) => fiche.id <= Math.max(1, preparationStep));
      const reponsesParFiche = await Promise.all(
        fiches.map(async (fiche) => ({ fiche, answers: await getAnswers(user.uid, fiche.id) }))
      );
      const journal = await getJournalEntries(user.uid);

      const contenus: EcritIndexe[] = reponsesParFiche.flatMap(({ fiche, answers }) => {
        const questions = new Map(questionsDe(fiche).map((question) => [question.id, question.texte]));
        return Object.entries(answers)
          .filter(([, contenu]) => typeof contenu === 'string' && contenu.trim().length > 0)
          .map(([questionId, contenu]) => ({
            id: `f${fiche.id}-${questionId}`,
            type: 'fiche' as const,
            titre: `Fiche ${fiche.id} · ${fiche.titre}`,
            contexte: questions.get(questionId) ?? (questionId.startsWith('v:') ? `Verset recopié · ${questionId.slice(2)}` : 'Note personnelle'),
            contenu: String(contenu),
            href: `/fiches/${fiche.id}`,
          }));
      });

      contenus.push(
        ...journal.map((entree) => ({
          id: `journal-${entree.id}`,
          type: 'journal' as const,
          titre: entree.title?.trim() || 'Page de journal',
          contexte: timestampToDate(entree.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          contenu: entree.content,
          href: '/journal',
          date: timestampToDate(entree.createdAt),
        }))
      );

      if (!annule) setEcrits(contenus);
    })();
    return () => {
      annule = true;
    };
  }, [preparationStep, user]);

  const resultats = useMemo(() => {
    const termes = normaliser(requete).split(/\s+/).filter(Boolean);
    if (!termes.length) return [];
    return (ecrits ?? []).filter((ecrit) => {
      const meule = normaliser(`${ecrit.titre} ${ecrit.contexte} ${ecrit.contenu}`);
      return termes.every((terme) => meule.includes(terme));
    });
  }, [ecrits, requete]);

  return (
    <div className="table-travail min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="relative mb-8 grid gap-6 lg:grid-cols-[1fr_17rem] lg:items-end">
          <div>
            <span className="etiquette-classee -rotate-1">Index personnel · privé</span>
            <h1 className="mt-5 max-w-2xl font-serif text-4xl font-bold leading-tight text-encre-950 sm:text-5xl">
              Retrouver un mot dans votre carnet
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-encre-600">
              Recherchez simultanément dans vos réponses, les versets recopiés et votre journal.
              Rien n’est partagé avec le groupe.
            </p>
          </div>
          <div className="post-it-jaune rotate-1 p-5 shadow-md">
            <p className="manuscrit text-2xl font-bold text-encre-900">Votre mémoire externe</p>
            <p className="mt-2 text-xs leading-relaxed text-encre-700">
              {ecrits?.length ?? '…'} écrits déjà classés sur ce bureau.
            </p>
          </div>
        </header>

        <div className="feuille relative rounded-[2rem] border border-parchemin-400 p-4 shadow-lg sm:p-6">
          <span className="trombone" aria-hidden="true" />
          <label htmlFor="recherche-carnet" className="sr-only">Rechercher dans mes écrits</label>
          <div className="flex items-center gap-3 rounded-2xl border-2 border-encre-200 bg-white px-4 py-3 focus-within:border-or-500 focus-within:ring-4 focus-within:ring-or-200/50">
            <Search className="h-5 w-5 shrink-0 text-encre-400" />
            <input
              id="recherche-carnet"
              value={requete}
              onChange={(event) => setRequete(event.target.value)}
              placeholder="Ex. pardon, appel, confiance, famille…"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-base text-encre-950 outline-none placeholder:text-encre-300"
            />
            {requete && (
              <button onClick={() => setRequete('')} aria-label="Effacer la recherche" className="rounded-full p-1 text-encre-400 hover:bg-parchemin-200 hover:text-encre-900">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <section className="mt-7" aria-live="polite">
          {!ecrits ? (
            <p className="py-12 text-center font-serif text-sm text-encre-500">Classement des pages en cours…</p>
          ) : !requete.trim() ? (
            <div className="bureau-grille grid gap-4 sm:grid-cols-3">
              {['Une réponse précise', 'Un verset recopié', 'Une page de journal'].map((texte, index) => (
                <div key={texte} className={`post-it-${index === 1 ? 'rose' : index === 2 ? 'bleu' : 'jaune'} p-5 shadow-sm ${index === 0 ? '-rotate-1' : index === 2 ? 'rotate-1' : ''}`}>
                  <span className="text-2xs font-black uppercase tracking-[0.16em] text-encre-500">Vous pouvez retrouver</span>
                  <p className="manuscrit mt-3 text-2xl font-bold text-encre-900">{texte}</p>
                </div>
              ))}
            </div>
          ) : resultats.length === 0 ? (
            <div className="fiche-bristol rounded-3xl p-10 text-center shadow-sm">
              <FileText className="mx-auto h-7 w-7 text-encre-300" />
              <p className="mt-3 font-serif text-lg font-bold text-encre-800">Aucune page ne contient « {requete} »</p>
              <p className="mt-1 text-xs text-encre-500">Essayez un mot plus court ou un synonyme.</p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-xs font-bold text-encre-500">
                {resultats.length} résultat{resultats.length > 1 ? 's' : ''} retrouvé{resultats.length > 1 ? 's' : ''}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {resultats.map((resultat, index) => (
                  <Link
                    key={resultat.id}
                    href={resultat.href}
                    className={`fiche-bristol group relative rounded-3xl border border-parchemin-400 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${index % 3 === 1 ? 'md:rotate-[0.35deg]' : ''}`}
                  >
                    <span className="ruban -top-2.5 left-8 rotate-[-2deg]" />
                    <div className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-parchemin-200 text-or-700">
                        {resultat.type === 'journal' ? <PenLine className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-2xs font-black uppercase tracking-[0.12em] text-or-700">{resultat.titre}</p>
                        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-encre-600">{resultat.contexte}</p>
                      </div>
                    </div>
                    <blockquote className="mt-4 border-l-2 border-or-400 pl-4 font-serif text-base leading-relaxed text-encre-900">
                      {resultat.contenu}
                    </blockquote>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ParcoursGate acces="personnel">
      <RechercheContent />
    </ParcoursGate>
  );
}
