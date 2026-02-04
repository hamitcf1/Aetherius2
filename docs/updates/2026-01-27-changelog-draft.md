# Draft changelog entry — 2026-01-27 (v1.0.7)

**Date:** 2026-01-27
**Version:** 1.0.7
**Title:** Combat UX: Learned Abilities Only

### Summary
Combat ability lists now respect learned spell state and perk investment, preventing unlearned abilities and spells from appearing as usable. Status effects display names were also clarified to avoid placeholder labels.

### Changes
- Combat: hide unlearned spells from ability lists — learned spell IDs now control which magical abilities appear
- Combat: advanced One-Handed and Sneak abilities now require perk investment before appearing
- UX: clarified buff/debuff naming to avoid placeholder labels in status effects

---

Suggested commit message:

    chore(changelog): publish v1.0.7 — combat ability gating (2026-01-27)

Suggested tag: `v1.0.7`

Notes for maintainers:
- Automated tests and build were run; see logs for details. Test summary: **51 tests failed, 182 passed** across **34 failing test files**.
- Agent activity log: `docs/agent-activity/2026-01-27-changelog-activity.md` contains a concise summary of changed files and logs.
- This draft is ready for manual review and manual commit/tag by a maintainer. Do not auto-publish.
