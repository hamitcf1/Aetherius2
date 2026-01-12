import { CombatState, InventoryItem, CombatEnemy } from '../types';

// Compute XP for a single enemy (kept intentionally low)
export const computeEnemyXP = (enemy: CombatEnemy) => {
  const base = Math.max(1, Math.floor((enemy.level || 1) * 3));
  return enemy.isBoss ? base * 2 : base;
};

import LOOT_TABLES, { LootTableEntry, getLootTableForEnemy } from '../data/lootTables';

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
export const generateEnemyLoot = (enemy: CombatEnemy): Array<{ name: string; type: string; description: string; quantity: number }> => {
  const items: Array<{ name: string; type: string; description: string; quantity: number }> = [];

  // 1) If enemy declares an explicit loot table, honor it (backwards compat)
  if (enemy.loot && enemy.loot.length > 0) {
    enemy.loot.forEach(lootItem => {
      const chance = lootItem.dropChance ?? 50;
      if (Math.random() * 100 < chance) {
        items.push({ name: lootItem.name, type: lootItem.type, description: lootItem.description || '', quantity: lootItem.quantity });
      }
    });
  } else {
    // 2) Otherwise sample from LOOT_TABLES by enemy.type (using effective table with boss overrides)
    const table = getLootTableForEnemy(enemy.type, !!enemy.isBoss);
    // Attempt multiple picks so enemies can drop several items; number of attempts scales mildly with level
    const attempts = Math.max(1, Math.min(4, Math.floor(1 + (enemy.level || 1) / 3 + (enemy.isBoss ? 1 : 0))));
    for (let i = 0; i < attempts; i++) {
      const pick = pickWeighted(table);
      if (!pick) continue;
      const chance = scaledChance(pick, enemy.level || 1, !!enemy.isBoss);
      if (Math.random() * 100 < chance) {
        const qtyRangeMax = (pick.maxQty || (pick.minQty || 1));
        const qtyRangeMin = (pick.minQty || 1);
        const qty = qtyRangeMin + Math.floor(Math.random() * (qtyRangeMax - qtyRangeMin + 1));
        items.push({ name: pick.name, type: pick.type, description: pick.description || '', quantity: qty });
      }
    }
  }

  // Guarantee at least some reward: if nothing dropped, give small gold or scraps
  if (items.length === 0) {
    const fallbackGold = Math.max(1, Math.floor((enemy.goldReward || (enemy.level || 1) * 2) * (enemy.isBoss ? 2 : 1)));
    items.push({ name: 'Coin Pouch', type: 'misc', description: 'Collected coins.', quantity: fallbackGold });
  }

  return items;
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
  currentInventory: InventoryItem[]
): { newState: CombatState; updatedInventory: InventoryItem[]; grantedXp: number; grantedGold: number; grantedItems: Array<{ name: string; type: string; description: string; quantity: number }> } => {
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
    grantedItems.push({ name: sel.name, type: meta?.type || 'misc', description: meta?.description || '', quantity: qty });

    // Add to inventory (merge by name)
    const idx = updatedInventory.findIndex(it => it.name === sel.name);
    if (idx === -1) {
      updatedInventory.push({
        id: `loot_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        characterId: '',
        name: sel.name,
        type: meta?.type || 'misc',
        description: meta?.description || '',
        quantity: qty,
        equipped: false
      } as InventoryItem);
    } else {
      const copy = { ...updatedInventory[idx], quantity: (updatedInventory[idx].quantity || 0) + qty };
      updatedInventory[idx] = copy;
    }
  });

  // Grant XP and gold from pendingRewards (but scale conservatively)
  const grantedXp = Math.max(0, newState.pendingRewards?.xp || 0);
  const grantedGold = Math.max(0, newState.pendingRewards?.gold || 0);

  // Mark rewards applied and persist transaction id so external systems can deduplicate
  const txnId = getTransactionLedger().generateTransactionId();
  newState.rewards = { xp: grantedXp, gold: grantedGold, items: grantedItems, transactionId: txnId, combatId: newState.id };
  newState.result = 'victory';
  newState.rewardsApplied = true;
  newState.completed = true;
  newState.lootPending = false;
  newState.pendingLoot = [];
  newState.pendingRewards = undefined;

  // Record transaction to ledger so duplicate AI responses won't re-grant the same rewards
  getTransactionLedger().recordTransaction(txnId, {
    goldAmount: grantedGold,
    xpAmount: grantedXp,
    items: grantedItems.map(i => ({ name: i.name, quantity: i.quantity, added: true }))
  });

  return { newState, updatedInventory, grantedXp, grantedGold, grantedItems };
};
