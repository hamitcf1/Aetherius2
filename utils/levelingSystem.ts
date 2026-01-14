/**
 * Skyrim-inspired leveling system with escalating XP requirements per level.
 * 
 * The XP formula is based on a quadratic progression similar to many RPGs:
 * - Level 2 requires 100 XP
 * - Each subsequent level requires more XP than the last
 * - Formula: XP = baseXP * level^exponent + (level * linearScale)
 */

// Constants for the leveling formula
const BASE_XP = 50;        // Base XP for level 1 -> 2
const EXPONENT = 1.5;      // Growth rate exponent
const LINEAR_SCALE = 25;   // Linear XP addition per level

/**
 * Calculate the XP required to reach a specific level.
 * This is the TOTAL XP from level 1 to the target level.
 */
export function getTotalXPForLevel(level: number): number {
  if (level <= 1) return 0;
  
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += getXPForNextLevel(i);
  }
  return totalXP;
}

/**
 * Calculate the XP required to level up FROM a specific level.
 * E.g., getXPForNextLevel(1) = XP needed to go from level 1 to level 2
 */
export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel < 1) return BASE_XP;
  // Formula: baseXP * level^exponent + (level * linearScale)
  return Math.round(BASE_XP * Math.pow(currentLevel, EXPONENT) + (currentLevel * LINEAR_SCALE));
}

/**
 * Calculate the player's current level based on total accumulated XP.
 */
export function getLevelFromTotalXP(totalXP: number): number {
  if (totalXP <= 0) return 1;
  
  let level = 1;
  let xpRequired = 0;
  
  while (true) {
    const xpForNext = getXPForNextLevel(level);
    if (xpRequired + xpForNext > totalXP) {
      break;
    }
    xpRequired += xpForNext;
    level++;
    // Safety cap at level 100
    if (level >= 100) break;
  }
  
  return level;
}

/**
 * Calculate XP progress within the current level.
 * Returns { current, required, percentage }
 */
export function getXPProgress(totalXP: number, currentLevel: number): {
  current: number;       // XP earned toward next level
  required: number;      // XP needed to reach next level
  percentage: number;    // Progress percentage (0-100)
  totalXP: number;       // Total accumulated XP
} {
  const xpForThisLevel = getTotalXPForLevel(currentLevel);
  const xpForNextLevel = getXPForNextLevel(currentLevel);
  const currentProgress = totalXP - xpForThisLevel;
  
  return {
    current: Math.max(0, currentProgress),
    required: xpForNextLevel,
    percentage: Math.min(100, Math.max(0, (currentProgress / xpForNextLevel) * 100)),
    totalXP: totalXP
  };
}

/**
 * Check if the player should level up and calculate new state.
 * Returns null if no level up, otherwise returns the new level and remaining XP.
 */
export function checkLevelUp(currentXP: number, currentLevel: number): {
  shouldLevelUp: boolean;
  newLevel: number;
  remainingXP: number;
} | null {
  const xpForThisLevel = getTotalXPForLevel(currentLevel);
  const xpNeeded = getXPForNextLevel(currentLevel);
  const progressXP = currentXP - xpForThisLevel;
  
  if (progressXP >= xpNeeded) {
    // Calculate how many levels can be gained
    let newLevel = currentLevel;
    let totalXPConsumed = xpForThisLevel;
    
    while (true) {
      const xpForNext = getXPForNextLevel(newLevel);
      if (currentXP - totalXPConsumed >= xpForNext) {
        totalXPConsumed += xpForNext;
        newLevel++;
        // Safety cap
        if (newLevel >= 100) break;
      } else {
        break;
      }
    }
    
    return {
      shouldLevelUp: true,
      newLevel: newLevel + 1,
      remainingXP: currentXP // Keep total XP, level is calculated from it
    };
  }
  
  return null;
}

/**
 * Format XP display string
 */
export function formatXPDisplay(current: number, required: number): string {
  return `${current.toLocaleString()} / ${required.toLocaleString()} XP`;
}

/**
 * Generate XP requirements table for display
 */
export function getXPRequirementsTable(maxLevel: number = 20): Array<{ level: number; xpRequired: number; totalXP: number }> {
  const table = [];
  for (let i = 1; i <= maxLevel; i++) {
    table.push({
      level: i,
      xpRequired: getXPForNextLevel(i),
      totalXP: getTotalXPForLevel(i + 1)
    });
  }
  return table;
}

// Export default configuration info
export const LEVELING_CONFIG = {
  maxLevel: 100,
  baseXP: BASE_XP,
  exponent: EXPONENT,
  linearScale: LINEAR_SCALE
};
