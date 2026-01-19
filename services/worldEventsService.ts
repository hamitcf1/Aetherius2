/**
 * World Events Service
 * Random encounters, dynamic world events, and civil war state
 */

import { Skill } from '../types';

// ========== TYPES ==========

export type EventType = 
  | 'dragon_attack' | 'vampire_attack' | 'bandit_ambush' | 'wildlife_encounter'
  | 'imperial_patrol' | 'stormcloak_patrol' | 'thalmor_patrol' | 'merchant_caravan'
  | 'pilgrim' | 'bard' | 'fugitive' | 'assassin' | 'courier'
  | 'giant_camp' | 'necromancer_ritual' | 'forsworn_ambush' | 'hunters'
  | 'dawnguard_patrol' | 'vampire_hunters' | 'cultists' | 'treasure_hunter'
  | 'dragon_burial' | 'civil_war_skirmish' | 'daedra_summoning' | 'wandering_mage';

export type EventDanger = 'peaceful' | 'neutral' | 'hostile' | 'deadly';

export type CivilWarSide = 'empire' | 'stormcloaks' | 'neutral';

export type HoldControl = {
  hold: string;
  controlledBy: CivilWarSide;
  contested: boolean;
  battleCount: number;
};

export interface WorldEvent {
  id: string;
  type: EventType;
  name: string;
  description: string;
  danger: EventDanger;
  triggerConditions?: EventTriggerCondition[];
  outcomes: EventOutcome[];
  locationTypes: string[];
  timeRestriction?: 'day' | 'night' | 'any';
  weatherRestriction?: string[];
  minLevel?: number;
  maxLevel?: number;
  weight: number; // Spawn probability weight
}

export interface EventTriggerCondition {
  type: 'level' | 'faction' | 'quest' | 'time' | 'location' | 'weather' | 'civil_war';
  value: string | number | boolean;
  operator?: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
}

export interface EventOutcome {
  id: string;
  label: string;
  skillCheck?: { skill: Skill; difficulty: number };
  result: string;
  rewards?: EventReward[];
  consequences?: EventConsequence[];
}

export interface EventReward {
  type: 'gold' | 'item' | 'xp' | 'reputation';
  value: string | number;
  quantity?: number;
}

export interface EventConsequence {
  type: 'bounty' | 'reputation' | 'quest' | 'spawn_enemy' | 'buff' | 'debuff';
  target?: string;
  value: string | number;
}

export interface CivilWarState {
  playerSide: CivilWarSide;
  empireMorale: number; // 0-100
  stormcloakMorale: number; // 0-100
  holdControl: HoldControl[];
  battlesWon: { empire: number; stormcloaks: number };
  currentPhase: 'early' | 'mid' | 'late' | 'finale' | 'resolved';
  warResolved: boolean;
  winner?: CivilWarSide;
}

export interface WorldEventState {
  activeEvents: ActiveEvent[];
  completedEventIds: string[];
  eventHistory: EventHistoryEntry[];
  civilWar: CivilWarState;
  dragonAttackCount: number;
  lastDragonAttack?: number;
  vampireAttackCount: number;
  lastVampireAttack?: number;
  encountersToday: number;
  lastEncounterReset: number;
}

export interface ActiveEvent {
  eventId: string;
  startTime: number;
  location: string;
  resolved: boolean;
  outcomeId?: string;
}

export interface EventHistoryEntry {
  eventId: string;
  timestamp: number;
  outcomeId: string;
  location: string;
}

// ========== WORLD EVENTS DATABASE ==========

