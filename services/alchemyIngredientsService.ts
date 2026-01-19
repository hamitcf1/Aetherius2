/**
 * Alchemy Ingredients Service
 * Comprehensive alchemy system with ingredients, effects, and potion crafting
 */

import { LootRarity, InventoryItem } from '../types';

// ========== TYPES ==========

export type AlchemyEffectType = 
  | 'restore_health' | 'restore_magicka' | 'restore_stamina'
  | 'fortify_health' | 'fortify_magicka' | 'fortify_stamina'
  | 'damage_health' | 'damage_magicka' | 'damage_stamina'
  | 'fortify_one_handed' | 'fortify_two_handed' | 'fortify_archery'
  | 'fortify_block' | 'fortify_heavy_armor' | 'fortify_light_armor'
  | 'fortify_sneak' | 'fortify_lockpicking' | 'fortify_pickpocket'
  | 'fortify_destruction' | 'fortify_conjuration' | 'fortify_restoration'
  | 'fortify_alteration' | 'fortify_illusion' | 'fortify_enchanting'
  | 'fortify_smithing' | 'fortify_alchemy' | 'fortify_speech'
  | 'fortify_carry_weight' | 'fortify_barter'
  | 'resist_fire' | 'resist_frost' | 'resist_shock' | 'resist_poison' | 'resist_magic'
  | 'weakness_fire' | 'weakness_frost' | 'weakness_shock' | 'weakness_poison' | 'weakness_magic'
  | 'regenerate_health' | 'regenerate_magicka' | 'regenerate_stamina'
  | 'invisibility' | 'paralysis' | 'slow' | 'frenzy' | 'fear' | 'fury'
  | 'cure_disease' | 'cure_poison' | 'waterbreathing';

export interface AlchemyEffect {
  type: AlchemyEffectType;
  name: string;
  description: string;
  magnitude: number; // Effect strength
  duration: number; // In seconds
  value: number; // Gold value contribution
  isPositive: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  description: string;
  rarity: LootRarity;
  baseValue: number;
  weight: number;
  effects: [AlchemyEffectType, AlchemyEffectType, AlchemyEffectType, AlchemyEffectType];
  locations: string[];
  harvestable: boolean;
}

export interface CraftedPotion {
  id: string;
  name: string;
  description: string;
  effects: AlchemyEffect[];
  value: number;
  weight: number;
  ingredients: string[];
  potionType: 'potion' | 'poison';
  rarity: LootRarity;
}

export interface AlchemyState {
  knownIngredients: Record<string, number[]>; // ingredient id -> array of known effect indices (0-3)
  discoveredRecipes: Array<{ ingredients: string[]; effects: AlchemyEffectType[] }>;
  potionsCrafted: number;
  poisonsCrafted: number;
  ingredientsUsed: number;
}

// ========== EFFECT DEFINITIONS ==========

