/**
 * Enchanting Service
 * Soul gems, enchantments, and item enchanting system
 */

import { InventoryItem, Character } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type SoulGemSize = 'petty' | 'lesser' | 'common' | 'greater' | 'grand' | 'black' | 'azura_star';

export interface SoulGem {
  id: string;
  name: string;
  size: SoulGemSize;
  capacity: number; // Soul level capacity
  filled: boolean;
  soulLevel?: number; // Current soul level if filled
  soulName?: string; // Name of creature soul captured
  value: number;
}

export interface Enchantment {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'jewelry';
  slot?: string[]; // Applicable slots for armor/jewelry
  baseMagnitude: number;
  scalingFactor: number; // How much skill affects magnitude
  chargeUse?: number; // For weapons - uses per charge
  school: 'destruction' | 'alteration' | 'restoration' | 'conjuration' | 'illusion';
  effect: string; // Internal effect type
  stackable: boolean; // Can stack with other enchantments
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  learnedFrom: string[]; // Item types that teach this
}

export interface LearnedEnchantment {
  enchantmentId: string;
  learnedAt: number;
  timesUsed: number;
  itemsDisenchanted: number;
}

export interface EnchantingState {
  learnedEnchantments: LearnedEnchantment[];
  soulGems: SoulGem[];
  enchantingLevel: number;
  totalItemsEnchanted: number;
  totalItemsDisenchanted: number;
}

// ============================================================================
// SOUL GEM DEFINITIONS
// ============================================================================

export const SOUL_GEM_SIZES: Record<SoulGemSize, { name: string; capacity: number; value: number }> = {
  petty: { name: 'Petty Soul Gem', capacity: 1, value: 10 },
  lesser: { name: 'Lesser Soul Gem', capacity: 2, value: 25 },
  common: { name: 'Common Soul Gem', capacity: 3, value: 50 },
  greater: { name: 'Greater Soul Gem', capacity: 4, value: 100 },
  grand: { name: 'Grand Soul Gem', capacity: 5, value: 200 },
  black: { name: 'Black Soul Gem', capacity: 5, value: 500 },
  azura_star: { name: "Azura's Star", capacity: 5, value: 1000 },
};

// Creature soul levels (what size gem they fill)
export const CREATURE_SOUL_LEVELS: Record<string, number> = {
  // Level 1 - Petty
  skeever: 1, mudcrab: 1, wolf: 1, fox: 1, rabbit: 1, chicken: 1,
  // Level 2 - Lesser  
  draugr: 2, skeleton: 2, ghost: 2, spider: 2, bear: 2, sabre_cat: 2,
  // Level 3 - Common
  draugr_wight: 3, vampire: 3, bandit_chief: 3, troll: 3, hagraven: 3,
  // Level 4 - Greater
  draugr_deathlord: 4, frost_troll: 4, giant: 4, mammoth: 4, wispmother: 4,
  // Level 5 - Grand
  dragon: 5, dragon_priest: 5, ancient_dragon: 5, dremora_lord: 5,
};

// ============================================================================
// ENCHANTMENT DEFINITIONS
// ============================================================================

