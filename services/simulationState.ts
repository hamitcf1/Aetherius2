/**
 * SIMULATION STATE ENGINE
 * 
 * This module provides persistent game state tracking for simulation-first roleplay.
 * It tracks NPCs, scenes, player facts, and enforces consequences.
 */

// ============================================================================
// NPC STATE MODEL
// ============================================================================

export type NPCDisposition = 'hostile' | 'wary' | 'neutral' | 'friendly' | 'allied';

export interface NPCKnowledge {
  /** Facts the NPC has learned about the player */
  facts: Record<string, string>;
  /** When the NPC learned each fact (for recency) */
  learnedAt: Record<string, number>;
}

export interface NPC {
  /** Immutable unique identifier */
  id: string;
  /** NPC's name - NEVER changes once set */
  name: string;
  /** Role/occupation (e.g., "Guard Captain", "Innkeeper", "Bandit") */
  role: string;
  /** Current disposition toward the player */
  disposition: NPCDisposition;
  /** Knowledge the NPC has about the player */
  knowledge: NPCKnowledge;
  /** Tolerance threshold (0-100). When exceeded, triggers consequences */
  tolerance: number;
  /** Current tension level (0-100). Compared against tolerance */
  tension: number;
  /** Current location of the NPC */
  location: string;
  /** Whether this NPC is currently active in the scene */
  isPresent: boolean;
  /** NPC's current state in dialogue/interaction */
  interactionState: 'idle' | 'conversing' | 'suspicious' | 'hostile' | 'resolved';
  /** Faction affiliation if any */
  faction?: string;
  /** Physical description for consistency */
  description?: string;
  /** Voice/personality notes for consistent portrayal */
  personality?: string;
  /** Timestamp when NPC was introduced */
  introducedAt: number;
  /** Last interaction timestamp */
  lastInteraction: number;
}

// ============================================================================
// SCENE STATE MACHINE
// ============================================================================

export type ScenePhase = 
  | 'exploration'      // Free roaming, no active encounter
  | 'encounter'        // NPC/situation introduced
  | 'questioning'      // Active dialogue/investigation
  | 'negotiation'      // Bargaining, persuasion in progress
  | 'confrontation'    // Hostile situation, not yet combat
  | 'combat'           // Active combat
  | 'resolution'       // Outcome being determined
  | 'exit';            // Scene concluded

export type SceneResolution = 
  | 'none'             // No resolution yet
  | 'success'          // Player achieved goal
  | 'failure'          // Player failed
  | 'compromise'       // Partial success
  | 'retreat'          // Player withdrew
  | 'escalation'       // Escalated to combat/arrest
  | 'bribe'            // Resolved via payment
  | 'persuasion'       // Resolved via speech
  | 'intimidation'     // Resolved via threat
  | 'combat_victory'   // Won fight
  | 'combat_defeat'    // Lost fight
  | 'arrested'         // Player arrested
  | 'fled';            // Player escaped

export interface SceneObjective {
  id: string;
  description: string;
  completed: boolean;
  failed: boolean;
}

export interface Scene {
  /** Unique scene identifier */
  id: string;
  /** Scene type/category */
  type: 'checkpoint' | 'dialogue' | 'combat' | 'exploration' | 'trade' | 'quest' | 'random_encounter';
  /** Current location */
  location: string;
  /** Current phase in the state machine */
  phase: ScenePhase;
  /** Resolution status */
  resolution: SceneResolution;
  /** NPCs involved in this scene (by ID) */
  involvedNPCs: string[];
  /** Scene objectives */
  objectives: SceneObjective[];
  /** Player attempts at current objective (prevents infinite retries) */
  attempts: number;
  /** Maximum attempts before forced resolution */
  maxAttempts: number;
  /** Dialogue options that have been exhausted */
  exhaustedOptions: string[];
  /** Topics that have been fully addressed */
  resolvedTopics: string[];
  /** Scene start timestamp */
  startedAt: number;
  /** Scene end timestamp (if resolved) */
  endedAt?: number;
  /** Key events that occurred */
  events: string[];
}

