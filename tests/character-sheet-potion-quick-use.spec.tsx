import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterSheet } from '../components/CharacterSheet';
import { AppContext } from '../AppContext';

const baseChar = { id: 'c1', name: 'Hero', gender: 'Male', race: 'Nord', archetype: 'Warrior', level: 5, stats: { health: 100, magicka: 50, stamina: 80 }, currentVitals: { currentHealth: 60, currentMagicka: 20, currentStamina: 40 }, skills: [{ name: 'One-Handed', level: 10 }], time: { day:1, hour:12, minute:0 }, needs: { hunger:0, thirst:0, fatigue:0 }, perks: [], experience: 0, gold: 0, profileId: 'p1', identity: '', psychology: '', breakingPoint: '', moralCode: '', forcedBehavior: '', longTermEvolution: '', milestones: [], backstory: '', lastPlayed: Date.now() } as any;

describe('CharacterSheet — quick potion use', () => {
  it('calls onUseItem when quick potion button is clicked', () => {
    const potion = { id: 'p_hp_1', name: 'Minor Healing Potion', type: 'potion', quantity: 1 } as any;
    const onUse = vi.fn();
    render(
      <AppContext.Provider value={{} as any}>
        <CharacterSheet character={baseChar} onRequestLevelUp={undefined} updateCharacter={() => {}} inventory={[potion]} quests={[]} journal={[]} story={[]} onUseItem={onUse} />
      </AppContext.Provider>
    );

    // The quick potion button title should include the potion name
    const btn = screen.getByTitle(/Minor Healing Potion/i);
    expect(btn).toBeTruthy();
    fireEvent.click(btn);
    expect(onUse).toHaveBeenCalledTimes(1);
    expect(onUse).toHaveBeenCalledWith(expect.objectContaining({ id: 'p_hp_1' }));
  });
});
