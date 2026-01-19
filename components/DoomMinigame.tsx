/**
 * SKYRIM DOOM MINIGAME
 * A classic Doom-style raycasting dungeon crawler with Skyrim theming
 * 
 * Features:
 * - 2.5D raycasting engine with textured walls
 * - Enemy sprites (Draugr, Skeletons, Spiders)
 * - Weapons (Sword, Bow, Magic)
 * - Procedural dungeon generation
 * - HUD with health, magicka, stamina, minimap
 * - Integration with Aetherius rewards system
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Heart, Droplet, Zap, Sword, Target, Sparkles, Map, Volume2, VolumeX, Pause, Play, RotateCcw, Trophy, Skull, ChevronUp, ChevronDown } from 'lucide-react';

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
  angle: number; // radians
  health: number;
  maxHealth: number;
  magicka: number;
  maxMagicka: number;
  stamina: number;
  maxStamina: number;
  weapon: WeaponType;
  armor: number;
  keys: Set<string>;
  isAttacking: boolean;
  attackFrame: number;
  isDead: boolean;
  bobPhase: number;
  // Movement state
  moveSpeed: number;
  turnSpeed: number;
}

type WeaponType = 'sword' | 'bow' | 'fireball' | 'fists';

interface Weapon {
  id: WeaponType;
  name: string;
  damage: number;
  range: number;
  attackSpeed: number;
  staminaCost: number;
  magickaCost: number;
  projectile: boolean;
  frames: number;
  color: string;
}

interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead';
  attackCooldown: number;
  spriteFrame: number;
  alertness: number;
  targetX: number;
  targetY: number;
  pathCooldown: number;
  distance?: number; // Distance from player for sorting
}

type EnemyType = 'draugr' | 'skeleton' | 'spider' | 'ghost' | 'draugr_boss';

interface EnemyDefinition {
  type: EnemyType;
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
  id: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  damage: number;
  type: 'arrow' | 'fireball';
  owner: 'player' | string;
  lifetime: number;
}

interface Pickup {
  id: string;
  x: number;
  y: number;
  type: 'health' | 'magicka' | 'stamina' | 'gold' | 'key' | 'treasure';
  value: number;
  color: string;
  keyColor?: string;
  collected: boolean;
}

interface DungeonLevel {
  width: number;
  height: number;
  map: number[][]; // 0 = empty, 1-9 = wall types, 10+ = special
  playerStart: Vec2;
  exitPos: Vec2;
  enemies: Enemy[];
  pickups: Pickup[];
  secrets: Vec2[];
  name: string;
}

interface GameState {
  status: 'menu' | 'playing' | 'paused' | 'victory' | 'death' | 'levelComplete';
  level: number;
  score: number;
  enemiesKilled: number;
  secretsFound: number;
  totalSecrets: number;
  startTime: number;
  elapsedTime: number;
  messages: Array<{ text: string; time: number; color: string }>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const TILE_SIZE = 64;
const FOV = Math.PI / 3; // 60 degrees
const HALF_FOV = FOV / 2;
const NUM_RAYS = 320;
const MAX_DEPTH = 20;

// Wall types and their colors (Nordic dungeon theme)
const WALL_COLORS: Record<number, { main: string; dark: string }> = {
  1: { main: '#4a4a5a', dark: '#2a2a3a' }, // Stone
  2: { main: '#3a3a4a', dark: '#1a1a2a' }, // Dark stone
  3: { main: '#5a5a6a', dark: '#3a3a4a' }, // Light stone
  4: { main: '#8b4513', dark: '#5a2d0a' }, // Wood
  5: { main: '#1a3a5a', dark: '#0a1a2a' }, // Ice
  6: { main: '#6a5a3a', dark: '#3a2a1a' }, // Dirt
  7: { main: '#2a4a2a', dark: '#1a2a1a' }, // Moss stone
  8: { main: '#3a1a1a', dark: '#1a0a0a' }, // Blood stone
  9: { main: '#c0c0c0', dark: '#808080' }, // Metal door
  10: { main: '#ff6600', dark: '#aa3300' }, // Exit portal
};

const WEAPONS: Record<WeaponType, Weapon> = {
  fists: {
    id: 'fists',
    name: 'Fists',
    damage: 5,
    range: 1.5,
    attackSpeed: 200,
    staminaCost: 5,
    magickaCost: 0,
    projectile: false,
    frames: 3,
    color: '#deb887',
  },
  sword: {
    id: 'sword',
    name: 'Iron Sword',
    damage: 15,
    range: 2,
    attackSpeed: 300,
    staminaCost: 10,
    magickaCost: 0,
    projectile: false,
    frames: 4,
    color: '#c0c0c0',
  },
  bow: {
    id: 'bow',
    name: 'Hunting Bow',
    damage: 20,
    range: 20,
    attackSpeed: 500,
    staminaCost: 15,
    magickaCost: 0,
    projectile: true,
    frames: 3,
    color: '#8b4513',
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    damage: 30,
    range: 15,
    attackSpeed: 600,
    staminaCost: 0,
    magickaCost: 25,
    projectile: true,
    frames: 3,
    color: '#ff4500',
  },
};

const ENEMY_DEFINITIONS: Record<EnemyType, EnemyDefinition> = {
  draugr: {
    type: 'draugr',
    name: 'Draugr',
    health: 40,
    damage: 8,
    speed: 1.5,
    xp: 25,
    gold: 15,
    color: '#4a7a7a',
    aggroRange: 8,
    attackRange: 1.5,
  },
  skeleton: {
    type: 'skeleton',
    name: 'Skeleton',
    health: 25,
    damage: 6,
    speed: 2,
    xp: 15,
    gold: 10,
    color: '#f5f5dc',
    aggroRange: 10,
    attackRange: 1.5,
  },
  spider: {
    type: 'spider',
    name: 'Frostbite Spider',
    health: 20,
    damage: 5,
    speed: 2.5,
    xp: 12,
    gold: 5,
    color: '#2f4f4f',
    aggroRange: 6,
    attackRange: 1.2,
  },
  ghost: {
    type: 'ghost',
    name: 'Restless Spirit',
    health: 30,
    damage: 10,
    speed: 1.8,
    xp: 30,
    gold: 20,
    color: '#87ceeb',
    aggroRange: 12,
    attackRange: 2,
  },
  draugr_boss: {
    type: 'draugr_boss',
    name: 'Draugr Deathlord',
    health: 150,
    damage: 20,
    speed: 1.2,
    xp: 100,
    gold: 75,
    color: '#2f4f4f',
    aggroRange: 15,
    attackRange: 2,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateDungeon(levelNum: number, difficulty: string): DungeonLevel {
  const size = 24 + levelNum * 4; // Larger levels as you progress
  const width = Math.min(size, 48);
  const height = Math.min(size, 48);
  
  // Initialize with walls
  const map: number[][] = Array(height).fill(null).map(() => Array(width).fill(1));
  
  // Carve out rooms using BSP-like approach
  const rooms: Array<{ x: number; y: number; w: number; h: number }> = [];
  
  function carveRoom(x: number, y: number, w: number, h: number) {
    for (let j = y; j < y + h && j < height - 1; j++) {
      for (let i = x; i < x + w && i < width - 1; i++) {
        if (j > 0 && i > 0) map[j][i] = 0;
      }
    }
    rooms.push({ x, y, w, h });
  }
  
  function carveCorridor(x1: number, y1: number, x2: number, y2: number) {
    let x = x1;
    let y = y1;
    while (x !== x2) {
      if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        map[y][x] = 0;
        // Make corridors wider
        if (y > 1) map[y - 1][x] = 0;
        if (y < height - 2) map[y + 1][x] = 0;
      }
      x += x < x2 ? 1 : -1;
    }
    while (y !== y2) {
      if (x > 0 && x < width - 1 && y > 0 && y < height - 1) {
        map[y][x] = 0;
        if (x > 1) map[y][x - 1] = 0;
        if (x < width - 2) map[y][x + 1] = 0;
      }
      y += y < y2 ? 1 : -1;
    }
  }
  
  // Generate rooms
  const numRooms = 5 + levelNum * 2;
  for (let i = 0; i < numRooms; i++) {
    const roomW = 4 + Math.floor(Math.random() * 6);
    const roomH = 4 + Math.floor(Math.random() * 6);
    const roomX = 2 + Math.floor(Math.random() * (width - roomW - 4));
    const roomY = 2 + Math.floor(Math.random() * (height - roomH - 4));
    carveRoom(roomX, roomY, roomW, roomH);
  }
  
  // Connect rooms with corridors
  for (let i = 1; i < rooms.length; i++) {
    const prev = rooms[i - 1];
    const curr = rooms[i];
    const prevCenter = { x: prev.x + Math.floor(prev.w / 2), y: prev.y + Math.floor(prev.h / 2) };
    const currCenter = { x: curr.x + Math.floor(curr.w / 2), y: curr.y + Math.floor(curr.h / 2) };
    carveCorridor(prevCenter.x, prevCenter.y, currCenter.x, currCenter.y);
  }
  
  // Add some texture variety to walls
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (map[y][x] === 1) {
        // Random wall texture
        const rand = Math.random();
        if (rand < 0.15) map[y][x] = 2; // Dark stone
        else if (rand < 0.25) map[y][x] = 3; // Light stone
        else if (rand < 0.30) map[y][x] = 7; // Moss
      }
    }
  }
  
  // Place player start in first room
  const startRoom = rooms[0];
  const playerStart: Vec2 = {
    x: startRoom.x + Math.floor(startRoom.w / 2) + 0.5,
    y: startRoom.y + Math.floor(startRoom.h / 2) + 0.5,
  };
  
  // Place exit in last room
  const endRoom = rooms[rooms.length - 1];
  const exitPos: Vec2 = {
    x: endRoom.x + Math.floor(endRoom.w / 2),
    y: endRoom.y + Math.floor(endRoom.h / 2),
  };
  map[Math.floor(exitPos.y)][Math.floor(exitPos.x)] = 10; // Exit portal
  
  // Spawn enemies
  const enemies: Enemy[] = [];
  const difficultyMult = difficulty === 'easy' ? 0.7 : difficulty === 'hard' ? 1.3 : difficulty === 'nightmare' ? 1.8 : 1;
  const numEnemies = Math.floor((3 + levelNum * 2) * difficultyMult);
  
  const enemyTypes: EnemyType[] = ['draugr', 'skeleton', 'spider', 'ghost'];
  
  for (let i = 0; i < numEnemies; i++) {
    const room = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
    const ex = room.x + 1 + Math.random() * (room.w - 2);
    const ey = room.y + 1 + Math.random() * (room.h - 2);
    
    // Avoid spawn too close to player
    const distToPlayer = Math.sqrt((ex - playerStart.x) ** 2 + (ey - playerStart.y) ** 2);
    if (distToPlayer < 4) continue;
    
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const def = ENEMY_DEFINITIONS[type];
    
    enemies.push({
      id: `enemy_${i}`,
      type,
      x: ex,
      y: ey,
      angle: Math.random() * Math.PI * 2,
      health: Math.floor(def.health * (1 + levelNum * 0.1)),
      maxHealth: Math.floor(def.health * (1 + levelNum * 0.1)),
      damage: Math.floor(def.damage * (1 + levelNum * 0.1) * difficultyMult),
      speed: def.speed,
      state: 'idle',
      attackCooldown: 0,
      spriteFrame: 0,
      alertness: 0,
      targetX: ex,
      targetY: ey,
      pathCooldown: 0,
    });
  }
  
  // Add boss in last level
  if (levelNum >= 3) {
    const boss = ENEMY_DEFINITIONS.draugr_boss;
    enemies.push({
      id: 'boss',
      type: 'draugr_boss',
      x: exitPos.x + 0.5,
      y: exitPos.y - 2,
      angle: Math.PI,
      health: boss.health,
      maxHealth: boss.health,
      damage: boss.damage,
      speed: boss.speed,
      state: 'idle',
      attackCooldown: 0,
      spriteFrame: 0,
      alertness: 0,
      targetX: exitPos.x + 0.5,
      targetY: exitPos.y - 2,
      pathCooldown: 0,
    });
  }
  
  // Place pickups
  const pickups: Pickup[] = [];
  let pickupId = 0;
  
  for (const room of rooms) {
    // Health pickup
    if (Math.random() < 0.4) {
      pickups.push({
        id: `pickup_${pickupId++}`,
        x: room.x + 1 + Math.random() * (room.w - 2),
        y: room.y + 1 + Math.random() * (room.h - 2),
        type: 'health',
        value: 20 + levelNum * 5,
        color: '#ff4444',
        collected: false,
      });
    }
    
    // Magicka pickup
    if (Math.random() < 0.3) {
      pickups.push({
        id: `pickup_${pickupId++}`,
        x: room.x + 1 + Math.random() * (room.w - 2),
        y: room.y + 1 + Math.random() * (room.h - 2),
        type: 'magicka',
        value: 15 + levelNum * 5,
        color: '#4444ff',
        collected: false,
      });
    }
    
    // Gold
    if (Math.random() < 0.5) {
      pickups.push({
        id: `pickup_${pickupId++}`,
        x: room.x + 1 + Math.random() * (room.w - 2),
        y: room.y + 1 + Math.random() * (room.h - 2),
        type: 'gold',
        value: 10 + Math.floor(Math.random() * 20) + levelNum * 5,
        color: '#ffd700',
        collected: false,
      });
    }
  }
  
  // Place secrets
  const secrets: Vec2[] = [];
  for (let i = 0; i < 2 + levelNum; i++) {
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    secrets.push({
      x: room.x + Math.floor(room.w / 2),
      y: room.y + Math.floor(room.h / 2),
    });
  }
  
  return {
    width,
    height,
    map,
    playerStart,
    exitPos,
    enemies,
    pickups,
    secrets,
    name: `Nordic Crypt - Level ${levelNum + 1}`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RAYCASTING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

function castRay(
  map: number[][],
  width: number,
  height: number,
  originX: number,
  originY: number,
  angle: number
): { distance: number; wallType: number; hitX: number; hitY: number; side: 0 | 1 } {
  const rayDirX = Math.cos(angle);
  const rayDirY = Math.sin(angle);
  
  let mapX = Math.floor(originX);
  let mapY = Math.floor(originY);
  
  const deltaDistX = Math.abs(1 / rayDirX);
  const deltaDistY = Math.abs(1 / rayDirY);
  
  let stepX: number;
  let stepY: number;
  let sideDistX: number;
  let sideDistY: number;
  
  if (rayDirX < 0) {
    stepX = -1;
    sideDistX = (originX - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - originX) * deltaDistX;
  }
  
  if (rayDirY < 0) {
    stepY = -1;
    sideDistY = (originY - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1 - originY) * deltaDistY;
  }
  
  let hit = false;
  let side: 0 | 1 = 0;
  let wallType = 1;
  
  while (!hit) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }
    
    if (mapX < 0 || mapX >= width || mapY < 0 || mapY >= height) {
      hit = true;
      wallType = 1;
    } else if (map[mapY][mapX] > 0) {
      hit = true;
      wallType = map[mapY][mapX];
    }
  }
  
  let perpWallDist: number;
  if (side === 0) {
    perpWallDist = (mapX - originX + (1 - stepX) / 2) / rayDirX;
  } else {
    perpWallDist = (mapY - originY + (1 - stepY) / 2) / rayDirY;
  }
  
  const hitX = originX + perpWallDist * rayDirX;
  const hitY = originY + perpWallDist * rayDirY;
  
  return {
    distance: Math.max(0.1, perpWallDist),
    wallType,
    hitX,
    hitY,
    side,
  };
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
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    status: 'menu',
    level: 0,
    score: 0,
    enemiesKilled: 0,
    secretsFound: 0,
    totalSecrets: 0,
    startTime: 0,
    elapsedTime: 0,
    messages: [],
  });
  
  // Player state
  const [player, setPlayer] = useState<Player>({
    x: 3,
    y: 3,
    angle: 0,
    health: playerStats?.maxHealth || 100,
    maxHealth: playerStats?.maxHealth || 100,
    magicka: playerStats?.maxMagicka || 50,
    maxMagicka: playerStats?.maxMagicka || 50,
    stamina: playerStats?.maxStamina || 100,
    maxStamina: playerStats?.maxStamina || 100,
    weapon: 'sword',
    armor: playerStats?.armor || 0,
    keys: new Set(),
    isAttacking: false,
    attackFrame: 0,
    isDead: false,
    bobPhase: 0,
    moveSpeed: 0.08,
    turnSpeed: 0.04,
  });
  
  // Level state
  const [currentLevel, setCurrentLevel] = useState<DungeonLevel | null>(null);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  
  // Input state
  const keysPressed = useRef<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Animation frame ref
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GAME INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  const initializeLevel = useCallback((levelNum: number) => {
    const level = generateDungeon(levelNum, difficulty);
    setCurrentLevel(level);
    setEnemies([...level.enemies]);
    setPickups([...level.pickups]);
    setProjectiles([]);
    
    setPlayer(prev => ({
      ...prev,
      x: level.playerStart.x,
      y: level.playerStart.y,
      angle: 0,
      health: prev.maxHealth,
      magicka: prev.maxMagicka,
      stamina: prev.maxStamina,
      isAttacking: false,
      attackFrame: 0,
      isDead: false,
      keys: new Set(),
    }));
    
    setGameState(prev => ({
      ...prev,
      status: 'playing',
      level: levelNum,
      totalSecrets: level.secrets.length,
      messages: [{ text: `Entering ${level.name}`, time: Date.now(), color: '#ffd700' }],
    }));
    
    if (showToast) showToast(`Entering ${level.name}`, 'info');
  }, [difficulty, showToast]);
  
  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: 'playing',
      level: 0,
      score: 0,
      enemiesKilled: 0,
      secretsFound: 0,
      startTime: Date.now(),
      elapsedTime: 0,
      messages: [],
    }));
    initializeLevel(0);
  }, [initializeLevel]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INPUT HANDLING
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (!isOpen || gameState.status !== 'playing') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for game keys
      if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', '1', '2', '3', '4', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }
      keysPressed.current.add(e.key.toLowerCase());
      
      // Weapon switching
      if (e.key === '1') setPlayer(p => ({ ...p, weapon: 'fists' }));
      if (e.key === '2') setPlayer(p => ({ ...p, weapon: 'sword' }));
      if (e.key === '3') setPlayer(p => ({ ...p, weapon: 'bow' }));
      if (e.key === '4') setPlayer(p => ({ ...p, weapon: 'fireball' }));
      
      // Pause
      if (e.key === 'Escape') {
        setGameState(prev => ({
          ...prev,
          status: prev.status === 'paused' ? 'playing' : 'paused',
        }));
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, gameState.status]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GAME LOGIC UPDATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const addMessage = useCallback((text: string, color: string = '#ffffff') => {
    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages.slice(-4), { text, time: Date.now(), color }],
    }));
  }, []);
  
  const playerAttack = useCallback(() => {
    if (player.isAttacking || player.isDead) return;
    
    const weapon = WEAPONS[player.weapon];
    
    // Check resources
    if (weapon.staminaCost > 0 && player.stamina < weapon.staminaCost) {
      addMessage('Not enough stamina!', '#ff4444');
      return;
    }
    if (weapon.magickaCost > 0 && player.magicka < weapon.magickaCost) {
      addMessage('Not enough magicka!', '#4444ff');
      return;
    }
    
    // Consume resources
    setPlayer(prev => ({
      ...prev,
      isAttacking: true,
      attackFrame: 0,
      stamina: Math.max(0, prev.stamina - weapon.staminaCost),
      magicka: Math.max(0, prev.magicka - weapon.magickaCost),
    }));
    
    if (weapon.projectile) {
      // Spawn projectile
      const proj: Projectile = {
        id: `proj_${Date.now()}`,
        x: player.x,
        y: player.y,
        angle: player.angle,
        speed: 0.3,
        damage: weapon.damage,
        type: weapon.id === 'bow' ? 'arrow' : 'fireball',
        owner: 'player',
        lifetime: 60,
      };
      setProjectiles(prev => [...prev, proj]);
    } else {
      // Melee attack - check for enemies in range
      setEnemies(prevEnemies => {
        return prevEnemies.map(enemy => {
          if (enemy.state === 'dead') return enemy;
          
          const dx = enemy.x - player.x;
          const dy = enemy.y - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Check if enemy is in attack range and roughly in front of player
          const angleToEnemy = Math.atan2(dy, dx);
          let angleDiff = Math.abs(angleToEnemy - player.angle);
          if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
          
          if (dist <= weapon.range && angleDiff < Math.PI / 3) {
            const damage = weapon.damage + Math.floor(Math.random() * 5);
            const newHealth = enemy.health - damage;
            
            addMessage(`Hit ${ENEMY_DEFINITIONS[enemy.type].name} for ${damage}!`, '#ffaa00');
            
            if (newHealth <= 0) {
              const def = ENEMY_DEFINITIONS[enemy.type];
              setGameState(prev => ({
                ...prev,
                score: prev.score + def.xp + def.gold,
                enemiesKilled: prev.enemiesKilled + 1,
              }));
              addMessage(`${def.name} defeated! +${def.xp} XP +${def.gold} Gold`, '#00ff00');
              return { ...enemy, health: 0, state: 'dead' };
            }
            
            return { ...enemy, health: newHealth, state: 'hurt', alertness: 100 };
          }
          return enemy;
        });
      });
    }
    
    // Reset attack state after animation
    setTimeout(() => {
      setPlayer(prev => ({ ...prev, isAttacking: false, attackFrame: 0 }));
    }, weapon.attackSpeed);
  }, [player, addMessage]);
  
  const updateGame = useCallback((deltaTime: number) => {
    if (!currentLevel || gameState.status !== 'playing' || player.isDead) return;
    
    const keys = keysPressed.current;
    
    // ─── Player Movement ───
    let newX = player.x;
    let newY = player.y;
    let newAngle = player.angle;
    let moved = false;
    
    // Rotation
    if (keys.has('arrowleft') || keys.has('q')) {
      newAngle -= player.turnSpeed * deltaTime;
    }
    if (keys.has('arrowright') || keys.has('e')) {
      newAngle += player.turnSpeed * deltaTime;
    }
    
    // Forward/backward
    const moveX = Math.cos(newAngle);
    const moveY = Math.sin(newAngle);
    const strafeX = Math.cos(newAngle + Math.PI / 2);
    const strafeY = Math.sin(newAngle + Math.PI / 2);
    
    if (keys.has('w') || keys.has('arrowup')) {
      newX += moveX * player.moveSpeed * deltaTime;
      newY += moveY * player.moveSpeed * deltaTime;
      moved = true;
    }
    if (keys.has('s') || keys.has('arrowdown')) {
      newX -= moveX * player.moveSpeed * deltaTime;
      newY -= moveY * player.moveSpeed * deltaTime;
      moved = true;
    }
    if (keys.has('a')) {
      newX -= strafeX * player.moveSpeed * deltaTime;
      newY -= strafeY * player.moveSpeed * deltaTime;
      moved = true;
    }
    if (keys.has('d')) {
      newX += strafeX * player.moveSpeed * deltaTime;
      newY += strafeY * player.moveSpeed * deltaTime;
      moved = true;
    }
    
    // Attack
    if (keys.has(' ') && !player.isAttacking) {
      playerAttack();
    }
    
    // Collision detection
    const margin = 0.3;
    const mapY = Math.floor(newY);
    const mapX = Math.floor(newX);
    
    // Check X movement
    if (currentLevel.map[Math.floor(player.y)][Math.floor(newX + margin * Math.sign(newX - player.x))] === 0) {
      // X movement is valid
    } else {
      newX = player.x;
    }
    
    // Check Y movement
    if (currentLevel.map[Math.floor(newY + margin * Math.sign(newY - player.y))][Math.floor(player.x)] === 0) {
      // Y movement is valid
    } else {
      newY = player.y;
    }
    
    // Check for exit
    const exitDist = Math.sqrt((newX - currentLevel.exitPos.x - 0.5) ** 2 + (newY - currentLevel.exitPos.y - 0.5) ** 2);
    if (exitDist < 1) {
      // Check if all enemies are dead or if it's allowed to exit
      const aliveEnemies = enemies.filter(e => e.state !== 'dead');
      if (aliveEnemies.length === 0) {
        // Level complete!
        if (gameState.level >= 3) {
          // Victory!
          setGameState(prev => ({
            ...prev,
            status: 'victory',
            elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000),
          }));
        } else {
          // Next level
          initializeLevel(gameState.level + 1);
        }
        return;
      }
    }
    
    // Update player
    setPlayer(prev => ({
      ...prev,
      x: newX,
      y: newY,
      angle: newAngle,
      bobPhase: moved ? (prev.bobPhase + 0.15 * deltaTime) % (Math.PI * 2) : prev.bobPhase,
      // Regen stamina
      stamina: Math.min(prev.maxStamina, prev.stamina + 0.02 * deltaTime),
      // Regen magicka
      magicka: Math.min(prev.maxMagicka, prev.magicka + 0.01 * deltaTime),
    }));
    
    // ─── Update Enemies ───
    setEnemies(prevEnemies => {
      return prevEnemies.map(enemy => {
        if (enemy.state === 'dead') return enemy;
        
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distToPlayer = Math.sqrt(dx * dx + dy * dy);
        const def = ENEMY_DEFINITIONS[enemy.type];
        
        let newState = enemy.state;
        let newX = enemy.x;
        let newY = enemy.y;
        let newAngle = enemy.angle;
        let newAlertness = enemy.alertness;
        let newCooldown = Math.max(0, enemy.attackCooldown - deltaTime);
        
        // Detection
        if (distToPlayer < def.aggroRange) {
          newAlertness = Math.min(100, newAlertness + deltaTime * 2);
        } else {
          newAlertness = Math.max(0, newAlertness - deltaTime * 0.5);
        }
        
        // State machine
        if (enemy.state === 'hurt') {
          // Brief stun
          newState = 'chase';
        } else if (newAlertness > 50 || distToPlayer < def.aggroRange / 2) {
          if (distToPlayer <= def.attackRange) {
            newState = 'attack';
          } else {
            newState = 'chase';
          }
        } else if (newAlertness > 20) {
          newState = 'patrol';
        } else {
          newState = 'idle';
        }
        
        // Movement
        if (newState === 'chase') {
          newAngle = Math.atan2(dy, dx);
          const speed = def.speed * 0.03 * deltaTime;
          const nextX = enemy.x + Math.cos(newAngle) * speed;
          const nextY = enemy.y + Math.sin(newAngle) * speed;
          
          // Simple collision check
          if (currentLevel.map[Math.floor(nextY)][Math.floor(nextX)] === 0) {
            newX = nextX;
            newY = nextY;
          }
        } else if (newState === 'patrol') {
          // Random wandering
          if (Math.random() < 0.01) {
            newAngle = Math.random() * Math.PI * 2;
          }
          const speed = def.speed * 0.01 * deltaTime;
          const nextX = enemy.x + Math.cos(newAngle) * speed;
          const nextY = enemy.y + Math.sin(newAngle) * speed;
          
          if (currentLevel.map[Math.floor(nextY)][Math.floor(nextX)] === 0) {
            newX = nextX;
            newY = nextY;
          }
        }
        
        // Attack
        if (newState === 'attack' && newCooldown <= 0) {
          // Deal damage to player
          const damage = Math.max(1, enemy.damage - player.armor);
          setPlayer(prev => {
            const newHealth = prev.health - damage;
            if (newHealth <= 0) {
              setGameState(g => ({
                ...g,
                status: 'death',
                elapsedTime: Math.floor((Date.now() - g.startTime) / 1000),
              }));
              return { ...prev, health: 0, isDead: true };
            }
            return { ...prev, health: newHealth };
          });
          addMessage(`${def.name} attacks for ${damage} damage!`, '#ff4444');
          newCooldown = 60; // 1 second cooldown at 60fps
        }
        
        return {
          ...enemy,
          x: newX,
          y: newY,
          angle: newAngle,
          state: newState,
          alertness: newAlertness,
          attackCooldown: newCooldown,
        };
      });
    });
    
    // ─── Update Projectiles ───
    setProjectiles(prevProj => {
      return prevProj.filter(proj => {
        proj.x += Math.cos(proj.angle) * proj.speed * deltaTime;
        proj.y += Math.sin(proj.angle) * proj.speed * deltaTime;
        proj.lifetime -= deltaTime;
        
        // Hit wall
        if (currentLevel.map[Math.floor(proj.y)]?.[Math.floor(proj.x)] > 0) {
          return false;
        }
        
        // Hit enemy
        if (proj.owner === 'player') {
          for (const enemy of enemies) {
            if (enemy.state === 'dead') continue;
            const dist = Math.sqrt((proj.x - enemy.x) ** 2 + (proj.y - enemy.y) ** 2);
            if (dist < 0.5) {
              const damage = proj.damage + Math.floor(Math.random() * 10);
              setEnemies(prev => prev.map(e => {
                if (e.id !== enemy.id) return e;
                const newHealth = e.health - damage;
                if (newHealth <= 0) {
                  const def = ENEMY_DEFINITIONS[e.type];
                  setGameState(g => ({
                    ...g,
                    score: g.score + def.xp + def.gold,
                    enemiesKilled: g.enemiesKilled + 1,
                  }));
                  addMessage(`${def.name} defeated! +${def.xp} XP`, '#00ff00');
                  return { ...e, health: 0, state: 'dead' };
                }
                addMessage(`${ENEMY_DEFINITIONS[e.type].name} hit for ${damage}!`, '#ffaa00');
                return { ...e, health: newHealth, state: 'hurt', alertness: 100 };
              }));
              return false;
            }
          }
        }
        
        return proj.lifetime > 0;
      });
    });
    
    // ─── Check Pickups ───
    setPickups(prevPickups => {
      return prevPickups.map(pickup => {
        if (pickup.collected) return pickup;
        
        const dist = Math.sqrt((player.x - pickup.x) ** 2 + (player.y - pickup.y) ** 2);
        if (dist < 0.5) {
          switch (pickup.type) {
            case 'health':
              setPlayer(prev => ({
                ...prev,
                health: Math.min(prev.maxHealth, prev.health + pickup.value),
              }));
              addMessage(`+${pickup.value} Health`, '#ff4444');
              break;
            case 'magicka':
              setPlayer(prev => ({
                ...prev,
                magicka: Math.min(prev.maxMagicka, prev.magicka + pickup.value),
              }));
              addMessage(`+${pickup.value} Magicka`, '#4444ff');
              break;
            case 'stamina':
              setPlayer(prev => ({
                ...prev,
                stamina: Math.min(prev.maxStamina, prev.stamina + pickup.value),
              }));
              addMessage(`+${pickup.value} Stamina`, '#44ff44');
              break;
            case 'gold':
              setGameState(prev => ({
                ...prev,
                score: prev.score + pickup.value,
              }));
              addMessage(`+${pickup.value} Gold`, '#ffd700');
              break;
          }
          return { ...pickup, collected: true };
        }
        return pickup;
      });
    });
    
    // Update elapsed time
    setGameState(prev => ({
      ...prev,
      elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000),
    }));
  }, [currentLevel, gameState, player, enemies, addMessage, playerAttack, initializeLevel]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDERING
  // ═══════════════════════════════════════════════════════════════════════════
  
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const minimapCanvas = minimapCanvasRef.current;
    if (!canvas || !currentLevel) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    // ─── Draw ceiling ───
    const gradient = ctx.createLinearGradient(0, 0, 0, height / 2);
    gradient.addColorStop(0, '#1a1a2a');
    gradient.addColorStop(1, '#2a2a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height / 2);
    
    // ─── Draw floor ───
    const floorGradient = ctx.createLinearGradient(0, height / 2, 0, height);
    floorGradient.addColorStop(0, '#2a2a1a');
    floorGradient.addColorStop(1, '#1a1a0a');
    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, height / 2, width, height / 2);
    
    // ─── Raycasting for walls ───
    const rayWidth = width / NUM_RAYS;
    const depthBuffer: number[] = [];
    
    for (let i = 0; i < NUM_RAYS; i++) {
      const rayAngle = player.angle - HALF_FOV + (i / NUM_RAYS) * FOV;
      const ray = castRay(
        currentLevel.map,
        currentLevel.width,
        currentLevel.height,
        player.x,
        player.y,
        rayAngle
      );
      
      // Fix fisheye effect
      const correctedDist = ray.distance * Math.cos(rayAngle - player.angle);
      depthBuffer[i] = correctedDist;
      
      // Calculate wall height
      const wallHeight = Math.min(height * 2, (height / correctedDist) * 1.5);
      const wallTop = (height - wallHeight) / 2;
      
      // Get wall color based on type and side
      const wallDef = WALL_COLORS[ray.wallType] || WALL_COLORS[1];
      const baseColor = ray.side === 1 ? wallDef.dark : wallDef.main;
      
      // Distance shading
      const shade = Math.max(0.2, 1 - correctedDist / MAX_DEPTH);
      
      // Draw wall slice
      ctx.fillStyle = baseColor;
      ctx.globalAlpha = shade;
      ctx.fillRect(i * rayWidth, wallTop, rayWidth + 1, wallHeight);
      ctx.globalAlpha = 1;
    }
    
    // ─── Draw sprites (enemies, pickups) ───
    const sprites: Array<{ x: number; y: number; type: 'enemy' | 'pickup' | 'projectile'; data: Enemy | Pickup | Projectile }> = [];
    
    // Add enemies
    enemies.forEach(enemy => {
      if (enemy.state !== 'dead') {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        sprites.push({
          x: enemy.x,
          y: enemy.y,
          type: 'enemy',
          data: { ...enemy, distance: Math.sqrt(dx * dx + dy * dy) },
        });
      }
    });
    
    // Add pickups
    pickups.forEach(pickup => {
      if (!pickup.collected) {
        sprites.push({ x: pickup.x, y: pickup.y, type: 'pickup', data: pickup });
      }
    });
    
    // Add projectiles
    projectiles.forEach(proj => {
      sprites.push({ x: proj.x, y: proj.y, type: 'projectile', data: proj });
    });
    
    // Sort sprites by distance (far to near)
    sprites.sort((a, b) => {
      const distA = Math.sqrt((a.x - player.x) ** 2 + (a.y - player.y) ** 2);
      const distB = Math.sqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
      return distB - distA;
    });
    
    // Draw sprites
    sprites.forEach(sprite => {
      const dx = sprite.x - player.x;
      const dy = sprite.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 0.5 || dist > MAX_DEPTH) return;
      
      // Calculate angle to sprite
      let spriteAngle = Math.atan2(dy, dx) - player.angle;
      
      // Normalize angle
      while (spriteAngle > Math.PI) spriteAngle -= Math.PI * 2;
      while (spriteAngle < -Math.PI) spriteAngle += Math.PI * 2;
      
      // Check if sprite is in FOV
      if (Math.abs(spriteAngle) > HALF_FOV + 0.2) return;
      
      // Calculate screen position
      const screenX = width / 2 + (spriteAngle / HALF_FOV) * (width / 2);
      const spriteHeight = (height / dist) * 0.8;
      const spriteWidth = spriteHeight * 0.6;
      const spriteTop = (height - spriteHeight) / 2;
      
      // Check depth buffer for occlusion
      const rayIndex = Math.floor((screenX / width) * NUM_RAYS);
      if (rayIndex >= 0 && rayIndex < depthBuffer.length && depthBuffer[rayIndex] < dist) {
        return; // Sprite is behind wall
      }
      
      // Calculate shade
      const shade = Math.max(0.3, 1 - dist / MAX_DEPTH);
      ctx.globalAlpha = shade;
      
      // Draw sprite based on type
      if (sprite.type === 'enemy') {
        const enemy = sprite.data as Enemy;
        const def = ENEMY_DEFINITIONS[enemy.type];
        
        // Simple sprite rendering
        const x = screenX - spriteWidth / 2;
        const y = spriteTop;
        
        // Body
        ctx.fillStyle = def.color;
        ctx.fillRect(x, y + spriteHeight * 0.2, spriteWidth, spriteHeight * 0.6);
        
        // Head
        ctx.beginPath();
        ctx.arc(screenX, y + spriteHeight * 0.15, spriteWidth * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes (red for alerted)
        if (enemy.alertness > 50) {
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(screenX - spriteWidth * 0.1, y + spriteHeight * 0.12, spriteWidth * 0.08, 0, Math.PI * 2);
          ctx.arc(screenX + spriteWidth * 0.1, y + spriteHeight * 0.12, spriteWidth * 0.08, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Health bar
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y - 10, spriteWidth, 6);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(x, y - 10, spriteWidth * healthPercent, 6);
      } else if (sprite.type === 'pickup') {
        const pickup = sprite.data as Pickup;
        
        // Floating animation
        const bob = Math.sin(Date.now() / 200) * 5;
        
        ctx.fillStyle = pickup.color;
        ctx.beginPath();
        ctx.arc(screenX, spriteTop + spriteHeight / 2 + bob, spriteWidth * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        ctx.globalAlpha = shade * 0.3;
        ctx.beginPath();
        ctx.arc(screenX, spriteTop + spriteHeight / 2 + bob, spriteWidth * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (sprite.type === 'projectile') {
        const proj = sprite.data as Projectile;
        ctx.fillStyle = proj.type === 'fireball' ? '#ff4500' : '#8b4513';
        ctx.beginPath();
        ctx.arc(screenX, spriteTop + spriteHeight / 2, spriteWidth * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;
    });
    
    // ─── Draw weapon ───
    const weaponDef = WEAPONS[player.weapon];
    const weaponBob = player.isAttacking ? 0 : Math.sin(player.bobPhase) * 5;
    const attackOffset = player.isAttacking ? -30 : 0;
    
    // Weapon shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(width / 2 - 30 + 5, height - 120 + weaponBob + 5 + attackOffset, 60, 100);
    
    // Weapon
    ctx.fillStyle = weaponDef.color;
    
    if (player.weapon === 'fists') {
      // Draw fists
      ctx.fillStyle = '#deb887';
      ctx.beginPath();
      ctx.arc(width / 2 - 40 + (player.isAttacking ? 10 : 0), height - 80 + weaponBob + attackOffset, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width / 2 + 40 - (player.isAttacking ? 10 : 0), height - 80 + weaponBob + attackOffset, 25, 0, Math.PI * 2);
      ctx.fill();
    } else if (player.weapon === 'sword') {
      // Draw sword
      ctx.save();
      ctx.translate(width / 2, height - 60 + weaponBob + attackOffset);
      ctx.rotate(player.isAttacking ? -0.5 : 0.2);
      
      // Blade
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(-5, -100, 10, 80);
      
      // Guard
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(-20, -25, 40, 10);
      
      // Handle
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(-5, -15, 10, 40);
      
      ctx.restore();
    } else if (player.weapon === 'bow') {
      // Draw bow
      ctx.save();
      ctx.translate(width / 2 - 20, height - 100 + weaponBob + attackOffset);
      
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, 0, 60, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
      
      // String
      ctx.strokeStyle = '#deb887';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(player.isAttacking ? -20 : 0, 0);
      ctx.lineTo(0, 52);
      ctx.stroke();
      
      // Arrow
      if (!player.isAttacking) {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-5, -2, 50, 4);
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(45, 0);
        ctx.lineTo(55, -5);
        ctx.lineTo(55, 5);
        ctx.fill();
      }
      
      ctx.restore();
    } else if (player.weapon === 'fireball') {
      // Draw magic hands
      ctx.save();
      ctx.translate(width / 2, height - 80 + weaponBob + attackOffset);
      
      // Hands
      ctx.fillStyle = '#deb887';
      ctx.beginPath();
      ctx.arc(-40, 20, 20, 0, Math.PI * 2);
      ctx.arc(40, 20, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Magic glow
      if (!player.isAttacking) {
        const glowSize = 15 + Math.sin(Date.now() / 100) * 5;
        ctx.fillStyle = '#ff4500';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(0, -10, glowSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(0, -10, glowSize * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      
      ctx.restore();
    }
    
    // ─── Draw minimap ───
    if (minimapCanvas) {
      const minimapCtx = minimapCanvas.getContext('2d');
      if (minimapCtx) {
        const mmScale = 4;
        minimapCanvas.width = currentLevel.width * mmScale;
        minimapCanvas.height = currentLevel.height * mmScale;
        
        minimapCtx.fillStyle = '#000';
        minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
        
        // Draw map
        for (let y = 0; y < currentLevel.height; y++) {
          for (let x = 0; x < currentLevel.width; x++) {
            if (currentLevel.map[y][x] === 0) {
              minimapCtx.fillStyle = '#333';
            } else if (currentLevel.map[y][x] === 10) {
              minimapCtx.fillStyle = '#ff6600';
            } else {
              minimapCtx.fillStyle = '#666';
            }
            minimapCtx.fillRect(x * mmScale, y * mmScale, mmScale, mmScale);
          }
        }
        
        // Draw enemies
        enemies.forEach(enemy => {
          if (enemy.state !== 'dead') {
            minimapCtx.fillStyle = '#ff0000';
            minimapCtx.beginPath();
            minimapCtx.arc(enemy.x * mmScale, enemy.y * mmScale, mmScale / 2, 0, Math.PI * 2);
            minimapCtx.fill();
          }
        });
        
        // Draw pickups
        pickups.forEach(pickup => {
          if (!pickup.collected) {
            minimapCtx.fillStyle = pickup.color;
            minimapCtx.fillRect(pickup.x * mmScale - 1, pickup.y * mmScale - 1, 2, 2);
          }
        });
        
        // Draw player
        minimapCtx.fillStyle = '#00ff00';
        minimapCtx.beginPath();
        minimapCtx.arc(player.x * mmScale, player.y * mmScale, mmScale, 0, Math.PI * 2);
        minimapCtx.fill();
        
        // Player direction
        minimapCtx.strokeStyle = '#00ff00';
        minimapCtx.lineWidth = 2;
        minimapCtx.beginPath();
        minimapCtx.moveTo(player.x * mmScale, player.y * mmScale);
        minimapCtx.lineTo(
          player.x * mmScale + Math.cos(player.angle) * mmScale * 3,
          player.y * mmScale + Math.sin(player.angle) * mmScale * 3
        );
        minimapCtx.stroke();
      }
    }
  }, [currentLevel, player, enemies, pickups, projectiles]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GAME LOOP
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (!isOpen || gameState.status !== 'playing') return;
    
    const gameLoop = (timestamp: number) => {
      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 16.67 : 1;
      lastTimeRef.current = timestamp;
      
      updateGame(deltaTime);
      render();
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, gameState.status, updateGame, render]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GAME END HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleClose = useCallback((completed: boolean = false, victory: boolean = false) => {
    const result: DoomGameResult = {
      completed,
      victory,
      score: gameState.score,
      enemiesKilled: gameState.enemiesKilled,
      secretsFound: gameState.secretsFound,
      timeElapsed: gameState.elapsedTime,
      rewards: victory ? {
        gold: gameState.score,
        xp: gameState.enemiesKilled * 25 + (gameState.level + 1) * 100,
        items: gameState.enemiesKilled >= 10 ? [
          { name: 'Dungeon Key', type: 'key', quantity: 1, rarity: 'uncommon' },
        ] : undefined,
      } : undefined,
    };
    onClose(result);
  }, [gameState, onClose]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER UI
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (!isOpen) return null;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      {/* Close button */}
      <button
        onClick={() => handleClose(false)}
        className="absolute top-4 right-4 z-50 p-2 bg-red-600 hover:bg-red-700 rounded-full text-white"
      >
        <X size={24} />
      </button>
      
      {/* Main Menu */}
      {gameState.status === 'menu' && (
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <h1 className="text-6xl font-bold text-amber-500 tracking-wider" style={{ fontFamily: 'serif', textShadow: '0 0 20px rgba(255,165,0,0.5)' }}>
            DRAUGR'S DOOM
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Explore the ancient Nordic crypts. Slay the draugr. Claim your rewards.
          </p>
          <div className="text-gray-500 text-sm">
            <p>WASD / Arrows - Move</p>
            <p>Q/E - Turn</p>
            <p>Space - Attack</p>
            <p>1-4 - Switch Weapons</p>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-black font-bold text-2xl rounded-lg transition-all transform hover:scale-105"
          >
            ENTER THE CRYPT
          </button>
          <div className="text-amber-600/60 text-xs mt-4">
            Dungeon: {dungeonName} | Difficulty: {difficulty.toUpperCase()}
          </div>
        </div>
      )}
      
      {/* Game View */}
      {(gameState.status === 'playing' || gameState.status === 'paused') && (
        <div className="relative w-full h-full">
          {/* Game Canvas */}
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full h-full object-contain bg-black"
            style={{ imageRendering: 'pixelated' }}
          />
          
          {/* HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top bar */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-auto">
              {/* Level info */}
              <div className="bg-black/70 rounded px-3 py-2">
                <div className="text-amber-400 font-bold">{currentLevel?.name}</div>
                <div className="text-gray-400 text-sm">
                  Enemies: {enemies.filter(e => e.state === 'dead').length}/{enemies.length}
                </div>
              </div>
              
              {/* Score and time */}
              <div className="bg-black/70 rounded px-3 py-2 text-right">
                <div className="text-amber-400 font-bold">Score: {gameState.score}</div>
                <div className="text-gray-400 text-sm">Time: {formatTime(gameState.elapsedTime)}</div>
              </div>
            </div>
            
            {/* Minimap */}
            <div className="absolute top-16 right-2 bg-black/70 rounded p-1 border border-gray-700">
              <canvas
                ref={minimapCanvasRef}
                className="w-32 h-32"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            
            {/* Messages */}
            <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 text-center">
              {gameState.messages.slice(-3).map((msg, i) => (
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
            
            {/* Bottom HUD */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
              {/* Health/Magicka/Stamina bars */}
              <div className="flex justify-center gap-8 mb-3">
                {/* Health */}
                <div className="flex items-center gap-2">
                  <Heart className="text-red-500" size={20} />
                  <div className="w-32 h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all"
                      style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
                    />
                  </div>
                  <span className="text-red-400 text-sm w-16">{player.health}/{player.maxHealth}</span>
                </div>
                
                {/* Magicka */}
                <div className="flex items-center gap-2">
                  <Droplet className="text-blue-500" size={20} />
                  <div className="w-32 h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all"
                      style={{ width: `${(player.magicka / player.maxMagicka) * 100}%` }}
                    />
                  </div>
                  <span className="text-blue-400 text-sm w-16">{Math.floor(player.magicka)}/{player.maxMagicka}</span>
                </div>
                
                {/* Stamina */}
                <div className="flex items-center gap-2">
                  <Zap className="text-green-500" size={20} />
                  <div className="w-32 h-4 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-700 to-green-500 transition-all"
                      style={{ width: `${(player.stamina / player.maxStamina) * 100}%` }}
                    />
                  </div>
                  <span className="text-green-400 text-sm w-16">{Math.floor(player.stamina)}/{player.maxStamina}</span>
                </div>
              </div>
              
              {/* Weapon selector */}
              <div className="flex justify-center gap-2">
                {(['fists', 'sword', 'bow', 'fireball'] as WeaponType[]).map((wpn, i) => {
                  const def = WEAPONS[wpn];
                  const isActive = player.weapon === wpn;
                  return (
                    <div
                      key={wpn}
                      className={`flex flex-col items-center p-2 rounded border-2 transition-all ${
                        isActive ? 'border-amber-500 bg-amber-500/20' : 'border-gray-600 bg-gray-800/50'
                      }`}
                    >
                      <span className="text-xs text-gray-400">{i + 1}</span>
                      <div className="text-2xl" style={{ color: def.color }}>
                        {wpn === 'fists' && '👊'}
                        {wpn === 'sword' && '⚔️'}
                        {wpn === 'bow' && '🏹'}
                        {wpn === 'fireball' && '🔥'}
                      </div>
                      <span className="text-xs text-gray-300">{def.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Pause Menu */}
          {gameState.status === 'paused' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="bg-gray-900 border-2 border-amber-600 rounded-lg p-8 text-center">
                <h2 className="text-4xl font-bold text-amber-500 mb-6">PAUSED</h2>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setGameState(prev => ({ ...prev, status: 'playing' }))}
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
      {gameState.status === 'victory' && (
        <div className="flex flex-col items-center justify-center gap-6 text-center p-8">
          <Trophy className="text-amber-500 w-24 h-24 animate-bounce" />
          <h1 className="text-5xl font-bold text-amber-500">VICTORY!</h1>
          <p className="text-gray-300 text-lg">You have conquered the crypt!</p>
          
          <div className="bg-gray-900/80 rounded-lg p-6 min-w-[300px]">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="text-gray-400">Score:</div>
              <div className="text-amber-400 font-bold">{gameState.score}</div>
              <div className="text-gray-400">Enemies Killed:</div>
              <div className="text-red-400 font-bold">{gameState.enemiesKilled}</div>
              <div className="text-gray-400">Time:</div>
              <div className="text-cyan-400 font-bold">{formatTime(gameState.elapsedTime)}</div>
              <div className="text-gray-400">Gold Earned:</div>
              <div className="text-yellow-400 font-bold">{gameState.score}</div>
              <div className="text-gray-400">XP Earned:</div>
              <div className="text-green-400 font-bold">{gameState.enemiesKilled * 25 + (gameState.level + 1) * 100}</div>
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
      {gameState.status === 'death' && (
        <div className="flex flex-col items-center justify-center gap-6 text-center p-8">
          <Skull className="text-red-500 w-24 h-24" />
          <h1 className="text-5xl font-bold text-red-500">YOU DIED</h1>
          <p className="text-gray-400 text-lg">The draugr have claimed another soul...</p>
          
          <div className="bg-gray-900/80 rounded-lg p-6 min-w-[300px]">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="text-gray-400">Final Score:</div>
              <div className="text-amber-400 font-bold">{gameState.score}</div>
              <div className="text-gray-400">Enemies Killed:</div>
              <div className="text-red-400 font-bold">{gameState.enemiesKilled}</div>
              <div className="text-gray-400">Survived:</div>
              <div className="text-cyan-400 font-bold">{formatTime(gameState.elapsedTime)}</div>
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
    </div>
  );
};

export default DoomMinigame;
