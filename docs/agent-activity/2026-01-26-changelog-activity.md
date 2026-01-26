# Agent Activity Log — Changelog update

- **Date:** 2026-01-26
- **Action:** append (daily changelog)
- **New version:** 1.0.6 (patch increment)
- **Summary:** Appended combat-related fixes and tests as a separate follow-up release (v1.0.6) on 2026-01-26. v1.0.5 contains the prior hotfix bullets (modals, map stability, etc.). This addresses missing/incorrect healing and conjuration visual effects, increases VFX z-index and timing stability, and adds tests for heal/conjure visuals.

## Files with relevant changes (mtime >= 2026-01-26)
- `components/CombatModal.tsx`
- `components/SpellEffects.tsx`
- `services/combatService.ts`
- `services/spells.ts`
- `tests/combat-spell-effects.spec.tsx`
- `tests/combat-enemy-effects.spec.tsx`
- `tests/combat-skip-end-turn.spec.tsx`
- `styles/combat-badges.css`
- `types.ts`
- `scripts/generate_changelog_draft.js`
- (Plus other doc/utility files modified on the same day; see `find` output if needed)

## Artifacts
- Changelog draft (for maintainer review): `docs/updates/2026-01-26-changelog-draft.md`
- Test log: `docs/updates/2026-01-26-test.log` (see below)
- Build log: `docs/updates/2026-01-26-build.log` (see below)

## Notes
- I did NOT commit, tag, or publish any changes. A human maintainer must review and apply the draft.
- Tests were run; see `docs/updates/2026-01-26-test.log` for full output. Test summary: **49 tests failed, 122 passed** across **31 failing test files** (see the log for details).
- Build completed successfully; see `docs/updates/2026-01-26-build.log` for build output.

---

If you want, I can open the failing tests and try to stabilize them, or prepare a PR draft with the changelog and test output attached for a maintainer to review.
