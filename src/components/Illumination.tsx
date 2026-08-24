'use client';

import { useId, useMemo } from 'react';

/**
 * L'enluminure d'une fiche.
 *
 * Vingt fiches, aucune photographie : il fallait une identité visuelle qui se
 * fabrique. Chaque emblème est dessiné à partir du numéro de la fiche — le
 * nombre de rayons, leur inclinaison, l'ouverture des arcs, la figure
 * centrale. Deux fiches ne donnent jamais le même dessin, mais toutes
 * appartiennent à la même famille : rosace, sceau, lettrine.
 *
 * Le vocabulaire vient du livret lui-même : un manuscrit qu'on ouvre, une
 * lampe qu'on allume. D'où l'or sur le bleu de nuit, et le halo.
 */

export interface IlluminationProps {
  /** 1 à 20. Détermine entièrement le dessin. */
  fiche: number;
  /** Côté du carré, en pixels CSS. */
  taille?: number;
  className?: string;
  /** Palette : sur fond nuit (or lumineux) ou sur parchemin (or sourd). */
  tone?: 'nuit' | 'clair';
  /** Le halo respire lentement. À couper sur les listes denses. */
  anime?: boolean;
}

/** Les quatre chapitres du parcours, chacun avec sa figure centrale. */
function chapitreDe(fiche: number): 1 | 2 | 3 | 4 {
  if (fiche <= 5) return 1;
  if (fiche <= 10) return 2;
  if (fiche <= 15) return 3;
  return 4;
}

