import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ActionBar from '../components/ActionBar';
import { AppContext } from '../AppContext';
import { audioService } from '../services/audioService';
import LocalizationProvider from '../services/localization';
import { vi } from 'vitest';

const noop = () => {};
const baseContext: any = {
  handleManualSave: noop,
  isSaving: false,
  handleLogout: noop,
  setCurrentCharacterId: noop,
  aiModel: 'gemma-3-27b-it',
  setAiModel: noop,
  handleExportPDF: noop,
  isExporting: false,
  handleGenerateProfileImage: noop,
  isGeneratingProfileImage: false,
  handleCreateImagePrompt: noop,
  handleUploadPhoto: noop,
  showToast: noop,
  isAnonymous: false,
  handleRestWithOptions: noop,
  openBonfireMenu: noop,
  handleEatItem: noop,
  handleDrinkItem: noop,
  handleShopPurchase: noop,
  handleShopSell: noop,
  gold: 0,
  inventory: [],
  hasCampingGear: false,
  hasBedroll: false,
  characterLevel: 1,
  handleExportJSON: noop,
  handleImportJSON: noop,
  difficulty: 'normal',
  setDifficulty: noop,
  weather: { type: 'none' },
  statusEffects: [],
  companions: [],
  colorTheme: 'dark',
  setColorTheme: noop,
  showQuantityControls: false,
  setShowQuantityControls: noop,
  weatherEffect: 'none',
  setWeatherEffect: noop,
  weatherIntensity: 'normal',
  setWeatherIntensity: noop,
  openCompanions: noop,
  userSettings: null,
  updateUserSettings: null
};

describe('ActionBar volume controls', () => {
  it('uses 0.01 step and updates audioService when changed', async () => {
    const spyMusic = vi.spyOn(audioService, 'setMusicVolume');
    const spySfx = vi.spyOn(audioService, 'setSoundEffectsVolume');

    render(
      <LocalizationProvider>
        <AppContext.Provider value={baseContext}>
          <ActionBar />
        </AppContext.Provider>
      </LocalizationProvider>
    );

    // Open the actions menu to reveal the sliders
    const openBtn = screen.getByLabelText('Open actions menu');
    // toggle open via act to ensure state updates flush
    const { act } = await import('react-dom/test-utils');
    await act(async () => { fireEvent.click(openBtn); });
    const settingsBtn = await screen.findByText('Settings');
    await act(async () => { fireEvent.click(settingsBtn); });

    const sliders = await screen.findAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(2);

    const musicSlider = sliders[0] as HTMLInputElement;
    const sfxSlider = sliders[1] as HTMLInputElement;

    // step attribute should be 0.01
    expect(musicSlider.getAttribute('step')).toBe('0.01');
    expect(sfxSlider.getAttribute('step')).toBe('0.01');

    // change music to 0.01 (1%)
    fireEvent.change(musicSlider, { target: { value: '0.01' } });
    expect(spyMusic).toHaveBeenCalledWith(0.01);
    expect(screen.getByText('1%')).toBeTruthy();

    // change sfx to 0.02 (2%)
    fireEvent.change(sfxSlider, { target: { value: '0.02' } });
    expect(spySfx).toHaveBeenCalledWith(0.02);
    expect(screen.getByText('2%')).toBeTruthy();

    spyMusic.mockRestore();
    spySfx.mockRestore();
  });
});