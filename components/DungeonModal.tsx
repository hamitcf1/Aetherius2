import React, { useState, useMemo, useEffect } from 'react';
import ModalWrapper from './ModalWrapper';
import { DungeonDefinition, DungeonState, DungeonNode, CombatEnemy, Character, InventoryItem } from '../types';
import { getDungeonById } from '../data/dungeonDefinitions';
import { CombatModal } from './CombatModal';
import { initializeCombat } from '../services/combatService';

interface DungeonModalProps {
  open: boolean;
  dungeonId: string | null;
  onClose: (result?: { cleared?: boolean; rewards?: any }) => void;
  activeCharacterId: string | null;
  character: Character | null;
  inventory: InventoryItem[];
  // Callbacks to mutate global state (inventory/character changes)
  onApplyRewards: (rewards: { gold?: number; xp?: number; items?: any[] }) => void;
  onApplyBuff?: (effect: any) => void;
  onStartCombat?: (combatState: any) => void;
}

export const DungeonModal: React.FC<DungeonModalProps> = ({ open, dungeonId, onClose, activeCharacterId, character, inventory, onApplyRewards, onApplyBuff, onStartCombat }) => {
  const dungeon = useMemo(() => (dungeonId ? getDungeonById(dungeonId) : null), [dungeonId]);
  const [state, setState] = useState<DungeonState | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [combatState, setCombatState] = useState<any | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showBossConfirm, setShowBossConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (!open || !dungeon) return;

    // Initialize dungeon state
    const startNode = dungeon.nodes.find(n => n.id === dungeon.startNodeId) || dungeon.nodes[0];
    const playerVitals = { currentHealth: 100, currentMagicka: 100, currentStamina: 100 };
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
    setSelectedNodeId(startNode.id);
  }, [open, dungeon]);

  const getNodeById = (id?: string) => dungeon?.nodes.find(n => n.id === id) as DungeonNode | undefined;

  const handleSelectNode = (nodeId: string) => {
    // Prevent selecting unconnected nodes
    if (!state || !dungeon) return;
    const current = getNodeById(state.currentNodeId);
    if (!current) return;
    if (!current.connections.includes(nodeId) && state.currentNodeId !== nodeId) return;
    setSelectedNodeId(nodeId);
    setHoveredNode(nodeId);
  };

  const buildEdges = () => {
    if (!dungeon) return [] as any[];
    const edges: any[] = [];
    for (const n of dungeon.nodes) {
      for (const toId of n.connections || []) {
        const to = getNodeById(toId);
        if (!to) continue;
        edges.push({ from: n.id, to: to.id, x1: n.x, y1: n.y, x2: to.x, y2: to.y });
      }
    }
    return edges;
  };

  const edges = useMemo(() => buildEdges(), [dungeon, state, selectedNodeId, hoveredNode]);

  const resolveNode = (nodeId: string) => {
    const node = getNodeById(nodeId);
    if (!node) return;

    // Mark visited
    setState(prev => prev ? { ...prev, visitedNodes: Array.from(new Set([...prev.visitedNodes, nodeId])) } : prev);

    // Handle node types
    if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
      const enemies = (node.enemies || []).map(e => ({ ...e } as CombatEnemy));
      const initializedCombat = initializeCombat(enemies, dungeon.location, false, true, false, []);
      setCombatState(initializedCombat);
      return;
    }

    if (node.type === 'rest') {
      // Apply rest
      setState(prev => {
        if (!prev) return prev;
        const healH = node.restAmount?.health ?? 0;
        const healM = node.restAmount?.magicka ?? 0;
        const healS = node.restAmount?.stamina ?? 0;
        const newVitals = {
          currentHealth: Math.min(prev.playerVitals.currentHealth + healH, 9999),
          currentMagicka: Math.min(prev.playerVitals.currentMagicka + healM, 9999),
          currentStamina: Math.min(prev.playerVitals.currentStamina + healS, 9999),
        };
        return { ...prev, playerVitals: newVitals, completedNodes: Array.from(new Set([...prev.completedNodes, nodeId])) };
      });
      return;
    }

    if (node.type === 'reward') {
      if (node.rewards) {
        onApplyRewards({ gold: node.rewards.gold, xp: node.rewards.xp, items: node.rewards.items || [] });
        setState(prev => prev ? { ...prev, collectedRewards: { ...prev.collectedRewards, gold: prev.collectedRewards.gold + (node.rewards?.gold || 0), xp: prev.collectedRewards.xp + (node.rewards?.xp || 0), items: [...prev.collectedRewards.items, ...(node.rewards?.items || [])] }, completedNodes: Array.from(new Set([...prev.completedNodes, nodeId])) } : prev);
      }

      // Apply buff if present
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
        setState(prev => prev ? { ...prev, activeBuffs: [...prev.activeBuffs, { name: eff.name, stat: b.stat, value: b.value, nodesRemaining: Math.max(1, Math.floor((b.duration || 60) / 10)) }], completedNodes: Array.from(new Set([...prev.completedNodes, nodeId])) } : prev);
      }

      return;
    }

    if (node.type === 'event') {
      // For now, auto-apply the first reward if present
      if (node.eventChoices && node.eventChoices.length) {
        const c = node.eventChoices[0];
        if (c.outcome === 'reward') {
          onApplyRewards({ gold: c.value });
          setState(prev => prev ? { ...prev, collectedRewards: { ...prev.collectedRewards, gold: prev.collectedRewards.gold + (c.value || 0) }, completedNodes: Array.from(new Set([...prev.completedNodes, nodeId])) } : prev);
        } else if (c.outcome === 'damage') {
          setState(prev => prev ? { ...prev, playerVitals: { ...prev.playerVitals, currentHealth: Math.max(0, prev.playerVitals.currentHealth - (c.value || 0)) }, completedNodes: Array.from(new Set([...prev.completedNodes, nodeId])) } : prev);
        } else if (c.outcome === 'nothing') {
          setState(prev => prev ? { ...prev, completedNodes: Array.from(new Set([...prev.completedNodes, nodeId])) } : prev);
        }
      }
      return;
    }

    // For empty/start nodes, simply mark complete
    setState(prev => prev ? { ...prev, completedNodes: Array.from(new Set([...prev.completedNodes, nodeId])) } : prev);
  };

  const handleCombatEnd = (result: 'victory' | 'defeat' | 'fled' | 'surrendered', rewards?: any, finalVitals?: any) => {
    if (!state || !dungeon) return;
    // On victory, apply rewards and mark node as completed
    if (result === 'victory') {
      if (rewards) {
        onApplyRewards({ gold: rewards.gold || 0, xp: rewards.xp || 0, items: rewards.items || [] });
        setState(prev => prev ? { ...prev, collectedRewards: { gold: prev.collectedRewards.gold + (rewards.gold || 0), xp: prev.collectedRewards.xp + (rewards.xp || 0), items: [...prev.collectedRewards.items, ...(rewards.items || [])] } } : prev);
      }

      // Mark current node as completed
      setState(prev => prev ? { ...prev, completedNodes: Array.from(new Set([...prev.completedNodes, state.currentNodeId])) } : prev);

      // If boss defeated, finalize
      const currentNode = dungeon.nodes.find(n => n.id === state.currentNodeId);
      if (currentNode?.type === 'boss') {
        setState(prev => prev ? { ...prev, result: 'cleared', active: false } : prev);
        onClose({ cleared: true, rewards: state?.collectedRewards });
        return;
      }

      // Advance to next node (if single connection)
      const cur = dungeon.nodes.find(n => n.id === state.currentNodeId);
      const next = cur?.connections && cur.connections.length === 1 ? cur.connections[0] : null;
      if (next) {
        setState(prev => prev ? { ...prev, currentNodeId: next, visitedNodes: Array.from(new Set([...prev.visitedNodes, next])) } : prev);
        setSelectedNodeId(next);
      }
    }

    if (result === 'defeat') {
      setState(prev => prev ? { ...prev, result: 'defeated', active: false } : prev);
      onClose({ cleared: false });
    }

    setCombatState(null);
  };

  const renderNode = (node: DungeonNode) => {
    const visited = state?.visitedNodes.includes(node.id);
    const completed = state?.completedNodes.includes(node.id);
    const isCurrent = state?.currentNodeId === node.id;
    const locked = !(state?.currentNodeId === node.id || (state && state.currentNodeId && dungeon?.nodes.find(n => n.id === state.currentNodeId)?.connections.includes(node.id)));

    return (
      <div key={node.id} className={`p-2 rounded-md border ${isCurrent ? 'border-green-400 bg-green-900/20' : ''} ${visited ? 'opacity-90' : 'opacity-60'} ${locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`} onClick={() => !locked && handleSelectNode(node.id)}>
        <div className="flex items-center justify-between">
          <div className="font-semibold">{node.name} {node.type === 'boss' && <span className="text-xs text-red-400 font-bold">BOSS</span>}</div>
          {locked && <span className="text-xs text-gray-400" title="Locked">🔒</span>}
        </div>
        <div className="text-xs text-skyrim-text/70">{node.description}</div>
        {node.rewards?.buff && (
          <div className="text-[11px] mt-1 inline-block bg-amber-700/20 px-2 py-1 rounded">Buff: {node.rewards.buff.name} (+{node.rewards.buff.value} {node.rewards.buff.stat})</div>
        )}
        <div className="mt-1 text-xs flex gap-2">
          {node.type === 'combat' && <button className="btn btn-xs" onClick={() => resolveNode(node.id)}>Fight</button>}
          {node.type === 'elite' && <button className="btn btn-xs" onClick={() => resolveNode(node.id)}>Fight (Elite)</button>}
          {node.type === 'rest' && <button className="btn btn-xs" onClick={() => resolveNode(node.id)}>Rest</button>}
          {node.type === 'reward' && <button className="btn btn-xs" onClick={() => resolveNode(node.id)}>Loot</button>}
          {node.type === 'event' && <button className="btn btn-xs" onClick={() => resolveNode(node.id)}>Inspect</button>}
          {node.type === 'empty' && <button className="btn btn-xs" onClick={() => resolveNode(node.id)}>Search</button>}
          {node.type === 'boss' && <button className="btn btn-xs btn-danger" onClick={() => setShowBossConfirm(true)}>Engage Boss</button>}
        </div>
      </div>
    );
  };

  if (!open || !dungeon || !state) return null;

  return (
    <ModalWrapper open={open} onClose={() => onClose({ cleared: false })} preventOutsideClose>
      <div className="w-[95vw] max-w-4xl bg-skyrim-paper p-4 rounded">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-2xl text-skyrim-gold">{dungeon.name}</h3>
            <div className="text-xs text-skyrim-text/70">{dungeon.ambientDescription}</div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="text-sm">Gold: {state.collectedRewards.gold}</div>
            <div className="text-sm">XP: {state.collectedRewards.xp}</div>
            <button className="btn" onClick={() => onClose({ cleared: false })}>Exit Dungeon</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            {/* Simple tree visualization: nodes placed by x/y */}
            <div className="relative bg-skyrim-dark/90 rounded p-4 h-96 overflow-auto">
              {/* SVG edges layer (0-100 viewBox aligns with node x/y%) */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none opacity-90">
                <defs>
                  <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L6,3 L0,6 L2,3 z" fill="#d4a44a" />
                  </marker>
                </defs>

                {/* Simple keyframes for dash movement when highlighted */}
                <style>{`
                  @keyframes dash-move { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -24; } }
                `}</style>

                {edges.map((e, idx) => {
                  const visited = state?.visitedNodes.includes(e.from) && state?.visitedNodes.includes(e.to);
                  const completed = state?.completedNodes.includes(e.to) || state?.completedNodes.includes(e.from);
                  const locked = !(state?.currentNodeId === e.from || (state && state.currentNodeId && getNodeById(state.currentNodeId)?.connections.includes(e.to)));
                  const highlight = hoveredNode === e.from || hoveredNode === e.to || selectedNodeId === e.from || selectedNodeId === e.to;

                  // Compute a simple curved path using quadratic bezier control point offset
                  const x1 = e.x1;
                  const y1 = e.y1;
                  const x2 = e.x2;
                  const y2 = e.y2;
                  const cx = (x1 + x2) / 2;
                  const cy = (y1 + y2) / 2 - (Math.abs(x2 - x1) * 0.2 + 3); // offset for curve
                  const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

                  const stroke = locked ? '#444' : completed ? '#6ee7b7' : visited ? '#d4a44a' : '#6b7280';
                  const dasharray = locked ? '4 3' : visited ? '6 3' : '0';

                  const labelX = (x1 + x2) / 2;
                  const labelY = (y1 + y2) / 2 - 2;

                  return (
                    <g key={idx}>
                      <path d={d} fill="none" stroke={stroke} strokeWidth={highlight ? 1.2 : 0.6} strokeDasharray={dasharray} style={{ transition: 'stroke 180ms, stroke-width 180ms', animation: highlight ? 'dash-move 1.5s linear infinite' : undefined }} markerEnd={completed ? 'url(#arrow)' : undefined} />
                      {/* Edge label and optional lock icon when path is locked */}
                      <text x={labelX} y={labelY} fontSize={2} fill={locked ? '#aaa' : '#d4a44a'} textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: 'none' }}>{locked ? '🔒' : visited ? '' : ''}</text>
                    </g>
                  );
                })}
              </svg>

              {dungeon.nodes.map(n => (
                <div key={n.id} style={{ position: 'absolute', left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%,-50%)' }} onMouseEnter={() => setHoveredNode(n.id)} onMouseLeave={() => setHoveredNode(null)}>
                  {renderNode(n)}
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-1 p-2 border-l border-skyrim-border">
            <h4 className="text-sm font-semibold mb-2">Node Details</h4>
            {selectedNodeId ? (
              <div>
                {renderNode(getNodeById(selectedNodeId) as DungeonNode)}
                <div className="mt-2 text-xs">
                  <div>Visited: {state.visitedNodes.length}</div>
                  <div>Completed: {state.completedNodes.length}</div>
                </div>

                {/* If boss selected show engage confirmation */}
                {getNodeById(selectedNodeId)?.type === 'boss' && (
                  <div className="mt-3">
                    <button className="btn btn-danger w-full" onClick={() => setShowBossConfirm(true)}>Engage Boss</button>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-xs text-skyrim-text/60">Select a node to inspect it.</div>
            )}

            <div className="mt-4">
              <h5 className="text-sm font-semibold">Party</h5>
              <div className="text-xs">Health: {state.playerVitals.currentHealth}</div>
              <div className="text-xs">Magicka: {state.playerVitals.currentMagicka}</div>
              <div className="text-xs">Stamina: {state.playerVitals.currentStamina}</div>
            </div>

            <div className="mt-4">
              <h5 className="text-sm font-semibold">Collected</h5>
              <div className="text-xs">Gold: {state.collectedRewards.gold}</div>
              <div className="text-xs">XP: {state.collectedRewards.xp}</div>
              <div className="text-xs">Items: {state.collectedRewards.items.map(i => i.name).join(', ') || '—'}</div>
            </div>

            <div className="mt-4">
              <button className="btn w-full" onClick={() => setShowExitConfirm(true)}>Exit Dungeon</button>
            </div>

          </div>
        </div>

      </div>

      {/* Combat Modal when active inside dungeon */}
      {combatState && character && (
        <CombatModal
          character={character}
          inventory={inventory}
          initialCombatState={combatState}
          onCombatEnd={(result, rewards, finalVitals) => handleCombatEnd(result as any, rewards, finalVitals)}
        />
      )}

      {/* Boss confirmation modal */}
      {showBossConfirm && (
        <ModalWrapper open={showBossConfirm} onClose={() => setShowBossConfirm(false)} preventOutsideClose>
          <div className="bg-skyrim-paper p-4 rounded max-w-md">
            <h4 className="font-semibold text-lg">Confirm Boss Engagement</h4>
            <p className="text-xs mt-2">Engaging the boss now will start a difficult fight. Exiting the dungeon before defeating the boss forfeits boss rewards. Proceed?</p>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-danger flex-1" onClick={() => {
                setShowBossConfirm(false);
                if (selectedNodeId) resolveNode(selectedNodeId);
              }}>Engage</button>
              <button className="btn flex-1" onClick={() => setShowBossConfirm(false)}>Cancel</button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* Exit confirmation */}
      {showExitConfirm && (
        <ModalWrapper open={showExitConfirm} onClose={() => setShowExitConfirm(false)} preventOutsideClose>
          <div className="bg-skyrim-paper p-4 rounded max-w-md">
            <h4 className="font-semibold text-lg">Exit Dungeon</h4>
            <p className="text-xs mt-2">Are you sure you want to exit? Boss rewards will be forfeited if the dungeon hasn't been cleared.</p>
            <div className="flex gap-2 mt-4">
              <button className="btn btn-danger flex-1" onClick={() => {
                setShowExitConfirm(false);
                onClose({ cleared: false });
              }}>Exit</button>
              <button className="btn flex-1" onClick={() => setShowExitConfirm(false)}>Cancel</button>
            </div>
          </div>
        </ModalWrapper>
      )}

    </ModalWrapper>
  );
};

export default DungeonModal;
