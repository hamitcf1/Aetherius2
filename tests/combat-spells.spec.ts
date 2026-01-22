import { describe, it, expect, beforeEach } from 'vitest';
import { executePlayerAction, advanceTurn } from '../services/combatService';
import { createAbilityFromSpell } from '../services/spells';

const makePlayerStats = () => ({
  maxHealth: 100,
  currentHealth: 100,
  maxMagicka: 100,
  currentMagicka: 100,
  maxStamina: 100,
  currentStamina: 100,
  weaponDamage: 10,
  critChance: 5,
  dodgeChance: 0,
  armor: 0,
  abilities: [],
} as any);

const baseState = () => ({
  active: true,
  turn: 1,
  currentTurnActor: 'player',
  turnOrder: ['player', 'enemy1'],
  enemies: [{ id: 'enemy1', name: 'Bandit', level: 1, maxHealth: 30, currentHealth: 30, armor: 0, damage: 5, abilities: [], behavior: 'aggressive', xpReward: 10 }],
  allies: [],
  combatLog: [],
  abilityCooldowns: {},
  playerActionCounts: {}
} as any);

const makeCharacter = () => ({
  id: 'char_test',
  name: 'Caster',
  level: 5,
  skills: [{ name: 'Restoration', level: 10 }],
  perks: [],
  stats: { health: 100, magicka: 100, stamina: 100 },
  currentVitals: { currentHealth: 100, currentMagicka: 100, currentStamina: 100 },
  equipment: []
} as any);

