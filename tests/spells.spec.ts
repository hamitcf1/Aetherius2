import { describe, it, expect } from 'vitest';
import { getSpellById } from '../services/spells';

describe('spell variants', () => {
  it('returns an empowered/high variant with increased stats', () => {
    const base = getSpellById('flames');
    const high = getSpellById('flames:high');
    expect(base).toBeDefined();
    expect(high).toBeDefined();
    expect(high?.name).toContain('Empowered');
    if (base?.damage && high?.damage) {
      expect(high.damage).toBeGreaterThan(base.damage);
    }
    if (base?.cost && high?.cost) {
      expect(high.cost).toBeGreaterThan(base.cost);
    }
  });
});