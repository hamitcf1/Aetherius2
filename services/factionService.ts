/**
 * Faction & Reputation Service
 * Tracks player standing with Skyrim's major factions and groups
 */

// ============================================================================
// FACTION DEFINITIONS
// ============================================================================

export type FactionId = 
  | 'empire' | 'stormcloaks' | 'companions' | 'thieves_guild' | 'dark_brotherhood'
  | 'college_of_winterhold' | 'greybeards' | 'blades' | 'bards_college'
  | 'dawnguard' | 'volkihar' | 'vigilants_of_stendarr'
  | 'forsworn' | 'silver_hand' | 'thalmor' | 'penitus_oculatus'
  | 'whiterun' | 'solitude' | 'windhelm' | 'riften' | 'markarth' | 'morthal' | 'falkreath' | 'dawnstar' | 'winterhold';

export type ReputationLevel = 
  | 'hated' | 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'honored' | 'revered' | 'exalted';

export interface Faction {
  id: FactionId;
  name: string;
  type: 'guild' | 'political' | 'religious' | 'hold' | 'hostile';
  description: string;
  headquarters?: string;
  leader?: string;
  enemies?: FactionId[];
  allies?: FactionId[];
  joinable: boolean;
  questline?: boolean; // Has major questline
}

export const FACTIONS: Record<FactionId, Faction> = {
  // Political Factions
  empire: {
    id: 'empire',
    name: 'Imperial Legion',
    type: 'political',
    description: 'The military arm of the Empire, seeking to maintain order in Skyrim.',
    headquarters: 'Castle Dour, Solitude',
    leader: 'General Tullius',
    enemies: ['stormcloaks', 'forsworn', 'thalmor'],
    allies: ['penitus_oculatus'],
    joinable: true,
    questline: true
  },
  stormcloaks: {
    id: 'stormcloaks',
    name: 'Stormcloaks',
    type: 'political',
    description: 'Nordic rebels fighting for Skyrim\'s independence from the Empire.',
    headquarters: 'Palace of the Kings, Windhelm',
    leader: 'Ulfric Stormcloak',
    enemies: ['empire', 'thalmor'],
    allies: [],
    joinable: true,
    questline: true
  },
  
  // Guilds
  companions: {
    id: 'companions',
    name: 'The Companions',
    type: 'guild',
    description: 'An ancient order of warriors based in Whiterun.',
    headquarters: 'Jorrvaskr, Whiterun',
    leader: 'Kodlak Whitemane',
    enemies: ['silver_hand'],
    allies: [],
    joinable: true,
    questline: true
  },
  thieves_guild: {
    id: 'thieves_guild',
    name: 'Thieves Guild',
    type: 'guild',
    description: 'A criminal organization operating from the sewers of Riften.',
    headquarters: 'The Ragged Flagon, Riften',
    leader: 'Mercer Frey',
    enemies: [],
    allies: [],
    joinable: true,
    questline: true
  },
  dark_brotherhood: {
    id: 'dark_brotherhood',
    name: 'Dark Brotherhood',
    type: 'guild',
    description: 'An ancient order of assassins who worship Sithis.',
    headquarters: 'Dawnstar Sanctuary',
    leader: 'Astrid',
    enemies: ['penitus_oculatus'],
    allies: [],
    joinable: true,
    questline: true
  },
  college_of_winterhold: {
    id: 'college_of_winterhold',
    name: 'College of Winterhold',
    type: 'guild',
    description: 'Skyrim\'s premier institution for magical study.',
    headquarters: 'College of Winterhold',
    leader: 'Arch-Mage Savos Aren',
    enemies: ['thalmor'],
    allies: [],
    joinable: true,
    questline: true
  },
  bards_college: {
    id: 'bards_college',
    name: 'Bards College',
    type: 'guild',
    description: 'A school for musicians and performers in Solitude.',
    headquarters: 'Solitude',
    leader: 'Headmaster Viarmo',
    enemies: [],
    allies: [],
    joinable: true,
    questline: false
  },
  
  // Religious/Special
  greybeards: {
    id: 'greybeards',
    name: 'Greybeards',
    type: 'religious',
    description: 'Ancient masters of the Voice who dwell on High Hrothgar.',
    headquarters: 'High Hrothgar',
    leader: 'Paarthurnax',
    enemies: ['blades'],
    allies: [],
    joinable: false,
    questline: true
  },
  blades: {
    id: 'blades',
    name: 'The Blades',
    type: 'guild',
    description: 'Former dragon hunters and protectors of the Dragonborn.',
    headquarters: 'Sky Haven Temple',
    leader: 'Delphine',
    enemies: ['greybeards', 'thalmor'],
    allies: [],
    joinable: true,
    questline: true
  },
  dawnguard: {
    id: 'dawnguard',
    name: 'Dawnguard',
    type: 'guild',
    description: 'Vampire hunters reformed to fight the growing vampire menace.',
    headquarters: 'Fort Dawnguard',
    leader: 'Isran',
    enemies: ['volkihar'],
    allies: ['vigilants_of_stendarr'],
    joinable: true,
    questline: true
  },
  volkihar: {
    id: 'volkihar',
    name: 'Volkihar Clan',
    type: 'guild',
    description: 'An ancient and powerful vampire clan.',
    headquarters: 'Castle Volkihar',
    leader: 'Lord Harkon',
    enemies: ['dawnguard', 'vigilants_of_stendarr'],
    allies: [],
    joinable: true,
    questline: true
  },
  vigilants_of_stendarr: {
    id: 'vigilants_of_stendarr',
    name: 'Vigilants of Stendarr',
    type: 'religious',
    description: 'Holy warriors dedicated to eradicating Daedric influence.',
    headquarters: 'Hall of the Vigilant',
    leader: 'Keeper Carcette',
    enemies: ['volkihar', 'dark_brotherhood'],
    allies: ['dawnguard'],
    joinable: false,
    questline: false
  },
  
  // Hostile Factions
  forsworn: {
    id: 'forsworn',
    name: 'Forsworn',
    type: 'hostile',
    description: 'Native Reachmen fighting to reclaim their homeland.',
    headquarters: 'Druadach Redoubt',
    enemies: ['empire', 'markarth'],
    allies: [],
    joinable: false,
    questline: false
  },
  silver_hand: {
    id: 'silver_hand',
    name: 'Silver Hand',
    type: 'hostile',
    description: 'Werewolf hunters who oppose the Companions.',
    enemies: ['companions'],
    allies: [],
    joinable: false,
    questline: false
  },
  thalmor: {
    id: 'thalmor',
    name: 'Thalmor',
    type: 'political',
    description: 'Aldmeri Dominion agents enforcing the White-Gold Concordat.',
    headquarters: 'Thalmor Embassy',
    enemies: ['stormcloaks', 'blades', 'college_of_winterhold'],
    allies: [],
    joinable: false,
    questline: false
  },
  penitus_oculatus: {
    id: 'penitus_oculatus',
    name: 'Penitus Oculatus',
    type: 'political',
    description: 'The Emperor\'s secret service and bodyguards.',
    headquarters: 'Dragon Bridge',
    enemies: ['dark_brotherhood'],
    allies: ['empire'],
    joinable: false,
    questline: false
  },
  
  // Holds
  whiterun: {
    id: 'whiterun',
    name: 'Whiterun Hold',
    type: 'hold',
    description: 'The central hold of Skyrim, known for its trade.',
    headquarters: 'Dragonsreach',
    leader: 'Jarl Balgruuf',
    enemies: [],
    allies: [],
    joinable: false,
    questline: false
  },
  solitude: {
    id: 'solitude',
    name: 'Haafingar (Solitude)',
    type: 'hold',
    description: 'Capital of Skyrim and seat of Imperial power.',
    headquarters: 'Blue Palace',
    leader: 'Jarl Elisif the Fair',
    allies: ['empire'],
    enemies: ['stormcloaks'],
    joinable: false,
    questline: false
  },
  windhelm: {
    id: 'windhelm',
    name: 'Eastmarch (Windhelm)',
    type: 'hold',
    description: 'Ancient city and capital of the Stormcloak rebellion.',
    headquarters: 'Palace of the Kings',
    leader: 'Ulfric Stormcloak',
    allies: ['stormcloaks'],
    enemies: ['empire'],
    joinable: false,
    questline: false
  },
  riften: {
    id: 'riften',
    name: 'The Rift (Riften)',
    type: 'hold',
    description: 'Southern hold known for its autumn forests and corruption.',
    headquarters: 'Mistveil Keep',
    leader: 'Jarl Laila Law-Giver',
    allies: [],
    enemies: [],
    joinable: false,
    questline: false
  },
  markarth: {
    id: 'markarth',
    name: 'The Reach (Markarth)',
    type: 'hold',
    description: 'Western hold built in ancient Dwemer ruins.',
    headquarters: 'Understone Keep',
    leader: 'Jarl Igmund',
    allies: ['empire'],
    enemies: ['forsworn', 'stormcloaks'],
    joinable: false,
    questline: false
  },
  morthal: {
    id: 'morthal',
    name: 'Hjaalmarch (Morthal)',
    type: 'hold',
    description: 'A foggy swampland known for its mystery.',
    headquarters: 'Highmoon Hall',
    leader: 'Jarl Idgrod Ravencrone',
    allies: [],
    enemies: [],
    joinable: false,
    questline: false
  },
  falkreath: {
    id: 'falkreath',
    name: 'Falkreath Hold',
    type: 'hold',
    description: 'A forested hold with the largest graveyard in Skyrim.',
    headquarters: "Jarl's Longhouse",
    leader: 'Jarl Siddgeir',
    allies: ['empire'],
    enemies: ['stormcloaks'],
    joinable: false,
    questline: false
  },
  dawnstar: {
    id: 'dawnstar',
    name: 'The Pale (Dawnstar)',
    type: 'hold',
    description: 'A frozen mining town on the northern coast.',
    headquarters: 'The White Hall',
    leader: 'Jarl Skald the Elder',
    allies: ['stormcloaks'],
    enemies: ['empire'],
    joinable: false,
    questline: false
  },
  winterhold: {
    id: 'winterhold',
    name: 'Winterhold Hold',
    type: 'hold',
    description: 'Once great, now a small village near the College.',
    headquarters: "Jarl's Longhouse",
    leader: 'Jarl Korir',
    allies: ['stormcloaks'],
    enemies: ['college_of_winterhold'],
    joinable: false,
    questline: false
  },
};

