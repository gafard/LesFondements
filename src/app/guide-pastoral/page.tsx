'use client';

import Link from 'next/link';
import { Printer, ArrowLeft, Shield } from 'lucide-react';

export default function GuidePastoralPrintPage() {
  const imprimer = () => {
    if (typeof window !== 'undefined') window.print();
  };

  return (
    <div className="min-h-screen bg-parchemin-100 py-6 sm:py-12 px-4 sm:px-6 print:bg-white print:p-0 print:m-0 text-encre-950">
      
      {/* Barre d'action d'impression (masquée à l'impression) */}
      <div className="mx-auto max-w-4xl mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/ressources"
          className="inline-flex items-center gap-2 text-xs font-bold text-encre-600 hover:text-encre-950 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour aux ressources</span>
        </Link>

        <button
          type="button"
          onClick={imprimer}
          className="inline-flex items-center gap-2 rounded-full bg-encre-950 px-5 py-2.5 text-xs font-bold text-parchemin-100 shadow-md hover:bg-encre-800 transition-all hover:scale-105 active:scale-95"
        >
          <Printer className="h-4 w-4 text-or-300" />
          <span>Imprimer la Fiche Bible (A4)</span>
        </button>
      </div>

      {/* Feuille A4 Mémo Pastoral */}
      <main className="mx-auto max-w-4xl rounded-3xl bg-white p-8 sm:p-12 shadow-xl border border-parchemin-300 print:border-none print:shadow-none print:p-6 print:max-w-none print:rounded-none">
        
        {/* En-tête officiel */}
        <header className="border-b-2 border-encre-950 pb-6 mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xs font-bold uppercase tracking-[0.25em] text-or-800 font-serif">
                Parcours des Fondements · Annexe Pastorale
              </span>
              <span className="rounded-full bg-parchemin-200 px-2 py-0.5 text-3xs font-semibold text-encre-800 print:hidden">
                Accompagnement Fiches 7, 8 &amp; 15
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-encre-950 leading-tight">
              Prendre soin les uns des autres
            </h1>
            <p className="mt-1 font-serif text-xs italic text-encre-600">
              Guide pastoral des cellules de partage et de prière d’accompagnement
            </p>
          </div>

          <div className="text-right hidden sm:block">
            <div className="font-serif font-bold text-sm text-encre-900">Les Fondements</div>
            <div className="text-3xs text-encre-500 font-serif">Livret de discipulat</div>
          </div>
        </header>

        {/* Corps du Guide */}
        <div className="space-y-7 text-xs leading-relaxed text-encre-900">
          
          {/* Section 1 */}
          <section>
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-or-900 border-b border-parchemin-300 pb-1 mb-2">
              1. Pourquoi prendre soin les uns des autres ?
            </h2>
            <p className="mb-2">
              <em>« Les uns les autres »</em> : c’est le langage constant du Nouveau Testament (<em>« Veillez les uns sur les autres »</em>, <em>« Encouragez-vous »</em>, <em>« Supportez-vous »</em>).
            </p>
            <p>
              L’Église est une famille, un corps où tous les membres sont interconnectés et interdépendants. Ce qui influe sur l’un, influe sur tout le corps. Je ne peux pas dire comme Caïn : <em>« Suis-je le gardien de mon frère ? »</em>. Tout ce que vit mon frère me concerne — non pour tout savoir de lui ou le manipuler, mais simplement parce que nous sommes membres l’un de l’autre.
            </p>
          </section>

          {/* Section 2 */}
          <section className="grid sm:grid-cols-2 gap-6">
            <div>
              <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-or-900 border-b border-parchemin-300 pb-1 mb-2">
                2. Quels domaines ?
              </h2>
              <p>
                L’état <strong>spirituel</strong>, mais aussi <strong>moral</strong> (la personne est-elle en forme ?), <strong>éthique</strong> (marche-t-elle selon la vérité de Dieu ?), et <strong>physique / émotionnel</strong>.
              </p>
            </div>
            <div>
              <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-or-900 border-b border-parchemin-300 pb-1 mb-2">
                3. Qui peut prendre soin ?
              </h2>
              <p>
                <strong>Ce n’est pas réservé à une élite.</strong> Tout le monde est appelé à prendre soin et à recevoir le soin. Les bergers sont là comme modèles et formateurs. On ne peut aider efficacement que si l’on est soi-même restauré et bien fondé en Christ.
              </p>
            </div>
          </section>

          {/* Section 4 : Recommandations de Prière */}
          <section className="rounded-2xl border-2 border-or-300 bg-or-50/40 p-5 print:bg-white print:border-encre-900">
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-or-950 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-or-700" />
              <span>4. Prier pour une personne : Recommandations clés</span>
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <p>
                  <strong>• Toujours en équipe (2 ou 3) :</strong> Pour la complémentarité des dons (l’un mène l’échange, l’autre prie en silence pour la direction, l’autre prie avec autorité).
                </p>
                <p className="text-rose-950 font-semibold bg-rose-50 p-2 rounded-lg border border-rose-200 print:bg-white print:border-none print:p-0">
                  ⚠️ Éviter impérativement le 1 à 1 entre personnes de sexe opposé.
                </p>
                <p>
                  <strong>• Poser des questions pour cerner la racine :</strong> Ne pas prier uniquement pour le symptôme visible, mais discerner l’origine profonde dans l’Esprit.
                </p>
              </div>

              <div className="space-y-2">
                <p>
                  <strong>• L’impact familial &amp; le pardon :</strong> Reconnaître en vérité les manques ou blessures parentales, pour pouvoir accorder un <strong>pardon vrai et entier</strong> et restaurer l’identité.
                </p>
                <p>
                  <strong>• Liens &amp; forteresses :</strong> Discerner les forteresses de pensée, liens occultes ou malédictions, et prier avec autorité pour la libération au nom de Jésus.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 : Principes d'Attitude */}
          <section>
            <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-or-900 border-b border-parchemin-300 pb-1 mb-3">
              5. Principes d’attitude spirituelle &amp; Pièges à éviter
            </h2>

            <div className="grid sm:grid-cols-3 gap-4 text-2xs leading-relaxed">
              <div className="rounded-xl border border-parchemin-300 p-3.5">
                <h3 className="font-bold font-serif text-encre-950 text-xs mb-1">
                  Les brebis sont au Seigneur
                </h3>
                <p className="text-encre-700">
                  La personne ne m’appartient pas. Pas de possessivité, pas de pression, pas de contrôle sur son cheminement.
                </p>
              </div>

              <div className="rounded-xl border border-parchemin-300 p-3.5">
                <h3 className="font-bold font-serif text-encre-950 text-xs mb-1">
                  Ni introspection, ni psychologie
                </h3>
                <p className="text-encre-700">
                  Avec Dieu c’est simple. Ne pas chercher de problèmes là où il n’y en a pas. C’est le Seigneur qui révèle les cœurs.
                </p>
              </div>

              <div className="rounded-xl border border-parchemin-300 p-3.5">
                <h3 className="font-bold font-serif text-encre-950 text-xs mb-1">
                  Discerner la volonté réelle
                </h3>
                <p className="text-encre-700">
                  Dieu ne force personne. Attention au piège de la victimisation (attirer l’attention sans vouloir changer).
                </p>
              </div>
            </div>
          </section>

          {/* Pied de page */}
          <footer className="border-t border-parchemin-300 pt-4 mt-6 flex items-center justify-between text-3xs text-encre-500 font-serif italic">
            <span>Parcours des Fondements · Vivre libre et en communauté</span>
            <span>À glisser dans votre Bible pour les temps de prière fraternelle</span>
          </footer>

        </div>
      </main>
    </div>
  );
}
