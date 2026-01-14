/**
 * Dungeon Minigame System Types
 * Data-driven dungeon clearing system with branching paths
 */

import { CombatEnemy, LootRarity } from '../types';

// ============================================================================
// NODE TYPES
// ============================================================================

export type DungeonNodeType = 
  | 'combat'       // Standard enemy encounter
  | 'elite'        // Harder encounter, better rewards
  | 'boss'         // Final dungeon boss
  | 'rest'         // Healing, recovery, no enemies
  | 'reward'       // Loot without combat
  | 'event'        // Scripted or random event
  | 'empty'        // No enemies, minor effects
  | 'entrance'     // Starting node
  | 'exit';        // Exit point (only valid after boss defeated or early exit)

export type DungeonNodeStatus = 'locked' | 'available' | 'current' | 'visited' | 'completed';

// ============================================================================
// DUNGEON NODE DEFINITION
// ============================================================================

export interface DungeonNodeReward {
  gold?: { min: number; max: number };
  xp?: { min: number; max: number };
  items?: Array<{
    name: string;
    type: string;
    description?: string;
    quantity?: number;
    dropChance: number; // 0-100
    rarity?: LootRarity;
  }>;
  // Temporary dungeon buffs
  buffs?: Array<{
    name: string;
    stat: 'health' | 'magicka' | 'stamina' | 'damage' | 'armor';
    value: number;
    duration: 'dungeon' | 'combat' | number; // 'dungeon' lasts entire dungeon, 'combat' one fight, number = node count
  }>;
}

export interface DungeonNodeEnemy {
  // Can reference enemy templates or provide inline definitions
  templateId?: string;
  // Or inline enemy definition
  name?: string;
  type?: CombatEnemy['type'];
  level?: number;
  isBoss?: boolean;
  // Level scaling relative to dungeon difficulty
  levelOffset?: number;
}

export interface DungeonEventChoice {
  label: string;
  description: string;
  outcome: {
    success?: {
      narrative: string;
      rewards?: DungeonNodeReward;
      unlockNodes?: string[]; // Node IDs to unlock
    };
    failure?: {
      narrative: string;
      damage?: { health?: number; magicka?: number; stamina?: number };
      triggerCombat?: DungeonNodeEnemy[];
    };
  };
  // Skill check for success (optional)
  skillCheck?: {
    skill: string;
    difficulty: number; // Target skill level
    bonusChance?: number; // Base chance even without skill
  };
}

export interface DungeonEvent {
  id: string;
  title: string;
  description: string;
  choices: DungeonEventChoice[];
}

export interface DungeonNode {
  id: string;
  type: DungeonNodeType;
  name: string;
  description?: string;
  
  // Position for visualization (0-100 percentage)
  x: number;
  y: number;
  
  // Connections to other nodes (by ID)
  connections: string[];
  
  // Combat settings
  enemies?: DungeonNodeEnemy[];
  ambush?: boolean;
  fleeAllowed?: boolean;
  
  // Rewards for completing this node
  rewards?: DungeonNodeReward;
  
  // Event for event-type nodes
  event?: DungeonEvent;
  
  // Rest node settings
  restOptions?: {
    healPercent: number; // 0-100, percentage of max stats restored
    removesDebuffs?: boolean;
    canCamp?: boolean; // Whether camping gear provides bonus
  };
  
  // Requirements to access this node (beyond being connected)
  requirements?: {
    minLevel?: number;
    requiredItems?: string[];
    defeatedNodes?: string[]; // Must have completed these nodes
  };
  
  // If true, player can exit dungeon from this node
  allowExit?: boolean;
}

// ============================================================================
// DUNGEON DEFINITION
// ============================================================================

export type DungeonDifficulty = 'easy' | 'normal' | 'hard' | 'legendary';
export type DungeonTheme = 'nordic_ruin' | 'dwemer' | 'cave' | 'fort' | 'crypt' | 'daedric' | 'vampire_lair' | 'bandit_hideout';

export interface DungeonDefinition {
  id: string;
  name: string;
  description: string;
  theme: DungeonTheme;
  difficulty: DungeonDifficulty;
  
  // Recommended player level range
  levelRange: { min: number; max: number };
  
  // Map location ID (links to SkyrimMap locations)
  mapLocationId?: string;
  
  // All nodes in this dungeon
  nodes: DungeonNode[];
  
  // ID of the entrance node
  entranceNodeId: string;
  
  // ID of the boss node(s)
  bossNodeIds: string[];
  
  // Completion rewards (bonus for fully clearing)
  completionRewards?: DungeonNodeReward;
  
  // Flavor text
  lore?: string;
  rumors?: string[];
  
  // Environmental effects
  environment?: {
    lighting?: 'dark' | 'dim' | 'normal' | 'bright';
    hazards?: Array<{
      type: 'poison_gas' | 'fire_traps' | 'frost' | 'falling_rocks';
      severity: 'minor' | 'moderate' | 'severe';
    }>;
  };
}

// ============================================================================
// DUNGEON RUNTIME STATE
// ============================================================================

export interface DungeonNodeState {
  nodeId: string;
  status: DungeonNodeStatus;
  visitCount: number;
  combatCompleted?: boolean;
  eventChoiceMade?: string;
  lootCollected?: boolean;
}

export interface DungeonActiveBuffs {
  name: string;
  stat: 'health' | 'magicka' | 'stamina' | 'damage' | 'armor';
  value: number;
  remainingNodes?: number; // undefined = permanent for dungeon
}

export interface DungeonState {
  dungeonId: string;
  characterId: string;
  
  // Current position
  currentNodeId: string;
  
  // Node states
  nodeStates: Record<string, DungeonNodeState>;
  
  // Party vitals (persisted between nodes)
  playerVitals: {
    currentHealth: number;
    currentMagicka: number;
    currentStamina: number;
  };
  
  // Active dungeon buffs
  activeBuffs: DungeonActiveBuffs[];
  
  // Accumulated rewards (to be granted on completion)
  accumulatedRewards: {
    gold: number;
    xp: number;
    items: Array<{ name: string; type: string; description?: string; quantity: number }>;
  };
  
  // Progress tracking
  nodesVisited: number;
  combatsWon: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  
  // Timing
  startTime: number;
  
  // Completion state
  bossDefeated: boolean;
  completed: boolean;
  exitedEarly: boolean;
}

// ============================================================================
// DUNGEON TRIGGER (from Adventure Chat)
// ============================================================================

export interface DungeonTrigger {
  dungeonId: string;
  dungeonName: string;
  reason: 'explicit_intent' | 'map_selection';
  sourceMessage?: string;
}

// ============================================================================
// ENEMY TEMPLATES (for reuse across dungeons)
// ============================================================================

export interface DungeonEnemyTemplate {
  id: string;
  name: string;
  type: CombatEnemy['type'];
  baseLevel: number;
  baseHealth: number;
  baseDamage: number;
  baseArmor: number;
  behavior: CombatEnemy['behavior'];
  abilities?: CombatEnemy['abilities'];
  weaknesses?: string[];
  resistances?: string[];
  xpMultiplier?: number;
  goldMultiplier?: number;
  isBoss?: boolean;
  description?: string;
}
