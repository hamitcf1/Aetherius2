/**
 * Cooking & Food Service
 * Food items, cooking recipes, and hunger mechanics
 */

import { LootRarity, InventoryItem } from '../types';

// ========== TYPES ==========

export type FoodCategory = 
  | 'raw_meat' | 'cooked_meat' | 'fish' | 'vegetable' | 'fruit' 
  | 'bread' | 'cheese' | 'soup' | 'stew' | 'pie' | 'dessert'
  | 'drink' | 'alcohol' | 'ingredient';

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  description: string;
  hungerRestored: number; // 0-100
  healthRestored: number;
  staminaRestored: number;
  magickaRestored: number;
  effects?: FoodEffect[];
  weight: number;
  value: number;
  isRaw: boolean;
  canCook: boolean;
  cookedVersion?: string;
  spoilageTime?: number; // Hours until spoiled (survival mode)
}

export interface FoodEffect {
  type: 'fortify_health' | 'fortify_stamina' | 'fortify_magicka' | 'regen_health' | 'regen_stamina' | 'regen_magicka' | 'resist_cold' | 'resist_fire' | 'cure_disease' | 'fortify_carry_weight';
  magnitude: number;
  duration: number; // Seconds
}

export interface CookingRecipe {
  id: string;
  name: string;
  description: string;
  resultItem: string;
  resultQuantity: number;
  ingredients: Array<{ itemId: string; quantity: number }>;
  requiredLevel?: number; // Cooking skill level
  cookingTime: number; // Seconds
}

export interface HungerState {
  currentHunger: number; // 0-100, 100 = full, 0 = starving
  hungerDecayRate: number; // Hunger lost per hour
  lastAte: number; // Timestamp
  mealsEaten: number;
  favoriteFood?: string;
  isStarving: boolean;
}

// ========== FOOD DATABASE ==========