// ============================================================================
// PLAYER FACT MEMORY
// ============================================================================

export interface PlayerFact {
  /** The fact key (e.g., "profession", "origin", "intent") */
  key: string;
  /** The fact value (e.g., "alchemist", "Whiterun", "ingredient gathering") */
  value: string;
  /** When this fact was established */
  establishedAt: number;
  /** Who the player disclosed this to (NPC IDs) */
  disclosedTo: string[];
  /** Whether this fact can be contradicted */
  locked: boolean;
  /** Source of the fact */
  source: 'player_statement' | 'action' | 'character_creation' | 'quest';
}

export interface PlayerFactMemory {
  /** Core identity facts */
  identity: Record<string, PlayerFact>;
  /** Current situation facts */
  situation: Record<string, PlayerFact>;
  /** Relationship facts */
  relationships: Record<string, PlayerFact>;
  /** Claimed facts (may be lies) */
  claims: Record<string, PlayerFact>;
}

// ============================================================================
// CONSEQUENCE SYSTEM
// ============================================================================

export type ConsequenceType = 
  | 'entry_granted'
  | 'entry_denied'
  | 'arrest_attempt'
  | 'combat_initiated'
  | 'bounty_added'
  | 'reputation_change'
  | 'item_confiscated'
  | 'gold_paid'
  | 'quest_updated'
  | 'npc_disposition_change'
  | 'forced_retreat'
  | 'death';

export interface PendingConsequence {
  id: string;
  type: ConsequenceType;
  description: string;
  /** Trigger conditions */
  triggerCondition: {
    tensionThreshold?: number;
    attemptsExceeded?: boolean;
    phaseReached?: ScenePhase;
    playerAction?: string;
  };
  /** Whether this consequence has been applied */
  applied: boolean;
  /** Data specific to the consequence type */
  data?: Record<string, any>;
}

// ============================================================================
// WORLD AUTHORITY LAYER
// ============================================================================

export interface WorldLocation {
  name: string;
  hold: string;
  type: 'city' | 'town' | 'village' | 'dungeon' | 'fort' | 'camp' | 'landmark' | 'wilderness';
  /** Whether this location has a Jarl */
  hasJarl: boolean;
  /** The Jarl's name if applicable */
  jarlName?: string;
  /** Key NPCs at this location */
  keyNPCs: string[];
  /** Factions present */
  factions: string[];
  /** Is this canonical Elder Scrolls lore? */
  isCanon: boolean;
}

export interface WorldFaction {
  name: string;
  type: 'military' | 'guild' | 'political' | 'religious' | 'criminal' | 'other';
  /** Ranks within the faction */
  ranks: string[];
  /** Is this canonical? */
  isCanon: boolean;
}

export interface WorldAuthority {
  /** Valid locations */
  locations: Record<string, WorldLocation>;
  /** Valid factions */
  factions: Record<string, WorldFaction>;
  /** Valid titles */
  titles: string[];
  /** Whether to enforce strict canon */
  enforceCanon: boolean;
  /** Custom/AU additions flagged as non-canon */
  customAdditions: {
    locations: string[];
    factions: string[];
    npcs: string[];
  };
}

// ============================================================================
// MAIN SIMULATION STATE
// ============================================================================

export interface SimulationState {
  /** Version for migration purposes */
  version: number;
  /** Character ID this state belongs to */
  characterId: string;
  /** NPC Registry - all NPCs ever encountered */
  npcs: Record<string, NPC>;
  /** Current active scene */
  currentScene: Scene | null;
  /** Scene history */
  sceneHistory: Scene[];
  /** Player fact memory */
  playerFacts: PlayerFactMemory;
  /** Pending consequences */
  pendingConsequences: PendingConsequence[];
  /** World authority configuration */
  worldAuthority: WorldAuthority;
  /** Last update timestamp */
  lastUpdated: number;
}

