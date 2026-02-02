import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import ModalWrapper from './ModalWrapper';
import { DungeonDefinition, DungeonState, DungeonNode, CombatEnemy, Character, InventoryItem, Companion } from '../types';
import { getDungeonById } from '../data/dungeonDefinitions';
import { CombatModal } from './CombatModal';
import { initializeCombat } from '../services/combatService';
import { updateMusicForContext } from '../services/audioService';
import { DoomMinigame } from './DoomMinigame';
import { Sword, Shield, Heart, Gift, HelpCircle, Skull, Coffee, ChevronRight, X, Sparkles, Lock, CheckCircle, DoorOpen, Swords, Eye, EyeOff, Gamepad2 } from 'lucide-react';
import { useLocalization } from '../services/localization';

interface DungeonModalProps {
  open: boolean;
  dungeonId: string | null;
  onClose: (result?: { cleared?: boolean; rewards?: any }) => void;
  activeCharacterId: string | null;
  character: Character | null;
  companions?: Companion[];
  inventory: InventoryItem[];
  onApplyRewards: (rewards: { gold?: number; xp?: number; items?: any[]; transactionId?: string }) => void;
  onApplyBuff?: (effect: any) => void;
  onStartCombat?: (combatState: any) => void;
  showToast?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onInventoryUpdate?: (items: InventoryItem[] | Array<{ name: string; quantity: number }>) => void;
  // Hook to apply survival needs changes (hunger/thirst/fatigue) based on dungeon actions like combat
  onNeedsChange?: (delta: Partial<{ hunger: number; thirst: number; fatigue: number }>) => void;
}

// Node type icons and colors - enhanced with emoji for fog-of-war display
const NODE_STYLES: Record<string, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string; emoji: string }> = {
  start: { icon: <ChevronRight size={16} />, color: 'text-green-400', bgColor: 'bg-green-900/40', borderColor: 'border-green-500', emoji: '🚪' },
  combat: { icon: <Sword size={16} />, color: 'text-red-400', bgColor: 'bg-red-900/40', borderColor: 'border-red-500', emoji: '⚔️' },
  elite: { icon: <Shield size={16} />, color: 'text-orange-400', bgColor: 'bg-orange-900/40', borderColor: 'border-orange-500', emoji: '🛡️' },
  boss: { icon: <Skull size={16} />, color: 'text-purple-400', bgColor: 'bg-purple-900/50', borderColor: 'border-purple-500', emoji: '💀' },
  rest: { icon: <Coffee size={16} />, color: 'text-cyan-400', bgColor: 'bg-cyan-900/40', borderColor: 'border-cyan-500', emoji: '🏕️' },
  reward: { icon: <Gift size={16} />, color: 'text-yellow-400', bgColor: 'bg-yellow-900/40', borderColor: 'border-yellow-500', emoji: '💰' },
  event: { icon: <HelpCircle size={16} />, color: 'text-pink-400', bgColor: 'bg-pink-900/40', borderColor: 'border-pink-500', emoji: '❓' },
  empty: { icon: <Sparkles size={16} />, color: 'text-gray-400', bgColor: 'bg-gray-800/40', borderColor: 'border-gray-600', emoji: '🌫️' },
};

// Generate a Slay the Spire style map from dungeon nodes
interface MapNode {
  id: string;
  row: number;
  col: number;
  type: string;
  connections: string[];
  original: DungeonNode;
  revealed: boolean; // For fog-of-war: whether this node's type is visible
}

function generateSlayTheSpireMap(dungeon: DungeonDefinition, completedNodes: string[], currentNodeId: string): { nodes: MapNode[]; rows: number; cols: number } {
  const originalNodes = dungeon.nodes || [];
  const nodeMap = new Map<string, DungeonNode>();
  originalNodes.forEach(n => n && n.id && nodeMap.set(n.id, n));

  // Defensive: ensure we have a valid start node
  const startNode = originalNodes.find(n => n && n.id === dungeon.startNodeId) || originalNodes[0];
  if (!startNode) return { nodes: [], rows: 0, cols: 0 };

  // BFS to assign rows based on distance from start
  const visited = new Set<string>();
  const rowAssignment = new Map<string, number>();
  const queue: { id: string; row: number }[] = [{ id: startNode.id, row: 0 }];

  while (queue.length > 0) {
    const { id, row } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    rowAssignment.set(id, row);

    const node = nodeMap.get(id);
    if (node && Array.isArray(node.connections)) {
      for (const connId of node.connections) {
        // Skip references to nodes that don't exist (data hygiene)
        if (!nodeMap.has(connId)) {
          // Helpful debug in dev but avoid noisy logs in production
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(`[DungeonMap] Node '${id}' references missing connection '${connId}' in dungeon '${dungeon.name || dungeon.id}'`);
          }
          continue;
        }
        if (!visited.has(connId)) {
          queue.push({ id: connId, row: row + 1 });
        }
      }
    }
  }

  // Group nodes by row
  const rowGroups = new Map<number, string[]>();
  rowAssignment.forEach((row, id) => {
    if (!rowGroups.has(row)) rowGroups.set(row, []);
    rowGroups.get(row)!.push(id);
  });

  if (rowGroups.size === 0) {
    // Fallback to single-row layout containing the start node
    rowGroups.set(0, [startNode.id]);
  }

  const rows = Math.max(...Array.from(rowGroups.keys())) + 1;
  const maxCols = Math.max(1, ...Array.from(rowGroups.values()).map(g => g.length));

  // Determine which nodes are revealed (fog-of-war logic):
  // - Current node and completed nodes are always revealed
  // - Nodes directly connected to the current node are revealed (player's next options)
  // - All other nodes are hidden (show as "?")
  const revealedSet = new Set<string>();
  completedNodes.forEach(id => revealedSet.add(id));
  revealedSet.add(currentNodeId);

  // Reveal immediate connections from current node
  const currentNode = nodeMap.get(currentNodeId);
  if (currentNode && Array.isArray(currentNode.connections)) {
    currentNode.connections.forEach(id => { if (nodeMap.has(id)) revealedSet.add(id); });
  }

  // Create map nodes with column positions and reveal state
  const mapNodes: MapNode[] = [];
  rowGroups.forEach((nodeIds, row) => {
    const colSpacing = maxCols / (nodeIds.length + 1);
    nodeIds.forEach((id, idx) => {
      const original = nodeMap.get(id);
      if (!original) return; // skip unknown ids (already warned above)

      mapNodes.push({
        id,
        row,
        col: Math.floor((idx + 1) * colSpacing),
        type: original.type,
        connections: original.connections || [],
        original,
        revealed: revealedSet.has(id),
      });
    });
  });

  return { nodes: mapNodes, rows, cols: maxCols };
}

