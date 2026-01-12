# Skyrim Aetherius – Sleeping & Resting System

## Overview
This specification defines the **Sleeping & Resting** system for Skyrim Aetherius.  
Sleeping and resting should restore **health, stamina, and magicka**, and advance game time correctly.  
All changes must be implemented at the **codebase level**, no data migrations.  
The AI agent must **update the Status field** after completing or attempting each task and generate a report.

---

## Feature / Bugfix Tasks

### 1. Sleeping & Resting Stat Recovery
**Requirements:**
- Sleeping and resting must restore:
  - **Health**
  - **Stamina**
  - **Magicka**
- Recovery values should scale appropriately (based on sleep/rest duration, modifiers, or player stats if defined)
- Values must be **clamped**:
  - Health cannot exceed max health
  - Stamina cannot exceed max stamina
  - Magicka cannot exceed max magicka
- Recovery applies both in **out-of-combat** and optionally in **combat scenarios** if allowed by design

**Acceptance Criteria:**
- Sleeping or resting increases all three stats
- Stats never exceed their maximum values
- UI shows stat changes correctly
- Logs/events reflect the recovery
**Status:** ✅ DONE  

---

### 2. Game Time Advancement
**Requirements:**
- Time spent sleeping or resting must advance the **global game time**
- The time advancement should match the same behavior as the adventure tab
- If applicable, events that are time-dependent (quests, encounters) must update correctly

**Acceptance Criteria:**
- Sleeping/resting advances game time
- Time advancement is reflected globally
- Events or adventure timers respond correctly
**Status:** ✅ DONE  

---

### 3. UI & Feedback
**Requirements:**
- Provide a modal or interface for sleeping/resting
- Display:
  - Duration of sleep/rest
  - Expected stat recovery
  - Game time advancement
- Logs or notifications show which stats were recovered

**Acceptance Criteria:**
- Modal/interface visible and functional
- Recovery values displayed correctly
- Stat updates reflected immediately in UI
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

   `/docs/SLEEPING_RESTING_REPORT.md`

   This report must include:
   - Tasks implemented
   - Files/components changed
   - Logic decisions taken
   - Any blockers or partial implementations
   - Testing outcomes / verification steps

4. Ensure stat recovery is clamped and correctly updates player state
5. Ensure time advancement integrates with global game time
6. Ensure UI reflects recovery and time passage dynamically
7. Do not modify unrelated systems

---

### Notes
- Recovery must be **code-level**, no placeholder values or hard-coded increments
- UI must dynamically reflect stat changes and time passage
- System should be extensible for modifiers, potions, or perks that affect resting efficiency
