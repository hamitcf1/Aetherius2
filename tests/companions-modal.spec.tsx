import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanionsModal from '../components/CompanionsModal';

describe('CompanionsModal component', () => {
  it('renders race dropdown and allows selecting a race when recruiting', async () => {
    const onAdd = vi.fn();
    render(
      <CompanionsModal
        open={true}
        onClose={() => {}}
        companions={[]}
        onAdd={onAdd}
        onUpdate={() => {}}
        onRemove={() => {}}
      />
    );

    const nameInput = screen.getByPlaceholderText('Name');
    await userEvent.type(nameInput, 'TestComp');

    // Open race dropdown (current selection displayed - starts as 'Nord')
    const raceButton = screen.getByRole('button', { name: /Nord|Race/i });
    await userEvent.click(raceButton);

    // Select Khajiit
    const option = await screen.findByRole('button', { name: /Khajiit/i });
    await userEvent.click(option);

    const recruit = screen.getByRole('button', { name: /recruit/i });
    await userEvent.click(recruit);

    expect(onAdd).toHaveBeenCalledTimes(1);
    const added = onAdd.mock.calls[0][0];
    expect(added.name).toBe('TestComp');
    expect(added.race).toBe('Khajiit');
  });

  it('renders name input with theme-consistent style', async () => {
    render(<CompanionsModal open={true} onClose={() => {}} companions={[]} onAdd={() => {}} onUpdate={() => {}} onRemove={() => {}} />);

    const nameInput = await screen.findByPlaceholderText('Name');
    expect(nameInput).toHaveClass('bg-skyrim-paper/20');
    expect(nameInput).toHaveClass('text-skyrim-text');
  });
});