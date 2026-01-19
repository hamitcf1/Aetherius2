/**
 * Hunting & Fishing Service
 * Wildlife tracking, hunting mechanics, and fishing system
 */

import { LootRarity, InventoryItem } from '../types';

// ========== TYPES ==========

export type AnimalType = 
  | 'deer' | 'elk' | 'rabbit' | 'fox' | 'goat' | 'cow'
  | 'wolf' | 'bear' | 'sabre_cat' | 'skeever' | 'horker'
  | 'mammoth' | 'mudcrab' | 'chicken' | 'dog' | 'horse';

export type FishType = 
  | 'salmon' | 'river_betty' | 'abecean_longfin' | 'cyrodilic_spadetail'
  | 'histcarp' | 'silverside_perch' | 'slaughterfish' | 'arctic_char'
  | 'arctic_grayling' | 'pogfish' | 'angler' | 'carp' | 'catfish' | 'goldfish';

export type HuntingRegion = 
  | 'forest' | 'plains' | 'mountains' | 'tundra' | 'coast' | 'swamp';

export type FishingSpot = 
  | 'river' | 'lake' | 'ocean' | 'pond' | 'stream';

export interface Animal {
  id: string;
  name: string;
  type: AnimalType;
  regions: HuntingRegion[];
  difficulty: number; // 1-100 hunting difficulty
  aggressive: boolean;
  health: number;
  damage?: number;
  drops: AnimalDrop[];
  fleeSpeed: number;
  detectRange: number;
  rarity: 'common' | 'uncommon' | 'rare';
  description: string;
}

export interface AnimalDrop {
  itemId: string;
  name: string;
  chance: number; // 0-100
  minQuantity: number;
  maxQuantity: number;
}

export interface Fish {
  id: string;
  name: string;
  type: FishType;
  spots: FishingSpot[];
  difficulty: number; // 1-100 fishing difficulty
  value: number;
  weight: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  alchemyEffect?: string;
  description: string;
  timeRestriction?: 'day' | 'night' | 'any';
}

export interface HuntingState {
  animalsKilled: Record<string, number>;
  totalHunts: number;
  successfulHunts: number;
  failedHunts: number;
  largestKill?: string;
  huntingSkill: number; // 0-100
  trackedAnimals: string[];
}

export interface FishingState {
  fishCaught: Record<string, number>;
  totalCasts: number;
  successfulCatches: number;
  failedCatches: number;
  biggestCatch?: { fishId: string; weight: number };
  fishingSkill: number; // 0-100
  favoriteSpot?: string;
  rarestCatch?: string;
}

// ========== ANIMALS DATABASE ==========

