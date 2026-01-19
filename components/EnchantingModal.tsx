/**
 * Enchanting Modal - Item enchanting workbench UI
 */

import React, { useState, useMemo } from 'react';
import { X, Sparkles, Gem, Flame, Snowflake, Zap, Shield, Swords, Wind, Eye, BookOpen, ChevronRight } from 'lucide-react';
import { InventoryItem } from '../types';
import {
  EnchantingState,
  Enchantment,
  SoulGem,
  ENCHANTMENTS,
  getLearnedEnchantmentsWithDetails,
  getFilledSoulGems,
  getEnchantmentsForItemType,
  calculateEnchantmentMagnitude,
  enchantItem,
  disenchantItem,
} from '../services/enchantingService';

interface EnchantingModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  enchantingState: EnchantingState;
  onUpdateEnchantingState?: (state: EnchantingState) => void;
  inventory: InventoryItem[];
  onRemoveFromInventory?: (itemId: string) => void;
  onAddToInventory?: (item: InventoryItem) => void;
  onGainXP?: (amount: number) => void;
  // Alternative callbacks from App.tsx
  onEnchantItem?: (itemId: string, enchantmentId: string, soulGemId: string, customName?: string) => void;
  onDisenchantItem?: (itemId: string) => void;
  onLearnEnchantment?: (enchantmentId: string) => void;
}

// School icons
const schoolIcons: Record<string, React.ReactNode> = {
  destruction: <Flame className="w-4 h-4 text-red-400" />,
  restoration: <Shield className="w-4 h-4 text-yellow-400" />,
  alteration: <Wind className="w-4 h-4 text-cyan-400" />,
  conjuration: <Sparkles className="w-4 h-4 text-purple-400" />,
  illusion: <Eye className="w-4 h-4 text-pink-400" />,
};

// Get effect icon
function getEffectIcon(effect: string): React.ReactNode {
  if (effect.includes('fire')) return <Flame className="w-3 h-3 text-orange-400" />;
  if (effect.includes('frost')) return <Snowflake className="w-3 h-3 text-cyan-400" />;
  if (effect.includes('shock')) return <Zap className="w-3 h-3 text-yellow-400" />;
  if (effect.includes('health')) return <Shield className="w-3 h-3 text-red-400" />;
  if (effect.includes('magicka')) return <Sparkles className="w-3 h-3 text-blue-400" />;
  if (effect.includes('stamina')) return <Wind className="w-3 h-3 text-green-400" />;
  return <Sparkles className="w-3 h-3 text-purple-400" />;
}

