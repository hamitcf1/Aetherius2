import { describe, it, expect } from 'vitest';
import { initializeCombat, executePlayerAction } from '../services/combatService';

describe('Conjuration — summoned health scaling', () => {
  it('enemy conjured minion has reasonable HP based on caster level', () => {
    const boss = { id: 'b1', name: 'Dremora Lord', level: 46, maxHealth: 500, currentHealth: 500, armor: 10, damage: 40, abilities: [], xpReward: 0 } as any;
    const state = initializeCombat([boss], 'wastes', false, true, false, [] as any);

    // Craft a simple conjure ability effect and force a normal roll
    const summonAbility = { id: 'enemy_conjure', name: 'Conjure Dremora Lord', type: 'magic', cost: 0, effects: [{ type: 'summon', name: 'Dremora Lord', duration: 3, baseHealth: undefined }] } as any;

    // Simulate enemy using conjuration via executePlayerAction (we pass actor as 'player' surrogate)
    // Force a normal nat (e.g., 15)
    // Provide a minimal character shape expected by combat helpers
    const casterChar: any = { id: 'p1', name: 'Invoker', level: 46, skills: [], stats: { health: 100, magicka: 100, stamina: 100 }, perks: [] };
    const res = executePlayerAction(state, { abilities: [summonAbility], currentHealth: 10, maxHealth: 100, currentMagicka: 100, maxMagicka: 100, currentStamina: 100, maxStamina: 100 } as any, 'magic', undefined, 'enemy_conjure', undefined, undefined, 15, casterChar);
    const summons = res.newState.allies.filter((a: any) => a.companionMeta?.isSummon);
    expect(summons.length).toBeGreaterThanOrEqual(1);
    // Ensure summon HP is scaled up for high-level caster (should be > 200 for level ~46 with hpPerLevel 11)
    const s = summons[0];
    expect(s.maxHealth).toBeGreaterThan(200);
  });
});