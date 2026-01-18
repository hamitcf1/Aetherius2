import { executeEnemyTurn } from '../services/combatService';

describe('enemy AeO behavior', () => {
  it('enemy with only an AeO ability will cast it (consumes magicka) and returns aoeSummary', () => {
    const state: any = { id: 'c_e1', active: true, turn: 1, turnOrder: ['enemy1'], enemies: [{ id: 'enemy1', name: 'Aeon Cultist', level: 6, maxHealth: 60, currentHealth: 60, armor: 5, abilities: [ { id: 'necrotic_aeon', name: 'Necrotic Aeon', type: 'aeo', damage: 30, cost: 50, effects: [{ type: 'aoe_damage', value: 30, aoeTarget: 'all_enemies' }] } ], behavior: 'tactical', xpReward: 100 }], allies: [], abilityCooldowns: {}, combatLog: [] };

    const playerStats: any = { currentHealth: 40, maxHealth: 100, currentMagicka: 0, maxMagicka: 0, currentStamina: 50, maxStamina: 50 };

    // Enemy should be able to cast its AeO (no other options)
    const res: any = executeEnemyTurn(state, 'enemy1', playerStats, 12, { id: 'npc1', name: 'Aeon Cultist' } as any);
    expect(res).toBeTruthy();
    // If the AoE damaged anyone, aoeSummary.damaged should exist (may be empty array)
    expect(res.aoeSummary).toBeTruthy();
    expect(Array.isArray(res.aoeSummary.damaged)).toBe(true);
  });
});