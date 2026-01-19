/**
 * Pickpocket & Crime Service
 * Handles pickpocketing mechanics, crime detection, and stolen goods
 */

import { InventoryItem, LootRarity } from '../types';
import { HoldName, HOLDS, addBounty } from './bountyService';

// ========== TYPES ==========

export type CrimeType = 'theft' | 'pickpocket' | 'assault' | 'murder' | 'trespass' | 'werewolf' | 'vampire' | 'escape';

export interface Crime {
  id: string;
  type: CrimeType;
  holdId: HoldName;
  bountyAmount: number;
  witnessed: boolean;
  timestamp: number;
  description: string;
  victim?: string;
}

export interface PickpocketTarget {
  id: string;
  name: string;
  race: string;
  wealth: 'poor' | 'common' | 'wealthy' | 'noble';
  awareness: number; // 0-100, higher = harder to pickpocket
  hold: HoldName;
  location: string;
  inventory: PickpocketItem[];
  isHostile: boolean;
  isEssential: boolean;
}

export interface PickpocketItem {
  name: string;
  type: 'gold' | 'weapon' | 'apparel' | 'potion' | 'key' | 'misc' | 'gem';
  value: number;
  weight: number;
  quantity: number;
  stealDifficulty: number; // 0-100, base difficulty to steal this item
  rarity?: LootRarity;
}

export interface PickpocketAttemptResult {
  success: boolean;
  detected: boolean;
  item?: PickpocketItem;
  bountyIncurred: number;
  message: string;
  xpGained: number;
}

export interface StolenGoodsState {
  stolenItems: Array<{ item: InventoryItem; stolenFrom: string; timestamp: number }>;
  fencedGold: number;
  totalValueStolen: number;
  crimesCommitted: Crime[];
  pickpocketSuccesses: number;
  pickpocketFailures: number;
}

// ========== CONSTANTS ==========

// Bounty amounts by crime type
export const BOUNTY_AMOUNTS: Record<CrimeType, number> = {
  pickpocket: 25,
  theft: 50,
  trespass: 5,
  assault: 40,
  murder: 1000,
  werewolf: 1000,
  vampire: 500,
  escape: 100,
};

// Wealth affects gold carried and item quality
const WEALTH_GOLD_RANGES: Record<'poor' | 'common' | 'wealthy' | 'noble', { min: number; max: number }> = {
  poor: { min: 5, max: 30 },
  common: { min: 20, max: 100 },
  wealthy: { min: 100, max: 500 },
  noble: { min: 300, max: 2000 },
};

// Base detection chance modifiers
const WEALTH_AWARENESS_BONUS: Record<'poor' | 'common' | 'wealthy' | 'noble', number> = {
  poor: 0,
  common: 10,
  wealthy: 25,
  noble: 40,
};

// ========== PICKPOCKET TARGET GENERATION ==========

const NPC_NAMES = {
  nord: ['Sven', 'Erik', 'Ralof', 'Ulfric', 'Hadvar', 'Sigurd', 'Arngeir', 'Agna', 'Idgrod', 'Helga', 'Sigrid', 'Ysolda'],
  imperial: ['Tullius', 'Hadrian', 'Marcus', 'Cicero', 'Festus', 'Lucia', 'Vittoria', 'Gianna', 'Camilla', 'Adrianne'],
  breton: ['Delphine', 'Esbern', 'Ennis', 'Michel', 'Aicantar', 'Muiri', 'Bothela', 'Calcelmo'],
  redguard: ['Nazir', 'Alik\'r', 'Kematu', 'Saadia', 'Amren', 'Saffir', 'Endon'],
  dunmer: ['Neloth', 'Jenassa', 'Brelyna', 'Athis', 'Aranea', 'Azura', 'Drelas', 'Avrusa'],
  altmer: ['Ancano', 'Ondolemar', 'Taarie', 'Endarie', 'Niranye', 'Faralda'],
  bosmer: ['Faendal', 'Anoriath', 'Elrindir', 'Malborn', 'Nimriel'],
  khajiit: ['Ri\'saad', 'Ma\'randru-jo', 'Atahbah', 'Kharjo', "Ma'dran", "Ra'zhinda"],
  argonian: ['Madesi', 'Shahvee', 'Talen-Jei', 'Keerava', 'Gulum-Ei', 'Scouts-Many-Marshes'],
  orc: ['Ugor', 'Gharol', 'Borgakh', 'Durak', 'Ogol', 'Larak'],
};