export const ANIMALS: Record<string, Animal> = {
  deer: {
    id: 'deer',
    name: 'Deer',
    type: 'deer',
    regions: ['forest', 'plains'],
    difficulty: 30,
    aggressive: false,
    health: 25,
    drops: [
      { itemId: 'venison', name: 'Venison', chance: 100, minQuantity: 2, maxQuantity: 4 },
      { itemId: 'deer_hide', name: 'Deer Hide', chance: 100, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'deer_antlers', name: 'Deer Antlers', chance: 30, minQuantity: 1, maxQuantity: 2 },
    ],
    fleeSpeed: 80,
    detectRange: 40,
    rarity: 'common',
    description: 'A graceful deer. Common prey throughout Skyrim\'s forests.',
  },
  elk: {
    id: 'elk',
    name: 'Elk',
    type: 'elk',
    regions: ['forest', 'mountains', 'tundra'],
    difficulty: 40,
    aggressive: false,
    health: 50,
    drops: [
      { itemId: 'venison', name: 'Venison', chance: 100, minQuantity: 3, maxQuantity: 6 },
      { itemId: 'elk_hide', name: 'Elk Hide', chance: 100, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'large_antlers', name: 'Large Antlers', chance: 50, minQuantity: 1, maxQuantity: 2 },
    ],
    fleeSpeed: 70,
    detectRange: 50,
    rarity: 'common',
    description: 'A majestic elk with impressive antlers.',
  },
  rabbit: {
    id: 'rabbit',
    name: 'Rabbit',
    type: 'rabbit',
    regions: ['forest', 'plains', 'tundra'],
    difficulty: 50, // Small and fast
    aggressive: false,
    health: 5,
    drops: [
      { itemId: 'raw_rabbit', name: 'Raw Rabbit Leg', chance: 100, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'rabbit_hide', name: 'Rabbit Hide', chance: 100, minQuantity: 1, maxQuantity: 1 },
    ],
    fleeSpeed: 95,
    detectRange: 30,
    rarity: 'common',
    description: 'A small, quick rabbit. Hard to hit but easy to kill.',
  },
  fox: {
    id: 'fox',
    name: 'Fox',
    type: 'fox',
    regions: ['forest', 'plains', 'tundra'],
    difficulty: 45,
    aggressive: false,
    health: 15,
    drops: [
      { itemId: 'fox_hide', name: 'Fox Hide', chance: 100, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'fox_pelt', name: 'Fox Pelt', chance: 30, minQuantity: 1, maxQuantity: 1 },
    ],
    fleeSpeed: 85,
    detectRange: 35,
    rarity: 'uncommon',
    description: 'A cunning fox. Prized for its pelt.',
  },
  goat: {
    id: 'goat',
    name: 'Goat',
    type: 'goat',
    regions: ['mountains', 'plains'],
    difficulty: 25,
    aggressive: false,
    health: 20,
    drops: [
      { itemId: 'goat_meat', name: 'Leg of Goat', chance: 100, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'goat_hide', name: 'Goat Hide', chance: 100, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'goat_horns', name: 'Goat Horns', chance: 40, minQuantity: 1, maxQuantity: 2 },
    ],
    fleeSpeed: 60,
    detectRange: 30,
    rarity: 'common',
    description: 'A mountain goat. Often found near farms and highlands.',
  },
  wolf: {
    id: 'wolf',
    name: 'Wolf',
    type: 'wolf',
    regions: ['forest', 'tundra', 'mountains'],
    difficulty: 35,
    aggressive: true,
    health: 40,
    damage: 15,
    drops: [
      { itemId: 'wolf_pelt', name: 'Wolf Pelt', chance: 100, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'wolf_meat', name: 'Raw Dog Meat', chance: 80, minQuantity: 1, maxQuantity: 2 },
    ],
    fleeSpeed: 0, // Doesn't flee
    detectRange: 60,
    rarity: 'common',
    description: 'A dangerous wolf. Hunts in packs.',
  },
  bear: {
    id: 'bear',
    name: 'Bear',
    type: 'bear',
    regions: ['forest', 'mountains'],
    difficulty: 60,
    aggressive: true,
    health: 200,
    damage: 40,
    drops: [
      { itemId: 'bear_pelt', name: 'Bear Pelt', chance: 100, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'bear_claws', name: 'Bear Claws', chance: 100, minQuantity: 2, maxQuantity: 4 },
      { itemId: 'raw_meat', name: 'Raw Meat', chance: 80, minQuantity: 2, maxQuantity: 4 },
    ],
    fleeSpeed: 0,
    detectRange: 50,
    rarity: 'uncommon',
    description: 'A powerful bear. Extremely dangerous when provoked.',
  },
  sabre_cat: {
    id: 'sabre_cat',
    name: 'Sabre Cat',
    type: 'sabre_cat',
    regions: ['tundra', 'mountains'],
    difficulty: 70,
    aggressive: true,
    health: 150,
    damage: 50,
    drops: [
      { itemId: 'sabre_cat_pelt', name: 'Sabre Cat Pelt', chance: 100, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'sabre_cat_tooth', name: 'Sabre Cat Tooth', chance: 100, minQuantity: 2, maxQuantity: 4 },
      { itemId: 'sabre_cat_eye', name: 'Sabre Cat Eye', chance: 50, minQuantity: 1, maxQuantity: 2 },
    ],
    fleeSpeed: 0,
    detectRange: 70,
    rarity: 'uncommon',
    description: 'A fearsome sabre cat with deadly fangs.',
  },
  horker: {
    id: 'horker',
    name: 'Horker',
    type: 'horker',
    regions: ['coast'],
    difficulty: 40,
    aggressive: false,
    health: 100,
    damage: 20,
    drops: [
      { itemId: 'horker_meat', name: 'Horker Meat', chance: 100, minQuantity: 2, maxQuantity: 4 },
      { itemId: 'horker_tusk', name: 'Horker Tusk', chance: 100, minQuantity: 1, maxQuantity: 3 },
      { itemId: 'horker_fat', name: 'Horker Fat', chance: 80, minQuantity: 1, maxQuantity: 2 },
    ],
    fleeSpeed: 20,
    detectRange: 25,
    rarity: 'common',
    description: 'A large horker lounging on the coast.',
  },
  mammoth: {
    id: 'mammoth',
    name: 'Mammoth',
    type: 'mammoth',
    regions: ['tundra', 'plains'],
    difficulty: 90,
    aggressive: false,
    health: 500,
    damage: 80,
    drops: [
      { itemId: 'mammoth_snout', name: 'Mammoth Snout', chance: 100, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'mammoth_tusk', name: 'Mammoth Tusk', chance: 100, minQuantity: 2, maxQuantity: 2 },
      { itemId: 'mammoth_hide', name: 'Mammoth Hide', chance: 100, minQuantity: 1, maxQuantity: 2 },
    ],
    fleeSpeed: 0,
    detectRange: 60,
    rarity: 'rare',
    description: 'A colossal mammoth. Protected by giants.',
  },
  mudcrab: {
    id: 'mudcrab',
    name: 'Mudcrab',
    type: 'mudcrab',
    regions: ['coast', 'swamp'],
    difficulty: 15,
    aggressive: true,
    health: 20,
    damage: 5,
    drops: [
      { itemId: 'mudcrab_chitin', name: 'Mudcrab Chitin', chance: 100, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'mudcrab_legs', name: 'Mudcrab Legs', chance: 80, minQuantity: 1, maxQuantity: 3 },
    ],
    fleeSpeed: 0,
    detectRange: 20,
    rarity: 'common',
    description: 'A small but feisty mudcrab.',
  },
  skeever: {
    id: 'skeever',
    name: 'Skeever',
    type: 'skeever',
    regions: ['swamp', 'forest'],
    difficulty: 10,
    aggressive: true,
    health: 25,
    damage: 8,
    drops: [
      { itemId: 'skeever_tail', name: 'Skeever Tail', chance: 100, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'skeever_hide', name: 'Skeever Hide', chance: 50, minQuantity: 1, maxQuantity: 1 },
    ],
    fleeSpeed: 0,
    detectRange: 30,
    rarity: 'common',
    description: 'A disgusting skeever. May carry disease.',
  },
};

