# Skyrim Aetherius – Combat Bugfixes & Feature Enhancements

## Overview
This specification defines **critical combat bugfixes and enhancements**.  
The goal is to improve combat realism, usability, and bug-free flow, including:

- Preventing attacks on defeated enemies
- Adding equipment modal access during combat
- Correctly handling stunned enemies
- Fixing post-combat loot screen and victory display

All changes must be implemented at the **codebase level**, no migrations or manual edits.  
The AI agent must **update the Status field** and generate a report after implementation.

---

## Feature / Bugfix Tasks

### 1. Prevent Attacks on Defeated Enemies
**Requirements:**
- Defeated enemies should:
  - Be visibly marked as defeated
  - Be **unselectable** for attacks or abilities
  - Be excluded from targeting lists
- Combat logic must skip any action directed at defeated enemies

**Acceptance Criteria:**
- Player cannot target or attack defeated enemies
- UI visually indicates defeated status
- Combat logic ignores defeated enemies

**Status:** ✅ DONE  

---

### 2. Equipment Modal Access During Combat
**Requirements:**
- Player must be able to open **Equipment Modal** during combat
- Equipping or unequipping items updates combat stats in real-time
- Modal must be non-blocking to combat flow
- Integration with favorites, upgrades, dual-wield, and other item-related systems

**Acceptance Criteria:**
- Equipment modal opens during combat
- Changes to equipment immediately affect combat stats
- UI remains responsive and functional
- No crashes or glitches

**Status:** ✅ DONE  

---

### 3. Stunned Enemy Turn Handling
**Requirements:**
- Stunned enemies:
  - Skip their turn automatically
  - Cannot perform attacks, abilities, or actions
- Combat log should reflect skipped turn
- Duration of stun properly decreases per turn

**Acceptance Criteria:**
- Stunned enemies do not act
- Turn advances to the next entity correctly
- Combat log displays skipped turn
- Stun duration is decremented correctly

**Status:** ✅ DONE  

---

### 4. Post-Combat Loot / Victory Screen Fix
**Requirements:**
- After combat is won:
  - Loot modal appears correctly
  - Victory modal appears only once if implemented
  - No flickering or disappearing screens
- Ensure integration with experience gain, item drops, and loot UI

**Acceptance Criteria:**
- Loot modal opens and remains visible until player closes
- Victory screen displays correctly (if implemented) without flicker
- Loot, experience, and gold are displayed correctly
- No UI conflicts with previous combat modal or other screens

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

   `/docs/COMBAT_BUGFIXES_REPORT.md`

   This report must include:
   - Tasks implemented
   - Files/components changed
   - Logic decisions taken
   - Any blockers or partial implementations
   - Testing outcomes / verification steps

4. Ensure defeated enemies are unselectable and skipped in targeting
5. Ensure equipment modal opens during combat and updates stats immediately
6. Ensure stunned enemies skip their turn and log correctly
7. Investigate and fix post-combat loot/victory screen behavior
8. Integrate all fixes with combat, adventure, and inventory systems
9. Do not modify unrelated systems

---

### Notes
- System should be **extensible** for future combat features (crowd control effects, status effects, UI improvements)
- All combat bugfixes must maintain turn-based logic integrity
- UI feedback and combat log clarity are crucial for player experience
