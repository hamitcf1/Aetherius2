import React, { useState, useEffect } from 'react';
import { Spell, getAllSpells, getLearnedSpellIds, learnSpell, getSpellById, isSpellVariantUnlocked } from '../services/spells';
import { Character } from '../types';
import { Zap, Book, Check } from 'lucide-react';
import EmpoweredBadge from './EmpoweredBadge';

interface SpellsModalProps {
  character: Character;
  onClose: () => void;
  onLearn?: (spellId: string) => void;
}

export const SpellsModal: React.FC<SpellsModalProps> = ({ character, onClose, onLearn }) => {
  const [all, setAll] = useState<Spell[]>([]);
  const [learned, setLearned] = useState<string[]>([]);

  useEffect(() => {
    const base = getAllSpells();
    const learnedIds = getLearnedSpellIds(character.id);
    // Include any learned empowered/high variants as separate entries so they appear in the UI
    const baseIds = new Set(base.map(s => s.id));
    const extras = learnedIds
      .filter(id => !baseIds.has(id))
      .map(id => getSpellById(id))
      .filter(Boolean) as Spell[];
    setAll([...base, ...extras]);
    setLearned(learnedIds);
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
      const updatedLearned = getLearnedSpellIds(character.id);
      setLearned(updatedLearned);
      // If learning an empowered/high variant, ensure it's shown in the list
      if ((!all || !all.find(s => s.id === id)) && getSpellById(id)) {
        setAll(prev => [...prev, getSpellById(id)!]);
      }
      onLearn?.(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-skyrim-dark/60 p-4">
      <div className="bg-skyrim-paper border border-skyrim-gold rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-serif text-skyrim-gold flex items-center gap-2"><Zap /> Spells</h3>
          <button title="Close the spells window" onClick={onClose} className="px-2 py-1 bg-gray-700 rounded text-white">Close</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {all.map(s => {
            const learnedFlag = learned.includes(s.id);
            const perkCost = s.perkCost || 1;
            const canAfford = (character.perkPoints || 0) >= perkCost;
            // Detect whether this entry is already an empowered/high variant.
            const isEmpoweredVariant = String(s.id).includes(':') || String(s.id).endsWith('_high') || String(s.id).endsWith('_empowered') || String(s.id).toLowerCase().includes('empowered');

            // Determine the true base spell id for this entry. For base spells this is the id itself.
            let baseId = String(s.id);
            if (isEmpoweredVariant) {
              if (baseId.includes(':')) baseId = baseId.split(':')[0];
              else baseId = baseId.replace(/(_high|_empowered)$/, '');
            }

            const empoweredId = `${baseId}:high`;
            // Consider learned state for both colon and underscore variants when checking persisted learned ids
            const empoweredLearned = learned.includes(empoweredId) || learned.includes(`${baseId}_high`) || learned.includes(`${baseId}_empowered`);
            const empoweredUnlocked = isSpellVariantUnlocked(character, empoweredId);
            const baseLearned = learned.includes(baseId);
            return (
              <div key={s.id} className={`p-3 rounded border ${learnedFlag ? 'border-skyrim-gold bg-skyrim-paper/40' : 'border-skyrim-border bg-skyrim-paper/30'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-skyrim-gold flex items-center gap-2">{s.name}{isEmpoweredVariant && <span className="ml-2"><EmpoweredBadge small /></span>}</div>
                    <div className="text-xs text-skyrim-text">{s.description}</div>
                    {/* Empowered variant info: only visible if base spell is learned */}
                    {!isEmpoweredVariant && baseLearned && (empoweredUnlocked ? (
                      <div className="text-xs text-stone-400 mt-1">Empowered variant available</div>
                    ) : (
                      <div className="text-xs text-stone-500 italic mt-1">Empowered variant locked (requires level {((s.prerequisites?.level || 1) + 5)} or the Empower perk)</div>
                    ))}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-300">Magicka: {s.cost}</div>
                    <div className="text-sm text-yellow-200">Perk cost: {perkCost}</div>
                    {learnedFlag ? <div className="text-green-400 flex items-center gap-1"><Check size={12} /> Learned</div> : (
                      <button title={`Learn ${s.name} (cost ${perkCost} perk)`} disabled={!canAfford} onClick={() => handleLearn(s.id)} className={`mt-2 px-2 py-1 ${canAfford ? 'bg-skyrim-gold text-skyrim-dark' : 'bg-gray-700 text-gray-300'} rounded text-xs`}>
                        Learn
                      </button>
                    )}
                    {/* Empowered learn button: only shown when base spell is learned and variant unlocked */}
                    {!isEmpoweredVariant && baseLearned && !empoweredLearned && empoweredUnlocked && (
                      <button title={`Learn empowered variant (cost ${getSpellById(empoweredId)?.perkCost || 10} perks)`} onClick={() => handleLearn(empoweredId)} className="mt-2 ml-2 px-2 py-1 rounded bg-amber-600 text-black text-xs">Learn Empowered</button>
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