export const ENCHANTMENTS: Record<string, Enchantment> = {
  // WEAPON ENCHANTMENTS
  fire_damage: {
    id: 'fire_damage',
    name: 'Fiery Soul Trap',
    description: 'Burns the target for fire damage. If target dies within seconds, fills a soul gem.',
    type: 'weapon',
    baseMagnitude: 15,
    scalingFactor: 1.5,
    chargeUse: 1,
    school: 'destruction',
    effect: 'fire_damage',
    stackable: false,
    rarity: 'uncommon',
    learnedFrom: ['fire_enchanted_weapons'],
  },
  frost_damage: {
    id: 'frost_damage',
    name: 'Frost',
    description: 'Target takes frost damage to health and stamina.',
    type: 'weapon',
    baseMagnitude: 15,
    scalingFactor: 1.5,
    chargeUse: 1,
    school: 'destruction',
    effect: 'frost_damage',
    stackable: false,
    rarity: 'uncommon',
    learnedFrom: ['frost_enchanted_weapons'],
  },
  shock_damage: {
    id: 'shock_damage',
    name: 'Shock',
    description: 'Target takes shock damage to health and magicka.',
    type: 'weapon',
    baseMagnitude: 15,
    scalingFactor: 1.5,
    chargeUse: 1,
    school: 'destruction',
    effect: 'shock_damage',
    stackable: false,
    rarity: 'uncommon',
    learnedFrom: ['shock_enchanted_weapons'],
  },
  absorb_health: {
    id: 'absorb_health',
    name: 'Absorb Health',
    description: 'Absorb health from the target.',
    type: 'weapon',
    baseMagnitude: 10,
    scalingFactor: 1.2,
    chargeUse: 2,
    school: 'destruction',
    effect: 'absorb_health',
    stackable: false,
    rarity: 'rare',
    learnedFrom: ['draugr_weapons', 'vampire_gear'],
  },
  absorb_magicka: {
    id: 'absorb_magicka',
    name: 'Absorb Magicka',
    description: 'Absorb magicka from the target.',
    type: 'weapon',
    baseMagnitude: 15,
    scalingFactor: 1.3,
    chargeUse: 2,
    school: 'destruction',
    effect: 'absorb_magicka',
    stackable: false,
    rarity: 'rare',
    learnedFrom: ['magical_staves', 'mage_gear'],
  },
  absorb_stamina: {
    id: 'absorb_stamina',
    name: 'Absorb Stamina',
    description: 'Absorb stamina from the target.',
    type: 'weapon',
    baseMagnitude: 15,
    scalingFactor: 1.3,
    chargeUse: 2,
    school: 'destruction',
    effect: 'absorb_stamina',
    stackable: false,
    rarity: 'rare',
    learnedFrom: ['ancient_weapons'],
  },
  soul_trap: {
    id: 'soul_trap',
    name: 'Soul Trap',
    description: 'If target dies within 5 seconds, fills a soul gem.',
    type: 'weapon',
    baseMagnitude: 5,
    scalingFactor: 1.0,
    chargeUse: 1,
    school: 'conjuration',
    effect: 'soul_trap',
    stackable: true,
    rarity: 'common',
    learnedFrom: ['soul_trap_weapons'],
  },
  turn_undead: {
    id: 'turn_undead',
    name: 'Turn Undead',
    description: 'Undead up to level flee for 30 seconds.',
    type: 'weapon',
    baseMagnitude: 10,
    scalingFactor: 1.0,
    chargeUse: 1,
    school: 'restoration',
    effect: 'turn_undead',
    stackable: false,
    rarity: 'uncommon',
    learnedFrom: ['silver_weapons', 'dawnguard_gear'],
  },
  fear: {
    id: 'fear',
    name: 'Fear',
    description: 'Creatures and people up to level flee for 30 seconds.',
    type: 'weapon',
    baseMagnitude: 10,
    scalingFactor: 1.0,
    chargeUse: 1,
    school: 'illusion',
    effect: 'fear',
    stackable: false,
    rarity: 'uncommon',
    learnedFrom: ['illusion_weapons'],
  },
  paralyze: {
    id: 'paralyze',
    name: 'Paralyze',
    description: 'Chance to paralyze the target for seconds.',
    type: 'weapon',
    baseMagnitude: 2,
    scalingFactor: 0.5,
    chargeUse: 3,
    school: 'alteration',
    effect: 'paralyze',
    stackable: false,
    rarity: 'epic',
    learnedFrom: ['paralysis_weapons', 'expert_mage_gear'],
  },
  banish: {
    id: 'banish',
    name: 'Banish',
    description: 'Banishes summoned daedra up to level.',
    type: 'weapon',
    baseMagnitude: 15,
    scalingFactor: 1.5,
    chargeUse: 2,
    school: 'conjuration',
    effect: 'banish',
    stackable: false,
    rarity: 'rare',
    learnedFrom: ['daedric_artifacts'],
  },
  chaos_damage: {
    id: 'chaos_damage',
    name: 'Chaos Damage',
    description: '50% chance for fire, frost, and shock damage.',
    type: 'weapon',
    baseMagnitude: 25,
    scalingFactor: 2.0,
    chargeUse: 3,
    school: 'destruction',
    effect: 'chaos_damage',
    stackable: false,
    rarity: 'legendary',
    learnedFrom: ['chaos_weapons', 'dragonborn_gear'],
  },

  // ARMOR ENCHANTMENTS
  fortify_health: {
    id: 'fortify_health',
    name: 'Fortify Health',
    description: 'Increases maximum health.',
    type: 'armor',
    slot: ['chest', 'amulet', 'ring'],
    baseMagnitude: 20,
    scalingFactor: 1.5,
    school: 'restoration',
    effect: 'fortify_health',
    stackable: true,
    rarity: 'common',
    learnedFrom: ['health_gear'],
  },
  fortify_magicka: {
    id: 'fortify_magicka',
    name: 'Fortify Magicka',
    description: 'Increases maximum magicka.',
    type: 'armor',
    slot: ['head', 'chest', 'amulet', 'ring'],
    baseMagnitude: 20,
    scalingFactor: 1.5,
    school: 'restoration',
    effect: 'fortify_magicka',
    stackable: true,
    rarity: 'common',
    learnedFrom: ['mage_robes', 'magic_gear'],
  },
  fortify_stamina: {
    id: 'fortify_stamina',
    name: 'Fortify Stamina',
    description: 'Increases maximum stamina.',
    type: 'armor',
    slot: ['feet', 'amulet', 'ring'],
    baseMagnitude: 20,
    scalingFactor: 1.5,
    school: 'restoration',
    effect: 'fortify_stamina',
    stackable: true,
    rarity: 'common',
    learnedFrom: ['stamina_gear', 'warrior_boots'],
  },
  resist_fire: {
    id: 'resist_fire',
    name: 'Resist Fire',
    description: 'Increases fire resistance.',
    type: 'armor',
    slot: ['chest', 'shield', 'ring'],
    baseMagnitude: 15,
    scalingFactor: 1.2,
    school: 'alteration',
    effect: 'resist_fire',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['fire_resistant_gear'],
  },
  resist_frost: {
    id: 'resist_frost',
    name: 'Resist Frost',
    description: 'Increases frost resistance.',
    type: 'armor',
    slot: ['chest', 'shield', 'ring'],
    baseMagnitude: 15,
    scalingFactor: 1.2,
    school: 'alteration',
    effect: 'resist_frost',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['frost_resistant_gear', 'nordic_armor'],
  },
  resist_shock: {
    id: 'resist_shock',
    name: 'Resist Shock',
    description: 'Increases shock resistance.',
    type: 'armor',
    slot: ['chest', 'shield', 'ring'],
    baseMagnitude: 15,
    scalingFactor: 1.2,
    school: 'alteration',
    effect: 'resist_shock',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['shock_resistant_gear'],
  },
  resist_magic: {
    id: 'resist_magic',
    name: 'Resist Magic',
    description: 'Increases magic resistance.',
    type: 'armor',
    slot: ['chest', 'shield', 'ring', 'amulet'],
    baseMagnitude: 10,
    scalingFactor: 1.0,
    school: 'alteration',
    effect: 'resist_magic',
    stackable: true,
    rarity: 'rare',
    learnedFrom: ['magic_resistant_gear'],
  },
  fortify_carry_weight: {
    id: 'fortify_carry_weight',
    name: 'Fortify Carry Weight',
    description: 'Increases carrying capacity.',
    type: 'armor',
    slot: ['feet', 'hands', 'ring'],
    baseMagnitude: 25,
    scalingFactor: 1.5,
    school: 'alteration',
    effect: 'fortify_carry_weight',
    stackable: true,
    rarity: 'common',
    learnedFrom: ['pack_boots', 'merchant_gear'],
  },
  fortify_one_handed: {
    id: 'fortify_one_handed',
    name: 'Fortify One-Handed',
    description: 'One-handed attacks do more damage.',
    type: 'armor',
    slot: ['hands', 'ring', 'amulet'],
    baseMagnitude: 15,
    scalingFactor: 1.3,
    school: 'restoration',
    effect: 'fortify_one_handed',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['warrior_gauntlets'],
  },
  fortify_two_handed: {
    id: 'fortify_two_handed',
    name: 'Fortify Two-Handed',
    description: 'Two-handed attacks do more damage.',
    type: 'armor',
    slot: ['hands', 'ring', 'amulet'],
    baseMagnitude: 15,
    scalingFactor: 1.3,
    school: 'restoration',
    effect: 'fortify_two_handed',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['nordic_gauntlets'],
  },
  fortify_archery: {
    id: 'fortify_archery',
    name: 'Fortify Archery',
    description: 'Bows do more damage.',
    type: 'armor',
    slot: ['head', 'hands', 'ring'],
    baseMagnitude: 15,
    scalingFactor: 1.3,
    school: 'restoration',
    effect: 'fortify_archery',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['hunter_gear'],
  },
  fortify_light_armor: {
    id: 'fortify_light_armor',
    name: 'Fortify Light Armor',
    description: 'Increases light armor rating.',
    type: 'armor',
    slot: ['ring', 'amulet'],
    baseMagnitude: 15,
    scalingFactor: 1.2,
    school: 'alteration',
    effect: 'fortify_light_armor',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['thief_guild_gear'],
  },
  fortify_heavy_armor: {
    id: 'fortify_heavy_armor',
    name: 'Fortify Heavy Armor',
    description: 'Increases heavy armor rating.',
    type: 'armor',
    slot: ['ring', 'amulet'],
    baseMagnitude: 15,
    scalingFactor: 1.2,
    school: 'alteration',
    effect: 'fortify_heavy_armor',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['orc_armor', 'ebony_gear'],
  },
  fortify_sneak: {
    id: 'fortify_sneak',
    name: 'Fortify Sneak',
    description: 'Increases sneak effectiveness.',
    type: 'armor',
    slot: ['feet', 'ring'],
    baseMagnitude: 15,
    scalingFactor: 1.2,
    school: 'illusion',
    effect: 'fortify_sneak',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['thief_boots', 'dark_brotherhood_gear'],
  },
  muffle: {
    id: 'muffle',
    name: 'Muffle',
    description: 'Movement is silenced.',
    type: 'armor',
    slot: ['feet'],
    baseMagnitude: 1,
    scalingFactor: 0,
    school: 'illusion',
    effect: 'muffle',
    stackable: false,
    rarity: 'rare',
    learnedFrom: ['thieves_guild_boots'],
  },
  waterbreathing: {
    id: 'waterbreathing',
    name: 'Waterbreathing',
    description: 'Can breathe underwater.',
    type: 'armor',
    slot: ['head', 'amulet'],
    baseMagnitude: 1,
    scalingFactor: 0,
    school: 'alteration',
    effect: 'waterbreathing',
    stackable: false,
    rarity: 'uncommon',
    learnedFrom: ['argonian_gear', 'water_gear'],
  },
  fortify_destruction: {
    id: 'fortify_destruction',
    name: 'Fortify Destruction',
    description: 'Destruction spells cost less to cast.',
    type: 'armor',
    slot: ['head', 'chest', 'ring', 'amulet'],
    baseMagnitude: 12,
    scalingFactor: 1.2,
    school: 'destruction',
    effect: 'fortify_destruction',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['destruction_robes'],
  },
  fortify_conjuration: {
    id: 'fortify_conjuration',
    name: 'Fortify Conjuration',
    description: 'Conjuration spells cost less to cast.',
    type: 'armor',
    slot: ['head', 'chest', 'ring', 'amulet'],
    baseMagnitude: 12,
    scalingFactor: 1.2,
    school: 'conjuration',
    effect: 'fortify_conjuration',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['conjuration_robes'],
  },
  fortify_restoration: {
    id: 'fortify_restoration',
    name: 'Fortify Restoration',
    description: 'Restoration spells cost less to cast.',
    type: 'armor',
    slot: ['head', 'chest', 'ring', 'amulet'],
    baseMagnitude: 12,
    scalingFactor: 1.2,
    school: 'restoration',
    effect: 'fortify_restoration',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['restoration_robes', 'temple_gear'],
  },
  fortify_alteration: {
    id: 'fortify_alteration',
    name: 'Fortify Alteration',
    description: 'Alteration spells cost less to cast.',
    type: 'armor',
    slot: ['head', 'chest', 'ring', 'amulet'],
    baseMagnitude: 12,
    scalingFactor: 1.2,
    school: 'alteration',
    effect: 'fortify_alteration',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['alteration_robes'],
  },
  fortify_illusion: {
    id: 'fortify_illusion',
    name: 'Fortify Illusion',
    description: 'Illusion spells cost less to cast.',
    type: 'armor',
    slot: ['head', 'chest', 'ring', 'amulet'],
    baseMagnitude: 12,
    scalingFactor: 1.2,
    school: 'illusion',
    effect: 'fortify_illusion',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['illusion_robes'],
  },
  fortify_smithing: {
    id: 'fortify_smithing',
    name: 'Fortify Smithing',
    description: 'Smithed items are better.',
    type: 'armor',
    slot: ['hands', 'ring', 'amulet'],
    baseMagnitude: 12,
    scalingFactor: 1.2,
    school: 'alteration',
    effect: 'fortify_smithing',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['smith_gloves'],
  },
  fortify_alchemy: {
    id: 'fortify_alchemy',
    name: 'Fortify Alchemy',
    description: 'Created potions are stronger.',
    type: 'armor',
    slot: ['head', 'hands', 'ring', 'amulet'],
    baseMagnitude: 12,
    scalingFactor: 1.2,
    school: 'restoration',
    effect: 'fortify_alchemy',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['alchemist_gear'],
  },
  fortify_speech: {
    id: 'fortify_speech',
    name: 'Fortify Barter',
    description: 'Prices are better.',
    type: 'armor',
    slot: ['amulet', 'ring'],
    baseMagnitude: 12,
    scalingFactor: 1.2,
    school: 'illusion',
    effect: 'fortify_barter',
    stackable: true,
    rarity: 'uncommon',
    learnedFrom: ['merchant_amulet'],
  },
};

