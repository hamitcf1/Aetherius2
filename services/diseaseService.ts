/**
 * Disease and Cure Service
 * Disease contraction, effects, and cure mechanics from Skyrim
 */

import { LootRarity, InventoryItem } from '../types';

// ========== TYPES ==========

export type DiseaseType = 
  | 'ataxia' | 'bone_break_fever' | 'brain_rot' | 'droops' 
  | 'rattles' | 'rockjoint' | 'witbane' | 'sanguinare_vampiris'
  | 'lycanthropy' | 'corprus' | 'greenspore' | 'helljoint'
  | 'yellow_tick' | 'ash_woe' | 'blood_lung';

export type DiseaseSource = 
  | 'skeever' | 'wolf' | 'bear' | 'sabre_cat' | 'trap' | 'vampire'
  | 'werewolf' | 'frostbite_spider' | 'chaurus' | 'draugr' | 'hagraven'
  | 'environment' | 'corpse' | 'ash_spawn';

export interface Disease {
  id: DiseaseType;
  name: string;
  description: string;
  loreDescription: string;
  effects: DiseaseEffect[];
  sources: DiseaseSource[];
  contractionChance: number; // Base % chance per exposure
  incubationHours: number; // Hours before symptoms appear
  progressionRate: number; // How fast it worsens (1-10)
  curable: boolean;
  fatalIfUntreated: boolean;
  daysUntilFatal?: number;
}

export interface DiseaseEffect {
  attribute: 'health' | 'magicka' | 'stamina' | 'carry_weight' | 'lockpicking' | 'pickpocket' | 'sneak' | 'one_handed' | 'two_handed' | 'archery' | 'block' | 'destruction' | 'conjuration' | 'restoration' | 'alteration' | 'illusion' | 'enchanting' | 'smithing' | 'alchemy' | 'speech' | 'health_regen' | 'magicka_regen' | 'stamina_regen';
  modifier: number; // Negative for debuff
  isPercentage: boolean;
}

export interface ActiveDisease {
  diseaseId: DiseaseType;
  contractedAt: number; // Timestamp
  stage: number; // 1-4, increases severity
  daysInfected: number;
  symptomsShowing: boolean;
}

export interface DiseaseState {
  activeDiseases: ActiveDisease[];
  diseaseResistance: number; // 0-100, percentage
  diseasesContracted: number; // Total ever contracted
  diseasesCured: number; // Total cured
  isVampire: boolean;
  isWerewolf: boolean;
}

export interface CureItem {
  id: string;
  name: string;
  description: string;
  curesAll: boolean;
  curesSpecific?: DiseaseType[];
  preventsContraction: boolean; // If taken preventatively
  duration: number; // How long prevention lasts (hours)
  value: number;
  rarity: LootRarity;
}

// ========== DISEASE DATABASE ==========