export const WORLD_EVENTS: Record<string, WorldEvent> = {
  // Dragon Attacks
  dragon_attack_normal: {
    id: 'dragon_attack_normal',
    type: 'dragon_attack',
    name: 'Dragon Attack',
    description: 'A dragon appears from the mountains, breathing fire upon the land!',
    danger: 'deadly',
    minLevel: 10,
    outcomes: [
      {
        id: 'fight',
        label: 'Fight the dragon',
        result: 'You engage the mighty dragon in combat!',
        rewards: [
          { type: 'xp', value: 500 },
          { type: 'item', value: 'dragon_scales' },
          { type: 'item', value: 'dragon_bones' },
        ],
      },
      {
        id: 'flee',
        label: 'Flee to safety',
        result: 'You retreat to cover as the dragon rains destruction.',
      },
      {
        id: 'hide',
        label: 'Hide and wait',
        skillCheck: { skill: 'sneak', difficulty: 60 },
        result: 'You remain hidden until the dragon departs.',
      },
    ],
    locationTypes: ['wilderness', 'road', 'town'],
    timeRestriction: 'any',
    weight: 10,
  },
  dragon_frost: {
    id: 'dragon_frost',
    type: 'dragon_attack',
    name: 'Frost Dragon Attack',
    description: 'A fearsome frost dragon descends with icy breath!',
    danger: 'deadly',
    minLevel: 20,
    outcomes: [
      {
        id: 'fight',
        label: 'Fight the frost dragon',
        result: 'You face the ancient frost dragon!',
        rewards: [
          { type: 'xp', value: 750 },
          { type: 'item', value: 'dragon_scales' },
          { type: 'item', value: 'dragon_bones' },
        ],
      },
      {
        id: 'flee',
        label: 'Escape the frozen death',
        result: 'You flee as ice covers the ground behind you.',
      },
    ],
    locationTypes: ['wilderness', 'mountain'],
    weatherRestriction: ['snow', 'blizzard', 'clear'],
    weight: 5,
  },
  
  // Vampire Attacks
  vampire_attack_city: {
    id: 'vampire_attack_city',
    type: 'vampire_attack',
    name: 'Vampire Attack',
    description: 'Vampires emerge from the shadows to feed on the innocent!',
    danger: 'deadly',
    timeRestriction: 'night',
    outcomes: [
      {
        id: 'fight',
        label: 'Defend the citizens',
        result: 'You fight to protect the people from the vampire menace!',
        rewards: [
          { type: 'xp', value: 200 },
          { type: 'reputation', value: 'guards' },
        ],
      },
      {
        id: 'ignore',
        label: 'Stay out of it',
        result: 'You let the guards handle it, though some citizens fall.',
        consequences: [
          { type: 'reputation', target: 'guards', value: -10 },
        ],
      },
      {
        id: 'join',
        label: 'Join the vampires',
        result: 'You reveal yourself to be aligned with the darkness...',
        consequences: [
          { type: 'bounty', target: 'current_hold', value: 1000 },
        ],
      },
    ],
    locationTypes: ['city', 'town'],
    weight: 8,
  },
  
  // Bandit Encounters
  bandit_ambush: {
    id: 'bandit_ambush',
    type: 'bandit_ambush',
    name: 'Bandit Ambush',
    description: 'Bandits emerge from hiding, weapons drawn!',
    danger: 'hostile',
    outcomes: [
      {
        id: 'fight',
        label: 'Fight them',
        result: 'You engage the bandits in combat!',
        rewards: [
          { type: 'xp', value: 50 },
          { type: 'gold', value: 25 },
        ],
      },
      {
        id: 'pay',
        label: 'Pay the toll (50 gold)',
        result: 'You grudgingly hand over some gold.',
      },
      {
        id: 'intimidate',
        label: 'Intimidate them',
        skillCheck: { skill: 'speech', difficulty: 40 },
        result: 'The bandits think better of attacking you.',
        rewards: [{ type: 'xp', value: 25 }],
      },
    ],
    locationTypes: ['road', 'wilderness', 'ruins'],
    weight: 25,
  },
  
  // Civil War Patrols
  imperial_patrol: {
    id: 'imperial_patrol',
    type: 'imperial_patrol',
    name: 'Imperial Patrol',
    description: 'An Imperial patrol approaches, examining travelers.',
    danger: 'neutral',
    outcomes: [
      {
        id: 'greet',
        label: 'Greet them respectfully',
        result: 'The soldiers nod and continue their patrol.',
      },
      {
        id: 'praise_empire',
        label: 'Praise the Empire',
        result: 'The soldiers smile at your loyalty.',
        rewards: [{ type: 'reputation', value: 'empire' }],
      },
      {
        id: 'attack',
        label: 'Attack them',
        result: 'You assault the Imperial soldiers!',
        consequences: [
          { type: 'bounty', target: 'current_hold', value: 500 },
          { type: 'reputation', target: 'stormcloaks', value: 10 },
        ],
      },
    ],
    locationTypes: ['road', 'town'],
    triggerConditions: [
      { type: 'civil_war', value: 'empire_territory' },
    ],
    weight: 15,
  },
  stormcloak_patrol: {
    id: 'stormcloak_patrol',
    type: 'stormcloak_patrol',
    name: 'Stormcloak Patrol',
    description: 'Stormcloak soldiers patrol the road, watchful for enemies.',
    danger: 'neutral',
    outcomes: [
      {
        id: 'greet',
        label: 'Greet them',
        result: 'The Stormcloaks acknowledge you and move on.',
      },
      {
        id: 'praise_ulfric',
        label: 'Praise Ulfric',
        result: 'The soldiers cheer at your support for the rebellion.',
        rewards: [{ type: 'reputation', value: 'stormcloaks' }],
      },
      {
        id: 'attack',
        label: 'Attack them',
        result: 'You assault the Stormcloak soldiers!',
        consequences: [
          { type: 'bounty', target: 'current_hold', value: 500 },
          { type: 'reputation', target: 'empire', value: 10 },
        ],
      },
    ],
    locationTypes: ['road', 'town'],
    triggerConditions: [
      { type: 'civil_war', value: 'stormcloak_territory' },
    ],
    weight: 15,
  },
  thalmor_patrol: {
    id: 'thalmor_patrol',
    type: 'thalmor_patrol',
    name: 'Thalmor Patrol',
    description: 'High Elven Thalmor agents escort a prisoner down the road.',
    danger: 'neutral',
    outcomes: [
      {
        id: 'ignore',
        label: 'Let them pass',
        result: 'You step aside as the Thalmor march by.',
      },
      {
        id: 'question',
        label: 'Ask about the prisoner',
        result: '"A heretic being taken for questioning. Move along."',
      },
      {
        id: 'free_prisoner',
        label: 'Free the prisoner',
        result: 'You attack the Thalmor to free their captive!',
        rewards: [{ type: 'xp', value: 150 }],
        consequences: [
          { type: 'reputation', target: 'thalmor', value: -50 },
        ],
      },
    ],
    locationTypes: ['road'],
    weight: 5,
  },
  
  // Peaceful Encounters
  merchant_caravan: {
    id: 'merchant_caravan',
    type: 'merchant_caravan',
    name: 'Merchant Caravan',
    description: 'A Khajiit caravan has set up camp nearby.',
    danger: 'peaceful',
    outcomes: [
      {
        id: 'trade',
        label: 'Browse their wares',
        result: 'You examine the exotic goods the Khajiit have for sale.',
      },
      {
        id: 'chat',
        label: 'Talk with them',
        result: '"Khajiit has wares, if you have coin."',
      },
      {
        id: 'rob',
        label: 'Attempt to rob them',
        skillCheck: { skill: 'sneak', difficulty: 70 },
        result: 'You try to steal from the caravan...',
        consequences: [
          { type: 'bounty', target: 'current_hold', value: 100 },
        ],
      },
    ],
    locationTypes: ['road', 'city_outskirts'],
    timeRestriction: 'any',
    weight: 12,
  },
  pilgrim: {
    id: 'pilgrim',
    type: 'pilgrim',
    name: 'Traveling Pilgrim',
    description: 'A pilgrim travels to one of Skyrim\'s sacred sites.',
    danger: 'peaceful',
    outcomes: [
      {
        id: 'talk',
        label: 'Speak with them',
        result: 'The pilgrim shares wisdom about the Nine Divines.',
        rewards: [{ type: 'xp', value: 10 }],
      },
      {
        id: 'bless',
        label: 'Request a blessing',
        result: 'The pilgrim offers a small blessing.',
        rewards: [{ type: 'buff', value: 'blessing_minor' }],
      },
      {
        id: 'donate',
        label: 'Donate gold',
        result: 'The pilgrim thanks you for your generosity.',
        rewards: [{ type: 'reputation', value: 'priests' }],
      },
    ],
    locationTypes: ['road', 'shrine'],
    weight: 8,
  },
  wandering_bard: {
    id: 'wandering_bard',
    type: 'bard',
    name: 'Wandering Bard',
    description: 'A traveling bard offers to play you a song.',
    danger: 'peaceful',
    outcomes: [
      {
        id: 'listen',
        label: 'Listen to a song',
        result: 'The bard plays a stirring tale of ancient heroes.',
        rewards: [{ type: 'buff', value: 'inspired' }],
      },
      {
        id: 'request_ragnar',
        label: 'Request "Ragnar the Red"',
        result: 'The bard launches into the classic tavern song.',
      },
      {
        id: 'tip',
        label: 'Tip the bard (10 gold)',
        result: 'The bard thanks you and plays with extra enthusiasm.',
        rewards: [{ type: 'xp', value: 5 }],
      },
    ],
    locationTypes: ['road', 'tavern', 'city'],
    weight: 10,
  },
  
  // Dangerous Encounters
  forsworn_ambush: {
    id: 'forsworn_ambush',
    type: 'forsworn_ambush',
    name: 'Forsworn Ambush',
    description: 'The savage Forsworn attack from the rocks above!',
    danger: 'hostile',
    outcomes: [
      {
        id: 'fight',
        label: 'Fight them off',
        result: 'You battle the fierce Reachmen!',
        rewards: [
          { type: 'xp', value: 75 },
        ],
      },
      {
        id: 'flee',
        label: 'Run for your life',
        result: 'You flee as arrows rain down around you.',
      },
    ],
    locationTypes: ['reach', 'wilderness'],
    weight: 10,
  },
  necromancer_ritual: {
    id: 'necromancer_ritual',
    type: 'necromancer_ritual',
    name: 'Necromancer Ritual',
    description: 'You stumble upon necromancers raising the dead!',
    danger: 'hostile',
    timeRestriction: 'night',
    outcomes: [
      {
        id: 'fight',
        label: 'Stop the ritual',
        result: 'You interrupt the dark ceremony!',
        rewards: [
          { type: 'xp', value: 100 },
          { type: 'item', value: 'soul_gem' },
        ],
      },
      {
        id: 'watch',
        label: 'Watch from hiding',
        skillCheck: { skill: 'sneak', difficulty: 50 },
        result: 'You observe the ritual from the shadows...',
        rewards: [{ type: 'xp', value: 25 }],
      },
      {
        id: 'flee',
        label: 'Leave quietly',
        result: 'You back away from the unholy scene.',
      },
    ],
    locationTypes: ['wilderness', 'ruins', 'cemetery'],
    weight: 6,
  },
  giant_camp: {
    id: 'giant_camp',
    type: 'giant_camp',
    name: 'Giant Camp',
    description: 'You\'ve wandered near a giant\'s camp. A mammoth grazes nearby.',
    danger: 'deadly',
    outcomes: [
      {
        id: 'avoid',
        label: 'Give it a wide berth',
        result: 'You carefully navigate around the camp.',
      },
      {
        id: 'steal',
        label: 'Try to steal from the chest',
        skillCheck: { skill: 'sneak', difficulty: 80 },
        result: 'You attempt to raid the giant\'s treasure...',
        rewards: [
          { type: 'gold', value: 200 },
          { type: 'xp', value: 50 },
        ],
      },
      {
        id: 'fight',
        label: 'Attack the giant',
        result: 'You engage the towering giant!',
        rewards: [{ type: 'xp', value: 150 }],
      },
    ],
    locationTypes: ['plains', 'wilderness'],
    weight: 8,
  },
  
  // Special Encounters
  fugitive: {
    id: 'fugitive',
    type: 'fugitive',
    name: 'Fleeing Fugitive',
    description: 'A desperate person runs up to you, pressing an item into your hands.',
    danger: 'neutral',
    outcomes: [
      {
        id: 'keep',
        label: 'Keep the item',
        result: '"Please, hold this! They mustn\'t find it on me!"',
        rewards: [{ type: 'item', value: 'random_valuable' }],
      },
      {
        id: 'refuse',
        label: 'Refuse to help',
        result: 'The fugitive curses and runs off.',
      },
      {
        id: 'report',
        label: 'Report them to the hunter',
        result: 'You point out which way they went.',
        rewards: [{ type: 'gold', value: 50 }],
      },
    ],
    locationTypes: ['road', 'city'],
    weight: 5,
  },
  assassin: {
    id: 'assassin',
    type: 'assassin',
    name: 'Dark Brotherhood Assassin',
    description: 'A dark figure approaches with murderous intent!',
    danger: 'deadly',
    minLevel: 15,
    outcomes: [
      {
        id: 'fight',
        label: 'Defend yourself',
        result: 'The assassin attacks with deadly precision!',
        rewards: [
          { type: 'xp', value: 100 },
          { type: 'item', value: 'dark_brotherhood_note' },
        ],
      },
      {
        id: 'talk',
        label: 'Try to negotiate',
        skillCheck: { skill: 'speech', difficulty: 70 },
        result: 'You attempt to reason with the assassin...',
      },
    ],
    locationTypes: ['any'],
    timeRestriction: 'night',
    weight: 3,
  },
  courier: {
    id: 'courier',
    type: 'courier',
    name: 'Courier',
    description: 'A courier approaches with urgent news.',
    danger: 'peaceful',
    outcomes: [
      {
        id: 'accept',
        label: 'Accept the letter',
        result: '"I\'ve been looking for you. Got something I\'m supposed to deliver."',
        rewards: [{ type: 'item', value: 'letter' }],
      },
    ],
    locationTypes: ['any'],
    weight: 8,
  },
  cultists: {
    id: 'cultists',
    type: 'cultists',
    name: 'Miraak Cultists',
    description: 'Masked cultists approach, demanding to know if you are Dragonborn.',
    danger: 'hostile',
    minLevel: 20,
    outcomes: [
      {
        id: 'deny',
        label: 'Deny being Dragonborn',
        result: '"Lies! Lord Miraak demands your soul!"',
        consequences: [{ type: 'spawn_enemy', value: 'cultists' }],
      },
      {
        id: 'fight',
        label: 'Draw your weapon',
        result: 'The cultists attack!',
        rewards: [{ type: 'xp', value: 150 }],
      },
    ],
    locationTypes: ['road', 'town'],
    weight: 3,
  },
  hunters: {
    id: 'hunters',
    type: 'hunters',
    name: 'Hunters',
    description: 'A group of hunters camp by the road with fresh game.',
    danger: 'peaceful',
    outcomes: [
      {
        id: 'trade',
        label: 'Trade for meat',
        result: 'The hunters offer some of their catch.',
      },
      {
        id: 'join',
        label: 'Join the hunt',
        result: 'You spend some time hunting with them.',
        rewards: [
          { type: 'xp', value: 25 },
          { type: 'item', value: 'raw_meat' },
        ],
      },
      {
        id: 'rest',
        label: 'Rest at their camp',
        result: 'You warm yourself by their fire.',
      },
    ],
    locationTypes: ['forest', 'wilderness'],
    weight: 12,
  },
  civil_war_skirmish: {
    id: 'civil_war_skirmish',
    type: 'civil_war_skirmish',
    name: 'Civil War Skirmish',
    description: 'Imperials and Stormcloaks clash in a fierce battle!',
    danger: 'deadly',
    outcomes: [
      {
        id: 'join_empire',
        label: 'Join the Imperials',
        result: 'You fight alongside the Empire!',
        rewards: [{ type: 'reputation', value: 'empire' }],
        consequences: [{ type: 'reputation', target: 'stormcloaks', value: -20 }],
      },
      {
        id: 'join_stormcloaks',
        label: 'Join the Stormcloaks',
        result: 'You fight for Skyrim\'s freedom!',
        rewards: [{ type: 'reputation', value: 'stormcloaks' }],
        consequences: [{ type: 'reputation', target: 'empire', value: -20 }],
      },
      {
        id: 'avoid',
        label: 'Stay out of it',
        result: 'You find cover and wait for the battle to end.',
      },
    ],
    locationTypes: ['road', 'wilderness', 'fort'],
    weight: 5,
  },
};

