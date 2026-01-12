# Skyrim Aetherius – Inventory / Equipment Modal – Hands Slot & Dual-Wield Fix

## Overview
This specification covers the **hands slot** in the inventory/equipment modal, implementing **dual-wield for small weapons**, proper **shield support**, and correct handling of **two-handed weapons**.  

All changes must be tracked in this MD file. The AI agent should update each section’s status after implementing or attempting each requirement.

---

## Feature / Bugfix Tasks

### 1. Hands Slot Functionality
**Problem:**  
- Current hands slots are featureless; no items can be equipped there.  
- Dual wielding, shield handling, and two-handed weapon logic are missing.

**Requirements:**  
- Introduce **hands slots** in the equipment modal:  
  - **Main hand**  
  - **Off hand**
- Both slots must be capable of holding:
  - Small weapons (daggers, swords, maces) for dual-wield
  - Shields in off hand only
  - Two-handed weapons (greatswords, bows, battle axes) only in main hand
- When a **two-handed weapon** is equipped:
  - Off-hand automatically **unequips**
  - Reflects Skyrim-style behavior
- Dual-wielding:
  - Only small/light weapons can occupy main + off hand
  - Stats and abilities should apply correctly for each equipped weapon

**Acceptance Criteria:**  
- Hands slots visible and interactive in equipment modal
- Off-hand supports shields and dual-wieldable weapons
- Equipping two-handed weapon unequips off-hand automatically
- UI reflects equipped items and slot restrictions
- Character stats update according to equipped items

**Status:** ✅ DONE

---

### 2. Dual-Wield Weapon Support
**Requirements:**  
- Small weapons (daggers, swords, maces) can be equipped in both main and off hand simultaneously  
- Attack animations, damage calculations, and abilities must reflect dual-wielding  
- Prevent equipping:
  - Two-handed weapons in off hand  
  - Shields in main hand (if intended)

**Acceptance Criteria:**  
- Player can dual-wield allowed small weapons  
- Equipping invalid combination is blocked with UI feedback  
- Combat calculations reflect equipped dual weapons

**Status:** ✅ DONE

---

### 3. Shield Support in Off-Hand
**Requirements:**  
- Shields can be equipped **only in off-hand slot**  
- Equipping a shield:
  - Unequips any small weapon in off-hand if present  
  - Updates stats (block, defense, etc.) correctly  

**Acceptance Criteria:**  
- Player can equip shields in off-hand  
- Main-hand weapon remains intact  
- Stats updated correctly

**Status:** ✅ DONE

---

### 4. Two-Handed Weapon Handling
**Requirements:**  
- Two-handed weapons (greatswords, battle axes, bows) can only be equipped in main hand  
- Off-hand slot automatically **unequipped** when a two-handed weapon is equipped  
- Re-equipping off-hand item when two-handed weapon is removed should be allowed  

**Acceptance Criteria:**  
- Player equips two-handed weapon → off-hand unequipped automatically  
- Player unequips two-handed weapon → off-hand available again  
- UI reflects changes and restrictions clearly

**Status:** ✅ DONE

---

### 5. UI / Modal Changes
**Requirements:**  
- Hands slot must be **visible and interactive** in inventory modal  
- Tooltips must show:
  - Item type  
  - Equip restrictions  
  - Current stats  
- Drag-and-drop or click-to-equip supported for main and off-hand slots  

**Acceptance Criteria:**  
- Hands slots are functional in the equipment modal  
- Restrictions and feedback visually clear  
- No UI glitches or broken states when equipping/unequipping  

**Status:** ✅ DONE

---

## Progress Tracking

**Instructions for AI Agent:**  
1. Read this MD file fully before implementing  
2. Implement features and fixes as specified  
3. After completing each task, update the **Status** field:  
   - ✅ DONE → fully implemented and tested  
   - ⚠️ PARTIAL → partially implemented, issues remain  
   - ❌ BLOCKED → cannot implement (include reason)  
4. Create a **secondary file** after implementation:  
   - `/docs/EQUIPMENT_HANDS_REPORT.md`  
   - Report must include:  
     - Tasks implemented  
     - Files/components changed  
     - Logic decisions taken  
     - Any blockers or partial implementations  
     - Testing outcomes / verification steps  
5. Ensure all logic is centralized and reusable  
6. Do not modify unrelated systems  
7. Keep all changes persistent and functional in both **combat** and **inventory modal** contexts  

---

### Notes
- This is a **codebase-level refactor**.  
- No migrations, database changes, or manual item edits are allowed.  
- All behavior must reflect **real RPG mechanics** (Skyrim-style dual wield and two-handed handling).

