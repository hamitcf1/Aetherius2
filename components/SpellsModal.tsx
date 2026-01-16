import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ModalWrapper from './ModalWrapper';
import { Spell, getAllSpells, getLearnedSpellIds, learnSpell, getSpellById, isSpellVariantUnlocked, refundAllSpells, getSpellSchool } from '../services/spells';
import { Character } from '../types';
import { Zap, Check, Lock, ChevronDown, ChevronRight, Sparkles, RefreshCcw, Flame, Snowflake, Wind, Heart, Eye, Star, Wand2 } from 'lucide-react';
import EmpoweredBadge from './EmpoweredBadge';

interface SpellsModalProps {
  character: Character;
  onClose: () => void;
  onLearn?: (spellId: string) => void;
  onRefund?: (pointsRefunded: number) => void;
}

const SPELL_SCHOOLS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  Destruction: { label: 'Destruction', icon: <Flame size={14} />, color: 'text-orange-400' },
  Restoration: { label: 'Restoration', icon: <Heart size={14} />, color: 'text-green-400' },
  Conjuration: { label: 'Conjuration', icon: <Star size={14} />, color: 'text-purple-400' },
  Alteration: { label: 'Alteration', icon: <Wind size={14} />, color: 'text-cyan-400' },
  Illusion: { label: 'Illusion', icon: <Eye size={14} />, color: 'text-pink-400' },
  General: { label: 'General', icon: <Wand2 size={14} />, color: 'text-gray-400' },
};

