import { describe, it, expect } from 'vitest';
import { applyCompanionXp } from '../services/companionsService';

describe('applyCompanionXp', () => {
  it('applies xp and levels up when threshold reached', () => {
    const c: any = { id: 'c1', name: 'Alf', level: 1, xp: 0, health: 50, maxHealth: 50, damage: 5, armor: 0, loyalty: 50 };
    const res = applyCompanionXp(c, 15); // level1 threshold = 10 -> should level to 2 and keep 5 xp
    expect(res.level).toBe(2);
    expect(res.xp).toBe(5);
    expect(res.maxHealth).toBeGreaterThan(50);
    expect(res.damage).toBeGreaterThan(5);
    expect(res.loyalty).toBeGreaterThan(50);
  });
});
