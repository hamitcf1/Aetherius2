import type { InventoryItem } from '../types';

export const canAssignItemToCompanion = (item: InventoryItem, companionId: string) => {
  if (!item) return { ok: false, reason: 'item-not-found' };
  if (item.equippedBy && item.equippedBy !== 'player' && item.equippedBy !== companionId) return { ok: false, reason: 'owned-by-other-companion' };
  if (item.equippedBy === 'player') return { ok: false, reason: 'equipped-by-player' };
  return { ok: true };
};

export const assignItemToCompanion = (item: InventoryItem, companionId: string, slot?: string): InventoryItem => {
  const can = canAssignItemToCompanion(item, companionId);
  if (!can.ok) throw new Error(can.reason || 'cannot-assign');
  return { ...item, equipped: true, slot: (slot as any) || item.slot, equippedBy: companionId };
};

export const unassignItemFromCompanion = (item: InventoryItem): InventoryItem => {
  if (!item) throw new Error('item-not-found');
  if (!item.equippedBy || item.equippedBy === 'player') throw new Error('not-assigned-to-companion');
  return { ...item, equipped: false, slot: undefined, equippedBy: null };
};