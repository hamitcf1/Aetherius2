
export interface UserProfile {
  id: string;
  username: string;
  created: number;
}

export interface Stats {
  health: number;      // Max health
  magicka: number;     // Max magicka
  stamina: number;     // Max stamina
}

// Current values for combat/adventure (separate from max stats)
export interface CurrentVitals {
  currentHealth: number;
  currentMagicka: number;
  currentStamina: number;
}

// Read-only context provided to Adventure AI. Includes engine-confirmed events and player snapshot.
export interface AdventureContext {
  readOnly: true;
  player?: {
    id?: string;
    name?: string;
    currentVitals?: CurrentVitals;
    gold?: number;
    experience?: number;
    inventorySummary?: Array<{ name: string; qty: number }>;
  };
  recentEngineTransactions?: Array<{ type: string; gold?: number; xp?: number; items?: Array<any>; timestamp: number }>;
  lastCombat?: { resolution?: string; location?: string; events?: string[] } | null;
}

export interface GameTime {
  day: number;
  hour: number;
  minute: number;
}

export interface SurvivalNeeds {
  hunger: number; // 0 = satisfied, 100 = starving
  thirst: number; // 0 = hydrated, 100 = dehydrated
  fatigue: number; // 0 = rested, 100 = exhausted
}

export interface Skill {
  name: string;
  level: number;
}

export interface Perk {
  id: string;
  name: string;
  skill: string;
  rank: number;
  // Number of times this perk has been mastered/prestiged
  mastery?: number;
  description: string;
}

export interface Milestone {
  id: string;
  level: number;
  description: string;
  achieved: boolean;
}

export interface Character {
  id: string;
  profileId: string;
  name: string;
  race: string;
  gender: string; // Added gender
  archetype: string;
  profileImage?: string; // Profile photo URL
  isDead?: boolean; // Mark character as dead (cannot be played)
  deathDate?: string; // When the character died (narrative)
  deathCause?: string; // How the character died
  
  // Progression
  level: number;
  experience: number; // Current level progress or total XP
  gold: number;
  perks: Perk[];
  // Unspent perk points (granted on level up)
  perkPoints?: number;
  // Number of times the player used a forced unlock (spending extra points to bypass prerequisites)
  forcedPerkUnlocks?: number;

  // Stats (max values)
  stats: Stats;
  skills: Skill[];
  
  // Current vitals (for adventure/combat)
  currentVitals?: CurrentVitals;

  // Survival & Time
  time: GameTime;
  needs: SurvivalNeeds;

  // Identity & Psychology
  identity: string;
  psychology: string;
  breakingPoint: string;
  moralCode: string;
  
  // Constraints
  allowedActions: string;
  forbiddenActions: string;
  
  // Weaknesses & Strengths
  fears: string;
  weaknesses: string;
  talents: string;
  magicApproach: string;
  
  // Worldview
  factionAllegiance: string;
  worldview: string;
  daedricPerception: string;
  
  // Evolution
  forcedBehavior: string;
  longTermEvolution: string;
  milestones: Milestone[];
  
  // Narrative
  backstory: string;
  lastPlayed: number;
  // Completed combat IDs (persisted) for deduplication and replay prevention
  completedCombats?: string[];
}

export type EquipmentSlot = 'head' | 'chest' | 'hands' | 'feet' | 'weapon' | 'offhand' | 'ring' | 'necklace';

export interface InventoryItem {
  id: string;
  characterId: string;
  name: string;
  type: 'weapon' | 'apparel' | 'potion' | 'ingredient' | 'misc' | 'key' | 'food' | 'drink' | 'camping';
  subtype?: 'health' | 'magicka' | 'stamina'; // For potions
  description: string;
  quantity: number;
  equipped: boolean;
  createdAt?: number;
  // Favorites flag (player-specific)
  isFavorite?: boolean;
  // Equipment stats
  slot?: EquipmentSlot;
  armor?: number;
  damage?: number;
  weight?: number;
  value?: number;
  // Upgrade fields for blacksmith system
  upgradeLevel?: number; // current upgrade tier (0 = base)
  maxUpgradeLevel?: number; // optional per-item override for max upgrades
  // Optional explicit hints
  handedness?: 'one-handed' | 'two-handed' | 'off-hand-only';
  // If this item represents a spell tome or teaches a spell, set the spell id here
  spellId?: string;
}

