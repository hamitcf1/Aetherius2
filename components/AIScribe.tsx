import React, { useState, useEffect, useCallback } from 'react';
import { generateGameMasterResponse, generateLoreImage } from '../services/geminiService';
import { GameStateUpdate } from '../types';
import { Sparkles, X, Scroll, Loader2, Play, Image as ImageIcon, User, Brain, Wand2 } from 'lucide-react';
import type { PreferredAIModel } from '../services/geminiService';

// Quick prompts for hero detail generation
const HERO_DETAIL_PROMPTS = [
  { key: 'all', label: 'Generate All Details', prompt: 'Based on the character\'s name, race, gender, and archetype, generate complete hero details including: identity, psychology, breaking point, moral code, fears, weaknesses, talents, magic approach, faction allegiance, worldview, daedric perception, forced behavior, long-term evolution, and a detailed backstory. Make it lore-appropriate for Skyrim.' },
  { key: 'backstory', label: 'Backstory', prompt: 'Generate a detailed, immersive backstory for this character based on their race, gender, and archetype. Include childhood, formative events, and what brought them to their current situation in Skyrim.' },
  { key: 'psychology', label: 'Psychology & Identity', prompt: 'Generate the character\'s core identity, psychology, breaking point, and moral code based on their race and archetype.' },
  { key: 'fears', label: 'Fears & Weaknesses', prompt: 'Generate appropriate fears and weaknesses for this character based on their race and background.' },
  { key: 'talents', label: 'Talents & Magic', prompt: 'Generate the character\'s natural talents and their approach to magic based on their race and archetype.' },
  { key: 'worldview', label: 'Worldview & Factions', prompt: 'Generate the character\'s worldview, faction allegiance, and perception of Daedra based on their race and background.' },
  { key: 'evolution', label: 'Evolution & Behavior', prompt: 'Generate forced behaviors/rituals and a long-term character evolution arc from level 1-50 for this character.' },
];

interface AIScribeProps {
  contextData: string;
  onUpdateState: (updates: GameStateUpdate) => void;
  model?: PreferredAIModel | string;
}

