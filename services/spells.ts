import { Character } from '../types';

export type Spell = {
  id: string;
  name: string;
  description: string;
  cost: number; // magicka cost
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
    type: 'damage',
    damage: 15,
    effects: [{ type: 'dot', stat: 'health', value: 3, duration: 2 }]
  },
  ice_spike: {
    id: 'ice_spike',
    name: 'Ice Spike',
    description: 'A focused spike of ice that deals cold damage and may slow.',
    cost: 25,
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
    type: 'heal',
    heal: 25
  }
};

const STORAGE_PREFIX = 'aetherius:spells:';

export const getAllSpells = (): Spell[] => Object.values(SPELL_REGISTRY);

export const getSpellById = (id: string): Spell | undefined => SPELL_REGISTRY[id];

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