export interface QuestStep {
  id: string;
  description: string;
  completed: boolean;
}

export interface CustomQuest {
  id: string;
  characterId: string;
  title: string;
  description: string;
  objectives: QuestStep[];
  status: 'active' | 'completed' | 'failed';
  location?: string;
  dueDate?: string; // New field
  createdAt: number;
  completedAt?: number;
}

export interface StoryChapter {
  id: string;
  characterId: string;
  title: string;
  content: string; // The narrative text
  date: string; // Skyrim date
  summary: string; // Short summary for context
  imageUrl?: string;
  createdAt: number;
}

export interface JournalEntry {
  id: string;
  characterId: string;
  date: string;
  title: string;
  content: string;
  createdAt?: number;
}

// Complex object for AI generation
export interface GeneratedCharacterData extends Partial<Character> {
  inventory?: Array<{ name: string; type: string; description: string; quantity: number }>;
  quests?: Array<{ title: string; description: string; location: string; dueDate?: string }>;
  journalEntries?: Array<{ title: string; content: string }>;
  openingStory?: { title: string; content: string };
  startingGold?: number;
}

// Initial defaults
export const DEFAULT_STATS: Stats = { health: 100, magicka: 100, stamina: 100 };

export const SKYRIM_SKILLS: Skill[] = [
  // Warrior
  { name: 'Smithing', level: 15 },
  { name: 'Heavy Armor', level: 15 },
  { name: 'Block', level: 15 },
  { name: 'Two-Handed', level: 15 },
  { name: 'One-Handed', level: 15 },
  { name: 'Archery', level: 15 },
  // Thief
  { name: 'Light Armor', level: 15 },
  { name: 'Sneak', level: 15 },
  { name: 'Lockpicking', level: 15 },
  { name: 'Pickpocket', level: 15 },
  { name: 'Speech', level: 15 },
  { name: 'Alchemy', level: 15 },
  // Mage
  { name: 'Illusion', level: 15 },
  { name: 'Conjuration', level: 15 },
  { name: 'Destruction', level: 15 },
  { name: 'Restoration', level: 15 },
  { name: 'Alteration', level: 15 },
  { name: 'Enchanting', level: 15 },
];

export const INITIAL_CHARACTER_TEMPLATE: Omit<Character, 'id' | 'profileId' | 'name' | 'race' | 'gender' | 'archetype' | 'lastPlayed'> = {
  level: 1,
  experience: 0,
  gold: 0,
  perks: [],
  perkPoints: 0,
  stats: DEFAULT_STATS,
  skills: SKYRIM_SKILLS,

  time: { day: 1, hour: 8, minute: 0 },
  needs: { hunger: 0, thirst: 0, fatigue: 0 },

  identity: "",
  psychology: "",
  breakingPoint: "",
  moralCode: "",
  allowedActions: "",
  forbiddenActions: "",
  fears: "",
  weaknesses: "",
  talents: "",
  magicApproach: "",
  factionAllegiance: "",
  worldview: "",
  daedricPerception: "",
  forcedBehavior: "",
  longTermEvolution: "",
  milestones: [],
  backstory: ""
};

export const SKYRIM_RACES = [
  "Altmer (High Elf)",
  "Argonian",
  "Bosmer (Wood Elf)",
  "Breton",
  "Dunmer (Dark Elf)",
  "Imperial",
  "Khajiit",
  "Nord",
  "Orc (Orsimer)",
  "Redguard"
];

// AI Action Types
export interface GameStateUpdate {
  narrative?: { title: string; content: string };
  newQuests?: Array<{
    title: string;
    description: string;
    location?: string;
    dueDate?: string;
    objectives?: Array<{ description: string; completed?: boolean }>;
  }>;
  updateQuests?: Array<{ title: string; status: 'completed' | 'failed' | 'active' }>;
  newItems?: Array<{ name: string; type: string; description: string; quantity: number }>;
  removedItems?: Array<{ name: string; quantity: number }>;
  statUpdates?: Partial<Stats>;
  goldChange?: number;
  xpChange?: number;

