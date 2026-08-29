'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { 
  BookOpen, Brain, MousePointerClick, 
  Flame, BookA, Check, ArrowRight, ArrowLeft, Play, Pause, 
  Mic, MicOff, Download, Sparkles, Volume2, RotateCcw, Copy
} from 'lucide-react';
import { saveAnswer } from '@/lib/firestore';
import { jouerAmbiance, arreterAmbiance, lireAVoixHaute, arreterLecture } from '@/lib/ambiance';
import { VERSETS_CONNUS, normaliserReference } from '@/data/versets';

interface Props {
  ficheId: number;
  sectionIndex: number;
  ficheData: any;
  sectionText: string;
  meditationQuestions: Array<{
    id: string;
    fonction?: string;
    question: string;
  }>;
  versets?: string[];
  onComplete: (data: any) => void;
}

const FONCTION_LABELS: Record<string, { label: string; color: string }> = {
  'observer': { label: 'Observation', color: 'border-sky-500/40 text-sky-400 bg-sky-950/40' },
  'decouvrir-dieu': { label: 'Sur Dieu', color: 'border-amber-500/40 text-amber-300 bg-amber-950/40' },
  'se-laisser-eclairer': { label: 'Miroir du cœur', color: 'border-rose-500/40 text-rose-300 bg-rose-950/40' },
  'recevoir': { label: 'Recevoir', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40' },
  'repondre': { label: 'Mon action', color: 'border-purple-500/40 text-purple-300 bg-purple-950/40' },
  'observer+decouvrir-dieu': { label: 'Observer & Découvrir Dieu', color: 'border-amber-500/40 text-amber-300 bg-amber-950/40' },
  'recevoir+repondre': { label: 'Recevoir & Répondre', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40' },
};

export default function TempsApart({ 
  ficheId, 
  sectionIndex, 
  ficheData, 
  sectionText, 
  meditationQuestions, 
  versets = [],
  onComplete 
}: Props) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [step6Answer, setStep6Answer] = useState('');
  const [isReadingAudio, setIsReadingAudio] = useState(false);
  const [selectedVersetIndex, setSelectedVersetIndex] = useState(0);
  const [memoriseLevel, setMemoriseLevel] = useState<1 | 2 | 3 | 4>(1);
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [transcriptMic, setTranscriptMic] = useState('');
  const [copiedVerset, setCopiedVerset] = useState(false);
  const { user } = useAuth();

  const currentVersetRef = versets[selectedVersetIndex] || versets[0] || 'Ps 46:11';
  const currentVersetTexte = useMemo(() => {
    const norm = normaliserReference(currentVersetRef);
    return VERSETS_CONNUS[norm] || VERSETS_CONNUS[currentVersetRef] || "Arrêtez, et sachez que je suis Dieu : Je domine sur les nations, je domine sur la terre.";
  }, [currentVersetRef]);

  // Handle ambient music during prayer (Step 4)
  useEffect(() => {
    if (step === 4) {
      void jouerAmbiance('emotional-piano', 0.35);
      setTimerRunning(true);
    } else {
      void arreterAmbiance();
      setTimerRunning(false);
      arreterLecture();
      setIsReadingAudio(false);
    }
    return () => {
      void arreterAmbiance();
      arreterLecture();
    };
  }, [step]);

  // Prayer timer countdown
  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const handleNext = () => setStep(s => Math.min(6, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  // Audio reading toggle for Step 1
  const toggleAudioLecture = () => {
    if (isReadingAudio) {
      arreterLecture();
      setIsReadingAudio(false);
    } else {
      setIsReadingAudio(true);
      const textOnly = sectionText.replace(/<[^>]*>/g, ' ');
      lireAVoixHaute(textOnly, {
        onFin: () => setIsReadingAudio(false),
        onErreur: () => setIsReadingAudio(false),
      });
    }
  };

  // Level 2 gaps generation
  const wordsWithGaps = useMemo(() => {
    const words = currentVersetTexte.split(' ');
    return words.map((w, idx) => ({
      word: w,
      isGap: idx % 3 === 1 && w.length > 2,
    }));
  }, [currentVersetTexte]);

  // Level 3 first letters generation
  const firstLettersText = useMemo(() => {
    return currentVersetTexte
      .split(' ')
      .map(w => {
        if (w.length <= 1) return w;
        return w[0] + '...';
      })
      .join(' ');
  }, [currentVersetTexte]);

  // Web Speech API for Level 4
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

  // Generate Wallpaper Canvas (1080x1920)
  const genererFondEcran = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient (Dark Night Sky)
    const grad = ctx.createLinearGradient(0, 0, 0, 1920);
    grad.addColorStop(0, '#060a14');
    grad.addColorStop(0.5, '#0b1329');
    grad.addColorStop(1, '#03050a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Subtle golden glow circle
    const radial = ctx.createRadialGradient(540, 960, 50, 540, 960, 600);
    radial.addColorStop(0, 'rgba(217, 119, 6, 0.15)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 1080, 1920);

    // Header badge
    ctx.fillStyle = 'rgba(245, 158, 11, 0.8)';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '6px';
    ctx.fillText('LES FONDEMENTS • UN TEMPS À PART', 540, 500);

    // Golden Cross/Symbol
    ctx.fillStyle = '#f59e0b';
    ctx.font = '60px sans-serif';
    ctx.fillText('✝', 540, 620);

    // Verse text wrap
    ctx.fillStyle = '#fef3c7';
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

    // Verse reference
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(currentVersetRef, 540, y + 120);

    // Download trigger
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
      } catch (e) {
        console.error("Erreur de sauvegarde", e);
      }
    }
    onComplete(finalData);
  };

  return (
    <div className="nuit nuit-grain min-h-screen text-amber-50 flex flex-col safe-area-inset overflow-x-hidden">
      {/* Header / Progress */}
      <header className="p-4 flex items-center justify-between z-10 sticky top-0 bg-black/40 backdrop-blur-md border-b border-amber-900/30">
        <button onClick={handlePrev} className={`p-2 transition-opacity ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <ArrowLeft className="w-6 h-6 text-amber-400" />
        </button>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step 
                  ? 'w-6 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]' 
                  : i < step 
                    ? 'w-2 bg-amber-600/70' 
                    : 'w-2 bg-white/10'
              }`} 
            />
          ))}
        </div>
        <div className="text-xs font-semibold tracking-wider text-amber-400/80 px-2 py-1 bg-amber-950/40 rounded-full border border-amber-800/40">
          Étape {step}/6
        </div>
      </header>

      <main className="flex-1 p-5 md:p-8 flex flex-col max-w-2xl mx-auto w-full transition-all duration-500 relative">
        
        {/* ÉTAPE 1 : LIRE & ÉCOUTER */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 pb-20">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-1">
                <BookOpen className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-serif text-amber-100">1. Lire & Écouter attentivement</h2>
              <p className="text-sm text-amber-200/70 max-w-md mx-auto leading-relaxed">
                Prête attention aux mots qui ressortent, aux contrastes et à ce que Dieu dit. Relis calmement.
              </p>
            </div>
            
            <div className="bg-black/40 border border-amber-900/40 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative">
              <button 
                onClick={toggleAudioLecture}
                className="absolute top-4 right-4 flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 px-3 py-2 rounded-xl text-xs text-amber-200 font-medium transition"
              >
                {isReadingAudio ? <Pause className="w-4 h-4 text-amber-400 animate-pulse"/> : <Play className="w-4 h-4 text-amber-400" />}
                {isReadingAudio ? 'Pause' : 'Écouter'}
              </button>

              <div 
                className="prose prose-invert prose-amber max-w-none mt-6 font-serif leading-relaxed text-base md:text-lg text-amber-50/90 space-y-4" 
                dangerouslySetInnerHTML={{ __html: sectionText }} 
              />
            </div>
            
            <button onClick={handleNext} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-amber-950/50">
              Passer à la méditation <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ÉTAPE 2 : MÉDITER */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 pb-20">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-1">
                <Brain className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-serif text-amber-100">2. Méditer</h2>
              <p className="text-sm text-amber-200/70 max-w-md mx-auto">
                Laisse le texte interroger ton cœur. Réponds simplement et avec vérité.
              </p>
            </div>
            
            <div className="space-y-6">
              {meditationQuestions.map((q, idx) => {
                const fonctionInfo = FONCTION_LABELS[q.fonction || ''] || { label: `Question ${idx + 1}`, color: 'border-amber-800 text-amber-400 bg-amber-950/30' };
                return (
                  <div key={q.id || idx} className="bg-black/30 border border-amber-900/30 rounded-2xl p-5 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${fonctionInfo.color}`}>
                        {fonctionInfo.label}
                      </span>
                    </div>
                    <label className="block text-base font-medium text-amber-100/95 leading-snug">
                      {q.question}
                    </label>
                    <textarea 
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers(prev => ({...prev, [q.id]: e.target.value}))}
                      className="w-full h-24 bg-black/50 border border-amber-900/40 rounded-xl p-3.5 text-amber-50 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-amber-50/25 leading-relaxed"
                      placeholder="Ta réflexion personnelle..."
                    />
                  </div>
                );
              })}
            </div>

            <button onClick={handleNext} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-amber-950/50">
              Choisir ce que j'apporte dans la prière <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ÉTAPE 3 : CHOISIR CE QUE JE PORTE */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 pb-20">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-1">
                <MousePointerClick className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-serif text-amber-100">3. Choisir</h2>
              <p className="text-sm text-amber-200/70 max-w-md mx-auto">
                Parmi ce que tu as découvert, que veux-tu apporter maintenant à Dieu ?
              </p>
            </div>
            
            <div className="space-y-3">
              {meditationQuestions.map((q) => {
                const val = answers[q.id]?.trim();
                if (!val) return null;
                const isSelected = selectedCards.includes(q.id);
                const fonctionInfo = FONCTION_LABELS[q.fonction || ''] || { label: 'Découverte', color: 'border-amber-800 text-amber-400 bg-amber-950/30' };

                return (
                  <div 
                    key={q.id}
                    onClick={() => {
                      setSelectedCards(prev => prev.includes(q.id) ? prev.filter(k => k !== q.id) : [...prev, q.id]);
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected 
                        ? 'bg-amber-950/50 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                        : 'bg-black/30 border-amber-900/30 hover:border-amber-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${fonctionInfo.color}`}>
                        {fonctionInfo.label}
                      </span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected ? 'bg-amber-500 border-amber-500 text-black' : 'border-amber-700/40 bg-black/40'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-amber-50/90 font-serif italic text-base pr-2">"{val}"</p>
                  </div>
                );
              })}

              {Object.values(answers).every(v => !v.trim()) && (
                <div className="text-center p-8 bg-black/30 rounded-2xl border border-dashed border-amber-900/40 text-amber-200/60 text-sm">
                  Tu n'as pas écrit de réponse à l'étape précédente. Tu peux tout de même entrer dans la prière.
                </div>
              )}
            </div>

            <button 
              onClick={handleNext}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-amber-950/50"
            >
              🕊️ Je veux parler à Dieu de ceci <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ÉTAPE 4 : PRIER LIBREMENT */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 flex flex-col items-center justify-center min-h-[65vh] space-y-8 pb-20 relative">
            <div className="text-center space-y-3 z-10">
              <div className="inline-flex p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                <Flame className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-serif text-amber-100 tracking-wide">4. Prier</h2>
              <p className="text-sm text-amber-200/60 max-w-sm mx-auto leading-relaxed">
                Dépose ce que tu as découvert devant Lui. Parle-lui simplement, cœur à cœur.
              </p>
            </div>
            
            {/* Selected Cards Sacred Display */}
            <div className="w-full space-y-4 z-10">
              {selectedCards.map(key => {
                const q = meditationQuestions.find(mq => mq.id === key);
                const fonctionInfo = FONCTION_LABELS[q?.fonction || ''];
                return (
                  <div key={key} className="bg-black/60 border border-amber-800/40 rounded-2xl p-5 text-center backdrop-blur-md shadow-2xl space-y-1">
                    {fonctionInfo && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70">
                        {fonctionInfo.label}
                      </span>
                    )}
                    <p className="text-amber-100/90 font-serif text-lg leading-relaxed italic">
                      "{answers[key]}"
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Prayer Action Verbs */}
            <div className="flex flex-wrap justify-center gap-2 z-10">
              {['Remercier', 'Confesser', 'Demander', 'Écouter', 'Remettre'].map(verb => (
                <span key={verb} className="px-3.5 py-1.5 rounded-full border border-amber-700/30 text-amber-400/80 text-xs tracking-widest uppercase bg-black/40 backdrop-blur-sm">
                  {verb}
                </span>
              ))}
            </div>

            {/* Gentle Timer */}
            <div className="flex items-center gap-3 bg-black/40 border border-amber-900/40 px-4 py-2 rounded-full text-xs text-amber-300/80 z-10">
              <span className="font-mono text-sm font-bold text-amber-400">
                {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
              </span>
              <span>• Musique contemplative</span>
            </div>

            <button 
              onClick={handleNext} 
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-amber-950/50 z-10 mt-4"
            >
              Ancrer la Parole <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ÉTAPE 5 : ANCRER LE VERSET */}
        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 pb-20">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-1">
                <BookA className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-serif text-amber-100">5. Ancrer le Verset</h2>
              <p className="text-sm text-amber-200/70 max-w-md mx-auto">
                Grave cette parole vivante dans ta mémoire pour ta journée.
              </p>
            </div>
            
            {/* Multiple Verses Selector */}
            {versets.length > 1 && (
              <div className="flex justify-center gap-2">
                {versets.map((vRef, idx) => (
                  <button
                    key={vRef}
                    onClick={() => {
                      setSelectedVersetIndex(idx);
                      setMemoriseLevel(1);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      selectedVersetIndex === idx
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                        : 'bg-black/30 text-amber-300/70 border-amber-900/40 hover:border-amber-700'
                    }`}
                  >
                    {vRef}
                  </button>
                ))}
              </div>
            )}

            {/* Verset Display with Levels */}
            <div className="bg-black/40 border border-amber-900/40 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md space-y-5 text-center relative">
              <div className="flex items-center justify-between text-xs text-amber-400/70 uppercase tracking-widest font-semibold border-b border-amber-900/30 pb-3">
                <span>{currentVersetRef}</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`"${currentVersetTexte}" (${currentVersetRef})`);
                      setCopiedVerset(true);
                      setTimeout(() => setCopiedVerset(false), 2000);
                    }}
                    className="p-1.5 hover:text-amber-200 transition"
                    title="Copier le verset"
                  >
                    {copiedVerset ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => lireAVoixHaute(currentVersetTexte)}
                    className="p-1.5 hover:text-amber-200 transition"
                    title="Écouter la voix"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic content per level */}
              {memoriseLevel === 1 && (
                <p className="font-serif text-xl md:text-2xl text-amber-50/95 leading-relaxed italic">
                  « {currentVersetTexte} »
                </p>
              )}

              {memoriseLevel === 2 && (
                <p className="font-serif text-lg md:text-xl text-amber-50/95 leading-loose">
                  {wordsWithGaps.map((item, idx) => (
                    <span key={idx} className="inline-block mx-1">
                      {item.isGap ? (
                        <span className="bg-amber-500/20 text-amber-300 border-b-2 border-amber-400 px-2 py-0.5 rounded font-bold">
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
                <p className="font-serif text-lg md:text-xl text-amber-200/90 leading-loose tracking-wide">
                  {firstLettersText}
                </p>
              )}

              {memoriseLevel === 4 && (
                <div className="space-y-4 py-2">
                  <p className="text-sm text-amber-300/80">
                    Appuie sur le micro et récite le verset de mémoire :
                  </p>
                  <button
                    onClick={toggleMicRecitation}
                    className={`p-5 rounded-full mx-auto flex items-center justify-center transition-all ${
                      isListeningMic 
                        ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_25px_rgba(225,29,72,0.6)]' 
                        : 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                    }`}
                  >
                    {isListeningMic ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                  </button>
                  {transcriptMic && (
                    <div className="bg-black/50 p-4 rounded-xl border border-amber-800/40 text-sm text-amber-100 italic">
                      « {transcriptMic} »
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Level selection buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { lvl: 1, title: 'Niveau 1', sub: 'Lecture' },
                { lvl: 2, title: 'Niveau 2', sub: 'Mots à trous' },
                { lvl: 3, title: 'Niveau 3', sub: 'Initiales' },
                { lvl: 4, title: 'Niveau 4', sub: 'Microphone' },
              ].map(item => (
                <button
                  key={item.lvl}
                  onClick={() => setMemoriseLevel(item.lvl as any)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    memoriseLevel === item.lvl
                      ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-md'
                      : 'bg-black/30 border-amber-900/30 text-amber-400/60 hover:border-amber-800'
                  }`}
                >
                  <p className="font-bold text-xs">{item.title}</p>
                  <p className="text-[11px] opacity-75">{item.sub}</p>
                </button>
              ))}
            </div>

            <button onClick={handleNext} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-amber-950/50 mt-4">
              Passer à l'action concrète <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ÉTAPE 6 : POSER MON PAS */}
        {step === 6 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 pb-20">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-1">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-serif text-amber-100">6. Poser mon Pas d'Obéissance</h2>
              <p className="text-sm text-amber-200/70 max-w-md mx-auto">
                Transforme ta conviction en un comportement observable pour aujourd'hui.
              </p>
            </div>

            <div className="bg-black/40 border border-amber-900/40 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-4">
              <label className="block text-base font-medium text-amber-100/95 leading-snug">
                À quoi cela ressemblera concrètement aujourd'hui ?
              </label>
              <textarea 
                value={step6Answer}
                onChange={(e) => setStep6Answer(e.target.value)}
                className="w-full h-28 bg-black/50 border border-amber-900/40 rounded-xl p-4 text-amber-50 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-amber-50/25 leading-relaxed"
                placeholder="Ex : Avant 18h, appeler mon collègue pour lui demander pardon..."
              />
            </div>

            {/* Fond d'écran 1 clic */}
            <div className="bg-amber-950/30 border border-amber-800/30 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm text-amber-200">Garder le verset avec soi</h4>
                <p className="text-xs text-amber-400/60">Générer un fond d'écran pour ton smartphone</p>
              </div>
              <button 
                onClick={genererFondEcran}
                className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition"
              >
                <Download className="w-4 h-4" /> Télécharger
              </button>
            </div>

            <button 
              onClick={handleFinish} 
              disabled={!step6Answer.trim()}
              className={`w-full font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg ${
                step6Answer.trim() 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50' 
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              <Check className="w-5 h-5 stroke-[2.5]" /> Valider mon temps à part
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
