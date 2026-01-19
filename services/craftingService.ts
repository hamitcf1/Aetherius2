/**
 * Crafting Service - Alchemy, Cooking, and Enchanting
 * Provides recipes, crafting logic, and ingredient effects
 */

import type { InventoryItem } from '../types';

// ============================================================================
// ALCHEMY EFFECTS
// ============================================================================

export interface AlchemyEffect {
  id: string;
  name: string;
  type: 'positive' | 'negative' | 'neutral';
  description: string;
  magnitude: number; // Base magnitude
  duration?: number; // Duration in seconds (if applicable)
  statAffected?: 'health' | 'magicka' | 'stamina' | 'armor' | 'damage';
}

export const ALCHEMY_EFFECTS: Record<string, AlchemyEffect> = {
  // Restoration Effects
  restore_health: { id: 'restore_health', name: 'Restore Health', type: 'positive', description: 'Restores health', magnitude: 25, statAffected: 'health' },
  restore_magicka: { id: 'restore_magicka', name: 'Restore Magicka', type: 'positive', description: 'Restores magicka', magnitude: 25, statAffected: 'magicka' },
  restore_stamina: { id: 'restore_stamina', name: 'Restore Stamina', type: 'positive', description: 'Restores stamina', magnitude: 25, statAffected: 'stamina' },
  
  // Fortify Effects
  fortify_health: { id: 'fortify_health', name: 'Fortify Health', type: 'positive', description: 'Increases maximum health', magnitude: 20, duration: 300, statAffected: 'health' },
  fortify_magicka: { id: 'fortify_magicka', name: 'Fortify Magicka', type: 'positive', description: 'Increases maximum magicka', magnitude: 20, duration: 300, statAffected: 'magicka' },
  fortify_stamina: { id: 'fortify_stamina', name: 'Fortify Stamina', type: 'positive', description: 'Increases maximum stamina', magnitude: 20, duration: 300, statAffected: 'stamina' },
  
  // Combat Effects
  fortify_one_handed: { id: 'fortify_one_handed', name: 'Fortify One-Handed', type: 'positive', description: 'Increases one-handed damage', magnitude: 15, duration: 300, statAffected: 'damage' },
  fortify_two_handed: { id: 'fortify_two_handed', name: 'Fortify Two-Handed', type: 'positive', description: 'Increases two-handed damage', magnitude: 15, duration: 300, statAffected: 'damage' },
  fortify_archery: { id: 'fortify_archery', name: 'Fortify Archery', type: 'positive', description: 'Increases bow damage', magnitude: 15, duration: 300, statAffected: 'damage' },
  fortify_destruction: { id: 'fortify_destruction', name: 'Fortify Destruction', type: 'positive', description: 'Increases destruction spell damage', magnitude: 15, duration: 300, statAffected: 'damage' },
  
  // Resistance Effects
  resist_fire: { id: 'resist_fire', name: 'Resist Fire', type: 'positive', description: 'Reduces fire damage taken', magnitude: 25, duration: 300 },
  resist_frost: { id: 'resist_frost', name: 'Resist Frost', type: 'positive', description: 'Reduces frost damage taken', magnitude: 25, duration: 300 },
  resist_shock: { id: 'resist_shock', name: 'Resist Shock', type: 'positive', description: 'Reduces shock damage taken', magnitude: 25, duration: 300 },
  resist_poison: { id: 'resist_poison', name: 'Resist Poison', type: 'positive', description: 'Reduces poison damage taken', magnitude: 25, duration: 300 },
  resist_magic: { id: 'resist_magic', name: 'Resist Magic', type: 'positive', description: 'Reduces all magic damage', magnitude: 15, duration: 300 },
  
  // Regeneration Effects
  regenerate_health: { id: 'regenerate_health', name: 'Regenerate Health', type: 'positive', description: 'Health regenerates faster', magnitude: 50, duration: 300 },
  regenerate_magicka: { id: 'regenerate_magicka', name: 'Regenerate Magicka', type: 'positive', description: 'Magicka regenerates faster', magnitude: 50, duration: 300 },
  regenerate_stamina: { id: 'regenerate_stamina', name: 'Regenerate Stamina', type: 'positive', description: 'Stamina regenerates faster', magnitude: 50, duration: 300 },
  
  // Utility Effects
  invisibility: { id: 'invisibility', name: 'Invisibility', type: 'positive', description: 'Become invisible', magnitude: 1, duration: 30 },
  waterbreathing: { id: 'waterbreathing', name: 'Waterbreathing', type: 'positive', description: 'Breathe underwater', magnitude: 1, duration: 60 },
  night_eye: { id: 'night_eye', name: 'Night Eye', type: 'positive', description: 'See in the dark', magnitude: 1, duration: 60 },
  slow_time: { id: 'slow_time', name: 'Slow Time', type: 'positive', description: 'Time moves slower', magnitude: 50, duration: 10 },
  
  // Negative Effects (used in poisons)
  damage_health: { id: 'damage_health', name: 'Damage Health', type: 'negative', description: 'Damages health', magnitude: 15, statAffected: 'health' },
  damage_magicka: { id: 'damage_magicka', name: 'Damage Magicka', type: 'negative', description: 'Damages magicka', magnitude: 15, statAffected: 'magicka' },
  damage_stamina: { id: 'damage_stamina', name: 'Damage Stamina', type: 'negative', description: 'Damages stamina', magnitude: 15, statAffected: 'stamina' },
  weakness_fire: { id: 'weakness_fire', name: 'Weakness to Fire', type: 'negative', description: 'Increases fire damage taken', magnitude: 25, duration: 30 },
  weakness_frost: { id: 'weakness_frost', name: 'Weakness to Frost', type: 'negative', description: 'Increases frost damage taken', magnitude: 25, duration: 30 },
  weakness_shock: { id: 'weakness_shock', name: 'Weakness to Shock', type: 'negative', description: 'Increases shock damage taken', magnitude: 25, duration: 30 },
  paralysis: { id: 'paralysis', name: 'Paralysis', type: 'negative', description: 'Cannot move', magnitude: 1, duration: 5 },
  frenzy: { id: 'frenzy', name: 'Frenzy', type: 'negative', description: 'Attacks everyone nearby', magnitude: 1, duration: 30 },
  fear: { id: 'fear', name: 'Fear', type: 'negative', description: 'Flees in terror', magnitude: 1, duration: 30 },
};

