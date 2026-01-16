import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LevelBadge from '../components/LevelBadge';

describe('LevelBadge pulse behavior', () => {
  it('responds to global levelUpPulse event by toggling data-pulsing', async () => {
    render(<LevelBadge level={5} />);
    const el = screen.getByRole('img', { name: /Level 5/i });

    // Initially not pulsing
    expect(el).toHaveAttribute('data-pulsing', 'false');

    // Dispatch global event
    window.dispatchEvent(new CustomEvent('levelUpPulse', { detail: { level: 6 } }));

    // Now should pulse
    await waitFor(() => expect(el).toHaveAttribute('data-pulsing', 'true'));

    // Eventually it should stop pulsing (timeout 2s)
    await waitFor(() => expect(el).toHaveAttribute('data-pulsing', 'false'), { timeout: 2000 });
  });
});