export const ALCHEMY_EFFECTS: Record<AlchemyEffectType, Omit<AlchemyEffect, 'type'>> = {
  restore_health: { name: 'Restore Health', description: 'Restores health points', magnitude: 50, duration: 0, value: 21, isPositive: true },
  restore_magicka: { name: 'Restore Magicka', description: 'Restores magicka points', magnitude: 50, duration: 0, value: 25, isPositive: true },
  restore_stamina: { name: 'Restore Stamina', description: 'Restores stamina points', magnitude: 50, duration: 0, value: 25, isPositive: true },
  
  fortify_health: { name: 'Fortify Health', description: 'Increases maximum health', magnitude: 20, duration: 60, value: 82, isPositive: true },
  fortify_magicka: { name: 'Fortify Magicka', description: 'Increases maximum magicka', magnitude: 20, duration: 60, value: 78, isPositive: true },
  fortify_stamina: { name: 'Fortify Stamina', description: 'Increases maximum stamina', magnitude: 20, duration: 60, value: 71, isPositive: true },
  
  damage_health: { name: 'Damage Health', description: 'Causes health damage', magnitude: 15, duration: 0, value: 51, isPositive: false },
  damage_magicka: { name: 'Damage Magicka', description: 'Drains magicka', magnitude: 20, duration: 0, value: 52, isPositive: false },
  damage_stamina: { name: 'Damage Stamina', description: 'Drains stamina', magnitude: 20, duration: 0, value: 30, isPositive: false },
  
  fortify_one_handed: { name: 'Fortify One-Handed', description: 'One-handed attacks do more damage', magnitude: 20, duration: 60, value: 118, isPositive: true },
  fortify_two_handed: { name: 'Fortify Two-Handed', description: 'Two-handed attacks do more damage', magnitude: 20, duration: 60, value: 118, isPositive: true },
  fortify_archery: { name: 'Fortify Archery', description: 'Bows do more damage', magnitude: 20, duration: 60, value: 118, isPositive: true },
  fortify_block: { name: 'Fortify Block', description: 'Blocking absorbs more damage', magnitude: 20, duration: 60, value: 118, isPositive: true },
  fortify_heavy_armor: { name: 'Fortify Heavy Armor', description: 'Heavy armor rating increased', magnitude: 20, duration: 60, value: 118, isPositive: true },
  fortify_light_armor: { name: 'Fortify Light Armor', description: 'Light armor rating increased', magnitude: 20, duration: 60, value: 118, isPositive: true },
  
  fortify_sneak: { name: 'Fortify Sneak', description: 'Sneaking is more effective', magnitude: 20, duration: 60, value: 118, isPositive: true },
  fortify_lockpicking: { name: 'Fortify Lockpicking', description: 'Lockpicking is easier', magnitude: 20, duration: 60, value: 118, isPositive: true },
  fortify_pickpocket: { name: 'Fortify Pickpocket', description: 'Pickpocket chance increased', magnitude: 20, duration: 60, value: 118, isPositive: true },
  
  fortify_destruction: { name: 'Fortify Destruction', description: 'Destruction spells cost less', magnitude: 15, duration: 60, value: 151, isPositive: true },
  fortify_conjuration: { name: 'Fortify Conjuration', description: 'Conjuration spells cost less', magnitude: 15, duration: 60, value: 151, isPositive: true },
  fortify_restoration: { name: 'Fortify Restoration', description: 'Restoration spells cost less', magnitude: 15, duration: 60, value: 151, isPositive: true },
  fortify_alteration: { name: 'Fortify Alteration', description: 'Alteration spells cost less', magnitude: 15, duration: 60, value: 151, isPositive: true },
  fortify_illusion: { name: 'Fortify Illusion', description: 'Illusion spells cost less', magnitude: 15, duration: 60, value: 151, isPositive: true },
  
  fortify_enchanting: { name: 'Fortify Enchanting', description: 'Enchantments are stronger', magnitude: 10, duration: 30, value: 14, isPositive: true },
  fortify_smithing: { name: 'Fortify Smithing', description: 'Smithing improvements are better', magnitude: 20, duration: 30, value: 82, isPositive: true },
  fortify_alchemy: { name: 'Fortify Alchemy', description: 'Created potions are stronger', magnitude: 10, duration: 30, value: 25, isPositive: true },
  fortify_speech: { name: 'Fortify Speech', description: 'Prices are better', magnitude: 20, duration: 60, value: 118, isPositive: true },
  
  fortify_carry_weight: { name: 'Fortify Carry Weight', description: 'Carry weight increased', magnitude: 50, duration: 300, value: 208, isPositive: true },
  fortify_barter: { name: 'Fortify Barter', description: 'Buying and selling prices improved', magnitude: 10, duration: 30, value: 48, isPositive: true },
  
  resist_fire: { name: 'Resist Fire', description: 'Reduces fire damage', magnitude: 30, duration: 60, value: 86, isPositive: true },
  resist_frost: { name: 'Resist Frost', description: 'Reduces frost damage', magnitude: 30, duration: 60, value: 86, isPositive: true },
  resist_shock: { name: 'Resist Shock', description: 'Reduces shock damage', magnitude: 30, duration: 60, value: 86, isPositive: true },
  resist_poison: { name: 'Resist Poison', description: 'Reduces poison damage', magnitude: 30, duration: 60, value: 86, isPositive: true },
  resist_magic: { name: 'Resist Magic', description: 'Reduces magic damage', magnitude: 15, duration: 60, value: 51, isPositive: true },
  
  weakness_fire: { name: 'Weakness to Fire', description: 'Increases fire damage taken', magnitude: 25, duration: 30, value: 24, isPositive: false },
  weakness_frost: { name: 'Weakness to Frost', description: 'Increases frost damage taken', magnitude: 25, duration: 30, value: 24, isPositive: false },
  weakness_shock: { name: 'Weakness to Shock', description: 'Increases shock damage taken', magnitude: 25, duration: 30, value: 24, isPositive: false },
  weakness_poison: { name: 'Weakness to Poison', description: 'Increases poison damage taken', magnitude: 25, duration: 30, value: 24, isPositive: false },
  weakness_magic: { name: 'Weakness to Magic', description: 'Increases magic damage taken', magnitude: 15, duration: 30, value: 51, isPositive: false },
  
  regenerate_health: { name: 'Regenerate Health', description: 'Health regenerates faster', magnitude: 20, duration: 300, value: 177, isPositive: true },
  regenerate_magicka: { name: 'Regenerate Magicka', description: 'Magicka regenerates faster', magnitude: 20, duration: 300, value: 177, isPositive: true },
  regenerate_stamina: { name: 'Regenerate Stamina', description: 'Stamina regenerates faster', magnitude: 20, duration: 300, value: 177, isPositive: true },
  
  invisibility: { name: 'Invisibility', description: 'Become invisible for the duration', magnitude: 100, duration: 30, value: 261, isPositive: true },
  paralysis: { name: 'Paralysis', description: 'Target is paralyzed', magnitude: 100, duration: 5, value: 285, isPositive: false },
  slow: { name: 'Slow', description: 'Target moves slower', magnitude: 50, duration: 10, value: 247, isPositive: false },
  frenzy: { name: 'Frenzy', description: 'Target attacks anyone nearby', magnitude: 10, duration: 30, value: 52, isPositive: false },
  fear: { name: 'Fear', description: 'Target flees from combat', magnitude: 10, duration: 30, value: 52, isPositive: false },
  fury: { name: 'Fury', description: 'Creatures and people attack on sight', magnitude: 10, duration: 30, value: 52, isPositive: false },
  
  cure_disease: { name: 'Cure Disease', description: 'Cures all diseases', magnitude: 100, duration: 0, value: 21, isPositive: true },
  cure_poison: { name: 'Cure Poison', description: 'Cures poison effects', magnitude: 100, duration: 0, value: 21, isPositive: true },
  waterbreathing: { name: 'Waterbreathing', description: 'Breathe underwater', magnitude: 100, duration: 60, value: 100, isPositive: true },
};

