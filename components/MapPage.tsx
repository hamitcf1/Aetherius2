/**
 * MapPage - Full-fledged Skyrim map experience
 * Dedicated page component with dungeons, events, missions, and level-gated content
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Compass, ZoomIn, ZoomOut, Navigation, Castle, Mountain, Skull, Home, Shield, Flame, 
  Eye, EyeOff, TreePine, Waves, Swords, Lock, Unlock, Star, AlertTriangle, 
  MapPin, Clock, Coins, Award, ChevronRight, X, Sparkles, Target, Calendar
} from 'lucide-react';
import { Character } from '../types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type LocationType = 'city' | 'town' | 'village' | 'dungeon' | 'landmark' | 'camp' | 'fort' | 'ruin' | 'cave' | 'hold' | 'event' | 'mission';
export type DangerLevel = 'safe' | 'moderate' | 'dangerous' | 'deadly' | 'legendary';

export interface MapLocation {
  id: string;
  name: string;
  type: LocationType;
  x: number;
  y: number;
  hold?: string;
  description?: string;
  dangerLevel?: DangerLevel;
  faction?: string;
  rumors?: string[];
  levelRequirement?: number;
  rewards?: {
    gold?: { min: number; max: number };
    xp?: { min: number; max: number };
    items?: string[];
  };
  isEvent?: boolean;
  eventType?: 'combat' | 'treasure' | 'mystery' | 'merchant' | 'shrine';
  isMission?: boolean;
  missionObjective?: string;
  timeLimit?: string;
  repeatable?: boolean;
  // Optional link to a dungeon definition id in `data/dungeonDefinitions`
  dungeonId?: string;
}

export interface MapEvent {
  id: string;
  name: string;
  type: 'combat' | 'treasure' | 'mystery' | 'merchant' | 'shrine' | 'dragon' | 'bandit';
  x: number;
  y: number;
  description: string;
  levelRequirement: number;
  rewards: {
    gold?: { min: number; max: number };
    xp?: { min: number; max: number };
    items?: string[];
  };
  expiresAt?: number; // timestamp
  isActive: boolean;
}

export interface MapMission {
  id: string;
  name: string;
  objective: string;
  locationId: string;
  x: number;
  y: number;
  levelRequirement: number;
  rewards: {
    gold: { min: number; max: number };
    xp: { min: number; max: number };
    items?: string[];
  };
  timeLimit?: string;
  difficulty: DangerLevel;
  isCompleted?: boolean;
}

interface DiscoveredLocation {
  name: string;
  type: LocationType;
  x: number;
  y: number;
  hold?: string;
  description?: string;
  dangerLevel?: DangerLevel;
  faction?: string;
  rumors?: string[];
  discoveredAt?: number;
}

interface ClearedDungeon {
  dungeonId: string;
  clearCount: number;
}

interface MapPageProps {
  character: Character;
  currentLocation?: string;
  visitedLocations?: string[];
  questLocations?: Array<{ name: string; questName: string }>;
  discoveredLocations?: DiscoveredLocation[];
  clearedDungeons?: ClearedDungeon[];
  onEnterDungeon?: (locationName: string) => void;
  onStartEvent?: (event: MapEvent) => void;
  onStartMission?: (mission: MapMission) => void;
  showToast?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

// ============================================================================
// LOCATION DATABASE - COMPREHENSIVE SKYRIM LOCATIONS
// ============================================================================

export const SKYRIM_LOCATIONS: MapLocation[] = [
  // ========== MAJOR CITIES ==========
  { id: 'whiterun', name: 'Whiterun', type: 'city', x: 42, y: 52, hold: 'Whiterun Hold', description: 'The central trade hub of Skyrim. Home to Dragonsreach and the Companions.', dangerLevel: 'safe', faction: 'Neutral', rumors: ['Dragons have returned to Skyrim', 'The Companions seek new blood', 'Jarl Balgruuf remains neutral in the war'] },
  { id: 'solitude', name: 'Solitude', type: 'city', x: 15, y: 17, hold: 'Haafingar', description: 'Capital of Skyrim and seat of the Empire. The Blue Palace overlooks all.', dangerLevel: 'safe', faction: 'Imperial', rumors: ['General Tullius plans a major offensive', 'The Bards College accepts talented musicians', 'High King Torygg was murdered by Ulfric'] },
  { id: 'windhelm', name: 'Windhelm', type: 'city', x: 82, y: 28, hold: 'Eastmarch', description: 'Ancient Nord city and Stormcloak capital. The oldest human settlement in Skyrim.', dangerLevel: 'safe', faction: 'Stormcloak', rumors: ['Ulfric Stormcloak rallies his forces', 'A killer stalks the streets at night', 'The Dark Elves face discrimination'] },
  { id: 'riften', name: 'Riften', type: 'city', x: 88, y: 78, hold: 'The Rift', description: 'A city of shadows and intrigue. The Thieves Guild operates beneath its streets.', dangerLevel: 'moderate', faction: 'Neutral', rumors: ['Maven Black-Briar controls everything', 'The Thieves Guild has fallen on hard times', 'Skooma flows through the Ratway'] },
  { id: 'markarth', name: 'Markarth', type: 'city', x: 8, y: 48, hold: 'The Reach', description: 'A Dwemer city carved into the mountainside. Blood and silver flow freely.', dangerLevel: 'moderate', faction: 'Imperial', rumors: ['The Forsworn terrorize the land', 'The silver mines hide dark secrets', 'Something lurks in the Dwemer ruins'] },
  { id: 'falkreath', name: 'Falkreath', type: 'city', x: 30, y: 82, hold: 'Falkreath Hold', description: 'A somber town surrounded by pine forests and its famous cemetery.', dangerLevel: 'safe', faction: 'Imperial', rumors: ['More dead rest here than living', 'Bandits plague the mountain passes', 'A daedric shrine lies in the woods'] },
  { id: 'morthal', name: 'Morthal', type: 'city', x: 28, y: 26, hold: 'Hjaalmarch', description: 'A mysterious town in the swamps. Strange lights dance at night.', dangerLevel: 'moderate', faction: 'Imperial', rumors: ['Vampires have been seen nearby', 'The Jarl is troubled by visions', 'A house burned under strange circumstances'] },
  { id: 'dawnstar', name: 'Dawnstar', type: 'city', x: 45, y: 12, hold: 'The Pale', description: 'A northern mining town on the Sea of Ghosts. Nightmares plague its citizens.', dangerLevel: 'safe', faction: 'Stormcloak', rumors: ['No one can sleep peacefully', 'A Daedric artifact may be the cause', 'Pirates raid the coast'] },
  { id: 'winterhold', name: 'Winterhold', type: 'city', x: 72, y: 12, hold: 'Winterhold', description: 'Once a great capital, now ruins. Only the College remains.', dangerLevel: 'safe', faction: 'Neutral', rumors: ['The Great Collapse destroyed the city', 'The College is blamed for the disaster', 'Strange experiments occur within'] },

  // ========== TOWNS & VILLAGES ==========
  { id: 'riverwood', name: 'Riverwood', type: 'village', x: 40, y: 62, hold: 'Whiterun Hold', description: 'A peaceful lumber village along the White River.', dangerLevel: 'safe', rumors: ['The town fears dragon attacks', 'Gerdur runs the lumber mill'] },
  { id: 'rorikstead', name: 'Rorikstead', type: 'village', x: 22, y: 48, hold: 'Whiterun Hold', description: 'A farming community with unusually fertile lands.', dangerLevel: 'safe', rumors: ['The crops grow impossibly well', 'Dark bargains may explain the prosperity'] },
  { id: 'ivarstead', name: 'Ivarstead', type: 'village', x: 58, y: 62, hold: 'The Rift', description: 'A village at the base of the 7000 Steps.', dangerLevel: 'safe', rumors: ['Pilgrims pass through to High Hrothgar', 'A ghost haunts Shroud Hearth Barrow'] },
  { id: 'helgen', name: 'Helgen', type: 'town', x: 38, y: 78, hold: 'Falkreath Hold', description: 'A border town destroyed by dragon fire.', dangerLevel: 'dangerous', rumors: ['A dragon attacked during an execution', 'Bandits now occupy the ruins'] },
  { id: 'dragon_bridge', name: 'Dragon Bridge', type: 'village', x: 16, y: 24, hold: 'Haafingar', description: 'Named for the ancient bridge with dragon carvings.', dangerLevel: 'safe', rumors: ['Imperial soldiers pass through often', 'The Penitus Oculatus have an outpost'] },
  { id: 'karthwasten', name: 'Karthwasten', type: 'village', x: 12, y: 42, hold: 'The Reach', description: 'A small mining settlement in the harsh Reach.', dangerLevel: 'moderate', rumors: ['Silver veins run deep', 'The Forsworn watch from the hills'] },
  { id: 'shor_stone', name: "Shor's Stone", type: 'village', x: 84, y: 62, hold: 'The Rift', description: 'A mining village struggling against the wilderness.', dangerLevel: 'moderate', rumors: ['The mine is infested with spiders', 'Honest folk just trying to survive'] },

  // ========== LANDMARKS ==========
  { id: 'high_hrothgar', name: 'High Hrothgar', type: 'landmark', x: 54, y: 56, description: 'Monastery of the Greybeards atop the Throat of the World.', dangerLevel: 'safe', rumors: ['The Greybeards study the Voice', 'Only the Dragonborn is summoned', 'Frost trolls roam the path'] },
  { id: 'throat_of_world', name: 'Throat of the World', type: 'landmark', x: 52, y: 52, description: 'The highest peak in all of Tamriel.', dangerLevel: 'moderate', rumors: ['An ancient dragon meditates at the summit', 'Paarthurnax guards a great secret'] },
  { id: 'college_winterhold', name: 'College of Winterhold', type: 'landmark', x: 74, y: 10, hold: 'Winterhold', description: 'The premier institution for magical study.', dangerLevel: 'safe', faction: 'College', rumors: ['Powerful artifacts fill the Arcanaeum', 'The Thalmor watch the College closely', 'Entry requires magical talent'] },
  { id: 'sky_haven_temple', name: 'Sky Haven Temple', type: 'landmark', x: 14, y: 56, hold: 'The Reach', description: 'Ancient Akaviri fortress hidden in the mountains.', dangerLevel: 'moderate', levelRequirement: 15, rumors: ['The Blades once called this home', 'Alduin\'s Wall reveals prophecy'] },

  // ========== DUNGEONS - LEVELED ==========
  // Beginner Dungeons (Level 1-10)
  { id: 'bleak_falls_barrow', name: 'Bleak Falls Barrow', type: 'dungeon', x: 38, y: 58, hold: 'Whiterun Hold', description: 'An ancient Nordic tomb infested with draugr.', dangerLevel: 'dangerous', levelRequirement: 1, rumors: ['Bandits guard the entrance', 'The Golden Claw opens the inner sanctum', 'A Word Wall lies within'], rewards: { gold: { min: 200, max: 500 }, xp: { min: 150, max: 300 }, items: ['Ancient Nord Weapon', 'Dragon Claw'] }, dungeonId: 'bleak_falls_barrow_dg' },
  { id: 'embershard_mine', name: 'Embershard Mine', type: 'dungeon', x: 36, y: 64, hold: 'Whiterun Hold', description: 'An iron mine taken over by bandits.', dangerLevel: 'moderate', levelRequirement: 1, rumors: ['Bandits have claimed the mine', 'Iron ore litters the tunnels'], rewards: { gold: { min: 100, max: 300 }, xp: { min: 100, max: 200 }, items: ['Iron Ore', 'Bandit Loot'] }, dungeonId: 'mineshaft_dg' },
  { id: 'white_river_watch', name: 'White River Watch', type: 'cave', x: 46, y: 54, hold: 'Whiterun Hold', description: 'A cave overlooking the White River, home to bandits.', dangerLevel: 'moderate', levelRequirement: 3, rumors: ['A blind bandit leader rules here', 'Good view of approaching travelers'], rewards: { gold: { min: 150, max: 350 }, xp: { min: 120, max: 220 } } },
  { id: 'halted_stream_camp', name: 'Halted Stream Camp', type: 'camp', x: 44, y: 46, hold: 'Whiterun Hold', description: 'A fortified bandit camp with a mammoth-bone mine.', dangerLevel: 'moderate', levelRequirement: 5, rumors: ['Poachers hunt mammoths here', 'The Transmute spell book is hidden within'], rewards: { gold: { min: 200, max: 450 }, xp: { min: 150, max: 280 }, items: ['Transmute Spell Tome'] }, dungeonId: 'bandit_hideout_dg' },
  
  // Intermediate Dungeons (Level 10-20)
  { id: 'dustmans_cairn', name: "Dustman's Cairn", type: 'dungeon', x: 36, y: 50, hold: 'Whiterun Hold', description: 'An ancient Nordic barrow with Silver Hand werewolf hunters.', dangerLevel: 'dangerous', levelRequirement: 10, rumors: ['The Companions have business here', 'Silver Hand fanatics lurk within'], rewards: { gold: { min: 400, max: 800 }, xp: { min: 300, max: 500 }, items: ['Silver Weapons', 'Fragment of Wuuthrad'] }, dungeonId: 'dustmans_cairn_dg' },
  { id: 'silent_moons_camp', name: 'Silent Moons Camp', type: 'dungeon', x: 40, y: 44, hold: 'Whiterun Hold', description: 'Nordic ruins with a lunar forge that enchants weapons at night.', dangerLevel: 'dangerous', levelRequirement: 12, rumors: ['The Lunar Forge creates unique weapons', 'Bandits guard an ancient secret'], rewards: { gold: { min: 350, max: 700 }, xp: { min: 280, max: 450 }, items: ['Lunar Weapon'] }, dungeonId: 'silent_moons_camp_dg' },
  { id: 'shroud_hearth_barrow', name: 'Shroud Hearth Barrow', type: 'dungeon', x: 60, y: 64, hold: 'The Rift', description: 'A haunted Nordic tomb near Ivarstead.', dangerLevel: 'dangerous', levelRequirement: 14, rumors: ['A ghost protects ancient treasure', 'The Sapphire Dragon Claw opens the way'], rewards: { gold: { min: 450, max: 900 }, xp: { min: 350, max: 550 }, items: ['Sapphire Dragon Claw'] }, dungeonId: 'shroud_hearth_barrow_dg' },
  { id: 'vampire_lair', name: 'Movarth\'s Lair', type: 'dungeon', x: 26, y: 28, hold: 'Hjaalmarch', description: 'A dark lair saturated with blood magics near Morthal.', dangerLevel: 'dangerous', levelRequirement: 15, rumors: ['Vampires have been seen nearby', 'Blood altars glow in darkness', 'The undead feast on travelers'], rewards: { gold: { min: 500, max: 1000 }, xp: { min: 400, max: 600 }, items: ['Vampire Dust', 'Enchanted Ring'] }, dungeonId: 'vampire_lair_dg' },
  { id: 'broken_fang_cave', name: 'Broken Fang Cave', type: 'cave', x: 24, y: 54, hold: 'Whiterun Hold', description: 'A vampire den west of Whiterun.', dangerLevel: 'dangerous', levelRequirement: 16, rumors: ['Vampires prey on travelers', 'A master vampire rules the coven'], rewards: { gold: { min: 450, max: 850 }, xp: { min: 380, max: 580 } }, dungeonId: 'broken_fang_cave_dg' },
  
  // Advanced Dungeons (Level 20-35)
  { id: 'labyrinthian', name: 'Labyrinthian', type: 'dungeon', x: 34, y: 30, hold: 'Hjaalmarch', description: 'Vast ruins of an ancient Nordic city. Dragon priests and twisted corridors await.', dangerLevel: 'deadly', levelRequirement: 20, rumors: ['Dragon priests ruled here', 'The Staff of Magnus awaits', 'Many enter, few return'], rewards: { gold: { min: 1500, max: 3000 }, xp: { min: 800, max: 1200 }, items: ['Staff of Magnus', 'Dragon Priest Mask'] }, dungeonId: 'labyrinthian_dg' },
  { id: 'forelhost', name: 'Forelhost', type: 'dungeon', x: 92, y: 72, hold: 'The Rift', description: 'A dragon cult temple high in the Jerall Mountains.', dangerLevel: 'deadly', levelRequirement: 22, rumors: ['Dragon cultists made their last stand here', 'Rahgot guards the peak'], rewards: { gold: { min: 1200, max: 2500 }, xp: { min: 750, max: 1100 }, items: ['Rahgot (Dragon Priest Mask)'] }, dungeonId: 'forelhost_dg' },
  { id: 'nchuand_zel', name: 'Nchuand-Zel', type: 'ruin', x: 6, y: 46, hold: 'The Reach', description: 'Dwemer ruins beneath Markarth, overrun by Falmer.', dangerLevel: 'deadly', levelRequirement: 25, rumors: ['The Falmer have claimed the depths', 'Dwemer automatons still function', 'The expedition never returned'], rewards: { gold: { min: 1800, max: 3500 }, xp: { min: 900, max: 1300 }, items: ['Dwemer Artifacts', 'Aetherial Shard'] }, dungeonId: 'nchuand_zel_dg' },
  { id: 'volunruud', name: 'Volunruud', type: 'dungeon', x: 40, y: 22, hold: 'The Pale', description: 'An ancient Nordic tomb containing the legendary Shout, Aura Whisper.', dangerLevel: 'deadly', levelRequirement: 28, rumors: ['Dark Brotherhood contracts lead here', 'A Word Wall awaits the worthy'], rewards: { gold: { min: 1400, max: 2800 }, xp: { min: 850, max: 1250 }, items: ['Ceremonial Weapons', 'Word of Power'] }, dungeonId: 'volunruud_dg' },
  
  // Expert Dungeons (Level 35-50)
  { id: 'blackreach', name: 'Blackreach', type: 'dungeon', x: 50, y: 36, description: 'A massive underground Dwemer cavern. Bioluminescent fungi and Falmer hunters roam.', dangerLevel: 'deadly', levelRequirement: 35, rumors: ['Crimson Nirnroot grows here', 'The Falmer claim these depths', 'Dwemer automatons still patrol'], rewards: { gold: { min: 3000, max: 6000 }, xp: { min: 1500, max: 2500 }, items: ['Crimson Nirnroot', 'Elder Scroll'] }, dungeonId: 'blackreach_dg' },
  { id: 'skuldafn', name: 'Skuldafn', type: 'dungeon', x: 95, y: 45, hold: 'Eastmarch', description: 'The ancient Nordic temple serving as Alduin\'s portal to Sovngarde.', dangerLevel: 'legendary', levelRequirement: 40, rumors: ['Dragons guard the approach', 'The portal to Sovngarde awaits', 'Only the Dragonborn may enter'], rewards: { gold: { min: 5000, max: 10000 }, xp: { min: 3000, max: 5000 }, items: ['Nahkriin (Dragon Priest Mask)'] }, dungeonId: 'skuldafn_dg' },
  { id: 'forgotten_vale', name: 'Forgotten Vale', type: 'dungeon', x: 4, y: 38, description: 'A hidden glacial valley, home to the last Snow Elves.', dangerLevel: 'legendary', levelRequirement: 45, rumors: ['Auriel\'s Bow lies within', 'The Falmer were once beautiful', 'Two dragons guard the inner sanctum'], rewards: { gold: { min: 6000, max: 12000 }, xp: { min: 4000, max: 7000 }, items: ['Auriel\'s Bow', 'Paragon'] }, dungeonId: 'forgotten_vale_dg' },
  { id: 'soul_cairn', name: 'Soul Cairn', type: 'dungeon', x: 30, y: 95, description: 'A plane of Oblivion where trapped souls wander eternally.', dangerLevel: 'legendary', levelRequirement: 50, rumors: ['The Ideal Masters rule here', 'Jiub seeks his opus', 'Durnehviir yearns for freedom'], rewards: { gold: { min: 8000, max: 15000 }, xp: { min: 5000, max: 8000 }, items: ['Arvak (Spectral Horse)', 'Soul Husk'] }, dungeonId: 'soul_cairn_dg' },

  // ========== CAVES ==========
  { id: 'frost_spider_den', name: 'Frostflow Abyss', type: 'cave', x: 68, y: 14, hold: 'Winterhold', description: 'A nest of giant Chaurus and their Falmer masters.', dangerLevel: 'dangerous', levelRequirement: 18, rumors: ['A family lighthouse hides a dark secret', 'Chaurus eggs fetch good prices'], rewards: { gold: { min: 600, max: 1100 }, xp: { min: 450, max: 700 } }, dungeonId: 'frost_spider_den_dg' },
  { id: 'troll_cave', name: 'Graywinter Watch', type: 'cave', x: 20, y: 50, hold: 'Whiterun Hold', description: 'A shallow cave dominated by territorial trolls.', dangerLevel: 'moderate', levelRequirement: 8, rumors: ['Trolls regenerate from wounds', 'Fire is their weakness'], rewards: { gold: { min: 200, max: 400 }, xp: { min: 180, max: 320 } }, dungeonId: 'troll_cave_dg' },
  { id: 'daedric_shrine', name: 'Shrine of Mehrunes Dagon', type: 'dungeon', x: 48, y: 16, hold: 'The Pale', description: 'A warped shrine with Dremora guardians.', dangerLevel: 'deadly', levelRequirement: 20, rumors: ['Mehrunes\' Razor can be reforged', 'Dremora guard the shrine'], rewards: { gold: { min: 1000, max: 2000 }, xp: { min: 600, max: 1000 }, items: ['Mehrunes\' Razor'] }, dungeonId: 'daedric_shrine_dg' },
  { id: 'ice_cavern', name: 'Wayward Pass', type: 'cave', x: 42, y: 10, hold: 'The Pale', description: 'A winding cave of ice and whirling winds.', dangerLevel: 'dangerous', levelRequirement: 12, rumors: ['Ice wolves hunt in packs', 'A shortcut through the mountains'], rewards: { gold: { min: 300, max: 600 }, xp: { min: 250, max: 400 } }, dungeonId: 'ice_cavern_dg' },
  { id: 'mineshaft', name: 'Redbelly Mine', type: 'dungeon', x: 86, y: 64, hold: 'The Rift', description: 'An ebony mine infested with spiders.', dangerLevel: 'moderate', levelRequirement: 10, rumors: ['Ebony ore is worth its weight in gold', 'Giant spiders claimed the depths'], rewards: { gold: { min: 400, max: 800 }, xp: { min: 280, max: 450 }, items: ['Ebony Ore'] }, dungeonId: 'mineshaft_dg' },
  { id: 'forsworn_camp', name: 'Lost Valley Redoubt', type: 'dungeon', x: 12, y: 52, hold: 'The Reach', description: 'A massive Forsworn stronghold with a Hagravens\' lair.', dangerLevel: 'dangerous', levelRequirement: 16, rumors: ['Hagravens command the Forsworn', 'A Word Wall lies at the summit'], rewards: { gold: { min: 700, max: 1300 }, xp: { min: 500, max: 800 }, items: ['Forsworn Briarheart', 'Word of Power'] }, dungeonId: 'forsworn_camp_dg' },

  // ========== FORTS ==========
  { id: 'fort_greymoor', name: 'Fort Greymoor', type: 'fort', x: 32, y: 48, hold: 'Whiterun Hold', description: 'A strategic fort contested between bandits and soldiers.', dangerLevel: 'dangerous', levelRequirement: 12, rumors: ['Whoever holds this fort controls the road', 'Well-armed bandits or soldiers garrison it'], rewards: { gold: { min: 500, max: 900 }, xp: { min: 350, max: 550 } } },
  { id: 'fort_dunstad', name: 'Fort Dunstad', type: 'fort', x: 50, y: 18, hold: 'The Pale', description: 'A northern fortress often held by bandits.', dangerLevel: 'dangerous', levelRequirement: 14, rumors: ['The cold doesn\'t bother the desperate', 'Strategic for controlling the north'], rewards: { gold: { min: 550, max: 1000 }, xp: { min: 400, max: 600 } } },
  { id: 'fort_kastav', name: 'Fort Kastav', type: 'fort', x: 78, y: 18, hold: 'Winterhold', description: 'An imposing fortress in the frozen north.', dangerLevel: 'dangerous', levelRequirement: 18, rumors: ['Imperial prisoners are held here', 'The fortress has changed hands many times'], rewards: { gold: { min: 650, max: 1200 }, xp: { min: 480, max: 720 } } },
];

// ============================================================================
// MAP EVENTS - Dynamic content that appears on the map
// ============================================================================

export const generateMapEvents = (playerLevel: number): MapEvent[] => {
  const baseEvents: Omit<MapEvent, 'id' | 'expiresAt' | 'isActive'>[] = [
    { name: 'Dragon Sighting', type: 'dragon', x: 48, y: 38, description: 'A dragon has been spotted circling the mountains!', levelRequirement: 10, rewards: { gold: { min: 500, max: 1500 }, xp: { min: 400, max: 800 }, items: ['Dragon Bones', 'Dragon Scales'] } },
    { name: 'Bandit Ambush', type: 'bandit', x: 35, y: 68, description: 'Bandits are attacking travelers on the road.', levelRequirement: 3, rewards: { gold: { min: 100, max: 300 }, xp: { min: 80, max: 150 } } },
    { name: 'Mysterious Merchant', type: 'merchant', x: 55, y: 45, description: 'A Khajiit caravan has set up camp with rare wares.', levelRequirement: 1, rewards: { gold: { min: 0, max: 0 }, xp: { min: 50, max: 100 } } },
    { name: 'Shrine of Talos', type: 'shrine', x: 62, y: 72, description: 'A hidden shrine offers blessings to the faithful.', levelRequirement: 1, rewards: { xp: { min: 100, max: 200 } } },
    { name: 'Buried Treasure', type: 'treasure', x: 78, y: 52, description: 'A treasure map leads to this location.', levelRequirement: 8, rewards: { gold: { min: 800, max: 2000 }, xp: { min: 200, max: 400 }, items: ['Enchanted Jewelry'] } },
    { name: 'Ancient Mystery', type: 'mystery', x: 22, y: 35, description: 'Strange lights have been seen near ancient stones.', levelRequirement: 15, rewards: { gold: { min: 300, max: 600 }, xp: { min: 350, max: 600 }, items: ['Mysterious Artifact'] } },
    { name: 'Wolf Pack', type: 'combat', x: 65, y: 55, description: 'A pack of wolves threatens nearby farms.', levelRequirement: 2, rewards: { gold: { min: 50, max: 150 }, xp: { min: 60, max: 120 } } },
    { name: 'Giant Camp Raid', type: 'combat', x: 38, y: 42, description: 'Giants are trampling crops. Help drive them away!', levelRequirement: 12, rewards: { gold: { min: 400, max: 900 }, xp: { min: 350, max: 600 }, items: ['Giant\'s Toe', 'Mammoth Tusk'] } },
  ];

  // Filter by level and add dynamic properties
  return baseEvents
    .filter(e => e.levelRequirement <= playerLevel + 5) // Show events slightly above level
    .map((e, i) => ({
      ...e,
      id: `event_${i}_${Date.now()}`,
      expiresAt: Date.now() + (Math.random() * 24 + 12) * 60 * 60 * 1000, // 12-36 hours
      isActive: true,
    }));
};

// ============================================================================
// MAP MISSIONS - Objective-based content
// ============================================================================

export const MAP_MISSIONS: MapMission[] = [
  { id: 'mission_clear_bandits', name: 'Clear the Roads', objective: 'Eliminate the bandit threat at Embershard Mine', locationId: 'embershard_mine', x: 36, y: 64, levelRequirement: 3, rewards: { gold: { min: 300, max: 500 }, xp: { min: 200, max: 350 } }, difficulty: 'moderate' },
  { id: 'mission_dragon_bounty', name: 'Dragon Bounty', objective: 'Slay the dragon terrorizing Whiterun Hold', locationId: 'throat_of_world', x: 52, y: 52, levelRequirement: 15, rewards: { gold: { min: 1500, max: 3000 }, xp: { min: 800, max: 1200 }, items: ['Dragon Bones', 'Enchanted Weapon'] }, difficulty: 'deadly', timeLimit: '3 days' },
  { id: 'mission_retrieve_artifact', name: 'Lost Artifact', objective: 'Recover the ancient relic from Dustman\'s Cairn', locationId: 'dustmans_cairn', x: 36, y: 50, levelRequirement: 12, rewards: { gold: { min: 800, max: 1500 }, xp: { min: 500, max: 800 }, items: ['Ancient Artifact'] }, difficulty: 'dangerous' },
  { id: 'mission_vampire_menace', name: 'Vampire Menace', objective: 'Destroy the vampire coven threatening Morthal', locationId: 'vampire_lair', x: 26, y: 28, levelRequirement: 18, rewards: { gold: { min: 1000, max: 2000 }, xp: { min: 600, max: 1000 } }, difficulty: 'dangerous', timeLimit: '5 days' },
  { id: 'mission_dwemer_secrets', name: 'Dwemer Secrets', objective: 'Explore the depths of Nchuand-Zel', locationId: 'nchuand_zel', x: 6, y: 46, levelRequirement: 28, rewards: { gold: { min: 2500, max: 5000 }, xp: { min: 1200, max: 2000 }, items: ['Dwemer Schematic'] }, difficulty: 'deadly' },
  { id: 'mission_labyrinth', name: 'The Labyrinth', objective: 'Navigate Labyrinthian and claim the Staff of Magnus', locationId: 'labyrinthian', x: 34, y: 30, levelRequirement: 22, rewards: { gold: { min: 3000, max: 5000 }, xp: { min: 1500, max: 2500 }, items: ['Staff of Magnus'] }, difficulty: 'deadly' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const findLocationByName = (name: string): MapLocation | undefined => {
  const normalized = name.toLowerCase().trim();
  let found = SKYRIM_LOCATIONS.find(loc => loc.name.toLowerCase() === normalized);
  if (found) return found;
  found = SKYRIM_LOCATIONS.find(loc => loc.name.toLowerCase().includes(normalized) || normalized.includes(loc.name.toLowerCase()));
  return found;
};

const getMarkerColor = (location: MapLocation, currentLocationId?: string, visitedLocations: string[] = [], questLocations: Array<{ name: string }> = []): string => {
  if (currentLocationId === location.id) return '#22c55e';
  if (visitedLocations.some(v => findLocationByName(v)?.id === location.id)) return '#3b82f6';
  if (questLocations.some(q => findLocationByName(q.name)?.id === location.id)) return '#eab308';
  switch (location.type) {
    case 'city': return '#d4a44a';
    case 'town': return '#b8860b';
    case 'village': return '#8b7355';
    case 'dungeon': return '#dc2626';
    case 'landmark': return '#a855f7';
    case 'ruin': return '#ea580c';
    case 'cave': return '#78716c';
    case 'fort': return '#64748b';
    case 'camp': return '#84cc16';
    default: return '#9ca3af';
  }
};

const getDangerColor = (level?: DangerLevel): string => {
  switch (level) {
    case 'safe': return 'text-green-400';
    case 'moderate': return 'text-yellow-400';
    case 'dangerous': return 'text-orange-400';
    case 'deadly': return 'text-red-400';
    case 'legendary': return 'text-purple-400';
    default: return 'text-stone-400';
  }
};

const getDangerBgColor = (level?: DangerLevel): string => {
  switch (level) {
    case 'safe': return 'bg-green-900/30 border-green-700/50';
    case 'moderate': return 'bg-yellow-900/30 border-yellow-700/50';
    case 'dangerous': return 'bg-orange-900/30 border-orange-700/50';
    case 'deadly': return 'bg-red-900/30 border-red-700/50';
    case 'legendary': return 'bg-purple-900/30 border-purple-700/50';
    default: return 'bg-stone-900/30 border-stone-700/50';
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MapPage: React.FC<MapPageProps> = ({
  character,
  currentLocation,
  visitedLocations = [],
  questLocations = [],
  discoveredLocations = [],
  clearedDungeons = [],
  onEnterDungeon,
  onStartEvent,
  onStartMission,
  showToast,
}) => {
  // State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const [selectedMission, setSelectedMission] = useState<MapMission | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showHolds, setShowHolds] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showMissions, setShowMissions] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [activePanel, setActivePanel] = useState<'location' | 'event' | 'mission' | 'legend' | null>('legend');
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const playerLevel = character?.level || 1;
  const currentLocationObj = currentLocation ? findLocationByName(currentLocation) : undefined;

  // Generate events based on player level
  const [mapEvents, setMapEvents] = useState<MapEvent[]>(() => generateMapEvents(playerLevel));

  // Refresh events periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMapEvents(prev => {
        const now = Date.now();
        const active = prev.filter(e => e.expiresAt && e.expiresAt > now);
        // Add new events if too few
        if (active.length < 3) {
          const newEvents = generateMapEvents(playerLevel).slice(0, 2);
          return [...active, ...newEvents];
        }
        return active;
      });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [playerLevel]);

  // Filter available missions by level
  const availableMissions = useMemo(() => 
    MAP_MISSIONS.filter(m => m.levelRequirement <= playerLevel + 5 && !m.isCompleted),
    [playerLevel]
  );

  // Merge all locations
  const allLocations = useMemo(() => {
    const baseLocations = SKYRIM_LOCATIONS.filter(loc => loc.type !== 'hold');
    const discovered: MapLocation[] = discoveredLocations.map(dl => ({
      id: `discovered_${dl.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: dl.name,
      type: dl.type,
      x: dl.x,
      y: dl.y,
      hold: dl.hold,
      description: dl.description,
      dangerLevel: dl.dangerLevel,
      faction: dl.faction,
      rumors: dl.rumors,
    }));
    const existingNames = new Set(baseLocations.map(l => l.name.toLowerCase()));
    const newDiscovered = discovered.filter(d => !existingNames.has(d.name.toLowerCase()));
    return [...baseLocations, ...newDiscovered];
  }, [discoveredLocations]);

  // Filter locations
  const filteredLocations = useMemo(() => {
    return allLocations.filter(loc => {
      if (filterType === 'all') return true;
      if (filterType === 'cities') return ['city', 'town', 'village'].includes(loc.type);
      if (filterType === 'dungeons') return ['dungeon', 'ruin', 'cave', 'fort', 'camp'].includes(loc.type);
      if (filterType === 'landmarks') return ['landmark'].includes(loc.type);
      if (filterType === 'unlocked') return !loc.levelRequirement || loc.levelRequirement <= playerLevel;
      if (filterType === 'quests') return questLocations.some(q => findLocationByName(q.name)?.id === loc.id);
      return true;
    });
  }, [filterType, allLocations, playerLevel, questLocations]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // Wheel zoom
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(prev => Math.max(0.5, Math.min(3, prev + (e.deltaY > 0 ? -0.1 : 0.1))));
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Touch handlers
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; distance?: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      setTouchStart({ x: pan.x, y: pan.y, distance });
    }
  }, [pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return;
    if (e.touches.length === 1 && !touchStart.distance) {
      setPan({ x: e.touches[0].clientX - touchStart.x, y: e.touches[0].clientY - touchStart.y });
    } else if (e.touches.length === 2 && touchStart.distance) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scale = distance / touchStart.distance;
      setZoom(prev => Math.max(0.5, Math.min(3, prev * scale)));
      setTouchStart({ ...touchStart, distance });
    }
  }, [touchStart]);

  const handleTouchEnd = useCallback(() => setTouchStart(null), []);

  // Center on current location
  const centerOnLocation = useCallback((loc?: MapLocation) => {
    if (loc) {
      setPan({ x: -(loc.x - 50) * zoom * 8, y: -(loc.y - 50) * zoom * 6 });
    }
  }, [zoom]);

  // Get marker icon
  const getMarkerIcon = (location: MapLocation, isCurrent: boolean) => {
    const color = getMarkerColor(location, currentLocationObj?.id, visitedLocations, questLocations);
    const size = location.type === 'city' ? 22 : location.type === 'town' ? 18 : 14;
    const isLocked = location.levelRequirement && location.levelRequirement > playerLevel;
    
    if (isLocked) {
      return <Lock size={size} color="#6b7280" strokeWidth={2} />;
    }
    
    switch (location.type) {
      case 'city': return <Castle size={size} color={color} fill={isCurrent ? color : 'none'} strokeWidth={2} />;
      case 'town': case 'village': return <Home size={size} color={color} fill={isCurrent ? color : 'none'} strokeWidth={2} />;
      case 'dungeon': case 'cave': return <Skull size={size} color={color} fill={isCurrent ? color : 'none'} strokeWidth={2} />;
      case 'landmark': return <Mountain size={size} color={color} fill={isCurrent ? color : 'none'} strokeWidth={2} />;
      case 'ruin': return <Flame size={size} color={color} fill={isCurrent ? color : 'none'} strokeWidth={2} />;
      case 'fort': case 'camp': return <Shield size={size} color={color} fill={isCurrent ? color : 'none'} strokeWidth={2} />;
      default: return <MapPin size={size} color={color} fill={isCurrent ? color : 'none'} strokeWidth={2} />;
    }
  };

  // Get event icon
  const getEventIcon = (event: MapEvent) => {
    const size = 16;
    switch (event.type) {
      case 'dragon': return <Flame size={size} color="#ef4444" className="animate-pulse" />;
      case 'bandit': return <Swords size={size} color="#f97316" />;
      case 'merchant': return <Coins size={size} color="#eab308" />;
      case 'shrine': return <Sparkles size={size} color="#a855f7" />;
      case 'treasure': return <Star size={size} color="#fbbf24" className="animate-pulse" />;
      case 'mystery': return <Eye size={size} color="#8b5cf6" />;
      default: return <AlertTriangle size={size} color="#ef4444" />;
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-gradient-to-b from-stone-900 via-stone-950 to-black overflow-hidden">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-900/80 border-b border-amber-900/30">
        <div className="flex items-center gap-3">
          <Compass className="text-amber-500" size={28} />
          <div>
            <h1 className="text-xl font-serif font-bold text-amber-400 tracking-wide">Map of Skyrim</h1>
            {currentLocation && (
              <p className="text-xs text-stone-400">
                Current: <span className="text-green-400 font-medium">{currentLocation}</span>
                <span className="mx-2 text-stone-600">|</span>
                Level <span className="text-amber-400 font-bold">{playerLevel}</span>
              </p>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-stone-800/50 rounded-lg p-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'cities', label: 'Cities' },
            { id: 'dungeons', label: 'Dungeons' },
            { id: 'landmarks', label: 'Landmarks' },
            { id: 'unlocked', label: 'Unlocked' },
            { id: 'quests', label: 'Quests' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filterType === f.id 
                  ? 'bg-amber-600 text-white' 
                  : 'text-stone-400 hover:text-white hover:bg-stone-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEvents(!showEvents)} className={`p-2 rounded transition-colors ${showEvents ? 'bg-red-900/40 text-red-400' : 'bg-stone-800 text-stone-500'}`} title="Toggle Events">
            <AlertTriangle size={18} />
          </button>
          <button onClick={() => setShowMissions(!showMissions)} className={`p-2 rounded transition-colors ${showMissions ? 'bg-blue-900/40 text-blue-400' : 'bg-stone-800 text-stone-500'}`} title="Toggle Missions">
            <Target size={18} />
          </button>
          <button onClick={() => setShowLabels(!showLabels)} className={`p-2 rounded transition-colors ${showLabels ? 'bg-amber-900/40 text-amber-400' : 'bg-stone-800 text-stone-500'}`} title="Toggle Labels">
            {showLabels ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <div className="h-6 w-px bg-stone-700" />
          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-2 bg-stone-800 rounded hover:bg-stone-700">
            <ZoomIn size={18} className="text-amber-400" />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-2 bg-stone-800 rounded hover:bg-stone-700">
            <ZoomOut size={18} className="text-amber-400" />
          </button>
          {currentLocationObj && (
            <button onClick={() => centerOnLocation(currentLocationObj)} className="p-2 bg-green-900/40 rounded hover:bg-green-900/60" title="Center on you">
              <Navigation size={18} className="text-green-400" />
            </button>
          )}
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Canvas */}
        <div
          ref={mapContainerRef}
          className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center' }}
          >
            {/* Map SVG Background */}
            <div className="relative" style={{ width: '800px', height: '800px' }}>
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                <defs>
                  <linearGradient id="mapBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1a1810" />
                    <stop offset="50%" stopColor="#252318" />
                    <stop offset="100%" stopColor="#1a1510" />
                  </linearGradient>
                  <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#5a5a5a" />
                    <stop offset="100%" stopColor="#2a2a2a" />
                  </linearGradient>
                  <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0a1825" />
                    <stop offset="100%" stopColor="#051520" />
                  </linearGradient>
                  <linearGradient id="forestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1a3525" />
                    <stop offset="100%" stopColor="#0a1812" />
                  </linearGradient>
                  <pattern id="snow" patternUnits="userSpaceOnUse" width="4" height="4">
                    <circle cx="1" cy="1" r="0.3" fill="#fff" opacity="0.08"/>
                    <circle cx="3" cy="3" r="0.2" fill="#fff" opacity="0.06"/>
                  </pattern>
                  <pattern id="trees" patternUnits="userSpaceOnUse" width="3" height="3">
                    <path d="M1.5 0 L2.2 2.5 L0.8 2.5 Z" fill="#1a3020" opacity="0.4"/>
                  </pattern>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                
                {/* Background */}
                <rect width="100" height="100" fill="url(#mapBg)" />
                
                {/* Sea of Ghosts */}
                <path d="M0 0 L100 0 L100 10 Q85 14 70 11 Q55 8 40 12 Q25 15 10 10 L0 8 Z" fill="url(#waterGrad)" />
                <path d="M0 0 L0 12 Q8 16 12 12 Q18 8 22 10 L30 0" fill="url(#waterGrad)" opacity="0.9" />
                
                {/* Mountain Ranges */}
                <g opacity="0.8">
                  <path d="M45 42 L52 48 L55 42 L60 50 L65 44 L58 58 L48 58 L42 50 Z" fill="url(#mountainGrad)" />
                  <path d="M48 45 L52 50 L56 45 L54 52 L50 54 L46 50 Z" fill="#4a4a4a" />
                </g>
                <g opacity="0.7">
                  <path d="M2 38 L8 45 L5 52 L10 58 L6 68 L2 62 L0 48 Z" fill="url(#mountainGrad)" />
                </g>
                <g opacity="0.6">
                  <path d="M62 8 L70 16 L78 10 L85 20 L75 24 L65 18 Z" fill="url(#mountainGrad)" />
                </g>
                <g opacity="0.65">
                  <path d="M90 25 L96 38 L100 50 L100 65 L95 55 L92 42 L88 32 Z" fill="url(#mountainGrad)" />
                </g>
                <g opacity="0.55">
                  <path d="M20 88 L32 94 L45 90 L58 95 L72 88 L80 95 L72 100 L48 100 L25 100 L15 94 Z" fill="url(#mountainGrad)" />
                </g>
                
                {/* Forests */}
                <ellipse cx="32" cy="78" rx="14" ry="10" fill="url(#forestGrad)" opacity="0.5" />
                <ellipse cx="80" cy="72" rx="12" ry="14" fill="url(#forestGrad)" opacity="0.45" />
                <circle cx="40" cy="68" r="6" fill="url(#forestGrad)" opacity="0.35" />
                
                {/* Swamps */}
                <ellipse cx="28" cy="28" rx="10" ry="6" fill="#0a1815" opacity="0.5" />
                
                {/* Snow */}
                <rect x="0" y="0" width="100" height="22" fill="url(#snow)" />
                <rect x="60" y="0" width="40" height="35" fill="url(#snow)" opacity="0.6" />
                
                {/* Rivers */}
                <g stroke="#1a3545" strokeWidth="0.5" fill="none" opacity="0.7">
                  <path d="M78 28 Q72 40 74 52 Q72 62 68 72 Q62 82 58 92" />
                  <path d="M32 28 Q36 38 40 48 Q42 55 42 58" />
                  <path d="M10 50 Q18 56 24 65 Q28 75 32 85" />
                </g>
                
                {/* Roads */}
                <g stroke="#3d352a" strokeWidth="0.4" fill="none" strokeDasharray="1.5,0.8" opacity="0.5">
                  <path d="M15 17 Q22 22 28 26" />
                  <path d="M28 26 Q36 40 42 52" />
                  <path d="M42 52 Q62 48 82 28" />
                  <path d="M42 52 Q55 65 65 70 Q78 76 88 78" />
                  <path d="M42 52 Q36 68 30 82" />
                  <path d="M42 52 Q28 50 8 48" />
                  <path d="M45 12 Q44 32 42 52" />
                </g>
                
                {/* Hold Names */}
                {showHolds && (
                  <g fontFamily="serif" fontStyle="italic" opacity="0.35" fontSize="2.3">
                    <text x="12" y="14" fill="#8B7355">HAAFINGAR</text>
                    <text x="8" y="40" fill="#8B7355">THE REACH</text>
                    <text x="38" y="38" fill="#8B7355">WHITERUN</text>
                    <text x="45" y="16" fill="#8B7355">THE PALE</text>
                    <text x="75" y="32" fill="#8B7355">EASTMARCH</text>
                    <text x="78" y="68" fill="#8B7355">THE RIFT</text>
                    <text x="28" y="75" fill="#8B7355">FALKREATH</text>
                    <text x="25" y="22" fill="#8B7355">HJAALMARCH</text>
                    <text x="68" y="16" fill="#8B7355">WINTERHOLD</text>
                  </g>
                )}
                
                {/* Compass Rose */}
                <g transform="translate(92,92)">
                  <circle cx="0" cy="0" r="5" fill="#1a1510" stroke="#8B7355" strokeWidth="0.3" />
                  <path d="M0 -4 L0.8 0 L0 4 L-0.8 0 Z" fill="#d4a44a" />
                  <path d="M-4 0 L0 0.8 L4 0 L0 -0.8 Z" fill="#8B7355" opacity="0.7" />
                  <text x="0" y="-5.5" textAnchor="middle" fill="#d4a44a" fontSize="1.8" fontWeight="bold">N</text>
                </g>
                
                {/* Title Card */}
                <g transform="translate(85,6)">
                  <rect x="-10" y="-3" width="20" height="8" fill="#1a1510" stroke="#8B7355" strokeWidth="0.25" rx="0.5" opacity="0.95" />
                  <text x="0" y="0" textAnchor="middle" fill="#d4a44a" fontSize="3" fontFamily="serif" fontWeight="bold">SKYRIM</text>
                  <text x="0" y="3" textAnchor="middle" fill="#8B7355" fontSize="1.4">Province of Tamriel</text>
                </g>
              </svg>

              {/* Location Markers */}
              {filteredLocations.map(location => {
                const isQuest = questLocations.some(q => findLocationByName(q.name)?.id === location.id);
                const isCurrent = currentLocationObj?.id === location.id;
                const isVisited = visitedLocations.some(v => findLocationByName(v)?.id === location.id);
                const isLocked = location.levelRequirement && location.levelRequirement > playerLevel;
                const clearedData = clearedDungeons.find(d => d.dungeonId.includes(location.id));
                
                return (
                  <div
                    key={location.id}
                    className={`absolute cursor-pointer transition-all duration-200 hover:scale-125 ${
                      isCurrent ? 'z-30' : isQuest ? 'z-20' : 'z-10'
                    } ${isLocked ? 'opacity-50' : ''}`}
                    style={{ left: `${location.x}%`, top: `${location.y}%`, transform: 'translate(-50%, -50%)' }}
                    onClick={() => { setSelectedLocation(location); setActivePanel('location'); }}
                    title={isLocked ? `${location.name} (Requires Level ${location.levelRequirement})` : location.name}
                  >
                    <div className={`relative ${isCurrent ? 'drop-shadow-[0_0_12px_rgba(34,197,94,0.9)] animate-pulse' : 'drop-shadow-md'}`}>
                      {getMarkerIcon(location, isCurrent)}
                      {isCurrent && <div className="absolute -inset-2 rounded-full border-2 border-green-400 animate-ping opacity-40" />}
                      {isQuest && !isCurrent && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-bounce" />}
                      {clearedData && clearedData.clearCount > 0 && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-[8px] text-white font-bold">{clearedData.clearCount}</span>
                        </div>
                      )}
                      {isLocked && (
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-900 rounded-full flex items-center justify-center">
                          <Lock size={8} className="text-red-400" />
                        </div>
                      )}
                    </div>
                    {showLabels && (location.type === 'city' || isCurrent || isVisited) && !isLocked && (
                      <span className={`absolute left-full ml-1 text-[9px] whitespace-nowrap font-medium px-1 rounded ${
                        isCurrent ? 'text-green-400 bg-black/80' : isVisited ? 'text-blue-300 bg-black/70' : 'text-stone-300 bg-black/60'
                      }`}>
                        {location.name}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Event Markers */}
              {showEvents && mapEvents.map(event => {
                const isLocked = event.levelRequirement > playerLevel;
                return (
                  <div
                    key={event.id}
                    className={`absolute cursor-pointer transition-all duration-200 hover:scale-150 z-25 ${isLocked ? 'opacity-40' : ''}`}
                    style={{ left: `${event.x}%`, top: `${event.y}%`, transform: 'translate(-50%, -50%)' }}
                    onClick={() => { setSelectedEvent(event); setActivePanel('event'); }}
                    title={event.name}
                  >
                    <div className="relative drop-shadow-lg">
                      <div className="w-6 h-6 rounded-full bg-red-900/80 border-2 border-red-500 flex items-center justify-center animate-pulse">
                        {getEventIcon(event)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Mission Markers */}
              {showMissions && availableMissions.map(mission => {
                const isLocked = mission.levelRequirement > playerLevel;
                return (
                  <div
                    key={mission.id}
                    className={`absolute cursor-pointer transition-all duration-200 hover:scale-150 z-24 ${isLocked ? 'opacity-40' : ''}`}
                    style={{ left: `${mission.x}%`, top: `${mission.y}%`, transform: 'translate(-50%, -50%)' }}
                    onClick={() => { setSelectedMission(mission); setActivePanel('mission'); }}
                    title={mission.name}
                  >
                    <div className="relative drop-shadow-lg">
                      <div className="w-7 h-7 rounded bg-blue-900/80 border-2 border-blue-400 flex items-center justify-center">
                        <Target size={14} className="text-blue-300" />
                      </div>
                      {mission.timeLimit && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-600 rounded-full flex items-center justify-center">
                          <Clock size={8} className="text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Zoom indicator */}
          <div className="absolute bottom-4 left-4 bg-black/70 rounded px-2 py-1 text-xs text-stone-400">
            Zoom: {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-stone-900/95 border-l border-amber-900/30 flex flex-col overflow-hidden">
          {/* Panel Tabs */}
          <div className="flex border-b border-stone-700">
            <button 
              onClick={() => setActivePanel('legend')} 
              className={`flex-1 px-3 py-2 text-xs font-medium ${activePanel === 'legend' ? 'bg-stone-800 text-amber-400' : 'text-stone-500 hover:text-stone-300'}`}
            >
              Legend
            </button>
            <button 
              onClick={() => setActivePanel('location')} 
              className={`flex-1 px-3 py-2 text-xs font-medium ${activePanel === 'location' ? 'bg-stone-800 text-amber-400' : 'text-stone-500 hover:text-stone-300'}`}
            >
              Location
            </button>
            <button 
              onClick={() => setActivePanel('mission')} 
              className={`flex-1 px-3 py-2 text-xs font-medium ${activePanel === 'mission' ? 'bg-stone-800 text-blue-400' : 'text-stone-500 hover:text-stone-300'}`}
            >
              Missions
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Legend Panel */}
            {activePanel === 'legend' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                    <Compass size={14} /> Map Legend
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2"><Castle size={14} color="#22c55e" fill="#22c55e" /><span className="text-green-400">Current Location</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 rounded-full" /><span className="text-yellow-400">Quest Objective</span></div>
                    <div className="flex items-center gap-2"><Castle size={14} color="#3b82f6" /><span className="text-blue-400">Visited</span></div>
                    <div className="flex items-center gap-2"><Lock size={14} color="#6b7280" /><span className="text-stone-400">Level Locked</span></div>
                    <div className="border-t border-stone-700 my-2" />
                    <div className="flex items-center gap-2"><Castle size={14} color="#d4a44a" /><span className="text-stone-300">City</span></div>
                    <div className="flex items-center gap-2"><Home size={14} color="#8b7355" /><span className="text-stone-300">Town/Village</span></div>
                    <div className="flex items-center gap-2"><Skull size={14} color="#dc2626" /><span className="text-stone-300">Dungeon</span></div>
                    <div className="flex items-center gap-2"><Mountain size={14} color="#a855f7" /><span className="text-stone-300">Landmark</span></div>
                    <div className="flex items-center gap-2"><Shield size={14} color="#64748b" /><span className="text-stone-300">Fort/Camp</span></div>
                    <div className="border-t border-stone-700 my-2" />
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-900/80 border border-red-500 flex items-center justify-center"><AlertTriangle size={10} className="text-red-400" /></div><span className="text-red-400">Active Event</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-900/80 border border-blue-400 flex items-center justify-center"><Target size={10} className="text-blue-300" /></div><span className="text-blue-400">Mission</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-amber-400 mb-2">Danger Levels</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-green-400">Safe</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-yellow-400">Moderate</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-orange-400">Dangerous</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-red-400">Deadly</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500" /><span className="text-purple-400">Legendary</span></div>
                  </div>
                </div>

                <div className="text-xs text-stone-500 border-t border-stone-700 pt-3">
                  <p className="mb-1">🖱️ Drag to pan the map</p>
                  <p className="mb-1">🔍 Scroll to zoom in/out</p>
                  <p>👆 Click markers for details</p>
                </div>
              </div>
            )}

            {/* Location Details Panel */}
            {activePanel === 'location' && selectedLocation && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getMarkerIcon(selectedLocation, currentLocationObj?.id === selectedLocation.id)}
                    <div>
                      <h3 className="text-lg font-serif font-bold text-amber-400">{selectedLocation.name}</h3>
                      <p className="text-xs text-stone-500 uppercase">{selectedLocation.type} {selectedLocation.hold && `• ${selectedLocation.hold}`}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedLocation(null)} className="text-stone-500 hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                {/* Level Requirement */}
                {selectedLocation.levelRequirement && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded border ${
                    selectedLocation.levelRequirement <= playerLevel 
                      ? 'bg-green-900/30 border-green-700/50' 
                      : 'bg-red-900/30 border-red-700/50'
                  }`}>
                    {selectedLocation.levelRequirement <= playerLevel ? (
                      <Unlock size={16} className="text-green-400" />
                    ) : (
                      <Lock size={16} className="text-red-400" />
                    )}
                    <span className="text-sm">
                      Level {selectedLocation.levelRequirement} Required
                      {selectedLocation.levelRequirement > playerLevel && (
                        <span className="text-red-400 ml-1">(+{selectedLocation.levelRequirement - playerLevel} levels needed)</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Description */}
                {selectedLocation.description && (
                  <p className="text-sm text-stone-300 italic leading-relaxed">"{selectedLocation.description}"</p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-3 text-xs">
                  {selectedLocation.dangerLevel && (
                    <div className={`px-2 py-1 rounded border ${getDangerBgColor(selectedLocation.dangerLevel)}`}>
                      <span className="text-stone-400">Danger: </span>
                      <span className={getDangerColor(selectedLocation.dangerLevel)}>{selectedLocation.dangerLevel}</span>
                    </div>
                  )}
                  {selectedLocation.faction && (
                    <div className="px-2 py-1 rounded bg-stone-800 border border-stone-700">
                      <span className="text-stone-400">Faction: </span>
                      <span className={
                        selectedLocation.faction === 'Imperial' ? 'text-red-400' : 
                        selectedLocation.faction === 'Stormcloak' ? 'text-blue-400' : 'text-stone-300'
                      }>{selectedLocation.faction}</span>
                    </div>
                  )}
                </div>

                {/* Rewards */}
                {selectedLocation.rewards && (
                  <div className="bg-stone-800/50 rounded p-3 border border-stone-700">
                    <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1">
                      <Award size={12} /> Potential Rewards
                    </h4>
                    <div className="space-y-1 text-xs">
                      {selectedLocation.rewards.gold && (
                        <div className="flex items-center gap-2">
                          <Coins size={12} className="text-yellow-500" />
                          <span className="text-stone-300">{selectedLocation.rewards.gold.min}-{selectedLocation.rewards.gold.max} Gold</span>
                        </div>
                      )}
                      {selectedLocation.rewards.xp && (
                        <div className="flex items-center gap-2">
                          <Star size={12} className="text-blue-400" />
                          <span className="text-stone-300">{selectedLocation.rewards.xp.min}-{selectedLocation.rewards.xp.max} XP</span>
                        </div>
                      )}
                      {selectedLocation.rewards.items && selectedLocation.rewards.items.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Sparkles size={12} className="text-purple-400 mt-0.5" />
                          <span className="text-stone-300">{selectedLocation.rewards.items.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rumors */}
                {selectedLocation.rumors && selectedLocation.rumors.length > 0 && (
                  <div className="border-t border-stone-700 pt-3">
                    <h4 className="text-xs font-bold text-amber-400 mb-2">📜 Rumors & Knowledge</h4>
                    <ul className="space-y-2">
                      {selectedLocation.rumors.map((rumor, idx) => (
                        <li key={idx} className="text-xs text-stone-400 flex items-start gap-2">
                          <span className="text-amber-600">•</span>
                          <span className="italic">"{rumor}"</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Status Tags */}
                <div className="flex flex-wrap gap-2">
                  {currentLocationObj?.id === selectedLocation.id && (
                    <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded flex items-center gap-1">
                      <MapPin size={10} /> You are here
                    </span>
                  )}
                  {visitedLocations.some(v => findLocationByName(v)?.id === selectedLocation.id) && (
                    <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-1 rounded">✓ Visited</span>
                  )}
                  {questLocations.find(q => findLocationByName(q.name)?.id === selectedLocation.id) && (
                    <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded">
                      ⚔️ {questLocations.find(q => findLocationByName(q.name)?.id === selectedLocation.id)?.questName}
                    </span>
                  )}
                </div>

                {/* Enter Dungeon Button */}
                {(selectedLocation.type === 'dungeon' || selectedLocation.type === 'cave' || selectedLocation.type === 'ruin' || selectedLocation.type === 'fort' || selectedLocation.type === 'camp') && (
                  <div className="pt-2">
                    {selectedLocation.levelRequirement && selectedLocation.levelRequirement > playerLevel ? (
                      <button disabled className="w-full py-2 rounded bg-stone-800 text-stone-500 text-sm cursor-not-allowed">
                        <Lock size={14} className="inline mr-2" />
                        Requires Level {selectedLocation.levelRequirement}
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          if (onEnterDungeon) {
                            onEnterDungeon(selectedLocation.name);
                          }
                        }}
                        className="w-full py-2 rounded bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white text-sm font-bold transition-colors"
                      >
                        <Swords size={14} className="inline mr-2" />
                        Enter {selectedLocation.type === 'cave' ? 'Cave' : selectedLocation.type === 'fort' ? 'Fort' : 'Dungeon'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Event Panel */}
            {activePanel === 'event' && selectedEvent && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-900/80 border-2 border-red-500 flex items-center justify-center">
                      {getEventIcon(selectedEvent)}
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-red-400">{selectedEvent.name}</h3>
                      <p className="text-xs text-stone-500 uppercase">{selectedEvent.type} Event</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedEvent(null)} className="text-stone-500 hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                <p className="text-sm text-stone-300">{selectedEvent.description}</p>

                {selectedEvent.expiresAt && (
                  <div className="flex items-center gap-2 text-xs text-orange-400">
                    <Clock size={12} />
                    <span>Expires in {Math.round((selectedEvent.expiresAt - Date.now()) / 3600000)}h</span>
                  </div>
                )}

                {/* Event Rewards */}
                <div className="bg-stone-800/50 rounded p-3 border border-stone-700">
                  <h4 className="text-xs font-bold text-amber-400 mb-2">Rewards</h4>
                  <div className="space-y-1 text-xs">
                    {selectedEvent.rewards.gold && selectedEvent.rewards.gold.max > 0 && (
                      <div className="flex items-center gap-2">
                        <Coins size={12} className="text-yellow-500" />
                        <span>{selectedEvent.rewards.gold.min}-{selectedEvent.rewards.gold.max} Gold</span>
                      </div>
                    )}
                    {selectedEvent.rewards.xp && (
                      <div className="flex items-center gap-2">
                        <Star size={12} className="text-blue-400" />
                        <span>{selectedEvent.rewards.xp.min}-{selectedEvent.rewards.xp.max} XP</span>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (selectedEvent.levelRequirement > playerLevel) {
                      showToast?.(`Requires Level ${selectedEvent.levelRequirement}`, 'warning');
                      return;
                    }
                    onStartEvent?.(selectedEvent);
                  }}
                  disabled={selectedEvent.levelRequirement > playerLevel}
                  className={`w-full py-2 rounded text-sm font-bold transition-colors ${
                    selectedEvent.levelRequirement > playerLevel 
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-900 to-orange-800 hover:from-red-800 hover:to-orange-700 text-white'
                  }`}
                >
                  {selectedEvent.levelRequirement > playerLevel ? (
                    <>
                      <Lock size={14} className="inline mr-2" />
                      Requires Level {selectedEvent.levelRequirement}
                    </>
                  ) : (
                    <>
                      <ChevronRight size={14} className="inline mr-1" />
                      Investigate Event
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Missions Panel */}
            {activePanel === 'mission' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <Target size={14} /> Available Missions
                </h3>
                
                {selectedMission ? (
                  <div className="space-y-3">
                    <button onClick={() => setSelectedMission(null)} className="text-xs text-stone-500 hover:text-white flex items-center gap-1">
                      ← Back to list
                    </button>
                    
                    <div className="bg-stone-800/50 rounded p-3 border border-blue-900/50">
                      <h4 className="text-lg font-bold text-blue-300">{selectedMission.name}</h4>
                      <p className="text-sm text-stone-300 mt-2">{selectedMission.objective}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className={`text-xs px-2 py-1 rounded ${getDangerBgColor(selectedMission.difficulty)}`}>
                          <span className={getDangerColor(selectedMission.difficulty)}>{selectedMission.difficulty}</span>
                        </span>
                        {selectedMission.timeLimit && (
                          <span className="text-xs bg-orange-900/40 text-orange-400 px-2 py-1 rounded flex items-center gap-1">
                            <Clock size={10} /> {selectedMission.timeLimit}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-stone-700">
                        <h5 className="text-xs font-bold text-amber-400 mb-2">Rewards</h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <Coins size={12} className="text-yellow-500" />
                            <span>{selectedMission.rewards.gold.min}-{selectedMission.rewards.gold.max} Gold</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star size={12} className="text-blue-400" />
                            <span>{selectedMission.rewards.xp.min}-{selectedMission.rewards.xp.max} XP</span>
                          </div>
                          {selectedMission.rewards.items && (
                            <div className="flex items-center gap-2">
                              <Sparkles size={12} className="text-purple-400" />
                              <span>{selectedMission.rewards.items.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => onStartMission?.(selectedMission)}
                        disabled={selectedMission.levelRequirement > playerLevel}
                        className={`w-full mt-4 py-2 rounded text-sm font-bold ${
                          selectedMission.levelRequirement > playerLevel
                            ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white'
                        }`}
                      >
                        {selectedMission.levelRequirement > playerLevel ? (
                          <>Requires Level {selectedMission.levelRequirement}</>
                        ) : (
                          <>Accept Mission</>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableMissions.length === 0 ? (
                      <p className="text-sm text-stone-500 text-center py-4">No missions available at your level</p>
                    ) : (
                      availableMissions.map(mission => (
                        <button
                          key={mission.id}
                          onClick={() => setSelectedMission(mission)}
                          className="w-full p-3 rounded bg-stone-800/50 border border-stone-700 hover:border-blue-700/50 text-left transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-blue-300">{mission.name}</span>
                            <span className={`text-xs ${getDangerColor(mission.difficulty)}`}>{mission.difficulty}</span>
                          </div>
                          <p className="text-xs text-stone-400 truncate">{mission.objective}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                            <span>Lvl {mission.levelRequirement}+</span>
                            {mission.timeLimit && <span className="flex items-center gap-1"><Clock size={10} /> {mission.timeLimit}</span>}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {activePanel === 'location' && !selectedLocation && (
              <div className="text-center py-8 text-stone-500">
                <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click a location on the map to view details</p>
              </div>
            )}
            {activePanel === 'event' && !selectedEvent && (
              <div className="text-center py-8 text-stone-500">
                <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click an event marker to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
