/**
 * Standing Stones Service
 * Guardian stones and blessing effects throughout Skyrim
 */

import { Skill } from '../types';

// ========== TYPES ==========

export type StoneType = 
  | 'guardian' // The main 13 stones
  | 'unique'; // Special stones like Serpent

export type StoneGroup = 
  | 'thief' | 'mage' | 'warrior' | 'special';

export interface StandingStone {
  id: string;
  name: string;
  type: StoneType;
  group: StoneGroup;
  location: string;
  coordinates: { x: number; y: number }; // Map coordinates
  description: string;
  loreText: string;
  effects: StoneEffect[];
  activeAbility?: StoneActiveAbility;
}

export interface StoneEffect {
  type: 'skill_rate' | 'stat_bonus' | 'regen_bonus' | 'special';
  target?: Skill | 'health' | 'stamina' | 'magicka' | 'carry_weight' | 'armor' | 'all_skills';
  magnitude: number;
  description: string;
}

export interface StoneActiveAbility {
  name: string;
  description: string;
  cooldown: number; // In hours (game time)
  duration: number; // In seconds
  effect: string;
}

export interface StandingStoneState {
  activeStone?: string;
  discoveredStones: string[];
  stoneActivations: Record<string, number>; // Stone ID -> activation count
  lastAbilityUse?: number;
  abilityOnCooldown: boolean;
}

// ========== STANDING STONES DATABASE ==========

