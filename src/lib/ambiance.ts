import { preparerPourLaVoix } from './prononciation.mjs';
import { urlVoixStudio, voixStudioEcartee, voixStudioPossible } from './voixStudio';
import { chargerManifesteVoix } from './voix';

/**
 * Ambiance sonore de l'immersion, entièrement synthétisée.
 *
 * Aucun fichier audio n'est embarqué : tout est produit par la Web Audio API.
 * L'application reste légère, fonctionne hors-ligne, et aucune question de
 * licence ne se pose sur un fond sonore.
 *
 * Trois ambiances :
 *  · souffle — un pad chaud et respirant, très en retrait ;
 *  · pluie   — un bruit filtré, régulier, qui masque les bruits alentour ;
 *  · silence — rien du tout, c'est aussi une option.
 */

export type Ambiance = 'silence' | 'souffle' | 'pluie';

export const AMBIANCES: { valeur: Ambiance; label: string; description: string }[] = [
  { valeur: 'silence', label: 'Silence', description: 'Rien que votre lecture' },
  { valeur: 'souffle', label: 'Souffle', description: 'Un fond chaud et lent' },
  { valeur: 'pluie', label: 'Pluie', description: 'Pour couvrir le bruit autour' },
];

type Contexte = {
  ctx: AudioContext;
  master: GainNode;
  noeuds: AudioNode[];
  sources: AudioScheduledSourceNode[];
};

let actif: Contexte | null = null;
let ambianceActuelle: Ambiance = 'silence';

/** Un tampon de bruit rose : plus doux à l'oreille qu'un bruit blanc. */
function tamponBruitRose(ctx: AudioContext, secondes = 4): AudioBuffer {
  const longueur = ctx.sampleRate * secondes;
  const buffer = ctx.createBuffer(1, longueur, ctx.sampleRate);
  const donnees = buffer.getChannelData(0);

  // Filtre de Voss-McCartney simplifié.
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < longueur; i += 1) {
    const blanc = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + blanc * 0.0555179;
    b1 = 0.99332 * b1 + blanc * 0.0750759;
    b2 = 0.969 * b2 + blanc * 0.153852;
    b3 = 0.8665 * b3 + blanc * 0.3104856;
    b4 = 0.55 * b4 + blanc * 0.5329522;
    b5 = -0.7616 * b5 - blanc * 0.016898;
    donnees[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + blanc * 0.5362) * 0.11;
    b6 = blanc * 0.115926;
  }
  return buffer;
}

function construireSouffle(ctx: AudioContext, master: GainNode): Contexte {
  const noeuds: AudioNode[] = [];
  const sources: AudioScheduledSourceNode[] = [];

  // Un accord très grave, à la limite de l'audible : ré – la – ré.
  const fondamentales = [73.42, 110.0, 146.83];
  fondamentales.forEach((frequence, index) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequence;

    const gain = ctx.createGain();
    gain.gain.value = index === 0 ? 0.09 : 0.045;

    // Chaque voix respire à son propre rythme : le son ne « boucle » jamais.
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.045 + index * 0.017;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = index === 0 ? 0.035 : 0.02;
    lfo.connect(lfoGain).connect(gain.gain);

    osc.connect(gain).connect(master);
    osc.start();
    lfo.start();
    sources.push(osc, lfo);
    noeuds.push(gain, lfoGain);
  });

  // Un voile de bruit très filtré, pour donner de l'air.
  const bruit = ctx.createBufferSource();
  bruit.buffer = tamponBruitRose(ctx, 6);
  bruit.loop = true;
  const passeBas = ctx.createBiquadFilter();
  passeBas.type = 'lowpass';
  passeBas.frequency.value = 420;
  const gainBruit = ctx.createGain();
  gainBruit.gain.value = 0.05;
  bruit.connect(passeBas).connect(gainBruit).connect(master);
  bruit.start();
  sources.push(bruit);
  noeuds.push(passeBas, gainBruit);

  return { ctx, master, noeuds, sources };
}

