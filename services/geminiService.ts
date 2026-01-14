
import { GoogleGenAI } from "@google/genai";
import { GameStateUpdate, GeneratedCharacterData } from "../types";

// ========== AVAILABLE MODELS ==========
// Only these models are available and should be used:
const AVAILABLE_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemma-3-12b',
  'gemma-3-1b',
  'gemma-3-27b',
  'gemma-3-2b',
  'gemma-3-4b',
] as const;

type AvailableModel = typeof AVAILABLE_MODELS[number];

// Fallback chains for different use cases
const TEXT_MODEL_FALLBACK_CHAIN: AvailableModel[] = [
  'gemini-2.5-flash-lite',  // Fastest, lowest resource usage
  'gemini-2.5-flash',       // Balanced performance
  'gemma-3-27b',           // Largest Gemma model
  'gemma-3-12b',           // Large Gemma model
  'gemma-3-4b',            // Medium Gemma model
  'gemma-3-2b',            // Small Gemma model
  'gemma-3-1b',            // Smallest Gemma model
];

const IMAGE_MODEL_FALLBACK_CHAIN: AvailableModel[] = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];

export type PreferredAIModel = AvailableModel;

export const PREFERRED_AI_MODELS: Array<{ id: PreferredAIModel; label: string }> = [
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (Fastest)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Balanced)' },
  { id: 'gemma-3-27b', label: 'Gemma 3 27B (Largest)' },
  { id: 'gemma-3-12b', label: 'Gemma 3 12B (Large)' },
  { id: 'gemma-3-4b', label: 'Gemma 3 4B (Medium)' },
  { id: 'gemma-3-2b', label: 'Gemma 3 2B (Small)' },
  { id: 'gemma-3-1b', label: 'Gemma 3 1B (Smallest)' },
];

const viteEnv: any = (import.meta as any).env || {};

// ========== API KEY MANAGEMENT (3 keys) ==========
const getGeminiApiKey1 = () =>
  viteEnv.VITE_API_KEY ||
  viteEnv.VITE_GEMINI_API_KEY ||
  process.env.API_KEY ||
  process.env.GEMINI_API_KEY ||
  '';

const getGeminiApiKey2 = () =>
  viteEnv.VITE_GEMINI_API_KEY_2 ||
  process.env.GEMINI_API_KEY_2 ||
  '';

const getGeminiApiKey3 = () =>
  viteEnv.VITE_GEMINI_API_KEY_3 ||
  process.env.GEMINI_API_KEY_3 ||
  '';

const getGemmaApiKey = () =>
  viteEnv.VITE_GEMMA_API_KEY ||
  process.env.GEMMA_API_KEY ||
  process.env.gemma_api_key ||
  '';

// Get all available API keys (dynamically checks for unlimited keys)
const getAllApiKeys = (): string[] => {
  const keys: string[] = [];
  
  // Add primary keys
  const key1 = getGeminiApiKey1();
  const key2 = getGeminiApiKey2();
  const key3 = getGeminiApiKey3();
  
  if (key1) keys.push(key1);
  if (key2) keys.push(key2);
  if (key3) keys.push(key3);
  
  // Dynamically check for additional keys (KEY_4, KEY_5, etc.)
  for (let i = 4; i <= 20; i++) {
    const key = viteEnv[`VITE_GEMINI_API_KEY_${i}`] || 
                process.env[`GEMINI_API_KEY_${i}`] ||
                viteEnv[`VITE_API_KEY_${i}`] ||
                process.env[`API_KEY_${i}`];
    if (key) keys.push(key);
  }
  
  // Add Gemma key if different
  const gemmaKey = getGemmaApiKey();
  if (gemmaKey && !keys.includes(gemmaKey)) keys.push(gemmaKey);
  
  // DEBUG: Log available keys (without exposing full keys)
  console.log(`[Gemini Service] Available API keys: ${keys.length}`);
  if (keys.length > 0) {
    console.log(`[Gemini Service] Key suffixes: ${keys.map(k => k.slice(-4)).join(', ')}`);
  } else {
    console.warn(`[Gemini Service] No API keys found! Check your environment variables.`);
  }
  
  return keys;
};

// Track API key and model cooldowns to avoid rapid thrashing on 429 / overload.
// Keyed by full key string (never logged in full).
const apiKeyCooldownUntil = new Map<string, number>();
const modelCooldownUntil = new Map<string, number>();

const DEFAULT_KEY_COOLDOWN_MS = 60000;
const DEFAULT_MODEL_COOLDOWN_MS = 15000;

const isCoolingDown = (untilMs?: number): boolean => (untilMs || 0) > Date.now();

const getCooldownRemainingMs = (untilMs?: number): number => Math.max(0, (untilMs || 0) - Date.now());

const markKeyCooldown = (key: string, cooldownMs: number, reason?: string) => {
  const ms = Math.max(1000, Math.floor(cooldownMs || DEFAULT_KEY_COOLDOWN_MS));
  apiKeyCooldownUntil.set(key, Date.now() + ms);
  console.warn(`[Gemini Service] Key ...${key.slice(-4)} cooling down for ${Math.ceil(ms / 1000)}s${reason ? ` (${reason})` : ''}.`);
};

const markModelCooldown = (model: string, cooldownMs: number, reason?: string) => {
  const ms = Math.max(1000, Math.floor(cooldownMs || DEFAULT_MODEL_COOLDOWN_MS));
  modelCooldownUntil.set(model, Date.now() + ms);
  console.warn(`[Gemini Service] Model ${model} cooling down for ${Math.ceil(ms / 1000)}s${reason ? ` (${reason})` : ''}.`);
};

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitState {
  callsThisMinute: number[];
  callsThisHour: number[];
}

const rateLimitState: RateLimitState = {
  callsThisMinute: [],
  callsThisHour: []
};

const MAX_CALLS_PER_MINUTE = 15;
const MAX_CALLS_PER_HOUR = 100;

const recordApiCall = () => {
  const now = Date.now();
  rateLimitState.callsThisMinute.push(now);
  rateLimitState.callsThisHour.push(now);
  
  // Clean up old entries
  const oneMinuteAgo = now - 60000;
  const oneHourAgo = now - 3600000;
  
  rateLimitState.callsThisMinute = rateLimitState.callsThisMinute.filter(t => t > oneMinuteAgo);
  rateLimitState.callsThisHour = rateLimitState.callsThisHour.filter(t => t > oneHourAgo);
};

