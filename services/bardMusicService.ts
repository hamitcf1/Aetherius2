/**
 * Bard & Music Service
 * Songs, performances, and tavern entertainment
 */

// ========== TYPES ==========

export type SongType = 
  | 'ballad' | 'drinking_song' | 'war_song' | 'love_song' 
  | 'lullaby' | 'epic' | 'comedy' | 'dirge' | 'hymn';

export type Instrument = 
  | 'lute' | 'drum' | 'flute' | 'voice';

export interface Song {
  id: string;
  name: string;
  type: SongType;
  instruments: Instrument[];
  lyrics: string[];
  description: string;
  faction?: string; // Empire, Stormcloaks, etc.
  location?: string; // Where it's commonly heard
  mood: 'uplifting' | 'melancholy' | 'rousing' | 'peaceful' | 'haunting';
  popularity: number; // 1-100
}

export interface BardPerformance {
  songId: string;
  location: string;
  timestamp: number;
  audienceSize: number;
  tipReceived: number;
  successful: boolean;
}

export interface BardState {
  knownSongs: string[];
  performanceHistory: BardPerformance[];
  totalPerformances: number;
  totalTipsEarned: number;
  favoriteVenue?: string;
  bardSkill: number; // 0-100
  reputation: 'unknown' | 'amateur' | 'local' | 'renowned' | 'legendary';
}

// ========== SONGS DATABASE ==========