export const STANDING_STONES: Record<string, StandingStone> = {
  // === GUARDIAN STONES (Near Riverwood) ===
  warrior_stone: {
    id: 'warrior_stone',
    name: 'The Warrior Stone',
    type: 'guardian',
    group: 'warrior',
    location: 'Guardian Stones, southwest of Riverwood',
    coordinates: { x: 45, y: 68 },
    description: 'Those under the sign of The Warrior will learn combat skills faster.',
    loreText: 'The Warrior is the first Guardian Constellation and he protects his charges during their decans of war.',
    effects: [
      {
        type: 'skill_rate',
        target: 'one-handed',
        magnitude: 20,
        description: 'One-Handed skills improve 20% faster',
      },
      {
        type: 'skill_rate',
        target: 'two-handed',
        magnitude: 20,
        description: 'Two-Handed skills improve 20% faster',
      },
      {
        type: 'skill_rate',
        target: 'archery',
        magnitude: 20,
        description: 'Archery skills improve 20% faster',
      },
      {
        type: 'skill_rate',
        target: 'block',
        magnitude: 20,
        description: 'Block skills improve 20% faster',
      },
      {
        type: 'skill_rate',
        target: 'smithing',
        magnitude: 20,
        description: 'Smithing skills improve 20% faster',
      },
      {
        type: 'skill_rate',
        target: 'heavy-armor',
        magnitude: 20,
        description: 'Heavy Armor skills improve 20% faster',
      },
    ],
  },
  mage_stone: {
    id: 'mage_stone',
    name: 'The Mage Stone',
    type: 'guardian',
    group: 'mage',
    location: 'Guardian Stones, southwest of Riverwood',
    coordinates: { x: 45, y: 68 },
    description: 'Those under the sign of The Mage will learn magic skills faster.',
    loreText: 'The Mage is the second Guardian Constellation. His charges are blessed with greater knowledge and understanding.',
    effects: [
      {
        type: 'skill_rate',
        target: 'destruction',
        magnitude: 20,
        description: 'Destruction skills improve 20% faster',
      },
      {
        type: 'skill_rate',
        target: 'restoration',
        magnitude: 20,
        description: 'Restoration skills improve 20% faster',
      },
      {
        type: 'skill_rate',
        target: 'conjuration',
        magnitude: 20,
        description: 'Conjuration skills improve 20% faster',
      },
      {
        type: 'skill_rate',
        target: 'alteration',
        magnitude: 20,
        description: 'Alteration skills improve 20% faster',
      },
      {
        type: 'skill_rate',
        target: 'illusion',
        magnitude: 20,
        description: 'Illusion skills improve 20% faster',
      },
      {
        type: 'skill_rate',
        target: 'enchanting',
        magnitude: 20,
        description: 'Enchanting skills improve 20% faster',
      },
    ],
  },
  thief_stone: {
    id: 'thief_stone',
    name: 'The Thief Stone',
    type: 'guardian',
    group: 'thief',
    location: 'Guardian Stones, southwest of Riverwood',
    coordinates: { x: 45, y: 68 },
    description: 'Those under the sign of The Thief will learn stealth skills faster.',
    loreText: 'The Thief is the last Guardian Constellation. Its charges need a quick hand and quicker wits.',
    effects: [
      {
        type: 'skill_rate',
        target: 'sneak',
        magnitude: 20,
        description: 'Sneak skills improve 20% faster',
      },
      {
        type: 'skill_rate',
        target: 'lockpicking',
        magnitude: 20,
        description: 'Lockpicking skills improve 20% faster',
      },
      {
        type: 'skill_rate',
        target: 'pickpocket',
        magnitude: 20,
        description: 'Pickpocket skills improve 20% faster',
      },
      {
        type: 'skill_rate',
        target: 'light-armor',
        magnitude: 20,
        description: 'Light Armor skills improve 20% faster',
      },
      {
        type: 'skill_rate',
        target: 'speech',
        magnitude: 20,
        description: 'Speech skills improve 20% faster',
      },
      {
        type: 'skill_rate',
        target: 'alchemy',
        magnitude: 20,
        description: 'Alchemy skills improve 20% faster',
      },
    ],
  },
  
  // === SPECIAL STONES ===
  lover_stone: {
    id: 'lover_stone',
    name: 'The Lover Stone',
    type: 'guardian',
    group: 'special',
    location: 'East of Markarth',
    coordinates: { x: 25, y: 45 },
    description: 'Those under the sign of The Lover learn all skills slightly faster.',
    loreText: 'The Lover is one of the firmament\'s mysteries. Bathed in Her light, one learns and grows with passion.',
    effects: [
      {
        type: 'skill_rate',
        target: 'all_skills',
        magnitude: 15,
        description: 'All skills improve 15% faster',
      },
    ],
  },
  lord_stone: {
    id: 'lord_stone',
    name: 'The Lord Stone',
    type: 'guardian',
    group: 'warrior',
    location: 'East of Morthal',
    coordinates: { x: 38, y: 35 },
    description: 'Those under the sign of The Lord are blessed with increased armor and magic resistance.',
    loreText: 'The Lord\'s influence brings both protection and domination.',
    effects: [
      {
        type: 'stat_bonus',
        target: 'armor',
        magnitude: 50,
        description: '+50 Armor Rating',
      },
      {
        type: 'special',
        magnitude: 25,
        description: '25% Magic Resistance',
      },
    ],
  },
  lady_stone: {
    id: 'lady_stone',
    name: 'The Lady Stone',
    type: 'guardian',
    group: 'thief',
    location: 'Island in Lake Ilinalta',
    coordinates: { x: 48, y: 62 },
    description: 'Those under the sign of The Lady regenerate health and stamina more quickly.',
    loreText: 'The Lady\'s blessing brings swift recovery of both body and spirit.',
    effects: [
      {
        type: 'regen_bonus',
        target: 'health',
        magnitude: 25,
        description: 'Regenerate Health 25% faster',
      },
      {
        type: 'regen_bonus',
        target: 'stamina',
        magnitude: 25,
        description: 'Regenerate Stamina 25% faster',
      },
    ],
  },
  steed_stone: {
    id: 'steed_stone',
    name: 'The Steed Stone',
    type: 'guardian',
    group: 'thief',
    location: 'Northwest of Solitude',
    coordinates: { x: 22, y: 18 },
    description: 'Those under the sign of The Steed can carry more and move faster.',
    loreText: 'The Steed grants its charges swiftness of foot and strength of back.',
    effects: [
      {
        type: 'stat_bonus',
        target: 'carry_weight',
        magnitude: 100,
        description: '+100 Carry Weight',
      },
      {
        type: 'special',
        magnitude: 0,
        description: 'Equipped armor is weightless and causes no movement penalty',
      },
    ],
  },
  apprentice_stone: {
    id: 'apprentice_stone',
    name: 'The Apprentice Stone',
    type: 'guardian',
    group: 'mage',
    location: 'Hjaalmarch marshes',
    coordinates: { x: 35, y: 32 },
    description: 'Those under the sign of The Apprentice recover Magicka faster, but are more susceptible to magic damage.',
    loreText: 'The Apprentice\'s star is a double-edged blade, granting great power at a price.',
    effects: [
      {
        type: 'regen_bonus',
        target: 'magicka',
        magnitude: 100,
        description: 'Regenerate Magicka 100% faster',
      },
      {
        type: 'special',
        magnitude: -50,
        description: '50% weakness to Magic',
      },
    ],
  },
  atronach_stone: {
    id: 'atronach_stone',
    name: 'The Atronach Stone',
    type: 'guardian',
    group: 'mage',
    location: 'Eastmarch hot springs',
    coordinates: { x: 72, y: 45 },
    description: 'Those under the sign of The Atronach absorb a portion of incoming spell damage, but recover magicka slowly.',
    loreText: 'The Atronach stone fortifies the mind against magical assault.',
    effects: [
      {
        type: 'stat_bonus',
        target: 'magicka',
        magnitude: 50,
        description: '+50 Magicka',
      },
      {
        type: 'special',
        magnitude: 50,
        description: '50% Spell Absorption',
      },
      {
        type: 'regen_bonus',
        target: 'magicka',
        magnitude: -50,
        description: 'Magicka regenerates 50% slower',
      },
    ],
  },
  ritual_stone: {
    id: 'ritual_stone',
    name: 'The Ritual Stone',
    type: 'guardian',
    group: 'mage',
    location: 'East of Whiterun',
    coordinates: { x: 55, y: 52 },
    description: 'Those under the sign of The Ritual can reanimate nearby dead to fight for them.',
    loreText: 'The Ritual stone bridges the gap between life and death.',
    effects: [],
    activeAbility: {
      name: 'Raise Dead',
      description: 'Once a day, reanimate all nearby dead bodies to fight for you for 200 seconds.',
      cooldown: 24,
      duration: 200,
      effect: 'mass_reanimate',
    },
  },
  shadow_stone: {
    id: 'shadow_stone',
    name: 'The Shadow Stone',
    type: 'guardian',
    group: 'thief',
    location: 'South of Riften',
    coordinates: { x: 78, y: 72 },
    description: 'Those under the sign of The Shadow can become invisible once a day.',
    loreText: 'The Shadow grants the power to become one with darkness.',
    effects: [],
    activeAbility: {
      name: 'Shadowcloak',
      description: 'Once a day, become invisible for 60 seconds.',
      cooldown: 24,
      duration: 60,
      effect: 'invisibility',
    },
  },
  tower_stone: {
    id: 'tower_stone',
    name: 'The Tower Stone',
    type: 'guardian',
    group: 'thief',
    location: 'On a mountain between Dawnstar and Winterhold',
    coordinates: { x: 58, y: 22 },
    description: 'Those under the sign of The Tower can unlock any expert lock once a day.',
    loreText: 'The Tower\'s influence opens all doors, both physical and mystical.',
    effects: [],
    activeAbility: {
      name: 'Tower Key',
      description: 'Once a day, automatically open an expert or lower lock.',
      cooldown: 24,
      duration: 0,
      effect: 'unlock_expert',
    },
  },
  serpent_stone: {
    id: 'serpent_stone',
    name: 'The Serpent Stone',
    type: 'unique',
    group: 'special',
    location: 'Sea of Ghosts, far northeast',
    coordinates: { x: 85, y: 15 },
    description: 'Those under the sign of The Serpent can poison their enemies once a day.',
    loreText: 'The Serpent wanders the sky, granting its strange powers to those who seek it.',
    effects: [],
    activeAbility: {
      name: 'Serpent\'s Venom',
      description: 'Once a day, poison a target for 25 damage for 5 seconds and paralyze them.',
      cooldown: 24,
      duration: 5,
      effect: 'poison_paralyze',
    },
  },
};

