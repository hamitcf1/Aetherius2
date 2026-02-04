/**
 * SpellEffects - Beautiful visual effects for spells and abilities in combat
 */

import React, { useEffect, useState } from 'react';
import { CombatAbility } from '../types';

export interface SpellEffectState {
  id: string;
  type: 'fire' | 'frost' | 'shock' | 'healing' | 'conjuration' | 'melee' | 'none';
  startTime: number;
  duration: number;
}

/**
 * Determine spell effect type from ability
 */
export const getSpellEffectType = (ability: CombatAbility): SpellEffectState['type'] => {
  if (!ability) return 'none';
  
  const name = (ability.name || '').toLowerCase();
  const description = (ability.description || '').toLowerCase();
  const effects = JSON.stringify(ability.effects || []).toLowerCase();
  const combined = `${name} ${description} ${effects}`;

  // Healing detection
  if (ability.heal || combined.includes('heal') || combined.includes('restoration') || combined.includes('close_wounds') || combined.includes('cure') || combined.includes('guardian') || combined.includes('recovery')) {
    return 'healing';
  }

  // Conjuration detection
  if (combined.includes('summon') || combined.includes('conjur') || combined.includes('bound') || combined.includes('familiar') || combined.includes('atronach') || combined.includes('dremora')) {
    return 'conjuration';
  }

  // Fire detection
  if (combined.includes('fire') || combined.includes('flame') || combined.includes('inferno') || combined.includes('fireball') || combined.includes('burn') || combined.includes('lava')) {
    return 'fire';
  }

  // Frost detection
  if (combined.includes('frost') || combined.includes('ice') || combined.includes('chill') || combined.includes('freeze') || combined.includes('blizzard') || combined.includes('cold') || combined.includes('absolute_zero')) {
    return 'frost';
  }

  // Shock detection
  if (combined.includes('shock') || combined.includes('lightning') || combined.includes('thunder') || combined.includes('spark') || combined.includes('chain_lightning') || combined.includes('electr')) {
    return 'shock';
  }

  // Default to melee if it's a physical ability
  if (ability.type === 'melee' || ability.type === 'ranged') {
    return 'melee';
  }

  return 'none';
};

/**
 * ScreenFlash - Full-screen flash effect for spell impact
 */
export const ScreenFlash: React.FC<{
  effectType: SpellEffectState['type'];
  duration?: number;
}> = ({ effectType, duration = 300 }) => {
  const [opacity, setOpacity] = useState(0.6);

  useEffect(() => {
    const fadeOut = setTimeout(() => {
      setOpacity(0);
    }, duration / 2);

    return () => clearTimeout(fadeOut);
  }, [duration]);

  let bgColor = 'bg-transparent';
  switch (effectType) {
    case 'fire':
      bgColor = 'bg-red-600';
      break;
    case 'frost':
      bgColor = 'bg-blue-600';
      break;
    case 'shock':
      bgColor = 'bg-yellow-500';
      break;
    case 'healing':
      bgColor = 'bg-green-600';
      break;
    case 'conjuration':
      bgColor = 'bg-purple-600';
      break;
    case 'melee':
      bgColor = 'bg-white';
      break;
  }

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[100] ${bgColor}`}
      style={{
        opacity,
        transition: `opacity ${duration}ms ease-out`,
      }}
    />
  );
};

/**
 * ParticleEffect - Animated particles for spell effects
 */
export const ParticleEffect: React.FC<{
  x: number;
  y: number;
  effectType: SpellEffectState['type'];
  count?: number;
}> = ({ x, y, effectType, count = 12 }) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
  }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      return {
        id: i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
      };
    });
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1, // gravity
            life: p.life - 0.05,
          }))
          .filter((p) => p.life > 0)
      );
    }, 30);

    return () => clearInterval(interval);
  }, [x, y, count]);

  let particleColor = 'bg-gray-400';
  let glowColor = 'shadow-red-500';
  switch (effectType) {
    case 'fire':
      particleColor = 'bg-red-500';
      glowColor = 'shadow-red-600/80';
      break;
    case 'frost':
      particleColor = 'bg-blue-400';
      glowColor = 'shadow-blue-600/80';
      break;
    case 'shock':
      particleColor = 'bg-yellow-300';
      glowColor = 'shadow-yellow-500/80';
      break;
    case 'healing':
      particleColor = 'bg-green-400';
      glowColor = 'shadow-green-600/80';
      break;
    case 'conjuration':
      particleColor = 'bg-purple-400';
      glowColor = 'shadow-purple-600/80';
      break;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[95]">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute w-2 h-2 rounded-full ${particleColor} shadow-lg ${glowColor}`}
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            opacity: p.life,
            boxShadow: `0 0 8px currentColor`,
          }}
        />
      ))}
    </div>
  );
};

