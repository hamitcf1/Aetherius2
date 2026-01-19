/**
 * Follower Recruitment Service
 * Handles recruiting, managing, and dismissing followers with Skyrim-style mechanics
 */

import { InventoryItem, LootRarity } from '../types';

// ========== TYPES ==========

export type FollowerClass = 'warrior' | 'mage' | 'archer' | 'thief' | 'tank' | 'healer' | 'spellsword';
export type FollowerFaction = 'companions' | 'college' | 'thieves_guild' | 'dark_brotherhood' | 'dawnguard' | 'none' | 'housecarl' | 'mercenary';

export interface FollowerData {
  id: string;
  name: string;
  race: string;
  class: FollowerClass;
  faction: FollowerFaction;
  location: string;
  hold: string;
  description: string;
  personality: string;
  recruitmentCost: number; // 0 for free followers (housecarls, quest rewards)
  recruitmentRequirement?: string; // Quest or condition needed
  maxLevel: number; // Level cap
  baseHealth: number;
  baseMagicka: number;
  baseStamina: number;
  skills: {
    primary: string[];
    secondary: string[];
  };
  defaultEquipment: {
    weapon?: string;
    armor?: string;
  };
  marriageable: boolean;
  essential: boolean; // Cannot be killed if true
  voiceType: string;
  specialAbility?: string;
}

export interface ActiveFollower {
  id: string;
  data: FollowerData;
  currentHealth: number;
  maxHealth: number;
  level: number;
  experience: number;
  affinity: number; // 0-100, affects dialogue and performance
  equipment: InventoryItem[];
  isEssential: boolean;
  dismissed: boolean;
  dismissedLocation?: string;
  lastInteraction: number;
  combatStyle: 'melee' | 'ranged' | 'magic' | 'support';
  isWaiting: boolean;
  waitLocation?: string;
}

export interface FollowerState {
  activeFollowers: ActiveFollower[];
  maxFollowers: number; // Default 1, can be increased with perks/mods
  dismissedFollowers: Array<{ followerId: string; location: string; timestamp: number }>;
  recruitedFollowers: string[]; // IDs of followers ever recruited
  totalFollowersRecruited: number;
}

// ========== FOLLOWER DATABASE ==========

