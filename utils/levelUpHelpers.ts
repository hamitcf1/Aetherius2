import { Character } from '../types';

export function applyLevelUpToCharacter(
  char: Character,
  newLevel: number,
  remainingXP: number,
  choice: 'health' | 'magicka' | 'stamina'
): Character {
  const addedStats = { health: 0, magicka: 0, stamina: 0 } as Record<string, number>;
  addedStats[choice] = 10;

  const baseStats = char.stats || { health: 100, magicka: 100, stamina: 100 };

  const nextStats = {
    ...baseStats,
    health: (baseStats.health || 100) + addedStats.health,
    magicka: (baseStats.magicka || 100) + addedStats.magicka,
    stamina: (baseStats.stamina || 100) + addedStats.stamina,
  } as any;

  // When a character levels up, restore current vitals to their new maximums as a reward.
  const fullVitals = {
    currentHealth: nextStats.health,
    currentMagicka: nextStats.magicka,
    currentStamina: nextStats.stamina,
  };

  return {
    ...char,
    level: newLevel,
    experience: remainingXP,
    stats: nextStats,
    // Refill current vitals to the new maxima
    currentVitals: fullVitals,
    perkPoints: (char.perkPoints || 0) + 1,
  } as Character;
}
