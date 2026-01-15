import { describe, it, expect } from 'vitest';
import PERK_DEFINITIONS from '../data/perkDefinitions';

describe('Perk definitions', () => {
  it('includes unarmed_mastery perk', () => {
    const p = PERK_DEFINITIONS.find(d => d.id === 'unarmed_mastery');
    expect(p).toBeTruthy();
    expect(p?.skill).toBe('Unarmed');
  });
});