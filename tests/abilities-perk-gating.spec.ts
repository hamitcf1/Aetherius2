import { expect, it, describe } from 'vitest';
import { generatePlayerAbilities } from '../services/combatService';

describe('One-handed ability gating by specific perks', () => {
  const baseChar: any = { id: 'c1', name: 'Hero', level: 30, stats: { health: 100 }, skills: [{ name: 'One-Handed', level: 60 }], perks: [] };
  const weapon = { id: 'w1', name: 'Longsword', damage: 20, equipped: true, slot: 'weapon', type: 'weapon' } as any;

  it('does NOT include Riposte/Slash/Mortal Strike when perks are missing even with high skill', () => {
    const abs = generatePlayerAbilities({ ...baseChar }, [weapon]);
    expect(abs.find((a: any) => a.id === 'riposte')).toBeUndefined();
    expect(abs.find((a: any) => a.id === 'slash')).toBeUndefined();
    expect(abs.find((a: any) => a.id === 'mortal_strike')).toBeUndefined();
  });

  it('includes abilities when the specific unlock perks are present', () => {
    const c = { ...baseChar, perks: [{ id: 'riposte_mastery', skill: 'One-Handed', rank: 1 }, { id: 'slash_mastery', skill: 'One-Handed', rank: 1 }, { id: 'mortal_strike_mastery', skill: 'One-Handed', rank: 1 }] } as any;
    const abs = generatePlayerAbilities(c, [weapon]);
    expect(abs.find((a: any) => a.id === 'riposte')).toBeDefined();
    expect(abs.find((a: any) => a.id === 'slash')).toBeDefined();
    expect(abs.find((a: any) => a.id === 'mortal_strike')).toBeDefined();
  });
});