import { executeEnemyTurn, executePlayerAction, executeCompanionAction, initializeCombat, advanceTurn } from '../services/combatService';

describe('combat — enemy critical stun behavior', () => {
  it('enemy critical hit can stun the player (50% chance) and stunned player skips next turn without rolling', () => {
    const state: any = initializeCombat([{ id: 'e1', name: 'Orc Brute', level: 3, maxHealth: 60, currentHealth: 60, damage: 12, type: 'humanoid', armor: 0, abilities: [], xpReward: 0 } as any], 'road');
    const playerStats: any = { currentHealth: 40, maxHealth: 100, abilities: [] };

    // Force crit nat (20) and make Math.random return 0.2 so 50% stun triggers
    const realRand = Math.random;
    Math.random = () => 0.2;
    const res: any = executeEnemyTurn(state, 'e1', playerStats, 20);
    Math.random = realRand;

    // Player should have a stun effect registered
    const stun = (res.newState.playerActiveEffects || []).find((pe: any) => pe.effect && pe.effect.type === 'stun');
    expect(stun).toBeDefined();

    // When player's turn arrives they should skip without rolling (no nat entries)
    const skipped = executePlayerAction(res.newState, playerStats, 'attack', 'e1');
    expect(skipped.narrative).toMatch(/stun/i);
    const natEntries = (skipped.newState.combatLog || []).filter((e: any) => e.nat !== undefined);
    expect(natEntries.length).toBe(0);
  });

  it('enemy critical hit can stun an allied companion (50% chance) and companion skips their turn', () => {
    const state: any = initializeCombat([{ id: 'e1', name: 'Orc Brute', level: 3, maxHealth: 60, currentHealth: 60, damage: 12, type: 'humanoid', armor: 0, abilities: [], xpReward: 0 } as any], 'road');
    // Add an allied companion to the combat state
    state.allies = [{ id: 'ally_a1', name: 'Buddy', level: 1, maxHealth: 30, currentHealth: 5, abilities: [{ id: 'strike', name: 'Strike', type: 'melee', damage: 6 }] }];
    state.turnOrder = ['player', 'e1', 'ally_a1'];

    const playerStats: any = { currentHealth: 100, maxHealth: 100, abilities: [] };

    // Force crit nat and trigger stun via Math.random
    const realRand = Math.random;
    Math.random = () => 0.1;
    const res: any = executeEnemyTurn(state, 'e1', playerStats, 20);
    Math.random = realRand;

    const ally = (res.newState.allies || []).find((a: any) => a.id === 'ally_a1');
    expect(ally).toBeDefined();
    const stun = (ally.activeEffects || []).find((ae: any) => ae.effect && ae.effect.type === 'stun');
    expect(stun).toBeDefined();

    // Companion should skip their action
    const compRes = executeCompanionAction(res.newState, 'ally_a1', 'strike');
    expect(compRes.narrative).toMatch(/stun/i);
    const natEntries = (compRes.newState.combatLog || []).filter((e: any) => e.nat !== undefined);
    expect(natEntries.length).toBe(0);
  });

  it('stunned enemy should skip their turn without rolling', () => {
    const s: any = initializeCombat([{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20, type: 'humanoid', armor: 0, damage: 4, abilities: [], xpReward: 0 } as any], 'road');
    // Give the enemy a stun effect
    s.enemies[0].activeEffects = [{ effect: { type: 'stun' }, turnsRemaining: 1 }];

    const playerStats: any = { currentHealth: 30, maxHealth: 100, abilities: [] };
    const res: any = executeEnemyTurn(s, 'e1', playerStats);
    expect(res.narrative).toMatch(/stun/i);
    const natEntries = (res.newState.combatLog || []).filter((e: any) => e.nat !== undefined);
    expect(natEntries.length).toBe(0);
  });
});
