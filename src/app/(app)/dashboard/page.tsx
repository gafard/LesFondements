'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BellRing, Play, Sunrise, Users } from 'lucide-react';
import ParcoursGate from '@/components/ParcoursGate';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import NotificationCenter from '@/components/NotificationCenter';
import LecteurVideoOnboarding from '@/components/LecteurVideoOnboarding';
import RecapManque from '@/components/RecapManque';
import { FICHES_META } from '@/data/fichesMeta';

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { preparationStep } = useParcours();
  const ficheId = Math.max(1, preparationStep);
  return <ParcoursGate acces="personnel"><DashboardContent key={`${user?.uid}:${ficheId}`} ficheId={ficheId} /></ParcoursGate>;
}

function DashboardContent({ ficheId }: { ficheId: number }) {
  const { user } = useAuth();
  const { group, completedFiches, membership, profile, updateProfile } = useParcours();
  const [notifOuvert, setNotifOuvert] = useState(false);
  const [prologueOuvert, setPrologueOuvert] = useState(false);
  const boutonPrologue = useRef<HTMLButtonElement>(null);
  const meta = FICHES_META.find((fiche) => fiche.id === ficheId);
  const preparee = completedFiches.includes(ficheId) || !!membership?.preparedSteps.includes(ficheId);
  const parcoursTermine = completedFiches.length === 20 && (!group || !!group.completedAt);
  const noterPrologue = () => {
    if (profile && !profile.onboardingSeenAt) void updateProfile({ onboardingSeenAt: Date.now() });
  };
  // Le tableau de bord redisait ce que la fiche, le carnet et la cellule
  // disent déjà : verset du jour, pas à vivre, découpage en temps quotidiens.
  // Il ne garde que l'essentiel : la fiche à étudier, et la rencontre.
  return (
    <div className="min-h-screen bg-parchemin-50 px-4 pb-10 pt-7 text-encre-950 sm:px-7">
      <div className="mx-auto max-w-4xl space-y-7">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-or-800">Aujourd’hui</p>
          <h1 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">Bonjour{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}.</h1>
        </header>

        <section className="nuit relative overflow-hidden rounded-3xl border border-or-300/20 p-6 text-parchemin-100 sm:p-9" aria-labelledby="fiche-en-cours">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-or-300">
            {parcoursTermine ? 'Le chemin parcouru' : preparee ? 'Fiche préparée' : 'Ma fiche en cours'}
          </p>
          <p className="mt-5 text-sm text-parchemin-100/75">Fiche {ficheId} sur 20</p>
          <h2 id="fiche-en-cours" className="mt-2 max-w-2xl font-serif text-3xl font-bold leading-tight sm:text-4xl">
            {parcoursTermine ? 'Vingt fiches parcourues.' : meta?.titre}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-parchemin-100/80">
            {parcoursTermine
              ? 'Retrouve dans ton carnet les passages et les mots qui ont accompagné tes vingt fiches.'
              : 'L’exposé, le résumé à partager et les annexes. Libre à toi de l’étudier à ton rythme : un peu chaque jour, ou en une seule fois.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href={parcoursTermine ? '/journal' : `/fiches/${ficheId}`}
              className="bouton-or inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 py-3 text-sm font-bold"
            >
              {parcoursTermine ? 'Relire mon carnet' : preparee ? 'Relire la fiche complète' : 'Consulter la fiche complète'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {!parcoursTermine && (
              <Link href={`/aujourdhui?fiche=${ficheId}`} className="inline-flex min-h-11 items-center gap-2 text-sm text-parchemin-100/80 underline underline-offset-4">
                <Sunrise className="h-4 w-4" />Avancer par un temps guidé
              </Link>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-parchemin-300 bg-white p-6" aria-labelledby="rencontre-titre">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-or-800"><Users className="h-4 w-4" />{group ? 'La prochaine rencontre' : 'Grandir ensemble'}</p>
          <h2 id="rencontre-titre" className="mt-4 font-serif text-xl font-bold">{group?.name || 'Partager en cellule'}</h2>
          <p className="mt-3 text-sm leading-relaxed text-encre-700">{group ? `${JOURS[group.meeting.weekday]} à ${group.meeting.time} · ${group.meeting.timezone}` : 'Quelques personnes avec qui partager tes découvertes, tes questions et la prière — dès la fiche 1.'}</p>
          {group && <p className="mt-2 text-sm text-encre-700">Fiche {group.currentStep} · {group.meeting.mode === 'ligne' ? 'En ligne' : group.meeting.mode === 'hybride' ? 'Sur place ou en ligne' : 'Sur place'}</p>}
          <Link href={group ? '/groupes' : '/onboarding'} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4">{group ? 'Voir ma cellule et préparer le partage' : 'Trouver ou créer une cellule'}</Link>
        </section>

        <RecapManque key={`${user?.uid}:${group?.id}`} />

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
