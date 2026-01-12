import React, { useState, useEffect } from 'react';
import { RefreshCw, X, Bell } from 'lucide-react';
import { getVersionChecker, VersionInfo } from '../services/versionCheck';

interface UpdateNotificationProps {
  position?: 'top' | 'bottom';
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ position = 'bottom' }) => {
  const [showNotification, setShowNotification] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checker = getVersionChecker();
    
    // Start checking for updates (every 2 minutes)
    checker.startChecking(2 * 60 * 1000);

    // Subscribe to update notifications
    const unsubscribe = checker.onUpdate((info) => {
      setVersionInfo(info);
      setShowNotification(true);
      setDismissed(false);
    });

    return () => {
      unsubscribe();
      checker.stopChecking();
    };
  }, []);

  const handleRefresh = () => {
    const checker = getVersionChecker();
    checker.refresh();
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Show again after 10 minutes if still not refreshed
    setTimeout(() => {
      if (getVersionChecker().hasUpdate()) {
        setDismissed(false);
      }
    }, 10 * 60 * 1000);
  };

  if (!showNotification || dismissed) return null;

  const positionClasses = position === 'top' 
    ? 'top-0 left-0 right-0' 
    : 'bottom-0 left-0 right-0';

  return (
    <div 
      className={`fixed ${positionClasses} z-[10000] p-3 animate-slide-in`}
      style={{
        animation: position === 'top' ? 'slideDown 0.3s ease-out' : 'slideUp 0.3s ease-out',
      }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-skyrim-accent to-blue-900 border border-skyrim-gold/50 rounded-lg shadow-lg shadow-black/50 p-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-skyrim-gold/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-skyrim-gold animate-pulse" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-skyrim-gold font-serif font-bold text-sm">
                A New Dawn Breaks Over Skyrim
              </h4>
              <p className="text-skyrim-text text-xs mt-0.5">
                The scrolls have been updated. Save your progress and refresh to receive the latest enhancements.
              </p>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 py-1.5 bg-skyrim-gold hover:bg-skyrim-goldHover text-skyrim-dark font-bold text-sm rounded transition-colors"
              >
                <RefreshCw size={14} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-skyrim-text hover:text-white transition-colors"
                title="Dismiss (will remind later)"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default UpdateNotification;