export const getRateLimitStats = () => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const oneHourAgo = now - 3600000;
  
  // Clean up old entries
  rateLimitState.callsThisMinute = rateLimitState.callsThisMinute.filter(t => t > oneMinuteAgo);
  rateLimitState.callsThisHour = rateLimitState.callsThisHour.filter(t => t > oneHourAgo);
  
  return {
    callsThisMinute: rateLimitState.callsThisMinute.length,
    callsThisHour: rateLimitState.callsThisHour.length,
    maxPerMinute: MAX_CALLS_PER_MINUTE,
    maxPerHour: MAX_CALLS_PER_HOUR,
    lastCallTime: rateLimitState.callsThisMinute[rateLimitState.callsThisMinute.length - 1]
  };
};

export const isRateLimited = (): boolean => {
  const stats = getRateLimitStats();
  return stats.callsThisMinute >= stats.maxPerMinute || stats.callsThisHour >= stats.maxPerHour;
};

// ============================================================================
// RESPONSE VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized: any;
}

export interface ValidationOptions {
  allowMechanical?: boolean; // If false, mechanical fields (gold/xp/items/stats) are forbidden and will be stripped
}

const MECHANICAL_TEXT_PATTERNS: Array<[RegExp, string]> = [
  [/\+\s*\d+\s*(gold|gp|g)\b/gi, 'some coin'],
  [/gained\s+\d+\s+(gold|gp|g)\b/gi, 'found some coin'],
  [/gained\s+\d+\s+experience\b/gi, 'learned something useful'],
  [/\+\s*\d+\s*(xp|experience)\b/gi, 'earned experience'],
  [/you\s+(?:drink|consume|used?)\s+[^\.\,\n]*/gi, 'you use an item'],
  [/regain(?:ed)?\s+\d+\s+(health|hp|stamina|magicka)\b/gi, 'feel restored'],
  [/lost\s+\d+\s+(health|hp|stamina|magicka)\b/gi, 'took damage'],
  [/\b\d+\s+gold\b/gi, 'some coin'],
  [/\b\+?\d+\s*xp\b/gi, 'some experience']
];

const sanitizeNarrativeMechanics = (text: string): { sanitized: string; found: string[] } => {
  if (!text || typeof text !== 'string') return { sanitized: text, found: [] };
  let sanitized = text;
  const found: string[] = [];

  for (const [rx, replacement] of MECHANICAL_TEXT_PATTERNS) {
    if (rx.test(sanitized)) {
      found.push(rx.toString());
      sanitized = sanitized.replace(rx, replacement);
    }
  }

  // Remove explicit patterns like "\+50 gold" or "+50 XP" left-over symbols
  sanitized = sanitized.replace(/\+\d+\s*(xp|gold|gp|g)?/gi, '');
  sanitized = sanitized.replace(/\b\d+\s*(xp|gold|gp|g)\b/gi, '');

  return { sanitized: sanitized.trim(), found };
};

