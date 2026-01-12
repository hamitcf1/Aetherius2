# Rest / Bonfire Feature Report

Status: ✅ IMPLEMENTED (basic)

Summary:
- Implemented a Bonfire / Rest overlay (`components/BonfireMenu.tsx`) that combines "Prepare" (equipment staging) and "Rest" controls.
- The menu allows players to stage equipment changes locally, apply them (persist via `handleGameUpdate({ newItems })`), and then confirm rest (applies staged changes and calls rest handler).
- The Bonfire Menu can be opened from:
  - Hero Menu / Character Sheet (Rest button now opens the Bonfire preview)
  - Adventure Chat: when the GM suggests a rest (e.g., narrator says "rest", "camp"), the Bonfire is opened as a preview rather than auto-applying rest — player must confirm.

Notes / Implementation details:
- `BonfireMenu` composes `EquipmentHUD` so equipment staging behaves consistently with other equipment UIs.
- Staged changes are local until the player clicks "Apply Changes" or "Confirm Rest". This keeps changes reversible prior to confirmation.
- On confirm, `handleRestWithOptions` is called with chosen options (type/hours) and the rest UI closes.
- `AppContext` exposes `openBonfireMenu(options?: RestOptions)` for components/services that want to open the menu programmatically.

Follow-ups / Enhancements (optional):
- Add explicit perk selection / pre-rest perks staging panel (Perk integration is ready, but staging UI not added yet).
- Add inventory management (use, discard) during Bonfire.
- Add unit tests for Bonfire handlers and AdventureChat rest-detection logic.

If you want, I can add any of the follow-ups next. 🎯
