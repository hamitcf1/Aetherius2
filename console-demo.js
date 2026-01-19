/**
 * Skyrim Aetherius Console Demo Commands
 *
 * This file contains demo/test functions that can be used in the browser console
 * for testing various features of the Skyrim Aetherius application.
 *
 * To use these commands:
 * 1. Open the browser console (F12)
 * 2. The functions will be available globally as `demo.*`
 * 3. Example: demo.createTestCharacter()
 *
 * Note: These functions are for development/testing purposes only.
 */

// Demo namespace
window.demo = window.demo || {};

// Utility function for unique IDs
const uniqueId = () => Math.random().toString(36).substring(2, 11);

// ============================================================================
// CHARACTER MANAGEMENT
// ============================================================================

/**
 * Create a test character with random stats
 */
window.demo.createTestCharacter = function() {
  const races = ['Nord', 'Imperial', 'Breton', 'Redguard', 'High Elf', 'Dark Elf', 'Wood Elf', 'Orc', 'Khajiit', 'Argonian'];
  const classes = ['Warrior', 'Mage', 'Thief', 'Archer', 'Paladin', 'Necromancer', 'Barbarian', 'Assassin'];

  const character = {
    id: uniqueId(),
    name: `Test${Math.floor(Math.random() * 1000)}`,
    race: races[Math.floor(Math.random() * races.length)],
    class: classes[Math.floor(Math.random() * classes.length)],
    level: Math.floor(Math.random() * 20) + 1,
    experience: Math.floor(Math.random() * 10000),
    stats: {
      health: 80 + Math.floor(Math.random() * 40),
      magicka: 60 + Math.floor(Math.random() * 40),
      stamina: 70 + Math.floor(Math.random() * 40),
      strength: 10 + Math.floor(Math.random() * 20),
      intelligence: 10 + Math.floor(Math.random() * 20),
      willpower: 10 + Math.floor(Math.random() * 20),
      agility: 10 + Math.floor(Math.random() * 20),
      speed: 10 + Math.floor(Math.random() * 20),
      luck: 10 + Math.floor(Math.random() * 20),
      personality: 10 + Math.floor(Math.random() * 20)
    },
    skills: [
      { name: 'One-handed', level: Math.floor(Math.random() * 50) + 10 },
      { name: 'Destruction', level: Math.floor(Math.random() * 50) + 10 },
      { name: 'Sneak', level: Math.floor(Math.random() * 50) + 10 }
    ],
    gold: Math.floor(Math.random() * 1000),
    createdAt: Date.now()
  };

  console.log('Created test character:', character);
  console.log('To add to game: Copy the character object and use app.setCharacters([...app.characters, character])');
  return character;
};

/**
 * Add random experience to current character
 */
window.demo.addExperience = function(amount = 100) {
  if (window.app && window.app.handleGameUpdate) {
    window.app.handleGameUpdate({ xpChange: amount });
    const message = `Added ${amount} XP to character`;
    console.log(message);
    return message;
  } else {
    const error = 'App context not available';
    console.error(error);
    return error;
  }
};

/**
 * Level up current character
 */
window.demo.levelUp = function() {
  if (window.app && window.app.handleGameUpdate) {
    window.app.handleGameUpdate({ xpChange: 1000 });
    const message = 'Leveled up character';
    console.log(message);
    return message;
  } else {
    const error = 'App context not available';
    console.error(error);
    return error;
  }
};

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

/**
 * Create a random test item
 */
window.demo.createTestItem = function(type = null) {
  const types = ['weapon', 'apparel', 'potion', 'food', 'misc'];
  const itemType = type || types[Math.floor(Math.random() * types.length)];

  const names = {
    weapon: ['Iron Sword', 'Steel Dagger', 'Wooden Bow', 'Iron Mace'],
    apparel: ['Leather Armor', 'Iron Helmet', 'Cloth Robes', 'Fur Boots'],
    potion: ['Health Potion', 'Magicka Potion', 'Stamina Potion', 'Restore Health', 'Restore Magicka', 'Restore Stamina'],
    food: ['Apple', 'Bread', 'Cheese', 'Salted Meat'],
    misc: ['Torch', 'Lockpick', 'Gem', 'Coin Purse']
  };

  const item = {
    id: uniqueId(),
    characterId: window.app?.currentCharacterId || 'test',
    name: names[itemType][Math.floor(Math.random() * names[itemType].length)],
    type: itemType,
    description: `A test ${itemType} item`,
    quantity: Math.floor(Math.random() * 5) + 1,
    equipped: false,
    value: Math.floor(Math.random() * 100) + 10,
    createdAt: Date.now()
  };

  // Add type-specific properties
  if (itemType === 'weapon') {
    item.damage = Math.floor(Math.random() * 20) + 5;
  } else if (itemType === 'apparel') {
    item.armor = Math.floor(Math.random() * 15) + 5;
  } else if (itemType === 'potion') {
    const name = item.name.toLowerCase();
    if (name.includes('health')) {
      item.subtype = 'health';
    } else if (name.includes('magicka')) {
      item.subtype = 'magicka';
    } else if (name.includes('stamina')) {
      item.subtype = 'stamina';
    } else {
      item.subtype = 'health'; // Default
    }
  }

  console.log('Created test item:', item);
  return item;
};

/**
 * Add random items to inventory
 */
window.demo.addRandomItems = function(count = 5) {
  const app = window.app;
  const safeCount = Math.max(1, Number(count) || 1);

  const items = [];
  for (let i = 0; i < safeCount; i++) {
    items.push(window.demo.createTestItem());
  }

  console.log(`Created ${safeCount} test items:`, items);

  if (app && app.handleGameUpdate) {
    app.handleGameUpdate({ newItems: items });
    const message = `Added ${safeCount} item(s) to the active character via handleGameUpdate.`;
    console.log(message);
    return items;
  }

  const note = 'App context not available; run app.handleGameUpdate({ newItems: items }) manually to apply.';
  console.warn(note);
  return items;
};

/**
 * Add perk points to current character (development helper)
 * Usage: demo.addPerkPoints(2)
 */
window.demo.addPerkPoints = function(amount = 1) {
  const app = window.app;
  const safe = Math.max(0, Number(amount) || 0);
  if (!app) {
    console.error('App context not available. Open the app first.');
    return { ok: false, message: 'app missing' };
  }
  const charId = app.currentCharacterId;
  if (!charId) {
    console.error('No active character selected.');
    return { ok: false, message: 'no active character' };
  }
  const character = (app.characters || []).find(c => c.id === charId);
  if (!character) {
    console.error('Active character not found in app state.');
    return { ok: false, message: 'character not found' };
  }

  const next = (character.perkPoints || 0) + safe;

  if (typeof app.updateCharacter === 'function') {
    app.updateCharacter('perkPoints', next);
    const msg = `Added ${safe} perk point(s). New total: ${next}`;
    console.log(msg);
    return { ok: true, message: msg };
  }

  if (typeof app.setCharacters === 'function') {
    app.setCharacters((prev) => prev.map(c => c.id === charId ? { ...c, perkPoints: next } : c));
    const msg = `Added ${safe} perk point(s) via setCharacters. New total: ${next}`;
    console.log(msg);
    return { ok: true, message: msg };
  }

  console.error('No supported method found on window.app to update character.');
  return { ok: false, message: 'no update method' };
};

// Admin helper utilities (only allowed for admin uids)
const ADMIN_IDS = ['42VwiqAFNpfzUYHjFj992gEdxCz1'];
function _isAdmin() {
  const app = window.app;
  if (!app) return false;
  if (typeof app.isAdmin === 'function') return app.isAdmin();
  const uid = app.currentUser?.uid || app.currentUserId || null;
  if (!uid) return false;
  return ADMIN_IDS.includes(uid);
}

