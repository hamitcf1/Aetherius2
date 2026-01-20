# Firebase Read/Write Usage Issues

## Critical Issues Found

### 🔴 Issue #1: Inventory Re-Loading on Combat State Changes
**Location:** [App.tsx](../App.tsx#L2360-L2388)

**Problem:**
```tsx
useEffect(() => {
  // ... loads inventory from Firestore
}, [currentUser?.uid, currentCharacterId, combatState]);
```

The `loadInventoryItems()` Firestore query runs **every time combat state changes**, even though it has a guard `if ((combatState as any)?.active) return`. This is still inefficient because:
- Combat state updates frequently (every attack, HP change, turn change)
- The effect runs on EVERY combatState object reference change
- Even with the early return, React still executes the effect

**Impact:** **HIGH** - Likely the #1 contributor to excessive reads
- Combat can update 10-50+ times per battle
- Each state change triggers the effect (even if guarded)
- With multiple battles per session = hundreds of unnecessary effect executions

**Fix:** Remove `combatState` from dependency array:
```tsx
}, [currentUser?.uid, currentCharacterId]); // Remove combatState!
```

---

### 🟡 Issue #2: Loading ALL Data for All Characters on Login
**Location:** [App.tsx](../App.tsx#L1652-L1660)

**Problem:**
```tsx
const [userProfiles, userCharacters, userItems, userQuests, userEntries, userChapters, settings] = await Promise.all([
  loadUserProfiles(user.uid),
  loadCharacters(user.uid),
  loadInventoryItems(user.uid, preferredCharacterId),  // ✅ Good - scoped to character
  loadQuests(user.uid),                                 // ❌ Loads ALL quests
  loadJournalEntries(user.uid),                         // ❌ Loads ALL journal entries
  loadStoryChapters(user.uid),                          // ❌ Loads ALL story chapters
  loadUserSettings(user.uid)
]);
```

**Impact:** **MEDIUM-HIGH**
- `loadQuests()`, `loadJournalEntries()`, `loadStoryChapters()` load **all data for all characters**
- For users with 3-5 characters with full quest logs = 100s of unnecessary document reads
- Happens on EVERY login/page refresh

**Current Reads:**
- User with 3 characters, 50 quests each = **150 quest reads**
- 100 journal entries total = **100 journal reads**
- 80 story chapters = **80 story reads**
- **TOTAL: ~330+ excess reads on every login**

**Fix:** Scope all queries to `characterId`:
```tsx
const [userProfiles, userCharacters, userItems, userQuests, userEntries, userChapters, settings] = await Promise.all([
  loadUserProfiles(user.uid),
  loadCharacters(user.uid),
  loadInventoryItems(user.uid, preferredCharacterId),
  loadQuests(user.uid, preferredCharacterId),           // Add characterId param
  loadJournalEntries(user.uid, preferredCharacterId),   // Add characterId param
  loadStoryChapters(user.uid, preferredCharacterId),    // Add characterId param
  loadUserSettings(user.uid)
]);
```

---

### 🟡 Issue #3: No Query Result Limits
**Location:** [services/firestore.ts](../services/firestore.ts)

**Problem:**
All queries load **unlimited** results. No `limit()` clauses:
```tsx
// loadQuests - loads ALL quests
const q = query(collRef, ...constraints, orderBy('createdAt', 'desc'));

// loadJournalEntries - loads ALL entries
const q = query(collRef, ...constraints, orderBy('createdAt', 'desc'));

// loadStoryChapters - loads ALL chapters
const q = query(collRef, ...constraints, orderBy('createdAt', 'desc'));
```

**Impact:** **MEDIUM**
- Long-running characters accumulate 100s of quest/journal/story documents
- Every login reads ALL of them, even if UI only shows recent 10-20

**Fix:** Add pagination or reasonable limits:
```tsx
import { limit } from 'firebase/firestore';

// Example: Only load most recent 100 entries initially
const q = query(
  collRef, 
  ...constraints, 
  orderBy('createdAt', 'desc'),
  limit(100)  // Add limit!
);
```

---

### 🟡 Issue #4: Real-time Database Listeners Running 24/7
**Location:** [App.tsx](../App.tsx#L1645) and [services/realtime.ts](../services/realtime.ts)

**Problem:**
```tsx
// Set user online status in Realtime DB
await setUserOnline(user.uid);
```

Real-time Database listeners (`onValue`) for:
- User presence (`presence/${uid}`)
- Active character (`sessions/${uid}/activeCharacter`)
- AI generation state (`aiState/${uid}`)

**Impact:** **LOW-MEDIUM**
- Each `onValue` listener continuously polls/listens
- Realtime DB charges for **bandwidth** (downloads), not just writes
- Screenshot shows **2.67MB downloads in 7 days** - this is likely from these listeners

**Recommendation:**
1. **User Presence**: Only needed for multiplayer features - consider disabling if not used
2. **Active Character**: Consider using localStorage instead of Realtime DB
3. **AI State**: Only set up listener when AI generation is actually happening

---

### 🟢 Issue #5: Achievement State Loading Pattern
**Location:** Throughout App.tsx

**Observation:**
Achievement state appears to be loaded separately and frequently. Check if:
- Achievement state is being loaded on every character switch
- Achievement unlocks trigger full state reloads

**Status:** Needs further investigation in [services/achievementsService.ts](../services/achievementsService.ts)

---

## Recommendations Summary

### Priority 1 (Immediate - High Impact):
1. ✅ **Remove `combatState` from inventory loading dependency array** ([App.tsx](../App.tsx#L2360))
   - Expected savings: **50-200+ reads per combat session**
   
2. ✅ **Scope initial data loading to `characterId`** ([App.tsx](../App.tsx#L1652))
   - Expected savings: **200-500+ reads per login** (depending on character count)

### Priority 2 (Short-term - Medium Impact):
3. ✅ **Add `limit()` to all collection queries**
   - Target: Limit to 100 most recent items initially
   - Expected savings: **100-300+ reads for veteran players**

4. ✅ **Audit Realtime Database usage**
   - Remove unused presence/session listeners
   - Use localStorage for single-user state instead of Realtime DB

### Priority 3 (Long-term - Optimization):
5. ⏳ **Implement pagination for quest/journal/story logs**
   - Load initial batch (e.g., 20 items)
   - "Load More" button for older entries
   
6. ⏳ **Cache strategy improvements**
   - Leverage Firestore offline persistence more aggressively
   - Add client-side cache timestamps to avoid redundant loads

---

## Metrics to Track

After fixes, monitor in Firebase Console:
- **Firestore Reads**: Should drop by 60-80% for typical gameplay sessions
- **Realtime DB Downloads**: Should drop if presence/session listeners are optimized
- **User Experience**: Page load time should improve (less data to fetch)

---

## Testing Plan

1. **Before Fixes:**
   - Record reads for: login → select character → play 1 hour → logout
   - Expected: ~500-1000 reads

2. **After Priority 1 Fixes:**
   - Same test scenario
   - Expected: ~100-300 reads (**60-70% reduction**)

3. **After All Fixes:**
   - Expected: ~50-150 reads (**85-90% reduction*!)

---

## Code Locations Summary

| Issue | File | Line(s) | Severity |
|-------|------|---------|----------|
| Inventory reload on combat | App.tsx | 2360-2388 | 🔴 Critical |
| Loading all character data | App.tsx | 1652-1660 | 🟡 High |
| No query limits | firestore.ts | 244, 291, 341, 370+ | 🟡 Medium |
| Realtime DB listeners | realtime.ts | 56, 100, 151 | 🟡 Medium |

