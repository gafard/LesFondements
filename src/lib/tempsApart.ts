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
 * modifier le document canonique. Certaines fiches regroupent plusieurs
 * mouvements sur une même page : l'immersion les déplie pour que chacun
 * puisse être vécu comme un temps complet.
 */
export function etapesTempsApart(fiche: FicheLivret): EtapeTempsApart[] {
  const ordinaires = fiche.sections.map((section, index) => ({
    section,
    sourceSectionIndex: index,
    sourceBlocOffset: 0,
    ouverturePreenregistree: true,
  }));
  if (fiche.id === 3) {
    const foi = fiche.sections[0];
    const graceEtFoi = fiche.sections[1];
    const nouvelleNaissanceEtAdoption = fiche.sections[2];
    const bapteme = fiche.sections[3];
    if (!foi || !graceEtFoi || !nouvelleNaissanceEtAdoption || !bapteme) return ordinaires;

    const debutNouvelleCreation = nouvelleNaissanceEtAdoption.blocs.findIndex(
      (bloc) => bloc.type === 'sous-titre' && /nouvelle créature/i.test(bloc.texte)
    );
    const debutAdoption = nouvelleNaissanceEtAdoption.blocs.findIndex(
      (bloc) => bloc.type === 'sous-titre' && /enfant de Dieu, adopté/i.test(bloc.texte)
    );
    if (debutNouvelleCreation < 0 || debutAdoption <= debutNouvelleCreation) return ordinaires;

    return [
      {
        section: { ...foi, titre: 'La foi' },
        sourceSectionIndex: 0,
        sourceBlocOffset: 0,
        ouverturePreenregistree: true,
      },
      {
        section: { ...graceEtFoi, titre: 'La grâce et la foi' },
        sourceSectionIndex: 1,
        sourceBlocOffset: 0,
        ouverturePreenregistree: true,
      },
      {
        section: {
          titre: 'La nécessité d’une nouvelle naissance',
          blocs: nouvelleNaissanceEtAdoption.blocs.slice(0, debutNouvelleCreation),
        },
        sourceSectionIndex: 2,
        sourceBlocOffset: 0,
        ouverturePreenregistree: true,
      },
      {
        section: {
          titre: 'Une nouvelle création',
          blocs: nouvelleNaissanceEtAdoption.blocs.slice(debutNouvelleCreation, debutAdoption),
        },
        sourceSectionIndex: 2,
        sourceBlocOffset: debutNouvelleCreation,
        ouverturePreenregistree: false,
      },
      {
        section: {
          titre: 'Enfant de Dieu, adopté du Père',
          blocs: nouvelleNaissanceEtAdoption.blocs.slice(debutAdoption),
        },
        sourceSectionIndex: 2,
        sourceBlocOffset: debutAdoption,
        ouverturePreenregistree: false,
      },
      {
        section: { ...bapteme, titre: 'Après la nouvelle naissance : le baptême' },
        sourceSectionIndex: 3,
        sourceBlocOffset: 0,
        ouverturePreenregistree: true,
      },
    ];
  }

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
