import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { CombatModal } from '../components/CombatModal';

describe('CombatModal — Loot toggle & speed buttons', () => {
  beforeEach(() => {
    localStorage.removeItem('aetherius:combatShowLootOnEnd');
    localStorage.removeItem('aetherius:combatSpeedMultiplier');
  });

  it('shows loot menu and toggles persistence from the menu', async () => {
    const mockEnd = vi.fn();
    const mockInventoryUpdate = vi.fn();

    const character: any = { id: 'char1', name: 'Hero', level: 1, stats: { health: 100, magicka: 50, stamina: 50 }, currentVitals: { currentHealth: 100 } };

    const initialState: any = {
      id: 'combat_1',
      active: false,
      result: 'victory',
      combatElapsedSec: 120,
      enemies: [ { id: 'e1', name: 'Goblin', level: 1, currentHealth: 0, maxHealth: 10, type: 'goblin', loot: [{ name: 'Rusty Dagger', type: 'weapon', description: '', quantity: 1 }] } ],
      pendingRewards: { xp: 5, gold: 10, items: [] }
    };

    render(
      <CombatModal
        character={character}
        inventory={[]}
        initialCombatState={initialState}
        onCombatEnd={mockEnd}
        onNarrativeUpdate={() => {}}
        onInventoryUpdate={mockInventoryUpdate}
        showToast={() => {}}
      />
    );

    // Loot button in header should exist
    const lootBtn = screen.getByRole('button', { name: /Loot/i });
    expect(lootBtn).toBeTruthy();

    // Click to open menu
    fireEvent.click(lootBtn);

    // Menu checkbox should be present and reflect state
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeTruthy();

    // Click checkbox to toggle persistence
    fireEvent.click(checkbox);
    expect(localStorage.getItem('aetherius:combatShowLootOnEnd')).toBe('false');
  });

  it('when disabled via menu, victory auto-finalizes and does not show the Loot modal', async () => {
    const mockEnd = vi.fn();
    const mockInventoryUpdate = vi.fn();

    localStorage.setItem('aetherius:combatShowLootOnEnd', 'false');

    const character: any = { id: 'char1', name: 'Hero', level: 1, stats: { health: 100, magicka: 50, stamina: 50 }, currentVitals: { currentHealth: 100 } };

    const initialState: any = {
      id: 'combat_2',
      active: false,
      result: 'victory',
      combatElapsedSec: 120,
      enemies: [ { id: 'e1', name: 'Goblin', level: 1, currentHealth: 0, maxHealth: 10, type: 'goblin', loot: [{ name: 'Rusty Dagger', type: 'weapon', description: '', quantity: 1 }] } ],
      pendingRewards: { xp: 5, gold: 10, items: [] }
    };

    render(
      <CombatModal
        character={character}
        inventory={[]}
        initialCombatState={initialState}
        onCombatEnd={mockEnd}
        onNarrativeUpdate={() => {}}
        onInventoryUpdate={mockInventoryUpdate}
        showToast={() => {}}
      />
    );

    // Should not show Loot Phase
    await waitFor(() => {
      expect(screen.queryByText('Loot Phase')).toBeNull();
    });

    // onCombatEnd should be called to finish combat
    await waitFor(() => {
      expect(mockEnd).toHaveBeenCalled();
    });
  });

  it('when disabled, victory auto-finalizes and does not show the Loot modal', async () => {
    const mockEnd = vi.fn();
    const mockInventoryUpdate = vi.fn();

    localStorage.setItem('aetherius:combatShowLootOnEnd', 'false');

    const character: any = { id: 'char1', name: 'Hero', level: 1, stats: { health: 100, magicka: 50, stamina: 50 }, currentVitals: { currentHealth: 100 } };

    const initialState: any = {
      id: 'combat_2',
      active: false,
      result: 'victory',
      combatElapsedSec: 120,
      enemies: [ { id: 'e1', name: 'Goblin', level: 1, currentHealth: 0, maxHealth: 10, type: 'goblin', loot: [{ name: 'Rusty Dagger', type: 'weapon', description: '', quantity: 1 }] } ],
      pendingRewards: { xp: 5, gold: 10, items: [] }
    };

    render(
      <CombatModal
        character={character}
        inventory={[]}
        initialCombatState={initialState}
        onCombatEnd={mockEnd}
        onNarrativeUpdate={() => {}}
        onInventoryUpdate={mockInventoryUpdate}
        showToast={() => {}}
      />
    );

    // Should not show Loot Phase
    await waitFor(() => {
      expect(screen.queryByText('Loot Phase')).toBeNull();
    });

    // onCombatEnd should be called to finish combat
    await waitFor(() => {
      expect(mockEnd).toHaveBeenCalled();
    });
  });

  it('speed buttons set multiplier and persist to localStorage', async () => {
    const mockEnd = vi.fn();
    const mockInventoryUpdate = vi.fn();

    const character: any = { id: 'char1', name: 'Hero', level: 1, stats: { health: 100, magicka: 50, stamina: 50 }, currentVitals: { currentHealth: 100 } };
    const initialState: any = { id: 'combat_3', active: true, result: null, enemies: [], combatElapsedSec: 0 };

    const { getByText } = render(
      <CombatModal
        character={character}
        inventory={[]}
        initialCombatState={initialState}
        onCombatEnd={mockEnd}
        onNarrativeUpdate={() => {}}
        onInventoryUpdate={mockInventoryUpdate}
        showToast={() => {}}
      />
    );

    const twoBtn = getByText('2x');
    fireEvent.click(twoBtn);

    expect(localStorage.getItem('aetherius:combatSpeedMultiplier')).toBe('2');
    expect(twoBtn).toHaveAttribute('aria-pressed', 'true');
  });
});