'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { 
  BookOpen, Brain, MousePointerClick, 
  Flame, BookA, Check, ArrowRight, ArrowLeft, Play, Pause, 
  Mic, MicOff, Download, Volume2, Copy,
  LockKeyhole, Clock3, NotebookPen, Quote, CheckCircle2, Feather, Sparkles, VolumeX
} from 'lucide-react';
import { saveAnswer, addJournalEntry } from '@/lib/firestore';
import { 
  jouerAmbiance, arreterAmbiance, lireAVoixHaute, arreterLecture,
  getGenreVoix, setGenreVoix, type GenreVoix, AMBIANCES 
} from '@/lib/ambiance';
import { VERSETS_CONNUS, normaliserReference } from '@/data/versets';
import TexteAvecReferences from '@/components/ReferenceCliquable';
import { chargerManifesteVoix, type Manifeste } from '@/lib/voix';
import { Pastille, Etincelle } from '@/components/decor';

interface Props {
  ficheId: number;
  sectionIndex: number;
  ficheData: any;
  sectionBlocs: Array<{ type: string; texte?: string }>;
  meditationQuestions: Array<{
    id: string;
    fonction?: string;
    question: string;
  }>;
  versets?: string[];
  onComplete: (data: any) => void;
}

const FONCTION_BADGES: Record<string, { label: string; border: string; bg: string; text: string }> = {
  'contempler': { label: '1. Contempler Dieu', border: 'border-or-400/40', bg: 'bg-or-500/15', text: 'text-or-300' },
  'comprendre': { label: '2. Comprendre Sa Vérité', border: 'border-sky-400/40', bg: 'bg-sky-500/15', text: 'text-sky-300' },
  'recevoir': { label: '3. Recevoir dans mon Cœur', border: 'border-emerald-400/40', bg: 'bg-emerald-500/15', text: 'text-emerald-300' },
  'etre-transforme': { label: '4. Être Transformé', border: 'border-rose-400/40', bg: 'bg-rose-500/15', text: 'text-rose-300' },
  'vivre': { label: '5. Vivre la Parole', border: 'border-purple-400/40', bg: 'bg-purple-500/15', text: 'text-purple-300' },
  'observer': { label: '1. Contempler Dieu', border: 'border-or-400/40', bg: 'bg-or-500/15', text: 'text-or-300' },
  'decouvrir-dieu': { label: '2. Découvrir Sa Vérité', border: 'border-sky-400/40', bg: 'bg-sky-500/15', text: 'text-sky-300' },
  'se-laisser-eclairer': { label: '3. Miroir de vérité', border: 'border-rose-400/40', bg: 'bg-rose-500/15', text: 'text-rose-300' },
  'repondre': { label: '5. Vivre la Parole', border: 'border-purple-400/40', bg: 'bg-purple-500/15', text: 'text-purple-300' },
};

