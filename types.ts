
export interface UserProfile {
  id: string;
  username: string;
  created: number;
}

export interface Stats {
  health: number;      // Max health
  magicka: number;     // Max magicka
  stamina: number;     // Max stamina
  // Optional regen rates (primarily used in combat stats, but may be preserved on level up)
  regenHealthPerSec?: number;
  regenMagickaPerSec?: number;
  regenStaminaPerSec?: number;
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
  // List of spell ids the character has learned. Stored on the Character for cross-device persistence.
  learnedSpells?: string[];
  // Completed combat IDs (persisted) for deduplication and replay prevention
  completedCombats?: string[];
  // Cleared dungeon IDs with clearance count (for tracking re-entries with scaling enemies)
  clearedDungeons?: Array<{ dungeonId: string; clearCount: number; lastCleared: number }>;
  
  // Extended game systems state (opaque to avoid circular imports)
  shoutState?: unknown; // ShoutState from shoutsService
  enchantingState?: unknown; // EnchantingState from enchantingService
  standingStoneState?: unknown; // StandingStoneState from standingStoneService
  bountyState?: unknown; // BountyState from bountyService
  factionReputation?: unknown[]; // FactionReputation[] from factionService
  
  // Additional extended systems
  trainingState?: unknown; // TrainingState from trainingService
  transformationState?: unknown; // TransformationState from transformationService
  housingState?: unknown; // HousingState from housingService
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
  // Ownership explicit: 'player' | companionId | null — prevents duplicate equip
  equippedBy?: 'player' | string | null;
  createdAt?: number;
  // Favorites flag (player-specific)
  isFavorite?: boolean;
  // Equipment stats
  slot?: EquipmentSlot;
  armor?: number;
  damage?: number;
  weight?: number;
  value?: number;
  // Item rarity: common < uncommon < rare < mythic < epic (legendary is a special premium badge)
  rarity?: 'common' | 'uncommon' | 'rare' | 'mythic' | 'epic' | 'legendary';
  // Upgrade fields for blacksmith system
  upgradeLevel?: number; // current upgrade tier (0 = base)
  maxUpgradeLevel?: number; // optional per-item override for max upgrades
  // Persisted base stats (if present) — used to show "base + upgrade bonus" in UI.
  // When an item is created (shop/loot) we set these from canonical stats; the
  // upgrade flow will preserve `baseDamage`/`baseArmor` so UI can show breakdowns.
  baseDamage?: number;
  baseArmor?: number;
  // Optional per-item material requirements for upgrades. When present, the blacksmith
  // will require these materials to be available in the shop (or provided via the
  // upgradeService context) before allowing the upgrade. By default, centralized
  // recipes are only enforced for rarity `rare` and above (see upgradeService).
  upgradeRequirements?: Array<{ itemId: string; quantity?: number }>;
  // Optional explicit hints
  handedness?: 'one-handed' | 'two-handed' | 'off-hand-only';
  // If this item represents a spell tome or teaches a spell, set the spell id here
  spellId?: string;
  // Enchantments applied to this item
  enchantments?: Array<{
    id: string;
    name: string;
    magnitude: number;
    effect: string;
  }>;
  // Visual effect tags for enchanted items
  effects?: string[];
  // Is this item a quest item (cannot be dropped/sold)
  isQuestItem?: boolean;
}

