'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Heart,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Music,
} from 'lucide-react';
import { lectureDisponible, lireAVoixHaute, arreterLecture } from '@/lib/ambiance';
import TexteAvecReferences from '@/components/ReferenceCliquable';

export interface ParagrapheLettre {
  texte: string;
  reference: string;
}

export const LETTRE_DU_PERE: ParagrapheLettre[] = [
  { texte: "Mon Enfant, Je regarde jusqu'au fond de ton cœur et je sais tout de toi.", reference: "Psaume 139:1" },
  { texte: "Je sais quand tu t'assieds et quand tu te lèves.", reference: "Psaume 139:2" },
  { texte: "Je te vois quand tu marches et quand tu te couches, je connais parfaitement toutes tes voies.", reference: "Psaume 139:3" },
  { texte: "Même les cheveux de ta tête sont tous comptés.", reference: "Matthieu 10:29-31" },
  { texte: "Tu as été créé à mon image.", reference: "Genèse 1:27" },
  { texte: "En moi tu as la vie, le mouvement et l'être.", reference: "Actes 17:28" },
  { texte: "Je te connaissais même avant que tu sois conçu dans le ventre de ta mère.", reference: "Jérémie 1:4-5" },
  { texte: "Je t'ai choisi dès avant la création du monde.", reference: "Éphésiens 1:11-12" },
  { texte: "Tu n'étais pas un accident, tu n'es pas une erreur.", reference: "Psaume 139:15" },
  { texte: "Tous les jours de ta vie étaient inscrits dans mon livre avant qu'aucun d'eux n'existe.", reference: "Psaume 139:16" },
  { texte: "J'ai déterminé la durée de tes temps et les limites de ta demeure.", reference: "Actes 17:26" },
  { texte: "Tu es une créature si merveilleuse.", reference: "Psaume 139:14" },
  { texte: "C'est moi qui t'ai tissé dans le secret du sein maternel.", reference: "Psaume 139:13" },
  { texte: "C'est moi qui t'ai accueilli au jour de ta naissance.", reference: "Psaume 71:6" },
  { texte: "Mon image a souvent été défigurée par ceux qui ne me connaissent pas.", reference: "Jean 8:41-44" },
  { texte: "Je ne suis ni distant ni en colère, car je suis l'expression parfaite de l'amour.", reference: "1 Jean 4:16" },
  { texte: "Et mon plus grand désir est de déverser cet amour de Père sur toi.", reference: "1 Jean 3:1" },
  { texte: "Parce que tu es mon enfant bien-aimé, et que je suis ton Père.", reference: "1 Jean 3:1" },
  { texte: "Je t'offre infiniment plus que ton père terrestre n'aurait jamais pu te donner.", reference: "Matthieu 7:11" },
  { texte: "Car je suis le Père parfait.", reference: "Matthieu 5:48" },
  { texte: "Tout don parfait que tu reçois découle de ma main bienveillante.", reference: "Jacques 1:17" },
  { texte: "Je suis celui qui pourvoit fidèlement à tous tes besoins.", reference: "Matthieu 6:31-33" },
  { texte: "Mon projet pour ton avenir a toujours été rempli d'espérance.", reference: "Jérémie 29:11" },
  { texte: "Parce que je t'aime d'un amour éternel et inconditionnel.", reference: "Jérémie 31:3" },
  { texte: "Mes pensées d'amour pour toi sont plus nombreuses que les grains de sable au bord des mers.", reference: "Psaume 139:17-18" },
  { texte: "Je pousse des cris de joie et je me réjouis à ton sujet avec allégresse.", reference: "Sophonie 3:17" },
  { texte: "Je ne me lasserai jamais de te faire du bien.", reference: "Jérémie 32:40" },
  { texte: "Tu es pour moi un trésor précieux entre tous.", reference: "Exode 19:5" },
  { texte: "De tout mon cœur et de toute mon âme, je désire affermir tes pas.", reference: "Jérémie 32:41" },
  { texte: "Je veux te révéler des choses grandes et secrètes que tu ne connais pas.", reference: "Jérémie 33:3" },
  { texte: "Si tu me cherches de tout ton cœur, tu me trouveras.", reference: "Deutéronome 4:29" },
  { texte: "Fais de moi tes délices, et je te donnerai ce que ton cœur désire le plus.", reference: "Psaume 37:4" },
  { texte: "Car c'est moi-même qui ai déposé ces nobles désirs en toi.", reference: "Philippiens 2:13" },
  { texte: "Je suis capable de faire infiniment au-delà de tout ce que tu peux demander ou même imaginer.", reference: "Éphésiens 3:20" },
  { texte: "Je suis ton réconfort et ton encouragement le plus fidèle.", reference: "2 Thessaloniciens 2:16-17" },
  { texte: "Je suis le Père qui essuie tes larmes et te console dans toutes tes détresses.", reference: "2 Corinthiens 1:3-4" },
  { texte: "Quand ton cœur est brisé ou accablé, je me tiens tout près de toi.", reference: "Psaume 34:18" },
  { texte: "Comme un berger porte son agneau sur sa poitrine, je te serre tout près de mon cœur.", reference: "Ésaïe 40:11" },
  { texte: "Un jour, j'essuierai toute larme de tes yeux.", reference: "Apocalypse 21:3-4" },
  { texte: "Et j'emporterai pour toujours toute la douleur, le deuil et les peines de cette terre.", reference: "Apocalypse 21:4" },
  { texte: "Je suis ton Père, et je t'aime du même amour infini dont j'aime mon propre Fils, Jésus.", reference: "Jean 17:23" },
  { texte: "Car en Jésus, tout mon amour pour toi est pleinement manifesté.", reference: "Jean 17:26" },
  { texte: "Il est le reflet éclatant et l'empreinte exacte de mon être.", reference: "Hébreux 1:3" },
  { texte: "Il est venu te prouver que je suis résolument POUR toi, et non contre toi.", reference: "Romains 8:31" },
  { texte: "Et te dire que je ne retiens plus aucun de tes péchés contre toi.", reference: "2 Corinthiens 5:18-19" },
  { texte: "Jésus a donné sa vie pour que toi et moi soyons réconciliés à tout jamais.", reference: "2 Corinthiens 5:18-19" },
  { texte: "Sa croix est la preuve suprême et sans appel de mon amour pour toi.", reference: "1 Jean 4:10" },
  { texte: "J'ai tout donné, ce que j'avais de plus cher, pour gagner ton cœur et ton amour.", reference: "Romains 8:32" },
  { texte: "Si tu accueilles mon Fils Jésus, c'est moi-même que tu accueilles.", reference: "1 Jean 2:23" },
  { texte: "Et rien, absolument rien, ne pourra jamais te séparer de mon amour.", reference: "Romains 8:38-39" },
  { texte: "Reviens à la maison : tout le ciel célèbre une fête immense pour ton retour.", reference: "Luc 15:7" },
  { texte: "J'ai toujours été Père, et je serai éternellement ton Père.", reference: "Éphésiens 3:14-15" },
  { texte: "Ma question pour toi aujourd'hui est… Veux-tu être mon enfant ?", reference: "Jean 1:12-13" },
  { texte: "Je t'attends les bras ouverts.", reference: "Luc 15:11-32" },
];

