/**
 * Comparer un verset récité au verset attendu.
 *
 * Le point délicat n'est pas de compter les mots justes, c'est de ne pas
 * imputer à quelqu'un les fautes de la machine. Whisper francise mal
 * certains noms propres, avale des liaisons, hésite sur les élisions. Une
 * comparaison stricte transformerait chacune de ces approximations en
 * défaillance de mémoire — et c'est le contraire qu'on veut mesurer.
 *
 * On compare donc sur une forme dépouillée : sans accents, sans
 * ponctuation, sans majuscules, et en tolérant qu'un mot soit approché.
 */

export type EtatMot = 'juste' | 'approche' | 'manque' | 'ajoute';

export interface MotCompare {
  /** Le mot du verset, tel qu'il s'écrit. */
  mot: string;
  etat: EtatMot;
}

export interface Resultat {
  /** De 0 à 100. Les mots approchés comptent pour la moitié. */
  score: number;
  mots: MotCompare[];
  /** Ce que la personne a dit, tel que la machine l'a entendu. */
  entendu: string;
}

/** La forme sur laquelle on compare : accents et ponctuation retirés. */
export function depouiller(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function enMots(texte: string): string[] {
  const propre = depouiller(texte);
  return propre ? propre.split(' ') : [];
}

/**
 * Distance de Levenshtein, bornée : au-delà de `plafond` on s'arrête, car
 * seule la question « est-ce proche ? » nous intéresse.
 */
function distance(a: string, b: string, plafond = 3): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > plafond) return plafond + 1;

  let precedente = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const courante = [i];
    let minimum = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      const valeur = Math.min(
        precedente[j] + 1,
        courante[j - 1] + 1,
        precedente[j - 1] + cout
      );
      courante.push(valeur);
      if (valeur < minimum) minimum = valeur;
    }
    if (minimum > plafond) return plafond + 1;
    precedente = courante;
  }
  return precedente[b.length];
}

/**
 * Deux mots se ressemblent-ils assez pour qu'on n'en fasse pas une faute ?
 *
 * La marge suit la longueur. Les mots très courts n'en reçoivent aucune —
 * « ton » et « son » ne doivent pas se confondre. Dès quatre lettres on en
 * accorde une, ce qui couvre la confusion la plus fréquente de Whisper en
 * français : l'infinitif entendu pour le participe, « aimer » pour « aimé ».
 */
function seRessemblent(attendu: string, dit: string): boolean {
  if (attendu === dit) return true;
  const marge = attendu.length <= 3 ? 0 : attendu.length <= 6 ? 1 : 2;
  return marge > 0 && distance(attendu, dit, marge) <= marge;
}

/**
 * Aligne ce qui a été dit sur ce qui était attendu.
 *
 * On avance dans les deux suites en même temps, avec une petite fenêtre de
 * rattrapage : quelqu'un qui saute un mot ou en ajoute un ne doit pas voir
 * tout le reste compté faux par décalage.
 */
export function comparer(attendu: string, entendu: string): Resultat {
  const motsAttendus = attendu.split(/\s+/).filter(Boolean);
  const clesAttendues = enMots(attendu);
  const clesDites = enMots(entendu);

  const mots: MotCompare[] = [];
  let i = 0;
  let j = 0;
  let points = 0;

  const FENETRE = 3;

  while (i < clesAttendues.length) {
    const attenduCle = clesAttendues[i];
    const ditCle = clesDites[j];

    // L'élision se transcrit tantôt liée, tantôt séparée : « qu'il » peut
    // arriver en « qu il » ou en « quil ». Sans ce rapprochement, tout le
    // reste du verset se décalait et se comptait faux.
    const attenduLie = attenduCle + (clesAttendues[i + 1] ?? '');
    if (ditCle !== undefined && clesAttendues[i + 1] && ditCle === attenduLie) {
      mots.push({ mot: motsAttendus[i] ?? attenduCle, etat: 'juste' });
      mots.push({ mot: motsAttendus[i + 1] ?? clesAttendues[i + 1], etat: 'juste' });
      points += 2;
      i += 2;
      j += 1;
      continue;
    }
    const ditLie = ditCle !== undefined ? ditCle + (clesDites[j + 1] ?? '') : '';
    if (clesDites[j + 1] && ditLie === attenduCle) {
      mots.push({ mot: motsAttendus[i] ?? attenduCle, etat: 'juste' });
      points += 1;
      i += 1;
      j += 2;
      continue;
    }

    if (ditCle !== undefined && seRessemblent(attenduCle, ditCle)) {
      const exact = attenduCle === ditCle;
      mots.push({ mot: motsAttendus[i] ?? attenduCle, etat: exact ? 'juste' : 'approche' });
      points += exact ? 1 : 0.5;
      i += 1;
      j += 1;
      continue;
    }

    // Le mot attendu apparaît-il un peu plus loin ? Alors la personne a
    // ajouté quelque chose entre-temps : on saute ce qu'elle a dit en trop.
    const plusLoin = clesDites
      .slice(j, j + FENETRE + 1)
      .findIndex((m) => seRessemblent(attenduCle, m));
    if (plusLoin > 0) {
      j += plusLoin;
      continue;
    }

    // Le mot dit correspond-il à un mot attendu plus loin ? Alors elle a
    // sauté un passage : on marque les mots omis.
    const saute = clesAttendues
      .slice(i, i + FENETRE + 1)
      .findIndex((m) => ditCle !== undefined && seRessemblent(m, ditCle));
    if (saute > 0) {
      for (let k = 0; k < saute; k += 1) {
        mots.push({ mot: motsAttendus[i + k] ?? clesAttendues[i + k], etat: 'manque' });
      }
      i += saute;
      continue;
    }

    mots.push({ mot: motsAttendus[i] ?? attenduCle, etat: 'manque' });
    i += 1;
    if (ditCle !== undefined) j += 1;
  }

  const score = clesAttendues.length
    ? Math.round((points / clesAttendues.length) * 100)
    : 0;

  return { score, mots, entendu: entendu.trim() };
}
