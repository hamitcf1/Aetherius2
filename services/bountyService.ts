/**
 * Bounty and Crime Service
 * Crime, bounty, and guard interactions
 */

import { Character } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type HoldName = 
  | 'Whiterun' | 'Solitude' | 'Windhelm' | 'Riften' | 'Markarth'
  | 'Morthal' | 'Dawnstar' | 'Winterhold' | 'Falkreath';

export type CrimeType = 
  | 'assault' | 'murder' | 'theft' | 'pickpocket' | 'trespassing'
  | 'horse_theft' | 'escape' | 'transformation' | 'forsworn_conspiracy' | 'jail_break';

export interface Crime {
  id: string;
  type: CrimeType;
  hold: HoldName;
  bounty: number;
  timestamp: number;
  witnessed: boolean;
  description: string;
  victim?: string;
  itemStolen?: string;
  itemValue?: number;
}

export interface HoldBounty {
  hold: HoldName;
  bounty: number;
  crimes: Crime[];
  lifetimeBounty: number;
  jailServings: number;
  bribesUsed: number;
  escapesAttempted: number;
  lastUpdated: number;
}

export interface BountyState {
  holds: Record<HoldName, HoldBounty>;
  totalBounty: number;
  totalCrimes: number;
  currentlyWanted: boolean;
  isInJail: boolean;
  jailHold?: HoldName;
  jailDaysRemaining?: number;
  activelyPursued: boolean; // Guards are actively chasing
}

// ============================================================================
// CRIME DEFINITIONS
// ============================================================================

export const CRIME_BOUNTIES: Record<CrimeType, { base: number; name: string; description: string }> = {
  assault: { 
    base: 40, 
    name: 'Assault', 
    description: 'Attacking a citizen without killing them' 
  },
  murder: { 
    base: 1000, 
    name: 'Murder', 
    description: 'Killing a citizen of Skyrim' 
  },
  theft: { 
    base: 0, // Calculated as half item value
    name: 'Theft', 
    description: 'Stealing items' 
  },
  pickpocket: { 
    base: 25, 
    name: 'Pickpocketing', 
    description: 'Caught stealing from someone\'s pocket' 
  },
  trespassing: { 
    base: 5, 
    name: 'Trespassing', 
    description: 'Entering a restricted area' 
  },
  horse_theft: { 
    base: 50, 
    name: 'Horse Theft', 
    description: 'Stealing a horse' 
  },
  escape: { 
    base: 100, 
    name: 'Escaping Custody', 
    description: 'Resisting arrest or escaping jail' 
  },
  transformation: { 
    base: 1000, 
    name: 'Transformation', 
    description: 'Witnessed transforming into a werewolf or vampire lord' 
  },
  forsworn_conspiracy: { 
    base: 500, 
    name: 'Forsworn Conspiracy', 
    description: 'Involvement in the Forsworn Conspiracy' 
  },
  jail_break: { 
    base: 100, 
    name: 'Jail Break', 
    description: 'Breaking out of jail' 
  },
};

// Hold information
export const HOLDS: Record<HoldName, { capital: string; jarl: string; motto: string }> = {
  Whiterun: { capital: 'Whiterun', jarl: 'Balgruuf the Greater', motto: 'Heart of Skyrim' },
  Solitude: { capital: 'Solitude', jarl: 'Elisif the Fair', motto: 'Imperial Capital of Skyrim' },
  Windhelm: { capital: 'Windhelm', jarl: 'Ulfric Stormcloak', motto: 'Ancient and Proud' },
  Riften: { capital: 'Riften', jarl: 'Laila Law-Giver', motto: 'Home of the Thieves Guild' },
  Markarth: { capital: 'Markarth', jarl: 'Igmund', motto: 'City of Stone' },
  Morthal: { capital: 'Morthal', jarl: 'Idgrod Ravencrone', motto: 'The Swamp Hold' },
  Dawnstar: { capital: 'Dawnstar', jarl: 'Skald the Elder', motto: 'Frozen but Unbroken' },
  Winterhold: { capital: 'Winterhold', jarl: 'Korir', motto: 'Once Great' },
  Falkreath: { capital: 'Falkreath', jarl: 'Siddgeir', motto: 'Land of the Dead' },
};

// ============================================================================
// BOUNTY FUNCTIONS
// ============================================================================

/**
 * Initialize bounty state
 */
