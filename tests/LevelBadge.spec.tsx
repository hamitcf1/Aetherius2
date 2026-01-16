import React from 'react';
import { render, screen } from '@testing-library/react';
import LevelBadge from '../components/LevelBadge';

describe('LevelBadge', () => {
  it('renders level and aria label', () => {
    render(<LevelBadge level={1} />);
    expect(screen.getByRole('img', { name: /Level 1/i })).toBeInTheDocument();
  });

  it('shows correct title for high level', () => {
    render(<LevelBadge level={27} />);
    expect(screen.getByTitle(/Level 27/i)).toBeInTheDocument();
  });
});
