'use client';

import { useCallback, useRef, useState } from 'react';
import { Download, Share2, X, Bookmark } from 'lucide-react';

interface ShareableVerseCardProps {
  reference: string;
  text: string;
  translation?: string;
  onClose: () => void;
}

const GRADIENT_THEMES = [
  { name: 'Fondements (Nuit & Or)', stops: ['#07162b', '#0e2b52', '#1b4377'], textColor: '#fff8e8', refColor: '#f6c453', quoteColor: '#f6c453' },
  { name: 'Parchemin Sacré', stops: ['#2c1810', '#5c3317', '#8b5a2b'], textColor: '#fef3c7', refColor: '#fcd34d', quoteColor: '#fcd34d' },
  { name: 'Aurore Céleste', stops: ['#1e1b4b', '#3730a3', '#4f46e5'], textColor: '#f8fafc', refColor: '#a5b4fc', quoteColor: '#c7d2fe' },
  { name: 'Feu de l\'Esprit', stops: ['#3b0764', '#86198f', '#c026d3'], textColor: '#fdf4ff', refColor: '#f0abfc', quoteColor: '#f5d0fe' },
  { name: 'Émeraude & Paix', stops: ['#022c22', '#065f46', '#047857'], textColor: '#ecfdf5', refColor: '#6ee7b7', quoteColor: '#a7f3d0' },
];

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxCharsPerLine) {
      if (line) lines.push(line);
      line = word;
      if (lines.length >= 10) break;
      continue;
    }
    line = next;
  }
  if (line && lines.length < 11) lines.push(line);
  return lines.slice(0, 11);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateSVG(reference: string, text: string, translation: string, theme: typeof GRADIENT_THEMES[0]): string {
  const lines = wrapText(text, 34);
  const fontSize = lines.length > 7 ? 38 : 44;
  const lineHeight = fontSize + 12;

  const textNodes = lines
    .map((l, i) => `<tspan x="90" dy="${i === 0 ? 0 : lineHeight}">${esc(l)}</tspan>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.stops[0]}"/>
      <stop offset="50%" stop-color="${theme.stops[1]}"/>
      <stop offset="100%" stop-color="${theme.stops[2]}"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)" rx="48"/>
  <rect x="44" y="44" width="992" height="1262" rx="36" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
  
  <!-- Subtle inner golden border -->
  <rect x="54" y="54" width="972" height="1242" rx="28" fill="none" stroke="${theme.refColor}" stroke-width="1" opacity="0.3"/>
  
  <!-- Quote mark -->
  <text x="80" y="180" fill="${theme.quoteColor}" font-family="Georgia,serif" font-size="140" opacity="0.35">❝</text>
  
  <!-- Reference -->
  <text x="90" y="240" fill="${theme.refColor}" font-family="Georgia,serif" font-size="40" font-weight="700" letter-spacing="1">${esc(reference)}</text>
  
  <!-- Verse text -->
  <text x="90" y="360" fill="${theme.textColor}" font-family="Georgia,serif" font-size="${fontSize}" font-weight="400" font-style="italic">${textNodes}</text>
  
  <!-- App badge & translation tag -->
  <rect x="90" y="1210" width="220" height="46" rx="14" fill="rgba(255,255,255,0.12)"/>
  <text x="110" y="1241" fill="${theme.refColor}" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="700">${esc(translation)} • Livret</text>
  
  <!-- App name -->
  <text x="980" y="1241" fill="rgba(255,255,255,0.6)" font-family="Georgia,serif" font-size="22" font-weight="600" text-anchor="end">Les Fondements</text>
</svg>`;
}

async function svgToPng(svgString: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
        'image/png',
        0.95
      );
    };
    img.onerror = () => reject(new Error('Failed to load SVG'));
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    img.src = URL.createObjectURL(blob);
  });
}

export default function ShareableVerseCard({ reference, text, translation = 'Parcours', onClose }: ShareableVerseCardProps) {
  const [themeIndex, setThemeIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const theme = GRADIENT_THEMES[themeIndex];

  const svgString = generateSVG(reference, text, translation, theme);
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    try {
      const blob = await svgToPng(svgString);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Verset_${reference.replace(/\s+/g, '_')}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[ShareableVerseCard] Download failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [svgString, reference]);

  const handleShare = useCallback(async () => {
    setGenerating(true);
    try {
      const blob = await svgToPng(svgString);
      const file = new File([blob], `${reference.replace(/\s+/g, '_')}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: reference,
          text: `« ${text} » — ${reference}`,
          files: [file],
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      const erreur = err as { name?: string } | null;
      if (erreur?.name !== 'AbortError') {
        console.error('[ShareableVerseCard] Share failed:', err);
        handleDownload();
      }
    } finally {
      setGenerating(false);
    }
  }, [svgString, reference, text, handleDownload]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Bookmark className="w-4 h-4 text-amber-500" />
          <h3 className="text-base font-bold font-serif text-slate-900">Image de verset (Story & Statut)</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">Exportez en haute définition pour WhatsApp, Instagram ou vos amis.</p>

        {/* Visual Preview */}
        <div ref={previewRef} className="rounded-2xl overflow-hidden shadow-md mb-4 border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu SVG en data URL, non optimisable par next/image */}
          <img src={svgDataUrl} alt={`${reference} card`} className="w-full h-auto" />
        </div>

        {/* Theme Picker */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {GRADIENT_THEMES.map((t, i) => (
            <button
              key={t.name}
              onClick={() => setThemeIndex(i)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                themeIndex === i
                  ? 'ring-2 ring-amber-500 bg-amber-50 text-amber-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ background: `linear-gradient(135deg, ${t.stops[0]}, ${t.stops[2]})` }}
              />
              {t.name}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#07162b] text-white px-4 py-3 text-xs font-bold hover:bg-indigo-950 transition-all active:scale-98 disabled:opacity-50"
          >
            <Download size={15} />
            {generating ? 'Export...' : 'Télécharger l\'image'}
          </button>
          <button
            onClick={handleShare}
            disabled={generating}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#07162b] px-4 py-3 text-xs font-bold transition-all active:scale-98 disabled:opacity-50"
          >
            <Share2 size={15} />
            {generating ? 'Export...' : 'Partager'}
          </button>
        </div>
      </div>
    </div>
  );
}