export function initializeBountyState(): BountyState {
  const holds: Record<HoldName, HoldBounty> = {} as Record<HoldName, HoldBounty>;
  
  (Object.keys(HOLDS) as HoldName[]).forEach(hold => {
    holds[hold] = {
      hold,
      bounty: 0,
      crimes: [],
      lifetimeBounty: 0,
      jailServings: 0,
      bribesUsed: 0,
      escapesAttempted: 0,
      lastUpdated: Date.now(),
    };
  });

  return {
    holds,
    totalBounty: 0,
    totalCrimes: 0,
    currentlyWanted: false,
    isInJail: false,
    activelyPursued: false,
  };
}

/**
 * Get bounty state from character or initialize
 */
export function getBountyState(character: Character): BountyState {
  if (character.bountyState) {
    return character.bountyState as BountyState;
  }
  return initializeBountyState();
}

/**
 * Calculate bounty for a crime
 */
export function calculateBounty(crimeType: CrimeType, itemValue?: number): number {
  const crimeDef = CRIME_BOUNTIES[crimeType];
  
  if (crimeType === 'theft' && itemValue) {
    return Math.max(5, Math.floor(itemValue / 2)); // Half the item value, minimum 5
  }
  
  return crimeDef.base;
}

/**
 * Commit a crime
 */
export function commitCrime(
  state: BountyState,
  hold: HoldName,
  crimeType: CrimeType,
  witnessed: boolean,
  options?: {
    victim?: string;
    itemStolen?: string;
    itemValue?: number;
  }
): { state: BountyState; crime: Crime; message: string } {
  const bounty = calculateBounty(crimeType, options?.itemValue);
  const crimeDef = CRIME_BOUNTIES[crimeType];

  const crime: Crime = {
    id: `crime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: crimeType,
    hold,
    bounty: witnessed ? bounty : 0,
    timestamp: Date.now(),
    witnessed,
    description: crimeDef.description,
    victim: options?.victim,
    itemStolen: options?.itemStolen,
    itemValue: options?.itemValue,
  };

  // Only add bounty if witnessed
  const actualBounty = witnessed ? bounty : 0;

  const updatedHold: HoldBounty = {
    ...state.holds[hold],
    bounty: state.holds[hold].bounty + actualBounty,
    crimes: [...state.holds[hold].crimes, crime],
    lifetimeBounty: state.holds[hold].lifetimeBounty + actualBounty,
    lastUpdated: Date.now(),
  };

  const newState: BountyState = {
    ...state,
    holds: {
      ...state.holds,
      [hold]: updatedHold,
    },
    totalBounty: state.totalBounty + actualBounty,
    totalCrimes: state.totalCrimes + 1,
    currentlyWanted: updatedHold.bounty > 0,
    activelyPursued: actualBounty >= 40, // Guards pursue for assault and above
  };

  const message = witnessed
    ? `${crimeDef.name} witnessed! ${bounty} gold bounty added in ${hold}.`
    : `${crimeDef.name} committed. No witnesses.`;

  return { state: newState, crime, message };
}

/**
 * Pay bounty to clear crimes in a hold
 */
export function payBounty(
  state: BountyState,
  hold: HoldName,
  goldAvailable: number
): { state: BountyState; success: boolean; goldSpent: number; message: string; stolenItemsRemoved?: boolean } {
  const holdBounty = state.holds[hold];
  
  if (holdBounty.bounty === 0) {
    return { state, success: false, goldSpent: 0, message: `You have no bounty in ${hold}.` };
  }

  if (goldAvailable < holdBounty.bounty) {
    return { 
      state, 
      success: false, 
      goldSpent: 0, 
      message: `You need ${holdBounty.bounty} gold to pay your bounty. You only have ${goldAvailable}.`
    };
  }

  const updatedHold: HoldBounty = {
    ...holdBounty,
    bounty: 0,
    crimes: [], // Clear crime record when paid
    lastUpdated: Date.now(),
  };

  const newTotalBounty = Object.values(state.holds).reduce((sum, h) => {
    if (h.hold === hold) return sum;
    return sum + h.bounty;
  }, 0);

  const newState: BountyState = {
    ...state,
    holds: {
      ...state.holds,
      [hold]: updatedHold,
    },
    totalBounty: newTotalBounty,
    currentlyWanted: newTotalBounty > 0,
    activelyPursued: false,
  };

  return {
    state: newState,
    success: true,
    goldSpent: holdBounty.bounty,
    message: `You paid ${holdBounty.bounty} gold to clear your bounty in ${hold}.`,
    stolenItemsRemoved: true, // Stolen items are confiscated when paying bounty
  };
}

/**
 * Bribe a guard
 */
export function bribeGuard(
  state: BountyState,
  hold: HoldName,
  goldAvailable: number,
  speechSkill: number
): { state: BountyState; success: boolean; goldSpent: number; message: string } {
  const holdBounty = state.holds[hold];
  
  if (holdBounty.bounty === 0) {
    return { state, success: false, goldSpent: 0, message: 'You have no bounty here.' };
  }

  // Bribe cost is based on bounty and speech skill
  // Higher speech = lower bribe cost
  const bribeCost = Math.max(
    10,
    Math.floor(holdBounty.bounty * (1 - speechSkill / 200))
  );

  if (goldAvailable < bribeCost) {
    return {
      state,
      success: false,
      goldSpent: 0,
      message: `The guard wants ${bribeCost} gold for a bribe. You only have ${goldAvailable}.`
    };
  }

  // Success chance based on speech skill and bounty amount
  const successChance = Math.min(90, 30 + speechSkill - Math.floor(holdBounty.bounty / 50));
  const success = Math.random() * 100 < successChance;

  if (!success) {
    // Failed bribe adds to bounty
    const escapeCrime = commitCrime(state, hold, 'escape', true);
    return {
      state: escapeCrime.state,
      success: false,
      goldSpent: 0,
      message: `The guard refused your bribe and called for backup! Bounty increased.`
    };
  }

  // Successful bribe - guard looks the other way temporarily
  const updatedHold: HoldBounty = {
    ...holdBounty,
    bribesUsed: holdBounty.bribesUsed + 1,
    lastUpdated: Date.now(),
  };

  const newState: BountyState = {
    ...state,
    holds: {
      ...state.holds,
      [hold]: updatedHold,
    },
    activelyPursued: false, // Guards stop pursuing
  };

  return {
    state: newState,
    success: true,
    goldSpent: bribeCost,
    message: `You bribed the guard for ${bribeCost} gold. They'll look the other way for now.`
  };
}

