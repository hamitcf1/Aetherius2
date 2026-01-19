import { executePlayerAction, checkCombatEnd, combatHasActiveSummon } from '../services/combatService';

describe('combat — summon cleanup behavior', () => {
  it('allows summoning again after a summoned companion dies (pending and flags cleaned)', () => {
    const state: any = {
      id: 's1', turn: 1, currentTurnActor: 'player', turnOrder: ['player', 'e1'],
      enemies: [{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 30, currentHealth: 30, armor: 0 }],
      allies: [], playerActiveEffects: [], pendingSummons: [], combatLog: [], abilityCooldowns: {}
    };

    const char: any = { id: 'p1', name: 'Hero', level: 5, skills: [], abilities: [] };
    const playerStats: any = { currentHealth: 30, maxHealth: 100, currentMagicka: 200, maxMagicka: 200, abilities: [] };

    // Add a summon ability
    const summonAbility = { id: 'summon_skeleton', name: 'Summon Skeleton', type: 'magic', cost: 10, effects: [{ type: 'summon', name: 'Skeleton', duration: 3, playerTurns: 3 }] } as any;
    playerStats.abilities.push(summonAbility);

    // Cast the summon (force a specific nat roll)
    const res = executePlayerAction(state, playerStats, 'magic', 'e1', 'summon_skeleton', undefined, undefined, 15, char);
    expect(res.newState.allies.length).toBeGreaterThan(0);
    const summoned = res.newState.allies.find((a: any) => a.companionMeta?.isSummon);
    expect(summoned).toBeDefined();

    // Simulate the summoned companion dying
    const deadState = { ...res.newState } as any;
    const idx = deadState.allies.findIndex((a: any) => a.id === summoned.id);
    deadState.allies[idx] = { ...deadState.allies[idx], currentHealth: 0 };

    // Run cleanup via checkCombatEnd
    const cleaned = checkCombatEnd(deadState, playerStats);

    // The summon should no longer be considered active
    expect(combatHasActiveSummon(cleaned)).toBe(false);

    // Player should be able to cast the summon again
    const res2 = executePlayerAction(cleaned, playerStats, 'magic', 'e1', 'summon_skeleton', undefined, undefined, 12, char);
    // Ensure a new pending summon was registered
    expect(res2.newState.pendingSummons && res2.newState.pendingSummons.length).toBeGreaterThan(0);
  });
});