// Set exact perk points for the active or specified character
window.demo.setPerkPoints = function(amount = 0, characterId = null) {
  if (!_isAdmin()) { console.error('Admin only'); return { ok: false, message: 'admin required' }; }
  const app = window.app; if (!app) return { ok: false, message: 'no app' };
  const charId = characterId || app.currentCharacterId; if (!charId) return { ok: false, message: 'no character' };
  const next = Math.max(0, Number(amount) || 0);
  if (typeof app.updateCharacter === 'function') { app.updateCharacter('perkPoints', next); console.log(`Set perk points to ${next}`); return { ok: true }; }
  if (typeof app.setCharacters === 'function') { app.setCharacters(prev => prev.map(c => c.id === charId ? { ...c, perkPoints: next } : c)); console.log(`Set perk points (via setCharacters) to ${next}`); return { ok: true }; }
  return { ok: false, message: 'no update method' };
};

window.demo.removePerkPoints = function(amount = 1, characterId = null) {
  if (!_isAdmin()) { console.error('Admin only'); return { ok: false, message: 'admin required' }; }
  const app = window.app; if (!app) return { ok: false, message: 'no app' };
  const charId = characterId || app.currentCharacterId; if (!charId) return { ok: false, message: 'no character' };
  const character = (app.characters || []).find(c => c.id === charId);
  if (!character) return { ok: false, message: 'character not found' };
  const next = Math.max(0, (character.perkPoints || 0) - Math.max(0, Number(amount) || 0));
  if (typeof app.updateCharacter === 'function') { app.updateCharacter('perkPoints', next); console.log(`Removed ${amount} perk point(s). New total: ${next}`); return { ok: true }; }
  if (typeof app.setCharacters === 'function') { app.setCharacters(prev => prev.map(c => c.id === charId ? { ...c, perkPoints: next } : c)); console.log(`Removed ${amount} perk point(s) via setCharacters. New total: ${next}`); return { ok: true }; }
  return { ok: false, message: 'no update method' };
};

// Force-unlock a perk for a character (deducts 3 perk points if available)
window.demo.forceUnlockPerk = function(perkId, characterId = null) {
  if (!_isAdmin()) { console.error('Admin only'); return { ok: false, message: 'admin required' }; }
  if (!perkId) return { ok: false, message: 'perkId required' };
  const app = window.app; if (!app) return { ok: false, message: 'no app' };
  const charId = characterId || app.currentCharacterId; if (!charId) return { ok: false, message: 'no character' };
  const character = (app.characters || []).find(c => c.id === charId);
  if (!character) return { ok: false, message: 'character not found' };
  const pts = character.perkPoints || 0;
  if (pts < 3) { console.warn('Not enough perk points (need 3)'); return { ok: false, message: 'not enough points' }; }
  const nextPts = Math.max(0, pts - 3);
  const existing = (character.perks || []).find(p => p.id === perkId);
  let nextPerks = (character.perks || []).slice();
  if (existing) {
    nextPerks = nextPerks.map(p => p.id === perkId ? { ...p, rank: (p.rank || 0) + 1 } : p);
  } else {
    nextPerks.push({ id: perkId, name: perkId, skill: '', rank: 1, mastery: 0, description: '' });
  }
  if (typeof app.updateCharacter === 'function') { app.updateCharacter('perks', nextPerks); app.updateCharacter('perkPoints', nextPts); console.log(`Force-unlocked ${perkId} and charged 3 points.`); return { ok: true }; }
  if (typeof app.setCharacters === 'function') { app.setCharacters(prev => prev.map(c => c.id === charId ? { ...c, perks: nextPerks, perkPoints: nextPts } : c)); console.log(`Force-unlocked ${perkId} (via setCharacters) and charged 3 points.`); return { ok: true }; }
  return { ok: false, message: 'no update method' };
};

// Grant mastery tiers for a perk (charges default 3 points per mastery)
window.demo.grantMastery = function(perkId, count = 1, characterId = null) {
  if (!_isAdmin()) { console.error('Admin only'); return { ok: false, message: 'admin required' }; }
  if (!perkId) return { ok: false, message: 'perkId required' };
  const app = window.app; if (!app) return { ok: false, message: 'no app' };
  const charId = characterId || app.currentCharacterId; if (!charId) return { ok: false, message: 'no character' };
  const character = (app.characters || []).find(c => c.id === charId);
  if (!character) return { ok: false, message: 'character not found' };
  const masteryCost = 3;
  const totalCost = masteryCost * (Number(count) || 0);
  if ((character.perkPoints || 0) < totalCost) return { ok: false, message: 'not enough points' };
  const nextPerks = (character.perks || []).slice();
  let found = false;
  for (let i = 0; i < nextPerks.length; i++) {
    if (nextPerks[i].id === perkId) { nextPerks[i] = { ...nextPerks[i], mastery: (nextPerks[i].mastery || 0) + (Number(count) || 0) }; found = true; break; }
  }
  if (!found) nextPerks.push({ id: perkId, name: perkId, skill: '', rank: 0, mastery: (Number(count) || 0), description: '' });
  const nextPts = Math.max(0, (character.perkPoints || 0) - totalCost);
  if (typeof app.updateCharacter === 'function') { app.updateCharacter('perks', nextPerks); app.updateCharacter('perkPoints', nextPts); console.log(`Granted ${count} mastery for ${perkId} and charged ${totalCost} points.`); return { ok: true }; }
  if (typeof app.setCharacters === 'function') { app.setCharacters(prev => prev.map(c => c.id === charId ? { ...c, perks: nextPerks, perkPoints: nextPts } : c)); console.log(`Granted ${count} mastery for ${perkId} (via setCharacters) and charged ${totalCost} points.`); return { ok: true }; }
  return { ok: false, message: 'no update method' };
};

// Set level (and optionally grant naive perk points for levels increased)
window.demo.setLevel = function(level, characterId = null) {
  if (!_isAdmin()) { console.error('Admin only'); return { ok: false, message: 'admin required' }; }
  const app = window.app; if (!app) return { ok: false, message: 'no app' };
  const charId = characterId || app.currentCharacterId; if (!charId) return { ok: false, message: 'no character' };
  const character = (app.characters || []).find(c => c.id === charId);
  if (!character) return { ok: false, message: 'character not found' };
  const lvl = Math.max(1, Number(level) || 1);
  const gained = Math.max(0, lvl - (character.level || 0));
  const extraPerkPoints = gained; // naive: 1 perk per level
  const nextPts = (character.perkPoints || 0) + extraPerkPoints;
  if (typeof app.updateCharacter === 'function') { app.updateCharacter('level', lvl); app.updateCharacter('perkPoints', nextPts); console.log(`Set level to ${lvl} and granted ${extraPerkPoints} perk points.`); return { ok: true }; }
  if (typeof app.setCharacters === 'function') { app.setCharacters(prev => prev.map(c => c.id === charId ? { ...c, level: lvl, perkPoints: nextPts } : c)); console.log(`Set level to ${lvl} (via setCharacters) and granted ${extraPerkPoints} perk points.`); return { ok: true }; }
  return { ok: false, message: 'no update method' };
};

// Give an item to a character
window.demo.giveItem = function(name, type = 'misc', quantity = 1, characterId = null) {
  if (!_isAdmin()) { console.error('Admin only'); return { ok: false, message: 'admin required' }; }
  if (!name) return { ok: false, message: 'name required' };
  const app = window.app; if (!app) return { ok: false, message: 'no app' };
  const charId = characterId || app.currentCharacterId; if (!charId) return { ok: false, message: 'no character' };
  const item = { id: Math.random().toString(36).substring(2, 11), characterId: charId, name, type, description: '', quantity: Math.max(1, Number(quantity)||1), equipped: false, createdAt: Date.now() };
  if (app.handleGameUpdate) { app.handleGameUpdate({ newItems: [item] }); console.log(`Gave ${quantity}x ${name} to character.`); return { ok: true }; }
  return { ok: false, message: 'no handleGameUpdate' };
};

// Dump raw window.app for debugging
window.demo.getRawState = function() { if (!_isAdmin()) { console.error('Admin only'); return null; } return window.app || null; };

