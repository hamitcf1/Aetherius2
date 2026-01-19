/**
 * Unique Items & Set Bonuses Service
 * Implements Skyrim's unique weapons/armor and new set bonus mechanics
 */

import { LootRarity, InventoryItem } from '../types';

// ========== TYPES ==========

export interface UniqueItem {
  id: string;
  name: string;
  type: 'weapon' | 'apparel';
  subtype?: string; // 'sword', 'dagger', 'helmet', 'boots', etc.
  description: string;
  lore?: string;
  value: number;
  weight: number;
  rarity: LootRarity;
  // Combat stats
  damage?: number;
  armor?: number;
  // Enchantments
  enchantment?: string;
  enchantmentPower?: number;
  // Special effects
  effects?: ItemEffect[];
  // Set membership
  setId?: string;
  // Source location
  location?: string;
  questRequired?: string;
}

export interface ItemEffect {
  type: 'damage' | 'resist' | 'fortify' | 'restore' | 'absorb' | 'special';
  stat?: string; // 'health', 'magicka', 'stamina', 'fire', 'frost', 'shock', skill name, etc.
  value: number;
  description: string;
}

export interface ItemSet {
  id: string;
  name: string;
  description: string;
  pieces: string[]; // IDs of items in the set
  bonuses: SetBonus[];
}

export interface SetBonus {
  piecesRequired: number;
  effects: ItemEffect[];
  description: string;
}

export interface ActiveSetBonus {
  setId: string;
  setName: string;
  piecesEquipped: number;
  totalPieces: number;
  activeBonuses: SetBonus[];
}

// ========== UNIQUE WEAPONS ==========

