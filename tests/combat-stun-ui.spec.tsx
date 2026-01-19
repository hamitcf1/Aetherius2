import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CombatModal from '../components/CombatModal';

const character: any = { id: 'c1', name: 'Hero', level: 5, stats: { health: 100, magicka: 50, stamina: 60 } };

it('disables action buttons when player is stunned and clicking shows a warning toast', async () => {
  const showToast = vi.fn();
  const state: any = {
    active: true,
    turn: 1,
    currentTurnActor: 'player',
    turnOrder: ['player', 'e1'],
    enemies: [{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20, armor: 0, damage: 4, abilities: [] }],
    allies: [],
    playerActiveEffects: [{ effect: { type: 'stun' }, turnsRemaining: 1 }],
    combatLog: [],
    abilityCooldowns: {},
    playerActionCounts: {}
  };

  render(<CombatModal character={character} inventory={[]} initialCombatState={state} onCombatEnd={() => {}} onNarrativeUpdate={() => {}} onInventoryUpdate={() => {}} showToast={showToast} />);

  // Defend button should be disabled when stunned (there may be a couple variants in the UI; ensure at least one is disabled)
  const defendBtns = await screen.findAllByRole('button', { name: /Defend/i });
  expect(defendBtns.length).toBeGreaterThan(0);
  expect(defendBtns.some(b => b.getAttribute('disabled') !== null)).toBeTruthy();

  // Items quick button may or may not be present depending on inventory; if present ensure it's disabled
  const itemsBtn = screen.queryByRole('button', { name: /Items/i });
  if (itemsBtn) {
    expect(itemsBtn).toBeDisabled();
  }

  // Simulate attempting to click one of the Defend buttons — the showToast should be invoked
  fireEvent.click(defendBtns[0]);
  expect(showToast).toHaveBeenCalled();
  const called = showToast.mock.calls.map(c => c[0]).join(' ');
  expect(called.toLowerCase()).toContain('stun');
});