// ============================================================================
// REPUTATION SYSTEM
// ============================================================================

export interface FactionReputation {
  factionId: FactionId;
  reputation: number; // -1000 to +1000
  rank?: string; // Current rank in faction (if joined)
  joined: boolean;
  joinedAt?: number;
  questsCompleted: number;
  crimesAgainst: number;
}

export const REPUTATION_THRESHOLDS: Record<ReputationLevel, { min: number; max: number }> = {
  hated: { min: -1000, max: -500 },
  hostile: { min: -499, max: -200 },
  unfriendly: { min: -199, max: -50 },
  neutral: { min: -49, max: 49 },
  friendly: { min: 50, max: 199 },
  honored: { min: 200, max: 499 },
  revered: { min: 500, max: 799 },
  exalted: { min: 800, max: 1000 },
};

/**
 * Get reputation level from raw value
 */
export const getReputationLevel = (reputation: number): ReputationLevel => {
  for (const [level, { min, max }] of Object.entries(REPUTATION_THRESHOLDS)) {
    if (reputation >= min && reputation <= max) {
      return level as ReputationLevel;
    }
  }
  return reputation < -500 ? 'hated' : 'exalted';
};

/**
 * Get display name for reputation level
 */
export const getReputationDisplayName = (level: ReputationLevel): string => {
  const names: Record<ReputationLevel, string> = {
    hated: '🔴 Hated',
    hostile: '🟠 Hostile',
    unfriendly: '🟡 Unfriendly',
    neutral: '⚪ Neutral',
    friendly: '🟢 Friendly',
    honored: '🔵 Honored',
    revered: '🟣 Revered',
    exalted: '⭐ Exalted',
  };
  return names[level];
};

