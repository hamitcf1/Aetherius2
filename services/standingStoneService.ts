/**
 * Standing Stones Service
 * Skyrim's standing stone blessing system
 */

import { Character } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type StandingStoneType = 
  | 'warrior' | 'mage' | 'thief'
  | 'lord' | 'lady' | 'steed' | 'atronach' | 'ritual' | 'shadow'
  | 'lover' | 'apprentice' | 'tower' | 'serpent';

export interface StandingStonEffect {
  type: 'skill_boost' | 'attribute_boost' | 'ability' | 'power' | 'passive';
  target?: string; // Skill name or attribute
  value?: number;
  description: string;
}

export interface StandingStone {
  id: StandingStoneType;
  name: string;
  guardian: 'warrior' | 'mage' | 'thief';
  location: string;
  description: string;
  lore: string;
  effects: StandingStonEffect[];
  // Gameplay effects
  skillBoosts?: Record<string, number>; // Skill name -> percentage boost
  attributeBoosts?: Record<string, number>; // Attribute -> flat bonus
  specialAbility?: string;
  specialPower?: {
    name: string;
    description: string;
    cooldown: number; // In game hours (0 = once per day)
  };
}

export interface StandingStoneState {
  activeStone: StandingStoneType | null;
  discoveredStones: StandingStoneType[];
  activatedAt?: number;
  powerLastUsed?: number;
}

// ============================================================================
// STANDING STONE DEFINITIONS
// ============================================================================

