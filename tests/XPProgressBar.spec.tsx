import React from 'react';
import { render, screen } from '@testing-library/react';
import XPProgressBar from '../components/XPProgressBar';

describe('XPProgressBar', () => {
  it('renders progress with aria attributes', () => {
    render(<XPProgressBar current={50} required={200} total={1250} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemax', '200');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText(/50 \/ 200 XP/)).toBeInTheDocument();
  });
});
