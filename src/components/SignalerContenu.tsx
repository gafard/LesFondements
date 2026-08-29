'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { Flag, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import {
  signalerContenu,
  type MotifSignalement,
  type TypeContenuSignale,
} from '@/lib/moderation';

const MOTIFS: Array<{ value: MotifSignalement; label: string }> = [
  { value: 'dangereux', label: 'Conseil dangereux ou contenu préoccupant' },
  { value: 'haine', label: 'Haine ou discrimination' },
  { value: 'harcelement', label: 'Harcèlement ou attaque personnelle' },
  { value: 'vie_privee', label: 'Information privée exposée' },
  { value: 'spam', label: 'Spam ou promotion' },
  { value: 'autre', label: 'Autre raison' },
];

export default function SignalerContenu({
  type,
  cibleId,
  discret = false,
}: {
  type: TypeContenuSignale;
  cibleId: string;
  discret?: boolean;
}) {
  const { user } = useAuth();
  const titreId = useId();
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState<MotifSignalement>('autre');
  const [commentaire, setCommentaire] = useState('');
  const [etat, setEtat] = useState<'repos' | 'envoi' | 'envoye' | 'erreur'>('repos');

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-encre-600 hover:bg-white/60"
      >
        <Flag className="h-4 w-4" /> Signaler
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={
          discret
            ? 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-encre-600 hover:bg-white/60 hover:text-rose-800'
            : 'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-encre-600 hover:bg-white/60 hover:text-rose-800'
        }
        aria-label={discret ? 'Signaler ce contenu' : undefined}
      >
        <Flag className="h-4 w-4" /> {!discret && 'Signaler'}
      </button>

      {ouvert && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-encre-950/70 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titreId}
            className="feuille relative w-full max-w-md rounded-3xl border border-parchemin-300 p-6 text-encre-950 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full hover:bg-parchemin-200"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 id={titreId} className="pr-10 font-serif text-xl font-bold">Signaler avec discernement</h2>
            <p className="mt-2 text-sm leading-relaxed text-encre-700">
              Le contenu sera transmis à l’équipe de modération. La personne signalée ne verra pas votre identité.
            </p>

            {etat === 'envoye' ? (
              <div role="status" className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                Merci. Le signalement a été déposé pour examen.
              </div>
            ) : (
              <form
                className="mt-5 space-y-4"
                onSubmit={async (evenement) => {
                  evenement.preventDefault();
                  setEtat('envoi');
                  try {
                    await signalerContenu(user.uid, type, cibleId, motif, commentaire);
                    setEtat('envoye');
                  } catch {
                    setEtat('erreur');
                  }
                }}
              >
                <label className="block text-sm font-bold">
                  Motif
                  <select
                    value={motif}
                    onChange={(evenement) => setMotif(evenement.target.value as MotifSignalement)}
                    className="mt-2 w-full rounded-2xl border border-parchemin-400 bg-white px-4 py-3 text-base"
                  >
                    {MOTIFS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-bold">
                  Précision facultative
                  <textarea
                    value={commentaire}
                    maxLength={500}
                    rows={3}
                    onChange={(evenement) => setCommentaire(evenement.target.value)}
                    className="mt-2 w-full rounded-2xl border border-parchemin-400 bg-white px-4 py-3 text-base"
                  />
                </label>
                {etat === 'erreur' && <p role="alert" className="text-sm text-rose-800">Le signalement n’a pas pu partir. Réessayez.</p>}
                <button disabled={etat === 'envoi'} className="bouton-or min-h-11 w-full rounded-full px-5 text-sm font-bold disabled:opacity-60">
                  {etat === 'envoi' ? 'Envoi…' : 'Envoyer le signalement'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
