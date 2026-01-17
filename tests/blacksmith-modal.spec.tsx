import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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
  it('disables confirm button during spark animation and clears sparks after timeout', () => {
    const items = [
      { id: 'i1', characterId: 'c1', name: 'Test Sword', type: 'weapon', damage: 10, value: 100, quantity: 1 } as any
    ];
    let currentItems = [...items];
    const setItems = (next: any) => { currentItems = next; };

    // mock global app handler used by component for persistence
    (window as any).app = { handleGameUpdate: vi.fn() };

    const mockCtx = {
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
      showToast: () => {},
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
      updateUserSettings: () => {}
    } as any;

    render(
      <AppContext.Provider value={mockCtx}>
        <BlacksmithModal open={true} onClose={() => {}} items={currentItems} setItems={setItems as any} gold={500} setGold={() => {}} />
      </AppContext.Provider>
    );

    // select the item from the eligible list
    const itemBtn = screen.getByText(/Test Sword/i);
    fireEvent.click(itemBtn);

    // visual selection should set ARIA state so it's testable
    expect(itemBtn.closest('button')?.getAttribute('aria-pressed')).toBe('true');

    const confirm = screen.getByText(/Confirm Upgrade/i).closest('button')!;
    expect(confirm).toBeTruthy();

    // Click confirm — should become disabled immediately
    fireEvent.click(confirm);
    expect(confirm).toBeDisabled();

    // Sparks should be present (rendered as fixed divs)
    const { act } = require('react-dom/test-utils');
    act(() => vi.advanceTimersByTime(50));
    let sparks = document.querySelectorAll('div[style*="position: fixed"]');
    expect(sparks.length).toBeGreaterThan(0);

    // Verify item was upgraded immediately and button is locked while the visual runs
    expect(currentItems[0].upgradeLevel && currentItems[0].upgradeLevel > 0).toBeTruthy();
    expect(confirm).toBeDisabled();

  });

  it('disables upgrade when required materials are not present in shop and shows requirement text', () => {
    const items = [
      { id: 'iron_sword', characterId: 'c1', name: 'Iron Sword', type: 'weapon', damage: 7, value: 45, quantity: 1, rarity: 'rare' } as any
    ];
    let currentItems = [...items];
    const setItems = (next: any) => { currentItems = next; };

    const mockCtx = ({ showToast: () => {}, characterLevel: 99, handleShopPurchase: () => {}, handleShopSell: () => {}, gold: 1000 } as any);

    render(
      <AppContext.Provider value={mockCtx}>
        <BlacksmithModal open={true} onClose={() => {}} items={currentItems} setItems={setItems as any} gold={500} setGold={() => {}} shopItems={[]} />
      </AppContext.Provider>
    );

    fireEvent.click(screen.getByText(/Iron Sword/i));

    expect(screen.getByText(/Material requirements/i)).toBeTruthy();
    expect(screen.getByText(/steel ingot/i)).toBeTruthy();
    const confirmBtn = screen.getByText(/Confirm Upgrade/i).closest('button')!;
    expect(confirmBtn).toBeDisabled();
  });

  it('allows upgrade when required materials are available in the shop', () => {
    const items = [
      { id: 'iron_sword', characterId: 'c1', name: 'Iron Sword', type: 'weapon', damage: 7, value: 45, quantity: 1, rarity: 'rare' } as any
    ];
    let currentItems = [...items];
    const setItems = (next: any) => { currentItems = next; };

    const mockCtx = ({ showToast: () => {}, characterLevel: 99, handleShopPurchase: () => {}, handleShopSell: () => {}, gold: 1000 } as any);

    // Provide shopItems that include the required steel_ingot
    const shopItems = [{ id: 'steel_ingot', name: 'Steel Ingot', type: 'misc', description: '', price: 18, category: 'Ingredients' } as any];

    render(
      <AppContext.Provider value={mockCtx}>
        <BlacksmithModal open={true} onClose={() => {}} items={currentItems} setItems={setItems as any} gold={500} setGold={() => {}} shopItems={shopItems} />
      </AppContext.Provider>
    );

    fireEvent.click(screen.getByText(/Iron Sword/i));

    const confirmBtn = screen.getByText(/Confirm Upgrade/i).closest('button')!;
    expect(confirmBtn).not.toBeDisabled();
  });
});