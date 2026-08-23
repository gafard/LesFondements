'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProgressBar({ current, total, showLabel = false, size = 'md' }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-slate-700">{current} / {total} fiches</span>
          <span className="text-slate-500 font-bold">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className="bg-gradient-to-r from-amber-400 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
