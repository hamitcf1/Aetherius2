import { describe, it, expect } from 'vitest';
import { applyLevelUpToCharacter } from '../utils/levelUpHelpers';
import { calculatePlayerCombatStats } from '../services/combatService';


describe('applyLevelUpToCharacter', () => {
  it('preserves custom stats (e.g., magicka values) when leveling up', () => {
    const char = {
      id: 'c1',
      name: 'Test Hero',
      level: 9,
      experience: 0,
      stats: {
        health: 100,
        magicka: 80,
        stamina: 90,
        regenMagickaPerSec: 0.5
      },
      perkPoints: 0,
    } as any;

    const out = applyLevelUpToCharacter(char, 10, 0, 'health');

    expect(out.level).toBe(10);
    expect(out.stats.health).toBe(110); // +10 applied
    expect(out.stats.regenMagickaPerSec).toBe(0.5); // preserved
    expect(out.perkPoints).toBe(1);
  });

  it('has zero regen at level 10 without regen perks (regen requires perk unlock)', () => {
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
    // At level 10+, regen is 0 unless regen perks are unlocked
    expect(combat.regenMagickaPerSec).toBeCloseTo(0);
  });

  it('restores all current vitals to max when leveling up', () => {
    const char = {
      id: 'c3',
      name: 'Wounded Hero',
      level: 9,
      experience: 0,
      stats: { health: 100, magicka: 100, stamina: 100 },
      currentVitals: { currentHealth: 10, currentMagicka: 5, currentStamina: 20 },
      perkPoints: 0,
    } as any;

    const out = applyLevelUpToCharacter(char, 10, 0, 'health');

    expect(out.currentVitals?.currentHealth).toBe(110);
    expect(out.currentVitals?.currentMagicka).toBe(100);
    expect(out.currentVitals?.currentStamina).toBe(100);
  });
});