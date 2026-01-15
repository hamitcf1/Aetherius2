import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { executePlayerAction, calculatePlayerCombatStats } from '../services/combatService';
import { FEATURES } from '../featureFlags';

const makeCharacter = () => ({
  id: 'char_test',
  name: 'Tester',
  level: 5,
  skills: [{ name: 'Unarmed', level: 10 }],
  perks: [],
  stats: { health: 100, magicka: 50, stamina: 100 },
  currentVitals: { currentHealth: 100, currentMagicka: 50, currentStamina: 0 },
  equipment: []
} as any);

const makePlayerStats = () => ({
  maxHealth: 100,
  currentHealth: 100,
  maxMagicka: 50,
  currentMagicka: 50,
  maxStamina: 100,
  currentStamina: 0,
  weaponDamage: 10,
  critChance: 5,
  dodgeChance: 0,
  armor: 0,
  abilities: [],
} as any);

const makeCombatState = () => ({
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

describe('Unarmed Strike feature', () => {
  beforeEach(() => {
    // Enable feature flag for these tests
    (FEATURES as any).enableUnarmedCombat.enabled = true;
  });

  afterEach(() => {
    (FEATURES as any).enableUnarmedCombat.enabled = false;
  });

  it('adds an unarmed ability when feature is enabled', () => {
    const char = makeCharacter();
    const playerStats = calculatePlayerCombatStats(char, []);
    const abilities = playerStats.abilities;
    const hasUnarmed = abilities.some(a => a.id === 'unarmed_strike');
    expect(hasUnarmed).toBe(true);
    const unarmed = abilities.find(a => a.id === 'unarmed_strike');
    expect(unarmed?.cost).toBe(0);
  });

  it('requires Unarmed skill level or perk to unlock', () => {
    // Low skill (locked)
    const charLocked = makeCharacter();
    charLocked.skills = [{ name: 'Unarmed', level: 0 }];
    (FEATURES as any).enableUnarmedCombat.enabled = true;
    const statsLocked = calculatePlayerCombatStats(charLocked, []);
    expect(statsLocked.abilities.some(a => a.id === 'unarmed_strike')).toBe(false);

    // Unlock via skill
    const charSkill = makeCharacter();
    charSkill.skills = [{ name: 'Unarmed', level: 6 }];
    const statsSkill = calculatePlayerCombatStats(charSkill, []);
    expect(statsSkill.abilities.some(a => a.id === 'unarmed_strike')).toBe(true);

    // Unlock via perk
    const charPerk = makeCharacter();
    charPerk.skills = [{ name: 'Unarmed', level: 0 }];
    charPerk.perks = [{ id: 'unarmed_mastery', rank: 1 }];
    const statsPerk = calculatePlayerCombatStats(charPerk, []);
    expect(statsPerk.abilities.some(a => a.id === 'unarmed_strike')).toBe(true);
  });

  it('does not consume stamina and deals damage when used at 0 stamina', () => {
    const char = makeCharacter();
    const playerStats = calculatePlayerCombatStats(char, []);
    const state = makeCombatState();

    // Execute unarmed strike
    const result = executePlayerAction(state, playerStats, 'attack', 'enemy1', 'unarmed_strike', undefined, undefined, 12, char);
    const { newState, newPlayerStats, narrative } = result;

    // Stamina should remain at 0 (no consumption)
    expect(newPlayerStats.currentStamina).toBe(0);

    // Enemy should have taken damage (health < max)
    const enemy = newState.enemies.find(e => e.id === 'enemy1');
    expect(enemy.currentHealth).toBeLessThan(30);

    // Ensure narrative does not include a low-stamina penalty message
    expect(narrative).not.toContain('Low stamina reduces');
  });
});
