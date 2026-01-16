# Loot & Rewards — Customization Guide 🪙

This guide explains how loot is generated, how to make loot deterministic, and where to change reward behavior.

## Key files
- `data/lootTables.ts` — generic loot tables keyed by enemy `type` (e.g., `humanoid`, `undead`, `beast`). Each entry contains `id`, `name`, `type`, `weight`, `minQty`, `maxQty`, `rarity`.
- `services/lootService.ts` — contains `generateEnemyLoot()` and `finalizeLoot()`.
- `components/LootModal.tsx` — the UI that shows `combatState.pendingLoot`.

## Current behavior
- By default, loot is sampled randomly from `getLootTableForEnemy()` (merging base and boss tables), scaled by enemy level and `rarity` multipliers.
- If an enemy template has explicit `possibleLoot`, those items may be used in certain paths (template-based rewards).

## Deterministic/fixed-loot mode
To enable fixed loot:
1. Add a feature flag (e.g., `featureFlags.deterministicLoot = true`) in `featureFlags.ts`.
2. Update `generateEnemyLoot()` to use the enemy template `possibleLoot` directly (skip sampling) when the flag is enabled — this provides consistent, editable drops for each enemy.

## Finalizing loot into inventory
- `finalizeLoot(state, selectedItems, currentInventory, characterId?)` merges selections into inventory and enriches items with stats from `services/itemStats.ts`.
- New items get `id` (`loot_...`), `characterId`, `value`, and `weight` populated so they behave like shop items.

## Tips
- For predictable playtesting, enable deterministic mode and add `possibleLoot` to templates.
- Use `demo.sfxTest()` and other console helpers for QA after making changes.

---
If you want, I can add the deterministic flag and a command-line or console toggle so you can switch modes at runtime.