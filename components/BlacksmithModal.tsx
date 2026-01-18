import React, { useMemo, useState, useEffect, useRef } from 'react';
import ModalWrapper from './ModalWrapper';
import { InventoryItem } from '../types';
import type { ShopItem } from './ShopModal';
import upgradeSvc, { getUpgradeCost, canUpgrade, previewUpgradeStats, getMaxUpgradeForItem, getRequiredPlayerLevelForNextUpgrade, getRequirementsForNextUpgrade, getItemBaseAndBonus } from '../services/upgradeService';
import { Sword, Shield, Coins } from 'lucide-react';
import RarityBadge from './RarityBadge';
import { useAppContext } from '../AppContext';
import { audioService } from '../services/audioService';

// Spark particle component for blacksmith upgrade effect
export const SparkParticles: React.FC<{ active: boolean; buttonRef: React.RefObject<HTMLButtonElement | null> }> = ({ active, buttonRef }) => {
  const [sparks, setSparks] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; life: number; color: string }>>([]);
  const animationRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Defensive: ensure we always cancel any prior animation before starting new one
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (!active) {
      // Clear any lingering sparks if effect toggles off
      setSparks([]);
      return;
    }

    if (!buttonRef.current) {
      // If the button isn't available yet (edge case with rapid mounts), try again shortly
      const retry = window.setTimeout(() => {
        if (buttonRef.current) {
          // Force a re-run by toggling local state - simplest approach is to setSparks to [] and reapply the effect
          setSparks([]);
        }
        window.clearTimeout(retry);
      }, 30);
      return () => window.clearTimeout(retry);
    }

    try {
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Generate initial sparks with a larger initial spread for more visible scattering
      const seed = Date.now();
      const initialSparks = Array.from({ length: 30 }, (_, i) => ({
        id: seed + i,
        x: centerX,
        y: centerY,
        vx: (Math.random() - 0.5) * 24, // wider horizontal spread
        vy: (Math.random() - 0.5) * 18 - 6, // stronger upward impulse
        life: 1,
        color: Math.random() > 0.3 
          ? `rgba(${255}, ${150 + Math.random() * 100}, ${Math.random() * 50}, 1)` // Orange/red
          : `rgba(${255}, ${200 + Math.random() * 55}, ${100 + Math.random() * 100}, 1)` // Yellow/gold
      }));

      setSparks(initialSparks);

      // Animate sparks using RAF; cancel previous RAF if any
      const animate = () => {
        setSparks(prev => {
          const updated = prev
            .map(s => ({
              ...s,
              x: s.x + s.vx,
              y: s.y + s.vy,
              vy: s.vy + 0.45, // gravity
              life: s.life - 0.03
            }))
            .filter(s => s.life > 0);

          if (updated.length === 0) {
            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current);
              animationRef.current = null;
            }
            return [];
          }

          animationRef.current = requestAnimationFrame(animate);
          return updated;
        });
      };

      animationRef.current = requestAnimationFrame(animate);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('SparkParticles effect error', err);
      setSparks([]);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
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
  // Current shop stock (optional). When provided, certain upgrades will require materials
  // to be present in the shop before the upgrade is allowed.
  shopItems?: ShopItem[];
} 