// ========== FISH DATABASE ==========

export const FISH: Record<string, Fish> = {
  salmon: {
    id: 'salmon',
    name: 'Salmon',
    type: 'salmon',
    spots: ['river', 'stream'],
    difficulty: 20,
    value: 5,
    weight: 2,
    rarity: 'common',
    alchemyEffect: 'Restore Stamina',
    description: 'A common salmon. Found throughout Skyrim\'s rivers.',
  },
  river_betty: {
    id: 'river_betty',
    name: 'River Betty',
    type: 'river_betty',
    spots: ['river', 'stream'],
    difficulty: 35,
    value: 15,
    weight: 0.5,
    rarity: 'uncommon',
    alchemyEffect: 'Damage Health, Fortify Alteration',
    description: 'A small, colorful fish prized by alchemists.',
  },
  abecean_longfin: {
    id: 'abecean_longfin',
    name: 'Abecean Longfin',
    type: 'abecean_longfin',
    spots: ['lake', 'river'],
    difficulty: 40,
    value: 15,
    weight: 0.5,
    rarity: 'uncommon',
    alchemyEffect: 'Fortify Restoration, Weakness to Frost',
    description: 'A long-finned fish from warmer waters.',
  },
  cyrodilic_spadetail: {
    id: 'cyrodilic_spadetail',
    name: 'Cyrodilic Spadetail',
    type: 'cyrodilic_spadetail',
    spots: ['lake', 'river', 'pond'],
    difficulty: 30,
    value: 10,
    weight: 0.5,
    rarity: 'common',
    alchemyEffect: 'Damage Stamina, Fear',
    description: 'A fish native to Cyrodiil, found in lakes.',
  },
  histcarp: {
    id: 'histcarp',
    name: 'Histcarp',
    type: 'histcarp',
    spots: ['river', 'pond'],
    difficulty: 45,
    value: 20,
    weight: 0.5,
    rarity: 'uncommon',
    alchemyEffect: 'Restore Stamina, Fortify Magicka',
    description: 'A sacred fish to the Argonians.',
  },
  silverside_perch: {
    id: 'silverside_perch',
    name: 'Silverside Perch',
    type: 'silverside_perch',
    spots: ['lake', 'river'],
    difficulty: 25,
    value: 8,
    weight: 0.5,
    rarity: 'common',
    alchemyEffect: 'Restore Stamina, Damage Stamina Regen',
    description: 'A shiny perch found in clear waters.',
  },
  slaughterfish: {
    id: 'slaughterfish',
    name: 'Slaughterfish',
    type: 'slaughterfish',
    spots: ['river', 'lake', 'ocean'],
    difficulty: 50, // Dangerous to catch
    value: 3,
    weight: 2,
    rarity: 'common',
    description: 'A vicious predatory fish. Handle with care.',
  },
  arctic_char: {
    id: 'arctic_char',
    name: 'Arctic Char',
    type: 'arctic_char',
    spots: ['river', 'lake'],
    difficulty: 55,
    value: 25,
    weight: 1,
    rarity: 'rare',
    alchemyEffect: 'Resist Frost, Fortify Carry Weight',
    description: 'A prized fish from the frozen north.',
    timeRestriction: 'day',
  },
  arctic_grayling: {
    id: 'arctic_grayling',
    name: 'Arctic Grayling',
    type: 'arctic_grayling',
    spots: ['river', 'stream'],
    difficulty: 50,
    value: 20,
    weight: 0.5,
    rarity: 'rare',
    alchemyEffect: 'Resist Frost, Fortify Magicka',
    description: 'A beautiful grayling from cold streams.',
  },
  pogfish: {
    id: 'pogfish',
    name: 'Pogfish',
    type: 'pogfish',
    spots: ['ocean', 'lake'],
    difficulty: 60,
    value: 30,
    weight: 1,
    rarity: 'rare',
    alchemyEffect: 'Fortify Pickpocket, Resist Shock',
    description: 'A rare, ugly fish with potent alchemical properties.',
    timeRestriction: 'night',
  },
  angler: {
    id: 'angler',
    name: 'Angler',
    type: 'angler',
    spots: ['ocean'],
    difficulty: 75,
    value: 50,
    weight: 3,
    rarity: 'legendary',
    alchemyEffect: 'Lingering Damage Health, Waterbreathing',
    description: 'A terrifying deep-sea fish with a glowing lure.',
    timeRestriction: 'night',
  },
  carp: {
    id: 'carp',
    name: 'Carp',
    type: 'carp',
    spots: ['pond', 'lake'],
    difficulty: 15,
    value: 3,
    weight: 2,
    rarity: 'common',
    description: 'A common carp. Not very valuable but edible.',
  },
  catfish: {
    id: 'catfish',
    name: 'Catfish',
    type: 'catfish',
    spots: ['river', 'pond'],
    difficulty: 30,
    value: 8,
    weight: 3,
    rarity: 'common',
    alchemyEffect: 'Restore Health',
    description: 'A bottom-dwelling catfish.',
  },
  goldfish: {
    id: 'goldfish',
    name: 'Goldfish',
    type: 'goldfish',
    spots: ['pond'],
    difficulty: 40,
    value: 100,
    weight: 0.1,
    rarity: 'rare',
    description: 'A beautiful golden fish. Prized as a pet.',
  },
};

