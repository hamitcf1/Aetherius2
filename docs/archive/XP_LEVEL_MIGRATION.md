# XP / Level Migration: Fix Summary

Status: Completed

## Summary
Players observed that the Experience (XP) hero section did not progress correctly and characters could not level up as expected. This was caused by a legacy save format where `level` was manually set (player initiative) and not derived from `experience`. After migrating to an XP-driven leveling system, many legacy characters had mismatched `level` and `experience` values (e.g. level 35 but only 10,365 XP), which broke progress calculations and level-up detection.

## Root Cause
- Old system allowed manual player-set `level` values that were not tied to a total XP amount.
- The new leveling system calculates `level` and progress from `experience` using an escalating XP curve (utils/levelingSystem.ts).
- Characters with a stored `level` but insufficient `experience` produced negative progress for the current level (clamped to 0), so the UI showed 0 / X XP and did not trigger level-up logic.

## Fix Implemented
A one-time normalization runs on character load and fixes legacy saves by ensuring a character's `experience` is at least the baseline total XP required to legitimately be at their recorded `level`.

Behavior:
- For each loaded character, compute `xpRequiredForCurrentLevel = getTotalXPForLevel(level)`.
- If `experience < xpRequiredForCurrentLevel`, set `experience = xpRequiredForCurrentLevel` (preserves player level while restoring consistent progress math).
- Mark the character as dirty so the corrected value is persisted back to the database.

This preserves the player's chosen level (avoids demotion) and restores correct progress toward the next level.

## Files Changed
- App.tsx
  - Added XP normalization logic during character load to fix legacy `level`/`experience` mismatches. (See the normalization block near the character load/normalization section.)
- (Optional) No changes to `utils/levelingSystem.ts` or `components/CharacterSheet.tsx` were required; they already implement the target behavior.

Relevant helpers used:
- `getTotalXPForLevel(level)` — returns total XP required to reach the specified level.
- `getXPForNextLevel(currentLevel)` and `getXPProgress(totalXP, currentLevel)` — used by the UI for display and level-up checks.

## Why this approach
- Avoids demoting players (which would be surprising and likely unacceptable UX).
- Restores compatibility between old saves and the new XP-driven leveling system.
- Minimal and backward-compatible change; only affects characters whose `experience` is below the level baseline.

## Verification Steps
1. Start the app and log in with a user that has legacy characters (or reproduce with test characters).
2. Open DevTools Console and look for `[XP Normalization]` messages indicating normalization happened, e.g.:
   `[XP Normalization] Character "testing1" (level 35) had 10365 XP but needs 154678 XP to be level 35. Normalized XP to 154678.`
3. Open the character sheet (Hero section):
   - The XP display should now show `Total: X XP` consistent with the current `level`.
   - The progress bar should move as XP is earned and level-up flows should trigger normally.
4. Confirm that characters that already had consistent `level`/`experience` are unchanged.
5. (Optional) Verify a corrected character is persisted to Firestore/local storage (network call should succeed). If persistence fails due to client blockers, disable the blocker and re-run.

## Rollback / Alternatives
- If preserving exact historical XP totals is required instead of normalizing, an alternative would be to recalculate the `level` from the stored `experience` and notify players (this would demote some characters and is not recommended without player opt-in).

## Notes / Follow-ups
- Consider adding a telemetry event when normalization occurs to track how many legacy characters were affected.
- Once validation is complete, remove verbose normalization console logs, or convert them to a telemetry metric.

---
Created on: 2026-01-15
Author: Aetherius Dev Team (automation)
