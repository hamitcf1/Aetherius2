# Dungeon Minigame System (v6 – Short)

## Triggering
Dungeon minigame opens ONLY when:
- Player selects a dungeon from Map
- Player explicitly states intent in Adventure Chat:
  - “I want to clear ___ dungeon”
  - “I will clear ___ dungeon”
  - “I enter ___ dungeon to clear it”

No implicit or narrative triggers allowed.

---

## Flow
1. Trigger detected
2. Adventure Chat pauses
3. Dungeon modal opens
4. Dungeon played
5. Modal closes
6. Adventure Chat resumes with outcome-aware narration

---

## Dungeon Design
- Branching tree-path map
- Start → multiple paths → final boss
- Minimum 15 unique dungeons
- Data-driven definitions (no hardcoded logic)

---

## Node Types
- Combat
- Elite Combat
- Boss
- Rest (no enemies)
- Reward
- Event
- Empty (minor effect)

Every dungeon must be completable.

---

## Gameplay Rules
- Party stats persist between nodes
- Combat uses existing combat system
- Rest nodes restore stats
- Player manually selects next node

---

## Rewards
- Every node provides value
- Rewards scale by difficulty and depth
- Types: gold, consumables, equipment, materials, buffs
- Loot added immediately to inventory

---

## UI
- Tree/path visualization
- Player and companion indicators
- Visited/current/locked node states
- Click-based node selection

---

## Exit
- Boss defeated → dungeon cleared, rewards granted
- Early exit allowed, boss rewards forfeited

---

## Safety
- No accidental triggers
- Clean state transitions
- No Adventure Chat duplication

---

## Reporting
Output file: `dungeon_minigame_report_v6.md`

Format:
- ✔ Implemented
- ⚠ Issues with short explanation