export const FOLLOWERS: Record<string, FollowerData> = {
  // Housecarls (free after becoming Thane)
  lydia: {
    id: 'lydia',
    name: 'Lydia',
    race: 'Nord',
    class: 'warrior',
    faction: 'housecarl',
    location: 'Dragonsreach, Whiterun',
    hold: 'Whiterun',
    description: 'Your housecarl, sworn to protect you and all you own.',
    personality: 'Dutiful and sardonic. Famous for her "I am sworn to carry your burdens" attitude.',
    recruitmentCost: 0,
    recruitmentRequirement: 'Become Thane of Whiterun',
    maxLevel: 50,
    baseHealth: 100,
    baseMagicka: 50,
    baseStamina: 100,
    skills: {
      primary: ['Heavy Armor', 'One-Handed', 'Block'],
      secondary: ['Archery', 'Two-Handed'],
    },
    defaultEquipment: {
      weapon: 'Steel Sword',
      armor: 'Steel Armor',
    },
    marriageable: true,
    essential: false,
    voiceType: 'FemaleNord',
    specialAbility: 'Shield Wall - Takes reduced damage while blocking',
  },
  jordis: {
    id: 'jordis',
    name: 'Jordis the Sword-Maiden',
    race: 'Nord',
    class: 'warrior',
    faction: 'housecarl',
    location: 'Proudspire Manor, Solitude',
    hold: 'Haafingar',
    description: 'Housecarl to the Thane of Haafingar.',
    personality: 'Honorable and eager to prove herself in battle.',
    recruitmentCost: 0,
    recruitmentRequirement: 'Become Thane of Haafingar',
    maxLevel: 50,
    baseHealth: 100,
    baseMagicka: 50,
    baseStamina: 100,
    skills: {
      primary: ['Heavy Armor', 'One-Handed', 'Block'],
      secondary: ['Archery', 'Two-Handed'],
    },
    defaultEquipment: {
      weapon: 'Steel Sword',
      armor: 'Steel Plate Armor',
    },
    marriageable: true,
    essential: false,
    voiceType: 'FemaleNord',
  },
  
  // Companions
  aela: {
    id: 'aela',
    name: 'Aela the Huntress',
    race: 'Nord',
    class: 'archer',
    faction: 'companions',
    location: 'Jorrvaskr, Whiterun',
    hold: 'Whiterun',
    description: 'A senior member of the Companions and member of the Circle.',
    personality: 'Fierce, proud, and devoted to the hunt. Embraces her inner beast.',
    recruitmentCost: 0,
    recruitmentRequirement: 'Complete Companions questline',
    maxLevel: 50,
    baseHealth: 100,
    baseMagicka: 50,
    baseStamina: 150,
    skills: {
      primary: ['Archery', 'Light Armor', 'Sneak'],
      secondary: ['One-Handed', 'Speech'],
    },
    defaultEquipment: {
      weapon: 'Ancient Nord Bow',
      armor: 'Ancient Nord Armor',
    },
    marriageable: true,
    essential: true,
    voiceType: 'FemaleNord',
    specialAbility: 'Beast Form - Can transform into a werewolf',
  },
  farkas: {
    id: 'farkas',
    name: 'Farkas',
    race: 'Nord',
    class: 'warrior',
    faction: 'companions',
    location: 'Jorrvaskr, Whiterun',
    hold: 'Whiterun',
    description: 'A member of the Circle, known for his strength.',
    personality: 'Simple and direct, but loyal to a fault. Relies on brute strength.',
    recruitmentCost: 0,
    recruitmentRequirement: 'Complete Companions questline',
    maxLevel: 50,
    baseHealth: 150,
    baseMagicka: 50,
    baseStamina: 100,
    skills: {
      primary: ['Heavy Armor', 'Two-Handed', 'Smithing'],
      secondary: ['One-Handed', 'Block'],
    },
    defaultEquipment: {
      weapon: 'Skyforge Steel Greatsword',
      armor: 'Wolf Armor',
    },
    marriageable: true,
    essential: true,
    voiceType: 'MaleNord',
    specialAbility: 'Beast Form - Can transform into a werewolf',
  },
  vilkas: {
    id: 'vilkas',
    name: 'Vilkas',
    race: 'Nord',
    class: 'warrior',
    faction: 'companions',
    location: 'Jorrvaskr, Whiterun',
    hold: 'Whiterun',
    description: 'The more scholarly twin, serves on the Circle.',
    personality: 'Intellectual and cautious compared to his brother. Master of the blade.',
    recruitmentCost: 0,
    recruitmentRequirement: 'Complete Companions questline',
    maxLevel: 50,
    baseHealth: 120,
    baseMagicka: 75,
    baseStamina: 100,
    skills: {
      primary: ['Two-Handed', 'Heavy Armor', 'Block'],
      secondary: ['Archery', 'One-Handed'],
    },
    defaultEquipment: {
      weapon: 'Skyforge Steel Greatsword',
      armor: 'Wolf Armor',
    },
    marriageable: true,
    essential: true,
    voiceType: 'MaleNord',
    specialAbility: 'Beast Form - Can transform into a werewolf',
  },
  
  // College of Winterhold
  j_zargo: {
    id: 'j_zargo',
    name: "J'zargo",
    race: 'Khajiit',
    class: 'mage',
    faction: 'college',
    location: 'College of Winterhold',
    hold: 'Winterhold',
    description: 'An ambitious Khajiit mage at the College of Winterhold.',
    personality: 'Extremely confident and competitive, always seeking to be the best mage.',
    recruitmentCost: 0,
    recruitmentRequirement: "Complete J'zargo's Experiment",
    maxLevel: 50, // No level cap, unique among followers
    baseHealth: 80,
    baseMagicka: 200,
    baseStamina: 50,
    skills: {
      primary: ['Destruction', 'Illusion', 'Heavy Armor'],
      secondary: ['Restoration', 'One-Handed'],
    },
    defaultEquipment: {
      weapon: 'Staff of Flames',
      armor: 'Apprentice Robes',
    },
    marriageable: false,
    essential: false,
    voiceType: 'MaleKhajiit',
    specialAbility: 'Master Destruction - Enhanced destruction magic damage',
  },
  brelyna: {
    id: 'brelyna',
    name: 'Brelyna Maryon',
    race: 'Dunmer',
    class: 'mage',
    faction: 'college',
    location: 'College of Winterhold',
    hold: 'Winterhold',
    description: 'A Dark Elf student at the College with a talent for magic.',
    personality: 'Studious and sometimes nervous about her magical experiments.',
    recruitmentCost: 0,
    recruitmentRequirement: "Complete Brelyna's Practice",
    maxLevel: 30,
    baseHealth: 70,
    baseMagicka: 175,
    baseStamina: 50,
    skills: {
      primary: ['Conjuration', 'Alteration', 'Illusion'],
      secondary: ['Destruction', 'Restoration'],
    },
    defaultEquipment: {
      armor: 'Apprentice Robes',
    },
    marriageable: true,
    essential: false,
    voiceType: 'FemaleDarkElf',
    specialAbility: 'Conjure Familiar - Can summon magical creatures',
  },
  
  // Mercenaries
  jenassa: {
    id: 'jenassa',
    name: 'Jenassa',
    race: 'Dunmer',
    class: 'thief',
    faction: 'mercenary',
    location: 'Drunken Huntsman, Whiterun',
    hold: 'Whiterun',
    description: 'A Dark Elf mercenary who enjoys the thrill of the hunt.',
    personality: 'Cold and calculating with a dark sense of humor. Enjoys killing.',
    recruitmentCost: 500,
    maxLevel: 40,
    baseHealth: 80,
    baseMagicka: 50,
    baseStamina: 120,
    skills: {
      primary: ['Archery', 'Light Armor', 'One-Handed'],
      secondary: ['Sneak', 'Block'],
    },
    defaultEquipment: {
      weapon: 'Elven Bow',
      armor: 'Leather Armor',
    },
    marriageable: true,
    essential: false,
    voiceType: 'FemaleDarkElf',
    specialAbility: 'Silent Strike - Increased sneak attack damage',
  },
  marcurio: {
    id: 'marcurio',
    name: 'Marcurio',
    race: 'Imperial',
    class: 'mage',
    faction: 'mercenary',
    location: 'Bee and Barb, Riften',
    hold: 'Riften',
    description: 'A self-proclaimed expert wizard available for hire.',
    personality: 'Arrogant and boastful, but backs it up with powerful magic.',
    recruitmentCost: 500,
    maxLevel: 40,
    baseHealth: 70,
    baseMagicka: 200,
    baseStamina: 60,
    skills: {
      primary: ['Destruction', 'Restoration', 'Alteration'],
      secondary: ['Conjuration', 'Light Armor'],
    },
    defaultEquipment: {
      armor: 'Adept Robes',
    },
    marriageable: true,
    essential: false,
    voiceType: 'MaleCommoner',
    specialAbility: 'Imperial Luck - Finds more gold on enemies',
  },
  stenvar: {
    id: 'stenvar',
    name: 'Stenvar',
    race: 'Nord',
    class: 'warrior',
    faction: 'mercenary',
    location: 'Candlehearth Hall, Windhelm',
    hold: 'Eastmarch',
    description: 'A veteran mercenary with years of combat experience.',
    personality: 'Gruff and practical, values gold and good fights.',
    recruitmentCost: 500,
    maxLevel: 40,
    baseHealth: 130,
    baseMagicka: 50,
    baseStamina: 100,
    skills: {
      primary: ['Two-Handed', 'Heavy Armor', 'Archery'],
      secondary: ['Block', 'One-Handed'],
    },
    defaultEquipment: {
      weapon: 'Steel Battleaxe',
      armor: 'Steel Armor',
    },
    marriageable: true,
    essential: false,
    voiceType: 'MaleNord',
  },
  
  // Thieves Guild
  cicero: {
    id: 'cicero',
    name: 'Cicero',
    race: 'Imperial',
    class: 'thief',
    faction: 'dark_brotherhood',
    location: 'Dark Brotherhood Sanctuary',
    hold: 'Falkreath',
    description: 'The Keeper of the Night Mother, utterly devoted to his duty.',
    personality: 'Insane and unpredictable with a childlike glee for murder.',
    recruitmentCost: 0,
    recruitmentRequirement: 'Spare Cicero during Dark Brotherhood questline',
    maxLevel: 50,
    baseHealth: 90,
    baseMagicka: 50,
    baseStamina: 130,
    skills: {
      primary: ['Sneak', 'One-Handed', 'Light Armor'],
      secondary: ['Archery', 'Lockpicking'],
    },
    defaultEquipment: {
      weapon: 'Ebony Dagger',
      armor: 'Jester Outfit',
    },
    marriageable: false,
    essential: true,
    voiceType: 'MaleDarkElf', // Unique voice
    specialAbility: 'Assassin\'s Blade - Critical sneak attacks',
  },
  
  // Dawnguard
  serana: {
    id: 'serana',
    name: 'Serana',
    race: 'Nord Vampire',
    class: 'spellsword',
    faction: 'dawnguard',
    location: 'Dimhollow Crypt / Fort Dawnguard',
    hold: 'The Rift',
    description: 'A pure-blooded vampire and daughter of Lord Harkon.',
    personality: 'Sardonic and world-weary, with a surprising warmth beneath the surface.',
    recruitmentCost: 0,
    recruitmentRequirement: 'Progress Dawnguard questline',
    maxLevel: 50,
    baseHealth: 150,
    baseMagicka: 200,
    baseStamina: 100,
    skills: {
      primary: ['Necromancy', 'Destruction', 'Sneak'],
      secondary: ['One-Handed', 'Light Armor'],
    },
    defaultEquipment: {
      weapon: 'Elven Dagger',
      armor: 'Vampire Royal Armor',
    },
    marriageable: false, // Special case, cannot marry
    essential: true,
    voiceType: 'FemaleCommander',
    specialAbility: 'Vampire Lord - Can transform into Vampire Lord form',
  },
};