export const DISEASES: Record<DiseaseType, Disease> = {
  ataxia: {
    id: 'ataxia',
    name: 'Ataxia',
    description: 'Lockpicking and Pickpocket skills are reduced.',
    loreDescription: 'A common disease among thieves, contracted from booby-trapped containers. It causes clumsiness and shaking hands.',
    effects: [
      { attribute: 'lockpicking', modifier: -25, isPercentage: true },
      { attribute: 'pickpocket', modifier: -25, isPercentage: true },
    ],
    sources: ['trap', 'skeever', 'frostbite_spider'],
    contractionChance: 15,
    incubationHours: 2,
    progressionRate: 2,
    curable: true,
    fatalIfUntreated: false,
  },
  
  bone_break_fever: {
    id: 'bone_break_fever',
    name: 'Bone Break Fever',
    description: 'Maximum stamina is reduced.',
    loreDescription: 'A painful fever that weakens the bones and drains physical energy. Common among those who battle bears and sabre cats.',
    effects: [
      { attribute: 'stamina', modifier: -25, isPercentage: false },
    ],
    sources: ['bear', 'sabre_cat', 'wolf'],
    contractionChance: 12,
    incubationHours: 4,
    progressionRate: 3,
    curable: true,
    fatalIfUntreated: false,
  },
  
  brain_rot: {
    id: 'brain_rot',
    name: 'Brain Rot',
    description: 'Maximum magicka is reduced.',
    loreDescription: 'A disease that affects mental capacity, causing confusion and difficulty concentrating on magical tasks.',
    effects: [
      { attribute: 'magicka', modifier: -25, isPercentage: false },
    ],
    sources: ['hagraven', 'environment', 'chaurus'],
    contractionChance: 10,
    incubationHours: 6,
    progressionRate: 2,
    curable: true,
    fatalIfUntreated: false,
  },
  
  droops: {
    id: 'droops',
    name: 'Droops',
    description: 'One-Handed and Two-Handed skills are reduced.',
    loreDescription: 'A muscular disorder that causes weakness in the arms, making it difficult to wield weapons effectively.',
    effects: [
      { attribute: 'one_handed', modifier: -15, isPercentage: true },
      { attribute: 'two_handed', modifier: -15, isPercentage: true },
    ],
    sources: ['draugr', 'corpse', 'trap'],
    contractionChance: 8,
    incubationHours: 8,
    progressionRate: 1,
    curable: true,
    fatalIfUntreated: false,
  },
  
  rattles: {
    id: 'rattles',
    name: 'Rattles',
    description: 'Maximum stamina is reduced significantly.',
    loreDescription: 'Named for the shaking and chattering it causes, this disease drains vitality and makes physical exertion exhausting.',
    effects: [
      { attribute: 'stamina', modifier: -50, isPercentage: false },
      { attribute: 'stamina_regen', modifier: -25, isPercentage: true },
    ],
    sources: ['chaurus', 'frostbite_spider', 'skeever'],
    contractionChance: 7,
    incubationHours: 12,
    progressionRate: 4,
    curable: true,
    fatalIfUntreated: false,
  },
  
  rockjoint: {
    id: 'rockjoint',
    name: 'Rockjoint',
    description: 'Melee combat effectiveness is reduced.',
    loreDescription: 'A common affliction that causes joint stiffness and pain, severely hampering melee combat ability.',
    effects: [
      { attribute: 'one_handed', modifier: -25, isPercentage: true },
      { attribute: 'two_handed', modifier: -25, isPercentage: true },
      { attribute: 'block', modifier: -10, isPercentage: true },
    ],
    sources: ['wolf', 'bear', 'trap', 'draugr'],
    contractionChance: 15,
    incubationHours: 4,
    progressionRate: 3,
    curable: true,
    fatalIfUntreated: false,
  },
  
  witbane: {
    id: 'witbane',
    name: 'Witbane',
    description: 'Magicka regenerates more slowly.',
    loreDescription: 'A magical affliction that disrupts the connection to Aetherius, slowing the natural flow of magicka.',
    effects: [
      { attribute: 'magicka_regen', modifier: -50, isPercentage: true },
    ],
    sources: ['hagraven', 'draugr', 'environment'],
    contractionChance: 6,
    incubationHours: 8,
    progressionRate: 2,
    curable: true,
    fatalIfUntreated: false,
  },
  
  sanguinare_vampiris: {
    id: 'sanguinare_vampiris',
    name: 'Sanguinare Vampiris',
    description: 'Reduces health by 25 points. If left untreated for 3 days, transforms the victim into a vampire.',
    loreDescription: 'The dread disease spread by vampires. Those infected slowly lose their mortality as the blood of Molag Bal corrupts their soul.',
    effects: [
      { attribute: 'health', modifier: -25, isPercentage: false },
    ],
    sources: ['vampire'],
    contractionChance: 10, // Per vampire attack
    incubationHours: 0, // Immediate
    progressionRate: 10,
    curable: true,
    fatalIfUntreated: false,
    daysUntilFatal: 3, // Transforms, not kills
  },
  
  lycanthropy: {
    id: 'lycanthropy',
    name: 'Lycanthropy',
    description: 'The beast blood runs through your veins. 100% disease resistance but cannot gain rested bonuses.',
    loreDescription: 'The blessing—or curse—of Hircine. Those afflicted can transform into powerful werewolves but lose the comfort of restful sleep.',
    effects: [
      { attribute: 'health', modifier: 100, isPercentage: false }, // Bonus to health in beast form
    ],
    sources: ['werewolf'],
    contractionChance: 100, // Only through ritual
    incubationHours: 0,
    progressionRate: 0, // Doesn't progress
    curable: true, // Through specific quest
    fatalIfUntreated: false,
  },
  
  // Solstheim diseases
  ash_woe: {
    id: 'ash_woe',
    name: 'Ash Woe',
    description: 'Destruction magic costs more to cast.',
    loreDescription: 'A disease born of the ash wastes of Solstheim, interfering with destructive magical energies.',
    effects: [
      { attribute: 'destruction', modifier: -25, isPercentage: true },
    ],
    sources: ['ash_spawn', 'environment'],
    contractionChance: 10,
    incubationHours: 6,
    progressionRate: 2,
    curable: true,
    fatalIfUntreated: false,
  },
  
  // Additional diseases
  blood_lung: {
    id: 'blood_lung',
    name: 'Blood Lung',
    description: 'Stamina regenerates more slowly.',
    loreDescription: 'A respiratory infection that causes labored breathing and bloody coughs.',
    effects: [
      { attribute: 'stamina_regen', modifier: -25, isPercentage: true },
    ],
    sources: ['chaurus', 'frostbite_spider'],
    contractionChance: 8,
    incubationHours: 10,
    progressionRate: 3,
    curable: true,
    fatalIfUntreated: false,
  },
  
  greenspore: {
    id: 'greenspore',
    name: 'Greenspore',
    description: 'All attributes regenerate more slowly.',
    loreDescription: 'A fungal infection that spreads through the blood, slowing all natural recovery processes.',
    effects: [
      { attribute: 'health_regen', modifier: -15, isPercentage: true },
      { attribute: 'magicka_regen', modifier: -15, isPercentage: true },
      { attribute: 'stamina_regen', modifier: -15, isPercentage: true },
    ],
    sources: ['environment', 'chaurus'],
    contractionChance: 5,
    incubationHours: 24,
    progressionRate: 1,
    curable: true,
    fatalIfUntreated: false,
  },
  
  helljoint: {
    id: 'helljoint',
    name: 'Helljoint',
    description: 'Archery skill is significantly reduced.',
    loreDescription: 'An excruciating joint condition that makes drawing a bow nearly impossible.',
    effects: [
      { attribute: 'archery', modifier: -30, isPercentage: true },
    ],
    sources: ['draugr', 'trap'],
    contractionChance: 6,
    incubationHours: 6,
    progressionRate: 2,
    curable: true,
    fatalIfUntreated: false,
  },
  
  yellow_tick: {
    id: 'yellow_tick',
    name: 'Yellow Tick',
    description: 'Sneak effectiveness is reduced.',
    loreDescription: 'A parasitic infection that causes uncontrollable twitching and spasms, making stealth nearly impossible.',
    effects: [
      { attribute: 'sneak', modifier: -25, isPercentage: true },
    ],
    sources: ['frostbite_spider', 'chaurus', 'environment'],
    contractionChance: 8,
    incubationHours: 4,
    progressionRate: 3,
    curable: true,
    fatalIfUntreated: false,
  },
  
  corprus: {
    id: 'corprus',
    name: 'Corprus',
    description: 'A divine disease of Morrowind. Uncurable but grants immunity to all other diseases.',
    loreDescription: 'The Divine Disease of the Sixth House. Once thought incurable, it transforms the victim into mindless beasts if not treated.',
    effects: [
      { attribute: 'health', modifier: 50, isPercentage: false },
      { attribute: 'magicka', modifier: -100, isPercentage: false },
    ],
    sources: ['environment'], // Only in Morrowind lore
    contractionChance: 0, // Cannot be contracted normally
    incubationHours: 0,
    progressionRate: 10,
    curable: false, // Requires special cure
    fatalIfUntreated: true,
    daysUntilFatal: 30,
  },
};

