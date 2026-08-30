import decoupages from '../data/tempsApart.json' with { type: 'json' };
import type { Bloc, FicheLivret, SectionLivret } from './livret';

export interface EtapeTempsApart {
  section: SectionLivret;
  /** Position du bloc dans le livret canonique, pour retrouver sa piste audio. */
  sourceSectionIndex: number;
  sourceBlocOffset: number;
  /** Une section recomposée n'a pas de piste d'ouverture prégénérée fiable. */
  ouverturePreenregistree: boolean;
}

/**
 * Les temps quotidiens suivent les mouvements pédagogiques du livret, sans
 * modifier le document canonique. Certaines fiches regroupent plusieurs
 * mouvements sur une même page : l'immersion les déplie pour que chacun
 * puisse être vécu comme un temps complet.
 *
 * Les découpages sont déclarés dans `src/data/tempsApart.json`, et non plus
 * écrits en dur ici. La version précédente demandait une branche de code par
 * fiche : quatre fiches y tenaient en deux cents lignes, les vingt en
 * auraient demandé mille. Surtout, un repère introuvable — un sous-titre dont
 * l'accent change — faisait retomber la fiche sur son découpage d'origine
 * sans que rien ne le signale.
 */

interface EtapeDeclaree {
  section: number;
  titre: string;
  /** Sous-titre où la coupe commence. Absent : depuis le début. */
  depuis?: string;
  /** Sous-titre où la coupe s'arrête. Absent : jusqu'au bout. */
  jusqua?: string;
  /** Sections supplémentaires à joindre, dans l'ordre indiqué. */
  avec?: number[];
  ordre?: number[];
  /** Chercher le repère dans le texte de tout bloc, pas seulement les sous-titres. */
  surTexte?: boolean;
}

const TABLE = decoupages as unknown as Record<string, EtapeDeclaree[]>;

/** Comparaison indifférente aux accents et à la casse. */
function depouiller(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Où se trouve un repère dans une section, ou -1. */
function reperer(blocs: Bloc[], repere: string, surTexte: boolean): number {
  const cible = depouiller(repere);
  return blocs.findIndex(
    (bloc) =>
      (surTexte || bloc.type === 'sous-titre') && depouiller(bloc.texte).includes(cible)
  );
}

/** Le découpage par défaut : une étape par section du livret. */
function parSections(fiche: FicheLivret): EtapeTempsApart[] {
  return fiche.sections.map((section, index) => ({
    section,
    sourceSectionIndex: index,
    sourceBlocOffset: 0,
    ouverturePreenregistree: true,
  }));
}

export function etapesTempsApart(fiche: FicheLivret): EtapeTempsApart[] {
  const declare = TABLE[String(fiche.id)];
  if (!declare?.length) return parSections(fiche);

  const etapes: EtapeTempsApart[] = [];

  for (const etape of declare) {
    const source = fiche.sections[etape.section];
    if (!source) {
      // Le livret a changé sous le découpage : on le dit, et on rend le
      // découpage par défaut plutôt qu'une fiche amputée.
      console.warn(
        `[tempsApart] fiche ${fiche.id} : section ${etape.section} absente — découpage ignoré`
      );
      return parSections(fiche);
    }

    // Une étape peut réunir plusieurs sections (fiche 6).
    const blocsSource =
      etape.avec?.length || etape.ordre?.length
        ? (etape.ordre ?? [etape.section, ...(etape.avec ?? [])]).flatMap(
            (i) => fiche.sections[i]?.blocs ?? []
          )
        : source.blocs;

    let debut = 0;
    let fin = blocsSource.length;

    if (etape.depuis) {
      debut = reperer(blocsSource, etape.depuis, !!etape.surTexte);
      if (debut < 0) {
        console.warn(
          `[tempsApart] fiche ${fiche.id} : repère « ${etape.depuis} » introuvable — découpage ignoré`
        );
        return parSections(fiche);
      }
    }
    if (etape.jusqua) {
      const arret = reperer(blocsSource, etape.jusqua, !!etape.surTexte);
      if (arret < 0) {
        console.warn(
          `[tempsApart] fiche ${fiche.id} : repère « ${etape.jusqua} » introuvable — découpage ignoré`
        );
        return parSections(fiche);
      }
      fin = arret;
    }
    if (fin <= debut) {
      console.warn(
        `[tempsApart] fiche ${fiche.id} : « ${etape.titre} » serait vide — découpage ignoré`
      );
      return parSections(fiche);
    }

    const entier = debut === 0 && fin === blocsSource.length;

    etapes.push({
      section: {
        ...source,
        titre: etape.titre,
        blocs: entier ? blocsSource : blocsSource.slice(debut, fin),
      },
      sourceSectionIndex: etape.section,
      sourceBlocOffset: debut,
      // Une section reprise en entier garde sa piste d'ouverture ; une
      // section recomposée n'en a pas.
      ouverturePreenregistree: debut === 0,
    });
  }

  return etapes;
}
