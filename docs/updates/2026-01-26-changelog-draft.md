# Draft changelog entry — 2026-01-26 (v1.0.6)

**Date:** 2026-01-26
**Version:** 1.0.6
**Title:** Hotfixes: Modals, Combat & Map Stability (append)

### Summary
A set of hotfixes landed today focused on combat visual fidelity and test coverage. Key changes restore missing magical visual effects and improve their reliability and testability.

### Changes
- Combat: Restored healing and conjuration visual effects and screen flashes; spell visuals now anchor to their targets (v1.0.6)
- Combat: Increased VFX z-index and standardized timing (ms helper) so effects render above modals and persist reliably (v1.0.6)
- Tests: added unit tests for healing and conjuration visuals and improved test stability for spell effects (v1.0.6)

> Note: the original hotfixes (modals, map fixes, etc.) are recorded under v1.0.5 (2026-01-26). v1.0.6 is a small follow-up release that focuses specifically on VFX and tests.
---

Suggested commit message:

    chore(changelog): append v1.0.6 — Combat VFX & tests (2026-01-26)

Suggested tag: `v1.0.6`

Notes for maintainers:
- The automated test run found failing tests in `tests/combat-spell-effects.spec.tsx` (see test log) — see `docs/updates/2026-01-26-test.log` for details. Build completed; see `docs/updates/2026-01-26-build.log` for build output.
- Agent activity log: `docs/agent-activity/2026-01-26-changelog-activity.md` contains a concise summary of changed files and logs.
- This draft is ready for manual review and manual commit/tag by a maintainer. Do not auto-publish.
