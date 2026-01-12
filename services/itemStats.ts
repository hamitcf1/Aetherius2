// Item Stats - Armor ratings and weapon damage values for shop items
// Based on Skyrim's item stats for accurate gameplay

export interface ItemStats {
  armor?: number;
  damage?: number;
  value?: number;
}

// Weapon damage values by name (case-insensitive match)
const WEAPON_STATS: Record<string, ItemStats> = {
  // === IRON WEAPONS (Tier 1) ===
  'iron dagger': { damage: 4, value: 20 },
  'iron sword': { damage: 7, value: 45 },
  'iron war axe': { damage: 8, value: 50 },
  'iron mace': { damage: 9, value: 55 },
  'iron greatsword': { damage: 14, value: 75 },
  'iron battleaxe': { damage: 15, value: 80 },
  'iron warhammer': { damage: 18, value: 85 },
  'hunting bow': { damage: 7, value: 50 },
  'iron arrows (20)': { damage: 0, value: 10 },
  
  // === STEEL WEAPONS (Tier 2) ===
  'steel dagger': { damage: 5, value: 45 },
  'steel sword': { damage: 8, value: 90 },
  'steel war axe': { damage: 9, value: 100 },
  'steel mace': { damage: 10, value: 110 },
  'steel greatsword': { damage: 17, value: 150 },
  'steel battleaxe': { damage: 18, value: 160 },
  'steel warhammer': { damage: 21, value: 170 },
  'long bow': { damage: 9, value: 80 },
  'steel arrows (20)': { damage: 0, value: 20 },
  
  // === ORCISH WEAPONS (Tier 3) ===
  'orcish dagger': { damage: 6, value: 120 },
  'orcish sword': { damage: 9, value: 225 },
  'orcish war axe': { damage: 10, value: 250 },
  'orcish mace': { damage: 11, value: 275 },
  'orcish greatsword': { damage: 18, value: 350 },
  'orcish battleaxe': { damage: 19, value: 375 },
  'orcish warhammer': { damage: 23, value: 400 },
  'orcish bow': { damage: 10, value: 200 },
  'orcish arrows (20)': { damage: 0, value: 40 },
  
  // === DWARVEN WEAPONS (Tier 4) ===
  'dwarven dagger': { damage: 7, value: 200 },
  'dwarven sword': { damage: 10, value: 375 },
  'dwarven war axe': { damage: 11, value: 415 },
  'dwarven mace': { damage: 12, value: 460 },
  'dwarven greatsword': { damage: 19, value: 580 },
  'dwarven battleaxe': { damage: 20, value: 625 },
  'dwarven warhammer': { damage: 24, value: 680 },
  'dwarven bow': { damage: 12, value: 350 },
  'dwarven arrows (20)': { damage: 0, value: 60 },
  
  // === ELVEN WEAPONS (Tier 5) ===
  'elven dagger': { damage: 8, value: 310 },
  'elven sword': { damage: 11, value: 600 },
  'elven war axe': { damage: 12, value: 660 },
  'elven mace': { damage: 13, value: 730 },
  'elven greatsword': { damage: 20, value: 920 },
  'elven battleaxe': { damage: 21, value: 1000 },
  'elven warhammer': { damage: 25, value: 1080 },
  'elven bow': { damage: 13, value: 520 },
  'elven arrows (20)': { damage: 0, value: 80 },
  
  // === GLASS WEAPONS (Tier 6) ===
  'glass dagger': { damage: 9, value: 550 },
  'glass sword': { damage: 12, value: 1050 },
  'glass war axe': { damage: 13, value: 1160 },
  'glass mace': { damage: 14, value: 280 },
  'glass greatsword': { damage: 21, value: 1620 },
  'glass battleaxe': { damage: 22, value: 1760 },
  'glass warhammer': { damage: 26, value: 1900 },
  'glass bow': { damage: 15, value: 920 },
  'glass arrows (20)': { damage: 0, value: 100 },
  
  // === EBONY WEAPONS (Tier 7) ===
  'ebony dagger': { damage: 10, value: 900 },
  'ebony sword': { damage: 13, value: 1800 },
  'ebony war axe': { damage: 14, value: 2000 },
  'ebony mace': { damage: 15, value: 2200 },
  'ebony greatsword': { damage: 22, value: 2800 },
  'ebony battleaxe': { damage: 23, value: 3050 },
  'ebony warhammer': { damage: 27, value: 3300 },
  'ebony bow': { damage: 17, value: 1600 },
  'ebony arrows (20)': { damage: 0, value: 140 },
  
  // === DAEDRIC WEAPONS (Tier 8) ===
  'daedric dagger': { damage: 11, value: 3200 },
  'daedric sword': { damage: 14, value: 3500 },
  'daedric war axe': { damage: 15, value: 3800 },
  'daedric mace': { damage: 16, value: 4100 },
  'daedric greatsword': { damage: 24, value: 5000 },
  'daedric battleaxe': { damage: 25, value: 5500 },
  'daedric warhammer': { damage: 29, value: 6000 },
  'daedric bow': { damage: 19, value: 2500 },
  'daedric arrows (20)': { damage: 0, value: 400 },
  
  // === DRAGONBONE WEAPONS (Tier 9) ===
  'dragonbone dagger': { damage: 12, value: 1050 },
  'dragonbone sword': { damage: 15, value: 2100 },
  'dragonbone war axe': { damage: 16, value: 2320 },
  'dragonbone mace': { damage: 17, value: 2540 },
  'dragonbone greatsword': { damage: 25, value: 3200 },
  'dragonbone battleaxe': { damage: 26, value: 3480 },
  'dragonbone warhammer': { damage: 28, value: 3760 },
  'dragonbone bow': { damage: 20, value: 2000 },
  'dragonbone arrows (20)': { damage: 0, value: 200 },
  
  // === SPECIAL WEAPONS ===
  'staff of flames': { damage: 15, value: 250 },
  'staff of frost': { damage: 18, value: 280 },
  'staff of lightning': { damage: 20, value: 320 },
  'enchanted hunting bow': { damage: 10, value: 180 },
  'silver sword': { damage: 8, value: 200 },
  'silver greatsword': { damage: 17, value: 350 },
  'crossbow': { damage: 19, value: 400 },
  'steel bolts (20)': { damage: 0, value: 30 },
};