// ========== INGREDIENT DATABASE ==========

export const INGREDIENTS: Record<string, Ingredient> = {
  // Common Ingredients (flowers, plants)
  blue_mountain_flower: {
    id: 'blue_mountain_flower',
    name: 'Blue Mountain Flower',
    description: 'A common flower found throughout Skyrim.',
    rarity: 'common',
    baseValue: 2,
    weight: 0.1,
    effects: ['restore_health', 'fortify_conjuration', 'fortify_health', 'damage_magicka'],
    locations: ['Whiterun Plains', 'Rift', 'Reach'],
    harvestable: true,
  },
  red_mountain_flower: {
    id: 'red_mountain_flower',
    name: 'Red Mountain Flower',
    description: 'A vibrant red flower found in the wilds.',
    rarity: 'common',
    baseValue: 2,
    weight: 0.1,
    effects: ['restore_magicka', 'fortify_magicka', 'damage_health', 'restore_health'],
    locations: ['Whiterun Plains', 'Falkreath', 'Rift'],
    harvestable: true,
  },
  purple_mountain_flower: {
    id: 'purple_mountain_flower',
    name: 'Purple Mountain Flower',
    description: 'A purple flower with medicinal properties.',
    rarity: 'common',
    baseValue: 2,
    weight: 0.1,
    effects: ['restore_stamina', 'fortify_sneak', 'fortify_stamina', 'resist_frost'],
    locations: ['Reach', 'Haafingar', 'Pale'],
    harvestable: true,
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender',
    description: 'A fragrant purple flower.',
    rarity: 'common',
    baseValue: 1,
    weight: 0.1,
    effects: ['resist_magic', 'fortify_stamina', 'regenerate_stamina', 'fortify_conjuration'],
    locations: ['Whiterun', 'Falkreath', 'Rift'],
    harvestable: true,
  },
  deathbell: {
    id: 'deathbell',
    name: 'Deathbell',
    description: 'A poisonous flower that thrives near water.',
    rarity: 'uncommon',
    baseValue: 4,
    weight: 0.1,
    effects: ['damage_health', 'weakness_poison', 'slow', 'fortify_alchemy'],
    locations: ['Morthal Swamps', 'Solitude Docks'],
    harvestable: true,
  },
  nightshade: {
    id: 'nightshade',
    name: 'Nightshade',
    description: 'A deadly plant favored by assassins.',
    rarity: 'uncommon',
    baseValue: 8,
    weight: 0.1,
    effects: ['damage_health', 'damage_magicka', 'fortify_destruction', 'slow'],
    locations: ['Riften', 'Falkreath', 'Reach'],
    harvestable: true,
  },
  
  // Mushrooms
  blisterwort: {
    id: 'blisterwort',
    name: 'Blisterwort',
    description: 'A fungus found in caves.',
    rarity: 'common',
    baseValue: 3,
    weight: 0.2,
    effects: ['damage_stamina', 'restore_health', 'fortify_smithing', 'frenzy'],
    locations: ['Caves', 'Mines', 'Dungeons'],
    harvestable: true,
  },
  fly_amanita: {
    id: 'fly_amanita',
    name: 'Fly Amanita',
    description: 'A spotted red mushroom.',
    rarity: 'common',
    baseValue: 2,
    weight: 0.1,
    effects: ['resist_fire', 'fortify_two_handed', 'frenzy', 'regenerate_stamina'],
    locations: ['Pine Forests', 'Rift', 'Falkreath'],
    harvestable: true,
  },
  mora_tapinella: {
    id: 'mora_tapinella',
    name: 'Mora Tapinella',
    description: 'A mushroom that grows on fallen trees.',
    rarity: 'common',
    baseValue: 4,
    weight: 0.2,
    effects: ['restore_magicka', 'fortify_illusion', 'regenerate_stamina', 'fortify_magicka'],
    locations: ['Forests', 'Dead Trees'],
    harvestable: true,
  },
  imp_stool: {
    id: 'imp_stool',
    name: 'Imp Stool',
    description: 'A common fungus found in caves.',
    rarity: 'common',
    baseValue: 3,
    weight: 0.2,
    effects: ['damage_health', 'paralysis', 'fortify_lockpicking', 'restore_health'],
    locations: ['Caves', 'Dungeons'],
    harvestable: true,
  },
  namiras_rot: {
    id: 'namiras_rot',
    name: "Namira's Rot",
    description: 'A foul-smelling fungus sacred to Namira.',
    rarity: 'uncommon',
    baseValue: 5,
    weight: 0.2,
    effects: ['damage_magicka', 'fear', 'fortify_lockpicking', 'regenerate_health'],
    locations: ['Caves', 'Dungeons', 'Sewers'],
    harvestable: true,
  },
  
  // Creature Parts
  skeever_tail: {
    id: 'skeever_tail',
    name: 'Skeever Tail',
    description: 'The tail of a skeever.',
    rarity: 'common',
    baseValue: 3,
    weight: 0.2,
    effects: ['damage_stamina', 'damage_health', 'fortify_light_armor', 'restore_stamina'],
    locations: ['Dungeons', 'Sewers', 'Caves'],
    harvestable: false,
  },
  mudcrab_chitin: {
    id: 'mudcrab_chitin',
    name: 'Mudcrab Chitin',
    description: 'The shell of a mudcrab.',
    rarity: 'common',
    baseValue: 2,
    weight: 0.25,
    effects: ['restore_stamina', 'cure_disease', 'resist_poison', 'resist_fire'],
    locations: ['Rivers', 'Lakes', 'Coasts'],
    harvestable: false,
  },
  spider_egg: {
    id: 'spider_egg',
    name: 'Spider Egg',
    description: 'An egg from a Frostbite Spider.',
    rarity: 'common',
    baseValue: 5,
    weight: 0.2,
    effects: ['damage_stamina', 'damage_magicka', 'fortify_lockpicking', 'fortify_archery'],
    locations: ['Spider Nests', 'Caves'],
    harvestable: false,
  },
  chaurus_eggs: {
    id: 'chaurus_eggs',
    name: 'Chaurus Eggs',
    description: 'Eggs from the deadly Chaurus.',
    rarity: 'uncommon',
    baseValue: 10,
    weight: 0.2,
    effects: ['weakness_poison', 'fortify_stamina', 'damage_magicka', 'invisibility'],
    locations: ['Falmer Caves', 'Blackreach'],
    harvestable: false,
  },
  giant_toe: {
    id: 'giant_toe',
    name: "Giant's Toe",
    description: 'The toe of a giant.',
    rarity: 'uncommon',
    baseValue: 20,
    weight: 1.0,
    effects: ['damage_stamina', 'fortify_health', 'fortify_carry_weight', 'damage_health'],
    locations: ['Giant Camps'],
    harvestable: false,
  },
  dragon_tongue: {
    id: 'dragon_tongue',
    name: 'Dragon Tongue',
    description: 'A rare plant, not from an actual dragon.',
    rarity: 'rare',
    baseValue: 5,
    weight: 0.1,
    effects: ['resist_fire', 'fortify_barter', 'fortify_illusion', 'fortify_two_handed'],
    locations: ['Volcanic Tundra', 'Eastmarch'],
    harvestable: true,
  },
  
  // Rare Ingredients
  crimson_nirnroot: {
    id: 'crimson_nirnroot',
    name: 'Crimson Nirnroot',
    description: 'An extremely rare red variety of Nirnroot found only in Blackreach.',
    rarity: 'legendary',
    baseValue: 50,
    weight: 0.2,
    effects: ['damage_health', 'damage_stamina', 'invisibility', 'resist_magic'],
    locations: ['Blackreach'],
    harvestable: true,
  },
  nirnroot: {
    id: 'nirnroot',
    name: 'Nirnroot',
    description: 'A glowing plant that hums near water.',
    rarity: 'rare',
    baseValue: 10,
    weight: 0.2,
    effects: ['damage_health', 'damage_stamina', 'invisibility', 'resist_magic'],
    locations: ['Rivers', 'Lakes', 'Ponds'],
    harvestable: true,
  },
  daedra_heart: {
    id: 'daedra_heart',
    name: 'Daedra Heart',
    description: 'The heart of a Daedra. Extremely valuable for alchemy.',
    rarity: 'legendary',
    baseValue: 250,
    weight: 0.5,
    effects: ['restore_health', 'damage_stamina', 'damage_magicka', 'fear'],
    locations: ['Daedric Shrines', 'Oblivion Gates'],
    harvestable: false,
  },
  human_heart: {
    id: 'human_heart',
    name: 'Human Heart',
    description: 'A human heart. Dark magic ingredient.',
    rarity: 'epic',
    baseValue: 10,
    weight: 1.0,
    effects: ['damage_health', 'damage_magicka', 'frenzy', 'paralysis'],
    locations: ['Dark Brotherhood', 'Necromancer Lairs'],
    harvestable: false,
  },
  vampire_dust: {
    id: 'vampire_dust',
    name: 'Vampire Dust',
    description: 'The remains of a destroyed vampire.',
    rarity: 'epic',
    baseValue: 25,
    weight: 0.2,
    effects: ['invisibility', 'restore_magicka', 'regenerate_health', 'cure_disease'],
    locations: ['Vampire Lairs', 'Random Encounters'],
    harvestable: false,
  },
  frost_salts: {
    id: 'frost_salts',
    name: 'Frost Salts',
    description: 'Essence left by a frost atronach.',
    rarity: 'uncommon',
    baseValue: 100,
    weight: 0.25,
    effects: ['weakness_fire', 'resist_frost', 'restore_magicka', 'fortify_conjuration'],
    locations: ['Frost Atronachs', 'Alchemy Shops'],
    harvestable: false,
  },
  fire_salts: {
    id: 'fire_salts',
    name: 'Fire Salts',
    description: 'Essence left by a flame atronach.',
    rarity: 'uncommon',
    baseValue: 50,
    weight: 0.25,
    effects: ['weakness_frost', 'resist_fire', 'restore_magicka', 'regenerate_magicka'],
    locations: ['Flame Atronachs', 'Alchemy Shops'],
    harvestable: false,
  },
  void_salts: {
    id: 'void_salts',
    name: 'Void Salts',
    description: 'Essence left by a storm atronach.',
    rarity: 'epic',
    baseValue: 125,
    weight: 0.25,
    effects: ['weakness_shock', 'resist_shock', 'damage_health', 'fortify_magicka'],
    locations: ['Storm Atronachs', 'College of Winterhold'],
    harvestable: false,
  },
  
  // Berries and Fruits
  juniper_berries: {
    id: 'juniper_berries',
    name: 'Juniper Berries',
    description: 'Small berries from a juniper tree.',
    rarity: 'common',
    baseValue: 1,
    weight: 0.1,
    effects: ['weakness_fire', 'fortify_archery', 'regenerate_health', 'damage_stamina'],
    locations: ['Reach', 'Falkreath'],
    harvestable: true,
  },
  snowberries: {
    id: 'snowberries',
    name: 'Snowberries',
    description: 'Cold-resistant berries found in snowy regions.',
    rarity: 'common',
    baseValue: 4,
    weight: 0.1,
    effects: ['resist_fire', 'fortify_enchanting', 'resist_frost', 'resist_shock'],
    locations: ['Snowy Mountains', 'Winterhold'],
    harvestable: true,
  },
  jazbay_grapes: {
    id: 'jazbay_grapes',
    name: 'Jazbay Grapes',
    description: 'Rare grapes found in volcanic regions.',
    rarity: 'uncommon',
    baseValue: 5,
    weight: 0.2,
    effects: ['weakness_magic', 'fortify_magicka', 'regenerate_magicka', 'restore_magicka'],
    locations: ['Eastmarch Hot Springs'],
    harvestable: true,
  },
  
  // Misc Ingredients
  salt_pile: {
    id: 'salt_pile',
    name: 'Salt Pile',
    description: 'Common cooking salt, also useful for alchemy.',
    rarity: 'common',
    baseValue: 2,
    weight: 0.2,
    effects: ['weakness_magic', 'fortify_restoration', 'slow', 'regenerate_magicka'],
    locations: ['Shops', 'Kitchens', 'Barrels'],
    harvestable: false,
  },
  honeycomb: {
    id: 'honeycomb',
    name: 'Honeycomb',
    description: 'Sweet honeycomb from a beehive.',
    rarity: 'uncommon',
    baseValue: 5,
    weight: 0.5,
    effects: ['restore_stamina', 'fortify_block', 'fortify_light_armor', 'restore_stamina'],
    locations: ['Beehives', 'Apiaries'],
    harvestable: true,
  },
  bee: {
    id: 'bee',
    name: 'Bee',
    description: 'A live bee, surprisingly useful in potions.',
    rarity: 'common',
    baseValue: 3,
    weight: 0.1,
    effects: ['restore_stamina', 'regenerate_stamina', 'weakness_shock', 'fortify_stamina'],
    locations: ['Beehives', 'Meadows'],
    harvestable: true,
  },
  bone_meal: {
    id: 'bone_meal',
    name: 'Bone Meal',
    description: 'Ground bones, common ingredient.',
    rarity: 'common',
    baseValue: 5,
    weight: 0.5,
    effects: ['damage_stamina', 'resist_fire', 'fortify_conjuration', 'restore_stamina'],
    locations: ['Skeletons', 'Draugr', 'Crypts'],
    harvestable: false,
  },
  ectoplasm: {
    id: 'ectoplasm',
    name: 'Ectoplasm',
    description: 'Spectral residue from a ghost.',
    rarity: 'uncommon',
    baseValue: 25,
    weight: 0.1,
    effects: ['restore_magicka', 'fortify_destruction', 'fortify_magicka', 'damage_health'],
    locations: ['Ghosts', 'Haunted Locations'],
    harvestable: false,
  },
  troll_fat: {
    id: 'troll_fat',
    name: 'Troll Fat',
    description: 'Fat rendered from a troll.',
    rarity: 'common',
    baseValue: 15,
    weight: 1.0,
    effects: ['resist_poison', 'fortify_two_handed', 'frenzy', 'damage_health'],
    locations: ['Trolls', 'Caves'],
    harvestable: false,
  },
};

