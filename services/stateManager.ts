/**
 * SIMULATION STATE MANAGER
 * 
 * This service manages the persistence and runtime operations of the simulation state.
 * It handles saving/loading from Firestore or localStorage, and provides methods
 * for common state operations.
 */

import {
  SimulationState,
  NPC,
  Scene,
  PlayerFact,
  PendingConsequence,
  ConsequenceType,
  ScenePhase,
  SceneResolution,
  NPCDisposition,
  createInitialSimulationState,
  createNPC,
  createScene,
  findNPCByName,
  updateNPCDisposition,
  addNPCKnowledge,
  advanceScenePhase,
  resolveScene,
  exhaustDialogueOption,
  markTopicResolved,
  recordPlayerFact,
  hasPlayerFact,
  getPlayerFact,
  disclosFactToNPC,
  addPendingConsequence,
  checkAndApplyConsequences,
  validateLocation,
  validateTitle,
  buildSimulationContext,
  serializeSimulationState,
  deserializeSimulationState
} from './simulationState';

// Re-export types for convenience
export type {
  SimulationState,
  NPC,
  Scene,
  PlayerFact,
  PendingConsequence,
  ConsequenceType,
  ScenePhase,
  SceneResolution,
  NPCDisposition
};

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEY_PREFIX = 'aetherius:simulation:';

function getStorageKey(characterId: string): string {
  return `${STORAGE_KEY_PREFIX}${characterId}`;
}

// ============================================================================
// STATE MANAGER CLASS
// ============================================================================

export class SimulationStateManager {
  private state: SimulationState;
  private userId: string | null;
  private characterId: string;
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private dirty: boolean = false;

  constructor(characterId: string, userId: string | null = null) {
    this.characterId = characterId;
    this.userId = userId;
    this.state = createInitialSimulationState(characterId);
  }

  // --------------------------------------------------------------------------
  // STATE ACCESS
  // --------------------------------------------------------------------------

  getState(): SimulationState {
    return this.state;
  }

  getCharacterId(): string {
    return this.characterId;
  }

  // --------------------------------------------------------------------------
  // PERSISTENCE
  // --------------------------------------------------------------------------

