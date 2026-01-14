import { DungeonState, DungeonDefinition, DungeonNode } from '../types';
import { listDungeons, getDungeonById } from '../data/dungeonDefinitions';

// Very small service to manage dungeon lifecycle and apply reward scaling

export const startDungeon = (dungeonId: string, playerVitals: { currentHealth: number; currentMagicka: number; currentStamina: number }) => {
  const dungeon = getDungeonById(dungeonId);
  if (!dungeon) throw new Error('Unknown dungeon');
  const startNode = dungeon.nodes.find(n => n.id === dungeon.startNodeId) || dungeon.nodes[0];
  const st: DungeonState = {
    active: true,
    dungeonId: dungeon.id,
    currentNodeId: startNode.id,
    visitedNodes: [startNode.id],
    completedNodes: [],
    playerVitals: { ...playerVitals },
    companionVitals: {},
    collectedRewards: { gold: 0, xp: 0, items: [] },
    activeBuffs: [],
    startTime: Date.now(),
    result: 'in_progress'
  };
  return st;
};

export const applyRewardsToCharacter = (rewards: { gold?: number; xp?: number; items?: any[] }, character: any) => {
  if (!character) return character;
  const updated = { ...character };
  if (rewards.gold) updated.gold = (updated.gold || 0) + rewards.gold;
  if (rewards.xp) updated.experience = (updated.experience || 0) + rewards.xp;
  if (rewards.items && rewards.items.length) {
    updated.inventory = [...(updated.inventory || []), ...rewards.items.map(i => ({ ...i, quantity: i.quantity || 1 }))];
  }
  return updated;
};

export default { startDungeon, applyRewardsToCharacter };