function construirePluie(ctx: AudioContext, master: GainNode): Contexte {
  const noeuds: AudioNode[] = [];
  const sources: AudioScheduledSourceNode[] = [];

  const bruit = ctx.createBufferSource();
  bruit.buffer = tamponBruitRose(ctx, 6);
  bruit.loop = true;

  const passeHaut = ctx.createBiquadFilter();
  passeHaut.type = 'highpass';
  passeHaut.frequency.value = 500;

  const passeBas = ctx.createBiquadFilter();
  passeBas.type = 'lowpass';
  passeBas.frequency.value = 6200;

  const gain = ctx.createGain();
  gain.gain.value = 0.22;

  // Une averse n'est jamais parfaitement régulière.
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.05;
  lfo.connect(lfoGain).connect(gain.gain);
  lfo.start();

  bruit.connect(passeHaut).connect(passeBas).connect(gain).connect(master);
  bruit.start();

  sources.push(bruit, lfo);
  noeuds.push(passeHaut, passeBas, gain, lfoGain);

  return { ctx, master, noeuds, sources };
}

/** Démarre (ou remplace) l'ambiance. Un fondu évite toute cassure. */
export async function jouerAmbiance(ambiance: Ambiance, volume = 0.5): Promise<void> {
  if (typeof window === 'undefined') return;
  if (ambiance === ambianceActuelle && actif) {
    reglerVolume(volume);
    return;
  }

  await arreterAmbiance();
  ambianceActuelle = ambiance;
  if (ambiance === 'silence') return;

  type FenetreAudio = Window & { webkitAudioContext?: typeof AudioContext };
  const Constructeur =
    window.AudioContext ?? (window as FenetreAudio).webkitAudioContext;
  if (!Constructeur) return;

  const ctx = new Constructeur();
  if (ctx.state === 'suspended') await ctx.resume();

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  actif = ambiance === 'pluie' ? construirePluie(ctx, master) : construireSouffle(ctx, master);

  // Fondu d'entrée de trois secondes : le son s'installe sans se faire remarquer.
  master.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + 3);
}

export function reglerVolume(volume: number): void {
  if (!actif) return;
  const { ctx, master } = actif;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.linearRampToValueAtTime(
    Math.max(0, Math.min(1, volume)) * 0.5,
    ctx.currentTime + 0.4
  );
}

export async function arreterAmbiance(): Promise<void> {
  const courant = actif;
  ambianceActuelle = 'silence';
  if (!courant) return;
  actif = null;

  const { ctx, master, sources } = courant;
  try {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    await new Promise((resolve) => setTimeout(resolve, 1300));
    sources.forEach((source) => {
      try {
        source.stop();
      } catch {
        /* déjà arrêtée */
      }
    });
    await ctx.close();
  } catch {
    /* le contexte était déjà fermé */
  }
}

export function ambianceEnCours(): Ambiance {
  return ambianceActuelle;
}

// ─────────────────────────────────────────────────────────────
// Lecture à voix haute
// ─────────────────────────────────────────────────────────────

let voixFr: SpeechSynthesisVoice | null = null;

function choisirVoix(): SpeechSynthesisVoice | null {
  if (voixFr) return voixFr;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voix = window.speechSynthesis.getVoices();
  voixFr =
    voix.find((v) => v.lang.startsWith('fr') && /thomas|amelie|amélie|audrey/i.test(v.name)) ??
    voix.find((v) => v.lang.startsWith('fr')) ??
    null;
  return voixFr;
}

