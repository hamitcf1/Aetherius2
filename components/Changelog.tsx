/**
 * Changelog Component - Subtle, minimal changelog viewer
 * Accessed via a small icon, reveals version history
 */

import React, { useState, useEffect } from 'react';
import { ScrollText, X, Sparkles, Swords, Clock, Bug, Zap } from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: {
    type: 'feature' | 'improvement' | 'fix' | 'combat';
    text: string;
  }[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.0.8',
    date: '2026-01-28',
    title: 'Shop & Blacksmith UX Quality-of-life',
    changes: [
      { type: 'improvement', text: 'Blacksmith: added quick-buy for missing upgrade materials showing required quantity and total cost' },
      { type: 'improvement', text: 'Blacksmith: Confirm button now disables and clearly indicates when gold is insufficient' },
      { type: 'improvement', text: 'Shop: Buy list shows compact owned badge (icon + count) when player owns the item' },
      { type: 'improvement', text: 'Shop: Sell list now groups identical stacks and provides both "Sell 1" and "Sell All" actions' },
      { type: 'improvement', text: 'Shop: restored damage/armor/nutrition/potion indicators in Buy and Sell views and added category icon to Sell rows' },
      { type: 'improvement', text: 'Perk Tree: per-rank contribution displayed inline for perks across all categories; Expand/Collapse All controls added to Perk Tree modal' },
      { type: 'fix', text: 'Shop: removed duplicate footer item count and fixed Sell-all category summary' }
    ]
  },
  {
    version: '1.0.7',
    date: '2026-01-27',
    title: 'Combat UX: Learned Abilities Only',
    changes: [
      { type: 'fix', text: 'Combat: hide unlearned spells from ability lists — learned spell IDs now control which magical abilities appear' },
      { type: 'improvement', text: 'Combat: advanced One-Handed and Sneak abilities now require perk investment before appearing' },
      { type: 'improvement', text: 'UX: clarified buff/debuff naming to avoid placeholder labels in status effects' },
    ]
  },
  {
    version: '1.0.6',
    date: '2026-01-26',
    title: 'Combat: VFX & Tests',
    changes: [
      { type: 'combat', text: 'Combat: Restored healing and conjuration visual effects and screen flashes; spell visuals now anchor to their targets' },
      { type: 'improvement', text: 'Combat: Increased VFX z-index and standardized timing (ms helper) so effects render above modals and persist reliably' },
      { type: 'improvement', text: 'UX: Normalize incoming status effect names and icons (e.g., DOTs, generic "buff" names) for clearer buffs/debuffs display' },
      { type: 'fix', text: 'Tests: added unit tests for healing and conjuration visuals and improved test stability for spell effects' },
    ]
  },
  {
    version: '1.0.5',
    date: '2026-01-26',
    title: 'Hotfixes: Modals, Combat & Map Stability',
    changes: [
      { type: 'fix', text: 'Factions modal now uses the shared `ModalWrapper` — centers properly and gains consistent ESC/backdrop behavior' },
      { type: 'fix', text: 'Travel modal now uses the shared `ModalWrapper` and centers correctly' },
      { type: 'fix', text: 'Map: fixed crash when `discoveredLocations` contained legacy string entries — MapPage now accepts string or object entries' },
      { type: 'fix', text: 'Combat: Healing (bonus action) abilities correctly consume the Bonus Action to prevent infinite healing loops' },
      { type: 'fix', text: 'Accessibility: Blacksmith modal item rows no longer nest <button> elements (converted to accessible `div role="button"`), fixing hydration and nesting errors' },
      { type: 'improvement', text: 'Modal consistency: multiple modals (Travel, Factions, etc.) now share `ModalWrapper` for consistent overlay, z-index, and scroll-lock behavior' },
      { type: 'improvement', text: 'Tests: added unit test ensuring healing abilities consume bonus action; added robustness improvements for map-related tests' },
      { type: 'fix', text: 'Various small build/test cleanups and reliability fixes' },
    ]
  },
  {
    version: '1.0.4',
    date: '2026-01-19',
    title: 'Event Gameplay Integration - Real Consequences',
    changes: [
      { type: 'feature', text: 'Combat Events: Dragon, Bandit, Combat, Rescue, Escort events now trigger actual combat encounters' },
      { type: 'feature', text: 'Treasure Events: Now open lockpicking minigame with difficulty based on event tier' },
      { type: 'feature', text: 'Shrine Events: New Blessing Modal with 6 divine blessings that grant 8-hour status buffs' },
      { type: 'feature', text: 'Merchant Events: Now open traveling merchant shop for buying/selling' },
      { type: 'feature', text: 'Event Completion: Combat victory, lockpick success, or blessing received auto-completes events' },
      { type: 'improvement', text: 'Dungeon → Event Link: Clearing a dungeon completes any active events at that location' },
      { type: 'improvement', text: 'Quest → Event Link: AI-completed quests now also complete their associated events' },
      { type: 'improvement', text: 'Map Panel: Event type hints show what will happen when starting each event type' },
      { type: 'improvement', text: 'Manual Complete: Mystery/Investigation events can be marked complete from map panel' },
      { type: 'fix', text: 'Duplicate notifications: 2-second dedup window prevents rapid-fire notifications' },
      { type: 'fix', text: 'Auto-dismiss: Event notifications now auto-dismiss after 5 seconds' },
      { type: 'fix', text: 'Map performance: requestAnimationFrame throttling for smoother pan/zoom' },
    ]
  },
  {
    version: '1.0.3',
    date: '2025-01-27',
    title: 'Dynamic Events System - Level-Gated Adventures',
    changes: [
      { type: 'feature', text: 'Dynamic Events: New level-gated events unlock every 5 levels when current tier is completed' },
      { type: 'feature', text: 'Event Tiers: 6 tiers (1-5, 6-10, 11-15, 16-25, 26-35, 36+) with progressively challenging content' },
      { type: 'feature', text: 'Event Expiration: Events expire after 24 in-game hours - stay active in the world!' },
      { type: 'feature', text: 'Event Notifications: Skyrim-style notifications for new events, tier unlocks, and completions' },
      { type: 'feature', text: 'Chain System: Connected storylines where completing one event unlocks the next chapter' },
      { type: 'feature', text: 'Firebase Persistence: Events save to Firebase per-character and sync across devices' },
      { type: 'improvement', text: 'Map Page Events Tab: New dedicated panel showing active dynamic events with expiry timers' },
      { type: 'improvement', text: 'Event Types: Combat, treasure hunts, mysteries, merchants, shrines, dragons, and bandits' },
      { type: 'improvement', text: 'Tier Rewards: Higher tiers offer better gold, XP, and unique item rewards' },
    ]
  },
  {
    version: '1.0.2',
    date: '2026-01-19',
    title: 'Map Events & Mission Interactivity Improvements',
    changes: [
      { type: 'feature', text: 'Events: Dragon sightings and Bandit ambushes now open immediate combat instead of only creating quests' },
      { type: 'feature', text: 'Missions: Interactive missions can open dedicated systems (mini-game prototype for "Lost Artifact")' },
      { type: 'improvement', text: 'Map events now pass full objects to app handlers; clicking Investigate/Accept triggers proper game updates' },
      { type: 'feature', text: 'Mini-Game prototype: basic Minigame modal for interactive mission experiences (prototype for future Doom-like minigame)' },
      { type: 'improvement', text: 'Added map event handlers and tests to avoid regressions and to route event types to appropriate systems (combat/quest/minigame)' }
    ]
  },
  {
    version: '1.0.1',
    date: '2026-01-18',
    title: 'World Map Expansion - Full Map Page',
    changes: [
      { type: 'feature', text: 'Dedicated Map Tab: New full-page map experience accessible from main navigation' },
      { type: 'feature', text: 'Level-Gated Dungeons: 30+ dungeons with level requirements from 1-50' },
      { type: 'feature', text: 'Map Events: Dynamic events spawn on map (Dragon sightings, Bandit ambushes, Merchant caravans, Shrines)' },
      { type: 'feature', text: 'Mission System: Accept bounties and objectives with rewards from the map' },
      { type: 'feature', text: 'Danger Levels: New "Legendary" tier for endgame dungeons like Soul Cairn and Forgotten Vale' },
      { type: 'improvement', text: 'Map Side Panel: Legend, Location details, Events, and Missions in organized tabs' },
      { type: 'improvement', text: 'Reward Preview: See potential gold, XP, and item rewards before entering dungeons' },
      { type: 'improvement', text: 'Level Lock Indicator: Locked dungeons show required level and levels needed' },
      { type: 'improvement', text: 'Cleared Dungeon Counter: Track how many times you\'ve cleared each dungeon' },
    ]
  },
  {
    version: '1.0.0',
    date: '2026-01-15',
    title: '🎉 Official Release - Combat Overhaul & Economy Balance',
    changes: [
      { type: 'feature', text: 'AoE Physical Attacks: New Whirlwind Attack (75 stamina) and Cleaving Strike (85 stamina) hit multiple enemies based on roll' },
      { type: 'feature', text: 'Roll-Based AoE Targeting: Natural 1 misses, 2-4 hits 1 enemy, 5-9 hits 2, 10-14 hits 3, 15-19 hits 4, nat 20 hits ALL' },
      { type: 'feature', text: 'Ability Cooldown System: Powerful abilities now have cooldowns (1-4 turns) to prevent spam tactics' },
      { type: 'improvement', text: 'Economy Rebalance: Legendary/Epic item values capped at 25,000 gold, realistic stat scaling' },
      { type: 'improvement', text: 'Mobile Combat UI: Full ability access with Physical/Magical tabs, scrollable ability list' },
      { type: 'improvement', text: 'Performance: React.memo on HealthBar and ActionButton components to reduce re-renders' },
      { type: 'fix', text: 'Legendary weapons now deal 35-60 damage instead of unrealistic 9999 values' },
      { type: 'fix', text: 'Epic armor provides 38-95 armor instead of inflated 160-320 values' },
    ]
  },
  {
    version: '0.5.8',
    date: '2026-01-14',
    title: 'Major Bug Fixes & QoL Improvements',
    changes: [
      { type: 'fix', text: 'Perk Spending Bug: Fixed issue where spending multiple points on a perk only gave 1 rank' },
      { type: 'fix', text: 'Dungeon Rest Bug: Rest healing now properly caps at character max stats instead of 9999' },
      { type: 'fix', text: 'Dungeon Vitals: Dungeon now uses actual character HP/MP/SP instead of hardcoded 100' },
      { type: 'feature', text: 'Cleared Dungeon Tracking: Dungeons track clear count, re-entry scales enemies by 25% per clear' },
      { type: 'improvement', text: 'More Dungeon Locations: Added 8 new dungeon locations to map (Vampire Lair, Spider Den, etc.)' },
      { type: 'improvement', text: 'Settings Modal: AI model selector moved from Actions menu to Settings for cleaner UI' },
      { type: 'fix', text: 'Settings Modal ESC: Settings modal now closes with ESC key press' },
      { type: 'improvement', text: 'Empowered Spells: Empowered spell variants now show in spell list when base spell is learned' },
      { type: 'fix', text: 'Weather Physics: Mouse interaction for snow/rain particles now enabled by default' }
    ]
  },
  {
    version: '0.5.7',
    date: '2026-01-14',
    title: 'Dungeon Overhaul, Spell/Perk Refunds',
    changes: [
      { type: 'feature', text: 'Perk Refund: Added "Refund All" button to reset all perks and recover spent perk points' },
      { type: 'feature', text: 'Spell Refund: Added "Refund All" button to forget all spells and recover spent points' },
      { type: 'improvement', text: 'Spells Modal: Complete redesign with magic school categories (Destruction, Restoration, etc.) and two-panel layout' },
      { type: 'feature', text: 'Dungeon System: Complete overhaul with Slay the Spire style branching paths' },
      { type: 'improvement', text: 'Dungeon UI: New grid-based map with clear node types, connections, and path visualization' },
      { type: 'fix', text: 'Dungeon Rest: Resting now properly auto-advances to next node' },
      { type: 'improvement', text: 'Dungeon Events: Interactive event choices with clear outcome indicators' },
      { type: 'improvement', text: 'Dungeon Side Panel: Shows current location, selected node actions, and party status' }
    ]
  },
  {
    version: '0.5.6',
    date: '2026-01-14',
    title: 'UI/UX Polish, Sound Effects & Bug Fixes',
    changes: [
      { type: 'feature', text: 'Sound Effects: Added ambient and UI sounds — combat hits, magic, blocking, enemy death, level-up fanfare' },
      { type: 'feature', text: 'Level-Up Notification: Skyrim-style golden burst animation with skill point reminder' },
      { type: 'feature', text: 'Blacksmith Sparks: Particle effects when upgrading equipment at the forge' },
      { type: 'feature', text: 'Weather Mouse Interaction: Snow/rain particles now react to cursor movement' },
      { type: 'improvement', text: 'Perk Tree Modal: Completely redesigned with collapsible skill categories and two-panel layout' },
      { type: 'fix', text: 'Critical EXP Bug: Fixed issue where XP was not being awarded correctly after combat' },
      { type: 'fix', text: 'Combat Modal: Fixed "character is not defined" error in dungeon combat' },
      { type: 'fix', text: 'TypeScript: Resolved ~50 type errors across components and services' },
      { type: 'improvement', text: 'Console Demo: Enhanced help system with detailed command documentation' }
    ]
  },
  {
    version: '0.5.5',
    date: '2026-01-13',
    title: 'Perk Tree: Mastery & Cost Fixes',
    changes: [
      { type: 'fix', text: 'Perk Tree: Mastery purchases now cost perk points (`masteryCost` per perk) and are validated in the UI' },
      { type: 'fix', text: 'Perk Tree: Fixed bug where mastering a perk reset its rank to 0 — ranks are preserved and mastery increments properly' },
      { type: 'improvement', text: 'Perk Tree: Show staged rank cost and mastery cost, disable actions when insufficient points' },
      { type: 'fix', text: 'Perk Tree: Force-unlock now gives user feedback when insufficient points or unlock limit reached' }
    ]
  },
  {
    version: '0.5.4',
    date: '2026-01-13',
    title: 'Bonfire Menu Enhancements',
    changes: [
      { type: 'improvement', text: 'Bonfire Menu: Added tooltips to explain each equipment change before resting' },
      { type: 'improvement', text: 'Bonfire Menu: Improved layout and styling for better clarity on mobile devices' },
      { type: 'fix', text: 'Bonfire Menu: Resolved issue where certain equipment changes were not applying correctly after rest' },
      ]
  },
  {
    version: '0.5.3',
    date: '2026-01-12',
    title: 'Themes & Pointer improvements',
    changes: [
      { type: 'feature', text: 'Added Light and True Dark color themes to Theme Selector' },
      { type: 'improvement', text: 'Reverted to native system cursors for pointer and text input (no custom PNG cursors)' },
      { type: 'improvement', text: 'Theme persistence unchanged — themes saved per-user in localStorage' },
    ]
  },
  {
    version: '0.5.2',
    date: '2026-01-12',
    title: 'Bonfire (Rest) menu + rest handling fixes',
    changes: [
      { type: 'feature', text: 'Bonfire Menu: Prepare & Rest overlay — equipment staging, apply changes, and confirm rest' },
      { type: 'fix', text: 'AdventureChat: detect rest actions and open Bonfire preview instead of auto-applying; fixed try/catch flow' },
      { type: 'fix', text: 'BonfireMenu: fixed TypeScript typing (Map generics) to resolve compile errors' },
      { type: 'improvement', text: 'Bonfire accessible from Hero Menu and Adventure Chat; staged changes reversible until applied' },
      { type: 'fix', text: 'Build & lint cleanups following recent edits' },
    ]
  },
  {
    version: '0.5.1',
    date: '2026-01-12',
    title: 'Bug fixes, type-safety and responsive UI updates',
    changes: [
      { type: 'fix', text: 'Fixed TypeScript errors across multiple components and services (compile clean)' },
      { type: 'fix', text: 'Shop modal: added potion subtype compatibility to ShopItem' },
      { type: 'fix', text: 'Combat modal: removed stray/unused imports and cleaned up references' },
      { type: 'fix', text: 'Combat service: improved shield detection, added computeEnemyXP, and corrected enemy templates' },
      { type: 'improvement', text: 'Perk Tree and Blacksmith modals are now mobile responsive and stack on small screens' },
      { type: 'fix', text: 'Loot service: ensure generated rewards include descriptions to match combat state shapes' },
      { type: 'improvement', text: 'Updated cross-file types and helpers (App, AdventureChat, PerkTreeModal, lootService)' },
    ]
  },
  {
    version: '0.5.0',
    date: '2026-01-11',
    title: 'Game Features Expansion',
    changes: [
      { type: 'feature', text: 'Character Export/Import - Backup and restore characters with full game state' },
      { type: 'feature', text: 'Day/Night Visual Theme - Dynamic backgrounds based on in-game time' },
      { type: 'feature', text: 'Weather Effects System - Weather impacts survival needs and visibility' },
      { type: 'feature', text: 'Companion System - Recruit and manage NPC companions' },
      { type: 'feature', text: 'Undo/Redo Functionality - State management with history tracking' },
      { type: 'feature', text: 'Session History View - Track and review past gaming sessions' },
      { type: 'feature', text: 'Character Templates - Pre-built characters for quick start' },
      { type: 'feature', text: 'Custom Color Themes - Multiple visual themes (Dark Brotherhood, College, etc.)' },
      { type: 'feature', text: 'Difficulty Scaling - 6 difficulty levels from Novice to Legendary' },
      { type: 'feature', text: 'Status Effects Panel - Visual display of buffs, debuffs, and effects' },
      { type: 'improvement', text: 'Offline Mode Indicator - Shows queued changes when offline' },
      { type: 'improvement', text: 'AI Response Validation - Enhanced validation for game state updates' },
      { type: 'improvement', text: 'Rate Limiting UI - Visual progress bars for API usage limits' },
      { type: 'improvement', text: 'Weight/Encumbrance System - Carry weight limits and over-encumbered warnings' },
      { type: 'improvement', text: 'Auto-save Indicator - Real-time save status display' },
      { type: 'fix', text: 'Pokemon-style combat system now properly triggers from AI responses' },
      { type: 'fix', text: 'Story and Journal deletion now persists to database' },
    ]
  },
  {
    version: '0.4.0',
    date: '2026-01-10',
    title: 'Combat & Time Overhaul',
    changes: [
      { type: 'combat', text: 'Pokemon-style turn-based combat system with abilities, status effects, and enemy AI' },
      { type: 'combat', text: 'Dynamic enemy generation - each enemy is unique with randomized stats, abilities, and personalities' },
      { type: 'combat', text: 'New enemy types: Troll, Bear, Sabre Cat, Vampire, Hostile Mage' },
      { type: 'feature', text: 'In-game Skyrim calendar with Tamrielic day names and months' },
      { type: 'feature', text: 'Real-time time of day display in Adventure tab (Dawn/Morning/Noon/Evening/Night)' },
      { type: 'improvement', text: 'Realistic time flow - actions now take appropriate amounts of time' },
      { type: 'improvement', text: 'AI no longer repeats itself - better narrative continuity' },
      { type: 'feature', text: 'Changelog viewer (you\'re looking at it!)' },
    ]
  },
  {
    version: '0.3.5',
    date: '2026-01-09',
    title: 'AI Resilience Update',
    changes: [
      { type: 'improvement', text: 'Seamless AI model fallback system - automatically switches models on errors' },
      { type: 'improvement', text: 'Support for 3 API keys with rotation' },
      { type: 'fix', text: 'Better JSON parsing for Gemma model responses' },
      { type: 'improvement', text: 'Updated to latest Gemini/Gemma models' },
    ]
  },
  {
    version: '0.3.0',
    date: '2026-01-08',
    title: 'Simulation State System',
    changes: [
      { type: 'feature', text: 'NPC memory and relationship tracking' },
      { type: 'feature', text: 'Scene state machine for consistent encounters' },
      { type: 'feature', text: 'Player fact memory - NPCs remember what you tell them' },
      { type: 'improvement', text: 'Transaction ledger prevents double-charging' },
    ]
  },
  {
    version: '0.2.0',
    date: '2026-01-05',
    title: 'Survival & Immersion',
    changes: [
      { type: 'feature', text: 'Hunger, thirst, and fatigue survival system' },
      { type: 'feature', text: 'Ambient music system with context-aware tracks' },
      { type: 'feature', text: 'Equipment HUD showing equipped gear' },
      { type: 'improvement', text: 'Better item management and equipment slots' },
    ]
  },
  {
    version: '0.1.0',
    date: '2026-01-01',
    title: 'Initial Release',
    changes: [
      { type: 'feature', text: 'Character creation with Skyrim races and archetypes' },
      { type: 'feature', text: 'AI-powered text adventure gameplay' },
      { type: 'feature', text: 'Inventory, quest log, and journal systems' },
      { type: 'feature', text: 'Character persistence with cloud sync' },
    ]
  }
];

