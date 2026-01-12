import { initializeFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  getDocs,
  writeBatch,
  Query,
  DocumentData,
  CollectionReference,
  QueryConstraint
} from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { Character, CustomQuest, InventoryItem, JournalEntry, StoryChapter, UserProfile, GameStateUpdate } from '../types';

export interface AdventureMessage {
  id: string;
  role: 'player' | 'gm';
  content: string;
  timestamp: number;
  updates?: GameStateUpdate;
}

// Get app instance
const getFirebaseApp = () => {
  const apps = getApps();
  return apps.length > 0 ? getApp() : null;
};

// Initialize Firestore
let db: ReturnType<typeof initializeFirestore> | null = null;
let persistenceEnabled = false;

export const initializeFirestoreDb = async () => {
  if (db) return db; // Already initialized

  const app = getFirebaseApp();
  if (!app) {
    console.error('Firebase app not initialized');
    throw new Error('Firebase app not initialized');
  }

  try {
    db = initializeFirestore(app, {
      cacheSizeBytes: 40 * 1024 * 1024, // 40MB cache
    });

    // Enable offline persistence ONLY if not already enabled
    if (!persistenceEnabled) {
      try {
        await enableIndexedDbPersistence(db);
        persistenceEnabled = true;
        console.log('Firestore persistence enabled');
      } catch (err: any) {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence disabled');
        } else if (err.code === 'unimplemented') {
          console.warn('Browser does not support persistence');
        } else {
          console.warn('Could not enable persistence:', err.message);
        }
      }
    }

    console.log('Firestore initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize Firestore:', error);
    throw error;
  }
};

export const getDb = (): ReturnType<typeof initializeFirestore> => {
  if (!db) {
    throw new Error('Firestore not initialized. Call initializeFirestoreDb() first.');
  }
  return db;
};

// ===== CHARACTERS =====

export const saveCharacter = async (uid: string, character: Character): Promise<void> => {
  try {
    const db = getDb();
    const docRef = doc(db, 'users', uid, 'characters', character.id);
    await setDoc(docRef, {
      ...character,
      lastPlayed: Date.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving character:', error);
    throw error;
  }
};

export const loadCharacter = async (uid: string, characterId: string): Promise<Character | null> => {
  try {
    const db = getDb();
    const docRef = doc(db, 'users', uid, 'characters', characterId);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? (snapshot.data() as Character) : null;
  } catch (error) {
    console.error('Error loading character:', error);
    throw error;
  }
};

export const loadCharacters = async (uid: string): Promise<Character[]> => {
  try {
    const db = getDb();
    const collRef = collection(db, 'users', uid, 'characters') as CollectionReference<Character>;
    const q = query(collRef, orderBy('lastPlayed', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error loading characters:', error);
    throw error;
  }
};

export const deleteCharacter = async (uid: string, characterId: string): Promise<void> => {
  try {
    const db = getDb();
    
    // Delete the character document
    const characterDocRef = doc(db, 'users', uid, 'characters', characterId);
    await deleteDoc(characterDocRef);
    
    // Delete all related inventory items
    const itemsRef = collection(db, 'users', uid, 'items');
    const itemsQuery = query(itemsRef, where('characterId', '==', characterId));
    const itemsSnapshot = await getDocs(itemsQuery);
    const itemDeletePromises = itemsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Delete all related quests
    const questsRef = collection(db, 'users', uid, 'quests');
    const questsQuery = query(questsRef, where('characterId', '==', characterId));
    const questsSnapshot = await getDocs(questsQuery);
    const questDeletePromises = questsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Delete all related journal entries
    const journalRef = collection(db, 'users', uid, 'journalEntries');
    const journalQuery = query(journalRef, where('characterId', '==', characterId));
    const journalSnapshot = await getDocs(journalQuery);
    const journalDeletePromises = journalSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Delete all related story chapters
    const storyRef = collection(db, 'users', uid, 'storyChapters');
    const storyQuery = query(storyRef, where('characterId', '==', characterId));
    const storySnapshot = await getDocs(storyQuery);
    const storyDeletePromises = storySnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Wait for all deletions to complete
    await Promise.all([
      ...itemDeletePromises,
      ...questDeletePromises,
      ...journalDeletePromises,
      ...storyDeletePromises
    ]);
  } catch (error) {
    console.error('Error deleting character and related data:', error);
    throw error;
  }
};

// ===== INVENTORY ITEMS =====

export const saveInventoryItem = async (uid: string, item: InventoryItem): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, 'users', uid, 'items', item.id);
  // Remove any undefined fields before saving to avoid Firestore errors
  const itemData: any = { ...item };
  Object.keys(itemData).forEach(key => {
    if (itemData[key] === undefined) delete itemData[key];
  });

  await setDoc(docRef, itemData, { merge: true });
};

export const loadInventoryItems = async (uid: string, characterId?: string): Promise<InventoryItem[]> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const collRef = collection(db, 'users', uid, 'items') as CollectionReference<InventoryItem>;
  const constraints: QueryConstraint[] = [];
  
  if (characterId) {
    constraints.push(where('characterId', '==', characterId));
  }
  
  const q = query(collRef, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const deleteInventoryItem = async (uid: string, itemId: string): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, 'users', uid, 'items', itemId);
  await deleteDoc(docRef);
};

// ===== QUESTS =====

export const saveQuest = async (uid: string, quest: CustomQuest): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  // Remove undefined fields before saving
  const questData = {
    ...quest,
    dueDate: quest.dueDate && quest.dueDate.trim() ? quest.dueDate : undefined,
  };

  // Remove undefined properties to avoid Firestore errors
  Object.keys(questData).forEach(key => {
    if (questData[key as keyof typeof questData] === undefined) {
      delete questData[key as keyof typeof questData];
    }
  });

  const docRef = doc(db, 'users', uid, 'quests', quest.id);
  await setDoc(docRef, questData, { merge: true });
};

