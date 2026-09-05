'use client';

import { useEffect, useRef, useState } from 'react';
import { getAnswers, getCachedAnswers, saveAnswer } from './firestore';
import { extrairePasDeVie, PREFIXE_RELECTURE, type PasDeVie, type RelecturePas } from './pasDeVie';

export function usePasDeVie(uid: string | undefined, derniereFiche: number) {
  const [donnees, setDonnees] = useState<{ uid: string; pas: PasDeVie[] } | null>(null);
  const [erreur, setErreur] = useState(false);
  const generation = useRef(0);
  const enregistrement = useRef(false);

  useEffect(() => {
    if (!uid) return;
    let actif = true;
    const numero = ++generation.current;
    const ids = Array.from({ length: Math.min(20, Math.max(1, derniereFiche)) }, (_, i) => i + 1);
    const lireCache = () => [...ids].reverse().flatMap((id) => extrairePasDeVie(id, getCachedAnswers(uid, id)));
    // L'affichage hors ligne ne dépend pas des délais du réseau.
    void Promise.resolve().then(() => {
      if (!actif) return;
      setDonnees({ uid, pas: lireCache() });
      setErreur(false);
    });
    void Promise.all(ids.map(async (id) => extrairePasDeVie(id, await getAnswers(uid, id))))
      .then((fiches) => {
        if (actif && generation.current === numero) {
          setDonnees({ uid, pas: fiches.reverse().flat() });
        }
      }).catch(() => { if (actif) setErreur(true); });
    const actualiser = (event: StorageEvent) => {
      if (event.key === null || event.key === `lesfondements_prog_${uid}`) {
        generation.current++;
        setDonnees({ uid, pas: lireCache() });
      }
    };
    window.addEventListener('storage', actualiser);
    return () => { actif = false; window.removeEventListener('storage', actualiser); };
  }, [uid, derniereFiche]);

  async function enregistrer(pas: PasDeVie, relecture: RelecturePas) {
    if (!uid || enregistrement.current) throw new Error('Enregistrement indisponible. Réessayez.');
    enregistrement.current = true;
    generation.current++;
    try {
      const cle = `${PREFIXE_RELECTURE}${pas.id}:${crypto.randomUUID()}`;
      const valeur = JSON.stringify(relecture);
      await saveAnswer(uid, pas.ficheId, cle, valeur);
      // Le service existant peut fonctionner hors ligne. Ne pas annoncer une
      // sauvegarde si le navigateur a refusé le stockage local.
      if (getCachedAnswers(uid, pas.ficheId)[cle] !== valeur) {
        throw new Error('Votre navigateur n’a pas conservé cette note. Copiez votre texte avant de réessayer.');
      }
      setDonnees((precedentes) => precedentes?.uid === uid ? {
        uid,
        pas: precedentes.pas.map((p) => p.id === pas.id && p.ficheId === pas.ficheId
          ? { ...p, relectures: [...p.relectures, relecture] } : p),
      } : precedentes);
    } finally {
      enregistrement.current = false;
    }
  }

  return {
    pas: donnees && donnees.uid === uid ? donnees.pas : [],
    chargement: !!uid && donnees?.uid !== uid,
    erreur,
    enregistrer,
  };
}
