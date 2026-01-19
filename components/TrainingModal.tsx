/**
 * Skill Training Modal
 * 
 * Allows players to train skills with NPCs for gold, up to 5 times per level.
 */

import React, { useState, useMemo } from 'react';
import { X, GraduationCap, Coins, ChevronRight, Star, MapPin, Users } from 'lucide-react';
import { 
  Trainer, 
  TrainingState, 
  TRAINERS, 
  calculateTrainingCost,
  canTrain,
  SkillName
} from '../services/trainingService';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainingState: TrainingState;
  playerGold: number;
  playerLevel: number;
  playerSkills: Record<string, number>;
  currentLocation?: string;
  playerFactions?: string[];
  onTrain: (trainerId: string) => void;
}

// Skill categories for filtering
const SKILL_CATEGORIES: Record<string, SkillName[]> = {
  'Combat': ['OneHanded', 'TwoHanded', 'Archery', 'Block', 'HeavyArmor', 'Smithing'],
  'Magic': ['Alteration', 'Conjuration', 'Destruction', 'Enchanting', 'Illusion', 'Restoration'],
  'Stealth': ['Alchemy', 'LightArmor', 'Lockpicking', 'Pickpocket', 'Sneak', 'Speech']
};

// Format skill name for display
const formatSkillName = (skill: string): string => {
  return skill.replace(/([A-Z])/g, ' $1').trim();
};

// Get skill color based on category
const getSkillColor = (skill: SkillName): string => {
  if (SKILL_CATEGORIES['Combat'].includes(skill)) return 'text-red-400';
  if (SKILL_CATEGORIES['Magic'].includes(skill)) return 'text-blue-400';
  if (SKILL_CATEGORIES['Stealth'].includes(skill)) return 'text-green-400';
  return 'text-gray-400';
};

// Get category icon
const getCategoryIcon = (skill: SkillName): string => {
  if (SKILL_CATEGORIES['Combat'].includes(skill)) return '⚔️';
  if (SKILL_CATEGORIES['Magic'].includes(skill)) return '✨';
  if (SKILL_CATEGORIES['Stealth'].includes(skill)) return '🗡️';
  return '📚';
};

