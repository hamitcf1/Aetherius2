import { Character, InventoryItem } from '../types';

// Achievement categories
export type AchievementCategory = 
  | 'combat' 
  | 'exploration' 
  | 'crafting' 
  | 'social' 
  | 'survival' 
  | 'magic' 
  | 'stealth'
  | 'progression'
  | 'collection'
  | 'special';

// Achievement rarity determines reward quality
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Reward types
export interface AchievementReward {
  gold?: number;
  xp?: number;
  item?: { name: string; type: string; rarity?: string };
  perkPoint?: number;
  title?: string; // Unlockable title
}

// Achievement definition
export interface Achievement {
  id: string;
  name: string;
  description: string;
  // Optional longer description that explains tracking, scope, and edge cases
  longDescription?: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string; // Emoji or icon identifier
  requirement: AchievementRequirement;
  reward: AchievementReward;
  hidden?: boolean; // Secret achievements
  prerequisite?: string; // ID of achievement that must be completed first
}

// Different requirement types
export type AchievementRequirement = 
  | { type: 'combat_wins'; count: number }
  | { type: 'enemy_kills'; count: number; enemyType?: string }
  | { type: 'boss_kills'; count: number }
  | { type: 'dungeon_clears'; count: number }
  | { type: 'level_reached'; level: number }
  | { type: 'gold_earned'; amount: number }
  | { type: 'gold_spent'; amount: number }
  | { type: 'items_collected'; count: number; itemType?: string }
  | { type: 'items_crafted'; count: number }
  | { type: 'items_upgraded'; count: number }
  | { type: 'spells_cast'; count: number; school?: string }
  | { type: 'damage_dealt'; amount: number }
  | { type: 'damage_taken'; amount: number }
  | { type: 'healing_done'; amount: number }
  | { type: 'critical_hits'; count: number }
  | { type: 'dodges'; count: number }
  | { type: 'blocks'; count: number }
  | { type: 'deaths'; count: number }
  | { type: 'play_time'; minutes: number }
  | { type: 'quests_completed'; count: number }
  | { type: 'locations_discovered'; count: number }
  | { type: 'npcs_met'; count: number }
  | { type: 'companions_recruited'; count: number }
  | { type: 'perks_unlocked'; count: number }
  | { type: 'skills_mastered'; count: number; minLevel?: number }
  | { type: 'survival_days'; days: number }
  | { type: 'potions_consumed'; count: number }
  | { type: 'food_consumed'; count: number }
  | { type: 'rested_times'; count: number }
  | { type: 'lockpicks_succeeded'; count: number }
  | { type: 'pickpocket_succeeded'; count: number }
  | { type: 'sneak_attacks'; count: number }
  | { type: 'specific_item'; itemId: string }
  | { type: 'specific_enemy'; enemyId: string }
  | { type: 'specific_location'; locationId: string }
  | { type: 'specific_quest'; questId: string }
  | { type: 'combo'; requirements: AchievementRequirement[] }
  | { type: 'custom'; check: (stats: AchievementStats, character: Character) => boolean };

// Player achievement stats (tracked data)
export interface AchievementStats {
  combatWins: number;
  enemyKills: Record<string, number>; // keyed by enemy type
  totalEnemyKills: number;
  bossKills: number;
  dungeonClears: number;
  goldEarned: number;
  goldSpent: number;
  itemsCollected: number;
  itemsCrafted: number;
  itemsUpgraded: number;
  spellsCast: Record<string, number>; // keyed by school
  totalSpellsCast: number;
  damageDealt: number;
  damageTaken: number;
  healingDone: number;
  criticalHits: number;
  dodges: number;
  blocks: number;
  deaths: number;
  playTimeMinutes: number;
  questsCompleted: number;
  locationsDiscovered: string[];
  npcsMet: string[];
  companionsRecruited: string[];
  perksUnlocked: number;
  skillLevels: Record<string, number>;
  survivalDays: number;
  potionsConsumed: number;
  foodConsumed: number;
  restedTimes: number;
  lockpicksSucceeded: number;
  pickpocketSucceeded: number;
  sneakAttacks: number;
  specificItems: string[];
  specificEnemies: string[];
  specificLocations: string[];
  specificQuests: string[];
}

// Player achievement state
export interface AchievementState {
  unlockedAchievements: Record<string, { unlockedAt: number; collected: boolean }>;
  notifiedAchievements: Set<string>; // Achievement IDs that have already been notified
  stats: AchievementStats;
}

// Default stats
export const getDefaultAchievementStats = (): AchievementStats => ({
  combatWins: 0,
  enemyKills: {},
  totalEnemyKills: 0,
  bossKills: 0,
  dungeonClears: 0,
  goldEarned: 0,
  goldSpent: 0,
  itemsCollected: 0,
  itemsCrafted: 0,
  itemsUpgraded: 0,
  spellsCast: {},
  totalSpellsCast: 0,
  damageDealt: 0,
  damageTaken: 0,
  healingDone: 0,
  criticalHits: 0,
  dodges: 0,
  blocks: 0,
  deaths: 0,
  playTimeMinutes: 0,
  questsCompleted: 0,
  locationsDiscovered: [],
  npcsMet: [],
  companionsRecruited: [],
  perksUnlocked: 0,
  skillLevels: {},
  survivalDays: 0,
  potionsConsumed: 0,
  foodConsumed: 0,
  restedTimes: 0,
  lockpicksSucceeded: 0,
  pickpocketSucceeded: 0,
  sneakAttacks: 0,
  specificItems: [],
  specificEnemies: [],
  specificLocations: [],
  specificQuests: [],
});

// =============================================================================
// ACHIEVEMENT DEFINITIONS (100+)
// =============================================================================

