import { describe, it, expect } from 'vitest';
import PERK_DEFINITIONS from '../data/perkDefinitions';

describe('Regeneration perk removal', () => {
  it('is not defined', () => {
    const def = PERK_DEFINITIONS.find(d => d.id === 'regeneration');
    expect(def).toBeUndefined();
  });
});