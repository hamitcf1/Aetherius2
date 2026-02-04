import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PerkTreeModal from '../components/PerkTreeModal';
import { Character } from '../types';
import { vi } from 'vitest';

test('PerkTreeModal expand/collapse all buttons work and default to expanded', async () => {
  const character = { id: 'c1', name: 'Tester', level: 1, perks: [], perkPoints: 0 } as Character;
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  render(<PerkTreeModal open={true} onClose={onClose} character={character} onConfirm={onConfirm} /> as any);

  // Default: 'Toughness' should be visible (Attributes expanded)
  const tough = await screen.findByText(/Toughness/i);
  expect(tough).toBeTruthy();

  // Collapse all and ensure 'Toughness' is not visible
  const collapseBtn = screen.getByText(/Collapse All/i);
  fireEvent.click(collapseBtn);
  expect(screen.queryByText(/Toughness/i)).toBeNull();

  // Expand all and ensure 'Toughness' is visible again
  const expandBtn = screen.getByText(/Expand All/i);
  fireEvent.click(expandBtn);
  const toughAgain = await screen.findByText(/Toughness/i);
  expect(toughAgain).toBeTruthy();
});