// ========== STATE MANAGEMENT ==========

export function getInitialHuntingState(): HuntingState {
  return {
    animalsKilled: {},
    totalHunts: 0,
    successfulHunts: 0,
    failedHunts: 0,
    huntingSkill: 0,
    trackedAnimals: [],
  };
}

export function getInitialFishingState(): FishingState {
  return {
    fishCaught: {},
    totalCasts: 0,
    successfulCatches: 0,
    failedCatches: 0,
    fishingSkill: 0,
  };
}

// ========== HUNTING FUNCTIONS ==========

export function attemptHunt(
  state: HuntingState,
  animalId: string,
  playerArcherySkill: number,
  playerSneakSkill: number,
  hasRangedWeapon: boolean
): { newState: HuntingState; success: boolean; message: string; drops: AnimalDrop[] } {
  const animal = ANIMALS[animalId];
  if (!animal) {
    return {
      newState: state,
      success: false,
      message: 'Unknown animal.',
      drops: [],
    };
  }
  
  // Calculate hunt success chance
  let successChance = 50; // Base 50%
  
  // Archery skill bonus (for ranged)
  if (hasRangedWeapon) {
    successChance += playerArcherySkill * 0.3;
  }
  
  // Sneak skill bonus
  successChance += playerSneakSkill * 0.2;
  
  // Hunting skill bonus
  successChance += state.huntingSkill * 0.25;
  
  // Animal difficulty penalty
  successChance -= animal.difficulty * 0.5;
  
  // Animal flee speed penalty (for non-aggressive)
  if (!animal.aggressive) {
    successChance -= animal.fleeSpeed * 0.1;
  }
  
  // Clamp between 5-95%
  successChance = Math.max(5, Math.min(95, successChance));
  
  const roll = Math.random() * 100;
  const success = roll < successChance;
  
  // Skill gain regardless of outcome
  const skillGain = success ? 2 : 0.5;
  const newHuntingSkill = Math.min(100, state.huntingSkill + skillGain);
  
  if (success) {
    // Calculate drops
    const drops: AnimalDrop[] = [];
    for (const drop of animal.drops) {
      if (Math.random() * 100 < drop.chance) {
        const quantity = Math.floor(
          Math.random() * (drop.maxQuantity - drop.minQuantity + 1) + drop.minQuantity
        );
        drops.push({ ...drop, minQuantity: quantity, maxQuantity: quantity });
      }
    }
    
    const killCount = (state.animalsKilled[animalId] || 0) + 1;
    
    return {
      newState: {
        ...state,
        animalsKilled: {
          ...state.animalsKilled,
          [animalId]: killCount,
        },
        totalHunts: state.totalHunts + 1,
        successfulHunts: state.successfulHunts + 1,
        largestKill: animal.health > (ANIMALS[state.largestKill || '']?.health || 0) 
          ? animalId 
          : state.largestKill,
        huntingSkill: newHuntingSkill,
      },
      success: true,
      message: `You successfully hunted a ${animal.name}!`,
      drops,
    };
  } else {
    const fleeMessage = animal.aggressive 
      ? `The ${animal.name} turns to attack you!` 
      : `The ${animal.name} escapes into the wilderness.`;
    
    return {
      newState: {
        ...state,
        totalHunts: state.totalHunts + 1,
        failedHunts: state.failedHunts + 1,
        huntingSkill: newHuntingSkill,
      },
      success: false,
      message: `Your hunt failed. ${fleeMessage}`,
      drops: [],
    };
  }
}

