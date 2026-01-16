import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LevelUpModal from '../components/LevelUpModal';
import { BlacksmithModal } from '../components/BlacksmithModal';
import PerkTreeModal from '../components/PerkTreeModal';
import CompanionsModal from '../components/CompanionsModal';
import SpellsModal from '../components/SpellsModal';
import { DungeonModal } from '../components/DungeonModal';
import { audioService } from '../services/audioService';
import { AppContext } from '../AppContext';

// Helper to wait a short while to detect unexpected calls
async function shortDelay(ms = 350) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Modal auto-close / SFX spam detection', () => {
  beforeEach(() => {
    audioService.setDebugSfx(true);
    audioService.clearRecentSfxEvents();
  });

  afterEach(() => {
    audioService.setDebugSfx(false);
    audioService.clearRecentSfxEvents();
  });

  test('LevelUpModal does not call onClose on mount', async () => {
    const onClose = vi.fn();
    render(<LevelUpModal open={true} onClose={onClose} onConfirm={() => {}} characterName="Test" newLevel={2} />);
    await shortDelay();
    expect(onClose).not.toHaveBeenCalled();
    const events = audioService.getRecentSfxEvents().filter(e => e.kind === 'modal_close' || e.effect === 'menu_close');
    expect(events.length).toBeLessThanOrEqual(0);
  });

  test('BlacksmithModal does not call onClose on mount', async () => {
    const onClose = vi.fn();
    // Provide a minimal AppContext so useAppContext() inside BlacksmithModal doesn't throw
    const ctx: any = {
      handleManualSave: () => {}, isSaving: false, handleLogout: () => {}, setCurrentCharacterId: () => {}, aiModel: 'gpt-4', setAiModel: () => {}, handleExportPDF: () => {}, isExporting: false,
      handleGenerateProfileImage: () => {}, isGeneratingProfileImage: false, handleCreateImagePrompt: () => {}, handleUploadPhoto: () => {}, showToast: () => {}, isAnonymous: false,
      handleRestWithOptions: () => {}, openBonfireMenu: () => {}, handleEatItem: () => {}, handleDrinkItem: () => {}, handleShopPurchase: () => {}, handleShopSell: () => {}, gold: 0, inventory: [], hasCampingGear: false,
      hasBedroll: false, characterLevel: 10, handleExportJSON: () => {}, handleImportJSON: () => {}, difficulty: 'normal', setDifficulty: () => {}, weather: { type: 'none' }, statusEffects: [], companions: [], colorTheme: 'dark', setColorTheme: () => {}, showQuantityControls: false, setShowQuantityControls: () => {}, weatherEffect: 'none', setWeatherEffect: () => {}, weatherIntensity: 0, setWeatherIntensity: () => {}, openCompanions: () => {}, userSettings: null, updateUserSettings: () => {}
    };

    render(
      <AppContext.Provider value={ctx}>
        <BlacksmithModal open={true} onClose={onClose} items={[]} setItems={() => {}} gold={100} setGold={() => {}} />
      </AppContext.Provider>
    );

    await shortDelay();
    expect(onClose).not.toHaveBeenCalled();
    const events = audioService.getRecentSfxEvents().filter(e => e.kind === 'modal_close' || e.effect === 'menu_close');
    expect(events.length).toBe(0);
  });

  test('PerkTreeModal does not call onClose on mount', async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const character = { id: 'c1', perkPoints: 0, perks: [], level: 1 } as any;
    render(<PerkTreeModal open={true} onClose={onClose} character={character} onConfirm={onConfirm} /> as any);
    await shortDelay();
    expect(onClose).not.toHaveBeenCalled();
    const events = audioService.getRecentSfxEvents().filter(e => e.kind === 'modal_close' || e.effect === 'menu_close');
    expect(events.length).toBe(0);
  });

  test('CompanionsModal does not call onClose on mount', async () => {
    const onClose = vi.fn();
    const onAdd = vi.fn();
    const onUpdate = vi.fn();
    const onRemove = vi.fn();
    render(<CompanionsModal open={true} onClose={onClose} companions={[]} onAdd={onAdd} onUpdate={onUpdate} onRemove={onRemove} /> as any);
    await shortDelay();
    expect(onClose).not.toHaveBeenCalled();
    const events = audioService.getRecentSfxEvents().filter(e => e.kind === 'modal_close' || e.effect === 'menu_close');
    expect(events.length).toBe(0);
  });

  test('SpellsModal does not call onClose on mount', async () => {
    const onClose = vi.fn();
    const character = { id: 'c1', learnedSpells: [] } as any;
    render(<SpellsModal open={true} onClose={onClose} character={character} /> as any);
    await shortDelay();
    expect(onClose).not.toHaveBeenCalled();
    const events = audioService.getRecentSfxEvents().filter(e => e.kind === 'modal_close' || e.effect === 'menu_close');
    expect(events.length).toBe(0);
  });

  test('DungeonModal does not call onClose on mount', async () => {
    const onClose = vi.fn();
    // Provide minimal required props; dungeonId can be null to avoid inner logic, but open=true should still mount wrapper
    render(<DungeonModal open={true} dungeonId={null} onClose={onClose} activeCharacterId={null} character={null} inventory={[]} onApplyRewards={() => {}} /> as any);
    await shortDelay(600);
    expect(onClose).not.toHaveBeenCalled();
    const events = audioService.getRecentSfxEvents().filter(e => e.kind === 'modal_close' || e.effect === 'menu_close');
    // permit zero or the suppressed skip event; assert <=1
    expect(events.length).toBeLessThanOrEqual(1);
  });
});
