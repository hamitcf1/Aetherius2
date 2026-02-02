import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { X, ShoppingBag, Coins, Search, Package, Sword, Shield, FlaskConical, Tent, Apple, Droplets, ArrowDownToLine, ArrowUpFromLine, Check, Gem, Star } from 'lucide-react';
import RarityBadge from './RarityBadge';
import { useAppContext } from '../AppContext';
import type { InventoryItem } from '../types';
import { useLocalization } from '../services/localization';
import { getItemName } from '../services/itemLocalization';
import { playSoundEffect } from '../services/audioService';
import { getItemStats, shouldHaveStats } from '../services/itemStats';
import { SortSelector } from './GameFeatures';
import { getFoodNutritionDisplay, getDrinkNutritionDisplay } from '../services/nutritionData';
import { getShopSpecials } from '../services/shopService';
import { ParticleEffect } from './SpellEffects';


export interface ShopItem {
  id: string;
  name: string;
  type: 'weapon' | 'apparel' | 'potion' | 'ingredient' | 'misc' | 'food' | 'drink' | 'camping';
  description: string;
  price: number;
  category: string;
  requiredLevel?: number; // Optional level requirement to unlock item in shop
  subtype?: 'health' | 'magicka' | 'stamina';
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// Comprehensive Skyrim-themed shop inventory
export const SHOP_INVENTORY: ShopItem[] = [
  // === FOOD ===
  { id: 'bread', name: 'Bread', type: 'food', description: 'A fresh loaf of bread. Restores hunger.', price: 2, category: 'Food' },
  { id: 'apple', name: 'Apple', type: 'food', description: 'A crisp red apple from the orchards.', price: 1, category: 'Food' },
  { id: 'cheese_wheel', name: 'Cheese Wheel', type: 'food', description: 'A wheel of aged cheese. Very filling.', price: 10, category: 'Food' },
  { id: 'venison', name: 'Cooked Venison', type: 'food', description: 'Tender deer meat, roasted over a fire.', price: 8, category: 'Food' },
  { id: 'salmon_steak', name: 'Grilled Salmon', type: 'food', description: 'Fresh salmon from the rivers of Skyrim.', price: 6, category: 'Food' },
  { id: 'sweetroll', name: 'Sweetroll', type: 'food', description: 'A delicious pastry. Nobody will steal this one.', price: 5, category: 'Food' },
  { id: 'beef_stew', name: 'Beef Stew', type: 'food', description: 'Hearty stew that warms the soul. Very filling.', price: 15, category: 'Food' },
  { id: 'cabbage', name: 'Cabbage', type: 'food', description: 'A leafy green vegetable.', price: 1, category: 'Food' },
  { id: 'potato', name: 'Potato', type: 'food', description: 'A starchy tuber from the fields.', price: 1, category: 'Food' },
  { id: 'leek', name: 'Leek', type: 'food', description: 'A pungent vegetable used in soups.', price: 1, category: 'Food' },
  { id: 'rabbit_haunch', name: 'Rabbit Haunch', type: 'food', description: 'A leg of roasted rabbit.', price: 4, category: 'Food' },
  { id: 'mammoth_snout', name: 'Mammoth Snout', type: 'food', description: 'An exotic delicacy from giant beasts.', price: 25, category: 'Food' },
  { id: 'horker_meat', name: 'Horker Meat', type: 'food', description: 'Fatty meat from the northern shores.', price: 5, category: 'Food' },
  { id: 'travel_rations', name: 'Travel Rations', type: 'food', description: 'Dried meat, hardtack, and nuts. Lasts on the road.', price: 20, category: 'Food' },

  // === DRINKS ===
  { id: 'water_skin', name: 'Water Skin', type: 'drink', description: 'Fresh water in a leather skin. Quenches thirst.', price: 3, category: 'Drinks' },
  { id: 'alto_wine', name: 'Alto Wine', type: 'drink', description: 'Fine wine from Cyrodiil. Refreshing.', price: 12, category: 'Drinks' },
  { id: 'nord_mead', name: 'Nord Mead', type: 'drink', description: 'Honey mead brewed in the traditional way.', price: 8, category: 'Drinks' },
  { id: 'black_briar_mead', name: 'Black-Briar Mead', type: 'drink', description: 'Premium mead from Riften. Smooth and potent.', price: 20, category: 'Drinks' },
  { id: 'ale', name: 'Ale', type: 'drink', description: 'A common tavern drink. Gets the job done.', price: 5, category: 'Drinks' },
  { id: 'milk', name: 'Milk', type: 'drink', description: 'Fresh cow milk. Wholesome.', price: 2, category: 'Drinks' },
  { id: 'spiced_wine', name: 'Spiced Wine', type: 'drink', description: 'Wine infused with exotic spices. Warms you up.', price: 15, category: 'Drinks' },
  { id: 'skooma', name: 'Skooma', type: 'drink', description: 'Illegal moon sugar brew. Buyer beware.', price: 50, category: 'Drinks' },

  // === POTIONS ===
  { id: 'health_potion_minor', name: 'Minor Health Potion', type: 'potion', description: 'Restores 25 health.', price: 15, category: 'Potions' },
  { id: 'health_potion', name: 'Health Potion', type: 'potion', subtype: 'health', description: 'Restores 50 health.', price: 35, category: 'Potions' },
  { id: 'health_potion_major', name: 'Plentiful Health Potion', type: 'potion', subtype: 'health', description: 'Restores 100 health.', price: 75, category: 'Potions' },
  { id: 'magicka_potion_minor', name: 'Minor Magicka Potion', type: 'potion', description: 'Restores 25 magicka.', price: 15, category: 'Potions' },
  { id: 'magicka_potion', name: 'Magicka Potion', type: 'potion', subtype: 'magicka', description: 'Restores 50 magicka.', price: 35, category: 'Potions' },
  { id: 'magicka_potion_major', name: 'Plentiful Magicka Potion', type: 'potion', subtype: 'magicka', description: 'Restores 100 magicka.', price: 75, category: 'Potions' },
  { id: 'stamina_potion_minor', name: 'Minor Stamina Potion', type: 'potion', description: 'Restores 25 stamina.', price: 15, category: 'Potions' },
  { id: 'stamina_potion', name: 'Stamina Potion', type: 'potion', subtype: 'stamina', description: 'Restores 50 stamina.', price: 35, category: 'Potions' },
  { id: 'stamina_potion_major', name: 'Plentiful Stamina Potion', type: 'potion', subtype: 'stamina', description: 'Restores 100 stamina.', price: 75, category: 'Potions' },

  // === CAMPING / SURVIVAL ===
  { id: 'bedroll', name: 'Bedroll', type: 'camping', description: 'A simple bedroll for sleeping outdoors. Basic rest.', price: 25, category: 'Camping' },
  { id: 'tent', name: 'Traveler\'s Tent', type: 'camping', description: 'A sturdy canvas tent. Better sleep when camping.', price: 100, category: 'Camping' },
  { id: 'camping_kit', name: 'Camping Kit', type: 'camping', description: 'Tent, bedroll, and cooking pot. Full wilderness setup.', price: 200, category: 'Camping' },
  { id: 'firewood', name: 'Firewood Bundle', type: 'camping', description: 'Dry wood for campfires. Essential for cold nights.', price: 5, category: 'Camping' },
  { id: 'cooking_pot', name: 'Cooking Pot', type: 'camping', description: 'A portable pot for making stews and soups.', price: 30, category: 'Camping' },
  { id: 'fur_blanket', name: 'Fur Blanket', type: 'camping', description: 'A warm fur blanket. Improves rest quality.', price: 45, category: 'Camping' },
  { id: 'torch', name: 'Torch', type: 'misc', description: 'A wooden torch. Lights your way in darkness.', price: 2, category: 'Camping' },
  { id: 'lantern', name: 'Lantern', type: 'misc', description: 'An oil lantern. Long-lasting light source.', price: 25, category: 'Camping' },

  // === WEAPONS ===
  // Tier 1: Starting Weapons (Level 1+)
  { id: 'iron_dagger', name: 'Iron Dagger', type: 'weapon', description: 'A simple iron dagger. Lightweight and fast.', price: 20, category: 'Weapons' },
  { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', description: 'A standard iron sword. Reliable.', price: 45, category: 'Weapons' },
  { id: 'iron_war_axe', name: 'Iron War Axe', type: 'weapon', description: 'A brutal chopping weapon.', price: 50, category: 'Weapons' },
  { id: 'iron_mace', name: 'Iron Mace', type: 'weapon', description: 'A heavy crushing weapon.', price: 55, category: 'Weapons' },
  { id: 'iron_greatsword', name: 'Iron Greatsword', type: 'weapon', description: 'A massive two-handed blade.', price: 75, category: 'Weapons' },
  { id: 'iron_battleaxe', name: 'Iron Battleaxe', type: 'weapon', description: 'A two-handed axe for heavy strikes.', price: 80, category: 'Weapons' },
  { id: 'iron_warhammer', name: 'Iron Warhammer', type: 'weapon', description: 'A massive crushing weapon. Very heavy.', price: 85, category: 'Weapons' },
  { id: 'hunting_bow', name: 'Hunting Bow', type: 'weapon', description: 'A simple wooden bow for hunting.', price: 50, category: 'Weapons' },
  { id: 'iron_arrows', name: 'Iron Arrows (20)', type: 'weapon', description: 'A bundle of iron-tipped arrows.', price: 10, category: 'Weapons' },

  // Basic Staves (Level 1+) - For new mage characters
  { id: 'novice_staff', name: 'Novice Staff', type: 'weapon', description: 'A simple wooden staff for apprentice mages. Channels basic magical energy.', price: 35, category: 'Weapons' },
  { id: 'basic_staff_sparks', name: 'Basic Staff of Sparks', type: 'weapon', description: 'A crude staff that channels weak shock magic. Good for beginners.', price: 55, category: 'Weapons' },
  { id: 'basic_staff_flames', name: 'Basic Staff of Flames', type: 'weapon', description: 'A worn staff that shoots small fireballs. Entry-level destruction.', price: 55, category: 'Weapons' },
  { id: 'basic_staff_frost', name: 'Basic Staff of Frostbite', type: 'weapon', description: 'An old staff that emits frost. Chills enemies slightly.', price: 55, category: 'Weapons' },
  { id: 'apprentice_staff', name: 'Apprentice Staff', type: 'weapon', description: 'A better crafted staff for developing mages. Improved magical channeling.', price: 80, category: 'Weapons', requiredLevel: 3 },

  // Tier 2: Steel Weapons (Level 5+)
  { id: 'steel_dagger', name: 'Steel Dagger', type: 'weapon', description: 'Sharp steel dagger. Fast attacks.', price: 45, category: 'Weapons', requiredLevel: 5 },
  { id: 'steel_sword', name: 'Steel Sword', type: 'weapon', description: 'A well-crafted steel blade.', price: 90, category: 'Weapons', requiredLevel: 5 },
  { id: 'steel_war_axe', name: 'Steel War Axe', type: 'weapon', description: 'Sharp steel axe. Reliable damage.', price: 100, category: 'Weapons', requiredLevel: 5 },
  { id: 'steel_mace', name: 'Steel Mace', type: 'weapon', description: 'Heavy steel mace. Crushes armor.', price: 110, category: 'Weapons', requiredLevel: 5 },
  { id: 'steel_greatsword', name: 'Steel Greatsword', type: 'weapon', description: 'Large steel blade. Powerful swings.', price: 150, category: 'Weapons', requiredLevel: 5 },
  { id: 'steel_battleaxe', name: 'Steel Battleaxe', type: 'weapon', description: 'Two-handed steel axe. Devastating.', price: 160, category: 'Weapons', requiredLevel: 5 },
  { id: 'steel_warhammer', name: 'Steel Warhammer', type: 'weapon', description: 'Massive steel hammer. Breaks bones.', price: 170, category: 'Weapons', requiredLevel: 5 },
  { id: 'long_bow', name: 'Long Bow', type: 'weapon', description: 'A longer bow with better range.', price: 80, category: 'Weapons', requiredLevel: 5 },
  { id: 'steel_arrows', name: 'Steel Arrows (20)', type: 'weapon', description: 'A bundle of steel-tipped arrows.', price: 20, category: 'Weapons', requiredLevel: 5 },
  // Elemental & specialty arrows
  { id: 'fire_arrows', name: 'Fire Arrows (10)', type: 'weapon', description: 'Arrows tipped in flammable oil and coal. Adds fire damage and burning.', price: 30, category: 'Weapons' },
  { id: 'ice_arrows', name: 'Ice Arrows (10)', type: 'weapon', description: 'Arrows infused with frost — chills and may slow targets.', price: 30, category: 'Weapons' },
  { id: 'shock_arrows', name: 'Shock Arrows (10)', type: 'weapon', description: 'Conductive-tipped arrows that deal shock damage and may stun.', price: 35, category: 'Weapons' },
  { id: 'paralyze_arrows', name: 'Paralyze Arrows (5)', type: 'weapon', description: 'Special toxins that can paralyze a target briefly.', price: 45, category: 'Weapons' },
  { id: 'allycall_arrows', name: 'Command Arrows (5)', type: 'weapon', description: 'A signal arrow that commands a nearby ally to strike the target.', price: 50, category: 'Weapons' },

  // === Curated mid-tier items (new): balanced, level-gated, varied rarities ===
  { id: 'travelers_shortsword', name: "Traveler's Shortsword", type: 'weapon', description: 'A light, well-balanced shortsword for travelers.', price: 35, category: 'Weapons', requiredLevel: 1, rarity: 'common' },
  { id: 'explorers_boots', name: "Explorer's Boots", type: 'apparel', description: 'Sturdy boots that aid long journeys. Slightly improves stamina recovery.', price: 45, category: 'Armor', requiredLevel: 2, rarity: 'common' },
  { id: 'hunter_cloak', name: "Hunter's Cloak", type: 'apparel', description: 'A weatherproof cloak favored by hunters; light and warm.', price: 85, category: 'Armor', requiredLevel: 3, rarity: 'uncommon' },
  { id: 'spiked_buckler', name: 'Spiked Buckler', type: 'apparel', description: 'A small shield with menacing spikes — good for parry-and-thrust tactics.', price: 120, category: 'Armor', requiredLevel: 4, rarity: 'uncommon' },
  { id: 'honed_steel_longsword', name: 'Honed Steel Longsword', type: 'weapon', description: 'A well-forged longsword with a keen edge.', price: 135, category: 'Weapons', requiredLevel: 6, rarity: 'uncommon' },
  { id: 'frosted_dagger', name: 'Frosted Dagger', type: 'weapon', description: 'A dagger etched with frost runes. Better vs. lightly armored foes.', price: 260, category: 'Weapons', requiredLevel: 12, rarity: 'rare' },
  { id: 'emberbrand_staff', name: 'Emberbrand Staff', type: 'weapon', description: 'A staff that channels fiery bursts. Preferred by battle-mages.', price: 420, category: 'Weapons', requiredLevel: 14, rarity: 'rare' },
  { id: 'stormcall_bow', name: 'Stormcall Bow', type: 'weapon', description: 'A bow that hums with lightning; excels at mid-range engagements.', price: 680, category: 'Weapons', requiredLevel: 18, rarity: 'rare' },

  // Tier 3: Orcish Weapons (Level 10+)
  { id: 'orcish_dagger', name: 'Orcish Dagger', type: 'weapon', description: 'Crude but effective Orcish blade.', price: 120, category: 'Weapons', requiredLevel: 10 },
  { id: 'orcish_sword', name: 'Orcish Sword', type: 'weapon', description: 'Heavy Orcish blade. Strong and brutal.', price: 225, category: 'Weapons', requiredLevel: 10 },
  { id: 'orcish_war_axe', name: 'Orcish War Axe', type: 'weapon', description: 'Fierce Orcish axe. Intimidating.', price: 250, category: 'Weapons', requiredLevel: 10 },
  { id: 'orcish_mace', name: 'Orcish Mace', type: 'weapon', description: 'Brutal Orcish mace. Smashes foes.', price: 275, category: 'Weapons', requiredLevel: 10 },
  { id: 'orcish_greatsword', name: 'Orcish Greatsword', type: 'weapon', description: 'Massive Orcish blade. Very heavy.', price: 350, category: 'Weapons', requiredLevel: 10 },
  { id: 'orcish_battleaxe', name: 'Orcish Battleaxe', type: 'weapon', description: 'Two-handed Orcish axe. Terrifying.', price: 375, category: 'Weapons', requiredLevel: 10 },
  { id: 'orcish_warhammer', name: 'Orcish Warhammer', type: 'weapon', description: 'Huge Orcish hammer. Crushes anything.', price: 400, category: 'Weapons', requiredLevel: 10 },
  { id: 'orcish_bow', name: 'Orcish Bow', type: 'weapon', description: 'Strong Orcish bow. High damage.', price: 200, category: 'Weapons', requiredLevel: 10 },
  { id: 'orcish_arrows', name: 'Orcish Arrows (20)', type: 'weapon', description: 'Heavy Orcish arrows. Extra damage.', price: 40, category: 'Weapons', requiredLevel: 10 },

  // Tier 4: Dwarven Weapons (Level 15+)
  { id: 'dwarven_dagger', name: 'Dwarven Dagger', type: 'weapon', description: 'Ancient Dwarven craftwork. Razor sharp.', price: 200, category: 'Weapons', requiredLevel: 15 },
  { id: 'dwarven_sword', name: 'Dwarven Sword', type: 'weapon', description: 'Dwarven metal blade. Excellent balance.', price: 375, category: 'Weapons', requiredLevel: 15 },
  { id: 'dwarven_war_axe', name: 'Dwarven War Axe', type: 'weapon', description: 'Dwarven axe with precise edge.', price: 425, category: 'Weapons', requiredLevel: 15 },
  { id: 'dwarven_mace', name: 'Dwarven Mace', type: 'weapon', description: 'Heavy Dwarven mace. Superior design.', price: 450, category: 'Weapons', requiredLevel: 15 },
  { id: 'dwarven_greatsword', name: 'Dwarven Greatsword', type: 'weapon', description: 'Large Dwarven blade. Ancient power.', price: 600, category: 'Weapons', requiredLevel: 15 },
  { id: 'dwarven_battleaxe', name: 'Dwarven Battleaxe', type: 'weapon', description: 'Massive Dwarven axe. Legendary craftsmanship.', price: 650, category: 'Weapons', requiredLevel: 15 },
  { id: 'dwarven_warhammer', name: 'Dwarven Warhammer', type: 'weapon', description: 'Ancient Dwarven hammer. Unstoppable.', price: 700, category: 'Weapons', requiredLevel: 15 },
  { id: 'dwarven_bow', name: 'Dwarven Bow', type: 'weapon', description: 'Dwarven mechanical bow. Precise.', price: 350, category: 'Weapons', requiredLevel: 15 },
  { id: 'dwarven_arrows', name: 'Dwarven Arrows (20)', type: 'weapon', description: 'Precision Dwarven arrows.', price: 60, category: 'Weapons', requiredLevel: 15 },

  // Tier 5: Elven Weapons (Level 20+)
  { id: 'elven_dagger', name: 'Elven Dagger', type: 'weapon', description: 'Elegant Elven blade. Graceful and deadly.', price: 300, category: 'Weapons', requiredLevel: 20 },
  { id: 'elven_sword', name: 'Elven Sword', type: 'weapon', description: 'Beautiful Elven sword. Swift strikes.', price: 550, category: 'Weapons', requiredLevel: 20 },
  { id: 'elven_war_axe', name: 'Elven War Axe', type: 'weapon', description: 'Refined Elven axe. Perfect balance.', price: 625, category: 'Weapons', requiredLevel: 20 },
  { id: 'elven_mace', name: 'Elven Mace', type: 'weapon', description: 'Elegant Elven mace. Surprising power.', price: 650, category: 'Weapons', requiredLevel: 20 },
  { id: 'elven_greatsword', name: 'Elven Greatsword', type: 'weapon', description: 'Majestic Elven greatsword. Masterwork.', price: 900, category: 'Weapons', requiredLevel: 20 },
  { id: 'elven_battleaxe', name: 'Elven Battleaxe', type: 'weapon', description: 'Graceful yet deadly Elven axe.', price: 950, category: 'Weapons', requiredLevel: 20 },
  { id: 'elven_warhammer', name: 'Elven Warhammer', type: 'weapon', description: 'Rare Elven warhammer. Incredibly strong.', price: 1000, category: 'Weapons', requiredLevel: 20 },
  { id: 'elven_bow', name: 'Elven Bow', type: 'weapon', description: 'Exquisite Elven bow. Superior range.', price: 500, category: 'Weapons', requiredLevel: 20 },
  { id: 'elven_arrows', name: 'Elven Arrows (20)', type: 'weapon', description: 'Fine Elven arrows. Very accurate.', price: 80, category: 'Weapons', requiredLevel: 20 },

  // Tier 6: Glass Weapons (Level 25+)
  { id: 'glass_dagger', name: 'Glass Dagger', type: 'weapon', description: 'Malachite glass blade. Incredibly sharp.', price: 500, category: 'Weapons', requiredLevel: 25 },
  { id: 'glass_sword', name: 'Glass Sword', type: 'weapon', description: 'Green glass sword. Cuts through armor.', price: 900, category: 'Weapons', requiredLevel: 25 },
  { id: 'glass_war_axe', name: 'Glass War Axe', type: 'weapon', description: 'Glass axe. Razor-sharp edge.', price: 1000, category: 'Weapons', requiredLevel: 25 },
  { id: 'glass_mace', name: 'Glass Mace', type: 'weapon', description: 'Glass mace. Shatters defenses.', price: 1100, category: 'Weapons', requiredLevel: 25 },
  { id: 'glass_greatsword', name: 'Glass Greatsword', type: 'weapon', description: 'Massive glass blade. Devastating cuts.', price: 1500, category: 'Weapons', requiredLevel: 25 },
  { id: 'glass_battleaxe', name: 'Glass Battleaxe', type: 'weapon', description: 'Two-handed glass axe. Unmatched sharpness.', price: 1600, category: 'Weapons', requiredLevel: 25 },
  { id: 'glass_warhammer', name: 'Glass Warhammer', type: 'weapon', description: 'Glass warhammer. Breaks everything.', price: 1700, category: 'Weapons', requiredLevel: 25 },
  { id: 'glass_bow', name: 'Glass Bow', type: 'weapon', description: 'Beautiful glass bow. Incredible power.', price: 850, category: 'Weapons', requiredLevel: 25 },
  { id: 'glass_arrows', name: 'Glass Arrows (20)', type: 'weapon', description: 'Glass-tipped arrows. Maximum damage.', price: 120, category: 'Weapons', requiredLevel: 25 },

  // Tier 7: Ebony Weapons (Level 30+)
  { id: 'ebony_dagger', name: 'Ebony Dagger', type: 'weapon', description: 'Black ebony dagger. Legendary craftsmanship.', price: 800, category: 'Weapons', requiredLevel: 30 },
  { id: 'ebony_sword', name: 'Ebony Sword', type: 'weapon', description: 'Dark ebony sword. Extremely powerful.', price: 1500, category: 'Weapons', requiredLevel: 30 },
  { id: 'ebony_war_axe', name: 'Ebony War Axe', type: 'weapon', description: 'Ebony axe. Fearsome weapon.', price: 1700, category: 'Weapons', requiredLevel: 30 },
  { id: 'ebony_mace', name: 'Ebony Mace', type: 'weapon', description: 'Ebony mace. Unstoppable force.', price: 1800, category: 'Weapons', requiredLevel: 30 },
  { id: 'ebony_greatsword', name: 'Ebony Greatsword', type: 'weapon', description: 'Massive ebony blade. Near-legendary.', price: 2500, category: 'Weapons', requiredLevel: 30 },
  { id: 'ebony_battleaxe', name: 'Ebony Battleaxe', type: 'weapon', description: 'Two-handed ebony axe. Decimates foes.', price: 2700, category: 'Weapons', requiredLevel: 30 },
  { id: 'ebony_warhammer', name: 'Ebony Warhammer', type: 'weapon', description: 'Ebony warhammer. Crushes all.', price: 2900, category: 'Weapons', requiredLevel: 30 },
  { id: 'ebony_bow', name: 'Ebony Bow', type: 'weapon', description: 'Black ebony bow. Supreme power.', price: 1400, category: 'Weapons', requiredLevel: 30 },
  { id: 'ebony_arrows', name: 'Ebony Arrows (20)', type: 'weapon', description: 'Ebony arrows. Devastating impact.', price: 200, category: 'Weapons', requiredLevel: 30 },

  // Tier 8: Daedric Weapons (Level 40+)
  { id: 'daedric_dagger', name: 'Daedric Dagger', type: 'weapon', description: 'Daedric artifact. Cursed power.', price: 1500, category: 'Weapons', requiredLevel: 40 },
  { id: 'daedric_sword', name: 'Daedric Sword', type: 'weapon', description: 'Legendary Daedric blade. Unrivaled.', price: 3000, category: 'Weapons', requiredLevel: 40 },
  { id: 'daedric_war_axe', name: 'Daedric War Axe', type: 'weapon', description: 'Daedric axe. Demonic power.', price: 3500, category: 'Weapons', requiredLevel: 40 },
  { id: 'daedric_mace', name: 'Daedric Mace', type: 'weapon', description: 'Daedric mace. Pure destruction.', price: 3800, category: 'Weapons', requiredLevel: 40 },
  { id: 'daedric_greatsword', name: 'Daedric Greatsword', type: 'weapon', description: 'Massive Daedric blade. Godlike power.', price: 5000, category: 'Weapons', requiredLevel: 40 },
  { id: 'daedric_battleaxe', name: 'Daedric Battleaxe', type: 'weapon', description: 'Two-handed Daedric axe. Apocalyptic.', price: 5500, category: 'Weapons', requiredLevel: 40 },
  { id: 'daedric_warhammer', name: 'Daedric Warhammer', type: 'weapon', description: 'Daedric warhammer. Divine wrath.', price: 6000, category: 'Weapons', requiredLevel: 40 },
  { id: 'daedric_bow', name: 'Daedric Bow', type: 'weapon', description: 'Daedric bow. Soul-stealing arrows.', price: 2500, category: 'Weapons', requiredLevel: 40 },
  { id: 'daedric_arrows', name: 'Daedric Arrows (20)', type: 'weapon', description: 'Daedric arrows. Obliterate targets.', price: 400, category: 'Weapons', requiredLevel: 40 },

  // Enchanted & Special Weapons (Various Levels)
  { id: 'staff_flames', name: 'Staff of Flames', type: 'weapon', description: 'A staff that shoots fire. Limited charges.', price: 250, category: 'Weapons', requiredLevel: 8 },
  { id: 'staff_frost', name: 'Staff of Frost', type: 'weapon', description: 'Freezing staff. Slows enemies.', price: 280, category: 'Weapons', requiredLevel: 10 },
  { id: 'staff_lightning', name: 'Staff of Lightning', type: 'weapon', description: 'Electric staff. Chain lightning.', price: 320, category: 'Weapons', requiredLevel: 12 },

  // Additional pre-enchanted items to increase enchanted inventory frequency
  { id: 'elven_dagger_of_flame', name: 'Elven Dagger of Flames', type: 'weapon', description: 'Elven dagger imbued with fiery runes. Adds fire damage.', price: 420, category: 'Weapons', requiredLevel: 8, rarity: 'uncommon' },
  { id: 'steel_sword_of_frost', name: 'Steel Sword of Frost', type: 'weapon', description: 'A steel sword etched with frost runes. Slows enemies on hit.', price: 480, category: 'Weapons', requiredLevel: 10, rarity: 'uncommon' },
  { id: 'glass_bow_of_lightning', name: 'Glass Bow of Lightning', type: 'weapon', description: 'A glass bow that shocks targets on hit.', price: 850, category: 'Weapons', requiredLevel: 20, rarity: 'rare' },
  { id: 'dwarven_dagger_of_shock', name: 'Dwarven Dagger of Shock', type: 'weapon', description: 'A dwarven dagger crackling with electricity.', price: 500, category: 'Weapons', requiredLevel: 12, rarity: 'rare' },
  { id: 'elven_gauntlets_of_power', name: 'Elven Gauntlets of Power', type: 'apparel', description: 'Gauntlets that increase one-handed damage.', price: 320, category: 'Armor', requiredLevel: 10, rarity: 'uncommon' },
  { id: 'orcish_mace_of_bleeding', name: 'Orcish Mace of Bleeding', type: 'weapon', description: 'Orcish mace that causes bleeding damage over time.', price: 540, category: 'Weapons', requiredLevel: 14, rarity: 'rare' },
  { id: 'enchanted_bow', name: 'Enchanted Hunting Bow', type: 'weapon', description: 'Bow with minor fire enchantment.', price: 180, category: 'Weapons', requiredLevel: 10 },
  { id: 'silver_sword', name: 'Silver Sword', type: 'weapon', description: 'Effective against undead and werewolves.', price: 200, category: 'Weapons', requiredLevel: 12 },
  { id: 'silver_greatsword', name: 'Silver Greatsword', type: 'weapon', description: 'Large silver blade. Anti-undead.', price: 350, category: 'Weapons', requiredLevel: 15 },
  { id: 'crossbow', name: 'Crossbow', type: 'weapon', description: 'Powerful crossbow. Ignores some armor.', price: 400, category: 'Weapons', requiredLevel: 18 },
  { id: 'steel_bolts', name: 'Steel Bolts (20)', type: 'weapon', description: 'Crossbow bolts. Heavy impact.', price: 30, category: 'Weapons', requiredLevel: 18 },

  // === APPAREL / ARMOR ===
  // Tier 1: Hide & Leather (Level 1+)
  { id: 'hide_armor', name: 'Hide Armor', type: 'apparel', description: 'Basic leather armor made from animal hides.', price: 50, category: 'Armor' },
  { id: 'hide_boots', name: 'Hide Boots', type: 'apparel', description: 'Simple leather boots.', price: 15, category: 'Armor' },
  { id: 'hide_helmet', name: 'Hide Helmet', type: 'apparel', description: 'A basic leather cap.', price: 20, category: 'Armor' },
  { id: 'hide_gauntlets', name: 'Hide Gauntlets', type: 'apparel', description: 'Simple hide gloves for protection.', price: 15, category: 'Armor' },
  { id: 'leather_armor', name: 'Leather Armor', type: 'apparel', description: 'Tanned leather armor. Light and flexible.', price: 90, category: 'Armor' },
  { id: 'leather_boots', name: 'Leather Boots', type: 'apparel', description: 'Comfortable travel boots.', price: 25, category: 'Armor' },
  { id: 'leather_helmet', name: 'Leather Helmet', type: 'apparel', description: 'Light leather cap with protection.', price: 35, category: 'Armor' },
  { id: 'leather_gloves', name: 'Leather Gloves', type: 'apparel', description: 'Flexible leather gloves.', price: 15, category: 'Armor' },
  { id: 'common_clothes', name: 'Common Clothes', type: 'apparel', description: 'Simple peasant attire.', price: 10, category: 'Armor' },
  { id: 'fine_clothes', name: 'Fine Clothes', type: 'apparel', description: 'Elegant clothing for nobles.', price: 100, category: 'Armor' },
  { id: 'fur_cloak', name: 'Fur Cloak', type: 'apparel', description: 'A warm fur cloak for cold climates.', price: 75, category: 'Armor' },

  // Tier 2: Iron Armor (Level 1+)
  { id: 'iron_armor', name: 'Iron Armor', type: 'apparel', description: 'Heavy iron plate armor.', price: 150, category: 'Armor' },
  { id: 'iron_boots', name: 'Iron Boots', type: 'apparel', description: 'Heavy iron boots. Good protection.', price: 45, category: 'Armor' },
  { id: 'iron_helmet', name: 'Iron Helmet', type: 'apparel', description: 'A sturdy iron helm.', price: 60, category: 'Armor' },
  { id: 'iron_gauntlets', name: 'Iron Gauntlets', type: 'apparel', description: 'Iron plated gloves.', price: 45, category: 'Armor' },
  { id: 'iron_shield', name: 'Iron Shield', type: 'apparel', description: 'A heavy iron shield.', price: 65, category: 'Armor' },

  // Tier 3: Steel Armor (Level 5+)
  { id: 'steel_armor', name: 'Steel Armor', type: 'apparel', description: 'Strong steel plate armor.', price: 275, category: 'Armor', requiredLevel: 5 },
  { id: 'steel_boots', name: 'Steel Boots', type: 'apparel', description: 'Solid steel boots.', price: 85, category: 'Armor', requiredLevel: 5 },
  { id: 'steel_helmet', name: 'Steel Helmet', type: 'apparel', description: 'Protective steel helmet.', price: 110, category: 'Armor', requiredLevel: 5 },
  { id: 'steel_gauntlets', name: 'Steel Gauntlets', type: 'apparel', description: 'Steel plated gauntlets.', price: 85, category: 'Armor', requiredLevel: 5 },
  { id: 'steel_shield', name: 'Steel Shield', type: 'apparel', description: 'Sturdy steel shield.', price: 120, category: 'Armor', requiredLevel: 5 },
  { id: 'steel_plate_armor', name: 'Steel Plate Armor', type: 'apparel', description: 'Full steel plate. Heavy but strong.', price: 400, category: 'Armor', requiredLevel: 8 },

  // Tier 4: Elven Light Armor (Level 12+)
  { id: 'elven_light_armor', name: 'Elven Light Armor', type: 'apparel', description: 'Elegant Elven light armor. Agile protection.', price: 350, category: 'Armor', requiredLevel: 12 },
  { id: 'elven_boots', name: 'Elven Boots', type: 'apparel', description: 'Light Elven boots. Swift movement.', price: 100, category: 'Armor', requiredLevel: 12 },
  { id: 'elven_helmet', name: 'Elven Helmet', type: 'apparel', description: 'Graceful Elven helm.', price: 130, category: 'Armor', requiredLevel: 12 },
  { id: 'elven_gauntlets', name: 'Elven Gauntlets', type: 'apparel', description: 'Fine Elven gloves.', price: 100, category: 'Armor', requiredLevel: 12 },
  { id: 'elven_shield', name: 'Elven Shield', type: 'apparel', description: 'Beautiful Elven shield.', price: 180, category: 'Armor', requiredLevel: 12 },

  // Tier 5: Scaled Armor (Level 15+)
  { id: 'scaled_armor', name: 'Scaled Armor', type: 'apparel', description: 'Layered scale armor. Excellent protection.', price: 450, category: 'Armor', requiredLevel: 15 },
  { id: 'scaled_boots', name: 'Scaled Boots', type: 'apparel', description: 'Scale-covered boots.', price: 130, category: 'Armor', requiredLevel: 15 },
  { id: 'scaled_helmet', name: 'Scaled Helmet', type: 'apparel', description: 'Scaled helm. Intimidating.', price: 160, category: 'Armor', requiredLevel: 15 },
  { id: 'scaled_gauntlets', name: 'Scaled Gauntlets', type: 'apparel', description: 'Scaled gloves with grip.', price: 130, category: 'Armor', requiredLevel: 15 },

  // Tier 6: Orcish Armor (Level 18+)
  { id: 'orcish_armor', name: 'Orcish Armor', type: 'apparel', description: 'Heavy Orcish plate. Brutal design.', price: 600, category: 'Armor', requiredLevel: 18 },
  { id: 'orcish_boots', name: 'Orcish Boots', type: 'apparel', description: 'Thick Orcish boots.', price: 180, category: 'Armor', requiredLevel: 18 },
  { id: 'orcish_helmet', name: 'Orcish Helmet', type: 'apparel', description: 'Fierce Orcish helm.', price: 220, category: 'Armor', requiredLevel: 18 },
  { id: 'orcish_gauntlets', name: 'Orcish Gauntlets', type: 'apparel', description: 'Heavy Orcish gauntlets.', price: 180, category: 'Armor', requiredLevel: 18 },
  { id: 'orcish_shield', name: 'Orcish Shield', type: 'apparel', description: 'Strong Orcish shield.', price: 300, category: 'Armor', requiredLevel: 18 },

  // Tier 7: Dwarven Armor (Level 22+)
  { id: 'dwarven_armor', name: 'Dwarven Armor', type: 'apparel', description: 'Ancient Dwarven plate. Excellent craftsmanship.', price: 900, category: 'Armor', requiredLevel: 22 },
  { id: 'dwarven_boots', name: 'Dwarven Boots', type: 'apparel', description: 'Dwarven metal boots. Heavy duty.', price: 270, category: 'Armor', requiredLevel: 22 },
  { id: 'dwarven_helmet', name: 'Dwarven Helmet', type: 'apparel', description: 'Intricate Dwarven helm.', price: 330, category: 'Armor', requiredLevel: 22 },
  { id: 'dwarven_gauntlets', name: 'Dwarven Gauntlets', type: 'apparel', description: 'Precision Dwarven gloves.', price: 270, category: 'Armor', requiredLevel: 22 },
  { id: 'dwarven_shield', name: 'Dwarven Shield', type: 'apparel', description: 'Dwarven-crafted shield. Superior.', price: 450, category: 'Armor', requiredLevel: 22 },

  // Tier 8: Elven Gilded Armor (Level 25+)
  { id: 'elven_gilded_armor', name: 'Elven Gilded Armor', type: 'apparel', description: 'Golden-trimmed Elven armor. Majestic.', price: 1200, category: 'Armor', requiredLevel: 25 },
  { id: 'elven_gilded_boots', name: 'Elven Gilded Boots', type: 'apparel', description: 'Gilded Elven boots. Beautiful.', price: 350, category: 'Armor', requiredLevel: 25 },
  { id: 'elven_gilded_helmet', name: 'Elven Gilded Helmet', type: 'apparel', description: 'Golden Elven helm. Stunning.', price: 430, category: 'Armor', requiredLevel: 25 },
  { id: 'elven_gilded_gauntlets', name: 'Elven Gilded Gauntlets', type: 'apparel', description: 'Golden Elven gloves. Refined.', price: 350, category: 'Armor', requiredLevel: 25 },

  // Tier 9: Glass Armor (Level 28+)
  { id: 'glass_armor', name: 'Glass Armor', type: 'apparel', description: 'Green glass armor. Light but very strong.', price: 1600, category: 'Armor', requiredLevel: 28 },
  { id: 'glass_boots', name: 'Glass Boots', type: 'apparel', description: 'Glass boots. Surprisingly light.', price: 480, category: 'Armor', requiredLevel: 28 },
  { id: 'glass_helmet', name: 'Glass Helmet', type: 'apparel', description: 'Glass helm. Crystal clear.', price: 580, category: 'Armor', requiredLevel: 28 },
  { id: 'glass_gauntlets', name: 'Glass Gauntlets', type: 'apparel', description: 'Glass gloves. Perfect fit.', price: 480, category: 'Armor', requiredLevel: 28 },
  { id: 'glass_shield', name: 'Glass Shield', type: 'apparel', description: 'Malachite glass shield. Elegant defense.', price: 800, category: 'Armor', requiredLevel: 28 },

  // Tier 10: Dragonscale Armor (Level 32+)
  { id: 'dragonscale_armor', name: 'Dragonscale Armor', type: 'apparel', description: 'Armor made from dragon scales. Legendary.', price: 2500, category: 'Armor', requiredLevel: 32 },
  { id: 'dragonscale_boots', name: 'Dragonscale Boots', type: 'apparel', description: 'Boots from dragon scales.', price: 750, category: 'Armor', requiredLevel: 32 },
  { id: 'dragonscale_helmet', name: 'Dragonscale Helmet', type: 'apparel', description: 'Dragon scale helm. Fearsome.', price: 900, category: 'Armor', requiredLevel: 32 },
  { id: 'dragonscale_gauntlets', name: 'Dragonscale Gauntlets', type: 'apparel', description: 'Dragon scale gloves. Powerful.', price: 750, category: 'Armor', requiredLevel: 32 },
  { id: 'dragonscale_shield', name: 'Dragonscale Shield', type: 'apparel', description: 'Shield made from dragon scales.', price: 1200, category: 'Armor', requiredLevel: 32 },

  // Tier 11: Ebony Armor (Level 35+)
  { id: 'ebony_armor', name: 'Ebony Armor', type: 'apparel', description: 'Dark ebony plate. Near-legendary protection.', price: 3500, category: 'Armor', requiredLevel: 35 },
  { id: 'ebony_boots', name: 'Ebony Boots', type: 'apparel', description: 'Ebony boots. Extremely strong.', price: 1050, category: 'Armor', requiredLevel: 35 },
  { id: 'ebony_helmet', name: 'Ebony Helmet', type: 'apparel', description: 'Ebony helm. Intimidating presence.', price: 1260, category: 'Armor', requiredLevel: 35 },
  { id: 'ebony_gauntlets', name: 'Ebony Gauntlets', type: 'apparel', description: 'Ebony gauntlets. Unyielding.', price: 1050, category: 'Armor', requiredLevel: 35 },
  { id: 'ebony_shield', name: 'Ebony Shield', type: 'apparel', description: 'Ebony shield. Unbreakable.', price: 1700, category: 'Armor', requiredLevel: 35 },

  // Tier 12: Dragonplate Armor (Level 40+)
  { id: 'dragonplate_armor', name: 'Dragonplate Armor', type: 'apparel', description: 'Dragon bone plate armor. Ultimate protection.', price: 5000, category: 'Armor', requiredLevel: 40 },
  { id: 'dragonplate_boots', name: 'Dragonplate Boots', type: 'apparel', description: 'Dragon bone boots. Impenetrable.', price: 1500, category: 'Armor', requiredLevel: 40 },
  { id: 'dragonplate_helmet', name: 'Dragonplate Helmet', type: 'apparel', description: 'Dragon bone helm. Godlike.', price: 1800, category: 'Armor', requiredLevel: 40 },
  { id: 'dragonplate_gauntlets', name: 'Dragonplate Gauntlets', type: 'apparel', description: 'Dragon bone gauntlets. Unstoppable.', price: 1500, category: 'Armor', requiredLevel: 40 },
  { id: 'dragonplate_shield', name: 'Dragonplate Shield', type: 'apparel', description: 'Dragon bone shield. Absolute defense.', price: 2400, category: 'Armor', requiredLevel: 40 },

  // Tier 13: Daedric Armor (Level 45+)
  { id: 'daedric_armor', name: 'Daedric Armor', type: 'apparel', description: 'Daedric plate. Forged in Oblivion itself.', price: 8000, category: 'Armor', requiredLevel: 45 },
  { id: 'daedric_boots', name: 'Daedric Boots', type: 'apparel', description: 'Daedric boots. Walk through hell.', price: 2400, category: 'Armor', requiredLevel: 45 },
  { id: 'daedric_helmet', name: 'Daedric Helmet', type: 'apparel', description: 'Daedric helm. Demonic visage.', price: 2880, category: 'Armor', requiredLevel: 45 },
  { id: 'daedric_gauntlets', name: 'Daedric Gauntlets', type: 'apparel', description: 'Daedric gauntlets. Divine strength.', price: 2400, category: 'Armor', requiredLevel: 45 },
  { id: 'daedric_shield', name: 'Daedric Shield', type: 'apparel', description: 'Daedric shield. Blocks everything.', price: 3900, category: 'Armor', requiredLevel: 45 },

  // === MISC / TOOLS ===
  { id: 'lockpick', name: 'Lockpick', type: 'misc', description: 'A delicate tool for opening locks.', price: 5, category: 'Misc' },
  { id: 'lockpick_bundle', name: 'Lockpick Bundle (10)', type: 'misc', description: 'A set of ten lockpicks.', price: 40, category: 'Misc' },
  { id: 'rope', name: 'Rope (50ft)', type: 'misc', description: 'A coil of sturdy rope.', price: 15, category: 'Misc' },
  { id: 'soul_gem_petty', name: 'Petty Soul Gem', type: 'misc', description: 'An empty petty soul gem.', price: 30, category: 'Misc' },
  { id: 'soul_gem_lesser', name: 'Lesser Soul Gem', type: 'misc', description: 'An empty lesser soul gem.', price: 60, category: 'Misc' },
  { id: 'soul_gem_common', name: 'Common Soul Gem', type: 'misc', description: 'An empty common soul gem.', price: 120, category: 'Misc' },
  { id: 'inkwell_quill', name: 'Inkwell & Quill', type: 'misc', description: 'For writing letters and notes.', price: 10, category: 'Misc' },
  { id: 'journal_blank', name: 'Blank Journal', type: 'misc', description: 'An empty journal for your thoughts.', price: 15, category: 'Misc' },
  { id: 'map_skyrim', name: 'Map of Skyrim', type: 'misc', description: 'A detailed map of the province.', price: 50, category: 'Misc' },
  { id: 'backpack', name: 'Traveler\'s Backpack', type: 'misc', description: 'A sturdy pack for carrying supplies.', price: 75, category: 'Misc' },
  { id: 'shovel', name: 'Shovel', type: 'misc', description: 'For digging. Or burying things.', price: 20, category: 'Misc' },
  { id: 'pickaxe', name: 'Pickaxe', type: 'misc', description: 'For mining ore from veins.', price: 35, category: 'Misc' },
  { id: 'woodcutter_axe', name: 'Woodcutter\'s Axe', type: 'misc', description: 'For chopping wood. Not a weapon.', price: 20, category: 'Misc' },

  // === INGREDIENTS ===
  { id: 'blue_mountain_flower', name: 'Blue Mountain Flower', type: 'ingredient', description: 'A common alchemical ingredient.', price: 3, category: 'Ingredients' },
  { id: 'red_mountain_flower', name: 'Red Mountain Flower', type: 'ingredient', description: 'Used in health potions.', price: 3, category: 'Ingredients' },
  { id: 'lavender', name: 'Lavender', type: 'ingredient', description: 'A fragrant purple flower.', price: 2, category: 'Ingredients' },
  { id: 'salt_pile', name: 'Salt Pile', type: 'ingredient', description: 'For cooking and alchemy.', price: 2, category: 'Ingredients' },
  { id: 'garlic', name: 'Garlic', type: 'ingredient', description: 'Pungent bulb. Useful against vampires?', price: 3, category: 'Ingredients' },
  { id: 'deathbell', name: 'Deathbell', type: 'ingredient', description: 'A sinister flower. Poison ingredient.', price: 8, category: 'Ingredients' },
  { id: 'nightshade', name: 'Nightshade', type: 'ingredient', description: 'Deadly purple flowers.', price: 10, category: 'Ingredients' },
  { id: 'giants_toe', name: 'Giant\'s Toe', type: 'ingredient', description: 'Rare and valuable. Powerful alchemy.', price: 50, category: 'Ingredients' },
  { id: 'moon_sugar', name: 'Moon Sugar', type: 'ingredient', description: 'Illegal sweetener. Skooma base.', price: 30, category: 'Ingredients' },
  // Blacksmith materials (available at general stores / smiths)
  { id: 'iron_ingot', name: 'Iron Ingot', type: 'misc', description: 'Smelted iron bar — used for basic smithing and repairs.', price: 8, category: 'Ingredients' },
  { id: 'steel_ingot', name: 'Steel Ingot', type: 'misc', description: 'Refined steel bar used for stronger weapon and armor work.', price: 18, category: 'Ingredients' },
  { id: 'mithril_ingot', name: 'Mithril Ingot', type: 'misc', description: 'A lightweight, durable silvery metal. Excellent for superior armor.', price: 45, category: 'Ingredients' },
  { id: 'ebony_ingot', name: 'Ebony Ingot', type: 'misc', description: 'A heavy, dark metal used for high-tier equipment.', price: 150, category: 'Ingredients' },
  { id: 'daedric_core', name: 'Daedric Core', type: 'misc', description: 'A pulsating heart of Daedric energy. Used for legendary forging.', price: 400, category: 'Ingredients' },
  { id: 'leather_strip', name: 'Leather Strip', type: 'misc', description: 'Strips of leather used for joining armor pieces.', price: 2, category: 'Ingredients' },
  { id: 'metal_scrap', name: 'Metal Scrap', type: 'misc', description: 'Bits of salvaged metal. Can be used for basic repairs.', price: 1, category: 'Ingredients' },

  // === JEWELRY ===
  { id: 'gold_ring', name: 'Gold Ring', type: 'apparel', description: 'A simple gold ring. Elegant and valuable.', price: 75, category: 'Jewelry' },
  { id: 'silver_ring', name: 'Silver Ring', type: 'apparel', description: 'A silver ring with a subtle shine.', price: 40, category: 'Jewelry' },
  { id: 'gold_necklace', name: 'Gold Necklace', type: 'apparel', description: 'A necklace made of pure gold.', price: 120, category: 'Jewelry' },
  { id: 'silver_necklace', name: 'Silver Necklace', type: 'apparel', description: 'A necklace crafted from fine silver.', price: 60, category: 'Jewelry' },
  { id: 'gold_circlet', name: 'Gold Circlet', type: 'apparel', description: 'A circlet of gold, fit for nobility.', price: 150, category: 'Jewelry' },
  // === PROMO ITEMS (fixed ids, rarities and levels) ===
  // Legendary (show at level 100 only)
  { id: 'legendary_sword_of_ages', name: 'Sword of Ages (Legendary)', type: 'weapon', description: 'A legendary blade of impossible sharpness.', price: 99999, category: 'Weapons', requiredLevel: 100, rarity: 'legendary' },
  { id: 'legendary_aeon_greatsword', name: 'Aeon Greatsword (Legendary)', type: 'weapon', description: 'A greatsword that burns with timeless power.', price: 99999, category: 'Weapons', requiredLevel: 100, rarity: 'legendary' },
  { id: 'legendary_bow_of_apocalypse', name: 'Bow of the Apocalypse (Legendary)', type: 'weapon', description: 'A bow whose arrows pierce even destiny.', price: 99999, category: 'Weapons', requiredLevel: 100, rarity: 'legendary' },
  { id: 'legendary_void_dagger', name: 'Void Dagger (Legendary)', type: 'weapon', description: 'A dagger that steals the very essence of foes.', price: 99999, category: 'Weapons', requiredLevel: 100, rarity: 'legendary' },
  { id: 'legendary_plate_of_titans', name: 'Plate of Titans (Legendary)', type: 'apparel', description: 'Armor forged for giants, impenetrable.', price: 99999, category: 'Armor', requiredLevel: 100, rarity: 'legendary' },
  { id: 'legendary_helm_of_eternity', name: 'Helm of Eternity (Legendary)', type: 'apparel', description: 'A helm that anchors a warrior across eras.', price: 99999, category: 'Armor', requiredLevel: 100, rarity: 'legendary' },
  { id: 'legendary_shield_of_sol', name: 'Shield of Sol (Legendary)', type: 'apparel', description: 'A radiant shield that bends fate.', price: 99999, category: 'Armor', requiredLevel: 100, rarity: 'legendary' },
  { id: 'legendary_epic_legion_armor', name: 'Epic Legion Armor (Legendary)', type: 'apparel', description: 'An ensemble of armor that proclaims dominion.', price: 99999, category: 'Armor', requiredLevel: 100, rarity: 'legendary' },

  // Epic (show at level 50)
  { id: 'epic_sword_of_ages', name: 'Sword of Ages (Epic)', type: 'weapon', description: 'An epic blade of exceptional sharpness.', price: 75000, category: 'Weapons', requiredLevel: 50, rarity: 'epic' },
  { id: 'epic_aeon_greatsword', name: 'Aeon Greatsword (Epic)', type: 'weapon', description: 'A greatsword of refined, timeless power.', price: 75000, category: 'Weapons', requiredLevel: 50, rarity: 'epic' },
  { id: 'epic_bow_of_apocalypse', name: 'Bow of the Apocalypse (Epic)', type: 'weapon', description: 'A bow whose arrows strike true against fate.', price: 75000, category: 'Weapons', requiredLevel: 50, rarity: 'epic' },
  { id: 'epic_void_dagger', name: 'Void Dagger (Epic)', type: 'weapon', description: 'A dagger with draining properties, favored by assassins.', price: 75000, category: 'Weapons', requiredLevel: 50, rarity: 'epic' },
  { id: 'epic_plate_of_titans', name: 'Plate of Titans (Epic)', type: 'apparel', description: 'Heavy armor tempered for champions.', price: 75000, category: 'Armor', requiredLevel: 50, rarity: 'epic' },
  { id: 'epic_helm_of_eternity', name: 'Helm of Eternity (Epic)', type: 'apparel', description: 'A helm that steadies the mind and spirit.', price: 75000, category: 'Armor', requiredLevel: 50, rarity: 'epic' },
  { id: 'epic_shield_of_sol', name: 'Shield of Sol (Epic)', type: 'apparel', description: 'A bright shield that deflects doom.', price: 75000, category: 'Armor', requiredLevel: 50, rarity: 'epic' },
  { id: 'epic_legion_armor', name: 'Epic Legion Armor (Epic)', type: 'apparel', description: 'A high-tier set favored by elite legions.', price: 75000, category: 'Armor', requiredLevel: 50, rarity: 'epic' },
];

const CATEGORIES = ['All', 'Food', 'Drinks', 'Potions', 'Camping', 'Weapons', 'Armor', 'Misc', 'Ingredients', 'Jewelry'];

const categoryIcons: Record<string, React.ReactNode> = {
  All: <Package size={14} />,
  Food: <Apple size={14} />,
  Drinks: <Droplets size={14} />,
  Potions: <FlaskConical size={14} />,
  Camping: <Tent size={14} />,
  Weapons: <Sword size={14} />,
  Armor: <Shield size={14} />,
  Misc: <Package size={14} />,
  Ingredients: <FlaskConical size={14} />,
  Jewelry: <Gem size={14} />,
};

// Calculate sell price (50% of base value, minimum 1 gold)
const getSellPrice = (item: InventoryItem): number => {
  // Try to find matching shop item for base price
  const shopItem = SHOP_INVENTORY.find(si =>
    si.name.toLowerCase() === item.name.toLowerCase()
  );
  if (shopItem) {
    return Math.max(1, Math.floor(shopItem.price * 0.5));
  }
  // Default pricing based on type
  const basePrices: Record<string, number> = {
    weapon: 20,
    apparel: 15,
    potion: 10,
    ingredient: 2,
    misc: 5,
    key: 0,
  };
  return Math.max(1, Math.floor((basePrices[item.type] || 5) * 0.5));
};

interface ShopModalProps {
  open: boolean;
  onClose: () => void;
  gold: number;
  onPurchase: (item: ShopItem, quantity: number) => void;
  inventory?: InventoryItem[];
  onSell?: (item: InventoryItem, quantity: number, totalGold: number) => void;
  characterLevel?: number;
}

export function ShopModal({ open, onClose, gold, onPurchase, inventory = [], onSell, characterLevel = 1 }: ShopModalProps) {
  const { t } = useLocalization();
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [recentlyPurchased, setRecentlyPurchased] = useState<Set<string>>(new Set());
  const [recentlySold, setRecentlySold] = useState<Set<string>>(new Set());
  const [insufficient, setInsufficient] = useState<Set<string>>(new Set());
  const [shopSort, setShopSort] = useState<string>('name:asc');
  const [purchaseEffect, setPurchaseEffect] = useState<{ x: number; y: number; id: string } | null>(null);
  const [sellSort, setSellSort] = useState<string>('name:asc');
  const { showQuantityControls, showToast } = useAppContext();

  // Map inventory item types to shop categories for the Sell tab
  const TYPE_TO_CATEGORY: Record<string, string> = {
    food: 'Food',
    drink: 'Drinks',
    potion: 'Potions',
    camping: 'Camping',
    weapon: 'Weapons',
    apparel: 'Armor',
    misc: 'Misc',
    ingredient: 'Ingredients'
  };

  // Handle ESC key to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, handleKeyDown]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setQuantities({});
      setSearch('');
      setRecentlyPurchased(new Set());
      setRecentlySold(new Set());
    }
  }, [open]);

  const specials = useMemo(() => {
    try {
      return getShopSpecials(characterLevel || 1).filter(s => !s.expiresAt || s.expiresAt > Date.now());
    } catch (e) { return []; }
  }, [characterLevel]);

  const filteredShopItems = useMemo(() => {
    // Merge regular inventory with temporary specials so enchanted/limited items are listed inline
    const mergedSource = [
      ...SHOP_INVENTORY,
      ...specials.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type as ShopItem['type'],
        description: s.description,
        price: s.price,
        category: s.category || 'Misc',
        requiredLevel: s.requiredLevel,
        rarity: s.rarity,
        // Preserve special metadata so UI can render badges
        enchantment: (s as any).enchantment || undefined,
        limited: (s as any).limited || false,
        _isSpecial: true
      }))
    ];

    const base = mergedSource.filter(item => {
      // Filter by character level - only show items the character can access
      if (item.requiredLevel && characterLevel < item.requiredLevel) {
        return false;
      }
      const matchesCategory = category === 'All' || item.category === category;
      const matchesSearch = !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Apply sorting (supports direction `key:asc` / `key:desc` and weight)
    const withStats = base.map(b => ({
      item: b,
      damage: getItemStats(b.name, b.type).damage || 0
    }));

    const parseShopSort = (s: string) => {
      const parts = (s || '').split(':');
      return { key: parts[0] || 'name', dir: parts[1] === 'desc' ? 'desc' : 'asc' };
    };

    const getWeight = (it: ShopItem) => {
      const n = it.name.toLowerCase();
      if (it.type === 'weapon') {
        if (n.includes('dagger')) return 1;
        if (n.includes('arrow')) return 2;
        if (n.includes('bow')) return 6;
        if (n.includes('greatsword') || n.includes('warhammer') || n.includes('battleaxe') || n.includes('great sword')) return 12;
        if (n.includes('sword') || n.includes('axe') || n.includes('mace')) return 6;
        return 5;
      }
      if (it.type === 'apparel') {
        if (n.includes('boots') || n.includes('gloves') || n.includes('helmet')) return 3;
        if (n.includes('cloak') || n.includes('robe') || n.includes('tunic') || n.includes('shirt')) return 2;
        if (n.includes('armor') || n.includes('plate') || n.includes('shield')) return 12;
        return 4;
      }
      if (it.type === 'camping') {
        if (n.includes('tent')) return 8;
        if (n.includes('bedroll')) return 5;
        return 3;
      }
      if (it.type === 'food' || it.type === 'drink') return 1;
      if (it.type === 'potion' || it.type === 'ingredient' || it.type === 'misc' || it.category === 'Jewelry') return 1;
      return 1;
    };

    const parsedShopSort = parseShopSort(shopSort);

    withStats.sort((a, b) => {
      const dir = parsedShopSort.dir === 'desc' ? -1 : 1;
      const key = parsedShopSort.key;
      if (key === 'price') return dir * (a.item.price - b.item.price);
      if (key === 'damage') return dir * ((a.damage || 0) - (b.damage || 0));
      if (key === 'armor') {
        const aa = getItemStats(a.item.name, a.item.type).armor || 0;
        const bb = getItemStats(b.item.name, b.item.type).armor || 0;
        return dir * (aa - bb);
      }
      if (key === 'weight') return dir * (getWeight(a.item) - getWeight(b.item));
      return dir * a.item.name.localeCompare(b.item.name);
    });

    return withStats.map(w => w.item);
  }, [category, search, characterLevel, shopSort]);

  const filteredInventoryItems = useMemo(() => {
    const base = inventory.filter(item => {
      // Don't allow selling keys
      if (item.type === 'key') return false;
      if ((item.quantity || 0) <= 0) return false;
      // Don't allow selling equipped items
      if (item.equipped) return false;
      const matchesSearch = !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });

    // Apply category filter for Sell tab
    const categoryFiltered = category === 'All' ? base : base.filter(item => {
      // Special-case Jewelry detection
      if (category === 'Jewelry') {
        const n = item.name.toLowerCase();
        return n.includes('ring') || n.includes('necklace') || n.includes('circlet');
      }
      const mapped = TYPE_TO_CATEGORY[item.type] || 'Misc';
      return mapped === category;
    });

    // Apply sorting based on sellSort
    const parseSellSort = (s: string) => {
      const parts = (s || '').split(':');
      return { key: parts[0] || 'name', dir: parts[1] === 'desc' ? 'desc' : 'asc' };
    };

    const parsed = parseSellSort(sellSort);

    const sorted = [...categoryFiltered].sort((a, b) => {
      const dir = parsed.dir === 'desc' ? -1 : 1;
      const key = parsed.key;
      if (key === 'price') {
        return dir * (getSellPrice(a) - getSellPrice(b));
      }
      if (key === 'damage') return dir * ((a.damage || 0) - (b.damage || 0));
      if (key === 'armor') return dir * ((a.armor || 0) - (b.armor || 0));
      if (key === 'weight') return dir * ((a.weight || 0) - (b.weight || 0));
      return dir * a.name.localeCompare(b.name);
    });

    return sorted;
  }, [inventory, search, category, sellSort]);

  // Group identical inventory entries by normalized name so the sell list shows stacked rows
  const groupedInventoryItems = useMemo(() => {
    const m = new Map<string, {
      key: string;
      name: string;
      description?: string;
      rarity?: string;
      type?: string;
      items: InventoryItem[];
      totalQty: number;
      anyFavorite: boolean;
      anyEquipped: boolean;
    }>();

    filteredInventoryItems.forEach(it => {
      const key = (it.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const existing = m.get(key);
      if (!existing) {
        m.set(key, {
          key,
          name: it.name || key,
          description: it.description,
          rarity: (it.rarity || '') as string,
          type: it.type,
          items: [it],
          totalQty: it.quantity || 1,
          anyFavorite: !!it.isFavorite,
          anyEquipped: !!it.equipped,
        });
      } else {
        existing.items.push(it);
        existing.totalQty += (it.quantity || 1);
        existing.anyFavorite = existing.anyFavorite || !!it.isFavorite;
        existing.anyEquipped = existing.anyEquipped || !!it.equipped;
      }
    });

    return Array.from(m.values());
  }, [filteredInventoryItems]);

  // Sell all items in a grouped entry (iterate underlying stacks)
  const handleSellGroupAll = (group: { items: InventoryItem[] }) => {
    if (!onSell) return;
    let grandTotal = 0;
    group.items.forEach(it => {
      const qty = it.quantity || 1;
      const unit = getSellPrice(it);
      const total = unit * qty;
      grandTotal += total;
      onSell(it, qty, total);
      setQuantities(prev => ({ ...prev, [it.id]: 1 }));
      setRecentlySold(prev => new Set(prev).add(it.id));
    });

    playSoundEffect('sell');
    showToast && showToast(`Sold ${group.items.length} item${group.items.length !== 1 ? 's' : ''} for ${grandTotal}g`, 'success');
    setTimeout(() => {
      setRecentlySold(prev => {
        const newSet = new Set(prev);
        group.items.forEach(it => newSet.delete(it.id));
        return newSet;
      });
    }, 1600);
  };

  // Sell a single unit from the grouped entry (find first stack with qty > 0)
  const handleSellGroupOne = (group: { items: InventoryItem[] }) => {
    if (!onSell) return;
    for (const it of group.items) {
      const qtyAvailable = it.quantity || 1;
      if (qtyAvailable <= 0) continue;
      const unit = getSellPrice(it);
      onSell(it, 1, unit);
      setQuantities(prev => ({ ...prev, [it.id]: 1 }));
      setRecentlySold(prev => new Set(prev).add(it.id));
      playSoundEffect('sell');
      showToast && showToast(`Sold 1x ${getItemName(it, t)} for ${unit}g`, 'success');
      setTimeout(() => {
        setRecentlySold(prev => {
          const newSet = new Set(prev);
          newSet.delete(it.id);
          return newSet;
        });
      }, 1600);
      break;
    }
  };

  // Items in the currently selected category (ignores search)
  const itemsInSelectedCategory = useMemo(() => {
    const base = inventory.filter(item => {
      if (item.type === 'key') return false;
      if ((item.quantity || 0) <= 0) return false;
      if (item.equipped) return false;
      return true;
    });

    const categoryFiltered = category === 'All' ? base : base.filter(item => {
      if (category === 'Jewelry') {
        const n = item.name.toLowerCase();
        return n.includes('ring') || n.includes('necklace') || n.includes('circlet');
      }
      const mapped = TYPE_TO_CATEGORY[item.type] || 'Misc';
      return mapped === category;
    });

    return categoryFiltered;
  }, [inventory, category]);

  const getQuantity = (id: string) => quantities[id] || 1;
  const setQuantity = (id: string, qty: number, max?: number) => {
    const newQty = Math.max(1, max ? Math.min(qty, max) : qty);
    setQuantities(prev => ({ ...prev, [id]: newQty }));
  };

  const handleBuy = (item: ShopItem, e?: React.MouseEvent<HTMLButtonElement>) => {
    const qty = getQuantity(item.id);
    const total = item.price * qty;
    if (gold >= total) {
      onPurchase(item, qty);
      setQuantities(prev => ({ ...prev, [item.id]: 1 }));

      // Play purchase sound effect
      playSoundEffect('purchase');
      playSoundEffect('gold_spend');

      // Show purchase feedback (button state)
      setRecentlyPurchased(prev => new Set(prev).add(item.id));
      setTimeout(() => {
        setRecentlyPurchased(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
      }, 1500);

      // Spawn a small particle effect anchored to the clicked button
      try {
        const rect = e?.currentTarget?.getBoundingClientRect?.();
        if (rect) {
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const id = `purchase_${item.id}_${Date.now()}`;
          setPurchaseEffect({ x, y, id });
          setTimeout(() => setPurchaseEffect(null), 700);
        }
      } catch (err) { /* best-effort UI, ignore */ }
    } else {
      // Not enough gold — give clear feedback
      setInsufficient(prev => new Set(prev).add(item.id));
      // play error sound and show toast
      playSoundEffect('error');
      showToast && showToast(`Need ${Math.max(1, total - gold)}g to buy ${getItemName({ ...item, baseId: item.id }, t)}`, 'error');
      setTimeout(() => setInsufficient(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      }), 1600);
    }
  };

  const handleSell = (item: InventoryItem) => {
    if (!onSell) return;
    const qty = Math.min(getQuantity(item.id), item.quantity || 1);
    const unitPrice = getSellPrice(item);
    const total = unitPrice * qty;
    onSell(item, qty, total);
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));

    // Play sell sound effect
    playSoundEffect('sell');

    // Show sell feedback
    setRecentlySold(prev => new Set(prev).add(item.id));
    setTimeout(() => {
      setRecentlySold(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }, 1500);
  };

  const handleSellAll = (item: InventoryItem) => {
    if (!onSell) return;
    const maxQty = item.quantity || 1;
    const unitPrice = getSellPrice(item);
    const total = unitPrice * maxQty;
    onSell(item, maxQty, total);
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
    playSoundEffect('sell');
    setRecentlySold(prev => new Set(prev).add(item.id));
    setTimeout(() => {
      setRecentlySold(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }, 1500);
  };

  // Sell all items in the currently selected category
  const handleSellCategory = () => {
    if (!onSell) return;
    const toSell = itemsInSelectedCategory.filter(it => (it.quantity || 0) > 0);
    if (toSell.length === 0) {
      showToast && showToast('No items in this category to sell', 'info');
      return;
    }

    // Execute sell for each item (preserves existing onSell behavior)
    let grandTotal = 0;
    toSell.forEach(it => {
      const qty = it.quantity || 1;
      const unit = getSellPrice(it);
      const total = unit * qty;
      grandTotal += total;
      onSell(it, qty, total);
      setRecentlySold(prev => new Set(prev).add(it.id));
      setQuantities(prev => ({ ...prev, [it.id]: 1 }));
    });

    playSoundEffect('sell');
    showToast && showToast(`Sold ${toSell.length} items for ${grandTotal}g`, 'success');
    // clear recentlySold flags after a short time so UI feedback works
    setTimeout(() => {
      setRecentlySold(prev => {
        const newSet = new Set(prev);
        toSell.forEach(it => newSet.delete(it.id));
        return newSet;
      });
    }, 1600);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-skyrim-dark/70 backdrop-lite flex items-center justify-center p-4 sm:p-6"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl bg-skyrim-paper border-2 border-skyrim-gold rounded-lg shadow-2xl flex flex-col"
        style={{ maxHeight: 'min(550px, 80vh)', margin: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-skyrim-border flex items-center justify-between gap-3 bg-skyrim-dark/50 rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-skyrim-gold" size={20} />
            <h2 className="text-lg font-serif text-skyrim-gold">General Goods</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-skyrim-paper/40 rounded border border-skyrim-border">
              <Coins size={14} className="text-yellow-500" />
              <span className="text-yellow-400 font-bold text-sm">{gold}</span>
            </div>
            <button onClick={onClose} data-sfx="button_click" className="p-1.5 hover:bg-skyrim-paper/40 rounded transition-colors">
              <X size={18} className="text-skyrim-text hover:text-white" />
            </button>
          </div>
        </div>

        {/* Buy/Sell Tabs */}
        <div className="flex border-b border-skyrim-border/60 bg-skyrim-paper/20 flex-shrink-0">
          <button
            onClick={() => { setMode('buy'); setSearch(''); setCategory('All'); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors ${mode === 'buy'
              ? 'bg-skyrim-gold/20 text-skyrim-gold border-b-2 border-skyrim-gold'
              : 'text-skyrim-text hover:text-skyrim-text/80 hover:bg-skyrim-paper/20'
              }`}
          >
            <ArrowDownToLine size={16} />
            Buy
          </button>
          <button
            onClick={() => { setMode('sell'); setSearch(''); setCategory('All'); }}
            disabled={!onSell}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors ${mode === 'sell'
              ? 'bg-green-900/30 text-green-400 border-b-2 border-green-500'
              : 'text-skyrim-text hover:text-skyrim-text/80 hover:bg-skyrim-paper/20'
              } ${!onSell ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ArrowUpFromLine size={16} />
            Sell
          </button>
        </div>

        {/* Search & Categories (Buy mode only) */}
        <div className="px-3 py-2.5 border-b border-skyrim-border/40 bg-skyrim-paper/10 flex-shrink-0 space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder={mode === 'buy' ? 'Search shop...' : 'Search inventory...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-skyrim-paper/40 border border-skyrim-border rounded text-skyrim-text placeholder-gray-500 focus:border-skyrim-gold focus:outline-none text-sm"
            />
          </div>
          {(mode === 'buy' || mode === 'sell') && (
            <>
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${category === cat
                      ? (mode === 'buy' ? 'bg-skyrim-gold text-skyrim-dark font-bold' : 'bg-green-700 text-white font-bold')
                      : 'bg-skyrim-paper/30 text-skyrim-text hover:text-skyrim-text/80 hover:bg-skyrim-paper/50'
                      }`}
                  >
                    {categoryIcons[cat]}
                    <span>{cat}</span>
                  </button>
                ))}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <div className="text-xs text-skyrim-text">Sort:</div>
                <SortSelector
                  currentSort={mode === 'buy' ? shopSort : sellSort}
                  onSelect={(s) => mode === 'buy' ? setShopSort(s) : setSellSort(s)}
                  allowDirection={true}
                  options={[
                    { id: 'name', label: 'Name' },
                    { id: 'price', label: 'Price' },
                    { id: 'damage', label: 'Damage' },
                    { id: 'armor', label: 'Armor' },
                    { id: 'weight', label: 'Weight' }
                  ]}
                  label="Sort"
                />
              </div>
            </>
          )}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {mode === 'buy' && (
            <div className="p-3 space-y-3">


              {filteredShopItems.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-sm">No items found.</div>
              ) : (
                <div className="divide-y divide-skyrim-border/30">
                  {filteredShopItems.map(item => {
                    // Match against player's inventory to show ownership/favorite/equipped indicators
                    const matches = inventory.filter(inv => inv.name.toLowerCase() === item.name.toLowerCase());
                    const ownedQty = matches.reduce((s, it) => s + (it.quantity || 1), 0);
                    const anyFavorite = matches.some(it => !!it.isFavorite);
                    const anyEquipped = matches.some(it => !!it.equipped);

                    return (
                      <div key={item.id} className="px-3 py-2.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-xl text-gray-300">{categoryIcons[item.category || 'All']}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate text-sm flex items-center gap-2">
                                <span className="truncate">{getItemName({ ...item, baseId: item.id }, t)}</span>
                                {ownedQty > 0 && (
                                  <span className="ml-1 px-2 py-0.5 rounded bg-skyrim-paper/30 text-gray-300 text-xs flex items-center gap-1" title={`${ownedQty} owned`}>
                                    <Package size={12} />
                                    <span className="text-xs">x{ownedQty}</span>
                                  </span>
                                )}
                                {(item as any).limited && <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-700 text-yellow-100">Limited</span>}
                                {((item as any).enchantment || /\bof\b/i.test(item.name)) && (
                                  <span className="ml-1 px-2 py-0.5 rounded bg-purple-700 text-purple-100 text-xs flex items-center gap-1">
                                    <Gem className="w-3 h-3" />
                                    Enchanted
                                  </span>
                                )}
                                {item.rarity && <span className="ml-2"><RarityBadge rarity={String(item.rarity)} /></span>}

                                {/* Favorite / Equipped indicators (match to player's inventory) */}
                                {anyFavorite && (
                                  <span className="ml-1 px-2 py-0.5 rounded text-[10px] bg-yellow-500 text-black flex items-center gap-1" title="Favorited">
                                    <Star size={12} /> Fav
                                  </span>
                                )}
                                {anyEquipped && (
                                  <span className="ml-1 px-2 py-0.5 rounded text-[10px] bg-blue-700 text-white flex items-center gap-1" title="Equipped">
                                    <Shield size={12} /> Equipped
                                  </span>
                                )}

                                {/* Show stats for weapons and armor */}
                                {(() => {
                                  const stats = getItemStats(item.name, item.type as any);
                                  return (stats && (stats.damage || stats.armor)) ? (
                                    <span className="flex items-center gap-2 text-xs">
                                      {stats.damage && (
                                        <span className="flex items-center gap-0.5 text-red-400">
                                          <Sword size={10} /> {stats.damage}
                                        </span>
                                      )}
                                      {stats.armor && (
                                        <span className="flex items-center gap-0.5 text-blue-400">
                                          <Shield size={10} /> {stats.armor}
                                        </span>
                                      )}
                                    </span>
                                  ) : null;
                                })()}

                                {/* nutrition / potion hints */}
                                {item.type === 'food' && (
                                  <span className="text-green-400 text-xs flex items-center gap-1 ml-2">
                                    <Apple size={10} /> {getFoodNutritionDisplay(item.name)}
                                  </span>
                                )}
                                {item.type === 'drink' && (
                                  <span className="text-blue-400 text-xs flex items-center gap-1 ml-2">
                                    <Droplets size={10} /> {getDrinkNutritionDisplay(item.name)}
                                  </span>
                                )}
                                {item.type === 'potion' && (
                                  <span className="text-purple-300 text-xs flex items-center gap-1 ml-2">
                                    <FlaskConical size={10} />
                                    {item.subtype === 'health' ? 'Restores Health' :
                                      item.subtype === 'magicka' ? 'Restores Magicka' :
                                        item.subtype === 'stamina' ? 'Restores Stamina' :
                                          item.description.includes('Restores') ? 'Restorative' :
                                            'Potion Effect'}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 mt-1 truncate">{item.description}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-yellow-400 font-bold">
                            <Coins size={12} />
                            <span className={`${gold < (item.price * getQuantity(item.id)) ? 'text-red-400' : ''}`}>{item.price}g</span>
                          </div>
                          <button onClick={(e) => handleBuy(item, e)} disabled={recentlyPurchased.has(item.id)} className={`px-3 py-1 rounded text-xs font-bold transition-all duration-300 min-w-[90px] ${recentlyPurchased.has(item.id) ? 'bg-yellow-600 text-white scale-105' : insufficient.has(item.id) ? 'bg-red-600 text-white animate-pulse' : (gold < (item.price * getQuantity(item.id)) ? 'bg-red-600 text-white/90 hover:brightness-105' : 'bg-skyrim-gold text-skyrim-dark hover:scale-105')}`}>
                            {recentlyPurchased.has(item.id) ? (
                              <span className="flex items-center gap-1 text-xs">✅ Bought!</span>
                            ) : insufficient.has(item.id) ? (
                              <span className="flex items-center gap-1 text-xs">Need {Math.max(1, item.price * getQuantity(item.id) - gold)}g</span>
                            ) : (
                              'Buy'
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {mode === 'sell' && (
            filteredInventoryItems.length === 0 ? (
              <div className="text-center text-gray-500 py-8 text-sm">
                {search ? 'No matching items in your inventory.' : 'No items to sell.'}
              </div>
            ) : (
              <div className="divide-y divide-skyrim-border/30">
                {groupedInventoryItems.map(group => {
                  const unitPrice = group.items.length ? getSellPrice(group.items[0]) : 0;
                  const totalGold = group.items.reduce((s, it) => s + getSellPrice(it) * (it.quantity || 1), 0);

                  return (
                    <div key={group.key} className="px-3 py-2.5 flex items-center gap-3 hover:bg-skyrim-paper/20 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-xl text-gray-300">{categoryIcons[TYPE_TO_CATEGORY[group.type || 'misc'] || 'Misc']}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm flex items-center gap-2">
                              <span className="truncate">{group.items[0] ? getItemName(group.items[0], t) : group.name}</span>
                              <span className="text-gray-500 text-xs">×{group.totalQty}</span>
                              {group.rarity && <span className="ml-2"><RarityBadge rarity={String(group.rarity)} /></span>}
                              {group.anyFavorite && (
                                <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-yellow-500 text-black flex items-center gap-1" title="Favorited">
                                  <Star size={12} /> Fav
                                </span>
                              )}
                              {group.anyEquipped && (
                                <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-blue-700 text-white flex items-center gap-1" title="Equipped">
                                  <Shield size={12} /> Equipped
                                </span>
                              )}

                              {/* Show stats for weapons and armor using first stack as sample */}
                              {group.items[0] && ((group.items[0].damage || group.items[0].armor)) && (
                                <span className="flex items-center gap-2 text-xs">
                                  {group.items[0].damage && (
                                    <span className="flex items-center gap-0.5 text-red-400">
                                      <Sword size={10} /> {group.items[0].damage}
                                    </span>
                                  )}
                                  {group.items[0].armor && (
                                    <span className="flex items-center gap-0.5 text-blue-400">
                                      <Shield size={10} /> {group.items[0].armor}
                                    </span>
                                  )}
                                </span>
                              )}

                              {/* nutrition / potion hints */}
                              {group.items[0] && group.items[0].type === 'food' && (
                                <span className="text-green-400 text-xs flex items-center gap-1 ml-2">
                                  <Apple size={10} /> {getFoodNutritionDisplay(group.items[0].name)}
                                </span>
                              )}
                              {group.items[0] && group.items[0].type === 'drink' && (
                                <span className="text-blue-400 text-xs flex items-center gap-1 ml-2">
                                  <Droplets size={10} /> {getDrinkNutritionDisplay(group.items[0].name)}
                                </span>
                              )}
                              {group.items[0] && group.items[0].type === 'potion' && (
                                <span className="text-purple-300 text-xs flex items-center gap-1 ml-2">
                                  <FlaskConical size={10} />
                                  {group.items[0].subtype === 'health' ? 'Restores Health' :
                                    group.items[0].subtype === 'magicka' ? 'Restores Magicka' :
                                      group.items[0].subtype === 'stamina' ? 'Restores Stamina' :
                                        group.items[0].description?.includes('Restores') ? 'Restorative' :
                                          'Potion Effect'}
                                </span>
                              )}

                            </div>
                            <p className="text-gray-500 text-xs truncate">{group.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
                          <Coins size={12} />
                          {unitPrice}/ea
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSellGroupOne(group)}
                            className="px-3 py-1 rounded text-xs font-bold transition-all duration-300 min-w-[80px] bg-skyrim-paper/30 text-skyrim-text hover:bg-skyrim-paper/40"
                          >
                            {`Sell 1 +${unitPrice}g`}
                          </button>
                          <button
                            onClick={() => handleSellGroupAll(group)}
                            className="px-3 py-1 rounded text-xs font-bold transition-all duration-300 min-w-[90px] bg-green-700 text-white hover:bg-green-600"
                          >
                            {`Sell All +${totalGold}g`}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        {purchaseEffect && (
          <div className="pointer-events-none fixed z-[80] left-0 top-0" style={{ left: 0, top: 0 }}>
            <ParticleEffect x={purchaseEffect.x} y={purchaseEffect.y} effectType="conjuration" count={14} />
          </div>
        )}
        <div className="px-3 py-2 border-t border-skyrim-border/60 bg-skyrim-paper/20 flex-shrink-0">
          {mode === 'buy' ? (
            <p className="text-gray-500 text-xs text-center">{`${filteredShopItems.length} items available`}</p>
          ) : (
            !onSell ? (
              <p className="text-gray-500 text-xs text-center">This vendor is not buying items right now.</p>
            ) : (
              <div className="flex flex-col gap-2">

                {/* Category sell summary & action */}
                {itemsInSelectedCategory.length > 0 && (
                  (() => {
                    const totalQty = itemsInSelectedCategory.reduce((s, it) => s + (it.quantity || 0), 0);
                    const totalGold = itemsInSelectedCategory.reduce((s, it) => s + getSellPrice(it) * (it.quantity || 0), 0);
                    const breakdown = itemsInSelectedCategory.map(it => `${it.quantity}x ${getItemName(it, t)}`).join(', ');
                    return (
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-gray-400 truncate">{`${category}: ${totalQty} item${totalQty !== 1 ? 's' : ''} — ${breakdown}`}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-green-400 font-bold">{totalGold}g</div>
                          <button
                            onClick={handleSellCategory}
                            disabled={!onSell}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all ${!onSell ? 'bg-gray-700/60 text-gray-400 cursor-not-allowed' : 'bg-green-700 text-white hover:bg-green-600'}`}
                          >
                            Sell all
                          </button>
                        </div>
                      </div>
                    );
                  })()
                )}

              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}