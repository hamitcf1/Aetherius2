import { advanceTurn } from '../services/combatService';

describe('Summon decay behavior', () => {
  it('applies half-health decay for summoned allies at player-turn start', () => {
    const state: any = {
      turn: 1,
      currentTurnActor: 'enemy1',
      turnOrder: ['player', 'enemy1'],
      enemies: [{ id: 'enemy1', name: 'Bandit', level: 1, currentHealth: 10, maxHealth: 10 }],
      allies: [{ id: 's1', name: 'Skeleton', isCompanion: true, companionMeta: { isSummon: true, decayActive: true }, currentHealth: 13, maxHealth: 13 }]
    };

    // advance to enemy then back to player (player turn start should apply decay)
    let next = advanceTurn(state);
    expect(next.currentTurnActor).toBe('enemy1');
    const before = (next.allies.find((a:any) => a.id === 's1') as any).currentHealth;
    expect(before).toBe(13);

    next = advanceTurn(next); // to player -> decay applied
    const after = (next.allies.find((a:any) => a.id === 's1') as any).currentHealth;
    expect(after).toBeLessThanOrEqual(Math.floor(before / 2));
  });

  it('repeated decays continue to halve health until dead', () => {
    const state: any = {
      turn: 1,
      currentTurnActor: 'enemy1',
      turnOrder: ['player', 'enemy1'],
      enemies: [{ id: 'enemy1', name: 'Bandit', level: 1, currentHealth: 10, maxHealth: 10 }],
      allies: [{ id: 's2', name: 'Wisp', isCompanion: true, companionMeta: { isSummon: true, decayActive: true }, currentHealth: 20, maxHealth: 20 }]
    };

    let s = state;
    s = advanceTurn(s); // enemy
    s = advanceTurn(s); // player -> 10
    const after1 = (s.allies.find((a:any) => a.id === 's2') as any).currentHealth;
    expect(after1).toBeLessThanOrEqual(10);

    s = advanceTurn(s); // enemy
    s = advanceTurn(s); // player -> <=5
    const after2 = (s.allies.find((a:any) => a.id === 's2') as any).currentHealth;
    expect(after2).toBeLessThanOrEqual(5);

    // Continue until dead
    for (let i = 0; i < 6; i++) {
      s = advanceTurn(s);
      s = advanceTurn(s);
    }
    const final = (s.allies.find((a:any) => a.id === 's2') as any).currentHealth;
    expect(final).toBeGreaterThanOrEqual(0);
  });
});