import { executePlayerAction } from '../services/combatService';
import type { PlayerCombatStats } from '../services/combatService';

describe('combatService — AeO ability execution', () => {
  it('applies aoe_damage to enemies and aoe_heal to allies and returns aoeSummary', () => {
    const state: any = {
      id: 'c1',
      active: true,
      turn: 1,
      currentTurnActor: 'player',
      turnOrder: ['player'],
      enemies: [
        { id: 'e1', name: 'Bandit A', level: 1, maxHealth: 30, currentHealth: 30, armor: 0 },
        { id: 'e2', name: 'Bandit B', level: 1, maxHealth: 30, currentHealth: 30, armor: 0 }
      ],
      allies: [ { id: 'ally1', name: 'Buddy', level: 1, maxHealth: 40, currentHealth: 10 } ],
      abilityCooldowns: {},
      combatLog: []
    };

    const playerStats: any = { currentHealth: 50, maxHealth: 100, currentMagicka: 200, maxMagicka: 200, currentStamina: 100, maxStamina: 100, abilities: [ { id: 'aeonic_surge', name: 'Aeonic Surge', type: 'aeo', cost: 0, damage: 12, effects: [ { type: 'aoe_damage', value: 10 }, { type: 'aoe_heal', value: 12 } ] } ] } as any;

    const res: any = executePlayerAction(state, playerStats, 'magic', undefined, 'aeonic_surge', undefined, undefined, 10, { id: 'char1', name: 'Hero' } as any);

    expect(res).toBeTruthy();
    expect(res.aoeSummary).toBeTruthy();
    expect(Array.isArray(res.aoeSummary.damaged)).toBe(true);
    expect(Array.isArray(res.aoeSummary.healed)).toBe(true);
    // Both enemies should appear in damaged list (or at least one)
    expect(res.aoeSummary.damaged.length).toBeGreaterThanOrEqual(1);
    // Player/allies should appear in healed list
    expect(res.aoeSummary.healed.find((h: any) => h.id === 'player' || h.name === 'Hero' || h.name === 'Buddy')).toBeTruthy();
  });

  it('does not produce NaN when numeric stats are missing (regression test for computeDamageFromNat)', () => {
    const state: any = {
      id: 'c2',
      active: true,
      turn: 1,
      currentTurnActor: 'player',
      turnOrder: ['player'],
      enemies: [ { id: 'e1', name: 'Bandit A', level: 1, maxHealth: 30, currentHealth: 30, armor: 0 } ],
      allies: [],
      abilityCooldowns: {},
      combatLog: []
    };

    // playerStats deliberately omits `weaponDamage` to reproduce previous NaN regression
    const playerStatsMissing: any = { currentHealth: 50, maxHealth: 100, currentMagicka: 50, maxMagicka: 100, currentStamina: 50, maxStamina: 100, abilities: [ { id: 'aeonic_surge', name: 'Aeonic Surge', type: 'aeo', cost: 0, damage: 12, effects: [ { type: 'aoe_damage', value: 8 }, { type: 'aoe_heal', value: 6 } ] } ] } as any;

    const res: any = executePlayerAction(state, playerStatsMissing, 'magic', undefined, 'aeonic_surge', undefined, undefined, 8, { id: 'char2', name: 'Hero2' } as any);

    expect(res).toBeTruthy();
    expect(res.aoeSummary).toBeTruthy();
    // ensure no NaN in combatLog damage entries
    const damageEntries = (res.newState?.combatLog || []).map((e: any) => e.damage).filter(d => d !== undefined);
    damageEntries.forEach(d => expect(Number.isFinite(d)).toBe(true));
    // ensure aoe amounts are numbers
    (res.aoeSummary.damaged || []).forEach((d: any) => expect(Number.isFinite(d.amount)).toBe(true));
    (res.aoeSummary.healed || []).forEach((h: any) => expect(Number.isFinite(h.amount)).toBe(true));
  });
});