import { describe, it, expect } from 'vitest';
import { createEnemyFromTemplate } from '../services/combatService';

describe('Enemy generation target-level scaling', () => {
  it('generates enemies around a provided target level', () => {
    const enemy = createEnemyFromTemplate('bandit', { targetLevel: 30, forceUnique: false });
    expect(enemy.level).toBeGreaterThanOrEqual(28);
    expect(enemy.level).toBeLessThanOrEqual(32);
  });
});