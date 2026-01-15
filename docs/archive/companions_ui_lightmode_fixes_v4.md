# Companions, UI Layout & Light Mode Fixes (v4)

## Scope
This document defines companion management improvements, UI layout corrections, and light mode fixes.
All changes must be logged in a failsafe report file.

---

## 1. Companion Equipment Management

### Required Feature
- Companion management must include **equipment management**.
- Use the **same equipment modal system** as the player character.

### Equipment Rules
- Equipment items:
  - Are sourced from the **player’s inventory**
  - Cannot be equipped by both player and companion at the same time
- Once an item is equipped by:
  - Player → item becomes unavailable to companions
  - Companion → item becomes unavailable to player and other companions

### State Management
- Equipment ownership must be explicit:
  - `equippedBy: player | companionId | null`
- Prevent:
  - Duplicate item usage
  - Shared references causing desync bugs

### Acceptance Criteria
- Companions can equip and unequip items.
- Item availability updates immediately.
- No item can be equipped by more than one entity at once.

---

## 2. Companion Modal Text Input Styling

### Problem
- Companion modals use inconsistent or default text input styling.

### Required Fix
- Companion modal text input areas must:
  - Match the **custom text input design** used elsewhere in the project
  - Share:
    - Colors
    - Borders
    - Padding
    - Focus / active states
- No default browser styling.

### Acceptance Criteria
- Visual consistency across all text input areas.
- Companion modals visually aligned with Adventure and other UI components.

---

## 3. Hero Page Layout Fixes

### 3.1 Manage Companions Button Position

#### Required Change
- Move **Manage Companions** button:
  - Next to the **Spells** button on the Hero page
- Ensure:
  - Visual balance
  - No layout break on mobile

#### Acceptance Criteria
- Button is repositioned correctly.
- Navigation behavior unchanged.

---

### 3.2 Perk Points & Max Stats Swap

#### Required Change
- Swap positions of:
  - **Perk Points** area
  - **Max Stats** area

#### Acceptance Criteria
- New layout is visually clear.
- No logic or state regression.

---

## 4. Light Mode Fixes

### Problem
- Light mode is visually inconsistent and unpleasant.
- Poor contrast and theme mismatch.

### Required Fix
- Review and adjust:
  - Background colors
  - Text contrast
  - Borders and dividers
  - Input fields
  - Modals and overlays
- Ensure:
  - Readability
  - Consistency with dark mode layout
  - Accessibility-friendly contrast

### Implementation Notes
- Avoid hardcoded colors.
- Prefer theme variables or tokens.
- Light mode should not be a “dark mode inverted”.

### Acceptance Criteria
- Light mode is readable and visually coherent.
- No broken layouts or illegible text.
- All primary screens tested in light mode.

---

## 5. Modularity & Safety

### Requirements
- Companion equipment logic must be:
  - Decoupled from player equipment logic
  - Reusable
- UI changes must not:
  - Affect combat
  - Affect story flow
- All changes must be reversible.

---

## 6. Reporting & Failsafe

### Output File
`companions_ui_lightmode_report_v4.md`

### Report Format
```markdown
## Applied
- Companion equipment management implemented ✔
- Item ownership locking enforced ✔
- Companion text input styling unified ✔
- Manage Companions button repositioned ✔
- Perk Points and Max Stats swapped ✔
- Light mode styling fixed ✔
- Companion behavior dropdown converted to `DropdownSelector` (supports consistent UI & keyboard selection) ✔
- Sorting components updated to support ascending/descending with `SortSelector` ✔
- Companion AI chat implemented: `chatWithCompanion` + UI integration ✔
- Unit tests added for equipment utils, companion modal, companion dialogue, and sort selector ✔

## Issues
- Edge-case: item reassignment during modal cancel ⚠
- AI response latency: companion chat uses lightweight fallback while waiting for AI; consider showing typing indicator in UI improvements ⚠