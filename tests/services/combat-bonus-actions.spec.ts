import { describe, it, expect } from 'vitest';
import { initializeCombat, executePlayerAction } from '../../services/combatService';

describe('combat — bonus action support', () => {
  it('consuming a potion is treated as a bonus action (does not consume main action)', () => {
    const state: any = initializeCombat([{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20 } as any], 'road');
    const playerStats: any = { currentHealth: 30, maxHealth: 100, currentMagicka: 0, maxMagicka: 50, currentStamina: 0, maxStamina: 100, abilities: [] };
    const potion = { id: 'p1', name: 'Minor Stamina Potion', characterId: 'c1', type: 'potion', subtype: 'stamina', quantity: 1 } as any;

    const res: any = executePlayerAction(state, playerStats, 'item', undefined, undefined, 'p1', [potion], 10, undefined as any) as any;
    expect(res.usedItem).toBeTruthy();
    expect(res.consumedAction).toBe('bonus');
  });

  it('defend is treated as a bonus action', () => {
    const state: any = initializeCombat([{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20 } as any], 'road');
    const playerStats: any = { currentHealth: 30, maxHealth: 100, abilities: [] };

    const res: any = executePlayerAction(state, playerStats, 'defend') as any;
    expect(res.narrative).toMatch(/Tactical Guard/i);
    expect(res.consumedAction).toBe('bonus');
  });

  it('conjuration (summon) abilities are treated as bonus actions', () => {
    const summonAbility: any = { id: 'summon_wolf', name: 'Summon Wolf', type: 'magic', damage: 0, cost: 20, effects: [{ type: 'summon', name: 'Wolf', baseHealth: 30, duration: 3 }], cooldown: 3 };
    const state: any = initializeCombat([{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20 } as any], 'road');
    const playerStats: any = { currentHealth: 30, maxHealth: 100, abilities: [summonAbility], currentMagicka: 50, maxMagicka: 50 };

    const res: any = executePlayerAction(state, playerStats, 'magic', undefined, 'summon_wolf', undefined, undefined, 15, { perks: [], skills: [] } as any);
    expect(res.consumedAction).toBe('bonus');
  });

  it('healing abilities consume the bonus action', () => {
    const healAbility: any = { id: 'heal_minor', name: 'Healing Touch', type: 'magic', cost: 10, heal: 25, cooldown: 1 };
    const state: any = initializeCombat([{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20 } as any], 'road');
    const playerStats: any = { currentHealth: 10, maxHealth: 100, currentMagicka: 50, maxMagicka: 50, abilities: [healAbility] };

    const res: any = executePlayerAction(state, playerStats, 'magic', undefined, 'heal_minor', undefined, undefined, 12, { perks: [], skills: [] } as any);
    expect(res.consumedAction).toBe('bonus');
    expect(res.newPlayerStats.currentHealth).toBeGreaterThan(10);
  });

  it('shield bash is treated as a bonus action', () => {
    const bashAbility: any = { id: 'shield_bash', name: 'Shield Bash', type: 'melee', damage: 8, cost: 15, cooldown: 2, effects: [{ type: 'stun', value: 1, duration: 1, chance: 50 }] };
    const state: any = initializeCombat([{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20 } as any], 'road');
    const playerStats: any = { currentHealth: 30, maxHealth: 100, abilities: [bashAbility], currentStamina: 50 };

    const res: any = executePlayerAction(state, playerStats, 'attack', undefined, 'shield_bash', undefined, undefined, 13, { perks: [], skills: [] } as any);
    expect(res.consumedAction).toBe('bonus');
  });

  it('basic damage magic abilities consume the bonus action', () => {
    const fireBolt: any = { id: 'fire_bolt', name: 'Fire Bolt', type: 'magic', damage: 20, cost: 20 };
    const state: any = initializeCombat([{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 60, currentHealth: 60 } as any], 'road');
    const playerStats: any = { currentHealth: 30, maxHealth: 100, abilities: [fireBolt], currentMagicka: 50 };

    const res: any = executePlayerAction(state, playerStats, 'magic', undefined, 'fire_bolt', undefined, undefined, 12, { perks: [], skills: [] } as any);
    expect(res.consumedAction).toBe('bonus');
  });
});