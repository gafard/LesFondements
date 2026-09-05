import ambiancesImportees from '@/data/ambiances-importees.json';
import { preparerPourLaVoix } from './prononciation.mjs';
import { decouperTextePourStudio } from './decoupageVoix';
import { urlVoixStudio, voixStudioPossible } from './voixStudio';
import { chargerManifesteVoix } from './voix';
import { chargerManifesteVivienne, pisteVivienne } from './voixVivienne';

/** Ambiances synthétiques et musicales, chargées à la demande. */

export type Ambiance =
  | 'silence'
  | 'souffle'
  | 'pluie'
  | 'emotional-piano'
  | 'a-beautiful-story'
  | 'fly-like-a-bird'
  | 'lieu-saint-presence'
  | 'lieu-saint-intimite'
  | 'lieu-saint-contemplation'
  | 'selah-recueillement'
  | 'selah-priere'
  | 'selah-repos';

export const AMBIANCES: {
  valeur: Ambiance;
  label: string;
  description: string;
  type: 'silence' | 'synthese' | 'musique';
}[] = [
  { valeur: 'silence', label: 'Silence', description: 'Rien que votre lecture', type: 'silence' },
  { valeur: 'souffle', label: 'Souffle', description: 'Un fond chaud et respirant', type: 'synthese' },
  { valeur: 'pluie', label: 'Pluie', description: 'Pour couvrir le bruit autour', type: 'synthese' },
  {
    valeur: 'emotional-piano',
    label: 'Piano Émotionnel',
    description: 'Contemplatif, doux et profond',
    type: 'musique',
  },
  {
    valeur: 'a-beautiful-story',
    label: 'A Beautiful Story',
    description: 'Harmonie orchestrale paisible et inspirante',
    type: 'musique',
  },
  {
    valeur: 'fly-like-a-bird',
    label: 'Fly Like A Bird',
    description: 'Mélodie aérienne, lumineuse et chaleureuse',
    type: 'musique',
  },
  ...ambiancesImportees.map((piste) => ({
    valeur: piste.valeur as Ambiance, label: piste.label,
    description: piste.description, type: 'musique' as const,
  })),
];

const FICHIERS_MUSIQUE: Record<string, string> = {
  ...Object.fromEntries(ambiancesImportees.map((piste) => [piste.valeur, piste.fichier])),
  'emotional-piano': '/audio/ambiances/emotional-piano.mp3',
  'a-beautiful-story': '/audio/ambiances/a-beautiful-story.mp3',
  'fly-like-a-bird': '/audio/ambiances/fly-like-a-bird.mp3',
};

type Contexte = {
  ctx: AudioContext;
  master: GainNode;
  noeuds: AudioNode[];
  sources: AudioScheduledSourceNode[];
};

let actif: Contexte | null = null;
let audioMusiqueActif: HTMLAudioElement | null = null;
let ambianceActuelle: Ambiance = 'silence';
let revisionAmbiance = 0;

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

  // Un accord très grave et feutré : ré – la – ré.
  const fondamentales = [73.42, 110.0, 146.83];
  fondamentales.forEach((frequence, index) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequence;

    const gain = ctx.createGain();
    gain.gain.value = index === 0 ? 0.03 : 0.015;

    // Chaque voix respire à son propre rythme : le son ne « boucle » jamais.
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.045 + index * 0.017;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = index === 0 ? 0.015 : 0.008;
    lfo.connect(lfoGain).connect(gain.gain);

    osc.connect(gain).connect(master);
    osc.start();
    lfo.start();
    sources.push(osc, lfo);
    noeuds.push(gain, lfoGain);
  });

  // Un voile de souffle très discret
  const bruit = ctx.createBufferSource();
  bruit.buffer = tamponBruitRose(ctx, 6);
  bruit.loop = true;
  const passeBas = ctx.createBiquadFilter();
  passeBas.type = 'lowpass';
  passeBas.frequency.value = 350;
  const gainBruit = ctx.createGain();
  gainBruit.gain.value = 0.02;
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
  passeHaut.frequency.value = 600;

  const passeBas = ctx.createBiquadFilter();
  passeBas.type = 'lowpass';
  passeBas.frequency.value = 3800;

  const gain = ctx.createGain();
  gain.gain.value = 0.06;

  // Averse douce et lointaine
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.06;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.02;
  lfo.connect(lfoGain).connect(gain.gain);
  lfo.start();

  bruit.connect(passeHaut).connect(passeBas).connect(gain).connect(master);
  bruit.start();

  sources.push(bruit, lfo);
  noeuds.push(passeHaut, passeBas, gain, lfoGain);

  return { ctx, master, noeuds, sources };
}