/**
 * EnergyRing - Expanding ring effect from center point
 */
export const EnergyRing: React.FC<{
  x: number;
  y: number;
  effectType: SpellEffectState['type'];
  duration?: number;
}> = ({ x, y, effectType, duration = 600 }) => {
  const [scale, setScale] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setScale(progress * 400);
      setOpacity(Math.max(1 - progress, 0));
    }, 16);

    return () => clearInterval(interval);
  }, [duration]);

  let borderColor = 'border-gray-500';
  switch (effectType) {
    case 'fire':
      borderColor = 'border-red-500';
      break;
    case 'frost':
      borderColor = 'border-blue-500';
      break;
    case 'shock':
      borderColor = 'border-yellow-400';
      break;
    case 'healing':
      borderColor = 'border-green-500';
      break;
    case 'conjuration':
      borderColor = 'border-purple-500';
      break;
  }

  return (
    <div
      className="fixed pointer-events-none z-[95]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(-50%, -50%)`,
      }}
    >
      <div
        className={`absolute border-2 ${borderColor} rounded-full`}
        style={{
          width: `${scale}px`,
          height: `${scale}px`,
          left: `-${scale / 2}px`,
          top: `-${scale / 2}px`,
          opacity,
          boxShadow: `0 0 20px ${
            effectType === 'fire' ? 'rgba(239, 68, 68, 0.6)' :
            effectType === 'frost' ? 'rgba(59, 130, 246, 0.6)' :
            effectType === 'shock' ? 'rgba(234, 179, 8, 0.6)' :
            effectType === 'healing' ? 'rgba(34, 197, 94, 0.6)' :
            effectType === 'conjuration' ? 'rgba(147, 51, 234, 0.6)' :
            'rgba(107, 114, 128, 0.6)'
          }`,
        }}
      />
    </div>
  );
};

/**
 * LightningBolt - Jagged lightning animation
 */
export const LightningBolt: React.FC<{
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  duration?: number;
}> = ({ fromX, fromY, toX, toY, duration = 150 }) => {
  const [points, setPoints] = useState<[number, number][]>([]);

  useEffect(() => {
    // Generate jagged lightning path
    const segments = 6;
    const newPoints: [number, number][] = [[fromX, fromY]];
    const maxDeviation = 30;

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const x = fromX + (toX - fromX) * t + (Math.random() - 0.5) * maxDeviation;
      const y = fromY + (toY - fromY) * t + (Math.random() - 0.5) * maxDeviation;
      newPoints.push([x, y]);
    }
    newPoints.push([toX, toY]);
    setPoints(newPoints);
  }, [fromX, fromY, toX, toY]);

  return (
    <svg
      className="fixed pointer-events-none z-[95]"
      style={{
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <g>
        {points.map((_, i) => {
          if (i === points.length - 1) return null;
          const [x1, y1] = points[i];
          const [x2, y2] = points[i + 1];
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(234, 179, 8, 0.8)"
              strokeWidth="3"
              filter="drop-shadow(0 0 8px rgba(234, 179, 8, 0.8))"
              style={{
                animation: `flicker ${duration}ms ease-out forwards`,
              }}
            />
          );
        })}
      </g>
      <style>{`
        @keyframes flicker {
          0% { opacity: 1; stroke-width: 4px; }
          100% { opacity: 0; stroke-width: 2px; }
        }
      `}</style>
    </svg>
  );
};

