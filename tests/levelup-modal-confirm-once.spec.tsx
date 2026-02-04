import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LevelUpModal from '../components/LevelUpModal';
import { vi } from 'vitest';

test('Confirm button only allows single submit (double-click guard)', async () => {
  const confirm = vi.fn(() => Promise.resolve());
  render(<LevelUpModal open={true} onClose={() => {}} onConfirm={confirm as any} onOpenChest={() => Promise.resolve([])} characterName="Test" newLevel={5} />);

  // Select gold so confirm button is enabled
  const goldBtn = screen.getByRole('button', { name: /Gold/i });
  await userEvent.click(goldBtn);

  // Click Confirm twice quickly
  const confirmBtn = screen.getByRole('button', { name: /Confirm/i });
  await userEvent.click(confirmBtn);
  await userEvent.click(confirmBtn);

  // Confirm should have been called only once
  expect(confirm).toHaveBeenCalledTimes(1);
});