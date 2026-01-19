// Nutrition data for food and drink items
// Each item has hunger/thirst reduction values that vary based on the type and quality of the item

export interface NutritionInfo {
  hungerReduction: number;  // How much hunger is reduced (0-100)
  thirstReduction: number;  // How much thirst is reduced (0-100)
  fatigueReduction?: number; // Optional fatigue reduction (for some special items)
}

// Food nutrition values - keyed by item name (lowercase, trimmed)
export const FOOD_NUTRITION: Record<string, NutritionInfo> = {
  // Basic foods - low satiety
  'apple': { hungerReduction: 10, thirstReduction: 5 },
  'cabbage': { hungerReduction: 8, thirstReduction: 3 },
  'potato': { hungerReduction: 12, thirstReduction: 0 },
  'leek': { hungerReduction: 8, thirstReduction: 2 },
  'carrot': { hungerReduction: 10, thirstReduction: 3 },
  'tomato': { hungerReduction: 8, thirstReduction: 5 },
  'gourd': { hungerReduction: 10, thirstReduction: 8 },
  
  // Bread & baked goods - moderate satiety
  'bread': { hungerReduction: 20, thirstReduction: 0 },
  'sweetroll': { hungerReduction: 15, thirstReduction: 0 },
  'honey nut treat': { hungerReduction: 12, thirstReduction: 0 },
  'boiled creme treat': { hungerReduction: 15, thirstReduction: 5 },
  'apple pie': { hungerReduction: 25, thirstReduction: 5 },
  'snowberry crostata': { hungerReduction: 20, thirstReduction: 5 },
  
  // Cheese - moderate satiety
  'cheese wheel': { hungerReduction: 35, thirstReduction: -5 }, // cheese makes you thirsty
  'cheese wedge': { hungerReduction: 18, thirstReduction: -3 },
  'eidar cheese wheel': { hungerReduction: 30, thirstReduction: -5 },
  'goat cheese wheel': { hungerReduction: 28, thirstReduction: -5 },
  
  // Cooked meats - high satiety
  'cooked venison': { hungerReduction: 40, thirstReduction: 0 },
  'venison': { hungerReduction: 40, thirstReduction: 0 },
  'grilled salmon': { hungerReduction: 35, thirstReduction: 5 },
  'salmon steak': { hungerReduction: 35, thirstReduction: 5 },
  'cooked beef': { hungerReduction: 45, thirstReduction: 0 },
  'beef': { hungerReduction: 45, thirstReduction: 0 },
  'rabbit haunch': { hungerReduction: 25, thirstReduction: 0 },
  'roasted rabbit': { hungerReduction: 25, thirstReduction: 0 },
  'horker meat': { hungerReduction: 35, thirstReduction: 0 },
  'horker loaf': { hungerReduction: 40, thirstReduction: 5 },
  'mammoth snout': { hungerReduction: 50, thirstReduction: 0 },
  'mammoth steak': { hungerReduction: 55, thirstReduction: 0 },
  'cooked chicken': { hungerReduction: 30, thirstReduction: 0 },
  'pheasant roast': { hungerReduction: 32, thirstReduction: 0 },
  'grilled leeks': { hungerReduction: 15, thirstReduction: 5 },
  'baked potato': { hungerReduction: 20, thirstReduction: 0 },
  
  // Stews and soups - very high satiety + some hydration
  'beef stew': { hungerReduction: 55, thirstReduction: 20 },
  'venison stew': { hungerReduction: 50, thirstReduction: 20 },
  'vegetable soup': { hungerReduction: 30, thirstReduction: 25 },
  'cabbage soup': { hungerReduction: 25, thirstReduction: 25 },
  'tomato soup': { hungerReduction: 25, thirstReduction: 25 },
  'horker stew': { hungerReduction: 55, thirstReduction: 20 },
  'apple cabbage stew': { hungerReduction: 35, thirstReduction: 20 },
  'elsweyr fondue': { hungerReduction: 45, thirstReduction: 10 },
  
  // Travel rations - designed for travel, very filling
  'travel rations': { hungerReduction: 60, thirstReduction: 0 },
  'rations': { hungerReduction: 60, thirstReduction: 0 },
  
  // Raw/uncooked - less effective
  'raw beef': { hungerReduction: 20, thirstReduction: 0 },
  'raw venison': { hungerReduction: 18, thirstReduction: 0 },
  'raw rabbit leg': { hungerReduction: 12, thirstReduction: 0 },
  
  // Eggs
  'chicken egg': { hungerReduction: 8, thirstReduction: 2 },
  'pine thrush egg': { hungerReduction: 6, thirstReduction: 2 },
  'rock warbler egg': { hungerReduction: 6, thirstReduction: 2 },
  
  // Special/exotic
  'long taffy treat': { hungerReduction: 10, thirstReduction: 0 },
  'honey': { hungerReduction: 8, thirstReduction: 0, fatigueReduction: 5 },
  'snowberries': { hungerReduction: 5, thirstReduction: 8 },
  'jazbay grapes': { hungerReduction: 5, thirstReduction: 10 },
  'juniper berries': { hungerReduction: 5, thirstReduction: 8 },
};