export type LootRarity = 'common' | 'uncommon' | 'rare' | 'mythic' | 'epic' | 'legendary';

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
  // Locked quests are part of a quest chain but not yet available to the player.
  status: 'locked' | 'active' | 'completed' | 'failed';
  // Template / chain metadata (useful for unlocking the next quest)
  templateId?: string;
  prerequisiteId?: string; // Template id of the prior quest required to unlock this one
  chainId?: string;
  chainIndex?: number;
  location?: string;
  dueDate?: string; // New field
  createdAt: number;
  completedAt?: number;
  // Rewards for completing the quest
  xpReward?: number;
  goldReward?: number;
  // Quest type for main quest line
  questType?: 'main' | 'side' | 'misc' | 'bounty';
  // Difficulty level (affects rewards)
  difficulty?: 'trivial' | 'easy' | 'medium' | 'hard' | 'legendary';
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
  // Combat: Unarmed/Brawling skill (used for unarmed strike scaling)
  { name: 'Unarmed', level: 15 },
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
    questType?: 'main' | 'side' | 'misc' | 'bounty';
    difficulty?: 'trivial' | 'easy' | 'medium' | 'hard' | 'legendary';
    xpReward?: number;
    goldReward?: number;
  }>;
  updateQuests?: Array<{ 
    title: string; 
    status: 'completed' | 'failed' | 'active';
    xpAwarded?: number;
    goldAwarded?: number;
  }>;
  newItems?: Array<{ name: string; type: string; description: string; quantity: number }>;
  // Partial, id-aware inventory updates (used for optimistic in-combat updates and AI patches).
  // Each entry may be an id-based partial merge (preferred) or a name/quantity pair for legacy flows.
  updatedItems?: Array<Partial<import('./types').InventoryItem> & ({ id?: string } | { name?: string })>;
  removedItems?: Array<{ name: string; quantity: number }>;
  statUpdates?: Partial<Stats>;
  goldChange?: number;
  xpChange?: number;

  // Skill gains from story/activities (skill name and integer amount to add)
  skillGains?: Array<{ skill: string; amount: number }>;

  // Progression / survival
  timeAdvanceMinutes?: number;
  needsChange?: Partial<SurvivalNeeds>;
  
  // Current location for map updates
  currentLocation?: string;
  
  // Vitals (health, magicka, stamina) changes for adventure
  vitalsChange?: Partial<CurrentVitals>;
  // Effect objects representing atomic game effects (applied via central gate)
  effects?: Array<{
    type: 'modifyStat';
    stat: 'health' | 'magicka' | 'stamina';
    value: number; // positive to increase, negative to decrease
    source?: { id?: string; name?: string };
  }>;

  // New status effects (buffs/debuffs) to add to player's active status effects
  statusEffects?: StatusEffect[];

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
  // Internal helper flag: when true the caller already applied xp/gold locally and the handler
  // should avoid double-applying. This is used by defensive local updates (combat rewards).
  _alreadyAppliedLocally?: boolean;
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

export type CombatActionType = 'attack' | 'power_attack' | 'magic' | 'shout' | 'item' | 'defend' | 'flee' | 'surrender' | 'skip' | 'end_turn';

export interface CombatAbility {
  id: string;
  name: string;
  // 'utility' included for non-damaging or special abilities (summons, buffs, etc.)
  type: 'melee' | 'ranged' | 'magic' | 'shout' | 'utility' | 'aeo';
  damage: number;
  cost: number; // stamina for melee, magicka for magic
  cooldown?: number; // turns until can use again
  effects?: CombatEffect[];
  description: string;
  animation?: string; // for UI flavor
  heal?: number; // for healing abilities
  // Optional flags
  unarmed?: boolean; // true for the Unarmed Strike special ability
}

export interface CombatEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'dot' | 'stun' | 'drain' | 'summon' | 'utility' | 'aoe_damage' | 'aoe_heal';
  stat?: 'health' | 'magicka' | 'stamina' | 'armor' | 'damage' | 'sneak' | 'dodge' | 'accuracy';
  value: number;
  duration?: number; // turns
  chance?: number; // 0-100
  // Optional fields used by summon/utility effects
  name?: string;
  playerTurns?: number;
  // AoE targeting: 'all_enemies' | 'all_allies' | 'all' (both sides)
  aoeTarget?: 'all_enemies' | 'all_allies' | 'all';
}

// LootRarity is defined once at line 169 - do not duplicate

export interface CombatEnemy {
  id: string;
  name: string;
  type: 'humanoid' | 'beast' | 'undead' | 'daedra' | 'dragon' | 'automaton';
  // Explicit enemy state tracking (required by GAME_SYSTEM_CHANGES)
  health_state?: 'healthy' | 'wounded' | 'incapacitated' | 'dead';
  morale_state?: 'steady' | 'shaken' | 'broken';
  combat_state?: 'dead' | 'fled' | 'surrendered' | 'incapacitated' | 'still_hostile';
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
  // Mark summoned allies or companions
  isCompanion?: boolean;
  // Combat AI behavior
  behavior: 'aggressive' | 'defensive' | 'tactical' | 'support' | 'berserker';
  // Status effects currently on this enemy
  activeEffects?: Array<{ effect: CombatEffect; turnsRemaining: number }>;
  // Companion metadata for ally summons
  companionMeta?: { name?: string; xpContribution?: number; companionId?: string; autoLoot?: boolean; autoControl?: boolean; isSummon?: boolean };
}

