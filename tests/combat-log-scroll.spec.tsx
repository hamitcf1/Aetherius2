import React from 'react';
import { render, screen } from '@testing-library/react';
import { CombatModal } from '../components/CombatModal';

test('combat log area is constrained for scrolling (min-h-0 present)', () => {
  // Minimal character stub to keep the test self-contained
  const character = {
    id: 'char1',
    profileId: 'p1',
    name: 'Hero',
    race: 'Nord',
    gender: 'male',
    archetype: 'Warrior',
    level: 1,
    experience: 0,
    gold: 0,
    perks: [],
    stats: { health: 100, magicka: 50, stamina: 50 },
    skills: [],
    time: { day: 1, hour: 0, minute: 0 },
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
    backstory: '',
    lastPlayed: Date.now()
  } as any;
  const initial = { turn: 1, combatLog: [], enemies: [], allies: [], abilityCooldowns: {}, abilityCooldownsEndOfTurn: {}, abilityCooldownsStartOfTurn: {} } as any;
  const { container } = render(
    <CombatModal
      character={character}
      inventory={[]}
      initialCombatState={initial}
      onCombatEnd={() => {}}
      onNarrativeUpdate={() => {}}
      onInventoryUpdate={() => {}}
      showToast={() => {}}
    />
  );

  // find center column: should have min-h-0 to allow child overflow
  const center = container.querySelector('.w-full.lg\\:w-1\\/2');
  expect(center).toBeTruthy();
  expect(center?.className).toMatch(/min-h-0/);

  // find enemies container and assert it uses flex-col and min-h-0
  const enemies = container.querySelector('.bg-stone-900\\/40.rounded-lg.p-4');
  expect(enemies).toBeTruthy();
  expect(enemies?.className).toMatch(/flex/);
  expect(enemies?.className).toMatch(/min-h-0/);
});