export const loadQuests = async (uid: string, characterId?: string): Promise<CustomQuest[]> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const collRef = collection(db, 'users', uid, 'quests') as CollectionReference<CustomQuest>;
  const constraints: QueryConstraint[] = [];
  
  if (characterId) {
    constraints.push(where('characterId', '==', characterId));
  }
  
  const q = query(collRef, ...constraints, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const loadActiveQuests = async (uid: string, characterId: string): Promise<CustomQuest[]> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const collRef = collection(db, 'users', uid, 'quests') as CollectionReference<CustomQuest>;
  const q = query(
    collRef,
    where('characterId', '==', characterId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const deleteQuest = async (uid: string, questId: string): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, 'users', uid, 'quests', questId);
  await deleteDoc(docRef);
};

// ===== JOURNAL ENTRIES =====

export const saveJournalEntry = async (uid: string, entry: JournalEntry): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, 'users', uid, 'journalEntries', entry.id);
  await setDoc(docRef, entry, { merge: true });
};

export const loadJournalEntries = async (uid: string, characterId?: string): Promise<JournalEntry[]> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const collRef = collection(db, 'users', uid, 'journalEntries') as CollectionReference<JournalEntry>;
  const constraints: QueryConstraint[] = [];
  
  if (characterId) {
    constraints.push(where('characterId', '==', characterId));
  }
  
  const q = query(collRef, ...constraints, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const deleteJournalEntry = async (uid: string, entryId: string): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, 'users', uid, 'journalEntries', entryId);
  await deleteDoc(docRef);
};

// ===== STORY CHAPTERS =====

export const saveStoryChapter = async (uid: string, chapter: StoryChapter): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, 'users', uid, 'storyChapters', chapter.id);
  await setDoc(docRef, chapter, { merge: true });
};

export const loadStoryChapters = async (uid: string, characterId?: string): Promise<StoryChapter[]> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const collRef = collection(db, 'users', uid, 'storyChapters') as CollectionReference<StoryChapter>;
  const constraints: QueryConstraint[] = [];
  
  if (characterId) {
    constraints.push(where('characterId', '==', characterId));
  }
  
  const q = query(collRef, ...constraints, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const loadRecentStory = async (uid: string, characterId: string, limit: number = 3): Promise<StoryChapter[]> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const collRef = collection(db, 'users', uid, 'storyChapters') as CollectionReference<StoryChapter>;
  const q = query(
    collRef,
    where('characterId', '==', characterId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.slice(0, limit).map(doc => doc.data());
};

export const deleteStoryChapter = async (uid: string, chapterId: string): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, 'users', uid, 'storyChapters', chapterId);
  await deleteDoc(docRef);
};

