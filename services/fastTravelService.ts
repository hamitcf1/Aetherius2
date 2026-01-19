/**
 * Fast Travel Service
 * Manages travel between discovered locations
 */

// ============================================================================
// LOCATION DEFINITIONS
// ============================================================================

export type LocationType = 
  | 'city' | 'town' | 'village' | 'fort' | 'camp' | 'ruin' 
  | 'cave' | 'mine' | 'dungeon' | 'tower' | 'landmark' 
  | 'farm' | 'mill' | 'estate' | 'dock' | 'standing_stone'
  | 'dragon_lair' | 'giant_camp' | 'bandit_camp' | 'nordic_ruin';

export type HoldName = 
  | 'Whiterun' | 'Haafingar' | 'Eastmarch' | 'The Rift' | 'The Reach'
  | 'Falkreath' | 'The Pale' | 'Winterhold' | 'Hjaalmarch';

export interface TravelLocation {
  id: string;
  name: string;
  type: LocationType;
  hold: HoldName;
  coordinates: { x: number; y: number }; // Map coordinates (0-100)
  description: string;
  discovered: boolean;
  services?: ('inn' | 'shop' | 'blacksmith' | 'temple' | 'stables' | 'carriage')[];
  dangerLevel?: number; // 0-10
  isCapital?: boolean;
  connectedLocations?: string[]; // Other location IDs for path finding
}

// ============================================================================
// SKYRIM LOCATIONS DATABASE
// ============================================================================

