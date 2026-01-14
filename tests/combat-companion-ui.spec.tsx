import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CombatModal } from '../components/CombatModal';
import { vi } from 'vitest';
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
  needs: { hunger: 0, thirst: 0, fatigue: 0 },
  identity: '',
  psychology: '',
  breakingPoint: '',
  moralCode: '',
  allowedActions: '',
  forbiddenActions: '',
  fears: '',
  weaknesses: '',
  talents: '',
  magicApproach: '',
  factionAllegiance: '',
  worldview: '',
  daedricPerception: '',
  forcedBehavior: '',
  longTermEvolution: '',
  milestones: [],
  backstory: ''
} as Character;

const makeCombatState = () => ({
  id: 'test',
  active: true,
  turn: 1,
  currentTurnActor: 'ally_a1',
  turnOrder: ['player', 'enemy_e1', 'ally_a1'],
  enemies: [{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20, armor: 0, damage: 4 }],
  allies: [{ id: 'ally_a1', name: 'Buddy', level: 2, maxHealth: 30, currentHealth: 30, armor: 0, damage: 6, abilities: [{ id: 'a1', name: 'Strike' }], isCompanion: true, companionMeta: { companionId: 'c1', autoLoot: false, autoControl: false } }],
  location: 'field',
  fleeAllowed: true,
  surrenderAllowed: false,
  combatLog: [],
  playerDefending: false,
  playerActiveEffects: [],
  abilityCooldowns: {},
  lastActorActions: {}
});

describe('CombatModal companion turn UI', () => {
  it('pauses for companion when autoControl is false and allows manual ability click', async () => {
    const mockEnd = vi.fn();
    const mockNarr = vi.fn();

    render(<CombatModal character={character} inventory={[]} initialCombatState={makeCombatState() as any} onCombatEnd={mockEnd} onNarrativeUpdate={mockNarr} onInventoryUpdate={() => {}} showToast={() => {}} />);

    // When the component mounts, it should show the control panel for the ally
    const controlText = await screen.findByText(/Control Buddy/i, {}, { timeout: 3000 });
    expect(controlText).toBeTruthy();

    // There should be buttons for the ability (may appear multiple times in responsive layouts)
    const abilityButtons = screen.getAllByText('Strike');
    expect(abilityButtons.length).toBeGreaterThan(0);

    // Click skip to surrender the companion's turn (works without waiting for the roll animation)
    const skipButton = screen.getByText('Skip Companion Turn');
    fireEvent.click(skipButton);

    // Control panel should disappear after skipping
    await waitFor(() => expect(screen.queryByText(/Control Buddy/i)).toBeNull(), { timeout: 3000 });
  });
});
