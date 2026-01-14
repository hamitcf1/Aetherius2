import { describe, it, expect } from 'vitest';
import { applyTurnRegen } from '../services/combatService';

describe('applyTurnRegen', () => {
  it('applies the expected per-turn magicka regen amount', () => {
    const state = { turn: 1, combatLog: [], enemies: [] } as any;
    const playerStats = {
      maxMagicka: 50,
      currentMagicka: 20,
      maxStamina: 100,
      currentStamina: 50,
      regenMagickaPerSec: 1, // 1 per second -> 4 per turn
      regenStaminaPerSec: 0
    } as any;

    const res = applyTurnRegen(state as any, playerStats, 4);
    expect(res.newPlayerStats.currentMagicka).toBe(24);
    // Ensure log entry was added
    expect(res.newState.combatLog.some((l: any) => l.action === 'regen')).toBe(true);
  });

  it('does not exceed max magicka', () => {
    const state = { turn: 1, combatLog: [], enemies: [] } as any;
    const playerStats = {
      currentMagicka: 49,
      maxMagicka: 50,
      regenMagickaPerSec: 1,
      regenStaminaPerSec: 0
    } as any;

    const res = applyTurnRegen(state as any, playerStats, 4);
    expect(res.newPlayerStats.currentMagicka).toBe(50);
  });
});