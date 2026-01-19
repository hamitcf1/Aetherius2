import React from 'react';
import { X, Sparkles, Heart, Zap, Brain, Shield, Sword, Star } from 'lucide-react';
import ModalWrapper from './ModalWrapper';
import type { StatusEffect } from '../types';
import { playSoundEffect } from '../services/audioService';

export interface Blessing {
  id: string;
  name: string;
  deity: string;
  description: string;
  icon: React.ReactNode;
  effect: StatusEffect;
}

// Divine blessings available at shrines
export const DIVINE_BLESSINGS: Blessing[] = [
  {
    id: 'blessing_talos',
    name: 'Blessing of Talos',
    deity: 'Talos',
    description: 'Time between shouts is reduced. Stamina regenerates faster.',
    icon: <Sword className="w-8 h-8 text-amber-400" />,
    effect: {
      id: 'blessing_talos',
      name: 'Blessing of Talos',
      type: 'buff',
      icon: '⚔️',
      duration: 480, // 8 hours game time (in minutes)
      description: 'Stamina regenerates 25% faster',
      effects: [{ stat: 'staminaRegen', modifier: 25 }]
    }
  },
  {
    id: 'blessing_mara',
    name: 'Blessing of Mara',
    deity: 'Mara',
    description: 'The goddess of love grants improved health regeneration.',
    icon: <Heart className="w-8 h-8 text-pink-400" />,
    effect: {
      id: 'blessing_mara',
      name: 'Blessing of Mara',
      type: 'buff',
      icon: '💗',
      duration: 480,
      description: 'Health regenerates 25% faster',
      effects: [{ stat: 'healthRegen', modifier: 25 }]
    }
  },
  {
    id: 'blessing_julianos',
    name: 'Blessing of Julianos',
    deity: 'Julianos',
    description: 'The god of wisdom enhances your magical abilities.',
    icon: <Brain className="w-8 h-8 text-blue-400" />,
    effect: {
      id: 'blessing_julianos',
      name: 'Blessing of Julianos',
      type: 'buff',
      icon: '🧠',
      duration: 480,
      description: 'Magicka increased by 25 points',
      effects: [{ stat: 'magicka', modifier: 25 }]
    }
  },
  {
    id: 'blessing_stendarr',
    name: 'Blessing of Stendarr',
    deity: 'Stendarr',
    description: 'The god of mercy grants protection against harm.',
    icon: <Shield className="w-8 h-8 text-yellow-400" />,
    effect: {
      id: 'blessing_stendarr',
      name: 'Blessing of Stendarr',
      type: 'buff',
      icon: '🛡️',
      duration: 480,
      description: 'Block 10% more damage',
      effects: [{ stat: 'armor', modifier: 10 }]
    }
  },
  {
    id: 'blessing_kynareth',
    name: 'Blessing of Kynareth',
    deity: 'Kynareth',
    description: 'The goddess of air grants swiftness and endurance.',
    icon: <Zap className="w-8 h-8 text-green-400" />,
    effect: {
      id: 'blessing_kynareth',
      name: 'Blessing of Kynareth',
      type: 'buff',
      icon: '💨',
      duration: 480,
      description: 'Stamina increased by 25 points',
      effects: [{ stat: 'stamina', modifier: 25 }]
    }
  },
  {
    id: 'blessing_akatosh',
    name: 'Blessing of Akatosh',
    deity: 'Akatosh',
    description: 'The dragon god of time grants magical fortitude.',
    icon: <Star className="w-8 h-8 text-purple-400" />,
    effect: {
      id: 'blessing_akatosh',
      name: 'Blessing of Akatosh',
      type: 'buff',
      icon: '🐉',
      duration: 480,
      description: 'Magicka regenerates 25% faster',
      effects: [{ stat: 'magickaRegen', modifier: 25 }]
    }
  }
];

interface BlessingModalProps {
  open: boolean;
  onClose: () => void;
  onSelectBlessing: (blessing: Blessing) => void;
  shrineName?: string;
  availableBlessings?: Blessing[];
}

export const BlessingModal: React.FC<BlessingModalProps> = ({
  open,
  onClose,
  onSelectBlessing,
  shrineName = 'Divine Shrine',
  availableBlessings
}) => {
  // Pick 3 random blessings if not specified
  const blessings = availableBlessings || React.useMemo(() => {
    const shuffled = [...DIVINE_BLESSINGS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, []);

  const handleSelect = (blessing: Blessing) => {
    playSoundEffect('success');
    onSelectBlessing(blessing);
    onClose();
  };

  if (!open) return null;

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <div className="w-[500px] max-w-[95vw] bg-gradient-to-b from-slate-900 to-slate-800 border border-skyrim-gold/30 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-4 border-b border-skyrim-gold/20">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-skyrim-gold animate-pulse" />
            <div>
              <h2 className="text-xl font-bold text-skyrim-gold">{shrineName}</h2>
              <p className="text-sm text-gray-300">Choose a divine blessing</p>
            </div>
          </div>
        </div>

        {/* Blessings */}
        <div className="p-4 space-y-3">
          {blessings.map((blessing) => (
            <button
              key={blessing.id}
              onClick={() => handleSelect(blessing)}
              className="w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 hover:border-skyrim-gold/50 rounded-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-700/50 rounded-lg group-hover:bg-skyrim-gold/20 transition-colors">
                  {blessing.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white group-hover:text-skyrim-gold transition-colors">
                    {blessing.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">{blessing.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                      {blessing.deity}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                      8 hours
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
          <p className="text-xs text-gray-500 text-center">
            Blessings last for 8 in-game hours. Only one blessing can be active at a time.
          </p>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default BlessingModal;
