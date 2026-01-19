/**
 * Dragon Encounter Service
 * Random dragon attacks and dragon lair events
 */

import { Character, DynamicEvent, LevelTier } from '../types';

// ============================================================================
// DRAGON TYPES
// ============================================================================

export type DragonType = 
  | 'dragon' | 'blood_dragon' | 'frost_dragon' | 'elder_dragon' 
  | 'ancient_dragon' | 'revered_dragon' | 'legendary_dragon'
  | 'serpentine_dragon' | 'skeletal_dragon';

export type DragonElement = 'fire' | 'frost' | 'poison' | 'shock' | 'none';

export interface DragonDefinition {
  type: DragonType;
  name: string;
  minLevel: number;
  baseHealth: number;
  baseDamage: number;
  element: DragonElement;
  soulValue: number; // Dragon soul power
  lootTier: 'common' | 'uncommon' | 'rare' | 'epic';
  description: string;
  shoutName?: string; // The shout the dragon uses
}

export const DRAGON_TYPES: Record<DragonType, DragonDefinition> = {
  dragon: {
    type: 'dragon',
    name: 'Dragon',
    minLevel: 1,
    baseHealth: 300,
    baseDamage: 25,
    element: 'fire',
    soulValue: 1,
    lootTier: 'common',
    description: 'A basic dragon, the weakest of its kind but still a deadly foe.',
    shoutName: 'Yol Toor Shul',
  },
  blood_dragon: {
    type: 'blood_dragon',
    name: 'Blood Dragon',
    minLevel: 10,
    baseHealth: 450,
    baseDamage: 35,
    element: 'fire',
    soulValue: 1,
    lootTier: 'uncommon',
    description: 'A fierce dragon with green scales and a more aggressive temperament.',
    shoutName: 'Yol Toor Shul',
  },
  frost_dragon: {
    type: 'frost_dragon',
    name: 'Frost Dragon',
    minLevel: 15,
    baseHealth: 500,
    baseDamage: 40,
    element: 'frost',
    soulValue: 2,
    lootTier: 'uncommon',
    description: 'A dragon that breathes deadly frost, common in the northern reaches.',
    shoutName: 'Fo Krah Diin',
  },
  elder_dragon: {
    type: 'elder_dragon',
    name: 'Elder Dragon',
    minLevel: 20,
    baseHealth: 750,
    baseDamage: 55,
    element: 'fire',
    soulValue: 3,
    lootTier: 'rare',
    description: 'An ancient wyrm with bronze scales and devastating power.',
    shoutName: 'Yol Toor Shul',
  },
  ancient_dragon: {
    type: 'ancient_dragon',
    name: 'Ancient Dragon',
    minLevel: 30,
    baseHealth: 1000,
    baseDamage: 70,
    element: 'fire',
    soulValue: 4,
    lootTier: 'rare',
    description: 'One of the eldest dragons, with copper-colored scales and immense power.',
    shoutName: 'Yol Toor Shul',
  },
  revered_dragon: {
    type: 'revered_dragon',
    name: 'Revered Dragon',
    minLevel: 40,
    baseHealth: 1500,
    baseDamage: 85,
    element: 'fire',
    soulValue: 5,
    lootTier: 'epic',
    description: 'A massive orange-scaled dragon of legendary ferocity.',
    shoutName: 'Yol Toor Shul',
  },
  legendary_dragon: {
    type: 'legendary_dragon',
    name: 'Legendary Dragon',
    minLevel: 50,
    baseHealth: 2000,
    baseDamage: 100,
    element: 'frost',
    soulValue: 6,
    lootTier: 'epic',
    description: 'The most powerful dragons in existence, said to rival Alduin himself.',
    shoutName: 'Fo Krah Diin',
  },
  serpentine_dragon: {
    type: 'serpentine_dragon',
    name: 'Serpentine Dragon',
    minLevel: 35,
    baseHealth: 1200,
    baseDamage: 80,
    element: 'frost',
    soulValue: 4,
    lootTier: 'rare',
    description: 'A sleek dragon found in Solstheim, with serpent-like features.',
    shoutName: 'Fo Krah Diin',
  },
  skeletal_dragon: {
    type: 'skeletal_dragon',
    name: 'Skeletal Dragon',
    minLevel: 25,
    baseHealth: 600,
    baseDamage: 50,
    element: 'none',
    soulValue: 2,
    lootTier: 'rare',
    description: 'An undead dragon, raised by dark magic. It breathes no elemental breath.',
    shoutName: undefined,
  },
};

// ============================================================================
// DRAGON ENCOUNTER GENERATION
// ============================================================================

export interface DragonEncounter {
  dragon: DragonDefinition;
  location: string;
  isWorldBoss: boolean;
  modifiers: DragonModifier[];
  narrativeHook: string;
}

