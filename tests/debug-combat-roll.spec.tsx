import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CombatModal } from '../components/CombatModal';

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
};

const makeCombatState = () => ({
  id: 'test',
  active: true,
  turn: 1,
  currentTurnActor: 'ally_a1',
  turnOrder: ['player', 'enemy_e1', 'ally_a1'],
  enemies: [{ id: 'e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20, armor: 0, damage: 4 }],
  allies: [{ id: 'ally_a1', name: 'Buddy', level: 2, maxHealth: 30, currentHealth: 30, armor: 0, damage: 6, abilities: [{ id: 'a1', name: 'Strike' }], isCompanion: true, companionMeta: { companionId: 'c1', autoLoot: false, autoControl: false } }],
  location: 'field',
  fleeAllowed: true,
  surrenderAllowed: false,
  combatLog: [],
  playerDefending: false,
  playerActiveEffects: [],
  abilityCooldowns: {},
  lastActorActions: {}
});

it('debug: shows where Roll: is coming from', async () => {
  const offensiveState = makeCombatState();
  offensiveState.allies[0].abilities = [{ id: 'a_off', name: 'Rend', type: 'melee', damage: 12 }];
  const mockShowToast = vi.fn();

  render(<CombatModal character={character as any} inventory={[]} initialCombatState={offensiveState as any} onCombatEnd={() => {}} onNarrativeUpdate={() => {}} onInventoryUpdate={() => {}} showToast={mockShowToast} />);

  await screen.findByText(/Control Buddy/i);

  const alliesHeader = screen.getByText('ALLIES');
  const { within } = require('@testing-library/dom');
  const alliesPanel = alliesHeader.closest('div') as HTMLElement;
  const allyInPanel = within(alliesPanel).getAllByText('Buddy').find(n => n.tagName !== 'BUTTON') as HTMLElement;

  fireEvent.click(allyInPanel);

  const rendButtons = screen.getAllByText('Rend');
  const btn = rendButtons.find(n => n.tagName === 'BUTTON') as HTMLElement || rendButtons[0] as HTMLElement;
  fireEvent.click(btn);

  await waitFor(() => expect(mockShowToast).toHaveBeenCalled());

  // Dump any DOM nodes that contain 'Roll:'
  const matches = Array.from(document.querySelectorAll('*')).filter(el => /Roll:/i.test(el.textContent || '')).map(el => ({ tag: el.tagName, outer: el.outerHTML.slice(0,400) }));
  // eslint-disable-next-line no-console
  console.log('DEBUG: nodes containing Roll:', matches);

  // Also dump combat log entries from the component state (best-effort)
  const logs = Array.from(document.querySelectorAll('[data-testid="combat-log-entry"]')).map(el => el.textContent);
  // eslint-disable-next-line no-console
  console.log('DEBUG: combat-log entries elements:', logs.slice(0,10));

  expect(mockShowToast).toHaveBeenCalled();
});