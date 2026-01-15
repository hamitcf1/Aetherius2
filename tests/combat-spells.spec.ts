import { describe, it, expect, beforeEach } from 'vitest';
import { executePlayerAction } from '../services/combatService';

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

  it('disallows healing enemies', () => {
    const char = makeCharacter();
    const playerStats = makePlayerStats();
    const healingAbility = { id: 'healing', name: 'Healing', type: 'magic', heal: 20, cost: 20, effects: [{ type: 'heal', value: 20 }] } as any;
    playerStats.abilities.push(healingAbility);

    const state = baseState();

    const res = executePlayerAction(state, playerStats, 'magic', 'enemy1', 'healing', undefined, undefined, undefined, char);
    const { newState, narrative } = res;
    // Enemy should be unchanged
    const enemy = newState.enemies.find((e: any) => e.id === 'enemy1');
    expect(enemy.currentHealth).toBe(30);
    expect(narrative).toContain('cannot be used on enemies');
  });

  it('summons a companion when casting a summon spell', () => {
    const char = makeCharacter();
    const playerStats = makePlayerStats();

    const summonAbility = { id: 'summon_skeleton', name: 'Summon Skeleton', type: 'magic', cost: 40, effects: [{ type: 'summon', name: 'Skeleton', duration: 3 }] } as any;
    playerStats.abilities.push(summonAbility);

    const state = baseState();
    const res = executePlayerAction(state, playerStats, 'magic', undefined, 'summon_skeleton', undefined, undefined, undefined, char);
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

  it('learned healing/summon spells from registry work via createAbilityFromSpell', () => {
    const char = makeCharacter();
    const playerStats = makePlayerStats();

    // Use createAbilityFromSpell to simulate learned spells
    const { createAbilityFromSpell } = require('../services/spells');
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
    expect(summonRes.newState.enemies.some((e: any) => e.isCompanion)).toBeTruthy();
    // Ensure enemies were not damaged by casting a summon
    const enemyAfter = summonRes.newState.enemies.find((e: any) => e.id === 'enemy1');
    expect(enemyAfter.currentHealth).toBe(30);
  });
});