export type DragonModifier = 
  | 'enraged' | 'ancient_power' | 'wounded' | 'protecting_nest'
  | 'hunting' | 'territorial' | 'corrupted' | 'blessed';

const DRAGON_MODIFIERS: Record<DragonModifier, { 
  name: string; 
  healthMod: number; 
  damageMod: number;
  description: string;
}> = {
  enraged: {
    name: 'Enraged',
    healthMod: 0,
    damageMod: 1.3,
    description: 'This dragon is consumed by fury, dealing more damage.',
  },
  ancient_power: {
    name: 'Ancient Power',
    healthMod: 1.5,
    damageMod: 1.2,
    description: 'Imbued with ancient draconic power.',
  },
  wounded: {
    name: 'Wounded',
    healthMod: 0.6,
    damageMod: 0.9,
    description: 'Previously injured, making it weaker but desperate.',
  },
  protecting_nest: {
    name: 'Protecting Nest',
    healthMod: 1.2,
    damageMod: 1.4,
    description: 'Defending its lair with maternal ferocity.',
  },
  hunting: {
    name: 'Hunting',
    healthMod: 1,
    damageMod: 1.1,
    description: 'Actively seeking prey - you.',
  },
  territorial: {
    name: 'Territorial',
    healthMod: 1.1,
    damageMod: 1.2,
    description: 'You have entered its domain.',
  },
  corrupted: {
    name: 'Corrupted',
    healthMod: 1.3,
    damageMod: 1.3,
    description: 'Tainted by dark magic, stronger but unstable.',
  },
  blessed: {
    name: 'Blessed',
    healthMod: 1.4,
    damageMod: 1,
    description: 'Protected by ancient draconic blessings.',
  },
};

const DRAGON_LOCATIONS = [
  'the mountain peaks',
  'a dragon burial mound',
  'the open plains',
  'near a village',
  'an ancient Word Wall',
  'the frozen tundra',
  'above the forest',
  'a ruined tower',
  'the shores of a lake',
  'a volcanic area',
];

const NARRATIVE_HOOKS = [
  'A shadow passes overhead, and a deafening roar fills the air!',
  'The ground shakes as an enormous creature lands before you!',
  'Flames (or frost) erupt in the distance - a dragon attacks!',
  'Villagers scatter screaming as a dragon descends from the clouds!',
  'You hear the ancient tongue of the dragons echoing through the air!',
  'The sky darkens as leathery wings blot out the sun!',
  'A Word Wall begins to glow - and its guardian awakens!',
  'The beast circles overhead, eyes fixed on you as its next prey!',
  'Ancient bones stir in a burial mound - a dragon rises!',
  'A thunderous crash announces the arrival of a winged death!',
];

/**
 * Get appropriate dragon type for player level
 */
export const getDragonForLevel = (playerLevel: number): DragonDefinition => {
  const availableDragons = Object.values(DRAGON_TYPES)
    .filter(d => playerLevel >= d.minLevel)
    .sort((a, b) => b.minLevel - a.minLevel);
  
  if (availableDragons.length === 0) {
    return DRAGON_TYPES.dragon;
  }
  
  // Weight towards appropriate level dragons
  // Higher chance for dragons closer to player level
  const weights: number[] = availableDragons.map((d, idx) => {
    const levelDiff = playerLevel - d.minLevel;
    if (levelDiff < 5) return 3; // High chance for challenging dragons
    if (levelDiff < 10) return 2;
    return 1;
  });
  
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  
  for (let i = 0; i < availableDragons.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return availableDragons[i];
  }
  
  return availableDragons[0];
};

/**
 * Generate a random dragon encounter
 */
export const generateDragonEncounter = (
  playerLevel: number,
  currentLocation?: string
): DragonEncounter => {
  const dragon = getDragonForLevel(playerLevel);
  
  // Maybe add modifiers
  const modifiers: DragonModifier[] = [];
  if (Math.random() < 0.3) {
    const allMods = Object.keys(DRAGON_MODIFIERS) as DragonModifier[];
    modifiers.push(allMods[Math.floor(Math.random() * allMods.length)]);
  }
  
  // Is this a world boss? (rare, very powerful)
  const isWorldBoss = Math.random() < 0.05 && playerLevel >= 20;
  
  const location = currentLocation || 
    DRAGON_LOCATIONS[Math.floor(Math.random() * DRAGON_LOCATIONS.length)];
  
  const narrativeHook = NARRATIVE_HOOKS[Math.floor(Math.random() * NARRATIVE_HOOKS.length)];
  
  return {
    dragon,
    location,
    isWorldBoss,
    modifiers,
    narrativeHook,
  };
};

/**
 * Calculate final dragon stats with modifiers
 */