// ============================================================================
// INGREDIENTS
// ============================================================================

export interface Ingredient {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare';
  effects: string[]; // 4 effects (first 2 known by default, others revealed by Alchemy skill)
  description: string;
  value: number;
  locations?: string[]; // Where this ingredient can be found
}

export const INGREDIENTS: Record<string, Ingredient> = {
  // Common Ingredients
  blue_mountain_flower: {
    id: 'blue_mountain_flower',
    name: 'Blue Mountain Flower',
    rarity: 'common',
    effects: ['restore_health', 'fortify_one_handed', 'damage_magicka', 'fortify_stamina'],
    description: 'A beautiful blue flower found in the mountains of Skyrim.',
    value: 2,
    locations: ['Whiterun Hold', 'The Rift', 'Eastmarch']
  },
  red_mountain_flower: {
    id: 'red_mountain_flower',
    name: 'Red Mountain Flower',
    rarity: 'common',
    effects: ['restore_magicka', 'fortify_magicka', 'damage_health', 'ravage_magicka'],
    description: 'A vibrant red flower common throughout Skyrim.',
    value: 2,
    locations: ['Whiterun Hold', 'Falkreath Hold']
  },
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    rarity: 'common',
    effects: ['restore_health', 'fortify_health', 'damage_stamina', 'regenerate_health'],
    description: 'Golden wheat grown by farmers.',
    value: 1,
    locations: ['Whiterun Hold', 'Rorikstead']
  },
  blisterwort: {
    id: 'blisterwort',
    name: 'Blisterwort',
    rarity: 'common',
    effects: ['damage_stamina', 'frenzy', 'restore_health', 'fortify_one_handed'],
    description: 'A fungus found in dark caves.',
    value: 3,
    locations: ['Caves', 'Dungeons']
  },
  imp_stool: {
    id: 'imp_stool',
    name: 'Imp Stool',
    rarity: 'common',
    effects: ['damage_health', 'paralysis', 'damage_magicka', 'restore_health'],
    description: 'A poisonous mushroom.',
    value: 3,
    locations: ['Caves', 'Forests']
  },
  lavender: {
    id: 'lavender',
    name: 'Lavender',
    rarity: 'common',
    effects: ['resist_magic', 'fortify_stamina', 'regenerate_magicka', 'fortify_destruction'],
    description: 'A fragrant purple flower.',
    value: 2,
    locations: ['Whiterun Hold', 'The Reach']
  },
  
  // Uncommon Ingredients
  frost_mirriam: {
    id: 'frost_mirriam',
    name: 'Frost Mirriam',
    rarity: 'uncommon',
    effects: ['resist_frost', 'fortify_stamina', 'damage_stamina', 'regenerate_stamina'],
    description: 'A hardy herb that thrives in cold climates.',
    value: 5,
    locations: ['Winterhold', 'The Pale']
  },
  fire_salts: {
    id: 'fire_salts',
    name: 'Fire Salts',
    rarity: 'uncommon',
    effects: ['weakness_frost', 'resist_fire', 'restore_magicka', 'regenerate_magicka'],
    description: 'Crystalline salts harvested from fire atronachs.',
    value: 50,
    locations: ['Fire Atronachs', 'Conjurers']
  },
  frost_salts: {
    id: 'frost_salts',
    name: 'Frost Salts',
    rarity: 'uncommon',
    effects: ['weakness_fire', 'resist_frost', 'restore_magicka', 'fortify_destruction'],
    description: 'Icy crystals from frost atronachs.',
    value: 50,
    locations: ['Frost Atronachs', 'Conjurers']
  },
  void_salts: {
    id: 'void_salts',
    name: 'Void Salts',
    rarity: 'uncommon',
    effects: ['weakness_shock', 'resist_magic', 'damage_health', 'fortify_magicka'],
    description: 'Dark salts from storm atronachs.',
    value: 75,
    locations: ['Storm Atronachs', 'Conjurers']
  },
  giant_toe: {
    id: 'giant_toe',
    name: "Giant's Toe",
    rarity: 'uncommon',
    effects: ['damage_stamina', 'fortify_health', 'fortify_stamina', 'damage_health'],
    description: 'A massive toe from a giant.',
    value: 20,
    locations: ['Giant Camps']
  },
  
  // Rare Ingredients
  daedra_heart: {
    id: 'daedra_heart',
    name: 'Daedra Heart',
    rarity: 'rare',
    effects: ['restore_health', 'damage_stamina', 'fear', 'fortify_health'],
    description: 'The still-beating heart of a Daedra.',
    value: 250,
    locations: ['Daedra', 'Mehrunes Dagon Shrine']
  },
  crimson_nirnroot: {
    id: 'crimson_nirnroot',
    name: 'Crimson Nirnroot',
    rarity: 'rare',
    effects: ['damage_health', 'damage_stamina', 'invisibility', 'resist_magic'],
    description: 'A rare red variant of nirnroot found in Blackreach.',
    value: 100,
    locations: ['Blackreach']
  },
  jarrin_root: {
    id: 'jarrin_root',
    name: 'Jarrin Root',
    rarity: 'rare',
    effects: ['damage_health', 'damage_magicka', 'damage_stamina', 'paralysis'],
    description: 'An extremely poisonous root. One of the deadliest substances in Tamriel.',
    value: 500,
    locations: ['Dark Brotherhood Quest']
  },
  human_heart: {
    id: 'human_heart',
    name: 'Human Heart',
    rarity: 'rare',
    effects: ['damage_health', 'damage_magicka', 'frenzy', 'paralysis'],
    description: 'A heart taken from a human corpse.',
    value: 25,
    locations: ['Necromancers', 'Hagravens']
  },
};

