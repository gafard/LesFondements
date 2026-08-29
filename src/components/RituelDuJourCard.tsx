'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, LockKeyhole, Sunrise } from 'lucide-react';
import { chargerFiche, type FicheLivret } from '@/lib/livret';
import { getAnswers, getCachedAnswers } from '@/lib/firestore';
import {
  construireCheminRituel,
  lireEtatRituel,
  momentCourant,
  progressionRituel,
  type EtatRituel,
} from '@/lib/rituel';

export default function RituelDuJourCard({ userId, ficheId }: { userId: string; ficheId: number }) {
  const [fiche, setFiche] = useState<FicheLivret | null | undefined>(undefined);
  const [etat, setEtat] = useState<EtatRituel>(() =>
    lireEtatRituel(getCachedAnswers(userId, ficheId), ficheId)
  );

  useEffect(() => {
    let actif = true;
    void Promise.all([chargerFiche(ficheId), getAnswers(userId, ficheId)]).then(
      ([contenu, reponses]) => {
        if (!actif) return;
        setFiche(contenu);
        setEtat(lireEtatRituel(reponses, ficheId));
      }
    );
    return () => { actif = false; };
  }, [ficheId, userId]);

  const moments = useMemo(() => (fiche ? construireCheminRituel(fiche) : []), [fiche]);
  const courant = etat.ficheId === ficheId ? momentCourant(moments, etat) : null;
  const progression = etat.ficheId === ficheId
    ? progressionRituel(moments, etat)
    : { termines: 0, total: moments.length, pourcentage: 0 };
  const termine = progression.total > 0 && progression.termines === progression.total;

  return (
    <Link
      href={`/rituel?fiche=${ficheId}`}
      className="group relative block overflow-visible rounded-3xl border border-encre-900/12 bg-[#263b31] px-5 py-6 text-parchemin-50 shadow-xl transition-transform hover:-translate-y-1 sm:px-7"
    >
      <span className="absolute -top-3 left-8 h-6 w-24 -rotate-2 bg-or-200/75 shadow-sm" aria-hidden="true" />
      <span className="absolute -right-2 top-6 h-28 w-5 rounded-b-md bg-[#7d2331] shadow-md" aria-hidden="true" />
      <span className="absolute -right-2 top-[7.5rem] h-0 w-0 border-x-[10px] border-t-[12px] border-x-transparent border-t-[#7d2331]" aria-hidden="true" />

      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-or-300 text-encre-950 shadow-sm">
            {termine ? <CheckCircle2 className="h-6 w-6" /> : <Sunrise className="h-6 w-6" />}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-or-300">
              Rituel du jour
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-parchemin-100/80">
                <Clock3 className="h-3 w-3" /> 3–5 min
              </span>
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold leading-tight text-white sm:text-3xl">
              {termine ? 'Ta semaine est rassemblée' : courant?.titre ?? 'On prépare ta table…'}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-parchemin-100/75">
              {termine
                ? 'Relis librement tes notes avant la rencontre.'
                : 'Le texte exact du livret, une question et un pas personnel — sans pression ni série à maintenir.'}
            </p>
          </div>
        </div>

        <div className="postit postit-jaune w-full shrink-0 rotate-1 rounded-sm px-4 py-3 text-encre-950 shadow-md sm:w-52">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-encre-600">Ma semaine</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-encre-950/10">
            <span className="block h-full rounded-full bg-emerald-700" style={{ width: `${progression.pourcentage}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs font-bold">
            <span>{progression.termines}/{progression.total || '—'} moments</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-encre-600">
            <LockKeyhole className="h-3.5 w-3.5" /> Privé par défaut
          </p>
        </div>
      </div>
    </Link>
  );
}
