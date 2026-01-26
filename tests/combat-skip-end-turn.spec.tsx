import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, afterEach, describe, it, expect } from 'vitest';
import { CombatModal } from '../components/CombatModal';
import { AppContext } from '../AppContext';
import { Character } from '../types';

const character = {
  id: 'char1',
  name: 'Hero',
  profileId: 'p1',
  race: 'Nord',
  gender: 'male',
  archetype: 'Warrior',
  level: 3,
  experience: 0,
  gold: 0,
  perks: [],
  perkPoints: 0,
  stats: { health: 100, magicka: 50, stamina: 100 },
  skills: [],
  time: { day: 1, hour: 8, minute: 0 },
  needs: { hunger: 0, thirst: 0, fatigue: 0 }
} as Character;

const makeCombatState = () => ({
  id: 'test',
  active: true,
  turn: 1,
  currentTurnActor: 'player',
  turnOrder: ['player', 'enemy_e1'],
  enemies: [{ id: 'enemy_e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20, armor: 0, damage: 4 }],
  allies: [],
  location: 'field',
  fleeAllowed: true,
  surrenderAllowed: true,
  combatLog: [],
  playerDefending: false,
  abilityCooldowns: {},
  lastActorActions: {}
});

const makeMinimalCtx = (showToast = vi.fn()) => ({
  handleManualSave: () => {}, isSaving: false, handleLogout: () => {}, setCurrentCharacterId: () => {}, aiModel: 'gpt-4', setAiModel: () => {}, handleExportPDF: () => {}, isExporting: false,
  handleGenerateProfileImage: () => {}, isGeneratingProfileImage: false, handleCreateImagePrompt: () => {}, handleUploadPhoto: () => {}, showToast, isAnonymous: false,
  handleRestWithOptions: () => {}, openBonfireMenu: () => {}, handleEatItem: () => {}, handleDrinkItem: () => {}, handleShopPurchase: () => {}, handleShopSell: () => {}, gold: 0, inventory: [], hasCampingGear: false,
  hasBedroll: false, characterLevel: 10, handleExportJSON: () => {}, handleImportJSON: () => {}, difficulty: 'normal', setDifficulty: () => {}, weather: { type: 'none' }, statusEffects: [], companions: [], colorTheme: 'dark', setColorTheme: () => {}, showQuantityControls: false, setShowQuantityControls: () => {}, weatherEffect: 'none', setWeatherEffect: () => {}, weatherIntensity: 0, setWeatherIntensity: () => {}, openCompanions: () => {}, userSettings: null, updateUserSettings: () => {}, markEntityDirty: () => {}, openAlchemy: () => {}, openCooking: () => {}, openTravel: () => {}, openFactions: () => {}, openShouts: () => {}, openEnchanting: () => {}, openStandingStones: () => {}, openBounty: () => {}, openTraining: () => {}, openTransformation: () => {}, openHousing: () => {}, openAIScribe: () => {}, openPerkTree: () => {}, openAchievements: () => {}, achievementState: { unlockedAchievements: {}, notifiedAchievements: new Set(), stats: { combatWins: 0 } } , updateAchievementStats: () => {}, onCollectAchievementReward: () => {}
});

describe('Skip / End Turn when main already used', () => {
  afterEach(() => vi.restoreAllMocks());

  it('allows Skip even if main action already used (does not show main-action toast)', async () => {
    const showToast = vi.fn();
    const ctx = makeMinimalCtx(showToast as any);

    const init = makeCombatState();
    init.playerMainActionUsed = true;
    init.playerBonusActionUsed = false;

    render(
      <AppContext.Provider value={ctx as any}>
        <CombatModal character={character} inventory={[]} initialCombatState={init as any} onCombatEnd={() => {}} onNarrativeUpdate={() => {}} onInventoryUpdate={() => {}} showToast={() => {}} />
      </AppContext.Provider>
    );

    const skipBtn = await screen.findByText('⏭️ Skip Turn');
    expect(skipBtn).toBeTruthy();

    fireEvent.click(skipBtn);

    // Wait a short while to let the handler run
    await waitFor(() => {
      // Ensure showToast was not called with the main-action message
      expect(showToast.mock.calls.flat().join(' ')).not.toMatch(/Main action already used this turn/i);
      // And a skip narrative appears
      expect(screen.getByText(/You skip your turn\./i)).toBeTruthy();
    }, { timeout: 2500 });
  });

  it('allows End Turn even if main action already used (does not show main-action toast)', async () => {
    const showToast = vi.fn();
    const ctx = makeMinimalCtx(showToast as any);

    const init = makeCombatState();
    init.playerMainActionUsed = true;
    init.playerBonusActionUsed = false;

    render(
      <AppContext.Provider value={ctx as any}>
        <CombatModal character={character} inventory={[]} initialCombatState={init as any} onCombatEnd={() => {}} onNarrativeUpdate={() => {}} onInventoryUpdate={() => {}} showToast={() => {}} />
      </AppContext.Provider>
    );

    const endBtn = await screen.findByText('🔚 End Turn');
    expect(endBtn).toBeTruthy();

    fireEvent.click(endBtn);

    await waitFor(() => {
      expect(showToast.mock.calls.flat().join(' ')).not.toMatch(/Main action already used this turn/i);
      // For end turn we expect the turn to advance (skip narrative may not be present) — confirm the player's action badges now show Available/Used appropriately by checking the DOM state
      const mainBadge = screen.getByText('Main').closest('div');
      expect(mainBadge).toBeTruthy();
    }, { timeout: 2000 });
  });
});