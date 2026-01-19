/**
 * Soul Gem Service
 * Handles soul gems, soul trapping, and soul usage for enchanting
 */

// ========== TYPES ==========

export type SoulSize = 'petty' | 'lesser' | 'common' | 'greater' | 'grand' | 'black';

export interface SoulGem {
  id: string;
  name: string;
  size: SoulSize;
  capacity: number; // Max soul size it can hold
  filled: boolean;
  soulLevel: number; // 0 if empty, otherwise creature level
  soulType?: string; // Name of the creature whose soul is trapped
  isBlack: boolean; // Black soul gems can hold humanoid souls
  value: number;
  valueEmpty: number;
  weight: number;
}

export interface CreatureSoul {
  name: string;
  soulSize: SoulSize;
  soulValue: number; // Power for enchanting
  isHumanoid: boolean;
}

export interface SoulTrapResult {
  success: boolean;
  message: string;
  filledGem?: SoulGem;
  gemUsed?: string;
}

export interface SoulGemState {
  soulGems: SoulGem[];
  soulsCaptured: number;
  soulsUsed: number;
  blackSoulsCaptured: number;
  largestSoulCaptured: SoulSize;
}

// ========== CONSTANTS ==========

// Soul sizes and their capacity values
export const SOUL_CAPACITIES: Record<SoulSize, number> = {
  petty: 1,
  lesser: 2,
  common: 3,
  greater: 4,
  grand: 5,
  black: 5, // Black souls have same capacity as grand but can hold humanoids
};

// Base values for soul gems
export const SOUL_GEM_BASE_VALUES: Record<SoulSize, { empty: number; filled: number }> = {
  petty: { empty: 10, filled: 20 },
  lesser: { empty: 25, filled: 50 },
  common: { empty: 50, filled: 150 },
  greater: { empty: 100, filled: 350 },
  grand: { empty: 200, filled: 500 },
  black: { empty: 300, filled: 750 }, // Black soul gems are rarer
};

// Creature soul mappings
export const CREATURE_SOULS: Record<string, CreatureSoul> = {
  // Petty souls (level 1-4)
  skeever: { name: 'Skeever', soulSize: 'petty', soulValue: 250, isHumanoid: false },
  wolf: { name: 'Wolf', soulSize: 'petty', soulValue: 250, isHumanoid: false },
  mudcrab: { name: 'Mudcrab', soulSize: 'petty', soulValue: 250, isHumanoid: false },
  rabbit: { name: 'Rabbit', soulSize: 'petty', soulValue: 250, isHumanoid: false },
  chicken: { name: 'Chicken', soulSize: 'petty', soulValue: 250, isHumanoid: false },
  horker: { name: 'Horker', soulSize: 'petty', soulValue: 250, isHumanoid: false },
  
  // Lesser souls (level 5-15)
  skeleton: { name: 'Skeleton', soulSize: 'lesser', soulValue: 500, isHumanoid: false },
  draugr: { name: 'Draugr', soulSize: 'lesser', soulValue: 500, isHumanoid: false },
  ice_wolf: { name: 'Ice Wolf', soulSize: 'lesser', soulValue: 500, isHumanoid: false },
  frostbite_spider: { name: 'Frostbite Spider', soulSize: 'lesser', soulValue: 500, isHumanoid: false },
  bear: { name: 'Bear', soulSize: 'lesser', soulValue: 500, isHumanoid: false },
  sabre_cat: { name: 'Sabre Cat', soulSize: 'lesser', soulValue: 500, isHumanoid: false },
  
  // Common souls (level 16-27)
  troll: { name: 'Troll', soulSize: 'common', soulValue: 1000, isHumanoid: false },
  ice_troll: { name: 'Ice Troll', soulSize: 'common', soulValue: 1000, isHumanoid: false },
  hagraven: { name: 'Hagraven', soulSize: 'common', soulValue: 1000, isHumanoid: false },
  restless_draugr: { name: 'Restless Draugr', soulSize: 'common', soulValue: 1000, isHumanoid: false },
  ghost: { name: 'Ghost', soulSize: 'common', soulValue: 1000, isHumanoid: false },
  spriggan: { name: 'Spriggan', soulSize: 'common', soulValue: 1000, isHumanoid: false },
  flame_atronach: { name: 'Flame Atronach', soulSize: 'common', soulValue: 1000, isHumanoid: false },
  
  // Greater souls (level 28-37)
  draugr_wight: { name: 'Draugr Wight', soulSize: 'greater', soulValue: 2000, isHumanoid: false },
  frost_atronach: { name: 'Frost Atronach', soulSize: 'greater', soulValue: 2000, isHumanoid: false },
  storm_atronach: { name: 'Storm Atronach', soulSize: 'greater', soulValue: 2000, isHumanoid: false },
  dremora: { name: 'Dremora', soulSize: 'greater', soulValue: 2000, isHumanoid: false },
  giant: { name: 'Giant', soulSize: 'greater', soulValue: 2000, isHumanoid: false },
  mammoth: { name: 'Mammoth', soulSize: 'greater', soulValue: 2000, isHumanoid: false },
  
  // Grand souls (level 38+)
  draugr_death_overlord: { name: 'Draugr Death Overlord', soulSize: 'grand', soulValue: 3000, isHumanoid: false },
  dragon_priest: { name: 'Dragon Priest', soulSize: 'grand', soulValue: 3000, isHumanoid: false },
  ancient_dragon: { name: 'Ancient Dragon', soulSize: 'grand', soulValue: 3000, isHumanoid: false },
  elder_dragon: { name: 'Elder Dragon', soulSize: 'grand', soulValue: 3000, isHumanoid: false },
  legendary_dragon: { name: 'Legendary Dragon', soulSize: 'grand', soulValue: 3000, isHumanoid: false },
  
  // Humanoids (require black soul gems)
  bandit: { name: 'Bandit', soulSize: 'black', soulValue: 3000, isHumanoid: true },
  forsworn: { name: 'Forsworn', soulSize: 'black', soulValue: 3000, isHumanoid: true },
  vampire: { name: 'Vampire', soulSize: 'black', soulValue: 3000, isHumanoid: true },
  necromancer: { name: 'Necromancer', soulSize: 'black', soulValue: 3000, isHumanoid: true },
  silver_hand: { name: 'Silver Hand', soulSize: 'black', soulValue: 3000, isHumanoid: true },
  thalmor: { name: 'Thalmor', soulSize: 'black', soulValue: 3000, isHumanoid: true },
};

