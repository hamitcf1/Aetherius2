import { initializeCombat } from '../services/combatService';

describe('duplicate enemy name normalization', () => {
  it('appends numeric suffixes to identical enemy names', () => {
    const enemies: any[] = [
      { id: 'e1', name: 'Skeever', level: 1, maxHealth: 20, currentHealth: 20, damage: 4, type: 'beast', armor: 0, abilities: [], xpReward: 0 },
      { id: 'e2', name: 'Skeever', level: 1, maxHealth: 20, currentHealth: 20, damage: 4, type: 'beast', armor: 0, abilities: [], xpReward: 0 },
      { id: 'e3', name: 'Skeever', level: 1, maxHealth: 20, currentHealth: 20, damage: 4, type: 'beast', armor: 0, abilities: [], xpReward: 0 }
    ];

    const state: any = initializeCombat(enemies, 'test-location', false, true, false, [], 1);
    const names = state.enemies.map((e: any) => e.name);

    expect(names.length).toBe(3);
    // All names should be unique
    expect(new Set(names).size).toBe(3);
    // They should have numeric suffixes
    expect(names).toEqual(expect.arrayContaining(['Skeever 1', 'Skeever 2', 'Skeever 3']));
  });
});
