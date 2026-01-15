// Audio Service - Manages sound effects and background music
// This is the foundation for audio in the game. Sound files will be added later.

export type SoundEffect = 
  | 'purchase'        // When buying an item
  | 'sell'            // When selling an item
  | 'gold_gain'       // When gaining gold
  | 'gold_spend'      // When spending gold
  | 'item_pickup'     // When picking up an item
  | 'item_equip'      // When equipping an item
  | 'item_unequip'    // When unequipping an item
  | 'level_up'        // When leveling up
  | 'quest_complete'  // When completing a quest
  | 'quest_start'     // When starting a quest
  | 'eat'             // When eating food
  | 'drink'           // When drinking
  | 'drink_potion'    // When drinking a potion
  | 'rest'            // When resting/sleeping
  | 'menu_open'       // When opening a menu
  | 'menu_close'      // When closing a menu
  | 'button_click'    // Generic button click
  | 'error'           // Error sound
  | 'success'         // Success sound
  // Combat sounds
  | 'attack_melee'    // Weapon melee attack
  | 'attack_ranged'   // Bow/ranged attack
  | 'attack_magic'    // Spell cast
  | 'block'           // Blocking/defending
  | 'shield_bash'     // Shield bash attack
  | 'spell_impact'    // Spell hitting target
  | 'hit_received'    // Taking damage
  | 'enemy_death'     // Enemy defeated
  | 'dice_tick'       // Small tick for D20 roll animation
  // Blacksmith sounds
  | 'forge_upgrade'   // Blacksmith upgrade success
  | 'anvil_hit';      // Metal impact for forging

export type MusicTrack = 
  | 'main_menu'     // Main menu music
  | 'exploration'   // Ambient exploration music
  | 'tavern'        // Tavern/inn music
  | 'combat'        // Combat music
  | 'peaceful'      // Peaceful ambient music
  | 'night';        // Nighttime ambient music

// Audio configuration
interface AudioConfig {
  soundEffectsEnabled: boolean;
  musicEnabled: boolean;
  soundEffectsVolume: number;  // 0-1
  musicVolume: number;         // 0-1
}

// Default configuration
const DEFAULT_CONFIG: AudioConfig = {
  soundEffectsEnabled: true,
  musicEnabled: true,
  soundEffectsVolume: 0.7,
  musicVolume: 0.4,
};

// Sound effect paths (to be populated with actual sound files)
import { BASE_PATH } from './basePath';
const SOUND_EFFECTS: Record<SoundEffect, string | null> = {
  purchase: `${BASE_PATH}/audio/sfx/purchase.mp3`,       // drop at public./audio/sfx/
  sell: `${BASE_PATH}/audio/sfx/sell.mp3`,
  gold_gain: `${BASE_PATH}/audio/sfx/gold_gain.mp3`,
  gold_spend: `${BASE_PATH}/audio/sfx/gold_spend.mp3`,
  item_pickup: `${BASE_PATH}/audio/sfx/item_pickup.mp3`,
  item_equip: `${BASE_PATH}/audio/sfx/item_equip.mp3`,
  item_unequip: `${BASE_PATH}/audio/sfx/item_unequip.mp3`,
  level_up: `${BASE_PATH}/audio/sfx/level_up.mp3`,
  quest_complete: `${BASE_PATH}/audio/sfx/quest_complete.mp3`,
  quest_start: `${BASE_PATH}/audio/sfx/quest_start.mp3`,
  eat: `${BASE_PATH}/audio/sfx/eat.mp3`,
  drink: `${BASE_PATH}/audio/sfx/drink.mp3`,
  drink_potion: `${BASE_PATH}/audio/sfx/drink_potion.mp3`,
  rest: `${BASE_PATH}/audio/sfx/rest.mp3`,
  menu_open: `${BASE_PATH}/audio/sfx/menu_open.mp3`,
  menu_close: `${BASE_PATH}/audio/sfx/menu_close.mp3`,
  button_click: `${BASE_PATH}/audio/sfx/button_click.mp3`,
  error: `${BASE_PATH}/audio/sfx/error.mp3`,
  success: `${BASE_PATH}/audio/sfx/success.mp3`,
  // Combat sounds
  attack_melee: `${BASE_PATH}/audio/sfx/attack_melee.mp3`,
  attack_ranged: `${BASE_PATH}/audio/sfx/attack_ranged.mp3`,
  attack_magic: `${BASE_PATH}/audio/sfx/attack_magic.mp3`,
  block: `${BASE_PATH}/audio/sfx/block.mp3`,
  shield_bash: `${BASE_PATH}/audio/sfx/shield_bash.mp3`,
  spell_impact: `${BASE_PATH}/audio/sfx/spell_impact.mp3`,
  hit_received: `${BASE_PATH}/audio/sfx/hit_received.mp3`,
  enemy_death: `${BASE_PATH}/audio/sfx/enemy_death.mp3`,
  dice_tick: `${BASE_PATH}/audio/sfx/dice_tick.mp3`,
  // Blacksmith sounds
  forge_upgrade: `${BASE_PATH}/audio/sfx/forge_upgrade.mp3`,
  anvil_hit: `${BASE_PATH}/audio/sfx/anvil_hit.mp3`,
};

