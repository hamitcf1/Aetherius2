/**
 * Skill Training Service
 * 
 * Implements the Skyrim skill training system where players can pay trainers
 * to increase skills up to 5 times per character level.
 */

// Trainer types and skill specializations
export interface Trainer {
  id: string;
  name: string;
  skill: SkillName;
  maxTrainingLevel: number; // Maximum skill level this trainer can teach (Apprentice: 50, Journeyman: 75, Expert: 90, Master: 100)
  location: string;
  faction?: string;
  cost?: number; // Base cost modifier
  dialogue: {
    greeting: string;
    training: string;
    maxLevel: string;
    farewell: string;
  };
}

export type SkillName = 
  // Combat
  | 'OneHanded' | 'TwoHanded' | 'Archery' | 'Block' | 'HeavyArmor' | 'LightArmor' | 'Smithing'
  // Magic
  | 'Alteration' | 'Conjuration' | 'Destruction' | 'Enchanting' | 'Illusion' | 'Restoration'
  // Stealth
  | 'Alchemy' | 'LightArmor' | 'Lockpicking' | 'Pickpocket' | 'Sneak' | 'Speech';

export interface TrainingState {
  trainingsThisLevel: number; // How many times trained this level (max 5)
  lastTrainedLevel: number; // Character level when last trained
  trainedSkills: Record<string, number>; // Track points trained per skill
  totalGoldSpent: number;
}

// Training cost calculation (based on Skyrim formula)
export const calculateTrainingCost = (currentSkillLevel: number, characterLevel: number): number => {
  // Base cost formula: scales with skill level
  // Low levels: ~50-100g, Mid levels: ~200-500g, High levels: ~1000-5000g
  const baseCost = Math.floor(Math.pow(currentSkillLevel, 1.65) + 10);
  const levelModifier = 1 + (characterLevel * 0.02); // Slightly higher at higher character levels
  return Math.floor(baseCost * levelModifier);
};

// Check if player can train
export const canTrain = (
  trainingState: TrainingState,
  characterLevel: number,
  currentSkillLevel: number,
  trainerMaxLevel: number,
  playerGold: number
): { canTrain: boolean; reason?: string } => {
  // Reset training count if character leveled up
  if (trainingState.lastTrainedLevel < characterLevel) {
    // Training count should be reset (handled by caller)
    return { canTrain: true };
  }

  // Check training limit
  if (trainingState.trainingsThisLevel >= 5) {
    return { canTrain: false, reason: 'You have already trained 5 times this level. Gain another level to train more.' };
  }

  // Check trainer's max level
  if (currentSkillLevel >= trainerMaxLevel) {
    return { canTrain: false, reason: `This trainer cannot teach you any more. Your skill level (${currentSkillLevel}) exceeds their expertise (${trainerMaxLevel}).` };
  }

  // Check skill cap (100)
  if (currentSkillLevel >= 100) {
    return { canTrain: false, reason: 'This skill has already reached its maximum level.' };
  }

  // Check gold
  const cost = calculateTrainingCost(currentSkillLevel, characterLevel);
  if (playerGold < cost) {
    return { canTrain: false, reason: `You need ${cost} gold to train. You only have ${playerGold}.` };
  }

  return { canTrain: true };
};

// Perform training
export const trainSkill = (
  trainingState: TrainingState,
  characterLevel: number,
  currentSkillLevel: number,
  trainerMaxLevel: number,
  playerGold: number,
  skillName: string
): { 
  success: boolean; 
  message: string; 
  newState: TrainingState;
  goldCost: number;
  newSkillLevel: number;
} => {
  // Reset training count if leveled up
  let state = { ...trainingState };
  if (state.lastTrainedLevel < characterLevel) {
    state = {
      ...state,
      trainingsThisLevel: 0,
      lastTrainedLevel: characterLevel
    };
  }

  const check = canTrain(state, characterLevel, currentSkillLevel, trainerMaxLevel, playerGold);
  if (!check.canTrain) {
    return {
      success: false,
      message: check.reason || 'Cannot train at this time.',
      newState: state,
      goldCost: 0,
      newSkillLevel: currentSkillLevel
    };
  }

  const cost = calculateTrainingCost(currentSkillLevel, characterLevel);
  const newSkillLevel = currentSkillLevel + 1;

  const newState: TrainingState = {
    trainingsThisLevel: state.trainingsThisLevel + 1,
    lastTrainedLevel: characterLevel,
    trainedSkills: {
      ...state.trainedSkills,
      [skillName]: (state.trainedSkills[skillName] || 0) + 1
    },
    totalGoldSpent: state.totalGoldSpent + cost
  };

  return {
    success: true,
    message: `Your ${skillName} skill increased to ${newSkillLevel}! (${5 - newState.trainingsThisLevel} trainings remaining this level)`,
    newState,
    goldCost: cost,
    newSkillLevel
  };
};

