'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, ChevronDown, Printer, Users, HeartHandshake, Eye, Sparkles } from 'lucide-react';

interface GuidePastoralProps {
  ficheId: number;
}

export default function GuidePastoralCellule({ ficheId }: GuidePastoralProps) {
  const [ouvert, setOuvert] = useState(false);

  // Ce volet accompagne particulièrement les fiches 7, 8 et 15
  if (![7, 8, 15].includes(ficheId)) return null;

  return (
    <div className="my-8 rounded-3xl border-2 border-or-300/80 bg-[#fdfbf7] p-5 sm:p-7 shadow-lg transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-or-100 text-or-800 border border-or-200 shadow-2xs">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xs font-bold uppercase tracking-[0.2em] text-or-800 font-serif">
                Annexe Pastorale · Fiche {ficheId}
              </span>
              <span className="rounded-full bg-or-100 px-2 py-0.5 text-3xs font-semibold text-or-900">
                Ouvert à tous
              </span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-encre-950">
              Guide pastoral : Prendre soin les uns des autres
            </h3>
            <p className="mt-0.5 text-xs text-encre-600 font-serif italic">
              « Ce n’est pas réservé à une élite. Tout le monde est appelé à prendre soin de ses frères et sœurs. »
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Link
            href="/guide-pastoral"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border border-parchemin-300 bg-white px-3.5 py-2 text-2xs font-bold text-encre-700 hover:bg-parchemin-100 shadow-2xs transition-colors"
            title="Ouvrir la version imprimable pour glisser dans la Bible"
          >
            <Printer className="h-3.5 w-3.5 text-or-700" />
            <span>Fiche Bible (A4)</span>
          </Link>

          <button
            type="button"
            onClick={() => setOuvert((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-encre-950 px-4 py-2 text-2xs font-bold text-parchemin-100 hover:bg-encre-900 shadow-xs transition-transform active:scale-95"
          >
            <span>{ouvert ? 'Masquer' : 'Consulter le guide'}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${ouvert ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {ouvert && (
        <div className="mt-6 border-t border-parchemin-300/80 pt-6 space-y-6 animate-fadeIn text-encre-900">
          
          {/* Bloc 1 : Pourquoi prendre soin & Qui peut le faire */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-parchemin-300 bg-white/80 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-bold font-serif text-encre-950 mb-2">
                <Users className="h-4 w-4 text-or-700" />
                <span>Pourquoi veiller les uns sur les autres ?</span>
              </div>
              <p className="text-xs leading-relaxed text-encre-700">
                L’Église est un corps où tous les membres sont interdépendants. Je ne peux pas dire comme Caïn : 
                <em> « Suis-je le gardien de mon frère ? »</em>. Tout ce qui touche mon frère me concerne, non pour le manipuler 
                ou tout savoir de lui, mais par amour fraternel et communion.
              </p>
            </div>

            <div className="rounded-2xl border border-parchemin-300 bg-white/80 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-bold font-serif text-encre-950 mb-2">
                <HeartHandshake className="h-4 w-4 text-or-700" />
                <span>Qui peut prendre soin ?</span>
              </div>
              <p className="text-xs leading-relaxed text-encre-700">
                Les responsables sont des repères et des formateurs, mais <strong>le soin mutuel appartient à tout le monde</strong>. 
                Chacun est appelé à donner et à recevoir. Pour aider avec efficacité, veillons à être nous-mêmes restaurés et fondés dans notre identité en Christ.
              </p>
            </div>
          </div>

          {/* Bloc 2 : Prier en équipe (2 ou 3) */}
          <div className="rounded-2xl border border-or-300 bg-or-50/50 p-4 sm:p-5">
            <h4 className="flex items-center gap-2 text-xs font-bold font-serif text-or-950 mb-3">
              <Sparkles className="h-4 w-4 text-or-700" />
              <span>Prier pour une personne : la force de l’équipe (2 ou 3)</span>
            </h4>
            <div className="grid sm:grid-cols-3 gap-3 text-xs text-encre-800">
              <div className="rounded-xl bg-white/90 p-3 border border-or-200">
                <p className="font-bold text-encre-950 mb-1">1. Jamais seul(e)</p>
                <p className="text-2xs leading-relaxed">
                  Prier à 2 ou 3 pour plus de complémentarité. <strong>Éviter impérativement le 1 à 1 entre sexe opposé</strong>.
                </p>
              </div>
              <div className="rounded-xl bg-white/90 p-3 border border-or-200">
                <p className="font-bold text-encre-950 mb-1">2. Complémentarité</p>
                <p className="text-2xs leading-relaxed">
                  L’un conduit le dialogue, l’autre prie en silence pour la direction de l’Esprit, l’autre prie avec autorité selon ce qui est révélé.
                </p>
              </div>
              <div className="rounded-xl bg-white/90 p-3 border border-or-200">
                <p className="font-bold text-encre-950 mb-1">3. Contexte &amp; Racines</p>
                <p className="text-2xs leading-relaxed">
                  Ne pas prier juste le symptôme : discerner les racines familiales, le besoin de pardon vrai, les liens ou forteresses à briser.
                </p>
              </div>
            </div>
          </div>

          {/* Bloc 3 : Principes & Pièges à éviter */}
          <div className="rounded-2xl border border-parchemin-300 bg-white/90 p-4 sm:p-5">
            <h4 className="flex items-center gap-2 text-xs font-bold font-serif text-encre-950 mb-3">
              <Eye className="h-4 w-4 text-or-700" />
              <span>Les 4 repères indispensables</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-encre-700">
              <li className="flex items-start gap-2">
                <span className="font-bold text-or-800 shrink-0">•</span>
                <span>
                  <strong>Les brebis sont au Seigneur, pas à nous :</strong> La personne ne nous appartient pas. Aucun contrôle, aucune pression.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-or-800 shrink-0">•</span>
                <span>
                  <strong>Ni introspection morbide, ni psychologie :</strong> Avec Dieu c’est simple. C’est le Saint-Esprit qui révèle les blocages, pas besoin de scruter chaque détail.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-or-800 shrink-0">•</span>
                <span>
                  <strong>Discerner la volonté de la personne :</strong> Le Seigneur ne force personne. Éviter le piège de la victimisation (attirer l’attention sans vouloir changer).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-or-800 shrink-0">•</span>
                <span>
                  <strong>La prière n’est pas magique :</strong> La personne doit aussi prendre position avec sa propre volonté pour marcher dans la victoire.
                </span>
              </li>
            </ul>
          </div>

        </div>
      )}
    </div>
  );
}
