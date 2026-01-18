import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { CombatModal } from '../components/CombatModal';
import type { Character, InventoryItem } from '../types';

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
  currentTurnActor: 'player',
  turnOrder: ['player', 'enemy1'],
  enemies: [{ id: 'enemy1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20, armor: 0, damage: 4 }],
  allies: [],
  location: 'field',
  fleeAllowed: true,
  surrenderAllowed: false,
  combatLog: [],
  playerDefending: false,
  playerActiveEffects: [],
  abilityCooldowns: {},
  lastActorActions: {}
});

describe('CombatModal — in-combat equipment persistence', () => {
  it('updates player stats and calls onInventoryUpdate when equipping from the equipment modal', async () => {
    const weakWeapon: InventoryItem = { id: 'w1', name: 'Rusty Dagger', characterId: 'char1', type: 'weapon', damage: 3, quantity: 1, equipped: true, equippedBy: 'player', slot: 'weapon' } as any;
    const strongWeapon: InventoryItem = { id: 'w2', name: 'Steel Sword', characterId: 'char1', type: 'weapon', damage: 12, quantity: 1, equipped: false, equippedBy: null, slot: 'weapon' } as any;

    const initial = makeCombatState() as any;
    const mockEnd = vi.fn();
    const mockNarr = vi.fn();
    const mockToast = vi.fn();
    const onInventoryUpdate = vi.fn();

    render(
      <CombatModal
        character={character}
        inventory={[weakWeapon, strongWeapon]}
        initialCombatState={initial}
        onCombatEnd={mockEnd}
        onNarrativeUpdate={mockNarr}
        onInventoryUpdate={onInventoryUpdate}
        showToast={mockToast as any}
      />
    );

    // Confirm initial UI shows the weak weapon damage
    await waitFor(() => expect(screen.getByText(/⚔ Damage:/)).toBeTruthy());
    const dmgBefore = screen.getByText(/⚔ Damage:\s*/i).parentElement?.textContent || '';
    expect(dmgBefore).toMatch(/3|Rusty/);

    // Open Equipment modal
    const equipBtn = await screen.findByRole('button', { name: /Equipment/i });
    fireEvent.click(equipBtn);

    // Find the Steel Sword entry and its Equip button inside the equipment modal
    const steelEntry = await screen.findByText('Steel Sword');
    expect(steelEntry).toBeTruthy();

    // The list shows an explicit 'Equip' control for selectable items.
    // Be robust: find a button whose text contains the item name and an 'Equip' affordance.
    const modalRoot = steelEntry.closest('[role="dialog"]') || screen.getByText(/Equipment/i).closest('div');
    const candidateButtons = Array.from(modalRoot?.querySelectorAll('button') || []);
    const equipAction = candidateButtons.find(b => {
      const txt = (b.textContent || '').replace(/\s+/g, ' ').trim();
      return /Steel Sword/i.test(txt) && /Equip|Equipped/i.test(txt);
    }) as HTMLButtonElement | undefined;
    expect(equipAction).toBeTruthy();

    fireEvent.click(equipAction!);

    // Player stats should update to reflect the Steel Sword (damage visible in UI)
    await waitFor(() => expect(screen.getByText(/⚔ Damage:/)).toBeTruthy());
    const dmgAfterText = screen.getByText(/⚔ Damage:\s*/i).parentElement?.textContent || '';
    expect(dmgAfterText).toMatch(/12|Steel/);

    // onInventoryUpdate should have been called with an updated inventory snapshot
    await waitFor(() => expect(onInventoryUpdate).toHaveBeenCalled());
    const calledWith = onInventoryUpdate.mock.calls[0][0];
    expect(Array.isArray(calledWith)).toBeTruthy();
    const updated = (calledWith as any[]).find((i: any) => i.id === 'w2');
    expect(updated).toBeTruthy();
    expect(updated.equipped).toBe(true);

    // Previous weak weapon should be unequipped in the payload
    const prev = (calledWith as any[]).find((i: any) => i.id === 'w1');
    expect(prev).toBeTruthy();
    expect(prev.equipped).toBe(false);
  });
});
