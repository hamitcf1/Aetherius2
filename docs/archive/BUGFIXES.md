# BUGFIXES & ACTION PLAN ✅

This document collects the most important bugs, flakiness, and defensive-code issues found during a repository-wide analysis. For each issue I include: symptoms, repro steps, affected files, severity, and a proposed fix (with test guidance and an estimated PR size).

---

## 1) Test warnings / runtime failures reading `localStorage` in Node (Vitest)

- Severity: High (impacts CI/test stability)
- Symptom: Tests produce `TypeError: localStorage.getItem is not a function` (seen during `npm test`). Also a `--localstorage-file` warning is shown by the test runner.
- Affected files:
  - `services/spells.ts` (getLearnedSpellIds, learnSpell, forgetSpell)
  - `services/versionCheck.ts` (reads `localStorage`) and other places that assume `localStorage` exists
- Root cause: Code assumes `localStorage` (browser API) exists. In the Node test environment `localStorage` may be absent or replaced by a runner shim that doesn't behave as expected.

### Proposed fixes
1. Add a small storage wrapper utility that safely accesses local storage when available and falls back to an in-memory store in Node/test environments.
   - New file: `services/storage.ts`
   - API: `getItem(key)`, `setItem(key, value)`, `removeItem(key)`
   - Behavior: Use `globalThis.localStorage` if present and it has expected methods; otherwise use an internal Map to persist during process runtime.

2. Replace direct `localStorage.*` uses in `services/spells.ts` and `services/versionCheck.ts` with the wrapper.

3. Add unit tests for edge cases (no localStorage present, malformed data, Null flows).

4. (Optional) Add a Vitest setup file to provide a deterministic `localStorage` mock or ensure the wrapper's fallback is used.

### Example snippet (conceptual)
```ts
// services/storage.ts
const memory = new Map<string,string>();
const hasLS = typeof globalThis !== 'undefined' && typeof (globalThis as any).localStorage === 'object' && typeof (globalThis as any).localStorage.getItem === 'function';

export const storage = {
  getItem(key: string) {
    if (hasLS) return (globalThis as any).localStorage.getItem(key);
    return memory.has(key) ? memory.get(key) || null : null;
  },
  setItem(key: string, value: string) {
    if (hasLS) return (globalThis as any).localStorage.setItem(key, value);
    memory.set(key, value);
  },
  removeItem(key: string) {
    if (hasLS) return (globalThis as any).localStorage.removeItem(key);
    memory.delete(key);
  }
};
```

### Tests to add
- `services/spells.spec.ts`: verify `getLearnedSpellIds()` does not throw when `globalThis.localStorage` is undefined and returns `[]`.
- Integration-style test: temporarily remove `globalThis.localStorage`, call `learnSpell()`, ensure it persists to in-memory fallback.

Estimated PR size: small (1 new file + ~3 small edits + tests) — 1–2 hrs.

---

## 2) Timing-dependent companion UI / flakey test

- Severity: Medium (causes intermittent test failures and fragile UI timing assumptions)
- Symptom: `tests/combat-companion-ui.spec.tsx` intermittently failed because a companion ability button remained disabled or narrative callbacks didn't reliably fire.
- Affected files: `components/CombatModal.tsx`, tests in `tests/combat-companion-ui.spec.tsx`
- Root cause: Many animation waits rely on raw `setTimeout(...)` durations; tests depend on wall-clock delays making them fragile.

### Proposed fixes
1. Add a test-friendly animation helper (e.g., `waitAnimation(ms)`) that resolves immediately when `process.env.NODE_ENV === 'test'` or a `FAST_ANIM` env flag is set.
2. Replace `await new Promise(r => setTimeout(r, X))` occurrences in combat processing with this helper.
3. Optionally expose a `testOptions` prop to `CombatModal` that short-circuits animation in tests.
4. Update tests to either use the shortened path or use `vi.useFakeTimers()` to step timers deterministically.

### Tests to add/update
- Update `combat-companion-ui.spec.tsx` to use `vi.useFakeTimers()` or rely on the fast animation mode so the companion button becomes enabled deterministically.

Estimated PR size: medium — small helpers + 1–2 file edits + test updates — 2–4 hrs.

---

## 3) Defensive error logging in `services/effects.ts`

- Severity: Low/Medium (reveals edge cases when processing potions)
- Symptom: `console.error('[effect.infer] unable to determine potion target stat', {...})` — indicates potion targeting logic returned no valid stat.
- Affected file: `services/effects.ts`

### Proposed fixes
- Add sanity checks earlier (validate `item` shape before calling `infer`) and, depending on the case, return a no-op effect or pick a safe default stat (e.g., `health`) with a developer-facing warning that includes minimal telemetry.
- Add a unit test covering the potion-shape edge case that previously triggered this log, asserting a safe fallback occurs.

Estimated PR size: small — 1 file + test — 1 hr.

---

## 4) teachSpellToCharacter return value inconsistency (observed odd expression)

- Severity: Low
- Symptom: `teachSpellToCharacter` returns `{ learned: ok, alreadyKnown: !ok ? false : false, spell }` which is a no-op expression but confusing and likely unintended.
- Affected file: `services/spells.ts`

### Proposed fixes
- Replace the confusing expression with an explicit return shape: `return { learned: ok, alreadyKnown: false, spell };`
- Add a unit test to validate both the `alreadyKnown` and `learned` outcomes across branches.

Estimated PR size: tiny — 1 file + test — 30–60m.

---

## 5) Miscellaneous improvements / test hygiene

- Add a Vitest environment setup file to initialize popular browser globals (mock `localStorage`, `Audio`, `fetch` if required) to reduce noise.
- Add a `test-utils` helper that renders components with minimal required props (esp. `CombatModal`) and toggles fast-animation/test mode.
- Where `console.warn` or `console.error` is used as a non-critical fallback, consider replacing with structured logs or conditional logging that can be asserted in tests.

Estimated PR size: small — 1 configuration file + tests — 1–2 hrs.

---

## PR checklist (per bugfix)
- [ ] Add unit tests covering the bug and the fix.
- [ ] Update TypeScript types if necessary; keep changes small and typed.
- [ ] Run full test suite (`npm test`) and confirm zero failing tests.
- [ ] Add short changelog entry or mention in `CHANGELOG.md`.
- [ ] Add small integration/demo note in `docs/BUGFIXES.md` where appropriate.

---

## Suggested next steps (pick what you'd like me to do now)
1. Implement the `services/storage.ts` fallback + update `services/spells.ts` & `services/versionCheck.ts` and add tests that remove `globalThis.localStorage` to verify behavior. (Recommended first step.)
2. Implement the test-friendly animation helper and update `components/CombatModal.tsx` & tests to avoid flakiness.
3. Fix `teachSpellToCharacter` return object and add a test.
4. Add a `vitest.setup.ts` to mock `localStorage`/`Audio` and remove the localStorage warnings.

If you pick one, I can open a branch and implement it now, including tests and a PR-ready commit set.

---

If you want, I can also open PRs for the top two items now (storage wrapper + CombatModal test helper). Tell me which you prefer me to implement next and I will proceed.
