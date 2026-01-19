/**
 * Shouts (Thu'um) Service
 * Dragon shouts system - unlock, learn, and use shouts
 */

import { Character, InventoryItem } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type ShoutWord = 'first' | 'second' | 'third';

export interface ShoutDefinition {
  id: string;
  name: string;
  dragonName: string; // Name in dragon language
  words: [string, string, string]; // Three words of power
  translations: [string, string, string]; // English translations
  description: string;
  effects: [string, string, string]; // Effect description for each word level
  cooldowns: [number, number, number]; // Cooldown in seconds for each level
  damage?: [number, number, number]; // Damage for each level (if applicable)
  duration?: [number, number, number]; // Effect duration for each level
  category: 'offensive' | 'defensive' | 'utility' | 'summon';
  wordLocations?: [string?, string?, string?]; // Where to find each word wall
}

export interface UnlockedShout {
  shoutId: string;
  wordsLearned: number; // 0-3 words learned
  wordsUnlocked: number; // 0-3 words unlocked with dragon souls
  lastUsed?: number; // Timestamp of last use
  timesUsed: number;
}

export interface ShoutState {
  dragonSouls: number;
  unlockedShouts: UnlockedShout[];
  activeShoutId: string | null;
  cooldowns: Record<string, number>; // shoutId -> timestamp when cooldown ends
}

// ============================================================================
// SHOUT DEFINITIONS
// ============================================================================

