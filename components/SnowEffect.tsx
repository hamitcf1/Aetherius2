import React, { useEffect, useMemo, memo, useState, useCallback, useRef } from 'react';

/**
 * Clean Weather Effect with optional mouse interaction.
 * - GPU-accelerated transforms
 * - No visual bugs
 * - Configurable intensity
 * - Theme-aware (snow for most themes, blood for Dark Brotherhood)
 * - Supports snow, rain, and blood (Dark Brotherhood) effects
 * - Mouse interaction: particles repelled within cursor radius
 */

export type WeatherEffectType = 'snow' | 'rain' | 'sandstorm' | 'none';

export interface SnowSettings {
  intensity: 'light' | 'normal' | 'heavy' | 'blizzard';
  enableMouseInteraction?: boolean;
  enableAccumulation?: boolean;
  weatherType?: WeatherEffectType;
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

// Interactive particle with position and velocity for mouse physics
interface InteractiveParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVy: number;
  size: number;
  opacity: number;
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

// Generate interactive particles for mouse physics
const generateInteractiveParticles = (count: number, isRain: boolean = false): InteractiveParticle[] => {
  // Rain falls faster than snow
  const baseSpeed = isRain ? 4 : 1;
  const speedVariance = isRain ? 3 : 2;
  const sizeBase = isRain ? 1 : 2;
  const sizeVariance = isRain ? 2 : 4;
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight - window.innerHeight,
    vx: (Math.random() - 0.5) * 0.5,
    vy: baseSpeed + Math.random() * speedVariance,
    baseVy: baseSpeed + Math.random() * speedVariance,
    size: sizeBase + Math.random() * sizeVariance,
    opacity: 0.5 + Math.random() * 0.5,
  }));
};

// Generate rain drops (elongated and faster)
const generateRaindrops = (count: number): Particle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: 1 + Math.random() * 2, // Thinner
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 0.8 + Math.random() * 0.8, // Much faster
    opacity: 0.3 + Math.random() * 0.5,
    drift: -5 + Math.random() * 10, // Less horizontal drift
  }));
};

// Generate sand particles (small, fast, more horizontal)
const generateSandParticles = (count: number): Particle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: 1 + Math.random() * 3, // Smaller particles
    left: -10 + Math.random() * 110, // Start off-screen left sometimes
    delay: Math.random() * 3,
    duration: 1.5 + Math.random() * 2, // Fast horizontal movement
    opacity: 0.4 + Math.random() * 0.4,
    drift: 80 + Math.random() * 120, // Strong horizontal drift
  }));
};

type ParticleType = 'snow' | 'rain' | 'blood' | 'sand';

