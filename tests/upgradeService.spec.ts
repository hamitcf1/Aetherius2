import { describe, it, expect } from 'vitest';
import { applyUpgrade, getMaxUpgradeForItem, canUpgrade } from '../services/upgradeService';
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

  it('respects shop stock when an upgrade recipe requires materials', () => {
    const item: InventoryItem = {
      id: 'iron_sword',
      characterId: 'c1',
      name: 'Iron Sword',
      type: 'weapon',
      description: 'A plain iron sword',
      quantity: 1,
      equipped: false,
      damage: 7,
      value: 45
    } as any;

    // By default, without shop context, upgrades remain allowed (backwards compatible)
    expect(canUpgrade(item)).toBe(true);

    // When shop does NOT include required material, canUpgrade should return false
    expect(canUpgrade(item, { shopItemIds: ['iron_ingot'] })).toBe(false);

    // When shop DOES include the required material, canUpgrade should return true
    expect(canUpgrade(item, { shopItemIds: ['steel_ingot', 'iron_ingot'] })).toBe(true);
  });
});