let volumeDefini = 0.5;
let voixActive = false;
const sourcesDucking = new Set<symbol>();
const sourceDuckingManuel = Symbol('ducking-manuel');
let animationVolumeMusique: number | null = null;

function calculerVolumeMusique(): number {
  const facteurDucking = voixActive ? 0.22 : 1.0;
  return Math.max(0, Math.min(1, volumeDefini * 0.14 * facteurDucking));
}

function calculerVolumeSynthese(): number {
  const facteurDucking = voixActive ? 0.30 : 1.0;
  return Math.max(0, Math.min(1, volumeDefini * 0.25 * facteurDucking));
}

function animerVolumeMusique(dureeMs: number): void {
  const audio = audioMusiqueActif;
  if (!audio) return;
  const cible = calculerVolumeMusique();

  if (animationVolumeMusique !== null && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(animationVolumeMusique);
    animationVolumeMusique = null;
  }
  if (typeof requestAnimationFrame !== 'function' || dureeMs <= 0) {
    audio.volume = cible;
    return;
  }

  const depart = audio.volume;
  const commence = performance.now();
  const avancer = (maintenant: number) => {
    if (audio !== audioMusiqueActif) return;
    const progression = Math.min(1, (maintenant - commence) / dureeMs);
    // Courbe douce : aucune marche audible au début ni à la fin du fondu.
    const douceur = progression * progression * (3 - 2 * progression);
    audio.volume = depart + (cible - depart) * douceur;
    if (progression < 1) animationVolumeMusique = requestAnimationFrame(avancer);
    else animationVolumeMusique = null;
  };
  animationVolumeMusique = requestAnimationFrame(avancer);
}

function tenirGainAuTempsCourant(ctx: AudioContext, gain: AudioParam): void {
  if (typeof gain.cancelAndHoldAtTime === 'function') gain.cancelAndHoldAtTime(ctx.currentTime);
  else {
    gain.cancelScheduledValues(ctx.currentTime);
    gain.setValueAtTime(gain.value, ctx.currentTime);
  }
}

/**
 * Atténue l'ambiance tant qu'au moins une source vocale est active. Chaque
 * lecteur fournit son propre symbole : la fin d'une ancienne piste ne peut
 * donc pas remonter la musique sous une nouvelle voix.
 */
export function activerDuckingVoix(
  actif: boolean,
  source: symbol = sourceDuckingManuel
): void {
  if (actif) sourcesDucking.add(source);
  else sourcesDucking.delete(source);
  voixActive = sourcesDucking.size > 0;
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.ducking = voixActive ? 'actif' : 'repos';
  }
  if (audioMusiqueActif) {
    animerVolumeMusique(voixActive ? 300 : 1_200);
  }
  if (actifContextGlobal) {
    const { ctx, master } = actifContextGlobal;
    tenirGainAuTempsCourant(ctx, master.gain);
    master.gain.linearRampToValueAtTime(
      calculerVolumeSynthese(),
      ctx.currentTime + (voixActive ? 0.3 : 1.2)
    );
  }
}

let actifContextGlobal: Contexte | null = null;

/** Démarre (ou remplace) l'ambiance. Un fondu évite toute cassure. */
export async function jouerAmbiance(ambiance: Ambiance, volume = 0.5): Promise<void> {
  if (typeof window === 'undefined') return;
  volumeDefini = volume;
  if (ambiance === ambianceActuelle && (actif || audioMusiqueActif)) {
    reglerVolume(volume);
    return;
  }

  const arret = arreterAmbiance();
  const revision = revisionAmbiance;
  await arret;
  if (revision !== revisionAmbiance) return;
  ambianceActuelle = ambiance;
  if (ambiance === 'silence') return;

  // 1. Ambiance musicale par fichier MP3
  if (FICHIERS_MUSIQUE[ambiance]) {
    try {
      const audio = new Audio(FICHIERS_MUSIQUE[ambiance]);
      audio.loop = true;
      audio.volume = 0;
      audioMusiqueActif = audio;
      void audio.play().then(() => {
        if (audioMusiqueActif === audio) animerVolumeMusique(1_200);
      }).catch(() => {});
    } catch {
      /* impossible de lire l'audio */
    }
    return;
  }

  // 2. Ambiance de synthèse Web Audio API
  type FenetreAudio = Window & { webkitAudioContext?: typeof AudioContext };
  const Constructeur =
    window.AudioContext ?? (window as FenetreAudio).webkitAudioContext;
  if (!Constructeur) return;

  const ctx = new Constructeur();
  if (ctx.state === 'suspended') await ctx.resume();
  if (revision !== revisionAmbiance) { await ctx.close(); return; }

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  actif = ambiance === 'pluie' ? construirePluie(ctx, master) : construireSouffle(ctx, master);
  actifContextGlobal = actif;

  // Fondu d'entrée doux de trois secondes
  master.gain.linearRampToValueAtTime(calculerVolumeSynthese(), ctx.currentTime + 3);
}

