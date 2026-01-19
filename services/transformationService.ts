/**
 * Transformation Service
 * 
 * Handles werewolf and vampire transformations, powers, and progression.
 * Based on Skyrim's lycanthropy and vampirism systems.
 */

// Transformation Types
export type TransformationType = 'werewolf' | 'vampire' | 'vampire_lord' | null;

// Werewolf Perks
export interface WerewolfPerk {
  id: string;
  name: string;
  description: string;
  requiredFeedings: number;
  requiredPerks: string[];
  effects: {
    healthBonus?: number;
    staminaBonus?: number;
    damageBonus?: number;
    duration?: number; // Extra seconds in beast form
    special?: string;
  };
}

// Vampire Perks  
export interface VampirePerk {
  id: string;
  name: string;
  description: string;
  requiredLevel: number; // Vampire Lord level
  requiredPerks: string[];
  tree: 'melee' | 'magic';
  effects: {
    healthBonus?: number;
    magickaBonus?: number;
    damageBonus?: number;
    special?: string;
  };
}

// Transformation State
export interface TransformationState {
  type: TransformationType;
  // Werewolf data
  werewolf?: {
    active: boolean; // Currently in beast form
    feedingCount: number;
    unlockedPerks: string[];
    lastTransformTime: string | null;
    transformCooldown: boolean;
    beastFormDuration: number; // Seconds remaining
  };
  // Vampire data
  vampire?: {
    stage: 1 | 2 | 3 | 4; // 1 = recently fed, 4 = starving (most powerful but hated)
    vampireLordActive: boolean;
    feedingCount: number;
    vampireLordLevel: number;
    unlockedPerks: string[];
    lastFedTime: string | null;
    dawnDamageMultiplier: number;
    isSeranaQuest?: boolean; // Dawnguard storyline
  };
  // Cure progress
  seekingCure: boolean;
  cureProgress: number;
}

// Werewolf Perk Definitions
export const WEREWOLF_PERKS: Record<string, WerewolfPerk> = {
  // Base tree
  'animal_vigor': {
    id: 'animal_vigor',
    name: 'Animal Vigor',
    description: '+100 Health and Stamina in beast form',
    requiredFeedings: 5,
    requiredPerks: [],
    effects: { healthBonus: 100, staminaBonus: 100 }
  },
  'gorging': {
    id: 'gorging',
    name: 'Gorging',
    description: 'Feeding heals twice as much health',
    requiredFeedings: 10,
    requiredPerks: ['animal_vigor'],
    effects: { special: 'double_heal_on_feed' }
  },
  'savage_feeding': {
    id: 'savage_feeding',
    name: 'Savage Feeding',
    description: 'Able to feed on most dead creatures, extending time as beast',
    requiredFeedings: 15,
    requiredPerks: ['gorging'],
    effects: { special: 'feed_on_creatures', duration: 30 }
  },
  'totem_of_ice_brothers': {
    id: 'totem_of_ice_brothers',
    name: 'Totem of Ice Brothers',
    description: 'Summon ice wolves with Howl of the Pack',
    requiredFeedings: 15,
    requiredPerks: ['animal_vigor'],
    effects: { special: 'summon_ice_wolves' }
  },
  'totem_of_the_hunt': {
    id: 'totem_of_the_hunt',
    name: 'Totem of the Hunt',
    description: 'Howl of the Pack detects all creatures',
    requiredFeedings: 15,
    requiredPerks: ['animal_vigor'],
    effects: { special: 'detect_all_creatures' }
  },
  'totem_of_terror': {
    id: 'totem_of_terror',
    name: 'Totem of Terror',
    description: 'Howl of Terror affects even higher level creatures',
    requiredFeedings: 15,
    requiredPerks: ['animal_vigor'],
    effects: { special: 'improved_fear' }
  },
  'bestial_strength_1': {
    id: 'bestial_strength_1',
    name: 'Bestial Strength',
    description: 'Do 25% more damage in beast form',
    requiredFeedings: 20,
    requiredPerks: ['totem_of_ice_brothers', 'totem_of_the_hunt', 'totem_of_terror'],
    effects: { damageBonus: 25 }
  },
  'bestial_strength_2': {
    id: 'bestial_strength_2',
    name: 'Bestial Strength II',
    description: 'Do 50% more damage in beast form',
    requiredFeedings: 30,
    requiredPerks: ['bestial_strength_1'],
    effects: { damageBonus: 50 }
  },
  'bestial_strength_3': {
    id: 'bestial_strength_3',
    name: 'Bestial Strength III',
    description: 'Do 75% more damage in beast form',
    requiredFeedings: 40,
    requiredPerks: ['bestial_strength_2'],
    effects: { damageBonus: 75 }
  },
  'bestial_strength_4': {
    id: 'bestial_strength_4',
    name: 'Bestial Strength IV',
    description: 'Do 100% more damage in beast form',
    requiredFeedings: 50,
    requiredPerks: ['bestial_strength_3'],
    effects: { damageBonus: 100 }
  }
};

