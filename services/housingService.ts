/**
 * Housing & Marriage Service
 * 
 * Implements the Skyrim housing system (Hearthfire) and marriage mechanics.
 * Players can purchase homes, build manors, adopt children, and marry NPCs.
 */

// Type exports for modal compatibility
export type RoomType = 'bedroom' | 'kitchen' | 'alchemy' | 'enchanting' | 'armory' | 'trophy' | 'library' | 'storage' | 'greenhouse';
export type HouseId = string;
export type SpouseId = string;

// Types
export interface House {
  id: string;
  name: string;
  location: string;
  hold: string;
  type: 'city' | 'manor' | 'unique';
  baseCost: number;
  upgradeCost: number;
  stewardCapable: boolean;
  description: string;
  features: string[];
  rooms: HouseRoom[];
  availableRooms: RoomType[];
  maxChildren: number;
  requiresQuestline?: string;
  requiresThaneStatus?: boolean;
}

export interface HouseRoom {
  id: string;
  name: string;
  type: RoomType;
  upgradeCost: number;
  description: string;
  benefits: string[];
}

export interface Spouse {
  id: string;
  name: string;
  race: string;
  gender: 'male' | 'female';
  location: string;
  profession: string;
  description?: string;
  income?: number;
  requirements?: string[];
  homeCooked: boolean; // Can cook meals
  merchant: boolean; // Can act as merchant
  follower: boolean; // Can be a follower
  dialogue: {
    proposal: string;
    acceptance: string;
    daily: string[];
  };
}

// House ownership data for a specific house
export interface HouseData {
  owned: boolean;
  purchasedAt?: string;
  upgrades: RoomType[];
  furnishings: string[];
  storedItems: Array<{ name: string; quantity: number }>;
  displayedTrophies: string[];
  gardenPlants?: string[];
}

// Child data
export interface ChildData {
  name: string;
  gender: 'boy' | 'girl';
  adoptedAt?: string;
  homeId: string;
  favoriteGift?: string;
  pet?: string;
}

// Main housing state - compatible with HousingModal
export interface HousingState {
  houses: Record<HouseId, HouseData>;
  activeHome: HouseId | null;
  spouse: SpouseId | null;
  spouseHome: HouseId | null;
  children: ChildData[];
  housecarls: Record<HouseId, string>;
}

// Legacy types for backwards compatibility
export interface OwnedHouse {
  id: string;
  purchasedAt: string;
  upgradedRooms: string[];
  furnishings: string[];
  storedItems: Array<{ name: string; quantity: number }>;
  displayedTrophies: string[];
  gardenPlants?: string[];
}

export interface AdoptedChild {
  id: string;
  name: string;
  gender: 'boy' | 'girl';
  adoptedAt: string;
  homeId: string;
  favoriteGift?: string;
  pet?: string;
}

