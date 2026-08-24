'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Plus, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import ParcoursGate from '@/components/ParcoursGate';
import { addPost, deletePost, getPosts, subscribe, toggleAmen } from '@/lib/parcoursStore';
import { FICHES_META } from '@/data/fichesMeta';
import type { GroupPost } from '@/lib/types';

function TemoignagesContent() {
  const { user } = useAuth();
  const { group, unlockedStep } = useParcours();
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [formulaire, setFormulaire] = useState(false);
  const [ficheChoisie, setFicheChoisie] = useState<number>(1);
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [dernierPas, setDernierPas] = useState(unlockedStep);

  const charger = useCallback(() => {
    if (!group) return;
    void getPosts(group.id).then(setPosts);
  }, [group]);

  useEffect(() => {
    charger();
    if (!group) return;
    return subscribe(`posts:${group.id}`, charger);
  }, [group, charger]);

  // Quand une nouvelle fiche s'ouvre, la sélection par défaut la suit.
  if (unlockedStep !== dernierPas) {
    setDernierPas(unlockedStep);
    setFicheChoisie(Math.max(1, unlockedStep));
  }

  const temoignages = useMemo(() => posts.filter((post) => post.kind === 'louange'), [posts]);
  const fichesOuvertes = FICHES_META.filter((meta) => meta.id <= Math.max(1, unlockedStep));

  if (!group || !user) return null;

  const publier = async (event: React.FormEvent) => {
    event.preventDefault();
    if (texte.trim().length < 20) return;
    setEnvoi(true);
    await addPost({
      groupId: group.id,
      authorId: user.uid,
      authorName: user.displayName || 'Un membre',
      kind: 'louange',
      content: texte,
      step: ficheChoisie,
    });
    setTexte('');
    setFormulaire(false);
    setEnvoi(false);
    charger();
  };

  return (
    <div className="table-travail min-h-screen pb-16 pt-6">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="manuscrit mb-2 text-xl text-or-800">
            Mémoire & témoignages de la cellule « {group.name} »
          </p>
          <h1 className="font-serif text-3xl font-bold text-encre-950 sm:text-4xl">
            Ce que Dieu a fait
          </h1>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-encre-600 sm:text-sm">
            Les témoignages restent dans votre groupe. On y revient souvent : c&apos;est la mémoire
            de ce qui a changé pendant ces mois.
          </p>
        </div>

        {!formulaire ? (
          <button
            onClick={() => setFormulaire(true)}
            className="bouton-or mx-auto mb-8 flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold shadow-md"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Déposer un témoignage
          </button>
        ) : (
          <form
            onSubmit={publier}
            className="feuille relative mb-8 rounded-3xl border border-parchemin-300 p-6 shadow-md"
          >
            <span className="attache-pince -top-3 left-1/2 -translate-x-1/2" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-encre-950">Votre témoignage</h2>
              <button
                type="button"
                onClick={() => setFormulaire(false)}
                className="rounded-full p-1.5 text-encre-300 transition-colors hover:text-encre-700"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-encre-400">
                Lié à la fiche
              </label>
              <select
                value={ficheChoisie}
                onChange={(event) => setFicheChoisie(Number(event.target.value))}
                className="w-full rounded-xl border border-parchemin-300 bg-parchemin-50 px-3 py-2 text-xs font-medium text-encre-800 outline-none focus:border-or-400"
              >
                {fichesOuvertes.map((meta) => (
                  <option key={meta.id} value={meta.id}>
                    Fiche {meta.id} — {meta.titre}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <textarea
                value={texte}
                onChange={(event) => setTexte(event.target.value)}
                placeholder="Racontez ce qui a changé : une réconciliation, un fardeau déposé, une prière exaucée, un verset devenu vivant…"
                rows={4}
                className="manuscrit w-full resize-none rounded-2xl border border-parchemin-300 bg-parchemin-50 px-4 py-3 text-base leading-relaxed text-encre-950 outline-none placeholder:font-sans placeholder:text-xs placeholder:text-encre-300 focus:border-or-400"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-2xs text-encre-400">
                {texte.trim().length < 20
                  ? `Encore ${20 - texte.trim().length} caractères minimum`
                  : 'Prêt à être déposé'}
              </span>
              <button
                type="submit"
                disabled={envoi || texte.trim().length < 20}
                className="bouton-or rounded-full px-5 py-2.5 text-2xs font-bold disabled:opacity-40"
              >
                Partager au groupe
              </button>
            </div>
          </form>
        )}

        {temoignages.length === 0 ? (
          <div className="feuille rounded-3xl border border-dashed border-parchemin-400 py-16 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-encre-300" strokeWidth={1.5} />
            <p className="mt-4 font-serif text-sm font-bold text-encre-800">
              Aucun témoignage pour l&apos;instant
            </p>
            <p className="mx-auto mt-1 max-w-xs text-2xs leading-relaxed text-encre-500">
              Le premier ouvre souvent la porte aux autres. Même une petite chose compte.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {temoignages.map((post, index) => {
              const meta = FICHES_META.find((m) => m.id === post.step);
              const aAmen = post.amenBy.includes(user.uid);
              const poses = ['pose-1', 'pose-2', 'pose-3', 'pose-4'];
              const pose = poses[index % poses.length];

              return (
                <article
                  key={post.id}
                  className={`feuille ${pose} relative rounded-3xl border border-parchemin-300 p-6 shadow-sm transition-all hover:shadow-md`}
                >
                  <span className="ruban -top-2.5 left-6 -rotate-1 rounded-[2px]" />
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-or-300 to-or-500 text-xs font-bold text-encre-950 shadow-2xs">
                        {post.authorName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-serif text-sm font-bold text-encre-950">{post.authorName}</p>
                        <p className="text-2xs text-encre-400">
                          {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                          })}
                        </p>
                      </div>
                    </div>

                    {meta && (
                      <Link
                        href={`/fiches/${meta.id}`}
                        className="timbre shrink-0 rounded px-2.5 py-1 text-2xs font-bold text-or-800 hover:bg-or-100"
                      >
                        Fiche {meta.id}
                      </Link>
                    )}
                  </div>

                  <p className="manuscrit mt-4 text-xl leading-relaxed text-encre-950 whitespace-pre-wrap">
                    {post.content}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-parchemin-300 pt-3.5">
                    <button
                      onClick={async () => {
                        await toggleAmen(group.id, post.id, user.uid);
                        charger();
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-2xs font-bold transition-colors ${
                        aAmen
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-parchemin-100 text-encre-500 hover:bg-rose-50 hover:text-rose-600'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${aAmen ? 'fill-rose-500 text-rose-500' : ''}`} />
                      Amen{post.amenBy.length > 0 && ` (${post.amenBy.length})`}
                    </button>

                    {post.authorId === user.uid && (
                      <button
                        onClick={async () => {
                          await deletePost(group.id, post.id);
                          charger();
                        }}
                        className="text-2xs text-encre-300 transition-colors hover:text-rose-500"
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ParcoursGate allowPending>
      <TemoignagesContent />
    </ParcoursGate>
  );
}