// Music track paths (to be populated with actual music files)
const MUSIC_TRACKS: Record<MusicTrack, string | null> = {
  main_menu: `${BASE_PATH}/audio/music/main_menu.mp3`,
  exploration: `${BASE_PATH}/audio/music/exploration.mp3`,
  tavern: `${BASE_PATH}/audio/music/tavern.mp3`,
  combat: `${BASE_PATH}/audio/music/combat.mp3`,
  peaceful: `${BASE_PATH}/audio/music/peaceful.mp3`,
  night: `${BASE_PATH}/audio/music/night.mp3`,
};

class AudioService {
  private config: AudioConfig;
  private musicAudio: HTMLAudioElement | null = null;
  private currentTrack: MusicTrack | null = null;
  private soundEffectCache: Map<string, HTMLAudioElement> = new Map();
  // Cache availability of sound URLs to avoid repeated NotSupportedError spam
  private soundAvailabilityCache: Map<string, boolean> = new Map();
  private isInitialized: boolean = false;
  private pendingTrack: MusicTrack | null = null; // Track to play after user interaction
  private lastRequestedTrack: MusicTrack | null = null; // Remember last track for re-enabling music

  constructor() {
    this.config = this.loadConfig();
  }

  // Load configuration from localStorage
  private loadConfig(): AudioConfig {
    try {
      if (typeof localStorage !== 'undefined' && typeof (localStorage as any).getItem === 'function') {
        const saved = localStorage.getItem('aetherius:audioConfig');
        if (saved) {
          return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
      }
    } catch (e) {
      console.warn('Failed to load audio config:', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  // Save configuration to localStorage
  private saveConfig(): void {
    try {
      if (typeof localStorage !== 'undefined' && typeof (localStorage as any).setItem === 'function') {
        localStorage.setItem('aetherius:audioConfig', JSON.stringify(this.config));
      }
    } catch (e) {
      console.warn('Failed to save audio config:', e);
    }
  }

  // Initialize the audio service (should be called after user interaction)
  public initialize(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    console.log('🔊 Audio service initialized');
    
    // Play any pending track that was requested before user interaction
    if (this.pendingTrack) {
      const track = this.pendingTrack;
      this.pendingTrack = null;
      this.playMusic(track, true);
    }
  }

  // Check if user has interacted (audio can play)
  public isReady(): boolean {
    return this.isInitialized;
  }

  // Play a sound effect
  public playSoundEffect(effect: SoundEffect): void {
    if (!this.config.soundEffectsEnabled) return;
    
    const path = SOUND_EFFECTS[effect];
    if (!path) {
      // Sound file not yet added - log for debugging
      console.debug(`🔇 Sound effect "${effect}" not yet added`);
      return;
    }

    try {
      // If we previously determined the audio URL is unavailable, skip attempts
      const cachedAvailable = this.soundAvailabilityCache.get(path);
      if (cachedAvailable === false) {
        console.debug(`🔇 Skipping unavailable sound (cached): ${path}`);
        return;
      }

      let audio = this.soundEffectCache.get(path);
      if (!audio) {
        audio = new Audio(path);
        this.soundEffectCache.set(path, audio);
      }

      audio.volume = this.config.soundEffectsVolume;
      audio.currentTime = 0;
      audio.play().catch(e => {
        // Provide clearer log and avoid repeating the same failing attempts
        console.warn(`Failed to play sound effect "${effect}" (${path}):`, e);
        try {
          const msg = (e && e.message) ? e.message : String(e);
          if (e && (e.name === 'NotSupportedError' || /no supported source/i.test(msg) || /not supported/i.test(msg))) {
            this.soundAvailabilityCache.set(path, false);
            console.debug(`Marked sound as unavailable: ${path}`);
          }
        } catch (inner) {
          // ignore cache errors
        }
      });
    } catch (e) {
      console.warn(`Error playing sound effect "${effect}":`, e);
    }
  }

  // Play background music
  public playMusic(track: MusicTrack, fadeIn: boolean = true): void {
    // Always remember the last requested track
    this.lastRequestedTrack = track;
    
    if (!this.config.musicEnabled) return;
    
    const path = MUSIC_TRACKS[track];
    if (!path) {
      console.debug(`🔇 Music track "${track}" not yet added`);
      return;
    }

    // If not yet initialized (no user interaction), queue the track for later
    if (!this.isInitialized) {
      console.log(`🎵 Queuing "${track}" music (waiting for user interaction)`);
      this.pendingTrack = track;
      return;
    }

    // If already playing this track, do nothing
    if (this.currentTrack === track && this.musicAudio && !this.musicAudio.paused) {
      return;
    }

    // Stop current music (without fade to avoid AbortError)
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio = null;
      this.currentTrack = null;
    }

    try {
      this.musicAudio = new Audio(path);
      this.musicAudio.loop = true;
      this.currentTrack = track;

      if (fadeIn) {
        this.musicAudio.volume = 0;
        const playPromise = this.musicAudio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            this.fadeInMusic();
          }).catch(e => {
            // Ignore AbortError - it's expected when quickly switching tracks
            if (e.name !== 'AbortError') {
              console.warn(`Failed to play music "${track}":`, e);
            }
          });
        }
      } else {
        this.musicAudio.volume = this.config.musicVolume;
        const playPromise = this.musicAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name !== 'AbortError') {
              console.warn(`Failed to play music "${track}":`, e);
            }
          });
        }
      }
    } catch (e) {
      console.warn(`Error playing music "${track}":`, e);
    }
  }

  // Stop background music
  public stopMusic(fadeOut: boolean = true): void {
    if (!this.musicAudio) return;

    if (fadeOut) {
      this.fadeOutMusic().then(() => {
        if (this.musicAudio) {
          this.musicAudio.pause();
          this.musicAudio = null;
          this.currentTrack = null;
        }
      });
    } else {
      this.musicAudio.pause();
      this.musicAudio = null;
      this.currentTrack = null;
    }
  }

  // Fade in music
  private fadeInMusic(duration: number = 1000): void {
    if (!this.musicAudio) return;
    
    const targetVolume = this.config.musicVolume;
    const step = targetVolume / (duration / 50);
    
    const fadeInterval = setInterval(() => {
      if (!this.musicAudio) {
        clearInterval(fadeInterval);
        return;
      }
      
      if (this.musicAudio.volume < targetVolume) {
        this.musicAudio.volume = Math.min(targetVolume, this.musicAudio.volume + step);
      } else {
        clearInterval(fadeInterval);
      }
    }, 50);
  }

  // Fade out music
  private fadeOutMusic(duration: number = 500): Promise<void> {
    return new Promise(resolve => {
      if (!this.musicAudio) {
        resolve();
        return;
      }
      
      const step = this.musicAudio.volume / (duration / 50);
      
      const fadeInterval = setInterval(() => {
        if (!this.musicAudio) {
          clearInterval(fadeInterval);
          resolve();
          return;
        }
        
        if (this.musicAudio.volume > step) {
          this.musicAudio.volume = Math.max(0, this.musicAudio.volume - step);
        } else {
          this.musicAudio.volume = 0;
          clearInterval(fadeInterval);
          resolve();
        }
      }, 50);
    });
  }

  // Pause music (without stopping)
  public pauseMusic(): void {
    if (this.musicAudio && !this.musicAudio.paused) {
      this.musicAudio.pause();
    }
  }

  // Resume music
  public resumeMusic(): void {
    if (this.musicAudio && this.musicAudio.paused && this.config.musicEnabled) {
      this.musicAudio.play().catch(e => {
        console.warn('Failed to resume music:', e);
      });
    }
  }

  // Duck (lower) music volume for TTS/voice playback
  private preDuckVolume: number | null = null;
  private isDucked: boolean = false;

  public duckMusic(targetVolume: number = 0.1): void {
    if (!this.musicAudio || this.isDucked) return;
    this.preDuckVolume = this.musicAudio.volume;
    this.isDucked = true;
    
    // Fade down quickly
    const fadeDown = () => {
      if (!this.musicAudio) return;
      const step = (this.preDuckVolume! - targetVolume) / 10;
      let currentVol = this.preDuckVolume!;
      const interval = setInterval(() => {
        if (!this.musicAudio || !this.isDucked) {
          clearInterval(interval);
          return;
        }
        currentVol -= step;
        if (currentVol <= targetVolume) {
          this.musicAudio.volume = targetVolume;
          clearInterval(interval);
        } else {
          this.musicAudio.volume = currentVol;
        }
      }, 30);
    };
    fadeDown();
  }

  public unduckMusic(): void {
    if (!this.musicAudio || !this.isDucked || this.preDuckVolume === null) return;
    this.isDucked = false;
    const targetVolume = this.preDuckVolume;
    this.preDuckVolume = null;
    
    // Fade up slowly
    const fadeUp = () => {
      if (!this.musicAudio) return;
      const step = (targetVolume - this.musicAudio.volume) / 20;
      const interval = setInterval(() => {
        if (!this.musicAudio || this.isDucked) {
          clearInterval(interval);
          return;
        }
        const newVol = this.musicAudio.volume + step;
        if (newVol >= targetVolume) {
          this.musicAudio.volume = targetVolume;
          clearInterval(interval);
        } else {
          this.musicAudio.volume = newVol;
        }
      }, 50);
    };
    fadeUp();
  }

  public isMusicDucked(): boolean {
    return this.isDucked;
  }

  // Get/Set configuration
  public getConfig(): AudioConfig {
    return { ...this.config };
  }

  public setSoundEffectsEnabled(enabled: boolean): void {
    this.config.soundEffectsEnabled = enabled;
    this.saveConfig();
  }

  public setMusicEnabled(enabled: boolean): void {
    this.config.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic(true);
    } else {
      // Re-enable: resume last requested track if available
      if (this.lastRequestedTrack && this.isInitialized) {
        console.log(`🎵 Music re-enabled, resuming "${this.lastRequestedTrack}"`);
        this.playMusic(this.lastRequestedTrack, true);
      }
    }
    this.saveConfig();
  }

  public setSoundEffectsVolume(volume: number): void {
    this.config.soundEffectsVolume = Math.max(0, Math.min(1, volume));
    this.saveConfig();
  }

  public setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicAudio) {
      this.musicAudio.volume = this.config.musicVolume;
    }
    this.saveConfig();
  }

  // Check if sound effects are available
  public isSoundEffectAvailable(effect: SoundEffect): boolean {
    return SOUND_EFFECTS[effect] !== null;
  }

  // Check if music track is available
  public isMusicTrackAvailable(track: MusicTrack): boolean {
    return MUSIC_TRACKS[track] !== null;
  }

  // Get current music track
  public getCurrentTrack(): MusicTrack | null {
    return this.currentTrack;
  }

  // Check if music is currently playing
  public isMusicPlaying(): boolean {
    return this.musicAudio !== null && !this.musicAudio.paused;
  }
}

