import { MapEvent, MapMission } from '../components/MapPage';
import { CombatState, CombatEnemy } from '../types';
import { generateEnemyGroup, createEnemyFromTemplate, scaleEnemyEncounter, initializeCombat } from './combatService';

export const shouldStartCombatForEvent = (event: MapEvent | MapMission) => {
  const t = (event as any).type || (event as MapMission).objective || 'unknown';
  // Start combat for explicit combat/dragon/bandit events
  if ((event as MapEvent).type) {
    const et = (event as MapEvent).type;
    return et === 'dragon' || et === 'bandit' || et === 'combat';
  }

  // Missions: some mission IDs are bounties or call for direct combat (e.g., dragon bounty)
  if ((event as MapMission).id) {
    return (event as MapMission).id === 'mission_dragon_bounty' || (event as MapMission).id === 'mission_clear_bandits';
  }

  return false;
};

export const createCombatStateForEvent = (
  event: MapEvent | MapMission,
  playerLevel: number,
  companions: any[] = []
): CombatState => {
  // Build enemies for dragons and bandit ambushes
  let enemies: CombatEnemy[] = [];

  if ((event as MapEvent).type && (event as MapEvent).type === 'dragon') {
    // Create a single powerful dragon-like enemy
    const level = Math.max(10, playerLevel + 4);
    const dragon: CombatEnemy = {
      id: `dragon_${Date.now()}`,
      name: 'Great Drake',
      type: 'dragon' as any,
      level,
      maxHealth: 800 + level * 60,
      currentHealth: 800 + level * 60,
      maxStamina: 200 + level * 5,
      currentStamina: 200 + level * 5,
      armor: 40 + Math.floor(level * 1.5),
      damage: 60 + Math.floor(level * 2),
      behavior: 'aggressive',
      weaknesses: ['dragonrend', 'shock'],
      resistances: ['fire'],
      abilities: [
        { id: 'fire_breath', name: 'Fire Breath', type: 'magic', damage: 80 + level * 2, cost: 30, description: 'Breathes searing flame across the battlefield' },
        { id: 'tail_sweep', name: 'Tail Sweep', type: 'melee', damage: 40 + level * 1, cost: 10, description: 'A wide tail knockback', effects: [] }
      ] as any,
      xpReward: 500 + level * 20,
      goldReward: 300 + level * 10,
      loot: [
        { name: 'Dragon Scale', type: 'misc', description: 'A dragon scale', quantity: 1, dropChance: 50 }
      ],
      activeEffects: []
    } as CombatEnemy;

    enemies = [dragon];
  } else if ((event as MapEvent).type && (event as MapEvent).type === 'bandit') {
    const banditCount = Math.max(2, Math.min(6, Math.floor(playerLevel / 2) + 2));
    enemies = generateEnemyGroup('bandit', banditCount, { includeElite: true });
    enemies = scaleEnemyEncounter(enemies, playerLevel);
  } else if ((event as MapEvent).type && (event as MapEvent).type === 'combat') {
    const count = Math.max(1, Math.min(4, Math.ceil(playerLevel / 5) + 1));
    enemies = generateEnemyGroup('wolf', count, { includeElite: false });
    enemies = scaleEnemyEncounter(enemies, playerLevel);
  } else if ((event as MapMission).id) {
    // Missions: map specific missions to encounters
    const mid = (event as MapMission).id;
    if (mid === 'mission_dragon_bounty') {
      // Resuse dragon setup
      return createCombatStateForEvent({ id: 'mission_event', name: 'Dragon Bounty', type: 'dragon' } as any, playerLevel, companions);
    }

    if (mid === 'mission_clear_bandits') {
      return createCombatStateForEvent({ id: 'mission_event', name: 'Bandits on the Road', type: 'bandit' } as any, playerLevel, companions);
    }
  }

  // Fallback: use initializeCombat on whatever enemies we have
  const cState = initializeCombat(enemies, `map:${(event as any).id || 'event'}`, false, true, false, companions as any);
  return cState;
};
