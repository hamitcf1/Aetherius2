import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  saveUserCompanions: async () => {},
  loadDynamicEventState: async () => null,
  saveDynamicEventState: async () => {},
  saveCharacterWithRetry: vi.fn(async (_uid: string, _char: any) => Promise.resolve())
}));

import LocalizationProvider from '../services/localization';
import App from '../App';
import { getXPForNextLevel } from '../utils/levelingSystem';

describe('Multi-level up flow', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('prompts again if remaining XP is enough for another level', async () => {
    // Ensure minimal localStorage API is available
    if (!localStorage || typeof (localStorage as any).getItem !== 'function') {
      (global as any).localStorage = {
        store: {} as Record<string,string>,
        getItem(key: string) { return (this as any).store[key] ?? null; },
        setItem(key: string, value: string) { (this as any).store[key] = String(value); },
        removeItem(key: string) { delete (this as any).store[key]; }
      } as any;
    }

    localStorage.setItem(`aetherius:lastCharacter:testuid`, 'char1');

    render(<LocalizationProvider><App /></LocalizationProvider>);
    await waitFor(() => expect((window as any).app).toBeDefined(), { timeout: 5000 });
    const app = (window as any).app;

    await waitFor(() => expect(screen.queryAllByText('Hero').length > 0).toBeTruthy(), { timeout: 2000 });
    const heroElems = screen.queryAllByText('Hero');
    let heroElem = heroElems.find(e => e.closest('button') && e.closest('button')!.closest('.grid'));
    if (!heroElem) heroElem = heroElems[heroElems.length - 1];
    heroElem!.closest('button') && (heroElem!.closest('button') as HTMLButtonElement).click();

    // Give XP enough for two level-ups
    const xpNeeded = getXPForNextLevel(1) + getXPForNextLevel(2) + 5;
    app.handleGameUpdate({ xpChange: xpNeeded });

    // Wait for first level modal
    await waitFor(() => expect(screen.queryAllByText('Level Up!').length > 0).toBeTruthy(), { timeout: 3000 });

    // Confirm the first level-up
    const confirmBtn = screen.getByText('Confirm');
    fireEvent.click(confirmBtn);

    // Now the modal should re-appear for the next level (level 3)
    await waitFor(() => expect(screen.queryByText(/reached level 3/i)).toBeTruthy(), { timeout: 3000 });

    // Confirm second level as well
    const confirmBtn2 = screen.getByText('Confirm');
    fireEvent.click(confirmBtn2);

    // Finally, verify there's no pending modal and character's level reflects the final level
    await waitFor(() => expect(screen.queryByText('Level Up!')).toBeNull(), { timeout: 3000 });

    const state = (window as any).app.characters.find((c: any) => c.id === 'char1');
    expect(state.level).toBe(3);
  });
});