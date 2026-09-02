'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ouvrirCentre } from '@/lib/centre';
import { useApplication } from '@/lib/application';
import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Bell,
  Bookmark,
  Smartphone,
  BookMarked,
  Brain,
  Compass,
  Home,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  PenLine,
  Printer,
  Search,
  Shield,
  ShieldCheck,
  Sunrise,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import NotificationCenter from '@/components/NotificationCenter';
import SyncStatusBadge from '@/components/SyncStatusBadge';
import { flushPendingWrites } from '@/lib/firestore';

/**
 * La coque de l'application.
 *
 * Le contenu était déjà celui d'une application ; l'enveloppe, elle, restait
 * celle d'un site : un bandeau de liens en haut, une navigation cachée
 * derrière un hamburger, une colonne centrée au milieu d'un écran large.
 *
 * Ici :
 *  · sur mobile, une barre d'onglets fixe en bas — à portée de pouce, et
 *    toujours visible, comme dans n'importe quelle application ;
 *  · sur grand écran, une colonne latérale permanente qui porte la
 *    navigation et le contexte du groupe, et un contenu qui occupe la place.
 *
 * Les écrans vécus en plein écran — la présentation publique, la connexion,
 * l'entrée dans un groupe, la rencontre en direct — n'ont pas de coque :
 * ils portent la leur.
 */

const ROUTES_SANS_COQUE = ['/', '/login', '/onboarding', '/rejoindre', '/groupes/rencontre'];

interface Destination {
  href: string;
  label: string;
  /** Version courte, pour la barre d'onglets. */
  court: string;
  icon: LucideIcon;
}

const PRINCIPALES: Destination[] = [
  { href: '/dashboard', label: 'Tableau de bord', court: 'Accueil', icon: Home },
  { href: '/aujourdhui', label: 'Aujourd’hui', court: 'Aujourd’hui', icon: Sunrise },
  { href: '/fiches', label: 'Le parcours', court: 'Parcours', icon: Compass },
  { href: '/groupes', label: 'Ma cellule', court: 'Cellule', icon: Users },
  { href: '/memorisation', label: 'Mémorisation', court: 'Versets', icon: Brain },
];

const SECONDAIRES: Destination[] = [
  { href: '/journal', label: 'Journal', court: 'Journal', icon: PenLine },
  { href: '/recherche', label: 'Retrouver mes écrits', court: 'Recherche', icon: Search },
  { href: '/transformation', label: 'Mon chemin parcouru', court: 'Chemin', icon: TrendingUp },
  { href: '/carnet-export', label: 'Carnet de Disciple (PDF)', court: 'Carnet', icon: Printer },
  { href: '/temoignages', label: 'Témoignages', court: 'Témoignages', icon: MessageCircle },
  { href: '/ressources', label: 'Bibliothèque & Contact', court: 'Ressources', icon: BookMarked },
  { href: '/index-thematique', label: 'Index thématique', court: 'Index', icon: Bookmark },
  { href: '/guide-pastoral', label: 'Guide pastoral', court: 'Guide', icon: Shield },
  { href: '/certificat', label: 'Mon attestation', court: 'Attestation', icon: Award },
  { href: '/parametres', label: 'Mes réglages', court: 'Réglages', icon: ShieldCheck },
];

const ONGLETS_MOBILES = PRINCIPALES.slice(0, 4);
const MENU_MOBILE = [PRINCIPALES[4], ...SECONDAIRES];