  // Progression / survival
  timeAdvanceMinutes?: number;
  needsChange?: Partial<SurvivalNeeds>;
  
  // Vitals (health, magicka, stamina) changes for adventure
  vitalsChange?: Partial<CurrentVitals>;
  // Effect objects representing atomic game effects (applied via central gate)
  effects?: Array<{
    type: 'modifyStat';
    stat: 'health' | 'magicka' | 'stamina';
    value: number; // positive to increase, negative to decrease
    source?: { id?: string; name?: string };
  }>;

  // New locations discovered during gameplay (added to map)
  discoveredLocations?: Array<{
    name: string;
    type: 'city' | 'town' | 'village' | 'dungeon' | 'landmark' | 'camp' | 'fort' | 'ruin' | 'cave';
    x: number; // 0-100 percentage on map
    y: number; // 0-100 percentage on map
    hold?: string;
    description?: string;
    dangerLevel?: 'safe' | 'moderate' | 'dangerous' | 'deadly';
    faction?: string;
    rumors?: string[];
  }>;

  // Ambient context for automatic music selection
  ambientContext?: {
    localeType?: 'wilderness' | 'tavern' | 'city' | 'dungeon' | 'interior' | 'road';
    inCombat?: boolean;
    mood?: 'peaceful' | 'tense' | 'mysterious' | 'triumphant';
  };

  // Transaction tracking - prevents duplicate charges
  transactionId?: string;  // Unique ID for this specific transaction
  isPreview?: boolean;     // If true, this response is showing OPTIONS, not executing a transaction
  // Optional tags emitted by AI/narrative to signal special handling (e.g., 'bonfire')
  tags?: string[];
  
  // Dialogue choices to present as clickable options
  choices?: Array<{ 
    label: string; 
    playerText: string; 
    topic?: string;
    // Preview costs shown on the button (NOT applied until selected)
    previewCost?: {
      gold?: number;
      items?: Array<{ name: string; quantity: number }>;
    };
    // Transaction ID to send when this choice is selected
    transactionId?: string;
  }>;

  // Character detail updates (hero sheet fields)
  characterUpdates?: {
    identity?: string;
    psychology?: string;
    breakingPoint?: string;
    moralCode?: string;
    allowedActions?: string;
    forbiddenActions?: string;
    fears?: string;
    weaknesses?: string;
    talents?: string;
    magicApproach?: string;
    factionAllegiance?: string;
    worldview?: string;
    daedricPerception?: string;
    forcedBehavior?: string;
    longTermEvolution?: string;
    backstory?: string;
    // Track completed combat IDs to persist that rewards were applied
    completedCombats?: string[];
  };

  // ============================================================================
  // SIMULATION STATE UPDATES (for persistent NPC/scene/fact tracking)
  // ============================================================================
  simulationUpdate?: {
    // NPC operations
    npcsIntroduced?: Array<{
      name: string;
      role: string;
      location?: string;
      disposition?: 'hostile' | 'wary' | 'neutral' | 'friendly' | 'allied';
      description?: string;
      personality?: string;
      faction?: string;
    }>;
    npcUpdates?: Array<{
      name: string;
      tensionChange?: number;
      dispositionChange?: number;
      newKnowledge?: Record<string, string>;
      interactionState?: 'idle' | 'conversing' | 'suspicious' | 'hostile' | 'resolved';
      dismissed?: boolean;
    }>;
    
    // Scene operations
    sceneStart?: {
      type: 'checkpoint' | 'dialogue' | 'combat' | 'exploration' | 'trade' | 'quest' | 'random_encounter';
      location: string;
    };
    phaseChange?: 'exploration' | 'encounter' | 'questioning' | 'negotiation' | 'confrontation' | 'combat' | 'resolution' | 'exit';
    sceneResolution?: 'none' | 'success' | 'failure' | 'compromise' | 'retreat' | 'escalation' | 'bribe' | 'persuasion' | 'intimidation' | 'combat_victory' | 'combat_defeat' | 'arrested' | 'fled';
    topicsResolved?: string[];
    optionsExhausted?: string[];
    sceneEvents?: string[];
    
    // Player facts
    factsEstablished?: Array<{
      category: 'identity' | 'situation' | 'relationships' | 'claims';
      key: string;
      value: string;
      disclosedToNPCs?: string[];
    }>;
    factsDisclosed?: Array<{
      factKey: string;
      toNPCNames: string[];
    }>;
    
    // Consequences
    consequencesTriggered?: Array<'entry_granted' | 'entry_denied' | 'arrest_attempt' | 'combat_initiated' | 'bounty_added' | 'reputation_change' | 'item_confiscated' | 'gold_paid' | 'quest_updated' | 'npc_disposition_change' | 'forced_retreat' | 'death'>;
    newConsequences?: Array<{
      type: 'entry_granted' | 'entry_denied' | 'arrest_attempt' | 'combat_initiated' | 'bounty_added' | 'reputation_change' | 'item_confiscated' | 'gold_paid' | 'quest_updated' | 'npc_disposition_change' | 'forced_retreat' | 'death';
      description: string;
      triggerCondition: {
        tensionThreshold?: number;
        attemptsExceeded?: boolean;
        phaseReached?: string;
        playerAction?: string;
      };
    }>;
  };

