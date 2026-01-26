import React from 'react';
import { render, screen } from '@testing-library/react';
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
  enemies: [{ id: 'enemy_e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 10, armor: 0, damage: 4, activeEffects: [{ effect: { type: 'fire' }, turnsRemaining: 2 }] }],
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

describe('Combat enemy effects visuals', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders a flame badge for enemies with fire activeEffect', async () => {
    const ctx = makeMinimalCtx();
    render(
      <AppContext.Provider value={ctx as any}>
        <CombatModal character={character} inventory={[]} initialCombatState={makeCombatState() as any} onCombatEnd={() => {}} onNarrativeUpdate={() => {}} onInventoryUpdate={() => {}} showToast={() => {}} />
      </AppContext.Provider>
    );

    const badge = await screen.findByText(/🔥/i);
    expect(badge).toBeTruthy();
  });
});