export default function LettreDuPere() {
  const [ouverte, setOuverte] = useState(false);
  const [enveloppeOuverte, setEnveloppeOuverte] = useState(false);
  const [ligneActive, setLigneActive] = useState<number>(0);
  const [enLecture, setEnLecture] = useState(false);
  const [musiqueActive, setMusiqueActive] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const musiqueAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerLectureRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contenuRef = useRef<HTMLDivElement>(null);
  // Référence stable pour la récursion du minuteur de lecture.
  const lireLigneRef = useRef<(index: number) => void>(() => {});

  // Initialisation du piano d'ambiance en boucle et de la voix
  useEffect(() => {
    const musique = new Audio('/audio/lettre-du-pere-piano.mp3');
    musique.loop = true;
    musique.volume = 0.32;
    musiqueAudioRef.current = musique;

    audioRef.current = new Audio();
    return () => {
      musique.pause();
      musique.currentTime = 0;
      audioRef.current?.pause();
      arreterLecture();
      if (timerLectureRef.current) window.clearTimeout(timerLectureRef.current);
    };
  }, []);

  // Déroulement de la lecture vocale pas à pas (ElevenLabs en priorité, synthèse en secours)
  const lireLigne = useCallback((index: number) => {
    if (index >= LETTRE_DU_PERE.length) {
      setEnLecture(false);
      setLigneActive(0);
      return;
    }

    setLigneActive(index);
    const item = LETTRE_DU_PERE[index];

    // Scroll doux vers la phrase lue
    const el = document.getElementById(`ligne-lettre-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (timerLectureRef.current) window.clearTimeout(timerLectureRef.current);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = `/voix/eleven/lettre.p${index}.mp3`;
      audioRef.current.onended = () => {
        timerLectureRef.current = window.setTimeout(() => {
          lireLigneRef.current(index + 1);
        }, 550);
      };
      audioRef.current.onerror = () => {
        if (lectureDisponible()) {
          lireAVoixHaute(item.texte);
          const dureeMs = Math.max(2800, item.texte.length * 72 + 1200);
          timerLectureRef.current = window.setTimeout(() => {
            lireLigneRef.current(index + 1);
          }, dureeMs);
        }
      };
      audioRef.current.play().catch(() => {
        if (lectureDisponible()) {
          lireAVoixHaute(item.texte);
          const dureeMs = Math.max(2800, item.texte.length * 72 + 1200);
          timerLectureRef.current = window.setTimeout(() => {
            lireLigneRef.current(index + 1);
          }, dureeMs);
        }
      });
    } else if (lectureDisponible()) {
      lireAVoixHaute(item.texte);
      const dureeMs = Math.max(2800, item.texte.length * 72 + 1200);
      timerLectureRef.current = window.setTimeout(() => {
        lireLigneRef.current(index + 1);
      }, dureeMs);
    }
  }, []);

  useEffect(() => {
    lireLigneRef.current = lireLigne;
  }, [lireLigne]);

  // Déclencher l'ouverture de l'enveloppe
  const ouvrirLettre = () => {
    setEnveloppeOuverte(true);

    if (musiqueActive && musiqueAudioRef.current) {
      musiqueAudioRef.current.currentTime = 0;
      void musiqueAudioRef.current.play().catch(() => {});
    }

    // Après l'animation de dépliage du rabat 3D (~700ms), la lettre s'ouvre
    setTimeout(() => {
      setOuverte(true);
      setEnLecture(true);
      lireLigne(0);
    }, 750);
  };

  const basculerLecture = () => {
    if (enLecture) {
      audioRef.current?.pause();
      arreterLecture();
      if (timerLectureRef.current) window.clearTimeout(timerLectureRef.current);
      setEnLecture(false);
    } else {
      setEnLecture(true);
      lireLigne(ligneActive);
    }
  };

  const reinitialiser = () => {
    audioRef.current?.pause();
    arreterLecture();
    if (timerLectureRef.current) window.clearTimeout(timerLectureRef.current);
    setLigneActive(0);
    setEnLecture(true);
    lireLigne(0);
  };

  const basculerMusique = () => {
    if (musiqueActive) {
      musiqueAudioRef.current?.pause();
      setMusiqueActive(false);
    } else {
      void musiqueAudioRef.current?.play().catch(() => {});
      setMusiqueActive(true);
    }
  };

  const fermer = () => {
    audioRef.current?.pause();
    arreterLecture();
    if (timerLectureRef.current) window.clearTimeout(timerLectureRef.current);
    musiqueAudioRef.current?.pause();
    if (musiqueAudioRef.current) musiqueAudioRef.current.currentTime = 0;
    setEnLecture(false);
    setOuverte(false);
    setEnveloppeOuverte(false);
    setFullscreen(false);
  };

  return (
    <div className="relative my-8">
      {/* ─── SCÈNE 1 : L'ENVELOPPE FERMÉE AVEC CACHET DE CIRE ─── */}
      {!ouverte && (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="relative group cursor-pointer w-full flex justify-center" onClick={ouvrirLettre}>
            {/* L'enveloppe 3D */}
            <div
              className={`relative w-full max-w-[340px] sm:max-w-[440px] h-[230px] sm:h-[260px] bg-[#e8dac1] rounded-3xl shadow-2xl border border-[#c9bda6] transition-transform duration-700 ease-out ${
                enveloppeOuverte ? 'scale-105' : 'group-hover:-translate-y-2 group-hover:shadow-3xl'
              }`}
              style={{ perspective: '1000px' }}
            >
              {/* Texture papier vintage de l'enveloppe */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#f5ede0] via-[#e8dac1] to-[#d8c5a8] rounded-3xl opacity-90" />

              {/* Rabat triangulaire supérieur qui s'ouvre en 3D */}
              <div
                className={`absolute top-0 left-0 right-0 h-[120px] sm:h-[135px] origin-top transition-transform duration-700 ease-in-out z-20 ${
                  enveloppeOuverte ? '-rotate-x-180 shadow-md' : ''
                }`}
                style={{
                  transformStyle: 'preserve-3d',
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  backgroundColor: '#deb887',
                  backgroundImage: 'linear-gradient(180deg, #ecd5b3 0%, #caa477 100%)',
                }}
              />

              {/* Lignes diagonales de l'enveloppe (plis du bas) */}
              <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                  clipPath: 'polygon(0 100%, 50% 50%, 100% 100%)',
                  backgroundColor: '#d8c5a8',
                  borderTop: '1px solid rgba(11,29,56,0.08)',
                }}
              />
              <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                  clipPath: 'polygon(0 0, 0 100%, 50% 50%)',
                  backgroundColor: '#e1d0b5',
                  borderRight: '1px solid rgba(11,29,56,0.06)',
                }}
              />
              <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                  clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)',
                  backgroundColor: '#ddccb1',
                  borderLeft: '1px solid rgba(11,29,56,0.06)',
                }}
              />

              {/* La lettre qui commence à glisser vers le haut */}
              <div
                className={`absolute left-6 right-6 bottom-4 h-[200px] bg-[#fffdf7] rounded-xl shadow-md border border-[#e5dcce] transition-all duration-700 z-15 flex flex-col items-center justify-center p-4 ${
                  enveloppeOuverte ? '-translate-y-24 opacity-100' : 'translate-y-0 opacity-0'
                }`}
              >
                <p className="manuscrit text-3xl font-bold text-or-700">Mon Enfant…</p>
                <p className="font-serif text-xs italic text-encre-500 mt-1">
                  Je regarde jusqu&apos;au fond de ton cœur…
                </p>
              </div>

              {/* Le Cachet de Cire Doré / Rouge Royal au centre */}
              <div
                className={`absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-500 ${
                  enveloppeOuverte ? 'scale-0 opacity-0' : 'group-hover:scale-110'
                }`}
              >
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br from-[#9b1c1c] via-[#771111] to-[#550808] flex items-center justify-center shadow-2xl border-2 border-[#b92b27]/80 ring-4 ring-[#771111]/30">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-amber-300/40 flex flex-col items-center justify-center text-amber-200">
                    <Heart className="w-6 h-6 sm:w-7 sm:h-7 fill-amber-300/30 text-amber-200" />
                  </div>
                </div>
              </div>

              {/* Inscription calligraphique sur l'enveloppe */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-25 text-center pointer-events-none w-full px-4">
                <p className="manuscrit text-2xl sm:text-3xl font-bold text-encre-900 tracking-wide">
                  Pour Mon Enfant Bien-Aimé
                </p>
                <p className="text-2xs font-semibold text-or-700/90 uppercase tracking-[0.2em] mt-0.5">
                  De la part de ton Père Céleste
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={ouvrirLettre}
              className="bouton-or inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-sm font-bold shadow-lg transform transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4 text-amber-950" />
              Briser le sceau & écouter la Lettre
            </button>
            <p className="mt-2 text-2xs text-encre-500">
              Animation d&apos;ouverture, nappe céleste et lecture audio phrase par phrase
            </p>
          </div>
        </div>
      )}

      {/* ─── SCÈNE 2 : LA LETTRE DÉPLIÉE & LECTURE IMMERSIVE ─── */}
      {ouverte && (
        <div
          className={`${
            fullscreen
              ? 'fixed inset-0 z-[80] bg-black/80 backdrop-blur-md p-4 sm:p-8 flex items-center justify-center overflow-y-auto'
              : 'relative'
          } animate-fade-in`}
        >
          <div
            className={`feuille feuille-dechiree relative mx-auto w-full ${
              fullscreen ? 'max-w-4xl max-h-[90vh]' : 'max-w-3xl'
            } rounded-4xl border-2 border-or-300/60 bg-[#fffdf8] p-6 sm:p-12 shadow-2xl overflow-hidden flex flex-col`}
          >
            {/* Rubans adhésifs aux 4 coins pour l'effet manuscrit sur la table */}
            <span className="ruban -top-3 left-10 -rotate-2 rounded-[2px]" />
            <span className="ruban -top-3 right-10 rotate-3 rounded-[2px]" />

            {/* Barre de contrôle supérieure */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-parchemin-300 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-or-100 text-or-700 shadow-2xs">
                  <Heart className="h-5 w-5 fill-or-400 text-or-700" />
                </span>
                <div>
                  <h3 className="manuscrit text-3xl font-bold text-encre-950 leading-none">
                    La Lettre d&apos;Amour du Père
                  </h3>
                  <p className="font-serif text-2xs italic text-encre-500 mt-1">
                    Écoutez ces paroles de vérité pour votre vie
                  </p>
                </div>
              </div>

              {/* Commandes audio interactives */}
              <div className="flex items-center gap-2">
                <button
                  onClick={basculerLecture}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all shadow-xs ${
                    enLecture
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bouton-or'
                  }`}
                  title={enLecture ? "Mettre en pause" : "Continuer la lecture"}
                >
                  {enLecture ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{enLecture ? 'Pause' : 'Écouter'}</span>
                </button>

                <button
                  onClick={reinitialiser}
                  className="rounded-full p-2 text-encre-600 hover:bg-parchemin-200 transition-colors"
                  title="Réécouter du début"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={basculerMusique}
                  className={`rounded-full p-2 transition-colors ${
                    musiqueActive
                      ? 'text-or-700 bg-or-100 hover:bg-or-200'
                      : 'text-encre-400 hover:bg-parchemin-200'
                  }`}
                  title={musiqueActive ? "Couper la musique céleste" : "Activer la musique céleste"}
                >
                  {musiqueActive ? <Music className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setFullscreen(!fullscreen)}
                  className="rounded-full p-2 text-encre-600 hover:bg-parchemin-200 transition-colors hidden sm:block"
                  title={fullscreen ? "Réduire" : "Plein écran"}
                >
                  {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={fermer}
                  className="rounded-full p-2 text-encre-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Replier la lettre"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corps de la Lettre avec surlignage et références bibliques cliquables */}
            <div
              ref={contenuRef}
              className={`space-y-4 overflow-y-auto pr-2 ${
                fullscreen ? 'max-h-[65vh]' : 'max-h-[520px]'
              }`}
            >
              {LETTRE_DU_PERE.map((paragraphe, idx) => {
                const estActif = enLecture && ligneActive === idx;
                return (
                  <div
                    key={idx}
                    id={`ligne-lettre-${idx}`}
                    onClick={() => {
                      setLigneActive(idx);
                      if (enLecture) lireLigne(idx);
                    }}
                    className={`group cursor-pointer rounded-2xl p-3.5 sm:p-4 transition-all duration-500 ${
                      estActif
                        ? 'bg-or-100/90 shadow-sm border-l-4 border-or-600 translate-x-1 scale-[1.01]'
                        : 'hover:bg-parchemin-100/70 border-l-4 border-transparent'
                    }`}
                  >
                    <p
                      className={`manuscrit text-xl sm:text-2xl leading-relaxed transition-colors ${
                        estActif ? 'text-encre-950 font-bold' : 'text-encre-800'
                      }`}
                    >
                      « {paragraphe.texte} »
                    </p>
                    <div className="mt-1 flex items-center justify-end">
                      <span className="font-serif text-2xs font-bold text-or-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-or-200">
                        <TexteAvecReferences>{paragraphe.reference}</TexteAvecReferences>
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Signature finale du Père */}
              <div className="pt-8 pb-4 text-center border-t border-parchemin-300 mt-8">
                <p className="manuscrit text-3xl sm:text-4xl font-bold text-or-800">
                  Ton Père qui t&apos;aime, Dieu Tout-Puissant.
                </p>
                <p className="mt-3 font-serif text-2xs italic text-encre-400 max-w-md mx-auto">
                  Source : Father&apos;s Love Letter • Father Heart Communications Copyright 1999-2008 • Traduction C. Buffet
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
