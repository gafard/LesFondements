'use client';

import { useSyncExternalStore } from 'react';
import { Check, CloudOff, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import {
  etatSynchronisation,
  observerSynchronisation,
  type EtatSynchronisation,
} from '@/lib/syncState';

const ICONES: Record<EtatSynchronisation, typeof Check> = {
  synchronise: Check,
  en_cours: Loader2,
  en_attente: RefreshCw,
  hors_ligne: CloudOff,
  erreur: TriangleAlert,
};

export default function SyncStatusBadge() {
  const snapshot = useSyncExternalStore(
    observerSynchronisation,
    etatSynchronisation,
    etatSynchronisation
  );
  const Icon = ICONES[snapshot.etat];

  return (
    <div
      className={`sync-ticket sync-${snapshot.etat}`}
      title={`${snapshot.message} · ${new Date(snapshot.updatedAt).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`}
      role="status"
      aria-live="polite"
    >
      <Icon className={`h-3.5 w-3.5 ${snapshot.etat === 'en_cours' ? 'animate-spin' : ''}`} />
      <span>{snapshot.message}</span>
    </div>
  );
}
