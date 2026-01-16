import React from 'react';
import { render, screen } from '@testing-library/react';
import LevelBadge from '../components/LevelBadge';

describe('LevelBadge', () => {
  it('renders level and aria label', () => {
    render(<LevelBadge level={1} />);
    expect(screen.getByRole('img', { name: /Seviye 1/i })).toBeInTheDocument();
  });

  it('shows tier label for high level', () => {
    render(<LevelBadge level={27} />);
    expect(screen.getByTitle(/Rütbe 30/i)).toBeInTheDocument();
  });
});
