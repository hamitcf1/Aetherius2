/**
 * SKYRIM DOOM MINIGAME - REMASTERED
 * A polished Doom-style raycasting dungeon crawler with Skyrim theming
 * 
 * Controls:
 * - Mouse: Look around & aim
 * - Left Click: Attack
 * - WASD: Move
 * - Scroll/1-4: Switch weapons
 * - ESC: Pause
 * 
 * Features:
 * - Smooth 2.5D raycasting engine
 * - Enemy AI with pathfinding
 * - 4 Weapons (Fists, Sword, Bow, Fireball)
 * - Procedural dungeon generation
 * - Full HUD with minimap
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, Droplet, Zap, RotateCcw, Trophy, Skull, MousePointer, Move } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface DoomMinigameProps {
  isOpen: boolean;
  onClose: (result?: DoomGameResult) => void;
  dungeonName?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'nightmare';
  playerLevel?: number;
  playerStats?: {
    maxHealth: number;
    maxMagicka: number;
    maxStamina: number;
    damage: number;
    armor: number;
  };
  showToast?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

interface DoomGameResult {
  completed: boolean;
  victory: boolean;
  score: number;
  enemiesKilled: number;
  secretsFound: number;
  timeElapsed: number;
  rewards?: {
    gold: number;
    xp: number;
    items?: Array<{ name: string; type: string; quantity: number; rarity?: string }>;
  };
}

interface Vec2 {
  x: number;
  y: number;
}

interface Player {
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  magicka: number;
  maxMagicka: number;
  stamina: number;
  maxStamina: number;
  weapon: number;
  armor: number;
  isAttacking: boolean;
  attackTimer: number;
  isDead: boolean;
  bobPhase: number;
  velocity: Vec2;
}

interface Weapon {
  id: string;
  name: string;
  damage: number;
  range: number;
  attackSpeed: number;
  staminaCost: number;
  magickaCost: number;
  projectile: boolean;
  color: string;
  icon: string;
}

interface Enemy {
  id: number;
  type: number;
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  state: 'idle' | 'chase' | 'attack' | 'hurt' | 'dead';
  attackTimer: number;
  hurtTimer: number;
  distance: number;
}

interface EnemyType {
  name: string;
  health: number;
  damage: number;
  speed: number;
  xp: number;
  gold: number;
  color: string;
  aggroRange: number;
  attackRange: number;
}

interface Projectile {
  x: number;
  y: number;
  angle: number;
  speed: number;
  damage: number;
  type: string;
  life: number;
}

interface Pickup {
  x: number;
  y: number;
  type: 'health' | 'magicka' | 'gold';
  value: number;
  collected: boolean;
}

interface Level {
  width: number;
  height: number;
  map: number[][];
  playerStart: Vec2;
  exit: Vec2;
}

interface GameMessage {
  text: string;
  color: string;
  time: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 600;
const FOV = Math.PI / 3;
const HALF_FOV = FOV / 2;
const NUM_RAYS = 480;
const MAX_DEPTH = 24;
const MOVE_SPEED = 0.06;
const MOUSE_SENSITIVITY = 0.002;

const WALL_COLORS: { [key: number]: { light: string; dark: string } } = {
  1: { light: '#5a5a6a', dark: '#3a3a4a' },
  2: { light: '#4a4a5a', dark: '#2a2a3a' },
  3: { light: '#6a6a7a', dark: '#4a4a5a' },
  4: { light: '#8b6914', dark: '#5a4510' },
  5: { light: '#3a5a7a', dark: '#2a3a5a' },
  6: { light: '#7a5a4a', dark: '#4a3a2a' },
  7: { light: '#4a6a4a', dark: '#2a4a2a' },
  10: { light: '#ff8800', dark: '#cc5500' },
};

const WEAPONS: Weapon[] = [
  { id: 'fists', name: 'Fists', damage: 8, range: 1.8, attackSpeed: 250, staminaCost: 5, magickaCost: 0, projectile: false, color: '#deb887', icon: '👊' },
  { id: 'sword', name: 'Iron Sword', damage: 18, range: 2.2, attackSpeed: 350, staminaCost: 10, magickaCost: 0, projectile: false, color: '#c0c0c0', icon: '⚔️' },
  { id: 'bow', name: 'Hunting Bow', damage: 25, range: 20, attackSpeed: 600, staminaCost: 12, magickaCost: 0, projectile: true, color: '#8b4513', icon: '🏹' },
  { id: 'fireball', name: 'Fireball', damage: 35, range: 18, attackSpeed: 800, staminaCost: 0, magickaCost: 30, projectile: true, color: '#ff4500', icon: '🔥' },
];

const ENEMY_TYPES: EnemyType[] = [
  { name: 'Draugr', health: 45, damage: 10, speed: 0.025, xp: 30, gold: 18, color: '#4a8080', aggroRange: 9, attackRange: 1.6 },
  { name: 'Skeleton', health: 30, damage: 8, speed: 0.035, xp: 20, gold: 12, color: '#e8e8d0', aggroRange: 11, attackRange: 1.6 },
  { name: 'Frostbite Spider', health: 25, damage: 6, speed: 0.04, xp: 15, gold: 8, color: '#3f5f5f', aggroRange: 7, attackRange: 1.3 },
  { name: 'Restless Spirit', health: 35, damage: 12, speed: 0.03, xp: 35, gold: 22, color: '#a0d0e0', aggroRange: 13, attackRange: 2.2 },
  { name: 'Draugr Deathlord', health: 180, damage: 25, speed: 0.02, xp: 150, gold: 100, color: '#305050', aggroRange: 16, attackRange: 2.0 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateLevel(levelNum: number): Level {
  const size = Math.min(32 + levelNum * 6, 56);
  const width = size;
  const height = size;
  const map: number[][] = Array(height).fill(null).map(() => Array(width).fill(1));

  const rooms: Array<{ x: number; y: number; w: number; h: number }> = [];

  // Carve rooms
  const numRooms = 6 + levelNum * 2;
  for (let i = 0; i < numRooms * 3; i++) {
    const w = 5 + Math.floor(Math.random() * 5);
    const h = 5 + Math.floor(Math.random() * 5);
    const x = 2 + Math.floor(Math.random() * (width - w - 4));
    const y = 2 + Math.floor(Math.random() * (height - h - 4));

    // Check overlap
    let overlaps = false;
    for (const room of rooms) {
      if (x < room.x + room.w + 2 && x + w + 2 > room.x && y < room.y + room.h + 2 && y + h + 2 > room.y) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps && rooms.length < numRooms) {
      // Carve room
      for (let ry = y; ry < y + h; ry++) {
        for (let rx = x; rx < x + w; rx++) {
          map[ry][rx] = 0;
        }
      }
      rooms.push({ x, y, w, h });
    }
  }

  // Connect rooms with corridors
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1];
    const b = rooms[i];
    const ax = Math.floor(a.x + a.w / 2);
    const ay = Math.floor(a.y + a.h / 2);
    const bx = Math.floor(b.x + b.w / 2);
    const by = Math.floor(b.y + b.h / 2);

    let x = ax, y = ay;
    while (x !== bx || y !== by) {
      if (y >= 0 && y < height && x >= 0 && x < width) {
        map[y][x] = 0;
        if (y > 0) map[y - 1][x] = 0;
        if (y < height - 1) map[y + 1][x] = 0;
      }
      if (Math.random() < 0.5 && x !== bx) {
        x += x < bx ? 1 : -1;
      } else if (y !== by) {
        y += y < by ? 1 : -1;
      } else {
        x += x < bx ? 1 : -1;
      }
    }
  }

  // Add wall texture variety
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (map[y][x] === 1) {
        const r = Math.random();
        if (r < 0.12) map[y][x] = 2;
        else if (r < 0.2) map[y][x] = 3;
        else if (r < 0.25) map[y][x] = 7;
      }
    }
  }

  // Player start
  const startRoom = rooms[0];
  const playerStart: Vec2 = {
    x: startRoom.x + startRoom.w / 2,
    y: startRoom.y + startRoom.h / 2,
  };

  // Exit
  const endRoom = rooms[rooms.length - 1];
  const exit: Vec2 = {
    x: Math.floor(endRoom.x + endRoom.w / 2),
    y: Math.floor(endRoom.y + endRoom.h / 2),
  };
  map[exit.y][exit.x] = 10;

  return { width, height, map, playerStart, exit };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RAYCASTING
// ═══════════════════════════════════════════════════════════════════════════════

function castRay(map: number[][], width: number, height: number, ox: number, oy: number, angle: number): { dist: number; wall: number; side: number } {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  let mapX = Math.floor(ox);
  let mapY = Math.floor(oy);

  const ddx = Math.abs(1 / dx);
  const ddy = Math.abs(1 / dy);

  let stepX: number, stepY: number;
  let sideDistX: number, sideDistY: number;

  if (dx < 0) { stepX = -1; sideDistX = (ox - mapX) * ddx; }
  else { stepX = 1; sideDistX = (mapX + 1 - ox) * ddx; }

  if (dy < 0) { stepY = -1; sideDistY = (oy - mapY) * ddy; }
  else { stepY = 1; sideDistY = (mapY + 1 - oy) * ddy; }

  let side = 0;
  let wall = 1;

  for (let i = 0; i < 64; i++) {
    if (sideDistX < sideDistY) {
      sideDistX += ddx;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += ddy;
      mapY += stepY;
      side = 1;
    }

    if (mapX < 0 || mapX >= width || mapY < 0 || mapY >= height) break;
    if (map[mapY][mapX] > 0) {
      wall = map[mapY][mapX];
      break;
    }
  }

  let dist: number;
  if (side === 0) dist = (mapX - ox + (1 - stepX) / 2) / dx;
  else dist = (mapY - oy + (1 - stepY) / 2) / dy;

  return { dist: Math.max(0.1, dist), wall, side };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const DoomMinigame: React.FC<DoomMinigameProps> = ({
  isOpen,
  onClose,
  dungeonName = 'Nordic Crypt',
  difficulty = 'medium',
  playerLevel = 1,
  playerStats,
  showToast,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Game status (only this causes re-renders)
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing' | 'paused' | 'victory' | 'death'>('menu');
  const [finalStats, setFinalStats] = useState({ score: 0, kills: 0, time: 0 });
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  // All mutable game state stored in refs to avoid re-renders
  const gameRef = useRef({
    level: null as Level | null,
    levelNum: 0,
    player: {
      x: 3, y: 3, angle: 0,
      health: playerStats?.maxHealth || 100,
      maxHealth: playerStats?.maxHealth || 100,
      magicka: playerStats?.maxMagicka || 60,
      maxMagicka: playerStats?.maxMagicka || 60,
      stamina: playerStats?.maxStamina || 100,
      maxStamina: playerStats?.maxStamina || 100,
      weapon: 1,
      armor: playerStats?.armor || 0,
      isAttacking: false,
      attackTimer: 0,
      isDead: false,
      bobPhase: 0,
      velocity: { x: 0, y: 0 },
    } as Player,
    enemies: [] as Enemy[],
    projectiles: [] as Projectile[],
    pickups: [] as Pickup[],
    messages: [] as GameMessage[],
    score: 0,
    kills: 0,
    startTime: 0,
    keys: new Set<string>(),
    mouseDown: false,
    lastAttackTime: 0,
  });

  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  const initLevel = useCallback((levelNum: number) => {
    const level = generateLevel(levelNum);
    const game = gameRef.current;

    game.level = level;
    game.levelNum = levelNum;
    game.player.x = level.playerStart.x;
    game.player.y = level.playerStart.y;
    game.player.angle = 0;
    game.player.health = game.player.maxHealth;
    game.player.magicka = game.player.maxMagicka;
    game.player.stamina = game.player.maxStamina;
    game.player.isDead = false;
    game.player.isAttacking = false;
    game.player.attackTimer = 0;
    game.projectiles = [];
    game.messages = [];

    // Spawn enemies
    const diffMult = difficulty === 'easy' ? 0.7 : difficulty === 'hard' ? 1.4 : difficulty === 'nightmare' ? 2 : 1;
    const numEnemies = Math.floor((4 + levelNum * 3) * diffMult);
    game.enemies = [];

    for (let i = 0; i < numEnemies; i++) {
      let ex: number, ey: number;
      let tries = 0;
      do {
        ex = 3 + Math.random() * (level.width - 6);
        ey = 3 + Math.random() * (level.height - 6);
        tries++;
      } while ((level.map[Math.floor(ey)]?.[Math.floor(ex)] !== 0 ||
        Math.hypot(ex - game.player.x, ey - game.player.y) < 5) && tries < 50);

      if (level.map[Math.floor(ey)]?.[Math.floor(ex)] === 0) {
        const type = levelNum >= 3 && i === 0 ? 4 : Math.floor(Math.random() * 4);
        const def = ENEMY_TYPES[type];
        game.enemies.push({
          id: i,
          type,
          x: ex,
          y: ey,
          angle: Math.random() * Math.PI * 2,
          health: Math.floor(def.health * (1 + levelNum * 0.15)),
          maxHealth: Math.floor(def.health * (1 + levelNum * 0.15)),
          state: 'idle',
          attackTimer: 0,
          hurtTimer: 0,
          distance: 0,
        });
      }
    }

    // Spawn pickups
    game.pickups = [];
    for (let y = 2; y < level.height - 2; y++) {
      for (let x = 2; x < level.width - 2; x++) {
        if (level.map[y][x] === 0 && Math.random() < 0.03) {
          const r = Math.random();
          game.pickups.push({
            x: x + 0.5,
            y: y + 0.5,
            type: r < 0.3 ? 'health' : r < 0.5 ? 'magicka' : 'gold',
            value: r < 0.3 ? 25 : r < 0.5 ? 20 : 15 + Math.floor(Math.random() * 20),
            collected: false,
          });
        }
      }
    }

    addMessage(`Entering ${level.width > 40 ? 'Deep ' : ''}Nordic Crypt - Level ${levelNum + 1}`, '#ffd700');
  }, [difficulty]);

  const startGame = useCallback(() => {
    const game = gameRef.current;
    game.score = 0;
    game.kills = 0;
    game.startTime = Date.now();
    game.player.health = game.player.maxHealth;
    game.player.magicka = game.player.maxMagicka;
    game.player.stamina = game.player.maxStamina;
    game.player.weapon = 1;
    initLevel(0);
    setGameStatus('playing');

    // Request pointer lock
    if (containerRef.current) {
      containerRef.current.requestPointerLock?.();
    }
  }, [initLevel]);

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGE SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════

  const addMessage = useCallback((text: string, color: string = '#ffffff') => {
    const game = gameRef.current;
    game.messages.push({ text, color, time: Date.now() });
    if (game.messages.length > 5) game.messages.shift();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBAT
  // ═══════════════════════════════════════════════════════════════════════════

  const playerAttack = useCallback(() => {
    const game = gameRef.current;
    const player = game.player;

    if (player.isAttacking || player.isDead) return;

    const weapon = WEAPONS[player.weapon];
    const now = Date.now();

    if (now - game.lastAttackTime < weapon.attackSpeed) return;

    // Check resources
    if (weapon.staminaCost > 0 && player.stamina < weapon.staminaCost) {
      addMessage('Not enough stamina!', '#ff6666');
      return;
    }
    if (weapon.magickaCost > 0 && player.magicka < weapon.magickaCost) {
      addMessage('Not enough magicka!', '#6666ff');
      return;
    }

    // Consume resources
    player.stamina -= weapon.staminaCost;
    player.magicka -= weapon.magickaCost;
    player.isAttacking = true;
    player.attackTimer = weapon.attackSpeed;
    game.lastAttackTime = now;

    if (weapon.projectile) {
      // Spawn projectile
      game.projectiles.push({
        x: player.x,
        y: player.y,
        angle: player.angle,
        speed: weapon.id === 'bow' ? 0.4 : 0.3,
        damage: weapon.damage,
        type: weapon.id,
        life: 120,
      });
    } else {
      // Melee hit detection
      for (const enemy of game.enemies) {
        if (enemy.state === 'dead') continue;

        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.hypot(dx, dy);

        if (dist > weapon.range) continue;

        let angleDiff = Math.atan2(dy, dx) - player.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (Math.abs(angleDiff) < 0.6) {
          const damage = weapon.damage + Math.floor(Math.random() * 6);
          enemy.health -= damage;
          enemy.state = 'hurt';
          enemy.hurtTimer = 10;

          addMessage(`Hit ${ENEMY_TYPES[enemy.type].name} for ${damage}!`, '#ffaa00');

          if (enemy.health <= 0) {
            enemy.state = 'dead';
            const def = ENEMY_TYPES[enemy.type];
            game.score += def.xp + def.gold;
            game.kills++;
            addMessage(`${def.name} defeated! +${def.xp}XP +${def.gold}G`, '#44ff44');
          }
          break; // Only hit one enemy per swing
        }
      }
    }
  }, [addMessage]);

  // ═══════════════════════════════════════════════════════════════════════════
  // INPUT HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!isOpen) return;

    const game = gameRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      const key = e.key.toLowerCase();
      game.keys.add(key);

      // Weapon switching with number keys
      if (key >= '1' && key <= '4') {
        game.player.weapon = parseInt(key) - 1;
      }

      // Pause
      if (key === 'escape') {
        document.exitPointerLock?.();
        setGameStatus('paused');
      }

      // Prevent default for game keys
      if (['w', 'a', 's', 'd', ' ', '1', '2', '3', '4'].includes(key)) {
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      game.keys.delete(e.key.toLowerCase());
    };

    const onMouseMove = (e: MouseEvent) => {
      if (gameStatus !== 'playing' || !isPointerLocked) return;
      game.player.angle += e.movementX * MOUSE_SENSITIVITY;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (gameStatus !== 'playing') return;
      if (e.button === 0) {
        game.mouseDown = true;
        playerAttack();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        game.mouseDown = false;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (gameStatus !== 'playing') return;
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      game.player.weapon = (game.player.weapon + dir + 4) % 4;
    };

    const onPointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === containerRef.current);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('pointerlockchange', onPointerLockChange);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('wheel', onWheel);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
    };
  }, [isOpen, gameStatus, isPointerLocked, playerAttack]);

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME UPDATE
  // ═══════════════════════════════════════════════════════════════════════════

  const update = useCallback((dt: number) => {
    const game = gameRef.current;
    const player = game.player;
    const level = game.level;

    if (!level || player.isDead) return;

    const keys = game.keys;

    // ─── Player Movement ───
    const cos = Math.cos(player.angle);
    const sin = Math.sin(player.angle);
    let moveX = 0, moveY = 0;
    let moving = false;

    if (keys.has('w')) { moveX += cos; moveY += sin; moving = true; }
    if (keys.has('s')) { moveX -= cos; moveY -= sin; moving = true; }
    if (keys.has('a')) { moveX += sin; moveY -= cos; moving = true; }
    if (keys.has('d')) { moveX -= sin; moveY += cos; moving = true; }

    // Normalize diagonal movement
    const len = Math.hypot(moveX, moveY);
    if (len > 0) {
      moveX = (moveX / len) * MOVE_SPEED * dt;
      moveY = (moveY / len) * MOVE_SPEED * dt;
    }

    // Apply movement with collision
    const newX = player.x + moveX;
    const newY = player.y + moveY;
    const margin = 0.25;

    // Check X movement
    if (level.map[Math.floor(player.y)]?.[Math.floor(newX + margin * Math.sign(moveX))] === 0) {
      player.x = newX;
    }
    // Check Y movement
    if (level.map[Math.floor(newY + margin * Math.sign(moveY))]?.[Math.floor(player.x)] === 0) {
      player.y = newY;
    }

    // Bob animation
    if (moving) {
      player.bobPhase = (player.bobPhase + 0.12 * dt) % (Math.PI * 2);
    }

    // Resource regeneration
    player.stamina = Math.min(player.maxStamina, player.stamina + 0.05 * dt);
    player.magicka = Math.min(player.maxMagicka, player.magicka + 0.03 * dt);

    // Attack animation timer
    if (player.attackTimer > 0) {
      player.attackTimer -= dt * 16;
      if (player.attackTimer <= 0) {
        player.isAttacking = false;
        player.attackTimer = 0;
      }
    }

    // Continuous attack if mouse held (for rapid weapons)
    if (game.mouseDown && !player.isAttacking) {
      playerAttack();
    }

    // ─── Check Exit ───
    const exitDist = Math.hypot(player.x - level.exit.x - 0.5, player.y - level.exit.y - 0.5);
    if (exitDist < 1.2) {
      const alive = game.enemies.filter(e => e.state !== 'dead');
      if (alive.length === 0) {
        if (game.levelNum >= 2) {
          // Victory!
          const elapsed = Math.floor((Date.now() - game.startTime) / 1000);
          setFinalStats({ score: game.score, kills: game.kills, time: elapsed });
          setGameStatus('victory');
          document.exitPointerLock?.();
          return;
        } else {
          // Next level
          initLevel(game.levelNum + 1);
        }
      } else {
        addMessage(`Defeat all enemies first! (${alive.length} remaining)`, '#ff6666');
      }
    }

    // ─── Update Enemies ───
    for (const enemy of game.enemies) {
      if (enemy.state === 'dead') continue;

      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      enemy.distance = dist;

      const def = ENEMY_TYPES[enemy.type];

      // Hurt stun
      if (enemy.hurtTimer > 0) {
        enemy.hurtTimer -= dt;
        if (enemy.hurtTimer <= 0) enemy.state = 'chase';
        continue;
      }

      // State logic
      if (dist < def.aggroRange || enemy.state === 'chase') {
        if (dist <= def.attackRange) {
          enemy.state = 'attack';
          enemy.attackTimer -= dt * 16;

          if (enemy.attackTimer <= 0) {
            // Attack player
            const dmg = Math.max(1, def.damage - player.armor);
            player.health -= dmg;
            addMessage(`${def.name} attacks for ${dmg}!`, '#ff4444');
            enemy.attackTimer = 60;

            if (player.health <= 0) {
              player.health = 0;
              player.isDead = true;
              const elapsed = Math.floor((Date.now() - game.startTime) / 1000);
              setFinalStats({ score: game.score, kills: game.kills, time: elapsed });
              setGameStatus('death');
              document.exitPointerLock?.();
            }
          }
        } else {
          enemy.state = 'chase';
          // Move towards player
          const angle = Math.atan2(dy, dx);
          enemy.angle = angle;
          const speed = def.speed * dt;
          const nx = enemy.x + Math.cos(angle) * speed;
          const ny = enemy.y + Math.sin(angle) * speed;

          if (level.map[Math.floor(ny)]?.[Math.floor(nx)] === 0) {
            enemy.x = nx;
            enemy.y = ny;
          } else if (level.map[Math.floor(enemy.y)]?.[Math.floor(nx)] === 0) {
            enemy.x = nx;
          } else if (level.map[Math.floor(ny)]?.[Math.floor(enemy.x)] === 0) {
            enemy.y = ny;
          }
        }
      } else {
        enemy.state = 'idle';
      }
    }

    // ─── Update Projectiles ───
    game.projectiles = game.projectiles.filter(proj => {
      proj.x += Math.cos(proj.angle) * proj.speed * dt;
      proj.y += Math.sin(proj.angle) * proj.speed * dt;
      proj.life -= dt;

      // Wall collision
      if (level.map[Math.floor(proj.y)]?.[Math.floor(proj.x)] > 0) {
        return false;
      }

      // Enemy collision
      for (const enemy of game.enemies) {
        if (enemy.state === 'dead') continue;
        const d = Math.hypot(proj.x - enemy.x, proj.y - enemy.y);
        if (d < 0.6) {
          const dmg = proj.damage + Math.floor(Math.random() * 8);
          enemy.health -= dmg;
          enemy.state = 'hurt';
          enemy.hurtTimer = 8;
          addMessage(`${ENEMY_TYPES[enemy.type].name} hit for ${dmg}!`, '#ffaa00');

          if (enemy.health <= 0) {
            enemy.state = 'dead';
            const def = ENEMY_TYPES[enemy.type];
            game.score += def.xp + def.gold;
            game.kills++;
            addMessage(`${def.name} defeated! +${def.xp}XP +${def.gold}G`, '#44ff44');
          }
          return false;
        }
      }

      return proj.life > 0;
    });

    // ─── Pickups ───
    for (const pickup of game.pickups) {
      if (pickup.collected) continue;
      const d = Math.hypot(player.x - pickup.x, player.y - pickup.y);
      if (d < 0.6) {
        pickup.collected = true;
        if (pickup.type === 'health') {
          player.health = Math.min(player.maxHealth, player.health + pickup.value);
          addMessage(`+${pickup.value} Health`, '#ff4444');
        } else if (pickup.type === 'magicka') {
          player.magicka = Math.min(player.maxMagicka, player.magicka + pickup.value);
          addMessage(`+${pickup.value} Magicka`, '#4444ff');
        } else {
          game.score += pickup.value;
          addMessage(`+${pickup.value} Gold`, '#ffd700');
        }
      }
    }

    // Clean old messages
    game.messages = game.messages.filter(m => Date.now() - m.time < 3000);
  }, [addMessage, initLevel, playerAttack]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDERING
  // ═══════════════════════════════════════════════════════════════════════════

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const game = gameRef.current;
    const player = game.player;
    const level = game.level;

    if (!level) return;

    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // Ceiling gradient
    const ceilGrad = ctx.createLinearGradient(0, 0, 0, H / 2);
    ceilGrad.addColorStop(0, '#0a0a15');
    ceilGrad.addColorStop(1, '#1a1a2a');
    ctx.fillStyle = ceilGrad;
    ctx.fillRect(0, 0, W, H / 2);

    // Floor gradient
    const floorGrad = ctx.createLinearGradient(0, H / 2, 0, H);
    floorGrad.addColorStop(0, '#1a1510');
    floorGrad.addColorStop(1, '#0a0a05');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, H / 2, W, H / 2);

    // ─── Raycasting ───
    const depthBuffer: number[] = [];
    const rayWidth = W / NUM_RAYS;

    for (let i = 0; i < NUM_RAYS; i++) {
      const rayAngle = player.angle - HALF_FOV + (i / NUM_RAYS) * FOV;
      const ray = castRay(level.map, level.width, level.height, player.x, player.y, rayAngle);

      const corrDist = ray.dist * Math.cos(rayAngle - player.angle);
      depthBuffer[i] = corrDist;

      const wallH = Math.min(H * 2, (H / corrDist) * 1.3);
      const wallTop = (H - wallH) / 2;

      const colors = WALL_COLORS[ray.wall] || WALL_COLORS[1];
      const baseColor = ray.side === 1 ? colors.dark : colors.light;
      const shade = Math.max(0.15, 1 - corrDist / MAX_DEPTH);

      ctx.fillStyle = baseColor;
      ctx.globalAlpha = shade;
      ctx.fillRect(i * rayWidth, wallTop, rayWidth + 1, wallH);
      ctx.globalAlpha = 1;
    }

    // ─── Sprites ───
    interface Sprite {
      x: number;
      y: number;
      dist: number;
      type: 'enemy' | 'pickup' | 'projectile';
      data: Enemy | Pickup | Projectile;
    }

    const sprites: Sprite[] = [];

    // Enemies
    for (const e of game.enemies) {
      if (e.state !== 'dead') {
        sprites.push({ x: e.x, y: e.y, dist: e.distance, type: 'enemy', data: e });
      }
    }

    // Pickups
    for (const p of game.pickups) {
      if (!p.collected) {
        const d = Math.hypot(p.x - player.x, p.y - player.y);
        sprites.push({ x: p.x, y: p.y, dist: d, type: 'pickup', data: p });
      }
    }

    // Projectiles
    for (const p of game.projectiles) {
      const d = Math.hypot(p.x - player.x, p.y - player.y);
      sprites.push({ x: p.x, y: p.y, dist: d, type: 'projectile', data: p });
    }

    // Sort far to near
    sprites.sort((a, b) => b.dist - a.dist);

    // Draw sprites
    for (const sprite of sprites) {
      if (sprite.dist < 0.3 || sprite.dist > MAX_DEPTH) continue;

      const dx = sprite.x - player.x;
      const dy = sprite.y - player.y;

      let angle = Math.atan2(dy, dx) - player.angle;
      while (angle > Math.PI) angle -= Math.PI * 2;
      while (angle < -Math.PI) angle += Math.PI * 2;

      if (Math.abs(angle) > HALF_FOV + 0.3) continue;

      const screenX = W / 2 + (angle / HALF_FOV) * (W / 2);
      const spriteH = (H / sprite.dist) * 0.85;
      const spriteW = spriteH * 0.65;
      const spriteTop = (H - spriteH) / 2;

      // Depth check
      const rayIdx = Math.floor((screenX / W) * NUM_RAYS);
      if (rayIdx >= 0 && rayIdx < NUM_RAYS && depthBuffer[rayIdx] < sprite.dist) continue;

      const shade = Math.max(0.25, 1 - sprite.dist / MAX_DEPTH);
      ctx.globalAlpha = shade;

      if (sprite.type === 'enemy') {
        const enemy = sprite.data as Enemy;
        const def = ENEMY_TYPES[enemy.type];
        const x = screenX - spriteW / 2;
        const y = spriteTop;

        // Hurt flash
        const color = enemy.state === 'hurt' ? '#ff0000' : def.color;

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(x, y + spriteH * 0.2, spriteW, spriteH * 0.6);

        // Head
        ctx.beginPath();
        ctx.arc(screenX, y + spriteH * 0.15, spriteW * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (red when aggressive)
        if (enemy.state === 'chase' || enemy.state === 'attack') {
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(screenX - spriteW * 0.1, y + spriteH * 0.13, spriteW * 0.08, 0, Math.PI * 2);
          ctx.arc(screenX + spriteW * 0.1, y + spriteH * 0.13, spriteW * 0.08, 0, Math.PI * 2);
          ctx.fill();
        }

        // Health bar
        ctx.globalAlpha = 1;
        const hpPct = enemy.health / enemy.maxHealth;
        ctx.fillStyle = '#222';
        ctx.fillRect(x, y - 12, spriteW, 8);
        ctx.fillStyle = hpPct > 0.5 ? '#00cc00' : hpPct > 0.25 ? '#cccc00' : '#cc0000';
        ctx.fillRect(x + 1, y - 11, (spriteW - 2) * hpPct, 6);
        ctx.globalAlpha = shade;
      } else if (sprite.type === 'pickup') {
        const pickup = sprite.data as Pickup;
        const bob = Math.sin(Date.now() / 200) * 6;
        const color = pickup.type === 'health' ? '#ff4444' : pickup.type === 'magicka' ? '#4444ff' : '#ffd700';

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(screenX, spriteTop + spriteH / 2 + bob, spriteW * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.globalAlpha = shade * 0.3;
        ctx.beginPath();
        ctx.arc(screenX, spriteTop + spriteH / 2 + bob, spriteW * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (sprite.type === 'projectile') {
        const proj = sprite.data as Projectile;
        ctx.fillStyle = proj.type === 'fireball' ? '#ff4500' : '#8b4513';
        ctx.beginPath();
        ctx.arc(screenX, spriteTop + spriteH / 2, spriteW * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // Glow for fireball
        if (proj.type === 'fireball') {
          ctx.globalAlpha = shade * 0.4;
          ctx.fillStyle = '#ff6600';
          ctx.beginPath();
          ctx.arc(screenX, spriteTop + spriteH / 2, spriteW * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
    }

    // ─── Draw Weapon ───
    const weapon = WEAPONS[player.weapon];
    const bob = player.isAttacking ? 0 : Math.sin(player.bobPhase) * 4;
    const atkOff = player.isAttacking ? -25 : 0;
    const cx = W / 2;
    const cy = H - 100 + bob + atkOff;

    if (player.weapon === 0) {
      // Fists
      ctx.fillStyle = '#deb887';
      ctx.beginPath();
      ctx.arc(cx - 50 + (player.isAttacking ? 15 : 0), cy + 30, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 50 - (player.isAttacking ? 15 : 0), cy + 30, 28, 0, Math.PI * 2);
      ctx.fill();
    } else if (player.weapon === 1) {
      // Sword
      ctx.save();
      ctx.translate(cx, cy + 20);
      ctx.rotate(player.isAttacking ? -0.6 : 0.25);

      // Blade
      ctx.fillStyle = '#c8c8c8';
      ctx.fillRect(-6, -95, 12, 75);
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(-3, -95, 6, 75);

      // Guard
      ctx.fillStyle = '#8b6914';
      ctx.fillRect(-22, -22, 44, 10);

      // Handle
      ctx.fillStyle = '#5a3510';
      ctx.fillRect(-5, -12, 10, 45);

      ctx.restore();
    } else if (player.weapon === 2) {
      // Bow
      ctx.save();
      ctx.translate(cx - 25, cy);

      // Bow body
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 70, -Math.PI / 2.5, Math.PI / 2.5);
      ctx.stroke();

      // String
      ctx.strokeStyle = '#deb887';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -58);
      ctx.lineTo(player.isAttacking ? -25 : 0, 0);
      ctx.lineTo(0, 58);
      ctx.stroke();

      // Arrow (if not attacking)
      if (!player.isAttacking) {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-5, -3, 55, 6);
        ctx.fillStyle = '#c8c8c8';
        ctx.beginPath();
        ctx.moveTo(50, 0);
        ctx.lineTo(62, -6);
        ctx.lineTo(62, 6);
        ctx.fill();
      }

      ctx.restore();
    } else if (player.weapon === 3) {
      // Magic/Fireball
      ctx.save();
      ctx.translate(cx, cy + 10);

      // Hands
      ctx.fillStyle = '#deb887';
      ctx.beginPath();
      ctx.arc(-45, 30, 22, 0, Math.PI * 2);
      ctx.arc(45, 30, 22, 0, Math.PI * 2);
      ctx.fill();

      // Magic orb
      if (!player.isAttacking) {
        const pulse = 18 + Math.sin(Date.now() / 80) * 6;
        ctx.fillStyle = '#ff4500';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(0, -5, pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(0, -5, pulse * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }

    // ─── Crosshair ───
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 12, H / 2);
    ctx.lineTo(W / 2 - 4, H / 2);
    ctx.moveTo(W / 2 + 4, H / 2);
    ctx.lineTo(W / 2 + 12, H / 2);
    ctx.moveTo(W / 2, H / 2 - 12);
    ctx.lineTo(W / 2, H / 2 - 4);
    ctx.moveTo(W / 2, H / 2 + 4);
    ctx.lineTo(W / 2, H / 2 + 12);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // ─── Minimap ───
    const mmScale = 3;
    const mmSize = Math.min(level.width, level.height) * mmScale;
    const mmX = W - mmSize - 12;
    const mmY = 12;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(mmX - 4, mmY - 4, mmSize + 8, mmSize + 8);

    // Draw map tiles
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        if (level.map[y][x] === 0) ctx.fillStyle = '#333';
        else if (level.map[y][x] === 10) ctx.fillStyle = '#ff6600';
        else ctx.fillStyle = '#666';
        ctx.fillRect(mmX + x * mmScale, mmY + y * mmScale, mmScale, mmScale);
      }
    }

    // Enemies on minimap
    ctx.fillStyle = '#ff0000';
    for (const e of game.enemies) {
      if (e.state !== 'dead') {
        ctx.beginPath();
        ctx.arc(mmX + e.x * mmScale, mmY + e.y * mmScale, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player on minimap
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(mmX + player.x * mmScale, mmY + player.y * mmScale, 3, 0, Math.PI * 2);
    ctx.fill();

    // Player direction
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mmX + player.x * mmScale, mmY + player.y * mmScale);
    ctx.lineTo(
      mmX + player.x * mmScale + Math.cos(player.angle) * 10,
      mmY + player.y * mmScale + Math.sin(player.angle) * 10
    );
    ctx.stroke();
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME LOOP
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!isOpen || gameStatus !== 'playing') {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }
      return;
    }

    let running = true;

    const loop = (time: number) => {
      if (!running) return;

      const dt = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 16.67, 3) : 1;
      lastTimeRef.current = time;

      update(dt);
      render();

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, gameStatus, update, render]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CLOSE HANDLER
  // ═══════════════════════════════════════════════════════════════════════════

  const handleClose = useCallback((completed: boolean = false, victory: boolean = false) => {
    document.exitPointerLock?.();
    const result: DoomGameResult = {
      completed,
      victory,
      score: finalStats.score,
      enemiesKilled: finalStats.kills,
      secretsFound: 0,
      timeElapsed: finalStats.time,
      rewards: victory ? {
        gold: Math.floor(finalStats.score * 0.8),
        xp: finalStats.kills * 30 + 150,
        items: finalStats.kills >= 8 ? [{ name: 'Draugr Helm', type: 'armor', quantity: 1, rarity: 'uncommon' }] : undefined,
      } : undefined,
    };
    onClose(result);
  }, [finalStats, onClose]);

  // Request pointer lock when clicking canvas
  const handleCanvasClick = useCallback(() => {
    if (gameStatus === 'playing' && containerRef.current && !isPointerLocked) {
      containerRef.current.requestPointerLock?.();
    }
  }, [gameStatus, isPointerLocked]);

  const resumeGame = useCallback(() => {
    setGameStatus('playing');
    if (containerRef.current) {
      containerRef.current.requestPointerLock?.();
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER UI
  // ═══════════════════════════════════════════════════════════════════════════

  if (!isOpen) return null;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const game = gameRef.current;
  const player = game.player;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black" ref={containerRef}>
      {/* Close button */}
      <button
        onClick={() => handleClose(false)}
        className="absolute top-4 right-4 z-50 p-2 bg-red-600 hover:bg-red-700 rounded-full text-white"
      >
        <X size={24} />
      </button>

      {/* Main Menu */}
      {gameStatus === 'menu' && (
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <h1 className="text-6xl font-bold text-amber-500 tracking-wider" style={{ fontFamily: 'serif', textShadow: '0 0 20px rgba(255,165,0,0.5)' }}>
            DRAUGR'S DOOM
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Explore the ancient Nordic crypts. Slay the draugr. Claim your rewards.
          </p>

          <div className="bg-black/60 rounded-lg p-4 text-gray-400 text-sm space-y-1">
            <div className="flex items-center gap-2"><MousePointer size={16} className="text-amber-400" /> <span className="text-white">Mouse</span> - Look around & Aim</div>
            <div className="flex items-center gap-2"><span className="text-amber-400 font-bold">LMB</span> <span className="text-white">Left Click</span> - Attack</div>
            <div className="flex items-center gap-2"><Move size={16} className="text-amber-400" /> <span className="text-white">WASD</span> - Move</div>
            <div className="flex items-center gap-2"><span className="text-amber-400 font-bold">1-4</span> <span className="text-white">or Scroll</span> - Switch Weapons</div>
            <div className="flex items-center gap-2"><span className="text-amber-400 font-bold">ESC</span> - Pause</div>
          </div>

          <button
            onClick={startGame}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-black font-bold text-2xl rounded-lg transition-all transform hover:scale-105"
          >
            ENTER THE CRYPT
          </button>
          <div className="text-amber-600/60 text-xs mt-2">
            Dungeon: {dungeonName} | Difficulty: {difficulty.toUpperCase()}
          </div>
        </div>
      )}

      {/* Game View */}
      {(gameStatus === 'playing' || gameStatus === 'paused') && (
        <div className="relative w-full h-full flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="max-w-full max-h-full object-contain cursor-none"
            style={{ imageRendering: 'pixelated' }}
            onClick={handleCanvasClick}
          />

          {/* HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
            {/* Top HUD */}
            <div className="flex justify-between items-start">
              <div className="bg-black/70 rounded px-3 py-2">
                <div className="text-amber-400 font-bold">Level {game.levelNum + 1}</div>
                <div className="text-gray-400 text-sm">
                  Enemies: {game.enemies.filter(e => e.state === 'dead').length}/{game.enemies.length}
                </div>
              </div>

              <div className="bg-black/70 rounded px-3 py-2 text-right">
                <div className="text-amber-400 font-bold">Score: {game.score}</div>
                <div className="text-gray-400 text-sm">Kills: {game.kills}</div>
              </div>
            </div>

            {/* Messages */}
            <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 text-center">
              {game.messages.map((msg, i) => (
                <div
                  key={i}
                  className="text-lg font-bold mb-1"
                  style={{
                    color: msg.color,
                    opacity: Math.max(0, 1 - (Date.now() - msg.time) / 3000),
                    textShadow: '2px 2px 4px black',
                  }}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Click to lock pointer message */}
            {!isPointerLocked && gameStatus === 'playing' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-auto cursor-pointer" onClick={handleCanvasClick}>
                <div className="bg-black/80 px-6 py-4 rounded-lg text-center">
                  <MousePointer className="mx-auto mb-2 text-amber-400" size={32} />
                  <p className="text-white text-lg font-bold">Click to enable mouse look</p>
                  <p className="text-gray-400 text-sm">Press ESC to release cursor</p>
                </div>
              </div>
            )}

            {/* Bottom HUD */}
            <div className="bg-gradient-to-t from-black/90 to-transparent pt-8 -mx-4 -mb-4 px-4 pb-4">
              {/* Resource bars */}
              <div className="flex justify-center gap-6 mb-3">
                <div className="flex items-center gap-2">
                  <Heart className="text-red-500" size={20} />
                  <div className="w-28 h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-150" style={{ width: `${(player.health / player.maxHealth) * 100}%` }} />
                  </div>
                  <span className="text-red-400 text-sm w-14">{Math.floor(player.health)}/{player.maxHealth}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Droplet className="text-blue-500" size={20} />
                  <div className="w-28 h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-150" style={{ width: `${(player.magicka / player.maxMagicka) * 100}%` }} />
                  </div>
                  <span className="text-blue-400 text-sm w-14">{Math.floor(player.magicka)}/{player.maxMagicka}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Zap className="text-green-500" size={20} />
                  <div className="w-28 h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-700 to-green-500 transition-all duration-150" style={{ width: `${(player.stamina / player.maxStamina) * 100}%` }} />
                  </div>
                  <span className="text-green-400 text-sm w-14">{Math.floor(player.stamina)}/{player.maxStamina}</span>
                </div>
              </div>

              {/* Weapon bar */}
              <div className="flex justify-center gap-2">
                {WEAPONS.map((wpn, i) => (
                  <div
                    key={wpn.id}
                    className={`flex flex-col items-center p-2 rounded border-2 transition-all ${player.weapon === i ? 'border-amber-500 bg-amber-500/20' : 'border-gray-600 bg-gray-800/50'
                      }`}
                  >
                    <span className="text-xs text-gray-400">{i + 1}</span>
                    <div className="text-2xl">{wpn.icon}</div>
                    <span className="text-xs text-gray-300">{wpn.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pause overlay */}
          {gameStatus === 'paused' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="bg-gray-900 border-2 border-amber-600 rounded-lg p-8 text-center pointer-events-auto">
                <h2 className="text-4xl font-bold text-amber-500 mb-6">PAUSED</h2>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={resumeGame}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded"
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => handleClose(false)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded"
                  >
                    Exit Dungeon
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Victory Screen */}
      {gameStatus === 'victory' && (
        <div className="flex flex-col items-center justify-center gap-6 text-center p-8">
          <Trophy className="text-amber-500 w-24 h-24 animate-bounce" />
          <h1 className="text-5xl font-bold text-amber-500">VICTORY!</h1>
          <p className="text-gray-300 text-lg">You have conquered the crypt!</p>

          <div className="bg-gray-900/80 rounded-lg p-6 min-w-[300px]">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="text-gray-400">Score:</div>
              <div className="text-amber-400 font-bold">{finalStats.score}</div>
              <div className="text-gray-400">Enemies Killed:</div>
              <div className="text-red-400 font-bold">{finalStats.kills}</div>
              <div className="text-gray-400">Time:</div>
              <div className="text-cyan-400 font-bold">{formatTime(finalStats.time)}</div>
              <div className="text-gray-400">Gold Earned:</div>
              <div className="text-yellow-400 font-bold">{Math.floor(finalStats.score * 0.8)}</div>
              <div className="text-gray-400">XP Earned:</div>
              <div className="text-green-400 font-bold">{finalStats.kills * 30 + 150}</div>
            </div>
          </div>

          <button
            onClick={() => handleClose(true, true)}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xl rounded-lg"
          >
            Claim Rewards & Exit
          </button>
        </div>
      )}

      {/* Death Screen */}
      {gameStatus === 'death' && (
        <div className="flex flex-col items-center justify-center gap-6 text-center p-8">
          <Skull className="text-red-500 w-24 h-24" />
          <h1 className="text-5xl font-bold text-red-500">YOU DIED</h1>
          <p className="text-gray-400 text-lg">The draugr have claimed another soul...</p>

          <div className="bg-gray-900/80 rounded-lg p-6 min-w-[300px]">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="text-gray-400">Final Score:</div>
              <div className="text-amber-400 font-bold">{finalStats.score}</div>
              <div className="text-gray-400">Enemies Killed:</div>
              <div className="text-red-400 font-bold">{finalStats.kills}</div>
              <div className="text-gray-400">Survived:</div>
              <div className="text-cyan-400 font-bold">{formatTime(finalStats.time)}</div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={startGame}
              className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg flex items-center gap-2"
            >
              <RotateCcw size={20} /> Try Again
            </button>
            <button
              onClick={() => handleClose(true, false)}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Exit
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default DoomMinigame;
