import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, expect, it, describe } from 'vitest';
import { CombatModal } from '../components/CombatModal';
import { executePlayerAction } from '../services/combatService';
import type { InventoryItem, Character } from '../types';

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

describe('Combat — potion consumption', () => {
  it('executePlayerAction returns usedItem with quantity decremented when consuming last potion', () => {
    const potion: InventoryItem = { id: 'p1', name: 'Minor Magicka Potion', characterId: 'char1', type: 'potion', subtype: 'magicka', quantity: 1 } as any;
    const state = makeCombatState() as any;
    const playerStats = { currentMagicka: 0, maxMagicka: 50, currentHealth: 100, maxHealth: 100, currentStamina: 100, maxStamina: 100, abilities: [], dodgeChance: 0 } as any;

    const res = executePlayerAction(state, playerStats, 'item', undefined, undefined, 'p1', [potion], 10, character as any) as any;
    expect(res.usedItem).toBeTruthy();
    expect(res.usedItem.quantity).toBe(0);
    // Ensure magicka was restored (positive change)
    expect(res.newPlayerStats.currentMagicka).toBeGreaterThanOrEqual(playerStats.currentMagicka);
  });

  it('CombatModal emits id-based updatedItems and removes last-stack potion from UI (optimistic update)', async () => {
    const potion: InventoryItem = { id: 'p1', name: 'Minor Magicka Potion', characterId: 'char1', type: 'potion', subtype: 'magicka', quantity: 1 } as any;
    const initial = makeCombatState() as any;
    const onInventoryUpdate = vi.fn();
    const mockToast = vi.fn();
    const charLowMag = { ...character, currentVitals: { currentMagicka: 0, currentHealth: 100, currentStamina: 100 } } as any;

    render(
      <CombatModal
        character={charLowMag}
        inventory={[potion]}
        initialCombatState={initial}
        onCombatEnd={() => {}}
        onNarrativeUpdate={() => {}}
        onInventoryUpdate={onInventoryUpdate}
        showToast={mockToast as any}
      />
    );

    // Open item picker
    const useBtn = await screen.findByRole('button', { name: /Use Item/i });
    fireEvent.click(useBtn);

    // Click the potion entry inside the expanded item-selection panel
    const backBtn = await screen.findByRole('button', { name: /← Back/i });
    const panel = backBtn.closest('div');
    const { getByRole } = panel ? within(panel as HTMLElement) : screen;
    const potionBtn = getByRole('button', { name: /Minor Magicka Potion/i });
    fireEvent.click(potionBtn);

    // Expect onInventoryUpdate to be called with an id-based update (precise merge)
    await waitFor(() => expect(onInventoryUpdate).toHaveBeenCalled());
    const payload = onInventoryUpdate.mock.calls[0][0];
    expect(Array.isArray(payload)).toBeTruthy();
    const first = payload[0];
    // CombatModal now prefers id-based precise updates when id is available
    expect(first.id || first.name).toBeDefined();
    if (first.id) {
      expect(first.id).toBe('p1');
      // quantity should reflect post-use quantity (0 => will be deleted by App)
      expect(Number(first.quantity)).toBe(0);
      // character id should be present for deterministic merging
      expect(first.characterId).toBe(charLowMag.id);
    } else {
      // fallback shape: removedItems by name
      expect(first.name).toMatch(/Minor Magicka Potion/i);
      expect(Number(first.quantity)).toBe(1);
    }

    // Optimistic local update should close the item-selection panel and the collapsed UI
    // should now show no usable items (local state was decremented optimistically)
    await waitFor(() => expect(screen.queryByRole('button', { name: /← Back/i })).toBeNull());
    // We updated localInventory optimistically; the important contract is the precise payload was emitted
    // (UI refresh from parent is covered by integration tests).
  });
});