// Companions management helpers
window.demo.recruitCompanion = function(payload = { name: 'New Follower', race: 'Nord', level: 1 }) {
  if (!_isAdmin()) { console.error('Admin only'); return { ok: false }; }
  const app = window.app; if (!app) return { ok: false, message: 'no app' };
  const id = uniqueId();
  // characterId will be set by addCompanion handler in App.tsx
  const c = { id, characterId: '', name: payload.name || 'Companion', race: payload.race || 'Nord', class: 'Follower', level: Math.max(1, Number(payload.level)||1), health: 50, maxHealth: 50, damage: 6, armor: 5, personality: 'Loyal', recruitedAt: Date.now(), loyalty: 50, mood: 'neutral' };
  if (typeof app.addCompanion === 'function') { app.addCompanion(c); console.log('Recruited companion:', c); return { ok: true, companion: c }; }
  if (typeof app.setCompanions === 'function') { app.setCompanions(prev => [...(prev||[]), c]); console.log('Recruited companion (via setCompanions):', c); return { ok: true, companion: c }; }
  return { ok: false, message: 'no method' };
};

window.demo.listCompanions = function() {
  const app = window.app; if (!app) { console.error('no app'); return []; }
  return app.companions || [];
};

window.demo.removeCompanion = function(id) {
  if (!_isAdmin()) { console.error('Admin only'); return { ok: false }; }
  const app = window.app; if (!app) return { ok: false, message: 'no app' };
  if (typeof app.removeCompanion === 'function') { app.removeCompanion(id); console.log('Removed companion', id); return { ok: true }; }
  if (typeof app.setCompanions === 'function') { app.setCompanions(prev => (prev||[]).filter(p => p.id !== id)); console.log('Removed companion (via setCompanions)', id); return { ok: true }; }
  return { ok: false, message: 'no method' };
};

// One-time migration helper to fix potion items in player inventories
window.demo.migratePotions = async function(options = { dryRun: false }) {
  try {
    if (!window.app) {
      console.error('App context not available. Open the game first.');
      return { ok: false, message: 'app missing' };
    }

    const items = Array.isArray(window.app.items) ? window.app.items : [];
    const charId = window.app.currentCharacterId;
    const toUpdate = [];

    const inferSubtype = (name = '', desc = '') => {
      const n = (name || '').toLowerCase();
      const d = (desc || '').toLowerCase();
      if (n.includes('magicka') || d.includes('magicka')) return 'magicka';
      if (n.includes('stamina') || d.includes('stamina')) return 'stamina';
      if (n.includes('health') || d.includes('health') || n.includes('heal') || d.includes('heal')) return 'health';
      return null;
    };

    for (const it of items) {
      if (!it || it.type !== 'potion') continue;
      const valid = ['health', 'magicka', 'stamina'];
      if (it.subtype && valid.includes(it.subtype)) continue; // already ok

      const inferred = inferSubtype(it.name, it.description);
      if (!inferred) continue; // non-targeted potion (resist, invisibility, etc.)

      // Build a minimal newItem payload so handleGameUpdate will merge by name
      const payload = {
        name: it.name,
        type: 'potion',
        subtype: inferred,
        quantity: it.quantity || 1,
        description: it.description || '',
      };
      toUpdate.push(payload);
    }

    console.log(`Potion migration: found ${toUpdate.length} potion(s) to update.`);

    // Backup affected items into localStorage (timestamped)
    if (toUpdate.length > 0) {
      const backupKey = `aetherius:potion_migration_backup:${Date.now()}`;
      const affected = items.filter(i => i.type === 'potion');
      try {
        localStorage.setItem(backupKey, JSON.stringify(affected));
        console.log('Backed up current potions to localStorage key:', backupKey);
      } catch (e) {
        console.warn('Failed to write backup to localStorage', e);
      }
    }

    if (options.dryRun) return { ok: true, updated: toUpdate.length, dryRun: true };

    if (toUpdate.length > 0) {
      // Use handleGameUpdate(newItems) which merges by name and will mark items dirty for save
      if (window.app.handleGameUpdate) {
        window.app.handleGameUpdate({ newItems: toUpdate });
        console.log('Dispatched updates via handleGameUpdate; items will be saved by the app debounced save.');
        return { ok: true, updated: toUpdate.length };
      } else {
        console.error('handleGameUpdate not available on window.app; cannot persist updates.');
        return { ok: false, message: 'no handleGameUpdate' };
      }
    }

    return { ok: true, updated: 0 };
  } catch (err) {
    console.error('Migration failed:', err);
    return { ok: false, error: String(err) };
  }
};

/**
 * Add gold to character
 */
window.demo.addGold = function(amount = 100) {
  const message = `To add ${amount} gold: app.handleGameUpdate({ goldChange: ${amount} })`;
  console.log(message);
  return message;
};

// ============================================================================
// JOURNAL MANAGEMENT
// ============================================================================

/**
 * Create a test journal entry
 */
window.demo.createTestJournalEntry = function() {
  const titles = [
    'A Strange Occurrence',
    'Meeting with the Jarl',
    'Ancient Ruins Discovered',
    'Bandit Encounter',
    'Magical Mystery',
    'Dragon Sighting'
  ];

  const contents = [
    'Today I encountered something unusual in the woods. A glowing rune on an ancient stone. I should investigate further.',
    'The Jarl has given me a quest to clear out the bandit camp. The reward sounds substantial.',
    'I found some old ruins today. They appear to be from the time of the Dragon Cult. There might be treasure inside.',
    'I was attacked by bandits on the road. Fortunately, I was able to defend myself. Their leader mentioned something about a larger organization.',
    'I found a strange magical artifact today. It seems to have some kind of enchantment. I should be careful with it.',
    'I saw a dragon flying overhead today. It was heading north towards the mountains. This could be a sign of things to come.'
  ];

  const entry = {
    id: uniqueId(),
    characterId: window.app?.currentCharacterId || 'test',
    date: new Date().toLocaleDateString(),
    title: titles[Math.floor(Math.random() * titles.length)],
    content: contents[Math.floor(Math.random() * contents.length)],
    createdAt: Date.now()
  };

  console.log('Created test journal entry:', entry);
  return entry;
};

/**
 * Add random journal entries
 */
window.demo.addRandomJournalEntries = function(count = 3) {
  const entries = [];
  for (let i = 0; i < count; i++) {
    entries.push(window.demo.createTestJournalEntry());
  }
  console.log(`Created ${count} test journal entries:`, entries);
  console.log('To add to game: app.setJournalEntries([...app.journalEntries, ...entries])');
  return entries;
};

// ============================================================================
// QUEST MANAGEMENT
// ============================================================================

/**
 * Create a test quest
 */
window.demo.createTestQuest = function() {
  const titles = [
    'Clear the Bandit Camp',
    'Retrieve the Ancient Artifact',
    'Investigate the Strange Lights',
    'Escort the Merchant',
    'Hunt the Wild Beast'
  ];

  const descriptions = [
    'The local villagers are being harassed by bandits. Clear them out and bring back proof.',
    'An ancient artifact has been stolen from the museum. Find it and return it.',
    'Strange lights have been seen in the forest at night. Investigate and report back.',
    'A merchant needs protection on his journey to the next town. Ensure his safe arrival.',
    'A dangerous beast is terrorizing the countryside. Hunt it down and eliminate the threat.'
  ];

  const quest = {
    id: uniqueId(),
    characterId: window.app?.currentCharacterId || 'test',
    title: titles[Math.floor(Math.random() * titles.length)],
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    location: 'Test Location',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    objectives: [
      { id: uniqueId(), description: 'Complete the main objective', completed: false },
      { id: uniqueId(), description: 'Gather information', completed: false }
    ],
    status: 'active',
    createdAt: Date.now()
  };

  console.log('Created test quest:', quest);
  return quest;
};

/**
 * Add random quests
 */
window.demo.addRandomQuests = function(count = 2) {
  const quests = [];
  for (let i = 0; i < count; i++) {
    quests.push(window.demo.createTestQuest());
  }
  console.log(`Created ${count} test quests:`, quests);
  console.log('To add to game: app.setQuests([...app.quests, ...quests])');
  return quests;
};

// ============================================================================
// LOCKPICKING TESTING
// ============================================================================

/**
 * Trigger the lockpicking minigame for testing
 * @param {string} difficulty - Lock difficulty: 'novice', 'apprentice', 'adept', 'expert', or 'master'
 * @param {string} lockName - Optional name for the lock
 */
