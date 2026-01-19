/**
 * Carriage Travel Service
 * Fast travel between major cities in Skyrim
 */

// ========== TYPES ==========

export type HoldName = 
  | 'Whiterun' | 'Solitude' | 'Windhelm' | 'Riften' | 'Markarth'
  | 'Morthal' | 'Dawnstar' | 'Winterhold' | 'Falkreath';

export interface Location {
  id: string;
  name: string;
  hold: HoldName;
  type: 'city' | 'town' | 'village' | 'settlement';
  description: string;
  services: string[];
  notableNPCs: string[];
  dangers?: string[];
  coordinates: { x: number; y: number }; // Map coordinates
}

export interface CarriageRoute {
  from: string;
  to: string;
  cost: number;
  travelTimeHours: number;
  description: string;
  dangers?: string[];
}

export interface CarriageState {
  lastTravelTime: number;
  totalTrips: number;
  goldSpentOnTravel: number;
  locationsVisited: string[];
  currentLocation: string;
}

// ========== LOCATION DATABASE ==========

export const MAJOR_CITIES: Record<string, Location> = {
  whiterun: {
    id: 'whiterun',
    name: 'Whiterun',
    hold: 'Whiterun',
    type: 'city',
    description: 'The central trading hub of Skyrim, dominated by the ancient fortress of Dragonsreach.',
    services: ['General Store', 'Blacksmith', 'Alchemy Shop', 'Inn', 'Temple', 'Companions', 'Court Wizard'],
    notableNPCs: ['Jarl Balgruuf', 'Lydia', 'Adrianne Avenicci', 'Belethor', 'Arcadia'],
    coordinates: { x: 50, y: 50 },
  },
  solitude: {
    id: 'solitude',
    name: 'Solitude',
    hold: 'Solitude',
    type: 'city',
    description: 'The capital of Skyrim and seat of the High King, perched dramatically on a natural stone arch.',
    services: ['General Store', 'Blacksmith', 'Alchemy Shop', 'Inn', 'Temple', 'Bards College', 'Castle Dour'],
    notableNPCs: ['Jarl Elisif', 'General Tullius', 'Falk Firebeard', 'Sybille Stentor'],
    coordinates: { x: 25, y: 20 },
  },
  windhelm: {
    id: 'windhelm',
    name: 'Windhelm',
    hold: 'Windhelm',
    type: 'city',
    description: 'The ancient capital of Skyrim, home to Ulfric Stormcloak and the Gray Quarter.',
    services: ['General Store', 'Blacksmith', 'Alchemy Shop', 'Inn', 'Temple', 'Palace of the Kings'],
    notableNPCs: ['Ulfric Stormcloak', 'Jorleif', 'Wuunferth the Unliving', 'Niranye'],
    dangers: ['Blood on the Ice killer'],
    coordinates: { x: 75, y: 25 },
  },
  riften: {
    id: 'riften',
    name: 'Riften',
    hold: 'Riften',
    type: 'city',
    description: 'A lakeside city controlled by the Thieves Guild and plagued by corruption.',
    services: ['General Store', 'Blacksmith', 'Alchemy Shop', 'Inn', 'Temple of Mara', 'Thieves Guild', 'Orphanage'],
    notableNPCs: ['Jarl Laila Law-Giver', 'Maven Black-Briar', 'Brynjolf', 'Maramal'],
    dangers: ['Thieves', 'Skooma dealers'],
    coordinates: { x: 80, y: 70 },
  },
  markarth: {
    id: 'markarth',
    name: 'Markarth',
    hold: 'Markarth',
    type: 'city',
    description: 'A city built into the mountains by the ancient Dwemer, now plagued by Forsworn.',
    services: ['General Store', 'Blacksmith', 'Alchemy Shop', 'Inn', 'Temple', 'Understone Keep', 'Treasury House'],
    notableNPCs: ['Jarl Igmund', 'Thongvor Silver-Blood', 'Calcelmo', 'Muiri'],
    dangers: ['Forsworn', 'Cidhna Mine'],
    coordinates: { x: 15, y: 60 },
  },
  morthal: {
    id: 'morthal',
    name: 'Morthal',
    hold: 'Morthal',
    type: 'town',
    description: 'A foggy, swampy town where the supernatural feels close at hand.',
    services: ['General Store', 'Alchemy Shop', 'Inn'],
    notableNPCs: ['Jarl Idgrod Ravencrone', 'Falion', 'Jorgen'],
    dangers: ['Vampires', 'Swamp creatures'],
    coordinates: { x: 30, y: 35 },
  },
  dawnstar: {
    id: 'dawnstar',
    name: 'Dawnstar',
    hold: 'Dawnstar',
    type: 'town',
    description: 'A mining town on the northern coast, plagued by nightmares.',
    services: ['General Store', 'Blacksmith', 'Inn', 'Dark Brotherhood Sanctuary'],
    notableNPCs: ['Jarl Skald', 'Madena', 'Erandur'],
    dangers: ['Nightmares', 'Giants nearby'],
    coordinates: { x: 50, y: 15 },
  },
  winterhold: {
    id: 'winterhold',
    name: 'Winterhold',
    hold: 'Winterhold',
    type: 'town',
    description: 'A ruined town overshadowed by the College of Winterhold, seat of magical learning.',
    services: ['Inn', 'College of Winterhold', 'Alchemy Shop'],
    notableNPCs: ['Jarl Korir', 'Arch-Mage Savos Aren', 'Faralda', 'Tolfdir'],
    dangers: ['Magical anomalies', 'Harsh cold'],
    coordinates: { x: 80, y: 10 },
  },
  falkreath: {
    id: 'falkreath',
    name: 'Falkreath',
    hold: 'Falkreath',
    type: 'town',
    description: 'A quiet town known for its large cemetery and connection to Hircine.',
    services: ['General Store', 'Blacksmith', 'Inn', 'Temple'],
    notableNPCs: ['Jarl Siddgeir', 'Dengeir', 'Lod', 'Mathies'],
    dangers: ['Werewolves', 'Bandits'],
    coordinates: { x: 35, y: 75 },
  },
};

