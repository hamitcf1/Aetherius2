/**
 * Treasure Chest Service
 * Handles locked containers, treasure generation based on difficulty, and special loot
 */

import { InventoryItem, LootRarity } from '../types';
import { LockDifficulty } from '../components/LockpickingMinigame';

// ========== TYPES ==========

export interface TreasureChest {
  id: string;
  name: string;
  lockDifficulty: LockDifficulty;
  location?: string;
  isTrapped?: boolean;
  trapType?: TrapType;
  trapDamage?: number;
  lootTier: LootTier;
  isLooted: boolean;
  contents: TreasureLoot[];
}

export type TrapType = 'poison' | 'fire' | 'frost' | 'shock' | 'dart' | 'none';
export type LootTier = 'poor' | 'common' | 'quality' | 'superior' | 'exquisite' | 'legendary';

export interface TreasureLoot {
  name: string;
  type: 'weapon' | 'apparel' | 'potion' | 'misc' | 'gold' | 'gem' | 'spell_tome' | 'ingredient';
  description?: string;
  quantity: number;
  value: number;
  rarity?: LootRarity;
  // Equipment stats
  damage?: number;
  armor?: number;
  // Enchantment
  enchantment?: string;
  enchantmentPower?: number;
}

export interface TreasureChestState {
  discoveredChests: Record<string, TreasureChest>; // keyed by chest id
  lootedChests: string[]; // chest ids that have been looted
  totalGoldLooted: number;
  chestsOpened: number;
  legendaryItemsFound: number;
}

// ========== LOOT TABLES ==========

// Gold ranges by tier
const GOLD_RANGES: Record<LootTier, { min: number; max: number }> = {
  poor: { min: 5, max: 25 },
  common: { min: 25, max: 75 },
  quality: { min: 75, max: 200 },
  superior: { min: 200, max: 500 },
  exquisite: { min: 500, max: 1500 },
  legendary: { min: 1500, max: 5000 },
};

// Item count ranges by tier
const ITEM_COUNT_RANGES: Record<LootTier, { min: number; max: number }> = {
  poor: { min: 1, max: 2 },
  common: { min: 2, max: 3 },
  quality: { min: 2, max: 4 },
  superior: { min: 3, max: 5 },
  exquisite: { min: 4, max: 6 },
  legendary: { min: 5, max: 8 },
};

// Gems by tier
const GEMS: Array<{ name: string; value: number; rarity: LootRarity; minTier: LootTier }> = [
  { name: 'Petty Soul Gem (Empty)', value: 20, rarity: 'common', minTier: 'poor' },
  { name: 'Lesser Soul Gem (Empty)', value: 35, rarity: 'common', minTier: 'common' },
  { name: 'Garnet', value: 75, rarity: 'uncommon', minTier: 'common' },
  { name: 'Amethyst', value: 100, rarity: 'uncommon', minTier: 'quality' },
  { name: 'Common Soul Gem (Empty)', value: 50, rarity: 'uncommon', minTier: 'quality' },
  { name: 'Ruby', value: 200, rarity: 'rare', minTier: 'quality' },
  { name: 'Sapphire', value: 250, rarity: 'rare', minTier: 'superior' },
  { name: 'Emerald', value: 300, rarity: 'rare', minTier: 'superior' },
  { name: 'Greater Soul Gem (Empty)', value: 100, rarity: 'rare', minTier: 'superior' },
  { name: 'Diamond', value: 500, rarity: 'epic', minTier: 'exquisite' },
  { name: 'Flawless Ruby', value: 350, rarity: 'epic', minTier: 'exquisite' },
  { name: 'Flawless Sapphire', value: 400, rarity: 'epic', minTier: 'exquisite' },
  { name: 'Grand Soul Gem (Empty)', value: 150, rarity: 'epic', minTier: 'exquisite' },
  { name: 'Flawless Diamond', value: 800, rarity: 'legendary', minTier: 'legendary' },
  { name: 'Black Soul Gem', value: 500, rarity: 'legendary', minTier: 'legendary' },
];

