import { describe, it, expect } from 'vitest';
import { initializeCombat } from '../services/combatService';

describe('initializeCombat', () => {
  it('places companions into allies list not enemies', () => {
    const companions = [{ id: 'c1', name: 'Alf', level: 3, health: 30, maxHealth: 30, damage: 5, armor: 0, behavior: 'follow', autoLoot: false } as any];
    const enemies = [{ id: 'e1', name: 'Bandit', level: 2, maxHealth: 20, currentHealth: 20 } as any];
    const state = initializeCombat(enemies as any, 'field', false, true, false, companions as any);
    expect(state.allies && state.allies.length).toBeGreaterThan(0);
    expect(state.allies?.some(a => a.isCompanion)).toBe(true);
    expect(state.enemies.some(e => e.isCompanion)).toBe(false);
  });
});