export const validateGameStateUpdate = (response: any, options: ValidationOptions = {}): ValidationResult => {
  const errors: string[] = [];
  const sanitized: any = {};
  // Default behavior: allow mechanical fields unless explicitly disabled (adventure mode disables them)
  const allowMechanical = options.allowMechanical !== false;

  // Validate narrative
  if (response.narrative) {
    if (typeof response.narrative === 'string') {
      sanitized.narrative = { title: 'Adventure', content: response.narrative };
    } else if (typeof response.narrative === 'object') {
      sanitized.narrative = {
        title: typeof response.narrative.title === 'string' ? response.narrative.title : 'Adventure',
        content: typeof response.narrative.content === 'string' ? response.narrative.content : ''
      };
    } else {
      errors.push('Invalid narrative format');
    }

    // Always sanitize narrative for any mechanical text when in adventure mode (no mechanical changes allowed)
    if (!allowMechanical && sanitized.narrative && sanitized.narrative.content) {
      const { sanitized: s, found } = sanitizeNarrativeMechanics(sanitized.narrative.content);
      if (found.length > 0) {
        errors.push('Narrative contains mechanical descriptions which were removed for safety.');
        sanitized.narrative.content = s;
      }
    }
  }

  // Validate newQuests
  if (response.newQuests) {
    if (!Array.isArray(response.newQuests)) {
      errors.push('newQuests must be an array');
    } else {
      sanitized.newQuests = response.newQuests.filter((q: any) => {
        if (!q.title || typeof q.title !== 'string') return false;
        if (!q.description || typeof q.description !== 'string') return false;
        return true;
      }).map((q: any) => ({
        title: q.title,
        description: q.description,
        location: typeof q.location === 'string' ? q.location : undefined,
        dueDate: typeof q.dueDate === 'string' ? q.dueDate : undefined,
        objectives: Array.isArray(q.objectives) ? q.objectives.filter((o: any) => 
          o && typeof o.description === 'string'
        ) : []
      }));
    }
  }

  // Validate updateQuests
  if (response.updateQuests) {
    if (!Array.isArray(response.updateQuests)) {
      errors.push('updateQuests must be an array');
    } else {
      sanitized.updateQuests = response.updateQuests.filter((q: any) => 
        q.title && typeof q.title === 'string' &&
        ['completed', 'failed', 'active'].includes(q.status)
      );
    }
  }

  // Validate newItems (for adventure mode, adding mechanical items is forbidden)
  if (response.newItems) {
    if (!Array.isArray(response.newItems)) {
      errors.push('newItems must be an array');
    } else {
      if (!allowMechanical) {
        errors.push('newItems are forbidden in Adventure responses (mechanical state must be engine-controlled)');
      } else {
        sanitized.newItems = response.newItems.filter((i: any) => 
          i.name && typeof i.name === 'string'
        ).map((i: any) => ({
          name: i.name,
          type: typeof i.type === 'string' ? i.type : 'misc',
          description: typeof i.description === 'string' ? i.description : '',
          quantity: typeof i.quantity === 'number' ? Math.max(1, Math.floor(i.quantity)) : 1,
          weight: typeof i.weight === 'number' ? i.weight : undefined,
          value: typeof i.value === 'number' ? i.value : undefined
        }));
      }
    }
  }

  // Validate removedItems
  if (response.removedItems) {
    if (!Array.isArray(response.removedItems)) {
      errors.push('removedItems must be an array');
    } else {
      if (!allowMechanical) {
        errors.push('removedItems are forbidden in Adventure responses (mechanical state must be engine-controlled)');
      } else {
        sanitized.removedItems = response.removedItems.filter((i: any) => 
          i.name && typeof i.name === 'string'
        ).map((i: any) => ({
          name: i.name,
          quantity: typeof i.quantity === 'number' ? Math.max(1, Math.floor(i.quantity)) : 1
        }));
      }
    }
  }

  // Validate statUpdates
  if (response.statUpdates) {
    if (typeof response.statUpdates !== 'object') {
      errors.push('statUpdates must be an object');
    } else {
      if (!allowMechanical) {
        errors.push('statUpdates are forbidden in Adventure responses (mechanical state must be engine-controlled)');
      } else {
        sanitized.statUpdates = {};
        for (const key of ['health', 'magicka', 'stamina']) {
          if (typeof response.statUpdates[key] === 'number') {
            sanitized.statUpdates[key] = Math.max(0, Math.floor(response.statUpdates[key]));
          }
        }
      }
    }
  }

  // Validate vitalsChange
  if (response.vitalsChange) {
    if (typeof response.vitalsChange !== 'object') {
      errors.push('vitalsChange must be an object');
    } else {
      if (!allowMechanical) {
        errors.push('vitalsChange is forbidden in Adventure responses (mechanical state must be engine-controlled)');
      } else {
        sanitized.vitalsChange = {};
        for (const key of ['currentHealth', 'currentMagicka', 'currentStamina']) {
          if (typeof response.vitalsChange[key] === 'number') {
            sanitized.vitalsChange[key] = Math.floor(response.vitalsChange[key]);
          }
        }
      }
    }
  }

  // Validate numeric fields
  if (response.goldChange !== undefined) {
    if (!allowMechanical) {
      errors.push('goldChange is forbidden in Adventure responses (mechanical state must be engine-controlled)');
    } else {
      sanitized.goldChange = typeof response.goldChange === 'number' ? Math.floor(response.goldChange) : 0;
    }
  }
  
  if (response.xpChange !== undefined) {
    if (!allowMechanical) {
      errors.push('xpChange is forbidden in Adventure responses (mechanical state must be engine-controlled)');
    } else {
      sanitized.xpChange = typeof response.xpChange === 'number' ? Math.max(0, Math.floor(response.xpChange)) : 0;
    }
  }

  if (response.timeAdvanceMinutes !== undefined) {
    sanitized.timeAdvanceMinutes = typeof response.timeAdvanceMinutes === 'number' 
      ? Math.max(0, Math.floor(response.timeAdvanceMinutes)) : 0;
  }

  // Pass through other safe fields
  if (response.needsChange && typeof response.needsChange === 'object') {
    sanitized.needsChange = {};
    for (const key of ['hunger', 'thirst', 'fatigue']) {
      if (typeof response.needsChange[key] === 'number') {
        sanitized.needsChange[key] = Math.max(0, Math.min(100, response.needsChange[key]));
      }
    }
  }

  if (response.ambientContext && typeof response.ambientContext === 'object') {
    sanitized.ambientContext = response.ambientContext;
  }

  if (response.combatStart && typeof response.combatStart === 'object') {
    sanitized.combatStart = response.combatStart;
  }

  if (response.choices && Array.isArray(response.choices)) {
    sanitized.choices = response.choices.filter((c: any) => c.label && typeof c.label === 'string');
  }

  if (response.characterUpdates && typeof response.characterUpdates === 'object') {
    sanitized.characterUpdates = response.characterUpdates;
  }

  // Pass through currentLocation for map updates
  if (response.currentLocation && typeof response.currentLocation === 'string') {
    sanitized.currentLocation = response.currentLocation;
  }

  // Pass through simulationUpdate for state tracking (NPCs, scenes, facts, etc.)
  if (response.simulationUpdate && typeof response.simulationUpdate === 'object') {
    sanitized.simulationUpdate = response.simulationUpdate;
  }

  // Pass through discoveredLocations for map updates
  if (response.discoveredLocations && Array.isArray(response.discoveredLocations)) {
    sanitized.discoveredLocations = response.discoveredLocations.filter((loc: any) => 
      loc.name && typeof loc.name === 'string'
    );
  }

  if (response.transactionId) {
    if (allowMechanical) sanitized.transactionId = response.transactionId;
    else errors.push('transactionId is forbidden in Adventure responses (would imply mechanical application)');
  }
  if (response.isPreview) sanitized.isPreview = response.isPreview;

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};

const getApiKeyStatus = (): { total: number; available: number; exhausted: number } => {
  const allKeys = getAllApiKeys();
  const exhausted = allKeys.filter(key => isCoolingDown(apiKeyCooldownUntil.get(key))).length;
  return {
    total: allKeys.length,
    available: allKeys.length - exhausted,
    exhausted
  };
};

const getAvailableApiKey = (forGemma: boolean = false): string | null => {
  if (forGemma) {
    const gemmaKey = getGemmaApiKey();
    if (gemmaKey && !isCoolingDown(apiKeyCooldownUntil.get(gemmaKey))) return gemmaKey;
  }
  
  const allKeys = getAllApiKeys();
  for (const key of allKeys) {
    if (!isCoolingDown(apiKeyCooldownUntil.get(key))) return key;
  }
  return null;
};

// Client cache with API key tracking
const clientCache = new Map<string, GoogleGenAI>();

const isGemmaModel = (modelId: string) => modelId.toLowerCase().startsWith('gemma');

const supportsJsonMimeType = (modelId: string) => !isGemmaModel(modelId);

const isJsonModeNotEnabledError = (error: any): boolean => {
  const msg = String(error?.message || '');
  const raw = String(error?.toString?.() || '');
  return (
    msg.includes('JSON mode is not enabled') ||
    raw.includes('JSON mode is not enabled') ||
    msg.includes('INVALID_ARGUMENT')
  );
};

