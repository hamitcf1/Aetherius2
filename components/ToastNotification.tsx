

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  // Optional overrides for color and stat metadata
  color?: string;
  stat?: 'health' | 'magicka' | 'stamina' | 'food' | string;
  amount?: number;
}

const toastColors: Record<string, string> = {
  info: '#2d72fc',
  success: '#2ecc40',
  warning: '#ffb700',
  error: '#ff3b30',
  // semantic stat colors (fallbacks)
  health: '#ff3b30',
  stamina: '#2ecc40',
  magicka: '#2d72fc',
  food: '#ffb347',
};

import React, { useEffect, useRef } from 'react';

export const ToastNotification: React.FC<{
  messages: ToastMessage[];
  onClose?: (id: string) => void;
}> = ({ messages, onClose }) => {
  // Track timeouts for each toast
  const timeouts = useRef<{ [id: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    // Set up 5s timeout for each toast
    messages.forEach(({ id }) => {
      if (!timeouts.current[id]) {
        timeouts.current[id] = setTimeout(() => {
          if (onClose) onClose(id);
        }, 5000);
      }
    });
    // Clean up timeouts for removed toasts
    Object.keys(timeouts.current).forEach(id => {
      if (!messages.find(m => m.id === id)) {
        clearTimeout(timeouts.current[id]);
        delete timeouts.current[id];
      }
    });
    return () => {
      Object.values(timeouts.current).forEach(clearTimeout);
      timeouts.current = {};
    };
  }, [messages, onClose]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      right: 32,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      pointerEvents: 'none',
    }}>
      {messages.map(({ id, message, type, color, stat, amount }) => (
        <div
          key={id}
          style={{
            minWidth: 240,
            maxWidth: 400,
            background: color || toastColors[stat || (type as string)] || toastColors[type || 'info'],
            color: '#fff',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            padding: '12px 20px',
            fontSize: 16,
            fontWeight: 500,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: 0.95,
            transition: 'opacity 0.2s',
            cursor: onClose ? 'pointer' : undefined,
          }}
          tabIndex={0}
          role="alert"
          aria-live="polite"
          onClick={() => onClose && onClose(id)}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === ' ') && onClose) onClose(id);
          }}
        >
          <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* show small stat badge if available */}
            {stat && typeof amount === 'number' ? (
              <span style={{ fontWeight: 700, marginRight: 6 }}>{`+${amount} ${stat}`}</span>
            ) : null}
            <span>{message}</span>
          </span>
          {onClose && (
            <button
              style={{
                marginLeft: 16,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 18,
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
              onClick={e => {
                e.stopPropagation();
                onClose(id);
              }}
              aria-label="Close notification"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