// Singleton instance
export const audioService = new AudioService();

// Helper hooks for React components
export function useAudioConfig() {
  return audioService.getConfig();
}

// Convenience functions
export function playSoundEffect(effect: SoundEffect): void {
  audioService.playSoundEffect(effect);
}

export function playMusic(track: MusicTrack, fadeIn?: boolean): void {
  audioService.playMusic(track, fadeIn);
}

export function stopMusic(fadeOut?: boolean): void {
  audioService.stopMusic(fadeOut);
}

// ============================================================================
// AUTOMATIC MUSIC SELECTION BASED ON GAME STATE
// ============================================================================

export interface AmbientContext {
  localeType?: 'wilderness' | 'tavern' | 'city' | 'dungeon' | 'interior' | 'road';
  inCombat?: boolean;
  mood?: 'peaceful' | 'tense' | 'mysterious' | 'triumphant';
  timeOfDay?: number; // 0-23 hour
}

/**
 * Selects the appropriate music track based on current game context.
 * Priority: Combat > Locale Type > Time of Day > Default
 */
export function selectMusicTrack(context: AmbientContext): MusicTrack {
  // Combat takes highest priority - ALWAYS override locale
  if (context.inCombat === true) {
    return 'combat';
  }

  // Locale-based music (only if not in combat)
  if (context.localeType) {
    switch (context.localeType) {
      case 'tavern':
        return 'tavern';
      case 'dungeon':
        // Dungeons get exploration or mysterious music (combat handled above)
        return context.mood === 'mysterious' ? 'exploration' : 'exploration';
      case 'city':
      case 'interior':
        return 'peaceful';
      case 'wilderness':
      case 'road':
        // Check time of day for wilderness
        const hour = context.timeOfDay ?? 12;
        if (hour >= 20 || hour < 5) {
          return 'night';
        }
        return 'exploration';
    }
  }

  // Time-based fallback
  const hour = context.timeOfDay ?? 12;
  if (hour >= 20 || hour < 5) {
    return 'night';
  }

  // Default exploration
  return 'exploration';
}

/**
 * Automatically updates music based on game state.
 * Call this after processing GameStateUpdate.
 */
export function updateMusicForContext(context: AmbientContext): void {
  const track = selectMusicTrack(context);
  const currentTrack = audioService.getCurrentTrack();
  
  // Only change if different (playMusic already checks, but this avoids console spam)
  if (currentTrack !== track) {
    console.log(`🎵 Music change: ${currentTrack || 'none'} → ${track} (context: ${JSON.stringify(context)})`);
    audioService.playMusic(track, true); // fade in
  }
}
