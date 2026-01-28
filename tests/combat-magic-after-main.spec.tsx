import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CombatModal from '../components/CombatModal';
import { vi } from 'vitest';
import { AppContext } from '../AppContext';

test('casting a magic (bonus) ability after main action used should be allowed', async () => {
  const mockShowToast = vi.fn();
  const character: any = {
    id: 'char1', name: 'Hero', level: 5, stats: { health: 100 }, currentVitals: { currentHealth: 90 },
    abilities: [{ id: 'fire_bolt', name: 'Fire Bolt', type: 'magic', cost: 10, damage: 20 }]
  };
  const state: any = {
    id: 'c1', active: true, turn: 1, currentTurnActor: 'player', turnOrder: ['player', 'enemy1'],
    enemies: [{ id: 'enemy1', name: 'Bandit', level: 1, maxHealth: 40, currentHealth: 40, armor: 0 }],
    allies: [], abilityCooldowns: {}, combatLog: [], playerMainActionUsed: true, playerBonusActionUsed: false
  };

  const ctxValue: any = {    handleManualSave: () => {}, isSaving: false, handleLogout: () => {}, setCurrentCharacterId: () => {}, aiModel: 'gemini', setAiModel: () => {}, handleExportPDF: () => {}, isExporting: false, handleGenerateProfileImage: () => {}, isGeneratingProfileImage: false, handleCreateImagePrompt: () => {}, handleUploadPhoto: () => {}, showToast: mockShowToast, isAnonymous: false, lastCloudSaveAt: null, lastCloudSavedCharacterId: null, handleRestWithOptions: () => {}, openBonfireMenu: () => {}, handleEatItem: () => {}, handleDrinkItem: () => {}, handleShopPurchase: () => {}, handleShopSell: () => {}, gold: 0, inventory: [], hasCampingGear: false, hasBedroll: false, characterLevel: 1, handleExportJSON: () => {}, handleImportJSON: () => {}, difficulty: 'normal', setDifficulty: () => {}, weather: { type: 'none' }, statusEffects: [], companions: [], colorTheme: 'dark', setColorTheme: () => {}, showQuantityControls: true, setShowQuantityControls: () => {}, weatherEffect: 'none', setWeatherEffect: () => {}, weatherIntensity: 0, setWeatherIntensity: () => {}, effectsEnabled: true, setEffectsEnabled: () => {}, openCompanions: () => {}, openAchievements: () => {}, achievementState: { unlockedAchievements: {}, notifiedAchievements: new Set(), stats: {} }, updateAchievementStats: () => {}, onCollectAchievementReward: () => {}, userSettings: null, updateUserSettings: () => {}, markEntityDirty: () => {}, openAlchemy: () => {}, openCooking: () => {}, openTravel: () => {}, openFactions: () => {}, openShouts: () => {}, openEnchanting: () => {}, openStandingStones: () => {}, openBounty: () => {}, openTraining: () => {}, openTransformation: () => {}, openHousing: () => {}, openAIScribe: () => {}, openBugReport: () => {} };
  render(
    <AppContext.Provider value={ctxValue}>
      <CombatModal
        character={character}
        inventory={[]}
        initialCombatState={state}
        onCombatEnd={() => {}}
        onNarrativeUpdate={() => {}}
        onInventoryUpdate={() => {}}
        showToast={mockShowToast}
      />
    </AppContext.Provider>
  );

  // Ensure the Magical tab is active so the magic abilities are visible
  const magicalTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && /Magical/i.test(b.textContent)) as HTMLElement | undefined;
  if (magicalTab) magicalTab.click();

  // Find the Fire Bolt button (best-effort; layout may hide controls) and click it
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && /Fire Bolt/i.test(b.textContent)) as HTMLElement | undefined;
  if (!btn) throw new Error('Fire Bolt button not found in test render');
  btn.click();

  // Ensure the UI did not block the action due to "Main action already used"
  await waitFor(() => {
    // Should NOT have been called with main-action warning
    expect(mockShowToast.mock.calls.some(c => (c[0] || '').toString().includes('Main action already used'))).toBe(false);
  });

  // And the combat log or a roll result should appear -- look for Bandit damage narrative or roll
  await waitFor(() => {
    const found = Array.from(document.querySelectorAll('div')).some(d => /Bandit/i.test(d.textContent || '') && /Fire Bolt|Roll:/i.test(d.textContent || ''));
    expect(found).toBe(true);
  });
});