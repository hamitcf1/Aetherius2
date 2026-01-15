# Skyrim Aetherius – Potion & Food Toast Message System

## Overview
This specification defines the **Toast Message System** for potion usage and food consumption.  
Currently, all potions show the same green toast message. This must be fixed so that toast messages **reflect the stat affected**. Food consumption must also display **stat recovery indicators** and unique toast colors.

All changes must be implemented at the **codebase level**, no migrations or manual edits.  
The AI agent must update the **Status field** and generate a report after implementation.

---

## Feature / Bugfix Tasks

### 1. Potion Toast Colors
**Requirements:**
- Toast message color must reflect potion type:
  - **Health potions** → red
  - **Stamina potions** → green (unchanged)
  - **Magicka potions** → blue
- Toast message should show:
  - Stat affected
  - Amount recovered
- Stat recovery must reflect actual game state

**Acceptance Criteria:**
- Health potion usage → red toast showing health recovered
- Stamina potion usage → green toast showing stamina recovered
- Magicka potion usage → blue toast showing magicka recovered
- Toast values match actual stat increases

**Status:** ✅ DONE  

---

### 2. Food Consumption Toast
**Requirements:**
- Eating food must:
  - Recover health (if applicable)
  - Display toast message with unique color (e.g., orange or yellow)
  - Indicate which stat(s) are recovered (health, stamina, magicka)
- Food toast should **not duplicate potion colors**
- Toast must trigger on consumption only, dynamically updated based on stat effect

**Acceptance Criteria:**
- Eating food triggers toast
- Stat recovery is indicated correctly
- Toast color differs from potion colors
- UI reflects stat change immediately

**Status:** ✅ DONE  

---

### 3. UI & Feedback
**Requirements:**
- Toast system must dynamically reflect:
  - Type of potion or food
  - Amount of stat recovered
- No overlap of messages
- Colors consistent with specifications
- Logs / combat UI should also update where relevant

**Acceptance Criteria:**
- Toast messages are visually distinct
- Toast messages reflect actual stat changes
- Messages update in real-time
- No UI glitches or wrong color assignment

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

   `/docs/POTION_FOOD_TOAST_REPORT.md`

   This report must include:
   - Tasks implemented
   - Files/components changed
   - Logic decisions taken
   - Any blockers or partial implementations
   - Testing outcomes / verification steps

4. Ensure toast messages dynamically reflect the **correct stat type and recovery amount**
5. Ensure color coding is consistent:
   - Health → red
   - Stamina → green
   - Magicka → blue
   - Food → distinct (orange/yellow)
6. Ensure messages are not duplicated or overlapping
7. Ensure stat recovery is applied before toast triggers
8. Do not modify unrelated systems

---

### Notes
- This system should be **extensible** for future items:
  - New potion types
  - Special food or consumables with buffs
- Integrates with combat and adventure modules
- Toast system must reflect **real-time stat changes**
