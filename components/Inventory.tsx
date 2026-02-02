import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AnimatedCard } from './AnimatedUI';
import { InventoryItem, EquipmentSlot } from '../types';
import { Shield, Sword, FlaskConical, Gem, Key, Package, Trash2, Plus, Coins, Apple, Droplets, Tent, ArrowDownToLine as ArrowDownToLineAlt, ArrowUpFromLine as ArrowUpFromLineAlt, ArrowUpDown, User, Backpack, Check, ShoppingBag, Weight, Star, Eye, EyeOff, Heart, Zap, Sparkles } from 'lucide-react';
import RarityBadge from './RarityBadge';
import { isFeatureEnabled, isFeatureWIP, getFeatureLabel } from '../featureFlags';
import { EquipmentHUD, getDefaultSlotForItem, SLOT_CONFIGS_EXPORT } from './EquipmentHUD';
import { isTwoHandedWeapon, isShield, canEquipInOffhand, canEquipInMainhand } from '../services/equipment';
import { ShopModal } from './ShopModal';
import { getItemBaseAndBonus } from '../services/upgradeService';
import BlacksmithModal from './BlacksmithModal';
import { SHOP_INVENTORY } from './ShopModal';
import { useAppContext } from '../AppContext';
import { useLocalization } from '../services/localization';
import { getItemName } from '../services/itemLocalization';
import ConfirmModal from './ConfirmModal';
import { getItemStats, shouldHaveStats } from '../services/itemStats';
import { EncumbranceIndicator } from './StatusIndicators';
import { DropdownSelector, SortSelector } from './GameFeatures';
import { getFoodNutritionDisplay, getDrinkNutritionDisplay } from '../services/nutritionData';
import { resolvePotionEffect } from '../services/potionResolver';
import { audioService } from '../services/audioService';
import { LoadoutManager } from './LoadoutManager';

const uniqueId = () => Math.random().toString(36).substring(2, 11);

// Default weights by item type
const getDefaultItemWeight = (type: string): number => {
  switch (type) {
    case 'weapon': return 8;
    case 'apparel': return 5;
    case 'potion': return 0.5;
    case 'ingredient': return 0.1;
    case 'food': return 0.5;
    case 'drink': return 0.5;
    case 'key': return 0;
    case 'misc': return 1;
    case 'camping': return 10;
    default: return 1;
  }
};

interface InventoryProps {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  gold: number;
  setGold: (amount: number) => void;
  maxCarryWeight?: number;
  onUseItem?: (item: InventoryItem) => void;
}

const COMMON_ITEMS = [
  { name: "Iron Sword", baseId: "iron_sword", type: "weapon", desc: "A standard Imperial issue sword." },
  { name: "Steel Dagger", baseId: "steel_dagger", type: "weapon", desc: "Sharp and lightweight." },
  { name: "Iron Helmet", baseId: "iron_helmet", type: "apparel", desc: "Basic protection." },
  { name: "Leather Armor", baseId: "leather_armor", type: "apparel", desc: "Lightweight armor." },
  { name: "Health Potion (Minor)", baseId: "minor_health", type: "potion", desc: "Restores 25 points of Health." },
  { name: "Magicka Potion (Minor)", baseId: "minor_magicka", type: "potion", desc: "Restores 25 points of Magicka." },
  { name: "Lockpick", type: "misc", desc: "Used to open locks." },
  { name: "Torch", type: "misc", desc: "Provides light." },
  { name: "Sweetroll", type: "ingredient", desc: "A sticky treat." },
];

