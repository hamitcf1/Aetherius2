import React, { useState, useMemo } from 'react';
import ModalWrapper from './ModalWrapper';
import { PERK_DEFINITIONS, PerkDef } from '../data/perkDefinitions';
import { Perk, Character } from '../types';
import { Check, Lock } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  character: Character;
  // Accept an array of perk ids (can include duplicates to apply multiple ranks)
  onConfirm: (perkIds: string[]) => void; // commit staged perks
  onForceUnlock?: (perkId: string) => void;
}

function currentPerkRank(char: Character, perkId: string) {
  return (char.perks || []).find(p => p.id === perkId)?.rank || 0;
}

function parseRequirement(req: string): { id: string; rank: number } {
  if (!req.includes(':')) return { id: req, rank: 1 };
  const [id, r] = req.split(':');
  return { id, rank: Number(r || 1) };
}

function prerequisitesMet(char: Character, def: PerkDef) {
  if (!def.requires || def.requires.length === 0) return true;
  return def.requires.every(r => {
    const parsed = parseRequirement(r);
    const have = currentPerkRank(char, parsed.id);
    return have >= parsed.rank;
  });
}

export default function PerkTreeModal({ open, onClose, character, onConfirm, onForceUnlock }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  // staged map: perkId -> stagedRanks
  const [stagedMap, setStagedMap] = useState<Record<string, number>>({});
  // staged mastery flags: perkId -> true when player intends to master on confirm
  const [stagedMaster, setStagedMaster] = useState<Record<string, boolean>>({});

  const defs = useMemo(() => PERK_DEFINITIONS, []);

  const availablePoints = character.perkPoints || 0;
  const stagedCount = Object.values(stagedMap as Record<string, number>).reduce((s: number, v: number) => s + (v || 0), 0);
  const remainingPoints = Math.max(0, availablePoints - stagedCount);

  const statusOf = (def: PerkDef) => {
    const curr = currentPerkRank(character, def.id);
    const max = def.maxRank || 1;
    if (curr >= max) return 'unlocked';
    if (prerequisitesMet(character, def)) return 'available';
    return 'locked';
  };

  const stagedFor = (id: string) => stagedMap[id] || 0;

  return (
    <ModalWrapper open={open} onClose={onClose} preventOutsideClose>
      <div className="w-full max-w-[760px] h-[min(90vh,calc(100vh-2rem))] sm:max-h-[80vh] overflow-auto bg-skyrim-paper p-4 sm:p-6 rounded border border-skyrim-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-skyrim-gold">Perk Tree</h3>
          <div className="text-sm text-skyrim-text">Available Points: <span className="font-bold text-skyrim-gold">{availablePoints}</span></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {defs.map(def => {
            const st = statusOf(def);
            const curr = currentPerkRank(character, def.id);
            const max = def.maxRank || 1;
            const stagedCountFor = stagedFor(def.id);
            const isStaged = stagedCountFor > 0;
            return (
              <div key={def.id} className={`p-3 rounded border transform transition-all duration-200 ${isStaged ? 'scale-105 ring-2 ring-skyrim-gold/30 shadow-lg' : ''} ${st === 'unlocked' ? 'border-green-600 bg-green-950/5' : st === 'available' ? 'border-skyrim-gold bg-skyrim-gold/5' : 'border-skyrim-border bg-skyrim-paper/20'}`}>
                <button onClick={() => setSelected(def.id)} className="w-full text-left">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold">{def.name}</div>
                      <div className="text-xs text-skyrim-text">{def.skill || ''}</div>
                      <div className="text-xs text-skyrim-text">Rank: {curr + stagedCountFor}/{max} {((character.perks || []).find(p => p.id === def.id)?.mastery || 0) > 0 && <span className="ml-2 text-[10px] px-2 py-0.5 bg-skyrim-gold/20 text-skyrim-gold rounded-full border border-skyrim-border">MASTERED x{(character.perks || []).find(p => p.id === def.id)?.mastery}</span>}</div>
                    </div>
                    <div className="ml-2">
                      {st === 'unlocked' && <Check className="text-green-400" />}
                      {st === 'locked' && <Lock className="text-gray-500" />}
                      {isStaged && <Check className="text-skyrim-gold" />}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-skyrim-paper/30 border border-skyrim-border rounded">
          {selected ? (
            (() => {
              const def = defs.find(d => d.id === selected)!;
              const st = statusOf(def);
              const curr = currentPerkRank(character, def.id);
              const max = def.maxRank || 1;
              const stagedCountFor = stagedFor(def.id);
              const currMastery = (character.perks || []).find(p => p.id === def.id)?.mastery || 0;
              const canStage = st === 'available' && remainingPoints > 0 && (curr + stagedCountFor) < max;
              return (
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-skyrim-gold font-bold">{def.name}</div>
                      <div className="text-xs text-skyrim-text">{def.skill}</div>
                    </div>
                    <div className="text-sm text-skyrim-text">Status: <span className={`font-bold ${st === 'unlocked' ? 'text-green-400' : st === 'available' ? 'text-skyrim-gold' : 'text-skyrim-text/70'}`}>{st}</span></div>
                  </div>
                  <p className="mt-2 text-sm text-skyrim-text">{def.description}</p>
                  <div className="mt-2 text-xs text-skyrim-text">Current Rank: {curr} / {max}</div>
                  {currMastery > 0 && <div className="mt-1 text-xs text-skyrim-gold">Mastery: x{currMastery} — grants additional bonus</div>}
                      {def.effect && def.effect.type === 'stat' && (
                        (() => {
                          const perRank = def.effect ? def.effect.amount : 0;
                          const key = def.effect ? def.effect.key : '';
                          const currentBonus = perRank * curr;
                          const stagedBonus = perRank * stagedCountFor;
                          const projectedBonus = currentBonus + stagedBonus;
                          return (
                            <div className="mt-3 text-sm text-gray-300">
                              <div className="text-xs text-skyrim-text">Per rank: <span className="font-bold">{perRank} {key}</span></div>
                              <div className="text-xs text-skyrim-text">Current bonus: <span className="font-bold text-skyrim-gold">+{currentBonus} {key}</span></div>
                              <div className="text-xs text-skyrim-text">After staged: <span className="font-bold text-skyrim-gold">+{projectedBonus} {key}</span></div>
                            </div>
                          );
                        })()
                      )}
                      <div className="mt-4 flex gap-2 items-center">
                        <button disabled={!canStage} onClick={() => {
                          if (!canStage) return;
                          setStagedMap(m => ({ ...m, [def.id]: (m[def.id] || 0) + 1 }));
                        }} className={`px-3 py-2 rounded ${canStage ? 'bg-skyrim-gold text-black' : 'bg-skyrim-paper/20 text-skyrim-text border border-skyrim-border'}`}>
                          {stagedCountFor > 0 ? `Staged +${stagedCountFor}` : 'Stage Rank'}
                        </button>
                        <button disabled={stagedCountFor === 0} onClick={() => setStagedMap(m => {
                      const next = { ...m };
                      if (!next[def.id]) return next;
                      next[def.id] = Math.max(0, next[def.id] - 1);
                      if (next[def.id] === 0) delete next[def.id];
                      return next;
                    })} className={`px-3 py-2 rounded ${stagedCountFor ? 'border border-skyrim-gold text-skyrim-gold' : 'bg-skyrim-paper/20 text-skyrim-text border border-skyrim-border'}`}>Undo</button>
                    <button disabled={curr < max || !!stagedMaster[def.id]} onClick={() => setStagedMaster(s => ({ ...s, [def.id]: true }))} className={`px-3 py-2 rounded ${curr >= max && !stagedMaster[def.id] ? 'bg-blue-700 text-white' : 'bg-skyrim-paper/20 text-skyrim-text border border-skyrim-border'}`}>Master</button>
                        <button onClick={() => setSelected(null)} className="px-3 py-2 rounded border border-skyrim-border">Close</button>
                        {st === 'locked' && (
                          <button
                            onClick={() => onForceUnlock && onForceUnlock(def.id)}
                            disabled={(character.perkPoints || 0) < 3 || (character.forcedPerkUnlocks || 0) >= 3}
                            className={`px-3 py-2 rounded ${((character.perkPoints || 0) >= 3 && (character.forcedPerkUnlocks || 0) < 3) ? 'bg-red-600 text-white' : 'bg-skyrim-paper/20 text-skyrim-text border border-skyrim-border'}`}
                          >Unlock (cost 3)</button>
                        )}
                  </div>
                  {st === 'locked' && def.requires && (
                    <div className="mt-3 text-xs text-skyrim-text">Requires: {def.requires.map(r => <span key={r} className="px-1 py-0.5 bg-skyrim-paper/20 rounded mr-1">{r}</span>)}</div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="text-sm text-skyrim-text">Select a perk to view details.</div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-4 gap-3">
          <div className="text-sm text-skyrim-text">Staged: <span className="text-skyrim-gold font-bold">{stagedCount}</span> / {availablePoints}</div>
          <div className="flex gap-2">
            <button onClick={() => { setStagedMap({}); setStagedMaster({}); setSelected(null); onClose(); }} className="px-4 py-2 rounded border border-skyrim-border">Cancel</button>
            <button disabled={stagedCount === 0 && Object.values(stagedMaster).filter(Boolean).length === 0} onClick={() => {
              // expand stagedMap into array of ids (allow duplicates per rank)
              const expanded: string[] = [];
              for (const k of Object.keys(stagedMap)) {
                const count = stagedMap[k] || 0;
                for (let i = 0; i < count; i++) expanded.push(k);
              }
              // Append master tokens for any staged mastery
              for (const k of Object.keys(stagedMaster)) {
                if (stagedMaster[k]) expanded.push(`${k}::MASTER`);
              }
              onConfirm(expanded);
              setStagedMap({});
              setStagedMaster({});
              setSelected(null);
            }} className={`px-4 py-2 rounded ${stagedCount>0 || Object.values(stagedMaster).filter(Boolean).length>0 ? 'bg-skyrim-gold text-black' : 'bg-skyrim-paper/20 text-skyrim-text border border-skyrim-border'}`}>Confirm Unlocks</button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
