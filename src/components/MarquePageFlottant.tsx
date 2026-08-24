'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, ArrowRight, X } from 'lucide-react';

interface DernierPassage {
  url: string;
  titre: string;
  sousTitre?: string;
  date: number;
}

const CLE_PASSAGE = 'lf.dernierPassage';

export default function MarquePageFlottant() {
  const pathname = usePathname();
  const [passage, setPassage] = useState<DernierPassage | null>(null);
  const [deplie, setDeplie] = useState(false);

  // Mémoriser automatiquement la page active
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pathname.startsWith('/fiches/')) {
      const match = pathname.match(/\/fiches\/(\d+)/);
      if (match) {
        const id = match[1];
        const nouveau: DernierPassage = {
          url: pathname,
          titre: `Fiche ${id}`,
          sousTitre: 'En cours d’étude',
          date: Date.now(),
        };
        try {
          localStorage.setItem(CLE_PASSAGE, JSON.stringify(nouveau));
          setPassage(nouveau);
        } catch {
          /* ignorer */
        }
      }
    } else {
      try {
        const brut = localStorage.getItem(CLE_PASSAGE);
        if (brut) setPassage(JSON.parse(brut));
      } catch {
        /* ignorer */
      }
    }
  }, [pathname]);

  if (!passage || pathname === passage.url) return null;

  return (
    <div className="fixed top-0 right-12 z-40 hidden sm:block">
      {/* Ruban brodé suspendu */}
      <div className="relative flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDeplie((v) => !v)}
          className={`relative z-10 flex flex-col items-center justify-end px-3 pt-1 pb-3 transition-all duration-300 shadow-md ${
            deplie ? 'h-24 bg-rose-900 text-or-200' : 'h-14 bg-rose-950 text-or-300 hover:h-16'
          }`}
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          }}
          title="Marque-page brodé : reprendre votre lecture"
        >
          <Bookmark className="h-4 w-4 fill-current drop-shadow-xs" />
        </button>

        {/* Panneau déplié */}
        {deplie && (
          <div className="feuille absolute top-16 right-0 w-64 rounded-3xl border border-parchemin-400 p-4 shadow-2xl animate-fadeIn">
            <span className="ruban -top-2.5 left-1/2 -translate-x-1/2 -rotate-1 rounded-[2px]" />
            <div className="flex items-start justify-between border-b border-parchemin-300 pb-2">
              <span className="text-3xs font-bold uppercase tracking-wider text-or-700">
                Marque-page brodé
              </span>
              <button
                onClick={() => setDeplie(false)}
                className="text-encre-400 hover:text-encre-800"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-2.5">
              <p className="manuscrit text-lg font-bold text-encre-950">{passage.titre}</p>
              <p className="text-2xs text-encre-500">{passage.sousTitre || 'Dernière lecture'}</p>
            </div>

            <Link
              href={passage.url}
              onClick={() => setDeplie(false)}
              className="mt-3 flex items-center justify-between rounded-xl bg-encre-950 px-3.5 py-2 text-2xs font-bold text-parchemin-100 transition-colors hover:bg-encre-900"
            >
              <span>Reprendre la fiche</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
