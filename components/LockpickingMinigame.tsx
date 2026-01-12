import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Lock, Key, AlertTriangle } from 'lucide-react';

export type LockDifficulty = 'novice' | 'apprentice' | 'adept' | 'expert' | 'master';

interface LockpickingMinigameProps {
  isOpen: boolean;
  onClose: () => void;
  difficulty: LockDifficulty;
  lockpickCount: number;
  lockpickingSkill: number; // 15-100
  onSuccess: () => void;
  onFailure: (lockpicksBroken: number) => void;
  onNoLockpicks: () => void;
  lockName?: string;
}

// Difficulty settings
const DIFFICULTY_CONFIG: Record<LockDifficulty, { 
  sweetSpotSize: number; // degrees
  turnSpeed: number;
  breakChance: number;
  color: string;
  label: string;
}> = {
  novice: { sweetSpotSize: 45, turnSpeed: 2, breakChance: 0.15, color: 'text-green-400', label: 'Novice' },
  apprentice: { sweetSpotSize: 35, turnSpeed: 2.5, breakChance: 0.25, color: 'text-blue-400', label: 'Apprentice' },
  adept: { sweetSpotSize: 25, turnSpeed: 3, breakChance: 0.35, color: 'text-yellow-400', label: 'Adept' },
  expert: { sweetSpotSize: 18, turnSpeed: 3.5, breakChance: 0.45, color: 'text-orange-400', label: 'Expert' },
  master: { sweetSpotSize: 12, turnSpeed: 4, breakChance: 0.55, color: 'text-red-400', label: 'Master' },
};