// Available Houses in Skyrim
export const HOUSES: Record<string, House> = {
  // City Houses
  'breezehome': {
    id: 'breezehome',
    name: 'Breezehome',
    location: 'Whiterun',
    hold: 'Whiterun Hold',
    type: 'city',
    baseCost: 5000,
    upgradeCost: 1800,
    stewardCapable: false,
    description: 'A modest home near the main gate of Whiterun.',
    features: ['Central location', 'Near shops', 'Lydia as housecarl'],
    maxChildren: 2,
    requiresThaneStatus: true,
    rooms: [
      { id: 'living', name: 'Living Area', type: 'storage', upgradeCost: 0, description: 'Main living space', benefits: ['Basic storage'] },
      { id: 'bedroom', name: 'Bedroom', type: 'bedroom', upgradeCost: 300, description: 'A place to rest', benefits: ['Rested bonus'] },
      { id: 'alchemy', name: 'Alchemy Lab', type: 'alchemy', upgradeCost: 500, description: 'For brewing potions', benefits: ['Alchemy crafting'] },
      { id: 'children', name: "Children's Bedroom", type: 'bedroom', upgradeCost: 250, description: 'Room for adopted children', benefits: ['Adopt up to 2 children'] }
    ]
  },
  'honeyside': {
    id: 'honeyside',
    name: 'Honeyside',
    location: 'Riften',
    hold: 'The Rift',
    type: 'city',
    baseCost: 8000,
    upgradeCost: 4200,
    stewardCapable: false,
    description: 'A charming home on the canal in Riften.',
    features: ['Private dock', 'Back entrance', 'Iona as housecarl'],
    maxChildren: 2,
    requiresThaneStatus: true,
    rooms: [
      { id: 'living', name: 'Living Area', type: 'storage', upgradeCost: 0, description: 'Main living space', benefits: ['Basic storage'] },
      { id: 'bedroom', name: 'Bedroom', type: 'bedroom', upgradeCost: 400, description: 'A cozy bedroom', benefits: ['Rested bonus'] },
      { id: 'alchemy', name: 'Alchemy Lab', type: 'alchemy', upgradeCost: 600, description: 'For brewing potions', benefits: ['Alchemy crafting'] },
      { id: 'enchanting', name: 'Enchanting Nook', type: 'enchanting', upgradeCost: 800, description: 'For enchanting items', benefits: ['Enchanting crafting'] },
      { id: 'garden', name: 'Garden', type: 'greenhouse', upgradeCost: 400, description: 'Grow alchemy ingredients', benefits: ['Ingredient harvesting'] }
    ]
  },
  'vlindrel_hall': {
    id: 'vlindrel_hall',
    name: 'Vlindrel Hall',
    location: 'Markarth',
    hold: 'The Reach',
    type: 'city',
    baseCost: 8000,
    upgradeCost: 4200,
    stewardCapable: false,
    description: 'A stone dwelling carved into the mountains.',
    features: ['Dwemer architecture', 'Secure location', 'Argis the Bulwark as housecarl'],
    maxChildren: 2,
    requiresThaneStatus: true,
    rooms: [
      { id: 'living', name: 'Living Area', type: 'storage', upgradeCost: 0, description: 'Main living space', benefits: ['Basic storage'] },
      { id: 'bedroom', name: 'Bedroom', type: 'bedroom', upgradeCost: 400, description: 'A stone bedroom', benefits: ['Rested bonus'] },
      { id: 'alchemy', name: 'Alchemy Lab', type: 'alchemy', upgradeCost: 600, description: 'For brewing potions', benefits: ['Alchemy crafting'] },
      { id: 'enchanting', name: 'Enchanting Room', type: 'enchanting', upgradeCost: 800, description: 'For enchanting items', benefits: ['Enchanting crafting'] }
    ]
  },
  'hjerim': {
    id: 'hjerim',
    name: 'Hjerim',
    location: 'Windhelm',
    hold: 'Eastmarch',
    type: 'city',
    baseCost: 12000,
    upgradeCost: 9000,
    stewardCapable: false,
    description: 'A large Nordic home in the Gray Quarter.',
    features: ['Spacious', 'Armory option', 'Calder as housecarl'],
    maxChildren: 2,
    requiresThaneStatus: true,
    requiresQuestline: 'Blood on the Ice',
    rooms: [
      { id: 'living', name: 'Living Area', type: 'storage', upgradeCost: 0, description: 'Main living space', benefits: ['Basic storage'] },
      { id: 'bedroom', name: 'Master Bedroom', type: 'bedroom', upgradeCost: 500, description: 'A large bedroom', benefits: ['Rested bonus'] },
      { id: 'armory', name: 'Armory', type: 'armory', upgradeCost: 2000, description: 'Display and store weapons', benefits: ['Weapon displays', 'Mannequins'] },
      { id: 'alchemy', name: 'Alchemy Lab', type: 'alchemy', upgradeCost: 700, description: 'For brewing potions', benefits: ['Alchemy crafting'] },
      { id: 'enchanting', name: 'Enchanting Room', type: 'enchanting', upgradeCost: 1000, description: 'For enchanting items', benefits: ['Enchanting crafting'] }
    ]
  },
  'proudspire_manor': {
    id: 'proudspire_manor',
    name: 'Proudspire Manor',
    location: 'Solitude',
    hold: 'Haafingar',
    type: 'city',
    baseCost: 25000,
    upgradeCost: 11000,
    stewardCapable: false,
    description: 'The most prestigious home in Skyrim.',
    features: ['Three floors', 'Near Blue Palace', 'Jordis the Sword-Maiden as housecarl'],
    maxChildren: 2,
    requiresThaneStatus: true,
    rooms: [
      { id: 'living', name: 'Living Area', type: 'storage', upgradeCost: 0, description: 'Grand living space', benefits: ['Basic storage'] },
      { id: 'bedroom', name: 'Master Bedroom', type: 'bedroom', upgradeCost: 800, description: 'A luxurious bedroom', benefits: ['Rested bonus', 'Well Rested bonus'] },
      { id: 'kitchen', name: 'Kitchen', type: 'kitchen', upgradeCost: 1200, description: 'Full cooking station', benefits: ['Cooking'] },
      { id: 'alchemy', name: 'Alchemy Lab', type: 'alchemy', upgradeCost: 1000, description: 'For brewing potions', benefits: ['Alchemy crafting'] },
      { id: 'enchanting', name: 'Enchanting Tower', type: 'enchanting', upgradeCost: 1500, description: 'For enchanting items', benefits: ['Enchanting crafting'] },
      { id: 'patio', name: 'Patio', type: 'storage', upgradeCost: 500, description: 'Outdoor relaxation', benefits: ['Additional storage'] }
    ]
  },
  // Hearthfire Manors
  'lakeview_manor': {
    id: 'lakeview_manor',
    name: 'Lakeview Manor',
    location: 'Falkreath Hold',
    hold: 'Falkreath',
    type: 'manor',
    baseCost: 5000,
    upgradeCost: 15000,
    stewardCapable: true,
    description: 'Build your own manor overlooking Lake Ilinalta.',
    features: ['Buildable', 'Lake view', 'Rayya as housecarl', 'Large grounds'],
    maxChildren: 2,
    requiresThaneStatus: true,
    rooms: [
      { id: 'small_house', name: 'Small House', type: 'storage', upgradeCost: 0, description: 'Starting structure', benefits: ['Basic living'] },
      { id: 'main_hall', name: 'Main Hall', type: 'storage', upgradeCost: 1000, description: 'Central gathering space', benefits: ['Expanded storage'] },
      { id: 'east_wing', name: 'East Wing (Library)', type: 'library', upgradeCost: 2000, description: 'A scholar\'s retreat', benefits: ['Book storage', 'Reading bonus'] },
      { id: 'north_wing', name: 'North Wing (Trophy Room)', type: 'trophy', upgradeCost: 2000, description: 'Display your conquests', benefits: ['Trophy mounts', 'Display cases'] },
      { id: 'west_wing', name: 'West Wing (Bedroom)', type: 'bedroom', upgradeCost: 2000, description: 'Master bedroom suite', benefits: ['Rested bonus', 'Storage'] },
      { id: 'cellar', name: 'Cellar', type: 'storage', upgradeCost: 500, description: 'Underground storage', benefits: ['Safe storage', 'Shrines'] },
      { id: 'greenhouse', name: 'Greenhouse', type: 'greenhouse', upgradeCost: 1500, description: 'Grow rare plants', benefits: ['Ingredient farming'] },
      { id: 'armory_tower', name: 'Armory Tower', type: 'armory', upgradeCost: 2500, description: 'Weapon and armor storage', benefits: ['Weapon racks', 'Mannequins', 'Forge'] }
    ]
  },
  'windstad_manor': {
    id: 'windstad_manor',
    name: 'Windstad Manor',
    location: 'Hjaalmarch',
    hold: 'Hjaalmarch',
    type: 'manor',
    baseCost: 5000,
    upgradeCost: 15000,
    stewardCapable: true,
    description: 'Build your own manor in the salt marshes.',
    features: ['Buildable', 'Fish hatchery', 'Valdimar as housecarl', 'Secluded'],
    maxChildren: 2,
    requiresThaneStatus: true,
    rooms: [
      { id: 'small_house', name: 'Small House', type: 'storage', upgradeCost: 0, description: 'Starting structure', benefits: ['Basic living'] },
      { id: 'main_hall', name: 'Main Hall', type: 'storage', upgradeCost: 1000, description: 'Central gathering space', benefits: ['Expanded storage'] },
      { id: 'east_wing', name: 'East Wing (Enchanting Tower)', type: 'enchanting', upgradeCost: 2000, description: 'Magical workstation', benefits: ['Enchanting', 'Staff enchanter'] },
      { id: 'north_wing', name: 'North Wing (Kitchen)', type: 'kitchen', upgradeCost: 2000, description: 'Full kitchen', benefits: ['Cooking', 'Oven'] },
      { id: 'west_wing', name: 'West Wing (Bedroom)', type: 'bedroom', upgradeCost: 2000, description: 'Master bedroom suite', benefits: ['Rested bonus', 'Storage'] },
      { id: 'fish_hatchery', name: 'Fish Hatchery', type: 'storage', upgradeCost: 1000, description: 'Raise fish', benefits: ['Fish farming', 'Alchemy ingredients'] }
    ]
  },
  'heljarchen_hall': {
    id: 'heljarchen_hall',
    name: 'Heljarchen Hall',
    location: 'The Pale',
    hold: 'The Pale',
    type: 'manor',
    baseCost: 5000,
    upgradeCost: 15000,
    stewardCapable: true,
    description: 'Build your own manor in the snowy tundra.',
    features: ['Buildable', 'Grain mill', 'Gregor as housecarl', 'Mountain views'],
    maxChildren: 2,
    requiresThaneStatus: true,
    rooms: [
      { id: 'small_house', name: 'Small House', type: 'storage', upgradeCost: 0, description: 'Starting structure', benefits: ['Basic living'] },
      { id: 'main_hall', name: 'Main Hall', type: 'storage', upgradeCost: 1000, description: 'Central gathering space', benefits: ['Expanded storage'] },
      { id: 'east_wing', name: 'East Wing (Alchemy Tower)', type: 'alchemy', upgradeCost: 2000, description: 'Alchemical laboratory', benefits: ['Alchemy', 'Garden planter'] },
      { id: 'north_wing', name: 'North Wing (Storage)', type: 'storage', upgradeCost: 2000, description: 'Additional storage', benefits: ['Extra chests', 'Mannequins'] },
      { id: 'west_wing', name: 'West Wing (Bedroom)', type: 'bedroom', upgradeCost: 2000, description: 'Master bedroom suite', benefits: ['Rested bonus', 'Storage'] },
      { id: 'grain_mill', name: 'Grain Mill', type: 'storage', upgradeCost: 500, description: 'Mill grain into flour', benefits: ['Flour production'] }
    ]
  }
};

