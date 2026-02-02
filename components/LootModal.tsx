import React, { useState, useEffect, useCallback } from 'react';
import RarityBadge from './RarityBadge';
import { CombatState } from '../types';
import { useLocalization } from '../services/localization';
import { getItemName } from '../services/itemLocalization';

interface LootModalProps {
  combatState: CombatState;
  onCancel: () => void;
  onConfirm: (selected: Array<{ name: string; quantity: number }>) => void;
}

export const LootModal: React.FC<LootModalProps> = ({ combatState, onCancel, onConfirm }) => {
  const { t } = useLocalization();
  const pending = combatState.pendingLoot || [];
  const [selected, setSelected] = useState<Record<string, number>>({});

  // ESC key handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
  }, [onCancel]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-skyrim-dark/60 backdrop-lite"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-stone-900 rounded-lg p-4 w-full max-w-xl border border-skyrim-border" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-amber-100 mb-2">{t('loot.title')}</h3>
        <p className="text-sm text-stone-400 mb-1">{t('loot.instruction')}</p>
        <div className="flex gap-3 items-center text-sm text-amber-200 mb-3">
          <div>{t('loot.xp')}: <span className="font-bold text-amber-100">{xp}</span></div>
          <div>{t('loot.gold')}: <span className="font-bold text-amber-100">{gold}</span></div>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
          {pending.length === 0 && (
            <div className="text-sm text-stone-400">{t('loot.empty')}</div>
          )}
          {pending.map((p, i) => (
            <div key={i} className="p-2 rounded bg-stone-800/40 border border-stone-700">
              <div className="text-sm font-bold text-amber-200">{p.enemyName}</div>
              <div className="text-xs text-stone-400 mb-2">{t('combat.loot')}</div>
              <div className="flex flex-col gap-1">
                {p.loot.map((l, idx) => (
                  <label key={idx} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="w-4 h-4 accent-skyrim-gold" checked={!!selected[l.name]} onChange={() => toggleItem(l.name, l.quantity)} />
                    <span className="flex-1">{getItemName(l as any, t)} <span className="text-stone-400 text-xs">x{l.quantity}</span></span>
                    {l.rarity ? <span className="ml-2"><RarityBadge rarity={String(l.rarity)} /></span> : <span className="text-xs text-stone-400">{l.rarity || ''}</span>}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={lootAll} data-sfx="button_click" className="px-3 py-2 bg-amber-700 rounded text-white">{t('loot.lootAll')}</button>
          <button onClick={confirm} data-sfx="button_click" className="px-3 py-2 bg-green-700 rounded text-white">{t('loot.confirm')}</button>
          <button onClick={skip} data-sfx="button_click" className="px-3 py-2 bg-stone-700 rounded text-white">{t('loot.skip')}</button>
          <button onClick={onCancel} data-sfx="button_click" className="px-3 py-2 ml-auto bg-stone-600 rounded text-white">{t('combat.cancel')}</button>
        </div>
      </div>
    </div>
  );
};
