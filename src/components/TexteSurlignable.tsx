'use client';

import { useMemo, useRef, useState } from 'react';
import { Highlighter, X } from 'lucide-react';
import TexteAvecReferences from '@/components/ReferenceCliquable';
import type { CouleurSurlignage, Surlignage } from '@/lib/annotations';

export interface SelectionTexte {
  debut: number;
  fin: number;
  extrait: string;
}

interface TexteSurlignableProps {
  blocId: string;
  texte: string;
  surlignages: Surlignage[];
  onAjouter: (selection: SelectionTexte, couleur: CouleurSurlignage) => void;
  onEffacer: () => void;
  tone?: 'clair' | 'nuit';
}

const COULEURS: Record<CouleurSurlignage, { classe: string; pastille: string; label: string }> = {
  jaune: { classe: 'surlignage-jaune', pastille: 'bg-[#f6da62]', label: 'Jaune pâle' },
  rose: { classe: 'surlignage-rose', pastille: 'bg-[#eeb2c0]', label: 'Rose poudré' },
  bleu: { classe: 'surlignage-bleu', pastille: 'bg-[#a9cfee]', label: 'Bleu ciel' },
};

export default function TexteSurlignable({
  blocId,
  texte,
  surlignages,
  onAjouter,
  onEffacer,
  tone = 'clair',
}: TexteSurlignableProps) {
  const conteneurRef = useRef<HTMLSpanElement>(null);
  const [selection, setSelection] = useState<SelectionTexte | null>(null);

  const actifs = useMemo(
    () =>
      surlignages
        .filter((surlignage) => surlignage.blocId === blocId)
        .map((surlignage) => ({
          ...surlignage,
          debut: Math.max(0, Math.min(texte.length, surlignage.debut)),
          fin: Math.max(0, Math.min(texte.length, surlignage.fin)),
        }))
        .filter((surlignage) => surlignage.fin > surlignage.debut)
        .sort((a, b) => a.debut - b.debut),
    [blocId, surlignages, texte.length]
  );

  const morceaux = useMemo(() => {
    const resultat: Array<{
      cle: string;
      texte: string;
      surlignage?: Surlignage;
    }> = [];
    let curseur = 0;
    for (const surlignage of actifs) {
      if (surlignage.debut > curseur) {
        resultat.push({
          cle: `texte_${curseur}`,
          texte: texte.slice(curseur, surlignage.debut),
        });
      }
      if (surlignage.debut >= curseur) {
        resultat.push({
          cle: surlignage.id,
          texte: texte.slice(surlignage.debut, surlignage.fin),
          surlignage,
        });
        curseur = surlignage.fin;
      }
    }
    if (curseur < texte.length) {
      resultat.push({ cle: `texte_${curseur}`, texte: texte.slice(curseur) });
    }
    return resultat;
  }, [actifs, texte]);

  const capturerSelection = () => {
    const conteneur = conteneurRef.current;
    const selectionNavigateur = window.getSelection();
    if (!conteneur || !selectionNavigateur || selectionNavigateur.rangeCount === 0) return;

    const range = selectionNavigateur.getRangeAt(0);
    if (
      range.collapsed ||
      !conteneur.contains(range.startContainer) ||
      !conteneur.contains(range.endContainer)
    ) {
      return;
    }

    const avant = range.cloneRange();
    avant.selectNodeContents(conteneur);
    avant.setEnd(range.startContainer, range.startOffset);
    const debut = avant.toString().length;
    const extrait = range.toString().trim();
    if (extrait.length < 2) return;
    const decalage = range.toString().indexOf(extrait);
    setSelection({ debut: debut + Math.max(0, decalage), fin: debut + Math.max(0, decalage) + extrait.length, extrait });
  };

  const appliquer = (couleur: CouleurSurlignage) => {
    if (!selection) return;
    onAjouter(selection, couleur);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  };

  return (
    <span className="relative">
      <span
        ref={conteneurRef}
        onMouseUp={capturerSelection}
        onTouchEnd={capturerSelection}
        onKeyUp={capturerSelection}
        data-highlightable={blocId}
      >
        {morceaux.map((morceau) =>
          morceau.surlignage ? (
            <mark
              key={morceau.cle}
              className={`${COULEURS[morceau.surlignage.couleur].classe} rounded-[0.18em] px-[0.08em] text-inherit`}
            >
              <TexteAvecReferences tone={tone}>{morceau.texte}</TexteAvecReferences>
            </mark>
          ) : (
            <TexteAvecReferences key={morceau.cle} tone={tone}>{morceau.texte}</TexteAvecReferences>
          )
        )}
      </span>

      {selection && (
        <span className="my-2 flex w-fit max-w-full flex-wrap items-center gap-2 rounded-xl border border-encre-200 bg-white px-2.5 py-2 text-encre-800 shadow-lg">
          <Highlighter className="h-3.5 w-3.5 text-or-700" />
          <span className="max-w-44 truncate text-3xs font-semibold">« {selection.extrait} »</span>
          {(Object.keys(COULEURS) as CouleurSurlignage[]).map((couleur) => (
            <button
              key={couleur}
              type="button"
              onClick={() => appliquer(couleur)}
              className={`h-6 w-6 rounded-full border border-encre-950/20 ${COULEURS[couleur].pastille}`}
              aria-label={`Surligner en ${COULEURS[couleur].label}`}
            />
          ))}
          <button
            type="button"
            onClick={() => setSelection(null)}
            className="rounded p-1 text-encre-500 hover:bg-encre-50"
            aria-label="Annuler le surlignage"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      {!selection && actifs.length > 0 && (
        <button
          type="button"
          onClick={onEffacer}
          className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 align-middle text-[9px] font-bold text-encre-500 shadow-2xs hover:text-rose-700"
          title="Effacer les surlignages de ce passage"
        >
          <X className="h-2.5 w-2.5" /> {actifs.length}
        </button>
      )}
    </span>
  );
}