// ============================================================================
// ENCHANTING FUNCTIONS
// ============================================================================

/**
 * Initialize enchanting state
 */
export function initializeEnchantingState(): EnchantingState {
  return {
    learnedEnchantments: [],
    soulGems: [],
    enchantingLevel: 15,
    totalItemsEnchanted: 0,
    totalItemsDisenchanted: 0,
  };
}

/**
 * Get enchanting state from character or initialize
 */
export function getEnchantingState(character: Character): EnchantingState {
  if (character.enchantingState) {
    return character.enchantingState as EnchantingState;
  }
  return initializeEnchantingState();
}

/**
 * Create a soul gem item
 */
export function createSoulGem(size: SoulGemSize, filled: boolean = false, soulLevel?: number): SoulGem {
  const gemDef = SOUL_GEM_SIZES[size];
  return {
    id: `soul_gem_${size}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: filled ? `${gemDef.name} (Filled)` : gemDef.name,
    size,
    capacity: gemDef.capacity,
    filled,
    soulLevel: filled ? (soulLevel || gemDef.capacity) : undefined,
    value: filled ? gemDef.value * 2 : gemDef.value,
  };
}

/**
 * Fill a soul gem with a soul
 */
export function fillSoulGem(
  state: EnchantingState,
  gemId: string,
  soulLevel: number,
  soulName: string
): { state: EnchantingState; success: boolean; message: string } {
  const gemIndex = state.soulGems.findIndex(g => g.id === gemId);
  if (gemIndex === -1) {
    return { state, success: false, message: 'Soul gem not found.' };
  }

  const gem = state.soulGems[gemIndex];
  if (gem.filled) {
    return { state, success: false, message: 'Soul gem is already filled.' };
  }

  if (soulLevel > gem.capacity) {
    return { state, success: false, message: `This soul is too powerful for a ${gem.name}.` };
  }

  const newGems = [...state.soulGems];
  newGems[gemIndex] = {
    ...gem,
    filled: true,
    soulLevel,
    soulName,
    name: `${SOUL_GEM_SIZES[gem.size].name} (${soulName} Soul)`,
    value: gem.value * 2,
  };

  return {
    state: { ...state, soulGems: newGems },
    success: true,
    message: `Captured ${soulName}'s soul in ${gem.name}!`
  };
}