/**
 * Serve jail time
 */
export function goToJail(
  state: BountyState,
  hold: HoldName
): { state: BountyState; daysToServe: number; message: string } {
  const holdBounty = state.holds[hold];
  
  // Days = bounty / 100, minimum 1, maximum 7
  const daysToServe = Math.min(7, Math.max(1, Math.floor(holdBounty.bounty / 100)));

  const updatedHold: HoldBounty = {
    ...holdBounty,
    bounty: 0,
    crimes: [],
    jailServings: holdBounty.jailServings + 1,
    lastUpdated: Date.now(),
  };

  const newTotalBounty = Object.values(state.holds).reduce((sum, h) => {
    if (h.hold === hold) return sum;
    return sum + h.bounty;
  }, 0);

  const newState: BountyState = {
    ...state,
    holds: {
      ...state.holds,
      [hold]: updatedHold,
    },
    totalBounty: newTotalBounty,
    currentlyWanted: newTotalBounty > 0,
    activelyPursued: false,
    isInJail: true,
    jailHold: hold,
    jailDaysRemaining: daysToServe,
  };

  return {
    state: newState,
    daysToServe,
    message: `You've been taken to ${hold} jail for ${daysToServe} day${daysToServe > 1 ? 's' : ''}. Your skills may decrease during incarceration.`
  };
}

/**
 * Complete jail time
 */
export function serveJailTime(
  state: BountyState
): { state: BountyState; daysServed: number; message: string; skillPenalties?: Record<string, number> } {
  if (!state.isInJail || !state.jailHold) {
    return { state, daysServed: 0, message: 'You are not in jail.' };
  }

  const daysServed = state.jailDaysRemaining || 1;

  // Skill penalties for each day served (random skills decrease)
  const skillPenalties: Record<string, number> = {};
  const skills = ['One-Handed', 'Two-Handed', 'Archery', 'Sneak', 'Lockpicking', 'Pickpocket'];
  for (let i = 0; i < daysServed; i++) {
    const skill = skills[Math.floor(Math.random() * skills.length)];
    skillPenalties[skill] = (skillPenalties[skill] || 0) - 1;
  }

  const newState: BountyState = {
    ...state,
    isInJail: false,
    jailHold: undefined,
    jailDaysRemaining: undefined,
  };

  return {
    state: newState,
    daysServed,
    message: `You served ${daysServed} day${daysServed > 1 ? 's' : ''} in ${state.jailHold} jail. You're now free.`,
    skillPenalties,
  };
}

