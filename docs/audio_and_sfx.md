# Audio & SFX — Customization Guide 🔊

This guide explains how audio, sound effects and variants work, where to add assets, and debugging helpers.

## Key files
- `services/audioService.ts` — the central audio service. Key exports:
  - `playSoundEffect(effect: SoundEffect)` — play a logical effect
  - `SOUND_EFFECTS` — map of `SoundEffect` -> `string | string[] | null` (paths)
  - `variantPaths(baseName, count)` helper creates `_2` placeholders
  - `addSoundEffectVariant(effect, path)`, `clearSoundAvailabilityCache()` and `getRecentSfxEvents()` helpers
  - `playSoundEffectPath(path)` to play a specific file path for testing
- `console-demo.js` — includes `demo.sfxTest()` which opens a modal to sequentially test all registered paths. The tester now includes controls for `Auto`, `Wait for end`, `Delay (ms)` and `Max wait (ms)`, performs a quick HEAD check to mark missing files as 'Not found' (orange), and waits for playback to finish before proceeding when requested (useful for short sounds and audible verification).

## How to add assets
1. Put SFX files under `public/audio/sfx/`.
2. Name variants as `attack_melee.mp3`, `attack_melee_2.mp3`, `attack_melee_3.mp3`.
3. Use `variantPaths('attack_melee', 3)` (already used in mapping) or call `audioService.addSoundEffectVariant('attack_melee', '/audio/sfx/attack_melee_2.mp3')` at runtime.


### Using the SFX tester
- Open the browser console and run `demo.sfxTest()` (or `demo.sfxTest({auto:false, delay:250, waitForEnd: true})`).
- The tester opens an interactive modal listing every `SoundEffect`. The modal respects the app theme (uses `--skyrim-paper`, `--skyrim-text`, `--skyrim-border`, etc.) so it matches light/dark themes. Each effect shows:
  - A **Play effect** button (plays the logical effect mapping),
  - A **Play all variants** button (plays all registered file paths sequentially), and
  - A list of registered file paths with **Play** buttons and clear status badges (`ready`, `Not found (404)`, `playing`, `OK`, `unavailable`, `error`).
- Use the search box to filter effects by name. Missing or 404 files are clearly flagged (orange) but remain visible so you can decide which asset to add or replace.
- If `Wait for end` is enabled, the tester waits for the audio to finish playing (or `Max wait` ms) before moving to the next file — this provides an audible pause and better QA for short sounds.
- For manual QA, you can also call `audioService.playSoundEffectPath('/audio/sfx/attack_melee_2.mp3', 2000)` from the console to play a file and wait up to 2000ms for it to finish.

## Testing & Debugging
- Use `demo.sfxTest()` from the browser console to visually run all SFX.
- In dev console: `audioService.getRecentSfxEvents()` returns a buffer of recent events with 'play'/'error'/'skip'.
- If audio fails in JSDOM tests, the service caches 'unavailable' paths; use `audioService.clearSoundAvailabilityCache()` to force reattempts.

## Best practices
- Avoid enabling menu sounds for open/close (these are intentionally disabled to avoid spam).
- Use the `_2/_3` naming convention for variants so new files drop-in with no code change.

---
If you'd prefer, I can add a developer-only UI under Settings to manage SFX mappings and upload assets.