// ============================================================================
// CANONICAL SKYRIM DATA
// ============================================================================

export const SKYRIM_HOLDS = [
  'Eastmarch', 'Falkreath', 'Haafingar', 'Hjaalmarch', 
  'The Pale', 'The Reach', 'The Rift', 'Whiterun', 'Winterhold'
];

export const SKYRIM_JARLS: Record<string, { jarl: string; capital: string }> = {
  'Eastmarch': { jarl: 'Ulfric Stormcloak', capital: 'Windhelm' },
  'Falkreath': { jarl: 'Siddgeir', capital: 'Falkreath' },
  'Haafingar': { jarl: 'Elisif the Fair', capital: 'Solitude' },
  'Hjaalmarch': { jarl: 'Idgrod Ravencrone', capital: 'Morthal' },
  'The Pale': { jarl: 'Skald the Elder', capital: 'Dawnstar' },
  'The Reach': { jarl: 'Igmund', capital: 'Markarth' },
  'The Rift': { jarl: 'Laila Law-Giver', capital: 'Riften' },
  'Whiterun': { jarl: 'Balgruuf the Greater', capital: 'Whiterun' },
  'Winterhold': { jarl: 'Korir', capital: 'Winterhold' }
};

export const SKYRIM_MAJOR_LOCATIONS: WorldLocation[] = [
  { name: 'Whiterun', hold: 'Whiterun', type: 'city', hasJarl: true, jarlName: 'Balgruuf the Greater', keyNPCs: ['Adrianne Avenicci', 'Belethor', 'Arcadia'], factions: ['Companions', 'Imperial Legion'], isCanon: true },
  { name: 'Solitude', hold: 'Haafingar', type: 'city', hasJarl: true, jarlName: 'Elisif the Fair', keyNPCs: ['Falk Firebeard', 'Viarmo'], factions: ['Imperial Legion', 'Bards College', 'East Empire Company'], isCanon: true },
  { name: 'Windhelm', hold: 'Eastmarch', type: 'city', hasJarl: true, jarlName: 'Ulfric Stormcloak', keyNPCs: ['Galmar Stone-Fist', 'Jorleif'], factions: ['Stormcloaks'], isCanon: true },
  { name: 'Riften', hold: 'The Rift', type: 'city', hasJarl: true, jarlName: 'Laila Law-Giver', keyNPCs: ['Maven Black-Briar', 'Brynjolf'], factions: ['Thieves Guild', 'Black-Briar Family'], isCanon: true },
  { name: 'Markarth', hold: 'The Reach', type: 'city', hasJarl: true, jarlName: 'Igmund', keyNPCs: ['Calcelmo', 'Ondolemar'], factions: ['Thalmor', 'Silver-Blood Family'], isCanon: true },
  { name: 'Riverwood', hold: 'Whiterun', type: 'village', hasJarl: false, keyNPCs: ['Alvor', 'Gerdur', 'Lucan Valerius'], factions: [], isCanon: true },
  { name: 'Rorikstead', hold: 'Whiterun', type: 'village', hasJarl: false, keyNPCs: ['Rorik', 'Lemkil'], factions: [], isCanon: true },
  { name: 'Ivarstead', hold: 'The Rift', type: 'village', hasJarl: false, keyNPCs: ['Wilhelm', 'Klimmek'], factions: [], isCanon: true },
  { name: 'Falkreath', hold: 'Falkreath', type: 'town', hasJarl: true, jarlName: 'Siddgeir', keyNPCs: ['Dengeir of Stuhn', 'Runil'], factions: [], isCanon: true },
  { name: 'Morthal', hold: 'Hjaalmarch', type: 'town', hasJarl: true, jarlName: 'Idgrod Ravencrone', keyNPCs: ['Falion', 'Idgrod the Younger'], factions: [], isCanon: true },
  { name: 'Dawnstar', hold: 'The Pale', type: 'town', hasJarl: true, jarlName: 'Skald the Elder', keyNPCs: ['Brina Merilis', 'Rustleif'], factions: [], isCanon: true },
  { name: 'Winterhold', hold: 'Winterhold', type: 'town', hasJarl: true, jarlName: 'Korir', keyNPCs: ['Savos Aren', 'Faralda'], factions: ['College of Winterhold'], isCanon: true },
];