// Weapons by tier
const WEAPONS: Array<{ name: string; damage: number; value: number; rarity: LootRarity; minTier: LootTier }> = [
  // Poor/Common
  { name: 'Iron Dagger', damage: 4, value: 10, rarity: 'common', minTier: 'poor' },
  { name: 'Iron Sword', damage: 7, value: 25, rarity: 'common', minTier: 'poor' },
  { name: 'Hunting Bow', damage: 7, value: 50, rarity: 'common', minTier: 'poor' },
  { name: 'Iron War Axe', damage: 8, value: 30, rarity: 'common', minTier: 'common' },
  { name: 'Steel Dagger', damage: 5, value: 18, rarity: 'common', minTier: 'common' },
  // Quality
  { name: 'Steel Sword', damage: 11, value: 91, rarity: 'uncommon', minTier: 'quality' },
  { name: 'Steel Greatsword', damage: 17, value: 120, rarity: 'uncommon', minTier: 'quality' },
  { name: 'Elven Dagger', damage: 8, value: 95, rarity: 'uncommon', minTier: 'quality' },
  { name: 'Dwarven Bow', damage: 12, value: 270, rarity: 'uncommon', minTier: 'quality' },
  // Superior
  { name: 'Elven Sword', damage: 13, value: 235, rarity: 'rare', minTier: 'superior' },
  { name: 'Orcish War Axe', damage: 11, value: 165, rarity: 'rare', minTier: 'superior' },
  { name: 'Glass Dagger', damage: 9, value: 165, rarity: 'rare', minTier: 'superior' },
  { name: 'Ebony Mace', damage: 16, value: 600, rarity: 'rare', minTier: 'superior' },
  // Exquisite
  { name: 'Glass Sword', damage: 14, value: 410, rarity: 'epic', minTier: 'exquisite' },
  { name: 'Ebony Bow', damage: 17, value: 1200, rarity: 'epic', minTier: 'exquisite' },
  { name: 'Ebony War Axe', damage: 15, value: 566, rarity: 'epic', minTier: 'exquisite' },
  // Legendary
  { name: 'Daedric Sword', damage: 16, value: 1250, rarity: 'legendary', minTier: 'legendary' },
  { name: 'Daedric War Axe', damage: 15, value: 1500, rarity: 'legendary', minTier: 'legendary' },
  { name: 'Dragonbone Bow', damage: 20, value: 2725, rarity: 'legendary', minTier: 'legendary' },
  { name: 'Daedric Greatsword', damage: 24, value: 2500, rarity: 'legendary', minTier: 'legendary' },
];

// Armor by tier
const ARMOR: Array<{ name: string; armor: number; value: number; rarity: LootRarity; minTier: LootTier }> = [
  // Poor/Common
  { name: 'Hide Helmet', armor: 10, value: 25, rarity: 'common', minTier: 'poor' },
  { name: 'Leather Boots', armor: 7, value: 50, rarity: 'common', minTier: 'poor' },
  { name: 'Iron Helmet', armor: 15, value: 60, rarity: 'common', minTier: 'common' },
  { name: 'Leather Armor', armor: 26, value: 125, rarity: 'common', minTier: 'common' },
  // Quality  
  { name: 'Steel Armor', armor: 31, value: 275, rarity: 'uncommon', minTier: 'quality' },
  { name: 'Scaled Helmet', armor: 14, value: 175, rarity: 'uncommon', minTier: 'quality' },
  { name: 'Elven Boots', armor: 8, value: 85, rarity: 'uncommon', minTier: 'quality' },
  // Superior
  { name: 'Elven Armor', armor: 29, value: 595, rarity: 'rare', minTier: 'superior' },
  { name: 'Glass Helmet', armor: 15, value: 450, rarity: 'rare', minTier: 'superior' },
  { name: 'Orcish Armor', armor: 40, value: 1000, rarity: 'rare', minTier: 'superior' },
  // Exquisite
  { name: 'Glass Armor', armor: 38, value: 900, rarity: 'epic', minTier: 'exquisite' },
  { name: 'Ebony Boots', armor: 16, value: 275, rarity: 'epic', minTier: 'exquisite' },
  { name: 'Ebony Shield', armor: 32, value: 750, rarity: 'epic', minTier: 'exquisite' },
  // Legendary
  { name: 'Daedric Armor', armor: 49, value: 3200, rarity: 'legendary', minTier: 'legendary' },
  { name: 'Dragonplate Helmet', armor: 22, value: 1650, rarity: 'legendary', minTier: 'legendary' },
  { name: 'Daedric Shield', armor: 36, value: 1500, rarity: 'legendary', minTier: 'legendary' },
];

