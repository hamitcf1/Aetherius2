import React, { useState } from 'react';
import { CombatState } from '../types';

interface LootModalProps {
  combatState: CombatState;
  onCancel: () => void;
  onConfirm: (selected: Array<{ name: string; quantity: number }>) => void;
}

export const LootModal: React.FC<LootModalProps> = ({ combatState, onCancel, onConfirm }) => {
  const pending = combatState.pendingLoot || [];
  const [selected, setSelected] = useState<Record<string, number>>({});

  const toggleItem = (name: string, qty = 1) => {
    setSelected(prev => {
      const copy = { ...prev };
      if (copy[name]) delete copy[name];
      else copy[name] = qty;
      return copy;
    });
  };

  const lootAll = () => {
    const all: Record<string, number> = {};
    pending.forEach(p => p.loot.forEach(l => { all[l.name] = (all[l.name] || 0) + (l.quantity || 1); }));
    setSelected(all);
  };

  const skip = () => onConfirm([]);

  const confirm = () => {
    const arr = Object.keys(selected).map(k => ({ name: k, quantity: selected[k] }));
    onConfirm(arr);
  };

  const xp = combatState.pendingRewards?.xp || 0;
  const gold = combatState.pendingRewards?.gold || 0;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-skyrim-dark/60">
      <div className="bg-stone-900 rounded-lg p-4 w-full max-w-xl border border-skyrim-border">
        <h3 className="text-lg font-bold text-amber-100 mb-2">Loot Phase</h3>
        <p className="text-sm text-stone-400 mb-1">Select items to loot from defeated enemies, or skip looting entirely.</p>
        <div className="flex gap-3 items-center text-sm text-amber-200 mb-3">
          <div>Experience: <span className="font-bold text-amber-100">{xp}</span></div>
          <div>Gold: <span className="font-bold text-amber-100">{gold}</span></div>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
          {pending.length === 0 && (
            <div className="text-sm text-stone-400">There is nothing to loot.</div>
          )}
          {pending.map((p, i) => (
            <div key={i} className="p-2 rounded bg-stone-800/40 border border-stone-700">
              <div className="text-sm font-bold text-amber-200">{p.enemyName}</div>
              <div className="text-xs text-stone-400 mb-2">Loot</div>
              <div className="flex flex-col gap-1">
                {p.loot.map((l, idx) => (
                  <label key={idx} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!selected[l.name]} onChange={() => toggleItem(l.name, l.quantity)} />
                    <span className="flex-1">{l.name} <span className="text-stone-400 text-xs">x{l.quantity}</span></span>
                    <span className="text-xs text-stone-400">{l.rarity || ''}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={lootAll} className="px-3 py-2 bg-amber-700 rounded text-white">Loot All</button>
          <button onClick={confirm} className="px-3 py-2 bg-green-700 rounded text-white">Confirm</button>
          <button onClick={skip} className="px-3 py-2 bg-stone-700 rounded text-white">Skip</button>
          <button onClick={onCancel} className="px-3 py-2 ml-auto bg-stone-600 rounded text-white">Cancel</button>
        </div>
      </div>
    </div>
  );
};
