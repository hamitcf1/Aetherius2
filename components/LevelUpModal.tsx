import React, { useState } from 'react';
import ModalWrapper from './ModalWrapper';
import { Check, Sparkles } from 'lucide-react';
import { audioService } from '../services/audioService';
import { computeGoldReward, RARITY_BY_LEVEL } from '../services/levelUpRewards';


interface Props {
  open: boolean;
  onClose: () => void;
  // onConfirm now accepts attribute choice AND reward choice object
  onConfirm: (payload: { attribute: 'health' | 'magicka' | 'stamina'; reward: { type: 'gold'; amount: number } | { type: 'chest'; items: any[] } }) => void;
  // onOpenChest is called to generate chest contents (delegated to parent for access to item pool)
  onOpenChest: () => Promise<any[]>;
  // Called when user postpones the level-up to allow parent to persist chosen reward (but not grant)
  onPreparePostpone?: (payload: { rewardChoice: 'gold' | 'chest' | null; rewardGoldAmount?: number | null; chestItems?: any[] | null }) => void;
  characterName: string;
  newLevel: number;
  archetype?: string;
  // Optional helper for tests or parent-driven chest state (pre-opened contents)
  initialChestItems?: any[] | null;
}

export default function LevelUpModal({ open, onClose, onConfirm, onOpenChest, characterName, newLevel, archetype, initialChestItems }: Props) {
  const [choice, setChoice] = useState<'health' | 'magicka' | 'stamina'>('health');
  const [rewardChoice, setRewardChoice] = useState<'gold' | 'chest' | null>(null);
  const [goldAmount, setGoldAmount] = useState<number | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [chestItems, setChestItems] = useState<any[] | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Animation state: 'idle' | 'build' | 'reveal' | 'done'
  const [animStage, setAnimStage] = useState<'idle'|'build'|'reveal'|'done'>('idle');
  const [revealIndex, setRevealIndex] = useState(0);
  const revealTimerRef = React.useRef<number | null>(null);
  const buildTimerRef = React.useRef<number | null>(null);
  const openedItemsRef = React.useRef<any[] | null>(null);

  const rarityColor = (r?: string) => {
    switch ((r || '').toLowerCase()) {
      case 'epic': return 'text-purple-400';
      case 'mythic': return 'text-amber-300';
      case 'rare': return 'text-blue-300';
      case 'uncommon': return 'text-green-300';
      case 'legendary': return 'text-yellow-300';
      default: return 'text-skyrim-text/60';
    }
  };
  React.useEffect(() => {
    // Reset reward area when modal re-opens
    if (!open) { setRewardChoice(null); setGoldAmount(null); setIsOpening(false); setChestItems(null); setAnimStage('idle'); setRevealIndex(0); setIsConfirming(false); }
  }, [open]);


  // Allow tests / parents to prefill chest items (useful for integration testing / postponed rewards)
  React.useEffect(() => {
    if (open && typeof initialChestItems !== 'undefined') {
      setChestItems(initialChestItems as any[] | null);
      if (initialChestItems && initialChestItems.length > 0) {
        setAnimStage('done'); setRevealIndex(initialChestItems.length);
      }
    }
  }, [open, initialChestItems]);

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (revealTimerRef.current) { window.clearInterval(revealTimerRef.current); revealTimerRef.current = null; }
      if (buildTimerRef.current) { window.clearTimeout(buildTimerRef.current); buildTimerRef.current = null; }
    };
  }, []);

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

        {/* Reward Selection */}
        <div className="mb-4 border-t border-skyrim-border pt-3">
          <div className="text-sm text-skyrim-text mb-2">Choose a reward for this level-up (required)</div>
          <div className="flex gap-2">
            <button onClick={() => {
                setRewardChoice('gold'); if (typeof initialChestItems === 'undefined') setChestItems(null);
                // Compute gold amount immediately for clarity
                setGoldAmount(computeGoldReward(newLevel));
              }}
              className={`p-2 rounded border ${rewardChoice === 'gold' ? 'border-skyrim-gold bg-skyrim-gold/5' : 'border-skyrim-border'}`}>
              <div className="text-sm font-bold">Gold</div>
              <div className="text-xs text-skyrim-text/70">Grant coins (scales with level)</div>
            </button>

            <button onClick={() => { setRewardChoice('chest'); if (typeof initialChestItems === 'undefined') setChestItems(null); }} className={`p-2 rounded border ${rewardChoice === 'chest' ? 'border-skyrim-gold bg-skyrim-gold/5' : 'border-skyrim-border'}`}>
              <div className="text-sm font-bold">Open Chest</div>
              <div className="text-xs text-skyrim-text/70">Receive a random item</div>
            </button>
          </div>

          <div className="mt-3">
            {rewardChoice === 'gold' && (
              <div className="flex items-center gap-3">
                <div className="text-sm">Gold amount: <span className="font-bold text-skyrim-gold">{goldAmount ?? 'Calculated on confirm'}</span></div>
                <div className="text-xs text-skyrim-text/60">(shown before confirming)</div>
              </div>
            )}

            {rewardChoice === 'chest' && (
              <div className="text-sm">
                <div className="mb-2">Chest: {chestItems ? 'Opened' : 'Closed'}</div>

                {/* Preview: categories and rarity tiers */}
                <div className="mb-2 text-xs text-skyrim-text/70" data-testid="chest-preview">
                  <div><strong>Possible item categories:</strong> <span className="ml-1">weapon, apparel, potion, ingredient, food, drink, misc</span></div>
                  <div className="mt-1"><strong>Available rarities:</strong> <span className="ml-1">{(() => {
                      let allowedRarities: string[] = ['common'];
                      if (Array.isArray(RARITY_BY_LEVEL) && RARITY_BY_LEVEL.length > 0) {
                        const entry = RARITY_BY_LEVEL.find(r => newLevel <= r.maxLevel) || RARITY_BY_LEVEL[RARITY_BY_LEVEL.length - 1];
                        if (entry && entry.rarities) allowedRarities = entry.rarities;
                      }
                      return allowedRarities.join(', ');
                    })()}</span></div>
                  <div className="mt-1"><strong>Unlocks:</strong> <span className="ml-1">{(() => {
                    const next = Array.isArray(RARITY_BY_LEVEL) && RARITY_BY_LEVEL.length > 0 ? RARITY_BY_LEVEL.find(r => newLevel < r.maxLevel) : undefined;
                    return next ? `${next.rarities.slice(-1)[0]} unlocks at level ${next.maxLevel}` : 'All tiers available';
                  })()}</span></div>
                </div>

                {!chestItems && <div className="flex gap-2">
                  <button data-testid="levelup-open-chest" aria-label="Open level-up chest" onClick={async () => {
                    // Start build-up animation then reveal
                    setIsOpening(true);
                    setAnimStage('build');
                    audioService.playSoundEffect('chest_build');

                    // call parent to generate items
                    let items: any[] = [];
                    // eslint-disable-next-line no-console
                    // console.log('LevelUpModal: calling onOpenChest', onOpenChest);
                    try {
                      if (typeof onOpenChest === 'function') {
                        const res = await onOpenChest();
                        items = res || [];
                      } else {
                        items = [];
                      }
                    } catch (e) { items = []; }

                    // Set chest items immediately so skip handler can access them
                    openedItemsRef.current = items;
                    setChestItems(items);
                    // Debug: ensure items resolved correctly in tests
                    // (removed test logs)

                    // After short build, start reveal
                    buildTimerRef.current = window.setTimeout(() => {
                      // setChestItems(items); // already set above

                      if (!items || items.length === 0) {
                        // No items: show a small message and finish
                        setAnimStage('done');
                        setIsOpening(false);
                        audioService.playSoundEffect('chest_empty');
                      } else {
                        setAnimStage('reveal');
                        setRevealIndex(0);
                        audioService.playSoundEffect('chest_open');
                        // Reveal items one by one
                        revealTimerRef.current = window.setInterval(() => {
                          setRevealIndex(prev => {
                            const next = prev + 1;
                            if (next >= items.length) {
                              // finish
                              if (revealTimerRef.current) { window.clearInterval(revealTimerRef.current); revealTimerRef.current = null; }
                              setAnimStage('done');
                              setIsOpening(false);
                              return items.length;
                            }
                            return next;
                          });
                        }, 700);
                      }
                    }, 650);
                  }} disabled={isOpening || animStage !== 'idle'} className="px-3 py-1 rounded bg-skyrim-paper/20">{isOpening ? (animStage === 'build' ? 'Preparing…' : 'Opening…') : 'Open Chest'}</button>
                </div>}

                {/* Skip button during reveal/build (render regardless of chestItems so skip remains available while items are being fetched) */}
                {(animStage === 'build' || animStage === 'reveal') && (
                  <div className="mt-0">
                    <button data-testid="levelup-skip-chest" aria-label="Skip chest reveal" onClick={() => {
                      // Skip: jump to final reveal immediately
                      if (buildTimerRef.current) { window.clearTimeout(buildTimerRef.current); buildTimerRef.current = null; }
                      if (revealTimerRef.current) { window.clearInterval(revealTimerRef.current); revealTimerRef.current = null; }
                      // Use the latest chestItems (set earlier) or openedItemsRef to immediately reveal
                      const itemsNow = openedItemsRef.current || chestItems || [];
                      setRevealIndex(itemsNow.length || 0);
                      setAnimStage('done');
                      setIsOpening(false);
                      audioService.playSoundEffect('chest_skip');
                    }} className="px-3 py-1 rounded border border-skyrim-border">Skip</button>
                  </div>
                )}
                {chestItems && chestItems.length > 0 && (
                  <div className="mt-2 grid grid-cols-1 gap-2" data-testid="chest-items">
                    {chestItems.map((it, idx) => {
                      const visible = animStage === 'done' || idx < revealIndex;
                      return (
                        <div key={idx} className={`p-2 rounded border border-skyrim-border bg-skyrim-paper/20 text-sm flex items-center justify-between ${visible ? 'opacity-100' : 'opacity-0'}`} role={visible ? 'group' : undefined} aria-hidden={!visible}>
                          <div>
                            <div className={`font-bold ${visible ? rarityColor(it.rarity) : ''}`}>{visible ? it.name : '—'}</div>
                            <div className="text-xs text-skyrim-text/60">{visible ? `${it.type} • ${it.rarity || 'common'} • x${it.quantity || 1}` : ''}</div>
                          </div>
                          <div className="text-xs text-green-300">Will be added on confirm</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Small chest-opening animation / visual feedback with ARIA live */}
                <div aria-live="polite" className="mt-3 h-12 flex items-center gap-2">
                  <div className={`w-10 h-10 rounded flex items-center justify-center text-skyrim-paper bg-skyrim-dark/20 ${isOpening ? 'animate-bounce scale-110' : ''}`}>
                    <span className="text-xl">🧰</span>
                  </div>
                  <div className="text-sm text-skyrim-text/70">
                    {animStage === 'build' && (
                      <div className="flex items-center gap-2"><Sparkles size={14} className="text-amber-400 animate-pulse" /> Building momentum…</div>
                    )}
                    {animStage === 'reveal' && (
                      <div className="flex items-center gap-2"><Sparkles size={14} className="text-amber-400 animate-pulse" /> Revealing rewards…</div>
                    )}
                    {animStage === 'done' && chestItems && chestItems.length > 0 && (
                      <div className="text-green-300">Chest opened!</div>
                    )}
                    {animStage === 'done' && chestItems && chestItems.length === 0 && (
                      <div className="text-skyri m-text/60">Chest yielded no items.</div>
                    )}
                    {animStage === 'idle' && chestItems === null && (
                      <div className="text-skyrim-text/60">Chest is closed.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => {
              // Let parent persist rewardChoice when postponing if requested
              if (typeof onPreparePostpone === 'function') {
                onPreparePostpone({ rewardChoice, rewardGoldAmount: rewardChoice === 'gold' ? computeGoldReward(newLevel) : null, chestItems });
              }
              onClose();
            }} data-sfx="button_click" className="px-4 py-2 rounded bg-transparent border border-skyrim-border text-sm">Later</button>

          <button onClick={async () => {
              // Prevent confirming unless reward selection is complete; if chest chosen, chest must be opened
              if (!rewardChoice) return;
              if (rewardChoice === 'chest' && !chestItems) return;

              // Prevent double-clicks by disabling the confirm button immediately
              setIsConfirming(true);
              try {
                if (rewardChoice === 'gold') {
                  // Compute amount locally if parent didn't provide
                  const amount = computeGoldReward(newLevel);
                  await onConfirm({ attribute: choice, reward: { type: 'gold', amount } } as any);
                } else {
                  await onConfirm({ attribute: choice, reward: { type: 'chest', items: chestItems || [] } } as any);
                }
              } finally {
                // Modal will usually unmount after confirm; keep isConfirming true until unmount to avoid re-click
              }
            }} disabled={!rewardChoice || (rewardChoice === 'chest' && !chestItems) || isConfirming} className={`px-4 py-2 rounded bg-skyrim-gold text-black text-sm ${(!rewardChoice || (rewardChoice === 'chest' && !chestItems) || isConfirming) ? 'opacity-50 cursor-not-allowed' : ''}`}>Confirm</button>
        </div>
      </div>
    </ModalWrapper>
  );
}
