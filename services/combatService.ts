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
import { PERK_DEFINITIONS } from '../data/perkDefinitions';

// ============================================================================
// COMBAT PERK SYSTEM - Perk effects in combat
// ============================================================================

/**
 * Get the total bonus for a specific combat perk effect key.
 * Sums up all ranks * effect amount for perks with matching effect key.
 */
export const getCombatPerkBonus = (character: Character | undefined, effectKey: string): number => {
  if (!character || !character.perks) return 0;
  
  let totalBonus = 0;
  for (const perk of character.perks) {
    const def = PERK_DEFINITIONS.find(d => d.id === perk.id);
    if (def && def.effect && def.effect.type === 'combat' && def.effect.key === effectKey) {
      const rank = perk.rank || 1;
      totalBonus += def.effect.amount * rank;
    }
  }
  return totalBonus;
};

/**
 * Check if a character has a specific perk (by id) with at least 1 rank.
 */
export const hasPerk = (character: Character | undefined, perkId: string): boolean => {
  if (!character || !character.perks) return false;
  return character.perks.some(p => p.id === perkId && (p.rank || 0) >= 1);
};

/**
 * Get the rank of a specific perk (0 if not owned).
 */
export const getPerkRank = (character: Character | undefined, perkId: string): number => {
  if (!character || !character.perks) return 0;
  const perk = character.perks.find(p => p.id === perkId);
  return perk?.rank || 0;
};

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

// Adjust ability costs based on character level and relevant skills
const adjustAbilityCost = (character: Character | undefined, ability: CombatAbility): number => {
  const base = Math.max(1, Math.floor(ability.cost || 0));
  if (!character) return base;
  const lvlFactor = 1 + (character.level || 1) * 0.01; // slightly increase cost with level (scale)
  // Skill reductions
  const getSkill = (name: string) => character.skills.find(s => s.name === name)?.level || 0;
  let skillReduction = 0;
  if (ability.type === 'magic') skillReduction = (getSkill('Destruction') || 0) * 0.005; // each 1 skill -> 0.5% cost reduction
  if (ability.type === 'melee') skillReduction = (getSkill('One-Handed') || getSkill('Two-Handed')) * 0.003; // minor reduction
  const adjusted = Math.max(1, Math.floor(base * lvlFactor * Math.max(0.6, 1 - skillReduction)));
  return adjusted;
};

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
  // Only consider items actually equipped by the player (not companions)
  const equippedItems = validatedEquipment.filter(item => item.equipped && (!item.equippedBy || item.equippedBy === 'player'));
  
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
    (character.skills || []).find(s => s.name === name)?.level || 15;

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

  // ============================================================================
  // SURVIVAL NEEDS PENALTIES (GAME_SYSTEM_CHANGES)
  // Needs are stored on a 0-100 scale.
  // ============================================================================
  try {
    const needs: any = (character as any).needs || {};
    const hunger = Math.max(0, Math.min(100, Number(needs.hunger || 0)));
    const thirst = Math.max(0, Math.min(100, Number(needs.thirst || 0)));
    const fatigue = Math.max(0, Math.min(100, Number(needs.fatigue || 0)));

    // Archetype enforcement (GAME_SYSTEM_CHANGES #9): endurance-focused builds
    // delay penalties slightly, but never remove them.
    const archetype = String((character as any).archetype || '').toLowerCase();
    const enduranceFocused = archetype.includes('warrior') || archetype.includes('paladin');
    const thresholdOffset = enduranceFocused ? 10 : 0;
    const mildThreshold = Math.min(95, 60 + thresholdOffset);
    const severeThreshold = Math.min(98, 80 + thresholdOffset);

    // Mild penalties at 60+, severe at 80+, critical at 100.
    const applyTiered = (value: number, mild: number, severe: number, critical: number) => {
      if (value >= 100) return critical;
      if (value >= severeThreshold) return severe;
      if (value >= mildThreshold) return mild;
      return 0;
    };

    const combatPenalty =
      applyTiered(hunger, 0.05, 0.15, 0.35) +
      applyTiered(thirst, 0.03, 0.10, 0.25) +
      applyTiered(fatigue, 0.07, 0.20, 0.45);

    const dodgePenalty =
      (hunger >= mildThreshold ? 5 : 0) +
      (fatigue >= mildThreshold ? 8 : 0) +
      (fatigue >= severeThreshold ? 8 : 0);

    const critPenalty = thirst >= severeThreshold ? 2 : thirst >= mildThreshold ? 1 : 0;

    // Apply penalties (clamped).
    weaponDamage = Math.max(1, Math.floor(weaponDamage * Math.max(0.4, 1 - combatPenalty)));
    dodgeChance = Math.max(0, dodgeChance - dodgePenalty);
    critChance = Math.max(0, critChance - critPenalty);
    magicResist = Math.max(0, magicResist - (thirst >= severeThreshold ? 5 : 0));
  } catch (e) {
    // Needs are optional; ignore errors.
  }

  // === COMBAT PERK BONUSES ===
  
  // Armor rating perks (light armor vs heavy armor - check which type is equipped)
  const hasLightArmor = equippedItems.some(i => i.type === 'apparel' && (i.name?.toLowerCase().includes('leather') || i.name?.toLowerCase().includes('hide') || i.name?.toLowerCase().includes('scale') || i.name?.toLowerCase().includes('glass') || i.name?.toLowerCase().includes('elven')));
  const hasHeavyArmor = equippedItems.some(i => i.type === 'apparel' && (i.name?.toLowerCase().includes('iron') || i.name?.toLowerCase().includes('steel') || i.name?.toLowerCase().includes('orcish') || i.name?.toLowerCase().includes('daedric') || i.name?.toLowerCase().includes('dwarven') || i.name?.toLowerCase().includes('ebony') || i.name?.toLowerCase().includes('plate')));
  
  const lightArmorBonus = getCombatPerkBonus(character, 'lightArmorRating');
  const heavyArmorBonus = getCombatPerkBonus(character, 'heavyArmorRating');
  const lightArmorSetBonus = getCombatPerkBonus(character, 'lightArmorSetBonus');
  const heavyArmorSetBonus = getCombatPerkBonus(character, 'heavyArmorSetBonus');
  
  if (hasLightArmor && lightArmorBonus > 0) {
    armor = Math.floor(armor * (1 + lightArmorBonus / 100));
  }
  if (hasHeavyArmor && heavyArmorBonus > 0) {
    armor = Math.floor(armor * (1 + heavyArmorBonus / 100));
  }
  // Set bonuses (simplified - assume matched if wearing 3+ armor pieces of same type)
  const armorPieceCount = equippedItems.filter(i => i.type === 'apparel' && ['head', 'chest', 'hands', 'feet'].includes(i.slot || '')).length;
  if (armorPieceCount >= 3) {
    if (hasLightArmor && lightArmorSetBonus > 0) {
      armor = Math.floor(armor * (1 + lightArmorSetBonus / 100));
    }
    if (hasHeavyArmor && heavyArmorSetBonus > 0) {
      armor = Math.floor(armor * (1 + heavyArmorSetBonus / 100));
    }
  }
  
  // Dodge chance from perks (Deft Movement - light armor)
  const dodgeBonus = getCombatPerkBonus(character, 'dodgeChance');
  if (hasLightArmor && dodgeBonus > 0) {
    dodgeChance += dodgeBonus;
  }
  
  // Weapon damage perks - detect weapon type
  const weaponName = mainWeapon?.name?.toLowerCase() || '';
  const isOneHanded = weaponName.includes('sword') || weaponName.includes('axe') || weaponName.includes('mace') || weaponName.includes('dagger') || weaponName.includes('war axe');
  const isTwoHanded = weaponName.includes('greatsword') || weaponName.includes('battleaxe') || weaponName.includes('warhammer');
  const isBow = weaponName.includes('bow');
  const isDualWielding = !!offhandItem && offhandItem.type === 'weapon';
  
  // One-handed damage bonus (Armsman perk)
  if (isOneHanded) {
    const oneHandedBonus = getCombatPerkBonus(character, 'oneHandedDamage');
    if (oneHandedBonus > 0) {
      weaponDamage = Math.floor(weaponDamage * (1 + oneHandedBonus / 100));
    }
  }
  
  // Two-handed damage bonus (Barbarian perk)
  if (isTwoHanded) {
    const twoHandedBonus = getCombatPerkBonus(character, 'twoHandedDamage');
    if (twoHandedBonus > 0) {
      weaponDamage = Math.floor(weaponDamage * (1 + twoHandedBonus / 100));
    }
  }
  
  // Bow damage bonus (Overdraw perk)
  if (isBow) {
    const bowBonus = getCombatPerkBonus(character, 'bowDamage');
    if (bowBonus > 0) {
      weaponDamage = Math.floor(weaponDamage * (1 + bowBonus / 100));
    }
    // Bow crit chance (Eagle Eye perk)
    const bowCritBonus = getCombatPerkBonus(character, 'bowCritChance');
    if (bowCritBonus > 0) {
      critChance += bowCritBonus;
    }
  }

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
    // Regen system: Calculate based on level and perks
    // Characters below level 10 get free passive regen
    // Characters level 10+ need to unlock regen via perks
    ...calculateRegenRates(character)
  };
};

