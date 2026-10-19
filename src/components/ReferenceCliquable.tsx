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

  // La référence se lit comme un appui, en plus petit que le texte. Ses
  // parenthèses et ce qui la relie à la suivante (« ; », « et ») suivent la
  // même taille : « (Ex 3:14 ; Ap 1:8) » forme un seul bloc discret.
  const rendus: React.ReactNode[] = [];
  morceaux.forEach((morceau, index) => {
    if (morceau.reference) {
      rendus.push(
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
          className={`reference-biblique cursor-pointer underline decoration-dotted underline-offset-2 transition-colors ${styleLien}`}
        >
          {morceau.texte}
        </button>
      );
      return;
    }
    const avant = morceaux[index - 1]?.reference;
    const apres = morceaux[index + 1]?.reference;
    if (avant && apres && LIANT.test(morceau.texte)) {
      rendus.push(<span key={index} className="reference-biblique">{morceau.texte}</span>);
      return;
    }
    let texte = morceau.texte;
    let ouvrante = '';
    let fermante = '';
    if (avant) {
      const fin = texte.match(/^\s*\)/);
      if (fin) { fermante = fin[0]; texte = texte.slice(fin[0].length); }
    }
    if (apres) {
      const debut = texte.match(/\(\s*(?:cf\.?\s*|voir\s+)?$/i);
      if (debut) { ouvrante = debut[0]; texte = texte.slice(0, -debut[0].length); }
    }
    rendus.push(
      <Fragment key={index}>
        {fermante && <span className="reference-biblique">{fermante}</span>}
        {texte}
        {ouvrante && <span className="reference-biblique">{ouvrante}</span>}
      </Fragment>
    );
  });

  return <span className={className}>{rendus}</span>;
}

/** Ce qui relie deux références dans une même parenthèse. */
const LIANT = /^[\s;,.:+\-–]*(?:et|cf\.?|voir)?[\s;,.:+\-–]*$/i;
