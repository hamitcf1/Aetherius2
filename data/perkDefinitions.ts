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
  effect?: { type: 'stat' | 'skill'; key: string; amount: number };
}

// Minimal sample tree to start
export const PERK_DEFINITIONS: PerkDef[] = [
  { id: 'toughness', name: 'Toughness', skill: 'Health', description: 'Increase max health by 10 per rank.', maxRank: 9, masteryCost: 3, effect: { type: 'stat', key: 'health', amount: 10 } },
  { id: 'vitality', name: 'Vitality', skill: 'Health', description: 'Increase max health by 20 per rank.', requires: ['toughness:2'], maxRank: 8, masteryCost: 3, effect: { type: 'stat', key: 'health', amount: 20 } },
  { id: 'arcane_focus', name: 'Arcane Focus', skill: 'Magicka', description: 'Increase max magicka by 10 per rank.', maxRank: 9, masteryCost: 3, effect: { type: 'stat', key: 'magicka', amount: 10 } },
  { id: 'mana_mastery', name: 'Mana Mastery', skill: 'Magicka', description: 'Increase max magicka by 20 per rank.', requires: ['arcane_focus:2'], maxRank: 8, masteryCost: 4, effect: { type: 'stat', key: 'magicka', amount: 20 } },
  { id: 'endurance', name: 'Endurance', skill: 'Stamina', description: 'Increase max stamina by 10 per rank.', maxRank: 9, masteryCost: 3, effect: { type: 'stat', key: 'stamina', amount: 10 } },
  { id: 'fleet_foot', name: 'Fleet Foot', skill: 'Stamina', description: 'Increase max stamina by 15 per rank.', requires: ['endurance:2'], maxRank: 8, masteryCost: 3, effect: { type: 'stat', key: 'stamina', amount: 15 } },
  { id: 'reroll_on_failure', name: 'Lucky Strike', skill: 'Luck', description: 'When an attack critically fails, automatically reroll the attack once (passive).', maxRank: 1, masteryCost: 2 },
  // Regeneration perk: upgradeable passive health regeneration per rank (fractional values allowed)
  { id: 'regeneration', name: 'Regeneration', skill: 'Restoration', description: 'Increase passive health regeneration per rank (per second).', maxRank: 4, masteryCost: 3, effect: { type: 'stat', key: 'regenHealthPerSec', amount: 0.25 } },
];

export default PERK_DEFINITIONS;
