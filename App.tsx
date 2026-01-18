import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    INITIAL_CHARACTER_TEMPLATE, SKYRIM_SKILLS, Character, Perk, CustomQuest, JournalEntry, UserProfile, InventoryItem, StoryChapter, GameStateUpdate, GeneratedCharacterData, CombatState, CombatEnemy,
    DifficultyLevel, WeatherState, StatusEffect, Companion
} from './types';
import { CharacterSheet } from './components/CharacterSheet';
import ActionBar, { ActionBarToggle } from './components/ActionBar';
import { AppContext } from './AppContext';
import { QuestLog } from './components/QuestLog';
import { Journal } from './components/Journal';
import { Inventory } from './components/Inventory';
import { StoryLog } from './components/StoryLog';
import { AIScribe } from './components/AIScribe';
import { AdventureChat } from './components/AdventureChat';
import { CharacterSelect } from './components/CharacterSelect';
import { OnboardingModal } from './components/OnboardingModal';
import { CombatModal } from './components/CombatModal';
import DungeonModal from './components/DungeonModal';
import { listDungeons } from './data/dungeonDefinitions';
import dungeonService from './services/dungeonService';
import { ConsoleOverlay } from './components/ConsoleOverlay';
import { Changelog } from './components/Changelog';
import UpdateNotification from './components/UpdateNotification';
import { ToastNotification } from './components/ToastNotification';
import { QuestNotificationOverlay, QuestNotification } from './components/QuestNotification';
import { LevelUpNotificationOverlay, LevelUpNotificationData } from './components/LevelUpNotification';
import LevelBadge from './components/LevelBadge';
import SnowEffect from './components/SnowEffect';
import type { SnowSettings } from './components/SnowEffect';
import { 
  OfflineIndicator, 
  AutoSaveIndicator, 
  RateLimitIndicator,
  EncumbranceIndicator,
  SaveStatus,
  queueOfflineChange,
  processOfflineQueue
} from './components/StatusIndicators';
import { COLOR_THEMES, getEasterEggName } from './components/GameFeatures';
import { 
  CharacterExportModal, 
  CharacterImportModal,
  downloadCharacterExport,
  TimeIcon,
  getTimeOfDay,
  getTimeThemeClasses,
  WeatherDisplay,
  StatusEffectsPanel,
  CompanionCard,
  DifficultySelector,
  ThemeSelector,
} from './components/GameFeatures';
import { User, Scroll, BookOpen, Skull, Package, Feather, LogOut, Users, Loader, Save, Swords } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { setCurrentUser as setFeatureFlagUser, isFeatureEnabled, isFeatureWIP } from './featureFlags';
import { 
  initializeCombat,
  calculatePlayerCombatStats
} from './services/combatService';
import { 
  auth,
  onAuthChange, 
  registerUser,
  loginUser,
  loginAnonymously,
  logoutUser,
  sendPasswordReset
} from './services/firebase';
import {
  initializeFirestoreDb,
  loadCharacters,
  loadInventoryItems,
  loadQuests,
  loadJournalEntries,
  loadStoryChapters,
  loadUserProfiles,
  loadUserSettings,
  saveUserSettings,
  saveCharacter,
  saveInventoryItem,
  deleteInventoryItem,
  saveQuest,
  deleteQuest,
  saveJournalEntry,
  saveStoryChapter,
  saveUserProfile,
  deleteCharacter,
  batchSaveGameState,
  saveUserMetadata,
  removeDuplicateItems,
  deleteJournalEntry,
  deleteStoryChapter,
  // Companions & Loadouts
  loadUserCompanions,
  saveUserCompanions,
  deleteUserCompanions,
  // Delete a single companion document (used when dismissing a companion)
  deleteUserCompanion,
  loadUserLoadouts,
  saveUserLoadout,
  deleteUserLoadout,
} from './services/firestore';
import {
  setUserOnline,
  setUserOffline,
  setActiveCharacter,
  clearActiveCharacter
} from './services/realtime';
import { getFoodNutrition, getDrinkNutrition } from './services/nutritionData';
import { applyStatToVitals } from './services/vitals';
import { resolvePotionEffect } from './services/potionResolver';
import { getItemStats, shouldHaveStats, isValidCoreItem, estimateItemValue } from './services/itemStats';
import { updateMusicForContext, AmbientContext, audioService, playMusic } from './services/audioService';
import { getSkyrimCalendarDate, formatSkyrimDate, formatSkyrimDateShort } from './utils/skyrimCalendar';
import { getRateLimitStats, generateAdventureResponse } from './services/geminiService';
import { learnSpell, getSpellById, mergeLearnedSpellsFromCharacter, getLearnedSpellIds } from './services/spells';
import { storage } from './services/storage';
import { applyCompanionXp } from './services/companionsService';
import type { ShopItem } from './components/ShopModal';
import { getDefaultSlotForItem } from './components/EquipmentHUD';
import BonfireMenu from './components/BonfireMenu';
import type { RestOptions } from './components/SurvivalModals';
import { filterDuplicateTransactions, getTransactionLedger } from './services/transactionLedger';
import type { PreferredAIModel } from './services/geminiService';
import type { UserSettings } from './services/firestore';
import LevelUpModal from './components/LevelUpModal';
import { applyLevelUpToCharacter } from './utils/levelUpHelpers';
import { getXPForNextLevel, getXPProgress, getTotalXPForLevel } from './utils/levelingSystem';
import PerkTreeModal from './components/PerkTreeModal';
import CompanionsModal from './components/CompanionsModal';
import CompanionDialogueModal from './components/CompanionDialogueModal';
import PERK_BALANCE from './data/perkBalance';
import PERK_DEFINITIONS from './data/perkDefinitions';
import { useLocalization } from './services/localization';

const uniqueId = () => Math.random().toString(36).substr(2, 9);

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// Tunable passive need rates (per in-game minute). Lower = slower.
// Example: hungerPerMinute = 1/180 means +1 hunger every 180 minutes (~3 hours).
const NEED_RATES = {
  hungerPerMinute: 1 / 180,
  thirstPerMinute: 1 / 120,
  fatiguePerMinute: 1 / 90,
} as const;

const calcNeedFromTime = (minutes: number, perMinute: number) => {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  const raw = minutes * perMinute;
  // Keep it readable and stable.
  return Math.round(raw * 10) / 10;
};

const SURVIVAL_THRESHOLDS = {
  warn: 60,
  severe: 80,
  critical: 100,
  collapseSum: 180, // Increased from 160 - only force rest when truly exhausted
} as const;

const clampNeedValue = (n: number) => clamp(Number(n || 0), 0, 100);

const computeSurvivalEffects = (needs: { hunger: number; thirst: number; fatigue: number }) => {
  const hunger = clampNeedValue(needs.hunger);
  const thirst = clampNeedValue(needs.thirst);
  const fatigue = clampNeedValue(needs.fatigue);
  const sum = hunger + thirst;

  const forcedRest = fatigue >= SURVIVAL_THRESHOLDS.critical || sum >= SURVIVAL_THRESHOLDS.collapseSum;

  const effects: StatusEffect[] = [];

  if (hunger >= SURVIVAL_THRESHOLDS.severe) {
    effects.push({
      id: 'survival_hunger_severe',
      name: 'Starving',
      type: 'debuff',
      icon: '🍖',
      description: 'Weakness and slowed reactions. Fighting and travel suffer until you eat.',
      effects: [{ stat: 'combat', modifier: -0.2 }]
    });
  } else if (hunger >= SURVIVAL_THRESHOLDS.warn) {
    effects.push({
      id: 'survival_hunger_warn',
      name: 'Hungry',
      type: 'debuff',
      icon: '🍞',
      description: 'Your body demands food. Stamina and focus start to slip.',
      effects: [{ stat: 'combat', modifier: -0.1 }]
    });
  }

  if (thirst >= SURVIVAL_THRESHOLDS.severe) {
    effects.push({
      id: 'survival_thirst_severe',
      name: 'Dehydrated',
      type: 'debuff',
      icon: '💧',
      description: 'Your endurance is failing. Fatigue rises faster until you drink.',
      effects: [{ stat: 'endurance', modifier: -0.2 }]
    });
  } else if (thirst >= SURVIVAL_THRESHOLDS.warn) {
    effects.push({
      id: 'survival_thirst_warn',
      name: 'Thirsty',
      type: 'debuff',
      icon: '🥤',
      description: 'Dry mouth and dull senses. You need water soon.',
      effects: [{ stat: 'endurance', modifier: -0.1 }]
    });
  }

  if (fatigue >= SURVIVAL_THRESHOLDS.critical) {
    effects.push({
      id: 'survival_fatigue_critical',
      name: 'Collapsed',
      type: 'debuff',
      icon: '💤',
      description: 'You can barely stay conscious. Rest is mandatory.',
      effects: [{ stat: 'actions', modifier: -1 }]
    });
  } else if (fatigue >= SURVIVAL_THRESHOLDS.severe) {
    effects.push({
      id: 'survival_fatigue_severe',
      name: 'Exhausted',
      type: 'debuff',
      icon: '😵',
      description: 'Your limbs feel heavy. Combat and travel are heavily penalized.',
      effects: [{ stat: 'combat', modifier: -0.25 }]
    });
  } else if (fatigue >= SURVIVAL_THRESHOLDS.warn) {
    effects.push({
      id: 'survival_fatigue_warn',
      name: 'Tired',
      type: 'debuff',
      icon: '🕯️',
      description: 'Slower reactions and reduced endurance.',
      effects: [{ stat: 'combat', modifier: -0.1 }]
    });
  }

  if (!forcedRest && sum >= SURVIVAL_THRESHOLDS.collapseSum - 10) {
    effects.push({
      id: 'survival_edge',
      name: 'On the Edge',
      type: 'debuff',
      icon: '⚠️',
      description: 'Hunger and thirst are compounding. Keep pushing and you will collapse.',
      effects: [{ stat: 'actions', modifier: -0.5 }]
    });
  }

  return { forcedRest, effects };
};

const addMinutesToTime = (time: { day: number; hour: number; minute: number }, minutesToAdd: number) => {
  const safe = {
    day: Math.max(1, Number(time?.day || 1)),
    hour: clamp(Number(time?.hour || 0), 0, 23),
    minute: clamp(Number(time?.minute || 0), 0, 59)
  };
  const total = safe.hour * 60 + safe.minute + Math.trunc(minutesToAdd || 0);
  let dayDelta = Math.floor(total / (24 * 60));
  let remainder = total % (24 * 60);
  if (remainder < 0) {
    remainder += 24 * 60;
    dayDelta -= 1;
  }
  const hour = Math.floor(remainder / 60);
  const minute = remainder % 60;
  return {
    day: Math.max(1, safe.day + dayDelta),
    hour,
    minute,
  };
};

// Normalize inventory items before persisting to Firestore or using in combat
const sanitizeInventoryItem = (item: Partial<InventoryItem>): Partial<InventoryItem> => {
  const clean: any = { ...item };
  // Undefined quantity defaults to 1; allow explicit 0 to represent deletion (handled by caller)
  if (!Number.isFinite(clean.quantity)) clean.quantity = 1;

  // Drop undefined or invalid numeric fields to avoid Firestore errors
  if (clean.armor === undefined || !Number.isFinite(clean.armor)) delete clean.armor;
  if (clean.damage === undefined || !Number.isFinite(clean.damage)) delete clean.damage;
  if (clean.weight === undefined || !Number.isFinite(clean.weight)) delete clean.weight;
  if (clean.value === undefined || !Number.isFinite(clean.value)) delete clean.value;

  // For potions: attempt to infer subtype and numeric amount from name/description
  // so items added via shop/loot without explicit `damage` still function.
  if (clean.type === 'potion') {
    const text = ((clean.description || '') + ' ' + (clean.name || '')).toLowerCase();
    if (!clean.subtype) {
      if (text.includes('health') || text.includes('heal')) clean.subtype = 'health';
      else if (text.includes('magicka') || text.includes('mana')) clean.subtype = 'magicka';
      else if (text.includes('stamina') || text.includes('endurance')) clean.subtype = 'stamina';
    }
    if (clean.damage === undefined || !Number.isFinite(clean.damage)) {
      const m = text.match(/(-?\d+(?:\.\d+)?)/);
      if (m) {
        const parsed = Number(m[1]);
        if (!Number.isNaN(parsed)) clean.damage = parsed;
      }
    }
  }

  // Ensure favorite flag is boolean and default to false when missing
  if (clean.isFavorite === undefined || clean.isFavorite === null) {
    clean.isFavorite = false;
  } else {
    clean.isFavorite = !!clean.isFavorite;
  }

  return clean;
};