export const UNIQUE_WEAPONS: Record<string, UniqueItem> = {
  // Daedric Artifacts
  dawnbreaker: {
    id: 'dawnbreaker',
    name: 'Dawnbreaker',
    type: 'weapon',
    subtype: 'sword',
    description: 'A Daedric artifact blessed by Meridia to destroy the undead.',
    lore: 'Bestowed upon mortals who cleanse sites desecrated by the undead in Meridia\'s name.',
    value: 4000,
    weight: 10,
    rarity: 'legendary',
    damage: 16,
    enchantment: 'Burns undead for 25 points, chance to cause fiery explosion',
    enchantmentPower: 50,
    effects: [
      { type: 'damage', stat: 'fire', value: 25, description: 'Burns targets for 25 fire damage' },
      { type: 'special', value: 1, description: 'Undead may explode on death' },
    ],
    location: "Kilkreath Ruins (Meridia's quest)",
    questRequired: 'The Break of Dawn',
  },
  volendrung: {
    id: 'volendrung',
    name: 'Volendrung',
    type: 'weapon',
    subtype: 'warhammer',
    description: 'The Hammer of Might, artifact of Malacath.',
    lore: 'An Orcish artifact symbolizing the primal strength of Malacath\'s faithful.',
    value: 4500,
    weight: 26,
    rarity: 'legendary',
    damage: 25,
    enchantment: 'Absorb 50 stamina',
    enchantmentPower: 60,
    effects: [
      { type: 'absorb', stat: 'stamina', value: 50, description: 'Absorb 50 stamina per hit' },
    ],
    location: 'Largashbur',
    questRequired: 'The Cursed Tribe',
  },
  mace_of_molag_bal: {
    id: 'mace_of_molag_bal',
    name: 'Mace of Molag Bal',
    type: 'weapon',
    subtype: 'mace',
    description: 'The Mace of Molag Bal, Prince of Domination.',
    lore: 'This terrifying mace crushes the will of its victims, draining their life force.',
    value: 4200,
    weight: 18,
    rarity: 'legendary',
    damage: 18,
    enchantment: 'Absorb 25 magicka and stamina, Soul Trap',
    enchantmentPower: 55,
    effects: [
      { type: 'absorb', stat: 'magicka', value: 25, description: 'Absorb 25 magicka' },
      { type: 'absorb', stat: 'stamina', value: 25, description: 'Absorb 25 stamina' },
      { type: 'special', value: 1, description: 'Soul Trap on kill' },
    ],
    location: 'Markarth - Abandoned House',
    questRequired: 'The House of Horrors',
  },
  mehrunes_razor: {
    id: 'mehrunes_razor',
    name: "Mehrunes' Razor",
    type: 'weapon',
    subtype: 'dagger',
    description: 'Dagger of the Daedric Prince Mehrunes Dagon.',
    lore: 'This small blade has a 2% chance to instantly kill any target, regardless of their power.',
    value: 3500,
    weight: 3,
    rarity: 'legendary',
    damage: 11,
    enchantment: '2% chance to instantly kill',
    enchantmentPower: 100,
    effects: [
      { type: 'special', value: 2, description: '2% chance for instant kill' },
    ],
    location: 'Dawnstar - Silus Vesuius\' house',
    questRequired: 'Pieces of the Past',
  },
  wabbajack: {
    id: 'wabbajack',
    name: 'Wabbajack',
    type: 'weapon',
    subtype: 'staff',
    description: 'The staff of Sheogorath, Prince of Madness.',
    lore: 'Transforms targets into random creatures, or causes unpredictable magical effects.',
    value: 3000,
    weight: 10,
    rarity: 'legendary',
    damage: 1,
    enchantment: 'Random transformation or effect',
    enchantmentPower: 75,
    effects: [
      { type: 'special', value: 1, description: 'Unpredictable magical transformation' },
    ],
    location: 'Solitude - Blue Palace',
    questRequired: 'The Mind of Madness',
  },
  // Guild Weapons
  blade_of_woe: {
    id: 'blade_of_woe',
    name: 'Blade of Woe',
    type: 'weapon',
    subtype: 'dagger',
    description: 'The signature weapon of the Dark Brotherhood.',
    lore: 'Passed down through generations of Brotherhood leaders.',
    value: 1500,
    weight: 7,
    rarity: 'epic',
    damage: 12,
    enchantment: 'Absorb 10 health',
    enchantmentPower: 30,
    effects: [
      { type: 'absorb', stat: 'health', value: 10, description: 'Absorb 10 health per hit' },
    ],
    location: 'Dark Brotherhood Sanctuary',
  },
  chillrend: {
    id: 'chillrend',
    name: 'Chillrend',
    type: 'weapon',
    subtype: 'sword',
    description: 'An enchanted glass sword of legendary power.',
    lore: 'Once wielded by a notorious Thieves Guild fence, now passed to worthy successors.',
    value: 3500,
    weight: 16,
    rarity: 'legendary',
    damage: 18,
    enchantment: 'Frost damage and chance to paralyze',
    enchantmentPower: 45,
    effects: [
      { type: 'damage', stat: 'frost', value: 30, description: '30 frost damage' },
      { type: 'special', value: 1, description: 'Chance to paralyze for 2 seconds' },
    ],
    location: 'Riftweald Manor',
  },
  nightingale_blade: {
    id: 'nightingale_blade',
    name: 'Nightingale Blade',
    type: 'weapon',
    subtype: 'sword',
    description: 'The blade of Nocturnal\'s chosen agents.',
    lore: 'Awarded to those who complete the Nightingale oath.',
    value: 2500,
    weight: 15,
    rarity: 'epic',
    damage: 15,
    enchantment: 'Absorb health and stamina',
    enchantmentPower: 40,
    effects: [
      { type: 'absorb', stat: 'health', value: 20, description: 'Absorb 20 health' },
      { type: 'absorb', stat: 'stamina', value: 20, description: 'Absorb 20 stamina' },
    ],
    location: 'Twilight Sepulcher',
    questRequired: 'Trinity Restored',
    setId: 'nightingale',
  },
  // Dragon Priest Weapons
  staff_of_magnus: {
    id: 'staff_of_magnus',
    name: 'Staff of Magnus',
    type: 'weapon',
    subtype: 'staff',
    description: 'The legendary staff that absorbs magicka from any source.',
    lore: 'Created by Magnus, the god of magic, before he fled Mundus.',
    value: 5000,
    weight: 8,
    rarity: 'legendary',
    damage: 1,
    enchantment: 'Absorb 20 magicka per second, absorb health from magicka-depleted targets',
    enchantmentPower: 80,
    effects: [
      { type: 'absorb', stat: 'magicka', value: 20, description: 'Absorb 20 magicka per second' },
      { type: 'absorb', stat: 'health', value: 20, description: 'Absorb 20 health when target has no magicka' },
    ],
    location: 'Labyrinthian',
    questRequired: 'The Staff of Magnus',
  },
  // Companion Weapons
  wuuthrad: {
    id: 'wuuthrad',
    name: 'Wuuthrad',
    type: 'weapon',
    subtype: 'battleaxe',
    description: 'The legendary battleaxe of Ysgramor.',
    lore: 'Wuuthrad was used to drive the Elves from Skyrim, and still deals extra damage to them.',
    value: 4000,
    weight: 25,
    rarity: 'legendary',
    damage: 25,
    enchantment: 'Extra damage to Elves',
    enchantmentPower: 50,
    effects: [
      { type: 'damage', value: 25, description: '25% more damage against Elves' },
    ],
    location: "Ysgramor's Tomb",
    questRequired: 'Glory of the Dead',
  },
};

