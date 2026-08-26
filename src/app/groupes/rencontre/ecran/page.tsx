'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, MonitorPlay, Users, Wifi } from 'lucide-react';
import { useParcours } from '@/lib/ParcoursContext';
import ParcoursGate from '@/components/ParcoursGate';
import { MEETING_FLOW, MEETING_FLOW_LENGTH } from '@/lib/parcoursStore';
import { FICHES_META } from '@/data/fichesMeta';
import { useDeclarerFondSombre } from '@/lib/fondSombre';
import { garderLEcranEveille, laisserLEcranSEteindre, suivreLaVisibilite } from '@/lib/seance';

/**
 * La rencontre, projetée.
 *
 * Six personnes dans un salon, six téléphones : six mondes. Un écran commun
 * fait l'inverse — on lève les yeux vers la même chose, et donc on se voit.
 *
 * Cette page ne commande rien : elle regarde. L'animateur avance depuis son
 * appareil, la projection suit. Et surtout, elle n'affiche que ce que le
 * groupe partage déjà à voix haute — l'étape, le verset, qui parle. Jamais
 * le journal, jamais les réponses personnelles, jamais un sujet de prière
 * nominatif. Un écran partagé qui trahirait une confidence détruirait
 * l'endroit même qu'il sert.
 */

function EcranContent() {
  useDeclarerFondSombre();
  const { group, session, members } = useParcours();
  const [heure, setHeure] = useState<string>('');

  // La projection dure une heure et demie sans qu'on la touche : sans ce
  // verrou, l'écran s'éteindrait au milieu du temps de prière.
  useEffect(() => {
    void garderLEcranEveille();
    const cesser = suivreLaVisibilite();
    return () => {
      cesser();
      laisserLEcranSEteindre();
    };
  }, []);

  useEffect(() => {
    const battre = () =>
      setHeure(
        new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      );
    battre();
    const minuterie = window.setInterval(battre, 20_000);
    return () => window.clearInterval(minuterie);
  }, []);

  const actifs = useMemo(() => members.filter((m) => m.status === 'actif'), [members]);
  const enLigne = actifs.filter((m) => session?.attendance?.[m.uid] === 'ligne');
  const surPlace = actifs.filter((m) => session?.attendance?.[m.uid] === 'presentiel');
  const parle = actifs.find((m) => m.uid === session?.speakingUid) ?? null;

  if (!group) return null;

  const meta = FICHES_META.find((f) => f.id === group.currentStep);
  const stage = Math.min(session?.liveStage ?? 0, MEETING_FLOW_LENGTH - 1);
  const etape = MEETING_FLOW[stage];

  // ── Les écrans baissés : la pièce entière s'éteint ──────────
  if (session?.ecransBaisses) {
    return (
      <div className="ecran-baisse fixed inset-0 z-50 flex flex-col items-center justify-center">
        <span className="flamme" style={{ width: 26, height: 48 }} />
        <p className="manuscrit mt-14 text-6xl font-bold text-parchemin-100/90 sm:text-7xl">
          Partager et prier ensemble
        </p>
        <p className="mt-6 text-lg text-parchemin-100/40">Levons les yeux.</p>
      </div>
    );
  }

  return (
    <div className="nuit nuit-grain fixed inset-0 z-50 flex flex-col px-10 py-8 text-parchemin-100">
      <span className="vitrail left-[-12rem] top-[-10rem] h-[36rem] w-[36rem] bg-or-400/10 animate-souffle" />

      {/* ── Bandeau ── */}
      <header className="relative z-10 flex items-baseline justify-between border-b border-white/10 pb-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-or-300/70">
            {group.name}
          </p>
          <h1 className="mt-1 font-serif text-4xl font-bold sm:text-5xl">
            Fiche {group.currentStep}
            {meta ? ` · ${meta.titre}` : ''}
          </h1>
        </div>
        <p className="font-serif text-3xl text-parchemin-100/50">{heure}</p>
      </header>

      {/* ── L'étape en cours, en grand ── */}
      <main className="relative z-10 flex flex-1 flex-col justify-center py-8">
        <p className="text-lg font-bold uppercase tracking-[0.22em] text-or-300/60">
          {stage + 1} sur {MEETING_FLOW_LENGTH} · environ {etape.minutes} minutes
        </p>
        <h2 className="mt-4 font-serif text-6xl font-bold leading-tight sm:text-7xl">
          {etape.title}
        </h2>
        <p className="mt-8 max-w-4xl font-serif text-2xl italic leading-relaxed text-parchemin-100/70 sm:text-3xl">
          {etape.hint}
        </p>

        {parle && (
          <p className="mt-12 inline-flex w-fit items-center gap-4 rounded-full bg-or-400/15 px-8 py-4 text-3xl font-bold text-or-200">
            <span className="h-3 w-3 animate-pulse rounded-full bg-or-300" />
            {parle.displayName} a la parole
          </p>
        )}
      </main>

      {/* ── Qui est là ── */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-5 text-parchemin-100/60">
        <p className="flex items-center gap-3 text-xl">
          <Users className="h-6 w-6" strokeWidth={1.75} />
          {surPlace.length} sur place
        </p>
        {enLigne.length > 0 && (
          // Ceux qui ne sont pas dans la pièce doivent exister dans la pièce.
          <p className="flex items-center gap-3 text-xl text-or-200/80">
            <Wifi className="h-6 w-6" strokeWidth={1.75} />
            {enLigne.map((m) => m.displayName).join(', ')}{' '}
            {enLigne.length > 1 ? 'nous rejoignent' : 'nous rejoint'} en ligne
          </p>
        )}
        <p className="flex items-center gap-2 text-sm text-parchemin-100/25">
          <MonitorPlay className="h-4 w-4" /> Cet écran suit la rencontre — il ne la commande pas
        </p>
      </footer>
    </div>
  );
}

export default function EcranRencontre() {
  const { session } = useParcours();
  return (
    <ParcoursGate>
      {session === undefined ? (
        <div className="flex min-h-screen items-center justify-center bg-encre-950">
          <Loader2 className="h-8 w-8 animate-spin text-or-400" />
        </div>
      ) : (
        <EcranContent />
      )}
    </ParcoursGate>
  );
}