// Vampire Perk Definitions (Vampire Lord form)
export const VAMPIRE_PERKS: Record<string, VampirePerk> = {
  // Magic tree (left side)
  'power_of_the_grave': {
    id: 'power_of_the_grave',
    name: 'Power of the Grave',
    description: '+50 Health, Magicka and Stamina as Vampire Lord',
    requiredLevel: 1,
    requiredPerks: [],
    tree: 'magic',
    effects: { healthBonus: 50, magickaBonus: 50 }
  },
  'detect_all_creatures': {
    id: 'detect_all_creatures',
    name: 'Detect All Creatures',
    description: 'Detect life spell works on undead, Daedra and automatons',
    requiredLevel: 2,
    requiredPerks: ['power_of_the_grave'],
    tree: 'magic',
    effects: { special: 'detect_all' }
  },
  'mist_form': {
    id: 'mist_form',
    name: 'Mist Form',
    description: 'Transform into an invulnerable cloud of mist while regenerating',
    requiredLevel: 4,
    requiredPerks: ['detect_all_creatures'],
    tree: 'magic',
    effects: { special: 'mist_form_invulnerable' }
  },
  'supernatural_reflexes': {
    id: 'supernatural_reflexes',
    name: 'Supernatural Reflexes',
    description: 'Slow time while in Vampire Lord form',
    requiredLevel: 6,
    requiredPerks: ['mist_form'],
    tree: 'magic',
    effects: { special: 'slow_time' }
  },
  'blood_healing': {
    id: 'blood_healing',
    name: 'Blood Healing',
    description: 'Killing with Vampiric Drain heals you',
    requiredLevel: 2,
    requiredPerks: ['power_of_the_grave'],
    tree: 'magic',
    effects: { special: 'drain_heal' }
  },
  'unearthly_will': {
    id: 'unearthly_will',
    name: 'Unearthly Will',
    description: 'Night powers cost 33% less',
    requiredLevel: 4,
    requiredPerks: ['blood_healing'],
    tree: 'magic',
    effects: { special: 'reduced_power_cost' }
  },
  'corpse_curse': {
    id: 'corpse_curse',
    name: 'Corpse Curse',
    description: 'Paralyze enemies with Vampiric Grip',
    requiredLevel: 7,
    requiredPerks: ['unearthly_will', 'supernatural_reflexes'],
    tree: 'magic',
    effects: { special: 'vampiric_grip_paralyze' }
  },
  // Melee tree (right side)
  'poison_talons': {
    id: 'poison_talons',
    name: 'Poison Talons',
    description: 'Melee attacks do 20 poison damage',
    requiredLevel: 2,
    requiredPerks: ['power_of_the_grave'],
    tree: 'melee',
    effects: { damageBonus: 20, special: 'poison_damage' }
  },
  'night_cloak': {
    id: 'night_cloak',
    name: 'Night Cloak',
    description: 'Surrounded by bats that damage nearby enemies',
    requiredLevel: 3,
    requiredPerks: ['poison_talons'],
    tree: 'melee',
    effects: { special: 'bat_cloak_damage' }
  },
  'vampiric_grip': {
    id: 'vampiric_grip',
    name: 'Vampiric Grip',
    description: 'Lift and throw enemies with telekinesis',
    requiredLevel: 5,
    requiredPerks: ['night_cloak'],
    tree: 'melee',
    effects: { special: 'telekinesis_grip' }
  },
  'summon_gargoyle': {
    id: 'summon_gargoyle',
    name: 'Summon Gargoyle',
    description: 'Summon a gargoyle to fight for you',
    requiredLevel: 6,
    requiredPerks: ['vampiric_grip'],
    tree: 'melee',
    effects: { special: 'summon_gargoyle' }
  }
};

