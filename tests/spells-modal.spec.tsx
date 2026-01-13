import React from 'react';
import { render, screen } from '@testing-library/react';
import SpellsModal from '../components/SpellsModal';
import { Character } from '../types';

const lowLevelChar = { id: 'c1', name: 'Low', level: 3, perks: [], perkPoints: 10 } as Character;
const highLevelChar = { id: 'c2', name: 'High', level: 20, perks: [], perkPoints: 10 } as Character;

describe('SpellsModal empowered variant UI', () => {
  it('shows empowered variant locked for low-level characters', async () => {
    render(<SpellsModal character={lowLevelChar} onClose={() => {}} />);

    // For a spell with a base prereq (e.g., 'ice_spike' requires level 10), its empowered variant should be locked for level 3
    const locked = await screen.findAllByText(/Empowered variant locked/i);
    expect(locked.length).toBeGreaterThan(0);
  });

  it('shows empowered variant available and learn button for high-level characters', async () => {
    render(<SpellsModal character={highLevelChar} onClose={() => {}} />);

    const available = await screen.findAllByText(/Empowered variant available/i);
    expect(available.length).toBeGreaterThan(0);

    const learnButtons = screen.queryAllByText(/Learn Empowered/i);
    expect(learnButtons.length).toBeGreaterThan(0);
  });
});