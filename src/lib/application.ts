'use client';

import { useSyncExternalStore } from 'react';

/**
 * L'état de l'application en tant qu'application : installée ou non,
 * installable, une version en attente, prête hors connexion.
 *
 * Ces informations vivaient éparpillées dans les composants qui s'en
 * servaient, et deux d'entre elles se perdaient : l'invite d'installation,
 * une fois écartée, l'était pour toujours ; et une nouvelle version
 * s'appliquait en silence au milieu d'une session, parce que le service
 * worker appelait `skipWaiting()` sans rien demander. Rassemblées ici,
 * elles deviennent consultables à tout moment depuis le centre.
 */

export type Plateforme = 'ios' | 'android' | 'autre';

export interface EtatApplication {
  /** Lancée depuis l'icône, hors du navigateur. */
  installee: boolean;
  /** Le navigateur a proposé l'installation : on peut la déclencher. */
  installable: boolean;
  plateforme: Plateforme;
  /** Une version est téléchargée et attend qu'on lui laisse la place. */
  miseAJourPrete: boolean;
}

interface EvenementInstallation extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let invite: EvenementInstallation | null = null;
let enAttente: ServiceWorker | null = null;

const abonnes = new Set<() => void>();
function notifier() {
  abonnes.forEach((rappel) => rappel());
}

function detecterPlateforme(): Plateforme {
  if (typeof navigator === 'undefined') return 'autre';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'autre';
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
 * `useSyncExternalStore` compare les instantanés par identité : on garde le
 * même objet tant que rien ne change, sinon le rendu boucle.
 */
let instantane: EtatApplication = {
  installee: false,
  installable: false,
  plateforme: 'autre',
  miseAJourPrete: false,
};
const AU_SERVEUR: EtatApplication = instantane;

function recalculer() {
  const suivant: EtatApplication = {
    installee: estInstallee(),
    installable: !!invite,
    plateforme: detecterPlateforme(),
    miseAJourPrete: !!enAttente,
  };
  const identique =
    suivant.installee === instantane.installee &&
    suivant.installable === instantane.installable &&
    suivant.plateforme === instantane.plateforme &&
    suivant.miseAJourPrete === instantane.miseAJourPrete;
  if (identique) return;
  instantane = suivant;
  notifier();
}

let demarre = false;

/** Branche les écoutes du navigateur. Idempotent. */
export function demarrerApplication(): void {
  if (demarre || typeof window === 'undefined') return;
  demarre = true;

  // L'invite a peut-être déjà été émise et retenue par le script du
  // document : ce module démarre au premier abonnement, souvent trop tard.
  const dejaCaptee = (window as unknown as { __lfInvite?: EvenementInstallation }).__lfInvite;
  if (dejaCaptee) invite = dejaCaptee;

  window.addEventListener('beforeinstallprompt', (evenement) => {
    // Sans `preventDefault`, Chrome affiche sa propre barre : on préfère
    // proposer l'installation au moment choisi, depuis le centre.
    evenement.preventDefault();
    invite = evenement as EvenementInstallation;
    recalculer();
  });

  window.addEventListener('appinstalled', () => {
    invite = null;
    recalculer();
  });

  window.matchMedia('(display-mode: standalone)').addEventListener('change', recalculer);

  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((enregistrement) => {
        const examiner = () => {
          // `waiting` signifie : une version est prête mais n'a pas pris la
          // main, parce que des onglets utilisent encore l'ancienne.
          if (enregistrement.waiting) {
            enAttente = enregistrement.waiting;
            recalculer();
          }
        };
        examiner();
        enregistrement.addEventListener('updatefound', () => {
          const nouveau = enregistrement.installing;
          nouveau?.addEventListener('statechange', () => {
            if (nouveau.state === 'installed' && navigator.serviceWorker.controller) examiner();
          });
        });
        void enregistrement.update();
      })
      .catch(() => {
        /* pas de service worker : l'application reste utilisable en ligne */
      });
  }

  recalculer();
}

function abonner(rappel: () => void) {
  abonnes.add(rappel);
  demarrerApplication();
  return () => {
    abonnes.delete(rappel);
  };
}

const lire = () => instantane;
const lireAuServeur = () => AU_SERVEUR;

export function useApplication(): EtatApplication {
  return useSyncExternalStore(abonner, lire, lireAuServeur);
}

/**
 * Déclenche l'invite native. Rend `true` si la personne a accepté.
 * Sur iOS il n'y a pas d'invite : l'installation passe par le menu Partager,
 * et le centre l'explique plutôt que de proposer un bouton qui ne ferait rien.
 */
export async function installer(): Promise<boolean> {
  if (!invite) return false;
  await invite.prompt();
  const { outcome } = await invite.userChoice;
  // L'invite ne se rejoue pas : le navigateur la réémettra s'il le juge bon.
  invite = null;
  recalculer();
  return outcome === 'accepted';
}

/**
 * Laisse la version en attente prendre la main, puis recharge.
 *
 * C'est un geste explicite : remplacer l'application sous les doigts de
 * quelqu'un qui écrit dans son journal serait une petite trahison.
 */
export function appliquerMiseAJour(): void {
  if (!enAttente) return;
  const recharger = () => window.location.reload();
  navigator.serviceWorker.addEventListener('controllerchange', recharger, { once: true });
  enAttente.postMessage({ type: 'PRENDRE_LA_MAIN' });
}
