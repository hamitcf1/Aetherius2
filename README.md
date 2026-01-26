# Skyrim Aetherius

**Version 1.0.6** | [Changelog](components/Changelog.tsx)

**Recent:**
- **v1.0.6 (2026-01-26):** Restored healing & conjuration visual effects and screen flashes; increased VFX z-index and standardized timing (ms helper) for reliable rendering. Added unit tests for spell visuals.
- **v1.0.5 (2026-01-26):** Hotfixes: Modals, Combat & Map Stability (modal wrapper consistency, map crash fix, small reliability fixes).

Skyrim Aetherius is a web app for running a Skyrim-flavored roleplay campaign like a game: you create characters, track inventory and quests, write story/journal entries, and use an AI GM to generate narrative + structured game-state updates.

This README is both a player tutorial and a developer/operator guide.

## Table of contents

- What this app is
- How to play (player tutorial)
- Progression system (time + hunger/thirst/fatigue)
- Combat system
- Console commands (dev tools)
- AI models + keys
- Data + saving model (Firestore + Realtime)
- Local development
- Testing
- **Customization & Extension Guide** (see `docs/CUSTOMIZATION_README.md`)
- Firebase setup (required)
- Deployment (Netlify)
- Do / Don’t (important)
- Troubleshooting

## What this app is

- A single-page app (React + TypeScript + Vite)
- Skyrim-themed character sheet + story/journal/quest/inventory tracking
- AI-assisted gameplay: the GM returns a JSON “update” object that can add items, start quests, advance time, etc.

## How to play (player tutorial)

### 1) Log in and create a profile

1. Register or log in
2. Create a Profile (this is “your” account-space)
3. Create or select a Character under that profile

### 2) Understand the tabs

- **Hero**: your character sheet (stats, skills, perks/milestones, rules/constraints, and now in-game time + survival needs)
- **Equipment**: inventory, quantities, equipped state, gold
- **Quests**: quests with location + objectives; supports bulk objective editing
- **Story**: narrative chapters (manual or AI-generated)
- **Journal**: first-person diary entries (auto-generated notes are also first-person)
- **Adventure**: AI-driven “play” loop (chat). This is the closest thing to the game.

### 3) Adventure mode (recommended gameplay loop)

1. Open **Adventure**
2. Write your action in first-person (example: “I follow the footsteps toward the river and keep low.”)
3. The GM responds with narrative and may include:
   - new items gained/lost
   - quest updates
   - gold/XP changes
   - time advancement and survival needs changes
   - clickable dialogue/action choices (buttons)

If “Auto-apply game changes” is ON, the GM updates will apply automatically.
If it’s OFF, you can manually “Apply Changes” per message.

## Progression system (time + hunger/thirst/fatigue)

### What exists today

- Each character has:
  - `time`: day/hour/minute
  - `needs`: hunger/thirst/fatigue (0 good → 100 bad)

You can view these in **Hero**.

### Rest / Eat / Drink

Open **Actions** → **Survival**:

- **Rest (8h)**: advances time and reduces fatigue
- **Eat**: reduces hunger and consumes a matching “food-like” inventory item
- **Drink**: reduces thirst and consumes a matching “drink-like” inventory item

Important: Eat/Drink use a simple heuristic (keywords + item type). If you want perfect matching, keep your inventory names clear (e.g., “Bread”, “Apple”, “Stew”, “Water”, “Mead”, “Wine”).

### Tuning how fast needs rise

Passive needs increase when time passes.
You can tune the rates in `NEED_RATES` in `App.tsx`.

## Combat system

The game features a Pokemon-style turn-based combat system:

- **Combat triggers**: AI can start combat via `combatStart` in game state updates
- **Actions**: Attack, Power Attack, Magic, Shout, Defend, Use Item, Flee
- **AoE physical attacks**: Whirlwind Attack and Cleaving Strike hit multiple enemies based on your roll:
  - Nat 1: Miss all targets
  - 2-4: Hit 1 enemy
  - 5-9: Hit 2 enemies
  - 10-14: Hit 3 enemies
  - 15-19: Hit 4 enemies
  - Nat 20: Hit ALL enemies
- **Ability cooldowns**: Powerful abilities have cooldowns (1-4 turns) preventing spam tactics
- **Sound effects**: Melee/ranged/magic hits, blocking, enemy death sounds
- **Loot system**: Enemies drop items, gold, and XP on defeat
- **Companions**: Can join combat and act autonomously or be player-controlled
- **Mobile support**: Full combat UI on mobile with Physical/Magical ability tabs

## Console commands (dev tools)

Open browser console (F12) and type `demo.help()` for all available commands.

### Quick reference

```js
// Character
demo.addPerkPoints(3)        // Add perk points
demo.addExperience(500)      // Add XP
demo.levelUp()               // Quick level up

// Inventory
demo.addRandomItems(5)       // Add random items
demo.giveItem('Iron Sword', 'weapon', 1)  // Give specific item [ADMIN]

// Combat simulation
demo.simulateCombat()        // Start basic combat
demo.simulateCombatHelp()    // Show detailed combat options

// Combat with multiple enemies
demo.simulateCombat({
  enemies: [
    { name: 'Bandit Chief', type: 'humanoid', healthMultiplier: 1.5, armor: 30, isBoss: true },
    { name: 'Bandit Thug', type: 'humanoid', healthMultiplier: 0.8, armor: 15 }
  ],
  location: 'Road to Whiterun'
})

// Lockpicking
demo.lockpick('master')      // Test lockpicking minigame
```

