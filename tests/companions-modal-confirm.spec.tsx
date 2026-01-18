import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import CompanionsModal from '../components/CompanionsModal';

const companion = { id: 'c1', name: 'Buddy', race: 'Nord', class: 'Follower', level: 2, damage: 6, armor: 2, loyalty: 50, isAnimal: false } as any;

describe('CompanionsModal — confirm dismissal', () => {
  it('shows confirmation when dismissing and calls onRemove after confirm', async () => {
    const onRemove = vi.fn();
    render(<CompanionsModal open={true} onClose={() => {}} companions={[companion]} onAdd={() => {}} onUpdate={() => {}} onRemove={onRemove} inventory={[]} />);

    const trash = await screen.findByTitle('Dismiss');
    fireEvent.click(trash);

    // Confirm dialog should appear
    await waitFor(() => expect(screen.getByText(/Dismiss Companion/i)).toBeInTheDocument());
    expect(screen.getByText(/Are you sure you want to dismiss/i)).toBeTruthy();

    // Confirm
    const confirm = screen.getByRole('button', { name: /Dismiss/i });
    fireEvent.click(confirm);

    await waitFor(() => expect(onRemove).toHaveBeenCalledWith('c1'));
  });
});
