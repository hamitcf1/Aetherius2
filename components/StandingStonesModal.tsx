/**
 * Standing Stones Modal - Standing stone blessing selection UI
 */

import React, { useState, useMemo } from 'react';
import { X, Star, Shield, Wand2, Eye, MapPin, Sparkles, Check, Clock, Swords, BookOpen, Footprints } from 'lucide-react';
import {
  StandingStoneState,
  StandingStone,
  StandingStoneType,
  STANDING_STONES,
  getAllStandingStonesWithStatus,
  getStonesByGuardian,
  activateStandingStone,
  useStandingStonePower,
} from '../services/standingStoneService';

interface StandingStonesModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  standingStoneState: StandingStoneState;
  onUpdateState?: (state: StandingStoneState) => void;
  onDiscoverStone?: (stoneId: string) => void;
  onActivateStone?: (stoneId: string) => void;
  onUsePower?: () => void;
  currentGameTime?: number;
}

// Guardian icons
const guardianIcons: Record<string, React.ReactNode> = {
  warrior: <Swords className="w-5 h-5 text-red-400" />,
  mage: <Wand2 className="w-5 h-5 text-blue-400" />,
  thief: <Footprints className="w-5 h-5 text-green-400" />,
};

// Guardian colors
const guardianColors: Record<string, string> = {
  warrior: 'from-red-900/40 to-red-950/40 border-red-500/30',
  mage: 'from-blue-900/40 to-blue-950/40 border-blue-500/30',
  thief: 'from-green-900/40 to-green-950/40 border-green-500/30',
};

// Stone icons based on effect type
function getStoneIcon(stone: StandingStone): React.ReactNode {
  if (stone.specialPower) return <Sparkles className="w-6 h-6" />;
  if (stone.skillBoosts) return <BookOpen className="w-6 h-6" />;
  if (stone.attributeBoosts) return <Shield className="w-6 h-6" />;
  return <Star className="w-6 h-6" />;
}