// ========== STATE MANAGEMENT ==========

export function getInitialStandingStoneState(): StandingStoneState {
  return {
    activeStone: undefined,
    discoveredStones: [],
    stoneActivations: {},
    abilityOnCooldown: false,
  };
}

export function discoverStone(
  state: StandingStoneState,
  stoneId: string
): { newState: StandingStoneState; message: string; alreadyDiscovered: boolean } {
  const stone = STANDING_STONES[stoneId];
  if (!stone) {
    return {
      newState: state,
      message: 'Unknown standing stone.',
      alreadyDiscovered: false,
    };
  }
  
  const alreadyDiscovered = state.discoveredStones.includes(stoneId);
  
  if (alreadyDiscovered) {
    return {
      newState: state,
      message: `You have already discovered ${stone.name}.`,
      alreadyDiscovered: true,
    };
  }
  
  return {
    newState: {
      ...state,
      discoveredStones: [...state.discoveredStones, stoneId],
    },
    message: `You have discovered ${stone.name}! ${stone.description}`,
    alreadyDiscovered: false,
  };
}

export function activateStone(
  state: StandingStoneState,
  stoneId: string
): { newState: StandingStoneState; message: string; effects: StoneEffect[] } {
  const stone = STANDING_STONES[stoneId];
  if (!stone) {
    return {
      newState: state,
      message: 'Unknown standing stone.',
      effects: [],
    };
  }
  
  const previousStone = state.activeStone ? STANDING_STONES[state.activeStone] : null;
  
  let message = `You activate ${stone.name}.`;
  if (previousStone && previousStone.id !== stone.id) {
    message += ` The blessing of ${previousStone.name} fades.`;
  }
  
  // Add effect descriptions
  if (stone.effects.length > 0) {
    message += '\n\nBlessing received:';
    stone.effects.forEach(effect => {
      message += `\n• ${effect.description}`;
    });
  }
  
  if (stone.activeAbility) {
    message += `\n• Power: ${stone.activeAbility.name} - ${stone.activeAbility.description}`;
  }
  
  const activations = state.stoneActivations[stoneId] || 0;
  
  // Ensure stone is in discovered list
  const discoveredStones = state.discoveredStones.includes(stoneId)
    ? state.discoveredStones
    : [...state.discoveredStones, stoneId];
  
  return {
    newState: {
      ...state,
      activeStone: stoneId,
      discoveredStones,
      stoneActivations: {
        ...state.stoneActivations,
        [stoneId]: activations + 1,
      },
      abilityOnCooldown: false, // Reset cooldown when changing stones
    },
    message,
    effects: stone.effects,
  };
}