  async load(): Promise<void> {
    if (this.userId) {
      // Try Firestore first
      try {
        const { loadSimulationState } = await import('./firestore');
        const loaded = await loadSimulationState(this.userId, this.characterId);
        if (loaded) {
          this.state = loaded as SimulationState;
          return;
        }
      } catch (e) {
        console.warn('Failed to load simulation state from Firestore, falling back to localStorage', e);
      }
    }

    // Fall back to localStorage
    try {
      const key = getStorageKey(this.characterId);
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = deserializeSimulationState(raw);
        if (parsed && parsed.characterId === this.characterId) {
          this.state = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load simulation state from localStorage', e);
    }
  }

  async save(): Promise<void> {
    this.state.lastUpdated = Date.now();
    
    if (this.userId) {
      try {
        const { saveSimulationState } = await import('./firestore');
        await saveSimulationState(this.userId, this.characterId, this.state);
      } catch (e) {
        console.warn('Failed to save simulation state to Firestore, falling back to localStorage', e);
        this.saveToLocalStorage();
      }
    } else {
      this.saveToLocalStorage();
    }
    
    this.dirty = false;
  }

  private saveToLocalStorage(): void {
    try {
      const key = getStorageKey(this.characterId);
      const serialized = serializeSimulationState(this.state);
      localStorage.setItem(key, serialized);
    } catch (e) {
      console.warn('Failed to save simulation state to localStorage', e);
    }
  }

  scheduleSave(): void {
    this.dirty = true;
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.save();
    }, 2000);
  }

  async forceSave(): Promise<void> {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
    if (this.dirty) {
      await this.save();
    }
  }

  // --------------------------------------------------------------------------
  // NPC OPERATIONS
  // --------------------------------------------------------------------------

  introduceNPC(name: string, role: string, location: string, options?: Partial<NPC>): NPC {
    // Check if NPC already exists
    const existing = findNPCByName(this.state, name);
    if (existing) {
      // Update presence and return existing
      existing.isPresent = true;
      existing.lastInteraction = Date.now();
      this.scheduleSave();
      return existing;
    }

    // Create new NPC
    const npc = createNPC(name, role, location, options);
    this.state.npcs[npc.id] = npc;
    
    // Add to current scene if one exists
    if (this.state.currentScene) {
      this.state.currentScene.involvedNPCs.push(npc.id);
    }
    
    this.scheduleSave();
    return npc;
  }

  getNPC(id: string): NPC | undefined {
    return this.state.npcs[id];
  }

  getNPCByName(name: string): NPC | undefined {
    return findNPCByName(this.state, name);
  }

  getPresentNPCs(): NPC[] {
    return Object.values(this.state.npcs).filter(npc => npc.isPresent);
  }

  updateNPCTension(npcId: string, change: number): { newTension: number; consequences: PendingConsequence[] } {
    const npc = this.state.npcs[npcId];
    if (!npc) {
      return { newTension: 0, consequences: [] };
    }

    npc.tension = Math.max(0, Math.min(100, npc.tension + change));
    npc.lastInteraction = Date.now();

    // Check for automatic consequences
    const consequences = checkAndApplyConsequences(this.state, {
      currentTension: npc.tension,
      currentAttempts: this.state.currentScene?.attempts,
      currentPhase: this.state.currentScene?.phase
    });

    this.scheduleSave();
    return { newTension: npc.tension, consequences };
  }

  changeNPCDisposition(npcId: string, change: number): NPCDisposition {
    const npc = this.state.npcs[npcId];
    if (!npc) {
      return 'neutral';
    }

    npc.disposition = updateNPCDisposition(npc, change);
    npc.lastInteraction = Date.now();
    this.scheduleSave();
    return npc.disposition;
  }

  teachNPCFact(npcId: string, factKey: string, factValue: string): void {
    const npc = this.state.npcs[npcId];
    if (npc) {
      addNPCKnowledge(npc, factKey, factValue);
      npc.lastInteraction = Date.now();
      this.scheduleSave();
    }
  }

  dismissNPC(npcId: string): void {
    const npc = this.state.npcs[npcId];
    if (npc) {
      npc.isPresent = false;
      npc.interactionState = 'idle';
      this.scheduleSave();
    }
  }

  dismissAllNPCs(): void {
    for (const npc of Object.values(this.state.npcs)) {
      npc.isPresent = false;
      npc.interactionState = 'idle';
    }
    this.scheduleSave();
  }

  // --------------------------------------------------------------------------
  // SCENE OPERATIONS
  // --------------------------------------------------------------------------

  startScene(type: Scene['type'], location: string, options?: Partial<Scene>): Scene {
    // Archive current scene if it exists
    if (this.state.currentScene) {
      if (this.state.currentScene.phase !== 'exit') {
        this.state.currentScene.phase = 'exit';
        this.state.currentScene.resolution = 'none';
        this.state.currentScene.endedAt = Date.now();
      }
      this.state.sceneHistory.push(this.state.currentScene);
    }

    // Create new scene
    const scene = createScene(type, location, options);
    this.state.currentScene = scene;
    
    this.scheduleSave();
    return scene;
  }

  getCurrentScene(): Scene | null {
    return this.state.currentScene;
  }

  advancePhase(newPhase: ScenePhase): void {
    if (this.state.currentScene) {
      advanceScenePhase(this.state.currentScene, newPhase);
      this.scheduleSave();
    }
  }

  resolveCurrentScene(resolution: SceneResolution): void {
    if (this.state.currentScene) {
      resolveScene(this.state.currentScene, resolution);
      this.scheduleSave();
    }
  }

  incrementAttempts(): number {
    if (this.state.currentScene) {
      this.state.currentScene.attempts++;
      this.scheduleSave();
      return this.state.currentScene.attempts;
    }
    return 0;
  }

  exhaustOption(option: string): void {
    if (this.state.currentScene) {
      exhaustDialogueOption(this.state.currentScene, option);
      this.scheduleSave();
    }
  }

  resolveTopic(topic: string): void {
    if (this.state.currentScene) {
      markTopicResolved(this.state.currentScene, topic);
      this.scheduleSave();
    }
  }

  addSceneEvent(event: string): void {
    if (this.state.currentScene) {
      this.state.currentScene.events.push(event);
      this.scheduleSave();
    }
  }

  // --------------------------------------------------------------------------
  // PLAYER FACT OPERATIONS
  // --------------------------------------------------------------------------

  recordFact(
    category: 'identity' | 'situation' | 'relationships' | 'claims',
    key: string,
    value: string,
    source: PlayerFact['source'] = 'player_statement',
    disclosedTo: string[] = []
  ): void {
    recordPlayerFact(this.state, category, key, value, source, disclosedTo);
    this.scheduleSave();
  }

  hasFact(key: string): boolean {
    return hasPlayerFact(this.state, key);
  }

  getFact(key: string): PlayerFact | undefined {
    return getPlayerFact(this.state, key);
  }

  discloseFact(factKey: string, npcId: string): void {
    disclosFactToNPC(this.state, factKey, npcId);
    this.scheduleSave();
  }

  getAllFacts(): Record<string, PlayerFact> {
    const allFacts: Record<string, PlayerFact> = {};
    for (const category of Object.values(this.state.playerFacts)) {
      for (const [key, fact] of Object.entries(category as Record<string, PlayerFact>)) {
        allFacts[key] = fact;
      }
    }
    return allFacts;
  }

  // --------------------------------------------------------------------------
  // CONSEQUENCE OPERATIONS
  // --------------------------------------------------------------------------

  addConsequence(
    type: ConsequenceType,
    description: string,
    triggerCondition: PendingConsequence['triggerCondition'],
    data?: Record<string, any>
  ): void {
    addPendingConsequence(this.state, type, description, triggerCondition, data);
    this.scheduleSave();
  }

  checkConsequences(context: {
    currentTension?: number;
    currentAttempts?: number;
    currentPhase?: ScenePhase;
    playerAction?: string;
  }): PendingConsequence[] {
    const applied = checkAndApplyConsequences(this.state, context);
    if (applied.length > 0) {
      this.scheduleSave();
    }
    return applied;
  }

  getPendingConsequences(): PendingConsequence[] {
    return this.state.pendingConsequences.filter(c => !c.applied);
  }

  // --------------------------------------------------------------------------
  // WORLD AUTHORITY OPERATIONS
  // --------------------------------------------------------------------------

  validateLocationName(locationName: string): { valid: boolean; canonical: boolean; warning?: string } {
    return validateLocation(this.state, locationName);
  }

  validateTitleAtLocation(title: string, location: string): { valid: boolean; warning?: string } {
    return validateTitle(this.state, title, location);
  }

  isCanonEnforced(): boolean {
    return this.state.worldAuthority.enforceCanon;
  }

  setCanonEnforcement(enforce: boolean): void {
    this.state.worldAuthority.enforceCanon = enforce;
    this.scheduleSave();
  }

  // --------------------------------------------------------------------------
  // CONTEXT BUILDING
  // --------------------------------------------------------------------------

  buildContext(): string {
    return buildSimulationContext(this.state);
  }

  // --------------------------------------------------------------------------
  // STATE RESET
  // --------------------------------------------------------------------------

  reset(): void {
    this.state = createInitialSimulationState(this.characterId);
    this.scheduleSave();
  }

  clearSceneHistory(): void {
    this.state.sceneHistory = [];
    this.scheduleSave();
  }
}