export function trackAnimal(
  state: HuntingState,
  animalId: string
): HuntingState {
  if (state.trackedAnimals.includes(animalId)) {
    return state;
  }
  return {
    ...state,
    trackedAnimals: [...state.trackedAnimals, animalId],
  };
}

export function getAnimalsInRegion(region: HuntingRegion): Animal[] {
  return Object.values(ANIMALS).filter(a => a.regions.includes(region));
}

// ========== FISHING FUNCTIONS ==========

export function attemptFishing(
  state: FishingState,
  spotType: FishingSpot,
  timeOfDay: 'day' | 'night',
  hasGoodRod: boolean = false
): { newState: FishingState; success: boolean; message: string; fish?: Fish; weight?: number } {
  // Get fish available at this spot and time
  const availableFish = Object.values(FISH).filter(f => {
    if (!f.spots.includes(spotType)) return false;
    if (f.timeRestriction && f.timeRestriction !== 'any' && f.timeRestriction !== timeOfDay) {
      return false;
    }
    return true;
  });
  
  if (availableFish.length === 0) {
    return {
      newState: {
        ...state,
        totalCasts: state.totalCasts + 1,
        failedCatches: state.failedCatches + 1,
      },
      success: false,
      message: 'No fish seem to be biting here.',
    };
  }
  
  // Calculate base success chance
  let successChance = 40; // Base 40%
  successChance += state.fishingSkill * 0.4; // Skill bonus
  if (hasGoodRod) successChance += 15; // Equipment bonus
  
  // Clamp between 10-90%
  successChance = Math.max(10, Math.min(90, successChance));
  
  const roll = Math.random() * 100;
  
  // Skill gain
  const skillGain = roll < successChance ? 1.5 : 0.3;
  const newFishingSkill = Math.min(100, state.fishingSkill + skillGain);
  
  if (roll >= successChance) {
    return {
      newState: {
        ...state,
        totalCasts: state.totalCasts + 1,
        failedCatches: state.failedCatches + 1,
        fishingSkill: newFishingSkill,
      },
      success: false,
      message: 'The fish got away!',
    };
  }
  
  // Select a fish based on rarity weights
  const rarityWeights = {
    common: 60,
    uncommon: 25,
    rare: 12,
    legendary: 3,
  };
  
  // Skill increases rare fish chance
  if (state.fishingSkill >= 50) {
    rarityWeights.rare += 5;
    rarityWeights.legendary += 2;
    rarityWeights.common -= 7;
  }
  if (state.fishingSkill >= 80) {
    rarityWeights.rare += 5;
    rarityWeights.legendary += 3;
    rarityWeights.common -= 8;
  }
  
  // Filter by rarity roll
  const rarityRoll = Math.random() * 100;
  let targetRarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  
  if (rarityRoll < rarityWeights.legendary) {
    targetRarity = 'legendary';
  } else if (rarityRoll < rarityWeights.legendary + rarityWeights.rare) {
    targetRarity = 'rare';
  } else if (rarityRoll < rarityWeights.legendary + rarityWeights.rare + rarityWeights.uncommon) {
    targetRarity = 'uncommon';
  } else {
    targetRarity = 'common';
  }
  
  // Get fish of target rarity, or fall back to any available
  let possibleFish = availableFish.filter(f => f.rarity === targetRarity);
  if (possibleFish.length === 0) {
    possibleFish = availableFish;
  }
  
  // Random selection from possible fish
  const caughtFish = possibleFish[Math.floor(Math.random() * possibleFish.length)];
  
  // Random weight variation (80% - 150% of base)
  const weightVariation = 0.8 + Math.random() * 0.7;
  const actualWeight = Math.round(caughtFish.weight * weightVariation * 100) / 100;
  
  const catchCount = (state.fishCaught[caughtFish.id] || 0) + 1;
  
  // Check for biggest catch
  let biggestCatch = state.biggestCatch;
  if (!biggestCatch || actualWeight > biggestCatch.weight) {
    biggestCatch = { fishId: caughtFish.id, weight: actualWeight };
  }
  
  // Check for rarest catch
  const rarityOrder = ['common', 'uncommon', 'rare', 'legendary'];
  const currentRarestIndex = state.rarestCatch ? rarityOrder.indexOf(FISH[state.rarestCatch]?.rarity || 'common') : -1;
  const newRarityIndex = rarityOrder.indexOf(caughtFish.rarity);
  const rarestCatch = newRarityIndex > currentRarestIndex ? caughtFish.id : state.rarestCatch;
  
  return {
    newState: {
      ...state,
      fishCaught: {
        ...state.fishCaught,
        [caughtFish.id]: catchCount,
      },
      totalCasts: state.totalCasts + 1,
      successfulCatches: state.successfulCatches + 1,
      fishingSkill: newFishingSkill,
      biggestCatch,
      rarestCatch,
    },
    success: true,
    message: `You caught a ${caughtFish.name}! (${actualWeight} lbs)`,
    fish: caughtFish,
    weight: actualWeight,
  };
}

