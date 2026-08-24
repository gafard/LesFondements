'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Hourglass, Loader2, Lock, Users } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { useDeclarerFondSombre } from '@/lib/fondSombre';

/**
 * Ce qu'une page exige pour s'ouvrir.
 *
 * - `groupe`    — il faut un groupe actif. Les fiches, le tableau de bord,
 *                 la rencontre : tout ce que le parcours porte à cinq.
 * - `attente`   — consultable dès la demande envoyée, avant validation :
 *                 l'espace du groupe, pour voir qui l'on rejoint.
 * - `personnel` — n'a jamais eu besoin d'un groupe. Le journal, la
 *                 mémorisation, les témoignages : des pratiques qui
 *                 appartiennent à la personne. Les fermer au visiteur qui
 *                 attend son groupe, c'était appliquer la règle du parcours
 *                 à ce qui n'en relève pas.
 */
export type NiveauAcces = 'groupe' | 'attente' | 'personnel';

interface ParcoursGateProps {
  children: React.ReactNode;
  acces?: NiveauAcces;
}

/**
 * Garde d'accès du parcours. La règle : pas de groupe, pas de fiches.
 * Le contenu n'est pas seulement masqué visuellement — il n'est pas rendu.
 */
export default function ParcoursGate({ children, acces = 'groupe' }: ParcoursGateProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { gate, group } = useParcours();

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  if (authLoading || gate.state === 'chargement') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchemin-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-or-600" />
          <p className="font-serif text-sm text-encre-500">Ouverture de votre espace…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Une pratique personnelle n'attend personne : être connecté suffit.
  if (acces === 'personnel') return <>{children}</>;

  if (gate.state === 'sans_groupe' || gate.state === 'refuse') {
    return (
      <EcranFerme
        icone={Users}
        titre={
          gate.state === 'refuse'
            ? 'Vous n’êtes plus rattaché à un groupe'
            : 'Le parcours attend votre groupe'
        }
        texte={
          gate.state === 'refuse'
            ? "Votre place dans ce groupe s'est libérée. Rejoignez-en un autre, ou créez le vôtre — le parcours reprendra là où vous l'aviez laissé."
            : "Les vingt fiches se préparent seul, mais elles se vivent à cinq ou six. Rejoignez un groupe près de chez vous, ou rassemblez le vôtre : c'est ce qui ouvre le parcours."
        }
        action={{ href: '/onboarding', label: 'Trouver ou créer mon groupe' }}
      />
    );
  }

  if (gate.state === 'en_attente' && acces !== 'attente') {
    return (
      <EcranFerme
        icone={Hourglass}
        titre="Votre place est en cours de confirmation"
        texte={
          group
            ? `${group.leaderName} a reçu votre demande pour ${group.name}. Dès qu'elle est validée, la fiche 1 s'ouvre ici même.`
            : "Dès que l'animateur valide votre demande, la première fiche s'ouvre ici même."
        }
        action={{ href: '/groupes', label: 'Voir l’espace du groupe' }}
      />
    );
  }

  return <>{children}</>;
}

function EcranFerme({
  icone: Icone,
  titre,
  texte,
  action,
}: {
  icone: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  titre: string;
  texte: string;
  action: { href: string; label: string };
}) {
  useDeclarerFondSombre();

  return (
    <div className="nuit nuit-grain relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-28">
      <span className="vitrail left-[-6rem] top-[-4rem] h-80 w-80 bg-or-400/12 animate-souffle" />
      <span className="vitrail bottom-[-8rem] right-[-6rem] h-96 w-96 bg-encre-400/25" />

      <div className="animate-reveal relative z-10 w-full max-w-lg text-center">
        <span className="mx-auto grid h-16 w-16 animate-souffle place-items-center rounded-full bg-or-400/12 text-or-300">
          <Icone className="h-7 w-7" strokeWidth={1.75} />
        </span>

        <h1 className="mt-6 font-serif text-3xl font-bold leading-tight text-parchemin-100 sm:text-4xl">
          {titre}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-parchemin-100/70">
          {texte}
        </p>

        <div className="mx-auto mt-7 max-w-sm rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
          <p className="flex items-center justify-center gap-2 text-2xs leading-relaxed text-parchemin-100/55">
            <Lock className="h-3 w-3 shrink-0" />
            Les fiches restent fermées tant qu&apos;un groupe ne les porte pas.
          </p>
        </div>

        <Link
          href={action.href}
          className="bouton-or mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold"
        >
          {action.label}
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