export const SKYRIM_FACTIONS: WorldFaction[] = [
  { name: 'Imperial Legion', type: 'military', ranks: ['Auxiliary', 'Quaestor', 'Praefect', 'Tribune', 'Legate'], isCanon: true },
  { name: 'Stormcloaks', type: 'military', ranks: ['Unblooded', 'Ice-Veins', 'Bone-Breaker', 'Snow-Hammer', 'Stormblade'], isCanon: true },
  { name: 'Companions', type: 'guild', ranks: ['Whelp', 'Member', 'Circle Member', 'Harbinger'], isCanon: true },
  { name: 'Thieves Guild', type: 'criminal', ranks: ['Footpad', 'Bandit', 'Prowler', 'Cat Burglar', 'Shadowfoot', 'Master Thief', 'Guild Master'], isCanon: true },
  { name: 'Dark Brotherhood', type: 'criminal', ranks: ['Initiate', 'Slayer', 'Silencer', 'Speaker', 'Listener'], isCanon: true },
  { name: 'College of Winterhold', type: 'guild', ranks: ['Apprentice', 'Scholar', 'Wizard', 'Master Wizard', 'Arch-Mage'], isCanon: true },
  { name: 'Thalmor', type: 'political', ranks: ['Agent', 'Justiciar', 'Emissary', 'First Emissary'], isCanon: true },
  { name: 'Greybeards', type: 'religious', ranks: ['Novice', 'Greybeard'], isCanon: true },
  { name: 'Vigilants of Stendarr', type: 'religious', ranks: ['Acolyte', 'Vigilant', 'Keeper'], isCanon: true },
];

// ============================================================================
// STATE FACTORY & INITIALIZATION
// ============================================================================

export function createInitialSimulationState(characterId: string): SimulationState {
  const locations: Record<string, WorldLocation> = {};
  for (const loc of SKYRIM_MAJOR_LOCATIONS) {
    locations[loc.name.toLowerCase()] = loc;
  }

  const factions: Record<string, WorldFaction> = {};
  for (const faction of SKYRIM_FACTIONS) {
    factions[faction.name.toLowerCase()] = faction;
  }

  return {
    version: 1,
    characterId,
    npcs: {},
    currentScene: null,
    sceneHistory: [],
    playerFacts: {
      identity: {},
      situation: {},
      relationships: {},
      claims: {}
    },
    pendingConsequences: [],
    worldAuthority: {
      locations,
      factions,
      titles: ['Jarl', 'Thane', 'Housecarl', 'Steward', 'Court Wizard', 'Guard Captain', 'High King'],
      enforceCanon: true,
      customAdditions: {
        locations: [],
        factions: [],
        npcs: []
      }
    },
    lastUpdated: Date.now()
  };
}

// ============================================================================
// NPC MANAGEMENT
// ============================================================================

let npcIdCounter = 0;

export function generateNPCId(): string {
  return `npc_${Date.now()}_${++npcIdCounter}`;
}

export function createNPC(
  name: string,
  role: string,
  location: string,
  options?: Partial<NPC>
): NPC {
  return {
    id: generateNPCId(),
    name,
    role,
    disposition: 'neutral',
    knowledge: { facts: {}, learnedAt: {} },
    tolerance: 70,
    tension: 0,
    location,
    isPresent: true,
    interactionState: 'idle',
    introducedAt: Date.now(),
    lastInteraction: Date.now(),
    ...options
  };
}