export const SONGS: Record<string, Song> = {
  // Drinking Songs
  ragnar_the_red: {
    id: 'ragnar_the_red',
    name: 'Ragnar the Red',
    type: 'drinking_song',
    instruments: ['lute', 'voice'],
    description: 'A rowdy drinking song about a boastful warrior\'s comeuppance.',
    lyrics: [
      'Oh, there once was a hero named Ragnar the Red',
      'Who came riding to Whiterun from old Rorikstead',
      'And the braggart did swagger and brandish his blade',
      'As he told of bold battles and gold he had made',
      '',
      'But then he went quiet, did Ragnar the Red',
      'When he met the shield-maiden Matilda, who said:',
      '"Oh, you talk and you lie and you drink all our mead',
      'Now I think it\'s high time that you lie down and bleed!"',
      '',
      'And so then came clashing and slashing of steel',
      'As the brave lass Matilda charged in, full of zeal',
      'And the braggart named Ragnar was boastful no more',
      'When his ugly red head rolled around on the floor!',
    ],
    mood: 'rousing',
    popularity: 95,
    location: 'Taverns throughout Skyrim',
  },
  the_dragonborn_comes: {
    id: 'the_dragonborn_comes',
    name: 'The Dragonborn Comes',
    type: 'epic',
    instruments: ['lute', 'voice'],
    description: 'An ancient prophecy sung as a stirring ballad.',
    lyrics: [
      'Our hero, our hero, claims a warrior\'s heart',
      'I tell you, I tell you, the Dragonborn comes',
      'With a Voice wielding power of the ancient Nord art',
      'Believe, believe, the Dragonborn comes',
      '',
      'It\'s an end to the evil of all Skyrim\'s foes',
      'Beware, beware, the Dragonborn comes',
      'For the darkness has passed, and the legend yet grows',
      'You\'ll know, you\'ll know, the Dragonborn\'s come',
      '',
      'Dovahkiin, Dovahkiin, naal ok zin los vahriin',
      'Wah dein vokul mahfaeraak ahst vaal!',
      'Ahrk fin norok paal graan fod nust hon zindro zaan',
      'Dovahkiin, fah hin kogaan mu draal!',
    ],
    mood: 'rousing',
    popularity: 100,
  },
  tale_of_tongues: {
    id: 'tale_of_tongues',
    name: 'Tale of the Tongues',
    type: 'epic',
    instruments: ['lute', 'drum', 'voice'],
    description: 'The story of Alduin\'s defeat at the Throat of the World.',
    lyrics: [
      'Alduin\'s wings, they did darken the sky',
      'His roar fury\'s fire, and his scales sharpened scythes',
      'Men ran and they cowered, and they fought and they died',
      'They burned and they bled as they issued their cries',
      '',
      'We need saviors to free us from Alduin\'s rage',
      'Heroes on the field of this new war to wage',
      'And if Alduin wins, man is gone from this world',
      'Lost in the shadow of the black wings unfurled',
      '',
      'But then came the Tongues on that terrible day',
      'Steadfast as winter, they entered the fray',
      'And all heard the music of Alduin\'s doom',
      'The sweet overture of a pain that will bloom',
    ],
    mood: 'haunting',
    popularity: 85,
  },
  
  // War Songs
  age_of_aggression: {
    id: 'age_of_aggression',
    name: 'Age of Aggression',
    type: 'war_song',
    instruments: ['drum', 'lute', 'voice'],
    description: 'A pro-Imperial song celebrating the Empire\'s fight against the Stormcloaks.',
    faction: 'empire',
    lyrics: [
      'We drink to our youth, to days come and gone',
      'For the Age of Aggression is just about done',
      'We\'ll drive out the Stormcloaks and restore what we own',
      'With our blood and our steel we will take back our home',
      '',
      'Down with Ulfric! The killer of kings!',
      'On the day of your death we will drink and we\'ll sing',
      'We\'re the children of Skyrim, and we fight all our lives',
      'And when Sovngarde beckons, every one of us dies!',
      '',
      'But this land is ours and we\'ll see it wiped clean',
      'Of the scourge that has sullied our hopes and our dreams!',
    ],
    mood: 'rousing',
    popularity: 80,
    location: 'Imperial-controlled holds',
  },
  age_of_oppression: {
    id: 'age_of_oppression',
    name: 'Age of Oppression',
    type: 'war_song',
    instruments: ['drum', 'lute', 'voice'],
    description: 'A pro-Stormcloak song rallying against Imperial rule.',
    faction: 'stormcloaks',
    lyrics: [
      'We drink to our youth, to the days come and gone',
      'For the Age of Oppression is now nearly done',
      'We\'ll drive out the Empire from this land that we own',
      'With our blood and our steel we will take back our home',
      '',
      'All hail to Ulfric! You are the High King!',
      'In your great honor we drink and we sing',
      'We\'re the children of Skyrim, and we fight all our lives',
      'And when Sovngarde beckons, every one of us dies!',
      '',
      'But this land is ours and we\'ll see it wiped clean',
      'Of the scourge that has sullied our hopes and our dreams!',
    ],
    mood: 'rousing',
    popularity: 80,
    location: 'Stormcloak-controlled holds',
  },
  
  // Love Songs
  beneath_your_feet: {
    id: 'beneath_your_feet',
    name: 'Beneath Your Feet',
    type: 'love_song',
    instruments: ['lute', 'flute', 'voice'],
    description: 'A gentle ballad about unrequited love.',
    lyrics: [
      'Beneath your feet, the flowers grow',
      'Where you walk, the warm winds blow',
      'Your smile like the morning sun',
      'My heart beats for you alone',
      '',
      'I watch from afar, I dare not speak',
      'For your love, I feel so weak',
      'If only you knew what I\'d do',
      'To spend just one day with you',
    ],
    mood: 'melancholy',
    popularity: 60,
  },
  
  // Ballads
  the_bonnie_banks: {
    id: 'the_bonnie_banks',
    name: 'The Bonnie Banks of White River',
    type: 'ballad',
    instruments: ['lute', 'voice'],
    description: 'A nostalgic song about the beauty of Skyrim\'s rivers.',
    lyrics: [
      'By the bonnie, bonnie banks of the White River flow',
      'Where the salmon swim and the wildflowers grow',
      'I met my love on a summer\'s day',
      'By the bonnie banks, not far away',
      '',
      'The mountains rise with their caps of snow',
      'The river runs where the tall pines grow',
      'And there I\'ll stay till my dying day',
      'By the bonnie banks, not far away',
    ],
    mood: 'peaceful',
    popularity: 70,
  },
  
  // Hymns
  blessing_of_mara: {
    id: 'blessing_of_mara',
    name: 'Blessing of Mara',
    type: 'hymn',
    instruments: ['voice'],
    description: 'A sacred hymn sung at weddings and temples of Mara.',
    lyrics: [
      'Lady Mara, hear our prayer',
      'Join two hearts in loving care',
      'Bless this union, pure and true',
      'As old love gives birth to new',
      '',
      'In your light, we find our way',
      'In your warmth, forever stay',
      'Lady Mara, goddess kind',
      'In your love, our souls entwined',
    ],
    mood: 'peaceful',
    popularity: 50,
    location: 'Temple of Mara, Riften',
  },
  
  // Drinking Songs
  three_blank_arrows: {
    id: 'three_blank_arrows',
    name: 'Three Blank Arrows',
    type: 'drinking_song',
    instruments: ['lute', 'drum', 'voice'],
    description: 'A silly drinking song about an archer who can\'t hit anything.',
    lyrics: [
      'I drew my bow with steady hand',
      'The finest shot in all the land',
      'But the mead had made my vision blur',
      'And my arrow hit a horse\'s rear!',
      '',
      'Three blank arrows, one more mead!',
      'I\'ll hit the target, guaranteed!',
      'My aim gets better, drink by drink',
      'Or at least that\'s what I think!',
    ],
    mood: 'uplifting',
    popularity: 75,
    location: 'Taverns',
  },
  
  // Dirges
  sovngarde_awaits: {
    id: 'sovngarde_awaits',
    name: 'Sovngarde Awaits',
    type: 'dirge',
    instruments: ['voice', 'drum'],
    description: 'A solemn song sung at Nord funerals.',
    lyrics: [
      'The battle is over, the warrior falls',
      'Sovngarde opens its golden halls',
      'No more pain, no more strife',
      'A hero passes from this life',
      '',
      'Raise your horns to the sky',
      'To glory we sing as spirits fly',
      'In Shor\'s great hall, they feast this night',
      'Our fallen friend has won the fight',
    ],
    mood: 'haunting',
    popularity: 40,
  },
  
  // Comedy
  lusty_argonian_maid: {
    id: 'lusty_argonian_maid',
    name: 'The Lusty Argonian Maid (Abridged)',
    type: 'comedy',
    instruments: ['lute', 'voice'],
    description: 'A comedic song based on the infamous play.',
    lyrics: [
      'Clean my staff? The maid did say',
      'I polish things all night and day!',
      'The master needs his spear well kept',
      'I haven\'t gotten any sleep!',
      '',
      '(The rest is too scandalous to print)',
    ],
    mood: 'uplifting',
    popularity: 90,
    location: 'Bards College',
  },
};

