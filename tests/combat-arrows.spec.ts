import { executePlayerAction, calculatePlayerCombatStats } from '../services/combatService';

describe('Elemental & Command Arrows', () => {
  it('fire arrow adds extra immediate damage and burning DOT, and consumes one arrow', () => {
    const player = {
      level: 5,
      name: 'Tester',
      stats: { health: 100, magicka: 50, stamina: 50 },
      skills: [],
      perks: []
    } as any;

    const state: any = {
      active: true,
      turn: 1,
      currentTurnActor: 'player',
      enemies: [ { id: 'e1', name: 'Goblin', currentHealth: 50, maxHealth: 50, armor: 0, damage: 5, level: 1, abilities: [], activeEffects: [] } ],
      allies: [],
      abilityCooldowns: {},
      turnOrder: ['player', 'e1']
    } as any;

    const stats = calculatePlayerCombatStats(player, [] as any);
    const inv = [ { id: 'fire_arrows', characterId: 'c', name: 'Fire Arrows (10)', type: 'weapon', description: '', quantity: 1, equipped: false } as any ];

    const res = executePlayerAction(state, stats, 'attack', 'e1', undefined, 'fire_arrows', inv, 20, player as any);
    expect(res.usedItem).toBeTruthy();
    expect(res.usedItem?.quantity).toBe(0);
    const enemy = res.newState.enemies.find((e: any) => e.id === 'e1');
    // Should have taken base damage + some extra from fire arrow
    expect(enemy.currentHealth).toBeLessThan(50);
    // burning DOT should be present
    expect(enemy.activeEffects && enemy.activeEffects.some((ae: any) => ae.effect && ae.effect.name && ae.effect.name.toLowerCase().includes('burn'))).toBe(true);
  });

  it('command arrow triggers an ally immediate attack and consumes arrow', () => {
    const player = { level: 5, name: 'Tester', stats: { health: 100, magicka: 50, stamina: 50 }, skills: [], perks: [] } as any;
    const state: any = {
      active: true,
      turn: 1,
      currentTurnActor: 'player',
      enemies: [ { id: 'e1', name: 'Orc', currentHealth: 40, maxHealth: 40, armor: 0, damage: 6, level: 2, abilities: [], activeEffects: [] } ],
      allies: [ { id: 'a1', name: 'Wolf', currentHealth: 20, maxHealth: 20, damage: 8, abilities: [], isCompanion: true, companionMeta: {} } ],
      abilityCooldowns: {},
      turnOrder: ['player', 'a1', 'e1']
    } as any;
    const stats = calculatePlayerCombatStats(player, [] as any);
    const inv = [ { id: 'allycall_arrows', characterId: 'c', name: 'Command Arrows (5)', type: 'weapon', description: '', quantity: 1, equipped: false } as any ];

    const res = executePlayerAction(state, stats, 'attack', 'e1', undefined, 'allycall_arrows', inv, 15, player as any);
    expect(res.usedItem).toBeTruthy();
    expect(res.usedItem?.quantity).toBe(0);
    const enemy = res.newState.enemies.find((e: any) => e.id === 'e1');
    // Should have taken damage from player's shot and an extra hit from ally
    expect(enemy.currentHealth).toBeLessThan(40 - 1); // strictly damaged
  });

  it('shock arrow applies electrocution DOT and may stun (scales with roll)', () => {
    const player = { level: 8, name: 'Tester', stats: { health: 120, magicka: 80, stamina: 80 }, skills: [], perks: [] } as any;
    const state: any = { active: true, turn: 1, currentTurnActor: 'player', enemies: [ { id: 'e1', name: 'Giant', currentHealth: 80, maxHealth: 80, armor: 0, damage: 10, level: 5, abilities: [], activeEffects: [] } ], allies: [], abilityCooldowns: {}, turnOrder: ['player','e1'] } as any;
    const stats = calculatePlayerCombatStats(player, [] as any);
    const inv = [ { id: 'shock_arrows', characterId: 'c', name: 'Shock Arrows (10)', type: 'weapon', description: '', quantity: 1, equipped: false } as any ];

    // Force a high/crit-ish roll by passing natRoll=20
    const res = executePlayerAction(state, stats, 'attack', 'e1', undefined, 'shock_arrows', inv, 20, player as any);
    expect(res.usedItem).toBeTruthy();
    expect(res.usedItem?.quantity).toBe(0);
    const enemy = res.newState.enemies.find((e: any) => e.id === 'e1');
    const elect = enemy.activeEffects && enemy.activeEffects.find((ae: any) => ae.effect && ae.effect.name && ae.effect.name.toLowerCase().includes('electrocute'));
    expect(elect).toBeTruthy();
    expect(elect.effect.value > 0).toBe(true);
  });

  it('ice arrow applies a damage debuff', () => {
    const player = { level: 6, name: 'Tester', stats: { health: 110, magicka: 60, stamina: 70 }, skills: [], perks: [] } as any;
    const state: any = { active: true, turn: 1, currentTurnActor: 'player', enemies: [ { id: 'e1', name: 'Bandit', currentHealth: 35, maxHealth: 35, armor: 0, damage: 7, level: 2, abilities: [], activeEffects: [] } ], allies: [], abilityCooldowns: {}, turnOrder: ['player','e1'] } as any;
    const stats = calculatePlayerCombatStats(player, [] as any);
    const inv = [ { id: 'ice_arrows', characterId: 'c', name: 'Ice Arrows (10)', type: 'weapon', description: '', quantity: 1, equipped: false } as any ];

    const res = executePlayerAction(state, stats, 'attack', 'e1', undefined, 'ice_arrows', inv, 18, player as any);
    expect(res.usedItem).toBeTruthy();
    const enemy = res.newState.enemies.find((e: any) => e.id === 'e1');
    const chill = enemy.activeEffects && enemy.activeEffects.find((ae: any) => ae.effect && ae.effect.stat === 'damage');
    expect(chill).toBeTruthy();
    expect(chill.effect.value < 0).toBe(true);
  });

  it('paralyze arrow can stun on success (deterministic in test via Math.random mock)', () => {
    const player = { level: 7, name: 'Tester', stats: { health: 115, magicka: 70, stamina: 75 }, skills: [], perks: [] } as any;
    const state: any = { active: true, turn: 1, currentTurnActor: 'player', enemies: [ { id: 'e1', name: 'Rogue', currentHealth: 30, maxHealth: 30, armor: 0, damage: 6, level: 3, abilities: [], activeEffects: [] } ], allies: [], abilityCooldowns: {}, turnOrder: ['player','e1'] } as any;
    const stats = calculatePlayerCombatStats(player, [] as any);
    const inv = [ { id: 'paralyze_arrows', characterId: 'c', name: 'Paralyze Arrows (5)', type: 'weapon', description: '', quantity: 1, equipped: false } as any ];

    // stub Math.random to guarantee success
    const realRandom = Math.random;
    (Math as any).random = () => 0.01;
    const res = executePlayerAction(state, stats, 'attack', 'e1', undefined, 'paralyze_arrows', inv, 20, player as any);
    // restore
    (Math as any).random = realRandom;

    expect(res.usedItem).toBeTruthy();
    const enemy = res.newState.enemies.find((e: any) => e.id === 'e1');
    const par = enemy.activeEffects && enemy.activeEffects.find((ae: any) => ae.effect && ae.effect.name && ae.effect.name.toLowerCase().includes('paral'));
    expect(par).toBeTruthy();
    expect(par.effect.duration >= 1).toBe(true);
  });
});