export const FOOD_ITEMS: Record<string, FoodItem> = {
  // Raw Meats
  raw_beef: {
    id: 'raw_beef',
    name: 'Raw Beef',
    category: 'raw_meat',
    description: 'Uncooked beef. Should be cooked before eating.',
    hungerRestored: 15,
    healthRestored: 1,
    staminaRestored: 0,
    magickaRestored: 0,
    weight: 1,
    value: 5,
    isRaw: true,
    canCook: true,
    cookedVersion: 'cooked_beef',
    spoilageTime: 24,
  },
  raw_rabbit: {
    id: 'raw_rabbit',
    name: 'Raw Rabbit Leg',
    category: 'raw_meat',
    description: 'A raw rabbit leg. Cook it for better benefits.',
    hungerRestored: 10,
    healthRestored: 1,
    staminaRestored: 0,
    magickaRestored: 0,
    weight: 0.1,
    value: 3,
    isRaw: true,
    canCook: true,
    cookedVersion: 'cooked_rabbit',
    spoilageTime: 12,
  },
  venison: {
    id: 'venison',
    name: 'Venison',
    category: 'raw_meat',
    description: 'Raw deer meat.',
    hungerRestored: 20,
    healthRestored: 1,
    staminaRestored: 0,
    magickaRestored: 0,
    weight: 2,
    value: 8,
    isRaw: true,
    canCook: true,
    cookedVersion: 'cooked_venison',
    spoilageTime: 24,
  },
  horker_meat: {
    id: 'horker_meat',
    name: 'Horker Meat',
    category: 'raw_meat',
    description: 'Fatty meat from a horker.',
    hungerRestored: 25,
    healthRestored: 2,
    staminaRestored: 5,
    magickaRestored: 0,
    weight: 2,
    value: 5,
    isRaw: true,
    canCook: true,
    cookedVersion: 'cooked_horker',
    spoilageTime: 36,
  },
  mammoth_snout: {
    id: 'mammoth_snout',
    name: 'Mammoth Snout',
    category: 'raw_meat',
    description: 'A large piece of mammoth meat.',
    hungerRestored: 40,
    healthRestored: 5,
    staminaRestored: 10,
    magickaRestored: 0,
    weight: 5,
    value: 20,
    isRaw: true,
    canCook: true,
    cookedVersion: 'cooked_mammoth',
    spoilageTime: 48,
  },
  
  // Cooked Meats
  cooked_beef: {
    id: 'cooked_beef',
    name: 'Cooked Beef',
    category: 'cooked_meat',
    description: 'Well-cooked beef that restores health.',
    hungerRestored: 35,
    healthRestored: 10,
    staminaRestored: 5,
    magickaRestored: 0,
    weight: 1,
    value: 10,
    isRaw: false,
    canCook: false,
    spoilageTime: 72,
  },
  cooked_rabbit: {
    id: 'cooked_rabbit',
    name: 'Cooked Rabbit Leg',
    category: 'cooked_meat',
    description: 'A nicely roasted rabbit leg.',
    hungerRestored: 25,
    healthRestored: 5,
    staminaRestored: 5,
    magickaRestored: 0,
    weight: 0.1,
    value: 6,
    isRaw: false,
    canCook: false,
    spoilageTime: 48,
  },
  cooked_venison: {
    id: 'cooked_venison',
    name: 'Venison Chop',
    category: 'cooked_meat',
    description: 'A hearty venison chop.',
    hungerRestored: 40,
    healthRestored: 15,
    staminaRestored: 10,
    magickaRestored: 0,
    weight: 2,
    value: 15,
    isRaw: false,
    canCook: false,
    spoilageTime: 72,
  },
  grilled_leeks: {
    id: 'grilled_leeks',
    name: 'Grilled Leeks',
    category: 'cooked_meat',
    description: 'Grilled leeks, simple but satisfying.',
    hungerRestored: 15,
    healthRestored: 5,
    staminaRestored: 0,
    magickaRestored: 5,
    weight: 0.1,
    value: 2,
    isRaw: false,
    canCook: false,
  },
  
  // Fish
  raw_salmon: {
    id: 'raw_salmon',
    name: 'Salmon Meat',
    category: 'fish',
    description: 'Fresh salmon from Skyrim\'s rivers.',
    hungerRestored: 15,
    healthRestored: 2,
    staminaRestored: 0,
    magickaRestored: 0,
    weight: 0.5,
    value: 5,
    isRaw: true,
    canCook: true,
    cookedVersion: 'grilled_salmon',
    spoilageTime: 12,
  },
  grilled_salmon: {
    id: 'grilled_salmon',
    name: 'Grilled Salmon Steak',
    category: 'fish',
    description: 'A perfectly grilled salmon steak.',
    hungerRestored: 30,
    healthRestored: 10,
    staminaRestored: 5,
    magickaRestored: 0,
    weight: 0.5,
    value: 15,
    isRaw: false,
    canCook: false,
    spoilageTime: 48,
  },
  slaughterfish_meat: {
    id: 'slaughterfish_meat',
    name: 'Slaughterfish Meat',
    category: 'fish',
    description: 'Meat from the vicious slaughterfish.',
    hungerRestored: 10,
    healthRestored: 1,
    staminaRestored: 0,
    magickaRestored: 0,
    weight: 0.5,
    value: 3,
    isRaw: true,
    canCook: true,
    spoilageTime: 12,
  },
  
  // Vegetables
  cabbage: {
    id: 'cabbage',
    name: 'Cabbage',
    category: 'vegetable',
    description: 'A fresh head of cabbage.',
    hungerRestored: 10,
    healthRestored: 2,
    staminaRestored: 0,
    magickaRestored: 0,
    weight: 0.25,
    value: 1,
    isRaw: true,
    canCook: true,
  },
  potato: {
    id: 'potato',
    name: 'Potato',
    category: 'vegetable',
    description: 'A starchy potato.',
    hungerRestored: 15,
    healthRestored: 2,
    staminaRestored: 5,
    magickaRestored: 0,
    weight: 0.1,
    value: 1,
    isRaw: true,
    canCook: true,
  },
  leek: {
    id: 'leek',
    name: 'Leek',
    category: 'vegetable',
    description: 'A common leek.',
    hungerRestored: 5,
    healthRestored: 1,
    staminaRestored: 0,
    magickaRestored: 0,
    weight: 0.1,
    value: 1,
    isRaw: true,
    canCook: true,
  },
  carrot: {
    id: 'carrot',
    name: 'Carrot',
    category: 'vegetable',
    description: 'A fresh carrot.',
    hungerRestored: 10,
    healthRestored: 2,
    staminaRestored: 0,
    magickaRestored: 0,
    weight: 0.1,
    value: 1,
    isRaw: true,
    canCook: false,
  },
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    category: 'vegetable',
    description: 'A ripe tomato.',
    hungerRestored: 8,
    healthRestored: 2,
    staminaRestored: 0,
    magickaRestored: 0,
    weight: 0.1,
    value: 2,
    isRaw: true,
    canCook: true,
  },
  
  // Fruits
  apple: {
    id: 'apple',
    name: 'Apple',
    category: 'fruit',
    description: 'A crisp, red apple.',
    hungerRestored: 10,
    healthRestored: 2,
    staminaRestored: 2,
    magickaRestored: 0,
    weight: 0.1,
    value: 2,
    isRaw: false,
    canCook: true,
  },
  green_apple: {
    id: 'green_apple',
    name: 'Green Apple',
    category: 'fruit',
    description: 'A tart green apple.',
    hungerRestored: 10,
    healthRestored: 2,
    staminaRestored: 2,
    magickaRestored: 0,
    weight: 0.1,
    value: 2,
    isRaw: false,
    canCook: true,
  },
  
  // Breads
  bread: {
    id: 'bread',
    name: 'Bread',
    category: 'bread',
    description: 'A loaf of fresh bread.',
    hungerRestored: 20,
    healthRestored: 5,
    staminaRestored: 5,
    magickaRestored: 0,
    weight: 0.5,
    value: 2,
    isRaw: false,
    canCook: false,
  },
  sweet_roll: {
    id: 'sweet_roll',
    name: 'Sweet Roll',
    category: 'dessert',
    description: 'Let me guess... someone stole your sweet roll.',
    hungerRestored: 15,
    healthRestored: 5,
    staminaRestored: 0,
    magickaRestored: 5,
    weight: 0.2,
    value: 5,
    isRaw: false,
    canCook: false,
  },
  
  // Cheese
  cheese_wheel: {
    id: 'cheese_wheel',
    name: 'Cheese Wheel',
    category: 'cheese',
    description: 'A whole wheel of aged cheese.',
    hungerRestored: 25,
    healthRestored: 5,
    staminaRestored: 5,
    magickaRestored: 0,
    weight: 2,
    value: 10,
    isRaw: false,
    canCook: false,
  },
  cheese_wedge: {
    id: 'cheese_wedge',
    name: 'Cheese Wedge',
    category: 'cheese',
    description: 'A wedge of cheese.',
    hungerRestored: 10,
    healthRestored: 2,
    staminaRestored: 2,
    magickaRestored: 0,
    weight: 0.25,
    value: 3,
    isRaw: false,
    canCook: false,
  },
  goat_cheese: {
    id: 'goat_cheese',
    name: 'Goat Cheese',
    category: 'cheese',
    description: 'Tangy goat cheese.',
    hungerRestored: 12,
    healthRestored: 3,
    staminaRestored: 2,
    magickaRestored: 0,
    weight: 0.5,
    value: 5,
    isRaw: false,
    canCook: false,
  },
  
  // Soups and Stews
  vegetable_soup: {
    id: 'vegetable_soup',
    name: 'Vegetable Soup',
    category: 'soup',
    description: 'A hearty vegetable soup.',
    hungerRestored: 35,
    healthRestored: 5,
    staminaRestored: 0,
    magickaRestored: 0,
    effects: [
      { type: 'regen_health', magnitude: 1, duration: 720 },
      { type: 'regen_stamina', magnitude: 1, duration: 720 },
    ],
    weight: 0.5,
    value: 10,
    isRaw: false,
    canCook: false,
  },
  beef_stew: {
    id: 'beef_stew',
    name: 'Beef Stew',
    category: 'stew',
    description: 'A thick, meaty stew.',
    hungerRestored: 50,
    healthRestored: 10,
    staminaRestored: 10,
    magickaRestored: 0,
    effects: [
      { type: 'fortify_health', magnitude: 25, duration: 600 },
      { type: 'fortify_stamina', magnitude: 25, duration: 600 },
    ],
    weight: 0.5,
    value: 15,
    isRaw: false,
    canCook: false,
  },
  venison_stew: {
    id: 'venison_stew',
    name: 'Venison Stew',
    category: 'stew',
    description: 'A rich venison stew.',
    hungerRestored: 45,
    healthRestored: 10,
    staminaRestored: 15,
    magickaRestored: 0,
    effects: [
      { type: 'regen_stamina', magnitude: 2, duration: 720 },
    ],
    weight: 0.5,
    value: 12,
    isRaw: false,
    canCook: false,
  },
  cabbage_soup: {
    id: 'cabbage_soup',
    name: 'Cabbage Soup',
    category: 'soup',
    description: 'A simple cabbage soup.',
    hungerRestored: 25,
    healthRestored: 5,
    staminaRestored: 0,
    magickaRestored: 0,
    effects: [
      { type: 'regen_stamina', magnitude: 1, duration: 300 },
    ],
    weight: 0.5,
    value: 5,
    isRaw: false,
    canCook: false,
  },
  
  // Pies
  apple_pie: {
    id: 'apple_pie',
    name: 'Apple Pie',
    category: 'pie',
    description: 'A delicious apple pie.',
    hungerRestored: 40,
    healthRestored: 10,
    staminaRestored: 10,
    magickaRestored: 0,
    effects: [
      { type: 'fortify_stamina', magnitude: 15, duration: 300 },
    ],
    weight: 0.5,
    value: 15,
    isRaw: false,
    canCook: false,
  },
  
  // Drinks
  milk: {
    id: 'milk',
    name: 'Milk',
    category: 'drink',
    description: 'Fresh milk.',
    hungerRestored: 10,
    healthRestored: 5,
    staminaRestored: 0,
    magickaRestored: 0,
    weight: 0.5,
    value: 2,
    isRaw: false,
    canCook: false,
  },
  
  // Alcohol
  ale: {
    id: 'ale',
    name: 'Ale',
    category: 'alcohol',
    description: 'A mug of ale.',
    hungerRestored: 5,
    healthRestored: 0,
    staminaRestored: 20,
    magickaRestored: 0,
    effects: [
      { type: 'fortify_stamina', magnitude: 20, duration: 60 },
    ],
    weight: 0.5,
    value: 5,
    isRaw: false,
    canCook: false,
  },
  mead: {
    id: 'mead',
    name: 'Mead',
    category: 'alcohol',
    description: 'Sweet fermented honey drink.',
    hungerRestored: 10,
    healthRestored: 0,
    staminaRestored: 25,
    magickaRestored: 0,
    effects: [
      { type: 'fortify_stamina', magnitude: 25, duration: 60 },
    ],
    weight: 0.5,
    value: 8,
    isRaw: false,
    canCook: false,
  },
  honningbrew_mead: {
    id: 'honningbrew_mead',
    name: 'Honningbrew Mead',
    category: 'alcohol',
    description: 'Premium mead from Honningbrew Meadery.',
    hungerRestored: 15,
    healthRestored: 5,
    staminaRestored: 30,
    magickaRestored: 0,
    effects: [
      { type: 'fortify_stamina', magnitude: 30, duration: 90 },
    ],
    weight: 0.5,
    value: 15,
    isRaw: false,
    canCook: false,
  },
  blackbriar_mead: {
    id: 'blackbriar_mead',
    name: 'Black-Briar Mead',
    category: 'alcohol',
    description: 'The finest mead in all of Skyrim, or so they claim.',
    hungerRestored: 15,
    healthRestored: 5,
    staminaRestored: 30,
    magickaRestored: 0,
    effects: [
      { type: 'fortify_stamina', magnitude: 35, duration: 90 },
    ],
    weight: 0.5,
    value: 20,
    isRaw: false,
    canCook: false,
  },
  spiced_wine: {
    id: 'spiced_wine',
    name: 'Spiced Wine',
    category: 'alcohol',
    description: 'Warm, spiced wine.',
    hungerRestored: 10,
    healthRestored: 5,
    staminaRestored: 10,
    magickaRestored: 10,
    effects: [
      { type: 'resist_cold', magnitude: 20, duration: 300 },
    ],
    weight: 0.5,
    value: 25,
    isRaw: false,
    canCook: false,
  },
  nord_mead: {
    id: 'nord_mead',
    name: 'Nord Mead',
    category: 'alcohol',
    description: 'Strong Nord mead.',
    hungerRestored: 10,
    healthRestored: 0,
    staminaRestored: 35,
    magickaRestored: 0,
    effects: [
      { type: 'fortify_stamina', magnitude: 40, duration: 60 },
      { type: 'resist_cold', magnitude: 10, duration: 60 },
    ],
    weight: 0.5,
    value: 12,
    isRaw: false,
    canCook: false,
  },
};

