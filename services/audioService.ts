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
  | 'attack_fire'     // Fire-flavored attack (conjurations, fire elementals)
  | 'attack_ice'      // Ice/frost attack
  | 'attack_shock'    // Shock/lightning attack
  | 'attack_bite'     // Bite/animal attack
  | 'attack_claw'     // Claw/paw attack
  | 'block'           // Blocking/defending
  | 'shield_bash'     // Shield bash attack
  | 'spell_impact'    // Spell hitting target (generic)
  | 'spell_impact_fire'
  | 'spell_impact_ice'
  | 'spell_impact_shock'
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
  // menu open/close sounds intentionally disabled due to repeated triggering issues
  menu_open: null,
  menu_close: null,
  button_click: `${BASE_PATH}/audio/sfx/button_click.mp3`,
  error: `${BASE_PATH}/audio/sfx/error.mp3`,
  success: `${BASE_PATH}/audio/sfx/success.mp3`,
  // Combat sounds
  attack_melee: `${BASE_PATH}/audio/sfx/attack_melee.mp3`,
  attack_ranged: `${BASE_PATH}/audio/sfx/attack_ranged.mp3`,
  attack_magic: `${BASE_PATH}/audio/sfx/attack_magic.mp3`,
  attack_fire: `${BASE_PATH}/audio/sfx/attack_fire.mp3`,
  attack_ice: `${BASE_PATH}/audio/sfx/attack_ice.mp3`,
  attack_shock: `${BASE_PATH}/audio/sfx/attack_shock.mp3`,
  attack_bite: `${BASE_PATH}/audio/sfx/attack_bite.mp3`,
  attack_claw: `${BASE_PATH}/audio/sfx/attack_claw.mp3`,
  block: `${BASE_PATH}/audio/sfx/block.mp3`,
  shield_bash: `${BASE_PATH}/audio/sfx/shield_bash.mp3`,
  spell_impact: `${BASE_PATH}/audio/sfx/spell_impact.mp3`,
  spell_impact_fire: `${BASE_PATH}/audio/sfx/spell_impact_fire.mp3`,
  spell_impact_ice: `${BASE_PATH}/audio/sfx/spell_impact_ice.mp3`,
  spell_impact_shock: `${BASE_PATH}/audio/sfx/spell_impact_shock.mp3`,
  hit_received: `${BASE_PATH}/audio/sfx/hit_received.mp3`,
  enemy_death: `${BASE_PATH}/audio/sfx/enemy_death.mp3`,
  dice_tick: `${BASE_PATH}/audio/sfx/dice_tick.mp3`,
  // Blacksmith sounds
  // Use a more distinct sound for upgrade success (falls back to level_up)
  forge_upgrade: `${BASE_PATH}/audio/sfx/level_up.mp3`,
  anvil_hit: `${BASE_PATH}/audio/sfx/anvil_hit.mp3`,

};