const RACES = Object.keys(NPC_NAMES) as Array<keyof typeof NPC_NAMES>;

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generatePickpocketTarget(hold: HoldName, wealthBias?: 'poor' | 'common' | 'wealthy' | 'noble'): PickpocketTarget {
  const race = pickRandom(RACES);
  const name = pickRandom(NPC_NAMES[race]);
  
  // Determine wealth
  const wealthRoll = Math.random();
  let wealth: 'poor' | 'common' | 'wealthy' | 'noble';
  if (wealthBias) {
    wealth = wealthBias;
  } else if (wealthRoll < 0.3) {
    wealth = 'poor';
  } else if (wealthRoll < 0.7) {
    wealth = 'common';
  } else if (wealthRoll < 0.9) {
    wealth = 'wealthy';
  } else {
    wealth = 'noble';
  }
  
  // Generate inventory
  const inventory = generatePickpocketInventory(wealth);
  
  // Base awareness + wealth bonus + random variance
  const awareness = Math.min(100, Math.max(10, 30 + WEALTH_AWARENESS_BONUS[wealth] + randomBetween(-10, 20)));
  
  return {
    id: `npc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    race,
    wealth,
    awareness,
    hold,
    location: HOLDS[hold]?.capital || 'Unknown',
    inventory,
    isHostile: false,
    isEssential: Math.random() < 0.1, // 10% chance essential (can't be killed)
  };
}

function generatePickpocketInventory(wealth: 'poor' | 'common' | 'wealthy' | 'noble'): PickpocketItem[] {
  const items: PickpocketItem[] = [];
  
  // Always has some gold
  const goldRange = WEALTH_GOLD_RANGES[wealth];
  const goldAmount = randomBetween(goldRange.min, goldRange.max);
  items.push({
    name: 'Gold',
    type: 'gold',
    value: goldAmount,
    weight: 0,
    quantity: goldAmount,
    stealDifficulty: Math.min(90, goldAmount / 5), // More gold = harder to steal
  });
  
  // Random items based on wealth
  const itemCount = wealth === 'poor' ? randomBetween(0, 2) : wealth === 'common' ? randomBetween(1, 3) : wealth === 'wealthy' ? randomBetween(2, 4) : randomBetween(3, 6);
  
  const possibleItems: Array<{ item: Omit<PickpocketItem, 'stealDifficulty'>; minWealth: 'poor' | 'common' | 'wealthy' | 'noble' }> = [
    // Common items
    { item: { name: 'Lockpick', type: 'misc', value: 3, weight: 0, quantity: randomBetween(1, 5), rarity: 'common' }, minWealth: 'poor' },
    { item: { name: 'Leather Pouch', type: 'misc', value: 10, weight: 0.1, quantity: 1, rarity: 'common' }, minWealth: 'poor' },
    { item: { name: 'Iron Dagger', type: 'weapon', value: 10, weight: 2, quantity: 1, rarity: 'common' }, minWealth: 'poor' },
    { item: { name: 'Minor Health Potion', type: 'potion', value: 15, weight: 0.5, quantity: 1, rarity: 'common' }, minWealth: 'poor' },
    // Common/Wealthy items
    { item: { name: 'Steel Dagger', type: 'weapon', value: 18, weight: 2.5, quantity: 1, rarity: 'common' }, minWealth: 'common' },
    { item: { name: 'Silver Ring', type: 'apparel', value: 75, weight: 0.1, quantity: 1, rarity: 'uncommon' }, minWealth: 'common' },
    { item: { name: 'Health Potion', type: 'potion', value: 50, weight: 0.5, quantity: 1, rarity: 'uncommon' }, minWealth: 'common' },
    { item: { name: 'Garnet', type: 'gem', value: 75, weight: 0.1, quantity: 1, rarity: 'uncommon' }, minWealth: 'common' },
    // Wealthy items
    { item: { name: 'Gold Necklace', type: 'apparel', value: 200, weight: 0.2, quantity: 1, rarity: 'rare' }, minWealth: 'wealthy' },
    { item: { name: 'Ruby', type: 'gem', value: 200, weight: 0.1, quantity: 1, rarity: 'rare' }, minWealth: 'wealthy' },
    { item: { name: 'Elven Dagger', type: 'weapon', value: 95, weight: 4, quantity: 1, rarity: 'uncommon' }, minWealth: 'wealthy' },
    { item: { name: 'Scroll of Fireball', type: 'misc', value: 100, weight: 0.1, quantity: 1, rarity: 'rare' }, minWealth: 'wealthy' },
    // Noble items
    { item: { name: 'Diamond', type: 'gem', value: 500, weight: 0.1, quantity: 1, rarity: 'epic' }, minWealth: 'noble' },
    { item: { name: 'Jeweled Amulet', type: 'apparel', value: 400, weight: 0.3, quantity: 1, rarity: 'epic' }, minWealth: 'noble' },
    { item: { name: 'House Key', type: 'key', value: 0, weight: 0, quantity: 1, rarity: 'rare' }, minWealth: 'wealthy' },
    { item: { name: 'Gold Ingot', type: 'misc', value: 100, weight: 1, quantity: 1, rarity: 'uncommon' }, minWealth: 'wealthy' },
  ];
  
  const wealthOrder = ['poor', 'common', 'wealthy', 'noble'];
  const wealthIndex = wealthOrder.indexOf(wealth);
  const eligibleItems = possibleItems.filter(p => wealthOrder.indexOf(p.minWealth) <= wealthIndex);
  
  for (let i = 0; i < itemCount; i++) {
    const pick = pickRandom(eligibleItems);
    const stealDifficulty = Math.min(95, 20 + (pick.item.value / 10) + (pick.item.weight * 5));
    items.push({
      ...pick.item,
      stealDifficulty,
    });
  }
  
  return items;
}

// ========== PICKPOCKET MECHANICS ==========

export function calculatePickpocketChance(
  playerSkill: number,
  itemDifficulty: number,
  targetAwareness: number,
  perks: { lightFingers?: number; nightThief?: boolean; cutpurse?: boolean; extraPockets?: boolean; misdirection?: boolean; perfectTouch?: boolean } = {}
): number {
  // Base formula similar to Skyrim
  // Chance = (playerSkill * 0.8) - itemDifficulty - (targetAwareness * 0.3)
  let chance = (playerSkill * 0.8) - itemDifficulty - (targetAwareness * 0.3);
  
  // Perk bonuses
  if (perks.lightFingers) {
    chance += perks.lightFingers * 10; // +10% per rank
  }
  if (perks.cutpurse) {
    chance += 30; // +30% for gold
  }
  if (perks.nightThief) {
    // Assume it's night for this check
    chance += 25;
  }
  if (perks.misdirection) {
    // Can pickpocket equipped weapons
    chance += 10;
  }
  if (perks.perfectTouch) {
    // Can pickpocket equipped items
    chance += 15;
  }
  
  // Clamp between 5% and 95%
  return Math.max(5, Math.min(95, chance));
}

export function attemptPickpocket(
  target: PickpocketTarget,
  item: PickpocketItem,
  playerSkill: number,
  perks: { lightFingers?: number; nightThief?: boolean; cutpurse?: boolean; extraPockets?: boolean; misdirection?: boolean; perfectTouch?: boolean } = {},
  isHidden: boolean = false
): PickpocketAttemptResult {
  // Calculate success chance
  let successChance = calculatePickpocketChance(playerSkill, item.stealDifficulty, target.awareness, perks);
  
  // Being hidden gives bonus
  if (isHidden) {
    successChance += 15;
  }
  
  // Roll for success
  const roll = Math.random() * 100;
  const success = roll < successChance;
  
  // Detection check (even on success, can still be detected)
  let detected = false;
  if (!success) {
    detected = true; // Always detected on failure
  } else {
    // Even on success, small chance of detection
    const detectionChance = Math.max(5, target.awareness - playerSkill * 0.3);
    detected = Math.random() * 100 < detectionChance;
  }
  
  // Calculate bounty if detected
  const bountyIncurred = detected ? (item.type === 'gold' ? BOUNTY_AMOUNTS.pickpocket : BOUNTY_AMOUNTS.theft) : 0;
  
  // XP gained on success
  const xpGained = success ? Math.floor(item.value * 0.5 + item.stealDifficulty * 0.25) : 0;
  
  let message: string;
  if (success && !detected) {
    message = `Successfully pickpocketed ${item.quantity > 1 ? `${item.quantity} ` : ''}${item.name} from ${target.name}!`;
  } else if (success && detected) {
    message = `Got the ${item.name}, but ${target.name} noticed! ${bountyIncurred} bounty added.`;
  } else {
    message = `Failed to pickpocket ${target.name}! They caught you red-handed. ${bountyIncurred} bounty added.`;
  }
  
  return {
    success,
    detected,
    item: success ? item : undefined,
    bountyIncurred,
    message,
    xpGained,
  };
}

// ========== FENCE & STOLEN GOODS ==========

export function calculateFencePrice(item: InventoryItem, speechSkill: number, hasFencePerks: boolean = false): number {
  const baseValue = item.value || 0;
  
  // Fences pay 10-30% of item value based on Speech skill
  let fenceMultiplier = 0.1 + (speechSkill / 100) * 0.2; // 10% at skill 0, 30% at skill 100
  
  // Fence perks increase value
  if (hasFencePerks) {
    fenceMultiplier += 0.1;
  }
  
  return Math.floor(baseValue * fenceMultiplier);
}

export function canSellToFence(inventory: InventoryItem[], speechSkill: number): boolean {
  // Need at least 50 Speech or Thieves Guild membership to access fences
  return speechSkill >= 50;
}

// ========== STATE MANAGEMENT ==========

export function getInitialStolenGoodsState(): StolenGoodsState {
  return {
    stolenItems: [],
    fencedGold: 0,
    totalValueStolen: 0,
    crimesCommitted: [],
    pickpocketSuccesses: 0,
    pickpocketFailures: 0,
  };
}

export function addStolenItem(
  state: StolenGoodsState,
  item: InventoryItem,
  stolenFrom: string
): StolenGoodsState {
  return {
    ...state,
    stolenItems: [...state.stolenItems, { item, stolenFrom, timestamp: Date.now() }],
    totalValueStolen: state.totalValueStolen + (item.value || 0) * (item.quantity || 1),
    pickpocketSuccesses: state.pickpocketSuccesses + 1,
  };
}

export function recordCrime(
  state: StolenGoodsState,
  crimeType: CrimeType,
  holdId: HoldName,
  witnessed: boolean,
  victim?: string
): { newState: StolenGoodsState; crime: Crime } {
  const crime: Crime = {
    id: `crime_${Date.now()}`,
    type: crimeType,
    holdId,
    bountyAmount: witnessed ? BOUNTY_AMOUNTS[crimeType] : 0,
    witnessed,
    timestamp: Date.now(),
    description: getCrimeDescription(crimeType, victim),
    victim,
  };
  
  return {
    newState: {
      ...state,
      crimesCommitted: [...state.crimesCommitted, crime],
      pickpocketFailures: crimeType === 'pickpocket' && witnessed ? state.pickpocketFailures + 1 : state.pickpocketFailures,
    },
    crime,
  };
}

function getCrimeDescription(crimeType: CrimeType, victim?: string): string {
  const target = victim || 'someone';
  switch (crimeType) {
    case 'pickpocket': return `Attempted to pickpocket ${target}`;
    case 'theft': return `Stole from ${target}`;
    case 'assault': return `Assaulted ${target}`;
    case 'murder': return `Murdered ${target}`;
    case 'trespass': return 'Trespassed in a restricted area';
    case 'werewolf': return 'Transformed into a werewolf in public';
    case 'vampire': return 'Caught feeding as a vampire';
    case 'escape': return 'Escaped from jail';
    default: return 'Committed a crime';
  }
}

export function fenceStolenItem(
  state: StolenGoodsState,
  itemIndex: number,
  goldReceived: number
): StolenGoodsState {
  const newStolenItems = [...state.stolenItems];
  newStolenItems.splice(itemIndex, 1);
  
  return {
    ...state,
    stolenItems: newStolenItems,
    fencedGold: state.fencedGold + goldReceived,
  };
}

// ========== CRIME PERKS ==========

export const PICKPOCKET_PERKS = {
  lightFingers: {
    id: 'lightFingers',
    name: 'Light Fingers',
    ranks: 5,
    description: 'Each rank gives +10% pickpocket success chance',
    skillRequired: [15, 25, 40, 55, 70],
  },
  nightThief: {
    id: 'nightThief',
    name: 'Night Thief',
    ranks: 1,
    description: '+25% pickpocket chance between 8pm and 6am',
    skillRequired: [30],
  },
  cutpurse: {
    id: 'cutpurse',
    name: 'Cutpurse',
    ranks: 1,
    description: '+30% pickpocket success for gold',
    skillRequired: [40],
  },
  extraPockets: {
    id: 'extraPockets',
    name: 'Extra Pockets',
    ranks: 1,
    description: 'Carrying capacity increased by 100',
    skillRequired: [50],
  },
  keymaster: {
    id: 'keymaster',
    name: 'Keymaster',
    ranks: 1,
    description: 'Keys are always stolen with 100% chance',
    skillRequired: [60],
  },
  misdirection: {
    id: 'misdirection',
    name: 'Misdirection',
    ranks: 1,
    description: 'Can pickpocket equipped weapons',
    skillRequired: [70],
  },
  perfectTouch: {
    id: 'perfectTouch',
    name: 'Perfect Touch',
    ranks: 1,
    description: 'Can pickpocket equipped items',
    skillRequired: [100],
  },
};