// Marriageable NPCs
export const SPOUSES: Record<string, Spouse> = {
  'lydia': {
    id: 'lydia',
    name: 'Lydia',
    race: 'Nord',
    gender: 'female',
    location: 'Whiterun (Dragonsreach/Breezehome)',
    profession: 'Housecarl',
    requirements: ['Become Thane of Whiterun'],
    homeCooked: true,
    merchant: true,
    follower: true,
    dialogue: {
      proposal: 'I... I would be honored, my Thane.',
      acceptance: 'We will be married in the Temple of Mara.',
      daily: ['I\'m sworn to carry your burdens...', 'What do you need, my love?', 'It\'s a fine day with you around.']
    }
  },
  'aela': {
    id: 'aela',
    name: 'Aela the Huntress',
    race: 'Nord',
    gender: 'female',
    location: 'Jorrvaskr, Whiterun',
    profession: 'Companion/Huntress',
    requirements: ['Complete Companions questline'],
    homeCooked: true,
    merchant: true,
    follower: true,
    dialogue: {
      proposal: 'A huntress always knows when she\'s found good prey. Yes.',
      acceptance: 'The hunt brought us together. Now we walk as one.',
      daily: ['The hunt never ends.', 'What shall we hunt today, love?', 'My bow is yours.']
    }
  },
  'mjoll': {
    id: 'mjoll',
    name: 'Mjoll the Lioness',
    race: 'Nord',
    gender: 'female',
    location: 'Riften',
    profession: 'Adventurer',
    requirements: ['Retrieve Grimsever from Mzinchaleft'],
    homeCooked: true,
    merchant: true,
    follower: true,
    dialogue: {
      proposal: 'You\'ve proven yourself worthy. I accept.',
      acceptance: 'Together, we will make Skyrim safer.',
      daily: ['Ready for adventure?', 'Riften won\'t clean itself up.', 'I\'ll protect you with my life.']
    }
  },
  'ysolda': {
    id: 'ysolda',
    name: 'Ysolda',
    race: 'Nord',
    gender: 'female',
    location: 'Whiterun Market',
    profession: 'Merchant',
    requirements: ['Give her a Mammoth Tusk'],
    homeCooked: true,
    merchant: true,
    follower: false,
    dialogue: {
      proposal: 'Oh! I\'d love to! Yes!',
      acceptance: 'I can\'t wait to start our life together.',
      daily: ['Business has been good lately.', 'I bought something for you...', 'My merchant connections might help us.']
    }
  },
  'camilla': {
    id: 'camilla',
    name: 'Camilla Valerius',
    race: 'Imperial',
    gender: 'female',
    location: 'Riverwood Trader',
    profession: 'Shopkeeper',
    requirements: ['Retrieve the Golden Claw'],
    homeCooked: true,
    merchant: true,
    follower: false,
    dialogue: {
      proposal: 'You\'ve shown me such kindness. Of course I will!',
      acceptance: 'I never thought I\'d leave Riverwood. This is exciting!',
      daily: ['How\'s my brave adventurer?', 'I hope the roads were safe.', 'Lucan will miss me at the shop.']
    }
  },
  'farkas': {
    id: 'farkas',
    name: 'Farkas',
    race: 'Nord',
    gender: 'male',
    location: 'Jorrvaskr, Whiterun',
    profession: 'Companion/Warrior',
    requirements: ['Complete Companions questline'],
    homeCooked: false,
    merchant: true,
    follower: true,
    dialogue: {
      proposal: 'I\'m not good with words. But... yes.',
      acceptance: 'I\'ll protect you. Always.',
      daily: ['Ready to fight?', 'Brother says hi.', 'I love you. Simple as that.']
    }
  },
  'vilkas': {
    id: 'vilkas',
    name: 'Vilkas',
    race: 'Nord',
    gender: 'male',
    location: 'Jorrvaskr, Whiterun',
    profession: 'Companion/Warrior',
    requirements: ['Complete Companions questline'],
    homeCooked: false,
    merchant: true,
    follower: true,
    dialogue: {
      proposal: 'The heart wants what it wants. Yes.',
      acceptance: 'Honor and love. Both are ours now.',
      daily: ['Training went well today.', 'Farkas is jealous.', 'What battles await us?']
    }
  },
  'vorstag': {
    id: 'vorstag',
    name: 'Vorstag',
    race: 'Nord',
    gender: 'male',
    location: 'Silver-Blood Inn, Markarth',
    profession: 'Mercenary',
    requirements: ['Hire him once (500 gold)'],
    homeCooked: false,
    merchant: true,
    follower: true,
    dialogue: {
      proposal: 'You want to marry ME? I... yes!',
      acceptance: 'Best decision I ever made was meeting you.',
      daily: ['Need any help?', 'The inn was lonely. This is better.', 'I\'ll keep you safe.']
    }
  },
  'marcurio': {
    id: 'marcurio',
    name: 'Marcurio',
    race: 'Imperial',
    gender: 'male',
    location: 'Bee and Barb, Riften',
    profession: 'Mage/Mercenary',
    requirements: ['Hire him once (500 gold)'],
    homeCooked: false,
    merchant: true,
    follower: true,
    dialogue: {
      proposal: 'My brilliance recognized at last! Yes, of course.',
      acceptance: 'Together, we shall be unstoppable.',
      daily: ['I\'ve been reading about...', 'Magic awaits!', 'You\'re almost as clever as me.']
    }
  }
};