/**
 * HolyLight - Descending rays of light for healing
 */
export const HolyLight: React.FC<{
  x: number;
  y: number;
  duration?: number;
}> = ({ x, y, duration = 800 }) => {
  const [rays, setRays] = useState<Array<{ id: number; offset: number }>>([]);

  useEffect(() => {
    setRays(
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        offset: i * 20,
      }))
    );
  }, []);

  return (
    <div
      className="fixed pointer-events-none z-[95]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(-50%, -50%)`,
      }}
    >
      {rays.map((ray) => (
        <div
          key={ray.id}
          style={{
            position: 'absolute',
            left: '-2px',
            top: `-${ray.offset}px`,
            width: '4px',
            height: '200px',
            background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.8) 0%, rgba(34, 197, 94, 0) 100%)',
            opacity: 0.7,
            animation: `descend ${duration}ms ease-in forwards`,
            animationDelay: `${ray.id * 100}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes descend {
          0% { top: -200px; opacity: 1; }
          100% { top: 100px; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

/**
 * BloodSplatter - Blood particles for damage effects
 */
export const BloodSplatter: React.FC<{
  x: number;
  y: number;
  intensity?: 'light' | 'medium' | 'heavy';
}> = ({ x, y, intensity = 'medium' }) => {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
  }>>([]);

  const particleCount = intensity === 'light' ? 8 : intensity === 'medium' ? 15 : 25;

  useEffect(() => {
    const newParticles = Array.from({ length: particleCount }, (_, i) => {
      const angle = (Math.random() - 0.5) * Math.PI * 1.5; // Spread mostly downward
      const speed = 1 + Math.random() * 4;
      return {
        id: i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + Math.random() * 2,
        life: 1,
        size: 2 + Math.random() * 4,
      };
    });
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.3, // gravity
            life: p.life - 0.03,
          }))
          .filter((p) => p.life > 0)
      );
    }, 20);

    return () => clearInterval(interval);
  }, [x, y, particleCount]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[96]">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-red-600"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.life,
            boxShadow: `0 0 4px rgba(220, 38, 38, ${p.life * 0.8})`,
          }}
        />
      ))}
    </div>
  );
};

/**
 * WeaponTrail - Sword slash trail effect
 */
export const WeaponTrail: React.FC<{
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  duration?: number;
}> = ({ fromX, fromY, toX, toY, duration = 200 }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(elapsed / duration, 1));
    }, 16);

    return () => clearInterval(interval);
  }, [duration]);

  const currentX = fromX + (toX - fromX) * progress;
  const currentY = fromY + (toY - fromY) * progress;

  return (
    <div className="fixed inset-0 pointer-events-none z-[94]">
      <div
        className="absolute bg-gradient-to-r from-transparent via-blue-400 to-transparent"
        style={{
          left: `${Math.min(fromX, currentX)}px`,
          top: `${Math.min(fromY, currentY)}px`,
          width: `${Math.abs(toX - fromX)}px`,
          height: `${Math.abs(toY - fromY)}px`,
          transform: `rotate(${Math.atan2(toY - fromY, toX - fromX)}rad)`,
          transformOrigin: 'left center',
          opacity: 1 - progress,
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.6)',
        }}
      />
    </div>
  );
};

/**
 * MagicGlow - Glowing aura around caster during spell casting
 */
export const MagicGlow: React.FC<{
  x: number;
  y: number;
  effectType: SpellEffectState['type'];
  duration?: number;
}> = ({ x, y, effectType, duration = 1000 }) => {
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(0.8);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setScale(1 + progress * 0.5);
      setOpacity(Math.max(0.8 - progress * 0.8, 0));
    }, 16);

    return () => clearInterval(interval);
  }, [duration]);

  let glowColor = 'rgba(107, 114, 128, 0.6)';
  switch (effectType) {
    case 'fire':
      glowColor = 'rgba(239, 68, 68, 0.6)';
      break;
    case 'frost':
      glowColor = 'rgba(59, 130, 246, 0.6)';
      break;
    case 'shock':
      glowColor = 'rgba(234, 179, 8, 0.6)';
      break;
    case 'healing':
      glowColor = 'rgba(34, 197, 94, 0.6)';
      break;
    case 'conjuration':
      glowColor = 'rgba(147, 51, 234, 0.6)';
      break;
  }

  return (
    <div
      className="fixed pointer-events-none z-[93]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          opacity,
          boxShadow: `0 0 30px ${glowColor}`,
        }}
      />
    </div>
  );
};

/**
 * ScreenShake - Camera shake effect for powerful attacks
 */
export const ScreenShake: React.FC<{
  intensity?: 'light' | 'medium' | 'heavy';
  duration?: number;
}> = ({ intensity = 'medium', duration = 300 }) => {
  const [shake, setShake] = useState({ x: 0, y: 0 });

  const shakeIntensity = intensity === 'light' ? 2 : intensity === 'medium' ? 5 : 10;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        setShake({ x: 0, y: 0 });
        return;
      }

      const progress = elapsed / duration;
      const currentIntensity = shakeIntensity * (1 - progress);
      setShake({
        x: (Math.random() - 0.5) * currentIntensity * 2,
        y: (Math.random() - 0.5) * currentIntensity * 2,
      });
    }, 16);

    return () => clearInterval(interval);
  }, [shakeIntensity, duration]);

  return (
    <style>{`
      .combat-modal-shake {
        transform: translate(${shake.x}px, ${shake.y}px) !important;
      }
    `}</style>
  );
};

/**
 * CriticalHitEffect - Special effect for critical hits
 */
export const CriticalHitEffect: React.FC<{
  x: number;
  y: number;
}> = ({ x, y }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[97]">
      {/* Star burst effect */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const distance = 60;
        const starX = x + Math.cos(angle) * distance;
        const starY = y + Math.sin(angle) * distance;

        return (
          <div
            key={i}
            className="absolute text-2xl animate-ping"
            style={{
              left: `${starX}px`,
              top: `${starY}px`,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${i * 50}ms`,
            }}
          >
            ⭐
          </div>
        );
      })}

      {/* Central explosion */}
      <div
        className="absolute animate-ping"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          transform: 'translate(-50%, -50%)',
          fontSize: '3rem',
        }}
      >
        💥
      </div>
    </div>
  );
};