export function getFishInSpot(spot: FishingSpot, timeOfDay: 'day' | 'night'): Fish[] {
  return Object.values(FISH).filter(f => {
    if (!f.spots.includes(spot)) return false;
    if (f.timeRestriction && f.timeRestriction !== 'any' && f.timeRestriction !== timeOfDay) {
      return false;
    }
    return true;
  });
}

// ========== UTILITY FUNCTIONS ==========

export function getHuntingSuccessRate(state: HuntingState): number {
  if (state.totalHunts === 0) return 0;
  return Math.round((state.successfulHunts / state.totalHunts) * 100);
}

export function getFishingSuccessRate(state: FishingState): number {
  if (state.totalCasts === 0) return 0;
  return Math.round((state.successfulCatches / state.totalCasts) * 100);
}

export function animalDropsToInventoryItems(
  drops: AnimalDrop[]
): InventoryItem[] {
  return drops.map(drop => ({
    id: drop.itemId,
    name: drop.name,
    type: 'misc',
    quantity: drop.minQuantity, // Using minQuantity as actual quantity after calculation
    description: `Harvested from hunting.`,
    rarity: 'common' as LootRarity,
    value: 5,
    weight: 1,
  }));
}

export function fishToInventoryItem(fish: Fish, weight: number): InventoryItem {
  const rarity: LootRarity = fish.rarity === 'legendary' ? 'legendary' 
    : fish.rarity === 'rare' ? 'rare' 
    : fish.rarity === 'uncommon' ? 'uncommon' 
    : 'common';
  
  return {
    id: fish.id,
    name: fish.name,
    type: 'food',
    quantity: 1,
    description: fish.description,
    rarity,
    value: fish.value,
    weight: weight,
    effects: fish.alchemyEffect ? [fish.alchemyEffect] : [],
  };
}

export function getTotalAnimalsKilled(state: HuntingState): number {
  return Object.values(state.animalsKilled).reduce((sum, count) => sum + count, 0);
}

export function getTotalFishCaught(state: FishingState): number {
  return Object.values(state.fishCaught).reduce((sum, count) => sum + count, 0);
}

export function getHuntingRank(state: HuntingState): string {
  const total = getTotalAnimalsKilled(state);
  if (total >= 500) return 'Master Hunter';
  if (total >= 200) return 'Expert Hunter';
  if (total >= 100) return 'Seasoned Hunter';
  if (total >= 50) return 'Skilled Hunter';
  if (total >= 20) return 'Apprentice Hunter';
  if (total >= 5) return 'Novice Hunter';
  return 'Beginner';
}

export function getFishingRank(state: FishingState): string {
  const total = getTotalFishCaught(state);
  if (total >= 300) return 'Master Angler';
  if (total >= 150) return 'Expert Angler';
  if (total >= 75) return 'Seasoned Angler';
  if (total >= 35) return 'Skilled Angler';
  if (total >= 15) return 'Apprentice Angler';
  if (total >= 5) return 'Novice Angler';
  return 'Beginner';
}
