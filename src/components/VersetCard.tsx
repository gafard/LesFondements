'use client';

import { Book, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface VersetCardProps {
  reference: string;
  text: string;
  type?: 'memorize' | 'read' | 'quote';
}

export default function VersetCard({ reference, text, type = 'quote' }: VersetCardProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${text} - ${reference}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const styles = {
    memorize: 'bg-amber-50 border-amber-200 text-amber-900',
    read: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    quote: 'bg-slate-50 border-slate-200 text-slate-800'
  };

  const iconColors = {
    memorize: 'text-amber-500',
    read: 'text-indigo-500',
    quote: 'text-slate-500'
  };

  const label = type === 'memorize' ? 'À mémoriser' : type === 'read' ? 'À lire' : '';

  return (
    <div className={`rounded-xl p-5 border shadow-sm relative group ${styles[type]}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Book className={`w-5 h-5 ${iconColors[type]}`} />
          <span className="font-bold font-serif">{reference}</span>
          {label && (
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white opacity-80 ${iconColors[type]}`}>
              {label}
            </span>
          )}
        </div>
        <button 
          onClick={copyToClipboard}
          className="text-slate-400 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 p-1"
          title="Copier le verset"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-lg italic leading-relaxed">« {text} »</p>
    </div>
  );
}
