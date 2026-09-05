'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BookOpen, Hourglass, Loader2, Lock, Users } from 'lucide-react';
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
export type NiveauAcces = 'groupe' | 'attente' | 'personnel' | 'decouverte' | 'lecture';

interface ParcoursGateProps {
  children: React.ReactNode;
  acces?: NiveauAcces;
}

/**
 * Garde d'accès du parcours.
 * - Fiche 1 & Lettre du Père : Découverte libre sans obligation de groupe.
 * - Fiches 2 à 20 : Se vivent en cellule de maison (groupe requis).
 */
export default function ParcoursGate({ children, acces = 'groupe' }: ParcoursGateProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { gate, group, profile, loading } = useParcours();

  // Un compte qui n'a jamais vu l'accueil n'a rien à faire sur le tableau de
  // bord : il n'a pas de groupe, et rien sur cette page ne le lui dit. Le
  // niveau « personnel » ouvre les pratiques à qui attend sa place ; il ne
  // doit pas servir de porte dérobée à qui n'a pas encore été accueilli.
  const jamaisAccueilli =
    !!profile && !profile.groupId && !profile.onboardingCompletedAt && !profile.onboardingSeenAt;

  // Les hooks passent avant toute sortie anticipée : un `return` placé plus
  // haut faisait varier leur nombre d'une route à l'autre, ce que React
  // n'admet pas — « Rendered fewer hooks than expected » au premier
  // changement d'état.
  useEffect(() => {
    // Le mode découverte n'exige pas de compte : on ne renvoie pas vers la
    // connexion quelqu'un venu regarder la fiche 1.
    if (acces !== 'decouverte' && !authLoading && !user) {
      router.replace('/login');
    }
  }, [acces, authLoading, user, router]);

  useEffect(() => {
    if (acces === 'decouverte' || authLoading || !user || loading) return;
    if (jamaisAccueilli) router.replace('/onboarding');
  }, [acces, authLoading, user, loading, jamaisAccueilli, router]);

  // Le mode découverte (Fiche 1 & Lettre du Père) est en accès libre et immédiat
  if (acces === 'decouverte') {
    return <>{children}</>;
  }

  // `jamaisAccueilli` : la redirection vers l'accueil est en route. On garde
  // l'écran d'attente plutôt qu'une page blanche le temps qu'elle aboutisse.
  if (authLoading || gate.state === 'chargement' || jamaisAccueilli) {
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
  if (acces === 'lecture' && profile?.studyMode === 'personnel' && !group) return <>{children}</>;

  if (acces === 'personnel') return <>{children}</>;

  if (gate.state === 'sans_groupe' || gate.state === 'refuse') {
    return (
      <EcranFerme
        icone={Users}
        titre={
          gate.state === 'refuse'
            ? 'Vous n’êtes plus rattaché à un groupe'
            : 'Choisissez comment poursuivre le parcours'
        }
        texte={
          gate.state === 'refuse'
            ? "Votre place dans ce groupe s'est libérée. Rejoignez-en un autre, ou créez le vôtre — le parcours reprendra là où vous l'aviez laissé."
            : "Le livret propose une étude personnelle, idéalement accompagnée d’un partage en cellule de 5 ou 6 personnes. Vous pouvez choisir votre chemin dans l’accueil."
        }
        action={{ href: '/onboarding', label: 'Choisir mon chemin' }}
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
            Vos écrits personnels restent privés, quel que soit votre chemin.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/fiches/1"
            className="bouton-or w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-xs font-bold shadow-lg"
          >
            <BookOpen className="h-4 w-4" />
            Explorer la Fiche 1 (Accès libre)
          </Link>

          <Link
            href={action.href}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white px-7 py-3.5 text-xs font-bold transition-colors"
          >
            {action.label}
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}