// Initialize housing state
// Helper to get available room types for a house
export const getAvailableRoomsForHouse = (houseId: string): RoomType[] => {
  const house = HOUSES[houseId];
  if (!house) return [];
  // Extract unique room types from the house's rooms
  const roomTypes = house.rooms
    .map(r => r.type)
    .filter((type): type is RoomType => 
      ['bedroom', 'kitchen', 'alchemy', 'enchanting', 'armory', 'trophy', 'library', 'storage', 'greenhouse'].includes(type)
    );
  return [...new Set(roomTypes)];
};

// Initialize housing state with the correct structure for HousingModal
export const initializeHousingState = (): HousingState => {
  // Create houses record with all houses marked as not owned
  const houses: Record<HouseId, HouseData> = {};
  Object.keys(HOUSES).forEach(houseId => {
    houses[houseId] = {
      owned: false,
      upgrades: [],
      furnishings: [],
      storedItems: [],
      displayedTrophies: [],
    };
  });

  return {
    houses,
    activeHome: null,
    spouse: null,
    spouseHome: null,
    children: [],
    housecarls: {}
  };
};

// Backwards-compatible alias
export const getInitialHousingState = initializeHousingState;

// Get housing state from character (handles both old and new formats)
export const getHousingState = (characterData: unknown): HousingState => {
  if (!characterData || typeof characterData !== 'object') {
    return initializeHousingState();
  }
  const data = characterData as any;
  
  // If new format with 'houses' record
  if (data.houses && typeof data.houses === 'object') {
    // Ensure all houses exist in the record
    const houses: Record<HouseId, HouseData> = {};
    Object.keys(HOUSES).forEach(houseId => {
      houses[houseId] = data.houses[houseId] || {
        owned: false,
        upgrades: [],
        furnishings: [],
        storedItems: [],
        displayedTrophies: [],
      };
    });
    
    return {
      houses,
      activeHome: data.activeHome ?? null,
      spouse: data.spouse ?? null,
      spouseHome: data.spouseHome ?? null,
      children: data.children ?? [],
      housecarls: data.housecarls ?? {}
    };
  }
  
  // Handle legacy format with 'ownedHouses' array
  if (Array.isArray(data.ownedHouses)) {
    const houses: Record<HouseId, HouseData> = {};
    Object.keys(HOUSES).forEach(houseId => {
      const ownedHouse = data.ownedHouses.find((h: any) => h.id === houseId);
      houses[houseId] = ownedHouse ? {
        owned: true,
        purchasedAt: ownedHouse.purchasedAt,
        upgrades: (ownedHouse.upgradedRooms || []) as RoomType[],
        furnishings: ownedHouse.furnishings || [],
        storedItems: ownedHouse.storedItems || [],
        displayedTrophies: ownedHouse.displayedTrophies || [],
        gardenPlants: ownedHouse.gardenPlants,
      } : {
        owned: false,
        upgrades: [],
        furnishings: [],
        storedItems: [],
        displayedTrophies: [],
      };
    });
    
    return {
      houses,
      activeHome: data.currentHome ?? null,
      spouse: data.spouse?.id ?? null,
      spouseHome: data.spouse?.homeId ?? null,
      children: (data.children || []).map((c: any) => ({
        name: c.name,
        gender: c.gender,
        adoptedAt: c.adoptedAt,
        homeId: c.homeId,
        favoriteGift: c.favoriteGift,
        pet: c.pet
      })),
      housecarls: data.housecarls ?? {}
    };
  }
  
  return initializeHousingState();
};