// Armor rating values by name (case-insensitive match)
const ARMOR_STATS: Record<string, ItemStats> = {
  // === HIDE ARMOR (Tier 1, Light) ===
  'hide armor': { armor: 20, value: 50 },
  'hide boots': { armor: 5, value: 15 },
  'hide helmet': { armor: 10, value: 20 },
  'hide gauntlets': { armor: 5, value: 15 },
  
  // === LEATHER ARMOR (Tier 1, Light) ===
  'leather armor': { armor: 26, value: 90 },
  'leather boots': { armor: 7, value: 25 },
  'leather helmet': { armor: 12, value: 35 },
  'leather gloves': { armor: 7, value: 15 },
  
  // === CLOTHES ===
  'common clothes': { armor: 0, value: 10 },
  'fine clothes': { armor: 0, value: 100 },
  'fur cloak': { armor: 5, value: 75 },
  
  // === IRON ARMOR (Tier 2, Heavy) ===
  'iron armor': { armor: 30, value: 150 },
  'iron boots': { armor: 10, value: 45 },
  'iron helmet': { armor: 15, value: 60 },
  'iron gauntlets': { armor: 10, value: 45 },
  'iron shield': { armor: 20, value: 65 },
  
  // === STEEL ARMOR (Tier 3, Heavy) ===
  'steel armor': { armor: 36, value: 275 },
  'steel boots': { armor: 12, value: 85 },
  'steel helmet': { armor: 17, value: 110 },
  'steel gauntlets': { armor: 12, value: 85 },
  'steel shield': { armor: 24, value: 120 },
  'steel plate armor': { armor: 40, value: 400 },
  
  // === ELVEN LIGHT ARMOR (Tier 4) ===
  'elven light armor': { armor: 33, value: 350 },
  'elven boots': { armor: 8, value: 100 },
  'elven helmet': { armor: 13, value: 130 },
  'elven gauntlets': { armor: 8, value: 100 },
  'elven shield': { armor: 21, value: 180 },
  
  // === SCALED ARMOR (Tier 5, Light) ===
  'scaled armor': { armor: 37, value: 450 },
  'scaled boots': { armor: 10, value: 130 },
  'scaled helmet': { armor: 15, value: 160 },
  'scaled gauntlets': { armor: 10, value: 130 },
  
  // === ORCISH ARMOR (Tier 6, Heavy) ===
  'orcish armor': { armor: 45, value: 600 },
  'orcish boots': { armor: 15, value: 180 },
  'orcish helmet': { armor: 20, value: 220 },
  'orcish gauntlets': { armor: 15, value: 180 },
  'orcish shield': { armor: 30, value: 300 },
  
  // === DWARVEN ARMOR (Tier 7, Heavy) ===
  'dwarven armor': { armor: 50, value: 900 },
  'dwarven boots': { armor: 17, value: 270 },
  'dwarven helmet': { armor: 22, value: 330 },
  'dwarven gauntlets': { armor: 17, value: 270 },
  'dwarven shield': { armor: 33, value: 450 },
  
  // === ELVEN GILDED ARMOR (Tier 8, Light) ===
  'elven gilded armor': { armor: 42, value: 1200 },
  'elven gilded boots': { armor: 11, value: 350 },
  'elven gilded helmet': { armor: 16, value: 430 },
  'elven gilded gauntlets': { armor: 11, value: 350 },
  
  // === GLASS ARMOR (Tier 9, Light) ===
  'glass armor': { armor: 48, value: 1600 },
  'glass boots': { armor: 13, value: 480 },
  'glass helmet': { armor: 18, value: 580 },
  'glass gauntlets': { armor: 13, value: 480 },
  'glass shield': { armor: 35, value: 800 },
  
  // === DRAGONSCALE ARMOR (Tier 10, Light) ===
  'dragonscale armor': { armor: 56, value: 2500 },
  'dragonscale boots': { armor: 15, value: 750 },
  'dragonscale helmet': { armor: 20, value: 900 },
  'dragonscale gauntlets': { armor: 15, value: 750 },
  'dragonscale shield': { armor: 40, value: 1200 },
  
  // === EBONY ARMOR (Tier 11, Heavy) ===
  'ebony armor': { armor: 60, value: 3500 },
  'ebony boots': { armor: 20, value: 1050 },
  'ebony helmet': { armor: 25, value: 1260 },
  'ebony gauntlets': { armor: 20, value: 1050 },
  'ebony shield': { armor: 42, value: 1700 },
  
  // === DRAGONPLATE ARMOR (Tier 12, Heavy) ===
  'dragonplate armor': { armor: 68, value: 5000 },
  'dragonplate boots': { armor: 22, value: 1500 },
  'dragonplate helmet': { armor: 27, value: 1800 },
  'dragonplate gauntlets': { armor: 22, value: 1500 },
  'dragonplate shield': { armor: 46, value: 2400 },
  
  // === DAEDRIC ARMOR (Tier 13, Heavy) ===
  'daedric armor': { armor: 72, value: 8000 },
  'daedric boots': { armor: 24, value: 2400 },
  'daedric helmet': { armor: 29, value: 2880 },
  'daedric gauntlets': { armor: 24, value: 2400 },
  'daedric shield': { armor: 50, value: 3900 },
  
  // === JEWELRY ===
  'gold ring': { armor: 0, value: 75 },
  'silver ring': { armor: 0, value: 40 },
  'gold necklace': { armor: 0, value: 120 },
  'silver necklace': { armor: 0, value: 60 },
  'gold circlet': { armor: 0, value: 150 },
};

