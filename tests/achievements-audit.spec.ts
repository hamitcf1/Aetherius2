import { describe, it, expect } from 'vitest';
import { getDefaultAchievementStats, auditStatsFromGameData } from '../services/achievementsService';

const makeChar = (level = 1) => ({ id: 'c1', level, perks: [], skills: [{ name: 'OneHanded', level: 55 }], discoveredLocations: ['Whiterun', 'Riverwood'], clearedDungeons: [{ dungeonId: 'bleak_falls_barrow', clearCount: 2 }], } as any);

describe('achievements audit', () => {
  it('reconciles completed quests and discovered locations and dungeon clears', () => {
    const stats = getDefaultAchievementStats();
    const char = makeChar();
    const quests = [{ id: 'q1', status: 'completed' }, { id: 'q2', status: 'active' }];
    const inventory = [{ id: 'i1', name: 'Iron Sword', quantity: 1 }, { id: 'i2', name: 'Health Potion', quantity: 3 }];
    const transactions = [{ items: [{ name: 'Health Potion', quantity: 2, added: false }] } as any];

    const audited = auditStatsFromGameData(stats, char, { quests, inventory, transactions, playTimeMinutes: 120 });

    expect(audited.questsCompleted).toBeGreaterThanOrEqual(1);
    expect(audited.locationsDiscovered.length).toBeGreaterThanOrEqual(2);
    expect(audited.dungeonClears).toBeGreaterThanOrEqual(2);
    expect(audited.itemsCollected).toBeGreaterThanOrEqual(4);
    expect(audited.potionsConsumed).toBeGreaterThanOrEqual(2);
    expect(audited.playTimeMinutes).toBeGreaterThanOrEqual(120);
    expect(audited.perksUnlocked).toBe(0);
    expect(audited.skillLevels['OneHanded']).toBe(55);
  });
});