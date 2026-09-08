'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, ChevronDown, LayoutGrid, Lock, Route, Search, Users } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { etapePersonnelle } from '@/lib/parcoursDomain';
import ParcoursGate from '@/components/ParcoursGate';
import { FICHES_META } from '@/data/fichesMeta';

const CHAPITRES = [
  { id: 1, titre: 'Recevoir', sous: 'Dieu, le salut, la grâce et notre identité en Christ.', debut: 1, fin: 5 },
  { id: 2, titre: 'Être transformé', sous: 'Vie nouvelle, liberté, pardon et puissance du Saint-Esprit.', debut: 6, fin: 10 },
  { id: 3, titre: 'Devenir disciple', sous: 'Dons spirituels, caractère, Église et mission.', debut: 11, fin: 15 },
  { id: 4, titre: 'Demeurer et espérer', sous: 'Prière, Bible, alliances et espérance éternelle.', debut: 16, fin: 20 },
];

function SentierContent() {
  const { user } = useAuth();
  const { group, profile, membership, preparationStep, completedFiches, loading } = useParcours();
  const [recherche, setRecherche] = useState('');
  const [vue, setVue] = useState<'sentier' | 'grille'>('sentier');
  const maxAccessible = Math.min(20, Math.max(1, preparationStep));
  const personnelle = etapePersonnelle(completedFiches);
  const attendCellule = !!group && personnelle > group.currentStep;
  const personnel = !group && profile?.studyMode === 'personnel';
  const chapitreActuel = Math.ceil(maxAccessible / 5);
  const normaliser = (texte: string) => texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const q = normaliser(recherche.trim());
  const filtrees = FICHES_META.filter(fiche => !q || normaliser(`${fiche.titre} ${fiche.sousTitre}`).includes(q) || String(fiche.id) === q);
  const terminees = group?.closedSteps.length ?? completedFiches.length;
  const parcoursTermine = completedFiches.length === 20 && (!group || !!group.completedAt);
  const raison = !group && !personnel ? 'La fiche 1 est ouverte. Choisis ensuite ton chemin pour poursuivre.'
    : attendCellule ? `Ta préparation est terminée. La cellule poursuit la fiche ${group.currentStep} ; la suite s’ouvrira après sa clôture.`
    : `Poursuis la fiche ${maxAccessible} avant d’ouvrir la suivante.${group ? ` Ta cellule en est à la fiche ${group.currentStep}.` : ''}`;

  const carte = (fiche: typeof FICHES_META[number]) => {
    const fermee = fiche.id > maxAccessible || (!group && !personnel && fiche.id > 1);
    const partagee = !!group?.closedSteps.includes(fiche.id);
    const preparee = completedFiches.includes(fiche.id) || !!membership?.preparedSteps.includes(fiche.id);
    const courante = fiche.id === maxAccessible && !fermee;
    const label = fermee ? 'À venir' : partagee ? 'Partagée en cellule' : preparee ? 'Préparation terminée' : courante ? 'À poursuivre' : 'À relire';
    const attente = !group && !personnel ? 'Découvre la fiche 1, puis choisis ton chemin.'
      : attendCellule ? `Après la clôture de la fiche ${group.currentStep}, au fil des rencontres.`
      : `Commence par terminer la fiche ${maxAccessible}.${group && fiche.id > group.currentStep ? ' La suite suit aussi le rythme de la cellule.' : ''}`;
    const contenu = <>
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${courante ? 'bg-or-300 text-encre-950' : 'bg-parchemin-100 text-encre-700'}`}>{String(fiche.id).padStart(2, '0')}</span>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${partagee || preparee ? 'text-emerald-800' : 'text-encre-600'}`}>{fermee ? <Lock className="h-3.5 w-3.5" /> : partagee || preparee ? <Check className="h-3.5 w-3.5" /> : null}{label}</span>
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold leading-snug text-encre-950">{fiche.titre}</h3>
      <p className="mt-2 text-sm leading-relaxed text-encre-700">{fiche.sousTitre}</p>
      <p className="mt-5 flex items-center gap-2 border-t border-parchemin-200 pt-4 text-sm leading-relaxed">{fermee ? attente : <>{preparee || partagee ? 'Relire la fiche' : 'Ouvrir la fiche'}<ArrowRight className="h-4 w-4 shrink-0" /></>}</p>
    </>;
    return fermee ? <div key={fiche.id} className="rounded-2xl border border-parchemin-300 bg-parchemin-50 p-5 text-encre-600">{contenu}</div>
      : <Link key={fiche.id} href={`/fiches/${fiche.id}`} aria-current={courante ? 'step' : undefined} className={`block rounded-2xl border bg-white p-5 transition-colors hover:border-or-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-or-700 ${courante ? 'border-or-500 ring-1 ring-or-300' : 'border-parchemin-300'}`}>{contenu}</Link>;
  };

  return <div className="min-h-screen bg-parchemin-50 px-4 py-7 text-encre-950 sm:px-7">
    <div className="mx-auto max-w-5xl">
      <header className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-or-800">Quatre chapitres · Vingt fiches</p>
        <h1 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">Le sentier des 20 fondements</h1>
        <p className="mt-4 text-base leading-relaxed text-encre-700">Un passage à découvrir, un temps pour répondre, une rencontre pour partager.</p>
      </header>
      {user && loading ? <p role="status" className="my-8">Ouverture de ta progression…</p> : <>
        <section className="my-7 rounded-3xl border border-or-200 bg-white p-6" aria-label="Mon prochain pas">
          <p className="text-xs font-bold uppercase tracking-widest text-or-800">{group ? group.name : personnel ? 'Mon chemin personnel' : 'Découvrir le parcours'}</p>
          <h2 className="mt-3 font-serif text-xl font-bold">{parcoursTermine ? 'Vingt fiches parcourues' : attendCellule ? 'Le temps de se retrouver' : `Ton prochain pas · Fiche ${maxAccessible}`}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-encre-700">{parcoursTermine ? 'Reviens sur les passages et les découvertes que tu souhaites garder.' : raison}</p>
          <Link href={parcoursTermine ? '/certificat' : attendCellule ? '/groupes' : `/aujourdhui?fiche=${maxAccessible}`} className="bouton-or mt-5 inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-bold">{parcoursTermine ? 'Relire mon parcours' : attendCellule ? 'Préparer la rencontre' : 'Reprendre mon temps'}<ArrowRight className="h-4 w-4" /></Link>
          {!group && !personnel && <Link href="/onboarding" className="ml-0 mt-3 flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 sm:ml-5 sm:inline-flex"><Users className="h-4 w-4" />Choisir mon chemin</Link>}
          {user && <p className="mt-4 text-sm text-encre-600">{terminees}/20 fiches {group ? 'partagées en cellule' : 'préparées'} · Tes réponses restent privées.</p>}
        </section>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1"><label htmlFor="recherche-fiches" className="mb-2 block text-sm font-semibold">Retrouver une fiche</label><div className="relative"><Search className="absolute left-4 top-4 h-4 w-4 text-encre-600" /><input id="recherche-fiches" value={recherche} onChange={event => setRecherche(event.target.value)} placeholder="Grâce, pardon, prière…" className="min-h-12 w-full rounded-xl border border-parchemin-300 bg-white pl-11 pr-4 text-base focus:outline-2 focus:outline-or-600" /></div></div>
          <div className="flex gap-2" aria-label="Présentation du parcours">{[{ valeur: 'sentier' as const, label: 'Chapitres', icone: Route }, { valeur: 'grille' as const, label: 'Toutes les fiches', icone: LayoutGrid }].map(option => <button key={option.valeur} aria-pressed={vue === option.valeur} onClick={() => setVue(option.valeur)} className={`inline-flex min-h-12 items-center gap-2 rounded-xl border px-4 text-sm ${vue === option.valeur ? 'border-encre-950 bg-encre-950 text-white' : 'border-parchemin-300 bg-white'}`}><option.icone className="h-4 w-4" />{option.label}</button>)}</div>
        </div>
        {filtrees.length === 0 && <div role="status" className="rounded-2xl border border-parchemin-300 p-7"><p>Aucune fiche pour « {recherche} ».</p><button onClick={() => setRecherche('')} className="mt-3 min-h-11 font-semibold underline">Voir les vingt fiches</button></div>}
        {vue === 'grille' ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtrees.map(carte)}</div> : <div className="space-y-4">{CHAPITRES.map(chapitre => {
          const fiches = filtrees.filter(f => f.id >= chapitre.debut && f.id <= chapitre.fin);
          if (!fiches.length) return null;
          const actuel = chapitre.id === chapitreActuel;
          const nombre = (group?.closedSteps ?? completedFiches).filter(id => id >= chapitre.debut && id <= chapitre.fin).length;
          return <details key={`${chapitre.id}:${chapitreActuel}:${!!q}`} open={actuel || !!q} className="group rounded-3xl border border-parchemin-300 bg-white p-5 sm:p-6">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-4"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-serif text-lg ${actuel ? 'bg-encre-950 text-or-300' : 'bg-parchemin-100 text-encre-700'}`}>{chapitre.id}</span><span className="flex-1"><span className="block text-xs font-semibold text-or-800">Fiches {chapitre.debut}–{chapitre.fin}{actuel ? ' · Chapitre actuel' : ''}</span><h2 className="mt-1 font-serif text-xl font-bold sm:text-2xl">{chapitre.titre}</h2><span className="mt-1 block text-xs text-encre-600">{nombre}/5 {group ? 'partagées' : 'préparées'}</span></span><ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" /></summary>
            <p className="my-5 text-sm leading-relaxed text-encre-700">{chapitre.sous}</p><div className="grid gap-4 sm:grid-cols-2">{fiches.map(carte)}</div>
          </details>;
        })}</div>}
        <p className="mt-8 flex items-start gap-2 text-sm leading-relaxed text-encre-600"><BookOpen className="mt-0.5 h-4 w-4 shrink-0" />Les fiches déjà ouvertes restent disponibles pour la relecture.</p>
      </>}
    </div>
  </div>;
}

export default function Page() {
  return <ParcoursGate acces="decouverte"><SentierContent /></ParcoursGate>;
}