const TrainingModal: React.FC<TrainingModalProps> = ({
  isOpen,
  onClose,
  trainingState,
  playerGold,
  playerLevel,
  playerSkills,
  currentLocation,
  playerFactions = [],
  onTrain
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Calculate remaining trainings
  const trainingsRemaining = useMemo(() => {
    if (trainingState.lastTrainedLevel < playerLevel) {
      return 5; // Reset on level up
    }
    return Math.max(0, 5 - trainingState.trainingsThisLevel);
  }, [trainingState, playerLevel]);

  // Filter trainers based on selected category and player access
  const filteredTrainers = useMemo(() => {
    let trainers = Object.values(TRAINERS);
    
    if (selectedCategory && SKILL_CATEGORIES[selectedCategory]) {
      trainers = trainers.filter(t => SKILL_CATEGORIES[selectedCategory].includes(t.skill));
    }
    
    // Sort by skill level requirement and location relevance
    return trainers.sort((a, b) => {
      // Prioritize nearby trainers
      const aLocal = currentLocation && a.location.toLowerCase().includes(currentLocation.toLowerCase());
      const bLocal = currentLocation && b.location.toLowerCase().includes(currentLocation.toLowerCase());
      if (aLocal && !bLocal) return -1;
      if (bLocal && !aLocal) return 1;
      
      // Then by max training level
      return a.maxTrainingLevel - b.maxTrainingLevel;
    });
  }, [selectedCategory, currentLocation]);

  // Check if player can train with selected trainer
  const canTrainWithSelected = useMemo(() => {
    if (!selectedTrainer) return { canTrain: false, reason: 'No trainer selected' };
    
    const skillLevel = playerSkills[selectedTrainer.skill] || 15;
    return canTrain(
      trainingState,
      playerLevel,
      skillLevel,
      selectedTrainer.maxTrainingLevel,
      playerGold
    );
  }, [selectedTrainer, trainingState, playerLevel, playerSkills, playerGold]);

  // Calculate training cost for selected trainer
  const trainingCost = useMemo(() => {
    if (!selectedTrainer) return 0;
    const skillLevel = playerSkills[selectedTrainer.skill] || 15;
    return calculateTrainingCost(skillLevel, playerLevel);
  }, [selectedTrainer, playerSkills, playerLevel]);

  const handleTrain = () => {
    if (!selectedTrainer || !canTrainWithSelected.canTrain) return;
    onTrain(selectedTrainer.id);
    setShowConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 border-2 border-amber-700/50 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-700/30 bg-black/30">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-amber-400" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-amber-200">Skill Training</h2>
              <p className="text-sm text-gray-400">
                Trainings remaining this level: <span className="text-amber-400 font-bold">{trainingsRemaining}/5</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-900/30 rounded border border-amber-700/30">
              <Coins className="text-amber-400" size={18} />
              <span className="text-amber-200 font-bold">{playerGold.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded transition-colors"
            >
              <X className="text-gray-400" size={24} />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Left Panel - Categories & Trainers */}
          <div className="w-1/2 border-r border-amber-700/30 overflow-y-auto">
            {/* Category Filter */}
            <div className="p-3 bg-black/20 border-b border-amber-700/20">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    selectedCategory === null
                      ? 'bg-amber-700 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {Object.keys(SKILL_CATEGORIES).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-amber-700 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Trainer List */}
            <div className="p-2">
              {filteredTrainers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No trainers available in this category.
                </div>
              ) : (
                filteredTrainers.map(trainer => {
                  const skillLevel = playerSkills[trainer.skill] || 15;
                  const isMaxed = skillLevel >= trainer.maxTrainingLevel;
                  const isSelected = selectedTrainer?.id === trainer.id;
                  const cost = calculateTrainingCost(skillLevel, playerLevel);
                  const canAfford = playerGold >= cost;
                  const isNearby = currentLocation && trainer.location.toLowerCase().includes(currentLocation.toLowerCase());
                  const isFactionMember = trainer.faction && playerFactions.includes(trainer.faction);

                  return (
                    <button
                      key={trainer.id}
                      onClick={() => setSelectedTrainer(trainer)}
                      className={`w-full p-3 mb-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'bg-amber-800/40 border-2 border-amber-500'
                          : isMaxed
                          ? 'bg-gray-800/30 border border-gray-700/50 opacity-60'
                          : 'bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800/80 hover:border-amber-700/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCategoryIcon(trainer.skill)}</span>
                            <span className="font-bold text-amber-200">{trainer.name}</span>
                            {isNearby && (
                              <span className="px-1.5 py-0.5 bg-green-900/50 text-green-300 text-xs rounded">
                                Nearby
                              </span>
                            )}
                            {isFactionMember && (
                              <span className="px-1.5 py-0.5 bg-purple-900/50 text-purple-300 text-xs rounded">
                                <Users size={10} className="inline mr-1" />
                                Faction
                              </span>
                            )}
                          </div>
                          <div className={`text-sm ${getSkillColor(trainer.skill)}`}>
                            {formatSkillName(trainer.skill)} (up to {trainer.maxTrainingLevel})
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <MapPin size={10} />
                            {trainer.location}
                          </div>
                        </div>
                        <div className="text-right">
                          {!isMaxed && (
                            <div className={`text-sm font-bold ${canAfford ? 'text-amber-400' : 'text-red-400'}`}>
                              {cost.toLocaleString()} gold
                            </div>
                          )}
                          {isMaxed && (
                            <div className="text-xs text-gray-500">
                              Level exceeded
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            Your level: {skillLevel}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel - Trainer Details */}
          <div className="w-1/2 p-4 overflow-y-auto">
            {selectedTrainer ? (
              <div className="space-y-4">
                {/* Trainer Portrait/Info */}
                <div className="text-center p-4 bg-black/30 rounded-lg border border-amber-700/30">
                  <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-amber-800 to-amber-900 rounded-full flex items-center justify-center text-4xl">
                    {getCategoryIcon(selectedTrainer.skill)}
                  </div>
                  <h3 className="text-xl font-bold text-amber-200">{selectedTrainer.name}</h3>
                  <p className={`text-sm ${getSkillColor(selectedTrainer.skill)}`}>
                    {formatSkillName(selectedTrainer.skill)} Trainer
                  </p>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-1">
                    <MapPin size={12} />
                    {selectedTrainer.location}
                  </div>
                </div>

                {/* Training Level Range */}
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Training Range</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => {
                        const threshold = [25, 50, 75, 90, 100][i];
                        const filled = selectedTrainer.maxTrainingLevel >= threshold;
                        return (
                          <Star
                            key={i}
                            size={20}
                            className={filled ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}
                          />
                        );
                      })}
                    </div>
                    <span className="text-amber-200 font-bold">
                      Up to level {selectedTrainer.maxTrainingLevel}
                    </span>
                  </div>
                </div>

                {/* Dialogue */}
                <div className="p-4 bg-gray-800/30 rounded-lg border-l-4 border-amber-700 italic text-gray-300">
                  "{selectedTrainer.dialogue.greeting}"
                </div>

                {/* Your Skill Status */}
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">Your {formatSkillName(selectedTrainer.skill)}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all"
                          style={{ 
                            width: `${Math.min(100, ((playerSkills[selectedTrainer.skill] || 15) / 100) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-amber-200 font-bold text-lg">
                      {playerSkills[selectedTrainer.skill] || 15}
                    </span>
                  </div>
                </div>

                {/* Training Cost & Action */}
                <div className="p-4 bg-black/40 rounded-lg border border-amber-700/30">
                  {canTrainWithSelected.canTrain ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-300">Training Cost:</span>
                        <span className="text-xl font-bold text-amber-400">
                          {trainingCost.toLocaleString()} gold
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                        <span>After training:</span>
                        <span className="text-green-400 font-bold">
                          {formatSkillName(selectedTrainer.skill)} {(playerSkills[selectedTrainer.skill] || 15) + 1}
                        </span>
                      </div>
                      {showConfirm ? (
                        <div className="space-y-2">
                          <p className="text-center text-gray-300 text-sm mb-3">
                            Train {formatSkillName(selectedTrainer.skill)} with {selectedTrainer.name}?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowConfirm(false)}
                              className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleTrain}
                              className="flex-1 px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-600 transition-colors font-bold flex items-center justify-center gap-2"
                            >
                              <GraduationCap size={18} />
                              Train
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowConfirm(true)}
                          disabled={trainingsRemaining === 0}
                          className="w-full px-4 py-3 bg-amber-700 text-white rounded hover:bg-amber-600 transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <GraduationCap size={20} />
                          Begin Training
                          <ChevronRight size={20} />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-red-400 mb-2">⚠️ Cannot Train</div>
                      <p className="text-sm text-gray-400">{canTrainWithSelected.reason}</p>
                    </div>
                  )}
                </div>

                {/* Training Tips */}
                <div className="text-xs text-gray-500 text-center">
                  💡 Training costs increase with skill level. You can train up to 5 times per character level.
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <GraduationCap size={48} className="mb-4 opacity-50" />
                <p>Select a trainer to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingModal;
