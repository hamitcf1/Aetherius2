/**
 * CombatModal - Pokemon-style turn-based combat UI
 * Full-screen combat interface with health bars, abilities, and action log
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  advanceTurn,
  applyTurnRegen,
  checkCombatEnd
} from '../services/combatService';
import { LootModal } from './LootModal';
import { populatePendingLoot, finalizeLoot } from '../services/lootService';
import { BASE_PATH } from '../services/basePath';
import { getEasterEggName } from './GameFeatures';
import { EquipmentHUD, getDefaultSlotForItem } from './EquipmentHUD';
import ModalWrapper from './ModalWrapper';
import { audioService } from '../services/audioService';
// resolvePotionEffect is intentionally not used here; potion resolution occurs in services

// Play combat sound based on action type
const playCombatSound = (actionType: 'melee' | 'ranged' | 'magic' | 'shout' | 'block' | 'shield_bash' | 'hit' | 'enemy_death') => {
  switch (actionType) {
    case 'melee':
      audioService.playSoundEffect('attack_melee');
      break;
    case 'ranged':
      audioService.playSoundEffect('attack_ranged');
      break;
    case 'magic':
      audioService.playSoundEffect('attack_magic');
      break;
    case 'shout':
      audioService.playSoundEffect('attack_magic'); // Use magic sound for shouts
      break;
    case 'block':
      audioService.playSoundEffect('block');
      break;
    case 'shield_bash':
      audioService.playSoundEffect('shield_bash');
      break;
    case 'hit':
      audioService.playSoundEffect('hit_received');
      break;
    case 'enemy_death':
      audioService.playSoundEffect('enemy_death');
      break;
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

// Health bar component
const HealthBar: React.FC<{
  current: number;
  max: number;
  label: string;
  color: string;
  showNumbers?: boolean;
  isHealing?: boolean;
}> = ({ current, max, label, color, showNumbers = true, isHealing = false }) => {
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
};

// Enemy card component
const EnemyCard: React.FC<{
  enemy: CombatEnemy;
  isTarget: boolean;
  onClick: () => void;
  containerRef?: (el: HTMLDivElement | null) => void;
  isHighlighted?: boolean;
}> = ({ enemy, isTarget, onClick, containerRef, isHighlighted }) => {
  const healthPercent = (enemy.currentHealth / enemy.maxHealth) * 100;
  const isDead = enemy.currentHealth <= 0;
  
  return (
    <div 
      ref={containerRef}
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
      `}
    >
      {/* Boss indicator */}
      {enemy.isBoss && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-purple-600 rounded text-xs font-bold">
          BOSS
        </div>
      )}
      
      {/* Enemy name and type */}
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <h4 className={`font-bold ${isDead ? 'text-stone-500 line-through' : 'text-amber-100'}`}>
            {enemy.name}
          </h4>
          {/* Companion auto-control badge */}
          {enemy.isCompanion && (enemy as any).companionMeta?.autoControl && (
            <span className="text-xs bg-sky-600 text-black px-2 py-0.5 rounded">Auto</span>
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
      
      {/* Status effects */}
      {enemy.activeEffects && enemy.activeEffects.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {enemy.activeEffects.map((ae, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-purple-900/60 rounded text-xs text-purple-300">
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
const ActionButton: React.FC<{
  ability: CombatAbility;
  disabled: boolean;
  cooldown: number;
  canAfford: boolean;
  onClick: () => void;
}> = ({ ability, disabled, cooldown, canAfford, onClick }) => {
  const getTypeIcon = () => {
    switch (ability.type) {
      case 'melee': return '⚔️';
      case 'ranged': return '🏹';
      case 'magic': return '✨';
      case 'shout': return '📢';
      default: return '⚡';
    }
  };
  
  const isDisabled = disabled || cooldown > 0 || !canAfford;
  
  // Build tooltip text: show description (not values since they're already visible)
  const tooltipText = ability.description || `${ability.name} - ${ability.type} ability`;
  
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={tooltipText}
      className={`
        relative p-3 sm:p-3 lg:p-3 py-3 rounded-lg border-2 text-left transition-all w-full text-base sm:text-sm
        ${isDisabled 
          ? 'bg-stone-800/30 border-stone-700 text-stone-500 cursor-not-allowed' 
          : 'bg-gradient-to-br from-amber-900/40 to-stone-900/60 border-amber-700/50 hover:border-amber-500 hover:from-amber-900/60'
        }
      `}
    >
      {/* Cooldown overlay */}
      {cooldown > 0 && (
        <div className="absolute inset-0 bg-stone-900/80 rounded-lg flex items-center justify-center">
          <span className="text-2xl font-bold text-amber-500">{cooldown}</span>
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{getTypeIcon()}</span>
        <span className={`font-bold ${isDisabled ? 'text-stone-500' : 'text-amber-100'}`}>
          {ability.name}
        </span>
      </div>
      
      <div className="flex gap-3 text-sm sm:text-xs">
        {ability.damage > 0 && (
          <span className="text-red-400">⚔ {ability.damage}</span>
        )}
        <span className={`${ability.type === 'magic' ? 'text-blue-400' : 'text-green-400'}`}>
          {ability.type === 'magic' ? '💧' : '⚡'} {ability.cost}
        </span>
      </div>
      
      {!canAfford && !cooldown && (
        <span className="text-xs text-red-400 mt-1 block">Not enough {ability.type === 'magic' ? 'magicka' : 'stamina'}</span>
      )}
      </button>
    );
};

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
  // Pending targeting for abilities which require explicit target selection (heals/buffs)
  const [pendingTargeting, setPendingTargeting] = useState<null | { abilityId: string; abilityName: string; allow: 'allies' | 'enemies' | 'both' }>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  // Track if target change was user-initiated (to avoid toast spam from auto-selection)
  const userInitiatedTargetChange = useRef(false);

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

    const t = setTimeout(() => setRecentlyHighlighted(null), 900);
    return () => clearTimeout(t);
  }, [selectedTarget]);
  const [elapsedSecDisplay, setElapsedSecDisplay] = useState<number>(0);
  const [showRoll, setShowRoll] = useState(false);
  const [rollValue, setRollValue] = useState<number | null>(null);
  const [rollActor, setRollActor] = useState<'player' | 'enemy' | 'ally' | null>(null);
  const [floatingHits, setFloatingHits] = useState<Array<{ id: string; actor: string; damage: number; hitLocation?: string; isCrit?: boolean; x?: number; y?: number }>>([]);
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
  const timeScale = 1 + Math.floor((character?.level || 1) / 20) * 0.25;

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
            }, undefined, builtCombatResult);
          }
        }
        setIsAnimating(false);
      }, 1500);
    }
  }, [combatState.result]);

  // For defeat, call onCombatEnd; for victory we wait until loot is finalized and the player closes the victory screen
  useEffect(() => {
    if (showDefeat) {
      onCombatEnd(
        'defeat',
        combatState.rewards,
        {
          health: playerStats.currentHealth,
          magicka: playerStats.currentMagicka,
          stamina: playerStats.currentStamina
        }
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

  // Trigger loot phase after combat ends - auto-finalize loot and emit result
  useEffect(() => {
    if (combatState.result === 'victory') {
      const populatedState = populatePendingLoot(combatState);

      // Automatically finalize loot (award all pending rewards) to avoid a separate victory screen
      try {
        const { newState, updatedInventory, grantedXp, grantedGold, grantedItems } = finalizeLoot(
          populatedState,
          // null indicates no manual selection; default to granting pending rewards
          null,
          inventory
        );

        setCombatState(newState);
        // Persist updated inventory snapshot
        onInventoryUpdate && onInventoryUpdate(updatedInventory);
        // Show consolidated loot toast: items (if any) and explicit XP/gold gains
        if ((grantedItems && grantedItems.length) || (grantedGold && grantedGold > 0) || (grantedXp && grantedXp > 0)) {
          const parts: string[] = [];
          if (grantedItems && grantedItems.length) parts.push(`Items: ${grantedItems.map(i => i.name).join(', ')}`);
          if (grantedXp && grantedXp > 0) parts.push(`${grantedXp} XP`);
          if (grantedGold && grantedGold > 0) parts.push(`${grantedGold} gold`);
          showToast?.(`Loot collected: ${parts.join(' — ')}`, 'success');
        } else {
          showToast?.('Loot collected: nothing found.', 'info');
        }

        // Build a structured combat result and notify parent immediately
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

        // Attach combatResult to state for observability
        setCombatState(prev => ({ ...prev, combatResult } as any));

        // Propagate final result so App can apply narrative and auto-resume (include full combatResult)
        onCombatEnd && onCombatEnd('victory', newState.rewards, {
          health: playerStats.currentHealth,
          magicka: playerStats.currentMagicka,
          stamina: playerStats.currentStamina
        }, Math.max(0, Math.round((newState.combatElapsedSec || 0) / 60)), combatResult);
      } catch (e) {
        // Fallback: if finalize fails, open the normal loot modal so the player can continue manually
        console.error('Auto-finalize loot failed, falling back to manual loot phase:', e);
        setCombatState(populatedState);
        setLootPhase(true);
      }
    }
  }, [combatState.result]);

  const handleFinalizeLoot = (selectedItems: Array<{ name: string; quantity: number }> | null) => {
    const { newState, updatedInventory, grantedXp, grantedGold, grantedItems } = finalizeLoot(
      combatState,
      selectedItems,
      inventory
    );

    setCombatState(newState);
    // Persist updated inventory snapshot
    onInventoryUpdate && onInventoryUpdate(updatedInventory);
    showToast?.(`Loot collected: ${grantedItems.map(item => item.name).join(', ')}`, 'success');
    setLootPhase(false);

    // Victory is now handled inline (auto-finalized). Parent will be notified via onCombatEnd; no separate victory screen.
  };

  // When entering loot phase, keep combat UI open and show LootModal
  const handleLootConfirm = (selected: Array<{ name: string; quantity: number }>) => {
    // Funnel through the single finalize implementation to keep behavior consistent
    handleFinalizeLoot(selected.length ? selected : null);
  };

  const handleLootCancel = () => {
    // Cancel should simply close the loot modal and leave combat state waiting
    setCombatState(prev => ({ ...prev, lootPending: false }));
  };

  // Process enemy turns
  const processEnemyTurns = useCallback(async () => {
    let currentState = combatState;
    let currentPlayerStats = playerStats;
    
    while (currentState.active && currentState.currentTurnActor !== 'player') {
      setIsAnimating(true);
      
      // Animate actor d20 roll then execute turn with deterministic nat roll
      const actorId = currentState.currentTurnActor;
      const actorIsAlly = !!(currentState.allies || []).find(a => a.id === actorId);
      setRollActor(actorIsAlly ? 'ally' : 'enemy');
      setShowRoll(true);
      let finalEnemyRoll = Math.floor(Math.random() * 20) + 1;
      for (let i = 0; i < 6; i++) {
        setRollValue(Math.floor(Math.random() * 20) + 1);
        // eslint-disable-next-line no-await-in-loop
        await waitMs(Math.floor((60 + i * 30) * timeScale));
      }
      setRollValue(finalEnemyRoll);
      await waitMs(Math.floor(220 * timeScale));
      setShowRoll(false);
      setRollActor(null);

      // If current actor is an ally, either auto-execute their action or pause for player input
      const allyActor = (currentState.allies || []).find(a => a.id === actorId);
      if (allyActor) {
        // If companion is set to auto-control, perform their default attack immediately
        if (allyActor.companionMeta?.autoControl !== false) {
          const res = executeCompanionAction(currentState, allyActor.id, allyActor.abilities[0].id, undefined, finalEnemyRoll, true);
          currentState = res.newState;
          if (res.narrative && onNarrativeUpdate) onNarrativeUpdate(res.narrative);
          // Update UI and play companion animation
          setCombatState(currentState);
          await waitMs(Math.floor(600 * timeScale));

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
          await waitMs(Math.floor(400 * timeScale));
          continue; // proceed to next turn
        }

        // Otherwise, pause processing and let the UI await player input for companion control
        setIsAnimating(false);
        setAwaitingCompanionAction(true);
        setCombatState(currentState);
        setPlayerStats(currentPlayerStats);
        return; // pause the processing loop
      }

      const { newState, newPlayerStats, narrative } = executeEnemyTurn(
        currentState,
        currentState.currentTurnActor,
        currentPlayerStats,
        finalEnemyRoll,
        character
      );
      
      currentState = newState;
      currentPlayerStats = newPlayerStats;
      
      // Update state with animation delay
      await waitMs(Math.floor(1000 * timeScale));
      
      setCombatState(currentState);
      setPlayerStats(currentPlayerStats);
      
      if (onNarrativeUpdate && narrative) {
        onNarrativeUpdate(narrative);
      }

      // Show floating damage for enemy action if present
      const last = newState.combatLog[newState.combatLog.length - 1];
      if (last && last.actor !== 'player' && last.damage && last.damage > 0) {
        const id = `hit_e_${Date.now()}`;
        // Anchor to the player stats panel
        let x: number | undefined;
        let y: number | undefined;
        try {
          const el = playerRef.current;
          if (el) {
            const r = el.getBoundingClientRect();
            x = r.left + r.width / 2;
            y = r.top + r.height / 2;
          }
        } catch (e) {}

          setFloatingHits(h => [{ id, actor: last.actor, damage: last.damage, hitLocation: undefined, isCrit: !!last.isCrit, x, y }, ...h]);
        setTimeout(() => setFloatingHits(h => h.filter(x => x.id !== id)), 1600);

        try {
          if (last.isCrit) {
            new Audio(`${BASE_PATH}/audio/sfx/crit_player.mp3`).play().catch(() => {});
          } else {
            new Audio(`${BASE_PATH}/audio/sfx/hit_player.mp3`).play().catch(() => {});
          }
        } catch (e) {}
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
      
      await waitMs(Math.floor(500 * timeScale));
    }
    
    setIsAnimating(false);
  }, [combatState, playerStats, onNarrativeUpdate]);

  // Trigger enemy turns when it's not player's turn
  useEffect(() => {
    if (combatState.active && combatState.currentTurnActor !== 'player' && !isAnimating) {
      processEnemyTurns();
    }
  }, [combatState.currentTurnActor, combatState.active, isAnimating]);

  // Handle player action
  const handlePlayerAction = async (action: CombatActionType, abilityId?: string, itemId?: string) => {
    // if an ability is being confirmed, ensure selectedTarget is valid; for heal/buff we'll allow undefined (self) or allies.
    if (isAnimating || combatState.currentTurnActor !== 'player') return;

    setIsAnimating(true);

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

    // Animate d20 rolling: show a sequence then finalize to a deterministic nat roll
    const finalRoll = Math.floor(Math.random() * 20) + 1;
    setRollActor('player');
    setShowRoll(true);

    // If we were in a pending targeting flow, clear it after confirming
    if (pendingTargeting && pendingTargeting.abilityId === abilityId) {
      setPendingTargeting(null);
    }    // quick flicker of numbers to simulate roll
    for (let i = 0; i < 8; i++) {
      setRollValue(Math.floor(Math.random() * 20) + 1);
      // shorten time as it progresses
      // eslint-disable-next-line no-await-in-loop
      await waitMs(Math.floor((50 + i * 20) * timeScale));
    }
    // final settle
    setRollValue(finalRoll);
    await waitMs(Math.floor(220 * timeScale));
    setShowRoll(false);
    setRollActor(null);

    const execRes = executePlayerAction(
      combatState,
      playerStats,
      action,
      targetToUse,
      abilityId,
      itemId,
      inventory,
      finalRoll,
      character
    );
    let newState = execRes.newState;
    let newPlayerStats = execRes.newPlayerStats;
    const narrative = execRes.narrative;
    const usedItem = execRes.usedItem;

    // Play combat sound based on action/ability type
    if (action === 'attack' || action === 'power_attack' || action === 'magic' || action === 'shout') {
      const ability = abilityId ? playerStats.abilities.find(a => a.id === abilityId) : undefined;
      const actionType = ability?.type || 'melee';
      if (ability?.name?.toLowerCase().includes('bash')) {
        playCombatSound('shield_bash');
      } else if (ability?.name?.toLowerCase().includes('block')) {
        playCombatSound('block');
      } else {
        playCombatSound(actionType as 'melee' | 'ranged' | 'magic' | 'shout');
      }
    } else if (action === 'defend') {
      playCombatSound('block');
    }

    // Check if any enemies died from this action
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
      setTimeout(() => setIsHealing(false), 1000);
      if (showToast) {
        showToast(`Restored ${newPlayerStats.currentHealth - playerStats.currentHealth} health!`, 'success');
      }
    }
    
    // Update inventory if item was used
    if (usedItem) {
      if (onInventoryUpdate) {
        onInventoryUpdate([{ name: usedItem.name, quantity: 1 }]);
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
    
    if (finalState.active && (action !== 'flee' || !narrative.includes('failed'))) {
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
      setTimeout(() => setFloatingHits(h => h.filter(x => x.id !== id)), 1600);

      // Play hit or crit sound if available
      try {
        if (last.isCrit) {
          new Audio(`${BASE_PATH}/audio/sfx/crit.mp3`).play().catch(() => {});
        } else {
          new Audio(`${BASE_PATH}/audio/sfx/hit.mp3`).play().catch(() => {});
        }
      } catch (e) {}
    }
    
    // In tests this will resolve instantly, but in production we keep the short delay for UX
    waitMs(Math.floor(500 * timeScale)).then(() => setIsAnimating(false));
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
    // Default immediate execution
    handlePlayerAction('attack', ability.id);
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

  // Regen is applied after each turn via applyTurnRegen; time-based tick removed.

  // Mobile action panel collapsed state
  const [mobileActionsExpanded, setMobileActionsExpanded] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--skyrim-dark, #0f0f0f)' }}>
      {/* Combat header - more compact on mobile */}
      <div className="bg-gradient-to-b from-stone-900 to-transparent p-2 sm:p-4 border-b border-amber-900/30">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-amber-100 tracking-wider">⚔️ COMBAT</h2>
            <p className="text-xs sm:text-sm text-stone-400 truncate max-w-[150px] sm:max-w-none">{combatState.location} • T{combatState.turn} • {String(Math.floor(elapsedSecDisplay/60)).padStart(2,'0')}:{String(elapsedSecDisplay%60).padStart(2,'0')}</p>
          </div>
          <div className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-base ${isPlayerTurn ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
            {isPlayerTurn ? '🎯 Your Turn' : '⏳ Enemy Turn'}
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
        {combatState.playerDefending && (
          <div className="mt-1 text-[10px] text-blue-300">🛡️ Defending</div>
        )}
      </div>

      {/* Main combat area - reorganized for mobile */}
      <div className="flex-1 overflow-auto flex flex-col lg:flex-row gap-2 sm:gap-4 p-2 sm:p-4 max-w-7xl mx-auto w-full pb-32 lg:pb-4">
        {/* Desktop: Left side - Player stats (hidden on mobile, shown in compact bar above) */}
        <div className="hidden lg:block w-full lg:w-1/4 space-y-4">
          <div 
            ref={playerRef} 
            className={`rounded-lg p-4 border border-amber-900/30 ${recentlyHighlighted === 'player' ? 'ring-4 ring-amber-300/40 animate-pulse' : ''} ${selectedTarget === 'player' ? 'ring-2 ring-green-400/50' : ''} ${pendingTargeting ? 'cursor-pointer hover:ring-2 hover:ring-green-400/30' : ''}`} 
            style={{ background: 'var(--skyrim-paper, #1a1a1a)' }}
            onClick={() => {
              // Allow clicking on self during targeting mode
              if (pendingTargeting && (pendingTargeting.allow === 'allies' || pendingTargeting.allow === 'both')) {
                userInitiatedTargetChange.current = true;
                setSelectedTarget('player');
              }
            }}
          >
            <h3 className="text-lg font-bold text-amber-100 mb-3">{getEasterEggName(character.name)}</h3>
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
            {combatState.playerDefending && (
              <div className="mt-2 px-2 py-1 bg-blue-900/40 rounded text-xs text-blue-300">
                🛡️ Defending (50% damage reduction)
              </div>
            )}
          </div>
        </div>

        {/* Center - Enemies and combat log */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          {/* Allies (companions) */}
          {combatState.allies && combatState.allies.length > 0 && (
            <div className="bg-stone-900/40 rounded-lg p-3 border border-stone-700 mb-3">
              <h3 className="text-sm font-bold text-stone-400 mb-2">ALLIES</h3>
              <div className="grid grid-cols-2 gap-2">
                {combatState.allies.map(ally => (
                  <div key={ally.id} className="p-1">
                    <EnemyCard
                      enemy={ally}
                      isTarget={selectedTarget === ally.id}
                      isHighlighted={recentlyHighlighted === ally.id}
                      onClick={() => {
                        // If pendingTargeting is active, restrict selection to allies
                        if (pendingTargeting) {
                          if (pendingTargeting.allow === 'allies' || pendingTargeting.allow === 'both') {
                            userInitiatedTargetChange.current = true;
                            setSelectedTarget(ally.id);
                          } else {
                            if (showToast) showToast('This ability cannot target allies.', 'warning');
                          }
                        } else {
                          userInitiatedTargetChange.current = true;
                          setSelectedTarget(ally.id);
                        }
                      }}
                      containerRef={(el) => { enemyRefs.current[ally.id] = el; }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enemies */}
          <div className="bg-stone-900/40 rounded-lg p-4 border border-stone-700">
            <h3 className="text-sm font-bold text-stone-400 mb-3">ENEMIES</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {combatState.enemies.map(enemy => (
                <div key={enemy.id} className="p-1">
                  <EnemyCard
                    enemy={enemy}
                    isTarget={selectedTarget === enemy.id}
                    isHighlighted={recentlyHighlighted === enemy.id}
                    onClick={() => {
                      // If pendingTargeting is active and does NOT allow enemies, reject selection
                      if (pendingTargeting && pendingTargeting.allow === 'allies') {
                        if (showToast) showToast('This ability cannot target enemies.', 'warning');
                      } else {
                        userInitiatedTargetChange.current = true;
                        setSelectedTarget(enemy.id);
                      }
                    }}
                    containerRef={(el) => { enemyRefs.current[enemy.id] = el; }}
                  />
                </div>
              ))}
            </div>
            
            {/* Combat log */}
            <div className="flex items-center justify-between p-3 border-b border-stone-700">
              <h3 className="text-sm font-bold text-stone-400">COMBAT LOG</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoScroll(s => !s)}
                  aria-pressed={autoScroll}
                  title={autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors focus:outline-none ${autoScroll ? 'bg-green-700 text-green-100 border border-green-600' : 'bg-stone-800 text-stone-300 border border-stone-600'}`}>
                  Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto p-3 space-y-2 scroll-smooth">
              {combatState.combatLog.map((entry, i) => {
                const isAlly = !!(combatState.allies && combatState.allies.find(a => a.name === entry.actor));
                return (
                  <div 
                    key={i} 
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
                    {entry.nat !== undefined && (
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

        {/* Right side - Actions (Desktop only, hidden on mobile) */}
        <div className="hidden lg:block w-full lg:w-1/4 space-y-4">
          {/* Abilities */}
          <div className="bg-stone-900/60 rounded-lg p-4 border border-amber-900/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-400">ABILITIES</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setEquipModalOpen(true)} className="px-2 py-1 text-xs rounded bg-blue-800 hover:bg-blue-700">Equipment</button>
              </div>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {awaitingCompanionAction && combatState.allies && combatState.allies.length > 0 ? (
                (() => {
                  const allyActor = combatState.allies.find(a => a.id === combatState.currentTurnActor);
                  if (!allyActor) return null;
                  return (
                    <div>
                      <div className="text-xs text-skyrim-text mb-2">Control {allyActor.name} (Companion)</div>
                      <div className="space-y-2">
                        {allyActor.abilities.map(ab => (
                          <button key={ab.id} disabled={isAnimating} onClick={async () => {
                            setIsAnimating(true);
                            const res = executeCompanionAction(combatState, allyActor.id, ab.id, selectedTarget || undefined);
                            setCombatState(res.newState);
                            if (res.narrative && onNarrativeUpdate) onNarrativeUpdate(res.narrative);
                            // End companion turn and advance
                            setAwaitingCompanionAction(false);
                            setIsAnimating(false);
                            setCombatState(prev => advanceTurn(prev));
                            setTimeout(() => processEnemyTurns(), 200);
                          }} className="w-full px-3 py-2 rounded bg-skyrim-gold text-black">{ab.name}</button>
                        ))}
                        <button onClick={() => {
                          // Skip companion's turn
                          setAwaitingCompanionAction(false);
                          setCombatState(prev => advanceTurn(prev));
                          setTimeout(() => processEnemyTurns(), 200);
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
                      <button onClick={() => {
                        // Apply to self - explicitly set target to 'player'
                        setSelectedTarget('player');
                        const abilityIdToUse = pendingTargeting!.abilityId;
                        setPendingTargeting(null);
                        // Use setTimeout to ensure state is updated before action
                        setTimeout(() => handlePlayerAction('attack', abilityIdToUse), 0);
                      }} disabled={!isPlayerTurn || isAnimating} className="flex-1 px-3 py-2 rounded bg-green-700 text-white">Use on Self</button>
                      <button onClick={() => {
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
                        handlePlayerAction('attack', abilityIdToUse);
                      }} disabled={!isPlayerTurn || isAnimating || !selectedTarget} className="flex-1 px-3 py-2 rounded bg-blue-700 text-white">Confirm Target</button>
                    </div>
                    <button onClick={() => setPendingTargeting(null)} className="w-full px-3 py-2 rounded border border-skyrim-border text-skyrim-text">Cancel</button>
                  </div>
                ) : (
                  playerStats.abilities.map(ability => (
                    <ActionButton
                      key={ability.id}
                      ability={ability}
                      disabled={!isPlayerTurn || isAnimating}
                      cooldown={combatState.abilityCooldowns[ability.id] || 0}
                      canAfford={
                        ability.type === 'magic' 
                          ? playerStats.currentMagicka >= ability.cost
                          : true
                      }
                      onClick={() => handleAbilityClick(ability)}
                    />
                  ))
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
                      disabled={!isPlayerTurn || isAnimating}
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
                      {getUsableItems().map(item => (
                        <button
                          key={item.id}
                          onClick={() => {
                            handlePlayerAction('item', undefined, item.id);
                            setShowItemSelection(false);
                          }}
                          disabled={!isPlayerTurn || isAnimating}
                          className="w-full p-2 rounded bg-green-900/40 border border-green-700/50 text-green-200 hover:bg-green-900/60 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                        >
                          <div className="flex justify-between items-center">
                            <span>{item.name}</span>
                            <span className="text-xs text-stone-400">x{item.quantity}</span>
                          </div>
                          <div className="text-xs text-stone-400 mt-1">
                            {item.type === 'potion' ? (item.subtype === 'stamina' ? '💪 Stamina Potion' : item.subtype === 'magicka' ? '✨ Magicka Potion' : '💊 Health Potion') : 
                             item.type === 'food' ? '🍖 Food' : '🥤 Drink'}
                          </div>
                        </button>
                      ))}
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

          {/* Other actions */}
          <div className="bg-stone-900/60 rounded-lg p-4 border border-stone-700">
            <h3 className="text-sm font-bold text-stone-400 mb-3">ACTIONS</h3>
            <div className="space-y-2">
              <button
                onClick={() => handlePlayerAction('defend')}
                disabled={!isPlayerTurn || isAnimating}
                className="w-full p-2 rounded bg-blue-900/40 border border-blue-700/50 text-blue-200 hover:bg-blue-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🛡️ Defend
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
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Fixed bottom action bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-stone-900/95 border-t border-amber-900/30 safe-area-inset-bottom z-50">
        {/* Action bar toggle */}
        <button 
          onClick={() => setMobileActionsExpanded(!mobileActionsExpanded)}
          className="w-full py-2 flex items-center justify-center gap-2 text-sm text-amber-200 bg-stone-800"
        >
          {mobileActionsExpanded ? '▼ Hide Actions' : '▲ Show Actions'}
        </button>
        
        {mobileActionsExpanded && (
          <div className="p-2 max-h-[40vh] overflow-y-auto">
            {/* Quick abilities grid */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-stone-400">ABILITIES</span>
                <button onClick={() => setEquipModalOpen(true)} className="px-2 py-0.5 text-[10px] rounded bg-blue-800 hover:bg-blue-700">⚔ Equip</button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {awaitingCompanionAction && combatState.allies && combatState.allies.length > 0 ? (
                  (() => {
                    const allyActor = combatState.allies.find(a => a.id === combatState.currentTurnActor);
                    if (!allyActor) return null;
                    return (
                      <>
                        {allyActor.abilities.slice(0, 3).map(ab => (
                          <button 
                            key={ab.id} 
                            disabled={isAnimating} 
                            onClick={async () => {
                              setIsAnimating(true);
                              const res = executeCompanionAction(combatState, allyActor.id, ab.id, selectedTarget || undefined);
                              setCombatState(res.newState);
                              if (res.narrative && onNarrativeUpdate) onNarrativeUpdate(res.narrative);
                              setAwaitingCompanionAction(false);
                              setIsAnimating(false);
                              setCombatState(prev => advanceTurn(prev));
                              setTimeout(() => processEnemyTurns(), 200);
                            }} 
                            className="px-2 py-2 rounded bg-skyrim-gold text-black text-xs font-bold truncate"
                          >
                            {ab.name}
                          </button>
                        ))}
                      </>
                    );
                  })()
                ) : (
                  playerStats.abilities.slice(0, 6).map(ability => (
                    <button
                      key={ability.id}
                      disabled={!isPlayerTurn || isAnimating || (combatState.abilityCooldowns[ability.id] || 0) > 0 || (ability.type === 'magic' && playerStats.currentMagicka < ability.cost)}
                      onClick={() => handlePlayerAction('attack', ability.id)}
                      title={ability.description || `${ability.name} - ${ability.type} ability`}
                      className={`px-2 py-2 rounded text-xs font-bold truncate transition-colors ${
                        !isPlayerTurn || isAnimating || (combatState.abilityCooldowns[ability.id] || 0) > 0 || (ability.type === 'magic' && playerStats.currentMagicka < ability.cost)
                          ? 'bg-stone-700 text-stone-500 opacity-50'
                          : ability.type === 'magic'
                            ? 'bg-blue-700 text-blue-100 hover:bg-blue-600'
                            : 'bg-amber-700 text-amber-100 hover:bg-amber-600'
                      }`}
                    >
                      {ability.name}
                      {(combatState.abilityCooldowns[ability.id] || 0) > 0 && (
                        <span className="text-[10px] ml-1">({combatState.abilityCooldowns[ability.id]})</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
            
            {/* Quick action buttons row */}
            <div className="flex gap-1">
              <button
                onClick={() => handlePlayerAction('defend')}
                disabled={!isPlayerTurn || isAnimating}
                className="flex-1 py-2 rounded bg-blue-900/60 border border-blue-700/50 text-blue-200 text-xs font-bold disabled:opacity-50"
              >
                🛡️ Defend
              </button>
              
              {getUsableItems().length > 0 && (
                <button
                  onClick={() => setShowItemSelection(!showItemSelection)}
                  disabled={!isPlayerTurn || isAnimating}
                  className="flex-1 py-2 rounded bg-green-900/60 border border-green-700/50 text-green-200 text-xs font-bold disabled:opacity-50"
                >
                  🧪 Items ({getUsableItems().length})
                </button>
              )}
              
              {combatState.fleeAllowed && (
                <button
                  onClick={() => handlePlayerAction('flee')}
                  disabled={!isPlayerTurn || isAnimating}
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
                <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto">
                  {getUsableItems().map(item => (
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
                        <span className="truncate">{item.name}</span>
                        <span className="text-stone-400">x{item.quantity}</span>
                      </div>
                    </button>
                  ))}
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

      {/* D20 roll visual (moved upward to header area) */}
      <div className="absolute left-1/2 top-6 sm:top-8 transform -translate-x-1/2 z-60 pointer-events-none" aria-hidden>
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-skyrim-paper/60 border-2 flex items-center justify-center text-lg sm:text-xl ${rollActor === 'enemy' ? 'border-red-500 text-red-300' : rollActor === 'ally' ? 'border-sky-500 text-sky-300' : 'border-amber-500 text-amber-200'}`}>
          {showRoll && rollValue ? (
            <span className={`animate-bounce`}>{rollValue}</span>
          ) : (
            <span className="text-stone-500">&nbsp;</span>
          )}
        </div>
      </div>

      {/* Floating damage / hit indicators */}
      {floatingHits.map((hit) => {
        const base = hit.actor === 'player'
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
              {hit.isCrit ? '💥 ' : ''}-{hit.damage} {hit.hitLocation ? `(${hit.hitLocation})` : ''}
            </div>
          </div>
        );
      })}

      {/* Defeat overlay */}
      {showDefeat && (
        <div className="absolute inset-0 bg-skyrim-dark/90 flex items-center justify-center z-60">
          <div className="bg-gradient-to-b from-red-900/90 to-stone-900/95 rounded-xl p-8 max-w-md text-center border-2 border-red-500 shadow-2xl">
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
        <div className="w-[760px] max-w-full bg-stone-900/95 rounded-lg p-4 border border-stone-700">
          <h3 className="text-lg font-bold text-amber-100 mb-3">Equipment</h3>
          <EquipmentHUD items={localInventory} onUnequip={(it) => unequipItem(it)} onEquipFromSlot={(slot) => setEquipSelectedSlot(slot)} />
          {equipSelectedSlot && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-stone-300 mb-2">Equip to: {equipSelectedSlot}</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(localInventory.filter(it => (it.type === 'weapon' || it.type === 'apparel') && (getDefaultSlotForItem(it) === equipSelectedSlot || it.slot === equipSelectedSlot))).map(item => (
                  <button key={item.id} onClick={() => equipItem(item, equipSelectedSlot)} className="w-full text-left p-3 bg-skyrim-paper/40 border border-skyrim-border rounded hover:border-skyrim-gold transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-amber-200">{item.name}</div>
                        <div className="text-xs text-stone-400">{item.type} {item.damage ? `• ⚔ ${item.damage}` : ''} {item.armor ? `• 🛡 ${item.armor}` : ''}</div>
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

      {/* Loot phase UI - shown when lootPhase state is true */}
      {lootPhase && (
        <div className="absolute inset-0 bg-skyrim-dark/60 flex items-center justify-center z-60 p-4">
          <div className="bg-gradient-to-b from-amber-900/90 to-stone-900/95 rounded-xl p-6 max-w-lg w-full text-center border-2 border-amber-500 shadow-2xl">
            <h2 className="text-2xl font-bold text-amber-100 mb-4">Loot Phase</h2>
            <p className="text-stone-300 mb-4">Select items to collect from the fallen enemies:</p>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
              {combatState.pendingLoot?.map(loot => (
                <div key={loot.enemyId} className="bg-stone-900/60 rounded-lg p-4 border border-stone-700">
                  <h3 className="text-sm font-bold text-stone-400 mb-2">{loot.enemyName}</h3>
                  <div className="space-y-1">
                    {loot.loot.map(item => (
                      <div key={item.name} className="flex justify-between items-center text-left">
                        <span className="text-amber-200">{item.name} x{item.quantity}</span>
                        <button
                          onClick={() => setLootItems(prev => [...prev, { name: item.name, quantity: item.quantity }])}
                          className="px-3 py-1 text-xs rounded bg-green-900/40 border border-green-700/50 text-green-200 hover:bg-green-900/60"
                        >
                          Collect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => handleFinalizeLoot(lootItems)}
              className="w-full px-4 py-2 text-lg rounded bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors"
            >
              Finalize Loot
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CombatModal;
