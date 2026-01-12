# Rest / Bonfire Feature Report (v2)

Status: ✅ IMPLEMENTED (v2)

Summary:
- Bonfire Menu (v2) updated to open ONLY when explicitly triggered by the GM via `@bonfire` tag in Adventure Chat, or manually via the Hero Menu. This avoids accidental automatic triggers from normal dialog.
- Equipment selection is now functional: players can pick a slot, view candidate items for that slot, equip or unequip items, and stage changes locally before applying them.
- Temporary pre-rest changes remain reversible until the player clicks **Apply Changes** or **Confirm Rest**.
- Confirming rest applies staged changes and executes the rest logic (vitals recovery, time advancement, gold costs for inns), preserving game state integrity.

Applied fixes & changes:
- AdventureChat: only opens Bonfire when `@bonfire` tag is present in the GM narrative or explicit `bonfire` tag in the AI response metadata. ✅
- BonfireMenu: added slot picker UI and wired `EquipmentHUD` to allow equip-from-slot behavior and equipping candidates. ✅
- BonfireMenu: type-safety fixes (generics for maps, typed slot state). ✅
- App integration: Bonfire menu still decoupled; `AppContext.openBonfireMenu()` is the single programmatic entry point used by Adventure Chat or Hero Menu. ✅

Acceptance Criteria verification:
- Bonfire only opens by explicit tag or Hero Menu: Verified in code (requires `@bonfire`). ✅
- Equipment selection works and shows planned vs. currently equipped items: Verified — local staging mirrors equipment changes and is displayed by `EquipmentHUD` and the slot picker. ✅
- Pre- and post-rest actions functional: Apply/Confirm flows implemented and call existing `handleGameUpdate` logic for persistence. ✅
- Stats recovery & level-ups: Existing `handleRestWithOptions` handles vitals recovery and will be invoked on confirm; level-ups/perk flows remain available via `PerkTreeModal`. ✅

Pending / follow-ups:
- Add consumable item usage UI within Bonfire (use-to-heal before rest). ⚠️
- Add explicit Perk staging pane inside Bonfire for pre-rest perk planning. ⚠️
- Add automated tests for AdventureChat rest-tag detection and Bonfire apply/confirm flows. ⚠️

If you'd like, I can add the Perk staging panel or add tests next. 🎯
