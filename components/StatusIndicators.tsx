import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock, AlertTriangle, Save, Check, Loader, CloudOff } from 'lucide-react';

// ============================================================================
// OFFLINE MODE INDICATOR
// ============================================================================

interface OfflineIndicatorProps {
  onQueueChange?: (queueLength: number) => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onQueueChange }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [queuedChanges, setQueuedChanges] = useState<number>(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show briefly then hide
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check localStorage for queued changes
    const checkQueue = () => {
      try {
        const queue = JSON.parse(localStorage.getItem('aetherius:offlineQueue') || '[]');
        setQueuedChanges(queue.length);
        onQueueChange?.(queue.length);
      } catch {
        setQueuedChanges(0);
      }
    };

    checkQueue();
    const interval = setInterval(checkQueue, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [onQueueChange]);

  // Don't show if online and no banner to show
  if (isOnline && !showBanner) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
      showBanner || !isOnline ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className={`px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 ${
        isOnline 
          ? 'bg-green-900/90 text-green-200 border-b border-green-700' 
          : 'bg-red-900/90 text-red-200 border-b border-red-700'
      }`}>
        {isOnline ? (
          <>
            <Wifi size={16} />
            <span>Back online! Syncing changes...</span>
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span>You're offline. Changes will be saved locally and synced when reconnected.</span>
            {queuedChanges > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-800 rounded-full text-xs">
                {queuedChanges} pending
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// AUTO-SAVE INDICATOR
// ============================================================================

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date | null;
  error?: string | null;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ 
  status, 
  lastSaved,
  error 
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== 'idle') {
      setVisible(true);
    }
    
    // Hide after showing "saved" for 3 seconds
    if (status === 'saved') {
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastSaved.toLocaleTimeString();
  };

  if (!visible && status === 'idle') return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg transition-all duration-300 ${
      status === 'saving' ? 'bg-blue-900/90 border-blue-700 text-blue-200' :
      status === 'saved' ? 'bg-green-900/90 border-green-700 text-green-200' :
      status === 'error' ? 'bg-red-900/90 border-red-700 text-red-200' :
      status === 'offline' ? 'bg-yellow-900/90 border-yellow-700 text-yellow-200' :
      'bg-gray-900/90 border-skyrim-border text-gray-200'
    }`}>
      {status === 'saving' && (
        <>
          <Loader size={16} className="animate-spin" />
          <span className="text-sm">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check size={16} />
          <span className="text-sm">Saved {formatLastSaved()}</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertTriangle size={16} />
          <span className="text-sm">{error || 'Save failed'}</span>
        </>
      )}
      {status === 'offline' && (
        <>
          <CloudOff size={16} />
          <span className="text-sm">Saved locally</span>
        </>
      )}
    </div>
  );
};

// ============================================================================
// RATE LIMIT INDICATOR
// ============================================================================

export interface RateLimitStats {
  callsThisMinute: number;
  callsThisHour: number;
  maxPerMinute: number;
  maxPerHour: number;
  lastCallTime?: number;
}

interface RateLimitIndicatorProps {
  stats: RateLimitStats;
  className?: string;
}

export const RateLimitIndicator: React.FC<RateLimitIndicatorProps> = ({ stats, className = '' }) => {
  const minutePercent = (stats.callsThisMinute / stats.maxPerMinute) * 100;
  const hourPercent = (stats.callsThisHour / stats.maxPerHour) * 100;
  
  const isWarning = minutePercent >= 70 || hourPercent >= 70;
  const isCritical = minutePercent >= 90 || hourPercent >= 90;

  // Don't show if no calls made
  if (stats.callsThisMinute === 0 && stats.callsThisHour === 0) return null;

  return (
    <div className={`flex items-center gap-3 px-3 py-1.5 rounded border text-xs ${
      isCritical ? 'bg-red-900/50 border-red-700 text-red-300' :
      isWarning ? 'bg-yellow-900/50 border-yellow-700 text-yellow-300' :
      'bg-gray-900/50 border-skyrim-border text-skyrim-text'
    } ${className}`}>
      <Clock size={14} />
      
      <div className="flex items-center gap-1.5">
        <span className="opacity-70">Min:</span>
        <div className="w-16 h-1.5 bg-skyrim-paper/50 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${
              minutePercent >= 90 ? 'bg-red-500' :
              minutePercent >= 70 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, minutePercent)}%` }}
          />
        </div>
        <span>{stats.callsThisMinute}/{stats.maxPerMinute}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="opacity-70">Hour:</span>
        <div className="w-16 h-1.5 bg-skyrim-paper/50 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${
              hourPercent >= 90 ? 'bg-red-500' :
              hourPercent >= 70 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, hourPercent)}%` }}
          />
        </div>
        <span>{stats.callsThisHour}/{stats.maxPerHour}</span>
      </div>

      {isCritical && (
        <div className="flex items-center gap-1 text-red-400">
          <AlertTriangle size={14} />
          <span>Slow down!</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ENCUMBRANCE INDICATOR
// ============================================================================

interface EncumbranceIndicatorProps {
  currentWeight: number;
  maxWeight: number;
  className?: string;
}

export const EncumbranceIndicator: React.FC<EncumbranceIndicatorProps> = ({ 
  currentWeight, 
  maxWeight,
  className = ''
}) => {
  const percent = (currentWeight / maxWeight) * 100;
  const isOverEncumbered = currentWeight > maxWeight;
  const isWarning = percent >= 80 && !isOverEncumbered;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-sm">
        <span className={`font-medium ${
          isOverEncumbered ? 'text-red-400' :
          isWarning ? 'text-yellow-400' :
          'text-gray-300'
        }`}>
          {currentWeight.toFixed(1)} / {maxWeight}
        </span>
        <span className="text-gray-500 text-xs">lbs</span>
      </div>
      
      <div className="w-24 h-2 bg-skyrim-paper/50 rounded-full overflow-hidden border border-skyrim-border">
        <div 
          className={`h-full transition-all ${
            isOverEncumbered ? 'bg-red-500' :
            isWarning ? 'bg-yellow-500' :
            'bg-skyrim-gold'
          }`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      
      {isOverEncumbered && (
        <span className="text-red-400 text-xs font-medium animate-pulse">
          Over-encumbered!
        </span>
      )}
    </div>
  );
};

// ============================================================================
// OFFLINE QUEUE MANAGER
// ============================================================================

interface QueuedChange {
  id: string;
  type: 'character' | 'item' | 'quest' | 'journal' | 'story';
  action: 'save' | 'delete';
  data: any;
  timestamp: number;
}

export const queueOfflineChange = (change: Omit<QueuedChange, 'id' | 'timestamp'>) => {
  try {
    const queue: QueuedChange[] = JSON.parse(localStorage.getItem('aetherius:offlineQueue') || '[]');
    queue.push({
      ...change,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    });
    localStorage.setItem('aetherius:offlineQueue', JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to queue offline change:', e);
  }
};

export const getOfflineQueue = (): QueuedChange[] => {
  try {
    return JSON.parse(localStorage.getItem('aetherius:offlineQueue') || '[]');
  } catch {
    return [];
  }
};

export const clearOfflineQueue = () => {
  localStorage.removeItem('aetherius:offlineQueue');
};

export const processOfflineQueue = async (
  handlers: {
    onSaveCharacter?: (data: any) => Promise<void>;
    onSaveItem?: (data: any) => Promise<void>;
    onSaveQuest?: (data: any) => Promise<void>;
    onSaveJournal?: (data: any) => Promise<void>;
    onSaveStory?: (data: any) => Promise<void>;
    onDelete?: (type: string, id: string) => Promise<void>;
  }
) => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  const failed: QueuedChange[] = [];

  for (const change of queue) {
    try {
      if (change.action === 'save') {
        switch (change.type) {
          case 'character':
            await handlers.onSaveCharacter?.(change.data);
            break;
          case 'item':
            await handlers.onSaveItem?.(change.data);
            break;
          case 'quest':
            await handlers.onSaveQuest?.(change.data);
            break;
          case 'journal':
            await handlers.onSaveJournal?.(change.data);
            break;
          case 'story':
            await handlers.onSaveStory?.(change.data);
            break;
        }
      } else if (change.action === 'delete') {
        await handlers.onDelete?.(change.type, change.data.id);
      }
    } catch (e) {
      console.error('Failed to process queued change:', e);
      failed.push(change);
    }
  }

  // Save any failed changes back to queue
  if (failed.length > 0) {
    localStorage.setItem('aetherius:offlineQueue', JSON.stringify(failed));
  } else {
    clearOfflineQueue();
  }
};
