import { describe, it, expect } from 'vitest';
import { getDefaultAchievementStats, checkAchievements, getAchievementProgress, ACHIEVEMENTS } from '../services/achievementsService';

const makeChar = (level = 1) => ({ id: 'c1', name: 'Hero', level } as any);

describe('achievements service', () => {
  it('auto-unlocks level achievements when character already meets requirement', () => {
    const stats = getDefaultAchievementStats();
    const state = { unlockedAchievements: {}, stats } as any;
    const char = makeChar(100);
    const { newlyUnlocked } = checkAchievements(state, char);
    // Should include at least 'first_steps'
    expect(newlyUnlocked.some(a => a.id === 'first_steps')).toBe(true);
    expect(newlyUnlocked.some(a => a.id === 'legendary_hero')).toBe(true);
  });

  it('quest progress shows correct percent and current count', () => {
    const stats = { ...getDefaultAchievementStats(), questsCompleted: 3 } as any;
    const achievement = ACHIEVEMENTS.find(a => a.id === 'quest_starter')!;
    const progress = getAchievementProgress(achievement, stats, makeChar(1));
    expect(progress.current).toBe(3);
    expect(progress.target).toBe(5);
    expect(progress.percent).toBe(Math.round((3 / 5) * 100));
  });

  it('combo requirement checks correctly', () => {
    const combo = ACHIEVEMENTS.find(a => a.id === 'shadow_walker')!;
    const stats = { ...getDefaultAchievementStats(), pickpocketSucceeded: 30, lockpicksSucceeded: 60, sneakAttacks: 60 } as any;
    const state = { unlockedAchievements: {}, stats } as any;
    const { newlyUnlocked } = checkAchievements(state, makeChar(1));
    expect(newlyUnlocked.some(a => a.id === 'shadow_walker')).toBe(true);
  });
});