import { describe, it, expect } from 'vitest';
import { getDefaultAchievementStats, auditStatsFromGameData, checkAchievements } from '../services/achievementsService';

const makeChar = (overrides: any = {}) => ({ id: 'new_char', name: 'Fresh', level: 1, perks: [], skills: [], ...overrides } as any);

describe('achievements — do not auto-unlock from global stats on new character', () => {
  it('does not auto-unlock perk/skill/quest/dungeon achievements for a brand-new character', () => {
    // Simulate global achievement stats from other characters (high counts)
    const globalStats = getDefaultAchievementStats();
    globalStats.perksUnlocked = 30;
    globalStats.questsCompleted = 50;
    globalStats.dungeonClears = 20;
    globalStats.skillLevels = { 'One-Handed': 100, 'Two-Handed': 100, 'Archery': 100 } as any;

    const prevState = { unlockedAchievements: {}, stats: globalStats } as any;

    const newChar = makeChar();

    // Audit per-character stats for the new character (should be empty/default)
    const perChar = auditStatsFromGameData(getDefaultAchievementStats(), newChar, { quests: [], inventory: [], companions: [] });

    // Using per-character stats, checkAchievements should NOT find any newly unlocked achievements
    const { newlyUnlocked } = checkAchievements({ ...prevState, stats: perChar }, newChar, newChar.id);
    const ids = newlyUnlocked.map(a => a.id);

    // None of these should be present
    expect(ids).not.toContain('perk_novice');
    expect(ids).not.toContain('perk_collector');
    expect(ids).not.toContain('skill_apprentice');
    expect(ids).not.toContain('skill_expert');
    expect(ids).not.toContain('jack_of_trades');
    expect(ids).not.toContain('quest_starter');
    expect(ids).not.toContain('dungeon_crawler');
  });
});
