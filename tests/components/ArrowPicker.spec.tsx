import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ArrowPicker from '../../components/ArrowPicker';

describe('ArrowPicker', () => {
  it('calls onChoose with fire_arrows when Fire clicked', () => {
    const onClose = jest.fn();
    const onChoose = jest.fn();
    const { getByText } = render(<ArrowPicker open={true} onClose={onClose} onChoose={onChoose} />);
    fireEvent.click(getByText('🔥 Fire'));
    expect(onChoose).toHaveBeenCalledWith('fire_arrows');
  });
});