export default function Illumination({
  fiche,
  taille = 160,
  className,
  tone = 'nuit',
  anime = false,
}: IlluminationProps) {
  const identifiant = useId().replace(/:/g, '');
  const chapitre = chapitreDe(fiche);

  const dessin = useMemo(() => construire(fiche), [fiche]);

  const or = tone === 'nuit' ? '#f6c453' : '#d18410';
  const orPale = tone === 'nuit' ? '#fde28a' : '#f0a92a';
  const encre = tone === 'nuit' ? '#07162b' : '#f8f3e9';

  return (
    <svg
      viewBox="0 0 200 200"
      width={taille}
      height={taille}
      className={className}
      role="img"
      aria-label={`Enluminure de la fiche ${fiche}`}
    >
      <defs>
        <radialGradient id={`halo-${identifiant}`}>
          <stop offset="0%" stopColor={or} stopOpacity="0.30" />
          <stop offset="55%" stopColor={or} stopOpacity="0.08" />
          <stop offset="100%" stopColor={or} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`trait-${identifiant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={orPale} />
          <stop offset="55%" stopColor={or} />
          <stop offset="100%" stopColor={orPale} stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <circle
        cx="100"
        cy="100"
        r="96"
        fill={`url(#halo-${identifiant})`}
        className={anime ? 'animate-souffle' : undefined}
        style={{ transformOrigin: '100px 100px' }}
      />

      <g
        fill="none"
        stroke={`url(#trait-${identifiant})`}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Les rayons : le nombre et l'inclinaison viennent du numéro. */}
        <g transform={`rotate(${dessin.rotation} 100 100)`}>
          {dessin.rayons.map((rayon, index) => (
            <line
              key={index}
              x1={100 + Math.cos(rayon.angle) * rayon.debut}
              y1={100 + Math.sin(rayon.angle) * rayon.debut}
              x2={100 + Math.cos(rayon.angle) * rayon.fin}
              y2={100 + Math.sin(rayon.angle) * rayon.fin}
              strokeWidth={rayon.epais ? 2.4 : 1}
              opacity={rayon.epais ? 0.9 : 0.42}
            />
          ))}
        </g>

        {/* Les arcs concentriques, interrompus : un sceau, pas une cible. */}
        {dessin.arcs.map((arc, index) => (
          <circle
            key={index}
            cx="100"
            cy="100"
            r={arc.rayon}
            strokeWidth={arc.epaisseur}
            opacity={arc.opacite}
            strokeDasharray={arc.tirets}
            transform={`rotate(${arc.rotation} 100 100)`}
          />
        ))}

        <FigureCentrale chapitre={chapitre} fiche={fiche} />
      </g>

      {/* Le chiffre, gravé au centre. */}
      <text
        x="100"
        y="100"
        textAnchor="middle"
        dominantBaseline="central"
        fill={or}
        fontFamily="Georgia, serif"
        fontSize="34"
        fontWeight="700"
        opacity="0.95"
      >
        {fiche}
      </text>

      {/* Un liseré intérieur, pour détacher le chiffre du dessin. */}
      <circle cx="100" cy="100" r="27" fill={encre} opacity="0.55" />
      <text
        x="100"
        y="100"
        textAnchor="middle"
        dominantBaseline="central"
        fill={or}
        fontFamily="Georgia, serif"
        fontSize="34"
        fontWeight="700"
      >
        {fiche}
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// La figure centrale change à chaque chapitre du parcours
// ─────────────────────────────────────────────────────────────

function FigureCentrale({ chapitre, fiche }: { chapitre: 1 | 2 | 3 | 4; fiche: number }) {
  const inclinaison = (fiche * 17) % 90;

  // I — Recevoir : un cercle, ce qui est donné et se reçoit entier.
  if (chapitre === 1) {
    return <circle cx="100" cy="100" r="44" strokeWidth="1.6" opacity="0.75" />;
  }

  // II — Être transformé : deux carrés qui pivotent l'un sur l'autre.
  if (chapitre === 2) {
    return (
      <g opacity="0.75" strokeWidth="1.6">
        <rect x="62" y="62" width="76" height="76" transform={`rotate(${inclinaison} 100 100)`} />
        <rect
          x="62"
          y="62"
          width="76"
          height="76"
          transform={`rotate(${inclinaison + 45} 100 100)`}
          opacity="0.5"
        />
      </g>
    );
  }

  // III — Devenir disciple : un triangle qui monte, répété en écho.
  if (chapitre === 3) {
    return (
      <g opacity="0.75" strokeWidth="1.6" transform={`rotate(${inclinaison / 3} 100 100)`}>
        <polygon points="100,52 142,130 58,130" />
        <polygon points="100,72 128,122 72,122" opacity="0.45" />
      </g>
    );
  }

  // IV — Demeurer et transmettre : une croix élargie, aux branches ouvertes.
  return (
    <g opacity="0.75" strokeWidth="1.8">
      <line x1="100" y1="52" x2="100" y2="148" />
      <line x1="56" y1="94" x2="144" y2="94" />
      <circle cx="100" cy="94" r="16" opacity="0.5" strokeWidth="1.2" />
    </g>
  );
}

// ─────────────────────────────────────────────────────────────
// Le dessin, dérivé du numéro
// ─────────────────────────────────────────────────────────────

interface Dessin {
  rotation: number;
  rayons: { angle: number; debut: number; fin: number; epais: boolean }[];
  arcs: { rayon: number; epaisseur: number; opacite: number; tirets?: string; rotation: number }[];
}

function construire(fiche: number): Dessin {
  // Des nombres premiers comme pas : deux fiches voisines ne se ressemblent
  // pas, et l'ensemble ne retombe jamais sur une régularité mécanique.
  const nombreRayons = 8 + (fiche * 3) % 9; // 8 à 16
  const rotation = (fiche * 23) % 360;
  const nombreArcs = 3 + (fiche % 3); // 3 à 5

  const rayons = Array.from({ length: nombreRayons }, (_, index) => {
    const angle = (index / nombreRayons) * Math.PI * 2;
    const epais = index % (2 + (fiche % 3)) === 0;
    return {
      angle,
      debut: epais ? 34 : 46 + ((fiche + index) % 5) * 2,
      fin: epais ? 92 : 74 + ((fiche * index) % 11),
      epais,
    };
  });

  const arcs = Array.from({ length: nombreArcs }, (_, index) => {
    const rayon = 40 + index * (12 + (fiche % 4));
    const pointille = (fiche + index) % 3 === 0;
    return {
      rayon: Math.min(rayon, 92),
      epaisseur: index === 0 ? 1.8 : 0.9,
      opacite: index === 0 ? 0.85 : 0.4,
      tirets: pointille ? `${2 + (fiche % 3)} ${5 + (fiche % 4)}` : undefined,
      rotation: (fiche * (index + 7)) % 360,
    };
  });

  return { rotation, rayons, arcs };
}
