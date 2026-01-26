/**
 * CombatModal - Pokemon-style turn-based combat UI
 * Full-screen combat interface with health bars, abilities, and action log
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { waitMs } from '../utils/animation';
import { 
  Character, 
  InventoryItem, 
  CombatState, 
  CombatEnemy,
  CombatAbility,
  PlayerCombatStats,
  CombatActionType,
  EquipmentSlot
} from '../types';
import {
  calculatePlayerCombatStats,
  executePlayerAction,
  executeEnemyTurn,
  executeCompanionAction,
  skipActorTurn,
  advanceTurn,
  applyTurnRegen,
  checkCombatEnd,
  combatHasActiveSummon,
  getCombatPerkBonus,
  getPerkRank
} from '../services/combatService';
import { LootModal } from './LootModal';
import { populatePendingLoot, finalizeLoot } from '../services/lootService';
import { BASE_PATH } from '../services/basePath';
import { getEasterEggName } from './GameFeatures';
import { EquipmentHUD, getDefaultSlotForItem } from './EquipmentHUD';
import { LoadoutManager } from './LoadoutManager';
import ModalWrapper from './ModalWrapper';
import { audioService } from '../services/audioService';
import ArrowPicker from './ArrowPicker';
import { getItemBaseAndBonus } from '../services/upgradeService';
import { getItemRestorationValues } from '../services/nutritionData';
import { getSpellEffectType, SpellEffectState, ScreenFlash, ParticleEffect, EnergyRing, LightningBolt, HolyLight, PortalRift, ArcEffect } from './SpellEffects';
import '../styles/combat-badges.css';
// resolvePotionEffect is intentionally not used here; potion resolution occurs in services

// Play combat sound based on action type and actor info (enemy/ally/player)
const playCombatSound = (
  actionType: 'melee' | 'ranged' | 'magic' | 'shout' | 'block' | 'shield_bash' | 'hit' | 'enemy_death',
  actor?: any,
  ability?: CombatAbility
) => {
  // Helper to inspect actor name/description for elemental or creature hints
  const actorText = (actor?.name || '') + ' ' + (actor?.description || '');
  const abilityText = (ability?.name || '') + ' ' + (ability?.description || '') + ' ' + JSON.stringify(ability?.effects || []);
  const combined = (actorText + ' ' + abilityText).toLowerCase();
  const isSummon = !!actor?.companionMeta?.isSummon || !!actor?.companionMeta?.isSummon;

  const looksLikeFire = /fire|flame|ember|pyro|ignis|lava|burn/i.test(combined);
  const looksLikeIce = /frost|ice|cold|chill|glacier|freeze/i.test(combined);
  const looksLikeShock = /shock|storm|lightning|thunder|electr|bolt/i.test(combined);
  const looksLikeWolf = /wolf|hound|dog|warg/i.test(combined);
  const looksLikeBear = /bear|paw|claw|talon|sabre|saber/i.test(combined);

  try {
    if (actionType === 'magic' || actionType === 'shout') {
      // If the ability explicitly looks elemental, prefer the elemental impact sounds
      if (looksLikeFire) return audioService.playSoundEffect('spell_impact_fire');
      if (looksLikeIce) return audioService.playSoundEffect('spell_impact_ice');
      if (looksLikeShock) return audioService.playSoundEffect('spell_impact_shock');
      return audioService.playSoundEffect('attack_magic');
    }

    if (actionType === 'melee' || actionType === 'ranged') {
      // Prefer creature-specific sounds for companions/beasts
      if (looksLikeWolf) return audioService.playSoundEffect('attack_bite');
      if (looksLikeBear) return audioService.playSoundEffect('attack_claw');

      // For summoned elementals, use elemental attack sounds
      if (isSummon || looksLikeFire || looksLikeIce || looksLikeShock) {
        if (looksLikeFire) return audioService.playSoundEffect('attack_fire');
        if (looksLikeIce) return audioService.playSoundEffect('attack_ice');
        if (looksLikeShock) return audioService.playSoundEffect('attack_shock');
      }

      // Fallbacks
      if (actionType === 'ranged') return audioService.playSoundEffect('attack_ranged');
      return audioService.playSoundEffect('attack_melee');
    }

    if (actionType === 'block') return audioService.playSoundEffect('block');
    if (actionType === 'shield_bash') return audioService.playSoundEffect('shield_bash');
    if (actionType === 'hit') return audioService.playSoundEffect('hit_received');
    if (actionType === 'enemy_death') return audioService.playSoundEffect('enemy_death');
  } catch (e) {
    console.warn('Failed to play combat sound', e);
  }
};

interface CombatModalProps {
  character: Character;
  inventory: InventoryItem[];
  initialCombatState: CombatState;
  onCombatEnd: (result: 'victory' | 'defeat' | 'fled' | 'surrendered', rewards?: {
    xp: number;
    gold: number;
    items: Array<{ name: string; type: string; description: string; quantity: number }>;
  }, finalVitals?: { health: number; magicka: number; stamina: number }, timeAdvanceMinutes?: number, combatResult?: any) => void;
  onNarrativeUpdate?: (narrative: string) => void;
  onInventoryUpdate?: (items: InventoryItem[] | Array<{ name: string; quantity: number }>) => void;
  showToast?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

// Health bar component - memoized to prevent re-renders when values don't change
const HealthBar = React.memo<{
  current: number;
  max: number;
  label: string;
  color: string;
  showNumbers?: boolean;
  isHealing?: boolean;
}>(({ current, max, label, color, showNumbers = true, isHealing = false }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-amber-200/80">{label}</span>
        {showNumbers && <span className="text-amber-200/60">{current}/{max}</span>}
      </div>
      <div className="h-3 bg-stone-900/80 rounded-full overflow-hidden border border-stone-700">
        <div 
          className={`h-full transition-all duration-500 ${isHealing ? 'bg-green-400 animate-pulse' : color}`}
          style={{ width: `${percentage}%` }}
        />
        {isHealing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-green-300 text-lg animate-bounce">✨</span>
          </div>
        )}
      </div>
    </div>
  );
});

// Turn List component - displays turn order with all entities
const TurnList: React.FC<{
  turnOrder: string[];
  currentTurnActor: string;
  player: { name: string; currentHealth: number; maxHealth: number };
  enemies: CombatEnemy[];
  allies: CombatEnemy[];
  className?: string;
}> = ({ turnOrder, currentTurnActor, player, enemies, allies, className }) => {
  // Build a list of all participants with their status
  const participants = turnOrder.map(id => {
    if (id === 'player') {
      return {
        id: 'player',
        name: player.name,
        type: 'player' as const,
        isCurrentTurn: currentTurnActor === 'player',
        isDead: player.currentHealth <= 0,
        isSummon: false,
        summonTurnsRemaining: undefined as number | undefined,
        healthPercent: Math.round((player.currentHealth / player.maxHealth) * 100)
      };
    }
    
    const ally = allies.find(a => a.id === id);
    if (ally) {
      const isSummon = !!ally.companionMeta?.isSummon;
      // Summon decay is tracked via activeEffects with type 'summon_decay'
      const decayEffect = (ally.activeEffects || []).find((e: any) => e.effect?.type === 'summon_decay');
      return {
        id: ally.id,
        name: ally.name,
        type: 'ally' as const,
        isCurrentTurn: currentTurnActor === ally.id,
        isDead: ally.currentHealth <= 0,
        isSummon,
        summonTurnsRemaining: decayEffect?.turnsRemaining,
        healthPercent: Math.round((ally.currentHealth / ally.maxHealth) * 100)
      };
    }
    
    const enemy = enemies.find(e => e.id === id);
    if (enemy) {
      return {
        id: enemy.id,
        name: enemy.name,
        type: 'enemy' as const,
        isCurrentTurn: currentTurnActor === enemy.id,
        isDead: enemy.currentHealth <= 0,
        isSummon: false,
        summonTurnsRemaining: undefined,
        healthPercent: Math.round((enemy.currentHealth / enemy.maxHealth) * 100)
      };
    }
    
    // Unknown actor (shouldn't happen, but handle gracefully)
    return null;
  }).filter(Boolean);

  return (
    <div className={`bg-stone-900/60 rounded-lg p-3 border border-stone-700 ${className || ''}`}>
      <h4 className="text-xs font-bold text-stone-400 mb-2 border-b border-stone-700 pb-1">TURN ORDER</h4>
      <div className="flex flex-col gap-1 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin scrollbar-thumb-stone-700">
        {participants.map((p, idx) => {
          if (!p) return null;
          const isPlayer = p.type === 'player';
          const isAlly = p.type === 'ally';
          const isEnemy = p.type === 'enemy';
          
          const baseClasses = `p-2 rounded text-xs font-medium flex items-center gap-2 transition-all w-full relative overflow-hidden`;
          const typeClasses = 
            isPlayer ? 'bg-green-900/20 border-green-800' :
            isAlly ? 'bg-sky-900/20 border-sky-800' :
            'bg-red-900/20 border-red-800';
          const stateClasses = 
            p.isDead ? 'opacity-40 grayscale' :
            p.isCurrentTurn ? `${isPlayer ? 'bg-green-900/40 border-green-500' : isAlly ? 'bg-sky-900/40 border-sky-500' : 'bg-red-900/40 border-red-500'} ring-1 ring-amber-400/50` : 'border-stone-800';
          
          return (
            <div 
              key={`${p.id}-${idx}`} 
              data-testid={`participant-${p.id}`}
              className={`${baseClasses} ${typeClasses} ${stateClasses} border`}
              title={`${p.name} (${p.healthPercent}% HP)`}
            >
              {/* Number */}
              <div className="flex flex-col items-center justify-center min-w-[20px] text-[10px] text-stone-500 font-bold border-r border-stone-700/50 pr-2 mr-1">
                 <span>{idx + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                     <span className={`truncate font-bold ${p.isDead ? 'line-through decoration-stone-500' : ''} ${isPlayer ? 'text-green-200' : isAlly ? 'text-sky-200' : 'text-red-200'}`}>
                        {p.name}
                     </span>
                     {p.isCurrentTurn && !p.isDead && <span className="text-amber-400 animate-pulse text-[10px]">◀</span>}
                     {p.isDead && <span className="text-stone-500 text-[10px]">💀</span>}
                  </div>
                  {/* Summon duration indicator */}
                  {p.isSummon && p.summonTurnsRemaining !== undefined && !p.isDead && (
                    <div className="text-[9px] text-purple-300 mt-0.5">
                      {p.summonTurnsRemaining} turns left
                    </div>
                  )}
                  
                  {/* Mini Health Bar */}
                  <div className="h-1 bg-stone-900 mt-1 rounded-full overflow-hidden w-full opacity-70">
                    <div 
                       className={`h-full ${isPlayer ? 'bg-green-500' : isAlly ? 'bg-sky-500' : 'bg-red-500'}`} 
                       style={{ width: `${p.healthPercent}%` }}
                    />
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Enemy card component
const EnemyCard: React.FC<{
  enemy: CombatEnemy & { pendingTurns?: number };
  isTarget: boolean;
  onClick: () => void;
  containerRef?: (el: HTMLDivElement | null) => void;
  isHighlighted?: boolean;
  isCurrentTurn?: boolean;
  onToggleAutoControl?: () => void;
}> = ({ enemy, isTarget, onClick, containerRef, isHighlighted, isCurrentTurn, onToggleAutoControl }) => {
  const healthPercent = (enemy.currentHealth / enemy.maxHealth) * 100;
  const isDead = enemy.currentHealth <= 0;
  const isDecaying = !!(enemy as any).companionMeta?.decayActive;
  
  return (
    <div 
      ref={containerRef}
      data-testid={`enemy-card-${enemy.id}`}
      onClick={isDead ? undefined : onClick}
      className={`
        relative p-3 rounded-lg border-2 transition-all duration-300
        ${isDead 
          ? 'bg-stone-900/50 border-stone-700 opacity-50 cursor-not-allowed' 
          : isTarget 
            ? 'bg-red-900/40 border-red-500 cursor-pointer ring-2 ring-red-400/50' 
            : 'bg-stone-800/60 border-stone-600 cursor-pointer hover:border-amber-500/50'
        }
        ${isHighlighted ? 'ring-4 ring-amber-300/40 animate-pulse' : ''}
        ${isCurrentTurn ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-400/30' : ''}
      `}
    >
      {/* Boss indicator */}
      {enemy.isBoss && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-purple-600 rounded text-xs font-bold">
          BOSS
        </div>
      )}
      
      {/* Turn indicator arrow (SKY-55) */}
      {isCurrentTurn && !isDead && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-amber-400 animate-pulse text-lg">
          ▶
        </div>
      )}
      
      {/* Enemy name and type */}
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <h4 data-testid={`enemy-name-${enemy.id}`} className={`font-bold ${isDead ? 'text-stone-500 line-through' : 'text-amber-100'}`}>
            {enemy.name}
          </h4>
          {/* Companion auto-control badge - clickable to toggle (SKY-55) */}
          {enemy.isCompanion && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAutoControl?.();
                }}
                className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  (enemy as any).companionMeta?.autoControl !== false
                    ? 'bg-sky-600 text-white hover:bg-sky-500' 
                    : 'bg-amber-600 text-white hover:bg-amber-500'
                }`}
                title={`Click to ${(enemy as any).companionMeta?.autoControl !== false ? 'enable manual control' : 'enable auto control'}`}
              >
                {(enemy as any).companionMeta?.autoControl !== false ? 'Auto' : 'Manual'}
              </button>
              {/* Show pending-turns or decaying state for summoned companions */}
              {(enemy as any).pendingTurns !== undefined && (enemy as any).pendingTurns > 0 && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-amber-700 text-white">⏳ {(enemy as any).pendingTurns}</span>
              )}
              {isDecaying && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-red-700 text-white">⚠️ Decaying</span>
              )}
            </>
          )}
        </div>
        <span className="text-xs text-stone-400 capitalize">{enemy.type} • Lv.{enemy.level}</span>
      </div>
      
      {/* Health bar */}
      <div className="mb-2">
        <div className="h-2 bg-stone-900 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              healthPercent > 50 ? 'bg-green-500' : healthPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${healthPercent}%` }}
          />
        </div>
        <div className="text-xs text-stone-400 mt-1 text-right">
          {enemy.currentHealth}/{enemy.maxHealth} HP
        </div>
      </div>
      
      {/* Summon duration indicator for conjured allies */}
      {enemy.isCompanion && enemy.companionMeta?.isSummon && (() => {
        const decayEffect = (enemy.activeEffects || []).find((ae: any) => ae.effect?.type === 'summon_decay');
        if (decayEffect && decayEffect.turnsRemaining > 0) {
          return (
            <div className="mb-2 px-2 py-1 bg-purple-900/40 rounded text-xs text-purple-300 flex items-center gap-1">
              <span>✨</span>
              <span>Conjured — {decayEffect.turnsRemaining} turn{decayEffect.turnsRemaining !== 1 ? 's' : ''} remaining</span>
            </div>
          );
        }
        return null;
      })()}

      {/* Status effects */}
      {enemy.activeEffects && enemy.activeEffects.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {enemy.activeEffects.filter((ae: any) => ae.effect?.type !== 'summon_decay').map((ae, i) => (
            <span key={`${enemy.id}-effect-${ae.effect?.type || 'unknown'}-${i}`} className="px-1.5 py-0.5 bg-purple-900/60 rounded text-xs text-purple-300">
              {ae.effect.type} ({ae.turnsRemaining})
            </span>
          ))}
        </div>
      )}
      
      {/* Death overlay */}
      {isDead && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">💀</span>
        </div>
      )}
    </div>
  );
};

// Action button component
// Helper: determine the logical subcategory for an ability (used for accents)
const determineSubcategory = (ability: CombatAbility) => {
  if (ability.type === 'melee' || ability.type === 'ranged') {
    const isDefensive = /shield|block|defend|bash/i.test(ability.name);
    if (isDefensive) return 'Defensive';
    return ability.type === 'melee' ? 'Melee' : 'Ranged';
  }
  if (ability.type === 'shout') return 'Shouts';
  if ((ability.heal && ability.heal > 0) || ability.effects?.some(e => e.type === 'heal')) return 'Restoration';
  if (ability.damage > 0) return 'Destruction';
  return 'Support';
};

// Helper: accent color for (tab, subcategory)
const getAccentColor = (tab: 'Physical' | 'Magical', subCat: string) => {
  const map: Record<string, string> = {
    // Physical
    Melee: '#ef4444',      // red-500
    Ranged: '#f59e0b',     // amber-500
    Defensive: '#06b6d4',  // cyan-500
    // Magical
    Destruction: '#ef4444',// red-500
    Restoration: '#10b981',// green-500
    AeO: '#8b5cf6',      // violet-500 (Aeonic)
    Shouts: '#7c3aed',     // purple-600
    Support: '#06b6d4'     // cyan-500
  };  return map[subCat] || (tab === 'Physical' ? '#f97316' : '#60a5fa');
};

// Helper: pick readable text color for accent
const getTextColorForAccent = (hex?: string) => {
  if (!hex) return '#fff';
  const c = hex.replace('#','');
  const r = parseInt(c.substring(0,2),16);
  const g = parseInt(c.substring(2,4),16);
  const b = parseInt(c.substring(4,6),16);
  // Perceived luminance
  const l = 0.2126*r + 0.7152*g + 0.0722*b;
  return l > 160 ? '#000' : '#fff';
};

type ActionButtonProps = {
  ability: CombatAbility;
  disabled: boolean;
  cooldown: number;
  canAfford: boolean;
  onClick: () => void;
  accentColor?: string;
  compact?: boolean;
};

