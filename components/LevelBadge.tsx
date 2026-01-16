import React from 'react';
import '../styles/level-badges.css';

interface LevelBadgeProps {
  level: number;
  size?: number; // px
  className?: string;
  ariaLabel?: string;
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

const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 64, className = '', ariaLabel }) => {
  const tier = tierForLevel(level);
  const [c1, c2] = colorForTier(tier);
  const label = tier === 'default' ? 'Başlangıç' : `Rütbe ${tier}`;

  return (
    <div
      className={`level-badge ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel || `${label} — Seviye ${level}`}
      title={`${label} — Seviye ${level}`}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="level-badge__svg">
        <defs>
          <linearGradient id={`lg-${tier}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        {/* simple shield */}
        <path d="M50 8 L84 24 L84 58 C84 76 66 88 50 96 C34 88 16 76 16 58 L16 24 Z" fill={`url(#lg-${tier})`} stroke="#111" strokeOpacity="0.25" strokeWidth="2" />
        {/* inner crest */}
        <path d="M50 18 L68 30 L68 54 C68 66 58 74 50 78 C42 74 32 66 32 54 L32 30 Z" fill="rgba(255,255,255,0.06)" />
        <text x="50" y="56" textAnchor="middle" fontFamily="serif" fontSize="30" fill="#fff" stroke="#000" strokeOpacity="0.2" strokeWidth="0.6" dy="0.35em">{level}</text>
      </svg>
      <div className="level-badge__label">{label}</div>
    </div>
  );
};

export default LevelBadge;
