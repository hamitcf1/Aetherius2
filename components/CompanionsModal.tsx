import React, { useState } from 'react';
import ModalWrapper from './ModalWrapper';
import { Companion, InventoryItem, EquipmentSlot } from '../types';
import { Plus, Trash2, X, Dog, Heart } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { SortSelector, DropdownSelector } from './GameFeatures';
import { EquipmentHUD, getDefaultSlotForItem } from './EquipmentHUD';

// Themed input used across the companions UI to ensure consistent dark styling
const FieldInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', style = {}, ...props }) => (
  <input
    {...props}
    className={`p-3 rounded border border-skyrim-border text-skyrim-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${className}`}
    style={{ backgroundColor: 'var(--skyrim-paper)', color: 'var(--skyrim-text)', ...style }}
  />
);

// Small numeric input variant for compact layout
const NumberInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', style = {}, ...props }) => (
  <input
    {...props}
    type={props.type || 'number'}
    className={`p-2 rounded border border-skyrim-border text-skyrim-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${className}`}
    style={{ backgroundColor: 'var(--skyrim-paper)', color: 'var(--skyrim-text)', ...style }}
  />
);

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

// Animal companion options
const ANIMAL_SPECIES = [
  { id: 'dog', label: 'Dog', baseHealth: 40, baseDamage: 8, baseArmor: 2 },
  { id: 'husky', label: 'Husky', baseHealth: 50, baseDamage: 10, baseArmor: 3 },
  { id: 'wolf', label: 'Wolf', baseHealth: 45, baseDamage: 12, baseArmor: 2 },
  { id: 'cat', label: 'Cat', baseHealth: 20, baseDamage: 4, baseArmor: 0 },
  { id: 'fox', label: 'Fox', baseHealth: 30, baseDamage: 6, baseArmor: 1 },
  { id: 'horse', label: 'Horse', baseHealth: 80, baseDamage: 15, baseArmor: 5 },
  { id: 'bear', label: 'Bear', baseHealth: 100, baseDamage: 20, baseArmor: 8 },
  { id: 'sabrecat', label: 'Sabre Cat', baseHealth: 70, baseDamage: 18, baseArmor: 4 }
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  companions: Companion[];
  onAdd: (c: Companion) => void;
  onUpdate: (c: Companion) => void;
  onRemove: (id: string) => void;
  onTalk?: (c: Companion) => void;
  onPet?: (c: Companion) => void; // For animal companions
  // Inventory & equipment handlers
  inventory?: InventoryItem[];
  onAssignItemToCompanion?: (companionId: string, itemId: string, slot?: EquipmentSlot) => void;
  onUnassignItemFromCompanion?: (itemId: string) => void;
}

