import React, { useEffect, useState } from 'react';

export interface QuestNotification {
  id: string;
  type: 'quest-started' | 'quest-completed' | 'quest-failed' | 'objective-completed' | 'quest-updated';
  questTitle: string;
  objectiveText?: string;
  xpAwarded?: number;
  goldAwarded?: number;
}

interface QuestNotificationOverlayProps {
  notifications: QuestNotification[];
  onDismiss: (id: string) => void;
}

// Skyrim-style quest notification that appears at the top of the screen
export const QuestNotificationOverlay: React.FC<QuestNotificationOverlayProps> = ({ notifications, onDismiss }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        pointerEvents: 'none',
        width: '100%',
        maxWidth: '600px',
        padding: '0 16px',
      }}
    >
      {notifications.map((notif) => (
        <QuestNotificationCard key={notif.id} notification={notif} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const QuestNotificationCard: React.FC<{
  notification: QuestNotification;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Fade in
    const showTimer = setTimeout(() => setVisible(true), 50);
    
    // Start exit animation after 4 seconds
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, 4000);

    // Remove after exit animation
    const removeTimer = setTimeout(() => {
      onDismiss(notification.id);
    }, 4500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [notification.id, onDismiss]);

  const getNotificationConfig = () => {
    switch (notification.type) {
      case 'quest-started':
        return {
          label: 'NEW QUEST',
          icon: '📜',
          borderColor: '#c0a062',
          glowColor: 'rgba(192, 160, 98, 0.4)',
          bgGradient: 'linear-gradient(135deg, rgba(30, 25, 15, 0.95) 0%, rgba(45, 35, 20, 0.95) 100%)',
        };
      case 'quest-completed':
        return {
          label: 'QUEST COMPLETED',
          icon: '✓',
          borderColor: '#4ade80',
          glowColor: 'rgba(74, 222, 128, 0.4)',
          bgGradient: 'linear-gradient(135deg, rgba(15, 30, 20, 0.95) 0%, rgba(20, 45, 30, 0.95) 100%)',
        };
      case 'quest-failed':
        return {
          label: 'QUEST FAILED',
          icon: '✗',
          borderColor: '#f87171',
          glowColor: 'rgba(248, 113, 113, 0.4)',
          bgGradient: 'linear-gradient(135deg, rgba(30, 15, 15, 0.95) 0%, rgba(45, 20, 20, 0.95) 100%)',
        };
      case 'objective-completed':
        return {
          label: 'OBJECTIVE COMPLETED',
          icon: '◆',
          borderColor: '#60a5fa',
          glowColor: 'rgba(96, 165, 250, 0.4)',
          bgGradient: 'linear-gradient(135deg, rgba(15, 20, 30, 0.95) 0%, rgba(20, 30, 45, 0.95) 100%)',
        };
      case 'quest-updated':
        return {
          label: 'QUEST UPDATED',
          icon: '↺',
          borderColor: '#a78bfa',
          glowColor: 'rgba(167, 139, 250, 0.4)',
          bgGradient: 'linear-gradient(135deg, rgba(25, 15, 30, 0.95) 0%, rgba(35, 20, 45, 0.95) 100%)',
        };
      default:
        return {
          label: 'QUEST',
          icon: '📜',
          borderColor: '#c0a062',
          glowColor: 'rgba(192, 160, 98, 0.4)',
          bgGradient: 'linear-gradient(135deg, rgba(30, 25, 15, 0.95) 0%, rgba(45, 35, 20, 0.95) 100%)',
        };
    }
  };

  const config = getNotificationConfig();

  return (
    <div
      style={{
        background: config.bgGradient,
        border: `2px solid ${config.borderColor}`,
        borderRadius: '4px',
        padding: '16px 24px',
        minWidth: '320px',
        maxWidth: '100%',
        boxShadow: `0 0 20px ${config.glowColor}, 0 4px 12px rgba(0, 0, 0, 0.5)`,
        opacity: visible && !exiting ? 1 : 0,
        transform: visible && !exiting ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.95)',
        transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
        pointerEvents: 'auto',
        cursor: 'pointer',
        fontFamily: 'Cinzel, serif',
      }}
      onClick={() => {
        setExiting(true);
        setTimeout(() => onDismiss(notification.id), 300);
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Header with label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '1px',
            background: `linear-gradient(to right, transparent, ${config.borderColor})`,
          }}
        />
        <span
          style={{
            fontSize: '11px',
            letterSpacing: '3px',
            color: config.borderColor,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {config.icon} {config.label}
        </span>
        <div
          style={{
            width: '40px',
            height: '1px',
            background: `linear-gradient(to left, transparent, ${config.borderColor})`,
          }}
        />
      </div>

      {/* Quest Title */}
      <div
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#f5f5dc',
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          marginBottom: notification.objectiveText || notification.xpAwarded || notification.goldAwarded ? '8px' : 0,
        }}
      >
        {notification.questTitle}
      </div>

      {/* Objective text (if present) */}
      {notification.objectiveText && (
        <div
          style={{
            fontSize: '13px',
            color: '#d1d5db',
            textAlign: 'center',
            fontStyle: 'italic',
            marginBottom: notification.xpAwarded || notification.goldAwarded ? '8px' : 0,
          }}
        >
          "{notification.objectiveText}"
        </div>
      )}

      {/* Rewards (if present) */}
      {(notification.xpAwarded || notification.goldAwarded) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            fontSize: '12px',
            marginTop: '4px',
          }}
        >
          {notification.xpAwarded ? (
            <span style={{ color: '#a78bfa' }}>
              +{notification.xpAwarded} XP
            </span>
          ) : null}
          {notification.goldAwarded ? (
            <span style={{ color: '#fbbf24' }}>
              +{notification.goldAwarded} Gold
            </span>
          ) : null}
        </div>
      )}

      {/* Decorative bottom line */}
      <div
        style={{
          marginTop: '12px',
          height: '1px',
          background: `linear-gradient(to right, transparent, ${config.borderColor}, transparent)`,
        }}
      />
    </div>
  );
};

export default QuestNotificationOverlay;