function estActive(pathname: string, href: string): boolean {
  return href === '/dashboard' ? pathname === href : pathname.startsWith(href);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [notifOuvert, setNotifOuvert] = useState(false);

  useEffect(() => {
    if (!user) return;
    const synchroniser = () => void flushPendingWrites(user.uid);
    synchroniser();
    window.addEventListener('online', synchroniser);
    return () => window.removeEventListener('online', synchroniser);
  }, [user]);

  const sansCoque = useMemo(
    () =>
      ROUTES_SANS_COQUE.some((route) =>
        route === '/' ? pathname === '/' : pathname.startsWith(route)
      ),
    [pathname]
  );

  // Sans compte, on ne montre pas une coque d'application vide.
  if (sansCoque || !user) return <>{children}</>;

  return (
    <div className="coque-table-travail min-h-screen lg:flex">
      <a href="#contenu-principal" className="skip-link">Aller au contenu</a>
      <ColonneLaterale pathname={pathname} onOuvrirNotifs={() => setNotifOuvert(true)} />

      <div className="min-w-0 flex-1">
        <BarreMobile onOuvrirNotifs={() => setNotifOuvert(true)} />
        {/* La marge basse laisse la place à la barre d'onglets et au pouce. */}
        <main id="contenu-principal" tabIndex={-1} className="pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </main>
      </div>

      <BarreOnglets
        key={pathname}
        pathname={pathname}
        onOuvrirNotifs={() => setNotifOuvert(true)}
      />

      <NotificationCenter ouvert={notifOuvert} onFermer={() => setNotifOuvert(false)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Grand écran : une colonne latérale permanente
// ─────────────────────────────────────────────────────────────

function ColonneLaterale({
  pathname,
  onOuvrirNotifs,
}: {
  pathname: string;
  onOuvrirNotifs: () => void;
}) {
  const { miseAJourPrete } = useApplication();
  const { logout } = useAuth();
  const { group, gate } = useParcours();

  return (
    <aside className="nuit reliure-bureau sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto px-4 py-5 text-parchemin-100 lg:flex xl:w-72">
      <Link href="/dashboard" className="group mb-6 flex items-center gap-3 px-2">
        <Image
          src="/logo-transparent.png"
          alt="Les Fondements"
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
          priority
        />
        <span className="flex flex-col leading-none">
          <span className="font-serif text-base font-bold text-parchemin-100">Les Fondements</span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-or-400/80">
            Parcours vivant
          </span>
        </span>
      </Link>

      {group && gate.state === 'ouvert' && (
        <Link
          href="/groupes"
          className="mb-5 rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-3 transition-colors hover:bg-white/12"
        >
          <p className="truncate text-2xs font-bold uppercase tracking-[0.14em] text-parchemin-100/45">
            {group.name}
          </p>
          <p className="mt-1 text-xs font-semibold text-or-300">
            Fiche {group.currentStep} sur 20
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <span
              className="block h-full rounded-full bg-or-400 transition-[width] duration-500"
              style={{ width: `${(group.closedSteps.length / 20) * 100}%` }}
            />
          </div>
        </Link>
      )}

      <nav className="space-y-0.5">
        {PRINCIPALES.map((lien) => (
          <LienLateral key={lien.href} lien={lien} actif={estActive(pathname, lien.href)} />
        ))}
      </nav>

      <p className="mb-1 mt-6 px-3 text-2xs font-bold uppercase tracking-[0.16em] text-parchemin-100/55">
        Aller plus loin
      </p>
      <nav className="space-y-0.5">
        {SECONDAIRES.map((lien) => (
          <LienLateral key={lien.href} lien={lien} actif={estActive(pathname, lien.href)} />
        ))}
      </nav>

      <button
        onClick={onOuvrirNotifs}
        className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-2xs font-bold text-or-300 transition-colors hover:bg-white/12"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        Rappels & Notifications
      </button>

      {/* Installation, paquets hors connexion et mises à jour : un seul
          endroit, consultable quand on veut plutôt qu'une invite qui
          surgit et qu'on écarte pour toujours. */}
      <button
        onClick={ouvrirCentre}
        className="mt-2 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-2xs font-bold text-parchemin-100/70 transition-colors hover:bg-white/12 hover:text-parchemin-100"
      >
        <Smartphone className="h-4 w-4" strokeWidth={1.75} />
        L&apos;application
        {miseAJourPrete && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-or-400" aria-label="Mise à jour disponible" />
        )}
      </button>

      <div className="mt-3 px-1">
        <SyncStatusBadge />
      </div>

      <button
        onClick={() => void logout()}
        className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-2xs font-bold text-parchemin-100/45 transition-colors hover:bg-white/8 hover:text-rose-300"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
        Se déconnecter
      </button>

      <div className="mt-3 pt-3 border-t border-white/10 text-[9px] leading-snug text-parchemin-100/35">
        <p className="font-serif italic">
          Contenu adapté du livret original (2015)
        </p>
        <p className="mt-0.5 text-[8px] text-parchemin-100/25">
          Prototype numérique non officiel
        </p>
      </div>
    </aside>
  );
}

function LienLateral({ lien, actif }: { lien: Destination; actif: boolean }) {
  const Icone = lien.icon;
  return (
    <Link
      href={lien.href}
      aria-current={actif ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors ${
        actif
          ? 'bg-or-400 text-encre-950'
          : 'text-parchemin-100/70 hover:bg-white/8 hover:text-parchemin-100'
      }`}
    >
      <Icone className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      {lien.label}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Mobile : une barre de titre contextuelle, une barre d'onglets
// ─────────────────────────────────────────────────────────────

function BarreMobile({ onOuvrirNotifs }: { onOuvrirNotifs: () => void }) {
  const pathname = usePathname();
  const { group } = useParcours();
  const { logout } = useAuth();

  const titre =
    [...PRINCIPALES, ...SECONDAIRES].find((lien) => estActive(pathname, lien.href))?.label ??
    'Les Fondements';

  return (
    <header className="sticky top-0 z-30 border-b border-parchemin-300 bg-parchemin-50/90 px-4 pb-2.5 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <Image
            src="/logo-transparent.png"
            alt="Logo"
            width={26}
            height={26}
            className="h-6.5 w-6.5 shrink-0 object-contain"
          />
          <span className="truncate font-serif text-lg font-bold text-encre-950">{titre}</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="mobile-sync">
            <SyncStatusBadge />
          </div>
          <button
            onClick={onOuvrirNotifs}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-parchemin-200 text-encre-700 transition-colors hover:bg-parchemin-300 active:scale-95"
            aria-label="Rappels et notifications"
            title="Rappels et notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            onClick={() => void logout()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-parchemin-200 text-encre-700 transition-colors hover:bg-rose-100 hover:text-rose-700 active:scale-95"
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </button>
          {group && (
            <span className="shrink-0 rounded-full bg-or-100 px-2.5 py-0.5 text-2xs font-bold text-encre-800">
              Fiche {group.currentStep}/20
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

function BarreOnglets({
  pathname,
  onOuvrirNotifs,
}: {
  pathname: string;
  onOuvrirNotifs: () => void;
}) {
  const [plusOuvert, setPlusOuvert] = useState(false);
  const boutonPlus = useRef<HTMLButtonElement>(null);
  const premierLien = useRef<HTMLAnchorElement>(null);
  const panneauPlus = useRef<HTMLElement>(null);
  const { miseAJourPrete } = useApplication();
  const plusActif = plusOuvert || MENU_MOBILE.some((lien) => estActive(pathname, lien.href));

  useEffect(() => {
    if (!plusOuvert) return;
    const debordement = document.body.style.overflow;
    const fermerAvecClavier = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPlusOuvert(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', fermerAvecClavier);
    window.requestAnimationFrame(() => premierLien.current?.focus());
    return () => {
      document.body.style.overflow = debordement;
      document.removeEventListener('keydown', fermerAvecClavier);
    };
  }, [plusOuvert]);

  const fermer = () => {
    setPlusOuvert(false);
    window.requestAnimationFrame(() => boutonPlus.current?.focus());
  };

  const retenirLeFocus = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return;
    const elements = panneauPlus.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!elements?.length) return;
    const premier = elements[0];
    const dernier = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === premier) {
      event.preventDefault();
      dernier.focus();
    } else if (!event.shiftKey && document.activeElement === dernier) {
      event.preventDefault();
      premier.focus();
    }
  };

  return (
    <>
      {plusOuvert && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu des outils"
            onClick={fermer}
            className="absolute inset-0 bg-encre-950/55 backdrop-blur-[2px]"
          />
          <section
            ref={panneauPlus}
            id="menu-outils-mobile"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titre-menu-outils"
            onKeyDown={retenirLeFocus}
            className="feuille absolute inset-x-2 bottom-[calc(5rem+env(safe-area-inset-bottom))] max-h-[min(72vh,42rem)] overflow-hidden rounded-[1.75rem] border border-parchemin-300 shadow-2xl"
          >
            <span className="ruban -top-2 left-8 -rotate-2 rounded-[2px]" />
            <div className="flex items-start justify-between gap-4 border-b border-dashed border-encre-950/15 px-5 pb-4 pt-6">
              <div>
                <p className="text-3xs font-black uppercase tracking-[0.18em] text-or-700">
                  La table de travail
                </p>
                <h2 id="titre-menu-outils" className="mt-1 font-serif text-2xl font-bold text-encre-950">
                  Tous les outils
                </h2>
                <p className="mt-1 text-xs text-encre-600">
                  Carnets, ressources et repères du parcours.
                </p>
              </div>
              <button
                type="button"
                onClick={fermer}
                aria-label="Fermer"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-parchemin-200 text-encre-700 active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(min(72vh,42rem)-8rem)] overflow-y-auto px-4 pb-5 pt-4">
              <Link
                ref={premierLien}
                href={PRINCIPALES[4].href}
                onClick={() => setPlusOuvert(false)}
                className="mb-4 flex min-h-14 items-center gap-3 rounded-2xl border border-or-300 bg-or-50 px-4 py-3 text-encre-950"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-or-100 text-or-800">
                  <Brain className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-serif text-base font-bold">Mémorisation</span>
                  <span className="block text-2xs text-encre-600">Revoir et réciter les versets</span>
                </span>
              </Link>

              <p className="mb-2 px-1 text-3xs font-black uppercase tracking-[0.16em] text-encre-500">
                Aller plus loin
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {SECONDAIRES.map((lien) => {
                  const Icone = lien.icon;
                  const actif = estActive(pathname, lien.href);
                  return (
                    <Link
                      key={lien.href}
                      href={lien.href}
                      onClick={() => setPlusOuvert(false)}
                      aria-current={actif ? 'page' : undefined}
                      className={`flex min-h-16 items-center gap-2.5 rounded-2xl border px-3 py-3 text-xs font-bold transition-colors ${
                        actif
                          ? 'border-or-400 bg-or-100 text-or-950'
                          : 'border-parchemin-300 bg-white/65 text-encre-800 active:bg-parchemin-100'
                      }`}
                    >
                      <Icone className="h-4 w-4 shrink-0 text-or-700" strokeWidth={1.8} />
                      <span className="leading-snug">{lien.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 border-t border-dashed border-encre-950/15 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setPlusOuvert(false);
                    onOuvrirNotifs();
                  }}
                  className="flex min-h-12 items-center gap-2 rounded-2xl bg-encre-950 px-3 py-3 text-left text-xs font-bold text-parchemin-100"
                >
                  <Bell className="h-4 w-4 text-or-300" />
                  Mes rappels
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlusOuvert(false);
                    ouvrirCentre();
                  }}
                  className="flex min-h-12 items-center gap-2 rounded-2xl border border-encre-950/12 bg-white/70 px-3 py-3 text-left text-xs font-bold text-encre-800"
                >
                  <Smartphone className="h-4 w-4 text-or-700" />
                  L&apos;application
                  {miseAJourPrete && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-or-500" aria-label="Mise à jour disponible" />
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-parchemin-300 bg-parchemin-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <ul className="flex">
        {ONGLETS_MOBILES.map((lien) => {
          const actif = estActive(pathname, lien.href);
          const Icone = lien.icon;
          return (
            <li key={lien.href} className="flex-1">
              <Link
                href={lien.href}
                aria-current={actif ? 'page' : undefined}
                className="flex flex-col items-center gap-1 px-1 pb-2 pt-2.5"
              >
                <span
                  className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${
                    actif ? 'bg-or-100 text-or-700' : 'text-encre-400'
                  }`}
                >
                  <Icone className="h-[18px] w-[18px]" strokeWidth={actif ? 2.25 : 1.75} />
                </span>
                <span
                  className={`text-[10px] font-bold leading-none ${
                    actif ? 'text-or-700' : 'text-encre-400'
                  }`}
                >
                  {lien.court}
                </span>
              </Link>
            </li>
          );
        })}
          <li className="flex-1">
            <button
              ref={boutonPlus}
              type="button"
              onClick={() => setPlusOuvert(true)}
              aria-expanded={plusOuvert}
              aria-controls="menu-outils-mobile"
              className="flex w-full flex-col items-center gap-1 px-1 pb-2 pt-2.5"
            >
              <span
                className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${
                  plusActif ? 'bg-or-100 text-or-700' : 'text-encre-400'
                }`}
              >
                <MoreHorizontal className="h-[19px] w-[19px]" strokeWidth={plusActif ? 2.25 : 1.75} />
              </span>
              <span className={`text-[10px] font-bold leading-none ${plusActif ? 'text-or-700' : 'text-encre-400'}`}>
                Plus
              </span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
