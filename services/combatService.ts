/**
 * Combat Service - Pokemon-style turn-based combat system
 * Integrates with character stats, equipment, and AI narration
 */

import { 
  Character, 
  InventoryItem, 
  CombatState, 
  CombatEnemy, 
  CombatAbility, 
  CombatEffect,
  CombatLogEntry,
  PlayerCombatStats,
  CombatActionType
} from '../types';
import { getFoodNutrition } from './nutritionData';
import { isSmallWeapon } from './equipment';
import { modifyPlayerCombatStat } from './vitals';
import { resolvePotionEffect } from './potionResolver';
import { getLearnedSpellIds, createAbilityFromSpell } from './spells';

// ============================================================================
// DYNAMIC ENEMY NAME POOLS - For variation
// ============================================================================

const ENEMY_NAME_PREFIXES: Record<string, string[]> = {
  bandit: ['Savage', 'Ruthless', 'Desperate', 'Scarred', 'One-Eyed', 'Grizzled', 'Sneering', 'Bloodthirsty', 'Cunning', 'Vicious'],
  bandit_chief: ['Chief', 'Boss', 'Warlord', 'Captain', 'Leader', 'Scourge', 'Terror of'],
  wolf: ['Grey', 'White', 'Black', 'Timber', 'Dire', 'Frost', 'Starving', 'Alpha', 'Rabid', 'Wild'],
  skeleton: ['Ancient', 'Shambling', 'Cursed', 'Corrupted', 'Risen', 'Bound', 'Restless', 'Decrepit'],
  draugr: ['Ancient', 'Restless', 'Cursed', 'Dread', 'Wight', 'Scourge', 'Death', 'Frost-Touched'],
  frost_spider: ['Giant', 'Venomous', 'Frost', 'Albino', 'Corrupted', 'Nest Guardian', 'Broodmother'],
  troll: ['Cave', 'Frost', 'Unyielding', 'Massive', 'Rampaging', 'Savage', 'Ancient'],
  bear: ['Cave', 'Snow', 'Raging', 'Wounded', 'Massive', 'Territorial', 'Starving'],
  sabre_cat: ['Snowy', 'Vale', 'Frost', 'Prowling', 'Hunting', 'Alpha', 'Scarred'],
  vampire: ['Ancient', 'Feral', 'Blood-Starved', 'Noble', 'Thrall', 'Master', 'Corrupted'],
  mage: ['Rogue', 'Corrupt', 'Apostate', 'Flame', 'Frost', 'Storm', 'Necromancer'],
  default: ['Fierce', 'Deadly', 'Dangerous', 'Menacing', 'Threatening']
};

const ENEMY_PERSONALITY_TRAITS = [
  'battle-scarred', 'cunning', 'reckless', 'cautious', 'vengeful', 
  'hungry', 'territorial', 'desperate', 'confident', 'fearless'
];

// Randomization helper functions
const randomRange = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomVariation = (base: number, variance: number): number => 
  Math.floor(base * (1 + (Math.random() - 0.5) * 2 * variance));

const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const shuffleArray = <T>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Dice helper: roll `count` d`sides`
const rollDice = (count: number, sides: number) => {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) rolls.push(Math.floor(Math.random() * sides) + 1);
  return { total: rolls.reduce((s, r) => s + r, 0), rolls };
};
// Resolve attack using nat-only mapping. The nat (1-20) fully determines hit/tier per design.
// If opts.natRoll is provided it is used; otherwise a d20 is rolled.
const resolveAttack = (opts: {
  attackerLevel: number;
  attackBonus?: number;
  targetArmor: number;
  targetDodge?: number;
  critChance?: number;
  natRoll?: number;
}): { hit: boolean; isCrit: boolean; natRoll: number; rollTier: 'fail' | 'miss' | 'low' | 'mid' | 'high' | 'crit' } => {
  const { natRoll } = opts;
  const d20 = natRoll && natRoll >= 1 && natRoll <= 20 ? { rolls: [natRoll] } : rollDice(1, 20);
  const nat = d20.rolls[0];

  // Determine outcome solely based on nat value ranges:
  // 1 -> critical failure (fail)
  // 2-4 -> miss
  // 5-9 -> low damage
  // 10-14 -> mid damage
  // 15-19 -> high damage
  // 20 -> absolute success (crit)
  // Special case: nat === 7 is treated as a critical hit

  if (nat === 1) return { hit: false, isCrit: false, natRoll: nat, rollTier: 'fail' };
  if (nat >= 2 && nat <= 4) return { hit: false, isCrit: false, natRoll: nat, rollTier: 'miss' };
  if (nat === 7) return { hit: true, isCrit: true, natRoll: nat, rollTier: 'crit' };
  if (nat >= 5 && nat <= 9) return { hit: true, isCrit: false, natRoll: nat, rollTier: 'low' };
  if (nat >= 10 && nat <= 14) return { hit: true, isCrit: false, natRoll: nat, rollTier: 'mid' };
  if (nat >= 15 && nat <= 19) return { hit: true, isCrit: false, natRoll: nat, rollTier: 'high' };
  // nat === 20
  return { hit: true, isCrit: true, natRoll: nat, rollTier: 'crit' };
};

// Deterministic damage calculation derived from nat roll and tier.
// Ensures higher nat => equal or higher damage.
const computeDamageFromNat = (
  baseDamage: number,
  attackerLevel: number,
  natRoll: number,
  rollTier: 'fail' | 'miss' | 'low' | 'mid' | 'high' | 'crit',
  isCrit: boolean
) => {
  const levelBonus = Math.floor(attackerLevel * 0.2);
  const base = Math.max(1, Math.floor(baseDamage + levelBonus));

  const tierMultipliers: Record<string, number> = {
    fail: 0,
    miss: 0,
    low: 0.75,
    mid: 1.0,
    high: 1.25,
    crit: 1.75
  };

  const tierMult = tierMultipliers[rollTier] ?? 1;
  const critExtra = isCrit ? 1.15 : 1;

  const raw = Math.floor(base * tierMult * critExtra);
  const damage = Math.max(0, raw);

  // Deterministic hit location for consistent display (does not affect damage)
  const locs = ['torso', 'arm', 'leg', 'head'];
  const hitLocation = locs[natRoll % locs.length];

  // Debug logging for troubleshooting roll->damage mapping
  try {
    console.debug('[combat] computeDamageFromNat', { natRoll, rollTier, baseDamage, attackerLevel, base, tierMult, isCrit, critExtra, damage });
  } catch (e) {}

  return { damage, hitLocation };
};

// ============================================================================
// PLAYER COMBAT STATS CALCULATION
// ============================================================================

const validateShieldEquipping = (equipment: InventoryItem[]): InventoryItem[] => {
  return equipment.map(item => {
    const nameLower = (item.name || '').toLowerCase();
    const looksLikeShield = nameLower.includes('shield') || (item.slot === 'offhand' && (item.armor ?? 0) > 0);
    if (looksLikeShield && item.slot !== 'offhand') {
      console.warn(`Invalid shield slot detected for ${item.name}. Forcing to off-hand.`);
      return { ...item, slot: 'offhand' };
    }
    return item;
  });
};

const computeEnemyXP = (enemy: Partial<CombatEnemy> | CombatEnemy): number => {
  const lvl = (enemy.level || 1);
  const base = Math.max(1, Math.floor(lvl * 10));
  const bonus = enemy.damage ? Math.floor((enemy.damage || 0) / 2) : 0;
  return Math.max(5, base + bonus);
};

export const calculatePlayerCombatStats = (
  character: Character,
  equipment: InventoryItem[]
): PlayerCombatStats => {
  const validatedEquipment = validateShieldEquipping(equipment);
  const equippedItems = validatedEquipment.filter(item => item.equipped);
  
  // Base stats from character
  let armor = 0;
  let weaponDamage = 10; // Base unarmed damage
  let critChance = 5;
  let dodgeChance = 0;
  let magicResist = 0;

  // Calculate from equipment
  let mainWeapon = equippedItems.find(i => i.slot === 'weapon' && i.type === 'weapon');
  const offhandItem = equippedItems.find(i => i.slot === 'offhand');

  equippedItems.forEach(item => {
    if (item.armor) armor += item.armor;
  });

  if (mainWeapon && mainWeapon.damage) {
    weaponDamage = mainWeapon.damage;
  } else {
    // fallback to highest-damage equipped item
    equippedItems.forEach(item => {
      if (item.damage) weaponDamage = Math.max(weaponDamage, item.damage);
    });
  }

  // Skill bonuses
  const getSkillLevel = (name: string) => 
    character.skills.find(s => s.name === name)?.level || 15;

  // Light/Heavy armor skill affects armor rating
  const lightArmorSkill = getSkillLevel('Light Armor');
  const heavyArmorSkill = getSkillLevel('Heavy Armor');
  const armorSkillBonus = Math.max(lightArmorSkill, heavyArmorSkill) * 0.5;
  armor = Math.floor(armor * (1 + armorSkillBonus / 100));

  // Sneak affects dodge chance
  dodgeChance = Math.floor(getSkillLevel('Sneak') * 0.3);

  // One-Handed/Two-Handed affects weapon damage
  const oneHandedSkill = getSkillLevel('One-Handed');
  const twoHandedSkill = getSkillLevel('Two-Handed');
  const archerySkill = getSkillLevel('Archery');
  const weaponSkillBonus = Math.max(oneHandedSkill, twoHandedSkill, archerySkill) * 0.5;
  weaponDamage = Math.floor(weaponDamage * (1 + weaponSkillBonus / 100));

  // Destruction affects magic damage (handled in abilities)
  // Alteration affects magic resist
  magicResist = Math.floor(getSkillLevel('Alteration') * 0.2);

  // Generate abilities based on skills and equipment
  const abilities = generatePlayerAbilities(character, equippedItems);

  return {
    maxHealth: character.stats.health,
    currentHealth: character.currentVitals?.currentHealth ?? character.stats.health,
    maxMagicka: character.stats.magicka,
    currentMagicka: character.currentVitals?.currentMagicka ?? character.stats.magicka,
    maxStamina: character.stats.stamina,
    currentStamina: character.currentVitals?.currentStamina ?? character.stats.stamina,
    armor,
    weaponDamage,
    critChance,
    dodgeChance,
    magicResist,
    abilities,
    // Passive regen: base 0.25 per second (== 1 per 4s). Can be increased by progression later.
    regenHealthPerSec: 0.25,
    regenMagickaPerSec: 0.25,
    regenStaminaPerSec: 0.25
  };
};

