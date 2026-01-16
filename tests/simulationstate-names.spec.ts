import { createScene, createNPC, findNPCByName } from '../services/simulationState';

describe('findNPCByName fuzzy matching', () => {
  it('matches exact name', () => {
    const state: any = { npcs: {} };
    const n = createNPC('Bandit Thug', 'bandit', 'field');
    state.npcs[n.id] = n;
    const found = findNPCByName(state, 'Bandit Thug');
    expect(found?.id).toBe(n.id);
  });

  it('matches variant with number suffix', () => {
    const state: any = { npcs: {} };
    const n = createNPC('Bandit Thug 1', 'bandit', 'field');
    state.npcs[n.id] = n;
    const found = findNPCByName(state, 'Bandit Thug');
    expect(found?.id).toBe(n.id);
  });

  it('matches punctuation and case-insensitive', () => {
    const state: any = { npcs: {} };
    const n = createNPC('bandit-thug!', 'bandit', 'field');
    state.npcs[n.id] = n;
    const found = findNPCByName(state, 'Bandit Thug');
    expect(found?.id).toBe(n.id);
  });

  it('picks best token overlap', () => {
    const state: any = { npcs: {} };
    const a = createNPC('Bandit Leader', 'bandit', 'field');
    const b = createNPC('Thug Bandit', 'bandit', 'field');
    state.npcs[a.id] = a;
    state.npcs[b.id] = b;
    const found = findNPCByName(state, 'Bandit Thug');
    // 'Thug Bandit' shares both tokens -> should match b
    expect(found?.id).toBe(b.id);
  });
});