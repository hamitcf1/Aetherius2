# Adventure State Authority Report

**Summary**
- Implemented strict separation of concerns between the Game Engine (mechanics) and the Adventure AI (narration).
- Introduced read-only Adventure context in prompts, added robust validation & sanitization to block mechanical deltas in AI outputs, and tightened client-side safeguards to prevent duplicated rewards/items/stat changes.

## Fixes Applied ✅
- Enforced narrative-only behavior for Adventure AI by updating the system prompt and validating AI outputs to block mechanics.
- Added read-only `ADVENTURE_CONTEXT_JSON` to the context passed to the Adventure model (player snapshot, recent engine transactions, last combat summary).
- Implemented sanitization of narrative text to remove explicit mechanical phrases ("+50 gold", "gained 10 XP", "you drink a potion and heal 25 HP", etc.).
- Forbidden mechanical fields in Adventure responses: `goldChange`, `xpChange`, `newItems`, `removedItems`, `statUpdates`, `vitalsChange`, `transactionId` (errors are emitted and fields stripped in sanitized output).
- Added secondary client-side sanitization in the UI (defense-in-depth) and surfaced warnings to the player when text was sanitized.
- Continued using and relying on the existing `TransactionLedger` + `filterDuplicateTransactions` to prevent double application of rewards.

## Files Modified
- components/AdventureChat.tsx
  - Build and pass `ADVENTURE_CONTEXT_JSON` (read-only) in the context string
  - Sanitized GM narrative client-side and warn the player when mechanical content was removed
  - Adjusted system prompt to be narrative-only and explicit about engine authority
- services/geminiService.ts
  - Extended `validateGameStateUpdate` with `allowMechanical` option
  - Added `sanitizeNarrativeMechanics` and strict checks for adventure mode to forbid mechanical fields
  - `generateAdventureResponse` now calls validation with `allowMechanical=false` and logs warnings
- types.ts
  - Added `AdventureContext` type (read-only snapshot of player and recent engine transactions)
- docs/ADVENTURE_STATE_AUTHORITY_FIX.md
  - Updated status for each section to reflect implementation progress and outcomes

## Validation Rules Added
1. Field-level forbids (Adventure Mode):
   - `goldChange`, `xpChange`, `newItems`, `removedItems`, `statUpdates`, `vitalsChange`, `transactionId` are forbidden in Adventure responses.
2. Narrative sanitization:
   - Detect and remove patterns like `+50 gold`, `gained 10 XP`, `you drink .*potion`, `regained 25 health`, numeric deltas (`+`/numbers next to `gold`, `XP`, `health`, etc.).
   - Replace explicit numeric statements with neutral/narrative phrases (e.g., "some coin", "you feel restored").
3. Client-side defense-in-depth:
   - Adventure chat sanitizes GM content again and pushes a simulation warning (so players see that mechanical content was intentionally removed).
4. Transaction ledger & duplicate filtering remain in place and are used to avoid double-applied gold/xp/items when the engine legitimately applies an update.

## Edge Cases Handled
- AI includes mechanical text inside narrative (e.g., a descriptive sentence mentioning numeric changes): the narrative sanitization removes numeric deltas but preserves immersive phrasing.
- AI attempts to return mechanical fields in JSON: validator strips/blocks them and records a validation error.
- Preview-style responses containing `previewCost` inside choices: preserved (these are non-executing displays). The logic in `AdventureChat` still treats preview responses correctly (does not apply mechanics).
- Duplicate reward application races: `TransactionLedger` prevents duplicates if the Adventure response later tries to re-apply items/gold/xp.
- Potion references: if an item is gone from inventory summary (quantity 0) the read-only context prevents AI from re-narrating its use; narrative sanitization also removes explicit consumption lines.

## Remaining Risks & Notes
- Event bus for `CombatResolved`: currently the system includes last combat summary in `ADVENTURE_CONTEXT_JSON` and App.tsx sends contextual prompts after combat. Full dedicated `CombatResolved` event-emitter API (pub/sub internal event) is recommended in a follow-up to make the integration explicit and decoupled. Status: PARTIAL (works, but formal event API would be more robust).
- If third-party or future AI models strongly resist instruction, they may attempt to include mechanical text in ambiguous ways that bypass simple regex rules — the layered approach (both server-side validation and client-side sanitization + ledger enforcement) mitigates this dramatically.
- Narrative rephrasing could occasionally change a specific mechanical implication (e.g., an AI removes a healing number but keeps the implication a healing occurred). This is acceptable per design: the engine must perform mechanical effects and the AI should narrate the result conceptually.

## How to Verify
1. Trigger a combat end that results in XP/gold/item rewards. Confirm: the `ADVENTURE_CONTEXT_JSON` contains a `lastCombat` summary and `recentEngineTransactions` includes the engine-applied rewards.
2. Generate an Adventure AI response that attempts to award `+50 gold` or a potion use: verify the returned narrative has number-free phrasing and the update JSON has no mechanical fields.
3. Attempt to craft a malicious or malformed AI response with mechanical JSON fields; confirm the validator strips the fields and logs warnings.
4. Confirm that valid engine-applied updates (coming from `combatService` / `lootService` / `App.tsx`) still apply exactly once and are recorded in `TransactionLedger`.

---

If you'd like, I can now add a lightweight unit test or a small local script to simulate an Adventure response that includes mechanical deltas and assert that the pipeline strips them and produces only narrative output. Let me know if you'd like automated tests added to the repo. 