/**
 * Add a soul gem to inventory
 */
export function addSoulGem(state: EnchantingState, gem: SoulGem): EnchantingState {
  return {
    ...state,
    soulGems: [...state.soulGems, gem],
  };
}

/**
 * Remove a soul gem (after use)
 */
export function removeSoulGem(state: EnchantingState, gemId: string): EnchantingState {
  return {
    ...state,
    soulGems: state.soulGems.filter(g => g.id !== gemId),
  };
}

/**
 * Learn an enchantment by disenchanting an item
 */
export function disenchantItem(
  state: EnchantingState,
  item: InventoryItem,
  enchantmentId: string
): { state: EnchantingState; success: boolean; message: string; xpGained: number } {
  const enchantment = ENCHANTMENTS[enchantmentId];
  if (!enchantment) {
    return { state, success: false, message: 'Unknown enchantment.', xpGained: 0 };
  }

  // Check if already learned
  const alreadyLearned = state.learnedEnchantments.find(e => e.enchantmentId === enchantmentId);
  if (alreadyLearned) {
    return { state, success: false, message: `You already know ${enchantment.name}.`, xpGained: 0 };
  }

  // Learn the enchantment
  const newLearned: LearnedEnchantment = {
    enchantmentId,
    learnedAt: Date.now(),
    timesUsed: 0,
    itemsDisenchanted: 1,
  };

  const xpGained = 50 + (enchantment.rarity === 'legendary' ? 200 : enchantment.rarity === 'epic' ? 100 : enchantment.rarity === 'rare' ? 50 : 25);

  return {
    state: {
      ...state,
      learnedEnchantments: [...state.learnedEnchantments, newLearned],
      totalItemsDisenchanted: state.totalItemsDisenchanted + 1,
    },
    success: true,
    message: `You learned ${enchantment.name}! (The ${item.name} was destroyed)`,
    xpGained,
  };
}