// ========== UNIQUE ARMOR ==========

export const UNIQUE_ARMOR: Record<string, UniqueItem> = {
  // Daedric Artifacts
  ebony_mail: {
    id: 'ebony_mail',
    name: 'Ebony Mail',
    type: 'apparel',
    subtype: 'body',
    description: 'Heavy armor that cloaks the wearer in shadow and poison.',
    lore: 'A gift from Boethiah to her most ruthless champions.',
    value: 5000,
    weight: 28,
    rarity: 'legendary',
    armor: 45,
    enchantment: 'Muffle and Poison Cloak',
    enchantmentPower: 40,
    effects: [
      { type: 'special', value: 1, description: 'Muffle effect (silent movement)' },
      { type: 'damage', stat: 'poison', value: 5, description: '5 poison damage per second to nearby enemies' },
    ],
    location: 'Sacellum of Boethiah',
    questRequired: 'Boethiah\'s Calling',
  },
  masque_of_clavicus: {
    id: 'masque_of_clavicus',
    name: 'Masque of Clavicus Vile',
    type: 'apparel',
    subtype: 'helmet',
    description: 'Helmet of the Daedric Prince of bargains and wishes.',
    lore: 'The Masque makes the wearer more persuasive and agreeable to others.',
    value: 3500,
    weight: 7,
    rarity: 'legendary',
    armor: 23,
    enchantment: '+10 Speech, better prices',
    enchantmentPower: 35,
    effects: [
      { type: 'fortify', stat: 'Speech', value: 10, description: '+10 Speech' },
      { type: 'fortify', stat: 'prices', value: 20, description: '20% better prices' },
      { type: 'fortify', stat: 'magicka_regen', value: 5, description: '+5% magicka regeneration' },
    ],
    location: 'Haemar\'s Shame',
    questRequired: 'A Daedra\'s Best Friend',
  },
  saviors_hide: {
    id: 'saviors_hide',
    name: "Savior's Hide",
    type: 'apparel',
    subtype: 'body',
    description: 'Light armor gifted by Hircine to skilled hunters.',
    lore: 'Made from the hide of a werewolf, this armor protects against magic and poison.',
    value: 3500,
    weight: 6,
    rarity: 'legendary',
    armor: 26,
    enchantment: 'Resist Magic 15%, Resist Poison 50%',
    enchantmentPower: 45,
    effects: [
      { type: 'resist', stat: 'magic', value: 15, description: '15% magic resistance' },
      { type: 'resist', stat: 'poison', value: 50, description: '50% poison resistance' },
    ],
    location: 'Bloated Man\'s Grotto',
    questRequired: 'Ill Met By Moonlight',
  },
  ring_of_hircine: {
    id: 'ring_of_hircine',
    name: 'Ring of Hircine',
    type: 'apparel',
    subtype: 'ring',
    description: 'Grants additional werewolf transformations.',
    lore: 'Hircine\'s ring allows werewolves unlimited transformations per day.',
    value: 2000,
    weight: 0.3,
    rarity: 'legendary',
    armor: 0,
    enchantment: 'Unlimited werewolf transformations',
    enchantmentPower: 100,
    effects: [
      { type: 'special', value: 1, description: 'Unlimited daily werewolf transformations' },
    ],
    location: 'Bloated Man\'s Grotto',
    questRequired: 'Ill Met By Moonlight',
  },
  ring_of_namira: {
    id: 'ring_of_namira',
    name: 'Ring of Namira',
    type: 'apparel',
    subtype: 'ring',
    description: 'Ring that grants power through cannibalism.',
    lore: 'Those who wear this ring can feed on the dead to restore health and stamina.',
    value: 2500,
    weight: 0.3,
    rarity: 'legendary',
    armor: 0,
    enchantment: '+50 Stamina, feeding on corpses restores health',
    enchantmentPower: 50,
    effects: [
      { type: 'fortify', stat: 'stamina', value: 50, description: '+50 Stamina' },
      { type: 'special', value: 1, description: 'Feed on humanoid corpses for health' },
    ],
    location: 'Reachcliff Cave',
    questRequired: 'The Taste of Death',
  },
  // Nightingale Set
  nightingale_armor: {
    id: 'nightingale_armor',
    name: 'Nightingale Armor',
    type: 'apparel',
    subtype: 'body',
    description: 'The sacred armor of Nocturnal\'s Nightingales.',
    lore: 'Worn by the elite agents of the Thieves Guild who serve Nocturnal.',
    value: 2500,
    weight: 12,
    rarity: 'epic',
    armor: 37,
    enchantment: '+25 Stamina, +20% Frost Resistance',
    enchantmentPower: 35,
    effects: [
      { type: 'fortify', stat: 'stamina', value: 25, description: '+25 Stamina' },
      { type: 'resist', stat: 'frost', value: 20, description: '20% frost resistance' },
    ],
    location: 'Twilight Sepulcher',
    questRequired: 'Trinity Restored',
    setId: 'nightingale',
  },
  nightingale_boots: {
    id: 'nightingale_boots',
    name: 'Nightingale Boots',
    type: 'apparel',
    subtype: 'boots',
    description: 'Silent boots of the Nightingales.',
    lore: 'These boots make the wearer\'s footsteps completely silent.',
    value: 1500,
    weight: 4,
    rarity: 'epic',
    armor: 10,
    enchantment: 'Muffle',
    enchantmentPower: 30,
    effects: [
      { type: 'special', value: 1, description: 'Muffle (silent movement)' },
    ],
    location: 'Twilight Sepulcher',
    questRequired: 'Trinity Restored',
    setId: 'nightingale',
  },
  nightingale_gloves: {
    id: 'nightingale_gloves',
    name: 'Nightingale Gloves',
    type: 'apparel',
    subtype: 'gloves',
    description: 'Gloves that enhance lockpicking ability.',
    lore: 'These gloves steady the hands of any thief.',
    value: 1500,
    weight: 2,
    rarity: 'epic',
    armor: 10,
    enchantment: '+25 Lockpicking',
    enchantmentPower: 30,
    effects: [
      { type: 'fortify', stat: 'Lockpicking', value: 25, description: '+25 Lockpicking' },
    ],
    location: 'Twilight Sepulcher',
    questRequired: 'Trinity Restored',
    setId: 'nightingale',
  },
  nightingale_hood: {
    id: 'nightingale_hood',
    name: 'Nightingale Hood',
    type: 'apparel',
    subtype: 'helmet',
    description: 'Hood that enhances illusion magic.',
    lore: 'The hood masks the wearer\'s identity and enhances their magical abilities.',
    value: 1500,
    weight: 2,
    rarity: 'epic',
    armor: 12,
    enchantment: '+15 Illusion',
    enchantmentPower: 30,
    effects: [
      { type: 'fortify', stat: 'Illusion', value: 15, description: '+15% Illusion effectiveness' },
    ],
    location: 'Twilight Sepulcher',
    questRequired: 'Trinity Restored',
    setId: 'nightingale',
  },
  // Archmage Robes
  archmage_robes: {
    id: 'archmage_robes',
    name: "Archmage's Robes",
    type: 'apparel',
    subtype: 'body',
    description: 'The ceremonial robes of the Archmage of Winterhold.',
    lore: 'Only the most accomplished mage is permitted to wear these robes.',
    value: 3500,
    weight: 1,
    rarity: 'legendary',
    armor: 0,
    enchantment: '+50 Magicka, +100% Magicka Regen, -15% spell cost',
    enchantmentPower: 60,
    effects: [
      { type: 'fortify', stat: 'magicka', value: 50, description: '+50 Magicka' },
      { type: 'fortify', stat: 'magicka_regen', value: 100, description: '+100% Magicka Regeneration' },
      { type: 'fortify', stat: 'spell_cost', value: 15, description: '-15% spell cost (all schools)' },
    ],
    location: 'College of Winterhold',
    questRequired: 'The Eye of Magnus',
    setId: 'archmage',
  },
  morokei: {
    id: 'morokei',
    name: 'Morokei',
    type: 'apparel',
    subtype: 'helmet',
    description: 'Dragon Priest mask of the glorious.',
    lore: 'Morokei ruled over a vast domain of the ancient Dragon Cult.',
    value: 3000,
    weight: 4,
    rarity: 'legendary',
    armor: 5,
    enchantment: '+100% Magicka Regeneration',
    enchantmentPower: 50,
    effects: [
      { type: 'fortify', stat: 'magicka_regen', value: 100, description: '+100% Magicka Regeneration' },
    ],
    location: 'Labyrinthian',
    questRequired: 'The Staff of Magnus',
  },
  // Dragon Priest Masks
  konahrik: {
    id: 'konahrik',
    name: 'Konahrik',
    type: 'apparel',
    subtype: 'helmet',
    description: 'The golden mask of the highest Dragon Priest.',
    lore: 'Konahrik means "Warlord" in the dragon tongue. This mask channels the power of all Dragon Priests.',
    value: 8000,
    weight: 6,
    rarity: 'legendary',
    armor: 24,
    enchantment: 'Chance to heal and call a Dragon Priest ally at low health',
    enchantmentPower: 100,
    effects: [
      { type: 'special', value: 1, description: 'When health is low: heal + summon spectral Dragon Priest' },
    ],
    location: 'Bromjunaar Sanctuary',
  },
  krosis: {
    id: 'krosis',
    name: 'Krosis',
    type: 'apparel',
    subtype: 'helmet',
    description: 'Dragon Priest mask of sorrow.',
    lore: 'Krosis was a Dragon Priest who specialized in stealth and archery.',
    value: 2500,
    weight: 4,
    rarity: 'epic',
    armor: 21,
    enchantment: '+20 Lockpicking, Archery, Alchemy',
    enchantmentPower: 40,
    effects: [
      { type: 'fortify', stat: 'Lockpicking', value: 20, description: '+20 Lockpicking' },
      { type: 'fortify', stat: 'Archery', value: 20, description: '+20 Archery' },
      { type: 'fortify', stat: 'Alchemy', value: 20, description: '+20 Alchemy' },
    ],
    location: 'Shearpoint',
  },
};

