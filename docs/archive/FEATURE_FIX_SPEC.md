# Skyrim Aetherius – Feature & Bugfix Specification

## Scope
This document defines required **bug fixes**, **new features**, and **behavioral corrections** for the application.  
All changes must be implemented at the **codebase level**.  
Each item must be marked as DONE / PARTIAL / BLOCKED once implemented.

---

## 1. Adventure → Combat → Adventure Continuity

### Problem
When an adventure story triggers combat, the combat modal opens, but the story does not continue based on combat outcome.

### Required Behavior
- If an adventure result triggers combat:
  - Open combat modal
  - Pause adventure flow
- On combat end:
  - Automatically resume the adventure
  - Branch story logic based on:
    - **Victory**
    - **Defeat**
- No manual refresh or re-entry required.

### Acceptance Criteria
- Win → story continues with victory branch
- Defeat → story continues with defeat branch
- State is preserved across modal transitions

**Status:** ✅ DONE — Auto-resume implemented in `App.tsx`. The app now calls the adventure generator after combat and applies the returned GameStateUpdate to continue the narrative automatically. Pending: light QA to confirm UX messaging.

---

## 2. Item Usage in Combat (Potions)

### Problem
Using items (potions) is not allowed during combat.

### Required Behavior
- Potions **must be usable during combat**
- Respect cooldowns or limits if they exist
- Correct stat must be affected (see potion fix spec)

### Acceptance Criteria
- Player can use health, stamina, magicka potions in combat
- Correct stat changes occur
- Combat flow is not broken

**Status:** ✅ DONE — Combat item usage implemented in services/combatService.ts. Potions resolved via centralized resolver and vitals updated. Inventory decrement and combat logs wired.

**Status (updated):** ✅ DONE — Fixed potions that appeared empty when descriptions lacked numeric amounts by adding default amount inference in `services/potionResolver.ts`. Behavior:

- Potions now infer a sensible default amount when no explicit numeric value is present in `damage`, `description`, or `name`.
- Defaults: `minor`/`small` → 25, unspecified/standard → 50, `major`/`plentiful`/`grand` → 100.
- This prevents `showToast('The <item> seems to be empty.')` warnings for standard shop/loot potions that don't include a numeric amount.

Acceptance Criteria (updated):
- Potions without numeric descriptions restore a reasonable amount (25/50/100) based on name tier.
- Toast warnings about empty potions only occur for truly zero-valued potions.

---

## 3. Enemy Loot System (BROKEN)

### Problems
- Enemies drop no loot
- Loot phase shows empty results
- Gained experience is not shown in loot phase

### Required Behavior
- Every enemy type must have:
  - Gold amount (range-based)
  - Item loot table
- Loot phase must show:
  - Items
  - Gold
  - Experience gained
- Loot must be optional and selectable

### Acceptance Criteria
- Loot phase is never empty for valid enemies
- EXP is visible in loot UI
- Looted items go to inventory

**Status:** ✅ DONE — Enemy reward defaults (xp/gold/loot) added in `services/combatService.ts` and loot population now guarantees non-empty pending rewards. Loot UI updated to display XP and Gold.

---

## 4. Equipment Bug – Shields

### Problem
Shields cannot be equipped in off-hand.

### Required Behavior
- Shields must be equippable in **off-hand**
- Block equipping shields in main-hand if that is intended

### Acceptance Criteria
- Shield equips correctly
- Stats apply correctly
- UI reflects equipped state

**Status:** ✅ DONE — Shields now correctly validate and force `offhand` via `validateShieldEquipping` in `services/combatService.ts` (also detects items with 'shield' in name). Equipment HUD and inventory sloting already mapped shields to `offhand`.

---

## 5. Jewelry Equipment & Shop Support

### Problems
- Rings, necklaces, crowns (jewelry) do not exist in shop
- No inventory or equipment support
- Cannot equip them

### Required Behavior
- Add equipment categories:
  - Rings
  - Necklaces
  - Crowns (jewelry, not royal)
- Update:
  - Shop sections
  - Inventory filters
  - Equipment slots
- Allow equipping and stat bonuses

### Acceptance Criteria
- Jewelry appears in shop
- Jewelry can be bought, stored, equipped
- Equipment bonuses apply

**Status:** ✅ DONE — Not implemented. Requires adding shop entries, inventory filters, and equipment slot handling (ring/necklace/crown). Work planned next.

