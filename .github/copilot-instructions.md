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

---

## Daily Changelog Automation (for AI agents) 🔁

**Goal**: each calendar day the agent should create (and publish) a top changelog entry in `components/Changelog.tsx` for meaningful commits made since the last changelog entry. The agent must determine today's date programmatically and only create an entry when there are meaningful changes.

**Rules**
- Use ISO date format (YYYY-MM-DD) for the `date` field.
- Versioning: parse `CHANGELOG[0].version` and increment the patch number (major.minor.patch -> patch + 1). Example: 1.0.4 -> 1.0.5.
- Update `package.json`'s `version` to match the new version.
- Do not publish an entry if there are no meaningful changes (skip docs-only/chore-only commits). If `latestDate === dateStr` and meaningful changes are present, append them to today's entry and increment the patch version instead of creating a second entry for the same date.
- Always run `npm test` and `npm run build`. If tests or build fail, do **not** abort the automation; instead proceed to produce a changelog draft and include failure logs. The agent must still not publish, commit, or push changes automatically; a maintainer must review and finalize the draft.
- The agent must also write an **agent activity log** to `docs/agent-activity/` that records the action, summarized changed files, and links to any generated artifacts (draft path, test/build logs); the activity log should be referenced in the draft.

**High-level algorithm**
1. Get today's date: `const dateStr = new Date().toISOString().split('T')[0];`
2. Read `components/Changelog.tsx` and determine `latestVersion` and `latestDate` from the first entry.
3. If `latestDate === dateStr` then scan the workspace for files whose modification time (mtime) is >= `latestDate`. If **meaningful** changes are found, append concise bullets describing those changes to the existing top changelog entry for today (do not create a duplicate entry for the same date), increment the patch number, and continue to run tests/build and produce/update the draft. If no meaningful changes are found, exit (nothing to publish).
4. Collect changes since the `latestDate` without executing git commands. Do NOT run any git commands.
   - Preferred method: scan the workspace for files whose modification time (mtime) is >= `latestDate` and summarize changes (file paths changed, high-level diff snippets, and affected components).
5. Generate concise bullets (1 sentence) per change, dedupe similar items, and prefer human-readable phrasing rather than raw diffs.
6. Construct a new changelog entry and insert it at the top of `CHANGELOG`.
7. Write an **agent activity log** to `docs/agent-activity/` recording the date, action (`new-entry` or `append`), summarized changed files, and links to any generated artifacts (draft path, test/build logs). Reference this activity log in the draft for maintainers to review.
8". Update `package.json` version to the new version.
9. Run `npm test` and `npm run build`. If either fails, do not abort; save test/build logs to `docs/updates/{dateStr}-changelog-failure.log`, note the failures clearly in the draft, and still produce the changelog draft and the suggested commit message and tag. Do NOT automatically commit, push, or publish the changelog — a maintainer must review and finalize the changes.
10. **Important:** The agent MUST NOT run git commands, create PRs, use the GitHub API to publish releases, or push to remote. Instead, if tests pass and build succeeds, the agent should:
    - Write the new `CHANGELOG` entry into `components/Changelog.tsx` and update `package.json` `version` to the new version.
    - Produce a draft summary markdown at `docs/updates/{dateStr}-changelog-draft.md` that contains the new changelog entry, suggested commit message (`chore(changelog): publish v{newVersion} — automated daily changelog for {dateStr}`), and suggested tag (`v{newVersion}`).
    - Leave the workspace changes unstaged/uncommitted and notify maintainers that a changelog draft is ready for manual review/publish. The notification should include the draft path and test/build logs if available.
11. A maintainer MUST manually review, commit, tag, push, and create any Release — the agent must not perform those actions.