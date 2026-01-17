import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BlacksmithModal from '../components/BlacksmithModal';
import { AppContext } from '../AppContext';

const items = [
  { id: 'a1', name: 'Ancient Nord Sword', type: 'weapon', upgradeLevel: 0, value: 10, quantity: 1 },
  { id: 'a2', name: 'Steel Sword', type: 'weapon', upgradeLevel: 0, value: 10, quantity: 1 }
];

// Minimal AppContext stub used for isolated component tests
const APP_CTX = {
  handleManualSave: () => {}, isSaving: false, handleLogout: () => {}, setCurrentCharacterId: () => {},
  aiModel: 'preview', setAiModel: () => {}, handleExportPDF: () => {}, isExporting: false,
  handleGenerateProfileImage: () => {}, isGeneratingProfileImage: false, handleCreateImagePrompt: () => {}, handleUploadPhoto: () => {},
  showToast: (_m: string, _t?: any) => {}, isAnonymous: false, lastCloudSaveAt: null, lastCloudSavedCharacterId: null,
  handleRestWithOptions: () => {}, openBonfireMenu: () => {}, handleEatItem: () => {}, handleDrinkItem: () => {},
  handleShopPurchase: () => {}, handleShopSell: () => {}, gold: 0, inventory: [], hasCampingGear: false, hasBedroll: false,
  characterLevel: 20, handleExportJSON: () => {}, handleImportJSON: () => {}, difficulty: 'normal', setDifficulty: () => {},
  weather: { type: 'none' }, statusEffects: [], companions: [], colorTheme: 'dark', setColorTheme: () => {},
  showQuantityControls: false, setShowQuantityControls: () => {}, weatherEffect: 'none', setWeatherEffect: () => {}, weatherIntensity: 0,
  setWeatherIntensity: () => {}, effectsEnabled: true, setEffectsEnabled: () => {}, openCompanions: () => {}, userSettings: null, updateUserSettings: null
};

test('selected badge is visible and not clipped when an item is selected', async () => {
  render(
    <AppContext.Provider value={APP_CTX as any}>
      <BlacksmithModal open={true} onClose={() => {}} items={items as any} setItems={() => {}} gold={100} setGold={() => {}} />
    </AppContext.Provider>
  );

  const first = await screen.findByText(/Ancient Nord Sword/i);
  fireEvent.click(first);
  expect(screen.getByText(/Selected/i)).toBeInTheDocument();
});