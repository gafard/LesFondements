'use client';

import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { texteDuVerset } from '@/data/versets';

/**
 * Mémo Bible : la référence d'abord, le verset au dos.
 *
 * On cherche de mémoire, puis on retourne la carte. Rien d'autre à remplir :
 * ni note de rappel ni commentaire — la méditation se fait sur l'exposé.
 */
export default function MemoBible({ references }: { references: string[] }) {
  const uniques = [...new Set(references)];
  if (!uniques.length) {
    return <p className="text-sm text-encre-600">Aucun verset à retenir pour cette fiche.</p>;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {uniques.map((reference, index) => (
        <li key={reference}>
          <CarteMemo reference={reference} index={index} />
        </li>
      ))}
    </ul>
  );
}

const COULEURS = ['postit', 'postit-bleu', 'postit-rose', 'postit-vert'];
const POSES = ['pose-1', 'pose-2', 'pose-3', 'pose-4'];

function CarteMemo({ reference, index }: { reference: string; index: number }) {
  const [retournee, setRetournee] = useState(false);
  const texte = texteDuVerset(reference);
  return (
    <div
      className={`${COULEURS[index % COULEURS.length]} ${POSES[index % POSES.length]} relative flex min-h-40 flex-col rounded-2xl p-5 shadow-md`}
    >
      <span className="ruban -top-3 left-1/2 -translate-x-1/2 -rotate-2 rounded-[2px]" aria-hidden="true" />
      {/* La référence n'ouvre pas la bulle du verset : ce serait retourner
          la carte avant d'avoir cherché. */}
      <p className="manuscrit pt-1 text-2xl font-bold text-encre-950">{reference}</p>
      <div className="flex-1" aria-live="polite">
        {retournee && (
          <p className="mt-3 font-serif text-[0.8125rem] italic leading-relaxed text-encre-800">
            {texte ? `« ${texte} »` : 'Ouvrez votre Bible à ce passage.'}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setRetournee((valeur) => !valeur)}
        aria-pressed={retournee}
        className="mt-4 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full border border-encre-950/12 bg-white/50 px-3.5 text-2xs font-bold text-encre-700 transition-colors hover:bg-white/80"
      >
        <RotateCw className="h-3 w-3" aria-hidden="true" />
        {retournee ? 'Retourner la carte' : 'Retourner pour lire le verset'}
      </button>
    </div>
  );
}
