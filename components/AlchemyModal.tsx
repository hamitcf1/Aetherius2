import React, { useState, useMemo } from 'react';
import { 
  ALCHEMY_EFFECTS, 
  INGREDIENTS, 
  Ingredient, 
  AlchemyEffect, 
  brewPotion, 
  findSharedEffects 
} from '../services/craftingService';
import { InventoryItem } from '../types';

// Get array of ingredients from the Record
const INGREDIENTS_ARRAY = Object.values(INGREDIENTS);

interface BrewResult {
  success: boolean;
  potion?: InventoryItem;
  error?: string;
}

interface AlchemyModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onBrewPotion: (potion: InventoryItem, ingredientsUsed: string[]) => void;
}

const AlchemyModal: React.FC<AlchemyModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onBrewPotion,
}) => {
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>([]);
  const [hoveredIngredient, setHoveredIngredient] = useState<Ingredient | null>(null);
  const [alchemyLevel, setAlchemyLevel] = useState(15);
  const [showAllIngredients, setShowAllIngredients] = useState(false);

  // Get available ingredients from inventory
  const availableIngredients = useMemo(() => {
    const ingredientNames = new Set<string>();
    inventory.forEach(item => {
      if (item.type === 'ingredient') {
        ingredientNames.add(item.name.toLowerCase());
      }
    });

    return INGREDIENTS_ARRAY.filter(ing => {
      const inInventory = ingredientNames.has(ing.name.toLowerCase()) || 
                          inventory.some(item => 
                            item.type === 'ingredient' && 
                            item.name.toLowerCase().includes(ing.name.toLowerCase())
                          );
      return showAllIngredients || inInventory;
    });
  }, [inventory, showAllIngredients]);

  // Calculate predicted effects when 2+ ingredients selected
  const predictedEffects = useMemo((): string[] => {
    if (selectedIngredientIds.length < 2) return [];
    
    const ingredients = selectedIngredientIds
      .map(id => INGREDIENTS[id])
      .filter(Boolean);
    
    if (ingredients.length < 2) return [];
    
    // Find all shared effects between pairs
    const sharedEffects: string[] = [];
    for (let i = 0; i < ingredients.length; i++) {
      for (let j = i + 1; j < ingredients.length; j++) {
        const shared = findSharedEffects(ingredients[i], ingredients[j]);
        shared.forEach(e => {
          if (!sharedEffects.includes(e)) sharedEffects.push(e);
        });
      }
    }
    
    return sharedEffects;
  }, [selectedIngredientIds]);

  // Preview the potion
  const potionPreview = useMemo((): BrewResult | null => {
    if (selectedIngredientIds.length < 2) return null;
    return brewPotion(selectedIngredientIds, alchemyLevel);
  }, [selectedIngredientIds, alchemyLevel]);

  const handleIngredientClick = (ingredient: Ingredient) => {
    if (selectedIngredientIds.includes(ingredient.id)) {
      setSelectedIngredientIds(prev => prev.filter(id => id !== ingredient.id));
    } else if (selectedIngredientIds.length < 3) {
      setSelectedIngredientIds(prev => [...prev, ingredient.id]);
    }
  };

  const handleBrew = () => {
    if (!potionPreview || !potionPreview.success || !potionPreview.potion) return;
    
    // Get ingredient names for the callback
    const ingredientNames = selectedIngredientIds
      .map(id => INGREDIENTS[id]?.name)
      .filter(Boolean);
    
    onBrewPotion(potionPreview.potion, ingredientNames);
    setSelectedIngredientIds([]);
  };

  if (!isOpen) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9CA3AF';
      case 'uncommon': return '#10B981';
      case 'rare': return '#3B82F6';
      case 'very_rare': return '#8B5CF6';
      default: return '#9CA3AF';
    }
  };

  const getEffectTypeIcon = (effectId: string) => {
    const effect = ALCHEMY_EFFECTS[effectId];
    if (!effect) return '🧪';
    
    if (effectId.startsWith('restore')) return '❤️';
    if (effectId.startsWith('fortify')) return '⬆️';
    if (effectId.startsWith('resist')) return '🛡️';
    if (effectId.startsWith('damage') || effectId.startsWith('weakness')) return '💀';
    if (effectId.startsWith('regenerate')) return '✨';
    return effect.type === 'positive' ? '✨' : effect.type === 'negative' ? '💀' : '🧪';
  };

  return (
    <div 
      className="modal-overlay alchemy-modal" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '900px',
          width: '95%',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '2px solid #4a5568',
          borderRadius: '12px',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #4a5568',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#82E0AA', fontSize: '1.5rem' }}>
              🧪 Alchemy Table
            </h2>
            <p style={{ margin: '5px 0 0', color: '#9CA3AF', fontSize: '0.9rem' }}>
              Select 2-3 ingredients to brew a potion
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9CA3AF',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Main Content */}
        <div style={{ 
          display: 'flex', 
          flex: 1, 
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* Ingredients Panel */}
          <div style={{ 
            flex: 1, 
            borderRight: '1px solid #4a5568',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 15px',
              borderBottom: '1px solid #374151',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ color: '#82E0AA', fontWeight: 'bold' }}>
                Ingredients ({availableIngredients.length})
              </span>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px',
                color: '#9CA3AF',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={showAllIngredients}
                  onChange={e => setShowAllIngredients(e.target.checked)}
                />
                Show All
              </label>
            </div>
            
            <div style={{ 
              flex: 1, 
              overflowY: 'auto',
              padding: '10px',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '8px',
              }}>
                {availableIngredients.map(ingredient => {
                  const isSelected = selectedIngredientIds.includes(ingredient.id);
                  const inInventory = inventory.some(
                    item => item.type === 'ingredient' && 
                    item.name.toLowerCase().includes(ingredient.name.toLowerCase())
                  );
                  
                  return (
                    <div
                      key={ingredient.id}
                      onClick={() => handleIngredientClick(ingredient)}
                      onMouseEnter={() => setHoveredIngredient(ingredient)}
                      onMouseLeave={() => setHoveredIngredient(null)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        background: isSelected 
                          ? 'rgba(130, 224, 170, 0.2)' 
                          : 'rgba(55, 65, 81, 0.5)',
                        border: `2px solid ${isSelected 
                          ? '#82E0AA' 
                          : getRarityColor(ingredient.rarity)}`,
                        cursor: 'pointer',
                        opacity: inInventory || showAllIngredients ? 1 : 0.5,
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        color: '#fff',
                        marginBottom: '4px',
                      }}>
                        {ingredient.name}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: getRarityColor(ingredient.rarity),
                        textTransform: 'capitalize',
                      }}>
                        {ingredient.rarity}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Preview & Brewing Panel */}
          <div style={{ 
            width: '350px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Selected Ingredients */}
            <div style={{
              padding: '15px',
              borderBottom: '1px solid #374151',
            }}>
              <h4 style={{ margin: '0 0 10px', color: '#82E0AA' }}>
                Selected ({selectedIngredientIds.length}/3)
              </h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[0, 1, 2].map(slot => {
                  const ingredientId = selectedIngredientIds[slot];
                  const ingredientData = ingredientId ? INGREDIENTS[ingredientId] : null;
                  
                  return (
                    <div
                      key={slot}
                      style={{
                        width: '90px',
                        height: '70px',
                        borderRadius: '8px',
                        border: '2px dashed #4a5568',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: ingredientData 
                          ? 'rgba(130, 224, 170, 0.1)' 
                          : 'transparent',
                        color: '#9CA3AF',
                        fontSize: '0.75rem',
                        textAlign: 'center',
                        padding: '5px',
                      }}
                    >
                      {ingredientData ? ingredientData.name : `Slot ${slot + 1}`}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ingredient Info */}
            {hoveredIngredient && (
              <div style={{
                padding: '15px',
                borderBottom: '1px solid #374151',
                background: 'rgba(0, 0, 0, 0.2)',
              }}>
                <h4 style={{ margin: '0 0 10px', color: '#FFD700' }}>
                  {hoveredIngredient.name}
                </h4>
                {hoveredIngredient.locations && (
                  <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '5px' }}>
                    Found: {hoveredIngredient.locations.join(', ')}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {hoveredIngredient.effects.map((effectId, idx) => {
                    const effect = ALCHEMY_EFFECTS[effectId];
                    return (
                      <span
                        key={idx}
                        style={{
                          padding: '3px 8px',
                          background: 'rgba(130, 224, 170, 0.15)',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          color: '#82E0AA',
                        }}
                      >
                        {effect ? `${getEffectTypeIcon(effectId)} ${effect.name}` : effectId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Potion Preview */}
            <div style={{ 
              flex: 1, 
              padding: '15px',
              overflowY: 'auto',
            }}>
              {potionPreview ? (
                <>
                  <h4 style={{ 
                    margin: '0 0 10px', 
                    color: potionPreview.success ? '#82E0AA' : '#EF4444' 
                  }}>
                    {potionPreview.success ? '✨ ' : '💨 '}
                    {potionPreview.potion?.name || potionPreview.error || 'Failed Experiment'}
                  </h4>
                  
                  {potionPreview.success && potionPreview.potion ? (
                    <>
                      <div style={{ marginBottom: '10px' }}>
                        <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '10px' }}>
                          {potionPreview.potion.description}
                        </p>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: '#9CA3AF',
                        fontSize: '0.85rem',
                        marginBottom: '15px',
                      }}>
                        <span>💰 Value: {potionPreview.potion.value}g</span>
                        <span style={{ color: getRarityColor(potionPreview.potion.rarity || 'common'), textTransform: 'capitalize' }}>
                          ⚗️ {potionPreview.potion.rarity}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>
                      {potionPreview.error || 'These ingredients share no effects.'}
                    </p>
                  )}
                </>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#6B7280',
                  paddingTop: '30px',
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚗️</div>
                  <p>Select at least 2 ingredients to preview the potion.</p>
                </div>
              )}
            </div>

            {/* Brew Button */}
            <div style={{ padding: '15px', borderTop: '1px solid #374151' }}>
              <button
                onClick={handleBrew}
                disabled={!potionPreview?.success}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: potionPreview?.success 
                    ? 'linear-gradient(135deg, #82E0AA 0%, #27AE60 100%)'
                    : '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  color: potionPreview?.success ? '#000' : '#6B7280',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: potionPreview?.success ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
              >
                🧪 Brew Potion
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlchemyModal;
