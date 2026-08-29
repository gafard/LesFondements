import type { Metadata } from 'next';
import Link from 'next/link';
import { Database, EyeOff, Flag, ShieldCheck, Trash2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Confidentialité et modération',
  description: 'Données, mesure d’usage, suppression de compte et règles de communauté des Fondements.',
};

const BLOCS = [
  {
    icon: Database,
    titre: 'Ce qui est conservé',
    texte: 'Votre profil, votre progression, vos réponses et votre journal servent au fonctionnement du parcours. Les réponses personnelles et le journal ne sont accessibles que par votre compte. Les présences et contenus volontairement partagés sont visibles de votre cellule.',
  },
  {
    icon: EyeOff,
    titre: 'Une mesure volontaire et minimale',
    texte: 'La mesure produit est désactivée tant que vous ne l’acceptez pas. Elle ne contient ni nom, ni courriel, ni identifiant de groupe, ni texte saisi. Elle retient uniquement des jalons — installation, fiche 1, groupe, préparation du jour, rencontre et rétention — sous un identifiant d’installation aléatoire.',
  },
  {
    icon: Flag,
    titre: 'Modération',
    texte: 'Les témoignages et messages peuvent être signalés. Sont retirés les contenus dangereux, haineux, harcelants, promotionnels, ou qui exposent la vie privée. Un signalement n’est jamais un outil de désaccord théologique ordinaire : il sert à protéger les personnes.',
  },
  {
    icon: Trash2,
    titre: 'Suppression',
    texte: 'Vous pouvez supprimer votre compte et vos données personnelles depuis les réglages. Si vous animez une cellule, vous devez d’abord transmettre l’animation afin de ne pas abandonner le groupe sans responsable.',
  },
];

export default function ConfidentialitePage() {
  return (
    <main id="contenu-principal" className="table-travail min-h-screen px-4 pb-20 pt-28 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="feuille relative rounded-4xl border border-parchemin-300 p-7 shadow-lg sm:p-10">
          <span className="ruban -top-3 left-10 -rotate-2 rounded-sm" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-or-800">Confiance et protection</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-encre-950 sm:text-5xl">Vos écrits vous appartiennent.</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-encre-700">
            Cette politique décrit, en langage direct, ce que l’application conserve et ce qu’elle ne collecte pas. Dernière mise à jour : 29 août 2026.
          </p>
        </header>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          {BLOCS.map(({ icon: Icone, titre, texte }) => (
            <section key={titre} className="fiche-bristol rounded-3xl border border-parchemin-300 p-6">
              <Icone className="h-6 w-6 text-or-700" aria-hidden="true" />
              <h2 className="mt-4 font-serif text-xl font-bold text-encre-950">{titre}</h2>
              <p className="mt-2 text-sm leading-relaxed text-encre-700">{texte}</p>
            </section>
          ))}
        </div>

        <section className="mt-7 rounded-3xl bg-encre-950 p-6 text-parchemin-100 sm:p-8">
          <ShieldCheck className="h-7 w-7 text-or-300" aria-hidden="true" />
          <h2 className="mt-3 font-serif text-2xl font-bold">Vos choix</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-parchemin-100/80">
            Vous pouvez refuser la mesure, effacer les données de cet appareil ou demander la suppression complète depuis votre espace de confidentialité.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/parametres/confidentialite" className="bouton-or inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold text-encre-950">Gérer mes données</Link>
            <Link href="/ressources" className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 text-sm font-bold">Contacter l’équipe</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
