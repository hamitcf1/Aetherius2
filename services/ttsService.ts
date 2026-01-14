/**
 * TTS Service - Frontend client for voice synthesis
 * 
 * Manages audio playback, caching, and API calls to /api/voice
 */

export type VoiceRole = 'narrator' | 'khajiit' | 'system' | 'npc' | 'npc_female';

// Voice settings for customization
export interface VoiceSettings {
  gender?: 'male' | 'female';
  voiceName?: string;
  pitch?: number; // -20 to +20 semitones
  speakingRate?: number; // 0.5 to 2.0
  language?: string; // Language code (e.g., 'en', 'tr')
}

// Available voice options per language (matching the API)
export const VOICE_OPTIONS: Record<string, { male: Array<{ name: string; label: string }>; female: Array<{ name: string; label: string }> }> = {
  en: {
    male: [
      { name: 'en-US-Wavenet-A', label: 'Young Male' },
      { name: 'en-US-Wavenet-B', label: 'Deep Male' },
      { name: 'en-US-Wavenet-D', label: 'Mature Male' },
      { name: 'en-US-Wavenet-I', label: 'Older Male' },
      { name: 'en-US-Wavenet-J', label: 'Warm Male' },
      { name: 'en-US-Neural2-A', label: 'Natural Male' },
      { name: 'en-US-Neural2-D', label: 'Clear Male' },
      { name: 'en-US-Neural2-I', label: 'Expressive Male' },
      { name: 'en-US-Neural2-J', label: 'Conversational Male' },
    ],
    female: [
      { name: 'en-US-Wavenet-C', label: 'Warm Female' },
      { name: 'en-US-Wavenet-E', label: 'Young Female' },
      { name: 'en-US-Wavenet-F', label: 'Atmospheric Female' },
      { name: 'en-US-Wavenet-G', label: 'Soft Female' },
      { name: 'en-US-Wavenet-H', label: 'Bright Female' },
      { name: 'en-US-Neural2-C', label: 'Natural Female' },
      { name: 'en-US-Neural2-E', label: 'Clear Female' },
      { name: 'en-US-Neural2-F', label: 'Expressive Female' },
      { name: 'en-US-Neural2-G', label: 'Conversational Female' },
      { name: 'en-US-Neural2-H', label: 'Warm Neural Female' },
    ]
  },
  tr: {
    male: [
      { name: 'tr-TR-Wavenet-B', label: 'Turkish Male' },
      { name: 'tr-TR-Wavenet-E', label: 'Turkish Male 2' },
      { name: 'tr-TR-Standard-B', label: 'Turkish Standard Male' },
      { name: 'tr-TR-Standard-E', label: 'Turkish Standard Male 2' },
    ],
    female: [
      { name: 'tr-TR-Wavenet-A', label: 'Turkish Female' },
      { name: 'tr-TR-Wavenet-C', label: 'Turkish Female 2' },
      { name: 'tr-TR-Wavenet-D', label: 'Turkish Female 3' },
      { name: 'tr-TR-Standard-A', label: 'Turkish Standard Female' },
      { name: 'tr-TR-Standard-C', label: 'Turkish Standard Female 2' },
      { name: 'tr-TR-Standard-D', label: 'Turkish Standard Female 3' },
    ]
  }
};

// Helper to get voices for a specific language (defaults to English)
export function getVoicesForLanguage(language: string = 'en'): { male: Array<{ name: string; label: string }>; female: Array<{ name: string; label: string }> } {
  return VOICE_OPTIONS[language] || VOICE_OPTIONS.en;
}

// Current voice settings (persisted to localStorage)
let currentVoiceSettings: VoiceSettings = loadVoiceSettings();