// ============================================================================
// PLAYER ABILITIES GENERATION
// ============================================================================

const generatePlayerAbilities = (
  character: Character,
  equipment: InventoryItem[]
): CombatAbility[] => {
  const abilities: CombatAbility[] = [];
  const getSkillLevel = (name: string) => 
    character.skills.find(s => s.name === name)?.level || 15;

  // Always available: Basic Attack
  const weapon = equipment.find(i => i.equipped && i.slot === 'weapon');
  abilities.push({
    id: 'basic_attack',
    name: weapon ? `Strike with ${weapon.name}` : 'Unarmed Strike',
    type: 'melee',
    damage: weapon?.damage || 10,
    cost: 10, // stamina
    description: 'A basic attack with your equipped weapon.'
  });

  // Off-hand attack if dual-wielding a small weapon
  const offhandWeapon = equipment.find(i => i.equipped && i.slot === 'offhand' && i.type === 'weapon');
  if (offhandWeapon && isSmallWeapon(offhandWeapon)) {
    abilities.push({
      id: 'offhand_attack',
      name: `Off-hand: ${offhandWeapon.name}`,
      type: 'melee',
      damage: Math.max(5, Math.floor((offhandWeapon.damage || 6) * 0.6)),
      cost: 8,
      description: `A quick off-hand strike with ${offhandWeapon.name}.`
    });
  }

  // Power Attack (if stamina > 25 and weapon skill > 20)
  const weaponSkill = Math.max(getSkillLevel('One-Handed'), getSkillLevel('Two-Handed'));
  if (weaponSkill >= 20) {
    abilities.push({
      id: 'power_attack',
      name: 'Power Attack',
      type: 'melee',
      damage: Math.floor((weapon?.damage || 10) * 1.5),
      cost: 25,
      cooldown: 2,
      description: 'A powerful strike that deals 50% more damage.',
      effects: [{ type: 'stun', value: 1, duration: 1, chance: 25 }]
    });
  }

  // Shield Bash (if shield equipped)
  const shield = equipment.find(i => i.equipped && i.slot === 'offhand' && i.armor);
  if (shield) {
    abilities.push({
      id: 'shield_bash',
      name: 'Shield Bash',
      type: 'melee',
      damage: Math.floor(shield.armor! * 0.5),
      cost: 15,
      cooldown: 2,
      effects: [{ type: 'stun', value: 1, duration: 1, chance: 50 }],
      description: 'Bash with your shield, potentially stunning the enemy.'
    });
  }

  // Magic abilities based on destruction skill
  const destructionSkill = getSkillLevel('Destruction');
  if (destructionSkill >= 20) {
    abilities.push({
      id: 'flames',
      name: 'Flames',
      type: 'magic',
      damage: 15 + Math.floor(destructionSkill * 0.3),
      cost: 15,
      description: 'A stream of fire that damages enemies.',
      effects: [{ type: 'dot', stat: 'health', value: 3, duration: 2, chance: 30 }]
    });
  }
  if (destructionSkill >= 35) {
    abilities.push({
      id: 'ice_spike',
      name: 'Ice Spike',
      type: 'magic',
      damage: 25 + Math.floor(destructionSkill * 0.4),
      cost: 25,
      cooldown: 1,
      description: 'A spike of ice that slows enemies.',
      effects: [{ type: 'debuff', stat: 'stamina', value: -20, duration: 2 }]
    });
  }
  if (destructionSkill >= 50) {
    abilities.push({
      id: 'lightning_bolt',
      name: 'Lightning Bolt',
      type: 'magic',
      damage: 35 + Math.floor(destructionSkill * 0.5),
      cost: 35,
      cooldown: 2,
      description: 'A bolt of lightning that drains magicka.',
      effects: [{ type: 'drain', stat: 'magicka', value: 15 }]
    });
  }

  // Restoration spells
  const restorationSkill = getSkillLevel('Restoration');
  if (restorationSkill >= 20) {
    abilities.push({
      id: 'healing',
      name: 'Healing',
      type: 'magic',
      damage: 0,
      cost: 20,
      description: 'Restore your health.',
      effects: [{ type: 'heal', stat: 'health', value: 25 + Math.floor(restorationSkill * 0.5) }]
    });
  }

  // Conjuration - summon would be complex, so we'll do a damage spell
  const conjurationSkill = getSkillLevel('Conjuration');
  if (conjurationSkill >= 30) {
    abilities.push({
      id: 'bound_weapon',
      name: 'Bound Weapon',
      type: 'magic',
      damage: 30 + Math.floor(conjurationSkill * 0.3),
      cost: 30,
      cooldown: 3,
      description: 'Conjure a spectral weapon to strike your foe.'
    });
  }

  // Archery (if bow equipped)
  const bow = equipment.find(i => i.equipped && i.slot === 'weapon' && 
    i.name.toLowerCase().includes('bow'));
  if (bow) {
    const archerySkill = getSkillLevel('Archery');
    abilities.push({
      id: 'aimed_shot',
      name: 'Aimed Shot',
      type: 'ranged',
      damage: Math.floor((bow.damage || 15) * 1.3),
      cost: 20,
      cooldown: 1,
      description: 'A carefully aimed arrow for extra damage.',
      effects: [{ type: 'damage', value: Math.floor(archerySkill * 0.2), chance: 100 }]
    });
  }

  // Learned spells (from spells registry) -> turn into abilities
  try {
    const learned = getLearnedSpellIds(character.id || '');
    learned.forEach(spellId => {
      const ab = createAbilityFromSpell(spellId);
      if (ab) abilities.push(ab as any);
    });
  } catch (e) {
    // If anything goes wrong reading spells, ignore — spells are optional
  }

  return abilities;
};

// Grant a new ability to the player's combat stats (idempotent)
export const grantAbilityToPlayer = (playerStats: PlayerCombatStats, ability: CombatAbility): PlayerCombatStats => {
  const existing = playerStats.abilities.find(a => a.id === ability.id);
  if (!existing) {
    playerStats.abilities = [...playerStats.abilities, ability];
  }
  return playerStats;
};

// ============================================================================
// COMBAT STATE MANAGEMENT
// ============================================================================

export const initializeCombat = (
  enemies: CombatEnemy[],
  location: string,
  ambush: boolean = false,
  fleeAllowed: boolean = true,
  surrenderAllowed: boolean = false
): CombatState => {
  // Initialize enemies with IDs and full health
  const initializedEnemies = enemies.map((enemy, index) => ({
    ...enemy,
    id: enemy.id || `enemy_${index}_${Date.now()}`,
    currentHealth: enemy.maxHealth,
    currentMagicka: enemy.maxMagicka,
    currentStamina: enemy.maxStamina,
    activeEffects: [],
    // Default regen: 0.25 per second (== 1 per 4s), override via enemy.regenHealthPerSec
    regenHealthPerSec: enemy.regenHealthPerSec ?? 0.25,
    // Ensure rewards and loot exist to avoid empty loot phases
    xpReward: typeof enemy.xpReward === 'number' ? enemy.xpReward : computeEnemyXP(enemy as CombatEnemy),
    goldReward: typeof enemy.goldReward === 'number' ? enemy.goldReward : randomRange(Math.max(1, (enemy.level || 1) * 5), Math.max(5, (enemy.level || 1) * 12)),
    loot: Array.isArray(enemy.loot) && enemy.loot.length ? enemy.loot : (BASE_ENEMY_TEMPLATES[(enemy.type || '').toLowerCase()]?.possibleLoot || enemy.loot || [])
  }));

  // Calculate turn order (player first unless ambushed)
  const turnOrder = ambush 
    ? [...initializedEnemies.map(e => e.id), 'player']
    : ['player', ...initializedEnemies.map(e => e.id)];

  return {
    id: `combat_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    active: true,
    // Mark combat start time for duration-based effects
    combatStartTime: Date.now(),
    turn: 1,
    currentTurnActor: turnOrder[0],
    turnOrder,
    enemies: initializedEnemies,
    location,
    fleeAllowed,
    surrenderAllowed,
    combatLog: [{
      turn: 0,
      actor: 'system',
      action: 'combat_start',
      narrative: ambush 
        ? `You've been ambushed! ${initializedEnemies.map(e => e.name).join(', ')} attack!`
        : `Combat begins against ${initializedEnemies.map(e => e.name).join(', ')}!`,
      timestamp: Date.now()
    }],
    playerDefending: false,
    playerActiveEffects: [],
    abilityCooldowns: {},
    lastActorActions: {}
  };
};