// ========== CURE ITEMS ==========

export const CURE_ITEMS: Record<string, CureItem> = {
  hawk_feathers: {
    id: 'hawk_feathers',
    name: 'Hawk Feathers',
    description: 'Can be used in alchemy to cure diseases.',
    curesAll: false,
    curesSpecific: ['rockjoint', 'ataxia', 'bone_break_fever'],
    preventsContraction: false,
    duration: 0,
    value: 15,
    rarity: 'common',
  },
  charred_skeever_hide: {
    id: 'charred_skeever_hide',
    name: 'Charred Skeever Hide',
    description: 'An alchemical ingredient that cures diseases.',
    curesAll: true,
    preventsContraction: false,
    duration: 0,
    value: 25,
    rarity: 'common',
  },
  mudcrab_chitin: {
    id: 'mudcrab_chitin',
    name: 'Mudcrab Chitin',
    description: 'Has curative properties when prepared properly.',
    curesAll: true,
    preventsContraction: false,
    duration: 0,
    value: 10,
    rarity: 'common',
  },
  shrine_blessing: {
    id: 'shrine_blessing',
    name: 'Shrine Blessing',
    description: 'A blessing from the Divines that cures all diseases.',
    curesAll: true,
    preventsContraction: true,
    duration: 8, // 8 hours of protection
    value: 0, // Free at shrines
    rarity: 'common',
  },
  vigilant_cure: {
    id: 'vigilant_cure',
    name: "Vigilant's Cure",
    description: 'A specialized cure from the Vigilants of Stendarr.',
    curesAll: true,
    curesSpecific: ['sanguinare_vampiris'],
    preventsContraction: false,
    duration: 0,
    value: 500,
    rarity: 'rare',
  },
  falion_ritual: {
    id: 'falion_ritual',
    name: "Falion's Ritual",
    description: 'A powerful ritual that can cure vampirism.',
    curesAll: false,
    curesSpecific: ['sanguinare_vampiris'],
    preventsContraction: false,
    duration: 0,
    value: 0, // Quest reward
    rarity: 'legendary',
  },
  companions_ritual: {
    id: 'companions_ritual',
    name: 'Companions Ritual',
    description: 'The Companions can cure lycanthropy through ritual.',
    curesAll: false,
    curesSpecific: ['lycanthropy'],
    preventsContraction: false,
    duration: 0,
    value: 0, // Quest
    rarity: 'legendary',
  },
};

