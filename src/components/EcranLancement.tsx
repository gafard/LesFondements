'use client';

import { useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight, Download, Wifi, WifiOff } from 'lucide-react';
import {
  CLE_DERNIER_PASSAGE,
  EVENEMENT_PASSAGE,
  lireDernierPassage,
  type DernierPassage,
} from '@/lib/marquePage';
import { VERSETS_CONNUS } from '@/data/versets';

/**
 * L'écran de lancement mobile.
 *
 * La page d'accueil éditoriale — feuille, collage, post-its — fait presque
 * dix écrans sur un téléphone, et son seul hero en fait 1116 px pour un
 * écran de 812 : on entre dans le parcours par une brochure. Sur desktop
 * c'est une belle page ; sur mobile, c'est un site web, et on voulait une
 * application.
 *
 * Ici : un seul écran, une seule action dominante, et de quoi savoir tout
 * de suite où l'on en est. Le reste de la page reste consultable en
 * défilant — mais on n'a plus à le traverser pour entrer.
 */

/**
 * `useSyncExternalStore` compare les instantanés par identité : renvoyer un
 * objet neuf à chaque lecture boucle indéfiniment. On les mémorise donc.
 */
let versetCache: { jour: number; valeur: { reference: string; texte: string } | null } | null = null;
let passageCache: { brut: string | null; valeur: DernierPassage | null } = { brut: '', valeur: null };

/** Le verset du jour : stable toute la journée, choisi sans réseau. */
function versetDuJour(): { reference: string; texte: string } | null {
  const jour = Math.floor(Date.now() / 86_400_000);
  if (versetCache?.jour === jour) return versetCache.valeur;
  versetCache = { jour, valeur: choisirVerset(jour) };
  return versetCache.valeur;
}

function choisirVerset(jour: number): { reference: string; texte: string } | null {
  const references = Object.keys(VERSETS_CONNUS).sort();
  if (!references.length) return null;
  const reference = references[jour % references.length];
  return { reference, texte: VERSETS_CONNUS[reference] };
}

function estInstallee(): boolean {
  if (typeof window === 'undefined') return false;
  const navigateur = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    !!navigateur.standalone ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Trois valeurs que seul le navigateur connaît. On les lit par
 * `useSyncExternalStore` plutôt que dans un effet : le rendu serveur et le
 * premier rendu client s'accordent, et il n'y a pas de seconde passe.
 */
const RIEN = () => () => {};

function useDernierPassage(): DernierPassage | null {
  const abonner = useCallback((rappel: () => void) => {
    window.addEventListener(EVENEMENT_PASSAGE, rappel);
    return () => window.removeEventListener(EVENEMENT_PASSAGE, rappel);
  }, []);
  return useSyncExternalStore(abonner, passageStable, () => null);
}

function passageStable(): DernierPassage | null {
  const brut = (() => {
    try {
      return window.localStorage.getItem(CLE_DERNIER_PASSAGE);
    } catch {
      return null;
    }
  })();
  if (brut !== passageCache.brut) passageCache = { brut, valeur: lireDernierPassage() };
  return passageCache.valeur;
}

function useEnLigne(): boolean {
  const abonner = useCallback((rappel: () => void) => {
    window.addEventListener('online', rappel);
    window.addEventListener('offline', rappel);
    return () => {
      window.removeEventListener('online', rappel);
      window.removeEventListener('offline', rappel);
    };
  }, []);
  return useSyncExternalStore(abonner, () => navigator.onLine, () => true);
}

export default function EcranLancement() {
  const passage = useDernierPassage();
  const enLigne = useEnLigne();
  const installee = useSyncExternalStore(RIEN, estInstallee, () => true);
  const verset = useSyncExternalStore(RIEN, versetDuJour, () => null);

  return (
    <section
      className="table-travail relative flex h-[100dvh] flex-col overflow-hidden px-5 lg:hidden"
      style={{
        paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* ── Barre d'identité ── */}
      <div className="flex shrink-0 items-center justify-between">
        <span className="font-serif text-sm font-bold text-encre-950">Les Fondements</span>
        <span
          className="inline-flex items-center gap-1.5 text-3xs font-bold uppercase tracking-[0.14em] text-encre-500"
          title={enLigne ? 'Connecté' : 'Vos écrits sont gardés sur cet appareil'}
        >
          {enLigne ? (
            <Wifi className="h-3 w-3 text-emerald-600" />
          ) : (
            <WifiOff className="h-3 w-3 text-amber-600" />
          )}
          {enLigne ? 'En ligne' : 'Hors ligne'}
        </span>
      </div>

      {/* ── L'action dominante ── */}
      <div className="flex min-h-0 flex-1 flex-col justify-center py-6">
        <div className="feuille pose-1 relative rounded-[6px] border border-parchemin-400 px-6 py-7">
          <span className="ruban -top-3 left-9 -rotate-2 rounded-[2px]" />

          {passage ? (
            <>
              <p className="text-3xs font-black uppercase tracking-[0.18em] text-or-700">
                {passage.sousTitre ?? 'Reprendre'}
              </p>
              <h1 className="mt-2.5 font-serif text-3xl font-bold leading-[1.08] text-encre-950">
                {passage.titre}
              </h1>
              <p className="manuscrit mt-2 text-xl font-bold text-encre-700">
                là où vous vous êtes arrêté
              </p>
              <Link
                href={passage.url}
                className="bouton-or mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-bold shadow-lg"
              >
                Continuer
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </>
          ) : (
            <>
              <p className="text-3xs font-black uppercase tracking-[0.18em] text-or-700">
                Le parcours des 20 fondements
              </p>
              <h1 className="mt-2.5 font-serif text-3xl font-bold leading-[1.08] text-encre-950">
                Ancrer sa foi.
                <br />
                <span className="italic text-or-700">Grandir ensemble.</span>
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-encre-700">
                Vingt fiches préparées seul, vécues chaque semaine en cellule.
              </p>
              <Link
                href="/login"
                className="bouton-or mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-bold shadow-lg"
              >
                Commencer
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </>
          )}
        </div>

        {/* ── Verset du jour ── */}
        {verset && (
          <div className="postit postit-jaune pose-3 relative mt-5 rounded-2xl px-5 py-4">
            <p className="text-3xs font-black uppercase tracking-[0.16em] text-amber-900">
              Verset du jour
            </p>
            <p className="mt-1.5 line-clamp-3 font-serif text-sm italic leading-relaxed text-encre-900">
              « {verset.texte} »
            </p>
            <p className="manuscrit mt-1.5 text-base font-bold text-encre-700">{verset.reference}</p>
          </div>
        )}
      </div>

      {/* ── Installation, discrète, en bas ── */}
      <div className="shrink-0">
        {installee ? (
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-encre-200 px-5 py-3 text-2xs font-bold text-encre-700"
          >
            Ouvrir mon parcours
          </Link>
        ) : (
          <p className="flex items-center justify-center gap-2 text-3xs leading-relaxed text-encre-500">
            <Download className="h-3 w-3 shrink-0" />
            Installez l&apos;application pour l&apos;ouvrir hors connexion
          </p>
        )}
      </div>
    </section>
  );
}
