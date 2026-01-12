import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { X, ShoppingBag, Coins, Search, Package, Sword, Shield, FlaskConical, Tent, Apple, Droplets, ArrowDownToLine, ArrowUpFromLine, Check, Gem } from 'lucide-react';
import { useAppContext } from '../AppContext';
import type { InventoryItem } from '../types';
import { playSoundEffect } from '../services/audioService';
import { getItemStats, shouldHaveStats } from '../services/itemStats';

export interface ShopItem {
  id: string;
  name: string;
  type: 'weapon' | 'apparel' | 'potion' | 'ingredient' | 'misc' | 'food' | 'drink' | 'camping';
  description: string;
  price: number;
  category: string;
  requiredLevel?: number; // Optional level requirement to unlock item in shop
  subtype?: 'health' | 'magicka' | 'stamina';
}

// Comprehensive Skyrim-themed shop inventory
const SHOP_INVENTORY: ShopItem[] = [
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
  { id: 'stamina_potion_minor', name: 'Minor Stamina Potion', type: 'potion', description: 'Restores 25 stamina.', price: 15, category: 'Potions' },
  { id: 'stamina_potion', name: 'Stamina Potion', type: 'potion', subtype: 'stamina', description: 'Restores 50 stamina.', price: 35, category: 'Potions' },
  { id: 'cure_disease', name: 'Cure Disease Potion', type: 'potion', description: 'Cures all diseases.', price: 50, category: 'Potions' },
  { id: 'cure_poison', name: 'Cure Poison', type: 'potion', description: 'Removes poison effects.', price: 40, category: 'Potions' },
  { id: 'invisibility_potion', name: 'Invisibility Potion', type: 'potion', description: 'Become invisible for 30 seconds.', price: 120, category: 'Potions' },
  { id: 'resist_fire', name: 'Resist Fire Potion', type: 'potion', description: 'Resist 50% fire damage for 60 seconds.', price: 60, category: 'Potions' },
  { id: 'resist_frost', name: 'Resist Frost Potion', type: 'potion', description: 'Resist 50% frost damage for 60 seconds.', price: 60, category: 'Potions' },
  { id: 'resist_shock', name: 'Resist Shock Potion', type: 'potion', description: 'Resist 50% shock damage for 60 seconds.', price: 60, category: 'Potions' },

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
  
  // === JEWELRY ===
  { id: 'gold_ring', name: 'Gold Ring', type: 'apparel', description: 'A simple gold ring. Elegant and valuable.', price: 75, category: 'Jewelry' },
  { id: 'silver_ring', name: 'Silver Ring', type: 'apparel', description: 'A silver ring with a subtle shine.', price: 40, category: 'Jewelry' },
  { id: 'gold_necklace', name: 'Gold Necklace', type: 'apparel', description: 'A necklace made of pure gold.', price: 120, category: 'Jewelry' },
  { id: 'silver_necklace', name: 'Silver Necklace', type: 'apparel', description: 'A necklace crafted from fine silver.', price: 60, category: 'Jewelry' },
  { id: 'gold_circlet', name: 'Gold Circlet', type: 'apparel', description: 'A circlet of gold, fit for nobility.', price: 150, category: 'Jewelry' },
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
  characterLevel?: number; // Character level to filter shop items
}

