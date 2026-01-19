/**
 * EventNotification Component
 * 
 * Skyrim-style notifications for dynamic events and missions:
 * - Tier unlock announcements
 * - New event/mission available
 * - Event completion
 * - Chain progression
 * - Event expiration warnings
 */

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Sparkles, 
  Scroll, 
  Trophy, 
  AlertTriangle, 
  Link2, 
  Star,
  MapPin,
  Clock,
  X 
} from 'lucide-react';
import { EventNotificationData, LevelTier, LEVEL_TIER_THRESHOLDS } from '../types';

interface EventNotificationOverlayProps {
  notifications: EventNotificationData[];
  onDismiss: (id: string) => void;
  onEventClick?: (eventId: string) => void;
}

// Notification overlay that stacks notifications
export const EventNotificationOverlay: React.FC<EventNotificationOverlayProps> = ({
  notifications,
  onDismiss,
  onEventClick,
}) => {
  // Only show non-dismissed notifications
  const visibleNotifications = notifications.filter(n => !n.dismissed).slice(0, 3);

  if (visibleNotifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 140,
        right: 20,
        zIndex: 9997,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
        pointerEvents: 'none',
        maxWidth: '400px',
      }}
    >
      {visibleNotifications.map((notif, index) => (
        <EventNotificationCard
          key={notif.id}
          notification={notif}
          onDismiss={onDismiss}
          onEventClick={onEventClick}
          index={index}
        />
      ))}
    </div>
  );
};

interface EventNotificationCardProps {
  notification: EventNotificationData;
  onDismiss: (id: string) => void;
  onEventClick?: (eventId: string) => void;
  index: number;
}