/**
 * Get stats for an item by name
 * Returns armor and/or damage stats if the item is a weapon or armor
 */
export function getItemStats(itemName: string, itemType?: string): ItemStats {
  const nameLower = itemName.toLowerCase();
  
  // Check weapons first
  if (itemType === 'weapon' || !itemType) {
    const weaponStats = WEAPON_STATS[nameLower];
    if (weaponStats) return weaponStats;
  }
  
  // Check armor
  if (itemType === 'apparel' || !itemType) {
    const armorStats = ARMOR_STATS[nameLower];
    if (armorStats) return armorStats;
  }
  
  // Fallback - try to estimate based on keywords and type
  if (itemType === 'weapon') {
    // Estimate weapon damage
    if (nameLower.includes('dagger')) return { damage: 5, value: 20 };
    if (nameLower.includes('sword')) return { damage: 8, value: 50 };
    if (nameLower.includes('axe')) return { damage: 9, value: 55 };
    if (nameLower.includes('mace')) return { damage: 10, value: 60 };
    if (nameLower.includes('hammer')) return { damage: 12, value: 70 };
    if (nameLower.includes('bow')) return { damage: 8, value: 40 };
    if (nameLower.includes('staff')) return { damage: 10, value: 100 };
    return { damage: 5, value: 20 };
  }
  
  if (itemType === 'apparel') {
    // Estimate armor rating
    if (nameLower.includes('helmet') || nameLower.includes('hood')) return { armor: 10, value: 30 };
    if (nameLower.includes('armor') || nameLower.includes('cuirass')) return { armor: 25, value: 100 };
    if (nameLower.includes('boot') || nameLower.includes('shoe')) return { armor: 8, value: 25 };
    if (nameLower.includes('gauntlet') || nameLower.includes('glove')) return { armor: 8, value: 25 };
    if (nameLower.includes('shield')) return { armor: 20, value: 50 };
    if (nameLower.includes('ring') || nameLower.includes('necklace') || nameLower.includes('amulet')) return { armor: 0, value: 50 };
    if (nameLower.includes('robe') || nameLower.includes('clothes')) return { armor: 0, value: 30 };
    return { armor: 10, value: 25 };
  }
  
  return {};
}

/**
 * Check if an item should have stats applied
 */
export function shouldHaveStats(itemType: string): boolean {
  return itemType === 'weapon' || itemType === 'apparel';
}

/**
 * Check if an item name exists in the defined core item sets
 * Returns true when item is a core weapon or armor with defined stats
 */
export function isValidCoreItem(itemName: string, itemType?: string): boolean {
  const nameLower = itemName.toLowerCase();
  if (itemType === 'weapon' || !itemType) {
    if (WEAPON_STATS[nameLower]) return true;
  }
  if (itemType === 'apparel' || !itemType) {
    if (ARMOR_STATS[nameLower]) return true;
  }
  return false;
}
