'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import {
  definirConsentementMesure,
  lireConsentementMesure,
  type ConsentementMesure,
} from '@/lib/mesure';

export default function ReglagesConfidentialitePage() {
  const router = useRouter();
  const { user, supprimerCompte } = useAuth();
  const [consentement, setConsentement] = useState<ConsentementMesure>(() => lireConsentementMesure());
  const [confirmation, setConfirmation] = useState('');
  const [suppression, setSuppression] = useState(false);
  const [erreur, setErreur] = useState('');

  if (!user) {
    return (
      <main className="table-travail min-h-screen px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-bold">Confidentialité</h1>
        <Link href="/login?suite=/parametres/confidentialite" className="bouton-or mt-6 inline-flex min-h-11 items-center rounded-full px-6 font-bold">Se connecter</Link>
      </main>
    );
  }

  const choisir = (valeur: 'accepte' | 'refuse') => {
    definirConsentementMesure(valeur);
    setConsentement(valeur);
  };

  return (
    <div className="table-travail min-h-screen px-4 py-10 sm:px-6">
      <main className="mx-auto max-w-3xl space-y-6">
        <header className="feuille rounded-4xl border border-parchemin-300 p-7 shadow-md">
          <ShieldCheck className="h-7 w-7 text-or-700" aria-hidden="true" />
          <h1 className="mt-3 font-serif text-3xl font-bold text-encre-950">Confidentialité et données</h1>
          <p className="mt-2 text-sm leading-relaxed text-encre-700">Décidez ce qui peut quitter cet appareil et gardez la maîtrise de votre compte.</p>
        </header>

        <section className="fiche-bristol rounded-3xl border border-parchemin-300 p-6">
          <div className="flex gap-3">
            <BarChart3 className="mt-1 h-5 w-5 shrink-0 text-or-700" aria-hidden="true" />
            <div>
              <h2 className="font-serif text-xl font-bold">Mesure d’usage anonyme</h2>
              <p className="mt-2 text-sm leading-relaxed text-encre-700">Partage uniquement des jalons limités — dont l’ouverture du rituel — sans identité, groupe, localisation ou contenu écrit.</p>
            </div>
          </div>
          <fieldset className="mt-5 grid gap-3 sm:grid-cols-2">
            <legend className="sr-only">Autoriser la mesure d’usage</legend>
            {([
              ['accepte', 'J’accepte la mesure minimale'],
              ['refuse', 'Je refuse toute transmission'],
            ] as const).map(([valeur, label]) => (
              <button
                key={valeur}
                type="button"
                onClick={() => choisir(valeur)}
                aria-pressed={consentement === valeur}
                className={`min-h-11 rounded-2xl border px-4 py-3 text-sm font-bold ${consentement === valeur ? 'border-or-500 bg-or-100 text-encre-950' : 'border-parchemin-400 bg-white text-encre-700'}`}
              >
                {label}
              </button>
            ))}
          </fieldset>
        </section>

        <section className="rounded-3xl border border-rose-300 bg-rose-50 p-6">
          <Trash2 className="h-6 w-6 text-rose-700" aria-hidden="true" />
          <h2 className="mt-3 font-serif text-xl font-bold text-rose-950">Supprimer mon compte</h2>
          <p className="mt-2 text-sm leading-relaxed text-rose-900">Cette action retire vos réponses, votre journal, votre mémorisation et vos témoignages. Elle est irréversible.</p>
          <label className="mt-5 block text-sm font-bold text-rose-950">
            Écrivez SUPPRIMER pour confirmer
            <input
              value={confirmation}
              onChange={(evenement) => setConfirmation(evenement.target.value)}
              className="mt-2 min-h-11 w-full rounded-2xl border border-rose-300 bg-white px-4 text-base"
              autoComplete="off"
            />
          </label>
          {erreur && <p role="alert" className="mt-3 text-sm font-bold text-rose-900">{erreur}</p>}
          <button
            type="button"
            disabled={confirmation !== 'SUPPRIMER' || suppression}
            onClick={async () => {
              setSuppression(true);
              setErreur('');
              try {
                await supprimerCompte();
                router.replace('/');
              } catch (cause) {
                const code = cause instanceof Error ? cause.message : '';
                setErreur(
                  code === 'TRANSFERT_GROUPE_REQUIS'
                    ? 'Transmettez d’abord l’animation de votre cellule à un co-animateur.'
                    : code === 'CONNEXION_RECENTE_REQUISE'
                      ? 'Reconnectez-vous, puis revenez ici pour confirmer la suppression.'
                      : 'La suppression n’a pas abouti. Vos données restent en place.'
                );
                setSuppression(false);
              }
            }}
            className="mt-4 min-h-11 rounded-full bg-rose-800 px-6 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {suppression ? 'Suppression…' : 'Supprimer définitivement'}
          </button>
        </section>

        <p className="text-center text-sm"><Link href="/confidentialite" className="font-bold text-encre-700 underline">Lire la politique complète</Link></p>
      </main>
    </div>
  );
}