// ========== HELPER FUNCTIONS ==========

export function getFollowersByFaction(faction: FollowerFaction): FollowerData[] {
  return Object.values(FOLLOWERS).filter(f => f.faction === faction);
}

export function getFollowersByHold(hold: string): FollowerData[] {
  return Object.values(FOLLOWERS).filter(f => f.hold === hold);
}

export function getFollowersByClass(followerClass: FollowerClass): FollowerData[] {
  return Object.values(FOLLOWERS).filter(f => f.class === followerClass);
}

export function getHirableFollowers(playerGold: number): FollowerData[] {
  return Object.values(FOLLOWERS).filter(f => 
    f.recruitmentCost > 0 && f.recruitmentCost <= playerGold
  );
}

export function getFreeFollowers(): FollowerData[] {
  return Object.values(FOLLOWERS).filter(f => f.recruitmentCost === 0);
}

// ========== STATE MANAGEMENT ==========

export function getInitialFollowerState(): FollowerState {
  return {
    activeFollowers: [],
    maxFollowers: 1,
    dismissedFollowers: [],
    recruitedFollowers: [],
    totalFollowersRecruited: 0,
  };
}

export function recruitFollower(
  state: FollowerState,
  followerId: string,
  playerGold: number,
  playerLevel: number
): { success: boolean; newState: FollowerState; goldSpent: number; message: string } {
  const followerData = FOLLOWERS[followerId];
  
  if (!followerData) {
    return { success: false, newState: state, goldSpent: 0, message: 'Follower not found.' };
  }
  
  // Check if already have max followers
  if (state.activeFollowers.length >= state.maxFollowers) {
    return { 
      success: false, 
      newState: state, 
      goldSpent: 0, 
      message: `You already have ${state.maxFollowers} follower(s). Dismiss one first.` 
    };
  }
  
  // Check if already recruited
  if (state.activeFollowers.some(f => f.id === followerId)) {
    return { success: false, newState: state, goldSpent: 0, message: `${followerData.name} is already following you.` };
  }
  
  // Check gold
  if (followerData.recruitmentCost > playerGold) {
    return { 
      success: false, 
      newState: state, 
      goldSpent: 0, 
      message: `You need ${followerData.recruitmentCost} gold to hire ${followerData.name}.` 
    };
  }
  
  // Create active follower
  const followerLevel = Math.min(followerData.maxLevel, playerLevel);
  const activeFollower: ActiveFollower = {
    id: followerId,
    data: followerData,
    currentHealth: followerData.baseHealth + followerLevel * 5,
    maxHealth: followerData.baseHealth + followerLevel * 5,
    level: followerLevel,
    experience: 0,
    affinity: 50, // Start neutral
    equipment: [],
    isEssential: followerData.essential,
    dismissed: false,
    lastInteraction: Date.now(),
    combatStyle: getCombatStyle(followerData.class),
    isWaiting: false,
  };
  
  return {
    success: true,
    newState: {
      ...state,
      activeFollowers: [...state.activeFollowers, activeFollower],
      recruitedFollowers: state.recruitedFollowers.includes(followerId) 
        ? state.recruitedFollowers 
        : [...state.recruitedFollowers, followerId],
      totalFollowersRecruited: state.totalFollowersRecruited + 1,
    },
    goldSpent: followerData.recruitmentCost,
    message: `${followerData.name} is now following you.`,
  };
}

