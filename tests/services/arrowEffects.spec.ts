import { applyArrowEffects } from '../../services/arrowEffects';
import type { CombatState } from '../../types';

describe('applyArrowEffects', () => {
  it('applies burning dot and reduces health for fire arrows', () => {
    const state = { enemies: [ { id: 'e1', name: 'Gob', currentHealth: 50, maxHealth: 50, activeEffects: [] } ] } as any as CombatState;
    const narrative = applyArrowEffects(state, 0, 'fire_arrows', 10, { rollTier: 'high' }, { id: 'a', name: 'Shot' } as any);
    expect(narrative.toLowerCase()).toContain('burn');
    expect(state.enemies[0].activeEffects.length).toBeGreaterThan(0);
    expect(state.enemies[0].currentHealth).toBeLessThan(50);
  });

  it('applies electrocution dot and may stun for shock arrows', () => {
    const state = { enemies: [ { id: 'e1', name: 'Giant', currentHealth: 80, maxHealth: 80, activeEffects: [] } ] } as any as CombatState;
    const narrative = applyArrowEffects(state, 0, 'shock_arrows', 20, { rollTier: 'crit' }, { id: 'a', name: 'Shot' } as any);
    expect(narrative.toLowerCase()).toContain('electrocute');
    expect(state.enemies[0].activeEffects.some((ae:any)=>ae.effect && ae.effect.name && ae.effect.name.toLowerCase().includes('electrocute'))).toBe(true);
  });
});