export const STANDING_STONES: Record<StandingStoneType, StandingStone> = {
  // GUARDIAN STONES (near Riverwood)
  warrior: {
    id: 'warrior',
    name: 'The Warrior Stone',
    guardian: 'warrior',
    location: 'Guardian Stones, southwest of Riverwood',
    description: 'Those under the sign of The Warrior will learn combat skills faster.',
    lore: 'The Warrior is the first Guardian Constellation, and its Season is Last Seed when its Charges are the weakest.',
    effects: [
      { type: 'skill_boost', target: 'combat', value: 20, description: 'Combat skills increase 20% faster' }
    ],
    skillBoosts: {
      'One-Handed': 20,
      'Two-Handed': 20,
      'Archery': 20,
      'Block': 20,
      'Heavy Armor': 20,
      'Smithing': 20,
    },
  },
  
  mage: {
    id: 'mage',
    name: 'The Mage Stone',
    guardian: 'mage',
    location: 'Guardian Stones, southwest of Riverwood',
    description: 'Those under the sign of The Mage will learn magic skills faster.',
    lore: 'The Mage is the second Guardian Constellation, and its Season is Rain\'s Hand when its Charges are the weakest.',
    effects: [
      { type: 'skill_boost', target: 'magic', value: 20, description: 'Magic skills increase 20% faster' }
    ],
    skillBoosts: {
      'Destruction': 20,
      'Restoration': 20,
      'Alteration': 20,
      'Conjuration': 20,
      'Illusion': 20,
      'Enchanting': 20,
    },
  },
  
  thief: {
    id: 'thief',
    name: 'The Thief Stone',
    guardian: 'thief',
    location: 'Guardian Stones, southwest of Riverwood',
    description: 'Those under the sign of The Thief will learn stealth skills faster.',
    lore: 'The Thief is the last Guardian Constellation, and its Season is the darkest month of Evening Star.',
    effects: [
      { type: 'skill_boost', target: 'stealth', value: 20, description: 'Stealth skills increase 20% faster' }
    ],
    skillBoosts: {
      'Sneak': 20,
      'Lockpicking': 20,
      'Pickpocket': 20,
      'Light Armor': 20,
      'Alchemy': 20,
      'Speech': 20,
    },
  },

  // OTHER STANDING STONES
  lord: {
    id: 'lord',
    name: 'The Lord Stone',
    guardian: 'warrior',
    location: 'Mountain northeast of Morthal',
    description: 'The Lord Stone grants 50 points of damage resistance and 25% magic resistance.',
    lore: 'The Lord\'s Season is First Seed and its Charges are the Lady and the Steed.',
    effects: [
      { type: 'attribute_boost', target: 'armor', value: 50, description: '+50 Armor Rating' },
      { type: 'passive', description: '25% Magic Resistance' }
    ],
    attributeBoosts: {
      armor: 50,
      magicResist: 25,
    },
  },

  lady: {
    id: 'lady',
    name: 'The Lady Stone',
    guardian: 'warrior',
    location: 'Small island on Lake Ilinalta',
    description: 'The Lady Stone grants +25% faster Health and Stamina regeneration.',
    lore: 'The Lady\'s Season is Heartfire. The Lady is one of the Lord\'s Charges.',
    effects: [
      { type: 'passive', description: '+25% Health regeneration' },
      { type: 'passive', description: '+25% Stamina regeneration' }
    ],
    attributeBoosts: {
      healthRegen: 25,
      staminaRegen: 25,
    },
  },

  steed: {
    id: 'steed',
    name: 'The Steed Stone',
    guardian: 'warrior',
    location: 'Northwest of Solitude',
    description: 'The Steed Stone grants +100 carry weight and no movement penalty from armor.',
    lore: 'The Steed\'s Season is Mid Year. The Steed is one of the Lord\'s Charges.',
    effects: [
      { type: 'attribute_boost', target: 'carryWeight', value: 100, description: '+100 Carry Weight' },
      { type: 'passive', description: 'Equipped armor weighs nothing and causes no movement penalty' }
    ],
    attributeBoosts: {
      carryWeight: 100,
    },
    specialAbility: 'Armor weighs nothing',
  },

  atronach: {
    id: 'atronach',
    name: 'The Atronach Stone',
    guardian: 'mage',
    location: 'Volcanic tundra south of Windhelm',
    description: 'The Atronach Stone grants +50 Magicka and 50% Spell Absorption, but -50% Magicka regeneration.',
    lore: 'The Atronach (often called the Golem) is one of the Mage\'s Charges.',
    effects: [
      { type: 'attribute_boost', target: 'magicka', value: 50, description: '+50 Magicka' },
      { type: 'passive', description: '50% Spell Absorption' },
      { type: 'passive', description: '-50% Magicka regeneration' }
    ],
    attributeBoosts: {
      magicka: 50,
      spellAbsorption: 50,
      magickaRegen: -50,
    },
  },

  ritual: {
    id: 'ritual',
    name: 'The Ritual Stone',
    guardian: 'mage',
    location: 'East of Whiterun, near the hot springs',
    description: 'The Ritual Stone can reanimate all nearby corpses once per day.',
    lore: 'The Ritual is one of the Mage\'s Charges. Its Season is Morning Star.',
    effects: [
      { type: 'power', description: 'Once per day, reanimate all nearby dead to fight for you' }
    ],
    specialPower: {
      name: 'Raise Dead',
      description: 'Reanimate all nearby corpses to fight for you for 200 seconds.',
      cooldown: 0, // Once per day
    },
  },

  shadow: {
    id: 'shadow',
    name: 'The Shadow Stone',
    guardian: 'thief',
    location: 'South of Riften',
    description: 'The Shadow Stone grants the ability to become invisible once per day.',
    lore: 'The Shadow is one of the Thief\'s Charges. Its Season is Second Seed.',
    effects: [
      { type: 'power', description: 'Once per day, become invisible for 60 seconds' }
    ],
    specialPower: {
      name: 'Shadowcloak',
      description: 'Become invisible for 60 seconds.',
      cooldown: 0, // Once per day
    },
  },

  lover: {
    id: 'lover',
    name: 'The Lover Stone',
    guardian: 'thief',
    location: 'East of Markarth',
    description: 'The Lover Stone grants +15% faster skill improvement to all skills.',
    lore: 'The Lover is one of the Thief\'s Charges. Its Season is Sun\'s Dawn.',
    effects: [
      { type: 'skill_boost', target: 'all', value: 15, description: 'All skills improve 15% faster' }
    ],
    skillBoosts: {
      'All Skills': 15,
    },
  },

  apprentice: {
    id: 'apprentice',
    name: 'The Apprentice Stone',
    guardian: 'mage',
    location: 'Northwest of Morthal, in the marshes',
    description: 'The Apprentice Stone grants +100% Magicka regeneration but +100% weakness to Magic.',
    lore: 'The Apprentice is one of the Mage\'s Charges. Its Season is Sun\'s Height.',
    effects: [
      { type: 'passive', description: '+100% Magicka regeneration' },
      { type: 'passive', description: '+100% weakness to Magic' }
    ],
    attributeBoosts: {
      magickaRegen: 100,
      magicWeakness: 100,
    },
  },

  tower: {
    id: 'tower',
    name: 'The Tower Stone',
    guardian: 'thief',
    location: 'Between Winterhold and Dawnstar',
    description: 'The Tower Stone grants the ability to automatically open Expert or lower locks once per day.',
    lore: 'The Tower is one of the Thief\'s Charges. Its Season is Frostfall.',
    effects: [
      { type: 'power', description: 'Once per day, automatically open an Expert or lower lock' }
    ],
    specialPower: {
      name: 'Tower Key',
      description: 'Automatically opens an Expert or lower lock.',
      cooldown: 0, // Once per day
    },
  },

  serpent: {
    id: 'serpent',
    name: 'The Serpent Stone',
    guardian: 'thief', // Actually doesn't belong to any guardian
    location: 'Small island northeast of Winterhold',
    description: 'The Serpent Stone grants a ranged paralyzing poison attack once per day.',
    lore: 'The Serpent wanders the skies and has no Season, though its Charges are Sky, Shadow, and Thief.',
    effects: [
      { type: 'power', description: 'Once per day, use a ranged paralyzing poison attack' }
    ],
    specialPower: {
      name: 'Serpent\'s Kiss',
      description: 'Paralyzes the target for 5 seconds and deals 25 points of damage.',
      cooldown: 0, // Once per day
    },
  },
};