// ========== RECIPES ==========

export const COOKING_RECIPES: Record<string, CookingRecipe> = {
  cook_beef: {
    id: 'cook_beef',
    name: 'Cooked Beef',
    description: 'Cook raw beef over a fire.',
    resultItem: 'cooked_beef',
    resultQuantity: 1,
    ingredients: [{ itemId: 'raw_beef', quantity: 1 }],
    cookingTime: 30,
  },
  cook_rabbit: {
    id: 'cook_rabbit',
    name: 'Cooked Rabbit Leg',
    description: 'Roast a rabbit leg.',
    resultItem: 'cooked_rabbit',
    resultQuantity: 1,
    ingredients: [{ itemId: 'raw_rabbit', quantity: 1 }],
    cookingTime: 20,
  },
  cook_venison: {
    id: 'cook_venison',
    name: 'Venison Chop',
    description: 'Cook a venison chop.',
    resultItem: 'cooked_venison',
    resultQuantity: 1,
    ingredients: [{ itemId: 'venison', quantity: 1 }],
    cookingTime: 40,
  },
  grill_salmon: {
    id: 'grill_salmon',
    name: 'Grilled Salmon Steak',
    description: 'Grill fresh salmon.',
    resultItem: 'grilled_salmon',
    resultQuantity: 1,
    ingredients: [{ itemId: 'raw_salmon', quantity: 1 }],
    cookingTime: 25,
  },
  grill_leeks: {
    id: 'grill_leeks',
    name: 'Grilled Leeks',
    description: 'Grill fresh leeks.',
    resultItem: 'grilled_leeks',
    resultQuantity: 1,
    ingredients: [{ itemId: 'leek', quantity: 2 }],
    cookingTime: 15,
  },
  vegetable_soup: {
    id: 'vegetable_soup',
    name: 'Vegetable Soup',
    description: 'A hearty vegetable soup.',
    resultItem: 'vegetable_soup',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'potato', quantity: 1 },
      { itemId: 'cabbage', quantity: 1 },
      { itemId: 'leek', quantity: 1 },
      { itemId: 'tomato', quantity: 1 },
    ],
    cookingTime: 60,
  },
  beef_stew: {
    id: 'beef_stew',
    name: 'Beef Stew',
    description: 'A thick, hearty beef stew.',
    resultItem: 'beef_stew',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'raw_beef', quantity: 1 },
      { itemId: 'carrot', quantity: 1 },
      { itemId: 'potato', quantity: 1 },
      { itemId: 'salt_pile', quantity: 1 },
    ],
    cookingTime: 90,
  },
  venison_stew: {
    id: 'venison_stew',
    name: 'Venison Stew',
    description: 'A rich venison stew.',
    resultItem: 'venison_stew',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'venison', quantity: 1 },
      { itemId: 'potato', quantity: 1 },
      { itemId: 'leek', quantity: 1 },
    ],
    cookingTime: 80,
  },
  cabbage_soup: {
    id: 'cabbage_soup',
    name: 'Cabbage Soup',
    description: 'Simple but filling.',
    resultItem: 'cabbage_soup',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'cabbage', quantity: 1 },
      { itemId: 'salt_pile', quantity: 1 },
    ],
    cookingTime: 45,
  },
  apple_pie: {
    id: 'apple_pie',
    name: 'Apple Pie',
    description: 'A delicious dessert.',
    resultItem: 'apple_pie',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'apple', quantity: 2 },
      { itemId: 'flour', quantity: 1 },
      { itemId: 'butter', quantity: 1 },
    ],
    cookingTime: 60,
  },
};

