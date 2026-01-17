import { describe, it, expect, beforeEach } from 'vitest';
import { getLearnedSpellIds, learnSpell, mergeLearnedSpellsFromCharacter } from '../services/spells';
import { storage } from '../services/storage';

describe('mergeLearnedSpellsFromCharacter()', () => {
  beforeEach(() => {
    // reset in-memory fallback storage
    (storage as any)._clearForTests?.();
  });

  it('returns union of server and local learned spells and updates local storage', () => {
    const char = { id: 'char_x', learnedSpells: ['flames'] } as any;

    // local has a different learned spell
    learnSpell(char.id, 'spark');
    expect(getLearnedSpellIds(char.id)).toEqual(['spark']);

    const merged = mergeLearnedSpellsFromCharacter(char);
    expect(merged.sort()).toEqual(['flames', 'spark'].sort());

    // local storage should be updated to the union
    expect(getLearnedSpellIds(char.id).sort()).toEqual(['flames', 'spark'].sort());
  });

  it('handles missing server field and preserves local only spells', () => {
    const char = { id: 'char_y' } as any;
    learnSpell(char.id, 'spark');
    const merged = mergeLearnedSpellsFromCharacter(char);
    expect(merged).toEqual(['spark']);
    expect(getLearnedSpellIds(char.id)).toEqual(['spark']);
  });

  it('returns empty array for null/invalid character', () => {
    expect(mergeLearnedSpellsFromCharacter(null)).toEqual([]);
    expect(mergeLearnedSpellsFromCharacter(undefined)).toEqual([]);
    expect(mergeLearnedSpellsFromCharacter({ id: '' } as any)).toEqual([]);
  });
});