// ============================================================================
// COOKING RECIPES
// ============================================================================

export interface CookingRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: Array<{ name: string; quantity: number }>;
  result: {
    name: string;
    type: 'food' | 'drink';
    description: string;
    effects: Array<{ stat: string; amount: number; duration?: number }>;
    value: number;
  };
  requiredStation?: 'cooking_pot' | 'oven' | 'none';
}

export const COOKING_RECIPES: CookingRecipe[] = [
  // Soups & Stews
  {
    id: 'vegetable_soup',
    name: 'Vegetable Soup',
    description: 'A hearty soup that restores stamina over time.',
    ingredients: [
      { name: 'Cabbage', quantity: 1 },
      { name: 'Potato', quantity: 1 },
      { name: 'Leek', quantity: 1 },
      { name: 'Tomato', quantity: 1 }
    ],
    result: {
      name: 'Vegetable Soup',
      type: 'food',
      description: 'Restores 1 point of Health and Stamina per second for 720 seconds.',
      effects: [
        { stat: 'health', amount: 1, duration: 720 },
        { stat: 'stamina', amount: 1, duration: 720 }
      ],
      value: 15
    },
    requiredStation: 'cooking_pot'
  },
  {
    id: 'beef_stew',
    name: 'Beef Stew',
    description: 'A filling stew that provides lasting sustenance.',
    ingredients: [
      { name: 'Raw Beef', quantity: 1 },
      { name: 'Carrot', quantity: 1 },
      { name: 'Garlic', quantity: 1 },
      { name: 'Salt Pile', quantity: 1 }
    ],
    result: {
      name: 'Beef Stew',
      type: 'food',
      description: 'Restores 2 points of Health and Stamina per second for 720 seconds.',
      effects: [
        { stat: 'health', amount: 2, duration: 720 },
        { stat: 'stamina', amount: 2, duration: 720 }
      ],
      value: 20
    },
    requiredStation: 'cooking_pot'
  },
  {
    id: 'elsweyr_fondue',
    name: 'Elsweyr Fondue',
    description: 'A Khajiit delicacy that fortifies magicka.',
    ingredients: [
      { name: 'Eidar Cheese Wheel', quantity: 1 },
      { name: 'Moon Sugar', quantity: 1 },
      { name: 'Ale', quantity: 1 }
    ],
    result: {
      name: 'Elsweyr Fondue',
      type: 'food',
      description: 'Fortifies Magicka by 100 points and regeneration by 25% for 720 seconds.',
      effects: [
        { stat: 'magicka', amount: 100, duration: 720 },
        { stat: 'magickaRegen', amount: 25, duration: 720 }
      ],
      value: 50
    },
    requiredStation: 'cooking_pot'
  },
  
  // Baked Goods
  {
    id: 'sweetroll',
    name: 'Sweetroll',
    description: 'A delicious pastry that restores health.',
    ingredients: [
      { name: 'Butter', quantity: 1 },
      { name: 'Flour', quantity: 1 },
      { name: 'Salt Pile', quantity: 1 },
      { name: 'Chicken Egg', quantity: 1 }
    ],
    result: {
      name: 'Sweetroll',
      type: 'food',
      description: 'Restores 10 points of Health.',
      effects: [{ stat: 'health', amount: 10 }],
      value: 5
    },
    requiredStation: 'oven'
  },
  {
    id: 'apple_pie',
    name: 'Apple Pie',
    description: 'A warm apple pie that restores health and stamina.',
    ingredients: [
      { name: 'Apple', quantity: 2 },
      { name: 'Flour', quantity: 1 },
      { name: 'Butter', quantity: 1 }
    ],
    result: {
      name: 'Apple Pie',
      type: 'food',
      description: 'Restores 15 points of Health and Stamina.',
      effects: [
        { stat: 'health', amount: 15 },
        { stat: 'stamina', amount: 15 }
      ],
      value: 12
    },
    requiredStation: 'oven'
  },
  
  // Grilled Meats
  {
    id: 'grilled_leeks',
    name: 'Grilled Leeks',
    description: 'Simple grilled vegetables.',
    ingredients: [{ name: 'Leek', quantity: 1 }],
    result: {
      name: 'Grilled Leeks',
      type: 'food',
      description: 'Restores 5 points of Health.',
      effects: [{ stat: 'health', amount: 5 }],
      value: 2
    },
    requiredStation: 'cooking_pot'
  },
  {
    id: 'cooked_beef',
    name: 'Cooked Beef',
    description: 'A simple grilled steak.',
    ingredients: [{ name: 'Raw Beef', quantity: 1 }],
    result: {
      name: 'Cooked Beef',
      type: 'food',
      description: 'Restores 10 points of Health.',
      effects: [{ stat: 'health', amount: 10 }],
      value: 8
    },
    requiredStation: 'cooking_pot'
  },
  {
    id: 'venison_chop',
    name: 'Venison Chop',
    description: 'Grilled deer meat.',
    ingredients: [
      { name: 'Venison', quantity: 1 },
      { name: 'Salt Pile', quantity: 1 }
    ],
    result: {
      name: 'Venison Chop',
      type: 'food',
      description: 'Restores 15 points of Health and Stamina.',
      effects: [
        { stat: 'health', amount: 15 },
        { stat: 'stamina', amount: 15 }
      ],
      value: 12
    },
    requiredStation: 'cooking_pot'
  },
  
  // Drinks
  {
    id: 'spiced_wine',
    name: 'Spiced Wine',
    description: 'Warm wine with spices.',
    ingredients: [
      { name: 'Wine', quantity: 1 },
      { name: 'Honey', quantity: 1 }
    ],
    result: {
      name: 'Spiced Wine',
      type: 'drink',
      description: 'Fortifies Stamina by 25 points for 300 seconds.',
      effects: [{ stat: 'stamina', amount: 25, duration: 300 }],
      value: 18
    },
    requiredStation: 'cooking_pot'
  },
];

