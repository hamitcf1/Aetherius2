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

  it('unlocks perk-related achievements when perksUnlocked crosses threshold', () => {
    const stats = getDefaultAchievementStats();
    const state = { unlockedAchievements: {}, stats } as any;
    const char = makeChar(1);

    // Initially 4 perks -> no unlock
    state.stats.perksUnlocked = 4;
    let res = checkAchievements(state, char);
    expect(res.newlyUnlocked.some(a => a.id === 'perk_novice')).toBe(false);

    // Increase to 5 -> should unlock "perk_novice"
    state.stats.perksUnlocked = 5;
    res = checkAchievements(state, char);
    expect(res.newlyUnlocked.some(a => a.id === 'perk_novice')).toBe(true);
  });

  it('legacy global unlocks are not applied to new characters', () => {
    const stats = getDefaultAchievementStats();
    // Legacy global unlocked key (no character prefix)
    const legacyKey = 'first_steps';
    const state = { unlockedAchievements: { [legacyKey]: { unlockedAt: Date.now(), collected: true } }, stats } as any;

    // New character that does not meet requirement (level 1)
    const char = makeChar(1);
    const res = checkAchievements(state, char, 'c_new');
    // Should NOT consider legacy global key as per-character unlocked
    expect(res.newlyUnlocked.some(a => a.id === 'first_steps')).toBe(false);
    expect(res.updatedState.unlockedAchievements['c_new:first_steps']).toBeUndefined();

    // If the character meets requirement, it should unlock for that character
    const char2 = makeChar(100);
    const res2 = checkAchievements(state, char2, 'c2');
    expect(res2.newlyUnlocked.some(a => a.id === 'first_steps')).toBe(true);
    expect(res2.updatedState.unlockedAchievements['c2:first_steps']).toBeTruthy();
  });
});