export function findNPCByName(state: SimulationState, name: string): NPC | undefined {
  const normalizedName = name.toLowerCase().trim();
  return Object.values(state.npcs).find(
    npc => npc.name.toLowerCase() === normalizedName
  );
}

export function updateNPCDisposition(npc: NPC, change: number): NPCDisposition {
  const dispositionLevels: NPCDisposition[] = ['hostile', 'wary', 'neutral', 'friendly', 'allied'];
  const currentIndex = dispositionLevels.indexOf(npc.disposition);
  const newIndex = Math.max(0, Math.min(dispositionLevels.length - 1, currentIndex + change));
  return dispositionLevels[newIndex];
}

export function addNPCKnowledge(npc: NPC, factKey: string, factValue: string): void {
  npc.knowledge.facts[factKey] = factValue;
  npc.knowledge.learnedAt[factKey] = Date.now();
}

// ============================================================================
// SCENE MANAGEMENT
// ============================================================================

let sceneIdCounter = 0;

export function generateSceneId(): string {
  return `scene_${Date.now()}_${++sceneIdCounter}`;
}

export function createScene(
  type: Scene['type'],
  location: string,
  options?: Partial<Scene>
): Scene {
  return {
    id: generateSceneId(),
    type,
    location,
    phase: 'exploration',
    resolution: 'none',
    involvedNPCs: [],
    objectives: [],
    attempts: 0,
    maxAttempts: 3,
    exhaustedOptions: [],
    resolvedTopics: [],
    startedAt: Date.now(),
    events: [],
    ...options
  };
}

export function advanceScenePhase(scene: Scene, newPhase: ScenePhase): void {
  scene.phase = newPhase;
  scene.events.push(`Phase changed to: ${newPhase}`);
}

export function resolveScene(scene: Scene, resolution: SceneResolution): void {
  scene.phase = 'exit';
  scene.resolution = resolution;
  scene.endedAt = Date.now();
  scene.events.push(`Scene resolved: ${resolution}`);
}

export function exhaustDialogueOption(scene: Scene, option: string): void {
  if (!scene.exhaustedOptions.includes(option)) {
    scene.exhaustedOptions.push(option);
  }
}

export function markTopicResolved(scene: Scene, topic: string): void {
  if (!scene.resolvedTopics.includes(topic)) {
    scene.resolvedTopics.push(topic);
  }
}

// ============================================================================
// PLAYER FACT MANAGEMENT
// ============================================================================

export function recordPlayerFact(
  state: SimulationState,
  category: keyof PlayerFactMemory,
  key: string,
  value: string,
  source: PlayerFact['source'],
  disclosedTo: string[] = []
): void {
  state.playerFacts[category][key] = {
    key,
    value,
    establishedAt: Date.now(),
    disclosedTo,
    locked: source === 'character_creation',
    source
  };
}

export function hasPlayerFact(state: SimulationState, key: string): boolean {
  for (const category of Object.values(state.playerFacts)) {
    if (key in category) return true;
  }
  return false;
}

export function getPlayerFact(state: SimulationState, key: string): PlayerFact | undefined {
  for (const category of Object.values(state.playerFacts)) {
    if (key in category) return category[key];
  }
  return undefined;
}

export function disclosFactToNPC(state: SimulationState, factKey: string, npcId: string): void {
  for (const category of Object.values(state.playerFacts)) {
    if (factKey in category) {
      const fact = category[factKey];
      if (!fact.disclosedTo.includes(npcId)) {
        fact.disclosedTo.push(npcId);
      }
      
      // Also add to NPC's knowledge
      const npc = state.npcs[npcId];
      if (npc) {
        addNPCKnowledge(npc, factKey, fact.value);
      }
      return;
    }
  }
}