// ========== SOUL GEM CREATION ==========

export function createSoulGem(size: SoulSize, filled: boolean = false, soulType?: string): SoulGem {
  const isBlack = size === 'black';
  const baseValues = SOUL_GEM_BASE_VALUES[size];
  
  return {
    id: `soul_gem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: filled 
      ? `${capitalize(size)} Soul Gem (${soulType || 'Filled'})`
      : `${capitalize(size)} Soul Gem (Empty)`,
    size,
    capacity: SOUL_CAPACITIES[size],
    filled,
    soulLevel: filled ? SOUL_CAPACITIES[size] * 10 : 0,
    soulType,
    isBlack,
    value: filled ? baseValues.filled : baseValues.empty,
    valueEmpty: baseValues.empty,
    weight: 0.2,
  };
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========== SOUL TRAPPING ==========

export function getSoulSize(creatureType: string, creatureLevel: number): { size: SoulSize; isHumanoid: boolean } {
  // Check if we have specific data for this creature
  const knownCreature = Object.values(CREATURE_SOULS).find(
    c => c.name.toLowerCase() === creatureType.toLowerCase()
  );
  
  if (knownCreature) {
    return { size: knownCreature.soulSize, isHumanoid: knownCreature.isHumanoid };
  }
  
  // Check if it's a humanoid by type name
  const humanoidTypes = ['bandit', 'forsworn', 'vampire', 'necromancer', 'human', 'humanoid', 'nord', 'imperial', 'breton', 'redguard', 'dunmer', 'altmer', 'bosmer', 'khajiit', 'argonian', 'orc'];
  const isHumanoid = humanoidTypes.some(t => creatureType.toLowerCase().includes(t));
  
  if (isHumanoid) {
    return { size: 'black', isHumanoid: true };
  }
  
  // Determine soul size by level
  if (creatureLevel <= 4) return { size: 'petty', isHumanoid: false };
  if (creatureLevel <= 15) return { size: 'lesser', isHumanoid: false };
  if (creatureLevel <= 27) return { size: 'common', isHumanoid: false };
  if (creatureLevel <= 37) return { size: 'greater', isHumanoid: false };
  return { size: 'grand', isHumanoid: false };
}

export function canTrapSoul(gem: SoulGem, soulSize: SoulSize, isHumanoid: boolean): boolean {
  // Already filled
  if (gem.filled) return false;
  
  // Humanoid souls require black soul gems
  if (isHumanoid && !gem.isBlack) return false;
  
  // Soul must fit in gem
  return SOUL_CAPACITIES[soulSize] <= gem.capacity;
}

export function trapSoul(
  state: SoulGemState,
  creatureType: string,
  creatureLevel: number,
  hasSoulTrapActive: boolean = true
): SoulTrapResult {
  if (!hasSoulTrapActive) {
    return {
      success: false,
      message: 'You need the Soul Trap spell or enchantment active to capture souls.',
    };
  }
  
  const { size: soulSize, isHumanoid } = getSoulSize(creatureType, creatureLevel);
  
  // Find the best fitting empty soul gem
  // Prefer exact matches, then smallest that can fit
  const availableGems = state.soulGems.filter(g => canTrapSoul(g, soulSize, isHumanoid));
  
  if (availableGems.length === 0) {
    const reason = isHumanoid 
      ? 'You have no empty black soul gems to capture this humanoid soul.'
      : `You have no soul gem large enough to capture this ${soulSize} soul.`;
    return {
      success: false,
      message: reason,
    };
  }
  
  // Sort by capacity (prefer exact fit)
  availableGems.sort((a, b) => {
    const aExact = a.capacity === SOUL_CAPACITIES[soulSize] ? 0 : 1;
    const bExact = b.capacity === SOUL_CAPACITIES[soulSize] ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return a.capacity - b.capacity;
  });
  
  const gemToFill = availableGems[0];
  const filledGem = fillSoulGem(gemToFill, soulSize, creatureType);
  
  return {
    success: true,
    message: `Captured ${creatureType}'s soul in a ${gemToFill.size} soul gem!`,
    filledGem,
    gemUsed: gemToFill.id,
  };
}

