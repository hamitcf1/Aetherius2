/**
 * TTS Service - Frontend client for voice synthesis
 * 
 * Manages audio playback, caching, and API calls to /api/voice
 */

export type VoiceRole = 'narrator' | 'khajiit' | 'system' | 'npc' | 'npc_female';

interface TTSConfig {
  enabled: boolean;
  autoPlay: boolean;
  volume: number;
}

interface TTSState {
  isPlaying: boolean;
  isSpeaking: boolean;
  currentText: string | null;
  error: string | null;
}

// Audio cache using in-memory Map (cleared on page refresh)
const audioCache = new Map<string, string>();

// Current audio element
let currentAudio: HTMLAudioElement | null = null;

// TTS state listeners
type StateListener = (state: TTSState) => void;
const stateListeners: Set<StateListener> = new Set();

let currentState: TTSState = {
  isPlaying: false,
  isSpeaking: false,
  currentText: null,
  error: null
};

function notifyListeners() {
  stateListeners.forEach(listener => listener(currentState));
}

function updateState(partial: Partial<TTSState>) {
  currentState = { ...currentState, ...partial };
  notifyListeners();
}

/**
 * Subscribe to TTS state changes
 */
export function subscribeTTS(listener: StateListener): () => void {
  stateListeners.add(listener);
  // Immediately call with current state
  listener(currentState);
  return () => stateListeners.delete(listener);
}

/**
 * Get current TTS state
 */
export function getTTSState(): TTSState {
  return currentState;
}

/**
 * Generate cache key from text and role
 */
function getCacheKey(text: string, role: VoiceRole): string {
  return `${role}:${text.slice(0, 100)}:${text.length}`;
}

/**
 * Stop any currently playing audio
 */
export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  updateState({ isPlaying: false, isSpeaking: false, currentText: null });
}

/**
 * Detect voice role from text content
 */
export function detectVoiceRole(text: string, context?: {
  isSystemMessage?: boolean;
  speakerName?: string;
  isKhajiit?: boolean;
}): VoiceRole {
  if (context?.isSystemMessage) {
    return 'system';
  }
  
  if (context?.isKhajiit) {
    return 'khajiit';
  }
  
  // Check for Khajiit speech patterns
  const khajiitPatterns = [
    /\bkhajiit\b/i,
    /\bthis one\b/i,
    /\bwarm sands\b/i,
    /\bmay your road\b/i,
    /\bj'zargo\b/i,
    /\bm'aiq\b/i
  ];
  
  if (khajiitPatterns.some(pattern => pattern.test(text))) {
    return 'khajiit';
  }
  
  // Default to narrator for story content
  return 'narrator';
}

/**
 * Speak text using TTS API
 */
export async function speak(
  text: string, 
  role: VoiceRole = 'narrator',
  config: TTSConfig = { enabled: true, autoPlay: true, volume: 0.8 }
): Promise<void> {
  if (!config.enabled) {
    return;
  }

  // Stop any current playback
  stopSpeaking();

  // Clean text for TTS (remove markdown, special chars)
  const cleanText = text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1')     // Remove italic
    .replace(/`([^`]+)`/g, '$1')       // Remove code
    .replace(/#+\s*/g, '')              // Remove headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links to text
    .replace(/[<>]/g, '')               // Remove angle brackets
    .trim();

  if (!cleanText || cleanText.length < 3) {
    return;
  }

  // Truncate very long text
  const truncatedText = cleanText.length > 2000 
    ? cleanText.slice(0, 1997) + '...'
    : cleanText;

  const cacheKey = getCacheKey(truncatedText, role);

  updateState({ isSpeaking: true, currentText: truncatedText, error: null });

  try {
    let audioUrl = audioCache.get(cacheKey);

    if (!audioUrl) {
      // Call TTS API
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: truncatedText, role })
      });

      if (response.status === 404) {
        // API not available (local dev without wrangler)
        throw new Error('Voice API not available. Run "npm run dev:full" for TTS support.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `TTS failed: ${response.status}`);
      }

      // Create blob URL from audio data
      const audioBlob = await response.blob();
      audioUrl = URL.createObjectURL(audioBlob);
      audioCache.set(cacheKey, audioUrl);
    }

    // Create and play audio
    currentAudio = new Audio(audioUrl);
    currentAudio.volume = config.volume;

    currentAudio.onplay = () => {
      updateState({ isPlaying: true });
    };

    currentAudio.onended = () => {
      updateState({ isPlaying: false, isSpeaking: false, currentText: null });
      currentAudio = null;
    };

    currentAudio.onerror = (e) => {
      console.error('Audio playback error:', e);
      updateState({ isPlaying: false, isSpeaking: false, error: 'Playback failed' });
      currentAudio = null;
    };

    if (config.autoPlay) {
      await currentAudio.play();
    }

  } catch (error) {
    console.error('TTS error:', error);
    updateState({ 
      isSpeaking: false, 
      isPlaying: false, 
      error: error instanceof Error ? error.message : 'TTS failed' 
    });
  }
}

/**
 * Pause current playback
 */
export function pauseSpeaking(): void {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    updateState({ isPlaying: false });
  }
}

/**
 * Resume paused playback
 */
export function resumeSpeaking(): void {
  if (currentAudio && currentAudio.paused) {
    currentAudio.play();
    updateState({ isPlaying: true });
  }
}

/**
 * Set playback volume
 */
export function setVolume(volume: number): void {
  if (currentAudio) {
    currentAudio.volume = Math.max(0, Math.min(1, volume));
  }
}

/**
 * Check if TTS is available (requires API endpoint)
 */
export async function checkTTSAvailability(): Promise<boolean> {
  try {
    // Simple health check - we'll just assume it's available
    // A real check would ping the endpoint
    return true;
  } catch {
    return false;
  }
}

/**
 * Get estimated speaking duration (rough estimate)
 * Average speaking rate is ~150 words per minute
 */
export function estimateDuration(text: string): number {
  const words = text.split(/\s+/).length;
  const minutes = words / 150;
  return Math.ceil(minutes * 60); // Return seconds
}

/**
 * Clean up resources (call on unmount)
 */
export function cleanupTTS(): void {
  stopSpeaking();
  // Revoke all blob URLs to free memory
  audioCache.forEach(url => URL.revokeObjectURL(url));
  audioCache.clear();
  stateListeners.clear();
}