export function reglerVolume(volume: number): void {
  volumeDefini = volume;
  if (audioMusiqueActif) {
    animerVolumeMusique(400);
  }
  if (!actif) return;
  const { ctx, master } = actif;
  tenirGainAuTempsCourant(ctx, master.gain);
  master.gain.linearRampToValueAtTime(
    calculerVolumeSynthese(),
    ctx.currentTime + 0.4
  );
}

export async function arreterAmbiance(): Promise<void> {
  revisionAmbiance += 1;
  // Arrêt de la musique MP3
  if (audioMusiqueActif) {
    const el = audioMusiqueActif;
    audioMusiqueActif = null;
    if (animationVolumeMusique !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(animationVolumeMusique);
      animationVolumeMusique = null;
    }
    try {
      el.pause();
      el.currentTime = 0;
    } catch {}
  }

  // Arrêt de la synthèse WebAudio
  const courant = actif;
  ambianceActuelle = 'silence';
  if (!courant) return;
  actif = null;
  if (actifContextGlobal === courant) actifContextGlobal = null;

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

export type GenreVoix = 'masculin' | 'feminin';

const CLE_GENRE_VOIX = 'lesfondements_genre_voix';

export function getGenreVoix(): GenreVoix {
  if (typeof window === 'undefined') return 'masculin';
  try {
    const stocke = localStorage.getItem(CLE_GENRE_VOIX);
    return stocke === 'feminin' ? 'feminin' : 'masculin';
  } catch {
    return 'masculin';
  }
}

export function setGenreVoix(genre: GenreVoix): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLE_GENRE_VOIX, genre);
  } catch {}
}

function choisirVoix(genre: GenreVoix = getGenreVoix()): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voix = window.speechSynthesis.getVoices();
  if (genre === 'feminin') {
    return (
      voix.find((v) => v.lang.startsWith('fr') && /vivienne|amelie|amélie|audrey|denise|julie|celine/i.test(v.name)) ??
      voix.find((v) => v.lang.startsWith('fr') && /female|femme/i.test(v.name)) ??
      voix.find((v) => v.lang.startsWith('fr')) ??
      null
    );
  }
  return (
    voix.find((v) => v.lang.startsWith('fr') && /henri|thomas|paul|nicolas|male|homme/i.test(v.name)) ??
    voix.find((v) => v.lang.startsWith('fr')) ??
    null
  );
}

export function lectureDisponible(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Lit un texte à voix haute. Résout quand la lecture est terminée. */
/** La lecture de studio en cours, s'il y en a une. */
let lecteur: HTMLAudioElement | null = null;
/** Périme les requêtes de studio parties avant un arrêt. */
let jeton = 0;
/** Source de ducking propre à la lecture générique en cours. */
let sourceDuckingLecture: symbol | null = null;

function relacherDuckingLecture(source: symbol): void {
  activerDuckingVoix(false, source);
  if (sourceDuckingLecture === source) sourceDuckingLecture = null;
}

/**
 * L'enregistrement déjà produit pour cette piste, s'il existe.
 */
async function urlDePiste(id?: string, genre: GenreVoix = getGenreVoix()): Promise<string | null> {
  if (!id) return null;
  if (genre === 'feminin') {
    return pisteVivienne(await chargerManifesteVivienne(), id);
  }
  const manifeste = await chargerManifesteVoix();
  return manifeste?.pistes[id]?.url ?? null;
}

type OptionsLecture = {
  vitesse?: number;
  genre?: GenreVoix;
  onDebut?: () => void;
  onFin?: () => void;
  onErreur?: () => void;
  /** Piste prégénérée à préférer, ex. `pisteId.verset('Ps 37:4')`. */
  piste?: string;
  /** Autorise la voix système lorsque le studio est indisponible. */
  repliNavigateur?: boolean;
};

function jouerPisteStudio(
  url: string,
  vitesse: number,
  mien: number,
  onPremierDebut?: () => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (mien !== jeton) {
      resolve();
      return;
    }

    const audio = new Audio(url);
    audio.playbackRate = vitesse;
    audio.volume = 1;
    lecteur = audio;

    audio.onplay = () => onPremierDebut?.();
    audio.onended = () => {
      if (lecteur === audio) lecteur = null;
      resolve();
    };
    audio.onerror = () => {
      if (lecteur === audio) lecteur = null;
      reject(new Error('Piste studio illisible'));
    };
    audio.onpause = () => {
      if (mien !== jeton) resolve();
    };

    void audio.play().catch(reject);
  });
}