// Secondary locations
export const SECONDARY_LOCATIONS: Record<string, Location> = {
  riverwood: {
    id: 'riverwood',
    name: 'Riverwood',
    hold: 'Whiterun',
    type: 'village',
    description: 'A peaceful village on the road between Whiterun and Helgen.',
    services: ['General Store', 'Blacksmith', 'Inn'],
    notableNPCs: ['Alvor', 'Gerdur', 'Delphine', 'Faendal', 'Sven'],
    coordinates: { x: 45, y: 60 },
  },
  ivarstead: {
    id: 'ivarstead',
    name: 'Ivarstead',
    hold: 'Riften',
    type: 'village',
    description: 'A small village at the base of the 7,000 Steps to High Hrothgar.',
    services: ['Inn'],
    notableNPCs: ['Klimmek', 'Temba Wide-Arm'],
    coordinates: { x: 60, y: 55 },
  },
  rorikstead: {
    id: 'rorikstead',
    name: 'Rorikstead',
    hold: 'Whiterun',
    type: 'village',
    description: 'A farming community known for unusually fertile lands.',
    services: ['Inn'],
    notableNPCs: ['Rorik', 'Jouane Manette', 'Sissel'],
    coordinates: { x: 30, y: 50 },
  },
  dragon_bridge: {
    id: 'dragon_bridge',
    name: 'Dragon Bridge',
    hold: 'Solitude',
    type: 'village',
    description: 'A village named for its ancient bridge decorated with dragon heads.',
    services: ['Inn'],
    notableNPCs: ['Horgeir', 'Olda'],
    coordinates: { x: 20, y: 30 },
  },
  karthwasten: {
    id: 'karthwasten',
    name: 'Karthwasten',
    hold: 'Markarth',
    type: 'settlement',
    description: 'A small mining settlement in the Reach.',
    services: [],
    notableNPCs: ['Ainethach'],
    dangers: ['Forsworn', 'Silver-Blood mercenaries'],
    coordinates: { x: 10, y: 50 },
  },
  shor_stone: {
    id: 'shor_stone',
    name: "Shor's Stone",
    hold: 'Riften',
    type: 'settlement',
    description: 'A mining village in the Rift.',
    services: [],
    notableNPCs: ['Filnjar', 'Sylgja'],
    dangers: ['Frostbite Spiders in the mine'],
    coordinates: { x: 70, y: 55 },
  },
};

