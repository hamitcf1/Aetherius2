/**
 * Dynamic Events & Missions Service
 * 
 * Manages level-gated events and missions that:
 * - Unlock every 5 levels when all current tier events are completed
 * - Persist per user in Firebase
 * - Expire based on in-game time (24 game hours)
 * - Support chain systems for connected storylines
 * - Integrate with the adventure system
 */

import {
  DynamicEvent,
  DynamicMission,
  DynamicEventState,
  EventChain,
  EventNotificationData,
  LevelTier,
  DynamicEventType,
  GameTime,
  Character,
  LEVEL_TIER_THRESHOLDS,
  TIER_REWARD_CAPS,
  DEFAULT_DYNAMIC_EVENT_STATE,
  getLevelTier,
  getGameTimeInHours,
  isEventExpired,
} from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

export const MAX_ACTIVE_EVENTS = 5;
export const DEFAULT_EVENT_DURATION_HOURS = 24; // In-game hours

// Event templates by tier
export const EVENT_TEMPLATES: Record<LevelTier, Array<Omit<DynamicEvent, 'id' | 'characterId' | 'createdAt' | 'createdAtGameTime' | 'status' | 'firestoreId'>>> = {
  1: [
    {
      name: 'Bandit Roadblock',
      type: 'bandit',
      description: 'Bandits have set up a roadblock and are extorting travelers.',
      levelTier: 1,
      levelRequirement: 1,
      location: { name: 'White River Bridge', x: 44, y: 58, hold: 'Whiterun Hold' },
      rewards: { gold: { min: 50, max: 150 }, xp: { min: 50, max: 100 } },
      durationHours: 24,
      adventurePrompt: 'You encounter a bandit roadblock. The bandits demand payment or threaten violence.',
    },
    {
      name: 'Lost Merchant',
      type: 'merchant',
      description: 'A Khajiit merchant has lost their way and needs assistance.',
      levelTier: 1,
      levelRequirement: 2,
      location: { name: 'Riverwood', x: 40, y: 62, hold: 'Whiterun Hold' },
      rewards: { gold: { min: 30, max: 80 }, xp: { min: 40, max: 80 }, items: ['Merchant Discount Token'] },
      durationHours: 24,
      adventurePrompt: 'A Khajiit merchant asks for help finding their way back to the caravan.',
    },
    {
      name: 'Wolf Attack',
      type: 'combat',
      description: 'A pack of wolves has been attacking livestock near a farm.',
      levelTier: 1,
      levelRequirement: 1,
      location: { name: 'Pelagia Farm', x: 40, y: 54, hold: 'Whiterun Hold' },
      rewards: { gold: { min: 40, max: 100 }, xp: { min: 60, max: 120 } },
      durationHours: 24,
      adventurePrompt: 'Farmers report wolf attacks on their livestock. Hunt down the pack.',
    },
    {
      name: 'Shrine Blessing',
      type: 'shrine',
      description: 'A hidden shrine to Talos offers blessings to the faithful.',
      levelTier: 1,
      levelRequirement: 1,
      location: { name: 'White River Valley', x: 46, y: 56, hold: 'Whiterun Hold' },
      rewards: { gold: { min: 0, max: 0 }, xp: { min: 75, max: 150 } },
      durationHours: 48,
      adventurePrompt: 'You discover a hidden shrine to Talos. Pray for a blessing or move on.',
    },
    {
      name: 'Buried Cache',
      type: 'treasure',
      description: 'A treasure map leads to a buried cache near Riverwood.',
      levelTier: 1,
      levelRequirement: 3,
      location: { name: 'Riverwood Outskirts', x: 38, y: 64, hold: 'Whiterun Hold' },
      rewards: { gold: { min: 100, max: 200 }, xp: { min: 50, max: 100 }, items: ['Random Gem'] },
      durationHours: 24,
      adventurePrompt: 'You found a treasure map. Follow it to uncover the buried cache.',
    },
  ],
  2: [
    {
      name: 'Spider Infestation',
      type: 'combat',
      description: 'Giant spiders have infested a mine entrance.',
      levelTier: 2,
      levelRequirement: 6,
      location: { name: 'Embershard Mine', x: 36, y: 64, hold: 'Whiterun Hold' },
      rewards: { gold: { min: 150, max: 350 }, xp: { min: 150, max: 300 } },
      durationHours: 24,
      adventurePrompt: 'Giant frostbite spiders have taken over a mine. Clear them out.',
    },
    {
      name: 'Bear Den',
      type: 'combat',
      description: 'A bear has made its den too close to the road.',
      levelTier: 2,
      levelRequirement: 7,
      location: { name: 'Falkreath Road', x: 35, y: 72, hold: 'Falkreath Hold' },
      rewards: { gold: { min: 100, max: 250 }, xp: { min: 120, max: 250 }, items: ['Bear Pelt'] },
      durationHours: 24,
      adventurePrompt: 'A dangerous bear threatens travelers. Hunt it down.',
    },
    {
      name: 'Necromancer Sighting',
      type: 'mystery',
      description: 'Strange lights have been seen near an abandoned shack.',
      levelTier: 2,
      levelRequirement: 8,
      location: { name: 'Abandoned Shack', x: 25, y: 30, hold: 'Hjaalmarch' },
      rewards: { gold: { min: 200, max: 400 }, xp: { min: 200, max: 350 } },
      durationHours: 24,
      adventurePrompt: 'Investigate reports of necromantic activity near an abandoned building.',
    },
    {
      name: 'Merchant Escort',
      type: 'escort',
      description: 'A merchant needs protection on the road to Whiterun.',
      levelTier: 2,
      levelRequirement: 6,
      location: { name: 'Honningbrew Meadery', x: 42, y: 56, hold: 'Whiterun Hold' },
      rewards: { gold: { min: 250, max: 450 }, xp: { min: 150, max: 280 } },
      durationHours: 24,
      adventurePrompt: 'Escort a merchant safely through bandit territory.',
    },
    {
      name: 'Ancient Ruins',
      type: 'treasure',
      description: 'An old map reveals the location of forgotten ruins.',
      levelTier: 2,
      levelRequirement: 9,
      location: { name: 'Brittleshin Pass', x: 34, y: 66, hold: 'Whiterun Hold' },
      rewards: { gold: { min: 300, max: 500 }, xp: { min: 200, max: 350 }, items: ['Ancient Nord Artifact'] },
      durationHours: 24,
      adventurePrompt: 'Explore ancient Nordic ruins marked on a mysterious map.',
    },
  ],
  3: [
    {
      name: 'Dragon Sighting',
      type: 'dragon',
      description: 'A dragon has been spotted circling the mountains!',
      levelTier: 3,
      levelRequirement: 11,
      location: { name: 'Dragontooth Crater', x: 10, y: 44, hold: 'The Reach' },
      rewards: { gold: { min: 500, max: 1000 }, xp: { min: 400, max: 600 }, items: ['Dragon Bones', 'Dragon Scales'] },
      durationHours: 48,
      adventurePrompt: 'A dragon terrorizes the region. Track it down and slay it.',
    },
    {
      name: 'Vampire Hunters',
      type: 'investigation',
      description: 'The Dawnguard seeks help tracking a vampire coven.',
      levelTier: 3,
      levelRequirement: 12,
      location: { name: 'Morthal Outskirts', x: 28, y: 28, hold: 'Hjaalmarch' },
      rewards: { gold: { min: 400, max: 800 }, xp: { min: 350, max: 550 } },
      durationHours: 24,
      adventurePrompt: 'Help vampire hunters locate and destroy a dangerous coven.',
    },
    {
      name: 'Giant Camp Threat',
      type: 'combat',
      description: 'Giants are trampling farms and must be driven away.',
      levelTier: 3,
      levelRequirement: 13,
      location: { name: 'Bleakwind Basin', x: 38, y: 48, hold: 'Whiterun Hold' },
      rewards: { gold: { min: 450, max: 900 }, xp: { min: 380, max: 580 }, items: ["Giant's Toe", 'Mammoth Tusk'] },
      durationHours: 24,
      adventurePrompt: 'Giants threaten the farmlands. Drive them back to the wilderness.',
    },
    {
      name: 'Rescue Mission',
      type: 'rescue',
      description: 'A noble\'s daughter has been kidnapped by bandits.',
      levelTier: 3,
      levelRequirement: 14,
      location: { name: 'Valtheim Towers', x: 52, y: 54, hold: 'Whiterun Hold' },
      rewards: { gold: { min: 600, max: 1000 }, xp: { min: 400, max: 600 } },
      durationHours: 24,
      adventurePrompt: 'Rescue a kidnapped noble from a bandit stronghold.',
    },
    {
      name: 'Daedric Whispers',
      type: 'mystery',
      description: 'Strange dreams lead you to a mysterious shrine.',
      levelTier: 3,
      levelRequirement: 15,
      location: { name: 'Shrine of Azura', x: 78, y: 22, hold: 'Winterhold' },
      rewards: { gold: { min: 300, max: 600 }, xp: { min: 450, max: 600 }, items: ['Mysterious Artifact'] },
      durationHours: 48,
      adventurePrompt: 'Follow the whispers to discover what the Daedra want from you.',
    },
  ],
  4: [
    {
      name: 'Forsworn Uprising',
      type: 'combat',
      description: 'The Forsworn are massing for an attack on a village.',
      levelTier: 4,
      levelRequirement: 16,
      location: { name: 'Karthwasten', x: 12, y: 42, hold: 'The Reach' },
      rewards: { gold: { min: 800, max: 1500 }, xp: { min: 600, max: 1000 } },
      durationHours: 24,
      adventurePrompt: 'Stop the Forsworn before they attack the innocent villagers.',
    },
    {
      name: 'Dragon Priest Awakening',
      type: 'combat',
      description: 'An ancient dragon priest stirs in its tomb.',
      levelTier: 4,
      levelRequirement: 20,
      location: { name: 'Forelhost', x: 92, y: 72, hold: 'The Rift' },
      rewards: { gold: { min: 1200, max: 2000 }, xp: { min: 800, max: 1200 }, items: ['Dragon Priest Mask'] },
      durationHours: 48,
      adventurePrompt: 'A dragon priest has awakened. End its reign before it spreads terror.',
    },
    {
      name: 'Thalmor Conspiracy',
      type: 'investigation',
      description: 'Investigate rumors of Thalmor agents plotting against the Nords.',
      levelTier: 4,
      levelRequirement: 18,
      location: { name: 'Solitude Docks', x: 15, y: 19, hold: 'Haafingar' },
      rewards: { gold: { min: 1000, max: 2000 }, xp: { min: 700, max: 1100 } },
      durationHours: 24,
      adventurePrompt: 'Uncover a Thalmor plot and decide what to do with the information.',
    },
    {
      name: 'Falmer Emergence',
      type: 'combat',
      description: 'Falmer have surfaced and are attacking miners.',
      levelTier: 4,
      levelRequirement: 22,
      location: { name: 'Darkwater Crossing', x: 68, y: 58, hold: 'Eastmarch' },
      rewards: { gold: { min: 1500, max: 2500 }, xp: { min: 900, max: 1200 } },
      durationHours: 24,
      adventurePrompt: 'Drive back the Falmer before they overwhelm the mining settlement.',
    },
    {
      name: 'Dwemer Expedition',
      type: 'treasure',
      description: 'A scholar needs an escort into Dwemer ruins.',
      levelTier: 4,
      levelRequirement: 24,
      location: { name: 'Mzulft', x: 85, y: 45, hold: 'Eastmarch' },
      rewards: { gold: { min: 2000, max: 2500 }, xp: { min: 1000, max: 1200 }, items: ['Dwemer Artifact'] },
      durationHours: 48,
      adventurePrompt: 'Protect a scholar as they explore dangerous Dwemer ruins.',
    },
  ],
  5: [
    {
      name: 'Blackreach Incursion',
      type: 'investigation',
      description: 'Something stirs in the depths of Blackreach.',
      levelTier: 5,
      levelRequirement: 26,
      location: { name: 'Alftand', x: 55, y: 22, hold: 'Winterhold' },
      rewards: { gold: { min: 3000, max: 5000 }, xp: { min: 1500, max: 2000 }, items: ['Crimson Nirnroot'] },
      durationHours: 72,
      adventurePrompt: 'Delve into Blackreach to discover what ancient evil awakens.',
    },
    {
      name: 'Dragon Cult Resurgence',
      type: 'combat',
      description: 'The Dragon Cult attempts to resurrect their masters.',
      levelTier: 5,
      levelRequirement: 28,
      location: { name: 'Skuldafn Approach', x: 93, y: 48, hold: 'Eastmarch' },
      rewards: { gold: { min: 3500, max: 5000 }, xp: { min: 1600, max: 2000 } },
      durationHours: 48,
      adventurePrompt: 'Stop the Dragon Cult before they complete their dark ritual.',
    },
    {
      name: 'Legendary Beast',
      type: 'combat',
      description: 'A legendary creature terrorizes the wilderness.',
      levelTier: 5,
      levelRequirement: 30,
      location: { name: 'Labyrinthian', x: 34, y: 30, hold: 'Hjaalmarch' },
      rewards: { gold: { min: 4000, max: 5000 }, xp: { min: 1800, max: 2000 }, items: ['Legendary Trophy'] },
      durationHours: 48,
      adventurePrompt: 'Hunt down a legendary beast that has killed many adventurers.',
    },
    {
      name: 'Oblivion Gate',
      type: 'mystery',
      description: 'A portal to Oblivion has been detected.',
      levelTier: 5,
      levelRequirement: 32,
      location: { name: 'The Pale Pass', x: 48, y: 92, hold: 'Falkreath Hold' },
      rewards: { gold: { min: 4500, max: 5000 }, xp: { min: 1900, max: 2000 }, items: ['Daedric Artifact'] },
      durationHours: 24,
      adventurePrompt: 'Investigate and close an unstable portal to Oblivion.',
    },
    {
      name: 'Ancient Vampire Lord',
      type: 'combat',
      description: 'An ancient vampire lord threatens all of Skyrim.',
      levelTier: 5,
      levelRequirement: 34,
      location: { name: 'Castle Volkihar', x: 4, y: 18, hold: 'Haafingar' },
      rewards: { gold: { min: 5000, max: 5000 }, xp: { min: 2000, max: 2000 } },
      durationHours: 48,
      adventurePrompt: 'Confront the ancient vampire lord in their fortress.',
    },
  ],
  6: [
    {
      name: 'World-Eater Returns',
      type: 'dragon',
      description: 'Alduin\'s shadow looms over Skyrim once more.',
      levelTier: 6,
      levelRequirement: 36,
      location: { name: 'Throat of the World', x: 52, y: 52, hold: 'Whiterun Hold' },
      rewards: { gold: { min: 8000, max: 10000 }, xp: { min: 3500, max: 4000 }, items: ['Legendary Dragon Soul'] },
      durationHours: 72,
      adventurePrompt: 'Face the World-Eater in an epic confrontation for the fate of Skyrim.',
    },
    {
      name: 'Daedric Prince\'s Challenge',
      type: 'mystery',
      description: 'A Daedric Prince demands your attention.',
      levelTier: 6,
      levelRequirement: 40,
      location: { name: 'Shrine of Mehrunes Dagon', x: 48, y: 16, hold: 'The Pale' },
      rewards: { gold: { min: 7000, max: 10000 }, xp: { min: 3000, max: 4000 }, items: ['Daedric Artifact'] },
      durationHours: 48,
      adventurePrompt: 'Answer a Daedric Prince\'s summons and face their trial.',
    },
    {
      name: 'Soul Cairn Invasion',
      type: 'combat',
      description: 'The Ideal Masters attempt to breach into Mundus.',
      levelTier: 6,
      levelRequirement: 45,
      location: { name: 'Soul Cairn Portal', x: 30, y: 95, hold: 'The Rift' },
      rewards: { gold: { min: 9000, max: 10000 }, xp: { min: 3800, max: 4000 } },
      durationHours: 48,
      adventurePrompt: 'Stop the Ideal Masters from invading the mortal realm.',
    },
    {
      name: 'Forgotten Vale Secret',
      type: 'treasure',
      description: 'The last secret of the Snow Elves awaits.',
      levelTier: 6,
      levelRequirement: 48,
      location: { name: 'Forgotten Vale', x: 4, y: 38, hold: 'The Reach' },
      rewards: { gold: { min: 10000, max: 10000 }, xp: { min: 4000, max: 4000 }, items: ['Auriel\'s Shield'] },
      durationHours: 72,
      adventurePrompt: 'Uncover the final mystery of the ancient Snow Elves.',
    },
    {
      name: 'Aetherial Crown',
      type: 'treasure',
      description: 'Legends speak of a crown that grants immense power.',
      levelTier: 6,
      levelRequirement: 50,
      location: { name: 'Aetherium Forge', x: 6, y: 68, hold: 'The Rift' },
      rewards: { gold: { min: 10000, max: 10000 }, xp: { min: 4000, max: 4000 }, items: ['Aetherial Crown'] },
      durationHours: 72,
      adventurePrompt: 'Seek the legendary Aetherium Forge and craft an artifact of immense power.',
    },
  ],
};

