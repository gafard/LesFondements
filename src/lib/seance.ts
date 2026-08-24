'use client';

import type { Manifeste, Piste } from './voix';

/**
 * Ce qui doit tenir pendant qu'on écoute : l'écran, et les commandes.
 *
 * Une immersion dure de cinq à dix minutes, dont une bonne part sans toucher
 * l'écran — on écoute, on médite. Le téléphone, lui, s'éteint au bout de
 * trente secondes, et la lecture s'interrompt dès que l'écran se verrouille
 * si rien ne l'a déclarée comme une vraie session audio.
 */

let veille: WakeLockSentinel | null = null;

/**
 * Empêche l'écran de s'éteindre. Sans effet là où l'API n'existe pas
 * (Safari l'a tardivement, Firefox pas du tout) : ce n'est pas une raison
 * pour s'en priver ailleurs.
 */
export async function garderLEcranEveille(): Promise<void> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
  if (veille && !veille.released) return;
  try {
    veille = await navigator.wakeLock.request('screen');
    // Le verrou saute quand l'onglet passe en arrière-plan : il faut le
    // reprendre au retour, sinon l'écran s'éteint au milieu d'un silence.
    veille.addEventListener('release', () => {
      veille = null;
    });
  } catch {
    /* refusé (batterie faible, onglet caché) : on continue sans */
  }
}

export function laisserLEcranSEteindre(): void {
  void veille?.release().catch(() => {});
  veille = null;
}

/**
 * Reprend le verrou au retour de l'onglet. À brancher une fois, tant que
 * l'immersion est ouverte.
 */
export function suivreLaVisibilite(): () => void {
  const auRetour = () => {
    if (document.visibilityState === 'visible') void garderLEcranEveille();
  };
  document.addEventListener('visibilitychange', auRetour);
  return () => document.removeEventListener('visibilitychange', auRetour);
}

/**
 * Décrit ce qui joue au système, pour que l'écran verrouillé et les
 * écouteurs affichent le titre et répondent aux commandes.
 */
export function annoncerAuSysteme(
  titre: string,
  sousTitre: string,
  actions: { precedent: () => void; suivant: () => void; jouer: () => void; pause: () => void }
): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: titre,
    artist: sousTitre,
    album: 'Les Fondements',
    artwork: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  });

  const poser = (action: MediaSessionAction, quoi: () => void) => {
    try {
      navigator.mediaSession.setActionHandler(action, quoi);
    } catch {
      /* action non gérée par ce navigateur */
    }
  };
  poser('play', actions.jouer);
  poser('pause', actions.pause);
  poser('previoustrack', actions.precedent);
  poser('nexttrack', actions.suivant);
}

export function fairelSilenceAuSysteme(): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.playbackState = 'none';
}

export function etatDeLecture(enCours: boolean): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  navigator.mediaSession.playbackState = enCours ? 'playing' : 'paused';
}

/** Une vibration très brève, et seulement si l'appareil sait le faire. */
export function frisson(motif: number | number[] = 12): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(motif);
  } catch {
    /* refusé */
  }
}

/** Le titre lisible d'une piste, pour l'écran verrouillé. */
export function titreDePiste(manifeste: Manifeste | null, id?: string): Piste | null {
  if (!manifeste || !id) return null;
  return manifeste.pistes[id] ?? null;
}
