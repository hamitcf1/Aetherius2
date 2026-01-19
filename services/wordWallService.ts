/**
 * Word Wall Service
 * 
 * Manages Word Wall locations throughout Skyrim and the discovery/learning process.
 * Word Walls are ancient Nordic structures containing Words of Power for dragon shouts.
 */

import { ShoutState, learnShoutWord, SHOUTS } from './shoutsService';

// Word Wall definition
export interface WordWall {
  id: string;
  shoutId: string;
  wordIndex: number; // 0, 1, or 2 for Fus, Ro, Dah
  location: string;
  dungeon?: string;
  hold: string;
  description: string;
  guardedBy?: string; // What guards this word wall
  coordinates: { x: number; y: number }; // Map position
  nearbyLandmarks: string[];
}

export interface WordWallState {
  discoveredWalls: string[]; // Word wall IDs
  learnedWords: Array<{ shoutId: string; wordIndex: number; learnedAt: string }>;
}

// All Word Walls in Skyrim
export const WORD_WALLS: Record<string, WordWall> = {
  // Unrelenting Force
  'bleak_falls_fus': {
    id: 'bleak_falls_fus',
    shoutId: 'unrelenting_force',
    wordIndex: 0,
    location: 'Bleak Falls Barrow',
    dungeon: 'bleak_falls_barrow',
    hold: 'Whiterun Hold',
    description: 'Deep within Bleak Falls Barrow, past the draugr and the puzzle door, lies a wall inscribed with the word FUS.',
    guardedBy: 'Draugr Overlord',
    coordinates: { x: 45, y: 52 },
    nearbyLandmarks: ['Riverwood', 'Whiterun']
  },
  'high_hrothgar_ro': {
    id: 'high_hrothgar_ro',
    shoutId: 'unrelenting_force',
    wordIndex: 1,
    location: 'High Hrothgar',
    hold: 'Whiterun Hold',
    description: 'The Greybeards teach the second word of Unrelenting Force at High Hrothgar.',
    coordinates: { x: 55, y: 65 },
    nearbyLandmarks: ['Ivarstead', 'The Throat of the World']
  },
  'high_hrothgar_dah': {
    id: 'high_hrothgar_dah',
    shoutId: 'unrelenting_force',
    wordIndex: 2,
    location: 'High Hrothgar',
    hold: 'Whiterun Hold',
    description: 'The Greybeards teach the final word of Unrelenting Force at High Hrothgar.',
    coordinates: { x: 55, y: 65 },
    nearbyLandmarks: ['Ivarstead', 'The Throat of the World']
  },

  // Fire Breath
  'dustmans_cairn_yol': {
    id: 'dustmans_cairn_yol',
    shoutId: 'fire_breath',
    wordIndex: 0,
    location: "Dustman's Cairn",
    dungeon: 'dustmans_cairn',
    hold: 'Whiterun Hold',
    description: 'In the depths of Dustman\'s Cairn, where the Companions seek fragments of Wuuthrad.',
    guardedBy: 'Draugr and Silver Hand',
    coordinates: { x: 40, y: 48 },
    nearbyLandmarks: ['Whiterun', 'Hamvir\'s Rest']
  },
  'sunderstone_gorge_toor': {
    id: 'sunderstone_gorge_toor',
    shoutId: 'fire_breath',
    wordIndex: 1,
    location: 'Sunderstone Gorge',
    dungeon: 'sunderstone_gorge',
    hold: 'Falkreath Hold',
    description: 'A volcanic cave system housing warlocks and a word of fire.',
    guardedBy: 'Fire Mages',
    coordinates: { x: 35, y: 58 },
    nearbyLandmarks: ['Falkreath', 'Helgen']
  },
  'throat_of_world_shul': {
    id: 'throat_of_world_shul',
    shoutId: 'fire_breath',
    wordIndex: 2,
    location: 'Throat of the World',
    hold: 'Whiterun Hold',
    description: 'At the peak of the highest mountain, Paarthurnax guards ancient knowledge.',
    guardedBy: 'Paarthurnax (teaches)',
    coordinates: { x: 55, y: 70 },
    nearbyLandmarks: ['High Hrothgar']
  },

  // Frost Breath
  'bonestrewn_crest_fo': {
    id: 'bonestrewn_crest_fo',
    shoutId: 'frost_breath',
    wordIndex: 0,
    location: 'Bonestrewn Crest',
    hold: 'Eastmarch',
    description: 'A dragon lair among ancient bones, where the first word of frost lies.',
    guardedBy: 'Dragon',
    coordinates: { x: 72, y: 42 },
    nearbyLandmarks: ['Windhelm', 'Kynesgrove']
  },
  'folgunthur_krah': {
    id: 'folgunthur_krah',
    shoutId: 'frost_breath',
    wordIndex: 1,
    location: 'Folgunthur',
    dungeon: 'folgunthur',
    hold: 'Hjaalmarch',
    description: 'An ancient Nordic tomb containing a piece of the Gauldur Amulet.',
    guardedBy: 'Mikrul Gauldurson',
    coordinates: { x: 38, y: 35 },
    nearbyLandmarks: ['Solitude', 'Morthal']
  },
  'skyborn_altar_diin': {
    id: 'skyborn_altar_diin',
    shoutId: 'frost_breath',
    wordIndex: 2,
    location: 'Skyborn Altar',
    hold: 'Hjaalmarch',
    description: 'A dragon roost high in the mountains, icy winds howl here.',
    guardedBy: 'Dragon',
    coordinates: { x: 42, y: 30 },
    nearbyLandmarks: ['Morthal', 'Dragon Bridge']
  },

  // Whirlwind Sprint
  'dead_mens_respite_wuld': {
    id: 'dead_mens_respite_wuld',
    shoutId: 'whirlwind_sprint',
    wordIndex: 0,
    location: "Dead Men's Respite",
    dungeon: 'dead_mens_respite',
    hold: 'Hjaalmarch',
    description: 'A haunted barrow where King Olaf\'s verse lies hidden.',
    guardedBy: 'Draugr and Ghosts',
    coordinates: { x: 35, y: 32 },
    nearbyLandmarks: ['Morthal', 'Solitude']
  },
  'high_hrothgar_nah': {
    id: 'high_hrothgar_nah',
    shoutId: 'whirlwind_sprint',
    wordIndex: 1,
    location: 'High Hrothgar',
    hold: 'Whiterun Hold',
    description: 'The Greybeards teach this word as part of their training.',
    coordinates: { x: 55, y: 65 },
    nearbyLandmarks: ['Ivarstead']
  },
  'volskygge_kest': {
    id: 'volskygge_kest',
    shoutId: 'whirlwind_sprint',
    wordIndex: 2,
    location: 'Volskygge',
    dungeon: 'volskygge',
    hold: 'Haafingar',
    description: 'An ancient ruin where a dragon priest slumbers.',
    guardedBy: 'Volsung (Dragon Priest)',
    coordinates: { x: 18, y: 25 },
    nearbyLandmarks: ['Solitude', 'Deepwood Redoubt']
  },

  // Become Ethereal
  'ironbind_barrow_feim': {
    id: 'ironbind_barrow_feim',
    shoutId: 'become_ethereal',
    wordIndex: 0,
    location: 'Ironbind Barrow',
    dungeon: 'ironbind_barrow',
    hold: 'Winterhold',
    description: 'A barrow where treasure hunters meet their doom.',
    guardedBy: 'Warlord Gathrik',
    coordinates: { x: 68, y: 22 },
    nearbyLandmarks: ['Winterhold']
  },
  'lost_valley_redoubt_zii': {
    id: 'lost_valley_redoubt_zii',
    shoutId: 'become_ethereal',
    wordIndex: 1,
    location: 'Lost Valley Redoubt',
    dungeon: 'lost_valley_redoubt',
    hold: 'The Reach',
    description: 'A massive Forsworn stronghold built into the mountains.',
    guardedBy: 'Forsworn',
    coordinates: { x: 22, y: 58 },
    nearbyLandmarks: ['Markarth']
  },
  'ustengrav_gron': {
    id: 'ustengrav_gron',
    shoutId: 'become_ethereal',
    wordIndex: 2,
    location: 'Ustengrav',
    dungeon: 'ustengrav',
    hold: 'Hjaalmarch',
    description: 'An ancient temple where the Horn of Jurgen Windcaller rested.',
    guardedBy: 'Draugr, Necromancers',
    coordinates: { x: 42, y: 28 },
    nearbyLandmarks: ['Morthal']
  },

  // Clear Skies
  'throat_lok': {
    id: 'throat_lok',
    shoutId: 'clear_skies',
    wordIndex: 0,
    location: 'Throat of the World',
    hold: 'Whiterun Hold',
    description: 'Paarthurnax teaches this word to clear the mists.',
    coordinates: { x: 55, y: 70 },
    nearbyLandmarks: ['High Hrothgar']
  },
  'throat_vah': {
    id: 'throat_vah',
    shoutId: 'clear_skies',
    wordIndex: 1,
    location: 'Throat of the World',
    hold: 'Whiterun Hold',
    description: 'The second word to part the clouds.',
    coordinates: { x: 55, y: 70 },
    nearbyLandmarks: ['High Hrothgar']
  },
  'throat_koor': {
    id: 'throat_koor',
    shoutId: 'clear_skies',
    wordIndex: 2,
    location: 'Throat of the World',
    hold: 'Whiterun Hold',
    description: 'The final word to command the skies.',
    coordinates: { x: 55, y: 70 },
    nearbyLandmarks: ['High Hrothgar']
  },

  // Marked for Death
  'autumnwatch_krii': {
    id: 'autumnwatch_krii',
    shoutId: 'marked_for_death',
    wordIndex: 0,
    location: 'Autumnwatch Tower',
    hold: 'The Rift',
    description: 'A dragon roost overlooking the autumn forests.',
    guardedBy: 'Dragon',
    coordinates: { x: 65, y: 72 },
    nearbyLandmarks: ['Riften', 'Ivarstead']
  },
  'dark_brotherhood_lun': {
    id: 'dark_brotherhood_lun',
    shoutId: 'marked_for_death',
    wordIndex: 1,
    location: 'Dark Brotherhood Sanctuary',
    dungeon: 'dark_brotherhood_sanctuary',
    hold: 'Falkreath Hold',
    description: 'Hidden in the sanctuary of assassins.',
    coordinates: { x: 38, y: 68 },
    nearbyLandmarks: ['Falkreath']
  },
  'forsaken_cave_aus': {
    id: 'forsaken_cave_aus',
    shoutId: 'marked_for_death',
    wordIndex: 2,
    location: 'Forsaken Cave',
    dungeon: 'forsaken_cave',
    hold: 'The Pale',
    description: 'A frozen cave containing the White Phial.',
    guardedBy: 'Curalmil (Draugr Boss)',
    coordinates: { x: 52, y: 18 },
    nearbyLandmarks: ['Dawnstar']
  },

  // Aura Whisper
  'northwind_laas': {
    id: 'northwind_laas',
    shoutId: 'aura_whisper',
    wordIndex: 0,
    location: 'Northwind Summit',
    hold: 'The Rift',
    description: 'A dragon roost in the northern mountains.',
    guardedBy: 'Dragon',
    coordinates: { x: 58, y: 60 },
    nearbyLandmarks: ['Shor\'s Stone', 'Riften']
  },
  'valthume_yah': {
    id: 'valthume_yah',
    shoutId: 'aura_whisper',
    wordIndex: 1,
    location: 'Valthume',
    dungeon: 'valthume',
    hold: 'The Reach',
    description: 'A Nordic tomb containing a dragon priest.',
    guardedBy: 'Hevnoraak (Dragon Priest)',
    coordinates: { x: 25, y: 70 },
    nearbyLandmarks: ['Markarth']
  },
  'volunruud_nir': {
    id: 'volunruud_nir',
    shoutId: 'aura_whisper',
    wordIndex: 2,
    location: 'Volunruud',
    dungeon: 'volunruud',
    hold: 'Whiterun Hold',
    description: 'A tomb where the Dark Brotherhood seeks ancient knowledge.',
    guardedBy: 'Kvenel the Tongue',
    coordinates: { x: 48, y: 35 },
    nearbyLandmarks: ['Whiterun']
  },

  // Storm Call
  'forelhost_strun': {
    id: 'forelhost_strun',
    shoutId: 'storm_call',
    wordIndex: 0,
    location: 'Forelhost',
    dungeon: 'forelhost',
    hold: 'The Rift',
    description: 'An ancient Dragon Cult stronghold high in the mountains.',
    guardedBy: 'Rahgot (Dragon Priest)',
    coordinates: { x: 78, y: 75 },
    nearbyLandmarks: ['Riften']
  },
  'high_gate_ruins_bah': {
    id: 'high_gate_ruins_bah',
    shoutId: 'storm_call',
    wordIndex: 1,
    location: 'High Gate Ruins',
    dungeon: 'high_gate_ruins',
    hold: 'The Pale',
    description: 'A ruined fort where a dragon priest lurks.',
    guardedBy: 'Vokun (Dragon Priest)',
    coordinates: { x: 42, y: 15 },
    nearbyLandmarks: ['Dawnstar', 'Solitude']
  },
  'skuldafn_qo': {
    id: 'skuldafn_qo',
    shoutId: 'storm_call',
    wordIndex: 2,
    location: 'Skuldafn',
    dungeon: 'skuldafn',
    hold: 'Eastmarch',
    description: 'The temple where Alduin guards the portal to Sovngarde.',
    guardedBy: 'Nahkriin (Dragon Priest)',
    coordinates: { x: 85, y: 50 },
    nearbyLandmarks: ['Sovngarde Portal']
  },

  // Slow Time
  'hags_end_tiid': {
    id: 'hags_end_tiid',
    shoutId: 'slow_time',
    wordIndex: 0,
    location: "Hag's End",
    dungeon: 'hags_end',
    hold: 'Haafingar',
    description: 'The lair of a hagraven coven at Deepwood Redoubt.',
    guardedBy: 'Hagravens',
    coordinates: { x: 20, y: 28 },
    nearbyLandmarks: ['Solitude']
  },
  'korvanjund_klo': {
    id: 'korvanjund_klo',
    shoutId: 'slow_time',
    wordIndex: 1,
    location: 'Korvanjund',
    dungeon: 'korvanjund',
    hold: 'Whiterun Hold',
    description: 'A Nordic ruin central to the Civil War.',
    guardedBy: 'Draugr',
    coordinates: { x: 50, y: 28 },
    nearbyLandmarks: ['Whiterun']
  },
  'labyrinthian_ul': {
    id: 'labyrinthian_ul',
    shoutId: 'slow_time',
    wordIndex: 2,
    location: 'Labyrinthian',
    dungeon: 'labyrinthian',
    hold: 'Hjaalmarch',
    description: 'An ancient Nordic city where Morokei slumbers.',
    guardedBy: 'Morokei (Dragon Priest)',
    coordinates: { x: 45, y: 22 },
    nearbyLandmarks: ['Morthal', 'Whiterun']
  },

  // Call Dragon
  'throat_od': {
    id: 'throat_od',
    shoutId: 'call_dragon',
    wordIndex: 0,
    location: 'Throat of the World',
    hold: 'Whiterun Hold',
    description: 'Learned from Paarthurnax after defeating Alduin.',
    coordinates: { x: 55, y: 70 },
    nearbyLandmarks: ['High Hrothgar']
  },
  'throat_ah': {
    id: 'throat_ah',
    shoutId: 'call_dragon',
    wordIndex: 1,
    location: 'Throat of the World',
    hold: 'Whiterun Hold',
    description: 'The second word to summon a dragon.',
    coordinates: { x: 55, y: 70 },
    nearbyLandmarks: ['High Hrothgar']
  },
  'throat_viing': {
    id: 'throat_viing',
    shoutId: 'call_dragon',
    wordIndex: 2,
    location: 'Throat of the World',
    hold: 'Whiterun Hold',
    description: 'The final word that calls Odahviing.',
    coordinates: { x: 55, y: 70 },
    nearbyLandmarks: ['High Hrothgar']
  },

  // Dragonrend
  'sovngarde_joor': {
    id: 'sovngarde_joor',
    shoutId: 'dragonrend',
    wordIndex: 0,
    location: 'Sovngarde (Time Wound)',
    hold: 'Sovngarde',
    description: 'Learned by witnessing the ancient Tongues battle Alduin through the Elder Scroll.',
    coordinates: { x: 55, y: 70 },
    nearbyLandmarks: ['Throat of the World']
  },
  'sovngarde_zah': {
    id: 'sovngarde_zah',
    shoutId: 'dragonrend',
    wordIndex: 1,
    location: 'Sovngarde (Time Wound)',
    hold: 'Sovngarde',
    description: 'The word that strikes fear into immortal hearts.',
    coordinates: { x: 55, y: 70 },
    nearbyLandmarks: ['Throat of the World']
  },
  'sovngarde_frul': {
    id: 'sovngarde_frul',
    shoutId: 'dragonrend',
    wordIndex: 2,
    location: 'Sovngarde (Time Wound)',
    hold: 'Sovngarde',
    description: 'The final word that forces dragons to land.',
    coordinates: { x: 55, y: 70 },
    nearbyLandmarks: ['Throat of the World']
  }
};