const InventoryItemCard: React.FC<{
  item: InventoryItem;
  onUpdate: (updated: InventoryItem) => void;
  onRemove: () => void;
  onDeltaQuantity: (delta: number) => void;
  onEquip?: (item: InventoryItem) => void;
  onUnequip?: (item: InventoryItem) => void;
  onUse?: (item: InventoryItem) => void;
  getIcon: (type: string) => React.ReactNode;
  showDebug?: boolean;
}> = ({ item, onUpdate, onRemove, onDeltaQuantity, onEquip, onUnequip, onUse, getIcon, showDebug }) => {
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editDesc, setEditDesc] = useState(item.description);
  const [editQty, setEditQty] = useState(item.quantity);

  const { showQuantityControls } = useAppContext();
  const { t } = useLocalization();

  const startEdit = () => {
    setEditName(item.name);
    setEditDesc(item.description);
    setEditQty(item.quantity);
    setEditMode(true);
  };

  const handleSave = () => {
    const nextQty = Number.isFinite(editQty) ? Math.max(1, editQty) : 1;
    onUpdate({ ...item, name: editName, description: editDesc, quantity: nextQty });
    setEditMode(false);
  };

  const canEquip = item.type === 'weapon' || item.type === 'apparel';
  const canUse = ['food', 'drink', 'potion', 'ingredient'].includes(item.type);
  const isEquipped = item.equipped;

  return (
    <AnimatedCard
      data-testid={`inventory-item-${item.id}`}
      className={`p-4 flex items-center gap-4 transition-all duration-300 ${isEquipped
        ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] bg-amber-950/20'
        : ''
        } ${item.enchantments && item.enchantments.length > 0 ? 'ring-1 ring-purple-500/30 bg-gradient-to-r from-purple-900/10 to-transparent shadow-[0_0_10px_rgba(168,85,247,0.1)]' : ''}`}
    >
      <div className={`p-3 rounded-full border ${isEquipped
        ? 'bg-skyrim-gold/30 text-skyrim-gold border-skyrim-gold'
        : 'bg-skyrim-paper/40 text-skyrim-gold border-skyrim-border'
        }`}>
        {getIcon(item.type)}
      </div>
      <div className="flex-1 min-w-0">
        {editMode ? (
          <>
            <input
              className="w-full bg-skyrim-paper/40 border border-skyrim-border p-1 rounded text-skyrim-gold font-serif mb-1"
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
            {showQuantityControls && (
              <input
                className="w-20 bg-skyrim-paper/40 border border-skyrim-border p-1 rounded text-skyrim-text mb-1"
                type="number"
                min={1}
                value={editQty}
                onChange={e => setEditQty(Number(e.target.value))}
              />
            )}
            <div className="flex gap-2 mt-2">
              <button onClick={handleSave} className="px-2 py-1 bg-skyrim-gold text-skyrim-dark rounded text-xs">{t('common.save')}</button>
              <button onClick={() => setEditMode(false)} className="px-2 py-1 bg-gray-600 text-white rounded text-xs">{t('common.cancel')}</button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-skyrim-gold font-serif truncate flex items-center gap-2">
                {getItemName(item, t)}
                {item.enchantments && item.enchantments.length > 0 && (
                  <span className="flex items-center gap-1 text-purple-300 text-xs">
                    <Sparkles size={12} /> <span className="sr-only">Enchanted</span>
                  </span>
                )}
              </h3>
              {item.rarity && (
                <span className="ml-2">
                  {/* Rarity badge */}
                  <RarityBadge rarity={item.rarity} />
                </span>
              )}
              <span className="text-xs text-gray-500">x{item.quantity}</span>
              {isEquipped && (
                <span className="text-[10px] px-1.5 py-0.5 bg-skyrim-gold/30 text-skyrim-gold rounded border border-skyrim-gold/50 flex items-center gap-1">
                  <Check size={10} /> Equipped
                </span>
              )}
            </div>
            {showDebug && (
              <div className="mt-1 text-xs font-mono text-gray-400">
                ID: {item.id} • Key: {(item.name || '').toLowerCase().trim()}|{item.rarity || ''}|{item.upgradeLevel || 0}|{item.damage || 0}|{item.armor || 0}
              </div>
            )}
            <p className="text-sm text-skyrim-text truncate">{item.description}</p>
            {/* Stats display - get from item or itemStats service */}
            {(() => {
              let displayArmor = item.armor;
              let displayDamage = item.damage;
              // If base/bonus metadata is available, prefer showing breakdowns
              try {
                const breakdown = getItemBaseAndBonus(item as any);
                if (breakdown.totalArmor) displayArmor = breakdown.totalArmor;
                if (breakdown.totalDamage) displayDamage = breakdown.totalDamage;
              } catch (e) { }
              let displayValue = item.value;
              let displayWeight = item.weight;
              // If item doesn't have stats but should, get from itemStats
              if ((displayArmor === undefined || displayDamage === undefined) && shouldHaveStats(item.type)) {
                const stats = getItemStats(item.name, item.type);
                if (displayArmor === undefined) displayArmor = stats.armor;
                if (displayDamage === undefined) displayDamage = stats.damage;
                if (displayValue === undefined) displayValue = stats.value;
              }
              // Always show weight, use default if not set
              if (displayWeight === undefined) displayWeight = getDefaultItemWeight(item.type);
              return (
                <div className="flex gap-3 mt-1 text-xs flex-wrap">
                  {displayDamage !== undefined && displayDamage !== null && (
                    <span className="text-red-400 flex items-center gap-1">
                      <Sword size={12} /> {displayDamage}
                    </span>
                  )}
                  {displayArmor !== undefined && displayArmor !== null && (
                    <span className="text-blue-400 flex items-center gap-1">
                      <Shield size={12} /> {displayArmor}
                    </span>
                  )}
                  {displayValue !== undefined && displayValue !== null && (
                    <span className="text-yellow-500 flex items-center gap-1">
                      <Coins size={12} /> {displayValue}g
                    </span>
                  )}
                  <span className="text-gray-300 flex items-center gap-1">
                    <Weight size={12} /> {displayWeight} <span className="text-gray-500">wt</span>
                  </span>
                </div>
              );
            })()}
            {/* Consumable effects display */}
            {item.type === 'food' && (
              <div className="mt-1 text-xs text-green-400 flex items-center gap-1">
                <Apple size={12} /> {getFoodNutritionDisplay(item.name)}
              </div>
            )}
            {item.type === 'drink' && (
              <div className="mt-1 text-xs text-blue-400 flex items-center gap-1">
                <Droplets size={12} /> {getDrinkNutritionDisplay(item.name)}
              </div>
            )}
            {item.type === 'potion' && (() => {
              const potionEffect = resolvePotionEffect(item);
              if (potionEffect && potionEffect.stat && potionEffect.amount) {
                const effects: string[] = [];
                if (potionEffect.stat === 'health') effects.push(`+${potionEffect.amount} HP`);
                if (potionEffect.stat === 'magicka') effects.push(`+${potionEffect.amount} MP`);
                if (potionEffect.stat === 'stamina') effects.push(`+${potionEffect.amount} SP`);
                return effects.length > 0 ? (
                  <div className="mt-1 text-xs text-purple-400 flex items-center gap-1">
                    <Sparkles size={12} /> {effects.join(', ')}
                  </div>
                ) : null;
              }
              return null;
            })()}
            <div className="flex gap-2 mt-2 flex-wrap">
              {canEquip && (
                <button
                  onClick={() => isEquipped ? onUnequip?.(item) : onEquip?.(item)}
                  className={`px-2 py-1 rounded text-xs ${isEquipped
                    ? 'bg-red-700/60 text-white hover:bg-red-600'
                    : 'bg-green-700/60 text-white hover:bg-green-600'
                    }`}
                >
                  {isEquipped ? t('inventory.unequip') : t('inventory.equip')}
                </button>
              )}
              {canUse && onUse && (
                <button
                  onClick={() => onUse(item)}
                  className="px-2 py-1 bg-blue-700/60 text-white hover:bg-blue-600 rounded text-xs"
                >
                  {t('inventory.use')}
                </button>
              )}
              <button
                onClick={() => onUpdate({ ...item, isFavorite: !item.isFavorite })}
                title={item.isFavorite ? t('inventory.unmarkFavorite') : t('inventory.markFavorite')}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${item.isFavorite ? 'bg-yellow-500 text-black' : 'bg-skyrim-paper/30 text-gray-300 hover:bg-skyrim-paper/50'}`}>
                <Star size={14} />
              </button>
              <button onClick={startEdit} className="px-2 py-1 bg-skyrim-gold/20 text-skyrim-gold rounded text-xs">{t('common.edit')}</button>
              {showQuantityControls && (
                <>
                  <button onClick={() => onDeltaQuantity(1)} className="px-2 py-1 bg-green-700/60 text-white rounded text-xs">+1</button>
                  <button onClick={() => onDeltaQuantity(-1)} className="px-2 py-1 bg-red-700/60 text-white rounded text-xs">-1</button>
                </>
              )}
            </div>
          </>
        )}
      </div>
      <button onClick={onRemove} className="text-gray-600 hover:text-red-500 flex-shrink-0 transition-colors">
        <Trash2 size={16} />
      </button>
    </AnimatedCard>
  );
};

export const Inventory: React.FC<InventoryProps> = ({ items, setItems, gold, setGold, maxCarryWeight = 300, onUseItem }) => {
  const { t } = useLocalization();
  const [showDebugIds, setShowDebugIds] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  // Confirm delete flow for inventory items
  const [confirmRemoveItemId, setConfirmRemoveItemId] = useState<string | null>(null);
  const [confirmRemoveItemName, setConfirmRemoveItemName] = useState<string | null>(null);
  const [newType, setNewType] = useState<InventoryItem['type']>('misc');
  const [newDesc, setNewDesc] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | InventoryItem['type'] | 'favorites'>('all');
  const [sortOrder, setSortOrder] = useState<string>('name:asc');
  const [viewMode, setViewMode] = useState<'inventory' | 'equipment'>('inventory');
  const [equipModalOpen, setEquipModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [blacksmithOpen, setBlacksmithOpen] = useState(false);

  // Get shop handlers and UI helpers from context
  const { handleShopPurchase, handleShopSell, characterLevel, handleEatItem, handleDrinkItem, showToast, showQuantityControls, setShowQuantityControls } = useAppContext();

  // Calculate total carry weight
  const totalWeight = useMemo(() => {
    return items.reduce((total, item) => {
      const weight = item.weight ?? getDefaultItemWeight(item.type);
      return total + (weight * (item.quantity || 1));
    }, 0);
  }, [items]);

  const isOverEncumbered = totalWeight > maxCarryWeight;

  // Category tabs configuration
  const CATEGORY_TABS: any[] = [
    { key: 'all', label: t('category.all'), icon: <Package size={14} /> },
    { key: 'favorites', label: t('category.favorites'), icon: <Star size={14} /> },
    { key: 'weapon', label: t('category.weapons'), icon: <Sword size={14} /> },
    { key: 'apparel', label: t('category.apparel'), icon: <Shield size={14} /> },
    // Jewelry is treated as apparel; separate Jewelry tab removed to avoid mismatch with item.type
    { key: 'potion', label: t('category.potions'), icon: <FlaskConical size={14} /> },
    { key: 'food', label: t('category.food'), icon: <Apple size={14} /> },
    { key: 'drink', label: t('category.drink'), icon: <Droplets size={14} /> },
    { key: 'camping', label: t('category.camping'), icon: <Tent size={14} /> },
    { key: 'ingredient', label: t('category.ingredients'), icon: <FlaskConical size={14} /> },
    { key: 'key', label: t('category.keys'), icon: <Key size={14} /> },
    { key: 'misc', label: t('category.misc'), icon: <Package size={14} /> },
  ];

  // Deduplicate and sort items
  const sortedItems = useMemo(() => {
    // Deduplicate by ID
    const uniqueMap = new Map<string, InventoryItem>();
    items.forEach(item => {
      const existing = uniqueMap.get(item.id);
      if (!existing || (item.createdAt || 0) > (existing.createdAt || 0)) {
        uniqueMap.set(item.id, item);
      }
    });

    // Group items: keep weapons/apparel separate (non-stackable by default),
    // otherwise merge by a composite key that includes rarity/upgrade/stats.
    const nameMap = new Map<string, InventoryItem>();
    Array.from(uniqueMap.values()).forEach(item => {
      if (item.type === 'weapon' || item.type === 'apparel') {
        // preserve as unique entries by id for equipment
        nameMap.set(item.id, item);
        return;
      }

      const key = `${(item.name || '').toLowerCase().trim()}|${String(item.rarity || '')}|${Number(item.upgradeLevel || 0)}|${Number(item.damage || 0)}|${Number(item.armor || 0)}`;
      const existing = nameMap.get(key);
      if (existing) {
        nameMap.set(key, { ...existing, quantity: (existing.quantity || 0) + (item.quantity || 0) });
      } else {
        nameMap.set(key, item);
      }
    });

    // Filter out items with zero or negative quantity (prevents "x0" display bugs)
    let uniqueItems = Array.from(nameMap.values()).filter(item => (item.quantity || 0) > 0);

    // Filter by category tab (including favorites)
    if (activeTab === 'favorites') {
      uniqueItems = uniqueItems.filter(item => item.isFavorite);
    } else if (activeTab !== 'all') {
      uniqueItems = uniqueItems.filter(item => item.type === activeTab);
    }

    // Sort based on sortOrder with optional direction support (e.g., 'name:asc' or 'name:desc')
    const [key, dir] = (sortOrder || 'name:asc').split(':');

    // Rarity order for sorting: no rarity -> common -> uncommon -> rare -> mythic -> epic -> legendary
    const RARITY_ORDER: Record<string, number> = {
      '': 0,
      'none': 0,
      'common': 1,
      'uncommon': 2,
      'rare': 3,
      'mythic': 4,
      'epic': 5,
      'legendary': 6,
      'daedric': 7,
      'artifact': 8
    };
    const getRarityValue = (it: InventoryItem) => RARITY_ORDER[(it.rarity || '').toLowerCase()] ?? 0;

    return uniqueItems.sort((a, b) => {
      const asc = dir !== 'desc';
      const getDamage = (it: InventoryItem) => it.damage ?? getItemStats(it.name, it.type).damage ?? 0;
      const getValue = (it: InventoryItem) => it.value ?? getItemStats(it.name, it.type).value ?? 0;
      const cmp = (() => {
        switch (key) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'type':
            return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
          case 'newest':
            return (b.createdAt || 0) - (a.createdAt || 0);
          case 'quantity':
            return b.quantity - a.quantity || a.name.localeCompare(b.name);
          case 'damage':
            return getDamage(b) - getDamage(a) || a.name.localeCompare(b.name);
          case 'value':
            return getValue(b) - getValue(a) || a.name.localeCompare(b.name);
          case 'rarity':
            return getRarityValue(b) - getRarityValue(a) || a.name.localeCompare(b.name);
          default:
            return 0;
        }
      })();
      return asc ? cmp : -cmp;
    });
  }, [items, activeTab, sortOrder]);

  // Get item counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    counts['favorites'] = items.filter(i => i.isFavorite).length;
    return counts;
  }, [items]);

  const addItem = () => {
    if (!newName.trim()) return;
    const newItem: InventoryItem = {
      id: uniqueId(),
      characterId: '', // Will be set by setCharacterItems
      name: newName,
      baseId: (COMMON_ITEMS.find(i => i.name === newName) as any)?.baseId,
      type: newType,
      description: newDesc,
      quantity: 1,
      equipped: false,
      createdAt: Date.now()
    };
    setItems([...items, newItem]);
    setNewName('');
    setNewDesc('');
    setIsAdding(false);
  };

  const handleQuickSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value);
    if (idx >= 0) {
      const item = COMMON_ITEMS[idx];
      setNewName(item.name);
      setNewType(item.type as any);
      setNewDesc(item.desc);
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (updated: InventoryItem) => {
    setItems(items.map(i => (i.id === updated.id ? updated : i)));
  };

  const deltaItemQuantity = (id: string, delta: number) => {
    const current = items.find(i => i.id === id);
    if (!current) return;
    const nextQty = current.quantity + delta;
    if (nextQty <= 0) {
      removeItem(id);
      return;
    }
    updateItem({ ...current, quantity: nextQty });
  };

  // Equip an item to a slot
  const equipItem = (item: InventoryItem, slot?: EquipmentSlot) => {
    const targetSlot = slot || getDefaultSlotForItem(item);
    if (!targetSlot) return;
    // Validate equip restrictions
    if (targetSlot === 'offhand' && isTwoHandedWeapon(item)) {
      showToast('Cannot equip two-handed weapons in off-hand.', 'warning');
      return;
    }
    if (targetSlot === 'weapon' && isShield(item)) {
      showToast('Cannot equip shields in main hand.', 'warning');
      return;
    }

    // If equipping to offhand while a two-handed weapon is in main hand, auto-unequip that two-handed weapon
    let unequipMainTwoHandedId: string | null = null;
    if (targetSlot === 'offhand') {
      const mainEquipped = items.find(i => i.equipped && i.slot === 'weapon');
      if (mainEquipped && isTwoHandedWeapon(mainEquipped)) {
        unequipMainTwoHandedId = mainEquipped.id;
      }
    }

    // If equipping a two-handed weapon to main hand, auto-unequip any offhand item
    const updatedItems = items.map(i => {
      // Block items currently equipped by a companion
      if (i.id === item.id) {
        if (i.equippedBy && i.equippedBy !== 'player') {
          showToast('Item is equipped by a companion. Unequip from companion first.', 'warning');
          return i;
        }
        return { ...i, equipped: true, slot: targetSlot, equippedBy: 'player' };
      }
      // Unequip other items in the same slot
      if (i.equipped && i.slot === targetSlot) {
        return { ...i, equipped: false, slot: undefined, equippedBy: null };
      }
      // Auto-unequip offhand when equipping two-handed in main
      if (targetSlot === 'weapon' && isTwoHandedWeapon(item) && i.equipped && i.slot === 'offhand') {
        return { ...i, equipped: false, slot: undefined, equippedBy: null };
      }
      // Auto-unequip main two-handed when equipping to offhand
      if (unequipMainTwoHandedId && i.id === unequipMainTwoHandedId) {
        return { ...i, equipped: false, slot: undefined, equippedBy: null };
      }
      return i;
    });

    // Play equip sound
    audioService.playSoundEffect('item_equip');

    setItems(updatedItems);
    setEquipModalOpen(false);
    setSelectedSlot(null);
  };

  // Unequip an item
  const unequipItem = (item: InventoryItem) => {
    // Play unequip sound
    audioService.playSoundEffect('item_unequip');
    updateItem({ ...item, equipped: false, slot: undefined, equippedBy: null });
  };

  // Open equip modal for a specific slot
  const openEquipModal = (slot: EquipmentSlot) => {
    setSelectedSlot(slot);
    setEquipModalOpen(true);
  };

  // Get items that can be equipped to a specific slot
  const getEquippableItemsForSlot = (slot: EquipmentSlot) => {
    const slotConfig = SLOT_CONFIGS_EXPORT.find(s => s.slot === slot);
    if (!slotConfig) return [];

    return items.filter(item => {
      if (item.equipped) return false;
      if (!slotConfig.allowedTypes.includes(item.type)) return false;

      // Enforce explicit slot rules for hands/main/offhand
      if (slot === 'offhand') {
        return canEquipInOffhand(item);
      }
      if (slot === 'weapon') {
        // Prevent shields in main hand
        if (isShield(item)) return false;
        // Allow small weapons and two-handed weapons
        return canEquipInMainhand(item);
      }

      // Default fallback: use default slot inference
      const defaultSlot = getDefaultSlotForItem(item);
      return defaultSlot === slot || !defaultSlot;
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'weapon': return <Sword size={18} />;
      case 'apparel': return <Shield size={18} />;
      case 'potion': return <FlaskConical size={18} />;
      case 'food': return <Apple size={18} />;
      case 'drink': return <Droplets size={18} />;
      case 'camping': return <Tent size={18} />;
      case 'ingredient': return <FlaskConical size={18} />;
      case 'key': return <Key size={18} />;
      case 'misc': return <Package size={18} />;
      default: return <Gem size={18} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 px-2 sm:px-4">
      <div className="mb-8 p-4 sm:p-6 glass-panel border-y-0 border-zinc-700/50 text-center rounded-xl shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-serif text-skyrim-gold mb-2">{t('inventory.title')}</h1>
          <p className="text-gray-500 font-sans text-sm">{t('inventory.subtitle')}</p>

          {/* Encumbrance Display */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <EncumbranceIndicator
              currentWeight={totalWeight}
              maxWeight={maxCarryWeight}
            />
          </div>

          {isOverEncumbered && (
            <div className="mt-3 text-red-400 text-sm animate-pulse">
              {t('inventory.overEncumbered')}
            </div>
          )}
        </div>
      </div>

      {/* View Toggle: Inventory / Equipment */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-lg glass-panel-lighter border border-zinc-700/50 p-1 gap-1">
          <button
            onClick={() => setViewMode('inventory')}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded transition-all duration-300 ${viewMode === 'inventory'
              ? 'bg-zinc-800 text-amber-500 font-bold shadow-md'
              : 'text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/50'
              }`}
          >
            <Backpack size={16} />
            <span>{t('inventory.viewInventory')}</span>
          </button>
          <button
            onClick={() => setViewMode('equipment')}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded transition-all duration-300 ${viewMode === 'equipment'
              ? 'bg-zinc-800 text-amber-500 font-bold shadow-md'
              : 'text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/50'
              }`}
          >
            <User size={16} />
            <span>{t('inventory.viewEquipment')}</span>
          </button>
        </div>
      </div>

      {/* Equipment View */}
      {viewMode === 'equipment' && (
        <div className="mb-8 space-y-4">
          <EquipmentHUD
            items={items}
            onUnequip={unequipItem}
            onEquipFromSlot={openEquipModal}
          />

          {/* Loadout Manager in Equipment View */}
          <LoadoutManager
            items={items}
            characterId={items[0]?.characterId}
            onApplyLoadout={(mapping) => {
              // Apply the loadout by updating items' equipped state
              const updatedItems = items.map(it => ({
                ...it,
                equipped: !!mapping[it.id],
                slot: mapping[it.id]?.slot
              }));
              setItems(updatedItems);
            }}
            showToast={showToast}
          />
        </div>
      )}

      {/* Equip Modal */}
      {equipModalOpen && selectedSlot && (
        <div className="fixed inset-0 bg-skyrim-dark/60 backdrop-lite flex items-center justify-center z-50 p-4">
          <div className="bg-skyrim-paper border-2 border-skyrim-gold rounded-lg shadow-cheap p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-serif text-skyrim-gold mb-4">
              {t('inventory.selectItem', { slot: selectedSlot.charAt(0).toUpperCase() + selectedSlot.slice(1) })}
            </h3>

            {
              (() => {
                let candidates = getEquippableItemsForSlot(selectedSlot);
                if (favoritesOnly) candidates = candidates.filter(i => i.isFavorite);
                if (candidates.length === 0) {
                  return (
                    <p className="text-skyrim-text italic text-center py-4">{t('inventory.noSuitable')}</p>
                  );
                }

                return (
                  <div className="space-y-2">
                    {candidates.map(item => (
                      <button
                        key={item.id}
                        onClick={() => equipItem(item, selectedSlot)}
                        className="w-full p-3 bg-skyrim-paper/40 border border-skyrim-border rounded hover:border-skyrim-gold hover:bg-skyrim-paper/60 transition-colors text-left flex items-center gap-3"
                      >
                        <div className="p-2 rounded-full bg-skyrim-gold/20 text-skyrim-gold">
                          {getIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <div className="text-skyrim-gold font-serif">{item.name}</div>
                          <div className="text-xs text-skyrim-text">{item.description}</div>
                          {(item.armor || item.damage) && (
                            <div className="flex gap-3 mt-1 text-xs">
                              {item.armor && (() => {
                                const b = getItemBaseAndBonus(item as any);
                                return <span className="text-blue-400">{t('equipment.armor')}: {b.totalArmor}{b.bonusArmor ? ` (${b.baseArmor} + ${b.bonusArmor})` : ''}</span>;
                              })()}
                              {item.damage && (() => {
                                const b = getItemBaseAndBonus(item as any);
                                return <span className="text-red-400">{t('equipment.damage')}: {b.totalDamage}{b.bonusDamage ? ` (${b.baseDamage} + ${b.bonusDamage})` : ''}</span>;
                              })()}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()
            }

            <div className="mt-3 flex items-center gap-2">
              <label className="text-sm text-skyrim-text">{t('inventory.favoritesOnly')}</label>
              <button onClick={() => setFavoritesOnly(v => !v)} className={`px-3 py-1 rounded ${favoritesOnly ? 'bg-yellow-500 text-black' : 'bg-skyrim-paper/30 text-skyrim-text'}`}>
                <Star size={14} />
              </button>
            </div>

            <button
              onClick={() => { setEquipModalOpen(false); setSelectedSlot(null); }}
              className="mt-4 w-full py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Inventory View */}
      {viewMode === 'inventory' && (
        <>
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 glass-panel p-4 rounded-xl border border-zinc-700/50 shadow-lg">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-3 bg-yellow-900/30 rounded-full border border-yellow-700 text-yellow-500">
                <Coins size={24} />
              </div>
              <div className="flex-1">
                <div className="text-xs text-skyrim-text uppercase tracking-widest">{t('inventory.gold')}</div>
                <input
                  type="number"
                  value={gold}
                  onChange={(e) => setGold(parseInt(e.target.value) || 0)}
                  className="bg-transparent text-2xl font-serif text-yellow-500 w-32 focus:outline-none"
                />
                <div className="text-[10px] text-amber-500 mt-1">
                  ⚠ Manually adjust only if needed. Shop transactions are automatic.
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {(isFeatureEnabled('shop') || isFeatureWIP('shop')) && (
                isFeatureEnabled('shop') ? (
                  <button
                    onClick={() => setShopOpen(true)}
                    className="px-4 py-2 bg-amber-700 text-white hover:bg-amber-600 transition-colors rounded flex items-center gap-2 font-bold"
                  >
                    <ShoppingBag size={18} /> {t('inventory.shop')}
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 bg-gray-700 text-gray-400 cursor-not-allowed transition-colors rounded flex items-center gap-2 font-bold"
                    title={getFeatureLabel('shop') || 'Work in Progress'}
                    onClick={(e) => e.preventDefault()}
                  >
                    <ShoppingBag size={18} /> Shop
                  </button>
                )
              )}
              <button
                onClick={() => setBlacksmithOpen(true)}
                data-sfx="button_click"
                className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 transition-colors rounded flex items-center gap-2 font-bold"
              >
                {t('inventory.blacksmith')}
              </button>
              <button
                onClick={() => setIsAdding(!isAdding)}
                data-sfx="button_click"
                className="px-4 py-2 border border-skyrim-gold text-skyrim-gold hover:bg-skyrim-gold hover:text-skyrim-dark transition-colors rounded flex items-center gap-2"
              >
                <Plus size={18} /> {t('inventory.addItem')}
              </button>

            </div>
          </div>

          {isAdding && (
            <div className="mb-6 glass-panel border border-amber-500/30 p-4 rounded-xl flex flex-col gap-4 animate-in fade-in shadow-lg">
              <div className="bg-amber-900/30 border border-amber-600 rounded px-3 py-2 text-amber-200 text-sm">
                <strong>⚠ {t('inventory.manualAdd')}:</strong> {t('inventory.manualAddWarning')}
              </div>
              <div className="w-full">
                <label className="text-xs text-gray-500 uppercase">{t('inventory.quickSelect')}</label>
                <DropdownSelector
                  currentValue={-1}
                  onSelect={(value) => handleQuickSelect({ target: { value: parseInt(value) } } as any)}
                  options={[
                    { id: '-1', label: '-- Custom --' },
                    ...COMMON_ITEMS.map((item, i) => ({ id: i.toString(), label: getItemName(item as any, t) }))
                  ]}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 w-full">
                  <label className="text-xs text-gray-500 uppercase">{t('inventory.itemName')}</label>
                  <input className="w-full bg-skyrim-paper/40 border border-skyrim-border p-2 rounded text-skyrim-text" value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                <div className="w-full md:w-32">
                  <label className="text-xs text-gray-500 uppercase">{t('inventory.itemType')}</label>
                  <DropdownSelector
                    currentValue={newType}
                    onSelect={(value) => setNewType(value as any)}
                    options={[
                      { id: 'weapon', label: 'Weapon' },
                      { id: 'apparel', label: 'Apparel' },
                      { id: 'potion', label: 'Potion' },
                      { id: 'ingredient', label: 'Ingredient' },
                      { id: 'key', label: 'Key' },
                      { id: 'misc', label: 'Misc' }
                    ]}
                  />
                </div>
              </div>
              <div className="flex-1 w-full">
                <label className="text-xs text-gray-500 uppercase">{t('inventory.itemDesc')}</label>
                <input className="w-full bg-skyrim-paper/40 border border-skyrim-border p-2 rounded text-skyrim-text" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <button onClick={addItem} className="px-6 py-2 bg-skyrim-gold text-skyrim-dark font-bold rounded">{t('inventory.addToInventory')}</button>
              </div>
            </div>
          )}

          {/* Category Tabs */}
          <div className="mb-6 overflow-x-auto pb-2 -mx-2 px-2">
            <div className="flex gap-2 min-w-max">
              {CATEGORY_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`nav-link-saas flex-shrink-0 !py-2.5 !px-4 ${activeTab === tab.key ? 'active' : ''}`}
                >
                  <span className="text-saas-accent-glow/70">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                  {categoryCounts[tab.key] > 0 && (
                    <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-saas-accent/20 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                      {categoryCounts[tab.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Controls */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-skyrim-text">
              {sortedItems.length} {sortedItems.length === 1 ? 'item' : 'items'}
              {activeTab !== 'all' && ` in ${CATEGORY_TABS.find(t => t.key === activeTab)?.label}`}
            </span>
            <div className="flex items-center gap-2">
              <SortSelector
                currentSort={sortOrder}
                allowDirection={true}
                onSelect={(value) => setSortOrder(value)}
                options={[
                  { id: 'name', label: t('sort.name') },
                  { id: 'type', label: t('sort.type') },
                  { id: 'rarity', label: t('sort.rarity') },
                  { id: 'newest', label: t('sort.newest') },
                  { id: 'quantity', label: t('sort.quantity') },
                  { id: 'damage', label: t('sort.damage') },
                  { id: 'value', label: t('sort.value') }
                ]}
              />
              <button onClick={() => setShowDebugIds(s => !s)} className={`px-2 py-1 text-xs rounded ${showDebugIds ? 'bg-sky-600 text-white' : 'bg-skyrim-paper/30 text-skyrim-text'}`}>{showDebugIds ? t('inventory.hideIds') : t('inventory.showIds')}</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedItems.map((item) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                getIcon={getIcon}
                onUpdate={updateItem}
                onDeltaQuantity={(delta) => deltaItemQuantity(item.id, delta)}
                onRemove={() => { setConfirmRemoveItemId(item.id); setConfirmRemoveItemName(item.name); }}
                onEquip={(item) => equipItem(item)}
                onUnequip={unequipItem}
                onUse={onUseItem}
                showDebug={showDebugIds}
              />
            ))}
            {confirmRemoveItemId && (
              <ConfirmModal
                open={!!confirmRemoveItemId}
                danger
                title="Delete Item"
                description={<span>{t('inventory.deleteConfirm', { item: confirmRemoveItemName || '' })}</span>}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onCancel={() => { setConfirmRemoveItemId(null); setConfirmRemoveItemName(null); }}
                onConfirm={() => { if (confirmRemoveItemId) removeItem(confirmRemoveItemId); setConfirmRemoveItemId(null); setConfirmRemoveItemName(null); }}
              />
            )}

            {sortedItems.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-600 italic font-serif">
                {activeTab === 'all' ? t('inventory.empty') : t('inventory.emptyCategory', { category: CATEGORY_TABS.find(t => t.key === activeTab)?.label.toLowerCase() || 'item' })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Shop Modal */}
      {(isFeatureEnabled('shop') || isFeatureWIP('shop')) && (
        <ShopModal
          open={shopOpen}
          onClose={() => setShopOpen(false)}
          gold={gold}
          onPurchase={handleShopPurchase}
          inventory={items}
          onSell={handleShopSell}
          characterLevel={characterLevel}
        />
      )}
      <BlacksmithModal
        open={blacksmithOpen}
        onClose={() => setBlacksmithOpen(false)}
        items={items}
        setItems={setItems}
        gold={gold}
        setGold={setGold}
        shopItems={SHOP_INVENTORY}
      />
    </div>
  );
};