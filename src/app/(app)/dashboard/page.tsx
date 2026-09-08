'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BellRing, Bookmark, Check, ChevronDown, Play, Users } from 'lucide-react';
import ParcoursGate from '@/components/ParcoursGate';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { getAnswers } from '@/lib/firestore';
import { chargerFiche, type FicheLivret } from '@/lib/livret';
import NotificationCenter from '@/components/NotificationCenter';
import LecteurVideoOnboarding from '@/components/LecteurVideoOnboarding';
import { VERSETS_CONNUS, normaliserReference, texteDuVerset } from '@/data/versets';
import { etapesTempsApart } from '@/lib/tempsApart';
import ReprendreParole from '@/components/ReprendreParole';
import RecapManque from '@/components/RecapManque';
import { PasDuJour } from '@/components/PasDeVie';

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { preparationStep } = useParcours();
  const ficheId = Math.max(1, preparationStep);
  return <ParcoursGate acces="personnel"><DashboardContent key={`${user?.uid}:${ficheId}`} ficheId={ficheId} /></ParcoursGate>;
}

function DashboardContent({ ficheId }: { ficheId: number }) {
  const { user } = useAuth();
  const { group, completedFiches, profile, updateProfile } = useParcours();
  const [contenu, setContenu] = useState<{ fiche: FicheLivret; reponses: Record<string, string> } | null>(null);
  const [erreur, setErreur] = useState(false);
  const [notifOuvert, setNotifOuvert] = useState(false);
  const [prologueOuvert, setPrologueOuvert] = useState(false);
  const boutonPrologue = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let actif = true;
    void Promise.all([chargerFiche(ficheId), user ? getAnswers(user.uid, ficheId) : Promise.resolve({})])
      .then(([fiche, reponses]) => {
        if (!actif) return;
        if (fiche) setContenu({ fiche, reponses });
        else setErreur(true);
      }).catch(() => { if (actif) setErreur(true); });
    return () => { actif = false; };
  }, [ficheId, user]);
  const sections = contenu ? etapesTempsApart(contenu.fiche) : [];
  const faites = sections.filter((_, i) => !!contenu?.reponses[`temps-apart:${i}`]).length;
  const prochaine = Math.max(0, sections.findIndex((_, i) => !contenu?.reponses[`temps-apart:${i}`]));
  const terminee = completedFiches.includes(ficheId) || (sections.length > 0 && faites === sections.length);
  const parcoursTermine = completedFiches.length === 20 && (!group || !!group.completedAt);
  const paroles = sections.map((_, i) => contenu?.reponses[`verset-choisi:f${ficheId}-s${i + 1}`]).filter(Boolean);
  const refVerset = paroles.at(-1) || contenu?.fiche.resume?.[0]?.versets?.[0];
  const verset = refVerset ? VERSETS_CONNUS[normaliserReference(refVerset)] || texteDuVerset(refVerset) : null;
  const noterPrologue = () => {
    if (profile && !profile.onboardingSeenAt) void updateProfile({ onboardingSeenAt: Date.now() });
  };
  return (
    <div className="min-h-screen bg-parchemin-50 px-4 pb-10 pt-7 text-encre-950 sm:px-7">
      <div className="mx-auto max-w-4xl space-y-7">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-or-800">Aujourd’hui</p>
          <h1 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">Bonjour{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}.</h1>
        </header>
        {contenu ? <ReprendreParole ficheId={ficheId} section={prochaine} titre={contenu.fiche.titre} titreSection={sections[prochaine]?.section.titre || contenu.fiche.titre} terminee={terminee} enCellule={!!group} parcoursTermine={parcoursTermine} />
          : erreur ? <p role="alert">Ce temps n’a pas pu être chargé. <Link href={`/fiches/${ficheId}`} className="underline">Ouvrir la fiche {ficheId}</Link></p>
          : <div role="status" className="h-64 rounded-3xl bg-parchemin-200 p-7 motion-safe:animate-pulse">Ouverture de ton prochain temps…</div>}

        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-3xl border border-parchemin-300 bg-white p-6" aria-labelledby="rencontre-titre">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-or-800"><Users className="h-4 w-4" />{group ? 'La prochaine rencontre' : 'Grandir ensemble'}</p>
            <h2 id="rencontre-titre" className="mt-4 font-serif text-xl font-bold">{group?.name || 'Une place dans une cellule'}</h2>
            <p className="mt-3 text-sm leading-relaxed text-encre-700">{group ? `${JOURS[group.meeting.weekday]} à ${group.meeting.time} · ${group.meeting.timezone}` : 'Quelques personnes avec qui partager tes découvertes, tes questions et la prière.'}</p>
            {group && <p className="mt-2 text-sm text-encre-700">Fiche {group.currentStep} · {group.meeting.mode === 'ligne' ? 'En ligne' : group.meeting.mode === 'hybride' ? 'Sur place ou en ligne' : 'Sur place'}</p>}
            <Link href="/groupes" className="mt-4 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4">{group ? 'Voir ma cellule et préparer le partage' : 'Découvrir les cellules'}</Link>
          </section>
          {refVerset && <section className="rounded-3xl border border-or-200 bg-or-50 p-6" aria-labelledby="parole-titre">
            <h2 id="parole-titre" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-or-800"><Bookmark className="h-4 w-4" />{paroles.length ? 'La Parole que tu gardes' : 'Un passage à découvrir'}</h2>
            {verset && <blockquote className="mt-4 font-serif text-lg leading-relaxed">« {verset} »</blockquote>}
            <p className="mt-3 text-sm font-semibold text-or-900">{refVerset}</p>
            <Link href={paroles.length ? '/memorisation' : `/fiches/${ficheId}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4">{paroles.length ? 'Revoir cette Parole' : 'Lire dans la fiche'}</Link>
          </section>}
        </div>

        <PasDuJour ficheId={ficheId} masquerSiVide />
        <RecapManque key={`${user?.uid}:${group?.id}`} />
        {contenu && <details className="group rounded-2xl border border-parchemin-300 bg-white p-5">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold"><span>Les temps de cette fiche · {faites}/{sections.length}</span><ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" /></summary>
          <ol className="mt-4 divide-y divide-parchemin-200">
            {sections.map((sec, idx) => {
              const fait = !!contenu.reponses[`temps-apart:${idx}`];
              const accessible = fait || idx === prochaine || terminee;
              return <li key={idx} className="py-3">{accessible ? <Link href={`/aujourdhui?fiche=${ficheId}&section=${idx}`} className="flex min-h-11 items-center gap-3 text-sm"><span className="text-or-800">{fait ? <Check className="h-4 w-4" /> : idx + 1}</span><span>{sec.section.titre}<span className="mt-1 block text-xs text-encre-600">{fait ? 'Temps terminé · relire' : terminee ? 'Relire' : 'Prochain temps'}</span></span></Link> : <p className="text-sm text-encre-600">{idx + 1}. {sec.section.titre} · À venir</p>}</li>;
            })}
          </ol>
        </details>}
        <section className="border-t border-parchemin-300 pt-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <button ref={boutonPrologue} onClick={() => setPrologueOuvert(true)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><Play className="h-4 w-4 text-or-800" />{profile?.onboardingSeenAt ? 'Revoir le prologue · 50 s' : 'Découvrir le parcours · 50 s'}</button>
            <button onClick={() => setNotifOuvert(true)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold"><BellRing className="h-4 w-4 text-or-800" />Choisir mes rappels</button>
          </div>
          {!profile?.onboardingSeenAt && <p className="mt-1 text-sm text-encre-600">Le prologue présente le rythme des vingt fiches et la vie en cellule.</p>}
        </section>
      </div>
      <NotificationCenter ouvert={notifOuvert} onFermer={() => setNotifOuvert(false)} />
      {prologueOuvert && <Prologue onFermer={() => { setPrologueOuvert(false); boutonPrologue.current?.focus(); }} onVu={noterPrologue} />}
    </div>
  );
}

function Prologue({ onFermer, onVu }: { onFermer: () => void; onVu: () => void }) {
  const dialogue = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialogue.current?.showModal(); }, []);
  const fermer = () => { dialogue.current?.close(); onFermer(); };
  return <dialog aria-label="Découvrir le parcours" ref={dialogue} onCancel={event => { event.preventDefault(); fermer(); }} onClick={event => { if (event.target === event.currentTarget) fermer(); }} className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-2xl rounded-3xl border border-white/20 bg-encre-950 p-5 text-parchemin-100 shadow-2xl backdrop:bg-encre-950/85">
    <div className="mb-4 flex items-center justify-between gap-4"><p className="font-serif text-lg">Le prologue · Les Fondements</p><button autoFocus onClick={fermer} className="min-h-11 rounded-full bg-white/10 px-4 text-sm">Fermer</button></div>
    <LecteurVideoOnboarding src="/video/onboarding.mp4" poster="/video/onboarding_poster.jpg" autoPlay titre="Prologue officiel (50s)" sousTitre="Poser des piliers solides" onPasser={fermer} onVideoEnded={onVu} />
  </dialog>;
}