// Initialize word wall state
export const initializeWordWallState = (): WordWallState => ({
  discoveredWalls: [],
  learnedWords: []
});

// Get word wall state from character
export const getWordWallState = (characterData: unknown): WordWallState => {
  if (!characterData || typeof characterData !== 'object') {
    return initializeWordWallState();
  }
  const data = characterData as any;
  return {
    discoveredWalls: data.discoveredWalls ?? [],
    learnedWords: data.learnedWords ?? []
  };
};

// Discover a word wall
export const discoverWordWall = (
  wordWallState: WordWallState,
  shoutState: ShoutState,
  wallId: string
): { 
  success: boolean; 
  message: string; 
  newWallState: WordWallState; 
  newShoutState: ShoutState;
} => {
  const wall = WORD_WALLS[wallId];
  if (!wall) {
    return { 
      success: false, 
      message: 'Invalid word wall.', 
      newWallState: wordWallState,
      newShoutState: shoutState
    };
  }

  // Check if already discovered
  if (wordWallState.discoveredWalls.includes(wallId)) {
    return { 
      success: false, 
      message: 'You have already discovered this word wall.', 
      newWallState: wordWallState,
      newShoutState: shoutState
    };
  }

  // Get the shout info
  const shout = SHOUTS[wall.shoutId];
  const wordName = shout?.words[wall.wordIndex] || 'Unknown Word';

  // Update word wall state
  const newWallState: WordWallState = {
    discoveredWalls: [...wordWallState.discoveredWalls, wallId],
    learnedWords: [
      ...wordWallState.learnedWords,
      { shoutId: wall.shoutId, wordIndex: wall.wordIndex, learnedAt: new Date().toISOString() }
    ]
  };

  // Learn the word in shout state
  const shoutResult = learnShoutWord(shoutState, wall.shoutId, wall.wordIndex);

  return {
    success: true,
    message: `The ancient word "${wordName.toUpperCase()}" etches itself into your mind. ${shout?.name || ''} word learned!`,
    newWallState,
    newShoutState: shoutResult.newState
  };
};

