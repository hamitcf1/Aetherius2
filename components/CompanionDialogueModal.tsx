import React, { useEffect, useState } from 'react';
import ModalWrapper from './ModalWrapper';
import { Companion } from '../types';
import { MessageSquare, X } from 'lucide-react';
import { chatWithCompanion } from '../services/geminiService';

interface Props {
  open: boolean;
  onClose: () => void;
  companion: Companion | null;
  onSend?: (companionId: string, message: string) => void; // callback to let app persist dialogue if desired
}

const simpleReply = (companion: Companion | null, message: string) => {
  if (!companion) return "...";
  const mood = companion.mood || 'neutral';
  const persona = companion.personality?.toLowerCase() || 'neutral';
  const m = message.toLowerCase();

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

export const CompanionDialogueModal: React.FC<Props> = ({ open, onClose, companion, onSend }) => {
  const [history, setHistory] = useState<Array<{ speaker: 'player' | 'companion'; text: string }>>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!open) {
      setHistory([]);
      setInput('');
    } else if (companion) {
      // seed a small greeting
      setHistory([{ speaker: 'companion', text: `${companion.name}: Hello.` }]);
    }
  }, [open, companion]);

  const [isThinking, setIsThinking] = useState(false);

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

  return (
    <ModalWrapper open={open} onClose={onClose} preventOutsideClose>
      <div className="w-full max-w-lg bg-skyrim-paper p-4 rounded border border-skyrim-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-skyrim-gold" />
            <h3 className="text-lg font-bold text-skyrim-gold">Talking with {companion.name}</h3>
          </div>
          <button onClick={onClose} className="px-2 py-1 rounded border border-skyrim-border">Close</button>
        </div>

        <div className="bg-black/80 text-xs text-green-300 font-mono p-3 rounded h-48 overflow-auto mb-3">
          {history.map((h, i) => (
            <div key={i} className={`mb-2 ${h.speaker === 'player' ? 'text-right' : ''}`}>
              <div className={`inline-block p-2 rounded ${h.speaker === 'player' ? 'bg-gray-700' : 'bg-skyrim-paper/30 text-skyrim-text'}`}>{h.text}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} className="flex-1 bg-skyrim-paper/40 p-2 rounded border border-skyrim-border text-skyrim-text focus:outline-none focus:border-skyrim-gold" />
          <button onClick={send} className="px-3 py-2 bg-skyrim-gold text-skyrim-dark rounded">Send</button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default CompanionDialogueModal;