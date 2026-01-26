import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, afterEach, describe, it, expect, beforeEach } from 'vitest';
import { CombatModal } from '../components/CombatModal';
import { AppContext } from '../AppContext';
import * as combatService from '../services/combatService';

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
};

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

const makeMinimalCtx = () => ({
  handleManualSave: () => {}, isSaving: false, handleLogout: () => {}, setCurrentCharacterId: () => {}, aiModel: 'gpt-4', setAiModel: () => {}, handleExportPDF: () => {}, isExporting: false,
  handleGenerateProfileImage: () => {}, isGeneratingProfileImage: false, handleCreateImagePrompt: () => {}, handleUploadPhoto: () => {}, showToast: () => {}, isAnonymous: false,
  handleRestWithOptions: () => {}, openBonfireMenu: () => {}, handleEatItem: () => {}, handleDrinkItem: () => {}, handleShopPurchase: () => {}, handleShopSell: () => {}, gold: 0, inventory: [], hasCampingGear: false,
  hasBedroll: false, characterLevel: 10, handleExportJSON: () => {}, handleImportJSON: () => {}, difficulty: 'normal', setDifficulty: () => {}, weather: { type: 'none' }, statusEffects: [], companions: [], colorTheme: 'dark', setColorTheme: () => {}, showQuantityControls: false, setShowQuantityControls: () => {}, weatherEffect: 'none', setWeatherEffect: () => {}, weatherIntensity: 0, setWeatherIntensity: () => {}, openCompanions: () => {}, userSettings: null, updateUserSettings: () => {}, markEntityDirty: () => {}, openAlchemy: () => {}, openCooking: () => {}, openTravel: () => {}, openFactions: () => {}, openShouts: () => {}, openEnchanting: () => {}, openStandingStones: () => {}, openBounty: () => {}, openTraining: () => {}, openTransformation: () => {}, openHousing: () => {}, openAIScribe: () => {}, openPerkTree: () => {}, openAchievements: () => {}, achievementState: { unlockedAchievements: {}, notifiedAchievements: new Set(), stats: { combatWins: 0 } } , updateAchievementStats: () => {}, onCollectAchievementReward: () => {}, effectsEnabled: true, setEffectsEnabled: () => {}
});

describe('Combat spell visuals', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    try { vi.useRealTimers(); } catch (e) {}
  });

  it('shows healing VFX when casting a healing ability', async () => {
    const ctx = makeMinimalCtx();

    // Mock player stats so a healing ability is present
    const heal = { id: 'heal1', name: 'Heal Minor', type: 'magic', heal: 30, cost: 0 } as any;
    const stubbedStats: any = { currentHealth: 50, maxHealth: 100, currentMagicka: 50, maxMagicka: 50, currentStamina: 100, maxStamina: 100, abilities: [heal] };
    vi.spyOn(combatService, 'calculatePlayerCombatStats').mockReturnValue(stubbedStats as any);

    const { container } = render(
      <AppContext.Provider value={ctx as any}>
        <CombatModal character={character as any} inventory={[]} initialCombatState={makeCombatState() as any} onCombatEnd={() => {}} onNarrativeUpdate={() => {}} onInventoryUpdate={() => {}} showToast={() => {}} />
      </AppContext.Provider>
    );

    // Activate Magical tab so heal ability is visible
    const magicalNodes = await screen.findAllByText(/MAGICAL/i);
    const magicalTab = magicalNodes.find(n => n.textContent && n.textContent.includes('✨')) || magicalNodes[0];
    fireEvent.click(magicalTab as HTMLElement);

    // Click heal ability (will prompt for target selection)
    const healNodes = await screen.findAllByText(/Heal Minor/i);
    const healBtn = healNodes.map(n => n.closest('button')).find(Boolean) as HTMLElement | undefined;
    expect(healBtn).toBeTruthy();
    fireEvent.click(healBtn!);

    // Confirm 'Use Self'
    const useSelf = await screen.findByText(/Use Self/i);
    fireEvent.click(useSelf);

    // Wait for the healing effect to be added to DOM
    await waitFor(() => {
      expect(container.querySelector('div[style*="linear-gradient(180deg"]')).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('shows conjuration VFX for a conjure ability', async () => {
    const ctx = makeMinimalCtx();

    // Mock player stats so an ability is present
    const conj = { id: 'conj1', name: 'Conjure Familiar', type: 'magic', effects: [{ type: 'summon' }], cost: 0 } as any;
    const stubbedStats: any = { currentHealth: 100, maxHealth: 100, currentMagicka: 50, maxMagicka: 50, currentStamina: 100, maxStamina: 100, abilities: [conj], abilitiesById: { [conj.id]: conj } };
    vi.spyOn(combatService, 'calculatePlayerCombatStats').mockReturnValue(stubbedStats as any);

    const { container } = render(
      <AppContext.Provider value={ctx as any}>
        <CombatModal character={character as any} inventory={[]} initialCombatState={makeCombatState() as any} onCombatEnd={() => {}} onNarrativeUpdate={() => {}} onInventoryUpdate={() => {}} showToast={() => {}} />
      </AppContext.Provider>
    );

    // Activate Magical tab so conjure ability is visible (choose one of the MAGICAL tab nodes if multiple)
    const magicalNodes = await screen.findAllByText(/MAGICAL/i);
    const magicalTab = magicalNodes.find(n => n.textContent && n.textContent.includes('✨')) || magicalNodes[0];
    fireEvent.click(magicalTab as HTMLElement);

    // Find and click the conjure button (ability label present)
    const conjNodes = await screen.findAllByText(/Conjure Familiar/i);
    const conjBtnEl = conjNodes.map(n => n.closest('button')).find(Boolean) as HTMLElement | undefined;
    expect(conjBtnEl).toBeTruthy();
    fireEvent.click(conjBtnEl!);

    await waitFor(() => {
      expect(container.innerHTML).toMatch(/conic-gradient\(from 0deg, rgba\(147, 51, 234, 0.6\)/i);
    }, { timeout: 2000 });
  });
});
