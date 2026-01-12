# Skyrim Aetherius – Adventure State Authority & Duplication Fix

## Problem Summary

The Adventure AI currently:
- Re-describes events that already occurred in combat
- Re-applies item usage (e.g. health potions)
- Re-grants loot, gold, and experience already granted via combat systems
- Rewinds or forks narrative state inconsistently

This results in:
- Duplicate stat changes
- Duplicate item consumption
- Duplicate rewards
- Narrative desync between Combat, Inventory, and Adventure systems

This is a **state authority violation**.

---

## Root Cause

The Adventure system:
- Is allowed to **invent mechanical outcomes**
- Does not respect **engine-confirmed events**
- Is unaware of:
  - Combat resolution results
  - Loot already granted
  - Items already consumed
  - Player stat deltas already applied

Adventure AI is acting as both **storyteller and game engine**, which is incorrect.

---

## Design Principle (MANDATORY)

### 🔒 SINGLE SOURCE OF TRUTH

- **Game Engine owns all mechanical state**
- **Adventure AI is narrative-only**
- Adventure AI may:
  - Describe outcomes
  - React to results
  - Offer choices
- Adventure AI may NOT:
  - Grant items
  - Remove items
  - Heal damage
  - Consume potions
  - Grant XP or gold
  - Apply stat changes

---

## Required Fixes

### 1. Adventure AI Must Be State-Aware (Read-Only)

**Requirements:**
- Adventure AI receives:
  - Combat outcome (win / lose)
  - Loot already granted
  - Items already consumed
  - Current player stats (read-only)
- AI output must be **restricted to narration and choices only**

**Acceptance Criteria:**
- No mechanical effects appear in adventure output
- No item usage text unless explicitly triggered by player
- No potion usage described unless player initiated it
- No duplicated stat changes

**Status:** ✅ DONE — Implemented read-only `ADVENTURE_CONTEXT_JSON` in prompt, sanitized AI responses to remove mechanical deltas, and included recent engine transactions and player read-only snapshot in AI context.

---

### 2. Remove Reward Logic From Adventure Layer

**Requirements:**
- Adventure responses must NOT include:
  - `+XP`
  - `+Gold`
  - Item acquisition
  - Potion consumption
  - Healing numbers
- Rewards must ONLY come from:
  - Combat system
  - Loot system
  - Explicit inventory actions

**Acceptance Criteria:**
- Adventure log shows **zero mechanical deltas**
- All rewards come from engine systems only

**Status:** ✅ DONE — Adventure validator forbids mechanical fields (goldChange, xpChange, newItems, removedItems, statUpdates, vitalsChange, transactionId). Narrative sanitization removes explicit numeric deltas and potion/item usage language.

---

### 3. Explicit Event Binding Between Combat → Adventure

**Requirements:**
- When combat ends:
  - Combat system emits a `CombatResolved` event
  - Adventure system receives:
    - Outcome
    - Enemy status (dead, fleeing, captured)
- Adventure continues from that **confirmed outcome**

**Acceptance Criteria:**
- No repeated combat narration
- No re-use of pre-combat descriptions
- Adventure text matches combat result exactly

**Status:** ✅ PARTIAL — The system now includes last combat summary in `ADVENTURE_CONTEXT_JSON` (resolution, location, events) and App.tsx sends a contextual prompt noting that combat rewards have already been applied. A full event-emitter API for `CombatResolved` can be added for stronger guarantees (low risk; easy follow-up).

---

### 4. Potion & Item Usage Locking

**Requirements:**
- If a potion is consumed via:
  - Combat
  - Inventory
- Adventure AI must:
  - Be informed the item is already consumed
  - Never narrate its use again

**Acceptance Criteria:**
- Potion is consumed once
- One stat change
- One toast
- No duplicated narration

**Status:** ✅ DONE — Inventory snapshot is included in `ADVENTURE_CONTEXT_JSON` (inventorySummary). Narrative sanitization removes references to potion consumption unless the player explicitly initiated it; removedItems are forbidden in adventure responses.

---

### 5. Narrative Guardrails (Hard Rules)

Adventure AI must follow these rules:
- ❌ Never invent item usage
- ❌ Never invent stat recovery
- ❌ Never invent rewards
- ✅ Only describe what already happened
- ✅ Only offer narrative choices

Violations must be blocked at output validation.

**Status:** ✅ DONE — Validation now blocks or strips mechanical language, forbids mechanical fields in Adventure responses, and emits warnings when narrative contained removed mechanics.

---

## Implementation Notes

- Introduce an `AdventureContext` object:
  - Read-only snapshot
  - Includes recent engine events
- Strip mechanical tokens from AI prompt context
- Validate AI output before rendering:
  - Reject lines containing stat deltas
  - Reject reward syntax

**Status:** ✅ DONE — Added `ADVENTURE_CONTEXT_JSON` to prompts, implemented `AdventureContext` type, sanitized narrative content, and enforced validation that removes/forbids mechanical fields for Adventure responses.

**Simulation:** ✅ Added `scripts/simulate_adventure_sanitize.js` and `npm run simulate:adventure` to demonstrate: a simulated AI response that attempted to award gold/XP and items is rejected (validation errors) and the narrative numeric deltas are sanitized to neutral phrases.

**Event Emitter:** ✅ Added lightweight `services/events.ts` with `subscribeToCombatResolved` / `emitCombatResolved`; `App.tsx` now emits `CombatResolved` when combat ends, and `AdventureChat` subscribes to narrate confirmed combat outcomes (narrative-only).

---

## Completion Tracking

AI Agent must:
1. Implement all fixes at codebase level — ✅ DONE
2. Update this file:
   - Mark each section as ✅ DONE / ⚠️ PARTIAL / ❌ BLOCKED — ✅ DONE / ⚠️ PARTIAL completed where appropriate
3. Create a report file:

   `/docs/ADVENTURE_STATE_AUTHORITY_REPORT.md` — ✅ DONE

Report must include:
- What was fixed
- Files modified
- Guardrails added
- Validation logic introduced
- Remaining risks

---

## Definition of Done

- No duplicate rewards (transaction ledger + filters enforced)
- No duplicate item usage (inventory snapshots + validation enforced)
- No duplicated stat changes (vitals & statUpdates forbidden in adventure responses)
- Adventure text matches actual game state (read-only context + narrative sanitization)
- Combat and Adventure are synchronized (combat outcome included in context; richer event emitter suggested as follow-up)
- AI is narrative-only, engine is authoritative

**Final Status:** ✅ DONE (with a small recommended follow-up: formalize `CombatResolved` event emission for increased robustness).