export const AIScribe: React.FC<AIScribeProps> = ({ contextData, onUpdateState, model }) => {
  const [batchInput, setBatchInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<GameStateUpdate | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'action' | 'hero'>('action'); // Mode toggle
  // --- Consult Game Master button visibility ---
  const [showConsultButton, setShowConsultButton] = useState(() => {
    try {
      const stored = localStorage.getItem('showConsultGameMaster');
      return stored === 'true';
    } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('showConsultGameMaster', showConsultButton ? 'true' : 'false'); } catch {}
  }, [showConsultButton]);
  // --- Draggable state for button ---
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [buttonPos, setButtonPos] = useState(() => {
    const isMobile = window.innerWidth <= 600;
    return {
      x: isMobile ? window.innerWidth - 60 : window.innerWidth - 200,
      y: window.innerHeight - 100
    };
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedSide, setCollapsedSide] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null);

  // ESC key and body scroll lock
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);
  
  // Handle vertical-only drag events (mouse and touch)
  useEffect(() => {
    function handleMove(e) {
      if (!isDragging) return;
      setHasDragged(true);
      let clientY;
      if (e.touches && e.touches.length > 0) {
        clientY = e.touches[0].clientY;
      } else {
        clientY = e.clientY;
      }
      const buttonHeight = window.innerWidth <= 600 ? 70 : 60;
      const newY = clientY - dragOffset.y;
      setButtonPos(pos => ({ x: pos.x, y: Math.max(0, Math.min(window.innerHeight - buttonHeight, newY)) }));
    }
    function handleUp() {
      setIsDragging(false);
    }
    if (isDragging) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      document.addEventListener('touchmove', handleMove);
      document.addEventListener('touchend', handleUp);
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Mouse/touch down for vertical drag only
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    let clientY;
    if ('touches' in e && e.touches.length > 0) {
      clientY = e.touches[0].clientY;
    } else {
      // @ts-ignore
      clientY = e.clientY;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: 0, // lock horizontal
      y: clientY - rect.top
    });
    setIsDragging(true);
    setHasDragged(false);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    if (!hasDragged) {
      if (isCollapsed) {
        // Uncollapse button
        setIsCollapsed(false);
        setCollapsedSide(null);
        const isMobile = window.innerWidth <= 600;
        const buttonWidth = isMobile ? 60 : 200;
        const buttonHeight = isMobile ? 70 : 60;
        setButtonPos({
          x: Math.max(10, Math.min(window.innerWidth - buttonWidth - 10, buttonPos.x)),
          y: Math.max(10, Math.min(window.innerHeight - buttonHeight - 10, buttonPos.y))
        });
      } else {
        setIsOpen(true);
      }
    }
  };

  const parseBatchInput = (text: string): GameStateUpdate | null => {
    const raw = (text || '').trim();
    if (!raw) return null;

    const parts = raw
      .split(/\n|,|\band\b/gi)
      .map(s => s.trim())
      .filter(Boolean);

    const newItems: NonNullable<GameStateUpdate['newItems']> = [];
    let goldChange = 0;

    for (const part of parts) {
      const goldMatch = part.match(/(\d+)\s*(?:x\s*)?(?:gold|septim|septims)\b/i);
      if (goldMatch) {
        goldChange += parseInt(goldMatch[1], 10) || 0;
        continue;
      }

      // Match: "6x iron mace" or "6 iron mace"
      const qtyMatch = part.match(/^(\d+)\s*x?\s+(.+)$/i);
      if (qtyMatch) {
        const quantity = Math.max(1, parseInt(qtyMatch[1], 10) || 1);
        const name = qtyMatch[2].trim();
        if (name) {
          newItems.push({ name, type: 'misc', description: '', quantity });
        }
        continue;
      }

      // Fallback: treat as 1x item name
      if (part) {
        newItems.push({ name: part, type: 'misc', description: '', quantity: 1 });
      }
    }

    const updates: GameStateUpdate = {};
    if (newItems.length > 0) updates.newItems = newItems;
    if (goldChange !== 0) updates.goldChange = goldChange;

    return Object.keys(updates).length ? updates : null;
  };

  const mergeUpdates = (base: GameStateUpdate, extra: GameStateUpdate | null): GameStateUpdate => {
    if (!extra) return base;
    return {
      ...base,
      newItems: [...(base.newItems || []), ...(extra.newItems || [])],
      newQuests: [...(base.newQuests || []), ...(extra.newQuests || [])],
      updateQuests: [...(base.updateQuests || []), ...(extra.updateQuests || [])],
      removedItems: [...(base.removedItems || []), ...(extra.removedItems || [])],
      statUpdates: { ...(base.statUpdates || {}), ...(extra.statUpdates || {}) },
      goldChange: (base.goldChange || 0) + (extra.goldChange || 0),
      xpChange: (base.xpChange || 0) + (extra.xpChange || 0),
      narrative: base.narrative || extra.narrative,
    };
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setLastResponse(null);
    setGeneratedImage(null);
    try {
      const updates = await generateGameMasterResponse(prompt, contextData, { model });
      setLastResponse(updates);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVisualize = async () => {
      if (!lastResponse?.narrative?.content) return;
      setImageLoading(true);
      try {
          const img = await generateLoreImage(`Skyrim fantasy art style, dramatic lighting, concept art, atmospheric, highly detailed: ${lastResponse.narrative.content.substring(0, 300)}`);
          setGeneratedImage(img);
      } catch(e) {
          console.error(e);
      } finally {
          setImageLoading(false);
      }
  };

  const handleApply = () => {
      if (lastResponse) {
          const batchUpdates = parseBatchInput(batchInput);
          const merged = mergeUpdates(lastResponse, batchUpdates);
          onUpdateState(merged);
          setIsOpen(false);
          setPrompt('');
          setBatchInput('');
          setLastResponse(null);
          setGeneratedImage(null);
      }
  };

  const handleApplyBatchOnly = () => {
    const updates = parseBatchInput(batchInput);
    if (!updates) return;
    onUpdateState(updates);
    setIsOpen(false);
    setPrompt('');
    setBatchInput('');
    setLastResponse(null);
    setGeneratedImage(null);
  };

  if (!isOpen) {
    return (
      <>
        {/* Minimal tab to unhide the button, fixed to side, only if hidden */}
        {!showConsultButton && (
          <button
            onMouseDown={e => {
              e.preventDefault();
              const rect = e.currentTarget.getBoundingClientRect();
              setDragOffset({
                x: 0, // lock horizontal
                y: e.clientY - rect.top
              });
              setIsDragging(true);
            }}
            onClick={() => setShowConsultButton(true)}
            className="fixed z-50 bg-skyrim-gold text-skyrim-dark rounded-l-lg shadow-lg border-2 border-skyrim-dark font-serif font-bold opacity-80 hover:opacity-100 gm-toggle-btn"
            style={{
              top: `${buttonPos.y}px`,
              right: 0,
              minWidth: window.innerWidth <= 600 ? 50 : 32,
              minHeight: window.innerWidth <= 600 ? 60 : 48,
              writingMode: window.innerWidth <= 600 ? 'horizontal-tb' : 'vertical-rl',
              fontSize: window.innerWidth <= 600 ? 14 : 12,
              letterSpacing: 1,
              padding: window.innerWidth <= 600 ? '4px 8px' : 0,
              cursor: isDragging ? 'grabbing' : 'grab',
              transition: isDragging ? 'none' : 'all 0.3s ease',
              zIndex: 9999,
            }}
            aria-label="Show Consult Game Master"
          >
            GM
          </button>
        )}
        {/* Consult Game Master button, only if visible */}
        {showConsultButton && (
          <button
            onClick={() => setShowConsultButton(false)}
            className="fixed top-1/2 right-0 z-50 px-2 py-1 bg-skyrim-gold text-skyrim-dark rounded-l-lg shadow-lg border-2 border-skyrim-dark font-serif font-bold opacity-80 hover:opacity-100"
            style={{
              transform: 'translateY(-50%)',
              minWidth: window.innerWidth <= 600 ? 40 : 32,
              minHeight: window.innerWidth <= 600 ? 50 : 48,
              writingMode: window.innerWidth <= 600 ? 'horizontal-tb' : 'vertical-rl',
              fontSize: window.innerWidth <= 600 ? 14 : 12,
              letterSpacing: 1,
              padding: window.innerWidth <= 600 ? '4px 8px' : 0
            }}
            aria-label="Hide Consult Game Master"
          >
            ×
          </button>
        )}
        {showConsultButton && (
          <button
            onMouseDown={handleMouseDown}
            onClick={handleButtonClick}
            className={`fixed top-1/2 right-10 z-50 p-3 bg-skyrim-gold hover:bg-skyrim-goldHover text-skyrim-dark rounded-full shadow-lg border-2 border-skyrim-dark transition-transform hover:scale-105 flex items-center gap-2 font-serif font-bold ${
              isCollapsed ? 'opacity-70 scale-75' : ''
            }`}
            style={{
              transform: 'translateY(-50%)',
              minWidth: window.innerWidth <= 600 ? 50 : 44,
              minHeight: window.innerWidth <= 600 ? 50 : 44,
              maxWidth: '90vw',
              maxHeight: '90vw',
              fontSize: window.innerWidth <= 600 ? 12 : 14,
              padding: window.innerWidth <= 600 ? '8px' : 0,
              boxSizing: 'border-box'
            }}
            title={isCollapsed ? 'Click to restore' : 'Consult the Game Master (drag to move)'}
          >
            <Sparkles size={20} />
            {!isCollapsed && <span className="hidden md:inline">Consult Game Master</span>}
          </button>
        )}
      </>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-skyrim-dark/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
    >
      <div className="bg-skyrim-paper border border-skyrim-gold w-full max-w-lg rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-skyrim-border flex justify-between items-center bg-skyrim-dark/50 rounded-t-lg">
          <h3 className="text-skyrim-gold font-serif text-xl flex items-center gap-2">
            <Scroll size={20} />
            The Game Master
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-skyrim-text hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mode === 'action' ? (
            <>
              <p className="text-sm text-skyrim-text italic">
                "What action should your hero take? Describe what you want to happen next."
              </p>

              <div>
                <label className="block text-skyrim-gold text-sm font-bold mb-2">
                  Action Request
                </label>
                <textarea
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full bg-skyrim-paper/30 border border-skyrim-border text-skyrim-text p-3 rounded focus:border-skyrim-gold focus:outline-none normal-case text-sm"
                  rows={4}
                  placeholder="e.g., My character should explore the nearby ruins... or, Have my hero confront the bandit leader..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
            </>
          ) : (
          <>
            <p className="text-sm text-skyrim-text italic">
              "Let me craft your hero's soul. Choose a quick fill or describe what you want."
            </p>

            {/* Quick Fill Buttons */}
            <div className="space-y-2">
              <label className="block text-skyrim-gold text-sm font-bold">Quick Fill</label>
              <div className="grid grid-cols-2 gap-2">
                {HERO_DETAIL_PROMPTS.map(hp => (
                  <button
                    key={hp.key}
                    onClick={() => setPrompt(hp.prompt)}
                    disabled={loading}
                    className={`px-3 py-2 text-xs rounded border transition-colors flex items-center gap-1.5 ${
                      prompt === hp.prompt
                        ? 'bg-skyrim-gold/20 border-skyrim-gold text-skyrim-gold'
                        : 'bg-skyrim-paper/30 border-skyrim-border text-skyrim-text hover:border-skyrim-gold/50 hover:text-gray-100'
                    }`}
                  >
                    <Wand2 size={12} />
                    {hp.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-skyrim-gold text-sm font-bold mb-2">
                Custom Request
              </label>
              <textarea
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full bg-skyrim-paper/30 border border-skyrim-border text-skyrim-text p-3 rounded focus:border-skyrim-gold focus:outline-none normal-case text-sm"
                rows={3}
                placeholder="e.g., Generate a tragic backstory involving the Great War... or, Make my character fear magic due to a childhood accident..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
          </>
        )}

          {lastResponse && (
            <div className="bg-skyrim-paper/20 p-4 rounded border border-skyrim-border/50 animate-in fade-in">
              <h4 className="text-xs uppercase tracking-widest text-skyrim-gold mb-2">
                {lastResponse.characterUpdates && Object.keys(lastResponse.characterUpdates).length > 0 
                  ? 'Hero Details Generated' 
                  : 'Outcome'}
              </h4>
              {lastResponse.narrative && (
                <>
                  <h5 className="font-serif text-lg text-white mb-1">{lastResponse.narrative?.title}</h5>
                  <p className="text-skyrim-text whitespace-pre-wrap text-sm leading-relaxed font-serif mb-4">
                    {lastResponse.narrative?.content}
                  </p>
                </>
              )}
              
              {generatedImage && (
                  <div className="mb-4 relative group">
                      <img src={generatedImage} alt="Generated Scene" className="w-full rounded border border-skyrim-border" />
                      <div className="absolute inset-0 bg-skyrim-paper/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <span className="text-white text-xs">Generated by Gemini</span>
                      </div>
                  </div>
              )}

              {!generatedImage && lastResponse.narrative && (
                  <button 
                    onClick={handleVisualize} 
                    disabled={imageLoading}
                    className="mb-4 text-xs flex items-center gap-1 text-skyrim-gold hover:text-white disabled:opacity-50"
                  >
                      {imageLoading ? <Loader2 className="animate-spin" size={12}/> : <ImageIcon size={12}/>}
                      Visualize Scene
                  </button>
              )}

              {/* Character Updates Preview */}
              {lastResponse.characterUpdates && Object.keys(lastResponse.characterUpdates).length > 0 && (
                <div className="space-y-2 mb-3">
                  <div className="text-xs text-purple-400 flex items-center gap-1">
                    <Brain size={12} /> Hero details to update:
                  </div>
                  <div className="text-xs text-skyrim-text bg-skyrim-paper/20 p-2 rounded max-h-32 overflow-y-auto">
                    {Object.entries(lastResponse.characterUpdates).map(([key, value]) => (
                      <div key={key} className="mb-1">
                        <span className="text-skyrim-text capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="text-gray-500 ml-1">{String(value).substring(0, 60)}...</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(lastResponse.newItems?.length || 0) > 0 && (
                  <div className="text-xs text-green-400 mb-1">+ Items found: {lastResponse.newItems?.length}</div>
              )}
               {(lastResponse.newQuests?.length || 0) > 0 && (
                  <div className="text-xs text-skyrim-gold mb-1">+ Quests started: {lastResponse.newQuests?.length}</div>
              )}
               {(lastResponse.updateQuests?.length || 0) > 0 && (
                  <div className="text-xs text-blue-400 mb-1">~ Quests updated: {lastResponse.updateQuests?.length}</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-skyrim-border bg-skyrim-dark/30 rounded-b-lg flex justify-end gap-3">
           {lastResponse ? (
             <>
               <button
                  onClick={() => { setLastResponse(null); setGeneratedImage(null); }}
                  className="px-4 py-2 text-skyrim-text hover:text-white text-sm"
                >
                  Discard
                </button>
               <button
                 onClick={handleApply}
                 className="px-4 py-2 bg-skyrim-gold hover:bg-skyrim-goldHover text-skyrim-dark font-bold rounded font-serif flex items-center gap-2"
               >
                 <Play size={16} /> Apply Changes
               </button>
             </>
           ) : (
            <>
              <button
                onClick={handleApplyBatchOnly}
                disabled={loading || !batchInput.trim()}
                className="px-4 py-2 border border-skyrim-gold text-skyrim-gold hover:bg-skyrim-gold hover:text-skyrim-dark disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded flex items-center gap-2 font-serif text-sm"
              >
                <Play size={16} /> Apply Batch
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="px-6 py-2 bg-skyrim-gold hover:bg-skyrim-goldHover disabled:opacity-50 disabled:cursor-not-allowed text-skyrim-dark font-bold rounded flex items-center gap-2 font-serif"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                Generate Outcome
              </button>
            </>
           )}
        </div>
      </div>
    </div>
  );
};