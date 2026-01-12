# Skyrim Aetherius – Inventory Item Quantity Toggle

## Overview
This specification defines a **toggle feature for item quantity controls** in the inventory.  
Currently, users can add/remove items via buttons or number input fields on item cards. These can break immersion. The goal is to **hide these controls by default**, allow toggling them visible, and keep the **drop button always visible**.

All changes must be implemented at the **codebase level**, no migrations or manual edits.  
The AI agent must **update the Status field** and generate a report after implementation.

---

## Feature / Bugfix Tasks

### 1. Hide Quantity Controls by Default
**Requirements:**
- Item quantity controls (increment/decrement buttons, number input areas) should be **hidden by default** in all inventory areas:
  - Inventory modal
  - Equipment modal (if applicable)
  - Shop modal (optional)
- “Drop” button must **remain visible** and functional
- Hiding must not break any existing functionality

**Acceptance Criteria:**
- On initial load, quantity controls are hidden
- Drop button remains visible and usable
- No visual or functional glitches

**Status:** ⚠️ Pending / ✅ DONE / ❌ BLOCKED  

---

### 2. Toggle Visibility for Quantity Controls
**Requirements:**
- Add a **toggle switch/button** to show/hide quantity controls
- Toggle affects **all inventory areas consistently**
- Toggle state should **persist within the current session**
- Toggle does **not affect the drop button**

**Acceptance Criteria:**
- Toggle button visible in inventory UI
- Clicking toggle shows/hides quantity controls
- Drop button unaffected
- UI updates dynamically when toggled

**Status:** ⚠️ Pending / ✅ DONE / ❌ BLOCKED  

---

### 3. UI & Feedback
**Requirements:**
- When hidden, quantity controls must not be accessible or clickable
- When shown, quantity controls fully functional
- Visual feedback when toggled (e.g., button highlight or tooltip)
- Toggle should be intuitive and non-intrusive

**Acceptance Criteria:**
- Hidden controls do not interfere with other UI
- Toggle visually indicates current state
- User can easily switch between hidden/shown
- No visual glitches in inventory/equipment/shop

**Status:** ⚠️ Pending / ✅ DONE / ❌ BLOCKED  

---

## Progress Tracking

**Instructions for AI Agent:**
1. Implement all tasks in the spec at the **codebase level**
2. After completing each task, update the **Status** field:
   - ✅ DONE → fully implemented and tested
   - ⚠️ PARTIAL → partially implemented, issues remain
   - ❌ BLOCKED → cannot implement (include reason)
3. Create a **secondary report file** after implementation:

   `/docs/INVENTORY_ITEM_TOGGLE_REPORT.md`

   This report must include:
   - Tasks implemented
   - Files/components changed
   - Logic decisions taken
   - Any blockers or partial implementations
   - Testing outcomes / verification steps

4. Ensure toggle hides/shows quantity controls dynamically
5. Ensure drop button always remains visible and functional
6. Ensure toggle state persists during session
7. Ensure system works consistently across all inventory/equipment/shop areas
8. Do not modify unrelated systems

---

### Notes
- System should be **extensible** for future enhancements:
  - Player preferences (persist across sessions)
  - Quick-access toggles for other inventory features
- Must preserve immersion by default hiding quantity controls
- Drop button must always remain visible
