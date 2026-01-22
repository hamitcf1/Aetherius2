import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { CombatModal } from '../components/CombatModal';

describe('CombatModal — Loot cancel behavior', () => {
  it('finalizes combat when the Loot modal is cancelled (skip looting)', async () => {
    const mockEnd = vi.fn();
    const mockInventoryUpdate = vi.fn();
    const mockToast = vi.fn();

    const character: any = { id: 'char1', name: 'Hero', level: 1, stats: { health: 100, magicka: 50, stamina: 50 }, currentVitals: { currentHealth: 100, currentMagicka: 50, currentStamina: 50 }, abilities: [] };

    const initialState: any = {
      id: 'combat_1',
      active: false,
      result: 'victory',
      combatElapsedSec: 120,
      enemies: [
        { id: 'e1', name: 'Goblin', level: 1, currentHealth: 0, maxHealth: 10, type: 'goblin', loot: [{ name: 'Rusty Dagger', type: 'weapon', description: '', quantity: 1 }] }
      ],
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
        showToast={mockToast as any}
      />
    );

    // Loot modal should appear
    await screen.findByText('Loot Phase');

    // Click Cancel to dismiss/skip
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    // Expect finalization to call onInventoryUpdate and onCombatEnd
    await waitFor(() => {
      expect(mockInventoryUpdate).toHaveBeenCalled();
      expect(mockEnd).toHaveBeenCalledWith(
        'victory',
        expect.any(Object),
        expect.any(Object),
        expect.any(Number),
        expect.any(Object)
      );
    });
  });
});