// Vampire Stage Effects
export const VAMPIRE_STAGE_EFFECTS: Record<1 | 2 | 3 | 4, {
  name: string;
  description: string;
  resistFrost: number;
  weakFire: number;
  weakSunlight: number;
  illusion: number;
  sneak: number;
  vampireSeduction: boolean;
  embraceShadows: boolean;
  nightVision: boolean;
}> = {
  1: {
    name: 'Sated',
    description: 'Recently fed. Vampiric urges are satisfied.',
    resistFrost: 25,
    weakFire: 25,
    weakSunlight: 15,
    illusion: 0,
    sneak: 0,
    vampireSeduction: false,
    embraceShadows: false,
    nightVision: true
  },
  2: {
    name: 'Hungry',
    description: 'Growing thirsty. Powers strengthening.',
    resistFrost: 50,
    weakFire: 50,
    weakSunlight: 30,
    illusion: 10,
    sneak: 5,
    vampireSeduction: false,
    embraceShadows: false,
    nightVision: true
  },
  3: {
    name: 'Craving',
    description: 'The thirst burns. Mortals are becoming suspicious.',
    resistFrost: 75,
    weakFire: 75,
    weakSunlight: 45,
    illusion: 15,
    sneak: 10,
    vampireSeduction: true,
    embraceShadows: false,
    nightVision: true
  },
  4: {
    name: 'Starving',
    description: 'Blood rage consumes you. All mortals are hostile on sight.',
    resistFrost: 100,
    weakFire: 100,
    weakSunlight: 60,
    illusion: 20,
    sneak: 15,
    vampireSeduction: true,
    embraceShadows: true,
    nightVision: true
  }
};

// Initialize transformation state
export const initializeTransformationState = (): TransformationState => ({
  type: null,
  seekingCure: false,
  cureProgress: 0
});

// Get transformation state from character
export const getTransformationState = (characterData: unknown): TransformationState => {
  if (!characterData || typeof characterData !== 'object') {
    return initializeTransformationState();
  }
  const data = characterData as any;
  return {
    type: data.type ?? null,
    werewolf: data.werewolf,
    vampire: data.vampire,
    seekingCure: data.seekingCure ?? false,
    cureProgress: data.cureProgress ?? 0
  };
};

// Contract Lycanthropy (become werewolf)
export const contractLycanthropy = (
  state: TransformationState
): { success: boolean; message: string; newState: TransformationState } => {
  // Can't be both vampire and werewolf
  if (state.type === 'vampire' || state.type === 'vampire_lord') {
    return {
      success: false,
      message: 'The blood of the vampire prevents the beast blood from taking hold.',
      newState: state
    };
  }

  if (state.type === 'werewolf') {
    return {
      success: false,
      message: 'The beast blood already runs through your veins.',
      newState: state
    };
  }

  return {
    success: true,
    message: 'The beast blood courses through you! You are now a werewolf. The moon calls...',
    newState: {
      ...state,
      type: 'werewolf',
      werewolf: {
        active: false,
        feedingCount: 0,
        unlockedPerks: [],
        lastTransformTime: null,
        transformCooldown: false,
        beastFormDuration: 150 // 2.5 minutes base
      }
    }
  };
};