export const ACHIEVEMENTS: Achievement[] = [
  // ===== PROGRESSION (20) =====
  { id: 'first_steps', name: 'First Steps', description: 'Reach level 5', longDescription: 'Tracked per-character: your character must reach level 5 to unlock this. If you are already past level 5, it will be auto-unlocked on next achievements refresh (load or stat change).', category: 'progression', rarity: 'common', icon: '👶', requirement: { type: 'level_reached', level: 5 }, reward: { gold: 50, xp: 100 } },
  { id: 'apprentice', name: 'Apprentice', description: 'Reach level 10', category: 'progression', rarity: 'common', icon: '📚', requirement: { type: 'level_reached', level: 10 }, reward: { gold: 100, xp: 200 } },
  { id: 'journeyman', name: 'Journeyman', description: 'Reach level 20', category: 'progression', rarity: 'uncommon', icon: '🎒', requirement: { type: 'level_reached', level: 20 }, reward: { gold: 250, xp: 500 } },
  { id: 'expert', name: 'Expert', description: 'Reach level 30', category: 'progression', rarity: 'rare', icon: '⭐', requirement: { type: 'level_reached', level: 30 }, reward: { gold: 500, xp: 1000 } },
  { id: 'master', name: 'Master', description: 'Reach level 40', category: 'progression', rarity: 'epic', icon: '🏆', requirement: { type: 'level_reached', level: 40 }, reward: { gold: 1000, xp: 2000, perkPoint: 1 } },
  { id: 'legendary_hero', name: 'Legendary Hero', description: 'Reach level 50', category: 'progression', rarity: 'legendary', icon: '👑', requirement: { type: 'level_reached', level: 50 }, reward: { gold: 2500, xp: 5000, perkPoint: 2, title: 'Legendary Hero' } },
  { id: 'perk_novice', name: 'Perk Novice', description: 'Unlock 5 perks', category: 'progression', rarity: 'common', icon: '🔓', requirement: { type: 'perks_unlocked', count: 5 }, reward: { gold: 50, xp: 100 } },
  { id: 'perk_collector', name: 'Perk Collector', description: 'Unlock 15 perks', category: 'progression', rarity: 'uncommon', icon: '🗝️', requirement: { type: 'perks_unlocked', count: 15 }, reward: { gold: 150, xp: 300 } },
  { id: 'perk_master', name: 'Perk Master', description: 'Unlock 30 perks', category: 'progression', rarity: 'rare', icon: '🎯', requirement: { type: 'perks_unlocked', count: 30 }, reward: { gold: 500, xp: 800 } },
  { id: 'skill_apprentice', name: 'Skill Apprentice', description: 'Reach level 50 in any skill', category: 'progression', rarity: 'uncommon', icon: '📖', requirement: { type: 'skills_mastered', count: 1, minLevel: 50 }, reward: { gold: 100, xp: 250 } },
  { id: 'skill_expert', name: 'Skill Expert', description: 'Reach level 75 in any skill', category: 'progression', rarity: 'rare', icon: '📕', requirement: { type: 'skills_mastered', count: 1, minLevel: 75 }, reward: { gold: 300, xp: 600 } },
  { id: 'skill_master', name: 'Skill Master', description: 'Reach level 100 in any skill', category: 'progression', rarity: 'epic', icon: '📗', requirement: { type: 'skills_mastered', count: 1, minLevel: 100 }, reward: { gold: 750, xp: 1500, title: 'Skill Master' } },
  { id: 'jack_of_trades', name: 'Jack of All Trades', description: 'Reach level 25 in 5 different skills', category: 'progression', rarity: 'rare', icon: '🃏', requirement: { type: 'skills_mastered', count: 5, minLevel: 25 }, reward: { gold: 400, xp: 800 } },
  { id: 'quest_starter', name: 'Quest Starter', description: 'Complete 5 quests', longDescription: 'Counts quests completed by this character and increments when a quest is marked completed. If you completed quests before achievements were added, run "Refresh Achievements" or reload to evaluate progress.', category: 'progression', rarity: 'common', icon: '📜', requirement: { type: 'quests_completed', count: 5 }, reward: { gold: 75, xp: 150 } },

  { id: 'journeyman', name: 'Journeyman', description: 'Reach level 20', category: 'progression', rarity: 'uncommon', icon: '🎒', requirement: { type: 'level_reached', level: 20 }, reward: { gold: 250, xp: 500 } },
  { id: 'expert', name: 'Expert', description: 'Reach level 30', category: 'progression', rarity: 'rare', icon: '⭐', requirement: { type: 'level_reached', level: 30 }, reward: { gold: 500, xp: 1000 } },
  { id: 'master', name: 'Master', description: 'Reach level 40', category: 'progression', rarity: 'epic', icon: '🏆', requirement: { type: 'level_reached', level: 40 }, reward: { gold: 1000, xp: 2000, perkPoint: 1 } },
  { id: 'legendary_hero', name: 'Legendary Hero', description: 'Reach level 50', category: 'progression', rarity: 'legendary', icon: '👑', requirement: { type: 'level_reached', level: 50 }, reward: { gold: 2500, xp: 5000, perkPoint: 2, title: 'Legendary Hero' } },
  { id: 'perk_novice', name: 'Perk Novice', description: 'Unlock 5 perks', category: 'progression', rarity: 'common', icon: '🔓', requirement: { type: 'perks_unlocked', count: 5 }, reward: { gold: 50, xp: 100 } },
  { id: 'perk_collector', name: 'Perk Collector', description: 'Unlock 15 perks', category: 'progression', rarity: 'uncommon', icon: '🗝️', requirement: { type: 'perks_unlocked', count: 15 }, reward: { gold: 150, xp: 300 } },
  { id: 'perk_master', name: 'Perk Master', description: 'Unlock 30 perks', category: 'progression', rarity: 'rare', icon: '🎯', requirement: { type: 'perks_unlocked', count: 30 }, reward: { gold: 500, xp: 800 } },
  { id: 'skill_apprentice', name: 'Skill Apprentice', description: 'Reach level 50 in any skill', category: 'progression', rarity: 'uncommon', icon: '📖', requirement: { type: 'skills_mastered', count: 1, minLevel: 50 }, reward: { gold: 100, xp: 250 } },
  { id: 'skill_expert', name: 'Skill Expert', description: 'Reach level 75 in any skill', category: 'progression', rarity: 'rare', icon: '📕', requirement: { type: 'skills_mastered', count: 1, minLevel: 75 }, reward: { gold: 300, xp: 600 } },
  { id: 'skill_master', name: 'Skill Master', description: 'Reach level 100 in any skill', category: 'progression', rarity: 'epic', icon: '📗', requirement: { type: 'skills_mastered', count: 1, minLevel: 100 }, reward: { gold: 750, xp: 1500, title: 'Skill Master' } },
  { id: 'jack_of_trades', name: 'Jack of All Trades', description: 'Reach level 25 in 5 different skills', category: 'progression', rarity: 'rare', icon: '🃏', requirement: { type: 'skills_mastered', count: 5, minLevel: 25 }, reward: { gold: 400, xp: 800 } },
  { id: 'quest_starter', name: 'Quest Starter', description: 'Complete 5 quests', category: 'progression', rarity: 'common', icon: '📜', requirement: { type: 'quests_completed', count: 5 }, reward: { gold: 75, xp: 150 } },
  { id: 'quest_seeker', name: 'Quest Seeker', description: 'Complete 20 quests', category: 'progression', rarity: 'uncommon', icon: '🗺️', requirement: { type: 'quests_completed', count: 20 }, reward: { gold: 200, xp: 400 } },
  { id: 'quest_champion', name: 'Quest Champion', description: 'Complete 50 quests', category: 'progression', rarity: 'rare', icon: '🏅', requirement: { type: 'quests_completed', count: 50 }, reward: { gold: 600, xp: 1200 } },
  { id: 'quest_legend', name: 'Quest Legend', description: 'Complete 100 quests', category: 'progression', rarity: 'epic', icon: '🌟', requirement: { type: 'quests_completed', count: 100 }, reward: { gold: 1500, xp: 3000, title: 'Questmaster' } },
  { id: 'survivor_week', name: 'Week Survivor', description: 'Survive for 7 days', category: 'progression', rarity: 'common', icon: '📅', requirement: { type: 'survival_days', days: 7 }, reward: { gold: 50, xp: 100 } },
  { id: 'survivor_month', name: 'Month Survivor', description: 'Survive for 30 days', category: 'progression', rarity: 'uncommon', icon: '🗓️', requirement: { type: 'survival_days', days: 30 }, reward: { gold: 200, xp: 400 } },
  { id: 'survivor_year', name: 'Year Survivor', description: 'Survive for 365 days', category: 'progression', rarity: 'legendary', icon: '⏳', requirement: { type: 'survival_days', days: 365 }, reward: { gold: 2000, xp: 5000, title: 'Timeless' } },

  // ===== COMBAT (25) =====
  { id: 'first_blood', name: 'First Blood', description: 'Win your first combat', category: 'combat', rarity: 'common', icon: '⚔️', requirement: { type: 'combat_wins', count: 1 }, reward: { gold: 25, xp: 50 } },
  { id: 'warrior_rising', name: 'Warrior Rising', description: 'Win 10 combats', category: 'combat', rarity: 'common', icon: '🗡️', requirement: { type: 'combat_wins', count: 10 }, reward: { gold: 75, xp: 150 } },
  { id: 'battle_hardened', name: 'Battle Hardened', description: 'Win 50 combats', category: 'combat', rarity: 'uncommon', icon: '🛡️', requirement: { type: 'combat_wins', count: 50 }, reward: { gold: 250, xp: 500 } },
  { id: 'veteran', name: 'Veteran', description: 'Win 100 combats', category: 'combat', rarity: 'rare', icon: '⚔️', requirement: { type: 'combat_wins', count: 100 }, reward: { gold: 500, xp: 1000 } },
  { id: 'war_hero', name: 'War Hero', description: 'Win 250 combats', category: 'combat', rarity: 'epic', icon: '🦅', requirement: { type: 'combat_wins', count: 250 }, reward: { gold: 1000, xp: 2000, title: 'War Hero' } },
  { id: 'slayer', name: 'Slayer', description: 'Kill 100 enemies', category: 'combat', rarity: 'uncommon', icon: '💀', requirement: { type: 'enemy_kills', count: 100 }, reward: { gold: 150, xp: 300 } },
  { id: 'mass_slayer', name: 'Mass Slayer', description: 'Kill 500 enemies', category: 'combat', rarity: 'rare', icon: '☠️', requirement: { type: 'enemy_kills', count: 500 }, reward: { gold: 500, xp: 1000 } },
  { id: 'genocide', name: 'One-Man Army', description: 'Kill 1000 enemies', category: 'combat', rarity: 'epic', icon: '💀', requirement: { type: 'enemy_kills', count: 1000 }, reward: { gold: 1500, xp: 3000, title: 'One-Man Army' } },
  { id: 'boss_hunter', name: 'Boss Hunter', description: 'Defeat 5 bosses', category: 'combat', rarity: 'uncommon', icon: '👹', requirement: { type: 'boss_kills', count: 5 }, reward: { gold: 200, xp: 400 } },
  { id: 'boss_slayer', name: 'Boss Slayer', description: 'Defeat 15 bosses', category: 'combat', rarity: 'rare', icon: '🐉', requirement: { type: 'boss_kills', count: 15 }, reward: { gold: 500, xp: 1000 } },
  { id: 'boss_master', name: 'Boss Master', description: 'Defeat 30 bosses', category: 'combat', rarity: 'epic', icon: '👑', requirement: { type: 'boss_kills', count: 30 }, reward: { gold: 1000, xp: 2000, title: 'Bossbreaker' } },
  { id: 'critical_striker', name: 'Critical Striker', description: 'Land 50 critical hits', category: 'combat', rarity: 'common', icon: '💥', requirement: { type: 'critical_hits', count: 50 }, reward: { gold: 75, xp: 150 } },
  { id: 'crit_master', name: 'Critical Master', description: 'Land 200 critical hits', category: 'combat', rarity: 'uncommon', icon: '⚡', requirement: { type: 'critical_hits', count: 200 }, reward: { gold: 200, xp: 400 } },
  { id: 'dodger', name: 'Dodger', description: 'Dodge 50 attacks', category: 'combat', rarity: 'common', icon: '💨', requirement: { type: 'dodges', count: 50 }, reward: { gold: 75, xp: 150 } },
  { id: 'untouchable', name: 'Untouchable', description: 'Dodge 200 attacks', category: 'combat', rarity: 'rare', icon: '👻', requirement: { type: 'dodges', count: 200 }, reward: { gold: 400, xp: 800, title: 'Untouchable' } },
  { id: 'shield_bearer', name: 'Shield Bearer', description: 'Block 50 attacks', category: 'combat', rarity: 'common', icon: '🛡️', requirement: { type: 'blocks', count: 50 }, reward: { gold: 75, xp: 150 } },
  { id: 'iron_wall', name: 'Iron Wall', description: 'Block 200 attacks', category: 'combat', rarity: 'rare', icon: '🏰', requirement: { type: 'blocks', count: 200 }, reward: { gold: 400, xp: 800, title: 'Iron Wall' } },
  { id: 'damage_dealer', name: 'Damage Dealer', description: 'Deal 10,000 total damage', category: 'combat', rarity: 'uncommon', icon: '💢', requirement: { type: 'damage_dealt', amount: 10000 }, reward: { gold: 150, xp: 300 } },
  { id: 'devastator', name: 'Devastator', description: 'Deal 100,000 total damage', category: 'combat', rarity: 'epic', icon: '💥', requirement: { type: 'damage_dealt', amount: 100000 }, reward: { gold: 1000, xp: 2000, title: 'Devastator' } },
  { id: 'battle_scarred', name: 'Battle Scarred', description: 'Take 5,000 total damage', category: 'combat', rarity: 'common', icon: '🩹', requirement: { type: 'damage_taken', amount: 5000 }, reward: { gold: 50, xp: 100 } },
  { id: 'survivor', name: 'Survivor', description: 'Take 50,000 total damage and live', category: 'combat', rarity: 'rare', icon: '🦴', requirement: { type: 'damage_taken', amount: 50000 }, reward: { gold: 400, xp: 800, title: 'Survivor' } },
  { id: 'healer', name: 'Healer', description: 'Heal 5,000 total HP', category: 'combat', rarity: 'uncommon', icon: '💚', requirement: { type: 'healing_done', amount: 5000 }, reward: { gold: 150, xp: 300 } },
  { id: 'lifegiver', name: 'Lifegiver', description: 'Heal 25,000 total HP', category: 'combat', rarity: 'rare', icon: '✨', requirement: { type: 'healing_done', amount: 25000 }, reward: { gold: 500, xp: 1000, title: 'Lifegiver' } },
  { id: 'phoenix', name: 'Phoenix', description: 'Die and return 10 times', category: 'combat', rarity: 'rare', icon: '🔥', requirement: { type: 'deaths', count: 10 }, reward: { gold: 300, xp: 600, title: 'Phoenix' } },
  { id: 'immortal', name: 'Immortal', description: 'Die and return 50 times', category: 'combat', rarity: 'epic', icon: '♾️', requirement: { type: 'deaths', count: 50 }, reward: { gold: 750, xp: 1500, title: 'Immortal' } },

  // ===== EXPLORATION (15) =====
  { id: 'dungeon_crawler', name: 'Dungeon Crawler', description: 'Clear 5 dungeons', category: 'exploration', rarity: 'common', icon: '🏚️', requirement: { type: 'dungeon_clears', count: 5 }, reward: { gold: 100, xp: 200 } },
  { id: 'dungeon_delver', name: 'Dungeon Delver', description: 'Clear 20 dungeons', category: 'exploration', rarity: 'uncommon', icon: '🗝️', requirement: { type: 'dungeon_clears', count: 20 }, reward: { gold: 300, xp: 600 } },
  { id: 'dungeon_master', name: 'Dungeon Master', description: 'Clear 50 dungeons', category: 'exploration', rarity: 'rare', icon: '🏰', requirement: { type: 'dungeon_clears', count: 50 }, reward: { gold: 750, xp: 1500, title: 'Dungeon Master' } },
  { id: 'explorer', name: 'Explorer', description: 'Discover 10 locations', category: 'exploration', rarity: 'common', icon: '🧭', requirement: { type: 'locations_discovered', count: 10 }, reward: { gold: 50, xp: 100 } },
  { id: 'wanderer', name: 'Wanderer', description: 'Discover 30 locations', category: 'exploration', rarity: 'uncommon', icon: '🗺️', requirement: { type: 'locations_discovered', count: 30 }, reward: { gold: 200, xp: 400 } },
  { id: 'world_traveler', name: 'World Traveler', description: 'Discover 50 locations', category: 'exploration', rarity: 'rare', icon: '🌍', requirement: { type: 'locations_discovered', count: 50 }, reward: { gold: 500, xp: 1000, title: 'World Traveler' } },
  { id: 'cartographer', name: 'Cartographer', description: 'Discover 100 locations', category: 'exploration', rarity: 'epic', icon: '📍', requirement: { type: 'locations_discovered', count: 100 }, reward: { gold: 1000, xp: 2000, title: 'Cartographer' } },
  { id: 'social_butterfly', name: 'Social Butterfly', description: 'Meet 20 NPCs', category: 'social', rarity: 'common', icon: '🦋', requirement: { type: 'npcs_met', count: 20 }, reward: { gold: 75, xp: 150 } },
  { id: 'peoples_person', name: "People's Person", description: 'Meet 50 NPCs', category: 'social', rarity: 'uncommon', icon: '🤝', requirement: { type: 'npcs_met', count: 50 }, reward: { gold: 200, xp: 400 } },
  { id: 'friend_maker', name: 'Friend Maker', description: 'Recruit 3 companions', category: 'social', rarity: 'uncommon', icon: '👥', requirement: { type: 'companions_recruited', count: 3 }, reward: { gold: 150, xp: 300 } },
  { id: 'party_leader', name: 'Party Leader', description: 'Recruit 5 companions', category: 'social', rarity: 'rare', icon: '👨‍👩‍👧‍👦', requirement: { type: 'companions_recruited', count: 5 }, reward: { gold: 400, xp: 800, title: 'Party Leader' } },
  { id: 'guild_master', name: 'Guild Master', description: 'Recruit 10 companions', category: 'social', rarity: 'epic', icon: '🏛️', requirement: { type: 'companions_recruited', count: 10 }, reward: { gold: 1000, xp: 2000, title: 'Guild Master' } },
  { id: 'time_traveler', name: 'Time Traveler', description: 'Play for 10 hours', category: 'exploration', rarity: 'common', icon: '⏰', requirement: { type: 'play_time', minutes: 600 }, reward: { gold: 100, xp: 200 } },
  { id: 'dedicated', name: 'Dedicated', description: 'Play for 50 hours', category: 'exploration', rarity: 'rare', icon: '⌛', requirement: { type: 'play_time', minutes: 3000 }, reward: { gold: 500, xp: 1000 } },
  { id: 'no_life', name: 'Truly Dedicated', description: 'Play for 100 hours', category: 'exploration', rarity: 'epic', icon: '🕐', requirement: { type: 'play_time', minutes: 6000 }, reward: { gold: 1500, xp: 3000, title: 'Truly Dedicated' } },

  // ===== MAGIC (15) =====
  { id: 'apprentice_mage', name: 'Apprentice Mage', description: 'Cast 50 spells', category: 'magic', rarity: 'common', icon: '✨', requirement: { type: 'spells_cast', count: 50 }, reward: { gold: 50, xp: 100 } },
  { id: 'adept_mage', name: 'Adept Mage', description: 'Cast 200 spells', category: 'magic', rarity: 'uncommon', icon: '🔮', requirement: { type: 'spells_cast', count: 200 }, reward: { gold: 150, xp: 300 } },
  { id: 'archmage', name: 'Archmage', description: 'Cast 500 spells', category: 'magic', rarity: 'rare', icon: '🧙', requirement: { type: 'spells_cast', count: 500 }, reward: { gold: 400, xp: 800, title: 'Archmage' } },
  { id: 'master_wizard', name: 'Master Wizard', description: 'Cast 1000 spells', category: 'magic', rarity: 'epic', icon: '🌟', requirement: { type: 'spells_cast', count: 1000 }, reward: { gold: 1000, xp: 2000, title: 'Master Wizard' } },
  { id: 'destruction_novice', name: 'Destruction Novice', description: 'Cast 25 destruction spells', category: 'magic', rarity: 'common', icon: '🔥', requirement: { type: 'spells_cast', count: 25, school: 'destruction' }, reward: { gold: 50, xp: 100 } },
  { id: 'destruction_master', name: 'Destruction Master', description: 'Cast 100 destruction spells', category: 'magic', rarity: 'rare', icon: '💥', requirement: { type: 'spells_cast', count: 100, school: 'destruction' }, reward: { gold: 300, xp: 600, title: 'Destruction Master' } },
  { id: 'restoration_novice', name: 'Restoration Novice', description: 'Cast 25 restoration spells', category: 'magic', rarity: 'common', icon: '💚', requirement: { type: 'spells_cast', count: 25, school: 'restoration' }, reward: { gold: 50, xp: 100 } },
  { id: 'restoration_master', name: 'Restoration Master', description: 'Cast 100 restoration spells', category: 'magic', rarity: 'rare', icon: '✨', requirement: { type: 'spells_cast', count: 100, school: 'restoration' }, reward: { gold: 300, xp: 600, title: 'Restoration Master' } },
  { id: 'conjuration_novice', name: 'Conjuration Novice', description: 'Cast 25 conjuration spells', category: 'magic', rarity: 'common', icon: '👻', requirement: { type: 'spells_cast', count: 25, school: 'conjuration' }, reward: { gold: 50, xp: 100 } },
  { id: 'conjuration_master', name: 'Conjuration Master', description: 'Cast 100 conjuration spells', category: 'magic', rarity: 'rare', icon: '🐲', requirement: { type: 'spells_cast', count: 100, school: 'conjuration' }, reward: { gold: 300, xp: 600, title: 'Conjuration Master' } },
  { id: 'illusion_novice', name: 'Illusion Novice', description: 'Cast 25 illusion spells', category: 'magic', rarity: 'common', icon: '🌀', requirement: { type: 'spells_cast', count: 25, school: 'illusion' }, reward: { gold: 50, xp: 100 } },
  { id: 'illusion_master', name: 'Illusion Master', description: 'Cast 100 illusion spells', category: 'magic', rarity: 'rare', icon: '🎭', requirement: { type: 'spells_cast', count: 100, school: 'illusion' }, reward: { gold: 300, xp: 600, title: 'Illusion Master' } },
  { id: 'alteration_novice', name: 'Alteration Novice', description: 'Cast 25 alteration spells', category: 'magic', rarity: 'common', icon: '🔄', requirement: { type: 'spells_cast', count: 25, school: 'alteration' }, reward: { gold: 50, xp: 100 } },
  { id: 'alteration_master', name: 'Alteration Master', description: 'Cast 100 alteration spells', category: 'magic', rarity: 'rare', icon: '⚗️', requirement: { type: 'spells_cast', count: 100, school: 'alteration' }, reward: { gold: 300, xp: 600, title: 'Alteration Master' } },
  { id: 'school_master', name: 'School Master', description: 'Cast 50 spells from each magic school', category: 'magic', rarity: 'epic', icon: '🎓', requirement: { type: 'combo', requirements: [{ type: 'spells_cast', count: 50, school: 'destruction' }, { type: 'spells_cast', count: 50, school: 'restoration' }, { type: 'spells_cast', count: 50, school: 'conjuration' }, { type: 'spells_cast', count: 50, school: 'illusion' }, { type: 'spells_cast', count: 50, school: 'alteration' }] }, reward: { gold: 1500, xp: 3000, perkPoint: 1, title: 'Arcane Scholar' } },

  // ===== STEALTH (10) =====
  { id: 'pickpocket_novice', name: 'Pickpocket Novice', description: 'Successfully pickpocket 10 times', category: 'stealth', rarity: 'common', icon: '🤏', requirement: { type: 'pickpocket_succeeded', count: 10 }, reward: { gold: 75, xp: 150 } },
  { id: 'master_thief', name: 'Master Thief', description: 'Successfully pickpocket 50 times', category: 'stealth', rarity: 'rare', icon: '🦝', requirement: { type: 'pickpocket_succeeded', count: 50 }, reward: { gold: 400, xp: 800, title: 'Master Thief' } },
  { id: 'lockpick_novice', name: 'Lockpick Novice', description: 'Pick 20 locks', category: 'stealth', rarity: 'common', icon: '🔓', requirement: { type: 'lockpicks_succeeded', count: 20 }, reward: { gold: 75, xp: 150 } },
  { id: 'lockpick_expert', name: 'Lockpick Expert', description: 'Pick 75 locks', category: 'stealth', rarity: 'rare', icon: '🗝️', requirement: { type: 'lockpicks_succeeded', count: 75 }, reward: { gold: 400, xp: 800, title: 'Lockpick Expert' } },
  { id: 'assassin_novice', name: 'Assassin Novice', description: 'Perform 10 sneak attacks', category: 'stealth', rarity: 'common', icon: '🗡️', requirement: { type: 'sneak_attacks', count: 10 }, reward: { gold: 75, xp: 150 } },
  { id: 'shadow_blade', name: 'Shadow Blade', description: 'Perform 50 sneak attacks', category: 'stealth', rarity: 'uncommon', icon: '🌑', requirement: { type: 'sneak_attacks', count: 50 }, reward: { gold: 200, xp: 400 } },
  { id: 'master_assassin', name: 'Master Assassin', description: 'Perform 150 sneak attacks', category: 'stealth', rarity: 'rare', icon: '💀', requirement: { type: 'sneak_attacks', count: 150 }, reward: { gold: 600, xp: 1200, title: 'Master Assassin' } },
  { id: 'silent_death', name: 'Silent Death', description: 'Perform 300 sneak attacks', category: 'stealth', rarity: 'epic', icon: '☠️', requirement: { type: 'sneak_attacks', count: 300 }, reward: { gold: 1200, xp: 2400, title: 'Silent Death' } },
  { id: 'shadow_walker', name: 'Shadow Walker', description: 'Complete stealth combo: 25 pickpockets, 50 lockpicks, 50 sneak attacks', category: 'stealth', rarity: 'epic', icon: '🦇', requirement: { type: 'combo', requirements: [{ type: 'pickpocket_succeeded', count: 25 }, { type: 'lockpicks_succeeded', count: 50 }, { type: 'sneak_attacks', count: 50 }] }, reward: { gold: 1000, xp: 2000, perkPoint: 1, title: 'Shadow Walker' } },
  { id: 'thieves_guild', name: "Thieves Guild Legend", description: 'Master all stealth achievements', category: 'stealth', rarity: 'legendary', icon: '🏴', requirement: { type: 'combo', requirements: [{ type: 'pickpocket_succeeded', count: 50 }, { type: 'lockpicks_succeeded', count: 75 }, { type: 'sneak_attacks', count: 150 }] }, reward: { gold: 2500, xp: 5000, perkPoint: 2, title: "Thieves Guild Legend" }, hidden: true },

  // ===== CRAFTING & COLLECTION (15) =====
  { id: 'collector', name: 'Collector', description: 'Collect 100 items', category: 'collection', rarity: 'common', icon: '📦', requirement: { type: 'items_collected', count: 100 }, reward: { gold: 50, xp: 100 } },
  { id: 'hoarder', name: 'Hoarder', description: 'Collect 500 items', category: 'collection', rarity: 'uncommon', icon: '🗃️', requirement: { type: 'items_collected', count: 500 }, reward: { gold: 200, xp: 400 } },
  { id: 'treasure_hunter', name: 'Treasure Hunter', description: 'Collect 1000 items', category: 'collection', rarity: 'rare', icon: '💎', requirement: { type: 'items_collected', count: 1000 }, reward: { gold: 600, xp: 1200, title: 'Treasure Hunter' } },
  { id: 'crafter_apprentice', name: 'Crafter Apprentice', description: 'Craft 10 items', category: 'crafting', rarity: 'common', icon: '🔨', requirement: { type: 'items_crafted', count: 10 }, reward: { gold: 50, xp: 100 } },
  { id: 'crafter_journeyman', name: 'Crafter Journeyman', description: 'Craft 50 items', category: 'crafting', rarity: 'uncommon', icon: '⚒️', requirement: { type: 'items_crafted', count: 50 }, reward: { gold: 200, xp: 400 } },
  { id: 'master_crafter', name: 'Master Crafter', description: 'Craft 150 items', category: 'crafting', rarity: 'rare', icon: '🏗️', requirement: { type: 'items_crafted', count: 150 }, reward: { gold: 600, xp: 1200, title: 'Master Crafter' } },
  { id: 'upgrader_novice', name: 'Upgrader Novice', description: 'Upgrade 10 items', category: 'crafting', rarity: 'common', icon: '⬆️', requirement: { type: 'items_upgraded', count: 10 }, reward: { gold: 50, xp: 100 } },
  { id: 'upgrader_expert', name: 'Upgrader Expert', description: 'Upgrade 50 items', category: 'crafting', rarity: 'uncommon', icon: '📈', requirement: { type: 'items_upgraded', count: 50 }, reward: { gold: 200, xp: 400 } },
  { id: 'master_smith', name: 'Master Smith', description: 'Upgrade 100 items', category: 'crafting', rarity: 'rare', icon: '🔥', requirement: { type: 'items_upgraded', count: 100 }, reward: { gold: 600, xp: 1200, title: 'Master Smith' } },
  { id: 'gold_digger', name: 'Gold Digger', description: 'Earn 5,000 gold total', category: 'collection', rarity: 'common', icon: '💰', requirement: { type: 'gold_earned', amount: 5000 }, reward: { gold: 100, xp: 200 } },
  { id: 'wealthy', name: 'Wealthy', description: 'Earn 25,000 gold total', category: 'collection', rarity: 'uncommon', icon: '💵', requirement: { type: 'gold_earned', amount: 25000 }, reward: { gold: 400, xp: 800 } },
  { id: 'tycoon', name: 'Tycoon', description: 'Earn 100,000 gold total', category: 'collection', rarity: 'rare', icon: '🏦', requirement: { type: 'gold_earned', amount: 100000 }, reward: { gold: 1500, xp: 3000, title: 'Tycoon' } },
  { id: 'millionaire', name: 'Millionaire', description: 'Earn 500,000 gold total', category: 'collection', rarity: 'epic', icon: '💎', requirement: { type: 'gold_earned', amount: 500000 }, reward: { gold: 5000, xp: 10000, title: 'Millionaire' } },
  { id: 'big_spender', name: 'Big Spender', description: 'Spend 10,000 gold total', category: 'collection', rarity: 'common', icon: '🛒', requirement: { type: 'gold_spent', amount: 10000 }, reward: { gold: 200, xp: 200 } },
  { id: 'lavish', name: 'Lavish Lifestyle', description: 'Spend 100,000 gold total', category: 'collection', rarity: 'rare', icon: '👑', requirement: { type: 'gold_spent', amount: 100000 }, reward: { gold: 1000, xp: 2000, title: 'Big Spender' } },

  // ===== SURVIVAL (10) =====
  { id: 'potion_drinker', name: 'Potion Drinker', description: 'Consume 25 potions', category: 'survival', rarity: 'common', icon: '🧪', requirement: { type: 'potions_consumed', count: 25 }, reward: { gold: 50, xp: 100 } },
  { id: 'alchemist', name: 'Alchemist', description: 'Consume 100 potions', category: 'survival', rarity: 'uncommon', icon: '⚗️', requirement: { type: 'potions_consumed', count: 100 }, reward: { gold: 200, xp: 400 } },
  { id: 'potion_master', name: 'Potion Master', description: 'Consume 250 potions', category: 'survival', rarity: 'rare', icon: '🍾', requirement: { type: 'potions_consumed', count: 250 }, reward: { gold: 500, xp: 1000, title: 'Potion Master' } },
  { id: 'foodie', name: 'Foodie', description: 'Consume 50 food items', category: 'survival', rarity: 'common', icon: '🍖', requirement: { type: 'food_consumed', count: 50 }, reward: { gold: 50, xp: 100 } },
  { id: 'gourmet', name: 'Gourmet', description: 'Consume 200 food items', category: 'survival', rarity: 'uncommon', icon: '🍽️', requirement: { type: 'food_consumed', count: 200 }, reward: { gold: 200, xp: 400, title: 'Gourmet' } },
  { id: 'well_rested', name: 'Well Rested', description: 'Rest 25 times', category: 'survival', rarity: 'common', icon: '😴', requirement: { type: 'rested_times', count: 25 }, reward: { gold: 50, xp: 100 } },
  { id: 'lazy', name: 'Professional Sleeper', description: 'Rest 100 times', category: 'survival', rarity: 'uncommon', icon: '🛏️', requirement: { type: 'rested_times', count: 100 }, reward: { gold: 200, xp: 400, title: 'Professional Sleeper' } },
  { id: 'survivalist', name: 'Survivalist', description: 'Survive without dying for 30 in-game days', category: 'survival', rarity: 'rare', icon: '🏕️', requirement: { type: 'survival_days', days: 30 }, reward: { gold: 500, xp: 1000, title: 'Survivalist' } },
  { id: 'self_sufficient', name: 'Self Sufficient', description: 'Consume 100 potions, 100 food, rest 50 times', category: 'survival', rarity: 'rare', icon: '🎒', requirement: { type: 'combo', requirements: [{ type: 'potions_consumed', count: 100 }, { type: 'food_consumed', count: 100 }, { type: 'rested_times', count: 50 }] }, reward: { gold: 750, xp: 1500, title: 'Self Sufficient' } },
  { id: 'ultimate_survivor', name: 'Ultimate Survivor', description: 'Master all survival mechanics', category: 'survival', rarity: 'epic', icon: '🦁', requirement: { type: 'combo', requirements: [{ type: 'potions_consumed', count: 250 }, { type: 'food_consumed', count: 200 }, { type: 'rested_times', count: 100 }, { type: 'survival_days', days: 100 }] }, reward: { gold: 2000, xp: 4000, perkPoint: 1, title: 'Ultimate Survivor' } },
];

