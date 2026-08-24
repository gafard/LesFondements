import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="table-travail flex min-h-screen items-center justify-center px-4 py-16">
      <div className="post-it-jaune relative w-full max-w-md -rotate-1 p-9 text-center shadow-xl">
        <span className="punaise left-1/2 top-3 -translate-x-1/2" />
        <FileQuestion className="mx-auto mt-3 h-8 w-8 text-encre-600" />
        <p className="manuscrit mt-4 text-5xl font-bold text-encre-950">Page introuvable</p>
        <p className="mt-3 text-sm leading-relaxed text-encre-700">Cette fiche n’est pas sur la table, ou son adresse a changé.</p>
        <Link href="/dashboard" className="mt-7 inline-flex items-center gap-2 rounded-full bg-encre-950 px-5 py-3 text-xs font-bold text-white">
          <ArrowLeft className="h-4 w-4" /> Revenir au bureau
        </Link>
      </div>
    </div>
  );
}