// Purchase a house
export const purchaseHouse = (
  state: HousingState,
  houseId: string,
  playerGold: number,
  isThane: boolean = true
): { success: boolean; message: string; newState: HousingState; goldSpent: number } => {
  const house = HOUSES[houseId];
  if (!house) {
    return { success: false, message: 'Invalid house.', newState: state, goldSpent: 0 };
  }

  const houseData = state.houses[houseId];
  if (houseData?.owned) {
    return { success: false, message: 'You already own this property.', newState: state, goldSpent: 0 };
  }

  if (house.requiresThaneStatus && !isThane) {
    return { 
      success: false, 
      message: `You must be Thane of ${house.hold} to purchase this property.`, 
      newState: state, 
      goldSpent: 0 
    };
  }

  if (playerGold < house.baseCost) {
    return { 
      success: false, 
      message: `You need ${house.baseCost} gold. You only have ${playerGold}.`, 
      newState: state, 
      goldSpent: 0 
    };
  }

  const newHouses = { ...state.houses };
  newHouses[houseId] = {
    owned: true,
    purchasedAt: new Date().toISOString(),
    upgrades: [],
    furnishings: [],
    storedItems: [],
    displayedTrophies: []
  };

  return {
    success: true,
    message: `You are now the proud owner of ${house.name}! Your key awaits.`,
    newState: {
      ...state,
      houses: newHouses,
      activeHome: state.activeHome || houseId
    },
    goldSpent: house.baseCost
  };
};

