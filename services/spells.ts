import { Character } from '../types';

export type Spell = {
  id: string;
  name: string;
  description: string;
  cost: number; // magicka cost
  // Cost in perk points required to learn this spell (optional; default 1)
  perkCost?: number;
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'utility';
  damage?: number;
  heal?: number;
  effects?: any[];
  prerequisites?: { level?: number; spells?: string[] };
};

const SPELL_REGISTRY: Record<string, Spell> = {
  flames: {
    id: 'flames',
    name: 'Flames',
    description: 'A small jet of fire that deals ongoing damage.',
    cost: 15,
    perkCost: 1,
    type: 'damage',
    damage: 15,
    effects: [{ type: 'dot', stat: 'health', value: 3, duration: 2, name: 'Burning', description: 'Target takes X fire damage at the start of each turn.' }]
  },
  ice_spike: {
    id: 'ice_spike',
    name: 'Ice Spike',
    description: 'A focused spike of ice that deals cold damage and may slow.',
    cost: 25,
    perkCost: 2,
    type: 'damage',
    damage: 25,
    effects: [{ type: 'slow', amount: 20, duration: 2 }],
    prerequisites: { level: 10 }
  },
  healing: {
    id: 'healing',
    name: 'Healing',
    description: 'Restore a moderate amount of health.',
    cost: 20,
    perkCost: 1,
    type: 'heal',
    heal: 25
  },
  spark: {
    id: 'spark',
    name: 'Spark',
    description: 'A small shock of lightning that deals modest damage.',
    cost: 10,
    perkCost: 1,
    type: 'damage',
    damage: 8,
    effects: [{ type: 'damage', stat: 'health', value: 2 }]
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    description: 'A powerful explosion of fire that hits multiple targets.',
    cost: 40,
    perkCost: 3,
    type: 'damage',
    damage: 45,
    effects: [{ type: 'dot', stat: 'health', value: 6, duration: 3, name: 'Burning', description: 'Target takes X fire damage at the start of each turn.' }],
    prerequisites: { level: 12 }
  },

  frost_nova: {
    id: 'frost_nova',
    name: 'Frost Nova',
    description: 'A chilling burst that damages and slows nearby enemies.',
    cost: 35,
    perkCost: 2,
    type: 'debuff',
    damage: 20,
    effects: [{ type: 'slow', amount: 30, duration: 3 }],
    prerequisites: { level: 8 }
  },
  lightning_bolt: {
    id: 'lightning_bolt',
    name: 'Lightning Bolt',
    description: 'A concentrated bolt of lightning that pierces armor.',
    cost: 30,
    perkCost: 2,
    type: 'damage',
    damage: 30,
    effects: [{ type: 'stun', duration: 1 }]
  },
  chain_lightning: {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    description: 'Lightning that arcs between multiple foes.',
    cost: 50,
    perkCost: 4,
    type: 'damage',
    damage: 55,
    effects: [{ type: 'damage', stat: 'health', value: 10 }],
    prerequisites: { level: 18 }
  },
  summon_skeleton: {
    id: 'summon_skeleton',
    name: 'Summon Skeleton',
    description: 'Summons a skeletal minion to fight for you.',
    cost: 40,
    perkCost: 3,
    type: 'utility',
    effects: [{ type: 'summon', name: 'Skeleton', duration: 3 }],
    prerequisites: { level: 10 }
  },
  summon_familiar: {
    id: 'summon_familiar',
    name: 'Conjure Familiar',
    description: 'Summons a ghostly wolf familiar to aid you in combat.',
    cost: 30,
    perkCost: 2,
    type: 'utility',
    effects: [{ type: 'summon', name: 'Spectral Wolf', duration: 3 }],
    prerequisites: { level: 5 }
  },
  summon_flame_atronach: {
    id: 'summon_flame_atronach',
    name: 'Conjure Flame Atronach',
    description: 'Summons a Flame Atronach that attacks enemies with fire.',
    cost: 60,
    perkCost: 4,
    type: 'utility',
    effects: [{ type: 'summon', name: 'Flame Atronach', duration: 4 }],
    prerequisites: { level: 15 }
  },
  summon_frost_atronach: {
    id: 'summon_frost_atronach',
    name: 'Conjure Frost Atronach',
    description: 'Summons a powerful Frost Atronach to tank and deal cold damage.',
    cost: 75,
    perkCost: 5,
    type: 'utility',
    effects: [{ type: 'summon', name: 'Frost Atronach', duration: 4 }],
    prerequisites: { level: 20 }
  },
  summon_storm_atronach: {
    id: 'summon_storm_atronach',
    name: 'Conjure Storm Atronach',
    description: 'Summons a devastating Storm Atronach crackling with lightning.',
    cost: 90,
    perkCost: 6,
    type: 'utility',
    effects: [{ type: 'summon', name: 'Storm Atronach', duration: 4 }],
    prerequisites: { level: 25 }
  },
  summon_wolf: {
    id: 'summon_wolf',
    name: 'Call of the Wild: Wolf',
    description: 'Calls a wild wolf to aid you in battle.',
    cost: 35,
    perkCost: 2,
    type: 'utility',
    effects: [{ type: 'summon', name: 'Wild Wolf', duration: 3 }],
    prerequisites: { level: 8 }
  },
  summon_bear: {
    id: 'summon_bear',
    name: 'Call of the Wild: Bear',
    description: 'Summons a fearsome cave bear to fight alongside you.',
    cost: 55,
    perkCost: 4,
    type: 'utility',
    effects: [{ type: 'summon', name: 'Cave Bear', duration: 3 }],
    prerequisites: { level: 18 }
  },
  summon_sabre_cat: {
    id: 'summon_sabre_cat',
    name: 'Call of the Wild: Sabre Cat',
    description: 'Summons a deadly sabre cat to hunt your enemies.',
    cost: 50,
    perkCost: 3,
    type: 'utility',
    effects: [{ type: 'summon', name: 'Sabre Cat', duration: 3 }],
    prerequisites: { level: 14 }
  },
  summon_spriggan: {
    id: 'summon_spriggan',
    name: 'Conjure Spriggan',
    description: 'Summons a nature spirit that heals allies and attacks foes.',
    cost: 65,
    perkCost: 4,
    type: 'utility',
    effects: [{ type: 'summon', name: 'Spriggan', duration: 4 }],
    prerequisites: { level: 16 }
  },
  summon_wrathman: {
    id: 'summon_wrathman',
    name: 'Conjure Wrathman',
    description: 'Summons an ancient Nord spirit warrior to battle for you.',
    cost: 85,
    perkCost: 5,
    type: 'utility',
    effects: [{ type: 'summon', name: 'Wrathman', duration: 4 }],
    prerequisites: { level: 22 }
  },
  invisibility: {
    id: 'invisibility',
    name: 'Invisibility',
    description: 'Become unseen for a short duration.',
    cost: 60,
    perkCost: 5,
    type: 'utility',
    effects: [{ type: 'buff', stat: 'stealth', amount: 100, duration: 8 }],
    prerequisites: { level: 20 }
  },
  slow: {
    id: 'slow',
    name: 'Slow',
    description: 'Reduces target movement speed considerably.',
    cost: 18,
    perkCost: 1,
    type: 'debuff',
    effects: [{ type: 'slow', amount: 40, duration: 4 }]
  },
  heal_major: {
    id: 'heal_major',
    name: 'Heal Major',
    description: 'Restores a large amount of health to the caster or an ally.',
    cost: 45,
    perkCost: 3,
    type: 'heal',
    heal: 60,
    prerequisites: { level: 15 }
  },
  // Aeonic Surge family: hybrid AoE attack + heal (magical school: AeO)
  aeonic_pulse: {
    id: 'aeonic_pulse',
    name: 'Aeonic Pulse',
    description: 'A focused pulse of aeonic energy — lesser AoE heal + damage.',
    cost: 38,
    perkCost: 2,
    type: 'damage',
    effects: [{ type: 'aoe_damage', value: 10, aoeTarget: 'all_enemies' }, { type: 'aoe_heal', value: 8, aoeTarget: 'all_allies' }],
    prerequisites: { level: 8 }
  },
  aeonic_surge: {
    id: 'aeonic_surge',
    name: 'Aeonic Surge',
    description: 'Unleash a pulse of aeonic energy that wounds nearby foes while restoring allies.',
    cost: 45,
    perkCost: 3,
    type: 'damage',
    effects: [{ type: 'aoe_damage', value: 18, aoeTarget: 'all_enemies' }, { type: 'aoe_heal', value: 14, aoeTarget: 'all_allies' }],
    prerequisites: { level: 12 }
  },
  aeonic_wave: {
    id: 'aeonic_wave',
    name: 'Aeonic Wave',
    description: 'A sweeping wave of aeonic energy — powerful and costly.',
    cost: 60,
    perkCost: 6,
    type: 'damage',
    effects: [{ type: 'aoe_damage', value: 26, aoeTarget: 'all_enemies' }, { type: 'aoe_heal', value: 22, aoeTarget: 'all_allies' }],
    prerequisites: { level: 18 }
  },

  // === NEW EXPANSION SPELLS ===
  // DESTRUCTION - Fire Track
  fire_bolt: {
    id: 'fire_bolt',
    name: 'Fire Bolt',
    description: 'A bolt of concentrated fire damage.',
    cost: 20,
    perkCost: 1,
    type: 'damage',
    damage: 20,
    prerequisites: { level: 30 }
  },
  // DESTRUCTION - Frost Track
  frostbite: {
    id: 'frostbite',
    name: 'Frostbite',
    description: 'A bolt of frost that slows enemies.',
    cost: 22,
    perkCost: 1,
    type: 'damage',
    damage: 18,
    prerequisites: { level: 30 }
  },
  // DESTRUCTION - Mid-tier
  inferno: {
    id: 'inferno',
    name: 'Inferno',
    description: 'A powerful fire spell that burns all nearby enemies.',
    cost: 38,
    perkCost: 2,
    type: 'damage',
    damage: 28,
    effects: [{ type: 'aoe_damage', value: 28 }],
    prerequisites: { level: 50 }
  },
  absolute_zero: {
    id: 'absolute_zero',
    name: 'Absolute Zero',
    description: 'Extreme frost that freezes enemies, dealing heavy damage.',
    cost: 45,
    perkCost: 2,
    type: 'damage',
    damage: 32,
    prerequisites: { level: 55 }
  },
  blizzard: {
    id: 'blizzard',
    name: 'Blizzard',
    description: 'A devastating ice storm that freezes all enemies, dealing damage over time.',
    cost: 70,
    perkCost: 3,
    type: 'damage',
    damage: 25,
    effects: [{ type: 'aoe_damage', value: 25 }],
    prerequisites: { level: 85 }
  },
  meteor_storm: {
    id: 'meteor_storm',
    name: 'Meteor Storm',
    description: 'Rain meteors on all enemies, dealing massive AoE damage.',
    cost: 90,
    perkCost: 4,
    type: 'damage',
    damage: 50,
    effects: [{ type: 'aoe_damage', value: 50 }],
    prerequisites: { level: 90 }
  },

  // RESTORATION - Single Target
  close_wounds: {
    id: 'close_wounds',
    name: 'Close Wounds',
    description: 'Heal yourself more effectively.',
    cost: 28,
    perkCost: 1,
    type: 'heal',
    heal: 40,
    prerequisites: { level: 35 }
  },
  cure_disease: {
    id: 'cure_disease',
    name: 'Cure Disease',
    description: 'Cure all diseases and poisons affecting you.',
    cost: 25,
    perkCost: 1,
    type: 'heal',
    heal: 20,
    prerequisites: { level: 40 }
  },
  magicka_restoration: {
    id: 'magicka_restoration',
    name: 'Magicka Restoration',
    description: 'Restore your magicka pool.',
    cost: 0,
    perkCost: 1,
    type: 'heal',
    // Restores magicka to the caster (bonus action). Use explicit `restore` effect so the engine applies magicka.
    effects: [{ type: 'restore', stat: 'magicka', value: 60 }],
    prerequisites: { level: 45 }
  },
  grand_healing: {
    id: 'grand_healing',
    name: 'Grand Healing',
    description: 'Restore a large amount of health to yourself.',
    cost: 55,
    perkCost: 2,
    type: 'heal',
    heal: 60,
    prerequisites: { level: 60 }
  },
  // RESTORATION - AoE
  healing_circle: {
    id: 'healing_circle',
    name: 'Healing Circle',
    description: 'A circle of healing light that restores health to you and all allies.',
    cost: 45,
    perkCost: 2,
    type: 'heal',
    heal: 30,
    prerequisites: { level: 50 }
  },
  guardian_circle: {
    id: 'guardian_circle',
    name: 'Guardian Circle',
    description: 'A powerful ward that heals and buffs all allies with increased armor.',
    cost: 65,
    perkCost: 2,
    type: 'heal',
    // Heals allies and grants a temporary armor buff
    effects: [
      { type: 'aoe_heal', value: 40, aoeTarget: 'all_allies' },
      { type: 'buff', stat: 'armor', value: 20, duration: 4, aoeTarget: 'all_allies' }
    ],
    prerequisites: { level: 70 }
  },
  mass_restoration: {
    id: 'mass_restoration',
    name: 'Mass Restoration',
    description: 'Restore health and magicka to all allies.',
    cost: 75,
    perkCost: 3,
    type: 'heal',
    // AoE heal + magicka restore
    effects: [
      { type: 'aoe_heal', value: 50, aoeTarget: 'all_allies' },
      { type: 'aoe_restore', stat: 'magicka', value: 40, aoeTarget: 'all_allies' }
    ],
    prerequisites: { level: 80 }
  },

  // CONJURATION
  soul_trap: {
    id: 'soul_trap',
    name: 'Soul Trap',
    description: 'Damage an enemy while trapping its soul.',
    cost: 20,
    perkCost: 1,
    type: 'damage',
    damage: 15,
    prerequisites: { level: 20 }
  },
  bound_weapon: {
    id: 'bound_weapon',
    name: 'Bound Weapon',
    description: 'Conjure a spectral weapon to strike your foe.',
    cost: 30,
    perkCost: 1,
    type: 'utility',
    damage: 30,
    // Conjures a temporary weapon the player can use for physical attacks.
    // Handled specially in the combat engine via `summon` effect with `summonType: 'weapon'`.
    effects: [
      {
        type: 'summon',
        name: 'Bound Weapon',
        summonType: 'weapon',
        // Duration in player turns
        duration: 3,
        playerTurns: 3,
        // Template for the conjured weapon; combat will scale this by caster level/skill
        weapon: { name: 'Bound Weapon', damage: 18 }
      }
    ],
    prerequisites: { level: 30 }
  },
  conjure_daedra: {
    id: 'conjure_daedra',
    name: 'Conjure Daedra',
    description: 'Summon a daedric servant to fight for you.',
    cost: 50,
    perkCost: 2,
    type: 'utility',
    effects: [{ type: 'summon', name: 'Daedra', duration: 4 }],
    prerequisites: { level: 50 }
  },
  summon_dremora_lord: {
    id: 'summon_dremora_lord',
    name: 'Summon Dremora Lord',
    description: 'Summon a powerful Dremora Lord to dominate the battlefield.',
    cost: 85,
    perkCost: 3,
    type: 'utility',
    effects: [{ type: 'summon', name: 'Dremora Lord', duration: 5 }],
    prerequisites: { level: 80 }
  },

  // ALTERATION
  oakflesh: {
    id: 'oakflesh',
    name: 'Oakflesh',
    description: 'Harden your skin, increasing armor.',
    cost: 25,
    perkCost: 1,
    type: 'buff',
    prerequisites: { level: 20 }
  },
  stoneskin: {
    id: 'stoneskin',
    name: 'Stoneskin',
    description: 'Turn your skin to stone, increasing armor significantly.',
    cost: 35,
    perkCost: 1,
    type: 'buff',
    prerequisites: { level: 35 }
  },
  iron_skin: {
    id: 'iron_skin',
    name: 'Iron Skin',
    description: 'Become nearly invulnerable for a short time.',
    cost: 50,
    perkCost: 2,
    type: 'buff',
    prerequisites: { level: 50 }
  },
  paralyze: {
    id: 'paralyze',
    name: 'Paralyze',
    description: 'Paralyze an enemy, preventing them from acting.',
    cost: 55,
    perkCost: 2,
    type: 'debuff',
    damage: 10,
    prerequisites: { level: 40 }
  },
  telekinesis: {
    id: 'telekinesis',
    name: 'Telekinesis',
    description: 'Hurl objects at enemies with telekinetic force.',
    cost: 40,
    perkCost: 1,
    type: 'damage',
    damage: 20,
    prerequisites: { level: 60 }
  },

  // ILLUSION
  candlelight: {
    id: 'candlelight',
    name: 'Candlelight',
    description: 'Create magical light around you.',
    cost: 10,
    perkCost: 0,
    type: 'utility',
    prerequisites: { level: 20 }
  },
  muffle: {
    id: 'muffle',
    name: 'Muffle',
    description: 'Silence your footsteps.',
    cost: 20,
    perkCost: 1,
    type: 'utility',
    prerequisites: { level: 30 }
  },
  fear: {
    id: 'fear',
    name: 'Fear',
    description: 'Fill an enemy with terror, reducing their damage.',
    cost: 30,
    perkCost: 1,
    type: 'debuff',
    prerequisites: { level: 35 }
  },
  mayhem: {
    id: 'mayhem',
    name: 'Mayhem',
    description: 'Make all enemies attack each other.',
    cost: 55,
    perkCost: 2,
    type: 'debuff',
    prerequisites: { level: 50 }
  },
  mass_paralysis: {
    id: 'mass_paralysis',
    name: 'Mass Paralysis',
    description: 'Paralyze all enemies in a wide area.',
    cost: 80,
    perkCost: 2,
    type: 'debuff',
    damage: 5,
    prerequisites: { level: 65 }
  }
};

