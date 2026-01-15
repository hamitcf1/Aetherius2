import { describe, it, expect, beforeEach, afterEach } from 'vitest';
describe('demo.simulateCombat fixed enemy', () => {
  beforeEach(() => {
    // Minimal fake app context used by simulateCombat
    global.window = global.window || {};
    global.window.app = {
      characters: [{ id: 'char_demo', name: 'Tester', level: 3, stats: { health: 100, stamina: 80, strength: 12 } }],
      currentCharacterId: 'char_demo',
      handleGameUpdate: () => {},
      setActiveTab: () => {}
    } as any;

    // Require console-demo after window.app exists so it can register demo functions
    // Use require to ensure it's loaded in the test environment
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('../console-demo.js');
    } catch (e) {
      // Fall back to requiring without extension in some environments
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('../console-demo');
    }
  });

  afterEach(() => {
    delete global.window.app;
    if (global.window && (global.window as any).demo) delete (global.window as any).demo;
  });

  it('returns a fixed training dummy when fixedEnemy and dryRun are true', () => {
    const result = window.demo.simulateCombat({ fixedEnemy: true, dryRun: true });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].name).toBe('Training Dummy');
    expect(result[0].maxHealth).toBeGreaterThan(0);
    expect(result[0].damage).toBe(0);
  });
});