import React, { useEffect, useState } from 'react';
import { Achievement, RARITY_COLORS } from '../services/achievementsService';
import { Trophy, X } from 'lucide-react';

interface AchievementNotificationProps {
  achievement: Achievement;
  onDismiss: () => void;
  onCollect?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onDismiss,
  onCollect,
  autoHide = true,
  autoHideDelay = 8000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const colors = RARITY_COLORS[achievement.rarity];

  useEffect(() => {
    // Enter animation
    const enterTimer = setTimeout(() => setIsVisible(true), 50);

    // Auto-hide
    let hideTimer: NodeJS.Timeout;
    if (autoHide) {
      hideTimer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(onDismiss, 500);
      }, autoHideDelay);
    }

    return () => {
      clearTimeout(enterTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [autoHide, autoHideDelay, onDismiss]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(onDismiss, 500);
  };

  const handleCollect = () => {
    if (onCollect) {
      onCollect();
      handleDismiss();
    }
  };

  return (
    <div
      className={`
        fixed top-20 left-1/2 -translate-x-1/2 z-[100]
        transition-all duration-500 ease-out
        ${isVisible && !isLeaving ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}
      `}
    >
      <div 
        className={`
          relative overflow-hidden rounded-lg border-2 shadow-2xl
          ${colors.border} ${colors.bg}
          min-w-[320px] max-w-[400px]
        `}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        
        {/* Content */}
        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={20} className={colors.text} />
            <span className={`text-sm font-semibold uppercase tracking-wider ${colors.text}`}>
              Achievement Unlocked!
            </span>
            <button 
              onClick={handleDismiss}
              className="ml-auto p-1 hover:bg-black/20 rounded transition-colors"
            >
              <X size={16} className={colors.text} />
            </button>
          </div>

          {/* Achievement info */}
          <div className="flex items-center gap-3">
            <div className="text-4xl">{achievement.icon}</div>
            <div className="flex-1">
              <h3 className={`font-serif text-lg ${colors.text}`}>{achievement.name}</h3>
              <p className="text-xs text-white/70">{achievement.description}</p>
              <span className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] rounded bg-black/30 ${colors.text}`}>
                {achievement.rarity.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Rewards preview */}
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex gap-3 text-xs">
                {achievement.reward.gold && (
                  <span className="text-yellow-300">💰 {achievement.reward.gold}</span>
                )}
                {achievement.reward.xp && (
                  <span className="text-purple-300">✨ {achievement.reward.xp}</span>
                )}
                {achievement.reward.perkPoint && (
                  <span className="text-green-300">🌟 +{achievement.reward.perkPoint}</span>
                )}
                {achievement.reward.title && (
                  <span className="text-cyan-300">👑 {achievement.reward.title}</span>
                )}
              </div>
              {onCollect && (
                <button
                  onClick={handleCollect}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded transition-colors"
                >
                  Collect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar for auto-hide */}
        {autoHide && (
          <div className="h-1 bg-black/30">
            <div 
              className={`h-full ${colors.text.replace('text-', 'bg-')} opacity-50`}
              style={{ 
                width: '100%',
                animation: `shrink ${autoHideDelay}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default AchievementNotification;
