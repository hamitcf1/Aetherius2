import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SHOP_INVENTORY } from '../components/ShopModal';
import { ShopModal } from '../components/ShopModal';
import { AppContext } from '../AppContext';

describe('Shop inventory sanity', () => {
  it('has unique ids and correct required levels for epic/legendary items', () => {
    const ids = new Set<string>();
    for (const it of SHOP_INVENTORY) {
      // Unique ids
      expect(ids.has(it.id)).toBeFalsy();
      ids.add(it.id);

      // If rarity is legendary -> requiredLevel should be >= 100
      if ((it as any).rarity === 'legendary') {
        expect(it.requiredLevel).toBeGreaterThanOrEqual(100);
      }

      // If rarity is epic -> requiredLevel should be >= 50
      if ((it as any).rarity === 'epic') {
        expect(it.requiredLevel).toBeGreaterThanOrEqual(50);
      }

      // Category should be present for shop items
      expect(typeof it.category).toBe('string');
      expect(it.category.length).toBeGreaterThan(0);
    }
  });

  it('category filter limits displayed items to the selected category', async () => {
    // Render the modal in buy mode and click the Armor category, wrapped in AppContext
    const ctx = ({
      handleManualSave: () => {},
      isSaving: false,
      handleLogout: () => {},
      setCurrentCharacterId: () => {},
      aiModel: 'default',
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
      gold: 1000000,
      inventory: [],
      hasCampingGear: false,
      hasBedroll: false,
      characterLevel: 100,
      handleExportJSON: () => {},
      handleImportJSON: () => {},
      difficulty: 'normal',
      setDifficulty: () => {},
      weather: 'clear',
      statusEffects: [],
      companions: [],
      colorTheme: 'light',
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
    } as any);

    render(<AppContext.Provider value={ctx}><ShopModal open={true} onClose={() => {}} gold={1000000} onPurchase={() => {}} inventory={[]} characterLevel={100} /></AppContext.Provider>);

    // Click the 'Armor' category button
    const armorBtn = screen.getByText('Armor');
    fireEvent.click(armorBtn);

    // Wait for items to render and assert we see at least one Armor item and none from Weapons
    await waitFor(() => expect(screen.queryAllByText(/\(Armor\)/i).length).toBeGreaterThan(0));
    expect(screen.queryAllByText(/\(Weapons\)/i).length).toBe(0);
  });

  it('sell mode shows categories and filters inventory by selected category', async () => {
    const ctx = ({ showQuantityControls: false } as any);
    const inv = [
      { id: 'iron_sword', characterId: 'c1', name: 'Iron Sword', type: 'weapon', description: 'A sword', quantity: 1, equipped: false },
      { id: 'leather_armor', characterId: 'c1', name: 'Leather Armor', type: 'apparel', description: 'A worn set of leather armor.', quantity: 1, equipped: false }
    ];

    render(<AppContext.Provider value={ctx}><ShopModal open={true} onClose={() => {}} gold={1000000} onPurchase={() => {}} inventory={inv} onSell={() => {}} /></AppContext.Provider>);

    // Switch to Sell tab
    const sellBtn = screen.getByText('Sell');
    fireEvent.click(sellBtn);

    // Click Armor category
    const armorBtn = screen.getByText('Armor');
    fireEvent.click(armorBtn);

    // Leather Armor should be visible, Iron Sword should not
    await waitFor(() => expect(screen.getByText('Leather Armor')).toBeTruthy());
    expect(screen.queryByText('Iron Sword')).toBeNull();
  });

  it('sell mode sorting by price works', async () => {
    const ctx = ({ showQuantityControls: false } as any);
    const inv = [
      { id: 'cheap_item', characterId: 'c1', name: 'Iron Sword', type: 'weapon', description: 'A sword', quantity: 1, equipped: false },
      { id: 'expensive_item', characterId: 'c1', name: 'Leather Armor', type: 'apparel', description: 'A worn set of leather armor.', quantity: 1, equipped: false }
    ];

    render(<AppContext.Provider value={ctx}><ShopModal open={true} onClose={() => {}} gold={1000000} onPurchase={() => {}} inventory={inv} onSell={() => {}} /></AppContext.Provider>);

    // Switch to Sell tab
    fireEvent.click(screen.getByText('Sell'));

    // Open Sort selector and choose Price
    fireEvent.click(screen.getByText('Name'));
    // The SortSelector button opened; pick Price
    fireEvent.click(screen.getByText('Price'));

    // Toggle direction to descending
    fireEvent.click(screen.getByLabelText('toggle-sort-direction'));

    // Now the first visible item should be Leather Armor (higher sell price)
    await waitFor(() => {
      const names = screen.getAllByText(/Leather Armor|Iron Sword/);
      expect(names.length).toBeGreaterThanOrEqual(2);
      expect(names[0].textContent).toContain('Leather Armor');
    });
  });

  // --- New tests for curated items & level-gating ---
  it('shows curated shop items only at appropriate character levels', async () => {
    const ctx = ({ handleShopPurchase: () => {}, handleShopSell: () => {}, gold: 1000000 } as any);

    // Level 1: should NOT see mid-tier curated items
    render(<AppContext.Provider value={ctx}><ShopModal open={true} onClose={() => {}} gold={1000000} onPurchase={() => {}} inventory={[]} characterLevel={1} /></AppContext.Provider>);
    expect(screen.queryByText(/Spiked Buckler/i)).toBeNull();
    expect(screen.queryAllByText(/Iron Sword/i).length).toBeGreaterThan(0);

    // Level 6: should see Honed Steel Longsword and Explorer's Boots
    render(<AppContext.Provider value={ctx}><ShopModal open={true} onClose={() => {}} gold={1000000} onPurchase={() => {}} inventory={[]} characterLevel={6} /></AppContext.Provider>);
    expect(screen.getByText(/Honed Steel Longsword/i)).toBeTruthy();
    expect(screen.getByText(/Explorer's Boots/i)).toBeTruthy();
  });
});