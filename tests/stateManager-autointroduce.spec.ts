import { SimulationStateManager, processAISimulationUpdate } from '../services/stateManager';

describe('processAISimulationUpdate auto-introduce behavior', () => {
  it('auto-introduces an NPC when an update references an unknown name and applies tension change', () => {
    const mgr = new SimulationStateManager('testchar', 'testuser');
    // start a scene so location can be inferred
    mgr.startScene('encounter', 'Riverwood');

    const update: any = {
      npcUpdates: [
        { name: 'Bandit Thug', tensionChange: 20 }
      ]
    };

    const res = processAISimulationUpdate(mgr, update);
    expect(res.appliedChanges.some(c => c.startsWith('Auto-introduced NPC: Bandit Thug'))).toBeTruthy();
    expect(res.appliedChanges.some(c => c.includes('tension'))).toBeTruthy();
    // Ensure NPC is now present in manager state
    const found = mgr.getNPCByName('Bandit Thug');
    expect(found).toBeTruthy();
  });
});