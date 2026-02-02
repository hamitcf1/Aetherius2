import React, { useState, useMemo } from 'react';
import ModalWrapper from './ModalWrapper';
import { PERK_DEFINITIONS, PerkDef } from '../data/perkDefinitions';
import PERK_BALANCE from '../data/perkBalance';
import { Perk, Character } from '../types';
import { Check, Lock, ChevronDown, ChevronRight, Sparkles, Shield, Sword, Heart, Star, RefreshCcw } from 'lucide-react';
import { useLocalization } from '../services/localization';

interface Props {
  open: boolean;
  onClose: () => void;
  character: Character;
  onConfirm: (perkIds: string[]) => void;
  onForceUnlock?: (perkId: string) => void;
  onRefundAll?: () => void;
}

const SKILL_CATEGORIES: Record<string, { skills: string[] }> = {
  attributes: { skills: ['Health', 'Magicka', 'Stamina', 'Luck'] },
  combat: { skills: ['One-Handed', 'Two-Handed', 'Block', 'Archery', 'Combat', 'Unarmed'] },
  armor: { skills: ['Light Armor', 'Heavy Armor'] },
  magic: { skills: ['Destruction', 'Restoration', 'Conjuration', 'Alteration', 'Illusion'] },
  stealth: { skills: ['Sneak'] },
};

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
    if (parsed.id === 'level') return (char.level || 0) >= parsed.rank;
    return currentPerkRank(char, parsed.id) >= parsed.rank;
  });
}

