# Linear Issues - Skyrim Aetherius

> **Created:** January 19, 2026  
> **Scope:** All issues identified during game improvement audit

---

## Bug Issues

### BUG-001: Events Can Never Be Completed
**Priority:** Critical  
**Labels:** `bug`, `gameplay`, `blocking`

**Description:**
Dynamic events can be started via the Map page but there is no mechanism to complete them. Events stay in "active" status forever. The "Complete Event" flow only exists as a handler but is never called from gameplay.

**Current Behavior:**
1. User clicks "Start Event" on map
2. Event status changes to "active"
3. A quest is created in the quest log
4. Nothing else happens - event stays active indefinitely

**Expected Behavior:**
1. Starting an event triggers appropriate gameplay (combat, exploration, etc.)
2. Completing the gameplay (winning combat, finding treasure) marks event complete
3. Rewards (gold, XP, items) are granted
4. Event moves to completed state

**Technical Notes:**
- `handleCompleteDynamicEvent` exists in App.tsx but is never triggered
- Need to call this after combat victory, dungeon clear, or objective completion
- Consider adding "Complete Event" button in Adventure chat when objectives met

**Files Affected:**
- `App.tsx` (lines 1560-1620)
- `CombatModal.tsx`
- `DungeonModal.tsx`
- `AdventureChat.tsx`

---

### BUG-002: Quest Objectives Never Update
**Priority:** High  
**Labels:** `bug`, `gameplay`, `quest-system`

**Description:**
Quests are created with objectives but objectives never update to "completed" based on gameplay. The quest system is purely decorative.

**Current Behavior:**
- Quest created with objectives array
- Objectives always stay "completed: false"
- No automatic or manual completion mechanism

**Expected Behavior:**
- AI responses can mark objectives complete
- Combat victory completes "defeat X" objectives
- Location visits complete "go to X" objectives
- Item acquisition completes "find X" objectives

**Technical Notes:**
- `GameStateUpdate` has `updateQuests` field but rarely used
- Need to parse AI responses for objective completion signals
- Consider adding `completeQuestObjective(questId, objectiveIndex)` handler

**Files Affected:**
- `App.tsx` (handleGameUpdate)
- `geminiService.ts` (adventure prompts)
- `AdventureChat.tsx`

---

### BUG-003: Combat Rewards Inconsistently Applied
**Priority:** High  
**Labels:** `bug`, `combat`, `rewards`

**Description:**
After winning combat, rewards (XP, gold, items) are sometimes applied and sometimes not. The transaction ledger system may be filtering legitimate rewards.

**Current Behavior:**
- Combat ends with victory
- CombatModal reports rewards in onClose callback
- Sometimes rewards appear, sometimes they don't
- Console shows "filtered duplicate update" messages

**Expected Behavior:**
- Every combat victory grants guaranteed rewards
- XP always applied
- Gold always applied
- Items always added to inventory
- Clear toast/notification of rewards received

**Technical Notes:**
- Transaction ledger filtering may be too aggressive
- `handleApplyDungeonRewards` exists but may not cover all cases
- Combat from map events may use different reward path

**Files Affected:**
- `App.tsx` (lines 3200+ handleGameUpdate)
- `CombatModal.tsx`
- `transactionLedger.ts`

---

### BUG-004: Dungeon Completion Not Connected to Events
**Priority:** Medium  
**Labels:** `bug`, `dungeons`, `events`

**Description:**
Completing a dungeon doesn't affect any associated map events. Events at dungeon locations remain active even after the dungeon is cleared.

**Current Behavior:**
- Event at dungeon location started
- User enters dungeon from map
- User clears dungeon
- Event still shows as "active"

**Expected Behavior:**
- Dungeon clear should complete associated event
- Dungeon boss kill should complete dragon/boss events
- Cleared dungeon indicator should show on map

**Technical Notes:**
- `clearedDungeons` tracked on character but not connected to events
- Need to match event location to dungeon location
- DungeonModal.onClose should trigger event completion check

**Files Affected:**
- `App.tsx` (DungeonModal handling)
- `MapPage.tsx` (dungeon-event correlation)
- `eventService.ts`

---

### BUG-005: Companion State Leaks Between Characters
**Priority:** Low  
**Labels:** `bug`, `companions`, `data-integrity`

**Description:**
When switching characters, companion state sometimes persists incorrectly. A companion recruited on Character A may briefly appear on Character B.

**Current Behavior:**
- Switch from Character A to Character B
- For a frame, Character A's companions visible
- Then companions clear and reload

**Expected Behavior:**
- Clean state transition
- No flash of incorrect companions
- Immediate load of correct companions

**Technical Notes:**
- useEffect clears companions but may race with load
- Need to ensure clear happens synchronously before character switch completes
- Consider loading companions as part of character data

**Files Affected:**
- `App.tsx` (companion useEffect)

---

## Feature Issues

### FEAT-001: Event → Combat Integration
**Priority:** Critical  
**Labels:** `feature`, `gameplay`, `combat`

**Description:**
Combat-type events (combat, dragon, bandit) should automatically open the Combat Modal with appropriate enemies.

**Acceptance Criteria:**
- [ ] Combat events open CombatModal on start
- [ ] Enemies generated based on event type and tier
- [ ] Combat victory completes the event
- [ ] Event rewards applied after combat
- [ ] Dragon events spawn dragon-type enemies
- [ ] Bandit events spawn bandit groups

**Technical Approach:**
1. In `handleStartDynamicEvent`, check event type
2. If combat type, call existing combat initialization
3. Pass event context to enemy generation
4. On combat victory callback, call `handleCompleteDynamicEvent`

---

### FEAT-002: Event → Minigame Integration
**Priority:** High  
**Labels:** `feature`, `gameplay`, `minigames`

