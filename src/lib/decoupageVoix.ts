/**
 * La route de voix accepte 1 500 caractères. On garde une marge afin que
 * chaque demande reste courte, rapide à produire et naturelle à écouter.
 */
export const LONGUEUR_MORCEAU_STUDIO = 1_200;

function decouperParMots(texte: string, maximum: number): string[] {
  const morceaux: string[] = [];
  let courant = '';

  for (const mot of texte.split(/\s+/).filter(Boolean)) {
    // Cas pathologique (URL ou chaîne sans espace) : on respecte tout de
    // même la borne du serveur au lieu de faire échouer toute la lecture.
    if (mot.length > maximum) {
      if (courant) {
        morceaux.push(courant);
        courant = '';
      }
      for (let debut = 0; debut < mot.length; debut += maximum) {
        morceaux.push(mot.slice(debut, debut + maximum));
      }
      continue;
    }

    const candidat = courant ? `${courant} ${mot}` : mot;
    if (candidat.length <= maximum) courant = candidat;
    else {
      morceaux.push(courant);
      courant = mot;
    }
  }

  if (courant) morceaux.push(courant);
  return morceaux;
}

/**
 * Découpe un texte à la fin des phrases, puis seulement par mots lorsqu'une
 * phrase isolée dépasse la limite. Les morceaux peuvent ainsi être lus à la
 * suite sans cassure artificielle au milieu d'une pensée.
 */
export function decouperTextePourStudio(
  texte: string,
  maximum = LONGUEUR_MORCEAU_STUDIO
): string[] {
  if (!Number.isFinite(maximum) || maximum < 1) return [];

  const propre = texte.replace(/\s+/g, ' ').trim();
  if (!propre) return [];
  if (propre.length <= maximum) return [propre];

  const phrases = propre.match(/[^.!?…]+(?:[.!?…]+|$)/g)?.map((phrase) => phrase.trim())
    ?? [propre];
  const morceaux: string[] = [];
  let courant = '';

  const pousser = (segment: string) => {
    const candidat = courant ? `${courant} ${segment}` : segment;
    if (candidat.length <= maximum) {
      courant = candidat;
      return;
    }
    if (courant) morceaux.push(courant);
    courant = segment;
  };

  for (const phrase of phrases) {
    if (phrase.length <= maximum) pousser(phrase);
    else {
      if (courant) {
        morceaux.push(courant);
        courant = '';
      }
      morceaux.push(...decouperParMots(phrase, maximum));
    }
  }

  if (courant) morceaux.push(courant);
  return morceaux;
}