// Contract Vampirism
export const contractVampirism = (
  state: TransformationState,
  fromVampireLord: boolean = false
): { success: boolean; message: string; newState: TransformationState } => {
  // Can't be both vampire and werewolf
  if (state.type === 'werewolf') {
    return {
      success: false,
      message: 'The beast blood burns away the vampire curse.',
      newState: state
    };
  }

  if (state.type === 'vampire' || state.type === 'vampire_lord') {
    return {
      success: false,
      message: 'Vampiric blood already flows through your veins.',
      newState: state
    };
  }

  return {
    success: true,
    message: fromVampireLord 
      ? 'Lord Harkon grants you the blood! You are now a Vampire Lord!'
      : 'The vampire disease takes hold... You have become a creature of the night.',
    newState: {
      ...state,
      type: fromVampireLord ? 'vampire_lord' : 'vampire',
      vampire: {
        stage: 1,
        vampireLordActive: false,
        feedingCount: 0,
        vampireLordLevel: fromVampireLord ? 1 : 0,
        unlockedPerks: fromVampireLord ? ['power_of_the_grave'] : [],
        lastFedTime: new Date().toISOString(),
        dawnDamageMultiplier: 1
      }
    }
  };
};

// Transform to beast form (werewolf)
export const transformToWerewolf = (
  state: TransformationState
): { success: boolean; message: string; newState: TransformationState } => {
  if (state.type !== 'werewolf' || !state.werewolf) {
    return {
      success: false,
      message: 'You do not possess the beast blood.',
      newState: state
    };
  }

  if (state.werewolf.active) {
    return {
      success: false,
      message: 'You are already in beast form!',
      newState: state
    };
  }

  if (state.werewolf.transformCooldown) {
    return {
      success: false,
      message: 'The beast within needs time to recover. Try again later.',
      newState: state
    };
  }

  return {
    success: true,
    message: 'Your body twists and changes! The beast takes over!',
    newState: {
      ...state,
      werewolf: {
        ...state.werewolf,
        active: true,
        lastTransformTime: new Date().toISOString()
      }
    }
  };
};

// Revert from beast form
export const revertFromWerewolf = (
  state: TransformationState
): { success: boolean; message: string; newState: TransformationState } => {
  if (!state.werewolf?.active) {
    return {
      success: false,
      message: 'You are not currently in beast form.',
      newState: state
    };
  }

  return {
    success: true,
    message: 'The beast subsides. Your human form returns.',
    newState: {
      ...state,
      werewolf: {
        ...state.werewolf,
        active: false,
        transformCooldown: true
      }
    }
  };
};

// Feed as werewolf
export const feedAsWerewolf = (
  state: TransformationState,
  targetName: string
): { success: boolean; message: string; newState: TransformationState; healthRestored: number } => {
  if (!state.werewolf?.active) {
    return {
      success: false,
      message: 'You must be in beast form to feed.',
      newState: state,
      healthRestored: 0
    };
  }

  const hasGorging = state.werewolf.unlockedPerks.includes('gorging');
  const healthRestored = hasGorging ? 100 : 50;
  const durationBonus = state.werewolf.unlockedPerks.includes('savage_feeding') ? 30 : 0;

  return {
    success: true,
    message: `You feed on ${targetName}'s corpse. The beast is pleased.`,
    newState: {
      ...state,
      werewolf: {
        ...state.werewolf,
        feedingCount: state.werewolf.feedingCount + 1,
        beastFormDuration: state.werewolf.beastFormDuration + 30 + durationBonus
      }
    },
    healthRestored
  };
};

