import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock dungeon lookup to return a minimal dungeon with a combat node
vi.mock('../../data/dungeonDefinitions', () => ({
  getDungeonById: (id: string) => ({
    id: id,
    name: 'Test Cave',
    location: 'cave',
    startNodeId: 'n1',
    minimumLevel: 1,
    recommendedLevel: 1,
    nodes: [
      { id: 'n1', type: 'start', connections: ['n2'] },
      { id: 'n2', type: 'combat', connections: ['n3'], enemies: [{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 12, damage: 4, armor: 0 }] }
    ]
  })
}));

import DungeonModal from '../components/DungeonModal';
import LocalizationProvider from '../services/localization';
import type { Companion, Character } from '../types';

const character = { id: 'char1', name: 'Hero', profileId: 'p1', race: 'Nord', gender: 'male', archetype: 'Warrior', level: 3, stats: { health: 100, magicka: 50, stamina: 100 }, time: { day: 1, hour: 8, minute: 0 }, needs: { hunger: 0, thirst: 0, fatigue: 0 } } as Character;
const companion: Companion = { id: 'c1', name: 'Buddy', characterId: 'char1', level: 2, health: 30, maxHealth: 30, damage: 6, armor: 0, behavior: 'follow', autoLoot: false, autoControl: true } as any;

describe('DungeonModal — companion in dungeon combat', () => {
  it('includes companions in dungeon combat initialization and shows them in the CombatModal', async () => {
    render(
      <LocalizationProvider>
        <DungeonModal
          open={true}
          dungeonId={'d_test'}
          activeCharacterId={'char1'}
          character={character}
          companions={[companion]}
          inventory={[]}
          onApplyRewards={() => {}}
          onApplyBuff={() => {}}
          showToast={() => {}}
          onInventoryUpdate={() => {}}
        />
      </LocalizationProvider>
    );

    // Wait for the dungeon map to render and then click the combat node (n2)
    const combatNode = await screen.findByText(/Combat|Bandit/i);
    // Click the combat node (closest clickable container)
    fireEvent.click(combatNode);

    // The CombatModal should appear and list the companion's name
    await waitFor(() => expect(screen.getByText(/Buddy/)).toBeTruthy());
  });
});
