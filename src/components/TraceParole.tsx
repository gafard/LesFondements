'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Check, PenLine } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getAnswers, getCachedAnswers, saveAnswer } from '@/lib/firestore';
import { ecritsDuCarnet, lireTrace, NATURES_TRACE, PROFILS_FICHES, type NatureTrace } from '@/lib/habiter';

export function TraceParole(props: React.ComponentProps<typeof EditeurTrace>) {
  const { user } = useAuth();
  return <EditeurTrace key={`${user?.uid || 'visiteur'}:${props.ficheId}:${props.cle}`} {...props} />;
}

function EditeurTrace({ ficheId, cle, reference = '', titre, sombre = false, natureInitiale, invitation }: {
  ficheId: number; cle: string; reference?: string; titre?: string; sombre?: boolean;
  natureInitiale?: NatureTrace; invitation?: string;
}) {
  const { user } = useAuth();
  const id = useId();
  const profil = PROFILS_FICHES[ficheId] || PROFILS_FICHES[1];
  const [texte, setTexte] = useState('');
  const [nature, setNature] = useState<NatureTrace>(natureInitiale || profil.nature);
  const [charge, setCharge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const cleBrouillon = `lf.trace-brouillon:${user?.uid}:${ficheId}:${cle}`;
  useEffect(() => {
    if (!user) return;
    let actif = true;
    void getAnswers(user.uid, ficheId).then(answers => {
      if (!actif) return;
      const enregistre = lireTrace(answers[cle]);
      let brouillon = null;
      try { brouillon = lireTrace(localStorage.getItem(cleBrouillon) || ''); } catch { /* Le champ reste utilisable. */ }
      const trace = brouillon && (!enregistre || brouillon.date > enregistre.date) ? brouillon : enregistre;
      if (trace === brouillon && brouillon) setMessage('Brouillon retrouvé sur cet appareil. Enregistrez-le pour le retrouver dans votre carnet.');
      setTexte(trace?.texte || '');
      setNature(trace?.nature || natureInitiale || profil.nature);
      setCharge(true);
    });
    return () => { actif = false; };
  }, [user, ficheId, cle, natureInitiale, profil.nature, cleBrouillon]);
  const enregistrer = async () => {
    if (!user || busy) return;
    setBusy(true); setMessage(''); setErreur('');
    try {
      const valeur = JSON.stringify({ version: 1, nature, texte: texte.trim(), reference, date: Date.now() });
      await saveAnswer(user.uid, ficheId, cle, valeur);
      if (getCachedAnswers(user.uid, ficheId)[cle] !== valeur) throw new Error('stockage');
      localStorage.removeItem(cleBrouillon);
      setMessage('Conservé sur cet appareil. Le statut de synchronisation indique l’envoi au compte.');
    } catch { setErreur('L’écriture n’a pas pu être conservée. Votre texte reste ici : réessayez ou copiez-le avant de quitter.'); }
    finally { setBusy(false); }
  };
  const garderBrouillon = (texteSuivant: string, natureSuivante: NatureTrace) => {
    setTexte(texteSuivant); setNature(natureSuivante); setMessage('');
    try {
      localStorage.setItem(cleBrouillon, JSON.stringify({ version: 1, nature: natureSuivante, texte: texteSuivant, reference, date: Date.now() }));
      setMessage('Brouillon conservé sur cet appareil. Pensez à le garder dans votre carnet.');
      setErreur('');
    } catch { setErreur('Le brouillon n’a pas pu être conservé. Copiez votre texte avant de quitter ce temps.'); }
  };
  return (
    <section className={`trace-parole rounded-3xl border p-5 sm:p-7 ${sombre ? 'border-white/15 bg-white/5 text-parchemin-100' : 'border-parchemin-300 bg-parchemin-50 text-encre-950'}`}>
      <p className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${sombre ? 'text-or-300' : 'text-or-800'}`}><PenLine className="h-4 w-4" /> Mon carnet · privé</p>
      <h2 className="mt-3 font-serif text-2xl font-bold">{titre || 'Ce que je garde de ce temps'}</h2>
      <p className="mt-3 text-sm leading-relaxed">{invitation || profil.question}</p>
      <p className="mt-2 text-sm opacity-75">Quelques mots, si tu le souhaites. Tu peux aussi poursuivre sans écrire.</p>
      {!user ? <Link className="mt-4 inline-flex min-h-11 items-center underline" href="/login">Ouvrir mon carnet personnel</Link> : (
        <form onSubmit={e => { e.preventDefault(); void enregistrer(); }} className="mt-5 space-y-4">
          <label htmlFor={`${id}-nature`} className="block text-sm">Je souhaite garder</label>
          <select id={`${id}-nature`} value={nature} disabled={!charge || busy} onChange={e => garderBrouillon(texte, e.target.value as NatureTrace)} className="min-h-11 w-full rounded-xl border border-parchemin-400 bg-white px-3 text-encre-950">
            {Object.entries(NATURES_TRACE).map(([valeur, label]) => <option key={valeur} value={valeur}>{label}</option>)}
          </select>
          <label htmlFor={`${id}-texte`} className="sr-only">Ma trace personnelle</label>
          <textarea id={`${id}-texte`} value={texte} disabled={!charge || busy} onChange={e => garderBrouillon(e.target.value, nature)} rows={4} maxLength={6000} placeholder={charge ? 'Avec mes propres mots…' : 'Ouverture de cette page…'} className="w-full resize-y rounded-xl border border-parchemin-400 bg-white p-4 text-base leading-relaxed text-encre-950 placeholder:text-encre-500" />
          <button disabled={!charge || busy} className="bouton-or inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-bold disabled:opacity-50"><Check className="h-4 w-4" />{busy ? 'Enregistrement…' : 'Garder dans mon carnet'}</button>
          <p role="status" className="text-xs leading-relaxed">{message}</p>
          {erreur && <p role="alert" className="text-sm font-semibold">{erreur}</p>}
        </form>
      )}
    </section>
  );
}

export function FilDeLaParole({ ficheId }: { ficheId: number }) {
  const { user } = useAuth();
  const precedente = PROFILS_FICHES[ficheId]?.reprendre;
  const [souvenir, setSouvenir] = useState<{ uid: string; precedente: number; texte: string; date?: number } | null>(null);
  useEffect(() => {
    if (!user || !precedente) return;
    let actif = true;
    void getAnswers(user.uid, precedente).then(answers => {
      const traces = ecritsDuCarnet(precedente, answers).filter(t => t.id.startsWith('trace:'));
      const choisie = traces.find(t => t.favori) || traces.sort((a, b) => (b.date || 0) - (a.date || 0))[0];
      if (actif && choisie) setSouvenir({ uid: user.uid, precedente, texte: choisie.contenu, date: choisie.date });
    });
    return () => { actif = false; };
  }, [user, precedente]);
  if (!souvenir || souvenir.uid !== user?.uid || souvenir.precedente !== precedente) return null;
  return <aside className="rounded-2xl border border-or-300 bg-parchemin-50 p-5 text-encre-950">
    <p className="flex items-center gap-2 text-xs font-bold text-or-800"><Bookmark className="h-4 w-4" /> Le fil de mes découvertes · fiche {precedente}</p>
    <blockquote className="mt-3 whitespace-pre-wrap font-serif text-lg">{souvenir.texte}</blockquote>
    {souvenir.date && <p className="mt-2 text-xs text-encre-600">Tes mots du {new Date(souvenir.date).toLocaleDateString('fr-FR')}</p>}
    <p className="mt-3 text-sm">En revenant à ces mots, que comprends-tu aujourd’hui ? Tu peux garder une nouvelle trace à la fin de ce temps.</p>
    <Link href={`/fiches/${precedente}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold underline">Relire le passage d’origine</Link>
  </aside>;
}
