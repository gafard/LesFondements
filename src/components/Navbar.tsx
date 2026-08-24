'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Award,
  Bookmark,
  Brain,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  PenLine,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { useFondSombre } from '@/lib/fondSombre';

/** Routes vécues en plein écran : la barre y devient un simple filigrane. */
const ROUTES_IMMERSIVES = ['/onboarding', '/rejoindre', '/login', '/groupes/rencontre'];

const LIENS_PRINCIPAUX = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/fiches', label: 'Le parcours', icon: Compass },
  { href: '/groupes', label: 'Ma cellule', icon: Users },
  { href: '/memorisation', label: 'Mémorisation', icon: Brain },
  { href: '/journal', label: 'Journal', icon: PenLine },
];

const LIENS_SECONDAIRES = [
  { href: '/index-thematique', label: 'Index thématique', icon: Bookmark },
  { href: '/temoignages', label: 'Témoignages', icon: MessageCircle },
  { href: '/certificat', label: 'Mon attestation', icon: Award },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { group, gate } = useParcours();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [cheminPrecedent, setCheminPrecedent] = useState(pathname);

  const fondSombre = useFondSombre();
  const estAccueil = pathname === '/';
  const estImmersive = ROUTES_IMMERSIVES.some((route) => pathname.startsWith(route));
  const surFondSombre = (estAccueil && !scrolled) || estImmersive || fondSombre;

  /**
   * Une fois la personne connectée, c'est la coque de l'application qui
   * porte la navigation : colonne latérale sur grand écran, barre d'onglets
   * sur mobile. Cette barre-ci ne sert plus qu'aux pages publiques et aux
   * écrans plein écran, où elle se réduit à un filigrane.
   */
  const remplaceeParLaCoque = !!user && !estAccueil && !estImmersive;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Le menu mobile se referme quand on change de page.
  if (pathname !== cheminPrecedent) {
    setCheminPrecedent(pathname);
    setMenuOuvert(false);
  }

  if (remplaceeParLaCoque) return null;

  // ── Mode filigrane : logo seul, fond transparent ─────────────
  if (estImmersive) {
    return (
      <nav className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
          <Link href="/" className="pointer-events-auto flex items-center gap-2.5 group">
            <Image
              src="/logo-transparent.png"
              alt="Les Fondements Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <span className="font-serif text-sm font-bold tracking-tight text-parchemin-100">
              Les Fondements
            </span>
          </Link>

          {user && (
            <button
              onClick={() => void logout()}
              className="pointer-events-auto rounded-full bg-white/8 px-3.5 py-1.5 text-2xs font-bold text-parchemin-100/70 backdrop-blur-sm transition-colors hover:bg-white/16 hover:text-parchemin-100"
            >
              Se déconnecter
            </button>
          )}
        </div>
      </nav>
    );
  }

  const classeNav = `fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
    surFondSombre
      ? 'border-b border-white/10 bg-encre-950/70 backdrop-blur-xl'
      : 'border-b border-parchemin-400/60 bg-white/90 backdrop-blur-xl'
  }`;

  const lienClasse = (actif: boolean) =>
    `flex items-center gap-1.5 rounded-xl px-3 py-2 text-2xs font-bold transition-all ${
      actif
        ? 'bg-or-100 text-or-700'
        : surFondSombre
          ? 'text-parchemin-100/70 hover:bg-white/10 hover:text-or-200'
          : 'text-encre-600 hover:bg-parchemin-100 hover:text-encre-900'
    }`;

  return (
    <nav className={classeNav}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center gap-2.5">
            <Image
              src="/logo-transparent.png"
              alt="Les Fondements Logo"
              width={36}
              height={36}
              className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <span
              className={`font-serif text-lg font-bold tracking-tight ${
                surFondSombre ? 'text-parchemin-100' : 'text-encre-950'
              }`}
            >
              Les Fondements
            </span>
          </Link>

          {/* ── Desktop ── */}
          <div className="hidden items-center gap-1 lg:flex">
            {user ? (
              <>
                {LIENS_PRINCIPAUX.map((lien) => (
                  <Link
                    key={lien.href}
                    href={lien.href}
                    className={lienClasse(
                      lien.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(lien.href)
                    )}
                  >
                    <lien.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {lien.label}
                  </Link>
                ))}

                <div
                  className={`ml-2 flex items-center gap-2.5 border-l pl-3 ${
                    surFondSombre ? 'border-white/15' : 'border-parchemin-400/70'
                  }`}
                >
                  {group && gate.state === 'ouvert' && (
                    <span className="hidden rounded-full border border-or-300/40 bg-or-50 px-2.5 py-1 text-2xs font-bold text-or-700 xl:inline">
                      Fiche {group.currentStep}/20
                    </span>
                  )}
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-or-400 text-2xs font-bold text-encre-950">
                    {user.displayName ? (
                      user.displayName.charAt(0).toUpperCase()
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </span>
                  <button
                    onClick={() => void logout()}
                    title="Se déconnecter"
                    className={`rounded-lg p-1.5 transition-colors ${
                      surFondSombre
                        ? 'text-parchemin-100/50 hover:text-rose-300'
                        : 'text-encre-300 hover:text-rose-500'
                    }`}
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
              </>
            ) : (
              <>
                {[
                  { href: '/fiches', label: 'Le parcours' },
                  { href: '/index-thematique', label: 'Thèmes' },
                  { href: '/ressources', label: 'Bibliographie' },
                ].map((lien) => (
                  <Link
                    key={lien.href}
                    href={lien.href}
                    className={`rounded-xl px-3 py-2 text-2xs font-bold transition-colors ${
                      surFondSombre
                        ? 'text-parchemin-100/75 hover:text-or-200'
                        : 'text-encre-600 hover:text-encre-950'
                    }`}
                  >
                    {lien.label}
                  </Link>
                ))}
                <Link
                  href="/login"
                  className="bouton-or ml-2 rounded-full px-5 py-2.5 text-2xs font-bold"
                >
                  Commencer
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile ── */}
          <button
            onClick={() => setMenuOuvert((open) => !open)}
            className={`rounded-xl p-2 lg:hidden ${
              surFondSombre ? 'text-parchemin-100' : 'text-encre-700'
            }`}
            aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOuvert}
          >
            {menuOuvert ? (
              <X className="h-6 w-6" strokeWidth={1.75} />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {menuOuvert && (
        <div className="absolute inset-x-0 max-h-[80vh] overflow-y-auto border-t border-parchemin-300 bg-white shadow-2xl lg:hidden">
          <div className="space-y-1 px-4 pb-6 pt-4">
            {user ? (
              <>
                {group && gate.state === 'ouvert' && (
                  <div className="mb-3 rounded-2xl bg-or-50 px-4 py-3">
                    <p className="text-2xs font-bold uppercase tracking-[0.16em] text-or-700">
                      {group.name}
                    </p>
                    <p className="mt-0.5 text-xs text-encre-600">
                      Fiche {group.currentStep} sur 20 ·{' '}
                      {group.stepPhase === 'rencontre' ? 'rencontre en cours' : 'préparation'}
                    </p>
                  </div>
                )}

                {[...LIENS_PRINCIPAUX, ...LIENS_SECONDAIRES].map((lien) => (
                  <Link
                    key={lien.href}
                    href={lien.href}
                    className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold text-encre-800 hover:bg-parchemin-100"
                  >
                    <lien.icon className="h-4 w-4 text-or-600" strokeWidth={1.75} />
                    {lien.label}
                  </Link>
                ))}

                <div className="border-t border-parchemin-300 pt-3">
                  <button
                    onClick={() => void logout()}
                    className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.75} />
                    Se déconnecter
                  </button>
                </div>
              </>
            ) : (
              <>
                {[
                  { href: '/fiches', label: 'Le parcours' },
                  { href: '/index-thematique', label: 'Index thématique' },
                  { href: '/ressources', label: 'Bibliographie' },
                ].map((lien) => (
                  <Link
                    key={lien.href}
                    href={lien.href}
                    className="block rounded-2xl px-3.5 py-3 text-xs font-bold text-encre-800 hover:bg-parchemin-100"
                  >
                    {lien.label}
                  </Link>
                ))}
                <Link
                  href="/login"
                  className="bouton-or mt-2 block rounded-full px-4 py-3 text-center text-xs font-bold"
                >
                  Commencer le parcours
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
