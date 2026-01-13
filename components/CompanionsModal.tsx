import React, { useState } from 'react';
import ModalWrapper from './ModalWrapper';
import { Companion, InventoryItem, EquipmentSlot } from '../types';
import { Plus, Trash2, X } from 'lucide-react';
import { SortSelector, DropdownSelector } from './GameFeatures';
import { EquipmentHUD, getDefaultSlotForItem } from './EquipmentHUD';

const RACE_OPTIONS = [
  { id: 'Nord', label: 'Nord' },
  { id: 'Imperial', label: 'Imperial' },
  { id: 'Breton', label: 'Breton' },
  { id: 'Redguard', label: 'Redguard' },
  { id: 'High Elf', label: 'High Elf' },
  { id: 'Dark Elf', label: 'Dark Elf' },
  { id: 'Wood Elf', label: 'Wood Elf' },
  { id: 'Orc', label: 'Orc' },
  { id: 'Khajiit', label: 'Khajiit' },
  { id: 'Argonian', label: 'Argonian' }
];

interface Props {
  open: boolean;
  onClose: () => void;
  companions: Companion[];
  onAdd: (c: Companion) => void;
  onUpdate: (c: Companion) => void;
  onRemove: (id: string) => void;
  onTalk?: (c: Companion) => void;
  // Inventory & equipment handlers
  inventory?: InventoryItem[];
  onAssignItemToCompanion?: (companionId: string, itemId: string, slot?: EquipmentSlot) => void;
  onUnassignItemFromCompanion?: (itemId: string) => void;
}