/**
 * Calculate reputation change, considering faction relationships
 */
export const calculateReputationChange = (
  currentReps: FactionReputation[],
  factionId: FactionId,
  baseChange: number
): Array<{ factionId: FactionId; change: number }> => {
  const changes: Array<{ factionId: FactionId; change: number }> = [];
  const faction = FACTIONS[factionId];
  
  // Primary faction change
  changes.push({ factionId, change: baseChange });
  
  // Allied factions get partial positive rep
  if (faction.allies && baseChange > 0) {
    faction.allies.forEach(allyId => {
      changes.push({ factionId: allyId, change: Math.floor(baseChange * 0.25) });
    });
  }
  
  // Enemy factions get negative rep when you help their enemy
  if (faction.enemies && baseChange > 0) {
    faction.enemies.forEach(enemyId => {
      changes.push({ factionId: enemyId, change: Math.floor(-baseChange * 0.5) });
    });
  }
  
  // Crimes against a faction hurt you with their allies too
  if (baseChange < 0 && faction.allies) {
    faction.allies.forEach(allyId => {
      changes.push({ factionId: allyId, change: Math.floor(baseChange * 0.25) });
    });
  }
  
  return changes;
};

/**
 * Apply reputation changes to state
 */
export const applyReputationChanges = (
  currentReps: FactionReputation[],
  changes: Array<{ factionId: FactionId; change: number }>
): FactionReputation[] => {
  const newReps = [...currentReps];
  
  for (const { factionId, change } of changes) {
    const existing = newReps.find(r => r.factionId === factionId);
    if (existing) {
      existing.reputation = Math.max(-1000, Math.min(1000, existing.reputation + change));
    } else {
      newReps.push({
        factionId,
        reputation: Math.max(-1000, Math.min(1000, change)),
        joined: false,
        questsCompleted: 0,
        crimesAgainst: 0,
      });
    }
  }
  
  return newReps;
};

