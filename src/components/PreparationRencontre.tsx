'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useCarnet } from '@/lib/useCarnet';
import { getAnswers, saveAnswer } from '@/lib/firestore';
import { lireTrace } from '@/lib/habiter';

export default function PreparationRencontre({ ficheId }: { ficheId: number }) {
  const { user } = useAuth();
  const { ecrits } = useCarnet(user?.uid);
  const [texte, setTexte] = useState('');
  const [pret, setPret] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statut, setStatut] = useState('');
  const [erreur, setErreur] = useState('');
  useEffect(() => {
    if (!user) return;
    let actif = true;
    void getAnswers(user.uid, ficheId).then(a => { if (actif) { setTexte(lireTrace(a['trace:rencontre'])?.texte || ''); setPret(true); } });
    return () => { actif = false; };
  }, [user, ficheId]);
  const garder = async () => {
    if (!user || busy) return;
    setBusy(true); setErreur(''); setStatut('');
    try {
      await saveAnswer(user.uid, ficheId, 'trace:rencontre', JSON.stringify({ version: 1, nature: 'question', texte, date: Date.now(), reference: '' }));
      setStatut('Préparation conservée sur cet appareil. Elle reste privée.');
    } catch { setErreur('Ce brouillon n’a pas été conservé. Gardez-le ouvert et réessayez.'); }
    finally { setBusy(false); }
  };
  return <details className="my-6 rounded-3xl border border-parchemin-400 bg-white p-5 text-encre-950">
    <summary className="min-h-11 cursor-pointer font-serif text-xl font-bold">Ce que j’aimerais apporter à la rencontre</summary>
    <p className="mt-3 text-sm leading-relaxed">Une découverte, une question, une expérience… Vous pourrez choisir ce que vous direz, ou passer votre tour. Ce brouillon n’est visible que par vous.</p>
    <label className="mt-4 block text-sm">Reprendre une page de ma fiche<select disabled={!pret || busy} defaultValue="" className="mt-2 min-h-11 w-full rounded-xl border border-parchemin-400 bg-white px-3" onChange={event => {
      const ecrit = ecrits.find(e => `${e.ficheId}:${e.id}` === event.target.value);
      if (ecrit) { setTexte(ecrit.contenu); setStatut(''); }
    }}><option value="">Choisir librement un extrait…</option>{ecrits.filter(e => e.ficheId === ficheId && e.id !== 'trace:rencontre').map(e => <option key={e.id} value={`${e.ficheId}:${e.id}`}>{e.titre} · {e.contenu.slice(0, 65)}</option>)}</select></label>
    <label className="mt-4 block text-sm">Mon brouillon pour la rencontre<textarea disabled={!pret || busy} value={texte} onChange={e => { setTexte(e.target.value); setStatut(''); }} rows={4} maxLength={6000} className="mt-2 w-full rounded-xl border border-parchemin-400 bg-white p-3" /></label>
    <button disabled={!pret || busy} onClick={() => void garder()} className="bouton-or mt-4 min-h-11 rounded-full px-5 text-sm font-bold disabled:opacity-50">{busy ? 'Enregistrement…' : 'Garder mon brouillon privé'}</button>
    <p role="status" className="mt-3 text-sm">{statut}</p>{erreur && <p role="alert" className="mt-3 text-sm">{erreur}</p>}
  </details>;
}
