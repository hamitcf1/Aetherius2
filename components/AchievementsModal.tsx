import React, { useState, useMemo } from 'react';
import ModalWrapper from './ModalWrapper';
import { 
  Achievement, 
  AchievementState, 
  AchievementCategory, 
  AchievementRarity,
  ACHIEVEMENTS, 
  RARITY_COLORS, 
  CATEGORY_ICONS,
  getAchievementProgress,
  collectAchievementReward
} from '../services/achievementsService';
import { Character } from '../types';
import { Trophy, Gift, Lock, CheckCircle, Star, Filter, Search, X } from 'lucide-react';

interface AchievementsModalProps {
  open: boolean;
  onClose: () => void;
  achievementState: AchievementState;
  character: Character;
  onCollectReward: (achievementId: string) => void;
  showToast?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  refreshAchievements?: () => void;
}

const AchievementsModal: React.FC<AchievementsModalProps> = ({
  open,
  onClose,
  achievementState,
  character,
  onCollectReward,
  showToast
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | 'all'>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [showLockedOnly, setShowLockedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter(achievement => {
      // Hidden achievements only shown if unlocked
      if (achievement.hidden && !achievementState.unlockedAchievements[achievement.id]) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
        return false;
      }

      // Rarity filter
      if (selectedRarity !== 'all' && achievement.rarity !== selectedRarity) {
        return false;
      }

      // Unlocked/Locked filter
      const isUnlocked = !!achievementState.unlockedAchievements[achievement.id];
      if (showUnlockedOnly && !isUnlocked) return false;
      if (showLockedOnly && isUnlocked) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!achievement.name.toLowerCase().includes(query) && 
            !achievement.description.toLowerCase().includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [selectedCategory, selectedRarity, showUnlockedOnly, showLockedOnly, searchQuery, achievementState]);

  // Stats
  const totalAchievements = ACHIEVEMENTS.filter(a => !a.hidden || achievementState.unlockedAchievements[a.id]).length;
  const unlockedCount = Object.keys(achievementState.unlockedAchievements).length;
  const collectedCount = Object.values(achievementState.unlockedAchievements).filter((a: { unlockedAt: number; collected: boolean }) => a.collected).length;
  const uncollectedCount = unlockedCount - collectedCount;

  const handleCollect = (achievementId: string) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;

    onCollectReward(achievementId);
    
    const reward = achievement.reward;
    const rewardParts: string[] = [];
    if (reward.gold) rewardParts.push(`${reward.gold} gold`);
    if (reward.xp) rewardParts.push(`${reward.xp} XP`);
    if (reward.perkPoint) rewardParts.push(`${reward.perkPoint} perk point(s)`);
    if (reward.title) rewardParts.push(`title: ${reward.title}`);
    if (reward.item) rewardParts.push(`item: ${reward.item.name}`);

    showToast?.(`Collected reward: ${rewardParts.join(', ')}!`, 'success');
  };

  const categories: (AchievementCategory | 'all')[] = ['all', 'progression', 'combat', 'exploration', 'magic', 'stealth', 'crafting', 'collection', 'survival', 'social', 'special'];
  const rarities: (AchievementRarity | 'all')[] = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'];

  return (
    <ModalWrapper open={open} onClose={onClose} zIndex="z-[80]">
      <div className="bg-skyrim-dark border-2 border-skyrim-gold rounded-lg w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-skyrim-border bg-gradient-to-r from-skyrim-paper/20 to-transparent">
          <div className="flex items-center gap-3">
            <Trophy className="text-skyrim-gold" size={28} />
            <div>
              <h2 className="text-2xl font-serif text-skyrim-gold">Achievements</h2>
              <p className="text-xs text-skyrim-text/60">{unlockedCount}/{totalAchievements} unlocked • {uncollectedCount} rewards pending</p>
            </div>
            {/* Refresh achievements manual trigger */}
            <div className="ml-4">
              <button
                onClick={() => { refreshAchievements && refreshAchievements(); showToast && showToast('Achievements refreshed', 'success'); }}
                className="ml-2 px-3 py-1 bg-skyrim-paper/20 text-skyrim-text/70 rounded text-sm hover:bg-skyrim-paper/30"
              >
                Refresh
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-skyrim-paper/20 rounded transition-colors">
            <X size={20} className="text-skyrim-text/70" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-skyrim-border/50 bg-skyrim-paper/5 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-skyrim-text/50" />
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-skyrim-dark/50 border border-skyrim-border rounded px-9 py-2 text-sm text-skyrim-text placeholder:text-skyrim-text/40 focus:outline-none focus:border-skyrim-gold"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} className="text-skyrim-text/50 hover:text-skyrim-text" />
              </button>
            )}
          </div>

          {/* Category & Rarity filters */}
          <div className="flex flex-wrap gap-2">
            {/* Categories */}
            <div className="flex gap-1 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-skyrim-gold text-skyrim-dark font-semibold' 
                      : 'bg-skyrim-paper/20 text-skyrim-text/70 hover:bg-skyrim-paper/30'
                  }`}
                >
                  {cat === 'all' ? '🎯 All' : `${CATEGORY_ICONS[cat]} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Rarity filter */}
            <div className="flex gap-1">
              {rarities.map(rarity => (
                <button
                  key={rarity}
                  onClick={() => setSelectedRarity(rarity)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedRarity === rarity 
                      ? rarity === 'all' 
                        ? 'bg-skyrim-gold text-skyrim-dark font-semibold'
                        : `${RARITY_COLORS[rarity].bg} ${RARITY_COLORS[rarity].text} font-semibold`
                      : 'bg-skyrim-paper/20 text-skyrim-text/70 hover:bg-skyrim-paper/30'
                  }`}
                >
                  {rarity === 'all' ? 'All Rarities' : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => { setShowUnlockedOnly(!showUnlockedOnly); setShowLockedOnly(false); }}
                className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                  showUnlockedOnly ? 'bg-green-600 text-white' : 'bg-skyrim-paper/20 text-skyrim-text/70 hover:bg-skyrim-paper/30'
                }`}
              >
                <CheckCircle size={12} /> Unlocked
              </button>
              <button
                onClick={() => { setShowLockedOnly(!showLockedOnly); setShowUnlockedOnly(false); }}
                className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                  showLockedOnly ? 'bg-red-600 text-white' : 'bg-skyrim-paper/20 text-skyrim-text/70 hover:bg-skyrim-paper/30'
                }`}
              >
                <Lock size={12} /> Locked
              </button>
            </div>
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredAchievements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-skyrim-text/50">
              <Trophy size={48} className="mb-2 opacity-30" />
              <p>No achievements found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAchievements.map(achievement => {
                const isUnlocked = !!achievementState.unlockedAchievements[achievement.id];
                const isCollected = achievementState.unlockedAchievements[achievement.id]?.collected;
                const progress = getAchievementProgress(achievement, achievementState.stats, character);
                const colors = RARITY_COLORS[achievement.rarity];

                return (
                  <div
                    key={achievement.id}
                    onClick={() => setSelectedAchievement(achievement)}
                    className={`
                      relative p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${isUnlocked 
                        ? `${colors.border} ${colors.bg}/30 hover:${colors.bg}/50` 
                        : 'border-skyrim-border/50 bg-skyrim-paper/5 opacity-70 hover:opacity-90'
                      }
                    `}
                  >
                    {/* Icon and Name */}
                    <div className="flex items-start gap-3">
                      <div className={`text-3xl ${!isUnlocked ? 'grayscale opacity-50' : ''}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold truncate ${isUnlocked ? colors.text : 'text-skyrim-text/70'}`}>
                            {achievement.name}
                          </h3>
                          {isUnlocked && !isCollected && (
                            <Gift size={14} className="text-yellow-400 animate-pulse flex-shrink-0" />
                          )}
                          {isUnlocked && isCollected && (
                            <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-skyrim-text/60 line-clamp-2">{achievement.description}</p>
                        
                        {/* Rarity badge */}
                        <span className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] rounded ${colors.bg} ${colors.text}`}>
                          {achievement.rarity.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar for locked achievements */}
                    {!isUnlocked && (
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-skyrim-text/50 mb-1">
                          <span>{progress.current}/{progress.target}</span>
                          <span>{progress.percent}%</span>
                        </div>
                        <div className="h-1.5 bg-skyrim-dark rounded overflow-hidden">
                          <div 
                            className={`h-full ${colors.bg} transition-all`}
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Collect button for unlocked but not collected */}
                    {isUnlocked && !isCollected && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCollect(achievement.id); }}
                        className="mt-2 w-full py-1.5 bg-gradient-to-r from-yellow-600 to-amber-500 text-white text-sm font-semibold rounded hover:from-yellow-500 hover:to-amber-400 transition-all flex items-center justify-center gap-2"
                      >
                        <Gift size={14} /> Collect Reward
                      </button>
                    )}

                    {/* Lock overlay for locked */}
                    {!isUnlocked && (
                      <div className="absolute top-2 right-2">
                        <Lock size={14} className="text-skyrim-text/30" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievement Detail Modal */}
        {selectedAchievement && (
          <div 
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60"
            onClick={() => setSelectedAchievement(null)}
          >
            <div 
              className="bg-skyrim-paper p-6 rounded-lg border-2 border-skyrim-gold max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const achievement = selectedAchievement;
                const isUnlocked = !!achievementState.unlockedAchievements[achievement.id];
                const isCollected = achievementState.unlockedAchievements[achievement.id]?.collected;
                const progress = getAchievementProgress(achievement, achievementState.stats, character);
                const colors = RARITY_COLORS[achievement.rarity];

                return (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`text-5xl ${!isUnlocked ? 'grayscale opacity-50' : ''}`}>
                        {achievement.icon}
                      </div>
                      <div>
                        <h3 className={`text-xl font-serif ${isUnlocked ? colors.text : 'text-skyrim-text'}`}>
                          {achievement.name}
                        </h3>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded ${colors.bg} ${colors.text}`}>
                          {achievement.rarity.toUpperCase()}
                        </span>
                        <span className="ml-2 text-xs text-skyrim-text/60">
                          {CATEGORY_ICONS[achievement.category]} {achievement.category}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-skyrim-text mb-2">{achievement.description}</p>
                    {achievement.longDescription && (
                      <p className="text-xs text-skyrim-text/60 mb-4">{achievement.longDescription}</p>
                    )}

                    {/* Progress */}
                    {!isUnlocked && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-skyrim-text/70 mb-1">
                          <span>Progress</span>
                          <span>{progress.current}/{progress.target} ({progress.percent}%)</span>
                        </div>
                        <div className="h-3 bg-skyrim-dark rounded overflow-hidden">
                          <div 
                            className={`h-full ${colors.bg}`}
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Rewards */}
                    <div className="p-3 rounded bg-skyrim-dark/30 mb-4">
                      <h4 className="text-sm font-semibold text-skyrim-gold mb-2 flex items-center gap-2">
                        <Gift size={14} /> Rewards
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {achievement.reward.gold && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            💰 {achievement.reward.gold} Gold
                          </div>
                        )}
                        {achievement.reward.xp && (
                          <div className="flex items-center gap-1 text-purple-400">
                            ✨ {achievement.reward.xp} XP
                          </div>
                        )}
                        {achievement.reward.perkPoint && (
                          <div className="flex items-center gap-1 text-green-400">
                            🌟 {achievement.reward.perkPoint} Perk Point(s)
                          </div>
                        )}
                        {achievement.reward.title && (
                          <div className="flex items-center gap-1 text-cyan-400">
                            👑 Title: {achievement.reward.title}
                          </div>
                        )}
                        {achievement.reward.item && (
                          <div className="flex items-center gap-1 text-amber-400">
                            📦 {achievement.reward.item.name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {isUnlocked && !isCollected && (
                        <button
                          onClick={() => { handleCollect(achievement.id); setSelectedAchievement(null); }}
                          className="flex-1 py-2 bg-gradient-to-r from-yellow-600 to-amber-500 text-white font-semibold rounded hover:from-yellow-500 hover:to-amber-400 transition-all flex items-center justify-center gap-2"
                        >
                          <Gift size={16} /> Collect Reward
                        </button>
                      )}
                      {isCollected && (
                        <div className="flex-1 py-2 bg-green-600/30 text-green-400 text-center rounded flex items-center justify-center gap-2">
                          <CheckCircle size={16} /> Reward Collected
                        </div>
                      )}
                      {!isUnlocked && (
                        <div className="flex-1 py-2 bg-skyrim-dark/50 text-skyrim-text/50 text-center rounded flex items-center justify-center gap-2">
                          <Lock size={16} /> Locked
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedAchievement(null)}
                        className="px-4 py-2 border border-skyrim-border text-skyrim-text rounded hover:bg-skyrim-paper/20"
                      >
                        Close
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};

export default AchievementsModal;
