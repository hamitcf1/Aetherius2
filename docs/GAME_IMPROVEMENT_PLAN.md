# Skyrim Aetherius - Game Improvement Master Plan

> **Created:** January 19, 2026  
> **Status:** In Progress  
> **Priority:** High - Core gameplay missing

---

## Executive Summary

The application is currently a **well-styled UI shell** with incomplete game mechanics. While it has beautiful visuals, notifications, and navigation, the core gameplay loop is broken or missing entirely. This document outlines all issues found and provides a prioritized roadmap for turning this into a real game.

---

## Critical Issues (Must Fix Immediately)

### 1. ❌ Events/Missions Have No Gameplay
**Status:** Critical  
**Impact:** Users click "Start Event" but nothing happens except a quest being added.

**Current Behavior:**
- User starts event → Quest added to quest log
- No actual gameplay, no combat, no exploration
- Events just sit in "active" state forever

**Required Fix:**
- Events should transition to appropriate gameplay modes:
  - Combat events → Open CombatModal with themed enemies
  - Treasure events → Trigger adventure exploration
  - Mystery events → Open investigation dialogue
  - Merchant events → Open shop modal with special items
  - Shrine events → Apply buff/debuff choices
  - Dragon events → Epic boss combat
  - Bandit events → Ambush combat encounter

### 2. ❌ No Event Completion Mechanism
**Status:** Critical  
**Impact:** Events can never be completed, they stay active forever.

**Required Fix:**
- After combat victory → Mark event as completed, grant rewards
- After treasure found → Complete event
- After investigation resolved → Complete event
- Add "Complete Event" button to adventure chat when objectives met

### 3. ❌ Quest System Disconnected
**Status:** High  
**Impact:** Quests are created but have no impact on gameplay.

**Current Behavior:**
- Quests created with objectives
- Objectives never update from gameplay
- No way to mark objectives complete

**Required Fix:**
- Track quest progress in adventure responses
- Auto-complete objectives based on narrative
- Connect quest completion to rewards

### 4. ❌ Dungeon Integration Missing
**Status:** Medium  
**Impact:** Dungeons on map don't connect to events.

**Required Fix:**
- Event at dungeon location → Enter dungeon flow
- Dungeon clear → Complete associated event
- Boss events require dungeon completion

---

## Gameplay Loop Issues

### 5. Adventure Mode Lacks Structure
**Current:** Free-form text RP with no goals
**Needed:**
- Active quest context shown to AI
- Event context integrated into prompts
- Clear objective tracking
- Combat triggers from narrative

### 6. Combat Rewards Not Applied
**Current:** Combat ends but rewards not consistently applied
**Needed:**
- Guaranteed XP on victory
- Gold drops applied
- Item drops added to inventory
- Event completion triggered

### 7. Level Progression Feels Empty
**Current:** Level up gives stats + 1 perk point
**Needed:**
- New content unlocks at level thresholds
- Tier notifications working (implemented)
- Stronger enemies at higher levels
- Better loot tables by level

---

## UI/UX Issues

### 8. ✅ FIXED - Duplicate Notifications
- Added duplicate prevention
- Added 5-second auto-dismiss

### 9. ✅ FIXED - Events Re-triggerable
- Added guard against starting active events

### 10. ✅ FIXED - Map Performance
- Added requestAnimationFrame throttling
- Added will-change CSS property

### 11. ⚠️ Side Panel Clutter
**Status:** Medium  
**Issue:** Too many tabs, information overload
**Solution:** Consolidate panels, prioritize active content

### 12. ⚠️ Mobile Experience Poor
**Status:** Medium  
**Issue:** Map hard to use on mobile, buttons too small
**Solution:** Touch-optimized controls, larger targets

---

## Missing Features (Prototype → Real)

### 13. Lockpicking Minigame
**Status:** Prototype exists but not connected
**File:** `LockpickingMinigame.tsx`
**Needed:**
- Connect to treasure events
- Connect to locked chests in dungeons
- Connect to home/building break-ins

