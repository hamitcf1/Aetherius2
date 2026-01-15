# Skyrim Aetherius – Weapon & Armor Upgrade / Blacksmith System

## Overview
This specification defines the **Weapon & Armor Upgrade System** via a new **Blacksmith feature**.  
Players can upgrade their weapons and armor, paying **money based on item type, level, and upgrade stage**.  
Upgrades improve item stats (damage, defense, durability, etc.) and integrate with inventory/equipment.  

All changes must be implemented at the **codebase level**.  
The AI agent must **update the Status field** after completing or attempting each task and generate a report.

---

## Feature / Bugfix Tasks

### 1. Blacksmith Modal
**Requirements:**
- Create a dedicated **Blacksmith modal** accessible from the main menu or town locations
- Modal shows:
  - Player’s current gold
  - List of weapons/armor eligible for upgrade
  - Current item level and stats
  - Upgrade cost for next level
- Player can:
  - Select an item
  - Confirm upgrade
  - Cancel upgrade
- UI feedback:
  - Highlight unaffordable upgrades
  - Show updated stats after upgrade

**Acceptance Criteria:**
- Modal opens and displays eligible items
- Upgrade cost and stats are visible
- Player can confirm or cancel upgrades

**Status:** ✅ DONE  

---

### 2. Upgrade Cost & Scaling
**Requirements:**
- Upgrade cost is based on:
  - Item type (weapon vs armor)
  - Base item quality
  - Current upgrade level
- Costs **scale gradually** with each upgrade
- Player must have sufficient gold to upgrade
- Deduct gold immediately upon successful upgrade

**Acceptance Criteria:**
- Upgrade cost calculated correctly
- Gold deducted only on confirmed upgrades
- Player cannot upgrade without sufficient gold

**Status:** ✅ DONE  

---

### 3. Upgrade Effects
**Requirements:**
- Weapon upgrades:
  - Increase base damage
  - Optional: increase attack speed, durability, critical chance
- Armor upgrades:
  - Increase defense rating
  - Optional: increase resistance, durability
- Upgrade levels tracked per item
- Maximum upgrade level configurable per item type

**Acceptance Criteria:**
- Stats increase correctly per upgrade
- Upgrade levels are saved and persisted
- UI updates to show new stats

**Status:** ✅ DONE  

---

### 4. Inventory & Equipment Integration
**Requirements:**
- Upgraded items:
  - Remain in inventory
  - Display current upgrade level
  - Update equipped stats if currently worn/wielded
- Tooltip shows upgrade info (level, stat increases, next upgrade cost)

**Acceptance Criteria:**
- Upgrades reflected in inventory/equipment modal
- Equipped items stats update dynamically
- Tooltip correctly shows upgrade info

**Status:** ✅ DONE  

---

### 5. Persistence
**Requirements:**
- Upgrades must **persist across sessions**
- Item stats and upgrade levels stored in player state
- System must handle multiple upgraded items without conflicts

**Acceptance Criteria:**
- Upgrades persist after reload
- Item stats reflect all applied upgrades
- No conflicts between items

**Status:** ✅ DONE  

---

### 6. UI & Feedback
**Requirements:**
- Modal shows:
  - Eligible items
  - Current stats and next level stats
  - Upgrade cost
  - Gold available
- Visual feedback for:
  - Successful upgrade
  - Insufficient funds
  - Max upgrade reached
- Optional: animation or sound effect for upgrade

**Acceptance Criteria:**
- UI displays all required info
- Feedback appears correctly
- Modal updates dynamically after upgrades

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

   `/docs/BLACKSMITH_UPGRADE_REPORT.md`

   This report must include:
   - Tasks implemented
   - Files/components changed
   - Logic decisions taken
   - Any blockers or partial implementations
   - Testing outcomes / verification steps

4. Ensure upgrades are persisted and dynamically reflected in inventory/equipment
5. Ensure gold deduction is accurate
6. Ensure UI dynamically updates for all interactions
7. Ensure maximum upgrade levels are enforced
8. Do not modify unrelated systems

---

### Notes
- System should be **extensible** for future:
  - Special materials increasing upgrade effects
  - Master blacksmith perks reducing cost or increasing effects
- Integration with combat stats must be seamless
- Upgrade levels are **player-specific**
