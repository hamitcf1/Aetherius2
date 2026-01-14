import { describe, it, expect } from 'vitest';
import { applyLevelUpToCharacter } from '../utils/levelUpHelpers';
import { calculatePlayerCombatStats } from '../services/combatService';


describe('applyLevelUpToCharacter', () => {
  it('preserves custom stats (e.g., regen) when leveling up', () => {
    const char = {
      id: 'c1',
      name: 'Test Hero',
      level: 9,
      experience: 0,
      stats: {
        health: 100,
        magicka: 80,
        stamina: 90,
        regenHealthPerSec: 0.5,
        regenMagickaPerSec: 0.0
      },
      perkPoints: 0,
    } as any;

    const out = applyLevelUpToCharacter(char, 10, 0, 'health');

    expect(out.level).toBe(10);
    expect(out.stats.health).toBe(110); // +10 applied
    expect(out.stats.regenHealthPerSec).toBe(0.5); // preserved
    expect(out.perkPoints).toBe(1);
  });

  it('retains default regen when stats.key is absent after level up', () => {
    const char = {
      id: 'c2',
      name: 'NoRegen Hero',
      level: 9,
      experience: 0,
      stats: {
        health: 100,
        magicka: 100,
        stamina: 100
      }
    } as any;

    const out = applyLevelUpToCharacter(char, 10, 0, 'health');
    const combat = calculatePlayerCombatStats(out, []);
    expect(combat.regenHealthPerSec).toBeCloseTo(0.25); // default fallback
  });
});