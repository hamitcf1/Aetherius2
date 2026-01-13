import { describe, it, expect } from 'vitest';
import { isSpellVariantUnlocked, getSpellById } from '../services/spells';

describe('spell variant unlocks', () => {
  it('blocks empowered variant for low-level characters', () => {
    const low = { level: 3, perks: [] } as any;
    expect(isSpellVariantUnlocked(low, 'flames:high')).toBe(false);
  });

  it('allows empowered variant for high-level characters', () => {
    const high = { level: 20, perks: [] } as any;
    expect(isSpellVariantUnlocked(high, 'flames:high')).toBe(true);
  });

  it('allows empowered variant if perk present', () => {
    const charWithPerk = { level: 1, perks: [{ id: 'empower_spells' }] } as any;
    expect(isSpellVariantUnlocked(charWithPerk, 'flames:high')).toBe(true);
  });

  it('returns empowered variant stats from getSpellById', () => {
    const high = getSpellById('flames:high');
    expect(high).toBeDefined();
    expect(high?.name).toContain('Empowered');
  });
});
