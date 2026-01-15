import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ModalWrapper from './ModalWrapper';
import { DungeonDefinition, DungeonState, DungeonNode, CombatEnemy, Character, InventoryItem } from '../types';
import { getDungeonById } from '../data/dungeonDefinitions';
import { CombatModal } from './CombatModal';
import { initializeCombat } from '../services/combatService';
import { Sword, Shield, Heart, Gift, HelpCircle, Skull, Coffee, ChevronRight, X, Sparkles, Lock, CheckCircle } from 'lucide-react';

interface DungeonModalProps {
  open: boolean;
  dungeonId: string | null;
  onClose: (result?: { cleared?: boolean; rewards?: any }) => void;
  activeCharacterId: string | null;
  character: Character | null;
  inventory: InventoryItem[];
  onApplyRewards: (rewards: { gold?: number; xp?: number; items?: any[]; transactionId?: string }) => void;
  onApplyBuff?: (effect: any) => void;
  onStartCombat?: (combatState: any) => void;
  showToast?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

// Node type icons and colors
const NODE_STYLES: Record<string, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  start: { icon: <ChevronRight size={16} />, color: 'text-green-400', bgColor: 'bg-green-900/40', label: 'Start' },
  combat: { icon: <Sword size={16} />, color: 'text-red-400', bgColor: 'bg-red-900/40', label: 'Combat' },
  elite: { icon: <Shield size={16} />, color: 'text-orange-400', bgColor: 'bg-orange-900/40', label: 'Elite' },
  boss: { icon: <Skull size={16} />, color: 'text-purple-400', bgColor: 'bg-purple-900/50', label: 'Boss' },
  rest: { icon: <Coffee size={16} />, color: 'text-cyan-400', bgColor: 'bg-cyan-900/40', label: 'Rest' },
  reward: { icon: <Gift size={16} />, color: 'text-yellow-400', bgColor: 'bg-yellow-900/40', label: 'Treasure' },
  event: { icon: <HelpCircle size={16} />, color: 'text-pink-400', bgColor: 'bg-pink-900/40', label: 'Event' },
  empty: { icon: <Sparkles size={16} />, color: 'text-gray-400', bgColor: 'bg-gray-800/40', label: 'Empty' },
};

// Generate a Slay the Spire style map from dungeon nodes
interface MapNode {
  id: string;
  row: number;
  col: number;
  type: string;
  connections: string[];
  original: DungeonNode;
}

