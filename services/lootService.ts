import { CombatState, InventoryItem, CombatEnemy } from '../types';

// Compute XP for a single enemy (kept intentionally low)
export const computeEnemyXP = (enemy: CombatEnemy) => {
  const base = Math.max(1, Math.floor((enemy.level || 1) * 3));
  return enemy.isBoss ? base * 2 : base;
};

import LOOT_TABLES, { LootTableEntry, getLootTableForEnemy } from '../data/lootTables';
import { getItemStats, shouldHaveStats } from './itemStats';

// Helper: pick one item from weighted table
const pickWeighted = (table: LootTableEntry[], rng = Math.random): LootTableEntry | null => {
  if (!table || table.length === 0) return null;
  const total = table.reduce((s, t) => s + (t.weight || 1), 0);
  let r = rng() * total;
  for (const t of table) {
    r -= (t.weight || 1);
    if (r <= 0) return t;
  }
  return table[table.length - 1] || null;
};

const scaledChance = (entry: LootTableEntry, level: number, isBoss = false) => {
  // Scale chance slightly by level and bossness, convert weight into an approximate chance when baseChance not present
  if (typeof entry.baseChance === 'number') return Math.min(100, Math.max(0, entry.baseChance + level * 0.5 + (isBoss ? 10 : 0)));
  // fallback: common weight -> decent chance, rare weight -> low; use weight to compute
  const base = Math.min(95, Math.max(1, (entry.weight || 1) * 4 + level * 0.5 + (isBoss ? 10 : 0)));
  return base;
};

// Generate loot for an enemy based on its loot table or global tables
export const generateEnemyLoot = (enemy: CombatEnemy): Array<{ name: string; type: string; description: string; quantity: number; rarity?: string }> => {
  const items: Array<{ name: string; type: string; description: string; quantity: number; rarity?: string }> = [];

  // 1) If enemy declares an explicit loot table, honor it (backwards compat)
  if (enemy.loot && enemy.loot.length > 0) {
    enemy.loot.forEach(lootItem => {
      const chance = lootItem.dropChance ?? 50;
      if (Math.random() * 100 < chance) {
        items.push({ name: lootItem.name, type: lootItem.type, description: lootItem.description || '', quantity: lootItem.quantity || 1, rarity: (lootItem as any).rarity });
      }
    });
  } else {
    // 2) Otherwise sample from LOOT_TABLES by enemy.type (using effective table with boss overrides)
    let table = getLootTableForEnemy(enemy.type, !!enemy.isBoss);
    // If no table entries exist for the enemy type, fall back to a generic common table
    if (!table || table.length === 0) {
      table = [
        { id: 'fallback_coins', name: 'Coin Pouch', type: 'misc', description: 'A small pouch of coins.', weight: 30, minQty: 3, maxQty: 20, rarity: 'common' },
        { id: 'fallback_scraps', name: 'Scraps', type: 'misc', description: 'Odds and ends from the battlefield.', weight: 20, minQty: 1, maxQty: 3, rarity: 'common' },
        { id: 'fallback_potion', name: 'Minor Health Potion', type: 'potion', description: 'Restores a little health.', weight: 6, minQty: 1, maxQty: 1, rarity: 'common' }
      ];
    }
    // Attempt multiple picks so enemies can drop several items; number of attempts scales mildly with level
    const attempts = Math.max(1, Math.min(6, Math.floor(1 + (enemy.level || 1) / 3 + (enemy.isBoss ? 1 : 0))));
    for (let i = 0; i < attempts; i++) {
      const pick = pickWeighted(table);
      if (!pick) continue;
      const chance = scaledChance(pick, enemy.level || 1, !!enemy.isBoss);
      if (Math.random() * 100 < chance) {
        const qtyRangeMax = (pick.maxQty || (pick.minQty || 1));
        const qtyRangeMin = (pick.minQty || 1);
        const qty = qtyRangeMin + Math.floor(Math.random() * (qtyRangeMax - qtyRangeMin + 1));
        items.push({ name: pick.name, type: pick.type, description: pick.description || '', quantity: qty, rarity: (pick as any).rarity });
      }
    }
  }

  // Guarantee at least some reward: if nothing dropped, give small gold or scraps
  if (items.length === 0) {
    const fallbackGold = Math.max(1, Math.floor((enemy.goldReward || (enemy.level || 1) * 2) * (enemy.isBoss ? 2 : 1)));
    items.push({ name: 'Coin Pouch', type: 'misc', description: 'Collected coins.', quantity: fallbackGold, rarity: 'common' });
  }

  // Consolidate duplicate names into single entries (sum quantities) to avoid duplicate rows in the loot UI
  const consolidated: Record<string, { name: string; type: string; description: string; quantity: number; rarity?: string }> = {};
  items.forEach(it => {
    const key = it.name;
    if (!consolidated[key]) {
      consolidated[key] = { ...it };
    } else {
      consolidated[key].quantity += it.quantity;
    }
  });

  return Object.values(consolidated);
};

// Populate pending loot for all defeated enemies
export const populatePendingLoot = (state: CombatState): CombatState => {
  const newState = { ...state };
  newState.pendingLoot = newState.enemies
    .filter(enemy => enemy.currentHealth <= 0) // Only defeated enemies
    .map(enemy => ({
      enemyId: enemy.id,
      enemyName: enemy.name,
      loot: generateEnemyLoot(enemy),
    }));

  return newState;
};

// Finalize loot: apply selected items to player's inventory atomically and mark rewards
// selectedItems: Array of { name, quantity }
import { getTransactionLedger } from './transactionLedger';

