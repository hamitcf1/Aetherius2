import { InventoryItem } from '../types';

// Tunable constants
const MAX_UPGRADE_WEAPON = 5;
const MAX_UPGRADE_APPAREL = 5;

// Rarity order (progression when max upgrade reached)
const RARITY_ORDER = ['common', 'uncommon', 'rare', 'mythic', 'epic'] as const;

// Cost multipliers
const BASE_COST_MULTIPLIER = 0.8; // base multiplier
const TYPE_MULTIPLIER: Record<string, number> = {
  weapon: 1.1,
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

  // Exponential-ish scaling but gentle: base * type * (1 + 0.5 * level) * (1.1 ^ level)
  const cost = Math.round(BASE_COST_MULTIPLIER * baseValue * typeMul * rarityMul * (1 + 0.45 * level) * Math.pow(1.08, level));
  return Math.max(1, cost);
}

export function canUpgrade(item: InventoryItem): boolean {
  const max = getMaxUpgradeForItem(item);
  if (max <= 0) return false;
  // Allow upgrade either when under max OR when at max but a higher rarity is available
  const currentLevel = item.upgradeLevel || 0;
  if (currentLevel < max) return true;
  // If at max, allow a rarity-upgrade if not already at highest rarity
  const curR = (item.rarity || 'common') as string;
  const idx = RARITY_ORDER.indexOf(curR as any);
  return idx >= 0 && idx < RARITY_ORDER.length - 1;
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

export function applyUpgrade(item: InventoryItem): { updated: InventoryItem; cost: number } {
  if (!canUpgrade(item)) throw new Error('Max upgrade reached');
  const cost = getUpgradeCost(item);
  const max = getMaxUpgradeForItem(item);
  const currentLevel = item.upgradeLevel || 0;
  const rarity = (item.rarity || 'common') as string;

  // If not yet at max: apply a normal per-level upgrade using the per-rarity per-level bonus
  if (currentLevel < max) {
    const nextLevel = currentLevel + 1;
    const updated: InventoryItem = { ...item, upgradeLevel: nextLevel };
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

export default {
  getUpgradeCost,
  applyUpgrade,
  canUpgrade,
  previewUpgradeStats,
  getMaxUpgradeForItem
};
