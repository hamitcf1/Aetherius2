import { executePlayerAction } from '../services/combatService';

describe('combat log — deduplication', () => {
  it('does not produce near-duplicate entries when an ability emits single-target then combined AoE narrative', () => {
    const state: any = {
      id: 'c1',
      active: true,
      turn: 1,
      currentTurnActor: 'player',
      turnOrder: ['player'],
      enemies: [
        { id: 'e1', name: 'Gob A', level: 1, maxHealth: 20, currentHealth: 20, armor: 0 },
        { id: 'e2', name: 'Gob B', level: 1, maxHealth: 20, currentHealth: 20, armor: 0 }
      ],
      allies: [],
      abilityCooldowns: {},
      combatLog: []
    };

    const playerStats: any = { currentHealth: 40, maxHealth: 100, currentMagicka: 100, maxMagicka: 100, currentStamina: 50, maxStamina: 50, abilities: [ { id: 'aeonic_surge', name: 'Aeonic Surge', type: 'aeo', cost: 0, damage: 12, effects: [ { type: 'aoe_damage', value: 8, aoeTarget: 'all_enemies' } ] } ] };

    const res: any = executePlayerAction(state, playerStats, 'magic', 'e1', 'aeonic_surge', undefined, undefined, 14, { id: 'char1', name: 'Hero' } as any);

    expect(res).toBeTruthy();
    const log = res.newState.combatLog || [];
    // There should be at most ONE entry describing the aeonic_surge effect for the player this turn (no duplicate short+combined lines)
    const aeonicEntries = log.filter((l: any) => l.action === 'Aeonic Surge' && l.turn === 1 && l.actor === 'player');
    expect(aeonicEntries.length).toBeLessThanOrEqual(1);
  });
});