window.demo.lockpick = function(difficulty = 'adept', lockName) {
  const validDifficulties = ['novice', 'apprentice', 'adept', 'expert', 'master'];
  if (!validDifficulties.includes(difficulty)) {
    console.error(`Invalid difficulty: "${difficulty}". Valid options: ${validDifficulties.join(', ')}`);
    return;
  }
  
  // Dispatch a custom event that AdventureChat can listen to
  const event = new CustomEvent('demo:triggerLockpick', {
    detail: {
      difficulty: difficulty,
      lockName: lockName || `Demo ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Lock`
    }
  });
  window.dispatchEvent(event);
  
  console.log(`🔐 Lockpicking minigame triggered with ${difficulty} difficulty`);
  console.log('The minigame should appear if you have a character selected and are in the Adventure tab.');
  return `Lockpicking "${lockName || difficulty + ' lock'}" initiated`;
};

/**
 * Show lockpicking difficulty guide
 */
window.demo.lockpickHelp = function() {
  const helpText = [
    'Lockpicking Difficulty Guide',
    '============================',
    '',
    'Difficulties (from easiest to hardest):',
    '  - novice      - Very wide sweet spot, easy to crack',
    '  - apprentice  - Slightly narrower, still manageable',
    '  - adept       - Default difficulty, requires skill',
    '  - expert      - Narrow sweet spot, challenging',
    '  - master      - Very narrow, requires precision',
    '',
    'Usage:',
    "  demo.lockpick('novice')          - Test with easy lock",
    "  demo.lockpick('master')          - Test with hardest lock",
    "  demo.lockpick('adept', 'Chest')  - Custom lock name",
    '',
    'Note: You need lockpicks in inventory to succeed!',
    'Use demo.addRandomItems(5) to add items including lockpicks.'
  ].join('\n');
  console.log(helpText);
  return helpText;
};

// ============================================================================
// COMBAT TESTING
// ============================================================================

/**
 * Simulate a combat encounter
 */
window.demo.simulateCombat = function(options = {}) {
  const app = window.app;
  if (!app || !app.handleGameUpdate) {
    const error = 'App context not available. Open the game first.';
    console.error(error);
    return error;
  }

  const character = (app.characters || []).find(c => c.id === app.currentCharacterId);
  if (!character) {
    const error = 'No active character selected. Create/select a character first.';
    console.error(error);
    return error;
  }

  const level = Math.max(1, Math.floor(character.level || 1));
  const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Soft-cap enemy stats based on player for smoother difficulty
  const playerHealth = Math.max(80, Number(character?.stats?.health || 120));
  const playerStamina = Math.max(60, Number(character?.stats?.stamina || 80));
  const playerWeaponGuess = Math.max(10, Number(character?.stats?.strength || 12));

  const buildEnemy = (seed) => {
    const health = Math.floor(playerHealth * seed.healthMultiplier);
    const stamina = Math.floor(playerStamina * 0.9);
    const magicka = Math.floor(playerStamina * 0.6);
    // Allow zero-damage seeds (e.g., Training Dummy) to have damage 0
    const damage = seed.damageMultiplier === 0 ? 0 : Math.max(6, Math.floor(playerWeaponGuess * seed.damageMultiplier));

    return {
      id: uniqueId(),
      name: seed.name,
      type: seed.type,
      level,
      maxHealth: Math.max(40, health),
      currentHealth: Math.max(40, health),
      maxMagicka: magicka,
      currentMagicka: magicka,
      maxStamina: stamina,
      currentStamina: stamina,
      armor: Math.max(5, Math.floor(seed.armor * 0.8)),
      damage,
      abilities: [
        {
          id: 'basic_strike',
          name: 'Wild Strike',
          type: 'melee',
          damage: Math.floor(damage * 0.9),
          cost: 0,
          description: 'A quick melee strike.'
        },
        {
          id: 'heavy_swing',
          name: 'Heavy Swing',
          type: 'melee',
          damage: Math.floor(damage * 1.2),
          cost: 10,
          cooldown: 1,
          description: 'A slower, harder-hitting attack.'
        }
      ],
      weaknesses: seed.weaknesses,
      resistances: seed.resistances,
      loot: seed.loot,
      xpReward: 50 + level * 8,
      goldReward: 20 + level * 3,
      isBoss: seed.isBoss || false,
      description: seed.description,
      behavior: seed.behavior
    };
  };

  const defaultSeeds = [
    {
      name: 'Bandit Cutthroat',
      type: 'humanoid',
      baseHealth: 90,
      baseDamage: 15,
      healthMultiplier: 0.85,
      damageMultiplier: 0.65,
      armor: 18,
      weaknesses: ['fire'],
      resistances: ['poison'],
      behavior: 'aggressive',
      description: 'A ruthless highwayman looking for easy prey.',
      loot: [{ name: 'Steel Sword', type: 'weapon', description: 'Worn but sharp.', quantity: 1, dropChance: 55 }]
    },
    {
      name: 'Restless Draugr',
      type: 'undead',
      baseHealth: 110,
      baseDamage: 13,
      healthMultiplier: 0.95,
      damageMultiplier: 0.7,
      armor: 20,
      weaknesses: ['fire'],
      resistances: ['frost'],
      behavior: 'defensive',
      description: 'An ancient warrior awakened from its tomb.',
      loot: [{ name: 'Ancient Nord Sword', type: 'weapon', description: 'Cold to the touch.', quantity: 1, dropChance: 40 }]
    },
    {
      name: 'Frost Wolf',
      type: 'beast',
      baseHealth: 70,
      baseDamage: 12,
      healthMultiplier: 0.75,
      damageMultiplier: 0.6,
      armor: 12,
      weaknesses: ['fire'],
      resistances: ['frost'],
      behavior: 'berserker',
      description: 'A hungry wolf hardened by the cold.',
      loot: [{ name: 'Wolf Pelt', type: 'misc', description: 'Can be sold or crafted.', quantity: 1, dropChance: 75 }]
    }
  ];

  // Support deterministic testing: allow a fixed dummy enemy via options.fixedEnemy or options.enemyPreset === 'dummy'
  const fixedSeed = {
    name: 'Training Dummy',
    type: 'humanoid',
    baseHealth: 100,
    baseDamage: 0,
    healthMultiplier: 1.0,
    damageMultiplier: 0.0,
    armor: 0,
    weaknesses: [],
    resistances: [],
    behavior: 'defensive',
    description: 'A non-lethal combat dummy used for consistent testing.',
    loot: []
  };

  const enemySeeds = (typeof options.fixedEnemy === 'boolean' && options.fixedEnemy)
    ? [fixedSeed]
    : (options.enemyPreset === 'dummy')
      ? [fixedSeed]
      : (Array.isArray(options.enemies) && options.enemies.length)
        ? options.enemies
        : [choose(defaultSeeds)];

  const enemies = enemySeeds.map(seed => buildEnemy(seed));
  const ambush = typeof options.ambush === 'boolean' ? options.ambush : Math.random() < 0.2;
  const location = options.location || 'Demo: Abandoned Watchtower';

  // Dry-run mode: return constructed enemies without starting combat (useful for tests)
  if (options.dryRun === true) {
    console.log('Dry-run simulateCombat: returning constructed enemy objects without starting combat');
    return enemies;
  }

  app.handleGameUpdate({
    combatStart: {
      enemies,
      location,
      ambush,
      fleeAllowed: options.fleeAllowed !== false,
      surrenderAllowed: Boolean(options.surrenderAllowed)
    },
    ambientContext: { localeType: 'wilderness', inCombat: true, mood: 'tense' },
    narrative: {
      title: 'Combat Simulation',
      content: `A staged encounter begins near ${location}.`
    }
  });

  app.setActiveTab?.('adventure');

  const summary = `Started combat sim with ${enemies.length} enemy(ies) at ${location}.`;
  console.log(summary);
  return summary;
};

/**
 * Test item consumption in combat
 */
