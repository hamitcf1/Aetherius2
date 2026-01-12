# Skyrim Aetherius – Combat Loot Duplication Fix

## Overview
Currently, when combat occurs via the **combat modal**, players receive loot and experience through the **combat loot system**.  
However, the **adventure AI** may also grant the same items, gold, or experience in its story flow, leading to **duplication of rewards**.  

This fix ensures that **combat rewards are only granted once**, and the adventure AI respects combat outcomes.

---

## Feature / Bugfix Tasks

### 1. Track Combat Completion
**Requirements:**
- Mark each enemy and combat encounter as **completed** once combat ends
- Track whether **loot and experience have already been awarded**
- Store this flag in the **combat/adventure state object**

**Acceptance Criteria:**
- Completed combat encounters are flagged
- Loot and XP granted only once
- Adventure AI can check combat completion status

**Status:** ✅ DONE  

---

### 2. Prevent Adventure AI from Re-Granting Rewards
**Requirements:**
- Adventure AI must check the combat completion flag before granting loot or XP
- If combat has already occurred:
  - Do not add duplicate items
  - Do not add duplicate gold
  - Do not add duplicate experience
- Ensure adventure AI continues the story without skipping

**Acceptance Criteria:**
- Adventure AI does not duplicate combat rewards
- Story flow continues normally
- Inventory and stats remain consistent

**Status:** ✅ DONE  

---

### 3. Integration With Loot System
**Requirements:**
- Combat modal loot system and adventure AI system must **share a consistent state**
- Items, gold, and experience must update inventory only once
- Ensure all UI components (inventory modal, adventure log, hero stats) reflect correct totals

**Acceptance Criteria:**
- Combat loot correctly applies once
- Adventure UI does not duplicate rewards
- Inventory, gold, and XP totals are accurate

**Status:** ✅ DONE  

---

### 4. UI & Feedback
**Requirements:**
- Adventure log must show story text without duplicating rewards
- If combat loot is already given, adventure AI may summarize results without re-awarding
- Optional: visually indicate “loot already claimed” in adventure log

**Acceptance Criteria:**
- No duplicate rewards in UI
- Story and log remain readable
- Player sees correct inventory, gold, and XP

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

   `/docs/COMBAT_LOOT_DUPLICATION_REPORT.md`

   This report must include:
   - Tasks implemented
   - Files/components changed
   - Logic decisions taken
   - Any blockers or partial implementations
   - Testing outcomes / verification steps

4. Ensure combat loot is granted **only once**
5. Adventure AI must check combat completion before granting rewards
6. Inventory, gold, and experience totals must remain consistent
7. UI must reflect correct rewards without duplication
8. Integrate with all existing combat, adventure, and inventory systems
9. Do not modify unrelated systems

---

### Notes
- System should remain extensible for multi-enemy encounters or chained battles
- Combat completion flags must persist across sessions
- Optional: implement a tooltip or log note indicating “combat loot already claimed” to avoid confusion
