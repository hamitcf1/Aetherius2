import { describe, it, expect, beforeEach } from 'vitest';
import { finalizeLoot, computeEnemyXP } from '../services/lootService';
import { getTransactionLedger, filterDuplicateTransactions } from '../services/transactionLedger';

// Minimal mocks for combat state & inventory
const makeCombatState = () => ({
  id: 'combat_test_1',
  enemies: [
    { id: 'e1', name: 'Bandit', level: 1, maxHealth: 0, currentHealth: 0, isBoss: false, goldReward: 5 },
    { id: 'e2', name: 'Bandit2', level: 1, maxHealth: 0, currentHealth: 0, isBoss: false, goldReward: 3 }
  ],
  pendingLoot: [],
  pendingRewards: { xp: 10, gold: 8, items: [] }
} as any);

describe('Combat rewards application', () => {
  beforeEach(() => {
    // Reset ledger between tests
    getTransactionLedger().reset();
  });

  it('finalizeLoot yields rewards with transaction id and applying update records transaction and updates character values', () => {
    const state = makeCombatState() as any;
    const inventory: any[] = [];

    const { newState, updatedInventory, grantedXp, grantedGold } = finalizeLoot(state, null, inventory);

    expect(grantedXp).toBeGreaterThanOrEqual(0);
    expect(grantedGold).toBeGreaterThanOrEqual(0);
    expect(newState.rewards).toBeDefined();
    expect(newState.rewards.transactionId).toBeTruthy();

    const txnId = newState.rewards.transactionId;

    // Simulate GameStateUpdate coming from App after finalizeLoot
    const update = { xpChange: grantedXp, goldChange: grantedGold, transactionId: txnId } as any;

    // Ledger requires a character context to record transactions (mirrors App behavior)
    getTransactionLedger().setCharacter('char1');

    const { filteredUpdate, wasFiltered, reason } = filterDuplicateTransactions(update);

    // Should not be filtered on first apply
    expect(wasFiltered).toBe(false);
    expect(filteredUpdate.xpChange).toBe(grantedXp);
    expect(filteredUpdate.goldChange).toBe(grantedGold);

    // Now simulate applying the update to a character object
    const character = { id: 'char1', gold: 0, experience: 0 } as any;
    if (filteredUpdate.goldChange) character.gold += filteredUpdate.goldChange;
    if (filteredUpdate.xpChange) character.experience += filteredUpdate.xpChange;

    expect(character.gold).toBe(grantedGold);
    expect(character.experience).toBe(grantedXp);

    // The transaction should now be recorded in the ledger (filterDuplicateTransactions records it when applied)
    expect(getTransactionLedger().hasTransaction(txnId)).toBe(true);

    // Re-applying the same update should be filtered as duplicate
    const { filteredUpdate: f2, wasFiltered: wf2 } = filterDuplicateTransactions(update);
    expect(wf2).toBe(true);
    expect(f2.xpChange).toBeUndefined();
    expect(f2.goldChange).toBeUndefined();
  });
});
