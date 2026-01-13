import { describe, it, expect, beforeEach } from 'vitest';
import { getLearnedSpellIds, learnSpell, forgetSpell } from '../services/spells';
import { storage } from '../services/storage';

describe('spells storage fallback', () => {
  beforeEach(() => {
    // clear fallback memory storage
    (storage as any)._clearForTests?.();
  });

  it('persists learned spells using fallback storage when localStorage is absent', () => {
    const char = 'test_char_1';
    expect(getLearnedSpellIds(char)).toEqual([]);
    const ok = learnSpell(char, 'spark');
    expect(ok).toBe(true);
    expect(getLearnedSpellIds(char)).toEqual(['spark']);

    const ok2 = learnSpell(char, 'flames');
    expect(ok2).toBe(true);
    expect(getLearnedSpellIds(char).sort()).toEqual(['flames', 'spark'].sort());

    const f = forgetSpell(char, 'spark');
    expect(f).toBe(true);
    expect(getLearnedSpellIds(char)).toEqual(['flames']);
  });
});
