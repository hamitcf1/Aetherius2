import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortSelector } from '../components/GameFeatures';

describe('SortSelector', () => {
  it('calls onSelect with key:asc on first selection and toggles to key:desc on second selection when allowDirection is true', async () => {
    const onSelect = vi.fn();
    render(<SortSelector currentSort={'name:asc'} allowDirection={true} onSelect={onSelect} options={[{id: 'name', label: 'Name'}, {id: 'damage', label: 'Damage'}]} />);

    const { rerender } = render(<SortSelector currentSort={'name:asc'} allowDirection={true} onSelect={onSelect} options={[{id: 'name', label: 'Name'}, {id: 'damage', label: 'Damage'}]} />);

    const openButtons = screen.getAllByRole('button', { name: /Name/i });
    const openBtn = openButtons[0];
    await userEvent.click(openBtn);

    const damageOption = await screen.findByRole('button', { name: /Damage/i });
    await userEvent.click(damageOption);

    expect(onSelect).toHaveBeenCalledWith('damage:asc');

    // Simulate parent updating prop to reflect the new sort
    rerender(<SortSelector currentSort={'damage:asc'} allowDirection={true} onSelect={onSelect} options={[{id: 'name', label: 'Name'}, {id: 'damage', label: 'Damage'}]} />);

    // open again and click the same option - should toggle to desc
    const openButtons2 = screen.getAllByRole('button', { name: /Damage/i });
    const openBtn2 = openButtons2[0];
    await userEvent.click(openBtn2);
    // find the dropdown option (there may be multiple buttons with the same name)
    const allDamageButtons = await screen.findAllByRole('button', { name: /Damage/i });
    const damageOption2 = allDamageButtons.reverse().find(b => b.closest('.absolute') || b.parentElement?.className.includes('absolute')) || allDamageButtons[0];
    await userEvent.click(damageOption2 as HTMLElement);

    expect(onSelect).toHaveBeenCalledWith('damage:desc');
  });

  it('toggle direction button flips current direction', async () => {
    const onSelect = vi.fn();
    render(<SortSelector currentSort={'name:asc'} allowDirection={true} onSelect={onSelect} options={[{id: 'name', label: 'Name'}, {id: 'damage', label: 'Damage'}]} />);

    const toggleBtn = screen.getByRole('button', { name: /toggle-sort-direction/i });
    await userEvent.click(toggleBtn);
    expect(onSelect).toHaveBeenCalledWith('name:desc');
  });
});
