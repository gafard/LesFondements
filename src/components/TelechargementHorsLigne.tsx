'use client';

import { useState } from 'react';
import { Download, Check, WifiOff, X } from 'lucide-react';
import { chargerLivret } from '@/lib/livret';
import { TOUS_LES_LIVRES } from '@/lib/reference';

interface TelechargementHorsLigneProps {
  ouvert: boolean;
  onFermer: () => void;
}

const CLE_HORS_LIGNE = 'lf.horsLignePret';
const VERSION_HORS_LIGNE = 'v3';
const CACHE_HORS_LIGNE = `lesfondements-${VERSION_HORS_LIGNE}`;

export default function TelechargementHorsLigne({
  ouvert,
  onFermer,
}: TelechargementHorsLigneProps) {
  const [enCours, setEnCours] = useState(false);
  const [progression, setProgression] = useState(0);
  const [estPret, setEstPret] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(CLE_HORS_LIGNE) === VERSION_HORS_LIGNE;
    } catch {
      return false;
    }
  });
  const [etapeTexte, setEtapeTexte] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  if (!ouvert) return null;

  const telechargerTout = async () => {
    setEnCours(true);
    setErreur(null);
    setProgression(3);
    setEtapeTexte('Chargement du livret des 20 fiches...');

    try {
      // 1. Charger tout le texte des fiches
      await chargerLivret();
      setProgression(8);
      setEtapeTexte('Préparation du bureau et des fiches…');

      // 2. Mettre en cache les URLs principales via CacheStorage
      if ('caches' in window) {
        const cache = await caches.open(CACHE_HORS_LIGNE);
        const urlsACacher = [
          '/',
          '/dashboard',
          '/fiches',
          '/journal',
          '/memorisation',
          '/groupes',
          '/recherche',
          '/transformation',
          '/index-thematique',
          '/certificat',
          '/ressources',
          '/carnet-export',
          '/icon-192.png',
          '/icon-512.png',
          '/manifest.webmanifest',
        ];

        for (let i = 1; i <= 20; i++) {
          urlsACacher.push(`/fiches/${i}`);
        }
        urlsACacher.push(
          ...TOUS_LES_LIVRES.map((livre) => `/etudes/segond/${livre.code}.json`)
        );

        let reussies = 0;
        const echecs: string[] = [];
        for (const url of urlsACacher) {
          try {
            const reponse = await fetch(url, { credentials: 'same-origin' });
            if (!reponse.ok) throw new Error(`${reponse.status}`);
            await cache.put(url, reponse);
            reussies += 1;
          } catch {
            echecs.push(url);
          }
          setProgression(8 + Math.round((reussies / urlsACacher.length) * 88));
          setEtapeTexte(
            url.startsWith('/etudes/')
              ? `Classement de la Bible Segond · ${reussies}/${urlsACacher.length}`
              : `Mise en cache des fiches · ${reussies}/${urlsACacher.length}`
          );
        }

        if (echecs.length) {
          throw new Error(`${echecs.length} élément${echecs.length > 1 ? 's' : ''} n’ont pas pu être enregistré${echecs.length > 1 ? 's' : ''}.`);
        }
      } else {
        throw new Error('Le stockage hors-ligne n’est pas disponible dans ce navigateur.');
      }

      setProgression(100);
      setEtapeTexte('Le parcours et la Bible sont disponibles hors-ligne.');
      setEstPret(true);
      try {
        localStorage.setItem(CLE_HORS_LIGNE, VERSION_HORS_LIGNE);
      } catch {
        /* ignorer */
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Le téléchargement a été interrompu.';
      setErreur(message);
      setEstPret(false);
      setEtapeTexte('Téléchargement incomplet');
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
            <span>Les 20 fiches et la Bible Segond sont prêtes hors-ligne.</span>
          </div>
        )}

        {erreur && (
          <div role="alert" className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-900">
            {erreur} Vos données existantes restent intactes ; relancez le téléchargement avec une connexion stable.
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