// Get word walls by hold
export const getWordWallsByHold = (hold: string): WordWall[] => {
  return Object.values(WORD_WALLS).filter(w => w.hold === hold);
};

// Get word walls by shout
export const getWordWallsByShout = (shoutId: string): WordWall[] => {
  return Object.values(WORD_WALLS).filter(w => w.shoutId === shoutId);
};

// Get undiscovered word walls
export const getUndiscoveredWalls = (state: WordWallState): WordWall[] => {
  return Object.values(WORD_WALLS).filter(w => !state.discoveredWalls.includes(w.id));
};

// Get discovered word walls
export const getDiscoveredWalls = (state: WordWallState): WordWall[] => {
  return Object.values(WORD_WALLS).filter(w => state.discoveredWalls.includes(w.id));
};

// Get word walls near a location (by coordinates)
export const getNearbyWordWalls = (
  x: number, 
  y: number, 
  radius: number = 15
): WordWall[] => {
  return Object.values(WORD_WALLS).filter(wall => {
    const dx = wall.coordinates.x - x;
    const dy = wall.coordinates.y - y;
    return Math.sqrt(dx * dx + dy * dy) <= radius;
  });
};

// Get progress for a specific shout
export const getShoutWordWallProgress = (
  state: WordWallState,
  shoutId: string
): { total: number; discovered: number; walls: Array<WordWall & { discovered: boolean }> } => {
  const walls = Object.values(WORD_WALLS)
    .filter(w => w.shoutId === shoutId)
    .map(w => ({
      ...w,
      discovered: state.discoveredWalls.includes(w.id)
    }));

  return {
    total: walls.length,
    discovered: walls.filter(w => w.discovered).length,
    walls
  };
};

export default {
  WORD_WALLS,
  initializeWordWallState,
  getWordWallState,
  discoverWordWall,
  getWordWallsByHold,
  getWordWallsByShout,
  getUndiscoveredWalls,
  getDiscoveredWalls,
  getNearbyWordWalls,
  getShoutWordWallProgress
};