// ============================================================================
// DAMAGE CALCULATION
// ============================================================================

export const calculateDamage = (
  baseDamage: number,
  attackerLevel: number,
  targetArmor: number,
  targetResistances: string[] = [],
  damageType?: string,
  critChance: number = 0
): { damage: number; isCrit: boolean; resisted: boolean } => {
  // Backwards-compatible: keep a simple path but prefer dice-based resolution
  const resisted = damageType ? targetResistances.includes(damageType) : false;

  // Use deterministic mapping for compatibility: assume a mid roll
  const assumedNat = 12;
  const assumedTier: any = 'mid';
  const { damage: rolled } = computeDamageFromNat(baseDamage, attackerLevel, assumedNat, assumedTier, Math.random() * 100 < critChance);

  // Armor reduction (diminishing returns)
  const armorReduction = targetArmor / (targetArmor + 100);
  let damage = Math.floor(rolled * (1 - armorReduction));

  if (resisted) damage = Math.floor(damage * 0.5);
  damage = Math.max(1, damage);
  const isCrit = Math.random() * 100 < critChance;
  return { damage, isCrit, resisted };
};

// ============================================================================
// PLAYER ACTIONS
// ============================================================================

// Note: stat application moved to shared `services/vitals.ts` (use `applyStatToVitals`).

export const executePlayerAction = (
  state: CombatState,
  playerStats: PlayerCombatStats,
  action: CombatActionType,
  targetId?: string,
  abilityId?: string,
  itemId?: string,
  inventory?: InventoryItem[],
  natRoll?: number
): { newState: CombatState; newPlayerStats: PlayerCombatStats; narrative: string; usedItem?: InventoryItem } => {
  let newState = { ...state };
  let newPlayerStats = { ...playerStats };
  let narrative = '';

  switch (action) {
    case 'attack':
    case 'power_attack':
    case 'magic':
    case 'shout': {
      const ability = abilityId 
        ? playerStats.abilities.find(a => a.id === abilityId)
        : playerStats.abilities[0]; // Default to basic attack
      
      if (!ability) {
        narrative = 'Invalid ability!';
        break;
      }

      // Check cooldown
      if (newState.abilityCooldowns[ability.id] > 0) {
        narrative = `${ability.name} is still on cooldown for ${newState.abilityCooldowns[ability.id]} turns!`;
        break;
      }

      // Track action counts for skill progression
      newState.playerActionCounts = newState.playerActionCounts || {};
      const actionKey = ability.type === 'magic' ? 'magic' : ability.type === 'melee' ? (ability.id || 'melee') : ability.type;
      newState.playerActionCounts[actionKey] = (newState.playerActionCounts[actionKey] || 0) + 1;

      // Check cost and handle stamina-shortage by scaling damage instead of blocking
      const costType = ability.type === 'magic' ? 'currentMagicka' : 'currentStamina';
      let staminaMultiplier = 1;
      if (ability.type === 'magic') {
        if (newPlayerStats.currentMagicka < ability.cost) {
          narrative = `Not enough magicka for ${ability.name}!`;
          break;
        }
        newPlayerStats.currentMagicka -= ability.cost;
      } else {
        const available = newPlayerStats.currentStamina || 0;
        if (available <= 0) {
          // No stamina: allow a weak attack
          staminaMultiplier = 0.25;
        } else if (available < ability.cost) {
          // Partial stamina: scale effectiveness proportionally but keep a floor
          staminaMultiplier = Math.max(0.25, available / ability.cost);
        }
        // Consume what stamina is available (don't force negative)
        newPlayerStats.currentStamina = Math.max(0, newPlayerStats.currentStamina - Math.min(ability.cost, available));
        if (staminaMultiplier < 1) {
          narrative = `Low stamina reduces the effectiveness of ${ability.name}.`;
        }
      }

      // Find target
      const target = targetId 
        ? newState.enemies.find(e => e.id === targetId)
        : newState.enemies.find(e => e.currentHealth > 0);
      
      if (!target) {
        narrative = 'No valid target!';
        break;
      }

      // Prevent acting on defeated enemies
      if (target.currentHealth <= 0) {
        narrative = `${target.name} is already defeated!`;
        newState.combatLog.push({
          turn: newState.turn,
          actor: 'player',
          action: ability.name,
          target: target.name,
          damage: 0,
          narrative,
          timestamp: Date.now()
        });
        break;
      }

      // Resolve attack (d20 + bonuses vs armor/dodge) then roll damage dice
      const attackBonus = Math.floor(playerStats.weaponDamage / 10);
      const attackResolved = resolveAttack({ attackerLevel: 12, attackBonus, targetArmor: target.armor, targetDodge: (target as any).dodgeChance || 0, critChance: playerStats.critChance, natRoll });

      // If nat indicates miss/fail, log accordingly
      if (!attackResolved.hit) {
        const rollText = attackResolved.rollTier === 'fail' ? 'critical failure' : 'miss';
        narrative = `You roll ${attackResolved.natRoll} (${rollText}) and ${ability.name} against ${target.name} fails to connect.`;
        newState.combatLog.push({ turn: newState.turn, actor: 'player', action: ability.name, target: target.name, damage: 0, isCrit: false, nat: attackResolved.natRoll, rollTier: attackResolved.rollTier, narrative, timestamp: Date.now() });
        break;
      }

      // Determine damage tier multipliers based on rollTier
      const tierMultipliers: Record<string, number> = { low: 0.6, mid: 1.0, high: 1.25, crit: 1.75 };
      const baseDamage = ability.damage + Math.floor(playerStats.weaponDamage * (ability.type === 'melee' ? 0.5 : 0));
      const tierMult = tierMultipliers[attackResolved.rollTier] ?? 1;
      const scaledBase = Math.max(1, Math.floor(baseDamage * staminaMultiplier * tierMult));
      const { damage, hitLocation } = computeDamageFromNat(scaledBase, 12, attackResolved.natRoll, attackResolved.rollTier, attackResolved.isCrit);

      // Apply armor/resistance reductions (post-roll)
      const armorReduction = target.armor / (target.armor + 100);
      const finalDamage = Math.max(1, Math.floor(damage * (1 - armorReduction)));

      const isCrit = attackResolved.isCrit;
      const resisted = ability.type === 'magic' && target.resistances?.includes('magic');
      const appliedDamage = resisted ? Math.floor(finalDamage * 0.5) : finalDamage;

      // Apply damage
      const enemyIndex = newState.enemies.findIndex(e => e.id === target.id);
      newState.enemies[enemyIndex] = {
        ...target,
        currentHealth: Math.max(0, target.currentHealth - appliedDamage)
      };

      // Set cooldown
      if (ability.cooldown) {
        newState.abilityCooldowns[ability.id] = ability.cooldown;
      }

      // Build narrative
      let damageNarrative = `deals ${appliedDamage} damage to the ${hitLocation}`;
      if (isCrit) damageNarrative = `CRITICAL HIT! ` + damageNarrative;
      if (resisted) damageNarrative += ` (resisted)`;

      narrative = `You use ${ability.name} on ${target.name} and ${damageNarrative}!`;
      
      if (newState.enemies[enemyIndex].currentHealth <= 0) {
        narrative += ` ${target.name} is defeated!`;
      }

      // Record player's last action to avoid immediate repetition in AI (for flavor)
      newState.lastActorActions = newState.lastActorActions || {};
      newState.lastActorActions['player'] = [ability.id, ...(newState.lastActorActions['player'] || [])].slice(0, 4);

      // Apply effects
      if (ability.effects) {
        ability.effects.forEach(effect => {
          if (Math.random() * 100 < (effect.chance || 100)) {
            if (effect.type === 'heal') {
              const healAmount = effect.value;
              newPlayerStats.currentHealth = Math.min(
                newPlayerStats.maxHealth,
                newPlayerStats.currentHealth + healAmount
              );
              narrative += ` You recover ${healAmount} health.`;
            } else if (effect.duration) {
              // Add status effect to enemy
              newState.enemies[enemyIndex].activeEffects = [
                ...(newState.enemies[enemyIndex].activeEffects || []),
                { effect, turnsRemaining: effect.duration }
              ];
              narrative += ` ${target.name} is affected by ${effect.type}!`;
            }
          }
        });
      }

      // Log the action
      newState.combatLog.push({
        turn: newState.turn,
        actor: 'player',
        action: ability.name,
        target: target.name,
        damage: appliedDamage,
        isCrit: !!isCrit,
        nat: attackResolved.natRoll,
        rollTier: attackResolved.rollTier,
        narrative,
        timestamp: Date.now()
      });
      break;
    }

    case 'defend': {
      newState.playerDefending = true;
      narrative = 'You raise your guard, reducing incoming damage by 50% this turn.';
      newState.playerActionCounts = newState.playerActionCounts || {};
      newState.playerActionCounts['defend'] = (newState.playerActionCounts['defend'] || 0) + 1;
      newState.combatLog.push({
        turn: newState.turn,
        actor: 'player',
        action: 'defend',
        narrative,
        timestamp: Date.now()
      });
      break;
    }

    case 'flee': {
      if (!newState.fleeAllowed) {
        narrative = 'You cannot flee from this battle!';
        break;
      }
      // Flee chance based on sneak/agility
      const fleeChance = 50 + playerStats.dodgeChance;
      if (Math.random() * 100 < fleeChance) {
        newState.result = 'fled';
        newState.active = false;
        narrative = 'You successfully escape from combat!';
      } else {
        narrative = 'You failed to escape! The enemies block your path.';
      }
      newState.combatLog.push({
        turn: newState.turn,
        actor: 'player',
        action: 'flee',
        narrative,
        timestamp: Date.now()
      });
      break;
    }

    case 'surrender': {
      if (!newState.surrenderAllowed) {
        narrative = 'These enemies will not accept your surrender!';
        break;
      }
      newState.result = 'surrendered';
      newState.active = false;
      narrative = 'You lay down your arms and surrender...';
      newState.combatLog.push({
        turn: newState.turn,
        actor: 'player',
        action: 'surrender',
        narrative,
        timestamp: Date.now()
      });
      break;
    }

    case 'item': {
      // Item usage in combat - healing potions and food
      if (!itemId || !inventory) {
        narrative = 'No item selected or inventory not available!';
        break;
      }

      const itemIndex = inventory.findIndex(it => it.id === itemId);
      if (itemIndex === -1) {
        narrative = 'Item not found in inventory!';
        break;
      }

      const item = inventory[itemIndex];
      if (!item || item.quantity <= 0) {
        narrative = `You don't have any of that item!`;
        break;
      }

      let usedItem: InventoryItem | undefined;

      if (item.type === 'potion') {
        // Resolve potion effect centrally
        const resolved = resolvePotionEffect(item);
        const amount = resolved.amount ?? item.damage ?? 0;
        if (!resolved.stat || !amount || amount <= 0) {
          narrative = `The ${item.name} has no clear effect.`;
          newState.combatLog.push({ turn: newState.turn, actor: 'player', action: 'item', target: item.name, narrative, isCrit: false, timestamp: Date.now() });
          break;
        }

        const mod = modifyPlayerCombatStat(newPlayerStats, resolved.stat, amount);
        if (mod.actual > 0) {
          newPlayerStats = mod.newPlayerStats;
          usedItem = { ...item, quantity: item.quantity - 1 };
          narrative = `You use ${item.name} and recover ${mod.actual} ${resolved.stat}.`;
          newState.combatLog.push({ turn: newState.turn, actor: 'player', action: 'item', target: item.name, damage: 0, narrative, isCrit: false, timestamp: Date.now() });
          return { newState, newPlayerStats, narrative, usedItem };
        }

        narrative = `The ${item.name} had no effect.`;
        newState.combatLog.push({ turn: newState.turn, actor: 'player', action: 'item', target: item.name, narrative, isCrit: false, timestamp: Date.now() });
        break;
      }

      if (item.type === 'food' || item.type === 'drink') {
        // Food/drink item - use nutrition data for healing or fallback
        const nutrition = getFoodNutrition(item.name);
        const healAmount = nutrition ? Math.floor((nutrition.hungerReduction || 0) / 2) + 10 : 15;
        const actualHeal = Math.min(healAmount, newPlayerStats.maxHealth - newPlayerStats.currentHealth);
        if (actualHeal > 0) {
          newPlayerStats.currentHealth = newPlayerStats.currentHealth + actualHeal;
          usedItem = { ...item, quantity: item.quantity - 1 };
          // Also apply survival deltas so food in combat reduces hunger/thirst accordingly
          newState.survivalDelta = newState.survivalDelta || {};
          newState.survivalDelta.hunger = (newState.survivalDelta.hunger || 0) - (nutrition.hungerReduction || 0);
          newState.survivalDelta.thirst = (newState.survivalDelta.thirst || 0) - (nutrition.thirstReduction || 0);

          narrative = `You consume ${item.name} and recover ${actualHeal} health.`;
          newState.combatLog.push({ turn: newState.turn, actor: 'player', action: 'item', target: item.name, damage: 0, narrative, isCrit: false, timestamp: Date.now() });
          return { newState, newPlayerStats, narrative, usedItem };
        }
        narrative = `You cannot use ${item.name} right now.`;
        newState.combatLog.push({ turn: newState.turn, actor: 'player', action: 'item', target: item.name, narrative, isCrit: false, timestamp: Date.now() });
        break;
      }

      narrative = `You cannot use ${item.name} in combat.`;
      newState.playerActionCounts = newState.playerActionCounts || {};
      newState.playerActionCounts['use_item'] = (newState.playerActionCounts['use_item'] || 0) + 1;
      newState.combatLog.push({ turn: newState.turn, actor: 'player', action: 'item', target: item.name, narrative, isCrit: false, timestamp: Date.now() });
      break;
    }
  }

  return { newState, newPlayerStats, narrative };
};

