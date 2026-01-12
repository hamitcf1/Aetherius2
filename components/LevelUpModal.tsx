import React, { useState } from 'react';
import ModalWrapper from './ModalWrapper';
import { Check } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (choice: 'health' | 'magicka' | 'stamina') => void;
  characterName: string;
  newLevel: number;
  archetype?: string;
}

export default function LevelUpModal({ open, onClose, onConfirm, characterName, newLevel, archetype }: Props) {
  const [choice, setChoice] = useState<'health' | 'magicka' | 'stamina'>('health');

  // Suggest default based on archetype
  React.useEffect(() => {
    if (!archetype) return;
    const a = archetype.toLowerCase();
    if (a.includes('mage') || a.includes('sorcerer')) setChoice('magicka');
    else if (a.includes('thief') || a.includes('rogue') || a.includes('assassin')) setChoice('stamina');
    else setChoice('health');
  }, [archetype, open]);

  return (
    <ModalWrapper open={open} onClose={onClose} preventOutsideClose>
      <div className="w-[420px] bg-skyrim-paper p-6 rounded border border-skyrim-border">
        <h3 className="text-lg font-bold text-skyrim-gold mb-2">Level Up!</h3>
        <p className="text-sm text-gray-200 mb-4">{characterName} reached level {newLevel}. Choose one stat to increase by +10 and receive 1 perk point.</p>

        <div className="grid grid-cols-3 gap-3 mb-2">
          <button
            onClick={() => setChoice('health')}
            aria-pressed={choice === 'health'}
            className={`relative p-3 rounded border text-left transition-all ${choice === 'health' ? 'border-skyrim-gold bg-skyrim-gold/5 ring-2 ring-skyrim-gold/20' : 'border-skyrim-border'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Health</div>
                <div className="text-xs text-skyrim-text">+10 max</div>
              </div>
              {choice === 'health' && <Check size={18} className="text-skyrim-gold" />}
            </div>
          </button>

          <button
            onClick={() => setChoice('magicka')}
            aria-pressed={choice === 'magicka'}
            className={`relative p-3 rounded border text-left transition-all ${choice === 'magicka' ? 'border-skyrim-gold bg-skyrim-gold/5 ring-2 ring-skyrim-gold/20' : 'border-skyrim-border'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Magicka</div>
                <div className="text-xs text-skyrim-text">+10 max</div>
              </div>
              {choice === 'magicka' && <Check size={18} className="text-skyrim-gold" />}
            </div>
          </button>

          <button
            onClick={() => setChoice('stamina')}
            aria-pressed={choice === 'stamina'}
            className={`relative p-3 rounded border text-left transition-all ${choice === 'stamina' ? 'border-skyrim-gold bg-skyrim-gold/5 ring-2 ring-skyrim-gold/20' : 'border-skyrim-border'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Stamina</div>
                <div className="text-xs text-skyrim-text">+10 max</div>
              </div>
              {choice === 'stamina' && <Check size={18} className="text-skyrim-gold" />}
            </div>
          </button>
        </div>

        <div className="mb-4 text-sm text-skyrim-text">Selected: <span className="text-skyrim-gold font-bold">{choice.charAt(0).toUpperCase() + choice.slice(1)}</span></div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded bg-transparent border border-skyrim-border text-sm">Cancel</button>
          <button onClick={() => onConfirm(choice)} className="px-4 py-2 rounded bg-skyrim-gold text-black text-sm">Confirm</button>
        </div>
      </div>
    </ModalWrapper>
  );
}
