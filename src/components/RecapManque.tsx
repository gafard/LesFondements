'use client';

import { useEffect, useState } from 'react';
import { Heart, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { recapsManques } from '@/lib/parcoursStore';
import { FICHES_META } from '@/data/fichesMeta';
import type { GroupSession } from '@/lib/types';

/**
 * Ce qui s'est dit pendant qu'on n'était pas là.
 *
 * Un absent revenait sans rien savoir de la rencontre : le groupe avait
 * avancé, partagé, prié, et lui reprenait au milieu d'une conversation dont
 * il n'avait pas le début. C'est ainsi qu'on décroche.
 *
 * Le récap ne remplace pas la présence. Il empêche qu'une absence devienne
 * une sortie.
 */

/** Une fois lu, on ne le remontre pas : la clé retient lesquels. */
const CLE = 'lf.recapsLus';

function dejaLus(cle: string): number[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(cle) ?? '[]') as number[];
  } catch {
    return [];
  }
}

export default function RecapManque() {
  const { user } = useAuth();
  const { group } = useParcours();
  const cle = `${CLE}:${user?.uid}:${group?.id}`;
  const [manques, setManques] = useState<GroupSession[]>([]);

  useEffect(() => {
    if (!group || !user) return;
    let vivant = true;
    void recapsManques(group.id, user.uid).then((sessions) => {
      if (!vivant) return;
      const lus = dejaLus(cle);
      setManques(sessions.filter((s) => !lus.includes(s.step)));
    });
    return () => {
      vivant = false;
    };
  }, [group, user, cle]);

  if (!manques.length) return null;

  const session = manques[0];
  const meta = FICHES_META.find((f) => f.id === session.step);

  const ranger = () => {
    try {
      window.localStorage.setItem(cle, JSON.stringify([...dejaLus(cle), session.step]));
    } catch {
      /* stockage indisponible : il reparaîtra, ce n'est pas grave */
    }
    setManques((restants) => restants.slice(1));
  };

  return (
    <div className="postit postit-bleu pose-3 relative rounded-3xl p-5 shadow-md sm:p-6">
      <span className="ruban -top-3 left-10 -rotate-2 rounded-[2px]" />

      <button
        onClick={ranger}
        aria-label="J’ai lu"
        className="absolute right-4 top-4 rounded-full p-1 text-encre-400 transition-colors hover:text-encre-800"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="text-3xs font-black uppercase tracking-[0.16em] text-encre-700">
        Vous n’étiez pas là
      </p>
      <p className="manuscrit mt-1 text-2xl font-bold leading-tight text-encre-950">
        Ce qui s’est dit à la fiche {session.step}
        {meta ? ` · ${meta.titre}` : ''}
      </p>

      {session.recap?.summary && (
        <p className="mt-3 font-serif text-sm italic leading-relaxed text-encre-800">
          « {session.recap.summary} »
        </p>
      )}

      {!!session.recap?.highlights?.length && (
        <ul className="mt-3 space-y-1.5">
          {session.recap.highlights.map((pepite, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed text-encre-800">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-or-600" />
              {pepite}
            </li>
          ))}
        </ul>
      )}

      {!!session.recap?.prayerFocus?.length && (
        <div className="mt-3 border-t border-encre-950/[0.08] pt-3">
          <p className="text-3xs font-bold uppercase tracking-[0.14em] text-encre-500">
            Portés dans la prière
          </p>
          <ul className="mt-1.5 space-y-1">
            {session.recap.prayerFocus.map((sujet, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-encre-800">
                <Heart className="mt-0.5 h-3 w-3 shrink-0 text-rose-500" />
                {sujet}
              </li>
            ))}
          </ul>
        </div>
      )}

      {session.recap?.nextStep && (
        <p className="mt-3 rounded-2xl bg-white/50 px-4 py-2.5 text-xs leading-relaxed text-encre-800">
          <span className="font-bold">Le pas de la semaine : </span>
          {session.recap.nextStep}
        </p>
      )}

      <button
        onClick={ranger}
        className="mt-4 text-2xs font-bold text-encre-600 underline underline-offset-2 transition-colors hover:text-encre-900"
      >
        J’ai lu — merci de m’avoir gardé au courant
      </button>
    </div>
  );
}