/**
 * DodgeEffect - Visual feedback for successful dodges
 */
export const DodgeEffect: React.FC<{
  x: number;
  y: number;
}> = ({ x, y }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[97]">
      <div
        className="absolute animate-bounce text-4xl text-blue-400"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          transform: 'translate(-50%, -50%)',
          textShadow: '0 0 10px rgba(59, 130, 246, 0.8)',
        }}
      >
        💨
      </div>
    </div>
  );
};

/**
 * ImpactWave - Expanding shockwave from impact point
 */
export const ImpactWave: React.FC<{
  x: number;
  y: number;
  effectType?: 'physical' | 'magical';
  duration?: number;
}> = ({ x, y, effectType = 'physical', duration = 400 }) => {
  const [scale, setScale] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setScale(progress * 150);
      setOpacity(Math.max(1 - progress, 0));
    }, 16);

    return () => clearInterval(interval);
  }, [duration]);

  const waveColor = effectType === 'physical'
    ? 'rgba(239, 68, 68, 0.4)'
    : 'rgba(147, 51, 234, 0.4)';

  return (
    <div
      className="fixed pointer-events-none z-[92]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(-50%, -50%)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: `${scale}px`,
          height: `${scale}px`,
          left: `-${scale / 2}px`,
          top: `-${scale / 2}px`,
          border: `2px solid ${waveColor}`,
          borderRadius: '50%',
          opacity,
          boxShadow: `0 0 20px ${waveColor}`,
        }}
      />
    </div>
  );
};
export const PortalRift: React.FC<{
  x: number;
  y: number;
  duration?: number;
}> = ({ x, y, duration = 800 }) => {
  return (
    <div
      className="fixed pointer-events-none z-[95]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(-50%, -50%)`,
      }}
    >
      {/* Outer swirl */}
      <div
        style={{
          position: 'absolute',
          width: '120px',
          height: '120px',
          left: '-60px',
          top: '-60px',
          background: 'conic-gradient(from 0deg, rgba(147, 51, 234, 0.6), rgba(168, 85, 247, 0.3), rgba(147, 51, 234, 0.6))',
          borderRadius: '50%',
          animation: `spin-fast ${duration}ms linear forwards`,
          boxShadow: '0 0 40px rgba(147, 51, 234, 0.8)',
        }}
      />
      {/* Inner portal */}
      <div
        style={{
          position: 'absolute',
          width: '60px',
          height: '60px',
          left: '-30px',
          top: '-30px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.8) 0%, rgba(147, 51, 234, 0.4) 100%)',
          borderRadius: '50%',
          animation: `pulse-portal ${duration / 2}ms ease-in-out forwards`,
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.9), inset 0 0 20px rgba(168, 85, 247, 0.5)',
        }}
      />
      <style>{`
        @keyframes spin-fast {
          0% { transform: rotate(0deg); opacity: 1; }
          100% { transform: rotate(360deg); opacity: 0; }
        }
        @keyframes pulse-portal {
          0% { transform: scale(0.5); opacity: 1; }
          50% { transform: scale(1.2); }
          100% { transform: scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

/**
 * ArcEffect - Curved energy arc between two points
 */
export const ArcEffect: React.FC<{
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  effectType: SpellEffectState['type'];
  duration?: number;
}> = ({ fromX, fromY, toX, toY, effectType, duration = 500 }) => {
  let pathColor = 'rgba(255, 255, 255, 0.8)';
  let glowColor = 'rgba(255, 255, 255, 0.6)';

  switch (effectType) {
    case 'fire':
      pathColor = 'rgba(239, 68, 68, 0.9)';
      glowColor = 'rgba(239, 68, 68, 0.4)';
      break;
    case 'frost':
      pathColor = 'rgba(59, 130, 246, 0.9)';
      glowColor = 'rgba(59, 130, 246, 0.4)';
      break;
    case 'shock':
      pathColor = 'rgba(234, 179, 8, 0.9)';
      glowColor = 'rgba(234, 179, 8, 0.4)';
      break;
    case 'healing':
      pathColor = 'rgba(34, 197, 94, 0.9)';
      glowColor = 'rgba(34, 197, 94, 0.4)';
      break;
    case 'conjuration':
      pathColor = 'rgba(147, 51, 234, 0.9)';
      glowColor = 'rgba(147, 51, 234, 0.4)';
      break;
  }

  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2 - 80;

  return (
    <svg
      className="fixed pointer-events-none z-[95]"
      style={{
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <defs>
        <filter id={`glow-${effectType}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={`M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`}
        stroke={pathColor}
        strokeWidth="3"
        fill="none"
        filter={`url(#glow-${effectType})`}
        style={{
          animation: `arcDraw ${duration}ms ease-out forwards`,
        }}
      />
      <circle
        cx={fromX}
        cy={fromY}
        r="6"
        fill={pathColor}
        style={{
          animation: `fadeOut ${duration}ms ease-out forwards`,
        }}
      />
      <circle
        cx={toX}
        cy={toY}
        r="6"
        fill={pathColor}
        style={{
          animation: `fadeOut ${duration}ms ease-out forwards`,
        }}
      />
      <style>{`
        @keyframes arcDraw {
          0% { stroke-dasharray: 500; stroke-dashoffset: 500; opacity: 1; }
          100% { stroke-dasharray: 500; stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </svg>
  );
};
