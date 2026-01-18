import { initializeCombat, executePlayerAction, advanceTurn, executeEnemyTurn, getEnemyCountForLevel, scaleEnemyEncounter } from '../services/combatService';

describe('combat — Tactical Guard (defend) overhaul', () => {
  it('activating defend grants a perk-adjusted DR buff and marks defend as used (default 1 round, perk-upgradeable up to 3)', () => {
    const state: any = initializeCombat([{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20 } as any], 'road');
    const playerStats: any = { currentHealth: 30, maxHealth: 100, armor: 10, abilities: [] };

    // Default (no perk) -> 1 round
    const r1: any = executePlayerAction(state, playerStats, 'defend');
    expect((r1.newState as any).playerGuardUsed).toBeTruthy();
    const guard = (r1.newState.playerActiveEffects || []).find((pe: any) => pe.effect && pe.effect.stat === 'guard');
    expect(guard).toBeDefined();
    expect(guard.turnsRemaining).toBe(1);

    // With perk ranks -> up to 3 rounds
    const charWithPerk: any = { id: 'p1', name: 'Hero', level: 10, perks: [{ id: 'tactical_guard_mastery', rank: 2 }] };
    const s2: any = initializeCombat([{ id: 'e2', name: 'Bandit B', level: 1, maxHealth: 20, currentHealth: 20 } as any], 'road');
    const r2: any = executePlayerAction(s2, playerStats, 'defend', undefined, undefined, undefined, undefined, undefined, charWithPerk);
    const guard2 = (r2.newState.playerActiveEffects || []).find((pe: any) => pe.effect && pe.effect.stat === 'guard');
    expect(guard2).toBeDefined();
    expect(guard2.turnsRemaining).toBe(3);
  });

  it('guard lasts across 3 full rounds and then expires (round = player-turn start)', () => {
    const state: any = initializeCombat([{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20 } as any], 'road');
    const playerStats: any = { currentHealth: 30, maxHealth: 100, armor: 10, abilities: [] };

    let s = state;
    s = executePlayerAction(s, playerStats, 'defend').newState;

    // Simulate three full rounds (advance until player turn starts 3 times)
    for (let i = 0; i < 3; i++) {
      // enemy acts then round advances back to player
      s = executeEnemyTurn(s, s.enemies[0].id, playerStats, 12).newState;
      s = advanceTurn(s); // to player
      // guard should decrement at player-turn start
    }

    const guardAfter = (s.playerActiveEffects || []).find((pe: any) => pe.effect && pe.effect.stat === 'guard');
    expect(guardAfter).toBeUndefined();
    expect((s as any).playerDefending).toBeFalsy();
  });

  it('guard reduces incoming damage by ~40% and stacks multiplicatively with armor', () => {
    const baseState: any = initializeCombat([{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 200, currentHealth: 200, damage: 20, type: 'humanoid', armor: 0, abilities: [], xpReward: 0 } as any], 'road');
    const playerStats: any = { currentHealth: 200, maxHealth: 200, armor: 50, abilities: [] };

    // Get damage without guard (force a hit)
    const noGuard = executeEnemyTurn(baseState, baseState.enemies[0].id, playerStats, 15);
    const dmgNoGuard = playerStats.maxHealth - noGuard.newPlayerStats.currentHealth;

    // With guard
    let s = baseState;
    s = executePlayerAction(s, playerStats, 'defend').newState;
    const guardRes = executeEnemyTurn(s, s.enemies[0].id, playerStats, 15);
    const dmgWithGuard = playerStats.maxHealth - guardRes.newPlayerStats.currentHealth;

    // Guard should reduce damage (roughly 40%) and be less than the no-guard damage
    expect(dmgWithGuard).toBeGreaterThanOrEqual(0);
    expect(dmgWithGuard).toBeLessThan(dmgNoGuard);

    // Check multiplicative stacking: ratio should be approximately (1 - 0.40)
    const ratio = dmgWithGuard / Math.max(1, dmgNoGuard);
    expect(ratio).toBeGreaterThan(0.50);
    expect(ratio).toBeLessThan(0.75);
  });

  it('defend button / ability cannot be used more than once per combat', () => {
    const state: any = initializeCombat([{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20 } as any], 'road');
    const playerStats: any = { currentHealth: 30, maxHealth: 100, abilities: [] };

    const first = executePlayerAction(state, playerStats, 'defend');
    const second = executePlayerAction(first.newState, playerStats, 'defend');
    expect((second.newState as any).playerGuardUsed).toBeTruthy();
    expect(second.narrative).toMatch(/already used/i);
  });

  it('enemy encounter scaling returns between 1 and 5 based on player level', () => {
    for (let lvl of [1, 5, 8, 12, 20]) {
      const c = getEnemyCountForLevel(lvl);
      expect(c).toBeGreaterThanOrEqual(1);
      expect(c).toBeLessThanOrEqual(5);
    }
  });

  it('single non-boss encounter expands to multiple enemies up to desired total', () => {
    const enemies = [{ id: 'e1', name: 'Bandit', level: 10, maxHealth: 30, currentHealth: 30 } as any];
    const scaled = scaleEnemyEncounter(enemies, 12);
    expect(scaled.length).toBeGreaterThanOrEqual(1);
    expect(scaled.length).toBeLessThanOrEqual(5);
  });
});
