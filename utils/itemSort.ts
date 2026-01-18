import type { InventoryItem } from '../types';

// Canonical comparator used for inventory-like lists where the UI expects
// deterministic, human-friendly ordering. This mirrors the Inventory default
// (primarily name-based) but adds stable fallbacks so lists render
// predictably across components (Shop, Blacksmith, etc.).

export function compareItemsInventory(a: InventoryItem, b: InventoryItem) {
  // Primary: name (locale-aware)
  const na = (a.name || '').localeCompare(b.name || '');
  if (na !== 0) return na;

  // Secondary: upgrade level (higher first for identical names)
  const ul = (b.upgradeLevel || 0) - (a.upgradeLevel || 0);
  if (ul !== 0) return ul;

  // Tertiary: damage/armor (show stronger first)
  const da = (b.damage || 0) - (a.damage || 0);
  if (da !== 0) return da;
  const ar = (b.armor || 0) - (a.armor || 0);
  if (ar !== 0) return ar;

  // Quaternary: quantity (more first)
  const q = (b.quantity || 0) - (a.quantity || 0);
  if (q !== 0) return q;

  // Final: stable fallback by id
  return (a.id || '').localeCompare(b.id || '');
}
