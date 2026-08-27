'use client';

import {
  CalendarDays,
  Clock,
  Lock,
  MapPin,
  Monitor,
  Users,
  Video,
} from 'lucide-react';
import { formatDistance, proximityBand } from '@/lib/geo';
import type { GroupMatch } from '@/lib/types';

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

const MODE_LABEL: Record<string, { label: string; icon: typeof Users }> = {
  presentiel: { label: 'En présentiel', icon: MapPin },
  ligne: { label: 'Entièrement en ligne', icon: Video },
  hybride: { label: 'Présentiel + visio', icon: Monitor },
};

const TONE_STYLES: Record<string, string> = {
  proche: 'bg-emerald-400/15 text-emerald-200 border-emerald-300/25',
  ville: 'bg-or-400/15 text-or-200 border-or-300/25',
  region: 'bg-sky-400/15 text-sky-200 border-sky-300/25',
  lointain: 'bg-white/8 text-parchemin-100/70 border-white/15',
  inconnu: 'bg-white/8 text-parchemin-100/60 border-white/12',
};

interface GroupMatchCardProps {
  match: GroupMatch;
  onSelect: (match: GroupMatch) => void;
  selected?: boolean;
}

export default function GroupMatchCard({ match, onSelect, selected }: GroupMatchCardProps) {
  const { group, distanceKm, seatsLeft, joinable, reason } = match;
  const band = proximityBand(distanceKm);
  const mode = MODE_LABEL[group.meeting.mode] ?? MODE_LABEL.presentiel;
  const ModeIcon = mode.icon;

  return (
    <button
      type="button"
      onClick={() => joinable && onSelect(match)}
      disabled={!joinable}
      aria-disabled={!joinable}
      className={`group relative w-full overflow-hidden rounded-3xl border p-5 text-left transition-all duration-300 ${
        selected
          ? 'border-or-400/70 bg-or-400/10 shadow-[0_0_0_1px_rgba(246,196,83,0.35),0_18px_45px_-20px_rgba(246,196,83,0.6)]'
          : joinable
            ? 'border-white/12 bg-white/[0.055] hover:-translate-y-0.5 hover:border-or-300/40 hover:bg-white/[0.09]'
            : 'cursor-not-allowed border-white/8 bg-white/[0.025] opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-lg font-bold text-parchemin-100">{group.name}</h3>
            {group.demo && (
              <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-2xs font-bold text-parchemin-100/60">
                Exemple
              </span>
            )}
          </div>
          <p className="mt-0.5 text-2xs text-parchemin-100/55">
            Animé par {group.leaderName} · {group.place.city}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-2xs font-bold ${
            TONE_STYLES[band.tone]
          }`}
        >
          {formatDistance(distanceKm)}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-parchemin-100/70">
        {group.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-2xs text-parchemin-100/65">
        <span className="inline-flex items-center gap-1.5">
          <ModeIcon className="h-3.5 w-3.5 text-or-300/80" strokeWidth={2} />
          {mode.label}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-or-300/80" strokeWidth={2} />
          {group.meeting.firstMeetingDate ? (
            <span>
              1ère séance le{' '}
              {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(
                new Date(group.meeting.firstMeetingDate + 'T12:00:00')
              )}
            </span>
          ) : (
            <span>
              {group.meeting.rhythm === 'bimensuel' ? 'Un ' : 'Chaque '}
              {WEEKDAYS[group.meeting.weekday]}
              {group.meeting.rhythm === 'bimensuel' ? ' sur deux' : ''}
            </span>
          )}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-or-300/80" strokeWidth={2} />
          {group.meeting.time}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3.5">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {Array.from({ length: Math.min(group.membersCount, 6) }).map((_, index) => (
              <span
                key={index}
                className="h-5 w-5 rounded-full border border-encre-950 bg-gradient-to-br from-or-300 to-or-500"
              />
            ))}
            {Array.from({ length: Math.max(0, seatsLeft) }).map((_, index) => (
              <span
                key={`libre-${index}`}
                className="h-5 w-5 rounded-full border border-dashed border-white/30 bg-white/5"
              />
            ))}
          </div>
          <span className="text-2xs font-semibold text-parchemin-100/70">
            {group.membersCount}/{group.capacity}
            {seatsLeft > 0 && (
              <span className="text-parchemin-100/45">
                {' '}
                · {seatsLeft} place{seatsLeft > 1 ? 's' : ''}
              </span>
            )}
          </span>
        </div>

        {joinable ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-or-400/15 px-3 py-1.5 text-2xs font-bold text-or-200 transition-colors group-hover:bg-or-400 group-hover:text-encre-950">
            <Users className="h-3.5 w-3.5" strokeWidth={2} />
            Demander à rejoindre
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-2xs font-bold text-parchemin-100/55">
            <Lock className="h-3.5 w-3.5" strokeWidth={2} />
            {reason}
          </span>
        )}
      </div>

    </button>
  );
}
