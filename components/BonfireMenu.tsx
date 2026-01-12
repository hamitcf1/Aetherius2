import React, { useState, useMemo } from 'react';
import { X, Moon, TreePine, Tent, Home, Clock, Coins } from 'lucide-react';
import { InventoryItem, EquipmentSlot, Character } from '../types';
import { EquipmentHUD, getDefaultSlotForItem } from './EquipmentHUD';
import type { RestOptions } from './SurvivalModals';
import { useAppContext } from '../AppContext';
import { PERK_DEFINITIONS, PerkDef } from '../data/perkDefinitions';
import ModalWrapper from './ModalWrapper';

interface BonfireMenuProps {
  open: boolean;
  onClose: () => void;
  onConfirmRest: (options: RestOptions) => void;
  onApplyChanges: (changedItems: InventoryItem[]) => void;
  inventory: InventoryItem[];
  gold: number;
  hasCampingGear: boolean;
  hasBedroll: boolean;
  previewOptions?: RestOptions | null;
  characterId?: string | null; // optional for per-character loadouts
  character?: any | null; // optional character object for Perk modal
  onApplyPerks?: (perkIds: string[]) => void;
}

export const BonfireMenu: React.FC<BonfireMenuProps> = ({ open, onClose, onConfirmRest, onApplyChanges, inventory, gold, hasCampingGear, hasBedroll, previewOptions, characterId, character, onApplyPerks }) => {
  const [localInventory, setLocalInventory] = useState<InventoryItem[]>(() => inventory.map(i => ({ ...i })));
  const [restType, setRestType] = useState<RestOptions['type']>(previewOptions?.type ?? 'outside');
  const [hours, setHours] = useState<number>(previewOptions?.hours ?? 8);

  React.useEffect(() => {
    if (!open) return;
    setLocalInventory(inventory.map(i => ({ ...i })));
    setRestType(previewOptions?.type ?? 'outside');
    setHours(previewOptions?.hours ?? 8);
  }, [open, inventory, previewOptions]);

  const restQuality = useMemo(() => {
    if (restType === 'inn') return { label: 'Well Rested', fatigueReduction: 50, desc: 'A warm bed at the inn. Full rest.' };
    if (restType === 'camp') {
      if (hasCampingGear) return { label: 'Rested', fatigueReduction: 40, desc: 'Your tent provides good shelter.' };
      if (hasBedroll) return { label: 'Somewhat Rested', fatigueReduction: 30, desc: 'Bedroll offers basic comfort.' };
    }
    return { label: 'Poorly Rested', fatigueReduction: 15, desc: 'Sleeping on the ground. Uncomfortable.' };
  }, [restType, hasCampingGear, hasBedroll]);

  const [slotPicker, setSlotPicker] = useState<EquipmentSlot | null>(null);

  const equipItem = (item: InventoryItem, slot?: EquipmentSlot) => {
    setLocalInventory(prev => prev.map(it => {
      if (it.id === item.id) return { ...it, equipped: true, slot };
      if (it.equipped && it.slot === slot && it.id !== item.id) return { ...it, equipped: false, slot: undefined };
      return it;
    }));
    setSlotPicker(null);
  };

  const unequipItem = (item: InventoryItem) => {
    setLocalInventory(prev => prev.map(it => it.id === item.id ? { ...it, equipped: false, slot: undefined } : it));
  };

  const getCandidatesForSlot = (slot: EquipmentSlot) => {
    return localInventory.filter(it => (it.type === 'weapon' || it.type === 'apparel') && (getDefaultSlotForItem(it) === slot || it.slot === slot));
  };

  const changedItems = useMemo(() => {
    const originalById = new Map<string, InventoryItem>(inventory.map(i => [i.id, i]));
    return localInventory.filter(it => {
      const orig = originalById.get(it.id);
      if (!orig) return true;
      return (orig.equipped !== it.equipped) || (orig.slot !== it.slot);
    });
  }, [inventory, localInventory]);

  // Loadout storage helpers (per-character, stored in localStorage)
  const loadoutKey = (name?: string) => `aetherius:bonfire:loadouts:${characterId || 'global'}`;

  const getSavedLoadouts = (): Array<{ name: string; mapping: Record<string, { slot?: EquipmentSlot }>}> => {
    try { return JSON.parse(localStorage.getItem(loadoutKey()) || '[]'); } catch (e) { return []; }
  };

  const saveLoadout = (name: string) => {
    const mapping: Record<string, { slot?: EquipmentSlot }> = {};
    localInventory.forEach(it => { if (it.equipped) mapping[it.id] = { slot: it.slot }; });
    const list = getSavedLoadouts();
    list.push({ name, mapping });
    localStorage.setItem(loadoutKey(), JSON.stringify(list));
    showSimpleToast('Loadout saved.');
  };

  const applyLoadout = (idx: number) => {
    const list = getSavedLoadouts();
    const picked = list[idx];
    if (!picked) return;
    const m = picked.mapping;
    setLocalInventory(prev => prev.map(it => ({ ...it, equipped: !!m[it.id], slot: m[it.id]?.slot })));
    showSimpleToast(`Applied loadout: ${picked.name}`);
  };

  const [confirmDelete, setConfirmDelete] = useState<{ idx: number; name: string } | null>(null);

  const removeLoadout = (idx: number) => {
    const list = getSavedLoadouts();
    const picked = list[idx];
    if (!picked) return;
    // open confirm modal
    setConfirmDelete({ idx, name: picked.name });
  };

  const doRemoveLoadout = (idx: number) => {
    const list = getSavedLoadouts();
    list.splice(idx, 1);
    localStorage.setItem(loadoutKey(), JSON.stringify(list));
    showSimpleToast('Loadout removed.');
    setConfirmDelete(null);
  };

  const applyChanges = () => {
    if (changedItems.length === 0) return;
    onApplyChanges(changedItems);
  };

  const visibleLoadouts = useMemo(() => getSavedLoadouts(), [open, characterId, localInventory]);

  const confirmRest = () => {
    applyChanges();
    const options: RestOptions = { type: restType, hours, innCost: restType === 'inn' ? 10 : undefined };
    onConfirmRest(options);
    onClose();
  };

  // Small helper to show a toast using AppContext where available
  const appCtx = useAppContext();
  const showSimpleToast = (msg: string) => {
    try {
      appCtx?.showToast?.(msg, 'success');
    } catch (e) {
      try { (window as any).app?.showToast?.(msg, 'success'); } catch (e) { /* ignore */ }
    }
  };

  // Perk planner inline state (in-Bonfire)
  const [perkPanelOpen, setPerkPanelOpen] = useState(false);
  const [stagedMap, setStagedMap] = useState<Record<string, number>>({});
  const [stagedMaster, setStagedMaster] = useState<Record<string, boolean>>({});


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-skyrim-dark/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-4xl md:max-w-3xl lg:max-w-4xl h-[min(95vh,calc(100vh-2rem))] overflow-auto bg-skyrim-paper border border-skyrim-gold rounded-lg shadow-2xl">
        <div className="p-4 border-b border-skyrim-border flex items-center justify-between bg-skyrim-dark/50">
          <div className="flex items-center gap-3">
            <Moon className="text-skyrim-gold" size={20} />
            <h2 className="text-lg font-serif text-skyrim-gold">Bonfire</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-skyrim-text">Gold: {gold}g</div>
            <button onClick={onClose} className="p-2 hover:bg-skyrim-paper/40 rounded">
              <X size={18} className="text-skyrim-text hover:text-white" />
            </button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Prepare - Equipment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-100">Prepare</h3>
              <div className="text-xs text-skyrim-text">Staged changes are local until applied</div>
            </div>
            <div className="p-3 bg-skyrim-paper/20 border border-skyrim-border rounded">
              <EquipmentHUD items={localInventory} onUnequip={unequipItem} onEquipFromSlot={(slot) => setSlotPicker(slot)} />
            </div>

            {/* Slot picker: show candidates to equip for a selected slot */}
            {slotPicker && (
              <div className="mt-2 p-2 border border-skyrim-border rounded bg-skyrim-paper/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm">Equip to: <span className="font-bold">{slotPicker}</span></div>
                  <button onClick={() => setSlotPicker(null)} className="text-xs text-skyrim-text hover:text-white">Cancel</button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {getCandidatesForSlot(slotPicker).length === 0 ? (
                    <div className="text-xs text-gray-500">No equippable items for this slot.</div>
                  ) : (
                    getCandidatesForSlot(slotPicker).map(it => (
                      <div key={it.id} className="flex items-center justify-between p-2 bg-skyrim-paper/30 border border-skyrim-border rounded">
                        <div>
                          <div className="text-sm text-skyrim-text">{it.name}</div>
                          <div className="text-xs text-skyrim-text">x{it.quantity}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => equipItem(it, slotPicker)} className="px-2 py-1 text-xs bg-skyrim-gold text-skyrim-dark rounded">Equip</button>
                          {it.equipped && <button onClick={() => unequipItem(it)} className="px-2 py-1 text-xs bg-gray-700 text-white rounded">Unequip</button>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

        {/* Consumables list */}
        <div className="mt-3 p-2 bg-skyrim-paper/10 border border-skyrim-border rounded">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-skyrim-text">Consumables</div>
            <div className="text-xs text-skyrim-text">Use items to heal or buff before resting</div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {localInventory.filter(i => (i.type === 'food' || i.type === 'potion' || i.type === 'drink') && (i.quantity || 0) > 0).length === 0 ? (
              <div className="text-xs text-skyrim-text">No consumables available.</div>
            ) : (
              localInventory.filter(i => (i.type === 'food' || i.type === 'potion' || i.type === 'drink') && (i.quantity || 0) > 0).map(it => (
                <div key={it.id} className="flex items-center justify-between p-2 bg-skyrim-paper/30 border border-skyrim-border rounded">
                  <div>
                    <div className="text-sm text-gray-200">{it.name}</div>
                    <div className="text-xs text-gray-500">x{it.quantity}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { if (it.type === 'food') { appCtx?.handleEatItem?.(it); setLocalInventory(prev => prev.map(p => p.id === it.id ? { ...p, quantity: (p.quantity || 1) - 1 } : p)); } else if (it.type === 'drink') { appCtx?.handleDrinkItem?.(it); setLocalInventory(prev => prev.map(p => p.id === it.id ? { ...p, quantity: (p.quantity || 1) - 1 } : p)); } else { appCtx?.handleUseItem?.(it); setLocalInventory(prev => prev.map(p => p.id === it.id ? { ...p, quantity: (p.quantity || 1) - 1 } : p)); } }} className="px-2 py-1 text-xs bg-green-700 text-white rounded">Use</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Loadouts */}
        <div className="mt-3 p-2 bg-skyrim-paper/10 border border-skyrim-border rounded">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-skyrim-text">Loadouts</div>
            <div className="flex items-center gap-2">
              <input id="loadoutName" placeholder="Name" className="text-xs p-1 rounded bg-skyrim-paper/30 border border-skyrim-border text-skyrim-text" />
              <button onClick={() => { const el = document.getElementById('loadoutName') as HTMLInputElement|null; if (el && el.value.trim()) saveLoadout(el.value.trim()); }} className="px-2 py-1 text-xs bg-green-700 text-white rounded">Save</button>
            </div>
          </div>
          <div className="space-y-2 max-h-36 overflow-y-auto">
            {visibleLoadouts.length === 0 ? <div className="text-xs text-gray-500">No saved loadouts</div> : visibleLoadouts.map((l, idx) => (
              <div key={l.name} className="flex items-center justify-between p-1 bg-skyrim-paper/30 border border-skyrim-border rounded">
                <div className="text-xs text-gray-200">{l.name}</div>
                <div className="flex gap-2">
                  <button onClick={() => applyLoadout(idx)} className="px-2 py-1 text-xs bg-skyrim-gold text-skyrim-dark rounded">Apply</button>
                  <button onClick={() => removeLoadout(idx)} className="px-2 py-1 text-xs bg-red-700 text-white rounded">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
          </div>

          {/* Right: Rest Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-100">Rest</h3>
              <div className="text-xs text-skyrim-text">{restQuality.label}</div>
            </div>

            <div className="p-3 bg-skyrim-paper/20 border border-skyrim-border rounded space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setRestType('outside')} className={`p-2 rounded border ${restType === 'outside' ? 'bg-skyrim-gold/20 border-skyrim-gold text-skyrim-gold' : 'bg-skyrim-paper/30 border-skyrim-border text-skyrim-text'}`}>
                  <TreePine size={16} />
                  <div className="text-[10px] mt-1">Outside</div>
                </button>
                <button onClick={() => setRestType('camp')} className={`p-2 rounded border ${restType === 'camp' ? 'bg-skyrim-gold/20 border-skyrim-gold text-skyrim-gold' : 'bg-skyrim-paper/30 border-skyrim-border text-skyrim-text'}`}>
                  <Tent size={16} />
                  <div className="text-[10px] mt-1">Camp</div>
                </button>
                <button onClick={() => setRestType('inn')} className={`p-2 rounded border ${restType === 'inn' ? 'bg-skyrim-gold/20 border-skyrim-gold text-skyrim-gold' : 'bg-skyrim-paper/30 border-skyrim-border text-skyrim-text'}`}>
                  <Home size={16} />
                  <div className="text-[10px] mt-1">Inn</div>
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-gray-300 mb-1"><span>Duration</span><span className="flex items-center gap-1"><Clock size={12} /> {hours}h</span></div>
                <input type="range" min={1} max={12} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full" />
                <div className="flex justify-between text-xs text-gray-500 mt-1"><span>1h</span><span>6h</span><span>12h</span></div>
              </div>

              <div className="p-2 bg-skyrim-paper/40 rounded text-sm text-skyrim-text">{restQuality.desc}</div>
            </div>

            <div className="flex gap-2">
              <button onClick={confirmRest} className="flex-1 px-4 py-3 bg-green-700 text-white rounded font-bold">Confirm Rest</button>
              <button onClick={() => setPerkPanelOpen(v => !v)} className="px-4 py-3 bg-blue-700 text-white rounded">Perk Planner</button>
              <button onClick={() => { onClose(); }} className="px-4 py-3 bg-gray-700 text-white rounded">Cancel</button>
            </div>

            <div className="text-xs text-skyrim-text">Note: your pre-rest changes are reversible until you click Apply Changes or Confirm Rest.</div>

            {/* Inline Perk Planner Panel */}
            {perkPanelOpen && (
              <div className="mt-4 p-3 bg-skyrim-paper/20 border border-skyrim-border rounded">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-skyrim-text">Perk Planner</div>
                  <div className="text-xs text-skyrim-text">Available: <span className="text-skyrim-gold font-bold">{character?.perkPoints || 0}</span></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PERK_DEFINITIONS.slice(0, 8).map(def => {
                    const curr = (character?.perks || []).find((p: any) => p.id === def.id)?.rank || 0;
                    const max = def.maxRank || 1;
                    const stagedCountFor = stagedMap[def.id] || 0;
                    const availablePoints = (character?.perkPoints || 0);
                    const stagedCountTotal = (Object.values(stagedMap) as number[]).reduce((s: number, v: number) => s + (v || 0), 0);
                    const remaining = Math.max(0, availablePoints - stagedCountTotal);
                    const canStage = remaining > 0 && (curr + stagedCountFor) < max;
                    return (
                      <div key={def.id} className={`p-2 rounded border ${stagedCountFor > 0 ? 'ring-2 ring-skyrim-gold/30' : 'border-skyrim-border'} bg-skyrim-paper/30`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold">{def.name}</div>
                            <div className="text-xs text-skyrim-text">Rank: {curr + stagedCountFor}/{max}</div>
                          </div>
                          <div className="flex gap-2">
                            <button disabled={!canStage} onClick={() => setStagedMap(m => ({ ...m, [def.id]: (m[def.id] || 0) + 1 }))} className={`px-2 py-1 text-xs rounded ${canStage ? 'bg-skyrim-gold' : 'bg-skyrim-paper/20 text-skyrim-text'}`}>+1</button>
                            <button disabled={!stagedCountFor} onClick={() => setStagedMap(m => { const next = { ...m }; next[def.id] = Math.max(0, (next[def.id]||0)-1); if (next[def.id]===0) delete next[def.id]; return next; })} className={`px-2 py-1 text-xs rounded ${stagedCountFor ? 'bg-gray-700 text-white' : 'bg-skyrim-paper/20 text-skyrim-text'}`}>-</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-skyrim-text">Staged: <span className="font-bold text-skyrim-gold">{(Object.values(stagedMap) as number[]).reduce((s:number,v:number)=>s+(v||0),0)}</span></div>
                  <div className="flex gap-2">
                    <button onClick={() => { setStagedMap({}); setStagedMaster({}); setPerkPanelOpen(false); }} className="px-3 py-1 rounded border border-skyrim-border">Cancel</button>
                    <button onClick={() => {
                      // expand staged map
                      const expanded: string[] = [];
                      for (const k of Object.keys(stagedMap)) {
                        const count = stagedMap[k] || 0;
                        for (let i = 0; i < count; i++) expanded.push(k);
                      }
                      for (const k of Object.keys(stagedMaster)) if (stagedMaster[k]) expanded.push(`${k}::MASTER`);
                      if (onApplyPerks) onApplyPerks(expanded);
                      setStagedMap({}); setStagedMaster({}); setPerkPanelOpen(false);
                      showSimpleToast('Perks applied.');
                    }} className="px-3 py-1 rounded bg-skyrim-gold">Confirm</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BonfireMenu;