// ========== DISEASE SOURCES ==========

export const SOURCE_DISEASES: Record<DiseaseSource, DiseaseType[]> = {
  skeever: ['ataxia', 'rattles'],
  wolf: ['rockjoint', 'bone_break_fever'],
  bear: ['bone_break_fever', 'rockjoint'],
  sabre_cat: ['bone_break_fever', 'witbane'],
  trap: ['ataxia', 'droops', 'rockjoint', 'helljoint'],
  vampire: ['sanguinare_vampiris'],
  werewolf: ['lycanthropy'],
  frostbite_spider: ['ataxia', 'rattles', 'blood_lung', 'yellow_tick'],
  chaurus: ['brain_rot', 'rattles', 'greenspore', 'blood_lung', 'yellow_tick'],
  draugr: ['droops', 'witbane', 'rockjoint', 'helljoint'],
  hagraven: ['brain_rot', 'witbane'],
  environment: ['brain_rot', 'greenspore', 'ash_woe', 'yellow_tick'],
  corpse: ['droops', 'brain_rot'],
  ash_spawn: ['ash_woe'],
};

// ========== STATE MANAGEMENT ==========

export function getInitialDiseaseState(): DiseaseState {
  return {
    activeDiseases: [],
    diseaseResistance: 0,
    diseasesContracted: 0,
    diseasesCured: 0,
    isVampire: false,
    isWerewolf: false,
  };
}