// ========== STATE MANAGEMENT ==========

export function getInitialHungerState(): HungerState {
  return {
    currentHunger: 100, // Start full
    hungerDecayRate: 5, // Lose 5 hunger per hour
    lastAte: Date.now(),
    mealsEaten: 0,
    isStarving: false,
  };
}

export function eatFood(
  state: HungerState,
  foodItem: FoodItem
): { newState: HungerState; message: string; effects: FoodEffect[] } {
  const newHunger = Math.min(100, state.currentHunger + foodItem.hungerRestored);
  
  let message = `You ate ${foodItem.name}.`;
  if (foodItem.healthRestored > 0) {
    message += ` Restored ${foodItem.healthRestored} health.`;
  }
  if (foodItem.staminaRestored > 0) {
    message += ` Restored ${foodItem.staminaRestored} stamina.`;
  }
  
  return {
    newState: {
      ...state,
      currentHunger: newHunger,
      lastAte: Date.now(),
      mealsEaten: state.mealsEaten + 1,
      isStarving: false,
    },
    message,
    effects: foodItem.effects || [],
  };
}

export function updateHunger(
  state: HungerState,
  hoursElapsed: number
): HungerState {
  const hungerLost = state.hungerDecayRate * hoursElapsed;
  const newHunger = Math.max(0, state.currentHunger - hungerLost);
  
  return {
    ...state,
    currentHunger: newHunger,
    isStarving: newHunger <= 10,
  };
}