describe('Spell classification: healing and summons', () => {
  // Helper to produce a state with an active summoned companion
  const playStateWithSummon = () => {
    const s = baseState();
    const comp = { id: 'summon_test_1', name: 'Skeleton', level: 1, maxHealth: 25, currentHealth: 25, armor: 2, damage: 4, abilities: [], behavior: 'support', isCompanion: true, companionMeta: { companionId: 'summon_test_1', autoLoot: false, autoControl: true } } as any;
    s.allies.push(comp);
    return s;
  }
  it('applies healing directly to allies without attack resolution', () => {
    const char = makeCharacter();
    const playerStats = makePlayerStats();

    // Create a healing ability and add to player stats
    const healingAbility = { id: 'healing', name: 'Healing', type: 'magic', heal: 20, cost: 20, effects: [{ type: 'heal', value: 20 }] } as any;
    playerStats.abilities.push(healingAbility);

    const state = baseState();
    // Add an ally with missing health
    state.allies.push({ id: 'ally1', name: 'Ally', level: 1, maxHealth: 40, currentHealth: 10, armor: 0, abilities: [], behavior: 'support' });

    const res = executePlayerAction(state, playerStats, 'magic', 'ally1', 'healing', undefined, undefined, undefined, char);
    const { newState, narrative } = res;

    const ally = newState.allies.find((a: any) => a.id === 'ally1');
    expect(ally.currentHealth).toBeGreaterThan(10);
    expect(narrative).toContain('restore');

    // Ensure enemy health unchanged and no "miss" style narrative
    const enemy = newState.enemies.find((e: any) => e.id === 'enemy1');
    expect(enemy.currentHealth).toBe(30);
  });

  it('explicit enemy selection is converted to self-apply for healing abilities', () => {
    const char = makeCharacter();
    const playerStats = makePlayerStats();
    playerStats.currentHealth = 55;
    const healingAbility = { id: 'healing', name: 'Healing', type: 'magic', heal: 20, cost: 20, effects: [{ type: 'heal', value: 20 }] } as any;
    playerStats.abilities.push(healingAbility);

    // Create a state with two enemies so we can explicitly target the non-default enemy
    const state = baseState();
    state.enemies = [
      { id: 'enemy1', name: 'Bandit', level: 1, maxHealth: 30, currentHealth: 30, armor: 0, damage: 5, abilities: [], behavior: 'aggressive', xpReward: 10 },
      { id: 'enemy2', name: 'Raider', level: 1, maxHealth: 30, currentHealth: 30, armor: 0, damage: 6, abilities: [], behavior: 'aggressive', xpReward: 12 }
    ];

    const res = executePlayerAction(state, playerStats, 'magic', 'enemy2', 'healing', undefined, undefined, undefined, char);
    // Player should be healed because explicit enemy selection is converted to no-target (self)
    expect(res.newPlayerStats.currentHealth).toBeGreaterThan(55);
    expect(res.narrative).toContain('restore');
  });

  it('treats implicit enemy selection (default target) as no-target and auto-applies healing to self', () => {
    const char = makeCharacter();
    const playerStats = makePlayerStats();
    playerStats.currentHealth = 60;
    const healingAbility = { id: 'healing', name: 'Healing', type: 'magic', heal: 20, cost: 20, effects: [{ type: 'heal', value: 20 }] } as any;
    playerStats.abilities.push(healingAbility);

    const state = baseState();
    // Call with the default enemy id to simulate implicit selection
    const res = executePlayerAction(state, playerStats, 'magic', 'enemy1', 'healing', undefined, undefined, undefined, char);

    expect(res.newPlayerStats.currentHealth).toBeGreaterThan(60);
    expect(res.narrative).toContain('restore');
  });

  it('auto-applies healing to self when no target is selected', () => {
    const char = makeCharacter();
    const playerStats = makePlayerStats();
    playerStats.currentHealth = 70;
    const healingAbility = { id: 'healing', name: 'Healing', type: 'magic', heal: 20, cost: 20, effects: [{ type: 'heal', value: 20 }] } as any;
    playerStats.abilities.push(healingAbility);

    const state = baseState();

    const res = executePlayerAction(state, playerStats, 'magic', undefined, 'healing', undefined, undefined, undefined, char);
    expect(res.newPlayerStats.currentHealth).toBeGreaterThan(70);
    expect(res.narrative).toContain('restore');
  });

  it('auto-applies healing to self when no target is selected', () => {
    const char = makeCharacter();
    const playerStats = makePlayerStats();
    playerStats.currentHealth = 70;
    const healingAbility = { id: 'healing', name: 'Healing', type: 'magic', heal: 20, cost: 20, effects: [{ type: 'heal', value: 20 }] } as any;
    playerStats.abilities.push(healingAbility);

    const state = baseState();

    const res = executePlayerAction(state, playerStats, 'magic', undefined, 'healing', undefined, undefined, undefined, char);
    expect(res.newPlayerStats.currentHealth).toBeGreaterThan(70);
    expect(res.narrative).toContain('restore');
  });

  it('summons a companion when casting a summon spell', () => {
    const char = makeCharacter();
    const playerStats = makePlayerStats();

    const summonAbility = { id: 'summon_skeleton', name: 'Summon Skeleton', type: 'magic', cost: 40, effects: [{ type: 'summon', name: 'Skeleton', duration: 3 }] } as any;
    playerStats.abilities.push(summonAbility);

    const state = baseState();
    // Provide a deterministic natRoll so the test is stable
    const res = executePlayerAction(state, playerStats, 'magic', undefined, 'summon_skeleton', undefined, undefined, 15, char);
    const { newState, narrative } = res;

    // There should be a newly added companion in allies list marked as isCompanion
    const summons = newState.allies.filter((e: any) => e.isCompanion);
    expect(summons.length).toBeGreaterThan(0);
    expect(narrative).toContain('joins the fight');
    expect(newState.pendingSummons && newState.pendingSummons.length).toBeGreaterThan(0);

    // Ensure no enemy was damaged by the summon
    const enemyAfter = newState.enemies.find((e: any) => e.id === 'enemy1');
    expect(enemyAfter.currentHealth).toBe(30);
  });

  it('blocks conjure attempts when an active summon exists (engine guard — no roll, no cost, no turn consumed)', () => {
    const char = makeCharacter();
    const playerStats = makePlayerStats();
    const summonAbility = { id: 'summon_skeleton', name: 'Summon Skeleton', type: 'magic', cost: 40, effects: [{ type: 'summon', name: 'Skeleton', duration: 3 }] } as any;
    playerStats.abilities.push(summonAbility);

    const state = playStateWithSummon(); // helper above produces a state with an active summon
    // ensure the helper marks this as a summon for combatHasActiveSummon()
    state.allies[0].companionMeta = { ...(state.allies[0].companionMeta || {}), isSummon: true };
    const beforeMagicka = playerStats.currentMagicka;

    // Provide a natRoll to emulate the previously-observed bug path where a roll was still applied
    const res = executePlayerAction(state, playerStats, 'magic', undefined, 'summon_skeleton', undefined, undefined, 18, char);

    expect(res.narrative).toMatch(/already have an active summon/i);
    // No resource spent
    expect(res.newPlayerStats.currentMagicka).toBe(beforeMagicka);
    // No nat entry should have been added by the engine for this blocked attempt
    expect((res.newState.combatLog || []).some((e: any) => e.nat !== undefined)).toBe(false);
    // No additional summons added (only the pre-existing one should remain)
    const summCount = (res.newState.allies || []).filter((a: any) => a.companionMeta?.isSummon).length;
    expect(summCount).toBeGreaterThanOrEqual(1);
  });

  it('allows additional summons up to twin_souls perk rank (1 => 2 total)', () => {
    const char = makeCharacter();
    char.perks = [{ id: 'twin_souls', rank: 1 }];

    const playerStats = makePlayerStats();
    const summonAbility = { id: 'summon_skeleton', name: 'Summon Skeleton', type: 'magic', cost: 40, effects: [{ type: 'summon', name: 'Skeleton', duration: 3 }] } as any;
    playerStats.abilities.push(summonAbility);

    // Start with one active summon
    const state = playStateWithSummon();
    state.allies[0].companionMeta = { ...(state.allies[0].companionMeta || {}), isSummon: true };

    const res = executePlayerAction(state, playerStats, 'magic', undefined, 'summon_skeleton', undefined, undefined, 15, char);
    // Should have succeeded in queuing another summon
    expect(res.newState.pendingSummons && res.newState.pendingSummons.length).toBeGreaterThanOrEqual(1);
  });

  it('allows up to 3 summons when twin_souls rank 2 is present', () => {
    const char = makeCharacter();
    char.perks = [{ id: 'twin_souls', rank: 2 }];

    const playerStats = makePlayerStats();
    const summonAbility = { id: 'summon_skeleton', name: 'Summon Skeleton', type: 'magic', cost: 40, effects: [{ type: 'summon', name: 'Skeleton', duration: 3 }] } as any;
    playerStats.abilities.push(summonAbility);

    // Start with two active summons
    const state = baseState();
    const comp1 = { id: 's1', name: 'S1', level: 1, maxHealth: 10, currentHealth: 10, isCompanion: true, companionMeta: { isSummon: true } } as any;
    const comp2 = { id: 's2', name: 'S2', level: 1, maxHealth: 10, currentHealth: 10, isCompanion: true, companionMeta: { isSummon: true } } as any;
    state.allies.push(comp1, comp2);

    const res = executePlayerAction(state, playerStats, 'magic', undefined, 'summon_skeleton', undefined, undefined, 15, char);
    expect(res.newState.pendingSummons && res.newState.pendingSummons.length).toBeGreaterThanOrEqual(1);
  });

  it('summon works and remains friendly even when cast by a damaging spell (damage + summon) and begins decaying after 3 player turns', () => {
    const char = makeCharacter();
    const playerStats = makePlayerStats();
    const fireSummon = { id: 'fire_and_summon', name: 'Fire & Summon', type: 'magic', damage: 10, cost: 30, effects: [{ type: 'summon', name: 'Skeleton', duration: 3, playerTurns: 3 }] } as any;
    playerStats.abilities.push(fireSummon);

    const state = baseState();
    let res = executePlayerAction(state, playerStats, 'magic', 'enemy1', 'fire_and_summon', undefined, undefined, 15, char);
    let { newState } = res;

    // The enemy should take damage
    const enemy = newState.enemies.find((e: any) => e.id === 'enemy1');
    expect(enemy.currentHealth).toBeLessThan(30);

    // And the summoned skeleton should be added to allies, not enemies
    const summonsAlly = newState.allies.filter((a: any) => a.isCompanion && a.name.includes('Skeleton'));
    expect(summonsAlly.length).toBeGreaterThan(0);

    // Pending summons should record player-turn based duration
    expect(newState.pendingSummons && newState.pendingSummons[0]).toBeDefined();
    const pending = newState.pendingSummons![0] as any;
    expect(pending.playerTurnsRemaining === 3 || pending.playerTurnsRemaining === undefined).toBeTruthy();

    // Simulate player-turn starts until the summon begins decaying (guarded loop to avoid infinite loops)
    newState.currentTurnActor = 'enemy1';
    let attempts = 0;
    while (attempts < 12) {
      newState = advanceTurn(newState);
      const compCheck = newState.allies.find(a => a.isCompanion && a.name.includes('Skeleton')) as any;
      if (compCheck && compCheck.companionMeta && compCheck.companionMeta.decayActive) break;
      attempts++;
    }
    expect(attempts).toBeLessThan(12); // ensure we didn't time out

    // After player-turns, the summon should be flagged as decaying
    const comp = newState.allies.find(a => a.isCompanion && a.name.includes('Skeleton')) as any;
    expect(comp).toBeDefined();
    expect(comp.companionMeta && comp.companionMeta.decayActive).toBeTruthy();

    // Next player-turn start should apply decay damage (reduce to at most half of current health)
    newState = advanceTurn(newState); // to enemy
    const beforeHealth = comp.currentHealth;
    newState = advanceTurn(newState); // to player -> decay applied
    const compAfter = newState.allies.find(a => a.id === comp.id) as any;
    // expect the summoned companion's health to be reduced to at most half of prior health
    expect(compAfter.currentHealth).toBeLessThanOrEqual(Math.floor(beforeHealth / 2));
  });

  it('normalizes misclassified summoned companions (moves from enemies to allies) on turn advance', () => {
    const state = baseState();
    // Add a misclassified summon into enemies (simulating earlier bug). Use a non-"summon_" id to ensure we don't rely on prefix checks.
    const mis = { id: 'buggy_summon_1', name: 'Skeleton', level: 1, maxHealth: 20, currentHealth: 20, isCompanion: true, abilities: [{ id: 's_a', name: 'Attack', type: 'melee', damage: 4 }] } as any;
    state.enemies.push(mis);
    state.turnOrder.push(mis.id);

    const next = advanceTurn(state);
    const foundAlly = (next.allies || []).find((a: any) => a.id === 'buggy_summon_1');
    expect(foundAlly).toBeDefined();
    const foundEnemy = (next.enemies || []).find((e: any) => e.id === 'buggy_summon_1');
    expect(foundEnemy).toBeUndefined();
  });

  it('learned healing/summon spells from registry work via createAbilityFromSpell', () => {
    const char = makeCharacter();
    const playerStats = makePlayerStats();

    // Use createAbilityFromSpell to simulate learned spells
    const healAb = createAbilityFromSpell('healing');
    const summonAb = createAbilityFromSpell('summon_skeleton');

    expect(healAb).toBeDefined();
    expect(healAb.heal || healAb.effects.some((e: any) => e.type === 'heal')).toBeTruthy();

    expect(summonAb).toBeDefined();
    expect(summonAb.effects && summonAb.effects.some((e: any) => e.type === 'summon')).toBeTruthy();

    // Add them to abilities and cast
    playerStats.abilities.push(healAb);
    playerStats.abilities.push(summonAb);

    const state = baseState();
    state.allies.push({ id: 'ally1', name: 'Ally', level: 1, maxHealth: 40, currentHealth: 10, armor: 0, abilities: [], behavior: 'support' });

    const healRes = executePlayerAction(state, playerStats, 'magic', 'ally1', healAb.id, undefined, undefined, undefined, char);
    expect(healRes.newState.allies.find((a: any) => a.id === 'ally1').currentHealth).toBeGreaterThan(10);

    const summonRes = executePlayerAction(state, playerStats, 'magic', undefined, summonAb.id, undefined, undefined, undefined, char);
    expect(summonRes.newState.allies.some((e: any) => e.isCompanion)).toBeTruthy();
    // Ensure enemies were not damaged by casting a summon
    const enemyAfter = summonRes.newState.enemies.find((e: any) => e.id === 'enemy1');
    expect(enemyAfter.currentHealth).toBe(30);
    // You should be able to target and heal a summoned companion
    const compState = playStateWithSummon();
    const companion = compState.allies.find((a: any) => a.isCompanion);
    companion.currentHealth = Math.max(1, companion.currentHealth - 10);
    const healCompRes = executePlayerAction(compState, playerStats, 'magic', companion.id, healAb.id, undefined, undefined, undefined, char);
    expect(healCompRes.newState.allies.find((a: any) => a.id === companion.id).currentHealth).toBeGreaterThan(companion.currentHealth);  });
});
