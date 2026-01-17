import { describe, it, expect } from 'vitest';
import { getLootTableForEnemy } from '../data/lootTables';

describe('Loot table - curated additions', () => {
  it('includes new curated items in appropriate enemy tables', () => {
    const humanoid = getLootTableForEnemy('humanoid', false).map(e => e.id);
    expect(humanoid).toContain('honed_steel_longsword');
    expect(humanoid).toContain('spiked_buckler');

    const beast = getLootTableForEnemy('beast', false).map(e => e.id);
    expect(beast).toContain('explorers_boots');
    expect(beast).toContain('hunter_cloak');
  });

  it('applies rarity multipliers so rare items have lower effective weight', () => {
    const table = getLootTableForEnemy('humanoid', false);
    const common = table.find(t => t.id === 'hum_leather');
    const rare = table.find(t => t.id === 'frosted_dagger' || t.id === 'hum_rare_trinket');
    expect(common && rare).toBeTruthy();
    if (common && rare) expect(common.weight).toBeGreaterThanOrEqual(rare.weight);
  });
});
