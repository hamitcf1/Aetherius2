import { executePlayerAction, executeCompanionAction } from '../services/combatService';

describe('combat — stun skip behavior', () => {
  it('player who is stunned should skip turn without rolling', () => {
    const state: any = {
      id: 'c1', turn: 1, currentTurnActor: 'player', turnOrder: ['player'],
      enemies: [{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 30, currentHealth: 30, armor: 0 }],
      allies: [], playerActiveEffects: [{ effect: { type: 'stun' }, turnsRemaining: 1 }], combatLog: [], abilityCooldowns: {}
    };
    const playerStats: any = { currentHealth: 30, maxHealth: 100, abilities: [{ id: 'unarmed_strike', name: 'Unarmed Strike', type: 'melee', damage: 6 }] };

    const res: any = executePlayerAction(state, playerStats, 'attack', 'e1');
    expect(res).toBeTruthy();
    expect(res.narrative).toMatch(/stun/i);
    // Ensure no nat entries were added (no dice rolled)
    const natEntries = (res.newState.combatLog || []).filter((e: any) => e.nat !== undefined);
    expect(natEntries.length).toBe(0);
  });

  it('stunned companion should skip their action and not roll', () => {
    const state: any = {
      id: 'c2', turn: 1, currentTurnActor: 'ally_a1', turnOrder: ['ally_a1'],
      enemies: [{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 30, currentHealth: 30, armor: 0 }],
      allies: [{ id: 'ally_a1', name: 'Buddy', level: 1, maxHealth: 30, currentHealth: 5, activeEffects: [{ effect: { type: 'stun' }, turnsRemaining: 1 }], abilities: [{ id: 'strike', name: 'Strike', type: 'melee', damage: 6 }] }],
      combatLog: []
    };

    const res: any = executeCompanionAction(state, 'ally_a1', 'strike');
    expect(res).toBeTruthy();
    expect(res.narrative).toMatch(/stun/i);
    const natEntries = (res.newState.combatLog || []).filter((e: any) => e.nat !== undefined);
    expect(natEntries.length).toBe(0);
  });
});