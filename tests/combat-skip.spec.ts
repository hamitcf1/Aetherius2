import { executePlayerAction, skipActorTurn } from '../services/combatService';

describe('Combat skip actions', () => {
  it('executePlayerAction with skip logs skip and returns unchanged stats/state structure', () => {
    const initialState: any = {
      turn: 1,
      currentTurnActor: 'player',
      turnOrder: ['player', 'enemy1'],
      enemies: [{ id: 'enemy1', name: 'Bandit', currentHealth: 10, maxHealth: 10 }],
      allies: [],
      combatLog: [],
      abilityCooldowns: {},
      lastActorActions: {}
    };
    const playerStats: any = { currentHealth: 20, maxHealth: 20, currentMagicka: 10, currentStamina: 10, abilities: [] };

    const res = executePlayerAction(initialState, playerStats, 'skip' as any);
    expect(res).toBeDefined();
    expect(res.narrative.toLowerCase()).toContain('skip');
    // Combat log should contain a skip entry
    const last = res.newState.combatLog[res.newState.combatLog.length - 1];
    expect(last).toBeDefined();
    expect(last.actor).toBe('player');
    expect(last.action).toBe('skip');
    expect(last.narrative.toLowerCase()).toContain('skip');
    expect(last.nat).toBeUndefined();
  });

  it('skipActorTurn logs skip for an ally with friendly name', () => {
    const state: any = {
      turn: 3,
      currentTurnActor: 'ally_a1',
      turnOrder: ['player', 'enemy1', 'ally_a1'],
      enemies: [{ id: 'enemy1', name: 'Bandit', currentHealth: 10, maxHealth: 10 }],
      allies: [{ id: 'ally_a1', name: 'Buddy', currentHealth: 12, maxHealth: 12 }],
      combatLog: [],
      abilityCooldowns: {},
      lastActorActions: {}
    };

    const newState = skipActorTurn(state, 'ally_a1');
    const last = newState.combatLog[newState.combatLog.length - 1];
    expect(last).toBeDefined();
    expect(last.actor).toBe('Buddy');
    expect(last.action).toBe('skip');
    expect(last.narrative.toLowerCase()).toContain('skip');
  });
});