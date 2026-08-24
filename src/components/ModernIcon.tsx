'use client';

import React from 'react';
import { 
  Crown,
  ShieldCheck,
  Heart,
  HeartHandshake,
  Scroll,
  Footprints,
  KeyRound,
  Unlock,
  Flame,
  Zap,
  Gift,
  Compass,
  Navigation,
  Globe,
  Users,
  Radio,
  BookOpenCheck,
  Layers,
  SunMedium,
  Milestone,
  BookOpen,
  LucideIcon
} from 'lucide-react';

export const FICHE_ICONS_MAP: Record<number, { icon: LucideIcon; bg: string; color: string; ring: string }> = {
  1: { icon: Crown, bg: 'bg-amber-100', color: 'text-amber-700', ring: 'ring-amber-200/80' },
  2: { icon: ShieldCheck, bg: 'bg-rose-100', color: 'text-rose-700', ring: 'ring-rose-200/80' },
  3: { icon: Heart, bg: 'bg-amber-100', color: 'text-amber-800', ring: 'ring-amber-200/80' },
  4: { icon: HeartHandshake, bg: 'bg-indigo-100', color: 'text-indigo-700', ring: 'ring-indigo-200/80' },
  5: { icon: Scroll, bg: 'bg-sky-100', color: 'text-sky-700', ring: 'ring-sky-200/80' },
  6: { icon: Footprints, bg: 'bg-teal-100', color: 'text-teal-700', ring: 'ring-teal-200/80' },
  7: { icon: KeyRound, bg: 'bg-orange-100', color: 'text-orange-700', ring: 'ring-orange-200/80' },
  8: { icon: Unlock, bg: 'bg-emerald-100', color: 'text-emerald-700', ring: 'ring-emerald-200/80' },
  9: { icon: Flame, bg: 'bg-red-100', color: 'text-red-700', ring: 'ring-red-200/80' },
  10: { icon: Zap, bg: 'bg-yellow-100', color: 'text-amber-700', ring: 'ring-yellow-200/80' },
  11: { icon: Gift, bg: 'bg-purple-100', color: 'text-purple-700', ring: 'ring-purple-200/80' },
  12: { icon: Compass, bg: 'bg-blue-100', color: 'text-blue-700', ring: 'ring-blue-200/80' },
  13: { icon: Navigation, bg: 'bg-cyan-100', color: 'text-cyan-700', ring: 'ring-cyan-200/80' },
  14: { icon: Globe, bg: 'bg-emerald-100', color: 'text-emerald-800', ring: 'ring-emerald-200/80' },
  15: { icon: Users, bg: 'bg-violet-100', color: 'text-violet-700', ring: 'ring-violet-200/80' },
  16: { icon: Radio, bg: 'bg-rose-100', color: 'text-rose-700', ring: 'ring-rose-200/80' },
  17: { icon: BookOpenCheck, bg: 'bg-indigo-100', color: 'text-indigo-800', ring: 'ring-indigo-200/80' },
  18: { icon: Layers, bg: 'bg-amber-100', color: 'text-amber-800', ring: 'ring-amber-200/80' },
  19: { icon: SunMedium, bg: 'bg-yellow-100', color: 'text-amber-700', ring: 'ring-yellow-200/80' },
  20: { icon: Milestone, bg: 'bg-purple-100', color: 'text-purple-800', ring: 'ring-purple-200/80' },
};

interface ModernFicheBadgeProps {
  ficheId: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ModernFicheBadge({ ficheId, size = 'md', className = '' }: ModernFicheBadgeProps) {
  const meta = FICHE_ICONS_MAP[ficheId] || {
    icon: BookOpen,
    bg: 'bg-slate-100',
    color: 'text-slate-700',
    ring: 'ring-slate-200',
  };

  const Icon = meta.icon;

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-11 h-11 rounded-2xl',
    lg: 'w-14 h-14 rounded-3xl',
  };

  const iconSizes = {
    sm: 15,
    md: 20,
    lg: 26,
  };

  return (
    <div
      className={`relative flex items-center justify-center ${meta.bg} ${meta.color} ${sizeClasses[size]} ring-1 ${meta.ring} shadow-2xs transition-transform duration-300 group-hover:scale-105 ${className}`}
    >
      <Icon size={iconSizes[size]} strokeWidth={1.75} />
    </div>
  );
}

interface ModernIconProps {
  icon: LucideIcon;
  variant?: 'amber' | 'indigo' | 'emerald' | 'rose' | 'slate' | 'navy';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ModernIcon({ icon: Icon, variant = 'amber', size = 'md', className = '' }: ModernIconProps) {
  const variantStyles = {
    amber: 'bg-gradient-to-br from-amber-100 to-amber-200/60 text-amber-800 ring-amber-300/60',
    indigo: 'bg-gradient-to-br from-indigo-100 to-indigo-200/60 text-indigo-800 ring-indigo-300/60',
    emerald: 'bg-gradient-to-br from-emerald-100 to-emerald-200/60 text-emerald-800 ring-emerald-300/60',
    rose: 'bg-gradient-to-br from-rose-100 to-rose-200/60 text-rose-800 ring-rose-300/60',
    slate: 'bg-gradient-to-br from-slate-100 to-slate-200/60 text-slate-700 ring-slate-300/60',
    navy: 'bg-gradient-to-br from-[#07162b] to-[#122642] text-amber-300 ring-amber-300/30',
  };

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-11 h-11 rounded-2xl',
    lg: 'w-14 h-14 rounded-3xl',
  };

  const iconSizes = {
    sm: 15,
    md: 20,
    lg: 26,
  };

  return (
    <div
      className={`relative flex items-center justify-center ${variantStyles[variant]} ${sizeClasses[size]} ring-1 shadow-2xs transition-transform duration-300 group-hover:scale-105 ${className}`}
    >
      <Icon size={iconSizes[size]} strokeWidth={1.75} />
    </div>
  );
}
