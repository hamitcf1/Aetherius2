import React, { useEffect, useState } from 'react';
import { audioService } from '../services/audioService';

export interface LevelUpNotificationData {
  id: string;
  characterName: string;
  newLevel: number;
}

interface LevelUpNotificationOverlayProps {
  notifications: LevelUpNotificationData[];
  onDismiss: (id: string) => void;
}

// Skyrim-style level-up notification that appears prominently
export const LevelUpNotificationOverlay: React.FC<LevelUpNotificationOverlayProps> = ({ notifications, onDismiss }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: notifications.length > 0 ? 'flex' : 'none',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: notifications.length > 0 ? 'auto' : 'none',
        background: 'rgba(0, 0, 0, 0.7)',
      }}
    >
      {notifications.map((notif) => (
        <LevelUpNotificationCard key={notif.id} notification={notif} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const LevelUpNotificationCard: React.FC<{
  notification: LevelUpNotificationData;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [showParticles, setShowParticles] = useState(true);

  useEffect(() => {
    // Play level-up sound
    audioService.playSoundEffect('level_up');
    
    // Fade in
    const showTimer = setTimeout(() => setVisible(true), 50);
    
    // Start exit animation after 5 seconds
    const exitTimer = setTimeout(() => {
      setExiting(true);
      setShowParticles(false);
    }, 5000);

    // Remove after exit animation
    const removeTimer = setTimeout(() => {
      onDismiss(notification.id);
    }, 5500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [notification.id, onDismiss]);

  // Generate random particles for the magical effect
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    size: 4 + Math.random() * 8,
  }));

  return (
    <div
      style={{
        position: 'relative',
        padding: '40px 80px',
        textAlign: 'center',
        opacity: visible && !exiting ? 1 : 0,
        transform: visible && !exiting ? 'scale(1)' : 'scale(0.8)',
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
        cursor: 'pointer',
      }}
      onClick={() => {
        setExiting(true);
        setShowParticles(false);
        setTimeout(() => onDismiss(notification.id), 300);
      }}
      role="alert"
      aria-live="assertive"
    >
      {/* Animated background glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(192, 160, 98, 0.3) 0%, transparent 70%)',
          animation: 'levelUpPulse 2s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Particle effects */}
      {showParticles && particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            bottom: '0%',
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.9) 0%, rgba(192, 160, 98, 0.6) 50%, transparent 70%)',
            borderRadius: '50%',
            animation: `levelUpParticle ${particle.duration}s ease-out infinite`,
            animationDelay: `${particle.delay}s`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Decorative top line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '2px',
              background: 'linear-gradient(to right, transparent, #c0a062)',
            }}
          />
          <span
            style={{
              fontSize: '14px',
              letterSpacing: '4px',
              color: '#c0a062',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontFamily: 'Cinzel, serif',
            }}
          >
            ⚔️ LEVEL UP ⚔️
          </span>
          <div
            style={{
              width: '60px',
              height: '2px',
              background: 'linear-gradient(to left, transparent, #c0a062)',
            }}
          />
        </div>

        {/* Level number with dramatic effect */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 900,
            color: '#ffd700',
            fontFamily: 'Cinzel, serif',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.5)',
            marginBottom: '8px',
            animation: 'levelUpNumber 0.5s ease-out',
          }}
        >
          {notification.newLevel}
        </div>

        {/* Character name */}
        <div
          style={{
            fontSize: '18px',
            color: '#f5f5dc',
            fontFamily: 'Cinzel, serif',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            marginBottom: '8px',
          }}
        >
          {notification.characterName}
        </div>

        {/* Instruction */}
        <div
          style={{
            fontSize: '12px',
            color: '#888',
            fontFamily: 'Cinzel, serif',
            marginTop: '20px',
          }}
        >
          Choose your attribute bonus
        </div>

        {/* Decorative bottom line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '16px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '1px',
              background: 'linear-gradient(to right, transparent, #c0a062)',
            }}
          />
          <span style={{ color: '#c0a062', fontSize: '16px' }}>◆</span>
          <div
            style={{
              width: '80px',
              height: '1px',
              background: 'linear-gradient(to left, transparent, #c0a062)',
            }}
          />
        </div>
      </div>

      {/* CSS Keyframes injected via style tag */}
      <style>{`
        @keyframes levelUpPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes levelUpParticle {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-200px) scale(0); opacity: 0; }
        }
        @keyframes levelUpNumber {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LevelUpNotificationOverlay;
