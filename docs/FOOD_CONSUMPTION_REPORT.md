# Food Consumption Report

**Summary**
This patch implements the food consumption fixes from `/docs/FOOD_CONSUMPTION_FIX.md`:
- Food heals the player based on nutrition when consumed (out-of-combat and in-combat)
- Only a single toast message is shown per consumption
- Inventory quantity decreases and updates immediately
- Food consumption integrates with hunger/thirst/fatigue (where applicable) and combat

---

## Tasks Implemented ✅
1. Enable Healing from Food
   - Added a default health restore when foods do not explicitly state stat effects: heal = floor(hungerReduction/2) + 10
   - Out-of-combat: `handleEatItem` now injects a default health vitalsChange when no explicit stat effect is present; this uses nutrition data from `services/nutritionData.ts`.
   - In-combat: `executePlayerAction` now applies the same healing formula and also reduces `newState.survivalDelta` for hunger/thirst so effects are tracked during combat.

2. Correct Toast Notifications
   - Ensured that only one toast is shown per consumption:
     - Out-of-combat: `handleEatItem` shows a single `Restored X health!` toast (if heal applied) or `Ate X` otherwise.
     - In-combat: `CombatModal` shows the heal toast; the generic `Used <item>` toast is suppressed when an item healed the player.

3. Inventory & UI Integration
   - Inventory removal occurs via `handleGameUpdate({ removedItems: [...] })` for out-of-combat consumption and via `onInventoryUpdate` for in-combat usage.
   - Inventory updates are processed by `App.tsx` and the UI updates immediately.

4. Integration with Stats & Gameplay
   - Hunger/thirst/fatigue are updated out-of-combat through `handleEatItem` and in-combat are recorded in `CombatState.survivalDelta` when food is consumed.
   - Capped healing respects max health in both combat and adventure flows.

---

## Files Changed
- `App.tsx`
  - `handleEatItem`: derive default health restore and show a single heal toast.
  - Removed duplicate toasts after calling `handleEatItem`/`handleDrinkItem` in the `handleUseItem` legacy handler.
- `components/CombatModal.tsx`
  - Suppressed the generic "Used <item>" toast when a heal toast was already shown for item consumption in combat.
- `services/combatService.ts`
  - When consuming `food`/`drink` as an item in combat, apply the same healing formula and record hunger/thirst deltas in `newState.survivalDelta`.

---

## Logic Decisions & Rationale
- Use nutrition as canonical source for food effects (consistent with `nutritionData.ts`). If an item explicitly describes a stat change, `parseConsumableVitals` is honored first; otherwise a reasonable default heal is derived from the hunger reduction.
- Keep UX consistent: combine multi-stats into a single toast when multiple vitals are restored.
- For in-combat food consumption we track survival deltas on the combat state so hunger reduction is not lost; final persistence happens on combat end as part of normal combat resolution.

---

## Testing & Verification Steps
Manual checks performed:
1. Out-of-combat eating:
   - Eat 'bread' (no explicit heal) → health increases by the default formula, hunger decreases, single green toast shown: "Restored X health!"
   - Eat a food with explicit description like "restores 20 health" → health increases by 20 and toast shows "Restored 20 health!"
   - Inventory item quantity decreases by 1 and UI updates immediately

2. In-combat eating:
   - Use food during combat -> health increases immediately (floating heal/animation), hunger delta recorded in `CombatState.survivalDelta`, inventory decreased by 1, single green heal toast, no "Used" duplicate

3. Drinks and special items:
   - Drinks apply thirst reductions and any declared stat effects, single toast behavior mirrors food

Build & Integration:
- Ran dev server and ensured HMR works and no parse/type errors introduced.

---

## Blockers / Known Limitations
- Combat consumption records hunger/thirst deltas on `CombatState.survivalDelta`, which is then available to be included in `onCombatEnd` and merged into character needs. If you want immediate, persistent needs changes during combat (persisted before combat ends), we can also call `handleGameUpdate` directly from the CombatModal, but that would write to character persistence mid-combat. Current approach keeps the changes local to the combat state and applies them once combat finishes to avoid excessive mid-combat saves.

---

If you want, I can now add automated unit tests for the `handleEatItem` behavior and `executePlayerAction` food branch to lock in these invariants. Which would you prefer next?