// Chain templates for connected storylines
export const EVENT_CHAIN_TEMPLATES: Array<{
  name: string;
  description: string;
  levelTier: LevelTier;
  events: Array<Partial<DynamicEvent> & { name: string; type: DynamicEventType }>;
}> = [
  {
    name: 'The Bandit King',
    description: 'Track down and eliminate the mysterious Bandit King terrorizing the roads.',
    levelTier: 2,
    events: [
      { name: 'Bandit Informant', type: 'investigation', description: 'Find and interrogate a bandit informant.' },
      { name: 'Bandit Lieutenant', type: 'combat', description: 'Defeat the Bandit King\'s lieutenant.' },
      { name: 'Bandit King\'s Lair', type: 'combat', description: 'Storm the Bandit King\'s hideout.' },
    ],
  },
  {
    name: 'Vampire Conspiracy',
    description: 'Uncover a vampire plot threatening Skyrim\'s holds.',
    levelTier: 3,
    events: [
      { name: 'Missing Villagers', type: 'investigation', description: 'Investigate reports of missing villagers.' },
      { name: 'Vampire Thralls', type: 'combat', description: 'Fight through vampire thralls to reach the lair.' },
      { name: 'Master Vampire', type: 'combat', description: 'Destroy the master vampire behind it all.' },
    ],
  },
  {
    name: 'Dragon Rising',
    description: 'Multiple dragon sightings signal a major threat.',
    levelTier: 4,
    events: [
      { name: 'Dragon Scout', type: 'dragon', description: 'Slay a dragon scout.' },
      { name: 'Dragon Nest', type: 'investigation', description: 'Locate the dragons\' gathering point.' },
      { name: 'Dragon Overlord', type: 'dragon', description: 'Face the ancient dragon leading them.' },
    ],
  },
  {
    name: 'Dwemer Secrets',
    description: 'A series of discoveries reveal lost Dwemer technology.',
    levelTier: 5,
    events: [
      { name: 'Dwemer Lexicon', type: 'treasure', description: 'Recover a Dwemer Lexicon from ruins.' },
      { name: 'Dwemer Automaton', type: 'combat', description: 'Defeat a reactivated Dwemer Centurion.' },
      { name: 'Aetherium Shard', type: 'treasure', description: 'Claim the final piece of the Aetherium puzzle.' },
    ],
  },
];

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Create a new event from a template
 */