export default function EnchantingModal({
  open,
  isOpen,
  onClose,
  enchantingState,
  onUpdateEnchantingState,
  inventory,
  onRemoveFromInventory,
  onAddToInventory,
  onGainXP,
  onEnchantItem,
  onDisenchantItem,
  onLearnEnchantment,
}: EnchantingModalProps) {
  const isModalOpen = isOpen ?? open ?? false;
  const [mode, setMode] = useState<'enchant' | 'disenchant'>('enchant');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedEnchantment, setSelectedEnchantment] = useState<string | null>(null);
  const [selectedSoulGem, setSelectedSoulGem] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');

  // Get enchantable items from inventory
  const enchantableItems = useMemo(() => {
    return inventory.filter(item => 
      (item.type === 'weapon' || item.type === 'armor' || item.type === 'jewelry') &&
      (!item.enchantments || item.enchantments.length === 0)
    );
  }, [inventory]);

  // Get disenchantable items (items with enchantments)
  const disenchantableItems = useMemo(() => {
    return inventory.filter(item =>
      item.enchantments && item.enchantments.length > 0 &&
      // Check if any enchantment is not yet learned
      item.enchantments.some(e => 
        !enchantingState.learnedEnchantments.find(l => l.enchantmentId === e.id)
      )
    );
  }, [inventory, enchantingState.learnedEnchantments]);

  // Get learned enchantments
  const learnedEnchantments = useMemo(() => 
    getLearnedEnchantmentsWithDetails(enchantingState),
    [enchantingState]
  );

  // Get filled soul gems
  const filledSoulGems = useMemo(() => 
    getFilledSoulGems(enchantingState),
    [enchantingState]
  );

  // Get applicable enchantments for selected item
  const applicableEnchantments = useMemo(() => {
    if (!selectedItem) return [];
    const applicable = getEnchantmentsForItemType(selectedItem.type, selectedItem.slot);
    return applicable.filter(e => 
      learnedEnchantments.some(l => l.enchantment.id === e.id)
    );
  }, [selectedItem, learnedEnchantments]);

  // Calculate preview magnitude
  const previewMagnitude = useMemo(() => {
    if (!selectedEnchantment || !selectedSoulGem) return 0;
    const gem = filledSoulGems.find(g => g.id === selectedSoulGem);
    if (!gem) return 0;
    return calculateEnchantmentMagnitude(
      selectedEnchantment,
      enchantingState.enchantingLevel,
      gem.size,
      gem.soulLevel || 1
    );
  }, [selectedEnchantment, selectedSoulGem, filledSoulGems, enchantingState.enchantingLevel]);

  // Handle enchanting
  const handleEnchant = () => {
    if (!selectedItem || !selectedEnchantment || !selectedSoulGem) return;

    // Use the direct callback if provided
    if (onEnchantItem) {
      onEnchantItem(selectedItem.id, selectedEnchantment, selectedSoulGem, customName || undefined);
      // Reset selection
      setSelectedItem(null);
      setSelectedEnchantment(null);
      setSelectedSoulGem(null);
      setCustomName('');
      return;
    }

    // Fallback to original logic
    const result = enchantItem(
      enchantingState,
      selectedItem,
      selectedEnchantment,
      selectedSoulGem,
      customName || undefined
    );

    if (result.success && result.enchantedItem) {
      onUpdateEnchantingState?.(result.state);
      onRemoveFromInventory?.(selectedItem.id);
      onAddToInventory?.(result.enchantedItem);
      if (onGainXP) onGainXP(result.xpGained);
      
      // Reset selection
      setSelectedItem(null);
      setSelectedEnchantment(null);
      setSelectedSoulGem(null);
      setCustomName('');
    }
  };

  // Handle disenchanting
  const handleDisenchant = () => {
    if (!selectedItem || !selectedItem.enchantments?.length) return;

    // Use the direct callback if provided
    if (onDisenchantItem) {
      onDisenchantItem(selectedItem.id);
      setSelectedItem(null);
      return;
    }

    // Fallback to original logic
    const enchantmentId = selectedItem.enchantments[0].id;
    const result = disenchantItem(enchantingState, selectedItem, enchantmentId);

    if (result.success) {
      onUpdateEnchantingState?.(result.state);
      onRemoveFromInventory?.(selectedItem.id);
      if (onGainXP) onGainXP(result.xpGained);
      setSelectedItem(null);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-500/30 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20 bg-gradient-to-r from-slate-900 via-purple-900/20 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-purple-100">Arcane Enchanter</h2>
              <p className="text-sm text-purple-200/60">
                Enchanting Skill: {enchantingState.enchantingLevel}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Mode Toggle */}
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => { setMode('enchant'); setSelectedItem(null); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'enchant'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Enchant
              </button>
              <button
                onClick={() => { setMode('disenchant'); setSelectedItem(null); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'disenchant'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Disenchant
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {mode === 'enchant' ? (
            <>
              {/* Item Selection */}
              <div className="w-1/4 border-r border-purple-500/20 flex flex-col">
                <div className="p-3 bg-slate-800/50 border-b border-purple-500/10">
                  <h3 className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                    <Swords className="w-4 h-4" />
                    Select Item
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {enchantableItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setSelectedItem(item); setSelectedEnchantment(null); }}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                        selectedItem?.id === item.id
                          ? 'bg-purple-600/30 border border-purple-500/50'
                          : 'bg-slate-800/30 hover:bg-slate-700/30 border border-transparent'
                      }`}
                    >
                      <span className={`text-sm ${selectedItem?.id === item.id ? 'text-purple-100' : 'text-gray-300'}`}>
                        {item.name}
                      </span>
                    </button>
                  ))}
                  {enchantableItems.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No enchantable items
                    </p>
                  )}
                </div>
              </div>

              {/* Enchantment Selection */}
              <div className="w-1/4 border-r border-purple-500/20 flex flex-col">
                <div className="p-3 bg-slate-800/50 border-b border-purple-500/10">
                  <h3 className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Select Enchantment
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {selectedItem ? (
                    applicableEnchantments.length > 0 ? (
                      applicableEnchantments.map(ench => (
                        <button
                          key={ench.id}
                          onClick={() => setSelectedEnchantment(ench.id)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                            selectedEnchantment === ench.id
                              ? 'bg-purple-600/30 border border-purple-500/50'
                              : 'bg-slate-800/30 hover:bg-slate-700/30 border border-transparent'
                          }`}
                        >
                          {schoolIcons[ench.school]}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${selectedEnchantment === ench.id ? 'text-purple-100' : 'text-gray-300'}`}>
                              {ench.name}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No learned enchantments for this item type
                      </p>
                    )
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">
                      Select an item first
                    </p>
                  )}
                </div>
              </div>

              {/* Soul Gem Selection */}
              <div className="w-1/4 border-r border-purple-500/20 flex flex-col">
                <div className="p-3 bg-slate-800/50 border-b border-purple-500/10">
                  <h3 className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                    <Gem className="w-4 h-4" />
                    Select Soul Gem
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {filledSoulGems.map(gem => (
                    <button
                      key={gem.id}
                      onClick={() => setSelectedSoulGem(gem.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                        selectedSoulGem === gem.id
                          ? 'bg-purple-600/30 border border-purple-500/50'
                          : 'bg-slate-800/30 hover:bg-slate-700/30 border border-transparent'
                      }`}
                    >
                      <Gem className={`w-4 h-4 ${
                        gem.size === 'grand' || gem.size === 'black' ? 'text-purple-400' :
                        gem.size === 'greater' ? 'text-blue-400' :
                        gem.size === 'common' ? 'text-green-400' :
                        'text-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${selectedSoulGem === gem.id ? 'text-purple-100' : 'text-gray-300'}`}>
                          {gem.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Soul Level: {gem.soulLevel}
                        </p>
                      </div>
                    </button>
                  ))}
                  {filledSoulGems.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No filled soul gems
                    </p>
                  )}
                </div>
              </div>

              {/* Preview & Actions */}
              <div className="w-1/4 flex flex-col bg-slate-900/50">
                <div className="p-3 bg-slate-800/50 border-b border-purple-500/10">
                  <h3 className="text-sm font-semibold text-purple-200">Preview</h3>
                </div>
                <div className="flex-1 p-4">
                  {selectedItem && selectedEnchantment && selectedSoulGem ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                        <p className="text-purple-100 font-semibold">
                          {customName || `${selectedItem.name} of ${ENCHANTMENTS[selectedEnchantment]?.name.replace('Fortify ', '')}`}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {getEffectIcon(ENCHANTMENTS[selectedEnchantment]?.effect || '')}
                          <span className="text-sm text-purple-200">
                            {ENCHANTMENTS[selectedEnchantment]?.name}: {previewMagnitude}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Custom Name (Optional)</label>
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="Enter custom name..."
                          className="w-full px-3 py-2 bg-slate-800 border border-purple-500/30 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <button
                        onClick={handleEnchant}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Enchant Item
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">
                        Select an item, enchantment, and soul gem to begin
                      </p>
                    </div>
                  )}
                </div>

                {/* Learned Enchantments Count */}
                <div className="p-3 border-t border-purple-500/20 bg-slate-800/30">
                  <p className="text-xs text-gray-400">
                    Learned: {learnedEnchantments.length} / {Object.keys(ENCHANTMENTS).length} enchantments
                  </p>
                  <p className="text-xs text-gray-400">
                    Items Enchanted: {enchantingState.totalItemsEnchanted}
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Disenchant Mode */
            <div className="flex-1 flex">
              {/* Disenchantable Items */}
              <div className="w-1/2 border-r border-purple-500/20 flex flex-col">
                <div className="p-3 bg-slate-800/50 border-b border-purple-500/10">
                  <h3 className="text-sm font-semibold text-purple-200">
                    Items with Unknown Enchantments
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {disenchantableItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        selectedItem?.id === item.id
                          ? 'bg-purple-600/30 border border-purple-500/50'
                          : 'bg-slate-800/30 hover:bg-slate-700/30 border border-transparent'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <div className="flex-1">
                        <p className="text-gray-200">{item.name}</p>
                        <p className="text-xs text-purple-300">
                          {item.enchantments?.map(e => e.name).join(', ')}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  ))}
                  {disenchantableItems.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-8">
                      No items with unknown enchantments
                    </p>
                  )}
                </div>
              </div>

              {/* Disenchant Preview */}
              <div className="w-1/2 flex flex-col bg-slate-900/50">
                <div className="p-3 bg-slate-800/50 border-b border-purple-500/10">
                  <h3 className="text-sm font-semibold text-purple-200">Disenchant</h3>
                </div>
                <div className="flex-1 p-4">
                  {selectedItem && selectedItem.enchantments?.[0] ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30">
                        <p className="text-red-200 font-semibold mb-2">
                          ⚠️ Warning: This will destroy {selectedItem.name}
                        </p>
                        <p className="text-sm text-gray-300">
                          You will learn: <span className="text-purple-300">{selectedItem.enchantments[0].name}</span>
                        </p>
                      </div>

                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-sm text-gray-400 mb-2">Enchantment to Learn:</p>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-400" />
                          <div>
                            <p className="text-purple-100 font-semibold">
                              {selectedItem.enchantments[0].name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {ENCHANTMENTS[selectedItem.enchantments[0].id]?.description || 'Unknown effect'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleDisenchant}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Disenchant (Destroys Item)
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">
                        Select an enchanted item to learn its enchantment
                      </p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="p-3 border-t border-purple-500/20 bg-slate-800/30">
                  <p className="text-xs text-gray-400">
                    Items Disenchanted: {enchantingState.totalItemsDisenchanted}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
