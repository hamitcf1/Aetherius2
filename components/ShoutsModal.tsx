/**
 * Shouts Modal - Dragon shouts management UI
 */

import React, { useState, useMemo } from 'react';
import { X, Lock, Unlock, Zap, Clock, ChevronRight, Star, Flame, Snowflake, Wind, Shield, Eye, Skull, Volume2 } from 'lucide-react';
import {
  ShoutState,
  ShoutDefinition,
  SHOUTS,
  getAllShoutsWithStatus,
  unlockShoutWord,
  setActiveShout,
  getShoutCooldown,
} from '../services/shoutsService';

interface ShoutsModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  shoutState: ShoutState;
  onUpdateShoutState?: (state: ShoutState) => void;
  onLearnWord?: (shoutId: string, wordIndex: number) => void;
  onUnlockWord?: (shoutId: string, wordIndex: number) => void;
  onSetActiveShout?: (shoutId: string | null) => void;
  onUseShout?: (shoutId: string) => void;
}

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
  offensive: <Flame className="w-4 h-4 text-red-400" />,
  defensive: <Shield className="w-4 h-4 text-blue-400" />,
  utility: <Eye className="w-4 h-4 text-purple-400" />,
  summon: <Star className="w-4 h-4 text-yellow-400" />,
};

// Get element color for shout
function getShoutColor(shout: ShoutDefinition): string {
  if (shout.id.includes('fire') || shout.id.includes('flame')) return 'text-orange-400';
  if (shout.id.includes('frost') || shout.id.includes('ice')) return 'text-cyan-400';
  if (shout.id.includes('storm') || shout.id.includes('cyclone')) return 'text-purple-400';
  if (shout.id.includes('dragon')) return 'text-red-400';
  if (shout.id.includes('soul')) return 'text-indigo-400';
  return 'text-amber-400';
}