// Drink nutrition values
export const DRINK_NUTRITION: Record<string, NutritionInfo> = {
  // Water - pure hydration
  'water skin': { hungerReduction: 0, thirstReduction: 40 },
  'water': { hungerReduction: 0, thirstReduction: 35 },
  'fresh water': { hungerReduction: 0, thirstReduction: 40 },
  
  // Milk - hydration + slight satiety
  'milk': { hungerReduction: 8, thirstReduction: 30 },
  'goat milk': { hungerReduction: 10, thirstReduction: 28 },
  
  // Ale & Beer - moderate hydration
  'ale': { hungerReduction: 5, thirstReduction: 25 },
  'honningbrew mead': { hungerReduction: 5, thirstReduction: 30 },
  
  // Mead - decent hydration
  'nord mead': { hungerReduction: 8, thirstReduction: 30 },
  'black-briar mead': { hungerReduction: 10, thirstReduction: 35 },
  'mead': { hungerReduction: 8, thirstReduction: 30 },
  
  // Wine - less hydrating due to alcohol
  'alto wine': { hungerReduction: 3, thirstReduction: 22 },
  'wine': { hungerReduction: 3, thirstReduction: 20 },
  'spiced wine': { hungerReduction: 5, thirstReduction: 25, fatigueReduction: 10 },
  'firebrand wine': { hungerReduction: 3, thirstReduction: 20 },
  'colovian brandy': { hungerReduction: 3, thirstReduction: 15 },
  'argonian bloodwine': { hungerReduction: 3, thirstReduction: 18 },
  
  // Special drinks
  'skooma': { hungerReduction: 0, thirstReduction: 10, fatigueReduction: -20 }, // energizes but dehydrates
  'sleeping tree sap': { hungerReduction: 5, thirstReduction: 15, fatigueReduction: 25 },
  'velvet lechance': { hungerReduction: 8, thirstReduction: 28 },
  'cliff racer': { hungerReduction: 3, thirstReduction: 20 },
  'white-gold tower': { hungerReduction: 5, thirstReduction: 25 },
  
  // Juice (if added)
  'snowberry juice': { hungerReduction: 5, thirstReduction: 35 },
  'apple juice': { hungerReduction: 5, thirstReduction: 35 },
};

// Get nutrition info for a food item by name
export function getFoodNutrition(itemName: string): NutritionInfo {
  const key = itemName.toLowerCase().trim();
  
  // Direct match
  if (FOOD_NUTRITION[key]) {
    return FOOD_NUTRITION[key];
  }
  
  // Partial match - check if any key is contained in the item name
  for (const [foodKey, nutrition] of Object.entries(FOOD_NUTRITION)) {
    if (key.includes(foodKey) || foodKey.includes(key)) {
      return nutrition;
    }
  }
  
  // Default food value
  return { hungerReduction: 20, thirstReduction: 5 };
}

// Get nutrition info for a drink item by name
export function getDrinkNutrition(itemName: string): NutritionInfo {
  const key = itemName.toLowerCase().trim();
  
  // Direct match
  if (DRINK_NUTRITION[key]) {
    return DRINK_NUTRITION[key];
  }
  
  // Partial match
  for (const [drinkKey, nutrition] of Object.entries(DRINK_NUTRITION)) {
    if (key.includes(drinkKey) || drinkKey.includes(key)) {
      return nutrition;
    }
  }
  
  // Default drink value
  return { hungerReduction: 0, thirstReduction: 25 };
}

// Get nutrition display string for a food item
export function getFoodNutritionDisplay(itemName: string): string {
  const nutrition = getFoodNutrition(itemName);
  const parts: string[] = [];
  if (nutrition.hungerReduction > 0) parts.push(`-${nutrition.hungerReduction} hunger`);
  if (nutrition.thirstReduction > 0) parts.push(`-${nutrition.thirstReduction} thirst`);
  if (nutrition.thirstReduction < 0) parts.push(`+${Math.abs(nutrition.thirstReduction)} thirst`);
  if (nutrition.fatigueReduction && nutrition.fatigueReduction !== 0) {
    parts.push(nutrition.fatigueReduction > 0 ? `-${nutrition.fatigueReduction} fatigue` : `+${Math.abs(nutrition.fatigueReduction)} fatigue`);
  }
  return parts.join(', ') || 'No nutrition value';
}