const extractJsonObject = (text: string): string | null => {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;

  // Remove markdown code fences more aggressively
  // Handles: ```json\n...\n```, ```\n...\n```, and variations with extra whitespace
  let unfenced = trimmed
    .replace(/^```+\s*(?:json)?\s*\n?/i, '')  // Opening fence with optional 'json' label
    .replace(/\n?```+\s*$/i, '')               // Closing fence
    .trim();
  
  // Also handle cases where fence might have extra backticks or spaces
  if (unfenced.startsWith('`')) {
    unfenced = unfenced.replace(/^`+\s*/, '').replace(/\s*`+$/, '').trim();
  }

  // If it's already a JSON object/array
  if ((unfenced.startsWith('{') && unfenced.endsWith('}')) || (unfenced.startsWith('[') && unfenced.endsWith(']'))) {
    return unfenced;
  }

  // Best-effort: grab the first top-level JSON object
  const firstBrace = unfenced.indexOf('{');
  const lastBrace = unfenced.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return unfenced.slice(firstBrace, lastBrace + 1);
  }
  return null;
};

const getClientForModel = (modelId: string, specificKey?: string): GoogleGenAI => {
  const forGemma = isGemmaModel(modelId);
  const key = specificKey || getAvailableApiKey(forGemma);
  
  if (!key) {
    throw new Error(forGemma ? 'No available GEMMA API key found.' : 'No available GEMINI API key found.');
  }
  
  if (!clientCache.has(key)) {
    clientCache.set(key, new GoogleGenAI({ apiKey: key }));
  }
  
  return clientCache.get(key)!;
};

const isQuotaError = (error: any): boolean => {
  const msg = String(error?.message || '');
  const status = String(error?.status || '');
  const raw = String(error?.toString?.() || '');
  return (
    msg.includes('429') ||
    msg.toLowerCase().includes('quota') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    status === '429' ||
    raw.includes('RESOURCE_EXHAUSTED')
  );
};

const extractRetryDelayMs = (error: any): number | null => {
  // Try structured shapes first
  const seconds =
    Number((error as any)?.retryDelay?.seconds) ||
    Number((error as any)?.details?.retryDelay?.seconds) ||
    Number((error as any)?.details?.[0]?.retryDelay?.seconds) ||
    Number((error as any)?.error?.details?.[0]?.retryDelay?.seconds);
  if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds * 1000);

  // Fall back to regex over the serialized error
  const raw = String(error?.message || '') + '\n' + String(error?.toString?.() || '');
  // Common formats: "retryDelay": {"seconds": 12} or retryDelay: 12
  const m = raw.match(/retryDelay[^\d]*(\d+(?:\.\d+)?)/i);
  if (m) {
    const parsed = Number(m[1]);
    if (Number.isFinite(parsed) && parsed > 0) return Math.ceil(parsed * 1000);
  }
  return null;
};

const isRetryableError = (error: any): boolean => {
  const msg = String(error?.message || '').toLowerCase();
  const raw = String(error?.toString?.() || '').toLowerCase();
  return (
    isQuotaError(error) ||
    msg.includes('500') ||
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('internal') ||
    raw.includes('internal_error') ||
    raw.includes('service_unavailable')
  );
};

// ========== SEAMLESS FALLBACK EXECUTION ==========
interface FallbackOptions {
  preferredModel?: string;
  fallbackChain?: AvailableModel[];
  isImageGeneration?: boolean;
}

const executeWithFallback = async <T>(
  operation: (model: string, apiKey: string) => Promise<T>,
  options: FallbackOptions = {}
): Promise<T> => {
  const { 
    preferredModel, 
    fallbackChain = TEXT_MODEL_FALLBACK_CHAIN,
    isImageGeneration = false 
  } = options;
  
  // Build the model list to try
  const modelsToTry: AvailableModel[] = [];
  
  // Add preferred model first if it's in available models
  if (preferredModel && AVAILABLE_MODELS.includes(preferredModel as AvailableModel)) {
    modelsToTry.push(preferredModel as AvailableModel);
  }
  
  // Add rest of fallback chain
  for (const model of fallbackChain) {
    if (!modelsToTry.includes(model)) {
      modelsToTry.push(model);
    }
  }
  
  const errors: Array<{ model: string; error: any }> = [];
  
  for (const model of modelsToTry) {
    if (isCoolingDown(modelCooldownUntil.get(model))) {
      console.warn(`[Gemini Service] Skipping cooling-down model ${model} (${Math.ceil(getCooldownRemainingMs(modelCooldownUntil.get(model)) / 1000)}s remaining)`);
      continue;
    }
    // Use all available keys for both Gemini and Gemma models
    const allKeys = getAllApiKeys();
    const keyStatus = getApiKeyStatus();
    console.log(`[Gemini Service] Trying model: ${model} | Keys: ${keyStatus.available}/${keyStatus.total} available`);
    
    let modelNotFound = false;
    
    let sawQuotaOrOverload = false;

    for (const apiKey of allKeys) {
      if (!apiKey) {
        console.log(`[Gemini Service] Skipping empty key`);
        continue;
      }
      const keyUntil = apiKeyCooldownUntil.get(apiKey);
      if (isCoolingDown(keyUntil)) {
        console.log(`[Gemini Service] Skipping cooling-down key ...${apiKey.slice(-4)} (${Math.ceil(getCooldownRemainingMs(keyUntil) / 1000)}s remaining)`);
        continue;
      }
      
      try {
        console.log(`[Gemini Service] Trying model: ${model} with key ending ...${apiKey.slice(-4)}`);
        recordApiCall(); // Track for rate limiting
        const result = await operation(model, apiKey);
        return result;
      } catch (error: any) {
        const errorMessage = error?.message || JSON.stringify(error);
        console.warn(`[Gemini Service] Model ${model} failed:`, errorMessage);
        errors.push({ model, error });
        
        // Check if model doesn't exist (404) - skip to next model immediately
        if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('NOT_FOUND')) {
          console.warn(`[Gemini Service] Model ${model} not found, skipping to next model`);
          modelNotFound = true;
          break;
        }
        
        if (isQuotaError(error)) {
          sawQuotaOrOverload = true;
          const retryMs = extractRetryDelayMs(error) ?? DEFAULT_KEY_COOLDOWN_MS;
          markKeyCooldown(apiKey, retryMs, 'quota');
          console.warn(`[Gemini Service] API key ...${apiKey.slice(-4)} rate-limited, trying next key...`);
          // Continue to next key, don't break
          continue;
        }

        // Overload / temporary failures: cooldown key briefly to avoid hammering
        if (isRetryableError(error)) {
          sawQuotaOrOverload = true;
          const retryMs = extractRetryDelayMs(error) ?? DEFAULT_MODEL_COOLDOWN_MS;
          markKeyCooldown(apiKey, Math.min(DEFAULT_KEY_COOLDOWN_MS, retryMs), 'retryable');
          continue;
        }
        
        // Non-retryable error for this key, try next key
        console.warn(`[Gemini Service] Non-retryable error, trying next key...`);
        continue;
      }
    }
    
    // If model wasn't found, it already broke out. Otherwise, all keys exhausted for this model.
    if (!modelNotFound) {
      if (sawQuotaOrOverload) {
        // If we saw quota/overload across keys, give the model a short cooldown.
        markModelCooldown(model, DEFAULT_MODEL_COOLDOWN_MS, 'all-keys-throttled');
      }
      console.warn(`[Gemini Service] All keys unavailable for model ${model}, trying next model...`);
    }
  }
  
  // All models failed
  const lastError = errors[errors.length - 1]?.error;
  const errorMessage = lastError?.message || JSON.stringify(lastError) || 'Unknown error';

  console.error(`[Gemini Service] All ${modelsToTry.length} models failed with ${errors.length} total errors. Last error:`, errorMessage);

  // Provide more helpful error message
  if (errorMessage.includes('quota') || errorMessage.includes('429')) {
    throw new Error('All API keys are currently rate-limited or out of quota. Please wait a bit and try again, or add new API keys with available quota.');
  } else if (errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED')) {
    throw new Error('API key access denied. Some keys may be invalid, leaked, or have insufficient permissions. Please check your API keys.');
  } else {
    throw new Error(`AI service temporarily unavailable: ${errorMessage}. Please try again in a moment.`);
  }
};

