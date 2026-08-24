'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Bell,
  BookMarked,
  Brain,
  Compass,
  Home,
  LogOut,
  MessageCircle,
  PenLine,
  Printer,
  Search,
  Tag,
  TrendingUp,
  Users,
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
  { href: '/fiches', label: 'Le parcours', court: 'Parcours', icon: Compass },
  { href: '/groupes', label: 'Ma cellule', court: 'Cellule', icon: Users },
  { href: '/memorisation', label: 'Mémorisation', court: 'Versets', icon: Brain },
  { href: '/journal', label: 'Journal', court: 'Journal', icon: PenLine },
];

const SECONDAIRES: Destination[] = [
  { href: '/recherche', label: 'Retrouver mes écrits', court: 'Recherche', icon: Search },
  { href: '/transformation', label: 'Mon chemin parcouru', court: 'Chemin', icon: TrendingUp },
  { href: '/carnet-export', label: 'Carnet de Disciple (PDF)', court: 'Carnet', icon: Printer },
  { href: '/temoignages', label: 'Témoignages', court: 'Témoignages', icon: MessageCircle },
  { href: '/index-thematique', label: 'Index thématique', court: 'Index', icon: Tag },
  { href: '/ressources', label: 'Autour du parcours', court: 'Ressources', icon: BookMarked },
  { href: '/certificat', label: 'Mon attestation', court: 'Attestation', icon: Award },
];

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

      <BarreOnglets pathname={pathname} />

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

      <p className="mb-1 mt-6 px-3 text-2xs font-bold uppercase tracking-[0.16em] text-parchemin-100/30">
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
          <h1 className="truncate font-serif text-lg font-bold text-encre-950">{titre}</h1>
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
            <span className="shrink-0 rounded-full bg-or-100 px-2.5 py-0.5 text-2xs font-bold text-or-700">
              Fiche {group.currentStep}/20
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

function BarreOnglets({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-parchemin-300 bg-parchemin-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <ul className="flex">
        {PRINCIPALES.map((lien) => {
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
      </ul>
    </nav>
  );
}
