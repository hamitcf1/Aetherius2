# Adventure UI & Combat System Fixes (v3)

## Scope
This document defines UI fixes, combat flow corrections, and loot system improvements.
All changes must be tracked and reported via a failsafe report file.

---

## 1. Navigation Bar Changes

### Required Changes
- Move **Adventure** tab:
  - New order:
    1. Inventory (renamed)
    2. Adventure
    3. Quests
- Rename **Items** tab → **Inventory**
- Ensure:
  - Routing remains intact
  - Active tab highlighting still works
  - No regressions in navigation state

### Acceptance Criteria
- Adventure tab is visually and logically positioned between Inventory and Quests.
- Items label is fully replaced with Inventory (no leftover references).

---

## 2. Adventure Text Input Redesign

### Problem
Current text input:
- Breaks visual consistency
- Does not match project theme
- Looks like a default HTML textarea

### Required Fix
- Replace with **custom-designed input component**:
  - Matches project UI theme
  - Styled borders, padding, background, focus states
  - Supports multiline input
  - Clear distinction between:
    - Player input
    - System / story output

### Acceptance Criteria
- Input visually integrates with Adventure UI.
- No default browser styling visible.
- Keyboard and mobile behavior preserved.

---

## 3. Combat → Story Continuation (Auto-Flow)

### Problem
After combat ends:
- Story does not continue automatically
- Player is left in a dead-end state

### Required Feature
- After combat resolution:
  - Story must **automatically continue**
  - Continuation depends on combat outcome (win / loss / escape)
- May require:
  - AI-based parsing of combat log
  - Structured combat result object

### Implementation Notes
- Combat system must emit a **final combat result**:
  - Winner
  - Surviving entities
  - Player status
- Story engine consumes this result and continues narration.

### Acceptance Criteria
- No manual input required to resume story after combat.
- Story text reflects combat outcome correctly.

---

## 4. Combat Victory Result Cleanup

### Problem
- Old and new combat win systems coexist
- Duplicate or conflicting victory outputs
- Separate victory screen is unnecessary

### Required Fix
- Remove legacy combat victory logic.
- Keep **only the most relevant and up-to-date combat result**.
- No standalone victory screen.
- Combat result should be:
  - Inline
  - Compact
  - Directly followed by story continuation

### Acceptance Criteria
- Only one combat result output exists.
- No duplicated victory messages.
- No modal or separate victory screen.

---

## 5. Loot System Expansion

### Problem
- Looting is minimal or nonexistent
- Enemies often drop nothing

### Required Feature
- Almost every enemy and entity should have loot.
- Loot types may include:
  - Gold / currency
  - Consumables
  - Equipment
  - Crafting materials
- Loot quantity and rarity can scale with:
  - Enemy type
  - Enemy level
  - Encounter difficulty

### Implementation Notes
- Loot table system recommended.
- Loot should be awarded automatically after combat resolution.
- Loot must be logged and added to Inventory.

### Acceptance Criteria
- Majority of enemies drop loot.
- Loot is visible, added to inventory, and usable.
- No empty combat rewards unless explicitly designed.

---

## 6. Modularity & Safety

### Requirements
- All fixes must be:
  - Modular
  - Reversible
  - Logged
- No hard coupling between:
  - UI
  - Combat
  - Story engine
  - Inventory

---

## 7. Reporting & Failsafe

### Output File
`adventure_ui_combat_report_v3.md`

### Report Must Include
- Applied fixes ✔
- New features ✔
- Partial or failed items ⚠
- Short technical explanation for ⚠ items

Example:
```markdown
## Applied
- Adventure tab repositioned ✔
- Items renamed to Inventory ✔
- Custom adventure input implemented ✔
- Auto story continuation after combat ✔
- Legacy combat victory logic removed ✔
- Loot tables implemented ✔

## Issues
- AI combat parsing edge cases ⚠ (multi-entity battles)
