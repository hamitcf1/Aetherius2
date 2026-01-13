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
    const spell = getSpellById(id);
    const perkCost = spell?.perkCost || 1;

    // Prevent learning empowered variants unless unlocked
    if (id.includes(':') || id.includes('_high')) {
      const unlocked = isSpellVariantUnlocked(character, id);
      if (!unlocked) {
        alert(`This variant is locked. Reach a higher level or unlock the "Empower Spells" perk to learn it.`);
        return;
      }
    }

    if ((character.perkPoints || 0) < perkCost) {
      // Minimal feedback — parent can also prevent this
      alert(`You need ${perkCost} perk point(s) to learn ${spell?.name || 'this spell'}.`);
      return;
    }

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
            const perkCost = s.perkCost || 1;
            const canAfford = (character.perkPoints || 0) >= perkCost;
            const empoweredId = `${s.id}:high`;
            const empoweredLearned = learned.includes(empoweredId);
            const empoweredUnlocked = isSpellVariantUnlocked(character, empoweredId);
            return (
              <div key={s.id} className={`p-3 rounded border ${learnedFlag ? 'border-skyrim-gold bg-skyrim-paper/40' : 'border-skyrim-border bg-skyrim-paper/30'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-skyrim-gold">{s.name}</div>
                    <div className="text-xs text-skyrim-text">{s.description}</div>
                    {/* Empowered variant */}
                    {empoweredUnlocked ? (
                      <div className="text-xs text-stone-400 mt-1">Empowered variant available</div>
                    ) : (
                      <div className="text-xs text-stone-500 italic mt-1">Empowered variant locked (higher level or perk required)</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-300">Magicka: {s.cost}</div>
                    <div className="text-sm text-yellow-200">Perk cost: {perkCost}</div>
                    {learnedFlag ? <div className="text-green-400 flex items-center gap-1"><Check size={12} /> Learned</div> : (
                      <button disabled={!canAfford} onClick={() => handleLearn(s.id)} className={`mt-2 px-2 py-1 ${canAfford ? 'bg-skyrim-gold text-skyrim-dark' : 'bg-gray-700 text-gray-300'} rounded text-xs`}>
                        Learn
                      </button>
                    )}
                    {/* Empowered learn button */}
                    {!empoweredLearned && empoweredUnlocked && (
                      <button onClick={() => handleLearn(empoweredId)} className="mt-2 ml-2 px-2 py-1 rounded bg-amber-600 text-black text-xs">Learn Empowered</button>
                    )}
                    {!empoweredUnlocked && (
                      <div className="text-xs text-stone-500 mt-1">Locked</div>
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