export const calculateDragonStats = (
  encounter: DragonEncounter
): { health: number; damage: number } => {
  let health = encounter.dragon.baseHealth;
  let damage = encounter.dragon.baseDamage;
  
  for (const mod of encounter.modifiers) {
    const modData = DRAGON_MODIFIERS[mod];
    health *= modData.healthMod;
    damage *= modData.damageMod;
  }
  
  // World boss bonus
  if (encounter.isWorldBoss) {
    health *= 2;
    damage *= 1.5;
  }
  
  return {
    health: Math.round(health),
    damage: Math.round(damage),
  };
};

/**
 * Check if a dragon encounter should occur (random world event)
 */
export const shouldTriggerDragonAttack = (
  playerLevel: number,
  hoursSinceLastDragon: number,
  isOutdoors: boolean
): boolean => {
  if (!isOutdoors) return false;
  if (playerLevel < 5) return false; // No random dragons until level 5
  if (hoursSinceLastDragon < 24) return false; // Cooldown
  
  // Base chance increases with level and time since last dragon
  const baseChance = 0.02; // 2%
  const levelBonus = Math.min(playerLevel * 0.002, 0.05); // Up to 5% bonus
  const timeBonus = Math.min(hoursSinceLastDragon / 100 * 0.03, 0.05); // Up to 5% for 100+ hours
  
  const totalChance = baseChance + levelBonus + timeBonus;
  
  return Math.random() < totalChance;
};

/**
 * Generate dragon loot based on type
 */
export interface DragonLoot {
  dragonBones: number;
  dragonScales: number;
  gold: { min: number; max: number };
  specialItem?: { name: string; type: string; rarity: string };
}

export const generateDragonLoot = (dragon: DragonDefinition): DragonLoot => {
  const loot: DragonLoot = {
    dragonBones: Math.floor(Math.random() * 3) + 1,
    dragonScales: Math.floor(Math.random() * 4) + 2,
    gold: { min: 50, max: 200 },
  };
  
  // Scale loot with dragon tier
  switch (dragon.lootTier) {
    case 'uncommon':
      loot.dragonBones += 1;
      loot.dragonScales += 1;
      loot.gold = { min: 100, max: 350 };
      break;
    case 'rare':
      loot.dragonBones += 2;
      loot.dragonScales += 2;
      loot.gold = { min: 200, max: 500 };
      if (Math.random() < 0.3) {
        loot.specialItem = {
          name: `${dragon.name}'s Heartscale`,
          type: 'misc',
          rarity: 'rare',
        };
      }
      break;
    case 'epic':
      loot.dragonBones += 3;
      loot.dragonScales += 4;
      loot.gold = { min: 400, max: 800 };
      if (Math.random() < 0.5) {
        loot.specialItem = {
          name: `Ancient Dragon Claw of ${dragon.element === 'frost' ? 'Ice' : 'Fire'}`,
          type: 'misc',
          rarity: 'epic',
        };
      }
      break;
  }
  
  return loot;
};

/**
 * Convert dragon encounter to dynamic event format
 */
export const dragonEncounterToEvent = (
  encounter: DragonEncounter,
  characterId: string,
  currentGameTime: number
): DynamicEvent => {
  const stats = calculateDragonStats(encounter);
  const loot = generateDragonLoot(encounter.dragon);
  
  const tierMap: Record<string, LevelTier> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 5,
  };
  
  const modifierDescriptions = encounter.modifiers
    .map(m => DRAGON_MODIFIERS[m].name)
    .join(', ');
  
  return {
    id: `dragon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    characterId,
    name: encounter.isWorldBoss 
      ? `World Boss: ${encounter.dragon.name}` 
      : `Dragon Attack: ${encounter.dragon.name}`,
    description: `${encounter.narrativeHook}\n\n${encounter.dragon.description}${
      modifierDescriptions ? `\n\nModifiers: ${modifierDescriptions}` : ''
    }`,
    type: 'dragon',
    levelTier: tierMap[encounter.dragon.lootTier] || 3,
    levelRequirement: encounter.dragon.minLevel,
    location: {
      name: encounter.location,
      x: Math.floor(Math.random() * 80) + 10, // Random position on map
      y: Math.floor(Math.random() * 80) + 10,
    },
    rewards: {
      xp: { min: 100 * encounter.dragon.soulValue, max: 200 * encounter.dragon.soulValue },
      gold: { min: loot.gold, max: loot.gold },
      items: [
        `Dragon Bones x${loot.dragonBones}`,
        `Dragon Scales x${loot.dragonScales}`,
        ...(loot.specialItem ? [`${loot.specialItem.name}`] : []),
      ],
    },
    adventurePrompt: `Defeat the ${encounter.dragon.name} at ${encounter.location}!`,
    status: 'available',
    createdAt: Date.now(),
    createdAtGameTime: currentGameTime,
    durationHours: 2, // Dragons don't wait around
    progress: {
      currentStep: 0,
      totalSteps: 2,
      objectives: [
        { description: `Slay the ${encounter.dragon.name}`, completed: false },
        { description: 'Absorb the dragon soul', completed: false },
      ],
    },
  };
};
