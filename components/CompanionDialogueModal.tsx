import React, { useEffect, useState } from 'react';
import ModalWrapper from './ModalWrapper';
import { Companion } from '../types';
import { MessageSquare, X, Heart, Dog, Sparkles } from 'lucide-react';
import { chatWithCompanion } from '../services/geminiService';

interface Props {
  open: boolean;
  onClose: () => void;
  companion: Companion | null;
  onSend?: (companionId: string, message: string) => void; // callback to let app persist dialogue if desired
  onPet?: (companion: Companion) => void; // callback when petting an animal
  onUpdateCompanion?: (companion: Companion) => void; // to update loyalty/mood after petting
}

// Animal reactions based on species and mood
const getAnimalReaction = (companion: Companion | null, action: 'pet' | 'treat' | 'play'): string => {
  if (!companion) return '';
  const species = companion.species || 'dog';
  const mood = companion.mood || 'neutral';
  
  const reactions: Record<string, Record<string, string[]>> = {
    dog: {
      pet: ['wags tail excitedly', 'licks your hand', 'pants happily', 'rolls over for belly rubs', 'nuzzles against you'],
      treat: ['gobbles it up eagerly', 'barks excitedly', 'does a little spin'],
      play: ['chases its tail', 'fetches a stick', 'bounces around playfully']
    },
    husky: {
      pet: ['howls contentedly', 'leans into your hand', 'gives you a wolfish grin'],
      treat: ['takes it gently', 'wags its fluffy tail'],
      play: ['runs in circles', 'pounces playfully', 'howls with joy']
    },
    wolf: {
      pet: ['allows the touch cautiously', 'closes its eyes peacefully', 'rumbles softly'],
      treat: ['accepts it with dignity', 'licks its chops'],
      play: ['stalks you playfully', 'nips gently at your fingers']
    },
    cat: {
      pet: ['purrs loudly', 'kneads with its paws', 'arches its back', 'head-butts your hand'],
      treat: ['nibbles daintily', 'meows for more'],
      play: ['pounces on shadows', 'bats at your fingers', 'chases imaginary prey']
    },
    fox: {
      pet: ['chatters softly', 'flicks its ears', 'curls its fluffy tail'],
      treat: ['snatches it quickly', 'makes happy noises'],
      play: ['bounces around', 'does a playful bow', 'yips excitedly']
    },
    horse: {
      pet: ['nickers softly', 'nudges you gently', 'stamps a hoof contentedly'],
      treat: ['lips it from your palm', 'whinnies appreciatively'],
      play: ['tosses its mane', 'prances in place']
    },
    bear: {
      pet: ['rumbles contentedly', 'leans its massive weight against you', 'closes its eyes'],
      treat: ['sniffs it carefully then devours it', 'makes satisfied grunts'],
      play: ['bats at you gently', 'rolls on its back']
    },
    sabrecat: {
      pet: ['allows the touch warily', 'purrs deeply like thunder', 'flexes its massive claws'],
      treat: ['tears it apart instantly', 'growls with satisfaction'],
      play: ['stalks you like prey then pounces gently', 'swipes playfully']
    }
  };
  
  const speciesReactions = reactions[species] || reactions.dog;
  const actionReactions = speciesReactions[action] || speciesReactions.pet;
  return actionReactions[Math.floor(Math.random() * actionReactions.length)];
};

const simpleReply = (companion: Companion | null, message: string) => {
  if (!companion) return "...";
  const mood = companion.mood || 'neutral';
  const persona = (companion.personality || '').toLowerCase() || 'neutral';
  const m = message.toLowerCase();

  // Recognize that player may be asserting or asking about the companion relationship
  if (m.includes('you are my companion') || m.includes('are you my companion') || (m.includes('companion') && (m.includes('you') || m.includes('my')))) {
    const back = companion.backstory ? ` ${companion.backstory}` : '';
    return `${companion.name}: Yes — I am your companion.${back}`;
  }

  // Very small rule-based replies for an initial prototype
  if (m.includes('guard') || m.includes('watch')) return `${companion.name}: I'll watch your back, ${persona === 'loyal' ? "my Thane" : 'friend'}.`;
  if (m.includes('follow')) return `${companion.name}: I'll follow you wherever you go.`;
  if (m.includes('loot') || m.includes('take')) return `${companion.name}: I can pick up lighter things while you fight.`;
  if (m.includes('hello') || m.includes('hi')) return `${companion.name}: Greetings, ${persona === 'cheerful' ? 'friend' : 'traveler'}.`;
  if (m.includes('how are you')) return `${companion.name}: ${mood === 'happy' ? 'I am well, thanks to your leadership.' : mood === 'unhappy' ? 'I am weary from travel.' : 'I am here.'}`;

  // Fallback variations
  if (persona.includes('loyal')) return `${companion.name}: As you wish.`;
  if (mood === 'happy') return `${companion.name}: Always a pleasure to assist.`;
  return `${companion.name}: I understand.`;
};


