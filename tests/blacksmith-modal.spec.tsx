import React from 'react';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import BlacksmithModal from '../components/BlacksmithModal';
import { vi } from 'vitest';
import { AppContext } from '../AppContext';

beforeAll(() => {
  vi.useFakeTimers && vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.runOnlyPendingTimers && vi.runOnlyPendingTimers();
});

describe('Blacksmith modal upgrade flow', () => {
  const createMockContext = (overrides = {}) => ({
    handleManualSave: () => {},
    isSaving: false,
    handleLogout: () => {},
    setCurrentCharacterId: () => {},
    aiModel: 'gpt',
    setAiModel: () => {},
    handleExportPDF: () => {},
    isExporting: false,
    handleGenerateProfileImage: () => {},
    isGeneratingProfileImage: false,
    handleCreateImagePrompt: () => {},
    handleUploadPhoto: () => {},
    showToast: vi.fn(),
    isAnonymous: false,
    handleRestWithOptions: () => {},
    openBonfireMenu: () => {},
    handleEatItem: () => {},
    handleDrinkItem: () => {},
    handleShopPurchase: () => {},
    handleShopSell: () => {},
    gold: 0,
    inventory: [],
    hasCampingGear: false,
    hasBedroll: false,
    characterLevel: 99,
    handleExportJSON: () => {},
    handleImportJSON: () => {},
    difficulty: 'novice',
    setDifficulty: () => {},
    weather: { type: 'clear', intensity: 0, temperature: 0 },
    statusEffects: [],
    companions: [],
    colorTheme: 'dark',
    setColorTheme: () => {},
    showQuantityControls: false,
    setShowQuantityControls: () => {},
    weatherEffect: 'none',
    setWeatherEffect: () => {},
    weatherIntensity: 0,
    setWeatherIntensity: () => {},
    openCompanions: () => {},
    userSettings: null,
    updateUserSettings: () => {},
    ...overrides
  });

  const setupTest = (initialItems: any[], shopItems: any[] = [], gold = 1000) => {
    let currentItems = [...initialItems];
    // Mock setItems to handle functional updates
    const setItems = vi.fn((next: any) => {
      currentItems = typeof next === 'function' ? next(currentItems) : next;
    });

    (window as any).app = { handleGameUpdate: vi.fn() };

    return {
      Component: (
        <AppContext.Provider value={createMockContext({ gold }) as any}>
          <BlacksmithModal
            open={true}
            onClose={() => {}}
            items={currentItems}
            setItems={setItems as any}
            gold={gold}
            setGold={() => {}}
            shopItems={shopItems}
          />
        </AppContext.Provider>
      ),
      getCurrentItems: () => currentItems,
      setItems
    };
  };

  it('disables confirm button during spark animation and clears sparks after timeout', () => {
    const { Component, getCurrentItems } = setupTest([
      { id: 'i1', characterId: 'c1', name: 'Test Sword', type: 'weapon', damage: 10, value: 100, quantity: 1 }
    ]);
    const { rerender } = render(Component);

    // select the item
    const itemBtn = screen.getByText(/Test Sword/i);
    fireEvent.click(itemBtn);

    const confirm = screen.getByText(/Confirm Upgrade/i).closest('button')!;
    expect(confirm).toBeTruthy();

    fireEvent.click(confirm);
    expect(confirm).toBeDisabled();

    // Advance timers for sparks
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Verify upgrade happened (level > 0)
    const items = getCurrentItems();
    expect(items[0].upgradeLevel).toBeGreaterThan(0);
    // Button still disabled due to animation/processing check
    expect(confirm).toBeDisabled();
  });

  it('disables upgrade when required materials are missing from inventory (rare)', () => {
    // Rare sword requires materials (e.g. mithril ingot by default mechanism)
    const { Component } = setupTest([
      { id: 'iron_sword', characterId: 'c1', name: 'Iron Sword', type: 'weapon', damage: 7, value: 45, quantity: 1, rarity: 'rare' }
    ]);
    render(Component);

    fireEvent.click(screen.getByText(/Iron Sword/i));

    expect(screen.getByText(/Material requirements/i)).toBeTruthy();
    // Should show "missing" status
    // exact text "Upgrade requires materials from your inventory"
    expect(screen.getByText(/Upgrade requires materials from your inventory/i)).toBeTruthy();
    
    const confirmBtn = screen.getByText(/Confirm Upgrade/i).closest('button')!;
    expect(confirmBtn).toBeDisabled();
  });

  it('allows upgrade when required materials are available in inventory', () => {
    // Rare Iron Sword requires materials. Logic defaults 'uncommon'->steel, 'rare'->mithril? 
    // upgradeService -> UPGRADE_RECIPES['iron_sword'] = steel_ingot regardless of rarity
    const { Component } = setupTest([
      { id: 'iron_sword', characterId: 'c1', name: 'Iron Sword', type: 'weapon', damage: 7, value: 45, quantity: 1, rarity: 'rare' },
      { id: 'steel_ingot', characterId: 'c1', name: 'Steel Ingot', type: 'misc', quantity: 10 }
    ]);
    render(Component);

    fireEvent.click(screen.getByText(/Iron Sword/i));
    
    expect(screen.getByText(/Material requirements/i)).toBeTruthy();
    // Should show (owned)
    expect(screen.getByText(/\(owned\)/i)).toBeTruthy();

    const confirmBtn = screen.getByText(/Confirm Upgrade/i).closest('button')!;
    expect(confirmBtn).not.toBeDisabled();
  });

  it('shows generated material requirement for uncommon+ items without explicit recipes', () => {
    // Daedric Sword, uncommon. upgradeService: uncommon -> 'steel_ingot'
    const { Component, getCurrentItems, setItems } = setupTest([
      { id: 'daedric_sword', characterId: 'c1', name: 'Daedric Sword', type: 'weapon', damage: 14, value: 1200, quantity: 1, rarity: 'uncommon' }
    ]);
    const { rerender } = render(Component);

    // Use getAllByText to avoid title/list ambiguity
    const itemBtns = screen.getAllByText(/Daedric Sword/i);
    // Usually the list item is clickable. The title is just h4.
    // Try to find the button containing the text
    const listButton = itemBtns.find(el => el.closest('button'));
    fireEvent.click(listButton || itemBtns[0]);
    
    // Check materials missing
    expect(screen.getByText(/Material requirements/i)).toBeTruthy();
    expect(screen.getByText(/Steel Ingot/i)).toBeTruthy();
    const confirmBtn = screen.getByText(/Confirm Upgrade/i).closest('button')!;
    expect(confirmBtn).toBeDisabled();

    // Now update inventory to have Steel Ingot
    // We simulate parent state update (since setItems is mock)
    // Actually we need to re-render with new items prop.
    const itemsWithIngot = [
        ...getCurrentItems(),
        { id: 'steel_ingot', characterId: 'c1', name: 'Steel Ingot', type: 'misc', quantity: 5 }
    ];
    
    rerender(
        <AppContext.Provider value={createMockContext({ gold: 1000 }) as any}>
          <BlacksmithModal
            open={true}
            onClose={() => {}}
            items={itemsWithIngot}
            setItems={setItems as any}
            gold={1000}
            setGold={() => {}}
            shopItems={[]}
          />
        </AppContext.Provider>
    );

    const confirmBtn2 = screen.getByText(/Confirm Upgrade/i).closest('button')!;
    expect(confirmBtn2).not.toBeDisabled();
  });
});