// ============================================================================
// ENEMY AI & ACTIONS
// ============================================================================

export const executeEnemyTurn = (
  state: CombatState,
  enemyId: string,
  playerStats: PlayerCombatStats,
  natRoll?: number
): { newState: CombatState; newPlayerStats: PlayerCombatStats; narrative: string } => {
  let newState = { ...state };
  let newPlayerStats = { ...playerStats };
  
  const enemy = newState.enemies.find(e => e.id === enemyId);
  if (!enemy || enemy.currentHealth <= 0) {
    return { newState, newPlayerStats, narrative: '' };
  }

  // Process enemy status effects (dot and stun). Use a loop so we can early-return on stun, and still decrement durations.
  let isStunned = false;
  if (enemy.activeEffects && enemy.activeEffects.length > 0) {
    for (const ae of enemy.activeEffects) {
      if (ae.effect.type === 'dot') {
        const dotDamage = ae.effect.value;
        enemy.currentHealth = Math.max(0, enemy.currentHealth - dotDamage);
      } else if (ae.effect.type === 'stun' && ae.turnsRemaining > 0) {
        // Enemy is stunned; record it and log
        newState.combatLog.push({
          turn: newState.turn,
          actor: enemy.name,
          action: 'stunned',
          narrative: `${enemy.name} is stunned and cannot act!`,
          timestamp: Date.now()
        });
        isStunned = true;
      }
    }

    // Decrement effect durations (applies even if stunned)
    enemy.activeEffects = enemy.activeEffects
      .map(ae => ({ ...ae, turnsRemaining: ae.turnsRemaining - 1 }))
      .filter(ae => ae.turnsRemaining > 0);

    // If stunned, skip the rest of this turn
    if (isStunned) {
      return { newState, newPlayerStats, narrative: `${enemy.name} is stunned and skips their turn.` };
    }
  }

  // Choose ability based on behavior
  let chosenAbility: CombatAbility;
  const availableAbilities = enemy.abilities.filter(a => {
    // Disallow magic if not enough magicka, but allow melee even with low stamina
    if (a.type === 'magic' && enemy.currentMagicka && enemy.currentMagicka < a.cost) return false;
    return true;
  });

  switch (enemy.behavior) {
    case 'aggressive':
    case 'berserker':
      // Pick highest damage ability
      chosenAbility = availableAbilities.reduce((best, curr) => 
        curr.damage > best.damage ? curr : best, availableAbilities[0]);
      break;
    case 'defensive':
      // Pick lower cost abilities
      chosenAbility = availableAbilities.reduce((best, curr) => 
        curr.cost < best.cost ? curr : best, availableAbilities[0]);
      break;
    case 'tactical':
      // Use abilities with effects more often
      const withEffects = availableAbilities.filter(a => a.effects && a.effects.length > 0);
      chosenAbility = withEffects.length > 0 && Math.random() > 0.5 
        ? withEffects[Math.floor(Math.random() * withEffects.length)]
        : availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
      break;
    default:
      chosenAbility = availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
  }

  if (!chosenAbility) {
    chosenAbility = { 
      id: 'basic', 
      name: 'Attack', 
      type: 'melee', 
      damage: enemy.damage, 
      cost: 0, 
      description: 'Basic attack' 
    };
  }

  // Avoid repeating the exact same ability if other options exist
  newState.lastActorActions = newState.lastActorActions || {};
  const recent = newState.lastActorActions[enemy.id] || [];
  if (availableAbilities.length > 1 && recent[0] && chosenAbility && recent.includes(chosenAbility.id)) {
    const alt = availableAbilities.find(a => !recent.includes(a.id));
    if (alt) chosenAbility = alt;
  }


  // Resolve enemy attack via d20 + attack bonus
  const attackBonus = Math.max(0, Math.floor(enemy.damage / 8));
  const resolved = resolveAttack({ attackerLevel: enemy.level, attackBonus, targetArmor: playerStats.armor, targetDodge: playerStats.dodgeChance, critChance: 10, natRoll });

  // If stamina is low, scale enemy melee damage instead of preventing the attack
  let appliedDamage = 0;
  let hitLocation = 'torso';
  if (!resolved.hit) {
    appliedDamage = 0;
  } else {
    let enemyStaminaMultiplier = 1;
    if (chosenAbility.type === 'melee') {
      const avail = enemy.currentStamina || 0;
      if (avail <= 0) enemyStaminaMultiplier = 0.25;
      else if (avail < (chosenAbility.cost || 0)) enemyStaminaMultiplier = Math.max(0.25, avail / (chosenAbility.cost || 1));
      enemy.currentStamina = Math.max(0, (enemy.currentStamina || 0) - Math.min(chosenAbility.cost || 0, avail));
    } else if (chosenAbility.type === 'magic') {
      if (enemy.currentMagicka && enemy.currentMagicka >= (chosenAbility.cost || 0)) {
        enemy.currentMagicka = Math.max(0, enemy.currentMagicka - (chosenAbility.cost || 0));
      }
    }

    const base = (chosenAbility.damage || enemy.damage) * enemyStaminaMultiplier;
    const scaledBase = Math.max(1, Math.floor(base));
    const rollRes = computeDamageFromNat(scaledBase, enemy.level, resolved.natRoll, resolved.rollTier, resolved.isCrit);
    hitLocation = rollRes.hitLocation;
    // Apply armor reduction
    const armorReduction = playerStats.armor / (playerStats.armor + 100);
    let d = Math.floor(rollRes.damage * (1 - armorReduction));
    if (resolved.isCrit) d = Math.floor(d * 1.25);
    appliedDamage = Math.max(0, d);
  }

  // Dodge check still allows extra chance
  if (appliedDamage > 0 && Math.random() * 100 < playerStats.dodgeChance) {
    appliedDamage = 0;
  }

  // Defending reduces damage
  if (newState.playerDefending && appliedDamage > 0) {
    appliedDamage = Math.floor(appliedDamage * 0.5);
  }

  // Apply damage to player
  newPlayerStats.currentHealth = Math.max(0, newPlayerStats.currentHealth - appliedDamage);

  // Build narrative
  let narrative = `${enemy.name} uses ${chosenAbility.name}`;
  if (!resolved.hit) {
    narrative += ` and rolls ${resolved.natRoll} (${resolved.rollTier}), missing you.`;
  } else if (appliedDamage === 0) {
    narrative += ` but you avoid the attack!`;
  } else {
    narrative += ` and deals ${appliedDamage} damage to your ${hitLocation}!`;
    if (resolved.isCrit) narrative = `${enemy.name} lands a CRITICAL HIT with ${chosenAbility.name} for ${appliedDamage} damage!`;
  }

  if (newPlayerStats.currentHealth <= 0) {
    narrative += ` You have been defeated...`;
    newState.result = 'defeat';
    newState.active = false;
  }

  // Log
  newState.combatLog.push({
    turn: newState.turn,
    actor: enemy.name,
    action: chosenAbility.name,
    target: 'player',
    damage: appliedDamage,
    isCrit: !!resolved.isCrit,
    nat: resolved.natRoll,
    rollTier: resolved.rollTier,
    narrative,
    timestamp: Date.now()
  });

  // Record enemy last action
  newState.lastActorActions[enemy.id] = [chosenAbility.id, ...(newState.lastActorActions[enemy.id] || [])].slice(0, 4);

  return { newState, newPlayerStats, narrative };
};

