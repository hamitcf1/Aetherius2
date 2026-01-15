Feature: Combat — No stamina required attack

Overview:

Implementation of a new attack type ("Unarmed Strike") that functions as a baseline combat mechanic. This attack requires zero stamina, deals a set base damage, and scales through character skills.

User stories:

As a player, I want an unarmed strike option that does not consume stamina and is not affected by low-stamina debuffs, so that I can continue combat and defend myself even when my stamina is depleted.

Scope:

In-scope:

Combat Logic: Logic to bypass stamina checks when the Unarmed_Strike action is triggered.

Scaling System: Implementation of the damage formula:

Final_Damage = Base_Damage + (Skill_Modifier * Skill_Level)

Attribute Integration: Linking the attack to the "Unarmed/Brawling" skill tree.

Unlocks:
- Skill unlock: Unarmed skill level >= 5 grants the ability.
- Perk unlock: `unarmed_mastery` perk will unlock the ability regardless of skill level.

Input Mapping: Assigning a dedicated button or a contextual trigger for unarmed combat.

UI/UX: Visual feedback ensuring the player knows they can still attack when the stamina bar is empty.

Out-of-scope:

Changes to stamina consumption for existing weapon-based attacks.

Enemy AI behavior changes specifically for unarmed combat.

Design/Mock links:

Acceptance criteria:

 Mechanics: "Unarmed Strike" damage must correctly calculate bonuses from the player's skill level.

UI Integration: The attack button/icon remains active (not grayed out) when stamina is at 0%.

Consistency: Ensure no "Stamina Exhaustion" debuffs (e.g., debuffed attack damage) apply to this specific attack type.

Telemetry / Metrics:

Usage Frequency: Track the percentage of total attacks that are "Unarmed" during low-stamina states.

Combat Survivability: Measure if players utilizing the unarmed strike have a higher survival rate in encounters where stamina reaches zero.

Balance Monitoring: Compare Unarmed DPS vs. Weapon DPS to ensure it remains a "fallback" option and doesn't become the primary meta.

Rollout plan:

Feature Flag: enable-unarmed-combat (Development/Alpha branch).

Phases: 1. Internal QA testing. 2. Alpha/Beta tester group release. 3. Full production rollout.

Estimate: 3 - 5 Story Points (Intermediate complexity).

Dependencies: Combat Manager, Character Skill System.

Notes:  
This feature is intended to reduce "combat frustration" during high-intensity encounters by providing a low-risk, low-reward fallback option.