export function ShopModal({ open, onClose, gold, onPurchase, inventory = [], onSell, characterLevel = 1 }: ShopModalProps) {
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [recentlyPurchased, setRecentlyPurchased] = useState<Set<string>>(new Set());
  const [recentlySold, setRecentlySold] = useState<Set<string>>(new Set());
  const { showQuantityControls } = useAppContext();

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

  const filteredShopItems = useMemo(() => {
    return SHOP_INVENTORY.filter(item => {
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
  }, [category, search, characterLevel]);

  const filteredInventoryItems = useMemo(() => {
    return inventory.filter(item => {
      // Don't allow selling keys
      if (item.type === 'key') return false;
      if ((item.quantity || 0) <= 0) return false;
      const matchesSearch = !search || 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [inventory, search]);

  const getQuantity = (id: string) => quantities[id] || 1;
  const setQuantity = (id: string, qty: number, max?: number) => {
    const newQty = Math.max(1, max ? Math.min(qty, max) : qty);
    setQuantities(prev => ({ ...prev, [id]: newQty }));
  };

  const handleBuy = (item: ShopItem) => {
    const qty = getQuantity(item.id);
    const total = item.price * qty;
    if (gold >= total) {
      onPurchase(item, qty);
      setQuantities(prev => ({ ...prev, [item.id]: 1 }));
      
      // Play purchase sound effect
      playSoundEffect('purchase');
      
      // Show purchase feedback
      setRecentlyPurchased(prev => new Set(prev).add(item.id));
      setTimeout(() => {
        setRecentlyPurchased(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
      }, 1500);
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

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] bg-skyrim-dark/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
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
            <button onClick={onClose} className="p-1.5 hover:bg-skyrim-paper/40 rounded transition-colors">
              <X size={18} className="text-skyrim-text hover:text-white" />
            </button>
          </div>
        </div>

        {/* Buy/Sell Tabs */}
        <div className="flex border-b border-skyrim-border/60 bg-skyrim-paper/20 flex-shrink-0">
          <button
            onClick={() => { setMode('buy'); setSearch(''); setCategory('All'); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              mode === 'buy'
                ? 'bg-skyrim-gold/20 text-skyrim-gold border-b-2 border-skyrim-gold'
                : 'text-skyrim-text hover:text-skyrim-text/80 hover:bg-skyrim-paper/20'
            }`}
          >
            <ArrowDownToLine size={16} />
            Buy
          </button>
          <button
            onClick={() => { setMode('sell'); setSearch(''); }}
            disabled={!onSell}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              mode === 'sell'
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
          {mode === 'buy' && (
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    category === cat
                      ? 'bg-skyrim-gold text-skyrim-dark font-bold'
                      : 'bg-skyrim-paper/30 text-skyrim-text hover:text-skyrim-text/80 hover:bg-skyrim-paper/50'
                  }`}
                >
                  {categoryIcons[cat]}
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {mode === 'buy' ? (
            // BUY MODE
            filteredShopItems.length === 0 ? (
              <div className="text-center text-gray-500 py-8 text-sm">No items found.</div>
            ) : (
              <div className="divide-y divide-skyrim-border/30">
                {filteredShopItems.map(item => {
                  const qty = showQuantityControls ? getQuantity(item.id) : 1;
                  const total = item.price * qty;
                  const canAfford = gold >= total;

                  return (
                    <div
                      key={item.id}
                      className={`px-3 py-2.5 flex items-center gap-3 hover:bg-skyrim-paper/20 transition-colors ${
                        !canAfford ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-skyrim-text font-medium text-sm truncate">{item.name}</span>
                          <span className="text-skyrim-text text-xs">({item.category})</span>
                          {/* Show stats for weapons and armor */}
                          {shouldHaveStats(item.type) && (() => {
                            const stats = getItemStats(item.name, item.type);
                            return (
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
                            );
                          })()}
                        </div>
                        <p className="text-gray-500 text-xs truncate">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                          <Coins size={12} />
                          {item.price}
                        </div>
                        {showQuantityControls && (
                          <div className="flex items-center bg-skyrim-paper/40 rounded border border-skyrim-border/50">
                            <button
                              onClick={() => setQuantity(item.id, qty - 1)}
                              className="px-1.5 py-0.5 text-skyrim-text hover:text-white text-xs"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-skyrim-text text-xs">{qty}</span>
                            <button
                              onClick={() => setQuantity(item.id, qty + 1)}
                              className="px-1.5 py-0.5 text-skyrim-text hover:text-white text-xs"
                            >
                              +
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => handleBuy(item)}
                          disabled={!canAfford || recentlyPurchased.has(item.id)}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-all duration-300 min-w-[70px] ${
                            recentlyPurchased.has(item.id)
                              ? 'bg-green-600 text-white scale-105'
                              : canAfford
                                ? 'bg-skyrim-gold text-skyrim-dark hover:bg-yellow-400'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {recentlyPurchased.has(item.id) ? (
                            <span className="flex items-center justify-center gap-1">
                              <Check size={12} />
                              Bought!
                            </span>
                          ) : (
                            `Buy ${total}g`
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            // SELL MODE
            filteredInventoryItems.length === 0 ? (
              <div className="text-center text-gray-500 py-8 text-sm">
                {search ? 'No matching items in your inventory.' : 'No items to sell.'}
              </div>
            ) : (
              <div className="divide-y divide-skyrim-border/30">
                {filteredInventoryItems.map(item => {
                  const maxQty = item.quantity || 1;
                  const qty = Math.min(getQuantity(item.id), maxQty);
                  const unitPrice = getSellPrice(item);
                  const total = unitPrice * qty;

                  return (
                    <div
                      key={item.id}
                      className="px-3 py-2.5 flex items-center gap-3 hover:bg-skyrim-paper/20 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-skyrim-text font-medium text-sm truncate">{item.name}</span>
                          <span className="text-gray-500 text-xs">×{item.quantity}</span>
                          {/* Show stats for weapons and armor */}
                          {(item.damage || item.armor) && (
                            <span className="flex items-center gap-2 text-xs">
                              {item.damage && (
                                <span className="flex items-center gap-0.5 text-red-400">
                                  <Sword size={10} /> {item.damage}
                                </span>
                              )}
                              {item.armor && (
                                <span className="flex items-center gap-0.5 text-blue-400">
                                  <Shield size={10} /> {item.armor}
                                </span>
                              )}
                            </span>
                          )}
                          {item.equipped && (
                            <span className="text-xs bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded">Equipped</span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs truncate">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
                          <Coins size={12} />
                          {unitPrice}/ea
                        </div>
                        {showQuantityControls && maxQty > 1 && (
                          <div className="flex items-center bg-skyrim-paper/40 rounded border border-skyrim-border/50">
                            <button
                              onClick={() => setQuantity(item.id, qty - 1, maxQty)}
                              className="px-1.5 py-0.5 text-skyrim-text hover:text-white text-xs"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-skyrim-text text-xs">{qty}</span>
                            <button
                              onClick={() => setQuantity(item.id, qty + 1, maxQty)}
                              className="px-1.5 py-0.5 text-skyrim-text hover:text-white text-xs"
                            >
                              +
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => handleSell(item)}
                          disabled={recentlySold.has(item.id)}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-all duration-300 min-w-[70px] ${
                            recentlySold.has(item.id)
                              ? 'bg-yellow-600 text-white scale-105'
                              : 'bg-green-700 text-white hover:bg-green-600'
                          }`}
                        >
                          {recentlySold.has(item.id) ? (
                            <span className="flex items-center justify-center gap-1">
                              <Check size={12} />
                              Sold!
                            </span>
                          ) : (
                            `Sell +${total}g`
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-skyrim-border/60 bg-skyrim-paper/20 flex-shrink-0">
          <p className="text-gray-500 text-xs text-center">
            {mode === 'buy' 
              ? `${filteredShopItems.length} items available` 
              : `${filteredInventoryItems.length} items to sell (50% value)`
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export { SHOP_INVENTORY };