export const SHOUTS: Record<string, ShoutDefinition> = {
  unrelenting_force: {
    id: 'unrelenting_force',
    name: 'Unrelenting Force',
    dragonName: 'Fus Ro Dah',
    words: ['Fus', 'Ro', 'Dah'],
    translations: ['Force', 'Balance', 'Push'],
    description: 'The first shout learned by the Dragonborn. It unleashes a devastating force that sends enemies flying.',
    effects: [
      'Staggers enemies nearby',
      'Knocks down enemies',
      'Sends enemies flying with tremendous force'
    ],
    cooldowns: [15, 20, 45],
    damage: [10, 20, 40],
    category: 'offensive',
    wordLocations: ['Bleak Falls Barrow', 'High Hrothgar', 'High Hrothgar'],
  },
  
  fire_breath: {
    id: 'fire_breath',
    name: 'Fire Breath',
    dragonName: 'Yol Toor Shul',
    words: ['Yol', 'Toor', 'Shul'],
    translations: ['Fire', 'Inferno', 'Sun'],
    description: 'Inhale air, exhale flame. A devastating breath attack.',
    effects: [
      'Breathes a small stream of fire',
      'Breathes a cone of flames',
      'Unleashes a torrent of dragon fire'
    ],
    cooldowns: [30, 50, 100],
    damage: [50, 90, 150],
    duration: [3, 5, 7],
    category: 'offensive',
    wordLocations: ['Dustman\'s Cairn', 'Sunderstone Gorge', 'Throat of the World'],
  },

  frost_breath: {
    id: 'frost_breath',
    name: 'Frost Breath',
    dragonName: 'Fo Krah Diin',
    words: ['Fo', 'Krah', 'Diin'],
    translations: ['Frost', 'Cold', 'Freeze'],
    description: 'Your breath is winter. Freezes enemies solid.',
    effects: [
      'Chills enemies, slowing them',
      'Coats enemies in frost',
      'Encases enemies in ice, freezing them'
    ],
    cooldowns: [30, 50, 100],
    damage: [40, 70, 120],
    duration: [5, 7, 10],
    category: 'offensive',
    wordLocations: ['Bonestrewn Crest', 'Folgunthur', 'Skyborn Altar'],
  },

  whirlwind_sprint: {
    id: 'whirlwind_sprint',
    name: 'Whirlwind Sprint',
    dragonName: 'Wuld Nah Kest',
    words: ['Wuld', 'Nah', 'Kest'],
    translations: ['Whirlwind', 'Fury', 'Tempest'],
    description: 'The Thu\'um rushes forward, carrying you in its wake.',
    effects: [
      'Dash forward a short distance',
      'Dash forward quickly',
      'Become the wind, moving at incredible speed'
    ],
    cooldowns: [20, 25, 35],
    category: 'utility',
    wordLocations: ['High Hrothgar', 'Volskygge', 'Dead Men\'s Respite'],
  },

  become_ethereal: {
    id: 'become_ethereal',
    name: 'Become Ethereal',
    dragonName: 'Feim Zii Gron',
    words: ['Feim', 'Zii', 'Gron'],
    translations: ['Fade', 'Spirit', 'Bind'],
    description: 'The Thu\'um makes you ethereal, unable to attack or be attacked.',
    effects: [
      'Become ethereal briefly',
      'Become ethereal, immune to damage',
      'Become completely incorporeal'
    ],
    cooldowns: [30, 40, 50],
    duration: [5, 10, 15],
    category: 'defensive',
    wordLocations: ['Ustengrav', 'Lost Valley Redoubt', 'Ironbind Barrow'],
  },

  clear_skies: {
    id: 'clear_skies',
    name: 'Clear Skies',
    dragonName: 'Lok Vah Koor',
    words: ['Lok', 'Vah', 'Koor'],
    translations: ['Sky', 'Spring', 'Summer'],
    description: 'Clears away fog and storms, revealing clear skies.',
    effects: [
      'Clears light fog',
      'Clears moderate storms',
      'Instantly clears all weather effects'
    ],
    cooldowns: [5, 10, 15],
    category: 'utility',
    wordLocations: ['High Hrothgar', 'High Hrothgar', 'High Hrothgar'],
  },

  storm_call: {
    id: 'storm_call',
    name: 'Storm Call',
    dragonName: 'Strun Bah Qo',
    words: ['Strun', 'Bah', 'Qo'],
    translations: ['Storm', 'Wrath', 'Lightning'],
    description: 'A shout to the sky, summoning a powerful storm.',
    effects: [
      'Calls light rain with occasional lightning',
      'Summons a thunderstorm',
      'Unleashes a devastating lightning storm'
    ],
    cooldowns: [300, 480, 600],
    damage: [40, 80, 120],
    duration: [60, 120, 180],
    category: 'offensive',
    wordLocations: ['High Gate Ruins', 'Forelhost', 'Skuldafn'],
  },

  call_dragon: {
    id: 'call_dragon',
    name: 'Call Dragon',
    dragonName: 'Od Ah Viing',
    words: ['Od', 'Ah', 'Viing'],
    translations: ['Snow', 'Hunter', 'Wing'],
    description: 'Calls the dragon Odahviing to aid you in battle.',
    effects: [
      'Attempts to call a dragon',
      'Calls Odahviing',
      'Summons Odahviing to fight alongside you'
    ],
    cooldowns: [300, 300, 300],
    category: 'summon',
    wordLocations: ['Quest: The Fallen', 'Quest: The Fallen', 'Quest: The Fallen'],
  },

  dragonrend: {
    id: 'dragonrend',
    name: 'Dragonrend',
    dragonName: 'Joor Zah Frul',
    words: ['Joor', 'Zah', 'Frul'],
    translations: ['Mortal', 'Finite', 'Temporary'],
    description: 'The shout created by mortals to defeat Alduin. Forces dragons to land.',
    effects: [
      'Weakens a dragon\'s flight',
      'Forces a dragon to land briefly',
      'Grounds a dragon completely, making it mortal'
    ],
    cooldowns: [10, 12, 15],
    duration: [10, 15, 20],
    category: 'utility',
    wordLocations: ['Alduin\'s Bane', 'Alduin\'s Bane', 'Alduin\'s Bane'],
  },

  slow_time: {
    id: 'slow_time',
    name: 'Slow Time',
    dragonName: 'Tiid Klo Ul',
    words: ['Tiid', 'Klo', 'Ul'],
    translations: ['Time', 'Sand', 'Eternity'],
    description: 'Shout at time itself, slowing its passage.',
    effects: [
      'Time slows slightly',
      'Time slows significantly',
      'Time nearly stops around you'
    ],
    cooldowns: [30, 45, 60],
    duration: [8, 12, 16],
    category: 'utility',
    wordLocations: ['Hag\'s End', 'Korvanjund', 'Labyrinthian'],
  },

  aura_whisper: {
    id: 'aura_whisper',
    name: 'Aura Whisper',
    dragonName: 'Laas Yah Nir',
    words: ['Laas', 'Yah', 'Nir'],
    translations: ['Life', 'Seek', 'Hunt'],
    description: 'Your voice is not a shout, but a whisper revealing all life.',
    effects: [
      'Sense nearby life forms',
      'Clearly see all life nearby',
      'Detect all life in a large area'
    ],
    cooldowns: [30, 40, 50],
    duration: [15, 20, 30],
    category: 'utility',
    wordLocations: ['Northwind Summit', 'Valthume', 'Volunruud'],
  },

  marked_for_death: {
    id: 'marked_for_death',
    name: 'Marked for Death',
    dragonName: 'Krii Lun Aus',
    words: ['Krii', 'Lun', 'Aus'],
    translations: ['Kill', 'Leech', 'Suffer'],
    description: 'Speak and let your voice mark an enemy for death.',
    effects: [
      'Weakens enemy armor slightly',
      'Significantly reduces enemy armor',
      'Enemy armor and health drain continuously'
    ],
    cooldowns: [20, 30, 40],
    duration: [60, 60, 60],
    category: 'offensive',
    wordLocations: ['Autumnwatch Tower', 'Dark Brotherhood Sanctuary', 'Forsaken Cave'],
  },

  throw_voice: {
    id: 'throw_voice',
    name: 'Throw Voice',
    dragonName: 'Zul Mey Gut',
    words: ['Zul', 'Mey', 'Gut'],
    translations: ['Voice', 'Fool', 'Far'],
    description: 'The Thu\'um is heard but its source unknown.',
    effects: [
      'Creates a distant sound',
      'Throws your voice far away',
      'Your voice appears anywhere, confusing enemies'
    ],
    cooldowns: [5, 10, 15],
    category: 'utility',
    wordLocations: ['Shearpoint', 'Shearpoint', 'Shearpoint'],
  },

  elemental_fury: {
    id: 'elemental_fury',
    name: 'Elemental Fury',
    dragonName: 'Su Grah Dun',
    words: ['Su', 'Grah', 'Dun'],
    translations: ['Air', 'Battle', 'Grace'],
    description: 'The Thu\'um enchants your weapon, making attacks faster.',
    effects: [
      'Weapon attacks slightly faster',
      'Weapon attacks faster',
      'Weapon attacks with incredible speed'
    ],
    cooldowns: [30, 40, 50],
    duration: [15, 20, 30],
    category: 'offensive',
    wordLocations: ['Dragontooth Crater', 'Shriekwind Bastion', 'Statue to Meridia'],
  },

  ice_form: {
    id: 'ice_form',
    name: 'Ice Form',
    dragonName: 'Iiz Slen Nus',
    words: ['Iiz', 'Slen', 'Nus'],
    translations: ['Ice', 'Flesh', 'Statue'],
    description: 'Your Thu\'um freezes an opponent solid.',
    effects: [
      'Slows enemy significantly',
      'Partially freezes enemy',
      'Encases enemy in ice completely'
    ],
    cooldowns: [60, 90, 120],
    duration: [15, 30, 60],
    damage: [20, 35, 50],
    category: 'offensive',
    wordLocations: ['Mount Anthor', 'Frostmere Crypt', 'Saarthal'],
  },

  dismay: {
    id: 'dismay',
    name: 'Dismay',
    dragonName: 'Faas Ru Maar',
    words: ['Faas', 'Ru', 'Maar'],
    translations: ['Fear', 'Run', 'Terror'],
    description: 'And the weak shall fear the Thu\'um.',
    effects: [
      'Weak enemies flee',
      'Most enemies flee in terror',
      'All but the strongest flee in panic'
    ],
    cooldowns: [40, 45, 50],
    duration: [30, 45, 60],
    category: 'utility',
    wordLocations: ['Dead Crone Rock', 'Labyrinthian', 'Shalidor\'s Maze'],
  },

  kyne_peace: {
    id: 'kyne_peace',
    name: 'Kyne\'s Peace',
    dragonName: 'Kaan Drem Ov',
    words: ['Kaan', 'Drem', 'Ov'],
    translations: ['Kyne', 'Peace', 'Trust'],
    description: 'The Voice soothes wild beasts, calming them.',
    effects: [
      'Calms small animals',
      'Calms most animals',
      'All animals become peaceful'
    ],
    cooldowns: [40, 50, 60],
    duration: [60, 90, 180],
    category: 'utility',
    wordLocations: ['Ragnvald', 'Shroud Hearth Barrow', 'Rannveig\'s Fast'],
  },

  soul_tear: {
    id: 'soul_tear',
    name: 'Soul Tear',
    dragonName: 'Rii Vaaz Zol',
    words: ['Rii', 'Vaaz', 'Zol'],
    translations: ['Essence', 'Tear', 'Zombie'],
    description: 'Your voice lashes out and tears the soul from the living.',
    effects: [
      'Deals damage and fills soul gem if enemy dies',
      'Heavy damage, soul capture, may reanimate',
      'Massive damage, captures soul, reanimates corpse'
    ],
    cooldowns: [90, 120, 150],
    damage: [100, 200, 300],
    duration: [60, 90, 120],
    category: 'offensive',
    wordLocations: ['Durnehviir', 'Durnehviir', 'Durnehviir'],
  },

  call_of_valor: {
    id: 'call_of_valor',
    name: 'Call of Valor',
    dragonName: 'Hun Kaal Zoor',
    words: ['Hun', 'Kaal', 'Zoor'],
    translations: ['Hero', 'Champion', 'Legend'],
    description: 'Summons a hero from Sovngarde to aid you.',
    effects: [
      'Summons Gormlaith Golden-Hilt',
      'Summons Felldir the Old',
      'Summons Hakon One-Eye'
    ],
    cooldowns: [180, 180, 180],
    duration: [60, 90, 120],
    category: 'summon',
    wordLocations: ['Sovngarde', 'Sovngarde', 'Sovngarde'],
  },

  bend_will: {
    id: 'bend_will',
    name: 'Bend Will',
    dragonName: 'Gol Hah Dov',
    words: ['Gol', 'Hah', 'Dov'],
    translations: ['Earth', 'Mind', 'Dragon'],
    description: 'Your voice bends the very stones to your will.',
    effects: [
      'Commands earth and stone',
      'Commands mortals to serve you',
      'Commands even dragons to your will'
    ],
    cooldowns: [10, 90, 120],
    duration: [30, 60, 90],
    category: 'utility',
    wordLocations: ['Saering\'s Watch', 'Apocrypha', 'Summit of Apocrypha'],
  },

  battle_fury: {
    id: 'battle_fury',
    name: 'Battle Fury',
    dragonName: 'Mid Vur Shaan',
    words: ['Mid', 'Vur', 'Shaan'],
    translations: ['Loyal', 'Valor', 'Inspire'],
    description: 'Your Thu\'um inspires allies, making them fight harder.',
    effects: [
      'Allies attack slightly faster',
      'Allies attack faster',
      'Allies attack with incredible fury'
    ],
    cooldowns: [30, 45, 60],
    duration: [30, 45, 60],
    category: 'utility',
    wordLocations: ['Vahlok\'s Tomb', 'Vahlok\'s Tomb', 'Vahlok\'s Tomb'],
  },

  dragon_aspect: {
    id: 'dragon_aspect',
    name: 'Dragon Aspect',
    dragonName: 'Mul Qah Diiv',
    words: ['Mul', 'Qah', 'Diiv'],
    translations: ['Strength', 'Armor', 'Wyrm'],
    description: 'Take on the aspect of a dragon, gaining power.',
    effects: [
      'Gain armor and resist frost/fire',
      'Enhanced armor, resistances, and power attacks',
      'Full dragon aspect with Ancient Dragonborn summon at low health'
    ],
    cooldowns: [0, 0, 0], // Once per day
    duration: [300, 300, 300],
    category: 'defensive',
    wordLocations: ['Temple of Miraak', 'Raven Rock Mine', 'Apocrypha'],
  },

  cyclone: {
    id: 'cyclone',
    name: 'Cyclone',
    dragonName: 'Ven Gaar Nos',
    words: ['Ven', 'Gaar', 'Nos'],
    translations: ['Wind', 'Unleash', 'Strike'],
    description: 'Creates a cyclone that flings enemies into the air.',
    effects: [
      'Creates a small gust',
      'Summons a whirlwind',
      'Unleashes a massive cyclone'
    ],
    cooldowns: [30, 45, 60],
    damage: [30, 60, 100],
    category: 'offensive',
    wordLocations: ['Benkongerike', 'Kolbjorn Barrow', 'White Ridge Barrow'],
  },
};