// ============================================================================
// TURN MANAGEMENT
// ============================================================================

export const advanceTurn = (state: CombatState): CombatState => {
  const newState = { ...state };
  
  // Find next actor in turn order
  const currentIndex = newState.turnOrder.indexOf(newState.currentTurnActor);
  let nextIndex = (currentIndex + 1) % newState.turnOrder.length;
  
  // Skip dead enemies
  while (nextIndex !== currentIndex) {
    const nextActor = newState.turnOrder[nextIndex];
    if (nextActor === 'player') break;
    const enemy = newState.enemies.find(e => e.id === nextActor);
    if (enemy && enemy.currentHealth > 0) break;
    nextIndex = (nextIndex + 1) % newState.turnOrder.length;
  }
  
  newState.currentTurnActor = newState.turnOrder[nextIndex];
  
  // If we've cycled back to start, increment turn
  if (nextIndex <= currentIndex || nextIndex === 0) {
    newState.turn++;
    // Reduce cooldowns
    Object.keys(newState.abilityCooldowns).forEach(key => {
      if (newState.abilityCooldowns[key] > 0) {
        newState.abilityCooldowns[key]--;
      }
    });
    // Reset defending
    newState.playerDefending = false;
  }
  
  return newState;
};

export const checkCombatEnd = (state: CombatState, playerStats: PlayerCombatStats): CombatState => {
  const newState = { ...state };
  
  // Check if all enemies are defeated
  const allEnemiesDefeated = newState.enemies.every(e => e.currentHealth <= 0);
  if (allEnemiesDefeated) {
    // Move into loot phase. Do not grant rewards yet — collect possible drops and wait for player selection.
    newState.active = false;
    newState.lootPending = true;

    const xp = newState.enemies.reduce((sum, e) => sum + (e.xpReward || 0), 0);
    const gold = newState.enemies.reduce((sum, e) => sum + (e.goldReward || 0), 0);

    // Create per-enemy loot snapshots based on drop chances
    const pendingLoot: typeof newState.pendingLoot = [];
    const items: Array<{ name: string; type: string; description: string; quantity: number }> = [];

    newState.enemies.forEach(enemy => {
      const enemyLoot: typeof pendingLoot[number] = { enemyId: enemy.id, enemyName: enemy.name, loot: [] };
      enemy.loot?.forEach(lootItem => {
        if (Math.random() * 100 < (lootItem.dropChance || 0)) {
          const found = { name: lootItem.name, type: lootItem.type, description: lootItem.description, quantity: lootItem.quantity, rarity: (lootItem as any).rarity };
          enemyLoot.loot.push(found);
          items.push({ name: lootItem.name, type: lootItem.type, description: lootItem.description, quantity: lootItem.quantity });
        }
      });
      if (enemyLoot.loot.length > 0) pendingLoot.push(enemyLoot);
    });

    newState.pendingRewards = { xp, gold, items };
    newState.pendingLoot = pendingLoot;

    // Compute elapsed combat time and survival deltas
    const start = newState.combatStartTime || Date.now();
    const elapsedSec = Math.max(0, Math.floor((Date.now() - start) / 1000));
    newState.combatElapsedSec = elapsedSec;

    // Default passive need rates (per minute)
    const hungerPerMinute = 1 / 180;
    const thirstPerMinute = 1 / 120;
    const fatiguePerMinute = 1 / 90;
    const minutes = elapsedSec / 60;
    const hungerInc = Math.round(minutes * hungerPerMinute * 10) / 10;
    const thirstInc = Math.round(minutes * thirstPerMinute * 10) / 10;
    const fatigueInc = Math.round(minutes * fatiguePerMinute * 10) / 10;

    newState.survivalDelta = {
      hunger: hungerInc,
      thirst: thirstInc,
      fatigue: fatigueInc
    };

    newState.combatLog.push({
      turn: newState.turn,
      actor: 'system',
      action: 'loot_phase',
      narrative: `All enemies defeated — enter loot phase.`,
      timestamp: Date.now()
    });
  }
  
  // Check player defeat
  if (playerStats.currentHealth <= 0) {
    newState.result = 'defeat';
    newState.active = false;
    newState.combatLog.push({
      turn: newState.turn,
      actor: 'system',
      action: 'defeat',
      narrative: 'You have been defeated...',
      timestamp: Date.now()
    });
    // Record elapsed time and survival delta on defeat as well
    const start = newState.combatStartTime || Date.now();
    const elapsedSec = Math.max(0, Math.floor((Date.now() - start) / 1000));
    newState.combatElapsedSec = elapsedSec;
    const hungerPerMinute = 1 / 180;
    const thirstPerMinute = 1 / 120;
    const fatiguePerMinute = 1 / 90;
    const minutes = elapsedSec / 60;
    newState.survivalDelta = {
      hunger: Math.round(minutes * hungerPerMinute * 10) / 10,
      thirst: Math.round(minutes * thirstPerMinute * 10) / 10,
      fatigue: Math.round(minutes * fatiguePerMinute * 10) / 10
    };
  }
  
  return newState;
};

// Apply regen after a turn. Uses per-second regen values but applies them for a turn-length equivalent.
// By default a "turn" yields the same healing as the previous 4s tick (regenPerSec * 4).
export const applyTurnRegen = (state: CombatState, playerStats: PlayerCombatStats, secondsPerTurn = 4) => {
  let newPlayerStats = { ...playerStats };
  const multiplier = secondsPerTurn;
  const nh = Math.min(newPlayerStats.maxHealth, newPlayerStats.currentHealth + Math.floor((newPlayerStats.regenHealthPerSec || 0) * multiplier));
  const nm = Math.min(newPlayerStats.maxMagicka, newPlayerStats.currentMagicka + Math.floor((newPlayerStats.regenMagickaPerSec || 0) * multiplier));
  const ns = Math.min(newPlayerStats.maxStamina, newPlayerStats.currentStamina + Math.floor((newPlayerStats.regenStaminaPerSec || 0) * multiplier));
  newPlayerStats.currentHealth = nh;
  newPlayerStats.currentMagicka = nm;
  newPlayerStats.currentStamina = ns;

  const enemies = state.enemies.map(e => {
    if (!e || e.currentHealth <= 0) return e;
    const regen = e.regenHealthPerSec || 0;
    if (!regen) return e;
    const nh = Math.min(e.maxHealth, (e.currentHealth || 0) + Math.floor(regen * multiplier));
    if (nh !== e.currentHealth) return { ...e, currentHealth: nh };
    return e;
  });

  const newState = { ...state, enemies };
  return { newState, newPlayerStats };
};

