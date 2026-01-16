import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CombatModal } from '../components/CombatModal';
import { Character } from '../types';
import { vi } from 'vitest';

const character = {
  id: 'char1',
  name: 'Hero',
  profileId: 'p1',
  race: 'Nord',
  gender: 'male',
  archetype: 'Warrior',
  level: 3,
  stats: { health: 100, magicka: 50, stamina: 100 },
} as Character;

const makeCombatState = () => ({
  id: 'test',
  active: true,
  turn: 7,
  currentTurnActor: 'enemy1',
  turnOrder: ['player', 'enemy1', 'ally_a1'],
  enemies: [{ id: 'enemy1', name: 'Bandit Cutthroat', level: 1, maxHealth: 30, currentHealth: 30, armor: 0, damage: 4, behavior: 'aggressive' }],
  allies: [{ id: 'ally_a1', name: 'Bella', level: 2, maxHealth: 30, currentHealth: 5, armor: 0, damage: 6, abilities: [{ id: 'a1', name: 'Strike' }], isCompanion: true, companionMeta: { companionId: 'c1', autoLoot: false, autoControl: true } }],
  location: 'field',
  fleeAllowed: true,
  surrenderAllowed: false,
  combatLog: [],
  abilityCooldowns: {},
  lastActorActions: {}
});

describe('Enemy hits an ally', () => {
  beforeEach(() => {
    // Force random to pick ally as target (deterministic)
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows floating damage indicator for ally when hit', async () => {
    render(<CombatModal character={character} inventory={[]} initialCombatState={makeCombatState() as any} onCombatEnd={() => {}} onNarrativeUpdate={() => {}} onInventoryUpdate={() => {}} showToast={() => {}} />);

    // Wait for floating hit indicator to appear with a damage number
    await waitFor(() => expect(document.querySelectorAll('.pointer-events-none').length).toBeGreaterThan(0), { timeout: 3000 });

    // Also confirm combat log contains a line mentioning the ally
    const logEntry = await screen.findByText(/Bella/i, {}, { timeout: 3000 });
    expect(logEntry).toBeTruthy();
  });
});