  // ============================================================================
  // COMBAT SYSTEM (triggers turn-based combat)
  // ============================================================================
  combatStart?: {
    enemies: CombatEnemy[];
    location: string;
    ambush?: boolean; // Enemy gets first turn
    fleeAllowed?: boolean;
    surrenderAllowed?: boolean;
  };
}

// ============================================================================
// COMBAT SYSTEM TYPES
// ============================================================================

export type CombatActionType = 'attack' | 'power_attack' | 'magic' | 'shout' | 'item' | 'defend' | 'flee' | 'surrender';

export interface CombatAbility {
  id: string;
  name: string;
  type: 'melee' | 'ranged' | 'magic' | 'shout';
  damage: number;
  cost: number; // stamina for melee, magicka for magic
  cooldown?: number; // turns until can use again
  effects?: CombatEffect[];
  description: string;
  animation?: string; // for UI flavor
}

export interface CombatEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'dot' | 'stun' | 'drain';
  stat?: 'health' | 'magicka' | 'stamina' | 'armor' | 'damage';
  value: number;
  duration?: number; // turns
  chance?: number; // 0-100
}

export type LootRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface CombatEnemy {
  id: string;
  name: string;
  type: 'humanoid' | 'beast' | 'undead' | 'daedra' | 'dragon' | 'automaton';
  level: number;
  maxHealth: number;
  currentHealth: number;
  maxMagicka?: number;
  currentMagicka?: number;
  maxStamina?: number;
  currentStamina?: number;
  armor: number;
  damage: number;
  abilities: CombatAbility[];
  weaknesses?: string[]; // e.g., 'fire', 'silver'
  resistances?: string[]; // e.g., 'frost', 'poison'
  loot?: Array<{ name: string; type: string; description: string; quantity: number; dropChance: number }>;
  xpReward: number;
  goldReward?: number;
  isBoss?: boolean;
  description?: string;
  // Combat AI behavior
  behavior: 'aggressive' | 'defensive' | 'tactical' | 'support' | 'berserker';
  // Status effects currently on this enemy
  activeEffects?: Array<{ effect: CombatEffect; turnsRemaining: number }>;
  // Passive health regen per second (optional, fractional allowed)
  regenHealthPerSec?: number;
}

export interface CombatState {
  active: boolean;
  turn: number;
  currentTurnActor: 'player' | string; // 'player' or enemy id
  turnOrder: string[]; // IDs in initiative order
  enemies: CombatEnemy[];
  location: string;
  fleeAllowed: boolean;
  surrenderAllowed: boolean;
  combatLog: CombatLogEntry[];
  playerDefending: boolean;
  playerActiveEffects: Array<{ effect: CombatEffect; turnsRemaining: number }>;
  // Cooldowns for player abilities
  abilityCooldowns: Record<string, number>;
  // Track recent actions per actor to avoid repetitive AI behavior
  lastActorActions?: Record<string, string[]>;
  // Whether the combat has reached the loot phase and is waiting on the player
  lootPending?: boolean;
  // Pending rewards and loot to be resolved during the loot phase
  pendingRewards?: {
    xp: number;
    gold: number;
    items: Array<{ name: string; type: string; description?: string; quantity: number }>;
  };