// ============================================================================
// MANAGER INSTANCE CACHE
// ============================================================================

const managerCache = new Map<string, SimulationStateManager>();

export function getSimulationManager(
  characterId: string,
  userId: string | null = null
): SimulationStateManager {
  const cacheKey = `${userId || 'local'}:${characterId}`;
  
  let manager = managerCache.get(cacheKey);
  if (!manager) {
    manager = new SimulationStateManager(characterId, userId);
    managerCache.set(cacheKey, manager);
  }
  
  return manager;
}

export function clearManagerCache(): void {
  managerCache.clear();
}

// ============================================================================
// AI RESPONSE PROCESSOR
// ============================================================================

export interface AISimulationUpdate {
  // NPC operations
  npcsIntroduced?: Array<{
    name: string;
    role: string;
    location?: string;
    disposition?: NPCDisposition;
    description?: string;
    personality?: string;
    faction?: string;
  }>;
  npcUpdates?: Array<{
    name: string;
    tensionChange?: number;
    dispositionChange?: number;
    newKnowledge?: Record<string, string>;
    interactionState?: NPC['interactionState'];
    dismissed?: boolean;
  }>;
  
  // Scene operations
  sceneStart?: {
    type: Scene['type'];
    location: string;
  };
  phaseChange?: ScenePhase;
  sceneResolution?: SceneResolution;
  topicsResolved?: string[];
  optionsExhausted?: string[];
  sceneEvents?: string[];
  
  // Player facts
  factsEstablished?: Array<{
    category: 'identity' | 'situation' | 'relationships' | 'claims';
    key: string;
    value: string;
    disclosedToNPCs?: string[];
  }>;
  factsDisclosed?: Array<{
    factKey: string;
    toNPCNames: string[];
  }>;
  
  // Consequences
  consequencesTriggered?: ConsequenceType[];
  newConsequences?: Array<{
    type: ConsequenceType;
    description: string;
    triggerCondition: {
      tensionThreshold?: number;
      attemptsExceeded?: boolean;
      phaseReached?: string; // Use string to match types.ts definition
      playerAction?: string;
    };
  }>;
  
  // World validation warnings
  worldWarnings?: string[];
}

