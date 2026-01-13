export interface PerkBalance {
  masteryCost?: number; // points required per mastery purchase
  masteryBonus?: { type: 'stat' | 'skill'; key: string; amount: number }; // bonus applied per mastery
}

export const PERK_BALANCE: Record<string, PerkBalance> = {
  // Health tree
  toughness: { masteryCost: 3, masteryBonus: { type: 'stat', key: 'health', amount: 5 } },
  vitality: { masteryCost: 4, masteryBonus: { type: 'stat', key: 'health', amount: 10 } },

  // Magicka tree
  arcane_focus: { masteryCost: 3, masteryBonus: { type: 'stat', key: 'magicka', amount: 5 } },
  mana_mastery: { masteryCost: 4, masteryBonus: { type: 'stat', key: 'magicka', amount: 12 } },

  // Stamina tree
  endurance: { masteryCost: 3, masteryBonus: { type: 'stat', key: 'stamina', amount: 5 } },
  fleet_foot: { masteryCost: 3, masteryBonus: { type: 'stat', key: 'stamina', amount: 7 } },
};

export default PERK_BALANCE;
