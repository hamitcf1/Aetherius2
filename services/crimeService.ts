/**
 * Crime & Bounty Tracking Service
 * Tracks crimes committed, bounties by hold, and guard interactions
 */

import { HoldName } from './carriageService';

// ========== TYPES ==========

export type CrimeType = 
  | 'assault' | 'murder' | 'theft' | 'pickpocket' | 'trespassing' 
  | 'escape_jail' | 'werewolf_transformation' | 'vampire_feeding'
  | 'horse_theft' | 'lockpicking' | 'disturbing_peace' | 'forging'
  | 'cannibalism' | 'necromancy';

export interface Crime {
  id: string;
  type: CrimeType;
  hold: HoldName;
  bounty: number;
  timestamp: number;
  witnessed: boolean;
  description: string;
  victimName?: string;
  reportedBy?: string;
}

export interface HoldBounty {
  hold: HoldName;
  bounty: number;
  crimes: Crime[];
  timesJailed: number;
  timesEscaped: number;
  lifetimeBounty: number;
  isWanted: boolean; // Bounty > 0
  isMostWanted: boolean; // Bounty > 1000
}

export interface JailRecord {
  hold: HoldName;
  reason: string;
  daysServed: number;
  escaped: boolean;
  timestamp: number;
  skillLost?: string;
}

export interface CrimeState {
  bounties: Record<HoldName, HoldBounty>;
  totalCrimesCommitted: number;
  totalBountyPaid: number;
  totalDaysJailed: number;
  jailRecords: JailRecord[];
  activePursuit: boolean;
  lastCrimeTimestamp: number;
  isNotorious: boolean; // Known criminal across Skyrim
  stolenItemsValue: number;
  murdersCommitted: number;
  innocentsKilled: number;
}

// ========== CONSTANTS ==========

export const CRIME_BOUNTIES: Record<CrimeType, number> = {
  assault: 40,
  murder: 1000,
  theft: 0, // Variable based on item value
  pickpocket: 25,
  trespassing: 5,
  escape_jail: 100,
  werewolf_transformation: 1000,
  vampire_feeding: 40,
  horse_theft: 50,
  lockpicking: 5,
  disturbing_peace: 10,
  forging: 250,
  cannibalism: 500,
  necromancy: 250,
};

export const CRIME_DESCRIPTIONS: Record<CrimeType, string> = {
  assault: 'Attacked an innocent person',
  murder: 'Killed an innocent person',
  theft: 'Stole items',
  pickpocket: 'Picked someone\'s pocket',
  trespassing: 'Entered a restricted area',
  escape_jail: 'Escaped from prison',
  werewolf_transformation: 'Transformed into a werewolf in public',
  vampire_feeding: 'Fed on an unwilling victim',
  horse_theft: 'Stole a horse',
  lockpicking: 'Picked a lock illegally',
  disturbing_peace: 'Caused a public disturbance',
  forging: 'Committed forgery or counterfeiting',
  cannibalism: 'Committed cannibalism',
  necromancy: 'Practiced illegal necromancy',
};

export const HOLD_NAMES: HoldName[] = [
  'Whiterun', 'Solitude', 'Windhelm', 'Riften', 'Markarth',
  'Morthal', 'Dawnstar', 'Winterhold', 'Falkreath'
];

export const HOLD_JAILS: Record<HoldName, string> = {
  Whiterun: 'Dragonsreach Dungeon',
  Solitude: 'Castle Dour Dungeon',
  Windhelm: 'Bloodworks',
  Riften: 'Riften Jail',
  Markarth: 'Cidhna Mine',
  Morthal: 'Highmoon Hall Jail',
  Dawnstar: 'The White Hall Jail',
  Winterhold: 'The Chill',
  Falkreath: 'Falkreath Jail',
};

// ========== STATE MANAGEMENT ==========

function createEmptyHoldBounty(hold: HoldName): HoldBounty {
  return {
    hold,
    bounty: 0,
    crimes: [],
    timesJailed: 0,
    timesEscaped: 0,
    lifetimeBounty: 0,
    isWanted: false,
    isMostWanted: false,
  };
}

export function getInitialCrimeState(): CrimeState {
  const bounties: Record<HoldName, HoldBounty> = {} as Record<HoldName, HoldBounty>;
  for (const hold of HOLD_NAMES) {
    bounties[hold] = createEmptyHoldBounty(hold);
  }
  
  return {
    bounties,
    totalCrimesCommitted: 0,
    totalBountyPaid: 0,
    totalDaysJailed: 0,
    jailRecords: [],
    activePursuit: false,
    lastCrimeTimestamp: 0,
    isNotorious: false,
    stolenItemsValue: 0,
    murdersCommitted: 0,
    innocentsKilled: 0,
  };
}

