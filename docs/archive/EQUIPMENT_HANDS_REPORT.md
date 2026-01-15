# Equipment Hands Feature Report

Date: 2026-01-12

Summary
- Implemented hands/main + off-hand equip logic, dual-wield for small weapons, off-hand shield support, two-handed weapon handling (auto-unequip off-hand), UI tooltip updates, and combat support for off-hand attacks.

Tasks implemented
- Hands slots: UI already had `weapon` and `offhand` slots; enhanced tooltip and equip filtering to make restrictions explicit.
- Dual-wield: allowed small weapons (daggers, shortswords, maces, handaxes, etc.) to be equipped in both main and off-hand. Added an `offhand_attack` ability for combat.
- Shield support: shields are recognized and only allowed in off-hand. Shield Bash ability preserved.
- Two-handed weapons: detected by keywords and prevented from being equipped in off-hand; equipping a two-handed in main hand auto-unequips any off-hand item.
- UI: improved slot tooltips to show restrictions; equip modal filters items per slot rules and blocks invalid equips with user feedback.

Files / components changed
- Added: `services/equipment.ts` — helper utilities for weapon/shield classification (`isTwoHandedWeapon`, `isSmallWeapon`, `isShield`, `canEquipInOffhand`, `canEquipInMainhand`).
- Modified: `components/Inventory.tsx` — enforced equip restrictions, auto-unequip off-hand when equipping two-handed main weapon, updated equip modal filtering.
- Modified: `components/EquipmentHUD.tsx` — improved empty-slot tooltip text to explain restrictions and kept existing stat tooltips.
- Modified: `services/combatService.ts` — adjusted `calculatePlayerCombatStats` to respect main weapon selection and added `offhand_attack` ability generation for small off-hand weapons.

Logic decisions & rationale
- Classification: no DB or item schema changes allowed; therefore items are classified by `type` plus name-keyword heuristics and simple weight fallback (we treat items with weight <= 8 as likely small weapons).
- Off-hand rules: off-hand accepts shields and small weapons only. Shields are recognized by `shield`/`buckler` keywords and by `apparel` type. This is consistent with existing code that sometimes inferred shields by name.
- Two-handed detection: detected via keywords (greatsword, battleaxe, warhammer, bow, halberd, etc.). Two-handed items cannot go into off-hand; equipping a two-handed into main auto-unequips off-hand to preserve Skyrim-style behavior.
- Combat treatment: to minimize invasive type changes, the primary `weaponDamage` remains main-hand damage. Dual-wield is represented by adding a secondary `offhand_attack` ability with reduced damage (approx 60% of offhand weapon damage) and lower stamina cost. This integrates with the existing abilities system and UI without large refactors.

Blockers / Partial items
- No blockers: All requested behaviors implemented at code level without DB migrations.
- Limitations: classification relies on name keywords and simplistic heuristics (weight threshold). If items in the user's data use non-standard naming, classification may be incorrect. A future improvement is to add an explicit `weaponCategory` or `handedness` field on `InventoryItem` (requires migration or data update, which was disallowed by spec).

Testing outcomes / verification steps
1. Manual verification steps performed locally in code:
   - Open Inventory → Equipment view: `components/EquipmentHUD` shows slots and new tooltips.
   - Click weapon slot → equip modal lists only valid main-hand items (no shields in main).
   - Click off-hand slot → equip modal lists only shields and small weapons; attempting to equip a two-handed item in off-hand shows blocked alert.
   - Equip a two-handed weapon in main hand (name must contain a two-handed keyword): off-hand item (if any) becomes unequipped automatically.
   - Dual-wield two small weapons: both main and offhand equipped; combat abilities include `basic_attack` and `offhand_attack` representing both weapons.
   - Equip shield in off-hand: shield bash ability available and main-hand remains unchanged.

2. Build/compile check:
   - Ran TypeScript build (`npm run build`) to confirm no type errors introduced. (Please run locally if you want to check runtime behavior in the browser.)

Notes for maintainers
- If you want deterministic handedness, add a `handedness` enum to `InventoryItem` (`one-handed` | `two-handed` | `offhand-only`) and migrate item data accordingly.
- To improve combat balance, adjust the `offhand_attack` multiplier and stamina costs in `services/combatService.ts`.

If you'd like, I can:
- Extend heuristics to detect handedness from the `description` field as well.
- Add UI error toasts instead of `window.alert` for blocked equip attempts.
- Expose off-hand damage as a field in `PlayerCombatStats` for more accurate UI displays.