const EventNotificationCard: React.FC<EventNotificationCardProps> = ({
  notification,
  onDismiss,
  onEventClick,
  index,
}) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Staggered fade in
    const showTimer = setTimeout(() => setVisible(true), 50 + index * 100);

    // Auto-dismiss if configured
    let exitTimer: NodeJS.Timeout;
    let removeTimer: NodeJS.Timeout;

    if (notification.autoDismissSeconds && notification.autoDismissSeconds > 0) {
      exitTimer = setTimeout(() => {
        setExiting(true);
      }, notification.autoDismissSeconds * 1000);

      removeTimer = setTimeout(() => {
        onDismiss(notification.id);
      }, notification.autoDismissSeconds * 1000 + 500);
    }

    return () => {
      clearTimeout(showTimer);
      if (exitTimer) clearTimeout(exitTimer);
      if (removeTimer) clearTimeout(removeTimer);
    };
  }, [notification.id, notification.autoDismissSeconds, onDismiss, index]);

  const handleClick = useCallback(() => {
    if (notification.eventId && onEventClick) {
      onEventClick(notification.eventId);
    }
  }, [notification.eventId, onEventClick]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExiting(true);
    setTimeout(() => onDismiss(notification.id), 300);
  }, [notification.id, onDismiss]);

  const config = getNotificationConfig(notification);

  return (
    <div
      onClick={handleClick}
      style={{
        pointerEvents: 'auto',
        cursor: notification.eventId ? 'pointer' : 'default',
        background: config.bgGradient,
        border: `2px solid ${config.borderColor}`,
        borderRadius: '8px',
        padding: '14px 18px',
        minWidth: '300px',
        maxWidth: '380px',
        boxShadow: `0 4px 20px ${config.glowColor}, inset 0 1px 0 rgba(255,255,255,0.1)`,
        opacity: visible && !exiting ? 1 : 0,
        transform: visible && !exiting ? 'translateX(0)' : 'translateX(20px)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
      }}
    >
      {/* Close button */}
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
      >
        <X size={14} />
      </button>

      {/* Header with icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: `${config.borderColor}20`,
            border: `1px solid ${config.borderColor}60`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: config.borderColor,
          }}
        >
          {config.icon}
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: config.borderColor,
          }}
        >
          {config.label}
        </span>
      </div>

      {/* Title */}
      <h4
        style={{
          margin: '0 0 6px 0',
          fontSize: '16px',
          fontWeight: 600,
          color: '#e8e0d4',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {notification.title}
      </h4>

      {/* Message */}
      <p
        style={{
          margin: 0,
          fontSize: '13px',
          color: '#b8a88a',
          lineHeight: 1.4,
        }}
      >
        {notification.message}
      </p>

      {/* Tier badge for tier unlocks */}
      {notification.type === 'tier-unlock' && notification.tier && (
        <div
          style={{
            marginTop: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: `${config.borderColor}20`,
            borderRadius: '12px',
            fontSize: '12px',
            color: config.borderColor,
            fontWeight: 500,
          }}
        >
          <Star size={12} />
          Tier {notification.tier} - {LEVEL_TIER_THRESHOLDS[notification.tier].name}
        </div>
      )}

      {/* Click hint for event notifications */}
      {notification.eventId && (
        <div
          style={{
            marginTop: '10px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
            fontStyle: 'italic',
          }}
        >
          Click to view on map
        </div>
      )}
    </div>
  );
};

// Configuration for different notification types
const getNotificationConfig = (notification: EventNotificationData) => {
  switch (notification.type) {
    case 'tier-unlock':
      return {
        label: 'Tier Unlocked',
        icon: <Sparkles size={18} />,
        borderColor: '#a855f7',
        glowColor: 'rgba(168, 85, 247, 0.3)',
        bgGradient: 'linear-gradient(135deg, rgba(25, 15, 35, 0.95) 0%, rgba(40, 20, 55, 0.95) 100%)',
      };
    case 'new-event':
      return {
        label: 'New Event',
        icon: <MapPin size={18} />,
        borderColor: '#22c55e',
        glowColor: 'rgba(34, 197, 94, 0.3)',
        bgGradient: 'linear-gradient(135deg, rgba(15, 30, 20, 0.95) 0%, rgba(20, 45, 30, 0.95) 100%)',
      };
    case 'new-mission':
      return {
        label: 'New Mission',
        icon: <Scroll size={18} />,
        borderColor: '#3b82f6',
        glowColor: 'rgba(59, 130, 246, 0.3)',
        bgGradient: 'linear-gradient(135deg, rgba(15, 20, 35, 0.95) 0%, rgba(20, 30, 50, 0.95) 100%)',
      };
    case 'event-expiring':
      return {
        label: 'Event Expiring',
        icon: <Clock size={18} />,
        borderColor: '#f59e0b',
        glowColor: 'rgba(245, 158, 11, 0.3)',
        bgGradient: 'linear-gradient(135deg, rgba(35, 25, 15, 0.95) 0%, rgba(50, 35, 20, 0.95) 100%)',
      };
    case 'event-complete':
      return {
        label: 'Completed',
        icon: <Trophy size={18} />,
        borderColor: '#eab308',
        glowColor: 'rgba(234, 179, 8, 0.3)',
        bgGradient: 'linear-gradient(135deg, rgba(30, 25, 15, 0.95) 0%, rgba(45, 38, 20, 0.95) 100%)',
      };
    case 'chain-complete':
      return {
        label: 'Quest Chain Complete',
        icon: <Link2 size={18} />,
        borderColor: '#ec4899',
        glowColor: 'rgba(236, 72, 153, 0.3)',
        bgGradient: 'linear-gradient(135deg, rgba(35, 15, 25, 0.95) 0%, rgba(50, 20, 35, 0.95) 100%)',
      };
    case 'chain-unlocked':
      return {
        label: 'New Chapter',
        icon: <Link2 size={18} />,
        borderColor: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.3)',
        bgGradient: 'linear-gradient(135deg, rgba(15, 25, 30, 0.95) 0%, rgba(20, 35, 45, 0.95) 100%)',
      };
    default:
      return {
        label: 'Notification',
        icon: <AlertTriangle size={18} />,
        borderColor: '#6b7280',
        glowColor: 'rgba(107, 114, 128, 0.3)',
        bgGradient: 'linear-gradient(135deg, rgba(20, 20, 25, 0.95) 0%, rgba(30, 30, 35, 0.95) 100%)',
      };
  }
};

export default EventNotificationOverlay;
