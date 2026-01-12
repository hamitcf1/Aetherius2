// Equipment classification helpers used by inventory, UI and combat
import { InventoryItem } from '../types';

const nameIncludes = (item: InventoryItem, keywords: string[]) => {
  const n = (item.name || '').toLowerCase();
  return keywords.some(k => n.includes(k));
};

export const isShield = (item: InventoryItem) => {
  if (!item) return false;
  const name = (item.name || '').toLowerCase();
  return item.type === 'apparel' && name.includes('shield') || name.includes('buckler');
};

export const isTwoHandedWeapon = (item: InventoryItem) => {
  if (!item || item.type !== 'weapon') return false;
  const keywords = ['greatsword', 'great sword', 'two-handed', 'two handed', 'battleaxe', 'battle axe', 'warhammer', 'longsword', 'war axe', 'great axe', 'bow', 'longbow', 'halberd'];
  return nameIncludes(item, keywords);
};

export const isSmallWeapon = (item: InventoryItem) => {
  if (!item || item.type !== 'weapon') return false;
  const keywords = ['dagger', 'shortsword', 'sword', 'mace', 'handaxe', 'club', 'knife', 'stiletto'];
  // If explicitly two-handed, it's not small
  if (isTwoHandedWeapon(item)) return false;
  return nameIncludes(item, keywords) || !!item.damage && (item.weight ?? 0) <= 8;
};

export const canEquipInOffhand = (item: InventoryItem) => {
  // Offhand accepts shields and small weapons
  return isShield(item) || isSmallWeapon(item);
};

export const canEquipInMainhand = (item: InventoryItem) => {
  // Main hand accepts any weapon; shields should not be in main hand
  if (!item) return false;
  if (isShield(item)) return false;
  return item.type === 'weapon' || item.type === 'apparel';
};
