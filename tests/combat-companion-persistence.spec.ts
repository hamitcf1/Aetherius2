import { initializeCombat, advanceTurn, executePlayerAction } from '../services/combatService';
import { serializeSimulationState as serSim, deserializeSimulationState as desSim } from '../services/simulationState';

describe('companion autoControl persistence', () => {
  it('preserves explicit autoControl=false through normalizeSummonedCompanions and turn advance', () => {
    const enemy = { id: 'e1', name: 'Bandit', level: 1, maxHealth: 20 } as any;
    const companion = { id: 'ally_1', name: 'Buddy', level: 1, maxHealth: 30, currentHealth: 30, isCompanion: true, companionMeta: { companionId: 'c1', autoControl: false, autoLoot: false } } as any;

    const state = initializeCombat([enemy], 'field', false, true, false, [{ id: 'c1', name: 'Buddy', level: 1, health: 30, maxHealth: 30, damage: 4, behavior: 'follow', autoLoot: false, autoControl: false } as any]);
    // ensure initial autoControl respected
    expect(state.allies.some(a => a.companionMeta && a.companionMeta.autoControl === false)).toBe(true);

    // advance one turn and ensure autoControl persists
    const afterAdvance = advanceTurn(state as any);
    expect(afterAdvance.allies.some(a => a.companionMeta && a.companionMeta.autoControl === false)).toBe(true);
  });

  it('does not clobber explicit autoControl when a summon is created elsewhere', () => {
    const enemy = { id: 'e1', name: 'Bandit', level: 1, maxHealth: 20 } as any;
    const state = initializeCombat([enemy], 'field', false, true, false, [{ id: 'c1', name: 'Buddy', level: 1, health: 30, maxHealth: 30, damage: 4, behavior: 'follow', autoLoot: false, autoControl: false } as any]);

    // simulate a summon effect being applied (the implementation should add a new ally but not overwrite existing one's companionMeta)
    const fakeSummon = {
      id: 'summon_test_1',
      name: 'Skeleton',
      level: 1,
      maxHealth: 25,
      currentHealth: 25,
      armor: 2,
      damage: 4,
      abilities: [],
      behavior: 'support',
      isCompanion: true,
      companionMeta: { companionId: 'summon_test_1', autoControl: true, autoLoot: false }
    } as any;

    // apply a player 'summon' ability via executePlayerAction to exercise the same codepath
    const playerStats = { currentHealth: 100, maxHealth: 100, currentMagicka: 100, maxMagicka: 100, currentStamina: 100, maxStamina: 100, abilities: [{ id: 'summon_skel', name: 'Summon Skeleton', type: 'magic', cost: 10, effects: [{ type: 'summon', name: 'Skeleton', duration: 3 }], damage: 0 }] } as any;
    const res = executePlayerAction(state as any, playerStats, 'magic', undefined, 'summon_skel', undefined, playerStats as any, 10 as any);
    const normalized = res.newState;

    // original companion should still have autoControl === false
    expect(normalized.allies.find(a => a.companionMeta?.companionId === 'c1')?.companionMeta?.autoControl).toBe(false);
  });

  it('survives serialize/deserialize roundtrip', () => {
    const enemy = { id: 'e1', name: 'Bandit', level: 1, maxHealth: 20 } as any;
    const state = initializeCombat([enemy], 'field', false, true, false, [{ id: 'c1', name: 'Buddy', level: 1, health: 30, maxHealth: 30, damage: 4, behavior: 'follow', autoLoot: false, autoControl: false } as any]);

    const json = serSim(state as any);
    const parsed = desSim(json as any);
    expect(parsed.allies.find(a => a.companionMeta?.companionId === 'c1')?.companionMeta?.autoControl).toBe(false);
  });
});
