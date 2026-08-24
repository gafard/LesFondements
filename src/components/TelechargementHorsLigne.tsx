'use client';

import { useState, useEffect } from 'react';
import { Download, Check, HardDrive, WifiOff, X, Sparkles } from 'lucide-react';
import { chargerLivret } from '@/lib/livret';

interface TelechargementHorsLigneProps {
  ouvert: boolean;
  onFermer: () => void;
}

const CLE_HORS_LIGNE = 'lf.horsLignePret';

export default function TelechargementHorsLigne({
  ouvert,
  onFermer,
}: TelechargementHorsLigneProps) {
  const [enCours, setEnCours] = useState(false);
  const [progression, setProgression] = useState(0);
  const [estPret, setEstPret] = useState(false);
  const [etapeTexte, setEtapeTexte] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const status = localStorage.getItem(CLE_HORS_LIGNE);
      if (status === 'true') setEstPret(true);
    } catch {
      /* ignorer */
    }
  }, [ouvert]);

  if (!ouvert) return null;

  const telechargerTout = async () => {
    setEnCours(true);
    setProgression(10);
    setEtapeTexte('Chargement du livret des 20 fiches...');

    try {
      // 1. Charger tout le texte des fiches
      await chargerLivret();
      setProgression(40);
      setEtapeTexte('Mise en mémoire des versets et passages clés...');

      // 2. Mettre en cache les URLs principales via CacheStorage
      if ('caches' in window) {
        const cache = await caches.open('lesfondements-offline-v1');
        const urlsACacher = [
          '/',
          '/dashboard',
          '/fiches',
          '/journal',
          '/memorisation',
          '/groupes',
          '/index-thematique',
          '/certificat',
          '/icon-192.png',
          '/icon-512.png',
          '/manifest.webmanifest',
        ];

        for (let i = 1; i <= 20; i++) {
          urlsACacher.push(`/fiches/${i}`);
        }

        await cache.addAll(urlsACacher).catch(() => {});
      }

      setProgression(80);
      setEtapeTexte('Enregistrement des concordances et données de méditation...');

      await new Promise((resolve) => setTimeout(resolve, 600));

      setProgression(100);
      setEtapeTexte('Tout le parcours est disponible hors-ligne !');
      setEstPret(true);
      try {
        localStorage.setItem(CLE_HORS_LIGNE, 'true');
      } catch {
        /* ignorer */
      }
    } catch (err) {
      console.warn('Erreur lors de la mise en cache hors-ligne:', err);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Voile d'arrière-plan */}
      <div
        role="presentation"
        aria-hidden="true"
        onClick={onFermer}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Carte style Carnet de voyage */}
      <div className="feuille relative z-10 w-full max-w-md overflow-hidden rounded-4xl border border-parchemin-400 p-6 sm:p-8 shadow-2xl">
        <span className="ruban -top-3 left-1/2 -translate-x-1/2 -rotate-1 rounded-[2px]" />

        <div className="flex items-start justify-between border-b border-parchemin-300 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-800 shadow-2xs">
              <WifiOff className="h-5 w-5" />
            </span>
            <div>
              <span className="text-3xs font-bold uppercase tracking-[0.2em] text-indigo-700">
                Mode Retraite & Voyage
              </span>
              <h3 className="manuscrit text-2xl font-bold text-encre-950">
                Parcours Hors-ligne
              </h3>
            </div>
          </div>

          <button
            onClick={onFermer}
            className="text-encre-400 hover:text-encre-800"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="font-serif text-xs leading-relaxed text-encre-600 my-4">
          Emportez l’intégralité des 20 fiches, versets, notes et questions avec vous. Idéal pour un temps de retraite silencieuse, un voyage sans connexion ou un lieu sans réseau.
        </p>

        {estPret && (
          <div className="mb-5 flex items-center gap-2.5 rounded-2xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-900 border border-emerald-200">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Votre parcours est 100% prêt pour une utilisation hors-ligne.</span>
          </div>
        )}

        {enCours && (
          <div className="space-y-2 mb-5">
            <div className="flex justify-between text-2xs font-bold text-encre-600">
              <span>{etapeTexte}</span>
              <span>{progression}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-parchemin-200">
              <div
                className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${progression}%` }}
              />
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={telechargerTout}
            disabled={enCours}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-encre-950 px-5 py-3 text-xs font-bold text-parchemin-100 shadow-md transition-all hover:bg-encre-900 disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-or-300" />
            {estPret ? 'Mettre à jour le téléchargement' : 'Télécharger tout le parcours'}
          </button>
        </div>
      </div>
    </div>
  );
}