const CompanionDialogueModal: React.FC<Props> = ({ open, onClose, companion, onSend, onPet, onUpdateCompanion }) => {
  const [history, setHistory] = useState<Array<{ speaker: 'player' | 'companion'; text: string }>>([]);
  const [input, setInput] = useState('');
  // Animal petting state
  const [petCount, setPetCount] = useState(0);
  const [lastReaction, setLastReaction] = useState('');
  const [showHearts, setShowHearts] = useState(false);

  useEffect(() => {
    if (!open) {
      setHistory([]);
      setInput('');
      setPetCount(0);
      setLastReaction('');
    } else if (companion) {
      // seed a small greeting
      if (companion.isAnimal) {
        const greetings: Record<string, string> = {
          dog: `${companion.name} barks happily and wags their tail!`,
          husky: `${companion.name} howls a greeting!`,
          wolf: `${companion.name} regards you with intelligent eyes.`,
          cat: `${companion.name} meows and rubs against your leg.`,
          fox: `${companion.name} yips and does a little dance.`,
          horse: `${companion.name} whinnies and stamps a hoof.`,
          bear: `${companion.name} grumbles a greeting.`,
          sabrecat: `${companion.name} growls softly in recognition.`
        };
        setHistory([{ speaker: 'companion', text: greetings[companion.species || 'dog'] || `${companion.name} greets you warmly.` }]);
      } else {
        setHistory([{ speaker: 'companion', text: `${companion.name}: Hello.` }]);
      }
    }
  }, [open, companion]);

  const [isThinking, setIsThinking] = useState(false);

  // Handle petting action for animals
  const handlePet = (action: 'pet' | 'treat' | 'play') => {
    if (!companion || !companion.isAnimal) return;
    
    const reaction = getAnimalReaction(companion, action);
    setLastReaction(reaction);
    setPetCount(prev => prev + 1);
    
    // Show hearts animation
    setShowHearts(true);
    setTimeout(() => setShowHearts(false), 1000);
    
    // Add to history
    const actionTexts = {
      pet: `You pet ${companion.name} gently.`,
      treat: `You give ${companion.name} a treat.`,
      play: `You play with ${companion.name}.`
    };
    
    setHistory(prev => [
      ...prev,
      { speaker: 'player', text: actionTexts[action] },
      { speaker: 'companion', text: `${companion.name} ${reaction}` }
    ]);
    
    // Update companion mood and loyalty
    if (onUpdateCompanion) {
      const loyaltyBonus = action === 'treat' ? 3 : action === 'play' ? 2 : 1;
      const newLoyalty = Math.min(100, (companion.loyalty || 50) + loyaltyBonus);
      const newMood = newLoyalty > 75 ? 'happy' : newLoyalty > 50 ? 'neutral' : 'unhappy';
      onUpdateCompanion({ ...companion, loyalty: newLoyalty, mood: newMood as any });
    }
    
    if (onPet) onPet(companion);
  };

  const send = async () => {
    if (!input.trim() || !companion || isThinking) return;
    const msg = input.trim();
    const playerLine = { speaker: 'player' as const, text: msg };
    setHistory(prev => [...prev, playerLine]);

    // immediate lightweight fallback reply
    const lightweightReply = simpleReply(companion, msg);
    setHistory(prev => [...prev, { speaker: 'companion', text: lightweightReply }]);

    if (onSend) onSend(companion.id, msg);
    setInput('');

    // If the message is a simple companion-relationship assertion/question, keep the rule-based reply and skip calling the AI
    const low = msg.toLowerCase();
    const isCompanionQuery = low.includes('you are my companion') || low.includes('are you my companion') || (low.includes('companion') && (low.includes('you') || low.includes('my')));
    if (isCompanionQuery) {
      // for these assertions we intentionally don't call the AI to keep the reply deterministic and immediate
      return;
    }

    // Call AI for in-character reply and replace the last companion entry when it arrives
    setIsThinking(true);
    try {
      const aiReply = await chatWithCompanion(companion, msg);
      setHistory(prev => {
        const copy = [...prev];
        // find last companion entry
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].speaker === 'companion') {
            copy[i] = { speaker: 'companion', text: aiReply.startsWith(companion.name) ? aiReply : `${companion.name}: ${aiReply}` };
            break;
          }
        }
        return copy;
      });
    } catch (e) {
      // keep lightweight reply; optionally add error note
      setHistory(prev => [...prev, { speaker: 'companion', text: `${companion.name}: I'm having trouble connecting right now.` }]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!open || !companion) return null;

  // Animal companion UI - petting interface
  if (companion.isAnimal) {
    return (
      <ModalWrapper open={open} onClose={onClose} preventOutsideClose>
        <div className="w-full max-w-md bg-skyrim-paper p-6 rounded border border-skyrim-border relative overflow-hidden">
          {/* Hearts animation */}
          {showHearts && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {[...Array(5)].map((_, i) => (
                <Heart
                  key={i}
                  size={24}
                  className="absolute text-pink-500 animate-bounce"
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 40}%`,
                    animationDelay: `${i * 100}ms`,
                    opacity: 0.8
                  }}
                  fill="currentColor"
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Dog size={24} className="text-amber-400" />
              <div>
                <h3 className="text-lg font-bold text-skyrim-gold">{companion.name}</h3>
                <div className="text-xs text-skyrim-text">{companion.race} • Level {companion.level}</div>
              </div>
            </div>
            <button onClick={onClose} className="px-2 py-1 rounded border border-skyrim-border">Close</button>
          </div>

          {/* Stats display */}
          <div className="mb-4 p-3 bg-black/30 rounded border border-skyrim-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-skyrim-text">Loyalty</span>
              <span className="text-xs text-skyrim-gold">{companion.loyalty || 50}/100</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${companion.loyalty || 50}%`,
                  background: 'linear-gradient(to right, #f472b6, #ec4899)'
                }}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-skyrim-text">Mood:</span>
              <span className={`text-xs ${companion.mood === 'happy' ? 'text-green-400' : companion.mood === 'unhappy' ? 'text-orange-400' : 'text-gray-400'}`}>
                {companion.mood === 'happy' ? '😊 Happy' : companion.mood === 'unhappy' ? '😢 Unhappy' : '😐 Neutral'}
              </span>
            </div>
          </div>

          {/* Reaction log */}
          <div className="bg-black/50 text-sm text-green-300 font-mono p-4 rounded h-40 overflow-auto mb-4">
            {history.map((h, i) => (
              <div key={i} className={`mb-2 ${h.speaker === 'player' ? 'text-right' : ''}`}>
                <div className={`inline-block max-w-[90%] break-words p-2 rounded ${h.speaker === 'player' ? 'bg-gray-700 text-gray-200' : 'bg-skyrim-paper/30 text-skyrim-text'}`}>
                  {h.text}
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => handlePet('pet')}
              className="flex flex-col items-center gap-2 p-3 bg-pink-700/80 hover:bg-pink-600 text-white rounded transition-colors"
            >
              <Heart size={24} />
              <span className="text-sm">Pet</span>
            </button>
            <button 
              onClick={() => handlePet('treat')}
              className="flex flex-col items-center gap-2 p-3 bg-amber-700/80 hover:bg-amber-600 text-white rounded transition-colors"
            >
              <Sparkles size={24} />
              <span className="text-sm">Treat</span>
            </button>
            <button 
              onClick={() => handlePet('play')}
              className="flex flex-col items-center gap-2 p-3 bg-sky-700/80 hover:bg-sky-600 text-white rounded transition-colors"
            >
              <Dog size={24} />
              <span className="text-sm">Play</span>
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            Times interacted: {petCount}
          </div>
        </div>
      </ModalWrapper>
    );
  }

  // Regular companion dialogue UI

  return (
    <ModalWrapper open={open} onClose={onClose} preventOutsideClose>
      <div className="w-full max-w-3xl bg-skyrim-paper p-6 rounded border border-skyrim-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-skyrim-gold" />
            <div>
              <h3 className="text-lg font-bold text-skyrim-gold">Talking with {companion.name}</h3>
              {companion.backstory && (
                <div className="text-xs text-stone-400 mt-1 max-w-xs truncate">{companion.backstory}</div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="px-2 py-1 rounded border border-skyrim-border">Close</button>
        </div>

        <div className="bg-black/80 text-xs text-green-300 font-mono p-4 rounded h-72 md:h-96 overflow-auto mb-4">
          {history.map((h, i) => (
            <div key={i} className={`mb-2 ${h.speaker === 'player' ? 'text-right' : ''}`}>
              <div className={`inline-block max-w-[78%] break-words p-2 rounded ${h.speaker === 'player' ? 'bg-gray-700' : 'bg-skyrim-paper/30 text-skyrim-text'}`}>{h.text}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 items-end">
          <textarea
            role="textbox"
            aria-label={companion ? `Message ${companion.name}` : 'Message'}
            placeholder="Type your message (Enter to send, Shift+Enter for newline)"
            value={input}
            rows={3}
            autoFocus
            onChange={e => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            className="flex-1 p-4 rounded border border-skyrim-border text-skyrim-text placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 min-h-[64px] resize-none"
            style={{ backgroundColor: 'var(--skyrim-paper)', color: 'var(--skyrim-text)' }}
          />
          <button onClick={send} type="button" className="px-4 py-2 bg-skyrim-gold text-skyrim-dark rounded h-fit">Send</button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default CompanionDialogueModal;