const STORAGE_PREFIX = 'aetherius:spells:';

import { storage } from './storage';

export const getAllSpells = (): Spell[] => Object.values(SPELL_REGISTRY);

export const getSpellById = (id: string): Spell | undefined => {
  // Support high-level variant suffixes like 'flames:high' or 'flames_high'
  if (!id) return undefined;
  const match = id.match(/^(.+)([:_])(high|empowered)$/);
  if (match) {
    const baseId = match[1];
    const base = SPELL_REGISTRY[baseId];
    if (!base) return undefined;
    // Produce an empowered variant on the fly
    const scale = 1.5;
    const boosted: Spell = {
      ...base,
      id,
      name: `${base.name} (Empowered)`,
      description: `${base.description} (Empowered variant: increased potency.)`,
      cost: Math.max(1, Math.floor((base.cost || 0) * scale)),
      // Empowered variants require a larger perk investment
      perkCost: 10,
      damage: base.damage ? Math.max(1, Math.floor(base.damage * scale)) : base.damage,
      heal: base.heal ? Math.max(1, Math.floor(base.heal * scale)) : base.heal
    };
    return boosted;
  }
  return SPELL_REGISTRY[id];
};

// Determine whether a spell variant (e.g., ':high') is unlocked for a character
export const isSpellVariantUnlocked = (character: { level: number; perks?: any[] } | null | undefined, id: string): boolean => {
  if (!character) return false;
  if (!id) return false;
  const match = id.match(/^(.+)([:_])(high|empowered)$/);
  if (!match) return true;
  const baseId = match[1];
  const base = SPELL_REGISTRY[baseId];
  if (!base) return false;
  // Unlock early if character has explicit perk 'empower_spells' or 'empower_magic'
  const hasPerk = Array.isArray(character.perks) && character.perks.some((p: any) => p && (p.id === 'empower_spells' || p.id === 'empower_magic'));
  if (hasPerk) return true;
  // Otherwise require the base prerequisite level + 5 (empowered variants are meant to unlock later)
  // For spells without an explicit prerequisite, treat base requirement as level 1.
  const baseReq = base.prerequisites?.level ?? 1;
  const minReq = baseReq + 5;
  return (character.level || 0) >= minReq;
};

