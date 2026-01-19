/**
 * Transformation Modal
 * 
 * Manages werewolf and vampire transformations, powers, and perk trees.
 */

import React, { useState, useMemo } from 'react';
import { X, Moon, Droplet, Skull, Zap, Shield, Heart, Timer, Crown, Eye, Users, Wind } from 'lucide-react';
import {
  TransformationState,
  WEREWOLF_PERKS,
  VAMPIRE_PERKS,
  VAMPIRE_STAGE_EFFECTS,
  WerewolfPerk,
  VampirePerk,
  getTransformationBonuses
} from '../services/transformationService';

interface TransformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  transformationState: TransformationState;
  gameTimeHours: number;
  onTransformWerewolf: () => void;
  onRevertWerewolf: () => void;
  onFeedWerewolf: () => void;
  onUnlockWerewolfPerk: (perkId: string) => void;
  onTransformVampireLord: () => void;
  onRevertVampireLord: () => void;
  onFeedVampire: () => void;
  onUnlockVampirePerk: (perkId: string) => void;
  onSeekCure: () => void;
}

const TransformationModal: React.FC<TransformationModalProps> = ({
  isOpen,
  onClose,
  transformationState,
  gameTimeHours,
  onTransformWerewolf,
  onRevertWerewolf,
  onFeedWerewolf,
  onUnlockWerewolfPerk,
  onTransformVampireLord,
  onRevertVampireLord,
  onFeedVampire,
  onUnlockVampirePerk,
  onSeekCure
}) => {
  const [selectedPerk, setSelectedPerk] = useState<WerewolfPerk | VampirePerk | null>(null);
  const [activeTab, setActiveTab] = useState<'powers' | 'perks'>('powers');

  // Get current bonuses
  const bonuses = useMemo(() => 
    getTransformationBonuses(transformationState), 
    [transformationState]
  );

  // Check if it's daytime (roughly 6am to 8pm)
  const isDaytime = gameTimeHours >= 6 && gameTimeHours < 20;

  if (!isOpen) return null;

  // No transformation
  if (!transformationState.type) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-gradient-to-b from-gray-900 to-gray-950 border-2 border-gray-700/50 rounded-lg shadow-2xl w-full max-w-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-200">Transformations</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded">
              <X className="text-gray-400" size={24} />
            </button>
          </div>
          <div className="text-center py-12">
            <Moon className="mx-auto mb-4 text-gray-600" size={64} />
            <p className="text-gray-400 text-lg">You have no afflictions.</p>
            <p className="text-gray-500 text-sm mt-2">
              Seek out the Companions in Whiterun for the beast blood,<br/>
              or encounter vampires for their dark gift.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Werewolf UI
  if (transformationState.type === 'werewolf' && transformationState.werewolf) {
    const ww = transformationState.werewolf;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-gradient-to-b from-gray-900 via-red-950/20 to-gray-950 border-2 border-red-800/50 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-red-800/30 bg-black/40">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-900/50 rounded-full">
                🐺
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-200">Beast Blood</h2>
                <p className="text-sm text-gray-400">
                  Feedings: {ww.feedingCount} | 
                  {ww.active ? ' 🔴 Beast Form Active' : ' Dormant'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded">
              <X className="text-gray-400" size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-red-800/30">
            <button
              onClick={() => setActiveTab('powers')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'powers'
                  ? 'bg-red-900/30 text-red-200 border-b-2 border-red-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Powers
            </button>
            <button
              onClick={() => setActiveTab('perks')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'perks'
                  ? 'bg-red-900/30 text-red-200 border-b-2 border-red-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Perk Tree ({ww.unlockedPerks.length}/{Object.keys(WEREWOLF_PERKS).length})
            </button>
          </div>

          <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
            {activeTab === 'powers' ? (
              <div className="space-y-4">
                {/* Transform Button */}
                <div className="p-4 bg-black/30 rounded-lg border border-red-800/30">
                  <h3 className="text-lg font-bold text-red-200 mb-3">Beast Form</h3>
                  {ww.active ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-amber-300">
                        <Timer size={18} />
                        <span>Time Remaining: {Math.floor(ww.beastFormDuration / 60)}:{(ww.beastFormDuration % 60).toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={onFeedWerewolf}
                          className="flex-1 px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Skull size={18} />
                          Feed on Corpse
                        </button>
                        <button
                          onClick={onRevertWerewolf}
                          className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          Revert Form
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={onTransformWerewolf}
                      disabled={ww.transformCooldown}
                      className="w-full px-4 py-3 bg-red-800 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Moon size={20} />
                      Transform to Beast Form
                    </button>
                  )}
                  {ww.transformCooldown && !ww.active && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      ⏳ The beast within needs time to recover...
                    </p>
                  )}
                </div>

                {/* Current Bonuses */}
                {ww.active && (
                  <div className="p-4 bg-red-900/20 rounded-lg border border-red-800/30">
                    <h3 className="text-sm font-bold text-red-300 mb-2 uppercase">Active Bonuses</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Heart className="text-red-400" size={16} />
                        <span className="text-gray-300">+{bonuses.health} Health</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="text-amber-400" size={16} />
                        <span className="text-gray-300">+{bonuses.stamina} Stamina</span>
                      </div>
                      {bonuses.damage > 0 && (
                        <div className="flex items-center gap-2">
                          <Skull className="text-red-400" size={16} />
                          <span className="text-gray-300">+{bonuses.damage}% Damage</span>
                        </div>
                      )}
                    </div>
                    {bonuses.specialAbilities.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-red-800/30">
                        <p className="text-xs text-gray-500 mb-1">Special Abilities:</p>
                        <div className="flex flex-wrap gap-1">
                          {bonuses.specialAbilities.map((ability, i) => (
                            <span key={i} className="px-2 py-0.5 bg-red-900/30 text-red-300 text-xs rounded">
                              {ability}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Howl Powers */}
                <div className="p-4 bg-black/30 rounded-lg border border-red-800/30">
                  <h3 className="text-sm font-bold text-red-300 mb-3 uppercase">Howl Powers</h3>
                  <div className="space-y-2">
                    <div className="p-2 bg-gray-800/50 rounded flex items-center gap-3">
                      <span className="text-2xl">🗣️</span>
                      <div>
                        <p className="text-gray-200 font-medium">Howl of Terror</p>
                        <p className="text-xs text-gray-500">Fear nearby enemies, causing them to flee</p>
                      </div>
                    </div>
                    {ww.unlockedPerks.includes('totem_of_ice_brothers') && (
                      <div className="p-2 bg-cyan-900/30 rounded flex items-center gap-3 border border-cyan-700/30">
                        <span className="text-2xl">❄️</span>
                        <div>
                          <p className="text-cyan-200 font-medium">Howl of the Pack (Ice Brothers)</p>
                          <p className="text-xs text-cyan-400/70">Summon ice wolves to fight alongside you</p>
                        </div>
                      </div>
                    )}
                    {ww.unlockedPerks.includes('totem_of_the_hunt') && (
                      <div className="p-2 bg-green-900/30 rounded flex items-center gap-3 border border-green-700/30">
                        <span className="text-2xl">👁️</span>
                        <div>
                          <p className="text-green-200 font-medium">Howl of the Pack (Hunt)</p>
                          <p className="text-xs text-green-400/70">Detect all creatures in the area</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cure Option */}
                <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                  <button
                    onClick={onSeekCure}
                    className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    💀 Seek to cure lycanthropy (requires Glenmoril witch heads)
                  </button>
                </div>
              </div>
            ) : (
              /* Perk Tree */
              <div className="space-y-2">
                {Object.values(WEREWOLF_PERKS).map(perk => {
                  const isUnlocked = ww.unlockedPerks.includes(perk.id);
                  const hasReqs = perk.requiredPerks.every(p => ww.unlockedPerks.includes(p));
                  const hasFeedings = ww.feedingCount >= perk.requiredFeedings;
                  const canUnlock = hasReqs && hasFeedings && !isUnlocked;

                  return (
                    <div
                      key={perk.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isUnlocked
                          ? 'bg-red-900/40 border-red-500/50'
                          : canUnlock
                          ? 'bg-red-900/20 border-red-700/50 hover:border-red-500/50'
                          : 'bg-gray-800/30 border-gray-700/30 opacity-60'
                      }`}
                      onClick={() => setSelectedPerk(perk)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={isUnlocked ? 'text-red-400' : 'text-gray-500'}>
                            {isUnlocked ? '✓' : '○'}
                          </span>
                          <span className={isUnlocked ? 'text-red-200 font-medium' : 'text-gray-400'}>
                            {perk.name}
                          </span>
                        </div>
                        {!isUnlocked && (
                          <span className="text-xs text-gray-500">
                            {perk.requiredFeedings} feedings
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-6">{perk.description}</p>
                      {canUnlock && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onUnlockWerewolfPerk(perk.id); }}
                          className="mt-2 ml-6 px-3 py-1 bg-red-700 text-white text-xs rounded hover:bg-red-600"
                        >
                          Unlock
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vampire UI
  if ((transformationState.type === 'vampire' || transformationState.type === 'vampire_lord') && transformationState.vampire) {
    const vamp = transformationState.vampire;
    const stageEffect = VAMPIRE_STAGE_EFFECTS[vamp.stage];
    const isVampireLord = transformationState.type === 'vampire_lord';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-gradient-to-b from-gray-900 via-purple-950/20 to-gray-950 border-2 border-purple-800/50 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-purple-800/30 bg-black/40">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-900/50 rounded-full">
                🧛
              </div>
              <div>
                <h2 className="text-2xl font-bold text-purple-200">
                  {isVampireLord ? 'Vampire Lord' : 'Sanguinare Vampiris'}
                </h2>
                <p className="text-sm text-gray-400">
                  Stage {vamp.stage}: {stageEffect.name} |
                  {vamp.vampireLordActive ? ' 🦇 Lord Form Active' : ' Mortal Guise'}
                  {isVampireLord && ` | Lord Level: ${Math.floor(vamp.vampireLordLevel)}`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded">
              <X className="text-gray-400" size={24} />
            </button>
          </div>

          {/* Sun Warning */}
          {isDaytime && (
            <div className="px-4 py-2 bg-orange-900/30 border-b border-orange-700/30 flex items-center gap-2 text-orange-300 text-sm">
              <span>☀️</span>
              <span>Daylight! Health, Magicka and Stamina do not regenerate in sunlight.</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-purple-800/30">
            <button
              onClick={() => setActiveTab('powers')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'powers'
                  ? 'bg-purple-900/30 text-purple-200 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Powers & Status
            </button>
            {isVampireLord && (
              <button
                onClick={() => setActiveTab('perks')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'perks'
                    ? 'bg-purple-900/30 text-purple-200 border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Vampire Lord Perks ({vamp.unlockedPerks.length}/{Object.keys(VAMPIRE_PERKS).length})
              </button>
            )}
          </div>

          <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            {activeTab === 'powers' ? (
              <div className="space-y-4">
                {/* Stage Status */}
                <div className="p-4 bg-black/30 rounded-lg border border-purple-800/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-purple-200">Blood Hunger</h3>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(s => (
                        <div
                          key={s}
                          className={`w-8 h-2 rounded ${
                            s <= vamp.stage ? 'bg-red-600' : 'bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">{stageEffect.description}</p>
                  <button
                    onClick={onFeedVampire}
                    className="w-full px-4 py-2 bg-red-900 text-red-100 rounded hover:bg-red-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Droplet size={18} />
                    Feed on Sleeping Victim
                  </button>
                </div>

                {/* Vampire Lord Transform (if available) */}
                {isVampireLord && (
                  <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-800/30">
                    <h3 className="text-lg font-bold text-purple-200 mb-3">Vampire Lord Form</h3>
                    {vamp.vampireLordActive ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Heart className="text-red-400" size={16} />
                            <span className="text-gray-300">+{bonuses.health} Health</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="text-purple-400" size={16} />
                            <span className="text-gray-300">+{bonuses.magicka} Magicka</span>
                          </div>
                        </div>
                        <button
                          onClick={onRevertVampireLord}
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                        >
                          Revert to Mortal Form
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={onTransformVampireLord}
                        className="w-full px-4 py-3 bg-purple-800 text-white rounded hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Crown size={20} />
                        Transform to Vampire Lord
                      </button>
                    )}
                  </div>
                )}

                {/* Stage Effects */}
                <div className="p-4 bg-black/30 rounded-lg border border-purple-800/30">
                  <h3 className="text-sm font-bold text-purple-300 mb-3 uppercase">Current Effects</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="text-cyan-400" size={16} />
                      <span className="text-gray-300">+{stageEffect.resistFrost}% Frost Resist</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="text-red-400" size={16} />
                      <span className="text-red-300">-{stageEffect.weakFire}% Fire Weakness</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="text-purple-400" size={16} />
                      <span className="text-gray-300">+{stageEffect.illusion} Illusion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind className="text-gray-400" size={16} />
                      <span className="text-gray-300">+{stageEffect.sneak}% Sneak</span>
                    </div>
                  </div>
                </div>

                {/* Vampire Powers */}
                <div className="p-4 bg-black/30 rounded-lg border border-purple-800/30">
                  <h3 className="text-sm font-bold text-purple-300 mb-3 uppercase">Vampire Powers</h3>
                  <div className="space-y-2">
                    <div className="p-2 bg-gray-800/50 rounded flex items-center gap-3">
                      <span className="text-2xl">👁️</span>
                      <div>
                        <p className="text-gray-200 font-medium">Vampire's Sight</p>
                        <p className="text-xs text-gray-500">Night vision for 60 seconds</p>
                      </div>
                    </div>
                    <div className="p-2 bg-gray-800/50 rounded flex items-center gap-3">
                      <span className="text-2xl">🩸</span>
                      <div>
                        <p className="text-gray-200 font-medium">Vampiric Drain</p>
                        <p className="text-xs text-gray-500">Absorb health from targets</p>
                      </div>
                    </div>
                    {stageEffect.vampireSeduction && (
                      <div className="p-2 bg-purple-900/30 rounded flex items-center gap-3 border border-purple-700/30">
                        <span className="text-2xl">💋</span>
                        <div>
                          <p className="text-purple-200 font-medium">Vampire's Seduction</p>
                          <p className="text-xs text-purple-400/70">Calm targets to feed on them</p>
                        </div>
                      </div>
                    )}
                    {stageEffect.embraceShadows && (
                      <div className="p-2 bg-purple-900/30 rounded flex items-center gap-3 border border-purple-700/30">
                        <span className="text-2xl">🌑</span>
                        <div>
                          <p className="text-purple-200 font-medium">Embrace of Shadows</p>
                          <p className="text-xs text-purple-400/70">Become invisible for 180 seconds</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cure Option */}
                <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                  <button
                    onClick={onSeekCure}
                    className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    ☀️ Seek to cure vampirism (speak to Falion in Morthal)
                  </button>
                </div>
              </div>
            ) : (
              /* Vampire Lord Perk Tree */
              <div className="space-y-4">
                {/* Magic Tree */}
                <div>
                  <h3 className="text-sm font-bold text-purple-300 mb-2">Magic Perks</h3>
                  <div className="space-y-2">
                    {Object.values(VAMPIRE_PERKS).filter(p => p.tree === 'magic').map(perk => {
                      const isUnlocked = vamp.unlockedPerks.includes(perk.id);
                      const hasReqs = perk.requiredPerks.every(p => vamp.unlockedPerks.includes(p));
                      const hasLevel = Math.floor(vamp.vampireLordLevel) >= perk.requiredLevel;
                      const canUnlock = hasReqs && hasLevel && !isUnlocked;

                      return (
                        <div
                          key={perk.id}
                          className={`p-3 rounded-lg border transition-all ${
                            isUnlocked
                              ? 'bg-purple-900/40 border-purple-500/50'
                              : canUnlock
                              ? 'bg-purple-900/20 border-purple-700/50 hover:border-purple-500/50'
                              : 'bg-gray-800/30 border-gray-700/30 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={isUnlocked ? 'text-purple-400' : 'text-gray-500'}>
                                {isUnlocked ? '✓' : '○'}
                              </span>
                              <span className={isUnlocked ? 'text-purple-200 font-medium' : 'text-gray-400'}>
                                {perk.name}
                              </span>
                            </div>
                            {!isUnlocked && (
                              <span className="text-xs text-gray-500">
                                Level {perk.requiredLevel}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-6">{perk.description}</p>
                          {canUnlock && (
                            <button
                              onClick={() => onUnlockVampirePerk(perk.id)}
                              className="mt-2 ml-6 px-3 py-1 bg-purple-700 text-white text-xs rounded hover:bg-purple-600"
                            >
                              Unlock
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Melee Tree */}
                <div>
                  <h3 className="text-sm font-bold text-red-300 mb-2">Melee Perks</h3>
                  <div className="space-y-2">
                    {Object.values(VAMPIRE_PERKS).filter(p => p.tree === 'melee').map(perk => {
                      const isUnlocked = vamp.unlockedPerks.includes(perk.id);
                      const hasReqs = perk.requiredPerks.every(p => vamp.unlockedPerks.includes(p));
                      const hasLevel = Math.floor(vamp.vampireLordLevel) >= perk.requiredLevel;
                      const canUnlock = hasReqs && hasLevel && !isUnlocked;

                      return (
                        <div
                          key={perk.id}
                          className={`p-3 rounded-lg border transition-all ${
                            isUnlocked
                              ? 'bg-red-900/40 border-red-500/50'
                              : canUnlock
                              ? 'bg-red-900/20 border-red-700/50 hover:border-red-500/50'
                              : 'bg-gray-800/30 border-gray-700/30 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={isUnlocked ? 'text-red-400' : 'text-gray-500'}>
                                {isUnlocked ? '✓' : '○'}
                              </span>
                              <span className={isUnlocked ? 'text-red-200 font-medium' : 'text-gray-400'}>
                                {perk.name}
                              </span>
                            </div>
                            {!isUnlocked && (
                              <span className="text-xs text-gray-500">
                                Level {perk.requiredLevel}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-6">{perk.description}</p>
                          {canUnlock && (
                            <button
                              onClick={() => onUnlockVampirePerk(perk.id)}
                              className="mt-2 ml-6 px-3 py-1 bg-red-700 text-white text-xs rounded hover:bg-red-600"
                            >
                              Unlock
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TransformationModal;
