
📄 GAME_SYSTEM_CHANGES.md

# Game System Changes
Type: Mandatory Feature & Bug Fix Specification
Applies to: Narrative RPG Engine (state-based)
Priority: Critical
Compliance: Required, not advisory

---

## 0. GLOBAL ENFORCEMENT RULE

If any rule in this document would be violated:
- STOP narrative generation
- Resolve the mechanical inconsistency first
- Only then continue narration

Narrative quality is secondary to system correctness.

---

## 1. BUG FIX — Combat Resolution with Multiple Enemies

### Current Bug
Combat encounters end when the focused enemy is defeated, ignoring remaining enemies.

### Required Change
Combat resolution MUST evaluate ALL enemies in the encounter.

### Implementation Rules
- Every encounter contains an `enemies[]` list.
- Each enemy MUST end combat in one of these states:
  - dead
  - fled
  - surrendered
  - incapacitated
  - still_hostile

### Hard Conditions
- Combat CANNOT be marked as resolved if ANY enemy is `still_hostile`.
- Narration MUST explicitly mention the outcome of EACH enemy.
- Implicit resolution is forbidden.

### Failure Handling
If an enemy state is missing:
- Pause narrative
- Generate enemy resolution
- Resume combat flow

---

## 2. FEATURE — Explicit Enemy State Tracking

### New Required System
Enemy objects MUST include:

- id
- type
- health_state
- morale_state
- combat_state

### Example

enemy:
id: dog_01
type: attack_dog
combat_state: fled

No enemy may be removed without a final state.

---

## 3. BUG FIX — Hunger / Thirst / Fatigue Have No Effect

### Current Bug
Stats increase numerically but have no gameplay impact.

### Required Change
Stats MUST affect gameplay immediately once thresholds are crossed.

### Mandatory Threshold Effects

#### Hunger
- ≥6: Reduced stamina / slower reactions
- ≥8: Combat disadvantage
- ≥10: Forced rest or food search

#### Thirst
- ≥6: Increased fatigue gain
- ≥8: Perception penalties
- ≥10: Movement restrictions

#### Fatigue
- ≥6: Action penalties
- ≥8: Risk of failure on actions
- ≥10: Forced rest state

### Hard Rule
No stat may increase without producing:
- a mechanical penalty
- a forced choice
- or a blocked action

---

## 4. FEATURE — Forced Rest & Collapse States

### New States
- exhausted
- semi-conscious
- collapsed

### Triggers
- Fatigue ≥10
- Combined Hunger + Thirst ≥16

### Effects
- Travel disabled
- Combat heavily penalized or impossible
- Rest becomes mandatory

Narrative MUST reflect physical degradation.

---

## 5. BUG FIX — Long Travel Produces No Content

### Current Bug
Extended travel only advances time and stats.

### Required Change
For every continuous travel period ≥1 in-game hour:
At least ONE of the following MUST occur:
- Environmental hazard
- Random encounter
- Skill or endurance check
- Decision fork
- Narrative vignette with state impact

### Forbidden
- Repeating descriptive text without state change
- Time skips with no interaction

---

## 6. FEATURE — Travel Event Generator

### New Requirement
Travel MUST be event-driven, not purely descriptive.

### Each travel segment MUST:
- Consume time
- Modify stats
- Produce at least one event OR decision

Travel without interaction is only allowed under 30 minutes.

---

## 7. BUG FIX — Objective & Destination Ambiguity

### Current Bug
Player believes destination is reached without objective confirmation.

### Required Change
Separate clearly:
- Region reached
- Objective located
- Objective completed

### Mandatory Output Format
Whenever location or objective changes:
- Region reached:
- Objective status:

### Forbidden Language
- “You have arrived” without explicit objective confirmation
- “Seems like you’re close” without state update

---

## 8. FEATURE — Objective State Machine

### Required States
- not_started
- in_progress
- located
- completed
- failed

### Rules
- Objective state MUST be visible to the player
- State changes MUST be announced immediately
- No delayed confirmation

---

## 9. FEATURE — Character Archetype Enforcement (Endurance-Based)

### Character Definition
- Endurance-focused
- Physically resilient
- Outlasts opponents
- Not immune to exhaustion

### Required Mechanical Behavior
- Endurance delays penalties
- Does NOT remove penalties
- Ignoring limits results in collapse

### Forbidden
- Infinite forward movement
- Stat immunity justified by narration

Narrative MUST follow mechanics, not override them.

---

## 10. FAIL-FAST VALIDATION CHECKLIST (MANDATORY)

Before generating narrative, validate:
- All enemies have states
- Stats produce effects
- Time passage has consequences
- Objective state is explicit
- Character limits are respected

If ANY check fails:
- Halt output
- Resolve failure
- Resume generation