/**
 * Get initial reputation state for new character
 */
export const getInitialReputation = (race?: string): FactionReputation[] => {
  const reps: FactionReputation[] = Object.keys(FACTIONS).map(id => ({
    factionId: id as FactionId,
    reputation: 0,
    joined: false,
    questsCompleted: 0,
    crimesAgainst: 0,
  }));
  
  // Race-based starting reputation
  if (race) {
    const raceUpper = race.toLowerCase();
    if (raceUpper.includes('nord')) {
      const stormcloak = reps.find(r => r.factionId === 'stormcloaks');
      if (stormcloak) stormcloak.reputation = 25;
    }
    if (raceUpper.includes('imperial')) {
      const empire = reps.find(r => r.factionId === 'empire');
      if (empire) empire.reputation = 25;
    }
    if (raceUpper.includes('high elf') || raceUpper.includes('altmer')) {
      const college = reps.find(r => r.factionId === 'college_of_winterhold');
      if (college) college.reputation = 25;
      const thalmor = reps.find(r => r.factionId === 'thalmor');
      if (thalmor) thalmor.reputation = 50;
    }
    if (raceUpper.includes('dark elf') || raceUpper.includes('dunmer')) {
      const windhelm = reps.find(r => r.factionId === 'windhelm');
      if (windhelm) windhelm.reputation = -25; // Dunmer are discriminated in Windhelm
    }
    if (raceUpper.includes('orc') || raceUpper.includes('orsimer')) {
      const companions = reps.find(r => r.factionId === 'companions');
      if (companions) companions.reputation = 25; // Orcs respected as warriors
    }
    if (raceUpper.includes('khajiit')) {
      const thieves = reps.find(r => r.factionId === 'thieves_guild');
      if (thieves) thieves.reputation = 25;
    }
  }
  
  return reps;
};

