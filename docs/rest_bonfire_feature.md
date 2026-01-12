# Rest / Bonfire Feature

## Overview
Implement a "Rest / Bonfire" menu for the player in both Adventure Chat and Hero Menu contexts. This feature allows the player to manage resources, equipment, and progression during rest periods. 

### Goals
- Enhance immersion by providing a hub-like rest interface.
- Allow management of health, stamina, magicka, equipment, perks, and level-ups.
- Ensure functionality is modular for future expansion.

---

## Required Behavior

### 1. Rest Trigger
- Rest can be initiated:
  - Automatically during adventure chat at designated rest points.
  - Manually from the Hero Menu.
- Opening rest triggers the Bonfire Menu overlay.

### 2. Bonfire Menu Actions
The menu must allow the player to perform the following:

#### a. Pre-Rest Actions
- Use healing items or potions.
- Equip/unequip weapons, armor, and accessories.
- Review and plan perk points usage.

#### b. Rest Actions
- Confirm rest action.
- Recover:
  - Health
  - Stamina
  - Magicka
- Time progression (if applicable).
- Apply level-ups if experience threshold is met.

#### c. Post-Rest Actions
- Use remaining items.
- Spend perk points.
- Apply or swap equipment changes.

### 3. Interface
- Modal or overlay style menu.
- Clear sections for:
  - Inventory
  - Equipment
  - Perks / Level-Up
  - Health/Stamina/Magicka bars
- Navigation must be intuitive and accessible.

### 4. Data & State Management
- Store temporary pre-rest changes (items/equipment/perks).
- Apply permanent changes after rest confirmation.
- Ensure all stats are clamped correctly (max/min values).

### 5. Modularity
- Menu system should be decoupled from Adventure Chat and Hero Menu logic.
- Should be reusable for future features like:
  - Campfire activities
  - Training/skill enhancement
  - Crafting stations

---

## Acceptance Criteria
- Player can open Bonfire Menu from Adventure Chat or Hero Menu.
- All pre-rest and post-rest actions are functional.
- Stats recovery (health, stamina, magicka) occurs correctly.
- Level-ups and perk assignments are applied and tracked.
- All changes are reversible before rest confirmation.
- Code modularity for future expansion confirmed.
- Interface is clear and responsive.

---

## Suggested Implementation Steps
1. **Trigger Rest Menu**
   - Hook into Adventure Chat and Hero Menu.
2. **Create Bonfire Menu UI**
   - Sections: Inventory, Equipment, Perks, Health/Stamina/Magicka
3. **Implement Pre-Rest Actions**
   - Item usage
   - Equipment swapping
   - Perk planning
4. **Implement Rest Logic**
   - Stat recovery
   - Level-ups
5. **Implement Post-Rest Actions**
   - Finalize item usage and equipment changes
   - Spend remaining perk points
6. **Testing**
   - Check modularity and integration
   - Ensure all stats and changes apply correctly
7. **Logging / Tracking**
   - Track applied fixes/features
   - Generate report file (see next section)

---

## Failsafe & Reporting System
- Every applied feature/fix should be logged.
- Output file format: `rest_bonfire_report.md`

Example:

```markdown
# Rest / Bonfire Feature Report

## Applied Features
- Triggering Bonfire Menu from Adventure Chat ✔
- Triggering Bonfire Menu from Hero Menu ✔
- Pre-rest actions implemented (equipment staging + apply) ✔
- Stat recovery during rest ✔
- Post-rest actions implemented (apply staged changes after rest) ✔
- Level-ups and perk assignments (partially available via PerkTree modal) ✔

## Pending / Issues
- UI layout refinement ⚠
- Modularity improvements ⚠
- Edge-case testing ⚠