export default function PerkTreeModal({ open, onClose, character, onConfirm, onForceUnlock, onRefundAll }: Props) {
  const { t } = useLocalization();
  const [selected, setSelected] = useState<string | null>(null);
  const [stagedMap, setStagedMap] = useState<Record<string, number>>({});
  const [stagedMaster, setStagedMaster] = useState<Record<string, boolean>>({});

  const STORAGE_KEY_PREFIX = 'aetherius:perkTree:expanded:';
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    // Default to all expanded
    const init: Record<string, boolean> = {};
    Object.keys(SKILL_CATEGORIES).forEach(k => init[k] = true);
    return init;
  });

  // Load per-character persisted state when character changes
  React.useEffect(() => {
    try {
      const charId = character?.id;
      if (!charId) return;
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${charId}`);
      if (raw) setExpandedCategories(JSON.parse(raw) as Record<string, boolean>);
    } catch (e) { /* ignore */ }
  }, [character?.id]);

  // Persist changes per-character
  React.useEffect(() => {
    try {
      const charId = character?.id;
      if (!charId) return;
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${charId}`, JSON.stringify(expandedCategories));
    } catch (e) { /* ignore */ }
  }, [expandedCategories, character?.id]);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);

  const defs = useMemo(() => PERK_DEFINITIONS, []);

  const perksByCategory = useMemo(() => {
    const grouped: Record<string, PerkDef[]> = {};
    Object.entries(SKILL_CATEGORIES).forEach(([catKey, cat]) => {
      grouped[catKey] = defs.filter(d => cat.skills.includes(d.skill || ''));
    });
    return grouped;
  }, [defs]);

  const availablePoints = character.perkPoints || 0;
  const stagedCount: number = (Object.values(stagedMap) as number[]).reduce((sum, v) => sum + (v || 0), 0);
  const stagedMasterCost: number = Object.keys(stagedMaster).reduce<number>((sum, k) => {
    if (!stagedMaster[k]) return sum;
    const def = defs.find(d => d.id === k);
    return sum + (def?.masteryCost || 3);
  }, 0);
  const stagedPoints = Math.max(0, stagedCount + stagedMasterCost);
  const remainingPoints = availablePoints - stagedPoints;

  const statusOf = (def: PerkDef) => {
    const curr = currentPerkRank(character, def.id);
    const max = def.maxRank || 1;
    if (curr >= max) return 'unlocked';
    if (prerequisitesMet(character, def)) return 'available';
    return 'locked';
  };

  const stagedFor = (id: string) => stagedMap[id] || 0;
  const toggleCategory = (cat: string) => setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  const selectedDef = selected ? defs.find(d => d.id === selected) : null;

  // Calculate total points spent on perks
  const totalSpentOnPerks = useMemo(() => {
    return (character.perks || []).reduce((sum, p) => {
      const def = defs.find(d => d.id === p.id);
      const rankCost = p.rank || 0;
      const masteryCost = (p.mastery || 0) * (def?.masteryCost || 3);
      return sum + rankCost + masteryCost;
    }, 0);
  }, [character.perks, defs]);

  const handleRefundAll = () => {
    setShowRefundConfirm(false);
    onRefundAll?.();
  };

  const formatRequirement = (req: string): string => {
    const parsed = parseRequirement(req);
    if (parsed.id === 'level') return `${t('map.level')} ${parsed.rank}`;
    // Fetch localized name if possible
    const localizedName = t(`perks.data.${parsed.id}.name`);
    // Fallback to definition name if localized key not found/same
    const def = PERK_DEFINITIONS.find(d => d.id === parsed.id);
    const name = (localizedName !== `perks.data.${parsed.id}.name` ? localizedName : def?.name) || parsed.id;

    return parsed.rank > 1 ? `${name} ${t('perks.rank')} ${parsed.rank}` : name;
  };

  return (
    <ModalWrapper open={open} onClose={onClose} preventOutsideClose>
      <div className="w-full max-w-[900px] h-[min(85vh,700px)] flex flex-col bg-skyrim-paper rounded border border-skyrim-border overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-skyrim-border bg-skyrim-dark/30">
          <h3 className="text-lg font-bold text-skyrim-gold flex items-center gap-2">
            <Sparkles size={18} /> {t('perks.title')}
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-sm text-skyrim-text">
              {t('perks.points')}: <span className="font-bold text-skyrim-gold">{availablePoints}</span>
              {stagedPoints > 0 && <span className="ml-2 text-amber-400">(-{stagedPoints})</span>}
              {totalSpentOnPerks > 0 && <span className="ml-2 text-blue-300">({totalSpentOnPerks} {t('perks.spent')})</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setExpandedCategories(Object.keys(SKILL_CATEGORIES).reduce((acc: any, k) => (acc[k] = true, acc), {} as Record<string, boolean>))}
                className="px-2 py-1 text-xs bg-skyrim-paper/20 text-skyrim-text rounded hover:bg-skyrim-paper/30">{t('perks.expandAll')}</button>
              <button onClick={() => setExpandedCategories(Object.keys(SKILL_CATEGORIES).reduce((acc: any, k) => (acc[k] = false, acc), {} as Record<string, boolean>))}
                className="px-2 py-1 text-xs bg-skyrim-paper/20 text-skyrim-text rounded hover:bg-skyrim-paper/30">{t('perks.collapseAll')}</button>
            </div>
            {totalSpentOnPerks > 0 && onRefundAll && (
              <button onClick={() => setShowRefundConfirm(true)} className="px-2 py-1 text-xs bg-red-600/20 text-red-300 rounded hover:bg-red-600/30 flex items-center gap-1">
                <RefreshCcw size={12} /> {t('perks.refund')}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 border-r border-skyrim-border overflow-y-auto p-2">
            {Object.entries(SKILL_CATEGORIES).map(([catKey, cat]) => {
              const perks = perksByCategory[catKey] || [];
              if (perks.length === 0) return null;
              const isExpanded = expandedCategories[catKey];
              const availableCount = perks.filter(p => statusOf(p) === 'available').length;
              const unlockedCount = perks.filter(p => statusOf(p) === 'unlocked').length;

              return (
                <div key={catKey} className="mb-1">
                  <button onClick={() => toggleCategory(catKey)} className="w-full flex items-center justify-between p-2 rounded hover:bg-skyrim-gold/10">
                    <span className="text-skyrim-gold font-medium">{t(`perks.categories.${catKey}`)}</span>
                    <div className="flex items-center gap-2">
                      {availableCount > 0 && <span className="text-xs px-1.5 py-0.5 bg-amber-600/30 text-amber-300 rounded">{availableCount}</span>}
                      {unlockedCount > 0 && <span className="text-xs px-1.5 py-0.5 bg-green-600/30 text-green-300 rounded">{unlockedCount}</span>}
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="ml-2 space-y-0.5">
                      {perks.map(def => {
                        const st = statusOf(def);
                        const curr = currentPerkRank(character, def.id);
                        const max = def.maxRank || 1;
                        const staged = stagedFor(def.id);
                        const isSelected = selected === def.id;
                        const mastery = (character.perks || []).find(p => p.id === def.id)?.mastery || 0;
                        const perRank = def.effect?.type === 'stat' ? (def.effect?.amount || 0) : null;
                        const currentContribution = perRank ? (perRank * curr) : null;
                        const name = t(`perks.data.${def.id}.name`) || def.name;

                        return (
                          <button key={def.id} onClick={() => setSelected(def.id)}
                            className={`w-full flex items-center justify-between p-1.5 rounded text-left text-sm ${isSelected ? 'bg-skyrim-gold/20 ring-1 ring-skyrim-gold' : 'hover:bg-skyrim-paper/50'}`}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${st === 'unlocked' ? 'bg-green-600/40 text-green-400' : st === 'available' ? 'bg-amber-600/40 text-amber-400' : 'bg-gray-600/40 text-gray-500'}`}>
                                {st === 'unlocked' ? <Check size={10} /> : st === 'locked' ? <Lock size={10} /> : <Star size={10} />}
                              </span>
                              <div className="truncate">
                                <div className={`${st === 'locked' ? 'text-skyrim-text/50' : ''}`}>{name}</div>
                                {perRank !== null && (
                                  <div className="text-[10px] text-skyrim-text/60 mt-0.5">+{perRank} {def.effect?.key} / {t('perks.rank').toLowerCase()} • {t('perks.current')} +{currentContribution}</div>
                                )}
                              </div>
                              {staged > 0 && <span className="text-xs px-1 bg-skyrim-gold/30 text-skyrim-gold rounded">+{staged}</span>}
                              {mastery > 0 && <span className="text-xs px-1 bg-purple-600/30 text-purple-300 rounded">M{mastery}</span>}
                            </div>
                            <span className={`text-xs ml-2 ${curr >= max ? 'text-green-400' : st === 'available' ? 'text-amber-400' : 'text-skyrim-text/50'}`}>
                              {curr + staged}/{max}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-1/2 p-4 overflow-y-auto bg-skyrim-dark/10">
            {selectedDef ? (() => {
              const name = t(`perks.data.${selectedDef.id}.name`) || selectedDef.name;
              const description = t(`perks.data.${selectedDef.id}.description`) || selectedDef.description;
              const statusLabel = st => {
                if (st === 'unlocked') return t('map.filter.unlocked');
                if (st === 'available') return t('spells.learn'); // "Learn" / "Available" equivalent? 
                // Actually map.filter.unlocked is "Unlocked" (Açık).
                // PerkTreeModal used Unlocked/Available/Locked.
                // I'll stick to upper case English key lookups or use statusOf(selectedDef).toUpperCase().
                // Let's use localized strings for these if possible, or leave as technical terms.
                // I'll just uppercase the status for now as strict localization for status enums wasn't added specifically.
                // Wait, I can use: 'UNLOCKED', 'AVAILABLE', 'LOCKED' translations if I added them?
                // I'll just use English status as UI label for now unless I add generic status keys.
                return st.toUpperCase();
              };

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-skyrim-gold">{name}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${statusOf(selectedDef) === 'unlocked' ? 'bg-green-600/30 text-green-300' : statusOf(selectedDef) === 'available' ? 'bg-amber-600/30 text-amber-300' : 'bg-gray-600/40 text-gray-400'}`}>{statusOf(selectedDef).toUpperCase()}</span>
                  </div>
                  <div className="text-xs text-skyrim-text/70">{selectedDef.skill}</div>
                  <p className="text-sm text-skyrim-text">{description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-skyrim-paper/30 rounded">
                      <div className="text-skyrim-text/70">{t('perks.rank')}</div>
                      <div className="text-skyrim-gold font-bold">{currentPerkRank(character, selectedDef.id)}/{selectedDef.maxRank || 1}</div>
                    </div>
                    <div className="p-2 bg-skyrim-paper/30 rounded">
                      <div className="text-skyrim-text/70">{t('perks.masterCost')}</div>
                      <div className="text-amber-400 font-bold">{selectedDef.masteryCost || 3} pts</div>
                    </div>
                  </div>

                  {selectedDef.effect?.type === 'stat' && (
                    <div className="p-2 bg-skyrim-paper/20 rounded border border-skyrim-border text-xs">
                      <span className="text-skyrim-text/70">{t('perks.perRank')} </span>
                      <span className="text-skyrim-gold">+{selectedDef.effect.amount} {selectedDef.effect.key}</span>
                      <span className="text-skyrim-text/70 ml-2">| {t('perks.current')} </span>
                      <span className="text-skyrim-gold">+{(selectedDef.effect.amount || 0) * currentPerkRank(character, selectedDef.id)}</span>
                    </div>
                  )}

                  {statusOf(selectedDef) === 'locked' && selectedDef.requires && (
                    <div className="p-2 bg-red-900/20 rounded border border-red-800/30 text-xs">
                      <div className="text-red-400 mb-1">{t('perks.requires')}</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedDef.requires.map(r => (
                          <span key={r} className="px-2 py-0.5 bg-red-900/30 text-red-300 rounded">{formatRequirement(r)}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {statusOf(selectedDef) === 'available' && remainingPoints >= 1 && currentPerkRank(character, selectedDef.id) + stagedFor(selectedDef.id) < (selectedDef.maxRank || 1) && (
                      <button onClick={() => setStagedMap(m => ({ ...m, [selectedDef.id]: (m[selectedDef.id] || 0) + 1 }))}
                        className="px-3 py-1.5 bg-skyrim-gold text-black rounded font-medium text-sm hover:bg-amber-400">
                        {t('perks.stage')}{stagedFor(selectedDef.id) > 0 ? ` (+${stagedFor(selectedDef.id)})` : ''}
                      </button>
                    )}
                    {stagedFor(selectedDef.id) > 0 && (
                      <button onClick={() => setStagedMap(m => {
                        const next = { ...m };
                        next[selectedDef.id] = Math.max(0, (next[selectedDef.id] || 0) - 1);
                        if (next[selectedDef.id] === 0) delete next[selectedDef.id];
                        return next;
                      })} className="px-3 py-1.5 border border-skyrim-gold text-skyrim-gold rounded text-sm hover:bg-skyrim-gold/10">{t('perks.undo')}</button>
                    )}
                    {currentPerkRank(character, selectedDef.id) >= (selectedDef.maxRank || 1) && !stagedMaster[selectedDef.id] && remainingPoints >= (selectedDef.masteryCost || 3) && (
                      <button onClick={() => setStagedMaster(s => ({ ...s, [selectedDef.id]: true }))}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-500">{t('perks.master')}</button>
                    )}
                    {stagedMaster[selectedDef.id] && (
                      <button onClick={() => setStagedMaster(s => ({ ...s, [selectedDef.id]: false }))}
                        className="px-3 py-1.5 border border-purple-400 text-purple-400 rounded text-sm">{t('perks.cancelMaster')}</button>
                    )}
                    {statusOf(selectedDef) === 'locked' && onForceUnlock && (character.perkPoints || 0) >= 3 && (character.forcedPerkUnlocks || 0) < 3 && (
                      <button onClick={() => onForceUnlock(selectedDef.id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-500">{t('perks.force')} (3pts)</button>
                    )}
                  </div>
                </div>
              );
            })() : (
              <div className="h-full flex items-center justify-center text-skyrim-text/50">
                <div className="text-center">
                  <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
                  <p>{t('perks.selectPrompt')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-3 border-t border-skyrim-border bg-skyrim-dark/30">
          <div className="text-sm text-skyrim-text">
            {stagedCount > 0 && <span><span className="text-skyrim-gold font-bold">{stagedCount}</span> {t('perks.staged')} <span className="text-amber-400">({stagedPoints}pts)</span></span>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => {
              if (stagedPoints > 0 || Object.keys(stagedMaster).length > 0) {
                setStagedMap({}); setStagedMaster({}); setSelected(null); onClose();
              } else {
                onClose();
              }
            }}
              className="px-4 py-1.5 rounded border border-skyrim-border text-skyrim-text hover:bg-skyrim-paper/30">{(stagedPoints > 0 || Object.keys(stagedMaster).length > 0) ? t('perks.cancel') : t('perks.leave')}</button>
            <button disabled={stagedPoints === 0 || stagedPoints > availablePoints}
              onClick={() => {
                const expanded: string[] = [];
                Object.keys(stagedMap).forEach(k => { for (let i = 0; i < (stagedMap[k] || 0); i++) expanded.push(k); });
                Object.keys(stagedMaster).forEach(k => { if (stagedMaster[k]) expanded.push(`${k}::MASTER`); });
                onConfirm(expanded);
                setStagedMap({});
                setStagedMaster({});
                setSelected(null);
              }}
              className={`px-4 py-1.5 rounded font-medium ${stagedPoints > 0 && stagedPoints <= availablePoints ? 'bg-skyrim-gold text-black hover:bg-amber-400' : 'bg-gray-600/30 text-gray-500 cursor-not-allowed'}`}>
              {t('perks.confirm')} ({stagedPoints})
            </button>
          </div>
        </div>
      </div>

      {showRefundConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-skyrim-paper p-4 rounded border border-skyrim-border max-w-md">
            <h4 className="font-semibold text-lg text-skyrim-gold">{t('perks.refund')}?</h4>
            <p className="text-sm text-skyrim-text mt-2" dangerouslySetInnerHTML={{
              __html: t('perks.refundDesc', {
                count: `<span class="text-red-400 font-bold">${(character.perks || []).length}</span>`,
                points: `<span class="text-green-400 font-bold">${totalSpentOnPerks}</span>`
              })
            }} />
            <p className="text-xs text-skyrim-text/70 mt-2">
              {t('perks.reallocateDesc')}
            </p>
            <div className="flex gap-2 mt-4">
              <button onClick={handleRefundAll} className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-500">
                {t('perks.refund')} ({totalSpentOnPerks} pts)
              </button>
              <button onClick={() => setShowRefundConfirm(false)} className="flex-1 px-3 py-2 border border-skyrim-border text-skyrim-text rounded hover:bg-skyrim-paper/30">
                {t('perks.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalWrapper>
  );
}