// ========== STATE MANAGEMENT ==========

export function getInitialBardState(): BardState {
  return {
    knownSongs: ['ragnar_the_red'], // Everyone knows Ragnar the Red
    performanceHistory: [],
    totalPerformances: 0,
    totalTipsEarned: 0,
    bardSkill: 0,
    reputation: 'unknown',
  };
}

export function learnSong(
  state: BardState,
  songId: string
): { newState: BardState; success: boolean; message: string } {
  const song = SONGS[songId];
  if (!song) {
    return {
      newState: state,
      success: false,
      message: 'Unknown song.',
    };
  }
  
  if (state.knownSongs.includes(songId)) {
    return {
      newState: state,
      success: false,
      message: `You already know "${song.name}".`,
    };
  }
  
  return {
    newState: {
      ...state,
      knownSongs: [...state.knownSongs, songId],
    },
    success: true,
    message: `You learned "${song.name}"!`,
  };
}

export function performSong(
  state: BardState,
  songId: string,
  location: string,
  audienceSize: number,
  speechSkill: number
): { newState: BardState; success: boolean; message: string; tipEarned: number } {
  const song = SONGS[songId];
  if (!song) {
    return {
      newState: state,
      success: false,
      message: 'Unknown song.',
      tipEarned: 0,
    };
  }
  
  if (!state.knownSongs.includes(songId)) {
    return {
      newState: state,
      success: false,
      message: `You don't know "${song.name}".`,
      tipEarned: 0,
    };
  }
  
  // Calculate success chance
  let successChance = 50;
  successChance += state.bardSkill * 0.3;
  successChance += speechSkill * 0.2;
  successChance += song.popularity * 0.1; // Popular songs are easier
  
  // Clamp
  successChance = Math.max(20, Math.min(95, successChance));
  
  const roll = Math.random() * 100;
  const success = roll < successChance;
  
  // Calculate tips
  let tipEarned = 0;
  if (success) {
    const baseTip = Math.floor(audienceSize * 2);
    const skillBonus = Math.floor(state.bardSkill * 0.5);
    const popularityBonus = Math.floor(song.popularity * 0.1);
    tipEarned = baseTip + skillBonus + popularityBonus;
    
    // Bonus for matching faction songs to audience
    if (song.faction) {
      tipEarned = Math.floor(tipEarned * 1.5);
    }
  }
  
  // Skill gain
  const skillGain = success ? 2 : 0.5;
  const newBardSkill = Math.min(100, state.bardSkill + skillGain);
  
  // Update reputation
  const totalPerformances = state.totalPerformances + 1;
  const newReputation = getReputationLevel(totalPerformances, state.totalTipsEarned + tipEarned);
  
  const performance: BardPerformance = {
    songId,
    location,
    timestamp: Date.now(),
    audienceSize,
    tipReceived: tipEarned,
    successful: success,
  };
  
  // Determine favorite venue
  const venueCount: Record<string, number> = {};
  [...state.performanceHistory, performance].forEach(p => {
    venueCount[p.location] = (venueCount[p.location] || 0) + 1;
  });
  const favoriteVenue = Object.entries(venueCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  
  const message = success
    ? `Your performance of "${song.name}" was well received! The audience shows their appreciation.`
    : `Your performance of "${song.name}" fell flat. The audience seems unimpressed.`;
  
  return {
    newState: {
      ...state,
      performanceHistory: [...state.performanceHistory.slice(-49), performance], // Keep last 50
      totalPerformances,
      totalTipsEarned: state.totalTipsEarned + tipEarned,
      favoriteVenue,
      bardSkill: newBardSkill,
      reputation: newReputation,
    },
    success,
    message: tipEarned > 0 ? `${message} You earned ${tipEarned} gold in tips!` : message,
    tipEarned,
  };
}

function getReputationLevel(
  performances: number,
  totalTips: number
): 'unknown' | 'amateur' | 'local' | 'renowned' | 'legendary' {
  const score = performances + (totalTips / 10);
  
  if (score >= 500) return 'legendary';
  if (score >= 200) return 'renowned';
  if (score >= 50) return 'local';
  if (score >= 10) return 'amateur';
  return 'unknown';
}

// ========== UTILITY FUNCTIONS ==========

export function getSongsByType(type: SongType): Song[] {
  return Object.values(SONGS).filter(s => s.type === type);
}

export function getSongsByMood(mood: Song['mood']): Song[] {
  return Object.values(SONGS).filter(s => s.mood === mood);
}

export function getSongsByFaction(faction: string): Song[] {
  return Object.values(SONGS).filter(s => s.faction === faction);
}

export function getUnknownSongs(state: BardState): Song[] {
  return Object.values(SONGS).filter(s => !state.knownSongs.includes(s.id));
}

export function getSongLyrics(songId: string): string {
  const song = SONGS[songId];
  if (!song) return 'Unknown song.';
  return song.lyrics.join('\n');
}

export function getPerformanceStats(state: BardState): {
  totalPerformances: number;
  successRate: number;
  averageTip: number;
  favoriteVenue?: string;
} {
  const successful = state.performanceHistory.filter(p => p.successful).length;
  const total = state.performanceHistory.length;
  
  return {
    totalPerformances: state.totalPerformances,
    successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
    averageTip: state.totalPerformances > 0 
      ? Math.round(state.totalTipsEarned / state.totalPerformances) 
      : 0,
    favoriteVenue: state.favoriteVenue,
  };
}

export function requestSong(
  playerFaction?: string
): Song {
  // Filter appropriate songs
  let possibleSongs = Object.values(SONGS);
  
  // Prefer faction-appropriate songs
  if (playerFaction) {
    const factionSongs = possibleSongs.filter(s => s.faction === playerFaction);
    if (factionSongs.length > 0 && Math.random() < 0.5) {
      possibleSongs = factionSongs;
    }
  }
  
  // Weight by popularity
  const totalPopularity = possibleSongs.reduce((sum, s) => sum + s.popularity, 0);
  let roll = Math.random() * totalPopularity;
  
  for (const song of possibleSongs) {
    roll -= song.popularity;
    if (roll <= 0) {
      return song;
    }
  }
  
  return possibleSongs[0];
}

export function getRandomTavernAmbience(): string[] {
  const ambiences = [
    'The bard strums a gentle melody in the corner.',
    'Patrons clap along to a rousing drinking song.',
    'Someone calls out for "Ragnar the Red!"',
    'The tavern fills with the sound of cheerful music.',
    'A bard\'s voice rises above the din of conversation.',
    'Drums beat out a steady rhythm as patrons stomp their feet.',
    'The haunting notes of a flute drift through the smoky air.',
    'Someone has had too much mead and is attempting to sing.',
    'The bard pauses for a sip of ale before the next verse.',
    'A group in the corner harmonizes poorly but enthusiastically.',
  ];
  
  return ambiences;
}

export function getBardCollegeCurriculum(): string[] {
  return [
    'History of Skyrim\'s Musical Traditions',
    'The Art of the Verse',
    'Instrumental Mastery: Lute',
    'Instrumental Mastery: Drum',
    'Instrumental Mastery: Flute',
    'Voice Training and Projection',
    'Performance and Stage Presence',
    'The Songs of the Civil War',
    'Ancient Nordic Chants',
    'The Ethics of Satire',
  ];
}
