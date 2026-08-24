'use client';

import { Fragment, useMemo } from 'react';
import { detecterReferences } from '@/lib/reference';
import { ouvrirBulle } from '@/lib/bulleVerset';

interface TexteAvecReferencesProps {
  children: string;
  /** Sur fond nuit, le soulignement doit être plus clair. */
  tone?: 'clair' | 'nuit';
  className?: string;
}

/**
 * Rend un texte du livret en transformant ses références bibliques en liens
 * qui ouvrent le panneau d'étude. « Dieu est amour (1Jn 4:16 ; Ps 103) »
 * devient deux passages consultables sans quitter la fiche.
 */
export default function TexteAvecReferences({
  children,
  tone = 'clair',
  className,
}: TexteAvecReferencesProps) {
  const morceaux = useMemo(() => {
    const trouvees = detecterReferences(children);
    if (!trouvees.length) return null;

    const sortie: { texte: string; reference?: (typeof trouvees)[number]['reference'] }[] = [];
    let curseur = 0;
    for (const trouvee of trouvees) {
      if (trouvee.debut < curseur) continue; // chevauchement : on garde la première
      if (trouvee.debut > curseur) {
        sortie.push({ texte: children.slice(curseur, trouvee.debut) });
      }
      sortie.push({
        texte: children.slice(trouvee.debut, trouvee.fin),
        reference: trouvee.reference,
      });
      curseur = trouvee.fin;
    }
    if (curseur < children.length) sortie.push({ texte: children.slice(curseur) });
    return sortie;
  }, [children]);

  if (!morceaux) return <>{children}</>;

  const styleLien =
    tone === 'nuit'
      ? 'text-or-300 decoration-or-300/40 hover:decoration-or-300'
      : 'text-or-700 decoration-or-500/40 hover:decoration-or-600';

  return (
    <span className={className}>
      {morceaux.map((morceau, index) =>
        morceau.reference ? (
          <button
            key={index}
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              // La bulle se pose sous le mot ; le panneau complet reste
              // accessible depuis elle, pour qui veut aller plus loin.
              ouvrirBulle(morceau.reference!, event.currentTarget);
            }}
            title={`Lire ${morceau.reference.livre.nom} ${morceau.reference.chapitre}`}
            className={`cursor-pointer font-semibold underline decoration-dotted underline-offset-2 transition-colors ${styleLien}`}
          >
            {morceau.texte}
          </button>
        ) : (
          <Fragment key={index}>{morceau.texte}</Fragment>
        )
      )}
    </span>
  );
}