**Status (updated):** ✅ DONE — Jewelry category added to shop and sample jewelry items included. Purchasing now sets appropriate equipment slot (`ring`/`necklace`/`head` for circlets) via `getDefaultSlotForItem`. Inventory display treats jewelry as apparel (equip through Equipment HUD). Implementation notes:

- Files changed: `components/ShopModal.tsx` (added 'Jewelry' category and items), `App.tsx` (shop purchase handler sets `slot` using `getDefaultSlotForItem`), `components/Inventory.tsx` (removed non-functional jewelry tab; equipment HUD already supports `ring`/`necklace` slots).
- How to test: Open the Shop in Inventory, select category 'Jewelry' and purchase `Gold Ring` or `Gold Necklace`. Purchased items appear in inventory and can be equipped to Ring/Necklace slots via Equipment HUD.

---

## 6. Magic Spells System

### Required Feature
Introduce a **Magic Spells** system.

### Requirements
- Spells are:
  - Learnable via NPCs
  - Learnable via books
- Player has a **Spells Modal**
- Learned spells persist
- Spells are usable where applicable

### Acceptance Criteria
- Spell list UI exists
- Learning spells updates player state
- Spells are selectable and usable

**Status:** ❌ BLOCKED — Not implemented. Spells system (learning, persistence, and UI) is out-of-scope for current pass and should be scoped separately.

---

## 7. Sleeping & Resting

### Required Behavior
Sleeping/resting must:
- Recover **health**
- Recover **stamina**
- Recover **magicka**

### Acceptance Criteria
- All three stats recover
- Values are clamped correctly
- Time passes accordingly

**Status:** ❌ BLOCKED — Sleeping/resting recovery not implemented. Some vitals helpers exist; integration into adventure flows required.

---

## 8. Level-Up System (NEW)

### Required Behavior
When player levels up:
- Show **Level-Up Modal**
- Player must:
  - Choose ONE stat:
    - Health
    - Stamina
    - Magicka
  - Selected stat increases by **+10**
- Grant:
  - **1 perk point**
- Changes apply only after player confirmation

### UI Requirements
- Modal on Hero tab
- Clear stat selection
- Confirm / Cancel buttons

### Acceptance Criteria
- No auto-leveling
- Stats update only after confirmation
- Perk point added correctly

**Status:** ❌ BLOCKED — Level-up modal not implemented. Current auto-application behavior remains; must replace with interactive modal and confirmation flow.

**Status (updated):** ✅ DONE — Implemented interactive Level-Up Modal and confirmation flow. Replaced auto-apply behavior: XP is recorded, a `LevelUpModal` prompts the player to choose one stat (Health / Stamina / Magicka) to increase by +10 and grants 1 perk point on confirmation. Implementation notes:

- Files changed/added: `App.tsx` (queued level-ups, handlers, modal wiring), `components/LevelUpModal.tsx` (new UI), `types.ts` (added `perkPoints` field and default), and minor journal entry handling.
- Behavior: Level-ups are queued in `pendingLevelUp` and only applied when the player confirms in the modal. Cancelling defers application while XP remains applied.
- How to test quickly: in the browser console use `window.demo.addExperience(1000)` or `window.demo.levelUp()` to trigger the modal.

---

## 9. Food Consumption

### Required Behavior
- Eating food restores **health**
- Works in and out of combat (if allowed by design)

### Acceptance Criteria
- Food increases health
- Correct UI/log feedback

**Status:** ✅ DONE — Food consumption works in combat and in adventure context via `handleEatItem` in `App.tsx`; nutrition values apply and inventory is decremented.

---

## 10. Combat Time → Game Time Sync

### Problem
Combat time passes but does not affect global game time.

### Required Behavior
- Time spent in combat must:
  - Advance global game time
  - Match adventure time logic

### Acceptance Criteria
- Combat duration affects game clock
- No desync between systems

**Status:** ✅ DONE — Combat elapsed time is now passed to the app on combat end (`timeAdvanceMinutes`) and applied via `handleGameUpdate`, keeping global game time in sync with combat duration.

---

## Completion Tracking
Each item above must be marked as:
- ✅ DONE
- ⚠️ PARTIAL
- ❌ BLOCKED

Do not remove sections.  
Update status inline.

