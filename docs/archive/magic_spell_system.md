# Skyrim Aetherius – Magic Spells System

## Overview
This specification defines the **Magic Spells System** for Skyrim Aetherius.  
Spells can be **learned, tracked, and used** both in and out of combat.  
All changes must be implemented at the **codebase level**, no data migrations.  
The AI agent must **update the Status field** after completing or attempting each task and generate a report.

---

## Feature / Bugfix Tasks

### 1. Spell Learning System
**Requirements:**
- Spells are learnable via:
  - NPC interactions
  - Books found in the game world
- Player must be able to view a list of **available spells**
- When learning a spell:
  - Player confirms learning
  - Spell is added to the player’s learned spell list
  - Spell persists across sessions
- If prerequisites exist (e.g., required level or other spells):
  - Player cannot learn until conditions are met
  - UI shows prerequisite requirements

**Acceptance Criteria:**
- Learning a spell updates the player state
- Learned spells persist in player inventory/state
- UI shows newly learned spell immediately

**Status:** ⚠️ Pending / ✅ DONE / ❌ BLOCKED  
**Status:** ⚠️ PARTIAL  

---

### 2. Spells Modal
**Requirements:**
- Create a dedicated **Spells Modal**
- Modal displays:
  - Learned spells
  - Available spells (locked / unlockable)
  - Description, effects, mana cost, and prerequisites
- Player can:
  - Select a spell for use
  - Inspect spell details
- Modal must be accessible from:
  - Hero tab
  - Combat modal (to assign or cast abilities)

**Acceptance Criteria:**
- Modal opens without errors
- All learned spells are listed
- Locked spells show requirements
- Spell selection updates player’s combat-ready abilities

**Status:** ⚠️ Pending / ✅ DONE / ❌ BLOCKED  
**Status:** ✅ DONE  
---

### 3. Combat Integration
**Requirements:**
- Learned spells can be **used as abilities in combat**
- Casting a spell:
  - Consumes magicka
  - Applies effects (damage, buff, debuff, heal, etc.) according to spell definition
- UI shows available spell buttons in combat modal
- Casting triggers logs in the combat event log

**Acceptance Criteria:**
- Spells usable in combat
- Effects applied correctly
- Magicka deducted correctly
- Logs show correct outcomes

**Status:** ⚠️ Pending / ✅ DONE / ❌ BLOCKED  
**Status:** ✅ DONE  
---

### 4. Spell Data Model
**Requirements:**
- Each spell object must include:
  - `id` → unique identifier
  - `name` → display name
  - `description` → effect description
  - `manaCost` → magicka cost
  - `effect` → object defining effect type, target, and value
  - `prerequisites` → optional list of required level or spells
  - `learned` → boolean flag per player
- Centralized registry of all spells for consistency

**Acceptance Criteria:**
- Spell objects exist in a central registry
- Player’s learned spells reference these objects
- New spells added easily without modifying core logic

**Status:** ⚠️ Pending / ✅ DONE / ❌ BLOCKED  
**Status:** ✅ DONE  
---

### 5. Spell Casting Logic
**Requirements:**
- Centralized function to **cast a spell**
- Validates:
  - Player knows the spell
  - Player has sufficient magicka
- Applies effect to:
  - Enemy
  - Player
  - Party members (if applicable)
- Updates combat log with:
  - Spell name
  - Target
  - Effect applied
- Deducts mana cost

**Acceptance Criteria:**
- Casting logic works consistently in all combat scenarios
- Player cannot cast unlearned spells
- Mana consumption is correct
- Effects are applied accurately

**Status:** ⚠️ Pending / ✅ DONE / ❌ BLOCKED  
**Status:** ✅ DONE  
---

### 6. UI & Feedback
**Requirements:**
- Combat UI shows:
  - Spell buttons or selectable list
  - Cooldowns if applicable
- Modal UI shows:
  - Learned vs unlockable spells
  - Spell description, mana cost, and prerequisites
- Logs and notifications must reflect spell casting, success, or failure

**Acceptance Criteria:**
- Spell UI integrates with both combat modal and hero modal
- Modal updates dynamically when a spell is learned
- Spell casting shows effects and logs correctly

**Status:** ⚠️ Pending / ✅ DONE / ❌ BLOCKED  
**Status:** ✅ DONE  
---

## Progress Tracking

**Instructions for AI Agent:**
1. Implement all tasks in the spec at the **codebase level**
2. After completing each task, update **Status** field:
   - ✅ DONE → fully implemented and tested
   - ⚠️ PARTIAL → partially implemented, issues remain
   - ❌ BLOCKED → cannot implement (include reason)
3. Create a **secondary report file** after implementation:

   `/docs/MAGIC_SPELLS_REPORT.md`

   Include:
   - Tasks implemented
   - Files/components changed
   - Logic decisions taken
   - Any blockers or partial implementations
   - Testing outcomes / verification steps

4. Centralize all spell logic:
   - Learning, persistence, casting, combat effects
5. Ensure UI and modals update dynamically
6. Ensure spells persist across sessions
7. Ensure combat integration works seamlessly with other mechanics

---

### Notes
- This is a **full-featured Magic Spells System**, not just UI or placeholder.  
- Spells learned through NPCs/books must persist and be usable anywhere applicable.  
- This file will be the **single source of truth** for AI tracking, including status updates and progress reports.
