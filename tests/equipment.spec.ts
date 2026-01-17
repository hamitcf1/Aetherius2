import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Inventory from '../components/Inventory';
import { AppContext } from '../AppContext';
import { assignItemToCompanion, canAssignItemToCompanion, unassignItemFromCompanion } from '../utils/equipment';
import { getDefaultSlotForItem } from '../components/EquipmentHUD';

const mk = (over: any = {}) => ({ id: 'i1', name: 'Sword', type: 'weapon', equipped: false, slot: 'weapon', quantity: 1, ...over });

describe('equipment utilities', () => {
  it('prevents assigning item equipped by player', () => {
    const item = mk({ equippedBy: 'player' });
    const res = canAssignItemToCompanion(item, 'c1');
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('equipped-by-player');
  });

  it('prevents assigning item owned by another companion', () => {
    const item = mk({ equippedBy: 'otherComp' });
    const res = canAssignItemToCompanion(item, 'c1');
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('owned-by-other-companion');
  });

  it('assigns item to companion', () => {
    const item = mk({ equippedBy: null });
    const updated = assignItemToCompanion(item, 'c1', 'weapon');
    expect(updated.equipped).toBe(true);
    expect(updated.equippedBy).toBe('c1');
    expect(updated.slot).toBe('weapon');
  });

  it('assigning an item that is already assigned to the same companion is idempotent', () => {
    const item = mk({ equipped: true, equippedBy: 'c1', slot: 'weapon' });
    const res = canAssignItemToCompanion(item, 'c1');
    expect(res.ok).toBe(true);

    const updated = assignItemToCompanion(item, 'c1');
    expect(updated.equipped).toBe(true);
    expect(updated.equippedBy).toBe('c1');
    expect(updated.slot).toBe('weapon');
  });

  it('unassigns item from companion', () => {
    const item = mk({ equipped: true, equippedBy: 'c1', slot: 'weapon' });
    const updated = unassignItemFromCompanion(item);
    expect(updated.equipped).toBe(false);
    expect(updated.equippedBy).toBe(null);
    expect(updated.slot).toBeUndefined();
  });

  it('unassign throws when item is not assigned to a companion (null)', () => {
    const item = mk({ equipped: false, equippedBy: null });
    expect(() => unassignItemFromCompanion(item as any)).toThrow('not-assigned-to-companion');
  });

  it('unassign throws when item is assigned to player', () => {
    const item = mk({ equipped: true, equippedBy: 'player' });
    expect(() => unassignItemFromCompanion(item as any)).toThrow('not-assigned-to-companion');
  });

  it('canAssign returns item-not-found when item is undefined', () => {
    // @ts-ignore - deliberate
    const res = canAssignItemToCompanion(undefined, 'c1');
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('item-not-found');
  });

  it('assign with slot override changes slot', () => {
    const item = mk({ equippedBy: null, slot: 'helmet' });
    const updated = assignItemToCompanion(item, 'c2', 'shield');
    expect(updated.equipped).toBe(true);
    expect(updated.equippedBy).toBe('c2');
    expect(updated.slot).toBe('shield');
  });

  it('assign works with stackable items (quantity > 1)', () => {
    const item = mk({ equippedBy: null, quantity: 3 });
    const updated = assignItemToCompanion(item, 'c3');
    expect(updated.equipped).toBe(true);
    expect(updated.equippedBy).toBe('c3');
    expect(updated.quantity).toBe(3);
  });

  it('assign throws when item is equipped by player', () => {
    const item = mk({ equippedBy: 'player' });
    expect(() => assignItemToCompanion(item, 'c1')).toThrow('equipped-by-player');
  });

  it('treats shields as offhand (prevents being inferred as chest)', () => {
    const shieldLike = { id: 'sh1', name: 'Daedric Shield', type: 'apparel', equipped: false, equippedBy: null } as any;
    const slot = getDefaultSlotForItem(shieldLike as any);
    expect(slot).toBe('offhand');

    // Guard: apparel branch should not return 'chest' for shield names
    const wrong = getDefaultSlotForItem({ ...shieldLike, type: 'apparel' } as any);
    expect(wrong).not.toBe('chest');
  });

});