import { InventoryItem } from '../types';

// Tunable constants
const MAX_UPGRADE_WEAPON = 5;
const MAX_UPGRADE_APPAREL = 5;

// Rarity order (progression when max upgrade reached)
const RARITY_ORDER = ['common', 'uncommon', 'rare', 'mythic', 'epic'] as const;

// Cost multipliers
// Lower base multiplier to keep upgrade costs reasonable
const BASE_COST_MULTIPLIER = 0.45; // base multiplier (reduced)
const TYPE_MULTIPLIER: Record<string, number> = {
  weapon: 1.05,
  apparel: 0.9
};

// Rarity cost multipliers (higher rarity = more expensive to upgrade)
const RARITY_COST_MULTIPLIER: Record<string, number> = {
  common: 0.8,
  uncommon: 1.0,
  rare: 1.25,
  mythic: 1.6,
  epic: 2.2
};

// Per-level stat increases by rarity (percentage of base/current stat)
const WEAPON_DAMAGE_BONUS_PER_LEVEL_BY_RARITY: Record<string, number> = {
  common: 0.06,
  uncommon: 0.05,
  rare: 0.04,
  mythic: 0.03,
  epic: 0.02
};

const ARMOR_BONUS_PER_LEVEL_BY_RARITY: Record<string, number> = {
  common: 0.05,
  uncommon: 0.04,
  rare: 0.035,
  mythic: 0.03,
  epic: 0.02
};

export function getMaxUpgradeForItem(item: InventoryItem) {
  if (typeof item.maxUpgradeLevel === 'number') return item.maxUpgradeLevel;
  return item.type === 'weapon' ? MAX_UPGRADE_WEAPON : (item.type === 'apparel' ? MAX_UPGRADE_APPAREL : 0);
}

export function getUpgradeCost(item: InventoryItem): number {
  const baseValue = (item.value && Number.isFinite(item.value)) ? item.value : 10;
  const typeMul = TYPE_MULTIPLIER[item.type] ?? 1.0;
  const level = item.upgradeLevel || 0;
  const rarity = (item.rarity || 'common') as string;
  const rarityMul = RARITY_COST_MULTIPLIER[rarity] ?? 1.0;

  // Reduce scaling for common -> rare tiers so early upgrades remain affordable
  const gentleRarities = ['common', 'uncommon', 'rare'];
  let cost = 0;
  if (gentleRarities.includes(rarity)) {
    // Gentler scaling: reduced base and slower exponential growth
    cost = Math.round((BASE_COST_MULTIPLIER * 0.6) * baseValue * typeMul * rarityMul * (1 + 0.3 * level) * Math.pow(1.03, level));
  } else {
    // For higher rarities use slightly stronger scaling but keep growth capped
    cost = Math.round(BASE_COST_MULTIPLIER * baseValue * typeMul * rarityMul * (1 + 0.4 * level) * Math.pow(1.06, level));
  }

  // Soft cap to avoid astronomical upgrade prices in corner cases
  const SOFT_CAP = 10000;
  cost = Math.min(cost, SOFT_CAP);
  return Math.max(1, cost);
}

// Optional upgrade recipes keyed by stable item id or normalized name.
// Each entry can target a specific nextUpgradeLevel (or apply to any next level when omitted).
const UPGRADE_RECIPES: Record<string, Array<{ nextUpgradeLevel?: number; requirements: Array<{ itemId: string; quantity?: number }> }>> = {
  // Example: Iron Sword upgrades require an iron/steel ingot to be available in shop
  'iron_sword': [ { nextUpgradeLevel: 1, requirements: [{ itemId: 'steel_ingot', quantity: 2 }] } ],
  // Curated example: Honed steel longswod needs steel_ingot for a higher-tier upgrade
  'honed_steel_longsword': [ { requirements: [{ itemId: 'steel_ingot', quantity: 3 }] } ]
};

// Rarity map used for gating recipe enforcement
const RARITY_INDEX: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  mythic: 3,
  epic: 4,
  legendary: 5
};
const isRarityAtLeast = (r?: string, threshold: string = 'rare') => (RARITY_INDEX[(r || 'common')] ?? 0) >= (RARITY_INDEX[threshold] ?? 2);

/**
 * Returns material requirements for the *next* upgrade of `item`, if any.
 * Prefers an explicit `item.upgradeRequirements` on the InventoryItem, then
 * falls back to named entries in UPGRADE_RECIPES. Central recipes are only
 * enforced for rarity `rare` and above — per design, common/uncommon upgrades
 * do not require smithing materials by default.
 */