// ========== CARRIAGE ROUTES ==========

function calculateDistance(from: Location, to: Location): number {
  const dx = to.coordinates.x - from.coordinates.x;
  const dy = to.coordinates.y - from.coordinates.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function generateRoute(fromId: string, toId: string): CarriageRoute {
  const from = MAJOR_CITIES[fromId] || SECONDARY_LOCATIONS[fromId];
  const to = MAJOR_CITIES[toId] || SECONDARY_LOCATIONS[toId];
  
  if (!from || !to) {
    throw new Error(`Invalid route: ${fromId} to ${toId}`);
  }
  
  const distance = calculateDistance(from, to);
  const baseCost = Math.round(distance * 0.5 + 20); // Base cost formula
  const travelTime = Math.round(distance * 0.15 + 1); // Hours of travel
  
  const dangers: string[] = [];
  if (from.dangers) dangers.push(...from.dangers.map(d => `${from.name}: ${d}`));
  if (to.dangers) dangers.push(...to.dangers.map(d => `${to.name}: ${d}`));
  
  // Add road dangers based on regions
  if (from.hold === 'Markarth' || to.hold === 'Markarth') {
    dangers.push('Forsworn attacks on the roads');
  }
  if (from.hold === 'Riften' || to.hold === 'Riften') {
    dangers.push('Bandits frequent these roads');
  }
  if (from.hold === 'Winterhold' || to.hold === 'Winterhold') {
    dangers.push('Dangerous cold and ice wraiths');
  }
  
  return {
    from: fromId,
    to: toId,
    cost: baseCost,
    travelTimeHours: travelTime,
    description: `Travel from ${from.name} to ${to.name} via carriage.`,
    dangers: dangers.length > 0 ? dangers : undefined,
  };
}

// Pre-generate all major routes
export function getAllCarriageRoutes(): CarriageRoute[] {
  const routes: CarriageRoute[] = [];
  const cityIds = Object.keys(MAJOR_CITIES);
  
  for (let i = 0; i < cityIds.length; i++) {
    for (let j = i + 1; j < cityIds.length; j++) {
      routes.push(generateRoute(cityIds[i], cityIds[j]));
    }
  }
  
  return routes;
}

// ========== CARRIAGE PRICES ==========

export const CARRIAGE_PRICES: Record<string, Record<string, number>> = {
  whiterun: {
    solitude: 50, windhelm: 50, riften: 50, markarth: 50,
    morthal: 30, dawnstar: 50, winterhold: 50, falkreath: 30,
  },
  solitude: {
    whiterun: 50, windhelm: 50, riften: 50, markarth: 50,
    morthal: 30, dawnstar: 50, winterhold: 50, falkreath: 50,
  },
  windhelm: {
    whiterun: 50, solitude: 50, riften: 50, markarth: 50,
    morthal: 50, dawnstar: 30, winterhold: 30, falkreath: 50,
  },
  riften: {
    whiterun: 50, solitude: 50, windhelm: 50, markarth: 50,
    morthal: 50, dawnstar: 50, winterhold: 50, falkreath: 30,
  },
  markarth: {
    whiterun: 50, solitude: 50, windhelm: 50, riften: 50,
    morthal: 50, dawnstar: 50, winterhold: 50, falkreath: 30,
  },
  morthal: {
    whiterun: 30, solitude: 30, windhelm: 50, riften: 50, markarth: 50,
    dawnstar: 30, winterhold: 50, falkreath: 50,
  },
  dawnstar: {
    whiterun: 50, solitude: 50, windhelm: 30, riften: 50, markarth: 50,
    morthal: 30, winterhold: 30, falkreath: 50,
  },
  winterhold: {
    whiterun: 50, solitude: 50, windhelm: 30, riften: 50, markarth: 50,
    morthal: 50, dawnstar: 30, falkreath: 50,
  },
  falkreath: {
    whiterun: 30, solitude: 50, windhelm: 50, riften: 30, markarth: 30,
    morthal: 50, dawnstar: 50, winterhold: 50,
  },
};

// ========== STATE MANAGEMENT ==========

export function getInitialCarriageState(startLocation?: string): CarriageState {
  return {
    lastTravelTime: 0,
    totalTrips: 0,
    goldSpentOnTravel: 0,
    locationsVisited: startLocation ? [startLocation] : ['whiterun'],
    currentLocation: startLocation || 'whiterun',
  };
}

export function getAvailableDestinations(currentLocation: string): Array<{ destination: string; cost: number; travelTime: number }> {
  const locationKey = currentLocation.toLowerCase().replace(/[^a-z]/g, '_');
  const prices = CARRIAGE_PRICES[locationKey];
  
  if (!prices) {
    return [];
  }
  
  return Object.entries(prices).map(([destination, cost]) => ({
    destination,
    cost,
    travelTime: calculateTravelTime(locationKey, destination),
  }));
}

function calculateTravelTime(from: string, to: string): number {
  const fromLoc = MAJOR_CITIES[from];
  const toLoc = MAJOR_CITIES[to];
  
  if (!fromLoc || !toLoc) return 4; // Default 4 hours
  
  const distance = calculateDistance(fromLoc, toLoc);
  return Math.max(2, Math.round(distance * 0.12)); // Minimum 2 hours
}

export function travelByCarriage(
  state: CarriageState,
  destination: string,
  playerGold: number
): { success: boolean; newState: CarriageState; goldSpent: number; travelTime: number; message: string } {
  const currentKey = state.currentLocation.toLowerCase().replace(/[^a-z]/g, '_');
  const destKey = destination.toLowerCase().replace(/[^a-z]/g, '_');
  
  // Check if valid destination
  const prices = CARRIAGE_PRICES[currentKey];
  if (!prices || !prices[destKey]) {
    return {
      success: false,
      newState: state,
      goldSpent: 0,
      travelTime: 0,
      message: `No carriage service available to ${destination} from here.`,
    };
  }
  
  const cost = prices[destKey];
  
  // Check gold
  if (playerGold < cost) {
    return {
      success: false,
      newState: state,
      goldSpent: 0,
      travelTime: 0,
      message: `You need ${cost} gold to travel to ${getLocationName(destKey)}.`,
    };
  }
  
  const travelTime = calculateTravelTime(currentKey, destKey);
  const destLocation = MAJOR_CITIES[destKey];
  
  // Update state
  const newVisited = state.locationsVisited.includes(destKey)
    ? state.locationsVisited
    : [...state.locationsVisited, destKey];
  
  return {
    success: true,
    newState: {
      ...state,
      currentLocation: destKey,
      lastTravelTime: Date.now(),
      totalTrips: state.totalTrips + 1,
      goldSpentOnTravel: state.goldSpentOnTravel + cost,
      locationsVisited: newVisited,
    },
    goldSpent: cost,
    travelTime,
    message: `You board the carriage to ${destLocation.name}. The journey takes ${travelTime} hours. ${destLocation.description}`,
  };
}

export function getLocationName(locationId: string): string {
  return MAJOR_CITIES[locationId]?.name || 
         SECONDARY_LOCATIONS[locationId]?.name || 
         locationId.charAt(0).toUpperCase() + locationId.slice(1).replace(/_/g, ' ');
}

export function getLocationInfo(locationId: string): Location | null {
  return MAJOR_CITIES[locationId] || SECONDARY_LOCATIONS[locationId] || null;
}

export function getCarriageDriverDialogue(): string {
  const dialogues = [
    "Where do you want to go?",
    "Need a ride? I can take you to any of the hold capitals.",
    "Long road ahead. Hope you've got the gold.",
    "The roads have been dangerous lately. Bandits and worse.",
    "Step into the back. We'll be off shortly.",
    "Aye, I know the roads better than most. Where to?",
    "Don't worry about your safety. Nothing bothers my horse.",
    "The cold doesn't bother me. Grew up in Windhelm.",
    "Watch out for wolves on the road. Saw a pack near Whiterun yesterday.",
  ];
  return dialogues[Math.floor(Math.random() * dialogues.length)];
}

export function getTravelNarration(from: string, to: string): string {
  const fromLoc = MAJOR_CITIES[from] || SECONDARY_LOCATIONS[from];
  const toLoc = MAJOR_CITIES[to] || SECONDARY_LOCATIONS[to];
  
  if (!fromLoc || !toLoc) {
    return 'The journey passes uneventfully.';
  }
  
  const narrations = [
    `The carriage rumbles along the road from ${fromLoc.name} to ${toLoc.name}. You watch the countryside pass by.`,
    `As you travel toward ${toLoc.name}, the landscape gradually shifts. The driver hums an old Nord tune.`,
    `The journey from ${fromLoc.name} is long but peaceful. You doze as the wheels creak beneath you.`,
    `Mountains loom in the distance as you approach ${toLoc.name}. ${toLoc.description}`,
    `After hours on the road, the walls of ${toLoc.name} finally come into view.`,
    `The driver points ahead. "${toLoc.name} just over that ridge. Best city in Skyrim, if you ask me."`,
  ];
  
  return narrations[Math.floor(Math.random() * narrations.length)];
}

export function getHoldDescription(hold: HoldName): string {
  const descriptions: Record<HoldName, string> = {
    Whiterun: 'The heart of Skyrim, a prosperous trading hub surrounded by fertile plains.',
    Solitude: 'The seat of Imperial power in Skyrim, perched on dramatic coastal cliffs.',
    Windhelm: 'Ancient city of the Nords, stronghold of the Stormcloak rebellion.',
    Riften: 'A city of intrigue and corruption on the shores of Lake Honrich.',
    Markarth: 'City of stone, carved by the Dwemer from the mountains of the Reach.',
    Morthal: 'A fog-shrouded settlement in the treacherous Hjaal Marsh.',
    Dawnstar: 'A hardy port town on the frozen Sea of Ghosts.',
    Winterhold: 'Once-great city, now a shadow of its former glory after the Great Collapse.',
    Falkreath: 'A quiet hold known for its vast cemetery and dense pine forests.',
  };
  
  return descriptions[hold] || 'A hold of Skyrim.';
}

// ========== SHIP TRAVEL (Bonus) ==========

export interface ShipRoute {
  from: string;
  to: string;
  cost: number;
  travelTimeHours: number;
}

export const SHIP_ROUTES: ShipRoute[] = [
  { from: 'solitude', to: 'windhelm', cost: 100, travelTimeHours: 12 },
  { from: 'windhelm', to: 'solitude', cost: 100, travelTimeHours: 12 },
  { from: 'solitude', to: 'dawnstar', cost: 50, travelTimeHours: 6 },
  { from: 'dawnstar', to: 'solitude', cost: 50, travelTimeHours: 6 },
  { from: 'windhelm', to: 'solstheim', cost: 250, travelTimeHours: 24 },
  { from: 'solstheim', to: 'windhelm', cost: 250, travelTimeHours: 24 },
];

export function getAvailableShipRoutes(currentLocation: string): ShipRoute[] {
  return SHIP_ROUTES.filter(r => r.from === currentLocation.toLowerCase());
}