// Potions
const POTIONS: Array<{ name: string; value: number; rarity: LootRarity; minTier: LootTier; description: string }> = [
  { name: 'Minor Health Potion', value: 15, rarity: 'common', minTier: 'poor', description: 'Restores 25 health' },
  { name: 'Minor Stamina Potion', value: 12, rarity: 'common', minTier: 'poor', description: 'Restores 25 stamina' },
  { name: 'Health Potion', value: 50, rarity: 'uncommon', minTier: 'common', description: 'Restores 50 health' },
  { name: 'Magicka Potion', value: 48, rarity: 'uncommon', minTier: 'common', description: 'Restores 50 magicka' },
  { name: 'Plentiful Magicka Potion', value: 150, rarity: 'rare', minTier: 'superior', description: 'Restores 100 magicka' },
  { name: 'Potion of Healing', value: 75, rarity: 'uncommon', minTier: 'quality', description: 'Restores 75 health' },
  { name: 'Plentiful Health Potion', value: 150, rarity: 'rare', minTier: 'superior', description: 'Restores 100 health' },
  { name: 'Plentiful Stamina Potion', value: 150, rarity: 'rare', minTier: 'superior', description: 'Restores 100 stamina' },
  { name: 'Potion of Fortify Smithing', value: 120, rarity: 'rare', minTier: 'superior', description: '+20% smithing for 60s' },
  { name: 'Ultimate Health Potion', value: 350, rarity: 'epic', minTier: 'exquisite', description: 'Restores 150 health' },
  { name: 'Potion of the Warrior', value: 250, rarity: 'epic', minTier: 'exquisite', description: '+40% damage for 30s' },
  { name: 'Elixir of Regeneration', value: 500, rarity: 'legendary', minTier: 'legendary', description: 'Regenerate all stats for 120s' },
];

// Spell Tomes
const SPELL_TOMES: Array<{ name: string; value: number; rarity: LootRarity; minTier: LootTier; description: string }> = [
  { name: 'Spell Tome: Flames', value: 50, rarity: 'common', minTier: 'poor', description: 'Learn Flames spell' },
  { name: 'Spell Tome: Healing', value: 45, rarity: 'common', minTier: 'poor', description: 'Learn Healing spell' },
  { name: 'Spell Tome: Firebolt', value: 105, rarity: 'uncommon', minTier: 'quality', description: 'Learn Firebolt spell' },
  { name: 'Spell Tome: Fast Healing', value: 149, rarity: 'uncommon', minTier: 'quality', description: 'Learn Fast Healing spell' },
  { name: 'Spell Tome: Fireball', value: 340, rarity: 'rare', minTier: 'superior', description: 'Learn Fireball spell' },
  { name: 'Spell Tome: Chain Lightning', value: 450, rarity: 'rare', minTier: 'superior', description: 'Learn Chain Lightning spell' },
  { name: 'Spell Tome: Incinerate', value: 670, rarity: 'epic', minTier: 'exquisite', description: 'Learn Incinerate spell' },
  { name: 'Spell Tome: Blizzard', value: 800, rarity: 'legendary', minTier: 'legendary', description: 'Learn Blizzard spell' },
  { name: 'Spell Tome: Fire Storm', value: 1200, rarity: 'legendary', minTier: 'legendary', description: 'Learn Fire Storm spell' },
];