// Initialize training state
export const initializeTrainingState = (): TrainingState => ({
  trainingsThisLevel: 0,
  lastTrainedLevel: 1,
  trainedSkills: {},
  totalGoldSpent: 0
});

// Backwards-compatible aliases expected by App.tsx
export const getInitialTrainingState = initializeTrainingState;
export const canTrainSkill = canTrain;
export const getTrainingCost = calculateTrainingCost;
export type TrainerData = Trainer;

export function getTrainersForCategory(category?: string): Trainer[] {
  if (!category) return Object.values(TRAINERS);
  return Object.values(TRAINERS).filter(t => t.skill === category || t.faction === category);
}

export function getTrainerByName(id: string): Trainer | undefined {
  return TRAINERS[id];
}

// Get training state from character data
export const getTrainingState = (characterData: unknown): TrainingState => {
  if (!characterData || typeof characterData !== 'object') {
    return initializeTrainingState();
  }
  const data = characterData as any;
  return {
    trainingsThisLevel: data.trainingsThisLevel ?? 0,
    lastTrainedLevel: data.lastTrainedLevel ?? 1,
    trainedSkills: data.trainedSkills ?? {},
    totalGoldSpent: data.totalGoldSpent ?? 0
  };
};

// All trainers in Skyrim
export const TRAINERS: Record<string, Trainer> = {
  // Combat Trainers
  'amren': {
    id: 'amren',
    name: 'Amren',
    skill: 'OneHanded',
    maxTrainingLevel: 50,
    location: 'Whiterun',
    dialogue: {
      greeting: "Looking to improve your sword arm? I can teach you a few things.",
      training: "Good. Keep your grip firm but flexible. Again!",
      maxLevel: "You've surpassed what I can teach. Seek a master.",
      farewell: "Practice daily. The blade remembers."
    }
  },
  'athis': {
    id: 'athis',
    name: 'Athis',
    skill: 'OneHanded',
    maxTrainingLevel: 75,
    location: 'Jorrvaskr, Whiterun',
    faction: 'companions',
    dialogue: {
      greeting: "The Companions always have time to train.",
      training: "Strike with purpose. Every swing should mean something.",
      maxLevel: "I have nothing more to teach you in this.",
      farewell: "May your blade stay sharp."
    }
  },
  'burguk': {
    id: 'burguk',
    name: 'Chief Burguk',
    skill: 'TwoHanded',
    maxTrainingLevel: 50,
    location: 'Dushnikh Yal',
    dialogue: {
      greeting: "An outsider wants to learn the Orcish way of battle?",
      training: "Put your whole body into the swing. Let rage fuel your strikes!",
      maxLevel: "You fight well enough. Find another to teach you more.",
      farewell: "Malacath guide your blade."
    }
  },
  'vilkas': {
    id: 'vilkas',
    name: 'Vilkas',
    skill: 'TwoHanded',
    maxTrainingLevel: 90,
    location: 'Jorrvaskr, Whiterun',
    faction: 'companions',
    dialogue: {
      greeting: "Want to learn how to really swing a greatsword?",
      training: "Control. Power means nothing without control.",
      maxLevel: "Impressive. You've mastered what I know.",
      farewell: "For the Companions."
    }
  },
  'angi': {
    id: 'angi',
    name: 'Angi',
    skill: 'Archery',
    maxTrainingLevel: 75,
    location: "Angi's Camp, south of Falkreath",
    dialogue: {
      greeting: "You want to learn to shoot? I live alone for a reason, but... I could use the company.",
      training: "Breathe. Aim. Release. Don't think, just feel the arrow.",
      maxLevel: "You're a natural. I have nothing more to teach.",
      farewell: "May your arrows fly true."
    }
  },
  'niruin': {
    id: 'niruin',
    name: 'Niruin',
    skill: 'Archery',
    maxTrainingLevel: 90,
    location: 'Thieves Guild, Riften',
    faction: 'thieves_guild',
    dialogue: {
      greeting: "Bosmer blood runs in these veins. Archery is in my very soul.",
      training: "Silence is just as important as accuracy. A dead mark tells no tales.",
      maxLevel: "You shoot as well as any Wood Elf. Impressive.",
      farewell: "Shadows hide you."
    }
  },
  'njada': {
    id: 'njada',
    name: 'Njada Stonearm',
    skill: 'Block',
    maxTrainingLevel: 75,
    location: 'Jorrvaskr, Whiterun',
    faction: 'companions',
    dialogue: {
      greeting: "You think you can take a hit? Let's find out.",
      training: "Brace! Feel the impact, don't fight it. Redirect!",
      maxLevel: "You've a shield-arm worthy of the Companions now.",
      farewell: "Stand firm."
    }
  },
  'gharol': {
    id: 'gharol',
    name: 'Gharol',
    skill: 'Smithing',
    maxTrainingLevel: 75,
    location: 'Dushnikh Yal',
    dialogue: {
      greeting: "You want to learn Orcish smithing? It's not for the faint of heart.",
      training: "The metal sings when you strike it right. Listen to it!",
      maxLevel: "You craft well. Seek Eorlund Gray-Mane if you want mastery.",
      farewell: "May your forge never grow cold."
    }
  },
  'eorlund': {
    id: 'eorlund',
    name: 'Eorlund Gray-Mane',
    skill: 'Smithing',
    maxTrainingLevel: 100,
    location: 'Skyforge, Whiterun',
    dialogue: {
      greeting: "The Skyforge has its secrets. I can share some.",
      training: "The old ways are the best ways. Feel the heat, know the metal.",
      maxLevel: "You've learned all I can teach. The Skyforge remembers your hands now.",
      farewell: "Craft with honor."
    }
  },
  
  // Magic Trainers
  'tolfdir': {
    id: 'tolfdir',
    name: 'Tolfdir',
    skill: 'Alteration',
    maxTrainingLevel: 90,
    location: "College of Winterhold",
    faction: 'college_of_winterhold',
    dialogue: {
      greeting: "Ah, interested in Alteration? The magic of changing what is.",
      training: "Focus on the fundamental nature of the object. Convince it to change.",
      maxLevel: "You've grasped the deepest mysteries of Alteration. Well done.",
      farewell: "May Magnus light your path."
    }
  },
  'phinis': {
    id: 'phinis',
    name: 'Phinis Gestor',
    skill: 'Conjuration',
    maxTrainingLevel: 75,
    location: "College of Winterhold",
    faction: 'college_of_winterhold',
    dialogue: {
      greeting: "Conjuration is misunderstood. It's not about raising the dead... well, not only.",
      training: "The planes of Oblivion hold great power. Learn to tap it safely.",
      maxLevel: "You've become quite the conjurer. Impressive.",
      farewell: "May your summons serve you well."
    }
  },
  'faralda': {
    id: 'faralda',
    name: 'Faralda',
    skill: 'Destruction',
    maxTrainingLevel: 90,
    location: "College of Winterhold",
    faction: 'college_of_winterhold',
    dialogue: {
      greeting: "Destruction magic. The most direct application of magical power.",
      training: "Channel your will into pure elemental force. Fire, frost, or shock - it matters not.",
      maxLevel: "Your destructive capabilities are formidable. Use them wisely.",
      farewell: "Strike true."
    }
  },
  'sergius': {
    id: 'sergius',
    name: 'Sergius Turrianus',
    skill: 'Enchanting',
    maxTrainingLevel: 75,
    location: "College of Winterhold",
    faction: 'college_of_winterhold',
    dialogue: {
      greeting: "Enchanting is the art of binding magic to the physical. Delicate work.",
      training: "Feel the soul gem's energy. Guide it into the item, not force it.",
      maxLevel: "You've a deft hand with enchantments now.",
      farewell: "May your enchantments hold true."
    }
  },
  'drevis': {
    id: 'drevis',
    name: 'Drevis Neloren',
    skill: 'Illusion',
    maxTrainingLevel: 90,
    location: "College of Winterhold",
    faction: 'college_of_winterhold',
    dialogue: {
      greeting: "Illusion magic. The art of making the unreal seem real.",
      training: "The mind is more malleable than people think. Convince it, and reality follows.",
      maxLevel: "You've mastered the arts of perception and deception.",
      farewell: "What is real, anyway?"
    }
  },
  'colette': {
    id: 'colette',
    name: 'Colette Marence',
    skill: 'Restoration',
    maxTrainingLevel: 90,
    location: "College of Winterhold",
    faction: 'college_of_winterhold',
    dialogue: {
      greeting: "Restoration IS a perfectly valid school of magic! Let me teach you.",
      training: "Healing is about restoring balance. Feel the life force, guide it back.",
      maxLevel: "You're a true master of Restoration now. See? It IS a valid school!",
      farewell: "Stay healthy."
    }
  },
  
  // Stealth Trainers
  'arcadia': {
    id: 'arcadia',
    name: 'Arcadia',
    skill: 'Alchemy',
    maxTrainingLevel: 50,
    location: "Arcadia's Cauldron, Whiterun",
    dialogue: {
      greeting: "Looking to learn alchemy? I can teach you the basics.",
      training: "Grinding, mixing, distilling. Alchemy is as much art as science.",
      maxLevel: "You've outgrown my humble shop. Seek Babette for more.",
      farewell: "Good hunting for ingredients."
    }
  },
  'babette': {
    id: 'babette',
    name: 'Babette',
    skill: 'Alchemy',
    maxTrainingLevel: 100,
    location: 'Dark Brotherhood Sanctuary',
    faction: 'dark_brotherhood',
    dialogue: {
      greeting: "Don't let my appearance fool you. I've had three hundred years to master alchemy.",
      training: "Poison or potion? The difference is often just dosage and intent.",
      maxLevel: "You've learned all my secrets. Use them... creatively.",
      farewell: "Sweet dreams."
    }
  },
  'vex': {
    id: 'vex',
    name: 'Vex',
    skill: 'Lockpicking',
    maxTrainingLevel: 90,
    location: "Thieves Guild, Riften",
    faction: 'thieves_guild',
    dialogue: {
      greeting: "Want to learn about locks? Fine, but it'll cost you.",
      training: "Feel the pins. Every lock has a sweet spot. Find it.",
      maxLevel: "You're as good as me now. Maybe better. Don't let it go to your head.",
      farewell: "Don't get caught."
    }
  },
  'silda': {
    id: 'silda',
    name: 'Silda the Unseen',
    skill: 'Pickpocket',
    maxTrainingLevel: 50,
    location: 'Windhelm',
    dialogue: {
      greeting: "Spare a coin? Or... want to learn how to acquire them yourself?",
      training: "Distraction. Speed. Confidence. Take what you need and walk away.",
      maxLevel: "You've got nimble fingers now. Find Vipir for the real tricks.",
      farewell: "Stay invisible."
    }
  },
  'vipir': {
    id: 'vipir',
    name: 'Vipir the Fleet',
    skill: 'Pickpocket',
    maxTrainingLevel: 90,
    location: "Thieves Guild, Riften",
    faction: 'thieves_guild',
    dialogue: {
      greeting: "They call me the Fleet because I'm gone before they know I was there.",
      training: "Weight, placement, movement. Know all three and pockets open like flowers.",
      maxLevel: "You could teach me a thing or two now.",
      farewell: "Light fingers."
    }
  },
  'garvey': {
    id: 'garvey',
    name: 'Khayla',
    skill: 'Sneak',
    maxTrainingLevel: 50,
    location: "Khajiit Caravan",
    dialogue: {
      greeting: "This one knows how to move unseen. Perhaps Khayla can teach you.",
      training: "Move with the shadows, not through them. Become invisible even in plain sight.",
      maxLevel: "You move like a Khajiit now. May you walk always in shadow.",
      farewell: "May your road lead to warm sands."
    }
  },
  'delvin': {
    id: 'delvin',
    name: 'Delvin Mallory',
    skill: 'Sneak',
    maxTrainingLevel: 90,
    location: "Thieves Guild, Riften",
    faction: 'thieves_guild',
    dialogue: {
      greeting: "Want to learn how to really disappear? I've been doing this since before you were born.",
      training: "Patience. Timing. Know when to move and when to freeze.",
      maxLevel: "You're a ghost now. Even I might lose track of you.",
      farewell: "Walk in shadow."
    }
  },
  'giraud': {
    id: 'giraud',
    name: 'Giraud Gemane',
    skill: 'Speech',
    maxTrainingLevel: 75,
    location: "Bards College, Solitude",
    dialogue: {
      greeting: "A bard's tongue is sharper than any sword. Let me show you.",
      training: "Rhythm, tone, timing. Words are music. Make people dance to your tune.",
      maxLevel: "You could charm a jarl out of their throne now.",
      farewell: "May your words ring true."
    }
  },
  'ogmund': {
    id: 'ogmund',
    name: 'Ogmund',
    skill: 'Speech',
    maxTrainingLevel: 50,
    location: 'Markarth',
    dialogue: {
      greeting: "An old skald always has time for a student.",
      training: "The voice carries power. Learn to project, to convince, to inspire.",
      maxLevel: "You've a silver tongue now. Use it wisely.",
      farewell: "Sing the old songs."
    }
  },
};

