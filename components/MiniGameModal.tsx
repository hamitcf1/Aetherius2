import React from 'react';
import { DoomMinigame } from './DoomMinigame';

interface MiniGameModalProps {
  open: boolean;
  missionId?: string | null;
  missionName?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | 'nightmare';
  playerLevel?: number;
  playerStats?: {
    maxHealth: number;
    maxMagicka: number;
    maxStamina: number;
    damage: number;
    armor: number;
  };
  onClose: (result?: { success: boolean; rewards?: any }) => void;
  showToast?: (msg: string, type?: string) => void;
}

/**
 * MiniGameModal - Launches the Doom-style dungeon crawler minigame
 * 
 * This component wraps the full DoomMinigame raycasting engine and provides
 * integration with the Aetherius rewards system.
 */
const MiniGameModal: React.FC<MiniGameModalProps> = ({ 
  open, 
  missionId, 
  missionName, 
  difficulty = 'medium',
  playerLevel = 1,
  playerStats,
  onClose, 
  showToast 
}) => {
  if (!open) return null;

  return (
    <DoomMinigame
      isOpen={open}
      dungeonName={missionName || missionId || 'Nordic Crypt'}
      difficulty={difficulty}
      playerLevel={playerLevel}
      playerStats={playerStats}
      showToast={showToast as any}
      onClose={(result) => {
        if (result) {
          onClose({
            success: result.victory,
            rewards: result.rewards || {
              gold: result.score,
              xp: result.enemiesKilled * 25,
            },
          });
        } else {
          onClose({ success: false });
        }
      }}
    />
  );
};

export default MiniGameModal;