// Transform to Vampire Lord
export const transformToVampireLord = (
  state: TransformationState
): { success: boolean; message: string; newState: TransformationState } => {
  if (state.type !== 'vampire_lord' || !state.vampire) {
    return {
      success: false,
      message: 'You have not been granted the gift of the Vampire Lord.',
      newState: state
    };
  }

  if (state.vampire.vampireLordActive) {
    return {
      success: false,
      message: 'You are already in Vampire Lord form!',
      newState: state
    };
  }

  return {
    success: true,
    message: 'You embrace your true vampire nature! Wings unfurl and power surges through you!',
    newState: {
      ...state,
      vampire: {
        ...state.vampire,
        vampireLordActive: true
      }
    }
  };
};

// Revert from Vampire Lord
export const revertFromVampireLord = (
  state: TransformationState
): { success: boolean; message: string; newState: TransformationState } => {
  if (!state.vampire?.vampireLordActive) {
    return {
      success: false,
      message: 'You are not currently in Vampire Lord form.',
      newState: state
    };
  }

  return {
    success: true,
    message: 'You suppress the Vampire Lord within, returning to mortal guise.',
    newState: {
      ...state,
      vampire: {
        ...state.vampire,
        vampireLordActive: false
      }
    }
  };
};

// Feed as vampire (reduces stage)
export const feedAsVampire = (
  state: TransformationState,
  targetName: string
): { success: boolean; message: string; newState: TransformationState; xpGained: number } => {
  if (!state.vampire) {
    return {
      success: false,
      message: 'You are not a vampire.',
      newState: state,
      xpGained: 0
    };
  }

  const xpGained = state.vampire.vampireLordLevel > 0 ? 10 : 0;

  return {
    success: true,
    message: `You drink deeply from ${targetName}. The hunger fades...`,
    newState: {
      ...state,
      vampire: {
        ...state.vampire,
        stage: 1,
        feedingCount: state.vampire.feedingCount + 1,
        lastFedTime: new Date().toISOString(),
        vampireLordLevel: xpGained > 0 ? Math.min(state.vampire.vampireLordLevel + 0.1, 11) : state.vampire.vampireLordLevel
      }
    },
    xpGained
  };
};

// Progress vampire stage (called over time when not feeding)
export const progressVampireStage = (
  state: TransformationState,
  hoursPassed: number
): { newState: TransformationState; stageChanged: boolean } => {
  if (!state.vampire) {
    return { newState: state, stageChanged: false };
  }

  // Progress by 1 stage per 24 hours without feeding
  const stageIncrease = Math.floor(hoursPassed / 24);
  if (stageIncrease <= 0) {
    return { newState: state, stageChanged: false };
  }

  const newStage = Math.min(4, state.vampire.stage + stageIncrease) as 1 | 2 | 3 | 4;
  
  return {
    newState: {
      ...state,
      vampire: {
        ...state.vampire,
        stage: newStage
      }
    },
    stageChanged: newStage !== state.vampire.stage
  };
};

// Unlock werewolf perk
export const unlockWerewolfPerk = (
  state: TransformationState,
  perkId: string
): { success: boolean; message: string; newState: TransformationState } => {
  if (!state.werewolf) {
    return {
      success: false,
      message: 'You are not a werewolf.',
      newState: state
    };
  }

  const perk = WEREWOLF_PERKS[perkId];
  if (!perk) {
    return {
      success: false,
      message: 'Invalid perk.',
      newState: state
    };
  }

  if (state.werewolf.unlockedPerks.includes(perkId)) {
    return {
      success: false,
      message: 'You already have this perk.',
      newState: state
    };
  }

  if (state.werewolf.feedingCount < perk.requiredFeedings) {
    return {
      success: false,
      message: `You need ${perk.requiredFeedings} feedings to unlock this perk. (You have ${state.werewolf.feedingCount})`,
      newState: state
    };
  }

  // Check required perks
  for (const reqPerk of perk.requiredPerks) {
    if (!state.werewolf.unlockedPerks.includes(reqPerk)) {
      return {
        success: false,
        message: `Requires: ${WEREWOLF_PERKS[reqPerk]?.name || reqPerk}`,
        newState: state
      };
    }
  }

  return {
    success: true,
    message: `Unlocked: ${perk.name}! ${perk.description}`,
    newState: {
      ...state,
      werewolf: {
        ...state.werewolf,
        unlockedPerks: [...state.werewolf.unlockedPerks, perkId]
      }
    }
  };
};

