import { Companion } from '../types';

// Simple companion XP and leveling helper
export const applyCompanionXp = (companion: Companion, xpGain: number): Companion => {
  const next = { ...companion } as Companion;
  next.xp = (next.xp || 0) + xpGain;

  // Level up thresholds: level * 10
  let leveled = 0;
  while (next.xp !== undefined && next.xp >= (next.level || 1) * 10) {
    const req = (next.level || 1) * 10;
    next.xp = next.xp - req;
    next.level = (next.level || 1) + 1;
    // Apply simple stat increases
    next.maxHealth = (next.maxHealth || next.health || 50) + 10;
    next.health = Math.min((next.health || next.maxHealth || 0) + 10, next.maxHealth);
    next.damage = (next.damage || 1) + 2;
    next.armor = (next.armor || 0) + 1;
    next.loyalty = Math.min(100, (next.loyalty || 50) + 5);
    leveled += 1;
  }

  return next;
};