// ActionButton - memoized to prevent re-renders when props don't change
const ActionButton = React.memo<ActionButtonProps>(({ ability, disabled, cooldown, canAfford, onClick, accentColor, compact }) => {
  const getTypeIcon = () => {
    switch (ability.type) {
      case 'melee': return '⚔️';
      case 'ranged': return '🏹';
      case 'magic': return '✨';
      case 'aeo': return '🔮';
      case 'shout': return '📢';
      default: return '⚡';
    }
  };
  
  const isDisabled = disabled || cooldown > 0 || !canAfford;
  
  // Build tooltip text: show description (not values since they're already visible)
  const tooltipText = ability.description || `${ability.name} - ${ability.type} ability`;
  
  // Compact variant for mobile small buttons
  if (compact) {
    return (
      <button
        onClick={onClick}
        disabled={isDisabled}
        title={tooltipText}
        data-sfx="button_click"
        className={`px-2 py-2 rounded text-xs font-bold truncate transition-colors ${isDisabled ? 'bg-stone-700 text-stone-500 opacity-50' : ''}`}
        style={!isDisabled && accentColor ? { background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}11, rgba(0,0,0,0.35))`, color: getTextColorForAccent(accentColor), boxShadow: `inset 4px 0 0 ${accentColor}` } : undefined}
      >
        <span className="inline-block w-2 h-2 rounded-sm mr-2 align-middle" style={{ backgroundColor: accentColor }} />
        {ability.name}
        {cooldown > 0 && <span className="text-[10px] ml-1">({cooldown})</span>}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={tooltipText}
      data-sfx="button_click"
      className={`
        relative p-3 sm:p-3 lg:p-3 py-3 rounded-lg border-2 text-left transition-all w-full text-base sm:text-sm
        ${isDisabled 
          ? 'bg-stone-800/30 border-stone-700 text-stone-500 cursor-not-allowed' 
          : 'bg-gradient-to-br from-amber-900/40 to-stone-900/60 border-amber-700/50 hover:border-amber-500 hover:from-amber-900/60'
        }
      `}
      style={accentColor && !isDisabled ? { background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}11, rgba(0,0,0,0.6))`, borderColor: `${accentColor}88`, color: getTextColorForAccent(accentColor) } as React.CSSProperties : undefined}
    >
      {/* Cooldown overlay */}
      {cooldown > 0 && (
        <div className="absolute inset-0 bg-stone-900/80 rounded-lg flex items-center justify-center">
          <span className="text-2xl font-bold text-amber-500">{cooldown}</span>
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: accentColor }} />
        <span className="text-lg">{getTypeIcon()}</span>
        <span className={`font-bold ${isDisabled ? 'text-stone-500' : 'text-amber-100'}`} style={accentColor && !isDisabled ? { color: accentColor } : undefined}>
          {ability.name}
        </span>
      </div>
      
      <div className="flex gap-3 text-sm sm:text-xs items-center">
        {ability.damage > 0 && (
          <span className="text-red-400">⚔ {ability.damage}</span>
        )}
        <span className={`${ability.type === 'magic' ? 'text-blue-400' : 'text-green-400'}`} style={accentColor && !isDisabled ? { color: accentColor } : undefined}>
          {ability.type === 'magic' ? '💧' : '⚡'} {ability.cost}
        </span>
      </div>
      
      {!canAfford && !cooldown && (
        <span className="text-xs text-red-400 mt-1 block">Not enough {ability.type === 'magic' ? 'magicka' : 'stamina'}</span>
      )}
      </button>
    );
});