export interface CombatState {
  active: boolean;
  turn: number;
  currentTurnActor: 'player' | string; // 'player' or enemy id
  turnOrder: string[]; // IDs in initiative order
  enemies: CombatEnemy[];
  // Allied non-player combatants (companions, summons)
  allies?: CombatEnemy[];
  location: string;
  fleeAllowed: boolean;
  surrenderAllowed: boolean;
  combatLog: CombatLogEntry[];
  playerDefending: boolean;
  /** Tactical Guard: once-per-combat usage flag */
  playerGuardUsed?: boolean;
  // Track whether player has used main/bonus actions this player turn
  playerMainActionUsed?: boolean;
  playerBonusActionUsed?: boolean;
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
  // Track summoned companions and their turns remaining during combat
  // `playerTurnsRemaining` tracks how many PLAYER turns remain before the summon begins decaying
  pendingSummons?: Array<{ companionId: string; turnsRemaining: number; playerTurnsRemaining?: number }>;
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
    companionXp?: Array<{ companionId: string; xp: number }>;
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
  id?: string; // Unique stable id for React keys and deduplication
  turn: number;
  actor: string;
  action: string;
  target?: string;
  damage?: number;
  healing?: number;
  effect?: string;
  isCrit?: boolean;
  hitLocation?: string;
  // Natural d20 roll for the action (1-20)
  nat?: number;
  // Tier derived from nat ("miss","low","mid","high","crit","fail")
  rollTier?: string;
  narrative: string;
  timestamp: number;
  // Mark auto-generated entries (e.g., from regen abilities)
  auto?: boolean;
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
  // Regeneration is handled by the passive regen ability system (see combatService)
  // Health/Magicka/Stamina regen rates per second - set based on level and perks
  regenHealthPerSec?: number;  // Passive health regen (from regen ability, unlockable via perk after level 10)
  regenMagickaPerSec?: number; // Passive magicka regen (from regen ability)
  regenStaminaPerSec?: number; // Passive stamina regen (from regen ability)
}

// ============================================================================
// GAME FEATURES - Weather, Difficulty, Status Effects, Companions
// ============================================================================

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
  characterId: string; // Required: companions are scoped to a specific character
  name: string;
  race: string;
  class: string;
  level: number;
  health: number;
  maxHealth: number;
  damage: number;
  armor: number;
  personality: string;
  // Short character backstory / flavor (optional). Shown in companion dialogue and passed to AI.
  backstory?: string;
  recruitedAt: number;
  loyalty: number;
  mood: 'happy' | 'neutral' | 'unhappy' | 'angry';
  // Animal companion support
  isAnimal?: boolean; // If true, companion is an animal (no talk, pet instead)
  species?: 'dog' | 'wolf' | 'horse' | 'husky' | 'cat' | 'fox' | 'bear' | 'sabrecat';
  // Optional recruitment or upkeep cost (gold per day, etc.)
  cost?: number;
  // Behavior in overworld/combat
  behavior?: 'idle' | 'follow' | 'guard';
  // If true, companion may pick up loot automatically after combat
  autoLoot?: boolean;
  // If true, companion will perform actions automatically in combat (auto-control). If false, player must choose actions manually
  autoControl?: boolean;
  // Experience & progression for companions
  xp?: number; // accumulated XP
  subclass?: string; // e.g., 'warrior', 'mage', 'ranger'
  // Equipped items mapping (slot -> itemId). Items remain in player's inventory; ownership recorded on item via InventoryItem.equippedBy
  equipment?: Partial<Record<EquipmentSlot, string | null>>;
}

