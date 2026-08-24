'use client';

import { useId } from 'react';

/**
 * Le vocabulaire éditorial du parcours.
 *
 * Quatre pièces, réutilisées partout, pour que les pages illustrées forment
 * un ensemble plutôt qu'une collection de décorations :
 *
 *   MotFantome     un mot démesuré, posé derrière le contenu
 *   TraitOrganique un ruban qui serpente et relie les blocs
 *   Etincelle      les petites marques dessinées à la main
 *   Pastille       l'étiquette de chapitre, qui rythme la lecture
 *
 * Tout est en CSS et en SVG : aucune image, rien à télécharger, et la mise
 * en page reste nette à n'importe quelle taille d'écran.
 */

// ─────────────────────────────────────────────────────────────

interface MotFantomeProps {
  children: string;
  /** Position, en pourcentage du conteneur. */
  haut?: string;
  gauche?: string;
  droite?: string;
  /** Taille en unités de largeur de vue. */
  taille?: string;
  tone?: 'nuit' | 'clair';
  className?: string;
}

/**
 * Le mot posé en arrière-plan, à peine lisible. C'est lui qui donne
 * l'échelle éditoriale : sans un élément très grand, une page reste une
 * suite de cartes.
 */
export function MotFantome({
  children,
  haut = '0',
  gauche,
  droite,
  taille = '18vw',
  tone = 'clair',
  className = '',
}: MotFantomeProps) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute select-none font-serif font-black leading-[0.8] tracking-[-0.04em] ${
        tone === 'nuit' ? 'text-white/[0.045]' : 'text-encre-950/[0.045]'
      } ${className}`}
      style={{ top: haut, left: gauche, right: droite, fontSize: taille }}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────

interface TraitOrganiqueProps {
  /** Quatre tracés différents, pour ne pas répéter la même courbe. */
  variante?: 1 | 2 | 3 | 4;
  tone?: 'nuit' | 'clair';
  className?: string;
  /** Épaisseur du ruban. */
  epaisseur?: number;
}

const TRACES: Record<number, string> = {
  1: 'M-40,120 C120,40 220,200 380,110 S620,20 760,140',
  2: 'M-40,60 C140,180 260,10 420,120 S640,220 780,80',
  3: 'M-40,160 C100,60 240,180 400,60 S600,160 780,40',
  4: 'M-40,90 C160,190 300,30 460,150 S660,60 780,170',
};

/** Le ruban qui serpente derrière le contenu et relie les blocs entre eux. */
export function TraitOrganique({
  variante = 1,
  tone = 'clair',
  className = '',
  epaisseur = 56,
}: TraitOrganiqueProps) {
  const identifiant = useId().replace(/:/g, '');

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 740 220"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 ${className}`}
    >
      <defs>
        <linearGradient id={`ruban-${identifiant}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f6c453" stopOpacity="0" />
          <stop offset="28%" stopColor="#f6c453" stopOpacity={tone === 'nuit' ? 0.16 : 0.22} />
          <stop offset="72%" stopColor="#f0a92a" stopOpacity={tone === 'nuit' ? 0.13 : 0.18} />
          <stop offset="100%" stopColor="#f0a92a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={TRACES[variante]}
        fill="none"
        stroke={`url(#ruban-${identifiant})`}
        strokeWidth={epaisseur}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────

/** Les petites marques manuscrites : une étincelle à quatre branches. */
export function Etincelle({
  taille = 16,
  className = '',
}: {
  taille?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={taille}
      height={taille}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <path d="M12 3c0 4.5 1.5 6 6 6-4.5 0-6 1.5-6 6 0-4.5-1.5-6-6-6 4.5 0 6-1.5 6-6Z" />
    </svg>
  );
}

/** Le trait souligné à main levée, sous un mot qu'on veut appuyer. */
export function Souligne({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 -bottom-1 h-2.5 w-full ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <path d="M4 8C42 3 96 2 196 6" opacity="0.75" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────

interface PastilleProps {
  children: React.ReactNode;
  tone?: 'nuit' | 'clair' | 'or';
  className?: string;
}

/** L'étiquette qui annonce une partie — « Chapitre I », « Fiche 4 sur 20 ». */
export function Pastille({ children, tone = 'clair', className = '' }: PastilleProps) {
  const styles = {
    nuit: 'border-or-300/25 bg-or-400/10 text-or-200',
    clair: 'border-or-300 bg-or-100/80 text-or-700',
    or: 'border-transparent bg-or-400 text-encre-950',
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-2xs font-bold uppercase tracking-[0.2em] ${styles} ${className}`}
    >
      {children}
    </span>
  );
}