// ========== ALCHEMY FUNCTIONS ==========

export function getInitialAlchemyState(): AlchemyState {
  return {
    knownIngredients: {},
    discoveredRecipes: [],
    potionsCrafted: 0,
    poisonsCrafted: 0,
    ingredientsUsed: 0,
  };
}

export function eatIngredient(
  state: AlchemyState,
  ingredientId: string
): { newState: AlchemyState; discoveredEffect: AlchemyEffectType | null; message: string } {
  const ingredient = INGREDIENTS[ingredientId];
  if (!ingredient) {
    return { newState: state, discoveredEffect: null, message: 'Unknown ingredient.' };
  }
  
  const knownEffects = state.knownIngredients[ingredientId] || [];
  if (knownEffects.length === 0) {
    // Discover first effect
    const firstEffect = ingredient.effects[0];
    return {
      newState: {
        ...state,
        knownIngredients: {
          ...state.knownIngredients,
          [ingredientId]: [0],
        },
      },
      discoveredEffect: firstEffect,
      message: `You discovered that ${ingredient.name} has the effect: ${ALCHEMY_EFFECTS[firstEffect].name}`,
    };
  }
  
  return { newState: state, discoveredEffect: null, message: `You eat the ${ingredient.name} but learn nothing new.` };
}

export function findMatchingEffects(ingredient1: Ingredient, ingredient2: Ingredient): AlchemyEffectType[] {
  const matches: AlchemyEffectType[] = [];
  for (const effect of ingredient1.effects) {
    if (ingredient2.effects.includes(effect)) {
      matches.push(effect);
    }
  }
  return matches;
}

