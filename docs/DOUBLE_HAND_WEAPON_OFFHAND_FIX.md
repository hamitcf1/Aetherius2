# Skyrim Aetherius – Double-Handed Weapon Off-Hand Bugfix

## Overview
This specification defines the **Double-Handed Weapon / Off-Hand behavior** in Skyrim Aetherius.  
Currently, players can equip weapons in the off-hand even when a double-handed weapon is equipped, which is **not intended**.  
This fix ensures proper logic for off-hand availability and automatic unequipping when conflicting weapons are equipped.

All changes must be implemented at the **codebase level**, no migrations or manual edits.  
The AI agent must **update the Status field** and generate a report after implementation.

---

## Feature / Bugfix Tasks

### 1. Disable Off-Hand When Double-Handed Weapon Equipped
**Requirements:**
- When a **double-handed weapon** (e.g., greatsword, battle axe, bow) is equipped in the main hand:
  - Off-hand slot becomes **unavailable** / disabled
  - If an off-hand item was previously equipped, it is **automatically unequipped**
- Player cannot manually equip any weapon in the off-hand while a double-handed weapon is equipped

**Acceptance Criteria:**
- Equipping a double-handed weapon disables off-hand slot
- Any previously equipped off-hand weapon is removed automatically
- UI reflects off-hand slot as unavailable
- Player cannot bypass the restriction
**Status:** ✅ DONE

---

### 2. Unequip Main Hand When Off-Hand Weapon Equipped
**Requirements:**
- If the player equips a weapon in the off-hand **while a double-handed weapon is in main hand**:
  - Double-handed weapon is **automatically unequipped**
  - Off-hand weapon equips normally
- UI updates dynamically to reflect the change

**Acceptance Criteria:**
- Equipping an off-hand weapon removes any conflicting double-handed weapon
- UI updates immediately
- No duplication of weapons or stats
**Status:** ✅ DONE

---

### 3. UI & Feedback
**Requirements:**
- Off-hand slot must visually indicate when unavailable due to double-handed weapon
- Tooltip or icon can indicate reason (e.g., “Disabled due to double-handed weapon”)
- Dynamic updates when equipping / unequipping weapons

**Acceptance Criteria:**
- Off-hand slot shows disabled state when applicable
- Tooltips/indicators appear correctly
- UI remains functional and intuitive
**Status:** ✅ DONE

---

### 4. Integration with Inventory & Equipment Modal
**Requirements:**
- Equipment modal must enforce rules consistently:
  - Disabling/enabling off-hand slot
  - Automatic unequip logic
- Works with all inventory management features (favorites, upgrades, dual-wield, etc.)

**Acceptance Criteria:**
- Equipment modal enforces off-hand rules without bugs
- Integration with other systems works seamlessly
- No crashes or broken states
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

   `/docs/DOUBLE_HAND_WEAPON_OFFHAND_REPORT.md`

   This report must include:
   - Tasks implemented
   - Files/components changed
   - Logic decisions taken
   - Any blockers or partial implementations
   - Testing outcomes / verification steps

4. Ensure off-hand slot disables automatically for double-handed weapons
5. Ensure automatic unequipping works in both directions
6. Ensure UI updates dynamically and clearly indicates slot state
7. Ensure integration with inventory/equipment modal and other features is consistent
8. Do not modify unrelated systems

---

### Notes
- System should remain **extensible** for future weapon types or perks affecting dual-wielding
- Must preserve immersion by enforcing realistic equipment restrictions
- Automatic unequipping logic must be safe and prevent item duplication
