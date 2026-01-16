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
      <div className="xp-progress__header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-skyrim-gold"><path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <span className="text-xs text-skyrim-text uppercase tracking-widest">Experience</span>
        </div>
        <div className="text-[10px] text-gray-500">{percentage}%</div>
      </div>

      <div
        className="xp-progress__bar mt-2 rounded-full overflow-hidden border border-skyrim-border/50 bg-gray-900"
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

      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-skyrim-gold font-semibold">{clamped.toLocaleString()} / {safeRequired.toLocaleString()} XP</span>
        <span className="text-[10px] text-gray-500">Total: {total?.toLocaleString() ?? ''}</span>
      </div>
    </div>
  );
};

export default XPProgressBar;