**Description:**
Certain event types should trigger minigames instead of combat or quests.

**Acceptance Criteria:**
- [ ] Treasure events trigger lockpicking minigame
- [ ] Special events can trigger Doom-style dungeon
- [ ] Minigame success completes event
- [ ] Minigame failure allows retry or abandons event

**Files Affected:**
- `App.tsx`
- `LockpickingMinigame.tsx`
- `MiniGameModal.tsx`
- `eventService.ts`

---

### FEAT-003: Merchant Event → Shop Modal
**Priority:** High  
**Labels:** `feature`, `gameplay`, `economy`

**Description:**
Merchant-type events should open a special shop modal with unique/discounted items.

**Acceptance Criteria:**
- [ ] Merchant event opens ShopModal
- [ ] Shop inventory based on event tier/location
- [ ] Special discount or unique items available
- [ ] Closing shop completes event (gold spent counts as interaction)
- [ ] If nothing purchased, event remains available

---

### FEAT-004: Shrine Event → Blessing Choice
**Priority:** Medium  
**Labels:** `feature`, `gameplay`, `buffs`

**Description:**
Shrine events should present a choice of blessings/buffs to the player.

**Acceptance Criteria:**
- [ ] Shrine event opens blessing choice modal
- [ ] 2-3 buff options based on shrine deity
- [ ] Selecting buff applies status effect
- [ ] Event completes after blessing received
- [ ] Blessing duration in game-time hours

---

### FEAT-005: Dragon Event → Boss Encounter
**Priority:** High  
**Labels:** `feature`, `gameplay`, `combat`, `boss`

**Description:**
Dragon events should trigger special boss combat encounters with unique mechanics.

**Acceptance Criteria:**
- [ ] Dragon event spawns dragon enemy type
- [ ] Dragon has special abilities (fire breath, flight)
- [ ] Higher tier dragons are stronger
- [ ] Unique dragon loot table
- [ ] Dragon soul gained on victory (for shouts system?)

---

### FEAT-006: Quest Auto-Completion from Narrative
**Priority:** Medium  
**Labels:** `feature`, `quests`, `ai-integration`

**Description:**
The AI should be able to mark quest objectives as complete through narrative responses.

**Acceptance Criteria:**
- [ ] AI response can include `updateQuests` with objective completions
- [ ] System prompt instructs AI on quest completion format
- [ ] Objectives update in quest log
- [ ] Toast notification on objective completion
- [ ] Quest marked complete when all objectives done

---

### FEAT-007: Lockpicking for Treasure Events
**Priority:** Medium  
**Labels:** `feature`, `minigames`, `treasure`

**Description:**
Treasure events should require lockpicking to access the loot.

**Acceptance Criteria:**
- [ ] Treasure event triggers lockpicking minigame
- [ ] Lock difficulty based on event tier
- [ ] Success grants treasure chest loot
- [ ] Failure allows retry (consumes lockpick item?)
- [ ] Loot table based on event tier

---

### FEAT-008: Crafting System
**Priority:** Low  
**Labels:** `feature`, `economy`, `items`

**Description:**
Implement crafting at blacksmith and alchemy stations.

**Acceptance Criteria:**
- [ ] Blacksmith modal for weapon/armor crafting
- [ ] Alchemy for potions from ingredients
- [ ] Enchanting for magic properties
- [ ] Recipe unlocking system
- [ ] Material gathering from events/dungeons

---

## Improvement Issues

### IMP-001: Split App.tsx into Modules
**Priority:** Medium  
**Labels:** `improvement`, `refactor`, `tech-debt`

**Description:**
App.tsx is over 5600 lines and handles too many responsibilities. Split into focused modules.

**Proposed Structure:**
```
/features
  /combat
    useCombat.ts
    CombatContext.tsx
  /events
    useEvents.ts
    EventsContext.tsx
  /character
    useCharacter.ts
    CharacterContext.tsx
  /inventory
    useInventory.ts
    InventoryContext.tsx
```

---

### IMP-002: Mobile-First Map Redesign
**Priority:** Medium  
**Labels:** `improvement`, `mobile`, `ux`

**Description:**
Map is difficult to use on mobile devices. Needs touch-optimized controls.

**Acceptance Criteria:**
- [ ] Larger touch targets for markers
- [ ] Bottom sheet panel instead of side panel on mobile
- [ ] Gesture controls for zoom/pan
- [ ] Mobile-friendly legend

---

### IMP-003: Loading States and Skeletons
**Priority:** Low  
**Labels:** `improvement`, `ux`, `polish`

**Description:**
Add loading skeletons for async data loading.

**Affected Areas:**
- Character sheet loading
- Inventory loading
- Map markers loading
- Quest list loading

---

### IMP-004: Error Boundaries and Feedback
**Priority:** Medium  
**Labels:** `improvement`, `error-handling`, `ux`

**Description:**
Add error boundaries and user-friendly error messages.

**Acceptance Criteria:**
- [ ] React error boundaries around major sections
- [ ] Toast notifications for errors
- [ ] Retry buttons where applicable
- [ ] Firebase error handling

---

### IMP-005: Bundle Size Optimization
**Priority:** Low  
**Labels:** `improvement`, `performance`

**Description:**
Reduce bundle size for faster loading.

**Approaches:**
- Code splitting by route
- Lazy load modals
- Tree-shake unused icons
- Optimize images/assets

---

## Estimation Summary

| Category | Count | Estimated Hours |
|----------|-------|-----------------|
| Bugs | 5 | 15-20 |
| Features | 8 | 40-60 |
| Improvements | 5 | 20-30 |
| **Total** | **18** | **75-110** |

---

*Ready to import into Linear or similar project management tool.*