export function getHungerStatus(state: HungerState): string {
  if (state.currentHunger >= 90) return 'Full';
  if (state.currentHunger >= 70) return 'Satisfied';
  if (state.currentHunger >= 50) return 'Peckish';
  if (state.currentHunger >= 30) return 'Hungry';
  if (state.currentHunger >= 10) return 'Very Hungry';
  return 'Starving';
}

export function getHungerEffects(state: HungerState): { healthMod: number; staminaMod: number; regenMod: number } {
  if (state.currentHunger >= 70) {
    return { healthMod: 0, staminaMod: 0, regenMod: 1.0 };
  }
  if (state.currentHunger >= 50) {
    return { healthMod: 0, staminaMod: -10, regenMod: 0.9 };
  }
  if (state.currentHunger >= 30) {
    return { healthMod: -10, staminaMod: -25, regenMod: 0.75 };
  }
  if (state.currentHunger >= 10) {
    return { healthMod: -25, staminaMod: -50, regenMod: 0.5 };
  }
  // Starving
  return { healthMod: -50, staminaMod: -100, regenMod: 0.25 };
}

// ========== COOKING FUNCTIONS ==========

export function canCookRecipe(
  recipe: CookingRecipe,
  inventory: Record<string, number>
): boolean {
  for (const ingredient of recipe.ingredients) {
    const available = inventory[ingredient.itemId] || 0;
    if (available < ingredient.quantity) {
      return false;
    }
  }
  return true;
}

