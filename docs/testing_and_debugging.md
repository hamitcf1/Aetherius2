# Testing & Debugging — Guide 🧪🐞

This guide explains how to run tests, add new unit tests, and use debugging helpers in the app.

## Running tests
- Run tests: `npm test` (watch mode). See `vitest.config.ts` for configuration.
- Use `npm run test:ui` if you add browser-specific tests (not present by default).

## Adding tests
- Unit tests live under `tests/` using Vitest and React Testing Library.
- Common patterns:
  - For service-level tests (loot, audio helpers), import the service and test pure functions.
  - For component tests, render the component and interact via `@testing-library/react` fireEvent/userEvent.

## Debugging & helpers
- `window.demo` contains many runtime helpers (e.g., `demo.sfxTest()`, `demo.getAppState()`).
- `window.audioService` is exposed and provides `getRecentSfxEvents()` and `clearSoundAvailabilityCache()` for tracing SFX behavior.
- For logging, search for `console.log` and `console.debug` in services; the audio service has `setDebugSfx(true)` for verbose SFX logs.

## Common gotchas
- JSDOM does not implement `HTMLMediaElement.play()` (tests will see 'no play support' errors); use `audioService.clearSoundAvailabilityCache()` in tests or write expectations against debug events rather than real audio playback.
- When changing persisted keys or storage formats, add migration scripts and update `FIRESTORE_MIGRATION.md`.

---
If you want a short `docs/CONTRIBUTING.md` summarizing these points for external contributors, I can add it.