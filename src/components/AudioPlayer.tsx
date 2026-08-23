'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, FastForward, Mic } from 'lucide-react';

interface AudioPlayerProps {
  src?: string;
  title: string;
  textToRead?: string;
}

export default function AudioPlayer({ src, title, textToRead }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isTTSActive, setIsTTSActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio file listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    const setAudioData = () => {
      setDuration(audio.duration || 0);
      setCurrentTime(audio.currentTime || 0);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime || 0);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [src]);

  // Clean up speech synthesis when unmounting
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const togglePlay = () => {
    // If we have an audio file
    if (src && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
      return;
    }

    // Fallback: Browser Text-To-Speech (TTS)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && textToRead) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setIsTTSActive(false);
      } else {
        window.speechSynthesis.cancel();
        // Clean text from html tags
        const cleanText = textToRead.replace(/<[^>]*>?/gm, ' ');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'fr-FR';
        utterance.rate = playbackRate;

        // Try to get a French voice
        const voices = window.speechSynthesis.getVoices();
        const frenchVoice = voices.find(v => v.lang.startsWith('fr'));
        if (frenchVoice) {
          utterance.voice = frenchVoice;
        }

        utterance.onend = () => {
          setIsPlaying(false);
          setIsTTSActive(false);
        };
        utterance.onerror = () => {
          setIsPlaying(false);
          setIsTTSActive(false);
        };

        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
        setIsTTSActive(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current && src) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackRate(newSpeed);
    if (audioRef.current && src) {
      audioRef.current.playbackRate = newSpeed;
    }
    if (isTTSActive && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Re-trigger TTS at new speed if playing
      togglePlay();
      setTimeout(togglePlay, 100);
    }
  };

  const toggleMute = () => {
    if (audioRef.current && src) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-amber-500/10 border border-amber-200/60 rounded-2xl p-4 md:p-5 shadow-sm my-6">
      {src && <audio ref={audioRef} src={src} preload="metadata" />}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className={`w-12 h-12 rounded-full text-white flex items-center justify-center shadow-md transition-all flex-shrink-0 active:scale-95 ${
              isPlaying ? 'bg-amber-600 animate-pulse' : 'bg-amber-500 hover:bg-amber-600'
            }`}
            aria-label={isPlaying ? 'Mettre en pause' : 'Écouter'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 ml-0.5 fill-white" />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {src ? 'Audio officiel' : 'Lecture audio (TTS)'}
              </span>
              {!src && <Mic className="w-3.5 h-3.5 text-amber-600" />}
            </div>
            <h4 className="font-serif font-bold text-slate-800 text-sm sm:text-base">{title}</h4>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleSpeedChange}
            className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors flex items-center gap-1"
            title="Vitesse de lecture"
          >
            <FastForward className="w-3 h-3" />
            {playbackRate}x
          </button>
          {src && (
            <button
              onClick={toggleMute}
              className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs transition-colors"
              aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {src ? (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 min-w-[36px]">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <span className="text-xs font-medium text-slate-500 min-w-[36px]">{formatTime(duration)}</span>
        </div>
      ) : (
        <p className="text-xs text-amber-800/80 mt-1 italic">
          💡 Cliquez sur lecture pour écouter cette fiche à voix haute grâce à la synthèse vocale intégrée.
        </p>
      )}
    </div>
  );
}