export function getMissingIngredients(
  recipe: CookingRecipe,
  inventory: Record<string, number>
): Array<{ itemId: string; needed: number; have: number }> {
  const missing: Array<{ itemId: string; needed: number; have: number }> = [];
  
  for (const ingredient of recipe.ingredients) {
    const available = inventory[ingredient.itemId] || 0;
    if (available < ingredient.quantity) {
      missing.push({
        itemId: ingredient.itemId,
        needed: ingredient.quantity,
        have: available,
      });
    }
  }
  
  return missing;
}

export function getRecipesByIngredient(ingredientId: string): CookingRecipe[] {
  return Object.values(COOKING_RECIPES).filter(recipe =>
    recipe.ingredients.some(ing => ing.itemId === ingredientId)
  );
}

export function foodToInventoryItem(food: FoodItem): InventoryItem {
  const rarity: LootRarity = food.effects && food.effects.length > 0 ? 'uncommon' : 'common';
  
  return {
    id: food.id,
    name: food.name,
    type: 'food',
    quantity: 1,
    description: food.description,
    rarity,
    value: food.value,
    weight: food.weight,
    effects: food.effects?.map(e => `${e.type}: ${e.magnitude} for ${e.duration}s`) || [],
  };
}

export function getFoodByCategory(category: FoodCategory): FoodItem[] {
  return Object.values(FOOD_ITEMS).filter(f => f.category === category);
}

export function getRawFoods(): FoodItem[] {
  return Object.values(FOOD_ITEMS).filter(f => f.isRaw);
}

export function getCookableFoods(): FoodItem[] {
  return Object.values(FOOD_ITEMS).filter(f => f.canCook);
}
