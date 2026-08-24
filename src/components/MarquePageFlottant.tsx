'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, BookOpen, PenLine } from 'lucide-react';
import {
  EVENEMENT_PASSAGE,
  lireDernierPassage,
  type DernierPassage,
} from '@/lib/marquePage';

export default function MarquePageFlottant() {
  const [passage, setPassage] = useState<DernierPassage | null>(lireDernierPassage);

  useEffect(() => {
    const actualiser = () => setPassage(lireDernierPassage());
    const actualiserDepuisEvenement = (event: Event) => {
      const detail = (event as CustomEvent<DernierPassage>).detail;
      setPassage(detail ?? lireDernierPassage());
    };
    window.addEventListener('storage', actualiser);
    window.addEventListener(EVENEMENT_PASSAGE, actualiserDepuisEvenement);
    return () => {
      window.removeEventListener('storage', actualiser);
      window.removeEventListener(EVENEMENT_PASSAGE, actualiserDepuisEvenement);
    };
  }, []);

  if (!passage) return null;

  const Icone = passage.type === 'verset' || passage.type === 'ecriture' ? PenLine : BookOpen;

  return (
    <div className="group fixed right-4 top-0 z-50 sm:right-10" data-testid="bookmark-ribbon">
      <Link
        href={passage.url}
        className="ruban-marque-page relative flex h-[88px] w-12 flex-col items-center justify-end gap-1 pb-4 text-[#f8d98a] transition-transform duration-300 hover:translate-y-1 focus-visible:translate-y-1"
        title={`${passage.titre} — ${passage.sousTitre ?? 'Reprendre'}`}
        aria-label={`Reprendre : ${passage.titre}. ${passage.sousTitre ?? ''}`}
      >
        <span className="absolute inset-x-1 top-2 h-px bg-[#f8d98a]/45" />
        <Bookmark className="h-4 w-4 fill-current drop-shadow-sm" />
        <span className="text-[8px] font-black uppercase tracking-[0.15em] [writing-mode:vertical-rl]">Reprendre</span>
      </Link>

      <div className="pointer-events-none absolute right-14 top-3 hidden w-64 translate-x-3 rounded-2xl border border-parchemin-400 bg-[#fffdf7] p-3 opacity-0 shadow-2xl transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100 sm:block">
        <div className="flex items-start gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-or-100 text-or-800">
            <Icone className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-3xs font-black uppercase tracking-[0.17em] text-or-700">Votre marque-page</p>
            <p className="mt-1 truncate font-serif text-sm font-bold text-encre-950">{passage.titre}</p>
            <p className="mt-0.5 text-2xs leading-relaxed text-encre-500">{passage.sousTitre ?? 'Dernier passage travaillé'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