const formatTime = (time: { day: number; hour: number; minute: number }) => {
  const d = Math.max(1, Number(time?.day || 1));
  const h = clamp(Number(time?.hour || 0), 0, 23);
  const m = clamp(Number(time?.minute || 0), 0, 59);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const TABS = {
  CHARACTER: 'character',
  INVENTORY: 'inventory',
  QUESTS: 'quests',
  STORY: 'story',
  JOURNAL: 'journal',
  ADVENTURE: 'adventure'
};

interface AppGameState {
  profiles: UserProfile[];
  characters: Character[];
  items: InventoryItem[];
  quests: CustomQuest[];
  journalEntries: JournalEntry[];
  storyChapters: StoryChapter[];
}

const App: React.FC = () => {
  // Localization
  const { t } = useLocalization();
  
  // Authentication State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Global State (in-memory)
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [quests, setQuests] = useState<CustomQuest[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [storyChapters, setStoryChapters] = useState<StoryChapter[]>([]);

  // Combat State
  const [combatState, setCombatState] = useState<CombatState | null>(null);

  // Onboarding (shown to new users)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Dirty state tracking for debounced saves
  const [dirtyEntities, setDirtyEntities] = useState<Set<string>>(new Set());
  const [lastCloudSaveAt, setLastCloudSaveAt] = useState<number | null>(null);
  const [lastCloudSavedCharacterId, setLastCloudSavedCharacterId] = useState<string | null>(null);

  // Session State
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(TABS.CHARACTER);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Status Indicators
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [rateLimitStats, setRateLimitStats] = useState(getRateLimitStats());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // New Game Features State
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('adept');
  const [weather, setWeather] = useState<WeatherState>({ type: 'clear', intensity: 0, temperature: 10 });
  const [statusEffects, setStatusEffects] = useState<StatusEffect[]>([]);

  // Tick down status effect durations every second and remove expired effects
  React.useEffect(() => {
    if (!statusEffects || statusEffects.length === 0) return;
    const interval = setInterval(() => {
      setStatusEffects(prev => {
        if (!prev || prev.length === 0) return prev;
        const decremented = prev.map(se => ({ ...se, duration: Math.max(0, (se.duration || 0) - 1) }));
        const expired = decremented.filter(se => (se.duration || 0) <= 0);
        const remaining = decremented.filter(se => (se.duration || 0) > 0);
        if (expired.length) {
          expired.forEach(e => showToast(`${e.name} expired`, 'info'));
        }
        return remaining;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [statusEffects.length]);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [colorTheme, setColorTheme] = useState('default');
  const [weatherEffect, setWeatherEffect] = useState<'snow' | 'rain' | 'sandstorm' | 'none'>(() => {
    // Load from localStorage
    try {
      const saved = localStorage.getItem('aetherius:weatherEffect');
      if (saved && ['snow', 'rain', 'sandstorm', 'none'].includes(saved)) {
        return saved as 'snow' | 'rain' | 'sandstorm' | 'none';
      }
    } catch (e) {}
    return 'snow';
  });

  // Effects enabled toggle (read from localStorage, respects prefers-reduced-motion)
  const [effectsEnabled, setEffectsEnabled] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return true;
      const prefReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const saved = localStorage.getItem('aetherius:effectsEnabled');
      if (saved === 'false') return false;
      return !prefReduced;
    } catch (e) {
      return true;
    }
  });

  // Defer mounting large visual effects until after first paint / idle to improve LCP
  const [mountWeather, setMountWeather] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handle = (window as any).requestIdleCallback
      ? (window as any).requestIdleCallback(() => setMountWeather(true), { timeout: 1000 })
      : window.setTimeout(() => setMountWeather(true), 650);
    return () => {
      try {
        if ((window as any).cancelIdleCallback && handle) (window as any).cancelIdleCallback(handle);
        else clearTimeout(handle as number);
      } catch {}
    };
  }, []);

  // Keep localStorage in sync if user toggles elsewhere (storage event)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'aetherius:effectsEnabled') {
        try {
          setEffectsEnabled(e.newValue !== 'false');
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  
  const [weatherIntensity, setWeatherIntensity] = useState<'light' | 'normal' | 'heavy' | 'blizzard'>(() => {
    try {
      const saved = localStorage.getItem('aetherius:weatherIntensity');
      if (saved && ['light', 'normal', 'heavy', 'blizzard'].includes(saved)) {
        return saved as 'light' | 'normal' | 'heavy' | 'blizzard';
      }
    } catch (e) {}
    return 'normal';
  });

  // Save weather effect preference
  React.useEffect(() => {
    try {
      localStorage.setItem('aetherius:weatherEffect', weatherEffect);
    } catch (e) {}
  }, [weatherEffect]);
  
  // Save weather intensity preference
  React.useEffect(() => {
    try {
      localStorage.setItem('aetherius:weatherIntensity', weatherIntensity);
    } catch (e) {}
  }, [weatherIntensity]);

  // Apply theme variables (light / default)
  React.useEffect(() => {
    const root = document.documentElement;
    if (colorTheme === 'light') {
      // Softer, warmer light theme that's easier on the eyes
      root.style.setProperty('--skyrim-dark', '#e8e4df');      // Warm parchment background
      root.style.setProperty('--skyrim-paper', '#f5f2ed');     // Slightly off-white, like aged paper
      root.style.setProperty('--skyrim-border', '#c5bfb5');    // Warm gray-brown border
      root.style.setProperty('--skyrim-gold', '#8b6914');      // Darker gold for better contrast
      root.style.setProperty('--skyrim-gold-hover', '#a67c1a');
      root.style.setProperty('--skyrim-text', '#2d2a26');      // Warm dark brown text
      root.style.setProperty('--skyrim-accent', '#d8d3c8');    // Warm light accent
    } else {
      // default/dark
      root.style.setProperty('--skyrim-dark', '#0f0f0f');
      root.style.setProperty('--skyrim-paper', '#1a1a1a');
      root.style.setProperty('--skyrim-border', '#4a4a4a');
      root.style.setProperty('--skyrim-gold', '#c0a062');
      root.style.setProperty('--skyrim-gold-hover', '#d4b475');
      root.style.setProperty('--skyrim-text', '#d1d1d1');
      root.style.setProperty('--skyrim-accent', '#2a3b4c');
    }
  }, [colorTheme]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [restOpen, setRestOpen] = useState(false);
  // Dungeon modal state
  const [dungeonOpen, setDungeonOpen] = useState(false);
  const [dungeonId, setDungeonId] = useState<string | null>(null);
  const [dungeonReport, setDungeonReport] = useState<any | null>(null);
  // Track last rest time to prevent immediate re-triggering of forced rest
  // Use ref to avoid stale closure issues when checking within handleGameUpdate
  const lastRestTimestampRef = useRef<number>(0);
  const [lastRestTimestamp, setLastRestTimestamp] = useState<number>(0);
  const REST_COOLDOWN_MS = 30000; // 30 seconds after resting before forced rest can trigger again
  // Track last forced rest trigger to prevent spam
  const lastForcedRestRef = useRef<number>(0);
  const FORCED_REST_COOLDOWN_MS = 60000; // 60 seconds between forced rest triggers
  // Optional preview options when opening the Bonfire (prefill type/hours)
  const [restPreviewOptions, setRestPreviewOptions] = useState<RestOptions | null>(null);

  const openBonfireMenu = (options?: RestOptions | null) => {
    if (options) setRestPreviewOptions(options);
    else setRestPreviewOptions(null);
    setRestOpen(true);
  };
  // Perk modal state (moved here so all hooks run before early returns)
  const [perkModalOpen, setPerkModalOpen] = useState(false);

  // Console Overlay State
  const [showConsole, setShowConsole] = useState(false);
  const [consoleKeyBuffer, setConsoleKeyBuffer] = useState('');

  // Toast Notifications
  const [toastMessages, setToastMessages] = useState<Array<{ id: string; message: string; type?: 'info' | 'success' | 'warning' | 'error'; color?: string; stat?: string; amount?: number }>>([]);
  const handleToastClose = useCallback((id: string) => {
    setToastMessages(prev => prev.filter(t => t.id !== id));
  }, []);

  // Quest Notifications (Skyrim-style announcements)
  const [questNotifications, setQuestNotifications] = useState<QuestNotification[]>([]);
  const handleQuestNotificationDismiss = useCallback((id: string) => {
    setQuestNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  const showQuestNotification = useCallback((notification: Omit<QuestNotification, 'id'>) => {
    const id = uniqueId();
    setQuestNotifications(prev => [...prev.slice(-2), { ...notification, id }]);
    // Play quest complete sound for completed quests
    if (notification.type === 'quest-completed') {
      audioService.playSoundEffect('quest_complete');
    } else if (notification.type === 'quest-started') {
      audioService.playSoundEffect('quest_start');
    }
  }, []);

  // Level Up Notifications (Skyrim-style visual announcement)
  const [levelUpNotifications, setLevelUpNotifications] = useState<LevelUpNotificationData[]>([]);
  const handleLevelUpNotificationDismiss = useCallback((id: string) => {
    setLevelUpNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Synchronous guard to avoid race-condition double-queuing of pending levelups
  const levelUpQueuedRef = useRef(false);

  const showLevelUpNotification = useCallback((characterName: string, newLevel: number) => {
    // Prevent duplicate notifications for the same character/level
    setLevelUpNotifications(prev => {
      if (prev.some(p => p.characterName === characterName && p.newLevel === newLevel)) return prev;
      const id = uniqueId();
      return [...prev, { id, characterName, newLevel }];
    });
  }, []);

  // Encumbrance calculation
  const calculateCarryWeight = useCallback((characterItems: InventoryItem[]) => {
    return characterItems.reduce((total, item) => {
      const weight = item.weight ?? getDefaultItemWeight(item.type);
      return total + (weight * (item.quantity || 1));
    }, 0);
  }, []);

  const getMaxCarryWeight = useCallback((character: Character | null) => {
    if (!character) return 300;
    // Base carry weight + stamina bonus (like in Skyrim)
    const staminaBonus = Math.floor((character.stats.stamina - 100) / 10) * 5;
    return 300 + staminaBonus;
  }, []);

  // Default weights by item type
  const getDefaultItemWeight = (type: string): number => {
    switch (type) {
      case 'weapon': return 8;
      case 'apparel': return 5;
      case 'potion': return 0.5;
      case 'ingredient': return 0.1;
      case 'food': return 0.5;
      case 'drink': return 0.5;
      case 'key': return 0;
      case 'misc': return 1;
      case 'camping': return 10;
      default: return 1;
    }
  };

  // Pending level-up state (shows interactive modal for player to choose stat bonus)
  const [pendingLevelUp, setPendingLevelUp] = useState<null | {
    charId: string;
    charName: string;
    newLevel: number;
    remainingXP: number;
    archetype?: string;
    previousXP: number;
  }>(null);

  // If a player cancels a level-up, we keep it available so they can apply it later from the hero page
  const [availableLevelUps, setAvailableLevelUps] = useState<Record<string, { charId: string; charName: string; newLevel: number; remainingXP: number; archetype?: string; previousXP: number }>>({});

  // Companions modal state
  const [companionsModalOpen, setCompanionsModalOpen] = useState(false);
  const [companionDialogue, setCompanionDialogue] = useState<null | any>(null);

  // Toast notification helper
  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', opts?: { color?: string; stat?: string; amount?: number }) => {
    // (no-change) helper kept here for context; Bonfire uses same toast flow

    console.log('showToast called:', message, type, opts);
    const id = uniqueId();
    setToastMessages(prev => {
      // Allow repeated messages so repeated consumptions show toasts; keep last 3 messages
      const next = [...prev.slice(-3), { id, message, type, color: opts?.color, stat: opts?.stat, amount: opts?.amount }];
      return next;
    });
    setTimeout(() => {
      setToastMessages(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Companion persistence: load from localStorage per-user and save on change
  useEffect(() => {
    // CRITICAL: Always clear companions and status effects when character changes to prevent carryover
    setCompanions([]);
    setStatusEffects([]); // Clear status effects when switching characters
    
    // Only load companions if we have both user and character selected
    if (!currentUser?.uid || !currentCharacterId) return;
    
    const key = `aetherius:companions:${currentUser.uid}:${currentCharacterId}`;
    
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter to ensure all companions belong to this character (safety check)
          const filtered = parsed.filter((p: any) => p.characterId === currentCharacterId);
          setCompanions(filtered);
        }
      }

      // Also try loading from Firestore for this user+character if available (server source of truth)
      (async () => {
        try {
          const remote = await loadUserCompanions(currentUser.uid, currentCharacterId);
          // Only replace companions if remote has explicit entries for this character
          if (Array.isArray(remote) && remote.length > 0) {
            // Filter to ensure all companions belong to this character
            const filtered = remote.filter((p: any) => p.characterId === currentCharacterId);
            setCompanions(filtered);
          }
        } catch (e) {
          console.warn('Failed to load companions from Firestore:', e);
        }
      })();
    } catch (err) {
      console.warn('Failed to load companions from localStorage:', err);
    }
  }, [currentUser?.uid, currentCharacterId]);

  useEffect(() => {
    // Persist companions per-character when possible
    // Only persist companions if we have both user and character selected
    if (!currentUser?.uid || !currentCharacterId) return;
    
    const key = `aetherius:companions:${currentUser.uid}:${currentCharacterId}`;
    
    // Filter companions to only include those for current character (safety check)
    const characterCompanions = companions.filter(c => c.characterId === currentCharacterId);
    
    try {
      localStorage.setItem(key, JSON.stringify(characterCompanions));
    } catch (err) {
      console.warn('Failed to persist companions to localStorage:', err);
    }

    // Attempt to persist companions to Firestore when logged in; pass characterId for scoping
    (async () => {
      try {
        await saveUserCompanions(currentUser.uid, characterCompanions, currentCharacterId);
      } catch (e) {
        console.warn('Failed to persist companions to Firestore:', e);
      }
    })();
  }, [companions, currentUser?.uid, currentCharacterId]);

  const openCompanions = () => setCompanionsModalOpen(true);
  const closeCompanions = () => setCompanionsModalOpen(false);

  const addCompanion = (c: Companion) => {
    // Ensure companion is always scoped to current character
    if (!currentCharacterId) {
      showToast('Cannot recruit companion without an active character', 'error');
      return;
    }
    const toAdd = { ...c, characterId: currentCharacterId } as Companion;
    setCompanions(prev => [...prev, toAdd]);
    showToast(`Recruited ${toAdd.name}`, 'success');
  };

  const updateCompanion = (c: Companion) => {
    setCompanions(prev => prev.map(p => p.id === c.id ? c : p));
    showToast(`Updated ${c.name}`, 'info');
  };

  const removeCompanion = (id: string) => {
    // First, unequip all items from this companion to prevent ghost-equipped items
    setItems(prev => prev.map(item => {
      if (item.equippedBy === id) {
        setDirtyEntities(d => new Set([...d, item.id]));
        return { ...item, equipped: false, slot: undefined, equippedBy: null };
      }
      return item;
    }));

    // Remove companion locally and mark for persistence cleanup
    setCompanions(prev => prev.filter(p => p.id !== id));
    setDirtyEntities(d => new Set([...d, id]));

    // Fire-and-forget: remove companion document from Firestore if available
    try {
      if (currentUser?.uid) {
        // don't await — keep UI responsive; log failures
        deleteUserCompanion(currentUser.uid, id).catch(err => {
          console.warn('Failed to delete companion from remote store:', err);
        });
      }
    } catch (e) {
      // best-effort only
    }

    showToast('Companion removed', 'warning');
  };

  // Expose a convenience on window for quick access in the console (admin/debug)
  useEffect(() => {
    (window as any).openCompanions = openCompanions;
    try {
      // Expose transaction ledger accessor for debugging (temporary)
      (window as any).getTransactionLedger = () => getTransactionLedger();
      // Expose level up helpers for integration tests and console demo
      (window as any).cancelLevelUp = () => cancelLevelUp();
      (window as any).availableLevelUps = () => availableLevelUps;
    } catch (e) {
      // ignore
    }
    return () => { try { delete (window as any).openCompanions; delete (window as any).cancelLevelUp; delete (window as any).availableLevelUps; } catch {} };
  }, [openCompanions, availableLevelUps]);

  // Map stat to a representative color (hex)
  const getStatColor = (stat?: string) => {
    switch ((stat || '').toLowerCase()) {
      case 'health': return '#ff3b30';
      case 'stamina': return '#2ecc40';
      case 'magicka': return '#2d72fc';
      case 'food': return '#ffb347';
      default: return undefined;
    }
  };

  // Try to parse vitals-like effects from a consumable item (food/drink)
  const parseConsumableVitals = (item: any) : Array<{ stat: 'health' | 'magicka' | 'stamina'; amount: number }> => {
    const out: Array<{ stat: 'health' | 'magicka' | 'stamina'; amount: number }> = [];
    if (!item) return out;
    // 1) explicit numeric damage and subtype
    if (typeof item.damage === 'number' && item.damage > 0 && typeof item.subtype === 'string') {
      const s = item.subtype.toLowerCase();
      if (s === 'health' || s === 'magicka' || s === 'stamina') {
        out.push({ stat: s as any, amount: Math.floor(item.damage) });
        return out;
      }
    }

    // 2) parse description/name text for patterns like 'restores 20 health' or 'heals 20 health'
    const text = ((item.description || '') + ' ' + (item.name || '')).toLowerCase();
    const re = /(\d+)\s*(health|magicka|stamina)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const n = Number(m[1]);
      const stat = m[2] as 'health' | 'magicka' | 'stamina';
      if (Number.isFinite(n) && n > 0) out.push({ stat, amount: Math.floor(n) });
    }

    return out;
  };

  // Persist currentCharacterId to localStorage
  useEffect(() => {
    if (currentUser?.uid && currentCharacterId) {
      try {
        localStorage.setItem(`aetherius:lastCharacter:${currentUser.uid}`, currentCharacterId);
      } catch { /* ignore */ }
    }
  }, [currentUser?.uid, currentCharacterId]);

  // Ensure TransactionLedger knows which character is active so it can record transactions
  useEffect(() => {
    import('./services/transactionLedger').then(m => {
      try {
        m.getTransactionLedger().setCharacter(currentCharacterId);
      } catch (e) {
        console.warn('Failed to set transaction ledger character:', e);
      }
    }).catch(e => {
      // Import can fail in test envs; ignore silently
    });
  }, [currentCharacterId]);

  // Persist activeTab to localStorage
  useEffect(() => {
    if (currentUser?.uid && currentCharacterId) {
      try {
        localStorage.setItem(`aetherius:lastTab:${currentUser.uid}`, activeTab);
      } catch { /* ignore */ }
    }
  }, [currentUser?.uid, currentCharacterId, activeTab]);

  // Online/Offline status tracking
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Process any queued offline changes
      if (currentUser?.uid) {
        processOfflineQueue({
          onSaveCharacter: async (data) => await saveCharacter(currentUser.uid, data),
          onSaveItem: async (data) => await saveInventoryItem(currentUser.uid, data),
          onSaveQuest: async (data) => await saveQuest(currentUser.uid, data),
          onSaveJournal: async (data) => await saveJournalEntry(currentUser.uid, data),
          onSaveStory: async (data) => await saveStoryChapter(currentUser.uid, data),
        });
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser?.uid]);

  // Rate limit stats refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setRateLimitStats(getRateLimitStats());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Console keypress tracking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only track if not in an input or textarea field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Only accept single-letter keys to build the buffer (ignore modifiers and special keys)
      const key = e.key;
      if (!key || key.length !== 1 || !/^[a-zA-Z]$/.test(key)) return;

      const lower = key.toLowerCase();
      setConsoleKeyBuffer(prev => {
        const newBuffer = (prev + lower).slice(-7); // Keep last 7 characters
        if (newBuffer.includes('console')) {
          // Prevent the final keypress from being applied to the newly-focused console input
          try { e.preventDefault(); } catch (err) {}
          setShowConsole(true);
          return '';
        }
        return newBuffer;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global Backquote / ~ key toggles the developer console (outside of text inputs)
  useEffect(() => {
    const handleBackquote = (e: KeyboardEvent) => {
      // Prefer code for layout independence, but also accept key values and legacy keyCodes
      const kc = (e as any).keyCode || (e as any).which;
      // Support a few common key outputs for the physical key under Escape across layouts
      // - Standard: ` (backquote) or ~
      // - Legacy keyCode: 192
      // - AZERTY/French layouts: 'é' or '²'
      const isBackquote = e.code === 'Backquote' || e.key === '`' || e.key === '~' || e.key === 'é' || e.key === '²' || kc === 192;
      if (!isBackquote) return;

      const active = document.activeElement as HTMLElement | null;
      if (!active) return;

      const tag = active.tagName;
      const isEditable = active.isContentEditable;

      // Do not toggle if focus is inside inputs, textareas, or contenteditable elements
      if (tag === 'INPUT' || tag === 'TEXTAREA' || isEditable) return;

      try { e.preventDefault(); } catch { /* ignore */ }
      setShowConsole(prev => !prev);
    };

    window.addEventListener('keydown', handleBackquote);
    return () => {
      window.removeEventListener('keydown', handleBackquote);
    };
  }, []);

  // AI Model Selection (global)
  const [aiModel, setAiModel] = useState<PreferredAIModel>('gemma-3-27b-it');

  useEffect(() => {
    const key = currentUser?.uid ? `aetherius:aiModel:${currentUser.uid}` : 'aetherius:aiModel';
    try {
      const raw = localStorage.getItem(key);
      if (raw) setAiModel(raw as PreferredAIModel);
    } catch {
      // ignore
    }
  }, [currentUser?.uid]);

  // Inventory quantity controls toggle (hidden by default)
  const [showQuantityControls, setShowQuantityControls] = useState<boolean>(false);

  useEffect(() => {
    const key = currentUser?.uid ? `aetherius:showQuantityControls:${currentUser.uid}` : 'aetherius:showQuantityControls';
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setShowQuantityControls(raw === 'true');
    } catch {
      // ignore
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    const key = currentUser?.uid ? `aetherius:showQuantityControls:${currentUser.uid}` : 'aetherius:showQuantityControls';
    try {
      localStorage.setItem(key, String(showQuantityControls));
    } catch {
      // ignore
    }
  }, [showQuantityControls, currentUser?.uid]);

  useEffect(() => {
    const key = currentUser?.uid ? `aetherius:aiModel:${currentUser.uid}` : 'aetherius:aiModel';
    try {
      localStorage.setItem(key, aiModel);
    } catch {
      // ignore
    }
  }, [aiModel, currentUser?.uid]);

  // Theme Application
  useEffect(() => {
    const theme = COLOR_THEMES.find(t => t.id === colorTheme) || COLOR_THEMES[0];
    const root = document.documentElement;
    
    // Apply theme colors to CSS variables
    root.style.setProperty('--skyrim-dark', theme.colors.background);
    root.style.setProperty('--skyrim-paper', theme.colors.paper);
    root.style.setProperty('--skyrim-border', theme.colors.border);
    root.style.setProperty('--skyrim-gold', theme.colors.gold);
    root.style.setProperty('--skyrim-gold-hover', theme.colors.gold);
    root.style.setProperty('--skyrim-text', theme.colors.text);
    root.style.setProperty('--skyrim-accent', theme.colors.primary);
  }, [colorTheme]);

  // Theme Persistence
  useEffect(() => {
    const key = currentUser?.uid ? `aetherius:theme:${currentUser.uid}` : 'aetherius:theme';
    try {
      const savedTheme = localStorage.getItem(key);
      if (savedTheme && COLOR_THEMES.find(t => t.id === savedTheme)) {
        setColorTheme(savedTheme);
      }
    } catch {
      // ignore
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    const key = currentUser?.uid ? `aetherius:theme:${currentUser.uid}` : 'aetherius:theme';
    try {
      localStorage.setItem(key, colorTheme);
    } catch {
      // ignore
    }
  }, [colorTheme, currentUser?.uid]);

  // Expose database utilities and app context for console access (for admin/debug purposes)
  // Note: We update this on every render to ensure window.app always has the latest references
  useEffect(() => {
    if (currentUser?.uid) {
      (window as any).aetheriusUtils = {
        userId: currentUser.uid,
        characterId: currentCharacterId,
        removeDuplicateItems: () => removeDuplicateItems(currentUser.uid, currentCharacterId || undefined),
        reloadItems: async () => {
          const userItems = await loadInventoryItems(currentUser.uid, currentCharacterId || undefined);
          setItems(userItems);
          return userItems;
        }
      };

      (window as any).app = Object.assign((window as any).app || {}, {
        currentUser,
        currentCharacterId,
        characters,
        items,
        setCharacters,
        addCompanion,
        updateCompanion,
        removeCompanion,
        companions,
        handleGameUpdate: (payload) => { try { handleGameUpdate(payload); return { ok: true }; } catch (e) { return { ok: false, error: String(e) }; } },
        saveLoadoutCloud: async (loadout: any) => {
          try {
            const uid = (window as any).aetheriusUtils?.userId;
            if (!uid) return { ok: false, message: 'not logged in' };
            await saveUserLoadout(uid, loadout);
            return { ok: true };
          } catch (e) { return { ok: false, error: String(e) }; }
        },
        loadLoadoutsCloud: async (characterId?: string) => {
          try {
            const uid = (window as any).aetheriusUtils?.userId;
            if (!uid) return [];
            const lists = await loadUserLoadouts(uid, characterId);
            return lists || [];
          } catch (e) { console.warn('Failed to load cloud loadouts', e); return []; }
        }
      });

      console.log('🔧 Database utils available via window.aetheriusUtils');
      console.log('  - removeDuplicateItems() - removes items with duplicate names');
      console.log('  - reloadItems() - reloads inventory from database');
      console.log('🎮 Demo commands available via window.demo (see CONSOLE_COMMANDS.md)');
    }
  }, [currentUser?.uid, currentCharacterId, characters, items, companions]);

  // Firebase Authentication Listener + Firestore Data Loading
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);
      // Update feature flags with current user for admin checks
      setFeatureFlagUser(user?.uid || null);
      
      if (user) {
        try {
          // Initialize Firestore (must happen before any queries)
          console.log('Initializing Firestore for user:', user.uid);
          await initializeFirestoreDb();

          // Set user online status in Realtime DB
          await setUserOnline(user.uid);

          // Load all data from Firestore in parallel
          console.log('Loading user data from Firestore...');
          // Prefer loading inventory for the last selected character (if available)
          let preferredCharacterId: string | undefined;
          try { preferredCharacterId = localStorage.getItem(`aetherius:lastCharacter:${user.uid}`) || undefined; } catch { preferredCharacterId = undefined; }

          const [userProfiles, userCharacters, userItems, userQuests, userEntries, userChapters, settings] = await Promise.all([
            loadUserProfiles(user.uid),
            loadCharacters(user.uid),
            loadInventoryItems(user.uid, preferredCharacterId),
            loadQuests(user.uid),
            loadJournalEntries(user.uid),
            loadStoryChapters(user.uid),
            loadUserSettings(user.uid)
          ]);

          console.log('Data loaded successfully:', { userProfiles, userCharacters, userItems });
          // Ensure there is always at least one profile so we can go straight to character selection.
          // Profiles remain as an internal grouping, but we no longer show a profile selection screen.
          let nextProfiles = userProfiles || [];
          if (nextProfiles.length === 0) {
            const derivedName = (user.email || '').split('@')[0]?.trim() || 'Player';
            const defaultProfile: UserProfile = { id: uniqueId(), username: derivedName, created: Date.now() };
            nextProfiles = [defaultProfile];
            try {
              await saveUserProfile(user.uid, defaultProfile);
            } catch (e) {
              console.warn('Failed to auto-create default profile (non-critical):', e);
              setDirtyEntities(prev => new Set([...prev, defaultProfile.id]));
            }
          }
          setProfiles(nextProfiles);
          setCurrentProfileId(nextProfiles[0]?.id ?? null);

          // Decide whether to show onboarding for this user.
          try {
            const key = `aetherius:onboardingCompleted:${user.uid}`;
            const localDone = localStorage.getItem(key) === '1';
            const remoteDone = settings?.onboardingCompleted === true;
            const isNewAccount = (userProfiles?.length || 0) === 0 && (userCharacters?.length || 0) === 0;
            setUserSettings(settings);
            setOnboardingOpen(isFeatureEnabled('onboarding') && isNewAccount && !localDone && !remoteDone);
          } catch {
            const remoteDone = settings?.onboardingCompleted === true;
            const isNewAccount = (userProfiles?.length || 0) === 0 && (userCharacters?.length || 0) === 0;
            setUserSettings(settings);
            setOnboardingOpen(isFeatureEnabled('onboarding') && isNewAccount && !remoteDone);
          }

          // Normalize older saves to include new survival/time fields AND fix legacy XP/level mismatch
          const normalizedCharacters = (userCharacters || []).map((c: any) => {
            const time = c?.time && typeof c.time === 'object' ? c.time : INITIAL_CHARACTER_TEMPLATE.time;
            const needs = c?.needs && typeof c.needs === 'object' ? c.needs : INITIAL_CHARACTER_TEMPLATE.needs;
            
            // --- XP/Level normalization for legacy characters ---
            // Old system: level was manually set by player (not tied to XP)
            // New system: level is derived from total XP
            // Fix: If character's XP is lower than what's required to BE their current level,
            //      normalize XP up to match the level (preserving the player's progression)
            const currentLevel = Math.max(1, c?.level || 1);
            const currentXP = c?.experience || 0;
            const xpRequiredForCurrentLevel = getTotalXPForLevel(currentLevel);
            let normalizedXP = currentXP;
            let xpWasNormalized = false;
            
            if (currentXP < xpRequiredForCurrentLevel) {
              // Legacy character: XP doesn't match level. Normalize XP to match level baseline.
              normalizedXP = xpRequiredForCurrentLevel;
              xpWasNormalized = true;
              console.log(`[XP Normalization] Character "${c.name}" (level ${currentLevel}) had ${currentXP} XP but needs ${xpRequiredForCurrentLevel} XP to be level ${currentLevel}. Normalized XP to ${normalizedXP}.`);
            }
            
            // Ensure character has all default skills (adds missing skills introduced in new releases)
            const defaultSkills = (SKYRIM_SKILLS || []).map(s => s.name);
            const mergedSkills = Array.isArray(c.skills) ? [ ...c.skills ] : [];
            for (const sk of defaultSkills) {
              if (!mergedSkills.some(ms => ms.name === sk)) {
                // Default level for missing skills is taken from SKYRIM_SKILLS
                const def = SKYRIM_SKILLS.find(s => s.name === sk);
                mergedSkills.push({ name: sk, level: def?.level ?? 15 });
              }
            }

            const next: Character = {
              ...c,
              experience: normalizedXP,
              skills: mergedSkills,
              time: {
                day: Math.max(1, Number(time?.day || 1)),
                hour: clamp(Number(time?.hour || 0), 0, 23),
                minute: clamp(Number(time?.minute || 0), 0, 59),
              },
              needs: {
                hunger: clamp(Number(needs?.hunger ?? 0), 0, 100),
                thirst: clamp(Number(needs?.thirst ?? 0), 0, 100),
                fatigue: clamp(Number(needs?.fatigue ?? 0), 0, 100),
              },
            };

            // Ensure learned spells are synchronized between server and localStorage so
            // learned spells survive dev-server restarts and cross-device logins.
            try {
              const merged = mergeLearnedSpellsFromCharacter(next);
              if (merged.length > 0) {
                // Attach to the in-memory character so UI/readers can access learned spells
                (next as any).learnedSpells = merged;
                // If the server-side document didn't include learnedSpells, mark for save so
                // the server is updated with the union of local+server learned spells.
                if (!Array.isArray(c.learnedSpells) || c.learnedSpells.length !== merged.length || merged.some(s => !(c.learnedSpells || []).includes(s))) {
                  setDirtyEntities(prev => new Set([...prev, next.id]));
                }
              }
            } catch (e) {
              console.warn('Failed to merge learned spells for character', next.id, e);
            }

            if (!c?.time || !c?.needs || xpWasNormalized || mergedSkills.length !== (c.skills || []).length) {
              setDirtyEntities(prev => new Set([...prev, next.id]));
            }
            return next;
          });
          setCharacters(normalizedCharacters);
          setItems(userItems);
          setQuests(userQuests);
          setJournalEntries(userEntries);
          setStoryChapters(userChapters);

          // Load remote companions only for the preferred character (avoid setting cross-character companions globally)
          try {
            if (preferredCharacterId) {
              const remoteCompanions = await loadUserCompanions(user.uid, preferredCharacterId);
              if (Array.isArray(remoteCompanions) && remoteCompanions.length > 0) {
                setCompanions(remoteCompanions);
              }
            } else {
              // No preferred character selected yet — skip loading global companions from Firestore to avoid mixing characters
            }
          } catch (e) {
            // ignore and fall back to localStorage loaded companions
            console.warn('Could not load companions from Firestore, using local copies if available.');
          }
          
          // Restore last selected character and tab from localStorage
          // BUT only if this is a page refresh, not a fresh login
          try {
            const isFreshLogin = sessionStorage.getItem('aetherius:freshLogin') === '1';
            
            // Clear the fresh login marker after checking
            if (isFreshLogin) {
              sessionStorage.removeItem('aetherius:freshLogin');
            }
            
            // Only restore character on page refresh, not on fresh login
            if (!isFreshLogin) {
              const lastCharId = localStorage.getItem(`aetherius:lastCharacter:${user.uid}`);
              const lastTab = localStorage.getItem(`aetherius:lastTab:${user.uid}`);
              
              // Only restore if the character still exists
              if (lastCharId && normalizedCharacters.some((c: Character) => c.id === lastCharId)) {
                setCurrentCharacterId(lastCharId);
                if (lastTab && Object.values(TABS).includes(lastTab)) {
                  setActiveTab(lastTab);
                }
              }
            }
          } catch { /* ignore localStorage errors */ }
        } catch (error) {
          console.error('Error initializing or loading user data:', error);
          setAuthError('Failed to load data from Firestore. Check console for details.');
        } finally {
          setLoading(false);
        }
      } else {
        // User logged out - set offline and clear state
        if (currentUser?.uid) {
          try {
            await setUserOffline(currentUser.uid);
            await clearActiveCharacter(currentUser.uid);
          } catch (error) {
            console.warn('Error on logout:', error);
          }
        }
        
        setProfiles([]);
        setCharacters([]);
        setItems([]);
        setQuests([]);
        setJournalEntries([]);
        setStoryChapters([]);
        setCurrentProfileId(null);
        setCurrentCharacterId(null);
        setUserSettings(null);
        setOnboardingOpen(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Initialize audio service on first user interaction
  useEffect(() => {
    const initAudio = () => {
      audioService.initialize();
      // Remove listener after first interaction
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

  // Global click SFX handler (opt-in via data-sfx="<sound_key>")
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      try {
        const el = (e.target as HTMLElement);
        const sfxEl = el.closest<HTMLElement>('[data-sfx]');
        if (sfxEl) {
          const key = sfxEl.getAttribute('data-sfx') || 'button_click';
          if (key && key !== 'none') audioService.playSoundEffect(key as any);
          return;
        }

        // Fallback: play generic button click for plain buttons/anchors if no data-sfx is set
        const btn = el.closest<HTMLElement>('button, [role="button"], a');
        if (btn) {
          // Respect explicit opt-out attributes
          if (btn.getAttribute('data-sfx') === 'none' || btn.hasAttribute('data-sfx-disable')) return;
          // Don't play for disabled buttons
          if ((btn as HTMLButtonElement).disabled) return;
          audioService.playSoundEffect('button_click');
        }
      } catch (err) {
        // Never throw from global handler
        console.warn('Global SFX handler error', err);
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Start music based on game state - defined later after activeCharacter is available
  // Music initialization is handled in a separate useEffect below after activeCharacter definition

  // Music initialization based on character selection
  // Note: playMusic() will queue the track if user hasn't interacted yet
  useEffect(() => {
    const char = characters.find(c => c.id === currentCharacterId);
    if (currentCharacterId && char) {
      // Determine initial music based on character's current state
      const hour = char.time?.hour ?? 12;
      const isNight = hour >= 20 || hour < 5;
      
      // Start with exploration or night music (will queue if not ready)
      const initialTrack = isNight ? 'night' : 'exploration';
      playMusic(initialTrack, true);
      
      console.log(`🎵 Requested ${initialTrack} music for ${char.name} (hour: ${hour})`);
    } else if (!currentCharacterId) {
      // Play main menu music when no character selected (will queue if not ready)
      playMusic('main_menu', true);
      console.log('🎵 Requested main menu music');
    }
  }, [currentCharacterId, characters]);

  // Load inventory items for the currently selected character (or none if no character selected)
  // Also performs cleanup of zero-quantity items to fix corrupted data
  // IMPORTANT: skip reload while a combat is active to avoid clobbering combat-local inventory edits
  useEffect(() => {
    if (!currentUser?.uid) return;
    // Avoid overwriting user-made inventory changes during active combat
    if ((combatState as any)?.active) return;
    let cancelled = false;
    (async () => {
      try {
        const itemsForChar = await loadInventoryItems(currentUser.uid, currentCharacterId || undefined);
        if (!cancelled) {
          // Clean up any items with zero or negative quantity (data integrity fix)
          const validItems = itemsForChar.filter(item => (item.quantity || 0) > 0);
          const invalidItems = itemsForChar.filter(item => (item.quantity || 0) <= 0);
          
          if (invalidItems.length > 0) {
            console.warn(`🧹 Cleaning up ${invalidItems.length} zero-quantity ghost item(s) from inventory:`, invalidItems.map(i => `${i.name} x${i.quantity}`));
            // Delete the invalid items from Firestore in the background
            for (const item of invalidItems) {
              void deleteInventoryItem(currentUser.uid, item.id).catch(err => {
                console.warn('Failed to delete zero-quantity item:', item.name, err);
              });
            }
          }
          
          setItems(validItems);
        }
      } catch (e) {
        console.warn('Failed to load inventory items for character:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [currentUser?.uid, currentCharacterId, combatState]);

  const completeOnboarding = async () => {
    if (!currentUser?.uid) {
      setOnboardingOpen(false);
      return;
    }

    const uid = currentUser.uid as string;
    setOnboardingOpen(false);

    try {
      localStorage.setItem(`aetherius:onboardingCompleted:${uid}`, '1');
    } catch {
      // ignore
    }

    const next: UserSettings = {
      ...(userSettings || {}),
      onboardingCompleted: true,
      onboardingVersion: userSettings?.onboardingVersion ?? 1,
      createdAt: userSettings?.createdAt,
    };
    setUserSettings(next);
    try {
      await saveUserSettings(uid, next);
    } catch (e) {
      console.warn('Failed to persist onboarding completion:', e);
    }
  };

  // Update user settings (voice, audio, etc.) and persist to Firebase
  const updateUserSettings = async (updates: Partial<UserSettings>) => {
    if (!currentUser?.uid) return;
    
    const uid = currentUser.uid as string;
    const next: UserSettings = {
      ...(userSettings || {}),
      ...updates,
    };
    setUserSettings(next);
    
    try {
      await saveUserSettings(uid, next);
    } catch (e) {
      console.warn('Failed to persist user settings:', e);
    }
  };

  // Debounced Firestore saves for dirty entities
  useEffect(() => {
    if (!currentUser) return;
    
    const timer = setTimeout(async () => {
      if (dirtyEntities.size === 0) return;

      try {
        // Only save modified entities (debounced)
        for (const entityId of dirtyEntities) {
          // Try to match entityId to entity type and save accordingly
          const char = characters.find(c => c.id === entityId);
          if (char) {
            await saveCharacter(currentUser.uid, char);
            // record last cloud save for UI feedback
            try { setLastCloudSaveAt(Date.now()); setLastCloudSavedCharacterId(entityId); } catch (e) {}
            continue;
          }

          const item = items.find(i => i.id === entityId);
          if (item) {
            await saveInventoryItem(currentUser.uid, item);
            continue;
          }

          const quest = quests.find(q => q.id === entityId);
          if (quest) {
            await saveQuest(currentUser.uid, quest);
            continue;
          }

          const entry = journalEntries.find(e => e.id === entityId);
          if (entry) {
            await saveJournalEntry(currentUser.uid, entry);
            continue;
          }

          const chapter = storyChapters.find(s => s.id === entityId);
          if (chapter) {
            await saveStoryChapter(currentUser.uid, chapter);
            continue;
          }

          const profile = profiles.find(p => p.id === entityId);
          if (profile) {
            await saveUserProfile(currentUser.uid, profile);
          }
        }

        // Clear dirty state after successful save
        setDirtyEntities(new Set());
      } catch (error) {
        console.error('Debounced save error:', error);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [dirtyEntities, currentUser, characters, items, quests, journalEntries, storyChapters, profiles]);

  // Actions
  const handleUpdateCharacter = (characterId: string, newName: string) => {
      setCharacters(prev => prev.map(c => c.id === characterId ? { ...c, name: newName } : c));
      setDirtyEntities(prev => new Set([...prev, characterId]));
  };

  // Delete a single character
  const handleDeleteCharacter = async (characterId: string) => {
    if (!currentUser) return;
    
    try {
      // Delete from Firestore (this will also delete related items, quests, journal, and story)
      await deleteCharacter(currentUser.uid, characterId);
      
      // Update local state - remove character and all related data
      setCharacters(prev => prev.filter(c => c.id !== characterId));
      setItems(prev => prev.filter(i => i.characterId !== characterId));
      setQuests(prev => prev.filter(q => q.characterId !== characterId));
      setJournalEntries(prev => prev.filter(j => j.characterId !== characterId));
      setStoryChapters(prev => prev.filter(s => s.characterId !== characterId));
      
      // Ensure any companions tied to this character are removed locally and remotely
      try {
        // Remove per-character localStorage key
        try { localStorage.removeItem(`aetherius:companions:${currentUser.uid}:${characterId}`); } catch {}

        // Clean up global fallback list by removing entries for the deleted character
        try {
          const fallbackKey = `aetherius:companions:${currentUser.uid}`;
          const raw = localStorage.getItem(fallbackKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((p: any) => p.characterId !== characterId);
              localStorage.setItem(fallbackKey, JSON.stringify(filtered));
            }
          }
        } catch (e) { /* ignore */ }

        // Delete from Firestore
        try {
          await deleteUserCompanions(currentUser.uid, characterId);
        } catch (e) { /* ignore */ }
      } catch (e) { /* ignore overall cleanup errors */ }

      // Clear in-memory companions if we just deleted the currently selected character
      if (currentCharacterId === characterId) {
        setCurrentCharacterId(null);
        setCompanions([]);
      }
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };

  // Mark character as dead or resurrect (deathCause = null means resurrect)
  const handleMarkCharacterDead = async (characterId: string, deathCause: string | null) => {
    if (!currentUser) return;
    
    const isDead = deathCause !== null;
    const updates: Partial<Character> = {
      isDead,
      deathDate: isDead ? new Date().toISOString() : undefined,
      deathCause: isDead ? deathCause : undefined
    };
    
    // Update local state
    setCharacters(prev => prev.map(c => 
      c.id === characterId 
        ? { ...c, ...updates }
        : c
    ));
    setDirtyEntities(prev => new Set([...prev, characterId]));
    
    // Save to Firestore
    try {
      const char = characters.find(c => c.id === characterId);
      if (char) {
        await saveCharacter(currentUser.uid, { ...char, ...updates });
      }
    } catch (error) {
      console.error('Error updating character death status:', error);
    }
  };

  // Manual Save Handler - Forces immediate Firestore flush
  const handleManualSave = async () => {
    if (!currentUser) return;
    
    // Check if offline - queue changes instead
    if (!navigator.onLine) {
      setSaveStatus('offline');
      // Queue all dirty entities for sync when back online
      characters.forEach(char => {
        queueOfflineChange({ type: 'character', action: 'save', data: char });
      });
      setSaveMessage('⚡ Saved locally (offline)');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }
    
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      // Batch save all data to Firestore
      await batchSaveGameState(
        currentUser.uid,
        characters,
        items,
        quests,
        journalEntries,
        storyChapters,
        profiles
      );
      
      setSaveStatus('saved');
      setLastSaved(new Date());
      setSaveMessage('✓ All data saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
      setDirtyEntities(new Set());
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      setSaveMessage('✗ Error saving data');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Console command execution handler
  const handleConsoleCommand = (command: string) => {
    try {
      // Execute the command in global scope
      const result = (window as any).eval(command);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleRegister = async (email: string, password: string, username: string) => {
    setAuthError(null);
    try {
      if (!email || !password || !username) {
        setAuthError('Email, password, and username are required');
        return;
      }
      if (password.length < 6) {
        setAuthError('Password must be at least 6 characters');
        return;
      }
      const userCredential = await registerUser(email, password);

      // Create a default profile immediately so the next screen is character selection.
      try {
        await initializeFirestoreDb();
        const defaultProfile: UserProfile = { id: uniqueId(), username, created: Date.now() };
        await saveUserProfile(userCredential.user.uid, defaultProfile);
        setProfiles([defaultProfile]);
        setCurrentProfileId(defaultProfile.id);
      } catch (e) {
        console.warn('Failed to auto-create default profile on register (non-critical):', e);
      }
      
      // Save user metadata for easier tracking in database (non-blocking)
      saveUserMetadata({
        uid: userCredential.user.uid,
        email: email,
        username: username,
        createdAt: Date.now(),
        lastLogin: Date.now()
      }).catch(err => {
        console.warn('Failed to save user metadata (non-critical):', err);
      });
      setLoginEmail('');
      setLoginPassword('');
      setLoginUsername('');
      setAuthError(null);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('This email is already in use');
      } else if (error.code === 'auth/invalid-email') {
        setAuthError('Invalid email address');
      } else {
        setAuthError('Registration failed: ' + error.message);
      }
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    try {
      if (!email || !password) {
        setAuthError('Email and password are required');
        return;
      }
      // Mark this as a fresh login - don't auto-restore character
      sessionStorage.setItem('aetherius:freshLogin', '1');
      await loginUser(email, password);
      setLoginEmail('');
      setLoginPassword('');
      setAuthError(null);
    } catch (error: any) {
      // Remove fresh login marker on error
      sessionStorage.removeItem('aetherius:freshLogin');
      if (error.code === 'auth/user-not-found') {
        setAuthError('No user found');
      } else if (error.code === 'auth/wrong-password') {
        setAuthError('Incorrect password');
      } else {
        setAuthError('Login failed: ' + error.message);
      }
    }
  };

  const handleGuestLogin = async () => {
    setAuthError(null);
    try {
      // Mark this as a fresh login - don't auto-restore character
      sessionStorage.setItem('aetherius:freshLogin', '1');
      await loginAnonymously();
      setAuthError(null);
    } catch (error: any) {
      sessionStorage.removeItem('aetherius:freshLogin');
      setAuthError('Guest login failed: ' + error.message);
    }
  };

  const handleForgotPassword = async (email: string) => {
    setAuthError(null);
    setResetEmailSent(false);
    try {
      if (!email) {
        setAuthError('Please enter your email address');
        return;
      }
      const result = await sendPasswordReset(email);
      if (result.success) {
        setResetEmailSent(true);
      } else {
        setAuthError(result.error || 'Failed to send reset email');
      }
    } catch (error: any) {
      setAuthError('Failed to send reset email: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      if (currentUser) {
        await setUserOffline(currentUser.uid);
        await clearActiveCharacter(currentUser.uid);
      }
      await logoutUser();
      setCurrentProfileId(null);
      setCurrentCharacterId(null);
    } catch (error) {
      setAuthError('Logout failed');
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-skyrim-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-skyrim-gold" size={48} />
          <p className="text-skyrim-text">Loading...</p>
        </div>
      </div>
    );
  }

  // Login/Register Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-skyrim-dark flex items-center justify-center p-4">
        <div className="bg-skyrim-paper rounded-lg shadow-2xl p-8 max-w-md w-full border border-skyrim-border">
          <h1 className="text-4xl font-serif font-bold text-skyrim-gold text-center mb-8 tracking-widest">SKYRIM</h1>
          <p className="text-skyrim-text text-center mb-6">Welcome to Aetherius</p>
          
          {authError && (
            <div className="bg-red-900/30 border border-red-700 rounded p-4 mb-4 text-red-200 text-sm">
              {authError}
            </div>
          )}
          
          {authMode === 'login' ? (
            // LOGIN FORM
            <div className="space-y-4">
              <input 
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 bg-skyrim-dark/50 border border-skyrim-border rounded text-skyrim-text placeholder-gray-500 focus:outline-none focus:border-skyrim-gold"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin(loginEmail, loginPassword)}
              />
              <input 
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2 bg-skyrim-dark/50 border border-skyrim-border rounded text-skyrim-text placeholder-gray-500 focus:outline-none focus:border-skyrim-gold"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin(loginEmail, loginPassword)}
              />
              
              <button 
                onClick={() => handleLogin(loginEmail, loginPassword)}
                className="w-full bg-skyrim-gold text-skyrim-dark font-bold py-2 rounded hover:bg-yellow-400 transition-colors"
              >
                Login
              </button>

              <div className="relative flex items-center my-4">
                <div className="flex-grow border-t border-skyrim-border"></div>
                <span className="flex-shrink mx-3 text-gray-500 text-sm">or</span>
                <div className="flex-grow border-t border-skyrim-border"></div>
              </div>

              <button 
                onClick={handleGuestLogin}
                className="w-full bg-gray-700 text-gray-200 font-bold py-2 rounded hover:bg-gray-600 transition-colors border border-skyrim-border"
              >
                🎮 Continue as Guest
              </button>
              <p className="text-gray-500 text-xs text-center">
                Guest data is saved but may be lost if you clear browser data
              </p>
              
              <div className="text-center space-y-2">
                <button
                  onClick={() => { setAuthMode('forgot'); setAuthError(null); setResetEmailSent(false); }}
                  className="text-gray-400 hover:text-skyrim-gold text-sm transition-colors"
                >
                  Forgot your password?
                </button>
                <div>
                  <button
                    onClick={() => { setAuthMode('register'); setAuthError(null); }}
                    className="text-skyrim-gold hover:text-yellow-400 text-sm transition-colors"
                  >
                    Don't have an account? <span className="underline">Register here</span>
                  </button>
                </div>
              </div>
            </div>
          ) : authMode === 'register' ? (
            // REGISTER FORM
            <div className="space-y-4">
              <input 
                type="text"
                placeholder="Name / Nickname"
                className="w-full px-4 py-2 bg-skyrim-dark/50 border border-skyrim-border rounded text-skyrim-text placeholder-gray-500 focus:outline-none focus:border-skyrim-gold"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
              />
              <input 
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 bg-skyrim-dark/50 border border-skyrim-border rounded text-skyrim-text placeholder-gray-500 focus:outline-none focus:border-skyrim-gold"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <input 
                type="password"
                placeholder="Password (min 6 characters)"
                className="w-full px-4 py-2 bg-skyrim-dark/50 border border-skyrim-border rounded text-skyrim-text placeholder-gray-500 focus:outline-none focus:border-skyrim-gold"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              
              <button 
                onClick={() => handleRegister(loginEmail, loginPassword, loginUsername)}
                className="w-full bg-skyrim-gold text-skyrim-dark font-bold py-2 rounded hover:bg-yellow-400 transition-colors"
              >
                Register
              </button>
              
              <div className="text-center">
                <button
                  onClick={() => { setAuthMode('login'); setAuthError(null); }}
                  className="text-skyrim-gold hover:text-yellow-400 text-sm transition-colors"
                >
                  Already have an account? <span className="underline">Login here</span>
                </button>
              </div>
            </div>
          ) : (
            // FORGOT PASSWORD FORM
            <div className="space-y-4">
              {resetEmailSent ? (
                <div className="text-center space-y-4">
                  <div className="bg-green-900/30 border border-green-700 rounded p-4 text-green-200 text-sm">
                    <p className="font-bold mb-2">✓ Reset Email Sent!</p>
                    <p>Check your inbox for a password reset link. If you don't see it, check your spam folder.</p>
                  </div>
                  <button
                    onClick={() => { setAuthMode('login'); setResetEmailSent(false); setAuthError(null); }}
                    className="text-skyrim-gold hover:text-yellow-400 text-sm transition-colors"
                  >
                    ← Back to Login
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-gray-400 text-sm text-center mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <input 
                    type="email"
                    placeholder="Email"
                    className="w-full px-4 py-2 bg-skyrim-dark/50 border border-skyrim-border rounded text-skyrim-text placeholder-gray-500 focus:outline-none focus:border-skyrim-gold"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword(loginEmail)}
                  />
                  
                  <button 
                    onClick={() => handleForgotPassword(loginEmail)}
                    className="w-full bg-skyrim-gold text-skyrim-dark font-bold py-2 rounded hover:bg-yellow-400 transition-colors"
                  >
                    Send Reset Link
                  </button>
                  
                  <div className="text-center">
                    <button
                      onClick={() => { setAuthMode('login'); setAuthError(null); }}
                      className="text-skyrim-gold hover:text-yellow-400 text-sm transition-colors"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleCreateCharacter = (profileId: string, name: string, archetype: string, race: string, gender: string, fullDetails?: GeneratedCharacterData) => {
      const charId = uniqueId();
      
      // 1. Base Character
      const newChar: Character = {
          id: charId,
          profileId,
          name,
          race: race || 'Nord',
          gender: gender || 'Male',
          archetype: archetype || 'Warrior',
          ...INITIAL_CHARACTER_TEMPLATE,
          ...fullDetails,
          gold: fullDetails?.startingGold || 0,
          lastPlayed: Date.now()
      };
      setCharacters([...characters, newChar]);
      setDirtyEntities(prev => new Set([...prev, charId]));

      // Ensure newly created character starts with no companions (explicitly initialize per-character companions)
      try {
        setCompanions([]);
        // Initialize an empty per-character localStorage key so fallback won't leak global companions
        if (currentUser?.uid) {
          try { localStorage.setItem(`aetherius:companions:${currentUser.uid}:${charId}`, JSON.stringify([])); } catch {}
          try { saveUserCompanions(currentUser.uid, [], charId); } catch (e) { /* ignore remote failures */ }
        }
      } catch (e) { /* ignore */ }

        // 2. Inventory - validate incoming items against defined set and apply stats
        if (fullDetails?.inventory) {
          const validatedMap = new Map<string, InventoryItem>();
          for (const i of fullDetails.inventory) {
            const name = (i.name || '').trim();
            const type = (i.type as InventoryItem['type']) || 'misc';

            // Allow free-form misc items
            if (type === 'misc') {
              const key = `${name.toLowerCase()}|misc`;
              const existing = validatedMap.get(key);
              if (existing) {
                existing.quantity += i.quantity || 1;
              } else {
                validatedMap.set(key, {
                  id: uniqueId(),
                  characterId: charId,
                  name,
                  type,
                  description: i.description || '',
                  quantity: i.quantity || 1,
                  equipped: !!(i as any).equipped,
                  createdAt: Date.now()
                } as InventoryItem);
              }
              continue;
            }

            // For core items (weapons / apparel) ensure they exist in defined sets
            if (shouldHaveStats(type) && !isValidCoreItem(name, type)) {
              // Skip invalid core items (keep console log for debugging)
              console.warn('Skipping invalid starting item for character:', name, type);
              continue;
            }

            // Merge duplicates by name+type
            const key = `${name.toLowerCase()}|${type}`;
            const stats = shouldHaveStats(type) ? getItemStats(name, type) : {};
            const existing = validatedMap.get(key);
            if (existing) {
              existing.quantity += i.quantity || 1;
            } else {
              // Determine default slot where applicable
              const itemLike: InventoryItem = {
                id: uniqueId(),
                characterId: charId,
                name,
                type: type as any,
                description: i.description || '',
                quantity: i.quantity || 1,
                equipped: !!(i as any).equipped,
                createdAt: Date.now(),
                ...stats
              } as InventoryItem;

              // Attempt to assign a default equipment slot for weapons/apparel
              try {
                const slot = getDefaultSlotForItem(itemLike);
                if (slot) itemLike.slot = slot;
              } catch (e) {
                // ignore slot assignment errors
              }

              validatedMap.set(key, itemLike);
            }
          }

          const itemsToAdd = Array.from(validatedMap.values());
          if (itemsToAdd.length > 0) {
            setItems(prev => [...prev, ...itemsToAdd as any]);
            itemsToAdd.forEach(item => setDirtyEntities(prev => new Set([...prev, item.id])));
          }
        }

      // 3. Quests
      if (fullDetails?.quests) {
          const newQuests: CustomQuest[] = fullDetails.quests.map(q => ({
              id: uniqueId(),
              characterId: charId,
              title: q.title,
              description: q.description,
              location: q.location,
              dueDate: q.dueDate,
              objectives: [],
              status: 'active',
              createdAt: Date.now()
          }));
          setQuests(prev => [...prev, ...newQuests]);
          newQuests.forEach(quest => {
            setDirtyEntities(prev => new Set([...prev, quest.id]));
          });
      }

      // 4. Journal
      if (fullDetails?.journalEntries) {
          const newEntries = fullDetails.journalEntries.map(e => ({
              id: uniqueId(),
              characterId: charId,
              date: "4E 201",
              title: e.title,
              content: e.content
          }));
          setJournalEntries(prev => [...prev, ...newEntries as any]);
          newEntries.forEach(entry => {
            setDirtyEntities(prev => new Set([...prev, entry.id]));
          });
      }

      // 5. Story
      if (fullDetails?.openingStory) {
          const chapter: StoryChapter = {
              id: uniqueId(),
              characterId: charId,
              title: fullDetails.openingStory.title,
              content: fullDetails.openingStory.content,
              date: "4E 201",
              summary: "The beginning.",
              createdAt: Date.now()
          };
          setStoryChapters(prev => [...prev, chapter]);
          setDirtyEntities(prev => new Set([...prev, chapter.id]));
      }
  };

  const updateCharacter = (field: keyof Character, value: any) => {
      // If someone directly sets `level`, treat it as a level-up when increasing the level
      if (field === 'level') {
        setCharacters(prev => prev.map(c => {
          if (c.id !== currentCharacterId) return c;
          const oldLevel = c.level || 0;
          const newLevel = Number(value) || 0;
          if (newLevel > oldLevel) {
            // Default choice on manual level bump: increase health and restore all vitals
            return applyLevelUpToCharacter(c, newLevel, c.experience || 0, 'health');
          }
          return { ...c, level: newLevel };
        }));
      } else {
        setCharacters(prev => prev.map(c => c.id === currentCharacterId ? { ...c, [field]: value } : c));
      }

      // If we're updating learnedSpells, ensure the local storage copy is kept in sync so
      // learned spells survive reloads even before a cloud save occurs.
      try {
        if (field === 'learnedSpells' && currentCharacterId && Array.isArray(value)) {
          const existing = getLearnedSpellIds(currentCharacterId);
          const union = Array.from(new Set([...(existing || []), ...value]));
          // Persist to local storage (silent on failure)
          try { storage.setItem(`aetherius:spells:${currentCharacterId}`, JSON.stringify(union)); } catch (e) { /* ignore */ }
        }
      } catch (e) {
        // ignore storage sync failures
      }

      if (currentCharacterId) {
        setDirtyEntities(prev => new Set([...prev, currentCharacterId]));
      }
  };

  const updateStoryChapter = (updatedChapter: StoryChapter) => {
      setStoryChapters(prev => prev.map(c => c.id === updatedChapter.id ? updatedChapter : c));
      setDirtyEntities(prev => new Set([...prev, updatedChapter.id]));
  };

  // Delete a story chapter from Firestore
  const handleDeleteStoryChapter = async (chapterId: string) => {
    if (!currentUser?.uid) return;
    try {
      await deleteStoryChapter(currentUser.uid, chapterId);
      setStoryChapters(prev => prev.filter(c => c.id !== chapterId));
      console.log(`Story chapter ${chapterId} deleted from Firestore`);
    } catch (error) {
      console.error('Failed to delete story chapter:', error);
    }
  };

  // Delete a journal entry from Firestore
  const handleDeleteJournalEntry = async (entryId: string) => {
    if (!currentUser?.uid) return;
    try {
      await deleteJournalEntry(currentUser.uid, entryId);
      // Local state is already updated by Journal component
      console.log(`Journal entry ${entryId} deleted from Firestore`);
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
    }
  };

  // === SURVIVAL & SHOP HANDLERS ===

  // Check for camping gear in inventory
  const hasCampingGear = items.some(i => 
    i.characterId === currentCharacterId && 
    (i.quantity || 0) > 0 &&
    ((i.name || '').toLowerCase().includes('camping kit') || (i.name || '').toLowerCase().includes('tent'))
  );
  
  const hasBedroll = items.some(i => 
    i.characterId === currentCharacterId && 
    (i.quantity || 0) > 0 &&
    (i.name || '').toLowerCase().includes('bedroll')
  );

  // Rest with options (outside/camp/inn, variable hours)
  const handleRestWithOptions = (options: { type: 'outside' | 'camp' | 'inn'; hours: number; innCost?: number }) => {
    if (!currentCharacterId || !activeCharacter) return;

    // close any open bonfire UI once rest is confirmed
    setRestOpen(false);
    setRestPreviewOptions(null);
    // Mark that we just rested to prevent immediate re-triggering of forced rest
    // Update both the ref (for immediate checks) and state (for re-renders)
    const now = Date.now();
    lastRestTimestampRef.current = now;
    setLastRestTimestamp(now);

    // Calculate fatigue reduction based on rest type
    let fatigueReduction = 15; // outside (poor rest)
    if (options.type === 'camp') {
      if (hasCampingGear) fatigueReduction = 40;
      else if (hasBedroll) fatigueReduction = 30;
      else fatigueReduction = 15;
    } else if (options.type === 'inn') {
      fatigueReduction = 50;
    }
    
    // Scale by hours (base is 8 hours)
    const scaledReduction = Math.round(fatigueReduction * (options.hours / 8));

    // Deduct gold for inn
    const goldChange = options.type === 'inn' && options.innCost ? -options.innCost : 0;

    // Determine vitals recovery percent based on rest quality and duration
    // inn = full (100%), camp = ~75%, outside = ~35% base; scale linearly with hours/8
    const baseRecover = options.type === 'inn' ? 1.0 : options.type === 'camp' ? 0.75 : 0.35;
    // Reduce effectiveness if resting while in active combat state
    const inCombatPenalty = combatState ? 0.5 : 1.0;
    const recoverPercent = Math.max(0, Math.min(1, baseRecover * (options.hours / 8) * inCombatPenalty));

    // Compute amounts to restore based on max stats and current vitals
    const max = activeCharacter.stats;
    const currentVitals = activeCharacter.currentVitals || {
      currentHealth: activeCharacter.stats.health,
      currentMagicka: activeCharacter.stats.magicka,
      currentStamina: activeCharacter.stats.stamina
    };

    const healthRestore = Math.floor((max.health - (currentVitals.currentHealth || max.health)) * recoverPercent);
    const magickaRestore = Math.floor((max.magicka - (currentVitals.currentMagicka || max.magicka)) * recoverPercent);
    const staminaRestore = Math.floor((max.stamina - (currentVitals.currentStamina || max.stamina)) * recoverPercent);

    const vitalsChange: any = {};
    if (healthRestore > 0) vitalsChange.currentHealth = healthRestore;
    if (magickaRestore > 0) vitalsChange.currentMagicka = magickaRestore;
    if (staminaRestore > 0) vitalsChange.currentStamina = staminaRestore;

    // Narrative to record in journal/logs
    const parts: string[] = [];
    if (healthRestore > 0) parts.push(`${healthRestore} health`);
    if (magickaRestore > 0) parts.push(`${magickaRestore} magicka`);
    if (staminaRestore > 0) parts.push(`${staminaRestore} stamina`);
    const recoveredText = parts.length ? `Recovered ${parts.join(', ')}.` : 'No vitals recovered.';
    const combatNote = combatState ? ' Rest was fitful due to nearby dangers.' : '';

    handleGameUpdate({
      timeAdvanceMinutes: options.hours * 60,
      needsChange: { fatigue: -scaledReduction },
      goldChange,
      vitalsChange,
      narrative: { title: `Rested for ${options.hours}h`, content: `${recoveredText}${combatNote}` }
    });
  };

  // Eat a specific item - uses dynamic nutrition values
  const handleEatItem = (item: InventoryItem) => {
    if (!currentCharacterId || !activeCharacter) return;
    
    // Play eating sound
    audioService.playSoundEffect('eat');
    
    const nutrition = getFoodNutrition(item.name);
    // Attempt to parse vitals-like effects from the item (some foods may heal)
    const parsed = parseConsumableVitals(item);
    const vitalsChange: any = {};
    for (const p of parsed) {
      if (p.stat === 'health') vitalsChange.currentHealth = (vitalsChange.currentHealth || 0) + p.amount;
      if (p.stat === 'magicka') vitalsChange.currentMagicka = (vitalsChange.currentMagicka || 0) + p.amount;
      if (p.stat === 'stamina') vitalsChange.currentStamina = (vitalsChange.currentStamina || 0) + p.amount;
    }

    // If no explicit vitals were parsed, derive a default heal from the nutrition
    if (parsed.length === 0) {
      const healAmount = Math.max(0, Math.floor(nutrition.hungerReduction / 2) + 10);
      if (healAmount > 0) {
        parsed.push({ stat: 'health', amount: healAmount });
        vitalsChange.currentHealth = (vitalsChange.currentHealth || 0) + healAmount;
      }
    }

    handleGameUpdate({
      transactionId: `eat_${uniqueId()}`,
      timeAdvanceMinutes: 10,
      needsChange: { 
        hunger: -nutrition.hungerReduction, 
        thirst: -nutrition.thirstReduction,
        ...(nutrition.fatigueReduction ? { fatigue: -nutrition.fatigueReduction } : {})
      },
      ...(Object.keys(vitalsChange).length ? { vitalsChange } : {}),
      removedItems: [{ name: item.name, quantity: 1 }]
    });
    // Show toast(s) after vitals are applied to avoid race conditions
    if (parsed.length) {
      setTimeout(() => {
        // If multiple vitals recovered, show a combined toast message
        if (parsed.length === 1) {
          const p = parsed[0];
          const color = getStatColor(p.stat);
          showToast(`Restored ${p.amount} ${p.stat}!`, 'success', { color, stat: p.stat, amount: p.amount });
        } else {
          const parts = parsed.map(p => `+${p.amount} ${p.stat}`).join(', ');
          showToast(`Recovered ${parts}`, 'success', { color: getStatColor('food'), stat: 'food' });
        }
      }, 60);
    } else {
      // Generic food toast (distinct color)
      showToast(`Ate ${item.name}`, 'info', { color: getStatColor('food'), stat: 'food' });
    }
  };

  // Drink a specific item - uses dynamic nutrition values
  const handleDrinkItem = (item: InventoryItem) => {
    if (!currentCharacterId || !activeCharacter) return;
    
    // Play drinking sound
    audioService.playSoundEffect('drink');
    
    const nutrition = getDrinkNutrition(item.name);
    // Try to parse potential vitals from drink (some special drinks affect vitals)
    const parsed = parseConsumableVitals(item);
    const vitalsChange: any = {};
    for (const p of parsed) {
      if (p.stat === 'health') vitalsChange.currentHealth = (vitalsChange.currentHealth || 0) + p.amount;
      if (p.stat === 'magicka') vitalsChange.currentMagicka = (vitalsChange.currentMagicka || 0) + p.amount;
      if (p.stat === 'stamina') vitalsChange.currentStamina = (vitalsChange.currentStamina || 0) + p.amount;
    }

    handleGameUpdate({
      transactionId: `drink_${uniqueId()}`,
      timeAdvanceMinutes: 5,
      needsChange: { 
        thirst: -nutrition.thirstReduction,
        hunger: -nutrition.hungerReduction,
        ...(nutrition.fatigueReduction ? { fatigue: -nutrition.fatigueReduction } : {})
      },
      ...(Object.keys(vitalsChange).length ? { vitalsChange } : {}),
      removedItems: [{ name: item.name, quantity: 1 }]
    });

    if (parsed.length) {
      setTimeout(() => {
        if (parsed.length === 1) {
          const p = parsed[0];
          const color = getStatColor(p.stat);
          showToast(`Restored ${p.amount} ${p.stat}!`, 'success', { color, stat: p.stat, amount: p.amount });
        } else {
          const parts = parsed.map(p => `+${p.amount} ${p.stat}`).join(', ');
          showToast(`Recovered ${parts}`, 'success', { color: getStatColor('food'), stat: 'food' });
        }
      }, 60);
    } else {
      showToast(`Drank ${item.name}`, 'info');
    }
  };

  // Use a consumable item (potion, food, drink) - restores vitals and shows toast
  const handleUseItem = (item: InventoryItem) => {
    if (!currentCharacterId || !activeCharacter) return;

    if (item.type === 'potion') {
      // Play potion drinking sound
      audioService.playSoundEffect('drink_potion');
      
      const resolved = resolvePotionEffect(item);

      // If resolver produced a stat-based effect, apply vitals change
      if (resolved.stat) {
        const amount = resolved.amount ?? item.damage ?? 0;
        if (!amount || amount <= 0) {
          showToast(`The ${item.name} seems to be empty.`, 'warning');
        } else {
          const { newVitals, actual } = applyStatToVitals(activeCharacter.currentVitals, activeCharacter.stats, resolved.stat, amount);
          if (actual > 0) {
            const vitalsChange: any = {};
            if (resolved.stat === 'health') vitalsChange.currentHealth = newVitals.currentHealth - (activeCharacter.currentVitals?.currentHealth ?? activeCharacter.stats.health);
            if (resolved.stat === 'magicka') vitalsChange.currentMagicka = newVitals.currentMagicka - (activeCharacter.currentVitals?.currentMagicka ?? activeCharacter.stats.magicka);
            if (resolved.stat === 'stamina') vitalsChange.currentStamina = newVitals.currentStamina - (activeCharacter.currentVitals?.currentStamina ?? activeCharacter.stats.stamina);

            handleGameUpdate({
              transactionId: `potion_${uniqueId()}`,
              vitalsChange,
              removedItems: [{ name: item.name, quantity: 1 }]
            });
            // show toast after vitals have been applied to avoid race conditions
            setTimeout(() => {
              const color = getStatColor(resolved.stat);
              showToast(`Restored ${actual} ${resolved.stat}!`, 'success', { color, stat: resolved.stat, amount: actual });
            }, 60);
          } else {
            showToast(`No effect from ${item.name}.`, 'warning');
          }
        }

      // Non-stat potions: handle known special effects by keyword
      } else {
        const name = (item.name || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();

        // Cure disease / poison
        if (name.includes('cure') && (name.includes('disease') || desc.includes('disease'))) {
          handleGameUpdate({ 
            transactionId: `potion_cure_disease_${uniqueId()}`,
            removedItems: [{ name: item.name, quantity: 1 }]
          });
          showToast(`Cured diseases.`, 'success');
        } else if (name.includes('cure') && (name.includes('poison') || desc.includes('poison'))) {
          handleGameUpdate({
            transactionId: `potion_cure_poison_${uniqueId()}`,
            removedItems: [{ name: item.name, quantity: 1 }]
          });
          showToast(`Cured poison.`, 'success');

        // Invisibility
        } else if (name.includes('invis') || name.includes('invisibility') || desc.includes('invisible')) {
          const durationMatch = desc.match(/(\d+)\s*(seconds|second|s)/);
          const duration = durationMatch ? Number(durationMatch[1]) : 30;
          const effect = {
            id: `potion_invis_${Date.now()}`,
            name: 'Invisibility',
            type: 'buff' as const,
            icon: '👁️‍🗨️',
            duration,
            description: `Invisible for ${duration} seconds.`,
            effects: [] as any[],
          };
          setStatusEffects(prev => [...prev, effect as any]);
          handleGameUpdate({ 
            transactionId: `potion_invis_${uniqueId()}`,
            removedItems: [{ name: item.name, quantity: 1 }] 
          });
          showToast(`You are invisible for ${duration} seconds.`, 'success');

        // Resistances (e.g., Resist Fire 50% for 60 seconds)
        } else if (name.includes('resist') || desc.includes('resist')) {
          const pctMatch = desc.match(/(\d+)%/);
          const secondsMatch = desc.match(/(\d+)\s*(seconds|second|s)/);
          const pct = pctMatch ? Number(pctMatch[1]) : undefined;
          const seconds = secondsMatch ? Number(secondsMatch[1]) : 60;
          const which = desc.includes('fire') ? 'fire' : desc.includes('frost') ? 'frost' : desc.includes('shock') ? 'shock' : 'unknown';
          const effect = {
            id: `potion_resist_${which}_${Date.now()}`,
            name: `Resist ${which}`,
            type: 'buff' as const,
            icon: '🛡️',
            duration: seconds,
            description: pct ? `Resist ${pct}% ${which} for ${seconds}s` : `Resist ${which} for ${seconds}s`,
            effects: pct ? [{ stat: which, modifier: pct }] as any[] : [] as any[],
          };
          setStatusEffects(prev => [...prev, effect as any]);
          handleGameUpdate({
            transactionId: `potion_resist_${uniqueId()}`,
            removedItems: [{ name: item.name, quantity: 1 }]
          });
          showToast(effect.description, 'success');

        } else {
          console.error('[app] Potion stat unresolved for', item.name, 'reason=', resolved.reason);
          showToast(`The effect of ${item.name} is unclear and it has no effect.`, 'warning');
        }
      }

    } else if (item.type === 'food') {
      handleEatItem(item);
    } else if (item.type === 'drink') {
      handleDrinkItem(item);
    } else if (item.type === 'ingredient') {
      // Ingredients might be used for crafting, but for now just consume
      handleGameUpdate({
        transactionId: `ingredient_${uniqueId()}`,
        removedItems: [{ name: item.name, quantity: 1 }]
      });
      showToast(`Used ${item.name}`, 'info');
    }
    // Spell Tome / Book learning support (generic)
    try {
      const name = (item.name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      if (name.includes('spell tome') || name.includes('tome') || desc.includes('teaches')) {
        // Try to parse spell id from description: 'teaches: flames' or 'teaches Flames'
        const m = (item.description || '').match(/teaches[:\s]+([a-zA-Z0-9_\- ]+)/i);
        let spellId = m ? m[1].trim().toLowerCase().replace(/\s+/g, '_') : 'flames';
        const spell = getSpellById(spellId) || getSpellById('flames');
        if (spell) {
          const learned = learnSpell(currentCharacterId!, spell.id);
          if (learned) {
            // Update in-memory character and schedule a cloud save so learned spells
            // survive dev-server restarts and cross-device logins.
            if (currentCharacterId && activeCharacter) {
              const existing = Array.isArray(activeCharacter.learnedSpells) ? activeCharacter.learnedSpells : [];
              if (!existing.includes(spell.id)) {
                updateCharacter('learnedSpells', [...existing, spell.id]);
              }
            }

            handleGameUpdate({ removedItems: [{ name: item.name, quantity: 1 }] });
            showToast(`Learned spell: ${spell.name}`, 'success');
          } else {
            showToast(`You already know ${spell.name}.`, 'info');
          }
        }
      }
    } catch (e) {}
  };

  // Shop purchase handler
  const handleShopPurchase = (shopItem: ShopItem, quantity: number) => {
    if (!currentCharacterId || !activeCharacter) return;
    const totalCost = shopItem.price * quantity;
    if ((activeCharacter.gold || 0) < totalCost) {
      showToast('Not enough gold!', 'error');
      return;
    }
    
    // Get stats for weapons and armor
    const stats = shouldHaveStats(shopItem.type) ? getItemStats(shopItem.name, shopItem.type) : {};
    // Determine equipment slot for items like jewelry
    const slot = getDefaultSlotForItem({ name: shopItem.name, type: shopItem.type } as any) || undefined;

    // For weapons and apparel, create separate items per quantity (non-stackable by default)
    if (shopItem.type === 'weapon' || shopItem.type === 'apparel') {
      const itemsToCreate: any[] = [];
      for (let i = 0; i < quantity; i++) {
        itemsToCreate.push({
          name: shopItem.name,
          type: shopItem.type,
          description: shopItem.description,
          quantity: 1,
          ...( { value: shopItem.price, slot } as any),
          ...stats,
          ...(stats.damage ? { baseDamage: stats.damage } : {}),
          ...(stats.armor ? { baseArmor: stats.armor } : {}),
          ...( (shopItem as any).rarity ? { rarity: (shopItem as any).rarity } : {} ),
          __forceCreate: true,
          createdAt: Date.now()
        });
      }
      handleGameUpdate({ goldChange: -totalCost, newItems: itemsToCreate as any });
      return;
    }

    // Default: keep stacked behavior for non-equipment items
    handleGameUpdate({
      goldChange: -totalCost,
      newItems: [{
        name: shopItem.name,
        type: shopItem.type,
        description: shopItem.description,
        quantity,
        ...( { value: shopItem.price, slot } as any ),
        ...stats,
        ...( (shopItem as any).rarity ? { rarity: (shopItem as any).rarity } : {} ),
      } as any]
    });
  };

  // Shop sell handler
  const handleShopSell = (item: InventoryItem, quantity: number, totalGold: number) => {
    if (!currentCharacterId || !activeCharacter) return;
    const currentQty = item.quantity || 0;
    if (currentQty < quantity) return;

    // Reduce item quantity or remove it
    const newQty = currentQty - quantity;
    if (newQty <= 0) {
      // Remove item entirely
      setItems(prev => prev.filter(i => i.id !== item.id));
      if (currentUser) {
        void deleteInventoryItem(currentUser.uid, item.id).catch(err => {
          console.error('Failed to delete sold item:', err);
        });
      }
    } else {
      // Update quantity
      const updatedItem = { ...item, quantity: newQty };
      setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
      if (currentUser) {
        void saveInventoryItem(currentUser.uid, updatedItem).catch(err => {
          console.error('Failed to update sold item:', err);
        });
      }
    }

    // Add gold
    handleGameUpdate({
      goldChange: totalGold
    });
  };

  // ============================================================================
  // CHARACTER EXPORT / IMPORT HANDLERS
  // ============================================================================
  
  const handleExportJSON = () => {
    if (!activeCharacter) return;
    setShowExportModal(true);
  };

  const handleImportJSON = () => {
    setShowImportModal(true);
  };

  const handleImportComplete = async (data: {
    character: Character;
    inventory: InventoryItem[];
    quests: CustomQuest[];
    journal: JournalEntry[];
    story: StoryChapter[];
  }) => {
    if (!currentUser) return;
    
    // Generate new IDs to avoid conflicts
    const newCharacterId = uuidv4();
    const importedCharacter: Character = {
      ...data.character,
      id: newCharacterId,
      profileId: currentProfileId || profiles[0]?.id || '',
      lastPlayed: Date.now(),
    };

    // Import character
    await saveCharacter(currentUser.uid, importedCharacter);
    setCharacters(prev => [...prev, importedCharacter]);

    // Import inventory with new IDs
    for (const item of data.inventory) {
      const newItem: InventoryItem = {
        ...item,
        id: uuidv4(),
        characterId: newCharacterId,
      };
      await saveInventoryItem(currentUser.uid, newItem);
      setItems(prev => [...prev, newItem]);
    }

    // Import quests with new IDs
    for (const quest of data.quests) {
      const newQuest: CustomQuest = {
        ...quest,
        id: uuidv4(),
        characterId: newCharacterId,
      };
      await saveQuest(currentUser.uid, newQuest);
      setQuests(prev => [...prev, newQuest]);
    }

    // Import journal entries with new IDs
    for (const entry of data.journal) {
      const newEntry: JournalEntry = {
        ...entry,
        id: uuidv4(),
        characterId: newCharacterId,
      };
      await saveJournalEntry(currentUser.uid, newEntry);
      setJournalEntries(prev => [...prev, newEntry]);
    }

    // Import story chapters with new IDs
    for (const chapter of data.story) {
      const newChapter: StoryChapter = {
        ...chapter,
        id: uuidv4(),
        characterId: newCharacterId,
      };
      await saveStoryChapter(currentUser.uid, newChapter);
      setStoryChapters(prev => [...prev, newChapter]);
    }

    // Switch to the imported character
    setCurrentCharacterId(newCharacterId);
    setShowImportModal(false);
  };

  // Legacy handlers (keep for backwards compatibility but they won't be used directly)
  const handleEat = () => {
    const food = pickConsumable('food');
    if (food) handleEatItem(food);
  };
  const handleDrink = () => {
    const drink = pickConsumable('drink');
    if (drink) handleDrinkItem(drink);
  };

  const pickConsumable = (kind: 'food' | 'drink'): InventoryItem | null => {
    if (!currentCharacterId) return null;
    const inv = items
      .filter(i => i.characterId === currentCharacterId)
      .filter(i => (i.quantity || 0) > 0);

    const foodKeywords = [
      'bread', 'apple', 'cheese', 'meat', 'stew', 'soup', 'potato', 'carrot',
      'salmon', 'leek', 'cabbage', 'sweetroll', 'pie', 'ration', 'food', 'meal'
    ];
    const drinkKeywords = [
      'water', 'ale', 'mead', 'wine', 'milk', 'drink', 'juice', 'tea'
    ];

    const keywords = kind === 'food' ? foodKeywords : drinkKeywords;

    const score = (it: InventoryItem) => {
      const name = String(it.name || '').toLowerCase();
      let s = 0;
      if (!name) return -999;

      // Prefer plausible consumable types.
      if (it.type === 'ingredient') s += 3;
      if (it.type === 'misc') s += 2;
      if (it.type === 'potion') s += kind === 'drink' ? 1 : -2;

      for (const k of keywords) {
        if (name.includes(k)) s += 5;
      }

      // Avoid health/magicka/stamina potions being treated as "Drink".
      if (kind === 'drink' && name.includes('potion')) {
        if (name.includes('health') || name.includes('magicka') || name.includes('stamina')) s -= 4;
      }
      return s;
    };

    let best: InventoryItem | null = null;
    let bestScore = 0;
    for (const it of inv) {
      const s = score(it);
      if (s > bestScore) {
        bestScore = s;
        best = it;
      }
    }
    return best;
  };
  
  // Helper to get active data
  const activeCharacter = characters.find(c => c.id === currentCharacterId);

  const getCharacterItems = () => items.filter((i: any) => i.characterId === currentCharacterId);
  
  const setCharacterItems = (newCharItemsOrUpdater: InventoryItem[] | ((prev: InventoryItem[]) => InventoryItem[])) => {
      const currentCharItems = items.filter((i: any) => i.characterId === currentCharacterId);
      
      // Support both direct array and functional updater patterns
      const newCharItems = typeof newCharItemsOrUpdater === 'function' 
        ? newCharItemsOrUpdater(currentCharItems)
        : newCharItemsOrUpdater;
      
      const others = items.filter((i: any) => i.characterId !== currentCharacterId);
      const taggedItems = newCharItems.map(i => ({ ...i, characterId: currentCharacterId }));
      
      // Find deleted items (items in current state but not in new state)
      const newItemIds = new Set(newCharItems.map(i => i.id));
      const deletedItems = currentCharItems.filter(i => !newItemIds.has(i.id));
      
      // Delete removed items from Firestore
      if (currentUser && deletedItems.length > 0) {
        deletedItems.forEach(item => {
          void deleteInventoryItem(currentUser.uid, item.id).catch(err => {
            console.error('Failed to delete item from Firestore:', err);
          });
        });
      }
      
      setItems([...others, ...taggedItems]);
      taggedItems.forEach(item => {
        setDirtyEntities(prev => new Set([...prev, item.id]));
      });
  };

  const getCharacterQuests = () => quests.filter(q => q.characterId === currentCharacterId);
  const setCharacterQuests = (newQuests: CustomQuest[]) => {
      const others = quests.filter(q => q.characterId !== currentCharacterId);
      const tagged = newQuests.map(q => ({ ...q, characterId: currentCharacterId }));
      setQuests([...others, ...tagged]);
      tagged.forEach(quest => {
        setDirtyEntities(prev => new Set([...prev, quest.id]));
      });
  };

  const handleDeleteQuest = async (questId: string) => {
    if (!currentUser) return;
    try {
      await deleteQuest(currentUser.uid, questId);
    } catch (error) {
      console.error('Failed to delete quest from Firestore:', error);
    }
  };

  // Handle quest completion from QuestLog (manual completion)
  const handleQuestComplete = (quest: any, xpReward: number, goldReward: number) => {
    if (!currentCharacterId || !activeCharacter) return;
    
    // Apply XP and gold rewards via handleGameUpdate so level-up check is triggered
    handleGameUpdate({
      xpChange: xpReward,
      goldChange: goldReward
    });
    
    // Show quest notification
    showQuestNotification({
      type: 'quest-completed',
      questTitle: quest.title,
      xpAwarded: xpReward,
      goldAwarded: goldReward,
    });
    
    // Sometimes give item rewards based on quest difficulty and player level
    const shouldGiveItem = Math.random() < 0.35; // 35% chance for item reward
    if (shouldGiveItem && quest.difficulty) {
      const playerLevel = activeCharacter.level || 1;
      const difficultyMultiplier = { trivial: 0, easy: 0.2, medium: 0.4, hard: 0.6, legendary: 0.8 }[quest.difficulty as string] || 0.3;
      const itemChance = difficultyMultiplier + (playerLevel * 0.02);
      
      if (Math.random() < itemChance) {
        // Determine rarity based on level and difficulty
        let rarity: 'common' | 'uncommon' | 'rare' | 'epic' = 'common';
        const rarityRoll = Math.random();
        if (playerLevel >= 20 && rarityRoll > 0.7) rarity = 'epic';
        else if (playerLevel >= 10 && rarityRoll > 0.5) rarity = 'rare';
        else if (playerLevel >= 5 && rarityRoll > 0.3) rarity = 'uncommon';
        
        // Generate a reward item
        const itemTypes = ['weapon', 'apparel'];
        const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        const weapons = ['Iron Sword', 'Steel Sword', 'Dwarven Mace', 'Orcish Axe', 'Glass Dagger', 'Ebony Blade'];
        const apparel = ['Iron Helmet', 'Steel Armor', 'Leather Boots', 'Hide Gauntlets', 'Glass Shield', 'Ebony Armor'];
        
        const itemList = itemType === 'weapon' ? weapons : apparel;
        const itemIndex = Math.min(Math.floor(playerLevel / 5), itemList.length - 1);
        const itemName = itemList[itemIndex];
        
        const rewardItem = {
          name: itemName,
          type: itemType,
          description: `A reward for completing "${quest.title}"`,
          quantity: 1,
          rarity,
          equipped: false,
        };
        
        handleGameUpdate({ newItems: [rewardItem as any] });
        showToast(`Quest reward: ${rarity} ${itemName}!`, 'success');
      }
    }
  };

  const getCharacterStory = () => storyChapters.filter(s => s.characterId === currentCharacterId);
  
  const getCharacterJournal = () => journalEntries.filter((j: any) => j.characterId === currentCharacterId);
  const setCharacterJournal = (newEntries: JournalEntry[]) => {
      const others = journalEntries.filter((j: any) => j.characterId !== currentCharacterId);
      const tagged = newEntries.map(e => ({ ...e, characterId: currentCharacterId }));
      setJournalEntries([...others, ...tagged]);
      tagged.forEach(entry => {
        setDirtyEntities(prev => new Set([...prev, entry.id]));
      });
  };

  // Dungeon reward handler
  const handleApplyDungeonRewards = (rewards: { gold?: number; xp?: number; items?: any[]; transactionId?: string }) => {
    if (!currentCharacterId || !activeCharacter) return;
    // Use provided transactionId if available (from combat finalizeLoot), otherwise generate new one
    const tx = rewards.transactionId || `dungeon_${uniqueId()}`;
    // Only apply if we have actual rewards to give
    if ((rewards.gold || 0) > 0 || (rewards.xp || 0) > 0 || (rewards.items && rewards.items.length > 0)) {
      handleGameUpdate({ transactionId: tx, goldChange: rewards.gold || 0, xpChange: rewards.xp || 0, newItems: rewards.items || [] });
      if ((rewards.gold || 0) > 0 || (rewards.xp || 0) > 0) {
        showToast(`Gained ${rewards.gold || 0} gold and ${rewards.xp || 0} XP`, 'success');
      }
      if (rewards.items && rewards.items.length) {
        showToast(`Found: ${rewards.items.map(i => i.name).join(', ')}`, 'success');
      }
    }
  };

  const handleApplyDungeonBuff = (effect: any) => {
    if (!currentCharacterId || !activeCharacter) return;
    const tx = `dungeon_buff_${uniqueId()}`;
    handleGameUpdate({ transactionId: tx, statusEffects: [effect] });
    setStatusEffects(prev => [...prev, effect]);
    showToast(`Buff applied: ${effect.name}`, 'success');
  };


  // Open dungeon modal from map or explicit action
  const handleEnterDungeonFromMap = (locationName: string) => {
    const normalized = (locationName || '').toLowerCase().trim();
    const d = listDungeons().find(dd => (dd.location || '').toLowerCase() === normalized || (dd.name || '').toLowerCase() === normalized || (dd.name || '').toLowerCase().includes(normalized) || (dd.location || '').toLowerCase().includes(normalized));
    if (!d) {
      showToast('No dungeon found at this location.', 'warning');
      return;
    }
    setDungeonId(d.id);
    setDungeonOpen(true);
    // Pause ambient music and narration to avoid overlap with the dungeon experience
    audioService.pauseMusic();
  };

  // AI Game Master Integration
  const handleGameUpdate = (updates: GameStateUpdate) => {
      if (!currentCharacterId || !activeCharacter) return;

      const hasAnyUpdate = Boolean(
        updates?.narrative ||
          (updates?.newQuests && updates.newQuests.length) ||
          (updates?.updateQuests && updates.updateQuests.length) ||
          (updates?.newItems && updates.newItems.length) ||
          (updates?.removedItems && updates.removedItems.length) ||
          updates?.statUpdates ||
          typeof updates?.goldChange === 'number' ||
          typeof updates?.xpChange === 'number' ||
          typeof updates?.timeAdvanceMinutes === 'number' ||
          (updates?.needsChange && Object.keys(updates.needsChange).length) ||
          (updates?.characterUpdates && Object.keys(updates.characterUpdates).length) ||
          (updates?.vitalsChange && Object.keys(updates.vitalsChange).length)
      );
      // Filter duplicate transactions (e.g., combat rewards already applied)
      let processedUpdates = updates as any;
      if (updates.transactionId) {
        const { filteredUpdate, wasFiltered, reason } = filterDuplicateTransactions(updates as any);
        if (wasFiltered) {
          console.log(`[TransactionLedger] Filtered duplicate update: ${reason}`);
        }
        // Debug: log before/after so we can see if xpChange was removed
        try {
          console.log('[App] Before filtering:', { transactionId: updates.transactionId, xpChange: updates.xpChange, goldChange: updates.goldChange });
          console.log('[App] After filtering:', { xpChange: (filteredUpdate as any).xpChange, goldChange: (filteredUpdate as any).goldChange });
        } catch (e) {}
        processedUpdates = filteredUpdate;
      }

      if (!hasAnyUpdate) return;

      // 0a. Character detail updates (hero sheet fields)
      // Use the processed updates (duplicate filtering may have removed some fields)
      updates = processedUpdates;

      if (updates.characterUpdates && Object.keys(updates.characterUpdates).length) {
        setCharacters(prev => prev.map(c => {
          if (c.id !== currentCharacterId) return c;
          const updatedChar = { ...c };
          const cu = updates.characterUpdates!;
          // Merge completedCombats if provided (helps persist combat completion across sessions)
          if (cu.completedCombats && Array.isArray(cu.completedCombats) && cu.completedCombats.length) {
            const existing = new Set(updatedChar.completedCombats || []);
            cu.completedCombats.forEach((id: string) => existing.add(id));
            updatedChar.completedCombats = Array.from(existing);
          }
          if (cu.identity !== undefined) updatedChar.identity = cu.identity;
          if (cu.psychology !== undefined) updatedChar.psychology = cu.psychology;
          if (cu.breakingPoint !== undefined) updatedChar.breakingPoint = cu.breakingPoint;
          if (cu.moralCode !== undefined) updatedChar.moralCode = cu.moralCode;
          if (cu.allowedActions !== undefined) updatedChar.allowedActions = cu.allowedActions;
          if (cu.forbiddenActions !== undefined) updatedChar.forbiddenActions = cu.forbiddenActions;
          if (cu.fears !== undefined) updatedChar.fears = cu.fears;
          if (cu.weaknesses !== undefined) updatedChar.weaknesses = cu.weaknesses;
          if (cu.talents !== undefined) updatedChar.talents = cu.talents;
          if (cu.magicApproach !== undefined) updatedChar.magicApproach = cu.magicApproach;
          if (cu.factionAllegiance !== undefined) updatedChar.factionAllegiance = cu.factionAllegiance;
          if (cu.worldview !== undefined) updatedChar.worldview = cu.worldview;
          if (cu.daedricPerception !== undefined) updatedChar.daedricPerception = cu.daedricPerception;
          if (cu.forcedBehavior !== undefined) updatedChar.forcedBehavior = cu.forcedBehavior;
          if (cu.longTermEvolution !== undefined) updatedChar.longTermEvolution = cu.longTermEvolution;
          if (cu.backstory !== undefined) updatedChar.backstory = cu.backstory;
          setDirtyEntities(d => new Set([...d, c.id]));
          return updatedChar;
        }));
      }

      // 0. Time & Needs (progression)
      const timeAdvance = Math.trunc(Number(updates.timeAdvanceMinutes || 0));
      const explicitNeedsChange = updates.needsChange || {};

      if (timeAdvance !== 0 || (explicitNeedsChange && Object.keys(explicitNeedsChange).length)) {
        // Predict next needs immediately so we can enforce penalties and forced-rest rules.
        try {
          const currentTimeSnap = (activeCharacter as any).time || INITIAL_CHARACTER_TEMPLATE.time;
          const currentNeedsSnap = (activeCharacter as any).needs || INITIAL_CHARACTER_TEMPLATE.needs;
          const hungerFromTime = calcNeedFromTime(timeAdvance, NEED_RATES.hungerPerMinute);
          const thirstFromTime = calcNeedFromTime(timeAdvance, NEED_RATES.thirstPerMinute);
          const fatigueFromTime = calcNeedFromTime(timeAdvance, NEED_RATES.fatiguePerMinute);
          const nextNeedsSnap = {
            hunger: clamp(
              Number(currentNeedsSnap.hunger || 0) + hungerFromTime + Number((explicitNeedsChange as any).hunger || 0),
              0,
              100
            ),
            thirst: clamp(
              Number(currentNeedsSnap.thirst || 0) + thirstFromTime + Number((explicitNeedsChange as any).thirst || 0),
              0,
              100
            ),
            fatigue: clamp(
              Number(currentNeedsSnap.fatigue || 0) + fatigueFromTime + Number((explicitNeedsChange as any).fatigue || 0),
              0,
              100
            ),
          };

          const { forcedRest, effects: survivalEffects } = computeSurvivalEffects(nextNeedsSnap);

          // Update status effects (survival effects are derived; preserve other effects).
          setStatusEffects(prev => {
            const nonSurvival = (prev || []).filter(e => !String(e.id || '').startsWith('survival_'));
            return [...nonSurvival, ...survivalEffects];
          });

          // Forced rest: auto-open Bonfire to compel a rest choice.
          // Only trigger for CRITICAL fatigue (100), not for hunger/thirst combo
          // Don't trigger if we just rested (cooldown) or if bonfire is already open
          // Also skip if this update itself is a rest action (negative fatigue change)
          const restCooldownActive = Date.now() - lastRestTimestampRef.current < REST_COOLDOWN_MS;
          const forcedRestCooldownActive = Date.now() - lastForcedRestRef.current < FORCED_REST_COOLDOWN_MS;
          const isRestAction = Number((explicitNeedsChange as any).fatigue || 0) < 0;
          // Only force rest when fatigue is critical (100), not based on hunger+thirst
          const shouldForceRest = nextNeedsSnap.fatigue >= SURVIVAL_THRESHOLDS.critical;
          
          if (shouldForceRest && !restOpen && !restCooldownActive && !forcedRestCooldownActive && !isRestAction) {
            try {
              lastForcedRestRef.current = Date.now();
              const hours = Math.max(1, Math.min(12, Math.ceil(Math.max(3, nextNeedsSnap.fatigue >= 100 ? 6 : 4))));
              openBonfireMenu({ type: hasCampingGear ? 'camp' : 'outside', hours });
              showToast('You are collapsing from exhaustion. Rest is mandatory.', 'warning');
            } catch (e) {
              // If Bonfire fails to open for any reason, at least warn.
              showToast('You are collapsing from exhaustion. Find rest immediately.', 'warning');
            }
          }
        } catch (e) {
          // Do not block progression on UI-only survival effect failures.
        }

        setCharacters(prev => prev.map(c => {
          if (c.id !== currentCharacterId) return c;

          const currentTime = (c as any).time || INITIAL_CHARACTER_TEMPLATE.time;
          const currentNeeds = (c as any).needs || INITIAL_CHARACTER_TEMPLATE.needs;

          const nextTime = timeAdvance !== 0 ? addMinutesToTime(currentTime, timeAdvance) : currentTime;

          // Passive needs increase from time passing
          const hungerFromTime = calcNeedFromTime(timeAdvance, NEED_RATES.hungerPerMinute);
          const thirstFromTime = calcNeedFromTime(timeAdvance, NEED_RATES.thirstPerMinute);
          const fatigueFromTime = calcNeedFromTime(timeAdvance, NEED_RATES.fatiguePerMinute);

          // Round to 1 decimal place to avoid floating point precision issues
          const roundNeed = (n: number) => Math.round(n * 10) / 10;
          
          const nextNeeds = {
            hunger: roundNeed(clamp(
              Number(currentNeeds.hunger || 0) + hungerFromTime + Number((explicitNeedsChange as any).hunger || 0),
              0,
              100
            )),
            thirst: roundNeed(clamp(
              Number(currentNeeds.thirst || 0) + thirstFromTime + Number((explicitNeedsChange as any).thirst || 0),
              0,
              100
            )),
            fatigue: roundNeed(clamp(
              Number(currentNeeds.fatigue || 0) + fatigueFromTime + Number((explicitNeedsChange as any).fatigue || 0),
              0,
              100
            )),
          };

          setDirtyEntities(d => new Set([...d, c.id]));
          return { ...c, time: nextTime, needs: nextNeeds };
        }));
      }

      // 1. Narrative -> Story Chapter
      if (updates.narrative) {
          const chapter: StoryChapter = {
              id: uniqueId(),
              characterId: currentCharacterId,
              title: updates.narrative.title,
              content: updates.narrative.content,
              date: "4E 201",
              summary: updates.narrative.title,
              createdAt: Date.now()
          };
          setStoryChapters(prev => [...prev, chapter]);
          setDirtyEntities(prev => new Set([...prev, chapter.id]));
      }

      // 2. New Quests (with rewards)
      if (updates.newQuests) {
          const addedQuests = updates.newQuests.map(q => ({
              id: uniqueId(),
              characterId: currentCharacterId,
              title: q.title,
              description: q.description,
              location: q.location,
              dueDate: q.dueDate,
              objectives: (q.objectives || []).map(o => ({
                id: uniqueId(),
                description: o.description,
                completed: Boolean(o.completed)
              })),
              status: 'active' as const,
              createdAt: Date.now(),
              // Store quest rewards and type
              questType: q.questType || 'side',
              difficulty: q.difficulty || 'medium',
              xpReward: q.xpReward || 50,
              goldReward: q.goldReward || 100
          }));
          setQuests(prev => [...prev, ...addedQuests]);
          addedQuests.forEach(quest => {
            setDirtyEntities(prev => new Set([...prev, quest.id]));
            // Show Skyrim-style quest notification
            showQuestNotification({
              type: 'quest-started',
              questTitle: quest.title,
            });
          });
      }

      // 3. Update Quests (with reward application)
      if (updates.updateQuests) {
          let totalXpFromQuests = 0;
          let totalGoldFromQuests = 0;
          const questNotificationsToShow: Array<Omit<QuestNotification, 'id'>> = [];
          
          setQuests(prev => prev.map(q => {
              if (q.characterId !== currentCharacterId) return q;
              const update = updates.updateQuests?.find(u => u.title.toLowerCase() === q.title.toLowerCase());
              if (update) {
                  setDirtyEntities(prev => new Set([...prev, q.id]));
                  // If quest is completed, mark all objectives as completed too
                  const updatedObjectives = update.status === 'completed' 
                      ? q.objectives.map(obj => ({ ...obj, completed: true }))
                      : q.objectives;
                  
                  // Apply quest rewards when completed
                  let xpReward = 0;
                  let goldReward = 0;
                  if (update.status === 'completed') {
                    // Use rewards from update, or fall back to quest's stored rewards
                    xpReward = update.xpAwarded ?? q.xpReward ?? 0;
                    goldReward = update.goldAwarded ?? q.goldReward ?? 0;
                    totalXpFromQuests += xpReward;
                    totalGoldFromQuests += goldReward;
                  }
                  
                  // Queue Skyrim-style quest notification
                  const notificationType = update.status === 'completed' ? 'quest-completed' 
                    : update.status === 'failed' ? 'quest-failed' 
                    : 'quest-updated';
                  questNotificationsToShow.push({
                    type: notificationType,
                    questTitle: q.title,
                    xpAwarded: update.status === 'completed' ? xpReward : undefined,
                    goldAwarded: update.status === 'completed' ? goldReward : undefined,
                  });
                  
                  return { 
                      ...q, 
                      status: update.status, 
                      objectives: updatedObjectives,
                      completedAt: (update.status === 'completed' || update.status === 'failed') ? Date.now() : undefined
                  };
              }
              return q;
          }));
          
          // Show quest notifications (staggered so they don't all appear at once)
          questNotificationsToShow.forEach((notif, index) => {
            setTimeout(() => showQuestNotification(notif), index * 300);
          });
          
          // Apply accumulated quest gold rewards directly (XP will be deferred to trigger level-up check)
          if (totalGoldFromQuests > 0) {
            setCharacters(prev => prev.map(c => {
              if (c.id !== currentCharacterId) return c;
              setDirtyEntities(d => new Set([...d, c.id]));
              return { ...c, gold: (c.gold || 0) + totalGoldFromQuests };
            }));
          }
          // Log quest reward application
          if (totalXpFromQuests > 0 || totalGoldFromQuests > 0) {
            console.log(`Quest rewards applied: +${totalXpFromQuests} XP, +${totalGoldFromQuests} gold`);
            // Show immediate toast summarizing quest rewards
            const parts: string[] = [];
            if (totalXpFromQuests > 0) parts.push(`+${totalXpFromQuests} XP`);
            if (totalGoldFromQuests > 0) parts.push(`+${totalGoldFromQuests} Gold`);
            showToast(parts.join('  '), 'success');
          }
          // Defer XP to section 6b by adding to xpChange (enables level-up check)
          if (totalXpFromQuests > 0) {
            updates = { ...updates, xpChange: (updates.xpChange || 0) + totalXpFromQuests };
          }
      }

      // 4. New Items
      if (updates.newItems) {
           setItems(prev => {
             const next = [...prev];
             for (const i of updates.newItems || []) {
               const rawItem = sanitizeInventoryItem(i as Partial<InventoryItem>);
               const name = (rawItem.name || '').trim();
               if (!name) continue;

               // Enrich item with stats from itemStats.ts if damage/armor not provided
               // This ensures AI-generated items like "Bandit's Axe" get proper stats
               const itemType = rawItem.type || 'misc';
               if (shouldHaveStats(itemType) && rawItem.damage === undefined && rawItem.armor === undefined) {
                 const stats = getItemStats(name, itemType);
                 if (stats.damage !== undefined) rawItem.damage = stats.damage;
                 if (stats.armor !== undefined) rawItem.armor = stats.armor;
                 if (stats.value !== undefined && rawItem.value === undefined) rawItem.value = stats.value;
               }
               
               // Ensure all items have a value (gold) for selling/displaying
               if (rawItem.value === undefined || rawItem.value === null || rawItem.value <= 0) {
                 rawItem.value = estimateItemValue(name, itemType, rawItem.rarity as string);
               }

               const forceCreate = (i as any).__forceCreate === true;

               if (forceCreate) {
                 // Create unique item entity without name-merging
                 const added = sanitizeInventoryItem({
                   id: (i as any).id || uniqueId(),
                   characterId: currentCharacterId,
                   name,
                   type: rawItem.type || 'misc',
                   subtype: rawItem.subtype,
                   description: rawItem.description || '',
                   quantity: Math.max(1, Number(rawItem.quantity || 1)),
                   equipped: rawItem.equipped ?? false,
                   equippedBy: rawItem.equippedBy ?? null,
                   armor: rawItem.armor,
                   damage: rawItem.damage,
                   value: rawItem.value,
                   slot: rawItem.slot,
                   rarity: rawItem.rarity,
                 }) as InventoryItem;
                 next.push(added);
                 setDirtyEntities(d => new Set([...d, added.id]));
                 continue;
               }

               const idx = next.findIndex(it => {
                 if (it.characterId !== currentCharacterId) return false;
                 if (((it.name || '').trim().toLowerCase()) !== name.toLowerCase()) return false;
                 if (String(it.rarity || '').toLowerCase() !== String(rawItem.rarity || '').toLowerCase()) return false;
                 // Also require upgrade/damage/armor to match exactly to avoid merging upgraded or enchanted items
                 const itUpgrade = Number(it.upgradeLevel || 0);
                 const rawUpgrade = Number(rawItem.upgradeLevel || 0);
                 if (itUpgrade !== rawUpgrade) return false;
                 const itDamage = Number(it.damage || 0);
                 const rawDamage = Number(rawItem.damage || 0);
                 if (itDamage !== rawDamage) return false;
                 const itArmor = Number(it.armor || 0);
                 const rawArmor = Number(rawItem.armor || 0);
                 if (itArmor !== rawArmor) return false;
                 return true;
               });

               const addQty = Math.max(1, Number(rawItem.quantity || 1));

               // If forceCreate, always create a unique entry
               if (forceCreate) {
                 const added = sanitizeInventoryItem({
                   id: (i as any).id || uniqueId(),
                   characterId: currentCharacterId,
                   name,
                   type: rawItem.type || 'misc',
                   subtype: rawItem.subtype,
                   description: rawItem.description || '',
                   quantity: addQty,
                   equipped: rawItem.equipped ?? false,
                   equippedBy: rawItem.equippedBy ?? null,
                   armor: rawItem.armor,
                   damage: rawItem.damage,
                   value: rawItem.value,
                   slot: rawItem.slot,
                   rarity: rawItem.rarity,
                 }) as InventoryItem;
                 next.push(added);
                 setDirtyEntities(d => new Set([...d, added.id]));
                 continue;
               }

               // Default behavior: only merge into existing stacks when the incoming
               // quantity is greater than 1 or the item is explicitly stackable.
               // Singletons (quantity === 1) should create unique inventory entries
               // so items like weapons/armor don't collapse into a stack.
               const NON_STACKABLE_TYPES = ['weapon', 'apparel'];
               let isStackable = Boolean((rawItem as any).stackable) || addQty > 1;
               // Treat known equipment types as non-stackable by default unless explicitly marked stackable
               if (NON_STACKABLE_TYPES.includes(String(rawItem.type || '').toLowerCase()) && !(rawItem as any).stackable) {
                 isStackable = false;
               }

               if (isStackable) {
                 if (idx >= 0) {
                   const existing = next[idx];
                   const updated = sanitizeInventoryItem({
                     ...existing,
                     quantity: (existing.quantity || 0) + addQty,
                     description: existing.description || rawItem.description || '',
                     type: existing.type || rawItem.type || 'misc',
                     subtype: existing.subtype || rawItem.subtype,
                     armor: existing.armor ?? rawItem.armor,
                     damage: existing.damage ?? rawItem.damage,
                     value: existing.value ?? rawItem.value,
                     rarity: existing.rarity ?? rawItem.rarity,
                     // Preserve or apply equipped state and ownership when provided in the update
                     equipped: rawItem.equipped ?? existing.equipped ?? false,
                     equippedBy: rawItem.equippedBy ?? existing.equippedBy ?? null,
                     slot: existing.slot ?? rawItem.slot,
                   }) as InventoryItem;
                   next[idx] = updated;
                   setDirtyEntities(d => new Set([...d, updated.id]));
                 } else {
                   const added = sanitizeInventoryItem({
                     id: uniqueId(),
                     characterId: currentCharacterId,
                     name,
                     type: rawItem.type || 'misc',
                     subtype: rawItem.subtype,
                     description: rawItem.description || '',
                     quantity: addQty,
                     equipped: rawItem.equipped ?? false,
                     equippedBy: rawItem.equippedBy ?? null,
                     armor: rawItem.armor,
                     damage: rawItem.damage,
                     value: rawItem.value,
                     slot: rawItem.slot,
                     rarity: rawItem.rarity,
                   }) as InventoryItem;
                   next.push(added);
                   setDirtyEntities(d => new Set([...d, added.id]));
                 }
               } else {
                 // Non-stackable singletons: create a unique record per incoming item
                 const added = sanitizeInventoryItem({
                   id: (i as any).id || uniqueId(),
                   characterId: currentCharacterId,
                   name,
                   type: rawItem.type || 'misc',
                   subtype: rawItem.subtype,
                   description: rawItem.description || '',
                   quantity: 1,
                   equipped: rawItem.equipped ?? false,
                   equippedBy: rawItem.equippedBy ?? null,
                   armor: rawItem.armor,
                   damage: rawItem.damage,
                   value: rawItem.value,
                   slot: rawItem.slot,
                   rarity: rawItem.rarity,
                 }) as InventoryItem;
                 next.push(added);
                 setDirtyEntities(d => new Set([...d, added.id]));
               }
             }
             return next;
           });
      }

      // 4a. Updated items by id (preserve id and replace matching entries)
      // Items with quantity <= 0 are treated as deletions to prevent "x0" ghost items
      if ((updates as any).updatedItems) {
        setItems(prev => {
          const next = [...prev];
          for (const u of (updates as any).updatedItems || []) {
            const id = (u as any).id;
            if (!id) continue;
            const idx = next.findIndex(it => it.id === id && it.characterId === currentCharacterId);
            const sanitized = sanitizeInventoryItem(u as Partial<InventoryItem>) as InventoryItem;
            
            // Treat zero or negative quantity as deletion
            if ((sanitized.quantity || 0) <= 0) {
              if (idx >= 0) {
                const [removed] = next.splice(idx, 1);
                if (currentUser?.uid) {
                  void deleteInventoryItem(currentUser.uid, removed.id).catch(err => {
                    console.warn('Failed to delete zero-quantity inventory item from Firestore:', err);
                  });
                }
              }
              continue;
            }
            
            if (idx >= 0) {
              next[idx] = { ...next[idx], ...sanitized } as InventoryItem;
              setDirtyEntities(d => new Set([...d, next[idx].id]));
            } else {
              // If not present, push as new (respect id)
              const added = { ...sanitized, id: id, characterId: currentCharacterId } as InventoryItem;
              next.push(added);
              setDirtyEntities(d => new Set([...d, added.id]));
            }
          }
          return next;
        });
      }

      // 4b. Removed Items
      if (updates.removedItems) {
        setItems(prev => {
          const next = [...prev];
          for (const r of updates.removedItems || []) {
            const name = (r.name || '').trim();
            if (!name) continue;

            const idx = next.findIndex(it =>
              it.characterId === currentCharacterId &&
              (it.name || '').trim().toLowerCase() === name.toLowerCase()
            );
            if (idx < 0) continue;

            const existing = next[idx];
            const removeQty = Math.max(1, Number(r.quantity || 1));
            const newQty = (existing.quantity || 0) - removeQty;

            if (newQty > 0) {
              const updated = { ...existing, quantity: newQty };
              next[idx] = updated;
              setDirtyEntities(d => new Set([...d, updated.id]));
            } else {
              const [removed] = next.splice(idx, 1);
              if (currentUser?.uid) {
                void deleteInventoryItem(currentUser.uid, removed.id).catch(err => {
                  console.warn('Failed to delete inventory item from Firestore:', err);
                });
              }
            }
          }
          return next;
        });
      }

      // 5. Stats
      if (updates.statUpdates) {
          setCharacters(prev => prev.map(c => {
              if (c.id !== currentCharacterId) return c;
              setDirtyEntities(prev => new Set([...prev, c.id]));
              return {
                  ...c,
                  stats: { ...c.stats, ...updates.statUpdates }
              };
          }));
      }

      // 5b. Skill gains from narrative or events (e.g., story chapters contributing to skills)
      if (updates.skillGains && updates.skillGains.length) {
        setCharacters(prev => prev.map(c => {
          if (c.id !== currentCharacterId) return c;
          const updatedSkills = (c.skills || []).map(s => {
            const gain = updates.skillGains?.find(g => (g.skill || '').toLowerCase() === (s.name || '').toLowerCase());
            if (!gain) return s;
            const nextLevel = clamp(Number(s.level || 0) + Number(gain.amount || 0), 0, 100);
            return { ...s, level: nextLevel };
          });
          setDirtyEntities(d => new Set([...d, c.id]));
          return { ...c, skills: updatedSkills };
        }));
      }

      // 5b. Vitals (currentHealth, currentMagicka, currentStamina) changes from adventure
      if (updates.vitalsChange && Object.keys(updates.vitalsChange).length) {
          setCharacters(prev => prev.map(c => {
              if (c.id !== currentCharacterId) return c;
              setDirtyEntities(prev => new Set([...prev, c.id]));
              
              const currentVitals = c.currentVitals || {
                currentHealth: c.stats.health,
                currentMagicka: c.stats.magicka,
                currentStamina: c.stats.stamina
              };
              
              const newVitals = {
                currentHealth: Math.max(0, Math.min(c.stats.health, (currentVitals.currentHealth ?? c.stats.health) + (updates.vitalsChange?.currentHealth ?? 0))),
                currentMagicka: Math.max(0, Math.min(c.stats.magicka, (currentVitals.currentMagicka ?? c.stats.magicka) + (updates.vitalsChange?.currentMagicka ?? 0))),
                currentStamina: Math.max(0, Math.min(c.stats.stamina, (currentVitals.currentStamina ?? c.stats.stamina) + (updates.vitalsChange?.currentStamina ?? 0)))
              };
              
              return {
                  ...c,
                  currentVitals: newVitals
              };
          }));
      }

      // 5d. New status effects to add (buffs/debuffs)
      if (updates.statusEffects && updates.statusEffects.length) {
        const normalized = updates.statusEffects.map((s: any) => ({ id: s.id || `status_${uniqueId()}`, ...s }));
        setStatusEffects(prev => [...prev, ...normalized]);
        normalized.forEach((effect: any) => {
          showToast(effect.description || `Effect applied: ${effect.name}`, 'success');
        });
      }

      // 5c. Combat Start - Initialize turn-based combat
      if (updates.combatStart && updates.combatStart.enemies?.length) {
        const combatData = updates.combatStart;
        // Filter companions to only include those belonging to the current character
        const activeCompanions = companions.filter(c => c.characterId === currentCharacterId);
        // Scale AI-generated enemies to player level for balanced encounters
        const playerLevel = activeCharacter?.level || 1;
        const scaledEnemies = (combatData.enemies as CombatEnemy[]).map((enemy: CombatEnemy) => {
          // Target level: player level ± 2, minimum 1
          const targetLevel = Math.max(1, playerLevel + Math.floor(Math.random() * 5) - 2);
          const levelScale = targetLevel / Math.max(1, enemy.level || 1);
          return {
            ...enemy,
            level: targetLevel,
            maxHealth: Math.max(30, Math.floor((enemy.maxHealth || 50) * levelScale)),
            currentHealth: Math.max(30, Math.floor((enemy.maxHealth || 50) * levelScale)),
            damage: Math.max(5, Math.floor((enemy.damage || 10) * levelScale)),
            armor: Math.max(0, Math.floor((enemy.armor || 5) * levelScale)),
            xpReward: Math.max(10, Math.floor((enemy.xpReward || 20) * levelScale)),
            goldReward: enemy.goldReward ? Math.max(5, Math.floor(enemy.goldReward * levelScale)) : undefined,
          };
        });
        const initializedCombat = initializeCombat(
          scaledEnemies,
          combatData.location,
          combatData.ambush ?? false,
          combatData.fleeAllowed ?? true,
          combatData.surrenderAllowed ?? false,
          activeCompanions // include only current character's companions who will join if behavior indicates
        );
        setCombatState(initializedCombat);
        
        // Switch to combat music
        updateMusicForContext({ inCombat: true, mood: 'tense' });
      }

      // 6. Gold
      if (typeof updates.goldChange === 'number' && updates.goldChange !== 0) {
         if (!updates._alreadyAppliedLocally) {
           setCharacters(prev => prev.map(c => {
                if (c.id !== currentCharacterId) return c;
                setDirtyEntities(prev => new Set([...prev, c.id]));
                return { ...c, gold: (c.gold || 0) + (updates.goldChange || 0) };
           }));
         } else {
           // Already applied locally by caller (defensive apply); still mark dirty for persistence
           setDirtyEntities(prev => new Set([...prev, currentCharacterId!]));
         }
      }

      // 6b. XP with Level-Up Check (using escalating XP requirements)
      if (typeof updates.xpChange === 'number' && updates.xpChange !== 0) {
        // If a level-up is already pending, don't queue another until resolved
        if (!pendingLevelUp) {
          setCharacters(prev => prev.map(c => {
            if (c.id !== currentCharacterId) return c;
            setDirtyEntities(prev => new Set([...prev, c.id]));

            // If caller already applied XP locally, avoid double-adding
            const delta = updates._alreadyAppliedLocally ? 0 : (updates.xpChange || 0);
            const newXP = (c.experience || 0) + delta;
            const currentLevel = c.level || 1;
            const xpForNextLevel = getXPForNextLevel(currentLevel);
            const xpProgress = getXPProgress(newXP, currentLevel);

                  // Check if we leveled up (XP progress >= required for next level)
            if (xpProgress.current >= xpForNextLevel) {
              const newLevel = currentLevel + 1;
              const remainingXP = newXP; // Keep total XP

              // Avoid race-conditions where multiple xpChange updates in quick succession queue the same level up twice.
              if (!levelUpQueuedRef.current) {
                levelUpQueuedRef.current = true;

                // Save pending level up to prompt user for choice
                setPendingLevelUp({
                  charId: c.id,
                  charName: c.name,
                  newLevel,
                  remainingXP,
                  archetype: c.archetype,
                  previousXP: c.experience || 0,
                });

                // Show Skyrim-style level up notification
                showLevelUpNotification(c.name, newLevel);

                // Informally record XP gain but do not auto-apply level or stat bonuses
                setSaveMessage(`🎉 ${c.name} earned enough experience to level up — confirm to apply.`);
                setTimeout(() => setSaveMessage(null), 3500);
              }

              return { ...c, experience: newXP };
            }

            return { ...c, experience: newXP };
          }));
        } else {
          // If already pending, simply add XP to character so progress is not lost
          setCharacters(prev => prev.map(c => c.id === currentCharacterId ? { ...c, experience: (c.experience || 0) + (updates.xpChange || 0) } : c));
        }
      }

      // 7. Auto-Journal
      const title =
        updates.narrative?.title ||
        (updates.newQuests?.length ? 'New Quest' : undefined) ||
        (updates.updateQuests?.length ? 'Quest Update' : undefined) ||
        (updates.newItems?.length || updates.removedItems?.length ? 'Supplies & Spoils' : undefined) ||
        (typeof updates.goldChange === 'number' && updates.goldChange !== 0 ? 'Coin & Debts' : undefined) ||
        (typeof updates.xpChange === 'number' && updates.xpChange !== 0 ? 'Lessons Learned' : undefined) ||
        (updates.statUpdates ? 'Condition' : undefined) ||
        (typeof updates.timeAdvanceMinutes === 'number' && updates.timeAdvanceMinutes !== 0 ? 'Time Passes' : undefined) ||
        (updates.needsChange ? 'Survival' : undefined) ||
        'Field Notes';

      const lines: string[] = [];

      if (updates.narrative?.content) {
        lines.push(`I remember it like this:\n${updates.narrative.content.trim()}`);
      }

      const changes: string[] = [];

      if (typeof updates.timeAdvanceMinutes === 'number' && updates.timeAdvanceMinutes !== 0) {
        const mins = Math.abs(Math.trunc(updates.timeAdvanceMinutes));
        const hrs = Math.floor(mins / 60);
        const rem = mins % 60;
        const dur = hrs > 0 ? `${hrs}h${rem ? ` ${rem}m` : ''}` : `${rem}m`;
        changes.push(`Time passed: ${dur}.`);

        // Use the *new* time if we can derive it, otherwise a best-effort.
        const nextTime = addMinutesToTime((activeCharacter as any).time || INITIAL_CHARACTER_TEMPLATE.time, updates.timeAdvanceMinutes);
        changes.push(`It is now ${formatTime(nextTime)}.`);

        const hungerInc = calcNeedFromTime(updates.timeAdvanceMinutes, NEED_RATES.hungerPerMinute);
        const thirstInc = calcNeedFromTime(updates.timeAdvanceMinutes, NEED_RATES.thirstPerMinute);
        const fatigueInc = calcNeedFromTime(updates.timeAdvanceMinutes, NEED_RATES.fatiguePerMinute);
        const parts: string[] = [];
        if (hungerInc) parts.push(`hunger +${hungerInc}`);
        if (thirstInc) parts.push(`thirst +${thirstInc}`);
        if (fatigueInc) parts.push(`fatigue +${fatigueInc}`);
        if (parts.length) changes.push(`As the minutes wore on, I felt it: ${parts.join(', ')}.`);
      }

      if (typeof updates.goldChange === 'number' && updates.goldChange !== 0) {
        if (updates.goldChange > 0) changes.push(`I gained ${updates.goldChange} gold.`);
        else changes.push(`I spent ${Math.abs(updates.goldChange)} gold.`);
      }
        if (typeof updates.xpChange === 'number' && updates.xpChange !== 0) {
        if (updates.xpChange > 0) changes.push(`I gained ${updates.xpChange} experience.`);
        else changes.push(`I lost ${Math.abs(updates.xpChange)} experience.`);
      }

      if (updates.needsChange && Object.keys(updates.needsChange).length) {
        const parts: string[] = [];
        const h = Number((updates.needsChange as any).hunger || 0);
        const t = Number((updates.needsChange as any).thirst || 0);
        const f = Number((updates.needsChange as any).fatigue || 0);
        if (h) parts.push(`hunger ${h > 0 ? `+${h}` : `${h}`}`);
        if (t) parts.push(`thirst ${t > 0 ? `+${t}` : `${t}`}`);
        if (f) parts.push(`fatigue ${f > 0 ? `+${f}` : `${f}`}`);
        if (parts.length) changes.push(`My body felt it: ${parts.join(', ')}.`);
      }

      if (updates.statUpdates && Object.keys(updates.statUpdates).length) {
        const statParts: string[] = [];
        if (typeof updates.statUpdates.health === 'number') statParts.push(`health is now ${updates.statUpdates.health}`);
        if (typeof updates.statUpdates.magicka === 'number') statParts.push(`magicka is now ${updates.statUpdates.magicka}`);
        if (typeof updates.statUpdates.stamina === 'number') statParts.push(`stamina is now ${updates.statUpdates.stamina}`);
        if (statParts.length) changes.push(`My ${statParts.join(', ')}.`);
      }

      if (updates.newItems?.length) {
        const items = updates.newItems
          .map(i => {
            const qty = Math.max(1, Number(i.quantity || 1));
            return `${qty}× ${String(i.name || '').trim()}`.trim();
          })
          .filter(Boolean);
        if (items.length) changes.push(`I gained ${items.join(', ')}.`);
      }

      if (updates.removedItems?.length) {
        const items = updates.removedItems
          .map(i => {
            const qty = Math.max(1, Number(i.quantity || 1));
            return `${qty}× ${String(i.name || '').trim()}`.trim();
          })
          .filter(Boolean);
        if (items.length) changes.push(`I used or lost ${items.join(', ')}.`);
      }

      if (updates.newQuests?.length) {
        const questSummaries = updates.newQuests
          .map(q => {
            const loc = q.location ? ` (${q.location})` : '';
            const due = q.dueDate ? ` — Due: ${q.dueDate}` : '';
            const objectives = (q.objectives || []).map(o => `- ${o.description}`).join('\n');
            const objBlock = objectives ? `\nMy objectives:\n${objectives}` : '';
            const desc = (q.description || '').trim();
            return `I accepted a new quest: ${q.title}${loc}${due}.${desc ? `\n${desc}` : ''}${objBlock}`.trim();
          })
          .filter(Boolean);
        if (questSummaries.length) lines.push(questSummaries.join('\n\n'));
      }

      if (updates.updateQuests?.length) {
        const questUpdates = updates.updateQuests
          .map(q => {
            if (q.status === 'completed') return `I completed the quest: ${q.title}.`;
            if (q.status === 'failed') return `I failed the quest: ${q.title}.`;
            return `I updated my quest: ${q.title}.`;
          })
          .filter(Boolean);
        if (questUpdates.length) changes.push(...questUpdates);
      }

      if (changes.length) {
        lines.push(`\nMy notes:\n- ${changes.join('\n- ')}`);
      }

      const entry: JournalEntry = {
        id: uniqueId(),
        characterId: currentCharacterId,
        date: "4E 201",
        title,
        content: lines.filter(Boolean).join('\n\n').trim(),
      };
      setJournalEntries(prev => [...prev, entry]);
      setDirtyEntities(prev => new Set([...prev, entry.id]));

      // 8. Automatic Music Update based on ambient context (only when explicitly provided)
      // BUT: Don't override if combat was just started in this same update
      if (updates.ambientContext && !updates.combatStart) {
        // Check if we're in combat from multiple sources
        const isInCombat = updates.ambientContext.inCombat 
          || (updates.simulationUpdate?.phaseChange === 'combat')
          || Boolean(combatState); // Also check existing combat state
        
        const ambientCtx: AmbientContext = {
          localeType: updates.ambientContext.localeType,
          inCombat: isInCombat,
          mood: updates.ambientContext.mood,
          timeOfDay: (activeCharacter as any)?.time?.hour ?? 12
        };
        updateMusicForContext(ambientCtx);
      }
  };

  // Expose app context for demo commands (updated on every render)
  if (currentUser?.uid) {
    (window as any).app = {
      currentUser,
      currentCharacterId,
      currentProfileId,
      activeTab,
      characters,
      items,
      quests,
      journalEntries,
      storyChapters,
      handleGameUpdate,
      setCharacters,
      setItems,
      setQuests,
      setJournalEntries,
      setStoryChapters,
      setActiveTab,
      setCurrentCharacterId,
      // Expose updateCharacter for console/tests: calling `updateCharacter('level', n)` now performs a proper level-up
      updateCharacter
    };
  }

  const getAIContext = () => {
    if (!activeCharacter) return "";
    return JSON.stringify({
        character: activeCharacter,
        inventory: getCharacterItems(),
        activeQuests: getCharacterQuests().filter(q => q.status === 'active'),
        recentStory: getCharacterStory().slice(-3)
    });
  };

  // Level-up confirm/cancel handlers

  const confirmLevelUp = (choice: 'health' | 'magicka' | 'stamina') => {
    if (!pendingLevelUp || !currentCharacterId) return;
    const p = pendingLevelUp;

    setCharacters(prev => prev.map(c => {
      if (c.id !== p.charId) return c;
      const updated = applyLevelUpToCharacter(c, p.newLevel, p.remainingXP, choice);
      setDirtyEntities(d => new Set([...d, c.id]));

      // Add a journal entry announcing the level up
      const entry: JournalEntry = {
        id: uniqueId(),
        characterId: c.id,
        date: "4E 201",
        title: `Leveled up to ${p.newLevel}`,
        content: `${c.name} reached level ${p.newLevel} and chose to increase ${choice} by +10. Received 1 perk point.`
      };
      setJournalEntries(prev => [...prev, entry]);
      setDirtyEntities(d => new Set([...d, entry.id]));

      return updated;
    }));

    setPendingLevelUp(null);
    // Remove any available-level entry for this character (applied now)
    setAvailableLevelUps(prev => {
      const copy = { ...prev };
      delete copy[p.charId];
      return copy;
    });
    // Reset queued guard so subsequent level-ups can be queued in future
    levelUpQueuedRef.current = false;
    setSaveMessage(`Level ${p.newLevel} applied.`);
    setTimeout(() => setSaveMessage(null), 2500);
  };

  const cancelLevelUp = () => {
    // If a pending level up exists, move it to the available pool so the player can apply it later
    if (pendingLevelUp) {
      setAvailableLevelUps(prev => ({ ...prev, [pendingLevelUp.charId]: pendingLevelUp }));
    }

    // Clear pending prompt; XP remains as-is so player can choose later
    setPendingLevelUp(null);
    // Reset queued guard on cancel as well
    levelUpQueuedRef.current = false;
    setSaveMessage('Level up postponed.');
    setTimeout(() => setSaveMessage(null), 2000);
  };



  const canUnlockPerk = (char: Character, perkId: string) => {
    const def = PERK_DEFINITIONS.find(d => d.id === perkId);
    if (!def) return false;
    if (!def.requires || def.requires.length === 0) return true;
    // Requirements may be of form 'perkId' or 'perkId:rank'
    const parseReq = (req: string) => {
      if (!req.includes(':')) return { id: req, rank: 1 };
      const [id, r] = req.split(':');
      return { id, rank: Number(r || 1) };
    };
    return def.requires.every(r => {
      const parsed = parseReq(r);
      // Special-case level requirement encoded as 'level:10'
      if (parsed.id === 'level') {
        return (char.level || 0) >= parsed.rank;
      }
      const have = (char.perks || []).find(p => p.id === parsed.id)?.rank || 0;
      return have >= parsed.rank;
    });
  };

  const applyPerk = (perkId: string) => {
    if (!currentCharacterId) return;
    const def = PERK_DEFINITIONS.find(d => d.id === perkId);
    if (!def) return;

    setCharacters(prev => prev.map(c => {
      if (c.id !== currentCharacterId) return c;
      let pts = c.perkPoints || 0;
      if (pts <= 0) return c;
      const max = def.maxRank || 1;
      const existing = (c.perks || []).find(p => p.id === perkId);
      const currRank = existing?.rank || 0;
      if (currRank >= max) return c;

      // Apply one rank
      let updatedStats = { ...c.stats };
      if (def.effect && def.effect.type === 'stat') {
        const key = def.effect.key as keyof typeof updatedStats;
        const prev = typeof (updatedStats as any)[key] === 'number' ? (updatedStats as any)[key] : 0;
        updatedStats = { ...updatedStats, [key]: prev + def.effect.amount };
      }

      let newPerks = (c.perks || []).slice();
      if (existing) {
        newPerks = newPerks.map(p => p.id === perkId ? { ...p, rank: (p.rank || 0) + 1 } : p);
      } else {
        newPerks.push({ id: def.id, name: def.name, skill: def.skill || '', rank: 1, mastery: 0, description: def.description });
      }
      pts = Math.max(0, pts - 1);
      setDirtyEntities(d => new Set([...d, c.id]));
      return { ...c, stats: updatedStats, perks: sanitizePerks(newPerks), perkPoints: pts } as Character;
    }));
  };

  const applyPerks = (perkIds: string[]) => {
    if (!currentCharacterId || perkIds.length === 0) return;
    // Count desired ranks per perk id
    const counts: Record<string, number> = {};
    for (const id of perkIds) counts[id] = (counts[id] || 0) + 1;

    setCharacters(prev => prev.map(c => {
      if (c.id !== currentCharacterId) return c;
      let updatedStats = { ...c.stats };
      let pts = c.perkPoints || 0;
      const nextPerks = (c.perks || []).slice();

      for (const [id, wantCount] of Object.entries(counts)) {
        // Support mastery tokens encoded as "<perkId>::MASTER"
        if (id.includes('::MASTER')) {
          const baseId = id.split('::')[0];
          const def = PERK_DEFINITIONS.find(d => d.id === baseId);
          if (!def) continue;
          const existing = nextPerks.find(p => p.id === baseId);
          const currRank = existing?.rank || 0;
          const max = def.maxRank || 1;
          const masteryCost = def.masteryCost || 3;
          // only allow mastering when at max rank
          if (currRank >= max) {
            // Check if we have enough points to pay for mastery
            const balance = PERK_BALANCE || {};
            const masteryCostResolved = def.masteryCost || balance[baseId]?.masteryCost || 3;
            const masteryBonusCfg = balance[baseId]?.masteryBonus;

            if (pts < masteryCostResolved * (wantCount || 1)) {
              showToast && showToast(`Not enough perk points to purchase mastery for ${def.name}.`, 'warning');
              continue;
            }

            // Deduct points for each mastery purchased
            pts = Math.max(0, pts - masteryCostResolved * (wantCount || 1));

            // increment mastery counter and reset rank to 1 (prestige while preserving prior stat gains)
            let found = false;
            for (let i = 0; i < nextPerks.length; i++) {
              if (nextPerks[i].id === baseId) {
                nextPerks[i] = { ...nextPerks[i], mastery: (nextPerks[i].mastery || 0) + wantCount, rank: 1 };
                found = true;
                break;
              }
            }
            if (!found) {
              // If a perk wasn't present (edge case), add it with rank=1 and mastery
              nextPerks.push({ id: def.id, name: def.name, skill: def.skill || '', rank: 1, mastery: wantCount, description: def.description });
            }

            // apply mastery bonus from config if present
            if (masteryBonusCfg && masteryBonusCfg.type === 'stat') {
              const key = masteryBonusCfg.key as keyof typeof updatedStats;
              const bonus = (masteryBonusCfg.amount || 0) * (wantCount || 1);
              const prevMastery = typeof (updatedStats as any)[key] === 'number' ? (updatedStats as any)[key] : 0;
              updatedStats = { ...updatedStats, [key]: prevMastery + bonus };
            } else if (def.effect && def.effect.type === 'stat') {
              // fallback to previous heuristic
              const key = def.effect.key as keyof typeof updatedStats;
              const bonusPerMastery = Math.ceil((def.effect.amount || 0) * 0.5 * (def.maxRank || 1));
              const bonus = bonusPerMastery * (wantCount || 1);
              const prevMastery2 = typeof (updatedStats as any)[key] === 'number' ? (updatedStats as any)[key] : 0;
              updatedStats = { ...updatedStats, [key]: prevMastery2 + bonus };
            }
            showToast && showToast(`Mastery purchased for ${def.name} (x${wantCount})`, 'success');
          }
          continue;
        }
        if (pts <= 0) break;
        const def = PERK_DEFINITIONS.find(d => d.id === id);
        if (!def) continue;
        const max = def.maxRank || 1;
        let existingIndex = nextPerks.findIndex(p => p.id === id);
        let currRank = existingIndex >= 0 ? (nextPerks[existingIndex].rank || 0) : 0;
        let applied = 0;
        while (applied < wantCount && pts > 0 && currRank < max) {
          // apply one rank
          if (def.effect && def.effect.type === 'stat') {
            const key = def.effect.key as keyof typeof updatedStats;
            const prev = typeof (updatedStats as any)[key] === 'number' ? (updatedStats as any)[key] : 0;
            updatedStats = { ...updatedStats, [key]: prev + def.effect.amount };
          }
          if (existingIndex >= 0) {
            // Perk exists, increment its rank
            nextPerks[existingIndex] = { ...nextPerks[existingIndex], rank: (nextPerks[existingIndex].rank || 0) + 1 };
          } else {
            // Perk doesn't exist, add it with rank 1
            nextPerks.push({ id: def.id, name: def.name, skill: def.skill || '', rank: 1, mastery: 0, description: def.description });
            // Update existingIndex so subsequent iterations in this while loop can find it
            existingIndex = nextPerks.length - 1;
          }
          currRank += 1;
          applied += 1;
          pts = Math.max(0, pts - 1);
        }
      }

      setDirtyEntities(d => new Set([...d, c.id]));
      return { ...c, stats: updatedStats, perks: sanitizePerks(nextPerks), perkPoints: pts } as Character; // already sanitized above (nextPerks)
    }));
  };

  // Sanitize perks to ensure ranks/mastery are within logical bounds
  const sanitizePerks = (perks: Perk[]) => {
    return (perks || []).map(p => {
      const def = PERK_DEFINITIONS.find(d => d.id === p.id);
      const max = def?.maxRank || 1;
      return { ...p, rank: Math.max(0, Math.min(max, p.rank || 0)), mastery: Math.max(0, p.mastery || 0) };
    });
  };

  // Force-unlock a locked perk by spending 3 perk points (limited uses per character)
  const forceUnlockPerk = (perkId: string) => {
    if (!currentCharacterId) return;
    
    // Validate before state update to avoid toast duplication in React strict mode
    const currentChar = characters.find(c => c.id === currentCharacterId);
    if (!currentChar) return;
    
    const pts = currentChar.perkPoints || 0;
    const forced = currentChar.forcedPerkUnlocks || 0;
    if (pts < 3) {
      showToast && showToast('Not enough perk points to force-unlock this perk.', 'warning');
      return;
    }
    if (forced >= 3) {
      showToast && showToast('You have reached the maximum number of forced unlocks (3).', 'warning');
      return;
    }
    const def = PERK_DEFINITIONS.find(d => d.id === perkId);
    if (!def) return;
    const max = def.maxRank || 1;
    const existing = (currentChar.perks || []).find(p => p.id === perkId);
    const currRank = existing?.rank || 0;
    if (currRank >= max) {
      showToast && showToast('Perk is already at maximum rank.', 'info');
      return;
    }
    
    setCharacters(prev => prev.map(c => {
      if (c.id !== currentCharacterId) return c;

      // Apply one rank regardless of prerequisites
      let updatedStats = { ...c.stats };
      if (def.effect && def.effect.type === 'stat') {
        const key = def.effect.key as keyof typeof updatedStats;
        const prevVal = typeof (updatedStats as any)[key] === 'number' ? (updatedStats as any)[key] : 0;
        updatedStats = { ...updatedStats, [key]: prevVal + def.effect.amount };
      }
      let newPerks = (c.perks || []).slice();
      const existingPerk = newPerks.find(p => p.id === perkId);
      if (existingPerk) {
        newPerks = newPerks.map(p => p.id === perkId ? { ...p, rank: (p.rank || 0) + 1 } : p);
      } else {
        newPerks.push({ id: def.id, name: def.name, skill: def.skill || '', rank: 1, mastery: 0, description: def.description });
      }

      const newPts = Math.max(0, (c.perkPoints || 0) - 3);
      const newForced = (c.forcedPerkUnlocks || 0) + 1;
      setDirtyEntities(d => new Set([...d, c.id]));
      return { ...c, stats: updatedStats, perks: newPerks, perkPoints: newPts, forcedPerkUnlocks: newForced } as Character;
    }));
  };

  // Refund all perks - clears all perks and restores spent perk points
  const refundAllPerks = () => {
    if (!currentCharacterId) return;
    
    // Calculate total refund before state update to avoid toast duplication
    const currentChar = characters.find(c => c.id === currentCharacterId);
    if (!currentChar) return;
    
    const perks = currentChar.perks || [];
    let totalRefund = 0;
    for (const p of perks) {
      const def = PERK_DEFINITIONS.find(d => d.id === p.id);
      totalRefund += p.rank || 0;
      totalRefund += (p.mastery || 0) * (def?.masteryCost || 3);
    }

    if (totalRefund === 0) {
      showToast && showToast('No perks to refund.', 'info');
      return;
    }
    
    setCharacters(prev => prev.map(c => {
      if (c.id !== currentCharacterId) return c;

      // Reset stats from perk effects
      let updatedStats = { ...c.stats };
      for (const p of c.perks || []) {
        const def = PERK_DEFINITIONS.find(d => d.id === p.id);
        if (def?.effect?.type === 'stat') {
          const key = def.effect.key as keyof typeof updatedStats;
          const prev = typeof (updatedStats as any)[key] === 'number' ? (updatedStats as any)[key] : 0;
          const amountToRemove = (def.effect.amount || 0) * (p.rank || 0);
          updatedStats = { ...updatedStats, [key]: Math.max(0, prev - amountToRemove) };
        }
      }

      setDirtyEntities(d => new Set([...d, c.id]));
      return { 
        ...c, 
        stats: updatedStats, 
        perks: [], 
        perkPoints: (c.perkPoints || 0) + totalRefund,
        forcedPerkUnlocks: 0  // Reset force unlocks on refund
      } as Character;
    }));
    
    showToast && showToast(`Refunded ${totalRefund} perk point${totalRefund !== 1 ? 's' : ''}!`, 'success');
  };

  // Allow UI to request a manual level-up (e.g., '+' on hero page)
  const requestLevelUp = (char?: Character | null) => {
    if (!char) return;
    if (pendingLevelUp) {
      setSaveMessage('A level up is already awaiting confirmation.');
      setTimeout(() => setSaveMessage(null), 2000);
      return;
    }

    // If an available level-up exists for this character (postponed earlier), restore it to pending
    const available = availableLevelUps[char.id];
    if (available) {
      setPendingLevelUp(available);
      setAvailableLevelUps(prev => {
        const copy = { ...prev };
        delete copy[char.id];
        return copy;
      });
      setSaveMessage(`${char.name} has a pending level up — confirm to apply.`);
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setPendingLevelUp({
      charId: char.id,
      charName: char.name,
      newLevel: (char.level || 0) + 1,
      remainingXP: char.experience || 0,
      archetype: char.archetype,
      previousXP: char.experience || 0,
    });

    setSaveMessage(`${char.name} is ready to level up — confirm to apply.`);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Rest handlers: restore vitals and advance time
  const handleRest = (minutes: number, recoverPercent: number) => {
    if (!currentCharacterId || !activeCharacter) return;

    // Compute amounts to restore based on max stats and recoverPercent
    const max = activeCharacter.stats;
    const currentVitals = activeCharacter.currentVitals || {
      currentHealth: activeCharacter.stats.health,
      currentMagicka: activeCharacter.stats.magicka,
      currentStamina: activeCharacter.stats.stamina
    };

    const healthRestore = Math.floor((max.health - (currentVitals.currentHealth || max.health)) * recoverPercent);
    const magickaRestore = Math.floor((max.magicka - (currentVitals.currentMagicka || max.magicka)) * recoverPercent);
    const staminaRestore = Math.floor((max.stamina - (currentVitals.currentStamina || max.stamina)) * recoverPercent);

    const vitalsChange: any = {};
    if (healthRestore > 0) vitalsChange.currentHealth = healthRestore;
    if (magickaRestore > 0) vitalsChange.currentMagicka = magickaRestore;
    if (staminaRestore > 0) vitalsChange.currentStamina = staminaRestore;

    handleGameUpdate({
      vitalsChange,
      timeAdvanceMinutes: minutes
    });

    showToast(`Rested for ${Math.floor(minutes/60)}h and recovered vitals.`, 'success');
  };

  // Render Logic
  if (!currentCharacterId) {
      return (
        <>
          <CharacterSelect 
              profileId={currentProfileId}
              characters={characters}
              onCreateCharacter={handleCreateCharacter}
              onSelectCharacter={async (cid) => {
                setCurrentCharacterId(cid);
                if (currentUser) {
                  await setActiveCharacter(currentUser.uid, cid);
                }
              }}
              onLogout={handleLogout}
              onUpdateCharacter={handleUpdateCharacter}
              onDeleteCharacter={handleDeleteCharacter}
              onMarkCharacterDead={handleMarkCharacterDead}
              colorTheme={colorTheme}
              onThemeChange={setColorTheme}
              weatherEffect={weatherEffect}
              onWeatherChange={(w) => React.startTransition(() => setWeatherEffect(w))}
          />
          {/* Global Weather Effect on login page (can be disabled via localStorage or prefers-reduced-motion) */}
          {mountWeather && weatherEffect !== 'none' && effectsEnabled && (
            <SnowEffect 
              settings={{ intensity: weatherIntensity, enableMouseInteraction: (userSettings?.weatherMouseInteractionEnabled ?? true) }} 
              theme={colorTheme} 
              weatherType={weatherEffect} 
            />
          )} 
          {(isFeatureEnabled('onboarding') || isFeatureWIP('onboarding')) && (
            <OnboardingModal open={isFeatureEnabled('onboarding') ? onboardingOpen : false} onComplete={completeOnboarding} />
          )}
        </>
      );
  }

  return (
    <AppContext.Provider value={{
      handleManualSave,
      isSaving,
      handleLogout,
      setCurrentCharacterId,
      aiModel,
      setAiModel,
      isAnonymous: currentUser?.isAnonymous || false,
      handleExportPDF: () => {}, // TODO: Implement export
      isExporting: false, // TODO: Implement export state
      handleGenerateProfileImage: async () => {
        if (!activeCharacter) return;
        updateCharacter('profileImage', null); // Optionally clear first
        try {
          // Optionally set a loading state here if you want to show spinner
          const imageUrl = await import('./services/geminiService').then(m => m.generateCharacterProfileImage(
            getEasterEggName(activeCharacter.name),
            activeCharacter.race,
            activeCharacter.gender,
            activeCharacter.archetype
          ));
          if (imageUrl) updateCharacter('profileImage', imageUrl);
        } catch (e) {
          showToast('Profile image generation failed.', 'error');
        }
      },
      isGeneratingProfileImage: false, // (Optional: implement spinner state if needed)
      handleCreateImagePrompt: async () => {
        if (!activeCharacter || !navigator.clipboard) return;
        const prompt = `${getEasterEggName(activeCharacter.name)}, a ${activeCharacter.gender} ${activeCharacter.race} ${activeCharacter.archetype}. ${activeCharacter.identity} ${activeCharacter.psychology} ${activeCharacter.magicApproach}`;
        try {
          await navigator.clipboard.writeText(prompt);
          showToast('Image prompt copied to clipboard.', 'success');
        } catch (e) {
          showToast('Failed to copy prompt to clipboard.', 'warning');
        }
      },

      handleUploadPhoto: () => {}, // TODO: Implement upload
      // New survival & shop handlers
      handleRestWithOptions,
      handleEatItem,
      handleDrinkItem,
      handleShopPurchase,
      handleShopSell,
      showToast,
      openBonfireMenu,
      gold: activeCharacter?.gold || 0,
      inventory: getCharacterItems(),
      hasCampingGear,
      hasBedroll,
      characterLevel: activeCharacter?.level || 1,
      // New Game Features
      handleExportJSON,
      handleImportJSON,
      difficulty,
      setDifficulty,
      weather,
      statusEffects,
      companions,
      openCompanions,
      colorTheme,
      setColorTheme,
      showQuantityControls,
      setShowQuantityControls,
      weatherEffect,
      setWeatherEffect,
      weatherIntensity,
      setWeatherIntensity,
      effectsEnabled,
      setEffectsEnabled,
      userSettings,
      updateUserSettings,
    }}>
      <LevelUpModal
        open={Boolean(pendingLevelUp)}
        onClose={cancelLevelUp}
        onConfirm={confirmLevelUp}
        characterName={pendingLevelUp?.charName || ''}
        newLevel={pendingLevelUp?.newLevel || 1}
        archetype={pendingLevelUp?.archetype}
      />
      <PerkTreeModal
        open={perkModalOpen}
        onClose={() => setPerkModalOpen(false)}
        character={activeCharacter as any}
        onConfirm={(perkIds: string[]) => { applyPerks(perkIds); setPerkModalOpen(false); }}
        onForceUnlock={(id: string) => { forceUnlockPerk(id); setPerkModalOpen(false); }}
        onRefundAll={() => { refundAllPerks(); setPerkModalOpen(false); }}
      />

      <CompanionsModal
        open={companionsModalOpen}
        onClose={closeCompanions}
        companions={companions}
        onAdd={addCompanion}
        onUpdate={updateCompanion}
        onRemove={removeCompanion}
        onTalk={(c) => { setCompanionDialogue(c); setCompanionsModalOpen(false); }}
        onPet={(c) => { setCompanionDialogue(c); setCompanionsModalOpen(false); }}
        inventory={getCharacterItems()}
        onAssignItemToCompanion={(companionId: string, itemId: string, slot?: any) => {
          const items = getCharacterItems();
          const item = items.find(i => i.id === itemId);
          if (!item) { showToast('Item not found', 'error'); return; }
          if (item.equippedBy && item.equippedBy !== 'player' && item.equippedBy !== companionId) {
            showToast('Item already equipped by another companion', 'warning');
            return;
          }

          // If item is currently equipped by player but exists in a stack, allow splitting and give one copy to companion
          if (item.equippedBy === 'player' && (item.quantity || 0) > 1) {
            const newId = `item_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
            const cloned: any = { ...item, id: newId, quantity: 1, equipped: true, slot: slot || item.slot, equippedBy: companionId, createdAt: Date.now() };
            const originalUpdated = { ...item, quantity: (item.quantity || 1) - 1 };
            // Persist both changes
            (window as any).app?.handleGameUpdate?.({ newItems: [originalUpdated, cloned] });

            // Update companion equipment mapping
            setCompanions(prev => prev.map(c => {
              if (c.id !== companionId) return c;
              const slotKey = (slot || item.slot || getDefaultSlotForItem(item)) as any;
              return { ...c, equipment: { ...(c.equipment || {}), [slotKey]: cloned.id } };
            }));

            showToast('Split stack and assigned item to companion', 'success');
            return;
          }

          // If item is equipped by player and only one exists, require unequip first
          if (item.equippedBy === 'player') {
            showToast('Unequip item from player before assigning to companion', 'warning');
            return;
          }

          // Normal assignment (not splitting)
          const updated = { ...item, equipped: true, slot: slot || item.slot, equippedBy: companionId };
          (window as any).app?.handleGameUpdate?.({ newItems: [updated] });

          // Update companion equipment mapping so companion state reflects the change
          setCompanions(prev => prev.map(c => {
            if (c.id !== companionId) return c;
            const slotKey = (slot || item.slot || getDefaultSlotForItem(item)) as any;
            return { ...c, equipment: { ...(c.equipment || {}), [slotKey]: updated.id } };
          }));

          showToast('Assigned item to companion', 'success');
        }}
        onUnassignItemFromCompanion={(itemId: string) => {
          const items = getCharacterItems();
          const item = items.find(i => i.id === itemId);
          if (!item) { showToast('Item not found', 'error'); return; }
          if (!item.equippedBy || item.equippedBy === 'player') { showToast('Item not assigned to a companion', 'warning'); return; }
          const ownerId = item.equippedBy as string;
          const updated = { ...item, equipped: false, slot: undefined, equippedBy: null };
          (window as any).app?.handleGameUpdate?.({ newItems: [updated] });

          // Remove reference from the companion equipment mapping (if present)
          setCompanions(prev => prev.map(c => {
            if (c.id !== ownerId) return c;
            const newEq = { ...(c.equipment || {}) } as Record<string, any>;
            Object.keys(newEq).forEach(k => { if (newEq[k] === itemId) newEq[k] = null; });
            return { ...c, equipment: newEq };
          }));

          // Also update local items immediately so UI reflects the change without waiting for debounced persistence
          setItems(prev => prev.map(it => it.id === updated.id ? updated : it));

          showToast('Removed item from companion', 'success');
        }}
      />

      <CompanionDialogueModal
        open={Boolean(companionDialogue)}
        companion={companionDialogue}
        onClose={() => setCompanionDialogue(null)}
        onSend={(id, msg) => {
          // simple persistence hook: record last message as mood modifier if contains keywords
          const lower = (msg || '').toLowerCase();
          if (lower.includes('good') || lower.includes('thanks')) updateCompanion({ ...(companionDialogue as any), mood: 'happy' });
          if (lower.includes('tired') || lower.includes('leave')) updateCompanion({ ...(companionDialogue as any), mood: 'unhappy' });
        }}
        onPet={(c) => {
          // Optional: play sound or trigger toast
          showToast(`You pet ${c.name}!`, 'success');
        }}
        onUpdateCompanion={updateCompanion}
      />

      {/* Bonfire / Rest Menu */}
      <BonfireMenu
        open={restOpen}
        onClose={() => { setRestOpen(false); setRestPreviewOptions(null); }}
        onConfirmRest={(opts) => handleRestWithOptions(opts as any)}
        onApplyChanges={(changedItems) => {
          if (!changedItems || changedItems.length === 0) return;
          const toSave = changedItems.map(it => ({ ...it, characterId: (currentCharacterId || '') }));
          handleGameUpdate({ newItems: toSave as any });
          showToast(`Applied ${changedItems.length} item change(s).`, 'success');
        }}
        inventory={getCharacterItems()}
        gold={activeCharacter?.gold || 0}
        hasCampingGear={hasCampingGear}
        hasBedroll={hasBedroll}
        previewOptions={restPreviewOptions}
        characterId={currentCharacterId}
        character={activeCharacter}
        onApplyPerks={(perkIds) => applyPerks(perkIds)}
      />
      <div className="min-h-screen bg-skyrim-dark text-skyrim-text font-sans selection:bg-skyrim-gold selection:text-skyrim-dark">
        {/* Status Indicators */}
        <OfflineIndicator />
        <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
        
        {(isFeatureEnabled('onboarding') || isFeatureWIP('onboarding')) && (
          <OnboardingModal open={isFeatureEnabled('onboarding') ? onboardingOpen : false} onComplete={completeOnboarding} />
        )}
        {/* Navigation Header */}
        <nav className="fixed top-0 left-0 right-0 bg-skyrim-paper/95 backdrop-blur-md border-b border-skyrim-border z-40 shadow-cheap">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2 text-skyrim-gold font-serif font-bold text-xl tracking-widest uppercase cursor-pointer shrink-0" onClick={() => setActiveTab(TABS.CHARACTER)}>
                <Skull size={24} />
                <span className="hidden md:inline">Skyrim Aetherius</span>
              </div>
              <div className="flex flex-nowrap items-center gap-1 sm:gap-2 relative overflow-x-auto scrollbar-hide max-w-[calc(100vw-140px)] sm:max-w-none">
                {[
                        { id: TABS.CHARACTER, icon: User, label: t('nav.hero') },
                    { id: TABS.INVENTORY, icon: Package, label: t('nav.equipment') },
                    { id: TABS.ADVENTURE, icon: Swords, label: t('nav.adventure') },
                    { id: TABS.QUESTS, icon: Scroll, label: t('nav.quests') },
                    { id: TABS.STORY, icon: Feather, label: t('nav.story') },
                    { id: TABS.JOURNAL, icon: BookOpen, label: t('nav.journal') },
                ].map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded transition-all duration-300 text-xs sm:text-sm md:text-base ${
                      activeTab === tab.id 
                          ? 'bg-skyrim-gold text-skyrim-dark font-bold' 
                          : 'text-skyrim-text hover:text-skyrim-gold hover:bg-white/5'
                      }`}
                  >
                      <tab.icon size={14} className="sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
                {/* Actions button inline with tabs */}
                <ActionBarToggle />

                {/* Persistent Level Badge (HUD) */}
                {activeCharacter && (
                  <div className="ml-2 hidden sm:block">
                    <LevelBadge level={activeCharacter.level} size={40} compact />
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Only one Actions button: ActionBarToggle is inline with tabs, remove default ActionBar here */}
        </nav>

        {/* Save Message */}
        {saveMessage && (
          <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-bold z-50 transition-all ${
            saveMessage.includes('✓') 
              ? 'bg-green-900/80 text-green-200 border border-green-700' 
              : 'bg-red-900/80 text-red-200 border border-red-700'
          }`}>
            {saveMessage}
          </div>
        )}

        {/* Main Content Area */}
        <main className={`pt-24 px-2 sm:px-4 ${activeTab === TABS.ADVENTURE ? 'h-screen overflow-hidden' : 'min-h-screen pb-20'}`}>
          <div className={`max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 ${activeTab === TABS.ADVENTURE ? 'h-[calc(100vh-6rem)] overflow-hidden' : ''}`}>
            {activeTab === TABS.CHARACTER && activeCharacter && (
              <CharacterSheet 
                character={activeCharacter} 
                updateCharacter={updateCharacter} 
                inventory={getCharacterItems()}
                quests={getCharacterQuests()}
                journal={getCharacterJournal()}
                story={getCharacterStory()}
                onRest={openBonfireMenu}
                onEat={handleEatItem}
                onDrink={handleDrinkItem}
                hasCampingGear={hasCampingGear}
                hasBedroll={hasBedroll}
                onRequestLevelUp={() => requestLevelUp(activeCharacter)}
                onOpenPerkTree={() => setPerkModalOpen(true)}
                levelUpAvailable={!!availableLevelUps[activeCharacter.id]}
              />
            )}
            {activeTab === TABS.INVENTORY && activeCharacter && (
              <Inventory 
                  items={getCharacterItems()} 
                  setItems={setCharacterItems} 
                  gold={activeCharacter.gold || 0} 
                  setGold={(amt) => updateCharacter('gold', amt)}
                  maxCarryWeight={getMaxCarryWeight(activeCharacter)}
                  onUseItem={handleUseItem}
              />
            )}
            {activeTab === TABS.QUESTS && (
              <QuestLog 
                quests={getCharacterQuests()} 
                setQuests={setCharacterQuests} 
                onDelete={handleDeleteQuest}
                onQuestComplete={handleQuestComplete}
              />
            )}
            {activeTab === TABS.STORY && (
              <StoryLog 
                chapters={getCharacterStory()} 
                onUpdateChapter={updateStoryChapter}
                onDeleteChapter={handleDeleteStoryChapter}
                onAddChapter={(chapter) => setStoryChapters(prev => [...prev, chapter])}
                onGameUpdate={handleGameUpdate}
                character={activeCharacter}
                quests={getCharacterQuests()}
                journal={getCharacterJournal()}
                items={getCharacterItems()}
                userId={currentUser?.uid}
              />
            )}
            {activeTab === TABS.JOURNAL && (
              <Journal entries={getCharacterJournal()} setEntries={setCharacterJournal} onDeleteEntry={handleDeleteJournalEntry} />
            )}
            {activeTab === TABS.ADVENTURE && (
              <AdventureChat
                userId={currentUser?.uid}
                model={aiModel}
                character={activeCharacter}
                inventory={getCharacterItems()}
                quests={getCharacterQuests()}
                journal={getCharacterJournal()}
                story={getCharacterStory()}
                onUpdateState={handleGameUpdate}
                onEnterDungeon={handleEnterDungeonFromMap}
                pauseChat={dungeonOpen}
                chatFontSize={userSettings?.chatFontSize || 'medium'}
                chatFontWeight={userSettings?.chatFontWeight || 'normal'}
                onChatSettingsChange={async (settings) => {
                  if (currentUser?.uid) {
                    const next: UserSettings = {
                      ...(userSettings || {}),
                      chatFontSize: settings.fontSize,
                      chatFontWeight: settings.fontWeight,
                    };
                    setUserSettings(next);
                    try {
                      await saveUserSettings(currentUser.uid, next);
                    } catch (e) {
                      console.warn('Failed to save chat settings:', e);
                    }
                  }
                }}
              />
            )}
          </div>
        </main>

        {/* AI Game Master */}
        <AIScribe contextData={getAIContext()} onUpdateState={handleGameUpdate} model={aiModel} />

        {/* Character Export/Import Modals */}
        {activeCharacter && (
          <CharacterExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            character={activeCharacter}
            inventory={getCharacterItems()}
            quests={quests.filter(q => q.characterId === currentCharacterId)}
            journal={journalEntries.filter(j => j.characterId === currentCharacterId)}
            story={storyChapters.filter(s => s.characterId === currentCharacterId)}
          />
        )}
        
        <CharacterImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportComplete}
        />

        {/* Dungeon Modal */}
        <DungeonModal
          open={dungeonOpen}
          dungeonId={dungeonId}
          activeCharacterId={currentCharacterId}
          character={activeCharacter}
          companions={companions.filter(c => c.characterId === currentCharacterId)}
          inventory={items}
          onClose={(result) => {
            setDungeonOpen(false);
            if (result?.rewards) handleApplyDungeonRewards(result.rewards);
            if (result?.cleared && dungeonId) {
              // Track cleared dungeon for re-entry with scaling enemies
              setCharacters(prev => prev.map(c => {
                if (c.id !== currentCharacterId) return c;
                const existing = (c.clearedDungeons || []).find(d => d.dungeonId === dungeonId);
                const newCleared = existing 
                  ? c.clearedDungeons!.map(d => d.dungeonId === dungeonId 
                      ? { ...d, clearCount: d.clearCount + 1, lastCleared: Date.now() } 
                      : d)
                  : [...(c.clearedDungeons || []), { dungeonId: dungeonId!, clearCount: 1, lastCleared: Date.now() }];
                setDirtyEntities(d => new Set([...d, c.id]));
                return { ...c, clearedDungeons: newCleared };
              }));
              showQuestNotification({ id: `dungeon_cleared_${uniqueId()}`, title: 'Dungeon Cleared', subtitle: 'You have conquered this dungeon!', type: 'quest-completed' });
            }
            setDungeonId(null);
          }}
          onApplyRewards={(rewards) => handleApplyDungeonRewards(rewards)}
          onApplyBuff={(effect) => handleApplyDungeonBuff(effect)}
          showToast={showToast}
          onInventoryUpdate={(itemsOrRemoved) => {
            // Accept both consumable removals and full inventory updates from the dungeon/combat internals.
            if (!Array.isArray(itemsOrRemoved)) return;
            const first = (itemsOrRemoved as any)[0];
            if (first && first.id) {
              // Incoming is an array of InventoryItem updates — merge into global state and persist
              const updatedItems = itemsOrRemoved as InventoryItem[];
              handleGameUpdate({ updatedItems });
              updatedItems.forEach(i => setDirtyEntities(d => new Set([...d, i.id])));
              return;
            }

            // Backwards-compatible: treat as consumable removals
            const toRemove = itemsOrRemoved as Array<{ name: string; quantity: number }>;
            toRemove.forEach(({ name, quantity }) => {
              setItems(prev => prev.map(it => 
                it.name === name ? { ...it, quantity: Math.max(0, (it.quantity || 1) - quantity) } : it
              ).filter(it => (it.quantity || 1) > 0));
            });
            setDirtyEntities(d => new Set([...d, currentCharacterId!]));
          }}
        />

        {/* Combat Modal - Full screen overlay when combat is active */}
        {combatState && activeCharacter && (
            <CombatModal
            character={activeCharacter}
            inventory={getCharacterItems()}
            initialCombatState={combatState}

            onCombatEnd={(result, rewards, finalVitals, timeAdvanceMinutes, combatResult) => {
              setCombatState(null);
              updateMusicForContext({ inCombat: false, mood: result === 'victory' ? 'triumphant' : 'peaceful' });
              
              // Debug log to verify rewards are being received
              console.log('[App.onCombatEnd] Combat ended:', { result, rewards, xp: rewards?.xp, gold: rewards?.gold });
              
              if (result === 'victory' && rewards) {
                // Debug: log current in-memory character before applying defensive local-apply
                try {
                  const cid = currentCharacterId;
                  const before = (window as any).app?.characters?.find((c: any) => c.id === cid);
                  console.log('[App.onCombatEnd] Character before local-apply:', cid, before && { experience: before.experience, gold: before.gold });
                } catch (e) {}
                // NOTE: Loot items are already applied via onInventoryUpdate during finalizeLoot
                // Do NOT pass newItems here to avoid duplication
                  // Defensive local apply: update character state immediately so HUD reflects rewards
                  setCharacters(prev => prev.map(c => {
                    if (c.id !== currentCharacterId) return c;
                    return {
                      ...c,
                      gold: (c.gold || 0) + ((rewards as any).gold || 0),
                      experience: (c.experience || 0) + ((rewards as any).xp || 0),
                      completedCombats: Array.from(new Set([...(c.completedCombats || []), (rewards as any).combatId].filter(Boolean)))
                    } as Character;
                  }));

                  // Now call handleGameUpdate to record transaction and persist; mark as already applied locally
                  handleGameUpdate({
                  narrative: {
                    title: 'Victory!',
                    content: `You have emerged victorious from combat! Gained ${rewards.xp} experience${rewards.gold > 0 ? ` and ${rewards.gold} gold` : ''}. Loot has been collected.`
                  },
                    xpChange: rewards.xp,
                    goldChange: rewards.gold,
                    _alreadyAppliedLocally: true,
                  // newItems intentionally omitted - already applied via onInventoryUpdate to prevent duplication
                  transactionId: (rewards as any).transactionId,
                  characterUpdates: {
                    completedCombats: (rewards as any).combatId ? [(rewards as any).combatId] : []
                  },
                  vitalsChange: finalVitals ? {
                    currentHealth: finalVitals.health - (activeCharacter.currentVitals?.currentHealth ?? activeCharacter.stats.health),
                    currentMagicka: finalVitals.magicka - (activeCharacter.currentVitals?.currentMagicka ?? activeCharacter.stats.magicka),
                    currentStamina: finalVitals.stamina - (activeCharacter.currentVitals?.currentStamina ?? activeCharacter.stats.stamina)
                  } : undefined,
                  timeAdvanceMinutes: timeAdvanceMinutes ?? undefined
                });

                // Debug: after a short delay, print the in-memory character snapshot and recent ledger entries
                setTimeout(() => {
                  try {
                    const cid = currentCharacterId;
                    const after = (window as any).app?.characters?.find((c: any) => c.id === cid);
                    console.log('[App.onCombatEnd] Character after local-apply+handleGameUpdate:', cid, after && { experience: after.experience, gold: after.gold, pendingLevelUp: (window as any).app?.pendingLevelUp || null });
                    try {
                      const ledger = (window as any).getTransactionLedger && (window as any).getTransactionLedger();
                      if (ledger && typeof ledger.getRecentTransactions === 'function') {
                        console.log('[App.onCombatEnd] Ledger recent:', ledger.getRecentTransactions(10).map((t: any) => ({ id: t.transactionId || t.id, xp: t.xpAmount, gold: t.goldAmount, timestamp: t.timestamp })));
                      }
                    } catch (e) {}
                  } catch (e) {}
                }, 120);

                // Apply companion XP if provided
                if ((rewards as any).companionXp && Array.isArray((rewards as any).companionXp)) {
                  (rewards as any).companionXp.forEach((cp: any) => {
                    const found = companions.find(c => c.id === cp.companionId);
                    if (found) {
                      // Apply XP and level ups using helper
                      const updated = applyCompanionXp(found, cp.xp);
                      updateCompanion(updated);
                      showToast?.(`${found.name} gained ${cp.xp} XP and is now Lv ${updated.level}`, 'success');
                    }
                  });
                }

                // Telemetry: record reward application with identifiers
                try {
                  const telemetry = {
                    uid: currentUser?.uid || null,
                    charId: currentCharacterId || null,
                    combatId: (rewards as any).combatId || null,
                    transactionId: (rewards as any).transactionId || null,
                    gold: (rewards as any).gold || 0,
                    xp: (rewards as any).xp || 0,
                    timestamp: Date.now()
                  };
                  // Lightweight log for telemetry/debug (use promise-style import to avoid top-level await)
                  import('./services/logger').then(m => m.log.info('reward_applied', telemetry)).catch(() => {});
                } catch (e) {
                  console.warn('Failed to log reward telemetry:', e);
                }

                // Ensure the character is persisted immediately for critical combat rewards
                (async () => {
                  try {
                    if (!currentUser?.uid || !activeCharacter) return;

                    const uid = currentUser.uid;
                    // Construct minimal updated character snapshot to persist
                    const updatedChar = {
                      ...activeCharacter,
                      gold: (activeCharacter.gold || 0) + ((rewards as any).gold || 0),
                      experience: (activeCharacter.experience || 0) + ((rewards as any).xp || 0),
                      completedCombats: Array.from(new Set([...(activeCharacter.completedCombats || []), (rewards as any).combatId].filter(Boolean)))
                    } as Character;

                    // Use the retry/backoff helper to persist critical changes
                    const { saveCharacterWithRetry } = await import('./services/firestore');
                    await saveCharacterWithRetry(uid, updatedChar, { retries: 3, baseDelayMs: 500 });
                    (await import('./services/logger')).log.info('reward_persisted', { uid: currentUser.uid, charId: currentCharacterId, transactionId: (rewards as any).transactionId });
                  } catch (e) {
                    (await import('./services/logger')).log.error('reward_persist_error', { err: String(e), uid: currentUser?.uid, charId: currentCharacterId, transactionId: (rewards as any).transactionId });
                    // If save failed due to offline, ensure it's queued for sync
                    if (!navigator.onLine && currentUser?.uid && activeCharacter) {
                      queueOfflineChange({ type: 'character', action: 'save', data: { ...activeCharacter } });
                      (await import('./services/logger')).log.info('reward_queued_offline', { uid: currentUser.uid, charId: currentCharacterId });
                    }
                  }
                })();
              } else if (result === 'defeat') {
                handleGameUpdate({
                  narrative: {
                    title: 'Defeated...',
                    content: 'You have fallen in battle. The world grows dark as consciousness slips away...'
                  },
                  vitalsChange: {
                    currentHealth: -(activeCharacter.currentVitals?.currentHealth ?? activeCharacter.stats.health) + 1
                  }
                  ,
                  timeAdvanceMinutes: timeAdvanceMinutes ?? undefined
                });
              } else if (result === 'fled') {
                handleGameUpdate({
                  narrative: {
                    title: 'Escaped!',
                    content: 'You managed to escape from the battle, but the threat may still linger...'
                  },
                  vitalsChange: finalVitals ? {
                    currentHealth: finalVitals.health - (activeCharacter.currentVitals?.currentHealth ?? activeCharacter.stats.health),
                    currentMagicka: finalVitals.magicka - (activeCharacter.currentVitals?.currentMagicka ?? activeCharacter.stats.magicka),
                    currentStamina: finalVitals.stamina - (activeCharacter.currentVitals?.currentStamina ?? activeCharacter.stats.stamina)
                  } : undefined,
                  timeAdvanceMinutes: timeAdvanceMinutes ?? undefined
                });
              } else if (result === 'surrendered') {
                handleGameUpdate({
                  narrative: {
                    title: 'Surrender',
                    content: 'You lay down your weapons and surrender to your foes...'
                  },
                  vitalsChange: finalVitals ? {
                    currentHealth: finalVitals.health - (activeCharacter.currentVitals?.currentHealth ?? activeCharacter.stats.health),
                    currentMagicka: finalVitals.magicka - (activeCharacter.currentVitals?.currentMagicka ?? activeCharacter.stats.magicka),
                    currentStamina: finalVitals.stamina - (activeCharacter.currentVitals?.currentStamina ?? activeCharacter.stats.stamina)
                  } : undefined,
                  timeAdvanceMinutes: timeAdvanceMinutes ?? undefined
                });
              }

              // Emit a CombatResolved event (for subscribers wanting a deterministic signal)
              // Fire-and-forget dynamic import to emit CombatResolved without making onCombatEnd async
              import('./services/events')
                .then(m => {
                  try {
                    m.emitCombatResolved({ result, rewards, finalVitals, timeAdvanceMinutes, combatResult });
                  } catch (e) {
                    console.warn('Failed to emit CombatResolved event (subscriber error):', e);
                  }
                })
                .catch(e => {
                  console.warn('Failed to import Combat events module:', e);
                });

              // Automatically resume the adventure by asking the Game Master to continue
              (async () => {
                try {
                  const outcomeText = result === 'victory' ? 'You were victorious.' : result === 'defeat' ? 'You were defeated.' : result === 'fled' ? 'You fled the battle.' : result === 'surrendered' ? 'You surrendered.' : 'Combat ended.';
                  const playerInput = `Combat concluded. Outcome: ${outcomeText} Resume the adventure from here, branching the story appropriately for the outcome and present the next narrative and choices. NOTE: Combat rewards have already been applied (loot and XP). Do NOT re-award items, gold, or experience in your response; instead summarize rewards and continue the story.`;
                  // Build AI context and include combat outcome so model is explicitly aware of results
                  let aiContextObj: any = {};
                  try {
                    const ctx = getAIContext();
                    aiContextObj = ctx ? JSON.parse(ctx) : {};
                  } catch (e) {
                    aiContextObj = {};
                  }
                  // Prefer the full combatResult when available (stronger context)
                  if (combatResult) {
                    aiContextObj.combatResult = combatResult;
                  } else {
                    aiContextObj.combatOutcome = {
                      result,
                      rewards: rewards || null,
                      finalVitals: finalVitals || null,
                      timeAdvanceMinutes: timeAdvanceMinutes || null
                    };
                  }
                  const resp = await generateAdventureResponse(playerInput, JSON.stringify(aiContextObj), `Continue the adventure and branch according to combat outcome. Do not grant duplicate rewards.

GAMEPLAY ENFORCEMENT (CRITICAL):
- EVERY enemy in the combat MUST have an explicit end-state mentioned (dead, fled, surrendered, incapacitated)
- Do not imply any enemy outcome - state each one explicitly
- If combat result is victory, describe what happened to ALL enemies
- If combat result is defeat/fled/surrendered, describe the consequences
- Mechanical consistency over narrative flavor
- You are a game system that outputs narrative as a consequence of rules`);
                  // Apply generated updates to game state so the adventure continues
                  if (resp) handleGameUpdate(resp);
                } catch (e) {
                  console.error('Failed to auto-resume adventure after combat:', e);
                }
              })();
            }}
            onNarrativeUpdate={(narrative) => {
              console.log('[Combat Narrative]', narrative);
            }}
            onInventoryUpdate={(itemsOrRemoved) => {
              // itemsOrRemoved can be:
              //  - array of { id,... } = a full inventory snapshot (from finalizeLoot) or updated items (equips/unequips)
              //  - array of { name, quantity } = removed items
              if (Array.isArray(itemsOrRemoved) && itemsOrRemoved.length > 0 && (itemsOrRemoved[0] as any).id) {
                const arr = itemsOrRemoved as InventoryItem[];
                
                // Separate items into existing (update) and new (add)
                const existingIds = new Set(items.filter(it => it.characterId === currentCharacterId).map(it => it.id));
                const toUpdate: InventoryItem[] = [];
                const toAdd: InventoryItem[] = [];
                
                for (const item of arr) {
                  if (existingIds.has(item.id)) {
                    // This item already exists - only update if it actually changed
                    const existing = items.find(it => it.id === item.id);
                    if (existing) {
                      // Check if anything relevant changed (equipped, slot, quantity)
                      const hasChanged = 
                        existing.equipped !== item.equipped ||
                        existing.slot !== item.slot ||
                        existing.equippedBy !== item.equippedBy ||
                        existing.quantity !== item.quantity;
                      if (hasChanged) {
                        toUpdate.push(item);
                      }
                    }
                  } else {
                    // New item - add it
                    toAdd.push({ ...item, characterId: currentCharacterId || '' });
                  }
                }
                
                // Apply updates and additions
                if (toUpdate.length > 0) {
                  handleGameUpdate({ updatedItems: toUpdate } as any);
                }
                if (toAdd.length > 0) {
                  handleGameUpdate({ newItems: toAdd as any });
                }
              } else {
                handleGameUpdate({ removedItems: itemsOrRemoved as any });
              }
            }}
            showToast={showToast}
          />
        )}

        {/* Toast Notifications */}
        <ToastNotification messages={toastMessages} onClose={handleToastClose} />
        {/* Quest Notifications (Skyrim-style) */}
        <QuestNotificationOverlay notifications={questNotifications} onDismiss={handleQuestNotificationDismiss} />
        {/* Level Up Notifications (Skyrim-style) */}
        <LevelUpNotificationOverlay notifications={levelUpNotifications} onDismiss={handleLevelUpNotificationDismiss} />
        {/* Update Notification */}
        <UpdateNotification position="bottom" />

        {/* Changelog - subtle bottom left */}
        <Changelog />

        {/* Console Overlay */}
        <ConsoleOverlay
          isOpen={showConsole}
          onClose={() => setShowConsole(false)}
          onExecuteCommand={handleConsoleCommand}
        />

        {/* Global Weather Effect */}
        {weatherEffect !== 'none' && effectsEnabled && (
          <SnowEffect 
            settings={{ intensity: weatherIntensity, enableMouseInteraction: (userSettings?.weatherMouseInteractionEnabled ?? true) }} 
            theme={colorTheme} 
            weatherType={weatherEffect} 
          />
        )}

      </div>
    </AppContext.Provider>
  );
};

export default App;