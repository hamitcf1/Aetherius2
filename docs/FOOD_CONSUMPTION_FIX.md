# Skyrim Aetherius – Food Consumption Bugfix & Feature

## Overview
Currently, consuming food from the inventory has multiple issues:  

- Eating food **does not heal** the player  
- Toast notifications show **two messages per consumption**  
- Food healing is not reflected in **player stats**  

This fix ensures **food properly heals**, has **one toast message**, and integrates correctly with health and inventory systems.

---

## Feature / Bugfix Tasks

### 1. Enable Healing from Food
**Requirements:**
- Eating food items should **restore health** according to item properties
- Apply correct **stat modifiers** when consumed
- Integration with:
  - Inventory modal
  - Combat system
  - Adventure log if consumed outside combat

**Acceptance Criteria:**
- Health increases correctly when food consumed
- Healing respects max health cap
- Food effects are applied immediately and persist in player stats

**Status:** ✅ DONE  

---

### 2. Correct Toast Notifications
**Requirements:**
- Ensure **only one toast message** appears per food consumption
- Toast must reflect the correct **healing effect**:
  - e.g., green toast indicating health restored
- No duplicate or conflicting messages

**Acceptance Criteria:**
- Single toast per food item consumed
- Correct color and message displayed
- Toast disappears according to normal timing rules

**Status:** ✅ DONE  

---

### 3. Integration With Inventory & UI
**Requirements:**
- Food items must **decrease in quantity** after consumption
- Inventory UI must update immediately
- Favorite food, equipped food, or grouped food items follow the same logic

**Acceptance Criteria:**
- Food quantity decreases correctly
- Inventory updates dynamically
- Player can interact normally with remaining items
- No UI glitches or errors

**Status:** ✅ DONE  

---

### 4. Integration With Stats & Gameplay
**Requirements:**
- Eating food must integrate with:
  - Health regeneration
  - Hunger system (optional if food affects hunger)
  - Combat healing effects if used during combat
- Avoid duplication of stats or unintended side effects

**Acceptance Criteria:**
- Health updated correctly after consumption
- Hunger/fatigue/thirst updated correctly (if applicable)
- No double healing or stat errors

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

   `/docs/FOOD_CONSUMPTION_REPORT.md`

   This report must include:
   - Tasks implemented
   - Files/components changed
   - Logic decisions taken
   - Any blockers or partial implementations
   - Testing outcomes / verification steps

4. Ensure food restores health correctly
5. Ensure only one toast message is shown per consumption
6. Ensure inventory updates correctly and dynamically
7. Integrate with player stats, hunger, fatigue, and combat effects
8. Avoid duplication of healing or conflicting stat changes
9. Do not modify unrelated systems
