import { describe, it, expect } from 'vitest';
import { executeCompanionAction } from '../services/combatService';

describe('executeCompanionAction', () => {
  it('ally deals damage to enemy and logs narrative', () => {
    const initialState: any = {
      turn: 1,
      turnOrder: ['player', 'ally_a1', 'e1'],
      currentTurnActor: 'ally_a1',
      enemies: [{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20, armor: 0, damage: 4 }],
      allies: [{ id: 'ally_a1', name: 'Buddy', level: 2, maxHealth: 30, currentHealth: 30, armor: 0, damage: 6, abilities: [{ id: 'a1', name: 'Strike', damage: 6 }] }],
      combatLog: [],
      abilityCooldowns: {},
      lastActorActions: {}
    };

    const res = executeCompanionAction(initialState as any, 'ally_a1', 'a1');
    // Either the ally hits and damages the enemy, or misses — accept both behaviors in this unit test
    const newHp = res.newState.enemies[0].currentHealth;
    if (newHp === 20) {
      expect(res.narrative.toLowerCase()).toContain('miss');
    } else {
      expect(newHp).toBeLessThan(20);
      expect(res.narrative.toLowerCase()).toMatch(/deals|damage|hits/);
    }
    // Narrative should reference ally
    expect(res.narrative).toContain('Buddy');
    // Ensure combat log updated
    expect(res.newState.combatLog.length).toBeGreaterThanOrEqual(1);
  });
});
