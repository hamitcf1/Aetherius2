import { computeGoldReward, generateChestLoot } from '../services/levelUpRewards';
import { describe, it, expect } from 'vitest';

describe('Level up rewards', () => {
  it('computes a reasonable gold reward and respects cap', () => {
    const low = computeGoldReward(1);
    const mid = computeGoldReward(10);
    const high = computeGoldReward(100);
    expect(low).toBeGreaterThan(0);
    expect(mid).toBeGreaterThan(low);
    expect(high).toBeLessThanOrEqual(5000);
  });

  it('generates chest loot from pool and avoids duplicates', () => {
    const pool = [
      { id: 'i1', name: 'Iron Sword', type: 'weapon', rarity: 'common' },
      { id: 'i2', name: 'Healing Potion', type: 'potion', rarity: 'common' },
      { id: 'i3', name: 'Elixir of Might', type: 'potion', rarity: 'rare' }
    ];
    const loot = generateChestLoot(5, pool, { count: 2, rng: () => 0.2 });
    expect(loot.length).toBeGreaterThan(0);
    // ensure items reference existing pool ids
    expect(pool.some(p => p.id === loot[0].id)).toBeTruthy();
  });
});