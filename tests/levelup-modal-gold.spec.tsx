import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LevelUpModal from '../components/LevelUpModal';
import { computeGoldReward } from '../services/levelUpRewards';
import { vi } from 'vitest';

test('Gold selection shows exact amount and enables confirm', async () => {
  const confirm = vi.fn();
  render(<LevelUpModal open={true} onClose={() => {}} onConfirm={confirm as any} onOpenChest={() => Promise.resolve([])} characterName="Test" newLevel={5} />);

  const goldBtn = screen.getByRole('button', { name: /Gold/i });
  await userEvent.click(goldBtn);

  // computed amount should appear
  const expected = computeGoldReward(5);
  expect(screen.getByText(new RegExp(String(expected)))).toBeTruthy();

  // Confirm should be actionable (not disabled by chest missing)
  const confirmBtn = screen.getByRole('button', { name: /Confirm/i });
  await userEvent.click(confirmBtn);

  expect(confirm).toHaveBeenCalled();
  const payload = (confirm as any).mock.calls[0][0];
  expect(payload.reward.type).toBe('gold');
  expect(payload.reward.amount).toBe(expected);
});

test('Chest preview shows available rarities based on level', async () => {
  const confirm = vi.fn();
  render(<LevelUpModal open={true} onClose={() => {}} onConfirm={confirm as any} onOpenChest={() => Promise.resolve([])} characterName="Test" newLevel={5} />);

  const chestBtn = screen.getByRole('button', { name: /Open Chest/i });
  await userEvent.click(chestBtn);

  const preview = screen.getByTestId('chest-preview');
  expect(preview).toBeTruthy();
  expect(preview.textContent).toMatch(/common/);
  expect(preview.textContent).toMatch(/uncommon/);
});