export const CombatModal: React.FC<CombatModalProps> = ({
  character,
  inventory,
  initialCombatState,
  onCombatEnd,
  onNarrativeUpdate,
  onInventoryUpdate,
  showToast
}) => {
  const [combatState, setCombatState] = useState<CombatState>(initialCombatState);
  const [playerStats, setPlayerStats] = useState<PlayerCombatStats>(() => 
    calculatePlayerCombatStats(character, inventory)
  );
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  // Quick visual highlight when a target is newly selected (transient)
  const [recentlyHighlighted, setRecentlyHighlighted] = useState<string | null>(null);
  // Track the timestamp of the last ability button click (helps disambiguate rapid click sequences in the UI/tests)
  const lastAbilityClickAt = useRef<number | null>(null);
  
  // Ability categorization state
  const [activeAbilityTab, setActiveAbilityTab] = useState<'Physical' | 'Magical'>('Physical');

  const categorizedAbilities = useMemo(() => {
    const groups = {
      Physical: {
        Melee: [] as CombatAbility[],
        Ranged: [] as CombatAbility[],
        Defensive: [] as CombatAbility[]
      },
      Magical: {
        Destruction: [] as CombatAbility[],
        Restoration: [] as CombatAbility[],
        Shouts: [] as CombatAbility[],
        Support: [] as CombatAbility[]
      }
    };

    playerStats.abilities.forEach(ability => {
      // Physical
      if (ability.type === 'melee' || ability.type === 'ranged') {
        const isDefensive = /shield|block|defend|bash/i.test(ability.name);
        if (isDefensive) {
          groups.Physical.Defensive.push(ability);
        } else if (ability.type === 'melee') {
          groups.Physical.Melee.push(ability);
        } else {
          groups.Physical.Ranged.push(ability);
        }
      } 
      // Magical / Special
      else {
        if (ability.type === 'shout') {
          groups.Magical.Shouts.push(ability);
        } else if ((ability.heal && ability.heal > 0) || ability.effects?.some(e => e.type === 'heal')) {
          groups.Magical.Restoration.push(ability);
        } else if (ability.damage > 0) {
          groups.Magical.Destruction.push(ability);
        } else {
          groups.Magical.Support.push(ability);
        }
      }
    });

    return groups;
  }, [playerStats.abilities]);
  // Pending targeting for abilities which require explicit target selection (heals/buffs)
  const [pendingTargeting, setPendingTargeting] = useState<null | { abilityId: string; abilityName: string; allow: 'allies' | 'enemies' | 'both' }>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  // Track if target change was user-initiated (to avoid toast spam from auto-selection)
  const userInitiatedTargetChange = useRef(false);
  // Timestamp of the last user-initiated target change — used to debounce click->selection races
  const lastUserTargetChangeAt = useRef<number>(0);

  // Show a toast and a brief visual pulse whenever the selectedTarget changes
  // Only show toast if it was user-initiated
  useEffect(() => {
    if (!selectedTarget) return;
    setRecentlyHighlighted(selectedTarget);

    // Only show toast if this was a user-initiated selection
    if (userInitiatedTargetChange.current && showToast) {
      // Resolve human-readable name for toast
      let name = 'Target';
      if (selectedTarget === 'player') name = getEasterEggName(character.name);
      else {
        const ally = (combatState.allies || []).find(a => a.id === selectedTarget);
        const enemy = (combatState.enemies || []).find(e => e.id === selectedTarget);
        if (ally) name = ally.name;
        else if (enemy) name = enemy.name;
      }
      showToast(`Target selected: ${name}`, 'info');
    }
    
    // Reset the flag
    userInitiatedTargetChange.current = false;

    const t = setTimeout(() => setRecentlyHighlighted(null), ms(900));
    return () => clearTimeout(t);
  }, [selectedTarget]);

  // App context (get user settings & update handler for server-side persistence)
  const { userSettings, updateUserSettings } = useAppContext();

  // One-time tip for new players explaining the Main/Bonus actions (persisted server-side)
  useEffect(() => {
    try {
      if (!showToast) return;
      // If the server-side flag hasn't been set, show the tip and persist it
      if (!userSettings?.seenBonusIntro) {
        showToast('Tip: Each turn grants a Main and a Bonus action. Potions/Defend/Conjuration use the Bonus action.', 'info');
        updateUserSettings && updateUserSettings({ seenBonusIntro: true });
      }
    } catch (e) {
      // ignore errors
    }
  }, [showToast, userSettings?.seenBonusIntro, updateUserSettings]);

  // Small helper to avoid spamming the same toast repeatedly (debounce per message)
  const lastToastRef = useRef<{ msg: string; at: number } | null>(null);
  const showThrottledToast = (msg: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', minMs = 1200) => {
    try {
      if (!showToast) return;
      const now = Date.now();
      if (lastToastRef.current && lastToastRef.current.msg === msg && now - lastToastRef.current.at < minMs) return;
      lastToastRef.current = { msg, at: now };
      showToast(msg, type);
    } catch (e) {}
  }
  const [elapsedSecDisplay, setElapsedSecDisplay] = useState<number>(0);
  const [showRoll, setShowRoll] = useState(false);
  // When an invalid-target is detected we briefly suppress rendering of the textual "Roll:" label
  // to avoid flicker/races where a transient log entry might appear before being cleaned up.
  const [suppressRollLabelUntil, setSuppressRollLabelUntil] = useState<number | null>(null);
  // Suppress roll labels for a whole turn (helps catch races where the engine appends a nat entry
  // after the UI's invalid-target handler runs)
  const [suppressRollForTurn, setSuppressRollForTurn] = useState<number | null>(null);
  // Defensive guard: when an invalid-target action occurs we briefly mark this ref
  // so any asynchronously-scheduled roll animations will be ignored.
  const lastInvalidTargetRef = useRef(false);
  const [rollValue, setRollValue] = useState<number | null>(null);
  const [rollActor, setRollActor] = useState<'player' | 'enemy' | 'ally' | null>(null);

  // Animation helper state & ref for D20 wheel-style roll animation
  const rollAnimRef = useRef<number | null>(null);
  const animateRoll = (finalValue: number, duration: number = 3000) => new Promise<void>((resolve) => {
    // cancel any existing animation
    if (rollAnimRef.current) {
      cancelAnimationFrame(rollAnimRef.current);
      rollAnimRef.current = null;
    }

    // Defensive: if an invalid-target action was just flagged, skip animating
    if (lastInvalidTargetRef.current) {
      // eslint-disable-next-line no-console
      console.debug && console.debug('[combat] animateRoll skipped due to recent invalid-target', { finalValue, rollActor, lastInvalidTarget: lastInvalidTargetRef.current });
      lastInvalidTargetRef.current = false;
      return resolve();
    }

    // Defensive: if the user very recently changed the selected target to an ally/self, suppress any
    // roll animation that started within the same interaction window to avoid click->selection races.
    try {
      const msSinceTarget = Date.now() - (lastUserTargetChangeAt.current || 0);
      const selectedIsAlly = selectedTarget === 'player' || !!((combatState.allies || []).find(a => a.id === selectedTarget));
      if (msSinceTarget > 0 && msSinceTarget < 120 && selectedIsAlly) {
        // eslint-disable-next-line no-console
        console.debug && console.debug('[combat] animateRoll suppressed due to recent user target change to ally', { msSinceTarget, selectedTarget });
        // Mark invalid-target so any downstream handlers treat this as a cancelled animation
        lastInvalidTargetRef.current = true;
        return resolve();
      }
    } catch (e) {}

    // eslint-disable-next-line no-console
    console.debug && console.debug('[combat] animateRoll start', { finalValue, rollActor, lastInvalidTarget: lastInvalidTargetRef.current, lastUserTargetChangeAt: lastUserTargetChangeAt.current });

    setShowRoll(true);
    const start = performance.now();
    const revolutions = 4; // full 4 rotations (snappier)
    const totalSteps = revolutions * 20 + ((finalValue - 1 + 20) % 20);
    let lastStep = -1;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const loop = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, duration > 0 ? elapsed / duration : 1);
      const eased = easeOutCubic(t);
      const step = Math.floor(eased * totalSteps);
      if (step !== lastStep) {
        const display = (step % 20) + 1;
        setRollValue(display);
        lastStep = step;

        // Play tick sound on every visible step change
        try { audioService.playSoundEffect('dice_tick'); } catch (e) { /* ignore audio errors */ }
      }

      if (t >= 1) {
        // ensure final value is exact
        setRollValue(finalValue);
        // final tick on landing
        try { audioService.playSoundEffect('dice_tick'); } catch (e) {}
        rollAnimRef.current = null;
        resolve();
        return;
      }

      rollAnimRef.current = requestAnimationFrame(loop);
    };

    rollAnimRef.current = requestAnimationFrame(loop);
  });

  // Cleanup on unmount to avoid RAF leaks
  useEffect(() => {
    return () => {
      if (rollAnimRef.current) cancelAnimationFrame(rollAnimRef.current);
    };
  }, []);

  const [floatingHits, setFloatingHits] = useState<Array<{ id: string; actor: string; damage: number; hitLocation?: string; isCrit?: boolean; x?: number; y?: number }>>([]);
  const [spellEffects, setSpellEffects] = useState<Array<SpellEffectState>>([]);
  const [screenFlash, setScreenFlash] = useState<SpellEffectState['type'] | null>(null);
  const [awaitingCompanionAction, setAwaitingCompanionAction] = useState(false);
  const enemyRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const playerRef = useRef<HTMLDivElement | null>(null);
  const [showDefeat, setShowDefeat] = useState(false);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [isHealing, setIsHealing] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [selectedPotion, setSelectedPotion] = useState<InventoryItem | null>(null);
  const [lootPhase, setLootPhase] = useState(false);
  const [lootItems, setLootItems] = useState<Array<{ name: string; quantity: number }>>([]);

  // Equipment modal local state (allows opening equipment while combat is active)
  const [equipModalOpen, setEquipModalOpen] = useState(false);
  const [equipSelectedSlot, setEquipSelectedSlot] = useState<EquipmentSlot | null>(null);


  const [localInventory, setLocalInventory] = useState<InventoryItem[]>(inventory);

  useEffect(() => {
    // Keep local inventory in sync with prop
    setLocalInventory(inventory);
  }, [inventory]);

  // When opening the equipment modal, pre-select the most-relevant slot (improves discoverability
  // and restores previous behavior where the weapon slot was shown by default). This makes the
  // list of equippable items visible immediately without an extra click.
  useEffect(() => {
    if (!equipModalOpen) return;
    if (equipSelectedSlot) return;
    // Prefer weapon slot if any weapon/apparel exists; otherwise pick the first allowed slot.
    const firstEquippable = localInventory.find(i => (i.type === 'weapon' || i.type === 'apparel'));
    const defaultSlot = firstEquippable ? getDefaultSlotForItem(firstEquippable) : 'weapon';
    setEquipSelectedSlot(defaultSlot || 'weapon');
  }, [equipModalOpen, equipSelectedSlot, localInventory]);

  // Recompute player combat stats whenever the local inventory or character changes
  // BUT preserve current combat vitals (health/magicka/stamina) to avoid resetting combat damage
  useEffect(() => {
    setPlayerStats(prev => {
      const recalculated = calculatePlayerCombatStats(character, localInventory);
      // Preserve combat-modified vitals if they differ from character's saved state
      // This prevents the useEffect from resetting damage taken during combat
      return {
        ...recalculated,
        currentHealth: prev.currentHealth,
        currentMagicka: prev.currentMagicka,
        currentStamina: prev.currentStamina
      };
    });
  }, [localInventory, character]);

  // If the currently selected target dies, auto-select the next alive enemy
  // BUT only if we're not in pendingTargeting mode for heals/buffs
  useEffect(() => {
    // Skip auto-selection if we're in targeting mode for allies (heals/buffs)
    if (pendingTargeting) return;
    
    if (selectedTarget) {
      // Only auto-switch if current target is an enemy that died
      const tgt = combatState.enemies.find(e => e.id === selectedTarget);
      if (tgt && tgt.currentHealth <= 0) {
        const firstAlive = combatState.enemies.find(e => e.currentHealth > 0);
        setSelectedTarget(firstAlive ? firstAlive.id : null);
      }
      // If selected target is an ally or 'player', don't auto-switch
    }
  }, [combatState.enemies, selectedTarget, pendingTargeting]);

  const equipItem = (item: InventoryItem, slot: EquipmentSlot) => {
    if (item.equippedBy && item.equippedBy !== 'player') {
      showToast?.('Item is equipped by a companion. Unequip it first.', 'warning');
      return;
    }
    const updated = localInventory.map(it => {
      if (it.id === item.id) return { ...it, equipped: true, slot, equippedBy: 'player' };
      if (it.equipped && it.slot === slot && it.id !== item.id) return { ...it, equipped: false, slot: undefined, equippedBy: null };
      return it;
    });
    setLocalInventory(updated);
    onInventoryUpdate && onInventoryUpdate(updated as InventoryItem[]);
    // Preserve combat vitals when recalculating equipment stats
    setPlayerStats(prev => {
      const recalculated = calculatePlayerCombatStats(character, updated);
      return { ...recalculated, currentHealth: prev.currentHealth, currentMagicka: prev.currentMagicka, currentStamina: prev.currentStamina };
    });
    setEquipSelectedSlot(null);
  };

  const unequipItem = (item: InventoryItem) => {
    const updated = localInventory.map(it => it.id === item.id ? { ...it, equipped: false, slot: undefined, equippedBy: null } : it);
    setLocalInventory(updated);
    onInventoryUpdate && onInventoryUpdate(updated as InventoryItem[]);
    // Preserve combat vitals when recalculating equipment stats
    setPlayerStats(prev => {
      const recalculated = calculatePlayerCombatStats(character, updated);
      return { ...recalculated, currentHealth: prev.currentHealth, currentMagicka: prev.currentMagicka, currentStamina: prev.currentStamina };
    });
  };

  // Toggle ally auto/manual control mode
  const toggleAllyAutoControl = (allyId: string) => {
    setCombatState(prev => {
      if (!prev.allies) return prev;
      const updatedAllies = prev.allies.map(ally => {
        if (ally.id === allyId) {
          // Default is true (auto), so undefined means auto
          const currentAutoControl = ally.companionMeta?.autoControl !== false;
          const newAutoControl = !currentAutoControl;
          return {
            ...ally,
            companionMeta: {
              ...ally.companionMeta,
              autoControl: newAutoControl
            }
          } as typeof ally;
        }
        return ally;
      });
      return { ...prev, allies: updatedAllies };
    });
    // Show feedback to user
    if (showToast) {
      const ally = combatState.allies?.find(a => a.id === allyId);
      if (ally) {
        const wasAuto = ally.companionMeta?.autoControl !== false;
        showToast(`${ally.name} set to ${wasAuto ? 'Manual' : 'Auto'} control`, 'info');
      }
    }
  };

  // Auto-select first alive enemy
  // BUT only if we're not in pendingTargeting mode for heals/buffs
  useEffect(() => {
    // Skip auto-selection if we're in targeting mode for allies (heals/buffs)
    if (pendingTargeting) return;
    
    if (!selectedTarget) {
      const firstAlive = combatState.enemies.find(e => e.currentHealth > 0);
      if (firstAlive) setSelectedTarget(firstAlive.id);
    }
  }, [combatState.enemies, selectedTarget, pendingTargeting]);

  // Slow down combat animations at higher player levels for more dramatic pacing
  // During tests we want animations to be effectively instant to keep tests fast and deterministic
  const timeScale = process.env.NODE_ENV === 'test' ? 0 : 1 + Math.floor((character?.level || 1) / 20) * 0.25;

  // Combat speed multiplier controls (1x, 2x, 5x) — higher values speed up combat by dividing animation waits
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(() => {
    try { return Number(localStorage.getItem('aetherius:combatSpeedMultiplier')) || 1; } catch { return 1; }
  });
  const setAndPersistSpeed = (v: number) => {
    setSpeedMultiplier(v);
    try { localStorage.setItem('aetherius:combatSpeedMultiplier', String(v)); } catch {}
  };

  // Auto-combat toggle (when enabled, player's turn will auto-execute a default action)
  const [autoCombat, setAutoCombat] = useState<boolean>(() => {
    try { return localStorage.getItem('aetherius:autoCombat') === 'true'; } catch { return false; }
  });
  const toggleAutoCombat = (v?: boolean) => {
    setAutoCombat(prev => {
      const next = typeof v === 'boolean' ? v : !prev;
      try { localStorage.setItem('aetherius:autoCombat', String(next)); } catch {}
      return next;
    });
  };

  // Toggle whether we show the loot modal automatically when combat ends (default: true)
  const [showLootOnEnd, setShowLootOnEnd] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('aetherius:combatShowLootOnEnd');
      return v === null ? true : v === 'true';
    } catch { return true; }
  });
  const toggleShowLootOnEnd = (v?: boolean) => {
    setShowLootOnEnd(prev => {
      const next = typeof v === 'boolean' ? v : !prev;
      try { localStorage.setItem('aetherius:combatShowLootOnEnd', String(next)); } catch {}
      return next;
    });
  };

  // Menu state for loot options (popover) — not an on/off toggle in header
  const [showLootMenuOpen, setShowLootMenuOpen] = useState<boolean>(false);

  // Helper to compute scaled milliseconds for waits/animations — divides base delays by multiplier
  const ms = (base: number) => Math.max(0, Math.floor(base * timeScale / Math.max(1, speedMultiplier)));

  // Scroll combat log to bottom (if auto-scroll is enabled)
  useEffect(() => {
    if (!autoScroll) return;
    const el = logRef.current;
    if (!el) return;

    // Ensure scrolling happens after DOM updates: double rAF is reliable.
    let raf1 = 0 as number | undefined;
    let raf2 = 0 as number | undefined;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        try {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        } catch (e) {
          el.scrollTop = el.scrollHeight;
        }
      });
    });

    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [combatState.combatLog.length, autoScroll]);

  // Handle combat end
  useEffect(() => {
    if (combatState.result) {
      setIsAnimating(true);
      setTimeout(() => {
        if (combatState.result === 'defeat') {
          setShowDefeat(true);
        } else {
          // For victory we enter loot phase and wait until loot is finalized before showing victory
          // Fled or surrendered - end immediately
          if (combatState.result !== 'victory') {
            // Calculate elapsed combat time in minutes for world clock sync
            const combatMinutes = Math.max(1, Math.ceil((combatState.combatElapsedSec || 0) / 60));
            
            const builtCombatResult = combatState.combatResult || {
              id: combatState.id || `combat_${Date.now()}`,
              result: combatState.result || 'unresolved',
              winner: combatState.result === 'defeat' ? 'enemy' : 'unresolved',
              survivors: combatState.enemies.filter(e => e.currentHealth > 0).map(e => ({ id: e.id, name: e.name, currentHealth: e.currentHealth })),
              playerStatus: { currentHealth: playerStats.currentHealth, currentMagicka: playerStats.currentMagicka, currentStamina: playerStats.currentStamina, isAlive: playerStats.currentHealth > 0 },
              rewards: combatState.rewards || undefined,
              timestamp: Date.now()
            };

            onCombatEnd(combatState.result, undefined, {
              health: playerStats.currentHealth,
              magicka: playerStats.currentMagicka,
              stamina: playerStats.currentStamina
            }, combatMinutes, builtCombatResult);
          }
        }
        setIsAnimating(false);
      }, 1500);
    }
  }, [combatState.result]);

  // For defeat, call onCombatEnd; for victory we wait until loot is finalized and the player closes the victory screen
  useEffect(() => {
    if (showDefeat) {
      // Calculate elapsed combat time in minutes for world clock sync
      const combatMinutes = Math.max(1, Math.ceil((combatState.combatElapsedSec || 0) / 60));
      
      onCombatEnd(
        'defeat',
        combatState.rewards,
        {
          health: playerStats.currentHealth,
          magicka: playerStats.currentMagicka,
          stamina: playerStats.currentStamina
        },
        combatMinutes
      );
    }
  }, [showDefeat]);

  // Live combat timer display (reads combatStartTime from combatState)
  useEffect(() => {
    let t: number | undefined;
    const update = () => {
      if (combatState.combatStartTime) {
        const sec = Math.max(0, Math.floor((Date.now() - combatState.combatStartTime) / 1000));
        setElapsedSecDisplay(sec);
      } else {
        setElapsedSecDisplay(0);
      }
    };
    update();
    t = window.setInterval(update, 1000);
    return () => { if (t) window.clearInterval(t); };
  }, [combatState.combatStartTime]);

  // Trigger loot phase after combat ends - show loot modal for player to review before finalizing
  useEffect(() => {
    if (combatState.result === 'victory') {
      if (showLootOnEnd) {
        const populatedState = populatePendingLoot(combatState);

        // Populate pending loot on the combat state so the existing LootModal (rendered when
        // `combatState.lootPending` is true) will display. Avoid setting `lootPhase` which
        // duplicates the modal UI.
        setCombatState(prev => ({ ...populatedState, lootPending: true } as any));
        // Informational toast
        showToast?.('Victory! Review your loot and confirm to finish combat.', 'success');
      } else {
        // Auto-finalize as skipped loot (player chose not to review)
        // Funnel through canonical finalizer to keep behavior consistent
        handleFinalizeLoot(null);
      }
    }
  }, [combatState.result, showLootOnEnd]);

  const handleFinalizeLoot = (selectedItems: Array<{ name: string; quantity: number }> | null) => {
    const { newState, updatedInventory, grantedXp, grantedGold, grantedItems } = finalizeLoot(
      combatState,
      selectedItems,
      inventory,
      character?.id
    );

    setCombatState(newState);
    // Persist updated inventory snapshot
    onInventoryUpdate && onInventoryUpdate(updatedInventory);

    // Play audio feedback for loot confirmation
    try {
      if ((grantedGold || 0) > 0) audioService.playSoundEffect('gold_gain');
      if ((grantedItems || []).length > 0) audioService.playSoundEffect('item_pickup');
    } catch (e) { console.warn('Failed to play loot SFX', e); }

    showToast?.(`Loot collected: ${grantedItems.map(item => item.name).join(', ')}`, 'success');
    setLootPhase(false);

    // After player confirms loot, build combat result and notify parent to finish combat.
    const combatResult = {
      id: newState.id || `combat_${Date.now()}`,
      result: 'victory' as const,
      winner: 'player' as const,
      survivors: newState.enemies.filter(e => e.currentHealth > 0).map(e => ({ id: e.id, name: e.name, currentHealth: e.currentHealth })),
      playerStatus: {
        currentHealth: playerStats.currentHealth,
        currentMagicka: playerStats.currentMagicka,
        currentStamina: playerStats.currentStamina,
        isAlive: playerStats.currentHealth > 0
      },
      rewards: newState.rewards,
      timestamp: Date.now()
    };

    setCombatState(prev => ({ ...prev, combatResult } as any));

    // Notify parent that combat is finished (victory) after loot accepted by player
    onCombatEnd && onCombatEnd('victory', newState.rewards, {
      health: playerStats.currentHealth,
      magicka: playerStats.currentMagicka,
      stamina: playerStats.currentStamina
    }, Math.max(0, Math.round((newState.combatElapsedSec || 0) / 60)), combatResult);
  };

  // When entering loot phase, keep combat UI open and show LootModal
  const handleLootConfirm = (selected: Array<{ name: string; quantity: number }>) => {
    // Funnel through the single finalize implementation to keep behavior consistent
    handleFinalizeLoot(selected.length ? selected : null);
  };

  const handleLootCancel = () => {
    // Cancel/Close should finalize loot as skipped (treat as skip/no selection)
    handleFinalizeLoot(null);
  };

  // Process enemy turns
  const processEnemyTurns = useCallback(async () => {
    let currentState = combatState;
    let currentPlayerStats = playerStats;
    
    while (currentState.active && currentState.currentTurnActor !== 'player') {
      const actorId = currentState.currentTurnActor;
      const actorIsAlly = !!(currentState.allies || []).find(a => a.id === actorId);
      
      // Check if this is a manually-controlled ally BEFORE rolling dice
      const allyActor = (currentState.allies || []).find(a => a.id === actorId);
      if (allyActor && allyActor.companionMeta?.autoControl === false) {
        // Manual control: pause processing and let the UI await player input
        // Do NOT roll dice yet - player needs to choose action first
        setIsAnimating(false);
        setAwaitingCompanionAction(true);
        setCombatState(currentState);
        setPlayerStats(currentPlayerStats);
        return; // pause the processing loop until player selects an action
      }
      
      // For auto-controlled allies and enemies, proceed with dice animation
      setIsAnimating(true);
      setRollActor(actorIsAlly ? 'ally' : 'enemy');
      const finalEnemyRoll = Math.floor(Math.random() * 20) + 1;

      // If the acting actor is stunned, skip the visual roll (engine will early-return)
      const acting = (currentState.enemies || []).find(a => a.id === actorId) || (currentState.allies || []).find(a => a.id === actorId) || null;
      const actingStunned = acting?.activeEffects?.some((e: any) => e.effect && e.effect.type === 'stun' && e.turnsRemaining > 0);
      if (actingStunned) {
        // Show stunned indication instead of dice roll
        showToast?.(`${acting?.name || 'Entity'} is stunned and cannot act!`, 'warning');
        await waitMs(ms(600));
      } else {
        // animate wheel-style roll with ease-out for smooth stop
        await animateRoll(finalEnemyRoll, Math.floor(3000));
        await waitMs(ms(220));
        setShowRoll(false);
        setRollActor(null);
      }

      // If current actor is an auto-controlled ally, execute their action
      if (allyActor) {
        // Auto-control: perform their default attack immediately (pass undefined natRoll when stunned)
        const res = executeCompanionAction(currentState, allyActor.id, allyActor.abilities[0].id, undefined, actingStunned ? undefined : finalEnemyRoll, true);
        // If companion couldn't act (invalid target etc.), surface narrative/toast and skip their turn
        if (!res.success) {
          if (res.narrative && onNarrativeUpdate) onNarrativeUpdate(res.narrative);
          // Advance turn so the encounter doesn't stall
          currentState = advanceTurn(currentState);
          setCombatState(currentState);
          await waitMs(ms(300));
          continue;
        }

        currentState = res.newState;
        if (res.narrative && onNarrativeUpdate) onNarrativeUpdate(res.narrative);
        // Play companion attack sound for their ability
        try { playCombatSound(allyActor.abilities[0].type as any, allyActor, allyActor.abilities[0]); } catch (e) {}

        // Show floating hit for companion auto-action if damage exists
        try {
          const last = currentState.combatLog && currentState.combatLog[currentState.combatLog.length - 1];
          if (last && last.damage && last.damage > 0) {
            const id = `hit_comp_auto_${Date.now()}`;
            let x: number | undefined;
            let y: number | undefined;
            const targetEnemy = (currentState.enemies || []).find((e: any) => e.name === last.target || e.id === last.target);
            if (targetEnemy && enemyRefs.current[targetEnemy.id]) {
              const r = enemyRefs.current[targetEnemy.id]!.getBoundingClientRect();
              x = r.left + r.width / 2;
              y = r.top + r.height / 2;
            }
            setFloatingHits(h => [{ id, actor: last.actor, damage: last.damage, hitLocation: undefined, isCrit: !!last.isCrit, x, y }, ...h]);
            setTimeout(() => setFloatingHits(h => h.filter(x => x.id !== id)), ms(1600));
          }
        } catch (e) { /* best-effort UI */ }

        // Update UI and play companion animation
        setCombatState(currentState);
        await waitMs(ms(600));

        // Check for combat end
        currentState = checkCombatEnd(currentState, currentPlayerStats);
        if (!currentState.active) {
          setCombatState(currentState);
          break;
        }

        // Advance to next turn and apply regen for the turn
        currentState = advanceTurn(currentState);
        // Only apply regen when the turn advanced to the player
        if (currentState.currentTurnActor === 'player') {
          const regenResAlly = applyTurnRegen(currentState, currentPlayerStats);
          currentState = regenResAlly.newState;
          currentPlayerStats = regenResAlly.newPlayerStats;
          setCombatState(currentState);
          setPlayerStats(currentPlayerStats);
        } else {
          setCombatState(currentState);
          setPlayerStats(currentPlayerStats);
        }

        // brief pause before next actor
        await waitMs(ms(400));
        continue; // proceed to next turn
      }

      const { newState, newPlayerStats, narrative } = executeEnemyTurn(
        currentState,
        currentState.currentTurnActor,
        currentPlayerStats,
        actingStunned ? undefined : finalEnemyRoll,
        character
      );
      
      currentState = newState;
      currentPlayerStats = newPlayerStats;
      
      // Update state with animation delay
      await waitMs(ms(1000));
      
      setCombatState(currentState);
      setPlayerStats(currentPlayerStats);
      
      if (onNarrativeUpdate && narrative) {
        onNarrativeUpdate(narrative);
      }

      // Show floating damage for enemy action if present
      const last = newState.combatLog[newState.combatLog.length - 1];
      if (last && last.actor !== 'player' && last.damage && last.damage > 0) {
        const id = `hit_e_${Date.now()}`;
        // Anchor to the target of the attack if possible (ally or enemy), otherwise fallback to player
        let x: number | undefined;
        let y: number | undefined;
        try {
          let el: HTMLElement | null = null;
          if (!last.target || last.target === 'player') {
            el = playerRef.current;
          } else {
            // Try to find an ally or enemy with matching name and use its registered element ref
            const ally = (combatState.allies || []).find(a => a.name === last.target);
            const enemy = (combatState.enemies || []).find(e => e.name === last.target);
            if (ally && enemyRefs.current[ally.id]) el = enemyRefs.current[ally.id];
            else if (enemy && enemyRefs.current[enemy.id]) el = enemyRefs.current[enemy.id];
            else el = playerRef.current; // fallback
          }

          if (el) {
            const r = el.getBoundingClientRect();
            x = r.left + r.width / 2;
            y = r.top + r.height / 2;
          }
        } catch (e) {}

        setFloatingHits(h => [{ id, actor: last.actor, damage: last.damage, hitLocation: undefined, isCrit: !!last.isCrit, x, y }, ...h]);
        setTimeout(() => setFloatingHits(h => h.filter(x => x.id !== id)), ms(1600));

        try {
          // Play centralized 'hit received' sound matched to attacker (if available)
          const attacker = (combatState.enemies || []).find(e => e.id === last.actor) || (combatState.allies || []).find(a => a.id === last.actor) || null;
          playCombatSound('hit', attacker || undefined);
        } catch (e) { console.warn('Failed to play hit received sound', e); }
      }
      
      // Check for combat end
      currentState = checkCombatEnd(currentState, currentPlayerStats);
      if (!currentState.active) {
        setCombatState(currentState);
        break;
      }

      // Advance to next turn and apply regen for the turn
      currentState = advanceTurn(currentState);
      // Only apply regen when the turn advanced to the player
      if (currentState.currentTurnActor === 'player') {
        const regenRes = applyTurnRegen(currentState, currentPlayerStats);
        currentState = regenRes.newState;
        currentPlayerStats = regenRes.newPlayerStats;
        setCombatState(currentState);
        setPlayerStats(currentPlayerStats);
      } else {
        setCombatState(currentState);
        setPlayerStats(currentPlayerStats);
      }
      
      await waitMs(ms(500));
    }
    
    setIsAnimating(false);
  }, [combatState, playerStats, onNarrativeUpdate]);

  // Trigger enemy turns when it's not player's turn and not awaiting manual companion input
  useEffect(() => {
    if (combatState.active && combatState.currentTurnActor !== 'player' && !isAnimating && !awaitingCompanionAction) {
      processEnemyTurns();
    }
  }, [combatState.currentTurnActor, combatState.active, isAnimating, awaitingCompanionAction]);

  // Track optimistic inventory updates to avoid emitting duplicate updates when the engine
  // later returns a concrete usedItem. This is a small in-component cache keyed by item id.
  const pendingInventoryUpdateIds = React.useRef<Set<string>>(new Set());

  // Handle player action
  const handlePlayerAction = async (action: CombatActionType, abilityId?: string, itemId?: string) => {
    // debug
    // eslint-disable-next-line no-console
    console.debug && console.debug('[combat] handlePlayerAction invoked', { action, abilityId, currentTurnActor: combatState.currentTurnActor, selectedTarget, pendingTargeting, lastUserTargetChangeAt: lastUserTargetChangeAt.current });

    // if an ability is being confirmed, ensure selectedTarget is valid; for heal/buff we'll allow undefined (self) or allies.
    if (isAnimating || combatState.currentTurnActor !== 'player') return;

    setIsAnimating(true);

    // Pre-check: determine whether this requested action consumes a main or bonus action.
    let intendedActionKind = (() => {
      if (action === 'item') return 'bonus' as const;
      if (action === 'defend') return 'bonus' as const;
      if (action === 'end_turn') return 'main' as const;
      if (action === 'magic' && abilityId) {
        const ab = playerStats.abilities.find(a => a.id === abilityId);
        if (ab && ab.effects && ab.effects.some((ef: any) => ef.type === 'summon')) return 'bonus' as const;
      }
      return 'main' as const;
    })();

    // Determine ability if provided and allow it to modify action kind detection
    const preCheckAbility = abilityId ? playerStats.abilities.find(a => a.id === abilityId) : undefined;
    if (preCheckAbility) {
      if (preCheckAbility.effects && preCheckAbility.effects.some((ef: any) => ef.type === 'summon')) intendedActionKind = 'bonus';
      else if (preCheckAbility.heal || (preCheckAbility.effects && preCheckAbility.effects.some((ef: any) => ef.type === 'heal' || ef.type === 'buff'))) intendedActionKind = 'bonus';
    }

    // Prevent repeated usage of the same action type within a player turn
    if (intendedActionKind === 'main' && combatState.playerMainActionUsed) {
      showThrottledToast('Main action already used this turn.', 'warning');
      setIsAnimating(false);
      return;
    }
    if (intendedActionKind === 'bonus' && combatState.playerBonusActionUsed) {
      showThrottledToast('Bonus action already used this turn.', 'warning');
      setIsAnimating(false);
      return;
    }

    // Special handling: End turn immediately without roll animation
    if (action === 'end_turn') {
      // Advance turn and apply regen if appropriate
      let finalState = advanceTurn(combatState);
      if (finalState.currentTurnActor === 'player') {
        const regenRes = applyTurnRegen(finalState, playerStats);
        finalState = regenRes.newState;
        setPlayerStats(regenRes.newPlayerStats);
      }
      setCombatState(finalState);
      setIsAnimating(false);
      return;
    }

    // Determine ability and enforce selection rules before rolling
    const ability = abilityId ? playerStats.abilities.find(a => a.id === abilityId) : undefined;
    const isHealingAbility = !!(ability && (ability.heal || (ability.effects && ability.effects.some((ef: any) => ef.type === 'heal' || ef.type === 'buff'))));
    let targetToUse = selectedTarget || undefined;

    if (isHealingAbility) {
      // If a pending targeting flow is active, respect it. Otherwise, default/forgive as before.
      if (pendingTargeting && pendingTargeting.abilityId === abilityId) {
        // Use the selectedTarget (or undefined for self)
        targetToUse = selectedTarget || undefined;
      } else {
        // Legacy behavior: ensure heals don't target enemies
        if (selectedTarget && (combatState.enemies || []).find(e => e.id === selectedTarget)) {
          if (showToast) showToast('Heals can only target you or allies. Applying to self.', 'info');
          setSelectedTarget('player');
          targetToUse = undefined; // executePlayerAction treats undefined as auto-self when healing
        } else if (!selectedTarget) {
          // no explicit target: default to self visibly
          setSelectedTarget('player');
        }
      }
    }

    // Special-case SKIP: do not roll dice or play the roll animation — just execute and advance
    if (action === 'skip') {
      const execRes = executePlayerAction(
        combatState,
        playerStats,
        action,
        undefined,
        undefined,
        undefined,
        localInventory,
        undefined,
        character
      );
      let newState = execRes.newState;
      let newPlayerStats = execRes.newPlayerStats;
      const narrative = execRes.narrative;

      if (onNarrativeUpdate && narrative) onNarrativeUpdate(narrative);

      // Check combat end
      let finalState = checkCombatEnd(newState, newPlayerStats);
      if (finalState.active) {
        // For skip we always advance the turn when combat remains active
        finalState = advanceTurn(finalState);
        // Only apply regen when the turn advanced to the player
        if (finalState.currentTurnActor === 'player') {
          const regenRes = applyTurnRegen(finalState, newPlayerStats);
          finalState = regenRes.newState;
          newPlayerStats = regenRes.newPlayerStats;
        }
      }

      setCombatState(finalState);
      setPlayerStats(newPlayerStats);

      // In tests this will resolve instantly, but in production we keep the short delay for UX
      waitMs(ms(500)).then(() => setIsAnimating(false));
      return;
    }

    // Defensive UI guard: if this ability is a conjuration, check active summon count against
    // the character's allowed summon limit (base 1, increased by conjuration perks).
    const abilityToCheck = abilityId ? playerStats.abilities.find(a => a.id === abilityId) : undefined;
    const isConjuration = !!(abilityToCheck && abilityToCheck.effects && abilityToCheck.effects.some((ef: any) => ef.type === 'summon'));
    if (isConjuration) {
      const aliveSummons = ((combatState.allies || []).concat(combatState.enemies || [])).filter(a => !!a.companionMeta?.isSummon && (a.currentHealth || 0) > 0).length;
      const pending = (combatState.pendingSummons || []).length;
      const activeSummonCount = aliveSummons + pending;
      const allowedSummons = 1 + (getPerkRank(character, 'twin_souls') || 0);
      if (activeSummonCount >= allowedSummons) {
        if (showToast) showToast('Already summoned', 'warning');
        // suppress any transient roll UI and ensure we don't consume the player's turn
        lastInvalidTargetRef.current = true;
        if (rollAnimRef.current) { cancelAnimationFrame(rollAnimRef.current); rollAnimRef.current = null; }
        setShowRoll(false);
        setRollActor(null);
        setIsAnimating(false);
        return;
      }
    }

    // Pre-check: if the player is stunned, skip the roll and let engine handle the skip immediately (prevents UX roll animation when stunned)
    const playerStun = (combatState.playerActiveEffects || []).find((pe: any) => pe.effect && pe.effect.type === 'stun' && pe.turnsRemaining > 0);
    if (playerStun) {
      // Execute the action immediately without a natural roll so the engine can decrement the effect and advance
      const execRes = executePlayerAction(combatState, playerStats, action, targetToUse, abilityId, itemId, localInventory, undefined, character);
      if (execRes.narrative && onNarrativeUpdate) onNarrativeUpdate(execRes.narrative);

      // Check combat end and advance turn if combat still active
      let finalState = checkCombatEnd(execRes.newState, execRes.newPlayerStats);
      if (finalState.active) {
        finalState = advanceTurn(finalState);
        if (finalState.currentTurnActor === 'player') {
          const regenRes = applyTurnRegen(finalState, execRes.newPlayerStats);
          finalState = regenRes.newState;
          execRes.newPlayerStats = regenRes.newPlayerStats;
        }
      }

      setCombatState(finalState);
      setPlayerStats(execRes.newPlayerStats);
      if (showToast) showToast(execRes.narrative, 'warning');
      waitMs(ms(500)).then(() => setIsAnimating(false));
      return;
    }

    // Optimistically emit an inventory update for item uses so that external handlers can
    // react immediately and tests are deterministic. Track the item id so we can avoid
    // double-emitting when the engine later returns a usedItem.
    if (action === 'item' && itemId) {
      const match = localInventory.find(it => it.id === itemId);
      if (match && onInventoryUpdate) {
        pendingInventoryUpdateIds.current.add(itemId);
        const precise: InventoryItem = { ...match, quantity: Math.max(0, (match.quantity || 0) - 1) } as InventoryItem;
        onInventoryUpdate([precise]);
      }
    }

    // Animate d20 rolling: show a sequence then finalize to a deterministic nat roll
    const finalRoll = Math.floor(Math.random() * 20) + 1;
    setRollActor('player');

    // If we were in a pending targeting flow, clear it after confirming
    if (pendingTargeting && pendingTargeting.abilityId === abilityId) {
      setPendingTargeting(null);
    }

    // animate wheel-style roll with ease-out for smooth stop
    await animateRoll(finalRoll, Math.floor(3000));
    await waitMs(ms(220));
    setShowRoll(false);
    setRollActor(null);

    const execRes = executePlayerAction(
      combatState,
      playerStats,
      action,
      targetToUse,
      abilityId,
      itemId,
      localInventory,
      finalRoll,
      character
    );
    let newState = execRes.newState;
    let newPlayerStats = execRes.newPlayerStats;
    const narrative = execRes.narrative;
    const usedItem = execRes.usedItem;

    // Apply which action was consumed (main/bonus) so UI state can reflect it
    const consumed = (execRes as any).consumedAction || (action === 'item' || action === 'defend' ? 'bonus' : 'main');
    if (consumed === 'main') newState.playerMainActionUsed = true;
    if (consumed === 'bonus') newState.playerBonusActionUsed = true;

    // Play combat sound based on action/ability type
    if (action === 'attack' || action === 'power_attack' || action === 'magic' || action === 'shout') {
      const ability = abilityId ? playerStats.abilities.find(a => a.id === abilityId) : undefined;
      const actionType = ability?.type || 'melee';
      const targetEnemy = selectedTarget ? combatState.enemies.find(e => e.id === selectedTarget) : undefined;
      if (ability?.name?.toLowerCase().includes('bash')) {
        playCombatSound('shield_bash', undefined);
      } else if (ability?.name?.toLowerCase().includes('block')) {
        playCombatSound('block', undefined);
      } else {
        playCombatSound(actionType as 'melee' | 'ranged' | 'magic' | 'shout', targetEnemy, ability);
      }

      // Trigger visual effects based on ability type
      if (action === 'magic' && ability) {
        const effectType = getSpellEffectType(ability);
        if (effectType !== 'none') {
          // Flash screen with effect color
          setScreenFlash(effectType);
          setTimeout(() => setScreenFlash(null), 400);

          // Add spell effect to state so they render
          const effectId = `spell_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
          setSpellEffects(effects => [...effects, {
            id: effectId,
            type: effectType,
            startTime: Date.now(),
            duration: 1000
          }]);

          // Clean up effect after duration
          setTimeout(() => {
            setSpellEffects(effects => effects.filter(e => e.id !== effectId));
          }, 1500);
        }
      }

      // If the engine returned an AoE summary, present richer feedback (SFX + floating indicators)
      if ((execRes as any).aoeSummary) {
        try {
          // Layered SFX: an impact then a gentle heal chime
          audioService.playSoundEffect('aeo_burst');
          audioService.playSoundEffect('spell_impact');
          // Show summary toast and per-target floating numbers
          const summary = (execRes as any).aoeSummary as { damaged?: any[]; healed?: any[] };
          const dmgCount = (summary.damaged || []).length;
          const healCount = (summary.healed || []).length;

          const dmgNames = (summary.damaged || []).map(d => d.name).slice(0,4).join(', ');
          const healNames = (summary.healed || []).map(h => h.name).slice(0,4).join(', ');

          if (dmgCount || healCount) {
            const parts: string[] = [];
            if (dmgCount) parts.push(`Damaged ${dmgCount} ${dmgCount === 1 ? 'enemy' : 'enemies'}${dmgNames ? `: ${dmgNames}` : ''}`);
            if (healCount) parts.push(`Restored ${healCount} ${healCount === 1 ? 'ally' : 'allies'}${healNames ? `: ${healNames}` : ''}`);
            showToast && showToast(parts.join(' • '), 'success');
          }

          // Push floating hits for enemies
          (summary.damaged || []).forEach(d => {
            const id = `aeo_d_${d.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
            const rect = enemyRefs[d.id]?.getBoundingClientRect?.() || { x: window.innerWidth/2, y: 120 };
            setFloatingHits(h => [{ id, actor: d.name || 'enemy', damage: d.amount, hitLocation: undefined, isCrit: false, x: rect.x + rect.width/2, y: rect.y + rect.height/2 }, ...h]);
            // brief highlight
            setRecentlyHighlighted(d.id);
            setTimeout(() => setRecentlyHighlighted(null), ms(900));
            setTimeout(() => setFloatingHits(h => h.filter(x => x.id !== id)), ms(1600));
          });

          // Push floating heals for allies + player
          (summary.healed || []).forEach(hd => {
            const id = `aeo_h_${hd.id}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
            const isPlayer = hd.id === 'player';
            const rect = isPlayer ? playerRef.current?.getBoundingClientRect?.() : (enemyRefs[hd.id]?.getBoundingClientRect?.() || { x: window.innerWidth/2, y: 120 });
            setFloatingHits(f => [{ id, actor: hd.name || (isPlayer ? 'You' : 'ally'), damage: hd.amount, hitLocation: undefined, isCrit: false, x: rect.x + (rect.width||0)/2, y: rect.y + (rect.height||0)/2, isHeal: true } as any, ...f]);
            setRecentlyHighlighted(hd.id);
            setTimeout(() => setRecentlyHighlighted(null), ms(900));
            setTimeout(() => setFloatingHits(h => h.filter(x => x.id !== id)), ms(1600));
          });
        } catch (e) {
          // best-effort UI enhancements — do not block combat flow
          console.warn('Failed to present AeO UI summary:', e);
        }
      }
    } else if (action === 'defend') {
      playCombatSound('block', undefined);
    }
    const deadEnemies = newState.enemies.filter(e => e.currentHealth <= 0 && combatState.enemies.find(oe => oe.id === e.id && oe.currentHealth > 0));
    if (deadEnemies.length > 0) {
      playCombatSound('enemy_death');
    }

    if (onNarrativeUpdate && narrative) {
      onNarrativeUpdate(narrative);
    }
    // Show toast for low stamina narrative
    if (narrative && narrative.toLowerCase().includes('low stamina') && showToast) {
      showToast('Low stamina reduces effectiveness of the ability.', 'warning');
    }
    
    // Trigger healing animation and toast if health was restored
    if (action === 'item' && newPlayerStats.currentHealth > playerStats.currentHealth) {
      setIsHealing(true);
      setTimeout(() => setIsHealing(false), ms(1000));
      // Add a healing visual effect for item use
      const effectId = `heal_item_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
      setScreenFlash('healing');
      setSpellEffects(effects => [...effects, { id: effectId, type: 'healing', startTime: Date.now(), duration: 1000 }]);
      setTimeout(() => setSpellEffects(effects => effects.filter(e => e.id !== effectId)), ms(1200));
      if (showToast) {
        showToast(`Restored ${newPlayerStats.currentHealth - playerStats.currentHealth} health!`, 'success');
      }
    }
    
    // Update inventory if item was used
    if (usedItem) {
      // Optimistically update local inventory so UI never shows a "ghost" or 0-count item
      setLocalInventory(prev => {
        const next = prev.map(it => it.id === usedItem.id ? { ...it, quantity: Math.max(0, (it.quantity || 0) - 1) } : it).filter(it => (it.quantity || 0) > 0);
        return next;
      });

      if (onInventoryUpdate) {
        // If we previously emitted an optimistic update for this item, do not emit again.
        if (usedItem.id && pendingInventoryUpdateIds.current.has(usedItem.id)) {
          pendingInventoryUpdateIds.current.delete(usedItem.id);
        } else {
          // If we have a concrete id from the engine, prefer emitting an id-based update
          // (allows App to merge by id and treat quantity<=0 as deletion). Fallback to
          // legacy name-based removal when id is not available.
          if ((usedItem as any).id) {
            const precise: InventoryItem = { ...(usedItem as any) } as InventoryItem;
            // ensure quantity in the payload reflects the post-use quantity
            precise.quantity = Number(usedItem.quantity || 0);
            onInventoryUpdate([precise]);
          } else {
            onInventoryUpdate([{ name: usedItem.name, quantity: 1 }]);
          }
        }
      }

      // Avoid duplicate toasts: if this item restored health, the heal toast was already shown above
      if (!(action === 'item' && newPlayerStats.currentHealth > playerStats.currentHealth)) {
        if (showToast) {
          showToast(`Used ${usedItem.name}`, 'info');
        }
      }
    }
    
    // Check combat end
    let finalState = checkCombatEnd(newState, newPlayerStats);

    // Decide whether to advance the turn based on which action was consumed.
    const consumedAction = consumed;
    let shouldAdvance = false;
    if (!finalState.active) {
      shouldAdvance = false; // combat ended — leave state as-is (loot phase handled elsewhere)
    } else if (action === 'flee' && narrative && narrative.includes('failed')) {
      // failed flee -> do not advance
      shouldAdvance = false;
    } else if (consumedAction === 'main') {
      // If main action used and bonus already used earlier this turn, advance.
      if (finalState.playerBonusActionUsed) shouldAdvance = true;
      // Otherwise do not advance so the player can take their bonus action (or end turn manually)
    } else if (consumedAction === 'bonus') {
      // If bonus used after main, and main already used, advance
      if (finalState.playerMainActionUsed) shouldAdvance = true;
      // Otherwise do not advance (allow player to still use main action)
    } else {
      // fallback for skip/surrender/etc: advance
      shouldAdvance = action === 'skip' || action === 'surrender' || (action === 'flee' && narrative && !narrative.includes('failed'));
    }

    if (shouldAdvance) {
      finalState = advanceTurn(finalState);
      // Only apply regen when the turn advanced to the player
      if (finalState.currentTurnActor === 'player') {
        const regenRes = applyTurnRegen(finalState, newPlayerStats);
        finalState = regenRes.newState;
        newPlayerStats = regenRes.newPlayerStats;
      }
    }

    setCombatState(finalState);
    setPlayerStats(newPlayerStats);
    // Show floating damage based on last combat log entry (if any)
    const last = finalState.combatLog[finalState.combatLog.length - 1];
    if (last && last.actor === 'player' && last.damage && last.damage > 0) {
      const id = `hit_p_${Date.now()}`;
      // Try to anchor to selected target element
      let x: number | undefined;
      let y: number | undefined;
      try {
        const targetEnemy = combatState.enemies.find(e => e.id === selectedTarget);
        if (targetEnemy) {
          const el = enemyRefs.current[targetEnemy.id];
          if (el) {
            const r = el.getBoundingClientRect();
            x = r.left + r.width / 2;
            y = r.top + r.height / 2;
          }
        }
      } catch (e) { /* ignore */ }

      setFloatingHits(h => [{ id, actor: 'player', damage: last.damage, hitLocation: undefined, isCrit: !!last.isCrit, x, y }, ...h]);
      setTimeout(() => setFloatingHits(h => h.filter(x => x.id !== id)), ms(1600));

      // Play hit or crit sound only for non-player actors (avoid duplicating player's ability sound)
      // Player attacks already play an ability-specific SFX at the time of action; playing
      // another impact sound here causes duplicates for elemental spells.
      if (last.actor !== 'player') {
        try {
          // Use centralized audio service for impact/crit feedback for enemy actions
          const targetEnemy = combatState.enemies.find(e => e.id === selectedTarget);
          if (last.isCrit) {
            playCombatSound('melee', targetEnemy);
          } else {
            // Enemy hit the player — prefer the generic hit received sound
            playCombatSound('hit', undefined);
          }
        } catch (e) { console.warn('Failed to play impact sound (enemy)', e); }
      }
    }
    
    // In tests this will resolve instantly, but in production we keep the short delay for UX
    waitMs(ms(500)).then(() => setIsAnimating(false));
  };



  // Close defeat screen
  const handleDefeatClose = () => {
    const minutes = Math.max(1, Math.ceil((combatState.combatElapsedSec || 0) / 60));
    const builtCombatResult = combatState.combatResult || {
      id: combatState.id || `combat_${Date.now()}`,
      result: 'defeat' as const,
      winner: 'enemy' as const,
      survivors: combatState.enemies.filter(e => e.currentHealth > 0).map(e => ({ id: e.id, name: e.name, currentHealth: e.currentHealth })),
      playerStatus: { currentHealth: 0, currentMagicka: playerStats.currentMagicka, currentStamina: playerStats.currentStamina, isAlive: false },
      rewards: combatState.rewards || undefined,
      timestamp: Date.now()
    };
    onCombatEnd('defeat', undefined, {
      health: 0,
      magicka: playerStats.currentMagicka,
      stamina: playerStats.currentStamina
    }, minutes, builtCombatResult);
  };

  const isPlayerTurn = combatState.currentTurnActor === 'player' && combatState.active;
  // Player stun guard (used to disable controls while stunned)
  const playerStunned = Boolean((combatState.playerActiveEffects || []).find((pe: any) => pe.effect && pe.effect.type === 'stun' && pe.turnsRemaining > 0));

  // container ref used by the integration/test helper (see below)
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Integration helper: allow external test harnesses or developer shortcuts to trigger
  // an in-combat item use by clicking a button elsewhere in the document whose
  // textContent exactly matches an inventory item's name. Scoped to this modal so
  // tests that render CombatModal standalone behave the same as full-app flows.
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!combatState?.active) return;

    const handler = (ev: MouseEvent) => {
      if (playerStunned) return; // ignore external item clicks while stunned
      const target = ev.target as HTMLElement | null;
      if (!target || !(target instanceof HTMLButtonElement)) return;
      if (containerRef.current && containerRef.current.contains(target)) return;
      const text = (target.textContent || '').trim();
      if (!text) return;
      const usable = getUsableItems();
      const match = usable.find(i => i.name === text);
      if (!match) return;
      setTimeout(() => {
        try { handlePlayerAction('item', undefined, match.id); } catch (err) { console.debug && console.debug('[combat] external item-click helper failed', err); }
      }, 0);
    };


    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [combatState?.active, inventory]);

  // Mobile action panel collapsed state
  const [mobileActionsExpanded, setMobileActionsExpanded] = useState(true);

  // Auto-combat effect: when enabled, automatically perform a default action on the player's turn
  useEffect(() => {
    if (!autoCombat) return;
    if (!isPlayerTurn) return;
    if (isAnimating) return;
    if (pendingTargeting) return;

    let cancelled = false;
    (async () => {
      // short delay so the user can see the turn change; scaled by speed multiplier
      await waitMs(ms(150));
      if (cancelled) return;

      try {
        // Compute player's current health percentage
        const healthPct = Math.max(0, Math.min(100, Math.round((playerStats.currentHealth || 0) / Math.max(1, playerStats.maxHealth || 1) * 100)));

        const abilities = (playerStats.abilities || []);

        // If player's health is below threshold, prefer healing abilities (if affordable)
        let chosen: any = undefined;
        if (healthPct < 75) {
          for (const ab of abilities) {
            const affordable = (ab.cost === 0) || ((playerStats.currentMagicka || 0) >= (ab.cost || 0));
            const isHealing = !!(ab.heal || (ab.effects && ab.effects.some((ef: any) => ef.type === 'heal')));
            if (isHealing && affordable) { chosen = ab; break; }
          }
          if (chosen) {
            handlePlayerAction('magic', chosen.id);
            return;
          }
        }

        // Otherwise prefer a damaging magical ability if affordable, otherwise perform a basic attack
        for (const ab of abilities) {
          const affordable = (ab.cost === 0) || ((playerStats.currentMagicka || 0) >= (ab.cost || 0));
          if (ab.type === 'magic' && affordable && (ab.damage || (ab.effects && ab.effects.length > 0))) {
            chosen = ab; break;
          }
        }

        if (chosen) {
          handlePlayerAction('magic', chosen.id);
        } else {
          // Before performing a default attack, if we lack stamina, try using an unarmed strike (cost 0) when available
          try {
            const basic = (playerStats.abilities || []).find(a => a.id === 'basic_attack' || (a.type === 'melee' && typeof a.cost === 'number'));
            const basicCost = (basic && typeof basic.cost === 'number') ? basic.cost : 0;
            const currentStamina = playerStats.currentStamina || 0;
            if (basicCost > currentStamina) {
              const unarmed = (playerStats.abilities || []).find(a => (a as any).unarmed || a.id === 'unarmed_strike');
              if (unarmed) {
                handlePlayerAction('attack', unarmed.id);
                return;
              }
            }
          } catch (e) { /* best-effort fallback */ }

          handlePlayerAction('attack');
        }
      } catch (e) {
        // swallow errors to avoid crashing the loop
        console.debug && console.debug('[combat] auto-combat action failed', e);
      }
    })();

    return () => { cancelled = true; };
  }, [autoCombat, isPlayerTurn, isAnimating, pendingTargeting, playerStats, speedMultiplier]);

  // Arrow picker modal state
  const [arrowPickerOpen, setArrowPickerOpen] = useState(false);
  const [arrowPickerAbility, setArrowPickerAbility] = useState<CombatAbility | null>(null);

  // When clicking an ability, decide whether to open explicit target selection (for heals/buffs)
  const handleAbilityClick = (ability: CombatAbility) => {
    const isPositive = !!(ability.heal || (ability.effects && ability.effects.some((ef: any) => ['heal', 'buff'].includes(ef.type))));
    if (isPositive) {
      // Open a targeting mode limited to allies/self
      setPendingTargeting({ abilityId: ability.id, abilityName: ability.name, allow: 'allies' });
      // pre-select self for convenience
      setSelectedTarget('player');
      if (showToast) showToast(`Choose an ally or Self to use ${ability.name}`, 'info');
      return;
    }

    // If this is a ranged attack and the player currently has a bow equipped, show the arrow picker
    try {
      const equippedBow = (inventory || []).find(it => it.equipped && it.slot === 'weapon' && (it.name || '').toLowerCase().includes('bow'));
      if (ability.type === 'ranged' && equippedBow) {
        setArrowPickerAbility(ability);
        setArrowPickerOpen(true);
        return;
      }
    } catch (e) { /* best-effort, fall through to default behavior */ }

    // If the user very recently changed target, defer the ability click one tick so selectedTarget stabilizes
    if (Date.now() - (lastUserTargetChangeAt.current || 0) < 80) {
      lastAbilityClickAt.current = Date.now();
      setTimeout(() => {
        const actionForAbility = (ability.type === 'magic' || ability.type === 'shout') ? 'magic' : 'attack';
        handlePlayerAction(actionForAbility, ability.id);
      }, 0);
      return;
    }

    // Default immediate execution
    lastAbilityClickAt.current = Date.now();
    handlePlayerAction('attack', ability.id);
  };

  // Arrow selection helper - itemId is the arrow bundle id (e.g., 'fire_arrows')
  const chooseArrowAndAttack = (arrowItemId?: string) => {
    if (!arrowPickerAbility) return;
    setArrowPickerOpen(false);
    const abilityId = arrowPickerAbility.id;
    lastAbilityClickAt.current = Date.now();
    handlePlayerAction('attack', abilityId, arrowItemId);
    setArrowPickerAbility(null);
  };

  // Get usable items for combat (potions and food)
  const getUsableItems = () => {
    return inventory.filter(item => 
      item.quantity > 0 && (
        item.type === 'potion' ||
        item.type === 'food' ||
        item.type === 'drink'
      )
    );
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--skyrim-dark, #0f0f0f)' }}>
      <ArrowPicker open={arrowPickerOpen} onClose={() => { setArrowPickerOpen(false); setArrowPickerAbility(null); }} onChoose={(arrowId) => chooseArrowAndAttack(arrowId)} />

      <div className="bg-gradient-to-b from-stone-900 to-transparent p-2 sm:p-4 border-b border-amber-900/30 relative">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-amber-100 tracking-wider">⚔️ COMBAT</h2>
            <p className="text-xs sm:text-sm text-stone-400 truncate max-w-[150px] sm:max-w-none">{combatState.location} • T{combatState.turn} • {String(Math.floor(elapsedSecDisplay/60)).padStart(2,'0')}:{String(elapsedSecDisplay%60).padStart(2,'0')}</p>
            {(() => {
              // Player stun indicator
              const stun = (combatState.playerActiveEffects || []).find(pe => pe.effect && pe.effect.type === 'stun' && pe.turnsRemaining > 0);
              if (stun) return <p className="text-xs text-red-300 mt-1">⚡ Stunned ({stun.turnsRemaining})</p>;

              // Pending summons indicator (show each pending summon and remaining player turns)
              const pending = (combatState.pendingSummons || []).map((s: any) => {
                const ally = (combatState.allies || []).find((a: any) => a.id === s.companionId);
                return { name: ally?.name || s.companionId, remaining: s.playerTurnsRemaining };
              });
              if (pending.length > 0) {
                const list = pending.slice(0,3).map(p => `${p.name} (${p.remaining})`).join(', ');
                return <p className="text-xs text-amber-300 mt-1">⚔️ Summons pending: {list}{pending.length > 3 ? ` +${pending.length - 3} more` : ''}</p>;
              }

              // Decaying summoned ally indicator
              const decaying = (combatState.allies || []).filter((a: any) => a.companionMeta?.isSummon && a.companionMeta?.decayActive).map((a: any) => a.name);
              if (decaying.length > 0) return <p className="text-xs text-red-300 mt-1">⚡ Decaying summon: {decaying.join(', ')}</p>;

              return null;
            })() }
          </div>
          <div className="flex items-center gap-3">

            <div className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-base ${isPlayerTurn ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {isPlayerTurn ? '🎯 Your Turn' : '⏳ Enemy Turn'}
            </div>

            {/* Combat speed controls */}
            <div className="flex items-center gap-2 ml-2">
              <div className="text-xs text-stone-400 mr-1 hidden sm:block">Speed</div>
              <div className="flex gap-1">
                {[1,2,5].map(s => (
                  <button
                    key={s}
                    onClick={() => setAndPersistSpeed(s)}
                    aria-pressed={speedMultiplier === s}
                    className={`px-2 py-1 text-xs rounded transition-colors ${speedMultiplier === s ? 'bg-skyrim-gold text-skyrim-dark font-semibold' : 'bg-skyrim-paper/20 text-skyrim-text/70 hover:bg-skyrim-paper/30'}`}
                    title={`Set combat speed ${s}x`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Auto-combat toggle */}
              <button
                onClick={() => toggleAutoCombat()}
                aria-pressed={autoCombat}
                title={autoCombat ? 'Auto-combat ON' : 'Auto-combat OFF'}
                className={`ml-2 px-2 py-1 text-xs rounded font-semibold transition-colors ${autoCombat ? 'bg-green-700 text-green-100 border border-green-600' : 'bg-stone-800 text-stone-300 border border-stone-600'}`}
              >
                Auto {autoCombat ? 'ON' : 'OFF'}
              </button>

              {/* Loot popup menu (not an on/off toggle) */}
              <div className="relative ml-2">
                <button
                  onClick={() => setShowLootMenuOpen(prev => !prev)}
                  aria-expanded={showLootMenuOpen}
                  title="Loot options"
                  className="px-2 py-1 text-xs rounded font-semibold transition-colors bg-stone-800 text-stone-300 border border-stone-600"
                >
                  Loot
                </button>

                {showLootMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-stone-900 border border-stone-700 rounded shadow-lg p-2 z-70">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={showLootOnEnd}
                        onChange={() => toggleShowLootOnEnd()}
                        className="w-4 h-4 accent-amber-400"
                      />
                      <span>Show loot on victory</span>
                    </label>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => { const populated = populatePendingLoot(combatState); setCombatState(prev => ({ ...populated, lootPending: true } as any)); showToast?.('Loot modal opened', 'info'); setShowLootMenuOpen(false); }} className="px-3 py-1 bg-amber-700 rounded text-white text-sm">Show Loot Now</button>
                      <button onClick={() => setShowLootMenuOpen(false)} className="px-3 py-1 bg-stone-700 rounded text-white text-sm">Close</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* D20 roll visual centered in header */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-60 pointer-events-none" aria-hidden>
          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-skyrim-paper/60 border-2 flex items-center justify-center text-lg sm:text-xl ${rollActor === 'enemy' ? 'border-red-500 text-red-300' : rollActor === 'ally' ? 'border-sky-500 text-sky-300' : 'border-amber-500 text-amber-200'}`}>
            {showRoll && rollValue ? (
              <span className={`animate-bounce`}>{rollValue}</span>
            ) : (
              <span className="text-stone-500">&nbsp;</span>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Mobile: Compact player stats bar at top */}
      <div className="lg:hidden bg-stone-900/80 border-b border-amber-900/30 p-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-100 font-bold truncate max-w-[80px]">{getEasterEggName(character.name)}</span>
          <div className="flex-1 flex gap-1">
            <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all" style={{ width: `${(playerStats.currentHealth / playerStats.maxHealth) * 100}%` }} />
            </div>
            <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all" style={{ width: `${(playerStats.currentMagicka / playerStats.maxMagicka) * 100}%` }} />
            </div>
            <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-600 to-green-500 transition-all" style={{ width: `${(playerStats.currentStamina / playerStats.maxStamina) * 100}%` }} />
            </div>
          </div>
          <span className="text-[10px] text-red-300">{playerStats.currentHealth}/{playerStats.maxHealth}</span>
        </div>
        {
          // Show stunned/shielded and summon status with remaining rounds on mobile
          (() => {
            const stun = (combatState.playerActiveEffects || []).find(pe => pe.effect && pe.effect.type === 'stun' && pe.turnsRemaining > 0);
            if (stun) return <div className="mt-1 text-[10px] text-red-300">⚡ Stunned ({stun.turnsRemaining})</div>;
            const guard = (combatState.playerActiveEffects || []).find(pe => pe.effect && pe.effect.stat === 'guard' && pe.turnsRemaining > 0);
            if (guard) return <div className="mt-1 text-[10px] text-blue-300">🛡️ Shielded ({guard.turnsRemaining})</div>;

            // mobile: show pending summons and decaying succinctly
            const pending = (combatState.pendingSummons || []).map((s: any) => {
              const ally = (combatState.allies || []).find((a: any) => a.id === s.companionId);
              return { name: ally?.name || s.companionId, remaining: s.playerTurnsRemaining };
            });
            if (pending.length > 0) return <div className="mt-1 text-[10px] text-amber-300">⚔️ Summons: {pending[0].name} ({pending[0].remaining}){pending.length > 1 ? ` +${pending.length - 1}` : ''}</div>;

            const decaying = (combatState.allies || []).filter((a: any) => a.companionMeta?.isSummon && a.companionMeta?.decayActive).map((a: any) => a.name);
            if (decaying.length > 0) return <div className="mt-1 text-[10px] text-red-300">⚡ Decaying: {decaying[0]}{decaying.length > 1 ? ` +${decaying.length - 1}` : ''}</div>;

            if (combatState.playerDefending) return <div className="mt-1 text-[10px] text-blue-300">🛡️ Defending</div>;
            return null;
          })()
        }
      </div>



      {/* Main combat area - reorganized for mobile */}
      <div className="flex-1 overflow-auto grid gap-8 lg:grid-cols-[280px_1.8fr_320px_420px] items-stretch min-h-0 p-1 sm:p-4 w-full pb-32 lg:pb-4 h-[calc(100vh-120px)]">
        {/* Mobile Turn List (scrolls with content) */}
        <div className="lg:hidden w-full">
           <TurnList
              turnOrder={combatState.turnOrder || ['player', ...combatState.enemies.map(e => e.id)]}
              currentTurnActor={combatState.currentTurnActor}
              player={{ name: getEasterEggName(character.name), currentHealth: playerStats.currentHealth, maxHealth: playerStats.maxHealth }}
              enemies={combatState.enemies}
              allies={combatState.allies || []}
              className="max-h-[200px]"
            />
        </div>

        {/* Desktop: Left side - Player stats (hidden on mobile, shown in compact bar above) */}
        <div className="hidden lg:flex flex-col gap-4 w-full min-h-0 lg:pr-6 lg:border-r lg:border-stone-800/20 h-full">
          <div 
            ref={playerRef} 
            className={`rounded-lg p-4 border border-amber-900/30 ${recentlyHighlighted === 'player' ? 'ring-4 ring-amber-300/40 animate-pulse' : ''} ${selectedTarget === 'player' ? 'ring-2 ring-green-400/50' : ''} ${pendingTargeting ? 'cursor-pointer hover:ring-2 hover:ring-green-400/30' : ''}`} 
            style={{ background: 'var(--skyrim-paper, #1a1a1a)' }}
            onClick={() => {
              // Allow clicking on self during targeting mode
              if (pendingTargeting && (pendingTargeting.allow === 'allies' || pendingTargeting.allow === 'both')) {
                userInitiatedTargetChange.current = true; lastUserTargetChangeAt.current = Date.now();
                setSelectedTarget('player');
              }
            }}
          >
            <h3 className="text-lg font-bold text-amber-100 mb-3">
              {getEasterEggName(character.name)}
              <span className="ml-2 text-xs text-stone-400">• Lv.{character.level}</span>
            </h3>
            <div className="space-y-3">
              <HealthBar 
                current={playerStats.currentHealth} 
                max={playerStats.maxHealth} 
                label="Health" 
                color="bg-gradient-to-r from-red-600 to-red-500"
                isHealing={isHealing}
              />
              <HealthBar 
                current={playerStats.currentMagicka} 
                max={playerStats.maxMagicka} 
                label="Magicka" 
                color="bg-gradient-to-r from-blue-600 to-blue-500" 
              />
              <HealthBar 
                current={playerStats.currentStamina} 
                max={playerStats.maxStamina} 
                label="Stamina" 
                color="bg-gradient-to-r from-green-600 to-green-500" 
              />
            </div>
            
            <div className="mt-4 pt-3 border-t border-stone-700 grid grid-cols-2 gap-2 text-xs">
              <div className="text-stone-400">⚔ Damage: <span className="text-amber-200">{playerStats.weaponDamage}</span></div>
              <div className="text-stone-400">🛡 Armor: <span className="text-amber-200">{playerStats.armor}</span></div>
              <div className="text-stone-400">💫 Crit: <span className="text-amber-200">{playerStats.critChance}%</span></div>
              <div className="text-stone-400">💨 Dodge: <span className="text-amber-200">{playerStats.dodgeChance}%</span></div>
            </div>
            
            {/* Player status effects */}
            {playerStats.currentHealth < playerStats.maxHealth * 0.3 && (
              <div className="mt-3 px-2 py-1 bg-red-900/40 rounded text-xs text-red-300">
                ⚠️ Critical Health!
              </div>
            )}
            {(() => {
              const guard = (combatState.playerActiveEffects || []).find(pe => pe.effect && pe.effect.stat === 'guard' && pe.turnsRemaining > 0);
              if (guard) return (
                <div className="mt-2 px-2 py-1 bg-blue-900/40 rounded text-xs text-blue-300">🛡️ Shielded ({guard.turnsRemaining} round{guard.turnsRemaining > 1 ? 's' : ''}) — 40% DR</div>
              );
              if (combatState.playerDefending) return (
                <div className="mt-2 px-2 py-1 bg-blue-900/40 rounded text-xs text-blue-300">🛡️ Defending</div>
              );
              return null;
            })()}

            {/* ACTIONS (moved from right column) */}
            <div className="mt-4 bg-stone-900/60 rounded-lg p-4 border border-stone-700 max-h-[360px] overflow-y-auto">
              <h4 className="text-sm font-semibold text-stone-300 mb-2">ACTIONS</h4>

              {/* Main / Bonus action indicators (enhanced visuals) */}
              <div className="flex gap-2 mb-3 items-center flex-wrap overflow-hidden">
                <div data-tooltip="Primary action — Attack, Spell, or Power. Use once per turn." className={`combat-badge main-badge relative px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${!combatState.playerMainActionUsed ? 'bg-amber-500 text-white' : 'bg-amber-700 text-white opacity-80'}`}>
                  <span className="inline-block mr-1">⚔️</span>
                  <span>Main</span>
                  <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-black/20">{combatState.playerMainActionUsed ? 'Used' : 'Available'}</span>
                </div>

                <div data-tooltip="Bonus action — Potions, Defend, or Summons. Use once per turn." className={`combat-badge bonus-badge relative px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${!combatState.playerBonusActionUsed ? 'bg-purple-700 text-white' : 'bg-amber-700 text-white opacity-80'}`}>
                  <span className="inline-block mr-1">✨</span>
                  <span>Bonus</span>
                  <span className="ml-2 text-[10px] px-1 py-0.5 rounded bg-black/20">{combatState.playerBonusActionUsed ? 'Used' : 'Available'}</span>
                </div>

                <button onClick={() => handlePlayerAction('end_turn')} disabled={!isPlayerTurn || isAnimating} className="ml-auto px-2 py-1 rounded text-xs bg-stone-700 text-white hover:bg-stone-600 disabled:opacity-50">🔚 End Turn</button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handlePlayerAction('defend')}
                  disabled={!isPlayerTurn || isAnimating || !!(combatState as any).playerGuardUsed}
                  title={(combatState as any).playerGuardUsed ? 'Guard used this combat' : `Tactical Guard — 40% DR for ${Math.min(3, 1 + (getCombatPerkBonus(character, 'defendDuration') || 0))} round(s) (once per combat)`}
                  className="relative w-full p-2 rounded bg-blue-900/40 border border-blue-700/50 text-blue-200 hover:bg-blue-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(() => {
                    const perkBonus = character ? getCombatPerkBonus(character, 'defendDuration') : 0;
                    const predicted = Math.min(3, 1 + (perkBonus || 0));
                    return `🛡️ Defend${(combatState as any).playerGuardUsed ? ' (used)' : ''} — ${predicted}r`;
                  })()}
                  <span data-tooltip="Defend consumes your Bonus action." className={`bonus-pill absolute -top-2 -right-2 text-[10px] px-2 py-0.5 rounded-full font-semibold ${combatState.playerBonusActionUsed ? 'bg-amber-700 text-white opacity-80' : 'bg-indigo-600 text-white'}`}>{combatState.playerBonusActionUsed ? 'Used' : 'BONUS'}</span>
                </button>

                {combatState.fleeAllowed && (
                  <button
                    onClick={() => handlePlayerAction('flee')}
                    disabled={!isPlayerTurn || isAnimating}
                    className="w-full p-2 rounded bg-yellow-900/40 border border-yellow-700/50 text-yellow-200 hover:bg-yellow-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🏃 Flee
                  </button>
                )}

                {combatState.surrenderAllowed && (
                  <button
                    onClick={() => handlePlayerAction('surrender')}
                    disabled={!isPlayerTurn || isAnimating}
                    className="w-full p-2 rounded bg-stone-700/40 border border-stone-600 text-stone-300 hover:bg-stone-700/60 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🏳️ Surrender
                  </button>
                )}

                <button
                  onClick={() => handlePlayerAction('skip')}
                  disabled={!isPlayerTurn || isAnimating}
                  className="w-full p-2 rounded bg-stone-700/40 border border-stone-600 text-stone-300 hover:bg-stone-700/60 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ⏭️ Skip Turn
                </button>
              </div>
            </div>
            
            {/* Turn List */}
            <div className="flex-1 overflow-y-auto max-h-full">
              <TurnList
                turnOrder={combatState.turnOrder || ['player', ...combatState.enemies.map(e => e.id)]}
                currentTurnActor={combatState.currentTurnActor}
                player={{ name: getEasterEggName(character.name), currentHealth: playerStats.currentHealth, maxHealth: playerStats.maxHealth }}
                enemies={combatState.enemies}
                allies={combatState.allies || []}
                className="h-full"
              />
            </div>
          </div>
        </div>

        {/* Center - Allies and Enemies (combat log moved to its own column) */}
        <div className="w-full flex flex-col gap-4 min-h-0 lg:pl-4 lg:shadow-inner">
          {/* Allies (companions) */}
          {combatState.allies && combatState.allies.length > 0 && (
            <div className="bg-stone-900/40 rounded-lg p-4 border border-stone-700 mb-3">
              <h3 className="text-sm font-bold text-stone-400 mb-2">ALLIES</h3>
              <div className="grid grid-cols-2 gap-2">
                {combatState.allies.map(ally => {
                  const pending = (combatState.pendingSummons || []).find((s: any) => s.companionId === ally.id);
                  const pendingTurns = pending ? pending.playerTurnsRemaining : undefined;
                  const isDecaying = !!(ally as any).companionMeta?.decayActive;
                  return (
                  <div key={ally.id} className="p-1">
                    <EnemyCard
                      enemy={{ ...ally, pendingTurns }}
                      isTarget={selectedTarget === ally.id}
                      isHighlighted={recentlyHighlighted === ally.id}
                      isCurrentTurn={combatState.currentTurnActor === ally.id}
                      onToggleAutoControl={() => toggleAllyAutoControl(ally.id)}
                      onClick={() => {
                        if (pendingTargeting) {
                          if (pendingTargeting.allow === 'allies' || pendingTargeting.allow === 'both') {
                            userInitiatedTargetChange.current = true; lastUserTargetChangeAt.current = Date.now();
                            setSelectedTarget(ally.id);
                          } else {
                            if (lastAbilityClickAt.current && (Date.now() - lastAbilityClickAt.current) < 120) {
                              userInitiatedTargetChange.current = true; lastUserTargetChangeAt.current = Date.now();
                              setSelectedTarget(ally.id);
                              if (showToast) showToast(`Target selected: ${ally.name}`, 'info');
                              return;
                            }

                            if (showToast) showToast('This ability cannot target allies.', 'warning');
                            setSuppressRollLabelUntil(Date.now() + 600);
                            setSuppressRollForTurn(combatState.turn);

                            setCombatState(prev => ({
                              ...prev,
                              combatLog: (prev.combatLog || []).filter(e => !(e.turn === prev.turn && e.nat !== undefined))
                            }));
                            setTimeout(() => {
                              setCombatState(prev => ({
                                ...prev,
                                combatLog: (prev.combatLog || []).filter(e => !(e.turn === prev.turn && e.nat !== undefined))
                              }));
                            }, 0);
                            lastInvalidTargetRef.current = true;
                            if (rollAnimRef.current) { cancelAnimationFrame(rollAnimRef.current); rollAnimRef.current = null; }
                            setShowRoll(false);
                            setRollActor(null);
                            setIsAnimating(false);
                            setTimeout(() => { lastInvalidTargetRef.current = false; setSuppressRollForTurn(null); }, 600);
                          }
                        } else {
                          userInitiatedTargetChange.current = true; lastUserTargetChangeAt.current = Date.now();
                          setSelectedTarget(ally.id);
                        }
                      }}
                      containerRef={(el) => { enemyRefs.current[ally.id] = el; }}
                    />
                  </div>
                )})}
              </div>
            </div>
          )}

          {/* Enemies */}
          <div className="bg-stone-900/40 rounded-lg p-4 border border-stone-700 flex flex-col min-h-0">
            <h3 className="text-sm font-bold text-stone-400 mb-3">ENEMIES</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {combatState.enemies.map(enemy => (
                <div key={enemy.id} className="p-1">
                  <EnemyCard
                    enemy={enemy}
                    isTarget={selectedTarget === enemy.id}
                    isHighlighted={recentlyHighlighted === enemy.id}
                    onClick={() => {
                      if (pendingTargeting && pendingTargeting.allow === 'allies') {
                        if (showToast) showToast('This ability cannot target enemies.', 'warning');
                      } else {
                        userInitiatedTargetChange.current = true; lastUserTargetChangeAt.current = Date.now();
                        setSelectedTarget(enemy.id);
                      }
                    }}
                    containerRef={(el) => { enemyRefs.current[enemy.id] = el; }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Abilities & Inventory (Desktop only, stacked in Column 3) */}
        <div className="hidden lg:flex flex-col gap-4 w-full min-h-0 lg:pl-4 lg:pr-6 lg:border-l lg:border-stone-800/10">
          {/* Abilities */}
          <div className="bg-stone-900/60 rounded-lg p-4 border border-amber-900/30 flex flex-col min-h-[44vh]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              {(!awaitingCompanionAction && !pendingTargeting) ? (
                <div className="flex gap-1 bg-stone-900/80 p-1 rounded border border-stone-700">
                  <button 
                    onClick={() => setActiveAbilityTab('Physical')} 
                    className={`px-3 py-1 text-xs font-bold rounded transition-colors ${activeAbilityTab === 'Physical' ? 'bg-amber-900 text-amber-100' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800'}`}
                  >
                    PHYSICAL
                  </button>
                  <button 
                    onClick={() => setActiveAbilityTab('Magical')} 
                    className={`px-3 py-1 text-xs font-bold rounded transition-colors ${activeAbilityTab === 'Magical' ? 'bg-blue-900 text-blue-100' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800'}`}
                  >
                    MAGICAL
                  </button>
                </div>
              ) : (
                <h3 className="text-sm font-bold text-stone-400">
                  {awaitingCompanionAction ? 'COMPANION TURN' : 'SELECT TARGET'}
                </h3>
              )}
              <div className="flex items-center gap-2">
                <button onClick={() => setEquipModalOpen(true)} data-sfx="button_click" className="px-2 py-1 text-xs rounded bg-blue-800 hover:bg-blue-700 border border-blue-600">Equipment</button>
              </div>
            </div>

            {/* Abilities list (existing) */}

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {awaitingCompanionAction && combatState.allies && combatState.allies.length > 0 ? (
                (() => {
                  const allyActor = combatState.allies.find(a => a.id === combatState.currentTurnActor);
                  if (!allyActor) return null;
                  return (
                    <div>
                      <div className="text-xs text-skyrim-text mb-2">Control {allyActor.name} (Companion)</div>
                      <div className="space-y-2">
                        {allyActor.abilities.map(ab => {
                          const sub = determineSubcategory(ab);
                          const tab = (ab.type === 'melee' || ab.type === 'ranged') ? 'Physical' : 'Magical';
                          const accent = getAccentColor(tab as 'Physical' | 'Magical', sub);

                          // Determine if this ability requires explicit targeting (heals/buffs/etc.)
                          const companionNeedsTarget = !!(ab.heal || (ab.effects && ab.effects.some((ef: any) => ['heal','buff'].includes(ef.type))));

                          return (
                            <ActionButton
                              key={ab.id}
                              ability={ab}
                              disabled={isAnimating}
                              cooldown={combatState.abilityCooldowns[ab.id] || 0}
                              canAfford={true}
                              accentColor={accent}
                              onClick={async () => {
                                // If ability needs an explicit target, enter pendingTargeting (mirror player behavior)
                                if (companionNeedsTarget) {
                                  setPendingTargeting({ abilityId: ab.id, abilityName: ab.name, allow: 'allies' });
                                  // pre-select the companion for convenience and ensure UI remains in companion-control mode
                                  setSelectedTarget(allyActor.id);
                                  setAwaitingCompanionAction(true);
                                  if (showToast) showToast(`Choose a target for ${ab.name}`, 'info');
                                  return;
                                }

                                // Record a recent ability click so a quick ability->ally click sequence can be
                                // interpreted as "select target" instead of immediately performing the attack.
                                // Defer actual execution one tick to give the following click a chance to register.
                                lastAbilityClickAt.current = Date.now();

                                // Wrap the meat of the ability flow so we can optionally defer when the user just changed target
                                const performAbility = async () => {
                                  // debug
                                  // eslint-disable-next-line no-console
                                  console.debug && console.debug('[combat] companion.performAbility invoked', { abilityId: ab.id, selectedTarget, pendingTargeting, lastUserTargetChangeAt: lastUserTargetChangeAt.current });
                                  // debug
                                  // eslint-disable-next-line no-console
                                  console.debug && console.debug('[combat] companion.performAbility invoked', { abilityId: ab.id, selectedTarget, pendingTargeting, lastUserTargetChangeAt: lastUserTargetChangeAt.current });

                                  // If the user clicked an ability then immediately clicked an ally, treat that
                                  // sequence as "select target" (do NOT perform the ability). This prevents a
                                  // rapid ability->ally click from accidentally performing an offensive action
                                  // on an ally and consuming a turn. The ally-click handler already emits the
                                  // 'Target selected' toast; here we ensure the in-flight perform is a no-op.
                                  const nowMs = Date.now();
                                  const selectedIsAlly = !!((combatState.allies || []).find(a => a.id === selectedTarget));
                                  if (lastAbilityClickAt.current && (nowMs - lastAbilityClickAt.current) < 150 && selectedTarget && selectedIsAlly && !pendingTargeting) {
                                    // keep the companion control active and avoid performing the ability
                                    setAwaitingCompanionAction(true);
                                    setIsAnimating(false);
                                    lastAbilityClickAt.current = null;
                                    return;
                                  }

                                  // Local validation: prevent UI roll when target is invalid (mirror service rules)
                                  const abilityIsOffensive = !!(ab.damage && ab.damage > 0) || (ab.effects || []).some((ef: any) => ['aoe_damage','dot','damage'].includes(ef.type));
                                  const targetIsPlayer = selectedTarget === 'player';
                                  const targetIsAlly = !!((combatState.allies || []).find(a => a.id === selectedTarget));
                                  if ((targetIsPlayer || targetIsAlly) && abilityIsOffensive) {
                                    if (showToast) showToast('This ability cannot target allies.', 'warning');
                                    setSuppressRollLabelUntil(Date.now() + 250);
                                    setSuppressRollForTurn(combatState.turn);

                                    // Mark recent invalid-target so any asynchronously-scheduled roll animations
                                    // or combat-log renders will be suppressed immediately.
                                    lastInvalidTargetRef.current = true;

                                    // Cancel any in-flight roll animation frame and clear roll UI state immediately
                                    if (rollAnimRef.current) {
                                      cancelAnimationFrame(rollAnimRef.current);
                                      rollAnimRef.current = null;
                                    }
                                    setShowRoll(false);
                                    setRollActor(null);
                                    setRollValue(null);

                                    // clear the per-turn suppression after a short grace window
                                    setTimeout(() => setSuppressRollForTurn(null), ms(300));

                                    // defensive cleanup: remove any combat-log entries with a nat that were added this turn
                                    setCombatState(prev => ({
                                      ...prev,
                                      combatLog: (prev.combatLog || []).filter(e => !(e.turn === prev.turn && e.nat !== undefined))
                                    }));
                                    // schedule a follow-up cleanup to catch any entries that race in after this handler
                                    setTimeout(() => {
                                      setCombatState(prev => ({
                                        ...prev,
                                        combatLog: (prev.combatLog || []).filter(e => !(e.turn === prev.turn && e.nat !== undefined))
                                      }));
                                    }, 0);

                                  // debug: report any DOM elements that contain the text 'Roll:' so tests can be diagnosed
                                  try {
                                    // eslint-disable-next-line no-console
                                    const matches = Array.from(document.querySelectorAll('*')).filter(el => /Roll:/i.test(el.textContent || '')).map(el => ({ tag: el.tagName, text: (el.textContent||'').trim().slice(0,80) }));
                                    console.debug && console.debug('[combat] invalid-target -> DOM elements matching /Roll:/i', { matches });
                                  } catch (e) {}

                                    // ensure any pending roll UI is cleared and keep companion control active
                                    setAwaitingCompanionAction(true);
                                    setIsAnimating(false);

                                    // clear the invalid-target marker after a short grace window so subsequent actions behave normally
                                    setTimeout(() => { lastInvalidTargetRef.current = false; }, ms(250));
                                    return;
                                  }

                                  setIsAnimating(true);
                                  setAwaitingCompanionAction(false);

                                  // If companion is stunned, skip the roll animation and let engine handle the skip
                                  const comp = (combatState.allies || []).find(a => a.id === allyActor.id);
                                  const compStunned = comp?.activeEffects?.some((e: any) => e.effect && e.effect.type === 'stun' && e.turnsRemaining > 0);
                                  const companionRoll = Math.floor(Math.random() * 20) + 1;
                                  if (!compStunned) {
                                    await animateRoll(companionRoll, Math.floor(3000));
                                    await waitMs(ms(220));
                                    setShowRoll(false);
                                    setRollActor(null);
                                  }

                                  const res = executeCompanionAction(combatState, allyActor.id, ab.id, selectedTarget || undefined, compStunned ? undefined : companionRoll);
                                  if (!res.success) {
                                    // Invalid target or other failure — surface message and allow the player to choose again
                                    if (res.narrative && onNarrativeUpdate) onNarrativeUpdate(res.narrative);
                                    if (showToast) showToast(res.narrative || 'Invalid target for that ability.', 'warning');
                                    // mark recent invalid-target so any in-flight animation will be skipped
                                    lastInvalidTargetRef.current = true;
                                    // clear any roll UI to avoid confusing animations
                                    setShowRoll(false);
                                    setRollActor(null);
                                    setAwaitingCompanionAction(true);
                                    setIsAnimating(false);
                                    return;
                                  }

                                  if (res.narrative && onNarrativeUpdate) onNarrativeUpdate(res.narrative);
                                  try { playCombatSound(ab.type as any, allyActor, ab); } catch (e) {}

                                  // Show floating hit for companion action (if damage was applied)
                                  try {
                                    const last = res.newState.combatLog && res.newState.combatLog[res.newState.combatLog.length - 1];
                                    if (last && last.damage && last.damage > 0) {
                                      const id = `hit_comp_${Date.now()}`;
                                      let x: number | undefined;
                                      let y: number | undefined;
                                      const targetEnemy = (res.newState.enemies || []).find((e: any) => e.name === last.target || e.id === last.target);
                                      if (targetEnemy && enemyRefs.current[targetEnemy.id]) {
                                        const r = enemyRefs.current[targetEnemy.id]!.getBoundingClientRect();
                                        x = r.left + r.width / 2;
                                        y = r.top + r.height / 2;
                                      }
                                      setFloatingHits(h => [{ id, actor: last.actor, damage: last.damage, hitLocation: undefined, isCrit: !!last.isCrit, x, y }, ...h]);
                                      setTimeout(() => setFloatingHits(h => h.filter(x => x.id !== id)), ms(1600));
                                    }
                                  } catch (e) { /* best-effort */ }

                                  await waitMs(ms(600));

                                  const advanced = advanceTurn(res.newState);
                                  setCombatState(advanced);
                                  setIsAnimating(false);
                                  // useEffect will pick up the new turn and continue
                                };

                                // If the user just changed target, allow React state to settle first to avoid a click->race
                                if (Date.now() - (lastUserTargetChangeAt.current || 0) < 80) {
                                  // Defer execution to next tick so `selectedTarget` has been updated
                                  setTimeout(() => { void performAbility(); }, 0);
                                  return;
                                }

                                // Defer execution one tick so a rapid ability->ally click sequence can act as target selection
                                setTimeout(() => { void performAbility(); }, 0);
                                return;
                              }}
                            />
                          );
                        })}
                        <button onClick={() => {
                          // Skip companion's turn (log it) then advance
                          setAwaitingCompanionAction(false);
                          setCombatState(prev => {
                            const skipped = skipActorTurn(prev, allyActor.id);
                            return advanceTurn(skipped);
                          });
                          // Don't call processEnemyTurns directly - useEffect handles it
                        }} className="w-full px-3 py-2 rounded border border-skyrim-border text-skyrim-text">Skip Companion Turn</button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                // If pendingTargeting is active, show confirm/cancel for the selected ability
                pendingTargeting ? (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Choose target for <span className="text-amber-300">{pendingTargeting.abilityName}</span></div>
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        // Apply to self - explicitly set target to 'player'
                        setSelectedTarget('player');
                        const abilityIdToUse = pendingTargeting!.abilityId;
                        setPendingTargeting(null);

                        // If this is the player's turn, delegate to existing handler
                        if (isPlayerTurn) {
                          // Use setTimeout to ensure state is updated before action
                          setTimeout(() => handlePlayerAction('attack', abilityIdToUse), 0);
                          return;
                        }

                        // Companion confirming "Use on Self" while awaiting companion action
                        if (awaitingCompanionAction && combatState.currentTurnActor) {
                          setIsAnimating(true);
                          setAwaitingCompanionAction(false);
                          // roll
                          // If companion is stunned, skip roll animation and let engine handle the skip
                          const comp = (combatState.allies || []).find(a => a.id === combatState.currentTurnActor);
                          const compStunned = comp?.activeEffects?.some((e: any) => e.effect && e.effect.type === 'stun' && e.turnsRemaining > 0);
                          const companionRoll = Math.floor(Math.random() * 20) + 1;
                          if (!compStunned) {
                            await animateRoll(companionRoll, Math.floor(3000));
                            await waitMs(ms(220));
                            setShowRoll(false);
                            setRollActor(null);
                          }

                          const res = executeCompanionAction(combatState, combatState.currentTurnActor, abilityIdToUse, 'player', compStunned ? undefined : companionRoll);
                          if (!res.success) {
                            if (res.narrative && onNarrativeUpdate) onNarrativeUpdate(res.narrative);
                            if (showToast) showToast(res.narrative || 'Invalid target for that ability.', 'warning');
                            // clear any roll UI to avoid confusing animation after invalid target
                            setShowRoll(false);
                            setRollActor(null);
                            setAwaitingCompanionAction(true);
                            setIsAnimating(false);
                            return;
                          }
                          if (res.narrative && onNarrativeUpdate) onNarrativeUpdate(res.narrative);

                          // show floating hit for companion action if applicable
                          try {
                            const last = res.newState.combatLog && res.newState.combatLog[res.newState.combatLog.length - 1];
                            if (last && last.damage && last.damage > 0) {
                              const id = `hit_comp_confirm_${Date.now()}`;
                              let x: number | undefined;
                              let y: number | undefined;
                              const targetEnemy = (res.newState.enemies || []).find((e: any) => e.name === last.target || e.id === last.target);
                              if (targetEnemy && enemyRefs.current[targetEnemy.id]) {
                                const r = enemyRefs.current[targetEnemy.id]!.getBoundingClientRect();
                                x = r.left + r.width / 2;
                                y = r.top + r.height / 2;
                              }
                              setFloatingHits(h => [{ id, actor: last.actor, damage: last.damage, hitLocation: undefined, isCrit: !!last.isCrit, x, y }, ...h]);
                              setTimeout(() => setFloatingHits(h => h.filter(x => x.id !== id)), ms(1600));
                            }
                          } catch (e) { /* best-effort UI */ }

                          const advanced = advanceTurn(res.newState);
                          setCombatState(advanced);
                          setIsAnimating(false);
                        }
                      }} disabled={!(isPlayerTurn || awaitingCompanionAction) || isAnimating} data-sfx="button_click" className="flex-1 px-3 py-2 rounded bg-green-700 text-white">Use on Self</button>
                      <button onClick={async () => {
                        // Confirm selected target (must be self or ally for heals)
                        const currentTarget = selectedTarget;
                        const isValidTarget = currentTarget === 'player' || 
                          (combatState.allies || []).some(a => a.id === currentTarget);
                        
                        if (!isValidTarget) {
                          if (showToast) showToast('Please select yourself or an ally for this ability.', 'warning');
                          return;
                        }
                        
                        const abilityIdToUse = pendingTargeting!.abilityId;
                        setPendingTargeting(null);

                        if (isPlayerTurn) {
                          lastAbilityClickAt.current = Date.now();
                          handlePlayerAction('attack', abilityIdToUse);
                          return;
                        }

                        // Companion confirmation path
                        if (awaitingCompanionAction && combatState.currentTurnActor) {
                          // local validation: ensure ability allowed on selected target before rolling
                          const ability = (combatState.allies||[]).find(a=>a.id===combatState.currentTurnActor)?.abilities.find(x=>x.id===abilityIdToUse);
                          const abilityIsOffensive = !!(ability && ability.damage && ability.damage > 0) || (ability && (ability.effects||[]).some((ef:any)=>['aoe_damage','dot','damage'].includes(ef.type)));
                          const targetIsPlayer = selectedTarget === 'player';
                          const targetIsAlly = !!((combatState.allies||[]).find(a=>a.id===selectedTarget));
                          if ((targetIsPlayer || targetIsAlly) && abilityIsOffensive) {
                            if (showToast) showToast('This ability cannot target allies.', 'warning');
                            setSuppressRollLabelUntil(Date.now() + 600);
                            setSuppressRollForTurn(combatState.turn);

                            // Mark recent invalid-target and cancel any in-flight roll UI
                            lastInvalidTargetRef.current = true;
                            if (rollAnimRef.current) { cancelAnimationFrame(rollAnimRef.current); rollAnimRef.current = null; }
                            setShowRoll(false);
                            setRollActor(null);
                            setRollValue(null);
                            setAwaitingCompanionAction(true);
                            setIsAnimating(false);

                            setTimeout(() => { lastInvalidTargetRef.current = false; setSuppressRollForTurn(null); }, 600);
                            return;
                          }

                          setIsAnimating(true);
                          setAwaitingCompanionAction(false);

                          // If companion is stunned, skip the visual roll
                          const comp = (combatState.allies || []).find(a => a.id === combatState.currentTurnActor);
                          const compStunned = comp?.activeEffects?.some((e: any) => e.effect && e.effect.type === 'stun' && e.turnsRemaining > 0);
                          const companionRoll = Math.floor(Math.random() * 20) + 1;
                          if (!compStunned) {
                            await animateRoll(companionRoll, Math.floor(3000));
                            await waitMs(ms(220));
                            setShowRoll(false);
                            setRollActor(null);
                          }

                          const res = executeCompanionAction(combatState, combatState.currentTurnActor, abilityIdToUse, selectedTarget || undefined, compStunned ? undefined : companionRoll);
                          if (!res.success) {
                            if (res.narrative && onNarrativeUpdate) onNarrativeUpdate(res.narrative);
                            if (showToast) showToast(res.narrative || 'Invalid target for that ability.', 'warning');
                            // mark recent invalid-target so any in-flight animation will be skipped
                            lastInvalidTargetRef.current = true;
                            setAwaitingCompanionAction(true);
                            setIsAnimating(false);
                            return;
                          }
                          if (res.narrative && onNarrativeUpdate) onNarrativeUpdate(res.narrative);

                          try {
                            const last = res.newState.combatLog && res.newState.combatLog[res.newState.combatLog.length - 1];
                            if (last && last.damage && last.damage > 0) {
                              const id = `hit_comp_confirm_${Date.now()}`;
                              let x: number | undefined;
                              let y: number | undefined;
                              const targetEnemy = (res.newState.enemies || []).find((e: any) => e.name === last.target || e.id === last.target);
                              if (targetEnemy && enemyRefs.current[targetEnemy.id]) {
                                const r = enemyRefs.current[targetEnemy.id]!.getBoundingClientRect();
                                x = r.left + r.width / 2;
                                y = r.top + r.height / 2;
                              }
                              setFloatingHits(h => [{ id, actor: last.actor, damage: last.damage, hitLocation: undefined, isCrit: !!last.isCrit, x, y }, ...h]);
                              setTimeout(() => setFloatingHits(h => h.filter(x => x.id !== id)), ms(1600));
                            }
                          } catch (e) { /* best-effort UI */ }

                          const advancedState = advanceTurn(res.newState);
                          setCombatState(advancedState);
                          setIsAnimating(false);
                        }
                      }} disabled={!(isPlayerTurn || awaitingCompanionAction) || isAnimating || !selectedTarget} data-sfx="button_click" className="flex-1 px-3 py-2 rounded bg-blue-700 text-white">Confirm Target</button>
                    </div>
                    <button onClick={() => setPendingTargeting(null)} data-sfx="button_click" className="w-full px-3 py-2 rounded border border-skyrim-border text-skyrim-text">Cancel</button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    {/* Render Categorized Abilities */}
                    {Object.entries(categorizedAbilities[activeAbilityTab]).map(([subCat, abilities]: [string, CombatAbility[]]) => {
                      if (abilities.length === 0) return null;
                      return (
                         <div key={subCat} className="space-y-1">
                            <div className="text-[10px] font-bold text-stone-500 uppercase flex items-center gap-2 mb-1 pl-1">
                               <span>{subCat}</span>
                               <div className="h-px flex-1 bg-stone-800"></div>
                            </div>
                            <div className="space-y-2">
                              {abilities.map((ability: CombatAbility) => (
                                <ActionButton
                                  key={ability.id}
                                  ability={ability}
                                  disabled={!isPlayerTurn || isAnimating || playerStunned}
                                  cooldown={combatState.abilityCooldowns[ability.id] || 0}
                                  canAfford={
                                    ability.type === 'magic' 
                                      ? playerStats.currentMagicka >= ability.cost
                                      : true
                                  }
                                  accentColor={getAccentColor(activeAbilityTab as 'Physical' | 'Magical', subCat)}
                                  onClick={() => handleAbilityClick(ability)}
                                />
                              ))}
                            </div>
                         </div>
                      );
                    })}
                    {/* Empty state handle */}
                    {Object.values(categorizedAbilities[activeAbilityTab] as Record<string, CombatAbility[]>).every(arr => arr.length === 0) && (
                      <div className="text-center text-stone-600 py-8 text-sm italic">
                        No {activeAbilityTab.toLowerCase()} abilities available.
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-stone-900/60 rounded-lg p-4 border border-green-900/30">
            <h3 className="text-sm font-bold text-stone-400 mb-3">INVENTORY</h3>
            <div className="space-y-2">
              {getUsableItems().length > 0 ? (
                <>
                  {!showItemSelection ? (
                    <button
                      onClick={() => setShowItemSelection(true)}
                      disabled={!isPlayerTurn || isAnimating || playerStunned}
                      data-sfx="button_click"
                      className="w-full p-2 rounded bg-green-900/40 border border-green-700/50 text-green-200 hover:bg-green-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🧪 Use Item ({getUsableItems().length})
                    </button>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      <button
                        onClick={() => setShowItemSelection(false)}
                        className="w-full p-1 text-xs rounded bg-stone-700/40 border border-stone-600 text-stone-300 hover:bg-stone-700/60"
                      >
                        ← Back
                      </button>
                      {getUsableItems().map(item => {
                        const restoration = getItemRestorationValues(item);
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              handlePlayerAction('item', undefined, item.id);
                              setShowItemSelection(false);
                            }}
                            disabled={!isPlayerTurn || isAnimating || playerStunned}
                            className="w-full p-2 rounded bg-green-900/40 border border-green-700/50 text-green-200 hover:bg-green-900/60 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{item.name} <span data-tooltip="Using this item consumes your Bonus action." className="bonus-pill ml-2 inline-block text-[10px] px-1 py-0.5 rounded-full bg-indigo-600 text-white">BONUS</span></span>
                              <span className="text-xs text-stone-400 bg-stone-800/60 px-1.5 py-0.5 rounded">x{item.quantity}</span>
                            </div>
                            {/* Restoration values display */}
                            <div className="text-xs mt-1 flex flex-wrap gap-1.5">
                              {restoration.health && (
                                <span className="text-red-300 bg-red-900/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  ❤️ +{restoration.health}
                                </span>
                              )}
                              {restoration.magicka && (
                                <span className="text-blue-300 bg-blue-900/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  ✨ +{restoration.magicka}
                                </span>
                              )}
                              {restoration.stamina && (
                                <span className="text-green-300 bg-green-900/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  ⚡ +{restoration.stamina}
                                </span>
                              )}
                              {restoration.hunger && (
                                <span className="text-orange-300 bg-orange-900/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  🍖 -{restoration.hunger}
                                </span>
                              )}
                              {restoration.thirst && (
                                <span className="text-cyan-300 bg-cyan-900/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  💧 -{restoration.thirst}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-stone-500 mt-0.5 italic">
                              {item.type === 'potion' ? (item.subtype === 'stamina' ? 'Stamina Potion' : item.subtype === 'magicka' ? 'Magicka Potion' : 'Health Potion') : 
                               item.type === 'food' ? 'Food' : 'Drink'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-stone-500 text-center py-2">
                  No usable items
                </div>
              )}
            </div>
          </div>

          {/* Actions moved to player panel on desktop — preserved here as a placeholder */}
          <div className="hidden lg:block" aria-hidden="true" />
        </div>

        {/* Column 4 — Combat Log (Desktop only) */}
        <div className="hidden lg:flex flex-col gap-4 w-full min-h-0">
          <div className="bg-stone-900/60 rounded-lg p-4 border border-stone-700 h-full flex flex-col min-h-0">
            <div className="flex items-center justify-between p-3 border-b border-stone-700">
              <h3 className="text-sm font-bold text-stone-400">COMBAT LOG</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoScroll(s => !s)}
                  aria-pressed={autoScroll}
                  title={autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors focus:outline-none ${autoScroll ? 'bg-green-700 text-green-100 border border-green-600' : 'bg-stone-800 text-stone-300 border border-stone-600'}`}>
                  Auto-scroll {autoScroll ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
              {combatState.combatLog.map((entry, i) => {
                const isAlly = !!(combatState.allies && combatState.allies.find(a => a.name === entry.actor));
                const key = entry.id || `log-${entry.turn}-${entry.actor}-${entry.timestamp || i}`;
                return (
                  <div 
                    key={key}
                    data-testid={`combat-log-entry`}
                    className={`text-sm p-2 rounded ${
                      entry.actor === 'player' 
                        ? 'bg-green-900/20 border-l-2 border-green-500' 
                        : entry.actor === 'system'
                          ? 'bg-amber-900/20 border-l-2 border-amber-500'
                          : isAlly
                            ? 'bg-sky-900/10 border-l-2 border-sky-400 text-sky-200' 
                            : 'bg-red-900/20 border-l-2 border-red-500'
                    }`}
                  >
                    <span className="text-xs text-stone-500 mr-2">T{entry.turn}</span>
                    <span className="text-stone-300">{entry.narrative}</span>
                    {entry.nat !== undefined && !(suppressRollLabelUntil && Date.now() < suppressRollLabelUntil) && !lastInvalidTargetRef.current && entry.turn !== suppressRollForTurn && (
                      <span className="text-xs text-stone-400 ml-2">• Roll: {entry.nat}{entry.rollTier ? ` • ${entry.rollTier}` : ''}</span>
                    )}
                    {entry.auto && (
                      <span className="ml-2 inline-block text-[10px] bg-sky-700 text-sky-100 px-2 py-0.5 rounded">AUTO</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Inline action panel (replacing fixed bottom bar) */}
      <div className="lg:hidden block bg-stone-900/95 border-t border-amber-900/30">
        {/* Action bar toggle */}
        <button 
          onClick={() => setMobileActionsExpanded(!mobileActionsExpanded)}
          className="w-full py-2 flex items-center justify-center gap-2 text-sm text-amber-200 bg-stone-800"
        >
          {mobileActionsExpanded ? '▼ Hide Actions' : '▲ Show Actions'}
        </button>
        
        {mobileActionsExpanded && (
          <div className="p-2 max-h-[50vh] overflow-y-auto">
            {/* Tab selection for mobile abilities */}
            {(!awaitingCompanionAction && !pendingTargeting) && (
              <div className="flex gap-1 mb-2 bg-stone-900/80 p-1 rounded border border-stone-700">
                <button 
                  onClick={() => setActiveAbilityTab('Physical')} 
                  className={`flex-1 px-3 py-1.5 text-xs font-bold rounded transition-colors ${activeAbilityTab === 'Physical' ? 'bg-amber-900 text-amber-100' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800'}`}
                >
                  ⚔️ PHYSICAL
                </button>
                <button 
                  onClick={() => setActiveAbilityTab('Magical')} 
                  className={`flex-1 px-3 py-1.5 text-xs font-bold rounded transition-colors ${activeAbilityTab === 'Magical' ? 'bg-blue-900 text-blue-100' : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800'}`}
                >
                  ✨ MAGICAL
                </button>
              </div>
            )}
            
            {/* Quick abilities grid - shows all abilities in selected category */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-stone-400">
                  {awaitingCompanionAction ? 'COMPANION ABILITIES' : `${activeAbilityTab.toUpperCase()} ABILITIES`}
                </span>
                <button onClick={() => setEquipModalOpen(true)} data-sfx="button_click" className="px-2 py-0.5 text-[10px] rounded bg-blue-800 hover:bg-blue-700">⚔ Equip</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-[25vh] overflow-y-auto">
                {awaitingCompanionAction && combatState.allies && combatState.allies.length > 0 ? (
                  (() => {
                    const allyActor = combatState.allies.find(a => a.id === combatState.currentTurnActor);
                    if (!allyActor) return null;
                    return (
                      <>
                        {allyActor.abilities.map(ab => {
                          const sub = determineSubcategory(ab);
                          const tab = (ab.type === 'melee' || ab.type === 'ranged') ? 'Physical' : 'Magical';
                          const accent = getAccentColor(tab as 'Physical' | 'Magical', sub);

                          const companionNeedsTarget = !!(ab.heal || (ab.effects && ab.effects.some((ef: any) => ['heal','buff'].includes(ef.type))));

                          return (
                            <ActionButton
                              key={ab.id}
                              compact
                              ability={ab}
                              disabled={isAnimating}
                              cooldown={combatState.abilityCooldowns[ab.id] || 0}
                              canAfford={true}
                              accentColor={accent}
                              onClick={async () => {
                                if (companionNeedsTarget) {
                                  setPendingTargeting({ abilityId: ab.id, abilityName: ab.name, allow: 'allies' });
                                  setSelectedTarget(allyActor.id);
                                  setAwaitingCompanionAction(true);
                                  if (showToast) showToast(`Choose a target for ${ab.name}`, 'info');
                                  return;
                                }

                                setIsAnimating(true);
                                setAwaitingCompanionAction(false);
                                setRollActor('ally');
                                const companionRoll = Math.floor(Math.random() * 20) + 1;
                                await animateRoll(companionRoll, Math.floor(3000));
                                await waitMs(ms(220));
                                setShowRoll(false);
                                setRollActor(null);

                                const res = executeCompanionAction(combatState, allyActor.id, ab.id, selectedTarget || undefined, companionRoll);
                                if (!res.success) {
                                  if (res.narrative && onNarrativeUpdate) onNarrativeUpdate(res.narrative);
                                  if (showToast) showToast(res.narrative || 'Invalid target for that ability.', 'warning');
                                  setShowRoll(false);
                                  setRollActor(null);
                                  setAwaitingCompanionAction(true);
                                  setIsAnimating(false);
                                  return;
                                }
                                if (res.narrative && onNarrativeUpdate) onNarrativeUpdate(res.narrative);

                                await waitMs(ms(600));

                                const advanced = advanceTurn(res.newState);
                                setCombatState(advanced);
                                setIsAnimating(false);
                              }}
                            />
                          );
                        })}
                      </>
                    );
                  })()
                ) : (
                  // Show abilities from active tab category
                  Object.entries(categorizedAbilities[activeAbilityTab]).flatMap(([subCat, abilities]: [string, CombatAbility[]]) =>
                    abilities.map(ability => {
                      const accent = getAccentColor(activeAbilityTab as 'Physical' | 'Magical', subCat);
                      const conjureLocked = (ability.effects || []).some((ef: any) => ef.type === 'summon') && combatHasActiveSummon(combatState);
                      const isDisabledBtn = !isPlayerTurn || isAnimating || conjureLocked || (combatState.abilityCooldowns[ability.id] || 0) > 0 || (ability.type === 'magic' && playerStats.currentMagicka < ability.cost);
                      return (
                        <button
                          key={ability.id}
                          disabled={isDisabledBtn}
                          aria-disabled={isDisabledBtn}
                          data-tooltip={conjureLocked ? 'Already summoned' : (ability.description || undefined)}
                          onClick={() => {
                            if (conjureLocked) {
                              showToast && showToast('Already summoned', 'warning');
                              return;
                            }
                            // Use same targeting flow as desktop
                            const isPositive = !!(ability.heal || (ability.effects && ability.effects.some((ef: any) => ['heal', 'buff'].includes(ef.type))));
                            if (isPositive) {
                              setPendingTargeting({ abilityId: ability.id, abilityName: ability.name, allow: 'allies' });
                              setSelectedTarget('player');
                              if (showToast) showToast(`Choose target for ${ability.name}`, 'info');
                              return;
                            }
                            lastAbilityClickAt.current = Date.now();
                            const actionForAbility = (ability.type === 'magic' || ability.type === 'shout') ? 'magic' : 'attack';
                            handlePlayerAction(actionForAbility, ability.id);
                          }}
                          title={ability.description || `${ability.name} - ${ability.type} ability`}
                          data-sfx="button_click"
                          className={`px-2 py-2 rounded text-xs font-bold truncate transition-colors ${isDisabledBtn ? 'bg-stone-700 text-stone-500 opacity-50' : ''}`}
                          style={!isDisabledBtn ? { background: `linear-gradient(135deg, ${accent}22, ${accent}11, rgba(0,0,0,0.45))`, color: getTextColorForAccent(accent), boxShadow: `inset 4px 0 0 ${accent}`, borderColor: `${accent}88` } : undefined}
                        >
                          <span className="inline-block w-2 h-2 rounded-sm mr-1 align-middle" style={{ backgroundColor: accent }} />
                          <span className="truncate">{ability.name}{(ability.effects || []).some((ef: any) => ef.type === 'summon') && <span data-tooltip="Summons consume your Bonus action." className="bonus-pill ml-2 inline-block text-[10px] px-1 py-0.5 rounded-full bg-purple-600 text-white">BONUS</span>}</span>
                          {(combatState.abilityCooldowns[ability.id] || 0) > 0 && (
                            <span className="text-[10px] ml-1">({combatState.abilityCooldowns[ability.id]})</span>
                          )}
                          {ability.cost > 0 && (
                            <span className="text-[9px] ml-1 opacity-70">
                              {ability.type === 'magic' ? '💧' : '⚡'}{ability.cost}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )
                )}
              </div>
            </div>
            
            {/* Quick action buttons row */}
            <div className="flex gap-1">
              <button
                onClick={() => handlePlayerAction('defend')}
                disabled={!isPlayerTurn || isAnimating || playerStunned}
                data-sfx="button_click"
                className="flex-1 py-2 rounded bg-blue-900/60 border border-blue-700/50 text-blue-200 text-xs font-bold disabled:opacity-50"
              >
                🛡️ Defend
              </button>
              
              {getUsableItems().length > 0 && (
                <button
                  onClick={() => setShowItemSelection(!showItemSelection)}
                  disabled={!isPlayerTurn || isAnimating || playerStunned}
                  data-sfx="button_click"
                  className="flex-1 py-2 rounded bg-green-900/60 border border-green-700/50 text-green-200 text-xs font-bold disabled:opacity-50"
                >
                  🧪 Items ({getUsableItems().length})
                </button>
              )}
              
              {combatState.fleeAllowed && (
                <button
                  onClick={() => handlePlayerAction('flee')}
                  disabled={!isPlayerTurn || isAnimating || playerStunned}
                  data-sfx="button_click"
                  className="flex-1 py-2 rounded bg-yellow-900/60 border border-yellow-700/50 text-yellow-200 text-xs font-bold disabled:opacity-50"
                >
                  🏃 Flee
                </button>
              )}
            </div>
            
            {/* Mobile item selection panel */}
            {showItemSelection && getUsableItems().length > 0 && (
              <div className="mt-2 p-2 bg-stone-800 rounded border border-green-700/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-green-300">Select Item</span>
                  <button onClick={() => setShowItemSelection(false)} className="text-xs text-stone-400">✕</button>
                </div>
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                  {getUsableItems().map(item => {
                    const restoration = getItemRestorationValues(item);
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handlePlayerAction('item', undefined, item.id);
                          setShowItemSelection(false);
                        }}
                        disabled={!isPlayerTurn || isAnimating}
                        className="p-1.5 rounded bg-green-900/40 border border-green-700/50 text-green-200 text-[10px] text-left disabled:opacity-50"
                      >
                        <div className="flex justify-between">
                          <span className="truncate font-medium">{item.name}</span>
                          <span className="text-stone-400">x{item.quantity}</span>
                        </div>
                        {/* Compact restoration display for mobile */}
                        <div className="flex flex-wrap gap-0.5 mt-0.5">
                          {restoration.health && <span className="text-red-300">❤️+{restoration.health}</span>}
                          {restoration.magicka && <span className="text-blue-300">✨+{restoration.magicka}</span>}
                          {restoration.stamina && <span className="text-green-300">⚡+{restoration.stamina}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mobile: Pending targeting controls (compact row) */}
            {pendingTargeting && (
              <div className="mt-2 p-2 bg-stone-800 rounded flex items-center gap-2">
                <div className="flex-1 text-xs text-stone-100">Choose target for <span className="text-amber-300">{pendingTargeting.abilityName}</span></div>
                <button onClick={() => {
                  // Use on self - explicitly set target to 'player'
                  setSelectedTarget('player');
                  const abilityIdToUse = pendingTargeting!.abilityId;
                  setPendingTargeting(null);
                  setTimeout(() => handlePlayerAction('attack', abilityIdToUse), 0);
                }} disabled={!isPlayerTurn || isAnimating} className="px-3 py-1 rounded bg-green-700 text-white text-xs">Use Self</button>
                <button onClick={() => {
                  // Confirm selected target (must be self or ally for heals)
                  const currentTarget = selectedTarget;
                  const isValidTarget = currentTarget === 'player' || 
                    (combatState.allies || []).some(a => a.id === currentTarget);
                  
                  if (!isValidTarget) {
                    if (showToast) showToast('Please select yourself or an ally.', 'warning');
                    return;
                  }
                  
                  const abilityIdToUse = pendingTargeting!.abilityId;
                  setPendingTargeting(null);
                  handlePlayerAction('attack', abilityIdToUse);
                }} disabled={!isPlayerTurn || isAnimating || !selectedTarget} className="px-3 py-1 rounded bg-blue-700 text-white text-xs">Confirm</button>
                <button onClick={() => setPendingTargeting(null)} className="px-2 py-1 rounded border border-stone-700 text-stone-300 text-xs">Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>



      {/* Loot modal shown when combatState indicates loot is pending */}
      {combatState.lootPending && (
        <LootModal
          combatState={combatState}
          onCancel={handleLootCancel}
          onConfirm={handleLootConfirm}
        />
      )}

      {/* Screen flash effects */}
      {screenFlash && <ScreenFlash effectType={screenFlash} duration={300} />}

      {/* Spell visual effects */}
      {spellEffects.map((effect) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        return (
          <div key={effect.id}>
            {/* Render different effects based on spell type */}
            {effect.type === 'healing' && (
              <>
                <HolyLight x={centerX} y={centerY - 100} duration={800} />
                <ParticleEffect x={centerX} y={centerY} effectType="healing" count={15} />
                <EnergyRing x={centerX} y={centerY} effectType="healing" duration={600} />
              </>
            )}
            {effect.type === 'conjuration' && (
              <>
                <PortalRift x={centerX} y={centerY} duration={800} />
                <ParticleEffect x={centerX} y={centerY} effectType="conjuration" count={20} />
              </>
            )}
            {effect.type === 'fire' && (
              <>
                <ParticleEffect x={centerX} y={centerY} effectType="fire" count={18} />
                <EnergyRing x={centerX} y={centerY} effectType="fire" duration={500} />
              </>
            )}
            {effect.type === 'frost' && (
              <>
                <ParticleEffect x={centerX} y={centerY} effectType="frost" count={18} />
                <EnergyRing x={centerX} y={centerY} effectType="frost" duration={500} />
              </>
            )}
            {effect.type === 'shock' && (
              <>
                <LightningBolt
                  fromX={centerX}
                  fromY={centerY - 200}
                  toX={centerX}
                  toY={centerY + 200}
                  duration={150}
                />
                <ParticleEffect x={centerX} y={centerY} effectType="shock" count={20} />
                <EnergyRing x={centerX} y={centerY} effectType="shock" duration={400} />
              </>
            )}
          </div>
        );
      })}

      {/* Floating damage / hit indicators */}
      {floatingHits.map((hit) => {
        const isHeal = (hit as any).isHeal === true;
        const base = isHeal || hit.actor === 'player'
          ? 'bg-green-900/60 text-green-200 border border-green-400'
          : 'bg-red-900/60 text-red-200 border border-red-400';
        const critClasses = hit.isCrit
          ? 'scale-110 ring-2 ring-amber-400 text-amber-200 font-extrabold animate-pulse'
          : '';

        return (
          <div
            key={hit.id}
            className="absolute z-50 pointer-events-none"
            style={{
              left: hit.x ? `${hit.x}px` : '50%',
              top: hit.y ? `${hit.y}px` : '120px',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className={`px-3 py-1 rounded-lg text-sm font-bold ${base} ${critClasses} transition-transform duration-300`}>
              {hit.isCrit ? '💥 ' : ''}{isHeal ? '+' : '-'}{hit.damage} {hit.hitLocation ? `(${hit.hitLocation})` : ''}
            </div>
          </div>
        );
      })}

      {/* Defeat overlay */}
      {showDefeat && (
        <div className="absolute inset-0 bg-skyrim-dark/90 flex items-center justify-center z-60">
          <div className="bg-gradient-to-b from-red-900/90 to-stone-900/95 rounded-xl p-8 max-w-md text-center border-2 border-red-500 shadow-cheap">
            <div className="text-6xl mb-4">💀</div>
            <h2 className="text-3xl font-bold text-red-100 mb-2">DEFEATED</h2>
            <p className="text-stone-300 mb-6">You have fallen in battle...</p>
            
            <button
              onClick={handleDefeatClose}
              className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
            >
              Accept Fate
            </button>
          </div>
        </div>
      )}

      {/* Equipment modal (non-blocking) */}
      <ModalWrapper open={equipModalOpen} onClose={() => { setEquipModalOpen(false); setEquipSelectedSlot(null); }} preventOutsideClose={false}>
        <div className="w-[760px] max-w-full bg-stone-900/95 rounded-lg p-4 border border-stone-700 max-h-[85vh] overflow-y-auto">
          <h3 className="text-lg font-bold text-amber-100 mb-3">Equipment</h3>
          <EquipmentHUD items={localInventory} onUnequip={(it) => unequipItem(it)} onEquipFromSlot={(slot) => setEquipSelectedSlot(slot)} />
          
          {/* Loadout Manager in Combat Equipment */}
          <div className="mt-4">
            <LoadoutManager
              items={localInventory}
              characterId={character?.id}
              onApplyLoadout={(mapping) => {
                const updatedItems = localInventory.map(it => ({
                  ...it,
                  equipped: !!mapping[it.id],
                  slot: mapping[it.id]?.slot
                }));
                setLocalInventory(updatedItems);
                onInventoryUpdate && onInventoryUpdate(updatedItems as InventoryItem[]);
                // Recalculate player stats with preserved vitals
                setPlayerStats(prev => {
                  const recalculated = calculatePlayerCombatStats(character, updatedItems);
                  return { ...recalculated, currentHealth: prev.currentHealth, currentMagicka: prev.currentMagicka, currentStamina: prev.currentStamina };
                });
              }}
              showToast={showToast}
              compact
            />
          </div>
          
          {equipSelectedSlot && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-stone-300 mb-2">Equip to: {equipSelectedSlot}</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(localInventory.filter(it => (it.type === 'weapon' || it.type === 'apparel') && (getDefaultSlotForItem(it) === equipSelectedSlot || it.slot === equipSelectedSlot))).map(item => (
                  <button key={item.id} onClick={() => equipItem(item, equipSelectedSlot)} className="w-full text-left p-3 bg-skyrim-paper/40 border border-skyrim-border rounded hover:border-skyrim-gold transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-amber-200">{item.name}</div>
                        <div className="text-xs text-stone-400">{item.type} {item.damage ? (() => { const b = getItemBaseAndBonus(item as any); return `• ⚔ ${b.totalDamage}${b.bonusDamage ? ` (${b.baseDamage} + ${b.bonusDamage})` : ''}` })() : ''} {item.armor ? (() => { const b = getItemBaseAndBonus(item as any); return `• 🛡 ${b.totalArmor}${b.bonusArmor ? ` (${b.baseArmor} + ${b.bonusArmor})` : ''}` })() : ''}  </div>
                      </div>
                      <div className="text-xs text-stone-400">{item.equipped && item.slot === equipSelectedSlot ? 'Equipped' : 'Equip'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ModalWrapper>


    </div>
  );
};

export default CombatModal;