// Upgrade a house room
export const upgradeHouseRoom = (
  state: HousingState,
  houseId: string,
  roomType: RoomType,
  playerGold: number
): { success: boolean; message: string; newState: HousingState; goldSpent: number } => {
  const house = HOUSES[houseId];
  const houseData = state.houses[houseId];
  
  if (!house || !houseData?.owned) {
    return { success: false, message: 'You don\'t own this house.', newState: state, goldSpent: 0 };
  }

  if (houseData.upgrades.includes(roomType)) {
    return { success: false, message: 'This room is already furnished.', newState: state, goldSpent: 0 };
  }

  // Get upgrade cost based on room type
  const upgradeCosts: Record<RoomType, number> = {
    bedroom: 500,
    kitchen: 750,
    alchemy: 1000,
    enchanting: 1500,
    armory: 1250,
    trophy: 1000,
    library: 750,
    storage: 500,
    greenhouse: 1500,
  };
  const cost = upgradeCosts[roomType] || 500;

  if (playerGold < cost) {
    return { 
      success: false, 
      message: `You need ${cost} gold for this upgrade.`, 
      newState: state, 
      goldSpent: 0 
    };
  }

  const newHouses = { ...state.houses };
  newHouses[houseId] = {
    ...houseData,
    upgrades: [...houseData.upgrades, roomType]
  };

  const roomNames: Record<RoomType, string> = {
    bedroom: 'Bedroom',
    kitchen: 'Kitchen',
    alchemy: 'Alchemy Lab',
    enchanting: 'Enchanting Table',
    armory: 'Armory',
    trophy: 'Trophy Room',
    library: 'Library',
    storage: 'Storage',
    greenhouse: 'Greenhouse',
  };

  return {
    success: true,
    message: `${roomNames[roomType]} has been furnished!`,
    newState: {
      ...state,
      houses: newHouses
    },
    goldSpent: cost
  };
};