/**
 * Calculate enchantment magnitude based on skill and soul gem
 */
export function calculateEnchantmentMagnitude(
  enchantmentId: string,
  enchantingSkill: number,
  soulGemSize: SoulGemSize,
  soulLevel: number
): number {
  const enchantment = ENCHANTMENTS[enchantmentId];
  if (!enchantment) return 0;

  const gemPower = SOUL_GEM_SIZES[soulGemSize].capacity;
  const soulPower = Math.min(soulLevel, gemPower);
  
  // Base formula: baseMagnitude * (1 + skill/100) * (soulPower/5) * scalingFactor
  const skillMultiplier = 1 + (enchantingSkill / 100);
  const soulMultiplier = soulPower / 5;
  
  return Math.floor(enchantment.baseMagnitude * skillMultiplier * soulMultiplier * enchantment.scalingFactor);
}

/**
 * Enchant an item
 */
export function enchantItem(
  state: EnchantingState,
  item: InventoryItem,
  enchantmentId: string,
  soulGemId: string,
  newItemName?: string
): { 
  state: EnchantingState; 
  success: boolean; 
  message: string; 
  enchantedItem?: InventoryItem;
  xpGained: number;
} {
  const enchantment = ENCHANTMENTS[enchantmentId];
  if (!enchantment) {
    return { state, success: false, message: 'Unknown enchantment.', xpGained: 0 };
  }

  // Check if enchantment is learned
  const learned = state.learnedEnchantments.find(e => e.enchantmentId === enchantmentId);
  if (!learned) {
    return { state, success: false, message: `You haven't learned ${enchantment.name} yet.`, xpGained: 0 };
  }

  // Find soul gem
  const gem = state.soulGems.find(g => g.id === soulGemId);
  if (!gem) {
    return { state, success: false, message: 'Soul gem not found.', xpGained: 0 };
  }
  if (!gem.filled) {
    return { state, success: false, message: 'You need a filled soul gem to enchant items.', xpGained: 0 };
  }

  // Check item type compatibility
  const itemType = item.type;
  if (enchantment.type === 'weapon' && itemType !== 'weapon') {
    return { state, success: false, message: 'This enchantment can only be applied to weapons.', xpGained: 0 };
  }
  if (enchantment.type === 'armor' && itemType !== 'armor' && itemType !== 'jewelry') {
    return { state, success: false, message: 'This enchantment can only be applied to armor or jewelry.', xpGained: 0 };
  }

  // Calculate magnitude
  const magnitude = calculateEnchantmentMagnitude(
    enchantmentId,
    state.enchantingLevel,
    gem.size,
    gem.soulLevel || 1
  );

  // Create enchanted item
  const enchantedItem: InventoryItem = {
    ...item,
    id: `${item.id}_enchanted_${Date.now()}`,
    name: newItemName || `${item.name} of ${enchantment.name.replace('Fortify ', '')}`,
    rarity: item.rarity === 'common' ? 'uncommon' : item.rarity === 'uncommon' ? 'rare' : item.rarity,
    enchantments: [
      ...(item.enchantments || []),
      {
        id: enchantmentId,
        name: enchantment.name,
        magnitude,
        effect: enchantment.effect,
      }
    ],
    effects: [
      ...(item.effects || []),
      `${enchantment.name}: ${magnitude}`,
    ],
    value: item.value + (magnitude * 10),
  };

  // Update state
  const updatedLearned = state.learnedEnchantments.map(e =>
    e.enchantmentId === enchantmentId
      ? { ...e, timesUsed: e.timesUsed + 1 }
      : e
  );

  const xpGained = 25 + (gem.soulLevel || 1) * 10;

  // Use special gems differently
  const isReusable = gem.size === 'azura_star';
  const newSoulGems = isReusable
    ? state.soulGems.map(g => g.id === soulGemId ? { ...g, filled: false, soulLevel: undefined, soulName: undefined } : g)
    : state.soulGems.filter(g => g.id !== soulGemId);

  return {
    state: {
      ...state,
      learnedEnchantments: updatedLearned,
      soulGems: newSoulGems,
      totalItemsEnchanted: state.totalItemsEnchanted + 1,
    },
    success: true,
    message: `Created ${enchantedItem.name}!`,
    enchantedItem,
    xpGained,
  };
}

