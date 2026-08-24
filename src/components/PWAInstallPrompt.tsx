'use client';

import { useEffect, useState } from 'react';
import { X, Share, PlusSquare, Download, Compass } from 'lucide-react';

type Plateforme = 'ios' | 'android' | 'other';

/** Sous-ensemble de l'événement natif `beforeinstallprompt` (non standard). */
interface EvenementInstallation {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  preventDefault: () => void;
}

function detecterPlateforme(): Plateforme {
  if (typeof window === 'undefined') return 'other';
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'other';
}

function estEnModeStandalone(): boolean {
  if (typeof window === 'undefined') return true;
  const navigateur = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    !!navigateur.standalone ||
    document.referrer.includes('android-app://')
  );
}

function lireDesactive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem('lesfondements-pwa-dismissed') !== null;
  } catch {
    return false;
  }
}

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform] = useState<Plateforme>(detecterPlateforme);
  const [deferredPrompt, setDeferredPrompt] = useState<EvenementInstallation | null>(null);

  useEffect(() => {
    // 0. Enregistrer le Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => registration.update())
        .catch(() => {});
    }

    // 1. Ne rien afficher si l'application est déjà installée.
    if (estEnModeStandalone()) return;

    const isIos = platform === 'ios';

    // 2. Capturer l'invite native d'installation sur Android / Chrome.
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & EvenementInstallation);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Sur iOS, proposer un rappel doux après quelques secondes.
    if (isIos) {
      const timer = setTimeout(() => {
        if (!lireDesactive()) setShow(true);
      }, 6000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [platform]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('lesfondements-pwa-dismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm z-[1000] animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl border border-amber-300/30 bg-[#07162b]/95 p-4 sm:p-5 text-white shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
        <button 
          onClick={dismiss}
          className="absolute right-3.5 top-3.5 rounded-full bg-white/10 p-1.5 hover:bg-white/20 transition-colors text-slate-300 hover:text-white"
        >
          <X size={14} />
        </button>

        <div className="flex gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-[#07162b] shadow-md">
            <Download size={20} />
          </div>
          
          <div className="flex-1 pr-4 text-left">
            <div className="flex items-center gap-1 text-2xs font-bold uppercase tracking-wider text-amber-300 mb-0.5">
              <Compass className="w-3 h-3" /> App Les Fondements
            </div>
            <h4 className="text-sm font-bold font-serif text-[#fff8e8]">Installer sur votre écran d&apos;accueil</h4>
            <p className="mt-1 text-2xs text-slate-300 leading-relaxed">
              {platform === 'ios' 
                ? "Accédez à vos fiches, audio et journal en un clic sans passer par l'App Store."
                : "Installez l'application pour une utilisation fluide et hors-ligne."
              }
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          {platform === 'ios' ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-2xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 text-amber-200">
              <span>Appuyez sur</span>
              <Share size={14} className="text-amber-300" />
              <span>puis</span>
              <PlusSquare size={14} className="text-amber-300" />
              <span>&quot;Sur l&apos;écran d&apos;accueil&quot;</span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 py-3 text-xs font-bold text-[#07162b] shadow-md transition-all active:scale-98"
            >
              <Download size={15} />
              Installer l&apos;application
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
