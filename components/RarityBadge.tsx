import React from 'react';
import '../styles/rarity.css';

export const rarityColor = (r?: string) => {
  switch (r) {
    case 'uncommon': return 'bg-green-700 text-green-100 border-green-600';
    case 'rare': return 'bg-blue-800 text-blue-100 border-blue-600';
    case 'mythic': return 'bg-purple-800 text-purple-100 border-purple-600';
    case 'epic': return 'bg-gradient-to-br from-purple-700 to-pink-600 text-white border-pink-400';
    case 'legendary': return 'bg-gradient-to-br from-yellow-600 to-amber-400 text-black border-yellow-300';
    case 'common':
    default: return 'bg-gray-800 text-gray-100 border-gray-700';
  }
};

const EpicSparkles: React.FC = () => (
  <svg className="ml-2 w-4 h-4 -mr-1 origin-center" style={{ animation: 'spin-slow 6s linear infinite', transformOrigin: 'center' } as any} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f0abfc" stopOpacity="1" />
        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="12" cy="12" r="6" fill="url(#g)" />
  </svg>
);

const LegendaryFlare: React.FC = () => (
  <svg className="ml-2 w-5 h-5 -mr-1" style={{ animation: 'legendary-pulse 2.8s ease-in-out infinite', transformOrigin: 'center' } as any} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="lg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff7cc" stopOpacity="1" />
        <stop offset="60%" stopColor="#ffd166" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
      </radialGradient>
    </defs>
    <g>
      <circle cx="24" cy="24" r="10" fill="url(#lg)" />
      <path d="M24 6 L26 18 L38 20 L28 28 L30 40 L24 32 L18 40 L20 28 L10 20 L22 18 Z" fill="rgba(255,255,255,0.12)" />
    </g>
  </svg>
);

const RarityBadge: React.FC<{ rarity?: string }> = ({ rarity }) => {
  if (!rarity) return null;
  const cls = rarityColor(rarity);
  const extra = rarity === 'epic' ? 'epic-glow' : rarity === 'legendary' ? 'legendary-glow' : '';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${cls} ${extra}`}>
      <strong className="uppercase text-xs font-semibold">{String(rarity)}</strong>
      {rarity === 'epic' && <EpicSparkles />}
      {rarity === 'legendary' && <LegendaryFlare />}
    </span>
  );
};

export default RarityBadge;
