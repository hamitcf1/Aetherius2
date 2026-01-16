import { initializeCombat } from '../services/combatService';

describe('Companion type mapping in combat', () => {
  it('marks animal companions as beasts (not humanoid)', () => {
    const companion = {
      id: 'c1',
      name: 'Fang',
      isAnimal: true,
      species: 'wolf',
      level: 2,
      health: 20,
      maxHealth: 20,
      damage: 6,
      armor: 1,
      autoLoot: false,
      autoControl: false,
      behavior: 'follow'
    } as any;

    const state = initializeCombat([], 'forest', false, true, false, [companion]);
    expect(state.allies && state.allies[0]).toBeTruthy();
    expect(state.allies![0].type).toBe('beast');
    // Ability name should reflect an animal-style attack when possible
    expect(state.allies![0].abilities[0].name.toLowerCase()).toMatch(/bite|wolf|fang/);
  });
});