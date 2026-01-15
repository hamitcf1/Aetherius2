import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { SparkParticles } from '../components/BlacksmithModal';

// Mock requestAnimationFrame for deterministic behavior
beforeAll(() => {
  jest.useFakeTimers && jest.useFakeTimers();
});

afterEach(() => {
  cleanup();
  jest.runOnlyPendingTimers && jest.runOnlyPendingTimers();
});

describe('SparkParticles', () => {
  it('clears sparks on cleanup to avoid frozen particles', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    const rectMock = { left: 100, top: 100, width: 40, height: 20 };
    // @ts-ignore
    button.getBoundingClientRect = () => rectMock;

    const ref = { current: button } as any;

    const { unmount } = render(<SparkParticles active={true} buttonRef={ref} /> as any);
    // Simulate some time passing for animation to start
    jest.advanceTimersByTime(100);

    // Unmount should trigger cleanup which clears sparks
    unmount();

    // Query DOM for any spark elements (they are divs with fixed pos)
    const sparks = document.querySelectorAll('div[style*="position: fixed"]');
    expect(sparks.length).toBe(0);
  });

  it('does not freeze when toggled rapidly', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    const rectMock = { left: 50, top: 50, width: 30, height: 30 };
    // @ts-ignore
    button.getBoundingClientRect = () => rectMock;
    const ref = { current: button } as any;

    const { rerender, unmount } = render(<SparkParticles active={false} buttonRef={ref} /> as any);

    // Rapidly toggle on/off several times
    rerender(<SparkParticles active={true} buttonRef={ref} /> as any);
    jest.advanceTimersByTime(50);
    rerender(<SparkParticles active={false} buttonRef={ref} /> as any);
    jest.advanceTimersByTime(50);
    rerender(<SparkParticles active={true} buttonRef={ref} /> as any);
    jest.advanceTimersByTime(50);

    // Now unmount and ensure no sparks remain
    unmount();
    const sparks = document.querySelectorAll('div[style*="position: fixed"]');
    expect(sparks.length).toBe(0);
  });
});