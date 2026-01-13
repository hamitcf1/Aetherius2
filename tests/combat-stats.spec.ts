import { describe, it, expect } from 'vitest';
import { calculatePlayerCombatStats } from '../services/combatService';
import type { Character, InventoryItem } from '../types';

const mkChar = (): Character => ({
  id: 'c1', profileId: 'p1', name: 'Test', race: 'Nord', gender: 'M', archetype: 'Warrior',
  level: 5, experience: 0, gold: 0, perks: [], perkPoints: 0,
  stats: { health: 100, magicka: 50, stamina: 100 },
  skills: [], time: { day: 1, hour: 8, minute: 0 }, needs: { hunger: 0, thirst: 0, fatigue: 0 },
  identity: '', psychology: '', breakingPoint: '', moralCode: '', allowedActions: '', forbiddenActions: '',
  fears: '', weaknesses: '', talents: '', magicApproach: '', factionAllegiance: '', worldview: '', daedricPerception: '',
  forcedBehavior: '', longTermEvolution: '', milestones: [], backstory: '', lastPlayed: Date.now()
});

const mkItem = (over: Partial<InventoryItem> = {}): InventoryItem => ({
  id: over.id || 'i1', characterId: 'c1', name: over.name || 'Sword', type: over.type || 'weapon', description: over.description || '',
  quantity: typeof over.quantity === 'number' ? over.quantity : 1,
  equipped: !!over.equipped,
  equippedBy: (over as any).equippedBy,
  slot: (over as any).slot as any,
  armor: over.armor,
  damage: over.damage,
  value: over.value,
});

describe('combat stats and equipped ownership', () => {
  it('ignores companion-equipped items when calculating player stats', () => {
    const char = mkChar();

    const playerWeapon = mkItem({ id: 'wp1', name: 'Player Sword', equipped: true, equippedBy: 'player', damage: 10, slot: 'weapon' });
    const compWeapon = mkItem({ id: 'wp2', name: 'Comp Sword', equipped: true, equippedBy: 'comp1', damage: 50, slot: 'weapon' });
    const compShield = mkItem({ id: 'sh1', name: 'Comp Shield', equipped: true, equippedBy: 'comp1', armor: 30, slot: 'offhand' });

    const stats = calculatePlayerCombatStats(char, [playerWeapon, compWeapon, compShield]);

    // Player weaponDamage should reflect the player's equipped sword (10), not the companion's 50
    expect(stats.weaponDamage).toBe(10);
    // Companion shield should not contribute to player's armor
    expect(stats.armor).toBe(0);
  });
});