export const SKYRIM_LOCATIONS: TravelLocation[] = [
  // === MAJOR CITIES ===
  {
    id: 'whiterun',
    name: 'Whiterun',
    type: 'city',
    hold: 'Whiterun',
    coordinates: { x: 50, y: 50 },
    description: 'The central trading hub of Skyrim, dominated by the ancient Dragonsreach.',
    discovered: true, // Starting location
    services: ['inn', 'shop', 'blacksmith', 'temple', 'stables', 'carriage'],
    isCapital: true,
    connectedLocations: ['riverwood', 'rorikstead', 'dragonsreach', 'western_watchtower'],
  },
  {
    id: 'solitude',
    name: 'Solitude',
    type: 'city',
    hold: 'Haafingar',
    coordinates: { x: 25, y: 20 },
    description: 'The capital of Skyrim and seat of Imperial power, built on a natural stone arch.',
    discovered: false,
    services: ['inn', 'shop', 'blacksmith', 'temple', 'stables', 'carriage'],
    isCapital: true,
    connectedLocations: ['dragon_bridge', 'thalmor_embassy'],
  },
  {
    id: 'windhelm',
    name: 'Windhelm',
    type: 'city',
    hold: 'Eastmarch',
    coordinates: { x: 80, y: 25 },
    description: 'The ancient and cold capital of the Stormcloak rebellion.',
    discovered: false,
    services: ['inn', 'shop', 'blacksmith', 'temple', 'stables', 'carriage'],
    isCapital: true,
    connectedLocations: ['kynesgrove', 'mixwater_mill'],
  },
  {
    id: 'riften',
    name: 'Riften',
    type: 'city',
    hold: 'The Rift',
    coordinates: { x: 90, y: 70 },
    description: 'A corrupt city built on a lake, home to the Thieves Guild.',
    discovered: false,
    services: ['inn', 'shop', 'blacksmith', 'temple', 'stables', 'carriage'],
    isCapital: true,
    connectedLocations: ['ivarstead', 'shor_stone'],
  },
  {
    id: 'markarth',
    name: 'Markarth',
    type: 'city',
    hold: 'The Reach',
    coordinates: { x: 10, y: 55 },
    description: 'A city carved into ancient Dwemer ruins, plagued by Forsworn attacks.',
    discovered: false,
    services: ['inn', 'shop', 'blacksmith', 'temple', 'stables', 'carriage'],
    isCapital: true,
    connectedLocations: ['karthwasten', 'old_hroldan'],
  },
  
  // === TOWNS ===
  {
    id: 'riverwood',
    name: 'Riverwood',
    type: 'village',
    hold: 'Whiterun',
    coordinates: { x: 45, y: 55 },
    description: 'A small lumber village near the base of the Throat of the World.',
    discovered: true,
    services: ['inn', 'shop', 'blacksmith'],
    connectedLocations: ['whiterun', 'helgen', 'bleak_falls_barrow'],
  },
  {
    id: 'falkreath',
    name: 'Falkreath',
    type: 'town',
    hold: 'Falkreath',
    coordinates: { x: 35, y: 75 },
    description: 'A town known for its massive cemetery and pine forests.',
    discovered: false,
    services: ['inn', 'shop', 'blacksmith', 'temple'],
    isCapital: true,
    connectedLocations: ['helgen', 'lake_ilinalta'],
  },
  {
    id: 'morthal',
    name: 'Morthal',
    type: 'town',
    hold: 'Hjaalmarch',
    coordinates: { x: 28, y: 35 },
    description: 'A foggy swamp town with rumors of vampires.',
    discovered: false,
    services: ['inn', 'shop'],
    isCapital: true,
    connectedLocations: ['solitude', 'ustengrav'],
  },
  {
    id: 'dawnstar',
    name: 'Dawnstar',
    type: 'town',
    hold: 'The Pale',
    coordinates: { x: 55, y: 15 },
    description: 'A mining town on the northern coast, plagued by nightmares.',
    discovered: false,
    services: ['inn', 'shop', 'blacksmith'],
    isCapital: true,
    connectedLocations: ['whiterun', 'winterhold_city'],
  },
  {
    id: 'winterhold_city',
    name: 'Winterhold',
    type: 'town',
    hold: 'Winterhold',
    coordinates: { x: 70, y: 10 },
    description: 'A ruined town overshadowed by the College of magic.',
    discovered: false,
    services: ['inn'],
    isCapital: true,
    connectedLocations: ['college_of_winterhold', 'dawnstar'],
  },
  
  // === VILLAGES & SETTLEMENTS ===
  {
    id: 'ivarstead',
    name: 'Ivarstead',
    type: 'village',
    hold: 'The Rift',
    coordinates: { x: 65, y: 60 },
    description: 'A small village at the base of the 7,000 Steps.',
    discovered: false,
    services: ['inn'],
    connectedLocations: ['riften', 'high_hrothgar'],
  },
  {
    id: 'rorikstead',
    name: 'Rorikstead',
    type: 'village',
    hold: 'Whiterun',
    coordinates: { x: 25, y: 50 },
    description: 'A farming village with unusually fertile soil.',
    discovered: false,
    services: ['inn'],
    connectedLocations: ['whiterun', 'markarth'],
  },
  {
    id: 'dragon_bridge',
    name: 'Dragon Bridge',
    type: 'village',
    hold: 'Haafingar',
    coordinates: { x: 20, y: 28 },
    description: 'A small village named for its ancient dragon-headed bridge.',
    discovered: false,
    services: ['inn'],
    connectedLocations: ['solitude', 'morthal'],
  },
  {
    id: 'karthwasten',
    name: 'Karthwasten',
    type: 'village',
    hold: 'The Reach',
    coordinates: { x: 15, y: 45 },
    description: 'A silver mining village in the Reach.',
    discovered: false,
    services: [],
    connectedLocations: ['markarth'],
  },
  {
    id: 'shor_stone',
    name: "Shor's Stone",
    type: 'village',
    hold: 'The Rift',
    coordinates: { x: 85, y: 55 },
    description: 'A small mining settlement plagued by spiders.',
    discovered: false,
    services: [],
    connectedLocations: ['riften'],
  },
  {
    id: 'kynesgrove',
    name: 'Kynesgrove',
    type: 'village',
    hold: 'Eastmarch',
    coordinates: { x: 75, y: 35 },
    description: 'A small mining village with an ancient dragon burial mound.',
    discovered: false,
    services: ['inn'],
    connectedLocations: ['windhelm'],
  },
  
  // === DUNGEONS & RUINS ===
  {
    id: 'bleak_falls_barrow',
    name: 'Bleak Falls Barrow',
    type: 'nordic_ruin',
    hold: 'Whiterun',
    coordinates: { x: 40, y: 52 },
    description: 'An ancient Nordic tomb overlooking Riverwood.',
    discovered: false,
    dangerLevel: 3,
    connectedLocations: ['riverwood'],
  },
  {
    id: 'dustmans_cairn',
    name: "Dustman's Cairn",
    type: 'nordic_ruin',
    hold: 'Whiterun',
    coordinates: { x: 55, y: 45 },
    description: 'A burial site rumored to hold ancient treasures.',
    discovered: false,
    dangerLevel: 4,
    connectedLocations: ['whiterun'],
  },
  {
    id: 'ustengrav',
    name: 'Ustengrav',
    type: 'nordic_ruin',
    hold: 'Hjaalmarch',
    coordinates: { x: 32, y: 30 },
    description: 'An ancient tomb said to hold one of the Words of Power.',
    discovered: false,
    dangerLevel: 5,
    connectedLocations: ['morthal'],
  },
  {
    id: 'labyrinthian',
    name: 'Labyrinthian',
    type: 'nordic_ruin',
    hold: 'Hjaalmarch',
    coordinates: { x: 35, y: 28 },
    description: 'A vast and dangerous ruin of the Dragon Cult.',
    discovered: false,
    dangerLevel: 8,
    connectedLocations: ['morthal'],
  },
  
  // === SPECIAL LOCATIONS ===
  {
    id: 'high_hrothgar',
    name: 'High Hrothgar',
    type: 'landmark',
    hold: 'Whiterun',
    coordinates: { x: 60, y: 55 },
    description: 'The ancient monastery of the Greybeards atop the Throat of the World.',
    discovered: false,
    dangerLevel: 2,
    connectedLocations: ['ivarstead'],
  },
  {
    id: 'college_of_winterhold',
    name: 'College of Winterhold',
    type: 'landmark',
    hold: 'Winterhold',
    coordinates: { x: 72, y: 8 },
    description: 'Skyrim\'s premier institution for magical study.',
    discovered: false,
    services: ['shop'],
    connectedLocations: ['winterhold_city'],
  },
  {
    id: 'dragonsreach',
    name: 'Dragonsreach',
    type: 'landmark',
    hold: 'Whiterun',
    coordinates: { x: 50, y: 48 },
    description: 'The palace of the Jarl of Whiterun, built to trap a dragon.',
    discovered: true,
    connectedLocations: ['whiterun'],
  },
  {
    id: 'western_watchtower',
    name: 'Western Watchtower',
    type: 'tower',
    hold: 'Whiterun',
    coordinates: { x: 45, y: 48 },
    description: 'A ruined watchtower west of Whiterun.',
    discovered: false,
    dangerLevel: 5,
    connectedLocations: ['whiterun'],
  },
  {
    id: 'helgen',
    name: 'Helgen',
    type: 'ruin',
    hold: 'Falkreath',
    coordinates: { x: 42, y: 68 },
    description: 'A destroyed town, where it all began...',
    discovered: true,
    dangerLevel: 2,
    connectedLocations: ['riverwood', 'falkreath'],
  },
  
  // === STANDING STONES ===
  {
    id: 'guardian_stones',
    name: 'Guardian Stones',
    type: 'standing_stone',
    hold: 'Whiterun',
    coordinates: { x: 44, y: 58 },
    description: 'Three ancient stones representing the Warrior, Mage, and Thief.',
    discovered: true,
    connectedLocations: ['riverwood'],
  },
  {
    id: 'lord_stone',
    name: 'Lord Stone',
    type: 'standing_stone',
    hold: 'The Pale',
    coordinates: { x: 50, y: 20 },
    description: 'A standing stone granting armor and magic resistance.',
    discovered: false,
    connectedLocations: ['dawnstar'],
  },
];