export const SpellsModal: React.FC<SpellsModalProps> = ({ character, onClose, onLearn, onRefund }) => {
  const [all, setAll] = useState<Spell[]>([]);
  const [learned, setLearned] = useState<string[]>([]);
  const [selectedSpellId, setSelectedSpellId] = useState<string | null>(null);
  const [expandedSchools, setExpandedSchools] = useState<Record<string, boolean>>({ Destruction: true, Restoration: true });
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showRefundConfirm) setShowRefundConfirm(false);
      else onClose();
    }
  }, [onClose, showRefundConfirm]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const base = getAllSpells();
    const learnedIds = getLearnedSpellIds(character.id);
    const baseIds = new Set(base.map(s => s.id));
    
    // Add any learned empowered spells that weren't in the base list
    const extras = learnedIds.filter(id => !baseIds.has(id)).map(id => getSpellById(id)).filter(Boolean) as Spell[];
    
    // Also add empowered variants for base spells that can be learned
    // This shows them in the list so users can see and learn them
    const empoweredVariants: Spell[] = [];
    base.forEach(spell => {
      // Check if this spell has an empowered variant (generated with :high suffix)
      const empoweredId = `${spell.id}:high`;
      const empoweredSpell = getSpellById(empoweredId);
      // Only add if: we have the base spell learned, and the empowered isn't already in list
      if (empoweredSpell && learnedIds.includes(spell.id) && !baseIds.has(empoweredId) && !learnedIds.includes(empoweredId)) {
        empoweredVariants.push(empoweredSpell);
      }
    });
    
    setAll([...base, ...extras, ...empoweredVariants]);
    setLearned(learnedIds);
  }, [character.id]);

  const spellsBySchool = useMemo(() => {
    const grouped: Record<string, Spell[]> = {};
    Object.keys(SPELL_SCHOOLS).forEach(school => { grouped[school] = []; });
    all.forEach(spell => {
      const school = getSpellSchool(spell);
      if (!grouped[school]) grouped[school] = [];
      grouped[school].push(spell);
    });
    return grouped;
  }, [all]);

  const toggleSchool = (school: string) => setExpandedSchools(prev => ({ ...prev, [school]: !prev[school] }));

  const handleLearn = (id: string) => {
    const spell = getSpellById(id);
    const perkCost = spell?.perkCost || 1;
    if (id.includes(':') || id.includes('_high')) {
      if (!isSpellVariantUnlocked(character, id)) return;
    }
    if ((character.perkPoints || 0) < perkCost) return;
    const ok = learnSpell(character.id, id);
    if (ok) {
      setLearned(getLearnedSpellIds(character.id));
      if (!all.find(s => s.id === id) && getSpellById(id)) setAll(prev => [...prev, getSpellById(id)!]);
      onLearn?.(id);
    }
  };

  const handleRefundAll = () => {
    const result = refundAllSpells(character.id);
    if (result.refundedPoints > 0) {
      setLearned([]);
      onRefund?.(result.refundedPoints);
    }
    setShowRefundConfirm(false);
  };

  const totalSpentOnSpells = useMemo(() => learned.reduce((sum, id) => sum + (getSpellById(id)?.perkCost || 1), 0), [learned]);
  const selectedSpell = selectedSpellId ? getSpellById(selectedSpellId) : null;
  const availablePoints = character.perkPoints || 0;

  const getSpellStatus = (spell: Spell) => {
    if (learned.includes(spell.id)) return 'learned';
    if (spell.prerequisites?.level && (character.level || 1) < spell.prerequisites.level) return 'locked';
    if (availablePoints >= (spell.perkCost || 1)) return 'available';
    return 'unavailable';
  };

  return (
    <ModalWrapper open={true} onClose={onClose} preventOutsideClose>
      <div className="w-full max-w-[900px] h-[min(85vh,700px)] flex flex-col bg-skyrim-paper rounded border border-skyrim-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-skyrim-border bg-skyrim-dark/30">
          <h3 className="text-lg font-bold text-skyrim-gold flex items-center gap-2"><Zap size={18} /> Spell Tome</h3>
          <div className="flex items-center gap-4">
            <div className="text-sm text-skyrim-text">
              Points: <span className="font-bold text-skyrim-gold">{availablePoints}</span>
              {totalSpentOnSpells > 0 && <span className="ml-2 text-blue-300">({totalSpentOnSpells} in spells)</span>}
            </div>
            {learned.length > 0 && (
              <button onClick={() => setShowRefundConfirm(true)} className="px-2 py-1 text-xs bg-red-600/20 text-red-300 rounded hover:bg-red-600/30 flex items-center gap-1">
                <RefreshCcw size={12} /> Refund All
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Spell List */}
          <div className="w-1/2 border-r border-skyrim-border overflow-y-auto p-2">
            {Object.entries(SPELL_SCHOOLS).map(([schoolKey, school]) => {
              const spells = spellsBySchool[schoolKey] || [];
              if (spells.length === 0) return null;
              const isExpanded = expandedSchools[schoolKey];
              const learnedCount = spells.filter(s => learned.includes(s.id)).length;
              const availableCount = spells.filter(s => getSpellStatus(s) === 'available').length;

              return (
                <div key={schoolKey} className="mb-1">
                  <button onClick={() => toggleSchool(schoolKey)} className="w-full flex items-center justify-between p-2 rounded hover:bg-skyrim-gold/10">
                    <span className={`font-medium flex items-center gap-2 ${school.color}`}>{school.icon}{school.label}</span>
                    <div className="flex items-center gap-2">
                      {availableCount > 0 && <span className="text-xs px-1.5 py-0.5 bg-amber-600/30 text-amber-300 rounded">{availableCount}</span>}
                      {learnedCount > 0 && <span className="text-xs px-1.5 py-0.5 bg-green-600/30 text-green-300 rounded">{learnedCount}</span>}
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="ml-2 space-y-0.5">
                      {spells.map(spell => {
                        const status = getSpellStatus(spell);
                        const isSelected = selectedSpellId === spell.id;
                        const isEmpowered = spell.id.includes(':') || spell.id.includes('_high') || spell.id.includes('_empowered');
                        const cost = spell.perkCost || 1;
                        return (
                          <button key={spell.id} onClick={() => setSelectedSpellId(spell.id)}
                            className={`w-full flex items-center justify-between p-1.5 rounded text-left text-sm ${isSelected ? 'bg-skyrim-gold/20 ring-1 ring-skyrim-gold' : 'hover:bg-skyrim-paper/50'}`}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${status === 'learned' ? 'bg-green-600/40 text-green-400' : status === 'available' ? 'bg-amber-600/40 text-amber-400' : 'bg-gray-600/40 text-gray-500'}`}>
                                {status === 'learned' ? <Check size={10} /> : status === 'locked' || status === 'unavailable' ? <Lock size={10} /> : <Sparkles size={10} />}
                              </span>
                              <span className={`truncate ${status === 'locked' ? 'text-skyrim-text/50' : ''}`}>{spell.name}</span>
                              {isEmpowered && <EmpoweredBadge small />}
                            </div>
                            <span className={`text-xs ml-2 ${status === 'learned' ? 'text-green-400' : status === 'available' ? 'text-amber-400' : 'text-skyrim-text/50'}`}>{cost}pt</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Panel - Spell Details */}
          <div className="w-1/2 p-4 overflow-y-auto bg-skyrim-dark/10">
            {selectedSpell ? (() => {
              const status = getSpellStatus(selectedSpell);
              const cost = selectedSpell.perkCost || 1;
              const canLearn = status === 'available';
              const isEmpowered = selectedSpell.id.includes(':') || selectedSpell.id.includes('_high');
              const baseId = selectedSpell.id.split(/[:_]/)[0];
              const empoweredId = `${baseId}:high`;
              const hasEmpowered = !isEmpowered && learned.includes(selectedSpell.id);
              const empoweredUnlocked = isSpellVariantUnlocked(character, empoweredId);
              const empoweredLearned = learned.includes(empoweredId) || learned.includes(`${baseId}_high`);

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-skyrim-gold flex items-center gap-2">{selectedSpell.name}{isEmpowered && <EmpoweredBadge />}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${status === 'learned' ? 'bg-green-600/30 text-green-300' : status === 'available' ? 'bg-amber-600/30 text-amber-300' : 'bg-gray-600/30 text-gray-400'}`}>{status.toUpperCase()}</span>
                  </div>
                  <div className="text-xs text-skyrim-text/70 flex items-center gap-2">{SPELL_SCHOOLS[getSpellSchool(selectedSpell)]?.icon}{getSpellSchool(selectedSpell)}</div>
                  <p className="text-sm text-skyrim-text">{selectedSpell.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-skyrim-paper/30 rounded"><div className="text-skyrim-text/70">Magicka Cost</div><div className="text-blue-400 font-bold">{selectedSpell.cost}</div></div>
                    <div className="p-2 bg-skyrim-paper/30 rounded"><div className="text-skyrim-text/70">Perk Cost</div><div className="text-skyrim-gold font-bold">{cost} pt{cost > 1 ? 's' : ''}</div></div>
                    {selectedSpell.damage && <div className="p-2 bg-skyrim-paper/30 rounded"><div className="text-skyrim-text/70">Damage</div><div className="text-red-400 font-bold">{selectedSpell.damage}</div></div>}
                    {selectedSpell.heal && <div className="p-2 bg-skyrim-paper/30 rounded"><div className="text-skyrim-text/70">Healing</div><div className="text-green-400 font-bold">{selectedSpell.heal}</div></div>}
                  </div>

                  {selectedSpell.effects && selectedSpell.effects.length > 0 && (
                    <div className="p-2 bg-skyrim-paper/20 rounded border border-skyrim-border">
                      <div className="text-xs text-skyrim-text/70 mb-1">Effects:</div>
                      <div className="space-y-1">
                        {selectedSpell.effects.map((eff: any, i: number) => (
                          <div key={i} className="text-xs text-skyrim-gold">
                            {eff.type === 'dot' && `${eff.value} damage over ${eff.duration}s`}
                            {eff.type === 'slow' && `${eff.amount}% slow for ${eff.duration}s`}
                            {eff.type === 'stun' && `Stun for ${eff.duration}s`}
                            {eff.type === 'buff' && `+${eff.amount} ${eff.stat} for ${eff.duration}s`}
                            {eff.type === 'summon' && `Summon ${eff.name} for ${eff.duration}s`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {status === 'locked' && selectedSpell.prerequisites && (
                    <div className="p-2 bg-red-900/20 rounded border border-red-800/30 text-xs">
                      <div className="text-red-400 mb-1">Requires:</div>
                      {selectedSpell.prerequisites.level && <span className="px-2 py-0.5 bg-red-900/30 text-red-300 rounded">Level {selectedSpell.prerequisites.level}</span>}
                    </div>
                  )}

                  {hasEmpowered && !empoweredLearned && (
                    <div className={`p-2 rounded border text-xs ${empoweredUnlocked ? 'bg-amber-900/20 border-amber-800/30' : 'bg-gray-900/20 border-gray-700/30'}`}>
                      <div className={empoweredUnlocked ? 'text-amber-400' : 'text-gray-500'}>
                        {empoweredUnlocked ? 'Empowered variant available!' : `Empowered variant locked (requires level ${(selectedSpell.prerequisites?.level || 1) + 5})`}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {canLearn && <button onClick={() => handleLearn(selectedSpell.id)} className="px-3 py-1.5 bg-skyrim-gold text-black rounded font-medium text-sm hover:bg-amber-400">Learn ({cost} pt{cost > 1 ? 's' : ''})</button>}
                    {status === 'unavailable' && !learned.includes(selectedSpell.id) && <span className="px-3 py-1.5 text-gray-500 text-sm">Need {cost - availablePoints} more point{cost - availablePoints > 1 ? 's' : ''}</span>}
                    {hasEmpowered && empoweredUnlocked && !empoweredLearned && availablePoints >= 10 && <button onClick={() => handleLearn(empoweredId)} className="px-3 py-1.5 bg-amber-600 text-black rounded font-medium text-sm hover:bg-amber-500">Learn Empowered (10 pts)</button>}
                  </div>
                </div>
              );
            })() : (
              <div className="h-full flex items-center justify-center text-skyrim-text/50">
                <div className="text-center"><Zap size={32} className="mx-auto mb-2 opacity-50" /><p>Select a spell to view details</p></div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-skyrim-border bg-skyrim-dark/30">
          <div className="text-sm text-skyrim-text">{learned.length > 0 && <span><span className="text-green-400 font-bold">{learned.length}</span> spells learned</span>}</div>
          <button onClick={onClose} data-sfx="button_click" className="px-4 py-1.5 rounded border border-skyrim-border text-skyrim-text hover:bg-skyrim-paper/30">Close</button>
        </div>
      </div>

      {/* Refund Confirmation */}
      {showRefundConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-skyrim-paper p-4 rounded border border-skyrim-border max-w-md">
            <h4 className="font-semibold text-lg text-skyrim-gold">Refund All Spells?</h4>
            <p className="text-sm text-skyrim-text mt-2">This will forget all <span className="text-red-400 font-bold">{learned.length}</span> learned spells and refund <span className="text-green-400 font-bold">{totalSpentOnSpells}</span> perk point{totalSpentOnSpells !== 1 ? 's' : ''}.</p>
            <p className="text-xs text-skyrim-text/70 mt-2">You can re-learn spells later by spending perk points again.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={handleRefundAll} className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-500">Refund All ({totalSpentOnSpells} pts)</button>
              <button onClick={() => setShowRefundConfirm(false)} className="flex-1 px-3 py-2 border border-skyrim-border text-skyrim-text rounded hover:bg-skyrim-paper/30">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </ModalWrapper>
  );
};

export default SpellsModal;
