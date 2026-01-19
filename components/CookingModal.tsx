import React, { useState, useMemo } from 'react';
import { 
  COOKING_RECIPES, 
  CookingRecipe, 
  canCookRecipe, 
  cookRecipe,
} from '../services/craftingService';
import { InventoryItem } from '../types';

interface CookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onCook: (recipe: CookingRecipe, result: InventoryItem) => void;
}

const CookingModal: React.FC<CookingModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onCook,
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<CookingRecipe | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'food' | 'drink'>('all');

  // Check availability of all recipes
  const recipeAvailability = useMemo(() => {
    return COOKING_RECIPES.map(recipe => ({
      recipe,
      ...canCookRecipe(recipe, inventory)
    }));
  }, [inventory]);

  // Filter and sort recipes
  const { availableRecipes, unavailableRecipes } = useMemo(() => {
    let recipes = recipeAvailability;
    
    if (filterType !== 'all') {
      recipes = recipes.filter(r => r.recipe.result.type === filterType);
    }
    
    const available = recipes.filter(r => r.canCook).map(r => r.recipe);
    const unavailable = recipes.filter(r => !r.canCook);
    
    return { 
      availableRecipes: available, 
      unavailableRecipes: unavailable
    };
  }, [recipeAvailability, filterType]);

  const handleCook = () => {
    if (!selectedRecipe) return;
    
    const result = cookRecipe(selectedRecipe);
    onCook(selectedRecipe, result);
    setSelectedRecipe(null);
  };

  const selectedRecipeInfo = useMemo(() => {
    if (!selectedRecipe) return null;
    return canCookRecipe(selectedRecipe, inventory);
  }, [selectedRecipe, inventory]);

  if (!isOpen) return null;

  const getStationIcon = (station?: string) => {
    switch (station) {
      case 'cooking_pot': return '🍲';
      case 'oven': return '🔥';
      default: return '🍳';
    }
  };

  const getEffectIcon = (stat: string) => {
    switch (stat) {
      case 'health': return '❤️';
      case 'stamina': return '⚡';
      case 'magicka': return '✨';
      case 'hunger': return '🍖';
      case 'thirst': return '💧';
      default: return '📊';
    }
  };

  return (
    <div 
      className="modal-overlay cooking-modal" 
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
          maxWidth: '800px',
          width: '95%',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #2d1f0d 0%, #3d2914 100%)',
          border: '2px solid #8B4513',
          borderRadius: '12px',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #8B4513',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#FFD700', fontSize: '1.5rem' }}>
              🍳 Cooking Station
            </h2>
            <p style={{ margin: '5px 0 0', color: '#D2B48C', fontSize: '0.9rem' }}>
              Prepare meals to restore health and gain buffs
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#D2B48C',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{
          padding: '10px 20px',
          borderBottom: '1px solid #5C4033',
          display: 'flex',
          gap: '10px',
        }}>
          {(['all', 'food', 'drink'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '8px 16px',
                background: filterType === type 
                  ? 'rgba(255, 215, 0, 0.2)' 
                  : 'rgba(0, 0, 0, 0.2)',
                border: `1px solid ${filterType === type ? '#FFD700' : '#5C4033'}`,
                borderRadius: '6px',
                color: filterType === type ? '#FFD700' : '#D2B48C',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {type === 'all' ? '🍽️ All' : type === 'food' ? '🍖 Food' : '🍺 Drinks'}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ 
          display: 'flex', 
          flex: 1, 
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* Recipe List */}
          <div style={{ 
            flex: 1, 
            borderRight: '1px solid #5C4033',
            overflowY: 'auto',
            padding: '15px',
          }}>
            {/* Available Recipes */}
            {availableRecipes.length > 0 && (
              <>
                <h4 style={{ 
                  margin: '0 0 10px', 
                  color: '#27AE60',
                  fontSize: '0.9rem',
                }}>
                  ✅ Available ({availableRecipes.length})
                </h4>
                {availableRecipes.map(recipe => (
                  <div
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      background: selectedRecipe?.id === recipe.id 
                        ? 'rgba(255, 215, 0, 0.15)' 
                        : 'rgba(0, 0, 0, 0.2)',
                      border: `1px solid ${selectedRecipe?.id === recipe.id ? '#FFD700' : '#5C4033'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '5px',
                    }}>
                      <span style={{ 
                        color: '#FFD700', 
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                      }}>
                        {getStationIcon(recipe.requiredStation)} {recipe.name}
                      </span>
                      <span style={{ 
                        color: '#D2B48C', 
                        fontSize: '0.8rem' 
                      }}>
                        💰 {recipe.result.value}g
                      </span>
                    </div>
                    <div style={{ 
                      color: '#9CA3AF', 
                      fontSize: '0.8rem' 
                    }}>
                      {recipe.description}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Unavailable Recipes */}
            {unavailableRecipes.length > 0 && (
              <>
                <h4 style={{ 
                  margin: '20px 0 10px', 
                  color: '#9CA3AF',
                  fontSize: '0.9rem',
                }}>
                  🔒 Missing Ingredients ({unavailableRecipes.length})
                </h4>
                {unavailableRecipes.map(({ recipe, missingIngredients }) => (
                  <div
                    key={recipe.id}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid #3d3d3d',
                      borderRadius: '8px',
                      opacity: 0.6,
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '5px',
                    }}>
                      <span style={{ 
                        color: '#9CA3AF', 
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                      }}>
                        {recipe.name}
                      </span>
                    </div>
                    <div style={{ 
                      color: '#EF4444', 
                      fontSize: '0.75rem',
                      marginTop: '5px',
                    }}>
                      Need: {missingIngredients.join(', ')}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Recipe Details */}
          <div style={{ 
            width: '320px',
            padding: '15px',
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.2)',
          }}>
            {selectedRecipe ? (
              <>
                <h3 style={{ 
                  margin: '0 0 15px', 
                  color: '#FFD700',
                  fontSize: '1.2rem',
                }}>
                  {getStationIcon(selectedRecipe.requiredStation)} {selectedRecipe.name}
                </h3>
                
                <p style={{ 
                  color: '#D2B48C', 
                  fontSize: '0.9rem',
                  marginBottom: '15px',
                }}>
                  {selectedRecipe.result.description}
                </p>

                {/* Ingredients */}
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ 
                    margin: '0 0 8px', 
                    color: '#D2B48C',
                    fontSize: '0.9rem',
                  }}>
                    📋 Ingredients
                  </h4>
                  {selectedRecipe.ingredients.map((ing, idx) => {
                    const hasIngredient = inventory.some(
                      i => i.name.toLowerCase() === ing.name.toLowerCase() && (i.quantity || 1) >= ing.quantity
                    );
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '6px 10px',
                          marginBottom: '4px',
                          background: hasIngredient 
                            ? 'rgba(39, 174, 96, 0.15)' 
                            : 'rgba(239, 68, 68, 0.15)',
                          borderRadius: '4px',
                          borderLeft: `3px solid ${hasIngredient ? '#27AE60' : '#EF4444'}`,
                          fontSize: '0.85rem',
                          color: '#fff',
                        }}
                      >
                        {hasIngredient ? '✓' : '✗'} {ing.quantity}x {ing.name}
                      </div>
                    );
                  })}
                </div>

                {/* Effects */}
                <div style={{ marginBottom: '15px' }}>
                  <h4 style={{ 
                    margin: '0 0 8px', 
                    color: '#D2B48C',
                    fontSize: '0.9rem',
                  }}>
                    ✨ Effects
                  </h4>
                  {selectedRecipe.result.effects.map((effect, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '6px 10px',
                        marginBottom: '4px',
                        background: 'rgba(255, 215, 0, 0.1)',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        color: '#82E0AA',
                      }}
                    >
                      {getEffectIcon(effect.stat)} {effect.stat}: +{effect.amount}
                      {effect.duration ? ` for ${effect.duration}s` : ''}
                    </div>
                  ))}
                </div>

                {/* Value & Station */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#9CA3AF',
                  fontSize: '0.85rem',
                  marginBottom: '20px',
                }}>
                  <span>💰 Value: {selectedRecipe.result.value}g</span>
                  {selectedRecipe.requiredStation && (
                    <span>📍 {selectedRecipe.requiredStation.replace('_', ' ')}</span>
                  )}
                </div>

                {/* Cook Button */}
                <button
                  onClick={handleCook}
                  disabled={!selectedRecipeInfo?.canCook}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: selectedRecipeInfo?.canCook
                      ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                      : '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    color: selectedRecipeInfo?.canCook ? '#000' : '#6B7280',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: selectedRecipeInfo?.canCook ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                  }}
                >
                  🍳 Cook {selectedRecipe.name}
                </button>
              </>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: '#6B7280',
                paddingTop: '50px',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🍲</div>
                <p>Select a recipe to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookingModal;
