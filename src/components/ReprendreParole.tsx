'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Users } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { lireDernierPassage, EVENEMENT_PASSAGE, type DernierPassage } from '@/lib/marquePage';

export default function ReprendreParole({ ficheId, section, titre, titreSection, terminee = false, enCellule = false, parcoursTermine = false }: {
  ficheId: number; section: number; titre: string; titreSection: string;
  terminee?: boolean; enCellule?: boolean; parcoursTermine?: boolean;
}) {
  const { user } = useAuth();
  const [passage, setPassage] = useState<DernierPassage | null>(null);
  useEffect(() => {
    const actualiser = () => setPassage(user ? lireDernierPassage(user.uid) : null);
    void Promise.resolve().then(actualiser);
    window.addEventListener(EVENEMENT_PASSAGE, actualiser);
    return () => window.removeEventListener(EVENEMENT_PASSAGE, actualiser);
  }, [user]);
  // Un ancien marque-page ne doit ni changer la fiche annoncée, ni contourner ses prérequis.
  const urlPassage = passage?.uid === user?.uid && passage?.url.startsWith('/aujourdhui?')
    ? new URL(passage.url, 'https://lesfondements.local') : null;
  const reprise = urlPassage?.searchParams.get('fiche') === String(ficheId)
    && urlPassage.searchParams.get('section') === String(section) && !terminee ? passage : null;
  const href = parcoursTermine ? '/certificat' : terminee && enCellule ? '/groupes'
    : terminee ? `/fiches/${ficheId}` : reprise?.url || `/aujourdhui?fiche=${ficheId}&section=${section}`;
  return (
    <section className="nuit relative overflow-hidden rounded-3xl border border-or-300/20 p-6 text-parchemin-100 sm:p-9" aria-labelledby="prochain-temps">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-or-300">{parcoursTermine ? 'Le chemin parcouru' : terminee ? 'Préparation terminée' : 'Ton prochain temps'}</p>
      <p className="mt-5 text-sm text-parchemin-100/75">Fiche {ficheId} · {titre}</p>
      <h2 id="prochain-temps" className="mt-2 max-w-2xl font-serif text-3xl font-bold leading-tight sm:text-4xl">
        {parcoursTermine ? 'Prendre le temps de relire.' : terminee ? enCellule ? 'Prêt pour la rencontre.' : 'Garder ce qui a compté.' : titreSection}
      </h2>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-parchemin-100/80">
        {parcoursTermine ? 'Retrouve les passages et les mots qui ont accompagné tes vingt fiches.'
          : terminee ? enCellule ? 'Ta préparation est terminée. La suite s’ouvrira au rythme de ta cellule.' : 'Tu peux revenir sur cette fiche et sur tes découvertes.'
          : reprise ? `Ton marque-page : ${reprise.sousTitre || 'reprendre la lecture'}.` : 'Lis ou écoute, à ton rythme. Tu peux t’arrêter et revenir.'}
      </p>
      <Link href={href} className="bouton-or mt-6 inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 py-3 text-sm font-bold">
        {parcoursTermine ? 'Relire mon parcours' : terminee ? enCellule ? 'Préparer la rencontre' : 'Relire cette fiche' : reprise ? 'Reprendre mon temps' : 'Commencer mon temps'}
        {terminee && enCellule && !parcoursTermine ? <Users className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
      </Link>
      {!terminee && <Link href={`/fiches/${ficheId}`} className="mt-4 flex min-h-11 w-fit items-center gap-2 text-sm text-parchemin-100/80 underline underline-offset-4"><BookOpen className="h-4 w-4" />Consulter la fiche complète</Link>}
    </section>
  );
}