window.demo.testCombatItems = function() {
  const message = 'Testing combat item usage...\n1. Add health potions: demo.addRandomItems(1) with potion type\n2. Enter combat through adventure\n3. Use items during combat';
  console.log(message);
  return message;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current app state
 */
window.demo.getAppState = function() {
  if (window.app) {
    const state = {
      currentCharacterId: window.app.currentCharacterId,
      currentProfileId: window.app.currentProfileId,
      activeTab: window.app.activeTab,
      characters: window.app.characters?.length || 0,
      items: window.app.items?.length || 0,
      quests: window.app.quests?.length || 0,
      journalEntries: window.app.journalEntries?.length || 0
    };
    console.log('Current app state:', state);
    return state;
  } else {
    const error = 'App context not available';
    console.error(error);
    return error;
  }
};

/**
 * Clear all demo data
 */
window.demo.clearDemoData = function(options = {}) {
  const app = window.app;
  if (!app) {
    const error = 'App context not available. Open the game first.';
    console.error(error);
    return error;
  }

  const characterId = app.currentCharacterId;
  if (!characterId) {
    const error = 'No active character selected. Create/select a character first.';
    console.error(error);
    return error;
  }

  const opts = {
    items: options.items !== false,
    quests: options.quests !== false,
    journal: options.journal !== false,
    story: options.story !== false
  };

  let clearedItems = 0;
  let clearedQuests = 0;
  let clearedJournal = 0;
  let clearedStory = 0;

  if (opts.items && Array.isArray(app.items) && app.handleGameUpdate) {
    const removedItems = app.items
      .filter(item => item.characterId === characterId)
      .map(item => ({ name: item.name, quantity: item.quantity || 1 }));

    clearedItems = removedItems.length;
    if (removedItems.length) {
      app.handleGameUpdate({ removedItems });
    }
  }

  if (opts.quests && Array.isArray(app.quests) && app.setQuests) {
    clearedQuests = app.quests.filter(q => q.characterId === characterId).length;
    app.setQuests(app.quests.filter(q => q.characterId !== characterId));
  }

  if (opts.journal && Array.isArray(app.journalEntries) && app.setJournalEntries) {
    clearedJournal = app.journalEntries.filter(e => e.characterId === characterId).length;
    app.setJournalEntries(app.journalEntries.filter(e => e.characterId !== characterId));
  }

  if (opts.story && Array.isArray(app.storyChapters) && app.setStoryChapters) {
    clearedStory = app.storyChapters.filter(s => s.characterId === characterId).length;
    app.setStoryChapters(app.storyChapters.filter(s => s.characterId !== characterId));
  }

  const summary = {
    clearedItems,
    clearedQuests,
    clearedJournal,
    clearedStory,
    characterId
  };

  console.log('Cleared demo data:', summary);
  console.log('Note: Items are removed with persistence; quests/journal/story are cleared for this session.');
  return summary;
};

// SFX Test Modal - interactive list with per-effect and per-file Play buttons
window.demo.sfxTest = function(opts = { auto: true, delay: 500, waitForEnd: true, maxWaitMs: 2500 }) {
  if (!window.audioService) {
    console.error('Audio service not available as window.audioService');
    return null;
  }
  const conf = Object.assign({ auto: true, delay: 500, waitForEnd: true, maxWaitMs: 2500 }, opts || {});

  // Build overlay (cleaner styling)
  const overlay = document.createElement('div');
  overlay.id = 'demo-sfx-test-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', left: '0', top: '0', right: '0', bottom: '0', background: 'rgba(0,0,0,0.55)', zIndex: 99999, padding: '32px', overflow: 'auto'
  });

  const modal = document.createElement('div');
  Object.assign(modal.style, {
    background: 'var(--skyrim-paper, #1a1a1a)',
    color: 'var(--skyrim-text, #d1d1d1)',
    border: '1px solid var(--skyrim-border, #4a4a4a)',
    borderRadius: '10px',
    padding: '18px',
    maxWidth: '980px',
    margin: '0 auto',
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    fontFamily: 'sans-serif'
  });

  const header = document.createElement('div');
  header.style.display = 'flex'; header.style.justifyContent = 'space-between'; header.style.alignItems = 'center';
  const title = document.createElement('h3'); title.innerText = 'SFX Test — Interactive'; title.style.margin = '0'; title.style.paddingRight = '8px'; header.appendChild(title);

  const controls = document.createElement('div');
  controls.style.display = 'flex'; controls.style.alignItems = 'center'; controls.style.gap = '8px';

  const searchInput = document.createElement('input'); searchInput.type = 'search'; searchInput.placeholder = 'Filter effects...'; searchInput.style.padding = '6px'; searchInput.style.minWidth = '220px';

  const waitChk = document.createElement('input'); waitChk.type = 'checkbox'; waitChk.checked = !!conf.waitForEnd;
  const waitLabel = document.createElement('label'); waitLabel.style.fontSize = '12px'; waitLabel.style.marginLeft = '6px'; waitLabel.appendChild(waitChk); waitLabel.appendChild(document.createTextNode(' Wait for end'));

  const delayInput = document.createElement('input'); delayInput.type = 'number'; delayInput.value = String(conf.delay); delayInput.style.width = '72px'; delayInput.title = 'Delay after each file (ms)';
  const maxWaitInput = document.createElement('input'); maxWaitInput.type = 'number'; maxWaitInput.value = String(conf.maxWaitMs); maxWaitInput.style.width = '88px'; maxWaitInput.title = 'Max wait for playback (ms)';

  const closeBtn = document.createElement('button'); closeBtn.innerText = 'Close'; closeBtn.style.marginLeft = '12px'; closeBtn.style.padding = '6px 10px'; closeBtn.style.border = '1px solid var(--skyrim-border, #4a4a4a)'; closeBtn.style.background = 'transparent'; closeBtn.style.color = 'var(--skyrim-text, #d1d1d1)'; closeBtn.style.borderRadius = '6px'; closeBtn.style.cursor = 'pointer'; closeBtn.onmouseenter = () => closeBtn.style.background = 'rgba(255,255,255,0.02)'; closeBtn.onmouseleave = () => closeBtn.style.background = 'transparent';

  controls.appendChild(searchInput);
  controls.appendChild(waitLabel);
  controls.appendChild(document.createTextNode(' Delay:')); controls.appendChild(delayInput);
  controls.appendChild(document.createTextNode(' Max wait:')); controls.appendChild(maxWaitInput);
  controls.appendChild(closeBtn);

  header.appendChild(controls);

  const list = document.createElement('div'); list.style.maxHeight = '64vh'; list.style.overflow = 'auto'; list.style.marginTop = '12px'; list.style.borderTop = '1px solid var(--skyrim-border, #4a4a4a)';

  modal.appendChild(header);
  modal.appendChild(list);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  let cancelled = false;

  closeBtn.onclick = () => {
    cancelled = true;
    try { document.body.removeChild(overlay); } catch (e) { /* ignore */ }
  };

  const buildList = async () => {
    const effects = window.audioService.getAllRegisteredSoundEffects();

    // Clear
    list.innerHTML = '';

    for (const effect of effects) {
      if (cancelled) break;

      const effectRow = document.createElement('div');
      effectRow.style.borderTop = '1px solid var(--skyrim-border, #4a4a4a)'; effectRow.style.padding = '10px 0';
      effectRow.style.display = 'flex'; effectRow.style.flexDirection = 'column';

      const head = document.createElement('div'); head.style.display = 'flex'; head.style.alignItems = 'center';
      const name = document.createElement('strong'); name.innerText = effect; name.style.flex = '1'; name.style.fontSize = '14px'; head.appendChild(name);

      const playEffectBtn = document.createElement('button'); playEffectBtn.innerText = 'Play effect'; playEffectBtn.style.marginRight = '8px'; playEffectBtn.style.padding = '6px 10px'; playEffectBtn.style.border = '1px solid var(--skyrim-border, #4a4a4a)'; playEffectBtn.style.background = 'var(--skyrim-gold, #c0a062)'; playEffectBtn.style.color = 'var(--skyrim-dark, #0f0f0f)'; playEffectBtn.style.borderRadius = '6px'; playEffectBtn.style.cursor = 'pointer';
      const playAllBtn = document.createElement('button'); playAllBtn.innerText = 'Play all variants'; playAllBtn.style.marginRight = '8px'; playAllBtn.style.padding = '6px 10px'; playAllBtn.style.border = '1px solid var(--skyrim-border, #4a4a4a)'; playAllBtn.style.background = 'transparent'; playAllBtn.style.color = 'var(--skyrim-text, #d1d1d1)'; playAllBtn.style.borderRadius = '6px'; playAllBtn.style.cursor = 'pointer'; playAllBtn.onmouseenter = () => playAllBtn.style.background = 'rgba(255,255,255,0.02)'; playAllBtn.onmouseleave = () => playAllBtn.style.background = 'transparent';

      head.appendChild(playAllBtn); head.appendChild(playEffectBtn);
      effectRow.appendChild(head);

      const sub = document.createElement('div'); sub.style.marginTop = '8px'; sub.style.paddingLeft = '8px';
      const ul = document.createElement('ul'); ul.style.margin = '0'; ul.style.paddingLeft = '18px'; sub.appendChild(ul);
      effectRow.appendChild(sub);

      list.appendChild(effectRow);

      // Get registered paths
      const paths = window.audioService.getRegisteredSoundEffectPaths(effect) || [];
      if (!paths.length) {
        const li = document.createElement('li'); li.innerText = 'No registered paths'; li.style.color = 'var(--skyrim-text-muted, #9aa7b2)'; ul.appendChild(li);
        continue;
      }

      // For each path, create list entry with Play button and status
      for (const path of paths) {
        const li = document.createElement('li'); li.style.display = 'flex'; li.style.alignItems = 'center'; li.style.gap = '8px';
        const text = document.createElement('span'); text.innerText = path; text.style.flex = '1'; text.style.wordBreak = 'break-all'; li.appendChild(text);

        const status = document.createElement('span'); status.innerText = '…'; status.style.width = '90px'; status.style.fontSize = '12px'; status.style.color = 'var(--skyrim-text-muted, #8b8b8b)'; li.appendChild(status);

        const playBtn = document.createElement('button'); playBtn.innerText = 'Play'; playBtn.style.padding = '4px 8px'; playBtn.style.border = '1px solid var(--skyrim-border, #4a4a4a)'; playBtn.style.background = 'transparent'; playBtn.style.color = 'var(--skyrim-text, #d1d1d1)'; playBtn.style.borderRadius = '6px'; playBtn.style.cursor = 'pointer'; li.appendChild(playBtn);

        // Quick HEAD check to detect missing files (same-origin)
        (async () => {
          try {
            const headResp = await fetch(path, { method: 'HEAD' });
            if (!headResp.ok) {
              status.innerText = `Not found (${headResp.status})`;
              status.style.color = '#b36d00';
              playBtn.disabled = true;
              return;
            }
            status.innerText = 'ready'; status.style.color = 'var(--skyrim-accent, #1f6feb)';
          } catch (e) {
            // HEAD may fail due to CORS; keep ready state but allow play
            status.innerText = 'unknown'; status.style.color = 'var(--skyrim-text-muted, #8b8b8b)';
          }
        })();

        // Play handler
        playBtn.onclick = async () => {
          try {
            playBtn.disabled = true; status.innerText = 'playing'; status.style.color = 'var(--skyrim-accent, #1a7f37)';
            const waitParam = waitChk.checked ? Math.max(200, Number(maxWaitInput.value) || 2500) : false;
            const res = await window.audioService.playSoundEffectPath(path, waitParam);
            if (res.status === 'played') { status.innerText = 'OK'; status.style.color = 'var(--skyrim-accent, #1a7f37)'; }
            else if (res.status === 'unavailable') { status.innerText = 'unavailable'; status.style.color = '#b36d00'; }
            else { status.innerText = 'error'; status.style.color = '#b32626'; }
          } catch (e) {
            status.innerText = 'error'; status.style.color = '#b32626';
          } finally { playBtn.disabled = false; }
        };

        ul.appendChild(li);
      }

      // Play all variants sequentially
      playAllBtn.onclick = async () => {
        playAllBtn.disabled = true; playEffectBtn.disabled = true;
        const liveDelay = Math.max(0, Number(delayInput.value) || 0);
        const liveMaxWait = Math.max(200, Number(maxWaitInput.value) || 2500);
        for (const path of paths) {
          const waitParam = waitChk.checked ? liveMaxWait : false;
          // find the li node to show status
          const pathLi = Array.from(list.querySelectorAll('li')).find(l => l.firstChild && l.firstChild.textContent === path);
          const status = pathLi ? pathLi.querySelector('span:nth-child(2)') : null;
          if (status) { status.textContent = 'playing'; status.style.color = 'var(--skyrim-accent, #1a7f37)'; }
          try {
            const res = await window.audioService.playSoundEffectPath(path, waitParam);
            if (status) {
              if (res.status === 'played') { status.textContent = 'OK'; status.style.color = 'var(--skyrim-accent, #1a7f37)'; }
              else if (res.status === 'unavailable') { status.textContent = 'unavailable'; status.style.color = '#b36d00'; }
              else { status.textContent = 'error'; status.style.color = '#b32626'; }
            }
          } catch (e) {
            if (status) { status.textContent = 'error'; status.style.color = '#b32626'; }
          }
          await new Promise(r => setTimeout(r, liveDelay));
        }
        playAllBtn.disabled = false; playEffectBtn.disabled = false;
      };

      // Play logical effect (may map to multiple files) for quick audition
      playEffectBtn.onclick = async () => {
        playEffectBtn.disabled = true; playAllBtn.disabled = true; const badge = document.createElement('span'); badge.innerText = 'playing'; badge.style.marginLeft = '8px'; badge.style.color = 'var(--skyrim-accent, #1a7f37)'; head.appendChild(badge);
        try {
          window.audioService.playSoundEffect(effect);
          await new Promise(r => setTimeout(r, 350)); // short visual debounce
        } finally { badge.remove(); playEffectBtn.disabled = false; playAllBtn.disabled = false; }
      };

      // Filter support
      searchInput.addEventListener('input', () => {
        const q = (searchInput.value || '').toLowerCase();
        const show = !q || effect.toLowerCase().includes(q);
        effectRow.style.display = show ? '' : 'none';
      });
    }
  };

  // Initial build
  buildList();

  return { overlay, buildList };
};

