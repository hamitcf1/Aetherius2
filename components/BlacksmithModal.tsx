import React, { useMemo, useState } from 'react';
import ModalWrapper from './ModalWrapper';
import { InventoryItem } from '../types';
import upgradeSvc, { getUpgradeCost, canUpgrade, previewUpgradeStats, getMaxUpgradeForItem, getRequiredPlayerLevelForNextUpgrade } from '../services/upgradeService';
import { Sword, Shield, Coins } from 'lucide-react';
import { useAppContext } from '../AppContext';

interface Props {
  open: boolean;
  onClose: () => void;
  items: InventoryItem[];
  setItems: (items: InventoryItem[]) => void;
  gold: number;
  setGold: (g: number) => void;
}

export function BlacksmithModal({ open, onClose, items, setItems, gold, setGold }: Props) {
  const eligible = useMemo(() => items.filter(i => (i.type === 'weapon' || i.type === 'apparel') ), [items]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => eligible.find(i => i.id === selectedId) ?? null, [eligible, selectedId]);
  const { characterLevel, showToast } = useAppContext();

  const handleConfirm = () => {
    if (!selected) return;
    if (!upgradeSvc.canUpgrade(selected)) {
      showToast?.('Item cannot be upgraded further', 'warning');
      return;
    }
    const requiredLevel = getRequiredPlayerLevelForNextUpgrade(selected);
    if (requiredLevel > 0 && (characterLevel || 0) < requiredLevel) {
      showToast?.(`Requires player level ${requiredLevel} to perform this upgrade`, 'warning');
      return;
    }

    const { updated, cost } = upgradeSvc.applyUpgrade(selected);
    if (gold < cost) {
      showToast?.('Insufficient gold for upgrade', 'warning');
      return;
    }

    // Deduct gold and update item
    setGold(gold - cost);
    const next = items.map(i => i.id === updated.id ? { ...updated } : i);
    setItems(next);
    showToast?.('Upgrade successful', 'success');
  };

  return (
    <ModalWrapper open={open} onClose={onClose} zIndex="z-[80]">
      <div className="bg-skyrim-paper border-2 border-skyrim-border rounded-lg p-4 sm:p-6 w-full max-w-[720px] h-[min(92vh,calc(100vh-2rem))] sm:max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif text-skyrim-gold">Blacksmith</h2>
          <div className="flex items-center gap-2 text-sm text-skyrim-text">
            <Coins /> <span className="font-serif text-yellow-400">{gold}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <h3 className="text-sm text-skyrim-text mb-2">Eligible Items</h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              {eligible.map(it => (
                <button key={it.id} onClick={() => setSelectedId(it.id)} className={`w-full text-left p-3 rounded border ${selectedId === it.id ? 'border-skyrim-gold bg-skyrim-gold/10' : 'border-skyrim-border hover:border-skyrim-gold/40'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded bg-skyrim-paper/40 text-skyrim-gold">{it.type === 'weapon' ? <Sword size={16}/> : <Shield size={16}/>}</div>
                      <div>
                        <div className="text-skyrim-gold font-serif">{it.name}</div>
                        <div className="text-xs text-skyrim-text">Lvl {it.upgradeLevel || 0} / {getMaxUpgradeForItem(it)}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-300">{it.value ?? ''}g</div>
                  </div>
                </button>
              ))}
              {eligible.length === 0 && <div className="text-gray-500 italic">No weapons or armor available.</div>}
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm text-skyrim-text mb-2">Details</h3>
            {!selected && <div className="text-gray-500 italic">Select an item to view upgrade options.</div>}
            {selected && (
              <div className="bg-skyrim-paper/30 p-3 sm:p-4 rounded border border-skyrim-border">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-serif text-skyrim-gold">{selected.name}</h4>
                        <div className="text-xs text-skyrim-text">Type: {selected.type}</div>
                      </div>
                      <div className="text-sm text-gray-200">Current Level: <strong>{selected.upgradeLevel || 0}</strong></div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-300">Current Stats</div>
                        <div className="mt-1 text-skyrim-gold font-serif">
                          {selected.damage !== undefined && <div>Damage: {selected.damage}</div>}
                          {selected.armor !== undefined && <div>Armor: {selected.armor}</div>}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-300">After Upgrade</div>
                        <div className="mt-1 text-skyrim-gold font-serif">
                          {(() => {
                            const preview = previewUpgradeStats(selected);
                            return (
                              <>
                                {preview.damage !== undefined && <div>Damage: {preview.damage}</div>}
                                {preview.armor !== undefined && <div>Armor: {preview.armor}</div>}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs text-gray-300">Upgrade Cost</div>
                      <div className="mt-1 text-yellow-400 font-serif text-lg">{getUpgradeCost(selected)}g</div>
                      <div className="text-xs mt-1 text-skyrim-text">Max Level: {getMaxUpgradeForItem(selected)}</div>
                      {(() => {
                        const req = getRequiredPlayerLevelForNextUpgrade(selected);
                        if (req > 0) {
                          const ok = (characterLevel || 0) >= req;
                          return (
                            <div className={`text-xs mt-1 ${ok ? 'text-green-400' : 'text-red-400'}`}>
                              Requires player level {req} {ok ? '— met' : '— not met'}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button onClick={handleConfirm} className="px-4 py-2 bg-skyrim-gold text-skyrim-dark rounded font-bold">Confirm Upgrade</button>
                  <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

export default BlacksmithModal;