// ============================================================================
// CRAFTING FUNCTIONS
// ============================================================================

/**
 * Find shared effects between two ingredients
 */
export const findSharedEffects = (ing1: Ingredient, ing2: Ingredient): string[] => {
  return ing1.effects.filter(e => ing2.effects.includes(e));
};

/**
 * Calculate potion from combining ingredients
 */
export const brewPotion = (
  ingredientIds: string[],
  alchemySkill: number = 15
): { success: boolean; potion?: InventoryItem; error?: string } => {
  if (ingredientIds.length < 2 || ingredientIds.length > 3) {
    return { success: false, error: 'Must combine 2-3 ingredients' };
  }
  
  const ingredients = ingredientIds
    .map(id => INGREDIENTS[id])
    .filter(Boolean);
  
  if (ingredients.length !== ingredientIds.length) {
    return { success: false, error: 'Invalid ingredient' };
  }
  
  // Find all shared effects
  const sharedEffects: string[] = [];
  for (let i = 0; i < ingredients.length; i++) {
    for (let j = i + 1; j < ingredients.length; j++) {
      const shared = findSharedEffects(ingredients[i], ingredients[j]);
      shared.forEach(e => {
        if (!sharedEffects.includes(e)) sharedEffects.push(e);
      });
    }
  }
  
  if (sharedEffects.length === 0) {
    return { success: false, error: 'No matching effects found' };
  }
  
  // Get effect details
  const effects = sharedEffects
    .map(id => ALCHEMY_EFFECTS[id])
    .filter(Boolean);
  
  // Calculate potion strength based on alchemy skill
  const skillMultiplier = 1 + (alchemySkill - 15) * 0.02;
  
  // Determine potion type (positive or negative = poison)
  const positiveCount = effects.filter(e => e.type === 'positive').length;
  const negativeCount = effects.filter(e => e.type === 'negative').length;
  const isPoison = negativeCount > positiveCount;
  
  // Generate potion name
  const primaryEffect = effects[0];
  const potionName = isPoison 
    ? `Poison of ${primaryEffect.name}` 
    : `Potion of ${primaryEffect.name}`;
  
  // Calculate potion value
  const baseValue = effects.reduce((sum, e) => sum + e.magnitude * 5, 0);
  const value = Math.round(baseValue * skillMultiplier);
  
  // Calculate magnitude
  const magnitude = Math.round(primaryEffect.magnitude * skillMultiplier);
  
  const potion: InventoryItem = {
    id: `crafted_potion_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    characterId: '',
    name: potionName,
    type: 'potion',
    subtype: primaryEffect.statAffected as any || 'health',
    description: `${primaryEffect.description}. Magnitude: ${magnitude}`,
    quantity: 1,
    equipped: false,
    value,
    rarity: ingredients.some(i => i.rarity === 'rare') ? 'rare' 
          : ingredients.some(i => i.rarity === 'uncommon') ? 'uncommon' 
          : 'common',
    damage: isPoison ? magnitude : undefined,
  };
  
  return { success: true, potion };
};

/**
 * Check if player has ingredients for a cooking recipe
 */
export const canCookRecipe = (
  recipe: CookingRecipe,
  inventory: InventoryItem[]
): { canCook: boolean; missingIngredients: string[] } => {
  const missing: string[] = [];
  
  for (const required of recipe.ingredients) {
    const inInventory = inventory.find(
      i => i.name.toLowerCase() === required.name.toLowerCase() && i.quantity >= required.quantity
    );
    if (!inInventory) {
      missing.push(`${required.quantity}x ${required.name}`);
    }
  }
  
  return { canCook: missing.length === 0, missingIngredients: missing };
};

/**
 * Cook a recipe
 */
export const cookRecipe = (
  recipe: CookingRecipe
): InventoryItem => {
  return {
    id: `cooked_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    characterId: '',
    name: recipe.result.name,
    type: recipe.result.type,
    description: recipe.result.description,
    quantity: 1,
    equipped: false,
    value: recipe.result.value,
    rarity: 'common',
  };
};

/**
 * Get available cooking recipes based on inventory
 */
export const getAvailableRecipes = (inventory: InventoryItem[]): CookingRecipe[] => {
  return COOKING_RECIPES.filter(recipe => {
    const { canCook } = canCookRecipe(recipe, inventory);
    return canCook;
  });
};

/**
 * Get ingredient by name (for inventory lookup)
 */
export const getIngredientByName = (name: string): Ingredient | undefined => {
  const normalized = name.toLowerCase().replace(/[^a-z]/g, '_');
  return Object.values(INGREDIENTS).find(
    i => i.name.toLowerCase() === name.toLowerCase() || i.id === normalized
  );
};