// Enchantment prefixes for random enchanted items
const ENCHANTMENT_PREFIXES: Array<{ name: string; enchantment: string; valueMult: number; minTier: LootTier }> = [
  { name: 'of Minor Flames', enchantment: 'Fire Damage', valueMult: 1.5, minTier: 'common' },
  { name: 'of Frost', enchantment: 'Frost Damage', valueMult: 1.6, minTier: 'common' },
  { name: 'of Shock', enchantment: 'Shock Damage', valueMult: 1.7, minTier: 'quality' },
  { name: 'of Dread', enchantment: 'Fear', valueMult: 1.5, minTier: 'quality' },
  { name: 'of Fiery Souls', enchantment: 'Fire + Soul Trap', valueMult: 2.0, minTier: 'superior' },
  { name: 'of Absorbing', enchantment: 'Absorb Health', valueMult: 2.5, minTier: 'superior' },
  { name: 'of Chaos', enchantment: 'Chaos Damage', valueMult: 3.0, minTier: 'exquisite' },
  { name: 'of the Vampire', enchantment: 'Absorb Health + Stamina', valueMult: 3.5, minTier: 'legendary' },
];

// ========== HELPER FUNCTIONS ==========

const TIER_ORDER: LootTier[] = ['poor', 'common', 'quality', 'superior', 'exquisite', 'legendary'];