export function getRequirementsForNextUpgrade(item: InventoryItem) {
  if (!item) return undefined;
  const explicit = (item as any).upgradeRequirements as Array<{ itemId: string; quantity?: number }> | undefined;
  if (explicit && explicit.length > 0) return explicit;

  // Only enforce central recipes for items of rarity `rare` or higher
  const itemRarity = (item.rarity || 'common') as string;
  if (!isRarityAtLeast(itemRarity, 'rare')) return undefined;

  const key = item.id || (item.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const recipes = UPGRADE_RECIPES[key];
  if (!recipes || recipes.length === 0) return undefined;
  const nextLevel = (item.upgradeLevel || 0) + 1;
  // pick recipe that matches nextUpgradeLevel or the first if none match
  const match = recipes.find(r => typeof r.nextUpgradeLevel === 'number' ? r.nextUpgradeLevel === nextLevel : true) || recipes[0];
  return match.requirements;
}

/**
 * Determine whether an item can be upgraded.
 * If `opts.shopItemIds` is provided, any material requirements will be validated
 * against that set (useful for UI that wants to require materials to be present in the shop).
 */
export function canUpgrade(item: InventoryItem, opts?: { shopItemIds?: string[] }): boolean {
  const max = getMaxUpgradeForItem(item);
  if (max <= 0) return false;
  // Allow upgrade either when under max OR when at max but a higher rarity is available
  const currentLevel = item.upgradeLevel || 0;
  if (currentLevel < max) {
    // If there are material requirements and a shop context was provided, ensure they exist in shop
    const reqs = getRequirementsForNextUpgrade(item);
    if (reqs && opts?.shopItemIds) {
      return reqs.every(r => opts.shopItemIds!.includes(r.itemId));
    }
    return true;
  }
  // If at max, allow a rarity-upgrade if not already at highest rarity
  const curR = (item.rarity || 'common') as string;
  const idx = RARITY_ORDER.indexOf(curR as any);
  const rarityUpgradable = idx >= 0 && idx < RARITY_ORDER.length - 1;
  if (!rarityUpgradable) return false;
  // For rarity-upgrades also validate material requirements if provided
  const reqs = getRequirementsForNextUpgrade(item);
  if (reqs && opts?.shopItemIds) {
    return reqs.every(r => opts.shopItemIds!.includes(r.itemId));
  }
  return true;
}  

// Player level gating: require higher player levels for high-tier upgrades.
// Returns required player level for the *next* upgrade (0 = no requirement).
export function getRequiredPlayerLevelForNextUpgrade(item: InventoryItem): number {
  const nextLevel = (item.upgradeLevel || 0) + 1;
  // No requirement for early upgrades
  if (nextLevel <= 3) return 0;
  // Reduced gating: require player level = nextLevel * 2
  return nextLevel * 2;
}

export function previewUpgradeStats(item: InventoryItem) {
  const max = getMaxUpgradeForItem(item);
  const currentLevel = item.upgradeLevel || 0;
  const preview: { damage?: number; armor?: number } = {};
  const rarity = (item.rarity || 'common') as string;

  // If upgrading within the same rarity
  if (currentLevel < max) {
    const nextLevel = currentLevel + 1;
    if (item.type === 'weapon' && typeof item.damage === 'number') {
      const perLevel = WEAPON_DAMAGE_BONUS_PER_LEVEL_BY_RARITY[rarity] ?? WEAPON_DAMAGE_BONUS_PER_LEVEL_BY_RARITY.common;
      preview.damage = Math.round(item.damage * (1 + perLevel * nextLevel));
    }
    if (item.type === 'apparel' && typeof item.armor === 'number') {
      const perLevel = ARMOR_BONUS_PER_LEVEL_BY_RARITY[rarity] ?? ARMOR_BONUS_PER_LEVEL_BY_RARITY.common;
      preview.armor = Math.round(item.armor * (1 + perLevel * nextLevel));
    }
    return preview;
  }

  // At max level: preview shows a rarity-upgrade (if available) which preserves current stats
  // and resets level to 1 under the next rarity (no immediate stat change)
  const curIdx = RARITY_ORDER.indexOf(rarity as any);
  if (curIdx >= 0 && curIdx < RARITY_ORDER.length - 1) {
    // preserve current stats
    if (typeof item.damage === 'number') preview.damage = item.damage;
    if (typeof item.armor === 'number') preview.armor = item.armor;
    return preview;
  }

  // If already at highest rarity and maxed, just show next incremental (shouldn't usually happen)
  const fallbackPerLevelW = WEAPON_DAMAGE_BONUS_PER_LEVEL_BY_RARITY[rarity] ?? WEAPON_DAMAGE_BONUS_PER_LEVEL_BY_RARITY.common;
  const fallbackPerLevelA = ARMOR_BONUS_PER_LEVEL_BY_RARITY[rarity] ?? ARMOR_BONUS_PER_LEVEL_BY_RARITY.common;
  if (item.type === 'weapon' && typeof item.damage === 'number') preview.damage = Math.round(item.damage * (1 + fallbackPerLevelW * (currentLevel + 1)));
  if (item.type === 'apparel' && typeof item.armor === 'number') preview.armor = Math.round(item.armor * (1 + fallbackPerLevelA * (currentLevel + 1)));
  return preview;
}

// support computing base stats and bonuses (uses canonical stats as fallback)
import { getItemStats } from './itemStats';

export function applyUpgrade(item: InventoryItem): { updated: InventoryItem; cost: number } {
  if (!canUpgrade(item)) throw new Error('Max upgrade reached');
  const cost = getUpgradeCost(item);
  const max = getMaxUpgradeForItem(item);
  const currentLevel = item.upgradeLevel || 0;
  const rarity = (item.rarity || 'common') as string;

  // If not yet at max: apply a normal per-level upgrade using the per-rarity per-level bonus
  if (currentLevel < max) {
    const nextLevel = currentLevel + 1;
    // Preserve base stats so UI can always show base + bonus
    const updated: InventoryItem = { ...item, upgradeLevel: nextLevel, baseDamage: item.baseDamage ?? item.damage, baseArmor: item.baseArmor ?? item.armor };
    if (item.type === 'weapon' && typeof item.damage === 'number') {
      const perLevel = WEAPON_DAMAGE_BONUS_PER_LEVEL_BY_RARITY[rarity] ?? WEAPON_DAMAGE_BONUS_PER_LEVEL_BY_RARITY.common;
      const bonus = 1 + perLevel * nextLevel;
      updated.damage = Math.max(0, Math.round((item.damage || 0) * bonus));
    }
    if (item.type === 'apparel' && typeof item.armor === 'number') {
      const perLevel = ARMOR_BONUS_PER_LEVEL_BY_RARITY[rarity] ?? ARMOR_BONUS_PER_LEVEL_BY_RARITY.common;
      const bonus = 1 + perLevel * nextLevel;
      updated.armor = Math.max(0, Math.round((item.armor || 0) * bonus));
    }
    if (typeof item.value === 'number') {
      const rarity = (item.rarity || 'common') as string;
      const rarityMul = RARITY_COST_MULTIPLIER[rarity] ?? 1.0;
      // small value bump scaled by rarity and level
      updated.value = Math.round(item.value * (1 + 0.12 * nextLevel * Math.sqrt(rarityMul)));
    }
    return { updated, cost };
  }

  // At max level: perform rarity-upgrade if possible.
  const curIdx = RARITY_ORDER.indexOf(rarity as any);
  if (curIdx >= 0 && curIdx < RARITY_ORDER.length - 1) {
    const nextRarity = RARITY_ORDER[curIdx + 1];
    const updated: InventoryItem = { ...item, rarity: nextRarity, upgradeLevel: 1 };
    // Preserve current (already-upgraded) damage/armor values — no immediate stat change.
    // Increase value on rarity upgrade to reflect quality jump
    if (typeof item.value === 'number') {
      const nextMul = RARITY_COST_MULTIPLIER[nextRarity] ?? 1.5;
      updated.value = Math.round(item.value * Math.max(1.25, 1 + (nextMul - 1) * 0.9));
    }
    return { updated, cost };
  }

  // If we reach here, item was at max and at highest rarity — disallow further upgrades
  throw new Error('Item is already at highest rarity and maxed');
}

/**
 * Utility: return base / bonus / total values for UI display. Falls back to
 * canonical stats (`getItemStats`) when `baseDamage`/`baseArmor` are not set on
 * the InventoryItem.
 */
export function getItemBaseAndBonus(item: InventoryItem) {
  const canonical = getItemStats(item.name || '', item.type);
  const baseDamage = (item.baseDamage ?? canonical.damage ?? (item.damage ?? 0)) as number | undefined;
  const totalDamage = (item.damage ?? baseDamage) as number | undefined;
  const bonusDamage = typeof baseDamage === 'number' && typeof totalDamage === 'number' ? Math.max(0, totalDamage - baseDamage) : 0;

  const baseArmor = (item.baseArmor ?? canonical.armor ?? (item.armor ?? 0)) as number | undefined;
  const totalArmor = (item.armor ?? baseArmor) as number | undefined;
  const bonusArmor = typeof baseArmor === 'number' && typeof totalArmor === 'number' ? Math.max(0, totalArmor - baseArmor) : 0;

  return { baseDamage, bonusDamage, totalDamage, baseArmor, bonusArmor, totalArmor };
}

export default {
  getUpgradeCost,
  applyUpgrade,
  canUpgrade,
  previewUpgradeStats,
  getMaxUpgradeForItem,
  getItemBaseAndBonus
};
