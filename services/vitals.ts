import { CurrentVitals, Stats } from '../types';

// Apply a stat restore to current vitals and return the actual applied amount
export const applyStatToVitals = (
  currentVitals: CurrentVitals | undefined,
  maxStats: Stats,
  stat: 'health' | 'magicka' | 'stamina',
  amount: number
): { newVitals: CurrentVitals; actual: number } => {
  const cv: CurrentVitals = {
    currentHealth: currentVitals?.currentHealth ?? maxStats.health,
    currentMagicka: currentVitals?.currentMagicka ?? maxStats.magicka,
    currentStamina: currentVitals?.currentStamina ?? maxStats.stamina
  };

  if (!Number.isFinite(amount) || amount <= 0) return { newVitals: cv, actual: 0 };

  if (stat === 'health') {
    const actual = Math.min(amount, Math.max(0, maxStats.health - (cv.currentHealth || 0)));
    cv.currentHealth = Math.min(maxStats.health, (cv.currentHealth || 0) + actual);
    return { newVitals: cv, actual };
  }

  if (stat === 'magicka') {
    const actual = Math.min(amount, Math.max(0, maxStats.magicka - (cv.currentMagicka || 0)));
    cv.currentMagicka = Math.min(maxStats.magicka, (cv.currentMagicka || 0) + actual);
    return { newVitals: cv, actual };
  }

  // stamina
  const actual = Math.min(amount, Math.max(0, maxStats.stamina - (cv.currentStamina || 0)));
  cv.currentStamina = Math.min(maxStats.stamina, (cv.currentStamina || 0) + actual);
  return { newVitals: cv, actual };

};

export default applyStatToVitals;

// Strict modifier used in combat flows: accepts PlayerCombatStats-like object
export const modifyPlayerCombatStat = (
  playerStats: any,
  stat: 'health' | 'magicka' | 'stamina',
  amount: number
): { newPlayerStats: any; actual: number } => {
  if (!['health', 'magicka', 'stamina'].includes(stat)) {
    console.error('[vitals] modifyPlayerStat invalid stat:', stat);
    return { newPlayerStats: playerStats, actual: 0 };
  }
  if (!Number.isFinite(amount) || amount <= 0) return { newPlayerStats: playerStats, actual: 0 };

  const currentVitals = {
    currentHealth: playerStats.currentHealth,
    currentMagicka: playerStats.currentMagicka,
    currentStamina: playerStats.currentStamina
  };
  const max = { health: playerStats.maxHealth, magicka: playerStats.maxMagicka, stamina: playerStats.maxStamina };
  const res = applyStatToVitals(currentVitals, max as Stats, stat, amount);
  const ns = { ...playerStats };
  ns.currentHealth = res.newVitals.currentHealth;
  ns.currentMagicka = res.newVitals.currentMagicka;
  ns.currentStamina = res.newVitals.currentStamina;
  return { newPlayerStats: ns, actual: res.actual };
};

// Central mutation gate: all stat changes must go through this function.
// Returns the new vitals and the actual applied delta for the requested stat.
// Backing helper for cases where callers have plain vitals and max stats.
export const modifyVitals = (
  currentVitals: CurrentVitals | undefined,
  maxStats: Stats,
  stat: string,
  amount: number
): { newVitals: CurrentVitals; actual: number } => {
  if (!['health', 'magicka', 'stamina'].includes(stat)) {
    console.error('[modifyVitals] unknown stat requested', { stat, amount });
    return { newVitals: currentVitals || { currentHealth: maxStats.health, currentMagicka: maxStats.magicka, currentStamina: maxStats.stamina }, actual: 0 };
  }

  const s = stat as 'health' | 'magicka' | 'stamina';
  return applyStatToVitals(currentVitals, maxStats, s, amount);
};