// ============================================================================
// FAST TRAVEL FUNCTIONS
// ============================================================================

export interface TravelCost {
  gold: number;
  timeHours: number;
  dangerRating: number; // 0-10
}

export interface TravelResult {
  success: boolean;
  destination: TravelLocation;
  timePassed: number;
  goldSpent: number;
  encounters?: string[];
  message: string;
}

/**
 * Calculate distance between two locations
 */
export const calculateDistance = (from: TravelLocation, to: TravelLocation): number => {
  const dx = to.coordinates.x - from.coordinates.x;
  const dy = to.coordinates.y - from.coordinates.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate travel cost between locations
 */
export const calculateTravelCost = (
  from: TravelLocation,
  to: TravelLocation,
  useCarriage: boolean = false
): TravelCost => {
  const distance = calculateDistance(from, to);
  
  if (useCarriage) {
    // Carriage travel - faster but costs gold
    const gold = Math.max(20, Math.round(distance * 2));
    const timeHours = Math.max(1, Math.round(distance / 15));
    return { gold, timeHours, dangerRating: 0 };
  }
  
  // Walking - free but takes time and can be dangerous
  const timeHours = Math.max(1, Math.round(distance / 5));
  const baseDanger = (from.dangerLevel || 0) + (to.dangerLevel || 0);
  const dangerRating = Math.min(10, Math.round(baseDanger / 2 + distance / 20));
  
  return { gold: 0, timeHours, dangerRating };
};

/**
 * Get all discovered locations
 */
export const getDiscoveredLocations = (
  locations: TravelLocation[]
): TravelLocation[] => {
  return locations.filter(loc => loc.discovered);
};

/**
 * Get locations by hold
 */
export const getLocationsByHold = (
  locations: TravelLocation[],
  hold: HoldName
): TravelLocation[] => {
  return locations.filter(loc => loc.hold === hold);
};

/**
 * Get locations with specific service
 */
export const getLocationsWithService = (
  locations: TravelLocation[],
  service: 'inn' | 'shop' | 'blacksmith' | 'temple' | 'stables' | 'carriage'
): TravelLocation[] => {
  return locations.filter(loc => loc.services?.includes(service));
};

/**
 * Check if location has carriage service
 */
export const hasCarriageService = (location: TravelLocation): boolean => {
  return location.services?.includes('carriage') || false;
};

/**
 * Get available destinations from a location
 */
export const getAvailableDestinations = (
  from: TravelLocation,
  allLocations: TravelLocation[],
  useCarriage: boolean = false
): TravelLocation[] => {
  if (useCarriage && hasCarriageService(from)) {
    // Carriages can go to any capital city
    return allLocations.filter(loc => 
      loc.discovered && 
      loc.isCapital && 
      loc.id !== from.id
    );
  }
  
  // Walking can go to any discovered location
  return allLocations.filter(loc => loc.discovered && loc.id !== from.id);
};

/**
 * Check for random encounter during travel
 */
export const checkTravelEncounter = (
  cost: TravelCost,
  playerLevel: number
): string | null => {
  if (cost.dangerRating === 0) return null;
  
  const encounterChance = cost.dangerRating * 0.08; // 8% per danger point
  
  if (Math.random() < encounterChance) {
    const encounters = [
      'You encounter a group of bandits!',
      'A wild animal attacks!',
      'You stumble upon a Forsworn camp!',
      'Wolves emerge from the trees!',
      'A dragon appears overhead!',
      'You find a wounded traveler.',
      'You discover an abandoned campsite.',
      'A merchant offers you their wares.',
    ];
    
    // Higher danger = more dangerous encounters
    const dangerousEncounters = encounters.slice(0, Math.min(encounters.length, cost.dangerRating));
    return dangerousEncounters[Math.floor(Math.random() * dangerousEncounters.length)];
  }
  
  return null;
};

/**
 * Discover a new location
 */
export const discoverLocation = (
  locations: TravelLocation[],
  locationId: string
): TravelLocation[] => {
  return locations.map(loc => 
    loc.id === locationId ? { ...loc, discovered: true } : loc
  );
};

/**
 * Get location by ID
 */
export const getLocationById = (
  locations: TravelLocation[],
  id: string
): TravelLocation | undefined => {
  return locations.find(loc => loc.id === id);
};

/**
 * Get nearest discovered location to coordinates
 */
export const getNearestLocation = (
  locations: TravelLocation[],
  x: number,
  y: number,
  onlyDiscovered: boolean = true
): TravelLocation | undefined => {
  const filtered = onlyDiscovered ? locations.filter(l => l.discovered) : locations;
  
  let nearest: TravelLocation | undefined;
  let minDist = Infinity;
  
  for (const loc of filtered) {
    const dist = Math.sqrt(
      Math.pow(loc.coordinates.x - x, 2) + 
      Math.pow(loc.coordinates.y - y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = loc;
    }
  }
  
  return nearest;
};

/**
 * Format travel time for display
 */
export const formatTravelTime = (hours: number): string => {
  if (hours < 1) return 'less than an hour';
  if (hours === 1) return '1 hour';
  if (hours < 24) return `${hours} hours`;
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours === 0) {
    return days === 1 ? '1 day' : `${days} days`;
  }
  
  return `${days} day${days > 1 ? 's' : ''} and ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
};