export const DungeonModal: React.FC<DungeonModalProps> = ({
  open, dungeonId, onClose, activeCharacterId, character, companions, inventory,
  onApplyRewards, onApplyBuff, onStartCombat, showToast, onInventoryUpdate, onNeedsChange
}) => {
  const { t } = useLocalization();
  const dungeon = useMemo(() => (dungeonId ? getDungeonById(dungeonId) : null), [dungeonId]);
  const [state, setState] = useState<DungeonState | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [combatState, setCombatState] = useState<any | null>(null);
  const [showBossConfirm, setShowBossConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [eventChoice, setEventChoice] = useState<DungeonNode | null>(null);
  const [showFloorComplete, setShowFloorComplete] = useState(false);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [floorScalingFactor, setFloorScalingFactor] = useState(1);

  // Doom-style minigame mode
  const [doomModeOpen, setDoomModeOpen] = useState(false);

  // Refs for node positions (to draw connections accurately)
  const nodeRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Generate the Slay the Spire style map with fog-of-war
  const mapData = useMemo(() => {
    if (!dungeon || !state) return null;
    return generateSlayTheSpireMap(dungeon, state.completedNodes, state.currentNodeId);
  }, [dungeon, state?.completedNodes, state?.currentNodeId]);

  useEffect(() => {
    if (!open || !dungeon) return;

    // Check minimum level requirement
    const playerLevel = character?.level || 1;
    if (dungeon.minimumLevel && playerLevel < dungeon.minimumLevel) {
      showToast?.(t('dungeon.warnings.minLevel', { level: dungeon.minimumLevel }), 'error');
      onClose();
      return;
    }

    // Warn about recommended level (but don't block)
    if (playerLevel < dungeon.recommendedLevel) {
      showToast?.(t('dungeon.warnings.recLevel', { level: dungeon.recommendedLevel }), 'warning');
    }

    const startNode = dungeon.nodes.find(n => n.id === dungeon.startNodeId) || dungeon.nodes[0];
    // Use character's actual current vitals, or max stats if no current vitals
    const maxHealth = character?.stats?.health || 100;
    const maxMagicka = character?.stats?.magicka || 100;
    const maxStamina = character?.stats?.stamina || 100;
    const playerVitals = {
      currentHealth: character?.currentVitals?.currentHealth ?? maxHealth,
      currentMagicka: character?.currentVitals?.currentMagicka ?? maxMagicka,
      currentStamina: character?.currentVitals?.currentStamina ?? maxStamina,
      maxHealth,
      maxMagicka,
      maxStamina
    };
    const st: DungeonState = {
      active: true,
      dungeonId: dungeon.id,
      currentNodeId: startNode.id,
      visitedNodes: [startNode.id],
      completedNodes: [startNode.id], // Mark start as completed to reveal next nodes
      playerVitals,
      companionVitals: {},
      collectedRewards: { gold: 0, xp: 0, items: [] },
      activeBuffs: [],
      startTime: Date.now(),
      result: 'in_progress'
    };
    setState(st);
    setSelectedNodeId(null);
    setCombatState(null);
    setEventChoice(null);
    setCurrentFloor(1);
    setFloorScalingFactor(1);
    // Reset node refs
    nodeRefs.current.clear();
    setNodePositions(new Map());
  }, [open, dungeon]);

  // Calculate node positions after render for accurate connection lines
  useEffect(() => {
    if (!mapData || !mapContainerRef.current) return;

    const updatePositions = () => {
      const container = mapContainerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newPositions = new Map<string, { x: number; y: number }>();

      nodeRefs.current.forEach((el, nodeId) => {
        if (el) {
          const rect = el.getBoundingClientRect();
          // Calculate center of node relative to container
          newPositions.set(nodeId, {
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top + rect.height / 2,
          });
        }
      });

      setNodePositions(newPositions);
    };

    // Wait for layout to complete
    const timer = setTimeout(updatePositions, 100);
    // Also update on resize
    window.addEventListener('resize', updatePositions);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePositions);
    };
  }, [mapData, state?.currentNodeId, state?.completedNodes]);

  const getNodeById = useCallback((id?: string) => dungeon?.nodes.find(n => n.id === id) as DungeonNode | undefined, [dungeon]);

  // Check if a node is accessible (connected to current node AND current node is completed, OR is current node)
  const isNodeAccessible = useCallback((nodeId: string) => {
    if (!state) return false;
    if (state.currentNodeId === nodeId) return true;
    const currentNode = getNodeById(state.currentNodeId);
    // Node is accessible if current node is completed and this node is connected to current
    const currentCompleted = state.completedNodes.includes(state.currentNodeId);
    return currentCompleted && (currentNode?.connections.includes(nodeId) || false);
  }, [state, getNodeById]);

  // Move to a node (select it for action)
  const handleSelectNode = (nodeId: string) => {
    if (!isNodeAccessible(nodeId)) return;
    setSelectedNodeId(nodeId);
  };

  // Advance to the next node after completing current
  const advanceToNode = (nodeId: string) => {
    setState(prev => prev ? {
      ...prev,
      currentNodeId: nodeId,
      visitedNodes: Array.from(new Set([...prev.visitedNodes, nodeId])),
    } : prev);
    setSelectedNodeId(nodeId);
  };

  // Complete current node and optionally advance
  const completeCurrentNode = () => {
    if (!state) return;
    setState(prev => prev ? {
      ...prev,
      completedNodes: Array.from(new Set([...prev.completedNodes, prev.currentNodeId])),
    } : prev);
  };

  // Execute node action
  const executeNodeAction = (node: DungeonNode) => {
    if (!state || !dungeon) return;

    // Mark as visited
    setState(prev => prev ? {
      ...prev,
      visitedNodes: Array.from(new Set([...prev.visitedNodes, node.id]))
    } : prev);

    switch (node.type) {
      case 'combat':
      case 'elite':
      case 'boss':
        // Scale enemies based on how many times this dungeon has been cleared
        const clearData = character?.clearedDungeons?.find(d => d.dungeonId === dungeonId);
        const clearCount = clearData?.clearCount || 0;
        const baseScaleFactor = 1 + (clearCount * 0.25); // 25% stronger per clear
        const totalScaleFactor = baseScaleFactor * floorScalingFactor; // Also scale by current floor

        const enemies = (node.enemies || []).map(e => {
          const scaled: CombatEnemy = {
            ...e,
            maxHealth: Math.floor(e.maxHealth * totalScaleFactor),
            currentHealth: Math.floor(e.maxHealth * totalScaleFactor),
            damage: Math.floor(e.damage * totalScaleFactor),
            armor: Math.floor((e.armor || 0) * totalScaleFactor),
            xpReward: Math.floor((e.xpReward || 0) * totalScaleFactor),
            goldReward: e.goldReward ? Math.floor(e.goldReward * totalScaleFactor) : undefined,
          };
          return scaled;
        });
        // Include player's companions (if any) so allies appear in dungeon combats
        const companionsForCombat = (companions || []).filter(c => c.characterId === (character?.id || activeCharacterId));
        // Pass player level to enable enemy scaling (SKY-51: more enemies based on level)
        const playerLevel = character?.level || 1;
        const initializedCombat = initializeCombat(enemies, dungeon.location, false, true, false, companionsForCombat, playerLevel);
        setCombatState(initializedCombat);

        // Switch to combat music
        updateMusicForContext({ inCombat: true, localeType: 'dungeon', mood: 'tense' });
        break;

      case 'rest':
        // Apply rest healing - cap at character's max stats
        setState(prev => {
          if (!prev) return prev;
          const healH = node.restAmount?.health ?? 30;
          const healM = node.restAmount?.magicka ?? 30;
          const healS = node.restAmount?.stamina ?? 30;
          // Use stored max values or character stats
          const maxH = prev.playerVitals.maxHealth || character?.stats?.health || 100;
          const maxM = prev.playerVitals.maxMagicka || character?.stats?.magicka || 100;
          const maxS = prev.playerVitals.maxStamina || character?.stats?.stamina || 100;
          const newVitals = {
            ...prev.playerVitals,
            currentHealth: Math.min(prev.playerVitals.currentHealth + healH, maxH),
            currentMagicka: Math.min(prev.playerVitals.currentMagicka + healM, maxM),
            currentStamina: Math.min(prev.playerVitals.currentStamina + healS, maxS),
          };
          return {
            ...prev,
            playerVitals: newVitals,
            completedNodes: Array.from(new Set([...prev.completedNodes, node.id]))
          };
        });
        // Auto-advance to next if only one connection
        if (node.connections.length === 1) {
          setTimeout(() => advanceToNode(node.connections[0]), 500);
        }
        break;

      case 'reward':
        if (node.rewards) {
          // Accumulate rewards instead of applying immediately
          setState(prev => prev ? {
            ...prev,
            collectedRewards: {
              ...prev.collectedRewards,
              gold: prev.collectedRewards.gold + (node.rewards?.gold || 0),
              xp: prev.collectedRewards.xp + (node.rewards?.xp || 0),
              items: [...prev.collectedRewards.items, ...(node.rewards?.items || [])]
            },
            completedNodes: Array.from(new Set([...prev.completedNodes, node.id]))
          } : prev);
        }
        if (node.rewards?.buff && onApplyBuff) {
          const b = node.rewards.buff;
          const eff = {
            id: `dungeon_buff_${b.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
            name: b.name,
            type: 'buff',
            icon: '✨',
            duration: b.duration || 60,
            description: `${b.name} (+${b.value} ${b.stat}) for ${b.duration || 60}s`,
            effects: [{ stat: b.stat, modifier: b.value }]
          } as any;
          onApplyBuff(eff);
        }
        // Auto-advance
        if (node.connections.length === 1) {
          setTimeout(() => advanceToNode(node.connections[0]), 500);
        }
        break;

      case 'event':
        // Show event choices UI
        setEventChoice(node);
        break;

      case 'empty':
      case 'start':
      default:
        completeCurrentNode();
        if (node.connections.length === 1) {
          setTimeout(() => advanceToNode(node.connections[0]), 300);
        }
        break;
    }
  };

  // Handle event choice
  const handleEventChoice = (choice: { label: string; outcome: string; value?: number }) => {
    if (!eventChoice || !state) return;

    if (choice.outcome === 'reward') {
      // Accumulate rewards instead of applying immediately
      setState(prev => prev ? {
        ...prev,
        collectedRewards: { ...prev.collectedRewards, gold: prev.collectedRewards.gold + (choice.value || 0) },
        completedNodes: Array.from(new Set([...prev.completedNodes, eventChoice.id]))
      } : prev);
    } else if (choice.outcome === 'damage') {
      setState(prev => prev ? {
        ...prev,
        playerVitals: { ...prev.playerVitals, currentHealth: Math.max(0, prev.playerVitals.currentHealth - (choice.value || 0)) },
        completedNodes: Array.from(new Set([...prev.completedNodes, eventChoice.id]))
      } : prev);
    } else {
      setState(prev => prev ? {
        ...prev,
        completedNodes: Array.from(new Set([...prev.completedNodes, eventChoice.id]))
      } : prev);
    }

    // Auto-advance
    if (eventChoice.connections.length === 1) {
      setTimeout(() => advanceToNode(eventChoice.connections[0]), 500);
    }
    setEventChoice(null);
  };

  // Handle combat end - IMPORTANT: We accumulate rewards here but DO NOT apply them yet.
  // CombatModal has already added items to inventory via onInventoryUpdate, but gold/XP 
  // are only accumulated. The actual onApplyRewards call happens when player leaves dungeon.
  const handleCombatEnd = (result: 'victory' | 'defeat' | 'fled' | 'surrendered', rewards?: any, finalVitals?: any, timeAdvanceMinutes?: number) => {
    if (!state || !dungeon) return;

    // Compute a small needs delta for any dungeon combat end. Scale slightly with time if provided.
    try {
      const baseDelta = { hunger: 3, thirst: 5, fatigue: 6 } as { hunger: number; thirst: number; fatigue: number };
      const timeFactor = timeAdvanceMinutes ? Math.max(1, Math.round((timeAdvanceMinutes || 0) / 5)) : 1;
      const delta = { hunger: baseDelta.hunger * timeFactor, thirst: baseDelta.thirst * timeFactor, fatigue: baseDelta.fatigue * timeFactor };
      // Call out to parent/app to apply needs changes (if provided)
      onNeedsChange && onNeedsChange(delta);
    } catch (e) {
      // best-effort - don't block combat end on failure
      console.warn('Failed to apply dungeon combat needs delta', e);
    }

    if (result === 'victory') {
      // Update player vitals from combat (CRITICAL for health persistence)
      if (finalVitals) {
        setState(prev => prev ? {
          ...prev,
          playerVitals: {
            ...prev.playerVitals,
            currentHealth: finalVitals.health ?? prev.playerVitals.currentHealth,
            currentMagicka: finalVitals.magicka ?? prev.playerVitals.currentMagicka,
            currentStamina: finalVitals.stamina ?? prev.playerVitals.currentStamina,
          }
        } : prev);
      }

      if (rewards) {
        // Accumulate gold/XP only - items are already in inventory from CombatModal
        setState(prev => prev ? {
          ...prev,
          collectedRewards: {
            gold: prev.collectedRewards.gold + (rewards.gold || 0),
            xp: prev.collectedRewards.xp + (rewards.xp || 0),
            // Track items for display purposes only (they're already in inventory)
            items: [...prev.collectedRewards.items, ...(rewards.items || [])]
          }
        } : prev);
        showToast?.(t('messages.goldGained', { amount: rewards.gold || 0 }), 'info');
      }

      completeCurrentNode();

      const currentNode = dungeon.nodes.find(n => n.id === state.currentNodeId);
      if (currentNode?.type === 'boss') {
        // Boss defeated! Show floor complete modal to allow continuing deeper or leaving
        setShowFloorComplete(true);
        setCombatState(null);
        return;
      }
    }

    if (result === 'defeat') {
      setState(prev => prev ? { ...prev, result: 'defeated', active: false } : prev);
      showToast?.(t('combat.defeat'), 'error');
      onClose({ cleared: false });
    }

    if (result === 'fled') {
      // Fled from combat - apply damage to vitals as penalty
      if (finalVitals) {
        setState(prev => prev ? {
          ...prev,
          playerVitals: {
            ...prev.playerVitals,
            currentHealth: finalVitals.health ?? prev.playerVitals.currentHealth,
            currentMagicka: finalVitals.magicka ?? prev.playerVitals.currentMagicka,
            currentStamina: finalVitals.stamina ?? prev.playerVitals.currentStamina,
          }
        } : prev);
      }
      showToast?.(t('combat.flee'), 'warning');
    }

    setCombatState(null);
  };

  // Render a single node on the map with fog-of-war support
  const renderMapNode = (mapNode: MapNode) => {
    if (!state) return null;
    const node = mapNode.original;
    const style = NODE_STYLES[node.type] || NODE_STYLES.empty;
    const isCurrent = state.currentNodeId === mapNode.id;
    const isCompleted = state.completedNodes.includes(mapNode.id);
    const isVisited = state.visitedNodes.includes(mapNode.id);
    const isAccessible = isNodeAccessible(mapNode.id);
    const isSelected = selectedNodeId === mapNode.id;
    const isRevealed = mapNode.revealed;
    const label = t(`dungeon.nodes.${node.type}`) || node.type;

    // Hidden node (not revealed yet) - show as mysterious "?"
    if (!isRevealed && !isCompleted) {
      return (
        <div
          key={mapNode.id}
          ref={(el) => { nodeRefs.current.set(mapNode.id, el); }}
          className="relative z-10"
        >
          <div className="w-12 h-12 rounded-full bg-stone-800/60 border-2 border-stone-600/50 flex items-center justify-center text-stone-500 text-xl font-bold">
            ?
          </div>
        </div>
      );
    }

    return (
      <div
        key={mapNode.id}
        ref={(el) => { nodeRefs.current.set(mapNode.id, el); }}
        className="relative z-10 flex flex-col items-center"
      >
        <button
          onClick={() => isAccessible && !isCompleted && handleSelectNode(mapNode.id)}
          disabled={!isAccessible || isCompleted}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border-2
            ${style.bgColor} ${style.borderColor}
            ${isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-stone-900 scale-110 animate-pulse' : ''}
            ${isCompleted ? 'opacity-40 grayscale' : ''}
            ${isSelected ? 'ring-2 ring-yellow-400 scale-110' : ''}
            ${isAccessible && !isCompleted && !isCurrent ? 'hover:scale-110 hover:brightness-125 cursor-pointer' : ''}
            ${!isAccessible && !isCurrent ? 'opacity-30 cursor-not-allowed' : ''}
          `}
          title={isRevealed ? `${node.name} (${label})` : 'Unknown'}
        >
          {isCompleted ? (
            <>
              <CheckCircle size={18} className="text-green-400" />
              <span className="sr-only">{node.name || label}</span>
            </>
          ) : (
            <>
              <span className="text-lg">{style.emoji}</span>
              <span className="sr-only">{node.name || label}</span>
            </>
          )}
        </button>
        {/* Show node name below for current/selected/accessible nodes */}
        {isRevealed && (isCurrent || isSelected || isAccessible) && (
          <span className={`text-[10px] mt-1 text-center max-w-[60px] truncate ${style.color}`}>
            {node.name || label}
          </span>
        )}
      </div>
    );
  };

  // Render connections between nodes using actual DOM positions
  const renderConnections = () => {
    if (!mapData || !state || nodePositions.size === 0) return null;

    const connections: React.ReactNode[] = [];
    const rendered = new Set<string>(); // Avoid duplicate lines

    mapData.nodes.forEach(node => {
      const fromPos = nodePositions.get(node.id);
      if (!fromPos) return;

      node.connections.forEach(toId => {
        // Create a consistent key to avoid duplicate lines (A->B and B->A)
        const lineKey = [node.id, toId].sort().join('-');
        if (rendered.has(lineKey)) return;
        rendered.add(lineKey);

        const toPos = nodePositions.get(toId);
        if (!toPos) return;

        // Check if both endpoints are revealed (fog-of-war for connections)
        const fromNode = mapData.nodes.find(n => n.id === node.id);
        const toNode = mapData.nodes.find(n => n.id === toId);
        const fromRevealed = fromNode?.revealed || state.completedNodes.includes(node.id);
        const toRevealed = toNode?.revealed || state.completedNodes.includes(toId);

        // Only draw connection if at least one endpoint is revealed
        if (!fromRevealed && !toRevealed) return;

        const isFromActive = state.currentNodeId === node.id || state.completedNodes.includes(node.id);
        const isToActive = state.currentNodeId === toId || state.completedNodes.includes(toId);
        const isActive = isFromActive || isToActive;
        const isFullyActive = isFromActive && isToActive;

        // Dimmer line if connecting to unrevealed node
        const opacity = (!fromRevealed || !toRevealed) ? 0.3 : 1;

        connections.push(
          <line
            key={`${node.id}-${toId}`}
            x1={fromPos.x}
            y1={fromPos.y}
            x2={toPos.x}
            y2={toPos.y}
            stroke={isFullyActive ? '#d4a44a' : isActive ? '#8b7635' : '#444'}
            strokeWidth={isActive ? 3 : 2}
            strokeDasharray={isFullyActive ? '0' : '8,4'}
            opacity={opacity}
            className="transition-all duration-300"
          />
        );
      });
    });

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {connections}
      </svg>
    );
  };

  if (!open || !dungeon || !state || !mapData) return null;

  const currentNode = getNodeById(state.currentNodeId);
  const selectedNode = selectedNodeId ? getNodeById(selectedNodeId) : null;

  return (
    <ModalWrapper open={open} onClose={() => setShowExitConfirm(true)} preventOutsideClose>
      <div className="w-[95vw] max-w-5xl h-[85vh] flex flex-col bg-zinc-950 text-zinc-200 font-sans rounded-lg overflow-hidden border border-zinc-800 shadow-2xl relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.8),rgba(0,0,0,0.4))] pointer-events-none z-0" />
        {/* Header */}
        <div className="flex items-center justify-between p-4 glass-panel border-x-0 border-t-0 border-b border-zinc-800 z-10 shrink-0 relative">
          <div>
            <h2 className="text-2xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-sm">{dungeon.name}</h2>
            <p className="text-xs text-skyrim-text/70 mt-1">{dungeon.ambientDescription}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded ${dungeon.difficulty === 'easy' ? 'bg-green-900/50 text-green-300' :
                dungeon.difficulty === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                  dungeon.difficulty === 'hard' ? 'bg-orange-900/50 text-orange-300' :
                    'bg-red-900/50 text-red-300'
                }`}>
                {dungeon.difficulty.toUpperCase()}
              </span>
              <span className="text-xs text-skyrim-text/70">
                Recommended: Lv.{dungeon.recommendedLevel}
                {dungeon.minimumLevel && <span className="text-red-400"> (Min: Lv.{dungeon.minimumLevel})</span>}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {currentFloor > 1 && (
              <div className="text-sm px-2 py-1 rounded bg-purple-600/30 text-purple-300 border border-purple-600/50">
                {t('dungeon.stats.floor')} {currentFloor} • {Math.round(floorScalingFactor * 100)}%
              </div>
            )}
            <div className="text-sm text-skyrim-gold">{t('dungeon.stats.gold')}: {state.collectedRewards.gold}</div>
            <div className="text-sm text-blue-300">{t('dungeon.stats.xp')}: {state.collectedRewards.xp}</div>
            <button
              onClick={() => setDoomModeOpen(true)}
              className="px-3 py-1.5 bg-amber-600/30 text-amber-300 rounded hover:bg-amber-600/50 flex items-center gap-1 border border-amber-600/50 transition-all hover:scale-105"
              title="Enter Doom Mode - First-person dungeon crawler!"
            >
              <Gamepad2 size={14} /> {t('dungeon.actions.doom')}
            </button>
            <button
              onClick={() => setShowExitConfirm(true)}
              className="px-3 py-1.5 bg-red-600/20 text-red-300 rounded hover:bg-red-600/30 flex items-center gap-1"
            >
              <X size={14} /> {t('dungeon.actions.exit')}
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Map Area */}
          <div className="flex-1 relative p-4 overflow-auto" ref={mapContainerRef}>
            {/* Connection lines */}
            {renderConnections()}

            {/* Nodes Grid */}
            <div
              className="relative min-h-full"
              style={{
                display: 'grid',
                gridTemplateRows: `repeat(${mapData.rows}, 80px)`,
                gridTemplateColumns: `repeat(${mapData.cols + 1}, 1fr)`,
                gap: '8px',
                padding: '20px',
              }}
            >
              {mapData.nodes.map(node => (
                <div
                  key={node.id}
                  style={{
                    gridRow: node.row + 1,
                    gridColumn: node.col + 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {renderMapNode(node)}
                </div>
              ))}
            </div>
          </div>

          {/* Side Panel */}
          <div className="w-80 glass-panel border-y-0 border-r-0 border-l border-zinc-800 p-4 flex flex-col z-10 relative">
            {/* Current Node Info */}
            <div className="mb-4 p-3 rounded glass-panel-lighter border border-zinc-700/50">
              <div className="text-xs text-skyrim-text/70 mb-1">{t('dungeon.currentLocation')}</div>
              <div className="font-semibold text-skyrim-gold flex items-center gap-2">
                {NODE_STYLES[currentNode?.type || 'empty'].icon}
                {currentNode?.name || 'Unknown'}
              </div>
              {currentNode?.description && (
                <p className="text-xs text-skyrim-text mt-1">{currentNode.description}</p>
              )}
            </div>

            {/* Selected Node / Action Panel */}
            <div className="flex-1 overflow-y-auto">
              {selectedNode && selectedNode.id !== state.currentNodeId ? (
                <div className="p-3 rounded glass-panel-lighter border border-amber-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-amber-400 flex items-center gap-2">
                      {NODE_STYLES[selectedNode.type].icon}
                      {selectedNode.name}
                    </span>
                    {selectedNode.type === 'boss' && (
                      <span className="text-xs px-2 py-0.5 bg-purple-600/30 text-purple-300 rounded">BOSS</span>
                    )}
                  </div>
                  {selectedNode.description && (
                    <p className="text-xs text-skyrim-text mb-3">{selectedNode.description}</p>
                  )}
                  <button
                    onClick={() => {
                      advanceToNode(selectedNode.id);
                      executeNodeAction(selectedNode);
                    }}
                    className="w-full px-3 py-2 bg-skyrim-gold text-black rounded font-medium hover:bg-amber-400"
                  >
                    {selectedNode.type === 'combat' ? t('dungeon.actions.fight') :
                      selectedNode.type === 'elite' ? t('dungeon.actions.challengeElite') :
                        selectedNode.type === 'boss' ? t('dungeon.actions.engageBoss') :
                          selectedNode.type === 'rest' ? t('dungeon.actions.rest') :
                            selectedNode.type === 'reward' ? t('dungeon.actions.loot') :
                              selectedNode.type === 'event' ? t('dungeon.actions.investigate') :
                                t('dungeon.actions.proceed')}
                  </button>
                </div>
              ) : currentNode && !state.completedNodes.includes(currentNode.id) && currentNode.type !== 'start' ? (
                <div className="p-3 rounded bg-skyrim-paper/10 border border-green-800/30">
                  <div className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                    {NODE_STYLES[currentNode.type].icon}
                    {currentNode.name}
                  </div>
                  {currentNode.description && (
                    <p className="text-xs text-skyrim-text mb-3">{currentNode.description}</p>
                  )}
                  <button
                    onClick={() => executeNodeAction(currentNode)}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-500"
                  >
                    {currentNode.type === 'combat' ? 'Fight!' :
                      currentNode.type === 'elite' ? 'Challenge Elite!' :
                        currentNode.type === 'boss' ? 'Engage Boss!' :
                          currentNode.type === 'rest' ? 'Rest' :
                            currentNode.type === 'reward' ? 'Open Treasure' :
                              currentNode.type === 'event' ? 'Investigate' :
                                'Continue'}
                  </button>
                </div>
              ) : (
                <div className="text-center text-skyrim-text/50 py-8">
                  <p className="text-sm">Select a connected node to proceed</p>
                  {currentNode?.connections && currentNode.connections.length > 1 && (
                    <p className="text-xs mt-2 text-amber-400">Choose your path wisely!</p>
                  )}
                </div>
              )}
            </div>

            {/* Party Status */}
            <div className="mt-4 p-3 rounded bg-skyrim-paper/10 border border-skyrim-border">
              <div className="text-xs text-skyrim-text/70 mb-2">Party Status</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-red-400 flex items-center gap-1"><Heart size={12} /> Health</span>
                  <span>{state.playerVitals.currentHealth}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-400 flex items-center gap-1"><Sparkles size={12} /> Magicka</span>
                  <span>{state.playerVitals.currentMagicka}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-400 flex items-center gap-1"><Shield size={12} /> Stamina</span>
                  <span>{state.playerVitals.currentStamina}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Combat Modal - Pass dungeon vitals to ensure health persistence */}
      {combatState && character && (
        <CombatModal
          character={{
            ...character,
            // Override character vitals with dungeon-persistent vitals
            currentVitals: {
              currentHealth: state.playerVitals.currentHealth,
              currentMagicka: state.playerVitals.currentMagicka,
              currentStamina: state.playerVitals.currentStamina
            }
          }}
          inventory={inventory}
          initialCombatState={combatState}
          onCombatEnd={(result, rewards, finalVitals) => handleCombatEnd(result as any, rewards, finalVitals)}
          showToast={showToast}
          onInventoryUpdate={onInventoryUpdate}
        />
      )}

      {/* Event Choice Modal */}
      {eventChoice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
          <div className="bg-skyrim-paper p-6 rounded-lg border border-skyrim-border max-w-md">
            <h4 className="font-semibold text-lg text-skyrim-gold mb-2">{eventChoice.name}</h4>
            <p className="text-sm text-skyrim-text mb-4">{eventChoice.eventText || eventChoice.description}</p>
            <div className="space-y-2">
              {(eventChoice.eventChoices || []).map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEventChoice(choice)}
                  className={`w-full px-4 py-2 rounded text-left ${choice.outcome === 'damage'
                    ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30'
                    : 'bg-skyrim-gold/20 text-skyrim-gold hover:bg-skyrim-gold/30'
                    }`}
                >
                  {choice.label}
                  {choice.outcome === 'reward' && choice.value && (
                    <span className="text-xs ml-2 text-green-400">(+{choice.value} gold)</span>
                  )}
                  {choice.outcome === 'damage' && choice.value && (
                    <span className="text-xs ml-2 text-red-400">(-{choice.value} HP)</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation - Shows accumulated rewards and offers to leave with partial rewards */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
          <div className="bg-stone-900 p-5 rounded-lg border border-stone-700 max-w-md">
            <h4 className="font-semibold text-lg text-amber-400 mb-2">Exit Dungeon?</h4>
            <p className="text-sm text-stone-300 mb-3">
              You have accumulated <span className="text-yellow-400">{state.collectedRewards.gold} gold</span> and <span className="text-purple-400">{state.collectedRewards.xp} XP</span>.
            </p>
            <p className="text-xs text-stone-400 mb-4">
              Leaving now will grant your accumulated rewards but forfeit boss completion bonuses.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  // Apply accumulated rewards (gold/XP only - items already in inventory)
                  if (state.collectedRewards.gold > 0 || state.collectedRewards.xp > 0) {
                    onApplyRewards({
                      gold: state.collectedRewards.gold,
                      xp: state.collectedRewards.xp,
                      items: [], // Items already added during combat
                      transactionId: `dungeon_exit_${dungeonId}_${Date.now()}`
                    });
                    showToast?.(`Dungeon exit: +${state.collectedRewards.gold}g, +${state.collectedRewards.xp}XP`, 'success');
                  }
                  onClose({ cleared: false, rewards: state.collectedRewards });
                }}
                className="flex-1 px-3 py-2 bg-amber-600 text-white rounded hover:bg-amber-500"
              >
                Leave with Rewards
              </button>
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-3 py-2 border border-stone-600 text-stone-300 rounded hover:bg-stone-800"
              >
                Stay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floor Complete Modal - Optional continue or leave */}
      {showFloorComplete && state && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
          <div className="bg-skyrim-paper p-6 rounded-lg border-2 border-skyrim-gold max-w-md">
            <div className="text-center mb-4">
              <div className="text-3xl text-skyrim-gold mb-2">⚔️</div>
              <h4 className="font-semibold text-xl text-amber-400">Floor {currentFloor} Complete!</h4>
              <p className="text-sm text-stone-300 mt-2">
                Boss defeated! Choose to continue deeper or leave with your rewards.
              </p>
            </div>

            {/* Current Rewards Summary - Include completion bonus */}
            <div className="bg-stone-800 rounded p-3 mb-4 border border-stone-700">
              <div className="text-xs text-stone-500 mb-2 uppercase tracking-wider">Total Rewards (with completion bonus)</div>
              <div className="flex justify-center gap-6 text-sm">
                <span className="text-yellow-400 flex items-center gap-1">
                  💰 {state.collectedRewards.gold + (dungeon?.completionRewards?.gold || 0)} Gold
                </span>
                <span className="text-purple-400 flex items-center gap-1">
                  ✨ {state.collectedRewards.xp + (dungeon?.completionRewards?.xp || 0)} XP
                </span>
                <span className="text-green-400 flex items-center gap-1">
                  📦 {state.collectedRewards.items.length + (dungeon?.completionRewards?.items?.length || 0)} Items
                </span>
              </div>
            </div>

            {/* Warning about difficulty */}
            <div className="bg-red-900/30 rounded p-3 mb-4 border border-red-600/50">
              <p className="text-xs text-red-300 text-center">
                ⚠️ Next floor enemies will be <span className="font-bold">{Math.round((floorScalingFactor + 0.15) * 100)}%</span> stronger!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  // Leave dungeon with all rewards including completion bonus
                  setShowFloorComplete(false);
                  const totalGold = state.collectedRewards.gold + (dungeon?.completionRewards?.gold || 0);
                  const totalXp = state.collectedRewards.xp + (dungeon?.completionRewards?.xp || 0);
                  const completionItems = dungeon?.completionRewards?.items || [];

                  // Apply accumulated rewards + completion bonus
                  onApplyRewards({
                    gold: totalGold,
                    xp: totalXp,
                    items: completionItems, // Only completion items, combat items already in inventory
                    transactionId: `dungeon_clear_${dungeonId}_${Date.now()}`
                  });
                  showToast?.(`Dungeon cleared! +${totalGold}g, +${totalXp}XP`, 'success');

                  setState(prev => prev ? { ...prev, result: 'cleared', active: false } : prev);
                  onClose({ cleared: true, rewards: { gold: totalGold, xp: totalXp, items: [...state.collectedRewards.items, ...completionItems] } });
                }}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
              >
                <DoorOpen size={18} />
                Claim & Exit
              </button>
              <button
                onClick={() => {
                  // Continue to next floor - Reset dungeon state but keep character progress/buffs/rewards
                  setShowFloorComplete(false);
                  setCurrentFloor(prev => prev + 1);
                  setFloorScalingFactor(prev => prev + 0.15);

                  // Reset map progress to start but keep accumulated rewards
                  if (dungeon) {
                    const startNode = dungeon.nodes.find(n => n.id === dungeon.startNodeId) || dungeon.nodes[0];
                    setState(prev => prev ? {
                      ...prev,
                      currentNodeId: startNode.id,
                      visitedNodes: [startNode.id],
                      completedNodes: [startNode.id], // Mark start as completed
                    } : prev);
                    setSelectedNodeId(null);
                  }
                }}
                className="flex-1 px-4 py-3 bg-amber-600 text-white font-semibold rounded hover:bg-amber-500 transition-colors flex items-center justify-center gap-2"
              >
                <Swords size={18} />
                Go Deeper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doom-Style First-Person Dungeon Crawler */}
      {doomModeOpen && dungeon && (
        <DoomMinigame
          isOpen={doomModeOpen}
          dungeonName={dungeon.name}
          difficulty={dungeon.difficulty as 'easy' | 'medium' | 'hard' | 'nightmare'}
          playerLevel={character?.level || 1}
          playerStats={character ? {
            maxHealth: character.stats.health,
            maxMagicka: character.stats.magicka,
            maxStamina: character.stats.stamina,
            damage: 15,
            armor: 0,
          } : undefined}
          showToast={showToast}
          onClose={(result) => {
            setDoomModeOpen(false);
            if (result?.victory && result.rewards) {
              // Accumulate rewards from Doom mode
              setState(prev => prev ? {
                ...prev,
                collectedRewards: {
                  ...prev.collectedRewards,
                  gold: prev.collectedRewards.gold + (result.rewards?.gold || 0),
                  xp: prev.collectedRewards.xp + (result.rewards?.xp || 0),
                  items: [...prev.collectedRewards.items, ...(result.rewards?.items || [])],
                },
              } : prev);
              showToast?.(`Doom Mode Victory! +${result.rewards.gold} Gold, +${result.rewards.xp} XP`, 'success');
            } else if (result && !result.victory) {
              showToast?.('You retreated from the depths...', 'info');
            }
          }}
        />
      )}
    </ModalWrapper>
  );
};

export default DungeonModal;