// Ensure every achievement has a helpful longDescription for clarity in the UI
for (const a of ACHIEVEMENTS) {
  if (!a.longDescription) {
    a.longDescription = `${a.description}. This is tracked per-character and is automatically evaluated on character load or when stats change. Use the Achievements modal 'Refresh' to re-evaluate historical progress.`;
  }
}

/**
 * Best-effort audit/migration to reconcile historical gameplay data into achievement stats.
 * This does not attempt to reconstruct every event; it performs deterministic, idempotent
 * aggregations from available game state (quests, inventory, transactions, character history).
 */
export function auditStatsFromGameData(
  stats: AchievementStats,
  character: Character | null,
  options?: {
    quests?: Array<any>;
    inventory?: Array<any>;
    companions?: Array<any>;
    transactions?: Array<{ items?: Array<{ name: string; quantity: number; added: boolean }>; type?: string }>; 
    playTimeMinutes?: number;
  }
): AchievementStats {
  const updated: AchievementStats = { ...stats };

  try {
    // Quests completed
    const completedQuests = (options?.quests || []).filter(q => q.status === 'completed').length;
    updated.questsCompleted = Math.max(updated.questsCompleted || 0, completedQuests);

    // Locations discovered (merge unique)
    const discoveredFromChar = (character && (character as any).discoveredLocations) || [];
    const names = new Set([...(updated.locationsDiscovered || []), ...discoveredFromChar.map((l: any) => (typeof l === 'string' ? l : (l.name || l.id || String(l))))]);
    updated.locationsDiscovered = Array.from(names);

    // Dungeon clears
    const dungeonClears = (character && (character as any).clearedDungeons) ? (character as any).clearedDungeons.reduce((sum: number, d: any) => sum + (d.clearCount || 0), 0) : 0;
    updated.dungeonClears = Math.max((updated.dungeonClears || 0), dungeonClears);

    // Items collected (rough upper bound)
    if (options?.inventory) {
      const totalItems = options.inventory.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
      updated.itemsCollected = Math.max(updated.itemsCollected || 0, totalItems);
    }

    // Potions / food consumed: best-effort scan of transaction items for removed entries
    if (options?.transactions) {
      const txns = options.transactions || [];
      let potions = 0;
      let food = 0;
      for (const t of txns) {
        for (const it of (t.items || [])) {
          if (!it.added) {
            const n = (it.name || '').toLowerCase();
            if (n.includes('potion')) potions += it.quantity || 1;
            if (n.includes('food') || n.includes('meal') || n.includes('meat') || n.includes('stew')) food += it.quantity || 1;
          }
        }
      }
      updated.potionsConsumed = Math.max(updated.potionsConsumed || 0, potions);
      updated.foodConsumed = Math.max(updated.foodConsumed || 0, food);
    }

    // Companions recruited
    if (options?.companions) {
      updated.companionsRecruited = Array.from(new Set([...(updated.companionsRecruited || []), ...options.companions.map(c => c.id || c.name)]) as any);
    }

    // Play time
    if (options?.playTimeMinutes) {
      updated.playTimeMinutes = Math.max(updated.playTimeMinutes || 0, options.playTimeMinutes);
    }

    // Perks unlocked from character
    if (character && (character.perks || []).length) {
      updated.perksUnlocked = Math.max(updated.perksUnlocked || 0, character.perks.length);
    }

    // Skill levels
    if (character && (character.skills || []).length) {
      const skillMap = { ...(updated.skillLevels || {}) } as Record<string, number>;
      for (const s of character.skills) {
        skillMap[s.name] = Math.max(skillMap[s.name] || 0, s.level || 0);
      }
      updated.skillLevels = skillMap;
    }
  } catch (e) {
    // Best effort only
    console.warn('[Achievements] auditStatsFromGameData failed:', e);
  }

  return updated;
}

