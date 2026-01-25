import { describe, it, expect } from 'vitest';
import { checkLevelUp, getXPForNextLevel } from '../utils/levelingSystem';

describe('checkLevelUp', () => {
  it('detects multi-level gains and returns the correct new level', () => {
    const currentLevel = 1;
    const xpFor1 = getXPForNextLevel(1);
    const xpFor2 = getXPForNextLevel(2);

    // Enough XP to gain two levels
    const totalXP = xpFor1 + xpFor2 + 10;

    const res = checkLevelUp(totalXP, currentLevel);
    expect(res).not.toBeNull();
    expect(res!.newLevel).toBe(3);
    expect(res!.remainingXP).toBe(totalXP);
  });
});