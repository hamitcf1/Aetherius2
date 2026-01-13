import { describe, it, expect } from 'vitest';
import { assignItemToCompanion, canAssignItemToCompanion, unassignItemFromCompanion } from '../utils/equipment';

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

  it('unassigns item from companion', () => {
    const item = mk({ equipped: true, equippedBy: 'c1', slot: 'weapon' });
    const updated = unassignItemFromCompanion(item);
    expect(updated.equipped).toBe(false);
    expect(updated.equippedBy).toBe(null);
    expect(updated.slot).toBeUndefined();
  });
});