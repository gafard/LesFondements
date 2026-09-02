'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BookOpen, Search, X } from 'lucide-react';
import { ouvrirEtude } from '@/lib/panneauEtude';
import {
  TOUS_LES_LIVRES,
  abreger,
  analyserReference,
  livreParNom,
  type Livre,
} from '@/lib/reference';

/** Les écrans vécus en plein écran gardent leur propre chrome. */
const ROUTES_SANS_BOUTON = ['/onboarding', '/rejoindre', '/login', '/groupes/rencontre'];

/**
 * Le point d'entrée permanent vers le panneau d'étude : on tape une
 * référence (« Rm 8 », « 1 Jn 4:16 ») ou un début de nom de livre.
 */
export default function BoutonEtude() {
  const pathname = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState('');
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ouvert) champ.current?.focus();
  }, [ouvert]);

  useEffect(() => {
    const auClavier = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOuvert(false);
      // Ctrl/Cmd + K : le raccourci attendu pour une recherche.
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOuvert((valeur) => !valeur);
      }
    };
    window.addEventListener('keydown', auClavier);
    return () => window.removeEventListener('keydown', auClavier);
  }, []);

  const suggestions = useMemo(() => resoudre(recherche), [recherche]);

  if (ROUTES_SANS_BOUTON.some((route) => pathname.startsWith(route))) return null;

  const ouvrirPremiere = () => {
    const directe = analyserReference(recherche);
    if (directe) {
      ouvrirEtude(directe);
      setOuvert(false);
      setRecherche('');
      return;
    }
    const premier = suggestions[0];
    if (premier) {
      ouvrirEtude({ livre: premier, chapitre: 1, brut: `${premier.nom} 1` });
      setOuvert(false);
      setRecherche('');
    }
  };

  return (
    <>
      <button
        onClick={() => setOuvert(true)}
        // Sur mobile, le bouton se pose au-dessus de la barre d'onglets ; sur
        // grand écran, la barre n'existe pas et il reprend le coin bas.
        className={`fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-3 z-40 h-12 w-12 items-center justify-center rounded-full bg-encre-950 p-0 text-xs font-bold text-or-300 shadow-lg transition-all hover:shadow-xl lg:bottom-auto lg:right-0 lg:top-1/2 lg:h-14 lg:w-11 lg:-translate-y-1/2 lg:rounded-l-2xl lg:rounded-r-none ${
          // L'accueil mobile est un écran de lancement : rien ne doit s'y
          // superposer. Le bouton d'étude revient dès qu'on entre.
          pathname === '/' ? 'hidden lg:flex' : 'flex'
        }`}
        aria-label="Ouvrir la Bible et les outils d’étude"
      >
        <BookOpen className="h-5 w-5" strokeWidth={1.75} />
        <span className="sr-only">Étudier</span>
      </button>

      {ouvert && (
        <div className="fixed inset-0 z-[65] flex items-start justify-center px-4 pt-[12vh]">
          <button
            type="button"
            onClick={() => setOuvert(false)}
            aria-label="Fermer"
            className="absolute inset-0 bg-encre-950/50 backdrop-blur-sm"
          />

          <div className="animate-reveal relative w-full max-w-lg overflow-hidden rounded-4xl border border-parchemin-400 bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-parchemin-300 px-5 py-4">
              <Search className="h-4 w-4 shrink-0 text-encre-300" />
              <input
                ref={champ}
                value={recherche}
                onChange={(event) => setRecherche(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && ouvrirPremiere()}
                placeholder="Une référence — Rm 8:31, 1 Jn 4:16, Psaume 139…"
                className="flex-1 bg-transparent text-sm text-encre-900 outline-none placeholder:text-encre-300"
              />
              <button
                onClick={() => setOuvert(false)}
                className="rounded-full p-1 text-encre-300 transition-colors hover:text-encre-700"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {recherche.trim() === '' ? (
                <div className="px-3 py-4">
                  <p className="mb-3 text-2xs font-bold uppercase tracking-[0.16em] text-encre-400">
                    Segond 1910, annotée des numéros Strong
                  </p>
                  <p className="text-xs leading-relaxed text-encre-500">
                    Chaque mot renvoie à son terme hébreu ou grec, avec les renvois du Treasury,
                    les thèmes de Nave et le commentaire de Matthew Henry. Tout fonctionne
                    hors-ligne une fois le livre consulté.
                  </p>
                </div>
              ) : suggestions.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-encre-400">
                  Aucun livre ne correspond. Essayez « Jn », « Rm 8 », « Psaume 23 ».
                </p>
              ) : (
                suggestions.map((livre) => (
                  <button
                    key={livre.code}
                    onClick={() => {
                      const directe = analyserReference(recherche);
                      ouvrirEtude(
                        directe && directe.livre.code === livre.code
                          ? directe
                          : { livre, chapitre: 1, brut: `${livre.nom} 1` }
                      );
                      setOuvert(false);
                      setRecherche('');
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors hover:bg-parchemin-100"
                  >
                    <span className="font-serif text-sm font-bold text-encre-900">
                      {livre.nom}
                    </span>
                    <span className="text-2xs text-encre-300">
                      {abreger(livre)} · {livre.testament === 'at' ? 'Ancien' : 'Nouveau'} Testament
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function resoudre(recherche: string): Livre[] {
  const valeur = recherche.trim();
  if (!valeur) return [];

  // « Rm 8:31 » → on isole la partie alphabétique pour proposer le livre.
  const nom = valeur.replace(/[\d:.\-–\s]+$/, '').trim();
  const exact = livreParNom(nom);
  if (exact) return [exact];

  const cle = nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  if (cle.length < 1) return [];

  return TOUS_LES_LIVRES.filter((livre) =>
    livre.nom
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .includes(cle)
  ).slice(0, 8);
}
