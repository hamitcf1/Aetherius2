import type { CombatState, CombatEnemy, CombatAbility, Character } from '../types';

export const applyArrowEffects = (
  newState: CombatState,
  enemyIndex: number,
  itemId: string,
  appliedDamage: number,
  attackResolved: any,
  ability: CombatAbility,
  // returns a narrative string summarizing the arrow outcome
): string => {
  const target = newState.enemies[enemyIndex];
  const tierMultipliers: Record<string, number> = { low: 0.6, mid: 1.0, high: 1.25, crit: 1.75 };
  const tierMult = (tierMultipliers && tierMultipliers[attackResolved.rollTier]) ? tierMultipliers[attackResolved.rollTier] : 1;

  if (itemId === 'fire_arrows') {
    const extra = Math.max(1, Math.floor(appliedDamage * 0.35 * tierMult));
    target.currentHealth = Math.max(0, target.currentHealth - extra);
    const duration = attackResolved.rollTier === 'crit' ? 4 : attackResolved.rollTier === 'high' ? 3 : 2;
    const dotValue = Math.max(1, Math.floor(appliedDamage * 0.12 * tierMult));
    const burnEffect = { type: 'dot', stat: 'health', name: 'Burning', duration, value: dotValue, description: 'Burns the target for damage over time' } as any;
    target.activeEffects = [...(target.activeEffects || []), { effect: burnEffect, turnsRemaining: burnEffect.duration }];
    return `Fire arrow scorches ${target.name} for ${extra} extra damage and burns for ${dotValue}/${duration} turns.`;
  }

  if (itemId === 'ice_arrows') {
    const extra = Math.max(1, Math.floor(appliedDamage * 0.25 * tierMult));
    target.currentHealth = Math.max(0, target.currentHealth - extra);
    const duration = attackResolved.rollTier === 'crit' ? 3 : 2;
    const debuffValue = -Math.max(1, Math.floor(appliedDamage * 0.15 * tierMult));
    const chillEffect = { type: 'debuff', stat: 'damage', name: 'Chilled - Weakened', duration, value: debuffValue, description: 'Reduces target damage output' } as any;
    target.activeEffects = [...(target.activeEffects || []), { effect: chillEffect, turnsRemaining: chillEffect.duration }];
    return `Ice arrow chills ${target.name}, dealing ${extra} extra damage and reducing their damage by ${Math.abs(debuffValue)} for ${duration} turns.`;
  }

  if (itemId === 'shock_arrows') {
    const extra = Math.max(1, Math.floor(appliedDamage * 0.30 * tierMult));
    target.currentHealth = Math.max(0, target.currentHealth - extra);
    const duration = attackResolved.rollTier === 'crit' ? 4 : attackResolved.rollTier === 'high' ? 3 : 2;
    const dotValue = Math.max(1, Math.floor(appliedDamage * 0.10 * tierMult));
    const electroEffect = { type: 'dot', stat: 'health', name: 'Electrocution', duration, value: dotValue, description: 'Shocks the target for damage over time' } as any;
    target.activeEffects = [...(target.activeEffects || []), { effect: electroEffect, turnsRemaining: electroEffect.duration }];
    const stunChance = attackResolved.rollTier === 'crit' ? 50 : attackResolved.rollTier === 'high' ? 35 : attackResolved.rollTier === 'mid' ? 20 : 10;
    let narrative = `Shock arrow electrocutes ${target.name}, dealing ${extra} extra shock damage and ${dotValue} damage over ${duration} turns.`;
    if (Math.random() * 100 < stunChance) {
      const stun = { type: 'stun', name: 'Shocked Stun', duration: 1 } as any;
      target.activeEffects = [...(target.activeEffects || []), { effect: stun, turnsRemaining: stun.duration }];
      narrative = `Shock arrow jolts ${target.name}, dealing ${extra} extra shock damage and electrocutes them for ${dotValue}/${duration} turns, and staggers them briefly.`;
    }
    return narrative;
  }

  if (itemId === 'paralyze_arrows') {
    const extra = Math.max(1, Math.floor(appliedDamage * 0.20 * tierMult));
    target.currentHealth = Math.max(0, target.currentHealth - extra);
    const chance = attackResolved.rollTier === 'crit' ? 85 : attackResolved.rollTier === 'high' ? 60 : attackResolved.rollTier === 'mid' ? 40 : 20;
    if (Math.random() * 100 < chance) {
      const paralyzeEffect = { type: 'stun', name: 'Paralyzed', duration: 2 } as any;
      target.activeEffects = [...(target.activeEffects || []), { effect: paralyzeEffect, turnsRemaining: paralyzeEffect.duration }];
      return `Paralyze arrow strikes ${target.name} and paralyzes them for ${paralyzeEffect.duration} turns!`;
    }
    return `Paralyze arrow strikes ${target.name} but fails to paralyze them.`;
  }

  return '';
};
