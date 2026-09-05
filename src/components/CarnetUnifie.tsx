'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Star, BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCarnet } from '@/lib/useCarnet';
import { NATURES_TRACE } from '@/lib/habiter';
import { saveAnswer } from '@/lib/firestore';
import { FICHES_META } from '@/data/fichesMeta';

export default function CarnetUnifie() {
  const { user } = useAuth();
  const { ecrits, chargement } = useCarnet(user?.uid);
  const [filtre, setFiltre] = useState('tout');
  const [fiche, setFiche] = useState('toutes');
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState('');
  const visibles = ecrits.filter(e => (fiche === 'toutes' || e.ficheId === Number(fiche))
    && (filtre === 'tout' || (filtre === 'favoris' ? e.favori : e.nature === filtre))
    && `${e.titre} ${e.contenu} ${e.reference || ''}`.toLocaleLowerCase('fr').includes(recherche.toLocaleLowerCase('fr')))
    .sort((a, b) => (b.date || 0) - (a.date || 0) || b.ficheId - a.ficheId);
  return <section className="mb-10" aria-label="Mes écrits du parcours">
    <div className="flex flex-wrap gap-3 text-sm font-semibold">
      <Link href="/transformation" className="rounded-full border border-parchemin-400 px-4 py-3">Relire mes pas</Link>
      <Link href="/carnet-export" className="rounded-full border border-parchemin-400 px-4 py-3">Composer mon export</Link>
      <Link href="/recherche" className="rounded-full border border-parchemin-400 px-4 py-3">Chercher aussi dans le journal</Link>
    </div>
    <h2 className="mt-8 font-serif text-2xl font-bold text-encre-950">Les pages de mon parcours</h2>
    <p className="mt-2 text-sm text-encre-600">Réponses, prières, questions, versets et relectures. L’étoile garde une page à retrouver.</p>
    <div className="my-5 grid gap-3 sm:grid-cols-2">
      <label className="text-sm text-encre-700">Type d’écrit<select className="mt-1 min-h-11 w-full rounded-xl border border-parchemin-400 bg-white px-3" value={filtre} onChange={e => setFiltre(e.target.value)}>
        <option value="tout">Tous les écrits</option><option value="favoris">Pages étoilées</option>
        {Object.entries(NATURES_TRACE).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        <option value="verset">Paroles gardées</option><option value="relecture">Relectures</option><option value="note">Réponses et notes</option>
      </select></label>
      <label className="text-sm text-encre-700">Fiche<select className="mt-1 min-h-11 w-full rounded-xl border border-parchemin-400 bg-white px-3" value={fiche} onChange={e => setFiche(e.target.value)}><option value="toutes">Toutes les fiches</option>{FICHES_META.map(f => <option key={f.id} value={f.id}>{f.id} · {f.titre}</option>)}</select></label>
      <label className="text-sm text-encre-700 sm:col-span-2">Un mot à retrouver<input type="search" className="mt-1 min-h-11 w-full rounded-xl border border-parchemin-400 bg-white px-3" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Confiance, grâce, une question…" /></label>
    </div>
    {erreur && <p role="alert">{erreur}</p>}
    {chargement && <p role="status" className="py-4 text-sm text-encre-600">Ouverture des pages de votre compte…</p>}
    {!chargement && !visibles.length && <p className="rounded-2xl border border-dashed border-parchemin-400 p-6 text-sm text-encre-600">{ecrits.length ? 'Aucune page pour ces critères.' : 'Votre carnet se remplira avec les mots que vous choisirez de garder. Vous pouvez commencer par une note libre ci-dessous.'}</p>}
    <div className="space-y-4">{visibles.map(e => <article key={`${e.ficheId}:${e.id}`} className="feuille rounded-2xl border border-parchemin-300 p-5 text-encre-950">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-or-800">Fiche {e.ficheId} · {e.titre}</p>{e.date && <p className="mt-1 text-xs text-encre-500">{new Date(e.date).toLocaleDateString('fr-FR')}</p>}</div>
        <button aria-label={e.favori ? 'Retirer des pages étoilées' : 'Garder dans les pages étoilées'} aria-pressed={e.favori} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-parchemin-300 text-or-800" onClick={() => { if (user) void saveAnswer(user.uid, e.ficheId, `favori:${e.id}`, e.favori ? '' : '1').catch(() => setErreur('Le choix n’a pas été conservé. Réessayez.')); }}><Star className={`h-5 w-5 ${e.favori ? 'fill-current' : ''}`} /></button>
      </div>
      {e.reference && <p className="mt-3 text-sm font-semibold">{e.reference}</p>}
      <p className="mt-3 whitespace-pre-wrap break-words font-serif text-base leading-relaxed">{e.contenu}</p>
      <Link href={e.href} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-encre-700"><BookOpen className="h-4 w-4" />Retrouver dans le parcours</Link>
    </article>)}</div>
  </section>;
}