// ============================================================================
// FACTION RANKS
// ============================================================================

export const FACTION_RANKS: Record<FactionId, string[]> = {
  companions: ['Whelp', 'Member', 'Proven', 'Circle Member', 'Harbinger'],
  thieves_guild: ['Recruit', 'Footpad', 'Bandit', 'Operative', 'Guildmaster'],
  dark_brotherhood: ['Initiate', 'Assassin', 'Slayer', 'Silencer', 'Listener'],
  college_of_winterhold: ['Apprentice', 'Scholar', 'Evoker', 'Conjurer', 'Arch-Mage'],
  empire: ['Auxiliary', 'Quaestor', 'Praefect', 'Tribune', 'Legate'],
  stormcloaks: ['Unblooded', 'Ice-Veins', 'Bone-Breaker', 'Snow-Hammer', 'Stormblade'],
  dawnguard: ['Recruit', 'Hunter', 'Slayer', 'Guardian', 'Sentinel'],
  volkihar: ['Fledgling', 'Blooded', 'Vampire', 'Master Vampire', 'Vampire Lord'],
  blades: ['Recruit', 'Blade', 'Grandmaster'],
  bards_college: ['Student', 'Graduate', 'Bard'],
  // Non-joinable factions don't have ranks
  greybeards: [],
  vigilants_of_stendarr: [],
  forsworn: [],
  silver_hand: [],
  thalmor: [],
  penitus_oculatus: [],
  whiterun: [],
  solitude: [],
  windhelm: [],
  riften: [],
  markarth: [],
  morthal: [],
  falkreath: [],
  dawnstar: [],
  winterhold: [],
};

/**
 * Get current rank based on reputation and quests completed
 */
export const getFactionRank = (rep: FactionReputation): string | null => {
  const ranks = FACTION_RANKS[rep.factionId];
  if (!ranks || ranks.length === 0 || !rep.joined) return null;
  
  // Rank is based on quests completed, capped at max rank
  const rankIndex = Math.min(rep.questsCompleted, ranks.length - 1);
  return ranks[rankIndex];
};

/**
 * Check if player can join a faction
 */
export const canJoinFaction = (
  factionId: FactionId,
  currentReps: FactionReputation[]
): { canJoin: boolean; reason?: string } => {
  const faction = FACTIONS[factionId];
  
  if (!faction.joinable) {
    return { canJoin: false, reason: 'This faction cannot be joined' };
  }
  
  const rep = currentReps.find(r => r.factionId === factionId);
  
  if (rep?.joined) {
    return { canJoin: false, reason: 'Already a member' };
  }
  
  if (rep && rep.reputation < -100) {
    return { canJoin: false, reason: 'Reputation too low' };
  }
  
  // Check for conflicting memberships
  if (factionId === 'empire') {
    const stormcloak = currentReps.find(r => r.factionId === 'stormcloaks');
    if (stormcloak?.joined) {
      return { canJoin: false, reason: 'Cannot join - you are a Stormcloak' };
    }
  }
  if (factionId === 'stormcloaks') {
    const empire = currentReps.find(r => r.factionId === 'empire');
    if (empire?.joined) {
      return { canJoin: false, reason: 'Cannot join - you serve the Empire' };
    }
  }
  if (factionId === 'dawnguard') {
    const volkihar = currentReps.find(r => r.factionId === 'volkihar');
    if (volkihar?.joined) {
      return { canJoin: false, reason: 'Cannot join - you are a vampire' };
    }
  }
  if (factionId === 'volkihar') {
    const dawnguard = currentReps.find(r => r.factionId === 'dawnguard');
    if (dawnguard?.joined) {
      return { canJoin: false, reason: 'Cannot join - you are a vampire hunter' };
    }
  }
  
  return { canJoin: true };
};
