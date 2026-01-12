# Skyrim Aetherius – Favorites System

## Overview
This specification defines the **Favorites System** for Skyrim Aetherius.  
Players should be able to **mark items as favorites**, and view them in a **dedicated Favorites category** in inventory, equipment, and shop contexts.  

All changes must be implemented at the **codebase level**, no migrations or database edits.  
The AI agent must update the **Status field** and generate a report after implementation.

---

## Feature / Bugfix Tasks

### 1. Marking Items as Favorites
**Requirements:**
- Players can mark/unmark items as **favorites** in:
  - Inventory modal
  - Equipment modal
  - Shop modal (optional)
- Favorites are visually indicated:
  - Star icon or highlight
  - State persists until manually changed
- Centralized flag in item object:
  - `isFavorite: boolean`

**Acceptance Criteria:**
- Player can toggle favorite state for any eligible item
- UI updates immediately
- Favorite state is stored in player state and persists across sessions

**Status:** ✅ DONE

---

### 2. Favorites Category / Filter
**Requirements:**
- Create a **Favorites category** in:
  - Inventory modal
  - Equipment modal (if applicable)
  - Shop modal (optional)
- Players can filter inventory/equipment to show only favorite items
- Favorites list respects:
  - Item type
  - Equipped state
  - Sorting options

**Acceptance Criteria:**
- Favorites category/filter visible and functional
- Filtering shows only favorite items
- Switching between categories updates UI correctly

**Status:** ✅ DONE

---

### 3. UI & Feedback
**Requirements:**
- Items marked as favorite must:
  - Show an icon or highlight
  - Show tooltip “Favorite” when hovered
- Modal or filter buttons must be intuitive
- Toggling favorite state must not break other UI interactions

**Acceptance Criteria:**
- Favorite icon appears correctly
- Tooltip shows when hovering
- Filter category updates instantly
- No visual glitches or broken states

**Status:** ✅ DONE

---

### 4. Persistence
**Requirements:**
- Favorite state must persist per player across sessions
- Changes must update **centralized player state**
- Must integrate seamlessly with inventory/equipment logic

**Acceptance Criteria:**
- Marked favorites remain marked after reload
- Unmarked favorites remain unmarked after reload
- UI correctly reflects persisted states

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

   `/docs/FAVORITES_REPORT.md`

   This report must include:
   - Tasks implemented
   - Files/components changed
   - Logic decisions taken
   - Any blockers or partial implementations
   - Testing outcomes / verification steps

4. Ensure favorite functionality integrates with:
   - Inventory
   - Equipment
   - Shop (optional)
5. Ensure UI updates dynamically when favorite state changes
6. Do not modify unrelated systems or features

---

### Notes
- Favorites system should be **extensible**, allowing future integration with:
  - Quick-access bars
  - Crafting filters
  - Adventure loot highlighting
- Favorites are **player-specific** and must not affect other users’ inventories.
