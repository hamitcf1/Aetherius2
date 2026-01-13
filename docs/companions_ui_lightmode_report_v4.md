## Applied
- Companion equipment management implemented ✔
  - Companion equipment is managed via `EquipmentHUD` (reused UI) and a new "Manage Equipment" flow in `components/CompanionsModal.tsx`.
  - Items remain in the player's inventory; companions reference equipped item IDs through `companion.equipment` and items record ownership with `InventoryItem.equippedBy`.
- Item ownership locking enforced ✔
  - `InventoryItem.equippedBy?: 'player' | companionId | null` added to `types.ts`.
  - Equip flows now validate ownership and prevent equipping items already owned by another companion or by the player without an explicit unequip.
  - Attempts to equip an item already owned show a user-facing toast (warning) and disable the action in the UI.
- Companion text input styling unified ✔
  - Companion-related inputs now use the shared input styling (focus states, colors, borders) matching project conventions.
  - Files updated: `components/CompanionsModal.tsx`, `components/CompanionDialogueModal.tsx`.
- Manage Companions button repositioned ✔
  - The **Manage Companions** button is now adjacent to **Spells** on the Hero page (`components/CharacterSheet.tsx`). Uses `openCompanions()` from `AppContext`.
- Perk Points and Max Stats swapped ✔
  - Order of the Perk Points summary and the Max Stats section has been swapped to match the spec (`components/CharacterSheet.tsx`).
- Light mode styling fixed (initial pass) ✔
  - Theme selector supports a `light` theme and updates the CSS variables (`--skyrim-*`) at runtime.
  - Light theme tokens set to readable contrasts and tested across the primary screens.

## Files changed / added
- Modified
  - `types.ts` — Added `InventoryItem.equippedBy` and `Companion.equipment` mapping.
  - `components/CompanionsModal.tsx` — Added Manage Equipment flow (reuse `EquipmentHUD`), unified inputs, equip/unequip handling and validation.
  - `components/CompanionDialogueModal.tsx` — Unified input styling.
  - `components/EquipmentHUD.tsx` — (No API change; used as-is by companion equipment UI.)
  - `components/Inventory.tsx`, `components/BonfireMenu.tsx`, `components/AdventureChat.tsx`, `components/CombatModal.tsx` — Updated equip/unequip flows to set `equippedBy` and enforce ownership checks.
  - `components/CharacterSheet.tsx` — Moved Manage Companions button next to Spells and swapped Perk Points / Max Stats.
  - `App.tsx` — Added assignment helpers (`onAssignItemToCompanion` / `onUnassignItemFromCompanion`) passed into `CompanionsModal`; added theme variable application for light mode.
- Added
  - `docs/companions_ui_lightmode_report_v4.md` — This report.

## Issues
- Edge-case: item reassignment during modal cancel ⚠
  - Scenario: a user begins assigning an item to a companion via the Manage Equipment modal but cancels before clicking "Equip". Since assignments only commit on the explicit Equip action, the UI is consistent, but there is a UX gap: an optimistic preview (if added later) would need to be reconciled on cancel. Current behavior: no state is mutated until the user confirms the equip action.
- Tests pending ⚠
  - Unit tests for equip locking, companion equip/unassign flows, and interleaved player/companion equip race conditions are planned but not yet added.

---

If you'd like, I can now add unit tests for the equip/ownership flows and add a small tooltip in the companion Equipment modal explaining ownership rules (recommended UX improvement).