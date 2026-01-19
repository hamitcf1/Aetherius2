import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MapPage from '../components/MapPage';
import { describe, it, expect, vi } from 'vitest';

const character = { id: 'c1', name: 'Hero', level: 10 } as any;

describe('MapPage', () => {
  it('calls onStartMission with full mission object when accepting a mission', async () => {
    const onStartMission = vi.fn();
    render(<MapPage character={character} onStartMission={onStartMission} /> as any);

    // Open the Missions panel
    const missionsTab = screen.getByText('Missions');
    fireEvent.click(missionsTab);

    // Click a known mission from MAP_MISSIONS
    const mission = await screen.findByText('Clear the Roads');
    fireEvent.click(mission);

    // Now click the Accept Mission button in the details panel
    const accept = await screen.findByText('Accept Mission');
    fireEvent.click(accept);

    expect(onStartMission).toHaveBeenCalled();
    const arg = onStartMission.mock.calls[0][0];
    expect(arg).toBeDefined();
    expect(arg.id).toBe('mission_clear_bandits');
    expect(arg.name).toBe('Clear the Roads');
    expect(arg.objective).toBeDefined();
  });
});