  // Per-enemy loot snapshot (so defeated enemy state persists until looted)
  pendingLoot?: Array<{
    enemyId: string;
    enemyName: string;
    loot: Array<{ name: string; type: string; description?: string; quantity: number; rarity?: string }>;
  }>;
  // Count player action types used during combat to drive skill progression
  playerActionCounts?: Record<string, number>;
  // Timestamp when combat started (ms since epoch)
  combatStartTime?: number;
  // Elapsed seconds recorded when combat ends or for snapshots
  combatElapsedSec?: number;
  // Survival needs changes (hunger/thirst/fatigue) computed from combat duration
  survivalDelta?: Partial<SurvivalNeeds>;
  // Combat result when finished
  result?: 'victory' | 'defeat' | 'fled' | 'surrendered';
  // Unique combat id (helps deduplication and tracking across systems)
  id?: string;
  // Whether this combat has completed and rewards were applied
  completed?: boolean;
  rewardsApplied?: boolean;
  rewards?: {
    xp: number;
    gold: number;
    items: Array<{ name: string; type: string; description: string; quantity: number }>;
    transactionId?: string;
    combatId?: string;
  };
  // Structured combat result (helps story engine consume a single object)
  combatResult?: {
    id: string;
    result: 'victory' | 'defeat' | 'fled' | 'surrendered';
    winner?: 'player' | 'enemy' | 'escaped' | 'unresolved';
    survivors: Array<{ id: string; name: string; currentHealth: number }>;
    playerStatus: { currentHealth: number; currentMagicka: number; currentStamina: number; isAlive: boolean };
    rewards?: { xp: number; gold: number; items: Array<{ name: string; type?: string; description?: string; quantity: number }>; transactionId?: string; combatId?: string };
    timestamp: number;
  };
}

export interface CombatLogEntry {
  turn: number;
  actor: string;
  action: string;
  target?: string;
  damage?: number;
  healing?: number;
  effect?: string;
  isCrit?: boolean;
  // Natural d20 roll for the action (1-20)
  nat?: number;
  // Tier derived from nat ("miss","low","mid","high","crit","fail")
  rollTier?: string;
  narrative: string;
  timestamp: number;
}

export interface PlayerCombatStats {
  // Calculated from character stats + equipment
  maxHealth: number;
  currentHealth: number;
  maxMagicka: number;
  currentMagicka: number;
  maxStamina: number;
  currentStamina: number;
  armor: number;
  weaponDamage: number;
  critChance: number;
  dodgeChance: number;
  magicResist: number;
  abilities: CombatAbility[];
  // Passive regeneration per second
  regenHealthPerSec?: number;
  regenMagickaPerSec?: number;
  regenStaminaPerSec?: number;
}

// ============================================================================
// GAME FEATURES - Weather, Difficulty, Status Effects, Companions
// ============================================================================

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog' | 'storm';

export interface WeatherState {
  type: WeatherType;
  intensity: number; // 0-100
  temperature: number; // Celsius-ish for Skyrim feel
}

export type DifficultyLevel = 'novice' | 'apprentice' | 'adept' | 'expert' | 'master' | 'legendary';

export interface DifficultySettings {
  level: DifficultyLevel;
  playerDamageMultiplier: number;
  enemyDamageMultiplier: number;
  xpMultiplier: number;
  survivalDrain: number;
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff' | 'neutral';
  icon: string;
  duration?: number;
  description: string;
  effects: {
    stat: string;
    modifier: number;
  }[];
}

export interface Companion {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  health: number;
  maxHealth: number;
  damage: number;
  armor: number;
  personality: string;
  recruitedAt: number;
  loyalty: number;
  mood: 'happy' | 'neutral' | 'unhappy' | 'angry';
}

export interface SessionRecord {
  id: string;
  characterId: string;
  startTime: number;
  endTime?: number;
  duration: number;
  messageCount: number;
  summary: string;
  highlights: string[];
}