export const generateGameMasterResponse = async (
  playerInput: string,
  context: string,
  options?: { model?: string }
): Promise<GameStateUpdate> => {
  const preferredModel = options?.model || 'gemini-2.5-flash-lite';

  const fullPrompt = `
    You are the Game Master (GM) and Scribe for a Skyrim roleplay campaign.

    === GAMEPLAY CONSISTENCY ENFORCEMENT (CRITICAL - HIGHEST PRIORITY) ===
    HARD RULES (NEVER VIOLATE):
    - NEVER resolve combat without addressing EVERY enemy (each must be: dead, fled, surrendered, incapacitated, or still hostile)
    - NEVER advance time without consequences
    - NEVER increase stats without gameplay impact
    - NEVER imply objective completion without explicit confirmation
    
    PRIORITIES:
    1. Mechanical consistency over narrative flavor
    2. Explicit state transitions over implied outcomes
    3. Gameplay consequences over descriptive prose
    
    You are a game system that outputs narrative as a consequence of rules.
    === END ENFORCEMENT ===
    
    CURRENT GAME STATE CONTEXT:
    ${context}

    PLAYER REQUEST/ACTION:
    ${playerInput}

    YOUR TASK:
    1. Write a narrative response (Story Chapter) describing the outcome of the action or filling in the lore details requested.
    2. Determine if the game state changes (new items found, quests started/completed, stats changed).
    3. If the player asks to fill in, generate, or modify character details (backstory, psychology, fears, talents, etc.), provide those in the characterUpdates field.
    
    OUTPUT FORMAT:
    Return ONLY a JSON object. Do not wrap in markdown code blocks.
    Structure:
    {
      "narrative": { "title": "Short Title", "content": "The story text..." },
      "newQuests": [ { "title": "Quest Name", "description": "...", "location": "...", "dueDate": "...", "objectives": [ { "description": "...", "completed": false } ] } ],
      "updateQuests": [ { "title": "Existing Quest Name", "status": "completed" } ],
      "newItems": [ { "name": "Item Name", "type": "weapon/potion/etc", "description": "...", "quantity": 1 } ],
      "removedItems": [ { "name": "Item Name", "quantity": 1 } ],
      "statUpdates": { "health": 90 },
      "characterUpdates": {
        "identity": "Who they are at their core...",
        "psychology": "Mental state and quirks...",
        "breakingPoint": "What makes them snap...",
        "moralCode": "Lines they won't cross...",
        "fears": "Deep fears...",
        "weaknesses": "Physical or mental flaws...",
        "talents": "Natural aptitudes...",
        "magicApproach": "Attitude toward magic...",
        "factionAllegiance": "Guild/faction loyalties...",
        "worldview": "How they see Tamriel...",
        "daedricPerception": "View of Daedra...",
        "forcedBehavior": "Compulsive behaviors...",
        "longTermEvolution": "Character arc over time...",
        "backstory": "Full backstory narrative..."
      }
    }
    
    If a field is not needed (e.g., no new items, no character updates), omit it.
    For characterUpdates, only include fields the player asked to generate or modify.
    Keep the tone immersive (Tamrielic).
  `;

  try {
    return await executeWithFallback(async (model, apiKey) => {
      const ai = getClientForModel(model, apiKey);
      
      const run = async (useJsonMode: boolean) => {
        const config = useJsonMode
          ? { responseMimeType: 'application/json' as const }
          : undefined;
        return await ai.models.generateContent({
          model: model,
          contents: fullPrompt,
          ...(config ? { config } : {})
        });
      };

      let response: any;
      try {
        response = await run(supportsJsonMimeType(model));
      } catch (e) {
        if (isJsonModeNotEnabledError(e)) {
          response = await run(false);
        } else {
          throw e;
        }
      }

      const text = response.text || "{}";
      const json = extractJsonObject(text) || "{}";
      const parsed = JSON.parse(json);
      
      // Validate and sanitize the response
      const validation = validateGameStateUpdate(parsed);
      if (validation.errors.length > 0) {
        console.warn('[Gemini Service] GM Response validation warnings:', validation.errors);
      }
      
      return validation.sanitized;
    }, { preferredModel, fallbackChain: TEXT_MODEL_FALLBACK_CHAIN });
  } catch (error) {
    console.error("Gemini API Error (all models failed):", error);
    return { narrative: { title: "Connection Lost", content: "The connection to Aetherius is severed. All models exhausted." } };
  }
};

