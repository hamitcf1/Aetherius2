# Test Matrix (initial)

This file outlines the core features and the recommended tests to cover them. Use this as a living document to prioritize which tests to write first.

| Feature | Unit tests | Component tests | Integration tests | E2E tests | Notes / Acceptance Criteria |
|---|---:|---:|---:|---:|---|
| Inventory utils (equip, unequip, stackable) | ✅ |  | ✅ | ✅ | Prevent duplicate equip; ensure quantity preserved; edge cases for missing items |
| Companion equipment (assign/unassign) | ✅ | ✅ | ✅ | ✅ | Items cannot be equipped by more than one owner; UI disables owned items; unequip updates `equippedBy` |
| CharacterSheet UI (Spells, Manage Companions) |  | ✅ | ✅ | ✅ | Single Spells button; Manage Companions visible beside Spells; interactions open correct modals |
| Bonfire loadout save/sync | ✅ | ✅ | ✅ | ✅ | Local save, cloud save retry, cloud syncing states, badges and retry flow |
| CombatService (summon, abilities, xp reward) | ✅ |  | ✅ | ✅ | Summon effect creates companion with correct fields; pendingSummons tracked; XP reward present |
| Spells (learn/unlearn, perk cost) | ✅ | ✅ | ✅ | ✅ | Learning a spell charges perk points and persists learned spell IDs |
| Firestore helpers (save/load/delete user loadouts) | ✅ |  | ✅ | ✅ | Proper error handling and retries; merge behavior for save
| Adventure chat apply/diff logic | ✅ | ✅ | ✅ | ✅ | Preview vs apply flows; idempotent updates; offline queue processing
| UI accessibility & keyboard |  | ✅ |  | ✅ | Ensure keyboard focus states and aria attributes for modals and dropdowns


## Priorities (short-term)
1. Companion equipment (assign/unassign) — unit + component tests
2. Inventory utilities — expanded unit tests (edge cases)
3. Bonfire loadout sync — integration and component tests
4. Combat summon behavior — unit tests and a smoke integration test


## Contributing tests
- Place tests under `tests/` using `*.spec.ts` or `*.spec.tsx` naming
- Use `vitest` for unit tests and `@testing-library/react` for components
- Use `msw` to stub network/Firestore interactions in component/integration tests
- Use Playwright for critical user journeys in `tests/e2e/`


## Notes
- Aim for deterministic tests (avoid random values); stub randomness where appropriate
- When adding new features, add at least one unit test and one component test for user-visible behavior