// ============================================================================
// SHOUT STATE MANAGEMENT
// ============================================================================

/**
 * Initialize shout state for a new character
 */
export function initializeShoutState(): ShoutState {
  return {
    dragonSouls: 0,
    unlockedShouts: [],
    activeShoutId: null,
    cooldowns: {},
  };
}

/**
 * Get shout state from character or initialize if missing
 */
export function getShoutState(character: Character): ShoutState {
  if (character.shoutState) {
    return character.shoutState as ShoutState;
  }
  return initializeShoutState();
}

/**
 * Learn a word of power (find word wall)
 */
export function learnShoutWord(
  state: ShoutState,
  shoutId: string,
  wordIndex: number = 0
): { state: ShoutState; message: string } {
  const shout = SHOUTS[shoutId];
  if (!shout) {
    return { state, message: 'Unknown shout.' };
  }

  const existingShout = state.unlockedShouts.find(s => s.shoutId === shoutId);
  
  if (existingShout) {
    // Check if this word is already learned
    if (existingShout.wordsLearned > wordIndex) {
      return { state, message: `You already know "${shout.words[wordIndex]}".` };
    }
    
    // Learn the next word
    const updatedShouts = state.unlockedShouts.map(s => {
      if (s.shoutId === shoutId) {
        return { ...s, wordsLearned: wordIndex + 1 };
      }
      return s;
    });
    
    return {
      state: { ...state, unlockedShouts: updatedShouts },
      message: `You learned "${shout.words[wordIndex]}" (${shout.translations[wordIndex]}) - Word ${wordIndex + 1} of ${shout.name}!`
    };
  }
  
  // First word of new shout
  const newShout: UnlockedShout = {
    shoutId,
    wordsLearned: 1,
    wordsUnlocked: 0,
    timesUsed: 0,
  };
  
  return {
    state: { ...state, unlockedShouts: [...state.unlockedShouts, newShout] },
    message: `You learned "${shout.words[0]}" (${shout.translations[0]}) - You discovered ${shout.name}!`
  };
}