// Calculate regeneration rates based on level and perks
// Under level 10: free passive regen for all stats
// Level 10+: regen only available via perks
const calculateRegenRates = (character: Character): { regenHealthPerSec: number; regenMagickaPerSec: number; regenStaminaPerSec: number } => {
  const level = character.level || 1;
  const perks = character.perks || [];
  
  // Check for regen perks
  const hasHealthRegen = perks.some(p => p.id === 'health_regen' || p.name === 'Health Regeneration');
  const hasMagickaRegen = perks.some(p => p.id === 'magicka_regen' || p.name === 'Magicka Regeneration');
  const hasStaminaRegen = perks.some(p => p.id === 'stamina_regen' || p.name === 'Stamina Regeneration');
  
  // Get perk ranks for scaling
  const healthRegenPerk = perks.find(p => p.id === 'health_regen' || p.name === 'Health Regeneration');
  const magickaRegenPerk = perks.find(p => p.id === 'magicka_regen' || p.name === 'Magicka Regeneration');
  const staminaRegenPerk = perks.find(p => p.id === 'stamina_regen' || p.name === 'Stamina Regeneration');
  
  // Base regen rates (per second, applied per turn which is ~4s)
  const BASE_HEALTH_REGEN = 0.5;   // ~2 health per turn
  const BASE_MAGICKA_REGEN = 0.75; // ~3 magicka per turn
  const BASE_STAMINA_REGEN = 0.5;  // ~2 stamina per turn
  
  // Under level 10: free passive regen
  if (level < 10) {
    return {
      regenHealthPerSec: BASE_HEALTH_REGEN,
      regenMagickaPerSec: BASE_MAGICKA_REGEN,
      regenStaminaPerSec: BASE_STAMINA_REGEN
    };
  }
  
  // Level 10+: regen only from perks, with scaling per rank
  const perkMultiplier = 1.25; // Each perk rank increases regen by 25%
  
  return {
    regenHealthPerSec: hasHealthRegen ? BASE_HEALTH_REGEN * (1 + ((healthRegenPerk?.rank || 1) - 1) * (perkMultiplier - 1)) : 0,
    regenMagickaPerSec: hasMagickaRegen ? BASE_MAGICKA_REGEN * (1 + ((magickaRegenPerk?.rank || 1) - 1) * (perkMultiplier - 1)) : 0,
    regenStaminaPerSec: hasStaminaRegen ? BASE_STAMINA_REGEN * (1 + ((staminaRegenPerk?.rank || 1) - 1) * (perkMultiplier - 1)) : 0
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
    (character.skills || []).find(s => s.name === name)?.level || 15;

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
  surrenderAllowed: boolean = false,
  companions?: any[]
): CombatState => {
  // Initialize enemies with IDs and full health
  const initializedEnemies = enemies.map((enemy, index) => ({
    ...enemy,
    id: enemy.id || `enemy_${index}_${Date.now()}`,
    currentHealth: enemy.maxHealth,
    currentMagicka: enemy.maxMagicka,
    currentStamina: enemy.maxStamina,
    activeEffects: [],
    health_state: enemy.health_state || 'healthy',
    morale_state: enemy.morale_state || 'steady',
    combat_state: enemy.combat_state || 'still_hostile',
    // Health regeneration is no longer applied passively; regenerated health mechanics were removed intentionally.
    // Ensure rewards and loot exist to avoid empty loot phases
    xpReward: typeof enemy.xpReward === 'number' ? enemy.xpReward : computeEnemyXP(enemy as CombatEnemy),
    goldReward: typeof enemy.goldReward === 'number' ? enemy.goldReward : randomRange(Math.max(1, (enemy.level || 1) * 5), Math.max(5, (enemy.level || 1) * 12)),
    loot: Array.isArray(enemy.loot) && enemy.loot.length ? enemy.loot : (BASE_ENEMY_TEMPLATES[(enemy.type || '').toLowerCase()]?.possibleLoot || enemy.loot || [])
  }));

  // If companions are provided, include companions as allied combatants when their behavior indicates participation
  // Filter out invalid companions (must have id, name, and be active - behavior of 'follow' or 'guard')
  const validCompanions = (companions || []).filter(c => 
    c && 
    c.id && 
    c.name && 
    (c.behavior === 'follow' || c.behavior === 'guard') &&
    (c.health > 0 || c.maxHealth > 0) // must be alive
  );
  
  const companionAllies: CombatEnemy[] = validCompanions.map((c, idx) => ({
    id: `ally_${c.id}_${Date.now()}_${idx}`,
    name: c.name,
    type: 'humanoid',
    level: c.level || 1,
    maxHealth: c.maxHealth || c.health || 50,
    currentHealth: c.maxHealth || c.health || 50,
    armor: c.armor || 0,
    damage: c.damage || 4,
    abilities: [{ id: `comp_attack_${c.id}`, name: `Strike (${c.name})`, type: 'melee', damage: c.damage || 4, cost: 0, description: 'Companion attack' }],
    behavior: 'support',
    isCompanion: true,
    xpReward: 0,
    // Keep a reference to original companion so we can access autoLoot later
    companionMeta: { companionId: c.id, autoLoot: !!c.autoLoot, autoControl: c.autoControl !== false }
  }));

  // Calculate turn order (player first unless ambushed)
  const turnOrder = ambush 
    ? [...initializedEnemies.map(e => e.id), 'player']
    : ['player', ...initializedEnemies.map(e => e.id)];

  // Insert companions at the end of turn order so they act after player and enemies typically
  const finalTurnOrder = [...turnOrder, ...companionAllies.map(c => c.id)];

  // Keep enemies and allies separate
  const allEnemies = [...initializedEnemies];

  return {
    id: `combat_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    active: true,
    // Mark combat start time for duration-based effects
    combatStartTime: Date.now(),
    turn: 1,
    currentTurnActor: finalTurnOrder[0],
    turnOrder: finalTurnOrder,
    enemies: allEnemies,
    allies: companionAllies,
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
  natRoll?: number,
  character?: Character
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
      // Adjust cost by level/skills
      const effectiveCost = adjustAbilityCost(character, ability);
      if (ability.type === 'magic') {
        const availableMagicka = newPlayerStats.currentMagicka || 0;
        // Spend as much magicka as available up to the effective cost. If none available, cast at base damage.
        const magickaSpent = Math.max(0, Math.min(availableMagicka, effectiveCost));
        if (magickaSpent > 0) {
          newPlayerStats.currentMagicka = Math.max(0, availableMagicka - magickaSpent);
        }
        // Attach magickaSpent to ability so damage scaling can use it later
        (ability as any).__magickaSpent = magickaSpent;
      } else {
        const available = newPlayerStats.currentStamina || 0;
        if (available <= 0) {
          // No stamina: allow a weak attack
          staminaMultiplier = 0.25;
        } else if (available < effectiveCost) {
          // Partial stamina: scale effectiveness proportionally but keep a floor
          staminaMultiplier = Math.max(0.25, available / effectiveCost);
        }
        // Consume what stamina is available (don't force negative)
        newPlayerStats.currentStamina = Math.max(0, newPlayerStats.currentStamina - Math.min(effectiveCost, available));
        if (staminaMultiplier < 1) {
          narrative = `Low stamina reduces the effectiveness of ${ability.name}.`;
        }
      }

      // Find target (search enemies first, then allies)
      const targetById = targetId ? (newState.enemies.find(e => e.id === targetId) || (newState.allies || []).find(a => a.id === targetId)) : null;
      const defaultTarget = newState.enemies.find(e => e.currentHealth > 0);
      const target = targetById || defaultTarget;
      const targetIsAlly = target ? ((newState.allies || []).find(a => a.id === target.id) !== undefined) : false;

      if (!target) {
        narrative = 'No valid target!';
        break;
      }

      // Disallow targeting allies with damaging abilities
      const isHealingAbility = !!(ability.heal || (ability.effects && ability.effects.some((ef: any) => ef.type === 'heal')));
      if (targetIsAlly && !isHealingAbility) {
        narrative = `${ability.name} cannot be used on allies!`;
        newState.combatLog.push({ turn: newState.turn, actor: 'player', action: ability.name, target: target.name, damage: 0, narrative, timestamp: Date.now() });
        break;
      }

      // Prevent acting on defeated targets
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
      const attackerLvl = character?.level || playerStats.maxHealth ? Math.max(1, Math.floor((character?.level || 10))) : 10;
      let attackResolved = resolveAttack({ attackerLevel: attackerLvl, attackBonus, targetArmor: target.armor, targetDodge: (target as any).dodgeChance || 0, critChance: playerStats.critChance, natRoll });

      // If nat indicates miss/fail, check for reroll perk (one-time auto-reroll on failure or miss)
      if (!attackResolved.hit && (attackResolved.rollTier === 'fail' || attackResolved.rollTier === 'miss')) {
        const hasRerollPerk = !!(character && (character.perks || []).find((p: any) => p.id === 'reroll_on_failure' && (p.rank || 0) > 0));
        const rollText = attackResolved.rollTier === 'fail' ? 'critical failure' : 'miss';
        if (hasRerollPerk) {
          // Reroll once automatically
          const second = resolveAttack({ attackerLevel: attackerLvl, attackBonus, targetArmor: target.armor, targetDodge: (target as any).dodgeChance || 0, critChance: playerStats.critChance });
          // Log both rolls (first failed/missed, second result)
          newState.combatLog.push({ turn: newState.turn, actor: 'player', action: ability.name, target: target.name, damage: 0, isCrit: false, nat: attackResolved.natRoll, rollTier: attackResolved.rollTier, narrative: `First roll ${attackResolved.natRoll} (${rollText}) - rerolling...`, timestamp: Date.now() });
          attackResolved = second;
        } else {
          narrative = `You roll ${attackResolved.natRoll} (${rollText}) and ${ability.name} against ${target.name} fails to connect.`;
          newState.combatLog.push({ turn: newState.turn, actor: 'player', action: ability.name, target: target.name, damage: 0, isCrit: false, nat: attackResolved.natRoll, rollTier: attackResolved.rollTier, narrative, timestamp: Date.now() });
          break;
        }
      }

      // Determine damage tier multipliers based on rollTier
      const tierMultipliers: Record<string, number> = { low: 0.6, mid: 1.0, high: 1.25, crit: 1.75 };
      // For magic abilities, allow damage to scale with magicka spent and player level.
      let abilityDamage = ability.damage || 0;
      if (ability.type === 'magic') {
        const magSpent = (ability as any).__magickaSpent || 0;
        const playerLevel = character?.level || 1;
        // Per-level multiplier (small incremental growth)
        const levelMultiplier = 1 + Math.max(0, (playerLevel - 1)) * 0.03; // 3% per level
        if (magSpent <= 0) {
          // No magicka: apply base damage only (do not apply level multiplier)
          abilityDamage = ability.damage || 0;
        } else {
          const ratio = effectiveCost > 0 ? (magSpent / effectiveCost) : 1;
          abilityDamage = Math.max(1, Math.floor((ability.damage || 0) * levelMultiplier * ratio));
        }
      }
      const baseDamage = abilityDamage + Math.floor(playerStats.weaponDamage * (ability.type === 'melee' ? 0.5 : 0));
      const tierMult = tierMultipliers[attackResolved.rollTier] ?? 1;
      const scaledBase = Math.max(1, Math.floor(baseDamage * staminaMultiplier * tierMult));
      const { damage, hitLocation } = computeDamageFromNat(scaledBase, 12, attackResolved.natRoll, attackResolved.rollTier, attackResolved.isCrit);

      // === COMBAT PERK EFFECTS ===
      let perkDamageMultiplier = 1.0;
      let perkArmorPenetration = 0;
      let perkLifesteal = 0;
      
      // Berserker Rage - bonus damage when below 25% health
      const berserkerBonus = getCombatPerkBonus(character, 'lowHealthDamage');
      const healthPercent = newPlayerStats.currentHealth / newPlayerStats.maxHealth;
      if (berserkerBonus > 0 && healthPercent <= 0.25) {
        perkDamageMultiplier *= (1 + berserkerBonus / 100);
      }
      
      // Executioner - bonus damage vs enemies below 20% health
      const executeBonus = getCombatPerkBonus(character, 'executeDamage');
      const targetHealthPercent = target.currentHealth / target.maxHealth;
      if (executeBonus > 0 && targetHealthPercent <= 0.20) {
        perkDamageMultiplier *= (1 + executeBonus / 100);
      }
      
      // Critical damage bonuses (Bladesman, Deep Wounds)
      if (attackResolved.isCrit) {
        const swordCritBonus = getCombatPerkBonus(character, 'swordCritDamage');
        const greatswordCritBonus = getCombatPerkBonus(character, 'greatswordCritDamage');
        const weaponName = ((character as any)?.equipment?.find((i: any) => i.slot === 'weapon')?.name || '').toLowerCase();
        if (weaponName.includes('sword') && !weaponName.includes('great')) {
          perkDamageMultiplier *= (1 + swordCritBonus / 100);
        }
        if (weaponName.includes('greatsword')) {
          perkDamageMultiplier *= (1 + greatswordCritBonus / 100);
        }
      }
      
      // Armor penetration perks (Bone Breaker, Skull Crusher)
      const maceArmorPen = getCombatPerkBonus(character, 'maceArmorPen');
      const warhammerArmorPen = getCombatPerkBonus(character, 'warhammerArmorPen');
      const equippedWeaponName = ((character as any)?.equipment?.find((i: any) => i.slot === 'weapon')?.name || '').toLowerCase();
      if (equippedWeaponName.includes('mace')) {
        perkArmorPenetration += maceArmorPen;
      }
      if (equippedWeaponName.includes('warhammer')) {
        perkArmorPenetration += warhammerArmorPen;
      }
      
      // Lifesteal (Vampiric Strikes)
      perkLifesteal = getCombatPerkBonus(character, 'lifesteal');

      // Apply armor/resistance reductions (post-roll) with armor penetration
      const effectiveArmor = Math.max(0, target.armor * (1 - perkArmorPenetration / 100));
      const armorReduction = effectiveArmor / (effectiveArmor + 100);
      const finalDamage = Math.max(1, Math.floor(damage * perkDamageMultiplier * (1 - armorReduction)));

      const isCrit = attackResolved.isCrit;
      const resisted = ability.type === 'magic' && target.resistances?.includes('magic');
      const appliedDamage = resisted ? Math.floor(finalDamage * 0.5) : finalDamage;

      // Apply damage to the correct list (enemies or allies)
      let enemyIndex = -1;
      let allyIndex = -1;
      if (targetIsAlly) {
        allyIndex = (newState.allies || []).findIndex(a => a.id === target.id);
        if (allyIndex >= 0) {
          newState.allies = [ ...(newState.allies || []) ];
          newState.allies[allyIndex] = { ...target, currentHealth: Math.max(0, target.currentHealth - appliedDamage) };
        }
      } else {
        enemyIndex = newState.enemies.findIndex(e => e.id === target.id);
        if (enemyIndex >= 0) {
          newState.enemies = [ ...newState.enemies ];
          newState.enemies[enemyIndex] = { ...target, currentHealth: Math.max(0, target.currentHealth - appliedDamage) };
        }
      }

      // Set cooldown
      if (ability.cooldown) {
        newState.abilityCooldowns[ability.id] = ability.cooldown;
      }

      // Build damage narrative
      let damageNarrative = `deals ${appliedDamage} damage to the ${hitLocation}`;
      if (isCrit) damageNarrative = `CRITICAL HIT! ` + damageNarrative;
      if (resisted) damageNarrative += ` (resisted)`;

      narrative = `You use ${ability.name} on ${target.name} and ${damageNarrative}!`;

      // === LIFESTEAL PERK EFFECT ===
      if (perkLifesteal > 0 && ability.type === 'melee' && appliedDamage > 0 && !targetIsAlly) {
        const lifestealAmount = Math.max(1, Math.floor(appliedDamage * perkLifesteal / 100));
        newPlayerStats.currentHealth = Math.min(
          newPlayerStats.maxHealth,
          newPlayerStats.currentHealth + lifestealAmount
        );
        narrative += ` You drain ${lifestealAmount} health.`;
      }
      
      if (enemyIndex >= 0 && newState.enemies[enemyIndex].currentHealth <= 0) {
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
            } else if ((effect as any).type === 'summon') {
              // Create a summoned companion (ally)
              const summonName = (effect as any).name || 'Summoned Ally';
              const summonId = `summon_${summonName.replace(/\s+/g, '_').toLowerCase()}_${Math.random().toString(36).substr(2,6)}`;
              const level = Math.max(1, playerStats.maxHealth ? Math.floor(playerStats.maxHealth / 20) : 1);
              const maxHealth = 30 + (level * 8);
              const companion: CombatEnemy = {
                id: summonId,
                name: summonName,
                type: 'humanoid',
                level,
                maxHealth,
                currentHealth: maxHealth,
                armor: 5,
                damage: 8 + level,
                abilities: [
                  { id: `${summonId}_attack`, name: `${summonName} Attack`, type: 'melee', damage: Math.max(4, Math.floor(level * 2)), cost: 0, description: 'Summoned minion attack' }
                ],
                behavior: 'support',
                xpReward: 0,
                loot: [],
                isCompanion: true,
                description: `A summoned ally: ${summonName}`
              } as any;

              // Add to enemies list but mark as companion so AI treats it as ally
              newState.enemies = [...newState.enemies, companion];
              // Insert into turn order right after player
              const playerIndex = newState.turnOrder.indexOf('player');
              if (playerIndex >= 0) {
                const before = newState.turnOrder.slice(0, playerIndex + 1);
                const after = newState.turnOrder.slice(playerIndex + 1);
                newState.turnOrder = [...before, companion.id, ...after];
              } else {
                newState.turnOrder = [...newState.turnOrder, companion.id];
              }

              // Track pending summon expiration in turns (use effect.duration as turns if supplied)
              const turns = Math.max(1, (effect as any).duration || 3);
              newState.pendingSummons = [...(newState.pendingSummons || []), { companionId: companion.id, turnsRemaining: turns }];

              narrative += ` ${summonName} joins the fight to aid you for ${turns} turns!`;

            } else if (effect.duration) {
              // Add status effect to the target (enemy or ally)
              if (!targetIsAlly && enemyIndex >= 0) {
                newState.enemies[enemyIndex].activeEffects = [
                  ...(newState.enemies[enemyIndex].activeEffects || []),
                  { effect, turnsRemaining: effect.duration }
                ];
              } else if (targetIsAlly && allyIndex >= 0) {
                newState.allies = [ ...(newState.allies || []) ];
                newState.allies[allyIndex] = {
                  ...newState.allies[allyIndex],
                  activeEffects: [
                    ...((newState.allies[allyIndex]?.activeEffects) || []),
                    { effect, turnsRemaining: effect.duration }
                  ]
                } as any;
              }
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
  natRoll?: number,
  character?: Character
): { newState: CombatState; newPlayerStats: PlayerCombatStats; narrative: string } => {
  let newState = { ...state };
  let newPlayerStats = { ...playerStats };
  
  // Find actor (enemy or ally) by id
  const actor = (newState.enemies || []).find(e => e.id === enemyId) || (newState.allies || []).find(a => a.id === enemyId);
  if (!actor || actor.currentHealth <= 0) {
    return { newState, newPlayerStats, narrative: '' };
  }

  // If this is an ally (companion), run ally-support AI which targets enemies rather than player
  const isAlly = !!actor.isCompanion;

  // Process actor status effects (dot and stun). Use a loop so we can early-return on stun, and still decrement durations.
  let isStunned = false;
  if (actor.activeEffects && actor.activeEffects.length > 0) {
    for (const ae of actor.activeEffects) {
      if (ae.effect.type === 'dot') {
        const dotDamage = ae.effect.value;
        actor.currentHealth = Math.max(0, actor.currentHealth - dotDamage);
      } else if (ae.effect.type === 'stun' && ae.turnsRemaining > 0) {
        // Actor is stunned; record it and log
        newState.combatLog.push({
          turn: newState.turn,
          actor: actor.name,
          action: 'stunned',
          narrative: `${actor.name} is stunned and cannot act!`,
          timestamp: Date.now()
        });
        isStunned = true;
      }
    }

    // Decrement effect durations (applies even if stunned)
    actor.activeEffects = actor.activeEffects
      .map(ae => ({ ...ae, turnsRemaining: ae.turnsRemaining - 1 }))
      .filter(ae => ae.turnsRemaining > 0);

    // If stunned, skip the rest of this turn
    if (isStunned) {
      return { newState, newPlayerStats, narrative: `${actor.name} is stunned and skips their turn.` };
    }
  }

  // Choose ability based on behavior
  let chosenAbility: CombatAbility;
  const availableAbilities = actor.abilities.filter(a => {
    // Disallow magic if not enough magicka, but allow melee even with low stamina
    if (a.type === 'magic' && actor.currentMagicka && actor.currentMagicka < a.cost) return false;
    return true;
  });

  const behaviorSource = actor.behavior || 'tactical';
  switch (behaviorSource) {
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
      damage: actor.damage, 
      cost: 0, 
      description: 'Basic attack' 
    };
  }

  // Avoid repeating the exact same ability if other options exist
  newState.lastActorActions = newState.lastActorActions || {};
  const recent = newState.lastActorActions[actor.id] || [];
  if (availableAbilities.length > 1 && recent[0] && chosenAbility && recent.includes(chosenAbility.id)) {
    const alt = availableAbilities.find(a => !recent.includes(a.id));
    if (alt) chosenAbility = alt;
  }


  // Resolve enemy/actor attack via d20 + attack bonus
  const attackBonus = Math.max(0, Math.floor(actor.damage / 8));
  const resolved = resolveAttack({ attackerLevel: actor.level, attackBonus, targetArmor: playerStats.armor, targetDodge: playerStats.dodgeChance, critChance: 10, natRoll });

  // If stamina is low, scale melee damage instead of preventing the attack
  let appliedDamage = 0;
  let hitLocation = 'torso';
  if (!resolved.hit) {
    appliedDamage = 0;
  } else {
    let staminaMultiplier = 1;
    const effectiveCost = adjustAbilityCost(undefined, chosenAbility);
    if (chosenAbility.type === 'melee') {
      const avail = actor.currentStamina || 0;
      if (avail <= 0) staminaMultiplier = 0.25;
      else if (avail < (effectiveCost || 0)) staminaMultiplier = Math.max(0.25, avail / (effectiveCost || 1));
      actor.currentStamina = Math.max(0, (actor.currentStamina || 0) - Math.min(effectiveCost || 0, avail));
    } else if (chosenAbility.type === 'magic') {
      if (actor.currentMagicka && actor.currentMagicka >= (effectiveCost || 0)) {
        actor.currentMagicka = Math.max(0, actor.currentMagicka - (effectiveCost || 0));
      }
    }

    const base = (chosenAbility.damage || actor.damage) * staminaMultiplier;
    const scaledBase = Math.max(1, Math.floor(base));
    const rollRes = computeDamageFromNat(scaledBase, actor.level, resolved.natRoll, resolved.rollTier, resolved.isCrit);
    hitLocation = rollRes.hitLocation;
    // Apply armor reduction
    const armorReduction = playerStats.armor / (playerStats.armor + 100);
    let d = Math.floor(rollRes.damage * (1 - armorReduction));
    if (resolved.isCrit) d = Math.floor(d * 1.25);
    
    // === DAMAGE REDUCTION PERK (Dragon Skin) ===
    const damageReductionPerk = getCombatPerkBonus(character, 'damageReduction');
    if (damageReductionPerk > 0) {
      d = Math.floor(d * (1 - damageReductionPerk / 100));
    }
    
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

  // If this actor is an ally, target a selected enemy and apply damage to them; allies shouldn't damage the player
  if (isAlly) {
    // pick a target enemy (default: first alive)
    const target = (newState.enemies || []).find(e => e.currentHealth > 0);
    if (!target) {
      const noTargetNarrative = `${actor.name} has no valid targets.`;
      newState.combatLog.push({ turn: newState.turn, actor: actor.name, action: 'wait', narrative: noTargetNarrative, timestamp: Date.now() });
      return { newState, newPlayerStats, narrative: noTargetNarrative };
    }

    // Compute damage similarly to enemy attack but against the enemy target
    let narrativeLocal = `${actor.name} uses ${chosenAbility.name}`;
    if (!resolved.hit) {
      narrativeLocal += ` and rolls ${resolved.natRoll} (${resolved.rollTier}), missing ${target.name}.`;
    } else {
      let dmg = appliedDamage;
      // Apply to target
      target.currentHealth = Math.max(0, (target.currentHealth || 0) - dmg);
      narrativeLocal += ` and deals ${dmg} damage to ${target.name}!`;
      if (target.currentHealth <= 0) narrativeLocal += ` ${target.name} is defeated!`;
    }

    newState.combatLog.push({ turn: newState.turn, actor: actor.name, action: chosenAbility.name, target: target.name, damage: resolved.hit ? appliedDamage : 0, narrative: narrativeLocal, isCrit: resolved.isCrit, nat: resolved.natRoll, rollTier: resolved.rollTier, timestamp: Date.now() });

    // If all enemies defeated, mark victory
    const anyAlive = (newState.enemies || []).some(e => e.currentHealth > 0);
    if (!anyAlive) {
      newState.result = 'victory';
      newState.active = false;
    }

    return { newState, newPlayerStats, narrative: narrativeLocal };
  }

  // Allow enemies to target allied companions. Prefer critically-low allies (<30% hp)
  // and make the base chance depend on actor.behavior.
  const aliveAllies = (newState.allies || []).filter(a => a.currentHealth > 0);
  let narrative = '';
  let targetedAlly: any = null;
  if (aliveAllies.length > 0) {
    // Identify critically-low allies (percentage of their maxHealth)
    const criticallyLow = aliveAllies.filter(a => (a.currentHealth || 0) / Math.max(1, a.maxHealth || 1) < 0.30);
    const injuredComparedToPlayer = aliveAllies.filter(a => (a.currentHealth || 0) < playerStats.currentHealth);

    // Base chances by behavior (higher -> more likely to opportunistically target allies)
    const behaviorChanceMap: Record<string, number> = {
      berserker: 0.7,
      aggressive: 0.6,
      tactical: 0.45,
      defensive: 0.25,
      default: 0.35
    };
    const baseChance = behaviorChanceMap[(actor.behavior as string) || 'default'] ?? behaviorChanceMap.default;

    // If there are critically-low allies, increase chance significantly
    if (criticallyLow.length > 0) {
      const critChance = Math.min(0.95, baseChance + 0.35);
      if (Math.random() < critChance) targetedAlly = criticallyLow[Math.floor(Math.random() * criticallyLow.length)];
    }

    // Otherwise, consider allies injured relative to the player with base chance
    if (!targetedAlly && injuredComparedToPlayer.length > 0) {
      if (Math.random() < baseChance) targetedAlly = injuredComparedToPlayer[Math.floor(Math.random() * injuredComparedToPlayer.length)];
    }
  }

  // Scale damage to remain meaningful at high player health and scale with actor level
  const healthScale = Math.max(1, Math.floor((playerStats.maxHealth || 100) / 200));
  const levelScale = 1 + ((actor.level || 1) * 0.02);
  appliedDamage = Math.max(0, Math.floor(appliedDamage * healthScale * levelScale));

  if (targetedAlly) {
    // Apply damage to the chosen ally
    const allyIndex = (newState.allies || []).findIndex(a => a.id === targetedAlly.id);
    if (allyIndex >= 0) {
      newState.allies = [ ...(newState.allies || []) ];
      newState.allies[allyIndex] = { ...targetedAlly, currentHealth: Math.max(0, (targetedAlly.currentHealth || 0) - appliedDamage) } as any;
    }

    if (!resolved.hit) {
      narrative = `${actor.name} uses ${chosenAbility.name} and rolls ${resolved.natRoll} (${resolved.rollTier}), missing ${targetedAlly.name}.`;
    } else if (appliedDamage === 0) {
      narrative = `${actor.name} attacks ${targetedAlly.name} but deals no damage.`;
    } else {
      narrative = `${actor.name} uses ${chosenAbility.name} and deals ${appliedDamage} damage to ${targetedAlly.name}!`;
      if (resolved.isCrit) narrative = `${actor.name} lands a CRITICAL HIT on ${targetedAlly.name} with ${chosenAbility.name} for ${appliedDamage} damage!`;
    }

    // Log and return
    newState.combatLog.push({
      turn: newState.turn,
      actor: actor.name,
      action: chosenAbility.name,
      target: targetedAlly.name,
      damage: appliedDamage,
      isCrit: !!resolved.isCrit,
      nat: resolved.natRoll,
      rollTier: resolved.rollTier,
      narrative,
      timestamp: Date.now()
    });

    // Allies dying does not end combat but log accordingly
    return { newState, newPlayerStats, narrative };
  }

  // Apply damage to player
  newPlayerStats.currentHealth = Math.max(0, newPlayerStats.currentHealth - appliedDamage);

  // === AVOID DEATH PERK - Once per combat, auto-heal when health drops below 10% ===
  const avoidDeathHeal = getCombatPerkBonus(character, 'avoidDeath');
  const avoidDeathUsed = (newState as any).avoidDeathUsed || false;
  const healthPercentAfterDamage = newPlayerStats.currentHealth / newPlayerStats.maxHealth;
  if (avoidDeathHeal > 0 && !avoidDeathUsed && healthPercentAfterDamage < 0.10 && newPlayerStats.currentHealth > 0) {
    newPlayerStats.currentHealth = Math.min(newPlayerStats.maxHealth, newPlayerStats.currentHealth + avoidDeathHeal);
    (newState as any).avoidDeathUsed = true;
    narrative += ` Your Restoration mastery triggers, automatically healing you for ${avoidDeathHeal} health!`;
  }

  // Build narrative
  narrative = `${actor.name} uses ${chosenAbility.name}`;
  if (!resolved.hit) {
    narrative += ` and rolls ${resolved.natRoll} (${resolved.rollTier}), missing you.`;
  } else if (appliedDamage === 0) {
    narrative += ` but you avoid the attack!`;
  } else {
    narrative += ` and deals ${appliedDamage} damage to your ${hitLocation}!`;
    if (resolved.isCrit) narrative = `${actor.name} lands a CRITICAL HIT with ${chosenAbility.name} for ${appliedDamage} damage!`;
  }

  if (newPlayerStats.currentHealth <= 0) {
    narrative += ` You have been defeated...`;
    newState.result = 'defeat';
    newState.active = false;
  }

  // Log
  newState.combatLog.push({
    turn: newState.turn,
    actor: actor.name,
    action: chosenAbility.name,
    target: 'player',
    damage: appliedDamage,
    isCrit: !!resolved.isCrit,
    nat: resolved.natRoll,
    rollTier: resolved.rollTier,
    narrative,
    timestamp: Date.now()
  });

  // Record actor last action
  newState.lastActorActions[actor.id] = [chosenAbility.id, ...(newState.lastActorActions[actor.id] || [])].slice(0, 4);

  return { newState, newPlayerStats, narrative };
};

// Execute a companion/ally action chosen by player (manual control)
export const executeCompanionAction = (
  state: CombatState,
  allyId: string,
  abilityId: string,
  targetId?: string,
  natRoll?: number,
  isAuto?: boolean
): { newState: CombatState; narrative: string } => {
  let newState = { ...state };
  const ally = (newState.allies || []).find(a => a.id === allyId);
  if (!ally) return { newState, narrative: 'Companion not found' };

  const ability = ally.abilities.find(a => a.id === abilityId) || ally.abilities[0];
  if (!ability) return { newState, narrative: `${ally.name} has no usable abilities.` };

  // Pick target (enemy only)
  const target = targetId ? newState.enemies.find(e => e.id === targetId) : newState.enemies.find(e => e.currentHealth > 0);
  if (!target) return { newState, narrative: 'No valid target' };

  // Resolve attack
  const attackBonus = Math.max(0, Math.floor((ally.damage || 4) / 8));
  const resolved = resolveAttack({ attackerLevel: ally.level, attackBonus, targetArmor: target.armor, critChance: 5, natRoll });
  if (!resolved.hit) {
    const narrative = `${ally.name} misses ${target.name} with ${ability.name}.`;
    newState.combatLog.push({ turn: newState.turn, actor: ally.name, action: ability.name, target: target.name, damage: 0, narrative, timestamp: Date.now(), auto: !!isAuto });
    return { newState, narrative };
  }
  // Compute damage
  const { damage } = computeDamageFromNat((ability.damage || ally.damage || 4), ally.level, resolved.natRoll, resolved.rollTier, resolved.isCrit);
  const armorReduction = target.armor / (target.armor + 100);
  const applied = Math.max(1, Math.floor(damage * (1 - armorReduction)));
  const enemyIndex = newState.enemies.findIndex(e => e.id === target.id);
  if (enemyIndex >= 0) {
    newState.enemies = [...newState.enemies];
    newState.enemies[enemyIndex] = { ...target, currentHealth: Math.max(0, target.currentHealth - applied) };
  }

  let narrative = `${ally.name} uses ${ability.name} and deals ${applied} damage to ${target.name}.`;
  newState.combatLog.push({ turn: newState.turn, actor: ally.name, action: ability.name, target: target.name, damage: applied, narrative, isCrit: resolved.isCrit, nat: resolved.natRoll, rollTier: resolved.rollTier, timestamp: Date.now(), auto: !!isAuto });

  // Check victory
  const anyAlive = (newState.enemies || []).some(e => e.currentHealth > 0);
  if (!anyAlive) {
    newState.result = 'victory';
    newState.active = false;
  }

  return { newState, narrative };
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
    const nextEnemy = (newState.enemies || []).find(e => e.id === nextActor);
    const nextAlly = (newState.allies || []).find(a => a.id === nextActor);
    const isAliveActor = (nextEnemy && nextEnemy.currentHealth > 0) || (nextAlly && nextAlly.currentHealth > 0);
    if (isAliveActor) break;
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

    // Decrement pending summon durations and remove expired summons
    if (newState.pendingSummons && newState.pendingSummons.length) {
      newState.pendingSummons = newState.pendingSummons.map(s => ({ ...s, turnsRemaining: s.turnsRemaining - 1 })).filter(s => s.turnsRemaining > 0);
      // Remove any companions that expired (turnsRemaining <= 0)
      const expired = (state.pendingSummons || []).filter(s => s.turnsRemaining <= 1).map(s => s.companionId);
      if (expired.length) {
        newState.combatLog.push({ turn: newState.turn, actor: 'system', action: 'summon_expire', narrative: `Some summoned allies have disappeared.`, timestamp: Date.now() });
        // Remove expired enemies from list and turnOrder
        newState.enemies = newState.enemies.filter(e => !expired.includes(e.id));
        newState.turnOrder = newState.turnOrder.filter(id => !expired.includes(id));
      }
    }
  }
  
  return newState;
};

export const checkCombatEnd = (state: CombatState, playerStats: PlayerCombatStats): CombatState => {
  const newState = { ...state };

  // Normalize/derive explicit enemy states from health when missing.
  newState.enemies = (newState.enemies || []).map(e => {
    const isDead = (e.currentHealth || 0) <= 0;
    const combat_state = e.combat_state || (isDead ? 'dead' : 'still_hostile');
    const health_state = e.health_state || (isDead ? 'dead' : (e.currentHealth || 0) < (e.maxHealth || 1) * 0.5 ? 'wounded' : 'healthy');
    const morale_state = e.morale_state || 'steady';
    // If dead by HP, ensure combat_state reflects that.
    const finalCombatState = isDead ? 'dead' : combat_state;
    const finalHealthState = isDead ? 'dead' : health_state;
    return { ...e, combat_state: finalCombatState, health_state: finalHealthState, morale_state } as CombatEnemy;
  });

  // Combat is only considered "victory"/loot-ready if NO enemy remains still_hostile.
  const anyStillHostile = (newState.enemies || []).some(e => {
    const cs = (e as any).combat_state || ((e.currentHealth || 0) <= 0 ? 'dead' : 'still_hostile');
    return cs === 'still_hostile';
  });

  if (!anyStillHostile) {
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

    // Companion auto-loot: assign any drops to companions that had autoLoot enabled
    try {
      const autoLooters = (newState.enemies || []).filter((e: any) => e.isCompanion && e.companionMeta?.autoLoot);
      if (autoLooters.length > 0 && newState.pendingLoot && newState.pendingLoot.length > 0) {
        newState.pendingLoot.forEach(pl => {
          // For each loot item from enemy, assign to an auto-looter if available
          pl.loot.forEach(item => {
            const looter = autoLooters[Math.floor(Math.random() * autoLooters.length)];
            if (!looter) return;
            // Move item to pendingRewards directly and log it as auto-looted
            newState.pendingRewards = newState.pendingRewards || { xp: 0, gold: 0, items: [] };
            newState.pendingRewards.items = newState.pendingRewards.items || [];
            newState.pendingRewards.items.push({ name: item.name, type: item.type, description: item.description, quantity: item.quantity });
            newState.combatLog.push({ turn: newState.turn, actor: 'system', action: 'auto_loot', narrative: `${looter.name} auto-looted ${item.name} from ${pl.enemyName}.`, timestamp: Date.now() });
            // Note: we do not remove from pendingLoot here to keep UI transparent, but an item duplicated into pendingRewards is considered already obtained by companion
          });
        });
      }
    } catch (e) {
      console.warn('Auto-loot processing failed:', e);
    }

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
// Now includes health regen based on level and perks
export const applyTurnRegen = (state: CombatState, playerStats: PlayerCombatStats, secondsPerTurn = 4) => {
  let newPlayerStats = { ...playerStats };
  const multiplier = secondsPerTurn;
  
  // Record pre-regen values so we can log exact deltas
  const beforeHealth = newPlayerStats.currentHealth || 0;
  const beforeMagicka = newPlayerStats.currentMagicka || 0;
  const beforeStamina = newPlayerStats.currentStamina || 0;

  // Apply health regen (now available based on level/perks)
  const nh = Math.min(newPlayerStats.maxHealth, newPlayerStats.currentHealth + Math.round((newPlayerStats.regenHealthPerSec || 0) * multiplier));
  const nm = Math.min(newPlayerStats.maxMagicka, newPlayerStats.currentMagicka + Math.round((newPlayerStats.regenMagickaPerSec || 0) * multiplier));
  const ns = Math.min(newPlayerStats.maxStamina, newPlayerStats.currentStamina + Math.round((newPlayerStats.regenStaminaPerSec || 0) * multiplier));
  
  newPlayerStats.currentHealth = nh;
  newPlayerStats.currentMagicka = nm;
  newPlayerStats.currentStamina = ns;

  const newState = { ...state };
  // If any vitals recovered, append a concise turn chat entry to the combat log
  try {
    const deltaH = Math.max(0, (newPlayerStats.currentHealth || 0) - beforeHealth);
    const deltaM = Math.max(0, (newPlayerStats.currentMagicka || 0) - beforeMagicka);
    const deltaS = Math.max(0, (newPlayerStats.currentStamina || 0) - beforeStamina);
    const parts: string[] = [];
    if (deltaH > 0) parts.push(`${deltaH} health`);
    if (deltaM > 0) parts.push(`${deltaM} magicka`);
    if (deltaS > 0) parts.push(`${deltaS} stamina`);
    if (parts.length > 0) {
      const narrative = `You recover ${parts.join(', ')}.`;
      const entry: CombatLogEntry = {
        turn: newState.turn,
        actor: 'system',
        action: 'regen',
        narrative,
        timestamp: Date.now()
      };
      newState.combatLog = [...(newState.combatLog || []), entry];
    }
  } catch (e) {
    // Non-fatal: logging failure should not break regen application
    console.warn('[combat] regen log failed', e);
  }

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