/**
 * Show detailed help for combat simulation
 */
window.demo.simulateCombatHelp = function() {
  const helpText = [
    '╔══════════════════════════════════════════════════════════════════╗',
    '║              COMBAT SIMULATION - DETAILED GUIDE                  ║',
    '╚══════════════════════════════════════════════════════════════════╝',
    '',
    '┌─────────────────────────────────────────────────────────────────┐',
    '│ BASIC USAGE                                                     │',
    '└─────────────────────────────────────────────────────────────────┘',
    '',
    '  // Start combat with a random default enemy:',
    '  demo.simulateCombat()',
    '',
    '┌─────────────────────────────────────────────────────────────────┐',
    '│ OPTIONS OBJECT                                                  │',
    '└─────────────────────────────────────────────────────────────────┘',
    '',
    '  demo.simulateCombat({',
    '    enemies: [...],        // Array of enemy seed objects',
    "    location: 'string',    // Combat location name",
    '    ambush: true/false,    // Force ambush state',
    '    fleeAllowed: true,     // Allow fleeing (default: true)',
    '    surrenderAllowed: false// Allow surrender (default: false)',
    '  })',
    '',
    '┌─────────────────────────────────────────────────────────────────┐',
    '│ ENEMY SEED OBJECT STRUCTURE                                     │',
    '└─────────────────────────────────────────────────────────────────┘',
    '',
    '  {',
    "    name: 'Enemy Name',           // Display name",
    "    type: 'humanoid',             // humanoid, undead, beast, daedra",
    '    healthMultiplier: 1.0,        // Multiplier vs player health',
    '    damageMultiplier: 1.0,        // Multiplier vs player damage',
    '    armor: 20,                    // Base armor value',
    '    isBoss: false,                // Boss flag (purple badge)',
    "    behavior: 'aggressive',       // aggressive, defensive, berserker",
    "    weaknesses: ['fire'],         // Damage type weaknesses",
    "    resistances: ['frost'],       // Damage type resistances",
    "    description: 'string',        // Enemy description",
    '    loot: [{                      // Potential drops',
    "      name: 'Item Name',",
    "      type: 'weapon',             // weapon, apparel, misc, potion",
    "      description: 'desc',",
    '      quantity: 1,',
    '      dropChance: 50              // % chance to drop (0-100)',
    '    }]',
    '  }',
    '',
    '┌─────────────────────────────────────────────────────────────────┐',
    '│ EXAMPLES                                                        │',
    '└─────────────────────────────────────────────────────────────────┘',
    '',
    '  // Single tough enemy:',
    '  demo.simulateCombat({',
    '    enemies: [{',
    "      name: 'Frost Troll',",
    "      type: 'beast',",
    '      healthMultiplier: 1.8,',
    '      damageMultiplier: 1.3,',
    '      armor: 25,',
    "      weaknesses: ['fire'],",
    "      resistances: ['frost'],",
    "      behavior: 'berserker'",
    '    }]',
    '  })',
    '',
    '  // Boss fight with minions:',
    '  demo.simulateCombat({',
    '    enemies: [',
    '      {',
    "        name: 'Draugr Deathlord',",
    "        type: 'undead',",
    '        healthMultiplier: 2.0,',
    '        damageMultiplier: 1.5,',
    '        armor: 40,',
    '        isBoss: true,',
    "        weaknesses: ['fire'],",
    "        resistances: ['frost', 'poison'],",
    "        behavior: 'aggressive',",
    '        loot: [{',
    "          name: 'Ebony Battleaxe',",
    "          type: 'weapon',",
    "          description: 'Ancient and deadly',",
    '          quantity: 1,',
    '          dropChance: 80',
    '        }]',
    '      },',
    '      {',
    "        name: 'Draugr Wight',",
    "        type: 'undead',",
    '        healthMultiplier: 0.7,',
    '        damageMultiplier: 0.6,',
    '        armor: 15',
    '      },',
    '      {',
    "        name: 'Draugr Wight',",
    "        type: 'undead',",
    '        healthMultiplier: 0.7,',
    '        damageMultiplier: 0.6,',
    '        armor: 15',
    '      }',
    '    ],',
    "    location: 'Bleak Falls Barrow - Inner Sanctum'",
    '  })',
    '',
    '  // Bandit ambush scenario:',
    '  demo.simulateCombat({',
    '    enemies: [',
    "      { name: 'Bandit Chief', type: 'humanoid', healthMultiplier: 1.3, damageMultiplier: 1.1, armor: 30, isBoss: true },",
    "      { name: 'Bandit Marauder', type: 'humanoid', healthMultiplier: 0.9, damageMultiplier: 0.8, armor: 20 },",
    "      { name: 'Bandit Thug', type: 'humanoid', healthMultiplier: 0.7, damageMultiplier: 0.6, armor: 15 }",
    '    ],',
    "    location: 'Road to Whiterun',",
    '    ambush: true,',
    '    surrenderAllowed: true',
    '  })',
    '',
    '───────────────────────────────────────────────────────────────────'
  ].join('\n');
  console.log(helpText);
  return helpText;
};