// ========== INITIAL CIVIL WAR STATE ==========

export function getInitialCivilWarState(): CivilWarState {
  return {
    playerSide: 'neutral',
    empireMorale: 50,
    stormcloakMorale: 50,
    holdControl: [
      { hold: 'Whiterun', controlledBy: 'neutral', contested: false, battleCount: 0 },
      { hold: 'Solitude', controlledBy: 'empire', contested: false, battleCount: 0 },
      { hold: 'Windhelm', controlledBy: 'stormcloaks', contested: false, battleCount: 0 },
      { hold: 'Riften', controlledBy: 'stormcloaks', contested: true, battleCount: 0 },
      { hold: 'Markarth', controlledBy: 'empire', contested: true, battleCount: 0 },
      { hold: 'Dawnstar', controlledBy: 'stormcloaks', contested: false, battleCount: 0 },
      { hold: 'Winterhold', controlledBy: 'stormcloaks', contested: false, battleCount: 0 },
      { hold: 'Morthal', controlledBy: 'empire', contested: false, battleCount: 0 },
      { hold: 'Falkreath', controlledBy: 'empire', contested: true, battleCount: 0 },
    ],
    battlesWon: { empire: 0, stormcloaks: 0 },
    currentPhase: 'early',
    warResolved: false,
  };
}