/**
 * Get all enchantments suitable for an item type
 */
export function getEnchantmentsForItemType(
  itemType: string,
  slot?: string
): Enchantment[] {
  return Object.values(ENCHANTMENTS).filter(e => {
    if (itemType === 'weapon') {
      return e.type === 'weapon';
    }
    if (itemType === 'armor' || itemType === 'jewelry') {
      if (e.type !== 'armor' && e.type !== 'jewelry') return false;
      if (slot && e.slot && !e.slot.includes(slot)) return false;
      return true;
    }
    return false;
  });
}

/**
 * Get learned enchantments with details
 */
export function getLearnedEnchantmentsWithDetails(state: EnchantingState): Array<{
  enchantment: Enchantment;
  learned: LearnedEnchantment;
}> {
  return state.learnedEnchantments
    .map(learned => {
      const enchantment = ENCHANTMENTS[learned.enchantmentId];
      if (!enchantment) return null;
      return { enchantment, learned };
    })
    .filter(Boolean) as Array<{ enchantment: Enchantment; learned: LearnedEnchantment }>;
}

/**
 * Get available soul gems (filled ones for enchanting)
 */
export function getFilledSoulGems(state: EnchantingState): SoulGem[] {
  return state.soulGems.filter(g => g.filled);
}

/**
 * Get empty soul gems (for soul trap)
 */