// ============================================================================
// ENEMY TEMPLATES
// ============================================================================

// ============================================================================
// BASE ENEMY TEMPLATES - Used as foundation for dynamic generation
// ============================================================================

interface BaseEnemyTemplate {
  baseName: string;
  type: 'humanoid' | 'beast' | 'undead' | 'daedra' | 'automaton';
  baseLevel: number;
  baseHealth: number;
  baseArmor: number;
  baseDamage: number;
  behaviors: ('aggressive' | 'defensive' | 'tactical' | 'berserker')[];
  possibleAbilities: CombatAbility[];
  weaknesses?: string[];
  resistances?: string[];
  isBoss?: boolean;
  baseXP: number;
  baseGold?: number;
  possibleLoot: { name: string; type: string; description: string; quantity: number; dropChance: number; damage?: number; armor?: number; slot?: string }[];
}

const BASE_ENEMY_TEMPLATES: Record<string, BaseEnemyTemplate> = {
  bandit: {
    baseName: 'Bandit',
    type: 'humanoid',
    baseLevel: 5,
    baseHealth: 50,
    baseArmor: 15,
    baseDamage: 12,
    behaviors: ['aggressive', 'tactical', 'defensive'],
    possibleAbilities: [
      { id: 'slash', name: 'Slash', type: 'melee', damage: 12, cost: 10, description: 'A quick slash' },
      { id: 'stab', name: 'Stab', type: 'melee', damage: 14, cost: 12, description: 'A precise thrust' },
      { id: 'bash', name: 'Shield Bash', type: 'melee', damage: 8, cost: 5, description: 'Shield bash', effects: [{ type: 'stun', value: 1, duration: 1, chance: 20 }] },
      { id: 'throw_dagger', name: 'Throw Dagger', type: 'ranged', damage: 10, cost: 8, description: 'Throw a concealed dagger' },
      { id: 'dirty_trick', name: 'Dirty Trick', type: 'melee', damage: 6, cost: 5, description: 'Throw sand in eyes', effects: [{ type: 'debuff', stat: 'damage', value: -5, duration: 2, chance: 40 }] },
      { id: 'desperate_strike', name: 'Desperate Strike', type: 'melee', damage: 18, cost: 20, description: 'A reckless powerful attack' }
    ],
    baseXP: 25,
    baseGold: 15,
    possibleLoot: [
      { name: 'Iron Sword', type: 'weapon', description: 'A common iron sword', quantity: 1, dropChance: 20, damage: 8, slot: 'weapon' },
      { name: 'Iron Dagger', type: 'weapon', description: 'A simple iron dagger', quantity: 1, dropChance: 25, damage: 5, slot: 'weapon' },
      { name: 'Leather Armor', type: 'apparel', description: 'Basic leather armor', quantity: 1, dropChance: 15, armor: 12, slot: 'chest' },
      { name: 'Fur Boots', type: 'apparel', description: 'Worn fur boots', quantity: 1, dropChance: 20, armor: 3, slot: 'feet' },
      { name: 'Lockpick', type: 'misc', description: 'A lockpick', quantity: 2, dropChance: 35 },
      { name: 'Ale', type: 'drink', description: 'Cheap ale', quantity: 1, dropChance: 40 },
      { name: 'Bread', type: 'food', description: 'Stale bread', quantity: 1, dropChance: 30 }
    ]
  },
  wolf: {
    baseName: 'Wolf',
    type: 'beast',
    baseLevel: 3,
    baseHealth: 30,
    baseArmor: 5,
    baseDamage: 10,
    behaviors: ['aggressive', 'berserker'],
    possibleAbilities: [
      { id: 'bite', name: 'Bite', type: 'melee', damage: 10, cost: 5, description: 'A vicious bite' },
      { id: 'pounce', name: 'Pounce', type: 'melee', damage: 15, cost: 15, description: 'Leap and attack', effects: [{ type: 'stun', value: 1, duration: 1, chance: 15 }] },
      { id: 'savage_bite', name: 'Savage Bite', type: 'melee', damage: 14, cost: 12, description: 'A tearing bite', effects: [{ type: 'dot', stat: 'health', value: 2, duration: 2, chance: 30 }] },
      { id: 'howl', name: 'Howl', type: 'melee', damage: 0, cost: 10, description: 'A terrifying howl', effects: [{ type: 'debuff', stat: 'damage', value: -3, duration: 2, chance: 25 }] }
    ],
    baseXP: 15,
    possibleLoot: [
      { name: 'Wolf Pelt', type: 'misc', description: 'A wolf pelt', quantity: 1, dropChance: 80 },
      { name: 'Raw Meat', type: 'food', description: 'Raw wolf meat', quantity: 1, dropChance: 60 },
      { name: 'Wolf Fang', type: 'ingredient', description: 'A sharp wolf fang', quantity: 1, dropChance: 40 }
    ]
  },
  skeleton: {
    baseName: 'Skeleton',
    type: 'undead',
    baseLevel: 6,
    baseHealth: 40,
    baseArmor: 20,
    baseDamage: 14,
    behaviors: ['defensive', 'tactical'],
    weaknesses: ['fire', 'blunt'],
    resistances: ['frost', 'poison'],
    possibleAbilities: [
      { id: 'bone_strike', name: 'Bone Strike', type: 'melee', damage: 14, cost: 10, description: 'Strike with bony limbs' },
      { id: 'bone_claw', name: 'Bone Claw', type: 'melee', damage: 12, cost: 8, description: 'Slash with sharp bone claws' },
      { id: 'rattle', name: 'Bone Rattle', type: 'melee', damage: 0, cost: 5, description: 'An unsettling rattle', effects: [{ type: 'debuff', stat: 'damage', value: -4, duration: 1, chance: 35 }] },
      { id: 'bone_throw', name: 'Bone Throw', type: 'ranged', damage: 8, cost: 6, description: 'Throw a bone shard' }
    ],
    baseXP: 30,
    possibleLoot: [
      { name: 'Bone Meal', type: 'ingredient', description: 'Ground bones', quantity: 1, dropChance: 70 },
      { name: 'Ancient Coin', type: 'misc', description: 'An old coin from a past era', quantity: 1, dropChance: 25 },
      { name: 'Tattered Cloth', type: 'misc', description: 'Rotting burial cloth', quantity: 1, dropChance: 40 }
    ]
  },
  draugr: {
    baseName: 'Draugr',
    type: 'undead',
    baseLevel: 8,
    baseHealth: 70,
    baseArmor: 30,
    baseDamage: 18,
    behaviors: ['tactical', 'defensive', 'aggressive'],
    weaknesses: ['fire'],
    resistances: ['frost'],
    possibleAbilities: [
      { id: 'ancient_blade', name: 'Ancient Blade', type: 'melee', damage: 18, cost: 15, description: 'Strike with an ancient Nord weapon' },
      { id: 'frost_breath', name: 'Frost Breath', type: 'magic', damage: 20, cost: 20, description: 'Breathe frost', effects: [{ type: 'debuff', stat: 'stamina', value: -15, duration: 2 }] },
      { id: 'disarm_shout', name: 'Disarm Shout', type: 'magic', damage: 5, cost: 25, description: 'A thu\'um that weakens', effects: [{ type: 'debuff', stat: 'damage', value: -8, duration: 2, chance: 50 }] },
      { id: 'shield_wall', name: 'Shield Wall', type: 'melee', damage: 0, cost: 15, description: 'Raise ancient shield', effects: [{ type: 'buff', stat: 'armor', value: 15, duration: 2 }] },
      { id: 'cleave', name: 'Cleave', type: 'melee', damage: 22, cost: 18, description: 'A sweeping axe strike' }
    ],
    baseXP: 50,
    baseGold: 25,
    possibleLoot: [
      { name: 'Ancient Nord Sword', type: 'weapon', description: 'An ancient Nord blade', quantity: 1, dropChance: 25, damage: 12, slot: 'weapon' },
      { name: 'Ancient Nord War Axe', type: 'weapon', description: 'A weathered Nord axe', quantity: 1, dropChance: 20, damage: 14, slot: 'weapon' },
      { name: 'Linen Wrap', type: 'misc', description: 'Burial wrappings', quantity: 2, dropChance: 60 },
      { name: 'Draugr Bones', type: 'ingredient', description: 'Ancient bones', quantity: 1, dropChance: 45 },
      { name: 'Ancient Nord Helmet', type: 'apparel', description: 'A dented Nord helmet', quantity: 1, dropChance: 15, armor: 15, slot: 'head' }
    ]
  },
  frost_spider: {
    baseName: 'Frostbite Spider',
    type: 'beast',
    baseLevel: 7,
    baseHealth: 55,
    baseArmor: 10,
    baseDamage: 16,
    behaviors: ['aggressive', 'tactical'],
    resistances: ['frost'],
    weaknesses: ['fire'],
    possibleAbilities: [
      { id: 'bite', name: 'Venomous Bite', type: 'melee', damage: 16, cost: 10, description: 'A poisonous bite', effects: [{ type: 'dot', stat: 'health', value: 4, duration: 3, chance: 50 }] },
      { id: 'web', name: 'Web Spray', type: 'ranged', damage: 5, cost: 15, description: 'Spray sticky web', effects: [{ type: 'debuff', stat: 'stamina', value: -20, duration: 2 }] },
      { id: 'lunge', name: 'Lunge', type: 'melee', damage: 18, cost: 14, description: 'A sudden lunge attack' },
      { id: 'spit_venom', name: 'Spit Venom', type: 'ranged', damage: 10, cost: 12, description: 'Spit corrosive venom', effects: [{ type: 'dot', stat: 'health', value: 3, duration: 2, chance: 60 }] }
    ],
    baseXP: 35,
    possibleLoot: [
      { name: 'Frostbite Venom', type: 'ingredient', description: 'Potent spider venom', quantity: 1, dropChance: 60 },
      { name: 'Spider Egg', type: 'ingredient', description: 'A spider egg', quantity: 2, dropChance: 40 },
      { name: 'Webbing', type: 'misc', description: 'Strong spider silk', quantity: 1, dropChance: 50 }
    ]
  },
  troll: {
    baseName: 'Troll',
    type: 'beast',
    baseLevel: 14,
    baseHealth: 150,
    baseArmor: 25,
    baseDamage: 30,
    behaviors: ['aggressive', 'berserker'],
    weaknesses: ['fire'],
    possibleAbilities: [
      { id: 'slam', name: 'Slam', type: 'melee', damage: 30, cost: 15, description: 'A powerful slam attack' },
      { id: 'rend', name: 'Rend', type: 'melee', damage: 25, cost: 12, description: 'Tear with claws', effects: [{ type: 'dot', stat: 'health', value: 5, duration: 3, chance: 40 }] },
      { id: 'regenerate', name: 'Regenerate', type: 'melee', damage: 0, cost: 20, description: 'Troll regeneration', effects: [{ type: 'heal', stat: 'health', value: 20 }] },
      { id: 'frenzy', name: 'Frenzy', type: 'melee', damage: 35, cost: 25, description: 'A frenzied assault', cooldown: 2 }
    ],
    baseXP: 100,
    possibleLoot: [
      { name: 'Troll Fat', type: 'ingredient', description: 'Greasy troll fat', quantity: 1, dropChance: 80 },
      { name: 'Troll Skull', type: 'misc', description: 'A massive troll skull', quantity: 1, dropChance: 30 }
    ]
  },
  bear: {
    baseName: 'Bear',
    type: 'beast',
    baseLevel: 10,
    baseHealth: 100,
    baseArmor: 20,
    baseDamage: 25,
    behaviors: ['aggressive', 'berserker', 'defensive'],
    possibleAbilities: [
      { id: 'swipe', name: 'Swipe', type: 'melee', damage: 25, cost: 12, description: 'A powerful claw swipe' },
      { id: 'maul', name: 'Maul', type: 'melee', damage: 35, cost: 20, description: 'A devastating maul attack', effects: [{ type: 'dot', stat: 'health', value: 4, duration: 2, chance: 35 }] },
      { id: 'roar', name: 'Roar', type: 'melee', damage: 0, cost: 10, description: 'A terrifying roar', effects: [{ type: 'debuff', stat: 'stamina', value: -15, duration: 2, chance: 50 }] },
      { id: 'charge', name: 'Charge', type: 'melee', damage: 30, cost: 18, description: 'A charging attack', effects: [{ type: 'stun', value: 1, duration: 1, chance: 30 }] }
    ],
    baseXP: 70,
    possibleLoot: [
      { name: 'Bear Pelt', type: 'misc', description: 'A thick bear pelt', quantity: 1, dropChance: 85 },
      { name: 'Bear Claws', type: 'ingredient', description: 'Sharp bear claws', quantity: 2, dropChance: 60 },
      { name: 'Raw Meat', type: 'food', description: 'Raw bear meat', quantity: 2, dropChance: 70 }
    ]
  },
  sabre_cat: {
    baseName: 'Sabre Cat',
    type: 'beast',
    baseLevel: 12,
    baseHealth: 80,
    baseArmor: 15,
    baseDamage: 28,
    behaviors: ['aggressive', 'tactical'],
    possibleAbilities: [
      { id: 'bite', name: 'Sabre Bite', type: 'melee', damage: 28, cost: 10, description: 'A vicious bite with massive fangs' },
      { id: 'pounce', name: 'Pounce', type: 'melee', damage: 35, cost: 18, description: 'A leaping pounce attack', effects: [{ type: 'stun', value: 1, duration: 1, chance: 25 }] },
      { id: 'claw_swipe', name: 'Claw Swipe', type: 'melee', damage: 24, cost: 12, description: 'Quick claw attack', effects: [{ type: 'dot', stat: 'health', value: 3, duration: 2, chance: 30 }] },
      { id: 'rake', name: 'Rake', type: 'melee', damage: 20, cost: 8, description: 'A raking attack with hind claws' }
    ],
    baseXP: 80,
    possibleLoot: [
      { name: 'Sabre Cat Pelt', type: 'misc', description: 'A prized sabre cat pelt', quantity: 1, dropChance: 85 },
      { name: 'Sabre Cat Tooth', type: 'ingredient', description: 'A massive fang', quantity: 2, dropChance: 70 },
      { name: 'Eye of Sabre Cat', type: 'ingredient', description: 'A cat eye', quantity: 1, dropChance: 40 }
    ]
  },
  vampire: {
    baseName: 'Vampire',
    type: 'undead',
    baseLevel: 15,
    baseHealth: 90,
    baseArmor: 35,
    baseDamage: 25,
    behaviors: ['tactical', 'defensive', 'aggressive'],
    weaknesses: ['fire', 'sunlight'],
    resistances: ['frost', 'poison'],
    possibleAbilities: [
      { id: 'drain_life', name: 'Drain Life', type: 'magic', damage: 25, cost: 20, description: 'Drain the life force', effects: [{ type: 'heal', stat: 'health', value: 15 }] },
      { id: 'vampiric_claw', name: 'Vampiric Claw', type: 'melee', damage: 22, cost: 12, description: 'A clawed strike' },
      { id: 'ice_spike', name: 'Ice Spike', type: 'magic', damage: 28, cost: 25, description: 'A spike of ice', effects: [{ type: 'debuff', stat: 'stamina', value: -10, duration: 2 }] },
      { id: 'invisibility', name: 'Cloak of Shadows', type: 'magic', damage: 0, cost: 30, description: 'Become harder to hit', effects: [{ type: 'buff', stat: 'armor', value: 25, duration: 2 }] },
      { id: 'raise_zombie', name: 'Raise Zombie', type: 'magic', damage: 0, cost: 35, description: 'Summon undead aid', effects: [{ type: 'buff', stat: 'damage', value: 10, duration: 3 }] }
    ],
    baseXP: 120,
    baseGold: 50,
    possibleLoot: [
      { name: 'Vampire Dust', type: 'ingredient', description: 'Ashes of the undead', quantity: 1, dropChance: 90 },
      { name: 'Soul Gem (Petty)', type: 'misc', description: 'A small soul gem', quantity: 1, dropChance: 35 },
      { name: 'Vampire Robes', type: 'apparel', description: 'Dark enchanted robes', quantity: 1, dropChance: 25, armor: 20, slot: 'chest' },
      { name: 'Health Potion', type: 'potion', description: 'Restores health', quantity: 1, dropChance: 40 }
    ]
  },
  mage: {
    baseName: 'Hostile Mage',
    type: 'humanoid',
    baseLevel: 10,
    baseHealth: 60,
    baseArmor: 10,
    baseDamage: 20,
    behaviors: ['tactical', 'defensive'],
    resistances: ['magic'],
    possibleAbilities: [
      { id: 'firebolt', name: 'Firebolt', type: 'magic', damage: 25, cost: 20, description: 'A bolt of fire' },
      { id: 'ice_spike', name: 'Ice Spike', type: 'magic', damage: 22, cost: 18, description: 'A spike of ice' },
      { id: 'lightning', name: 'Lightning Bolt', type: 'magic', damage: 28, cost: 25, description: 'A bolt of lightning', effects: [{ type: 'drain', stat: 'magicka', value: 10 }] },
      { id: 'ward', name: 'Lesser Ward', type: 'magic', damage: 0, cost: 15, description: 'A protective ward', effects: [{ type: 'buff', stat: 'armor', value: 20, duration: 2 }] },
      { id: 'flames', name: 'Flames', type: 'magic', damage: 15, cost: 10, description: 'A stream of fire', effects: [{ type: 'dot', stat: 'health', value: 3, duration: 2, chance: 40 }] }
    ],
    baseXP: 60,
    baseGold: 30,
    possibleLoot: [
      { name: 'Filled Petty Soul Gem', type: 'misc', description: 'A filled soul gem', quantity: 1, dropChance: 45 },
      { name: 'Magicka Potion', type: 'potion', description: 'Restores magicka', quantity: 1, dropChance: 50 },
      { name: 'Mage Robes', type: 'apparel', description: 'Simple mage robes', quantity: 1, dropChance: 30, armor: 8, slot: 'chest' },
      { name: 'Spell Tome', type: 'misc', description: 'A tome of magic', quantity: 1, dropChance: 20 }
    ]
  },
  bandit_chief: {
    baseName: 'Bandit Chief',
    type: 'humanoid',
    baseLevel: 12,
    baseHealth: 120,
    baseArmor: 50,
    baseDamage: 25,
    behaviors: ['tactical', 'aggressive'],
    isBoss: true,
    possibleAbilities: [
      { id: 'heavy_strike', name: 'Heavy Strike', type: 'melee', damage: 25, cost: 15, description: 'A powerful two-handed strike' },
      { id: 'rally', name: 'Rally Cry', type: 'melee', damage: 0, cost: 20, description: 'Boost attack power', effects: [{ type: 'buff', stat: 'damage', value: 10, duration: 3 }] },
      { id: 'execute', name: 'Execution', type: 'melee', damage: 40, cost: 30, description: 'A devastating finishing blow', cooldown: 3 },
      { id: 'intimidate', name: 'Intimidate', type: 'melee', damage: 0, cost: 15, description: 'A terrifying shout', effects: [{ type: 'debuff', stat: 'damage', value: -8, duration: 2, chance: 60 }] },
      { id: 'cleave', name: 'Cleave', type: 'melee', damage: 30, cost: 20, description: 'A sweeping attack' }
    ],
    baseXP: 150,
    baseGold: 100,
    possibleLoot: [
      { name: 'Steel Greatsword', type: 'weapon', description: 'A well-made steel greatsword', quantity: 1, dropChance: 50, damage: 18, slot: 'weapon' },
      { name: 'Steel Armor', type: 'apparel', description: 'Heavy steel armor', quantity: 1, dropChance: 40, armor: 35, slot: 'chest' },
      { name: 'Bandit Chief\'s Key', type: 'key', description: 'Opens the chief\'s treasure chest', quantity: 1, dropChance: 100 },
      { name: 'Potion of Ultimate Healing', type: 'potion', description: 'Restores a lot of health', quantity: 1, dropChance: 60 }
    ]
  }
};

