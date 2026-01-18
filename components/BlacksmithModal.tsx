import React, { useMemo, useState, useEffect, useRef } from 'react';
import ModalWrapper from './ModalWrapper';
import { InventoryItem } from '../types';
import type { ShopItem } from './ShopModal';
import upgradeSvc, { countMaterialInInventory, getUpgradeCost, canUpgrade, previewUpgradeStats, getMaxUpgradeForItem, getRequiredPlayerLevelForNextUpgrade, getRequirementsForNextUpgrade, getItemBaseAndBonus } from '../services/upgradeService';
import { Sword, Shield, Coins, Check } from 'lucide-react';
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
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
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
  const inventoryRequirementsMet = !nextUpgradeRequirements || nextUpgradeRequirements.every(r => countMaterialInInventory(items, r.itemId) >= (r.quantity || 1));

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

    // Check material requirements in inventory.
    if (!upgradeSvc.canUpgrade(selected, { inventory: items })) {
      const reqs = getRequirementsForNextUpgrade(selected);
      if (reqs && reqs.length > 0) {
        showToast?.('You are missing required materials for this upgrade', 'warning');
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

    // Deduct materials if requirements are met
    const reqs = getRequirementsForNextUpgrade(selected);
    const removedMaterials: { name: string; quantity: number }[] = [];
    if (reqs && reqs.length > 0) {
       reqs.forEach(r => {
           // Find matching item to get name strictly (prioritize ID match, then filename slug match)
           const match = items.find(i => i.id === r.itemId) || 
                         items.find(i => (i.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_') === r.itemId);
           if (match) {
               removedMaterials.push({ name: match.name, quantity: r.quantity || 1 });
           }
       });
    }

    // Start spark + sounds and lock input until visual completes
    startSpark();

    // Helper to update local items (mirroring App behavior)
    const updateLocalItems = (prev: InventoryItem[], removed: typeof removedMaterials) => {
        const next = [...prev];
        removed.forEach(rm => {
             const idx = next.findIndex(it => (it.name || '').trim().toLowerCase() === rm.name.toLowerCase());
             if (idx >= 0) {
                 const exist = next[idx];
                 const nextQ = (exist.quantity || 1) - rm.quantity;
                 if (nextQ <= 0) next.splice(idx, 1);
                 else next[idx] = { ...exist, quantity: nextQ };
             }
        });
        return next;
    };

    // Handle stack splitting: if the selected item is part of a stack (quantity > 1), we should
    // decrement the original stack and create a unique upgraded copy instead of upgrading the whole stack.
    if ((selected.quantity || 0) > 1) {
      const newId = `item_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      const upgradedSingle = { ...updated, id: newId, quantity: 1 } as InventoryItem;
      const originalReduced = { ...selected, quantity: (selected.quantity || 1) - 1 } as InventoryItem;

      // Persist. Note: we treat originalReduced as 'updated' (quantity changed) and new upgraded as 'new'
      setGold(gold - cost);
      
      (window as any).app?.handleGameUpdate?.({ 
          updatedItems: [originalReduced], 
          newItems: [{ ...upgradedSingle, __forceCreate: true }],
          removedItems: removedMaterials
      });

      // Local update
      setItems(prev => {
          // Reflect stack split
          const afterSplit = prev.map(i => i.id === selected.id ? originalReduced : i);
          // Add new item
          afterSplit.push(upgradedSingle);
          // Remove materials
          return updateLocalItems(afterSplit, removedMaterials);
      });

      showToast?.('Upgraded one item from the stack', 'success');
      return;
    }

    // Deduct gold and update single item
    setGold(gold - cost);
    
    // Persist
    (window as any).app?.handleGameUpdate?.({ 
        updatedItems: [updated],
        removedItems: removedMaterials
    });

    // Local update
    setItems(prev => {
        const next = prev.map(i => i.id === updated.id ? { ...updated } : i);
        return updateLocalItems(next, removedMaterials);
    });
    
    showToast?.('Upgrade successful', 'success');
  };

  return (
    <ModalWrapper open={open} onClose={onClose} zIndex="z-[80]">
      <div className="bg-skyrim-paper border-2 border-skyrim-border rounded-lg p-0 w-full max-w-7xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-6 pb-4 border-b border-skyrim-border/30 bg-skyrim-paper relative z-10">
          <h2 className="text-2xl font-serif text-skyrim-gold">Blacksmith</h2>
          <div className="flex items-center gap-2 text-sm text-skyrim-text">
            <Coins /> <span className="font-serif text-yellow-400">{gold}</span>
          </div>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden">
          {/* Left Column: Item List */}
          <div className="md:col-span-4 lg:col-span-3 border-r border-skyrim-border/30 flex flex-col h-full bg-skyrim-dark/10">
            <div className="p-4 flex-shrink-0">
               <h3 className="text-sm text-skyrim-text mb-3 uppercase tracking-widest opacity-80 decoration-skyrim-gold underline underline-offset-4 decoration-2">Eligible Items</h3>
               {/* Category filter */}
               <div className="flex gap-1 text-xs bg-black/20 p-1 rounded-lg">
                  {(['all', 'weapons', 'armor'] as const).map(cat => (
                    <button 
                      key={cat}
                      data-testid={`filter-${cat}`}
                      onClick={() => setFilterCategory(cat)} 
                      className={`flex-1 py-1.5 rounded font-bold transition-all capitalize ${filterCategory === cat ? 'bg-skyrim-gold text-skyrim-dark shadow-sm' : 'text-skyrim-text hover:bg-white/5'}`}
                    >
                      {cat}
                    </button>
                  ))}
               </div>
            </div>

            <div dir="rtl" className="flex-1 overflow-y-auto overflow-x-hidden p-4 pt-0 custom-scrollbar" style={{ scrollbarGutter: 'stable' }}>
              <div dir="ltr" className="space-y-2 pb-4">
              {/* Reserved gutter + RTL places the scrollbar on the LEFT; inner children preserve normal LTR layout */}
              {eligibleSorted.map((it) => {
                return (
                  <button
                    aria-pressed={selectedId === it.id}
                    key={it.id}
                    onClick={() => setSelectedId(it.id)}
                    className={`w-full text-left p-3 rounded border transition-all relative z-0 group ${selectedId === it.id ? 'border-skyrim-gold bg-skyrim-gold/10 ring-1 ring-skyrim-gold/30' : 'border-skyrim-border/50 bg-skyrim-paper/40 hover:border-skyrim-gold/40 hover:bg-skyrim-paper/60'}`}
                  >
                    <div className="flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`p-2 rounded bg-black/30 text-skyrim-gold flex-shrink-0 transition-transform ${selectedId === it.id ? 'scale-110' : 'group-hover:scale-105'}`}>
                          {it.type === 'weapon' ? <Sword size={18} /> : <Shield size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`font-serif truncate text-sm md:text-base transition-colors ${selectedId === it.id ? 'text-skyrim-gold' : 'text-gray-300 group-hover:text-skyrim-gold'}`}>{it.name}</div>
                            {(it as any).rarity ? <span className="ml-2"><RarityBadge rarity={String((it as any).rarity)} /></span> : null}
                          </div>
                          <div className="text-xs text-stone-500 truncate flex items-center justify-between mt-0.5">
                              <span>Lvl {it.upgradeLevel || 0} / {getMaxUpgradeForItem(it)}</span>
                              <div className="flex flex-col items-end gap-1">
                                {(it as any).rarity ? <span className="text-[10px] uppercase tracking-wider text-stone-400">{String((it as any).rarity)}</span> : null}
                                {selectedId === it.id && <span className="text-[10px] text-yellow-500/80 uppercase tracking-wider font-bold">Selected</span>}
                              </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {eligibleSorted.length === 0 && (
                <div className="text-gray-500 italic p-4 text-center text-sm border border-dashed border-skyrim-border/30 rounded">No upgradable items found.</div>
              )}
              </div>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="md:col-span-8 lg:col-span-9 h-full flex flex-col min-h-0 bg-skyrim-paper/10 relative">
             {/* Background decorative elements could go here */}
             <div className="flex-1 min-h-0 flex flex-col">
                
                {!selected && (
                   <div className="h-full flex flex-col items-center justify-center text-stone-500 opacity-60">
                      <div className="p-6 rounded-full bg-black/10 mb-4">
                        <Coins size={48} strokeWidth={1} />
                      </div>
                      <p className="font-serif text-xl italic">Select an item from the list to begin smithing.</p>
                   </div>
                )}
                
                {selected && (
                  <div className="flex flex-col h-full bg-skyrim-paper/30 backdrop-blur-sm">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                      <div className="max-w-4xl mx-auto">
                        <div className="flex items-start justify-between border-b border-skyrim-border/30 pb-6 mb-6">
                      <div>
                        <h4 className="text-3xl font-serif text-skyrim-gold tracking-wide drop-shadow-sm">{selected.name}</h4>
                        <div className="text-sm text-skyrim-text mt-2 flex items-center gap-3">
                          <span className="bg-black/40 px-2 py-0.5 rounded text-xs uppercase tracking-wider text-stone-400 border border-white/10">{selected.type}</span>
                          {selected.rarity && <RarityBadge rarity={String(selected.rarity)} />}
                        </div>
                      </div>
                      <div className="text-right pl-6">
                        <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-1">Level</div>
                        <div className="text-2xl font-serif text-skyrim-act flex items-baseline justify-end gap-1">
                            <span>{selected.upgradeLevel || 0}</span>
                            <span className="text-base text-gray-600 font-sans font-light">/</span>
                            <span className="text-lg text-gray-500">{getMaxUpgradeForItem(selected)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 items-stretch mb-8">
                      {/* Current Stats */}
                      <div className="bg-black/20 p-5 rounded-lg border border-skyrim-border/20 shadow-inner">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> Current
                        </div>
                        <div className="text-skyrim-gold font-serif text-lg">
{(() => {

                              const b = getItemBaseAndBonus(selected as any);
                              return (
                                <>
                                  {typeof b.totalDamage === 'number' && <div className="flex justify-between items-center"><span className="text-sm font-sans tracking-wide opacity-80">Damage</span> <span className="text-xl">{b.totalDamage}{b.bonusDamage ? <span className="text-sm text-gray-400 ml-1">({b.baseDamage}+{b.bonusDamage})</span> : ''}</span></div>}
                                  {typeof b.totalArmor === 'number' && <div className="flex justify-between items-center"><span className="text-sm font-sans tracking-wide opacity-80">Armor</span> <span className="text-xl">{b.totalArmor}{b.bonusArmor ? <span className="text-sm text-gray-400 ml-1">({b.baseArmor}+{b.bonusArmor})</span> : ''}</span></div>}
                                </>
                              );
                            })()}
                        </div>
                      </div>

                      {/* Preview Stats */}
                      <div className="bg-skyrim-gold/5 p-5 rounded-lg border border-skyrim-gold/20 relative overflow-hidden shadow-inner">
                        <div className="absolute top-0 left-0 w-1 h-full bg-skyrim-gold/50"></div>
                        <div className="text-[10px] uppercase tracking-widest text-yellow-500/80 mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> After Upgrade
                        </div>
                        <div className="text-skyrim-gold font-serif text-lg">
                          {(() => {
                            const preview = previewUpgradeStats(selected);
                            const b = getItemBaseAndBonus(selected as any);
                            const previewDamage = typeof preview.damage === 'number' ? preview.damage : undefined;
                            const previewArmor = typeof preview.armor === 'number' ? preview.armor : undefined;
                            return (
                              <>
                                {typeof previewDamage === 'number' && <div className="flex justify-between items-center"><span className="text-sm font-sans tracking-wide opacity-80">Damage</span> <span className="text-xl">{previewDamage}{(b.baseDamage && previewDamage - (b.baseDamage || 0)) ? <span className="text-sm text-green-400/90 ml-1 font-bold">({b.baseDamage}+{previewDamage - (b.baseDamage || 0)})</span> : ''}</span></div>}
                                {typeof previewArmor === 'number' && <div className="flex justify-between items-center"><span className="text-sm font-sans tracking-wide opacity-80">Armor</span> <span className="text-xl">{previewArmor}{(b.baseArmor && previewArmor - (b.baseArmor || 0)) ? <span className="text-sm text-green-400/90 ml-1 font-bold">({b.baseArmor}+{previewArmor - (b.baseArmor || 0)})</span> : ''}</span></div>}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto space-y-6 flex-shrink-0">
                      {/* Cost */}
                      <div className="flex items-center gap-4">
                         <div className="px-5 py-3 bg-black/30 rounded border border-skyrim-border/30 bg-gradient-to-r from-black/20 to-transparent">
                            <div className="text-[10px] uppercase tracking-widest text-gray-400">Upgrade Cost</div>
                            <div className="text-yellow-400 font-serif text-2xl flex items-baseline gap-1 mt-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                               {getUpgradeCost(selected)} <span className="text-sm font-sans text-yellow-500/80">gold</span>
                            </div>
                         </div>
                         
                         {/* Level Requirement Check */}
                          {(() => {
                            const req = getRequiredPlayerLevelForNextUpgrade(selected);
                            if (req > 0) {
                              const ok = (characterLevel || 0) >= req;
                              return (
                                <div className={`text-xs px-4 py-2.5 rounded border flex items-center gap-2 shadow-sm ${ok ? 'bg-green-900/10 border-green-800 text-green-400' : 'bg-red-900/10 border-red-800 text-red-300'}`}>
                                  {ok ? <Check size={14} /> : <span className="text-[10px] font-bold">✕</span>} Requires Level {req}
                                </div>
                              );
                            }
                            return null;
                          })()}
                      </div>

                      {/* Material Requirements */}
                      {nextUpgradeRequirements && nextUpgradeRequirements.length > 0 && (
                        <div className="bg-black/20 p-5 rounded border border-skyrim-border/20">
                          <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-3 ml-1">Required Materials</div>
                          <div className="max-h-44 overflow-y-auto custom-scrollbar pr-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {nextUpgradeRequirements.map(r => {
                                const ownedQty = countMaterialInInventory(items, r.itemId);
                                const requiredQty = r.quantity || 1;
                                const met = ownedQty >= requiredQty;
                                // Try to find name in inventory first, then shop, then fallback formatting
                                const invMatch = items.find(i => i.id === r.itemId) || items.find(i => (i.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'_') === r.itemId);
                                const shopMatch = (shopItems || []).find(s => s.id === r.itemId);
                                const pretty = invMatch ? invMatch.name : (shopMatch ? shopMatch.name : ((r.itemId || '').replace(/_/g, ' ')).replace(/\b\w/g, ch => ch.toUpperCase()));
                                
                                return (
                                  <div key={r.itemId} className={`flex items-center justify-between p-2 rounded relative overflow-hidden transition-colors ${met ? 'bg-green-900/10 border border-green-900/20' : 'bg-red-900/10 border border-red-900/20'}`}>
                                    {met && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500/50"></div>}
                                    {!met && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500/50"></div>}

                                    <div className={`flex items-center gap-2 pl-2 ${met ? 'text-gray-200' : 'text-red-300'}`}>
                                      <span className="text-sm font-medium">{pretty}</span>
                                    </div>
                                    <span className={`font-mono text-sm tracking-tighter ${met ? 'text-green-400' : 'text-red-400'}`}>
                                      {ownedQty} <span className="text-gray-500 text-xs">/</span> {requiredQty}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          {!inventoryRequirementsMet && (
                            <div className="text-xs mt-3 text-red-300/80 italic text-center flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                                Missing required materials
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 flex-shrink-0 px-6 md:px-8 py-5 border-t border-skyrim-border/30 bg-skyrim-paper/70 backdrop-blur-md flex justify-end gap-4 relative z-40">
                  <button onClick={onClose} data-sfx="button_click" className="px-6 py-2 bg-transparent border border-skyrim-border/60 text-skyrim-text hover:text-white rounded hover:bg-white/5 transition-all font-serif tracking-wide text-sm uppercase">Cancel</button>
                  <button 
                    ref={upgradeButtonRef}
                    onClick={handleConfirm}
                    data-sfx="button_click"
                    disabled={isUpgrading || !inventoryRequirementsMet}
                    className={`px-8 py-2 bg-skyrim-gold text-skyrim-dark rounded font-bold hover:bg-yellow-500 transition-all active:scale-95 font-serif text-lg shadow-lg uppercase tracking-wide flex items-center gap-2 ${(isUpgrading || !inventoryRequirementsMet) ? 'opacity-60 cursor-not-allowed' : ''} disabled:opacity-60`}
                  >
                    <span>Confirm Upgrade</span>
                  </button>
                </div>
                {/* Spark particles for upgrade effect */}
                <SparkParticles active={showSparks} buttonRef={upgradeButtonRef} />
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </ModalWrapper>
  );
}

export default BlacksmithModal;