/**
 * Absorb a dragon soul
 */
export function absorbDragonSoul(
  state: ShoutState,
  soulValue: number = 1
): { state: ShoutState; message: string } {
  return {
    state: { ...state, dragonSouls: state.dragonSouls + soulValue },
    message: `You absorbed a dragon soul! (${state.dragonSouls + soulValue} souls available)`
  };
}

/**
 * Unlock a word with a dragon soul
 */
export function unlockShoutWord(
  state: ShoutState,
  shoutId: string
): { state: ShoutState; success: boolean; message: string } {
  if (state.dragonSouls < 1) {
    return { state, success: false, message: 'You need dragon souls to unlock shout words.' };
  }

  const shout = SHOUTS[shoutId];
  if (!shout) {
    return { state, success: false, message: 'Unknown shout.' };
  }

  const existingShout = state.unlockedShouts.find(s => s.shoutId === shoutId);
  
  if (!existingShout) {
    return { state, success: false, message: 'You haven\'t learned any words of this shout yet.' };
  }
  
  if (existingShout.wordsUnlocked >= existingShout.wordsLearned) {
    return { state, success: false, message: 'All learned words are already unlocked.' };
  }
  
  if (existingShout.wordsUnlocked >= 3) {
    return { state, success: false, message: 'This shout is fully unlocked.' };
  }

  const wordIndex = existingShout.wordsUnlocked;
  const updatedShouts = state.unlockedShouts.map(s => {
    if (s.shoutId === shoutId) {
      return { ...s, wordsUnlocked: s.wordsUnlocked + 1 };
    }
    return s;
  });

  return {
    state: { 
      ...state, 
      dragonSouls: state.dragonSouls - 1,
      unlockedShouts: updatedShouts 
    },
    success: true,
    message: `You unlocked "${shout.words[wordIndex]}" (${shout.translations[wordIndex]})! ${shout.name} is now ${wordIndex + 1} word${wordIndex > 0 ? 's' : ''} strong.`
  };
}