export function processAISimulationUpdate(
  manager: SimulationStateManager,
  update: AISimulationUpdate
): { warnings: string[]; appliedChanges: string[] } {
  const warnings: string[] = [];
  const appliedChanges: string[] = [];

  // Process NPC introductions
  if (update.npcsIntroduced) {
    for (const npcData of update.npcsIntroduced) {
      const location = npcData.location || manager.getCurrentScene()?.location || 'Unknown';
      const npc = manager.introduceNPC(npcData.name, npcData.role, location, {
        disposition: npcData.disposition,
        description: npcData.description,
        personality: npcData.personality,
        faction: npcData.faction
      });
      appliedChanges.push(`Introduced NPC: ${npc.name} (${npc.role})`);
    }
  }

  // Process NPC updates
  if (update.npcUpdates) {
    for (const npcUpdate of update.npcUpdates) {
      const npc = manager.getNPCByName(npcUpdate.name);
      if (!npc) {
        warnings.push(`NPC "${npcUpdate.name}" not found for update`);
        continue;
      }

      if (npcUpdate.tensionChange !== undefined) {
        const { newTension, consequences } = manager.updateNPCTension(npc.id, npcUpdate.tensionChange);
        appliedChanges.push(`${npc.name} tension: ${newTension}`);
        
        for (const c of consequences) {
          appliedChanges.push(`Consequence triggered: ${c.type}`);
        }
      }

      if (npcUpdate.dispositionChange !== undefined) {
        const newDisposition = manager.changeNPCDisposition(npc.id, npcUpdate.dispositionChange);
        appliedChanges.push(`${npc.name} disposition: ${newDisposition}`);
      }

      if (npcUpdate.newKnowledge) {
        for (const [key, value] of Object.entries(npcUpdate.newKnowledge)) {
          manager.teachNPCFact(npc.id, key, value);
          appliedChanges.push(`${npc.name} learned: ${key}`);
        }
      }

      if (npcUpdate.interactionState) {
        const npcObj = manager.getNPC(npc.id);
        if (npcObj) {
          npcObj.interactionState = npcUpdate.interactionState;
        }
      }

      if (npcUpdate.dismissed) {
        manager.dismissNPC(npc.id);
        appliedChanges.push(`${npc.name} left the scene`);
      }
    }
  }

  // Process scene operations
  if (update.sceneStart) {
    const scene = manager.startScene(update.sceneStart.type, update.sceneStart.location);
    appliedChanges.push(`Scene started: ${scene.type} at ${scene.location}`);
  }

  if (update.phaseChange) {
    manager.advancePhase(update.phaseChange);
    appliedChanges.push(`Scene phase: ${update.phaseChange}`);
  }

  if (update.sceneResolution) {
    manager.resolveCurrentScene(update.sceneResolution);
    appliedChanges.push(`Scene resolved: ${update.sceneResolution}`);
  }

  if (update.topicsResolved) {
    for (const topic of update.topicsResolved) {
      manager.resolveTopic(topic);
      appliedChanges.push(`Topic resolved: ${topic}`);
    }
  }

  if (update.optionsExhausted) {
    for (const option of update.optionsExhausted) {
      manager.exhaustOption(option);
    }
  }

  if (update.sceneEvents) {
    for (const event of update.sceneEvents) {
      manager.addSceneEvent(event);
    }
  }

  // Process player facts
  if (update.factsEstablished) {
    for (const fact of update.factsEstablished) {
      manager.recordFact(fact.category, fact.key, fact.value, 'player_statement', []);
      appliedChanges.push(`Fact established: ${fact.key} = ${fact.value}`);

      // Disclose to specified NPCs
      if (fact.disclosedToNPCs) {
        for (const npcName of fact.disclosedToNPCs) {
          const npc = manager.getNPCByName(npcName);
          if (npc) {
            manager.discloseFact(fact.key, npc.id);
          }
        }
      }
    }
  }

  if (update.factsDisclosed) {
    for (const disclosure of update.factsDisclosed) {
      for (const npcName of disclosure.toNPCNames) {
        const npc = manager.getNPCByName(npcName);
        if (npc) {
          manager.discloseFact(disclosure.factKey, npc.id);
          appliedChanges.push(`Disclosed "${disclosure.factKey}" to ${npcName}`);
        }
      }
    }
  }

  // Process consequences
  if (update.newConsequences) {
    for (const consequence of update.newConsequences) {
      // Cast phaseReached to ScenePhase if present
      const triggerCondition: PendingConsequence['triggerCondition'] = {
        ...consequence.triggerCondition,
        phaseReached: consequence.triggerCondition.phaseReached as ScenePhase | undefined
      };
      manager.addConsequence(consequence.type, consequence.description, triggerCondition);
      appliedChanges.push(`Consequence queued: ${consequence.type}`);
    }
  }

  // Add world warnings
  if (update.worldWarnings) {
    warnings.push(...update.worldWarnings);
  }

  return { warnings, appliedChanges };
}
