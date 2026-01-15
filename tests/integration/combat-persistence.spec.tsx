import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { vi, afterEach, describe, it, expect } from 'vitest';

// Mocks must be set up before importing App
vi.mock('../services/firebase', () => ({
  onAuthChange: (cb: any) => { cb({ uid: 'testuid', email: 'test@x.com' } as any); return () => {}; }
}));

// Mock Firestore loaders used by App
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
  // Export a spy-able function for assertions
  saveCharacterWithRetry: vi.fn(async (_uid: string, _char: any) => Promise.resolve())
}));

import App from '../../App';
import * as fs from '../../services/firestore';

describe('Combat persistence integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies rewards and persists character via saveCharacterWithRetry', async () => {
    console.log('TEST: rendering App');
    const { getByText } = render(<App />);

    // Wait for window.app to be populated by App's useEffect
    console.log('TEST: waiting for window.app');
    await waitFor(() => expect((window as any).app).toBeDefined(), { timeout: 5000 });

    const app = (window as any).app;
    console.log('TEST: app ready', !!app.currentUser, app.characters?.length);
    expect(app.currentUser).toBeDefined();

    // Ensure character loaded
    await waitFor(() => expect(app.characters && app.characters.length > 0).toBeTruthy(), { timeout: 5000 });

    const before = app.characters.find((c: any) => c.id === 'char1');
    expect(before.gold).toBe(0);
    expect(before.experience).toBe(0);

    // Apply a reward update (simulating CombatModal onCombatEnd calling handleGameUpdate)
    app.handleGameUpdate({ xpChange: 50, goldChange: 20, transactionId: 'txn_test' });

    // After apply, characters state should update and saveCharacterWithRetry should be called
    await waitFor(() => {
      const after = (window as any).app.characters.find((c: any) => c.id === 'char1');
      expect(after.gold).toBe(20);
      expect(after.experience).toBe(50);
    }, { timeout: 5000 });

    // Check persist call
    expect(fs.saveCharacterWithRetry).toHaveBeenCalled();
    const callArgs = (fs.saveCharacterWithRetry as any).mock.calls[0];
    expect(callArgs[0]).toBe('testuid');
    expect(callArgs[1].gold).toBe(20);
    expect(callArgs[1].experience).toBe(50);
  });
});