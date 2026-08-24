'use client';

import { useState, useRef } from 'react';
import { Book, Copy, Check, ImageIcon, Volume2, Pause } from 'lucide-react';
import ShareableVerseCard from './ShareableVerseCard';
import { getComparaisonVerset } from '@/lib/bibleVersions';

interface VersetCardProps {
  reference: string;
  text: string;
  type?: 'memorize' | 'read' | 'quote';
}

export default function VersetCard({ reference, text, type = 'quote' }: VersetCardProps) {
  const [copied, setCopied] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [version, setVersion] = useState<'lsg' | 'bds' | 's21' | 'nfc'>('bds');
  const [audioEnCours, setAudioEnCours] = useState(false);
  const [audioJoue, setAudioJoue] = useState<'lsg' | 'bds' | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const comparaison = getComparaisonVerset(reference);

  const texteAffiche =
    version === 'bds' && comparaison?.bds
      ? comparaison.bds
      : version === 's21' && comparaison?.s21
      ? comparaison.s21
      : version === 'nfc' && comparaison?.nfc
      ? comparaison.nfc
      : text;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`« ${texteAffiche} » — ${reference} (${version.toUpperCase()})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const jouerAudio = (source: 'lsg' | 'bds') => {
    const url = source === 'bds' ? comparaison?.audioBds : comparaison?.audioLsg;
    if (!url) return;

    if (audioEnCours && audioJoue === source) {
      audioRef.current?.pause();
      setAudioEnCours(false);
      setAudioJoue(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current
        .play()
        .then(() => {
          setAudioEnCours(true);
          setAudioJoue(source);
        })
        .catch(() => {
          setAudioEnCours(false);
          setAudioJoue(null);
        });
    }
  };

  const styles = {
    memorize: 'bg-amber-50/80 border-amber-200 text-amber-950',
    read: 'bg-indigo-50/80 border-indigo-200 text-indigo-950',
    quote: 'bg-white border-slate-200 text-slate-900',
  };

  const iconColors = {
    memorize: 'text-amber-600',
    read: 'text-indigo-600',
    quote: 'text-slate-500',
  };

  const label = type === 'memorize' ? 'À mémoriser' : type === 'read' ? 'À lire' : '';

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={() => {
          setAudioEnCours(false);
          setAudioJoue(null);
        }}
        onError={() => {
          setAudioEnCours(false);
          setAudioJoue(null);
        }}
      />

      <div
        className={`rounded-2xl p-5 border shadow-2xs relative group transition-all hover:shadow-md ${styles[type]}`}
      >
        <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Book className={`w-4 h-4 ${iconColors[type]}`} />
            <span className="font-bold font-serif text-sm">{reference}</span>
            {label && (
              <span
                className={`text-2xs uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-white shadow-2xs ${iconColors[type]}`}
              >
                {label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Version Toggles (Semeur par défaut) */}
            {comparaison && (
              <div className="flex items-center rounded-lg bg-black/5 p-0.5 mr-1">
                <button
                  type="button"
                  onClick={() => setVersion('bds')}
                  className={`px-2 py-0.5 rounded text-2xs font-bold transition-all ${
                    version === 'bds' ? 'bg-white shadow-xs text-indigo-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="La Bible du Semeur (Traduction du livret)"
                >
                  Semeur
                </button>
                <button
                  type="button"
                  onClick={() => setVersion('lsg')}
                  className={`px-2 py-0.5 rounded text-2xs font-bold transition-all ${
                    version === 'lsg' ? 'bg-white shadow-xs text-amber-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Louis Segond 1910"
                >
                  LSG
                </button>
                {comparaison.s21 && (
                  <button
                    type="button"
                    onClick={() => setVersion('s21')}
                    className={`px-2 py-0.5 rounded text-2xs font-bold transition-all ${
                      version === 's21' ? 'bg-white shadow-xs text-emerald-900' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Segond 21"
                  >
                    S21
                  </button>
                )}
              </div>
            )}

            {/* Real Bible Audio (Semeur par défaut) */}
            {comparaison?.audioBds && (
              <button
                type="button"
                onClick={() => jouerAudio('bds')}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-2xs font-bold ${
                  audioEnCours && audioJoue === 'bds'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-indigo-800 hover:bg-white/80'
                }`}
                title="Écouter en Bible du Semeur (Audio réel)"
              >
                {audioEnCours && audioJoue === 'bds' ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Audio Semeur</span>
              </button>
            )}

            {comparaison?.audioLsg && (
              <button
                type="button"
                onClick={() => jouerAudio('lsg')}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-2xs font-bold ${
                  audioEnCours && audioJoue === 'lsg'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-amber-700 hover:bg-white/80'
                }`}
                title="Écouter en Louis Segond (Audio réel)"
              >
                {audioEnCours && audioJoue === 'lsg' ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">LSG</span>
              </button>
            )}

            <button
              onClick={() => setShowImageModal(true)}
              className="text-slate-400 hover:text-amber-600 transition-colors p-1.5 rounded-lg hover:bg-white/80"
              title="Générer une image pour WhatsApp / Instagram"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={copyToClipboard}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-white/80"
              title="Copier le verset"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <p className="text-sm sm:text-base italic leading-relaxed font-serif">« {texteAffiche} »</p>

        <div className="mt-2.5 flex items-center justify-between text-2xs text-slate-500">
          <span>Version : {version === 'bds' ? 'La Bible du Semeur' : version === 's21' ? 'Segond 21' : version === 'nfc' ? 'Nouvelle Français Courant' : 'Louis Segond 1910'}</span>
        </div>
      </div>

      {showImageModal && (
        <ShareableVerseCard
          reference={reference}
          text={texteAffiche}
          translation={version.toUpperCase()}
          onClose={() => {
            audioRef.current?.pause();
            setAudioEnCours(false);
            setShowImageModal(false);
          }}
        />
      )}
    </>
  );
}