// =============================================================================
// ACHIEVEMENT CHECKING LOGIC
// =============================================================================

export function checkRequirement(req: AchievementRequirement, stats: AchievementStats, character: Character): boolean {
  switch (req.type) {
    case 'combat_wins':
      return stats.combatWins >= req.count;
    case 'enemy_kills':
      if (req.enemyType) {
        return (stats.enemyKills[req.enemyType] || 0) >= req.count;
      }
      return stats.totalEnemyKills >= req.count;
    case 'boss_kills':
      return stats.bossKills >= req.count;
    case 'dungeon_clears':
      return stats.dungeonClears >= req.count;
    case 'level_reached':
      return (character.level || 1) >= req.level;
    case 'gold_earned':
      return stats.goldEarned >= req.amount;
    case 'gold_spent':
      return stats.goldSpent >= req.amount;
    case 'items_collected':
      return stats.itemsCollected >= req.count;
    case 'items_crafted':
      return stats.itemsCrafted >= req.count;
    case 'items_upgraded':
      return stats.itemsUpgraded >= req.count;
    case 'spells_cast':
      if (req.school) {
        return (stats.spellsCast[req.school] || 0) >= req.count;
      }
      return stats.totalSpellsCast >= req.count;
    case 'damage_dealt':
      return stats.damageDealt >= req.amount;
    case 'damage_taken':
      return stats.damageTaken >= req.amount;
    case 'healing_done':
      return stats.healingDone >= req.amount;
    case 'critical_hits':
      return stats.criticalHits >= req.count;
    case 'dodges':
      return stats.dodges >= req.count;
    case 'blocks':
      return stats.blocks >= req.count;
    case 'deaths':
      return stats.deaths >= req.count;
    case 'play_time':
      return stats.playTimeMinutes >= req.minutes;
    case 'quests_completed':
      return stats.questsCompleted >= req.count;
    case 'locations_discovered':
      return stats.locationsDiscovered.length >= req.count;
    case 'npcs_met':
      return stats.npcsMet.length >= req.count;
    case 'companions_recruited':
      return stats.companionsRecruited.length >= req.count;
    case 'perks_unlocked':
      return stats.perksUnlocked >= req.count;
    case 'skills_mastered':
      const skillLevels = Object.values(stats.skillLevels);
      const threshold = req.minLevel || 100;
      return skillLevels.filter(lvl => lvl >= threshold).length >= req.count;
    case 'survival_days':
      return stats.survivalDays >= req.days;
    case 'potions_consumed':
      return stats.potionsConsumed >= req.count;
    case 'food_consumed':
      return stats.foodConsumed >= req.count;
    case 'rested_times':
      return stats.restedTimes >= req.count;
    case 'lockpicks_succeeded':
      return stats.lockpicksSucceeded >= req.count;
    case 'pickpocket_succeeded':
      return stats.pickpocketSucceeded >= req.count;
    case 'sneak_attacks':
      return stats.sneakAttacks >= req.count;
    case 'specific_item':
      return stats.specificItems.includes(req.itemId);
    case 'specific_enemy':
      return stats.specificEnemies.includes(req.enemyId);
    case 'specific_location':
      return stats.specificLocations.includes(req.locationId);
    case 'specific_quest':
      return stats.specificQuests.includes(req.questId);
    case 'combo':
      return req.requirements.every(r => checkRequirement(r, stats, character));
    case 'custom':
      return req.check(stats, character);
    default:
      return false;
  }
}

