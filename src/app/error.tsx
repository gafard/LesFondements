'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RotateCcw, TriangleAlert } from 'lucide-react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Erreur de page', error);
  }, [error]);

  return (
    <div className="table-travail flex min-h-screen items-center justify-center px-4 py-16">
      <div className="feuille relative w-full max-w-lg rounded-3xl border border-parchemin-400 p-8 text-center shadow-xl">
        <span className="ruban -top-3 left-1/2 -translate-x-1/2 -rotate-1" />
        <TriangleAlert className="mx-auto h-8 w-8 text-rose-700" />
        <h1 className="mt-4 font-serif text-3xl font-bold text-encre-950">Cette page s’est froissée</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-encre-600">
          Vos écrits déjà enregistrés restent en place. Vous pouvez rouvrir la page ou revenir au bureau.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="bouton-or inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-bold">
            <RotateCcw className="h-4 w-4" /> Réessayer
          </button>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-encre-950 px-5 py-3 text-xs font-bold text-white">
            <Home className="h-4 w-4" /> Retour au bureau
          </Link>
        </div>
      </div>
    </div>
  );
}