// ============================================================================
// MODAL TESTING (Admin)
// ============================================================================

/**
 * Open dungeon modal for testing
 */
window.demo.openDungeonModal = function(dungeonId = 'bleak_falls_barrow') {
  if (!_isAdmin()) { console.error('Admin only'); return 'Admin only'; }
  const app = window.app;
  if (!app || !app.setActiveDungeonId) {
    console.error('App context not available');
    return 'App context not available';
  }
  
  // Available dungeon IDs: bleak_falls_barrow, bandit_hideout, labyrinthian, blackreach, vampire_lair, frost_spider_den
  app.setActiveDungeonId(dungeonId);
  const msg = `Opened dungeon modal: ${dungeonId}`;
  console.log(msg);
  return msg;
};

/**
 * Open combat modal for testing
 */
window.demo.openCombatModal = function(options = {}) {
  // This is essentially the same as simulateCombat
  return window.demo.simulateCombat(options);
};

/**
 * Open shop modal for testing
 */
window.demo.openShopModal = function() {
  if (!_isAdmin()) { console.error('Admin only'); return 'Admin only'; }
  const app = window.app;
  if (!app || !app.setShowShop) {
    console.error('App context not available or setShowShop not found');
    return 'App context not available';
  }
  app.setShowShop(true);
  const msg = 'Opened shop modal';
  console.log(msg);
  return msg;
};

/**
 * Open level up modal for testing
 */
window.demo.openLevelUpModal = function() {
  if (!_isAdmin()) { console.error('Admin only'); return 'Admin only'; }
  const app = window.app;
  if (!app || !app.setShowLevelUp) {
    console.error('App context not available or setShowLevelUp not found');
    return 'App context not available';
  }
  app.setShowLevelUp(true);
  const msg = 'Opened level up modal';
  console.log(msg);
  return msg;
};

/**
 * Open perk tree modal for testing
 */
window.demo.openPerkTreeModal = function() {
  if (!_isAdmin()) { console.error('Admin only'); return 'Admin only'; }
  const app = window.app;
  if (!app || !app.setShowPerkTree) {
    console.error('App context not available or setShowPerkTree not found');
    return 'App context not available';
  }
  app.setShowPerkTree(true);
  const msg = 'Opened perk tree modal';
  console.log(msg);
  return msg;
};

/**
 * Open companions modal for testing
 */
window.demo.openCompanionsModal = function() {
  if (!_isAdmin()) { console.error('Admin only'); return 'Admin only'; }
  const app = window.app;
  if (!app || !app.setShowCompanions) {
    console.error('App context not available or setShowCompanions not found');
    return 'App context not available';
  }
  app.setShowCompanions(true);
  const msg = 'Opened companions modal';
  console.log(msg);
  return msg;
};

/**
 * Open achievements modal for testing
 */
window.demo.openAchievementsModal = function() {
  if (!_isAdmin()) { console.error('Admin only'); return 'Admin only'; }
  const app = window.app;
  if (!app || !app.setShowAchievements) {
    console.error('App context not available or setShowAchievements not found');
    return 'App context not available';
  }
  app.setShowAchievements(true);
  const msg = 'Opened achievements modal';
  console.log(msg);
  return msg;
};

/**
 * Open character sheet for testing
 */
window.demo.openCharacterSheet = function() {
  if (!_isAdmin()) { console.error('Admin only'); return 'Admin only'; }
  const app = window.app;
  if (!app || !app.setShowCharacterSheet) {
    console.error('App context not available or setShowCharacterSheet not found');
    return 'App context not available';
  }
  app.setShowCharacterSheet(true);
  const msg = 'Opened character sheet';
  console.log(msg);
  return msg;
};

/**
 * Open inventory for testing
 */
window.demo.openInventory = function() {
  if (!_isAdmin()) { console.error('Admin only'); return 'Admin only'; }
  const app = window.app;
  if (!app || !app.setShowInventory) {
    console.error('App context not available or setShowInventory not found');
    return 'App context not available';
  }
  app.setShowInventory(true);
  const msg = 'Opened inventory';
  console.log(msg);
  return msg;
};

/**
 * Open journal for testing
 */
window.demo.openJournal = function() {
  if (!_isAdmin()) { console.error('Admin only'); return 'Admin only'; }
  const app = window.app;
  if (!app || !app.setShowJournal) {
    console.error('App context not available or setShowJournal not found');
    return 'App context not available';
  }
  app.setShowJournal(true);
  const msg = 'Opened journal';
  console.log(msg);
  return msg;
};

/**
 * Open spells modal for testing
 */
window.demo.openSpellsModal = function() {
  if (!_isAdmin()) { console.error('Admin only'); return 'Admin only'; }
  const app = window.app;
  if (!app || !app.setShowSpells) {
    console.error('App context not available or setShowSpells not found');
    return 'App context not available';
  }
  app.setShowSpells(true);
  const msg = 'Opened spells modal';
  console.log(msg);
  return msg;
};

/**
 * Open rest modal for testing
 */
window.demo.openRestModal = function() {
  if (!_isAdmin()) { console.error('Admin only'); return 'Admin only'; }
  const app = window.app;
  if (!app || !app.setShowRest) {
    console.error('App context not available or setShowRest not found');
    return 'App context not available';
  }
  app.setShowRest(true);
  const msg = 'Opened rest modal';
  console.log(msg);
  return msg;
};

/**
 * Test all modals sequentially
 */
