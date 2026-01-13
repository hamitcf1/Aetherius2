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
    effects: [{ type: 'dot', stat: 'health', value: 3, duration: 2 }]
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
    effects: [{ type: 'dot', stat: 'health', value: 6, duration: 3 }],
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
    effects: [{ type: 'summon', name: 'Skeleton', duration: 60 }],
    prerequisites: { level: 10 }
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
  }
};

const STORAGE_PREFIX = 'aetherius:spells:';

export const getAllSpells = (): Spell[] => Object.values(SPELL_REGISTRY);

export const getSpellById = (id: string): Spell | undefined => {
  // Support high-level variant suffixes like 'flames:high' or 'flames_high'
  if (!id) return undefined;
  const parts = id.split(/[:_]/);
  if (parts.length > 1 && (parts[1] === 'high' || parts[1] === 'empowered')) {
    const baseId = parts[0];
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
  const parts = id.split(/[:_]/);
  if (parts.length === 1) return true;
  const variant = parts[1];
  if (!(variant === 'high' || variant === 'empowered')) return true;
  const baseId = parts[0];
  const base = SPELL_REGISTRY[baseId];
  if (!base) return false;
  // Unlock if character has explicit perk 'empower_spells'
  const hasPerk = Array.isArray(character.perks) && character.perks.some((p: any) => p && (p.id === 'empower_spells' || p.id === 'empower_magic'));
  if (hasPerk) return true;
  // Otherwise require a sufficiently higher level (base prereq + 5)
  const req = (base.prerequisites?.level || 1) + 5;
  return (character.level || 0) >= req;
};

export const getLearnedSpellIds = (characterId: string): string[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${characterId}`);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (e) {
    console.warn('Failed to read learned spells', e);
    return [];
  }
};

export const isSpellLearned = (characterId: string, spellId: string) => {
  return getLearnedSpellIds(characterId).includes(spellId);
};

export const learnSpell = (characterId: string, spellId: string) => {
  const existing = getLearnedSpellIds(characterId);
  if (existing.includes(spellId)) return false;
  const next = [...existing, spellId];
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${characterId}`, JSON.stringify(next));
    return true;
  } catch (e) {
    console.warn('Failed to persist learned spells', e);
    return false;
  }
};

export const forgetSpell = (characterId: string, spellId: string) => {
  const existing = getLearnedSpellIds(characterId).filter(s => s !== spellId);
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${characterId}`, JSON.stringify(existing));
    return true;
  } catch (e) {
    console.warn('Failed to persist learned spells', e);
    return false;
  }
};

// Minimal cast handler: returns a CombatAbility-like object representing the spell
export const createAbilityFromSpell = (spellId: string) => {
  const s = getSpellById(spellId);
  if (!s) return null;
  return {
    id: `spell_${s.id}`,
    name: s.name,
    type: 'magic' as const,
    damage: s.damage || 0,
    cost: s.cost,
    description: s.description
  };
};

// NPC/dialogue-friendly helper: teach a spell to a character programmatically.
// Returns { learned: boolean, alreadyKnown: boolean, spell?: Spell }
export const teachSpellToCharacter = (characterId: string, spellId: string) => {
  const spell = getSpellById(spellId);
  if (!spell) return { learned: false, alreadyKnown: false };
  const already = isSpellLearned(characterId, spellId);
  if (already) return { learned: false, alreadyKnown: true, spell };
  const ok = learnSpell(characterId, spellId);
  return { learned: ok, alreadyKnown: !ok ? false : false, spell };
};