// Legacy export for backwards compatibility
export const ENEMY_TEMPLATES: Record<string, Omit<CombatEnemy, 'id'>> = Object.fromEntries(
  Object.entries(BASE_ENEMY_TEMPLATES).map(([key, template]) => [
    key,
    {
      name: template.baseName,
      type: template.type,
      level: template.baseLevel,
      maxHealth: template.baseHealth,
      currentHealth: template.baseHealth,
      armor: template.baseArmor,
      damage: template.baseDamage,
      behavior: template.behaviors[0],
      weaknesses: template.weaknesses,
      resistances: template.resistances,
      isBoss: template.isBoss,
      abilities: template.possibleAbilities.slice(0, 3),
      xpReward: template.baseXP,
      goldReward: template.baseGold,
      loot: template.possibleLoot.slice(0, 3)
    }
  ])
);

// ============================================================================
// DYNAMIC ENEMY GENERATION
// ============================================================================

/**
 * Generate a unique enemy with randomized stats, abilities, and personality
 * Each enemy is different even from the same template!
 */
export const createEnemyFromTemplate = (
  templateId: string, 
  options: {
    nameOverride?: string;
    levelModifier?: number;  // -3 to +5 level adjustment
    isElite?: boolean;       // Elite enemies have better stats
    forceUnique?: boolean;   // Always generate unique name
  } = {}
): CombatEnemy => {
  const template = BASE_ENEMY_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Unknown enemy template: ${templateId}`);
  }

  const { nameOverride, levelModifier = 0, isElite = false, forceUnique = true } = options;
  
  // Generate unique name
  let name = template.baseName;
  if (forceUnique || Math.random() < 0.7) {
    const prefixes = ENEMY_NAME_PREFIXES[templateId] || ENEMY_NAME_PREFIXES.default;
    const prefix = randomChoice(prefixes);
    name = `${prefix} ${template.baseName}`;
  }
  if (nameOverride) name = nameOverride;

  // Calculate level with variation
  const baseLevel = template.baseLevel + levelModifier;
  const level = Math.max(1, randomRange(baseLevel - 1, baseLevel + 2));
  
  // Scale stats based on level difference and add random variation (±15%)
  const levelScale = 1 + (level - template.baseLevel) * 0.1;
  const variance = 0.15; // 15% variance
  
  const maxHealth = Math.max(10, randomVariation(Math.floor(template.baseHealth * levelScale), variance));
  const armor = Math.max(0, randomVariation(Math.floor(template.baseArmor * levelScale), variance));
  const damage = Math.max(5, randomVariation(Math.floor(template.baseDamage * levelScale), variance));
  
  // Elite enemies get significant boost
  const eliteMultiplier = isElite ? 1.5 : 1;
  const finalHealth = Math.floor(maxHealth * eliteMultiplier);
  const finalArmor = Math.floor(armor * eliteMultiplier);
  const finalDamage = Math.floor(damage * eliteMultiplier);

  // Randomly select behavior from available options
  const behavior = randomChoice(template.behaviors);
  
  // Select random subset of abilities (2-4 abilities)
  const numAbilities = randomRange(2, Math.min(4, template.possibleAbilities.length));
  const shuffledAbilities = shuffleArray(template.possibleAbilities);
  const selectedAbilities = shuffledAbilities.slice(0, numAbilities).map(ability => ({
    ...ability,
    // Scale ability damage with level
    damage: Math.max(1, Math.floor(ability.damage * levelScale * (isElite ? 1.2 : 1))),
    // Unique ID for this instance
    id: `${ability.id}_${Math.random().toString(36).substr(2, 5)}`
  }));

  // Calculate rewards with variation
  const xpReward = Math.floor(randomVariation(template.baseXP * levelScale, 0.2) * (isElite ? 2 : 1));
  const goldReward = template.baseGold 
    ? Math.floor(randomVariation(template.baseGold * levelScale, 0.3) * (isElite ? 2.5 : 1))
    : undefined;

  // Select random loot (with slight drop chance variation)
  const loot = template.possibleLoot.map(item => ({
    ...item,
    dropChance: Math.min(100, item.dropChance + randomRange(-10, 15))
  }));

  // Generate personality trait for narrative variety
  const personality = randomChoice(ENEMY_PERSONALITY_TRAITS);

  return {
    id: `${templateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: isElite ? `${name} (Elite)` : name,
    type: template.type,
    level,
    maxHealth: finalHealth,
    currentHealth: finalHealth,
    maxMagicka: template.type === 'undead' || templateId === 'mage' || templateId === 'vampire' ? 50 + level * 5 : undefined,
    currentMagicka: template.type === 'undead' || templateId === 'mage' || templateId === 'vampire' ? 50 + level * 5 : undefined,
    maxStamina: 50 + level * 3,
    currentStamina: 50 + level * 3,
    armor: finalArmor,
    damage: finalDamage,
    behavior,
    weaknesses: template.weaknesses,
    resistances: template.resistances,
    abilities: selectedAbilities,
    isBoss: template.isBoss || isElite,
    xpReward,
    goldReward,
    loot,
    activeEffects: [],
    // Store personality for narrative use
    description: `A ${personality} ${template.baseName.toLowerCase()}`
  };
};

