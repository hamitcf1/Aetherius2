# Gameplay Consistency & Mechanics Fixes
Version: 1.0  
Scope: Narrative RPG loop (Skyrim-inspired, state-based)

---

## 1. Combat Resolution Consistency

### Problem
Multi-enemy encounters resolve incorrectly when only one target is attacked.
Example: Bandit + Dog encounter ends when bandit dies, dog state ignored.

### Required Fix
- Every enemy in an encounter MUST have an explicit end-state:
  - Dead
  - Fled
  - Surrendered
  - Incapacitated
  - Still hostile

### Rules
- Combat cannot be marked as "won" unless:
  - All enemies are non-hostile OR
  - Player disengages explicitly
- Narration MUST mention each enemy’s outcome.
- No implicit resolution is allowed.

---

## 2. Time, Hunger, Thirst, Fatigue → Gameplay Impact

### Problem
Stats increase numerically but do not affect gameplay, decisions, or narration.

### Required Fix
Stats MUST influence at least one of the following:
- Available actions
- Action success probability
- Combat effectiveness
- Movement speed / travel events
- Forced rest checks

### Minimum Threshold Effects (example baseline)
- Hunger ≥ 6:
  - Reduced combat stamina OR slower reactions
- Thirst ≥ 6:
  - Reduced endurance, higher fatigue gain
- Fatigue ≥ 6:
  - Forced rest prompt OR combat penalties

Stats without consequences are not allowed.

---

## 3. Destination & Objective State Clarity

### Problem
Player believes destination is reached, but objective remains unresolved.

### Required Fix
Explicitly separate:
- Region reached
- Objective reached
- Objective completed

### Mandatory Outputs
Whenever location changes, output:
- Current Region
- Objective Status Update

Example:
- Region reached: Reach Southern Pass
- Objective updated: Locate the merchant caravan

No ambiguous “you have arrived” language.

---

## 4. Long Travel Content Density

### Problem
Extended travel produces only stat changes with no events.

### Required Fix
For travel longer than 1 in-game hour:
At least ONE must occur:
- Environmental hazard
- Random encounter
- Narrative vignette
- Player decision fork
- Skill / endurance check

“No-event travel” is allowed ONLY for short durations.

---

## 5. Character Archetype Enforcement

### Character Definition
- Endurance-focused
- Outlasts enemies
- Physically resilient
- Not speed-optimized or trick-based

### Required Fix
Game systems MUST reward:
- Controlled pacing
- Strategic resting
- Endurance-based outcomes

Game systems MUST discourage:
- Endless forward movement with no cost
- Ignoring physical limits

Narration and mechanics must reinforce this identity.

---

## 6. General Enforcement Rules

- No stat tracking without mechanical impact
- No encounter resolution without explicit states
- No time passage without narrative or mechanical justification
- Player choices must alter future states

End of document.