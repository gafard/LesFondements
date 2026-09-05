'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useCarnet } from '@/lib/useCarnet';
import { TraceParole } from './TraceParole';

export default function BilanParcours() {
  const { user } = useAuth();
  const { ecrits, chargement } = useCarnet(user?.uid);
  const depart = ecrits.find(e => e.id === 'trace:depart');
  const choisies = ecrits.filter(e => e.favori);
  return <section className="mx-auto mb-8 max-w-4xl space-y-5 px-4 print:hidden">
    <header className="nuit rounded-3xl p-7 text-parchemin-100"><p className="text-xs font-bold uppercase tracking-widest text-or-300">Demeurer et transmettre</p><h1 className="mt-3 font-serif text-3xl font-bold">Relire mon chemin, ouvrir la suite</h1><p className="mt-4 text-sm leading-relaxed text-parchemin-100/80">Ce que vous comprenez, ce que vous vivez et les questions encore ouvertes vous appartiennent. Prenez le temps de revenir à vos propres mots.</p></header>
    {chargement && <p role="status" className="text-sm">Ouverture de votre carnet…</p>}
    {depart && <article className="feuille rounded-2xl border border-parchemin-300 p-5"><h2 className="font-serif text-xl font-bold">Au début, vous écriviez…</h2><p className="mt-3 whitespace-pre-wrap font-serif leading-relaxed">{depart.contenu}</p></article>}
    {choisies.map(e => <article key={`${e.ficheId}:${e.id}`} className="feuille rounded-2xl border border-parchemin-300 p-5"><p className="text-xs font-bold text-or-800">Votre page étoilée · fiche {e.ficheId} · {e.titre}</p><p className="mt-3 whitespace-pre-wrap font-serif leading-relaxed">{e.contenu}</p><Link href={e.href} className="mt-3 inline-flex min-h-11 items-center text-sm underline">Revenir au passage</Link></article>)}
    {!choisies.length && <p className="text-sm text-encre-700">Vous pouvez étoiler les pages que vous souhaitez relire dans <Link href="/journal" className="font-semibold underline">votre carnet</Link>.</p>}
    <TraceParole ficheId={20} cle="trace:bilan" titre="Ce que j’emporte pour la suite" invitation="Que comprenez-vous autrement ? Quelles questions restent ouvertes ? Comment souhaitez-vous poursuivre avec Dieu et vous rendre disponible aux autres ?" natureInitiale="comprehension" />
    <div className="flex flex-wrap gap-3 text-sm font-semibold"><Link className="rounded-full border border-parchemin-400 px-5 py-3" href="/carnet-export">Emporter les pages choisies</Link><Link className="rounded-full border border-parchemin-400 px-5 py-3" href="/groupes">Continuer avec d’autres</Link><Link className="rounded-full border border-parchemin-400 px-5 py-3" href="/parametres">Choisir mes rappels</Link></div>
  </section>;
}
