import { describe, it, expect } from 'vitest';
import { applyUpgrade, getMaxUpgradeForItem } from '../services/upgradeService';
import type { InventoryItem } from '../types';

describe('upgradeService - rarity upgrade behavior', () => {
  it('upgrades rarity when at max level and preserves stats', () => {
    const item: InventoryItem = {
      id: 'test_sword_1',
      characterId: 'char_1',
      name: 'Test Sword',
      type: 'weapon',
      description: 'A test sword',
      quantity: 1,
      equipped: false,
      equippedBy: null,
      damage: 100,
      value: 200,
      upgradeLevel: getMaxUpgradeForItem({} as any) // placeholder, will override below
    } as any;

    // Ensure the item reports max upgrade level for a weapon
    item.upgradeLevel = getMaxUpgradeForItem(item);
    item.rarity = 'common';

    const { updated, cost } = applyUpgrade(item);

    expect(cost).toBeGreaterThan(0);
    expect(updated.upgradeLevel).toBe(1);
    expect(updated.rarity).toBeTruthy();
    expect(updated.rarity).not.toBe('common');
    // Damage should be preserved on rarity upgrade
    expect(updated.damage).toEqual(100);
    // Value should increase (rough heuristic used by service: approximately +50%)
    expect(typeof updated.value).toBe('number');
    expect((updated.value || 0)).toBeGreaterThanOrEqual(200);
  });
});
