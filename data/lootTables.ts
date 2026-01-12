import { LootRarity } from '../types';

export interface LootTableEntry {
  id: string;
  name: string;
  type: string; // 'weapon' | 'apparel' | 'potion' | 'misc' | 'gold'
  description?: string;
  weight?: number; // relative weight for sampling
  minQty?: number;
  maxQty?: number;
  rarity?: LootRarity;
  baseChance?: number; // optional explicit chance (0-100)
}

// Baseline loot tables by enemy type. These are conservative and are scaled by enemy.level and isBoss.
export const LOOT_TABLES: Record<string, LootTableEntry[]> = {
  humanoid: [
    { id: 'hum_gold_small', name: 'Copper Coins', type: 'misc', description: 'Small pouch of coins.', weight: 30, minQty: 5, maxQty: 25, rarity: 'common' },
    { id: 'hum_health_potion', name: 'Minor Health Potion', type: 'potion', description: 'Restores a little health.', weight: 8, minQty: 1, maxQty: 1, rarity: 'common' },
    { id: 'hum_leather', name: 'Leather Scraps', type: 'misc', weight: 15, minQty: 1, maxQty: 3, rarity: 'common' },
    { id: 'hum_ring', name: 'Silver Ring', type: 'misc', weight: 4, minQty: 1, maxQty: 1, rarity: 'uncommon' },
    { id: 'hum_iron_dagger', name: 'Iron Dagger', type: 'weapon', weight: 3, minQty: 1, maxQty: 1, rarity: 'uncommon' },
    { id: 'hum_gold_large', name: 'Small Coin Purse', type: 'misc', weight: 6, minQty: 15, maxQty: 60, rarity: 'uncommon' },
    { id: 'hum_rare_trinket', name: 'Ornate Trinket', type: 'misc', weight: 1, minQty: 1, maxQty: 1, rarity: 'rare' }
  ],
  beast: [
    { id: 'beast_meat', name: 'Raw Meat', type: 'misc', weight: 40, minQty: 1, maxQty: 3, rarity: 'common' },
    { id: 'beast_hide', name: 'Animal Hide', type: 'misc', weight: 25, minQty: 1, maxQty: 2, rarity: 'common' },
    { id: 'beast_trophy', name: 'Monster Fang', type: 'misc', weight: 10, minQty: 1, maxQty: 1, rarity: 'uncommon' },
    { id: 'beast_gem', name: 'Dull Gem', type: 'misc', weight: 2, minQty: 1, maxQty: 1, rarity: 'rare' }
  ],
  undead: [
    { id: 'und_bones', name: 'Bone Fragments', type: 'misc', weight: 40, minQty: 1, maxQty: 3, rarity: 'common' },
    { id: 'und_essence', name: 'Ectoplasm', type: 'misc', weight: 20, minQty: 1, maxQty: 2, rarity: 'uncommon' },
    { id: 'und_curse_scroll', name: 'Scroll of Minor Hex', type: 'misc', weight: 3, minQty: 1, maxQty: 1, rarity: 'rare' }
  ],
  daedra: [
    { id: 'dae_essence', name: 'Daedric Soul Fragment', type: 'misc', weight: 20, minQty: 1, maxQty: 1, rarity: 'uncommon' },
    { id: 'dae_uncommon', name: 'Imbued Shard', type: 'misc', weight: 10, minQty: 1, maxQty: 2, rarity: 'rare' },
    { id: 'dae_rare', name: 'Daedric Relic', type: 'misc', weight: 2, minQty: 1, maxQty: 1, rarity: 'legendary' }
  ],
  dragon: [
    { id: 'drg_scale', name: 'Dragon Scale', type: 'misc', weight: 30, minQty: 1, maxQty: 3, rarity: 'rare' },
    { id: 'drg_bone', name: 'Dragon Bone', type: 'misc', weight: 10, minQty: 1, maxQty: 2, rarity: 'rare' },
    { id: 'drg_gold', name: 'Pouch of Gold', type: 'misc', weight: 20, minQty: 50, maxQty: 200, rarity: 'uncommon' }
  ],
  automaton: [
    { id: 'aut_gear', name: 'Mechanical Gear', type: 'misc', weight: 30, minQty: 1, maxQty: 4, rarity: 'common' },
    { id: 'aut_metal', name: 'Refined Metal', type: 'misc', weight: 20, minQty: 1, maxQty: 3, rarity: 'uncommon' },
    { id: 'aut_core', name: 'Power Core', type: 'misc', weight: 3, minQty: 1, maxQty: 1, rarity: 'rare' }
  ]
};

// Rarity multipliers reduce the effective weight of rarer items; bosses will also boost weights of rare/unique entries
export const RARITY_MULTIPLIER: Record<LootRarity, number> = {
  common: 1.0,
  uncommon: 0.7,
  rare: 0.35,
  legendary: 0.12
};

// Boss-specific loot additions (merged into base tables when enemy.isBoss is true)
export const BOSS_TABLES: Record<string, LootTableEntry[]> = {
  humanoid: [
    { id: 'hum_boss_greataxe', name: 'Great Axe', type: 'weapon', description: 'A heavy greataxe dropped by the leader.', weight: 6, minQty: 1, maxQty: 1, rarity: 'rare' },
    { id: 'hum_boss_gold', name: 'Gold Hoard', type: 'misc', description: 'A larger hoard of coins.', weight: 12, minQty: 100, maxQty: 300, rarity: 'uncommon' },
    { id: 'hum_boss_ring', name: 'Ring of Valor', type: 'misc', description: 'A finely crafted ring.', weight: 3, minQty: 1, maxQty: 1, rarity: 'legendary' }
  ],
  dragon: [
    { id: 'drg_boss_scale', name: 'Pristine Dragon Scale', type: 'misc', description: 'A shimmering, intact dragon scale.', weight: 6, minQty: 1, maxQty: 2, rarity: 'legendary' },
    { id: 'drg_boss_essence', name: 'Dragon Essence', type: 'misc', description: 'Condensed draconic power.', weight: 4, minQty: 1, maxQty: 1, rarity: 'rare' }
  ],
  daedra: [
    { id: 'dae_boss_relic', name: 'Daedric Artifact', type: 'misc', description: 'A potent artifact of Daedra.', weight: 3, minQty: 1, maxQty: 1, rarity: 'legendary' }
  ]
};

// Return an effective loot table for sampling, applying rarity multipliers and boss boosts where appropriate
export const getLootTableForEnemy = (type: string, isBoss: boolean = false): LootTableEntry[] => {
  const base = LOOT_TABLES[type] || [];
  const bossAdditions = isBoss ? (BOSS_TABLES[type] || []) : [];
  const merged = [...base, ...bossAdditions];

  return merged.map(entry => {
    const rarityMult = entry.rarity ? (RARITY_MULTIPLIER[entry.rarity] ?? 1) : 1;
    const bossBoost = isBoss && !bossAdditions.find(b => b.id === entry.id) ? 1.1 : 1; // slightly increase base table weights for bosses
    return { ...entry, weight: (entry.weight || 1) * rarityMult * bossBoost } as LootTableEntry;
  });
};

export default LOOT_TABLES;
