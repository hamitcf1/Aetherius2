# Feature Overview & Extension Points — Quick Map ⚙️

This single-page map points to canonical files and extension points for the major systems in Aetherius so you know *exactly* where to make changes.

## AI / Model Integration
- File: `services/geminiService.ts` — wrapper over the AI provider.
- Tips: Respect rate limit handling (`getRateLimitStats()`), and use `generateAdventureResponse()` for consistent behavior. Add serialization/deserialization logic in `services/simulationState.ts` if you change the state shape.

## Simulation & Persistence
- Files: `services/simulationState.ts`, `services/stateManager.ts` — core simulation model and save scheduling.
- Tips: Use `SimulationStateManager` when changing persistent simulation state; call `scheduleSave()` instead of manually writing to Firestore.

## Firestore / Realtime / Storage
- Files: `services/firestore.ts`, `services/realtime.ts`, `services/storage.ts`, `services/firebase.ts`.
- Tips: Keep storage key formats stable; add migration scripts under `scripts/` and update `FIRESTORE_MIGRATION.md` when changing schema.

## Combat & Enemies
- Files: `services/combatService.ts` (templates & combat engine), `components/CombatModal.tsx` (UI), `services/lootService.ts` (loot generation & finalize).
- Tips: Update `BASE_ENEMY_TEMPLATES` or move it to `data/enemies.ts` for easier editing; add tests for expected damage/loot behaviors.
- Note: Players and companions can now choose to **Skip Turn**; this records a `skip` action in the combat log and advances the turn (see `skipActorTurn` in `services/combatService.ts`).

## Items, Loot & Economy
- Files: `services/itemStats.ts`, `data/lootTables.ts`, `services/lootService.ts`, `components/LootModal.tsx`.
- Tips: Add canonical items to `itemStats` to ensure value/weight/damage are consistent.

## Audio & SFX
- File: `services/audioService.ts`, `public/audio/sfx/` (assets), `console-demo.js` (dev testing helpers).
- Tips: Use `_2/_3` suffix for soft variants; call `variantPaths()` in `SOUND_EFFECTS` when adding multiple default variants.

## UI & App Composition
- Files: `App.tsx`, `AppContext.tsx` — global handlers and feature toggles. Add or expose new handlers via `AppContext` rather than global events.
- Tips: Keep modal components under `components/*Modal.tsx` and control them from parent components for predictable behavior.

## Quests, Journal, Story
- Files: `components/QuestLog.tsx`, `components/StoryLog.tsx`, `mainQuestLines.ts`.
- Tips: Quests are stored on characters; keep quest structure stable to avoid migration headaches.

## Companions & NPCs
- Files: `services/companionsService.ts`, `components/CompanionsModal.tsx`, `components/CompanionDialogueModal.tsx`.
- Tips: Companion presence is persisted; treat companions like characters for many operations.

## Spells & Abilities
- Files: `services/spells.ts`, `services/effects.ts`, `components/SpellsModal.tsx`.
- Tips: To add elemental or multi-variant SFX per spell, add logic in `audioService` and add `element` on abilities.

## Testing & Debugging
- File: `tests/*`, use `vitest` and `@testing-library/react`.
- Tips: Add unit tests for service functions and component tests for UI. Use `demo.*` helpers for runtime QA (see `console-demo.js`).

## Contributing / Changes to API
- Add migration scripts for any data model changes and document the change in `FIRESTORE_MIGRATION.md`.
- Add tests for new features and update `tests/TEST_MATRIX.md`.

---
If you want, I can convert this file into a short developer checklist or add a `docs/SAMPLE_PATCH.md` showing a small end-to-end example (add new enemy -> add loot -> add SFX -> add test). Say "add checklist" or "add sample patch" and I'll add it.