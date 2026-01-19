/**
 * Bounty Modal - Crime and bounty management UI
 */

import React, { useState, useMemo } from 'react';
import { X, AlertTriangle, Coins, Lock, Shield, Skull, MapPin, Clock, Ban, Unlock } from 'lucide-react';
import {
  BountyState,
  HoldName,
  HOLDS,
  CRIME_BOUNTIES,
  getBountyStatus,
  getMostWantedHold,
  payBounty,
  bribeGuard,
  goToJail,
  serveJailTime,
  attemptJailEscape,
} from '../services/bountyService';

interface BountyModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  bountyState: BountyState;
  onUpdateState?: (state: BountyState) => void;
  playerGold: number;
  onSpendGold?: (amount: number) => void;
  onPayBounty?: (holdId: string) => void;
  onBribeGuard?: (holdId: string) => void;
  onGoToJail?: (holdId: string) => void;
  onServeTime?: () => void;
  onEscape?: () => void;
  speechSkill?: number;
  lockpickingSkill?: number;
  sneakSkill?: number;
}

// Hold colors
const holdColors: Record<HoldName, string> = {
  Whiterun: 'from-yellow-900/30 to-yellow-950/30 border-yellow-500/30',
  Solitude: 'from-blue-900/30 to-blue-950/30 border-blue-500/30',
  Windhelm: 'from-cyan-900/30 to-cyan-950/30 border-cyan-500/30',
  Riften: 'from-purple-900/30 to-purple-950/30 border-purple-500/30',
  Markarth: 'from-stone-800/30 to-stone-950/30 border-stone-500/30',
  Morthal: 'from-teal-900/30 to-teal-950/30 border-teal-500/30',
  Dawnstar: 'from-slate-800/30 to-slate-950/30 border-slate-500/30',
  Winterhold: 'from-indigo-900/30 to-indigo-950/30 border-indigo-500/30',
  Falkreath: 'from-green-900/30 to-green-950/30 border-green-500/30',
};