// ============================================================================
// STANDING STONE FUNCTIONS
// ============================================================================

/**
 * Initialize standing stone state
 */
export function initializeStandingStoneState(): StandingStoneState {
  return {
    activeStone: null,
    discoveredStones: [],
    activatedAt: undefined,
    powerLastUsed: undefined,
  };
}

/**
 * Get standing stone state from character or initialize
 */
export function getStandingStoneState(character: Character): StandingStoneState {
  if (character.standingStoneState) {
    return character.standingStoneState as StandingStoneState;
  }
  return initializeStandingStoneState();
}

/**
 * Discover a standing stone
 */
export function discoverStandingStone(
  state: StandingStoneState,
  stoneId: StandingStoneType
): { state: StandingStoneState; discovered: boolean; message: string } {
  if (state.discoveredStones.includes(stoneId)) {
    return {
      state,
      discovered: false,
      message: `You have already discovered ${STANDING_STONES[stoneId].name}.`,
    };
  }

  const stone = STANDING_STONES[stoneId];
  return {
    state: {
      ...state,
      discoveredStones: [...state.discoveredStones, stoneId],
    },
    discovered: true,
    message: `You discovered ${stone.name}! ${stone.description}`,
  };
}

/**
 * Activate a standing stone blessing
 */
export function activateStandingStone(
  state: StandingStoneState,
  stoneId: StandingStoneType
): { state: StandingStoneState; success: boolean; message: string; previousStone?: StandingStoneType } {
  const stone = STANDING_STONES[stoneId];
  if (!stone) {
    return { state, success: false, message: 'Unknown standing stone.' };
  }

  const previousStone = state.activeStone;
  const newState: StandingStoneState = {
    ...state,
    activeStone: stoneId,
    activatedAt: Date.now(),
    // Reset power cooldown on new stone activation
    powerLastUsed: undefined,
    // Auto-discover if not already
    discoveredStones: state.discoveredStones.includes(stoneId) 
      ? state.discoveredStones 
      : [...state.discoveredStones, stoneId],
  };

  let message = `You activated ${stone.name}!`;
  if (previousStone && previousStone !== stoneId) {
    message += ` (Replaced ${STANDING_STONES[previousStone].name})`;
  }

  return {
    state: newState,
    success: true,
    message,
    previousStone: previousStone || undefined,
  };
}

/**
 * Use standing stone power (once per day abilities)
 */
