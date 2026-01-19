import { describe, it, expect } from 'vitest';
import { shouldStartCombatForEvent, createCombatStateForEvent } from '../services/mapEventHandlers';

const dragonEvent = { id: 'e1', name: 'Dragon Sighting', type: 'dragon', levelRequirement: 12 } as any;
const banditEvent = { id: 'e2', name: 'Bandit Ambush', type: 'bandit', levelRequirement: 3 } as any;
const merchantEvent = { id: 'e3', name: 'Mysterious Merchant', type: 'merchant', levelRequirement: 1 } as any;

describe('mapEventHandlers', () => {
  it('should start combat for dragon and bandit events', () => {
    expect(shouldStartCombatForEvent(dragonEvent)).toBe(true);
    expect(shouldStartCombatForEvent(banditEvent)).toBe(true);
    expect(shouldStartCombatForEvent(merchantEvent)).toBe(false);
  });

  it('should create a dragon combat state', () => {
    const state = createCombatStateForEvent(dragonEvent, 12, []);
    expect(state).toBeDefined();
    expect(state.enemies).toBeDefined();
    expect(state.enemies.length).toBeGreaterThanOrEqual(1);
    const enemy = state.enemies[0];
    expect(enemy.name.toLowerCase()).toContain('drake');
    expect(enemy.maxHealth).toBeGreaterThan(300);
  });

  it('should create a bandit combat state with multiple enemies', () => {
    const state = createCombatStateForEvent(banditEvent, 5, []);
    expect(state).toBeDefined();
    expect(state.enemies).toBeDefined();
    expect(state.enemies.length).toBeGreaterThanOrEqual(2);
    expect(state.enemies.some(e => e.name.toLowerCase().includes('bandit'))).toBeTruthy();
  });
});
