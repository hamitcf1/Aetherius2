# Skyrim Aetherius - Gemini Inspection Report

## 1. Project Overview
**Skyrim Aetherius** is a sophisticated Roleplay Management System (RMS) and text-based RPG for Elder Scrolls V: Skyrim. It bridges the gap between a character sheet utility and an AI-powered Text Adventure game.

**Tech Stack:**
-   **Frontend:** React 18, TypeScript, Vite, Tailwind CSS.
-   **Backend/Persistence:** Firebase (Firestore, Auth, Realtime Database).
-   **AI Engine:** Google Gemini & Gemma Models (via `@google/genai`).
-   **Styling:** Custom "Skyrim" theme (Gold/Dark/Paper aesthetic).

## 2. Architecture & Design Patterns

### State Management
The application uses a **hybrid state management** approach:
-   **Local State:** `App.tsx` holds the primary game state (`characters`, `items`, `quests`, `storyChapters`) using `useState`.
-   **Context API:** `AppContext.tsx` exposes actions and state to child components, effectively acting as a Service Locator for UI components.
-   **Persistence:** A custom synchronization layer (`useEffect` hooks in `App.tsx`) pushes state changes to Firestore and listens for real-time updates.

### Service Layer (`/services`)
Business logic is decoupled from UI components into specialized services.
-   **`geminiService.ts`**: Wrapper for AI interactions (Narrative, Image Gen, Logic).
-   **`combatService.ts`**: Core combat math, turn processing, and enemy logic.
-   **`firestore.ts`**: Database CRUD operations.
-   **`survivalState.ts`** & **`vitals.ts`**: Manages hunger, thirst, fatigue, and health/stamina/magicka calculations.
-   **`eventService.ts`** & **`mapEventHandlers.ts`**: Handles dynamic world events.

### Feature Flags (`featureFlags.ts`)
A robust feature toggle system allows granular control over system availability.
-   **Admin-Only:** Debug tools and test features.
-   **WIP:** Experimental features like Multiplayer Presence.
-   **Core:** Survival, Story, Adventure, Shop, etc.

## 3. AI Integration (Gemini/Gemma)
The project heavily leverages Generative AI, managed by `services/geminiService.ts`.

### Key AI Functions
1.  **Game Master (GM):** `generateGameMasterResponse`
    -   Acts as the narrative engine.
    -   Processes player actions + game context.
    -   Outputs JSON with narrative text, quest updates, item changes, and state mutations.
    -   **Safety:** Includes rigid output validation (`validateGameStateUpdate`) to prevent AI from breaking game rules (e.g., hallucinating invalid items).
2.  **Adventure Chat:** `generateAdventureResponse`
    -   Handles free-form roleplay interactions.
    -   Strictly separate from mechanical state changes in some modes.
3.  **Visuals:** `generateLoreImage` & `generateCharacterProfileImage`
    -   Creates 16:9 scene visualizations or 1:1 character portraits.
4.  **Procedural Generation:**
    -   `generateCharacterProfile`: Creates full character sheets (stats, backstory, items) from simple prompts.
    -   `generateCombatEncounter`: Spawns balanced enemies based on player level/tier.
    -   `generateDynamicEvents`: Creates quest hooks and world events.

### Infrastructure
-   **Fallback Chain:** Automatically falls back from `gemini-2.5-flash-lite` -> `gemini-2.5-flash` -> `gemma-3-*` models on failure.
-   **Key Rotation:** Supports up to 20 API keys to handle rate limits.
-   **Rate Limiting:** Tracks calls per minute/hour to prevent 429 errors.

## 4. Core Game Systems

### Combat
-   **Turn-Based:** Modeled in `combatService.ts`.
-   **State:** Tracks Player vs. Enemy(s).
-   **Mechanics:**
    -   Calculates damage based on Skyrim formulas (Armor Rating, Weapon Damage).
    -   Supports Spells, Shouts, and Abilities.
    -   Includes "Skip Turn" and cooldown mechanics.

### Survival
-   **Needs:** Hunger, Thirst, Fatigue (0-100 scale).
-   **Time:** 1 real second = X in-game minutes (configurable).
-   **Consequences:** Penalties to stats (Health/Stamina/Magicka) when needs are neglected.
-   **Rest:** `BonfireMenu.tsx` / `RestModal.tsx` for recovering fatigue and passing time.

### Inventory & Economy
-   **Items:** Typed as `InventoryItem` (Weapon, Apparel, Potion, etc.).
-   **Encumbrance:** Calculated based on item weight vs. Stamina-derived capacity.
-   **Shops:** `ShopModal.tsx` allows buying/selling with gold limits.

## 5. Directory Guide

| Directory | Purpose | Key Files |
| :--- | :--- | :--- |
| `components/` | UI Components | `CharacterSheet.tsx`, `CombatModal.tsx`, `StoryLog.tsx`, `Inventory.tsx` |
| `services/` | Business Logic | `geminiService.ts`, `combatService.ts`, `firestore.ts`, `audioService.ts` |
| `data/` | Static Game Data | `lootTables.ts`, `dungeonDefinitions.ts`, `perkDefinitions.ts` |
| `types/` | TypeScript Definitions | `types.ts` (Central type store) |
| `docs/` | Documentation | `PROJECT_EXPLANATION.md`, `feature_overview.md` |
| `scripts/` | Build/Maintenance | `check_syntax.js`, `simulate_adventure_sanitize.js` |

## 6. Development Workflow
1.  **Adding a Feature:**
    -   Define types in `types.ts`.
    -   Implement logic in a `service`.
    -   Create/Update `component`.
    -   Add feature flag in `featureFlags.ts`.
2.  **Modifying AI:**
    -   Update prompts in `services/geminiService.ts`.
    -   Update validation logic if response schema changes.
3.  **Database Changes:**
    -   Update `services/firestore.ts`.
    -   Add migration script if schema changes significantly (see `docs/FIRESTORE_MIGRATION.md`).