export default function StandingStonesModal({
  isOpen,
  open,
  onClose,
  standingStoneState,
  onUpdateState,
  onDiscoverStone,
  onActivateStone,
  onUsePower,
  currentGameTime = 0,
}: StandingStonesModalProps) {
  const isModalOpen = isOpen ?? open ?? false;
  const [selectedStone, setSelectedStone] = useState<StandingStoneType | null>(
    standingStoneState.activeStone
  );
  const [filter, setFilter] = useState<'all' | 'warrior' | 'mage' | 'thief' | 'discovered'>('all');

  // Get all stones with status
  const stonesWithStatus = useMemo(() => 
    getAllStandingStonesWithStatus(standingStoneState),
    [standingStoneState]
  );

  // Filter stones
  const filteredStones = useMemo(() => {
    return stonesWithStatus.filter(({ stone, discovered }) => {
      if (filter === 'all') return true;
      if (filter === 'discovered') return discovered;
      return stone.guardian === filter;
    });
  }, [stonesWithStatus, filter]);

  // Get selected stone details
  const selectedStoneData = useMemo(() => {
    if (!selectedStone) return null;
    return stonesWithStatus.find(s => s.stone.id === selectedStone);
  }, [selectedStone, stonesWithStatus]);

  // Handle activating a stone
  const handleActivate = () => {
    if (!selectedStone) return;
    if (onActivateStone) {
      onActivateStone(selectedStone);
    } else if (onUpdateState) {
      const result = activateStandingStone(standingStoneState, selectedStone);
      if (result.success) {
        onUpdateState(result.state);
      }
    }
  };

  // Handle using power
  const handleUsePower = () => {
    if (onUsePower) {
      onUsePower();
    } else if (onUpdateState) {
      const result = useStandingStonePower(standingStoneState, currentGameTime);
      if (result.success) {
        onUpdateState(result.state);
      }
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 via-cyan-900/20 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Star className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-cyan-100">Standing Stones</h2>
              <p className="text-sm text-cyan-200/60">
                {standingStoneState.activeStone 
                  ? `Active: ${STANDING_STONES[standingStoneState.activeStone].name}`
                  : 'No stone active'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-cyan-900/30 px-3 py-1.5 rounded-lg border border-cyan-500/30">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-200 text-sm">
                {standingStoneState.discoveredStones.length} / 13 Discovered
              </span>
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
          {/* Stones List */}
          <div className="w-1/2 border-r border-cyan-500/20 flex flex-col">
            {/* Filters */}
            <div className="flex gap-1 p-2 bg-slate-800/50 border-b border-cyan-500/10">
              {(['all', 'warrior', 'mage', 'thief', 'discovered'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded-md capitalize transition-colors flex items-center gap-1 ${
                    filter === f
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {f !== 'all' && f !== 'discovered' && guardianIcons[f]}
                  {f}
                </button>
              ))}
            </div>

            {/* Stones Grid */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredStones.map(({ stone, discovered, active }) => (
                <button
                  key={stone.id}
                  onClick={() => setSelectedStone(stone.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    selectedStone === stone.id
                      ? `bg-gradient-to-r ${guardianColors[stone.guardian]} border`
                      : discovered
                      ? 'bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30'
                      : 'bg-slate-900/50 hover:bg-slate-800/50 border border-slate-700/30 opacity-50'
                  }`}
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${
                    active ? 'bg-cyan-500/30' :
                    discovered ? 'bg-slate-700/50' : 'bg-slate-800/50'
                  }`}>
                    <span className={
                      active ? 'text-cyan-300' :
                      stone.guardian === 'warrior' ? 'text-red-400' :
                      stone.guardian === 'mage' ? 'text-blue-400' : 'text-green-400'
                    }>
                      {getStoneIcon(stone)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${discovered ? 'text-gray-100' : 'text-gray-500'}`}>
                        {stone.name}
                      </span>
                      {active && (
                        <span className="px-1.5 py-0.5 text-xs bg-cyan-600/30 text-cyan-300 rounded flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      {guardianIcons[stone.guardian]}
                      <span className="capitalize">{stone.guardian} Stone</span>
                    </div>
                  </div>

                  {/* Discovery status */}
                  {!discovered && (
                    <span className="text-xs text-gray-600">Undiscovered</span>
                  )}
                </button>
              ))}

              {filteredStones.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No stones found for this filter.
                </div>
              )}
            </div>
          </div>

          {/* Stone Details */}
          <div className="w-1/2 flex flex-col bg-slate-900/50">
            {selectedStoneData ? (
              <>
                {/* Header */}
                <div className={`p-4 border-b border-cyan-500/10 bg-gradient-to-r ${guardianColors[selectedStoneData.stone.guardian]}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-3 rounded-lg bg-slate-900/50`}>
                      <span className={
                        selectedStoneData.stone.guardian === 'warrior' ? 'text-red-400' :
                        selectedStoneData.stone.guardian === 'mage' ? 'text-blue-400' : 'text-green-400'
                      }>
                        {getStoneIcon(selectedStoneData.stone)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-100">
                        {selectedStoneData.stone.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        {guardianIcons[selectedStoneData.stone.guardian]}
                        <span>Guardian: The {selectedStoneData.stone.guardian.charAt(0).toUpperCase() + selectedStoneData.stone.guardian.slice(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="p-4 border-b border-cyan-500/10 bg-slate-800/30">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span className="text-gray-300">{selectedStoneData.stone.location}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 border-b border-cyan-500/10">
                  <p className="text-gray-300">{selectedStoneData.stone.description}</p>
                </div>

                {/* Effects */}
                <div className="p-4 border-b border-cyan-500/10 flex-1 overflow-y-auto">
                  <h4 className="text-sm font-semibold text-cyan-200 mb-3">Effects</h4>
                  <div className="space-y-2">
                    {selectedStoneData.stone.effects.map((effect, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg"
                      >
                        {effect.type === 'skill_boost' && <BookOpen className="w-4 h-4 text-yellow-400" />}
                        {effect.type === 'attribute_boost' && <Shield className="w-4 h-4 text-blue-400" />}
                        {effect.type === 'passive' && <Sparkles className="w-4 h-4 text-purple-400" />}
                        {effect.type === 'power' && <Star className="w-4 h-4 text-cyan-400" />}
                        {effect.type === 'ability' && <Eye className="w-4 h-4 text-green-400" />}
                        <span className="text-gray-200 text-sm">{effect.description}</span>
                      </div>
                    ))}
                  </div>

                  {/* Lore */}
                  <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-gray-400 italic">
                      "{selectedStoneData.stone.lore}"
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 space-y-2">
                  {selectedStoneData.active ? (
                    <>
                      <div className="flex items-center justify-center gap-2 py-2 bg-cyan-900/30 text-cyan-300 rounded-lg">
                        <Check className="w-4 h-4" />
                        Currently Active
                      </div>
                      
                      {selectedStoneData.stone.specialPower && (
                        <button
                          onClick={handleUsePower}
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Use {selectedStoneData.stone.specialPower.name}
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={handleActivate}
                      disabled={!selectedStoneData.discovered}
                      className={`w-full py-2.5 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        selectedStoneData.discovered
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                          : 'bg-slate-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                      {selectedStoneData.discovered 
                        ? 'Activate This Stone'
                        : 'Visit the stone to activate'
                      }
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Star className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Select a standing stone to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