/**
 * Set active shout for quick use
 */
export function setActiveShout(
  state: ShoutState,
  shoutId: string | null
): ShoutState {
  return { ...state, activeShoutId: shoutId };
}

/**
 * Check if shout is on cooldown
 */
export function isShoutOnCooldown(state: ShoutState, shoutId: string): boolean {
  const cooldownEnd = state.cooldowns[shoutId];
  if (!cooldownEnd) return false;
  return Date.now() < cooldownEnd;
}

/**
 * Get remaining cooldown time in seconds
 */
export function getShoutCooldown(state: ShoutState, shoutId: string): number {
  const cooldownEnd = state.cooldowns[shoutId];
  if (!cooldownEnd) return 0;
  const remaining = Math.max(0, cooldownEnd - Date.now());
  return Math.ceil(remaining / 1000);
}

/**
 * Use a shout (apply cooldown)
 */
export function useShout(
  state: ShoutState,
  shoutId: string
): { state: ShoutState; success: boolean; shout?: ShoutDefinition; words: number; message: string } {
  const shout = SHOUTS[shoutId];
  if (!shout) {
    return { state, success: false, words: 0, message: 'Unknown shout.' };
  }

  const unlockedShout = state.unlockedShouts.find(s => s.shoutId === shoutId);
  if (!unlockedShout || unlockedShout.wordsUnlocked < 1) {
    return { state, success: false, words: 0, message: `You haven't unlocked ${shout.name} yet.` };
  }

  if (isShoutOnCooldown(state, shoutId)) {
    const remaining = getShoutCooldown(state, shoutId);
    return { state, success: false, words: 0, message: `${shout.name} is on cooldown (${remaining}s remaining).` };
  }

  const words = unlockedShout.wordsUnlocked;
  const cooldownTime = shout.cooldowns[words - 1] * 1000; // Convert to milliseconds

  const updatedShouts = state.unlockedShouts.map(s => {
    if (s.shoutId === shoutId) {
      return { ...s, lastUsed: Date.now(), timesUsed: s.timesUsed + 1 };
    }
    return s;
  });

  return {
    state: {
      ...state,
      unlockedShouts: updatedShouts,
      cooldowns: {
        ...state.cooldowns,
        [shoutId]: Date.now() + cooldownTime,
      }
    },
    success: true,
    shout,
    words,
    message: `${shout.dragonName.split(' ').slice(0, words).join(' ')}! (${shout.effects[words - 1]})`
  };
}

