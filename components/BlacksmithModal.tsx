import React, { useMemo, useState, useEffect, useRef } from 'react';
import ModalWrapper from './ModalWrapper';
import { InventoryItem } from '../types';
import upgradeSvc, { getUpgradeCost, canUpgrade, previewUpgradeStats, getMaxUpgradeForItem, getRequiredPlayerLevelForNextUpgrade } from '../services/upgradeService';
import { Sword, Shield, Coins } from 'lucide-react';
import RarityBadge from './RarityBadge';
import { useAppContext } from '../AppContext';
import { audioService } from '../services/audioService';

// Spark particle component for blacksmith upgrade effect
export const SparkParticles: React.FC<{ active: boolean; buttonRef: React.RefObject<HTMLButtonElement | null> }> = ({ active, buttonRef }) => {
  const [sparks, setSparks] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; life: number; color: string }>>([]);
  const animationRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!active || !buttonRef.current) return;

    try {
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Generate initial sparks
      const seed = Date.now();
      const initialSparks = Array.from({ length: 25 }, (_, i) => ({
        id: seed + i,
        x: centerX,
        y: centerY,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 4,
        life: 1,
        color: Math.random() > 0.3 
          ? `rgba(${255}, ${150 + Math.random() * 100}, ${Math.random() * 50}, 1)` // Orange/red
          : `rgba(${255}, ${200 + Math.random() * 55}, ${100 + Math.random() * 100}, 1)` // Yellow/gold
      }));

      setSparks(initialSparks);

      // Animate sparks
      const animate = () => {
        try {
          setSparks(prev => {
            const updated = prev
              .map(s => ({
                ...s,
                x: s.x + s.vx,
                y: s.y + s.vy,
                vy: s.vy + 0.3, // gravity
                life: s.life - 0.025
              }))
              .filter(s => s.life > 0);

            if (updated.length === 0) {
              animationRef.current = null;
              return [];
            }

            animationRef.current = requestAnimationFrame(animate);
            return updated;
          });
        } catch (err) {
          // Defensive: ensure any animation errors don't bubble to React and break the tree
          // eslint-disable-next-line no-console
          console.error('Spark animation error', err);
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          }
          setSparks([]);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('SparkParticles effect error', err);
      setSparks([]);
    }

    return () => {
      // Ensure animation stops and any remaining sparks are cleared when the effect is torn down
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // Clear sparks so they don't remain frozen on screen if active toggles off mid-animation
      setSparks([]);
    };
  }, [active, buttonRef]);

  
  if (sparks.length === 0) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {sparks.map(spark => (
        <div
          key={spark.id}
          style={{
            position: 'fixed',
            left: spark.x,
            top: spark.y,
            width: `${4 + Math.random() * 4}px`,
            height: `${4 + Math.random() * 4}px`,
            background: spark.color,
            borderRadius: '50%',
            boxShadow: `0 0 ${6}px ${spark.color}, 0 0 ${12}px ${spark.color}`,
            opacity: spark.life,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
};

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
  const [showSparks, setShowSparks] = useState(false);
  const upgradeButtonRef = useRef<HTMLButtonElement>(null);
  const sparkTimeoutRef = useRef<number | null>(null);

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

    // Play forge upgrade sound and anvil hit sound
    audioService.playSoundEffect('anvil_hit');
    setTimeout(() => audioService.playSoundEffect('forge_upgrade'), 100);
    
    // Trigger spark effect. Allow the particle system to fully animate (≈800ms) before hiding.
    // Clear any existing timeout so repeated upgrades reset the timer cleanly.
    if (sparkTimeoutRef.current) {
      clearTimeout(sparkTimeoutRef.current as any);
      sparkTimeoutRef.current = null;
    }
    setShowSparks(true);
    sparkTimeoutRef.current = window.setTimeout(() => {
      setShowSparks(false);
      sparkTimeoutRef.current = null;
    }, 800);

    // Handle stack splitting: if the selected item is part of a stack (quantity > 1), we should
    // decrement the original stack and create a unique upgraded copy instead of upgrading the whole stack.
    if ((selected.quantity || 0) > 1) {
      const newId = `item_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      const upgradedSingle = { ...updated, id: newId, quantity: 1 } as InventoryItem;
      const originalReduced = { ...selected, quantity: (selected.quantity || 1) - 1 } as InventoryItem;

      // Persist via global handler only (avoid local double-insert).
      setGold(gold - cost);
      (window as any).app?.handleGameUpdate?.({ updatedItems: [originalReduced], newItems: [{ ...upgradedSingle, __forceCreate: true }] });
      showToast?.('Upgraded one item from the stack', 'success');
      return;
    }

    // Deduct gold and update single item
    setGold(gold - cost);
    const next = items.map(i => i.id === updated.id ? { ...updated } : i);
    setItems(next);
    // Persist by id to avoid name-merge behavior
    (window as any).app?.handleGameUpdate?.({ updatedItems: [updated] });
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
                        <div className="text-xs text-skyrim-text">Type: {selected.type} {selected.rarity && <span className="inline-block align-middle ml-2"><RarityBadge rarity={String(selected.rarity)} /></span>}</div>
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

                <div className="mt-4 flex flex-col sm:flex-row gap-2 relative">
                  <button 
                    ref={upgradeButtonRef}
                    onClick={handleConfirm}
                    data-sfx="button_click"
                    className="px-4 py-2 bg-skyrim-gold text-skyrim-dark rounded font-bold hover:bg-yellow-500 transition-all active:scale-95"
                  >
                    Confirm Upgrade
                  </button>
                  <button onClick={onClose} data-sfx="button_click" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-all">Cancel</button>
                </div>
                {/* Spark particles for upgrade effect */}
                <SparkParticles active={showSparks} buttonRef={upgradeButtonRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

export default BlacksmithModal;
