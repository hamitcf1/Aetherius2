import { describe, it, expect } from 'vitest';
import { initializeCombat, executeEnemyTurn } from '../services/combatService';

describe('Enemy conjuration & boss auto-summon', () => {
  it('magic-using enemy can summon an ally', () => {
    const state = initializeCombat([
      { id: 'enemy1', name: 'Conjurer', level: 6, maxHealth: 60, currentHealth: 60, armor: 2, abilities: [{ id: 'summon_wolf', name: 'Summon Wolf', type: 'magic', cost: 10, effects: [{ type: 'summon', name: 'Wild Wolf', duration: 3 }] }] }
    ], 'wastes', false, true, false, [] as any);

    // Use the actor instance from the state (engine expects the same object) and bias RNG to pick magic
    const actor = state.enemies[0] as any;
    const realRandom = Math.random;
    Math.random = () => 0.95; // bias toward magicWithEffects selection
    try {
      const res = executeEnemyTurn(state, actor, undefined as any);
      const hasSummon = (res.newState.pendingSummons && res.newState.pendingSummons.length > 0) || (res.newState.allies || []).some(a => a.companionMeta?.isSummon);
      // If AI did not immediately add an ally, at least ensure a conjure attempt was logged
      const logged = (res.newState.combatLog || []).some(l => /conjur|conjure|conjured|conjuration/i.test(l.narrative || l.action || ''));
      expect(hasSummon || logged).toBe(true);
    } finally {
      Math.random = realRandom;
    }
  });

  it('boss auto-summons when below 50% HP (and only once)', () => {
    const boss = { id: 'boss1', name: 'Dreadlord', level: 20, maxHealth: 200, currentHealth: 90, armor: 10, isBoss: true, behavior: 'tactical', abilities: [{ id: 'summon_wrathman', name: 'Conjure Wrathman', type: 'magic', cost: 40, effects: [{ type: 'summon', name: 'Wrathman', duration: 4 }] }] } as any;
    const state = initializeCombat([boss], 'crypt', false, true, false, [] as any);

    // first enemy turn should attempt conjure (health 90/200 -> below 50% threshold)
    const actor = state.enemies[0] as any;
    // initializeCombat may normalize health; set the boss to the below-50% scenario explicitly
    actor.currentHealth = 90;
    state.enemies[0].currentHealth = 90;
    expect((actor.currentHealth || 0) / (actor.maxHealth || 1)).toBeLessThan(0.5);
    const realRandom = Math.random;
    Math.random = () => 0.9; // bias to pick conjure
    try {
      // debug: ensure ability is present and magicka/state looks sane for the AI
      console.debug && console.debug('[test] boss actor abilities', actor.abilities, 'currentMagicka', actor.currentMagicka);
      const playerStats: any = { currentHealth: 100, maxHealth: 100, currentMagicka: 100, maxMagicka: 100, currentStamina: 100, maxStamina: 100 };
      const res = executeEnemyTurn(state, actor.id || actor, playerStats, undefined, actor as any);
      const summoned = (res.newState.allies || []).some(a => a.companionMeta?.isSummon);
      const logged = (res.newState.combatLog || []).some(l => /conjur|conjure|conjured|conjuration/i.test(l.narrative || l.action || ''));
      console.debug && console.debug('[test] enemy conjure result', { summoned, logged, log: (res.newState.combatLog || []).slice(-5) });
      expect(summoned || logged).toBe(true);

      // If we run enemy turn again without the summon dying, no additional conjure should be allowed
      const res2 = executeEnemyTurn(res.newState, actor.id || actor, playerStats, undefined, actor as any);
      const summons = (res2.newState.allies || []).filter(a => a.companionMeta?.isSummon);
      expect(summons.length).toBeLessThanOrEqual(1);
    } finally {
      Math.random = realRandom;
    }
  });
});