export default function TempsApart({ 
  ficheId, 
  sectionIndex, 
  ficheData, 
  sectionBlocs = [], 
  meditationQuestions, 
  versets = [],
  onComplete 
}: Props) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [step6Answer, setStep6Answer] = useState('');
  
  // Audio & Voix
  const [isReadingAudio, setIsReadingAudio] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [genreVoix, setGenreVoixState] = useState<GenreVoix>('feminin');
  const [musiqueActive, setMusiqueActive] = useState(true);

  // Verset & Niveaux
  const [selectedVersetIndex, setSelectedVersetIndex] = useState(0);
  const [memoriseLevel, setMemoriseLevel] = useState<1 | 2 | 3 | 4>(1);
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [transcriptMic, setTranscriptMic] = useState('');
  const [copiedVerset, setCopiedVerset] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setGenreVoixState(getGenreVoix());
    // Démarrer la nappe musicale contemplative dès l'entrée dans l'immersion
    void jouerAmbiance('emotional-piano', 0.28);
    return () => {
      void arreterAmbiance();
      arreterLecture();
    };
  }, []);

  const currentVersetRef = versets[selectedVersetIndex] || versets[0] || 'Ps 46:11';
  const currentVersetTexte = useMemo(() => {
    const norm = normaliserReference(currentVersetRef);
    return VERSETS_CONNUS[norm] || VERSETS_CONNUS[currentVersetRef] || "Arrêtez, et sachez que je suis Dieu : Je domine sur les nations, je domine sur la terre.";
  }, [currentVersetRef]);

  // Playlist continue de la section
  const playlistSection = useMemo(() => {
    const list: Array<{ id: string; texte: string }> = [];
    const secTitre = ficheData?.sections?.[sectionIndex]?.titre;
    if (secTitre) {
      list.push({
        id: `f${ficheId}.s${sectionIndex}`,
        texte: secTitre,
      });
    }
    sectionBlocs.forEach((b, idx) => {
      if (!b.texte?.trim()) return;
      list.push({
        id: `f${ficheId}.s${sectionIndex}.b${idx}`,
        texte: b.texte,
      });
    });
    return list;
  }, [ficheId, sectionIndex, ficheData, sectionBlocs]);

  // Lecture continue bloc par bloc avec ducking automatique
  const jouerBlocIndex = (index: number) => {
    if (index >= playlistSection.length) {
      setIsReadingAudio(false);
      setCurrentAudioIndex(0);
      return;
    }
    setCurrentAudioIndex(index);
    const item = playlistSection[index];
    lireAVoixHaute(item.texte, {
      piste: item.id,
      genre: genreVoix,
      onFin: () => {
        jouerBlocIndex(index + 1);
      },
      onErreur: () => {
        jouerBlocIndex(index + 1);
      },
    });
  };

  const toggleAudioLecture = () => {
    if (isReadingAudio) {
      arreterLecture();
      setIsReadingAudio(false);
    } else {
      setIsReadingAudio(true);
      jouerBlocIndex(0);
    }
  };

  const toggleMusique = () => {
    if (musiqueActive) {
      void arreterAmbiance();
      setMusiqueActive(false);
    } else {
      void jouerAmbiance('emotional-piano', 0.28);
      setMusiqueActive(true);
    }
  };

  const changerVoix = (nouveauGenre: GenreVoix) => {
    setGenreVoixState(nouveauGenre);
    setGenreVoix(nouveauGenre);
    if (isReadingAudio) {
      arreterLecture();
      setIsReadingAudio(false);
    }
  };

  // Minuteur doux pour la prière
  useEffect(() => {
    if (step === 4) setTimerRunning(true);
    else setTimerRunning(false);
  }, [step]);

  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const handleNext = () => setStep(s => Math.min(6, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  // Mots à trous (Niveau 2)
  const wordsWithGaps = useMemo(() => {
    const words = currentVersetTexte.split(' ');
    return words.map((w, idx) => ({
      word: w,
      isGap: idx % 3 === 1 && w.length > 2,
    }));
  }, [currentVersetTexte]);

  // Initiales (Niveau 3)
  const firstLettersText = useMemo(() => {
    return currentVersetTexte
      .split(' ')
      .map(w => (w.length <= 1 ? w : w[0] + '...'))
      .join(' ');
  }, [currentVersetTexte]);

  // Récitation Micro (Niveau 4)
  const toggleMicRecitation = () => {
    if (isListeningMic) {
      setIsListeningMic(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur. Vous pouvez réciter à voix haute librement.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListeningMic(true);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscriptMic(text);
        setIsListeningMic(false);
      };
      recognition.onerror = () => setIsListeningMic(false);
      recognition.onend = () => setIsListeningMic(false);

      recognition.start();
    } catch {
      setIsListeningMic(false);
    }
  };

  // Téléchargement Fond d'écran 1080x1920
  const genererFondEcran = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 0, 1920);
    grad.addColorStop(0, '#0c0a08');
    grad.addColorStop(0.5, '#1e160e');
    grad.addColorStop(1, '#090806');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    const radial = ctx.createRadialGradient(540, 960, 50, 540, 960, 650);
    radial.addColorStop(0, 'rgba(217, 119, 6, 0.22)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '6px';
    ctx.fillText('LES FONDEMENTS • UN TEMPS À PART', 540, 500);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '64px sans-serif';
    ctx.fillText('✝', 540, 620);

    ctx.fillStyle = '#fdf8eb';
    ctx.font = 'italic 52px Georgia, serif';
    ctx.textAlign = 'center';

    const words = `« ${currentVersetTexte} »`.split(' ');
    let line = '';
    let y = 800;
    const lineHeight = 80;
    const maxWidth = 880;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, 540, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 540, y);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText(currentVersetRef, 540, y + 120);

    const link = document.createElement('a');
    link.download = `verset-${currentVersetRef.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleFinish = async () => {
    const finalData = {
      answers,
      selectedCards,
      step6Answer,
      versetChoisi: currentVersetRef,
      date: new Date().toISOString()
    };
    if (user) {
      try {
        await saveAnswer(user.uid, ficheId, `temps-apart:${sectionIndex}`, JSON.stringify(finalData));

        const recapPriere = selectedCards
          .map(k => answers[k]?.trim())
          .filter(Boolean)
          .map(t => `• ${t}`)
          .join('\n');

        const entreesJournal = [
          `📖 **Fiche ${ficheId} : ${ficheData?.titre || ''}** — Étape ${sectionIndex + 1} : ${ficheData?.sections?.[sectionIndex]?.titre || ''}`,
          `✨ **Parole contemplée & gardée :** « ${currentVersetTexte} » (${currentVersetRef})`,
          recapPriere ? `🕊️ **Ce que j'ai déposé devant Dieu :**\n${recapPriere}` : null,
          step6Answer.trim() ? `👣 **Ma réponse de foi & de vie :**\n${step6Answer.trim()}` : null,
        ].filter(Boolean).join('\n\n');

        await addJournalEntry(user.uid, entreesJournal);
      } catch (e) {
        console.error("Erreur de sauvegarde", e);
      }
    }
    onComplete(finalData);
  };

  return (
    <div className="nuit nuit-grain min-h-screen text-parchemin-100 flex flex-col safe-area-inset overflow-x-hidden pb-16">
      
      {/* ══ Barre Supérieure Immersive ══ */}
      <header className="p-4 flex items-center justify-between z-20 sticky top-0 bg-encre-950/80 backdrop-blur-md border-b border-or-500/15">
        <button 
          onClick={handlePrev} 
          className={`p-2 rounded-full border border-or-500/20 bg-encre-900/60 text-or-200 hover:bg-encre-800 transition-opacity ${
            step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          aria-label="Étape précédente"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* 6 Repères Sacrés */}
        <div className="flex items-center gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step 
                  ? 'w-7 bg-gradient-to-r from-or-400 to-or-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]' 
                  : i < step 
                    ? 'w-2 bg-or-500/70' 
                    : 'w-2 bg-white/15'
              }`} 
            />
          ))}
        </div>

        {/* Contrôles Ambiance / Son */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMusique}
            className={`p-2 rounded-full border text-xs font-bold transition ${
              musiqueActive 
                ? 'bg-or-500/15 border-or-400/40 text-or-300' 
                : 'bg-white/5 border-white/10 text-white/40'
            }`}
            title={musiqueActive ? "Couper la musique" : "Activer la musique"}
          >
            {musiqueActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <span className="px-3 py-1 text-2xs font-bold tracking-wider uppercase rounded-full bg-or-500/15 border border-or-400/30 text-or-300">
            {step} / 6
          </span>
        </div>
      </header>

      {/* ══ Conteneur Central du Sanctuaire ══ */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col max-w-2xl mx-auto w-full transition-all duration-500 relative">
        
        {/* ── ÉTAPE 1 : CONTEMPLER & ÉCOUTER (Immersion Textuelle & Vocale) ── */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6">
            <article className="relative rounded-3xl p-6 sm:p-9 shadow-2xl border border-or-500/25 bg-encre-900/60 backdrop-blur-xl">
              
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-or-500/20 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] bg-or-500/15 text-or-300 border border-or-400/30">
                    <Sparkles className="w-3.5 h-3.5" /> Fiche {ficheId} • Étape {sectionIndex + 1}
                  </span>
                  <h2 className="mt-2.5 font-serif text-2xl sm:text-3xl font-bold titre-or">
                    {ficheData?.sections?.[sectionIndex]?.titre || "1. Contempler la Parole"}
                  </h2>
                </div>
                
                {/* Sélecteur de voix & Lecture continue */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-full border border-or-500/30 bg-encre-950/70 p-0.5 text-2xs font-bold">
                    <button
                      onClick={() => changerVoix('feminin')}
                      className={`px-2.5 py-1 rounded-full transition ${
                        genreVoix === 'feminin' ? 'bg-or-400 text-encre-950 font-bold shadow-xs' : 'text-or-200/70 hover:text-or-200'
                      }`}
                    >
                      Vivienne
                    </button>
                    <button
                      onClick={() => changerVoix('masculin')}
                      className={`px-2.5 py-1 rounded-full transition ${
                        genreVoix === 'masculin' ? 'bg-or-400 text-encre-950 font-bold shadow-xs' : 'text-or-200/70 hover:text-or-200'
                      }`}
                    >
                      Studio
                    </button>
                  </div>

                  <button 
                    onClick={toggleAudioLecture}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-or-400 to-or-500 hover:brightness-110 text-encre-950 px-4 py-2 rounded-full text-xs font-bold transition shadow-md"
                  >
                    {isReadingAudio ? <Pause className="w-3.5 h-3.5 animate-pulse"/> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {isReadingAudio ? 'Pause' : 'Écouter'}
                  </button>
                </div>
              </div>

              <div className="mt-4 p-3 bg-or-500/10 rounded-xl border border-or-400/20 text-xs text-or-200 font-medium flex items-start gap-2.5">
                <Feather className="w-4 h-4 text-or-400 shrink-0 mt-0.5" />
                <span>
                  Écoute paisiblement. Clique sur les versets dorés pour ouvrir le passage biblique.
                </span>
              </div>

              {/* Paragraphes illuminés avec versets cliquables */}
              <div className="mt-6 space-y-4 font-serif leading-[1.9] text-lg text-parchemin-100/90">
                {sectionBlocs.map((b, idx) => {
                  if (!b.texte) return null;
                  if (b.type === 'citation') {
                    return (
                      <blockquote key={idx} className="relative rounded-2xl border border-or-500/30 bg-or-500/10 p-5 pl-6 my-5 italic text-base text-or-100 shadow-inner">
                        <Quote className="absolute right-3 top-3 h-5 w-5 text-or-400/30" />
                        <TexteAvecReferences tone="nuit">{b.texte}</TexteAvecReferences>
                      </blockquote>
                    );
                  }
                  if (b.type === 'encadre') {
                    return (
                      <div key={idx} className="rounded-2xl border-l-4 border-or-400 bg-or-500/15 p-4 text-base font-medium my-4 text-or-200">
                        <TexteAvecReferences tone="nuit">{b.texte}</TexteAvecReferences>
                      </div>
                    );
                  }
                  if (b.type === 'sous-titre') {
                    return (
                      <h3 key={idx} className="font-bold text-xl text-or-300 pt-3">
                        {b.texte}
                      </h3>
                    );
                  }
                  return (
                    <p key={idx}>
                      <TexteAvecReferences tone="nuit">{b.texte}</TexteAvecReferences>
                    </p>
                  );
                })}
              </div>
            </article>
            
            <button 
              onClick={handleNext} 
              className="w-full inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-or-400 via-or-500 to-or-400 px-6 text-sm font-bold text-encre-950 shadow-xl transition hover:brightness-110 hover:-translate-y-0.5"
            >
              Entrer dans la méditation <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── ÉTAPE 2 : MÉDITER & CONTEMPLER (Questions Théocentriques) ── */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6">
            <div className="flex items-center justify-between border-b border-or-500/20 pb-3">
              <div>
                <h2 className="font-serif text-2xl font-bold titre-or flex items-center gap-2">
                  <Brain className="w-6 h-6 text-or-400" /> 2. Méditer & Regarder à Dieu
                </h2>
                <p className="text-xs text-parchemin-200/70 mt-0.5">
                  Prends le temps d'accueillir Sa vérité dans ton cœur.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-or-500/15 border border-or-400/30 text-xs font-bold text-or-300">
                {meditationQuestions.length} questions
              </span>
            </div>
            
            <div className="space-y-5">
              {meditationQuestions.map((q, idx) => {
                const badge = FONCTION_BADGES[q.fonction || ''] || { label: `Question ${idx + 1}`, border: 'border-or-400/30', bg: 'bg-or-500/15', text: 'text-or-300' };
                return (
                  <article key={q.id || idx} className="relative rounded-2xl p-5 shadow-lg border border-or-500/20 bg-encre-900/60 backdrop-blur-md space-y-3">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-md border ${badge.bg} ${badge.border} ${badge.text} inline-block`}>
                      {badge.label}
                    </span>

                    <label className="block font-serif text-base font-bold text-parchemin-100 leading-snug">
                      <TexteAvecReferences tone="nuit">{q.question}</TexteAvecReferences>
                    </label>

                    <textarea 
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers(prev => ({...prev, [q.id]: e.target.value}))}
                      className="w-full h-24 rounded-xl border border-or-500/25 bg-encre-950/80 p-3.5 text-parchemin-100 text-sm leading-relaxed outline-none transition focus:border-or-400 focus:ring-2 focus:ring-or-400/20 placeholder:text-parchemin-100/30"
                      placeholder="Ce qui monte dans ton cœur..."
                    />
                  </article>
                );
              })}
            </div>

            <button 
              onClick={handleNext} 
              className="w-full inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-or-400 to-or-500 px-6 text-sm font-bold text-encre-950 shadow-xl transition hover:brightness-110 hover:-translate-y-0.5"
            >
              Choisir ce que j'apporte dans la prière <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── ÉTAPE 3 : CHOISIR CE QUE JE DÉPOSE ── */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6">
            <div className="border-b border-or-500/20 pb-3">
              <h2 className="font-serif text-2xl font-bold titre-or flex items-center gap-2">
                <MousePointerClick className="w-6 h-6 text-or-400" /> 3. Choisir ce que je porte
              </h2>
              <p className="text-xs text-parchemin-200/70 mt-1">
                Quelles découvertes ou convictions veux-tu déposer maintenant devant Dieu ?
              </p>
            </div>
            
            <div className="space-y-3.5">
              {meditationQuestions.map((q) => {
                const val = answers[q.id]?.trim();
                if (!val) return null;
                const isSelected = selectedCards.includes(q.id);
                const badge = FONCTION_BADGES[q.fonction || ''] || { label: 'Révélation', border: 'border-or-400/30', bg: 'bg-or-500/15', text: 'text-or-300' };

                return (
                  <div 
                    key={q.id}
                    onClick={() => {
                      setSelectedCards(prev => prev.includes(q.id) ? prev.filter(k => k !== q.id) : [...prev, q.id]);
                    }}
                    className={`relative rounded-2xl p-5 transition-all cursor-pointer border ${
                      isSelected 
                        ? 'bg-or-500/20 border-or-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] scale-[1.01]' 
                        : 'bg-encre-900/60 border-or-500/20 hover:border-or-400/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-0.5 rounded border ${badge.bg} ${badge.border} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected ? 'bg-or-400 border-or-400 text-encre-950' : 'border-white/30 bg-encre-950'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="font-serif italic text-base text-parchemin-100 pr-2">"{val}"</p>
                  </div>
                );
              })}

              {Object.values(answers).every(v => !v.trim()) && (
                <div className="text-center p-8 bg-encre-900/40 rounded-2xl border border-dashed border-or-500/20 text-parchemin-200/60 text-sm">
                  Tu peux entrer directement dans la prière avec ce que tu as sur le cœur.
                </div>
              )}
            </div>

            <button 
              onClick={handleNext}
              className="w-full inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-or-400 to-or-500 px-6 text-sm font-bold text-encre-950 shadow-xl transition hover:brightness-110 hover:-translate-y-0.5"
            >
              🕊️ Entrer dans le Sanctuaire de prière <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── ÉTAPE 4 : LE SANCTUAIRE DE PRIÈRE ── */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6">
            <div className="relative rounded-3xl p-6 sm:p-9 shadow-2xl border border-or-500/30 bg-encre-900/70 backdrop-blur-xl text-center space-y-4">
              
              <div className="inline-flex p-3.5 rounded-full bg-or-500/20 border border-or-400/40 text-or-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <Flame className="w-8 h-8 animate-pulse text-or-400" />
              </div>
              
              <h2 className="font-serif text-3xl font-bold titre-or">
                4. Ton Sanctuaire de Prière
              </h2>
              <p className="text-xs text-parchemin-200/75 max-w-md mx-auto leading-relaxed">
                Parle simplement à ton Père céleste. Dépose devant Lui ce que tu as contemplé.
              </p>

              {/* Miroir sacré des cartes choisies */}
              <div className="mt-6 space-y-3.5 text-left">
                {selectedCards.map(key => {
                  const q = meditationQuestions.find(mq => mq.id === key);
                  const badge = FONCTION_BADGES[q?.fonction || ''];
                  return (
                    <blockquote key={key} className="relative rounded-2xl border border-or-400/30 bg-or-500/10 p-4 shadow-sm">
                      <Quote className="absolute right-3 top-3 h-5 w-5 text-or-400/20" />
                      {badge && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-or-300 block mb-1">
                          {badge.label}
                        </span>
                      )}
                      <p className="font-serif italic text-base text-parchemin-100">
                        « {answers[key]} »
                      </p>
                    </blockquote>
                  );
                })}
              </div>

              {/* Verbes d'adoration & de prière */}
              <div className="mt-6 flex flex-wrap justify-center gap-2 pt-2">
                {['Adorer', 'Remercier', 'Confesser', 'Demander', 'Écouter', 'Remettre'].map(verb => (
                  <span key={verb} className="px-3 py-1 rounded-full border border-or-500/30 text-or-200 text-xs font-bold uppercase tracking-wider bg-encre-950/70 shadow-xs">
                    {verb}
                  </span>
                ))}
              </div>

              {/* Minuteur paisible */}
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-encre-950 border border-or-400/30 text-or-300 text-xs font-bold">
                <Clock3 className="w-4 h-4 text-or-400" />
                <span>
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-or-400/60">• Présence de Dieu</span>
              </div>
            </div>

            <button 
              onClick={handleNext} 
              className="w-full inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-or-400 to-or-500 px-6 text-sm font-bold text-encre-950 shadow-xl transition hover:brightness-110 hover:-translate-y-0.5"
            >
              Ancrer la Parole vivante <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── ÉTAPE 5 : ANCRER LE VERSET ── */}
        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6">
            <div className="border-b border-or-500/20 pb-3">
              <h2 className="font-serif text-2xl font-bold titre-or flex items-center gap-2">
                <BookA className="w-6 h-6 text-or-400" /> 5. Ancrer le Verset
              </h2>
              <p className="text-xs text-parchemin-200/70 mt-1">
                Grave cette parole vivante dans ta mémoire pour qu'elle t'accompagne toute la journée.
              </p>
            </div>
            
            {/* Choix du verset */}
            {versets.length > 1 && (
              <div className="flex justify-center gap-2">
                {versets.map((vRef, idx) => (
                  <button
                    key={vRef}
                    onClick={() => {
                      setSelectedVersetIndex(idx);
                      setMemoriseLevel(1);
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition border ${
                      selectedVersetIndex === idx
                        ? 'bg-or-400 text-encre-950 border-or-400 shadow-md font-bold'
                        : 'bg-encre-900/60 text-or-200 border-or-500/20 hover:border-or-400/50'
                    }`}
                  >
                    {vRef}
                  </button>
                ))}
              </div>
            )}

            {/* Carte Verset Immersive */}
            <article className="relative rounded-3xl p-6 sm:p-8 shadow-2xl border border-or-500/30 bg-encre-900/60 backdrop-blur-xl text-center">
              
              <div className="flex items-center justify-between text-xs text-or-300 uppercase tracking-widest font-bold border-b border-or-500/20 pb-3">
                <span>{currentVersetRef}</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`"${currentVersetTexte}" (${currentVersetRef})`);
                      setCopiedVerset(true);
                      setTimeout(() => setCopiedVerset(false), 2000);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-or-200 transition"
                    title="Copier le verset"
                  >
                    {copiedVerset ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => lireAVoixHaute(currentVersetTexte)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-or-200 transition"
                    title="Écouter le verset"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rendu Dynamique des 4 Niveaux */}
              <div className="py-6 min-h-[140px] flex items-center justify-center">
                {memoriseLevel === 1 && (
                  <p className="font-serif text-xl sm:text-2xl text-parchemin-100 leading-relaxed italic">
                    « {currentVersetTexte} »
                  </p>
                )}

                {memoriseLevel === 2 && (
                  <p className="font-serif text-lg sm:text-xl text-parchemin-100 leading-loose">
                    {wordsWithGaps.map((item, idx) => (
                      <span key={idx} className="inline-block mx-1">
                        {item.isGap ? (
                          <span className="bg-or-500/25 text-or-300 border-b-2 border-or-400 px-2 py-0.5 rounded font-bold">
                            [ ... ]
                          </span>
                        ) : (
                          item.word
                        )}
                      </span>
                    ))}
                  </p>
                )}

                {memoriseLevel === 3 && (
                  <p className="font-serif text-lg sm:text-xl text-or-300 leading-loose tracking-wider font-medium">
                    {firstLettersText}
                  </p>
                )}

                {memoriseLevel === 4 && (
                  <div className="space-y-4 w-full">
                    <p className="text-xs text-or-200/80 font-medium">
                      Appuie sur le micro et récite le verset de mémoire :
                    </p>
                    <button
                      onClick={toggleMicRecitation}
                      className={`p-5 rounded-full mx-auto flex items-center justify-center transition-all ${
                        isListeningMic 
                          ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_25px_rgba(225,29,72,0.6)]' 
                          : 'bg-gradient-to-r from-or-400 to-or-500 text-encre-950 shadow-lg hover:brightness-110'
                      }`}
                    >
                      {isListeningMic ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    {transcriptMic && (
                      <div className="bg-encre-950/80 p-4 rounded-xl border border-or-400/20 text-sm text-or-100 italic">
                        « {transcriptMic} »
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Grille des 4 niveaux */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-or-500/20">
                {[
                  { lvl: 1, title: 'Niveau 1', sub: 'Lecture' },
                  { lvl: 2, title: 'Niveau 2', sub: 'Mots à trous' },
                  { lvl: 3, title: 'Niveau 3', sub: 'Initiales' },
                  { lvl: 4, title: 'Niveau 4', sub: 'Microphone' },
                ].map(item => (
                  <button
                    key={item.lvl}
                    onClick={() => setMemoriseLevel(item.lvl as any)}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      memoriseLevel === item.lvl
                        ? 'bg-or-500/25 border-or-400 text-or-300 shadow-sm font-bold'
                        : 'bg-encre-950/50 border-or-500/15 text-parchemin-200/60 hover:text-parchemin-100 hover:border-or-500/30'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.title}</p>
                    <p className="text-[10px] opacity-75">{item.sub}</p>
                  </button>
                ))}
              </div>
            </article>

            <button 
              onClick={handleNext} 
              className="w-full inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-or-400 to-or-500 px-6 text-sm font-bold text-encre-950 shadow-xl transition hover:brightness-110 hover:-translate-y-0.5"
            >
              Passer à ma réponse de vie <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── ÉTAPE 6 : VIVRE & RÉPONDRE (Le Pas de Foi & Fond d'écran) ── */}
        {step === 6 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6">
            <div className="relative rounded-3xl p-6 sm:p-8 shadow-2xl border border-or-500/30 bg-encre-900/70 backdrop-blur-xl space-y-4">
              
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-or-400">
                <NotebookPen className="w-4 h-4" /> 6. Vivre & Répondre à cette révélation
              </p>
              
              <label className="block font-serif text-xl sm:text-2xl font-bold titre-or leading-snug">
                Si cette vérité sur Dieu est réelle, comment vas-tu vivre avec Lui aujourd'hui ?
              </label>
              
              <textarea 
                value={step6Answer}
                onChange={(e) => setStep6Answer(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-or-500/30 bg-encre-950/80 p-4 text-parchemin-100 text-base leading-relaxed outline-none transition focus:border-or-400 focus:ring-2 focus:ring-or-400/20 placeholder:text-parchemin-100/30"
                placeholder="Ex : M'approcher de Lui avec confiance, déposer telle inquiétude, Lui obéir dans cette décision..."
              />

              <p className="flex items-center gap-2 text-xs text-parchemin-200/70">
                <LockKeyhole className="w-3.5 h-3.5 text-or-400" />
                Ton pas s'enregistre dans ton Carnet Spirituel personnel.
              </p>
            </div>

            {/* Téléchargement du fond d'écran */}
            <div className="rounded-2xl border border-or-500/20 bg-encre-900/50 p-4 flex items-center justify-between shadow-md">
              <div>
                <h4 className="font-bold text-sm text-parchemin-100">Garder le verset avec soi</h4>
                <p className="text-xs text-parchemin-200/60">Fond d'écran verrouillé pour smartphone</p>
              </div>
              <button 
                onClick={genererFondEcran}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-or-400 to-or-500 hover:brightness-110 text-encre-950 text-xs font-bold px-4 py-2.5 rounded-full transition shadow-md"
              >
                <Download className="w-3.5 h-3.5" /> Télécharger
              </button>
            </div>

            <button 
              onClick={handleFinish} 
              disabled={!step6Answer.trim()}
              className="w-full inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-or-400 via-or-500 to-or-400 px-8 text-base font-bold text-encre-950 shadow-2xl transition hover:brightness-110 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <CheckCircle2 className="w-5 h-5" /> Valider mon temps avec Dieu
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
