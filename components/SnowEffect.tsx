import React, { useEffect, useMemo, memo } from 'react';

/**
 * Clean Snow/Blood Effect using CSS animations only.
 * - GPU-accelerated transforms
 * - No visual bugs
 * - Configurable intensity
 * - Theme-aware (snow for most themes, blood for Dark Brotherhood)
 */

export interface SnowSettings {
  intensity: 'light' | 'normal' | 'heavy' | 'blizzard';
  enableMouseInteraction?: boolean;
  enableAccumulation?: boolean;
}

const INTENSITY_MAP = {
  light: 25,
  normal: 50,
  heavy: 100,
  blizzard: 180,
};

interface Particle {
  id: number;
  size: number;
  left: number;
  delay: number;
  duration: number;
  opacity: number;
  drift: number;
}

// Generate particle data
const generateParticles = (count: number): Particle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: 2 + Math.random() * 4,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 8 + Math.random() * 12,
    opacity: 0.5 + Math.random() * 0.5,
    drift: -15 + Math.random() * 30,
  }));
};

// CSS keyframes injected once
const injectStyles = (isBloodEffect: boolean) => {
  const styleId = isBloodEffect ? 'blood-particle-styles' : 'snowflake-styles';
  if (document.getElementById(styleId)) return;

  const particleColor = isBloodEffect 
    ? 'rgba(220, 20, 60, 0.9)' // Crimson red for blood - brighter and more visible
    : '#fff'; // White for snow
  
  const glowColor = isBloodEffect
    ? 'rgba(220, 20, 60, 0.4)' // Crimson red glow for blood - brighter
    : 'rgba(255,255,255,0.3)'; // White glow for snow

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes ${isBloodEffect ? 'bloodfall' : 'snowfall'} {
      0% {
        transform: translate3d(0, -10vh, 0) rotate(0deg);
      }
      100% {
        transform: translate3d(var(--drift), 110vh, 0) rotate(${isBloodEffect ? '720deg' : '360deg'});
      }
    }

    @keyframes ${isBloodEffect ? 'blood-particle-shimmer' : 'snowflake-shimmer'} {
      0%, 100% { opacity: var(--base-opacity); }
      50% { opacity: calc(var(--base-opacity) * 0.6); }
    }

    .${isBloodEffect ? 'blood-particle' : 'snowflake'} {
      position: fixed;
      top: 0;
      background: ${isBloodEffect 
        ? 'radial-gradient(circle, rgba(220, 20, 60, 0.9) 0%, rgba(220, 20, 60, 0.7) 40%, transparent 70%)'
        : 'radial-gradient(circle, #fff 0%, rgba(255,255,255,0.8) 40%, transparent 70%)'};
      border-radius: ${isBloodEffect ? '0%' : '50%'};
      pointer-events: none;
      will-change: transform;
      animation: 
        ${isBloodEffect ? 'bloodfall' : 'snowfall'} var(--duration) linear infinite,
        ${isBloodEffect ? 'blood-particle-shimmer' : 'snowflake-shimmer'} 3s ease-in-out infinite;
      animation-delay: var(--delay);
      z-index: 9999;
    }

    .${isBloodEffect ? 'blood-container' : 'snow-container'} {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      pointer-events: none;
      z-index: 9999;
    }
  `;
  document.head.appendChild(style);
};

const ParticleElement: React.FC<{ particle: Particle; isBloodEffect: boolean }> = memo(({ particle, isBloodEffect }) => (
  <div
    className={isBloodEffect ? 'blood-particle' : 'snowflake'}
    style={{
      left: `${particle.left}%`,
      width: `${particle.size}px`,
      height: `${particle.size}px`,
      '--duration': `${particle.duration}s`,
      '--delay': `${-particle.delay}s`,
      '--drift': `${particle.drift}px`,
      '--base-opacity': particle.opacity,
      boxShadow: `0 0 ${particle.size * 2}px ${particle.size / 2}px ${isBloodEffect ? 'rgba(220, 20, 60, 0.4)' : 'rgba(255,255,255,0.3)'}`
    } as React.CSSProperties}
  />
));

ParticleElement.displayName = 'ParticleElement';

interface SnowEffectProps {
  settings?: Partial<SnowSettings>;
  theme?: string;
}

const SnowEffect: React.FC<SnowEffectProps> = memo(({ settings, theme }) => {
  const intensity = settings?.intensity || 'normal';
  const particleCount = INTENSITY_MAP[intensity];
  const isBloodEffect = theme === 'dark_brotherhood';
  
  // Generate particles based on intensity
  const particles = useMemo(() => generateParticles(particleCount), [particleCount]);

  useEffect(() => {
    injectStyles(isBloodEffect);
  }, [isBloodEffect]);

  return (
    <div className={isBloodEffect ? 'blood-container' : 'snow-container'} aria-hidden="true">
      {particles.map((particle) => (
        <ParticleElement key={particle.id} particle={particle} isBloodEffect={isBloodEffect} />
      ))}
    </div>
  );
});

SnowEffect.displayName = 'SnowEffect';

export default SnowEffect;
