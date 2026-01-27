# **Copilot / AI Agent Instructions — Skyrim Aetherius (Revised)**

> **Primary goal:** Solve real problems in production code.
> **Anti-goal:** Spending time making tests pass without fixing the underlying issue.

---

## Overview

* Project: React + TypeScript single-page app bootstrapped with Vite. Entry: `index.tsx` → `App.tsx`.
* UI lives in `components/` and is orchestrated by `App.tsx` and `AppContext`.
* Game logic & persistence live in `services/` (notably `stateManager.ts` and `simulationState.ts`).
* AI integration is in `services/geminiService.ts`.

---

## Key boundaries & data flows

* **UI / composition:** `App.tsx` owns global UI + game state; handlers are exposed via `AppContext`.
* **Simulation engine:**

  * `simulationState.ts` → pure data model + serializers
  * `stateManager.ts` → runtime manager (`scheduleSave()` / `forceSave()`)
* **Persistence:** Firestore + realtime presence with localStorage fallback.
  **Do not change storage key formats without migration.**
* **AI:** `geminiService.ts` wraps `@google/genai`. Respect rate-limit handling already present in the UI.
* **Audio:** Controlled via `audioService.ts`; driven by ambient context in game state updates.

---

## Developer workflows (commands)

* Dev: `npm run dev`
* Build: `npm run build`
* Preview: `npm run preview`
* Migration: `npm run migrate:potions`

⚠️ **Do not run commands unless explicitly instructed or necessary to validate a concrete fix.**

---

## Testing policy (IMPORTANT)

**Tests are diagnostic tools, not success criteria.**

* ❌ Do **NOT** create new tests unless explicitly requested.
* ❌ Do **NOT** modify, relax, delete, skip, or rewrite tests to make them pass.
* ❌ Do **NOT** treat failing tests as something that must be “fixed” immediately.
* ✅ If tests fail:

  * Identify the *root cause* in production code.
  * Fix the production logic.
  * Leave tests unchanged unless the test itself is proven incorrect **and** you are explicitly asked to update it.
* ✅ If no tests exist for an area, proceed anyway — do not add tests proactively.

> **Anti-pattern to avoid:**
> “Tests are failing → change expectations / mocks / assertions until green.”

---

## Patterns & conventions to follow

* **Centralized handlers:** Add top-level handlers in `App.tsx`, expose via `AppContext`.
* **Save semantics:** Always use `scheduleSave()` / `forceSave()` where provided.
* **Serialization:** Use `serializeSimulationState` / `deserializeSimulationState` helpers.
* **Types-first:** Prefer canonical types from `types.ts`.
* **UI components:** Modals follow `*Modal.tsx`, controlled by parent state.

---

## Integration notes & gotchas

* **Firebase:** Client-only access; do not hardcode admin credentials.
* **Offline behavior:** Respect offline queue semantics and `processOfflineQueue()`.
* **Console overlay:** Available via typing `"console"` in-app.
* **AI rate limits:** Follow preview/transaction patterns (`isPreview` flag).

---

## Files to inspect first

* `App.tsx`
* `AppContext.tsx`
* `services/stateManager.ts`
* `services/simulationState.ts`
* `services/geminiService.ts`
* `services/firestore.ts`
* `services/realtime.ts`
* `types.ts`

---

## When in doubt

* Preserve existing serialization, storage keys, and save semantics.
* Prefer small, targeted fixes over broad refactors.
* **Solve the real bug, not the symptom.**

---

# 🔁 Daily Changelog Automation (OPT-IN ONLY)

⚠️ **This section applies ONLY when explicitly asked to:**

> “Run daily changelog automation”
> or
> “Prepare a release / changelog draft”

If not explicitly requested, **skip this entire section.**

---

### Rules

* Use ISO date format (`YYYY-MM-DD`).
* Increment **patch version only**.
* Skip docs-only or chore-only changes.
* **DO NOT create or modify tests as part of changelog automation.**
* Tests/builds are **informational only**:

  * ❌ Never change tests to make automation succeed.
  * ❌ Never block or shape changes around test results.

---

### Automation behavior

* If tests or build fail:

  * Record logs
  * Note failures in the draft
  * **Do not attempt to “fix” tests**
* Produce drafts only; do not commit, tag, push, or publish.

---

## Absolute prohibitions

* 🚫 Do not run git commands
* 🚫 Do not create PRs or releases
* 🚫 Do not change tests to satisfy automation
* 🚫 Do not treat green tests as proof of correctness

---

If anything here is unclear or you need a **test-writing mode**, **refactor mode**, or **release mode**, it must be explicitly requested.