export function attemptDiseaseContraction(
  state: DiseaseState,
  source: DiseaseSource,
  additionalResistance: number = 0
): { newState: DiseaseState; contracted: DiseaseType | null; message: string } {
  // Werewolves are immune to diseases
  if (state.isWerewolf) {
    return { newState: state, contracted: null, message: 'Your beast blood protects you from disease.' };
  }
  
  // Get possible diseases from this source
  const possibleDiseases = SOURCE_DISEASES[source] || [];
  if (possibleDiseases.length === 0) {
    return { newState: state, contracted: null, message: '' };
  }
  
  // Check if already have any of these diseases
  const existingDiseaseIds = state.activeDiseases.map(d => d.diseaseId);
  const newDiseases = possibleDiseases.filter(d => !existingDiseaseIds.includes(d));
  
  if (newDiseases.length === 0) {
    return { newState: state, contracted: null, message: '' };
  }
  
  // Pick a random disease from possibilities
  const diseaseId = newDiseases[Math.floor(Math.random() * newDiseases.length)];
  const disease = DISEASES[diseaseId];
  
  // Calculate total resistance
  const totalResistance = Math.min(100, state.diseaseResistance + additionalResistance);
  const effectiveChance = disease.contractionChance * (1 - totalResistance / 100);
  
  // Roll for contraction
  if (Math.random() * 100 > effectiveChance) {
    return { newState: state, contracted: null, message: '' };
  }
  
  // Contract the disease
  const newDisease: ActiveDisease = {
    diseaseId,
    contractedAt: Date.now(),
    stage: 1,
    daysInfected: 0,
    symptomsShowing: disease.incubationHours === 0,
  };
  
  return {
    newState: {
      ...state,
      activeDiseases: [...state.activeDiseases, newDisease],
      diseasesContracted: state.diseasesContracted + 1,
      isVampire: diseaseId === 'sanguinare_vampiris' && disease.daysUntilFatal ? false : state.isVampire,
    },
    contracted: diseaseId,
    message: disease.incubationHours === 0 
      ? `You have contracted ${disease.name}! ${disease.description}`
      : `You feel strange, as if something is wrong...`,
  };
}

export function progressDiseases(
  state: DiseaseState,
  hoursElapsed: number
): { newState: DiseaseState; messages: string[] } {
  const messages: string[] = [];
  let newState = { ...state };
  
  const updatedDiseases = state.activeDiseases.map(disease => {
    const diseaseData = DISEASES[disease.diseaseId];
    let updated = { ...disease };
    
    // Check incubation
    const hoursSinceContraction = (Date.now() - disease.contractedAt) / (1000 * 60 * 60);
    if (!disease.symptomsShowing && hoursSinceContraction >= diseaseData.incubationHours) {
      updated.symptomsShowing = true;
      messages.push(`You have contracted ${diseaseData.name}! ${diseaseData.description}`);
    }
    
    // Progress disease stage
    const newDays = disease.daysInfected + (hoursElapsed / 24);
    updated.daysInfected = newDays;
    
    // Stage progression (every ~3 days at rate 3)
    const daysPerStage = 10 / diseaseData.progressionRate;
    const newStage = Math.min(4, Math.floor(newDays / daysPerStage) + 1);
    
    if (newStage > disease.stage && disease.symptomsShowing) {
      updated.stage = newStage;
      messages.push(`Your ${diseaseData.name} has worsened to stage ${newStage}.`);
    }
    
    // Check for vampirism transformation
    if (disease.diseaseId === 'sanguinare_vampiris' && newDays >= 3) {
      messages.push('The hunger consumes you. You have become a vampire!');
      newState.isVampire = true;
      return null; // Remove the disease, replace with vampirism
    }
    
    return updated;
  }).filter(Boolean) as ActiveDisease[];
  
  // If became vampire, remove sanguinare
  if (newState.isVampire && !state.isVampire) {
    newState.activeDiseases = updatedDiseases.filter(d => d.diseaseId !== 'sanguinare_vampiris');
    newState.diseaseResistance = 100; // Vampires immune to disease
  } else {
    newState.activeDiseases = updatedDiseases;
  }
  
  return { newState, messages };
}