/**
 * Attempt jail escape
 */
export function attemptJailEscape(
  state: BountyState,
  lockpickingSkill: number,
  sneakSkill: number
): { state: BountyState; success: boolean; message: string } {
  if (!state.isInJail || !state.jailHold) {
    return { state, success: false, message: 'You are not in jail.' };
  }

  const hold = state.jailHold;
  const holdBounty = state.holds[hold];

  // Escape chance based on lockpicking and sneak
  const escapeChance = Math.min(85, (lockpickingSkill + sneakSkill) / 2);
  const success = Math.random() * 100 < escapeChance;

  if (!success) {
    // Failed escape adds to sentence
    const updatedHold: HoldBounty = {
      ...holdBounty,
      escapesAttempted: holdBounty.escapesAttempted + 1,
      lastUpdated: Date.now(),
    };

    const newState: BountyState = {
      ...state,
      holds: {
        ...state.holds,
        [hold]: updatedHold,
      },
      jailDaysRemaining: (state.jailDaysRemaining || 1) + 2,
    };

    return {
      state: newState,
      success: false,
      message: `Your escape attempt failed! The guards caught you. 2 days added to your sentence.`
    };
  }

  // Successful escape - adds bounty but you're free
  const escapeCrime = commitCrime(state, hold, 'jail_break', true);
  
  const finalState: BountyState = {
    ...escapeCrime.state,
    isInJail: false,
    jailHold: undefined,
    jailDaysRemaining: undefined,
    activelyPursued: true,
    holds: {
      ...escapeCrime.state.holds,
      [hold]: {
        ...escapeCrime.state.holds[hold],
        escapesAttempted: holdBounty.escapesAttempted + 1,
      }
    }
  };

  return {
    state: finalState,
    success: true,
    message: `You escaped from ${hold} jail! But now you're a fugitive with increased bounty.`
  };
}

/**
 * Get bounty status for all holds
 */
export function getBountyStatus(state: BountyState): Array<{
  hold: HoldName;
  bounty: number;
  crimes: number;
  isWanted: boolean;
}> {
  return (Object.keys(HOLDS) as HoldName[]).map(hold => ({
    hold,
    bounty: state.holds[hold].bounty,
    crimes: state.holds[hold].crimes.length,
    isWanted: state.holds[hold].bounty > 0,
  }));
}

/**
 * Get hold with highest bounty
 */
export function getMostWantedHold(state: BountyState): HoldName | null {
  let highest: HoldName | null = null;
  let highestBounty = 0;

  (Object.keys(state.holds) as HoldName[]).forEach(hold => {
    if (state.holds[hold].bounty > highestBounty) {
      highest = hold;
      highestBounty = state.holds[hold].bounty;
    }
  });

  return highest;
}

/**
 * Check if player is wanted in a specific hold
 */
export function isWantedInHold(state: BountyState, hold: HoldName): boolean {
  return state.holds[hold].bounty > 0;
}

/**
 * Get guard response based on bounty level
 */
export function getGuardResponse(bounty: number): {
  hostile: boolean;
  dialogue: string;
  options: string[];
} {
  if (bounty === 0) {
    return {
      hostile: false,
      dialogue: '"No lollygagging."',
      options: ['Continue on your way'],
    };
  }

  if (bounty < 50) {
    return {
      hostile: false,
      dialogue: `"Wait... I know you. You've committed crimes against Skyrim and her people. What say you in your defense?"`,
      options: ['Pay bounty', 'I submit. Take me to jail.', 'I\'d rather die than go to prison!'],
    };
  }

  if (bounty < 500) {
    return {
      hostile: false,
      dialogue: `"Stop right there, criminal scum! You have a bounty on your head. Pay your fine or it's off to jail."`,
      options: ['Pay bounty', 'Go to jail', 'Resist arrest'],
    };
  }

  if (bounty < 1000) {
    return {
      hostile: true,
      dialogue: `"Stop! You've violated the law! Your stolen goods are now forfeit."`,
      options: ['Pay bounty', 'Go to jail', 'Resist arrest', 'Try to bribe'],
    };
  }

  return {
    hostile: true,
    dialogue: `"By order of the Jarl, stop right there! You have committed crimes against Skyrim and her people. Your life is forfeit!"`,
    options: ['Go to jail', 'Resist arrest'],
  };
}
