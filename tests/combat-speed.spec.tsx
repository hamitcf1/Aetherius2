import { render, screen, fireEvent } from '@testing-library/react';
import CombatModal from '../components/CombatModal';

const makeCombatState = () => ({
  id: 'test',
  active: true,
  turn: 1,
  currentTurnActor: 'player',
  turnOrder: ['player', 'enemy_e1'],
  enemies: [{ id: 'enemy_e1', name: 'Bandit', level: 1, maxHealth: 20, currentHealth: 20, armor: 0, damage: 4 }],
  allies: [],
  location: 'field',
  fleeAllowed: true,
  surrenderAllowed: true,
  combatLog: [],
  playerDefending: false,
  abilityCooldowns: {},
  lastActorActions: {}
});

describe('Combat speed controls', () => {
  it('renders speed buttons and persists selection', () => {
    // Clear localStorage to avoid noise
    localStorage.removeItem('aetherius:combatSpeedMultiplier');

    const char = { id: 'c1', name: 'Hero', level: 1, profileId: 'p1', race: 'Nord', gender: 'male', archetype: 'Warrior', stats: { health: 100, magicka: 50, stamina: 100 }, skills: [], time: { day: 1, hour: 8, minute: 0 }, needs: { hunger: 0, thirst: 0, fatigue: 0 } } as any;
    const initialState = makeCombatState();

    render(<CombatModal character={char} inventory={[]} initialCombatState={initialState as any} onCombatEnd={() => {}} onNarrativeUpdate={() => {}} onInventoryUpdate={() => {}} showToast={() => {}} />);

    const btn1 = screen.getByRole('button', { name: /1x/i });
    const btn2 = screen.getByRole('button', { name: /2x/i });
    const btn5 = screen.getByRole('button', { name: /5x/i });

    expect(btn1).toBeTruthy();
    expect(btn2).toBeTruthy();
    expect(btn5).toBeTruthy();

    // default should be 1x pressed
    expect(btn1.getAttribute('aria-pressed')).toBe('true');

    // click 5x
    fireEvent.click(btn5);
    expect(btn5.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('aetherius:combatSpeedMultiplier')).toBe('5');

    // click 2x
    fireEvent.click(btn2);
    expect(btn2.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('aetherius:combatSpeedMultiplier')).toBe('2');
  });
});