// ========== STATE MANAGEMENT ==========

export function getInitialWorldEventState(): WorldEventState {
  return {
    activeEvents: [],
    completedEventIds: [],
    eventHistory: [],
    civilWar: getInitialCivilWarState(),
    dragonAttackCount: 0,
    vampireAttackCount: 0,
    encountersToday: 0,
    lastEncounterReset: Date.now(),
  };
}

export function triggerRandomEvent(
  state: WorldEventState,
  playerLevel: number,
  currentLocation: string,
  locationType: string,
  timeOfDay: 'day' | 'night',
  weather?: string
): { newState: WorldEventState; event: WorldEvent | null } {
  // Check daily encounter limit
  const now = Date.now();
  const hoursSinceReset = (now - state.lastEncounterReset) / (1000 * 60 * 60);
  
  let encountersToday = state.encountersToday;
  let lastEncounterReset = state.lastEncounterReset;
  
  if (hoursSinceReset >= 24) {
    encountersToday = 0;
    lastEncounterReset = now;
  }
  
  // Limit of 5 encounters per day
  if (encountersToday >= 5) {
    return { newState: state, event: null };
  }
  
  // Filter eligible events
  const eligibleEvents = Object.values(WORLD_EVENTS).filter(event => {
    // Level check
    if (event.minLevel && playerLevel < event.minLevel) return false;
    if (event.maxLevel && playerLevel > event.maxLevel) return false;
    
    // Location type check
    if (event.locationTypes.length > 0 && 
        !event.locationTypes.includes(locationType) &&
        !event.locationTypes.includes('any')) {
      return false;
    }
    
    // Time restriction
    if (event.timeRestriction && event.timeRestriction !== 'any' && 
        event.timeRestriction !== timeOfDay) {
      return false;
    }
    
    // Weather restriction
    if (event.weatherRestriction && weather && 
        !event.weatherRestriction.includes(weather)) {
      return false;
    }
    
    return true;
  });
  
  if (eligibleEvents.length === 0) {
    return { newState: state, event: null };
  }
  
  // Weight-based random selection
  const totalWeight = eligibleEvents.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  
  let selectedEvent: WorldEvent | null = null;
  for (const event of eligibleEvents) {
    roll -= event.weight;
    if (roll <= 0) {
      selectedEvent = event;
      break;
    }
  }
  
  if (!selectedEvent) {
    return { newState: state, event: null };
  }
  
  // Create active event
  const activeEvent: ActiveEvent = {
    eventId: selectedEvent.id,
    startTime: now,
    location: currentLocation,
    resolved: false,
  };
  
  const newState: WorldEventState = {
    ...state,
    activeEvents: [...state.activeEvents, activeEvent],
    encountersToday: encountersToday + 1,
    lastEncounterReset,
    dragonAttackCount: selectedEvent.type === 'dragon_attack' 
      ? state.dragonAttackCount + 1 
      : state.dragonAttackCount,
    vampireAttackCount: selectedEvent.type === 'vampire_attack'
      ? state.vampireAttackCount + 1
      : state.vampireAttackCount,
  };
  
  return { newState, event: selectedEvent };
}

