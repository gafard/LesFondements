'use client';

import { TOUS_LES_LIVRES } from '@/lib/reference';
import { chargerManifesteVoix } from '@/lib/voix';

/**
 * Ce qu'on emporte hors connexion, par paquets choisis.
 *
 * Le téléchargement était tout ou rien : les vingt fiches et la Bible d'un
 * bloc, une barre de progression, et rien à décider. C'est beaucoup demander
 * à quelqu'un qui part en retraite trois jours avec un forfait limité — et
 * ça devient intenable quand les voix pèseront plus de cent mégaoctets.
 *
 * Quatre paquets, qu'on prend séparément. Les poids sont mesurés sur le
 * corpus réel, pas devinés : ce sont eux qui décident sur un partage de
 * connexion.
 */

export type ClePaquet = 'fiche' | 'parcours' | 'bible' | 'audios';

export interface Paquet {
  cle: ClePaquet;
  nom: string;
  description: string;
  /** Estimation lisible, pour décider avant de lancer. */
  poids: string;
  /** Les adresses à mettre en cache. */
  urls: (ficheCourante: number) => Promise<string[]>;
}

const CACHE = 'lesfondements-horsligne-v1';

/** Les pages du parcours, hors fiches. */
const PAGES = [
  '/dashboard',
  '/fiches',
  '/journal',
  '/memorisation',
  '/groupes',
  '/index-thematique',
  '/ressources',
  '/certificat',
  '/carnet-export',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
];

async function pistesDeLaFiche(fiche: number): Promise<string[]> {
  const manifeste = await chargerManifesteVoix();
  if (!manifeste) return [];
  return Object.values(manifeste.pistes)
    .filter((piste) => piste.id.startsWith(`f${fiche}.`))
    .map((piste) => piste.url);
}

export const PAQUETS: Paquet[] = [
  {
    cle: 'fiche',
    nom: 'La fiche en cours',
    description: 'La page, son texte et sa voix. De quoi préparer la semaine sans réseau.',
    poids: '≈ 3 Mo',
    urls: async (fiche) => [`/fiches/${fiche}`, ...(await pistesDeLaFiche(fiche))],
  },
  {
    cle: 'parcours',
    nom: 'Le parcours complet',
    description: 'Les vingt fiches et les pages de l’application, sans les voix.',
    poids: '≈ 2 Mo',
    urls: async () => [
      ...PAGES,
      ...Array.from({ length: 20 }, (_, i) => `/fiches/${i + 1}`),
    ],
  },
  {
    cle: 'bible',
    nom: 'La Bible Segond',
    description: 'Les soixante-six livres, consultables et cherchables hors connexion.',
    poids: '≈ 16 Mo',
    urls: async () => TOUS_LES_LIVRES.map((livre) => `/etudes/segond/${livre.code}.json`),
  },
  {
    cle: 'audios',
    nom: 'Toutes les voix',
    description: 'L’ensemble des enregistrements, y compris les versets à mémoriser.',
    poids: '≈ 34 Mo',
    urls: async () => {
      const manifeste = await chargerManifesteVoix();
      return manifeste ? Object.values(manifeste.pistes).map((piste) => piste.url) : [];
    },
  },
];

export interface Avancement {
  faits: number;
  total: number;
  echecs: number;
}

/**
 * Met un paquet en cache. Rappelle l'avancement au fil de l'eau : sur trente
 * mégaoctets, une barre qui ne bouge pas passe pour une panne.
 */
export async function telechargerPaquet(
  paquet: Paquet,
  ficheCourante: number,
  auFur: (avancement: Avancement) => void
): Promise<Avancement> {
  if (typeof caches === 'undefined') {
    throw new Error('Ce navigateur ne sait pas garder de pages hors connexion.');
  }
  const cache = await caches.open(CACHE);
  const urls = await paquet.urls(ficheCourante);

  let faits = 0;
  let echecs = 0;
  for (const url of urls) {
    try {
      const reponse = await fetch(url, { credentials: 'same-origin' });
      if (!reponse.ok) throw new Error(String(reponse.status));
      await cache.put(url, reponse);
      faits += 1;
    } catch {
      echecs += 1;
    }
    auFur({ faits, total: urls.length, echecs });
  }
  return { faits, total: urls.length, echecs };
}

/** Un paquet est considéré emporté si tout ce qu'il contient est en cache. */
export async function paquetPresent(paquet: Paquet, ficheCourante: number): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  try {
    const cache = await caches.open(CACHE);
    const urls = await paquet.urls(ficheCourante);
    if (!urls.length) return false;
    // On sonde quelques adresses plutôt que toutes : vérifier trois cents
    // entrées à chaque ouverture du centre coûterait plus que ça ne rapporte.
    const temoins = [urls[0], urls[Math.floor(urls.length / 2)], urls[urls.length - 1]];
    const trouves = await Promise.all(temoins.map((url) => cache.match(url)));
    return trouves.every(Boolean);
  } catch {
    return false;
  }
}

export async function oublierPaquets(): Promise<void> {
  if (typeof caches === 'undefined') return;
  await caches.delete(CACHE);
}
