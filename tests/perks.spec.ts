import { describe, it, expect } from 'vitest';
import PERK_DEFINITIONS from '../data/perkDefinitions';

describe('perk stat application', () => {
  it('safely applies a stat perk when the stat key is missing', () => {
    const def = PERK_DEFINITIONS.find(d => d.id === 'regeneration');
    expect(def).toBeDefined();
    const key = (def!.effect!.key as string) as keyof any;

    let updatedStats: any = { health: 100 };
    const prev = typeof updatedStats[key] === 'number' ? updatedStats[key] : 0;
    updatedStats = { ...updatedStats, [key]: prev + def!.effect!.amount };

    expect(typeof updatedStats[key]).toBe('number');
    expect(updatedStats[key]).toBeCloseTo(0.25);
  });
});