// Per-effect fallback cooldowns (milliseconds) to avoid spam from repeated triggers
const SOUND_COOLDOWNS_MS: Partial<Record<SoundEffect, number>> = {
  button_click: 120,
  // Make menu open/close less chatty by increasing cooldown
  menu_open: 1000,
  menu_close: 1000,
  dice_tick: 30,
  hit_received: 80,
  attack_melee: 100,
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
  // Track last-played timestamps per effect to rate-limit noisy effects
  private lastPlayedTimestamps: Map<SoundEffect, number> = new Map();
  // Debug flag to enable verbose SFX logs for troubleshooting repeated triggers
  private debugSfx: boolean = false;
  // Recent SFX event buffer (circular) to aid debugging repeated triggers
  private recentSfxEvents: Array<{ts:number, kind:'play'|'skip'|'modal_open'|'modal_close'|'error', effect?: SoundEffect, path?: string, stack?: string, msg?: string}> = [];

  private pushSfxEvent(event: {kind:'play'|'skip'|'modal_open'|'modal_close'|'error', effect?: SoundEffect, path?: string, stack?: string, msg?: string}) {
    try {
      const item = { ...event, ts: Date.now() };
      this.recentSfxEvents.push(item);
      // Keep buffer bounded
      if (this.recentSfxEvents.length > 250) this.recentSfxEvents.shift();
      if (this.debugSfx) console.debug('📝 SFX event:', item);
    } catch (e) {
      // best-effort only
    }
  }

  public getRecentSfxEvents() {
    return [...this.recentSfxEvents];
  }

  public clearRecentSfxEvents() {
    this.recentSfxEvents = [];
  }

  public setDebugSfx(enabled: boolean): void {
    this.debugSfx = !!enabled;
  }
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
      const playResult: any = audio.play();

      // Rate-limit duplicate trigger spam for the same sound effect
      try {
        const now = Date.now();
        const cooldown = SOUND_COOLDOWNS_MS[effect] ?? 0;
        const last = this.lastPlayedTimestamps.get(effect) || 0;
        if (cooldown > 0 && now - last < cooldown) {
          // Skip playing to prevent spam
          if (this.debugSfx) console.debug(`🔇 SFX cooldown: Skipping "${effect}" (${now - last}ms < ${cooldown}ms)`, new Error().stack);
          this.pushSfxEvent({ kind: 'skip', effect, path, stack: new Error().stack });
          return;
        }
        if (this.debugSfx) console.debug(`▶️ Playing SFX "${effect}"`, new Error().stack);
        this.pushSfxEvent({ kind: 'play', effect, path, stack: new Error().stack });
        this.lastPlayedTimestamps.set(effect, now);
      } catch (e) {
        // ignore timing guard failures
      }

      // Some environments (JSDOM) don't implement play() as a Promise — guard access to .catch
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch((e: any) => {
          // Provide clearer log and avoid repeating the same failing attempts
          console.warn(`Failed to play sound effect "${effect}" (${path}):`, e);
          try {
            const msg = (e && e.message) ? e.message : String(e);
            // push an event for debug tracing
            this.pushSfxEvent({ kind: 'error', effect, path, stack: (new Error().stack || ''), msg });
            if (e && (e.name === 'NotSupportedError' || /no supported source/i.test(msg) || /not supported/i.test(msg))) {
              this.soundAvailabilityCache.set(path, false);
              console.debug(`Marked sound as unavailable: ${path}`);
            }
          } catch (inner) {
            // ignore cache errors
          }
        });
      } else if (typeof playResult === 'undefined') {
        // Non-throwing fallback: play() is not implemented; mark as unavailable to silence repeated attempts
        this.soundAvailabilityCache.set(path, false);
        this.pushSfxEvent({ kind: 'error', effect, path, stack: (new Error().stack || ''), msg: 'no play support' });
        console.debug(`Marked sound as unavailable (no play support): ${path}`);
      }
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

  // Track how many modals are open. This prevents repeatedly playing menu_open/menu_close when
  // nested modal components mount/unmount while the overall modal stack stays open.
  private modalOpenCount: number = 0;
  // Track last modal notify time to suppress rapid open/close toggle noise
  private lastModalNotifyTs: number = 0;
  private lastModalEventKind: 'open' | 'close' | null = null;

  public notifyModalOpen(callerStack?: string): void {
    try {
      const now = Date.now();
      this.modalOpenCount = (this.modalOpenCount || 0) + 1;
      // If we just closed and reopened very quickly, suppress the menu_open sound to avoid spam
      if (this.lastModalEventKind === 'close' && now - this.lastModalNotifyTs < 150) {
        if (this.debugSfx) console.debug('🔇 Suppressing quick modal re-open (rapid toggle)', new Error().stack);
        this.pushSfxEvent({ kind: 'skip', effect: 'menu_open', path: SOUND_EFFECTS['menu_open'] || undefined, stack: callerStack || (new Error().stack || ''), msg: 'rapid toggle suppress' });
      } else {
        this.pushSfxEvent({ kind: 'modal_open', stack: callerStack || (new Error().stack || '') });
        if (this.modalOpenCount === 1) {
          // menu_open sound suppressed intentionally
          if (this.debugSfx) console.debug('🔇 menu_open sound suppressed (disabled)');
        }
      }
      this.lastModalNotifyTs = now;
      this.lastModalEventKind = 'open';
    } catch (e) {
      console.warn('Failed to notify modal open', e);
      this.pushSfxEvent({ kind: 'error', msg: 'notifyModalOpen failure', stack: (e && e.stack) ? e.stack : String(e) });
    }
  }

  public notifyModalClose(callerStack?: string): void {
    try {
      if (!this.modalOpenCount) return;
      const now = Date.now();
      this.modalOpenCount = Math.max(0, this.modalOpenCount - 1);
      // If we just opened and closed very quickly, suppress the menu_close sound to avoid spam
      if (this.lastModalEventKind === 'open' && now - this.lastModalNotifyTs < 150) {
        if (this.debugSfx) console.debug('🔇 Suppressing quick modal close (rapid toggle)', new Error().stack);
        this.pushSfxEvent({ kind: 'skip', effect: 'menu_close', path: SOUND_EFFECTS['menu_close'] || undefined, stack: callerStack || (new Error().stack || ''), msg: 'rapid toggle suppress' });
      // Additionally, if we've recently emitted a menu_close, suppress repeated closes for a longer window
      } else if (this.lastModalEventKind === 'close' && now - this.lastModalNotifyTs < 800) {
        if (this.debugSfx) console.debug('🔇 Suppressing repeated menu_close (within 800ms)', new Error().stack);
        this.pushSfxEvent({ kind: 'skip', effect: 'menu_close', path: SOUND_EFFECTS['menu_close'] || undefined, stack: callerStack || (new Error().stack || ''), msg: 'repeated close suppress' });
      } else {
        this.pushSfxEvent({ kind: 'modal_close', stack: callerStack || (new Error().stack || '') });
        if (this.modalOpenCount === 0) {
          // menu_close sound suppressed intentionally
          if (this.debugSfx) console.debug('🔇 menu_close sound suppressed (disabled)');
        }
      }
      this.lastModalNotifyTs = now;
      this.lastModalEventKind = 'close';
    } catch (e) {
      console.warn('Failed to notify modal close', e);
      this.pushSfxEvent({ kind: 'error', msg: 'notifyModalClose failure', stack: (e && e.stack) ? e.stack : String(e) });
    }
  }

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

// Expose helper globally for easy debugging in dev (console): window.audioService
if (typeof window !== 'undefined') {
  try { (window as any).audioService = audioService; } catch (e) { /* ignore */ }
}

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
