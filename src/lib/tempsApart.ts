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

  if (fiche.id === 4) {
    const definition = fiche.sections[0];
    const obstacles = fiche.sections[1];
    const croissance = fiche.sections[2];
    const obeissanceEtEpreuve = fiche.sections[3];
    const repos = fiche.sections[4];
    if (!definition || !obstacles || !croissance || !obeissanceEtEpreuve || !repos) {
      return ordinaires;
    }

    const debutEpreuve = obeissanceEtEpreuve.blocs.findIndex(
      (bloc) => bloc.type === 'sous-titre' && /école de la souffrance/i.test(bloc.texte)
    );
    if (debutEpreuve < 0) return ordinaires;

    return [
      {
        section: { ...definition, titre: 'Qu’est-ce que la grâce ?' },
        sourceSectionIndex: 0,
        sourceBlocOffset: 0,
        ouverturePreenregistree: true,
      },
      {
        section: { ...obstacles, titre: 'Pourquoi est-il difficile de vivre dans la grâce ?' },
        sourceSectionIndex: 1,
        sourceBlocOffset: 0,
        ouverturePreenregistree: true,
      },
      {
        section: { ...croissance, titre: 'Comment Dieu me fait-il croître dans la grâce ?' },
        sourceSectionIndex: 2,
        sourceBlocOffset: 0,
        ouverturePreenregistree: true,
      },
      {
        section: {
          titre: 'Ma part : l’obéissance',
          blocs: obeissanceEtEpreuve.blocs.slice(0, debutEpreuve),
        },
        sourceSectionIndex: 3,
        sourceBlocOffset: 0,
        ouverturePreenregistree: true,
      },
      {
        section: {
          titre: 'Dans la faiblesse et l’épreuve',
          blocs: obeissanceEtEpreuve.blocs.slice(debutEpreuve),
        },
        sourceSectionIndex: 3,
        sourceBlocOffset: debutEpreuve,
        ouverturePreenregistree: false,
      },
      {
        section: { ...repos, titre: 'Le repos' },
        sourceSectionIndex: 4,
        sourceBlocOffset: 0,
        ouverturePreenregistree: true,
      },
    ];
  }

  if (fiche.id === 6) {
    const depouiller = fiche.sections[1];
    const devenirSpirituel = fiche.sections[2];
    const chairOuEsprit = fiche.sections[3];
    const agir = fiche.sections[4];
    if (!depouiller || !devenirSpirituel || !chairOuEsprit || !agir) return ordinaires;

    const debutRenouvellement = agir.blocs.findIndex(
      (bloc) => /renouvelant notre manière de pensée/i.test(bloc.texte)
    );
    const debutMarcheEsprit = agir.blocs.findIndex(
      (bloc) => /apprenant à marcher par l'esprit/i.test(bloc.texte)
    );
    if (debutRenouvellement < 0 || debutMarcheEsprit <= debutRenouvellement) return ordinaires;

    return [
      {
        section: { ...depouiller, titre: 'Se dépouiller et se revêtir' },
        sourceSectionIndex: 1,
        sourceBlocOffset: 0,
        ouverturePreenregistree: true,
      },
      {
        section: {
          titre: 'Marcher par la chair ou par l’Esprit ?',
          blocs: [...devenirSpirituel.blocs, ...chairOuEsprit.blocs],
        },
        sourceSectionIndex: 3,
        sourceBlocOffset: 0,
        ouverturePreenregistree: true,
      },
      {
        section: {
          titre: 'Renouveler ma manière de penser',
          blocs: agir.blocs.slice(debutRenouvellement, debutMarcheEsprit),
        },
        sourceSectionIndex: 4,
        sourceBlocOffset: debutRenouvellement,
        ouverturePreenregistree: false,
      },
      {
        section: {
          titre: 'Apprendre à marcher par l’Esprit',
          blocs: agir.blocs.slice(debutMarcheEsprit),
        },
        sourceSectionIndex: 4,
        sourceBlocOffset: debutMarcheEsprit,
        ouverturePreenregistree: false,
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
