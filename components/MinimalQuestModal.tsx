import React from 'react';
import { CustomQuest } from '../types';
import { Flag, MapPin, Clock, CheckCircle, X } from 'lucide-react';

interface MinimalQuestModalProps {
  quests: CustomQuest[];
  open: boolean;
  onClose: () => void;
}

export const MinimalQuestModal: React.FC<MinimalQuestModalProps> = ({ quests, open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-skyrim-dark/60 backdrop-blur-sm">
      <div className="bg-skyrim-paper border border-skyrim-gold/40 rounded-lg shadow-2xl w-full max-w-md p-4 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-skyrim-text hover:text-red-400 transition-colors"
          aria-label="Close quest modal"
        >
          <X size={18} />
        </button>
        <h2 className="text-lg font-serif text-skyrim-gold mb-2 flex items-center gap-2">
          <Flag size={18} /> Quests
        </h2>
        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
          {quests.filter(q => q.status === 'active').length === 0 ? (
            <div className="text-skyrim-text italic text-center">No active quests.</div>
          ) : (
            quests.filter(q => q.status === 'active').map(q => (
              <div key={q.id} className="border border-skyrim-gold/20 rounded p-2 bg-skyrim-paper/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-skyrim-gold">{q.title}</span>
                  {q.location && (
                    <span className="flex items-center gap-1 text-xs text-skyrim-text ml-2">
                      <MapPin size={12} /> {q.location}
                    </span>
                  )}
                  {q.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-skyrim-text ml-2">
                      <Clock size={12} /> {q.dueDate}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-300 mb-1">{q.description}</div>
                {q.objectives && q.objectives.length > 0 && (
                  <ul className="ml-3 list-disc text-xs text-skyrim-text">
                    {q.objectives.map(obj => (
                      <li key={obj.id} className={obj.completed ? 'line-through text-green-400' : ''}>
                        {obj.description}
                        {obj.completed && <CheckCircle size={10} className="inline ml-1 text-green-400" />}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
