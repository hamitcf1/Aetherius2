import { describe, it, expect } from 'vitest';
import { generateEnemyLoot, finalizeLoot } from '../services/lootService';

describe('Loot generation and finalize behavior', () => {
  it('merges duplicate entries for the same enemy', () => {
    const enemy: any = {
      id: 'e1', name: 'Test Enemy', level: 1, isBoss: false,
      loot: [
        { name: 'Ectoplasm', type: 'misc', description: 'Ghostly residue', quantity: 2, dropChance: 100 },
        { name: 'Ectoplasm', type: 'misc', description: 'Ghostly residue', quantity: 2, dropChance: 100 }
      ]
    };

    const loot = generateEnemyLoot(enemy);
    // Should consolidate duplicates into one entry with summed quantity
    const found = loot.find(x => x.name === 'Ectoplasm');
    expect(found).toBeTruthy();
    expect(found!.quantity).toBe(4);
  });

  it('finalizeLoot enriches new inventory items with stats and assigns characterId when provided', () => {
    const state: any = {
      pendingLoot: [ { enemyId: 'e1', enemyName: 'Test Enemy', loot: [{ name: 'Iron Sword', type: 'weapon', description: 'A basic blade', quantity: 1 }] } ],
      pendingRewards: { xp: 0, gold: 0, items: [] }
    };

    const inventory: any[] = [];
    const res = finalizeLoot(state, [{ name: 'Iron Sword', quantity: 1 }], inventory, 'char1');
    const upd = res.updatedInventory;
    const item = upd.find(i => i.name === 'Iron Sword');
    expect(item).toBeTruthy();
    expect(item.characterId).toBe('char1');
    // From itemStats, the item should have a value and weight set
    expect(item.value).toBeGreaterThan(0);
    expect(item.weight).toBeGreaterThan(0);
  });
});