// ============================================================================
// CONSEQUENCE MANAGEMENT
// ============================================================================

let consequenceIdCounter = 0;

export function generateConsequenceId(): string {
  return `consequence_${Date.now()}_${++consequenceIdCounter}`;
}

export function addPendingConsequence(
  state: SimulationState,
  type: ConsequenceType,
  description: string,
  triggerCondition: PendingConsequence['triggerCondition'],
  data?: Record<string, any>
): void {
  state.pendingConsequences.push({
    id: generateConsequenceId(),
    type,
    description,
    triggerCondition,
    applied: false,
    data
  });
}

export function checkAndApplyConsequences(
  state: SimulationState,
  context: {
    currentTension?: number;
    currentAttempts?: number;
    currentPhase?: ScenePhase;
    playerAction?: string;
  }
): PendingConsequence[] {
  const applied: PendingConsequence[] = [];
  
  for (const consequence of state.pendingConsequences) {
    if (consequence.applied) continue;
    
    const { triggerCondition } = consequence;
    let shouldApply = false;
    
    if (triggerCondition.tensionThreshold !== undefined && 
        context.currentTension !== undefined &&
        context.currentTension >= triggerCondition.tensionThreshold) {
      shouldApply = true;
    }
    
    if (triggerCondition.attemptsExceeded && 
        context.currentAttempts !== undefined &&
        state.currentScene &&
        context.currentAttempts >= state.currentScene.maxAttempts) {
      shouldApply = true;
    }
    
    if (triggerCondition.phaseReached && 
        context.currentPhase === triggerCondition.phaseReached) {
      shouldApply = true;
    }
    
    if (triggerCondition.playerAction && 
        context.playerAction &&
        context.playerAction.toLowerCase().includes(triggerCondition.playerAction.toLowerCase())) {
      shouldApply = true;
    }
    
    if (shouldApply) {
      consequence.applied = true;
      applied.push(consequence);
    }
  }
  
  return applied;
}

// ============================================================================
// WORLD AUTHORITY VALIDATION
// ============================================================================

export function validateLocation(state: SimulationState, locationName: string): { valid: boolean; canonical: boolean; warning?: string } {
  const normalized = locationName.toLowerCase();
  const location = state.worldAuthority.locations[normalized];
  
  if (location) {
    return { valid: true, canonical: location.isCanon };
  }
  
  if (state.worldAuthority.customAdditions.locations.includes(normalized)) {
    return { valid: true, canonical: false };
  }
  
  return { 
    valid: !state.worldAuthority.enforceCanon, 
    canonical: false,
    warning: `Location "${locationName}" is not in canonical Skyrim lore.`
  };
}

export function validateTitle(state: SimulationState, title: string, location: string): { valid: boolean; warning?: string } {
  const normalizedTitle = title.toLowerCase();
  const normalizedLocation = location.toLowerCase();
  
  // Check if title is valid
  if (!state.worldAuthority.titles.map(t => t.toLowerCase()).includes(normalizedTitle)) {
    return { valid: false, warning: `"${title}" is not a recognized title in Skyrim.` };
  }
  
  // Special check: Jarl title
  if (normalizedTitle === 'jarl') {
    const loc = state.worldAuthority.locations[normalizedLocation];
    if (loc && !loc.hasJarl) {
      return { 
        valid: false, 
        warning: `${location} does not have a Jarl. Only hold capitals have Jarls.` 
      };
    }
  }
  
  return { valid: true };
}

export function addCustomLocation(state: SimulationState, location: WorldLocation): void {
  const normalized = location.name.toLowerCase();
  state.worldAuthority.locations[normalized] = { ...location, isCanon: false };
  state.worldAuthority.customAdditions.locations.push(normalized);
}

// ============================================================================
// STATE SERIALIZATION
// ============================================================================

export function serializeSimulationState(state: SimulationState): string {
  return JSON.stringify(state);
}

