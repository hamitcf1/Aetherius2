import React, { useState, useEffect, useCallback } from 'react';
import { 
    INITIAL_CHARACTER_TEMPLATE, Character, CustomQuest, JournalEntry, UserProfile, InventoryItem, StoryChapter, GameStateUpdate, GeneratedCharacterData, CombatState, CombatEnemy,
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
import { ConsoleOverlay } from './components/ConsoleOverlay';
import { Changelog } from './components/Changelog';
import UpdateNotification from './components/UpdateNotification';
import { ToastNotification } from './components/ToastNotification';
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
import { setCurrentUser as setFeatureFlagUser } from './featureFlags';
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
  saveJournalEntry,
  saveStoryChapter,
  saveUserProfile,
  deleteCharacter,
  batchSaveGameState,
  saveUserMetadata,
  removeDuplicateItems,
  deleteJournalEntry,
  deleteStoryChapter,
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
import { getItemStats, shouldHaveStats, isValidCoreItem } from './services/itemStats';
import { updateMusicForContext, AmbientContext, audioService, playMusic } from './services/audioService';
import { getSkyrimCalendarDate, formatSkyrimDate, formatSkyrimDateShort } from './utils/skyrimCalendar';
import { getRateLimitStats, generateAdventureResponse } from './services/geminiService';
import { learnSpell, getSpellById } from './services/spells';
import type { ShopItem } from './components/ShopModal';
import { getDefaultSlotForItem } from './components/EquipmentHUD';
import BonfireMenu from './components/BonfireMenu';
import type { RestOptions } from './components/SurvivalModals';
import { filterDuplicateTransactions } from './services/transactionLedger';
import type { PreferredAIModel } from './services/geminiService';
import type { UserSettings } from './services/firestore';
import LevelUpModal from './components/LevelUpModal';
import PerkTreeModal from './components/PerkTreeModal';
import PERK_DEFINITIONS from './data/perkDefinitions';

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
  if (!Number.isFinite(clean.quantity)) clean.quantity = 1;
  if (clean.quantity <= 0) clean.quantity = 1;

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
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [colorTheme, setColorTheme] = useState('default');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [restOpen, setRestOpen] = useState(false);
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
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only track if not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      setConsoleKeyBuffer(prev => {
        const newBuffer = (prev + key).slice(-7); // Keep last 7 characters
        if (newBuffer.includes('console')) {
          // Prevent the final keypress from being applied to the newly-focused console input
          try { e.preventDefault(); } catch (err) {}
          setShowConsole(true);
          return '';
        }
        return newBuffer;
      });
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  // Global Backquote / ~ key toggles the developer console (outside of text inputs)
  useEffect(() => {
    const handleBackquote = (e: KeyboardEvent) => {
      // Prefer code for layout independence, but also accept key values
      const isBackquote = e.code === 'Backquote' || e.key === '`' || e.key === '~';
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
    return () => window.removeEventListener('keydown', handleBackquote);
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
          const userItems = await loadInventoryItems(currentUser.uid);
          setItems(userItems);
          return userItems;
        }
      };

      console.log('🔧 Database utils available via window.aetheriusUtils');
      console.log('  - removeDuplicateItems() - removes items with duplicate names');
      console.log('  - reloadItems() - reloads inventory from database');
      console.log('🎮 Demo commands available via window.demo (see CONSOLE_COMMANDS.md)');
    }
  }, [currentUser?.uid, currentCharacterId]);

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
          const [userProfiles, userCharacters, userItems, userQuests, userEntries, userChapters, settings] = await Promise.all([
            loadUserProfiles(user.uid),
            loadCharacters(user.uid),
            loadInventoryItems(user.uid),
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
            setOnboardingOpen(isNewAccount && !localDone && !remoteDone);
          } catch {
            const remoteDone = settings?.onboardingCompleted === true;
            const isNewAccount = (userProfiles?.length || 0) === 0 && (userCharacters?.length || 0) === 0;
            setUserSettings(settings);
            setOnboardingOpen(isNewAccount && !remoteDone);
          }

          // Normalize older saves to include new survival/time fields
          const normalizedCharacters = (userCharacters || []).map((c: any) => {
            const time = c?.time && typeof c.time === 'object' ? c.time : INITIAL_CHARACTER_TEMPLATE.time;
            const needs = c?.needs && typeof c.needs === 'object' ? c.needs : INITIAL_CHARACTER_TEMPLATE.needs;
            const next: Character = {
              ...c,
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
            if (!c?.time || !c?.needs) {
              setDirtyEntities(prev => new Set([...prev, next.id]));
            }
            return next;
          });
          setCharacters(normalizedCharacters);
          setItems(userItems);
          setQuests(userQuests);
          setJournalEntries(userEntries);
          setStoryChapters(userChapters);
          
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
      
      // Clear current selection if deleted
      if (currentCharacterId === characterId) {
        setCurrentCharacterId(null);
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
      setCharacters(prev => prev.map(c => c.id === currentCharacterId ? { ...c, [field]: value } : c));
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
          handleGameUpdate({ removedItems: [{ name: item.name, quantity: 1 }] });
          showToast(`Cured diseases.`, 'success');
        } else if (name.includes('cure') && (name.includes('poison') || desc.includes('poison'))) {
          handleGameUpdate({ removedItems: [{ name: item.name, quantity: 1 }] });
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
          handleGameUpdate({ removedItems: [{ name: item.name, quantity: 1 }] });
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
          handleGameUpdate({ removedItems: [{ name: item.name, quantity: 1 }] });
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

    handleGameUpdate({
      goldChange: -totalCost,
      newItems: [{
        name: shopItem.name,
        type: shopItem.type,
        description: shopItem.description,
        quantity,
        // `value` and `slot` are intentionally cast to any to avoid strict GameStateUpdate shape
        ...( { value: shopItem.price, slot } as any ),
        ...stats  // Include armor/damage if applicable
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
  
  const setCharacterItems = (newCharItems: InventoryItem[]) => {
      const currentCharItems = items.filter((i: any) => i.characterId === currentCharacterId);
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
        setCharacters(prev => prev.map(c => {
          if (c.id !== currentCharacterId) return c;

          const currentTime = (c as any).time || INITIAL_CHARACTER_TEMPLATE.time;
          const currentNeeds = (c as any).needs || INITIAL_CHARACTER_TEMPLATE.needs;

          const nextTime = timeAdvance !== 0 ? addMinutesToTime(currentTime, timeAdvance) : currentTime;

          // Passive needs increase from time passing
          const hungerFromTime = calcNeedFromTime(timeAdvance, NEED_RATES.hungerPerMinute);
          const thirstFromTime = calcNeedFromTime(timeAdvance, NEED_RATES.thirstPerMinute);
          const fatigueFromTime = calcNeedFromTime(timeAdvance, NEED_RATES.fatiguePerMinute);

          const nextNeeds = {
            hunger: clamp(
              Number(currentNeeds.hunger || 0) + hungerFromTime + Number((explicitNeedsChange as any).hunger || 0),
              0,
              100
            ),
            thirst: clamp(
              Number(currentNeeds.thirst || 0) + thirstFromTime + Number((explicitNeedsChange as any).thirst || 0),
              0,
              100
            ),
            fatigue: clamp(
              Number(currentNeeds.fatigue || 0) + fatigueFromTime + Number((explicitNeedsChange as any).fatigue || 0),
              0,
              100
            ),
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

      // 2. New Quests
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
              createdAt: Date.now()
          }));
          setQuests(prev => [...prev, ...addedQuests]);
          addedQuests.forEach(quest => {
            setDirtyEntities(prev => new Set([...prev, quest.id]));
          });
      }

      // 3. Update Quests
      if (updates.updateQuests) {
          setQuests(prev => prev.map(q => {
              if (q.characterId !== currentCharacterId) return q;
              const update = updates.updateQuests?.find(u => u.title.toLowerCase() === q.title.toLowerCase());
              if (update) {
                  setDirtyEntities(prev => new Set([...prev, q.id]));
                  return { ...q, status: update.status };
              }
              return q;
          }));
      }

      // 4. New Items
      if (updates.newItems) {
           setItems(prev => {
             const next = [...prev];
             for (const i of updates.newItems || []) {
               const rawItem = sanitizeInventoryItem(i as Partial<InventoryItem>);
               const name = (rawItem.name || '').trim();
               if (!name) continue;

               const idx = next.findIndex(it =>
                 it.characterId === currentCharacterId &&
                 (it.name || '').trim().toLowerCase() === name.toLowerCase()
               );

               const addQty = Math.max(1, Number(rawItem.quantity || 1));

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
                   equipped: false,
                   armor: rawItem.armor,
                   damage: rawItem.damage,
                   value: rawItem.value,
                   slot: rawItem.slot,
                 }) as InventoryItem;
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

      // 5c. Combat Start - Initialize turn-based combat
      if (updates.combatStart && updates.combatStart.enemies?.length) {
        const combatData = updates.combatStart;
        const initializedCombat = initializeCombat(
          combatData.enemies as CombatEnemy[],
          combatData.location,
          combatData.ambush ?? false,
          combatData.fleeAllowed ?? true,
          combatData.surrenderAllowed ?? false
        );
        setCombatState(initializedCombat);
        
        // Switch to combat music
        updateMusicForContext({ inCombat: true, mood: 'tense' });
      }

      // 6. Gold
      if (typeof updates.goldChange === 'number' && updates.goldChange !== 0) {
         setCharacters(prev => prev.map(c => {
              if (c.id !== currentCharacterId) return c;
              setDirtyEntities(prev => new Set([...prev, c.id]));
              return { ...c, gold: (c.gold || 0) + (updates.goldChange || 0) };
         }));
      }

      // 6b. XP with Level-Up Check
      const XP_PER_LEVEL = 100;

      if (typeof updates.xpChange === 'number' && updates.xpChange !== 0) {
        // If a level-up is already pending, don't queue another until resolved
        if (!pendingLevelUp) {
          setCharacters(prev => prev.map(c => {
            if (c.id !== currentCharacterId) return c;
            setDirtyEntities(prev => new Set([...prev, c.id]));

            const newXP = (c.experience || 0) + (updates.xpChange || 0);
            const currentLevel = c.level || 1;
            const xpForNextLevel = currentLevel * XP_PER_LEVEL;

            // Check if we leveled up
            if (newXP >= xpForNextLevel) {
              const newLevel = currentLevel + 1;
              const remainingXP = newXP - xpForNextLevel;

              // Save pending level up to prompt user for choice
              setPendingLevelUp({
                charId: c.id,
                charName: c.name,
                newLevel,
                remainingXP,
                archetype: c.archetype,
                previousXP: c.experience || 0,
              });

              // Informally record XP gain but do not auto-apply level or stat bonuses
              setSaveMessage(`🎉 ${c.name} earned enough experience to level up — confirm to apply.`);
              setTimeout(() => setSaveMessage(null), 3500);

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
      setCurrentCharacterId
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
      const addedStats = { health: 0, magicka: 0, stamina: 0 };
      addedStats[choice] = 10;
      const updated = {
        ...c,
        level: p.newLevel,
        experience: p.remainingXP,
        stats: {
          health: (c.stats?.health || 100) + addedStats.health,
          magicka: (c.stats?.magicka || 100) + addedStats.magicka,
          stamina: (c.stats?.stamina || 100) + addedStats.stamina,
        },
        perkPoints: (c.perkPoints || 0) + 1,
      } as Character;
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
    setSaveMessage(`Level ${p.newLevel} applied.`);
    setTimeout(() => setSaveMessage(null), 2500);
  };

  const cancelLevelUp = () => {
    // Simply clear the pending prompt; XP remains as-is so player can choose later
    setPendingLevelUp(null);
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
        updatedStats = { ...updatedStats, [key]: (updatedStats as any)[key] + def.effect.amount };
      }

      let newPerks = (c.perks || []).slice();
      if (existing) {
        newPerks = newPerks.map(p => p.id === perkId ? { ...p, rank: (p.rank || 0) + 1 } : p);
      } else {
        newPerks.push({ id: def.id, name: def.name, skill: def.skill || '', rank: 1, mastery: 0, description: def.description });
      }
      pts = Math.max(0, pts - 1);
      setDirtyEntities(d => new Set([...d, c.id]));
      return { ...c, stats: updatedStats, perks: newPerks, perkPoints: pts } as Character;
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
          // only allow mastering when at max rank
          if (currRank >= max) {
            // increment mastery counter (no perk point cost)
            let found = false;
            for (let i = 0; i < nextPerks.length; i++) {
              if (nextPerks[i].id === baseId) {
                nextPerks[i] = { ...nextPerks[i], rank: 0, mastery: (nextPerks[i].mastery || 0) + wantCount };
                found = true;
                break;
              }
            }
            if (!found) {
              nextPerks.push({ id: def.id, name: def.name, skill: def.skill || '', rank: 0, mastery: wantCount, description: def.description });
            }
            // apply a small mastery bonus to stats
            if (def.effect && def.effect.type === 'stat') {
              const key = def.effect.key as keyof typeof updatedStats;
              const bonus = Math.ceil((def.effect.amount || 0) * 0.5 * (def.maxRank || 1)) * (wantCount || 1);
              updatedStats = { ...updatedStats, [key]: (updatedStats as any)[key] + bonus };
            }
          }
          continue;
        }
        if (pts <= 0) break;
        const def = PERK_DEFINITIONS.find(d => d.id === id);
        if (!def) continue;
        const max = def.maxRank || 1;
        const existing = nextPerks.find(p => p.id === id);
        let currRank = existing?.rank || 0;
        let applied = 0;
        while (applied < wantCount && pts > 0 && currRank < max) {
          // apply one rank
          if (def.effect && def.effect.type === 'stat') {
            const key = def.effect.key as keyof typeof updatedStats;
            updatedStats = { ...updatedStats, [key]: (updatedStats as any)[key] + def.effect.amount };
          }
          if (existing) {
            for (let i = 0; i < nextPerks.length; i++) {
              if (nextPerks[i].id === id) { nextPerks[i] = { ...nextPerks[i], rank: (nextPerks[i].rank || 0) + 1 }; break; }
            }
          } else {
            nextPerks.push({ id: def.id, name: def.name, skill: def.skill || '', rank: 1, mastery: 0, description: def.description });
          }
          currRank += 1;
          applied += 1;
          pts = Math.max(0, pts - 1);
        }
      }

      setDirtyEntities(d => new Set([...d, c.id]));
      return { ...c, stats: updatedStats, perks: nextPerks, perkPoints: pts } as Character;
    }));
  };

  // Force-unlock a locked perk by spending 3 perk points (limited uses per character)
  const forceUnlockPerk = (perkId: string) => {
    if (!currentCharacterId) return;
    setCharacters(prev => prev.map(c => {
      if (c.id !== currentCharacterId) return c;
      let pts = c.perkPoints || 0;
      let forced = c.forcedPerkUnlocks || 0;
      if (pts < 3) return c; // not enough points
      if (forced >= 3) return c; // reached forced-unlock limit
      const def = PERK_DEFINITIONS.find(d => d.id === perkId);
      if (!def) return c;
      const max = def.maxRank || 1;
      const existing = (c.perks || []).find(p => p.id === perkId);
      const currRank = existing?.rank || 0;
      if (currRank >= max) return c; // already maxed

      // Apply one rank regardless of prerequisites
      let updatedStats = { ...c.stats };
      if (def.effect && def.effect.type === 'stat') {
        const key = def.effect.key as keyof typeof updatedStats;
        updatedStats = { ...updatedStats, [key]: (updatedStats as any)[key] + def.effect.amount };
      }
      let newPerks = (c.perks || []).slice();
      if (existing) {
        newPerks = newPerks.map(p => p.id === perkId ? { ...p, rank: (p.rank || 0) + 1 } : p);
      } else {
        newPerks.push({ id: def.id, name: def.name, skill: def.skill || '', rank: 1, mastery: 0, description: def.description });
      }

      pts = Math.max(0, pts - 3);
      forced = forced + 1;
      setDirtyEntities(d => new Set([...d, c.id]));
      return { ...c, stats: updatedStats, perks: newPerks, perkPoints: pts, forcedPerkUnlocks: forced } as Character;
    }));
  };

  // Allow UI to request a manual level-up (e.g., '+' on hero page)
  const requestLevelUp = (char?: Character | null) => {
    if (!char) return;
    if (pendingLevelUp) {
      setSaveMessage('A level up is already awaiting confirmation.');
      setTimeout(() => setSaveMessage(null), 2000);
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
          />
          <OnboardingModal open={onboardingOpen} onComplete={completeOnboarding} />
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
      colorTheme,
      setColorTheme,
      showQuantityControls,
      setShowQuantityControls,
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
        
        <OnboardingModal open={onboardingOpen} onComplete={completeOnboarding} />
        {/* Navigation Header */}
        <nav className="fixed top-0 left-0 right-0 bg-skyrim-paper/95 backdrop-blur-md border-b border-skyrim-border z-40 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2 text-skyrim-gold font-serif font-bold text-xl tracking-widest uppercase cursor-pointer" onClick={() => setActiveTab(TABS.CHARACTER)}>
                <Skull size={24} />
                <span className="hidden md:inline">Skyrim Aetherius</span>
              </div>
              <div className="flex flex-nowrap items-center gap-1 sm:gap-2 relative overflow-hidden">
                {[
                        { id: TABS.CHARACTER, icon: User, label: 'Hero' },
                    { id: TABS.INVENTORY, icon: Package, label: 'Equipment' },
                    { id: TABS.ADVENTURE, icon: Swords, label: 'Adventure' },
                    { id: TABS.QUESTS, icon: Scroll, label: 'Quests' },
                    { id: TABS.STORY, icon: Feather, label: 'Story' },
                    { id: TABS.JOURNAL, icon: BookOpen, label: 'Journal' },
                ].map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded transition-all duration-300 text-sm md:text-base ${
                      activeTab === tab.id 
                          ? 'bg-skyrim-gold text-skyrim-dark font-bold' 
                          : 'text-skyrim-text hover:text-skyrim-gold hover:bg-white/5'
                      }`}
                  >
                      <tab.icon size={16} />
                      <span className="hidden md:inline">{tab.label}</span>
                  </button>
                ))}
                {/* Actions button inline with tabs */}
                <ActionBarToggle />
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
              <QuestLog quests={getCharacterQuests()} setQuests={setCharacterQuests} />
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

        {/* Combat Modal - Full screen overlay when combat is active */}
        {combatState && activeCharacter && (
            <CombatModal
            character={activeCharacter}
            inventory={getCharacterItems()}
            initialCombatState={combatState}
            onCombatEnd={(result, rewards, finalVitals, timeAdvanceMinutes, combatResult) => {
              setCombatState(null);
              updateMusicForContext({ inCombat: false, mood: result === 'victory' ? 'triumphant' : 'peaceful' });
              if (result === 'victory' && rewards) {
                handleGameUpdate({
                  narrative: {
                    title: 'Victory!',
                    content: `You have emerged victorious from combat! Gained ${rewards.xp} experience${rewards.gold > 0 ? ` and ${rewards.gold} gold` : ''}. Loot has been collected.`
                  },
                  xpChange: rewards.xp,
                  goldChange: rewards.gold,
                  newItems: rewards.items.length > 0 ? rewards.items : undefined,
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
                  const resp = await generateAdventureResponse(playerInput, JSON.stringify(aiContextObj), `Continue the adventure and branch according to combat outcome. Do not grant duplicate rewards.`);
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
              if (Array.isArray(itemsOrRemoved) && itemsOrRemoved.length > 0 && (itemsOrRemoved[0] as any).id) {
                // full inventory snapshot or new items
                handleGameUpdate({ newItems: itemsOrRemoved as any });
              } else {
                handleGameUpdate({ removedItems: itemsOrRemoved as any });
              }
            }}
            showToast={showToast}
          />
        )}

        {/* Toast Notifications */}
        <ToastNotification messages={toastMessages} onClose={handleToastClose} />
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

      </div>
    </AppContext.Provider>
  );
};

export default App;