window.demo.testAllModals = function(delayMs = 2000) {
  if (!_isAdmin()) { console.error('Admin only'); return 'Admin only'; }
  
  const modals = [
    { name: 'CharacterSheet', fn: () => window.demo.openCharacterSheet() },
    { name: 'Inventory', fn: () => window.demo.openInventory() },
    { name: 'Journal', fn: () => window.demo.openJournal() },
    { name: 'Spells', fn: () => window.demo.openSpellsModal() },
    { name: 'PerkTree', fn: () => window.demo.openPerkTreeModal() },
    { name: 'Companions', fn: () => window.demo.openCompanionsModal() },
    { name: 'Achievements', fn: () => window.demo.openAchievementsModal() },
    { name: 'Shop', fn: () => window.demo.openShopModal() },
    { name: 'LevelUp', fn: () => window.demo.openLevelUpModal() },
    { name: 'Rest', fn: () => window.demo.openRestModal() },
    { name: 'Dungeon', fn: () => window.demo.openDungeonModal() }
  ];
  
  console.log(`Testing ${modals.length} modals with ${delayMs}ms delay between each...`);
  console.log('Press ESC or close each modal to continue.');
  
  let idx = 0;
  const testNext = () => {
    if (idx >= modals.length) {
      console.log('Modal test complete!');
      return;
    }
    const modal = modals[idx];
    console.log(`Testing modal ${idx + 1}/${modals.length}: ${modal.name}`);
    modal.fn();
    idx++;
    setTimeout(testNext, delayMs);
  };
  
  testNext();
  return 'Modal test started. Check console for progress.';
};

/**
 * Show help
 */
window.demo.help = function() {
  const helpText = [
    '╔══════════════════════════════════════════════════════════════════╗',
    '║         SKYRIM AETHERIUS - CONSOLE DEMO COMMANDS v0.5.6         ║',
    '╚══════════════════════════════════════════════════════════════════╝',
    '',
    '┌─────────────────────────────────────────────────────────────────┐',
    '│ CHARACTER MANAGEMENT                                            │',
    '└─────────────────────────────────────────────────────────────────┘',
    '  demo.createTestCharacter()     - Create a random test character',
    '  demo.addExperience(amount)     - Add XP (default: 100)',
    '  demo.levelUp()                 - Quick level up (+1000 XP)',
    '  demo.setLevel(lvl)             - Set exact level [ADMIN]',
    '  demo.addPerkPoints(n)          - Add n perk points',
    '  demo.setPerkPoints(n)          - Set exact perk points [ADMIN]',
    '  demo.forceUnlockPerk(perkId)   - Unlock perk (costs 3 pts) [ADMIN]',
    '  demo.grantMastery(perkId, n)   - Grant mastery tiers [ADMIN]',
    '',
    '┌─────────────────────────────────────────────────────────────────┐',
    '│ INVENTORY MANAGEMENT                                            │',
    '└─────────────────────────────────────────────────────────────────┘',
    '  demo.createTestItem(type)      - Create item (weapon/apparel/potion/food/misc)',
    '  demo.addRandomItems(count)     - Add random items (default: 5)',
    '  demo.addGold(amount)           - Shows command to add gold',
    '  demo.giveItem(name, type, qty) - Give specific item [ADMIN]',
    '  demo.migratePotions({dryRun})  - Fix potion subtypes',
    '',
    '┌─────────────────────────────────────────────────────────────────┐',
    '│ COMBAT TESTING                                                  │',
    '└─────────────────────────────────────────────────────────────────┘',
    '  demo.simulateCombat(options)   - Start combat simulation',
    '  demo.simulateCombatHelp()      - Detailed combat simulation guide',
    '  demo.testCombatItems()         - Test combat item usage',
    '',
    '┌─────────────────────────────────────────────────────────────────┐',
    '│ LOCKPICKING TESTING                                             │',
    '└─────────────────────────────────────────────────────────────────┘',
    '  demo.lockpick(difficulty)      - Trigger minigame',
    '  demo.lockpickHelp()            - Show difficulty guide',
    '  Difficulties: novice, apprentice, adept, expert, master',
    '',
    '┌─────────────────────────────────────────────────────────────────┐',
    '│ COMPANIONS                                                      │',
    '└─────────────────────────────────────────────────────────────────┘',
    '  demo.recruitCompanion({...})   - Recruit a companion [ADMIN]',
    '  demo.listCompanions()          - List all companions',
    '  demo.removeCompanion(id)       - Remove a companion [ADMIN]',
    '',
    '┌─────────────────────────────────────────────────────────────────┐',
    '│ JOURNAL & QUESTS                                                │',
    '└─────────────────────────────────────────────────────────────────┘',
    '  demo.createTestJournalEntry()  - Create test journal entry',
    '  demo.addRandomJournalEntries(n)- Add multiple entries',
    '  demo.createTestQuest()         - Create test quest',
    '  demo.addRandomQuests(n)        - Add multiple quests',
    '',
    '┌─────────────────────────────────────────────────────────────────┐',
    '│ MODAL TESTING [ADMIN]                                           │',
    '└─────────────────────────────────────────────────────────────────┘',
    '  demo.openDungeonModal(id)      - Open dungeon (bleak_falls_barrow, bandit_hideout, etc)',
    '  demo.openCombatModal()         - Open combat (same as simulateCombat)',
    '  demo.openShopModal()           - Open shop modal',
    '  demo.openLevelUpModal()        - Open level up modal',
    '  demo.openPerkTreeModal()       - Open perk tree modal',
    '  demo.openCompanionsModal()     - Open companions modal',
    '  demo.openAchievementsModal()   - Open achievements modal',
    '  demo.openCharacterSheet()      - Open character sheet',
    '  demo.openInventory()           - Open inventory',
    '  demo.openJournal()             - Open journal',
    '  demo.openSpellsModal()         - Open spells modal',
    '  demo.openRestModal()           - Open rest modal',
    '  demo.testAllModals(delayMs)    - Test all modals sequentially',
    '',
    '┌─────────────────────────────────────────────────────────────────┐',
    '│ UTILITIES                                                       │',
    '└─────────────────────────────────────────────────────────────────┘',
    '  demo.getAppState()             - Show current app state',
    '  demo.getRawState()             - Dump raw window.app [ADMIN]',
    '  demo.clearDemoData(opts)       - Clear items/quests/journal/story',
    '  demo.sfxTest(opts)             - Open SFX test modal; plays registered SFX & `_2` variants (opts: {auto:true, delay:500})',
    '  demo.help()                    - Show this help',
    '  demo.simulateCombatHelp()      - Show combat simulation details',
    '',
    '╔══════════════════════════════════════════════════════════════════╗',
    '║ QUICK EXAMPLES                                                   ║',
    '╚══════════════════════════════════════════════════════════════════╝',
    '',
    '  // Add 3 perk points:',
    '  demo.addPerkPoints(3)',
    '',
    '  // Create a basic combat encounter:',
    '  demo.simulateCombat()',
    '',
    '  // Create combat with multiple enemies:',
    '  demo.simulateCombat({ enemies: [{',
    "    name: 'Bandit Chief', type: 'humanoid',",
    '    healthMultiplier: 1.5, damageMultiplier: 1.2,',
    '    armor: 30, isBoss: true',
    '  }, {',
    "    name: 'Bandit Thug', type: 'humanoid',",
    '    healthMultiplier: 0.8, damageMultiplier: 0.6,',
    '    armor: 15',
    '  }]})',
    '',
    '  // Combat with custom location:',
    "  demo.simulateCombat({ location: 'Bleak Falls Barrow' })",
    '',
    '  // Test lockpicking:',
    "  demo.lockpick('master', 'Ancient Nordic Chest')",
    '',
    '  // Test dungeon modal:',
    "  demo.openDungeonModal('bleak_falls_barrow')",
    '',
    '  // Test all modals (auto-close with 3 second delay):',
    '  demo.testAllModals(3000)',
    '',
    '───────────────────────────────────────────────────────────────────',
    'Type demo.simulateCombatHelp() for detailed combat configuration.',
    '───────────────────────────────────────────────────────────────────'
  ].join('\n');
  console.log(helpText);
  return helpText;
};

// Initialize help on load
console.log('Skyrim Aetherius Demo Commands loaded! Type demo.help() for usage instructions.');