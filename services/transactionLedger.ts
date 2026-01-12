/**
 * Transaction Ledger - Prevents duplicate charges from AI responses
 * 
 * Problem: AI can include goldChange in BOTH:
 * 1. The initial response showing options (preview)
 * 2. The follow-up response executing the choice
 * 
 * This causes double/triple charging for a single logical transaction.
 * 
 * Solution: Track transaction IDs and reject duplicates.
 */

interface Transaction {
  id: string;
  type: 'gold' | 'items' | 'xp' | 'mixed';
  goldAmount?: number;
  xpAmount?: number;
  items?: Array<{ name: string; quantity: number; added: boolean }>;
  timestamp: number;
  characterId: string;
}

class TransactionLedger {
  private completedTransactions: Map<string, Transaction> = new Map();
  private characterId: string | null = null;
  
  // Maximum age before a transaction ID is forgotten (prevents memory leak)
  private readonly MAX_TRANSACTION_AGE_MS = 30 * 60 * 1000; // 30 minutes

  setCharacter(characterId: string | null) {
    if (characterId !== this.characterId) {
      // Clear old transactions when switching characters
      this.completedTransactions.clear();
      this.characterId = characterId;
    }
  }

  /**
   * Check if a transaction has already been completed
   */
  hasTransaction(transactionId: string): boolean {
    this.cleanupOldTransactions();
    return this.completedTransactions.has(transactionId);
  }

  /**
   * Record a completed transaction
   */
  recordTransaction(
    transactionId: string,
    details: {
      goldAmount?: number;
      xpAmount?: number;
      items?: Array<{ name: string; quantity: number; added: boolean }>;
    }
  ): void {
    if (!this.characterId) return;
    
    let type: Transaction['type'] = 'mixed';
    if (details.goldAmount && !details.items?.length && !details.xpAmount) type = 'gold';
    else if (!details.goldAmount && details.items?.length && !details.xpAmount) type = 'items';
    else if (!details.goldAmount && !details.items?.length && details.xpAmount) type = 'xp';
    
    this.completedTransactions.set(transactionId, {
      id: transactionId,
      type,
      goldAmount: details.goldAmount,
      items: details.items,
      xpAmount: details.xpAmount,
      timestamp: Date.now(),
      characterId: this.characterId
    });
  }

  /**
   * Generate a unique transaction ID
   */
  generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if a gold change should be applied, considering:
   * 1. If there's a transaction ID that's already been processed
   * 2. If this is a preview response (showing options, not executing)
   */
  shouldApplyGoldChange(
    goldChange: number | undefined,
    transactionId?: string,
    isPreview?: boolean
  ): { apply: boolean; reason: string } {
    // No change to apply
    if (typeof goldChange !== 'number' || goldChange === 0) {
      return { apply: false, reason: 'no_change' };
    }

    // Preview responses show costs but don't execute them
    if (isPreview) {
      return { apply: false, reason: 'preview_only' };
    }

    // Check for duplicate transaction
    if (transactionId && this.hasTransaction(transactionId)) {
      return { apply: false, reason: 'duplicate_transaction' };
    }

    // Should apply this gold change
    return { apply: true, reason: 'valid' };
  }

  shouldApplyXpChange(
    xpChange: number | undefined,
    transactionId?: string
  ): { apply: boolean; reason: string } {
    if (typeof xpChange !== 'number' || xpChange === 0) return { apply: false, reason: 'no_change' };
    if (transactionId && this.hasTransaction(transactionId)) return { apply: false, reason: 'duplicate_transaction' };
    return { apply: true, reason: 'valid' };
  }

  shouldApplyItems(
    items: Array<any> | undefined,
    transactionId?: string
  ): { apply: boolean; reason: string } {
    if (!items || !items.length) return { apply: false, reason: 'no_change' };
    if (transactionId && this.hasTransaction(transactionId)) return { apply: false, reason: 'duplicate_transaction' };
    return { apply: true, reason: 'valid' };
  }

  /**
   * Remove transactions older than MAX_TRANSACTION_AGE_MS
   */
  private cleanupOldTransactions(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    this.completedTransactions.forEach((txn, id) => {
      if (now - txn.timestamp > this.MAX_TRANSACTION_AGE_MS) {
        toDelete.push(id);
      }
    });
    
    toDelete.forEach(id => this.completedTransactions.delete(id));
  }

  /**
   * Get recent transactions (for debugging)
   */
  getRecentTransactions(limit: number = 10): Transaction[] {
    return Array.from(this.completedTransactions.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear all transactions (for testing/reset)
   */
  reset(): void {
    this.completedTransactions.clear();
  }
}

// Singleton instance
let ledgerInstance: TransactionLedger | null = null;

export function getTransactionLedger(): TransactionLedger {
  if (!ledgerInstance) {
    ledgerInstance = new TransactionLedger();
  }
  return ledgerInstance;
}

// Utility: Filter out duplicate/preview gold changes from a GameStateUpdate
export function filterDuplicateTransactions(
  update: {
    goldChange?: number;
    xpChange?: number;
    transactionId?: string;
    isPreview?: boolean;
    newItems?: Array<any>;
    removedItems?: Array<any>;
  }
): {
  filteredUpdate: typeof update;
  wasFiltered: boolean;
  reason: string;
} {
  const ledger = getTransactionLedger();

  // Check gold
  const goldRes = ledger.shouldApplyGoldChange(update.goldChange, update.transactionId, update.isPreview);
  // Check xp
  const xpRes = ledger.shouldApplyXpChange(update.xpChange, update.transactionId);
  // Check items
  const itemsRes = ledger.shouldApplyItems(update.newItems, update.transactionId);

  let filtered = { ...update };
  let wasFiltered = false;
  let reasons: string[] = [];

  if (!goldRes.apply && update.goldChange) {
    // Remove gold
    const { goldChange, ...rest } = filtered as any;
    filtered = rest as any;
    wasFiltered = true;
    reasons.push(goldRes.reason || 'gold_filtered');
  }

  if (!xpRes.apply && update.xpChange) {
    const { xpChange, ...rest } = filtered as any;
    filtered = rest as any;
    wasFiltered = true;
    reasons.push(xpRes.reason || 'xp_filtered');
  }

  if (!itemsRes.apply && update.newItems) {
    const { newItems, ...rest } = filtered as any;
    filtered = rest as any;
    wasFiltered = true;
    reasons.push(itemsRes.reason || 'items_filtered');
  }

  // If any of them will be applied, record the transaction to avoid duplicates
  if (!wasFiltered && update.transactionId) {
    ledger.recordTransaction(update.transactionId, {
      goldAmount: update.goldChange,
      xpAmount: update.xpChange,
      items: update.newItems?.map((i: any) => ({ name: i.name, quantity: i.quantity, added: true })) || []
    });
  }

  return {
    filteredUpdate: filtered,
    wasFiltered,
    reason: wasFiltered ? reasons.join(',') : 'applied'
  };
}