function fillSoulGem(gem: SoulGem, soulSize: SoulSize, creatureType: string): SoulGem {
  const baseValues = SOUL_GEM_BASE_VALUES[gem.size];
  
  return {
    ...gem,
    name: `${capitalize(gem.size)} Soul Gem (${creatureType})`,
    filled: true,
    soulLevel: SOUL_CAPACITIES[soulSize] * 10,
    soulType: creatureType,
    value: baseValues.filled,
  };
}

// ========== SOUL GEM STATE MANAGEMENT ==========

export function getInitialSoulGemState(): SoulGemState {
  return {
    soulGems: [
      // Start with a few empty soul gems
      createSoulGem('petty'),
      createSoulGem('petty'),
      createSoulGem('lesser'),
    ],
    soulsCaptured: 0,
    soulsUsed: 0,
    blackSoulsCaptured: 0,
    largestSoulCaptured: 'petty',
  };
}

export function addSoulGem(state: SoulGemState, size: SoulSize, filled: boolean = false, soulType?: string): SoulGemState {
  const newGem = createSoulGem(size, filled, soulType);
  return {
    ...state,
    soulGems: [...state.soulGems, newGem],
  };
}

export function applySoulTrap(state: SoulGemState, result: SoulTrapResult): SoulGemState {
  if (!result.success || !result.filledGem || !result.gemUsed) {
    return state;
  }
  
  // Replace the empty gem with the filled one
  const newGems = state.soulGems.map(g => 
    g.id === result.gemUsed ? result.filledGem! : g
  );
  
  const soulSize = result.filledGem.size;
  const isBlack = result.filledGem.isBlack;
  
  // Track largest soul
  const sizeOrder: SoulSize[] = ['petty', 'lesser', 'common', 'greater', 'grand', 'black'];
  const currentLargestIndex = sizeOrder.indexOf(state.largestSoulCaptured);
  const newSoulIndex = sizeOrder.indexOf(soulSize);
  
  return {
    ...state,
    soulGems: newGems,
    soulsCaptured: state.soulsCaptured + 1,
    blackSoulsCaptured: isBlack ? state.blackSoulsCaptured + 1 : state.blackSoulsCaptured,
    largestSoulCaptured: newSoulIndex > currentLargestIndex ? soulSize : state.largestSoulCaptured,
  };
}

export function useSoulGem(state: SoulGemState, gemId: string): { newState: SoulGemState; soulPower: number } | null {
  const gem = state.soulGems.find(g => g.id === gemId);
  if (!gem || !gem.filled) {
    return null;
  }
  
  // Calculate soul power
  const soulPower = SOUL_CAPACITIES[gem.size] * 500 + gem.soulLevel * 10;
  
  // Remove the soul gem from inventory
  const newGems = state.soulGems.filter(g => g.id !== gemId);
  
  return {
    newState: {
      ...state,
      soulGems: newGems,
      soulsUsed: state.soulsUsed + 1,
    },
    soulPower,
  };
}

// Get enchanting power from a soul gem
export function getEnchantingPower(gem: SoulGem): number {
  if (!gem.filled) return 0;
  
  // Power based on soul size
  const basePower: Record<SoulSize, number> = {
    petty: 250,
    lesser: 500,
    common: 1000,
    greater: 2000,
    grand: 3000,
    black: 3000,
  };
  
  return basePower[gem.size];
}

// Get all filled soul gems sorted by power
export function getFilledSoulGems(state: SoulGemState): SoulGem[] {
  return state.soulGems
    .filter(g => g.filled)
    .sort((a, b) => getEnchantingPower(b) - getEnchantingPower(a));
}

// Get all empty soul gems sorted by capacity
export function getEmptySoulGems(state: SoulGemState): SoulGem[] {
  return state.soulGems
    .filter(g => !g.filled)
    .sort((a, b) => b.capacity - a.capacity);
}

// ========== UTILITY ==========

export function getSoulGemDisplayName(gem: SoulGem): string {
  if (gem.isBlack) {
    return gem.filled ? `Black Soul Gem (${gem.soulType})` : 'Black Soul Gem (Empty)';
  }
  return gem.name;
}

export function getSoulSizeDescription(size: SoulSize): string {
  switch (size) {
    case 'petty': return 'Petty - Suitable for weak creatures like wolves and skeevers';
    case 'lesser': return 'Lesser - Captures souls of trolls, bears, and lesser undead';
    case 'common': return 'Common - Holds souls of atronachs, ghosts, and most undead';
    case 'greater': return 'Greater - For giants, mammoths, and powerful creatures';
    case 'grand': return 'Grand - Only the mightiest creatures have souls this powerful';
    case 'black': return 'Black - The only gem that can capture humanoid souls';
    default: return '';
  }
}