export function useStoneAbility(
  state: StandingStoneState,
  currentTime: number
): { newState: StandingStoneState; success: boolean; message: string; ability?: StoneActiveAbility } {
  if (!state.activeStone) {
    return {
      newState: state,
      success: false,
      message: 'You have no standing stone blessing active.',
    };
  }
  
  const stone = STANDING_STONES[state.activeStone];
  if (!stone.activeAbility) {
    return {
      newState: state,
      success: false,
      message: `${stone.name} does not grant an active power.`,
    };
  }
  
  // Check cooldown
  if (state.lastAbilityUse && state.abilityOnCooldown) {
    const hoursSinceUse = (currentTime - state.lastAbilityUse) / (1000 * 60 * 60);
    if (hoursSinceUse < stone.activeAbility.cooldown) {
      const hoursRemaining = Math.ceil(stone.activeAbility.cooldown - hoursSinceUse);
      return {
        newState: state,
        success: false,
        message: `${stone.activeAbility.name} is not ready. ${hoursRemaining} hours remaining.`,
      };
    }
  }
  
  return {
    newState: {
      ...state,
      lastAbilityUse: currentTime,
      abilityOnCooldown: true,
    },
    success: true,
    message: `You use ${stone.activeAbility.name}! ${stone.activeAbility.description}`,
    ability: stone.activeAbility,
  };
}

