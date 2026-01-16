# Enemies & Items — Customization Guide 🔧

This guide shows where enemies and items are defined and how to extend them safely.

## Where enemy templates live
- Current canonical templates are defined in:
  - `services/combatService.ts` → `BASE_ENEMY_TEMPLATES` (search for "BASE ENEMY TEMPLATES").

Each template has fields like:
- `baseName`, `type`, `baseLevel`, `baseHealth`, `baseArmor`, `baseDamage`
- `possibleAbilities`: array of ability definitions (id, name, type, damage, cost, description, effects, cooldown)
- `possibleLoot`: an array of objects with `name`, `type`, `description`, `quantity`, `dropChance`, and optional `damage`/`armor`/`slot` fields.

### To add a new enemy
1. Open `services/combatService.ts` and find `BASE_ENEMY_TEMPLATES`.
2. Add a new key, e.g.:
```ts
my_creature: {
  baseName: 'My Creature',
  type: 'beast',
  baseLevel: 4,
  baseHealth: 32,
  baseArmor: 6,
  baseDamage: 10,
  behaviors: ['aggressive'],
  possibleAbilities: [ /* ... */ ],
  possibleLoot: [ /* ... */ ],
  baseXP: 12
}
```
3. Write unit tests (see `tests/`) to verify loot and expected behavior.

## Where loot / items come from
- The loot sampling code lives in `data/lootTables.ts` (type-based tables) and the per-template `possibleLoot` is used for template-specific drops.
- When you want deterministic/fixed loot per enemy, put explicit items in the template's `possibleLoot` and use the deterministic mode (see `docs/loot_and_rewards.md`).

## Item stats & canonical items
- Item stats and values are in `services/itemStats.ts`. This file maps common item names to `damage`, `armor`, and `value`.
- When loot becomes an inventory object, `finalizeLoot()` in `services/lootService.ts` attaches `value` and `weight` using `getItemStats()`.

## Best practices
- Use unique `name` strings across templates to avoid accidental merges.
- Prefer referencing existing items in `itemStats` when possible; add to `itemStats` if you introduce a canonical weapon/armor name.
- Add tests in `tests/` for loot, abilities, and reward distribution for any new template.

---
If you'd like, I can move `BASE_ENEMY_TEMPLATES` into `data/enemies.ts` and create a `data/items.ts` manifest to make editing easier (recommended). Say "move templates" if you want that change.