// CSS keyframes injected once
const injectStyles = (particleType: ParticleType) => {
  const styleId = `${particleType}-particle-styles`;
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  
  if (particleType === 'rain') {
    style.textContent = `
      @keyframes rainfall {
        0% {
          transform: translate3d(0, -10vh, 0);
        }
        100% {
          transform: translate3d(var(--drift), 110vh, 0);
        }
      }

      .raindrop {
        position: fixed;
        top: 0;
        background: linear-gradient(to bottom, rgba(174, 194, 224, 0.8), rgba(174, 194, 224, 0.3));
        border-radius: 0 0 50% 50%;
        pointer-events: none;
        will-change: transform;
        animation: rainfall var(--duration) linear infinite;
        animation-delay: var(--delay);
        z-index: 9999;
      }

      .rain-container {
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
  } else if (particleType === 'sand') {
    style.textContent = `
      @keyframes sandstorm {
        0% {
          transform: translate3d(-20vw, 0, 0) rotate(0deg);
          opacity: 0;
        }
        10% {
          opacity: var(--base-opacity);
        }
        90% {
          opacity: var(--base-opacity);
        }
        100% {
          transform: translate3d(var(--drift), 30vh, 0) rotate(180deg);
          opacity: 0;
        }
      }

      .sand-particle {
        position: fixed;
        top: 0;
        background: radial-gradient(circle, rgba(194, 154, 108, 0.9) 0%, rgba(194, 154, 108, 0.6) 50%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        will-change: transform;
        animation: sandstorm var(--duration) linear infinite;
        animation-delay: var(--delay);
        z-index: 9999;
      }

      .sand-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        pointer-events: none;
        z-index: 9999;
        background: linear-gradient(to bottom, rgba(194, 154, 108, 0.1) 0%, rgba(194, 154, 108, 0.05) 50%, transparent 100%);
      }
    `;
  } else if (particleType === 'blood') {
    style.textContent = `
      @keyframes bloodfall {
        0% {
          transform: translate3d(0, -10vh, 0) rotate(0deg);
        }
        100% {
          transform: translate3d(var(--drift), 110vh, 0) rotate(720deg);
        }
      }

      @keyframes blood-particle-shimmer {
        0%, 100% { opacity: var(--base-opacity); }
        50% { opacity: calc(var(--base-opacity) * 0.6); }
      }

      .blood-particle {
        position: fixed;
        top: 0;
        background: radial-gradient(circle, rgba(220, 20, 60, 0.9) 0%, rgba(220, 20, 60, 0.7) 40%, transparent 70%);
        border-radius: 0%;
        pointer-events: none;
        will-change: transform;
        animation: 
          bloodfall var(--duration) linear infinite,
          blood-particle-shimmer 3s ease-in-out infinite;
        animation-delay: var(--delay);
        z-index: 9999;
      }

      .blood-container {
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
  } else {
    // Snow
    style.textContent = `
      @keyframes snowfall {
        0% {
          transform: translate3d(0, -10vh, 0) rotate(0deg);
        }
        100% {
          transform: translate3d(var(--drift), 110vh, 0) rotate(360deg);
        }
      }

      @keyframes snowflake-shimmer {
        0%, 100% { opacity: var(--base-opacity); }
        50% { opacity: calc(var(--base-opacity) * 0.6); }
      }

      .snowflake {
        position: fixed;
        top: 0;
        background: radial-gradient(circle, #fff 0%, rgba(255,255,255,0.8) 40%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        will-change: transform;
        animation: 
          snowfall var(--duration) linear infinite,
          snowflake-shimmer 3s ease-in-out infinite;
        animation-delay: var(--delay);
        z-index: 9999;
      }

      .snow-container {
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
  }
  
  document.head.appendChild(style);
};

const ParticleElement: React.FC<{ particle: Particle; particleType: ParticleType }> = memo(({ particle, particleType }) => {
  const className = particleType === 'rain' ? 'raindrop' 
    : particleType === 'blood' ? 'blood-particle' 
    : particleType === 'sand' ? 'sand-particle'
    : 'snowflake';
  const glowColor = particleType === 'blood' 
    ? 'rgba(220, 20, 60, 0.4)' 
    : particleType === 'rain' 
      ? 'rgba(174, 194, 224, 0.3)' 
      : particleType === 'sand'
        ? 'rgba(194, 154, 108, 0.3)'
        : 'rgba(255,255,255,0.3)';
  
  // Rain drops are elongated, sand particles are round
  const width = particleType === 'rain' ? particle.size : particle.size;
  const height = particleType === 'rain' ? particle.size * 8 : particle.size;
  
  // Sand particles start from random vertical positions
  const top = particleType === 'sand' ? `${Math.random() * 70}%` : undefined;
  
  return (
    <div
      className={className}
      style={{
        left: `${particle.left}%`,
        top: top,
        width: `${width}px`,
        height: `${height}px`,
        '--duration': `${particle.duration}s`,
        '--delay': `${-particle.delay}s`,
        '--drift': `${particle.drift}px`,
        '--base-opacity': particle.opacity,
        boxShadow: particleType !== 'rain' ? `0 0 ${particle.size * 2}px ${particle.size / 2}px ${glowColor}` : undefined
      } as React.CSSProperties}
    />
  );
});

ParticleElement.displayName = 'ParticleElement';

interface SnowEffectProps {
  settings?: Partial<SnowSettings>;
  theme?: string;
  weatherType?: WeatherEffectType;
}

// Interactive Snow Effect with mouse physics
const InteractiveSnowEffect: React.FC<{ particleCount: number; particleType: ParticleType }> = memo(({ particleCount, particleType }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<InteractiveParticle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number | null>(null);
  
  const MOUSE_RADIUS = 100;
  const REPEL_FORCE = 3;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    // Initialize particles (rain falls faster)
    particlesRef.current = generateInteractiveParticles(particleCount, particleType === 'rain');
    
    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    // Get particle color based on type
    const getParticleColor = (opacity: number) => {
      switch (particleType) {
        case 'blood':
          return `rgba(220, 20, 60, ${opacity})`;
        case 'rain':
          return `rgba(174, 194, 224, ${opacity})`;
        case 'sand':
          return `rgba(194, 154, 108, ${opacity})`;
        default:
          return `rgba(255, 255, 255, ${opacity})`;
      }
    };
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current.forEach(p => {
        // Calculate distance from mouse
        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Apply repel force if within radius
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * REPEL_FORCE;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
        
        // Apply friction and gravity
        p.vx *= 0.98;
        p.vy = p.vy * 0.98 + 0.1;
        
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        
        // Wrap around screen
        if (p.y > canvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
          p.vx = (Math.random() - 0.5) * 0.5;
          p.vy = p.baseVy;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        
        // Draw particle (rain is elongated, others are round)
        if (particleType === 'rain') {
          // Rain drops are elongated streaks
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.size * 8);
          ctx.strokeStyle = getParticleColor(p.opacity);
          ctx.lineWidth = p.size / 2;
          ctx.lineCap = 'round';
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = getParticleColor(p.opacity);
          ctx.fill();
          
          // Add glow effect
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = getParticleColor(p.opacity * 0.3);
          ctx.fill();
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [particleCount, particleType]);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      aria-hidden="true"
    />
  );
});

InteractiveSnowEffect.displayName = 'InteractiveSnowEffect';

const SnowEffect: React.FC<SnowEffectProps> = memo(({ settings, theme, weatherType = 'snow' }) => {
  const intensity = settings?.intensity || 'normal';
  const enableMouseInteraction = settings?.enableMouseInteraction ?? false;
  const baseParticleCount = INTENSITY_MAP[intensity];
  const isBloodEffect = theme === 'dark_brotherhood';
  
  // Determine actual particle type
  const particleType: ParticleType = isBloodEffect ? 'blood' 
    : weatherType === 'rain' ? 'rain' 
    : weatherType === 'sandstorm' ? 'sand'
    : 'snow';
  
  // Rain needs more particles, sand needs even more for thick effect
  const particleCount = particleType === 'rain' 
    ? Math.floor(baseParticleCount * 1.5) 
    : particleType === 'sand'
      ? Math.floor(baseParticleCount * 2)
      : baseParticleCount;
  
  // Use interactive canvas-based effect if mouse interaction is enabled (not for sandstorm)
  if (enableMouseInteraction && particleType !== 'sand') {
    return <InteractiveSnowEffect particleCount={particleCount} particleType={particleType} />;
  }
  
  // Generate particles based on type and intensity (CSS-based)
  const particles = useMemo(() => {
    if (particleType === 'rain') return generateRaindrops(particleCount);
    if (particleType === 'sand') return generateSandParticles(particleCount);
    return generateParticles(particleCount);
  }, [particleCount, particleType]);

  useEffect(() => {
    injectStyles(particleType);
  }, [particleType]);

  const containerClass = particleType === 'rain' ? 'rain-container' 
    : particleType === 'blood' ? 'blood-container' 
    : particleType === 'sand' ? 'sand-container'
    : 'snow-container';

  return (
    <div className={containerClass} aria-hidden="true">
      {particles.map((particle) => (
        <ParticleElement key={particle.id} particle={particle} particleType={particleType} />
      ))}
    </div>
  );
});

SnowEffect.displayName = 'SnowEffect';

export default SnowEffect;