function getCombatStyle(followerClass: FollowerClass): 'melee' | 'ranged' | 'magic' | 'support' {
  switch (followerClass) {
    case 'warrior':
    case 'tank':
      return 'melee';
    case 'archer':
    case 'thief':
      return 'ranged';
    case 'mage':
      return 'magic';
    case 'healer':
      return 'support';
    case 'spellsword':
      return 'melee'; // Uses melee with magic support
    default:
      return 'melee';
  }
}

export function dismissFollower(
  state: FollowerState,
  followerId: string,
  currentLocation: string
): { success: boolean; newState: FollowerState; message: string } {
  const followerIndex = state.activeFollowers.findIndex(f => f.id === followerId);
  
  if (followerIndex === -1) {
    return { success: false, newState: state, message: 'Follower not found in your party.' };
  }
  
  const follower = state.activeFollowers[followerIndex];
  const newActiveFollowers = state.activeFollowers.filter(f => f.id !== followerId);
  
  return {
    success: true,
    newState: {
      ...state,
      activeFollowers: newActiveFollowers,
      dismissedFollowers: [
        ...state.dismissedFollowers,
        { followerId, location: follower.data.location, timestamp: Date.now() },
      ],
    },
    message: `${follower.data.name} has been dismissed and will return to ${follower.data.location}.`,
  };
}