// Get nutrition display string for a drink item
export function getDrinkNutritionDisplay(itemName: string): string {
  const nutrition = getDrinkNutrition(itemName);
  const parts: string[] = [];
  if (nutrition.thirstReduction > 0) parts.push(`-${nutrition.thirstReduction} thirst`);
  if (nutrition.hungerReduction > 0) parts.push(`-${nutrition.hungerReduction} hunger`);
  if (nutrition.fatigueReduction && nutrition.fatigueReduction !== 0) {
    parts.push(nutrition.fatigueReduction > 0 ? `-${nutrition.fatigueReduction} fatigue` : `+${Math.abs(nutrition.fatigueReduction)} fatigue`);
  }
  return parts.join(', ') || 'No nutrition value';
}

/**
 * Get restoration values for any consumable item (potions, food, drink)
 * Used by the Use Item list in combat to show what the item will restore.
 */
export interface RestorationValues {
  health?: number;
  magicka?: number;
  stamina?: number;
  hunger?: number;
  thirst?: number;
  displayString: string;
}

export function getItemRestorationValues(item: { name?: string; type?: string; subtype?: string; damage?: number; description?: string }): RestorationValues {
  const name = (item.name || '').toLowerCase().trim();
  const type = (item.type || '').toLowerCase();
  const subtype = (item.subtype || '').toLowerCase();
  const description = (item.description || '').toLowerCase();
  
  const result: RestorationValues = { displayString: '' };
  const parts: string[] = [];
  
  // Handle potions
  if (type === 'potion') {
    // Determine which stat the potion restores
    let stat: 'health' | 'magicka' | 'stamina' | null = null;
    if (subtype === 'health' || name.includes('health') || name.includes('heal') || name.includes('vitality') || description.includes('health')) {
      stat = 'health';
    } else if (subtype === 'magicka' || name.includes('magicka') || name.includes('mana') || description.includes('magicka')) {
      stat = 'magicka';
    } else if (subtype === 'stamina' || name.includes('stamina') || name.includes('endurance') || description.includes('stamina')) {
      stat = 'stamina';
    }
    
    // Determine the amount
    let amount = typeof item.damage === 'number' ? item.damage : null;
    if (amount == null) {
      // Parse from text
      const text = name + ' ' + description;
      const match = text.match(/(\d+)/);
      if (match) {
        amount = parseInt(match[1], 10);
      } else {
        // Default based on tier
        if (name.includes('minor') || name.includes('small')) {
          amount = 25;
        } else if (name.includes('major') || name.includes('plentiful') || name.includes('grand') || name.includes('ultimate')) {
          amount = 100;
        } else {
          amount = 50;
        }
      }
    }
    
    if (stat && amount) {
      result[stat] = amount;
      const icon = stat === 'health' ? '❤️' : stat === 'magicka' ? '✨' : '⚡';
      const statLabel = stat.charAt(0).toUpperCase() + stat.slice(1);
      parts.push(`${icon} +${amount} ${statLabel}`);
    }
  }
  
  // Handle food
  if (type === 'food') {
    const nutrition = getFoodNutrition(name);
    // Food heals based on hunger reduction: heal = floor(hungerReduction/2) + 10
    const healthRestore = Math.floor(nutrition.hungerReduction / 2) + 10;
    result.health = healthRestore;
    result.hunger = nutrition.hungerReduction;
    
    parts.push(`❤️ +${healthRestore} Health`);
    if (nutrition.hungerReduction > 0) {
      parts.push(`🍖 -${nutrition.hungerReduction} Hunger`);
    }
  }
  
  // Handle drinks
  if (type === 'drink') {
    const nutrition = getDrinkNutrition(name);
    result.thirst = nutrition.thirstReduction;
    
    // Some drinks restore stamina (alcoholic ones add fatigue instead)
    if (name.includes('ale') || name.includes('mead') || name.includes('wine') || name.includes('skooma')) {
      // Alcoholic drinks add fatigue but don't restore stats
      if (nutrition.thirstReduction > 0) {
        parts.push(`💧 -${nutrition.thirstReduction} Thirst`);
      }
      if (nutrition.fatigueReduction && nutrition.fatigueReduction < 0) {
        parts.push(`😴 +${Math.abs(nutrition.fatigueReduction)} Fatigue`);
      }
    } else {
      // Non-alcoholic drinks restore stamina
      const staminaRestore = Math.floor(nutrition.thirstReduction / 2) + 5;
      result.stamina = staminaRestore;
      parts.push(`⚡ +${staminaRestore} Stamina`);
      if (nutrition.thirstReduction > 0) {
        parts.push(`💧 -${nutrition.thirstReduction} Thirst`);
      }
    }
  }
  
  result.displayString = parts.join(' | ') || 'Unknown effect';
  return result;
}

