import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { vi, afterEach, describe, it, expect } from 'vitest';

vi.mock('../../services/firebase', () => ({
  onAuthChange: (cb: any) => { cb({ uid: 'testuid', email: 'test@x.com' } as any); return () => {}; }
}));

const mockSave = vi.fn(async () => {});
const mockLoad = vi.fn(async () => []);
const mockDeleteOne = vi.fn(async () => {});

vi.mock('../../services/firestore', () => ({
  initializeFirestoreDb: async () => {},
  loadUserProfiles: async () => [{ id: 'p1', username: 'tester', created: Date.now() }],
  loadCharacters: async () => [{ id: 'char1', name: 'Hero', profileId: 'p1', race: 'Nord', gender: 'male', archetype: 'Warrior', level: 1, experience: 0, gold: 0, perks: [], perkPoints: 0, stats: { health: 100, magicka: 50, stamina: 100 }, skills: [], time: { day: 1, hour: 8, minute: 0 }, needs: { hunger: 0, thirst: 0, fatigue: 0 }, identity: '', psychology: '', breakingPoint: '', moralCode: '', allowedActions: '', forbiddenActions: '', fears: '', weaknesses: '', talents: '', magicApproach: '', factionAllegiance: '', worldview: '', daedricPerception: '', forcedBehavior: '', longTermEvolution: '', milestones: [], backstory: '' }],
  loadInventoryItems: async () => [],
  loadQuests: async () => [],
  loadJournalEntries: async () => [],
  loadStoryChapters: async () => [],
  loadUserSettings: async () => ({}),
  loadUserCompanions: mockLoad,
  saveUserCompanions: mockSave,
  deleteUserCompanion: mockDeleteOne,
  // Export a spy-able function for assertions
  saveCharacterWithRetry: vi.fn(async (_uid: string, _char: any) => Promise.resolve())
}));

import App from '../../App';
import LocalizationProvider from '../../services/localization';

describe('App.removeCompanion persistence', () => {
  afterEach(() => vi.restoreAllMocks());

  it('calls deleteUserCompanion when removing a companion', async () => {
    const { getByText } = render(<div><LocalizationProvider><App /></LocalizationProvider></div>);

    await waitFor(() => expect((window as any).app).toBeDefined(), { timeout: 5000 });
    const app = (window as any).app;

    // Add a companion then remove it
    const comp = { id: 'cmp1', name: 'TrashComp', characterId: 'char1' };
    app.setCompanions([comp]);

    // ensure app has the companion
    await waitFor(() => expect(app.companions.find((c: any) => c.id === 'cmp1')).toBeTruthy());

    // invoke removal
    app.removeCompanion('cmp1');

    await waitFor(() => expect(mockDeleteOne).toHaveBeenCalledWith('testuid', 'cmp1'));
  });
});
