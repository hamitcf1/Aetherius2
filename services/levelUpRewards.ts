// Level-up reward helper utilities

import { InventoryItem } from '../types';

export type Reward =
  | { type: 'gold'; amount: number }
  | { type: 'chest'; items: InventoryItem[] };

const GOLD_CAP = 5000;

// Rarity unlock by level (inclusive)
export const RARITY_BY_LEVEL = [
  { maxLevel: 5, rarities: ['common', 'uncommon'] },
  { maxLevel: 10, rarities: ['common', 'uncommon', 'rare'] },
  { maxLevel: 20, rarities: ['common', 'uncommon', 'rare', 'mythic'] },
  { maxLevel: 100, rarities: ['common', 'uncommon', 'rare', 'mythic', 'epic'] }
];

export function computeGoldReward(level: number) {
  // Simple, adjustable progression curve: base + linear + level^1.2 scaling, capped
  const base = 30;
  const linear = level * 12;
  const scaling = Math.floor(Math.pow(level, 1.2) * 6);
  const amount = Math.min(GOLD_CAP, base + linear + scaling);
  return Math.max(1, amount);
}

export function generateChestLoot(level: number, availableItems: InventoryItem[], opts?: { count?: number, rng?: () => number }): InventoryItem[] {
  const rng = opts?.rng || Math.random;
  const count = opts?.count ?? 1;

  // Determine allowed rarities for this level
  let allowed: string[] = ['common'];
  for (const r of RARITY_BY_LEVEL) {
    if (level <= r.maxLevel) { allowed = r.rarities; break; }
  }

  // Filter items to eligible pool: types (equipment, potion, ingredient, food, drink, apparel, weapon)
  const allowedTypes = new Set(['weapon', 'apparel', 'potion', 'ingredient', 'food', 'drink', 'misc']);
  const pool = availableItems.filter(it => it && allowedTypes.has(it.type) && (it.rarity ? allowed.includes(it.rarity) : true));
  if (pool.length === 0) return [];

  // Predefined rarity weights (modifiable)
  const rarityWeights: Record<string, number> = {
    common: 70,
    uncommon: 20,
    rare: 7,
    mythic: 2,
    epic: 1,
    legendary: 0
  };

  // Build weighted pool
  const weighted: Array<{ item: InventoryItem; weight: number }> = pool.map(i => ({ item: i, weight: rarityWeights[(i.rarity || 'common') as string] || 1 }));

  // Helper pick
  function pickOne(): InventoryItem | null {
    const total = weighted.reduce((s, w) => s + w.weight, 0);
    if (total <= 0) return null;
    let r = Math.floor(rng() * total);
    for (const w of weighted) {
      if (r < w.weight) return { ...w.item, quantity: 1 } as InventoryItem;
      r -= w.weight;
    }
    return null;
  }

  const chosen: InventoryItem[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  while (chosen.length < count && attempts < 50) {
    attempts += 1;
    const p = pickOne();
    if (!p) break;
    const key = p.id || p.name;
    if (seen.has(key)) continue; // avoid duplicates
    seen.add(key);
    chosen.push(p);
  }

  return chosen;
}
