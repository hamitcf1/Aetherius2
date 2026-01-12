/**
 * GameFeatures.tsx - Additional game features and systems
 * - Character Export/Import
 * - Day/Night Visual Theme
 * - Weather Effects
 * - Companion System
 * - Undo/Redo
 * - Session History
 * - Character Templates
 * - Custom Themes
 * - Difficulty Settings
 * - Status Effects Panel
 */

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Character, InventoryItem, CustomQuest, JournalEntry, StoryChapter, GameTime, SurvivalNeeds } from '../types';
import { PREFERRED_AI_MODELS, PreferredAIModel } from '../services/geminiService';
import { 
  Download, Upload, Sun, Moon, Cloud, CloudRain, CloudSnow, Wind,
  Undo2, Redo2, History, Users, Palette, Shield, Swords, Heart,
  Zap, Eye, Clock, Star, UserPlus, FileJson, Check, X, ChevronDown,
  Thermometer, Droplets, Moon as MoonIcon, Sunrise, Sunset, Cpu, ArrowUpDown
} from 'lucide-react';

// ============================================================================
// CHARACTER EXPORT/IMPORT
// ============================================================================

interface ExportData {
  version: string;
  exportedAt: string;
  character: Character;
  inventory: InventoryItem[];
  quests: CustomQuest[];
  journal: JournalEntry[];
  story: StoryChapter[];
}

export const exportCharacter = (
  character: Character,
  inventory: InventoryItem[],
  quests: CustomQuest[],
  journal: JournalEntry[],
  story: StoryChapter[]
): string => {
  const exportData: ExportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    character,
    inventory: inventory.filter(i => i.characterId === character.id),
    quests: quests.filter(q => q.characterId === character.id),
    journal: journal.filter(j => j.characterId === character.id),
    story: story.filter(s => s.characterId === character.id)
  };
  return JSON.stringify(exportData, null, 2);
};

// ============================================================================
// EASTER EGG UTILITIES
// ============================================================================

/**
 * Easter egg for characters named "hamit" - they get special display names
 */
export const getEasterEggName = (name: string): string => {
  if (name.toLowerCase() === 'hamit') {
    // Randomly select one of the easter egg names
    const easterEggNames = ['Hamilton', 'Hamurzon', 'Hamurhamur'];
    return easterEggNames[Math.floor(Math.random() * easterEggNames.length)];
  }
  return name;
};

export const downloadCharacterExport = (
  character: Character,
  inventory: InventoryItem[],
  quests: CustomQuest[],
  journal: JournalEntry[],
  story: StoryChapter[]
) => {
  const json = exportCharacter(character, inventory, quests, journal, story);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${character.name.replace(/[^a-z0-9]/gi, '_')}_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const validateImportData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.version) errors.push('Missing version');
  if (!data.character) errors.push('Missing character data');
  if (!data.character?.name) errors.push('Missing character name');
  if (!data.character?.race) errors.push('Missing character race');
  if (!Array.isArray(data.inventory)) errors.push('Invalid inventory data');
  if (!Array.isArray(data.quests)) errors.push('Invalid quests data');
  if (!Array.isArray(data.journal)) errors.push('Invalid journal data');
  if (!Array.isArray(data.story)) errors.push('Invalid story data');
  
  return { valid: errors.length === 0, errors };
};

interface CharacterExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  inventory: InventoryItem[];
  quests: CustomQuest[];
  journal: JournalEntry[];
  story: StoryChapter[];
}

export const CharacterExportModal: React.FC<CharacterExportModalProps> = ({
  isOpen,
  onClose,
  character,
  inventory,
  quests,
  journal,
  story
}) => {
  if (!isOpen) return null;

  const handleExport = () => {
    downloadCharacterExport(character, inventory, quests, journal, story);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-skyrim-dark/60 flex items-center justify-center z-50 p-4">
      <div className="bg-skyrim-paper border-2 border-skyrim-gold rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-serif text-skyrim-gold mb-4 flex items-center gap-2">
          <Download size={24} />
          Export Character
        </h2>
        
        <p className="text-skyrim-text mb-4">
          Export <strong className="text-skyrim-gold">{character.name}</strong> to a JSON file for backup or sharing.
        </p>
        
        <div className="bg-skyrim-paper/30 rounded p-3 mb-4 text-sm text-skyrim-text">
          <p>This will include:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Character stats and progression</li>
            <li>{inventory.filter(i => i.characterId === character.id).length} inventory items</li>
            <li>{quests.filter(q => q.characterId === character.id).length} quests</li>
            <li>{journal.filter(j => j.characterId === character.id).length} journal entries</li>
            <li>{story.filter(s => s.characterId === character.id).length} story chapters</li>
          </ul>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-2 bg-skyrim-gold text-skyrim-dark font-bold rounded hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Download JSON
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

interface CharacterImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ExportData) => void;
}

