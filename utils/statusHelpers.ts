export interface IncomingStatusEffect {
  id?: string;
  name?: string;
  type?: string; // 'buff' | 'debuff' | 'dot' | etc.
  icon?: string;
  duration?: number;
  description?: string;
  effects?: any[];
}

export const normalizeStatusEffect = (s: IncomingStatusEffect, fallbackId: string) => {
  const id = s.id || fallbackId;
  let type = (s.type as any) || 'neutral';
  const rawName = (s.name || '').trim();

  const nameGuessFromId = (idStr: string) => {
    const low = idStr.toLowerCase();
    if (low.includes('burn') || low.includes('dot') || low.includes('blaze') || low.includes('ember')) return 'Burning';
    if (low.includes('poison')) return 'Poisoned';
    if (low.includes('candle') || low.includes('light')) return 'Candlelight';
    if (low.includes('regen') || low.includes('regeneration')) return 'Regeneration';
    if (low.includes('haste') || low.includes('speed')) return 'Hasted';
    if (/^buff\d*$/i.test(low) || low.startsWith('buff')) return 'Buff';
    if (/^debuff\d*$/i.test(low) || low.startsWith('debuff')) return 'Debuff';
    return '';
  };

  const deriveName = () => {
    if (rawName && !/^\[.*\]$/.test(rawName)) return rawName; // prefer provided name unless bracketed placeholder
    if (s.type && typeof s.type === 'string') {
      const t = s.type.toLowerCase();
      // Prefer id-based guess for more specific names like Burning
      const guess = nameGuessFromId(id);
      if (guess) return guess;
      if (t === 'dot') return 'Damage over Time';
      if (t === 'buff') return 'Buff';
      if (t === 'debuff') return 'Debuff';
      if (t === 'heal') return 'Healed';
    }
    const guess = nameGuessFromId(id);
    if (guess) return guess;
    return 'Effect';
  };

  const name = deriveName();

  // Make a best-effort type mapping
  if (!['buff', 'debuff', 'neutral'].includes(type)) {
    const lt = (type || '').toString().toLowerCase();
    if (lt === 'dot' || lt.includes('burn') || lt.includes('poison')) type = 'debuff';
    else if (lt === 'buff') type = 'buff';
    else type = 'neutral';
  }

  const icon = s.icon || (type === 'buff' ? '✨' : type === 'debuff' ? '🔥' : '🌀');
  const description = s.description || (name === 'Burning' ? 'Taking damage over time.' : s.type ? `${s.type} effect` : 'An active effect.');

  return {
    id,
    name,
    type: type as 'buff' | 'debuff' | 'neutral',
    icon,
    duration: s.duration,
    description,
    effects: s.effects || []
  };
};
