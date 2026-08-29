'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { 
  BookOpen, Brain, MousePointerClick, 
  Flame, BookA, Check, ArrowRight, ArrowLeft, Play, Pause, 
  Mic, MicOff, Download, Sparkles, Volume2, Copy,
  LockKeyhole, Clock3, NotebookPen, Quote, CheckCircle2, Feather, UserCheck
} from 'lucide-react';
import { saveAnswer, addJournalEntry } from '@/lib/firestore';
import { 
  jouerAmbiance, arreterAmbiance, lireAVoixHaute, arreterLecture,
  getGenreVoix, setGenreVoix, type GenreVoix 
} from '@/lib/ambiance';
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

const FONCTION_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  'contempler': { label: '1. Contempler Dieu', bg: 'bg-or-100 border-or-300', text: 'text-or-950' },
  'comprendre': { label: '2. Comprendre Sa Vérité', bg: 'bg-sky-100 border-sky-300', text: 'text-sky-950' },
  'recevoir': { label: '3. Recevoir dans mon Cœur', bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-950' },
  'etre-transforme': { label: '4. Être Transformé', bg: 'bg-rose-100 border-rose-300', text: 'text-rose-950' },
  'vivre': { label: '5. Vivre & Répondre', bg: 'bg-purple-100 border-purple-300', text: 'text-purple-950' },
  // Backward compatibility
  'observer': { label: '1. Contempler', bg: 'bg-or-100 border-or-300', text: 'text-or-950' },
  'decouvrir-dieu': { label: '2. Découvrir Dieu', bg: 'bg-sky-100 border-sky-300', text: 'text-sky-950' },
  'se-laisser-eclairer': { label: '3. Miroir de vérité', bg: 'bg-rose-100 border-rose-300', text: 'text-rose-950' },
  'repondre': { label: '5. Vivre la Parole', bg: 'bg-purple-100 border-purple-300', text: 'text-purple-950' },
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
  const [genreVoix, setGenreVoixState] = useState<GenreVoix>('feminin');
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
  }, []);

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
        piste: `f${ficheId}.s${sectionIndex}`,
        genre: genreVoix,
        onFin: () => setIsReadingAudio(false),
        onErreur: () => setIsReadingAudio(false),
      });
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

    // Background Gradient (Warm deep parchment & gold)
    const grad = ctx.createLinearGradient(0, 0, 0, 1920);
    grad.addColorStop(0, '#1a140c');
    grad.addColorStop(0.5, '#261c10');
    grad.addColorStop(1, '#0f0c07');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Warm glow
    const radial = ctx.createRadialGradient(540, 960, 50, 540, 960, 650);
    radial.addColorStop(0, 'rgba(217, 119, 6, 0.2)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 1080, 1920);

    // Header badge
    ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '6px';
    ctx.fillText('LES FONDEMENTS • UN TEMPS À PART', 540, 500);

    // Symbol
    ctx.fillStyle = '#f59e0b';
    ctx.font = '64px sans-serif';
    ctx.fillText('✝', 540, 620);

    // Verse text wrap
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

    // Verse reference
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 38px sans-serif';
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

        // Enregistrer automatiquement dans le Journal Spirituel
        const recapPriere = selectedCards
          .map(k => answers[k]?.trim())
          .filter(Boolean)
          .map(t => `• ${t}`)
          .join('\n');

        const entreesJournal = [
          `📖 **Fiche ${ficheId} : ${ficheData?.titre || ''}** — Étape ${sectionIndex + 1}`,
          `✨ **Parole gardée :** « ${currentVersetTexte} » (${currentVersetRef})`,
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
    <div className="table-travail min-h-screen text-encre-950 flex flex-col safe-area-inset overflow-x-hidden pb-16">
      {/* Header / Table Navigation */}
      <header className="p-4 flex items-center justify-between z-20 sticky top-0 bg-parchemin-50/85 backdrop-blur-md border-b border-encre-900/10 shadow-sm">
        <button 
          onClick={handlePrev} 
          className={`p-2 rounded-full border border-encre-900/15 bg-parchemin-50 text-encre-700 hover:bg-parchemin-100 transition-opacity ${
            step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          aria-label="Étape précédente"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Progress Pins & Steps */}
        <div className="flex items-center gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div 
              key={i} 
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === step 
                  ? 'w-7 bg-or-600 shadow-[0_0_8px_rgba(217,119,6,0.6)]' 
                  : i < step 
                    ? 'w-2.5 bg-encre-900/70' 
                    : 'w-2.5 bg-encre-900/15'
              }`} 
            />
          ))}
        </div>

        <span className="timbre inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-encre-800 bg-parchemin-100">
          Étape {step} / 6
        </span>
      </header>

      {/* Main Table Work Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col max-w-2xl mx-auto w-full transition-all duration-500 relative">
        
        {/* ÉTAPE 1 : LIRE & ÉCOUTER (Feuille de travail avec trombone & sélecteur de voix) */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6">
            <article className="feuille relative rounded-3xl p-6 sm:p-9 shadow-xl border border-encre-900/10">
              <span className="trombone absolute -top-3 left-9" aria-hidden="true" />
              
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-encre-900/15 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] bg-or-100 text-or-900 border border-or-300">
                    <BookOpen className="w-3.5 h-3.5" /> Fiche {ficheId} • Étape {sectionIndex + 1}
                  </span>
                  <h2 className="mt-2.5 font-serif text-2xl sm:text-3xl font-bold text-encre-950">
                    1. Lire & Écouter attentivement
                  </h2>
                </div>
                
                {/* Voice & Audio Controls */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-full border border-encre-900/15 bg-white/70 p-0.5 text-2xs font-bold">
                    <button
                      onClick={() => changerVoix('feminin')}
                      className={`px-2.5 py-1 rounded-full transition ${
                        genreVoix === 'feminin' ? 'bg-encre-950 text-white shadow-xs' : 'text-encre-600 hover:text-encre-900'
                      }`}
                    >
                      Vivienne
                    </button>
                    <button
                      onClick={() => changerVoix('masculin')}
                      className={`px-2.5 py-1 rounded-full transition ${
                        genreVoix === 'masculin' ? 'bg-encre-950 text-white shadow-xs' : 'text-encre-600 hover:text-encre-900'
                      }`}
                    >
                      Studio
                    </button>
                  </div>

                  <button 
                    onClick={toggleAudioLecture}
                    className="inline-flex items-center gap-2 bg-encre-950 hover:bg-encre-800 text-parchemin-50 px-4 py-2 rounded-full text-xs font-bold transition shadow-sm"
                  >
                    {isReadingAudio ? <Pause className="w-3.5 h-3.5 text-or-400 animate-pulse"/> : <Play className="w-3.5 h-3.5 text-or-400" />}
                    {isReadingAudio ? 'Pause' : 'Écouter'}
                  </button>
                </div>
              </div>

              <div className="mt-4 p-3 bg-or-50/60 rounded-xl border border-or-200/80 text-xs text-or-950 font-medium flex items-start gap-2.5">
                <Feather className="w-4 h-4 text-or-700 shrink-0 mt-0.5" />
                <span>
                  Lis ce texte lentement. Prête attention à ce qu'il révèle sur Dieu et Son cœur.
                </span>
              </div>

              <div 
                className="mt-6 font-serif leading-[1.8] text-lg text-encre-900 space-y-4" 
                dangerouslySetInnerHTML={{ __html: sectionText }} 
              />
            </article>
            
            <button 
              onClick={handleNext} 
              className="w-full inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-encre-950 px-6 text-sm font-bold text-parchemin-50 shadow-md transition hover:-translate-y-0.5 hover:bg-encre-800"
            >
              Passer à la contemplation <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ÉTAPE 2 : CONTEMPLER & MÉDITER (Fiches bristol théocentriques) */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6">
            <div className="flex items-center justify-between border-b border-encre-900/15 pb-3">
              <div>
                <h2 className="font-serif text-2xl font-bold text-encre-950 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-or-700" /> 2. Méditer & Contempler
                </h2>
                <p className="text-xs text-encre-700 mt-0.5">
                  Regarde à Dieu et Sa vérité avant tout.
                </p>
              </div>
              <span className="timbre px-2.5 py-1 text-xs font-bold text-encre-800">
                {meditationQuestions.length} questions
              </span>
            </div>
            
            <div className="space-y-5">
              {meditationQuestions.map((q, idx) => {
                const badge = FONCTION_BADGES[q.fonction || ''] || { label: `Question ${idx + 1}`, bg: 'bg-parchemin-100 border-encre-900/20', text: 'text-encre-800' };
                return (
                  <article key={q.id || idx} className="feuille relative rounded-2xl p-5 shadow-md border border-encre-900/10">
                    <span className="punaise -top-2 left-6" />
                    
                    <div className="flex items-center justify-between mb-2.5">
                      <span className={`text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-md border ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </div>

                    <label className="block font-serif text-base font-bold text-encre-950 mb-3 leading-snug">
                      {q.question}
                    </label>

                    <textarea 
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers(prev => ({...prev, [q.id]: e.target.value}))}
                      className="w-full h-24 rounded-xl border border-encre-900/15 bg-white/60 p-3.5 text-encre-900 text-sm leading-relaxed outline-none transition focus:border-or-700 focus:ring-2 focus:ring-or-400/20 placeholder:text-encre-900/30"
                      placeholder="Ta pensée ou prière..."
                    />
                  </article>
                );
              })}
            </div>

            <button 
              onClick={handleNext} 
              className="w-full inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-encre-950 px-6 text-sm font-bold text-parchemin-50 shadow-md transition hover:-translate-y-0.5 hover:bg-encre-800"
            >
              Choisir ce que j'apporte dans la prière <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ÉTAPE 3 : CHOISIR CE QUE JE PORTE */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6">
            <div className="border-b border-encre-900/15 pb-3">
              <h2 className="font-serif text-2xl font-bold text-encre-950 flex items-center gap-2">
                <MousePointerClick className="w-6 h-6 text-or-700" /> 3. Choisir ce que je porte
              </h2>
              <p className="text-xs text-encre-700 mt-1">
                Parmi ce que tu viens de contempler, que veux-tu déposer maintenant devant Dieu ?
              </p>
            </div>
            
            <div className="space-y-3.5">
              {meditationQuestions.map((q) => {
                const val = answers[q.id]?.trim();
                if (!val) return null;
                const isSelected = selectedCards.includes(q.id);
                const badge = FONCTION_BADGES[q.fonction || ''] || { label: 'Révélation', bg: 'bg-parchemin-100 border-encre-900/20', text: 'text-encre-800' };

                return (
                  <div 
                    key={q.id}
                    onClick={() => {
                      setSelectedCards(prev => prev.includes(q.id) ? prev.filter(k => k !== q.id) : [...prev, q.id]);
                    }}
                    className={`relative rounded-2xl p-5 transition-all cursor-pointer border ${
                      isSelected 
                        ? 'bg-parchemin-100 border-or-600 shadow-md scale-[1.01]' 
                        : 'bg-white/60 border-encre-900/15 hover:border-or-500 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-0.5 rounded border ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected ? 'bg-or-600 border-or-600 text-white' : 'border-encre-900/30 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="font-serif italic text-base text-encre-900 pr-2">"{val}"</p>
                  </div>
                );
              })}

              {Object.values(answers).every(v => !v.trim()) && (
                <div className="text-center p-8 bg-white/40 rounded-2xl border border-dashed border-encre-900/20 text-encre-700 text-sm">
                  Tu n'as pas renseigné de notes. Tu peux tout de même entrer librement dans la prière.
                </div>
              )}
            </div>

            <button 
              onClick={handleNext}
              className="w-full inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-encre-950 px-6 text-sm font-bold text-parchemin-50 shadow-md transition hover:-translate-y-0.5 hover:bg-encre-800"
            >
              🕊️ Je veux parler à Dieu de ceci <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ÉTAPE 4 : PRIER LIBREMENT (Sanctuaire avec nappe musicale) */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6">
            <div className="feuille relative rounded-3xl p-6 sm:p-9 shadow-xl border border-encre-900/10 text-center">
              <span className="ruban -top-3 left-1/2 -translate-x-1/2" />
              
              <div className="inline-flex p-3.5 rounded-full bg-or-100 border border-or-300 text-or-800 mb-3 shadow-inner">
                <Flame className="w-7 h-7 animate-pulse" />
              </div>
              
              <h2 className="font-serif text-3xl font-bold text-encre-950">
                4. Ton temps de prière
              </h2>
              <p className="text-xs text-encre-700 max-w-md mx-auto mt-1 leading-relaxed">
                Dépose ce que tu as découvert devant Lui. Parle-lui simplement, comme un enfant à son Père.
              </p>

              {/* Selected Cards Mirror */}
              <div className="mt-6 space-y-3.5 text-left">
                {selectedCards.map(key => {
                  const q = meditationQuestions.find(mq => mq.id === key);
                  const badge = FONCTION_BADGES[q?.fonction || ''];
                  return (
                    <blockquote key={key} className="relative rounded-2xl border border-or-300 bg-parchemin-100 p-4 shadow-sm">
                      <Quote className="absolute right-3 top-3 h-5 w-5 text-or-400/40" />
                      {badge && (
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-or-800 block mb-1">
                          {badge.label}
                        </span>
                      )}
                      <p className="font-serif italic text-base text-encre-950">
                        « {answers[key]} »
                      </p>
                    </blockquote>
                  );
                })}
              </div>

              {/* Action Verbs */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {['Adorer', 'Remercier', 'Confesser', 'Demander', 'Écouter', 'Remettre'].map(verb => (
                  <span key={verb} className="px-3 py-1 rounded-full border border-encre-900/15 text-encre-800 text-xs font-bold uppercase tracking-wider bg-white/70 shadow-sm">
                    {verb}
                  </span>
                ))}
              </div>

              {/* Timer badge */}
              <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-encre-950 text-parchemin-50 text-xs font-bold">
                <Clock3 className="w-3.5 h-3.5 text-or-400" />
                <span>
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-or-300/70">• Musique contemplative</span>
              </div>
            </div>

            <button 
              onClick={handleNext} 
              className="w-full inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-encre-950 px-6 text-sm font-bold text-parchemin-50 shadow-md transition hover:-translate-y-0.5 hover:bg-encre-800"
            >
              Ancrer la Parole <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ÉTAPE 5 : ANCRER LE VERSET */}
        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6">
            <div className="border-b border-encre-900/15 pb-3">
              <h2 className="font-serif text-2xl font-bold text-encre-950 flex items-center gap-2">
                <BookA className="w-6 h-6 text-or-700" /> 5. Ancrer le Verset
              </h2>
              <p className="text-xs text-encre-700 mt-1">
                Grave cette parole vivante dans ta mémoire pour qu'elle t'accompagne toute la journée.
              </p>
            </div>
            
            {/* Multiple Verses Choice */}
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
                        ? 'bg-encre-950 text-parchemin-50 border-encre-950 shadow-md'
                        : 'bg-parchemin-50 text-encre-800 border-encre-900/15 hover:bg-parchemin-100'
                    }`}
                  >
                    {vRef}
                  </button>
                ))}
              </div>
            )}

            {/* Verset Sheet */}
            <article className="feuille relative rounded-3xl p-6 sm:p-8 shadow-xl border border-encre-900/10 text-center">
              <span className="trombone absolute -top-3 right-8" />
              
              <div className="flex items-center justify-between text-xs text-or-800 uppercase tracking-widest font-bold border-b border-encre-900/10 pb-3">
                <span>{currentVersetRef}</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`"${currentVersetTexte}" (${currentVersetRef})`);
                      setCopiedVerset(true);
                      setTimeout(() => setCopiedVerset(false), 2000);
                    }}
                    className="p-1 text-encre-600 hover:text-encre-950 transition"
                    title="Copier le verset"
                  >
                    {copiedVerset ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => lireAVoixHaute(currentVersetTexte)}
                    className="p-1 text-encre-600 hover:text-encre-950 transition"
                    title="Écouter"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Level Rendering */}
              <div className="py-6">
                {memoriseLevel === 1 && (
                  <p className="font-serif text-xl sm:text-2xl text-encre-950 leading-relaxed italic">
                    « {currentVersetTexte} »
                  </p>
                )}

                {memoriseLevel === 2 && (
                  <p className="font-serif text-lg sm:text-xl text-encre-950 leading-loose">
                    {wordsWithGaps.map((item, idx) => (
                      <span key={idx} className="inline-block mx-1">
                        {item.isGap ? (
                          <span className="bg-or-200 text-or-950 border-b-2 border-or-600 px-2 py-0.5 rounded font-bold">
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
                  <p className="font-serif text-lg sm:text-xl text-or-950 leading-loose tracking-wide font-medium">
                    {firstLettersText}
                  </p>
                )}

                {memoriseLevel === 4 && (
                  <div className="space-y-4">
                    <p className="text-xs text-encre-700 font-medium">
                      Appuie sur le micro et récite le verset de mémoire :
                    </p>
                    <button
                      onClick={toggleMicRecitation}
                      className={`p-5 rounded-full mx-auto flex items-center justify-center transition-all ${
                        isListeningMic 
                          ? 'bg-rose-600 text-white animate-pulse shadow-lg' 
                          : 'bg-encre-950 text-parchemin-50 hover:bg-encre-800 shadow-md'
                      }`}
                    >
                      {isListeningMic ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6 text-or-400" />}
                    </button>
                    {transcriptMic && (
                      <div className="bg-white/70 p-4 rounded-xl border border-encre-900/10 text-sm text-encre-900 italic">
                        « {transcriptMic} »
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Levels grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-encre-900/10">
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
                        ? 'bg-or-100 border-or-600 text-or-950 shadow-sm'
                        : 'bg-parchemin-50 border-encre-900/15 text-encre-700 hover:bg-parchemin-100'
                    }`}
                  >
                    <p className="font-bold text-xs">{item.title}</p>
                    <p className="text-[10px] opacity-75">{item.sub}</p>
                  </button>
                ))}
              </div>
            </article>

            <button 
              onClick={handleNext} 
              className="w-full inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-encre-950 px-6 text-sm font-bold text-parchemin-50 shadow-md transition hover:-translate-y-0.5 hover:bg-encre-800"
            >
              Passer à ma réponse de vie <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ÉTAPE 6 : VIVRE LA PAROLE (Le Post-it Jaune avec ruban) */}
        {step === 6 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6">
            <div className="postit postit-jaune relative mx-auto w-full rotate-[-0.5deg] rounded-sm p-6 sm:p-8 shadow-xl border border-encre-900/15">
              <span className="ruban -top-3 left-1/2 -translate-x-1/2" />
              
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-encre-700 mb-2">
                <NotebookPen className="w-4 h-4" /> 6. Vivre & Répondre à cette révélation
              </p>
              
              <label className="block font-serif text-xl sm:text-2xl font-bold text-encre-950 mb-3 leading-snug">
                Si cette vérité sur Dieu est réelle, comment vas-tu vivre avec Lui aujourd'hui ?
              </label>
              
              <textarea 
                value={step6Answer}
                onChange={(e) => setStep6Answer(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-encre-900/20 bg-white/60 p-4 text-encre-950 text-base leading-relaxed outline-none transition focus:border-or-700 focus:ring-2 focus:ring-or-400/20 placeholder:text-encre-900/35"
                placeholder="Ex : Lui faire confiance dans telle décision, m'approcher de Lui comme un Père, déposer telle inquiétude, ou poser un geste d'obéissance..."
              />

              <p className="flex items-center gap-2 text-xs text-encre-700 mt-3">
                <LockKeyhole className="w-3.5 h-3.5 text-or-800" />
                Ton engagement s'enregistre dans ton Carnet Spirituel.
              </p>
            </div>

            {/* Lockscreen Card Download */}
            <div className="rounded-2xl border border-encre-900/15 bg-parchemin-50/80 p-4 flex items-center justify-between shadow-sm">
              <div>
                <h4 className="font-bold text-sm text-encre-950">Garder le verset avec soi</h4>
                <p className="text-xs text-encre-700">Fond d'écran verrouillé pour smartphone</p>
              </div>
              <button 
                onClick={genererFondEcran}
                className="inline-flex items-center gap-2 bg-encre-950 hover:bg-encre-800 text-parchemin-50 text-xs font-bold px-4 py-2.5 rounded-full transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-or-400" /> Télécharger
              </button>
            </div>

            <button 
              onClick={handleFinish} 
              disabled={!step6Answer.trim()}
              className="w-full inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-encre-950 px-8 text-base font-bold text-parchemin-50 shadow-lg transition hover:-translate-y-0.5 hover:bg-encre-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <CheckCircle2 className="w-5 h-5 text-or-400" /> Valider mon temps à part
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
