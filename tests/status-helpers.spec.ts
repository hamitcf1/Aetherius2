import { normalizeStatusEffect } from '../utils/statusHelpers';

describe('normalizeStatusEffect', () => {
  it('derives "Burning" from dot-like ids', () => {
    const s = normalizeStatusEffect({ id: 'dot_fire_1', type: 'dot' }, 'fallback');
    expect(s.name).toBe('Burning');
    expect(s.type).toBe('debuff');
    expect(s.icon).toBe('🔥');
  });

  it('uses provided friendly name if available', () => {
    const s = normalizeStatusEffect({ id: 'c1', name: 'Candlelight Buff', type: 'buff', icon: '🕯️' }, 'fallback');
    expect(s.name).toBe('Candlelight Buff');
    expect(s.icon).toBe('🕯️');
    expect(s.type).toBe('buff');
  });

  it('replaces generic bracketed placeholder names', () => {
    const s = normalizeStatusEffect({ id: 'buff1', name: '[buff 1 ]', type: 'buff' }, 'fallback');
    expect(s.name).toBe('Buff');
  });

  it('falls back to Effect if nothing useful is present', () => {
    const s = normalizeStatusEffect({}, 'fallback');
    expect(s.name).toBe('Effect');
    expect(s.icon).toBe('🌀');
  });
});