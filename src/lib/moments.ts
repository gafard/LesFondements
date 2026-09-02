/**
 * Le découpage d'une fiche en « moments ».
 *
 * Une fiche fait cinquante-cinq scènes. Afficher « 17/55 · 38 min » dit la
 * vérité et décourage : on annonce une épreuve d'endurance à quelqu'un qui
 * venait méditer. Or ces scènes ne sont pas une file uniforme — elles ont
 * déjà une forme, celle du livret : on entre, on écoute l'enseignement, on
 * médite, on prie, on demeure un instant, puis on garde la Parole et on conclut.
 *
 * On rend cette forme visible. « Moment 3 sur 6 · environ 7 minutes » est
 * une promesse tenable, et un endroit où l'on peut s'arrêter sans avoir le
 * sentiment d'abandonner en cours de route.
 */

/** Ce que le découpage a besoin de savoir d'une scène, et rien de plus. */
export interface SceneMesurable {
  type: string;
  /** Le texte porté par la scène, s'il y en a un : sert à l'estimation. */
  texte?: string | null;
}

export interface Moment {
  /** Stable, pour la reprise et les ancres. */
  cle: string;
  titre: string;
  /** Index de la première scène du moment dans le scénario. */
  debut: number;
  /** Index de la dernière scène, incluse. */
  fin: number;
  minutes: number;
}

/**
 * Les temps du livret, dans leur ordre. Dans « l'immersion du jour », le silence
 * qui suit la prière appartient au même mouvement qu'elle ; le silence de
 * l'ancien parcours complet reste attaché à la méditation.
 */
const TEMPS: { cle: string; titre: string; types: string[] }[] = [
  { cle: 'entrer', titre: 'Entrer', types: ['seuil'] },
  { cle: 'lire', titre: 'Lire & écouter', types: ['ouverture-section', 'bloc'] },
  { cle: 'mediter', titre: 'Méditer', types: ['silence', 'meditation'] },
  { cle: 'accompagner', titre: 'Être accompagné', types: ['accompagnement'] },
  { cle: 'prier', titre: 'Prier', types: ['priere', 'silence-priere'] },
  { cle: 'memoriser', titre: 'Mémoriser', types: ['ancrage-verset', 'resume', 'verset', 'lecture'] },
  { cle: 'ecrire', titre: 'Écrire', types: ['question'] },
  { cle: 'vivre', titre: 'Vivre', types: ['pas', 'synthese-fiche'] },
  { cle: 'conclure', titre: 'Conclure', types: ['cloture'] },
];

/** Mots lus par minute à voix haute, posément. Aligné sur `dureeLecture`. */
const MOTS_PAR_MINUTE = 180;

/**
 * Ce que coûte une scène en plus de sa lecture : recopier un verset à la
 * main prend du temps même si le verset est court, et un temps de silence
 * ne se mesure pas en mots.
 */
const MINUTES_FIXES: Record<string, number> = {
  seuil: 1,
  silence: 3,
  'silence-priere': 3,
  meditation: 7,
  accompagnement: 2,
  priere: 5,
  'ancrage-verset': 5,
  verset: 2,
  lecture: 3,
  question: 2,
  pas: 3,
  'synthese-fiche': 4,
  cloture: 2,
};

function minutesDe(scene: SceneMesurable): number {
  const mots = scene.texte ? scene.texte.trim().split(/\s+/).length : 0;
  return (MINUTES_FIXES[scene.type] ?? 0) + mots / MOTS_PAR_MINUTE;
}

/** La durée qu'on vise pour un moment : tenable d'une traite. */
const CIBLE = 7;
/** En deçà, un moment n'est plus un moment mais une miette : on le fusionne. */
const PLANCHER = 3;

export function decouperEnMoments(scenes: SceneMesurable[]): Moment[] {
  const moments: Moment[] = [];

  for (const temps of TEMPS) {
    // Les scènes de ce temps, dans l'ordre où elles apparaissent.
    const indices = scenes
      .map((scene, i) => (temps.types.includes(scene.type) ? i : -1))
      .filter((i) => i >= 0);
    if (!indices.length) continue;

    // On empile jusqu'à la cible, puis on ferme. Découper en parts égales
    // paraissait plus propre, mais laissait des restes de deux minutes en
    // fin de temps — « Écrire · 4 sur 4 · 2 min » n'est pas un moment.
    const parts: { debut: number; fin: number; minutes: number }[] = [];
    let debut = indices[0];
    let cumul = 0;

    for (const i of indices) {
      if (debut < 0) debut = i;
      cumul += minutesDe(scenes[i]);
      if (cumul >= CIBLE) {
        parts.push({ debut, fin: i, minutes: cumul });
        cumul = 0;
        debut = -1;
      }
    }

    // Le reliquat rejoint la dernière part plutôt que de former une miette.
    if (cumul > 0) {
      const reste = { debut: debut < 0 ? indices[indices.length - 1] : debut, fin: indices[indices.length - 1], minutes: cumul };
      const precedente = parts[parts.length - 1];
      if (precedente && cumul < PLANCHER) {
        precedente.fin = reste.fin;
        precedente.minutes += cumul;
      } else {
        parts.push(reste);
      }
    }

    parts.forEach((part, rang) => {
      moments.push({
        cle: parts.length > 1 ? `${temps.cle}-${rang + 1}` : temps.cle,
        titre: parts.length > 1 ? `${temps.titre} · ${rang + 1} sur ${parts.length}` : temps.titre,
        debut: part.debut,
        fin: part.fin,
        minutes: Math.max(1, Math.round(part.minutes)),
      });
    });
  }

  return moments;
}

/** Le moment auquel appartient une scène. */
export function momentDe(moments: Moment[], index: number): number {
  const trouve = moments.findIndex((m) => index >= m.debut && index <= m.fin);
  return trouve >= 0 ? trouve : 0;
}