/**
 * Calculate shout damage based on words unlocked
 */
export function calculateShoutDamage(shoutId: string, wordsUnlocked: number): number {
  const shout = SHOUTS[shoutId];
  if (!shout || !shout.damage) return 0;
  
  const index = Math.min(wordsUnlocked - 1, 2);
  return shout.damage[index] || 0;
}

/**
 * Get all shouts with their unlock status
 */
export function getAllShoutsWithStatus(state: ShoutState): Array<{
  shout: ShoutDefinition;
  learned: boolean;
  wordsLearned: number;
  wordsUnlocked: number;
  isActive: boolean;
  onCooldown: boolean;
  cooldownRemaining: number;
}> {
  return Object.values(SHOUTS).map(shout => {
    const unlocked = state.unlockedShouts.find(s => s.shoutId === shout.id);
    return {
      shout,
      learned: !!unlocked,
      wordsLearned: unlocked?.wordsLearned || 0,
      wordsUnlocked: unlocked?.wordsUnlocked || 0,
      isActive: state.activeShoutId === shout.id,
      onCooldown: isShoutOnCooldown(state, shout.id),
      cooldownRemaining: getShoutCooldown(state, shout.id),
    };
  });
}

/**
 * Get available combat shouts (unlocked and not on cooldown)
 */
export function getAvailableCombatShouts(state: ShoutState): Array<{
  shout: ShoutDefinition;
  words: number;
  damage: number;
  effect: string;
}> {
  return state.unlockedShouts
    .filter(us => us.wordsUnlocked > 0 && !isShoutOnCooldown(state, us.shoutId))
    .map(us => {
      const shout = SHOUTS[us.shoutId];
      if (!shout) return null;
      return {
        shout,
        words: us.wordsUnlocked,
        damage: calculateShoutDamage(us.shoutId, us.wordsUnlocked),
        effect: shout.effects[us.wordsUnlocked - 1],
      };
    })
    .filter(Boolean) as Array<{
      shout: ShoutDefinition;
      words: number;
      damage: number;
      effect: string;
    }>;
}

/**
 * Generate word wall discovery for location
 */
export function getWordWallForLocation(location: string): { shoutId: string; wordIndex: number } | null {
  // Check all shout word locations
  for (const shout of Object.values(SHOUTS)) {
    if (shout.wordLocations) {
      for (let i = 0; i < shout.wordLocations.length; i++) {
        const wordLoc = shout.wordLocations[i];
        if (wordLoc && location.toLowerCase().includes(wordLoc.toLowerCase())) {
          return { shoutId: shout.id, wordIndex: i };
        }
      }
    }
  }
  return null;
}

/**
 * Create dragon soul item for inventory
 */
export function createDragonSoulItem(): InventoryItem {
  return {
    id: `dragon_soul_${Date.now()}`,
    name: 'Dragon Soul',
    type: 'misc',
    rarity: 'legendary',
    description: 'The soul of a slain dragon. Can be used to unlock shout words.',
    value: 0,
    weight: 0,
    effects: ['Can unlock one word of power'],
    isQuestItem: false,
    quantity: 1,
  };
}