export const getLearnedSpellIds = (characterId: string): string[] => {
  try {
    const raw = storage.getItem(`${STORAGE_PREFIX}${characterId}`);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (e) {
    // Use structured logger so tests are not noisy
    try { require('./logger').log.warn('Failed to read learned spells', e); } catch (e2) { /* fallback */ }
    return [];
  }
};

export const isSpellLearned = (characterId: string, spellId: string) => {
  return getLearnedSpellIds(characterId).includes(spellId);
};

// Merge learned-spell state from a server-side Character object and local storage.
// - Returns the merged list (server ∪ local).
// - Ensures local storage is updated to the merged set so offline flows continue to work.
// - This is intentionally pure enough to be unit-tested.
export const mergeLearnedSpellsFromCharacter = (character: { id: string; learnedSpells?: string[] } | null | undefined): string[] => {
  if (!character || !character.id) return [];
  const stored = getLearnedSpellIds(character.id) || [];
  const server = Array.isArray(character.learnedSpells) ? character.learnedSpells.filter(Boolean) : [];
  const union = Array.from(new Set([...server, ...stored]));
  try {
    // Ensure local storage reflects the canonical union so UI/offline flows behave consistently
    storage.setItem(`${STORAGE_PREFIX}${character.id}`, JSON.stringify(union));
  } catch (e) {
    try { require('./logger').log.warn('Failed to sync learned spells to storage', e); } catch (e2) { /* fallback */ }
  }
  return union;
};

export const learnSpell = (characterId: string, spellId: string) => {
  const existing = getLearnedSpellIds(characterId);
  if (existing.includes(spellId)) return false;
  const next = [...existing, spellId];
  try {
    storage.setItem(`${STORAGE_PREFIX}${characterId}`, JSON.stringify(next));
    return true;
  } catch (e) {
    try { require('./logger').log.warn('Failed to persist learned spells', e); } catch (e2) { /* fallback */ }
    return false;
  }
};

export const forgetSpell = (characterId: string, spellId: string) => {
  const existing = getLearnedSpellIds(characterId).filter(s => s !== spellId);
  try {
    storage.setItem(`${STORAGE_PREFIX}${characterId}`, JSON.stringify(existing));
    return true;
  } catch (e) {
    try { require('./logger').log.warn('Failed to persist learned spells', e); } catch (e2) { /* fallback */ }
    return false;
  }
};

// Refund all learned spells and return total perk points spent
export const refundAllSpells = (characterId: string): { refundedPoints: number; spellsCleared: number } => {
  const learned = getLearnedSpellIds(characterId);
  let totalPoints = 0;
  for (const spellId of learned) {
    const spell = getSpellById(spellId);
    totalPoints += spell?.perkCost || 1;
  }
  try {
    storage.setItem(`${STORAGE_PREFIX}${characterId}`, JSON.stringify([]));
    return { refundedPoints: totalPoints, spellsCleared: learned.length };
  } catch (e) {
    try { require('./logger').log.warn('Failed to clear learned spells for refund', e); } catch (e2) { /* fallback */ }
    return { refundedPoints: 0, spellsCleared: 0 };
  }
};

// Get spell school/category
export const getSpellSchool = (spell: Spell): string => {
  if (spell.type === 'heal') return 'Restoration';
  if (spell.type === 'damage') {
    if (spell.id.includes('fire') || spell.id.includes('flame')) return 'Destruction';
    if (spell.id.includes('ice') || spell.id.includes('frost')) return 'Destruction';
    if (spell.id.includes('lightning') || spell.id.includes('spark') || spell.id.includes('shock')) return 'Destruction';
    return 'Destruction';
  }
  if (spell.type === 'buff') return 'Alteration';
  if (spell.type === 'debuff') return 'Illusion';
  if (spell.type === 'utility') {
    if (spell.id.includes('summon') || spell.id.includes('conjur')) return 'Conjuration';
    if (spell.id.includes('invisible') || spell.id.includes('illusion')) return 'Illusion';
    return 'Alteration';
  }
  return 'General';
};

// Minimal cast handler: returns a CombatAbility-like object representing the spell
export const createAbilityFromSpell = (spellId: string) => {
  const s = getSpellById(spellId);
  if (!s) return null;
  return {
    id: `spell_${s.id}`,
    spellId: s.id,
    name: s.name,
    type: 'magic' as const,
    damage: s.damage || 0,
    heal: s.heal || 0,
    cost: s.cost,
    effects: s.effects || [],
    description: s.description,
    spellType: s.type
  } as any;
};

// NPC/dialogue-friendly helper: teach a spell to a character programmatically.
// Returns { learned: boolean, alreadyKnown: boolean, spell?: Spell }
export const teachSpellToCharacter = (characterId: string, spellId: string) => {
  const spell = getSpellById(spellId);
  if (!spell) return { learned: false, alreadyKnown: false };
  const already = isSpellLearned(characterId, spellId);
  if (already) return { learned: false, alreadyKnown: true, spell };
  const ok = learnSpell(characterId, spellId);
  return { learned: ok, alreadyKnown: false, spell };
};