// ===== USER PROFILES =====

export const saveUserProfile = async (uid: string, profile: UserProfile): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, 'users', uid, 'profiles', profile.id);
  await setDoc(docRef, profile, { merge: true });
};

export const loadUserProfiles = async (uid: string): Promise<UserProfile[]> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const collRef = collection(db, 'users', uid, 'profiles') as CollectionReference<UserProfile>;
  const q = query(collRef, orderBy('created', 'desc'));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const deleteUserProfile = async (uid: string, profileId: string): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, 'users', uid, 'profiles', profileId);
  await deleteDoc(docRef);
};

// ===== USER SETTINGS =====

export interface UserSettings {
  onboardingCompleted?: boolean;
  onboardingVersion?: number;
  createdAt?: number;
  updatedAt?: number;
}

const userSettingsDocRef = (uid: string) => {
  const db = getDb();
  return doc(db, 'users', uid, 'meta', 'app');
};

export const loadUserSettings = async (uid: string): Promise<UserSettings | null> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const snapshot = await getDoc(userSettingsDocRef(uid));
  return snapshot.exists() ? (snapshot.data() as UserSettings) : null;
};

export const saveUserSettings = async (uid: string, settings: UserSettings): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const now = Date.now();
  const next: UserSettings = {
    onboardingVersion: settings.onboardingVersion ?? 1,
    onboardingCompleted: settings.onboardingCompleted ?? false,
    createdAt: settings.createdAt ?? now,
    updatedAt: now,
  };

  await setDoc(userSettingsDocRef(uid), next, { merge: true });
};

// ===== USER METADATA (for easier tracking in database) =====

export interface UserMetadata {
  uid: string;
  email: string;
  username?: string;
  createdAt: number;
  lastLogin: number;
}

export const saveUserMetadata = async (userData: UserMetadata): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  // Save metadata directly in the user document (not in a subcollection)
  // This makes email/username visible in Firebase console under users/{uid}
  const docRef = doc(db, 'users', userData.uid);
  const payload: Record<string, unknown> = {
    email: userData.email,
    username: userData.username,
    createdAt: userData.createdAt,
    lastLogin: userData.lastLogin
  };
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });
  await setDoc(docRef, payload, { merge: true });
};

// ===== BATCH OPERATIONS =====

export const batchSaveGameState = async (
  uid: string,
  characters: Character[],
  items: InventoryItem[],
  quests: CustomQuest[],
  journalEntries: JournalEntry[],
  storyChapters: StoryChapter[],
  profiles: UserProfile[]
): Promise<void> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');

  const batch = writeBatch(db);

  // Helper to remove undefined fields
  function removeUndefined(obj: any) {
    if (!obj || typeof obj !== 'object') return obj;
    const clean: any = Array.isArray(obj) ? [] : {};
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== undefined) clean[k] = v;
    });
    return clean;
  }

  // Save characters
  characters.forEach(char => {
    const docRef = doc(db, 'users', uid, 'characters', char.id);
    batch.set(docRef, removeUndefined({ ...char, lastPlayed: Date.now() }), { merge: true });
  });

  // Save items
  items.forEach(item => {
    const docRef = doc(db, 'users', uid, 'items', item.id);
    batch.set(docRef, removeUndefined(item), { merge: true });
  });

  // Save quests
  quests.forEach(quest => {
    const docRef = doc(db, 'users', uid, 'quests', quest.id);
    batch.set(docRef, removeUndefined(quest), { merge: true });
  });

  // Save journal entries
  journalEntries.forEach(entry => {
    const docRef = doc(db, 'users', uid, 'journalEntries', entry.id);
    batch.set(docRef, removeUndefined(entry), { merge: true });
  });

  // Save story chapters
  storyChapters.forEach(chapter => {
    const docRef = doc(db, 'users', uid, 'storyChapters', chapter.id);
    batch.set(docRef, removeUndefined(chapter), { merge: true });
  });

  // Save profiles
  profiles.forEach(profile => {
    const docRef = doc(db, 'users', uid, 'profiles', profile.id);
    batch.set(docRef, removeUndefined(profile), { merge: true });
  });

  await batch.commit();
};

