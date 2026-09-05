'use client';
import { useEffect, useState } from 'react';
import { EVENEMENT_CARNET, getAnswers, getCachedAnswers } from './firestore';
import { ecritsDuCarnet, type EcritCarnet } from './habiter';

export function useCarnet(uid?: string) {
  const [etat, setEtat] = useState<{ uid: string; ecrits: EcritCarnet[]; charge: boolean } | null>(null);
  useEffect(() => {
    if (!uid) return;
    let actif = true;
    const local = (charge: boolean) => {
      if (actif) setEtat({ uid, charge, ecrits: Array.from({ length: 20 }, (_, i) => ecritsDuCarnet(i + 1, getCachedAnswers(uid, i + 1))).flat() });
    };
    // La lecture distante hydrate le cache ; le rendu relit le cache le plus récent.
    const charger = async () => {
      local(false);
      await Promise.all(Array.from({ length: 20 }, (_, i) => getAnswers(uid, i + 1)));
      local(true);
    };
    void charger();
    const actualiser = () => local(true);
    window.addEventListener(EVENEMENT_CARNET, actualiser);
    window.addEventListener('storage', actualiser);
    return () => { actif = false; window.removeEventListener(EVENEMENT_CARNET, actualiser); window.removeEventListener('storage', actualiser); };
  }, [uid]);
  return { ecrits: etat && etat.uid === uid ? etat.ecrits : [], chargement: !etat || etat.uid !== uid || !etat.charge };
}
