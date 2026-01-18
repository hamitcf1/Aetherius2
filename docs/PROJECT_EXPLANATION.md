# Skyrim Aetherius - Project Explanation & Architecture

## 📋 Project Overview

Skyrim Aetherius is a comprehensive character roleplay management application designed specifically for Elder Scrolls V: Skyrim enthusiasts. It combines character creation tools, narrative management, and AI-powered storytelling to create an immersive roleplay experience.

The application allows users to create detailed characters with complex psychological profiles, manage their inventory and quests, track their personal narrative journey, and leverage AI to generate contextually-aware story chapters.

## 🎯 Core Philosophy

The project follows these design principles:

1. **Immersion First** - Skyrim-themed UI/UX that maintains the Elder Scrolls atmosphere
2. **AI-Enhanced Creativity** - AI assists rather than replaces user creativity
3. **Data Persistence** - All character progress is automatically and manually saveable
4. **User Autonomy** - Complete control over character details and story direction
5. **Modular Design** - Each component (character, inventory, story, etc.) is independent yet interconnected

## 🏗️ Application Architecture

### Frontend Structure

```
App.tsx (Main Application Hub)
├── Authentication Layer
│   ├── Login/Register UI
│   └── Firebase Auth Integration
│
├── Navigation & Tabs
│   ├── Character Sheet
│   ├── Inventory Manager
│   ├── Quest Log
│   ├── Story & Chapters
│   └── Journal Entries
│
├── Data Management
│   ├── State Management (React Hooks)
│   ├── Firebase Sync (Real-time)
│   └── Manual Save Functionality
│
└── AI Integration
    ├── Character Generation
    ├── Story Generation
    └── Image Generation
```

### Data Flow

```
User Input
    ↓
React State Update
    ↓
Component Re-render
    ↓
Optional: AI Processing
    ↓
Firebase Auto-sync
    ↓
Cloud Database
    ↓
Real-time Listener
    ↓
State Synchronization
```

## 🔑 Key Components

### 1. **CharacterSelect.tsx**
**Purpose**: User profile and character selection interface

**Features**:
- User profile management with edit capability
- Character list with quick stats display
- Four character creation methods:
  - Manual quick-create
  - Full random generation
  - Interactive Scribe Chat
  - Text import from descriptions

**Data Management**:
- Stores/retrieves user profiles
- Lists characters per profile
- Handles profile/character renaming

### 2. **CharacterSheet.tsx**
**Purpose**: Main character editor and development interface

**Components**:
- **Header Section**: Character name, portrait (auto-generated), basic info
- **Stats Section**: Health/Magicka/Stamina with dual controls (slider + numeric input)
- **Skills Section**: 18 Skyrim skills with editable levels
- **Psychology Section**: Identity, motivations, moral code, faction allegiance
- **Roleplay Rules**: Allowed/forbidden actions, fears, weaknesses, talents
- **Progression**: Levels, experience, gold, perks, milestones
- **Export**: PDF export of full character record

**Key Features**:
- Real-time stat updates
- Stat bar visualization
- Perk management with skill-based organization
- Milestone tracking with achievement system
- PDF export with custom formatting

### 3. **StoryLog.tsx**
**Purpose**: Story and narrative management

**Features**:
- **Chapter Display**: Timeline view of all story entries
- **Manual Creation**: Write chapters directly
- **AI Generation**: Describe actions, AI generates narrative
- **Visualization**: Generate AI art for story scenes
- **Export**: Complete story as PDF chronical

**AI Context Awareness**:
When generating chapters, the system considers:
- Current character stats and equipment
- Active quests and objectives
- Recent journal entries
- Personal narrative history
- Character personality traits

**Chapter Structure**:
```typescript
{
  id: string              // Unique identifier
  characterId: string     // Link to character
  title: string          // Chapter title
  content: string        // Narrative text
  date: string           // Skyrim in-game date
  imageUrl?: string      // Generated visualization
  createdAt: number      // Timestamp
}
```

### 4. **Inventory.tsx**
**Purpose**: Item and equipment management

**Tracking**:
- Weapons (swords, bows, axes, etc.)
- Apparel (armor, clothing)
- Potions (health, magicka, stamina)
- Ingredients (crafting materials)
- Miscellaneous items
- Keys

