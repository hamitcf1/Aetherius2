import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CombatModal } from '../components/CombatModal';
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

describe('Combat UI skip button', () => {
  it('shows skip button and logs skip when clicked', async () => {
    render(<CombatModal character={character} inventory={[]} initialCombatState={makeCombatState() as any} onCombatEnd={() => {}} onNarrativeUpdate={() => {}} onInventoryUpdate={() => {}} showToast={() => {}} />);

    const skipBtn = await screen.findByText('⏭️ Skip Turn');
    expect(skipBtn).toBeTruthy();

    fireEvent.click(skipBtn);

    // Wait for the combat log to include the explicit skip narrative (avoid matching the button label)
    await waitFor(() => expect(screen.getByText(/You skip your turn\./i)).toBeTruthy(), { timeout: 3000 });

    // Ensure the skip combat log entry does not include a roll marker
    const entry = screen.getByText(/You skip your turn\./i);
    const entryContainer = entry.closest('div');
    expect(entryContainer).toBeTruthy();
    expect(entryContainer && entryContainer.textContent).not.toMatch(/Roll:/i);
  });
});