export function lectureDisponible(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Lit un texte à voix haute. Résout quand la lecture est terminée. */
/** La lecture de studio en cours, s'il y en a une. */
let lecteur: HTMLAudioElement | null = null;
/** Périme les requêtes de studio parties avant un arrêt. */
let jeton = 0;

/**
 * L'enregistrement déjà produit pour cette piste, s'il existe.
 *
 * Les versets du livret sont gravés une fois pour toutes par
 * `scripts/generer-voix.mjs` : les rejouer ne coûte rien et fonctionne hors
 * connexion. On les préfère donc toujours à un appel à la demande.
 */
async function urlDePiste(id?: string): Promise<string | null> {
  if (!id) return null;
  const manifeste = await chargerManifesteVoix();
  return manifeste?.pistes[id]?.url ?? null;
}

export function lireAVoixHaute(
  texte: string,
  options: {
    vitesse?: number;
    onFin?: () => void;
    onErreur?: () => void;
    /** Piste prégénérée à préférer, ex. `pisteId.verset('Ps 37:4')`. */
    piste?: string;
  } = {}
): boolean {
  const dit = preparerPourLaVoix(texte);
  arreterLecture();

  // La voix de studio d'abord : c'est celle du reste du parcours. On ne
  // l'attend pas pour répondre — l'appelant a besoin d'un booléen tout de
  // suite — et si elle échoue, le navigateur prend le relais.
  // Une piste gravée d'abord ; la voix de studio à la demande ensuite ; la
  // synthèse du navigateur en dernier recours.
  if (options.piste || voixStudioPossible()) {
    const mien = jeton;
    void urlDePiste(options.piste)
      .then((gravee) => gravee ?? (voixStudioPossible() ? urlVoixStudio(dit) : null))
      .then((url) => {
        if (mien !== jeton) return; // arrêté entre-temps
        if (!url) {
          if (voixStudioPossible()) voixStudioEcartee();
          lireAvecLeNavigateur(dit, options);
          return;
        }
        const audio = new Audio(url);
        audio.playbackRate = options.vitesse ?? 1;
        audio.onended = () => options.onFin?.();
        audio.onerror = () => {
          if (mien === jeton) lireAvecLeNavigateur(dit, options);
        };
        lecteur = audio;
        void audio.play().catch(() => {
          if (mien === jeton) lireAvecLeNavigateur(dit, options);
        });
      })
      .catch(() => {
        if (mien === jeton) lireAvecLeNavigateur(dit, options);
      });
    return true;
  }

  return lireAvecLeNavigateur(dit, options);
}

/** La synthèse du navigateur : le repli, jamais le premier choix. */
function lireAvecLeNavigateur(
  dit: string,
  options: { vitesse?: number; onFin?: () => void; onErreur?: () => void }
): boolean {
  if (!lectureDisponible()) {
    options.onErreur?.();
    return false;
  }
  window.speechSynthesis.cancel();

  // Les longues sections sont découpées : certains navigateurs coupent
  // brutalement au-delà de ~200 caractères.
  const morceaux = dit
    .replace(/\s+/g, ' ')
    .match(/[^.!?…]+[.!?…]*/g)
    ?.reduce<string[]>((acc, phrase) => {
      const dernier = acc[acc.length - 1];
      if (dernier && (dernier + phrase).length < 180) acc[acc.length - 1] = dernier + phrase;
      else acc.push(phrase);
      return acc;
    }, []) ?? [dit];

  morceaux.forEach((morceau, index) => {
    const enonce = new SpeechSynthesisUtterance(morceau.trim());
    enonce.lang = 'fr-FR';
    enonce.rate = options.vitesse ?? 0.92;
    enonce.pitch = 1;
    const voix = choisirVoix();
    if (voix) enonce.voice = voix;
    if (index === morceaux.length - 1 && options.onFin) enonce.onend = options.onFin;
    if (options.onErreur) enonce.onerror = options.onErreur;
    window.speechSynthesis.speak(enonce);
  });

  return true;
}

export function arreterLecture(): void {
  // Un jeton qui s'incrémente : toute lecture de studio encore en vol se
  // verra périmée à son arrivée et ne démarrera pas.
  jeton += 1;
  if (lecteur) {
    lecteur.pause();
    lecteur = null;
  }
  if (lectureDisponible()) window.speechSynthesis.cancel();
}
