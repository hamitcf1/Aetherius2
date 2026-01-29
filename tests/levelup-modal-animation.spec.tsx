import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LevelUpModal from '../components/LevelUpModal';
import { vi } from 'vitest';
import { audioService } from '../services/audioService';

test('Chest animation is skippable and reveals items', async () => {
  const items = [{ id: 'i1', name: 'Sword of Testing', type: 'weapon', quantity: 1, rarity: 'rare' }, { id: 'i2', name: 'Potion of Mocks', type: 'potion', quantity: 1, rarity: 'common' }];
  const mockOnOpen = vi.fn(() => Promise.resolve(items));
  const confirm = vi.fn();

  // Spy audio
  const playSpy = vi.spyOn(audioService, 'playSoundEffect').mockImplementation(() => undefined as any);

  render(<LevelUpModal open={true} onClose={() => {}} onConfirm={confirm as any} onOpenChest={mockOnOpen as any} characterName="Tester" newLevel={10} />);

  const chestSelector = screen.getByRole('button', { name: /Open Chest/i });
  await userEvent.click(chestSelector);

  // Click inner open button to actually start chest animation
  const innerOpen = screen.getByTestId('levelup-open-chest');
  await waitFor(() => expect(screen.getByTestId('levelup-open-chest')).toBeEnabled(), { timeout: 1000 });
  await userEvent.click(innerOpen);

  // Build stage visible (either on-button text or ARIA live text)
  await waitFor(() => expect(screen.queryAllByText(/Preparing…|Building momentum/i).length).toBeGreaterThan(0));
  expect(playSpy).toHaveBeenCalledWith('chest_build');

  // ensure onOpen was called and inspect its return value
  await waitFor(() => expect(mockOnOpen).toHaveBeenCalled(), { timeout: 2000 });

  // Skip reveal straight away
  const skipBtn = screen.getByRole('button', { name: /Skip chest reveal|Skip/i });
  await userEvent.click(skipBtn);

  // Items should be visible and audio skip called
  await waitFor(() => expect(playSpy).toHaveBeenCalledWith('chest_skip'), { timeout: 2000 });
  await waitFor(() => expect(screen.getByText(/Sword of Testing/i)).toBeTruthy(), { timeout: 2000 });
  const itemEl = screen.getByText(/Sword of Testing/i);
  expect(itemEl).toBeTruthy();

  // Confirm should include chest reward
  const confirmBtn = screen.getByRole('button', { name: /Confirm/i });
  await userEvent.click(confirmBtn);
  expect(confirm).toHaveBeenCalled();
  const payload = (confirm as any).mock.calls[0][0];
  expect(payload.reward.type).toBe('chest');
  expect(payload.reward.items).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Sword of Testing' })]));

  playSpy.mockRestore();
});