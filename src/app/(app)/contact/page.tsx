'use client';

import FormulaireContact from '@/components/FormulaireContact';
import { useAuth } from '@/lib/AuthContext';

export default function ContactPage() {
  // Sans compte, la barre du haut est fixe : on lui laisse sa place.
  const { user } = useAuth();
  return (
    <div className={`table-travail min-h-screen pb-20 ${user ? 'pt-6' : 'pt-24'}`}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="manuscrit mb-2 text-xl text-or-800">Nous écrire</p>
          <h1 className="font-serif text-3xl font-bold text-encre-950 sm:text-4xl">Contact</h1>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-encre-600 sm:text-sm">
            Un retour d’expérience, une suggestion, une question ou un besoin d’aide pour animer.
          </p>
        </div>
        <FormulaireContact />
      </div>
    </div>
  );
}
