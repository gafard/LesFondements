'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Footprints, HeartHandshake, LockKeyhole, PenLine, Sprout } from 'lucide-react';
import ParcoursGate from '@/components/ParcoursGate';
import { CartePasDeVie } from '@/components/PasDeVie';
import { useAuth } from '@/lib/AuthContext';
import { useParcours } from '@/lib/ParcoursContext';
import { usePasDeVie } from '@/lib/usePasDeVie';
import { ISSUES_PAS, pasARelire } from '@/lib/pasDeVie';
import { FICHES_META } from '@/data/fichesMeta';

const MOUVEMENTS = [
  { icon: BookOpen, titre: 'Recevoir', texte: 'Une Parole qui m’éclaire.' },
  { icon: Footprints, titre: 'Incarner', texte: 'Un geste dans ma journée.' },
  { icon: PenLine, titre: 'Relire', texte: 'Ce que j’ai réellement vécu.' },
  { icon: HeartHandshake, titre: 'Grandir ensemble', texte: 'Une présence qui m’accompagne.' },
];

function TransformationContent() {
  const { user } = useAuth();
  const { preparationStep, group } = useParcours();
  const ficheId = Math.max(1, preparationStep, group?.currentStep ?? 1);
  const { pas, chargement, erreur, enregistrer } = usePasDeVie(user?.uid, ficheId);
  const [filtre, setFiltre] = useState<'tous' | 'a-relire' | 'relus'>('tous');
  const visibles = pas.filter((p) => filtre === 'tous' || (filtre === 'a-relire' ? pasARelire(p) : p.relectures.length > 0));
  const premiereRelecture = pas.flatMap((p) => p.relectures).sort((a, b) => a.date - b.date)[0];
  const derniereRelecture = pas.flatMap((p) => p.relectures).sort((a, b) => b.date - a.date)[0];

  return (
    <div className="table-travail min-h-screen px-4 pb-24 pt-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="chemin-entete">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold tracking-wide text-or-700"><Sprout className="h-4 w-4" aria-hidden="true" /> LE CARNET DE TRANSFORMATION</p>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-encre-950 sm:text-6xl">La Parole<br /><span className="italic text-or-700">prend corps.</span></h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-encre-700">Ce que vous recevez de Dieu trouve peu à peu sa place dans vos choix, vos relations et votre quotidien.</p>
          </div>
          <aside className="chemin-note">
            <span className="ruban -top-3 left-12 -rotate-3" aria-hidden="true" />
            <p className="font-serif text-2xl italic leading-relaxed text-encre-950">« Qu’est-ce qui devient différent dans ma manière de vivre ? »</p>
            <p className="mt-4 text-sm leading-relaxed text-encre-600">Gardez une trace avec vos mots. Les changements discrets ont aussi leur place ici.</p>
          </aside>
        </header>

        <ol className="chemin-mouvements" aria-label="Le mouvement du parcours">
          {MOUVEMENTS.map(({ icon: Icon, titre, texte }, index) => <li key={titre}>
            <div className="flex items-center gap-3"><span className="chemin-numero">0{index + 1}</span><Icon className="h-5 w-5 text-or-300" aria-hidden="true" /></div>
            <h2 className="mt-4 font-serif text-xl font-bold">{titre}</h2>
            <p className="mt-1 text-sm leading-relaxed text-parchemin-200">{texte}</p>
          </li>)}
        </ol>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section aria-labelledby="mes-pas">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-sm font-semibold text-or-700">DE L’INTENTION À LA VIE</p><h2 id="mes-pas" className="mt-2 font-serif text-3xl font-bold text-encre-950">Mes pas, un à un</h2></div>
              <p className="flex items-center gap-2 text-sm text-encre-600"><LockKeyhole className="h-4 w-4" aria-hidden="true" />Personnel</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Afficher les pas de vie">
              {([['tous', 'Tout le chemin'], ['a-relire', 'À faire grandir'], ['relus', 'Déjà relus']] as const).map(([valeur, label]) =>
                <button key={valeur} type="button" aria-pressed={filtre === valeur} onClick={() => setFiltre(valeur)} className={`chemin-filtre ${filtre === valeur ? 'chemin-filtre-actif' : ''}`}>{label}</button>
              )}
            </div>
            {erreur && <p role="status" className="mt-4 text-base text-bordeaux-800">Les notes disponibles sur cet appareil sont affichées. La connexion n’a pas permis de retrouver les autres.</p>}
            {chargement ? <p role="status" className="py-12 text-base text-encre-600">Ouverture de votre carnet…</p> : visibles.length ? (
              <div className="mt-6 space-y-6">{visibles.map((p) => <CartePasDeVie key={`${p.ficheId}-${p.id}`} pas={p} onEnregistrer={enregistrer} />)}</div>
            ) : (
              <div className="chemin-vide mt-6">
                <Sprout className="h-9 w-9 text-or-700" aria-hidden="true" />
                <h3 className="mt-5 font-serif text-2xl font-bold text-encre-950">{pas.length ? 'Le chemin reste ouvert.' : 'Tout commence par un petit pas.'}</h3>
                <p className="mt-3 text-base leading-relaxed text-encre-600">{pas.length
                  ? 'Aucun pas dans cette vue pour le moment. Retrouvez vos intentions ou laissez-vous le temps de vivre la suivante.'
                  : 'Après votre lecture, choisissez une situation et un geste simple. Votre intention et vos relectures trouveront leur place sur ces pages.'}</p>
                {pas.length ? <button className="pas-bouton mt-6" type="button" onClick={() => setFiltre('tous')}>Retrouver mes pas</button>
                  : <Link href={`/aujourdhui?fiche=${ficheId}`} className="pas-bouton mt-6">Ouvrir mon temps à part <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="chemin-marge">
              <p className="text-sm font-semibold text-or-700">AVANT LA RENCONTRE</p>
              <h2 className="mt-3 font-serif text-2xl font-bold text-encre-950">Venir avec du vécu</h2>
              <p className="mt-3 text-base leading-relaxed text-encre-600">Un moment concret, ce que vous avez essayé, ce qui vous a aidé ou ce qui reste difficile.</p>
              <p className="mt-4 text-base leading-relaxed text-encre-700">Vous pouvez simplement écouter. Vous choisissez ce que vous racontez.</p>
              <Link href="/groupes" className="pas-lien mt-4">Retrouver ma cellule <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </section>
            <section className="chemin-marge">
              <p className="text-sm font-semibold text-or-700">PRENDRE DU RECUL</p>
              <h2 className="mt-3 font-serif text-2xl font-bold text-encre-950">Reconnaître le chemin</h2>
              {premiereRelecture && derniereRelecture && premiereRelecture !== derniereRelecture ? <>
                <p className="mt-4 text-sm font-semibold text-encre-600">Ma première relecture · {new Date(premiereRelecture.date).toLocaleDateString('fr-FR')}</p>
                <p className="mt-2 whitespace-pre-wrap break-words font-serif text-lg text-encre-950">{premiereRelecture.observation || ISSUES_PAS[premiereRelecture.issue]}</p>
                <p className="mt-5 text-sm font-semibold text-encre-600">Plus récemment · {new Date(derniereRelecture.date).toLocaleDateString('fr-FR')}</p>
                <p className="mt-2 whitespace-pre-wrap break-words font-serif text-lg text-encre-950">{derniereRelecture.observation || ISSUES_PAS[derniereRelecture.issue]}</p>
              </> : <p className="mt-3 text-base leading-relaxed text-encre-600">Avec vos prochaines relectures, vous pourrez retrouver ici vos premiers mots et les plus récents.</p>}
              <p className="mt-5 text-base leading-relaxed text-encre-700">Qu’est-ce qui vous surprend ? Qu’aimeriez-vous continuer à cultiver ?</p>
              <Link href="/journal" className="pas-lien mt-3">Écrire dans mon journal <PenLine className="h-4 w-4" aria-hidden="true" /></Link>
            </section>
          </aside>
        </div>

        <details className="mt-12 border-t border-parchemin-400 pt-5">
          <summary className="cursor-pointer py-3 font-serif text-xl font-bold text-encre-950">Retrouver les fiches de mon parcours</summary>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{FICHES_META.filter((f) => f.id <= ficheId).map((f) => (
            <Link key={f.id} href={`/fiches/${f.id}`} className="flex min-h-16 items-center gap-3 rounded-xl border border-parchemin-300 bg-parchemin-50 p-4 text-base text-encre-800"><span className="font-serif text-xl text-or-700">{String(f.id).padStart(2, '0')}</span>{f.titre}<ArrowRight className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" /></Link>
          ))}</div>
        </details>
        <p className="mt-8 text-sm leading-relaxed text-encre-600">Ce carnet garde la mémoire de votre expérience. Il ne mesure ni votre foi ni votre valeur.</p>
      </div>
    </div>
  );
}

export default function TransformationPage() {
  return <ParcoursGate acces="personnel"><TransformationContent /></ParcoursGate>;
}