export function lireAVoixHaute(
  texte: string,
  options: OptionsLecture = {}
): boolean {
  const genre = options.genre ?? getGenreVoix();
  const dit = preparerPourLaVoix(texte);
  arreterLecture();
  if (!dit.trim()) return false;

  // Atténuation automatique de la musique pendant que la voix parle
  const sourceDucking = Symbol('lecture-vocale');
  sourceDuckingLecture = sourceDucking;
  activerDuckingVoix(true, sourceDucking);

  const onFinOriginal = options.onFin;
  const onErreurOriginal = options.onErreur;

  const onFinWrap = () => {
    relacherDuckingLecture(sourceDucking);
    onFinOriginal?.();
  };

  const onErreurWrap = () => {
    relacherDuckingLecture(sourceDucking);
    onErreurOriginal?.();
  };

  const optionsEnveloppees: OptionsLecture = {
    ...options,
    genre,
    onFin: onFinWrap,
    onErreur: onErreurWrap,
  };

  const replierOuSignaler = () => {
    if (options.repliNavigateur !== false) {
      lireAvecLeNavigateur(dit, optionsEnveloppees);
    } else {
      onErreurWrap();
    }
  };

  // Une piste gravée d'abord ; sinon la voix de studio est produite par
  // morceaux naturels. Le morceau suivant se prépare pendant que le courant
  // joue : pas de voix robotique, ni de longue coupure entre deux phrases.
  if (options.piste || voixStudioPossible()) {
    const mien = jeton;
    void (async () => {
      let lectureCommencee = false;
      try {
        const gravee = await urlDePiste(options.piste, genre);
        if (mien !== jeton) return;

        if (gravee) {
          await jouerPisteStudio(gravee, options.vitesse ?? 1, mien, () => {
            lectureCommencee = true;
            optionsEnveloppees.onDebut?.();
          });
        } else {
          if (!voixStudioPossible()) {
            replierOuSignaler();
            return;
          }

          const morceaux = decouperTextePourStudio(dit);
          let prochaineUrl = urlVoixStudio(morceaux[0]);
          for (let indexMorceau = 0; indexMorceau < morceaux.length; indexMorceau += 1) {
            const url = await prochaineUrl;
            if (mien !== jeton) return;
            if (!url) throw new Error('Voix studio indisponible');

            prochaineUrl = indexMorceau + 1 < morceaux.length
              ? urlVoixStudio(morceaux[indexMorceau + 1])
              : Promise.resolve(null);
            await jouerPisteStudio(url, options.vitesse ?? 1, mien, () => {
              if (lectureCommencee) return;
              lectureCommencee = true;
              optionsEnveloppees.onDebut?.();
            });
          }
        }

        if (mien === jeton) optionsEnveloppees.onFin?.();
      } catch {
        if (mien !== jeton) return;
        // Ne jamais recommencer tout le texte avec une autre voix après
        // qu'une partie a déjà été entendue.
        if (lectureCommencee) onErreurWrap();
        else replierOuSignaler();
      }
    })();
    return true;
  }

  if (options.repliNavigateur !== false) {
    return lireAvecLeNavigateur(dit, optionsEnveloppees);
  }
  onErreurWrap();
  return false;
}

/** La synthèse du navigateur : le repli, jamais le premier choix. */
function lireAvecLeNavigateur(
  dit: string,
  options: {
    vitesse?: number;
    genre?: GenreVoix;
    onDebut?: () => void;
    onFin?: () => void;
    onErreur?: () => void;
  }
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
    enonce.pitch = options.genre === 'feminin' ? 1.05 : 1;
    enonce.volume = 1.0;
    const voix = choisirVoix(options.genre);
    if (voix) enonce.voice = voix;
    if (index === 0 && options.onDebut) enonce.onstart = options.onDebut;
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
  if (sourceDuckingLecture) relacherDuckingLecture(sourceDuckingLecture);
  if (lecteur) {
    lecteur.pause();
    lecteur = null;
  }
  if (lectureDisponible()) window.speechSynthesis.cancel();
}