// Set active home
export const setCurrentHome = (
  state: HousingState,
  houseId: string
): { success: boolean; message: string; newState: HousingState } => {
  if (!state.houses[houseId]?.owned) {
    return { success: false, message: 'You don\'t own this property.', newState: state };
  }

  const house = HOUSES[houseId];
  return {
    success: true,
    message: `${house?.name || houseId} is now your primary residence.`,
    newState: {
      ...state,
      activeHome: houseId
    }
  };
};

// Propose marriage (simplified for modal compatibility)
export const proposeMarriage = (
  state: HousingState,
  spouseId: string,
  homeId: string
): { success: boolean; message: string; newState: HousingState } => {
  if (state.spouse) {
    return { success: false, message: 'You are already married!', newState: state };
  }

  const spouse = SPOUSES[spouseId];
  if (!spouse) {
    return { success: false, message: 'This person cannot be married.', newState: state };
  }

  if (!state.houses[homeId]?.owned) {
    return { success: false, message: 'You need to own a house before you can marry.', newState: state };
  }

  return {
    success: true,
    message: `"${spouse.dialogue.proposal}" - ${spouse.name} has accepted your proposal!`,
    newState: {
      ...state,
      spouse: spouseId,
      spouseHome: homeId
    }
  };
};

// Collect spouse income
export const collectSpouseIncome = (
  state: HousingState
): { success: boolean; message: string; newState: HousingState; goldCollected: number } => {
  if (!state.spouse) {
    return { success: false, message: 'You are not married.', newState: state, goldCollected: 0 };
  }

  const spouse = SPOUSES[state.spouse];
  if (!spouse?.merchant) {
    return { success: false, message: 'Your spouse doesn\'t run a shop.', newState: state, goldCollected: 0 };
  }

  const goldCollected = 100; // Daily income from merchant spouse
  return {
    success: true,
    message: `${spouse.name} hands you ${goldCollected} gold from the shop.`,
    newState: state,
    goldCollected
  };
};

// Adopt a child
export const adoptChild = (
  state: HousingState,
  childName: string,
  gender: 'boy' | 'girl' = 'girl'
): { success: boolean; message: string; newState: HousingState } => {
  if (!state.activeHome) {
    return { success: false, message: 'You need a home before you can adopt children.', newState: state };
  }

  const house = HOUSES[state.activeHome];
  if (!house) {
    return { success: false, message: 'Invalid home.', newState: state };
  }

  const currentChildrenCount = state.children.filter(c => c.homeId === state.activeHome).length;
  if (currentChildrenCount >= house.maxChildren) {
    return { 
      success: false, 
      message: `You can only have ${house.maxChildren} children in ${house.name}.`, 
      newState: state 
    };
  }

  // Check if there's a bedroom in the house
  const houseData = state.houses[state.activeHome];
  const hasBedroomUpgrade = houseData?.upgrades.includes('bedroom');
  
  if (!hasBedroomUpgrade && house.rooms.every(r => r.type !== 'bedroom')) {
    return { 
      success: false, 
      message: 'You need to furnish a bedroom for children first.', 
      newState: state 
    };
  }

  const child: ChildData = {
    name: childName,
    gender,
    adoptedAt: new Date().toISOString(),
    homeId: state.activeHome
  };

  return {
    success: true,
    message: `You have adopted ${childName}! They will live at ${house.name}.`,
    newState: {
      ...state,
      children: [...state.children, child]
    }
  };
};

// Give child a gift
export const giveChildGift = (
  state: HousingState,
  childName: string,
  giftName: string
): { success: boolean; message: string; newState: HousingState } => {
  const child = state.children.find(c => c.name === childName);
  if (!child) {
    return { success: false, message: 'Child not found.', newState: state };
  }

  const updatedChildren = state.children.map(c =>
    c.name === childName ? { ...c, favoriteGift: giftName } : c
  );

  return {
    success: true,
    message: `${child.name} loves the ${giftName}!`,
    newState: {
      ...state,
      children: updatedChildren
    }
  };
};