// Unlock vampire perk
export const unlockVampirePerk = (
  state: TransformationState,
  perkId: string
): { success: boolean; message: string; newState: TransformationState } => {
  if (!state.vampire || state.vampire.vampireLordLevel === 0) {
    return {
      success: false,
      message: 'You must be a Vampire Lord to unlock these perks.',
      newState: state
    };
  }

  const perk = VAMPIRE_PERKS[perkId];
  if (!perk) {
    return {
      success: false,
      message: 'Invalid perk.',
      newState: state
    };
  }

  if (state.vampire.unlockedPerks.includes(perkId)) {
    return {
      success: false,
      message: 'You already have this perk.',
      newState: state
    };
  }

  if (Math.floor(state.vampire.vampireLordLevel) < perk.requiredLevel) {
    return {
      success: false,
      message: `Requires Vampire Lord level ${perk.requiredLevel}. (You are level ${Math.floor(state.vampire.vampireLordLevel)})`,
      newState: state
    };
  }

  // Check required perks
  for (const reqPerk of perk.requiredPerks) {
    if (!state.vampire.unlockedPerks.includes(reqPerk)) {
      return {
        success: false,
        message: `Requires: ${VAMPIRE_PERKS[reqPerk]?.name || reqPerk}`,
        newState: state
      };
    }
  }

  return {
    success: true,
    message: `Unlocked: ${perk.name}! ${perk.description}`,
    newState: {
      ...state,
      vampire: {
        ...state.vampire,
        unlockedPerks: [...state.vampire.unlockedPerks, perkId]
      }
    }
  };
};

// Cure lycanthropy
export const cureLycanthropy = (
  state: TransformationState
): { success: boolean; message: string; newState: TransformationState } => {
  if (state.type !== 'werewolf') {
    return {
      success: false,
      message: 'You are not afflicted with lycanthropy.',
      newState: state
    };
  }

  return {
    success: true,
    message: 'The Glenmoril witches\' heads burn on the fire. The beast blood leaves you. You are mortal once more.',
    newState: {
      ...state,
      type: null,
      werewolf: undefined,
      seekingCure: false,
      cureProgress: 0
    }
  };
};

// Cure vampirism
export const cureVampirism = (
  state: TransformationState
): { success: boolean; message: string; newState: TransformationState } => {
  if (state.type !== 'vampire' && state.type !== 'vampire_lord') {
    return {
      success: false,
      message: 'You are not afflicted with vampirism.',
      newState: state
    };
  }

  return {
    success: true,
    message: 'Falion\'s ritual is complete. The sun no longer burns you. You are mortal once more.',
    newState: {
      ...state,
      type: null,
      vampire: undefined,
      seekingCure: false,
      cureProgress: 0
    }
  };
};

// Backwards-compatible alias
export const revertFromBeastForm = revertFromWerewolf;

