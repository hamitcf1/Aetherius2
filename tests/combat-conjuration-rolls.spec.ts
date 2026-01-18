import { expect, it, describe } from 'vitest';
import { initializeCombat, executePlayerAction } from '../services/combatService';

describe('Conjuration — roll outcomes affect summoned companion', () => {
  const char: any = { id: 'p1', name: 'Mage', level: 10, stats: { health: 100 }, skills: [] };
  const baseState = initializeCombat([
    { id: 'enemy1', name: 'Goblin', level: 1, maxHealth: 20, currentHealth: 20, armor: 0 }
  ], 'wastes', false, true, false, [] as any);

  it('nat 1 => conjuration fails (no summon)', () => {
    const playerStats: any = { currentHealth: 80, maxHealth: 100, currentMagicka: 200, maxMagicka: 200, abilities: [{ id: 'summon_skeleton', name: 'Summon Skeleton', type: 'magic', cost: 10, effects: [{ type: 'summon', name: 'Skeleton', duration: 3 }] }] };
    const realRandom = Math.random;
    Math.random = () => 0.001; // force d20 -> 1
    try {
      const res = executePlayerAction(baseState, playerStats, 'magic', undefined, 'summon_skeleton', undefined, undefined, undefined, char);
      expect(res.newState.allies.some((a: any) => a.isCompanion && a.companionMeta?.isSummon)).toBe(false);
      expect((res.narrative || '').toLowerCase()).toContain('fail');
    } finally { Math.random = realRandom; }
  });

  it('weak roll produces smaller/weaker summon', () => {
    const playerStats: any = { currentHealth: 80, maxHealth: 100, currentMagicka: 200, maxMagicka: 200, abilities: [{ id: 'summon_skeleton', name: 'Summon Skeleton', type: 'magic', cost: 10, effects: [{ type: 'summon', name: 'Skeleton', duration: 3, baseHealth: 30, baseDamage: 6 }] }] };
    const realRandomWeak = Math.random;
    Math.random = () => 0.225; // force d20 -> ~5
    try {
      const res = executePlayerAction(baseState, playerStats, 'magic', undefined, 'summon_skeleton', undefined, undefined, undefined, char);
      const s = res.newState.allies.find((a: any) => a.isCompanion && /skeleton/i.test(a.name));
      expect(s).toBeDefined();
      expect(s.maxHealth).toBeLessThan(30); // scaled down for weak roll
    } finally { Math.random = realRandomWeak; }
  });

  it('powerful roll (19) yields stronger summon', () => {
    const playerStats: any = { currentHealth: 80, maxHealth: 100, currentMagicka: 200, maxMagicka: 200, abilities: [{ id: 'summon_skeleton', name: 'Summon Skeleton', type: 'magic', cost: 10, effects: [{ type: 'summon', name: 'Skeleton', duration: 3, baseHealth: 30, baseDamage: 6 }] }] };
    const realRandomPower = Math.random;
    Math.random = () => 0.925; // force d20 -> ~19
    try {
      const res = executePlayerAction(baseState, playerStats, 'magic', undefined, 'summon_skeleton', undefined, undefined, undefined, char);
      const s = res.newState.allies.find((a: any) => a.isCompanion && /skeleton/i.test(a.name));
      expect(s).toBeDefined();
      expect(s.maxHealth).toBeGreaterThanOrEqual(30);
      // powerful should increase duration/health compared to baseline
      expect((res.newState.pendingSummons || [])[0].playerTurnsRemaining).toBeGreaterThanOrEqual(4);
    } finally { Math.random = realRandomPower; }
  });

  it('critical roll (20) can spawn an extra lesser minion', () => {
    const playerStats: any = { currentHealth: 80, maxHealth: 100, currentMagicka: 200, maxMagicka: 200, abilities: [{ id: 'summon_skeleton', name: 'Summon Skeleton', type: 'magic', cost: 10, effects: [{ type: 'summon', name: 'Skeleton', duration: 3, baseHealth: 30 }] }] };
    const realRandomCrit = Math.random;
    Math.random = () => 0.999; // force d20 -> 20
    try {
      const res = executePlayerAction(baseState, playerStats, 'magic', undefined, 'summon_skeleton', undefined, undefined, undefined, char);
      const summons = res.newState.allies.filter((a: any) => a.isCompanion && /skeleton/i.test(a.name));
      expect(summons.length).toBeGreaterThanOrEqual(1);
      // critical should produce at least one extra weaker minion (lower maxHealth than primary)
      const primary = summons.reduce((max: any, s: any) => (!max || s.maxHealth > max.maxHealth) ? s : max, null);
      const extraWeaker = summons.find((s: any) => s.id !== primary.id && s.maxHealth < primary.maxHealth);
      expect(extraWeaker).toBeDefined();
    } finally { Math.random = realRandomCrit; }
  });
});