// ========== ITEM SETS ==========

export const ITEM_SETS: Record<string, ItemSet> = {
  nightingale: {
    id: 'nightingale',
    name: 'Nightingale Set',
    description: 'The sacred equipment of Nocturnal\'s agents.',
    pieces: ['nightingale_armor', 'nightingale_boots', 'nightingale_gloves', 'nightingale_hood', 'nightingale_blade'],
    bonuses: [
      {
        piecesRequired: 2,
        description: 'Shadow\'s Grace: +10% Sneak',
        effects: [{ type: 'fortify', stat: 'Sneak', value: 10, description: '+10% Sneak effectiveness' }],
      },
      {
        piecesRequired: 3,
        description: 'Nocturnal\'s Favor: +15% better prices at night',
        effects: [{ type: 'fortify', stat: 'prices_night', value: 15, description: '+15% better prices at night' }],
      },
      {
        piecesRequired: 5,
        description: 'Agent of Strife: Once per day, become invisible for 30 seconds',
        effects: [{ type: 'special', value: 30, description: 'Daily invisibility (30 seconds)' }],
      },
    ],
  },
  archmage: {
    id: 'archmage',
    name: "Archmage's Regalia",
    description: 'The complete ensemble of the Archmage of Winterhold.',
    pieces: ['archmage_robes', 'morokei'],
    bonuses: [
      {
        piecesRequired: 2,
        description: 'Magical Mastery: Spells cost 25% less to cast',
        effects: [{ type: 'fortify', stat: 'spell_cost', value: 25, description: '-25% spell cost (all schools)' }],
      },
    ],
  },
  ancient_dark_brotherhood: {
    id: 'ancient_dark_brotherhood',
    name: 'Ancient Dark Brotherhood Set',
    description: 'The armor worn by the original Brotherhood assassins.',
    pieces: ['ancient_shrouded_armor', 'ancient_shrouded_boots', 'ancient_shrouded_gloves', 'ancient_shrouded_cowl'],
    bonuses: [
      {
        piecesRequired: 2,
        description: 'Silent Killer: +15% Sneak Attack damage',
        effects: [{ type: 'fortify', stat: 'sneak_attack', value: 15, description: '+15% sneak attack damage' }],
      },
      {
        piecesRequired: 4,
        description: 'Sithis\' Embrace: 25% chance to ignore damage when near death',
        effects: [{ type: 'special', value: 25, description: '25% chance to ignore fatal blow' }],
      },
    ],
  },
  dragonplate: {
    id: 'dragonplate',
    name: 'Dragonplate Set',
    description: 'Armor forged from the bones and scales of dragons.',
    pieces: ['dragonplate_armor', 'dragonplate_boots', 'dragonplate_gauntlets', 'dragonplate_helmet', 'dragonplate_shield'],
    bonuses: [
      {
        piecesRequired: 2,
        description: 'Dragon Resistance: +10% Fire and Frost resistance',
        effects: [
          { type: 'resist', stat: 'fire', value: 10, description: '+10% fire resistance' },
          { type: 'resist', stat: 'frost', value: 10, description: '+10% frost resistance' },
        ],
      },
      {
        piecesRequired: 4,
        description: 'Dragonborn\'s Vigor: +25 Health, +25 Stamina',
        effects: [
          { type: 'fortify', stat: 'health', value: 25, description: '+25 Health' },
          { type: 'fortify', stat: 'stamina', value: 25, description: '+25 Stamina' },
        ],
      },
      {
        piecesRequired: 5,
        description: 'Fury of the Dovah: Power attacks deal 15% more damage',
        effects: [{ type: 'fortify', stat: 'power_attack', value: 15, description: '+15% power attack damage' }],
      },
    ],
  },
  daedric: {
    id: 'daedric',
    name: 'Daedric Set',
    description: 'Armor forged with the essence of Daedra.',
    pieces: ['daedric_armor', 'daedric_boots', 'daedric_gauntlets', 'daedric_helmet', 'daedric_shield'],
    bonuses: [
      {
        piecesRequired: 2,
        description: 'Oblivion\'s Touch: +5 Fire damage on melee attacks',
        effects: [{ type: 'damage', stat: 'fire', value: 5, description: '+5 fire damage on melee attacks' }],
      },
      {
        piecesRequired: 4,
        description: 'Daedric Fortitude: +50 Health',
        effects: [{ type: 'fortify', stat: 'health', value: 50, description: '+50 Health' }],
      },
      {
        piecesRequired: 5,
        description: 'Heart of Oblivion: 10% chance to reflect melee damage',
        effects: [{ type: 'special', value: 10, description: '10% chance to reflect melee damage' }],
      },
    ],
  },
};