export const finalizeLoot = (
  state: CombatState,
  selectedItems: Array<{ name: string; quantity: number }> | null,
  currentInventory: InventoryItem[],
  characterId?: string
): { newState: CombatState; updatedInventory: InventoryItem[]; grantedXp: number; grantedGold: number; grantedItems: Array<{ name: string; type: string; description: string; quantity: number }>; companionXp?: Array<{ companionId: string; xp: number }> } => {
  let newState = { ...state };
  const grantedItems: Array<{ name: string; type: string; description: string; quantity: number }> = [];
  let updatedInventory = [...currentInventory];

  if (!newState.pendingRewards) newState.pendingRewards = { xp: 0, gold: 0, items: [] };

  // If selectedItems is null => player skipped looting
  const selections = selectedItems || [];

  // Apply selections atomically
  selections.forEach(sel => {
    // Try to find a matching pendingLoot entry to determine type/description
    let meta: any = undefined;
    (newState.pendingLoot || []).forEach(pl => {
      const found = pl.loot.find(l => l.name === sel.name);
      if (found) meta = found;
    });

    const qty = sel.quantity || 1;

    // Enrich with item stats when possible
    let itemType = meta?.type || 'misc';
    let itemDesc = meta?.description || '';
    let itemRarity = meta?.rarity;

    // Use core stats for weapons/apparel
    try {
      const { getItemStats, shouldHaveStats } = require('./itemStats');
      const stats = getItemStats(sel.name, itemType);

      // Add fallback description/value/weight from stats
      const value = stats.value ?? (itemType === 'potion' ? 10 : itemType === 'misc' ? 5 : 15);
      const weight = Math.max(0.1, Math.round(((stats.armor || stats.damage || 1) * 10)) / 10);

      // record as granted item with type/description
      grantedItems.push({ name: sel.name, type: itemType, description: itemDesc, quantity: qty });

      // Add to inventory (merge by name) and include stats
      const idx = updatedInventory.findIndex(it => it.name === sel.name);
      if (idx === -1) {
        const newItem: InventoryItem = {
          id: `loot_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
          characterId: characterId || '',
          name: sel.name,
          type: itemType as any,
          description: itemDesc,
          quantity: qty,
          equipped: false,
          weight: weight,
          value: value,
          rarity: itemRarity
        } as InventoryItem;

        // If item should have equipment stats, copy them
        if (shouldHaveStats(itemType)) {
          if (stats.damage) newItem.damage = stats.damage;
          if (stats.armor) newItem.armor = stats.armor;
        }

        updatedInventory.push(newItem);
      } else {
        const copy = { ...updatedInventory[idx], quantity: (updatedInventory[idx].quantity || 0) + qty } as InventoryItem;
        // Ensure we have value/weight if missing
        if (!copy.value) copy.value = stats.value ?? copy.value ?? (itemType === 'misc' ? 5 : 10);
        if (!copy.weight) copy.weight = copy.weight ?? Math.max(0.1, Math.round(((stats.armor || stats.damage || 1) * 10)) / 10);
        updatedInventory[idx] = copy;
      }
    } catch (e) {
      // Fallback: no stats available
      grantedItems.push({ name: sel.name, type: itemType, description: itemDesc, quantity: qty });
      const idx = updatedInventory.findIndex(it => it.name === sel.name);
      if (idx === -1) {
        updatedInventory.push({
          id: `loot_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
          characterId: characterId || '',
          name: sel.name,
          type: itemType,
          description: itemDesc,
          quantity: qty,
          equipped: false,
          value: itemType === 'misc' ? 5 : 10,
          weight: 1
        } as InventoryItem);
      } else {
        const copy = { ...updatedInventory[idx], quantity: (updatedInventory[idx].quantity || 0) + qty };
        updatedInventory[idx] = copy;
      }
    }
  });

  // Grant XP and gold from pendingRewards (but scale conservatively)
  const grantedXp = Math.max(0, newState.pendingRewards?.xp || 0);
  const grantedGold = Math.max(0, newState.pendingRewards?.gold || 0);

  // Debug log to verify rewards are being read
  console.log('[finalizeLoot] Granting rewards:', { grantedXp, grantedGold, pendingRewards: newState.pendingRewards });

  // Compute companion XP distribution from defeated enemies' XP, split evenly among participating companions
  const defeated = (state.enemies || []).filter(e => e.currentHealth <= 0);
  const totalEnemyXp = defeated.reduce((s, e) => s + computeEnemyXP(e), 0);
  const companionIds = (state.allies || []).filter(a => a.isCompanion && a.companionMeta && a.companionMeta.companionId).map(a => a.companionMeta!.companionId);
  const companionXp: Array<{ companionId: string; xp: number }> = [];
  if (companionIds.length > 0 && totalEnemyXp > 0) {
    const per = Math.max(1, Math.floor(totalEnemyXp / companionIds.length));
    companionIds.forEach(cid => companionXp.push({ companionId: cid, xp: per }));
  }

  // Mark rewards applied and persist transaction id so external systems can deduplicate
  // NOTE: We generate a transaction ID but do NOT record it here.
  // The caller (App.tsx handleGameUpdate) will record it AFTER successfully applying the rewards.
  // This prevents the bug where rewards were filtered out as "duplicate" before being applied.
  const txnId = getTransactionLedger().generateTransactionId();
  newState.rewards = { xp: grantedXp, gold: grantedGold, items: grantedItems, transactionId: txnId, combatId: newState.id, companionXp };
  newState.result = 'victory';
  newState.rewardsApplied = true;
  newState.completed = true;
  newState.lootPending = false;
  newState.pendingLoot = [];
  newState.pendingRewards = undefined;

  // DO NOT record here - let the caller record after applying to prevent duplicate-filtering bug

  return { newState, updatedInventory, grantedXp, grantedGold, grantedItems };
};