export interface Loadout {
  id: string;
  name: string;
  characterId?: string;
  mapping: Record<string, { slot?: EquipmentSlot }>; // itemId => slot mapping
  createdAt: number;
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

// ============================================================================
// DUNGEON MINIGAME SYSTEM TYPES
// ============================================================================

export type DungeonNodeType = 'combat' | 'elite' | 'boss' | 'rest' | 'reward' | 'event' | 'empty' | 'start';

export interface DungeonNodeReward {
  gold?: number;
  xp?: number;
  items?: Array<{ name: string; type: string; description?: string; quantity: number; rarity?: LootRarity }>;
  buff?: { name: string; stat: 'health' | 'magicka' | 'stamina' | 'damage' | 'armor'; value: number; duration: number };
}

export interface DungeonNode {
  id: string;
  type: DungeonNodeType;
  name: string;
  description?: string;
  x: number; // For tree visualization (0-100)
  y: number; // For tree visualization (0-100)
  connections: string[]; // IDs of nodes this connects to (forward only)
  // Combat node specific
  enemies?: CombatEnemy[];
  // Event node specific
  eventText?: string;
  eventChoices?: Array<{ label: string; outcome: 'reward' | 'damage' | 'nothing'; value?: number }>;
  // Rewards for completing this node
  rewards?: DungeonNodeReward;
  // Rest node specific
  restAmount?: { health?: number; magicka?: number; stamina?: number };
  // Difficulty scaling
  difficulty?: number; // 1-5, affects enemy scaling
}

export interface DungeonDefinition {
  id: string;
  name: string;
  description: string;
  location: string; // Map location name
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  recommendedLevel: number;
  minimumLevel?: number; // Minimum level required to enter (for dangerous dungeons)
  nodes: DungeonNode[];
  startNodeId: string;
  bossNodeId: string;
  // Dungeon-wide rewards for full clear
  completionRewards: DungeonNodeReward;
  // Theming
  theme: 'nordic_tomb' | 'dwemer_ruin' | 'vampire_lair' | 'bandit_hideout' | 'forsworn_camp' | 'dragon_lair' | 'daedric_shrine' | 'ice_cave' | 'mine' | 'fort';
  ambientDescription?: string;
}

export interface DungeonState {
  active: boolean;
  dungeonId: string;
  currentNodeId: string;
  visitedNodes: string[];
  completedNodes: string[]; // Nodes where combat/event was resolved
  playerVitals: {
    currentHealth: number;
    currentMagicka: number;
    currentStamina: number;
  };
  companionVitals: Record<string, { currentHealth: number; maxHealth: number }>;
  collectedRewards: {
    gold: number;
    xp: number;
    items: Array<{ name: string; type: string; description?: string; quantity: number }>;
  };
  activeBuffs: Array<{ name: string; stat: string; value: number; nodesRemaining: number }>;
  startTime: number;
  // Combat within dungeon
  currentCombat?: CombatState;
  // Result tracking
  result?: 'in_progress' | 'cleared' | 'fled' | 'defeated';
}

// ============================================================================
// DYNAMIC EVENTS & MISSIONS SYSTEM
// ============================================================================

/**
 * Level tiers for event/mission unlock system
 * New content unlocks every 5 levels AND when all current tier events are completed
 */
export type LevelTier = 1 | 2 | 3 | 4 | 5 | 6;

export const LEVEL_TIER_THRESHOLDS: Record<LevelTier, { minLevel: number; maxLevel: number; name: string }> = {
  1: { minLevel: 1, maxLevel: 5, name: 'Novice' },
  2: { minLevel: 6, maxLevel: 10, name: 'Apprentice' },
  3: { minLevel: 11, maxLevel: 15, name: 'Adept' },
  4: { minLevel: 16, maxLevel: 25, name: 'Expert' },
  5: { minLevel: 26, maxLevel: 35, name: 'Master' },
  6: { minLevel: 36, maxLevel: 100, name: 'Legendary' },
};

export const TIER_REWARD_CAPS: Record<LevelTier, { maxGold: number; maxXp: number }> = {
  1: { maxGold: 200, maxXp: 150 },
  2: { maxGold: 500, maxXp: 350 },
  3: { maxGold: 1000, maxXp: 600 },
  4: { maxGold: 2500, maxXp: 1200 },
  5: { maxGold: 5000, maxXp: 2000 },
  6: { maxGold: 10000, maxXp: 4000 },
};

export type DynamicEventType = 'combat' | 'treasure' | 'mystery' | 'merchant' | 'shrine' | 'escort' | 'rescue' | 'investigation' | 'dragon' | 'bandit';

export interface DynamicEvent {
  id: string;
  characterId: string;
  name: string;
  type: DynamicEventType;
  description: string;
  levelTier: LevelTier;
  levelRequirement: number;
  location: {
    name: string;
    x: number; // 0-100 percentage on map
    y: number;
    hold?: string;
  };
  rewards: {
    gold: { min: number; max: number };
    xp: { min: number; max: number };
    items?: string[];
  };
  // In-game time duration (hours) before event expires
  durationHours: number;
  // Game time when event was created (day * 24 + hour)
  createdAtGameTime: number;
  // Event status
  status: 'available' | 'active' | 'completed' | 'failed' | 'expired';
  // Progress tracking
  progress?: {
    currentStep: number;
    totalSteps: number;
    objectives: Array<{ description: string; completed: boolean }>;
  };
  // Adventure integration - prompt for AI context
  adventurePrompt: string;
  // Chain system - if this event is part of a chain
  chainId?: string;
  chainOrder?: number;
  nextEventId?: string; // Next event in chain (unlocked on completion)
  // Timestamps
  createdAt: number; // Real timestamp
  completedAt?: number;
  // Firebase document ID
  firestoreId?: string;
}

export interface DynamicMission {
  id: string;
  characterId: string;
  name: string;
  objective: string;
  description: string;
  levelTier: LevelTier;
  levelRequirement: number;
  location: {
    name: string;
    locationId?: string;
    x: number;
    y: number;
    hold?: string;
  };
  rewards: {
    gold: { min: number; max: number };
    xp: { min: number; max: number };
    items?: string[];
  };
  durationHours: number;
  createdAtGameTime: number;
  difficulty: 'safe' | 'moderate' | 'dangerous' | 'deadly' | 'legendary';
  status: 'available' | 'active' | 'completed' | 'failed' | 'expired';
  progress?: {
    currentStep: number;
    totalSteps: number;
    objectives: Array<{ description: string; completed: boolean }>;
  };
  adventurePrompt: string;
  // Chain system
  chainId?: string;
  chainOrder?: number;
  nextMissionId?: string;
  // Timestamps
  createdAt: number;
  completedAt?: number;
  firestoreId?: string;
}

export interface EventChain {
  id: string;
  characterId: string;
  name: string;
  description: string;
  levelTier: LevelTier;
  eventIds: string[]; // Ordered list of event IDs in this chain
  currentEventIndex: number;
  status: 'available' | 'in_progress' | 'completed' | 'failed';
  totalRewards: {
    gold: number;
    xp: number;
    items?: string[];
  };
  createdAt: number;
  completedAt?: number;
}

export interface DynamicEventState {
  characterId: string;
  // Active events (max 5)
  activeEvents: DynamicEvent[];
  // Active missions
  activeMissions: DynamicMission[];
  // Completed event/mission IDs (for history and chain unlocking)
  completedEventIds: string[];
  completedMissionIds: string[];
  // Event chains
  eventChains: EventChain[];
  // Tier tracking
  lastSeenTier: LevelTier;
  currentTier: LevelTier;
  tierProgress: Record<LevelTier, { total: number; completed: number }>;
  // Notification queue
  pendingNotifications: EventNotificationData[];
  // Last generation timestamp (game time)
  lastEventGenerationGameTime: number;
  // Firebase sync
  lastSyncedAt?: number;
}

export interface EventNotificationData {
  id: string;
  type: 'tier-unlock' | 'new-event' | 'new-mission' | 'event-expiring' | 'event-complete' | 'chain-complete' | 'chain-unlocked';
  title: string;
  message: string;
  eventId?: string;
  missionId?: string;
  chainId?: string;
  tier?: LevelTier;
  timestamp: number;
  dismissed: boolean;
  // Auto-dismiss after this many seconds (0 = manual dismiss only)
  autoDismissSeconds?: number;
}

// Helper to calculate current level tier
export const getLevelTier = (level: number): LevelTier => {
  if (level <= 5) return 1;
  if (level <= 10) return 2;
  if (level <= 15) return 3;
  if (level <= 25) return 4;
  if (level <= 35) return 5;
  return 6;
};

// Helper to calculate game time in hours from GameTime
export const getGameTimeInHours = (time: GameTime): number => {
  return (time.day - 1) * 24 + time.hour + time.minute / 60;
};

// Check if an event has expired based on game time
export const isEventExpired = (event: DynamicEvent, currentGameTime: number): boolean => {
  return currentGameTime >= event.createdAtGameTime + event.durationHours;
};

// Default empty state
export const DEFAULT_DYNAMIC_EVENT_STATE: Omit<DynamicEventState, 'characterId'> = {
  activeEvents: [],
  activeMissions: [],
  completedEventIds: [],
  completedMissionIds: [],
  eventChains: [],
  lastSeenTier: 1,
  currentTier: 1,
  tierProgress: {
    1: { total: 0, completed: 0 },
    2: { total: 0, completed: 0 },
    3: { total: 0, completed: 0 },
    4: { total: 0, completed: 0 },
    5: { total: 0, completed: 0 },
    6: { total: 0, completed: 0 },
  },
  pendingNotifications: [],
  lastEventGenerationGameTime: 0,
};

// ============================================================================
// FAST TRAVEL & LOCATION TYPES
// ============================================================================

export type LocationType = 
  | 'city' | 'town' | 'village' | 'fort' | 'camp' | 'ruin' 
  | 'cave' | 'mine' | 'dungeon' | 'tower' | 'landmark' 
  | 'farm' | 'mill' | 'estate' | 'dock' | 'standing_stone'
  | 'dragon_lair' | 'giant_camp' | 'bandit_camp' | 'nordic_ruin';

export type HoldName = 
  | 'Whiterun' | 'Haafingar' | 'Eastmarch' | 'The Rift' | 'The Reach'
  | 'Falkreath' | 'The Pale' | 'Winterhold' | 'Hjaalmarch';

export interface TravelState {
  currentLocationId: string;
  discoveredLocationIds: string[];
  lastTravelTime?: number;
}

// ============================================================================
// FACTION & REPUTATION TYPES
// ============================================================================

export type FactionId = 
  | 'empire' | 'stormcloaks' | 'companions' | 'thieves_guild' | 'dark_brotherhood'
  | 'college_of_winterhold' | 'greybeards' | 'blades' | 'bards_college'
  | 'dawnguard' | 'volkihar' | 'vigilants_of_stendarr'
  | 'forsworn' | 'silver_hand' | 'thalmor' | 'penitus_oculatus'
  | 'whiterun' | 'solitude' | 'windhelm' | 'riften' | 'markarth' | 'morthal' | 'falkreath' | 'dawnstar' | 'winterhold';

export type ReputationLevel = 
  | 'hated' | 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'honored' | 'revered' | 'exalted';

export interface FactionReputationState {
  factionId: FactionId;
  reputation: number; // -1000 to +1000
  rank?: string;
  joined: boolean;
  joinedAt?: number;
  questsCompleted: number;
  crimesAgainst: number;
}

// ============================================================================
// WEATHER TYPES
// ============================================================================

export type WeatherType = 
  | 'clear' | 'cloudy' | 'overcast' | 'foggy' | 'misty'
  | 'rain' | 'light_rain' | 'heavy_rain' | 'thunderstorm'
  | 'snow' | 'light_snow' | 'heavy_snow' | 'blizzard'
  | 'ash_storm' | 'volcanic';

export interface WeatherState {
  currentWeather: WeatherType;
  intensity: number;
  temperature: number;
  lastUpdated: number;
  region?: string;
}

// ============================================================================
// CRAFTING TYPES
// ============================================================================

export interface CraftedPotion {
  id: string;
  name: string;
  effects: string[];
  magnitude: number;
  duration: number;
  value: number;
  createdAt: number;
  ingredientsUsed: string[];
}

export interface CookingState {
  knownRecipes: string[];
  cookedMeals: number;
}

// ============================================================================
// EXTENDED CHARACTER STATE (for new systems)
// ============================================================================

export interface ExtendedCharacterState {
  // Travel
  travel?: TravelState;
  // Factions
  factionReputations?: FactionReputationState[];
  // Weather
  weather?: WeatherState;
  // Crafting
  craftedPotions?: CraftedPotion[];
  cooking?: CookingState;
}