// ========== HELPER FUNCTIONS ==========

export function getAllUniqueItems(): UniqueItem[] {
  return [...Object.values(UNIQUE_WEAPONS), ...Object.values(UNIQUE_ARMOR)];
}

export function getUniqueItem(itemId: string): UniqueItem | null {
  return UNIQUE_WEAPONS[itemId] || UNIQUE_ARMOR[itemId] || null;
}

export function isUniqueItem(itemName: string): boolean {
  const allUniques = getAllUniqueItems();
  return allUniques.some(item => item.name.toLowerCase() === itemName.toLowerCase());
}

export function getItemSet(setId: string): ItemSet | null {
  return ITEM_SETS[setId] || null;
}

export function getEquippedSetPieces(equippedItems: InventoryItem[], setId: string): string[] {
  const set = ITEM_SETS[setId];
  if (!set) return [];
  
  const equippedNames = equippedItems.filter(i => i.equipped).map(i => i.name.toLowerCase());
  const allUniques = getAllUniqueItems();
  
  return set.pieces.filter(pieceId => {
    const unique = allUniques.find(u => u.id === pieceId);
    return unique && equippedNames.includes(unique.name.toLowerCase());
  });
}

export function calculateActiveSetBonuses(equippedItems: InventoryItem[]): ActiveSetBonus[] {
  const activeBonuses: ActiveSetBonus[] = [];
  
  for (const [setId, set] of Object.entries(ITEM_SETS)) {
    const equippedPieces = getEquippedSetPieces(equippedItems, setId);
    
    if (equippedPieces.length >= 2) {
      const activeBonusList = set.bonuses.filter(b => equippedPieces.length >= b.piecesRequired);
      
      if (activeBonusList.length > 0) {
        activeBonuses.push({
          setId,
          setName: set.name,
          piecesEquipped: equippedPieces.length,
          totalPieces: set.pieces.length,
          activeBonuses: activeBonusList,
        });
      }
    }
  }
  
  return activeBonuses;
}

export function calculateTotalSetEffects(equippedItems: InventoryItem[]): ItemEffect[] {
  const activeBonuses = calculateActiveSetBonuses(equippedItems);
  const allEffects: ItemEffect[] = [];
  
  for (const activeBonus of activeBonuses) {
    for (const bonus of activeBonus.activeBonuses) {
      allEffects.push(...bonus.effects);
    }
  }
  
  return allEffects;
}

// Convert unique item to inventory item
export function uniqueToInventoryItem(unique: UniqueItem, characterId: string): InventoryItem {
  return {
    id: `unique_${unique.id}_${Date.now()}`,
    characterId,
    name: unique.name,
    type: unique.type,
    description: unique.description,
    quantity: 1,
    value: unique.value,
    weight: unique.weight,
    equipped: false,
    rarity: unique.rarity,
    damage: unique.damage,
    armor: unique.armor,
    enchantment: unique.enchantment,
    enchantmentPower: unique.enchantmentPower,
    isUnique: true,
  } as InventoryItem & { isUnique: boolean };
}