function generateSlayTheSpireMap(dungeon: DungeonDefinition): { nodes: MapNode[]; rows: number; cols: number } {
  const originalNodes = dungeon.nodes;
  const nodeMap = new Map<string, DungeonNode>();
  originalNodes.forEach(n => nodeMap.set(n.id, n));

  // BFS to assign rows based on distance from start
  const startNode = originalNodes.find(n => n.id === dungeon.startNodeId) || originalNodes[0];
  const visited = new Set<string>();
  const rowAssignment = new Map<string, number>();
  const queue: { id: string; row: number }[] = [{ id: startNode.id, row: 0 }];
  
  while (queue.length > 0) {
    const { id, row } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    rowAssignment.set(id, row);
    
    const node = nodeMap.get(id);
    if (node) {
      for (const connId of node.connections) {
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

  const rows = Math.max(...Array.from(rowGroups.keys())) + 1;
  const maxCols = Math.max(...Array.from(rowGroups.values()).map(g => g.length));

  // Create map nodes with column positions
  const mapNodes: MapNode[] = [];
  rowGroups.forEach((nodeIds, row) => {
    const colSpacing = maxCols / (nodeIds.length + 1);
    nodeIds.forEach((id, idx) => {
      const original = nodeMap.get(id)!;
      mapNodes.push({
        id,
        row,
        col: Math.floor((idx + 1) * colSpacing),
        type: original.type,
        connections: original.connections,
        original,
      });
    });
  });

  return { nodes: mapNodes, rows, cols: maxCols };
}

export const DungeonModal: React.FC<DungeonModalProps> = ({ 
  open, dungeonId, onClose, activeCharacterId, character, inventory, 
  onApplyRewards, onApplyBuff, onStartCombat, showToast
}) => {
  const dungeon = useMemo(() => (dungeonId ? getDungeonById(dungeonId) : null), [dungeonId]);
  const [state, setState] = useState<DungeonState | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [combatState, setCombatState] = useState<any | null>(null);
  const [showBossConfirm, setShowBossConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [eventChoice, setEventChoice] = useState<DungeonNode | null>(null);

  // Generate the Slay the Spire style map
  const mapData = useMemo(() => dungeon ? generateSlayTheSpireMap(dungeon) : null, [dungeon]);

  useEffect(() => {
    if (!open || !dungeon) return;
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
      completedNodes: [],
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
  }, [open, dungeon]);

  const getNodeById = useCallback((id?: string) => dungeon?.nodes.find(n => n.id === id) as DungeonNode | undefined, [dungeon]);

  // Check if a node is accessible (connected to current node OR is current node)
  const isNodeAccessible = useCallback((nodeId: string) => {
    if (!state) return false;
    if (state.currentNodeId === nodeId) return true;
    const currentNode = getNodeById(state.currentNodeId);
    return currentNode?.connections.includes(nodeId) || false;
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
        const scaleFactor = 1 + (clearCount * 0.25); // 25% stronger per clear
        
        const enemies = (node.enemies || []).map(e => {
          const scaled: CombatEnemy = {
            ...e,
            maxHealth: Math.floor(e.maxHealth * scaleFactor),
            currentHealth: Math.floor(e.maxHealth * scaleFactor),
            damage: Math.floor(e.damage * scaleFactor),
            armor: Math.floor((e.armor || 0) * scaleFactor),
            xpReward: Math.floor((e.xpReward || 0) * scaleFactor),
            goldReward: e.goldReward ? Math.floor(e.goldReward * scaleFactor) : undefined,
          };
          return scaled;
        });
        const initializedCombat = initializeCombat(enemies, dungeon.location, false, true, false, []);
        setCombatState(initializedCombat);
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
          onApplyRewards({ gold: node.rewards.gold, xp: node.rewards.xp, items: node.rewards.items || [] });
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
            id: `dungeon_buff_${b.name.toLowerCase().replace(/\s+/g,'_')}_${Date.now()}`,
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
      onApplyRewards({ gold: choice.value || 0 });
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

  // Handle combat end
  const handleCombatEnd = (result: 'victory' | 'defeat' | 'fled' | 'surrendered', rewards?: any, finalVitals?: any) => {
    if (!state || !dungeon) return;
    
    if (result === 'victory') {
      if (rewards) {
        // Pass through the transactionId from finalizeLoot to prevent creating duplicate transactions
        onApplyRewards({ gold: rewards.gold || 0, xp: rewards.xp || 0, items: rewards.items || [], transactionId: rewards.transactionId });
        setState(prev => prev ? { 
          ...prev, 
          collectedRewards: { 
            gold: prev.collectedRewards.gold + (rewards.gold || 0), 
            xp: prev.collectedRewards.xp + (rewards.xp || 0), 
            items: [...prev.collectedRewards.items, ...(rewards.items || [])] 
          } 
        } : prev);
      }

      completeCurrentNode();

      const currentNode = dungeon.nodes.find(n => n.id === state.currentNodeId);
      if (currentNode?.type === 'boss') {
        setState(prev => prev ? { ...prev, result: 'cleared', active: false } : prev);
        onClose({ cleared: true, rewards: state?.collectedRewards });
        return;
      }

      // Auto-advance to next if single connection
      if (currentNode?.connections.length === 1) {
        setTimeout(() => advanceToNode(currentNode.connections[0]), 500);
      }
    }

    if (result === 'defeat') {
      setState(prev => prev ? { ...prev, result: 'defeated', active: false } : prev);
      onClose({ cleared: false });
    }

    setCombatState(null);
  };

  // Render a single node on the map
  const renderMapNode = (mapNode: MapNode) => {
    if (!state) return null;
    const node = mapNode.original;
    const style = NODE_STYLES[node.type] || NODE_STYLES.empty;
    const isCurrent = state.currentNodeId === mapNode.id;
    const isCompleted = state.completedNodes.includes(mapNode.id);
    const isVisited = state.visitedNodes.includes(mapNode.id);
    const isAccessible = isNodeAccessible(mapNode.id);
    const isSelected = selectedNodeId === mapNode.id;

    return (
      <button
        key={mapNode.id}
        onClick={() => isAccessible && handleSelectNode(mapNode.id)}
        disabled={!isAccessible && !isCurrent}
        className={`
          w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200
          ${style.bgColor} ${style.color}
          ${isCurrent ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-skyrim-dark scale-110' : ''}
          ${isCompleted ? 'opacity-50' : ''}
          ${isSelected ? 'ring-2 ring-skyrim-gold' : ''}
          ${isAccessible && !isCompleted ? 'hover:scale-110 cursor-pointer' : ''}
          ${!isAccessible && !isCurrent ? 'opacity-30 cursor-not-allowed' : ''}
        `}
        title={`${node.name} (${style.label})`}
      >
        {isCompleted ? <CheckCircle size={18} className="text-green-400" /> : style.icon}
      </button>
    );
  };

  // Render connections between nodes
  const renderConnections = () => {
    if (!mapData || !state) return null;
    
    const nodePositions = new Map<string, { row: number; col: number }>();
    mapData.nodes.forEach(n => nodePositions.set(n.id, { row: n.row, col: n.col }));

    const connections: React.ReactNode[] = [];
    mapData.nodes.forEach(node => {
      const fromPos = nodePositions.get(node.id);
      if (!fromPos) return;
      
      node.connections.forEach(toId => {
        const toPos = nodePositions.get(toId);
        if (!toPos) return;

        const fromX = (fromPos.col + 0.5) * (100 / (mapData.cols + 1));
        const fromY = (fromPos.row + 0.5) * (100 / mapData.rows);
        const toX = (toPos.col + 0.5) * (100 / (mapData.cols + 1));
        const toY = (toPos.row + 0.5) * (100 / mapData.rows);

        const isActive = state.currentNodeId === node.id || state.completedNodes.includes(node.id);
        
        connections.push(
          <line
            key={`${node.id}-${toId}`}
            x1={`${fromX}%`}
            y1={`${fromY}%`}
            x2={`${toX}%`}
            y2={`${toY}%`}
            stroke={isActive ? '#d4a44a' : '#444'}
            strokeWidth={isActive ? 3 : 2}
            strokeDasharray={isActive ? '0' : '5,5'}
            className="transition-all duration-300"
          />
        );
      });
    });

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#d4a44a" />
          </marker>
        </defs>
        {connections}
      </svg>
    );
  };

  if (!open || !dungeon || !state || !mapData) return null;

  const currentNode = getNodeById(state.currentNodeId);
  const selectedNode = selectedNodeId ? getNodeById(selectedNodeId) : null;

  return (
    <ModalWrapper open={open} onClose={() => setShowExitConfirm(true)} preventOutsideClose>
      <div className="w-[95vw] max-w-5xl h-[85vh] flex flex-col bg-skyrim-dark rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-skyrim-border bg-skyrim-paper/10">
          <div>
            <h2 className="text-2xl font-serif text-skyrim-gold">{dungeon.name}</h2>
            <p className="text-xs text-skyrim-text/70 mt-1">{dungeon.ambientDescription}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-skyrim-gold">Gold: {state.collectedRewards.gold}</div>
            <div className="text-sm text-blue-300">XP: {state.collectedRewards.xp}</div>
            <button 
              onClick={() => setShowExitConfirm(true)}
              className="px-3 py-1.5 bg-red-600/20 text-red-300 rounded hover:bg-red-600/30 flex items-center gap-1"
            >
              <X size={14} /> Exit
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Map Area */}
          <div className="flex-1 relative p-4 overflow-auto">
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
          <div className="w-80 border-l border-skyrim-border bg-skyrim-paper/5 p-4 flex flex-col">
            {/* Current Node Info */}
            <div className="mb-4 p-3 rounded bg-skyrim-paper/10 border border-skyrim-border">
              <div className="text-xs text-skyrim-text/70 mb-1">Current Location</div>
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
                <div className="p-3 rounded bg-skyrim-paper/10 border border-amber-800/30">
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
                    {selectedNode.type === 'combat' ? 'Fight' : 
                     selectedNode.type === 'elite' ? 'Challenge Elite' :
                     selectedNode.type === 'boss' ? 'Engage Boss' :
                     selectedNode.type === 'rest' ? 'Rest Here' :
                     selectedNode.type === 'reward' ? 'Collect Treasure' :
                     selectedNode.type === 'event' ? 'Investigate' :
                     'Proceed'}
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

      {/* Combat Modal */}
      {combatState && character && (
        <CombatModal
          character={character}
          inventory={inventory}
          initialCombatState={combatState}
          onCombatEnd={(result, rewards, finalVitals) => handleCombatEnd(result as any, rewards, finalVitals)}
          showToast={showToast}
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
                  className={`w-full px-4 py-2 rounded text-left ${
                    choice.outcome === 'damage' 
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

      {/* Exit Confirmation */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-skyrim-paper p-4 rounded border border-skyrim-border max-w-md">
            <h4 className="font-semibold text-lg text-skyrim-gold">Exit Dungeon?</h4>
            <p className="text-sm text-skyrim-text mt-2">
              Are you sure you want to leave? Progress will be lost and boss rewards forfeited if not cleared.
            </p>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => { setShowExitConfirm(false); onClose({ cleared: false }); }}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-500"
              >
                Exit Dungeon
              </button>
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-3 py-2 border border-skyrim-border text-skyrim-text rounded hover:bg-skyrim-paper/30"
              >
                Stay
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalWrapper>
  );
};

export default DungeonModal;