**Features**:
- Item quantity tracking
- Equipment status (equipped/unequipped)
- Item removal
- Gold management
- Item categorization

### 5. **QuestLog.tsx**
**Purpose**: Quest and objective tracking

**Quest Status**:
- Active: Currently pursuing
- Completed: Successfully finished
- Failed: Cannot complete

**Features**:
- Quest objectives with completion tracking
- Location tagging
- Due date tracking
- Quest creation and deletion

### 6. **Journal.tsx**
**Purpose**: Personal narrative and character thoughts

**Entries Include**:
- Date of entry
- Custom titles
- Freeform content
- Personal perspective

**Purpose**: Allows players to document their character's thoughts, decisions, and emotional journey separate from the main story narrative.

### 7. **AIScribe.tsx**
**Purpose**: AI Game Master integration

**Functionality**:
- Processes player actions/requests
- Generates narrative responses
- Updates game state dynamically
- Manages quest/item changes based on narrative

**Context Provided**:
- Full character data
- Current inventory
- Active quests
- Recent story chapters

## 🤖 AI Integration Details

### Gemini API Usage

The application uses Google's Gemini API for three main functions:

#### 1. Character Generation (`generateCharacterProfile()`)
```typescript
Input: Description or chat history
Output: Complete character profile
{
  name, race, gender, archetype,
  stats, skills, identity, psychology,
  inventory, starting quests,
  journal entries, opening story
}
```

**Modes**:
- `random`: Generate completely random character
- `chat_result`: Generate from conversation transcript
- `text_import`: Parse user-provided character sheet

#### 2. Story Generation (`generateGameMasterResponse()`)
```typescript
Input: Player action + game context
Output: Narrative update + state changes
{
  narrative: { title, content },
  newQuests?: [],
  updateQuests?: [],
  newItems?: [],
  statUpdates?: {},
  goldChange?: number
}
```

#### 3. Image Generation (`generateLoreImage()` & `generateCharacterProfileImage()`)
```typescript
Input: Character details or scene description
Output: Base64 encoded image
Format: PNG
Size: 1:1 for profiles, 16:9 for scenes
```

### Error Handling for API Limits

The application gracefully handles Gemini API quota errors:
- 429 errors are caught and logged
- Image generation fails silently with console warning
- User can retry without breaking the application
- No user-facing crashes

## 🗄️ Firebase Integration

### Database Structure

```
users/
  {uid}/
    profiles/
      {profileId}: UserProfile
    characters/
      {characterId}: Character
    items/
      {itemId}: InventoryItem
    quests/
      {questId}: CustomQuest
    journalEntries/
      {entryId}: JournalEntry
    storyChapters/
      {chapterId}: StoryChapter
```

### Data Sync Strategy

**Automatic Sync** (useEffect-based):
- Triggered on any state change
- Updates entire game state object
- Real-time listener keeps local state synced
- Debounced to prevent excessive writes

**Manual Sync** (Save Button):
- Explicit user-triggered save
- Provides immediate feedback
- Toast notification shows save status
- Useful for backup or offline workflow

### Authentication

- Email/password registration
- Secure token-based sessions
- Per-user data isolation
- Firebase authentication rules

## 🎨 UI/UX Design

### Theme: Skyrim Gold & Dark

**Color Palette**:
- Primary: `#C0A062` (Skyrim Gold)
- Background: `#0F0F0F` (Almost Black)
- Border: `#3D3D3D` (Dark Gray)
- Text: `#DCDCDC` (Light Gray)
- Accent: `#8B4513` (Skyrim Brown)

**Typography**:
- Serif fonts for titles and important text (immersive)
- Sans-serif for body and UI (readability)
- Uppercase tracking for labels (official feel)

**Components**:
- Card-based layout with borders
- Timeline visualization for story
- Stat bars with gradient fills
- Hover effects for interactivity
- Modal dialogs for creation

### Responsive Design

- Mobile: Single column, collapsed navigation
- Tablet: Two columns, horizontal tabs
- Desktop: Full layout, tab switching

## 🔄 State Management

### Global State (Top-level App component)