export const createEventFromTemplate = (
  template: Omit<DynamicEvent, 'id' | 'characterId' | 'createdAt' | 'createdAtGameTime' | 'status' | 'firestoreId'>,
  characterId: string,
  gameTime: GameTime
): DynamicEvent => {
  const gameTimeHours = getGameTimeInHours(gameTime);
  return {
    ...template,
    id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    characterId,
    createdAt: Date.now(),
    createdAtGameTime: gameTimeHours,
    status: 'available',
  };
};

/**
 * Check if player should receive new events (level up + tier events completed)
 */
export const shouldGenerateNewEvents = (
  state: DynamicEventState,
  character: Character
): { shouldGenerate: boolean; reason: string; newTier?: LevelTier } => {
  const currentTier = getLevelTier(character.level);
  const previousTier = state.currentTier;
  
  // Check for tier advancement
  if (currentTier > previousTier) {
    // Check if all events in previous tier are completed
    const tierProgress = state.tierProgress[previousTier];
    if (tierProgress.total === 0 || tierProgress.completed >= tierProgress.total) {
      return { 
        shouldGenerate: true, 
        reason: `Level up to tier ${currentTier} (${LEVEL_TIER_THRESHOLDS[currentTier].name})`,
        newTier: currentTier
      };
    }
    return { 
      shouldGenerate: false, 
      reason: `Complete ${tierProgress.total - tierProgress.completed} more tier ${previousTier} events first` 
    };
  }
  
  // Check if current tier events are all completed and we have room for more
  const activeCount = state.activeEvents.filter(e => 
    e.status === 'available' || e.status === 'active'
  ).length;
  
  if (activeCount < MAX_ACTIVE_EVENTS) {
    const tierProgress = state.tierProgress[currentTier];
    // Allow generation if we have fewer than max active
    return { shouldGenerate: true, reason: 'Room for more events' };
  }
  
  return { shouldGenerate: false, reason: 'Maximum active events reached' };
};