// Get all purchasable houses for player's current status
export const getAvailableHouses = (
  state: HousingState,
  isThaneOf: string[] = []
): House[] => {
  return Object.values(HOUSES).filter(house => {
    // Already owned
    if (state.houses[house.id]?.owned) return false;
    // Check thane requirement
    if (house.requiresThaneStatus && !isThaneOf.includes(house.hold)) return false;
    return true;
  });
};

// Get house benefits (for resting, crafting, etc.)
export const getHouseBenefits = (state: HousingState, houseId?: string): {
  canRest: boolean;
  restBonus: number;
  storageSlots: number;
  bonuses: string[];
  hasAlchemy: boolean;
  hasEnchanting: boolean;
  hasForge: boolean;
  hasCooking: boolean;
  hasGarden: boolean;
  storageSpace: number;
} => {
  const targetHouseId = houseId || state.activeHome;
  
  if (!targetHouseId) {
    return {
      canRest: false,
      restBonus: 0,
      storageSlots: 0,
      bonuses: [],
      hasAlchemy: false,
      hasEnchanting: false,
      hasForge: false,
      hasCooking: false,
      hasGarden: false,
      storageSpace: 0
    };
  }

  const house = HOUSES[targetHouseId];
  const houseData = state.houses[targetHouseId];
  
  if (!house || !houseData?.owned) {
    return {
      canRest: false,
      restBonus: 0,
      storageSlots: 0,
      bonuses: [],
      hasAlchemy: false,
      hasEnchanting: false,
      hasForge: false,
      hasCooking: false,
      hasGarden: false,
      storageSpace: 0
    };
  }

  const upgrades = houseData.upgrades;
  const bonuses: string[] = [];
  
  if (upgrades.includes('alchemy')) bonuses.push('Alchemy Lab');
  if (upgrades.includes('enchanting')) bonuses.push('Enchanting Table');
  if (upgrades.includes('armory')) bonuses.push('Armory');
  if (upgrades.includes('kitchen')) bonuses.push('Kitchen');
  if (upgrades.includes('greenhouse')) bonuses.push('Greenhouse');
  if (upgrades.includes('library')) bonuses.push('Library');
  if (upgrades.includes('trophy')) bonuses.push('Trophy Room');

  return {
    canRest: true, // Owning a house means you can rest
    restBonus: 10 + (upgrades.includes('bedroom') ? 15 : 0),
    storageSlots: 100 + (upgrades.length * 50),
    bonuses,
    hasAlchemy: upgrades.includes('alchemy'),
    hasEnchanting: upgrades.includes('enchanting'),
    hasForge: upgrades.includes('armory'),
    hasCooking: upgrades.includes('kitchen'),
    hasGarden: upgrades.includes('greenhouse'),
    storageSpace: 100 + (upgrades.length * 50) // Base + upgrades
  };
};

// Can the player purchase this house right now?
export function canPurchaseHouse(state: HousingState, houseId: string, playerGold: number, isThane: boolean = true): boolean {
  const house = HOUSES[houseId];
  if (!house) return false;
  if (state.houses[houseId]?.owned) return false;
  if (house.requiresThaneStatus && !isThane) return false;
  if (playerGold < house.baseCost) return false;
  return true;
}

// Can the player marry this NPC given current housing state and basic checks
export function canMarry(state: HousingState, spouseId: string): boolean {
  const spouse = SPOUSES[spouseId];
  if (!spouse) return false;
  // Must already be married (can't marry again)
  if (state.spouse) return false;
  // Must own at least one house to marry
  const ownsHouse = Object.values(state.houses).some(h => h.owned);
  if (!ownsHouse) return false;
  // Additional requirements could be checked here (quests, items)
  return true;
}

export function getMarryableNPCs(state: HousingState): string[] {
  return Object.keys(SPOUSES).filter(id => canMarry(state, id));
}

export default {
  HOUSES,
  SPOUSES,
  initializeHousingState,
  getHousingState,
  purchaseHouse,
  upgradeHouseRoom,
  setCurrentHome,
  proposeMarriage,
  collectSpouseIncome,
  adoptChild,
  giveChildGift,
  getAvailableHouses,
  getHouseBenefits
};