// Get active bonuses from transformation
export const getTransformationBonuses = (state: TransformationState): {
  health: number;
  magicka: number;
  stamina: number;
  damage: number;
  resistFrost: number;
  weakFire: number;
  illusion: number;
  sneak: number;
  specialAbilities: string[];
} => {
  let bonuses = {
    health: 0,
    magicka: 0,
    stamina: 0,
    damage: 0,
    resistFrost: 0,
    weakFire: 0,
    illusion: 0,
    sneak: 0,
    specialAbilities: [] as string[]
  };

  // Werewolf bonuses (only when transformed)
  if (state.werewolf?.active) {
    for (const perkId of state.werewolf.unlockedPerks) {
      const perk = WEREWOLF_PERKS[perkId];
      if (perk) {
        bonuses.health += perk.effects.healthBonus || 0;
        bonuses.stamina += perk.effects.staminaBonus || 0;
        bonuses.damage += perk.effects.damageBonus || 0;
        if (perk.effects.special) {
          bonuses.specialAbilities.push(perk.effects.special);
        }
      }
    }
    // Base werewolf combat bonuses
    bonuses.health += 100;
    bonuses.stamina += 100;
  }

  // Vampire bonuses (always active when vampire)
  if (state.vampire) {
    const stageEffects = VAMPIRE_STAGE_EFFECTS[state.vampire.stage];
    bonuses.resistFrost = stageEffects.resistFrost;
    bonuses.weakFire = stageEffects.weakFire;
    bonuses.illusion = stageEffects.illusion;
    bonuses.sneak = stageEffects.sneak;
    
    if (stageEffects.vampireSeduction) bonuses.specialAbilities.push('Vampire Seduction');
    if (stageEffects.embraceShadows) bonuses.specialAbilities.push('Embrace of Shadows');
    if (stageEffects.nightVision) bonuses.specialAbilities.push('Night Vision');

    // Vampire Lord form bonuses
    if (state.vampire.vampireLordActive) {
      for (const perkId of state.vampire.unlockedPerks) {
        const perk = VAMPIRE_PERKS[perkId];
        if (perk) {
          bonuses.health += perk.effects.healthBonus || 0;
          bonuses.magicka += perk.effects.magickaBonus || 0;
          bonuses.damage += perk.effects.damageBonus || 0;
          if (perk.effects.special) {
            bonuses.specialAbilities.push(perk.effects.special);
          }
        }
      }
    }
  }

  return bonuses;
};

// Backwards-compatible aliases expected by App.tsx
export const getInitialTransformationState = initializeTransformationState;

export function getVampireStageEffects(stage: 1 | 2 | 3 | 4) {
  return VAMPIRE_STAGE_EFFECTS[stage];
}

export function canUnlockWerewolfPerk(state: TransformationState, perkId: string) {
  if (!state.werewolf) return false;
  const perk = WEREWOLF_PERKS[perkId];
  if (!perk) return false;
  if (state.werewolf.unlockedPerks.includes(perkId)) return false;
  if (state.werewolf.feedingCount < perk.requiredFeedings) return false;
  for (const req of perk.requiredPerks) {
    if (!state.werewolf.unlockedPerks.includes(req)) return false;
  }
  return true;
}

export function canUnlockVampirePerk(state: TransformationState, perkId: string) {
  if (!state.vampire) return false;
  const perk = VAMPIRE_PERKS[perkId];
  if (!perk) return false;
  if (state.vampire.unlockedPerks.includes(perkId)) return false;
  if (Math.floor(state.vampire.vampireLordLevel) < perk.requiredLevel) return false;
  for (const req of perk.requiredPerks) {
    if (!state.vampire.unlockedPerks.includes(req)) return false;
  }
  return true;
}

export default {
  WEREWOLF_PERKS,
  VAMPIRE_PERKS,
  VAMPIRE_STAGE_EFFECTS,
  initializeTransformationState,
  getTransformationState,
  contractLycanthropy,
  contractVampirism,
  transformToWerewolf,
  revertFromWerewolf,
  feedAsWerewolf,
  transformToVampireLord,
  revertFromVampireLord,
  feedAsVampire,
  progressVampireStage,
  unlockWerewolfPerk,
  unlockVampirePerk,
  cureLycanthropy,
  cureVampirism,
  getTransformationBonuses
};