export function canCraftPotion(
  ingredient1Id: string,
  ingredient2Id: string,
  ingredient3Id?: string
): boolean {
  const ing1 = INGREDIENTS[ingredient1Id];
  const ing2 = INGREDIENTS[ingredient2Id];
  const ing3 = ingredient3Id ? INGREDIENTS[ingredient3Id] : undefined;
  
  if (!ing1 || !ing2) return false;
  
  // Check for matching effects between any two ingredients
  let hasMatch = findMatchingEffects(ing1, ing2).length > 0;
  
  if (ing3) {
    hasMatch = hasMatch || findMatchingEffects(ing1, ing3).length > 0;
    hasMatch = hasMatch || findMatchingEffects(ing2, ing3).length > 0;
  }
  
  return hasMatch;
}

export function craftPotion(
  state: AlchemyState,
  ingredientIds: string[],
  alchemySkill: number = 15,
  perks: string[] = []
): { success: boolean; newState: AlchemyState; potion: CraftedPotion | null; message: string } {
  if (ingredientIds.length < 2 || ingredientIds.length > 3) {
    return { success: false, newState: state, potion: null, message: 'You need 2 or 3 ingredients to craft a potion.' };
  }
  
  const ingredients = ingredientIds.map(id => INGREDIENTS[id]).filter(Boolean);
  if (ingredients.length !== ingredientIds.length) {
    return { success: false, newState: state, potion: null, message: 'One or more ingredients not found.' };
  }
  
  // Find all matching effects
  const allEffects = new Set<AlchemyEffectType>();
  
  for (let i = 0; i < ingredients.length; i++) {
    for (let j = i + 1; j < ingredients.length; j++) {
      const matches = findMatchingEffects(ingredients[i], ingredients[j]);
      matches.forEach(e => allEffects.add(e));
    }
  }
  
  if (allEffects.size === 0) {
    return { success: false, newState: state, potion: null, message: 'These ingredients have no matching effects.' };
  }
  
  // Calculate effect strength multiplier based on skill
  const skillMultiplier = 1 + (alchemySkill - 15) * 0.015;
  const perkMultiplier = perks.includes('alchemist_5') ? 2.0 : 
                         perks.includes('alchemist_4') ? 1.8 :
                         perks.includes('alchemist_3') ? 1.6 :
                         perks.includes('alchemist_2') ? 1.4 :
                         perks.includes('alchemist_1') ? 1.2 : 1.0;
  
  const totalMultiplier = skillMultiplier * perkMultiplier;
  
  // Build potion effects
  const potionEffects: AlchemyEffect[] = Array.from(allEffects).map(effectType => {
    const baseEffect = ALCHEMY_EFFECTS[effectType];
    return {
      type: effectType,
      name: baseEffect.name,
      description: baseEffect.description,
      magnitude: Math.round(baseEffect.magnitude * totalMultiplier),
      duration: baseEffect.duration > 0 ? Math.round(baseEffect.duration * totalMultiplier) : 0,
      value: Math.round(baseEffect.value * totalMultiplier),
      isPositive: baseEffect.isPositive,
    };
  });
  
  // Determine if it's a potion or poison
  const positiveEffects = potionEffects.filter(e => e.isPositive);
  const negativeEffects = potionEffects.filter(e => !e.isPositive);
  const isPoisonType = negativeEffects.length > positiveEffects.length;
  
  // Calculate total value
  const totalValue = potionEffects.reduce((sum, e) => sum + e.value, 0);
  
  // Determine rarity based on effects and ingredients
  let rarity: LootRarity = 'common';
  if (ingredients.some(i => i.rarity === 'legendary') || totalValue > 500) rarity = 'legendary';
  else if (ingredients.some(i => i.rarity === 'epic') || totalValue > 300) rarity = 'epic';
  else if (ingredients.some(i => i.rarity === 'rare') || totalValue > 150) rarity = 'rare';
  else if (totalValue > 75) rarity = 'uncommon';
  
  // Generate potion name
  const primaryEffect = potionEffects[0];
  const prefix = isPoisonType ? 'Poison of' : 'Potion of';
  const potionName = `${prefix} ${primaryEffect.name}`;
  
  const potion: CraftedPotion = {
    id: `potion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: potionName,
    description: potionEffects.map(e => `${e.name}: ${e.magnitude}${e.duration > 0 ? ` for ${e.duration}s` : ''}`).join(', '),
    effects: potionEffects,
    value: totalValue,
    weight: 0.5,
    ingredients: ingredientIds,
    potionType: isPoisonType ? 'poison' : 'potion',
    rarity,
  };
  
  // Update discovered effects
  const newKnownIngredients = { ...state.knownIngredients };
  for (const ingredient of ingredients) {
    const known = newKnownIngredients[ingredient.id] || [];
    const newKnown = [...known];
    
    for (const effect of potionEffects) {
      const effectIndex = ingredient.effects.indexOf(effect.type);
      if (effectIndex !== -1 && !newKnown.includes(effectIndex)) {
        newKnown.push(effectIndex);
      }
    }
    
    newKnownIngredients[ingredient.id] = newKnown;
  }
  
  return {
    success: true,
    newState: {
      ...state,
      knownIngredients: newKnownIngredients,
      discoveredRecipes: [
        ...state.discoveredRecipes,
        { ingredients: ingredientIds, effects: Array.from(allEffects) },
      ],
      potionsCrafted: isPoisonType ? state.potionsCrafted : state.potionsCrafted + 1,
      poisonsCrafted: isPoisonType ? state.poisonsCrafted + 1 : state.poisonsCrafted,
      ingredientsUsed: state.ingredientsUsed + ingredientIds.length,
    },
    potion,
    message: `You created a ${potion.name}!`,
  };
}

export function potionToInventoryItem(potion: CraftedPotion): InventoryItem {
  return {
    id: potion.id,
    name: potion.name,
    type: potion.potionType === 'poison' ? 'potion' : 'potion',
    quantity: 1,
    description: potion.description,
    rarity: potion.rarity,
    value: potion.value,
    weight: potion.weight,
    effects: potion.effects.map(e => `${e.name} ${e.magnitude}${e.duration > 0 ? ` for ${e.duration}s` : ''}`),
  };
}

export function getIngredientsByRarity(rarity: LootRarity): Ingredient[] {
  return Object.values(INGREDIENTS).filter(i => i.rarity === rarity);
}

export function getIngredientsByEffect(effect: AlchemyEffectType): Ingredient[] {
  return Object.values(INGREDIENTS).filter(i => i.effects.includes(effect));
}

export function getIngredientsByLocation(location: string): Ingredient[] {
  return Object.values(INGREDIENTS).filter(i => 
    i.locations.some(l => l.toLowerCase().includes(location.toLowerCase()))
  );
}

export function getHarvestableIngredients(): Ingredient[] {
  return Object.values(INGREDIENTS).filter(i => i.harvestable);
}

export function getCreatureDropIngredients(): Ingredient[] {
  return Object.values(INGREDIENTS).filter(i => !i.harvestable);
}