function tierMeetsMinimum(current: LootTier, minimum: LootTier): boolean {
  return TIER_ORDER.indexOf(current) >= TIER_ORDER.indexOf(minimum);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomFiltered<T extends { minTier: LootTier }>(arr: T[], tier: LootTier): T | null {
  const eligible = arr.filter(item => tierMeetsMinimum(tier, item.minTier));
  return eligible.length > 0 ? pickRandom(eligible) : null;
}

// ========== CHEST GENERATION ==========

export function generateTreasureChest(
  difficulty: LockDifficulty,
  location?: string,
  forceTrapped?: boolean
): TreasureChest {
  // Map lock difficulty to loot tier
  const DIFFICULTY_TO_TIER: Record<LockDifficulty, LootTier> = {
    novice: 'poor',
    apprentice: 'common',
    adept: 'quality',
    expert: 'superior',
    master: 'exquisite',
  };
  
  const baseTier = DIFFICULTY_TO_TIER[difficulty];
  // 20% chance to upgrade tier
  const tierIndex = TIER_ORDER.indexOf(baseTier);
  const upgradedIndex = Math.random() < 0.2 && tierIndex < TIER_ORDER.length - 1 ? tierIndex + 1 : tierIndex;
  const lootTier = TIER_ORDER[upgradedIndex];
  
  // Trap chance based on difficulty
  const trapChances: Record<LockDifficulty, number> = {
    novice: 0.05,
    apprentice: 0.1,
    adept: 0.2,
    expert: 0.3,
    master: 0.4,
  };
  
  const isTrapped = forceTrapped !== undefined ? forceTrapped : Math.random() < trapChances[difficulty];
  const trapTypes: TrapType[] = ['poison', 'fire', 'frost', 'shock', 'dart'];
  const trapType: TrapType = isTrapped ? pickRandom(trapTypes) : 'none';
  
  // Trap damage scales with difficulty
  const trapDamageRanges: Record<LockDifficulty, { min: number; max: number }> = {
    novice: { min: 5, max: 15 },
    apprentice: { min: 10, max: 25 },
    adept: { min: 20, max: 40 },
    expert: { min: 30, max: 60 },
    master: { min: 50, max: 100 },
  };
  const trapDamage = isTrapped ? randomBetween(trapDamageRanges[difficulty].min, trapDamageRanges[difficulty].max) : 0;
  
  // Generate loot
  const contents = generateTreasureLoot(lootTier);
  
  const chestNames: Record<LootTier, string[]> = {
    poor: ['Wooden Chest', 'Simple Container', 'Old Barrel'],
    common: ['Chest', 'Strongbox', 'Container'],
    quality: ['Ornate Chest', 'Merchant\'s Strongbox', 'Locked Chest'],
    superior: ['Royal Chest', 'Noble\'s Strongbox', 'Gilded Container'],
    exquisite: ['Ancient Chest', 'Dwemer Container', 'Dragon Priest Chest'],
    legendary: ['Legendary Hoard', 'Dragon\'s Treasure', 'Daedric Cache'],
  };
  
  return {
    id: `chest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: pickRandom(chestNames[lootTier]),
    lockDifficulty: difficulty,
    location,
    isTrapped,
    trapType,
    trapDamage,
    lootTier,
    isLooted: false,
    contents,
  };
}

function generateTreasureLoot(tier: LootTier): TreasureLoot[] {
  const loot: TreasureLoot[] = [];
  
  // Always include some gold
  const goldRange = GOLD_RANGES[tier];
  const goldAmount = randomBetween(goldRange.min, goldRange.max);
  loot.push({
    name: 'Gold',
    type: 'gold',
    quantity: goldAmount,
    value: goldAmount,
  });
  
  // Generate additional items
  const itemRange = ITEM_COUNT_RANGES[tier];
  const itemCount = randomBetween(itemRange.min, itemRange.max);
  
  for (let i = 0; i < itemCount; i++) {
    const itemType = Math.random();
    
    if (itemType < 0.15) {
      // Gem (15%)
      const gem = pickRandomFiltered(GEMS, tier);
      if (gem) {
        loot.push({
          name: gem.name,
          type: 'gem',
          quantity: 1,
          value: gem.value,
          rarity: gem.rarity,
        });
      }
    } else if (itemType < 0.30) {
      // Weapon (15%)
      const weapon = pickRandomFiltered(WEAPONS, tier);
      if (weapon) {
        // 30% chance for enchanted weapon in quality+ tiers
        const shouldEnchant = tierMeetsMinimum(tier, 'quality') && Math.random() < 0.3;
        const enchant = shouldEnchant ? pickRandomFiltered(ENCHANTMENT_PREFIXES, tier) : null;
        
        loot.push({
          name: enchant ? `${weapon.name} ${enchant.name}` : weapon.name,
          type: 'weapon',
          quantity: 1,
          value: enchant ? Math.floor(weapon.value * enchant.valueMult) : weapon.value,
          damage: weapon.damage,
          rarity: weapon.rarity,
          enchantment: enchant?.enchantment,
          enchantmentPower: enchant ? randomBetween(20, 50) : undefined,
        });
      }
    } else if (itemType < 0.45) {
      // Armor (15%)
      const armor = pickRandomFiltered(ARMOR, tier);
      if (armor) {
        loot.push({
          name: armor.name,
          type: 'apparel',
          quantity: 1,
          value: armor.value,
          armor: armor.armor,
          rarity: armor.rarity,
        });
      }
    } else if (itemType < 0.65) {
      // Potion (20%)
      const potion = pickRandomFiltered(POTIONS, tier);
      if (potion) {
        loot.push({
          name: potion.name,
          type: 'potion',
          description: potion.description,
          quantity: randomBetween(1, 2),
          value: potion.value,
          rarity: potion.rarity,
        });
      }
    } else if (itemType < 0.75 && tierMeetsMinimum(tier, 'quality')) {
      // Spell Tome (10% for quality+)
      const tome = pickRandomFiltered(SPELL_TOMES, tier);
      if (tome) {
        loot.push({
          name: tome.name,
          type: 'spell_tome',
          description: tome.description,
          quantity: 1,
          value: tome.value,
          rarity: tome.rarity,
        });
      }
    } else {
      // Misc valuable
      const miscItems = [
        { name: 'Silver Necklace', value: 60, rarity: 'common' as LootRarity },
        { name: 'Gold Ring', value: 75, rarity: 'common' as LootRarity },
        { name: 'Silver Candlestick', value: 35, rarity: 'common' as LootRarity },
        { name: 'Gold Ingot', value: 100, rarity: 'uncommon' as LootRarity },
        { name: 'Silver Ingot', value: 50, rarity: 'common' as LootRarity },
        { name: 'Jeweled Amulet', value: 200, rarity: 'rare' as LootRarity },
        { name: 'Ornate Goblet', value: 150, rarity: 'uncommon' as LootRarity },
        { name: 'Dwemer Gyro', value: 25, rarity: 'uncommon' as LootRarity },
      ];
      const misc = pickRandom(miscItems);
      loot.push({
        name: misc.name,
        type: 'misc',
        quantity: 1,
        value: misc.value,
        rarity: misc.rarity,
      });
    }
  }
  
  return loot;
}

// ========== STATE MANAGEMENT ==========

export function getInitialTreasureState(): TreasureChestState {
  return {
    discoveredChests: {},
    lootedChests: [],
    totalGoldLooted: 0,
    chestsOpened: 0,
    legendaryItemsFound: 0,
  };
}

export function discoverChest(
  state: TreasureChestState,
  difficulty: LockDifficulty,
  location?: string
): { newState: TreasureChestState; chest: TreasureChest } {
  const chest = generateTreasureChest(difficulty, location);
  
  return {
    newState: {
      ...state,
      discoveredChests: {
        ...state.discoveredChests,
        [chest.id]: chest,
      },
    },
    chest,
  };
}

export function lootChest(
  state: TreasureChestState,
  chestId: string
): { success: boolean; newState: TreasureChestState; loot: TreasureLoot[]; trapTriggered?: { type: TrapType; damage: number }; message: string } {
  const chest = state.discoveredChests[chestId];
  if (!chest) {
    return { success: false, newState: state, loot: [], message: 'Chest not found' };
  }
  
  if (chest.isLooted) {
    return { success: false, newState: state, loot: [], message: 'This chest has already been looted' };
  }
  
  // Calculate stats
  const goldLooted = chest.contents.filter(c => c.type === 'gold').reduce((sum, c) => sum + c.quantity, 0);
  const legendaryFound = chest.contents.filter(c => c.rarity === 'legendary').length;
  
  // Check for trap
  let trapTriggered: { type: TrapType; damage: number } | undefined;
  if (chest.isTrapped && chest.trapType !== 'none') {
    trapTriggered = { type: chest.trapType!, damage: chest.trapDamage || 0 };
  }
  
  // Update chest and state
  const updatedChest = { ...chest, isLooted: true };
  
  return {
    success: true,
    newState: {
      ...state,
      discoveredChests: {
        ...state.discoveredChests,
        [chestId]: updatedChest,
      },
      lootedChests: [...state.lootedChests, chestId],
      totalGoldLooted: state.totalGoldLooted + goldLooted,
      chestsOpened: state.chestsOpened + 1,
      legendaryItemsFound: state.legendaryItemsFound + legendaryFound,
    },
    loot: chest.contents,
    trapTriggered,
    message: trapTriggered 
      ? `Opened ${chest.name}! A ${trapTriggered.type} trap triggered for ${trapTriggered.damage} damage!`
      : `Opened ${chest.name}!`,
  };
}

export function convertLootToInventoryItems(
  loot: TreasureLoot[],
  characterId: string
): { items: InventoryItem[]; gold: number } {
  let gold = 0;
  const items: InventoryItem[] = [];
  
  for (const item of loot) {
    if (item.type === 'gold') {
      gold += item.quantity;
    } else {
      items.push({
        id: `loot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        characterId,
        name: item.name,
        type: item.type as any,
        description: item.description || '',
        quantity: item.quantity,
        value: item.value,
        weight: 1,
        equipped: false,
        rarity: item.rarity,
        damage: item.damage,
        armor: item.armor,
        enchantment: item.enchantment,
        enchantmentPower: item.enchantmentPower,
      } as InventoryItem);
    }
  }
  
  return { items, gold };
}