export default function ShoutsModal({
  isOpen,
  open,
  onClose,
  shoutState,
  onUpdateShoutState,
  onLearnWord,
  onUnlockWord,
  onSetActiveShout,
  onUseShout,
}: ShoutsModalProps) {
  const isModalOpen = isOpen ?? open ?? false;
  const [selectedShout, setSelectedShout] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'learned' | 'offensive' | 'defensive' | 'utility' | 'summon'>('all');

  // Get all shouts with status
  const shoutsWithStatus = useMemo(() => getAllShoutsWithStatus(shoutState), [shoutState]);

  // Filter shouts
  const filteredShouts = useMemo(() => {
    return shoutsWithStatus.filter(s => {
      if (filter === 'all') return true;
      if (filter === 'learned') return s.learned;
      return s.shout.category === filter;
    });
  }, [shoutsWithStatus, filter]);

  // Get selected shout details
  const selectedShoutData = useMemo(() => {
    if (!selectedShout) return null;
    return shoutsWithStatus.find(s => s.shout.id === selectedShout);
  }, [selectedShout, shoutsWithStatus]);

  // Handle unlocking a word
  const handleUnlockWord = (wordIndex: number = 0) => {
    if (!selectedShout) return;
    if (onUnlockWord) {
      onUnlockWord(selectedShout, wordIndex);
    } else if (onUpdateShoutState) {
      const result = unlockShoutWord(shoutState, selectedShout);
      if (result.success) {
        onUpdateShoutState(result.state);
      }
    }
  };

  // Handle setting active shout
  const handleSetActive = () => {
    if (!selectedShout) return;
    if (onSetActiveShout) {
      onSetActiveShout(selectedShout);
    } else if (onUpdateShoutState) {
      const newState = setActiveShout(shoutState, selectedShout);
      onUpdateShoutState(newState);
    }
  };

  // Handle using a shout
  const handleUseShout = () => {
    if (!selectedShout || !onUseShout) return;
    onUseShout(selectedShout);
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-500/20 bg-gradient-to-r from-slate-900 via-amber-900/20 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Volume2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-100">Dragon Shouts</h2>
              <p className="text-sm text-amber-200/60">Thu'um - The Way of the Voice</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Dragon Souls Counter */}
            <div className="flex items-center gap-2 bg-purple-900/40 px-3 py-1.5 rounded-lg border border-purple-500/30">
              <Zap className="w-5 h-5 text-purple-400" />
              <span className="text-purple-200 font-bold">{shoutState.dragonSouls}</span>
              <span className="text-purple-300/60 text-sm">Dragon Souls</span>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Shouts List */}
          <div className="w-1/2 border-r border-amber-500/20 flex flex-col">
            {/* Filters */}
            <div className="flex gap-1 p-2 bg-slate-800/50 border-b border-amber-500/10">
              {(['all', 'learned', 'offensive', 'defensive', 'utility', 'summon'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${
                    filter === f
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Shouts Grid */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredShouts.map(({ shout, learned, wordsLearned, wordsUnlocked, isActive, onCooldown, cooldownRemaining }) => (
                <button
                  key={shout.id}
                  onClick={() => setSelectedShout(shout.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    selectedShout === shout.id
                      ? 'bg-amber-600/30 border border-amber-500/50'
                      : learned
                      ? 'bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30'
                      : 'bg-slate-900/50 hover:bg-slate-800/50 border border-slate-700/30 opacity-60'
                  }`}
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${
                    learned ? 'bg-amber-500/20' : 'bg-slate-700/50'
                  }`}>
                    {categoryIcons[shout.category]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${learned ? 'text-amber-100' : 'text-gray-400'}`}>
                        {shout.name}
                      </span>
                      {isActive && (
                        <span className="px-1.5 py-0.5 text-xs bg-green-600/30 text-green-300 rounded">
                          Active
                        </span>
                      )}
                      {onCooldown && (
                        <span className="px-1.5 py-0.5 text-xs bg-red-600/30 text-red-300 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {cooldownRemaining}s
                        </span>
                      )}
                    </div>
                    <div className={`text-sm ${getShoutColor(shout)}`}>
                      {shout.dragonName}
                    </div>
                  </div>

                  {/* Words Progress */}
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full ${
                          i < wordsUnlocked
                            ? 'bg-amber-400'
                            : i < wordsLearned
                            ? 'bg-amber-400/30 ring-1 ring-amber-400'
                            : 'bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              ))}

              {filteredShouts.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No shouts found for this filter.
                </div>
              )}
            </div>
          </div>

          {/* Shout Details */}
          <div className="w-1/2 flex flex-col bg-slate-900/50">
            {selectedShoutData ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-amber-500/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${
                      selectedShoutData.shout.category === 'offensive'
                        ? 'from-red-900/50 to-orange-900/50'
                        : selectedShoutData.shout.category === 'defensive'
                        ? 'from-blue-900/50 to-cyan-900/50'
                        : selectedShoutData.shout.category === 'summon'
                        ? 'from-yellow-900/50 to-amber-900/50'
                        : 'from-purple-900/50 to-indigo-900/50'
                    }`}>
                      {categoryIcons[selectedShoutData.shout.category]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-amber-100">
                        {selectedShoutData.shout.name}
                      </h3>
                      <p className={`text-lg ${getShoutColor(selectedShoutData.shout)} font-semibold italic`}>
                        {selectedShoutData.shout.dragonName}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {selectedShoutData.shout.description}
                  </p>
                </div>

                {/* Words */}
                <div className="p-4 border-b border-amber-500/10">
                  <h4 className="text-sm font-semibold text-amber-200 mb-3">Words of Power</h4>
                  <div className="space-y-2">
                    {selectedShoutData.shout.words.map((word, i) => {
                      const isLearned = i < selectedShoutData.wordsLearned;
                      const isUnlocked = i < selectedShoutData.wordsUnlocked;
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            isUnlocked
                              ? 'bg-amber-600/20 border border-amber-500/30'
                              : isLearned
                              ? 'bg-purple-900/20 border border-purple-500/30'
                              : 'bg-slate-800/30 border border-slate-700/30 opacity-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isUnlocked
                              ? 'bg-amber-500 text-white'
                              : isLearned
                              ? 'bg-purple-600/50 text-purple-200'
                              : 'bg-slate-700 text-gray-500'
                          }`}>
                            {isUnlocked ? (
                              <Unlock className="w-4 h-4" />
                            ) : isLearned ? (
                              <Zap className="w-4 h-4" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${
                                isUnlocked ? 'text-amber-100' : isLearned ? 'text-purple-200' : 'text-gray-500'
                              }`}>
                                {word}
                              </span>
                              <span className={`text-sm ${
                                isUnlocked ? 'text-amber-200/60' : isLearned ? 'text-purple-300/60' : 'text-gray-600'
                              }`}>
                                ({selectedShoutData.shout.translations[i]})
                              </span>
                            </div>
                            <p className={`text-xs ${
                              isUnlocked ? 'text-gray-300' : isLearned ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {selectedShoutData.shout.effects[i]}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs ${
                              isUnlocked ? 'text-amber-300' : 'text-gray-500'
                            }`}>
                              Cooldown: {selectedShoutData.shout.cooldowns[i]}s
                            </div>
                            {selectedShoutData.shout.damage && (
                              <div className="text-xs text-red-400">
                                Damage: {selectedShoutData.shout.damage[i]}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Word Locations */}
                {selectedShoutData.shout.wordLocations && (
                  <div className="p-4 border-b border-amber-500/10">
                    <h4 className="text-sm font-semibold text-amber-200 mb-2">Word Wall Locations</h4>
                    <div className="space-y-1">
                      {selectedShoutData.shout.wordLocations.map((loc, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                            i < selectedShoutData.wordsLearned
                              ? 'bg-green-600/50 text-green-200'
                              : 'bg-slate-700 text-gray-500'
                          }`}>
                            {i + 1}
                          </span>
                          <span className={
                            i < selectedShoutData.wordsLearned ? 'text-gray-300' : 'text-gray-500'
                          }>
                            {loc || '???'}
                          </span>
                          {i < selectedShoutData.wordsLearned && (
                            <span className="text-green-400 text-xs">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="p-4 mt-auto flex gap-2">
                  {selectedShoutData.learned && selectedShoutData.wordsUnlocked < selectedShoutData.wordsLearned && (
                    <button
                      onClick={handleUnlockWord}
                      disabled={shoutState.dragonSouls < 1}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-colors ${
                        shoutState.dragonSouls >= 1
                          ? 'bg-purple-600 hover:bg-purple-500 text-white'
                          : 'bg-slate-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      Unlock Next Word (1 Soul)
                    </button>
                  )}

                  {selectedShoutData.wordsUnlocked > 0 && (
                    <>
                      <button
                        onClick={handleSetActive}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-colors ${
                          selectedShoutData.isActive
                            ? 'bg-green-700 text-green-100'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                        }`}
                      >
                        {selectedShoutData.isActive ? '✓ Active Shout' : 'Set as Active'}
                      </button>

                      {onUseShout && (
                        <button
                          onClick={handleUseShout}
                          disabled={selectedShoutData.onCooldown}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-colors ${
                            selectedShoutData.onCooldown
                              ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-500 text-white'
                          }`}
                        >
                          <Volume2 className="w-4 h-4" />
                          {selectedShoutData.onCooldown
                            ? `Cooldown (${selectedShoutData.cooldownRemaining}s)`
                            : 'Use Shout'}
                        </button>
                      )}
                    </>
                  )}

                  {!selectedShoutData.learned && (
                    <div className="flex-1 text-center text-gray-500 py-2.5">
                      Find a Word Wall to learn this shout
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Volume2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Select a shout to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
