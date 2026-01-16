import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CombatModal } from '../components/CombatModal';
import { audioService } from '../services/audioService';

const shortDelay = (ms = 300) => new Promise(r => setTimeout(r, ms));

describe('Combat sound selection for conjurations and allies', () => {
  beforeEach(() => {
    audioService.setDebugSfx(true);
    audioService.clearRecentSfxEvents();
  });
  afterEach(() => {
    audioService.setDebugSfx(false);
    audioService.clearRecentSfxEvents();
  });

  test('Flame conjuration ally triggers fire attack sound when acting', async () => {
    const ally = {
      id: 'summon_flame_1',
      name: 'Flame Atronach',
      type: 'elemental',
      level: 5,
      maxHealth: 30,
      currentHealth: 30,
      armor: 0,
      damage: 6,
      abilities: [{ id: 'a1', name: 'Burning Strike', type: 'melee', damage: 6, cost: 0 }],
      behavior: 'support',
      isCompanion: true,
      companionMeta: { companionId: 'summon_flame_1', autoControl: true, isSummon: true }
    } as any;

    const enemy = { id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20, armor: 0, damage: 4 } as any;

    const initialState: any = {
      active: true,
      turn: 1,
      turnOrder: ['player', ally.id, enemy.id],
      currentTurnActor: ally.id,
      enemies: [enemy],
      allies: [ally],
      combatLog: [],
      abilityCooldowns: {},
      lastActorActions: {}
    };

    const { unmount } = render(
      <CombatModal
        character={{ id: 'char1', name: 'Hero', level: 5, stats: { health: 100, magicka: 50, stamina: 100 } } as any}
        inventory={[]}
        initialCombatState={initialState}
        onCombatEnd={() => {}}
      />
    );

    await shortDelay(800);

    const events = audioService.getRecentSfxEvents();
    const found = events.find(e => e.effect === 'attack_fire');
    // Accept either play or skip (in environments where file is missing)
    expect(!!found).toBe(true);

    unmount();
  });

  test('Player cast fire spell triggers fire impact sound when casting', async () => {
    const charWithDestruction: any = {
      id: 'char_fire',
      name: 'Pyromancer',
      level: 20,
      stats: { health: 100, magicka: 200, stamina: 100 },
      skills: [{ name: 'Destruction', level: 30 }]
    };

    const enemy = { id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20, armor: 0, damage: 4 } as any;

    const initialState: any = {
      active: true,
      turn: 1,
      turnOrder: ['player', enemy.id],
      currentTurnActor: 'player',
      enemies: [enemy],
      allies: [],
      combatLog: [],
      abilityCooldowns: {},
      lastActorActions: {}
    };

    const { findAllByText, unmount } = render(
      <CombatModal
        character={charWithDestruction}
        inventory={[]}
        initialCombatState={initialState}
        onCombatEnd={() => {}}
      />
    );

    // Wait for abilities to render and find Flames
    const flameButtons = await findAllByText(/Flames/i, {}, { timeout: 2000 });
    expect(flameButtons.length).toBeGreaterThan(0);

    // Click the Flames ability to cast
    flameButtons[0].click();

    await shortDelay(800);

    const events = audioService.getRecentSfxEvents();
    const found = events.find(e => e.effect === 'spell_impact_fire' || e.effect === 'attack_fire');
    expect(!!found).toBe(true);

    unmount();
  });
});
