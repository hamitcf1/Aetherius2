# Skyrim Aetherius Console Demo Commands

This document explains how to use the console demo commands for testing and development purposes in the Skyrim Aetherius application.

## Setup

The demo commands are automatically loaded when the application starts. Open your browser's developer console (F12) to access them.

## Available Commands

### Character Management

#### `demo.createTestCharacter()`
Creates a random test character with randomized stats, race, class, and equipment.
```javascript
demo.createTestCharacter()
// Returns: A complete character object with random properties
```

#### `demo.addExperience(amount)`
Adds experience points to the current character.
```javascript
demo.addExperience(500)  // Add 500 XP
demo.addExperience()     // Add 100 XP (default)
```

#### `demo.levelUp()`
Quickly levels up the current character by adding 1000 XP.
```javascript
demo.levelUp()
```

### Inventory Management

#### `demo.createTestItem(type)`
Creates a single test item of the specified type.
```javascript
demo.createTestItem('weapon')   // Creates a random weapon
demo.createTestItem('potion')   // Creates a random potion
demo.createTestItem()           // Creates random item of any type
```

#### `demo.addRandomItems(count)`
Adds multiple random items to the current character's inventory.
```javascript
demo.addRandomItems(10)  // Add 10 random items
demo.addRandomItems()    // Add 5 random items (default)
```

#### `demo.addGold(amount)`
Shows the command to add gold to the current character.
```javascript
demo.addGold(1000)  // Shows: app.handleGameUpdate({ goldChange: 1000 })
demo.addGold()      // Shows: app.handleGameUpdate({ goldChange: 100 })
```

### Journal Management

#### `demo.createTestJournalEntry()`
Creates a single test journal entry with random content.
```javascript
demo.createTestJournalEntry()
// Returns: A complete journal entry object
```

#### `demo.addRandomJournalEntries(count)`
Creates multiple test journal entries and shows the command to add them to the game.
```javascript
demo.addRandomJournalEntries(5)  // Create 5 entries and show add command
demo.addRandomJournalEntries()   // Create 3 entries and show add command (default)
```

### Quest Management

#### `demo.createTestQuest()`
Creates a single test quest with random objectives.
```javascript
demo.createTestQuest()
// Returns: A complete quest object
```

#### `demo.addRandomQuests(count)`
Creates multiple test quests and shows the command to add them to the game.
```javascript
demo.addRandomQuests(3)  // Create 3 quests and show add command
demo.addRandomQuests()   // Create 2 quests and show add command (default)
```

### Combat Testing

#### `demo.simulateCombat()`
Starts a quick combat encounter against demo enemies. Optional params let you tweak the setup.
```javascript
demo.simulateCombat()
demo.simulateCombat({ location: 'Bleak Falls Barrow', ambush: true })
```

#### `demo.testCombatItems()`
Shows instructions for testing combat item usage.
```javascript
demo.testCombatItems()
```

### Utility Functions

#### `demo.getAppState()`
Displays the current application state information.
```javascript
demo.getAppState()
// Shows: character count, item count, quest count, etc.
```

#### `demo.clearDemoData()`
Clears items, quests, journal entries, and story chapters for the active character. Pass flags to skip sections.
```javascript
demo.clearDemoData() // clears everything for the active character
demo.clearDemoData({ items: false }) // keep items, clear other data
```

#### `demo.help()`
Displays this help information in the console.
```javascript
demo.help()
```

## Usage Examples

### Quick Start Testing
```javascript
// Create a test character
demo.createTestCharacter()

// Add some gold and items
demo.addGold(500)        // Shows the command to add gold
demo.addRandomItems(10)  // Shows the command to add items

// Add some journal entries
demo.addRandomJournalEntries(3)  // Shows the command to add entries

// Check the current state
demo.getAppState()
```

### Combat Testing
```javascript
// Add health potions for combat testing
demo.addRandomItems(3)  // This will include potions

// Then use the adventure system to trigger combat
// During combat, use the "Use Item" action to consume potions
```

### Development Testing
```javascript
// Test leveling
demo.levelUp()
demo.addExperience(2500)

// Test inventory limits
for(let i = 0; i < 20; i++) {
    demo.addRandomItems(5)
}

// Test quest system
demo.addRandomQuests(5)
```

## Important Notes

1. **Instruction-Based**: Most demo commands now show you the exact commands to run instead of directly modifying app state. This gives you more control over when changes are applied.

2. **Data Persistence**: When you copy and run the suggested commands, they will modify your actual game data. Use with caution.

3. **App Context**: Commands require the app to be fully loaded. If you get "App context not available" errors, wait for the app to finish loading.

4. **Browser Console**: These commands only work in the browser console, not in Node.js or other environments.

5. **Development Only**: These commands are intended for development and testing purposes only.

6. **Manual Execution**: For journal entries and quests, you'll need to copy the suggested commands and run them manually to apply the changes.

## Integration

The demo commands are loaded automatically. If you need to modify or extend them:

1. Edit `console-demo.js`
2. The functions are attached to `window.demo` for global access
3. They access the app context through `window.app`

## Troubleshooting

- **"App context not available"**: Wait for the app to fully load
- **Commands not working**: Check that `console-demo.js` is being loaded
- **Data not updating**: Some commands may need UI refreshes

## Future Enhancements

- Combat simulation functions
- Data clearing utilities
- Batch operations
- Performance testing tools
- Automated test suites</content>
<parameter name="filePath">./CONSOLE_COMMANDS.md