// Adventure Chat - Text-based RPG responses
export const generateAdventureResponse = async (
  playerInput: string,
  context: string,
  systemPrompt: string,
  options?: { model?: PreferredAIModel | string; language?: string }
): Promise<GameStateUpdate> => {
  const preferredModel = String(options?.model || 'gemini-2.5-flash');
  const language = options?.language || 'en';
  
  // Language instruction for non-English responses
  const languageInstruction = language === 'tr' 
    ? '\n\nIMPORTANT: Respond in Turkish (Türkçe). All narrative content, dialogue, and descriptions must be in Turkish. Keep JSON field names in English but values in Turkish.'
    : '';

  const fullPrompt = `${systemPrompt}

  CURRENT GAME STATE:
  ${context}

  PLAYER ACTION:
  ${playerInput}${languageInstruction}

  Remember: Return ONLY valid JSON.
  The "narrative" field MUST be an object: { "title": "...", "content": "..." }.`;

  try {
    return await executeWithFallback(async (model, apiKey) => {
      const ai = getClientForModel(model, apiKey);

      const run = async (useJsonMode: boolean) => {
        const config = useJsonMode
          ? { responseMimeType: 'application/json' as const }
          : undefined;
        return await ai.models.generateContent({
          model: model,
          contents: fullPrompt,
          ...(config ? { config } : {})
        });
      };

      let response: any;
      try {
        response = await run(supportsJsonMimeType(model));
      } catch (e) {
        if (isJsonModeNotEnabledError(e)) {
          response = await run(false);
        } else {
          throw e;
        }
      }

      const text = response.text || "{}";
      const json = extractJsonObject(text) || "{}";
      const parsed = JSON.parse(json);
      
      // Validate and sanitize the response - Adventure mode forbids mechanical changes
      const validation = validateGameStateUpdate(parsed, { allowMechanical: false });
      if (validation.errors.length > 0) {
        // Log warnings for the caller to display if needed
        console.warn('[Gemini Service] Adventure response validation warnings:', validation.errors);
      }
      
      // Use sanitized response
      const result = validation.sanitized;
      
      if (!result?.narrative) {
        return { narrative: { title: 'Adventure', content: 'The winds carry no response...' } };
      }
      return result;
    }, { preferredModel, fallbackChain: TEXT_MODEL_FALLBACK_CHAIN });
  } catch (error) {
    console.error("Adventure API Error (all models failed):", error);
    return { narrative: { title: 'A Dragon Break', content: '*A dragon break disrupts the flow of time...* All models exhausted.' } };
  }
};

export const generateLoreImage = async (prompt: string): Promise<string | null> => {
  try {
    return await executeWithFallback(async (model, apiKey) => {
      const ai = getClientForModel(model, apiKey);
      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: `Skyrim fantasy art style, high quality, concept art: ${prompt}` }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          }
        }
      });
      
      // Iterate through parts to find image
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error('No image generated');
    }, { preferredModel: 'gemini-2.5-flash', fallbackChain: IMAGE_MODEL_FALLBACK_CHAIN, isImageGeneration: true });
  } catch (error: any) {
    console.error("Image Generation Error (all models failed):", error);
    return null;
  }
};

export const generateCharacterProfile = async (
    prompt: string, 
    mode: 'random' | 'chat_result' | 'text_import' = 'random'
): Promise<GeneratedCharacterData | null> => {
    const baseSchema = `
    {
        "name": "String",
        "race": "String",
        "gender": "String (Male/Female)",
        "archetype": "String",
        "stats": { "health": Number, "magicka": Number, "stamina": Number },
        "skills": [ { "name": "String", "level": Number } ],
        "identity": "String (Core identity/concept)",
        "psychology": "String (Personality traits)",
        "breakingPoint": "String",
        "moralCode": "String",
        "allowedActions": "String (Roleplay rules)",
        "forbiddenActions": "String (Roleplay rules)",
        "fears": "String",
        "weaknesses": "String",
        "talents": "String",
        "magicApproach": "String",
        "factionAllegiance": "String",
        "worldview": "String",
        "daedricPerception": "String",
        "forcedBehavior": "String",
        "longTermEvolution": "String",
        "backstory": "String (Detailed)",
        "startingGold": Number,
        "inventory": [ { "name": "String", "type": "weapon/apparel/potion/ingredient/misc", "description": "String", "quantity": Number } ],
        "quests": [ { "title": "String", "description": "String", "location": "String", "dueDate": "String (Optional)", "objectives": [ { "description": "String", "completed": false } ] } ],
        "journalEntries": [ { "title": "String", "content": "String (Initial thoughts)" } ],
        "openingStory": { "title": "String", "content": "String (The beginning of the adventure)" }
    }
    `;

    let instructions = "";

    if (mode === 'random') {
        instructions = `Generate a completely random, detailed, unique, and lore-friendly Skyrim character in JSON format. 
           Include:
           1. Gender (Male or Female).
           2. Stats balanced to ~300 total.
           3. 6 major skills (25-40) and others lower.
           4. Context-appropriate starting inventory (weapons, armor, gold) for their class/background.
           5. 1-2 starting quests reflecting their backstory.
           6. An initial journal entry.
           7. An opening story chapter setting the scene.
           Follow this JSON structure exactly: ${baseSchema}`;
    } else if (mode === 'chat_result') {
        instructions = `Analyze the conversation transcript between Player and Scribe. Extract all character details (Name, Race, Gender, Class, Backstory, etc.). 
           Generate a full JSON profile matching these details. 
           If details are missing, extrapolate them creatively to fit the theme.
           Include:
           1. Gender (Inferred from context if not specified).
           2. Stats balanced to ~300 total.
           3. Skills reflecting the discussion.
           4. Context-appropriate starting inventory and gold.
           5. Starting quests based on the generated backstory.
           6. Initial journal entry.
           7. Opening story chapter.
           Follow this JSON structure exactly: ${baseSchema}`;
    } else if (mode === 'text_import') {
        instructions = `Analyze the provided text which represents a character sheet, description, or paste. 
           Extract all known details (Name, Race, Gender, Class, Stats, Backstory, Inventory, etc.) and map them to the JSON structure.
           For any missing fields (e.g., if the text doesn't specify exact stats numbers or skills), INFER appropriate values based on the character's description and archetype to ensure a complete and playable profile.
           Include:
           1. Gender (Inferred from pronouns or description if not explicit).
           2. Inferred Stats balanced to ~300 total.
           3. Inferred Skills based on the description.
           4. Inferred Inventory if not explicitly listed.
           5. 1-2 quests based on the backstory provided.
           6. An initial journal entry reflecting the text.
           7. An opening story chapter.
           Follow this JSON structure exactly: ${baseSchema}`;
    }

    let contents = instructions;
    if (prompt) {
         if (mode === 'chat_result') {
             contents = `${instructions}\n\n--- TRANSCRIPT START ---\n${prompt}\n--- TRANSCRIPT END ---`;
         } else if (mode === 'text_import') {
             contents = `${instructions}\n\n--- USER TEXT INPUT ---\n${prompt}\n--- INPUT END ---`;
         } else {
             contents = `${instructions}\n\nAdditional Context: ${prompt}`;
         }
    }

    try {
        return await executeWithFallback(async (model, apiKey) => {
            const ai = getClientForModel(model, apiKey);
            
            const run = async (useJsonMode: boolean) => {
                const config = useJsonMode
                    ? { responseMimeType: 'application/json' as const }
                    : undefined;
                return await ai.models.generateContent({
                    model: model,
                    contents: contents,
                    ...(config ? { config } : {})
                });
            };

            let response: any;
            try {
                response = await run(supportsJsonMimeType(model));
            } catch (e) {
                if (isJsonModeNotEnabledError(e)) {
                    response = await run(false);
                } else {
                    throw e;
                }
            }
            
            const text = response.text;
            if (!text) throw new Error('No response text');
            const json = extractJsonObject(text) || text;
            return JSON.parse(json) as GeneratedCharacterData;
        }, { preferredModel: 'gemini-2.5-flash-lite', fallbackChain: TEXT_MODEL_FALLBACK_CHAIN });
    } catch (e) {
        console.error("Character Gen Error (all models failed)", e);
        return null;
    }
};

