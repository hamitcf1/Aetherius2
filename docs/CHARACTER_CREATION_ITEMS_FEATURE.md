# Skyrim Aetherius – Character Creation Item Assignment

## Overview
This specification defines the **item assignment logic during new character creation**.  
When a new character is created—whether through **AI Scribe Chat**, **Import Text**, or **Full Random Generation**—the starting items must come from the **defined available set with stats**, except for miscellaneous items, which may remain free-form.

All changes must be implemented at the **codebase level**, no migrations or manual edits.  
The AI agent must **update the Status field** and generate a report after implementation.

---

## Feature / Bugfix Tasks

### 1. Assign Defined Items to New Characters
**Requirements:**
- When a new character is created:
  - Starting items should be drawn from the **predefined available set**
  - Items must include **all associated stats** (damage, defense, modifiers)
  - Miscellaneous items may remain unrestricted
- Works for:
  - AI Scribe Chat creation
  - Text import creation
  - Full random character generation

**Acceptance Criteria:**
- All newly created characters have only valid items from the defined set
- Stats for each item are correct and match definitions
- Misc items may be unrestricted
- No duplicate or invalid items appear

**Status:** ✅ DONE  

---

### 2. Integration With Item System
**Requirements:**
- Ensure integration with:
  - Inventory modal
  - Equipment modal
  - Combat system (stats must apply correctly)
  - Favorites, upgrade, dual-wield, and other item-related features
- Item assignment must respect all existing item logic:
  - Weapon type
  - Armor type
  - Stat scaling
  - Quantity limits

**Acceptance Criteria:**
- Inventory shows only valid items
- Equipped items display correct stats
- Integration with all item-related features works seamlessly

**Status:** ✅ DONE  

---

### 3. Randomization & AI Scribe Consistency
**Requirements:**
- For AI-generated or text-imported characters:
  - Item assignment must respect the same rules as fully random generation
  - AI Scribe or import process must not bypass item validation
- Ensure consistent item assignment logic across all creation methods

**Acceptance Criteria:**
- AI-generated, imported, and random characters receive items only from the defined set
- Stats match item definitions
- No errors or invalid items assigned

**Status:** ✅ DONE  

---

### 4. UI & Feedback
**Requirements:**
- When character is created:
  - Show inventory with assigned items
  - Display correct stats
  - Highlight if items are misc or free-form
- Dynamic updates should reflect correctly in inventory/equipment modals

**Acceptance Criteria:**
- Inventory modal correctly shows assigned items
- Stats displayed correctly
- No UI glitches
- Player can interact with items normally

**Status:** ✅ DONE  

---

## Progress Tracking

**Instructions for AI Agent:**
1. Implement all tasks in the spec at the **codebase level**
2. After completing each task, update the **Status** field:
   - ✅ DONE → fully implemented and tested
   - ⚠️ PARTIAL → partially implemented, issues remain
   - ❌ BLOCKED → cannot implement (include reason)
3. Create a **secondary report file** after implementation:

   `/docs/CHARACTER_CREATION_ITEMS_REPORT.md`

   This report must include:
   - Tasks implemented
   - Files/components changed
   - Logic decisions taken
   - Any blockers or partial implementations
   - Testing outcomes / verification steps

4. Ensure items are selected only from the defined available set (except misc)
5. Ensure stats are correctly applied and reflected in inventory/equipment
6. Ensure integration with all item-related features (favorites, upgrades, dual-wield, combat)
7. Ensure AI Scribe and import features follow the same logic
8. Do not modify unrelated systems

---

### Notes
- System should be **extensible** for future expansion of available item sets
- Must maintain balance across character creation methods
- Misc items are allowed to remain free-form, but core items must always be validated
