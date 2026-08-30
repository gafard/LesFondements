import type { FicheLivret, SectionLivret } from './livret';

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
 * modifier le document canonique. Dans la fiche 2, « La Grâce » est imprimée
 * sous « Le Salut » alors que le résumé en fait bien un quatrième mouvement.
 */
export function etapesTempsApart(fiche: FicheLivret): EtapeTempsApart[] {
  const ordinaires = fiche.sections.map((section, index) => ({
    section,
    sourceSectionIndex: index,
    sourceBlocOffset: 0,
    ouverturePreenregistree: true,
  }));
  if (fiche.id !== 2) return ordinaires;

  const peche = fiche.sections[0];
  const loi = fiche.sections[1];
  const salutEtGrace = fiche.sections[2];
  if (!peche || !loi || !salutEtGrace) return ordinaires;

  const debutGrace = salutEtGrace.blocs.findIndex(
    (bloc) => bloc.type === 'sous-titre' && /grâce me suffit/i.test(bloc.texte)
  );
  if (debutGrace < 0) return ordinaires;

  return [
    {
      section: { ...peche, titre: 'Le péché' },
      sourceSectionIndex: 0,
      sourceBlocOffset: 0,
      ouverturePreenregistree: true,
    },
    {
      section: { ...loi, titre: 'La Loi' },
      sourceSectionIndex: 1,
      sourceBlocOffset: 0,
      ouverturePreenregistree: true,
    },
    {
      section: { titre: 'Le Salut', blocs: salutEtGrace.blocs.slice(0, debutGrace) },
      sourceSectionIndex: 2,
      sourceBlocOffset: 0,
      ouverturePreenregistree: true,
    },
    {
      section: { titre: 'La Grâce', blocs: salutEtGrace.blocs.slice(debutGrace) },
      sourceSectionIndex: 2,
      sourceBlocOffset: debutGrace,
      ouverturePreenregistree: false,
    },
  ];
}