export const chatWithScribe = async (history: {role: 'user' | 'model', parts: [{ text: string }]}[], message: string) => {
    // chatWithScribe uses fallback but keeps chat context, so we try models sequentially
    const modelsToTry: AvailableModel[] = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-3-flash'];
    
    for (const model of modelsToTry) {
        try {
            const apiKey = getAvailableApiKey(isGemmaModel(model));
            if (!apiKey) continue;
            
            const ai = getClientForModel(model, apiKey);
            const chat = ai.chats.create({
                model: model,
                history: history,
                config: {
                    systemInstruction: "You are the Character Creation Scribe for a Skyrim RPG app. Your goal is to help the user create a character by asking them questions one by one. \n\nIMPORTANT: You MUST ask for the character's NAME at some point if the user hasn't provided it.\n\nStart by asking about their preferred playstyle or race. Ask 3-4 probing questions about their morality, background, gender, or goals. Keep responses short and immersive. Once you have enough info, or if the user asks to 'finish' or 'generate', output a SPECIAL TOKEN '[[GENERATE_CHARACTER]]' at the end of your message to signal the UI to trigger generation."
                }
            });

            const result = await chat.sendMessage({ message });
            return result.text;
        } catch (error: any) {
            console.warn(`[chatWithScribe] Model ${model} failed:`, error?.message);
            if (isQuotaError(error)) {
                const apiKey = getAvailableApiKey(isGemmaModel(model));
                if (apiKey) markKeyExhausted(apiKey);
            }
            continue;
        }
    }
    
    throw new Error('All models failed for chatWithScribe');
};

// Chat with a companion (in-character reply)
export const chatWithCompanion = async (companion: { name: string; personality?: string; mood?: string }, message: string) => {
  const modelsToTry: AvailableModel[] = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
  const systemInstruction = `You are ${companion.name}, a companion to the player in a Skyrim RPG. ${companion.backstory ? `Backstory: ${companion.backstory}.` : ''} Reply in-character as ${companion.name}. When the player mentions or asks about being your companion, acknowledge that you are the player's companion and briefly reference your backstory if available. Keep responses short, concise, and in the companion's voice. If the companion has a personality, reflect it briefly (e.g., loyal, gruff, cheerful). Do NOT provide JSON — return plain text only. Avoid suggesting mechanical changes or making worldstate modifications.`;

  for (const model of modelsToTry) {
    try {
      const apiKey = getAvailableApiKey(isGemmaModel(model));
      if (!apiKey) continue;
      const ai = getClientForModel(model, apiKey);
      const chat = ai.chats.create({ model, config: { systemInstruction } });
      const result = await chat.sendMessage({ message });
      if (result && result.text) return result.text;
    } catch (err: any) {
      console.warn(`[chatWithCompanion] ${model} failed:`, err?.message);
      if (isQuotaError(err)) {
        const apiKey = getAvailableApiKey(isGemmaModel(model));
        if (apiKey) markKeyExhausted(apiKey);
      }
      continue;
    }
  }

  // fallback simple persona-based echo if all models fail
  return `${companion.name}: ${companion.personality ? `${companion.personality.split(' ')[0]}ly, ` : ''}I have nothing to add right now.`;
};

export const generateCharacterProfileImage = async (
    characterName: string,
    race: string,
    gender: string,
    archetype: string
): Promise<string | null> => {
  const imagePrompt = `A detailed character portrait of a ${gender.toLowerCase()} ${race.split(' ')[0].toLowerCase()} ${archetype.toLowerCase()} named ${characterName} from Skyrim. Fantasy art style, high quality, heroic pose, detailed armor and features, professional fantasy game character design, no text, plain background.`;
  
  try {
    return await executeWithFallback(async (model, apiKey) => {
      const ai = getClientForModel(model, apiKey);
      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: imagePrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          }
        }
      });
      
      // Iterate through parts to find image
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error('No image generated');
    }, { preferredModel: 'gemini-2.5-flash', fallbackChain: IMAGE_MODEL_FALLBACK_CHAIN, isImageGeneration: true });
  } catch (error: any) {
    console.error("Profile Image Generation Error (all models failed):", error);
    return null;
  }
};

// ============================================================================
// COMBAT NARRATION
// ============================================================================

export interface CombatNarrationRequest {
  action: string;
  actor: string;
  target?: string;
  damage?: number;
  isCrit?: boolean;
  effect?: string;
  context: {
    location: string;
    turn: number;
    playerHealth: number;
    playerMaxHealth: number;
    enemyName?: string;
    enemyHealth?: number;
    enemyMaxHealth?: number;
  };
}