const getChangeIcon = (type: string) => {
  switch (type) {
    case 'feature': return <Sparkles size={12} className="text-green-400" />;
    case 'improvement': return <Zap size={12} className="text-blue-400" />;
    case 'fix': return <Bug size={12} className="text-orange-400" />;
    case 'combat': return <Swords size={12} className="text-red-400" />;
    default: return <Clock size={12} className="text-skyrim-text" />;
  }
};

const getChangeColor = (type: string) => {
  switch (type) {
    case 'feature': return 'border-green-900/50 bg-green-900/10';
    case 'improvement': return 'border-blue-900/50 bg-blue-900/10';
    case 'fix': return 'border-orange-900/50 bg-orange-900/10';
    case 'combat': return 'border-red-900/50 bg-red-900/10';
    default: return 'border-skyrim-border bg-gray-900/10';
  }
};

export const Changelog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const latestVersion = CHANGELOG[0]?.version || '0.0.0';

  // Persistent dismissal using localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('changelogDismissed');
    if (dismissed === 'true') setIsDismissed(true);
  }, []);
  useEffect(() => {
    if (isDismissed) localStorage.setItem('changelogDismissed', 'true');
  }, [isDismissed]);

  if (isDismissed) return null;

  return (
    <>
      {/* Subtle trigger button - bottom left corner */}
      <div className="fixed bottom-4 left-4 z-40 group flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 px-3 py-1.5 bg-skyrim-paper/60 hover:bg-skyrim-paper/80 border border-skyrim-border/50 hover:border-skyrim-gold/50 rounded-full transition-all duration-300 backdrop-blur-sm"
          title="View Changelog"
        >
          <ScrollText size={14} className="text-skyrim-text group-hover:text-skyrim-gold transition-colors" />
          <span className="text-[10px] text-skyrim-text group-hover:text-gray-300 font-mono transition-colors">
            v{latestVersion}
          </span>
        </button>
        {/* Persistent X button, only visible on hover */}
        <button
          onClick={() => setIsDismissed(true)}
          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-red-500/20"
          title="Dismiss changelog (don't show again)"
          style={{ pointerEvents: 'auto' }}
        >
          <X size={14} className="text-skyrim-text hover:text-red-400" />
        </button>
      </div>

      {/* Changelog Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-skyrim-dark/60 backdrop-lite animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg max-h-[80vh] bg-skyrim-paper border border-skyrim-border rounded-lg shadow-cheap overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-skyrim-paper px-6 py-4 border-b border-skyrim-gold/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-skyrim-gold/10 rounded-lg border border-skyrim-border">
                    <ScrollText size={20} className="text-skyrim-gold" />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif text-skyrim-gold">Changelog</h2>
                    <p className="text-xs text-gray-500">What's new in Aetherius</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setIsDismissed(true);
                    }}
                    className="px-3 py-1 text-xs text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    title="Hide changelog permanently"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-80px)] custom-scrollbar">
              <div className="space-y-6">
                {CHANGELOG.map((entry, idx) => (
                  <div key={entry.version} className="relative">
                    {/* Timeline connector */}
                    {idx < CHANGELOG.length - 1 && (
                      <div className="absolute left-[7px] top-8 bottom-0 w-px bg-gradient-to-b from-skyrim-gold/30 to-transparent" />
                    )}
                    
                    {/* Version header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${idx === 0 ? 'bg-skyrim-gold border-skyrim-gold' : 'bg-gray-800 border-skyrim-border'} flex-shrink-0 mt-1`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-mono text-sm ${idx === 0 ? 'text-skyrim-gold' : 'text-skyrim-text'}`}>
                            v{entry.version}
                          </span>
                          {idx === 0 && (
                            <span className="px-2 py-0.5 text-[10px] bg-skyrim-gold/20 text-skyrim-gold rounded-full border border-skyrim-border">
                              LATEST
                            </span>
                          )}
                          <span className="text-xs text-gray-600">{entry.date}</span>
                        </div>
                        <h3 className="text-sm font-medium text-gray-200 mt-0.5">{entry.title}</h3>
                      </div>
                    </div>

                    {/* Changes list */}
                    <div className="ml-7 space-y-1.5">
                      {entry.changes.map((change, changeIdx) => (
                        <div 
                          key={changeIdx}
                          className={`flex items-start gap-2 px-2.5 py-1.5 rounded border ${getChangeColor(change.type)}`}
                        >
                          <span className="mt-0.5 flex-shrink-0">{getChangeIcon(change.type)}</span>
                          <span className="text-xs text-gray-300 leading-relaxed">{change.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-skyrim-border/50 text-center">
                <p className="text-[10px] text-gray-600">
                  Made with ❤️ for Skyrim fans
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Changelog;