export function checkAchievements(
  state: AchievementState,
  character: Character
): { newlyUnlocked: Achievement[]; updatedState: AchievementState } {
  const newlyUnlocked: Achievement[] = [];
  const updatedState = { ...state };

  for (const achievement of ACHIEVEMENTS) {
    // Skip already unlocked
    if (updatedState.unlockedAchievements[achievement.id]) continue;

    // Check prerequisite
    if (achievement.prerequisite && !updatedState.unlockedAchievements[achievement.prerequisite]) {
      continue;
    }

    // Check requirement
    if (checkRequirement(achievement.requirement, state.stats, character)) {
      // Only add to newlyUnlocked if not already notified
      if (!updatedState.notifiedAchievements.has(achievement.id)) {
        newlyUnlocked.push(achievement);
      }
      updatedState.unlockedAchievements[achievement.id] = {
        unlockedAt: Date.now(),
        collected: false
      };
    }
  }

  return { newlyUnlocked, updatedState };
}

export function markAchievementsNotified(
  state: AchievementState,
  achievementIds: string[]
): AchievementState {
  const updatedNotified = new Set(state.notifiedAchievements);
  achievementIds.forEach(id => updatedNotified.add(id));

  return {
    ...state,
    notifiedAchievements: updatedNotified
  };
}

