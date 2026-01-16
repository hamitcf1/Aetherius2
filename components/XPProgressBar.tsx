import React from 'react';
import '../styles/xp-progress.css';

interface XPProgressBarProps {
  current: number;
  required: number;
  total?: number;
  className?: string;
}

const XPProgressBar: React.FC<XPProgressBarProps> = ({ current, required, total, className = '' }) => {
  const safeRequired = Math.max(1, required || 1);
  const clamped = Math.max(0, Math.min(current, safeRequired));
  const percentage = Math.round((clamped / safeRequired) * 100);

  return (
    <div className={`xp-progress ${className}`}>
      <div className="xp-progress__header flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-skyrim-gold">
            <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs text-skyrim-text uppercase tracking-widest font-semibold">Experience</span>
        </div>
        <span className="text-xs text-skyrim-gold font-bold">{percentage}%</span>
      </div>

      <div
        className="xp-progress__bar rounded-full overflow-hidden border border-skyrim-border/50"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeRequired}
        aria-valuenow={Math.round(clamped)}
        aria-label={`Experience ${clamped} of ${safeRequired}`}
      >
        <div
          className="xp-progress__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-skyrim-gold font-semibold">{clamped.toLocaleString()} / {safeRequired.toLocaleString()} XP</span>
        <span className="text-xs text-gray-400">Total: {total?.toLocaleString() ?? ''} XP</span>
      </div>
    </div>
  );
};

export default XPProgressBar;
