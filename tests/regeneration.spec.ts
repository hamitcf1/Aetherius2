import { describe, it, expect } from 'vitest';
import PERK_DEFINITIONS from '../data/perkDefinitions';

describe('Regeneration perk', () => {
  it('is defined with correct properties', () => {
    const def = PERK_DEFINITIONS.find(d => d.id === 'regeneration');
    expect(def).toBeDefined();
    expect(def?.skill).toBe('Restoration');
    expect(def?.name).toBe('Regeneration');
  });
});