export const CompanionsModal: React.FC<Props> = ({ open, onClose, companions, onAdd, onUpdate, onRemove, onTalk, onPet, inventory = [], onAssignItemToCompanion, onUnassignItemFromCompanion }) => {
  const [name, setName] = useState('');
  const [race, setRace] = useState('Nord');
  const [level, setLevel] = useState(1);
  const [cost, setCost] = useState<number | ''>('');
  const [behavior, setBehavior] = useState<'idle'|'follow'|'guard'>('idle');
  const [autoLoot, setAutoLoot] = useState(false);
  const [sort, setSort] = useState<string>('name:asc');
  // Animal companion state
  const [isAnimal, setIsAnimal] = useState(false);
  const [species, setSpecies] = useState<string>('dog');

  const [selectedEquipCompanion, setSelectedEquipCompanion] = useState<Companion | null>(null);
  const [equipSlotPicker, setEquipSlotPicker] = useState<EquipmentSlot | null>(null);

  // Confirm delete flow for companions
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [confirmRemoveName, setConfirmRemoveName] = useState<string | null>(null);

  const handleAdd = () => {
    if (!name.trim()) return;
    const lvl = Math.max(1, Number(level) || 1);
    
    // Get animal stats if applicable
    const animalData = isAnimal ? ANIMAL_SPECIES.find(a => a.id === species) : null;
    
    const c: Companion = {
      id: Math.random().toString(36).substring(2, 11),
      characterId: '', // Will be set by App.tsx addCompanion handler
      name: name.trim(),
      race: isAnimal ? (animalData?.label || 'Animal') : race,
      class: isAnimal ? 'Animal Companion' : 'Follower',
      level: lvl,
      health: isAnimal 
        ? (animalData?.baseHealth || 40) + (lvl-1)*8 
        : 50 + (lvl-1)*10,
      maxHealth: isAnimal 
        ? (animalData?.baseHealth || 40) + (lvl-1)*8 
        : 50 + (lvl-1)*10,
      damage: isAnimal 
        ? (animalData?.baseDamage || 8) + Math.floor(lvl/2) 
        : 6 + Math.floor(lvl/2),
      armor: isAnimal 
        ? (animalData?.baseArmor || 2) + Math.floor(lvl/4) 
        : 5 + Math.floor(lvl/4),
      personality: isAnimal ? 'Loyal Beast' : 'Loyal',
      recruitedAt: Date.now(),
      loyalty: isAnimal ? 75 : 50, // Animals tend to be more loyal
      mood: 'happy',
      cost: typeof cost === 'number' && cost > 0 ? cost : undefined,
      behavior: behavior || 'follow',
      autoLoot: isAnimal ? false : !!autoLoot, // Animals can't loot
      autoControl: true,
      xp: 0,
      subclass: isAnimal ? 'beast' : 'warrior',
      isAnimal,
      species: isAnimal ? (species as any) : undefined
    };

    onAdd(c);
    setName(''); setLevel(1); setCost(''); setIsAnimal(false); setSpecies('dog');
  };

  return (
    <ModalWrapper open={open} onClose={onClose} preventOutsideClose>
      <div className="w-full max-w-2xl bg-skyrim-paper p-4 rounded border border-skyrim-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-skyrim-gold">Companions</h3>
          <button onClick={onClose} data-sfx="button_click" className="px-2 py-1 rounded border border-skyrim-border">Close</button>
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
              <div className="flex items-center gap-2">
                {c.isAnimal && <Dog size={16} className="text-amber-400" />}
                <div>
                  <div className="font-bold text-skyrim-gold">{c.name} <span className="text-xs text-skyrim-text ml-2">Lv {c.level}</span></div>
                  <div className="text-xs text-skyrim-text">{c.race} • {c.class} • Loyalty: {c.loyalty}</div>
                  <div className="text-xs text-skyrim-text mt-1">Damage: {c.damage} • Armor: {c.armor} • Cost: {c.cost ?? '—'}g</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button data-testid={`companion-dismiss-${c.id}`} onClick={() => { setConfirmRemoveId(c.id); setConfirmRemoveName(c.name); }} className="px-2 py-1 rounded border border-red-600 text-red-500" title="Dismiss"><Trash2 size={14} /></button>
                <button onClick={() => onUpdate({ ...c, behavior: c.behavior === 'follow' ? 'guard' : 'follow' })} className="px-2 py-1 rounded bg-skyrim-paper/30 text-skyrim-text text-xs" title="Toggle Follow/Guard">{c.behavior === 'follow' ? 'Following' : c.behavior === 'guard' ? 'Guarding' : 'Idle'}</button>
                {!c.isAnimal && (
                  <button onClick={() => onUpdate({ ...c, autoLoot: !c.autoLoot })} className={`px-2 py-1 rounded text-xs ${c.autoLoot ? 'bg-yellow-400 text-black' : 'bg-skyrim-paper/30 text-skyrim-text'}`} title="Toggle Auto-loot">{c.autoLoot ? 'Auto-loot: On' : 'Auto-loot: Off'}</button>
                )}
                <button onClick={() => onUpdate({ ...c, autoControl: !c.autoControl })} className={`px-2 py-1 rounded text-xs ${c.autoControl ? 'bg-sky-400 text-black' : 'bg-skyrim-paper/30 text-skyrim-text'}`} title="Toggle Auto-control">{c.autoControl ? 'Auto: On' : 'Auto: Off'}</button>
                {c.isAnimal ? (
                  <button onClick={() => onPet && onPet(c)} className="px-2 py-1 rounded bg-pink-600 text-white text-xs flex items-center gap-1"><Heart size={12} /> Pet</button>
                ) : (
                  <button onClick={() => onTalk && onTalk(c)} className="px-2 py-1 rounded bg-blue-700 text-white text-xs">Talk</button>
                )}
                {!c.isAnimal && (
                  <button onClick={() => setSelectedEquipCompanion(c)} className="px-2 py-1 rounded bg-skyrim-gold text-skyrim-dark text-xs">Manage Equipment</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-skyrim-border pt-3">
          <h4 className="text-sm font-bold text-skyrim-gold mb-2">Recruit New Companion</h4>
          
          {/* Animal toggle */}
          <div className="mb-3">
            <label className="flex items-center gap-2 text-sm text-skyrim-text cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-skyrim-gold" 
                checked={isAnimal} 
                onChange={(e) => setIsAnimal(e.target.checked)} 
              />
              <Dog size={16} className={isAnimal ? 'text-amber-400' : 'text-gray-500'} />
              <span>Recruit Animal Companion</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
            <FieldInput
              aria-label="Companion name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isAnimal ? "Pet Name (e.g., Meeko)" : "Name"}
            />

            {isAnimal ? (
              <DropdownSelector 
                currentValue={species} 
                onSelect={(value) => setSpecies(value)} 
                options={ANIMAL_SPECIES.map(a => ({ id: a.id, label: a.label }))} 
                placeholder="Species" 
              />
            ) : (
              <DropdownSelector currentValue={race} onSelect={(value) => setRace(value)} options={RACE_OPTIONS} placeholder="Race" />
            )}

            <NumberInput
              aria-label="Companion level"
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              min={1}
            />

            <NumberInput
              aria-label="Companion cost"
              value={cost as any}
              onChange={(e) => setCost(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Cost (g)"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs text-skyrim-text">Behavior</label>
              <DropdownSelector currentValue={behavior} onSelect={(v) => setBehavior(v as any)} options={[{ id: 'idle', label: 'Idle' }, { id: 'follow', label: 'Follow' }, { id: 'guard', label: 'Guard' }]} placeholder="Behavior" />
            </div>
            {!isAnimal && (
              <div>
                <label className="flex items-center gap-2 text-xs text-skyrim-text mt-1"><input type="checkbox" className="w-4 h-4 accent-skyrim-gold" checked={autoLoot} onChange={(e) => setAutoLoot(e.target.checked)} /> Auto-loot</label>
              </div>
            )}
          </div>
          
          {/* Show animal stats preview */}
          {isAnimal && species && (
            <div className="mb-2 p-2 bg-skyrim-paper/30 rounded border border-skyrim-border">
              <div className="text-xs text-skyrim-text">
                {(() => {
                  const animalData = ANIMAL_SPECIES.find(a => a.id === species);
                  if (!animalData) return null;
                  const lvl = Math.max(1, Number(level) || 1);
                  return (
                    <span>
                      <strong>{animalData.label}</strong> — 
                      HP: {animalData.baseHealth + (lvl-1)*8} | 
                      Damage: {animalData.baseDamage + Math.floor(lvl/2)} | 
                      Armor: {animalData.baseArmor + Math.floor(lvl/4)}
                    </span>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-2 bg-skyrim-gold text-skyrim-dark rounded flex items-center gap-2"><Plus size={14}/> Recruit</button>
            <button onClick={() => { setName(''); setLevel(1); setRace('Nord'); setCost(''); setAutoLoot(false); setBehavior('idle'); setIsAnimal(false); setSpecies('dog'); }} className="px-3 py-2 rounded border border-skyrim-border">Reset</button>
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
                        const allowEquipWhenStacked = ownedByPlayer && (it.quantity || 0) > 1;
                        return (
                          <div key={it.id} className="flex items-center justify-between p-2 bg-skyrim-paper/30 border border-skyrim-border rounded">
                            <div>
                              <div className="text-sm text-gray-200">{it.name}</div>
                              <div className="text-xs text-gray-400">{it.damage ? `Damage: ${it.damage} ` : ''}{it.armor ? `Armor: ${it.armor}` : ''}{ownedByPlayer ? ` • Equipped by you${allowEquipWhenStacked ? ' (stack available)' : ''}` : ''}{ownedByOther ? ' • Equipped by another' : ''}</div>
                            </div>
                            <div>
                              <button disabled={ownedByOther || (ownedByPlayer && !allowEquipWhenStacked)} onClick={() => { onAssignItemToCompanion?.(selectedEquipCompanion.id, it.id, equipSlotPicker); setEquipSlotPicker(null); }} className={`px-2 py-1 text-xs rounded ${ownedByOther || (ownedByPlayer && !allowEquipWhenStacked) ? 'bg-gray-700 text-gray-300 cursor-not-allowed' : 'bg-green-700 text-white'}`}>
                                {ownedByPlayer && allowEquipWhenStacked ? 'Split & Equip' : 'Equip'}
                              </button>
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

        {/* Companion removal confirmation (reusable) */}
        {confirmRemoveId && (
          <ConfirmModal
            open={!!confirmRemoveId}
            danger
            title="Dismiss Companion"
            description={<span>Are you sure you want to dismiss <strong>{confirmRemoveName}</strong>? This will unequip their items.</span>}
            confirmLabel="Dismiss"
            cancelLabel="Keep"
            onCancel={() => { setConfirmRemoveId(null); setConfirmRemoveName(null); }}
            onConfirm={() => { onRemove(confirmRemoveId as string); setConfirmRemoveId(null); setConfirmRemoveName(null); }}
          />
        )}
      </div>
    </ModalWrapper>
  );
};

export default CompanionsModal;