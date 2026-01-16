import { executePlayerAction } from '../services/combatService';
import { PlayerCombatStats, CombatState } from '../types';

describe('Summon type mapping', () => {
  it('marks summoned animal-type names as beasts', () => {
    const state: CombatState = {
      active: true,
      turn: 1,
      currentTurnActor: 'player',
      turnOrder: ['player'],
      enemies: [],
      allies: [],
      location: 'field',
      fleeAllowed: true,
      surrenderAllowed: false,
      combatLog: [],
      playerDefending: false,
      playerActiveEffects: [],
      abilityCooldowns: {},
    } as any;

    const playerStats: PlayerCombatStats = {
      maxHealth: 100,
      currentHealth: 100,
      maxMagicka: 50,
      currentMagicka: 50,
      maxStamina: 100,
      currentStamina: 100,
      armor: 10,
      weaponDamage: 8,
      critChance: 5,
      dodgeChance: 5,
      magicResist: 0,
      abilities: [ { id: 'summon_wolf', name: 'Call Wolf', type: 'utility', damage: 0, cost: 10, description: 'Summons a wolf', effects: [ { type: 'summon', name: 'Dire Wolf', duration: 3 } ] } as any ]
    };

    const res = executePlayerAction(state, playerStats, 'magic', undefined, 'summon_wolf', undefined, undefined, undefined, { id: 'p1', name: 'Hero' } as any);
    const allies = res.newState.allies || [];
    expect(allies.length).toBeGreaterThan(0);
    expect(allies[0].type).toBe('beast');
  });
});