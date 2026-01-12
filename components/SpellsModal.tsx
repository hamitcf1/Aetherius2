import React, { useState, useEffect } from 'react';
import { Spell, getAllSpells, getLearnedSpellIds, learnSpell, getSpellById } from '../services/spells';
import { Character } from '../types';
import { Zap, Book, Check } from 'lucide-react';

interface SpellsModalProps {
  character: Character;
  onClose: () => void;
  onLearn?: (spellId: string) => void;
}

export const SpellsModal: React.FC<SpellsModalProps> = ({ character, onClose, onLearn }) => {
  const [all, setAll] = useState<Spell[]>([]);
  const [learned, setLearned] = useState<string[]>([]);

  useEffect(() => {
    setAll(getAllSpells());
    setLearned(getLearnedSpellIds(character.id));
  }, [character.id]);

  const handleLearn = (id: string) => {
    const ok = learnSpell(character.id, id);
    if (ok) {
      setLearned(getLearnedSpellIds(character.id));
      onLearn?.(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-skyrim-dark/60 p-4">
      <div className="bg-skyrim-paper border border-skyrim-gold rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-serif text-skyrim-gold flex items-center gap-2"><Zap /> Spells</h3>
          <button onClick={onClose} className="px-2 py-1 bg-gray-700 rounded text-white">Close</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {all.map(s => {
            const learnedFlag = learned.includes(s.id);
            return (
              <div key={s.id} className={`p-3 rounded border ${learnedFlag ? 'border-skyrim-gold bg-skyrim-paper/40' : 'border-skyrim-border bg-skyrim-paper/30'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-skyrim-gold">{s.name}</div>
                    <div className="text-xs text-skyrim-text">{s.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-300">Cost: {s.cost}</div>
                    {learnedFlag ? <div className="text-green-400 flex items-center gap-1"><Check size={12} /> Learned</div> : (
                      <button onClick={() => handleLearn(s.id)} className="mt-2 px-2 py-1 bg-skyrim-gold text-skyrim-dark rounded text-xs">Learn</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SpellsModal;
