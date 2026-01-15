# Dungeon Minigame Report — v6

Summary: Implementation progress and current status for the Dungeon Minigame System (v6).

Format: ✔ Implemented | ⚠ Issues with short explanation

---

## Triggering
- ✔ Player selects a dungeon from Map via explicit "Enter Dungeon" button on map location details
- ✔ Player explicitly states intent in Adventure Chat (phrases supported: "I want to clear ___ dungeon", "I will clear ___ dungeon", "I enter ___ dungeon to clear it")
- ✔ No implicit or narrative triggers implemented (explicit only)

## Flow
1. ✔ Trigger detected (Map button or Chat intent)  
2. ✔ Adventure Chat pause while dungeon modal is open (chat input disabled)  
3. ✔ Dungeon modal opens  
4. ✔ Dungeon played (nodes, basic interactions, combat integration)  
5. ✔ Modal closes  
6. ✔ Adventure Chat resumes with outcome-aware updates (rewards applied to inventory/state)

## Dungeon Design
- ✔ Branching tree-path map (node positions defined via x/y in definitions)
- ✔ Start → multiple paths → final boss (definitions include start and boss nodes)
- ✔ Minimum 15 unique dungeons implemented (see `data/dungeonDefinitions.ts`)  
- ✔ Data-driven definitions (logic reads from definition file; no hardcoding of dungeon content)

## Node Types
- ✔ Combat nodes
- ✔ Elite Combat nodes
- ✔ Boss nodes
- ✔ Rest nodes
- ✔ Reward nodes
- ✔ Event nodes (simple reward/damage choices)
- ✔ Empty nodes
- ⚠ Every dungeon is designed to be completable; however, pathing choice resolution is basic (single-path advancement used for auto-advance after combats). More complex path selection UI and blocked-path logic can be expanded.

## Gameplay Rules
- ✔ Party stats persist in modal between nodes (DungeonState.playerVitals)
- ✔ Combat uses existing `CombatModal` via `initializeCombat` and in-modal integration
- ✔ Rest nodes restore stats (configured per-node)
- ✔ Player manually selects next node via clicking nodes in the modal

## Rewards
- ✔ Every node can provide rewards (reward nodes, event choices, loot after combat)
- ✔ Rewards scale by difficulty and depth in definitions (initial scaling data provided; runtime scaling can be added in service)
- ✔ Types supported: gold, consumables, equipment, materials, buffs (buffs supported in types but not fully surfaced in UI)
- ✔ Loot added immediately to character via `handleGameUpdate` (uses `newItems`, `goldChange`, `xpChange`)

## UI
- ✔ Tree/path visualization (simple absolute-position layout using node x/y)
- ✔ Player indicators (party vitals shown in the modal)  
- ✔ Visited/current/locked node states (visual states and click locking implemented)  
- ✔ Click-based node selection implemented

## Exit
- ✔ Boss defeated → dungeon marked cleared; completion rewards applied and notification emitted
- ✔ Early exit allowed via "Exit Dungeon" button (boss rewards forfeited if left early)

## Safety
- ✔ Explicit triggers only (map button, chat intent); no accidental triggers
- ✔ Clean state transitions (DungeonState maintained locally in modal; rewards applied via `handleGameUpdate` to central state)
- ✔ Adventure Chat duplication prevented (chat pauses while modal is open and chat-intent short-circuits to open modal instead of forwarding to AI)

## Reporting / Files
- ✔ Dungeon definitions: `data/dungeonDefinitions.ts` (15+ dungeons)
- ✔ Modal component: `components/DungeonModal.tsx`
- ✔ Service: `services/dungeonService.ts` (start/apply helpers)
- ✔ App integration: `App.tsx` hooks and handlers added
- ✔ Map integration: `components/SkyrimMap.tsx` (Enter Dungeon button)
- ✔ Chat integration: `components/AdventureChat.tsx` (intent parsing, pause input)
- ✔ Report generated: this file `docs/dungeon_minigame_report_v6.md`

---

## Outstanding / Future Improvements
- ✅ UI polish: Node linking visuals (SVG edges) added and locked path visuals improved.
- ✅ Buffs: Dungeon buffs are now converted into `StatusEffect` objects and passed to `handleGameUpdate` as `statusEffects` (applied and shown in status panel).
- ✅ Boss confirmation: Added boss engagement confirmation and exit confirmation to avoid accidental boss fights and forfeiture.
- ⚠ Combat rewards application is functional but relies on combat system to emit reward payloads. Verify edge cases (multi-enemy loot aggregation, companion auto-loot).
- ⚠ Difficulty scaling: Currently controlled by data-defined enemy stats; adding runtime scaling based on recommendedLevel and party size would improve balance.


If you'd like, I can proceed to: add edges/links in the visualization, wire buff effects to the global status system, or implement a confirmation UI for early exit/boss engagement.