## AI models + keys

### Switching models

Open **Actions** → **AI Model**.

The app supports:

- Gemini 2.5 Flash Lite (`gemini-2.5-flash-lite`) - Fastest
- Gemini 2.5 Flash (`gemini-2.5-flash`) - Balanced
- Gemini 3 Flash (`gemini-3-flash`) - Latest
- Gemma 3 27B (`gemma-3-27b`) - Largest
- Gemma 3 12B (`gemma-3-12b`) - Large
- Gemma 3 4B (`gemma-3-4b`) - Medium
- Gemma 3 2B (`gemma-3-2b`) - Small
- Gemma 3 1B (`gemma-3-1b`) - Smallest

### Required environment variables (AI)

Gemini key (pick one):

- `VITE_GEMINI_API_KEY` (recommended)
- `VITE_API_KEY`
- `GEMINI_API_KEY` (supported via Vite define)
- `API_KEY` (supported via Vite define)

Gemma key (pick one):

- `VITE_GEMMA_API_KEY` (recommended)
- `GEMMA_API_KEY` (supported via Vite define)
- `gemma_api_key` (supported via Vite define / Netlify)

Notes:

- Some models (Gemma) do not support JSON response mode; the app retries without it.
- The app also extracts JSON from plain text responses as a fallback.

## Data + saving model

This project uses a hybrid Firebase approach:

- **Firestore (primary persistence)**
  - Characters, inventory items, quests, journal entries, story chapters, profiles
  - Adventure chat messages are stored per user + character
  - Offline persistence is enabled when supported

- **Realtime Database (ephemeral/live state only)**
  - Presence (online/offline)
  - Active character session
  - (Optional) AI generation state

Saving:

- Auto-save: debounced “dirty entity” writes to Firestore
- Manual save: Actions → Save forces a batch save

## Local development

### Prerequisites

- Node.js (recommended: current LTS)

### Install + run

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

## Testing

We use Vitest for unit tests and React Testing Library for component tests. Playwright is recommended for end-to-end (E2E) tests.

- Run unit tests:

```bash
npm test
```

- Run tests in watch mode (Vitest):

```bash
npx vitest --watch
```

> Note: An automated test run on 2026-01-26 reported **49 failing tests** across several suites. See `docs/updates/2026-01-26-test.log` for the full output and status while triage is ongoing.

- Add component tests using @testing-library/react and `tests/*.spec.tsx` naming convention.

- E2E (Playwright) (optional): install and run Playwright tests with:

```bash
npm i -D @playwright/test
npx playwright install
npx playwright test
```

- Test matrix and test coverage planning lives in `tests/TEST_MATRIX.md` and `tests/CONTRIBUTING_TESTS.md` (guidelines for writing tests).

- CI: add a workflow that runs `npx tsc --noEmit`, `npm test`, and (optionally) `npx playwright test` on push/PR.

Please see `tests/TEST_MATRIX.md` for a prioritized list of feature tests to implement.
## Firebase setup (required)

### 1) Create a Firebase project

In Firebase Console:

1. Create a project
2. Enable **Authentication** → Email/Password
3. Create a **Firestore** database
4. Create a **Realtime Database** (for presence/session)

### 2) Configure environment variables (Firebase)

Set these for Vite (local `.env` or Netlify environment variables):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL` (Realtime DB URL)
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### 3) Security rules

Use the rules in FIREBASE_SECURITY_RULES.md:

- Firestore: per-user read/write under `users/{uid}/...`
- Realtime DB: presence + sessions + aiState restricted to the authenticated user

## Deployment (Netlify)

This repo includes a Netlify config in `netlify.toml`.

Recommended:

1. Create a Netlify site connected to the repo
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables (Firebase + AI keys)
5. Deploy

SPA routing is handled via redirects.

## Do / Don’t

### Do

- Do write player actions in first-person for best immersion
- Do keep inventory item names clear if you want Eat/Drink to work reliably
- Do review the game-state updates when Auto-apply is off
- Do keep Firestore rules strict (per-user)
- Do use a separate Gemma key if you want to avoid Gemini quota issues

### Don’t

- Don’t paste API keys or secrets into the AI prompts/chat
- Don’t loosen security rules beyond `users/{uid}` scoping
- Don’t treat the AI output as canon without review—use it as a GM assistant
- Don’t manually edit Firestore documents unless you understand the schema
- Don’t rely on Realtime Database for persistence (Firestore is the source of truth)

## Troubleshooting

### “Quota exceeded” in AI

- Switch model in Actions → AI Model
- Ensure the correct key is set (`VITE_GEMINI_API_KEY` / `VITE_GEMMA_API_KEY`)

### Firestore permission errors

- Confirm authentication is enabled
- Confirm Firestore security rules match FIREBASE_SECURITY_RULES.md

### Eat/Drink says “No food/drink found”

- Add an item named like “Bread”, “Apple”, “Stew”, “Water”, “Mead”, etc.
- Or rename your existing items to include those keywords

### Multi-tab persistence warnings

Firestore offline persistence may disable itself if multiple tabs are open. This is expected.

---

License: this project is marked `private` in package.json.

Project developed for Skyrim roleplay community.

## 🙏 Credits

- Skyrim/Elder Scrolls - Bethesda Game Studios
- AI Integration - Google Gemini API
- Backend - Firebase
- Icons - Lucide React

---

**Version**: 1.0.6  
**Last Updated**: January 27, 2026
