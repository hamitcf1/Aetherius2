# Customization & Extension Guide

Welcome — this series of docs explains where and how to customize the Skyrim Aetherius codebase. It is written for designers and developers who want to add or tweak enemies, items, loot tables, audio, and other features with minimal risk.

Use the following guides:

- `docs/enemies_and_items.md` — How to add / edit enemy templates and canonical items. ✅
- `docs/loot_and_rewards.md` — How loot is generated and how to make loot deterministic or template-based. ✅
- `docs/audio_and_sfx.md` — How SFX and music are organized, add variants, and use the `demo.sfxTest()` console helper. ✅
- `docs/testing_and_debugging.md` — How to run tests, add tests, and use debugging helpers (e.g., `audioService.getRecentSfxEvents()`). ✅

Each guide includes examples and common patterns. If you'd like, I can also add a `data/items.ts` canonical manifest and a `data/enemies.ts` file to make things more explicit and editable; say the word and I'll add them and update the docs accordingly.