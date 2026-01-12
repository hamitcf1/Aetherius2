# Copilot / AI agent instructions for Skyrim Aetherius

Keep this short — aim to make an agent productive in minutes.

Overview
- Project: React + TypeScript single-page app bootstrapped with Vite. Entry: [index.tsx](index.tsx) → [App.tsx](App.tsx).
- Big picture: UI lives in `components/` and is orchestrated by `App.tsx` and `AppContext`. Game logic and persistence live in `services/` (notably `stateManager.ts` and `simulationState.ts`). AI integration is in `services/geminiService.ts`.

Key boundaries & data flows
- UI / composition: `App.tsx` maintains global UI and game state then provides handlers through `AppContext` (use `useAppContext()` from [AppContext.tsx](AppContext.tsx)).
- Simulation engine: `services/simulationstate.ts` (pure data model + serializer/deserializer) and `services/stateManager.ts` (runtime manager with `scheduleSave()`/`forceSave()` patterns). Use `SimulationStateManager` when modifying persistent simulation state.
- Persistence: `services/firestore.ts` (Firestore), `services/realtime.ts` (presence/active character), with localStorage fallback keys like prefix `aetherius:simulation:`. Don't change storage key formats without migration.
- AI & external: `services/geminiService.ts` wraps `@google/genai` and exposes `generateAdventureResponse` and `getRateLimitStats`. Respect rate-limit handling already present in the UI (`RateLimitIndicator`).
- Audio: `services/audioService.ts` controls music and sfx; updates are requested by ambient context objects in game state updates.

Developer workflows (commands)
- Run dev server: `npm run dev` (Vite). If `npm run dev` fails, check terminal for Vite diagnostics and port conflicts.
- Build: `npm run build` (Vite build). Preview: `npm run preview`.
- Misc: `npm run migrate:potions` (scripts/migrate_potions.js) for potion DB migration.

Patterns & conventions to follow
- Centralized handlers: Add top-level handlers to `App.tsx` and expose them through `AppContext` rather than adding global event listeners elsewhere.
- Save semantics: Use `scheduleSave()`/`forceSave()` semantics where present (e.g., in `SimulationStateManager`) to preserve debouncing and offline queue behavior.
- Serialization: For simulation persistence, use the provided `serializeSimulationState` / `deserializeSimulationState` helpers in `services/simulationState.ts` to avoid subtle data-format breakage.
- Types-first: `types.ts` contains the canonical shape for characters, items, and GameStateUpdate payloads — prefer using these types for new code and function signatures.
- UI components: Modal components follow `*Modal.tsx` naming and use local open/close state controlled by `App.tsx` or parent components. Avoid adding uncontrolled DOM mutations.

Integration notes & gotchas
- Firebase: Auth and Firestore are used (see `services/firebase.ts` and `services/firestore.ts`). Some server-side functions live under `netlify/functions/` — don’t hardcode admin credentials in client code.
- Offline behavior: The app queues offline changes and calls `processOfflineQueue()` when back online (see `components/StatusIndicators.tsx` and usages in `App.tsx`). Understand `queueOfflineChange` shape before altering persistence logic.
- Console overlay: There is a developer console overlay (`components/ConsoleOverlay.tsx`) that can be triggered by typing "console" — useful for debugging without instrumenting code.
- AI rate limits: UI reads `getRateLimitStats()` from `services/geminiService.ts`. When adding calls to AI, follow the app's preview/transaction patterns (`isPreview` flag in `GameStateUpdate`) to avoid charging or performing stateful actions during previews.

Examples (copy/paste-ready)
- To persist simulation state safely:
  - Instantiate `const mgr = new SimulationStateManager(characterId, userId)` and call `await mgr.load()` then `mgr.scheduleSave()` after changes.
- To add a global handler exposed to components: add function in `App.tsx`, pass it through `AppContext.Provider` and document the handler signature in `AppContext.tsx`.

Files to inspect first
- [App.tsx](App.tsx) — app composition and primary state.
- [AppContext.tsx](AppContext.tsx) — required shape for exposed handlers.
- [services/stateManager.ts](services/stateManager.ts) and [services/simulationState.ts](services/simulationstate.ts) — simulation engine and persistence.
- [services/geminiService.ts](services/geminiService.ts) — AI integration.
- [services/firestore.ts](services/firestore.ts) and [services/realtime.ts](services/realtime.ts) — persistence & presence.
- [types.ts](types.ts) — canonical types for almost every function.

When in doubt
- Preserve existing serialization, storage keys, and `scheduleSave`/`forceSave` behavior.
- Prefer small, type-safe changes. Run `npm run dev` locally to validate UI changes.

If anything here is unclear or you want this tailored for a specific task (tests, refactor, feature), tell me which area and I will expand the instructions.
