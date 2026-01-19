import { expect, it, describe } from 'vitest';
import { generatePlayerAbilities } from '../services/combatService';

describe('AoE physical abilities unlock via perks', () => {
  const baseChar: any = { id: 'c1', name: 'Hero', level: 10, stats: { health: 100 }, skills: [{ name: 'One-Handed', level: 0 }, { name: 'Two-Handed', level: 0 }], perks: [] };
  const weapon = { id: 'w1', name: 'Greatsword', damage: 20, equipped: true, slot: 'weapon', type: 'weapon' } as any;

  it('does not include Whirlwind or Cleaving without skills or perks', () => {
    const abs = generatePlayerAbilities({ ...baseChar }, [weapon]);
    expect(abs.find(a => a.id === 'whirlwind_attack')).toBeUndefined();
    expect(abs.find(a => a.id === 'cleaving_strike')).toBeUndefined();
  });

  it('includes Whirlwind if perk is present', () => {
    const c = { ...baseChar, perks: [{ id: 'whirlwind_mastery', name: 'Whirlwind Mastery', rank: 1 }] } as any;
    const abs = generatePlayerAbilities(c, [weapon]);
    expect(abs.find(a => a.id === 'whirlwind_attack')).toBeDefined();
  });

  it('includes Cleaving if perk is present', () => {
    const c = { ...baseChar, perks: [{ id: 'cleaving_mastery', name: 'Cleaving Mastery', rank: 1 }] } as any;
    const abs = generatePlayerAbilities(c, [weapon]);
    expect(abs.find(a => a.id === 'cleaving_strike')).toBeDefined();
  });
});