export function useStandingStonePower(
  state: StandingStoneState,
  currentGameTime: number // Game time in hours (day * 24 + hour)
): { state: StandingStoneState; success: boolean; message: string; power?: string } {
  if (!state.activeStone) {
    return { state, success: false, message: 'No standing stone is active.' };
  }

  const stone = STANDING_STONES[state.activeStone];
  if (!stone.specialPower) {
    return { state, success: false, message: `${stone.name} has no activatable power.` };
  }

  // Check cooldown (once per day = 24 game hours)
  if (state.powerLastUsed !== undefined) {
    const hoursSinceUse = currentGameTime - state.powerLastUsed;
    if (hoursSinceUse < 24) {
      const hoursRemaining = Math.ceil(24 - hoursSinceUse);
      return {
        state,
        success: false,
        message: `${stone.specialPower.name} is not ready yet. (${hoursRemaining} hours remaining)`,
      };
    }
  }

  return {
    state: {
      ...state,
      powerLastUsed: currentGameTime,
    },
    success: true,
    message: `Used ${stone.specialPower.name}! ${stone.specialPower.description}`,
    power: stone.specialPower.name,
  };
}

/**
 * Get active stone effects for character stats
 */
export function getActiveStoneEffects(state: StandingStoneState): {
  skillBoosts: Record<string, number>;
  attributeBoosts: Record<string, number>;
  specialAbilities: string[];
  specialPower?: { name: string; description: string; available: boolean };
} {
  if (!state.activeStone) {
    return { skillBoosts: {}, attributeBoosts: {}, specialAbilities: [] };
  }

  const stone = STANDING_STONES[state.activeStone];
  return {
    skillBoosts: stone.skillBoosts || {},
    attributeBoosts: stone.attributeBoosts || {},
    specialAbilities: stone.specialAbility ? [stone.specialAbility] : [],
    specialPower: stone.specialPower ? {
      ...stone.specialPower,
      available: state.powerLastUsed === undefined || true, // Simplified - would need game time
    } : undefined,
  };
}

/**
 * Get all standing stones with discovery/active status
 */
export function getAllStandingStonesWithStatus(state: StandingStoneState): Array<{
  stone: StandingStone;
  discovered: boolean;
  active: boolean;
}> {
  return Object.values(STANDING_STONES).map(stone => ({
    stone,
    discovered: state.discoveredStones.includes(stone.id),
    active: state.activeStone === stone.id,
  }));
}

/**
 * Get stones grouped by guardian
 */
export function getStonesByGuardian(): Record<string, StandingStone[]> {
  const groups: Record<string, StandingStone[]> = {
    warrior: [],
    mage: [],
    thief: [],
  };

  Object.values(STANDING_STONES).forEach(stone => {
    groups[stone.guardian].push(stone);
  });

  return groups;
}

/**
 * Calculate XP modifier from standing stone
 */
export function getXPModifierForSkill(state: StandingStoneState, skillName: string): number {
  if (!state.activeStone) return 0;

  const stone = STANDING_STONES[state.activeStone];
  if (!stone.skillBoosts) return 0;

  // Check for specific skill boost
  if (stone.skillBoosts[skillName]) {
    return stone.skillBoosts[skillName];
  }

  // Check for "All Skills" boost (Lover Stone)
  if (stone.skillBoosts['All Skills']) {
    return stone.skillBoosts['All Skills'];
  }

  return 0;
}

/**
 * Check if standing stone power is available
 */
export function isPowerAvailable(state: StandingStoneState, currentGameTime: number): boolean {
  if (!state.activeStone) return false;
  
  const stone = STANDING_STONES[state.activeStone];
  if (!stone.specialPower) return false;

  if (state.powerLastUsed === undefined) return true;

  const hoursSinceUse = currentGameTime - state.powerLastUsed;
  return hoursSinceUse >= 24;
}

/**
 * Get recommended stone based on character build
 */
export function getRecommendedStone(character: Character): StandingStoneType {
  // Simple recommendation based on character class/archetype
  const archetype = character.archetype?.toLowerCase() || '';
  
  if (archetype.includes('mage') || archetype.includes('wizard') || archetype.includes('sorcerer')) {
    return 'mage';
  }
  if (archetype.includes('thief') || archetype.includes('rogue') || archetype.includes('assassin')) {
    return 'thief';
  }
  if (archetype.includes('warrior') || archetype.includes('knight') || archetype.includes('barbarian')) {
    return 'warrior';
  }

  // Default to Warrior for combat characters
  return 'warrior';
}
