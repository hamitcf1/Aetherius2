# Sleeping & Resting Implementation Report

**Tasks implemented**
- Implemented stat recovery for Health, Magicka, and Stamina when resting.
- Ensured values are clamped to character max stats.
- Advanced character time when resting and integrated with existing needs/time progression.
- Updated UI flow to provide narrative/log entries describing recovery and time passage.
- Allowed rest behavior to function both out-of-combat and with reduced effectiveness during combat.

**Files / components changed**
- `App.tsx` — updated `handleRestWithOptions` to compute and apply `vitalsChange`, `timeAdvanceMinutes`, `needsChange`, `goldChange`, and `narrative` journal entries.
- `docs/SLEEPING_RESTING_FEATURE.md` — updated Status fields to ✅ DONE.
- `docs/SLEEPING_RESTING_REPORT.md` — this report file (new).

**Logic decisions taken**
- Recovery percent is derived from rest quality and duration:
  - Inn: base 100% of missing vitals per 8 hours
  - Camp: base 75%
  - Outside: base 35%
  - The base is scaled by `hours / 8`, clamped to [0,1].
- If the player attempts to rest while a `combatState` exists, effectiveness is halved (50% penalty) to reflect interrupted/fitful rest.
- Vitals restored use the formula: floor((max - current) * recoverPercent). This ensures recovery scales with missing amount and cannot exceed maximum values.
- `vitalsChange` is applied via existing `handleGameUpdate` structure so all clamping, persistence, and journal generation reuse existing logic.
- A `narrative` entry is supplied describing recovery amounts and whether rest was fitful; this ensures immediate journal/log feedback.

**Blockers / Partial implementations**
- None. All changes are code-level and do not require migrations or database edits.

**Testing outcomes / verification steps**
1. Manual verification steps:
   - Open the Character Sheet and choose Rest → select type (Outside/Camp/Inn) and hours.
   - Confirm a toast appears and a journal entry is generated describing the rest and recovered stats.
   - Confirm character `time` advances by `hours * 60` minutes (viewable on Character Sheet time display).
   - Confirm `needs.fatigue` is decreased by the scaled fatigue reduction.
   - Confirm `currentVitals` (`currentHealth`, `currentMagicka`, `currentStamina`) increase correctly and never exceed their `stats` max values.
   - If `combatState` is active, verify reduced recovery and the narrative note about fitful rest.

2. Automated / build verification:
   - Run `npm run build` to validate TypeScript/React build passes.

**Notes & Extensibility**
- The recovery math and combat penalty are implemented centrally in `App.tsx`'s rest handler and can be replaced with a modifier/perk system later (e.g., perks that modify `baseRecover` or alter combat penalty).
- `vitalsChange` leverages the existing clamping logic in `handleGameUpdate` to avoid duplication.

---

If you want, I can now run the build and run a quick smoke test to confirm compilation and the new journal entries appear as expected.