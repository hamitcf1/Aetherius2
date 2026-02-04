import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LevelUpModal from '../components/LevelUpModal';
import { vi } from 'vitest';

test('LevelUpModal chest open shows animation and displays items', async () => {
  const items = [{ id: 'i1', name: 'Iron Sword', type: 'weapon', quantity: 1, rarity: 'common' }];
  const mockOnOpen = vi.fn(() => Promise.resolve(items));

  const confirm = vi.fn();
  // Provide initialChestItems so the modal renders as if the chest was already opened
  render(<LevelUpModal open={true} onClose={() => {}} onConfirm={confirm as any} onOpenChest={mockOnOpen as any} characterName="Test" newLevel={5} initialChestItems={items} />);

  // First select the 'Open Chest' reward option so the chest area shows up
  const rewardSelectorBtn = screen.getByRole('button', { name: /Open Chest/i });
  await userEvent.click(rewardSelectorBtn);

  // Opening indicator or opened confirmation should be visible (since we prefilled items)
  await waitFor(() => expect(screen.getByText(/Chest opened!/i) || screen.getByText(/Chest: Opened/i)).toBeTruthy());

  // The chest list should mention it's pending add
  expect(screen.getByText(/Will be added on confirm/i)).toBeTruthy();

  // Confirm the level-up which should include the chest reward
  const confirmBtn = screen.getByRole('button', { name: /Confirm/i });
  await userEvent.click(confirmBtn);

  expect(confirm).toHaveBeenCalled();
  const payload = (confirm as any).mock.calls[0][0];
  expect(payload.reward.type).toBe('chest');
  expect(payload.reward.items).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Iron Sword' })]));
});