export function collectAchievementReward(
  state: AchievementState,
  achievementId: string
): { success: boolean; reward?: AchievementReward; updatedState: AchievementState } {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  const unlockData = state.unlockedAchievements[achievementId];

  if (!achievement || !unlockData || unlockData.collected) {
    return { success: false, updatedState: state };
  }

  const updatedState = {
    ...state,
    unlockedAchievements: {
      ...state.unlockedAchievements,
      [achievementId]: { ...unlockData, collected: true }
    }
  };

  return { success: true, reward: achievement.reward, updatedState };
}

// Get progress for an achievement
export function getAchievementProgress(achievement: Achievement, stats: AchievementStats, character: Character): { current: number; target: number; percent: number } {
  const req = achievement.requirement;
  let current = 0;
  let target = 1;

  switch (req.type) {
    case 'combat_wins':
      current = stats.combatWins;
      target = req.count;
      break;
    case 'enemy_kills':
      current = req.enemyType ? (stats.enemyKills[req.enemyType] || 0) : stats.totalEnemyKills;
      target = req.count;
      break;
    case 'boss_kills':
      current = stats.bossKills;
      target = req.count;
      break;
    case 'dungeon_clears':
      current = stats.dungeonClears;
      target = req.count;
      break;
    case 'level_reached':
      current = character.level || 1;
      target = req.level;
      break;
    case 'gold_earned':
      current = stats.goldEarned;
      target = req.amount;
      break;
    case 'gold_spent':
      current = stats.goldSpent;
      target = req.amount;
      break;
    case 'items_collected':
      current = stats.itemsCollected;
      target = req.count;
      break;
    case 'spells_cast':
      current = req.school ? (stats.spellsCast[req.school] || 0) : stats.totalSpellsCast;
      target = req.count;
      break;
    case 'damage_dealt':
      current = stats.damageDealt;
      target = req.amount;
      break;
    case 'potions_consumed':
      current = stats.potionsConsumed;
      target = req.count;
      break;
    case 'food_consumed':
      current = stats.foodConsumed;
      target = req.count;
      break;
    case 'survival_days':
      current = stats.survivalDays;
      target = req.days;
      break;
    case 'perks_unlocked':
      current = stats.perksUnlocked;
      target = req.count;
      break;
    case 'quests_completed':
      current = stats.questsCompleted;
      target = req.count;
      break;
    case 'locations_discovered':
      current = stats.locationsDiscovered.length;
      target = req.count;
      break;
    // Add more cases as needed
    default:
      current = 0;
      target = 1;
  }

  return {
    current: Math.min(current, target),
    target,
    percent: Math.min(100, Math.round((current / target) * 100))
  };
}

// Rarity colors
export const RARITY_COLORS: Record<AchievementRarity, { bg: string; text: string; border: string }> = {
  common: { bg: 'bg-gray-700', text: 'text-gray-200', border: 'border-gray-500' },
  uncommon: { bg: 'bg-green-800', text: 'text-green-200', border: 'border-green-500' },
  rare: { bg: 'bg-blue-800', text: 'text-blue-200', border: 'border-blue-500' },
  epic: { bg: 'bg-purple-800', text: 'text-purple-200', border: 'border-purple-500' },
  legendary: { bg: 'bg-amber-700', text: 'text-amber-200', border: 'border-amber-400' },
};

// Category icons
export const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  combat: '⚔️',
  exploration: '🧭',
  crafting: '🔨',
  social: '🤝',
  survival: '🏕️',
  magic: '✨',
  stealth: '🌑',
  progression: '📈',
  collection: '💎',
  special: '🌟',
};