export function resetAbilityCooldown(
  state: StandingStoneState
): StandingStoneState {
  return {
    ...state,
    abilityOnCooldown: false,
    lastAbilityUse: undefined,
  };
}

// ========== UTILITY FUNCTIONS ==========

export function getStonesByGroup(group: StoneGroup): StandingStone[] {
  return Object.values(STANDING_STONES).filter(s => s.group === group);
}

export function getGuardianStones(): StandingStone[] {
  return Object.values(STANDING_STONES).filter(s => s.type === 'guardian');
}

export function getActiveStoneEffects(state: StandingStoneState): StoneEffect[] {
  if (!state.activeStone) return [];
  const stone = STANDING_STONES[state.activeStone];
  return stone ? stone.effects : [];
}

export function getSkillRateBonus(state: StandingStoneState, skill: Skill): number {
  if (!state.activeStone) return 0;
  
  const stone = STANDING_STONES[state.activeStone];
  if (!stone) return 0;
  
  for (const effect of stone.effects) {
    if (effect.type === 'skill_rate') {
      if (effect.target === 'all_skills' || effect.target === skill) {
        return effect.magnitude;
      }
    }
  }
  
  return 0;
}

export function getStatBonus(
  state: StandingStoneState,
  stat: 'health' | 'stamina' | 'magicka' | 'carry_weight' | 'armor'
): number {
  if (!state.activeStone) return 0;
  
  const stone = STANDING_STONES[state.activeStone];
  if (!stone) return 0;
  
  for (const effect of stone.effects) {
    if (effect.type === 'stat_bonus' && effect.target === stat) {
      return effect.magnitude;
    }
  }
  
  return 0;
}

export function getRegenBonus(
  state: StandingStoneState,
  stat: 'health' | 'stamina' | 'magicka'
): number {
  if (!state.activeStone) return 0;
  
  const stone = STANDING_STONES[state.activeStone];
  if (!stone) return 0;
  
  let totalBonus = 0;
  for (const effect of stone.effects) {
    if (effect.type === 'regen_bonus' && effect.target === stat) {
      totalBonus += effect.magnitude;
    }
  }
  
  return totalBonus;
}

export function getStoneDescription(stoneId: string): string {
  const stone = STANDING_STONES[stoneId];
  if (!stone) return 'Unknown standing stone.';
  
  let desc = `${stone.name}\n${stone.description}\n\nLocation: ${stone.location}\n\n"${stone.loreText}"`;
  
  if (stone.effects.length > 0) {
    desc += '\n\nEffects:';
    stone.effects.forEach(e => {
      desc += `\n• ${e.description}`;
    });
  }
  
  if (stone.activeAbility) {
    desc += `\n\nPower: ${stone.activeAbility.name}\n${stone.activeAbility.description}`;
  }
  
  return desc;
}

export function getUndiscoveredStones(state: StandingStoneState): StandingStone[] {
  return Object.values(STANDING_STONES).filter(
    s => !state.discoveredStones.includes(s.id)
  );
}

export function getNearbyStone(
  playerX: number,
  playerY: number,
  range: number = 10
): StandingStone | null {
  for (const stone of Object.values(STANDING_STONES)) {
    const distance = Math.sqrt(
      Math.pow(stone.coordinates.x - playerX, 2) +
      Math.pow(stone.coordinates.y - playerY, 2)
    );
    if (distance <= range) {
      return stone;
    }
  }
  return null;
}
