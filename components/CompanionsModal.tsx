import React, { useState } from 'react';
import ModalWrapper from './ModalWrapper';
import { Companion } from '../types';
import { Plus, Trash2, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  companions: Companion[];
  onAdd: (c: Companion) => void;
  onUpdate: (c: Companion) => void;
  onRemove: (id: string) => void;
}

export const CompanionsModal: React.FC<Props> = ({ open, onClose, companions, onAdd, onUpdate, onRemove }) => {
  const [name, setName] = useState('');
  const [race, setRace] = useState('Nord');
  const [level, setLevel] = useState(1);

  const handleAdd = () => {
    if (!name.trim()) return;
    const c: Companion = {
      id: Math.random().toString(36).substr(2,9),
      name: name.trim(),
      race,
      class: 'Follower',
      level: Math.max(1, Number(level) || 1),
      health: 50 + (level-1)*10,
      maxHealth: 50 + (level-1)*10,
      damage: 6 + Math.floor(level/2),
      armor: 5,
      personality: 'Loyal',
      recruitedAt: Date.now(),
      loyalty: 50,
      mood: 'neutral'
    };

    onAdd(c);
    setName(''); setLevel(1);
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
          {companions.map(c => (
            <div key={c.id} className="p-2 rounded border border-skyrim-border bg-skyrim-paper/20 flex items-center justify-between gap-2">
              <div>
                <div className="font-bold text-skyrim-gold">{c.name} <span className="text-xs text-skyrim-text ml-2">Lv {c.level}</span></div>
                <div className="text-xs text-skyrim-text">{c.race} • {c.class} • Loyalty: {c.loyalty}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onRemove(c.id)} className="px-2 py-1 rounded border border-red-600 text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-skyrim-border pt-3">
          <h4 className="text-sm font-bold text-skyrim-gold mb-2">Recruit New Companion</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="bg-skyrim-paper/40 p-2 rounded border border-skyrim-border" />
            <input value={race} onChange={(e) => setRace(e.target.value)} placeholder="Race" className="bg-skyrim-paper/40 p-2 rounded border border-skyrim-border" />
            <input type="number" value={level} onChange={(e) => setLevel(Number(e.target.value))} min={1} className="bg-skyrim-paper/40 p-2 rounded border border-skyrim-border" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-3 py-2 bg-skyrim-gold text-skyrim-dark rounded flex items-center gap-2"><Plus size={14}/> Recruit</button>
            <button onClick={() => { setName(''); setLevel(1); setRace('Nord'); }} className="px-3 py-2 rounded border border-skyrim-border">Reset</button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default CompanionsModal;