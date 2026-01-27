import { expect, it, describe } from 'vitest';
import { generatePlayerAbilities } from '../services/combatService';

describe('Weapon-required abilities are only available when a weapon is equipped', () => {
  const baseChar: any = { id: 'c1', name: 'Hero', level: 10, stats: { health: 100 }, skills: [{ name: 'One-Handed', level: 60 }, { name: 'Two-Handed', level: 60 }], perks: [{ id: 'riposte_mastery', skill: 'One-Handed', rank: 1 }, { id: 'cleaving_mastery', skill: 'Two-Handed', rank: 1 }] };

  it('does not include one-handed and power abilities when no weapon is equipped', () => {
    const abs = generatePlayerAbilities({ ...baseChar }, []);
    expect(abs.find((a: any) => a.id === 'riposte')).toBeUndefined();
    expect(abs.find((a: any) => a.id === 'slash')).toBeUndefined();
    expect(abs.find((a: any) => a.id === 'power_attack')).toBeUndefined();
    expect(abs.find((a: any) => a.id === 'whirlwind_attack')).toBeUndefined();
    expect(abs.find((a: any) => a.id === 'cleaving_strike')).toBeUndefined();
  });

  it('includes the abilities when an appropriate weapon is equipped', () => {
    const weapon = { id: 'w1', name: 'Longsword', damage: 20, equipped: true, slot: 'weapon', type: 'weapon' } as any;
    const abs = generatePlayerAbilities({ ...baseChar }, [weapon]);
    expect(abs.find((a: any) => a.id === 'riposte')).toBeDefined();
    expect(abs.find((a: any) => a.id === 'slash')).toBeDefined();
    expect(abs.find((a: any) => a.id === 'power_attack')).toBeDefined();
    // Depending on thresholds, at these high skill levels we expect whirlwind/cleave to be available
    expect(abs.find((a: any) => a.id === 'whirlwind_attack')).toBeDefined();
    expect(abs.find((a: any) => a.id === 'cleaving_strike')).toBeDefined();
  });
});
