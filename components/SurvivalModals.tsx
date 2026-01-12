import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { X, Moon, Apple, Droplets, Tent, Home, TreePine, Clock, Coins, FlaskConical } from 'lucide-react';
import { InventoryItem } from '../types';
import { getFoodNutrition, getDrinkNutrition, getFoodNutritionDisplay, getDrinkNutritionDisplay } from '../services/nutritionData';

// Hook for modal keyboard and click-outside handling
function useModalClose(open: boolean, onClose: () => void) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
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
}

// === REST MODAL ===
export interface RestOptions {
  type: 'outside' | 'camp' | 'inn';
  hours: number;
  innCost?: number;
}

interface RestModalProps {
  open: boolean;
  onClose: () => void;
  onRest: (options: RestOptions) => void;
  gold: number;
  hasCampingGear: boolean;
  hasBedroll: boolean;
}

const INN_COST = 10;

export function RestModal({ open, onClose, onRest, gold, hasCampingGear, hasBedroll }: RestModalProps) {
  const [restType, setRestType] = useState<'outside' | 'camp' | 'inn'>('outside');
  const [hours, setHours] = useState(8);

  useModalClose(open, onClose);

  const restQuality = useMemo(() => {
    if (restType === 'inn') return { label: 'Well Rested', fatigueReduction: 50, desc: 'A warm bed at the inn. Full rest.' };
    if (restType === 'camp') {
      if (hasCampingGear) return { label: 'Rested', fatigueReduction: 40, desc: 'Your tent provides good shelter.' };
      if (hasBedroll) return { label: 'Somewhat Rested', fatigueReduction: 30, desc: 'Bedroll offers basic comfort.' };
    }
    return { label: 'Poorly Rested', fatigueReduction: 15, desc: 'Sleeping on the ground. Uncomfortable.' };
  }, [restType, hasCampingGear, hasBedroll]);

  const canAffordInn = gold >= INN_COST;

  const handleRest = () => {
    onRest({
      type: restType,
      hours,
      innCost: restType === 'inn' ? INN_COST : undefined
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] bg-skyrim-dark/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-skyrim-paper border border-skyrim-gold rounded-lg shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-skyrim-border flex items-center justify-between bg-skyrim-dark/50">
          <div className="flex items-center gap-3">
            <Moon className="text-skyrim-gold" size={20} />
            <h2 className="text-lg font-serif text-skyrim-gold">Rest</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-skyrim-paper/40 rounded">
            <X size={18} className="text-skyrim-text hover:text-white" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Rest Type Selection */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-skyrim-text font-bold">Where to rest</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setRestType('outside')}
                className={`p-3 rounded border flex flex-col items-center gap-2 transition-colors ${
                  restType === 'outside'
                    ? 'bg-skyrim-gold/20 border-skyrim-gold text-skyrim-gold'
                    : 'bg-skyrim-paper/30 border-skyrim-border text-skyrim-text hover:border-skyrim-border'
                }`}
              >
                <TreePine size={20} />
                <span className="text-xs">Outside</span>
              </button>
              <button
                onClick={() => setRestType('camp')}
                className={`p-3 rounded border flex flex-col items-center gap-2 transition-colors ${
                  restType === 'camp'
                    ? 'bg-skyrim-gold/20 border-skyrim-gold text-skyrim-gold'
                    : 'bg-skyrim-paper/30 border-skyrim-border text-skyrim-text hover:border-skyrim-border'
                }`}
              >
                <Tent size={20} />
                <span className="text-xs">Camp</span>
                {!hasBedroll && !hasCampingGear && (
                  <span className="text-[10px] text-red-400">No gear</span>
                )}
              </button>
              <button
                onClick={() => setRestType('inn')}
                disabled={!canAffordInn}
                className={`p-3 rounded border flex flex-col items-center gap-2 transition-colors ${
                  restType === 'inn'
                    ? 'bg-skyrim-gold/20 border-skyrim-gold text-skyrim-gold'
                    : canAffordInn
                    ? 'bg-skyrim-paper/30 border-skyrim-border text-skyrim-text hover:border-skyrim-border'
                    : 'bg-skyrim-paper/20 border-red-900/30 text-skyrim-text cursor-not-allowed'
                }`}
              >
                <Home size={20} />
                <span className="text-xs">Inn</span>
                <span className="text-[10px] flex items-center gap-1">
                  <Coins size={10} />{INN_COST}g
                </span>
              </button>
            </div>
          </div>

          {/* Rest Quality Info */}
          <div className="p-3 bg-skyrim-paper/30 border border-skyrim-border rounded">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-skyrim-text">{restQuality.label}</span>
              <span className="text-xs text-green-400">-{restQuality.fatigueReduction} fatigue</span>
            </div>
            <p className="text-xs text-skyrim-text">{restQuality.desc}</p>
          </div>

          {/* Hours Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-skyrim-text font-bold">Duration</label>
              <span className="text-sm text-skyrim-text flex items-center gap-1">
                <Clock size={14} /> {hours} hours
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value))}
              className="w-full h-2 bg-skyrim-paper/40 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1h</span>
              <span>6h</span>
              <span>12h</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleRest}
            className="w-full py-3 bg-skyrim-gold text-skyrim-dark rounded font-bold hover:bg-yellow-400 transition-colors"
          >
            Rest for {hours} hours
          </button>
        </div>
      </div>
    </div>
  );
}

// === EAT MODAL ===
interface EatModalProps {
  open: boolean;
  onClose: () => void;
  onEat: (item: InventoryItem) => void;
  foodItems: InventoryItem[];
}

const FOOD_KEYWORDS = ['bread', 'apple', 'cheese', 'meat', 'stew', 'soup', 'potato', 'carrot', 'salmon', 'leek', 'cabbage', 'sweetroll', 'pie', 'ration', 'food', 'meal', 'venison', 'rabbit', 'horker', 'mammoth', 'beef', 'haunch'];
const INGREDIENT_KEYWORDS = ['flower', 'root', 'mushroom', 'herb', 'salt', 'garlic', 'lavender', 'nightshade', 'deathbell', 'nirnroot', 'wheat', 'berry', 'cap', 'wing', 'eye', 'heart', 'claw', 'fang', 'dust', 'pearl', 'tooth', 'scale'];

export function EatModal({ open, onClose, onEat, foodItems }: EatModalProps) {
  const [activeCategory, setActiveCategory] = useState<'food' | 'ingredient'>('food');
  useModalClose(open, onClose);

  const { foodOnly, ingredientsOnly } = useMemo(() => {
    const food: InventoryItem[] = [];
    const ingredients: InventoryItem[] = [];
    
    foodItems.forEach(item => {
      if ((item.quantity || 0) <= 0) return;
      const name = (item.name || '').toLowerCase();
      
      // Check if it's an ingredient by type or keywords
      if (item.type === 'ingredient' || INGREDIENT_KEYWORDS.some(k => name.includes(k))) {
        ingredients.push(item);
      } else if (item.type === 'food' || FOOD_KEYWORDS.some(k => name.includes(k))) {
        food.push(item);
      }
    });
    
    return { foodOnly: food, ingredientsOnly: ingredients };
  }, [foodItems]);

  const displayItems = activeCategory === 'food' ? foodOnly : ingredientsOnly;

  const handleEat = (item: InventoryItem) => {
    onEat(item);
    onClose();
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] bg-skyrim-dark/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-skyrim-paper border border-skyrim-gold rounded-lg shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-skyrim-border flex items-center justify-between bg-skyrim-dark/50">
          <div className="flex items-center gap-3">
            <Apple className="text-skyrim-gold" size={20} />
            <h2 className="text-lg font-serif text-skyrim-gold">Eat</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-skyrim-paper/40 rounded">
            <X size={18} className="text-skyrim-text hover:text-white" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-skyrim-border bg-skyrim-paper/20">
          <button
            onClick={() => setActiveCategory('food')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              activeCategory === 'food'
                ? 'bg-green-900/30 text-green-400 border-b-2 border-green-500'
                : 'text-skyrim-text hover:text-skyrim-gold hover:bg-skyrim-paper/20'
            }`}
          >
            <Apple size={16} />
            Food ({foodOnly.length})
          </button>
          <button
            onClick={() => setActiveCategory('ingredient')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              activeCategory === 'ingredient'
                ? 'bg-purple-900/30 text-purple-400 border-b-2 border-purple-500'
                : 'text-skyrim-text hover:text-skyrim-gold hover:bg-skyrim-paper/20'
            }`}
          >
            <Droplets size={16} />
            Ingredients ({ingredientsOnly.length})
          </button>
        </div>

        <div className="p-4">
          {displayItems.length === 0 ? (
            <div className="text-center py-8">
              <Apple size={32} className="mx-auto text-gray-600 mb-3" />
              <p className="text-skyrim-text">No {activeCategory === 'food' ? 'food' : 'ingredients'} in your inventory.</p>
              <p className="text-xs text-skyrim-text mt-1">Visit the shop to buy supplies.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {displayItems.map(item => {
                const nutritionDisplay = getFoodNutritionDisplay(item.name);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleEat(item)}
                    className="w-full p-3 bg-skyrim-paper/30 border border-skyrim-border rounded hover:border-skyrim-gold/50 transition-colors text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="text-gray-200 font-semibold text-sm">{item.name}</div>
                      <div className="text-gray-500 text-xs">x{item.quantity}</div>
                    </div>
                    <span className={`text-xs ${activeCategory === 'food' ? 'text-green-400' : 'text-purple-400'}`}>{nutritionDisplay}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// === DRINK MODAL ===
interface DrinkModalProps {
  open: boolean;
  onClose: () => void;
  onDrink: (item: InventoryItem) => void;
  drinkItems: InventoryItem[];
}

const DRINK_KEYWORDS = ['water', 'ale', 'mead', 'wine', 'milk', 'drink', 'juice', 'tea', 'skooma', 'skin'];

export function DrinkModal({ open, onClose, onDrink, drinkItems }: DrinkModalProps) {
  useModalClose(open, onClose);

  const availableDrinks = useMemo(() => {
    return drinkItems.filter(item => {
      if ((item.quantity || 0) <= 0) return false;
      const name = (item.name || '').toLowerCase();
      // Exclude health/magicka/stamina potions
      if (name.includes('potion') && (name.includes('health') || name.includes('magicka') || name.includes('stamina'))) {
        return false;
      }
      return DRINK_KEYWORDS.some(k => name.includes(k));
    });
  }, [drinkItems]);

  const handleDrink = (item: InventoryItem) => {
    onDrink(item);
    onClose();
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] bg-skyrim-dark/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-skyrim-paper border border-skyrim-gold rounded-lg shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-skyrim-border flex items-center justify-between bg-skyrim-dark/50">
          <div className="flex items-center gap-3">
            <Droplets className="text-skyrim-gold" size={20} />
            <h2 className="text-lg font-serif text-skyrim-gold">Drink</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-skyrim-paper/40 rounded">
            <X size={18} className="text-skyrim-text hover:text-white" />
          </button>
        </div>

        <div className="p-4">
          {availableDrinks.length === 0 ? (
            <div className="text-center py-8">
              <Droplets size={32} className="mx-auto text-gray-600 mb-3" />
              <p className="text-skyrim-text">No drinks in your inventory.</p>
              <p className="text-xs text-gray-500 mt-1">Visit the shop to buy supplies.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableDrinks.map(item => {
                const nutritionDisplay = getDrinkNutritionDisplay(item.name);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleDrink(item)}
                    className="w-full p-3 bg-skyrim-paper/30 border border-skyrim-border rounded hover:border-skyrim-gold/50 transition-colors text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="text-skyrim-text font-semibold text-sm">{item.name}</div>
                      <div className="text-skyrim-text text-xs">x{item.quantity}</div>
                    </div>
                    <span className="text-blue-400 text-xs">{nutritionDisplay}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