// ===== DEFENSIVE INITIALIZATION =====

export const ensureCharacterDefaults = (character: Character): Character => {
  return {
    lastPlayed: Date.now(),
    ...character,
  };
};

// ===== ADVENTURE CHAT (PER CHARACTER) =====

const removeUndefinedDeep = (value: any): any => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) {
    return value
      .map(v => removeUndefinedDeep(v))
      .filter(v => v !== undefined);
  }
  if (typeof value === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      const cleaned = removeUndefinedDeep(v);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return out;
  }
  return value;
};

export const saveAdventureMessage = async (
  uid: string,
  characterId: string,
  message: AdventureMessage
): Promise<void> => {
  const db = getDb();
  const docRef = doc(db, 'users', uid, 'characters', characterId, 'adventureMessages', message.id);
  await setDoc(docRef, removeUndefinedDeep(message), { merge: true });
};

export const loadAdventureMessages = async (
  uid: string,
  characterId: string
): Promise<AdventureMessage[]> => {
  const db = getDb();
  const collRef = collection(
    db,
    'users',
    uid,
    'characters',
    characterId,
    'adventureMessages'
  ) as CollectionReference<AdventureMessage>;

  const q = query(collRef, orderBy('timestamp', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data());
};

export const clearAdventureMessages = async (uid: string, characterId: string): Promise<void> => {
  const db = getDb();
  const collRef = collection(db, 'users', uid, 'characters', characterId, 'adventureMessages');
  const snapshot = await getDocs(collRef);
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
};

// ===== SIMULATION STATE (Persistent NPC/Scene/Fact Tracking) =====

export const saveSimulationState = async (
  uid: string,
  characterId: string,
  state: any
): Promise<void> => {
  const db = getDb();
  const docRef = doc(db, 'users', uid, 'characters', characterId, 'simulation', 'state');
  await setDoc(docRef, removeUndefinedDeep(state), { merge: false });
};

export const loadSimulationState = async (
  uid: string,
  characterId: string
): Promise<any | null> => {
  const db = getDb();
  const docRef = doc(db, 'users', uid, 'characters', characterId, 'simulation', 'state');
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
};

export const clearSimulationState = async (uid: string, characterId: string): Promise<void> => {
  const db = getDb();
  const docRef = doc(db, 'users', uid, 'characters', characterId, 'simulation', 'state');
  await deleteDoc(docRef);
};

// Utility: Remove duplicate items by name (keeps the first one found)
export const removeDuplicateItems = async (uid: string, characterId?: string): Promise<{ removed: string[]; kept: string[] }> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  
  const items = await loadInventoryItems(uid, characterId);
  const seen = new Map<string, InventoryItem>();
  const duplicates: InventoryItem[] = [];
  
  items.forEach(item => {
    const key = item.name.toLowerCase().trim();
    if (seen.has(key)) {
      duplicates.push(item);
    } else {
      seen.set(key, item);
    }
  });
  
  // Delete duplicates
  for (const dup of duplicates) {
    const docRef = doc(db, 'users', uid, 'items', dup.id);
    await deleteDoc(docRef);
  }
  
  return {
    removed: duplicates.map(d => `${d.name} (id: ${d.id})`),
    kept: Array.from(seen.values()).map(k => `${k.name} (id: ${k.id})`)
  };
};

// Utility: Delete a specific item by name (case-insensitive)
export const deleteItemByName = async (uid: string, itemName: string, characterId?: string): Promise<number> => {
  const db = getDb();
  if (!db) throw new Error('Firestore not initialized');
  
  const items = await loadInventoryItems(uid, characterId);
  const toDelete = items.filter(i => i.name.toLowerCase().trim() === itemName.toLowerCase().trim());
  
  for (const item of toDelete) {
    const docRef = doc(db, 'users', uid, 'items', item.id);
    await deleteDoc(docRef);
  }
  
  return toDelete.length;
};