export function BlacksmithModal({ open, onClose, items, setItems, gold, setGold, shopItems }: Props) {
  const eligible = useMemo(() => items.filter(i => (i.type === 'weapon' || i.type === 'apparel') ), [items]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all'|'weapons'|'armor'>('all');
  const [showSparks, setShowSparks] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const upgradeButtonRef = useRef<HTMLButtonElement | null>(null);
  const sparkTimeoutRef = useRef<number | null>(null);

  // Category-filtered + deterministic sorting to match inventory/shop behavior
  const eligibleSorted = useMemo(() => {
    const base = eligible.filter(i => {
      if (filterCategory === 'weapons') return i.type === 'weapon';
      if (filterCategory === 'armor') return i.type === 'apparel';
      return true;
    });
    return base.sort((a, b) => {
      // Primary: type (weapons first), then upgradeLevel desc, then name
      const typeOrder = (t: string) => (t === 'weapon' ? 0 : 1);
      const td = typeOrder(a.type) - typeOrder(b.type);
      if (td !== 0) return td;
      const ld = (b.upgradeLevel || 0) - (a.upgradeLevel || 0);
      if (ld !== 0) return ld;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [eligible, filterCategory]);

  const selected = useMemo(() => eligible.find(i => i.id === selectedId) ?? null, [eligible, selectedId]);
  const { characterLevel, showToast } = useAppContext();

  // Material requirements for the *next* upgrade (if any) and whether the current
  // shop stock satisfies them. When `shopItems` is not provided we do not block
  // upgrades here (keeps behavior backwards-compatible) but the UI will still
  // surface explicit requirements when present on the item.
  const nextUpgradeRequirements = selected ? getRequirementsForNextUpgrade(selected) : undefined;
  const shopRequirementsMet = !nextUpgradeRequirements || nextUpgradeRequirements.every(r => (shopItems || []).some(si => si.id === r.itemId));

  const startSpark = () => {
    // Clear any existing timeout so repeated starts reset the timer cleanly
    if (sparkTimeoutRef.current) {
      clearTimeout(sparkTimeoutRef.current as any);
      sparkTimeoutRef.current = null;
    }

    // If button not ready, try again shortly (handles race conditions when modal renders)
    if (!upgradeButtonRef.current) {
      const later = window.setTimeout(() => {
        window.clearTimeout(later);
        startSpark();
      }, 30);
      return;
    }

    audioService.playSoundEffect('anvil_hit');
    setTimeout(() => audioService.playSoundEffect('forge_upgrade'), 90);

    setShowSparks(true);
    setIsUpgrading(true);

    sparkTimeoutRef.current = window.setTimeout(() => {
      setShowSparks(false);
      sparkTimeoutRef.current = null;
      setIsUpgrading(false);
    }, 800);
  };

  const handleConfirm = () => {
    if (!selected) return;

    // If an upgrade is already in progress visually, restart the spark and do not re-run the upgrade logic
    if (isUpgrading) {
      startSpark();
      return;
    }

    // Respect shop-material requirements when a shop context is provided.
    if (!upgradeSvc.canUpgrade(selected, { shopItemIds: shopItems?.map(s => s.id) })) {
      const reqs = getRequirementsForNextUpgrade(selected);
      if (reqs && reqs.length > 0 && !(shopItems && shopItems.length > 0)) {
        showToast?.('This upgrade requires specific materials that are not available in the current shop', 'warning');
      } else {
        showToast?.('Item cannot be upgraded further', 'warning');
      }
      return;
    }

    const requiredLevel = getRequiredPlayerLevelForNextUpgrade(selected);
    if (requiredLevel > 0 && (characterLevel || 0) < requiredLevel) {
      showToast?.(`Requires player level ${requiredLevel} to perform this upgrade`, 'warning');
      return;
    }

    const { updated, cost } = upgradeSvc.applyUpgrade(selected);
    if (gold < cost) {
      // Even if the player quickly clicked and didn't have enough gold for a subsequent upgrade,
      // restart the spark to provide consistent feedback that their click was registered visually
      startSpark();
      showToast?.('Insufficient gold for upgrade', 'warning');
      return;
    }

    // Start spark + sounds and lock input until visual completes
    startSpark();

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
      <div className="bg-skyrim-paper border-2 border-skyrim-border rounded-lg p-4 pr-6 sm:p-6 sm:pr-8 w-full max-w-[920px] h-[min(92vh,calc(100vh-2rem))] sm:max-h-[80vh] overflow-auto" style={{ scrollbarGutter: 'stable both-edges' as any }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-serif text-skyrim-gold">Blacksmith</h2>
          <div className="flex items-center gap-2 text-sm text-skyrim-text">
            <Coins /> <span className="font-serif text-yellow-400">{gold}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 md:min-w-[260px] overflow-hidden">
            <h3 className="text-sm text-skyrim-text mb-2">Eligible Items</h3>

            {/* Category filter (mirrors Shop/Inventory UX) */}
            <div className="mb-3 flex gap-2 text-xs">
              <button data-testid="filter-all" onClick={() => setFilterCategory('all')} className={`px-2 py-1 rounded ${filterCategory === 'all' ? 'bg-skyrim-gold/12 border-skyrim-gold' : 'border-skyrim-border'}`}>All</button>
              <button data-testid="filter-weapons" onClick={() => setFilterCategory('weapons')} className={`px-2 py-1 rounded ${filterCategory === 'weapons' ? 'bg-skyrim-gold/12 border-skyrim-gold' : 'border-skyrim-border'}`}>Weapons</button>
              <button data-testid="filter-armor" onClick={() => setFilterCategory('armor')} className={`px-2 py-1 rounded ${filterCategory === 'armor' ? 'bg-skyrim-gold/12 border-skyrim-gold' : 'border-skyrim-border'}`}>Armor</button>
            </div>

            <div dir="rtl" className="custom-scrollbar space-y-2 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-10" style={{ scrollbarGutter: 'stable both-edges' as any }}>
              {/* Reserved gutter + RTL places the scrollbar on the LEFT; inner children preserve normal LTR layout */}
              {eligibleSorted.map((it) => {
                return (
                  <button
                    dir="ltr"
                    aria-pressed={selectedId === it.id}
                    key={it.id}
                    onClick={() => setSelectedId(it.id)}
                    className={`w-full text-left p-3 rounded border transition-all relative z-0 ${selectedId === it.id ? 'border-skyrim-gold bg-skyrim-gold/12 ring-2 ring-skyrim-gold/30 shadow-[0_8px_30px_rgba(0,0,0,0.45)]' : 'border-skyrim-border hover:border-skyrim-gold/40'}`}
                  >
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-2 rounded bg-skyrim-paper/40 text-skyrim-gold ${selectedId === it.id ? 'scale-102' : ''}`}>
                          {it.type === 'weapon' ? <Sword size={16} /> : <Shield size={16} />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-skyrim-gold font-serif truncate text-sm md:text-base">{it.name}</div>
                          <div className="text-xs text-skyrim-text truncate">Lvl {it.upgradeLevel || 0} / {getMaxUpgradeForItem(it)}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-300 flex items-center gap-2 justify-end">
                        {selectedId === it.id && <div className="ml-2 text-xs text-yellow-300 font-semibold z-0">Selected</div>}
                      </div>
                    </div>
                  </button>
                );
              })}

              {eligibleSorted.length === 0 && (
                <div className="text-gray-500 italic">No weapons or armor available.</div>
              )}
            </div>

          <div className="md:col-span-3 relative z-30">
            <h3 className="text-sm text-skyrim-text mb-2">Details</h3>
            {!selected && <div className="text-gray-500 italic">Select an item to view upgrade options.</div>}
            {selected && (
              <div className="bg-skyrim-paper/30 p-3 sm:p-4 rounded border border-skyrim-border pl-2">
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
{(() => {

                              const b = getItemBaseAndBonus(selected as any);
                              return (
                                <>
                                  {typeof b.totalDamage === 'number' && <div>Damage: {b.totalDamage}{b.bonusDamage ? ` (${b.baseDamage} + ${b.bonusDamage})` : ''}</div>}
                                  {typeof b.totalArmor === 'number' && <div>Armor: {b.totalArmor}{b.bonusArmor ? ` (${b.baseArmor} + ${b.bonusArmor})` : ''}</div>}
                                </>
                              );
                            })()}
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-xs text-gray-300">After Upgrade</div>
                        <div className="mt-1 text-skyrim-gold font-serif">
                          {(() => {
                            const preview = previewUpgradeStats(selected);
                            const b = getItemBaseAndBonus(selected as any);
                            const previewDamage = typeof preview.damage === 'number' ? preview.damage : undefined;
                            const previewArmor = typeof preview.armor === 'number' ? preview.armor : undefined;
                            return (
                              <>
                                {typeof previewDamage === 'number' && <div>Damage: {previewDamage}{(b.baseDamage && previewDamage - (b.baseDamage || 0)) ? ` (${b.baseDamage} + ${previewDamage - (b.baseDamage || 0)})` : ''}</div>}
                                {typeof previewArmor === 'number' && <div>Armor: {previewArmor}{(b.baseArmor && previewArmor - (b.baseArmor || 0)) ? ` (${b.baseArmor} + ${previewArmor - (b.baseArmor || 0)})` : ''}</div>}
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

                      {nextUpgradeRequirements && nextUpgradeRequirements.length > 0 && (
                        <div className="mt-3 text-xs">
                          <div className="text-gray-300">Material requirements</div>
                          <ul className="mt-1 space-y-1">
                            {nextUpgradeRequirements.map(r => {
                              const present = (shopItems || []).some(s => s.id === r.itemId);
                              const shopMatch = (shopItems || []).find(s => s.id === r.itemId);
                              const pretty = shopMatch ? shopMatch.name : ((r.itemId || '').replace(/_/g, ' ')).replace(/\b\w/g, ch => ch.toUpperCase());
                              return (
                                <li key={r.itemId} className={`flex items-center gap-2 ${present ? 'text-green-400' : 'text-red-400'}`}>
                                  <span className="font-mono text-[13px]">{r.quantity ?? 1}×</span>
                                  <span className="truncate">{pretty}</span>
                                  <span className="ml-2 text-xs text-gray-400">{present ? 'available in shop' : 'not available in shop'}</span>
                                </li>
                              );
                            })}
                          </ul>
                          {!shopRequirementsMet && (
                            <div className="text-xs mt-2 text-red-400">Upgrade requires materials to be present in the shop</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2 relative">
                  <button 
                    ref={upgradeButtonRef}
                    onClick={handleConfirm}
                    data-sfx="button_click"
                    disabled={isUpgrading || !shopRequirementsMet}
                    className={`px-4 py-2 bg-skyrim-gold text-skyrim-dark rounded font-bold hover:bg-yellow-500 transition-all active:scale-95 ${(isUpgrading || !shopRequirementsMet) ? 'opacity-60 cursor-not-allowed' : ''}`}
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