export function setFollowerWaiting(
  state: FollowerState,
  followerId: string,
  location: string,
  waiting: boolean
): FollowerState {
  return {
    ...state,
    activeFollowers: state.activeFollowers.map(f => 
      f.id === followerId 
        ? { ...f, isWaiting: waiting, waitLocation: waiting ? location : undefined }
        : f
    ),
  };
}

export function updateFollowerAffinity(
  state: FollowerState,
  followerId: string,
  change: number
): FollowerState {
  return {
    ...state,
    activeFollowers: state.activeFollowers.map(f => 
      f.id === followerId 
        ? { ...f, affinity: Math.max(0, Math.min(100, f.affinity + change)) }
        : f
    ),
  };
}

export function healFollower(
  state: FollowerState,
  followerId: string,
  amount: number
): FollowerState {
  return {
    ...state,
    activeFollowers: state.activeFollowers.map(f => 
      f.id === followerId 
        ? { ...f, currentHealth: Math.min(f.maxHealth, f.currentHealth + amount) }
        : f
    ),
  };
}

export function damageFollower(
  state: FollowerState,
  followerId: string,
  damage: number
): { newState: FollowerState; followerKilled: boolean; message?: string } {
  let followerKilled = false;
  let message: string | undefined;
  
  const newState = {
    ...state,
    activeFollowers: state.activeFollowers.map(f => {
      if (f.id !== followerId) return f;
      
      const newHealth = f.currentHealth - damage;
      
      if (newHealth <= 0) {
        if (f.isEssential) {
          // Essential followers go to "recovery" state
          message = `${f.data.name} is recovering and cannot fight.`;
          return { ...f, currentHealth: 1 };
        } else {
          followerKilled = true;
          message = `${f.data.name} has been killed!`;
          return { ...f, currentHealth: 0 };
        }
      }
      
      return { ...f, currentHealth: newHealth };
    }).filter(f => f.currentHealth > 0 || f.isEssential),
  };
  
  return { newState, followerKilled, message };
}

