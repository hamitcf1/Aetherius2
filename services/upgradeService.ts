import { InventoryItem } from '../types';

// Tunable constants
const MAX_UPGRADE_WEAPON = 5;
const MAX_UPGRADE_APPAREL = 5;

// Cost multipliers
const BASE_COST_MULTIPLIER = 1.0; // scales with item value
const TYPE_MULTIPLIER: Record<string, number> = {
  weapon: 1.2,
  apparel: 1.0
};

// Per-level stat increases (percentage of base stat)
const WEAPON_DAMAGE_BONUS_PER_LEVEL = 0.10; // +10% damage per level
const ARMOR_BONUS_PER_LEVEL = 0.08; // +8% armor per level

export function getMaxUpgradeForItem(item: InventoryItem) {
  if (typeof item.maxUpgradeLevel === 'number') return item.maxUpgradeLevel;
  return item.type === 'weapon' ? MAX_UPGRADE_WEAPON : (item.type === 'apparel' ? MAX_UPGRADE_APPAREL : 0);
}

export function getUpgradeCost(item: InventoryItem): number {
  const baseValue = (item.value && Number.isFinite(item.value)) ? item.value : 10;
  const typeMul = TYPE_MULTIPLIER[item.type] ?? 1.0;
  const level = item.upgradeLevel || 0;

  // Exponential-ish scaling but gentle: base * type * (1 + 0.5 * level) * (1.1 ^ level)
  const cost = Math.round(BASE_COST_MULTIPLIER * baseValue * typeMul * (1 + 0.5 * level) * Math.pow(1.1, level));
  return Math.max(1, cost);
}

export function canUpgrade(item: InventoryItem): boolean {
  const max = getMaxUpgradeForItem(item);
  if (max <= 0) return false;
  return (item.upgradeLevel || 0) < max;
}

// Player level gating: require higher player levels for high-tier upgrades.
// Returns required player level for the *next* upgrade (0 = no requirement).
export function getRequiredPlayerLevelForNextUpgrade(item: InventoryItem): number {
  const nextLevel = (item.upgradeLevel || 0) + 1;
  // No requirement for early upgrades
  if (nextLevel <= 3) return 0;
  // Example: require player level = nextLevel * 5 (configurable)
  return nextLevel * 5;
}

export function previewUpgradeStats(item: InventoryItem) {
  const level = (item.upgradeLevel || 0) + 1;
  const preview: { damage?: number; armor?: number } = {};
  if (item.type === 'weapon' && typeof item.damage === 'number') {
    preview.damage = Math.round(item.damage * (1 + WEAPON_DAMAGE_BONUS_PER_LEVEL * level));
  }
  if (item.type === 'apparel' && typeof item.armor === 'number') {
    preview.armor = Math.round(item.armor * (1 + ARMOR_BONUS_PER_LEVEL * level));
  }
  return preview;
}

export function applyUpgrade(item: InventoryItem): { updated: InventoryItem; cost: number } {
  if (!canUpgrade(item)) throw new Error('Max upgrade reached');
  const cost = getUpgradeCost(item);
  const nextLevel = (item.upgradeLevel || 0) + 1;
  const updated: InventoryItem = { ...item, upgradeLevel: nextLevel };

  // Apply stat increases deterministically (store new absolute values)
  if (item.type === 'weapon' && typeof item.damage === 'number') {
    const bonus = 1 + WEAPON_DAMAGE_BONUS_PER_LEVEL * nextLevel;
    updated.damage = Math.max(0, Math.round((item.damage || 0) * bonus));
  }

  if (item.type === 'apparel' && typeof item.armor === 'number') {
    const bonus = 1 + ARMOR_BONUS_PER_LEVEL * nextLevel;
    updated.armor = Math.max(0, Math.round((item.armor || 0) * bonus));
  }

  // Increase value slightly when upgraded
  if (typeof item.value === 'number') {
    updated.value = Math.round(item.value * (1 + 0.15 * nextLevel));
  }

  return { updated, cost };
}

export default {
  getUpgradeCost,
  applyUpgrade,
  canUpgrade,
  previewUpgradeStats,
  getMaxUpgradeForItem
};