export default function BountyModal({
  isOpen,
  open,
  onClose,
  bountyState,
  onUpdateState,
  playerGold,
  onSpendGold,
  onPayBounty,
  onBribeGuard,
  onGoToJail,
  onServeTime,
  onEscape,
  speechSkill = 15,
  lockpickingSkill = 15,
  sneakSkill = 15,
}: BountyModalProps) {
  const isModalOpen = isOpen ?? open ?? false;
  const [selectedHold, setSelectedHold] = useState<HoldName | null>(null);
  const [showJailOptions, setShowJailOptions] = useState(false);

  // Get bounty status for all holds
  const bountyStatus = useMemo(() => getBountyStatus(bountyState), [bountyState]);

  // Get most wanted hold
  const mostWantedHold = useMemo(() => getMostWantedHold(bountyState), [bountyState]);

  // Get selected hold data
  const selectedHoldData = useMemo(() => {
    if (!selectedHold) return null;
    return bountyState.holds[selectedHold];
  }, [selectedHold, bountyState]);

  // Handle paying bounty
  const handlePayBounty = () => {
    if (!selectedHold) return;
    if (onPayBounty) {
      onPayBounty(selectedHold);
    } else if (onUpdateState && onSpendGold) {
      const result = payBounty(bountyState, selectedHold, playerGold);
      if (result.success) {
        onSpendGold(result.goldSpent);
        onUpdateState(result.state);
      }
    }
  };

  // Handle bribe
  const handleBribe = () => {
    if (!selectedHold) return;
    if (onBribeGuard) {
      onBribeGuard(selectedHold);
    } else if (onUpdateState && onSpendGold) {
      const result = bribeGuard(bountyState, selectedHold, playerGold, speechSkill);
      if (result.success) {
        onSpendGold(result.goldSpent);
      }
      onUpdateState(result.state);
    }
  };

  // Handle going to jail
  const handleGoToJail = () => {
    if (!selectedHold) return;
    if (onGoToJail) {
      onGoToJail(selectedHold);
    } else if (onUpdateState) {
      const result = goToJail(bountyState, selectedHold);
      onUpdateState(result.state);
    }
    setShowJailOptions(false);
  };

  // Handle serving time
  const handleServeTime = () => {
    if (onServeTime) {
      onServeTime();
    } else if (onUpdateState) {
      const result = serveJailTime(bountyState);
      onUpdateState(result.state);
    }
  };

  // Handle escape attempt
  const handleEscape = () => {
    if (onEscape) {
      onEscape();
    } else if (onUpdateState) {
      const result = attemptJailEscape(bountyState, lockpickingSkill, sneakSkill);
      onUpdateState(result.state);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-red-500/30 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-red-500/20 bg-gradient-to-r from-slate-900 via-red-900/20 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-100">Bounty & Crime</h2>
              <p className="text-sm text-red-200/60">
                Total Bounty: <span className="text-red-300 font-semibold">{bountyState.totalBounty} gold</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {bountyState.currentlyWanted && (
              <div className="flex items-center gap-2 bg-red-900/40 px-3 py-1.5 rounded-lg border border-red-500/30 animate-pulse">
                <Skull className="w-4 h-4 text-red-400" />
                <span className="text-red-200 text-sm font-semibold">WANTED</span>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Jail Status Banner */}
        {bountyState.isInJail && bountyState.jailHold && (
          <div className="p-4 bg-orange-900/30 border-b border-orange-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-orange-400" />
                <div>
                  <p className="text-orange-100 font-semibold">
                    You are imprisoned in {bountyState.jailHold}
                  </p>
                  <p className="text-sm text-orange-200/60">
                    Days remaining: {bountyState.jailDaysRemaining}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleServeTime}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors"
                >
                  Serve Time
                </button>
                <button
                  onClick={handleEscape}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  Attempt Escape
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Holds List */}
          <div className="w-1/2 border-r border-red-500/20 flex flex-col">
            <div className="p-3 bg-slate-800/50 border-b border-red-500/10">
              <h3 className="text-sm font-semibold text-red-200">Holds of Skyrim</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {bountyStatus.map(({ hold, bounty, crimes, isWanted }) => (
                <button
                  key={hold}
                  onClick={() => setSelectedHold(hold)}
                  disabled={bountyState.isInJail}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    selectedHold === hold
                      ? `bg-gradient-to-r ${holdColors[hold]} border`
                      : 'bg-slate-800/30 hover:bg-slate-700/30 border border-transparent'
                  } ${bountyState.isInJail ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <MapPin className={`w-5 h-5 ${isWanted ? 'text-red-400' : 'text-gray-500'}`} />
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-100">{hold}</span>
                      {hold === mostWantedHold && bounty > 0 && (
                        <span className="px-1.5 py-0.5 text-xs bg-red-600/30 text-red-300 rounded">
                          Most Wanted
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{HOLDS[hold].motto}</p>
                  </div>

                  {bounty > 0 ? (
                    <div className="text-right">
                      <p className="text-red-400 font-bold">{bounty}g</p>
                      <p className="text-xs text-gray-500">{crimes} crime{crimes !== 1 ? 's' : ''}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-green-400">Clean</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Hold Details */}
          <div className="w-1/2 flex flex-col bg-slate-900/50">
            {selectedHoldData && selectedHold ? (
              <>
                {/* Header */}
                <div className={`p-4 border-b border-red-500/10 bg-gradient-to-r ${holdColors[selectedHold]}`}>
                  <h3 className="text-xl font-bold text-gray-100">{selectedHold}</h3>
                  <p className="text-sm text-gray-300">
                    Ruled by {HOLDS[selectedHold].jarl}
                  </p>
                </div>

                {/* Bounty Amount */}
                <div className="p-4 border-b border-red-500/10">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Current Bounty</span>
                    <span className={`text-2xl font-bold ${
                      selectedHoldData.bounty > 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {selectedHoldData.bounty} gold
                    </span>
                  </div>
                </div>

                {/* Crime History */}
                {selectedHoldData.crimes.length > 0 && (
                  <div className="p-4 border-b border-red-500/10 flex-1 overflow-y-auto">
                    <h4 className="text-sm font-semibold text-red-200 mb-3">Active Crimes</h4>
                    <div className="space-y-2">
                      {selectedHoldData.crimes.map(crime => (
                        <div
                          key={crime.id}
                          className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg"
                        >
                          <Ban className="w-4 h-4 text-red-400" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-200">
                              {CRIME_BOUNTIES[crime.type].name}
                            </p>
                            {crime.victim && (
                              <p className="text-xs text-gray-500">Victim: {crime.victim}</p>
                            )}
                          </div>
                          <span className="text-red-400 text-sm font-semibold">
                            +{crime.bounty}g
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div className="p-4 border-b border-red-500/10 bg-slate-800/30">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lifetime Bounty:</span>
                      <span className="text-gray-300">{selectedHoldData.lifetimeBounty}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Times Jailed:</span>
                      <span className="text-gray-300">{selectedHoldData.jailServings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bribes Used:</span>
                      <span className="text-gray-300">{selectedHoldData.bribesUsed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Escapes:</span>
                      <span className="text-gray-300">{selectedHoldData.escapesAttempted}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedHoldData.bounty > 0 && (
                  <div className="p-4 space-y-2">
                    <button
                      onClick={handlePayBounty}
                      disabled={playerGold < selectedHoldData.bounty}
                      className={`w-full py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                        playerGold >= selectedHoldData.bounty
                          ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                          : 'bg-slate-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      Pay Bounty ({selectedHoldData.bounty}g)
                    </button>

                    <button
                      onClick={handleBribe}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Coins className="w-4 h-4" />
                      Try to Bribe Guard
                    </button>

                    <button
                      onClick={handleGoToJail}
                      className="w-full py-2.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Go to Jail
                    </button>
                  </div>
                )}

                {selectedHoldData.bounty === 0 && (
                  <div className="p-4 flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Shield className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>You have no bounty in {selectedHold}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Select a hold to view bounty details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="p-3 border-t border-red-500/20 bg-slate-800/30 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              Total Crimes: <span className="text-gray-200">{bountyState.totalCrimes}</span>
            </span>
            <span className="text-gray-400">
              Your Gold: <span className="text-yellow-400 font-semibold">{playerGold}g</span>
            </span>
          </div>
          {bountyState.activelyPursued && (
            <span className="text-red-400 animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Guards are pursuing you!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