function loadVoiceSettings(): VoiceSettings {
  try {
    const saved = localStorage.getItem('aetherius:voice_settings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // Ignore errors
  }
  return {}; // Default to using role-based voices
}

export function saveVoiceSettings(settings: VoiceSettings): void {
  currentVoiceSettings = settings;
  try {
    localStorage.setItem('aetherius:voice_settings', JSON.stringify(settings));
  } catch (e) {
    // Ignore errors
  }
}

export function getVoiceSettings(): VoiceSettings {
  return currentVoiceSettings;
}

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
 * Generate cache key from text, role, and voice settings
 */
function getCacheKey(text: string, role: VoiceRole, voiceSettings?: VoiceSettings): string {
  const settingsStr = voiceSettings ? JSON.stringify(voiceSettings) : '';
  return `${role}:${text.slice(0, 100)}:${text.length}:${settingsStr}`;
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
  
  // Unduck the music when done speaking
  import('./audioService').then(({ audioService }) => {
    audioService.unduckMusic();
  }).catch(() => {
    // audioService may not be available
  });
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

  // Duck the music when speaking
  try {
    const { audioService } = await import('./audioService');
    audioService.duckMusic(0.1);
  } catch (e) {
    // audioService may not be available
  }

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

  // Get current voice settings
  const voiceSettings = Object.keys(currentVoiceSettings).length > 0 ? currentVoiceSettings : undefined;
  const cacheKey = getCacheKey(truncatedText, role, voiceSettings);

  updateState({ isSpeaking: true, currentText: truncatedText, error: null });

  try {
    let audioUrl = audioCache.get(cacheKey);

    if (!audioUrl) {
      // Call TTS API with voice settings
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: truncatedText, 
          role,
          voiceSettings: voiceSettings || null
        })
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
      // Unduck music when playback ends naturally
      import('./audioService').then(({ audioService }) => {
        audioService.unduckMusic();
      }).catch(() => {});
    };

    currentAudio.onerror = (e) => {
      console.error('Audio playback error:', e);
      updateState({ isPlaying: false, isSpeaking: false, error: 'Playback failed' });
      currentAudio = null;
      // Unduck music on error too
      import('./audioService').then(({ audioService }) => {
        audioService.unduckMusic();
      }).catch(() => {});
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
 * Play a fixed, pre-defined sample sentence identified by `sampleKey`.
 * Uses the backend sample path which caches samples deterministically
 * so repeated playback does not consume extra quota.
 */
export async function speakSample(
  sampleKey: string,
  role: VoiceRole = 'narrator',
  config: TTSConfig = { enabled: true, autoPlay: true, volume: 0.8 }
): Promise<void> {
  if (!config.enabled) return;
  stopSpeaking();

  // Duck music
  try { const { audioService } = await import('./audioService'); audioService.duckMusic(0.1); } catch {}

  updateState({ isSpeaking: true, currentText: `[Sample:${sampleKey}]`, error: null });

  try {
    // Use voiceSettings to include optional voiceName param so cache key matches backend
    const voiceSettings = Object.keys(currentVoiceSettings).length > 0 ? currentVoiceSettings : undefined;
    const voiceNameParam = voiceSettings?.voiceName ? `&voiceName=${encodeURIComponent(String(voiceSettings.voiceName))}` : '';
    const url = `/api/voice?sample=${encodeURIComponent(sampleKey)}&role=${encodeURIComponent(role)}${voiceNameParam}`;

    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'TTS sample fetch failed');
      throw new Error(errorText || `TTS sample failed: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const cacheKey = getCacheKey(`[sample:${sampleKey}]`, role, voiceSettings);
    const audioUrl = URL.createObjectURL(audioBlob);
    audioCache.set(cacheKey, audioUrl);

    // Play
    currentAudio = new Audio(audioUrl);
    currentAudio.volume = config.volume;
    currentAudio.onplay = () => updateState({ isPlaying: true });
    currentAudio.onended = () => {
      updateState({ isPlaying: false, isSpeaking: false, currentText: null });
      currentAudio = null;
      import('./audioService').then(({ audioService }) => audioService.unduckMusic()).catch(() => {});
    };
    currentAudio.onerror = (e) => {
      console.error('Sample playback error', e);
      updateState({ isPlaying: false, isSpeaking: false, error: 'Playback failed' });
      currentAudio = null;
      import('./audioService').then(({ audioService }) => audioService.unduckMusic()).catch(() => {});
    };

    if (config.autoPlay) await currentAudio.play();
  } catch (err) {
    console.error('speakSample error:', err);
    updateState({ isSpeaking: false, isPlaying: false, error: err instanceof Error ? err.message : 'Sample failed' });
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
