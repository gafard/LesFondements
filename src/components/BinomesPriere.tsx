'use client';

import { useCallback, useEffect, useState } from 'react';
import { HeartHandshake, Plus, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { creerBinome, defaireBinome, getBinomes } from '@/lib/parcoursStore';
import type { Binome } from '@/lib/types';

/**
 * Qui veille sur qui.
 *
 * Le livret demande de prier « en équipe, à 2 ou 3 » et de savoir « qui fait
 * quoi », pour ne pas court-circuiter le travail d'un autre. Il met en garde,
 * dans la même page, contre le regard qui inventorie.
 *
 * On affiche donc l'attelage et rien d'autre : des noms, une date. Pas de
 * sujet, pas de note, pas d'avancement. Un carnet de suivi par membre aurait
 * répondu au même besoin en trahissant le texte qui le formule.
 */
export default function BinomesPriere() {
  const { user } = useAuth();
  const { group, members, isLeader } = useParcours();
  const [binomes, setBinomes] = useState<Binome[]>([]);
  const [choisis, setChoisis] = useState<string[]>([]);
  const [ouvert, setOuvert] = useState(false);

  const actifs = members.filter((m) => m.status === 'actif');

  const lire = useCallback(async () => {
    if (!group) return [];
    return getBinomes(group.id);
  }, [group]);

  // Le drapeau évite d'écrire dans un composant démonté pendant que la
  // lecture revient.
  useEffect(() => {
    let vivant = true;
    void lire().then((liste) => {
      if (vivant) setBinomes(liste);
    });
    return () => {
      vivant = false;
    };
  }, [lire]);

  const relire = useCallback(async () => {
    setBinomes(await lire());
  }, [lire]);

  if (!group || !user) return null;

  const nomDe = (uid: string) =>
    actifs.find((m) => m.uid === uid)?.displayName ?? 'Un membre';

  const basculer = (uid: string) =>
    setChoisis((actuels) =>
      actuels.includes(uid)
        ? actuels.filter((x) => x !== uid)
        : actuels.length >= 3
          ? actuels
          : [...actuels, uid]
    );

  const attacher = async () => {
    if (choisis.length < 2) return;
    await creerBinome(group.id, choisis, user.uid);
    setChoisis([]);
    setOuvert(false);
    await relire();
  };

  return (
    <div className="rounded-3xl border border-parchemin-400 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-encre-950">
          <HeartHandshake className="h-5 w-5 text-or-600" strokeWidth={1.75} />
          Qui prie avec qui
        </h3>
        {isLeader && actifs.length >= 2 && (
          <button
            onClick={() => setOuvert((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-encre-950 px-4 py-2 text-2xs font-bold text-parchemin-100 transition-colors hover:bg-encre-800"
          >
            <Plus className="h-3.5 w-3.5" />
            {ouvert ? 'Annuler' : 'Attacher deux ou trois personnes'}
          </button>
        )}
      </div>

      <p className="mt-2 text-2xs leading-relaxed text-encre-500">
        « Le faire en équipe, à 2 ou 3. Pas trop sinon ça fuse dans tous les sens, pas trop peu
        non plus. » — On note qui veille sur qui, jamais ce qui s’y dit.
      </p>

      {ouvert && (
        <div className="mt-4 rounded-2xl bg-parchemin-100/70 p-4">
          <p className="text-2xs font-bold text-encre-700">
            Choisissez deux ou trois personnes ({choisis.length}/3)
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {actifs.map((membre) => (
              <button
                key={membre.uid}
                onClick={() => basculer(membre.uid)}
                className={`rounded-full px-3 py-1.5 text-2xs font-bold transition-colors ${
                  choisis.includes(membre.uid)
                    ? 'bg-or-500 text-encre-950'
                    : 'bg-white text-encre-600 hover:bg-parchemin-200'
                }`}
              >
                {membre.displayName}
              </button>
            ))}
          </div>
          <button
            onClick={attacher}
            disabled={choisis.length < 2}
            className="bouton-or mt-3 rounded-full px-5 py-2 text-2xs font-bold disabled:opacity-30"
          >
            Les attacher
          </button>
        </div>
      )}

      {binomes.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-parchemin-100/60 px-4 py-3 text-2xs italic leading-relaxed text-encre-500">
          Personne n’est encore attaché. Rien n’oblige à le faire : c’est un repère pour ne
          pas laisser quelqu’un de côté, pas une organisation à remplir.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {binomes.map((binome) => (
            <li
              key={binome.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-parchemin-100/70 px-4 py-3"
            >
              <span className="text-sm font-semibold text-encre-800">
                {binome.membres.map(nomDe).join(' · ')}
              </span>
              {isLeader && (
                <button
                  onClick={async () => {
                    await defaireBinome(group.id, binome.id);
                    await relire();
                  }}
                  aria-label="Défaire cet attelage"
                  className="rounded-full p-1 text-encre-300 transition-colors hover:text-rose-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