export function giveItemToFollower(
  state: FollowerState,
  followerId: string,
  item: InventoryItem
): FollowerState {
  return {
    ...state,
    activeFollowers: state.activeFollowers.map(f => 
      f.id === followerId 
        ? { ...f, equipment: [...f.equipment, item] }
        : f
    ),
  };
}

export function takeItemFromFollower(
  state: FollowerState,
  followerId: string,
  itemId: string
): { newState: FollowerState; item: InventoryItem | null } {
  let takenItem: InventoryItem | null = null;
  
  const newState = {
    ...state,
    activeFollowers: state.activeFollowers.map(f => {
      if (f.id !== followerId) return f;
      
      const itemIndex = f.equipment.findIndex(e => e.id === itemId);
      if (itemIndex === -1) return f;
      
      takenItem = f.equipment[itemIndex];
      const newEquipment = f.equipment.filter(e => e.id !== itemId);
      
      return { ...f, equipment: newEquipment };
    }),
  };
  
  return { newState, item: takenItem };
}

// ========== FOLLOWER DIALOGUE ==========

export function getFollowerGreeting(follower: ActiveFollower): string {
  const greetings: Record<string, string[]> = {
    lydia: [
      "Yes, my Thane?",
      "I am sworn to carry your burdens.",
      "Honor to you, my Thane.",
    ],
    aela: [
      "The hunt awaits.",
      "There's prey to be had.",
      "What do you need?",
    ],
    serana: [
      "What is it?",
      "I'm here.",
      "Something on your mind?",
    ],
    cicero: [
      "Yes? Yes? What does the Listener need?",
      "Oh, Cicero is so happy to help!",
      "Let's kill someone!",
    ],
    j_zargo: [
      "J'zargo is ready when you are.",
      "This one hopes there will be magic involved.",
      "What does my friend need?",
    ],
    default: [
      "What do you need?",
      "I'm with you.",
      "Ready when you are.",
    ],
  };
  
  const lines = greetings[follower.id] || greetings.default;
  return lines[Math.floor(Math.random() * lines.length)];
}

export function getFollowerCombatLine(follower: ActiveFollower): string {
  const lines: Record<string, string[]> = {
    lydia: [
      "I'll protect you!",
      "For the Dragonborn!",
      "You'll make a fine rug, cat!",
    ],
    aela: [
      "I smell weakness!",
      "The hunt is on!",
      "You're going down!",
    ],
    serana: [
      "This ends now.",
      "You should have stayed away.",
      "How tiresome.",
    ],
    cicero: [
      "Hehehehe! Die! Die! Die!",
      "Cicero will cut you!",
      "Stab stab stab!",
    ],
    default: [
      "For victory!",
      "You'll die today!",
      "Come at me!",
    ],
  };
  
  const followerLines = lines[follower.id] || lines.default;
  return followerLines[Math.floor(Math.random() * followerLines.length)];
}
