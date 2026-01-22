import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { CombatModal } from '../components/CombatModal';

describe('CombatModal — Auto-combat unarmed fallback', () => {
  beforeEach(() => {
    localStorage.setItem('aetherius:autoCombat', 'true');
  });

  it('uses unarmed strike when stamina is insufficient', async () => {
    const mockEnd = vi.fn();
    const mockInventoryUpdate = vi.fn();

    const character: any = { id: 'char1', name: 'Hero', level: 1, stats: { health: 100, stamina: 100 }, currentVitals: { currentHealth: 100, currentStamina: 0 } };

    const initialState: any = {
      id: 'combat_u',
      active: true,
      result: null,
      currentTurnActor: 'player',
      turn: 1,
      combatElapsedSec: 0,
      enemies: [ { id: 'e1', name: 'Goblin', level: 1, currentHealth: 20, maxHealth: 20, type: 'goblin' } ],
      allies: []
    };

    // Player has both basic_attack (stamina cost) and unarmed_strike (no stamina)
    const abilities = [
      { id: 'basic_attack', name: 'Strike', type: 'melee', damage: 12, cost: 10 },
      { id: 'unarmed_strike', name: 'Unarmed Strike', type: 'melee', damage: 6, cost: 0, unarmed: true }
    ];

    // Player has zero stamina
    const playerStats: any = { currentHealth: 100, maxHealth: 100, currentStamina: 0, maxStamina: 100, abilities };

    render(
      <CombatModal
        character={{ ...character, abilities }}
        inventory={[]}
        initialCombatState={initialState}
        onCombatEnd={mockEnd}
        onNarrativeUpdate={() => {}}
        onInventoryUpdate={mockInventoryUpdate}
        showToast={() => {}}
      />
    );

    // The auto-combat effect should run and pick Unarmed Strike — look for the ability name in combat log
    await waitFor(() => {
      expect(screen.queryByText(/Unarmed Strike/i)).toBeTruthy();
    }, { timeout: 2000 });
  });

  it('falls back to basic attack when no unarmed ability available', async () => {
    const mockEnd = vi.fn();
    const mockInventoryUpdate = vi.fn();

    const character: any = { id: 'char1', name: 'Hero', level: 1, stats: { health: 100, stamina: 100 }, currentVitals: { currentHealth: 100, currentStamina: 0 } };

    const initialState: any = {
      id: 'combat_v',
      active: true,
      result: null,
      currentTurnActor: 'player',
      turn: 1,
      combatElapsedSec: 0,
      enemies: [ { id: 'e1', name: 'Goblin', level: 1, currentHealth: 20, maxHealth: 20, type: 'goblin' } ],
      allies: []
    };

    // Player has only basic attack
    const abilities = [ { id: 'basic_attack', name: 'Strike', type: 'melee', damage: 12, cost: 10 } ];

    // Player has zero stamina
    const playerStats: any = { currentHealth: 100, maxHealth: 100, currentStamina: 0, maxStamina: 100, abilities };

    render(
      <CombatModal
        character={{ ...character, abilities }}
        inventory={[]}
        initialCombatState={initialState}
        onCombatEnd={mockEnd}
        onNarrativeUpdate={() => {}}
        onInventoryUpdate={mockInventoryUpdate}
        showToast={() => {}}
      />
    );

    // Without unarmed ability, the engine will still execute an attack (may scale damage) — verify that 'Strike' is present
    await waitFor(() => {
      expect(screen.queryByText(/Strike/i)).toBeTruthy();
    }, { timeout: 2000 });
  });
});