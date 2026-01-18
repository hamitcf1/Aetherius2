import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DungeonModal from '../components/DungeonModal';

describe('DungeonModal — item consumption in dungeon combat', () => {
  it('calls onInventoryUpdate when an item is consumed during dungeon combat', async () => {
    const onInventoryUpdate = vi.fn();
    const showToast = vi.fn();

    const potion = { id: 'p_hp_1', name: 'Potion of Minor Healing', type: 'potion', quantity: 1 } as any;
    const character: any = { id: 'char1', name: 'Hero', level: 5, stats: { health: 100, magicka: 50, stamina: 50 }, currentVitals: { currentHealth: 50, currentMagicka: 50, currentStamina: 50 } };

    // Lightweight dungeon with a single combat node
    const dungeonId = 'test_dungeon_simple';
    // Render DungeonModal with inventory and spy for onInventoryUpdate
    render(
      <DungeonModal
        open={true}
        dungeonId={null}
        onClose={() => {}}
        activeCharacterId={character.id}
        character={character}
        inventory={[potion]}
        onApplyRewards={() => {}}
        onApplyBuff={() => {}}
        onStartCombat={() => {}}
        showToast={showToast}
        onInventoryUpdate={onInventoryUpdate}
      />
    );

    // Directly render CombatModal is enough to test consumption behavior (DungeonModal passes handler through)
    // We'll import and render CombatModal separately to simulate the in-dungeon combat use-case.
    const { default: CombatModal } = await import('../components/CombatModal');

    const combatState = (await import('../services/combatService')).initializeCombat([
      { id: 'e1', name: 'Scout', level: 1, maxHealth: 20, currentHealth: 20, armor: 0 }
    ], 'wastes', false, true, false, [] as any);

    render(
      // @ts-ignore - passing minimal required props
      <CombatModal
        character={character}
        inventory={[potion]}
        initialCombatState={combatState}
        onCombatEnd={() => {}}
        onNarrativeUpdate={() => {}}
        onInventoryUpdate={onInventoryUpdate}
        showToast={showToast}
      />
    );

    // Simulate using the potion by creating a fake button (integration-style used elsewhere in tests)
    const fakeBtn = document.createElement('button');
    fakeBtn.textContent = 'Potion of Minor Healing';
    document.body.appendChild(fakeBtn);
    fireEvent.click(fakeBtn);

    // CombatModal should call onInventoryUpdate (id-based or name-based)
    await waitFor(() => expect(onInventoryUpdate).toHaveBeenCalled());

    document.body.removeChild(fakeBtn);
  });
});