export function commitCrime(
  state: CrimeState,
  crimeType: CrimeType,
  hold: HoldName,
  witnessed: boolean,
  options?: {
    stolenValue?: number;
    victimName?: string;
    wasInnocent?: boolean;
  }
): { newState: CrimeState; bountyAdded: number; message: string } {
  // If not witnessed, no bounty added (but crime is tracked)
  const baseBounty = CRIME_BOUNTIES[crimeType];
  let bountyAdded = witnessed ? baseBounty : 0;
  
  // Theft bounty is based on item value
  if (crimeType === 'theft' && options?.stolenValue) {
    bountyAdded = witnessed ? Math.round(options.stolenValue * 0.5) : 0;
  }
  
  const crime: Crime = {
    id: `crime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: crimeType,
    hold,
    bounty: bountyAdded,
    timestamp: Date.now(),
    witnessed,
    description: CRIME_DESCRIPTIONS[crimeType],
    victimName: options?.victimName,
  };
  
  const holdBounty = state.bounties[hold];
  const newBounty = holdBounty.bounty + bountyAdded;
  
  const newHoldBounty: HoldBounty = {
    ...holdBounty,
    bounty: newBounty,
    crimes: [...holdBounty.crimes, crime],
    lifetimeBounty: holdBounty.lifetimeBounty + bountyAdded,
    isWanted: newBounty > 0,
    isMostWanted: newBounty >= 1000,
  };
  
  const newBounties = { ...state.bounties, [hold]: newHoldBounty };
  
  // Track murders and innocents killed
  let murdersCommitted = state.murdersCommitted;
  let innocentsKilled = state.innocentsKilled;
  if (crimeType === 'murder') {
    murdersCommitted++;
    if (options?.wasInnocent !== false) {
      innocentsKilled++;
    }
  }
  
  // Calculate if notorious (wanted in 3+ holds with bounty > 500 each)
  const wantedHolds = Object.values(newBounties).filter(b => b.bounty >= 500).length;
  const isNotorious = wantedHolds >= 3;
  
  let message = '';
  if (witnessed) {
    message = bountyAdded >= 1000 
      ? `Crime witnessed! ${bountyAdded} gold bounty added in ${hold}. You are now MOST WANTED!`
      : `Crime witnessed! ${bountyAdded} gold bounty added in ${hold}.`;
  } else {
    message = `You committed ${CRIME_DESCRIPTIONS[crimeType].toLowerCase()} without being witnessed.`;
  }
  
  return {
    newState: {
      ...state,
      bounties: newBounties,
      totalCrimesCommitted: state.totalCrimesCommitted + 1,
      lastCrimeTimestamp: Date.now(),
      stolenItemsValue: state.stolenItemsValue + (options?.stolenValue || 0),
      murdersCommitted,
      innocentsKilled,
      isNotorious,
      activePursuit: witnessed && bountyAdded > 0,
    },
    bountyAdded,
    message,
  };
}

export function payBounty(
  state: CrimeState,
  hold: HoldName,
  playerGold: number
): { success: boolean; newState: CrimeState; goldPaid: number; message: string } {
  const holdBounty = state.bounties[hold];
  
  if (holdBounty.bounty === 0) {
    return { success: false, newState: state, goldPaid: 0, message: 'You have no bounty in this hold.' };
  }
  
  if (playerGold < holdBounty.bounty) {
    return { 
      success: false, 
      newState: state, 
      goldPaid: 0, 
      message: `You need ${holdBounty.bounty} gold to pay your bounty in ${hold}.` 
    };
  }
  
  const goldPaid = holdBounty.bounty;
  
  const newHoldBounty: HoldBounty = {
    ...holdBounty,
    bounty: 0,
    isWanted: false,
    isMostWanted: false,
  };
  
  return {
    success: true,
    newState: {
      ...state,
      bounties: { ...state.bounties, [hold]: newHoldBounty },
      totalBountyPaid: state.totalBountyPaid + goldPaid,
      activePursuit: false,
    },
    goldPaid,
    message: `You paid ${goldPaid} gold to clear your bounty in ${hold}. The guards leave you alone.`,
  };
}

export function goToJail(
  state: CrimeState,
  hold: HoldName,
  daysServed: number,
  skillToLose?: string
): { newState: CrimeState; jailRecord: JailRecord; message: string } {
  const holdBounty = state.bounties[hold];
  const jailName = HOLD_JAILS[hold];
  
  const jailRecord: JailRecord = {
    hold,
    reason: holdBounty.crimes.length > 0 
      ? holdBounty.crimes[holdBounty.crimes.length - 1].description
      : 'Various crimes',
    daysServed,
    escaped: false,
    timestamp: Date.now(),
    skillLost: skillToLose,
  };
  
  const newHoldBounty: HoldBounty = {
    ...holdBounty,
    bounty: 0,
    isWanted: false,
    isMostWanted: false,
    timesJailed: holdBounty.timesJailed + 1,
  };
  
  return {
    newState: {
      ...state,
      bounties: { ...state.bounties, [hold]: newHoldBounty },
      totalDaysJailed: state.totalDaysJailed + daysServed,
      jailRecords: [...state.jailRecords, jailRecord],
      activePursuit: false,
    },
    jailRecord,
    message: `You served ${daysServed} days in ${jailName}. Your bounty has been cleared.${
      skillToLose ? ` Your ${skillToLose} skill has decreased due to time in jail.` : ''
    }`,
  };
}

export function escapeJail(
  state: CrimeState,
  hold: HoldName
): { newState: CrimeState; message: string } {
  const holdBounty = state.bounties[hold];
  const escapeBounty = CRIME_BOUNTIES.escape_jail;
  
  const escapeCrime: Crime = {
    id: `crime_${Date.now()}_escape`,
    type: 'escape_jail',
    hold,
    bounty: escapeBounty,
    timestamp: Date.now(),
    witnessed: true,
    description: CRIME_DESCRIPTIONS.escape_jail,
  };
  
  const newHoldBounty: HoldBounty = {
    ...holdBounty,
    bounty: holdBounty.bounty + escapeBounty,
    crimes: [...holdBounty.crimes, escapeCrime],
    lifetimeBounty: holdBounty.lifetimeBounty + escapeBounty,
    timesEscaped: holdBounty.timesEscaped + 1,
    isWanted: true,
  };
  
  // Update the most recent jail record to mark as escaped
  const newJailRecords = [...state.jailRecords];
  if (newJailRecords.length > 0) {
    const lastRecord = newJailRecords[newJailRecords.length - 1];
    if (lastRecord.hold === hold) {
      newJailRecords[newJailRecords.length - 1] = { ...lastRecord, escaped: true };
    }
  }
  
  return {
    newState: {
      ...state,
      bounties: { ...state.bounties, [hold]: newHoldBounty },
      jailRecords: newJailRecords,
      activePursuit: true,
    },
    message: `You escaped from ${HOLD_JAILS[hold]}! ${escapeBounty} gold added to your bounty. The guards are searching for you!`,
  };
}

export function bribeguard(
  state: CrimeState,
  hold: HoldName,
  playerGold: number,
  speechSkill: number
): { success: boolean; newState: CrimeState; goldPaid: number; message: string } {
  const holdBounty = state.bounties[hold];
  
  if (holdBounty.bounty === 0) {
    return { success: false, newState: state, goldPaid: 0, message: 'You have no bounty to bribe away.' };
  }
  
  // Bribe cost is half of bounty, requires speech skill check
  const bribeCost = Math.round(holdBounty.bounty * 0.5);
  const speechCheck = Math.random() * 100 < (speechSkill + 20);
  
  if (!speechCheck) {
    return { 
      success: false, 
      newState: state, 
      goldPaid: 0, 
      message: 'The guard refuses your bribe. "Think you can buy me off, criminal?"' 
    };
  }
  
  if (playerGold < bribeCost) {
    return { 
      success: false, 
      newState: state, 
      goldPaid: 0, 
      message: `You need ${bribeCost} gold to bribe the guard.` 
    };
  }
  
  const newHoldBounty: HoldBounty = {
    ...holdBounty,
    bounty: 0,
    isWanted: false,
    isMostWanted: false,
  };
  
  return {
    success: true,
    newState: {
      ...state,
      bounties: { ...state.bounties, [hold]: newHoldBounty },
      activePursuit: false,
    },
    goldPaid: bribeCost,
    message: `The guard pockets your ${bribeCost} gold. "I didn't see anything. Now get out of here."`,
  };
}

export function intimidateGuard(
  state: CrimeState,
  hold: HoldName,
  speechSkill: number,
  isThane: boolean
): { success: boolean; newState: CrimeState; message: string } {
  const holdBounty = state.bounties[hold];
  
  if (holdBounty.bounty === 0) {
    return { success: false, newState: state, message: 'You have no bounty to clear.' };
  }
  
  // Intimidation is harder, but Thanes get a bonus
  const baseChance = isThane ? 70 : 30;
  const speechBonus = speechSkill * 0.3;
  const successChance = baseChance + speechBonus;
  
  if (Math.random() * 100 >= successChance) {
    return { 
      success: false, 
      newState: state, 
      message: 'The guard is unimpressed. "You think I\'m scared of you? Pay the bounty or face justice!"' 
    };
  }
  
  const newHoldBounty: HoldBounty = {
    ...holdBounty,
    bounty: 0,
    isWanted: false,
    isMostWanted: false,
  };
  
  const message = isThane
    ? `"My apologies, Thane. I didn't realize it was you. We'll overlook this incident."`
    : `The guard backs down nervously. "Alright, alright. Just... don't cause any more trouble."`;
  
  return {
    success: true,
    newState: {
      ...state,
      bounties: { ...state.bounties, [hold]: newHoldBounty },
      activePursuit: false,
    },
    message,
  };
}

// ========== QUERY FUNCTIONS ==========

export function getBountyInHold(state: CrimeState, hold: HoldName): number {
  return state.bounties[hold]?.bounty || 0;
}

export function getTotalBounty(state: CrimeState): number {
  return Object.values(state.bounties).reduce((sum, h) => sum + h.bounty, 0);
}

export function getWantedHolds(state: CrimeState): HoldName[] {
  return Object.values(state.bounties)
    .filter(h => h.isWanted)
    .map(h => h.hold);
}

export function getMostWantedHolds(state: CrimeState): HoldName[] {
  return Object.values(state.bounties)
    .filter(h => h.isMostWanted)
    .map(h => h.hold);
}

export function getCrimesInHold(state: CrimeState, hold: HoldName): Crime[] {
  return state.bounties[hold]?.crimes || [];
}

export function getGuardDialogue(state: CrimeState, hold: HoldName): string {
  const holdBounty = state.bounties[hold];
  
  if (!holdBounty || holdBounty.bounty === 0) {
    const normalDialogues = [
      'No lollygagging.',
      'Let me guess... someone stole your sweetroll.',
      'I used to be an adventurer like you, then I took an arrow in the knee.',
      'Watch the skies, traveler.',
      'Citizen.',
      'Stay out of trouble.',
    ];
    return normalDialogues[Math.floor(Math.random() * normalDialogues.length)];
  }
  
  if (holdBounty.bounty < 100) {
    return 'Wait... I know you. You\'re a wanted criminal! Pay your fine or face the consequences.';
  } else if (holdBounty.bounty < 500) {
    return 'Stop right there, criminal scum! You\'ve violated the law. Pay the court a fine or serve your sentence!';
  } else if (holdBounty.bounty < 1000) {
    return 'You\'re a dangerous criminal and a menace to society. Surrender now or die!';
  } else {
    return 'By order of the Jarl, stop right there! You have committed crimes against Skyrim and her people. What say you in your defense?';
  }
}

export function getJailEscapeDifficulty(hold: HoldName): 'easy' | 'medium' | 'hard' | 'very_hard' {
  // Cidhna Mine is special - very hard to escape
  if (hold === 'Markarth') return 'very_hard';
  // The Chill (Winterhold) is isolated and difficult
  if (hold === 'Winterhold') return 'hard';
  // Most other jails are medium difficulty
  return 'medium';
}

export function calculateJailTime(bounty: number): number {
  // 1 day per 100 gold of bounty, minimum 1 day, maximum 7 days
  return Math.max(1, Math.min(7, Math.floor(bounty / 100)));
}

export function getSkillLostInJail(): string {
  // Random skill loss from jail time
  const skills = [
    'One-Handed', 'Two-Handed', 'Archery', 'Block', 'Heavy Armor', 'Light Armor',
    'Sneak', 'Lockpicking', 'Pickpocket', 'Speech', 'Alchemy', 'Smithing',
    'Destruction', 'Conjuration', 'Restoration', 'Alteration', 'Illusion', 'Enchanting'
  ];
  return skills[Math.floor(Math.random() * skills.length)];
}
