import React from 'react';
import { render, screen } from '@testing-library/react';
import SnowEffect from '../components/SnowEffect';

describe('SnowEffect (DOM mode)', () => {
  test('renders rain particles when weatherType=rain and mouse interaction disabled', () => {
    render(<SnowEffect settings={{ intensity: 'normal', enableMouseInteraction: false }} weatherType="rain" />);
    const container = document.querySelector('.rain-container');
    expect(container).toBeTruthy();
    const drops = container?.querySelectorAll('.raindrop') || [];
    expect(drops.length).toBeGreaterThan(0);
  });

  test('renders snow particles when weatherType=snow and mouse interaction disabled', () => {
    render(<SnowEffect settings={{ intensity: 'normal', enableMouseInteraction: false }} weatherType="snow" />);
    const container = document.querySelector('.snow-container');
    expect(container).toBeTruthy();
    const flakes = container?.querySelectorAll('.snowflake') || [];
    expect(flakes.length).toBeGreaterThan(0);
  });
});