/**
 * Generate a group of enemies with variety
 * Useful for creating enemy parties/encounters
 */
export const generateEnemyGroup = (
  templateId: string,
  count: number,
  options: {
    includeElite?: boolean;    // Include one elite enemy?
    levelVariance?: number;    // Level spread within group
    uniqueNames?: boolean;     // Ensure unique names
  } = {}
): CombatEnemy[] => {
  const { includeElite = false, levelVariance = 2, uniqueNames = true } = options;
  const usedNames = new Set<string>();
  const enemies: CombatEnemy[] = [];

  for (let i = 0; i < count; i++) {
    const isThisElite = includeElite && i === 0; // First enemy is elite if requested
    const levelMod = randomRange(-levelVariance, levelVariance);
    
    let enemy: CombatEnemy;
    let attempts = 0;
    do {
      enemy = createEnemyFromTemplate(templateId, {
        levelModifier: levelMod,
        isElite: isThisElite,
        forceUnique: uniqueNames
      });
      attempts++;
    } while (uniqueNames && usedNames.has(enemy.name) && attempts < 10);
    
    usedNames.add(enemy.name);
    enemies.push(enemy);
  }

  return enemies;
};

/**
 * Generate a mixed enemy encounter (e.g., bandits with a chief)
 */
export const generateMixedEncounter = (
  mainType: string,
  mainCount: number,
  leaderType?: string
): CombatEnemy[] => {
  const enemies = generateEnemyGroup(mainType, mainCount, { uniqueNames: true });
  
  if (leaderType) {
    const leader = createEnemyFromTemplate(leaderType, { isElite: true });
    enemies.push(leader);
  }
  
  return enemies;
};