export function deserializeSimulationState(json: string): SimulationState | null {
  try {
    const parsed = JSON.parse(json);
    // Migration logic can be added here based on version
    return parsed as SimulationState;
  } catch {
    return null;
  }
}

// ============================================================================
// CONTEXT BUILDER FOR AI PROMPT
// ============================================================================

export function buildSimulationContext(state: SimulationState): string {
  const sections: string[] = [];
  
  // Current Scene
  if (state.currentScene) {
    const scene = state.currentScene;
    sections.push(`CURRENT SCENE:
- Type: ${scene.type}
- Location: ${scene.location}
- Phase: ${scene.phase}
- Attempts: ${scene.attempts}/${scene.maxAttempts}
- Resolved Topics: ${scene.resolvedTopics.join(', ') || 'none'}
- Exhausted Options: ${scene.exhaustedOptions.join(', ') || 'none'}`);
  }
  
  // Present NPCs
  const presentNPCs = Object.values(state.npcs).filter(npc => npc.isPresent);
  if (presentNPCs.length > 0) {
    const npcDetails = presentNPCs.map(npc => {
      const knownFacts = Object.entries(npc.knowledge.facts)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      return `  - ${npc.name} (${npc.role})
    * ID: ${npc.id} [IMMUTABLE - never change this NPC's name or role]
    * Disposition: ${npc.disposition}
    * Tension: ${npc.tension}/100 (tolerance: ${npc.tolerance})
    * State: ${npc.interactionState}
    * Knows about player: ${knownFacts || 'nothing'}`;
    }).join('\n');
    
    sections.push(`PRESENT NPCs (MAINTAIN IDENTITY CONSISTENCY):
${npcDetails}`);
  }
  
  // Player Facts
  const allFacts: string[] = [];
  for (const [category, facts] of Object.entries(state.playerFacts)) {
    for (const [key, fact] of Object.entries(facts as Record<string, PlayerFact>)) {
      allFacts.push(`  - [${category}] ${key}: "${fact.value}" (disclosed to: ${fact.disclosedTo.length} NPCs)`);
    }
  }
  if (allFacts.length > 0) {
    sections.push(`ESTABLISHED PLAYER FACTS (DO NOT RE-ASK):
${allFacts.join('\n')}`);
  }
  
  // Pending Consequences
  const activeConsequences = state.pendingConsequences.filter(c => !c.applied);
  if (activeConsequences.length > 0) {
    const consequenceList = activeConsequences.map(c => 
      `  - ${c.type}: ${c.description}`
    ).join('\n');
    sections.push(`PENDING CONSEQUENCES (MUST TRIGGER WHEN CONDITIONS MET):
${consequenceList}`);
  }
  
  return sections.join('\n\n');
}

// ============================================================================
// DIALOGUE OPTION PRUNING
// ============================================================================

export interface DialogueOption {
  label: string;
  playerText: string;
  topic?: string;
  requirement?: string;
}

export function pruneDialogueOptions(
  options: DialogueOption[],
  scene: Scene,
  playerFacts: PlayerFactMemory
): DialogueOption[] {
  return options.filter(option => {
    // Remove if option topic is already resolved
    if (option.topic && scene.resolvedTopics.includes(option.topic)) {
      return false;
    }
    
    // Remove if this exact option was already exhausted
    if (scene.exhaustedOptions.includes(option.label)) {
      return false;
    }
    
    // Remove if option relates to a fact already established
    // (e.g., "Explain I'm an alchemist" when profession is already disclosed)
    const optionLower = option.playerText.toLowerCase();
    for (const category of Object.values(playerFacts)) {
      for (const fact of Object.values(category as Record<string, PlayerFact>)) {
        if (optionLower.includes(fact.value.toLowerCase()) && fact.disclosedTo.length > 0) {
          // Check if this fact has already been disclosed in current scene
          return false;
        }
      }
    }
    
    return true;
  });
}
