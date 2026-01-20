import React from 'react';
import { render, screen } from '@testing-library/react';
import CombatModal from '../components/CombatModal';

const character = {
  id: 'char1', name: 'Hero', profileId: 'p1', race: 'Nord', gender: 'male', archetype: 'Warrior', level: 3,
  experience: 0, gold: 0, perks: [], perkPoints: 0, stats: { health: 100, magicka: 50, stamina: 100 }, skills: [],
  time: { day: 1, hour: 8, minute: 0 }, needs: { hunger: 0, thirst: 0, fatigue: 0 }, identity: '', psychology: '', breakingPoint: '', moralCode: '', allowedActions: '', forbiddenActions: '', fears: '', weaknesses: '', talents: '', magicApproach: '', factionAllegiance: '', worldview: '', daedricPerception: '', forcedBehavior: '', longTermEvolution: '', milestones: [], backstory: ''
};

const makeCombatState = () => ({
  id: 'test', active: true, turn: 1, currentTurnActor: 'ally_a1',
  turnOrder: ['player', 'enemy_e1', 'ally_a1'],
  enemies: [{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20, armor: 0, damage: 4 }],
  allies: [{ id: 'ally_a1', name: 'Buddy', level: 2, maxHealth: 30, currentHealth: 30, armor: 0, damage: 6, abilities: [{ id: 'a1', name: 'Strike' }], isCompanion: true, companionMeta: { companionId: 'c1', autoLoot: false, autoControl: false } }],
  location: 'field', fleeAllowed: true, surrenderAllowed: false, combatLog: [], playerDefending: false, playerActiveEffects: [], abilityCooldowns: {}, lastActorActions: {}
});

it('renders a dedicated Combat Log column and shows Auto-scroll and Auto-combat controls', async () => {
  const state = makeCombatState();
  render(<CombatModal character={character as any} inventory={[]} initialCombatState={state as any} onCombatEnd={() => {}} onNarrativeUpdate={() => {}} onInventoryUpdate={() => {}} showToast={() => {}} />);

  // The COMBAT LOG heading should be present and the Auto-scroll button should be available
  expect(await screen.findByText(/COMBAT LOG/i)).toBeTruthy();
  expect(screen.getByRole('button', { name: /Auto-scroll/i })).toBeTruthy();

  // Auto-combat toggle should exist and toggle persists to localStorage
  localStorage.removeItem('aetherius:autoCombat');
  const autoBtn = screen.getByText(/^Auto (ON|OFF)$/i);
  expect(autoBtn).toBeTruthy();

  // Toggle it and ensure localStorage updated
  const { fireEvent } = require('@testing-library/react');
  fireEvent.click(autoBtn);
  expect(localStorage.getItem('aetherius:autoCombat')).toBe('true');

  // Speed buttons persist selection to localStorage
  const speed2 = screen.getByText('2x');
  fireEvent.click(speed2);
  expect(localStorage.getItem('aetherius:combatSpeedMultiplier')).toBe('2');
});