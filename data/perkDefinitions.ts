import { Perk } from '../types';

export interface PerkDef {
  id: string;
  name: string;
  skill?: string;
  description: string;
  requires?: string[]; // ids of prerequisite perks
  // `effect.amount` is applied per rank. `maxRank` controls how many times this perk can be upgraded.
  maxRank?: number;
  masteryCost?: number; // perk points required to purchase a mastery tier for this perk (optional, defaults to 3)
  effect?: { type: 'stat' | 'skill' | 'combat'; key: string; amount: number };
}

// Minimal sample tree to start
export const PERK_DEFINITIONS: PerkDef[] = [
  // === STAT PERKS (Health, Magicka, Stamina) ===
  { id: 'toughness', name: 'Toughness', skill: 'Health', description: 'Increase max health by 10 per rank.', maxRank: 9, masteryCost: 3, effect: { type: 'stat', key: 'health', amount: 10 } },
  { id: 'vitality', name: 'Vitality', skill: 'Health', description: 'Increase max health by 20 per rank.', requires: ['toughness:2'], maxRank: 8, masteryCost: 3, effect: { type: 'stat', key: 'health', amount: 20 } },
  { id: 'arcane_focus', name: 'Arcane Focus', skill: 'Magicka', description: 'Increase max magicka by 10 per rank.', maxRank: 9, masteryCost: 3, effect: { type: 'stat', key: 'magicka', amount: 10 } },
  { id: 'mana_mastery', name: 'Mana Mastery', skill: 'Magicka', description: 'Increase max magicka by 20 per rank.', requires: ['arcane_focus:2'], maxRank: 8, masteryCost: 4, effect: { type: 'stat', key: 'magicka', amount: 20 } },
  { id: 'endurance', name: 'Endurance', skill: 'Stamina', description: 'Increase max stamina by 10 per rank.', maxRank: 9, masteryCost: 3, effect: { type: 'stat', key: 'stamina', amount: 10 } },
  { id: 'fleet_foot', name: 'Fleet Foot', skill: 'Stamina', description: 'Increase max stamina by 15 per rank.', requires: ['endurance:2'], maxRank: 8, masteryCost: 3, effect: { type: 'stat', key: 'stamina', amount: 15 } },
  
  // === LUCK & UTILITY PERKS ===
  { id: 'reroll_on_failure', name: 'Lucky Strike', skill: 'Luck', description: 'When an attack critically fails, automatically reroll the attack once (passive).', maxRank: 1, masteryCost: 2 },
  
  // === REGENERATION PERKS (unlock at level 10+) ===
  { id: 'health_regen', name: 'Health Regeneration', skill: 'Restoration', description: 'Passively regenerate health during combat. Each rank increases regen rate by 25%. Requires level 10.', requires: ['level:10'], maxRank: 5, masteryCost: 2 },
  { id: 'magicka_regen', name: 'Magicka Regeneration', skill: 'Restoration', description: 'Passively regenerate magicka during combat. Each rank increases regen rate by 25%. Requires level 10.', requires: ['level:10'], maxRank: 5, masteryCost: 2 },
  { id: 'stamina_regen', name: 'Stamina Regeneration', skill: 'Restoration', description: 'Passively regenerate stamina during combat. Each rank increases regen rate by 25%. Requires level 10.', requires: ['level:10'], maxRank: 5, masteryCost: 2 },
  
  // === COMBAT PERKS - ONE-HANDED ===
  { id: 'armsman', name: 'Armsman', skill: 'One-Handed', description: 'Increases one-handed weapon damage by 10% per rank.', maxRank: 5, masteryCost: 2, effect: { type: 'combat', key: 'oneHandedDamage', amount: 10 } },
  { id: 'fighting_stance', name: 'Fighting Stance', skill: 'One-Handed', description: 'Power attacks with one-handed weapons cost 15% less stamina per rank.', requires: ['armsman:2'], maxRank: 3, masteryCost: 2, effect: { type: 'combat', key: 'oneHandedStaminaCost', amount: -15 } },
  { id: 'dual_flurry', name: 'Dual Flurry', skill: 'One-Handed', description: 'When dual wielding, gain +8% attack speed per rank.', requires: ['armsman:3'], maxRank: 3, masteryCost: 3, effect: { type: 'combat', key: 'dualWieldSpeed', amount: 8 } },
  { id: 'dual_savagery', name: 'Dual Savagery', skill: 'One-Handed', description: 'Dual wielding power attacks deal 25% bonus damage per rank.', requires: ['dual_flurry:2'], maxRank: 2, masteryCost: 3, effect: { type: 'combat', key: 'dualWieldPowerAttack', amount: 25 } },
  { id: 'bladesman', name: 'Bladesman', skill: 'One-Handed', description: 'Critical hits with swords deal 15% more damage per rank.', requires: ['armsman:3'], maxRank: 3, masteryCost: 2, effect: { type: 'combat', key: 'swordCritDamage', amount: 15 } },
  { id: 'bone_breaker', name: 'Bone Breaker', skill: 'One-Handed', description: 'Maces ignore 15% of armor per rank.', requires: ['armsman:3'], maxRank: 3, masteryCost: 2, effect: { type: 'combat', key: 'maceArmorPen', amount: 15 } },
  { id: 'hack_and_slash', name: 'Hack and Slash', skill: 'One-Handed', description: 'Axes have 10% chance per rank to cause bleeding (5 damage/turn for 3 turns).', requires: ['armsman:3'], maxRank: 3, masteryCost: 2, effect: { type: 'combat', key: 'axeBleed', amount: 10 } },

  // === UNARMED (new) ===
  { id: 'unarmed_mastery', name: 'Unarmed Mastery', skill: 'Unarmed', description: 'Unlocks the Unarmed Strike ability and increases unarmed damage by 8% per rank.', requires: [], maxRank: 3, masteryCost: 2, effect: { type: 'combat', key: 'unarmedDamage', amount: 8 } },
  
  // === COMBAT PERKS - TWO-HANDED ===
  { id: 'barbarian', name: 'Barbarian', skill: 'Two-Handed', description: 'Increases two-handed weapon damage by 12% per rank.', maxRank: 5, masteryCost: 2, effect: { type: 'combat', key: 'twoHandedDamage', amount: 12 } },
  { id: 'champions_stance', name: "Champion's Stance", skill: 'Two-Handed', description: 'Power attacks with two-handed weapons cost 15% less stamina per rank.', requires: ['barbarian:2'], maxRank: 3, masteryCost: 2, effect: { type: 'combat', key: 'twoHandedStaminaCost', amount: -15 } },
  { id: 'deep_wounds', name: 'Deep Wounds', skill: 'Two-Handed', description: 'Critical hits with greatswords deal 20% more damage per rank.', requires: ['barbarian:3'], maxRank: 3, masteryCost: 2, effect: { type: 'combat', key: 'greatswordCritDamage', amount: 20 } },
  { id: 'skull_crusher', name: 'Skull Crusher', skill: 'Two-Handed', description: 'Warhammers ignore 20% of armor per rank.', requires: ['barbarian:3'], maxRank: 3, masteryCost: 2, effect: { type: 'combat', key: 'warhammerArmorPen', amount: 20 } },
  { id: 'limbsplitter', name: 'Limbsplitter', skill: 'Two-Handed', description: 'Battleaxes have 15% chance per rank to cause bleeding (7 damage/turn for 3 turns).', requires: ['barbarian:3'], maxRank: 3, masteryCost: 2, effect: { type: 'combat', key: 'battleaxeBleed', amount: 15 } },
  { id: 'devastating_blow', name: 'Devastating Blow', skill: 'Two-Handed', description: 'Standing power attacks have 15% chance per rank to decapitate (instant kill on low health enemies).', requires: ['barbarian:5', 'champions_stance:2'], maxRank: 2, masteryCost: 4, effect: { type: 'combat', key: 'decapitate', amount: 15 } },
  
  // === COMBAT PERKS - BLOCK ===
  { id: 'shield_wall', name: 'Shield Wall', skill: 'Block', description: 'Blocking is 10% more effective per rank.', maxRank: 5, masteryCost: 2, effect: { type: 'combat', key: 'blockEffectiveness', amount: 10 } },
  { id: 'deflect_arrows', name: 'Deflect Arrows', skill: 'Block', description: 'Arrows that hit your shield do no damage.', requires: ['shield_wall:2'], maxRank: 1, masteryCost: 2 },
  { id: 'elemental_protection', name: 'Elemental Protection', skill: 'Block', description: 'Blocking with a shield reduces incoming fire, frost, and shock damage by 25% per rank.', requires: ['shield_wall:3'], maxRank: 2, masteryCost: 3, effect: { type: 'combat', key: 'elementalBlock', amount: 25 } },
  { id: 'power_bash', name: 'Power Bash', skill: 'Block', description: 'Shield bash can be held to deliver a more powerful strike with 20% stun chance per rank.', requires: ['shield_wall:2'], maxRank: 2, masteryCost: 2, effect: { type: 'combat', key: 'bashStun', amount: 20 } },
  { id: 'deadly_bash', name: 'Deadly Bash', skill: 'Block', description: 'Shield bashing does 5x more damage per rank.', requires: ['power_bash:2'], maxRank: 2, masteryCost: 3, effect: { type: 'combat', key: 'bashDamage', amount: 500 } },
  { id: 'disarming_bash', name: 'Disarming Bash', skill: 'Block', description: 'Shield bash has 15% chance per rank to disarm opponents.', requires: ['power_bash:2'], maxRank: 2, masteryCost: 3, effect: { type: 'combat', key: 'bashDisarm', amount: 15 } },

  // Defensive guard mastery: increases Defensive/Guard duration up to 3 rounds
  { id: 'tactical_guard_mastery', name: 'Tactical Guard Mastery', skill: 'Block', description: 'Increases the duration of Tactical Guard by +1 round per rank (max +2), allowing Guard to last up to 3 rounds.', requires: ['shield_wall:1'], maxRank: 2, masteryCost: 3, effect: { type: 'combat', key: 'defendDuration', amount: 1 } },
  
  // === COMBAT PERKS - ARCHERY ===
  { id: 'overdraw', name: 'Overdraw', skill: 'Archery', description: 'Increases bow damage by 12% per rank.', maxRank: 5, masteryCost: 2, effect: { type: 'combat', key: 'bowDamage', amount: 12 } },
  { id: 'eagle_eye', name: 'Eagle Eye', skill: 'Archery', description: 'Increases critical hit chance with bows by 5% per rank.', requires: ['overdraw:2'], maxRank: 4, masteryCost: 2, effect: { type: 'combat', key: 'bowCritChance', amount: 5 } },
  { id: 'steady_hand', name: 'Steady Hand', skill: 'Archery', description: 'Reduces stamina cost for bows by 15% per rank.', requires: ['overdraw:2'], maxRank: 3, masteryCost: 2, effect: { type: 'combat', key: 'bowStaminaCost', amount: -15 } },
  { id: 'power_shot', name: 'Power Shot', skill: 'Archery', description: 'Arrows have 25% chance per rank to stagger enemies.', requires: ['eagle_eye:2'], maxRank: 2, masteryCost: 3, effect: { type: 'combat', key: 'arrowStagger', amount: 25 } },
  { id: 'quick_shot', name: 'Quick Shot', skill: 'Archery', description: 'Can draw bow 15% faster per rank.', requires: ['steady_hand:2'], maxRank: 2, masteryCost: 3, effect: { type: 'combat', key: 'bowSpeed', amount: 15 } },
  { id: 'hunters_discipline', name: "Hunter's Discipline", skill: 'Archery', description: '50% chance per rank to recover arrows from dead bodies.', requires: ['overdraw:3'], maxRank: 2, masteryCost: 2, effect: { type: 'combat', key: 'arrowRecovery', amount: 50 } },
  
  // === COMBAT PERKS - LIGHT ARMOR ===
  { id: 'agile_defender', name: 'Agile Defender', skill: 'Light Armor', description: 'Increases light armor rating by 10% per rank.', maxRank: 5, masteryCost: 2, effect: { type: 'combat', key: 'lightArmorRating', amount: 10 } },
  { id: 'custom_fit', name: 'Custom Fit', skill: 'Light Armor', description: 'Wearing a matched set of light armor grants +10% armor bonus per rank.', requires: ['agile_defender:2'], maxRank: 2, masteryCost: 2, effect: { type: 'combat', key: 'lightArmorSetBonus', amount: 10 } },
  { id: 'unhindered', name: 'Unhindered', skill: 'Light Armor', description: 'Light armor weighs nothing and doesn\'t slow you down.', requires: ['custom_fit:1'], maxRank: 1, masteryCost: 2 },
  { id: 'wind_walker', name: 'Wind Walker', skill: 'Light Armor', description: 'Stamina regenerates 25% faster per rank while wearing light armor.', requires: ['agile_defender:3'], maxRank: 2, masteryCost: 3, effect: { type: 'combat', key: 'lightArmorStaminaRegen', amount: 25 } },
  { id: 'deft_movement', name: 'Deft Movement', skill: 'Light Armor', description: '10% chance per rank to dodge melee attacks while wearing light armor.', requires: ['wind_walker:1'], maxRank: 3, masteryCost: 3, effect: { type: 'combat', key: 'dodgeChance', amount: 10 } },
  
  // === COMBAT PERKS - HEAVY ARMOR ===
  { id: 'juggernaut', name: 'Juggernaut', skill: 'Heavy Armor', description: 'Increases heavy armor rating by 12% per rank.', maxRank: 5, masteryCost: 2, effect: { type: 'combat', key: 'heavyArmorRating', amount: 12 } },
  { id: 'well_fitted', name: 'Well Fitted', skill: 'Heavy Armor', description: 'Wearing a matched set of heavy armor grants +15% armor bonus per rank.', requires: ['juggernaut:2'], maxRank: 2, masteryCost: 2, effect: { type: 'combat', key: 'heavyArmorSetBonus', amount: 15 } },
  { id: 'tower_of_strength', name: 'Tower of Strength', skill: 'Heavy Armor', description: '25% less stagger per rank when wearing heavy armor.', requires: ['juggernaut:3'], maxRank: 2, masteryCost: 2, effect: { type: 'combat', key: 'staggerResist', amount: 25 } },
  { id: 'conditioning', name: 'Conditioning', skill: 'Heavy Armor', description: 'Heavy armor weighs nothing and doesn\'t slow you down.', requires: ['well_fitted:1'], maxRank: 1, masteryCost: 3 },
  { id: 'reflect_blows', name: 'Reflect Blows', skill: 'Heavy Armor', description: '10% chance per rank to reflect melee damage back to attacker.', requires: ['tower_of_strength:2'], maxRank: 2, masteryCost: 4, effect: { type: 'combat', key: 'reflectDamage', amount: 10 } },
  
  // === COMBAT PERKS - DESTRUCTION ===
  { id: 'destruction_novice', name: 'Novice Destruction', skill: 'Destruction', description: 'Novice-level destruction spells cost 25% less magicka per rank.', maxRank: 2, masteryCost: 2, effect: { type: 'combat', key: 'noviceDestructionCost', amount: -25 } },
  { id: 'augmented_flames', name: 'Augmented Flames', skill: 'Destruction', description: 'Fire spells deal 15% more damage per rank.', requires: ['destruction_novice:1'], maxRank: 3, masteryCost: 2, effect: { type: 'combat', key: 'fireDamage', amount: 15 } },
  { id: 'augmented_frost', name: 'Augmented Frost', skill: 'Destruction', description: 'Frost spells deal 15% more damage per rank.', requires: ['destruction_novice:1'], maxRank: 3, masteryCost: 2, effect: { type: 'combat', key: 'frostDamage', amount: 15 } },
  { id: 'augmented_shock', name: 'Augmented Shock', skill: 'Destruction', description: 'Shock spells deal 15% more damage per rank.', requires: ['destruction_novice:1'], maxRank: 3, masteryCost: 2, effect: { type: 'combat', key: 'shockDamage', amount: 15 } },
  { id: 'intense_flames', name: 'Intense Flames', skill: 'Destruction', description: 'Fire spells have 15% chance per rank to cause fear in targets below 20% health.', requires: ['augmented_flames:2'], maxRank: 2, masteryCost: 3, effect: { type: 'combat', key: 'fireFear', amount: 15 } },
  { id: 'deep_freeze', name: 'Deep Freeze', skill: 'Destruction', description: 'Frost spells have 15% chance per rank to paralyze targets below 20% health.', requires: ['augmented_frost:2'], maxRank: 2, masteryCost: 3, effect: { type: 'combat', key: 'frostParalyze', amount: 15 } },
  { id: 'disintegrate', name: 'Disintegrate', skill: 'Destruction', description: 'Shock spells have 15% chance per rank to instantly kill targets below 15% health.', requires: ['augmented_shock:2'], maxRank: 2, masteryCost: 4, effect: { type: 'combat', key: 'shockDisintegrate', amount: 15 } },
  
  // === COMBAT PERKS - RESTORATION ===
  { id: 'restoration_novice', name: 'Novice Restoration', skill: 'Restoration', description: 'Novice-level restoration spells cost 25% less magicka per rank.', maxRank: 2, masteryCost: 2, effect: { type: 'combat', key: 'noviceRestorationCost', amount: -25 } },
  { id: 'regeneration', name: 'Regeneration', skill: 'Restoration', description: 'Healing spells are 25% more effective per rank.', requires: ['restoration_novice:1'], maxRank: 2, masteryCost: 2, effect: { type: 'combat', key: 'healingEffectiveness', amount: 25 } },
  { id: 'recovery', name: 'Recovery', skill: 'Restoration', description: 'Magicka regenerates 15% faster per rank.', requires: ['restoration_novice:1'], maxRank: 3, masteryCost: 2, effect: { type: 'combat', key: 'magickaRegenBonus', amount: 15 } },
  { id: 'avoid_death', name: 'Avoid Death', skill: 'Restoration', description: 'Once per combat, when health drops below 10%, automatically heal 50 health per rank.', requires: ['recovery:2', 'regeneration:2'], maxRank: 2, masteryCost: 4, effect: { type: 'combat', key: 'avoidDeath', amount: 50 } },
  
  // === COMBAT PERKS - CONJURATION ===
  { id: 'conjuration_novice', name: 'Novice Conjuration', skill: 'Conjuration', description: 'Novice-level conjuration spells cost 25% less magicka per rank.', maxRank: 2, masteryCost: 2, effect: { type: 'combat', key: 'noviceConjurationCost', amount: -25 } },
  { id: 'summoner', name: 'Summoner', skill: 'Conjuration', description: 'Summoned creatures have 15% more health per rank.', requires: ['conjuration_novice:1'], maxRank: 3, masteryCost: 2, effect: { type: 'combat', key: 'summonHealth', amount: 15 } },
  { id: 'atromancy', name: 'Atromancy', skill: 'Conjuration', description: 'Summoned Atronachs last 25% longer per rank.', requires: ['summoner:2'], maxRank: 2, masteryCost: 2, effect: { type: 'combat', key: 'atronachDuration', amount: 25 } },
  { id: 'twin_souls', name: 'Twin Souls', skill: 'Conjuration', description: 'Can summon an additional creature (up to 2 total).', requires: ['atromancy:2', 'summoner:3'], maxRank: 1, masteryCost: 4 },
  
  // === COMBAT PERKS - SNEAK ===
  { id: 'stealth', name: 'Stealth', skill: 'Sneak', description: 'You are 15% harder to detect per rank.', maxRank: 5, masteryCost: 2, effect: { type: 'combat', key: 'sneakBonus', amount: 15 } },
  { id: 'backstab', name: 'Backstab', skill: 'Sneak', description: 'Sneak attacks with one-handed weapons deal 3x damage (per rank: +1x).', requires: ['stealth:2'], maxRank: 3, masteryCost: 3, effect: { type: 'combat', key: 'backstabMultiplier', amount: 100 } },
  { id: 'deadly_aim', name: 'Deadly Aim', skill: 'Sneak', description: 'Sneak attacks with bows deal 2x damage (per rank: +1x).', requires: ['stealth:2'], maxRank: 3, masteryCost: 3, effect: { type: 'combat', key: 'sneakBowMultiplier', amount: 100 } },
  { id: 'assassins_blade', name: "Assassin's Blade", skill: 'Sneak', description: 'Sneak attacks with daggers deal 15x damage.', requires: ['backstab:3'], maxRank: 1, masteryCost: 4, effect: { type: 'combat', key: 'daggerSneakMultiplier', amount: 1500 } },
  { id: 'shadow_warrior', name: 'Shadow Warrior', skill: 'Sneak', description: '15% chance per rank to enter stealth mid-combat when crouching.', requires: ['stealth:5'], maxRank: 2, masteryCost: 4, effect: { type: 'combat', key: 'combatStealth', amount: 15 } },
  
  // === SPECIAL PERKS ===
  { id: 'berserker_rage', name: 'Berserker Rage', skill: 'Combat', description: 'When below 25% health, deal 20% more damage per rank.', maxRank: 3, masteryCost: 3, effect: { type: 'combat', key: 'lowHealthDamage', amount: 20 } },
  { id: 'vampiric_strikes', name: 'Vampiric Strikes', skill: 'Combat', description: 'Melee attacks restore 3% of damage dealt as health per rank.', requires: ['level:15'], maxRank: 3, masteryCost: 3, effect: { type: 'combat', key: 'lifesteal', amount: 3 } },
  { id: 'executioner', name: 'Executioner', skill: 'Combat', description: 'Attacks against enemies below 20% health deal 25% more damage per rank.', requires: ['level:10'], maxRank: 2, masteryCost: 3, effect: { type: 'combat', key: 'executeDamage', amount: 25 } },
  { id: 'dragon_skin', name: 'Dragon Skin', skill: 'Combat', description: 'Take 5% less damage from all sources per rank.', requires: ['level:20'], maxRank: 3, masteryCost: 4, effect: { type: 'combat', key: 'damageReduction', amount: 5 } },
];

export default PERK_DEFINITIONS;