export function getEmptySoulGems(state: EnchantingState): SoulGem[] {
  return state.soulGems.filter(g => !g.filled);
}

/**
 * Find best soul gem for a creature
 */
export function findBestSoulGemForCreature(
  state: EnchantingState,
  creatureType: string
): SoulGem | null {
  const soulLevel = CREATURE_SOUL_LEVELS[creatureType.toLowerCase()] || 1;
  
  // Find smallest empty gem that can hold this soul
  const suitableGems = state.soulGems
    .filter(g => !g.filled && g.capacity >= soulLevel)
    .sort((a, b) => a.capacity - b.capacity);
  
  return suitableGems[0] || null;
}

/**
 * Convert soul gem to inventory item for display
 */
export function soulGemToInventoryItem(gem: SoulGem): InventoryItem {
  return {
    id: gem.id,
    name: gem.name,
    type: 'misc',
    rarity: gem.size === 'black' || gem.size === 'azura_star' ? 'epic' : gem.size === 'grand' ? 'rare' : 'common',
    description: gem.filled
      ? `Contains the soul of ${gem.soulName || 'a creature'}. Used for enchanting.`
      : 'An empty soul gem. Can capture souls with Soul Trap.',
    value: gem.value,
    weight: gem.size === 'azura_star' ? 0 : 0.5,
    effects: gem.filled ? [`Soul Level: ${gem.soulLevel}`] : [],
    quantity: 1,
  };
}