export const CharacterImportModal: React.FC<CharacterImportModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [importData, setImportData] = useState<ExportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const validation = validateImportData(data);
        
        if (!validation.valid) {
          setError(`Invalid file: ${validation.errors.join(', ')}`);
          setImportData(null);
          return;
        }
        
        setImportData(data);
        setError(null);
      } catch (e) {
        setError('Failed to parse JSON file');
        setImportData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (importData) {
      onImport(importData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-skyrim-dark/60 flex items-center justify-center z-50 p-4">
      <div className="bg-skyrim-paper border-2 border-skyrim-gold rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-serif text-skyrim-gold mb-4 flex items-center gap-2">
          <Upload size={24} />
          Import Character
        </h2>
        
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-8 border-2 border-dashed border-skyrim-border rounded-lg hover:border-skyrim-gold transition-colors text-skyrim-text hover:text-skyrim-gold mb-4"
        >
          <FileJson size={32} className="mx-auto mb-2" />
          Click to select a character file
        </button>
        
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded p-3 mb-4 text-red-300 text-sm">
            {error}
          </div>
        )}
        
        {importData && (
          <div className="bg-green-900/30 border border-green-700 rounded p-3 mb-4">
            <p className="text-green-300 font-bold flex items-center gap-2">
              <Check size={18} />
              Ready to import: {importData.character.name}
            </p>
            <p className="text-green-400/70 text-sm mt-1">
              Level {importData.character.level} {importData.character.race} {importData.character.archetype}
            </p>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={handleImport}
            disabled={!importData}
            className="flex-1 px-4 py-2 bg-skyrim-gold text-skyrim-dark font-bold rounded hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={18} />
            Import
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DAY/NIGHT VISUAL THEME
// ============================================================================

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export const getTimeOfDay = (hour: number): TimeOfDay => {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 18) return 'day';
  if (hour >= 18 && hour < 21) return 'dusk';
  return 'night';
};

export const getTimeThemeClasses = (timeOfDay: TimeOfDay): string => {
  switch (timeOfDay) {
    case 'dawn':
      return 'bg-gradient-to-b from-orange-900/20 via-amber-900/10 to-transparent';
    case 'day':
      return 'bg-gradient-to-b from-sky-900/10 via-transparent to-transparent';
    case 'dusk':
      return 'bg-gradient-to-b from-purple-900/20 via-orange-900/10 to-transparent';
    case 'night':
      return 'bg-gradient-to-b from-indigo-950/30 via-slate-900/20 to-transparent';
  }
};

export const TimeIcon: React.FC<{ hour: number; size?: number }> = ({ hour, size = 16 }) => {
  const time = getTimeOfDay(hour);
  switch (time) {
    case 'dawn': return <Sunrise size={size} className="text-orange-400" />;
    case 'day': return <Sun size={size} className="text-yellow-400" />;
    case 'dusk': return <Sunset size={size} className="text-purple-400" />;
    case 'night': return <MoonIcon size={size} className="text-blue-300" />;
  }
};

// ============================================================================
// WEATHER SYSTEM
// ============================================================================

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog' | 'storm';

export interface WeatherState {
  type: WeatherType;
  intensity: number; // 0-100
  temperature: number; // Celsius-ish
}

export const getWeatherEffects = (weather: WeatherState): {
  fatigueMultiplier: number;
  visibilityPenalty: number;
  description: string;
} => {
  switch (weather.type) {
    case 'clear':
      return { fatigueMultiplier: 1, visibilityPenalty: 0, description: 'Clear skies' };
    case 'cloudy':
      return { fatigueMultiplier: 1, visibilityPenalty: 0, description: 'Overcast' };
    case 'rain':
      return { 
        fatigueMultiplier: 1.2 + (weather.intensity / 200), 
        visibilityPenalty: weather.intensity / 5,
        description: weather.intensity > 70 ? 'Heavy rain' : 'Light rain'
      };
    case 'snow':
      return { 
        fatigueMultiplier: 1.3 + (weather.intensity / 150), 
        visibilityPenalty: weather.intensity / 4,
        description: weather.intensity > 70 ? 'Blizzard' : 'Snowfall'
      };
    case 'fog':
      return { 
        fatigueMultiplier: 1.1, 
        visibilityPenalty: weather.intensity / 2,
        description: weather.intensity > 70 ? 'Dense fog' : 'Light fog'
      };
    case 'storm':
      return { 
        fatigueMultiplier: 1.5, 
        visibilityPenalty: 40,
        description: 'Thunderstorm'
      };
    default:
      return { fatigueMultiplier: 1, visibilityPenalty: 0, description: 'Unknown' };
  }
};

export const WeatherIcon: React.FC<{ weather: WeatherType; size?: number }> = ({ weather, size = 16 }) => {
  switch (weather) {
    case 'clear': return <Sun size={size} className="text-yellow-400" />;
    case 'cloudy': return <Cloud size={size} className="text-skyrim-text" />;
    case 'rain': return <CloudRain size={size} className="text-blue-400" />;
    case 'snow': return <CloudSnow size={size} className="text-white" />;
    case 'fog': return <Wind size={size} className="text-gray-300" />;
    case 'storm': return <CloudRain size={size} className="text-purple-400" />;
  }
};

export const WeatherDisplay: React.FC<{ weather: WeatherState }> = ({ weather }) => {
  const effects = getWeatherEffects(weather);
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-skyrim-paper/30 rounded border border-skyrim-border text-sm">
      <WeatherIcon weather={weather.type} size={18} />
      <span className="text-skyrim-text">{effects.description}</span>
      <span className="text-skyrim-text">|</span>
      <Thermometer size={14} className="text-skyrim-text" />
      <span className="text-skyrim-text">{weather.temperature}°</span>
    </div>
  );
};

// ============================================================================
// COMPANION SYSTEM
// ============================================================================

export interface Companion {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  health: number;
  maxHealth: number;
  damage: number;
  armor: number;
  personality: string;
  recruitedAt: number;
  loyalty: number; // 0-100
  mood: 'happy' | 'neutral' | 'unhappy' | 'angry';
}

export const CompanionCard: React.FC<{
  companion: Companion;
  onDismiss?: () => void;
}> = ({ companion, onDismiss }) => {
  const healthPercent = (companion.health / companion.maxHealth) * 100;
  
  return (
    <div className="bg-skyrim-paper/80 border border-skyrim-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="font-serif text-skyrim-gold">{companion.name}</h4>
          <p className="text-xs text-skyrim-text">{companion.race} {companion.class} • Lv.{companion.level}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-500 hover:text-red-400 transition-colors"
            title="Dismiss companion"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Heart size={12} className="text-red-400" />
          <div className="flex-1 h-2 bg-skyrim-paper/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all"
              style={{ width: `${healthPercent}%` }}
            />
          </div>
          <span className="text-xs text-skyrim-text">{companion.health}/{companion.maxHealth}</span>
        </div>
        
        <div className="flex gap-4 text-xs text-skyrim-text">
          <span className="flex items-center gap-1">
            <Swords size={12} /> {companion.damage}
          </span>
          <span className="flex items-center gap-1">
            <Shield size={12} /> {companion.armor}
          </span>
          <span className="flex items-center gap-1">
            <Star size={12} className="text-yellow-400" /> {companion.loyalty}%
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// UNDO/REDO SYSTEM
// ============================================================================

export interface GameStateSnapshot {
  id: string;
  timestamp: number;
  description: string;
  character: Partial<Character>;
  inventory?: InventoryItem[];
  gold?: number;
}

export class UndoRedoManager {
  private history: GameStateSnapshot[] = [];
  private currentIndex: number = -1;
  private maxHistory: number = 50;

  push(snapshot: GameStateSnapshot) {
    // Remove any future states if we're not at the end
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }
    
    this.history.push(snapshot);
    
    // Trim history if too long
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  undo(): GameStateSnapshot | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  redo(): GameStateSnapshot | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getHistory(): GameStateSnapshot[] {
    return [...this.history];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }
}

export const UndoRedoControls: React.FC<{
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onShowHistory?: () => void;
}> = ({ canUndo, canRedo, onUndo, onRedo, onShowHistory }) => {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="p-2 text-skyrim-text hover:text-skyrim-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 size={18} />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="p-2 text-skyrim-text hover:text-skyrim-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 size={18} />
      </button>
      {onShowHistory && (
        <button
          onClick={onShowHistory}
          className="p-2 text-skyrim-text hover:text-skyrim-gold transition-colors"
          title="View history"
        >
          <History size={18} />
        </button>
      )}
    </div>
  );
};

// ============================================================================
// CHARACTER TEMPLATES
// ============================================================================

export interface CharacterTemplate {
  id: string;
  name: string;
  description: string;
  race: string;
  gender: string;
  archetype: string;
  stats: { health: number; magicka: number; stamina: number };
  skills: Array<{ name: string; level: number }>;
  startingItems: Array<{ name: string; type: string; description: string; quantity: number }>;
  backstory: string;
  identity: string;
  psychology: string;
}

export const CHARACTER_TEMPLATES: CharacterTemplate[] = [
  {
    id: 'warrior_nord',
    name: 'Nordic Warrior',
    description: 'A battle-hardened Nord warrior skilled in heavy weapons and armor.',
    race: 'Nord',
    gender: 'Male',
    archetype: 'Warrior',
    stats: { health: 130, magicka: 80, stamina: 120 },
    skills: [
      { name: 'Two-Handed', level: 35 },
      { name: 'Heavy Armor', level: 30 },
      { name: 'Block', level: 25 },
      { name: 'Smithing', level: 20 },
    ],
    startingItems: [
      { name: 'Iron Greatsword', type: 'weapon', description: 'A heavy two-handed blade', quantity: 1 },
      { name: 'Iron Armor', type: 'apparel', description: 'Sturdy iron plate', quantity: 1 },
      { name: 'Health Potion', type: 'potion', description: 'Restores 50 health', quantity: 3 },
    ],
    backstory: 'Born in the frozen wastes of Skyrim, trained from childhood in the ways of the warrior.',
    identity: 'A proud Nord who values honor and strength above all else.',
    psychology: 'Direct and confrontational, prefers action to words.',
  },
  {
    id: 'mage_altmer',
    name: 'High Elf Mage',
    description: 'An Altmer scholar versed in the arcane arts of destruction and conjuration.',
    race: 'Altmer (High Elf)',
    gender: 'Female',
    archetype: 'Mage',
    stats: { health: 90, magicka: 150, stamina: 90 },
    skills: [
      { name: 'Destruction', level: 35 },
      { name: 'Conjuration', level: 30 },
      { name: 'Enchanting', level: 25 },
      { name: 'Alteration', level: 20 },
    ],
    startingItems: [
      { name: 'Novice Robes', type: 'apparel', description: 'Simple mage robes', quantity: 1 },
      { name: 'Magicka Potion', type: 'potion', description: 'Restores 50 magicka', quantity: 5 },
      { name: 'Soul Gem (Petty)', type: 'misc', description: 'For enchanting', quantity: 3 },
    ],
    backstory: 'Trained at the College of Winterhold, seeking ancient knowledge across Skyrim.',
    identity: 'An intellectual who believes magic is the highest form of power.',
    psychology: 'Curious and analytical, sometimes arrogant about magical superiority.',
  },
  {
    id: 'thief_khajiit',
    name: 'Khajiit Shadowfoot',
    description: 'A stealthy Khajiit skilled in lockpicking, pickpocketing, and silent takedowns.',
    race: 'Khajiit',
    gender: 'Male',
    archetype: 'Thief',
    stats: { health: 100, magicka: 90, stamina: 140 },
    skills: [
      { name: 'Sneak', level: 35 },
      { name: 'Lockpicking', level: 30 },
      { name: 'Pickpocket', level: 25 },
      { name: 'Light Armor', level: 20 },
    ],
    startingItems: [
      { name: 'Leather Armor', type: 'apparel', description: 'Light and flexible', quantity: 1 },
      { name: 'Steel Dagger', type: 'weapon', description: 'Quick and silent', quantity: 1 },
      { name: 'Lockpick', type: 'misc', description: 'For opening locks', quantity: 15 },
    ],
    backstory: 'Grew up on the streets, learned to survive by taking what others leave unguarded.',
    identity: 'A pragmatic survivor who values freedom and coin.',
    psychology: 'Cautious and observant, prefers shadows to direct confrontation.',
  },
  {
    id: 'paladin_imperial',
    name: 'Imperial Paladin',
    description: 'A holy warrior wielding sword and restoration magic in service of the Divines.',
    race: 'Imperial',
    gender: 'Female',
    archetype: 'Paladin',
    stats: { health: 120, magicka: 100, stamina: 110 },
    skills: [
      { name: 'One-Handed', level: 30 },
      { name: 'Restoration', level: 30 },
      { name: 'Heavy Armor', level: 25 },
      { name: 'Block', level: 20 },
    ],
    startingItems: [
      { name: 'Steel Sword', type: 'weapon', description: 'Blessed blade', quantity: 1 },
      { name: 'Steel Shield', type: 'apparel', description: 'Marked with the symbol of the Divines', quantity: 1 },
      { name: 'Amulet of Mara', type: 'apparel', description: 'Symbol of the goddess', quantity: 1 },
    ],
    backstory: 'A former soldier who found faith after a near-death experience in battle.',
    identity: 'A defender of the innocent, sworn to protect the weak.',
    psychology: 'Compassionate but firm, struggles with the realities of violence.',
  },
  {
    id: 'assassin_dunmer',
    name: 'Dark Elf Assassin',
    description: 'A deadly Dunmer trained in the arts of stealth and elimination.',
    race: 'Dunmer (Dark Elf)',
    gender: 'Male',
    archetype: 'Assassin',
    stats: { health: 100, magicka: 110, stamina: 120 },
    skills: [
      { name: 'Sneak', level: 35 },
      { name: 'One-Handed', level: 30 },
      { name: 'Alchemy', level: 25 },
      { name: 'Illusion', level: 20 },
    ],
    startingItems: [
      { name: 'Shrouded Armor', type: 'apparel', description: 'Dark Brotherhood attire', quantity: 1 },
      { name: 'Ebony Dagger', type: 'weapon', description: 'Silent death', quantity: 1 },
      { name: 'Poison', type: 'potion', description: 'Deadly when applied to weapons', quantity: 5 },
    ],
    backstory: 'Trained by the Dark Brotherhood, now operating independently in Skyrim.',
    identity: 'Death is a profession, nothing personal.',
    psychology: 'Cold and calculating, but follows a strict personal code.',
  },
];

export const CharacterTemplateSelector: React.FC<{
  onSelect: (template: CharacterTemplate) => void;
  onClose: () => void;
}> = ({ onSelect, onClose }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = CHARACTER_TEMPLATES.find(t => t.id === selectedId);

  return (
    <div className="fixed inset-0 bg-skyrim-dark/60 flex items-center justify-center z-50 p-4">
      <div className="bg-skyrim-paper border-2 border-skyrim-gold rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-skyrim-border">
          <h2 className="text-2xl font-serif text-skyrim-gold flex items-center gap-2">
            <UserPlus size={24} />
            Character Templates
          </h2>
          <p className="text-skyrim-text text-sm mt-1">Choose a pre-built character to start your adventure</p>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CHARACTER_TEMPLATES.map(template => (
              <div
                key={template.id}
                onClick={() => setSelectedId(template.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedId === template.id
                    ? 'border-skyrim-gold bg-skyrim-gold/10'
                    : 'border-skyrim-border hover:border-skyrim-gold/50'
                }`}
              >
                <h3 className="font-serif text-skyrim-gold text-lg">{template.name}</h3>
                <p className="text-skyrim-text text-sm mb-2">{template.race} {template.archetype}</p>
                <p className="text-gray-300 text-sm">{template.description}</p>
                
                <div className="mt-3 flex gap-3 text-xs text-skyrim-text">
                  <span className="flex items-center gap-1">
                    <Heart size={12} className="text-red-400" /> {template.stats.health}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap size={12} className="text-blue-400" /> {template.stats.magicka}
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield size={12} className="text-green-400" /> {template.stats.stamina}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {selected && (
          <div className="p-4 border-t border-skyrim-border bg-skyrim-paper/20">
            <p className="text-gray-300 text-sm mb-3">{selected.backstory}</p>
            <div className="flex gap-3">
              <button
                onClick={() => onSelect(selected)}
                className="flex-1 px-4 py-2 bg-skyrim-gold text-skyrim-dark font-bold rounded hover:bg-yellow-500 transition-colors"
              >
                Use This Template
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// CUSTOM THEMES
// ============================================================================

export interface ColorTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    paper: string;
    text: string;
    gold: string;
    border: string;
  };
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'default',
    name: 'Skyrim Classic',
    colors: {
      primary: '#1a1a2e',
      secondary: '#16213e',
      background: '#0f0f1a',
      paper: '#1a1a2e',
      text: '#e0d5c7',
      gold: '#c0a062',
      border: '#3d3d5c',
    },
  },
  {
    id: 'dark_brotherhood',
    name: 'Dark Brotherhood',
    colors: {
      primary: '#1a0f0f',
      secondary: '#2d1515',
      background: '#0a0505',
      paper: '#1a0f0f',
      text: '#d4c4c4',
      gold: '#8b0000',
      border: '#4a2020',
    },
  },
  {
    id: 'college_winterhold',
    name: 'College of Winterhold',
    colors: {
      primary: '#0f1a2e',
      secondary: '#152840',
      background: '#050a14',
      paper: '#0f1a2e',
      text: '#c4d4e4',
      gold: '#4a90d9',
      border: '#2a4a6a',
    },
  },
  {
    id: 'thieves_guild',
    name: 'Thieves Guild',
    colors: {
      primary: '#1a1a0f',
      secondary: '#2d2d15',
      background: '#0a0a05',
      paper: '#1a1a0f',
      text: '#d4d4c4',
      gold: '#9a8a4a',
      border: '#4a4a20',
    },
  },
  {
    id: 'companions',
    name: 'The Companions',
    colors: {
      primary: '#1a1510',
      secondary: '#2d2520',
      background: '#0a0805',
      paper: '#1a1510',
      text: '#e4d4c4',
      gold: '#c49a5a',
      border: '#5a4a3a',
    },
  },
  {
    id: 'light',
    name: 'Light',
    colors: {
      primary: '#f0f1f3',
      secondary: '#e6e9ec',
      background: '#f7f8fa',
      paper: '#ffffff',
      text: '#111827',
      gold: '#8b5e34',
      border: '#e5e7eb',
    },
  },
  {
    id: 'true_dark',
    name: 'True Dark',
    colors: {
      primary: '#050505',
      secondary: '#0a0a0a',
      background: '#020202',
      paper: '#0b0b0b',
      text: '#e6e6e6',
      gold: '#c3a36b',
      border: '#2a2a2a',
    },
  }
];

export const ThemeSelector: React.FC<{
  currentTheme: string;
  onSelect: (themeId: string) => void;
}> = ({ currentTheme, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const current = COLOR_THEMES.find(t => t.id === currentTheme) || COLOR_THEMES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-skyrim-paper/30 border border-skyrim-border rounded hover:border-skyrim-gold transition-colors"
      >
        <Palette size={16} className="text-skyrim-gold" />
        <span className="text-sm text-skyrim-text">{current.name}</span>
        <ChevronDown size={14} className={`text-skyrim-text transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-skyrim-paper border border-skyrim-border rounded-lg shadow-xl z-50">
          {COLOR_THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => {
                onSelect(theme.id);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-skyrim-paper/30 transition-colors ${
                theme.id === currentTheme ? 'text-skyrim-gold' : 'text-skyrim-text'
              }`}
            >
              <div 
                className="w-4 h-4 rounded-full border border-skyrim-border/20"
                style={{ backgroundColor: theme.colors.gold }}
              />
              {theme.name}
              {theme.id === currentTheme && <Check size={14} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// AI MODEL SELECTOR
// ============================================================================

export const AIModelSelector: React.FC<{
  currentModel: string;
  onSelect: (modelId: string) => void;
}> = ({ currentModel, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const current = PREFERRED_AI_MODELS.find(m => m.id === currentModel) || PREFERRED_AI_MODELS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-skyrim-paper/30 border border-skyrim-border rounded hover:border-skyrim-gold transition-colors"
      >
        <Cpu size={16} className="text-skyrim-gold" />
        <span className="text-sm text-skyrim-text">{current.label}</span>
        <ChevronDown size={14} className={`text-skyrim-text transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-skyrim-paper border border-skyrim-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {PREFERRED_AI_MODELS.map(model => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model.id);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-skyrim-paper/30 transition-colors ${
                model.id === currentModel ? 'text-skyrim-gold' : 'text-skyrim-text'
              }`}
            >
              <div className="w-4 h-4 rounded-full border border-skyrim-border/20 bg-gradient-to-r from-blue-500 to-purple-500" />
              {model.label}
              {model.id === currentModel && <Check size={14} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SORT SELECTOR
// ============================================================================

export const SortSelector: React.FC<{
  currentSort: string;
  onSelect: (sort: string) => void;
  options: Array<{ id: string; label: string; icon?: string }>;
  label?: string;
}> = ({ currentSort, onSelect, options, label = 'Sort' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const current = options.find(o => o.id === currentSort) || options[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-skyrim-paper/30 border border-skyrim-border rounded hover:border-skyrim-gold transition-colors"
      >
        <ArrowUpDown size={16} className="text-skyrim-gold" />
        <span className="text-sm text-skyrim-text">{current.label}</span>
        <ChevronDown size={14} className={`text-skyrim-text transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-skyrim-paper border border-skyrim-border rounded-lg shadow-xl z-50">
          {options.map(option => (
            <button
              key={option.id}
              onClick={() => {
                onSelect(option.id);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-skyrim-paper/30 transition-colors ${
                option.id === currentSort ? 'text-skyrim-gold' : 'text-skyrim-text'
              }`}
            >
              {option.icon && <span className="text-xs">{option.icon}</span>}
              {option.label}
              {option.id === currentSort && <Check size={14} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// GENERIC DROPDOWN SELECTOR
// ============================================================================

export const DropdownSelector: React.FC<{
  currentValue: string;
  onSelect: (value: string) => void;
  options: Array<{ id: string; label: string; icon?: string }>;
  placeholder?: string;
  icon?: React.ReactNode;
}> = ({ currentValue, onSelect, options, placeholder = "Select...", icon }) => {
  const [isOpen, setIsOpen] = useState(false);

  const current = options.find(o => o.id === currentValue);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-skyrim-paper/40 border border-skyrim-border rounded text-skyrim-text focus:outline-none focus:border-skyrim-gold transition-colors"
      >
        {icon && <span className="text-skyrim-gold">{icon}</span>}
        <span className="flex-1 text-left">{current?.label || placeholder}</span>
        <ChevronDown size={14} className={`text-skyrim-text transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-skyrim-paper border border-skyrim-border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {options.map(option => (
            <button
              key={option.id}
              onClick={() => {
                onSelect(option.id);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-skyrim-paper/30 transition-colors ${
                option.id === currentValue ? 'text-skyrim-gold' : 'text-skyrim-text'
              }`}
            >
              {option.icon && <span className="text-xs">{option.icon}</span>}
              {option.label}
              {option.id === currentValue && <Check size={14} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DIFFICULTY SYSTEM
// ============================================================================

export type DifficultyLevel = 'novice' | 'apprentice' | 'adept' | 'expert' | 'master' | 'legendary';

export interface DifficultySettings {
  level: DifficultyLevel;
  playerDamageMultiplier: number;
  enemyDamageMultiplier: number;
  xpMultiplier: number;
  survivalDrain: number; // Multiplier for hunger/thirst/fatigue drain
}

export const DIFFICULTY_PRESETS: Record<DifficultyLevel, DifficultySettings> = {
  novice: {
    level: 'novice',
    playerDamageMultiplier: 2.0,
    enemyDamageMultiplier: 0.5,
    xpMultiplier: 0.75,
    survivalDrain: 0.5,
  },
  apprentice: {
    level: 'apprentice',
    playerDamageMultiplier: 1.5,
    enemyDamageMultiplier: 0.75,
    xpMultiplier: 0.9,
    survivalDrain: 0.75,
  },
  adept: {
    level: 'adept',
    playerDamageMultiplier: 1.0,
    enemyDamageMultiplier: 1.0,
    xpMultiplier: 1.0,
    survivalDrain: 1.0,
  },
  expert: {
    level: 'expert',
    playerDamageMultiplier: 0.75,
    enemyDamageMultiplier: 1.5,
    xpMultiplier: 1.25,
    survivalDrain: 1.25,
  },
  master: {
    level: 'master',
    playerDamageMultiplier: 0.5,
    enemyDamageMultiplier: 2.0,
    xpMultiplier: 1.5,
    survivalDrain: 1.5,
  },
  legendary: {
    level: 'legendary',
    playerDamageMultiplier: 0.25,
    enemyDamageMultiplier: 3.0,
    xpMultiplier: 2.0,
    survivalDrain: 2.0,
  },
};

export const DifficultySelector: React.FC<{
  current: DifficultyLevel;
  onChange: (level: DifficultyLevel) => void;
}> = ({ current, onChange }) => {
  const levels: DifficultyLevel[] = ['novice', 'apprentice', 'adept', 'expert', 'master', 'legendary'];
  
  return (
    <div className="space-y-2">
      <label className="text-sm text-skyrim-text">Difficulty</label>
      <div className="flex flex-wrap gap-2">
        {levels.map(level => {
          const preset = DIFFICULTY_PRESETS[level];
          return (
            <button
              key={level}
              onClick={() => onChange(level)}
              className={`px-3 py-1.5 text-sm rounded capitalize transition-colors ${
                current === level
                  ? 'bg-skyrim-gold text-skyrim-dark font-bold'
                  : 'bg-skyrim-paper/30 text-skyrim-text hover:text-skyrim-gold border border-skyrim-border'
              }`}
            >
              {level}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500">
        {current === 'novice' && 'Relaxed experience for enjoying the story'}
        {current === 'apprentice' && 'Easier combat with reduced survival pressure'}
        {current === 'adept' && 'Balanced challenge (default)'}
        {current === 'expert' && 'Challenging combat, increased survival needs'}
        {current === 'master' && 'Very difficult, for experienced players'}
        {current === 'legendary' && 'Brutal difficulty, death is common'}
      </p>
    </div>
  );
};

// ============================================================================
// STATUS EFFECTS PANEL
// ============================================================================

export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff' | 'neutral';
  icon: string;
  duration?: number; // turns or minutes remaining
  description: string;
  effects: {
    stat: string;
    modifier: number;
  }[];
}

export const StatusEffectsPanel: React.FC<{
  effects: StatusEffect[];
  compact?: boolean;
}> = ({ effects, compact = false }) => {
  if (effects.length === 0) return null;

  const getEffectColor = (type: StatusEffect['type']) => {
    switch (type) {
      case 'buff': return 'text-green-400 border-green-600 bg-green-900/30';
      case 'debuff': return 'text-red-400 border-red-600 bg-red-900/30';
      default: return 'text-skyrim-text border-skyrim-border bg-skyrim-paper/30';
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {effects.map(effect => (
          <div
            key={effect.id}
            className={`px-2 py-0.5 rounded text-xs border ${getEffectColor(effect.type)}`}
            title={`${effect.name}: ${effect.description}`}
          >
            {effect.icon} {effect.name}
            {effect.duration && <span className="ml-1 opacity-70">({effect.duration})</span>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
        <Eye size={14} />
        Active Effects
      </h4>
      <div className="space-y-1">
        {effects.map(effect => (
          <div
            key={effect.id}
            className={`px-3 py-2 rounded border ${getEffectColor(effect.type)}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {effect.icon} {effect.name}
              </span>
              {effect.duration && (
                <span className="text-xs opacity-70">
                  <Clock size={10} className="inline mr-1" />
                  {effect.duration}
                </span>
              )}
            </div>
            <p className="text-xs opacity-80 mt-1">{effect.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// SESSION HISTORY
// ============================================================================

export interface SessionRecord {
  id: string;
  characterId: string;
  startTime: number;
  endTime?: number;
  duration: number; // minutes
  messageCount: number;
  summary: string;
  highlights: string[];
}

export const SessionHistoryPanel: React.FC<{
  sessions: SessionRecord[];
  onLoadSession?: (sessionId: string) => void;
}> = ({ sessions, onLoadSession }) => {
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-serif text-skyrim-gold flex items-center gap-2">
        <History size={20} />
        Session History
      </h3>
      
      {sessions.length === 0 ? (
        <p className="text-gray-500 text-sm">No previous sessions found.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sessions.map(session => (
            <div
              key={session.id}
              className="p-3 bg-skyrim-paper/30 rounded border border-skyrim-border hover:border-skyrim-gold/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-skyrim-text">{formatDate(session.startTime)}</span>
                <span className="text-xs text-gray-500">
                  {formatDuration(session.duration)} • {session.messageCount} messages
                </span>
              </div>
              <p className="text-gray-300 text-sm">{session.summary}</p>
              {session.highlights.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {session.highlights.map((h, i) => (
                    <span key={i} className="px-2 py-0.5 bg-skyrim-gold/20 text-skyrim-gold text-xs rounded">
                      {h}
                    </span>
                  ))}
                </div>
              )}
              {onLoadSession && (
                <button
                  onClick={() => onLoadSession(session.id)}
                  className="mt-2 text-xs text-skyrim-gold hover:underline"
                >
                  Load this session
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
