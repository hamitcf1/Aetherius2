import React, { useEffect, useState } from 'react';
import '../styles/level-badges.css';

interface LevelBadgeProps {
  level: number;
  size?: number; // px
  className?: string;
  ariaLabel?: string;
  compact?: boolean;
}

function tierForLevel(level: number) {
  if (!level || level <= 5) return 'default';
  return `${Math.ceil(level / 10) * 10}`; // 10,20,30...
}

const colorForTier = (tier: string) => {
  switch (tier) {
    case 'default':
      return ['#b8860b', '#ffd700'];
    case '10':
      return ['#9bd3ff', '#5aa9ff'];
    case '20':
      return ['#b98cff', '#7a4bff'];
    case '30':
      return ['#ff9b9b', '#ff5a5a'];
    case '40':
      return ['#9bffda', '#2be39a'];
    default:
      return ['#cfcfcf', '#9b9b9b'];
  }
};

const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 64, className = '', ariaLabel, compact = false }) => {
  const tier = tierForLevel(level);
  const [c1, c2] = colorForTier(tier);
  // No rank label needed - just show level number

  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    // Listen for global level-up pulses and trigger local pulse animation
    const handler = (ev: Event) => {
      try {
        const ce = ev as CustomEvent;
        if (!ce?.detail || (ce.detail.level && Number(ce.detail.level) !== Number(level))) {
          // allow pulse even if level doesn't match — highlights global event
        }
      } catch (e) {
        // ignore
      }
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 1200);
      return () => clearTimeout(t);
    };

    window.addEventListener('levelUpPulse', handler as EventListener);
    return () => window.removeEventListener('levelUpPulse', handler as EventListener);
  }, [level]);

  // Decorative elements vary per tier
  const renderDecoration = () => {
    if (tier === 'default') return null;
    // crown for early tiers, stars for higher
    if (tier === '10') {
      return (
        <g className="level-badge__decor">
          <path d="M30 18 L34 10 L40 18 L46 10 L50 18 L60 6 L70 18 L70 36 L30 36 Z" fill="rgba(255,255,255,0.06)" />
        </g>
      );
    }
    if (tier === '20') {
      return (
        <g className="level-badge__decor">
          <circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.08)" />
          <circle cx="80" cy="20" r="3" fill="rgba(255,255,255,0.08)" />
        </g>
      );
    }
    if (tier === '30') {
      return (
        <g className="level-badge__decor">
          <path d="M50 6 L56 18 L68 20 L58 28 L60 40 L50 34 L40 40 L42 28 L32 20 L44 18 Z" fill="rgba(255,255,255,0.06)" />
        </g>
      );
    }
    return null;
  };

  // compute a font size proportional to the badge size so compact HUD badges remain legible
  const computedFontSize = Math.max(12, Math.round(size * 0.45));
  const computedStroke = Math.max(0.6, Math.round(size * 0.012 * 10) / 10);

  return (
    <div
      className={`level-badge ${pulsing ? 'level-badge--pulse' : ''} ${compact ? 'level-badge--compact' : ''} ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel || `Level ${level}`}
      title={`Level ${level}`}
      data-pulsing={pulsing ? 'true' : 'false'}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="level-badge__svg">
        <defs>
          <linearGradient id={`lg-${tier}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>

        {/* base shield */}
        <path d="M50 8 L84 24 L84 58 C84 76 66 88 50 96 C34 88 16 76 16 58 L16 24 Z" fill={`url(#lg-${tier})`} stroke="#000" strokeOpacity="0.32" strokeWidth="2" />

        {/* inner crest (darker, not white overlay) to improve contrast for the number */}
        <path d="M50 18 L68 30 L68 54 C68 66 58 74 50 78 C42 74 32 66 32 54 L32 30 Z" fill="rgba(0,0,0,0.16)" />

        {/* decorations per tier */}
        {renderDecoration()}

        {/* level number */}
        <text x="50" y="56" textAnchor="middle" fontFamily="serif" fontSize={computedFontSize} fill="#ffffff" stroke="#000" strokeOpacity="0.45" strokeWidth={computedStroke} dy="0.35em">{level}</text>
      </svg>
    </div>
  );
};

export default LevelBadge;
