import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
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
  saveUserCompanions: async () => {},
  loadDynamicEventState: async () => null,
  saveDynamicEventState: async () => {},
  saveCharacterWithRetry: vi.fn(async (_uid: string, _char: any) => Promise.resolve())
}));

import LocalizationProvider from '../services/localization';
import App from '../App';

describe('LevelUp duplicate guard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prevents duplicate level-up notifications when XP updates are applied rapidly', async () => {
    // Ensure minimal localStorage API and pre-select character like other tests
    if (!localStorage || typeof (localStorage as any).getItem !== 'function') {
      (global as any).localStorage = {
        store: {} as Record<string,string>,
        getItem(key: string) { return (this as any).store[key] ?? null; },
        setItem(key: string, value: string) { (this as any).store[key] = String(value); },
        removeItem(key: string) { delete (this as any).store[key]; }
      } as any;
    }
    localStorage.setItem(`aetherius:lastCharacter:testuid`, 'char1');

    const { getByText } = render(<LocalizationProvider><App /></LocalizationProvider>);

    await waitFor(() => expect((window as any).app).toBeDefined(), { timeout: 5000 });
    const app = (window as any).app;

    // Simulate two rapid xpChange updates that would both trigger a level up
    app.handleGameUpdate({ xpChange: 1000 });
    app.handleGameUpdate({ xpChange: 1000 });

    // Wait for the LevelUp overlay to appear (the Skyrim-style banner)
    await waitFor(() => expect(screen.queryAllByText('⚔️ LEVEL UP ⚔️').length === 1).toBeTruthy(), { timeout: 3000 });

    // Ensure no duplicate overlay banners were rendered
    expect(screen.queryAllByText('⚔️ LEVEL UP ⚔️').length).toBe(1);
  });
});