export function resolveEvent(
  state: WorldEventState,
  eventId: string,
  outcomeId: string
): WorldEventState {
  const activeEvent = state.activeEvents.find(e => e.eventId === eventId);
  if (!activeEvent) return state;
  
  const historyEntry: EventHistoryEntry = {
    eventId,
    timestamp: Date.now(),
    outcomeId,
    location: activeEvent.location,
  };
  
  return {
    ...state,
    activeEvents: state.activeEvents.filter(e => e.eventId !== eventId),
    completedEventIds: [...state.completedEventIds, eventId],
    eventHistory: [...state.eventHistory, historyEntry],
  };
}

export function joinCivilWar(
  state: WorldEventState,
  side: 'empire' | 'stormcloaks'
): WorldEventState {
  return {
    ...state,
    civilWar: {
      ...state.civilWar,
      playerSide: side,
    },
  };
}

export function updateHoldControl(
  state: WorldEventState,
  hold: string,
  newController: CivilWarSide
): WorldEventState {
  const holdControl = state.civilWar.holdControl.map(h => {
    if (h.hold === hold) {
      return {
        ...h,
        controlledBy: newController,
        contested: false,
        battleCount: h.battleCount + 1,
      };
    }
    return h;
  });
  
  // Update morale based on hold changes
  let empireMorale = state.civilWar.empireMorale;
  let stormcloakMorale = state.civilWar.stormcloakMorale;
  
  if (newController === 'empire') {
    empireMorale = Math.min(100, empireMorale + 10);
    stormcloakMorale = Math.max(0, stormcloakMorale - 10);
  } else if (newController === 'stormcloaks') {
    stormcloakMorale = Math.min(100, stormcloakMorale + 10);
    empireMorale = Math.max(0, empireMorale - 10);
  }
  
  // Check win conditions
  const empireHolds = holdControl.filter(h => h.controlledBy === 'empire').length;
  const stormcloakHolds = holdControl.filter(h => h.controlledBy === 'stormcloaks').length;
  
  let winner: CivilWarSide | undefined;
  let warResolved = state.civilWar.warResolved;
  
  if (empireHolds >= 8) {
    winner = 'empire';
    warResolved = true;
  } else if (stormcloakHolds >= 8) {
    winner = 'stormcloaks';
    warResolved = true;
  }
  
  return {
    ...state,
    civilWar: {
      ...state.civilWar,
      holdControl,
      empireMorale,
      stormcloakMorale,
      winner,
      warResolved,
    },
  };
}