export function cureDisease(
  state: DiseaseState,
  diseaseId?: DiseaseType, // If undefined, cures all
  cureItem?: CureItem
): { newState: DiseaseState; cured: DiseaseType[]; message: string } {
  // Check what can be cured
  let diseasesToCure: DiseaseType[] = [];
  
  if (cureItem) {
    if (cureItem.curesAll) {
      diseasesToCure = state.activeDiseases
        .filter(d => d.diseaseId !== 'lycanthropy') // Lycanthropy requires special cure
        .map(d => d.diseaseId);
    } else if (cureItem.curesSpecific) {
      diseasesToCure = state.activeDiseases
        .filter(d => cureItem.curesSpecific?.includes(d.diseaseId))
        .map(d => d.diseaseId);
    }
  } else if (diseaseId) {
    diseasesToCure = state.activeDiseases
      .filter(d => d.diseaseId === diseaseId)
      .map(d => d.diseaseId);
  } else {
    // Cure all non-special diseases
    diseasesToCure = state.activeDiseases
      .filter(d => d.diseaseId !== 'lycanthropy' && d.diseaseId !== 'corprus')
      .map(d => d.diseaseId);
  }
  
  if (diseasesToCure.length === 0) {
    return { newState: state, cured: [], message: 'You have no diseases to cure.' };
  }
  
  const newActiveDiseases = state.activeDiseases.filter(d => !diseasesToCure.includes(d.diseaseId));
  
  // Handle vampirism cure
  let isStillVampire = state.isVampire;
  if (diseasesToCure.includes('sanguinare_vampiris') && !state.isVampire) {
    // Cured before full transformation
  } else if (cureItem?.curesSpecific?.includes('sanguinare_vampiris') && state.isVampire) {
    // Special cure for full vampirism
    isStillVampire = false;
  }
  
  // Handle lycanthropy cure
  let isStillWerewolf = state.isWerewolf;
  if (cureItem?.curesSpecific?.includes('lycanthropy') && state.isWerewolf) {
    isStillWerewolf = false;
  }
  
  const curedNames = diseasesToCure.map(id => DISEASES[id].name);
  
  return {
    newState: {
      ...state,
      activeDiseases: newActiveDiseases,
      diseasesCured: state.diseasesCured + diseasesToCure.length,
      isVampire: isStillVampire,
      isWerewolf: isStillWerewolf,
    },
    cured: diseasesToCure,
    message: diseasesToCure.length === 1
      ? `You have been cured of ${curedNames[0]}.`
      : `You have been cured of ${curedNames.join(', ')}.`,
  };
}

export function getTotalDiseaseEffects(state: DiseaseState): Record<string, number> {
  const effects: Record<string, number> = {};
  
  for (const activeDisease of state.activeDiseases) {
    if (!activeDisease.symptomsShowing) continue;
    
    const disease = DISEASES[activeDisease.diseaseId];
    const stageMod = 1 + (activeDisease.stage - 1) * 0.25; // Stage increases severity
    
    for (const effect of disease.effects) {
      const currentValue = effects[effect.attribute] || 0;
      effects[effect.attribute] = currentValue + (effect.modifier * stageMod);
    }
  }
  
  return effects;
}

export function getActiveDiseaseDescriptions(state: DiseaseState): Array<{ name: string; description: string; stage: number }> {
  return state.activeDiseases
    .filter(d => d.symptomsShowing)
    .map(d => ({
      name: DISEASES[d.diseaseId].name,
      description: DISEASES[d.diseaseId].description,
      stage: d.stage,
    }));
}

export function hasDiseaseImmunity(state: DiseaseState): boolean {
  return state.isWerewolf || state.diseaseResistance >= 100;
}

export function getDiseaseBySource(source: DiseaseSource): Disease[] {
  const diseaseIds = SOURCE_DISEASES[source] || [];
  return diseaseIds.map(id => DISEASES[id]);
}

export function cureItemToInventoryItem(cure: CureItem): InventoryItem {
  return {
    id: cure.id,
    name: cure.name,
    type: 'potion',
    quantity: 1,
    description: cure.description,
    rarity: cure.rarity,
    value: cure.value,
    weight: 0.5,
    effects: cure.curesAll ? ['Cures all diseases'] : cure.curesSpecific?.map(d => `Cures ${DISEASES[d].name}`) || [],
  };
}