export const LockpickingMinigame: React.FC<LockpickingMinigameProps> = ({
  isOpen,
  onClose,
  difficulty,
  lockpickCount,
  lockpickingSkill,
  onSuccess,
  onFailure,
  onNoLockpicks,
  lockName = 'Lock',
}) => {
  const [pickAngle, setPickAngle] = useState(0); // Current lockpick angle (0-180)
  const [sweetSpotAngle, setSweetSpotAngle] = useState(0); // Where the sweet spot is
  const [isAttempting, setIsAttempting] = useState(false);
  const [tension, setTension] = useState(0); // 0-100, how much the lock is being turned
  const [shakeMagnitude, setShakeMagnitude] = useState(0);
  const [lockpicksUsed, setLockpicksUsed] = useState(0);
  const [currentLockpicks, setCurrentLockpicks] = useState(lockpickCount);
  const [gameState, setGameState] = useState<'playing' | 'success' | 'broken' | 'no-picks'>('playing');
  const [message, setMessage] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  
  const config = DIFFICULTY_CONFIG[difficulty];
  
  // Skill bonus: higher skill = larger effective sweet spot
  const skillBonus = Math.floor((lockpickingSkill - 15) / 10); // 0-8 bonus degrees
  const effectiveSweetSpot = config.sweetSpotSize + skillBonus;

  // Initialize game
  useEffect(() => {
    if (isOpen) {
      // Check for lockpicks first
      if (lockpickCount <= 0) {
        setGameState('no-picks');
        setMessage('You don\'t have any lockpicks!');
        setTimeout(() => {
          onNoLockpicks();
          onClose();
        }, 2000);
        return;
      }
      
      // Random sweet spot position (10-170 degrees to avoid edges)
      setSweetSpotAngle(Math.floor(Math.random() * 160) + 10);
      setPickAngle(90); // Start in middle
      setTension(0);
      setShakeMagnitude(0);
      setLockpicksUsed(0);
      setCurrentLockpicks(lockpickCount);
      setGameState('playing');
      setMessage(`${config.label} lock - Move the pick and hold SPACE to turn`);
    }
  }, [isOpen, lockpickCount, config.label, onNoLockpicks, onClose]);

  // Calculate how close the pick is to the sweet spot
  const getProximity = useCallback(() => {
    const distance = Math.abs(pickAngle - sweetSpotAngle);
    const halfSweet = effectiveSweetSpot / 2;
    
    if (distance <= halfSweet) {
      return 1; // Perfect
    } else if (distance <= halfSweet * 2) {
      return 0.5; // Close
    } else if (distance <= halfSweet * 3) {
      return 0.25; // Far
    }
    return 0; // Way off
  }, [pickAngle, sweetSpotAngle, effectiveSweetSpot]);

  // Handle key controls
  useEffect(() => {
    if (!isOpen || gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setPickAngle(prev => Math.max(0, prev - 3));
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setPickAngle(prev => Math.min(180, prev + 3));
      }
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        setIsAttempting(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsAttempting(false);
        setTension(0);
        setShakeMagnitude(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, gameState, onClose]);

  // Main game loop
  useEffect(() => {
    if (!isOpen || gameState !== 'playing') return;

    const gameLoop = () => {
      if (isAttempting) {
        const proximity = getProximity();
        
        if (proximity === 1) {
          // In sweet spot - tension increases smoothly
          setTension(prev => {
            const next = prev + config.turnSpeed;
            if (next >= 100) {
              // Success!
              setGameState('success');
              setMessage('Lock opened!');
              setTimeout(() => {
                onSuccess();
                onClose();
              }, 1500);
              return 100;
            }
            return next;
          });
          setShakeMagnitude(0);
        } else if (proximity >= 0.25) {
          // Close but not perfect - some progress with shake
          setTension(prev => {
            const maxTension = proximity * 100;
            const next = Math.min(prev + config.turnSpeed * proximity, maxTension);
            return next;
          });
          setShakeMagnitude((1 - proximity) * 5);
        } else {
          // Way off - lockpick breaks!
          const breakRoll = Math.random();
          const adjustedBreakChance = config.breakChance * (1 - lockpickingSkill / 200);
          
          if (breakRoll < adjustedBreakChance) {
            setLockpicksUsed(prev => prev + 1);
            setCurrentLockpicks(prev => {
              const next = prev - 1;
              if (next <= 0) {
                setGameState('no-picks');
                setMessage('Your last lockpick broke! No lockpicks remaining.');
                setTimeout(() => {
                  onFailure(lockpicksUsed + 1);
                  onClose();
                }, 2000);
              } else {
                setGameState('broken');
                setMessage(`Lockpick broke! ${next} remaining.`);
                setTimeout(() => {
                  // Reset for another attempt
                  setSweetSpotAngle(Math.floor(Math.random() * 160) + 10);
                  setTension(0);
                  setShakeMagnitude(0);
                  setGameState('playing');
                  setMessage(`${config.label} lock - Move the pick and hold SPACE to turn`);
                }, 1000);
              }
              return next;
            });
          } else {
            setShakeMagnitude(8);
          }
          setTension(prev => Math.max(0, prev - 5));
        }
      }
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen, gameState, isAttempting, getProximity, config, lockpickingSkill, lockpicksUsed, onSuccess, onFailure, onClose]);

  if (!isOpen) return null;

  const shakeStyle = shakeMagnitude > 0 ? {
    transform: `translate(${(Math.random() - 0.5) * shakeMagnitude}px, ${(Math.random() - 0.5) * shakeMagnitude}px)`,
  } : {};

  return (
    <div className="fixed inset-0 bg-skyrim-dark/90 flex items-center justify-center z-50">
      <div 
        ref={containerRef}
        className="bg-skyrim-paper border-2 border-skyrim-gold/50 rounded-lg p-6 max-w-lg w-full mx-4"
        style={shakeStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Lock className="text-skyrim-gold" size={24} />
            <div>
              <h2 className="text-xl font-serif text-skyrim-gold">{lockName}</h2>
              <span className={`text-sm ${config.color}`}>{config.label} Lock</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-skyrim-text hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Lockpick count */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Key size={16} className="text-skyrim-text" />
          <span className="text-skyrim-text">Lockpicks: </span>
          <span className={currentLockpicks <= 2 ? 'text-red-400 font-bold' : 'text-skyrim-gold'}>
            {currentLockpicks}
          </span>
        </div>

        {/* Lock visualization */}
        <div className="relative w-64 h-64 mx-auto mb-6">
          {/* Lock body */}
          <div className="absolute inset-0 rounded-full border-4 border-skyrim-border bg-gradient-to-br from-gray-800 to-gray-900 shadow-inner">
            {/* Keyhole */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-16 bg-black rounded-t-full">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-8 bg-black rounded-sm"></div>
            </div>
            
            {/* Sweet spot indicator (hidden, but affects gameplay) */}
            {/* Debug: uncomment to see sweet spot */}
            {/* <div 
              className="absolute top-1/2 left-1/2 w-1 h-24 bg-green-500/30 origin-bottom"
              style={{ transform: `translate(-50%, -100%) rotate(${sweetSpotAngle - 90}deg)` }}
            /> */}
            
            {/* Lockpick */}
            <div 
              className="absolute top-1/2 left-1/2 w-1 h-28 origin-bottom transition-transform duration-75"
              style={{ 
                transform: `translate(-50%, -100%) rotate(${pickAngle - 90}deg)`,
              }}
            >
              <div className="w-full h-full bg-gradient-to-t from-gray-400 to-gray-300 rounded-full shadow-lg">
                {/* Pick tip */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-4 bg-gray-300 rounded-t-full"></div>
              </div>
            </div>

            {/* Tension wrench */}
            <div 
              className="absolute top-1/2 left-1/2 w-2 h-20 bg-gray-600 origin-top rounded-b transition-transform duration-100"
              style={{ 
                transform: `translate(-50%, 0) rotate(${tension * 0.9}deg)`,
              }}
            >
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-3 bg-gray-500 rounded"></div>
            </div>
          </div>

          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="rgba(192, 160, 98, 0.2)"
              strokeWidth="8"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke={gameState === 'success' ? '#22c55e' : '#c0a062'}
              strokeWidth="8"
              strokeDasharray={`${tension * 7.54} 754`}
              className="transition-all duration-100"
            />
          </svg>
        </div>

        {/* Message */}
        <div className={`text-center mb-4 h-8 ${
          gameState === 'success' ? 'text-green-400' :
          gameState === 'broken' ? 'text-red-400' :
          gameState === 'no-picks' ? 'text-orange-400' :
          'text-skyrim-text'
        }`}>
          {message}
        </div>

        {/* Controls hint */}
        {gameState === 'playing' && (
          <div className="text-center text-xs text-skyrim-text space-y-1">
            <p><kbd className="px-2 py-1 bg-gray-800 rounded">←</kbd> <kbd className="px-2 py-1 bg-gray-800 rounded">→</kbd> or <kbd className="px-2 py-1 bg-gray-800 rounded">A</kbd> <kbd className="px-2 py-1 bg-gray-800 rounded">D</kbd> to move pick</p>
            <p>Hold <kbd className="px-2 py-1 bg-gray-800 rounded">SPACE</kbd> to turn the lock</p>
          </div>
        )}

        {/* No lockpicks warning */}
        {gameState === 'no-picks' && (
          <div className="flex items-center justify-center gap-2 text-orange-400">
            <AlertTriangle size={20} />
            <span>You need lockpicks to attempt this!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LockpickingMinigame;
