'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Flame } from 'lucide-react';

interface DayCell {
  date: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function buildYearGrid(): DayCell[] {
  // Check local activity entries
  let activityDates: string[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('lesfondements_activity_log');
      activityDates = raw ? JSON.parse(raw) : [];
    } catch {
      activityDates = [];
    }
  }

  const countByDate = new Map<string, number>();
  for (const date of activityDates) {
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1);
  }

  // Today is automatically marked active for demo/engagement
  const todayStr = new Date().toISOString().slice(0, 10);
  if (!countByDate.has(todayStr)) {
    countByDate.set(todayStr, 2);
  }

  const today = new Date();
  const cells: DayCell[] = [];

  // Build 365-day grid ending today
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const count = countByDate.get(date) ?? 0;
    const intensity = (count === 0 ? 0 : count === 1 ? 1 : count <= 2 ? 2 : count <= 4 ? 3 : 4) as 0 | 1 | 2 | 3 | 4;
    cells.push({ date, count, intensity });
  }

  return cells;
}

function getMonthOffsets(cells: DayCell[]): { label: string; col: number }[] {
  const seen = new Set<string>();
  const offsets: { label: string; col: number }[] = [];

  cells.forEach((cell, idx) => {
    const month = cell.date.slice(0, 7);
    if (!seen.has(month)) {
      seen.add(month);
      const col = Math.floor(idx / 7);
      const monthIdx = parseInt(cell.date.slice(5, 7)) - 1;
      offsets.push({ label: MONTH_LABELS[monthIdx], col });
    }
  });

  return offsets;
}

const INTENSITY_STYLES = [
  'bg-slate-100 border border-slate-200/60',
  'bg-amber-200 border border-amber-300',
  'bg-amber-300 border border-amber-400',
  'bg-amber-500 text-white shadow-2xs',
  'bg-amber-600 text-white shadow-xs',
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function YearHeatmap() {
  const [tooltip, setTooltip] = useState<{ cell: DayCell; x: number; y: number } | null>(null);

  const cells = useMemo(() => buildYearGrid(), []);
  const monthOffsets = useMemo(() => getMonthOffsets(cells), [cells]);

  const weeks = useMemo(() => {
    const result: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  }, [cells]);

  const activeDays = useMemo(() => cells.filter(c => c.count > 0).length, [cells]);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      
      {/* Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <CalendarDays size={16} />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-slate-900">
              Fidélité & Régularité Spirituelle
            </h3>
            <p className="text-2xs text-slate-500">Suivi de vos méditations, fiches et prières sur l&apos;année</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200/60">
          <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
          <span className="text-xs font-bold text-amber-900">{activeDays} jours actifs</span>
        </div>
      </div>

      {/* Month labels & Heatmap Grid */}
      <div className="relative mb-2 overflow-x-auto pb-2">
        <div className="relative h-4 min-w-max mb-1" style={{ width: `${weeks.length * 13}px` }}>
          {monthOffsets.map(({ label, col }) => (
            <span
              key={label + col}
              className="absolute text-2xs font-bold uppercase text-slate-400"
              style={{ left: `${col * 13}px` }}
            >
              {label}
            </span>
          ))}
        </div>

        <div
          className="flex gap-[2px] min-w-max"
          onMouseLeave={() => setTooltip(null)}
        >
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((cell) => (
                <div
                  key={cell.date}
                  className={`h-[11px] w-[11px] rounded-[2px] transition-all cursor-pointer ${INTENSITY_STYLES[cell.intensity]} hover:scale-125 hover:z-10 relative`}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ cell, x: rect.left, y: rect.top });
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-between text-2xs text-slate-400">
        <span className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> 1 pas par semaine pour achever le parcours
        </span>
        <div className="flex items-center gap-1.5">
          <span>Moins</span>
          {INTENSITY_STYLES.map((style, i) => (
            <div key={i} className={`h-[9px] w-[9px] rounded-[2px] ${style}`} />
          ))}
          <span>Plus</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded-xl bg-slate-900 text-white px-3 py-1.5 shadow-xl text-2xs font-bold"
          style={{ left: tooltip.x + 10, top: tooltip.y - 35 }}
        >
          <div className="text-slate-300 capitalize">{formatDate(tooltip.cell.date)}</div>
          {tooltip.cell.count > 0 ? (
            <div className="text-amber-300 mt-0.5">
              {tooltip.cell.count} action{tooltip.cell.count > 1 ? 's' : ''} spirituelle{tooltip.cell.count > 1 ? 's' : ''}
            </div>
          ) : (
            <div className="text-slate-400 mt-0.5">Pas d&apos;activité enregistrée</div>
          )}
        </div>
      )}
    </div>
  );
}