// Get trainers by skill
export const getTrainersBySkill = (skill: SkillName): Trainer[] => {
  return Object.values(TRAINERS).filter(t => t.skill === skill);
};

// Get trainers by location
export const getTrainersByLocation = (location: string): Trainer[] => {
  return Object.values(TRAINERS).filter(t => 
    t.location.toLowerCase().includes(location.toLowerCase())
  );
};

// Get trainers by faction
export const getTrainersByFaction = (faction: string): Trainer[] => {
  return Object.values(TRAINERS).filter(t => t.faction === faction);
};

// Get available trainers (those who can still teach the player)
export const getAvailableTrainers = (
  playerSkills: Record<string, number>
): Trainer[] => {
  return Object.values(TRAINERS).filter(trainer => {
    const playerSkillLevel = playerSkills[trainer.skill] || 15;
    return playerSkillLevel < trainer.maxTrainingLevel;
  });
};

// Training session result type
export interface TrainingSession {
  trainerId: string;
  trainerName: string;
  skill: SkillName;
  previousLevel: number;
  newLevel: number;
  goldSpent: number;
  dialogue: string;
}

// Perform a full training session
export const performTrainingSession = (
  trainer: Trainer,
  trainingState: TrainingState,
  characterLevel: number,
  currentSkillLevel: number,
  playerGold: number
): {
  success: boolean;
  message: string;
  session?: TrainingSession;
  newTrainingState: TrainingState;
  goldCost: number;
  newSkillLevel: number;
} => {
  const result = trainSkill(
    trainingState,
    characterLevel,
    currentSkillLevel,
    trainer.maxTrainingLevel,
    playerGold,
    trainer.skill
  );

  if (!result.success) {
    return {
      success: false,
      message: result.message,
      newTrainingState: result.newState,
      goldCost: 0,
      newSkillLevel: currentSkillLevel
    };
  }

  const session: TrainingSession = {
    trainerId: trainer.id,
    trainerName: trainer.name,
    skill: trainer.skill,
    previousLevel: currentSkillLevel,
    newLevel: result.newSkillLevel,
    goldSpent: result.goldCost,
    dialogue: trainer.dialogue.training
  };

  return {
    success: true,
    message: result.message,
    session,
    newTrainingState: result.newState,
    goldCost: result.goldCost,
    newSkillLevel: result.newSkillLevel
  };
};

export default {
  TRAINERS,
  calculateTrainingCost,
  canTrain,
  trainSkill,
  initializeTrainingState,
  getTrainingState,
  getTrainersBySkill,
  getTrainersByLocation,
  getTrainersByFaction,
  getAvailableTrainers,
  performTrainingSession
};
