'use client';

import { Video } from 'lucide-react';

interface VideoPlayerProps {
  url?: string;
  title: string;
}

export default function VideoPlayer({ url, title }: VideoPlayerProps) {
  if (!url) return null;

  // Check if YouTube
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  let embedUrl = url;
  if (isYouTube) {
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (videoIdMatch && videoIdMatch[1]) {
      embedUrl = `https://www.youtube-nocookie.com/embed/${videoIdMatch[1]}`;
    }
  }

  return (
    <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-lg my-6">
      <div className="p-3 bg-slate-800/80 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Vidéo de la leçon</span>
        </div>
        <span className="text-xs text-slate-400 font-medium truncate max-w-xs">{title}</span>
      </div>

      <div className="relative aspect-video w-full bg-black">
        {isYouTube ? (
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <video src={url} controls className="w-full h-full object-cover">
            Votre navigateur ne supporte pas la lecture de vidéo.
          </video>
        )}
      </div>
    </div>
  );
}