// ========== UTILITY FUNCTIONS ==========

export function getEventsByType(type: EventType): WorldEvent[] {
  return Object.values(WORLD_EVENTS).filter(e => e.type === type);
}

export function getEventsByDanger(danger: EventDanger): WorldEvent[] {
  return Object.values(WORLD_EVENTS).filter(e => e.danger === danger);
}

export function getActiveEventCount(state: WorldEventState): number {
  return state.activeEvents.filter(e => !e.resolved).length;
}

export function getCivilWarStatus(state: WorldEventState): string {
  const { civilWar } = state;
  
  if (civilWar.warResolved) {
    return civilWar.winner === 'empire' 
      ? 'The Empire has won the civil war. Skyrim remains under Imperial rule.'
      : 'The Stormcloaks have won. Skyrim is free from the Empire.';
  }
  
  const empireHolds = civilWar.holdControl.filter(h => h.controlledBy === 'empire').length;
  const stormcloakHolds = civilWar.holdControl.filter(h => h.controlledBy === 'stormcloaks').length;
  
  if (empireHolds > stormcloakHolds) {
    return `The Empire is winning (${empireHolds} holds vs ${stormcloakHolds}).`;
  } else if (stormcloakHolds > empireHolds) {
    return `The Stormcloaks are winning (${stormcloakHolds} holds vs ${empireHolds}).`;
  }
  return 'The civil war is evenly matched.';
}
