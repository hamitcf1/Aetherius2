import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, afterEach, describe, it, expect } from 'vitest';

vi.mock('../services/firebase', () => ({
  onAuthChange: (cb: any) => { cb({ uid: 'testuid', email: 'test@x.com' } as any); return () => {}; }
}));

vi.mock('../services/firestore', () => ({
  initializeFirestoreDb: async () => {},
  loadUserProfiles: async () => [{ id: 'p1', username: 'tester', created: Date.now() }],
  loadCharacters: async () => [{ id: 'char1', name: 'Hero', profileId: 'p1', race: 'Nord', gender: 'male', archetype: 'Warrior', level: 1, experience: 0, gold: 0, perks: [], perkPoints: 0, stats: { health: 100, magicka: 50, stamina: 100 }, skills: [], time: { day: 1, hour: 8, minute: 0 }, needs: { hunger: 0, thirst: 0, fatigue: 0 }, identity: '', psychology: '', breakingPoint: '', moralCode: '', allowedActions: '', forbiddenActions: '', fears: '', weaknesses: '', talents: '', magicApproach: '', factionAllegiance: '', worldview: '', daedricPerception: '', forcedBehavior: '', longTermEvolution: '', milestones: [], backstory: '' }],
  loadInventoryItems: async () => [],
  loadQuests: async () => [],
  loadJournalEntries: async () => [],
  loadStoryChapters: async () => [],
  loadUserSettings: async () => ({}),
  loadUserCompanions: async () => [],
  saveCharacterWithRetry: vi.fn(async (_uid: string, _char: any) => Promise.resolve())
}));

import App from '../App';

describe('Level up available button', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('shows a "Level up available" button after canceling a pending level up', async () => {
    render(<App />);
    await waitFor(() => expect((window as any).app).toBeDefined(), { timeout: 5000 });
    const app = (window as any).app;

    // Trigger a level up (via XP change)
    app.handleGameUpdate({ xpChange: 1000 });

    // Cancel the level up (move to available bucket)
    (window as any).cancelLevelUp();

    // Now the CharacterSheet should show the indicator/button
    await waitFor(() => {
      expect(screen.queryByText('Level up available')).toBeTruthy();
    }, { timeout: 2000 });

    // Verify availableLevelUps map contains an entry for char1
    const avail = (window as any).availableLevelUps();
    expect(avail['char1']).toBeDefined();
  });
});