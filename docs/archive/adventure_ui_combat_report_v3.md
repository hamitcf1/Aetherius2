# Adventure UI & Combat Changes — Report v3

## Applied
- Adventure tab repositioned ✔
- Items renamed to Inventory ✔
- Navigation active tab color updated to theme token ✔

## In progress / Planned
- Custom adventure input component implemented ✔ — `AdventureInput` component replaces the default textarea, supports auto-resize and Enter-to-send (Shift+Enter newline), and matches project theme.
- Emit structured combat result & auto story continuation implemented ✔ — Combat now auto-finalizes loot, populates a structured `combatResult`, and invokes `onCombatEnd` immediately so the app resumes the adventure without a victory modal.
- Remove legacy combat victory logic removed ✔ — Victory modal and related state removed; victory is inline and auto-resumes the story.
- Expand loot tables & auto-award implemented ✔ — Added `data/lootTables.ts`, updated `services/lootService.ts` to sample by enemy type with rarity, level and boss scaling, and guaranteed fallback rewards. Added richer rarity multipliers and explicit boss-specific additions for stronger drop profiles.

## Notes
- Replaced soft-muted text color usage in nav with `text-skyrim-text` to align with theme.
- Performed a codebase search to replace remaining 'Items' headings and references; updated Onboarding and Combat modal sections.

## Issues
- None encountered during navigation rename. Full UI test required for the Adventure input/mobile behaviour.