### 14. Doom Minigame
**Status:** Prototype exists
**File:** `DoomMinigame.tsx`
**Needed:**
- Connect to special dungeon nodes
- Connect to arena events
- Make rewards meaningful

### 15. Shop System
**Status:** Working but disconnected
**Needed:**
- Merchant events open shop with unique items
- Location-based shop inventories
- Buy/sell economy balance

### 16. Companion System
**Status:** Basic implementation
**Needed:**
- Companion events (rescue missions)
- Companion dialogue affects story
- Companion combat participation visible

### 17. Crafting System
**Status:** Not implemented
**Needed:**
- Blacksmith modal for crafting
- Alchemy for potions
- Enchanting for magic items

### 18. Survival Mechanics
**Status:** Partially implemented
**Needed:**
- Hunger/thirst/fatigue affect gameplay
- Food consumption mechanics working
- Rest mechanics balanced

---

## Technical Debt

### 19. State Management
- Too much state in App.tsx (5600+ lines)
- Should use context/reducer pattern
- Consider splitting into feature modules

### 20. Type Safety
- Some `any` types scattered
- Incomplete type definitions
- Runtime type errors possible

### 21. Error Handling
- Silent failures in many places
- No user feedback on errors
- Firebase errors not shown

### 22. Performance
- Large component re-renders
- No virtualization for long lists
- Bundle size could be optimized

---

## Implementation Phases

### Phase 1: Core Gameplay (Week 1)
1. [ ] Event → Combat flow
2. [ ] Event → Reward flow
3. [ ] Event completion mechanism
4. [ ] Quest objective updates

### Phase 2: Integration (Week 2)
1. [ ] Connect minigames to events
2. [ ] Dungeon-event integration
3. [ ] Shop-merchant events
4. [ ] Combat-adventure sync

### Phase 3: Polish (Week 3)
1. [ ] Mobile optimization
2. [ ] Performance tuning
3. [ ] Error handling
4. [ ] Tutorial/onboarding

### Phase 4: Expansion (Week 4+)
1. [ ] More event types
2. [ ] Chain quest lines
3. [ ] Faction system
4. [ ] PvE boss raids

---

## Linear Issues to Create

### Bugs
1. `BUG-001`: Events can be started but never completed
2. `BUG-002`: Quest objectives don't update from gameplay
3. `BUG-003`: Combat rewards not consistently applied
4. `BUG-004`: Dungeon clear doesn't affect map events
5. `BUG-005`: Companion state leaks between characters

### Features
1. `FEAT-001`: Event → Combat integration
2. `FEAT-002`: Event → Minigame integration
3. `FEAT-003`: Merchant event → Shop modal
4. `FEAT-004`: Shrine event → Blessing choice
5. `FEAT-005`: Dragon event → Boss encounter
6. `FEAT-006`: Quest auto-completion from narrative
7. `FEAT-007`: Lockpicking for treasure events
8. `FEAT-008`: Crafting system

### Improvements
1. `IMP-001`: Split App.tsx into modules
2. `IMP-002`: Mobile-first map redesign
3. `IMP-003`: Loading states and skeletons
4. `IMP-004`: Error boundaries and feedback
5. `IMP-005`: Bundle size optimization

---

## File Reference

| File | Purpose | Issues |
|------|---------|--------|
| `App.tsx` | Main app (5600+ lines) | Too large, needs splitting |
| `MapPage.tsx` | Map and events | Performance, missing integrations |
| `CombatModal.tsx` | Combat system | Not connected to events |
| `DungeonModal.tsx` | Dungeon crawl | Not connected to events |
| `eventService.ts` | Event logic | Missing completion logic |
| `AdventureChat.tsx` | Main gameplay | Missing event context |
| `geminiService.ts` | AI integration | Event prompts needed |

---

## Next Steps

1. **Immediate:** Implement Event → Combat flow
2. **Short-term:** Add event completion with rewards
3. **Medium-term:** Connect all minigames
4. **Long-term:** Full gameplay loop completion

---

*This document should be updated as issues are resolved.*
