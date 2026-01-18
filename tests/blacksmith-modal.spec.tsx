import React from 'react';
import { render, screen, fireEvent, cleanup, act, within } from '@testing-library/react';
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

  it('when upgrading one item from a stack the new upgraded item is created and selected', () => {
    const { Component, getCurrentItems, setItems } = setupTest([
      { id: 'stack1', characterId: 'c1', name: 'Stacked Sword', type: 'weapon', damage: 8, value: 80, quantity: 2 }
    ], [], 500);

    const { rerender } = render(Component);
    // Select the stacked item
    const listBtn = screen.getAllByText(/Stacked Sword/i).find(el => el.closest('button'))!;
    fireEvent.click(listBtn);

    const confirm = screen.getByText(/Confirm Upgrade/i).closest('button')!;
    fireEvent.click(confirm);

    // Ensure a new item with quantity 1 and upgradeLevel > 0 was added locally
    const items = getCurrentItems();
    const upgraded = items.find(i => i.name === 'Stacked Sword' && (i.upgradeLevel || 0) > 0);
    expect(upgraded).toBeTruthy();
    expect(upgraded!.quantity).toBe(1);

    // The original stack must have been decremented
    const original = items.find(i => i.id === 'stack1');
    expect(original).toBeTruthy();
    expect(original!.quantity).toBe(1);

    // Rerender so the modal reflects the updated items prop and selection
    rerender(
      <AppContext.Provider value={createMockContext({ gold: 500 }) as any}>
        <BlacksmithModal
          open={true}
          onClose={() => {}}
          items={getCurrentItems() as any}
          setItems={setItems as any}
          gold={500}
          setGold={() => {}}
        />
      </AppContext.Provider>
    );

    // UI should show the newly-created upgraded item as selected in the modal
    const selected = screen.getAllByText(/Stacked Sword/i).find(b => b.closest('button')?.getAttribute('aria-pressed') === 'true');
    expect(selected).toBeTruthy();
  });

  it('disables upgrade when required materials are missing from inventory (rare)', () => {
    // Rare sword requires materials (e.g. mithril ingot by default mechanism)
    const { Component } = setupTest([
      { id: 'iron_sword', characterId: 'c1', name: 'Iron Sword', type: 'weapon', damage: 7, value: 45, quantity: 1, rarity: 'rare' }
    ]);
    render(Component);

    // Click the list button (robust against multiple matches)
    const ironBtns = screen.getAllByText(/Iron Sword/i);
    const ironListBtn = ironBtns.find(el => el.closest('button')) || ironBtns[0];
    fireEvent.click(ironListBtn);

    // Ensure the right-pane selected heading updated (if this fails selection didn't occur)
    expect(screen.getByRole('heading', { name: /Iron Sword/i })).toBeTruthy();

    // The UI should show the requirements block and indicate missing materials
    expect(screen.getAllByText(/Required Materials|Material requirements/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Missing required materials/i).length).toBeGreaterThan(0);

    // Find the requirements container and assert the material row shows a quantity fraction like `0 / N`
    const reqHeading = screen.getAllByText(/Required Materials|Material requirements/i)[0];
    let reqContainer = reqHeading.nextElementSibling as HTMLElement | null;
    if (!reqContainer) reqContainer = document.querySelector('.max-h-44, .overflow-y-auto') as HTMLElement | null;
    expect(reqContainer).toBeTruthy();
    // The requirements container should include a quantity fraction like `0 / N`
    expect(within(reqContainer!).getByText(/\d+\s*\/\s*\d+/)).toBeTruthy();

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

    const ironBtns = screen.getAllByText(/Iron Sword/i);
    const ironListBtn = ironBtns.find(el => el.closest('button')) || ironBtns[0];
    fireEvent.click(ironListBtn);

    // Ensure the right-pane selected heading updated (if this fails selection didn't occur)
    expect(screen.getByRole('heading', { name: /Iron Shield|Daedric Sword|Daedric Sword/i })).toBeTruthy();

    // Requirements block present
    const reqHeading = screen.getAllByText(/Required Materials|Material requirements/i)[0];
    let reqContainer = reqHeading.nextElementSibling as HTMLElement | null;
    if (!reqContainer) reqContainer = document.querySelector('.max-h-44, .overflow-y-auto') as HTMLElement | null;
    expect(reqContainer).toBeTruthy();

    // The material row should show an owned count like `5 / N`
    const matRow = within(reqContainer!).getByText(/Steel Ingot/i).closest('div') as HTMLElement | null;
    expect(matRow).toBeTruthy();
    expect(within(matRow!).getByText(/\d+\s*\/\s*\d+/)).toBeTruthy();

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
    
    // Check materials missing (scoped to requirements grid)
    const reqHeading = screen.getAllByText(/Required Materials|Material requirements/i)[0];
    let reqContainer = reqHeading.nextElementSibling as HTMLElement | null;
    if (!reqContainer) reqContainer = document.querySelector('.max-h-44, .overflow-y-auto') as HTMLElement | null;
    expect(reqContainer).toBeTruthy();
    expect(within(reqContainer!).getByText(/Steel Ingot/i)).toBeTruthy();
    expect(within(reqContainer!).getByText(/\d+\s*\/\s*\d+/)).toBeTruthy();
    const confirmBtn = screen.getByText(/Confirm Upgrade/i).closest('button')!;
    expect(confirmBtn).toBeDisabled();

    // Now update inventory to have Steel Ingot
    // We simulate parent state update (since setItems is mock)
    // Re-render the modal with the new items prop so the UI updates
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

    // Re-select the Daedric Sword and assert confirm is enabled now that materials are present
    const daedricAfter = screen.getAllByText(/Daedric Sword/i).find(el => el.closest('button')) || screen.getAllByText(/Daedric Sword/i)[0];
    fireEvent.click(daedricAfter);

    const confirmBtn2 = screen.getByText(/Confirm Upgrade/i).closest('button')!;
    expect(confirmBtn2).not.toBeDisabled();
  });
});