/**
 * Get events available for the current tier
 */
export const getAvailableTemplatesForTier = (tier: LevelTier, characterLevel: number): typeof EVENT_TEMPLATES[1] => {
  const templates = EVENT_TEMPLATES[tier] || [];
  return templates.filter(t => t.levelRequirement <= characterLevel);
};

/**
 * Select random events from available templates
 */
export const selectRandomEvents = (
  tier: LevelTier,
  characterLevel: number,
  count: number,
  excludeNames: string[] = []
): typeof EVENT_TEMPLATES[1] => {
  const available = getAvailableTemplatesForTier(tier, characterLevel)
    .filter(t => !excludeNames.includes(t.name));
  
  // Shuffle and take up to count
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/**
 * Process expired events based on game time
 */
export const processExpiredEvents = (
  state: DynamicEventState,
  currentGameTime: number
): { updatedState: DynamicEventState; expiredEvents: DynamicEvent[] } => {
  const expiredEvents: DynamicEvent[] = [];
  const updatedActiveEvents = state.activeEvents.map(event => {
    if ((event.status === 'available' || event.status === 'active') && 
        isEventExpired(event, currentGameTime)) {
      expiredEvents.push(event);
      return { ...event, status: 'expired' as const };
    }
    return event;
  });
  
  // Update tier progress for expired events
  const updatedTierProgress = { ...state.tierProgress };
  expiredEvents.forEach(event => {
    const tier = event.levelTier;
    if (updatedTierProgress[tier]) {
      // Expired counts as "done" for tier progression purposes
      updatedTierProgress[tier] = {
        ...updatedTierProgress[tier],
        completed: updatedTierProgress[tier].completed + 1,
      };
    }
  });
  
  return {
    updatedState: {
      ...state,
      activeEvents: updatedActiveEvents,
      tierProgress: updatedTierProgress,
    },
    expiredEvents,
  };
};

/**
 * Complete an event and potentially unlock chain events
 */
export const completeEvent = (
  state: DynamicEventState,
  eventId: string,
  gameTime: GameTime
): { updatedState: DynamicEventState; notifications: EventNotificationData[]; nextEvent?: DynamicEvent } => {
  const notifications: EventNotificationData[] = [];
  let nextEvent: DynamicEvent | undefined;
  
  const eventIndex = state.activeEvents.findIndex(e => e.id === eventId);
  if (eventIndex === -1) {
    return { updatedState: state, notifications };
  }
  
  const event = state.activeEvents[eventIndex];
  const updatedEvent: DynamicEvent = {
    ...event,
    status: 'completed',
    completedAt: Date.now(),
  };
  
  // Update active events
  const updatedActiveEvents = [...state.activeEvents];
  updatedActiveEvents[eventIndex] = updatedEvent;
  
  // Update completed IDs
  const updatedCompletedIds = [...state.completedEventIds, eventId];
  
  // Update tier progress
  const updatedTierProgress = { ...state.tierProgress };
  const tier = event.levelTier;
  updatedTierProgress[tier] = {
    ...updatedTierProgress[tier],
    completed: updatedTierProgress[tier].completed + 1,
  };
  
  // Add completion notification
  notifications.push({
    id: `notif_${Date.now()}_complete`,
    type: 'event-complete',
    title: 'Event Completed!',
    message: `You completed: ${event.name}`,
    eventId: event.id,
    timestamp: Date.now(),
    dismissed: false,
    autoDismissSeconds: 5,
  });
  
  // Check for chain progression
  if (event.chainId && event.nextEventId) {
    const chainIndex = state.eventChains.findIndex(c => c.id === event.chainId);
    if (chainIndex !== -1) {
      const chain = state.eventChains[chainIndex];
      const updatedChain: EventChain = {
        ...chain,
        currentEventIndex: chain.currentEventIndex + 1,
      };
      
      // Check if chain is complete
      if (updatedChain.currentEventIndex >= chain.eventIds.length) {
        updatedChain.status = 'completed';
        updatedChain.completedAt = Date.now();
        
        notifications.push({
          id: `notif_${Date.now()}_chain_complete`,
          type: 'chain-complete',
          title: 'Quest Chain Complete!',
          message: `You completed the "${chain.name}" quest chain!`,
          chainId: chain.id,
          timestamp: Date.now(),
          dismissed: false,
          autoDismissSeconds: 8,
        });
      } else {
        // Generate next event in chain
        // This would be handled by AI generation in production
        notifications.push({
          id: `notif_${Date.now()}_chain_next`,
          type: 'chain-unlocked',
          title: 'New Chapter Unlocked!',
          message: `Continue the "${chain.name}" quest chain.`,
          chainId: chain.id,
          timestamp: Date.now(),
          dismissed: false,
          autoDismissSeconds: 6,
        });
      }
      
      const updatedChains = [...state.eventChains];
      updatedChains[chainIndex] = updatedChain;
      
      return {
        updatedState: {
          ...state,
          activeEvents: updatedActiveEvents,
          completedEventIds: updatedCompletedIds,
          tierProgress: updatedTierProgress,
          eventChains: updatedChains,
          pendingNotifications: [...state.pendingNotifications, ...notifications],
        },
        notifications,
        nextEvent,
      };
    }
  }
  
  return {
    updatedState: {
      ...state,
      activeEvents: updatedActiveEvents,
      completedEventIds: updatedCompletedIds,
      tierProgress: updatedTierProgress,
      pendingNotifications: [...state.pendingNotifications, ...notifications],
    },
    notifications,
  };
};

/**
 * Start an event (mark as active)
 */
export const startEvent = (
  state: DynamicEventState,
  eventId: string
): DynamicEventState => {
  const updatedEvents = state.activeEvents.map(e =>
    e.id === eventId ? { ...e, status: 'active' as const } : e
  );
  return { ...state, activeEvents: updatedEvents };
};

/**
 * Generate tier unlock notification
 */
export const createTierUnlockNotification = (tier: LevelTier): EventNotificationData => {
  const tierInfo = LEVEL_TIER_THRESHOLDS[tier];
  return {
    id: `notif_tier_${tier}_${Date.now()}`,
    type: 'tier-unlock',
    title: `${tierInfo.name} Tier Unlocked!`,
    message: `New adventures await! Level ${tierInfo.minLevel}-${tierInfo.maxLevel} events are now available.`,
    tier,
    timestamp: Date.now(),
    dismissed: false,
    autoDismissSeconds: 8,
  };
};

/**
 * Generate new event notification
 */
export const createNewEventNotification = (event: DynamicEvent): EventNotificationData => {
  return {
    id: `notif_event_${event.id}`,
    type: 'new-event',
    title: 'New Event Available!',
    message: event.name,
    eventId: event.id,
    timestamp: Date.now(),
    dismissed: false,
    autoDismissSeconds: 5,
  };
};

/**
 * Initialize event state for a new character
 */
export const initializeEventState = (characterId: string, character: Character): DynamicEventState => {
  const currentTier = getLevelTier(character.level);
  const gameTimeHours = getGameTimeInHours(character.time);
  
  // Generate initial events for current tier
  const initialTemplates = selectRandomEvents(currentTier, character.level, 3);
  const initialEvents = initialTemplates.map(template => 
    createEventFromTemplate(template, characterId, character.time)
  );
  
  return {
    ...DEFAULT_DYNAMIC_EVENT_STATE,
    characterId,
    activeEvents: initialEvents,
    currentTier,
    lastSeenTier: currentTier,
    tierProgress: {
      ...DEFAULT_DYNAMIC_EVENT_STATE.tierProgress,
      [currentTier]: { total: initialEvents.length, completed: 0 },
    },
    lastEventGenerationGameTime: gameTimeHours,
  };
};

/**
 * Get adventure context string for AI integration
 */
export const getEventAdventureContext = (state: DynamicEventState): string => {
  const activeEvents = state.activeEvents.filter(e => e.status === 'active');
  if (activeEvents.length === 0) return '';
  
  const eventDescriptions = activeEvents.map(e => 
    `- Active Event: "${e.name}" at ${e.location.name}: ${e.adventurePrompt}`
  ).join('\n');
  
  return `\n=== ACTIVE MAP EVENTS ===\nThe player has the following active events that may influence the adventure:\n${eventDescriptions}\n`;
};

/**
 * Check if an event location matches the current adventure location
 */
export const isEventAtLocation = (event: DynamicEvent, locationName: string): boolean => {
  const eventLoc = event.location.name.toLowerCase();
  const currentLoc = locationName.toLowerCase();
  return eventLoc.includes(currentLoc) || currentLoc.includes(eventLoc);
};

/**
 * Get events near a specific location
 */
export const getEventsNearLocation = (
  state: DynamicEventState,
  locationName: string
): DynamicEvent[] => {
  return state.activeEvents.filter(e => 
    (e.status === 'available' || e.status === 'active') && 
    isEventAtLocation(e, locationName)
  );
};