export const generateCombatNarration = async (
  request: CombatNarrationRequest
): Promise<string> => {
  const prompt = `You are a dramatic combat narrator for a Skyrim RPG. Write a SHORT, vivid 1-2 sentence description of this combat action.

ACTION: ${request.actor} uses "${request.action}"${request.target ? ` against ${request.target}` : ''}
${request.damage ? `DAMAGE DEALT: ${request.damage}${request.isCrit ? ' (CRITICAL HIT!)' : ''}` : ''}
${request.effect ? `SPECIAL EFFECT: ${request.effect}` : ''}

CONTEXT:
- Location: ${request.context.location}
- Turn: ${request.context.turn}
- Player Health: ${request.context.playerHealth}/${request.context.playerMaxHealth}
${request.context.enemyName ? `- Enemy: ${request.context.enemyName} (${request.context.enemyHealth}/${request.context.enemyMaxHealth} HP)` : ''}

Write ONLY the narration, no quotes or extra formatting. Be dramatic but brief. Use Skyrim-appropriate language.`;

  try {
    return await executeWithFallback(async (model, apiKey) => {
      const ai = getClientForModel(model, apiKey);
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt
      });
      return response.text?.trim() || `${request.actor} attacks!`;
    }, { preferredModel: 'gemini-2.5-flash-lite', fallbackChain: TEXT_MODEL_FALLBACK_CHAIN });
  } catch (error) {
    console.error("Combat narration error:", error);
    // Fallback to simple narration
    if (request.damage) {
      return `${request.actor} strikes ${request.target || 'the enemy'} for ${request.damage} damage!`;
    }
    return `${request.actor} ${request.action}!`;
  }
};

// Generate enemies for combat encounter based on context
export const generateCombatEncounter = async (
  context: string,
  difficulty: 'easy' | 'medium' | 'hard' | 'boss' = 'medium',
  playerLevel: number = 1
): Promise<GameStateUpdate> => {
  const prompt = `You are a Game Master for a Skyrim RPG. Generate a combat encounter based on the context.

=== GAMEPLAY CONSISTENCY ENFORCEMENT (CRITICAL) ===
- ALL generated enemies MUST be explicitly tracked - no implied or background enemies
- Enemy count MUST match what's described in narrative
- Each enemy MUST have complete stats - no partial entries
- Combat cannot start without explicit enemy list
You are a game system, not a storyteller.
=== END ENFORCEMENT ===

CONTEXT: ${context}
DIFFICULTY: ${difficulty}
PLAYER LEVEL: ${playerLevel}

Generate 1-3 enemies appropriate for the situation. For ${difficulty} difficulty:
- easy: 1 weak enemy or 2 very weak enemies
- medium: 1-2 moderate enemies
- hard: 2-3 strong enemies or 1 very strong enemy
- boss: 1 boss enemy with high stats

Return JSON with this structure:
{
  "narrative": { "title": "Combat Title", "content": "Description of enemies appearing..." },
  "combatStart": {
    "enemies": [
      {
        "name": "Enemy Name",
        "type": "humanoid|beast|undead|daedra|dragon|automaton",
        "level": number,
        "maxHealth": number,
        "currentHealth": number,
        "armor": number,
        "damage": number,
        "behavior": "aggressive|defensive|tactical|support|berserker",
        "abilities": [
          { "id": "unique_id", "name": "Ability Name", "type": "melee|ranged|magic", "damage": number, "cost": number, "description": "..." }
        ],
        "weaknesses": ["fire", "silver", etc] or [],
        "resistances": ["frost", "poison", etc] or [],
        "xpReward": number,
        "goldReward": number,
        "loot": [
          { "name": "Item", "type": "weapon|apparel|misc|ingredient", "description": "...", "quantity": 1, "dropChance": 50 }
        ],
        "isBoss": boolean
      }
    ],
    "location": "Location name",
    "ambush": boolean,
    "fleeAllowed": boolean,
    "surrenderAllowed": boolean
  },
  "ambientContext": { "inCombat": true, "mood": "tense" }
}

Scale enemy stats appropriately:
- Level should be within 2 of player level
- Health: 30-50 (weak), 50-80 (medium), 80-150 (strong), 150+ (boss)
- Armor: 5-15 (light), 15-35 (medium), 35-60 (heavy)
- Damage: 8-15 (low), 15-25 (medium), 25-40 (high)
- XP: 15-30 (weak), 30-60 (medium), 60-150 (strong), 150+ (boss)

Return ONLY valid JSON.`;

  try {
    return await executeWithFallback(async (model, apiKey) => {
      const ai = getClientForModel(model, apiKey);
      
      const run = async (useJsonMode: boolean) => {
        const config = useJsonMode
          ? { responseMimeType: 'application/json' as const }
          : undefined;
        return await ai.models.generateContent({
          model: model,
          contents: prompt,
          ...(config ? { config } : {})
        });
      };

      let response: any;
      try {
        response = await run(supportsJsonMimeType(model));
      } catch (e) {
        if (isJsonModeNotEnabledError(e)) {
          response = await run(false);
        } else {
          throw e;
        }
      }

      const text = response.text || "{}";
      const json = extractJsonObject(text) || "{}";
      return JSON.parse(json);
    }, { preferredModel: 'gemini-2.5-flash-lite', fallbackChain: TEXT_MODEL_FALLBACK_CHAIN });
  } catch (error) {
    console.error("Combat encounter generation error:", error);
    // Return a default bandit encounter
    return {
      narrative: { title: "Ambush!", content: "A bandit emerges from the shadows, weapon drawn!" },
      combatStart: {
        enemies: [{
          id: `bandit_${Date.now()}`,
          name: "Bandit",
          type: "humanoid",
          level: Math.max(1, playerLevel - 1),
          maxHealth: 50,
          currentHealth: 50,
          armor: 15,
          damage: 12,
          behavior: "aggressive",
          abilities: [
            { id: 'slash', name: 'Slash', type: 'melee', damage: 12, cost: 10, description: 'A quick slash' }
          ],
          xpReward: 25,
          goldReward: 10
        }],
        location: "Unknown",
        ambush: false,
        fleeAllowed: true,
        surrenderAllowed: false
      },
      ambientContext: { inCombat: true, mood: "tense" }
    };
  }
};
