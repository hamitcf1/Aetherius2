import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { vi, afterEach, describe, it, expect } from 'vitest';

// Mock Firebase auth to populate window.app
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
  saveCharacterWithRetry: vi.fn(async (_uid: string, _char: any) => Promise.resolve())
}));

import App from '../App';

describe('LevelUp duplicate guard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prevents duplicate level-up notifications when XP updates are applied rapidly', async () => {
    const { getByText } = render(<App />);

    await waitFor(() => expect((window as any).app).toBeDefined(), { timeout: 5000 });
    const app = (window as any).app;

    // Simulate two rapid xpChange updates that would both trigger a level up
    app.handleGameUpdate({ xpChange: 1000 });
    app.handleGameUpdate({ xpChange: 1000 });

    // Wait for the notification to be queued
    await waitFor(() => {
      expect(app.levelUpNotifications && app.levelUpNotifications.length <= 1).toBeTruthy();
    }, { timeout: 3000 });

    // There should be at most one visual level-up notification queued
    expect(app.levelUpNotifications.length).toBe(1);
  });
});