// ========== UNIQUE TREASURES ==========

export interface UniqueTreasure {
  id: string;
  name: string;
  type: 'weapon' | 'apparel' | 'misc';
  description: string;
  value: number;
  rarity: LootRarity;
  damage?: number;
  armor?: number;
  enchantment?: string;
  enchantmentPower?: number;
  lore?: string;
}

export const UNIQUE_TREASURES: Record<string, UniqueTreasure> = {
  // Unique Weapons
  auriel_bow: {
    id: 'auriel_bow',
    name: "Auriel's Bow",
    type: 'weapon',
    description: 'An ancient bow of immense power, blessed by Auri-El.',
    value: 5000,
    rarity: 'legendary',
    damage: 25,
    enchantment: 'Sun Damage',
    enchantmentPower: 60,
    lore: 'Said to have been wielded by the god Auri-El himself during the Dawn Era.',
  },
  chillrend: {
    id: 'chillrend',
    name: 'Chillrend',
    type: 'weapon',
    description: 'An enchanted glass sword that freezes enemies.',
    value: 3500,
    rarity: 'legendary',
    damage: 18,
    enchantment: 'Frost Damage + Paralyze',
    enchantmentPower: 45,
    lore: 'Once wielded by the Thieves Guild\'s notorious fence.',
  },
  dawnbreaker: {
    id: 'dawnbreaker',
    name: 'Dawnbreaker',
    type: 'weapon',
    description: 'A Daedric artifact blessed by Meridia to destroy the undead.',
    value: 4000,
    rarity: 'legendary',
    damage: 16,
    enchantment: 'Burns for 25 points, chance to cause fiery explosion',
    enchantmentPower: 50,
    lore: 'Bestowed upon worthy mortals by the Daedric Prince Meridia.',
  },
  // Unique Armor
  ebony_mail: {
    id: 'ebony_mail',
    name: 'Ebony Mail',
    type: 'apparel',
    description: 'Heavy armor that cloaks wearer in shadow and poison.',
    value: 5000,
    rarity: 'legendary',
    armor: 45,
    enchantment: 'Muffle + Poison Cloak',
    enchantmentPower: 40,
    lore: 'A gift from Boethiah to her champions.',
  },
  miraak_robes: {
    id: 'miraak_robes',
    name: 'Robes of Miraak',
    type: 'apparel',
    description: 'The robes of the First Dragonborn.',
    value: 3000,
    rarity: 'legendary',
    armor: 15,
    enchantment: '+100 Magicka, absorb 15% magicka from dragon breath',
    enchantmentPower: 55,
    lore: 'Worn by Miraak for millennia in Apocrypha.',
  },
  // Unique Misc
  elder_scroll: {
    id: 'elder_scroll',
    name: 'Elder Scroll',
    type: 'misc',
    description: 'An artifact of immense power and unknowable knowledge.',
    value: 10000,
    rarity: 'legendary',
    lore: 'The Elder Scrolls are fragments of creation itself, their knowledge drives mortals mad.',
  },
  skeleton_key: {
    id: 'skeleton_key',
    name: 'Skeleton Key',
    type: 'misc',
    description: 'An unbreakable lockpick that opens any lock.',
    value: 5000,
    rarity: 'legendary',
    lore: 'A Daedric artifact of Nocturnal, prized by thieves across Tamriel.',
  },
};
