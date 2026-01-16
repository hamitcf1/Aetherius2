import { describe, it, expect } from 'vitest';
import { finalizeLoot } from '../services/lootService';
import { getItemStats } from '../services/itemStats';

describe('Loot enrichment heuristics', () => {
  it('getItemStats fallback detects axe keywords', () => {
    const stats = getItemStats("Bandit's Axe", 'weapon');
    expect(stats.damage).toBeGreaterThan(0);
  });

  it('infers weapon type and stats from AI-crafted names', () => {
    const state: any = {
      pendingLoot: [{ enemyId: 'e1', enemyName: 'Thug', loot: [{ name: "Bandit's Axe", type: 'misc', description: 'A rusty, but still functional, axe.', quantity: 1 }] }],
      pendingRewards: { xp: 0, gold: 0, items: [] }
    };

    const inventory: any[] = [];
    const res = finalizeLoot(state, [{ name: "Bandit's Axe", quantity: 1 }], inventory, 'char1');
    const item = res.updatedInventory.find(i => i.name === "Bandit's Axe");
    expect(item).toBeTruthy();
    // Should have been re-typed as a weapon
    expect(item.type).toBe('weapon');
    // And should have damage inferred
    expect(item.damage).toBeGreaterThan(0);
  });
});