import React from 'react';
import { render, screen } from '@testing-library/react';
import { CharacterSheet } from '../components/CharacterSheet';
import { AppContext } from '../AppContext';

const baseChar = { id: 'c1', name: 'Hero', gender: 'Male', race: 'Nord', archetype: 'Warrior', level: 5, stats: { health: 100, magicka: 50, stamina: 80 }, skills: [{ name: 'One-Handed', level: 10 }], time: { day:1, hour:12, minute:0 }, needs: { hunger:0, thirst:0, fatigue:0 }, perks: [], experience: 0, gold: 0, profileId: 'p1', identity: '', psychology: '', breakingPoint: '', moralCode: '', forcedBehavior: '', longTermEvolution: '', milestones: [], backstory: '', lastPlayed: Date.now() } as any;

describe('CharacterSheet saved-to-cloud indicator', () => {
  it('shows "Saved to cloud" when lastCloudSaveAt is recent for this character', () => {
    const ctx = { lastCloudSaveAt: Date.now(), lastCloudSavedCharacterId: 'c1' } as any;
    render(
      <AppContext.Provider value={ctx}>
        <CharacterSheet character={baseChar} onRequestLevelUp={undefined} updateCharacter={() => {}} inventory={[]} quests={[]} journal={[]} story={[]} />
      </AppContext.Provider>
    );

    expect(screen.getByText(/Saved to cloud/i)).toBeTruthy();
  });

  it('does not show indicator when last save is for another character', () => {
    const ctx = { lastCloudSaveAt: Date.now(), lastCloudSavedCharacterId: 'other' } as any;
    render(
      <AppContext.Provider value={ctx}>
        <CharacterSheet character={baseChar} onRequestLevelUp={undefined} updateCharacter={() => {}} inventory={[]} quests={[]} journal={[]} story={[]} />
      </AppContext.Provider>
    );

    expect(screen.queryByText(/Saved to cloud/i)).toBeNull();
  });

  it('does not show indicator when last save is old', () => {
    const ctx = { lastCloudSaveAt: Date.now() - 60000, lastCloudSavedCharacterId: 'c1' } as any;
    render(
      <AppContext.Provider value={ctx}>
        <CharacterSheet character={baseChar} onRequestLevelUp={undefined} updateCharacter={() => {}} inventory={[]} quests={[]} journal={[]} story={[]} />
      </AppContext.Provider>
    );

    expect(screen.queryByText(/Saved to cloud/i)).toBeNull();
  });
});