```typescript
// Character Data
const [characters, setCharacters] = useState<Character[]>([])
const [profiles, setProfiles] = useState<UserProfile[]>([])

// Game Data
const [items, setItems] = useState<InventoryItem[]>([])
const [quests, setQuests] = useState<CustomQuest[]>([])
const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
const [storyChapters, setStoryChapters] = useState<StoryChapter[]>([])

// Session State
const [currentProfileId, setCurrentProfileId] = useState<string | null>(null)
const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null)
const [activeTab, setActiveTab] = useState(TABS.CHARACTER)

// UI State
const [saveMessage, setSaveMessage] = useState<string | null>(null)
const [isSaving, setIsSaving] = useState(false)
```

### Helper Functions

```typescript
// Get character-specific data
const getCharacterItems = () => items.filter(i => i.characterId === currentCharacterId)
const getCharacterQuests = () => quests.filter(q => q.characterId === currentCharacterId)
const getCharacterStory = () => storyChapters.filter(s => s.characterId === currentCharacterId)
const getCharacterJournal = () => journalEntries.filter(j => j.characterId === currentCharacterId)

// Get context for AI
const getAIContext = () => ({
  character: activeCharacter,
  inventory: getCharacterItems(),
  activeQuests: getCharacterQuests().filter(q => q.status === 'active'),
  recentStory: getCharacterStory().slice(-3)
})
```

## 📦 External Dependencies

### Core
- `react` 18.x - UI framework
- `react-dom` 18.x - DOM rendering
- `typescript` 5.x - Type safety

### Build & Dev
- `vite` 6.x - Build tool
- `tailwindcss` 3.x - Styling
- `@babel/parser` - Code parsing

### Features
- `firebase` 9.x - Backend & database
- `@google/genai` - Gemini API client
- `jspdf` 2.x - PDF generation
- `html2canvas` - HTML to canvas
- `uuid` - ID generation

### UI
- `lucide-react` - Icon library

## 🚀 Build & Deployment

### Development
```bash
npm run dev
# Runs on http://localhost:3000
# Hot module reloading enabled
# Source maps for debugging
```

### Production
```bash
npm run build
# Vite optimizes and minifies
# Creates dist/ folder
# Tree-shaking for smaller bundle
```

### Deployment Targets
- **Netlify** (configured via netlify.toml)
- **Vercel** (compatible)
- **Any static host** (dist folder)

## 🔒 Security Considerations

1. **Firebase Rules**: Restrict database access to authenticated users
2. **API Keys**: Environment variables, not committed to repo
3. **Input Validation**: User inputs validated before processing
4. **CORS**: Firebase handles cross-origin requests
5. **Authentication**: Email verification recommended

## 📈 Performance Optimizations

1. **Dynamic Imports**: jsPDF loaded on-demand for PDF export
2. **Lazy Loading**: Components loaded as needed
3. **Memoization**: Expensive computations memoized (where applicable)
4. **Image Optimization**: Base64 encoding for inline images
5. **Firebase Indexing**: Database queries optimized for common filters

## 🐛 Debugging & Troubleshooting

### Common Issues

1. **"Cannot access 'X' before initialization"**
   - Cause: Function called before definition
   - Fix: Move function definitions before JSX rendering

2. **"Cannot find module 'jsPDF'"**
   - Cause: Module not installed or import error
   - Fix: Use dynamic import in function

3. **"RESOURCE_EXHAUSTED" (429 errors)**
   - Cause: Gemini API quota exceeded
   - Fix: Wait for quota reset or upgrade plan

4. **Firebase connection failing**
   - Cause: Credentials invalid or network issue
   - Fix: Verify .env variables, check internet connection

## 🎓 Learning Resources

- **React Docs**: react.dev
- **Vite Docs**: vitejs.dev
- **Firebase Docs**: firebase.google.com/docs
- **Gemini API**: ai.google.dev/docs
- **Tailwind CSS**: tailwindcss.com/docs

## 🔮 Future Roadmap

### Phase 2
- [ ] Campaign collaboration (multiple players)
- [ ] Character sharing/import system
- [ ] Advanced quest branching
- [ ] Party management (multiple characters)

### Phase 3
- [ ] Voice narration for stories
- [ ] Mobile native app
- [ ] Offline synchronization
- [ ] Custom spell/perk creation

### Phase 4
- [ ] Multiplayer combat simulation
- [ ] Community character gallery
- [ ] Mod support
- [ ] Skyrim mod integration

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Project Status**: Active Development