export const CompanionsModal: React.FC<Props> = ({ open, onClose, companions, onAdd, onUpdate, onRemove, onTalk, inventory = [], onAssignItemToCompanion, onUnassignItemFromCompanion }) => {
  const [name, setName] = useState('');
  const [race, setRace] = useState('Nord');
  const [level, setLevel] = useState(1);
  const [cost, setCost] = useState<number | ''>('');
  const [behavior, setBehavior] = useState<'idle'|'follow'|'guard'>('idle');
  const [autoLoot, setAutoLoot] = useState(false);
  const [sort, setSort] = useState<string>('name:asc');

  const [selectedEquipCompanion, setSelectedEquipCompanion] = useState<Companion | null>(null);
  const [equipSlotPicker, setEquipSlotPicker] = useState<EquipmentSlot | null>(null);

  const handleAdd = () => {
    if (!name.trim()) return;
    const lvl = Math.max(1, Number(level) || 1);
    const c: Companion = {
      id: Math.random().toString(36).substr(2,9),
      name: name.trim(),
      race,
      class: 'Follower',
      level: lvl,
      health: 50 + (lvl-1)*10,
      maxHealth: 50 + (lvl-1)*10,
      damage: 6 + Math.floor(lvl/2),
      armor: 5 + Math.floor(lvl/4),
      personality: 'Loyal',
      recruitedAt: Date.now(),
      loyalty: 50,
      mood: 'neutral',
      cost: typeof cost === 'number' && cost > 0 ? cost : undefined,
      behavior: behavior || 'idle',
      autoLoot: !!autoLoot
    };

    onAdd(c);
    setName(''); setLevel(1); setCost('');
  };

  return (
    <ModalWrapper open={open} onClose={onClose} preventOutsideClose>
      <div className="w-full max-w-2xl bg-skyrim-paper p-4 rounded border border-skyrim-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-skyrim-gold">Companions</h3>
          <button onClick={onClose} className="px-2 py-1 rounded border border-skyrim-border">Close</button>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-4">
          {companions.length === 0 && <div className="text-xs text-gray-500 italic">No companions recruited yet.</div>}
          {companions.length > 0 && (
            <div className="mb-2">
              <SortSelector currentSort={sort} allowDirection={true} onSelect={(s) => setSort(s)} options={[{ id: 'name', label: 'Name' }, { id: 'damage', label: 'Damage' }, { id: 'armor', label: 'Armor' }, { id: 'loyalty', label: 'Loyalty' }]} />
            </div>
          )}

          {companions.slice().sort((a, b) => {
            const [key, dir] = (sort || 'name:asc').split(':');
            const asc = dir !== 'desc';
            const cmp = (() => {
              switch (key) {
                case 'damage': return (b.damage || 0) - (a.damage || 0);
                case 'armor': return (b.armor || 0) - (a.armor || 0);
                case 'loyalty': return (b.loyalty || 0) - (a.loyalty || 0);
                case 'name':
                default:
                  return a.name.localeCompare(b.name);
              }
            })();
            return asc ? cmp : -cmp;
          }).map(c => (
            <div key={c.id} className="p-2 rounded border border-skyrim-border bg-skyrim-paper/20 flex items-center justify-between gap-2">
              <div>
                <div className="font-bold text-skyrim-gold">{c.name} <span className="text-xs text-skyrim-text ml-2">Lv {c.level}</span></div>
                <div className="text-xs text-skyrim-text">{c.race} • {c.class} • Loyalty: {c.loyalty}</div>
                <div className="text-xs text-skyrim-text mt-1">Damage: {c.damage} • Armor: {c.armor} • Cost: {c.cost ?? '—'}g</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onRemove(c.id)} className="px-2 py-1 rounded border border-red-600 text-red-500" title="Dismiss"><Trash2 size={14} /></button>
                <button onClick={() => onUpdate({ ...c, behavior: c.behavior === 'follow' ? 'guard' : 'follow' })} className="px-2 py-1 rounded bg-skyrim-paper/30 text-skyrim-text text-xs" title="Toggle Follow/Guard">{c.behavior === 'follow' ? 'Following' : c.behavior === 'guard' ? 'Guarding' : 'Idle'}</button>
                <button onClick={() => onUpdate({ ...c, autoLoot: !c.autoLoot })} className={`px-2 py-1 rounded text-xs ${c.autoLoot ? 'bg-yellow-400 text-black' : 'bg-skyrim-paper/30 text-skyrim-text'}`} title="Toggle Auto-loot">{c.autoLoot ? 'Auto-loot: On' : 'Auto-loot: Off'}</button>
                <button onClick={() => onTalk && onTalk(c)} className="px-2 py-1 rounded bg-blue-700 text-white text-xs">Talk</button>
                <button onClick={() => setSelectedEquipCompanion(c)} className="px-2 py-1 rounded bg-skyrim-gold text-skyrim-dark text-xs">Manage Equipment</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-skyrim-border pt-3">
          <h4 className="text-sm font-bold text-skyrim-gold mb-2">Recruit New Companion</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="bg-skyrim-paper/40 p-2 rounded border border-skyrim-border text-skyrim-text focus:outline-none focus:border-skyrim-gold" />
            <DropdownSelector currentValue={race} onSelect={(value) => setRace(value)} options={RACE_OPTIONS} placeholder="Race" />
            <input type="number" value={level} onChange={(e) => setLevel(Number(e.target.value))} min={1} className="bg-skyrim-paper/40 p-2 rounded border border-skyrim-border text-skyrim-text focus:outline-none focus:border-skyrim-gold" />
            <input type="number" value={cost as any} onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Cost (g)" className="bg-skyrim-paper/40 p-2 rounded border border-skyrim-border text-skyrim-text focus:outline-none focus:border-skyrim-gold" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs text-skyrim-text">Behavior</label>
              <DropdownSelector currentValue={behavior} onSelect={(v) => setBehavior(v as any)} options={[{ id: 'idle', label: 'Idle' }, { id: 'follow', label: 'Follow' }, { id: 'guard', label: 'Guard' }]} placeholder="Behavior" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs text-skyrim-text mt-1"><input type="checkbox" checked={autoLoot} onChange={(e) => setAutoLoot(e.target.checked)} /> Auto-loot</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-2 bg-skyrim-gold text-skyrim-dark rounded flex items-center gap-2"><Plus size={14}/> Recruit</button>
            <button onClick={() => { setName(''); setLevel(1); setRace('Nord'); setCost(''); setAutoLoot(false); setBehavior('idle'); }} className="px-3 py-2 rounded border border-skyrim-border">Reset</button>
          </div>
        </div>

        {/* Companion Equipment Modal */}
        {selectedEquipCompanion && (
          <ModalWrapper open={true} onClose={() => { setSelectedEquipCompanion(null); setEquipSlotPicker(null); }} preventOutsideClose>
            <div className="w-full max-w-2xl bg-skyrim-paper p-4 rounded border border-skyrim-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-skyrim-gold">Manage Equipment: {selectedEquipCompanion.name}</h3>
                <button onClick={() => { setSelectedEquipCompanion(null); setEquipSlotPicker(null); }} className="px-2 py-1 rounded border border-skyrim-border">Close</button>
              </div>

              <div className="p-3 bg-skyrim-paper/20 border border-skyrim-border rounded">
                <EquipmentHUD
                  items={inventory.map(it => ({ ...it, equipped: !!(it.equippedBy && it.equippedBy === selectedEquipCompanion.id), slot: it.slot }))}
                  onUnequip={(it) => { if (it.equippedBy === selectedEquipCompanion.id) onUnassignItemFromCompanion?.(it.id); }}
                  onEquipFromSlot={(slot) => setEquipSlotPicker(slot)}
                />
              </div>

              {/* Equip selector */}
              {equipSlotPicker && (
                <div className="mt-4">
                  <div className="text-sm mb-2">Select item to equip to <strong>{equipSlotPicker}</strong></div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {inventory.filter(i => getDefaultSlotForItem(i) === equipSlotPicker).length === 0 ? (
                      <div className="text-xs text-gray-500">No items available for this slot.</div>
                    ) : (
                      inventory.filter(i => getDefaultSlotForItem(i) === equipSlotPicker).map(it => {
                        const ownedByOther = it.equippedBy && it.equippedBy !== 'player' && it.equippedBy !== selectedEquipCompanion.id;
                        const ownedByPlayer = it.equippedBy === 'player';
                        return (
                          <div key={it.id} className="flex items-center justify-between p-2 bg-skyrim-paper/30 border border-skyrim-border rounded">
                            <div>
                              <div className="text-sm text-gray-200">{it.name}</div>
                              <div className="text-xs text-gray-400">{it.damage ? `Damage: ${it.damage} ` : ''}{it.armor ? `Armor: ${it.armor}` : ''}{ownedByPlayer ? ' • Equipped by you' : ''}{ownedByOther ? ' • Equipped by another' : ''}</div>
                            </div>
                            <div>
                              <button disabled={ownedByOther || ownedByPlayer} onClick={() => { onAssignItemToCompanion?.(selectedEquipCompanion.id, it.id, equipSlotPicker); setEquipSlotPicker(null); }} className={`px-2 py-1 text-xs rounded ${ownedByOther || ownedByPlayer ? 'bg-gray-700 text-gray-300 cursor-not-allowed' : 'bg-green-700 text-white'}`}>Equip</button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="mt-3 text-xs text-gray-400">Items equipped by another companion or currently equipped by you are disabled. Unequip from the respective owner first.</div>
                </div>
              )}
            </div>
          </ModalWrapper>
        )}
      </div>
    </ModalWrapper>
  );
};

export default CompanionsModal;