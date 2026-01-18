import { describe, it, expect } from 'vitest';
import { applyUpgrade, getMaxUpgradeForItem, canUpgrade, getUpgradeCost, getRequiredPlayerLevelForNextUpgrade } from '../services/upgradeService';

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

  it('does not reduce player level gating after a rarity upgrade (progression persists)', () => {
    const item: InventoryItem = {
      id: 'test_sword_2',
      characterId: 'char_1',
      name: 'Test Sword II',
      type: 'weapon',
      damage: 50,
      value: 300,
      upgradeLevel: getMaxUpgradeForItem({} as any)
    } as any;

    item.upgradeLevel = getMaxUpgradeForItem(item);
    item.rarity = 'common';

    const requiredBefore = getRequiredPlayerLevelForNextUpgrade(item);
    const { updated } = applyUpgrade(item); // rarity upgrade
    // After rarity-upgrade the visible upgradeLevel resets to 1 but the required player level
    // for the *next* upgrade should not be lower than it was before
    const requiredAfter = getRequiredPlayerLevelForNextUpgrade(updated as any);
    expect(requiredAfter).toBeGreaterThanOrEqual(requiredBefore);
    expect(requiredAfter).toBeGreaterThan(0);
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
      value: 45,
      rarity: 'rare'
    } as any;

    // By default, without shop context, upgrades remain allowed (backwards compatible)
    expect(canUpgrade(item)).toBe(true);

    // When shop does NOT include required material, canUpgrade should return false
    expect(canUpgrade(item, { shopItemIds: ['iron_ingot'] })).toBe(false);

    // When shop DOES include the required material, canUpgrade should return true
    expect(canUpgrade(item, { shopItemIds: ['steel_ingot', 'iron_ingot'] })).toBe(true);
  });

  it('enforces central recipes for uncommon+ items when shop context is provided', () => {
    const item: InventoryItem = { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', damage: 7, value: 45, rarity: 'uncommon' } as any;
    // central recipe exists and should be enforced for uncommon+ when shopItemIds is provided
    expect(canUpgrade(item, { shopItemIds: [] })).toBe(false);
    expect(canUpgrade(item, { shopItemIds: ['steel_ingot'] })).toBe(true);
  });

  it('caps upgrade cost at 10k for very high-value items', () => {
    const expensive: InventoryItem = { id: 'big_one', name: 'Big Sword', type: 'weapon', damage: 1000, value: 500000 } as any;
    const cost = getUpgradeCost(expensive);
    expect(cost).toBeLessThanOrEqual(10000);
  });
});
