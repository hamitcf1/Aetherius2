import { 
  getDatabase, 
  ref, 
  set, 
  remove,
  onValue,
  off,
  Unsubscribe
} from 'firebase/database';
import { getApp, getApps } from 'firebase/app';

// Get database instance
const getDb = () => {
  const apps = getApps();
  if (apps.length === 0) {
    throw new Error('Firebase app not initialized');
  }
  return getDatabase(getApp());
};

// ===== USER PRESENCE =====

export const setUserOnline = async (uid: string): Promise<void> => {
  try {
    const db = getDb();
    const userRef = ref(db, `presence/${uid}`);
    
    await set(userRef, {
      online: true,
      lastSeen: Date.now(),
    });
  } catch (error) {
    console.warn('Failed to set user online:', error);
  }
};

export const setUserOffline = async (uid: string): Promise<void> => {
  try {
    const db = getDb();
    const userRef = ref(db, `presence/${uid}`);
    
    await set(userRef, {
      online: false,
      lastSeen: Date.now(),
    });
  } catch (error) {
    console.warn('Failed to set user offline:', error);
  }
};

export const subscribeToUserPresence = (uid: string, callback: (online: boolean) => void): Unsubscribe => {
  try {
    const db = getDb();
    const userRef = ref(db, `presence/${uid}`);
    
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      callback(data?.online ?? false);
    });
    
    return unsubscribe;
  } catch (error) {
    console.warn('Failed to subscribe to user presence:', error);
    return () => {};
  }
};

// ===== ACTIVE CHARACTER SESSION =====

export const setActiveCharacter = async (uid: string, characterId: string): Promise<void> => {
  try {
    const db = getDb();
    const activeRef = ref(db, `sessions/${uid}/activeCharacter`);
    
    await set(activeRef, {
      characterId,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('Failed to set active character:', error);
  }
};

export const clearActiveCharacter = async (uid: string): Promise<void> => {
  try {
    const db = getDb();
    const activeRef = ref(db, `sessions/${uid}/activeCharacter`);
    
    await remove(activeRef);
  } catch (error) {
    console.warn('Failed to clear active character:', error);
  }
};

export const subscribeToActiveCharacter = (uid: string, callback: (characterId: string | null) => void): Unsubscribe => {
  try {
    const db = getDb();
    const activeRef = ref(db, `sessions/${uid}/activeCharacter`);
    
    const unsubscribe = onValue(activeRef, (snapshot) => {
      const data = snapshot.val();
      callback(data?.characterId ?? null);
    });
    
    return unsubscribe;
  } catch (error) {
    console.warn('Failed to subscribe to active character:', error);
    return () => {};
  }
};

// ===== LIVE AI GENERATION STATE =====

export interface AIGenerationState {
  isGenerating: boolean;
  progress?: number; // 0-100
  type?: 'character' | 'story' | 'image';
  startedAt?: number;
}

export const setAIGenerationState = async (uid: string, state: AIGenerationState): Promise<void> => {
  try {
    const db = getDb();
    const stateRef = ref(db, `aiState/${uid}`);
    
    await set(stateRef, {
      ...state,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.warn('Failed to set AI generation state:', error);
  }
};

export const clearAIGenerationState = async (uid: string): Promise<void> => {
  try {
    const db = getDb();
    const stateRef = ref(db, `aiState/${uid}`);
    
    await remove(stateRef);
  } catch (error) {
    console.warn('Failed to clear AI generation state:', error);
  }
};

export const subscribeToAIGenerationState = (uid: string, callback: (state: AIGenerationState | null) => void): Unsubscribe => {
  try {
    const db = getDb();
    const stateRef = ref(db, `aiState/${uid}`);
    
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const data = snapshot.val();
      callback(data ? { isGenerating: data.isGenerating, progress: data.progress, type: data.type, startedAt: data.startedAt } : null);
    });
    
    return unsubscribe;
  } catch (error) {
    console.warn('Failed to subscribe to AI generation state:', error);
    return () => {};
  }
};
